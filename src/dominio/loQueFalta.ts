// Lo que falta (lo pediste el 2/11/2026): si vas muy bajo en proteína, calorías o agua, un aviso aparte,
// corto y concreto, con qué falta y una idea de qué comer: «Te faltan 40 g de proteína: un yogur griego
// y dos huevos lo resuelven». Pocos y sin molestar:
// - Dos momentos por día, como mucho: a la tarde, cuando todavía se puede acomodar la cena; y a la noche,
//   después de anotar la cena. A la noche nunca repite lo que dijo a la tarde.
// - Solo si hoy se anotó algo: sin eso no se sabe nada, y Moss no reta a quien no anota.
// - Si ayer quedaste igual de bajo en lo mismo, día por medio: el mismo aviso todas las noches cansa.
// - Con lo planificado para lo que queda: si la cena planeada ya lo resuelve, no hay nada que avisar.
// - Con «sin déficit» (un cuidado de salud) no aparece nunca.
// Las ideas salen primero de lo que comes y, si no alcanza, de una lista corta que respeta tu dieta y tus
// alergias. Rotan cada día. Acá van códigos; el texto lo arma textoDelAviso, en avisos.ts.

import type { Comida } from './comidas';
import { diasEntre, type ClaveDia } from './fechas';
import type { Macros } from './metas';
import type { Alergeno, Dieta } from './plan';

export type QueFalta = 'proteina' | 'calorias' | 'agua';

/** Una idea: algo de lo que comes, por su nombre, o una de la lista, por su clave de texto. */
export type Idea = { nombre: string } | { id: string };

export type Falta = {
  que: QueFalta;
  /** En gramos de proteína (de a 5), en kcal (de a 50) o en vasos de agua. */
  cuanto: number;
  /** Una o dos. El agua no lleva: la idea es tomar un vaso. */
  ideas: Idea[];
  /** Si las ideas lo resuelven o solo acercan. */
  alcanza: boolean;
  /** De qué forma se dice: el texto toma el resto. Cambia cada día. */
  forma: number;
  /** Sin números: «Mostrar números» está apagado. */
  sinNumeros?: true;
};

export type FaltaConHora = { minutos: number; falta: Falta };

/** Lo que comes, como lo anotaste la última vez. */
export type AlimentoPropio = { nombre: string; proteina: number; kcal: number; azucares?: number; alcohol?: number };

export type DeHoy = {
  dia: ClaveDia;
  /** Los minutos de ahora, en la cuenta del día. */
  ahora: number;
  meta: Macros;
  /** Lo comido, con lo planificado para lo que queda. */
  comido: Macros;
  /**
   * Lo que se sabía a la hora de la tarde (lo anotado hasta entonces, con lo planificado): lo que dijo a esa
   * hora, si ya pasó. Lo que se anota después con una hora de antes («el almuerzo comí…») no cuenta.
   */
  comidoALaTarde?: Macros;
  /** Cuándo se anotó cada comida hoy, en minutos, sin lo planificado. */
  anotadas: Partial<Record<Comida, number>>;
  /** Las comidas que tienen algo planificado todavía sin anotar: ya están en `comido`. */
  planeadas?: ReadonlySet<Comida>;
  /** La hora de cenar de siempre. */
  horaDeCena: number;
  /** A qué hora ir a la cama, si se sabe: lo de la noche suena antes. */
  acostarse: number | null;
  comidasHabituales: 3 | 4;
  /** El agua de hoy, en ml, solo si se suele anotar. */
  agua?: { ml: number; mlALaTarde?: number } | null;
  /** En qué quedaste muy bajo ayer (bajoAlFinal). */
  bajoAyer?: readonly QueFalta[];
  propios?: readonly AlimentoPropio[];
  dieta?: Dieta;
  alergias?: readonly Alergeno[];
  sinDeficit?: boolean;
  sinNumeros?: boolean;
  /** Reflujo, en Cuidados: lo de la noche es liviano desde 3 h antes de la cama. */
  reflujo?: boolean;
};

/** Menos que esto que falte, no es estar muy bajo. */
export const PROTEINA_BAJA = 25;
export const CALORIAS_BAJAS = 400;
/** Y las calorías, además, tienen que ser al menos esta parte de la meta. */
const PARTE_DE_CALORIAS = 0.2;
/** Lo que hace falta quedar por comer para sugerir proteína: sin lugar, sería pedir que se pase. */
const LUGAR_MINIMO = 100;
export const AGUA_META_ML = 2000;
export const VASO_ML = 250;
const AGUA_BAJA = 0.4;
/** A la tarde: dos horas antes de la cena de siempre, y nunca antes de las 16:30. */
const TARDE_MINIMA = 16 * 60 + 30;
const ANTES_DE_LA_CENA = 120;
export const horaDeLaTarde = (horaDeCena: number) => Math.max(TARDE_MINIMA, horaDeCena - ANTES_DE_LA_CENA);
/**
 * Lo de la tarde se sigue devolviendo hasta esto después de su hora: avisosDelDia lo pudo correr un rato
 * para no pisar a otro (lo que espera un aviso, ATRASO_MAXIMO en avisos.ts) y saca lo que ya sonó.
 */
export const ESPERA_DE_LA_TARDE = 45;
/** A la noche: 75 minutos después de la cena de siempre y al menos 45 después de anotarla. */
const DESPUES_DE_LA_CENA = 75;
const DESPUES_DE_ANOTARLA = 45;
/** Y al menos media hora antes de ir a la cama; sin hora de la cama, hasta las 23:30. */
const ANTES_DE_LA_CAMA = 30;
const ULTIMA_DE_LA_NOCHE = 23 * 60 + 30;
/**
 * A menos de 2 h de ir a la cama, nada grande; con reflujo, 3 h. La guía de reflujo del ACG 2022 pide evitar
 * comidas 2 a 3 h antes de acostarse (condicional, con evidencia baja) y cenar a menos de 3 h se asoció con
 * mucho más reflujo (Fujiwara 2005); para el sueño, cenar 1 h antes no cambió nada medido con polisomnografía
 * (Gu 2020, n = 20). Lo de las calorías propone entonces una sola idea liviana. La última comida grande
 * (loQueConviene.ts) cuenta lo mismo.
 */
export const CERCA_DE_LA_CAMA = 120;
export const CERCA_DE_LA_CAMA_CON_REFLUJO = 180;
export const cercaDeLaCama = (reflujo?: boolean) => (reflujo ? CERCA_DE_LA_CAMA_CON_REFLUJO : CERCA_DE_LA_CAMA);
/** Liviano, hasta 250 kcal (derivado: de noche, algo de unas 150 kcal no perjudica; Kinsey y Ormsbee 2015). */
const LIVIANO = 250;
/** Las ideas lo resuelven si llegan a esta parte de lo que falta. */
const ALCANZA = 0.8;
const LARGO_MAXIMO = 30;

// 'vegetal': lo que tiene algo vegetal, que no come quien es carnívoro.
type Lleva = Alergeno | 'carne' | 'vegetal';
type DeLaLista = { id: string; proteina: number; kcal: number; lleva: readonly Lleva[] };

const PARA_PROTEINA: readonly DeLaLista[] = [
  { id: 'yogurGriego', proteina: 15, kcal: 130, lleva: ['leche'] },
  { id: 'huevos', proteina: 13, kcal: 155, lleva: ['huevo'] },
  { id: 'atun', proteina: 25, kcal: 120, lleva: ['pescado'] },
  { id: 'pollo', proteina: 45, kcal: 250, lleva: ['carne'] },
  { id: 'lentejas', proteina: 18, kcal: 230, lleva: ['vegetal'] },
  { id: 'leche', proteina: 7, kcal: 120, lleva: ['leche'] },
  { id: 'tofu', proteina: 15, kcal: 150, lleva: ['soja', 'vegetal'] },
];
const PARA_CALORIAS: readonly DeLaLista[] = [
  { id: 'panConHuevo', proteina: 12, kcal: 260, lleva: ['gluten', 'huevo', 'vegetal'] },
  { id: 'avena', proteina: 10, kcal: 300, lleva: ['gluten', 'leche', 'vegetal'] },
  { id: 'sandwich', proteina: 15, kcal: 350, lleva: ['gluten', 'vegetal'] },
  { id: 'arrozConHuevo', proteina: 14, kcal: 420, lleva: ['huevo', 'vegetal'] },
  { id: 'frutaConYogur', proteina: 8, kcal: 200, lleva: ['leche', 'vegetal'] },
  { id: 'frutosSecos', proteina: 6, kcal: 180, lleva: ['frutosSecos', 'vegetal'] },
  { id: 'pasta', proteina: 15, kcal: 450, lleva: ['gluten', 'vegetal'] },
];
/** Todas las claves de la lista: el test comprueba que cada una tenga su texto. */
export const IDEAS_DE_LA_LISTA: readonly string[] = [...new Set([...PARA_PROTEINA, ...PARA_CALORIAS].map((i) => i.id))];

// Quien es carnívoro no tiene ideas de la lista para las calorías: todas llevan algo vegetal, y le
// quedan las de lo que come.
const NO_COME: Record<Dieta, readonly Lleva[]> = {
  todo: [],
  pescetariana: ['carne'],
  vegetariana: ['carne', 'pescado', 'mariscos'],
  vegana: ['carne', 'pescado', 'mariscos', 'leche', 'huevo'],
  carnivora: ['vegetal'],
};

const aCinco = (x: number) => Math.round(x / 5) * 5;
const aCincuenta = (x: number) => Math.round(x / 50) * 50;

/** En qué quedó muy bajo un día terminado: se usa para no repetirlo mañana. */
export function bajoAlFinal(meta: Macros, comido: Macros): QueFalta[] {
  if (comido.kcal <= 0) return [];
  const lista: QueFalta[] = [];
  if (meta.proteina - comido.proteina >= PROTEINA_BAJA) lista.push('proteina');
  if (caloriasBajas(meta, comido)) lista.push('calorias');
  return lista;
}

function caloriasBajas(meta: Macros, comido: Macros): boolean {
  const faltan = meta.kcal - comido.kcal;
  return faltan >= CALORIAS_BAJAS && faltan >= PARTE_DE_CALORIAS * meta.kcal;
}

/**
 * De lo que queda, primero lo tuyo que sirva, en una rueda que gira cada día; después, la lista. `liviano`, cerca
 * de la cama: una sola idea chica, que acerca y no resuelve.
 */
function ideasPara(que: 'proteina' | 'calorias', cuanto: number, lugar: number, n: number, d: DeHoy, liviano = false): { ideas: Idea[]; alcanza: boolean } | null {
  const valor = (i: { proteina: number; kcal: number }) => (que === 'proteina' ? i.proteina : i.kcal);
  const entra = (i: { kcal: number }) => (que === 'proteina' ? i.kcal <= lugar * 1.1 : i.kcal <= (liviano ? LIVIANO : cuanto * 1.2));
  const propios = (d.propios ?? [])
    .filter((p) => p.nombre.length <= LARGO_MAXIMO && !(p.alcohol && p.alcohol > 0) && entra(p))
    .filter((p) => (que === 'proteina' ? p.proteina >= 8 && (4 * p.proteina) / Math.max(1, p.kcal) >= 0.2 : p.kcal >= 120 && (4 * (p.azucares ?? 0)) / Math.max(1, p.kcal) <= 0.5));
  const noCome = new Set<Lleva>([...NO_COME[d.dieta ?? 'todo'], ...(d.alergias ?? [])]);
  const deLaLista = (que === 'proteina' ? PARA_PROTEINA : PARA_CALORIAS).filter((i) => entra(i) && !i.lleva.some((x) => noCome.has(x)));
  const rueda = <T,>(lista: readonly T[]): T[] => (lista.length ? [...lista.slice(n % lista.length), ...lista.slice(0, n % lista.length)] : []);
  const opciones = [
    ...rueda(propios).map((p) => ({ idea: { nombre: p.nombre } as Idea, valor: valor(p), kcal: p.kcal })),
    ...rueda(deLaLista).map((i) => ({ idea: { id: i.id } as Idea, valor: valor(i), kcal: i.kcal })),
  ];
  const [primera, ...resto] = opciones;
  if (!primera) return null;
  if (liviano || primera.valor >= ALCANZA * cuanto) return { ideas: [primera.idea], alcanza: primera.valor >= ALCANZA * cuanto };
  // La segunda: la primera de la rueda que complete sin pasarse del lugar; si ninguna completa, la que más dé.
  const queda = cuanto - primera.valor;
  const entran = resto.filter((o) => (que === 'proteina' ? primera.kcal + o.kcal <= lugar * 1.1 : o.valor <= queda * 1.2));
  const segunda = entran.find((o) => o.valor >= ALCANZA * queda) ?? [...entran].sort((a, b) => b.valor - a.valor)[0];
  if (!segunda) return { ideas: [primera.idea], alcanza: false };
  return { ideas: [primera.idea, segunda.idea], alcanza: primera.valor + segunda.valor >= ALCANZA * cuanto };
}

/** Lo que Moss avisaría hoy, con su hora. El teléfono lo vuelve a armar cada vez que se anota algo. */
export function loQueFaltaHoy(d: DeHoy): FaltaConHora[] {
  if (d.sinDeficit || !Object.keys(d.anotadas).length) return [];
  // Cada día otra idea, y el mismo aviso seguido, día por medio.
  const n = Math.abs(diasEntre('2026-01-05', d.dia));
  const toca = (q: QueFalta) => !(d.bajoAyer?.includes(q) && n % 2 === 1);
  const conLugar = (c: Macros) => d.meta.kcal - c.kcal;

  const armar = (que: QueFalta, c: Macros, cerca = false): Falta | null => {
    const base = { forma: n, ...(d.sinNumeros ? { sinNumeros: true as const } : {}) };
    if (que === 'agua') {
      const vasos = Math.ceil((AGUA_META_ML - (d.agua?.ml ?? 0)) / VASO_ML);
      return { que, cuanto: vasos, ideas: [], alcanza: false, ...base };
    }
    const faltan = que === 'proteina' ? aCinco(d.meta.proteina - c.proteina) : aCincuenta(d.meta.kcal - c.kcal);
    // La proteína de noche no cambia: 20 a 40 g antes de dormir no perjudican (Reis 2021; Kerksick 2017).
    const ideas = ideasPara(que, faltan, conLugar(c), n, d, cerca && que === 'calorias');
    return ideas && { que, cuanto: faltan, ...ideas, ...base };
  };

  const tarde = horaDeLaTarde(d.horaDeCena);
  // A la tarde importa lo que va a faltar después de las comidas que quedaban a esa hora: cada una da su parte de la meta.
  const queQuedan = (['merienda', 'cena'] as const).filter((c) => {
    const cuando = d.anotadas[c];
    return (cuando === undefined || cuando > tarde) && !d.planeadas?.has(c) && (c === 'cena' || d.comidasHabituales === 4);
  });
  const deLaTarde = (c: Macros, ml: number | null | undefined): QueFalta | null => {
    const vaAQuedar = d.meta.proteina - c.proteina - (queQuedan.length * d.meta.proteina) / d.comidasHabituales;
    if (vaAQuedar >= PROTEINA_BAJA && conLugar(c) >= LUGAR_MINIMO && toca('proteina')) return 'proteina';
    if (ml !== null && ml !== undefined && ml < AGUA_META_ML * AGUA_BAJA && toca('agua')) return 'agua';
    return null;
  };

  const salida: FaltaConHora[] = [];
  let dijo: QueFalta | null;
  if (d.ahora < tarde + ESPERA_DE_LA_TARDE) {
    dijo = deLaTarde(d.comido, d.agua?.ml);
    const falta = dijo && armar(dijo, d.comido);
    if (falta) salida.push({ minutos: tarde, falta });
  } else {
    // Esa hora ya pasó: lo que dijo, con lo que se había anotado entonces.
    dijo = deLaTarde(d.comidoALaTarde ?? d.comido, d.agua ? (d.agua.mlALaTarde ?? d.agua.ml) : null);
  }

  const cena = d.anotadas.cena;
  if (cena !== undefined) {
    const minutos = Math.max(d.horaDeCena + DESPUES_DE_LA_CENA, cena + DESPUES_DE_ANOTARLA);
    const cama = d.acostarse ?? ULTIMA_DE_LA_NOCHE + ANTES_DE_LA_CAMA;
    if (minutos <= cama - ANTES_DE_LA_CAMA) {
      const que = (['proteina', 'calorias'] as const).find((q) => {
        if (q === dijo || !toca(q)) return false;
        return q === 'proteina' ? d.meta.proteina - d.comido.proteina >= PROTEINA_BAJA && conLugar(d.comido) >= LUGAR_MINIMO : caloriasBajas(d.meta, d.comido);
      });
      const falta = que && armar(que, d.comido, cama - minutos < cercaDeLaCama(d.reflujo));
      if (falta) salida.push({ minutos, falta });
    }
  }
  return salida;
}
