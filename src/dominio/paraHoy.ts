// Para hoy (lo pediste el 2/11/2026): abajo de Inicio, en vez del saludo de arriba, hasta tres comentarios
// cortos de la comida, una idea cada uno, como los del diagnóstico de Ascent pero más chicos: lo que falta
// anotar, cómo va el reparto de los macros, lo que falta de proteína y el agua. La hora de dormir y lo de
// entrenar van en los avisos, no acá. Acá van códigos y números; el texto está en src/textos
// (inicio.paraHoy) y lo pone la interfaz.
// - Cierto: solo habla de lo anotado. Sin nada anotado, no adivina: recuerda anotar cuando ya pasaron dos
//   comidas, y si no, calla.
// - Sin culpa: nunca reta ni pide comer menos. Con «sin déficit» (un cuidado de salud) solo queda anotar:
//   el agua tampoco (5/11/2026), porque con el riñón o una condición que no se dice el líquido lo decide su
//   equipo; con los números ocultos, la interfaz los dice sin cifras.
// - Según el deporte (3/11/2026, para aprobar): lo de segunElDeporte.ts que va en «Para hoy» va primero, en
//   su orden, y ya llega con «sin déficit» y los números ocultos aplicados. Siguen siendo tres como mucho y
//   nunca dos de lo mismo: si uno del deporte habla de carbohidratos, no va «pocos carbohidratos»; si habla
//   del agua, no va el agua.

import type { Comida } from './comidas';
import type { Macros } from './metas';
import type { ConsejoDelDeporte } from './segunElDeporte';

export type ConsejoDeHoy =
  | { tipo: 'deporte'; consejo: ConsejoDelDeporte }
  | { tipo: 'anotar'; comidas: Comida[] }
  | { tipo: 'nadaAnotado' }
  | { tipo: 'pocosCarbohidratos'; proxima: Comida | null }
  | { tipo: 'pocaProteina'; proxima: Comida | null }
  | { tipo: 'muchaGrasa'; proxima: Comida | null }
  | { tipo: 'faltaProteina'; gramos: number; proxima: Comida | null }
  | { tipo: 'agua'; vasos: number };

export type EntradaDeParaHoy = {
  /** Los minutos de ahora, en la cuenta del día. */
  ahora: number;
  meta: Macros;
  /** Lo anotado hoy, sin lo planificado. */
  comido: Macros;
  /** Las comidas de siempre cuya hora ya pasó y no tienen nada anotado. */
  sinAnotar: readonly Comida[];
  /** Cuántas comidas tienen algo anotado hoy. */
  anotadas: number;
  /** La próxima comida de siempre, si queda alguna hoy. */
  proxima: Comida | null;
  /** El agua de hoy, solo si se suele anotar. */
  agua?: { ml: number; meta: number } | null;
  sinDeficit?: boolean;
  /** Lo de hoy según el deporte (segunElDeporte), en su orden: acá entra lo que va en «Para hoy». */
  deporte?: readonly ConsejoDelDeporte[];
};

export const MAXIMO_DE_CONSEJOS = 3;
/** El reparto se mira con al menos esta parte de las calorías comida: antes, cualquier comida desequilibra. */
const COMIDO_PARA_REPARTO = 0.3;
/** Un macro va «bajo» frente a otro si su parte de la meta está a esta distancia, y todavía no llegó a esto. */
const DESEQUILIBRIO = 0.25;
const TODAVIA_BAJO = 0.75;
/** Las grasas van «muchas» si superan por esto el promedio de los otros dos, y ya pasaron esta parte. */
const GRASA_DE_MAS = 0.3;
const GRASA_MINIMA = 0.6;
/**
 * Con la meta ya baja en carbohidratos (keto o baja en carbohidratos: menos del 26 % de las kcal, como en
 * metas.ts), pedir arroz, papa o pan iría contra la meta: no se dice.
 */
const CARBOHIDRATOS_BAJOS = 0.26;
/** Lo que falta de proteína se dice desde la tarde, con 25 g o más (como loQueFalta.ts). */
const PROTEINA_DESDE = 16 * 60;
const PROTEINA_QUE_FALTA = 25;
/** El agua, desde las tres de la tarde y debajo de la mitad. */
const AGUA_DESDE = 15 * 60;
const AGUA_BAJA = 0.5;
const VASO_ML = 250;

const parte = (comido: number, meta: number) => (meta > 0 ? comido / meta : 1);

export function paraHoy(e: EntradaDeParaHoy): ConsejoDeHoy[] {
  // Lo del deporte primero, sin dos del mismo tema; y los temas que ya tocó no se repiten abajo.
  const temas = new Set<ConsejoDelDeporte['tema']>();
  const delDeporte: ConsejoDeHoy[] = (e.deporte ?? []).filter((c) => {
    if (c.donde !== 'paraHoy' || temas.has(c.tema)) return false;
    temas.add(c.tema);
    return true;
  }).map((consejo) => ({ tipo: 'deporte', consejo }));
  const lista: ConsejoDeHoy[] = [];
  if (e.anotadas === 0) {
    // Sin nada anotado no se sabe nada de la comida: solo, si ya pasaron dos comidas, que se anote.
    if (e.sinAnotar.length >= 2) lista.push({ tipo: 'nadaAnotado' });
  } else if (e.sinAnotar.length) lista.push({ tipo: 'anotar', comidas: [...e.sinAnotar] });

  if (!e.sinDeficit && e.anotadas > 0) {
    const p = parte(e.comido.proteina, e.meta.proteina);
    const c = parte(e.comido.carbohidratos, e.meta.carbohidratos);
    const g = parte(e.comido.grasas, e.meta.grasas);
    // Lo que falta de proteína no se dice si el reparto ya habló de la proteína (que falta o que va bien).
    let hablaDeProteina = false;
    const conPocosCarbohidratos = e.meta.carbohidratos * 4 < CARBOHIDRATOS_BAJOS * e.meta.kcal;
    if (parte(e.comido.kcal, e.meta.kcal) >= COMIDO_PARA_REPARTO) {
      if (p - c >= DESEQUILIBRIO && c < TODAVIA_BAJO && !conPocosCarbohidratos && !temas.has('carbohidratos')) {
        lista.push({ tipo: 'pocosCarbohidratos', proxima: e.proxima });
        hablaDeProteina = true;
      } else if (c - p >= DESEQUILIBRIO && p < TODAVIA_BAJO) {
        lista.push({ tipo: 'pocaProteina', proxima: e.proxima });
        hablaDeProteina = true;
      }
      if (g - (p + c) / 2 >= GRASA_DE_MAS && g >= GRASA_MINIMA) lista.push({ tipo: 'muchaGrasa', proxima: e.proxima });
    }
    const falta = e.meta.proteina - e.comido.proteina;
    if (!hablaDeProteina && e.ahora >= PROTEINA_DESDE && falta >= PROTEINA_QUE_FALTA) lista.push({ tipo: 'faltaProteina', gramos: Math.round(falta / 5) * 5, proxima: e.proxima });
  }

  if (e.agua && !e.sinDeficit && e.ahora >= AGUA_DESDE && e.agua.ml < AGUA_BAJA * e.agua.meta && !temas.has('agua')) lista.push({ tipo: 'agua', vasos: Math.ceil((e.agua.meta - e.agua.ml) / VASO_ML) });
  return [...delDeporte, ...lista].slice(0, MAXIMO_DE_CONSEJOS);
}
