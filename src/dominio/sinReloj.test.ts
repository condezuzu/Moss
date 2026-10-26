import { describe, expect, it } from '@jest/globals';

import {
  actividadDeLosPasos, actividadDelMovimiento, aprenderAjuste, conNochesDeMoss, deLasSenales, despertarAnclado, estimarNoche, habitualDe, instanteDe, latencia, nocheDeMoss, quePreguntar,
  type Actividad, type Habitual, type Senal,
} from './sinReloj';
import { armarNoches, type Fuente, type NochePropia } from './sueno';

const UY = -180;
/** Un instante en hora de Uruguay: «2026-10-21 07:13». */
const hora = (texto: string) => Date.parse(texto.replace(' ', 'T') + ':00.000Z') - UY * 60_000;
const uso = (desde: string, hasta: string, tipo: Actividad['tipo'] = 'pasos'): Actividad => ({ desde: hora(desde), hasta: hora(hasta), tipo });
/** Una hora de la noche del 21 al 22 en minutos desde las 18 del 21: las 0:00 son 360. */
const min = (texto: string) => (hora(texto) - hora('2026-10-21 18:00')) / 60_000;
/** Te dormís a las 0:00 y te despertás a las 7:20, con 10 noches de historia. */
const SIEMPRE: Habitual = { dormirse: 360, despertar: 800, noches: 10 };

/** Un día con el teléfono: la tarde, la noche hasta `ultima` (las 21:20 con Moss) y la mañana desde `primera`. */
function dia(ultima: string, primera: string, extra: Actividad[] = []): Actividad[] {
  const fin = hora(`2026-10-21 ${ultima}`), principio = hora(`2026-10-22 ${primera}`);
  return [
    uso('2026-10-21 12:30', '2026-10-21 13:10'),
    uso('2026-10-21 18:40', '2026-10-21 19:20'),
    ...(fin > hora('2026-10-21 21:20') ? [uso('2026-10-21 21:00', '2026-10-21 21:20', 'moss')] : []),
    { desde: fin - 5 * 60_000, hasta: fin, tipo: 'pasos' },
    { desde: principio, hasta: principio + 5 * 60_000, tipo: 'pasos' },
    uso('2026-10-22 08:30', '2026-10-22 09:10'),
    ...extra,
  ];
}
const estimar = (actividad: Actividad[], habitual: Habitual | null = SIEMPRE, extra: Partial<Parameters<typeof estimarNoche>[0]> = {}) =>
  estimarNoche({ clave: '2026-10-22', zona: UY, actividad, habitual, ...extra });

describe('la noche sin reloj', () => {
  it('te dormiste 31 minutos después de la última actividad y te despertaste 18 antes de la primera', () => {
    const e = estimar(dia('23:30', '07:30'))!;
    expect(e.dormirse).toBe(min('2026-10-22 00:01'));
    expect(e.despertar).toBe(min('2026-10-22 07:12'));
    expect(e).toMatchObject({ confianza: 'alta', interrupciones: 0, motivos: [] });
    expect(e.rango.dormirse).toEqual([e.dormirse - 20, e.dormirse + 20]);
  });

  it('usar el teléfono un rato a la madrugada no corta la noche: es una interrupción, y baja la confianza', () => {
    const una = estimar(dia('23:30', '07:30', [uso('2026-10-22 03:00', '2026-10-22 03:06', 'moss')]))!;
    expect(una.despertar).toBe(min('2026-10-22 07:12'));
    expect(una).toMatchObject({ interrupciones: 1, motivos: ['usoDeNoche'] });
    const dos = estimar(dia('23:30', '07:30', [uso('2026-10-22 02:00', '2026-10-22 02:05'), uso('2026-10-22 04:30', '2026-10-22 04:40')]))!;
    expect(dos).toMatchObject({ interrupciones: 2, confianza: 'media' });
  });

  it('dejar el teléfono mucho antes de lo de siempre alarga lo que tardás en dormirte, y baja la confianza', () => {
    expect([latencia(-30), latencia(30), latencia(75), latencia(105), latencia(150), latencia(240), latencia(null)]).toEqual([18, 31, 76, 114.5, 153, 202, 31]);
    // Lo dejaste a las 21:00 y siempre te dormís a las 0:00: tres horas antes.
    const e = estimar(dia('21:00', '07:30'))!;
    expect(e.dormirse).toBe(min('2026-10-21 21:00') + 202);
    expect(e.confianza).toBe('media');
    expect(e.motivos).toContain('dejasteAntes');
  });

  it('con dos huecos posibles (el teléfono quedó en la mesa toda la tarde) se queda con el de siempre', () => {
    const actividad = [uso('2026-10-21 18:20', '2026-10-21 18:30'), uso('2026-10-21 23:40', '2026-10-21 23:50'), uso('2026-10-22 07:40', '2026-10-22 08:00')];
    const e = estimar(actividad)!;
    expect(e.dormirse).toBe(min('2026-10-22 00:21'));
  });

  it('sin actividad a la mañana todavía no se sabe cuándo te despertaste; sin historia, confianza media', () => {
    expect(estimar([uso('2026-10-21 22:00', '2026-10-21 23:30')])).toBeNull();
    const e = estimar(dia('23:30', '07:30'), null)!;
    expect(e.dormirse).toBe(min('2026-10-22 00:01'));
    expect(e).toMatchObject({ confianza: 'media', motivos: ['sinHistoria'] });
  });

  it('solo con Moss abierta (sin pasos ni movimiento) hay pocos datos', () => {
    const e = estimar([uso('2026-10-21 23:00', '2026-10-21 23:20', 'moss'), uso('2026-10-22 07:30', '2026-10-22 07:35', 'moss')])!;
    expect(e.motivos).toContain('pocosDatos');
    expect(e.confianza).toBe('media');
  });

  it('sin un hueco de 5 horas, de la última actividad antes de las 2 a la primera después de las 4, con confianza baja', () => {
    const cortada = [
      uso('2026-10-21 22:00', '2026-10-21 22:30'), uso('2026-10-22 01:00', '2026-10-22 01:30'),
      uso('2026-10-22 03:30', '2026-10-22 04:00'), uso('2026-10-22 06:30', '2026-10-22 07:00'),
    ];
    const e = estimar(cortada)!;
    expect(e.dormirse).toBe(min('2026-10-22 01:30') + 18);
    expect(e).toMatchObject({ confianza: 'baja', interrupciones: 1 });
    expect(e.motivos).toContain('sinVentana');
  });

  it('un Atajo: la alarma dice cuándo te despertaste, y la confianza sube', () => {
    const sin = estimar(dia('23:30', '07:30'))!;
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 06:50'), que: 'despertar' }] })!;
    expect(e.despertar).toBe(min('2026-10-22 06:50'));
    expect(e.anclada).toEqual({ dormirse: false, despertar: true });
    expect(e.probabilidad).toBeCloseTo(sin.probabilidad + 0.1, 5);
    expect(sin.anclada).toEqual({ dormirse: false, despertar: false });
  });

  it('la alarma parada a la madrugada, si después te volviste a dormir, es una interrupción y no tu hora de despertar', () => {
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 03:00'), que: 'despertar' }] })!;
    expect(e.despertar).toBe(min('2026-10-22 07:12'));
    expect(e).toMatchObject({ interrupciones: 1, anclada: { despertar: false } });
  });

  it('«Me voy a dormir» tarde es lo último del día, no una interrupción', () => {
    // Sin ancla, lo suelto de las 00:40 sería una interrupción y la noche empezaría a las 22:00.
    const suelto = estimar(dia('22:00', '07:30', [uso('2026-10-22 00:40', '2026-10-22 00:41', 'atajo')]))!;
    expect(suelto.dormirse).toBe(min('2026-10-21 22:00') + 153);
    const e = estimar(dia('22:00', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 00:40'), que: 'dormir' }] })!;
    expect(e.dormirse).toBe(min('2026-10-22 00:41') + 18);
    expect(e.anclada).toEqual({ dormirse: true, despertar: false });
  });

  // Lo que avisan los Atajos y el despertador (spec/sueno-sin-esfuerzo.md).
  const senal = (que: Senal['que'], texto: string, segundos = 0): Senal => ({ id: `${que}-${texto}-${segundos}`, que, en: hora(texto) + segundos * 1000 });

  it('la alarma, el despertador y «Me desperté» son anclas de despertar; «Me voy a dormir», de dormir', () => {
    const { anclas, actividad } = deLasSenales([
      senal('alarmaParada', '2026-10-22 06:50'), senal('despertadorParado', '2026-10-22 06:55'), senal('meDesperte', '2026-10-22 07:00'), senal('meVoyADormir', '2026-10-21 23:40'),
    ], UY);
    expect(anclas.map((a) => a.que)).toEqual(['despertar', 'despertar', 'despertar', 'dormir']);
    expect(actividad).toEqual([]);
  });

  it('el cargador de 19 a 4 puede ser lo último del día, salvo que vuelva a conectarse al rato de desconectarlo', () => {
    const { actividad } = deLasSenales([
      senal('cargadorConectado', '2026-10-21 17:30'), senal('cargadorConectado', '2026-10-22 00:40'),
      senal('cargadorDesconectado', '2026-10-22 03:00'), senal('cargadorConectado', '2026-10-22 03:04'),
    ], UY);
    expect(actividad.map((a) => !!a.fin)).toEqual([false, true, false, false]);
    // Conectarlo a las 00:40 dice que estabas despierto: la noche empieza ahí.
    const e = estimar(dia('22:00', '07:30', actividad.slice(1, 2)))!;
    expect(e.dormirse).toBe(min('2026-10-22 00:41') + 18);
    // Desconectarlo y volver a conectarlo a la madrugada es usar el teléfono: una interrupción.
    const noche = estimar(dia('23:30', '07:30', actividad.slice(2)))!;
    expect(noche).toMatchObject({ dormirse: min('2026-10-22 00:01'), interrupciones: 1 });
  });

  it('el enfoque Sueño a la misma hora varias noches es el horario y no cuenta; prendido a mano, sí', () => {
    const horario = [senal('enfoqueEmpezo', '2026-10-19 23:15', 20), senal('enfoqueEmpezo', '2026-10-20 23:15', 5), senal('enfoqueEmpezo', '2026-10-21 23:16')];
    const aMano = senal('enfoqueEmpezo', '2026-10-18 22:47');
    expect(deLasSenales([...horario, aMano], UY).anclas).toEqual([{ en: aMano.en, que: 'dormir' }]);
    // Con dos noches todavía no se sabe: cuentan.
    expect(deLasSenales(horario.slice(0, 2), UY).anclas).toHaveLength(2);
    // Apagado a mano a la mañana, ancla de despertar.
    expect(deLasSenales([senal('enfoqueTermino', '2026-10-22 07:03')], UY).anclas).toEqual([{ en: hora('2026-10-22 07:03'), que: 'despertar' }]);
  });

  it('con la hora de despertar sacada de un ancla, a la mañana se pregunta solo la de dormirte', () => {
    const { anclas } = deLasSenales([senal('alarmaParada', '2026-10-22 06:50', 30)], UY);
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas })!;
    // Lo que se guarda es al minuto, como la noche de Moss.
    expect(despertarAnclado(anclas, '2026-10-22', UY, Math.round(e.despertar))).toBe(true);
    const sin = estimar(dia('23:30', '07:30'))!;
    expect(despertarAnclado(anclas, '2026-10-22', UY, Math.round(sin.despertar))).toBe(false);
  });

  it('lo aprendido corre las horas: dos correcciones de media hora más tarde', () => {
    const estimada = { dormirse: new Date(hora('2026-10-20 00:00')).toISOString(), despertar: new Date(hora('2026-10-20 07:00')).toISOString() };
    const corregida = (fecha: string, mas: number): NochePropia => ({
      fecha, actualizado: '2026-10-21T12:00:00.000Z',
      hora: { dormirse: new Date(hora('2026-10-20 00:00') + mas * 60_000).toISOString(), despertar: estimada.despertar, origen: 'corregida', confianza: 'media', estimada },
    });
    const ajuste = aprenderAjuste([corregida('2026-10-20', 30), corregida('2026-10-21', 30)], '2026-10-22');
    expect(ajuste.correcciones).toBe(2);
    expect(ajuste.despertar).toBe(0);
    // Dos correcciones de ayer y anteayer contra 6 noches de no correr nada: unos 20 minutos.
    expect(ajuste.dormirse).toBeCloseTo(19.6, 0);
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { ajuste })!;
    expect(e.dormirse).toBeCloseTo(min('2026-10-22 00:01') + ajuste.dormirse, 5);
    // Lo crudo queda sin correr, para seguir aprendiendo.
    expect(e.cruda.dormirse).toBe(min('2026-10-22 00:01'));
    // Un «Sí» pesa poco y lo de hace meses, nada.
    expect(aprenderAjuste([corregida('2026-05-01', 60)], '2026-10-22').dormirse).toBe(0);
  });

  it('lo de siempre: la mediana de las dos semanas, aparte el fin de semana', () => {
    const noches = armarNoches([], []);
    expect(habitualDe(noches, '2026-10-22')).toBeNull();
    const n = (clave: string, dormirse: number) => ({ clave, dormirse, despertar: dormirse + 450, confianza: { duracion: 'alta', horario: 'alta', despertares: 'media', etapas: null, enCama: null } as const });
    // Entre semana a las 0:00; los sábados y domingos (17, 18) a las 2:00.
    const lista = ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'].map((c) => n(c, ['2026-10-17', '2026-10-18'].includes(c) ? 480 : 360));
    expect(habitualDe(lista, '2026-10-22')).toMatchObject({ dormirse: 360, noches: 7 });
    // El domingo 25 tiene solo 2 de fin de semana: usa todas.
    expect(habitualDe(lista, '2026-10-25')!.noches).toBe(9);
  });

  it('qué se pregunta a la mañana: la hora solo si no está segura, y una mañana por semana sin proponer', () => {
    const semana = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];
    const sinProponer = semana.filter((c) => quePreguntar(c, 'alta') === 'sinProponer');
    expect(sinProponer).toHaveLength(1);
    const otro = semana.find((c) => !sinProponer.includes(c))!;
    expect(quePreguntar(otro, 'alta')).toBeNull();
    expect(quePreguntar(otro, 'media')).toBe('proponer');
  });

  it('las dos primeras semanas con Moss pregunta cada mañana, aunque esté segura', () => {
    const semana = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];
    const otro = semana.find((c) => quePreguntar(c, 'alta') !== 'sinProponer')!;
    expect(quePreguntar(otro, 'alta', '2026-10-12')).toBe('proponer');
    expect(quePreguntar(otro, 'alta', '2026-10-01')).toBeNull();
    expect(quePreguntar(otro, 'alta', null)).toBeNull();
  });
});

describe('las noches de Moss junto a las de Salud', () => {
  const propia = (fecha: string, origen: 'estimada' | 'confirmada', confianza: 'alta' | 'media' | 'baja' = 'media'): NochePropia => ({
    fecha, actualizado: '2026-10-22T09:00:00.000Z',
    hora: { dormirse: new Date(hora('2026-10-22 00:10')).toISOString(), despertar: new Date(hora('2026-10-22 07:40')).toISOString(), origen, confianza },
  });

  it('una noche de Moss no tiene etapas ni despertares; estimada con confianza baja no cuenta hasta confirmarla', () => {
    const n = nocheDeMoss(propia('2026-10-22', 'estimada', 'media'), UY)!;
    expect(n).toMatchObject({ clave: '2026-10-22', dormido: 450, conEtapas: false, dormirse: 370, despertar: 820, fuente: { id: 'moss', tipo: 'moss' } });
    expect(n.confianza.duracion).toBe('media');
    expect(n.moss).toMatchObject({ origen: 'estimada', confianza: 'media', rango: { dormirse: [335, 405] } });
    expect(nocheDeMoss(propia('2026-10-22', 'estimada', 'baja'), UY)!.confianza.duracion).toBe('baja');
    expect(nocheDeMoss(propia('2026-10-22', 'confirmada'), UY)!.moss!.rango).toBeNull();
    expect(instanteDe('2026-10-22', UY, 370)).toBe(hora('2026-10-22 00:10'));
  });

  it('Salud gana a lo estimado; lo que confirmaste gana a lo anotado a mano en Salud', () => {
    const reloj: Fuente = { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' };
    const muestra = (aMano?: true) => ({ etapa: 'dormido' as const, desde: hora('2026-10-21 23:30'), hasta: hora('2026-10-22 07:00'), fuente: 'reloj', zona: UY, ...(aMano ? { aMano } : {}) });
    const delReloj = armarNoches([muestra()], [reloj]);
    expect(conNochesDeMoss(delReloj, [propia('2026-10-22', 'estimada')], UY)[0].fuente.id).toBe('reloj');
    const aMano = armarNoches([muestra(true)], [reloj]);
    expect(conNochesDeMoss(aMano, [propia('2026-10-22', 'estimada')], UY)[0].fuente.id).toBe('reloj');
    expect(conNochesDeMoss(aMano, [propia('2026-10-22', 'confirmada')], UY)[0].fuente.id).toBe('moss');
    // Donde Salud no tiene nada, la de Moss.
    expect(conNochesDeMoss([], [propia('2026-10-22', 'estimada')], UY).map((n) => n.clave)).toEqual(['2026-10-22']);
  });

  it('cada hora en la zona de su momento: un cambio de hora no corre las noches de antes ni la del cambio', () => {
    // Nueva York: hasta el 1 de noviembre de 2026 a las 6 UTC, −240; después, −300.
    const cambio = Date.parse('2026-11-01T06:00:00.000Z');
    const zonaDe = (ms: number) => (ms < cambio ? -240 : -300);
    const noche = (fecha: string, dormirse: string, despertar: string): NochePropia => ({
      fecha, actualizado: despertar, hora: { dormirse, despertar, origen: 'confirmada', confianza: 'media' },
    });
    // Una de la semana anterior, de 23:00 a 7:00 con la hora de entonces.
    const antes = nocheDeMoss(noche('2026-10-29', '2026-10-29T03:00:00.000Z', '2026-10-29T11:00:00.000Z'), zonaDe)!;
    expect([antes.dormirse, antes.despertar]).toEqual([300, 780]);
    // La del cambio: de 23:00 a 7:00 son 9 horas.
    const delCambio = nocheDeMoss(noche('2026-11-01', '2026-11-01T03:00:00.000Z', '2026-11-01T12:00:00.000Z'), zonaDe)!;
    expect([delCambio.dormido, delCambio.dormirse, delCambio.despertar]).toEqual([540, 300, 780]);
    // Con una sola zona, la de después del cambio, esa noche se corría una hora.
    expect(nocheDeMoss(noche('2026-10-29', '2026-10-29T03:00:00.000Z', '2026-10-29T11:00:00.000Z'), -300)!.despertar).toBe(720);
  });
});

describe('lo que guarda el teléfono', () => {
  it('el movimiento: caminar o el auto con confianza; un cambio corto que no es quieto es agarrar el teléfono', () => {
    const base = { quieto: false, caminando: false, corriendo: false, auto: false, bici: false, confianza: 2 as const };
    const lista = [
      { ...base, en: hora('2026-10-21 23:00'), caminando: true },
      { ...base, en: hora('2026-10-21 23:10'), quieto: true },
      { ...base, en: hora('2026-10-22 03:00') },
      { ...base, en: hora('2026-10-22 03:30'), quieto: true },
      { ...base, en: hora('2026-10-22 07:00'), caminando: true, confianza: 0 as const },
    ];
    expect(actividadDelMovimiento(lista, hora('2026-10-22 08:00'))).toEqual([
      { desde: hora('2026-10-21 23:00'), hasta: hora('2026-10-21 23:10'), tipo: 'movimiento' },
      { desde: hora('2026-10-22 03:00'), hasta: hora('2026-10-22 03:05'), tipo: 'movimiento' },
    ]);
  });

  it('los pasos: una muestra larga cuenta su principio y su final', () => {
    expect(actividadDeLosPasos([{ desde: hora('2026-10-22 07:00'), hasta: hora('2026-10-22 07:05'), pasos: 120 }, { desde: hora('2026-10-22 07:00'), hasta: hora('2026-10-22 07:05'), pasos: 0 }]))
      .toEqual([{ desde: hora('2026-10-22 07:00'), hasta: hora('2026-10-22 07:05'), tipo: 'pasos' }]);
    expect(actividadDeLosPasos([{ desde: hora('2026-10-21 23:00'), hasta: hora('2026-10-22 01:00'), pasos: 200 }])).toEqual([
      { desde: hora('2026-10-21 23:00'), hasta: hora('2026-10-21 23:02'), tipo: 'pasos' },
      { desde: hora('2026-10-22 00:58'), hasta: hora('2026-10-22 01:00'), tipo: 'pasos' },
    ]);
  });
});
