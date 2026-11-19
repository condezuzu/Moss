// Cómo llegas a entrenar según lo que comiste hoy (spec/ascent.md, «Hoy, según el momento»): hasta dos cosas que
// esperar, en orden. Los cortes son convenciones prudentes, con la idea de spec/entreno.md: los carbohidratos son el
// combustible de las series largas, la grasa cerca de entrenar se digiere lento y la proteína es para después.

export type QueEsperar = 'ayunas' | 'pocosCarbohidratos' | 'grasaCerca' | 'pocaProteina' | 'bien';

/** Lo comido hoy hasta la sesión, en minutos del día. */
export type ComidoAntes = { momento: number; carbohidratos: number; proteina: number; grasas: number };

/** Desde 4 horas sin comer. */
export const HORAS_SIN_COMER = 4;
/** Menos de 1 g de carbohidratos por kilo en el día, hasta la sesión. */
export const CARBOHIDRATOS_POR_KG = 1;
/** 20 g de grasa o más en las 2 horas antes. */
export const GRASA_CERCA = { gramos: 20, minutos: 120 } as const;
/** Menos de 0,5 g de proteína por kilo en el día, hasta la sesión. */
export const PROTEINA_POR_KG = 0.5;

export function queEsperar(p: { comido: readonly ComidoAntes[]; inicio: number; pesoKg: number | null }): QueEsperar[] {
  const antes = p.comido.filter((x) => x.momento <= p.inicio);
  const r: QueEsperar[] = [];
  const ultima = Math.max(...antes.map((x) => x.momento));
  if (!antes.length || p.inicio - ultima >= HORAS_SIN_COMER * 60) r.push('ayunas');
  const suma = (k: 'carbohidratos' | 'proteina') => antes.reduce((s, x) => s + x[k], 0);
  if (p.pesoKg && antes.length && suma('carbohidratos') / p.pesoKg < CARBOHIDRATOS_POR_KG) r.push('pocosCarbohidratos');
  const grasaCerca = antes.filter((x) => p.inicio - x.momento <= GRASA_CERCA.minutos).reduce((s, x) => s + x.grasas, 0);
  if (grasaCerca >= GRASA_CERCA.gramos) r.push('grasaCerca');
  if (p.pesoKg && antes.length && suma('proteina') / p.pesoKg < PROTEINA_POR_KG) r.push('pocaProteina');
  return r.length ? r.slice(0, 2) : ['bien'];
}
