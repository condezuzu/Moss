// TACO, la Tabla Brasileira de Composição de Alimentos (NEPA-UNICAMP, 4.ª edición revisada y
// ampliada, 2011): 597 alimentos analizados en Brasil. Lee su planilla oficial (Taco-4a-Edicao.xlsx,
// hoja «CMVCol taco3») y devuelve cada alimento por 100 g, como los demás lectores de herramientas/fuentes.
// - Los carbohidratos son por diferencia y ya incluyen la fibra, como los de USDA.
// - «NA» es «no se aplica» (cero), «Tr» es traza (cero) y «*» es un valor en revisión (no se sabe).
// Uso: node herramientas/fuentes/taco.mjs <Taco-4a-Edicao.xlsx>   → una línea por alimento

import { fileURLToPath } from 'node:url';
import { leerXlsx } from './xlsx.mjs';

export const TACO = {
  fuente: 'taco',
  nombre: 'TACO, 4.ª edición (NEPA-UNICAMP, 2011)',
  url: 'https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/Taco-4a-Edicao.xlsx',
  archivo: 'Taco-4a-Edicao.xlsx',
};

// La planilla tiene un nombre roto: el 540 es «Feijoada» en el PDF oficial y en sus valores. Las
// notas al pie quedan pegadas al nombre («Cerveja, pilsen 2»): se sacan.
const NOMBRES_CORREGIDOS = { 540: 'Feijoada' };

// Columnas de la hoja (las tres primeras filas de cada página son la cabecera).
const COL = { codigo: 0, descripcion: 1, agua: 2, kcal: 3, proteina: 5, grasas: 6, carbohidratos: 8, fibra: 9, cenizas: 10, sodio: 17 };

/** Un valor de la tabla: número, o 0 para «NA» y «Tr», o null si no se sabe («*» o vacío). */
function valor(v) {
  if (typeof v === 'number') return v;
  const t = String(v ?? '').trim();
  if (t === 'NA' || t === 'Tr') return 0;
  return null;
}

/** Los alimentos de TACO por 100 g. */
export function leerTaco(ruta) {
  const filas = leerXlsx(ruta, ['CMVCol taco3']).get('CMVCol taco3');
  const alimentos = [];
  let grupo = null;
  for (const f of filas) {
    if (typeof f[COL.codigo] !== 'number') {
      // Las filas de grupo («Cereais e derivados») tienen solo el nombre en la primera columna.
      if (typeof f[0] === 'string' && f[1] == null && !/^Número|^Alimento/.test(f[0])) grupo = f[0].trim();
      continue;
    }
    const codigo = f[COL.codigo];
    const v = Object.fromEntries(Object.entries(COL).slice(2).map(([k, i]) => [k, valor(f[i])]));
    alimentos.push({
      fuente: 'taco',
      codigo: String(codigo),
      descripcion: (NOMBRES_CORREGIDOS[codigo] ?? String(f[COL.descripcion])).replace(/\s+/g, ' ').replace(/ ,/g, ',').trim().replace(/ \d$/, ''),
      ingles: null,
      grupo,
      kcal: v.kcal,
      proteina: v.proteina,
      grasas: v.grasas,
      carbohidratos: v.carbohidratos,
      carbohidratosSon: 'por diferencia, con la fibra',
      carbohidratosTotales: v.carbohidratos,
      fibra: v.fibra,
      azucares: null,
      sodio: v.sodio,
      agua: v.agua,
      deUsda: false,
    });
  }
  return alimentos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [ruta] = process.argv.slice(2);
  if (!ruta) {
    console.log('Uso: node herramientas/fuentes/taco.mjs <Taco-4a-Edicao.xlsx>');
    process.exit(1);
  }
  const redondo = (n) => (n == null ? '-' : Math.round(n * 10) / 10);
  for (const a of leerTaco(ruta)) {
    console.log([`taco:${a.codigo}`, a.descripcion, ...[a.kcal, a.proteina, a.carbohidratosTotales, a.grasas, a.fibra, a.sodio].map(redondo)].join(' | '));
  }
}
