// El titular de hoy y Tus músculos dicen lo mismo: la fatiga en días de puntajeMuscular.ts, la de Ascent. Antes el
// titular usaba residual() (musculos.ts), refutada en spec/estudio/musculos-recuperacion.md, y se contradecían: con
// 8 series de sentadilla a 2 de la reserva ayer, el titular decía «sigue cansado» y la sección, listo.

import { describe, expect, it, jest } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import type { DeAscent } from '@/almacen/ascent';
import type { Noche } from '@/dominio/sueno';
import type { Persona, Sueno } from '../persona';
import { calcularHoy, calcularTusMusculos } from './vista';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));

// El miércoles 25 de noviembre de 2026; la rutina tiene sentadilla los miércoles.
const HOY = '2026-11-25';
const AYER = '2026-11-24';
const rutina = { nombre: 'Piernas', dias: [{ dia: 3 as const, descanso: false, ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', musculos: ['piernas'], series: 4, reps: 8 }] }] };
// Anoche, 8 h, confirmada en Moss: la noche no pone el límite.
const noche = { clave: HOY, dormirse: 340, despertar: 820, dormido: 480, siestas: 0, moss: { origen: 'confirmada', confianza: 'alta' }, confianza: { duracion: 'alta', horario: 'alta' } } as unknown as Noche;

function hoyCon(rir: number | null) {
  const series = Array.from({ length: 8 }, () => ({ kilos: 100, reps: 8, rir }));
  const d = {
    sesiones: [{ fecha: AYER, series: 8, kilos: 6400, minutos: 60, inicio: '2026-11-24T21:00:00.000Z', ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', musculos: ['piernas'], series }] }],
    marcas: [], rutina, siente: null,
  } as unknown as DeAscent;
  const e = { hoy: HOY, entreno: null, noches: new Map() } as unknown as Estado;
  const sueno = { deEjemplo: false, noches: [noche], necesidad: 480 } as unknown as Sueno;
  const h = calcularHoy({ e, d, sueno, persona: {} as Persona, ahora: new Date(2026, 10, 25, 9, 0) });
  return { h, fatigados: calcularTusMusculos(h).fatigados };
}

describe('el titular de hoy y Tus músculos, con la misma fatiga', () => {
  it('a 2 de la reserva y con menos de 10 series, al día siguiente ya está: «listo», y no figura entre los fatigados', () => {
    const { h, fatigados } = hoyCon(2);
    expect(h.titular.que).toBe('listo');
    expect(h.f.peor).toBe('recuperado');
    expect(fatigados).toEqual([]);
  });

  it('sin la reserva anotada, 2 días: hoy le falta uno y la sesión no cambia («casi»)', () => {
    const { h, fatigados } = hoyCon(null);
    expect(h.titular.que).toBe('casi');
    expect(h.f.musculos.every((m) => m.dias === 1 && m.cuando === 'manana')).toBe(true);
    expect(fatigados.length).toBeGreaterThan(0);
    expect(fatigados.every((f) => f.dias === 1 && f.fatiga === 'recuperandose')).toBe(true);
  });

  it('al fallo en un multiarticular de piernas, 3 días: hoy «sigue cansado», y lo mismo en la sección', () => {
    const { h, fatigados } = hoyCon(0);
    expect(h.titular.que).toBe('cargado');
    expect(h.f.peor).toBe('cargado');
    const enLaSeccion = new Map(fatigados.map((f) => [f.musculo, f.dias]));
    for (const m of h.f.musculos) expect(enLaSeccion.get(m.musculo) ?? 0).toBe(m.dias);
  });
});

describe('lo copiado con «Registrar el día», en la próxima vez', () => {
  it('no cuenta como una segunda sesión en el tope: con una sola de verdad, todavía no se sabe si subir', () => {
    const series = Array.from({ length: 4 }, () => ({ kilos: 100, reps: 8, rir: null }));
    const sesion = (fecha: string, copiada: boolean) => ({ fecha, series: 4, kilos: 3200, minutos: 50, inicio: `${fecha}T21:00:00.000Z`, ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', musculos: ['piernas'], series, ...(copiada ? { copiada: true } : {}) }] });
    const d = { sesiones: [sesion('2026-11-18', false), sesion('2026-11-23', true)], marcas: [], rutina, siente: null } as unknown as DeAscent;
    const e = { hoy: HOY, entreno: null, noches: new Map() } as unknown as Estado;
    const sueno = { deEjemplo: false, noches: [noche], necesidad: 480 } as unknown as Sueno;
    const h = calcularHoy({ e, d, sueno, persona: {} as Persona, ahora: new Date(2026, 10, 25, 9, 0) });
    const sentadilla = calcularTusMusculos(h).ejercicios.find((x) => x.e.id === 'sentadilla');
    expect(sentadilla?.proxima).toEqual({ decision: 'noSeSabe', razon: 'pocasSesiones' });
    // La copiada sí cuenta para la fatiga: el lunes, sin reserva anotada, 2 días; el miércoles ya está.
    expect(h.f.peor).toBe('recuperado');
  });
});
