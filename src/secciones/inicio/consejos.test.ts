// «Para hoy» con lo guardado: qué comidas faltan anotar (desde una hora después de la de siempre), cuál es la
// próxima, el agua solo si se anota, y lo de Perfil › Entrenamiento para las reglas del deporte.

import { describe, expect, it, jest } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import { horarioDeLosAvisos, type EntrenoDicho } from '@/dominio/cuestionario';
import type { Registro } from '@/dominio/registros';
import { consejosDeHoy, entradaDeParaHoy, entrenoDicho } from './consejos';

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

  it('con cuidados de salud marcados, cada consejo según lo que apagan, y el agua con su meta', () => {
    const toma = { id: 'v', dia: HOY, ml: 250, momento: '', actualizado: '' };
    // Poca proteína para lo comido: sin cuidados, «Para hoy» lo dice.
    const dia = [registro('a', 'desayuno', '08:10', 400), registro('b', 'almuerzo', '13:00', 500), registro('c', 'snack', '16:00', 300)];
    const con = (marcados: string[]) => estado(dia, { agua: new Map([['v', toma]]), cuidados: { marcados, datos: {} } } as unknown as Partial<Estado>);
    const aLas18 = (e: Estado) => ({ agua: entradaDeParaHoy(e, new Date(`${HOY}T18:00:00`))!.agua, lista: consejosDeHoy(e, new Date(`${HOY}T18:00:00`))!.lista.map((c) => c.tipo) });
    expect(aLas18(con([]))).toEqual({ agua: { ml: 250, meta: 2000 }, lista: ['pocaProteina', 'agua'] });
    // Con cálculos, 2,5 L y nada de pedir proteína; con el riñón, tampoco el agua.
    expect(aLas18(con(['calculos']))).toEqual({ agua: { ml: 250, meta: 2500 }, lista: ['agua'] });
    expect(aLas18(con(['renal']))).toEqual({ agua: null, lista: [] });
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

  // El lunes 16: ayer, domingo, jugó a las 17 (termina a las 18:30) y pesa 80 kg.
  const AYER = '2026-11-15';
  const futbol: Pick<EntrenoDicho, 'tipos' | 'sesiones' | 'partidos'> = { tipos: ['equipo'], sesiones: [{ tipo: 'equipo', dias: [2, 4, 0], hora: 17 * 60, minutos: 90 }], partidos: { dia: 0, hora: 17 * 60 } };
  const copa = (id: string, hora: string, gramos: number): Registro => {
    const r = registro(id, 'cena', '20:00', 300);
    return { ...r, dia: AYER, momento: new Date(`${AYER}T${hora}:00`).toISOString(), valores: { ...r.valores, alcohol: gramos } };
  };
  const delDeporte = (e: Estado) => entradaDeParaHoy(e, new Date(`${HOY}T11:00:00`))!.deporte!.map((c) => c.que);

  it('el alcohol después de jugar: un gramo por kilo o más en las 12 h que siguen al partido de ayer', () => {
    const conFutbol = (registros: Registro[], extra: Partial<Estado> = {}) => estado(registros, { entreno: { ...horarioDeLosAvisos(futbol)!, ...futbol }, ...extra } as Partial<Estado>);
    expect(delDeporte(conFutbol([copa('a', '20:00', 45), copa('b', '21:30', 45)]))).toContain('alcohol');
    // Menos de un gramo por kilo, o tomado antes de jugar: nada.
    expect(delDeporte(conFutbol([copa('a', '20:00', 45)]))).not.toContain('alcohol');
    expect(delDeporte(conFutbol([copa('a', '13:00', 45), copa('b', '14:00', 45)]))).not.toContain('alcohol');
    // Es de comer: con «sin déficit» no se dice.
    const sinDeficit = { ...estado([]).perfil!, sinDeficit: true };
    expect(delDeporte(conFutbol([copa('a', '20:00', 45), copa('b', '21:30', 45)], { perfil: sinDeficit }))).not.toContain('alcohol');
  });

  it('la próxima carrera de Perfil › Entrenamiento llega a la regla: dos días antes de una larga', () => {
    const correr = { dias: [2, 4], hora: 7 * 60, minutos: 50, tipo: 'resistencia' as const };
    const con = (carrera: { fecha: string; minutos: number }) => estado([], { entreno: { ...correr, carrera } } as Partial<Estado>);
    expect(delDeporte(con({ fecha: '2026-11-18', minutos: 120 }))).toContain('carrera');
    expect(delDeporte(con({ fecha: '2026-11-18', minutos: 60 }))).not.toContain('carrera');
  });
});
