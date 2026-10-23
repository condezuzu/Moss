import { describe, expect, it } from '@jest/globals';

import {
  actividadDeLosPasos, actividadDelMovimiento, aprenderAjuste, conNochesDeMoss, estimarNoche, habitualDe, instanteDe, latencia, nocheDeMoss, quePreguntar,
  type Actividad, type Habitual,
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

  it('un Atajo: la alarma dice cuándo te despertaste', () => {
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 06:50'), que: 'despertar' }] })!;
    expect(e.despertar).toBe(min('2026-10-22 06:50'));
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
