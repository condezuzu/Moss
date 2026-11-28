// El titular de hoy y Tus músculos dicen lo mismo: la fatiga en días de puntajeMuscular.ts, la de Ascent. Antes el
// titular usaba residual() (musculos.ts), refutada en spec/estudio/musculos-recuperacion.md, y se contradecían: con
// 8 series de sentadilla a 2 de la reserva ayer, el titular decía «sigue cansado» y la sección, listo.

import { describe, expect, it, jest } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import type { DeAscent } from '@/almacen/ascent';
import { metaConAscentDe } from '@/dominio/conAscent';
import { diaDeLaSemana, sumarDias } from '@/dominio/fechas';
import { metaRepartida } from '@/dominio/metas';
import type { Noche } from '@/dominio/sueno';
import type { Persona, Sueno } from '../persona';
import { calcularHoy, calcularTodo, calcularTusMusculos, faltaParaEstimar, metaAlcanzada, objetivoDeHoy, porQueNoCuenta, repsDeSiempre, type Hoy } from './vista';

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

describe('si se sabe cuándo entrenas', () => {
  // Una sesión de Ascent el lunes, sin rutina: los días de siempre se suponen, pero no se afirman.
  const d = {
    sesiones: [{ fecha: '2026-11-23', series: 1, kilos: 100, minutos: 50, inicio: '2026-11-23T21:00:00.000Z', ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', musculos: ['piernas'], series: [{ kilos: 100, reps: 5, rir: null }] }] }],
    marcas: [], rutina: null, siente: null,
  } as unknown as DeAscent;
  const sueno = { deEjemplo: false, noches: [noche], necesidad: 480 } as unknown as Sueno;
  const conEntreno = (entreno: object | null) => calcularHoy({ e: { hoy: HOY, entreno, noches: new Map() } as unknown as Estado, d, sueno, persona: {} as Persona, ahora: new Date(2026, 10, 25, 9, 0) });

  it('sin la rutina de Ascent ni los días de Perfil, un día sin sesión no afirma que descansas: «sin sesión hoy»', () => {
    const h = conEntreno(null);
    expect(h.sesion).toBeNull();
    expect(h.titular.que).toBe('sinHorario');
  });

  it('con los días puestos en Perfil, sí: hoy descansas', () => {
    expect(conEntreno({ dias: [1], hora: 18 * 60, minutos: 60 }).titular.que).toBe('descanso');
  });
});

describe('para qué se entrena hoy, para las sugerencias', () => {
  const conRutina = (ejercicios: { series: number; reps: number | null }[]) => ({
    hoy: HOY,
    rutina: { nombre: 'Piernas', dias: [{ dia: 3, descanso: false, ejercicios: ejercicios.map((x, i) => ({ id: `e${i}`, nombre: 'Ejercicio', musculos: ['piernas'], ...x })) }] },
  }) as unknown as Pick<Hoy, 'hoy' | 'rutina'>;

  it('fuerza si la mayoría de las series de hoy en la rutina piden 6 repeticiones o menos', () => {
    expect(objetivoDeHoy(conRutina([{ series: 4, reps: 5 }, { series: 3, reps: 12 }]))).toBe('fuerza');
    expect(objetivoDeHoy(conRutina([{ series: 3, reps: 5 }, { series: 4, reps: 10 }]))).toBe('musculo');
  });

  it('sin rutina, sin repeticiones objetivo o un día que no está en la rutina, músculo', () => {
    expect(objetivoDeHoy({ hoy: HOY, rutina: null })).toBe('musculo');
    expect(objetivoDeHoy(conRutina([{ series: 4, reps: null }]))).toBe('musculo');
    expect(objetivoDeHoy({ ...conRutina([{ series: 4, reps: 5 }]), hoy: AYER })).toBe('musculo');
  });
});

describe('una meta alcanzada, solo con una serie de verdad', () => {
  const sesion = (series: { peso: number; reps: number | null }[], copiada = false) => ({ inicio: 0, bloques: [{ id: 'press_banca', ejercicio: 'press_banca', series, ...(copiada ? { copiada: true } : {}) }] });
  const meta = (kilos: number, reps: number) => ({ ejercicio: 'press_banca', kilos, reps });

  it('con los kilos y las repeticiones de la meta, o más, en la misma serie', () => {
    expect(metaAlcanzada(meta(100, 1), [sesion([{ peso: 100, reps: 1 }])])).toBe(true);
    expect(metaAlcanzada(meta(55, 8), [sesion([{ peso: 57.5, reps: 9 }])])).toBe(true);
    // 60 × 3 y 50 × 8: cada cosa en una serie distinta no es 55 × 5.
    expect(metaAlcanzada(meta(55, 5), [sesion([{ peso: 60, reps: 3 }, { peso: 50, reps: 8 }])])).toBe(false);
  });

  it('nunca por el 1RM estimado, sin repeticiones anotadas, con lo copiado ni con otro ejercicio', () => {
    // 40 kg × 8 estima 50,7 kg de 1RM, pero no es haber levantado 50 kg una vez.
    expect(metaAlcanzada(meta(50, 1), [sesion([{ peso: 40, reps: 8 }])])).toBe(false);
    expect(metaAlcanzada(meta(100, 1), [sesion([{ peso: 100, reps: null }])])).toBe(false);
    expect(metaAlcanzada(meta(100, 1), [sesion([{ peso: 100, reps: 1 }], true)])).toBe(false);
    expect(metaAlcanzada({ ...meta(100, 1), ejercicio: 'sentadilla' }, [sesion([{ peso: 100, reps: 1 }])])).toBe(false);
  });
});

describe('las repeticiones que sueles hacer, para una meta nueva', () => {
  const de = (...reps: (number | null)[]) => reps.map((r) => ({ peso: 60, reps: r }));

  it('las que más se repiten en tus últimas 4 sesiones; si empatan, las menos; como mucho 10', () => {
    // Un día de prueba a una repetición no cambia lo de siempre.
    expect(repsDeSiempre([de(8, 8, 8), de(8, 8, 7), de(1), de(8, 8, 8)])).toBe(8);
    expect(repsDeSiempre([de(10, 10, 8, 8)])).toBe(8);
    expect(repsDeSiempre([de(12, 12, 12)])).toBe(10);
    // Solo las últimas 4: las de 5 de antes ya no cuentan.
    expect(repsDeSiempre([de(5, 5, 5, 5, 5), de(8), de(8), de(8), de(8)])).toBe(8);
  });

  it('sin la entrada en calor; sin repeticiones anotadas, ninguna', () => {
    // Tres de calentamiento a 10 (con menos del 60 % del 1RM estimado) y dos de trabajo a 5.
    expect(repsDeSiempre([[{ peso: 20, reps: 10 }, { peso: 20, reps: 10 }, { peso: 30, reps: 10 }, { peso: 80, reps: 5 }, { peso: 80, reps: 5 }]])).toBe(5);
    expect(repsDeSiempre([])).toBeNull();
    expect(repsDeSiempre([de(null, null)])).toBeNull();
  });
});

describe('las series de un músculo, con su medio', () => {
  it('9,5 (con las medias del músculo que ayuda) quedan 9,5 y es «poco»: el estado sale del número sin redondear', () => {
    const series = (n: number) => Array.from({ length: n }, () => ({ kilos: 60, reps: 8, rir: 2 }));
    const d = {
      sesiones: [{ fecha: AYER, series: 14, kilos: 6720, minutos: 60, inicio: '2026-11-24T21:00:00.000Z', ejercicios: [
        { id: 'press_banca', nombre: 'Press de banca', musculos: ['pecho'], series: series(9) },
        { id: 'press_frances', nombre: 'Press francés', musculos: ['brazos'], series: series(5) },
      ] }],
      marcas: [], rutina: null, siente: null,
    } as unknown as DeAscent;
    const e = { hoy: HOY, entreno: null, noches: new Map() } as unknown as Estado;
    const h = calcularHoy({ e, d, sueno: { deEjemplo: false, noches: [noche], necesidad: 480 } as unknown as Sueno, persona: {} as Persona, ahora: new Date(2026, 10, 25, 9, 0) });
    // Las 9 del press de banca cuentan media para el tríceps (4,5) y las 5 del press francés, enteras.
    expect(calcularTusMusculos(h).musculos.find((m) => m.musculo === 'triceps')).toMatchObject({ series: 9.5, estado: 'poco' });
  });
});

describe('lo que falta para estimar cuándo llegas a una meta', () => {
  it('las sesiones que faltan o, si alcanzan, las semanas; si faltan las dos cosas, lo que tarda más', () => {
    expect(faltaParaEstimar({ sesiones: 8, semanas: 5 })).toEqual({ que: 'semanas', n: 1 });
    expect(faltaParaEstimar({ sesiones: 5, semanas: 7 })).toEqual({ que: 'sesiones', n: 1 });
    expect(faltaParaEstimar({ sesiones: 0, semanas: 0 })).toEqual({ que: 'sesiones', n: 6 });
    // 3 sesiones en una semana: a ese ritmo, las otras 3 llegan antes que las 5 semanas.
    expect(faltaParaEstimar({ sesiones: 3, semanas: 1 })).toEqual({ que: 'semanas', n: 5 });
    // 2 sesiones en 4 semanas: a ese ritmo, las 4 que faltan tardan más que las 2 semanas.
    expect(faltaParaEstimar({ sesiones: 2, semanas: 4 })).toEqual({ que: 'sesiones', n: 4 });
    expect(faltaParaEstimar({ sesiones: 6, semanas: 6 })).toBeNull();
  });
});

describe('las metas de fuerza, con lo que llega de Ascent', () => {
  // El press militar con mancuernas anotado desde septiembre, pero con las repeticiones recién desde el 23/10: 8
  // sesiones que cuentan, en 5 semanas. A 27,5 kg por mancuerna: llegan 55.
  const press = (reps: number | null) => ({ id: 'press_militar_mancuernas', nombre: 'Press militar con mancuernas', musculos: ['hombros'], carga: 'par' as const, series: Array.from({ length: 3 }, () => ({ kilos: 55, reps, rir: null })) });
  const dia = (fecha: string, ejercicios: object[]) => ({ fecha, series: 3, kilos: 495, minutos: 50, inicio: `${fecha}T21:00:00.000Z`, ejercicios });
  const SIN_REPS = ['2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29', '2026-10-06', '2026-10-13'];
  const CON_REPS = ['2026-10-23', '2026-10-27', '2026-10-30', '2026-11-06', '2026-11-13', '2026-11-17', '2026-11-20', '2026-11-27'];
  function todoEl(hoy: string, mas: string[] = [], deMoss: object = {}) {
    const propio = { id: 'propio_1', nombre: 'Press inclinado en máquina', musculos: ['pecho'], series: [{ kilos: 60, reps: 8, rir: null }] };
    const cinta = { id: 'cinta', nombre: 'Cinta', musculos: ['cardio'], series: [] };
    const d = {
      sesiones: [...SIN_REPS.map((f) => dia(f, [press(null)])), ...[...CON_REPS, ...mas].map((f, i) => dia(f, i === 0 ? [press(8), propio, cinta] : [press(8)]))],
      marcas: [], rutina: null, siente: null, noches: {}, ajustes: null, vinculo: { vinculada: true, nombre: 'agus', desde: null }, desde: null,
      metas: [{ id: 'm-1', ejercicio: 'press_militar_mancuernas', kilos: 70, reps: 8 }],
    } as unknown as DeAscent;
    const e = { hoy, entreno: null, noches: new Map(), pesos: [], metas: [], registros: new Map(), dias: new Map(), respuestas: null, perfil: null, ...deMoss } as unknown as Estado;
    const entradas = { e, d, sueno: { deEjemplo: false, noches: [], necesidad: 480 } as unknown as Sueno, persona: {} as Persona, ahora: new Date(`${hoy}T23:30:00`) };
    return calcularTodo(calcularHoy(entradas), entradas);
  }

  it('con 8 sesiones en 5 semanas no faltan sesiones: falta una semana; y a la semana ya se estima', () => {
    const [meta] = todoEl('2026-11-27').metas;
    expect(meta.proyeccion).toEqual({ estado: 'noSeSabe' });
    expect(meta.falta).toEqual({ que: 'semanas', n: 1 });
    // El nivel de hoy ya se sabe, en total: 55 kg × 8.
    expect(meta.nivel! / (1 + 8 / 30)).toBeCloseTo(55, 5);
    expect(meta.carga).toBe('par');
    // 55 kg × 8 en una serie no es 70 × 8.
    expect(meta.alcanzada).toBe(false);
    const despues = todoEl('2026-12-04', ['2026-12-04']).metas[0];
    expect(despues.proyeccion.estado).not.toBe('noSeSabe');
    expect(despues.falta).toBeNull();
  });

  it('para elegir: todo el catálogo de Ascent en su orden y los propios que llegaron, sin el cardio; los que haces, con su fecha', () => {
    const { paraMetas } = todoEl('2026-11-27');
    expect(paraMetas.filter((x) => x.grupo === 'pecho').map((x) => x.id).slice(0, 3)).toEqual(['press_banca', 'press_inclinado', 'press_declinado']);
    expect(paraMetas.some((x) => x.id === 'cinta')).toBe(false);
    expect(paraMetas.find((x) => x.id === 'propio_1')).toEqual({ id: 'propio_1', ejercicio: 'Press inclinado en máquina', grupo: 'pecho', hecho: '2026-10-23', reps: 8, carga: undefined });
    expect(paraMetas.filter((x) => x.hecho).map((x) => [x.id, x.hecho, x.reps, x.carga])).toEqual([['press_militar_mancuernas', '2026-11-27', 8, 'par'], ['propio_1', '2026-10-23', 8, undefined]]);
    // Sin sesiones, sin repeticiones: el campo queda vacío.
    expect(paraMetas.find((x) => x.id === 'sentadilla')?.reps).toBeNull();
  });

  it('la proteína para llegar es la de tu meta de Moss; sin meta, 1,6 g por kilo', () => {
    const pesos = [{ fecha: '2026-11-20', kg: 82 }];
    expect(todoEl('2026-11-27', [], { pesos, metas: [{ desde: '2026-01-01', kcal: 2600, proteina: 165, carbohidratos: 280, grasas: 80 }] }).proteina).toBe(165);
    expect(todoEl('2026-11-27', [], { pesos }).proteina).toBe(131);
  });
});

describe('lo que falta para estimar, cuando tus sesiones no cuentan', () => {
  // Elevaciones laterales a 20 kg por mancuerna, doce sesiones en seis semanas: la tendencia estima el máximo con las
  // series de 1 a 10 repeticiones (e1rm), así que con 12, o sin anotarlas, faltarían 6 sesiones para siempre.
  const FIN = '2026-11-27';
  const FECHAS = Array.from({ length: 12 }, (_, i) => sumarDias(FIN, -3 - Math.floor(i * 3.5))).reverse();
  /** La meta, con doce sesiones del ejercicio: `repsDe` las repeticiones de cada una; con `copiada`, las copiadas; con `kilos`, otro peso. */
  function metaCon(repsDe: (i: number) => number | null, o: { copiada?: (i: number) => boolean; kilos?: number | null; ejercicio?: string; carga?: string } = {}) {
    const ejercicio = o.ejercicio ?? 'elevaciones_laterales';
    const d = {
      sesiones: FECHAS.map((f, i) => ({
        fecha: f, series: 3, kilos: 120, minutos: 40, inicio: `${f}T21:00:00.000Z`,
        ejercicios: [{
          id: ejercicio, nombre: ejercicio, musculos: ['hombros'], carga: o.carga ?? 'par', ...(o.copiada?.(i) ? { copiada: true } : {}),
          series: Array.from({ length: 3 }, () => ({ kilos: o.kilos === undefined ? 40 : o.kilos, reps: repsDe(i), rir: 1 })),
        }],
      })),
      marcas: [], rutina: null, siente: null, noches: {}, ajustes: null, vinculo: { vinculada: true, nombre: 'agus', desde: null }, desde: null,
      metas: [{ id: 'm-1', ejercicio, kilos: 60, reps: 10 }],
    } as unknown as DeAscent;
    const e = { hoy: FIN, entreno: null, noches: new Map(), pesos: [], metas: [], registros: new Map(), dias: new Map(), respuestas: null, perfil: null } as unknown as Estado;
    const entradas = { e, d, sueno: { deEjemplo: false, noches: [], necesidad: 480 } as unknown as Sueno, persona: {} as Persona, ahora: new Date(`${FIN}T23:30:00`) };
    return calcularTodo(calcularHoy(entradas), entradas).metas[0];
  }

  it('por qué una sesión no cuenta: más de 10 repeticiones, sin anotarlas o sin peso', () => {
    expect(porQueNoCuenta([{ peso: 40, reps: 12 }, { peso: 40, reps: null }])).toBe('muchasReps');
    expect(porQueNoCuenta([{ peso: 40, reps: null }])).toBe('sinReps');
    expect(porQueNoCuenta([{ peso: 40, reps: 12 }, { peso: 40, reps: 8 }])).toBeNull();
    // Sin peso no hay máximo que estimar, con las repeticiones que sean.
    expect([porQueNoCuenta([{ peso: 0, reps: 8 }]), porQueNoCuenta([{ peso: 0, reps: 12 }]), porQueNoCuenta([{ peso: 0, reps: null }])]).toEqual(['sinPeso', 'sinPeso', 'sinPeso']);
    expect(porQueNoCuenta([])).toBeNull();
  });

  it('unas dominadas sin lastre (0 kg) dicen que sin peso no se estima, no que faltan sesiones', () => {
    expect(metaCon(() => 8, { ejercicio: 'dominadas', carga: 'lastre', kilos: null }).falta).toEqual({ que: 'sinPeso' });
  });

  it('lo copiado con «Registrar el día» no cuenta para decidir por qué no se estima', () => {
    // La última, copiada a 12: cuenta la última de verdad, a 8 (y, como en todas a 8, falta una semana).
    expect(metaCon((i) => (i === 11 ? 12 : 8), { copiada: (i) => i === 11 }).falta).toEqual({ que: 'semanas', n: 1 });
  });

  it('a 12 repeticiones dice que con más de 10 no se estima; sin anotarlas, que las anotes', () => {
    expect(metaCon(() => 12).falta).toEqual({ que: 'muchasReps' });
    expect(metaCon(() => null).falta).toEqual({ que: 'sinReps' });
    // Lo que manda es la última sesión: a 8 antes y a 12 ahora, tampoco se va a estimar.
    expect(metaCon((i) => (i < 9 ? 8 : 12)).falta).toEqual({ que: 'muchasReps' });
  });

  it('si la última cuenta, lo que falta de verdad', () => {
    // Las tres últimas a 8, en una semana: a ese ritmo, lo que tarda son las 5 semanas que faltan.
    expect(metaCon((i) => (i < 9 ? 12 : 8)).falta).toEqual({ que: 'semanas', n: 5 });
    // Las doce a 8, en cinco semanas y media: solo falta llegar a las seis.
    expect(metaCon(() => 8).falta).toEqual({ que: 'semanas', n: 1 });
  });
});

describe('para elegir el ejercicio de una meta', () => {
  const FIN = '2026-11-27';
  type DeBloque = { id: string; reps: (number | null)[]; copiada?: boolean; carga?: 'total' | 'par' | 'corporal' };
  const sesion = (fecha: string, ...bloques: DeBloque[]) => ({
    fecha, series: 3, kilos: 300, minutos: 50, inicio: `${fecha}T21:00:00.000Z`,
    ejercicios: bloques.map((b) => ({
      id: b.id, nombre: b.id, musculos: ['piernas'], series: b.reps.map((reps) => ({ kilos: 60, reps, rir: null })), ...(b.copiada ? { copiada: true } : {}), ...(b.carga ? { carga: b.carga } : {}),
    })),
  });
  function todoCon(sesiones: object[], metas: object[] = []) {
    const d = {
      sesiones, marcas: [], rutina: null, siente: null, noches: {}, ajustes: null, vinculo: { vinculada: true, nombre: 'agus', desde: null }, desde: null, metas,
    } as unknown as DeAscent;
    const e = { hoy: FIN, entreno: null, noches: new Map(), pesos: [], metas: [], registros: new Map(), dias: new Map(), respuestas: null, perfil: null } as unknown as Estado;
    const entradas = { e, d, sueno: { deEjemplo: false, noches: [], necesidad: 480 } as unknown as Sueno, persona: {} as Persona, ahora: new Date(`${FIN}T23:30:00`) };
    return calcularTodo(calcularHoy(entradas), entradas);
  }
  const elegible = (t: ReturnType<typeof todoCon>, id: string) => t.paraMetas.find((x) => x.id === id);

  it('las repeticiones de siempre se cuentan por sesión: el mismo ejercicio en dos bloques es una sola', () => {
    const t = todoCon([
      sesion('2026-11-10', { id: 'sentadilla', reps: [6, 6, 6, 6, 6] }),
      sesion('2026-11-13', { id: 'sentadilla', reps: [8] }),
      sesion('2026-11-17', { id: 'sentadilla', reps: [8] }),
      sesion('2026-11-20', { id: 'sentadilla', reps: [8] }, { id: 'sentadilla', reps: [8] }),
    ]);
    // Las últimas 4 sesiones: cinco series a 6 y cuatro a 8. Contando bloques, la de las seis quedaba afuera.
    expect(elegible(t, 'sentadilla')?.reps).toBe(6);
  });

  it('lo copiado con «Registrar el día» no cuenta para las repeticiones de siempre', () => {
    const t = todoCon([sesion('2026-11-13', { id: 'sentadilla', reps: [8, 8, 8] }), sesion('2026-11-20', { id: 'sentadilla', reps: [5, 5, 5, 5, 5], copiada: true })]);
    expect(elegible(t, 'sentadilla')?.reps).toBe(8);
  });

  it('«Los que ya hiciste» son los de las últimas 12 semanas, con la última vez', () => {
    const t = todoCon([sesion(sumarDias(FIN, -84), { id: 'sentadilla', reps: [5] }), sesion(sumarDias(FIN, -83), { id: 'press_banca', reps: [5] })]);
    expect(elegible(t, 'sentadilla')?.hecho).toBeNull();
    expect(elegible(t, 'press_banca')?.hecho).toBe(sumarDias(FIN, -83));
    // Las repeticiones de siempre no tienen ese corte.
    expect(elegible(t, 'sentadilla')?.reps).toBe(5);
  });

  it('la carga: como lo anotaste la última vez; si nunca, la de fábrica de Ascent (las mancuernas, por mancuerna)', () => {
    const t = todoCon(
      [sesion('2026-11-13', { id: 'press_mancuernas', reps: [8], carga: 'par' }), sesion('2026-11-20', { id: 'press_mancuernas', reps: [8], carga: 'total' })],
      [{ id: 'm-1', ejercicio: 'curl_mancuernas', kilos: 30, reps: 10 }],
    );
    expect(['press_mancuernas', 'elevaciones_laterales', 'dominadas', 'sentadilla'].map((id) => elegible(t, id)?.carga)).toEqual(['total', 'par', 'lastre', undefined]);
    // Una meta de un ejercicio que nunca anotaste: «15 kg por mancuerna» desde el principio, no recién con la primera sesión.
    expect(t.metas[0].carga).toBe('par');
  });

  it('lo que hiciste con el peso del cuerpo no se elige para una meta en kilos; nunca anotado, con la carga de fábrica, sí', () => {
    const t = todoCon([sesion('2026-11-20', { id: 'flexiones', reps: [15], carga: 'corporal' })]);
    expect(elegible(t, 'flexiones')).toBeUndefined();
    // Los fondos, nunca anotados, van con lastre en Ascent: se pueden elegir.
    expect(elegible(t, 'fondos')?.carga).toBe('lastre');
  });

  it('la proteína para llegar es la de hoy, la misma que muestra Inicio: con Ascent, el día de gimnasio suma la de la sesión', () => {
    const LUNES = '2026-10-19';
    const MIERCOLES = sumarDias(LUNES, 2);
    const META = { kcal: 2590, proteina: 150, carbohidratos: 322, grasas: 78 };
    const dia = (fecha: string) => ({ fecha, series: 16, kilos: 1000, minutos: 55, ejercicios: [] });
    const historia = Array.from({ length: 28 }, (_, i) => sumarDias(LUNES, -28 + i)).filter((_, i) => i % 7 === 0 || i % 7 === 2 || i % 7 === 4);
    const sesiones = [...historia, LUNES, MIERCOLES].map(dia);
    const d = { sesiones, marcas: [], rutina: null, siente: null, noches: {}, ajustes: null, vinculo: { vinculada: true, nombre: 'agus', desde: null }, desde: '2026-09-01', metas: [] } as unknown as DeAscent;
    const e = {
      hoy: MIERCOLES, entreno: null, noches: new Map(), pesos: [{ fecha: LUNES, kg: 80 }], metas: [{ ...META, desde: LUNES }], registros: new Map(), dias: new Map(), respuestas: null,
      perfil: { diaDelControl: 1, sexo: 'm' },
    } as unknown as Estado;
    const entradas = { e, d, sueno: { deEjemplo: false, noches: [], necesidad: 480 } as unknown as Sueno, persona: {} as Persona, ahora: new Date(`${MIERCOLES}T23:30:00`) };
    const enInicio = metaConAscentDe(metaRepartida(META, e.perfil, diaDeLaSemana(MIERCOLES)), e, MIERCOLES, { desde: '2026-09-01', sesiones });
    expect(enInicio.proteina).toBeGreaterThan(META.proteina);
    expect(calcularTodo(calcularHoy(entradas), entradas).proteina).toBe(enInicio.proteina);
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
