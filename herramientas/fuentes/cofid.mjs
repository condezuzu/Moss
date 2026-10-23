// CoFID 2021, la tabla del Reino Unido: «McCance and Widdowson's The Composition of Foods Integrated
// Dataset» (Public Health England, 2021, Open Government Licence v3.0): 2.887 alimentos. Lee su
// planilla oficial (hojas «1.3 Proximates» y «1.4 Inorganics») y devuelve cada alimento por 100 g,
// como los demás lectores de herramientas/fuentes.
// - Los carbohidratos de CoFID son los disponibles, sin la fibra y en equivalentes de monosacáridos
//   (el almidón pesa un 10 % más; la sacarosa y la lactosa, un 5 %). Para compararlos con USDA se
//   pasan a su peso, como dice la guía de CoFID, y se les suma la fibra AOAC (o la NSP si no está).
//   Sin ninguna de las dos, los totales no se saben (salvo en lo que casi no tiene carbohidratos).
// - Las bebidas alcohólicas (grupos Q) van por 100 ml y no por 100 g: quedan afuera.
// - Un alimento cuya referencia es solo USDA (CoFID copia algunos, sobre todo especias) queda
//   marcado con deUsda: no sirve para verificar USDA.
// - «N» es que no se sabe; «Tr», traza (cero); los valores entre paréntesis son estimados.
// Uso: node herramientas/fuentes/cofid.mjs <McCance_Widdowsons_..._2021.xlsx>

import { fileURLToPath } from 'node:url';
import { leerXlsx } from './xlsx.mjs';

export const COFID = {
  fuente: 'cofid',
  nombre: 'CoFID 2021 (Public Health England)',
  url: 'https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx',
  archivo: 'McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021.xlsx',
};

/** «12.3», «(1.2)» → número; «Tr» → 0; «N» o vacío → null. */
function valor(v) {
  if (typeof v === 'number') return v;
  const t = String(v ?? '').replace(/[()]/g, '').trim();
  if (t === 'Tr') return 0;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

/** La referencia principal es solo USDA (sin contar lo que se tomó de USDA para vitaminas o minerales). */
function soloUsda(referencia) {
  const partes = String(referencia ?? '').split(/;|\. (?=[A-Z])|, and /).map((p) => p.trim()).filter(Boolean)
    .filter((p) => !/vitamin|selenium|iodine|fatty acid/i.test(p) && !/^(Reviewed \d{4}|and)$/i.test(p));
  return partes.length > 0 && partes.every((p) => /USDA|Agriculture Handbook|Department of Agriculture|calculat/i.test(p))
    && partes.some((p) => /USDA|Agriculture Handbook|Department of Agriculture/i.test(p));
}

/** Los carbohidratos disponibles, de equivalentes de monosacáridos a su peso (guía de CoFID 2021, «Food labelling»). */
function disponiblesEnPeso(c) {
  if (c.CHO == null) return null;
  if (c.STAR == null || c.TOTSUG == null) return c.CHO / 1.05;
  const individuales = ['GLUC', 'GALACT', 'FRUCT', 'SUCR', 'MALT', 'LACT'].every((k) => c[k] != null);
  const azucares = individuales ? c.GLUC + c.GALACT + c.FRUCT + (c.SUCR + c.MALT + c.LACT) / 1.05 : c.TOTSUG / 1.05;
  const resto = Math.max(0, c.CHO - c.STAR - c.TOTSUG);
  return c.STAR / 1.1 + azucares + resto / 1.05;
}

/** Los alimentos de CoFID por 100 g. */
export function leerCofid(ruta) {
  const hojas = leerXlsx(ruta, ['1.3 Proximates', '1.4 Inorganics']);
  const leer = (hoja) => {
    const filas = hojas.get(hoja);
    // La segunda fila tiene los códigos de cada columna (WATER, PROT…); las de antes, solo nombres.
    const claves = Array.from(filas[1], (k, i) => k ?? i);
    return new Map(filas.slice(3).filter((f) => f[0]).map((f) => [String(f[0]).trim(), Object.fromEntries(claves.map((k, i) => [k, f[i]]))]));
  };
  const proximos = leer('1.3 Proximates');
  const inorganicos = leer('1.4 Inorganics');
  const alimentos = [];
  for (const [codigo, p] of proximos) {
    const grupo = String(p[3] ?? '').trim();
    if (grupo.startsWith('Q')) continue;
    const c = Object.fromEntries(['WATER', 'PROT', 'FAT', 'CHO', 'KCALS', 'STAR', 'TOTSUG', 'GLUC', 'GALACT', 'FRUCT', 'SUCR', 'MALT', 'LACT', 'ALCO', 'ENGFIB', 'AOACFIB'].map((k) => [k, valor(p[k])]));
    const disponibles = disponiblesEnPeso(c);
    const fibra = c.AOACFIB ?? c.ENGFIB;
    alimentos.push({
      fuente: 'cofid',
      codigo,
      descripcion: String(p[1]).trim(),
      ingles: String(p[1]).trim(),
      detalle: p[2] ? String(p[2]).trim() : null,
      grupo,
      kcal: c.KCALS,
      proteina: c.PROT,
      grasas: c.FAT,
      carbohidratos: c.CHO,
      carbohidratosSon: 'disponibles, en equivalentes de monosacáridos, sin la fibra',
      // Sin la fibra no hay totales, salvo que casi no tenga carbohidratos (una carne, un aceite).
      carbohidratosTotales: disponibles == null || (fibra == null && disponibles >= 1) ? null : disponibles + (fibra ?? 0),
      fibra,
      azucares: c.TOTSUG,
      sodio: valor(inorganicos.get(codigo)?.NA),
      agua: c.WATER,
      deUsda: soloUsda(p[5]),
    });
  }
  return alimentos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [ruta] = process.argv.slice(2);
  if (!ruta) {
    console.log('Uso: node herramientas/fuentes/cofid.mjs <McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021.xlsx>');
    process.exit(1);
  }
  const redondo = (n) => (n == null ? '-' : Math.round(n * 10) / 10);
  for (const a of leerCofid(ruta)) {
    console.log([`cofid:${a.codigo}`, a.descripcion, ...[a.kcal, a.proteina, a.carbohidratosTotales, a.grasas, a.fibra, a.sodio].map(redondo), a.deUsda ? 'de USDA' : ''].join(' | '));
  }
}
