// Lo que se come (spec/nutricion.md, «Registrar» y «Datos»): los registros de la línea del día,
// las recetas y comidas guardadas, los alimentos propios, los favoritos y el agua. Cada cosa lleva
// la hora de su cambio, y lo que se borra queda marcado: así el borrado también llega a los otros
// teléfonos (src/almacen/mezclar.ts). Los atajos (la última cantidad, lo que solés comer, los
// recientes y el premio del buscador) salen del historial: no se guardan.

import { ACEITE_POR_100G } from './cantidades';
import type { Comida } from './comidas';
import type { ComidaDelDia } from './control';
import { diasEntre, partesDe, type ClaveDia } from './fechas';
import { estadoDeMacro, type Macros } from './metas';
import { escalarMicros, sumarMicros, type Micros } from './micronutrientes';

/** De dónde sale un alimento: la base del teléfono, el catálogo uruguayo, Open Food Facts, los propios o una receta. */
export type Fuente = 'base' | 'catalogo' | 'off' | 'propio' | 'receta' | 'rapida';

/** Lo que se ve además de los macros, en gramos (el sodio, en mg). Lo que la fuente no dice, no está. */
export type Secundarios = { fibra?: number; azucares?: number; saturadas?: number; sodio?: number; alcohol?: number };
/** Los micronutrientes van aparte (micronutrientes.ts): lo que no dice la fuente, no está. */
export type Valores = Macros & Secundarios & { micros?: Micros };
/** Lo que es un número en los valores: los macros y lo secundario. */
export type Nutriente = Exclude<keyof Valores, 'micros'>;
export const SECUNDARIOS = ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const;

/**
 * Cuánto: una porción con nombre y cuántas veces («2 rebanadas»), o gramos. Los gramos son siempre
 * lo que se come: un líquido guarda también sus ml, y lo pesado con cáscara o hueso, lo que pesó
 * entero (`bruto`).
 */
export type Medida = { porcion: string; gramosPorcion: number; veces: number } | { gramos: number; ml?: number; bruto?: number };
/** Lo salteado guarda además los gramos del aceite de cocción, que ya están en sus valores. La carga rápida no tiene cantidad. */
export type Cantidad = (Medida & { aceite?: number }) | null;

/** Un alimento en una comida o en una receta, con lo que valía al anotarlo: el historial no cambia si cambia la base. */
export type Item = {
  fuente: Fuente;
  /** El id en su fuente (en la base, el número del alimento; en Open Food Facts, el código). La carga rápida no tiene. */
  ref: string | null;
  /** El nombre al anotarlo, en el idioma de ese momento. */
  nombre: string;
  cantidad: Cantidad;
  valores: Valores;
  /** Calculado a ojo, no pesado: el control lo cuenta con más cuidado (control.ts). */
  estimado?: true;
};

export type Registro = Item & {
  id: string;
  dia: ClaveDia;
  comida: Comida;
  /** Cuándo se comió: la hora en la línea del día. */
  momento: string;
  /** Anotado para un día que todavía no llegó (o armado por el plan): se ve tenue y el control no lo cuenta. */
  planificado: boolean;
  /** Lo armó el plan (plan.ts): la clave de la opción de la que sale. */
  plan?: string;
  actualizado: string;
  borrado?: true;
};

export type Receta = {
  id: string;
  /** Una receta se registra como un alimento, por porciones; una comida guardada suma cada uno de sus alimentos. */
  tipo: 'receta' | 'comida';
  nombre: string;
  items: Item[];
  /** Cuántas porciones rinde. Una comida guardada, 1. */
  porciones: number;
  /** Lo que pesa terminada, si se pesó: cocinar cambia el peso. */
  pesoFinal: number | null;
  actualizado: string;
  borrado?: true;
};

/** Creado a mano o desde la etiqueta. */
export type AlimentoPropio = {
  id: string;
  nombre: string;
  marca: string | null;
  /** El código de barras, si tiene. */
  codigo: string | null;
  por100g: Valores;
  porciones: { nombre: string; gramos: number }[];
  /** De dónde salen los valores: Open Food Facts (que pide nombrarlo, ODbL), la etiqueta o a mano. */
  origen?: 'off' | 'etiqueta' | 'mano';
  actualizado: string;
  borrado?: true;
};

/** Sacar un favorito es otro cambio, no un borrado: queda con `favorito` en falso. */
export type Favorito = { fuente: Fuente; ref: string; favorito: boolean; actualizado: string };

/** Cada vaso que se suma a mano. Lo de Salud se lee, no se copia. */
export type TomaDeAgua = { id: string; dia: ClaveDia; ml: number; momento: string; actualizado: string; borrado?: true };

export const claveDeAlimento = (fuente: Fuente, ref: string | null) => `${fuente}:${ref ?? ''}`;
export const claveDeFavorito = (f: Pick<Favorito, 'fuente' | 'ref'>) => claveDeAlimento(f.fuente, f.ref);

export function gramosDe(c: Cantidad): number | null {
  if (!c) return null;
  return 'gramos' in c ? c.gramos : c.gramosPorcion * c.veces;
}

/** Los valores escalados: por 100 g a una cantidad, o una porción a varias. */
export function escalar(v: Valores, factor: number): Valores {
  const r: Valores = { kcal: v.kcal * factor, proteina: v.proteina * factor, carbohidratos: v.carbohidratos * factor, grasas: v.grasas * factor };
  for (const k of SECUNDARIOS) if (v[k] != null) r[k] = v[k]! * factor;
  if (v.micros) r.micros = escalarMicros(v.micros, factor);
  return r;
}

/** La suma. De lo secundario, lo que no dice un alimento cuenta como cero, y lo que no dice ninguno no está. */
export function sumarValores(lista: Iterable<Valores>): Valores {
  const r: Valores = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  const micros: Micros[] = [];
  for (const v of lista) {
    r.kcal += v.kcal;
    r.proteina += v.proteina;
    r.carbohidratos += v.carbohidratos;
    r.grasas += v.grasas;
    for (const k of SECUNDARIOS) if (v[k] != null) r[k] = (r[k] ?? 0) + v[k]!;
    if (v.micros) micros.push(v.micros);
  }
  if (micros.length) r.micros = sumarMicros(micros);
  return r;
}

/** Los valores de un alimento en una cantidad: lo que se come y, si se salteó, el aceite. */
export function valoresDeCantidad(por100g: Valores, cantidad: Exclude<Cantidad, null>): Valores {
  const comido = escalar(por100g, (gramosDe(cantidad) ?? 0) / 100);
  return cantidad.aceite && cantidad.aceite > 0 ? sumarValores([comido, escalar(ACEITE_POR_100G, cantidad.aceite / 100)]) : comido;
}

/** Un alimento con sus valores por 100 g, en una cantidad. */
export function itemDeAlimento(fuente: Fuente, ref: string, nombre: string, por100g: Valores, cantidad: Exclude<Cantidad, null>): Item {
  return { fuente, ref, nombre, cantidad, valores: valoresDeCantidad(por100g, cantidad) };
}

/**
 * Registrar por lo que falta (como MacroFactor): cuántos gramos de un alimento dan `cantidad` de un
 * nutriente («cuánto pollo para 30 g de proteína», o para las kcal que quedan). Sin ese nutriente, null.
 */
export function gramosPara(por100g: Valores, nutriente: Nutriente, cantidad: number): number | null {
  const en100 = por100g[nutriente];
  if (!en100 || en100 <= 0 || cantidad <= 0) return null;
  return Math.round((cantidad / en100) * 100);
}

/** La carga rápida: los valores tal cual, sin alimento. */
export const itemRapido = (nombre: string, valores: Valores): Item => ({ fuente: 'rapida', ref: null, nombre, cantidad: null, valores });

const itemDe = (r: Item): Item => ({ fuente: r.fuente, ref: r.ref, nombre: r.nombre, cantidad: r.cantidad, valores: r.valores, ...(r.estimado ? { estimado: true as const } : {}) });

/** Lo que pide «registrar todas las comidas» si el hábito no elige otras. */
export const COMIDAS_DEL_DIA: readonly Comida[] = ['desayuno', 'almuerzo', 'cena'];
/** «Quedar dentro de las calorías» es quedar a menos de un 10 % de la meta, de más o de menos. */
const MARGEN_DE_CALORIAS = 0.1;

export const vigentes = <T extends { borrado?: true }>(lista: Iterable<T>): T[] => [...lista].filter((x) => !x.borrado);

const porMomento = (a: Registro, b: Registro) => (a.momento < b.momento ? -1 : a.momento > b.momento ? 1 : 0);

/** Lo de un día, en el orden de la línea: por hora. */
export function delDia(registros: Iterable<Registro>, dia: ClaveDia): Registro[] {
  return vigentes(registros).filter((r) => r.dia === dia).sort(porMomento);
}

export function totalDelDia(registros: Iterable<Registro>, dia: ClaveDia, conPlanificados = true): Valores {
  return sumarValores(delDia(registros, dia).filter((r) => conPlanificados || !r.planificado).map((r) => r.valores));
}

/**
 * Para el control semanal: las kcal de cada día con algo registrado, y cuántas fueron a ojo. Lo
 * planificado no cuenta hasta confirmarlo.
 */
export function comidasParaElControl(registros: Iterable<Registro>): ComidaDelDia[] {
  const porDia = new Map<ClaveDia, { kcal: number; estimadas: number }>();
  for (const r of vigentes(registros)) {
    if (r.planificado) continue;
    const d = porDia.get(r.dia) ?? { kcal: 0, estimadas: 0 };
    d.kcal += r.valores.kcal;
    if (r.estimado) d.estimadas += r.valores.kcal;
    porDia.set(r.dia, d);
  }
  return [...porDia].sort(([a], [b]) => (a < b ? -1 : 1)).map(([fecha, d]) => (d.estimadas > 0 ? { fecha, kcal: d.kcal, kcalEstimadas: d.estimadas } : { fecha, kcal: d.kcal }));
}

/**
 * Los hábitos de comida (spec/nutricion.md, «Hábitos de comida»): si se cumplen en un día con lo
 * registrado, sin lo planificado, y la meta de ese día. Se miran a cada rato: la estrella se
 * enciende cuando se llega y se apaga si se deja de cumplir (por ejemplo, al pasarse de calorías).
 */
export function cumpleLaComida(
  meta: 'proteina' | 'registrar' | 'calorias',
  registros: Iterable<Registro>,
  dia: ClaveDia,
  metaDelDia: Macros | null,
  comidas: readonly Comida[] = COMIDAS_DEL_DIA,
): boolean {
  const comido = delDia(registros, dia).filter((r) => !r.planificado);
  if (meta === 'registrar') return comidas.every((c) => comido.some((r) => r.comida === c));
  if (!metaDelDia || !comido.length) return false;
  const total = sumarValores(comido.map((r) => r.valores));
  // La misma regla que el punto del macro: se cumple cuando el número redondeado llega a la meta.
  if (meta === 'proteina') return estadoDeMacro(total.proteina, metaDelDia.proteina) !== 'falta';
  return Math.abs(total.kcal - metaDelDia.kcal) <= MARGEN_DE_CALORIAS * metaDelDia.kcal;
}

export function aguaDelDia(tomas: Iterable<TomaDeAgua>, dia: ClaveDia): number {
  return vigentes(tomas).filter((t) => t.dia === dia).reduce((s, t) => s + t.ml, 0);
}

/**
 * Una comida (o el día entero, sin `comida`) a otro día, como registros nuevos: a la misma hora del
 * reloj que el original y, si el día todavía no llegó o el original no se había comido, planificados.
 */
export function copiar(
  registros: Iterable<Registro>,
  desde: { dia: ClaveDia; comida?: Comida },
  hacia: { dia: ClaveDia; comida?: Comida },
  op: { hoy: ClaveDia; ahora: string; nuevoId: () => string },
): Registro[] {
  const p = partesDe(hacia.dia);
  return delDia(registros, desde.dia)
    .filter((r) => !desde.comida || r.comida === desde.comida)
    .map((r) => {
      // La hora local en el otro día: sumar días de 24 h correría una hora con el cambio de horario.
      const o = new Date(r.momento);
      return {
        ...itemDe(r),
        id: op.nuevoId(),
        dia: hacia.dia,
        comida: hacia.comida ?? r.comida,
        momento: new Date(p.anio, p.mes, p.dia, o.getHours(), o.getMinutes(), o.getSeconds(), o.getMilliseconds()).toISOString(),
        planificado: r.planificado || hacia.dia > op.hoy,
        actualizado: op.ahora,
      };
    });
}

/** Lo planificado de un día (o de una comida) pasa a registrado: «confirmar» cuando el día llega, o «Comí esto». */
export function confirmar(registros: Iterable<Registro>, dia: ClaveDia, ahora: string, comida?: Comida): Registro[] {
  return delDia(registros, dia).filter((r) => r.planificado && (!comida || r.comida === comida)).map((r) => ({ ...r, planificado: false, actualizado: ahora }));
}

/** Borrar deja la marca, con su hora: el borrado también es un cambio que sube. */
export const borrado = <T extends { actualizado: string; borrado?: true }>(x: T, ahora: string): T => ({ ...x, borrado: true, actualizado: ahora });

/** Deshacer un borrado. */
export function restaurado<T extends { actualizado: string; borrado?: true }>(x: T, ahora: string): T {
  const { borrado: _borrado, ...resto } = x;
  return { ...resto, actualizado: ahora } as T;
}

// ------------------------------------------------------------ recetas

/** Lo que vale una receta entera, una porción y 100 g (con el peso final si se pesó, y si no, el de los ingredientes). */
export function valoresDeReceta(r: Pick<Receta, 'items' | 'porciones' | 'pesoFinal'>): { total: Valores; porcion: Valores; por100g: Valores | null; gramos: number | null } {
  const total = sumarValores(r.items.map((i) => i.valores));
  const ingredientes = r.items.reduce((s, i) => s + (gramosDe(i.cantidad) ?? 0), 0);
  const gramos = r.pesoFinal ?? (ingredientes > 0 ? ingredientes : null);
  return { total, porcion: escalar(total, 1 / Math.max(1, r.porciones)), por100g: gramos ? escalar(total, 100 / gramos) : null, gramos };
}

/** Una receta como un alimento: `veces` porciones, con el nombre de la porción en el idioma de la app. */
/**
 * Una receta pesada terminada se registra en gramos: se pesa la olla entera una vez, y cada plato
 * se pesa al servirlo. Sin el peso final, null.
 */
export function itemDeRecetaEnGramos(r: Receta, gramos: number): Item | null {
  const { por100g } = valoresDeReceta(r);
  if (!por100g || !(gramos > 0)) return null;
  return { fuente: 'receta', ref: r.id, nombre: r.nombre, cantidad: { gramos }, valores: escalar(por100g, gramos / 100) };
}

export function itemDeReceta(r: Receta, veces: number, nombreDePorcion: string): Item {
  const { porcion, gramos } = valoresDeReceta(r);
  return {
    fuente: 'receta', ref: r.id, nombre: r.nombre,
    cantidad: { porcion: nombreDePorcion, gramosPorcion: gramos ? gramos / Math.max(1, r.porciones) : 0, veces },
    valores: escalar(porcion, veces),
  };
}

/** Lo que suma una receta o una comida guardada al registrarla: la receta, como un alimento; la comida, cada uno de los suyos. */
export function itemsParaRegistrar(r: Receta, nombreDePorcion: string): Item[] {
  return r.tipo === 'comida' ? r.items.map(itemDe) : [itemDeReceta(r, 1, nombreDePorcion)];
}

// ------------------------------------------------------------ los atajos
// Lo comido de verdad: sin lo planificado ni la carga rápida, que no tiene alimento.
const comidos = (registros: Iterable<Registro>) => vigentes(registros).filter((r) => !r.planificado && r.fuente !== 'rapida');
const masNuevoPrimero = (a: Registro, b: Registro) => -porMomento(a, b);

/** La última cantidad con que se anotó un alimento: es la que trae su ventana. */
export function ultimaCantidad(registros: Iterable<Registro>, fuente: Fuente, ref: string): Cantidad | undefined {
  const clave = claveDeAlimento(fuente, ref);
  return comidos(registros).filter((r) => claveDeAlimento(r.fuente, r.ref) === clave).sort(masNuevoPrimero)[0]?.cantidad;
}

/** Los alimentos de los últimos registros, sin repetir, del más reciente al más viejo. */
export function recientes(registros: Iterable<Registro>, cuantos = 12): Item[] {
  const vistos = new Set<string>();
  const lista: Item[] = [];
  for (const r of comidos(registros).sort(masNuevoPrimero)) {
    const clave = claveDeAlimento(r.fuente, r.ref);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push(itemDe(r));
    if (lista.length === cuantos) break;
  }
  return lista;
}

/** Cuánto pesa algo que pasó hace `dias`: la mitad cada `vidaMedia` días. */
const peso = (dias: number, vidaMedia: number) => 0.5 ** (Math.max(0, dias) / vidaMedia);

/** Lo que se tiene en cuenta para lo que solés comer, y cuántas veces hace falta haberlo comido. */
const VENTANA_SUELES = 60;
const VECES_SUELES = 2;

/**
 * Lo que solés comer en una comida: lo que más se repite en ella en los últimos dos meses, pesando
 * más lo reciente (vale la mitad cada dos semanas). Hace falta haberlo comido al menos dos veces.
 * Cada uno viene con la última cantidad.
 */
export function sueles(registros: Iterable<Registro>, comida: Comida, hoy: ClaveDia, cuantos = 6): Item[] {
  const puntos = new Map<string, { puntos: number; veces: number; ultimo: Registro }>();
  for (const r of comidos(registros).sort(masNuevoPrimero)) {
    const dias = diasEntre(r.dia, hoy);
    if (r.comida !== comida || dias < 0 || dias > VENTANA_SUELES) continue;
    const clave = claveDeAlimento(r.fuente, r.ref);
    const p = puntos.get(clave) ?? { puntos: 0, veces: 0, ultimo: r };
    p.puntos += peso(dias, 14);
    p.veces += 1;
    puntos.set(clave, p);
  }
  return [...puntos.values()].filter((p) => p.veces >= VECES_SUELES).sort((a, b) => b.puntos - a.puntos).slice(0, cuantos).map((p) => itemDe(p.ultimo));
}

/** La comida de siempre se busca en las últimas dos semanas. */
const VENTANA_DE_SIEMPRE = 14;

/**
 * La comida de siempre: los mismos alimentos en esa comida al menos dos veces en las últimas dos
 * semanas (la combinación más repetida y, entre iguales, la más reciente), con las cantidades de la
 * última vez, para sumarla entera de un toque. La de un solo alimento no cuenta: para eso está «sueles».
 */
export function deSiempre(registros: Iterable<Registro>, comida: Comida, hoy: ClaveDia): Item[] | null {
  const porDia = new Map<ClaveDia, Registro[]>();
  for (const r of comidos(registros)) {
    const dias = diasEntre(r.dia, hoy);
    if (r.comida !== comida || dias < 1 || dias > VENTANA_DE_SIEMPRE) continue;
    porDia.set(r.dia, [...(porDia.get(r.dia) ?? []), r]);
  }
  const veces = new Map<string, { veces: number; dia: ClaveDia }>();
  for (const [dia, lista] of porDia) {
    const alimentos = [...new Set(lista.map((r) => claveDeAlimento(r.fuente, r.ref)))].sort();
    if (alimentos.length < 2) continue;
    const firma = alimentos.join('|');
    const v = veces.get(firma) ?? { veces: 0, dia };
    v.veces += 1;
    if (dia > v.dia) v.dia = dia;
    veces.set(firma, v);
  }
  const mejor = [...veces.values()].filter((v) => v.veces >= 2).sort((a, b) => b.veces - a.veces || (a.dia < b.dia ? 1 : -1))[0];
  return mejor ? porDia.get(mejor.dia)!.sort(porMomento).map(itemDe) : null;
}

/** El premio más grande: alcanza para subir uno o dos escalones del orden del buscador, no más. */
const PREMIO_MAXIMO = 10;

/**
 * El premio de cada alimento de la base para el buscador (src/comida/buscar.ts): sube con el
 * logaritmo de las veces que se comió (vale la mitad cada mes) y un poco más si fue esta semana.
 */
export function premios(registros: Iterable<Registro>, hoy: ClaveDia): Map<number, number> {
  const usos = new Map<number, { peso: number; ultimo: number }>();
  for (const r of comidos(registros)) {
    if (r.fuente !== 'base' || r.ref === null) continue;
    const dias = diasEntre(r.dia, hoy);
    if (dias < 0 || dias > 180) continue;
    const id = Number(r.ref);
    const u = usos.get(id) ?? { peso: 0, ultimo: Infinity };
    u.peso += peso(dias, 30);
    u.ultimo = Math.min(u.ultimo, dias);
    usos.set(id, u);
  }
  return new Map([...usos].map(([id, u]) => [id, Math.min(PREMIO_MAXIMO, 3 * Math.log2(1 + u.peso) + (u.ultimo <= 7 ? 2 : 0))]));
}
