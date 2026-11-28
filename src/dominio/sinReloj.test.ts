import { describe, expect, it } from '@jest/globals';

import {
  aceptadaSinCambios, actividadDeLosPasos, actividadDelMovimiento, aparatoQueFalta, conNochesDeMoss, deLasSenales, despertarAnclado, estadoDelCargador, estimarNoche, habitualDe, instanteDe, MARGEN, MARGENES, margenParaDormirte, moverDespertar, moverDormirse, nocheDeMoss,
  quePreguntar, sinLasRestas,
  type Actividad, type Estimacion, type Habitual, type Senal,
} from './sinReloj';
import { armarNoches, deudaDeSueno, juicioDeLaDeuda, redondearDeuda, type Fuente, type NochePropia } from './sueno';

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
  it('cuenta como sueño todo el rato que el teléfono estuvo quieto, menos el margen para dormirte: 15 minutos de fábrica', () => {
    // Lo dejaste a las 23:30 y lo agarraste a las 7:30: dormido de 23:45 a 7:30. Tu hora de siempre (0:00 y 7:20) no mueve nada.
    const e = estimar(dia('23:30', '07:30'))!;
    expect(e.dormirse).toBe(min('2026-10-21 23:45'));
    expect(e.despertar).toBe(min('2026-10-22 07:30'));
    expect(e).toMatchObject({ confianza: 'alta', interrupciones: 0, motivos: [] });
    expect(e.quieto).toEqual({ desde: min('2026-10-21 23:30'), hasta: min('2026-10-22 07:30') });
    // El rango, de la duda de cada señal (35 y 30): ±45 y ±38, sin antes de la última actividad ni después de la primera.
    expect(e.margen).toEqual({ dormirse: 45, despertar: 38 });
    expect(e.rango.dormirse).toEqual([min('2026-10-21 23:30'), e.dormirse + 45]);
    expect(e.rango.despertar).toEqual([e.despertar - 38, min('2026-10-22 07:30')]);
    // Una sola señal por borde: la última actividad y la primera.
    expect(e.pistas.dormirse).toEqual([{ que: 'ultimaActividad', en: min('2026-10-21 23:30'), peso: 1, tipos: ['pasos'] }]);
    expect(e.pistas.despertar).toEqual([{ que: 'primeraActividad', en: min('2026-10-22 07:30'), peso: 1, tipos: ['pasos'] }]);
  });

  it('el margen es el que elijas en Sueño › Afinar: 0, 15, 30, 45 o 60 minutos', () => {
    expect([MARGEN, margenParaDormirte(null), margenParaDormirte(undefined), margenParaDormirte(0), margenParaDormirte(45)]).toEqual([15, 15, 15, 0, 45]);
    expect(MARGENES).toEqual([0, 15, 30, 45, 60]);
    const con = (margen: number) => estimar(dia('23:30', '07:30'), SIEMPRE, { margen })!;
    expect(MARGENES.map((m) => con(m).dormirse)).toEqual(['23:30', '23:45', '00:00', '00:15', '00:30'].map((h) => min(`2026-10-2${h < '12' ? 2 : 1} ${h}`)));
    // El margen no toca la mañana.
    expect(con(60).despertar).toBe(min('2026-10-22 07:30'));
  });

  it('usar el teléfono un rato a la madrugada no corta la noche: es una interrupción, y baja la confianza', () => {
    const una = estimar(dia('23:30', '07:30', [uso('2026-10-22 03:00', '2026-10-22 03:06', 'moss')]))!;
    expect(una.despertar).toBe(min('2026-10-22 07:30'));
    expect(una).toMatchObject({ interrupciones: 1, motivos: ['usoDeNoche'] });
    const dos = estimar(dia('23:30', '07:30', [uso('2026-10-22 02:00', '2026-10-22 02:05'), uso('2026-10-22 04:30', '2026-10-22 04:40')]))!;
    expect(dos).toMatchObject({ interrupciones: 2, confianza: 'media' });
  });

  it('dejar el teléfono mucho antes de lo de siempre: todo ese rato cuenta, y Moss pregunta (confianza media, nunca baja)', () => {
    // Lo dejaste a las 21:00 y siempre te duermes a las 0:00: como Rise, cuenta desde las 21:15. Para eso está el margen.
    const e = estimar(dia('21:00', '07:30'))!;
    expect(e.dormirse).toBe(min('2026-10-21 21:15'));
    expect(e.confianza).toBe('media');
    expect(e.motivos).toEqual(expect.arrayContaining(['dejasteAntes', 'distintaDeLoDeSiempre']));
    // Una hora antes no es «mucho antes».
    const poco = estimar(dia('23:00', '07:30'))!;
    expect(poco.dormirse).toBe(min('2026-10-21 23:15'));
    expect(poco.motivos).not.toContain('dejasteAntes');
  });

  it('con dos huecos posibles (el teléfono quedó en la mesa toda la tarde) se queda con el de siempre', () => {
    const actividad = [uso('2026-10-21 18:20', '2026-10-21 18:30'), uso('2026-10-21 23:40', '2026-10-21 23:50'), uso('2026-10-22 07:40', '2026-10-22 08:00')];
    const e = estimar(actividad)!;
    expect(e.quieto.desde).toBe(min('2026-10-21 23:50'));
    expect(e.dormirse).toBe(min('2026-10-22 00:05'));
  });

  it('sin actividad a la mañana todavía no se sabe cuándo te despertaste; sin historia, confianza media', () => {
    expect(estimar([uso('2026-10-21 22:00', '2026-10-21 23:30')])).toBeNull();
    const e = estimar(dia('23:30', '07:30'), null)!;
    expect(e.dormirse).toBe(min('2026-10-21 23:45'));
    expect(e).toMatchObject({ confianza: 'media', motivos: ['sinHistoria'] });
  });

  it('solo con Moss abierta (sin pasos ni movimiento) hay pocos datos', () => {
    const e = estimar([uso('2026-10-21 23:00', '2026-10-21 23:20', 'moss'), uso('2026-10-22 07:30', '2026-10-22 07:35', 'moss')])!;
    expect(e.motivos).toContain('pocosDatos');
    expect(e.confianza).toBe('media');
  });

  it('sin un hueco de 5 horas, de la última actividad antes de las 2 a la primera después de las 4, con confianza baja', () => {
    // Con 30 minutos de teléfono a las 3:30 ya hay hueco: es un despertar (DESPERTAR). Con una hora y cuarto, no.
    const cortada = [
      uso('2026-10-21 22:00', '2026-10-21 22:30'), uso('2026-10-22 01:00', '2026-10-22 01:30'),
      uso('2026-10-22 03:30', '2026-10-22 04:45'), uso('2026-10-22 06:30', '2026-10-22 07:00'),
    ];
    const e = estimar(cortada)!;
    expect(e.dormirse).toBe(min('2026-10-22 01:30') + 15);
    expect(e.despertar).toBe(min('2026-10-22 06:30'));
    expect(e).toMatchObject({ confianza: 'baja', interrupciones: 1 });
    expect(e.motivos).toContain('sinVentana');
    // Mientras usabas el teléfono no dormías: ese rato y tu margen se restan igual.
    expect(e.despertares).toEqual([{ desde: min('2026-10-22 03:30'), hasta: min('2026-10-22 05:00') }]);
  });

  it('un Atajo: la alarma dice cuándo te despertaste, y la confianza sube', () => {
    const sin = estimar(dia('23:30', '07:30'))!;
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 07:20'), que: 'despertar' }] })!;
    expect(e.despertar).toBe(min('2026-10-22 07:20'));
    expect(e.anclada).toEqual({ dormirse: false, despertar: true });
    expect(e.probabilidad).toBeCloseTo(sin.probabilidad + 0.1, 5);
    expect(sin.anclada).toEqual({ dormirse: false, despertar: false });
  });

  it('la alarma parada, si después el teléfono volvió a quedar quieto, es una interrupción y no tu hora de despertar', () => {
    // A la madrugada, o a las 6:30 con el teléfono quieto hasta las 7:30: seguiste durmiendo.
    for (const cuando of ['2026-10-22 03:00', '2026-10-22 06:30']) {
      const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora(cuando), que: 'despertar', de: 'alarmaParada' }] })!;
      expect(e.despertar).toBe(min('2026-10-22 07:30'));
      expect(e).toMatchObject({ interrupciones: 1, anclada: { despertar: false } });
    }
    // Con menos de 45 minutos quietos después, sí es tu hora de despertar.
    expect(estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 06:50'), que: 'despertar', de: 'alarmaParada' }] })!).toMatchObject({ despertar: min('2026-10-22 06:50'), anclada: { despertar: true } });
    // «Me desperté» lo dijiste tú: vale aunque después dejes el teléfono un rato, y no es una interrupción.
    const dicho = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 06:30'), que: 'despertar', de: 'meDesperte' }] })!;
    expect(dicho).toMatchObject({ despertar: min('2026-10-22 06:30'), interrupciones: 0, anclada: { despertar: true } });
    expect(dicho.quieto.hasta).toBe(min('2026-10-22 06:30'));
  });

  it('levantarte y dejar el teléfono en la mesa no es seguir durmiendo: con pasos o con Moss abierta, hace falta hora y media quieta', () => {
    // Pasos a las 7:30 y el teléfono quieto hasta las 8:30 (el desayuno): te despertaste a las 7:30.
    expect(estimar(dia('23:30', '07:30'))!.despertar).toBe(min('2026-10-22 07:30'));
    // Lo mismo si lo que se movió fue el teléfono, pero caminando.
    const caminando: Actividad = { ...uso('2026-10-22 07:30', '2026-10-22 07:35', 'movimiento'), enMarcha: true };
    const noche = [uso('2026-10-21 23:00', '2026-10-21 23:30'), uso('2026-10-22 08:30', '2026-10-22 09:10')];
    expect(estimar([...noche, caminando])!.despertar).toBe(min('2026-10-22 07:30'));
    // Si solo lo tocaste (apagaste la alarma) y quedó quieto 55 minutos más, la noche sigue hasta las 8:30.
    expect(estimar([...noche, uso('2026-10-22 07:30', '2026-10-22 07:35', 'movimiento')])!).toMatchObject({ despertar: min('2026-10-22 08:30'), interrupciones: 1 });
    // Y unos pasos a las 5:00 (el baño) con dos horas y media quietas después son una interrupción.
    expect(estimar(dia('23:30', '07:30', [uso('2026-10-22 05:00', '2026-10-22 05:03')]))!).toMatchObject({ despertar: min('2026-10-22 07:30'), interrupciones: 1 });
  });

  it('«Me voy a dormir» tarde es lo último del día, no una interrupción', () => {
    // Sin ancla, lo suelto de las 00:40 no llega a una hora después de tu hora de siempre: es lo último del día.
    const suelto = estimar(dia('22:00', '07:30', [uso('2026-10-22 00:40', '2026-10-22 00:41', 'atajo')]))!;
    expect(suelto).toMatchObject({ dormirse: min('2026-10-22 00:41') + 15, interrupciones: 0 });
    // Más tarde sí es una interrupción, y la noche empieza a las 22:00, con su margen.
    const tarde = estimar(dia('22:00', '07:30', [uso('2026-10-22 01:40', '2026-10-22 01:41', 'atajo')]))!;
    expect(tarde).toMatchObject({ dormirse: min('2026-10-21 22:15'), interrupciones: 1 });
    // Con «Me voy a dormir» a esa hora, es lo último del día.
    const e = estimar(dia('22:00', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 01:40'), que: 'dormir' }] })!;
    expect(e.dormirse).toBe(min('2026-10-22 01:41') + 15);
    expect(e.anclada).toEqual({ dormirse: true, despertar: false });
  });

  // Lo que avisan los Atajos y el despertador (spec/sueno-sin-esfuerzo.md).
  const senal = (que: Senal['que'], texto: string, segundos = 0): Senal => ({ id: `${que}-${texto}-${segundos}`, que, en: hora(texto) + segundos * 1000 });

  it('el rango es el del 80 % del modelo: ±1,28 veces la duda de la señal, más ancho con lo que más hace errar', () => {
    // Con solo el teléfono (una duda de 35), ±45 al dormirte.
    const e = estimar(dia('23:30', '07:30'))!;
    expect(e.margen.dormirse).toBe(45);
    // Con «Me voy a dormir» (20), ±26.
    const conAviso = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: deLasSenales([senal('meVoyADormir', '2026-10-21 23:30')], UY).anclas })!;
    expect(conAviso.margen.dormirse).toBe(26);
    // Con la alarma, el despertar es exacto: ±10.
    expect(estimar(dia('23:30', '07:30'), SIEMPRE, { anclas: [{ en: hora('2026-10-22 07:20'), que: 'despertar' }] })!.margen.despertar).toBe(10);
    // Dejar el teléfono tres horas antes que siempre agranda el de dormirte (ese rato puede no haber sido sueño), no el de despertarte.
    const temprano = estimar(dia('21:00', '07:30'))!;
    expect(temprano.motivos).toContain('dejasteAntes');
    expect(temprano.margen.dormirse).toBeGreaterThan(90);
    expect(temprano.margen.despertar).toBe(e.margen.despertar);
    // Usar el teléfono de noche agranda los dos, la mitad más.
    const conUso = estimar(dia('23:30', '07:30', [uso('2026-10-22 03:00', '2026-10-22 03:06', 'moss')]))!;
    expect(conUso.margen).toEqual({ dormirse: 67, despertar: 58 });
  });

  describe('las señales de cada borde', () => {
    /** Una noche con lo que avisó el cargador: `ultima` es lo último que hiciste con el teléfono. */
    const conCargador = (ultima: string, primera: string, senales: Senal[], habitual: Habitual | null = SIEMPRE) => {
      const a = deLasSenales(senales, UY);
      return estimar(dia(ultima, primera, a.actividad), habitual, { anclas: a.anclas })!;
    };
    const pista = (e: Estimacion, borde: 'dormirse' | 'despertar', que: string) => e.pistas[borde].find((p) => p.que === que);

    it('conectar el cargador y no usar más el teléfono afirma la hora y sube la confianza', () => {
      const sin = estimar(dia('23:00', '07:30'))!;
      const e = conCargador('23:00', '07:30', [senal('cargadorConectado', '2026-10-21 23:00')]);
      expect(pista(e, 'dormirse', 'cargador')).toMatchObject({ en: min('2026-10-21 23:00'), peso: 0 });
      expect(pista(e, 'dormirse', 'cargador')!.noCuenta).toBeUndefined();
      expect(e.dormirse).toBe(min('2026-10-21 23:01') + 15);
      expect(e.probabilidad).toBeCloseTo(sin.probabilidad + 0.05, 5);
    });

    it('conectarlo y seguir usándolo no cuenta: manda lo último que hiciste', () => {
      const e = conCargador('23:52', '07:30', [senal('cargadorConectado', '2026-10-21 23:10')]);
      expect(pista(e, 'dormirse', 'cargador')).toMatchObject({ en: min('2026-10-21 23:10'), noCuenta: true });
      expect(e.quieto.desde).toBe(min('2026-10-21 23:52'));
      expect(e.dormirse).toBe(min('2026-10-21 23:52') + 15);
      expect(e.motivos).toContain('seguisteUsando');
      expect(e.probabilidad).toBeCloseTo(estimar(dia('23:52', '07:30'))!.probabilidad - 0.05, 5);
    });

    it('mirar el teléfono cerca de tu hora de siempre, después de dejarlo lejos toda la tarde, es lo último del día y no una interrupción', () => {
      // Lo dejaste a las 21:20 y a las 23:47 lo usaste 5 minutos: no estabas dormido desde las 21:35.
      const e = estimar(dia('23:52', '07:30'))!;
      expect(e.quieto.desde).toBe(min('2026-10-21 23:52'));
      expect(e.interrupciones).toBe(0);
      expect(e.dormirse).toBe(min('2026-10-22 00:07'));
      // Una hora y media después de tu hora, sí es una interrupción.
      const despues = estimar(dia('23:00', '07:30', [uso('2026-10-22 01:30', '2026-10-22 01:35')]))!;
      expect(despues.quieto.desde).toBe(min('2026-10-21 23:00'));
      expect(despues.interrupciones).toBe(1);
    });

    it('hasta 20 minutos de uso después de conectarlo todavía es acostarte', () => {
      const e = conCargador('23:30', '07:30', [senal('cargadorConectado', '2026-10-21 23:15')]);
      expect(pista(e, 'dormirse', 'cargador')!.noCuenta).toBeUndefined();
      expect(e.motivos).not.toContain('seguisteUsando');
    });

    it('nunca te da dormido antes de lo último que hiciste, aunque tu hora de siempre sea antes', () => {
      const e = conCargador('01:10', '07:30', [senal('cargadorConectado', '2026-10-22 01:10')]);
      expect(e.dormirse).toBe(min('2026-10-22 01:11') + 15);
    });

    it('a la mañana: desconectar el cargador es lo primero, y la confianza sube', () => {
      const sin = estimar(dia('23:30', '07:30'))!;
      const e = conCargador('23:30', '07:30', [senal('cargadorDesconectado', '2026-10-22 07:30')]);
      expect(e.pistas.despertar).toEqual([{ que: 'desconectaste', en: min('2026-10-22 07:30'), peso: 1 }]);
      expect(e.despertar).toBe(min('2026-10-22 07:30'));
      expect(e.probabilidad).toBeCloseTo(sin.probabilidad + 0.05, 5);
    });

    it('las noches largas cuentan enteras: agarrar el teléfono mucho más tarde que siempre no la recorta, y Moss pregunta', () => {
      // Siempre te despiertas a las 7:20 y hoy lo agarraste a las 10:00: antes te creía hasta las 8:07.
      const e = estimar([uso('2026-10-21 23:00', '2026-10-21 23:30'), uso('2026-10-22 10:00', '2026-10-22 10:20')])!;
      expect(e.despertar).toBe(min('2026-10-22 10:00'));
      expect(e.despertar - e.dormirse).toBe(10 * 60 + 15);
      expect(e.motivos).toEqual(expect.arrayContaining(['agarrasteTarde', 'distintaDeLoDeSiempre']));
      expect(e.confianza).toBe('media');
      // Cuatro horas más tarde tampoco la saca de la cuenta: media, no baja.
      const mas = estimar([uso('2026-10-21 23:00', '2026-10-21 23:30'), uso('2026-10-22 11:20', '2026-10-22 11:40')])!;
      expect(mas).toMatchObject({ despertar: min('2026-10-22 11:20'), confianza: 'media', probabilidad: 0.5 });
      // Y acostarte dos horas antes, lo mismo: entera.
      const antes = estimar(dia('22:00', '07:30'))!;
      expect(antes.dormirse).toBe(min('2026-10-21 22:15'));
    });

    it('la alarma manda si es lo primero que hiciste: es la hora, y la pista lo dice', () => {
      const e = conCargador('23:30', '07:30', [senal('alarmaParada', '2026-10-22 07:20'), senal('cargadorDesconectado', '2026-10-22 07:30')]);
      expect(e.despertar).toBe(min('2026-10-22 07:20'));
      expect(e.pistas.despertar).toEqual([{ que: 'alarma', en: min('2026-10-22 07:20'), peso: 1 }]);
    });

    it('sin historia, entre dos huecos gana el que empieza con el cargador, aunque sea más corto', () => {
      const a = deLasSenales([senal('cargadorConectado', '2026-10-21 23:40')], UY);
      // De 13:00 a 19:30 el teléfono quedó en la mesa; a la noche, 23:40 a 7:30 con el cargador.
      const actividad = [uso('2026-10-21 12:30', '2026-10-21 13:00'), uso('2026-10-21 19:30', '2026-10-21 20:00'), uso('2026-10-22 07:30', '2026-10-22 07:50'), ...a.actividad];
      const e = estimar(actividad, null)!;
      expect(e.quieto.desde).toBe(min('2026-10-21 23:41'));
    });

    it('«Me voy a dormir» antes de lo de siempre: te creo', () => {
      const a = deLasSenales([senal('meVoyADormir', '2026-10-21 22:00')], UY);
      const e = estimar(dia('22:00', '07:30'), SIEMPRE, { anclas: a.anclas })!;
      expect(pista(e, 'dormirse', 'meVoyADormir')).toMatchObject({ en: min('2026-10-21 22:00'), peso: 1 });
      expect(e.dormirse).toBe(min('2026-10-21 22:01') + 15);
    });
  });

  // spec/estudio/auditoria-del-sueno.md, sección 2: alguien que duerme de verdad de 00:45 a 8:30, con 8 h de necesidad.
  describe('los casos de la auditoría del 17/11/2026', () => {
    const DE_SIEMPRE: Habitual = { dormirse: min('2026-10-22 00:45'), despertar: min('2026-10-22 08:30'), noches: 10 };
    const movio = (desde: string, minutos = 2): Actividad => ({ desde: hora(desde), hasta: hora(desde) + minutos * 60_000, tipo: 'movimiento' });
    /** La tarde, lo último de la noche, lo que pasó en el medio y la mañana desde `primera`, que sigue. */
    const noche = (ultima: string, primera: string, medio: Actividad[] = []): Actividad[] => [
      uso('2026-10-21 19:00', '2026-10-21 19:40'), uso('2026-10-21 22:10', '2026-10-21 22:40'),
      { desde: hora(ultima) - 5 * 60_000, hasta: hora(ultima), tipo: 'movimiento' },
      ...medio,
      uso(primera, primera.replace(/\d\d:\d\d$/, '10:30')),
    ];
    /** Lo dormido como lo cuenta la deuda (sin los despertares), y la deuda de 14 noches iguales. */
    const resultado = (e: Estimacion) => {
      const iso = (m: number) => new Date(instanteDe('2026-10-22', UY, m)).toISOString();
      const despertares = e.despertares.map((x) => ({ desde: iso(x.desde), hasta: iso(x.hasta) }));
      const horas = { dormirse: iso(e.dormirse), despertar: iso(e.despertar) };
      const n = nocheDeMoss({ fecha: '2026-10-22', actualizado: iso(900), hora: { ...horas, origen: 'estimada', confianza: e.confianza, estimada: { ...horas, despertares } } }, UY)!;
      const deuda = deudaDeSueno(Array.from({ length: 14 }, () => n), 480)!;
      return { de: e.dormirse, a: e.despertar, dormido: n.dormido, deuda: redondearDeuda(deuda.minutos), juicio: juicioDeLaDeuda(deuda), confianza: e.confianza, interrupciones: e.interrupciones };
    };
    const de = (ultima: string, primera: string, medio?: Actividad[], extra?: Partial<Parameters<typeof estimarNoche>[0]>, habitual = DE_SIEMPRE) =>
      resultado(estimar(noche(ultima, primera, medio), habitual, extra)!);

    it('(a) lo deja a las 00:30 y lo agarra a las 8:30: 7 h 45 dormido (antes 6 h 41), y 1 h 30 de deuda, baja (antes 9 h 53, «Alta»)', () => {
      expect(de('2026-10-22 00:30', '2026-10-22 08:30')).toEqual({
        de: min('2026-10-22 00:45'), a: min('2026-10-22 08:30'), dormido: 7 * 60 + 45, deuda: 90, juicio: 'baja', confianza: 'alta', interrupciones: 0,
      });
    });

    it('(b) igual, y mira la hora a las 5:10: la noche sigue, menos el despertar (desde el 28/11: los 2 minutos y 5 de margen, por ser un toque corto)', () => {
      expect(de('2026-10-22 00:30', '2026-10-22 08:30', [movio('2026-10-22 05:10')])).toMatchObject({ dormido: 458, deuda: 150, juicio: 'baja', confianza: 'alta', interrupciones: 1 });
    });

    it('(c) usa el teléfono en la cama hasta las 00:43: 7 h 32 (antes 6 h 28), y 3 h de deuda, baja (antes 11 h 30)', () => {
      expect(de('2026-10-22 00:43', '2026-10-22 08:30')).toMatchObject({ de: min('2026-10-22 00:58'), dormido: 452, deuda: 180, juicio: 'baja' });
    });

    it('(d) apaga la alarma a las 7:30 y duerme hasta las 8:30: la noche termina a las 8:30 (antes, a las 7:12, y 17 h 23 de deuda)', () => {
      // (d1) Sin atajo: el teléfono se movió cinco minutos.
      expect(de('2026-10-22 00:30', '2026-10-22 08:30', [movio('2026-10-22 07:30', 5)])).toMatchObject({ a: min('2026-10-22 08:30'), dormido: 455, deuda: 150, juicio: 'baja', interrupciones: 1 });
      // (d2) Con el despertador de Moss o el atajo de la alarma: lo mismo, y el despertar es de un minuto más 5, por ser un toque corto.
      const parada = { anclas: deLasSenales([senal('despertadorParado', '2026-10-22 07:30')], UY).anclas };
      expect(de('2026-10-22 00:30', '2026-10-22 08:30', [], parada)).toMatchObject({ a: min('2026-10-22 08:30'), dormido: 459, interrupciones: 1 });
      // (d3) Pospone a las 7:30, 7:39 y 7:48 y se levanta a las 8:00: ahí el teléfono no vuelve a quedar quieto un rato largo, y termina a las 7:30.
      const pospone = [movio('2026-10-22 07:30', 1), movio('2026-10-22 07:39', 1), movio('2026-10-22 07:48', 1)];
      expect(de('2026-10-22 00:30', '2026-10-22 08:00', pospone)).toMatchObject({ a: min('2026-10-22 07:30'), dormido: 405, deuda: 480, juicio: 'media' });
      // (f) Lo mira a las 7:20 y sigue durmiendo.
      expect(de('2026-10-22 00:30', '2026-10-22 08:30', [movio('2026-10-22 07:20')])).toMatchObject({ dormido: 458, interrupciones: 1 });
    });

    it('(e) lo deja cargando en otro cuarto a las 23:15 y lo agarra a las 9:00: 9 h 30, y sin deuda (lo que sobra paga hasta una hora)', () => {
      // Con su hora de siempre, la del teléfono: esas noches son todas iguales.
      const suyo: Habitual = { dormirse: min('2026-10-21 23:30'), despertar: min('2026-10-22 09:00'), noches: 10 };
      expect(de('2026-10-21 23:15', '2026-10-22 09:00', [], {}, suyo)).toEqual({
        de: min('2026-10-21 23:30'), a: min('2026-10-22 09:00'), dormido: 9 * 60 + 30, deuda: 0, juicio: 'sinDeuda', confianza: 'alta', interrupciones: 0,
      });
    });

    it('sin ventana tranquila: dos toques seguidos ya no la rompen, y 25 minutos de teléfono a las 4:00 no terminan la noche ahí', () => {
      // (g) Dos toques, a las 3:00 y a las 3:50: antes, sin ventana; ahora, dos despertares de 17 minutos.
      expect(de('2026-10-22 00:30', '2026-10-22 08:30', [movio('2026-10-22 03:00'), movio('2026-10-22 03:50')])).toMatchObject({ dormido: 451, interrupciones: 2, confianza: 'media' });
      // (j) 25 minutos de teléfono a las 4:00. Hasta el 17/11 la noche iba de 01:01 a 03:42; hasta el 28/11, sin ventana y
      // con confianza baja. Ahora es un despertar, de las 4:00 a las 4:40, y la noche va de 00:45 a 8:30 (7 h 05 dormido).
      const e = estimar(noche('2026-10-22 00:30', '2026-10-22 08:30', [movio('2026-10-22 04:00', 25)]), DE_SIEMPRE)!;
      expect(e).toMatchObject({ dormirse: min('2026-10-22 00:45'), despertar: min('2026-10-22 08:30'), confianza: 'alta', interrupciones: 1, despertares: [{ desde: min('2026-10-22 04:00'), hasta: min('2026-10-22 04:40') }] });
      expect(e.motivos).not.toContain('sinVentana');
      expect(resultado(e).dormido).toBe(425);
    });
  });

  // Lo que pediste el 28/11/2026: agarrar el teléfono en medio de la noche y volver a dejarlo es un despertar, no un corte.
  describe('los despertares', () => {
    const iso = (m: number) => new Date(instanteDe('2026-10-22', UY, m)).toISOString();
    /** Lo dormido de la noche como se guarda, con sus despertares. */
    const dormido = (e: Estimacion) => {
      const horas = { dormirse: iso(e.dormirse), despertar: iso(e.despertar) };
      const despertares = e.despertares.map((x) => ({ desde: iso(x.desde), hasta: iso(x.hasta) }));
      return nocheDeMoss({ fecha: '2026-10-22', actualizado: iso(900), hora: { ...horas, origen: 'estimada', confianza: e.confianza, estimada: { ...horas, despertares } } }, UY)!.dormido;
    };
    const de = (desde: string, hasta: string) => ({ desde: min(desde), hasta: min(hasta) });
    const mov = (desde: string, hasta: string) => uso(desde, hasta, 'movimiento');

    it('uno de 10 minutos a las 4: la noche sigue, y se restan los 10 minutos y tu margen para volver a dormirte', () => {
      const e = estimar(dia('23:30', '07:30', [mov('2026-10-22 04:00', '2026-10-22 04:10')]))!;
      expect(e).toMatchObject({ dormirse: min('2026-10-21 23:45'), despertar: min('2026-10-22 07:30'), interrupciones: 1, despertares: [de('2026-10-22 04:00', '2026-10-22 04:25')] });
      expect(dormido(e)).toBe(7 * 60 + 45 - 25);
      // Con otro margen, otro rato para volver a dormirte.
      expect(estimar(dia('23:30', '07:30', [mov('2026-10-22 04:00', '2026-10-22 04:10')]), SIEMPRE, { margen: 30 })!.despertares).toEqual([de('2026-10-22 04:00', '2026-10-22 04:40')]);
      // Sin tocar el teléfono, ninguno.
      expect(estimar(dia('23:30', '07:30'))!.despertares).toEqual([]);
    });

    it('uno de 35 minutos, también; más de una hora con el teléfono ya no es la misma noche, y empieza después', () => {
      const e = estimar(dia('23:30', '07:30', [mov('2026-10-22 03:00', '2026-10-22 03:35')]))!;
      expect(e).toMatchObject({ dormirse: min('2026-10-21 23:45'), despertar: min('2026-10-22 07:30'), despertares: [de('2026-10-22 03:00', '2026-10-22 03:50')] });
      expect(dormido(e)).toBe(7 * 60 + 45 - 50);
      expect(estimar(dia('23:30', '08:30', [mov('2026-10-22 01:30', '2026-10-22 02:35')]))!).toMatchObject({ dormirse: min('2026-10-22 02:50'), despertares: [] });
    });

    it('ir al baño con pasos y volver a dejar el teléfono es un despertar, aunque al rato lo mires otra vez', () => {
      const bano = uso('2026-10-22 03:30', '2026-10-22 03:34');
      expect(estimar(dia('23:30', '07:30', [bano]))!).toMatchObject({ despertar: min('2026-10-22 07:30'), despertares: [de('2026-10-22 03:30', '2026-10-22 03:39')] });
      // Mirar la hora 56 minutos después es otro: hasta el 28/11, con pasos hacía falta hora y media quieta, y la noche se cortaba a las 3:30.
      expect(estimar(dia('23:30', '07:30', [bano, mov('2026-10-22 04:30', '2026-10-22 04:32')]))!).toMatchObject({
        dormirse: min('2026-10-21 23:45'), despertar: min('2026-10-22 07:30'), despertares: [de('2026-10-22 03:30', '2026-10-22 03:39'), de('2026-10-22 04:30', '2026-10-22 04:37')],
      });
    });

    it('dos despertares: se restan los dos, y cada toque baja la confianza', () => {
      const e = estimar(dia('23:30', '07:30', [mov('2026-10-22 02:10', '2026-10-22 02:15'), uso('2026-10-22 04:40', '2026-10-22 05:00', 'moss')]))!;
      expect(e).toMatchObject({
        dormirse: min('2026-10-21 23:45'), despertar: min('2026-10-22 07:30'), interrupciones: 2, confianza: 'media',
        despertares: [de('2026-10-22 02:10', '2026-10-22 02:20'), de('2026-10-22 04:40', '2026-10-22 05:15')],
      });
      expect(dormido(e)).toBe(7 * 60 + 45 - 10 - 35);
    });

    it('el caso del 28/11 (dio 2 h 04): se durmió cerca de la 1, agarró el teléfono a las 3 un rato, lo dejó y se despertó a las 9 y algo', () => {
      const suyo: Habitual = { dormirse: min('2026-10-22 01:00'), despertar: min('2026-10-22 09:00'), noches: 10 };
      const antes = [uso('2026-10-21 12:30', '2026-10-21 13:10'), uso('2026-10-21 18:40', '2026-10-21 19:20'), uso('2026-10-21 21:00', '2026-10-21 21:20', 'moss'), mov('2026-10-22 00:40', '2026-10-22 00:58')];
      const despues = [uso('2026-10-22 09:12', '2026-10-22 09:20'), uso('2026-10-22 09:40', '2026-10-22 10:30')];
      // Lo agarró dos veces seguidas, de 3:00 a 3:31: con la regla de antes la noche empezaba después, a las 03:46 (5 h 26).
      const e = estimar([...antes, mov('2026-10-22 03:00', '2026-10-22 03:12'), mov('2026-10-22 03:20', '2026-10-22 03:31'), ...despues], suyo)!;
      expect(e).toMatchObject({ dormirse: min('2026-10-22 01:13'), despertar: min('2026-10-22 09:12'), interrupciones: 2, despertares: [de('2026-10-22 03:00', '2026-10-22 03:46')] });
      expect(dormido(e)).toBe(7 * 60 + 59 - 46);
      // Con el Focus Sueño apagado a mano a las 3:17 y dos toques más, a las 4:00 y a las 4:50, la regla de antes terminaba
      // la noche en el Focus: de 01:13 a 03:17, 2 h 04. Ahora sigue hasta las 9:12: sin ventana (más de una hora con el
      // teléfono, contando el toque de las 4:00), y sin los despertares.
      const focus = { anclas: [{ en: hora('2026-10-22 03:17'), que: 'despertar' as const, de: 'enfoqueTermino' as const }] };
      const conFocus = estimar([...antes, mov('2026-10-22 03:00', '2026-10-22 03:30'), mov('2026-10-22 04:00', '2026-10-22 04:03'), mov('2026-10-22 04:50', '2026-10-22 04:52'), ...despues], suyo, focus)!;
      expect(conFocus).toMatchObject({ dormirse: min('2026-10-22 01:13'), despertar: min('2026-10-22 09:12'), anclada: { despertar: false }, despertares: [de('2026-10-22 03:00', '2026-10-22 04:18'), de('2026-10-22 04:50', '2026-10-22 04:57')] });
      expect(conFocus.motivos).toContain('sinVentana');
      expect(dormido(conFocus)).toBe(7 * 60 + 59 - 78 - 7);
    });

    it('quien se levanta y deja el teléfono en la mesa: no es un despertar, es el final de la noche', () => {
      // Pasos a las 7:00 y el teléfono quieto hasta las 8:30, el desayuno: cerca de la mañana, con pasos hace falta hora y media.
      expect(estimar(dia('23:30', '07:00'))!).toMatchObject({ despertar: min('2026-10-22 07:00'), despertares: [] });
      // Usarlo media hora en la cama al despertarte y dejarlo para bañarte, tampoco: cerca de la mañana, solo un toque corto.
      const enLaCama = [uso('2026-10-21 18:40', '2026-10-21 19:20'), uso('2026-10-21 23:20', '2026-10-21 23:30'), mov('2026-10-22 07:00', '2026-10-22 07:30'), uso('2026-10-22 08:20', '2026-10-22 09:00')];
      expect(estimar(enLaCama)!).toMatchObject({ despertar: min('2026-10-22 07:00'), despertares: [] });
      // Apagar la alarma y dormir una hora más, sí.
      const alarma = [uso('2026-10-21 18:40', '2026-10-21 19:20'), uso('2026-10-21 23:20', '2026-10-21 23:30'), mov('2026-10-22 07:00', '2026-10-22 07:02'), uso('2026-10-22 08:00', '2026-10-22 09:00')];
      expect(estimar(alarma)!).toMatchObject({ despertar: min('2026-10-22 08:00'), despertares: [de('2026-10-22 07:00', '2026-10-22 07:07')] });
    });

    it('quien usa el teléfono a las 23 y lo vuelve a mirar antes de dormirse, a la 1: lo último del día, no un despertar', () => {
      const e = estimar([uso('2026-10-21 18:40', '2026-10-21 19:20'), mov('2026-10-21 22:40', '2026-10-21 23:00'), mov('2026-10-22 00:30', '2026-10-22 00:50'), uso('2026-10-22 07:30', '2026-10-22 07:35'), uso('2026-10-22 08:30', '2026-10-22 09:10')])!;
      expect(e).toMatchObject({ dormirse: min('2026-10-22 01:05'), despertar: min('2026-10-22 07:30'), interrupciones: 0, despertares: [] });
      // Lo mismo con un rato largo después de una tarde sin tocarlo: 35 minutos a la 1:05 son en la cama, antes de dormirte.
      const tarde = estimar([uso('2026-10-21 18:40', '2026-10-21 19:20'), uso('2026-10-21 20:55', '2026-10-21 21:00'), mov('2026-10-22 01:05', '2026-10-22 01:40'), uso('2026-10-22 07:30', '2026-10-22 07:35'), uso('2026-10-22 08:30', '2026-10-22 09:10')])!;
      expect(tarde).toMatchObject({ dormirse: min('2026-10-22 01:55'), despertares: [] });
    });
  });

  describe('si la automatización del cargador anda', () => {
    const ahora = hora('2026-10-22 09:00');
    const cada = (que: Senal['que'], ...dias: number[]) => dias.map((d, i) => ({ id: `${que}${i}`, que, en: ahora - d * 86_400_000 }));

    it('sin nada, no se armó', () => {
      expect(estadoDelCargador([], ahora)).toEqual({ estado: 'sinArmar' });
      expect(estadoDelCargador(cada('alarmaParada', 0.5), ahora)).toEqual({ estado: 'sinArmar' });
    });

    it('con los dos sentidos hace poco, anda', () => {
      const senales = [...cada('cargadorConectado', 0.4, 1.4), ...cada('cargadorDesconectado', 0.1, 1.1)];
      expect(estadoDelCargador(senales, ahora)).toEqual({ estado: 'anda', ultima: ahora - 0.1 * 86_400_000 });
    });

    it('sin nada hace tres días, dejó de llegar', () => {
      const senales = [...cada('cargadorConectado', 4.4), ...cada('cargadorDesconectado', 4.1)];
      expect(estadoDelCargador(senales, ahora)).toEqual({ estado: 'dejoDeLlegar', ultima: ahora - 4.1 * 86_400_000, dias: 4 });
      // Dos días sin cargar es normal.
      expect(estadoDelCargador(cada('cargadorConectado', 2.5), ahora).estado).toBe('anda');
    });

    it('con un solo sentido varias veces, falta el otro; una sola vez todavía no se sabe', () => {
      expect(estadoDelCargador(cada('cargadorConectado', 0.5, 1.5, 2.5), ahora)).toMatchObject({ estado: 'aMedias', falta: 'desconectar' });
      expect(estadoDelCargador(cada('cargadorDesconectado', 0.5, 1.5, 2.5), ahora)).toMatchObject({ estado: 'aMedias', falta: 'conectar' });
      expect(estadoDelCargador(cada('cargadorConectado', 0.5), ahora).estado).toBe('anda');
    });
  });

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
    expect(e.dormirse).toBe(min('2026-10-22 00:41') + 15);
    // Desconectarlo y volver a conectarlo a la madrugada es usar el teléfono: una interrupción.
    const noche = estimar(dia('23:30', '07:30', actividad.slice(2)))!;
    expect(noche).toMatchObject({ dormirse: min('2026-10-21 23:45'), interrupciones: 1 });
  });

  it('el enfoque Sueño a la misma hora varias noches es el horario y no cuenta; prendido a mano, sí', () => {
    const horario = [senal('enfoqueEmpezo', '2026-10-19 23:15', 20), senal('enfoqueEmpezo', '2026-10-20 23:15', 5), senal('enfoqueEmpezo', '2026-10-21 23:16')];
    const aMano = senal('enfoqueEmpezo', '2026-10-18 22:47');
    expect(deLasSenales([...horario, aMano], UY).anclas).toEqual([{ en: aMano.en, que: 'dormir', de: 'enfoqueEmpezo' }]);
    // Con dos noches todavía no se sabe: cuentan.
    expect(deLasSenales(horario.slice(0, 2), UY).anclas).toHaveLength(2);
    // Apagado a mano a la mañana, ancla de despertar.
    expect(deLasSenales([senal('enfoqueTermino', '2026-10-22 07:03')], UY).anclas).toEqual([{ en: hora('2026-10-22 07:03'), que: 'despertar', de: 'enfoqueTermino' }]);
  });

  it('con la hora de despertar sacada de un ancla, a la mañana se pregunta solo la de dormirte', () => {
    const { anclas } = deLasSenales([senal('alarmaParada', '2026-10-22 07:20', 30)], UY);
    const e = estimar(dia('23:30', '07:30'), SIEMPRE, { anclas })!;
    // Lo que se guarda es al minuto, como la noche de Moss.
    expect(despertarAnclado(anclas, '2026-10-22', UY, Math.round(e.despertar))).toBe(true);
    const sin = estimar(dia('23:30', '07:30'))!;
    expect(despertarAnclado(anclas, '2026-10-22', UY, Math.round(sin.despertar))).toBe(false);
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

describe('las noches estimadas antes del 17/11/2026, con la regla nueva y sin sus señales', () => {
  const iso = (texto: string) => new Date(hora(texto)).toISOString();
  /** Como la guardaba la regla de antes: 31 minutos después de dejar el teléfono (23:30) y 18 antes de agarrarlo (7:30), con lo de siempre mezclado. */
  const deAntes = (origen: 'estimada' | 'confirmada' | 'corregida' | 'manual', conVentana = true): NonNullable<NochePropia['hora']> => ({
    dormirse: iso('2026-10-22 00:01'), despertar: iso('2026-10-22 07:14'), origen, confianza: 'alta',
    estimada: {
      dormirse: iso('2026-10-22 00:01'), despertar: iso('2026-10-22 07:14'), margen: { dormirse: 39, despertar: 34 },
      ...(conVentana ? { quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') } } : {}),
    },
  });

  it('con la ventana guardada: todo el rato quieto menos tu margen, de 23:45 a 7:30', () => {
    const h = sinLasRestas(deAntes('estimada'))!;
    expect([h.dormirse, h.despertar]).toEqual([iso('2026-10-21 23:45'), iso('2026-10-22 07:30')]);
    expect(h).toMatchObject({ origen: 'estimada', confianza: 'alta', estimada: { dormirse: h.dormirse, despertar: h.despertar, quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') }, margen: { dormirse: 39, despertar: 34 } } });
    // De 6 h 43 dormido (7 h 13 menos la media hora despierto) a 7 h 45.
    expect(nocheDeMoss({ fecha: '2026-10-22', actualizado: h.despertar, hora: h }, UY)!.dormido).toBe(7 * 60 + 45);
    // Con otro margen, el tuyo; y hecho otra vez (otro teléfono de la cuenta) no cambia nada.
    expect(sinLasRestas(deAntes('estimada'), 45)!.dormirse).toBe(iso('2026-10-22 00:15'));
    expect(sinLasRestas(h)).toBeNull();
    expect(sinLasRestas(h, 45)!.dormirse).toBe(iso('2026-10-22 00:15'));
  });

  it('sin la ventana (las primeras versiones), se deshacen los 31 y los 18 minutos de fábrica, y queda guardada', () => {
    const h = sinLasRestas(deAntes('estimada', false))!;
    expect([h.dormirse, h.despertar]).toEqual([iso('2026-10-21 23:45'), iso('2026-10-22 07:32')]);
    expect(h.estimada!.quieto).toEqual({ desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:32') });
    expect(sinLasRestas(h)).toBeNull();
  });

  it('con otro margen, cada despertar se corre lo mismo que la hora de dormirte, sin pasar del final de la noche', () => {
    const despertares = [{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:25') }, { desde: iso('2026-10-22 07:00'), hasta: iso('2026-10-22 07:20') }];
    const conDespertares: NonNullable<NochePropia['hora']> = {
      dormirse: iso('2026-10-21 23:45'), despertar: iso('2026-10-22 07:30'), origen: 'estimada', confianza: 'alta',
      estimada: { dormirse: iso('2026-10-21 23:45'), despertar: iso('2026-10-22 07:30'), quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') }, despertares },
    };
    expect(sinLasRestas(conDespertares, 45)!.estimada!.despertares).toEqual([{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:55') }, { desde: iso('2026-10-22 07:00'), hasta: iso('2026-10-22 07:30') }]);
    expect(sinLasRestas(conDespertares, 0)!.estimada!.despertares).toEqual([{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:10') }, { desde: iso('2026-10-22 07:00'), hasta: iso('2026-10-22 07:05') }]);
    expect(sinLasRestas(conDespertares)).toBeNull();
  });

  it('con un margen más grande, dos despertares que se pisan quedan en uno: ese rato no se resta dos veces', () => {
    // Dos usos de seis minutos, a las 2:00 y a las 2:52 (no son toques cortos): con 15 minutos, dos despertares; con 60, el primero llega a las 3:06.
    const e = estimarNoche({ clave: '2026-10-22', zona: UY, habitual: SIEMPRE, actividad: dia('23:30', '07:30', [uso('2026-10-22 02:00', '2026-10-22 02:06', 'movimiento'), uso('2026-10-22 02:52', '2026-10-22 02:58', 'movimiento')]) })!;
    expect(e.despertares).toHaveLength(2);
    const horas = { dormirse: new Date(instanteDe('2026-10-22', UY, e.dormirse)).toISOString(), despertar: new Date(instanteDe('2026-10-22', UY, e.despertar)).toISOString() };
    const quince: NonNullable<NochePropia['hora']> = {
      ...horas, origen: 'estimada', confianza: e.confianza,
      estimada: { ...horas, quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') }, despertares: e.despertares.map((x) => ({ desde: new Date(instanteDe('2026-10-22', UY, x.desde)).toISOString(), hasta: new Date(instanteDe('2026-10-22', UY, x.hasta)).toISOString() })) },
    };
    const sesenta = sinLasRestas(quince, 60)!;
    expect(sesenta.estimada!.despertares).toEqual([{ desde: iso('2026-10-22 02:00'), hasta: iso('2026-10-22 03:58') }]);
    // Lo mismo que estimarla de nuevo con 60 minutos: de 00:30 a 7:30, menos 1 h 58.
    expect(nocheDeMoss({ fecha: '2026-10-22', actualizado: horas.despertar, hora: sesenta }, UY)!.dormido).toBe(7 * 60 - 118);
    const nueva = estimarNoche({ clave: '2026-10-22', zona: UY, habitual: SIEMPRE, margen: 60, actividad: dia('23:30', '07:30', [uso('2026-10-22 02:00', '2026-10-22 02:06', 'movimiento'), uso('2026-10-22 02:52', '2026-10-22 02:58', 'movimiento')]) })!;
    expect(nueva.despertares.map((x) => [x.desde, x.hasta])).toEqual([[min('2026-10-22 02:00'), min('2026-10-22 03:58')]]);
  });

  it('un toque corto (hasta 5 minutos) resta lo usado más 5, y al cambiar el margen sigue siendo corto (28/11)', () => {
    const e = estimarNoche({ clave: '2026-10-22', zona: UY, habitual: SIEMPRE, actividad: dia('23:30', '07:30', [uso('2026-10-22 03:00', '2026-10-22 03:02', 'movimiento')]) })!;
    expect(e.despertares.map((x) => [x.desde, x.hasta])).toEqual([[min('2026-10-22 03:00'), min('2026-10-22 03:07')]]);
    const horas = { dormirse: new Date(instanteDe('2026-10-22', UY, e.dormirse)).toISOString(), despertar: new Date(instanteDe('2026-10-22', UY, e.despertar)).toISOString() };
    const quince: NonNullable<NochePropia['hora']> = {
      ...horas, origen: 'estimada', confianza: e.confianza,
      estimada: { ...horas, quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') }, despertares: [{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:07') }] },
    };
    // Con 60 sigue restando 7 minutos; con 0, solo los 2 que lo usaste.
    expect(sinLasRestas(quince, 60)!.estimada!.despertares).toEqual([{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:07') }]);
    expect(sinLasRestas(quince, 0)!.estimada!.despertares).toEqual([{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:02') }]);
  });

  it('agarrar el teléfono cuenta 5 minutos justos: es un toque corto a cualquier hora, también cerca de las 2:32 (512 minutos desde las 18)', () => {
    // Pasados a minutos desde las 18, los 5 minutos de un movimiento a veces daban 5,0000000000001: restaban 20, no 10.
    const quieto = { quieto: true, caminando: false, corriendo: false, auto: false, bici: false, confianza: 2 as const };
    const largos = Array.from({ length: 300 }, (_, k) => hora('2026-10-22 02:27') + k * 997).filter((en) => {
      const agarrar = actividadDelMovimiento([{ ...quieto, en, quieto: false }, { ...quieto, en: en + 30 * 60_000 }], hora('2026-10-22 12:00'));
      const [d] = estimarNoche({ clave: '2026-10-22', zona: UY, habitual: SIEMPRE, actividad: dia('23:30', '07:30', agarrar) })!.despertares;
      return Math.abs(d.hasta - d.desde - 10) > 1e-6;
    });
    expect(largos).toEqual([]);
  });

  it('lo que confirmaste, corregiste o escribiste no se toca; ni lo que quedaría en menos de dos horas', () => {
    expect((['confirmada', 'corregida', 'manual'] as const).map((o) => sinLasRestas(deAntes(o)))).toEqual([null, null, null]);
    expect(sinLasRestas(undefined)).toBeNull();
    expect(sinLasRestas(deAntes('estimada'), 7 * 60)).toBeNull();
  });

  it('al rehacer las de antes, también la que aceptaste con «Sí» tal como Moss la propuso: vuelve a ser estimada', () => {
    // El «Sí» aceptó una propuesta que ya traía los 31 y los 18 minutos: no es una medición tuya.
    expect(aceptadaSinCambios(deAntes('confirmada'))).toBe(true);
    const h = sinLasRestas(deAntes('confirmada'), MARGEN, true)!;
    expect([h.dormirse, h.despertar, h.origen]).toEqual([iso('2026-10-21 23:45'), iso('2026-10-22 07:30'), 'estimada']);
    // La que corregiste, aunque sea cinco minutos, es tuya; y la corregida o la escrita, también.
    const movida = { ...deAntes('confirmada'), dormirse: iso('2026-10-22 00:06') };
    expect(aceptadaSinCambios(movida)).toBe(false);
    expect(sinLasRestas(movida, MARGEN, true)).toBeNull();
    expect((['corregida', 'manual'] as const).map((o) => sinLasRestas(deAntes(o), MARGEN, true))).toEqual([null, null]);
    // Sin lo estimado guardado no se sabe si la cambiaste: no se toca.
    const { estimada: _sinEstimada, ...sola } = deAntes('confirmada');
    expect([aceptadaSinCambios(sola), sinLasRestas(sola, MARGEN, true)]).toEqual([false, null]);
    // Un «Sí» a una propuesta de la regla nueva (las horas de su ventana) queda confirmado.
    const nueva = { dormirse: iso('2026-10-21 23:45'), despertar: iso('2026-10-22 07:30') };
    const deAhora: NonNullable<NochePropia['hora']> = { ...deAntes('confirmada'), ...nueva, estimada: { ...deAntes('confirmada').estimada!, ...nueva } };
    expect([aceptadaSinCambios(deAhora), sinLasRestas(deAhora, MARGEN, true)]).toEqual([true, null]);
  });
});

describe('las noches de Moss junto a las de Salud', () => {
  const propia = (fecha: string, origen: 'estimada' | 'confirmada', confianza: 'alta' | 'media' | 'baja' = 'media'): NochePropia => ({
    fecha, actualizado: '2026-10-22T09:00:00.000Z',
    hora: { dormirse: new Date(hora('2026-10-22 00:10')).toISOString(), despertar: new Date(hora('2026-10-22 07:40')).toISOString(), origen, confianza },
  });

  it('una noche de Moss no tiene etapas ni despertares; estimada con confianza baja no cuenta hasta confirmarla', () => {
    const n = nocheDeMoss(propia('2026-10-22', 'estimada', 'media'), UY)!;
    // De 00:10 a 07:40 son 450 minutos, y todos cuentan: ya no se resta media hora despierto.
    expect(n).toMatchObject({ clave: '2026-10-22', dormido: 450, despierto: 0, conEtapas: false, dormirse: 370, despertar: 820, fuente: { id: 'moss', tipo: 'moss' } });
    expect(n.confianza.duracion).toBe('media');
    // Sin el margen guardado (una noche de antes), el de su confianza.
    expect(n.moss).toMatchObject({ origen: 'estimada', confianza: 'media', rango: { dormirse: [320, 420], despertar: [775, 865] } });
    expect(nocheDeMoss(propia('2026-10-22', 'estimada', 'baja'), UY)!.confianza.duracion).toBe('baja');
    expect(nocheDeMoss(propia('2026-10-22', 'confirmada'), UY)!.moss!.rango).toBeNull();
    expect(instanteDe('2026-10-22', UY, 370)).toBe(hora('2026-10-22 00:10'));
  });

  it('lo dormido es la noche entera; con noches de un reloj, menos lo que sueles estar despierto según él', () => {
    const noche = (despertar: string): NochePropia => ({
      fecha: '2026-10-22', actualizado: '2026-10-22T09:00:00.000Z',
      hora: { dormirse: new Date(hora('2026-10-21 23:00')).toISOString(), despertar: new Date(hora(despertar)).toISOString(), origen: 'confirmada', confianza: 'media' },
    });
    expect(nocheDeMoss(noche('2026-10-22 07:00'), UY)).toMatchObject({ dormido: 480, despierto: 0, dormirse: 300, despertar: 780 });
    expect(conNochesDeMoss([], [noche('2026-10-22 07:00')], UY)[0]).toMatchObject({ dormido: 480, despierto: 0 });
    // Con 7 noches de un reloj o más, lo tuyo: la mediana de lo despierto de esas noches más lo que el reloj no ve.
    const reloj: Fuente = { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' };
    const delReloj = Array.from({ length: 7 }, (_, i) => `2026-10-${String(12 + i).padStart(2, '0')}`).flatMap((dia, i) => [
      { etapa: 'nucleo' as const, desde: hora(`${dia} 00:00`), hasta: hora(`${dia} 03:00`), fuente: 'reloj', zona: UY },
      { etapa: 'nucleo' as const, desde: hora(`${dia} 03:${String(10 + i).padStart(2, '0')}`), hasta: hora(`${dia} 07:00`), fuente: 'reloj', zona: UY },
    ]);
    const conReloj = conNochesDeMoss(armarNoches(delReloj, [reloj]), [noche('2026-10-22 07:00')], UY).find((n) => n.clave === '2026-10-22')!;
    // Despierto de 10 a 16 minutos esas noches: la mediana, 13, más 15.
    expect(conReloj).toMatchObject({ dormido: 480 - 28, despierto: 28 });
  });

  it('los despertares se restan de lo dormido, solo lo que cae adentro de la noche, aunque la hayas confirmado o corregido', () => {
    const iso = (texto: string) => new Date(hora(texto)).toISOString();
    const noche = (origen: 'estimada' | 'confirmada' | 'corregida', despertar: string): NochePropia => ({
      fecha: '2026-10-22', actualizado: '2026-10-22T09:00:00.000Z',
      hora: {
        dormirse: iso('2026-10-21 23:45'), despertar: iso(despertar), origen, confianza: 'media',
        estimada: {
          dormirse: iso('2026-10-21 23:45'), despertar: iso('2026-10-22 07:30'),
          despertares: [{ desde: iso('2026-10-22 03:00'), hasta: iso('2026-10-22 03:40') }, { desde: iso('2026-10-22 06:50'), hasta: iso('2026-10-22 07:10') }],
        },
      },
    });
    // De 23:45 a 7:30 son 465 minutos: menos los 40 y los 20 de los despertares.
    const n = nocheDeMoss(noche('estimada', '2026-10-22 07:30'), UY)!;
    expect(n).toMatchObject({ dormido: 405, despierto: 60, despertares: 2 });
    expect(n.moss!.despertares).toEqual([{ desde: min('2026-10-22 03:00'), hasta: min('2026-10-22 03:40') }, { desde: min('2026-10-22 06:50'), hasta: min('2026-10-22 07:10') }]);
    expect(nocheDeMoss(noche('confirmada', '2026-10-22 07:30'), UY)!.dormido).toBe(405);
    // Corregida hasta las 7:00: del segundo, solo los 10 minutos de adentro.
    expect(nocheDeMoss(noche('corregida', '2026-10-22 07:00'), UY)!).toMatchObject({ dormido: 435 - 50, despierto: 50, despertares: 2 });
    // Con noches de un reloj, lo que sueles estar despierto según él se suma: esa mediana casi nunca trae un rato así.
    expect(nocheDeMoss(noche('estimada', '2026-10-22 07:30'), UY, 28)!).toMatchObject({ dormido: 465 - 88, despierto: 88 });
  });

  it('el rango guardado con la noche, sin antes de la última actividad ni después de la primera', () => {
    const iso = (texto: string) => new Date(hora(texto)).toISOString();
    const np: NochePropia = {
      fecha: '2026-10-22', actualizado: '2026-10-22T09:00:00.000Z',
      hora: {
        dormirse: iso('2026-10-22 00:01'), despertar: iso('2026-10-22 07:14'), origen: 'estimada', confianza: 'alta',
        estimada: { dormirse: iso('2026-10-22 00:01'), despertar: iso('2026-10-22 07:14'), quieto: { desde: iso('2026-10-21 23:30'), hasta: iso('2026-10-22 07:30') }, margen: { dormirse: 39, despertar: 34 } },
      },
    };
    expect(nocheDeMoss(np, UY)!.moss!.rango).toEqual({ dormirse: [min('2026-10-21 23:30'), min('2026-10-22 00:40')], despertar: [min('2026-10-22 06:40'), min('2026-10-22 07:30')] });
  });

  it('Salud gana a lo estimado; lo que confirmaste gana a lo anotado a mano en Salud', () => {
    const reloj: Fuente = { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' };
    const muestra = (aMano?: true) => ({ etapa: 'dormido' as const, desde: hora('2026-10-21 23:30'), hasta: hora('2026-10-22 07:00'), fuente: 'reloj', zona: UY, ...(aMano ? { aMano } : {}) });
    const delReloj = armarNoches([muestra()], [reloj]);
    expect(conNochesDeMoss(delReloj, [propia('2026-10-22', 'estimada')], UY)[0].fuente.id).toBe('reloj');
    const aMano = armarNoches([muestra(true)], [reloj]);
    expect(conNochesDeMoss(aMano, [propia('2026-10-22', 'estimada')], UY)[0].fuente.id).toBe('reloj');
    expect(conNochesDeMoss(aMano, [propia('2026-10-22', 'confirmada')], UY)[0].fuente.id).toBe('moss');
    // La de un anillo que llega a Salud después de que Moss ya estimó la noche, o de que le dijiste «Sí»: gana el anillo.
    const anillo: Fuente = { id: 'com.moyoung.darings', nombre: 'Da Rings', tipo: 'otra' };
    const delAnillo = armarNoches([{ ...muestra(), fuente: anillo.id }], [anillo]);
    expect(conNochesDeMoss(delAnillo, [propia('2026-10-22', 'estimada', 'alta')], UY)[0].fuente.id).toBe(anillo.id);
    expect(conNochesDeMoss(delAnillo, [propia('2026-10-22', 'confirmada')], UY)[0].fuente.id).toBe(anillo.id);
    // Donde Salud no tiene nada, la de Moss.
    expect(conNochesDeMoss([], [propia('2026-10-22', 'estimada')], UY).map((n) => n.clave)).toEqual(['2026-10-22']);
  });

  it('una siesta en Salud no le gana a la noche de Moss (el anillo cargó de noche y registró una siesta de 14:00 a 14:40)', () => {
    const anillo: Fuente = { id: 'com.ouraring.oura', nombre: 'Oura', tipo: 'otra' };
    const siesta = armarNoches([{ etapa: 'nucleo', desde: hora('2026-10-22 14:00'), hasta: hora('2026-10-22 14:40'), fuente: anillo.id, zona: UY }], [anillo]);
    for (const origen of ['confirmada', 'estimada'] as const) {
      expect(conNochesDeMoss(siesta, [propia('2026-10-22', origen)], UY).map((n) => [n.clave, n.fuente.id, n.dormido])).toEqual([['2026-10-22', 'moss', 450]]);
    }
  });

  it('la noche de Sleep Cycle o AutoSleep (confianza baja, no cuenta para nada) no le gana a la de Moss; sin la de Moss, queda', () => {
    const sleepCycle: Fuente = { id: 'com.northcube.sleepcycle', nombre: 'Sleep Cycle', tipo: 'telefono' };
    const deSleepCycle = armarNoches([{ etapa: 'dormido', desde: hora('2026-10-21 23:30'), hasta: hora('2026-10-22 07:00'), fuente: sleepCycle.id, zona: UY }], [sleepCycle]);
    expect(deSleepCycle[0].confianza.duracion).toBe('baja');
    for (const origen of ['confirmada', 'estimada'] as const) {
      expect(conNochesDeMoss(deSleepCycle, [propia('2026-10-22', origen)], UY).map((n) => n.fuente.id)).toEqual(['moss']);
    }
    expect(conNochesDeMoss(deSleepCycle, [], UY).map((n) => n.fuente.id)).toEqual([sleepCycle.id]);
  });

  it('mientras la noche del anillo no llega, se sabe de cuál se espera; si ya llegó una de ese día o después, no se espera', () => {
    const anillo: Fuente = { id: 'com.moyoung.darings', nombre: 'Da Rings', tipo: 'otra' };
    const iphone: Fuente = { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' };
    const del = (f: Fuente, dia: string, aMano?: true) => armarNoches([{ etapa: 'dormido', desde: hora(`${dia} 00:00`), hasta: hora(`${dia} 07:00`), fuente: f.id, zona: UY, ...(aMano ? { aMano } : {}) }], [f]);
    const hasta20 = [...del(anillo, '2026-10-19'), ...del(anillo, '2026-10-20')];
    const conMoss = (salud: ReturnType<typeof armarNoches>) => conNochesDeMoss(salud, [propia('2026-10-22', 'estimada')], UY);
    // Anoche (la del 22) no llegó: se espera la de Da Rings, también para la del 21.
    expect(aparatoQueFalta(conMoss(hasta20), '2026-10-22')).toEqual(anillo);
    expect(aparatoQueFalta(hasta20, '2026-10-21')).toEqual(anillo);
    // Llegó la del 22: ya no se espera, ni la del 21, que no va a llegar.
    const conLa22 = [...hasta20, ...del(anillo, '2026-10-22')];
    expect(aparatoQueFalta(conLa22, '2026-10-22')).toBeNull();
    expect(aparatoQueFalta(conLa22, '2026-10-21')).toBeNull();
    // Sin noches del anillo en las dos semanas de antes, o solo del teléfono o anotadas a mano, no se espera nada.
    expect(aparatoQueFalta(hasta20, '2026-11-03')).toEqual(anillo);
    expect(aparatoQueFalta(hasta20, '2026-11-04')).toBeNull();
    expect(aparatoQueFalta(del(iphone, '2026-10-20'), '2026-10-22')).toBeNull();
    expect(aparatoQueFalta(del(anillo, '2026-10-20', true), '2026-10-22')).toBeNull();
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
    expect([delCambio.dormido + delCambio.despierto, delCambio.dormirse, delCambio.despertar]).toEqual([540, 300, 780]);
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
      { desde: hora('2026-10-21 23:00'), hasta: hora('2026-10-21 23:10'), tipo: 'movimiento', enMarcha: true },
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

describe('el editor de la hora', () => {
  it('una noche dura entre una hora y 18, como la acepta la cuenta; lo que ya estaba fuera queda, pero no se aleja', () => {
    // En minutos desde las 18 del día anterior: de 20:00 a 14:00 son 18 horas.
    expect([moverDormirse(125, 1200, -5), moverDormirse(120, 1200, -5), moverDespertar(120, 1195, 5), moverDespertar(120, 1200, 5)]).toEqual([120, 120, 1200, 1200]);
    // Lo de siempre: desde las 18 de ayer y hasta las 18 de hoy, con una hora al menos entre las dos.
    expect([moverDormirse(0, 480, -5), moverDormirse(420, 480, 5), moverDespertar(420, 480, -5), moverDespertar(0, 300, 5)]).toEqual([0, 420, 480, 305]);
    // Una de 24 horas (de antes) no se alarga, y se puede acortar.
    expect([moverDespertar(0, 1440, 5), moverDespertar(0, 1440, -5), moverDormirse(0, 1440, -5)]).toEqual([1440, 1435, 0]);
  });
});
