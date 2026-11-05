import { describe, expect, it } from '@jest/globals';

import {
  bajoDeVerdad, estaEstancado, MAXIMO_DE_RAZONES, puntosDelEjercicio, razonesDeEstancamiento, semanaDeEntreno, semanasParaLasRazones, type SemanaDeEntreno,
} from './estancados';
import type { SesionConBloques } from './musculos';
import { tendenciaDeFuerza } from './rendimiento';

const semana = (series: number, veces = 1, pesadas = 4, conReps = 10): SemanaDeEntreno => ({ lunes: '2026-09-07', series, veces, pesadas, conReps });
// Cuando subía: unas 12 series duras por semana del músculo, una sesión por semana con el ejercicio, con la carga pesada.
const ANTES = [semana(12), semana(13), semana(11), semana(12), semana(12), semana(13)];
const COMIDA = [{ dias: 6, proteina: 150 }, { dias: 5, proteina: 145 }];
const base = (cambios: Partial<Parameters<typeof razonesDeEstancamiento>[0]> = {}) => razonesDeEstancamiento({
  antes: ANTES, ahora: ANTES, objetivo: 'mantener', bajaSemanal: null, comida: COMIDA, pesoKg: 80, sueno: { antes: 460, ahora: 455 }, anios: null,
  ...cambios,
});
const ques = (r: ReturnType<typeof razonesDeEstancamiento>) => r.razones.map((x) => x.que);

describe('cuándo está estancado', () => {
  const plana = tendenciaDeFuerza(Array.from({ length: 10 }, (_, w) => ({ t: w, e1rm: 100 * (1 + (w % 2 ? 0.01 : -0.01)) })), { hoy: 9, entrenado: true });
  it('con la tendencia sin subida clara de 8 semanas o más, y nunca antes del umbral de Ascent (6 de fábrica)', () => {
    expect(plana.estado).toBe('sinSubidaClara');
    expect(estaEstancado(plana, 7)).toBe(true);
    expect(estaEstancado(plana, 4)).toBe(false);
    // Con el umbral que se eligió en Ascent.
    expect(estaEstancado(plana, 4, 3)).toBe(true);
  });
  it('con menos semanas de tendencia, o si sube, no', () => {
    const corta = tendenciaDeFuerza(Array.from({ length: 7 }, (_, w) => ({ t: w, e1rm: 100 * (1 + (w % 2 ? 0.01 : -0.01)) })), { hoy: 6, entrenado: true });
    expect(estaEstancado(corta, 8)).toBe(false);
    const sube = tendenciaDeFuerza(Array.from({ length: 10 }, (_, w) => ({ t: w, e1rm: 100 + 1.5 * w })), { hoy: 9, entrenado: true });
    expect(estaEstancado(sube, 8)).toBe(false);
  });
  it('las semanas que se comparan: las 6 de antes de la mejor marca, con ella, y las de después hasta esta', () => {
    const s = semanasParaLasRazones('2026-09-02', '2026-10-21');
    expect(s.antes).toEqual(['2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31']);
    expect(s.ahora).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19']);
  });
});

describe('lo que bajó de verdad: dos errores estándar de la variación entre semanas', () => {
  it('con 3 semanas de cada lado o más, y un mínimo', () => {
    expect(bajoDeVerdad([12, 13, 11], [8, 9, 8], 2)).toMatchObject({ bajo: true });
    // Una semana floja en el medio no alcanza: lo de ahora varía mucho.
    expect(bajoDeVerdad([12, 13, 11], [12, 4, 12], 2)!.bajo).toBe(false);
    // Iguales, el error es 0: el mínimo hace que una serie de diferencia no cuente.
    expect(bajoDeVerdad([12, 12, 12], [11, 11, 11], 2)!.bajo).toBe(false);
    expect(bajoDeVerdad([12, 12], [8, 8, 8], 2)).toBeNull();
  });
});

describe('las razones, de la más a la menos sólida', () => {
  it('sin nada distinto, ninguna', () => {
    expect(base().razones).toEqual([]);
    expect(base().faltan).toEqual([]);
  });

  it('primero la dosis: menos series duras por semana del músculo y menos veces con el ejercicio', () => {
    const ahora = [semana(8, 0.5), semana(7, 0.5), semana(8, 0.5), semana(7, 0.5)].map((s, i) => ({ ...s, veces: i % 2 ? 0 : 1 }));
    const r = base({ antes: ANTES.map((s) => ({ ...s, veces: 2 })), ahora: ahora.map((s) => ({ ...s, veces: 1 })) });
    expect(ques(r)).toEqual(['series', 'frecuencia']);
    const [series] = r.razones as { antes: number; ahora: number }[];
    expect([Math.round(series.antes * 10) / 10, series.ahora]).toEqual([12.2, 7.5]);
  });

  it('pocas series pesadas: menos de un tercio, con 6 series con repeticiones o más', () => {
    expect(ques(base({ ahora: [semana(12, 1, 1, 10), semana(12, 1, 0, 9), semana(12, 1, 1, 10)] }))).toEqual(['pesadas']);
    expect(ques(base({ ahora: [semana(12, 1, 1, 2), semana(12, 1, 0, 2)] }))).toEqual([]);
  });

  it('bajar más de un 1 % por semana, o la definición, en lugar del balance de calorías; con «sin déficit», nada de eso', () => {
    expect(ques(base({ bajaSemanal: 1.3 }))).toEqual(['bajando']);
    expect(ques(base({ objetivo: 'bajar', bajaSemanal: 0.6 }))).toEqual(['definicion']);
    expect(ques(base({ objetivo: 'bajar', bajaSemanal: 1.3, sinDeficit: true }))).toEqual([]);
  });

  it('la proteína solo por debajo de 1,6 g por kilo por día, y con 4 días anotados por semana en 2 semanas o más', () => {
    expect(ques(base({ comida: [{ dias: 6, proteina: 120 }, { dias: 5, proteina: 115 }] }))).toEqual(['proteina']);
    expect((base({ comida: [{ dias: 6, proteina: 120 }, { dias: 5, proteina: 115 }] }).razones[0] as { gPorKg: number }).gPorKg).toBeCloseTo(1.47, 2);
    // 130 g con 80 kg es 1,63: no.
    expect(ques(base({ comida: [{ dias: 6, proteina: 130 }, { dias: 5, proteina: 130 }] }))).toEqual([]);
    const pocos = base({ comida: [{ dias: 2, proteina: 90 }, { dias: 3, proteina: 80 }] });
    expect(ques(pocos)).toEqual([]);
    expect(pocos.faltan).toEqual(['comida']);
  });

  it('el sueño: por debajo de 6 h, o 45 minutos menos que cuando subía', () => {
    expect(ques(base({ sueno: { antes: 460, ahora: 350 } }))).toEqual(['sueno']);
    expect(ques(base({ sueno: { antes: 470, ahora: 420 } }))).toEqual(['sueno']);
    expect(ques(base({ sueno: { antes: 460, ahora: 430 } }))).toEqual([]);
    expect(base({ sueno: { antes: null, ahora: null } }).faltan).toEqual(['sueno']);
  });

  it('dos o tres como mucho, en ese orden; los años, aparte y de contexto', () => {
    const r = base({
      ahora: [semana(7, 1, 0, 10), semana(6, 1, 1, 10), semana(7, 1, 0, 10)], bajaSemanal: 1.4, comida: [{ dias: 6, proteina: 100 }, { dias: 6, proteina: 100 }],
      sueno: { antes: 460, ahora: 340 }, anios: 4,
    });
    expect(r.razones.length).toBe(MAXIMO_DE_RAZONES);
    expect(ques(r)).toEqual(['series', 'pesadas', 'bajando']);
    expect(r.anios).toBe(4);
    expect(base({ anios: 1 }).anios).toBeNull();
  });
});

describe('lo de cada semana, con las sesiones de Ascent', () => {
  const dia = (fecha: string, bloques: SesionConBloques['bloques']) => ({ fecha, inicio: Date.parse(fecha + 'T21:00:00Z'), bloques });
  const sesiones = [
    dia('2026-10-05', [{ ejercicio: 'Press de banca', id: 'press_banca', series: [{ peso: 40, reps: 10 }, { peso: 80, reps: 5 }, { peso: 80, reps: 5 }, { peso: 70, reps: 8 }] }]),
    dia('2026-10-08', [{ ejercicio: 'Press inclinado', id: 'press_inclinado', series: [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }] }]),
    dia('2026-10-12', [{ ejercicio: 'Press de banca', id: 'press_banca', series: [{ peso: 80, reps: 5 }] }]),
  ];
  it('las series duras del pecho con todos sus ejercicios, las veces con el ejercicio y sus series pesadas (sin la entrada en calor)', () => {
    const s = semanaDeEntreno(sesiones, '2026-10-05', { id: 'press_banca', ejercicio: 'Press de banca' }, 'pecho');
    expect(s).toEqual({ lunes: '2026-10-05', series: 5, veces: 1, pesadas: 2, conReps: 3 });
  });
  it('los puntos de la tendencia: el 1RM estimado de la mejor serie de cada sesión, en semanas', () => {
    const p = puntosDelEjercicio(sesiones, { id: 'press_banca', ejercicio: 'Press de banca' }, '2026-10-05');
    expect(p.map((x) => [x.t, Math.round(x.e1rm * 10) / 10])).toEqual([[0, 93.3], [1, 93.3]]);
  });
});
