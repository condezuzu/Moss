// Según el tipo de deporte (lo pediste el 3/11/2026; la investigación está en spec/entreno.md, 5.12), para
// aprobar en la galería: lo que cambia según el deporte más allá de la proteína, que casi no cambia. Cambian
// los carbohidratos según el día y cuándo, el agua y la sal, la recuperación (que los choques y el alcohol
// hacen más lenta), algunos riesgos (la energía baja, el hierro, los picos de carga) y cuánto rinde dormir más.
// Las once reglas de 5.12, cada una con su umbral; cada consejo dice qué es, dónde va y los números de su texto:
// - «Para hoy», abajo de Inicio (paraHoy.ts las pone primero): el partido, la carrera larga, los carbohidratos
//   del día, tomar después de pesarte, el alcohol después de jugar, el pico de distancia y el hierro o el calcio.
// - Sueño, una línea debajo de la noche: el partido de noche, más carga con menos sueño y dormir más.
// - Inicio, una tarjeta una sola vez: la energía baja.
// - La pantalla bloqueada: «Mañana juegas» y «Tu carrera es pasado mañana» los arma loQueConviene.ts con
//   partidoManana y diasParaLaCarrera, de acá.
// Lo que una regla necesita y la app todavía no tiene (la carrera, dos pesadas alrededor de una sesión, las
// distancias, la masa magra) llega opcional: sin eso, la regla calla. Nunca nombra suplementos ni
// diagnósticos, ni habla del peso como meta. Con «sin déficit», nada de lo que es de comer, como en paraHoy.ts.
// Acá van códigos y números; las palabras están en src/textos (inicio.paraHoy.deporte, sueno.deporte e
// inicio.energiaBaja) y las elige textoDelDeporte.

import { sesionesDeUnDia, type Deporte, type EntrenoDicho } from './cuestionario';
import { diaDeLaSemana, diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { MAYORIA_DE_EDAD, type Objetivo, type Sexo } from './metas';
import { referenciaDe } from './micronutrientes';

/** Un partido con su fecha: el de cada semana (partidosEntre) o uno de más, como un torneo. Horas en minutos. */
export type Partido = { dia: ClaveDia; hora?: number | null; minutos?: number | null };
/** La próxima carrera, cargada en Perfil › Entrenamiento: la fecha y cuánto dura, en minutos. */
export type Carrera = { fecha: ClaveDia; minutos: number };

// ------------------------------------------------------------ los umbrales de 5.12 («derivado»: puesto a partir de las fuentes)
/** 1. Entre dos partidos a menos de 72 h, los días del medio piden lo mismo que la víspera (UEFA 2021). */
export const ENTRE_PARTIDOS = 72 * 60;
/** Lo que dura un partido si no se dijo otra cosa: lo de fábrica de los partidos en el cuestionario. */
export const DURACION_DE_PARTIDO = 90;
/** 2. Una carrera de más de 90 minutos pide cargar carbohidratos los dos días antes (ACSM 2016). */
export const CARRERA_LARGA = 90;
export const DIAS_DE_CARGA = 2;
/** 3. Los días con una hora o más de resistencia o partidos, más carbohidratos ese día (5 a 7 g/kg). */
export const UNA_HORA = 60;
/** 4. Dos pesadas a menos de 3 h alrededor de una sesión. Menos de medio kilo es lo que se mueve la balanza (derivado). */
export const PESADAS_A_MENOS_DE = 180;
export const PERDIDA_MINIMA = 0.5;
/** Después, de 1,25 a 1,5 L por kilo perdido (ACSM 2016): se dice lo de abajo, de a 0,1 L. */
export const LITROS_POR_KILO = 1.25;
/** Con más del 2 % del peso perdido, la próxima vez conviene tomar más durante. */
export const PERDIDA_PARA_TOMAR_DURANTE = 0.02;
/** Algo salado con más de 2 h o mucho sudor: más de lo típico, que es ≈ 1,3 L por hora (derivado). */
export const SESION_CON_SAL = 120;
export const MUCHO_SUDOR = 1.5;
/** 5. Un gramo de alcohol por kilo o más en las 12 h después de jugar (≈ 5 latas de cerveza para 70 kg). */
export const ALCOHOL_POR_KILO = 1;
export const HORAS_DEL_ALCOHOL = 12 * 60;
/** 6. Un partido que termina después de las 20 h quita ≈ 80 minutos de sueño esa noche (derivado). */
export const TERMINA_TARDE = 20 * 60;
/** 7. Una hora o más de deuda por noche, en semanas de partidos; antes de los 18, la necesidad es 9 h (AASM). */
export const DEUDA_POR_NOCHE = 60;
export const NECESIDAD_ANTES_DE_LOS_18 = 9 * 60;
/** De las últimas 7 noches, con al menos 4 medidas (derivado). */
const NOCHES_PARA_LA_DEUDA = 4;
/** 8. La carga de la semana un 25 % arriba de las 4 anteriores, y 3 de 7 noches cortas (derivado). */
export const SUBA_DE_CARGA = 1.25;
export const NOCHE_CORTA = { adulto: 7 * 60, menor: 8 * 60 };
export const NOCHES_CORTAS = 3;
/** 9. La carrera de hoy, más de un 10 % más larga que la más larga de los 30 días anteriores (Frandsen 2025). */
export const PICO = 1.1;
export const DIAS_DEL_PICO = 30;
/**
 * 10. La energía baja, con una de estas señales durante dos semanas (derivado; pesa más el peso que lo anotado):
 * mantener o subir con la tendencia un 1 % abajo en 3 semanas y 3 sesiones por semana o más; bajar más de un 1 %
 * por semana con mucha carga (5 h por semana o más, derivado); o, con la masa magra, (kcal comidas − kcal de
 * entrenar) / masa magra debajo de 30 en mujeres o de 25 en hombres, con 6 de 7 días anotados.
 */
export const BAJA_EN_TRES_SEMANAS = 0.01;
export const SESIONES_POR_SEMANA = 3;
export const BAJA_POR_SEMANA = 0.01;
export const MUCHA_CARGA = 300;
export const DISPONIBILIDAD: Record<Sexo, number> = { f: 30, m: 25 };
export const DIAS_ANOTADOS = 6;
/** 11. El hierro y el calcio, de 14 días con al menos 10 bien anotados (lo anotado llega a 3/4 de la meta, derivado). */
export const DIAS_DE_MINERALES = 14;
export const DIAS_BIEN_ANOTADOS = 10;
export const BIEN_ANOTADO = 0.75;
export const CALCIO_CON_ENERGIA_BAJA = 1500;

// ------------------------------------------------------------ lo que entra y lo que sale
export type EntradaDelDeporte = {
  hoy: ClaveDia;
  /** Lo del cuestionario (o Perfil › Entrenamiento): los deportes, las sesiones de la semana y el partido. Sin entrenar, null. */
  entreno: Pick<EntrenoDicho, 'tipos' | 'sesiones' | 'partidos'> | null;
  sexo: Sexo;
  edad: number;
  pesoKg: number | null;
  /** Un cuidado de salud: nada de lo que es de comer, y la tarjeta sin números. */
  sinDeficit?: boolean;
  /** «Mostrar números» apagado: sin kilos, litros ni calorías. */
  sinNumeros?: boolean;
  /** Moss todavía no pregunta si comes carne: sin saberlo, no cuenta. */
  vegetariano?: boolean;
  /** Los partidos con fecha alrededor de hoy; sin esto, los de cada semana del cuestionario (partidosEntre). */
  partidos?: readonly Partido[];
  carrera?: Carrera | null;
  /** Las sesiones de hoy (de Salud o de Ascent); sin esto, las del cuestionario para ese día de la semana. */
  sesionesDeHoy?: readonly { tipo: Deporte; minutos: number }[];
  /**
   * Dos pesadas de hoy alrededor de una sesión (las horas, en minutos) y el agua anotada, en ml: entre las dos
   * pesadas (es sudor que se repuso) y después de la segunda (lo que ya tomaste).
   */
  pesadas?: {
    antes: { minutos: number; kg: number };
    despues: { minutos: number; kg: number };
    sesion: { inicio: number; minutos: number };
    aguaEntre?: number;
    aguaDespues?: number;
  } | null;
  /** Lo anotado con alcohol: el día, los minutos en la cuenta de ese día y los gramos. */
  alcohol?: readonly { dia: ClaveDia; minutos: number; gramos: number }[];
  /** Lo dormido las últimas 7 noches, en minutos (la de anoche, la última); null donde no hay noche. */
  noches?: readonly (number | null)[];
  /** Lo que necesitas dormir (necesidad, en sueno.ts), en minutos; 8 h si no llega. */
  necesidad?: number;
  /** La carga de entrenamiento de los 7 días que terminan hoy y la de cada una de las 4 semanas anteriores. */
  carga?: { semana: number; anteriores: readonly number[] } | null;
  /** Lo que corriste, salida por salida, con el día y los km (de Salud). */
  corridas?: readonly { dia: ClaveDia; km: number }[];
  /** Para la energía baja: el objetivo, la tendencia del peso de cada día y, si se sabe, lo comido y la masa magra. */
  energia?: {
    objetivo: Objetivo;
    tendencia: ReadonlyMap<ClaveDia, number>;
    /** Cada día anotado de las dos últimas semanas: lo comido y lo que gastó entrenando, en kcal. */
    dias?: readonly { dia: ClaveDia; kcal: number; entreno: number }[];
    masaMagra?: number | null;
  } | null;
  /** Ya se dijo y se tocó «No mostrar más»: la energía baja no vuelve. */
  energiaBajaDicha?: boolean;
  /** Lo anotado cada día de las dos últimas semanas: las kcal, la meta y el hierro y el calcio (mg; null, sin datos). */
  minerales?: readonly { dia: ClaveDia; kcal: number; meta: number; hierro: number | null; calcio: number | null }[];
};

/** De qué habla: dos del mismo tema no van juntos (paraHoy.ts también lo mira con los suyos). */
export type Tema = 'carbohidratos' | 'agua' | 'alcohol' | 'piernas' | 'minerales' | 'sueno' | 'energia';
export type SenalDeEnergia = 'bajaRapida' | 'tendencia' | 'disponibilidad';

/**
 * Lo que se dice. `donde`: «Para hoy», Sueño o la tarjeta de Inicio. Los números, solo los de su texto, y sin
 * ellos con «Mostrar números» apagado (y en la tarjeta, también con «sin déficit»).
 * - partido: hoy, mañana o entre dos partidos a menos de 72 h; esos días, la meta sin déficit.
 * - carrera: en cuántos días (1 o 2); esos días, la meta sin déficit.
 * - pesarse: lo perdido, cuánto tomar, si con algo salado y si la próxima vez conviene tomar más durante.
 * - minerales: si el hierro, el calcio o los dos.
 * - energiaBaja: de qué señal sale; con números, las semanas y las sesiones o las kcal de cada día.
 */
export type ConsejoDelDeporte =
  | { que: 'partido'; donde: 'paraHoy'; tema: 'carbohidratos'; cuando: 'hoy' | 'manana' | 'entrePartidos'; sinDeficit: true }
  | { que: 'carrera'; donde: 'paraHoy'; tema: 'carbohidratos'; faltan: number; sinDeficit: true }
  | { que: 'carbohidratos'; donde: 'paraHoy'; tema: 'carbohidratos' }
  | { que: 'pesarse'; donde: 'paraHoy'; tema: 'agua'; kg?: number; litros?: number; conSal: boolean; masDurante: boolean }
  | { que: 'alcohol'; donde: 'paraHoy'; tema: 'alcohol' }
  | { que: 'pico'; donde: 'paraHoy'; tema: 'piernas' }
  | { que: 'minerales'; donde: 'paraHoy'; tema: 'minerales'; hierro: boolean; calcio: boolean }
  | { que: 'partidoDeNoche'; donde: 'sueno'; tema: 'sueno' }
  | { que: 'cargaYSueno'; donde: 'sueno'; tema: 'sueno' }
  | { que: 'dormirMas'; donde: 'sueno'; tema: 'sueno' }
  | { que: 'energiaBaja'; donde: 'tarjeta'; tema: 'energia'; senal: SenalDeEnergia; semanas?: number; sesiones?: number; kcal?: number; entreno?: number };

/** Lo que con «sin déficit» no se dice: es de comer (los carbohidratos, el alcohol, el hierro y el calcio). */
const DE_COMER: ReadonlySet<ConsejoDelDeporte['que']> = new Set(['partido', 'carrera', 'carbohidratos', 'alcohol', 'minerales']);

const aDecimo = (x: number) => Math.round(x * 10) / 10;
const aCincuenta = (x: number) => Math.round(x / 50) * 50;
const promedio = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const conPartidos = (tipos: readonly Deporte[]) => tipos.includes('equipo') || tipos.includes('contacto');

// ------------------------------------------------------------ los partidos y la carrera (también para los avisos)
/** Los partidos de cada semana entre dos fechas: el día del cuestionario, con su hora y lo que dura ese deporte. */
export function partidosEntre(e: Pick<EntrenoDicho, 'sesiones' | 'partidos'> | null | undefined, desde: ClaveDia, hasta: ClaveDia): Partido[] {
  const p = e?.partidos;
  if (!p) return [];
  // Lo que dura: la sesión de partidos (o de choques) de ese día, o lo de fábrica.
  const sesion = (e?.sesiones ?? []).find((s) => (s.tipo === 'equipo' || s.tipo === 'contacto') && s.dias.includes(p.dia));
  const lista: Partido[] = [];
  for (let dia = desde; dia <= hasta; dia = sumarDias(dia, 1)) {
    if (diaDeLaSemana(dia) === p.dia) lista.push({ dia, hora: p.hora ?? null, minutos: sesion?.minutos ?? DURACION_DE_PARTIDO });
  }
  return lista;
}

/** Si mañana hay partido: el aviso «Mañana juegas» (loQueConviene.ts) y la regla 1. */
export const partidoManana = (dia: ClaveDia, partidos: readonly Partido[]) => partidos.some((p) => p.dia === sumarDias(dia, 1));

/** Cuántos días faltan para la carrera, si es larga (más de 90 minutos) y faltan 1 o 2; si no, null. */
export function diasParaLaCarrera(dia: ClaveDia, carrera: Carrera | null | undefined): number | null {
  if (!carrera || !(carrera.minutos > CARRERA_LARGA)) return null;
  const faltan = diasEntre(dia, carrera.fecha);
  return faltan >= 1 && faltan <= DIAS_DE_CARGA ? faltan : null;
}

/** De un partido al siguiente: con las dos horas, exacto; sin ellas, por días. */
const separacion = (a: Partido, b: Partido) => diasEntre(a.dia, b.dia) * 24 * 60 + (a.hora != null && b.hora != null ? b.hora - a.hora : 0);

function partido(hoy: ClaveDia, partidos: readonly Partido[]): 'hoy' | 'manana' | 'entrePartidos' | null {
  if (partidos.some((p) => p.dia === hoy)) return 'hoy';
  if (partidoManana(hoy, partidos)) return 'manana';
  const antes = partidos.filter((p) => p.dia < hoy);
  const despues = partidos.filter((p) => p.dia > hoy);
  return antes.some((a) => despues.some((b) => separacion(a, b) < ENTRE_PARTIDOS)) ? 'entrePartidos' : null;
}

/** Cuándo termina un partido, en minutos de su día; sin la hora, no se sabe. */
const finDe = (p: Partido) => (p.hora != null ? p.hora + (p.minutos ?? DURACION_DE_PARTIDO) : null);

// ------------------------------------------------------------ la energía baja
/** Las sesiones por semana y los minutos por semana del cuestionario: cada día de cada sesión cuenta una vez. */
const porSemana = (e: Pick<EntrenoDicho, 'sesiones'>) => ({
  sesiones: e.sesiones.reduce((t, s) => t + new Set(s.dias).size, 0),
  minutos: e.sesiones.reduce((t, s) => t + new Set(s.dias).size * s.minutos, 0),
});

type Energia = { senal: SenalDeEnergia; semanas?: number; sesiones?: number; kcal?: number; entreno?: number };

/** La señal de energía baja de estas dos semanas, si hay alguna: primero la del peso, que pesa más que lo anotado. */
export function senalDeEnergia(e: EntradaDelDeporte): Energia | null {
  const x = e.energia;
  if (!x || !e.entreno) return null;
  const t = (atras: number) => x.tendencia.get(sumarDias(e.hoy, -atras)) ?? null;
  /** Cuánto bajó la tendencia, en parte del peso, de hace `desde` días a hace `hasta` días. */
  const bajo = (desde: number, hasta: number) => {
    const a = t(desde);
    const b = t(hasta);
    return a !== null && b !== null && a > 0 ? (a - b) / a : null;
  };
  const { sesiones, minutos } = porSemana(e.entreno);
  // Más de un 1 % por semana con mucha carga, en cada una de las dos últimas semanas.
  if (minutos >= MUCHA_CARGA && [0, 7].every((d) => (bajo(d + 7, d) ?? 0) > BAJA_POR_SEMANA)) return { senal: 'bajaRapida' };
  // Mantener o subir, y la tendencia un 1 % abajo en 3 semanas: hoy, hace una semana y hace dos.
  if (x.objetivo !== 'bajar' && sesiones >= SESIONES_POR_SEMANA && [0, 7, 14].every((d) => (bajo(d + 21, d) ?? 0) >= BAJA_EN_TRES_SEMANAS)) {
    return { senal: 'tendencia', semanas: 3, sesiones };
  }
  // Lo anotado, con la masa magra: cada una de las dos semanas, con 6 de 7 días. Si el peso subió, lo anotado
  // no cierra (falta anotar): pesa más el peso.
  const magra = x.masaMagra ?? 0;
  const anotados = x.dias;
  if (magra > 0 && anotados) {
    const semana = (desde: number) => anotados.filter((d) => diasEntre(d.dia, e.hoy) >= desde && diasEntre(d.dia, e.hoy) < desde + 7);
    const bloques = [semana(0), semana(7)];
    const hoyKg = t(0);
    const antesKg = t(14);
    const subio = hoyKg !== null && antesKg !== null && hoyKg > antesKg;
    const queda = (b: typeof bloques[number]) => promedio(b.map((d) => d.kcal - d.entreno)) / magra;
    if (!subio && bloques.every((b) => b.length >= DIAS_ANOTADOS) && bloques.every((b) => queda(b) < DISPONIBILIDAD[e.sexo])) {
      const todos = bloques.flat();
      return { senal: 'disponibilidad', kcal: promedio(todos.map((d) => d.kcal)), entreno: promedio(todos.map((d) => d.entreno)) };
    }
  }
  return null;
}

// ------------------------------------------------------------ las once reglas
/** Lo que se dice hoy según el deporte, de lo que más importa a lo que menos, sin dos del mismo tema. */
export function segunElDeporte(e: EntradaDelDeporte): ConsejoDelDeporte[] {
  const ent = e.entreno;
  if (!ent || !ent.tipos.length) return [];
  const conNumeros = !e.sinNumeros;
  const partidos = e.partidos ?? partidosEntre(ent, sumarDias(e.hoy, -7), sumarDias(e.hoy, 7));
  const juega = conPartidos(ent.tipos);
  const ayer = juega ? partidos.find((p) => p.dia === sumarDias(e.hoy, -1)) : undefined;
  const lista: ConsejoDelDeporte[] = [];

  // 4. Pesarse antes y después: lo que se perdió, en las próximas horas (lo más urgente).
  const ps = e.pesadas;
  if (ps && ps.despues.minutos - ps.antes.minutos < PESADAS_A_MENOS_DE && ps.antes.minutos <= ps.sesion.inicio && ps.despues.minutos >= ps.sesion.inicio + ps.sesion.minutos) {
    const perdido = aDecimo(ps.antes.kg - ps.despues.kg);
    const litros = aDecimo(perdido * LITROS_POR_KILO);
    // El sudor de la sesión es lo perdido más lo que tomaste entre las dos pesadas.
    const sudorPorHora = (perdido + (ps.aguaEntre ?? 0) / 1000) / Math.max(1 / 60, ps.sesion.minutos / 60);
    if (perdido >= PERDIDA_MINIMA && (ps.aguaDespues ?? 0) / 1000 < litros) {
      lista.push({
        que: 'pesarse', donde: 'paraHoy', tema: 'agua', ...(conNumeros ? { kg: perdido, litros } : {}),
        conSal: ps.sesion.minutos > SESION_CON_SAL || sudorPorHora >= MUCHO_SUDOR,
        masDurante: perdido / ps.antes.kg > PERDIDA_PARA_TOMAR_DURANTE,
      });
    }
  }
  // 2. La carrera de más de 90 minutos: los dos días antes.
  const faltan = diasParaLaCarrera(e.hoy, e.carrera);
  if (faltan !== null) lista.push({ que: 'carrera', donde: 'paraHoy', tema: 'carbohidratos', faltan, sinDeficit: true });
  // 1. El partido: la víspera, el día y entre dos partidos a menos de 72 h.
  const cuando = juega ? partido(e.hoy, partidos) : null;
  if (cuando) lista.push({ que: 'partido', donde: 'paraHoy', tema: 'carbohidratos', cuando, sinDeficit: true });
  // 3. Una hora o más de resistencia o partidos hoy: el plato con más carbohidratos.
  const deHoy = e.sesionesDeHoy ?? sesionesDeUnDia(ent, diaDeLaSemana(e.hoy));
  if (deHoy.filter((s) => s.tipo === 'resistencia' || s.tipo === 'equipo').reduce((t, s) => t + s.minutos, 0) >= UNA_HORA) {
    lista.push({ que: 'carbohidratos', donde: 'paraHoy', tema: 'carbohidratos' });
  }
  // 9. El pico de distancia, para quien corre.
  if (ent.tipos.includes('resistencia') && e.corridas) {
    const hoyKm = Math.max(0, ...e.corridas.filter((c) => c.dia === e.hoy).map((c) => c.km));
    const antes = e.corridas.filter((c) => c.dia < e.hoy && diasEntre(c.dia, e.hoy) <= DIAS_DEL_PICO).map((c) => c.km);
    if (hoyKm > 0 && antes.length && hoyKm > PICO * Math.max(...antes)) lista.push({ que: 'pico', donde: 'paraHoy', tema: 'piernas' });
  }
  // 5. El alcohol después de jugar, al día siguiente: en las 12 h después del partido o, sin su hora, ese día.
  if (ayer && e.pesoKg && e.alcohol) {
    const fin = finDe(ayer);
    const minutoDe = (b: { dia: ClaveDia; minutos: number }) => diasEntre(ayer.dia, b.dia) * 24 * 60 + b.minutos;
    const gramos = e.alcohol.filter((b) => (fin !== null ? minutoDe(b) >= fin && minutoDe(b) <= fin + HORAS_DEL_ALCOHOL : b.dia === ayer.dia)).reduce((t, b) => t + b.gramos, 0);
    if (gramos >= ALCOHOL_POR_KILO * e.pesoKg) lista.push({ que: 'alcohol', donde: 'paraHoy', tema: 'alcohol' });
  }
  // 11. El hierro y el calcio, para quien corre, las mujeres y quien no come carne.
  const energia = senalDeEnergia(e);
  if (e.minerales && (ent.tipos.includes('resistencia') || e.sexo === 'f' || e.vegetariano)) {
    const bien = e.minerales.filter((d) => diasEntre(d.dia, e.hoy) >= 0 && diasEntre(d.dia, e.hoy) < DIAS_DE_MINERALES && d.meta > 0 && d.kcal >= BIEN_ANOTADO * d.meta);
    const deLos = (k: 'hierro' | 'calcio') => {
      const valores = bien.map((d) => d[k]).filter((v): v is number => v != null);
      return valores.length >= DIAS_BIEN_ANOTADOS ? promedio(valores) : null;
    };
    const quien = { sexo: e.sexo, edad: e.edad };
    const meta = (k: 'hierro' | 'calcio') => {
      const r = referenciaDe(k, quien);
      return r && 'meta' in r ? r.meta : 0;
    };
    const hierroDia = deLos('hierro');
    const calcioDia = deLos('calcio');
    const hierro = hierroDia !== null && hierroDia < meta('hierro');
    const calcio = calcioDia !== null && calcioDia < (energia ? Math.max(meta('calcio'), CALCIO_CON_ENERGIA_BAJA) : meta('calcio'));
    if (hierro || calcio) lista.push({ que: 'minerales', donde: 'paraHoy', tema: 'minerales', hierro, calcio });
  }

  // 6. El partido de noche: la mañana siguiente, en Sueño.
  const finDeAyer = ayer ? finDe(ayer) : null;
  if (finDeAyer !== null && finDeAyer > TERMINA_TARDE) lista.push({ que: 'partidoDeNoche', donde: 'sueno', tema: 'sueno' });
  const noches = (e.noches ?? []).slice(-7);
  const menor = e.edad < MAYORIA_DE_EDAD;
  // 8. Más carga y menos sueño.
  const anteriores = (e.carga?.anteriores ?? []).slice(-4);
  if (e.carga && anteriores.length === 4 && promedio(anteriores) > 0 && e.carga.semana >= SUBA_DE_CARGA * promedio(anteriores)
    && noches.filter((d) => d != null && d < (menor ? NOCHE_CORTA.menor : NOCHE_CORTA.adulto)).length >= NOCHES_CORTAS) {
    lista.push({ que: 'cargaYSueno', donde: 'sueno', tema: 'sueno' });
  }
  // 7. Dormir más en semanas de partidos, con una hora o más de deuda por noche.
  const lunes = lunesDe(e.hoy);
  const semanaDePartidos = juega && partidos.some((p) => p.dia >= lunes && p.dia <= sumarDias(lunes, 6));
  const medidas = noches.filter((d): d is number => d != null);
  const necesidad = menor ? Math.max(e.necesidad ?? 8 * 60, NECESIDAD_ANTES_DE_LOS_18) : (e.necesidad ?? 8 * 60);
  if (semanaDePartidos && medidas.length >= NOCHES_PARA_LA_DEUDA && promedio(medidas.map((d) => Math.max(0, necesidad - d))) >= DEUDA_POR_NOCHE) {
    lista.push({ que: 'dormirMas', donde: 'sueno', tema: 'sueno' });
  }

  // 10. La energía baja, una sola vez. Sin números con «Mostrar números» apagado o con «sin déficit».
  if (energia && !e.energiaBajaDicha) {
    const numeros = conNumeros && !e.sinDeficit;
    lista.push({
      que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: energia.senal,
      ...(numeros && energia.semanas ? { semanas: energia.semanas, sesiones: energia.sesiones } : {}),
      ...(numeros && energia.kcal !== undefined ? { kcal: aCincuenta(energia.kcal), entreno: aCincuenta(energia.entreno ?? 0) } : {}),
    });
  }

  // Con «sin déficit», nada de lo que es de comer; y nunca dos del mismo tema: queda el que importa más.
  const vistos = new Set<Tema>();
  return lista.filter((c) => {
    if ((e.sinDeficit && DE_COMER.has(c.que)) || vistos.has(c.tema)) return false;
    vistos.add(c.tema);
    return true;
  });
}

// ------------------------------------------------------------ las palabras
/** Lo que hace falta para escribir un consejo: las palabras del idioma y un número con sus decimales. */
export type ParaElTextoDelDeporte = {
  t: (clave: string, valores?: Record<string, string | number>) => string;
  numero: (n: number, decimales: number) => string;
};

const DEPORTE = 'inicio.paraHoy.deporte';

/** Lo que dice un consejo de «Para hoy» o de Sueño, en una o dos frases cortas. */
export function textoDelDeporte(c: ConsejoDelDeporte, h: ParaElTextoDelDeporte): string {
  const de = (clave: string, valores?: Record<string, string | number>) => h.t(`${DEPORTE}.${clave}`, valores);
  switch (c.que) {
    case 'partido':
      return de(`partido.${c.cuando}`);
    case 'carrera':
      return de(c.faltan === 1 ? 'carrera.manana' : 'carrera.pasadoManana');
    case 'carbohidratos':
      return de('carbohidratos');
    case 'pesarse': {
      const sal = c.conSal ? 'ConSal' : '';
      const base = c.kg !== undefined && c.litros !== undefined
        ? de(`pesarse.texto${sal}`, { kg: h.numero(c.kg, 1), litros: h.numero(c.litros, 1) })
        : de(`pesarse.sinNumeros${sal}`);
      return c.masDurante ? `${base} ${de('pesarse.masDurante')}` : base;
    }
    case 'alcohol':
      return de('alcohol');
    case 'pico':
      return de('pico');
    case 'minerales':
      return de(c.hierro && c.calcio ? 'minerales.ambos' : c.hierro ? 'minerales.hierro' : 'minerales.calcio');
    case 'partidoDeNoche':
    case 'cargaYSueno':
    case 'dormirMas':
      return h.t(`sueno.deporte.${c.que}`);
    case 'energiaBaja':
      return h.t('inicio.energiaBaja.texto');
  }
}

/**
 * La tarjeta de la energía baja: el título, el texto de 5.12 y de qué sale. Del peso nunca dice cuánto: solo
 * que lo vio ahí (nada del peso como meta); con números, las sesiones o lo comido y lo de entrenar.
 */
export function tarjetaDeEnergia(c: Extract<ConsejoDelDeporte, { que: 'energiaBaja' }>, h: ParaElTextoDelDeporte): { titulo: string; texto: string; deQueSale: string } {
  const sale = `inicio.energiaBaja.deQueSale.${c.senal}`;
  const deQueSale = c.senal === 'bajaRapida' ? h.t(sale)
    : c.senal === 'tendencia' && c.semanas !== undefined && c.sesiones !== undefined ? h.t(`${sale}.conNumeros`, { semanas: c.semanas, sesiones: c.sesiones })
      : c.senal === 'disponibilidad' && c.kcal !== undefined && c.entreno !== undefined ? h.t(`${sale}.conNumeros`, { kcal: h.numero(c.kcal, 0), entreno: h.numero(c.entreno, 0) })
        : h.t(`${sale}.sinNumeros`);
  return { titulo: h.t('inicio.energiaBaja.titulo'), texto: h.t('inicio.energiaBaja.texto'), deQueSale };
}
