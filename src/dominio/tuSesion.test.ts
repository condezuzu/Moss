import { describe, expect, it } from '@jest/globals';

import { sumarDias } from './fechas';
import type { Bloque } from './musculos';
import { bajadaDeFuerza, comoFueLaSesion, semanasDeLaBajada, type PuntoDeLaBajada } from './tuSesion';

const DIA0 = '2026-08-03';
/** Una sesión por semana desde el lunes 3 de agosto, con el 1RM estimado de cada una. */
const semanal = (e1rms: number[], reps: number | null = 5): PuntoDeLaBajada[] => e1rms.map((e1rm, i) => ({ fecha: sumarDias(DIA0, 7 * i), e1rm, reps }));

describe('la bajada de fuerza: las 4 últimas sesiones contra las 8 de antes', () => {
  it('sin 12 sesiones, todavía no se sabe', () => {
    expect(bajadaDeFuerza(semanal(Array(11).fill(100)))).toBeNull();
  });

  it('pareja, o un 3 % abajo (el ruido de un día), no bajó', () => {
    expect(bajadaDeFuerza(semanal(Array(12).fill(100)))).toBeNull();
    expect(bajadaDeFuerza(semanal([...Array(8).fill(100), ...Array(4).fill(97)]))).toBeNull();
  });

  it('un 6 % abajo sí: desde cuándo, sin cambio de rango ni pausa', () => {
    const b = bajadaDeFuerza(semanal([...Array(8).fill(100), ...Array(4).fill(94)]))!;
    expect(b.caida).toBeCloseTo(6, 5);
    expect(b.desde).toBe(sumarDias(DIA0, 56));
    expect(b).toMatchObject({ antesDesde: DIA0, antesHasta: sumarDias(DIA0, 49), cambioDeRango: false, pausa: null });
  });

  it('avisa si la mejor serie cambió de rango: el número estimado se mueve aunque la fuerza no', () => {
    const puntos = [...semanal(Array(8).fill(100), 5), ...semanal(Array(4).fill(94), 10).map((p, i) => ({ ...p, fecha: sumarDias(DIA0, 7 * (8 + i)) }))];
    expect(bajadaDeFuerza(puntos)!.cambioDeRango).toBe(true);
  });

  it('una pausa de 3 semanas entre las de antes y las de ahora', () => {
    const puntos = semanal([...Array(8).fill(100), ...Array(4).fill(93)]).map((p, i) => (i >= 8 ? { ...p, fecha: sumarDias(p.fecha, 14) } : p));
    expect(bajadaDeFuerza(puntos)!.pausa).toBe(21);
  });

  it('las semanas para las razones: las de antes no se pisan con las de ahora', () => {
    const b = bajadaDeFuerza(semanal([...Array(8).fill(100), ...Array(4).fill(94)]))!;
    const s = semanasDeLaBajada(b, sumarDias(DIA0, 7 * 11 + 2));
    expect(s.antes).toHaveLength(8);
    expect(s.ahora).toHaveLength(4);
    expect(s.antes.some((l) => s.ahora.includes(l))).toBe(false);
  });
});

const sentadilla = (series: [number, number, number?][]): Bloque => ({ id: 'sentadilla', ejercicio: 'Sentadilla', grupo: 'piernas', series: series.map(([peso, reps, rir]) => ({ peso, reps, rir: rir ?? null })) });
/** Cuatro sesiones de antes con 3 × 5 a 100 kg: lo tuyo es 100 × 5. */
const ANTES = [1, 2, 3, 4].map((k) => ({ fecha: sumarDias('2026-11-25', -7 * k), bloques: [sentadilla([[100, 5], [100, 5], [100, 5]])] }));
const fue = (series: [number, number, number?][], nocheCorta = false, antes = ANTES) => comoFueLaSesion({ sesion: { bloques: [sentadilla(series)] }, antes, nocheCorta });

describe('cómo fue la sesión, sin puntaje', () => {
  it('como lo tuyo: «como siempre»', () => {
    const r = fue([[100, 5], [100, 5], [100, 5]])!;
    expect(r.nota).toBe('comoSiempre');
    expect(r.rendimiento).toEqual([expect.objectContaining({ ejercicio: 'Sentadilla', como: 'igual' })]);
  });

  it('un 10 % arriba de lo tuyo, sin señales de fallo: «buena»', () => {
    expect(fue([[110, 5], [110, 5], [110, 5]])!.nota).toBe('buena');
  });

  it('un 10 % abajo: «floja», y dice si la noche fue corta', () => {
    const r = fue([[90, 5], [90, 5], [90, 5]], true)!;
    expect(r).toMatchObject({ nota: 'floja', nocheCorta: true });
    expect(r.rendimiento[0].diferencia).toBeCloseTo(-10, 5);
  });

  it('con el mismo peso, las repeticiones caen a la mitad: probablemente al fallo, «dura» aunque rindió más', () => {
    const r = fue([[100, 10], [100, 7], [100, 5]])!;
    expect(r.nota).toBe('dura');
    expect(r.fallo).toEqual([{ ejercicio: 'Sentadilla', caida: 0.5, alFallo: 0 }]);
    expect(r.rendimiento[0].como).toBe('arriba');
  });

  it('dos series anotadas a 0 de reserva también es ir al fallo', () => {
    expect(fue([[100, 5, 0], [100, 5, 0], [100, 5, 2]])!.fallo).toEqual([{ ejercicio: 'Sentadilla', caida: 0, alFallo: 2 }]);
  });

  it('más de 10 series de un músculo en el día: «dura»; la entrada en calor no cuenta', () => {
    const r = fue([[40, 5], [60, 5], ...Array.from({ length: 11 }, (): [number, number] => [100, 5])])!;
    expect(r.nota).toBe('dura');
    expect(r.volumen).toEqual(expect.arrayContaining([{ musculo: 'cuadriceps', series: 11 }, { musculo: 'gluteos', series: 11 }]));
    expect(r.volumen.find((v) => v.musculo === 'aductores')).toBeUndefined();
  });

  it('sin sesiones de antes no hay con qué comparar: solo lo de la sesión', () => {
    expect(fue([[100, 5], [100, 5], [100, 5]], false, ANTES.slice(0, 2))).toMatchObject({ nota: 'comoSiempre', rendimiento: [] });
  });

  it('una sesión copiada con «Registrar el día» no se juzga, y tampoco sirve de referencia', () => {
    const copiada = { ...sentadilla([[100, 5], [100, 5], [100, 5]]), copiada: true };
    expect(comoFueLaSesion({ sesion: { bloques: [copiada] }, antes: ANTES, nocheCorta: false })).toBeNull();
    const conCopiadas = [1, 2, 3].map((k) => ({ fecha: sumarDias('2026-11-25', -k), bloques: [{ ...sentadilla([[120, 5]]), copiada: true }] }));
    expect(fue([[100, 5], [100, 5], [100, 5]], false, [...conCopiadas, ...ANTES.slice(0, 2)])).toMatchObject({ nota: 'comoSiempre', rendimiento: [] });
  });

  it('sin series, nada', () => {
    expect(comoFueLaSesion({ sesion: { bloques: [] }, antes: [], nocheCorta: false })).toBeNull();
  });
});
