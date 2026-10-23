// Ciqual 2025, la tabla de composición de Francia (Anses, 19/11/2025, licencia Etalab 2.0): 3.484
// alimentos, con su nombre en francés y en inglés. Lee los XML oficiales y devuelve cada alimento
// por 100 g, como los demás lectores de herramientas/fuentes.
// - Los «Glucides» de Ciqual son los disponibles (sin la fibra). Para compararlos con USDA, que los
//   da por diferencia, los totales se sacan igual que USDA: 100 − agua − proteína − grasas − cenizas
//   − alcohol. Si falta alguno, son los disponibles más la fibra y los ácidos orgánicos (sin la
//   fibra, no se saben).
// - Cada valor dice de qué fuente sale. Un alimento cuya agua, proteína, grasas y carbohidratos
//   salen de USDA o de cuentas de Ciqual, sin ningún análisis ni otra tabla (Ciqual copia así unos
//   400, casi siempre el agua y las grasas de USDA SR27), queda marcado con deUsda: no sirve para
//   verificar USDA.
// - «-» es que no se sabe; «traces», cero; «< 0,5», la mitad del límite.
// Uso: node herramientas/fuentes/ciqual.mjs <alim.xml> <compo.xml> <sources.xml> [alim_grp.xml]

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { desescapar } from './xlsx.mjs';

export const CIQUAL = {
  fuente: 'ciqual',
  nombre: 'Ciqual 2025 (Anses)',
  // Los archivos de recherche.data.gouv (doi:10.57745/RDMHWY), por su número.
  archivos: {
    alim: { archivo: 'alim_2025_11_03.xml', url: 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/666252' },
    compo: { archivo: 'compo_2025_11_03.xml', url: 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/666249' },
    sources: { archivo: 'sources_2025_11_03.xml', url: 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/666248' },
    grupos: { archivo: 'alim_grp_2025_11_03.xml', url: 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/666250' },
  },
};

// Los constituyentes, por su código de Ciqual.
const CONST = { 328: 'kcal', 400: 'agua', 25000: 'proteina', 31000: 'glucides', 40000: 'grasas', 32000: 'azucares', 34100: 'fibra', 10000: 'cenizas', 60000: 'alcohol', 65000: 'acidos', 10110: 'sodio' };

/** Los registros de un XML de Ciqual: cada <ETIQUETA>…</ETIQUETA>, con sus campos sin espacios. */
function registros(ruta, etiqueta) {
  const xml = readFileSync(ruta, 'utf8');
  return xml.split(`<${etiqueta}>`).slice(1).map((bloque) => Object.fromEntries(
    [...bloque.matchAll(/<(\w+)>([^<]*)<\/\1>/g)].map(([, campo, texto]) => [campo, desescapar(texto).trim()]),
  ));
}

/** «49,9» → 49.9; «traces» → 0; «< 0,5» → 0.25; «-» → null. */
function valor(texto) {
  if (texto == null) return null;
  const t = texto.replace(',', '.').trim();
  if (t === 'traces') return 0;
  const menor = t.match(/^<\s*([\d.]+)$/);
  if (menor) return Number(menor[1]) / 2;
  return /^[\d.]+$/.test(t) ? Number(t) : null;
}

const DE_USDA = /USDA|Department of Agriculture/i;
// Las cuentas de Ciqual: «Valeur ajustée/calculée/imputée Ciqual», «Calcul(s) Ciqual…» y «Ciqual (2007). Calcul de recettes».
const CUENTA = /^(Valeur ajustée|Calculs? Ciqual|Ciqual \(\d{4}\)\. Calcul)/;

/** 'usda' si la cita es de USDA (sola o con cuentas de Ciqual), 'cuenta' si es solo de cuentas, si no 'otra'. Ciqual junta varias con «.-». */
function origenDeCita(cita) {
  const partes = String(cita ?? '').split(/\.-|\)-/).map((p) => p.trim()).filter(Boolean);
  if (partes.every((p) => CUENTA.test(p))) return 'cuenta';
  return partes.every((p) => DE_USDA.test(p) || CUENTA.test(p)) ? 'usda' : 'otra';
}

/** Los alimentos de Ciqual por 100 g. */
export function leerCiqual(rutaAlim, rutaCompo, rutaFuentes, rutaGrupos = null) {
  // De dónde sale cada valor: 'usda', 'cuenta' (de Ciqual) u 'otra' (análisis, otras tablas, la industria).
  const origen = new Map(registros(rutaFuentes, 'SOURCES').map((s) => [s.source_code, origenDeCita(s.ref_citation)]));
  const grupos = new Map();
  if (rutaGrupos) for (const g of registros(rutaGrupos, 'ALIM_GRP')) grupos.set(g.alim_ssgrp_code, `${g.alim_grp_nom_fr} › ${g.alim_ssgrp_nom_fr}`);
  const valores = new Map();
  for (const c of registros(rutaCompo, 'COMPO')) {
    const clave = CONST[c.const_code];
    if (!clave) continue;
    const v = valores.get(c.alim_code) ?? { origenes: [] };
    v[clave] = valor(c.teneur);
    if (['agua', 'proteina', 'grasas', 'glucides'].includes(clave)) v.origenes.push(origen.get(c.source_code) ?? 'cuenta');
    valores.set(c.alim_code, v);
  }
  const alimentos = [];
  for (const a of registros(rutaAlim, 'ALIM')) {
    const v = valores.get(a.alim_code) ?? { origenes: [] };
    const conTodo = ['agua', 'proteina', 'grasas', 'cenizas'].every((k) => v[k] != null);
    const porDiferencia = conTodo ? Math.max(0, 100 - v.agua - v.proteina - v.grasas - v.cenizas - (v.alcohol ?? 0)) : null;
    // Sin la fibra no hay totales, salvo que casi no tenga carbohidratos (una carne, un aceite).
    const conFibra = v.fibra != null || (v.glucides != null && v.glucides < 1);
    const disponibles = v.glucides != null && conFibra ? v.glucides + (v.fibra ?? 0) + (v.acidos ?? 0) : null;
    alimentos.push({
      fuente: 'ciqual',
      codigo: a.alim_code,
      descripcion: a.alim_nom_fr,
      ingles: a.alim_nom_eng || null,
      grupo: grupos.get(a.alim_ssgrp_code) ?? a.alim_ssgrp_code,
      subgrupo: a.alim_ssgrp_code,
      kcal: v.kcal ?? null,
      proteina: v.proteina ?? null,
      grasas: v.grasas ?? null,
      carbohidratos: v.glucides ?? null,
      carbohidratosSon: 'disponibles, sin la fibra',
      carbohidratosTotales: porDiferencia ?? disponibles,
      fibra: v.fibra ?? null,
      azucares: v.azucares ?? null,
      sodio: v.sodio ?? null,
      agua: v.agua ?? null,
      deUsda: v.origenes.includes('usda') && !v.origenes.includes('otra'),
    });
  }
  return alimentos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rutas = process.argv.slice(2);
  if (rutas.length < 3) {
    console.log('Uso: node herramientas/fuentes/ciqual.mjs <alim.xml> <compo.xml> <sources.xml> [alim_grp.xml]');
    process.exit(1);
  }
  const redondo = (n) => (n == null ? '-' : Math.round(n * 10) / 10);
  for (const a of leerCiqual(...rutas)) {
    console.log([`ciqual:${a.codigo}`, a.descripcion, a.ingles, ...[a.kcal, a.proteina, a.carbohidratosTotales, a.grasas, a.fibra, a.sodio].map(redondo), a.deUsda ? 'de USDA' : ''].join(' | '));
  }
}
