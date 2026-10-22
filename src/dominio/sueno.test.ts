import { describe, expect, it } from '@jest/globals';

import {
  armarNoches, calidadDeNoche, deudaDeSueno, horario, necesidad, pareceIncompleta, soloEnCama, ultimasNoches, vitalDeNoche,
  type Etapa, type Fuente, type Muestra, type Noche,
} from './sueno';

const RELOJ: Fuente = { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' };
const ANILLO: Fuente = { id: 'anillo', nombre: 'Oura', tipo: 'otra' };
const IPHONE: Fuente = { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' };
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
    ], [RELOJ]);
    const domingo = noches.find((n) => n.clave === '2026-10-18')!;
    expect(domingo.siestas).toBe(35);
    expect(domingo.dormido).toBe(435);
    // La de las 19 ya es del lunes: sola, es la única de ese día.
    expect(noches.find((n) => n.clave === '2026-10-19')!.dormido).toBe(30);
  });

  it('el sueño partido (despierto más de una hora en el medio) es una sola noche', () => {
    const [n] = armarNoches([m('nucleo', '2026-10-20 23:00', '2026-10-21 02:00'), m('nucleo', '2026-10-21 03:30', '2026-10-21 07:00')], [RELOJ]);
    expect(n.dormido).toBe(390);
    expect(n.despierto).toBe(90);
  });

  it('de viaje, la noche es del día en que te despertás en esa zona', () => {
    const [n] = armarNoches([m('nucleo', '2026-10-20 23:00', '2026-10-21 07:00', RELOJ.id, 60)], [RELOJ]);
    expect(n.clave).toBe('2026-10-21');
    expect(n.dormirse).toBe(300);
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
  });

  it('la deuda pesa más lo de anoche, lo que sobra paga hasta 2 horas, y sin 5 noches no hay', () => {
    // 7 h por noche contra 8: la última pesa 1, la primera 1/14.
    const deuda = deudaDeSueno(semanas(14, [], 420), 480)!;
    expect(deuda.minutos).toBeCloseTo(60 * (14 + 1) / 2, 5);
    expect(deuda.noches).toBe(14);
    expect(deudaDeSueno(semanas(14, [], 900), 480)!.minutos).toBe(0);
    expect(deudaDeSueno([null, null, null, ...semanas(4, [], 420)], 480)).toBeNull();
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
    expect(vitalDeNoche('variabilidad', [{ en: intervalos[0][0] + 60_000, valor: 48 }], { intervalos }, [])).toBeNull();
    expect(vitalDeNoche('variabilidad', cada(120, () => 48), { intervalos }, [40, 50])).toMatchObject({ valor: 48, comparado: null });
    // Lo medido fuera del sueño no cuenta.
    expect(vitalDeNoche('respiracion', [{ en: hora('2026-10-21 12:00'), valor: 18 }, { en: hora('2026-10-21 13:00'), valor: 18 }], { intervalos }, [])).toBeNull();
  });
});
