// Restar un vaso: el último de hoy por su hora, nada sin agua hoy, y «Deshacer» lo vuelve a poner igual.
// El almacén va de mentira.

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { TomaDeAgua } from '@/dominio/registros';
import { quitarUltimoVaso, ultimaToma } from './agua';

type Donde = { dia?: string; momento?: string };

let mockAgua: TomaDeAgua[] = [];
const mockQuitar = jest.fn((id: string) => mockAgua.find((x) => x.id === id && !x.borrado));
const mockSumar = jest.fn((_ml?: number, _donde?: Donde) => {});

jest.mock('@/almacen', () => ({
  elAlmacen: () => ({
    estado: () => ({ hoy: '2026-11-09', agua: new Map(mockAgua.map((x) => [x.id, x])) }),
    quitarAgua: (id: string) => mockQuitar(id),
    sumarAgua: (ml?: number, donde?: Donde) => mockSumar(ml, donde),
  }),
}));
jest.mock('expo-haptics', () => ({ impactAsync: async () => {}, ImpactFeedbackStyle: { Medium: 'medium' } }));
jest.mock('@/textos', () => ({ t: (clave: string) => clave }));

const toma = (id: string, dia: string, hora: string, extra: Partial<TomaDeAgua> = {}): TomaDeAgua => ({
  id, dia, ml: 250, momento: `${dia}T${hora}:00.000Z`, actualizado: `${dia}T${hora}:00.000Z`, ...extra,
});

describe('el último vaso de hoy', () => {
  it('es el de la hora más tardía de ese día, sin los borrados ni los de otro día', () => {
    const tomas = [
      toma('a', '2026-11-09', '09:00'),
      toma('b', '2026-11-09', '15:30'),
      toma('c', '2026-11-09', '18:00', { borrado: true }),
      toma('d', '2026-11-10', '08:00'),
      toma('e', '2026-11-08', '23:00'),
    ];
    expect(ultimaToma(tomas, '2026-11-09')?.id).toBe('b');
  });

  it('sin agua ese día no hay ninguno', () => {
    expect(ultimaToma([toma('a', '2026-11-08', '10:00')], '2026-11-09')).toBeUndefined();
  });
});

describe('quitar el último vaso', () => {
  beforeEach(() => {
    mockQuitar.mockClear();
    mockSumar.mockClear();
  });

  it('sin agua hoy no hace nada ni avisa', () => {
    mockAgua = [toma('a', '2026-11-08', '10:00')];
    const avisar = jest.fn();
    expect(quitarUltimoVaso(avisar)).toBe(false);
    expect(mockQuitar).not.toHaveBeenCalled();
    expect(avisar).not.toHaveBeenCalled();
  });

  it('quita el último de hoy y «Deshacer» lo vuelve a sumar igual: la misma cantidad, el mismo día y la misma hora', () => {
    mockAgua = [toma('a', '2026-11-09', '09:00'), toma('b', '2026-11-09', '16:45', { ml: 330 })];
    const avisar = jest.fn((_texto: string, _deshacer: () => void) => {});
    expect(quitarUltimoVaso(avisar)).toBe(true);
    expect(mockQuitar).toHaveBeenCalledWith('b');
    expect(avisar).toHaveBeenCalledTimes(1);
    const [texto, deshacer] = avisar.mock.calls[0];
    expect(texto).toBe('mas.vasoQuitado');
    expect(mockSumar).not.toHaveBeenCalled();
    deshacer();
    expect(mockSumar).toHaveBeenCalledWith(330, { dia: '2026-11-09', momento: '2026-11-09T16:45:00.000Z' });
  });
});
