// Los colores de Ascent (su spec/estetica.md, como la galería: galeria/src/ascent.js): la sección de Ascent y
// la hoja de vincular son la parte de Moss que es de las dos apps, y tienen su cara. Lo único con color es lo
// que pone el límite hoy y lo cargado (`lejos`, terracota). El acento (`principal` y `claro`) es el de tu rango en
// Ascent (PALETAS_RANGO en src/dominio/rangoDeAscent.ts): mientras Ascent no mande tu racha, el del rango 1, el polvo.

export const C = {
  fondo: '#05060a', hoja: '#0b0d13', tinta: '#e8ecf6', sub: '#aab2c4', apagado: '#9098ab', tenue: '#4a5163',
  linea: '#303748', lineaSuave: 'rgba(48, 55, 72, 0.6)', lineaFuerte: '#3e4659', principal: '#6E6A82', claro: '#9E9BB0',
  lejos: '#cb8569', ambar: '#f0c48a',
} as const;

/** Los grupos de «Tu año»: tres tonos apagados que se distinguen también con daltonismo. */
export const GRUPOS_DEL_ANIO = { pecho: '#419ec6', piernas: '#a77e33', espalda: '#765190' } as const;
