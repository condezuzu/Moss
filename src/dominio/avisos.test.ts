import { describe, expect, it } from '@jest/globals';

import {
  ADELANTO_MAXIMO, ANTES_DE_DORMIR, ATRASO_MAXIMO, avisoDeFabrica, deLasNoches, DESPERTAR_SIN_SUENO, DORMIR_SIN_SUENO, avisosDeLaSemana, avisosDelDia, cuandoSuena, duerme, horaDeDormir, horasDeSueno, SEPARACION, textoDelAviso, tituloDelAviso, MAXIMO_POR_DIA, MENSAJE_MAXIMO,
  nombraLaDeuda, PAGO_MAXIMO, PESARSE_DESPUES,
  type Aviso, type Avisos, type DelDia, type Notificacion, type ParaElTexto, type Sueno,
} from './avisos';
import es from '../textos/es.json';
import en from '../textos/en.json';
import { IDEAS_DE_LA_LISTA, type Falta } from './loQueFalta';
import type { PeriodoDeMelatonina } from './melatonina';
import type { Comida } from './comidas';
import { claveDeMarca } from './dias';
import { diaDeLaSemana, sumarDias, type DiaSemana } from './fechas';
import type { Habito } from './habitos';
import { DESPUES_MIN } from './recordatorios';

/** «7:30» en minutos desde la medianoche. */
const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};
/** Lo mismo en la cuenta de las noches, desde las 18 del día anterior: las 23:30 son 330 y las 7:30, 810. */
const n = (texto: string) => (h(texto) + 6 * 60) % (24 * 60);

// El viernes 23 de octubre de 2026.
const JUEVES = '2026-10-22';
const VIERNES = '2026-10-23';
const SABADO = '2026-10-24';
const TODOS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
const habito = (id: string, dias: DiaSemana[] = TODOS, hasta?: string): Habito =>
  ({ id, nombre: id, icono: 'star', dias, fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01', ...(hasta ? { hasta } : {}) });
/** Pesas toca lunes, miércoles y viernes; «viejo» se archivó en septiembre. */
const HABITOS = [habito('leer'), habito('agua'), habito('estirar'), habito('pesas', [1, 3, 5]), habito('viejo', TODOS, '2026-09-30')];
/** Se duerme a las 23:30 y se despierta a las 7:30; necesita 8 horas y no tiene deuda. */
const SUENO: Sueno = { habitual: () => ({ dormirse: n('23:30'), despertar: n('7:30') }), necesidad: 8 * 60, deuda: null };
const HORA_DE_COMIDA: Record<Comida, number> = { desayuno: h('8:00'), almuerzo: h('13:00'), merienda: h('17:30'), cena: h('21:00'), snack: h('16:00') };
const delDia = (ajustes: Avisos, extra: Partial<DelDia> = {}) =>
  avisosDelDia({ dia: VIERNES, ajustes, habitos: HABITOS, sueno: SUENO, horaDeComida: (c) => HORA_DE_COMIDA[c], ...extra });
/** Tus horas de comer: estas y, las demás, las de HORA_DE_COMIDA. */
const horas = (estas: Partial<Record<Comida, number>>) => ({ horaDeComida: (c: Comida) => estas[c] ?? HORA_DE_COMIDA[c] });
/** A qué hora suena cada cosa. */
const resumen = (lista: Notificacion[]) => lista.map((x): [number, string[]] => [x.minutos, [x.aviso.id]]);
const hecho = (habito: string, dia = VIERNES) => new Map([[claveDeMarca(habito, dia), { hecho: true }]]);
/** Hecho y marcado a esa hora del día, en el reloj del teléfono (Marca.momento): «24:10» son las 0:10 del día siguiente. */
const hechoA = (habito: string, hora: string, dia = VIERNES) => {
  const [anio, mes, d] = dia.split('-').map(Number);
  return new Map([[claveDeMarca(habito, dia), { hecho: true, momento: new Date(anio, mes - 1, d, 0, h(hora)).toISOString() }]]);
};
const aLas = (habito: string, hora: string) => ({ habito, cuando: { tipo: 'hora' as const, minutos: h(hora) }, dias: [] });

describe('la hora de dormir', () => {
  it('es la hora de despertarse menos lo que hace falta dormir', () => {
    expect(horaDeDormir({ despertar: n('7:30'), necesidad: 8 * 60, deuda: null, habitual: n('23:30') })).toBe(n('23:30'));
    expect(horaDeDormir({ despertar: n('7:30'), necesidad: 7.5 * 60, deuda: 0, habitual: n('23:30') })).toBe(n('0:00'));
  });

  it('con deuda, un tercio antes, hasta media hora', () => {
    const conDeuda = (deuda: number) => horaDeDormir({ despertar: n('7:30'), necesidad: 8 * 60, deuda, habitual: n('23:30') });
    expect([conDeuda(45), conDeuda(60), conDeuda(200)]).toEqual([n('23:15'), n('23:10'), n('23:30') - PAGO_MAXIMO]);
    // Una deuda chica no llega a correrla 5 minutos.
    expect(conDeuda(5)).toBe(n('23:30'));
  });

  it('nunca más de una hora antes de lo de siempre: el cuerpo no se duerme mucho antes', () => {
    // Se duerme a la 1 y mañana se despierta a las 7: con 8 horas y deuda serían las 22:30.
    expect(horaDeDormir({ despertar: n('7:00'), necesidad: 8 * 60, deuda: 120, habitual: n('1:00') })).toBe(n('1:00') - ADELANTO_MAXIMO);
  });

  it('sin hora de despertarse no hay hora de dormir; sin lo de siempre, no hay tope', () => {
    expect(horaDeDormir({ despertar: null, necesidad: 8 * 60, deuda: 60, habitual: n('23:30') })).toBeNull();
    expect(horaDeDormir({ despertar: n('7:00'), necesidad: 8 * 60, deuda: 90, habitual: null })).toBe(n('22:30'));
  });

  it('va de a 5 minutos', () => {
    expect(horaDeDormir({ despertar: n('7:07'), necesidad: 8 * 60, deuda: null, habitual: null })).toBe(n('23:05'));
  });

  it('con lo despierto de la noche: la necesidad es de sueño, y adentro de la noche hay un rato despierto', () => {
    // Despertarse a las 7:30 con 8 h y 30 minutos despierto, sin deuda y lo de siempre a las 23:00: a las 23:00.
    expect(horaDeDormir({ despertar: n('7:30'), necesidad: 8 * 60, deuda: null, habitual: n('23:00'), despierto: 30 })).toBe(n('23:00'));
    // Con lo de siempre a las 23:30, también: el tope de una hora no llega.
    expect(horaDeDormir({ despertar: n('7:30'), necesidad: 8 * 60, deuda: null, habitual: n('23:30'), despierto: 30 })).toBe(n('23:00'));
    // Y lo que dormirías sigue siendo la necesidad: el rato despierto no es sueño.
    const h30 = horasDeSueno(VIERNES, { ...SUENO, despierto: 30, latencia: 15 });
    expect(h30).toMatchObject({ dormir: h('23:00'), acostarse: h('22:45'), despierto: 30 });
    expect(duerme(h30)).toBe(8 * 60);
  });
});

describe('las horas de sueño de un día', () => {
  it('la mañana sale de lo de siempre y la noche, de la mañana siguiente, en minutos desde la medianoche', () => {
    expect(horasDeSueno(VIERNES, SUENO)).toMatchObject({ despertar: h('7:30'), dormir: h('23:30'), acostarse: h('23:30') });
  });

  it('la alarma gana a lo de siempre, y la del sábado decide la noche del viernes, que pasa de la medianoche', () => {
    // Se despierta el sábado a las 9 y necesita 8 horas: dormirse a la 1 del sábado, que es la noche del viernes.
    expect(horasDeSueno(VIERNES, { ...SUENO, alarmas: { 5: h('6:30'), 6: h('9:00') } })).toMatchObject({ despertar: h('6:30'), dormir: 24 * 60 + h('1:00'), acostarse: 24 * 60 + h('1:00'), despertarManana: 24 * 60 + h('9:00') });
  });

  it('lo de siempre es el de cada noche: el fin de semana puede ser otro', () => {
    const finde = (c: string) => [6, 0].includes(diaDeLaSemana(c));
    const s: Sueno = { ...SUENO, habitual: (c) => (finde(c) ? { dormirse: n('0:30'), despertar: n('9:30') } : { dormirse: n('23:30'), despertar: n('7:30') }) };
    // La noche del viernes termina el sábado.
    expect(horasDeSueno(VIERNES, s)).toMatchObject({ despertar: h('7:30'), dormir: 24 * 60 + h('1:30'), acostarse: 24 * 60 + h('1:30') });
    expect(horasDeSueno(JUEVES, s).dormir).toBe(h('23:30'));
  });

  it('sin datos del sueño, nada', () => {
    expect(horasDeSueno(VIERNES, { ...SUENO, habitual: () => null })).toEqual({ despertar: null, dormir: null, acostarse: null, despertarManana: null, despierto: 0, periodo: null });
  });

  it('a la cama, lo que tardás en dormirte antes de la hora de dormirte (D33), de a 5 minutos', () => {
    expect(horasDeSueno(VIERNES, { ...SUENO, latencia: 25 })).toMatchObject({ despertar: h('7:30'), dormir: h('23:30'), acostarse: h('23:05') });
    expect(horasDeSueno(VIERNES, { ...SUENO, latencia: 47 }).acostarse).toBe(h('22:45'));
  });

  it('lo que se duerme es de la hora de dormirse a la de despertarse, no la necesidad: Perfil y el aviso dicen lo mismo', () => {
    // Se despierta a las 7 y suele dormirse a las 0:30: no se adelanta más de una hora, así que duerme 7 h 30.
    const tarde: Sueno = { ...SUENO, habitual: () => ({ dormirse: n('0:30'), despertar: n('7:00') }), latencia: 15 };
    expect(duerme(horasDeSueno(VIERNES, tarde))).toBe(7 * 60 + 30);
    // Con hora y media de deuda se acuesta media hora antes de lo que necesita: 8 h 30.
    const conDeuda: Sueno = { ...SUENO, habitual: () => ({ dormirse: n('23:30'), despertar: n('7:00') }), deuda: 90 };
    expect(duerme(horasDeSueno(VIERNES, conDeuda))).toBe(8 * 60 + 30);
    expect(delDia({ dormir: { encendido: true } }, { sueno: conDeuda })[0].aviso.duerme).toBe(8 * 60 + 30);
    expect(duerme(horasDeSueno(VIERNES, { ...SUENO, habitual: () => null }))).toBeNull();
  });
});

describe('la noche que el aviso de acostarte nombra la deuda', () => {
  const noches = (cuantas: number, desde = '2026-10-23') => Array.from({ length: cuantas }, (_, i) => sumarDias(desde, i));

  it('con una hora o más de deuda, una noche de cada cuatro; sale del día, y reprogramar no lo cambia', () => {
    const nombra = noches(28).map((d) => nombraLaDeuda(d, 90));
    expect(nombra.filter(Boolean)).toHaveLength(7);
    nombra.forEach((si, i) => i > 0 && expect(si && nombra[i - 1]).toBe(false));
    expect(noches(28).some((d) => nombraLaDeuda(d, 59))).toBe(false);
    expect(noches(28).some((d) => nombraLaDeuda(d, null))).toBe(false);
    // Antes de la fecha de partida también anda.
    expect(noches(4, '2025-03-01').filter((d) => nombraLaDeuda(d, 90))).toHaveLength(1);
  });

  it('el aviso lleva la deuda solo esa noche', () => {
    const dia = noches(8).find((d) => nombraLaDeuda(d, 90))!;
    expect(delDia({ dormir: { encendido: true } }, { dia, sueno: { ...SUENO, deuda: 90 } })[0].aviso.deuda).toBe(90);
    const otro = noches(8).find((d) => !nombraLaDeuda(d, 90))!;
    expect(delDia({ dormir: { encendido: true } }, { dia: otro, sueno: { ...SUENO, deuda: 90 } })[0].aviso.deuda).toBeUndefined();
  });

  it('la deuda que nombra va a la media hora: es aproximada', () => {
    const dia = noches(8).find((d) => nombraLaDeuda(d, 90))!;
    const dicha = (deuda: number) => delDia({ dormir: { encendido: true } }, { dia, sueno: { ...SUENO, deuda } })[0].aviso.deuda;
    expect([dicha(92), dicha(104), dicha(106)]).toEqual([90, 90, 120]);
  });

  it('sin culpa: ni el de acostarte ni el de pesarte dicen «Deberías», «debes» ni «tienes que», ni «a la cama»', () => {
    const todos = (o: object): string[] => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : todos(v)));
    for (const texto of [...todos(es.recordatorios.acostarte), ...todos(es.recordatorios.pesarte)]) expect(texto).not.toMatch(/deber[ií]as|\bdebes\b|tienes que|a la cama/i);
    for (const texto of [...todos(en.recordatorios.acostarte), ...todos(en.recordatorios.pesarte)]) expect(texto).not.toMatch(/\bshould\b|\bmust\b|have to/i);
  });
});

describe('con tu periodo de melatonina, una sola cuenta de la noche', () => {
  /** De 22:57 a 23:57, con 15 minutos de margen: acostarte a las 22:40, como dice la tarjeta de Sueño. */
  const PERIODO: PeriodoDeMelatonina = { inicio: n('20:57'), desde: n('22:57'), hasta: n('23:57'), corrido: 1, acostarse: n('22:40'), conDeuda: false, noches: 7 };
  const conPeriodo: Sueno = { ...SUENO, latencia: 15, periodo: (d) => (d === VIERNES ? PERIODO : null) };

  it('la hora de acostarte y la de dormirte son las del periodo, con sus horas en la cuenta del día', () => {
    expect(horasDeSueno(VIERNES, conPeriodo)).toMatchObject({
      dormir: h('22:57'), acostarse: h('22:40'), despertarManana: h('7:30') + 24 * 60,
      periodo: { inicio: h('20:57'), desde: h('22:57'), hasta: h('23:57') },
    });
    // Lo que dormirías, de que empieza el periodo a la hora de despertarte.
    expect(duerme(horasDeSueno(VIERNES, conPeriodo))).toBe(8 * 60 + 33);
    // Un periodo que pasa de la medianoche, en la cuenta del día: más de 1440.
    const tarde: Sueno = { ...SUENO, periodo: () => ({ ...PERIODO, inicio: n('22:28'), desde: n('0:28'), hasta: n('1:28'), acostarse: n('0:15') }) };
    expect(horasDeSueno(VIERNES, tarde)).toMatchObject({ dormir: 24 * 60 + h('0:28'), acostarse: 24 * 60 + h('0:15'), periodo: { desde: 24 * 60 + h('0:28'), hasta: 24 * 60 + h('1:28') } });
  });

  it('ni la deuda la adelanta ni un despertar tarde la corre: es la misma hora de la tarjeta', () => {
    expect(horasDeSueno(VIERNES, { ...conPeriodo, deuda: 240 }).acostarse).toBe(h('22:40'));
    expect(horasDeSueno(VIERNES, { ...conPeriodo, despertarReal: () => h('10:00') }).acostarse).toBe(h('22:40'));
  });

  it('sin periodo (menos de tres noches en la semana), la hora de siempre, que la deuda adelanta y un despertar tarde corre', () => {
    expect(horasDeSueno(JUEVES, conPeriodo)).toMatchObject({ dormir: h('23:30'), acostarse: h('23:15'), periodo: null });
    expect(horasDeSueno(JUEVES, { ...conPeriodo, deuda: 60 }).acostarse).toBe(h('22:55'));
    // Lo de siempre es dormirse a la 1: la noche no se adelanta más de una hora, y despertarte 2 h tarde la corre una.
    const tarde: Sueno = { ...conPeriodo, habitual: () => ({ dormirse: n('1:00'), despertar: n('7:30') }) };
    const cama = (despertar: string) => horasDeSueno(JUEVES, { ...tarde, despertarReal: () => h(despertar) }).acostarse;
    expect([cama('7:30'), cama('9:30')]).toEqual([h('23:45'), 24 * 60 + h('0:45')]);
  });

  it('el aviso de acostarte suena un rato antes de esa hora y lleva el periodo', () => {
    expect(delDia({ dormir: { encendido: true } }, { sueno: conPeriodo })).toMatchObject([
      { minutos: h('22:10'), aviso: { id: 'dormir', dormirA: h('22:40'), periodo: { desde: h('22:57'), hasta: h('23:57') } } },
    ]);
    expect(delDia({ dormir: { encendido: true } }, { sueno: SUENO })[0].aviso.periodo).toBeUndefined();
    // Los hábitos de antes de dormir y los demás avisos cuentan desde la misma hora.
    expect(resumen(delDia({ habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }] }, { sueno: conPeriodo }))).toEqual([[h('21:55'), ['habito:leer:0']]]);
  });
});

describe('el aviso de dormir con lo que tardás en dormirte', () => {
  it('suena un rato antes de la hora de ir a la cama, y dice esa hora', () => {
    expect(delDia({ dormir: { encendido: true } }, { sueno: { ...SUENO, latencia: 30 } })).toMatchObject([
      { dia: VIERNES, minutos: h('22:30'), aviso: { id: 'dormir', tipo: 'dormir', minutos: h('22:30'), dormirA: h('23:00') } },
    ]);
  });
});

describe('los avisos de un día', () => {
  it('el de dormir avisa media hora antes de la hora de dormirse; apagado o sin datos del sueño, nada', () => {
    expect(ANTES_DE_DORMIR).toBe(30);
    expect(delDia({ dormir: { encendido: true } })).toMatchObject([
      { dia: VIERNES, minutos: h('23:00'), aviso: { id: 'dormir', tipo: 'dormir', minutos: h('23:00'), dormirA: h('23:30'), despertarA: 24 * 60 + h('7:30'), duerme: 8 * 60 } },
    ]);
    expect(resumen(delDia({ dormir: { encendido: true, antes: 45 } }))).toEqual([[h('22:45'), ['dormir']]]);
    expect(delDia({ dormir: { encendido: false } })).toEqual([]);
    expect(delDia({ dormir: { encendido: true } }, { sueno: null })).toEqual([]);
    expect(delDia({})).toEqual([]);
  });

  it('el de un hábito, a una hora fija, al despertarse o antes de dormirse', () => {
    const ajustes: Avisos = {
      habitos: [
        { habito: 'agua', cuando: { tipo: 'despertar', despues: 0 }, dias: [] },
        { habito: 'leer', cuando: { tipo: 'dormir', antes: 60 }, dias: [] },
        aLas('estirar', '18:00'),
      ],
    };
    expect(resumen(delDia(ajustes))).toEqual([[h('7:30'), ['habito:agua:0']], [h('18:00'), ['habito:estirar:0']], [h('22:30'), ['habito:leer:0']]]);
    // Sin datos del sueño, como si se despertara a las 7:30 y se durmiera a las 23: los primeros hábitos avisan desde el primer día.
    expect([DESPERTAR_SIN_SUENO, DORMIR_SIN_SUENO]).toEqual([h('7:30'), h('23:00')]);
    expect(resumen(delDia(ajustes, { sueno: null }))).toEqual([[h('7:30'), ['habito:agua:0']], [h('18:00'), ['habito:estirar:0']], [h('22:00'), ['habito:leer:0']]]);
    expect(resumen(delDia(ajustes, { sueno: { ...SUENO, habitual: () => null } }))).toEqual([[h('7:30'), ['habito:agua:0']], [h('18:00'), ['habito:estirar:0']], [h('22:00'), ['habito:leer:0']]]);
  });

  it('sin poder leer las noches (Salud, con el iPhone bloqueado), el de antes de dormirte no va a la hora de fábrica: lo pone el teléfono', () => {
    const ajustes: Avisos = { habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 60 }, dias: [] }, aLas('estirar', '18:00')] };
    expect(resumen(delDia(ajustes, { sueno: { ...SUENO, habitual: () => null, sinLeer: true } }))).toEqual([[h('18:00'), ['habito:estirar:0']]]);
    // Con la hora de acostarte, a su hora.
    expect(resumen(delDia(ajustes, { sueno: { ...SUENO, sinLeer: true } }))).toEqual([[h('18:00'), ['habito:estirar:0']], [h('22:30'), ['habito:leer:0']]]);
  });

  it('lo que sale de tus noches: acostarte y lo que cuenta desde ahí, tu periodo, la deuda y el hábito de antes de dormirte', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '9:00'), { habito: 'leer', cuando: { tipo: 'dormir', antes: 30 }, dias: [] }] };
    const de = (id: string, tipo: Aviso['tipo'], habito?: string) => deLasNoches({ id, tipo, ...(habito ? { habito } : {}) }, ajustes);
    for (const tipo of ['dormir', 'deuda', 'melatonina', 'revoluciones', 'gafas', 'descarga', 'luces', 'cafe', 'ultimaComida', 'entrenarTarde'] as const) expect(de(tipo, tipo)).toBe(true);
    for (const tipo of ['pesarse', 'desayuno', 'pendientes', 'horario', 'comida', 'falta', 'antesDeEntrenar', 'despuesDeEntrenar', 'recuperacion'] as const) expect(de(tipo, tipo)).toBe(false);
    expect([de('habito:leer:0', 'habito', 'leer'), de('habito:leer:1', 'habito', 'leer'), de('habito:leer:2', 'habito', 'leer')]).toEqual([false, true, false]);
  });

  it('cada aviso de un hábito tiene su id, con su mensaje propio recortado a 120 letras', () => {
    // Fuera del plano básico: dos unidades de UTF-16 que no se pueden separar.
    const clave = String.fromCodePoint(0x1d11e);
    const lista = delDia({
      habitos: [
        { ...aLas('leer', '9:00'), mensaje: '  Un capítulo  ' },
        { ...aLas('leer', '21:00'), mensaje: 'a'.repeat(MENSAJE_MAXIMO - 1) + clave + 'b' },
        { ...aLas('agua', '12:00'), mensaje: '   ' },
      ],
    });
    expect(lista.map((x) => x.aviso)).toEqual([
      { id: 'habito:leer:0', tipo: 'habito', habito: 'leer', minutos: h('9:00'), mensaje: 'Un capítulo' },
      { id: 'habito:agua:0', tipo: 'habito', habito: 'agua', minutos: h('12:00') },
      { id: 'habito:leer:1', tipo: 'habito', habito: 'leer', minutos: h('21:00'), mensaje: 'a'.repeat(MENSAJE_MAXIMO - 1) + clave },
    ]);
  });

  it('avisa los días del hábito, o los elegidos de esos; nunca uno que el hábito no toca', () => {
    const cuantos = (dias: DiaSemana[], dia: string) => delDia({ habitos: [{ ...aLas('pesas', '7:00'), dias }] }, { dia }).length;
    expect([cuantos([], VIERNES), cuantos([], SABADO)]).toEqual([1, 0]);
    expect([cuantos([1], VIERNES), cuantos([5, 6], VIERNES), cuantos([5, 6], SABADO)]).toEqual([0, 1, 0]);
    // Un hábito archivado, o que ya no está, no avisa.
    expect(delDia({ habitos: [aLas('viejo', '7:00'), aLas('otro', '8:00')] })).toEqual([]);
  });

  it('un hábito ya hecho ese día no avisa', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '21:00')] };
    expect(delDia(ajustes, { marcas: hecho('leer') })).toEqual([]);
    expect(delDia(ajustes, { marcas: hecho('leer', JUEVES) })).toHaveLength(1);
    expect(delDia(ajustes, { marcas: new Map([[claveDeMarca('leer', VIERNES), { hecho: false }]]) })).toHaveLength(1);
  });

  it('con el día que empieza a las 4 (D32), un hábito a las 0:30 es de la noche de ese día: su marca y sus días', () => {
    expect(resumen(delDia({ habitos: [aLas('leer', '0:30')] }, { corte: 4 * 60 }))).toEqual([[24 * 60 + h('0:30'), ['habito:leer:0']]]);
    // Leyó el viernes a las 23:10: a las 0:30 del sábado, que todavía es el viernes, no avisa.
    expect(delDia({ habitos: [aLas('leer', '0:30')] }, { corte: 4 * 60, marcas: hecho('leer', VIERNES) })).toEqual([]);
    // Pesas va lunes, miércoles y viernes: avisa la noche del viernes, no la del sábado.
    expect(resumen(delDia({ habitos: [aLas('pesas', '0:30')] }, { corte: 4 * 60 }))).toEqual([[24 * 60 + h('0:30'), ['habito:pesas:0']]]);
    expect(delDia({ habitos: [aLas('pesas', '0:30')] }, { corte: 4 * 60, dia: SABADO })).toEqual([]);
    // Lo de después del corte, y sin corte (a la medianoche), como siempre.
    expect(resumen(delDia({ habitos: [aLas('leer', '4:30')] }, { corte: 4 * 60 }))).toEqual([[h('4:30'), ['habito:leer:0']]]);
    expect(resumen(delDia({ habitos: [aLas('leer', '0:30')] }, { corte: 0 }))).toEqual([[h('0:30'), ['habito:leer:0']]]);
  });

  it('lo de después de un evento: si todavía no pasó, nada; si pasó, un rato después', () => {
    const ajustes: Avisos = { habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'entrenamiento', despues: 15 }, dias: [] }] };
    expect(delDia(ajustes)).toEqual([]);
    expect(delDia(ajustes, { eventos: { cena: h('21:00') } })).toEqual([]);
    expect(resumen(delDia(ajustes, { eventos: { entrenamiento: h('18:40') } }))).toEqual([[h('18:55'), ['habito:agua:0']]]);
    expect(delDia(ajustes, { eventos: { entrenamiento: h('18:40') }, marcas: hecho('agua') })).toEqual([]);
  });

  it('una comida avisa 45 minutos después de su hora de siempre, si no se anotó, y nunca después de las 23:30', () => {
    const ajustes: Avisos = { comidas: ['almuerzo', 'cena'] };
    expect(resumen(delDia(ajustes))).toEqual([[h('13:00') + DESPUES_MIN, ['comida:almuerzo']], [h('21:00') + DESPUES_MIN, ['comida:cena']]]);
    expect(resumen(delDia(ajustes, { anotadas: new Set<Comida>(['almuerzo']) }))).toEqual([[h('21:45'), ['comida:cena']]]);
    expect(resumen(delDia({ comidas: ['cena'] }, { horaDeComida: () => h('23:10') }))).toEqual([[h('23:30'), ['comida:cena']]]);
  });

  it('nada se junta: cada aviso dice una sola cosa, y entre dos hay al menos 20 minutos', () => {
    const lista = delDia({ habitos: [aLas('agua', '10:00'), aLas('leer', '10:20'), aLas('estirar', '10:21'), aLas('pesas', '10:45')] });
    expect(resumen(lista)).toEqual([
      [h('10:00'), ['habito:agua:0']],
      [h('10:20'), ['habito:leer:0']],
      [h('10:40'), ['habito:estirar:0']],
      [h('11:00'), ['habito:pesas:0']],
    ]);
    expect(lista.every((x, i) => i === 0 || x.minutos - lista[i - 1].minutos >= SEPARACION)).toBe(true);
  });

  it('el de dormir no se mueve: lo de antes de dormirse que cae cerca suena un rato antes', () => {
    const lista = delDia({ dormir: { encendido: true }, habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }] });
    expect(resumen(lista)).toEqual([[h('22:40'), ['habito:leer:0']], [h('23:00'), ['dormir']]]);
  });

  it('lo que tendría que esperar demasiado ya no viene al caso, y no suena', () => {
    const lista = delDia({ habitos: [aLas('agua', '10:00'), aLas('leer', '10:00'), aLas('estirar', '10:00'), aLas('pesas', '10:00')] });
    expect(lista.map((x) => x.minutos)).toEqual([h('10:00'), h('10:20'), h('10:40')]);
    expect(ATRASO_MAXIMO).toBe(45);
  });

  it('el máximo: primero el de dormir, después los hábitos y al final las comidas; entre iguales, el más temprano', () => {
    const ajustes: Avisos = {
      dormir: { encendido: true },
      habitos: [aLas('agua', '9:00'), aLas('estirar', '14:00'), aLas('leer', '18:00')],
      comidas: ['almuerzo', 'cena'],
    };
    // El almuerzo (13:45) está pegado a estirar (14:00), que importa más: suena un rato antes.
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 10 }))).toEqual([
      [h('9:00'), ['habito:agua:0']],
      [h('13:40'), ['comida:almuerzo']],
      [h('14:00'), ['habito:estirar:0']],
      [h('18:00'), ['habito:leer:0']],
      [h('21:45'), ['comida:cena']],
      [h('23:00'), ['dormir']],
    ]);
    // De fábrica entran los seis; con cinco, sale la cena (una comida sin anotar, la última).
    expect(MAXIMO_POR_DIA).toBe(6);
    expect(resumen(delDia(ajustes))).toHaveLength(6);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 5 })).map(([, ids]) => ids[0])).not.toContain('comida:cena');
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 4 })).map(([minutos]) => minutos)).toEqual([h('9:00'), h('14:00'), h('18:00'), h('23:00')]);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 3 })).map(([minutos]) => minutos)).toEqual([h('9:00'), h('14:00'), h('23:00')]);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 2 })).map(([minutos]) => minutos)).toEqual([h('9:00'), h('23:00')]);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 1 }))).toEqual([[h('23:00'), ['dormir']]]);
    expect(delDia({ ...ajustes, maximoPorDia: 0 })).toEqual([]);
  });

  it('lo de después de un evento guarda su lugar en el máximo, como un hábito', () => {
    const ajustes: Avisos = {
      dormir: { encendido: true },
      habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }],
      comidas: ['almuerzo', 'merienda'],
      maximoPorDia: 2,
    };
    // Antes de la cena su lugar queda guardado, y las comidas no entran.
    expect(resumen(delDia(ajustes))).toEqual([[h('23:00'), ['dormir']]]);
    expect(resumen(delDia(ajustes, { eventos: { cena: h('21:00') } }))).toEqual([[h('21:30'), ['habito:agua:0']], [h('23:00'), ['dormir']]]);
  });

  it('lo de después de un evento busca su hueco: solo puede esperar, porque recién se supo', () => {
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }] };
    // Cenó a las 22:20: el agua (22:50) espera a que pase el de dormir de las 23:00.
    expect(resumen(delDia(ajustes, { eventos: { cena: h('22:20') } }))).toEqual([[h('23:00'), ['dormir']], [h('23:20'), ['habito:agua:0']]]);
    expect(resumen(delDia(ajustes, { eventos: { cena: h('21:00') } }))).toEqual([[h('21:30'), ['habito:agua:0']], [h('23:00'), ['dormir']]]);
  });

  it('el hueco sale igual al reprogramar: lo que ya sonó y después se hizo sigue ocupando su lugar', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '21:00'), { habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }] };
    const cena = { eventos: { cena: h('20:35') }, anotadas: new Set<Comida>(['cena']) };
    // Cenó a las 20:35: el agua (21:05) espera a leer, de las 21:00.
    expect(resumen(delDia(ajustes, { ...cena, ahora: h('20:36') }))).toEqual([[h('21:00'), ['habito:leer:0']], [h('21:20'), ['habito:agua:0']]]);
    // Leer sonó y lo marcó a las 21:10: el agua sigue a las 21:20, y no se pierde.
    expect(resumen(delDia(ajustes, { ...cena, ahora: h('21:10'), marcas: hecho('leer') }))).toEqual([[h('21:20'), ['habito:agua:0']]]);
  });

  it('hoy, lo que ya sonó no vuelve a sonar, y lo hecho antes de su hora no atrasa a nadie', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '13:30')], comidas: ['almuerzo'] };
    expect(resumen(delDia(ajustes, { ahora: h('13:00') }))).toEqual([[h('13:30'), ['habito:leer:0']], [h('13:50'), ['comida:almuerzo']]]);
    // Leyó antes de que sonara: el almuerzo no tiene que esperar.
    expect(resumen(delDia(ajustes, { ahora: h('13:00'), marcas: hecho('leer') }))).toEqual([[h('13:45'), ['comida:almuerzo']]]);
    // Sonó a las 13:30 y leyó después: el almuerzo sigue a las 13:50, y no se pierde.
    expect(resumen(delDia(ajustes, { ahora: h('13:47'), marcas: hecho('leer') }))).toEqual([[h('13:50'), ['comida:almuerzo']]]);
    expect(delDia(ajustes, { ahora: h('13:55') })).toEqual([]);
  });

  it('lo que sonó un rato antes no vuelve a sonar a su hora si después se hace lo que lo adelantó', () => {
    const ajustes: Avisos = { habitos: [aLas('estirar', '14:00')], comidas: ['almuerzo'] };
    // El almuerzo (13:45) suena un rato antes, a las 13:40, por estirar.
    expect(resumen(delDia(ajustes, { ahora: h('12:00') }))).toEqual([[h('13:40'), ['comida:almuerzo']], [h('14:00'), ['habito:estirar:0']]]);
    // Sonó a las 13:40 y a las 13:42 estiró: no vuelve a las 13:45.
    expect(delDia(ajustes, { ahora: h('13:42'), marcas: hecho('estirar') })).toEqual([]);
    // Si estiró antes de que sonara, suena una sola vez, a la misma hora: reprogramar a las 13:42 no lo pierde ni lo repite.
    expect(resumen(delDia(ajustes, { ahora: h('12:00'), marcas: hecho('estirar') }))).toEqual([[h('13:40'), ['comida:almuerzo']]]);
    expect(resumen(delDia(ajustes, { ahora: h('13:39'), marcas: hecho('estirar') }))).toEqual([[h('13:40'), ['comida:almuerzo']]]);
  });

  it('lo mismo con lo que conviene: las luces que sonaron antes de leer no vuelven a sonar a su hora', () => {
    const luces: Aviso = { id: 'luces', tipo: 'luces', minutos: h('21:00') };
    const ajustes: Avisos = { habitos: [aLas('leer', '21:10')] };
    expect(resumen(delDia(ajustes, { ahora: h('20:00'), conviene: [luces] }))).toEqual([[h('20:50'), ['luces']], [h('21:10'), ['habito:leer:0']]]);
    expect(delDia(ajustes, { ahora: h('20:52'), conviene: [luces], marcas: hecho('leer') })).toEqual([]);
  });

  it('lo marcado antes de que sonara nunca sonó: tampoco atrasa a nadie pasada su hora, y nada suena dos veces', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '13:30')], comidas: ['almuerzo'] };
    // Leyó a las 13:00: el almuerzo, a las 13:45.
    expect(resumen(delDia(ajustes, { ahora: h('13:00'), marcas: hechoA('leer', '13:00') }))).toEqual([[h('13:45'), ['comida:almuerzo']]]);
    // Pasadas las 13:30, leer sigue sin haber sonado: el almuerzo no se corre a las 13:50, ni vuelve a sonar.
    expect(resumen(delDia(ajustes, { ahora: h('13:40'), marcas: hechoA('leer', '13:00') }))).toEqual([[h('13:45'), ['comida:almuerzo']]]);
    expect(delDia(ajustes, { ahora: h('13:47'), marcas: hechoA('leer', '13:00') })).toEqual([]);
    // Si sonó a las 13:30 y leyó después, sí ocupa su lugar: el almuerzo sigue a las 13:50, también al reprogramar en el momento.
    expect(resumen(delDia(ajustes, { ahora: h('13:35'), marcas: hechoA('leer', '13:35') }))).toEqual([[h('13:50'), ['comida:almuerzo']]]);
    expect(resumen(delDia(ajustes, { ahora: h('13:47'), marcas: hechoA('leer', '13:35') }))).toEqual([[h('13:50'), ['comida:almuerzo']]]);
  });

  it('lo mismo con las luces: leer marcado antes de su hora no las vuelve a correr cuando pasa', () => {
    const luces: Aviso = { id: 'luces', tipo: 'luces', minutos: h('21:05') };
    const ajustes: Avisos = { habitos: [aLas('leer', '21:00')] };
    expect(resumen(delDia(ajustes, { ahora: h('20:00'), conviene: [luces] }))).toEqual([[h('21:00'), ['habito:leer:0']], [h('21:20'), ['luces']]]);
    expect(resumen(delDia(ajustes, { ahora: h('20:30'), conviene: [luces], marcas: hechoA('leer', '20:30') }))).toEqual([[h('21:05'), ['luces']]]);
    // Las luces sonaron a las 21:05: a las 21:07 no vuelven a las 21:20.
    expect(delDia(ajustes, { ahora: h('21:07'), conviene: [luces], marcas: hechoA('leer', '20:30') })).toEqual([]);
  });

  it('y de noche: estirar a las 0:30, marcado a las 0:10, no corre a leer cuando pasa su hora', () => {
    const ajustes: Avisos = { habitos: [aLas('estirar', '0:30'), aLas('leer', '0:40')] };
    // Con el día que empieza a las 4, las dos son de la noche del viernes.
    const noche = { corte: 4 * 60 };
    expect(resumen(delDia(ajustes, { ...noche, ahora: h('23:00') }))).toEqual([[h('24:30'), ['habito:estirar:0']], [h('24:50'), ['habito:leer:0']]]);
    expect(resumen(delDia(ajustes, { ...noche, ahora: h('24:10'), marcas: hechoA('estirar', '24:10') }))).toEqual([[h('24:40'), ['habito:leer:0']]]);
    // Leer sonó a las 0:40: a las 0:42 no vuelve a las 0:50.
    expect(delDia(ajustes, { ...noche, ahora: h('24:42'), marcas: hechoA('estirar', '24:10') })).toEqual([]);
  });

  it('lo que sonó un rato antes y se marcó antes de su hora sigue ocupando su lugar: lo de después no se pierde', () => {
    const luces: Aviso = { id: 'luces', tipo: 'luces', minutos: h('22:45') };
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [aLas('leer', '22:50')] };
    // Leer suena un rato antes, a las 22:40, por el de dormir (23:00); las luces esperan a las 23:20.
    expect(resumen(delDia(ajustes, { ahora: h('22:00'), conviene: [luces] }))).toEqual([[h('22:40'), ['habito:leer:0']], [h('23:00'), ['dormir']], [h('23:20'), ['luces']]]);
    // Leyó a las 22:45, después de que sonara y antes de las 22:50: las luces siguen a las 23:20.
    expect(resumen(delDia(ajustes, { ahora: h('22:45'), conviene: [luces], marcas: hechoA('leer', '22:45') }))).toEqual([[h('23:00'), ['dormir']], [h('23:20'), ['luces']]]);
  });

  it('lo mismo con las comidas: la cena anotada antes de su aviso no corre lo de después de cenar cuando pasa su hora', () => {
    const ajustes: Avisos = { habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }], comidas: ['cena'] };
    // Cenó y lo anotó a las 20:44: el agua, a las 21:14; «¿Anotaste la cena?» (ahora a las 21:29) ya no suena.
    const cena = { eventos: { cena: h('20:44') }, anotadas: new Set<Comida>(['cena']), cuandoSeAnoto: { cena: h('20:44') } };
    expect(resumen(delDia(ajustes, { ...cena, ahora: h('20:45') }))).toEqual([[h('21:14'), ['habito:agua:0']]]);
    // Pasadas las 21:29, ese aviso sigue sin haber sonado: el agua, que sonó a las 21:14, no vuelve a las 21:49.
    expect(delDia(ajustes, { ...cena, ahora: h('21:30') })).toEqual([]);
  });

  it('anotar la cena no lleva su hora a la hora en que se anotó: lo que ya sonó cerca no vuelve a sonar', () => {
    const ajustes: Avisos = { habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'merienda', despues: 30 }, dias: [] }], horario: ['cena'] };
    const merienda = { merienda: h('19:00') };
    // Merendó a las 19:00: el agua, a las 19:30, y la hora de la cena se corre a las 22:30.
    expect(resumen(delDia(ajustes, { eventos: merienda, anotadas: new Set<Comida>(['merienda']), cuandoSeAnoto: merienda, ahora: h('19:01') })))
      .toEqual([[h('19:30'), ['habito:agua:0']], [h('22:30'), ['horario:cena']]]);
    // A las 19:35 anota la cena: su hora no había sonado, y el agua, que sonó a las 19:30, no vuelve a las 19:55.
    const conCena = { eventos: { ...merienda, cena: h('19:35') }, anotadas: new Set<Comida>(['merienda', 'cena']), cuandoSeAnoto: { ...merienda, cena: h('19:35') } };
    expect(delDia(ajustes, { ...conCena, ahora: h('19:36') })).toEqual([]);
  });

  it('lo de después de una comida anotada más tarde no corre lo que ya sonó después de otra', () => {
    const ajustes: Avisos = {
      habitos: [{ habito: 'leer', cuando: { tipo: 'evento', evento: 'cena', despues: 17 }, dias: [] }, { habito: 'agua', cuando: { tipo: 'evento', evento: 'merienda', despues: 7 }, dias: [] }],
    };
    const merienda = { merienda: h('19:23') };
    expect(resumen(delDia(ajustes, { eventos: merienda, anotadas: new Set<Comida>(['merienda']), cuandoSeAnoto: merienda, ahora: h('19:24') }))).toEqual([[h('19:30'), ['habito:agua:0']]]);
    // A las 19:31 anota la cena con una foto de las 19:18: leer (19:35) espera al agua, que ya sonó, y el agua no vuelve.
    const conCena = { eventos: { ...merienda, cena: h('19:18') }, anotadas: new Set<Comida>(['merienda', 'cena']), cuandoSeAnoto: { ...merienda, cena: h('19:31') } };
    expect(resumen(delDia(ajustes, { ...conCena, ahora: h('19:31') }))).toEqual([[h('19:50'), ['habito:leer:0']]]);
  });

  it('lo que sonó antes de anotar la comida sigue en su lugar, aunque la foto diga que comió antes: lo que esperaba no se pierde', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '21:10')], horario: ['cena'] };
    expect(resumen(delDia(ajustes, { ahora: h('20:00') }))).toEqual([[h('21:00'), ['horario:cena']], [h('21:20'), ['habito:leer:0']]]);
    // A las 21:15 anota la cena con una foto de las 20:50: su hora ya sonó a las 21:00, y leer sigue a las 21:20.
    const cena = { eventos: { cena: h('20:50') }, anotadas: new Set<Comida>(['cena']), cuandoSeAnoto: { cena: h('21:15') } };
    expect(resumen(delDia(ajustes, { ...cena, ahora: h('21:15') }))).toEqual([[h('21:20'), ['habito:leer:0']]]);
  });

  it('y con una comida de antes: con la cena anotada, la merienda sin anotar no suena ni corre lo de después de cenar', () => {
    const ajustes: Avisos = { habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 10 }, dias: [] }], comidas: ['merienda'] };
    // Cenó temprano, a las 18:00, sin merendar: el agua, a las 18:10.
    const cena = { eventos: { cena: h('18:00') }, anotadas: new Set<Comida>(['cena']), cuandoSeAnoto: { cena: h('18:00') } };
    expect(resumen(delDia(ajustes, { ...cena, ahora: h('18:01') }))).toEqual([[h('18:10'), ['habito:agua:0']]]);
    // Pasadas las 18:15, la merienda no sonó: el agua no vuelve a las 18:35.
    expect(delDia(ajustes, { ...cena, ahora: h('18:16') })).toEqual([]);
  });

  it('el máximo se cuenta sobre el plan del día: lo hecho o lo anotado no deja entrar lo que no entraba', () => {
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [aLas('leer', '18:00')], comidas: ['almuerzo', 'cena'], maximoPorDia: 2 };
    expect(resumen(delDia(ajustes))).toEqual([[h('18:00'), ['habito:leer:0']], [h('23:00'), ['dormir']]]);
    expect(resumen(delDia(ajustes, { marcas: hecho('leer') }))).toEqual([[h('23:00'), ['dormir']]]);
  });
});

describe('el horario de comidas y pesarse', () => {
  it('cada comida del horario avisa a tu hora de comer, si todavía no se anotó', () => {
    const ajustes: Avisos = { horario: ['desayuno', 'almuerzo'] };
    const tuyas = horas({ desayuno: h('7:45'), almuerzo: h('12:30') });
    expect(resumen(delDia(ajustes, tuyas))).toEqual([[h('7:45'), ['horario:desayuno']], [h('12:30'), ['horario:almuerzo']]]);
    expect(resumen(delDia(ajustes, { ...tuyas, anotadas: new Set<Comida>(['desayuno']) }))).toEqual([[h('12:30'), ['horario:almuerzo']]]);
  });

  it('con una cena tarde, el de «sin anotar» no suena antes ni junto con el de su hora', () => {
    expect(resumen(delDia({ horario: ['cena'], comidas: ['cena'] }, horas({ cena: h('23:45') })))).toEqual([[h('23:45'), ['horario:cena']]]);
    expect(resumen(delDia({ horario: ['cena'], comidas: ['cena'] }, horas({ cena: h('23:15') })))).toEqual([[h('23:15'), ['horario:cena']]]);
  });

  it('lo de «sin anotar» cuenta desde tu hora de comer', () => {
    const lista = delDia({ horario: ['almuerzo'], comidas: ['almuerzo'] }, horas({ almuerzo: h('12:00') }));
    expect(resumen(lista)).toEqual([[h('12:00'), ['horario:almuerzo']], [h('12:00') + DESPUES_MIN, ['comida:almuerzo']]]);
  });

  it('el horario vale como un hábito en el máximo: las comidas sin anotar salen primero', () => {
    const ajustes: Avisos = { horario: ['desayuno', 'almuerzo'], comidas: ['cena'], maximoPorDia: 2 };
    expect(resumen(delDia(ajustes)).map(([, ids]) => ids)).toEqual([['horario:desayuno'], ['horario:almuerzo']]);
  });

  it('pesarse avisa al rato de despertarse el día del control, o cada día si se eligió', () => {
    const control = diaDeLaSemana(VIERNES);
    expect(resumen(delDia({ pesarse: { encendido: true } }, { diaDelControl: control }))).toEqual([[h('7:30') + PESARSE_DESPUES, ['pesarse']]]);
    expect(delDia({ pesarse: { encendido: true } }, { diaDelControl: control })[0].aviso.control).toBe(true);
    expect(delDia({ pesarse: { encendido: true } }, { diaDelControl: ((control + 1) % 7) as DiaSemana })).toEqual([]);
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }))).toEqual([[h('7:30') + PESARSE_DESPUES, ['pesarse']]]);
  });

  it('pesarse no avisa si ya se pesó; sin datos del sueño, a las 8 o antes del desayuno de siempre', () => {
    expect(delDia({ pesarse: { encendido: true, todos: true } }, { pesado: true })).toEqual([]);
    // El desayuno de siempre es a las 8: un cuarto de hora antes.
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }, { sueno: null }))).toEqual([[h('7:45'), ['pesarse']]]);
  });

  it('hoy, el horario y lo de «sin anotar» corren con la última comida que anotaste', () => {
    const horario: Comida[] = ['desayuno', 'almuerzo', 'cena'];
    // Desayunaste a las 9:30: hora y media tarde.
    const hoy = delDia({ horario, comidas: ['cena'] }, { eventos: { desayuno: h('9:30') }, anotadas: new Set<Comida>(['desayuno']) });
    const cuando = (id: string) => hoy.find((n) => n.aviso.id === id)?.minutos;
    expect(cuando('horario:almuerzo')).toBe(h('14:30'));
    expect(cuando('horario:cena')).toBe(h('22:30'));
    // Otro día, sin nada anotado, a su hora.
    const otro = delDia({ horario });
    expect(otro.find((n) => n.aviso.id === 'horario:almuerzo')?.minutos).toBe(h('13:00'));
  });

  it('corren con cualquier comida que anotaste, aunque no avise', () => {
    const desayuno = { eventos: { desayuno: h('9:30') }, anotadas: new Set<Comida>(['desayuno']), ahora: h('9:35') };
    expect(resumen(delDia({ comidas: ['almuerzo', 'cena'] }, desayuno))).toEqual([[h('15:15'), ['comida:almuerzo']], [h('23:15'), ['comida:cena']]]);
    expect(resumen(delDia({ horario: ['almuerzo', 'cena'] }, desayuno))).toEqual([[h('14:30'), ['horario:almuerzo']], [h('22:30'), ['horario:cena']]]);
  });

  it('lo de «sin anotar» corre contra tu hora de comer: anotar a esa hora no corre nada', () => {
    // Tu desayuno es a las 9:30: anotado a las 9:30, el almuerzo queda a su hora.
    const op = { ...horas({ desayuno: h('9:30') }), eventos: { desayuno: h('9:30') }, anotadas: new Set<Comida>(['desayuno']), ahora: h('10:00') };
    expect(resumen(delDia({ horario: ['desayuno'], comidas: ['almuerzo'] }, op))).toEqual([[h('13:45'), ['comida:almuerzo']]]);
  });

  it('lo que ya sonó no vuelve a sonar corrido, y nada pasa de las 23:45 ni del máximo', () => {
    const horario: Comida[] = ['desayuno', 'almuerzo', 'cena'];
    const ajustes: Avisos = { horario, comidas: ['desayuno', 'almuerzo', 'cena'], maximoPorDia: 2 };
    // A las 7, con dos como máximo, suenan las horas del desayuno y del almuerzo.
    expect(resumen(delDia(ajustes, { ahora: h('7:00') }))).toEqual([[h('8:00'), ['horario:desayuno']], [h('13:00'), ['horario:almuerzo']]]);
    // A las 13:20 anota el desayuno olvidado: el almuerzo ya sonó, y no vuelve a las 18:20.
    const olvidado = { ahora: h('13:20'), eventos: { desayuno: h('13:20') }, anotadas: new Set<Comida>(['desayuno']) };
    expect(delDia(ajustes, olvidado)).toEqual([]);
    // Sin máximo, la cena se corre, pero no a la madrugada: como mucho a las 23:45.
    const sinMaximo = delDia({ horario, comidas: ['desayuno', 'almuerzo', 'cena'] }, olvidado);
    expect(sinMaximo.map((n) => n.aviso.id)).not.toContain('horario:almuerzo');
    expect(sinMaximo.find((n) => n.aviso.id === 'horario:cena')?.minutos).toBe(h('23:45'));
    expect(Math.max(...sinMaximo.map((n) => n.minutos))).toBeLessThanOrEqual(h('23:45'));
    // La merienda sonó a las 17 y a las 17:10 anota el almuerzo olvidado: la merienda no vuelve a las 21:10.
    const tarde = delDia({ horario: ['desayuno', 'almuerzo', 'merienda', 'cena'] }, { ...horas({ merienda: h('17:00') }), ahora: h('17:10'), eventos: { desayuno: h('8:00'), almuerzo: h('17:10') }, anotadas: new Set<Comida>(['desayuno', 'almuerzo']) });
    expect(tarde.map((n) => n.aviso.id)).toEqual(['horario:cena']);
  });

  it('pesarse va antes del desayuno: si desayunás enseguida, antes; nunca antes de despertarte; anotado el desayuno, no suena', () => {
    const temprano = (desayuno: string) => ({ horaDeComida: (c: Comida) => (c === 'desayuno' ? h(desayuno) : HORA_DE_COMIDA[c]) });
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }, temprano('7:50')))).toEqual([[h('7:35'), ['pesarse']]]);
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }, temprano('7:35')))).toEqual([[h('7:30'), ['pesarse']]]);
    // Con horario de comidas, igual: tu hora de desayunar.
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true }, horario: ['desayuno'] }, horas({ desayuno: h('7:40') }))).find(([, ids]) => (ids as string[]).includes('pesarse'))?.[0]).toBe(h('7:30'));
    expect(delDia({ pesarse: { encendido: true, todos: true } }, { anotadas: new Set<Comida>(['desayuno']) })).toEqual([]);
  });
});

describe('el aviso de fábrica de los primeros hábitos', () => {
  it('a la hora en que más ayuda cada uno', () => {
    expect(avisoDeFabrica({ tipo: 'salud', dato: 'mindfulness', meta: 10 })).toEqual({ tipo: 'despertar', despues: 15 });
    expect(avisoDeFabrica({ tipo: 'salud', dato: 'pasos', meta: 8000 })).toEqual({ tipo: 'hora', minutos: h('18:00') });
    expect(avisoDeFabrica({ tipo: 'manual' }, 'leer')).toEqual({ tipo: 'dormir', antes: 45 });
  });

  it('dormir y lo de comida no llevan: tienen sus propios avisos', () => {
    expect(avisoDeFabrica({ tipo: 'salud', dato: 'sueno', meta: 420 })).toBeNull();
    expect(avisoDeFabrica({ tipo: 'comida', meta: 'proteina' })).toBeNull();
    expect(avisoDeFabrica({ tipo: 'manual' })).toBeNull();
  });
});

describe('los avisos de la semana', () => {
  const semana = (ajustes: Avisos, extra: Partial<Parameters<typeof avisosDeLaSemana>[0]> = {}) =>
    avisosDeLaSemana({ hoy: VIERNES, ahora: h('12:00'), ajustes, habitos: HABITOS, sueno: SUENO, horaDeComida: (c) => HORA_DE_COMIDA[c], ...extra });

  it('de hoy, lo que falta y no se anotó; de los 6 días siguientes, todo', () => {
    const lista = semana({ comidas: ['almuerzo', 'cena'] }, { anotadasHoy: new Set<Comida>(['almuerzo']) });
    expect(lista.filter((x) => x.dia === VIERNES).map((x) => x.aviso.id)).toEqual(['comida:cena']);
    expect(lista.filter((x) => x.dia === SABADO).map((x) => x.aviso.id)).toEqual(['comida:almuerzo', 'comida:cena']);
    expect(new Set(lista.map((x) => x.dia)).size).toBe(7);
    expect(lista).toHaveLength(1 + 6 * 2);
  });

  it('lo de un evento, solo hoy', () => {
    const lista = semana({ habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'almuerzo', despues: 60 }, dias: [] }] }, { eventosHoy: { almuerzo: h('13:00') } });
    expect(lista.map((x) => [x.dia, x.minutos])).toEqual([[VIERNES, h('14:00')]]);
  });

  it('«en el momento» suena dos minutos después del evento, aunque se programe en ese mismo minuto o en el siguiente', () => {
    const lista = semana({ habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'almuerzo', despues: 0 }, dias: [] }] }, { ahora: h('13:00'), eventosHoy: { almuerzo: h('13:00') } });
    expect(lista.map((x) => [x.dia, x.minutos])).toEqual([[VIERNES, h('13:02')]]);
    // Anotado a las 13:00:59 y reprogramado a las 13:01:00: no se pierde.
    const alMinutoSiguiente = semana({ habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'almuerzo', despues: 0 }, dias: [] }] }, { ahora: h('13:01'), eventosHoy: { almuerzo: h('13:00') } });
    expect(alMinutoSiguiente.map((x) => [x.dia, x.minutos])).toEqual([[VIERNES, h('13:02')]]);
    // Más tarde ya sonó: no se repite.
    const despues = semana({ habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'almuerzo', despues: 0 }, dias: [] }] }, { ahora: h('13:20'), eventosHoy: { almuerzo: h('13:00') } });
    expect(despues).toEqual([]);
  });

  it('pasada la medianoche sigue lo de anoche que todavía no sonó', () => {
    // Se duerme a las 0:45 y se despierta a las 8:45: el de dormir suena a las 0:15, y es de la noche anterior.
    const tarde: Sueno = { ...SUENO, habitual: () => ({ dormirse: n('0:45'), despertar: n('8:45') }) };
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 15 }, dias: [] }] };
    const lista = semana(ajustes, { hoy: SABADO, ahora: h('0:05'), sueno: tarde });
    expect(lista[0]).toMatchObject({
      dia: VIERNES,
      minutos: 24 * 60 + h('0:15'),
      aviso: { id: 'dormir', tipo: 'dormir', minutos: 24 * 60 + h('0:15'), dormirA: 24 * 60 + h('0:45') },
    });
    expect(lista[1]).toMatchObject({ dia: VIERNES, minutos: 24 * 60 + h('0:35'), aviso: { id: 'habito:leer:0', tipo: 'habito', habito: 'leer' } });
    expect(cuandoSuena(lista[0].dia, lista[0].minutos)).toEqual({ dia: SABADO, hora: 0, minuto: 15 });
    // Lo de anoche ya hecho no avisa, y lo que ya sonó no vuelve.
    expect(semana(ajustes, { hoy: SABADO, ahora: h('0:05'), sueno: tarde, marcas: hecho('leer', VIERNES) }).filter((x) => x.dia === VIERNES).map((x) => x.aviso.id)).toEqual(['dormir']);
    expect(semana(ajustes, { hoy: SABADO, ahora: h('0:20'), sueno: tarde }).filter((x) => x.dia === VIERNES).map((x) => x.aviso.id)).toEqual(['habito:leer:0']);
    expect(semana(ajustes, { hoy: SABADO, ahora: h('0:40'), sueno: tarde }).some((x) => x.dia === VIERNES)).toBe(false);
  });
});

describe('lo que ya pasó no avisa (lo pediste el 2/11/2026)', () => {
  const entrenar: Habito = { ...habito('entrenar'), nombre: 'Entrenar', icono: 'dumbbell' };
  const conEntrenar = [...HABITOS, entrenar];
  const ajustes: Avisos = { horario: ['merienda'], habitos: [aLas('entrenar', '17:35')] };

  it('«Hora de la merienda · Entrenar» ya no sale: cada cosa por su lado', () => {
    const lista = delDia(ajustes, { habitos: conEntrenar });
    expect(resumen(lista)).toEqual([[h('17:30'), ['horario:merienda']], [h('17:50'), ['habito:entrenar:0']]]);
  });

  it('con el hábito marcado, no avisa de entrenar', () => {
    expect(resumen(delDia(ajustes, { habitos: conEntrenar, marcas: hecho('entrenar') }))).toEqual([[h('17:30'), ['horario:merienda']]]);
  });

  it('si la sesión de hoy ya empezó a esa hora, tampoco; si es después, sí', () => {
    expect(resumen(delDia(ajustes, { habitos: conEntrenar, sesiones: [{ inicio: h('8:00'), minutos: 60 }] }))).toEqual([[h('17:30'), ['horario:merienda']]]);
    expect(resumen(delDia(ajustes, { habitos: conEntrenar, sesiones: [{ inicio: h('19:00'), minutos: 60 }] }))).toHaveLength(2);
    // Otro hábito cualquiera sigue a su hora, aunque se haya entrenado.
    expect(resumen(delDia({ habitos: [aLas('leer', '17:35')] }, { habitos: conEntrenar, sesiones: [{ inicio: h('8:00'), minutos: 60 }] }))).toHaveLength(1);
  });

  it('entrenar con Ascent también cuenta', () => {
    expect(resumen(delDia(ajustes, { habitos: conEntrenar, eventos: { entrenamiento: h('10:00') } }))).toEqual([[h('17:30'), ['horario:merienda']]]);
  });

  it('un hábito que se llama así también es de entrenar, en los dos idiomas', () => {
    const gym = { ...habito('entrenar'), nombre: 'Gym' };
    expect(delDia({ habitos: [aLas('entrenar', '18:00')] }, { habitos: [gym], sesiones: [{ inicio: h('8:00'), minutos: 60 }] })).toEqual([]);
  });

  it('por el nombre entero: «Ejercicios de respiración» o «Entrenar al perro» no son entrenar, y avisan igual', () => {
    const conNombre = (nombre: string) => delDia({ habitos: [aLas('x', '22:00')] }, { habitos: [{ ...habito('x'), nombre }], sesiones: [{ inicio: h('7:00'), minutos: 60 }] }).length;
    expect(['Ejercicios de respiración', 'Entrenar al perro', 'Brain training', 'Kegel exercises'].map(conNombre)).toEqual([1, 1, 1, 1]);
    expect(['Gym', 'Hacer ejercicio', ' Entrenar ', 'Workout', 'Ir al gimnasio'].map(conNombre)).toEqual([0, 0, 0, 0, 0]);
  });

  it('anotada una comida, la de antes ya pasó: con la cena anotada no hay merienda', () => {
    const horario: Comida[] = ['almuerzo', 'merienda', 'cena'];
    expect(resumen(delDia({ horario }, { anotadas: new Set<Comida>(['cena']) }))).toEqual([]);
    expect(resumen(delDia({ horario }, { anotadas: new Set<Comida>(['almuerzo']) })).map(([, ids]) => ids[0])).toEqual(['horario:merienda', 'horario:cena']);
    // Lo de «sin anotar», igual. El snack no es ni antes ni después.
    expect(delDia({ comidas: ['almuerzo'] }, { anotadas: new Set<Comida>(['cena']) })).toEqual([]);
    expect(delDia({ comidas: ['almuerzo'] }, { anotadas: new Set<Comida>(['snack']) })).toHaveLength(1);
  });
});

describe('lo que falta, aparte del máximo', () => {
  const faltas = [{ minutos: h('19:00'), falta: { que: 'proteina' as const, cuanto: 40, ideas: [{ id: 'huevos' }], alcanza: false, forma: 0 } }];

  it('suena aunque el máximo esté lleno, en su hueco y sin correr a nadie', () => {
    const lista = delDia({ habitos: [aLas('leer', '18:55')], maximoPorDia: 1 }, { faltas });
    expect(resumen(lista)).toEqual([[h('18:55'), ['habito:leer:0']], [h('19:15'), ['falta:proteina']]]);
  });

  it('lo que ya pasó no vuelve', () => {
    expect(delDia({}, { faltas, ahora: h('19:30') })).toEqual([]);
  });

  it('si tendría que esperar mucho, un rato antes: a la noche, más tarde ya es hora de acostarse', () => {
    const lista = delDia({ dormir: { encendido: true }, habitos: [aLas('leer', '22:40')] }, { faltas: [{ ...faltas[0], minutos: h('22:40') }] });
    expect(resumen(lista)).toEqual([[h('22:20'), ['falta:proteina']], [h('22:40'), ['habito:leer:0']], [h('23:00'), ['dormir']]]);
  });

  it('sale siempre en el mismo lugar: lo que ya sonó un rato antes no vuelve a sonar después', () => {
    // La merienda de siempre es a las 17:50: «No olvides anotar lo que comiste en la merienda» a las 18:35 deja lo que falta a las 18:10.
    const merienda = { horaDeComida: (c: Comida) => (c === 'merienda' ? h('17:50') : HORA_DE_COMIDA[c]), faltas: [{ ...faltas[0], minutos: h('18:30') }] };
    expect(resumen(delDia({ comidas: ['merienda'] }, { ...merienda, ahora: h('12:00') }))).toEqual([[h('18:10'), ['falta:proteina']], [h('18:35'), ['comida:merienda']]]);
    // Sonó a las 18:10 y a las 18:15 se vuelve a programar: no se repite a las 18:55.
    expect(resumen(delDia({ comidas: ['merienda'] }, { ...merienda, ahora: h('18:15') }))).toEqual([[h('18:35'), ['comida:merienda']]]);
  });

  it('lo que ya sonó y después se hizo le sigue guardando el lugar', () => {
    const lista = (ahora: string, marcas?: ReturnType<typeof hecho>) => resumen(delDia({ habitos: [aLas('estirar', '18:00')] }, { faltas: [{ ...faltas[0], minutos: h('18:00') }], ahora: h(ahora), marcas }));
    expect(lista('17:00')).toEqual([[h('18:00'), ['habito:estirar:0']], [h('18:20'), ['falta:proteina']]]);
    // Estiró después de que sonara: lo que falta sigue a las 18:20, y no se pierde.
    expect(lista('18:05', hecho('estirar'))).toEqual([[h('18:20'), ['falta:proteina']]]);
  });
});

describe('lo que dice cada aviso', () => {
  type Rama = { [k: string]: string | Rama };
  const palabras = (idioma: Rama) => (clave: string, valores: Record<string, string | number> = {}) => {
    const hoja = clave.split('.').reduce<string | Rama>((o, k) => (o as Rama)[k], idioma);
    if (typeof hoja !== 'string') throw new Error(`Falta ${clave}`);
    return hoja.replace(/\{(\w+)\}/g, (_, k) => {
      if (valores[k] === undefined) throw new Error(`Falta {${k}} en ${clave}`);
      return String(valores[k]);
    });
  };
  const para = (idioma: Rama): ParaElTexto => ({ t: palabras(idioma), habito: () => 'Entrenar', plan: () => '', duracion: (m) => `${m} min` });
  const texto = (aviso: Omit<Aviso, 'minutos' | 'id'>, idioma: Rama = es as unknown as Rama, otro: Partial<ParaElTexto> = {}) =>
    textoDelAviso({ dia: VIERNES, minutos: h('17:30'), aviso: { id: 'x', minutos: h('17:30'), ...aviso } }, { ...para(idioma), ...otro });
  /** El título y el cuerpo, de un aviso que suena a esa hora. */
  const dos = (aviso: Omit<Aviso, 'id'>, idioma: Rama = es as unknown as Rama) => {
    const x = { dia: VIERNES, minutos: aviso.minutos, aviso: { id: 'x', ...aviso } };
    return [tituloDelAviso(x, para(idioma)), textoDelAviso(x, para(idioma))];
  };

  it('una sola cosa, corta y como en tu ejemplo', () => {
    expect(texto({ tipo: 'horario', comida: 'merienda' })).toBe('Hora de la merienda');
    expect(texto({ tipo: 'habito', habito: 'entrenar' })).toBe('Entrenar');
    expect(texto({ tipo: 'habito', habito: 'entrenar', mensaje: 'Las zapatillas' })).toBe('Las zapatillas');
    expect(texto({ tipo: 'comida', comida: 'cena' })).toBe('No olvides anotar lo que comiste en la cena');
    expect(texto({ tipo: 'horario', comida: 'cena' }, en as unknown as Rama)).toBe('Time for dinner');
    // El horario, las comidas sin anotar y los hábitos llevan el nombre de la app.
    for (const aviso of [{ tipo: 'horario', comida: 'cena' }, { tipo: 'comida', comida: 'cena' }, { tipo: 'habito', habito: 'entrenar' }] as const) expect(dos({ minutos: 0, ...aviso })[0]).toBe('Moss');
  });

  it('pesarte: el título lo sugiere y el cuerpo dice cómo y por qué', () => {
    expect(dos({ tipo: 'pesarse', minutos: h('7:40') })).toEqual(['Buen momento para pesarte', 'Antes de desayunar y después de ir al baño, siempre igual: así se ve la tendencia.']);
    expect(dos({ tipo: 'pesarse', minutos: h('7:40'), control: true })).toEqual(['Hoy es tu control', 'Un peso antes de desayunar, como siempre, y Moss revisa tu semana.']);
    expect(dos({ tipo: 'pesarse', minutos: h('7:40') }, en as unknown as Rama)[0]).toBe('A good time to weigh yourself');
  });

  it('acostarte: tu hora en el título; en el cuerpo, cuánto falta y tu periodo de melatonina, sin mandar', () => {
    const periodo = { desde: h('23:30'), hasta: 24 * 60 + h('0:30') };
    const aviso = (antes: number, extra: Partial<Aviso> = {}) => dos({ tipo: 'dormir', minutos: h('23:15') - antes, dormirA: h('23:15'), periodo, despertarA: 24 * 60 + h('7:30'), duerme: 480, ...extra });
    expect(aviso(30)).toEqual(['Tu hora de acostarte: 23:15', 'Falta media hora. Es la que te deja dormido dentro de tu periodo de melatonina (23:30 – 00:30).']);
    expect([15, 45, 60, 20, 0].map((antes) => aviso(antes)[1].split('.')[0])).toEqual(['Faltan 15 minutos', 'Faltan 45 minutos', 'Falta una hora', 'Faltan 20 minutos', 'Es ahora']);
    // La noche que nombra la deuda.
    expect(aviso(30, { deuda: 240 })[1]).toBe('Falta media hora. Tienes 240 min de deuda de sueño: acostarte a tu hora ayuda a bajarla.');
    // Sin periodo, cuánto dormirías.
    expect(aviso(30, { periodo: undefined })[1]).toBe('Falta media hora. A esa hora dormirías 480 min y te despertarías a las 07:30.');
    expect(dos({ tipo: 'dormir', minutos: h('22:45'), dormirA: h('23:15'), periodo }, en as unknown as Rama)).toEqual(['Your bedtime: 23:15', 'Half an hour to go. It gets you asleep within your melatonin window (23:30 – 00:30).']);
  });

  it('los de la noche y la mañana sugieren, no mandan: ningún título empieza con una orden, y nunca «a la cama»', () => {
    const titulos = (o: Rama, ruta = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? (/titulo/i.test(ruta + k) ? [v] : []) : titulos(v, `${ruta}${k}.`)));
    const r = (es as unknown as Rama).recordatorios as Rama;
    const deLaNocheYLaManana = [r.acostarte, r.pesarte, (r.despertar as Rama), (r.conviene as Rama).cafe, (r.conviene as Rama).luces, (r.conviene as Rama).ultimaComida, (r.conviene as Rama).tarde, (r.conviene as Rama).antes] as Rama[];
    for (const titulo of deLaNocheYLaManana.flatMap((x) => titulos(x))) expect(titulo).not.toMatch(/^(Acuéstate|Ve |Baja |Cena |Come |Pésate|Ponte|Anota |Termina|Almuerza|Merienda |Deja |A dormir)/);
    expect(JSON.stringify(r)).not.toMatch(/a la cama/i);
  });

  it('con un plan, dice qué toca', () => {
    expect(texto({ tipo: 'horario', comida: 'almuerzo' }, es as unknown as Rama, { plan: () => 'pollo, arroz' })).toBe('Hora del almuerzo: pollo, arroz');
  });

  it('lo que falta: qué, cuánto y la idea', () => {
    const falta = (extra: Partial<Falta>): Falta => ({ que: 'proteina', cuanto: 40, ideas: [{ id: 'yogurGriego' }, { id: 'huevos' }], alcanza: true, forma: 0, ...extra });
    expect(texto({ tipo: 'falta', falta: falta({}) })).toBe('Te faltan 40 g de proteína: un yogur griego y dos huevos lo resuelven.');
    expect(texto({ tipo: 'falta', falta: falta({ ideas: [{ id: 'atun' }] }) })).toBe('Te faltan 40 g de proteína: una lata de atún lo resuelve.');
    expect(texto({ tipo: 'falta', falta: falta({ alcanza: false }) })).toBe('Te faltan 40 g de proteína: un yogur griego y dos huevos te acercan.');
    expect(texto({ tipo: 'falta', falta: falta({ forma: 1 }) })).toBe('40 g de proteína y llegas: un yogur griego y dos huevos.');
    expect(texto({ tipo: 'falta', falta: falta({ ideas: [{ nombre: 'Yogur griego Conaprole' }, { nombre: 'Higos' }] }) })).toBe('Te faltan 40 g de proteína: yogur griego Conaprole e higos lo resuelven.');
    // Un nombre propio o una marca quedan como están.
    expect(texto({ tipo: 'falta', falta: falta({ que: 'calorias', cuanto: 500, ideas: [{ nombre: 'Big Mac' }] }) })).toBe('Te faltan 500 kcal: Big Mac lo resuelve.');
    expect(texto({ tipo: 'falta', falta: falta({ ideas: [{ nombre: 'McCrispy' }, { nombre: 'Coca-Cola' }] }) })).toBe('Te faltan 40 g de proteína: McCrispy y Coca-Cola lo resuelven.');
    expect(texto({ tipo: 'falta', falta: falta({ sinNumeros: true }) })).toBe('Vas bajo de proteína hoy: un yogur griego y dos huevos ayudan.');
    expect(texto({ tipo: 'falta', falta: falta({ que: 'calorias', cuanto: 500, ideas: [{ id: 'pasta' }] }) })).toBe('Te faltan 500 kcal: un plato de pasta lo resuelve.');
    expect(texto({ tipo: 'falta', falta: falta({ que: 'agua', cuanto: 5, ideas: [] }) })).toBe('Te faltan 5 vasos de agua: toma uno ahora.');
    expect(texto({ tipo: 'falta', falta: falta({}) }, en as unknown as Rama)).toBe("You're 40 g short on protein: a Greek yogurt and two eggs will do it.");
  });

  it('todas las formas y todas las ideas tienen su texto, en los dos idiomas y sin dejar nada sin completar', () => {
    for (const idioma of [es, en] as unknown as Rama[]) {
      for (const id of IDEAS_DE_LA_LISTA) expect(palabras(idioma)(`recordatorios.falta.ideas.${id}`).length).toBeGreaterThan(2);
      for (const que of ['proteina', 'calorias', 'agua'] as const) {
        for (const alcanza of [true, false]) {
          for (const sinNumeros of [true, false]) {
            for (const ideas of [[{ id: 'huevos' }], [{ id: 'huevos' }, { id: 'leche' }]]) {
              for (let forma = 0; forma < 6; forma++) {
                const dicho = texto({ tipo: 'falta', falta: { que, cuanto: 40, ideas, alcanza, forma, ...(sinNumeros ? { sinNumeros: true as const } : {}) } }, idioma);
                expect(dicho).not.toMatch(/[{}]|undefined/);
                expect(dicho.length).toBeLessThanOrEqual(90);
              }
            }
          }
        }
      }
      for (const c of ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'] as const) {
        expect(texto({ tipo: 'horario', comida: c }, idioma).length).toBeGreaterThan(3);
        expect(texto({ tipo: 'comida', comida: c }, idioma).length).toBeGreaterThan(3);
      }
      // Acostarte, en todas sus formas: con periodo, sin él, la noche de la deuda y sin nada que decir.
      for (const extra of [{ periodo: { desde: h('23:45'), hasta: h('23:45') + 60 } }, { despertarA: h('7:30'), duerme: 480 }, { deuda: 90 }, {}]) {
        for (const antes of [0, 15, 20, 30, 45, 60]) {
          for (const dicho of dos({ tipo: 'dormir', minutos: h('23:30') - antes, dormirA: h('23:30'), ...extra }, idioma)) expect(dicho).not.toMatch(/[{}]|undefined/);
        }
      }
      for (const control of [true, false]) for (const dicho of dos({ tipo: 'pesarse', minutos: 0, control }, idioma)) expect(dicho.length).toBeGreaterThan(3);
    }
  });
});

describe('cuándo suena en el reloj', () => {
  it('lo de la noche cae al día siguiente; lo demás, ese día', () => {
    expect(cuandoSuena(VIERNES, 24 * 60 + 15)).toEqual({ dia: SABADO, hora: 0, minuto: 15 });
    expect(cuandoSuena(VIERNES, h('7:30'))).toEqual({ dia: VIERNES, hora: 7, minuto: 30 });
  });

  it('es hora de reloj: la noche de un cambio de hora no la corre', () => {
    // La hora cambia la madrugada del 25 de octubre de 2026 en Europa y la del 1 de noviembre en Estados Unidos.
    expect(cuandoSuena('2026-10-24', 24 * 60 + h('2:30'))).toEqual({ dia: '2026-10-25', hora: 2, minuto: 30 });
    expect(cuandoSuena('2026-10-31', 24 * 60 + h('1:30'))).toEqual({ dia: '2026-11-01', hora: 1, minuto: 30 });
  });
});
