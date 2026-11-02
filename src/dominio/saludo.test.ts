import { describe, expect, it } from '@jest/globals';

import en from '../textos/en.json';
import es from '../textos/es.json';
import { lineasDelDia, sesionesDelDia, type Entreno, type Principal } from './alrededorDelEntreno';
import { horasDeSueno } from './avisos';
import type { Comida } from './comidas';
import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import type { Macros } from './metas';
import {
  armar, candidatos, CODIGOS, DIAS_SIN_REPETIR, momentoDe, NO_ESPERA, noVaSinDeficit, recordar, saludoDelDia, SITUACIONES, soloConNumeros, temasDe, UN_RATO,
  type Anoche, type DelDia, type Dicho, type Formato, type Saludo, type Situacion, type Valores,
} from './saludo';

/** «7:30» en minutos desde la medianoche. */
const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};
/** Lo mismo en la cuenta de las noches, desde las 18 del día anterior: las 23:30 son 330 y las 7:30, 810. */
const n = (texto: string) => (h(texto) + 6 * 60) % (24 * 60);

type Idioma = 'es' | 'en';
const DICCIONARIOS = { es, en } as const;
const frases = (idioma: Idioma) => DICCIONARIOS[idioma].saludo.frases as unknown as Record<string, Record<string, string>>;
const plantilla = (idioma: Idioma, codigo: string) => {
  const [situacion, forma] = codigo.split('.');
  return frases(idioma)[situacion]?.[forma];
};
const hora = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const formato = (idioma: Idioma): Formato => ({
  numero: (x) => x.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US'),
  hora,
  duracion: (m) => {
    const horas = Math.floor(m / 60);
    const min = Math.round(m % 60);
    if (!horas) return DICCIONARIOS[idioma].fecha.minutos.replace('{m}', String(min));
    const f = min ? DICCIONARIOS[idioma].fecha.horasMinutos : DICCIONARIOS[idioma].fecha.horas;
    return f.replace('{h}', String(horas)).replace('{m}', String(min).padStart(2, '0'));
  },
  comida: (c) => DICCIONARIOS[idioma].saludo.comidas[c],
  dia: (d) => DICCIONARIOS[idioma].fecha.dias[d],
});
const texto = (s: Pick<Saludo, 'codigo' | 'valores'>, idioma: Idioma = 'es') => armar(plantilla(idioma, s.codigo), s.valores, formato(idioma));

const META: Macros = { kcal: 2200, proteina: 150, carbohidratos: 230, grasas: 70 };
const CERO: Macros = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
const HORAS_DE_COMIDA: Record<Principal, number> = { desayuno: h('8:00'), almuerzo: h('13:00'), merienda: h('17:00'), cena: h('21:00') };

type Registro = { comida: Comida; hora: number; kcal: number; p: number };
/** Un día con su horario: lo anotado hasta `ahora`, las líneas de entrenar y la hora de ir a la cama salen de las reglas de verdad. */
type Vida = {
  dia?: ClaveDia;
  ahora: number;
  meta?: Macros | null;
  comidas?: Registro[];
  ayer?: DelDia['ayer'];
  anoche?: Anoche | null;
  deuda?: number | null;
  /** Lo de siempre de cada noche; null, sin noches para saberlo. */
  habitual?: { dormirse: number; despertar: number } | null;
  entreno?: Entreno | null;
  /** Ascent confirma la sesión de hoy. */
  hecha?: boolean;
  numeros?: boolean;
  sinDeficit?: boolean;
  diasConDatos?: number;
  habituales?: readonly Comida[];
  cafeina?: number | null;
};
const MIERCOLES = '2026-10-21';
const TODOS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
const A_LAS_19: Entreno = { dias: TODOS, hora: h('19:00'), minutos: 60, tipo: 'fuerza' };

function delDia(v: Vida): DelDia {
  const dia = v.dia ?? MIERCOLES;
  const meta = v.meta === undefined ? META : v.meta;
  const hechas = (v.comidas ?? []).filter((c) => c.hora <= v.ahora);
  const comido = hechas.reduce<Macros>((t, c) => ({ kcal: t.kcal + c.kcal, proteina: t.proteina + c.p, carbohidratos: t.carbohidratos + c.kcal / 10, grasas: t.grasas + c.kcal / 40 }), CERO);
  const anotado: Partial<Record<Comida, { hora: number; proteina: number; kcal: number }>> = {};
  for (const c of hechas) {
    anotado[c.comida] = { hora: anotado[c.comida]?.hora ?? c.hora, proteina: (anotado[c.comida]?.proteina ?? 0) + c.p, kcal: (anotado[c.comida]?.kcal ?? 0) + c.kcal };
  }
  const habitual = v.habitual === undefined ? { dormirse: n('23:30'), despertar: n('7:15') } : v.habitual;
  const deuda = v.deuda ?? null;
  const horas = habitual === null ? null : horasDeSueno(dia, { habitual: () => habitual, necesidad: 480, deuda, latencia: 15 });
  const sinDeficit = !!v.sinDeficit;
  const entreno = v.entreno ?? null;
  const sesiones = sesionesDelDia(entreno, dia);
  return {
    dia, ahora: v.ahora, numeros: v.numeros ?? true, sinDeficit, diasConDatos: v.diasConDatos ?? 30,
    meta, comido, anotadas: [...new Set(hechas.map((c) => c.comida))], horaDeComida: HORAS_DE_COMIDA, habituales: v.habituales,
    ayer: v.ayer === undefined ? { kcal: 2050, meta: META.kcal - 300 } : v.ayer,
    anoche: v.anoche === undefined ? { dormido: h('7:20') } : v.anoche, necesidad: 480, deuda, horas,
    sesiones: sesiones.map((s) => ({ ...s, hecha: v.hecha })),
    lineas: meta ? lineasDelDia({
      ahora: v.ahora, sesiones, horaDeComida: HORAS_DE_COMIDA, anotado, meta, comido, comidasHabituales: 4, pesoKg: 75, edad: 31,
      despertar: horas?.despertar ?? null, dormir: horas?.dormir ?? null, cafeinaPorToma: v.cafeina ?? null, sinDeficit,
    }) : [],
    entrenaAlgunDia: !!entreno, sesionManana: sesionesDelDia(entreno, sumarDias(dia, 1))[0]?.inicio ?? null,
  };
}

/** El saludo de la primera vez, en un día nuevo y sin historial. */
const saludo = (v: Vida, semilla: string | number = 'moss', historial: readonly Dicho[] = []) => saludoDelDia(delDia(v), historial, semilla);
/** El saludo con varias semillas: lo que se comprueba tiene que valer para cualquiera. */
const conSemillas = (v: Vida, cuantas = 30) => Array.from({ length: cuantas }, (_, i) => saludo(v, i));
const temasDeLista = (lista: Saludo[]) => new Set(lista.flatMap((s) => [...s.temas]));

const DESAYUNO: Registro = { comida: 'desayuno', hora: h('8:10'), kcal: 450, p: 30 };
const ALMUERZO: Registro = { comida: 'almuerzo', hora: h('13:10'), kcal: 750, p: 45 };
const MERIENDA: Registro = { comida: 'merienda', hora: h('17:00'), kcal: 250, p: 15 };
const CENA: Registro = { comida: 'cena', hora: h('21:10'), kcal: 700, p: 50 };
const DIA_COMPLETO = [DESAYUNO, ALMUERZO, MERIENDA, CENA];

describe('según la hora', () => {
  it('a la mañana habla de cómo dormiste', () => {
    for (const dormido of [h('5:30'), h('8:05')]) for (const s of conSemillas({ ahora: h('7:30'), anoche: { dormido } })) expect(s.temas).toContain('sueno');
    // Una noche del montón no se impone: a veces habla de lo que viene.
    const delMonton = conSemillas({ ahora: h('7:30') }, 60);
    expect(delMonton.filter((s) => s.temas.includes('sueno')).length).toBeGreaterThan(20);
    expect(momentoDe(delDia({ ahora: h('7:30') }))).toBe('manana');
  });

  it('la mañana dura más si te despertaste tarde', () => {
    const d = delDia({ ahora: h('12:00'), habitual: { dormirse: n('2:30'), despertar: n('10:30') } });
    expect(momentoDe(d)).toBe('manana');
  });

  it('la noche empieza antes si te acuestas temprano', () => {
    const d = delDia({ ahora: h('19:00'), habitual: { dormirse: n('21:30'), despertar: n('5:30') } });
    expect(momentoDe(d)).toBe('noche');
  });

  it('al mediodía habla de lo que falta', () => {
    for (const s of conSemillas({ ahora: h('13:00'), comidas: [DESAYUNO] })) expect(s.temas).toContain('comida');
  });

  it('antes de entrenar dice qué comer, con la regla de alrededorDelEntreno', () => {
    const v = { ahora: h('16:20'), entreno: A_LAS_19, comidas: [DESAYUNO, ALMUERZO] };
    const situaciones: Situacion[] = ['previa', 'previaLiviana', 'previaCarbos'];
    for (const s of conSemillas(v)) expect(situaciones).toContain(s.situacion);
    expect(delDia(v).lineas[0].clase).toBe('previa');
  });

  it('después de entrenar habla de la proteína', () => {
    const v = { ahora: h('20:20'), entreno: A_LAS_19, comidas: [DESAYUNO, ALMUERZO, MERIENDA] };
    const situaciones: Situacion[] = ['despues', 'despuesProteina', 'pronto', 'prontoProteina'];
    for (const s of conSemillas(v)) expect(situaciones).toContain(s.situacion);
  });

  it('a la noche, lo que queda o a qué hora acostarte', () => {
    const lista = conSemillas({ ahora: h('20:30'), comidas: [DESAYUNO, ALMUERZO, MERIENDA] });
    expect(temasDeLista(lista)).toEqual(expect.objectContaining(new Set(['comida'])));
    for (const s of lista) expect(s.temas.some((t) => t === 'comida' || t === 'cama')).toBe(true);
    expect(lista.some((s) => s.temas.includes('cama') || s.situacion === 'quedaCena')).toBe(true);
  });

  it('la hora de acostarse sale de horasDeSueno: con deuda, un poco antes', () => {
    const sinDeuda = delDia({ ahora: h('21:30'), habitual: { dormirse: n('23:30'), despertar: n('7:30') } });
    const conDeuda = delDia({ ahora: h('21:30'), habitual: { dormirse: n('23:30'), despertar: n('7:30') }, deuda: 90 });
    expect(conDeuda.horas!.acostarse!).toBeLessThan(sinDeuda.horas!.acostarse!);
    const hora = (d: DelDia) => candidatos(d).find((c) => c.situacion === 'camaHoy')?.valores.hora;
    expect(hora(conDeuda)).toBe(conDeuda.horas!.acostarse);
  });

  it('lo de la madrugada es del día anterior y no habla de anoche', () => {
    const v = { ahora: h('1:10') + 24 * 60, comidas: DIA_COMPLETO };
    const d = delDia(v);
    expect(momentoDe(d)).toBe('madrugada');
    expect(candidatos(d).some((c) => temasDe(c.situacion).includes('sueno') && c.situacion !== 'camaYDeuda')).toBe(false);
    for (const s of conSemillas(v)) expect(s.temas).toContain('cama');
  });
});

describe('cada situación', () => {
  it('durmió poco y entrena hoy: cruza las dos señales', () => {
    const v = { ahora: h('7:40'), anoche: { dormido: h('5:30') }, entreno: A_LAS_19 };
    const situaciones: Situacion[] = ['pocoYEntrena', 'pocoYDesayuno'];
    for (const s of conSemillas(v)) expect(situaciones).toContain(s.situacion);
    expect(candidatos(delDia(v)).find((c) => c.situacion === 'pocoYEntrena')?.valores).toEqual({ horas: h('5:30'), hora: h('19:00') });
  });

  it('durmió bien y entrena: no dice que durmió poco', () => {
    const v = { ahora: h('7:40'), anoche: { dormido: h('8:05') }, entreno: A_LAS_19 };
    const d = candidatos(delDia(v)).map((c) => c.situacion);
    expect(d).toContain('bienYEntrena');
    expect(d).not.toContain('pocoYEntrena');
    expect(d).not.toContain('suenoPoco');
    // Con la sesión de hoy, la noche sola ya no hace falta: lo que cruza las dos señales lo dice mejor.
    expect(d).not.toContain('suenoBien');
  });

  it('ya entrenó (Ascent lo confirma) y le falta proteína', () => {
    const v = { ahora: h('20:40'), entreno: A_LAS_19, hecha: true, comidas: [DESAYUNO, ALMUERZO, MERIENDA] };
    const d = candidatos(delDia(v));
    expect(d.find((c) => c.situacion === 'hechoFaltaProteina')?.valores).toEqual({ p: 60, comida: 'cena' });
    const situaciones: Situacion[] = ['hechoFaltaProteina', 'hechoFaltaPalabras', 'despues', 'despuesProteina'];
    for (const s of conSemillas(v)) expect(situaciones).toContain(s.situacion);
  });

  it('ya entrenó y llegó a la proteína', () => {
    const d = candidatos(delDia({ ahora: h('22:00'), entreno: A_LAS_19, hecha: true, comidas: [{ ...DESAYUNO, p: 150 }] }));
    expect(d.map((c) => c.situacion)).toContain('hechoListo');
  });

  it('sin que Ascent lo confirme, nunca afirma que entrenaste', () => {
    const afirman: Situacion[] = ['hechoFaltaProteina', 'hechoFaltaPalabras', 'hechoListo'];
    for (const ahora of [h('18:00'), h('20:20'), h('22:30')]) {
      const lista = candidatos(delDia({ ahora, entreno: A_LAS_19, comidas: [DESAYUNO, ALMUERZO] })).map((c) => c.situacion);
      for (const a of afirman) expect(lista).not.toContain(a);
    }
    for (const a of afirman) for (const f of Object.keys(frases('es')[a])) expect(frases('es')[a][f]).toMatch(/entren/i);
  });

  it('si Ascent dice que ya entrenó antes de la hora de siempre, lo de antes ya no va', () => {
    const lista = candidatos(delDia({ ahora: h('12:30'), entreno: A_LAS_19, hecha: true, comidas: [DESAYUNO] })).map((c) => c.situacion);
    for (const a of ['entrenaHoy', 'previa', 'previaLiviana', 'snackPrevio', 'previaCarbos', 'bienYEntrena', 'pocoYEntrena'] as Situacion[]) expect(lista).not.toContain(a);
  });

  it('un día de descanso solo es de descanso si hay horario', () => {
    const martes: Entreno = { dias: [2], hora: h('19:00'), minutos: 60, tipo: 'fuerza' };
    const conHorario = candidatos(delDia({ ahora: h('8:00'), entreno: martes })).map((c) => c.situacion);
    expect(conHorario).toContain('descanso');
    const sinHorario = candidatos(delDia({ ahora: h('8:00') })).map((c) => c.situacion);
    expect(sinHorario).not.toContain('descanso');
    expect(sinHorario).not.toContain('descansoBien');
  });

  it('se pasó de calorías hoy: lo dice con calma, sin pedir compensar', () => {
    const d = { ahora: h('21:30'), comidas: [...DIA_COMPLETO, { comida: 'snack' as Comida, hora: h('21:20'), kcal: 650, p: 10 }] };
    const lista = conSemillas(d);
    expect(lista.some((s) => s.situacion === 'pasadoHoy')).toBe(true);
    expect(candidatos(delDia(d)).find((c) => c.situacion === 'pasadoHoy')?.valores.kcal).toBe(600);
  });

  it('se pasó ayer: es lo primero que dice a la mañana, y hoy no pide nada distinto', () => {
    const v = { ahora: h('8:30'), ayer: { kcal: 2900, meta: 2200 } };
    expect(candidatos(delDia(v)).find((c) => c.situacion === 'ayerPasado')?.valores.kcal).toBe(700);
    for (const s of conSemillas(v)) expect(s.situacion).toBe('ayerPasado');
  });

  it('llegó a la meta antes de la cena: la cena va igual', () => {
    const d = candidatos(delDia({ ahora: h('20:00'), comidas: [{ ...DESAYUNO, kcal: 1200 }, { ...ALMUERZO, kcal: 1000 }] })).map((c) => c.situacion);
    expect(d).toContain('metaAntesDeCena');
    expect(d).not.toContain('pasadoHoy');
  });

  it('calorías justas y falta proteína: las dos señales cruzadas', () => {
    const d = candidatos(delDia({ ahora: h('20:30'), comidas: [{ ...DESAYUNO, kcal: 1000, p: 25 }, { ...ALMUERZO, kcal: 1000, p: 30 }] }));
    expect(d.find((c) => c.situacion === 'ajustadoFaltaProteina')?.valores).toEqual({ p: 95, kcal: 200 });
    expect(d.map((c) => c.situacion)).toContain('ajustadoFaltaPalabras');
  });

  it('comió poco con la cena anotada: pregunta si faltó algo, sin felicitarlo', () => {
    const d = candidatos(delDia({ ahora: h('21:30'), comidas: [{ ...DESAYUNO, kcal: 300 }, { ...CENA, kcal: 300 }] })).map((c) => c.situacion);
    expect(d).toContain('comioPoco');
  });

  it('el primer día no finge conocerte', () => {
    for (const ahora of [h('7:40'), h('13:00'), h('21:00')]) {
      const v = { ahora, diasConDatos: 0, ayer: null, anoche: { dormido: h('8:00') }, entreno: A_LAS_19 };
      const lista = conSemillas(v);
      for (const s of lista) expect(s.temas).toEqual(['primero']);
    }
    const anotado = delDia({ ahora: h('8:30'), diasConDatos: 0, ayer: null, comidas: [DESAYUNO] });
    expect(candidatos(anotado).map((c) => c.situacion)).toContain('primerAnotado');
  });

  it('sin nada para decir, un saludo; con algo para decir, nunca', () => {
    const quieto: Vida = { ahora: h('10:30'), meta: null, anoche: null, ayer: null, comidas: [{ ...DESAYUNO, hora: h('8:00') }, { ...ALMUERZO, hora: h('10:00') }], habitual: null };
    expect(candidatos(delDia(quieto)).map((c) => c.situacion)).toEqual(['nadaManana']);
    expect(candidatos(delDia({ ...quieto, ahora: h('14:30'), comidas: [DESAYUNO, { ...ALMUERZO, hora: h('10:00') }, { ...MERIENDA, hora: h('11:00') }] })).map((c) => c.situacion)).toEqual(['nadaTarde']);
    expect(candidatos(delDia({ ...quieto, ahora: h('22:30'), comidas: [DESAYUNO], habituales: ['desayuno'] })).map((c) => c.situacion)).toEqual(['nadaNoche']);
    for (const s of conSemillas({ ahora: h('8:00') })) expect(s.temas).not.toContain('nada');
  });

  it('de lo que no suele anotar no pregunta', () => {
    const lista = candidatos(delDia({ ahora: h('8:30'), habituales: ['almuerzo', 'cena'] })).map((c) => c.situacion);
    expect(lista).not.toContain('sinDesayuno');
    expect(candidatos(delDia({ ahora: h('8:30') })).map((c) => c.situacion)).toContain('sinDesayuno');
  });

  it('la noche cortada (se quedó sin batería) no se nombra', () => {
    const d = candidatos(delDia({ ahora: h('7:40'), anoche: { dormido: h('2:30'), incompleta: true } }));
    expect(d.some((c) => temasDe(c.situacion).includes('sueno'))).toBe(false);
  });

  it('cómo dijo que durmió gana a la cuenta', () => {
    expect(candidatos(delDia({ ahora: h('7:40'), anoche: { dormido: h('8:00'), cara: 1 } })).map((c) => c.situacion)).toContain('caraMala');
    expect(candidatos(delDia({ ahora: h('7:40'), anoche: { dormido: h('8:00'), cara: 1 } })).map((c) => c.situacion)).not.toContain('suenoBien');
    expect(candidatos(delDia({ ahora: h('7:40'), anoche: { dormido: h('5:30'), cara: 5 } })).map((c) => c.situacion)).toContain('caraBuena');
  });

  it('pasada la hora de ir a la cama, dice cuánto dormirías sin retar', () => {
    const d = delDia({ ahora: h('0:30') + 24 * 60, comidas: DIA_COMPLETO, habitual: { dormirse: n('23:30'), despertar: n('7:30') } });
    const c = candidatos(d).find((x) => x.situacion === 'camaPasada');
    expect(c?.valores.horas).toBe(h('6:45'));
    const tarde = delDia({ ahora: h('3:30') + 24 * 60, comidas: DIA_COMPLETO, habitual: { dormirse: n('1:30'), despertar: n('6:30') } });
    expect(candidatos(tarde).map((x) => x.situacion)).toContain('camaTarde');
  });

  it('el café solo a quien lo anota, y antes de la hora de corte', () => {
    const v = { ahora: h('9:00'), entreno: A_LAS_19, comidas: [DESAYUNO] };
    expect(candidatos(delDia(v)).map((c) => c.situacion)).not.toContain('cafe');
    const conCafe = candidatos(delDia({ ...v, cafeina: 95, habitual: { dormirse: n('22:30'), despertar: n('6:30') } }));
    expect(conCafe.find((c) => c.situacion === 'cafe')?.valores.hora).toBeDefined();
  });
});

// Los días que el catálogo tiene que poder decir: muchas combinaciones, siempre las mismas.
function azarDePrueba(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function diasAlAzar(cuantos: number): Vida[] {
  const r = azarDePrueba(7);
  const uno = <T,>(...xs: T[]) => xs[Math.floor(r() * xs.length)];
  return Array.from({ length: cuantos }, () => {
    const tipo = uno<Entreno['tipo']>('fuerza', 'resistencia', 'mixta');
    const entreno = uno<Entreno | null>(null, null, { dias: TODOS, hora: uno(h('7:00'), h('12:30'), h('15:30'), h('18:00'), h('19:30')), minutos: uno(30, 60, 100), tipo }, { dias: [1, 2], hora: h('19:00'), minutos: 60, tipo });
    const comidas: Registro[] = [];
    if (r() < 0.8) comidas.push({ comida: 'desayuno', hora: h('8:00') + Math.round(r() * 60), kcal: 200 + Math.round(r() * 900), p: Math.round(r() * 50) });
    if (r() < 0.8) comidas.push({ comida: 'almuerzo', hora: h('12:30') + Math.round(r() * 90), kcal: 300 + Math.round(r() * 1200), p: Math.round(r() * 70) });
    if (r() < 0.5) comidas.push({ comida: 'merienda', hora: h('16:30') + Math.round(r() * 60), kcal: 100 + Math.round(r() * 500), p: Math.round(r() * 30) });
    if (r() < 0.7) comidas.push({ comida: 'cena', hora: h('20:00') + Math.round(r() * 120), kcal: 300 + Math.round(r() * 1400), p: Math.round(r() * 90) });
    if (r() < 0.2) comidas.push({ comida: 'snack', hora: h('10:00') + Math.round(r() * 12 * 60), kcal: 100 + Math.round(r() * 300), p: Math.round(r() * 20) });
    return {
      dia: sumarDias(MIERCOLES, Math.floor(r() * 14)),
      ahora: h('4:30') + Math.round(r() * 23 * 60),
      meta: uno<Macros | null>(META, META, META, META, null, { ...META, kcal: 1500, proteina: 110 }),
      comidas,
      ayer: uno<DelDia['ayer']>(null, { kcal: 0, meta: 2200 }, { kcal: 2200, meta: 2200 }, { kcal: 3000, meta: 2200 }, { kcal: 1000, meta: 2200 }, { kcal: 1800, meta: 2200 }),
      anoche: uno<Anoche | null>(null, { dormido: h('5:00') }, { dormido: h('7:10') }, { dormido: h('8:15') }, { dormido: h('8:00'), cara: 1 }, { dormido: h('5:40'), cara: 5 }, { dormido: h('2:00'), incompleta: true }),
      deuda: uno<number | null>(null, 0, 40, 130),
      habitual: uno<Vida['habitual']>(null, { dormirse: n('23:30'), despertar: n('7:15') }, { dormirse: n('22:00'), despertar: n('6:00') }, { dormirse: n('1:30'), despertar: n('9:30') }, { dormirse: n('1:30'), despertar: n('6:30') }),
      entreno,
      hecha: r() < 0.3,
      numeros: r() < 0.7,
      sinDeficit: r() < 0.2,
      diasConDatos: r() < 0.1 ? 0 : 30,
      habituales: uno<readonly Comida[] | undefined>(undefined, undefined, ['almuerzo', 'cena']),
      cafeina: uno<number | null>(null, null, 95, 250),
    };
  });
}
// Más lo que el azar casi no toca: el primer día a la noche.
const MUCHOS: Vida[] = [...diasAlAzar(6000), { ahora: h('21:00'), diasConDatos: 0, ayer: null }];
/** Toda frase que el catálogo podría decir en cada uno de esos días, en los dos idiomas. */
function* todasLasFrases(v: Vida) {
  const d = delDia(v);
  for (const c of candidatos(d)) {
    for (const codigo of CODIGOS.filter((x) => x.startsWith(c.situacion + '.'))) {
      yield { d, c, codigo, es: armar(plantilla('es', codigo), c.valores, formato('es')), en: armar(plantilla('en', codigo), c.valores, formato('en')) };
    }
  }
}
const ENTRENO_ES = /entren|sesión|previa|gimnasio/i;
const COMIDA_NUMEROS = /\d\s?(kcal|g\b|%)/i;

describe('es cierto', () => {
  it('toda situación se puede decir: ninguna frase quedó de adorno', () => {
    const vistas = new Set<Situacion>();
    for (const v of MUCHOS) for (const c of candidatos(delDia(v))) vistas.add(c.situacion);
    // Hoy el horario tiene una sesión por día: lo de dos sesiones llega con Ascent.
    const dosSesiones = delDia({ ahora: h('10:00') });
    for (const c of candidatos({ ...dosSesiones, lineas: [{ comida: 'almuerzo', clase: 'reponer', hora: h('15:00') }] })) vistas.add(c.situacion);
    // Y lo de cuando no hay nada para decir, que se comprueba arriba.
    for (const s of ['nadaManana', 'nadaTarde', 'nadaNoche'] as Situacion[]) vistas.add(s);
    expect(SITUACIONES.filter((s) => !vistas.has(s))).toEqual([]);
  });

  it('toda frase tiene sus valores: no queda ningún {hueco}', () => {
    const huecos = new Set<string>();
    for (const v of MUCHOS) for (const f of todasLasFrases(v)) if (/[{}]/.test(f.es + f.en)) huecos.add(f.codigo);
    expect([...huecos]).toEqual([]);
  });

  it('sin datos de sueño no habla de cómo dormiste', () => {
    for (const v of MUCHOS) {
      const d = delDia(v);
      if (d.anoche || d.deuda || d.horas) continue;
      for (const f of todasLasFrases(v)) {
        // Lo del entreno de mañana y el descanso del cuerpo no hablan de tu noche.
        expect([f.codigo, /dormiste|sueño|anoche|la cama/i.test(f.es)]).toEqual([f.codigo, false]);
      }
    }
  });

  it('sin hora de dormir no dice a qué hora acostarte', () => {
    for (const v of MUCHOS) {
      if (delDia(v).horas) continue;
      for (const f of todasLasFrases(v)) expect([f.codigo, /a la cama a las|acostarte a las|te toca acostarte/i.test(f.es)]).toEqual([f.codigo, false]);
    }
  });

  it('un día sin sesión no habla de entrenar, salvo el descanso o el de mañana', () => {
    for (const v of MUCHOS) {
      const d = delDia(v);
      if (d.sesiones.length || d.entrenaAlgunDia) continue;
      for (const f of todasLasFrases(v)) expect([f.codigo, ENTRENO_ES.test(f.es)]).toEqual([f.codigo, false]);
    }
  });

  it('sin meta no habla de calorías ni de proteína', () => {
    for (const v of MUCHOS) {
      if (delDia(v).meta) continue;
      for (const f of todasLasFrases(v)) expect([f.codigo, /kcal|calor|prote/i.test(f.es)]).toEqual([f.codigo, false]);
    }
  });

  it('después de entrenar no dice que entrenas hoy', () => {
    for (const v of MUCHOS) {
      const d = delDia(v);
      const yaEntreno = d.sesiones.length > 0 && d.sesiones.every((s) => s.hecha || d.ahora >= s.inicio);
      if (!yaEntreno) continue;
      for (const f of todasLasFrases(v)) {
        // «Mañana entrenas» y «vuelves a entrenar» hablan de otra sesión.
        if (/mañana/i.test(f.es) || f.c.situacion === 'reponer') continue;
        expect([f.codigo, /\bentrenas\b|te toca entrenar|hay entreno a las|entreno de las|entreno a las/i.test(f.es)]).toEqual([f.codigo, false]);
      }
    }
  });

  it('mientras entrena no le dice nada del entrenamiento', () => {
    const d = delDia({ ahora: h('19:20'), entreno: { dias: [diaDeLaSemana(MIERCOLES)], hora: h('19:00'), minutos: 60, tipo: 'fuerza' }, comidas: [DESAYUNO] });
    expect(candidatos(d).filter((c) => temasDe(c.situacion).some((t) => t === 'entreno' || t === 'antes' || t === 'despues'))).toEqual([]);
  });

  it('no pregunta por una comida ya anotada', () => {
    for (const v of MUCHOS) {
      const d = delDia(v);
      const lista = candidatos(d).map((c) => c.situacion);
      if (d.anotadas.includes('desayuno')) expect(lista).not.toContain('sinDesayuno');
      if (d.anotadas.includes('almuerzo')) { expect(lista).not.toContain('sinAlmuerzo'); expect(lista).not.toContain('quedaAlmuerzo'); }
      if (d.anotadas.includes('merienda')) expect(lista).not.toContain('sinMerienda');
      if (d.anotadas.includes('cena')) { expect(lista).not.toContain('sinCena'); expect(lista).not.toContain('quedaCena'); expect(lista).not.toContain('metaAntesDeCena'); expect(lista).not.toContain('camaYCena'); }
    }
  });

  it('la hora de la cama nunca se anuncia cuando ya pasó', () => {
    for (const v of MUCHOS) {
      const d = delDia(v);
      for (const c of candidatos(d)) {
        if (c.situacion === 'camaHoy' || c.situacion === 'camaCerca' || c.situacion.startsWith('camaY')) expect(c.valores.hora!).toBeGreaterThan(d.ahora);
      }
    }
  });
});

describe('lo que pidió la persona', () => {
  it('con los números ocultos, ni calorías ni gramos', () => {
    for (const v of MUCHOS) {
      if (v.numeros !== false) continue;
      for (const f of todasLasFrases(v)) {
        expect([f.codigo, COMIDA_NUMEROS.test(f.es) || COMIDA_NUMEROS.test(f.en)]).toEqual([f.codigo, false]);
        for (const k of ['kcal', 'p', 'c', 'pct'] as (keyof Valores)[]) expect(f.c.valores[k]).toBeUndefined();
      }
    }
  });

  it('con los números ocultos, tampoco «te pasaste»', () => {
    const d = delDia({ ahora: h('22:10'), numeros: false, comidas: [...DIA_COMPLETO, { comida: 'snack', hora: h('21:50'), kcal: 800, p: 10 }], ayer: { kcal: 3000, meta: 2200 } });
    const lista = candidatos(d).map((c) => c.situacion);
    expect(lista).not.toContain('pasadoHoy');
    expect(lista).not.toContain('ayerPasado');
  });

  it('las frases sin números no tienen números, y todas las de números van marcadas', () => {
    for (const codigo of CODIGOS) {
      const s = codigo.split('.')[0] as Situacion;
      const tiene = /\{(kcal|p|c|pct)\}/.test(plantilla('es', codigo));
      if (tiene) expect([codigo, soloConNumeros(s)]).toEqual([codigo, true]);
      expect([codigo, /\{(kcal|p|c|pct)\}/.test(plantilla('en', codigo))]).toEqual([codigo, tiene]);
    }
  });

  it('con «sin déficit», ni entrenamiento, ni proteína, ni «te pasaste»', () => {
    for (const v of MUCHOS) {
      if (!v.sinDeficit) continue;
      for (const f of todasLasFrases(v)) {
        expect([f.codigo, /entren|proteína|te pasaste|pasaste la meta|de más|recortar/i.test(f.es)]).toEqual([f.codigo, false]);
        expect([f.codigo, /train|protein|went over|\bover today|to cut/i.test(f.en)]).toEqual([f.codigo, false]);
      }
    }
  });

  it('todo lo que habla de entrenar queda fuera de «sin déficit»', () => {
    for (const s of SITUACIONES) if (temasDe(s).some((t) => t === 'entreno' || t === 'antes' || t === 'despues')) expect([s, noVaSinDeficit(s)]).toEqual([s, true]);
    for (const codigo of CODIGOS) {
      const s = codigo.split('.')[0] as Situacion;
      if (/prote[ií]na/i.test(plantilla('es', codigo))) expect([codigo, noVaSinDeficit(s)]).toEqual([codigo, true]);
    }
  });
});

describe('sin plantilla', () => {
  const todas = (idioma: Idioma) => CODIGOS.map((c) => plantilla(idioma, c));
  const PRIMERA = (t: string) => t.toLowerCase().replace(/^[¿{]+/, '').split(/[\s:,.?}]+/)[0];

  it('tiene varias decenas de frases, de formas distintas', () => {
    expect(CODIGOS.length).toBeGreaterThan(150);
    const preguntas = CODIGOS.filter((c) => /\.pregunta/.test(c)).length;
    const sugerencias = CODIGOS.filter((c) => /\.sugiere/.test(c)).length;
    expect(preguntas).toBeGreaterThan(40);
    expect(sugerencias).toBeGreaterThan(30);
    expect(SITUACIONES.filter((s) => temasDe(s).length > 1).length).toBeGreaterThan(8);
  });

  it('cada forma es lo que dice ser', () => {
    for (const idioma of ['es', 'en'] as const) {
      for (const c of CODIGOS) expect([idioma, c, plantilla(idioma, c).includes('?')]).toEqual([idioma, c, /\.pregunta/.test(c)]);
    }
  });

  it('ninguna palabra abre demasiadas frases', () => {
    for (const idioma of ['es', 'en'] as const) {
      const veces = new Map<string, number>();
      for (const t of todas(idioma)) veces.set(PRIMERA(t), (veces.get(PRIMERA(t)) ?? 0) + 1);
      const [palabra, cuantas] = [...veces].sort((a, b) => b[1] - a[1])[0];
      expect([idioma, palabra, cuantas / CODIGOS.length < 0.1]).toEqual([idioma, palabra, true]);
    }
  });

  it('dentro de una situación, dos frases no empiezan igual', () => {
    for (const idioma of ['es', 'en'] as const) {
      for (const s of SITUACIONES) {
        const inicio = (t: string) => t.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
        const lista = Object.values(frases(idioma)[s]).map(inicio);
        expect([idioma, s, new Set(lista).size]).toEqual([idioma, s, lista.length]);
      }
    }
  });

  it('casi nunca empieza con un saludo', () => {
    for (const idioma of ['es', 'en'] as const) {
      const conSaludo = todas(idioma).filter((t) => /^(hola|buen[oa]s|hi\b|hello|good (morning|afternoon|evening))/i.test(t));
      expect(conSaludo.length).toBeLessThanOrEqual(4);
    }
  });

  it('el saludo de cortesía solo sale si no hay nada más para decir', () => {
    for (const v of MUCHOS.slice(0, 1500)) {
      const d = delDia(v);
      const lista = candidatos(d);
      if (lista.some((c) => temasDe(c.situacion).includes('nada'))) expect(lista.length).toBe(1);
    }
  });

  it('sin entusiasmo fingido', () => {
    for (const idioma of ['es', 'en'] as const) for (const t of todas(idioma)) expect(t).not.toMatch(/[¡!]/);
  });
});

describe('sin culpa', () => {
  const RETA_ES = /deber[ií]as?\b|\bdebes\b|tienes que|hay que|culpa|\bmal\b|compensa|quemar|ganarte|castig|falla|no cumpl|exceso|descontrol|error/i;
  const RETA_EN = /\bshould\b|\bmust\b|have to|guilt|\bbad\b|compensat|\bburn|\bearn|punish|\bfail|excess|cheat|mistake/i;
  const PESO_ES = /\bpeso\b|\bkilos?\b|\bkg\b|balanza|déficit|adelgaz|gord/i;
  const PESO_EN = /\bweigh|\bkilos?\b|\bkg\b|\bscale\b|deficit|\bfat\b(?! and)|\bslim/i;
  const SIN_GENERO = /\b(cansad[oa]s?|descansad[oa]s?|despiert[oa]s?|segur[oa]s?|content[oa]s?|tranquil[oa]s?)\b/i;

  it('nunca reta', () => {
    for (const c of CODIGOS) {
      expect([c, RETA_ES.test(plantilla('es', c))]).toEqual([c, false]);
      expect([c, RETA_EN.test(plantilla('en', c))]).toEqual([c, false]);
    }
  });

  it('nunca habla de peso ni de déficit', () => {
    for (const c of CODIGOS) {
      expect([c, PESO_ES.test(plantilla('es', c))]).toEqual([c, false]);
      // «low in fat» habla de la comida, no de la persona.
      expect([c, PESO_EN.test(plantilla('en', c).replace(/low in fat/, ''))]).toEqual([c, false]);
    }
  });

  it('no le adjudica un género a quien lee', () => {
    // «un día tranquilo» habla del día.
    for (const c of CODIGOS) expect([c, SIN_GENERO.test(plantilla('es', c).replace(/día tranquilo/, ''))]).toEqual([c, false]);
  });

  it('nunca sugiere saltear una comida', () => {
    for (const c of CODIGOS) expect([c, /sáltate|saltea|no cenes|no comas|saltar/i.test(plantilla('es', c))]).toEqual([c, false]);
  });
});

describe('los textos', () => {
  const MAS_LARGO: Valores = { kcal: 1280, p: 100, c: 100, pct: 100, hora: h('23:20'), entreno: h('23:20'), despertar: h('10:30'), horas: h('5:40'), anoche: h('5:40'), deuda: h('2:15'), tiempo: 45, comida: 'merienda', dia: 3 };

  it('todos los códigos tienen texto en los dos idiomas, y no sobra ninguno', () => {
    for (const idioma of ['es', 'en'] as const) {
      const hay = Object.entries(frases(idioma)).flatMap(([s, f]) => Object.keys(f).map((k) => `${s}.${k}`)).sort();
      expect(hay).toEqual([...CODIGOS].sort());
    }
  });

  it('los dos idiomas usan los mismos valores', () => {
    const marcas = (t: string) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const c of CODIGOS) expect([c, marcas(plantilla('en', c))]).toEqual([c, marcas(plantilla('es', c))]);
  });

  it('ninguno pasa de 90 letras, con los valores más largos', () => {
    for (const idioma of ['es', 'en'] as const) {
      const largas = CODIGOS.map((c) => armar(plantilla(idioma, c), MAS_LARGO, formato(idioma))).filter((t) => Array.from(t).length > 90);
      expect(largas).toEqual([]);
    }
  });

  it('{comida} lleva su artículo: nada de «de el» ni de una frase que empiece en minúscula', () => {
    for (const c of CODIGOS) {
      expect([c, /(?<!\p{L})(de|del|al|a) \{comida\}/u.test(plantilla('es', c))]).toEqual([c, false]);
      for (const idioma of ['es', 'en'] as const) expect([c, /[.?] \{comida\}/.test(plantilla(idioma, c))]).toEqual([c, false]);
    }
  });

  it('la primera letra va en mayúscula, también después de «¿»', () => {
    expect(armar('{comida} es tu previa', { comida: 'merienda' }, formato('es'))).toBe('La merienda es tu previa');
    expect(armar('¿{comida} antes de entrenar?', { comida: 'almuerzo' }, formato('es'))).toBe('¿El almuerzo antes de entrenar?');
    expect(armar('{horas} anoche', { horas: h('5:40') }, formato('es'))).toBe('5 h 40 min anoche');
  });

  it('un valor sin dato queda a la vista', () => {
    expect(armar('A las {hora}', {}, formato('es'))).toBe('A las {hora}');
  });

  it('con valores reales, entra', () => {
    for (const v of MUCHOS.slice(0, 2000)) {
      for (const f of todasLasFrases(v)) {
        expect([f.codigo, Array.from(f.es).length <= 90]).toEqual([f.codigo, true]);
        expect([f.codigo, Array.from(f.en).length <= 90]).toEqual([f.codigo, true]);
      }
    }
  });
});

// Dos semanas de una persona: cada día con su sueño, su entrenamiento y lo que come; abre Moss a esas horas.
type Dia14 = Vida & { aberturas: number[] };
const LUNES = '2026-11-02';
function dosSemanas(de: (i: number, dia: ClaveDia) => Omit<Dia14, 'ahora' | 'dia'>): Dia14[] {
  return Array.from({ length: 14 }, (_, i) => {
    const dia = sumarDias(LUNES, i);
    return { ...de(i, dia), dia, ahora: 0 };
  });
}
const HORAS_DE_SIEMPRE = [h('7:40'), h('13:30'), h('17:30'), h('21:40')];
const DORMIDO = [h('5:40'), h('7:50'), h('6:50'), h('8:10'), h('7:20'), h('6:05'), h('8:30')];
const conEntreno: Entreno = { dias: [1, 3, 5], hora: h('18:30'), minutos: 60, tipo: 'fuerza' };
const VIDAS: Record<string, Dia14[]> = {
  // Entrena tres veces por semana, duerme de todo y come parecido, con algún exceso y algún día sin anotar.
  'entrena y duerme de todo': dosSemanas((i) => ({
    aberturas: HORAS_DE_SIEMPRE,
    entreno: conEntreno,
    anoche: { dormido: DORMIDO[i % 7] },
    deuda: i % 5 === 0 ? 75 : 20,
    ayer: { kcal: i % 6 === 0 ? 2950 : i % 7 === 3 ? 0 : 2150, meta: 2200 },
    comidas: i === 9 ? [] : [DESAYUNO, ALMUERZO, MERIENDA, { ...CENA, kcal: i % 4 === 0 ? 1300 : 700 }],
  })),
  // La vida más pareja posible: todos los días igual. Es la que más cuesta no repetir.
  'todos los días igual': dosSemanas(() => ({ aberturas: HORAS_DE_SIEMPRE, anoche: { dormido: h('7:50') }, comidas: DIA_COMPLETO })),
  // Abre más seguido y anota cada comida justo antes.
  'abre seis veces': dosSemanas((i) => ({
    aberturas: [h('7:40'), h('10:00'), h('13:30'), h('17:30'), h('20:00'), h('22:40')],
    entreno: conEntreno,
    anoche: { dormido: DORMIDO[(i * 3) % 7] },
    comidas: DIA_COMPLETO,
  })),
  'sin reloj ni horario': dosSemanas(() => ({ aberturas: HORAS_DE_SIEMPRE, anoche: null, habitual: null, comidas: DIA_COMPLETO })),
  'números ocultos': dosSemanas((i) => ({ aberturas: HORAS_DE_SIEMPRE, numeros: false, anoche: { dormido: DORMIDO[i % 7] }, comidas: DIA_COMPLETO })),
  'sin déficit': dosSemanas((i) => ({ aberturas: HORAS_DE_SIEMPRE, sinDeficit: true, entreno: conEntreno, anoche: { dormido: DORMIDO[i % 7] }, comidas: DIA_COMPLETO })),
};

type Paso = { s: Saludo; d: DelDia; antes: readonly Dicho[] };
function vivir(vida: Dia14[], semilla: string | number = 'moss'): Paso[] {
  const pasos: Paso[] = [];
  let historial: Dicho[] = [];
  for (const dia of vida) {
    for (const ahora of dia.aberturas) {
      const d = delDia({ ...dia, ahora });
      const s = saludoDelDia(d, historial, semilla);
      pasos.push({ s, d, antes: historial });
      historial = recordar(historial, s, d);
    }
  }
  return pasos;
}

describe('no se repite', () => {
  it.each(['entrena y duerme de todo', 'todos los días igual'])('en dos semanas ninguna frase se dice dos veces: %s', (nombre) => {
    for (const semilla of ['moss', 'otra', 17]) {
      const dichos = vivir(VIDAS[nombre], semilla).filter((p) => p.s.nuevo).map((p) => p.s.codigo);
      const repetidas = dichos.filter((c, i) => dichos.indexOf(c) !== i);
      expect([nombre, semilla, repetidas]).toEqual([nombre, semilla, []]);
    }
  });

  // Con menos datos hay menos para decir, o con seis aperturas por día se dice más: se repite más tarde y poco.
  it.each(['abre seis veces', 'sin reloj ni horario', 'números ocultos', 'sin déficit'])('en una semana ninguna frase se dice dos veces, y en dos, ninguna más de dos: %s', (nombre) => {
    for (const semilla of ['moss', 'otra', 17]) {
      const dichos = vivir(VIDAS[nombre], semilla).filter((p) => p.s.nuevo);
      const veces = new Map<string, ClaveDia[]>();
      for (const p of dichos) veces.set(p.s.codigo, [...(veces.get(p.s.codigo) ?? []), p.d.dia]);
      for (const [codigo, dias] of veces) {
        expect([nombre, semilla, codigo, dias.length <= 2]).toEqual([nombre, semilla, codigo, true]);
        if (dias.length === 2) expect([nombre, semilla, codigo, diasEntre(dias[0], dias[1]) >= 7]).toEqual([nombre, semilla, codigo, true]);
      }
    }
  });

  it.each(Object.keys(VIDAS))('el mismo tema no se dice dos veces seguidas si otro tiene algo nuevo que decir: %s', (nombre) => {
    for (const p of vivir(VIDAS[nombre])) {
      const ultimo = p.antes[p.antes.length - 1];
      // Lo último de anoche no cuenta: lo más importante de esta mañana no tiene por qué esperar.
      if (!ultimo || !p.s.nuevo || ultimo.dia !== p.d.dia) continue;
      const temasDeRecien = temasDe(ultimo.codigo.split('.')[0] as Situacion);
      const usadas = new Set(p.antes.filter((x) => diasEntre(x.dia, p.d.dia) < DIAS_SIN_REPETIR).map((x) => x.codigo));
      const tieneAlgo = (s: Situacion) => CODIGOS.some((c) => c.startsWith(s + '.') && !usadas.has(c));
      const hayOtro = candidatos(p.d).some((c) => tieneAlgo(c.situacion) && !temasDe(c.situacion).some((t) => temasDeRecien.includes(t)));
      // Lo que no espera su turno puede repetir el tema: la cama a media hora, la proteína después de entrenar.
      const elegido = candidatos(p.d).find((c) => c.situacion === p.s.situacion);
      if (hayOtro && elegido!.peso < NO_ESPERA) expect([ultimo.codigo, p.s.codigo, p.s.temas.some((t) => temasDeRecien.includes(t))]).toEqual([ultimo.codigo, p.s.codigo, false]);
    }
  });

  it('dos saludos seguidos casi nunca abren con la misma palabra', () => {
    const primera = (t: string) => t.toLowerCase().replace(/^¿/, '').split(/[\s:,.?]+/)[0];
    for (const nombre of Object.keys(VIDAS)) {
      const textos = vivir(VIDAS[nombre]).filter((p) => p.s.nuevo).map((p) => texto(p.s));
      const iguales = textos.filter((t, i) => i > 0 && primera(t) === primera(textos[i - 1])).length;
      expect([nombre, iguales / textos.length < 0.12]).toEqual([nombre, true]);
    }
  });

  it('las formas se turnan: no todo son observaciones', () => {
    const pasos = vivir(VIDAS['entrena y duerme de todo']).filter((p) => p.s.nuevo);
    const formas = new Set(pasos.map((p) => p.s.forma));
    expect(formas).toEqual(new Set(['dice', 'sugiere', 'pregunta']));
    const seguidas = pasos.filter((p, i) => i > 0 && p.s.forma === pasos[i - 1].s.forma).length;
    expect(seguidas / pasos.length).toBeLessThan(0.35);
  });

  it('casi nunca dice «Hola» o «Buenos días» en dos semanas', () => {
    for (const nombre of Object.keys(VIDAS)) {
      const textos = vivir(VIDAS[nombre]).filter((p) => p.s.nuevo).map((p) => texto(p.s));
      expect(textos.filter((t) => /^(hola|buen[oa]s)/i.test(t)).length).toBeLessThanOrEqual(1);
    }
  });

  it('agotadas las frases de la situación, vuelve la que hace más que no se dice', () => {
    const v: Vida = { ahora: h('23:00') + 180, meta: null, anoche: null, ayer: null, comidas: [DESAYUNO], habitual: null };
    let historial: Dicho[] = [];
    const dichos: string[] = [];
    for (let i = 0; i < 8; i++) {
      const d = delDia({ ...v, dia: sumarDias(MIERCOLES, i) });
      const s = saludoDelDia(d, historial, 'moss');
      dichos.push(s.codigo);
      historial = recordar(historial, s, d);
    }
    // Madrugada tiene tres frases: pasa por las tres antes de repetir, y repite en el mismo orden.
    expect(new Set(dichos.slice(0, 3)).size).toBe(3);
    expect(dichos[3]).toBe(dichos[0]);
  });

  it('pasadas las semanas, una frase puede volver', () => {
    const d = delDia({ ahora: h('7:40'), anoche: { dormido: h('8:10') } });
    const usada: Saludo = saludoDelDia(d, [], 'moss');
    const hace = (dias: number): Dicho => ({ codigo: usada.codigo, dia: sumarDias(d.dia, -dias), minuto: h('7:40'), firma: 'x' });
    const libres = (dias: number) => new Set(Array.from({ length: 200 }, (_, i) => saludoDelDia(d, [hace(dias)], i).codigo));
    expect(libres(3).has(usada.codigo)).toBe(false);
    expect(libres(DIAS_SIN_REPETIR + 1).has(usada.codigo)).toBe(true);
  });
});

describe('dentro del día', () => {
  const MANANA: Vida = { ahora: h('7:40'), anoche: { dormido: h('5:40') }, entreno: A_LAS_19 };

  it('abrir y cerrar diez veces no pasa por todas las frases', () => {
    let historial: Dicho[] = [];
    const dichos = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const d = delDia({ ...MANANA, ahora: MANANA.ahora + i * 2 });
      const s = saludoDelDia(d, historial, 'moss');
      if (i > 0) expect(s.nuevo).toBe(false);
      dichos.add(s.codigo);
      historial = recordar(historial, s, d);
    }
    expect(dichos.size).toBe(1);
    expect(historial.length).toBe(1);
  });

  it('pasado un rato, con lo mismo para decir, cambia', () => {
    const d = delDia(MANANA);
    const s = saludoDelDia(d, [], 'moss');
    const historial = recordar([], s, d);
    const luego = delDia({ ...MANANA, ahora: MANANA.ahora + UN_RATO + 5 });
    const otra = saludoDelDia(luego, historial, 'moss');
    expect(otra.nuevo).toBe(true);
    expect(otra.codigo).not.toBe(s.codigo);
  });

  it('con algo nuevo (anotó el desayuno), cambia aunque no haya pasado un rato', () => {
    const d = delDia(MANANA);
    const s = saludoDelDia(d, [], 'moss');
    const historial = recordar([], s, d);
    const anoto = delDia({ ...MANANA, ahora: MANANA.ahora + 10, comidas: [{ ...DESAYUNO, hora: MANANA.ahora + 5 }] });
    const otra = saludoDelDia(anoto, historial, 'moss');
    expect(otra.nuevo).toBe(true);
    expect(otra.firma).not.toBe(s.firma);
  });

  it('lo que sigue en pie queda con los valores de ahora', () => {
    const v: Vida = { ahora: h('21:30'), comidas: [DESAYUNO, ALMUERZO, MERIENDA], habitual: null };
    const d = delDia(v);
    const s = saludoDelDia(d, [{ codigo: 'quedaCena.dice1', dia: d.dia, minuto: h('21:10'), firma: saludoDelDia(d, [], 'moss').firma }], 'moss');
    expect(s.codigo).toBe('quedaCena.dice1');
    expect(s.nuevo).toBe(false);
    expect(s.valores.kcal).toBe(750);
  });

  it('otro día siempre es otra frase', () => {
    const d = delDia(MANANA);
    const s = saludoDelDia(d, [], 'moss');
    const manana = delDia({ ...MANANA, dia: sumarDias(MIERCOLES, 1) });
    expect(saludoDelDia(manana, recordar([], s, d), 'moss').nuevo).toBe(true);
  });

  it('el historial se queda con lo último', () => {
    const d = delDia(MANANA);
    const s = saludoDelDia(d, [], 'moss');
    const largo = Array.from({ length: 200 }, (_, i): Dicho => ({ codigo: 'suenoBien.dice1', dia: sumarDias(MIERCOLES, -i - 1), minuto: 0, firma: 'x' }));
    expect(recordar(largo, s, d).length).toBe(150);
    expect(recordar(largo, s, d).at(-1)?.codigo).toBe(s.codigo);
  });

  it('un código de otra versión de Moss en el historial no rompe nada', () => {
    const d = delDia(MANANA);
    const viejo: Dicho = { codigo: 'noExisteMas.dice1', dia: d.dia, minuto: h('7:00'), firma: 'x' };
    expect(saludoDelDia(d, [viejo], 'moss').nuevo).toBe(true);
  });
});

describe('es determinista', () => {
  it('con los mismos datos, el mismo historial y la misma semilla, la misma frase', () => {
    for (const v of MUCHOS.slice(0, 300)) expect(saludo(v, 'moss')).toEqual(saludo(v, 'moss'));
  });

  it('con otra semilla puede ser otra', () => {
    const v = { ahora: h('7:40'), anoche: { dormido: h('5:40') }, entreno: A_LAS_19 };
    expect(new Set(conSemillas(v, 60).map((s) => s.codigo)).size).toBeGreaterThan(3);
  });
});

describe('el día de la semana', () => {
  it('«hechoListo» dice el día de hoy', () => {
    const d = delDia({ ahora: h('22:00'), entreno: A_LAS_19, hecha: true, comidas: [{ ...DESAYUNO, p: 150 }] });
    expect(candidatos(d).find((c) => c.situacion === 'hechoListo')?.valores.dia).toBe(diaDeLaSemana(MIERCOLES));
  });
});
