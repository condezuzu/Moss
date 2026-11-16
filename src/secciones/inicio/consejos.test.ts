// «Para hoy» con lo guardado: qué comidas faltan anotar (desde una hora después de la de siempre), cuál es la
// próxima, el agua solo si se anota, y lo de Perfil › Entrenamiento para las reglas del deporte.

import { describe, expect, it, jest } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import type { Registro } from '@/dominio/registros';
import { entradaDeParaHoy, entrenoDicho } from './consejos';

jest.mock('@/almacen', () => ({ elAlmacen: () => ({ estado: () => ({ corte: 240 }) }) }));
jest.mock('@/almacen/ascent', () => ({ metaConAscent: (m: unknown) => m, estadoConAscent: () => null, suscribirConAscent: () => () => {} }));
jest.mock('@/textos', () => ({ t: (clave: string) => clave, idioma: () => 'es', lista: () => [] }));

const HOY = '2026-11-16';
const registro = (id: string, comida: Registro['comida'], hora: string, kcal: number): Registro => ({
  id, dia: HOY, comida, momento: new Date(`${HOY}T${hora}:00`).toISOString(), planificado: false, actualizado: '', fuente: 'base', ref: null, nombre: id,
  cantidad: { gramos: 100 } as Registro['cantidad'], valores: { kcal, proteina: 20, carbohidratos: 50, grasas: 10 } as Registro['valores'],
});

function estado(registros: Registro[], extra: Partial<Estado> = {}): Estado {
  return {
    hoy: HOY, corte: 240, avisos: {}, numeros: true, entreno: null, agua: new Map(), pesos: [{ fecha: HOY, kg: 80 }],
    perfil: { sexo: 'm', alturaCm: 178, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', nacimiento: 1990, actualizado: '' },
    metas: [{ desde: '2026-11-01', kcal: 2200, proteina: 160, carbohidratos: 220, grasas: 70, gasto: 2700, motivo: 'inicial', momento: '' }],
    registros: new Map(registros.map((r) => [r.id, r])),
    ...extra,
  } as unknown as Estado;
}

describe('la entrada de «Para hoy»', () => {
  it('el almuerzo falta desde una hora después de su hora; la próxima es la cena', () => {
    const e = estado([registro('a', 'desayuno', '08:10', 400)]);
    const aLas = (h: number) => entradaDeParaHoy(e, new Date(`${HOY}T${String(h).padStart(2, '0')}:30:00`))!;
    expect(aLas(13).sinAnotar).toEqual([]);
    expect(aLas(14).sinAnotar).toEqual(['almuerzo']);
    expect(aLas(14).proxima).toBe('cena');
    expect(aLas(14).anotadas).toBe(1);
  });

  it('el agua cuenta solo si se anotó en la última semana', () => {
    const sin = entradaDeParaHoy(estado([]), new Date(`${HOY}T16:00:00`))!;
    expect(sin.agua).toBeNull();
    const toma = { id: 'v', dia: HOY, ml: 250, momento: '', actualizado: '' };
    const con = entradaDeParaHoy(estado([], { agua: new Map([['v', toma]]) } as Partial<Estado>), new Date(`${HOY}T16:00:00`))!;
    expect(con.agua).toEqual({ ml: 250, meta: 2000 });
  });
});

describe('lo de Perfil › Entrenamiento para el deporte', () => {
  it('pesas o correr son un deporte; mixta no dice cuál y no cuenta', () => {
    expect(entrenoDicho({ dias: [1, 3], hora: 1080, minutos: 75, tipo: 'resistencia' })).toEqual({
      tipos: ['resistencia'], sesiones: [{ tipo: 'resistencia', dias: [1, 3], hora: 1080, minutos: 75 }], partidos: null,
    });
    expect(entrenoDicho({ dias: [1, 3], hora: 1080, minutos: 75, tipo: 'mixta' })).toBeNull();
    expect(entrenoDicho(null)).toBeNull();
  });
});
