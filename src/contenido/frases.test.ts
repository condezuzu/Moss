import { describe, expect, it } from '@jest/globals';

import { sumarDias } from '@/dominio/fechas';
import { FRASES, fraseDelDia } from './frases';

describe('las frases del día', () => {
  it('cada día tiene la suya, y ninguna vuelve hasta que pasaron todas', () => {
    const vistas = new Set(Array.from({ length: FRASES.length }, (_, i) => fraseDelDia(sumarDias('2026-11-18', i))));
    expect(vistas.size).toBe(FRASES.length);
    expect(fraseDelDia('2026-11-18')).toBe(fraseDelDia('2026-11-18'));
    expect(fraseDelDia('2025-03-02')).toBeDefined();
  });

  it('todas en es y en, cortas (sobre el musgo entran en tres líneas) y sin repetirse', () => {
    for (const f of FRASES) for (const texto of [f.texto.es, f.texto.en, f.autor.es, f.autor.en]) expect(texto.trim().length).toBeGreaterThan(0);
    expect(Math.max(...FRASES.flatMap((f) => [f.texto.es.length, f.texto.en.length]))).toBeLessThanOrEqual(100);
    expect(new Set(FRASES.map((f) => f.texto.es)).size).toBe(FRASES.length);
  });

  it('dos días seguidos no son del mismo autor, salvo las propias', () => {
    const autores = FRASES.map((f) => f.autor.es.split(' · ')[0]);
    autores.forEach((a, i) => {
      if (a !== 'Moss') expect(autores[(i + 1) % autores.length]).not.toBe(a);
    });
  });
});
