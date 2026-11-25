// Lo que se contesta en el cuestionario nuevo (la entrada y «Tus respuestas»), como en la galería
// (galeria/src/entrada.js): lo contestado, qué preguntas aparecen con eso, lo que sale (la meta, las reglas de
// los cuidados y el plan) y lo que se guarda. Las cuentas son las del dominio: cuestionario.ts, cuidados.ts y
// progreso.ts.

import type { CuestionarioNuevo, Estado } from '@/almacen/almacen';
import { CON_HORA, HORA_TIPICA } from '@/dominio/comidas';
import {
  actividadEquivalente, DEPORTES, eleccionDe, entrenaFuerza, entrenoParaGuardar, gastoEstimado, grasaDeFigura, loQueSigue, metaDelCuestionario, movimientoPorPasos,
  NOCHES_PARA_NO_PREGUNTAR, pctDelPlan, pesoMetaSugerido, preguntasDelEntreno, rangoDelPesoMeta, ritmoSugerido,
  type Deporte, type Despues, type EntrenoDicho, type Experiencia, type GrasaDicha, type Horarios, type MetaDelCuestionario, type Movimiento,
  type NivelDeProteina, type ObjetivoDicho, type ParaLoQueSigue, type Respuestas, type RespuestasGuardadas,
} from '@/dominio/cuestionario';
import { rangoDeGrasa } from '@/dominio/cuerpo';
import { fechaProbableDe, metaDelCuestionarioConCuidados, reglasDe, semanaDeEmbarazo, semanasDesdeElParto, sinDeficitDe, type Cuidado, type CuidadosGuardados, type DatosDelCuidado, type Reglas } from '@/dominio/cuidados';
import { sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { edadDe, MAYORIA_DE_EDAD, RITMOS, ritmoPermitido, type Cuestionario, type Estilo, type Ritmo, type Sexo } from '@/dominio/metas';
import type { Dieta } from '@/dominio/plan';
import { plazoConFecha, plazoConRitmo, type EntradaDelPlazo, type Plazo } from '@/dominio/progreso';
import { horario, ultimasNoches, type Noche } from '@/dominio/sueno';

export type Principal = (typeof CON_HORA)[number];
export type DeCadaDeporte = { dias: DiaSemana[]; hora: number; minutos: number };
export type ModoDeGrasa = 'no' | 'dicha' | 'imagen' | 'cinta';
/** Lo que se pregunta además de cada cuidado, como se contesta: la semana y las semanas desde el parto se guardan como fechas. */
export type DatosDeCuidado = { semana: number; pesoAntes: number | null; mellizos: boolean; semanasParto: number; soloPecho: boolean; bajaElAzucar: boolean | null; dialisis: boolean };

/**
 * Lo contestado. Con Salud, la edad, el sexo, la altura y el peso vienen de ahí. Cada deporte tiene sus días, su
 * hora y cuánto dura en `entreno.de`; los elegidos están en `entreno.tipos` (vacío: no entrena, y lo de cada uno
 * espera por si cambia de idea). Una comida en `noSuele` no se suele hacer.
 */
export type Contestado = {
  salud: boolean; edad: number; sexo: Sexo | null; alturaCm: number; pesoKg: number;
  /** Lo que sugirieron los pasos de Salud, si los hubo, y cuántos son por día. */
  movimientoSugerido: Movimiento | null;
  pasosDeSalud?: number | null;
  cuidados: Cuidado[]; consentido: boolean; datosCuidado: DatosDeCuidado;
  grasaModo: ModoDeGrasa; grasaPct: number; figura: number | null; cinta: { cintura: number; cuello: number; cadera: number };
  movimiento: Movimiento;
  entreno: { tipos: Deporte[]; de: Record<Deporte, DeCadaDeporte>; viaje: number; partidos: boolean; diaDePartido: DiaSemana; horaDePartido: number | null; categoriaDePeso: boolean };
  objetivo: ObjetivoDicho; pesoMeta: number | null; ritmo: Ritmo; fecha: ClaveDia | null; experiencia: Experiencia; despues: Despues;
  estilo: Estilo; proteina: NivelDeProteina; dieta: Dieta;
  horarios: Record<Principal, number>; noSuele: Partial<Record<Principal, boolean>>;
  sueno: { despertar: number; acostarse: number; finDeSemana: 'igual' | 'tarde' };
};

export const DE_FABRICA: Contestado = {
  salud: false, edad: 29, sexo: null, alturaCm: 172, pesoKg: 74.5, movimientoSugerido: null,
  cuidados: [], consentido: false,
  datosCuidado: { semana: 20, pesoAntes: null, mellizos: false, semanasParto: 8, soloPecho: true, bajaElAzucar: null, dialisis: false },
  grasaModo: 'no', grasaPct: 18, figura: null, cinta: { cintura: 86, cuello: 38, cadera: 98 },
  movimiento: 'sentado',
  entreno: {
    tipos: ['fuerza'],
    de: {
      fuerza: { dias: [1, 3, 5], hora: 18 * 60, minutos: 60 },
      equipo: { dias: [2, 4], hora: 20 * 60, minutos: 90 },
      resistencia: { dias: [2, 6], hora: 7 * 60 + 30, minutos: 45 },
      contacto: { dias: [2, 4], hora: 20 * 60, minutos: 90 },
    },
    viaje: 15, partidos: false, diaDePartido: 6, horaDePartido: null, categoriaDePeso: false,
  },
  objetivo: 'mantener', pesoMeta: null, ritmo: 'recomendado', fecha: null, experiencia: 'principiante', despues: 'mantener',
  estilo: 'equilibrada', proteina: 'recomendada', dieta: 'todo',
  horarios: { ...HORA_TIPICA }, noSuele: {},
  sueno: { despertar: 7 * 60, acostarse: 23 * 60, finDeSemana: 'igual' },
};

// ------------------------------------------------------------------ lo que sale de lo contestado
export const sexoDe = (r: Contestado): Sexo => r.sexo ?? 'm';
export const cambiaPeso = (r: Pick<Contestado, 'objetivo'>) => r.objetivo === 'bajar' || r.objetivo === 'subir';

/** Lo que entrena, como lo recibe la regla: los deportes, la sesión de cada uno, el viaje, los partidos y la categoría de peso. */
export function entrenoDicho(r: Contestado): EntrenoDicho | null {
  const e = r.entreno;
  const tipos = DEPORTES.filter((t) => e.tipos.includes(t));
  if (!tipos.length) return null;
  const preguntas = preguntasDelEntreno(tipos);
  return {
    tipos,
    sesiones: tipos.map((tipo) => ({ tipo, dias: [...e.de[tipo].dias], hora: e.de[tipo].hora, minutos: e.de[tipo].minutos })),
    viaje: e.viaje,
    partidos: preguntas.partidos && e.partidos ? { dia: e.diaDePartido, hora: e.horaDePartido } : null,
    categoriaDePeso: preguntas.categoriaDePeso ? e.categoriaDePeso : null,
  };
}
export const levantaPesas = (r: Contestado) => entrenaFuerza(entrenoDicho(r));
/** El deporte que lleva el día del partido: el de partidos o, si no, el de choques. */
export const deporteDelPartido = (r: Contestado): Deporte => (r.entreno.tipos.includes('equipo') ? 'equipo' : 'contacto');

/** Lo que se pregunta además de lo marcado, como lo recibe la regla. */
export function datosDelCuidado(r: Contestado, hoy: ClaveDia): DatosDelCuidado {
  const d = r.datosCuidado;
  const datos: DatosDelCuidado = {};
  if (r.cuidados.includes('embarazo')) datos.embarazo = { fechaProbable: fechaProbableDe(d.semana, hoy), pesoAntes: d.pesoAntes, mellizos: d.mellizos };
  if (r.cuidados.includes('lactancia')) datos.lactancia = { parto: sumarDias(hoy, -7 * d.semanasParto), soloPecho: d.soloPecho };
  if (r.cuidados.includes('diabetes2')) datos.diabetes2 = { bajaElAzucar: d.bajaElAzucar };
  if (r.cuidados.includes('renal')) datos.renal = { dialisis: d.dialisis };
  return datos;
}

/** El movimiento de tu día: lo elegido o, si lo sugirieron los pasos de Salud y no se cambió, esa sugerencia corregida con lo que entrenas. */
export function movimientoUsado(r: Contestado, pasos: number | null): Movimiento {
  if (!r.salud || !r.movimientoSugerido || r.movimiento !== r.movimientoSugerido) return r.movimiento;
  return movimientoPorPasos(pasos ?? r.pasosDeSalud, entrenoDicho(r)?.tipos ?? []) ?? r.movimiento;
}

/** Las reglas de lo marcado (cuidados.ts), con el nivel de actividad que más se parece al gasto sin la grasa. */
export function reglasDeAhora(r: Contestado, hoy: ClaveDia, pasos: number | null = null): Reglas {
  const persona = { edad: r.edad, sexo: sexoDe(r), alturaCm: r.alturaCm, pesoKg: r.pesoKg, grasa: null };
  const actividad = actividadEquivalente(gastoEstimado({ ...persona, movimiento: movimientoUsado(r, pasos), entreno: entrenoDicho(r) }));
  return reglasDe(r.cuidados, datosDelCuidado(r, hoy), { sexo: sexoDe(r), edad: r.edad, alturaCm: r.alturaCm, pesoKg: r.pesoKg, actividad, dieta: r.dieta }, hoy);
}
export const sinDeficit = (r: Contestado, hoy: ClaveDia) => r.cuidados.length > 0 && sinDeficitDe(reglasDeAhora(r, hoy));
/** Lo que sigue a la meta, como lo recibe la regla (cuestionario.ts, opcionesDeLoQueSigue). */
export const paraLoQueSigue = (r: Contestado, hoy: ClaveDia): ParaLoQueSigue => ({ objetivo: r.objetivo, pesoMeta: r.pesoMeta, alturaCm: r.alturaCm, sinDeficit: sinDeficit(r, hoy) });
/** Lo elegido para después de la meta si todavía se puede (o si vino de otra versión); si no, mantener. */
export const despuesDe = (r: Contestado, hoy: ClaveDia) => loQueSigue(paraLoQueSigue(r, hoy), r.despues);
/** La grasa se pregunta desde los 18 y sin cuidados: las figuras y el porcentaje no le hacen bien a quien cuida lo que come. */
export const preguntaGrasa = (r: Contestado) => !r.cuidados.length && r.edad >= MAYORIA_DE_EDAD;

export const medidasDeCinta = (r: Contestado) => (sexoDe(r) === 'f' ? { ...r.cinta } : { cintura: r.cinta.cintura, cuello: r.cinta.cuello });
export function grasaDicha(r: Contestado): GrasaDicha | null {
  if (!preguntaGrasa(r)) return null;
  if (r.grasaModo === 'dicha') return { como: 'dicha', pct: r.grasaPct };
  if (r.grasaModo === 'imagen' && r.figura !== null) return { como: 'imagen', pct: grasaDeFigura(sexoDe(r), r.figura) };
  if (r.grasaModo === 'cinta') {
    const x = rangoDeGrasa(sexoDe(r), r.alturaCm, medidasDeCinta(r));
    return x ? { como: 'cinta', pct: Math.round(x.estimado * 10) / 10 } : null;
  }
  return null;
}

const persona = (r: Contestado, hoy: ClaveDia) => ({ edad: r.edad, sexo: sexoDe(r), alturaCm: r.alturaCm, pesoKg: r.pesoKg, sinDeficit: sinDeficit(r, hoy), grasa: grasaDicha(r) });
const gastoTotal = (r: Contestado, hoy: ClaveDia, pasos: number | null) => gastoEstimado({ ...persona(r, hoy), movimiento: movimientoUsado(r, pasos), entreno: entrenoDicho(r) }).total;

function entradaDelPlazo(r: Contestado, hoy: ClaveDia, pasos: number | null): EntradaDelPlazo {
  return { hoy, pesoKg: r.pesoKg, pesoMeta: r.pesoMeta ?? r.pesoKg, sexo: sexoDe(r), edad: r.edad, gasto: gastoTotal(r, hoy, pasos), entrenaFuerza: levantaPesas(r) };
}
/** El ritmo de cada opción, en % del peso por semana: antes de los 18, bajando, «Rápido» queda en el recomendado. */
export function pctDe(r: Contestado, ritmo: Ritmo): number {
  const objetivo = r.objetivo === 'bajar' || r.objetivo === 'subir' ? r.objetivo : 'bajar';
  return Math.abs(RITMOS[objetivo][ritmoPermitido({ edad: r.edad, objetivo, ritmo })]);
}
export const plazoDeRitmo = (r: Contestado, hoy: ClaveDia, ritmo: Ritmo, pasos: number | null = null): Plazo | null =>
  cambiaPeso(r) && r.pesoMeta !== null ? plazoConRitmo(entradaDelPlazo(r, hoy, pasos), pctDe(r, ritmo)) : null;

/**
 * El plazo de lo elegido. Con una fecha, el ritmo que pide; pero antes de los 18, bajando, la meta no pasa del
 * recomendado (pctDelPlan), y el plan llega cuando llega a ese ritmo.
 */
export function plazoElegido(r: Contestado, hoy: ClaveDia, pasos: number | null = null): Plazo | null {
  if (!cambiaPeso(r) || r.pesoMeta === null) return null;
  if (!r.fecha) return plazoDeRitmo(r, hoy, r.ritmo, pasos);
  const e = entradaDelPlazo(r, hoy, pasos);
  const conFecha = plazoConFecha(e, r.fecha);
  const usado = conFecha && pctDelPlan({ edad: r.edad, objetivo: r.objetivo, sinDeficit: sinDeficit(r, hoy), pct: conFecha.pct, pesoKg: r.pesoKg });
  return usado && usado < conFecha.pct ? plazoConRitmo(e, usado) : conFecha;
}

export function respuestasPara(r: Contestado, hoy: ClaveDia, pasos: number | null = null): Respuestas {
  const plazo = r.fecha ? plazoElegido(r, hoy, pasos) : null;
  return {
    ...persona(r, hoy), movimiento: movimientoUsado(r, pasos), entreno: entrenoDicho(r), objetivo: r.objetivo, ritmo: r.ritmo,
    pct: plazo ? plazo.pct : null, estilo: r.estilo, proteina: r.proteina,
  };
}

/** La meta: con cuidados, la de cuidados.ts; con diálisis (o embarazada antes de los 18) Moss no calcula: queda la de siempre, sin déficit. */
export function metaDeAhora(r: Contestado, hoy: ClaveDia, pasos: number | null = null): MetaDelCuestionario {
  const resp = respuestasPara(r, hoy, pasos);
  return (r.cuidados.length ? metaDelCuestionarioConCuidados(resp, reglasDeAhora(r, hoy, pasos)) : null) ?? metaDelCuestionario(resp);
}

/** Bajando o subiendo, siempre hay un peso meta: el que se propone, si todavía no se eligió (o quedó fuera de lo posible). */
export function conPesoMeta(r: Contestado): Contestado {
  if (r.objetivo !== 'bajar' && r.objetivo !== 'subir') return r;
  const rango = rangoDelPesoMeta(r.pesoKg, r.alturaCm, r.objetivo);
  if (r.pesoMeta !== null && rango && r.pesoMeta >= rango[0] && r.pesoMeta <= rango[1]) return r;
  return { ...r, pesoMeta: pesoMetaSugerido(r.pesoKg, r.alturaCm, r.objetivo) ?? (rango ? rango[0] : r.pesoKg) };
}

/** Al cambiar lo que quiere lograr, el peso meta, la fecha y el ritmo vuelven a lo que se propone; al tocar el mismo, quedan. */
export function conObjetivo(r: Contestado, objetivo: ObjetivoDicho): Contestado {
  const cambio = objetivo !== r.objetivo;
  const nuevo: Contestado = { ...r, objetivo, ...(cambio ? { pesoMeta: null, fecha: null, ritmo: ritmoSugerido(objetivo, levantaPesas(r) ? r.experiencia : null) } : {}) };
  return conPesoMeta(nuevo);
}

/** Lo que no se puede elegir con lo contestado: sin déficit, ni bajar ni recomponer; sin lugar para bajar, tampoco; en el embarazo, ni subir. */
export function objetivosQueNo(r: Contestado, hoy: ClaveDia): { bajar: 'sinDeficit' | 'sinLugar' | null; subir: boolean; recomponer: boolean } {
  const sinD = sinDeficit(r, hoy);
  const sinLugar = !rangoDelPesoMeta(r.pesoKg, r.alturaCm, 'bajar');
  return { bajar: sinD ? 'sinDeficit' : sinLugar ? 'sinLugar' : null, subir: r.cuidados.length > 0 && !reglasDeAhora(r, hoy).subir, recomponer: sinD };
}
/** El objetivo, si con lo contestado después ya no se puede: mantener. */
export function objetivoPosible(r: Contestado, hoy: ClaveDia): Contestado {
  const no = objetivosQueNo(r, hoy);
  const fuera = (r.objetivo === 'bajar' && no.bajar) || (r.objetivo === 'subir' && no.subir) || (r.objetivo === 'recomponer' && no.recomponer);
  return fuera ? conObjetivo(r, 'mantener') : r;
}

/** Con tres noches en Salud, el sueño no se pregunta: la hora de dormirse y de despertarse, del horario si alcanza. */
export function suenoDeSalud(r: Contestado, noches: readonly Noche[], hoy: ClaveDia): { despertar: number; dormirse: number } | null {
  if (!r.salud) return null;
  const ultimas = ultimasNoches([...noches], hoy, 14);
  const medidas = ultimas.filter((n): n is Noche => n !== null);
  if (medidas.length < NOCHES_PARA_NO_PREGUNTAR) return null;
  const h = horario(ultimas);
  const promedio = (k: 'despertar' | 'dormirse') => medidas.reduce((s, n) => s + n[k], 0) / medidas.length;
  // Las horas de las noches cuentan desde las 18: se pasan a las del reloj, de a 5 minutos.
  const reloj = (x: number) => (Math.round(x / 5) * 5 + 18 * 60) % 1440;
  return { despertar: reloj(h ? h.despertar : promedio('despertar')), dormirse: reloj(h ? h.dormirse : promedio('dormirse')) };
}

// ------------------------------------------------------------------ las preguntas
export type Pregunta =
  | 'salud' | 'tu' | 'sexo' | 'edad' | 'altura' | 'peso' | 'cuidado' | 'grasa' | 'movimiento' | 'entreno' | 'cuando'
  | 'objetivo' | 'experiencia' | 'meta' | 'despues' | 'comer' | 'dia';

/**
 * Una pregunta por pantalla, con lo que va junto agrupado. `si`: cuándo aparece (con Salud, los cuatro datos van
 * en una tarjeta para confirmar; la grasa, desde los 18 y sin cuidados; la experiencia, al subir o recomponer con
 * pesas; el peso meta y lo que sigue, al bajar o subir). Lo que no aparece se saltea.
 */
export const PREGUNTAS: readonly { id: Pregunta; si?: (r: Contestado) => boolean }[] = [
  { id: 'salud' },
  { id: 'tu', si: (r) => r.salud },
  { id: 'sexo', si: (r) => !r.salud },
  { id: 'edad', si: (r) => !r.salud },
  { id: 'altura', si: (r) => !r.salud },
  { id: 'peso', si: (r) => !r.salud },
  { id: 'cuidado' },
  { id: 'grasa', si: preguntaGrasa },
  { id: 'movimiento' },
  { id: 'entreno' },
  { id: 'cuando', si: (r) => r.entreno.tipos.length > 0 },
  { id: 'objetivo' },
  { id: 'experiencia', si: (r) => (r.objetivo === 'subir' || r.objetivo === 'recomponer') && levantaPesas(r) },
  { id: 'meta', si: cambiaPeso },
  { id: 'despues', si: cambiaPeso },
  { id: 'comer' },
  { id: 'dia' },
];
export const aplica = (id: Pregunta, r: Contestado) => PREGUNTAS.find((p) => p.id === id)?.si?.(r) ?? true;
/** Las preguntas que aparecen con lo contestado, desde `desde`. */
export const preguntasDe = (r: Contestado, desde: Pregunta = 'salud') => PREGUNTAS.slice(PREGUNTAS.findIndex((p) => p.id === desde)).filter((p) => aplica(p.id, r)).map((p) => p.id);
/** El lugar de una pregunta entre las que aparecen (la de ahora cuenta aunque ya no aplique), y cuántas son. */
export function lugarDe(id: Pregunta, r: Contestado, desde: Pregunta = 'salud'): { i: number; total: number } {
  const lista = PREGUNTAS.slice(PREGUNTAS.findIndex((p) => p.id === desde)).filter((p) => p.id === id || aplica(p.id, r)).map((p) => p.id);
  return { i: lista.indexOf(id), total: lista.length };
}

// ------------------------------------------------------------------ lo que se guarda
/** Los cuidados como quedan en el teléfono: lo marcado y lo que se preguntó de eso. */
export const cuidadosParaGuardar = (r: Contestado, hoy: ClaveDia): CuidadosGuardados => ({ marcados: [...r.cuidados], datos: datosDelCuidado(r, hoy) });

/** Lo que se guarda al final: el perfil de siempre (con lo que más se parece) y lo nuevo, con la meta que salió. */
export function paraGuardar(r: Contestado, hoy: ClaveDia, noches: readonly Noche[], pasos: number | null = null): { c: Cuestionario; nuevo: CuestionarioNuevo } {
  const meta = metaDeAhora(r, hoy, pasos);
  const reglas = reglasDeAhora(r, hoy, pasos);
  const resp = respuestasPara(r, hoy, pasos);
  const usaPeso = cambiaPeso(r) && meta.objetivo !== 'mantener';
  const deSalud = suenoDeSalud(r, noches, hoy);
  const respuestas: RespuestasGuardadas = {
    movimiento: resp.movimiento,
    grasa: resp.grasa ?? null,
    experiencia: levantaPesas(r) ? r.experiencia : null,
    despues: usaPeso ? despuesDe(r, hoy) : null,
    proteina: r.proteina,
    recomponer: meta.recomponer,
    fecha: usaPeso ? r.fecha : null,
    // Lo que el control sigue: la proteína elegida, por kilo, y el ritmo de la fecha (o el de la recomposición).
    eleccion: eleccionDe(resp),
    horarios: Object.fromEntries(CON_HORA.map((c) => [c, r.noSuele[c] ? null : r.horarios[c]])) as Horarios,
    sueno: deSalud ? { despertar: deSalud.despertar, acostarse: deSalud.dormirse, finDeSemana: null } : { ...r.sueno },
    salud: r.salud,
  };
  const manuales = r.cuidados.length > 0 && reglas.manuales;
  return {
    c: {
      edad: r.edad, sexo: sexoDe(r), alturaCm: r.alturaCm, pesoKg: r.pesoKg, actividad: meta.actividad, objetivo: meta.objetivo,
      ritmo: ritmoPermitido({ edad: r.edad, objetivo: meta.objetivo, ritmo: r.ritmo }), sinDeficit: r.cuidados.length > 0 && sinDeficitDe(reglas),
    },
    nuevo: {
      respuestas,
      cuidados: cuidadosParaGuardar(r, hoy),
      entreno: entrenoParaGuardar(entrenoDicho(r)),
      meta: manuales ? null : { gasto: meta.gasto.total, metas: meta.metas },
      perfil: { estilo: r.estilo, dieta: r.dieta, pesoMeta: usaPeso && r.pesoMeta !== null ? r.pesoMeta : undefined },
    },
  };
}

/** Lo guardado, para contestarlo otra vez desde Perfil («Tus respuestas»): lo que no se sabe, como viene de fábrica. */
export function desdeLoGuardado(e: Pick<Estado, 'perfil' | 'pesos' | 'hoy' | 'respuestas' | 'cuidados' | 'entreno'>): Contestado {
  const p = e.perfil;
  if (!p) return DE_FABRICA;
  const g = e.respuestas;
  const peso = e.pesos[e.pesos.length - 1]?.kg ?? DE_FABRICA.pesoKg;
  const r: Contestado = {
    ...DE_FABRICA,
    salud: g?.salud ?? false, edad: edadDe(p, e.hoy), sexo: p.sexo, alturaCm: p.alturaCm, pesoKg: peso,
    objetivo: g?.recomponer ? 'recomponer' : p.objetivo, ritmo: p.ritmo, pesoMeta: p.pesoMeta ?? null, fecha: g?.fecha ?? null,
    estilo: p.estilo ?? 'equilibrada', dieta: p.comer?.dieta ?? 'todo',
  };
  if (g) {
    r.movimiento = g.movimiento;
    r.proteina = g.proteina;
    if (g.experiencia) r.experiencia = g.experiencia;
    if (g.despues) r.despues = g.despues;
    // De la figura o de la cinta solo queda el porcentaje: vuelve como dicho, así guardar sin tocarla no la pierde.
    if (g.grasa) {
      r.grasaModo = 'dicha';
      r.grasaPct = g.grasa.pct;
    }
    r.horarios = Object.fromEntries(CON_HORA.map((c) => [c, g.horarios[c] ?? HORA_TIPICA[c]])) as Contestado['horarios'];
    r.noSuele = Object.fromEntries(CON_HORA.filter((c) => g.horarios[c] === null).map((c) => [c, true]));
    if (g.sueno) r.sueno = { despertar: g.sueno.despertar, acostarse: g.sueno.acostarse, finDeSemana: g.sueno.finDeSemana ?? 'igual' };
  }
  const c = e.cuidados;
  if (c) {
    r.cuidados = c.marcados.filter((x) => p.sexo === 'f' || (x !== 'embarazo' && x !== 'lactancia'));
    r.consentido = r.cuidados.length > 0;
    const d = c.datos;
    r.datosCuidado = {
      ...DE_FABRICA.datosCuidado,
      ...(d.embarazo ? { semana: Math.min(42, Math.max(1, semanaDeEmbarazo(d.embarazo.fechaProbable, e.hoy))), pesoAntes: d.embarazo.pesoAntes, mellizos: d.embarazo.mellizos } : {}),
      ...(d.lactancia ? { semanasParto: Math.min(104, semanasDesdeElParto(d.lactancia.parto, e.hoy)), soloPecho: d.lactancia.soloPecho } : {}),
      ...(d.diabetes2 ? { bajaElAzucar: d.diabetes2.bajaElAzucar } : {}),
      ...(d.renal ? { dialisis: d.renal.dialisis } : {}),
    };
  }
  const en = e.entreno;
  if (en) {
    const sesiones = en.tipos?.length && en.sesiones?.length ? en.sesiones : en.tipo !== 'mixta' ? [{ tipo: en.tipo, dias: en.dias, hora: en.hora, minutos: en.minutos }] : [];
    const de = { ...DE_FABRICA.entreno.de };
    for (const s of sesiones) de[s.tipo] = { dias: [...s.dias], hora: s.hora, minutos: s.minutos };
    r.entreno = {
      ...DE_FABRICA.entreno, de, tipos: sesiones.map((s) => s.tipo), viaje: en.viaje ?? DE_FABRICA.entreno.viaje,
      partidos: !!en.partidos, diaDePartido: en.partidos?.dia ?? 6, horaDePartido: en.partidos?.hora ?? null, categoriaDePeso: !!en.categoriaDePeso,
    };
    // «Mixta» de Perfil no dice qué deportes: se pregunta de nuevo, con pesas de fábrica.
    if (!sesiones.length) r.entreno.tipos = ['fuerza'];
  } else if (g) r.entreno = { ...DE_FABRICA.entreno, tipos: [] };
  return r;
}
