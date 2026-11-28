import { describe, expect, it, jest } from '@jest/globals';

import { sumarDias } from './fechas';
import {
  armarNoches, calidadDeNoche, cuentaParaLaDeuda, despiertoDeLaNoche, deudaDeSueno, faltaDeLaNoche, horario, marcaDe, necesidad, necesidadesPara, necesidadPropuesta, nivelDeLaNoche, nochesDeLaDeuda, juicioDeLaDeuda, pareceIncompleta, pocoSuenoSostenido, redondearDeuda,
  soloEnCama, TOPES_DE_UNA_NOCHE, ultimasNoches, vitalDeNoche,
  type Etapa, type Fuente, type Muestra, type Noche,
} from './sueno';

const RELOJ: Fuente = { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' };
const ANILLO: Fuente = { id: 'anillo', nombre: 'Oura', tipo: 'otra' };
const IPHONE: Fuente = { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' };
const GARMIN: Fuente = { id: 'com.garmin.connect.mobile', nombre: 'Connect', tipo: 'otra' };
const WHOOP: Fuente = { id: 'com.whoop.iphone', nombre: 'WHOOP', tipo: 'otra' };
const SLEEP_CYCLE: Fuente = { id: 'com.northcube.sleepcycle', nombre: 'Sleep Cycle', tipo: 'telefono' };
const UY = -180;

/** Un instante en hora de Uruguay: «2026-10-21 07:13». */
const hora = (texto: string, zona = UY) => Date.parse(texto.replace(' ', 'T') + ':00.000Z') - zona * 60_000;
const m = (etapa: Etapa, desde: string, hasta: string, fuente = RELOJ.id, zona = UY): Muestra => ({ etapa, desde: hora(desde, zona), hasta: hora(hasta, zona), fuente, zona });

/** Una noche del reloj con etapas, de `dormirse` a `despertar`, con dos despertares (uno corto). */
function nocheDelReloj(dia: string, siguiente: string, dormirse = '23:40', despertar = '07:10', fuente = RELOJ.id): Muestra[] {
  return [
    m('nucleo', `${dia} ${dormirse}`, `${siguiente} 00:30`, fuente),
    m('profundo', `${siguiente} 00:30`, `${siguiente} 01:30`, fuente),
    m('nucleo', `${siguiente} 01:30`, `${siguiente} 02:40`, fuente),
    m('despierto', `${siguiente} 02:40`, `${siguiente} 02:52`, fuente),
    m('rem', `${siguiente} 02:52`, `${siguiente} 04:00`, fuente),
    m('nucleo', `${siguiente} 04:00`, `${siguiente} 05:20`, fuente),
    m('despierto', `${siguiente} 05:20`, `${siguiente} 05:23`, fuente),
    m('rem', `${siguiente} 05:23`, `${siguiente} ${despertar}`, fuente),
  ];
}

describe('armar las noches', () => {
  it('una noche del reloj es del día en que te despertás, con sus etapas y sus despertares', () => {
    const [n] = armarNoches([...nocheDelReloj('2026-10-20', '2026-10-21'), m('enCama', '2026-10-20 23:20', '2026-10-21 07:25', IPHONE.id)], [RELOJ, IPHONE]);
    expect(n.clave).toBe('2026-10-21');
    expect(n.fuente.id).toBe('reloj');
    // De 23:40 a 7:10 son 450 minutos, menos 15 despierto.
    expect(n.dormido).toBe(435);
    expect(n.despierto).toBe(15);
    // El de 3 minutos es un cambio de etapa, no un despertar.
    expect(n.despertares).toBe(1);
    expect(n.etapas).toEqual({ nucleo: 200, profundo: 60, rem: 175, sinEtapa: 0 });
    // Los minutos desde las 18 del día anterior: 23:40 es 340 y 7:10, 790.
    expect([n.dormirse, n.despertar]).toEqual([340, 790]);
    // El tiempo en cama es del teléfono: se muestra, con confianza baja.
    expect(n.enCama).toMatchObject({ minutos: 485, fuente: { id: 'iphone' } });
    expect(n.confianza).toEqual({ duracion: 'alta', horario: 'alta', despertares: 'media', etapas: 'baja', enCama: 'baja' });
  });

  it('con dos aparatos se usa uno solo: el reloj, salvo que elijas el otro; nunca se suman', () => {
    const muestras = [...nocheDelReloj('2026-10-20', '2026-10-21'), ...nocheDelReloj('2026-10-20', '2026-10-21', '23:50', '07:00', ANILLO.id)];
    const [n] = armarNoches(muestras, [RELOJ, ANILLO]);
    expect(n.fuente.id).toBe('reloj');
    expect(n.dormido).toBe(435);
    expect(armarNoches(muestras, [RELOJ, ANILLO], 'anillo')[0].fuente.id).toBe('anillo');
  });

  it('el orden va por cómo distingue cada marca el sueño de la vigilia: WHOOP, sin etapas, gana a Garmin', () => {
    expect([RELOJ, ANILLO, GARMIN, WHOOP, SLEEP_CYCLE, IPHONE].map(marcaDe)).toEqual(['appleWatch', 'oura', 'garmin', 'whoop', 'telefono', 'telefono']);
    const conGarmin = nocheDelReloj('2026-10-20', '2026-10-21', '23:30', '07:20', GARMIN.id);
    const conWhoop = [m('dormido', '2026-10-20 23:45', '2026-10-21 07:05', WHOOP.id)];
    expect(armarNoches([...conGarmin, ...conWhoop], [GARMIN, WHOOP])[0].fuente.id).toBe(WHOOP.id);
    // Una app del teléfono va después de cualquier aparato, y lo anotado a mano en Salud, después de todo.
    const deLaApp = [m('dormido', '2026-10-20 23:00', '2026-10-21 07:30', SLEEP_CYCLE.id)];
    expect(armarNoches([...deLaApp, ...conGarmin], [SLEEP_CYCLE, GARMIN])[0].fuente.id).toBe(GARMIN.id);
    const aMano = [{ ...m('dormido', '2026-10-20 23:00', '2026-10-21 07:00', RELOJ.id), aMano: true as const }];
    const [n] = armarNoches([...aMano, ...deLaApp], [RELOJ, SLEEP_CYCLE]);
    expect(n.fuente.id).toBe(SLEEP_CYCLE.id);
    // Lo de la app del teléfono es poco confiable; lo anotado a mano, como un diario.
    expect(n.confianza.duracion).toBe('baja');
    expect(armarNoches(aMano, [RELOJ])[0]).toMatchObject({ aMano: true, confianza: { duracion: 'media', despertares: 'baja' } });
  });

  it('el mismo sueño desde dos fuentes es uno; la siesta de otra fuente cuenta si no se encima con la noche', () => {
    // El reloj solo registró una siesta; el anillo, la noche: la noche es del anillo y la siesta, del reloj.
    const siestaDelReloj = [m('nucleo', '2026-10-21 15:00', '2026-10-21 15:40')];
    const nocheDelAnillo = nocheDelReloj('2026-10-20', '2026-10-21', '23:40', '07:10', ANILLO.id);
    const [n] = armarNoches([...siestaDelReloj, ...nocheDelAnillo], [RELOJ, ANILLO]);
    expect(n.fuente.id).toBe(ANILLO.id);
    expect(n.dormido).toBe(435);
    expect(n.siestas).toBe(40);
    // Si los dos registraron la misma siesta, cuenta una vez.
    const siestaDelAnillo = [m('nucleo', '2026-10-21 15:05', '2026-10-21 15:35', ANILLO.id)];
    expect(armarNoches([...siestaDelReloj, ...siestaDelAnillo, ...nocheDelAnillo], [RELOJ, ANILLO])[0].siestas).toBe(40);
  });

  it('qué tan precisa es la noche: de 0 (sin datos) a 4 (con etapas y lo de la noche)', () => {
    const [conEtapas] = armarNoches(nocheDelReloj('2026-10-20', '2026-10-21'), [RELOJ]);
    const [sinEtapas] = armarNoches([m('dormido', '2026-10-20 23:45', '2026-10-21 07:05', WHOOP.id)], [WHOOP]);
    const [aMano] = armarNoches([{ ...m('dormido', '2026-10-20 23:00', '2026-10-21 07:00'), aMano: true as const }], [RELOJ]);
    expect([nivelDeLaNoche(null), nivelDeLaNoche(aMano), nivelDeLaNoche(sinEtapas), nivelDeLaNoche(conEtapas), nivelDeLaNoche(conEtapas, true)]).toEqual([0, 1, 2, 3, 4]);
    expect(nivelDeLaNoche({ ...conEtapas, moss: { origen: 'estimada', confianza: 'alta', rango: null } })).toBe(1);
  });

  it('lo dormido sin etapa que se encima con etapas de la misma fuente no cuenta doble', () => {
    const [n] = armarNoches([...nocheDelReloj('2026-10-20', '2026-10-21'), m('dormido', '2026-10-20 23:40', '2026-10-21 07:10')], [RELOJ]);
    expect(n.dormido).toBe(435);
    expect(n.etapas.sinEtapa).toBe(0);
  });

  it('el «en cama» del teléfono solo no es sueño: no hay noche, pero se puede mostrar aparte', () => {
    const muestras = [m('enCama', '2026-10-20 23:10', '2026-10-21 07:30', IPHONE.id)];
    const noches = armarNoches(muestras, [IPHONE]);
    expect(noches).toEqual([]);
    expect(soloEnCama(muestras, [IPHONE], noches).get('2026-10-21')).toMatchObject({ minutos: 500, fuente: { id: 'iphone' } });
  });

  it('una siesta es del día y no de la noche; lo que termina después de las 18 es del día siguiente', () => {
    const noches = armarNoches([
      ...nocheDelReloj('2026-10-17', '2026-10-18'),
      m('nucleo', '2026-10-18 15:20', '2026-10-18 15:55'),
      m('nucleo', '2026-10-18 19:10', '2026-10-18 19:40'),
      ...nocheDelReloj('2026-10-18', '2026-10-19'),
    ], [RELOJ]);
    const domingo = noches.find((n) => n.clave === '2026-10-18')!;
    expect(domingo.siestas).toBe(35);
    expect(domingo.dormido).toBe(435);
    // La de las 19 ya es del lunes: una siesta de la noche del lunes.
    expect(noches.find((n) => n.clave === '2026-10-19')).toMatchObject({ dormido: 435, siestas: 30 });
  });

  it('una siesta no es la noche, aunque sea lo único que hay en Salud ese día (el anillo cargando de noche)', () => {
    const delDia = (muestras: Muestra[]) => armarNoches(muestras, [RELOJ, ANILLO]).map((n) => [n.clave, n.fuente.id, n.dormido, n.siestas]);
    // De 14:00 a 14:40, o de 19:10 a 19:40 (ya del día siguiente): no hay noche.
    expect(delDia([m('nucleo', '2026-10-21 14:00', '2026-10-21 14:40', ANILLO.id)])).toEqual([]);
    expect(delDia([m('nucleo', '2026-10-20 19:10', '2026-10-20 19:40', ANILLO.id)])).toEqual([]);
    // Dormir 2 horas y despertarte a las 6 sí es la noche, y una siesta más larga no le gana.
    expect(delDia([m('nucleo', '2026-10-21 04:00', '2026-10-21 06:00')])).toEqual([['2026-10-21', RELOJ.id, 120, 0]]);
    expect(delDia([m('nucleo', '2026-10-21 04:00', '2026-10-21 06:00'), m('nucleo', '2026-10-21 13:00', '2026-10-21 15:30')])).toEqual([['2026-10-21', RELOJ.id, 120, 150]]);
    // Tres horas o más de día también son la noche: quien trabaja de noche.
    expect(delDia([m('nucleo', '2026-10-21 08:00', '2026-10-21 15:00')])).toEqual([['2026-10-21', RELOJ.id, 420, 0]]);
  });

  it('la noche partida en el reloj y de corrido en otra fuente: cuenta lo que suma cada fuente, y gana el reloj', () => {
    const muestras = [m('nucleo', '2026-10-20 23:00', '2026-10-21 02:30'), m('nucleo', '2026-10-21 04:00', '2026-10-21 07:00'), m('dormido', '2026-10-20 23:00', '2026-10-21 07:00', SLEEP_CYCLE.id)];
    const ver = (elegida?: string) => armarNoches(muestras, [RELOJ, SLEEP_CYCLE], elegida).map((n) => [n.fuente.id, n.dormido, n.despierto, n.siestas]);
    // Antes: Sleep Cycle con 480, porque cada tramo del reloj solo no llegaba a dos tercios de lo de la app.
    expect(ver()).toEqual([[RELOJ.id, 390, 90, 0]]);
    expect(ver(RELOJ.id)).toEqual([[RELOJ.id, 390, 90, 0]]);
    // Elegida la app, la de la app.
    expect(ver(SLEEP_CYCLE.id)).toEqual([[SLEEP_CYCLE.id, 480, 0, 0]]);
  });

  it('el sueño partido (despierto más de una hora en el medio) es una sola noche', () => {
    const [n] = armarNoches([m('nucleo', '2026-10-20 23:00', '2026-10-21 02:00'), m('nucleo', '2026-10-21 03:30', '2026-10-21 07:00')], [RELOJ]);
    expect(n.dormido).toBe(390);
    expect(n.despierto).toBe(90);
  });

  describe('la noche en dos tramos (18/11/2026: te dormiste a las 00:16, te despertaste a las 6:22, volviste a dormirte a las 6:30 y te despertaste a las 8:30)', () => {
    const RINGS: Fuente = { id: 'com.moyoung.darings', nombre: 'Da Rings', tipo: 'otra' };
    const r = (etapa: Etapa, desde: string, hasta: string, fuente = RINGS.id) => m(etapa, `2026-11-18 ${desde}`, `2026-11-18 ${hasta}`, fuente);
    // 00:16 son 376 minutos desde las 18; 8:30, 870. Dormido: 366 + 120.
    const UNA_NOCHE = { clave: '2026-11-18', dormirse: 376, despertar: 870, dormido: 486, despierto: 8, despertares: 1, siestas: 0 };
    const ver = (n: Noche) => ({ clave: n.clave, dormirse: n.dormirse, despertar: n.despertar, dormido: n.dormido, despierto: n.despierto, despertares: n.despertares, siestas: n.siestas });

    it('es una sola noche, del primer dormirte al último despertar, con el rato del medio despierto', () => {
      // Los dos tramos sin etapas; el primero con etapas y el segundo sin; con «en cama» y «despierto» en el medio.
      expect(armarNoches([r('dormido', '00:16', '06:22'), r('dormido', '06:30', '08:30')], [RINGS]).map(ver)).toEqual([UNA_NOCHE]);
      expect(armarNoches([r('nucleo', '00:16', '03:00'), r('profundo', '03:00', '06:22'), r('dormido', '06:30', '08:30')], [RINGS]).map(ver)).toEqual([UNA_NOCHE]);
      expect(armarNoches([r('dormido', '00:16', '06:22'), r('despierto', '06:22', '06:30'), r('enCama', '06:20', '08:30'), r('dormido', '06:30', '08:30')], [RINGS]).map(ver)).toEqual([UNA_NOCHE]);
    });

    it('la causa: otra fuente que solo vio el segundo tramo, con etapas, se quedaba con la noche (6:22 a 8:30)', () => {
      const OTRA: Fuente = { id: 'com.ejemplo.rings', nombre: 'Rings', tipo: 'otra' };
      const [n] = armarNoches([r('dormido', '00:16', '06:22'), r('dormido', '06:30', '08:30'), r('nucleo', '06:22', '08:30', OTRA.id)], [RINGS, OTRA]);
      // Antes: { fuente: OTRA, dormirse: 742, despertar: 870, dormido: 128 }. La de las etapas no tiene la noche entera.
      expect([n.fuente.id, ver(n)]).toEqual([RINGS.id, UNA_NOCHE]);
    });

    it('el segundo tramo escrito por otra fuente se pega a la noche, sin contar doble', () => {
      const OTRA: Fuente = { id: 'Da Rings', nombre: 'Da Rings', tipo: 'otra' };
      // Antes: la noche hasta las 6:22 y el segundo tramo como siesta.
      const [n] = armarNoches([r('dormido', '00:16', '06:22'), r('dormido', '06:30', '08:30', OTRA.id)], [RINGS, OTRA]);
      expect([n.fuente.id, ver(n)]).toEqual([RINGS.id, UNA_NOCHE]);
    });

    it('hasta una hora despierto es la misma noche; con más, el segundo tramo es otra cosa: una siesta', () => {
      expect(ver(armarNoches([r('dormido', '00:16', '06:22'), r('dormido', '07:22', '08:30')], [RINGS])[0])).toMatchObject({ dormirse: 376, despertar: 870, despierto: 60, despertares: 1, siestas: 0 });
      expect(ver(armarNoches([r('dormido', '00:16', '06:22'), r('dormido', '07:32', '08:30')], [RINGS])[0])).toEqual({ ...UNA_NOCHE, despertar: 742, dormido: 366, despierto: 0, despertares: 0, siestas: 58 });
    });
  });

  it('de viaje, la noche es del día en que te despertás en esa zona', () => {
    const [n] = armarNoches([m('nucleo', '2026-10-20 23:00', '2026-10-21 07:00', RELOJ.id, 60)], [RELOJ]);
    expect(n.clave).toBe('2026-10-21');
    expect(n.dormirse).toBe(300);
  });

  it('con un cambio de hora en la noche, la hora de despertarte es la del reloj de esa mañana', () => {
    // Nueva York, 1 de noviembre de 2026: a las 2 vuelve a ser la 1. De 23:00 a 7:00 son 9 horas.
    const atrasa = armarNoches([m('nucleo', '2026-10-31 23:00', '2026-11-01 02:00', RELOJ.id, -240), m('rem', '2026-11-01 01:00', '2026-11-01 07:00', RELOJ.id, -300)], [RELOJ]);
    expect(atrasa.map((n) => [n.clave, n.dormido, n.dormirse, n.despertar])).toEqual([['2026-11-01', 540, 300, 780]]);
    // El hipnograma va por el tiempo que pasó: termina una hora después.
    expect(Math.max(...atrasa[0].tramos.map((t) => t.hasta))).toBe(840);
    // 8 de marzo: a las 2 son las 3. De 23:00 a 7:00 son 7 horas.
    const adelanta = armarNoches([m('nucleo', '2026-03-07 23:00', '2026-03-08 02:00', RELOJ.id, -300), m('rem', '2026-03-08 03:00', '2026-03-08 07:00', RELOJ.id, -240)], [RELOJ]);
    expect(adelanta.map((n) => [n.clave, n.dormido, n.dormirse, n.despertar])).toEqual([['2026-03-08', 420, 300, 780]]);
  });
});

/** Noches de mentira para las dos semanas: horario fijo con un corrimiento por noche. */
function semanas(dias: number, corrimientos: number[] = [], dormido = 450): (Noche | null)[] {
  const base: Omit<Noche, 'clave' | 'dormirse' | 'despertar' | 'dormido'> = {
    fuente: RELOJ, conEtapas: true, enCama: null, despierto: 10, despertares: 1, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: 0 },
    siestas: 0, tramos: [], intervalos: [], confianza: { duracion: 'alta', horario: 'alta', despertares: 'media', etapas: 'baja', enCama: null },
  };
  return Array.from({ length: dias }, (_, i) => {
    const c = corrimientos[i] ?? 0;
    const clave = new Date(Date.UTC(2026, 9, 8 + i)).toISOString().slice(0, 10);
    return { ...base, clave, dormirse: 340 + c, despertar: 790 + c, dormido };
  });
}

describe('las dos semanas', () => {
  it('las últimas noches, con un hueco donde no hay datos', () => {
    const noches = semanas(14).filter((n) => n!.clave !== '2026-10-15') as Noche[];
    const ultimas = ultimasNoches(noches, '2026-10-21', 14);
    expect(ultimas).toHaveLength(14);
    expect(ultimas[7]).toBeNull();
    expect(ultimas[13]!.clave).toBe('2026-10-21');
  });

  it('la necesidad: 8 horas, 7 y media desde los 65, o la que elijas entre 7 y 9', () => {
    expect(necesidad(31)).toBe(480);
    expect(necesidad(70)).toBe(450);
    expect(necesidad(31, 600)).toBe(540);
    expect(necesidad(31, 420)).toBe(420);
  });

  it('antes de los 18, 9 horas de fábrica, y lo que elijas entre 8 y 10 (AASM 2016)', () => {
    expect([necesidad(16), necesidad(17)]).toEqual([540, 540]);
    expect([necesidad(17, 420), necesidad(17, 600), necesidad(17, 660)]).toEqual([480, 600, 600]);
    expect(necesidad(18)).toBe(480);
    // Lo que se puede elegir en «Necesito dormir», de media hora en media hora.
    expect(necesidadesPara(16)).toEqual([480, 510, 540, 570, 600]);
    expect(necesidadesPara(31)).toEqual([420, 450, 480, 510, 540]);
    expect(necesidadesPara(70)).toEqual([420, 450, 480, 510, 540]);
  });

  it('el horario y qué tan regular es; el fin de semana más tarde', () => {
    const quieto = horario(semanas(14))!;
    expect(quieto).toMatchObject({ dormirse: 340, despertar: 790, regularidad: 'muyRegular', finDeSemana: 0 });
    // Del 8 al 21 de octubre: los sábados 10 y 17 y los domingos 11 y 18, 70 minutos más tarde.
    const corrido = semanas(14, [0, 0, 70, 70, 0, 0, 0, 0, 0, 70, 70, 0, 0, 0]);
    expect(Math.round(horario(corrido)!.finDeSemana!)).toBe(70);
    const loco = horario(semanas(14, [0, 180, -150, 120, 0, -90, 170, 0, 150, -120, 0, 100, -130, 0]))!;
    expect(loco.regularidad).toBe('muyIrregular');
    // Con menos de 8 noches no se dice nada.
    expect(horario(semanas(7))).toBeNull();
    expect(quieto.aprox).toBe(false);
  });

  it('con noches estimadas sin reloj es aproximada: el error de cada una se resta antes de decir que es irregular', () => {
    /** Noches de Moss estimadas, con un rango de ±45 minutos (σ de unos 35). */
    const estimadas = (corrimientos: number[]) => semanas(14, corrimientos).map((n) => ({
      ...n!, fuente: { id: 'moss', nombre: 'Moss', tipo: 'moss' as const }, confianza: { ...n!.confianza, duracion: 'media' as const, horario: 'media' as const },
      moss: { origen: 'estimada' as const, confianza: 'media' as const, rango: { dormirse: [n!.dormirse - 45, n!.dormirse + 45] as [number, number], despertar: [n!.despertar - 45, n!.despertar + 45] as [number, number] } },
    }));
    const alternados = (x: number) => Array.from({ length: 14 }, (_, i) => (i % 2 ? x : -x));
    // A la misma hora con ±35 de ruido: no sale irregular.
    expect(horario(estimadas(alternados(35)))).toMatchObject({ regularidad: 'regular', aprox: true });
    // ±65: con un reloj sería irregular; con el ruido de la estimación, regular (y aproximada).
    expect(horario(semanas(14, alternados(65)))!.regularidad).toBe('irregular');
    expect(horario(estimadas(alternados(65)))).toMatchObject({ regularidad: 'regular', aprox: true });
    // Aun restando el ruido pasa de hora y media: muy irregular.
    expect(horario(estimadas(alternados(100)))!.regularidad).toBe('muyIrregular');
    // Con menos de la mitad de Moss, como siempre.
    const pocas = [...semanas(14, alternados(65)).slice(0, 8), ...estimadas(alternados(65)).slice(8)];
    expect(horario(pocas)).toMatchObject({ regularidad: 'irregular', aprox: false });
  });

  /** La suma de los 14 pesos, e^(−i/7): 6,5. */
  const PESOS = Array.from({ length: 14 }, (_, i) => Math.exp(-i / 7));
  const SUMA = PESOS.reduce((s, p) => s + p, 0);
  /** Las dos semanas con lo que se durmió cada noche, de la más vieja a anoche. */
  const durmiendo = (dormidos: number[]) => semanas(14).map((n, i) => ({ ...n!, dormido: dormidos[i] }));

  it('la deuda pesa las noches como e^(−i/7), los pesos que publica Rise: dormir 7 h necesitando 8 da 6 h 30, y 6 h, 13 h', () => {
    // Anoche 1, la anterior 0,87… y hace 13 noches, 0,16: suman 6,5.
    expect(PESOS.map((p) => Math.round(p * 100) / 100)).toEqual([1, 0.87, 0.75, 0.65, 0.56, 0.49, 0.42, 0.37, 0.32, 0.28, 0.24, 0.21, 0.18, 0.16]);
    expect(SUMA).toBeCloseTo(6.5, 1);
    const siete = deudaDeSueno(semanas(14, [], 420), 480)!;
    expect(siete.minutos).toBeCloseTo(60 * SUMA, 5);
    expect(redondearDeuda(siete.minutos)).toBe(6 * 60 + 30);
    expect(siete).toMatchObject({ noches: 14, de: 14 });
    expect(redondearDeuda(deudaDeSueno(semanas(14, [], 360), 480)!.minutos)).toBe(13 * 60);
    expect(redondearDeuda(deudaDeSueno(semanas(14, [], 450), 480)!.minutos)).toBe(3 * 60);
    // Nunca menos de 0, y sin 5 noches no hay.
    expect(deudaDeSueno(semanas(14, [], 900), 480)!.minutos).toBe(0);
    expect(deudaDeSueno([null, null, null, ...semanas(4, [], 420)], 480)).toBeNull();
  });

  it('una noche mala pesa menos cada día: 4 h anoche suman 4 h; hace una semana, 1 h 28; hace 13 noches, 37 min', () => {
    const con = (hace: number) => deudaDeSueno(durmiendo(Array.from({ length: 14 }, (_, i) => (i === 13 - hace ? 240 : 480))), 480)!.minutos;
    // Lo que falta en una noche suma entero (sin tope desde el 28/11): de 4 h a 8 faltan 4.
    expect(con(0)).toBeCloseTo(240, 5);
    expect(con(7)).toBeCloseTo(240 * Math.exp(-1), 5);
    expect(Math.round(con(7))).toBe(88);
    expect(Math.round(con(13))).toBe(37);
  });

  it('lo que sobra paga hasta una hora por noche: con una falta de 1 h, cuatro noches con una hora de más la borran', () => {
    // Diez noches de 7 h y cuatro de 9 h o de 11 h: lo mismo, la deuda en cero (Kitamura 2016: una falta así se recuperó en unas 4 noches).
    const cuatroLargas = (largas: number) => deudaDeSueno(durmiendo(Array.from({ length: 14 }, (_, i) => (i >= 10 ? largas : 420))), 480)!;
    expect(redondearDeuda(cuatroLargas(540).minutos)).toBe(0);
    expect(cuatroLargas(660).minutos).toBeCloseTo(cuatroLargas(540).minutos, 5);
    // Durmiendo justo lo que necesitas, baja a la mitad en unas cuatro noches.
    const justas = (cuantas: number) => deudaDeSueno(durmiendo(Array.from({ length: 14 }, (_, i) => (i >= 14 - cuantas ? 480 : 420))), 480)!.minutos;
    expect(justas(4) / justas(0)).toBeCloseTo(0.5, 1);
    expect(faltaDeLaNoche({ ...semanas(1)[0]!, dormido: 700 }, 480)).toBe(-TOPES_DE_UNA_NOCHE.sobra);
  });

  it('lo que falta suma entero, estimada, confirmada o medida, y la del teléfono cuenta aunque sea poco segura (28/11)', () => {
    const deMoss = (origen: 'estimada' | 'confirmada', duracion: 'media' | 'baja' = 'media'): Noche => ({
      ...semanas(1)[0]!, dormido: 200, fuente: { id: 'moss', nombre: 'Moss', tipo: 'moss' }, confianza: { duracion, horario: 'media', despertares: 'baja', etapas: null, enCama: null },
      moss: { origen, confianza: duracion, rango: null },
    });
    expect([faltaDeLaNoche(deMoss('estimada'), 480), faltaDeLaNoche(deMoss('confirmada'), 480), faltaDeLaNoche({ ...semanas(1)[0]!, dormido: 200 }, 480)]).toEqual([280, 280, 280]);
    // La del sábado 28: 4 h 30 estimada y poco segura, necesitando 8. Entra entera.
    const sabado = { ...deMoss('estimada', 'baja'), dormido: 270 };
    expect([cuentaParaLaDeuda(sabado), nochesDeLaDeuda([sabado], 480)[0].entra]).toEqual([true, 210]);
    // La poco segura de un aparato sigue sin contar.
    expect(cuentaParaLaDeuda({ ...semanas(1)[0]!, confianza: { ...semanas(1)[0]!.confianza, duracion: 'baja' } })).toBe(false);
    // Las siestas cuentan.
    expect(faltaDeLaNoche({ ...semanas(1)[0]!, dormido: 400, siestas: 50 }, 480)).toBe(30);
    // Dos semanas así: 4 h 40 por noche, estimadas o confirmadas.
    const dosSemanas = (origen: 'estimada' | 'confirmada') => deudaDeSueno(Array.from({ length: 14 }, () => deMoss(origen)), 480)!.minutos;
    expect(dosSemanas('estimada')).toBeCloseTo(280 * PESOS.reduce((s, p) => s + p, 0), 5);
    expect(dosSemanas('confirmada')).toBeCloseTo(dosSemanas('estimada'), 5);
  });

  it('las noches sin datos no cuentan como si hubieras dormido lo que necesitas: usar menos el reloj no baja la deuda', () => {
    // 7 h contra 8 todas las noches: con las 14 medidas o con la mitad (las impares sin datos), lo mismo.
    const todas = deudaDeSueno(semanas(14, [], 420), 480)!;
    const laMitad = deudaDeSueno(semanas(14, [], 420).map((n, i) => (i % 2 ? null : n)), 480)!;
    expect(laMitad.noches).toBe(7);
    expect(laMitad.minutos).toBeCloseTo(todas.minutos, 5);
    // Con lo que faltó y lo que dormiste por noche, para decirlo así: «Duermes unas 7 h · Necesitas 8 h».
    expect(laMitad.porNoche).toBeCloseTo(60, 5);
    expect(laMitad.duermes).toBeCloseTo(420, 5);
    // Las últimas cinco solas tampoco la bajan, ni las de confianza baja cuentan.
    expect(deudaDeSueno([...Array.from({ length: 9 }, () => null), ...semanas(5, [], 420)], 480)!.minutos).toBeCloseTo(todas.minutos, 5);
    const conBajas = semanas(14, [], 420).map((n, i) => (i % 2 ? { ...n!, dormido: 100, confianza: { ...n!.confianza, duracion: 'baja' as const } } : n));
    const sinLasBajas = deudaDeSueno(conBajas, 480)!;
    expect(sinLasBajas.noches).toBe(7);
    expect(sinLasBajas.duermes).toBeCloseTo(420, 5);
  });

  it('la deuda noche por noche: las mismas noches, topes y pesos, y de ahí sale la misma deuda', () => {
    // De la más vieja a anoche: una sin datos, una poco segura, una estimada muy corta, una larga con siesta y las demás de 7 h.
    const estimada: Noche = { ...semanas(1)[0]!, dormido: 200, fuente: { id: 'moss', nombre: 'Moss', tipo: 'moss' }, confianza: { duracion: 'media', horario: 'media', despertares: 'baja', etapas: null, enCama: null }, moss: { origen: 'estimada', confianza: 'media', rango: null } };
    const lista = semanas(14, [], 420).map((n, i) => (i === 2 ? null : i === 5 ? { ...n!, dormido: 100, confianza: { ...n!.confianza, duracion: 'baja' as const } } : i === 9 ? estimada : i === 12 ? { ...n!, dormido: 560, siestas: 40 } : n));
    const filas = nochesDeLaDeuda(lista, 480);
    expect(filas).toHaveLength(14);
    // Los pesos: anoche 1 y hace 13 noches, 0,16.
    expect(filas.map((f) => Math.round(f.peso * 100) / 100)).toEqual([...PESOS].reverse().map((p) => Math.round(p * 100) / 100));
    // Sin datos, nada; la poco segura se muestra, pero no entra.
    expect(filas[2]).toMatchObject({ noche: null, dormido: null, falta: null, entra: null });
    expect(filas[5]).toMatchObject({ dormido: 100, falta: 380, entra: null });
    // La estimada: faltaron 4 h 40 y entran enteras; la larga: sobraron 2 h (con la siesta) y descuenta 1 h.
    expect(filas[9]).toMatchObject({ dormido: 200, falta: 280, entra: 280 });
    expect(filas[12]).toMatchObject({ dormido: 600, falta: -120, entra: -60 });
    expect(filas[13]).toMatchObject({ dormido: 420, falta: 60, entra: 60 });
    // El promedio con pesos de lo que entra, por la suma de todos los pesos, es la deuda.
    const cuentan = filas.filter((f) => f.entra !== null);
    const deuda = (cuentan.reduce((s, f) => s + f.peso * f.entra!, 0) / cuentan.reduce((s, f) => s + f.peso, 0)) * filas.reduce((s, f) => s + f.peso, 0);
    expect(deudaDeSueno(lista, 480)).toMatchObject({ noches: 12, de: 14 });
    expect(deuda).toBeCloseTo(deudaDeSueno(lista, 480)!.minutos, 5);
  });

  it('la deuda se dice a la media hora: «4 h 32 min» es precisión falsa', () => {
    expect([redondearDeuda(272), redondearDeuda(284), redondearDeuda(14), redondearDeuda(15), redondearDeuda(0)]).toEqual([270, 270, 0, 30, 0]);
  });

  it('la deuda en una palabra: sin deuda en 0, baja con menos de 5 horas, media de 5 a 10 y alta desde 10', () => {
    // Por el número como se dice, a la media hora.
    expect([0, 14, 15, 284, 285, 300, 584, 585, 600, 990].map((minutos) => juicioDeLaDeuda({ minutos })))
      .toEqual(['sinDeuda', 'sinDeuda', 'baja', 'baja', 'media', 'media', 'media', 'alta', 'alta', 'alta']);
    // Dos semanas de 7 h necesitando 8 (6 h 30), media; de 7 h 30 (3 h), baja; de 6 h (13 h), alta; de 8 h, sin deuda.
    expect([420, 450, 360, 480].map((dormido) => juicioDeLaDeuda(deudaDeSueno(semanas(14, [], dormido), 480)!))).toEqual(['media', 'baja', 'alta', 'sinDeuda']);
  });

  describe('la necesidad que Moss propone', () => {
    /** Cuatro semanas hasta el 21 de octubre, con lo que se durmió cada noche. */
    const cuatroSemanas = (dormidos: number[]): Noche[] => dormidos.map((dormido, i) => ({ ...semanas(1)[0]!, clave: new Date(Date.UTC(2026, 9, 21 - (dormidos.length - 1 - i))).toISOString().slice(0, 10), dormido }));
    const HOY = '2026-10-21';

    it('el percentil 75 de las noches medidas de las últimas 4 semanas, a la media hora, si difiere media hora o más', () => {
      // La mitad de las noches de 6 h 40 y la mitad de 7 h 30: las largas rondan 7 h 30.
      const noches = cuatroSemanas(Array.from({ length: 28 }, (_, i) => (i % 2 ? 450 : 400)));
      expect(necesidadPropuesta(noches, HOY, 31, 480)).toBe(450);
      // Con esa ya elegida, o a menos de media hora, nada.
      expect(necesidadPropuesta(noches, HOY, 31, 450)).toBeNull();
      // Las siestas cuentan, como en la deuda.
      expect(necesidadPropuesta(noches.map((n) => ({ ...n, siestas: 30 })), HOY, 31, 450)).toBe(480);
    });

    it('con menos de 14 noches medidas no propone: ni las de confianza baja ni las de hace más de 4 semanas cuentan', () => {
      expect(necesidadPropuesta(cuatroSemanas(Array.from({ length: 13 }, () => 420)), HOY, 31, 480)).toBeNull();
      expect(necesidadPropuesta(cuatroSemanas(Array.from({ length: 14 }, () => 420)), HOY, 31, 480)).toBe(420);
      const bajas = cuatroSemanas(Array.from({ length: 20 }, () => 420)).map((n, i) => (i < 7 ? { ...n, confianza: { ...n.confianza, duracion: 'baja' as const } } : n));
      expect(necesidadPropuesta(bajas, HOY, 31, 480)).toBeNull();
      // 40 noches: las 12 más viejas, de 9 h, ya no se miran.
      expect(necesidadPropuesta(cuatroSemanas(Array.from({ length: 40 }, (_, i) => (i < 12 ? 540 : 420))), HOY, 31, 480)).toBe(420);
    });

    it('solo dentro de lo de tu edad (de 7 a 9 horas, y de 8 a 10 antes de los 18): a quien duerme 6 h no le propone 7', () => {
      const cortas = cuatroSemanas(Array.from({ length: 20 }, () => 370));
      expect(necesidadPropuesta(cortas, HOY, 31, 480)).toBeNull();
      const largas = cuatroSemanas(Array.from({ length: 20 }, () => 590));
      expect(necesidadPropuesta(largas, HOY, 31, 480)).toBeNull();
      expect(necesidadPropuesta(largas, HOY, 16, 540)).toBe(600);
      // Los bordes entran: 7 h y 9 h.
      expect(necesidadPropuesta(cuatroSemanas(Array.from({ length: 20 }, () => 545)), HOY, 31, 480)).toBe(540);
    });
  });

  it('con menos de 6 horas por semanas, sugiere un médico; con pocas noches o un par de malas, no', () => {
    expect(pocoSuenoSostenido(semanas(14, [], 330))).toBe(true);
    expect(pocoSuenoSostenido(semanas(14, [], 380))).toBe(false);
    expect(pocoSuenoSostenido([null, null, null, null, null, ...semanas(9, [], 300)])).toBe(false);
    const dosMalas = semanas(14, [], 450).map((n, i) => (i < 2 ? { ...n!, dormido: 240 } : n));
    expect(pocoSuenoSostenido(dosMalas)).toBe(false);
  });

  it('antes de los 18, con menos de 7 horas', () => {
    expect([pocoSuenoSostenido(semanas(14, [], 400), 16), pocoSuenoSostenido(semanas(14, [], 400), 31)]).toEqual([true, false]);
    expect(pocoSuenoSostenido(semanas(14, [], 430), 17)).toBe(false);
  });
});

describe('lo despierto de la noche', () => {
  it('sin noches de un reloj o un anillo, nada: solo con el teléfono no se mide, y ya no se resta media hora fija', () => {
    expect(despiertoDeLaNoche([])).toBe(0);
    // Con pocas noches del reloj, todavía nada.
    expect(despiertoDeLaNoche(semanas(6) as Noche[])).toBe(0);
  });

  it('con 7 noches o más, lo tuyo (la mediana de las últimas 14) más lo que el reloj no ve', () => {
    // Las noches de mentira tienen 10 minutos despierto: 10 + 15.
    expect(despiertoDeLaNoche(semanas(14) as Noche[])).toBe(25);
    const viejas = (semanas(7) as Noche[]).map((n) => ({ ...n, clave: n.clave.replace('2026-10', '2026-09'), despierto: 60 }));
    expect(despiertoDeLaNoche([...viejas, ...(semanas(14) as Noche[])])).toBe(25);
    // Lo de Moss y lo anotado a mano no cuentan.
    const deMoss = (semanas(14) as Noche[]).map((n) => ({ ...n, despierto: 0, moss: { origen: 'confirmada' as const, confianza: 'media' as const, rango: null } }));
    expect(despiertoDeLaNoche(deMoss)).toBe(0);
    expect(despiertoDeLaNoche((semanas(14) as Noche[]).map((n) => ({ ...n, aMano: true as const })))).toBe(0);
    // Un aparato que nunca escribe un rato despierto no lo ve: nada.
    expect(despiertoDeLaNoche((semanas(14) as Noche[]).map((n) => ({ ...n, despierto: 0 })))).toBe(0);
  });
});

describe('la calidad', () => {
  const anteriores = semanas(14);
  const noche = { ...anteriores[13]!, clave: '2026-10-22' };

  it('de 0 a 100 en tres partes: la duración, el horario y la continuidad', () => {
    const c = calidadDeNoche({ ...noche, dormido: 480, despierto: 10, despertares: 1 }, 480, anteriores)!;
    expect(c).toMatchObject({ puntos: 100, partes: { duracion: 50, horario: 30, continuidad: 20 }, parcial: false, palabra: 'excelente' });
    // 6 horas de 8: la mitad de la duración; corrida una hora: la mitad del horario; 35 minutos despierto y 3 despertares.
    const mala = calidadDeNoche({ ...noche, dormido: 360, dormirse: 400, despertar: 850, despierto: 35, despertares: 3 }, 480, anteriores)!;
    expect(mala.partes).toEqual({ duracion: 25, horario: 15, continuidad: 10 });
    expect(mala.puntos).toBe(50);
  });

  it('sin 5 noches anteriores, el horario no entra y el total se reescala', () => {
    const c = calidadDeNoche({ ...noche, dormido: 480 }, 480, anteriores.slice(0, 3))!;
    expect(c).toMatchObject({ parcial: true, partes: { horario: null }, puntos: 100 });
  });

  it('sin reloj (las noches de Moss), la continuidad no entra: el teléfono no sabe cuánto estuviste despierto', () => {
    const deMoss: Noche = { ...noche, dormido: 480, despierto: 0, despertares: 0, moss: { origen: 'confirmada', confianza: 'media', rango: null } };
    const c = calidadDeNoche(deMoss, 480, anteriores)!;
    expect(c).toMatchObject({ partes: { duracion: 50, horario: 30, continuidad: null }, parcial: true, puntos: 100 });
  });

  it('del teléfono solo no hay calidad, y una noche cortada se marca para preguntar', () => {
    expect(calidadDeNoche({ ...noche, confianza: { ...noche.confianza, duracion: 'baja' } }, 480, anteriores)).toBeNull();
    expect(pareceIncompleta({ ...noche, dormido: 150, despertar: 600 }, anteriores)).toBe(true);
    expect(pareceIncompleta(noche, anteriores)).toBe(false);
  });
});

describe('lo que mide el reloj de noche', () => {
  const intervalos: [number, number][] = [[hora('2026-10-20 23:40'), hora('2026-10-21 07:10')]];
  const cada = (minutos: number, valor: (i: number) => number) => Array.from({ length: Math.floor(450 / minutos) }, (_, i) => ({ en: intervalos[0][0] + i * minutos * 60_000, valor: valor(i) }));

  it('el promedio mientras dormías, contra la mediana de tus noches', () => {
    const v = vitalDeNoche('frecuencia', cada(10, () => 51), { intervalos }, [55, 56, 54, 55, 57, 56, 55])!;
    expect(v).toMatchObject({ valor: 51, usual: 55, comparado: 'menos' });
    expect(vitalDeNoche('frecuencia', cada(10, () => 54), { intervalos }, [55, 56, 54, 55, 57, 56, 55])!.comparado).toBe('usual');
  });

  it('sin lecturas suficientes no se muestra, y sin 7 noches no se compara', () => {
    expect(vitalDeNoche('frecuencia', [{ en: intervalos[0][0] + 60_000, valor: 52 }], { intervalos }, [])).toBeNull();
    // El Apple Watch mide la variabilidad cada ~4 horas: una lectura alcanza, y se dice cuántas son.
    expect(vitalDeNoche('variabilidad', [{ en: intervalos[0][0] + 60_000, valor: 48 }], { intervalos }, [])).toMatchObject({ valor: 48, lecturas: 1 });
    expect(vitalDeNoche('variabilidad', [], { intervalos }, [])).toBeNull();
    expect(vitalDeNoche('variabilidad', cada(120, () => 48), { intervalos }, [40, 50])).toMatchObject({ valor: 48, comparado: null });
    // Lo medido fuera del sueño no cuenta.
    expect(vitalDeNoche('respiracion', [{ en: hora('2026-10-21 12:00'), valor: 18 }, { en: hora('2026-10-21 13:00'), valor: 18 }], { intervalos }, [])).toBeNull();
  });
});

describe('las noches que no cuentan', () => {
  it('tampoco cuentan para tu energía: con dos semanas de Sleep Cycle (confianza baja), es como sin noches', () => {
    // Solo la energía: la hora de los avisos y la meta del día no importan acá.
    jest.doMock('@/recordatorios/programar', () => ({ suenoDelDia: () => null, horasDeComida: () => () => 12 * 60 }));
    jest.doMock('@/secciones/comida/datos', () => ({ metaDelDia: () => null }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { energiaDeHoy } = require('@/secciones/sueno/datosDeEnergia') as typeof import('@/secciones/sueno/datosDeEnergia');
    const hoy = '2026-10-21';
    const e = { hoy, perfil: { sexo: 'm', objetivo: 'mantener', alturaCm: 175 }, pesos: [], registros: new Map(), salud: null, entreno: null } as unknown as Parameters<typeof energiaDeHoy>[0];
    // Cinco horas cada noche: de la 1 a las 6.
    const cortas = armarNoches(Array.from({ length: 14 }, (_, i) => sumarDias(hoy, -i)).map((dia) => m('dormido', `${dia} 01:00`, `${dia} 06:00`, SLEEP_CYCLE.id)), [SLEEP_CYCLE]);
    expect(cortas.every((n) => n.confianza.duracion === 'baja')).toBe(true);
    const con = (noches: Noche[]) => energiaDeHoy(e, {
      deEjemplo: false, noches, soloEnCama: new Map(), lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() }, fuentes: [SLEEP_CYCLE], necesidad: 480,
    }, new Date(2026, 9, 21, 10));
    expect(con(cortas)).toEqual(con([]));
    expect(con(cortas)?.dormido).toBeNull();
    // Las de Moss poco seguras sí, como en la deuda (28/11): la misma energía y la misma deuda que si fueran más o menos seguras.
    const deMoss = (duracion: 'media' | 'baja') => cortas.map((n): Noche => ({
      ...n, fuente: { id: 'moss', nombre: 'Moss', tipo: 'moss' }, confianza: { ...n.confianza, duracion, horario: duracion },
      moss: { origen: 'estimada', confianza: duracion, rango: null },
    }));
    expect(con(deMoss('baja'))).toEqual(con(deMoss('media')));
    expect(con(deMoss('baja'))).toMatchObject({ dormido: 300, deuda: redondearDeuda(deudaDeSueno(ultimasNoches(deMoss('baja'), hoy, 14), 480)!.minutos) });
  });
});
