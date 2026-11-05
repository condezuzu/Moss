// El rango que tienes en Ascent, para teñir su sección en Moss (lo propusiste el 5/11/2026; para aprobar en la
// galería). En Ascent cada rango tiñe toda la app y tiene su cuerpo: polvo, un asteroide, la luna, un planeta
// por día, el sol, una galaxia y el agujero negro. La sección de Ascent en Moss toma ese color y ese cuerpo, y
// nunca dice el nombre: en Ascent «el rango se ve, no se lee».
// Es el espejo de la regla de Ascent (su `nucleo/reglas.ts`, `numeroDeRango` y `planetaDeDia`, y las paletas de
// `nucleo/paletas.ts`): Moss leería solo la racha (`profiles.racha_actual`) con el vínculo y calcula lo demás
// igual que allá. Si Ascent cambia la escalera, cambia esto también (spec/ascent.md).

export type Paleta = { apagado: string; principal: string; claro: string };
export type CuerpoDeAscent = 'polvo' | 'asteroide' | 'luna' | 'planeta' | 'sol' | 'galaxia' | 'agujeroNegro';

/** El día de racha en que empieza cada rango: 5, 10, 15, 20, 25 y 30 días, y el último sin techo. */
export const DESDE_RANGO = [0, 6, 16, 31, 51, 76, 106] as const;
export const CUERPOS: readonly CuerpoDeAscent[] = ['polvo', 'asteroide', 'luna', 'planeta', 'sol', 'galaxia', 'agujeroNegro'];
/** El rango 4 cambia de planeta cada cuatro días, del más chico al más grande. */
export const PLANETAS = ['Ceres', 'Mercurio', 'Marte', 'Venus', 'Saturno'] as const;
export type Planeta = (typeof PLANETAS)[number];
const DIAS_POR_PLANETA = 4;

/** Apagado, principal y claro de cada rango, como en Ascent; el del 4 es el respaldo, manda el planeta. */
export const PALETAS_RANGO: Record<number, Paleta> = {
  1: { apagado: '#4A4759', principal: '#6E6A82', claro: '#9E9BB0' },
  2: { apagado: '#7A3A15', principal: '#B4581F', claro: '#E08A3C' },
  3: { apagado: '#5B7BA8', principal: '#7E8CA8', claro: '#C4C2BA' },
  4: { apagado: '#2E4A78', principal: '#4A7FD0', claro: '#DBE7F5' },
  5: { apagado: '#EF9F27', principal: '#F2C230', claro: '#FFF1C2' },
  6: { apagado: '#4A2A8C', principal: '#7F4FD0', claro: '#C3A6F5' },
  7: { apagado: '#05050A', principal: '#FF6A00', claro: '#A78BFA' },
};
export const PALETAS_PLANETA: Record<Planeta, Paleta> = {
  Ceres: { apagado: '#4A4C52', principal: '#7A828E', claro: '#B8C0CC' },
  Mercurio: { apagado: '#4A4440', principal: '#7E766E', claro: '#B5ADA4' },
  Marte: { apagado: '#8A2E10', principal: '#D9531E', claro: '#F0925C' },
  Venus: { apagado: '#8A7A4A', principal: '#C9B278', claro: '#F0E4C2' },
  Saturno: { apagado: '#6E6248', principal: '#B0A078', claro: '#E8DCBE' },
};

/** El rango de una racha: el más alto cuyo umbral ya alcanzó. Sin un número que sirva, el 1. */
export function numeroDeRango(racha: number): number {
  if (!Number.isFinite(racha)) return 1;
  const r = Math.max(0, Math.floor(racha));
  let n = 1;
  for (let i = 0; i < DESDE_RANGO.length; i++) if (r >= DESDE_RANGO[i]) n = i + 1;
  return n;
}

/** El planeta de hoy, solo en el rango 4. */
export function planetaDeDia(racha: number): Planeta | null {
  if (!Number.isFinite(racha)) return null;
  const r = Math.floor(racha);
  return r >= DESDE_RANGO[3] && r < DESDE_RANGO[4] ? PLANETAS[Math.floor((r - DESDE_RANGO[3]) / DIAS_POR_PLANETA)] : null;
}

/** Lo que pinta la sección: el rango, su cuerpo, el planeta del día (en el 4) y la paleta. */
export function cuerpoDeAscent(racha: number): { rango: number; cuerpo: CuerpoDeAscent; planeta: Planeta | null; paleta: Paleta } {
  const rango = numeroDeRango(racha);
  const planeta = rango === 4 ? planetaDeDia(racha) : null;
  return { rango, cuerpo: CUERPOS[rango - 1], planeta, paleta: planeta ? PALETAS_PLANETA[planeta] : PALETAS_RANGO[rango] };
}

/** La racha con que empieza un rango (y, en el 4, un planeta): para mostrar cada uno. */
export function rachaDe(rango: number, planeta?: Planeta | null): number {
  const n = Math.min(DESDE_RANGO.length, Math.max(1, Math.floor(rango)));
  if (n === 4 && planeta) return DESDE_RANGO[3] + PLANETAS.indexOf(planeta) * DIAS_POR_PLANETA;
  return DESDE_RANGO[n - 1];
}
