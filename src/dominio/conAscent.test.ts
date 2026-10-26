import { describe, expect, it } from '@jest/globals';

import {
  cargaAntesDe, entrenoEl, estancamiento, gruposDeLaSesion, metaDelDiaConAscent, pesoUnico, semanaDesde, semanasParaComparar, sesionesConBloques, tuAnio,
  type MarcaDeAscent, type SesionDeAscent,
} from './conAscent';
import type { Peso } from './control';
import { sumarDias } from './fechas';
import type { Macros } from './metas';

const LUNES = '2026-10-19';
const META: Macros = { kcal: 2590, proteina: 150, carbohidratos: 322, grasas: 78 };
const sesion = (fecha: string, series = 16, kilos = 1000, minutos = 55, ejercicios: SesionDeAscent['ejercicios'] = []): SesionDeAscent => ({ fecha, series, kilos, minutos, ejercicios });
const marca = (ejercicio: string, fecha: string, kilos: number, reps = 5): MarcaDeAscent => ({ ejercicio, fecha, kilos, reps });

describe('la meta del día con Ascent', () => {
  // Entrena lunes, miércoles y viernes desde hace un mes.
  const historia = Array.from({ length: 28 }, (_, i) => sumarDias(LUNES, -28 + i)).filter((_, i) => i % 7 === 0 || i % 7 === 2 || i % 7 === 4).map((f) => sesion(f));
  const semana = (hoy: number, sesiones: SesionDeAscent[]) =>
    metaDelDiaConAscent({ meta: META, inicio: LUNES, dia: sumarDias(LUNES, hoy), hoy: sumarDias(LUNES, hoy), sesiones, pesoKg: 80, sexo: 'm' })!;

  it('la semana suma lo del control y el día de gimnasio sube la proteína, que sale de los carbohidratos', () => {
    const r = semana(2, [...historia, sesion(LUNES), sesion(sumarDias(LUNES, 2), 24, 1500)]);
    expect(r.total).toBe(7 * META.kcal);
    expect(r.dia.entrena).toBe(true);
    expect(r.extra).toBeGreaterThan(0);
    expect(r.meta.proteina).toBe(r.dia.meta.proteina + r.extra);
    expect(r.meta.kcal).toBe(r.dia.meta.kcal);
    expect(r.gimnasio).toBeGreaterThan(r.descanso);
  });

  it('un día anotado sin cronómetro cuenta como de gimnasio, con una sesión de las de siempre', () => {
    const r = semana(2, [...historia, sesion(sumarDias(LUNES, 2), 0, 0, 0)]);
    expect(r.dia.entrena).toBe(true);
    expect(r.tamano).toBe(1);
  });

  it('un día fuera de la semana del control no tiene meta con Ascent', () => {
    expect(metaDelDiaConAscent({ meta: META, inicio: LUNES, dia: sumarDias(LUNES, 7), hoy: LUNES, sesiones: historia, pesoKg: 80, sexo: 'm' })).toBeNull();
  });
});

describe('la carga para la recuperación', () => {
  it('suma los kilos de los tres días anteriores y cuenta los seguidos desde ayer', () => {
    const hoy = '2026-10-26';
    const c = cargaAntesDe([sesion('2026-10-25', 10, 900), sesion('2026-10-24', 10, 800), sesion('2026-10-22', 10, 700)], hoy);
    expect(c.kilos3).toBe(1700);
    expect(c.seguidos).toBe(2);
  });
});

describe('por qué no subes', () => {
  const hoy = '2026-10-26';
  const banca = [marca('Press banca', '2026-08-31', 70), marca('Press banca', '2026-09-14', 75), marca('Press banca', '2026-09-28', 80), marca('Press banca', '2026-10-12', 77.5), marca('Press banca', '2026-10-24', 80)];

  it('la marca quieta: la mejor tiene 3 semanas o más y se siguió intentando', () => {
    const e = estancamiento(banca, hoy);
    expect(e).toMatchObject({ ejercicio: 'Press banca', semanas: 4, mejor: { fecha: '2026-09-28' } });
  });

  it('con menos de 3 marcas, o si se dejó de anotar, no está estancado', () => {
    expect(estancamiento(banca.slice(0, 2), hoy)).toBeNull();
    expect(estancamiento(banca.slice(0, 3), '2026-11-30')).toBeNull();
  });

  it('las semanas: las que subía antes de la mejor y las del estancamiento hasta esta', () => {
    const e = estancamiento(banca, hoy)!;
    const s = semanasParaComparar([...banca, marca('Sentadilla', '2026-09-02', 100), marca('Sentadilla', '2026-09-09', 105)], e, hoy, '2026-08-01');
    expect(s.con).toEqual(['2026-09-07', '2026-09-14', '2026-09-28']);
    expect(s.sin).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  });

  it('lo de Moss de una semana sale de lo dormido y lo comido de esos días', () => {
    const noches = new Map([['2026-10-19', 420], ['2026-10-20', 480], ['2026-10-30', 300]]);
    const comidas = new Map([['2026-10-19', { kcal: 2000, proteina: 120 }]]);
    expect(semanaDesde('2026-10-19', noches, comidas, 2500)).toMatchObject({ sueno: 450, proteina: 120, balance: -500, nochesConSueno: 2, diasConComida: 1 });
  });
});

describe('lo demás', () => {
  it('el peso único: el de Moss gana el mismo día y los de Ascent llenan los otros', () => {
    const propios: Peso[] = [{ fecha: '2026-10-20', kg: 80, origen: 'manual', momento: '2026-10-20T10:00:00.000Z' }];
    const r = pesoUnico(propios, [{ fecha: '2026-10-20', kg: 81, de: 'ascent' }, { fecha: '2026-10-21', kg: 79.6, de: 'ascent' }, { fecha: '2026-10-22', kg: 79, de: 'moss' }]);
    expect(r.map((p) => [p.fecha, p.kg, p.origen])).toEqual([['2026-10-20', 80, 'manual'], ['2026-10-21', 79.6, 'ascent']]);
  });

  it('el gimnasio de hoy, el nombre de la sesión y las series de cada ejercicio', () => {
    const s = sesion('2026-10-26', 7, 1000, 50, [
      { nombre: 'Sentadilla', musculos: ['piernas'], series: [{ kilos: 100, reps: 5 }, { kilos: 100, reps: 5 }, { kilos: 100, reps: 5 }] },
      { nombre: 'Press militar', musculos: [], series: [{ kilos: 40, reps: 8 }, { kilos: null, reps: 8 }] },
    ]);
    expect(entrenoEl([s], '2026-10-26')).toBe(true);
    expect(gruposDeLaSesion(s)).toEqual(['piernas', 'hombros']);
    const [b] = sesionesConBloques([s], () => 0);
    expect(b.bloques[1].series[1]).toEqual({ peso: 0, reps: 8 });
  });

  it('tu año cuenta solo lo de ese año', () => {
    const r = tuAnio({
      anio: 2026,
      sesiones: [sesion('2025-12-30'), sesion('2026-01-05'), sesion('2026-01-05')],
      marcas: [marca('Sentadilla', '2025-12-01', 100), marca('Sentadilla', '2026-03-01', 105), marca('Sentadilla', '2026-03-01', 105)],
      dias: [{ clave: '2026-02-01', hechos: ['leer'] }, { clave: '2026-02-02', hechos: [] }],
      noches: new Map([['2026-02-01', 420], ['2026-02-02', 480], ['2025-12-31', 200]]),
      diasConComida: ['2026-02-01', '2025-12-31'],
    });
    expect(r).toEqual({ entrenamientos: 1, marcas: 1, diasConHabitos: 1, sueno: 450, diasConComida: 1 });
  });
});
