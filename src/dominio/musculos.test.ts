import { describe, expect, it } from '@jest/globals';

import es from '../textos/es.json';
import en from '../textos/en.json';
import compartido from './catalogoMuscular.json';
import {
  caidaInicial, CARGA_DE_FABRICA, CATALOGO, cuandoListo, dosisDeLaSesion, esfuerzoDeSerie, estadoDe, grupoDelEjercicio, listoEn, mejorE1rm, MUSCULOS, musculosDe, musculosTrabajados, peorEstado,
  PARTES, porLasSeries, residual, unRmDeAscent, type GrupoDeAscent, type SesionConBloques,
} from './musculos';
import { e1rm } from './puntajeMuscular';

// El catálogo de Ascent a la versión 96 de su esquema, por id y con su grupo, como está en sus migraciones
// (008_fuerza, 029_catalogo_100, 056_crunch_declinado, 076_ejercicios_propios_y_cardio y 096_press_en_smith), cada
// grupo en el orden de su columna `orden` (el de su selector). Si Ascent suma un ejercicio, va acá y en CATALOGO.
const DE_ASCENT: Record<GrupoDeAscent, string[]> = {
  piernas: [
    'sentadilla', 'sentadilla_frontal', 'sentadilla_bulgara', 'sentadilla_goblet', 'sentadilla_hack', 'sentadilla_smith', 'peso_muerto_rumano', 'peso_muerto_sumo',
    'peso_muerto_rigidas', 'peso_muerto_una_pierna', 'buenos_dias', 'prensa', 'prensa_una_pierna', 'hip_thrust', 'zancadas', 'zancadas_caminando', 'zancada_inversa',
    'subida_cajon', 'extension_cuadriceps', 'curl_femoral', 'curl_femoral_pie', 'gemelos', 'gemelos_sentado', 'gemelos_prensa', 'aductores', 'abductores',
    'puente_gluteo', 'patada_gluteo',
  ],
  pecho: [
    'press_banca', 'press_inclinado', 'press_declinado', 'press_plano_smith', 'press_inclinado_smith', 'press_mancuernas', 'press_inclinado_mancuernas',
    'press_pecho_maquina', 'aperturas', 'cruce_polea_alta', 'cruce_polea_baja', 'pec_deck', 'fondos', 'flexiones', 'pullover',
  ],
  espalda: [
    'peso_muerto', 'dominadas', 'dominadas_supinas', 'dominadas_lastradas', 'remo_invertido', 'remo_barra', 'remo_pendlay', 'remo_t', 'remo_mancuerna', 'remo_maquina',
    'remo_unilateral_polea', 'jalon', 'jalon_cerrado', 'jalon_unilateral', 'remo_polea', 'pullover_polea', 'rack_pull', 'hiperextensiones',
  ],
  hombros: [
    'press_militar', 'press_militar_mancuernas', 'press_hombro_maquina', 'press_arnold', 'elevaciones_laterales', 'elevaciones_frontales', 'elevaciones_polea',
    'elevaciones_maquina', 'pajaros', 'face_pull', 'remo_menton', 'rotacion_externa', 'encogimientos',
  ],
  brazos: [
    'curl_barra', 'curl_predicador', 'curl_mancuernas', 'curl_inclinado', 'curl_concentrado', 'curl_polea', 'curl_barra_z', 'martillo', 'curl_muneca', 'press_frances',
    'press_cerrado', 'triceps_mancuerna', 'triceps_polea', 'triceps_sobre_cabeza', 'patada_triceps', 'fondos_banco', 'triceps_maquina',
  ],
  core: [
    'plancha', 'plancha_lateral', 'abdominales_polea', 'crunch', 'crunch_declinado', 'elevacion_piernas', 'elevacion_rodillas', 'rueda_abdominal', 'giros_rusos',
    'bicicleta_abdominal', 'dead_bug', 'press_pallof',
  ],
  cardio: ['cinta', 'correr', 'caminar', 'bicicleta_fija', 'eliptica', 'remo_ergometro', 'escaladora', 'soga', 'natacion'],
};
const IDS = Object.values(DE_ASCENT).flat();

describe('las mismas listas que Ascent', () => {
  // catalogoMuscular.json es el de Ascent (nucleo/catalogoMuscular.json) copiado tal cual: los dos cuentan igual.
  it('cada ejercicio de fuerza tiene los músculos y la parte del catálogo compartido', () => {
    const deFuerza = Object.keys(CATALOGO).filter((id) => CATALOGO[id].grupo !== 'cardio').sort();
    expect(Object.keys(compartido).sort()).toEqual(deFuerza);
    for (const [id, x] of Object.entries(compartido as Record<string, { principal: string[]; ayuda: string[]; parte?: string; multiarticular: boolean }>)) {
      expect([id, CATALOGO[id].principal, CATALOGO[id].ayudan, PARTES[id] ?? null, CATALOGO[id].multiarticular]).toEqual([id, x.principal, x.ayuda, x.parte ?? null, x.multiarticular]);
    }
  });

  it('Moss cubre los 112 ejercicios del catálogo de Ascent, cada uno con el grupo que le da Ascent, y ninguno de más', () => {
    expect(IDS.length).toBe(112);
    const cubiertos = IDS.filter((id) => CATALOGO[id]);
    expect(cubiertos.length).toBe(IDS.length);
    expect(Object.keys(CATALOGO).sort()).toEqual([...IDS].sort());
    for (const [grupo, ids] of Object.entries(DE_ASCENT)) for (const id of ids) expect([id, CATALOGO[id].grupo]).toEqual([id, grupo]);
  });

  it('cada grupo va en el orden de Ascent: al elegir el ejercicio de una meta se listan igual que en su selector', () => {
    for (const [grupo, ids] of Object.entries(DE_ASCENT)) expect(Object.keys(CATALOGO).filter((id) => CATALOGO[id].grupo === grupo)).toEqual(ids);
  });

  it('la carga de fábrica de Ascent (sus migraciones 38 y 47): por mancuerna, un lado por vez o el lastre; los demás, en total', () => {
    for (const id of Object.keys(CARGA_DE_FABRICA)) expect([id, !!CATALOGO[id]]).toEqual([id, true]);
    const cuantas = (c: string) => Object.values(CARGA_DE_FABRICA).filter((x) => x === c).length;
    expect([cuantas('par'), cuantas('una'), cuantas('lastre'), Object.keys(CARGA_DE_FABRICA).length]).toEqual([21, 3, 13, 37]);
    expect(['press_mancuernas', 'elevaciones_laterales', 'cruce_polea_alta', 'remo_mancuerna', 'dominadas'].map((id) => CARGA_DE_FABRICA[id])).toEqual(['par', 'par', 'par', 'una', 'lastre']);
    // La 47 pasó a total la goblet, el pullover y el tríceps con mancuerna; la barra, la máquina y el cardio, siempre.
    expect(['sentadilla_goblet', 'pullover', 'triceps_mancuerna', 'press_banca', 'prensa', 'cinta'].map((id) => CARGA_DE_FABRICA[id] ?? 'total')).toEqual(Array(6).fill('total'));
  });

  it('cada uno de fuerza tiene su músculo principal, sin repetir con los que ayudan; el cardio no tiene ninguno', () => {
    for (const id of IDS) {
      const e = CATALOGO[id];
      if (e.grupo === 'cardio') {
        expect(musculosDe({ id })).toBeNull();
        continue;
      }
      expect([id, e.principal.length > 0]).toEqual([id, true]);
      expect([id, e.ayudan.filter((m) => e.principal.includes(m))]).toEqual([id, []]);
      for (const m of [...e.principal, ...e.ayudan]) expect(MUSCULOS).toContain(m);
    }
  });

  it('cada ejercicio tiene su nombre en español y en inglés', () => {
    const nombres = (t: unknown) => (t as { ascent: { ejercicios: Record<string, string> } }).ascent.ejercicios;
    for (const id of IDS) {
      expect([id, typeof nombres(es)[id]]).toEqual([id, 'string']);
      expect([id, typeof nombres(en)[id]]).toEqual([id, 'string']);
    }
  });

  it('por su id, con lo que importa de cada uno: el peso muerto, de espalda en Ascent, carga las piernas', () => {
    expect([...musculosDe({ id: 'peso_muerto' })!.principal].sort()).toEqual(['espaldaBaja', 'gluteos', 'isquios']);
    expect([...musculosDe({ id: 'peso_muerto_rumano' })!.principal].sort()).toEqual(['gluteos', 'isquios']);
    expect([...musculosDe({ id: 'press_banca' })!.ayudan].sort()).toEqual(['hombros', 'triceps']);
    expect(musculosDe({ id: 'encogimientos' })!.principal).toEqual(['trapecio']);
    expect(musculosDe({ id: 'abductores' })!.principal).toEqual(['gluteos']);
    expect(grupoDelEjercicio({ id: 'peso_muerto' })).toBe('espalda');
  });

  it('los propios, y los que Moss todavía no conoce, por el grupo que eligió la persona', () => {
    expect(musculosDe({ id: 'propio_3f2a9c1b7d4e', grupo: 'piernas' })!.principal).toEqual(['cuadriceps', 'gluteos', 'isquios']);
    expect(musculosDe({ id: 'propio_3f2a9c1b7d4e', grupo: 'brazos' })!.principal).toEqual(['biceps', 'triceps']);
    expect(musculosDe({ id: 'uno_nuevo_de_ascent', grupo: 'pecho' })!.principal).toEqual(['pecho']);
    expect(musculosDe({ id: 'propio_bici', grupo: 'cardio' })).toBeNull();
    expect(musculosDe({})).toBeNull();
  });
});

const HORA = 3_600_000;
const T0 = Date.parse('2026-10-19T21:00:00Z');
const sesion = (horasAntes: number, bloques: SesionConBloques['bloques']): SesionConBloques => ({ inicio: T0 - horasAntes * HORA, bloques });
const sentadilla = (series: number, alFallo = false) => ({ ejercicio: 'Sentadilla', id: 'sentadilla', series: Array.from({ length: series }, () => ({ peso: 100, reps: null })), alFallo });

describe('lo que cae y cómo se recupera', () => {
  it('contra los estudios: 6 series de sentadilla, recuperado a las 72 horas', () => {
    expect(caidaInicial(6)).toBeCloseTo(15.83, 2);
    const seis = [sesion(0, [sentadilla(6)])];
    const a = (h: number) => residual('cuadriceps', seis, T0 + h * HORA);
    expect([a(24), a(48), a(72)].map((x) => Math.round(x * 10) / 10)).toEqual([8.1, 4.2, 2.1]);
    expect(estadoDe(a(24))).toBe('recuperandose');
    expect(estadoDe(a(72))).toBe('recuperado');
    // Con una serie al fallo tarda más: 4,2 % a las 72 horas.
    expect(Math.round(residual('cuadriceps', [sesion(0, [sentadilla(6, true)])], T0 + 72 * HORA) * 10) / 10).toBe(4.2);
    // El press de banca: 4,2 % a las 24 horas y 1,1 % a las 48; el que ayuda carga la mitad.
    const banca = [sesion(0, [{ ejercicio: 'Press de banca', id: 'press_banca', series: Array.from({ length: 6 }, () => ({ peso: 80, reps: null })) }])];
    expect([24, 48].map((h) => Math.round(residual('pecho', banca, T0 + h * HORA) * 10) / 10)).toEqual([4.2, 1.1]);
    expect(residual('triceps', banca, T0 + 24 * HORA)).toBeLessThan(residual('pecho', banca, T0 + 24 * HORA));
    expect(listoEn('cuadriceps', seis, T0 + 24 * HORA)).toBe(36);
  });

  it('la constante crece de a poco con las series: de 6 a 14, sin saltos de más de 12 horas (antes, de 9 a 10 saltaba 38)', () => {
    expect([6, 9, 12, 14].map((n) => porLasSeries(n))).toEqual([1, 1.25, 1.5, 1.5]);
    expect(porLasSeries(4, true)).toBe(1.5);
    const listos = [6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => listoEn('cuadriceps', [sesion(0, [sentadilla(n)])], T0)!);
    for (let i = 1; i < listos.length; i++) {
      expect(listos[i]).toBeGreaterThanOrEqual(listos[i - 1]);
      expect(listos[i] - listos[i - 1]).toBeLessThanOrEqual(12);
    }
  });

  it('con menos de 6 meses entrenando, tarda más', () => {
    const seis = [sesion(0, [sentadilla(6)])];
    expect(listoEn('cuadriceps', seis, T0, { novato: true })!).toBeGreaterThan(listoEn('cuadriceps', seis, T0)!);
  });

  it('el peor estado manda', () => {
    expect(peorEstado(['recuperado', 'cargado', 'recuperandose'])).toBe('cargado');
    expect(peorEstado(['recuperado', 'recuperandose'])).toBe('recuperandose');
    expect(peorEstado([])).toBeNull();
  });

  it('cuándo va a estar listo, en días del calendario: «hoy», «mañana», «pasado mañana» o «en unos días»', () => {
    // A las 14:30.
    const a = 14 * 60 + 30;
    expect(cuandoListo(null, a)).toBe('ya');
    expect(cuandoListo(6, a)).toBe('hoy');
    expect(cuandoListo(10, a)).toBe('manana');
    expect(cuandoListo(40, a)).toBe('pasadoManana');
    expect(cuandoListo(60, a)).toBe('enUnosDias');
  });
});

describe('el 1RM estimado y las series de trabajo', () => {
  it('con una repetición, el peso: como Ascent (antes le sumaba un 3,3 %, el ruido entero de un día)', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2);
    expect(e1rm(60, 15)).toBeNull();
    expect(e1rm(0, 5)).toBeNull();
    expect(unRmDeAscent({ kilos: 100, reps: 1 })).toBe(100);
    expect(unRmDeAscent({ kilos: 60, reps: 15 })).toBeCloseTo(90, 5);
  });

  it('cuenta toda serie de trabajo, con el 60 % del 1RM estimado o más; la entrada en calor no', () => {
    const unoRM = 120;
    expect(esfuerzoDeSerie({ peso: 100, reps: 5 }, unoRM)).toBe(1);
    expect(esfuerzoDeSerie({ peso: 80, reps: 8 }, unoRM)).toBe(1);
    expect(esfuerzoDeSerie({ peso: 60, reps: 10 }, unoRM)).toBe(0);
    expect(esfuerzoDeSerie({ peso: 60, reps: null }, unoRM)).toBe(1);
    const s: SesionConBloques = { inicio: T0, bloques: [{ ejercicio: 'Sentadilla', id: 'sentadilla', series: [{ peso: 50, reps: 10 }, { peso: 100, reps: 5 }, { peso: 100, reps: 5 }] }] };
    expect(dosisDeLaSesion(s, () => unoRM).get('cuadriceps')).toEqual({ dosis: 2, series: 2, alFallo: false });
    expect(mejorE1rm([s], { id: 'sentadilla', ejercicio: 'Sentadilla' })).toBeCloseTo(116.67, 2);
    // Sin id, por el nombre.
    expect(mejorE1rm([{ inicio: T0, bloques: [{ ejercicio: 'Mi press', series: [{ peso: 50, reps: 1 }] }] }], { ejercicio: 'mi press' })).toBe(50);
  });

  it('los músculos de una sesión, de los que más series tuvieron a los que menos: «Pecho, Hombros, Tríceps»', () => {
    const empuje: SesionConBloques = {
      inicio: T0,
      bloques: [
        { ejercicio: 'Press de banca', id: 'press_banca', series: Array.from({ length: 4 }, () => ({ peso: 80, reps: 5 })) },
        { ejercicio: 'Press militar', id: 'press_militar', series: Array.from({ length: 3 }, () => ({ peso: 45, reps: 8 })) },
        { ejercicio: 'Tríceps en polea', id: 'triceps_polea', series: Array.from({ length: 2 }, () => ({ peso: 25, reps: 12 })) },
      ],
    };
    expect(musculosTrabajados(empuje).map((m) => [m.musculo, m.series])).toEqual([['pecho', 4], ['hombros', 3], ['triceps', 2]]);
  });
});
