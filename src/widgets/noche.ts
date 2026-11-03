// El widget de la noche (spec/sueno-sin-esfuerzo.md, 5; spec/widgets.md, D43): a la mañana, «Anoche» con
// las dos horas y «Sí»; a la tardecita, «A dormir» con la hora y cuánto falta. Moss estima la noche al
// abrirse, así que deja armada desde antes la de la mañana que viene: lo de siempre y, si se le pasa, la
// hora del despertador. Al abrir Moss, el «Sí» del widget confirma la noche solo si coincide con lo que
// estimó; si no, Moss pregunta como siempre. Con un reloj o un anillo, muestra lo medido, sin botón.

import type { Estado } from '@/almacen/almacen';
import { horaDeReloj } from '@/dominio/avisos';
import { partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { conNochesDeMoss, habitualDe, nocheDeMoss, quePreguntar, type Zona } from '@/dominio/sinReloj';
import type { Noche, NochePropia } from '@/dominio/sueno';
import { DESDE_LAS, nocheDeAhora } from '@/salud/nocheSinReloj';
import type { PropsNoche } from './tipos';

/** Cuánto puede separarse cada hora del widget de la estimada para que sea la misma noche, en minutos. */
export const COINCIDE = 20;

export type TextosDeLaNoche = {
  anoche: string; si: string; fueAsi: string; confirmada: string; seVeEnMoss: string; seAnotaEnMoss: string;
  /** Con {desde} y {hasta}. */
  horas: string;
  /** Con {h} y {m}. */
  duracion: string;
  /** Lo grande del chico: «7 h 36». Con {h} y {m}. */
  horasCorto: string;
  siLargo: string;
  aDormir: string;
  /** «en 1 h 30». Con {tiempo}. */
  enTiempo: string;
  /** Con {m}. */
  minutos: string;
  yaEsHora: string;
  /** «para despertarte a las 07:15». Con {hora}. */
  paraDespertar: string;
};

/** Lo que el «Sí» del widget dijo de una noche: las horas que mostraba (en minutos desde las 18) y cuándo. */
export type ConfirmacionDelWidget = { clave: ClaveDia; dormirse: number; despertar: number; en: number };

type Entrada = { date: Date; props: PropsNoche };
type ParaLaNoche = Pick<Estado, 'hoy' | 'noches' | 'salud' | 'metas'>;

/** «07:10» de unos minutos desde las 18 del día anterior. */
export function reloj(minutos: number): string {
  const m = (((Math.round(minutos) + 18 * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

const conVariables = (texto: string, v: Record<string, string | number>) => texto.replace(/\{(\w+)\}/g, (marca, k: string) => (k in v ? String(v[k]) : marca));

/**
 * La noche que se espera para `clave` si no hay nada medido: lo de siempre (de a 5 minutos) y, con
 * el despertador de Moss, su hora para despertar. Sin historia, null.
 */
export function nocheEsperada(noches: Noche[], clave: ClaveDia, despertador: number | null = null): { dormirse: number; despertar: number } | null {
  const h = habitualDe(noches, clave);
  if (!h) return null;
  const de5 = (x: number) => Math.round(x / 5) * 5;
  return { dormirse: de5(h.dormirse), despertar: despertador ?? de5(h.despertar) };
}

/** Si en las dos últimas semanas hubo una noche de un reloj o un anillo: entonces no se propone nada. */
export const conAparato = (salud: Estado['salud'], hoy: ClaveDia) =>
  (salud?.noches ?? []).some((n) => n.clave >= sumarDias(hoy, -14) && (n.fuente.tipo === 'reloj' || n.fuente.tipo === 'otra'));

/** «A dormir» se ve desde las 19, o desde cinco horas antes, lo que sea más tarde, y hasta 90 minutos después. */
export const A_DORMIR_DESDE = 19 * 60;
export const A_DORMIR_ANTES = 5 * 60;
export const A_DORMIR_DESPUES = 90;

/**
 * La línea de tiempo: la noche de ahora, la de la mañana que viene (desde las 4) y, por si Moss no
 * se abre en dos días, una sin nada. `esperando` es un «Sí» que todavía no se pudo comparar: queda.
 */
export function lineaDeLaNoche(e: ParaLaNoche, d: {
  ahora: Date;
  zona: Zona;
  textos: TextosDeLaNoche;
  url: string;
  esperando?: ConfirmacionDelWidget | null;
  /** La hora del despertador de Moss para mañana, en minutos desde las 18 del día anterior. */
  despertador?: number | null;
  /**
   * A qué hora ir a la cama y despertarse mañana, en minutos desde la medianoche del día de la noche de
   * ahora (nocheDeAhora, no el día de Moss). Sin hora, no hay «A dormir».
   */
  dormir?: { acostarse: number; despertar: number | null } | null;
  fondo?: string;
}): Entrada[] {
  const tx = d.textos;
  const noches = conNochesDeMoss(e.salud?.noches ?? [], [...e.noches.values()], d.zona);
  const aparato = conAparato(e.salud, e.hoy);
  const desde = e.metas[0]?.desde ?? null;
  const base = (clave: ClaveDia): PropsNoche => ({
    clave, titulo: tx.anoche, horas: '', nota: tx.seVeEnMoss, notaConfirmada: tx.seVeEnMoss, si: tx.si,
    pregunta: false, dormirse: 0, despertar: 0, confirmada: 0, hecha: false, url: d.url,
    aDormir: false, cifra: '', falta: '', siLargo: tx.siLargo, fondo: d.fondo ?? '',
  });
  const conHoras = (p: PropsNoche, dormirse: number, despertar: number): PropsNoche => {
    const min = Math.max(0, Math.round(despertar - dormirse));
    const duracion = conVariables(tx.duracion, { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') });
    const cifra = conVariables(tx.horasCorto, { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') });
    return { ...p, horas: conVariables(tx.horas, { desde: reloj(dormirse), hasta: reloj(despertar) }), dormirse: Math.round(dormirse), despertar: Math.round(despertar), cifra, nota: duracion, notaConfirmada: `${tx.confirmada} · ${duracion}` };
  };
  // Lo de la mañana: si Moss propone, con «Sí»; la mañana de cada semana en que pregunta sin proponer, nada.
  const propuesta = (clave: ClaveDia, dormirse: number, despertar: number, confianza: 'alta' | 'media' | 'baja'): PropsNoche => {
    const modo = quePreguntar(clave, confianza, desde);
    if (modo === 'sinProponer') return { ...base(clave), nota: tx.seAnotaEnMoss, notaConfirmada: tx.seAnotaEnMoss };
    const p = conHoras(base(clave), dormirse, despertar);
    return modo === 'proponer' ? { ...p, pregunta: true, nota: tx.fueAsi } : p;
  };

  const actual = nocheDeAhora(d.ahora);
  let ahora: PropsNoche;
  const n = noches.find((x) => x.clave === actual);
  if (n && !n.moss) ahora = conHoras(base(actual), n.dormirse, n.despertar);
  else if (n?.moss) ahora = n.moss.origen === 'estimada' ? propuesta(actual, n.dormirse, n.despertar, n.moss.confianza) : { ...conHoras(base(actual), n.dormirse, n.despertar), hecha: true };
  else {
    const esperada = aparato ? null : nocheEsperada(noches, actual);
    ahora = esperada ? propuesta(actual, esperada.dormirse, esperada.despertar, 'media') : base(actual);
  }
  // Un «Sí» que todavía espera la estimación sigue a la vista, con las horas que se confirmaron.
  if (d.esperando && d.esperando.clave === actual && !ahora.hecha) {
    ahora = { ...conHoras(base(actual), d.esperando.dormirse, d.esperando.despertar), pregunta: true, confirmada: d.esperando.en };
  }

  const manana = sumarDias(actual, 1);
  const esperada = aparato ? null : nocheEsperada(noches, manana, d.despertador ?? null);
  const p = partesDe(manana);
  const pasado = partesDe(sumarDias(manana, 1));
  const alAmanecer = new Date(p.anio, p.mes, p.dia, DESDE_LAS);

  // A la tardecita, «A dormir»: de a media hora, porque iOS solo cambia el texto entre una entrada y otra.
  const tarde: Entrada[] = [];
  if (d.dormir) {
    const { acostarse, despertar } = d.dormir;
    const dia = partesDe(actual);
    const fecha = (min: number) => new Date(dia.anio, dia.mes, dia.dia, 0, min);
    const hora = horaDeReloj(acostarse);
    const nota = despertar === null ? '' : conVariables(tx.paraDespertar, { hora: horaDeReloj(despertar) });
    const paraDormir = (falta: string): PropsNoche => ({ ...base(manana), titulo: tx.aDormir, horas: hora, cifra: hora, falta, nota, notaConfirmada: nota, aDormir: true });
    const cuanto = (min: number) => {
      const r = Math.round(min);
      return conVariables(tx.enTiempo, { tiempo: r >= 60 ? conVariables(tx.duracion, { h: Math.floor(r / 60), m: String(r % 60).padStart(2, '0') }) : conVariables(tx.minutos, { m: r }) });
    };
    const desde = Math.max(A_DORMIR_DESDE, acostarse - A_DORMIR_ANTES);
    for (let m = desde; m < acostarse; m += 30) tarde.push({ date: fecha(m), props: paraDormir(cuanto(acostarse - m)) });
    tarde.push({ date: fecha(acostarse), props: paraDormir(tx.yaEsHora) });
    // Después vuelve la de anoche, sin «Sí»: el de la mañana quedó solo en la entrada en que se tocó.
    tarde.push({ date: fecha(acostarse + A_DORMIR_DESPUES), props: ahora.pregunta && !ahora.confirmada ? conHoras(base(actual), ahora.dormirse, ahora.despertar) : ahora });
  }
  // Lo de la tardecita que ya empezó manda ahora; lo que sigue va en su hora, hasta las 4: desde ahí manda la noche que viene.
  const yaEmpezo = tarde.filter((x) => x.date.getTime() <= d.ahora.getTime()).at(-1);
  const delaTarde = tarde.filter((x) => x.date.getTime() > d.ahora.getTime() && x.date.getTime() < alAmanecer.getTime());
  return [
    { date: d.ahora, props: yaEmpezo?.props ?? ahora },
    ...delaTarde,
    { date: alAmanecer, props: esperada ? propuesta(manana, esperada.dormirse, esperada.despertar, 'media') : base(manana) },
    { date: new Date(pasado.anio, pasado.mes, pasado.dia, DESDE_LAS), props: base(sumarDias(manana, 1)) },
  ];
}

/** Los «Sí» del widget que la app todavía no vio, uno por noche (el último). */
export function confirmacionesDeLaLinea(linea: { props: unknown }[]): ConfirmacionDelWidget[] {
  const porNoche = new Map<ClaveDia, ConfirmacionDelWidget>();
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsNoche>;
    if (typeof p.clave !== 'string' || typeof p.confirmada !== 'number' || !(p.confirmada > 0) || p.hecha) continue;
    if (typeof p.dormirse !== 'number' || typeof p.despertar !== 'number') continue;
    const antes = porNoche.get(p.clave);
    if (!antes || antes.en <= p.confirmada) porNoche.set(p.clave, { clave: p.clave, dormirse: p.dormirse, despertar: p.despertar, en: p.confirmada });
  }
  return [...porNoche.values()];
}

/**
 * Qué hacer con un «Sí» del widget al abrir Moss:
 * - `aplicar`: Moss ya estimó esa noche y las dos horas coinciden (COINCIDE minutos de cada lado):
 *   queda confirmada la estimada, como el «Sí» de la mañana en Sueño;
 * - `esperar`: es la noche de hoy y Moss todavía no la estimó;
 * - `olvidar`: no coincide (Moss pregunta como siempre), ya la contestaste en Moss o es vieja.
 */
export function decidir(c: ConfirmacionDelWidget, propia: NochePropia | undefined, hoy: ClaveDia, zona: Zona): 'aplicar' | 'esperar' | 'olvidar' {
  if (c.clave > hoy || c.clave < sumarDias(hoy, -1)) return 'olvidar';
  const h = propia && !propia.borrado ? propia.hora : undefined;
  if (h && h.origen !== 'estimada') return 'olvidar';
  const estimada = propia && h ? nocheDeMoss(propia, zona) : null;
  if (!estimada) return c.clave === hoy ? 'esperar' : 'olvidar';
  const cerca = Math.abs(estimada.dormirse - c.dormirse) <= COINCIDE && Math.abs(estimada.despertar - c.despertar) <= COINCIDE;
  return cerca ? 'aplicar' : 'olvidar';
}
