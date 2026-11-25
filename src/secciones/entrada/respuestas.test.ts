import { describe, expect, it } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import { deportesDe, NIVELES_DE_PROTEINA, partesRedondas } from '@/dominio/cuestionario';
import { sumarDias } from '@/dominio/fechas';
import { KCAL_POR_KG } from '@/dominio/metas';
import {
  conElPartido, conObjetivo, conSalud, DE_FABRICA, desdeLoGuardado, despuesDe, llegadaDe, lugarDe, metaDeAhora, movimientoUsado, objetivoPosible, paraGuardar, pctDe,
  plazoElegido, preguntasDe, proteinaDe, sinDeficit, type Contestado,
} from './respuestas';

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

  it('si Salud no trae los cuatro datos (sin altura ni peso, o sin permiso), se preguntan de a uno con lo que trajo', () => {
    const todo = conSalud(el, { edad: 40, sexo: 'f', alturaCm: 165, pesoKg: 60 }, null);
    expect(preguntasDe(todo).slice(0, 3)).toEqual(['salud', 'tu', 'cuidado']);
    const sinPeso = conSalud(el, { edad: 40, sexo: 'f' }, 9000);
    expect(sinPeso).toMatchObject({ salud: true, edad: 40, sexo: 'f', pasosDeSalud: 9000 });
    expect(preguntasDe(sinPeso).slice(0, 6)).toEqual(['salud', 'sexo', 'edad', 'altura', 'peso', 'cuidado']);
    expect(preguntasDe(conSalud(el, {}, null))).not.toContain('tu');
  });

  it('con un trastorno de la alimentación no hay peso meta ni plan (D9): ni se pregunta ni se guarda', () => {
    const r: Contestado = { ...conObjetivo({ ...el, cuidados: ['tca'], consentido: true }, 'subir'), fecha: '2027-03-01' };
    expect(preguntasDe(r)).not.toContain('meta');
    expect(preguntasDe(r)).not.toContain('despues');
    const { nuevo } = paraGuardar(r, HOY, []);
    expect(nuevo.perfil?.pesoMeta).toBeUndefined();
    expect(nuevo.respuestas).toMatchObject({ fecha: null, despues: null });
    expect(nuevo.respuestas.eleccion.pct).toBeNull();
  });
});

describe('la fecha del plan es la de la meta', () => {
  // El ritmo que usa la meta: lo que se come de menos, en % del peso por semana.
  const pctDeLaMeta = (r: Contestado) => {
    const m = metaDeAhora(r, HOY);
    return (((m.gasto.total - m.metas.kcal) * 7) / KCAL_POR_KG / r.pesoKg) * 100;
  };

  it('con diabetes 1, «Rápido» y una fecha cerca van al ritmo suave, como la meta', () => {
    const r: Contestado = { ...conObjetivo({ ...el, pesoKg: 80, cuidados: ['diabetes1'], consentido: true }, 'bajar'), ritmo: 'rapido' };
    expect(pctDe(r, 'rapido', HOY)).toBe(0.25);
    expect(plazoElegido(r, HOY)!.pct).toBeCloseTo(pctDeLaMeta(r), 1);
    const conFecha: Contestado = { ...r, fecha: sumarDias(HOY, 28) };
    expect(plazoElegido(conFecha, HOY)!.pct).toBeCloseTo(0.25, 5);
    expect(pctDeLaMeta(conFecha)).toBeCloseTo(0.25, 1);
  });

  it('con mucho peso, «Rápido» no pasa de 1.000 kcal por día, como la meta', () => {
    const r: Contestado = { ...conObjetivo({ ...el, pesoKg: 150, alturaCm: 180 }, 'bajar'), ritmo: 'rapido' };
    expect(pctDe(r, 'rapido', HOY)).toBeCloseTo(pctDeLaMeta(r), 1);
    expect(pctDe(r, 'rapido', HOY)).toBeLessThan(0.75);
  });

  it('con el piso de kcal (el de siempre o el de lo marcado), se llega cuando llega lo que se come de verdad', () => {
    const casos: Contestado[] = [
      { ...conObjetivo({ ...el, sexo: 'f', edad: 75, alturaCm: 152, pesoKg: 52, entreno: { ...el.entreno, tipos: [] } }, 'bajar'), ritmo: 'recomendado' },
      // Con GLP-1, un hombre no baja de 1.800.
      { ...conObjetivo({ ...el, cuidados: ['glp1'], consentido: true }, 'bajar'), ritmo: 'rapido' },
    ];
    for (const r of casos) {
      const plazo = plazoElegido(r, HOY)!;
      expect(plazo.avisos).toContain('piso');
      const m = metaDeAhora(r, HOY);
      const kgPorSemana = ((m.gasto.total - m.metas.kcal) * 7) / KCAL_POR_KG;
      const dias = Math.ceil(((r.pesoKg - r.pesoMeta!) / kgPorSemana) * 7);
      expect(Math.abs(dias - (Date.parse(llegadaDe(plazo)!) - Date.parse(HOY)) / 864e5)).toBeLessThanOrEqual(1);
      expect(llegadaDe(plazo)! > plazo.fecha).toBe(true);
    }
  });
});

describe('cómo quieres comer', () => {
  it('con el riñón, los gramos de cada nivel son los de la meta: 0,8 g por kilo', () => {
    const r: Contestado = { ...el, pesoKg: 80, cuidados: ['renal'], consentido: true };
    for (const n of NIVELES_DE_PROTEINA) expect(proteinaDe(r, HOY, n)).toBe(64);
    expect(metaDeAhora(r, HOY).metas.proteina).toBe(64);
  });
});

describe('el día del partido', () => {
  it('cambiarlo o apagar los partidos saca el día que había sumado; uno que ya era de entrenar queda', () => {
    let r: Contestado = conElPartido({ ...el, entreno: { ...el.entreno, tipos: ['equipo'], partidos: true, diaDePartido: 6 } });
    expect(r.entreno.de.equipo.dias).toEqual([2, 4, 6]);
    r = conElPartido({ ...r, entreno: { ...r.entreno, diaDePartido: 0 } });
    expect(r.entreno.de.equipo.dias).toEqual([2, 4, 0]);
    r = conElPartido({ ...r, entreno: { ...r.entreno, partidos: false } });
    expect(r.entreno.de.equipo.dias).toEqual([2, 4]);
    let propio = conElPartido({ ...r, entreno: { ...r.entreno, partidos: true, diaDePartido: 4 } });
    propio = conElPartido({ ...propio, entreno: { ...propio.entreno, diaDePartido: 6 } });
    expect(propio.entreno.de.equipo.dias).toEqual([2, 4, 6]);
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

  it('volver a tocar el mismo objetivo no borra el ritmo, el peso meta ni la fecha; otro objetivo sí', () => {
    const r: Contestado = { ...conObjetivo(el, 'bajar'), pesoMeta: 70, ritmo: 'rapido', fecha: '2027-03-01' };
    expect(conObjetivo(r, 'bajar')).toMatchObject({ ritmo: 'rapido', pesoMeta: 70, fecha: '2027-03-01' });
    expect(conObjetivo(r, 'subir')).toMatchObject({ ritmo: 'recomendado', fecha: null });
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
