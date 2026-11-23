import { describe, expect, it } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import { deportesDe, partesRedondas } from '@/dominio/cuestionario';
import { conObjetivo, DE_FABRICA, desdeLoGuardado, despuesDe, lugarDe, metaDeAhora, movimientoUsado, objetivoPosible, paraGuardar, preguntasDe, sinDeficit, type Contestado } from './respuestas';

const HOY = '2026-11-16';
const el: Contestado = { ...DE_FABRICA, sexo: 'm' };

describe('las preguntas que aparecen', () => {
  it('sin Salud, tus datos de a uno; con Salud, en una tarjeta; lo del peso meta, solo al bajar o subir', () => {
    expect(preguntasDe(el)).toEqual(['salud', 'sexo', 'edad', 'altura', 'peso', 'cuidado', 'grasa', 'movimiento', 'entreno', 'cuando', 'objetivo', 'comer', 'dia']);
    const bajar = conObjetivo({ ...el, salud: true }, 'bajar');
    expect(preguntasDe(bajar)).toEqual(['salud', 'tu', 'cuidado', 'grasa', 'movimiento', 'entreno', 'cuando', 'objetivo', 'meta', 'despues', 'comer', 'dia']);
    expect(lugarDe('meta', bajar)).toEqual({ i: 8, total: 12 });
  });

  it('con un cuidado no se pregunta la grasa; sin entrenar, tampoco cuándo; subiendo con pesas, la experiencia', () => {
    expect(preguntasDe({ ...el, cuidados: ['reflujo'] })).not.toContain('grasa');
    expect(preguntasDe({ ...el, entreno: { ...el.entreno, tipos: [] } })).not.toContain('cuando');
    expect(preguntasDe(conObjetivo(el, 'subir'))).toContain('experiencia');
  });
});

describe('los pasos de Salud sugieren cuánto te mueves', () => {
  const conPasos: Contestado = { ...el, salud: true, pasosDeSalud: 12500, movimientoSugerido: 'fisico', movimiento: 'fisico' };

  it('la sugerencia vale mientras no se cambie, corregida con lo que entrenas', () => {
    expect(movimientoUsado(conPasos, null)).toBe('fisico');
    // Con correr o partidos, esos pasos ya están en el entrenamiento: no pasa de «de pie».
    const corre: Contestado = { ...conPasos, entreno: { ...conPasos.entreno, tipos: ['resistencia'] } };
    expect(movimientoUsado(corre, null)).toBe('dePie');
    expect(metaDeAhora(corre, HOY).metas.kcal).toBeLessThan(metaDeAhora({ ...corre, movimientoSugerido: null }, HOY).metas.kcal);
    // Si se elige otra cosa, vale lo elegido.
    expect(movimientoUsado({ ...corre, movimiento: 'sentado' }, null)).toBe('sentado');
  });
});

describe('lo que sale', () => {
  it('el ejemplo de la galería: 2.400 kcal de gasto, 130 de entrenar', () => {
    const m = metaDeAhora(el, HOY);
    expect(partesRedondas(m.gasto)).toMatchObject({ total: 2400, entreno: 130 });
  });

  it('con un cuidado que no deja bajar, bajar vuelve a mantener y la meta no tiene déficit', () => {
    const r = conObjetivo({ ...el, cuidados: ['renal'] }, 'bajar');
    expect(sinDeficit(r, HOY)).toBe(true);
    expect(objetivoPosible(r, HOY).objetivo).toBe('mantener');
    const { c, nuevo } = paraGuardar(r, HOY, []);
    expect(c).toMatchObject({ objetivo: 'mantener', sinDeficit: true });
    expect(nuevo.cuidados).toEqual({ marcados: ['renal'], datos: { renal: { dialisis: false } } });
  });

  it('con diálisis, las metas van a mano: no hay meta calculada', () => {
    const r: Contestado = { ...el, cuidados: ['renal'], datosCuidado: { ...el.datosCuidado, dialisis: true } };
    expect(paraGuardar(r, HOY, []).nuevo.meta).toBeNull();
  });
});

describe('lo que se guarda, y contestarlo otra vez', () => {
  it('lo guardado vuelve a dar lo mismo en «Tus respuestas»', () => {
    const r: Contestado = {
      ...conObjetivo(el, 'bajar'), pesoMeta: 70, proteina: 'alta', estilo: 'bajaEnGrasas', dieta: 'vegana', movimiento: 'dePie',
      entreno: { ...el.entreno, tipos: ['fuerza', 'equipo'], partidos: true, diaDePartido: 6, horaDePartido: 960 }, noSuele: { merienda: true },
      sueno: { despertar: 420, acostarse: 1410, finDeSemana: 'tarde' },
    };
    const { c, nuevo } = paraGuardar(r, HOY, []);
    expect(deportesDe(nuevo.entreno)?.tipos).toEqual(['fuerza', 'equipo']);
    const e = {
      hoy: HOY,
      perfil: { sexo: c.sexo, nacimiento: 2026 - c.edad, alturaCm: c.alturaCm, actividad: c.actividad, objetivo: c.objetivo, ritmo: c.ritmo, estilo: 'bajaEnGrasas', pesoMeta: 70, comer: { dieta: 'vegana' }, actualizado: '' },
      pesos: [{ fecha: HOY, kg: c.pesoKg, origen: 'manual', momento: '' }],
      respuestas: nuevo.respuestas, cuidados: nuevo.cuidados, entreno: nuevo.entreno,
    } as unknown as Estado;
    const otra = desdeLoGuardado(e);
    expect(otra).toMatchObject({
      objetivo: 'bajar', pesoMeta: 70, proteina: 'alta', estilo: 'bajaEnGrasas', dieta: 'vegana', movimiento: 'dePie', noSuele: { merienda: true },
      sueno: r.sueno, entreno: { tipos: ['fuerza', 'equipo'], partidos: true, diaDePartido: 6, horaDePartido: 960 },
    });
    expect(metaDeAhora(otra, HOY).metas).toEqual(metaDeAhora(r, HOY).metas);
  });

  it('la grasa de la figura vuelve: cambiar solo la hora de despertar no cambia la meta', () => {
    // La séptima figura de hombre es de 30 a 34 %: 32 %.
    const r: Contestado = { ...el, pesoKg: 90, grasaModo: 'imagen', figura: 6 };
    const { c, nuevo } = paraGuardar(r, HOY, []);
    expect(nuevo.respuestas.grasa).toEqual({ como: 'imagen', pct: 32 });
    const e = {
      hoy: HOY,
      perfil: { sexo: c.sexo, nacimiento: 2026 - c.edad, alturaCm: c.alturaCm, actividad: c.actividad, objetivo: c.objetivo, ritmo: c.ritmo, actualizado: '' },
      pesos: [{ fecha: HOY, kg: 90, origen: 'manual', momento: '' }],
      respuestas: nuevo.respuestas, cuidados: nuevo.cuidados, entreno: nuevo.entreno,
    } as unknown as Estado;
    const otra = desdeLoGuardado(e);
    const otraVez = paraGuardar({ ...otra, sueno: { ...otra.sueno, despertar: otra.sueno.despertar + 30 } }, HOY, []);
    expect(otraVez.nuevo.respuestas.grasa?.pct).toBe(32);
    expect(otraVez.nuevo.meta).toEqual(nuevo.meta);
  });
});

describe('cuando llegues, ¿qué sigue?', () => {
  it('lo elegido se guarda y vuelve; si ya no se puede (o es de otra versión), mantener', () => {
    const r: Contestado = { ...conObjetivo(el, 'bajar'), pesoMeta: 70, despues: 'recomponer' };
    const { c, nuevo } = paraGuardar(r, HOY, []);
    expect(nuevo.respuestas.despues).toBe('recomponer');
    const e = { hoy: HOY, perfil: { sexo: c.sexo, nacimiento: 2026 - c.edad, alturaCm: c.alturaCm, actividad: c.actividad, objetivo: c.objetivo, ritmo: c.ritmo, pesoMeta: 70, actualizado: '' }, pesos: [], respuestas: nuevo.respuestas } as unknown as Estado;
    expect(desdeLoGuardado(e).despues).toBe('recomponer');
    // Sin déficit, recomponer ya no se puede.
    expect(despuesDe({ ...r, objetivo: 'subir', cuidados: ['renal'] }, HOY)).toBe('mantener');
    expect(despuesDe({ ...r, despues: 'volar' as Contestado['despues'] }, HOY)).toBe('mantener');
  });
});
