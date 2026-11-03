import { describe, expect, it } from '@jest/globals';

import { FATIGA_TOPE, fatigaMuscular, fatigaPorDia, indiceDeFatiga, musculosParaLaFatiga, musculosPrincipales, type DiaDeRutina } from './fatiga';
import { caidaInicial, type SesionConBloques } from './musculos';

const H = 3_600_000;
// El miércoles 21 de octubre a las 18:00.
const EN = Date.UTC(2026, 9, 21, 18);
const series = (n: number) => Array.from({ length: n }, () => ({ peso: 0, reps: null }));
const sesion = (horasAntes: number, ...bloques: [string, number][]): SesionConBloques => ({
  inicio: EN - horasAntes * H,
  bloques: bloques.map(([ejercicio, n]) => ({ ejercicio, series: series(n) })),
});

describe('el índice de fatiga', () => {
  it('el promedio de lo que les falta, sobre lo más que deja una sesión, de 0 a 100', () => {
    expect(FATIGA_TOPE).toBe(30);
    expect(indiceDeFatiga([])).toBe(0);
    expect(indiceDeFatiga([3])).toBe(10);
    expect(indiceDeFatiga([15, 0])).toBe(25);
    expect(indiceDeFatiga([30, 30])).toBe(100);
    expect(indiceDeFatiga([45])).toBe(100);
  });
  it('lo más que deja una sesión es el techo de caidaInicial()', () => {
    expect(caidaInicial(1000)).toBeCloseTo(FATIGA_TOPE);
  });
});

describe('los músculos de hoy', () => {
  it('los principales, sin repetir y con las piernas primero', () => {
    expect(musculosPrincipales([{ ejercicio: 'Press banca' }, { ejercicio: 'Sentadilla' }, { ejercicio: 'Curl femoral' }, { ejercicio: 'Prensa' }])).toEqual(['cuadriceps', 'gluteos', 'isquios', 'pecho']);
  });
  it('con sesión hoy, los de la sesión', () => {
    expect(musculosParaLaFatiga({ deHoy: [{ ejercicio: 'Press banca' }], sesiones: [sesion(20, ['Sentadilla', 5])], en: EN })).toEqual(['pecho']);
  });
  it('sin sesión, los de los últimos 3 días, y no los de antes', () => {
    const sesiones = [sesion(100, ['Remo con barra', 4]), sesion(48, ['Sentadilla', 5]), sesion(20, ['Curl de bíceps', 3])];
    expect(musculosParaLaFatiga({ deHoy: null, sesiones, en: EN })).toEqual(['cuadriceps', 'gluteos', 'biceps']);
    expect(musculosParaLaFatiga({ deHoy: [], sesiones: [], en: EN })).toEqual([]);
  });
  it('6 series de sentadilla hace un día dejan un 27 % de fatiga en las piernas', () => {
    const f = fatigaMuscular({ musculos: ['cuadriceps', 'gluteos'], sesiones: [sesion(24, ['Sentadilla', 6])], en: EN });
    expect(f.musculos[0].residual).toBeCloseTo(8.13, 1);
    expect(f.indice).toBe(27);
    expect(fatigaMuscular({ musculos: [], sesiones: [], en: EN }).indice).toBe(0);
  });
  it('la sesión que empieza justo en ese momento todavía no cuenta: así se mira antes de entrenar', () => {
    expect(fatigaMuscular({ musculos: ['cuadriceps'], sesiones: [sesion(0, ['Sentadilla', 6])], en: EN }).indice).toBe(0);
  });
});

describe('la fatiga por día de la rutina', () => {
  const RUTINA: DiaDeRutina[] = [
    { dia: 1, nombre: 'Empuje', ejercicios: [{ ejercicio: 'Press banca' }, { ejercicio: 'Tríceps en polea' }] },
    { dia: 3, nombre: 'Piernas', ejercicios: [{ ejercicio: 'Sentadilla' }] },
    { dia: 5, nombre: 'Torso', ejercicios: [{ ejercicio: 'Remo con barra' }, { ejercicio: 'Curl de bíceps' }] },
    { dia: 6, nombre: 'Descanso', ejercicios: [] },
  ];
  // Ayer, tríceps; el viernes toca bíceps.
  const dias = fatigaPorDia({ rutina: RUTINA, hoy: 3, sesiones: [sesion(24, ['Tríceps en polea', 5])], en: EN });

  it('primero hoy y después lo que sigue en la semana; los días sin ejercicios no van', () => {
    expect(dias.map((d) => [d.nombre, d.hoy])).toEqual([['Piernas', true], ['Torso', false], ['Empuje', false]]);
  });
  it('cada músculo por separado: el tríceps se está recuperando y el bíceps ya está', () => {
    const empuje = dias[2].musculos;
    expect(empuje.map((m) => m.musculo)).toEqual(['pecho', 'triceps']);
    expect(empuje[1]).toMatchObject({ estado: 'recuperandose', listo: 4 });
    expect(dias[1].musculos.find((m) => m.musculo === 'biceps')).toMatchObject({ estado: 'recuperado', listo: null });
  });
});
