import { describe, expect, it } from '@jest/globals';

import { FATIGA_TOPE, fatigaMuscular, fatigaPorDia, indiceDeFatiga, musculosParaLaFatiga, musculosPrincipales, todosLosMusculos, type DiaDeRutina } from './fatiga';
import { caidaInicial, type SesionConBloques } from './musculos';

const H = 3_600_000;
// El miércoles 21 de octubre a las 18:00.
const EN = Date.UTC(2026, 9, 21, 18);
const series = (n: number) => Array.from({ length: n }, () => ({ peso: 0, reps: null }));
const sesion = (horasAntes: number, ...bloques: [string, number][]): SesionConBloques => ({
  inicio: EN - horasAntes * H,
  bloques: bloques.map(([id, n]) => ({ ejercicio: id, id, series: series(n) })),
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
    expect(musculosPrincipales([{ id: 'press_banca' }, { id: 'sentadilla' }, { id: 'curl_femoral' }, { id: 'prensa' }])).toEqual(['cuadriceps', 'gluteos', 'isquios', 'pecho']);
  });
  it('con sesión hoy, los de la sesión', () => {
    expect(musculosParaLaFatiga({ deHoy: [{ id: 'press_banca' }], sesiones: [sesion(20, ['sentadilla', 5])], en: EN })).toEqual(['pecho']);
  });
  it('sin sesión, los de los últimos 3 días, y no los de antes', () => {
    const sesiones = [sesion(100, ['remo_barra', 4]), sesion(48, ['sentadilla', 5]), sesion(20, ['curl_barra', 3])];
    expect(musculosParaLaFatiga({ deHoy: null, sesiones, en: EN })).toEqual(['cuadriceps', 'gluteos', 'biceps']);
    expect(musculosParaLaFatiga({ deHoy: [], sesiones: [], en: EN })).toEqual([]);
  });
  it('6 series de sentadilla hace un día dejan un 27 % de fatiga en las piernas', () => {
    const f = fatigaMuscular({ musculos: ['cuadriceps', 'gluteos'], sesiones: [sesion(24, ['sentadilla', 6])], en: EN });
    expect(f.musculos[0].residual).toBeCloseTo(8.13, 1);
    expect(f.indice).toBe(27);
    expect(fatigaMuscular({ musculos: [], sesiones: [], en: EN }).indice).toBe(0);
  });
  it('la sesión que empieza justo en ese momento todavía no cuenta: así se mira antes de entrenar', () => {
    expect(fatigaMuscular({ musculos: ['cuadriceps'], sesiones: [sesion(0, ['sentadilla', 6])], en: EN }).indice).toBe(0);
  });
});

describe('la fatiga por día de la rutina', () => {
  const RUTINA: DiaDeRutina[] = [
    { dia: 1, nombre: 'Empuje', ejercicios: [{ id: 'press_banca' }, { id: 'triceps_polea' }] },
    { dia: 3, nombre: 'Piernas', ejercicios: [{ id: 'sentadilla' }] },
    { dia: 5, nombre: 'Torso', ejercicios: [{ id: 'remo_barra' }, { id: 'curl_barra' }] },
    { dia: 6, nombre: 'Descanso', ejercicios: [] },
  ];
  // Ayer, tríceps; el viernes toca bíceps.
  const dias = fatigaPorDia({ rutina: RUTINA, hoy: 3, sesiones: [sesion(24, ['triceps_polea', 5])], en: EN });

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

describe('en palabras y en días, nunca en horas ni en %', () => {
  it('cada músculo dice cuándo va a estar listo en días del calendario, y el día de la rutina, su peor estado', () => {
    // 6 series de sentadilla hace un día: le faltan 36 horas; a las 18, eso es pasado mañana.
    const f = fatigaMuscular({ musculos: ['cuadriceps'], sesiones: [sesion(24, ['sentadilla', 6])], en: EN, minuto: 18 * 60 });
    expect(f.musculos[0]).toMatchObject({ estado: 'recuperandose', listo: 36, cuando: 'pasadoManana' });
    expect(f.peor).toBe('recuperandose');
    const dias = fatigaPorDia({ rutina: [{ dia: 1, nombre: 'Empuje', ejercicios: [{ id: 'triceps_polea' }] }, { dia: 5, nombre: 'Torso', ejercicios: [{ id: 'curl_barra' }] }], hoy: 3, sesiones: [sesion(24, ['triceps_polea', 5])], en: EN });
    expect(dias.map((d) => [d.nombre, d.peor])).toEqual([['Torso', 'recuperado'], ['Empuje', 'recuperandose']]);
  });

  it('todos los músculos, para el cuerpo dibujado: los que ya están, también', () => {
    const todos = todosLosMusculos({ sesiones: [sesion(24, ['sentadilla', 6])], en: EN });
    expect(todos.length).toBe(13);
    expect(todos.find((m) => m.musculo === 'pecho')).toMatchObject({ estado: 'recuperado', cuando: 'ya' });
  });
});
