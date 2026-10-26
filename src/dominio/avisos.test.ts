import { describe, expect, it } from '@jest/globals';

import {
  ADELANTO_MAXIMO, ANTES_DE_DORMIR, avisoDeFabrica, avisosDeLaSemana, avisosDelDia, cuandoSuena, horaDeDormir, horasDeSueno, MAXIMO_POR_DIA, MENSAJE_MAXIMO,
  PAGO_MAXIMO, PESARSE_DESPUES, VENTANA,
  type Avisos, type DelDia, type Notificacion, type Sueno,
} from './avisos';
import type { Comida } from './comidas';
import { claveDeMarca } from './dias';
import { diaDeLaSemana, type DiaSemana } from './fechas';
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
/** A qué hora suena cada cosa y qué junta. */
const resumen = (lista: Notificacion[]) => lista.map((x) => [x.minutos, x.avisos.map((a) => a.id)]);
const hecho = (habito: string, dia = VIERNES) => new Map([[claveDeMarca(habito, dia), { hecho: true }]]);
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
});

describe('las horas de sueño de un día', () => {
  it('la mañana sale de lo de siempre y la noche, de la mañana siguiente, en minutos desde la medianoche', () => {
    expect(horasDeSueno(VIERNES, SUENO)).toEqual({ despertar: h('7:30'), dormir: h('23:30') });
  });

  it('la alarma gana a lo de siempre, y la del sábado decide la noche del viernes, que pasa de la medianoche', () => {
    // Se despierta el sábado a las 9 y necesita 8 horas: dormirse a la 1 del sábado, que es la noche del viernes.
    expect(horasDeSueno(VIERNES, { ...SUENO, alarmas: { 5: h('6:30'), 6: h('9:00') } })).toEqual({ despertar: h('6:30'), dormir: 24 * 60 + h('1:00') });
  });

  it('lo de siempre es el de cada noche: el fin de semana puede ser otro', () => {
    const finde = (c: string) => [6, 0].includes(diaDeLaSemana(c));
    const s: Sueno = { ...SUENO, habitual: (c) => (finde(c) ? { dormirse: n('0:30'), despertar: n('9:30') } : { dormirse: n('23:30'), despertar: n('7:30') }) };
    // La noche del viernes termina el sábado.
    expect(horasDeSueno(VIERNES, s)).toEqual({ despertar: h('7:30'), dormir: 24 * 60 + h('1:30') });
    expect(horasDeSueno(JUEVES, s).dormir).toBe(h('23:30'));
  });

  it('sin datos del sueño, nada', () => {
    expect(horasDeSueno(VIERNES, { ...SUENO, habitual: () => null })).toEqual({ despertar: null, dormir: null });
  });
});

describe('los avisos de un día', () => {
  it('el de dormir avisa media hora antes de la hora de dormirse; apagado o sin datos del sueño, nada', () => {
    expect(ANTES_DE_DORMIR).toBe(30);
    expect(delDia({ dormir: { encendido: true } })).toEqual([
      { dia: VIERNES, minutos: h('23:00'), avisos: [{ id: 'dormir', tipo: 'dormir', minutos: h('23:00'), dormirA: h('23:30') }] },
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
    // Sin datos del sueño queda solo el de hora fija.
    expect(resumen(delDia(ajustes, { sueno: null }))).toEqual([[h('18:00'), ['habito:estirar:0']]]);
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
    expect(lista.map((x) => x.avisos[0])).toEqual([
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

  it('lo que cae a 20 minutos del primero suena junto, a la hora del primero; entre dos sonidos, más de 20 minutos', () => {
    const lista = delDia({ habitos: [aLas('agua', '10:00'), aLas('leer', '10:20'), aLas('estirar', '10:21'), aLas('pesas', '10:45')] });
    expect(resumen(lista)).toEqual([
      [h('10:00'), ['habito:agua:0', 'habito:leer:0']],
      [h('10:21'), ['habito:estirar:0']],
      [h('10:45'), ['habito:pesas:0']],
    ]);
    expect(lista.every((x, i) => i === 0 || x.minutos - lista[i - 1].minutos > VENTANA)).toBe(true);
  });

  it('el de dormir junta lo de antes de dormirse que cae cerca, y suena con lo primero', () => {
    const lista = delDia({ dormir: { encendido: true }, habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }] });
    expect(resumen(lista)).toEqual([[h('22:45'), ['habito:leer:0', 'dormir']]]);
  });

  it('el máximo: primero el de dormir, después los hábitos y al final las comidas; entre iguales, el que junta más y el más temprano', () => {
    const ajustes: Avisos = {
      dormir: { encendido: true },
      habitos: [aLas('agua', '9:00'), aLas('estirar', '14:00'), aLas('leer', '18:00')],
      comidas: ['almuerzo', 'cena'],
    };
    // Cinco grupos: el almuerzo (13:45) junta el estirar de las 14.
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 10 }))).toEqual([
      [h('9:00'), ['habito:agua:0']],
      [h('13:45'), ['comida:almuerzo', 'habito:estirar:0']],
      [h('18:00'), ['habito:leer:0']],
      [h('21:45'), ['comida:cena']],
      [h('23:00'), ['dormir']],
    ]);
    // De fábrica entran los cinco; con cuatro, sale la cena (una comida sin anotar, la última).
    expect(MAXIMO_POR_DIA).toBe(6);
    expect(resumen(delDia(ajustes))).toHaveLength(5);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 4 })).map(([minutos]) => minutos)).toEqual([h('9:00'), h('13:45'), h('18:00'), h('23:00')]);
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 3 })).map(([minutos]) => minutos)).toEqual([h('9:00'), h('13:45'), h('23:00')]);
    // Con dos, el grupo de dos le gana al agua, aunque sea más temprana.
    expect(resumen(delDia({ ...ajustes, maximoPorDia: 2 })).map(([minutos]) => minutos)).toEqual([h('13:45'), h('23:00')]);
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

  it('lo de después de un evento va con el aviso de los 20 minutos siguientes; con uno de antes no, que pudo sonar antes de saberse', () => {
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }] };
    // Cenó a las 22:20: el agua (22:50) va con el de dormir de las 23:00.
    expect(resumen(delDia(ajustes, { eventos: { cena: h('22:20') } }))).toEqual([[h('23:00'), ['habito:agua:0', 'dormir']]]);
    expect(resumen(delDia(ajustes, { eventos: { cena: h('22:35') } }))).toEqual([[h('23:00'), ['dormir']], [h('23:05'), ['habito:agua:0']]]);
  });

  it('hoy, lo que ya sonó no vuelve a sonar, aunque después se haga lo primero del grupo', () => {
    const ajustes: Avisos = { habitos: [aLas('leer', '13:30')], comidas: ['almuerzo'] };
    expect(resumen(delDia(ajustes, { ahora: h('13:00') }))).toEqual([[h('13:30'), ['habito:leer:0', 'comida:almuerzo']]]);
    // Leyó antes de que sonara: el grupo suena igual a su hora, solo con el almuerzo.
    expect(resumen(delDia(ajustes, { ahora: h('13:00'), marcas: hecho('leer') }))).toEqual([[h('13:30'), ['comida:almuerzo']]]);
    // Sonó a las 13:30 y leyó después: el almuerzo de las 13:45 ya llegó con él.
    expect(delDia(ajustes, { ahora: h('13:35'), marcas: hecho('leer') })).toEqual([]);
    expect(delDia(ajustes, { ahora: h('13:35') })).toEqual([]);
  });

  it('el máximo se cuenta sobre el plan del día: lo hecho o lo anotado no deja entrar lo que no entraba', () => {
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [aLas('leer', '18:00')], comidas: ['almuerzo', 'cena'], maximoPorDia: 2 };
    expect(resumen(delDia(ajustes))).toEqual([[h('18:00'), ['habito:leer:0']], [h('23:00'), ['dormir']]]);
    expect(resumen(delDia(ajustes, { marcas: hecho('leer') }))).toEqual([[h('23:00'), ['dormir']]]);
  });
});

describe('el horario de comidas y pesarse', () => {
  it('cada comida del horario avisa a su hora, si todavía no se anotó', () => {
    const ajustes: Avisos = { horario: { desayuno: h('7:45'), almuerzo: h('12:30') } };
    expect(resumen(delDia(ajustes))).toEqual([[h('7:45'), ['horario:desayuno']], [h('12:30'), ['horario:almuerzo']]]);
    expect(resumen(delDia(ajustes, { anotadas: new Set<Comida>(['desayuno']) }))).toEqual([[h('12:30'), ['horario:almuerzo']]]);
  });

  it('con horario, lo de «sin anotar» cuenta desde la hora elegida y no desde la de siempre', () => {
    const lista = delDia({ horario: { almuerzo: h('12:00') }, comidas: ['almuerzo'] });
    expect(resumen(lista)).toEqual([[h('12:00'), ['horario:almuerzo']], [h('12:00') + DESPUES_MIN, ['comida:almuerzo']]]);
  });

  it('el horario vale como un hábito en el máximo: las comidas sin anotar salen primero', () => {
    const ajustes: Avisos = { horario: { desayuno: h('8:00'), almuerzo: h('13:00') }, comidas: ['cena'], maximoPorDia: 2 };
    expect(resumen(delDia(ajustes)).map(([, ids]) => ids)).toEqual([['horario:desayuno'], ['horario:almuerzo']]);
  });

  it('pesarse avisa al rato de despertarse el día del control, o cada día si se eligió', () => {
    const control = diaDeLaSemana(VIERNES);
    expect(resumen(delDia({ pesarse: { encendido: true } }, { diaDelControl: control }))).toEqual([[h('7:30') + PESARSE_DESPUES, ['pesarse']]]);
    expect(delDia({ pesarse: { encendido: true } }, { diaDelControl: control })[0].avisos[0].control).toBe(true);
    expect(delDia({ pesarse: { encendido: true } }, { diaDelControl: ((control + 1) % 7) as DiaSemana })).toEqual([]);
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }))).toEqual([[h('7:30') + PESARSE_DESPUES, ['pesarse']]]);
  });

  it('pesarse no avisa si ya se pesó, y sin datos del sueño va a las 8', () => {
    expect(delDia({ pesarse: { encendido: true, todos: true } }, { pesado: true })).toEqual([]);
    expect(resumen(delDia({ pesarse: { encendido: true, todos: true } }, { sueno: null }))).toEqual([[h('8:00'), ['pesarse']]]);
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
    expect(lista.filter((x) => x.dia === VIERNES).map((x) => x.avisos[0].id)).toEqual(['comida:cena']);
    expect(lista.filter((x) => x.dia === SABADO).map((x) => x.avisos[0].id)).toEqual(['comida:almuerzo', 'comida:cena']);
    expect(new Set(lista.map((x) => x.dia)).size).toBe(7);
    expect(lista).toHaveLength(1 + 6 * 2);
  });

  it('lo de un evento, solo hoy', () => {
    const lista = semana({ habitos: [{ habito: 'agua', cuando: { tipo: 'evento', evento: 'almuerzo', despues: 60 }, dias: [] }] }, { eventosHoy: { almuerzo: h('13:00') } });
    expect(lista.map((x) => [x.dia, x.minutos])).toEqual([[VIERNES, h('14:00')]]);
  });

  it('pasada la medianoche sigue lo de anoche que todavía no sonó', () => {
    // Se duerme a las 0:45 y se despierta a las 8:45: el de dormir suena a las 0:15, y es de la noche anterior.
    const tarde: Sueno = { ...SUENO, habitual: () => ({ dormirse: n('0:45'), despertar: n('8:45') }) };
    const ajustes: Avisos = { dormir: { encendido: true }, habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 15 }, dias: [] }] };
    const lista = semana(ajustes, { hoy: SABADO, ahora: h('0:05'), sueno: tarde });
    expect(lista[0]).toEqual({
      dia: VIERNES,
      minutos: 24 * 60 + h('0:15'),
      avisos: [
        { id: 'dormir', tipo: 'dormir', minutos: 24 * 60 + h('0:15'), dormirA: 24 * 60 + h('0:45') },
        { id: 'habito:leer:0', tipo: 'habito', habito: 'leer', minutos: 24 * 60 + h('0:30') },
      ],
    });
    expect(cuandoSuena(lista[0].dia, lista[0].minutos)).toEqual({ dia: SABADO, hora: 0, minuto: 15 });
    // Lo de anoche ya hecho no avisa, y lo que ya sonó no vuelve.
    expect(semana(ajustes, { hoy: SABADO, ahora: h('0:05'), sueno: tarde, marcas: hecho('leer', VIERNES) })[0].avisos.map((a) => a.id)).toEqual(['dormir']);
    expect(semana(ajustes, { hoy: SABADO, ahora: h('0:20'), sueno: tarde }).some((x) => x.dia === VIERNES)).toBe(false);
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
