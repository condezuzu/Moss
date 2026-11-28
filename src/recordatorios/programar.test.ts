import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen, type Estado } from '@/almacen/almacen';
import { repositorioEnMemoria, type Memoria } from '@/almacen/repositorio';
import type { Constelacion } from '@/datos/catalogo';
import datos from '@/datos/constelaciones.json';
import { horasDeSueno } from '@/dominio/avisos';
import { entrenoParaGuardar } from '@/dominio/cuestionario';
import { claveDeMarca } from '@/dominio/dias';
import { diaDeLaSemana, sumarDias } from '@/dominio/fechas';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import type { Habito } from '@/dominio/habitos';
import type { MetaGuardada } from '@/dominio/metas';
import type { Acceso, Suscripcion } from '@/dominio/premium';
import type { Registro } from '@/dominio/registros';
import { redondearDeuda, type Noche } from '@/dominio/sueno';
import { nochesParaGuardar, type LoDeSalud } from '@/salud/convertir';

type Disparador = { type: string; date?: Date; year?: number; month?: number; day?: number; hour?: number; minute?: number };
/** Lo programado, con la fecha en que suena (de un disparador de calendario o de fecha). */
const programadas: {
  identifier?: string; content: { title: string; body: string; data: { tipo: string; que?: string; dia?: string; sinLaNoche?: true }; categoryIdentifier?: string }; trigger: { date: Date }; tipo: string;
}[] = [];
/** Los avisos que ya llegaron (el centro de notificaciones) y los que Moss sacó de ahí. */
let mockLlegados: { date: number; request: { identifier: string; content: { data: Record<string, unknown> } } }[] = [];
const mockSacados: string[] = [];
/** Cuántas veces se sacaron todos los que llegaron. */
let mockSacadosTodos = 0;
/** Lo que dice Apple, para cada test: de fábrica, que hay acceso y ninguna suscripción. `fin`, el último día del regalo, si se sabe. */
let mockPremium: { sabe: boolean; hay: boolean; suscripcion: Suscripcion | null; acceso: Acceso; fin?: string } = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
/** El despertador de Moss puesto en el sistema; de fábrica, ninguno. */
let mockAlarma: { hora: number; minuto: number; dias: number[] } | null = null;

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    programadas.length = 0;
  }),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async (p: { identifier?: string; content: (typeof programadas)[number]['content']; trigger: Disparador }) => {
    const d = p.trigger;
    const date = d.date ?? new Date(d.year!, d.month! - 1, d.day!, d.hour!, d.minute!);
    // Como iOS: el mismo identificador reemplaza al que estaba, en su lugar.
    const i = p.identifier ? programadas.findIndex((x) => x.identifier === p.identifier) : -1;
    const nuevo = { ...(p.identifier ? { identifier: p.identifier } : {}), content: p.content, trigger: { date }, tipo: d.type };
    if (i >= 0) programadas[i] = nuevo;
    else programadas.push(nuevo);
    return p.identifier ?? 'id';
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    const i = programadas.findIndex((x) => x.identifier === id);
    if (i >= 0) programadas.splice(i, 1);
  }),
  // Lo programado que todavía no sonó, como lo devuelve iOS: el de calendario, con la fecha en sus partes. Lo que ya
  // sonó deja de estar programado.
  getAllScheduledNotificationsAsync: jest.fn(async () => {
    for (let i = programadas.length - 1; i >= 0; i--) if (programadas[i].trigger.date.getTime() <= Date.now()) programadas.splice(i, 1);
    return programadas.map((p) => ({
      identifier: p.identifier ?? '', content: p.content,
      trigger: p.tipo === 'calendar'
        ? { type: 'calendar', repeats: false, dateComponents: { year: p.trigger.date.getFullYear(), month: p.trigger.date.getMonth() + 1, day: p.trigger.date.getDate(), hour: p.trigger.date.getHours(), minute: p.trigger.date.getMinutes(), second: 0 } }
        : { type: p.tipo },
    }));
  }),
  getPresentedNotificationsAsync: jest.fn(async () => mockLlegados),
  dismissNotificationAsync: jest.fn(async (id: string) => {
    mockSacados.push(id);
  }),
  dismissAllNotificationsAsync: jest.fn(async () => {
    mockSacadosTodos++;
  }),
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
}));
jest.mock('@/almacen', () => ({ elAlmacen: jest.fn() }));
jest.mock('@/secciones/sueno/despertador', () => ({ alarmaPuesta: async () => mockAlarma }));
jest.mock('@/almacen/ascent', () => ({ estadoConAscent: jest.fn(), metaConAscent: (m: unknown) => m, suscribirConAscent: jest.fn() }));
jest.mock('@/lib/premium', () => ({
  seSabeElAcceso: () => mockPremium.sabe,
  hayPremium: () => mockPremium.hay,
  suscripcionActual: () => mockPremium.suscripcion,
  accesoActual: () => mockPremium.acceso,
  finDelRegaloActual: () => mockPremium.fin ?? null,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  hastaDelRegaloActual: () => (mockPremium.fin ? (require('@/dominio/premium') as typeof import('@/dominio/premium')).hastaDelRegalo(mockPremium.fin) : null),
  hayCompras: () => false,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { algunAviso, avisosDe, comidasQueAvisan, conLoQueFalta, LO_QUE_MUEVE_LOS_AVISOS, programarAvisos, suenoParaAvisos } = require('./programar') as typeof import('./programar');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { t } = require('@/textos') as typeof import('@/textos');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { suenoDe } = require('@/secciones/persona') as typeof import('@/secciones/persona');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextoDeHoy, lineasDeHoy } = require('@/secciones/comida/entreno') as typeof import('@/secciones/comida/entreno');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { energiaDeHoy } = require('@/secciones/sueno/datosDeEnergia') as typeof import('@/secciones/sueno/datosDeEnergia');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { duracion } = require('@/secciones/comida/datos') as typeof import('@/secciones/comida/datos');
const MERIENDA = () => t('recordatorios.horario.merienda');

const HOY = '2026-11-02';
const a = (hora: number, minuto = 0) => new Date(2026, 10, 2, hora, minuto);
const entrenar: Habito = { id: 'entrenar', nombre: 'Entrenar', icono: 'dumbbell', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' };
const META = { kcal: 2200, proteina: 150, carbohidratos: 250, grasas: 70, desde: '2026-01-01', gasto: 2200, motivo: 'inicial', momento: '2026-01-01T00:00:00Z' } as MetaGuardada;

/** Lo comido a esa hora; `anotado`, cuándo se anotó, si fue después («el almuerzo comí…», dicho a la noche). */
const registro = (comida: Registro['comida'], hora: number, proteina: number, kcal: number, nombre = 'Algo', anotado = a(hora)): [string, Registro] => {
  const id = `${comida}-${hora}`;
  return [id, {
    id, dia: HOY, comida, momento: a(hora).toISOString(), planificado: false, actualizado: anotado.toISOString(),
    fuente: 'base', ref: id, nombre, cantidad: { gramos: 100 }, valores: { kcal, proteina, carbohidratos: 0, grasas: 0 },
  }];
};

/**
 * Lo de la mañana y la noche, apagado a mano: sin esto, suena lo del día que sigue tu despertar. Las comidas sin anotar
 * van aparte, en `recordatorios`, que estado() deja apagadas ([]).
 */
const APAGADO = {
  dormir: { encendido: false }, horario: [], deuda: { encendido: false }, melatonina: { encendido: false }, revoluciones: { encendido: false }, luces: { encendido: false },
};

beforeEach(() => {
  mockAlarma = null;
});

const estado = (extra: Partial<Estado> = {}) => ({
  hoy: HOY, corte: 240, latencia: null, entradaHecha: true, registros: new Map(), recordatorios: [], habitos: [entrenar], marcas: new Map(), perfil: null, salud: null, noches: new Map(),
  metas: [META], pesos: [], entreno: null, agua: new Map(), numeros: true, despertares: {}, desayunos: {}, cuidados: null, pendientes: [],
  avisos: { horario: ['merienda'], habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 17 * 60 + 35 }, dias: [] }] },
  ...extra,
}) as unknown as Estado;

/** Lo que va a sonar hoy, con su hora. */
const deHoy = () => programadas.filter((p) => p.trigger.date.getDate() === 2).map((p) => [p.trigger.date.getHours() * 60 + p.trigger.date.getMinutes(), p.content.body]);
/** Lo que falta que va a sonar hoy: a qué hora y de qué. */
const faltasDeHoy = () => programadas.filter((p) => p.trigger.date.getDate() === 2 && p.content.data.tipo === 'falta').map((p) => [p.trigger.date.getHours() * 60 + p.trigger.date.getMinutes(), p.content.data.que]);

describe('los avisos que se programan', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(10));
    programadas.length = 0;
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cada uno dice una sola cosa: nada de «Hora de la merienda · Entrenar»', async () => {
    await programarAvisos(estado());
    expect(deHoy()).toEqual([[17 * 60 + 30, MERIENDA()], [17 * 60 + 50, 'Entrenar']]);
    expect(programadas.every((p) => !p.content.body.includes('·'))).toBe(true);
  });

  it('con el entrenamiento marcado, no avisa de entrenar', async () => {
    await programarAvisos(estado({ marcas: new Map([[claveDeMarca('entrenar', HOY), { hecho: true }]]) as Estado['marcas'] }));
    expect(deHoy()).toEqual([[17 * 60 + 30, MERIENDA()]]);
  });

  it('si tu horario dice que entrenas a la mañana, a la tarde no avisa, ningún día', async () => {
    await programarAvisos(estado({ entreno: { dias: [0, 1, 2, 3, 4, 5, 6], hora: 8 * 60, minutos: 60, tipo: 'fuerza' } }));
    expect(programadas.some((p) => p.content.body === 'Entrenar')).toBe(false);
  });

  it('con la merienda anotada, no avisa de la merienda', async () => {
    await programarAvisos(estado({ registros: new Map([registro('merienda', 9, 5, 200)]) }));
    expect(deHoy().map(([, texto]) => texto)).not.toContain(MERIENDA());
  });

  it('si vas muy bajo, un aviso aparte que dice qué falta y qué comer', async () => {
    await programarAvisos(estado({ avisos: { falta: { encendido: true }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    const falta = deHoy().find(([, texto]) => /proteína|protein/.test(String(texto)));
    expect(falta).toBeDefined();
    expect(falta![0]).toBe(19 * 60);
    expect(falta![1]).toMatch(/130 g/);
  });

  it('apagado en Perfil, no hay aviso de lo que falta', async () => {
    await programarAvisos(estado({ avisos: { falta: { encendido: false }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(deHoy().some(([, texto]) => /proteína|protein/.test(String(texto)))).toBe(false);
  });

  it('con todo apagado, tampoco', async () => {
    await programarAvisos(estado({ avisos: APAGADO, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('sin tocar nada, lo de fábrica (25/11/2026): la deuda, tu periodo de melatonina y las comidas sin anotar; la hora de cada comida, acostarte, las luces y bajar el ritmo, apagados', async () => {
    const sinTocar = estado({ avisos: {}, recordatorios: null } as unknown as Partial<Estado>);
    const a = avisosDe(sinTocar);
    expect([a.deuda?.encendido, a.melatonina?.encendido]).toEqual([true, true]);
    expect([a.horario, a.dormir, a.luces, a.revoluciones]).toEqual([[], undefined, undefined, undefined]);
    expect(comidasQueAvisan(sinTocar)).toEqual(['desayuno', 'almuerzo', 'cena']);
    // Lo que prendes en Perfil se respeta: con el horario prendido, cada comida suena a su hora.
    await programarAvisos(estado({ avisos: { horario: ['almuerzo', 'cena'] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    const horario = (c: 'almuerzo' | 'cena') => t(`recordatorios.horario.${c}`);
    expect(deHoy().map(([, texto]) => texto)).toEqual(expect.arrayContaining([horario('almuerzo'), horario('cena')]));
  });

  it('sin elegir nada, suenan las comidas sin anotar, y no la hora de cada comida', async () => {
    const sinAnotar = (c: 'desayuno' | 'almuerzo' | 'cena') => t(`recordatorios.sinAnotar.${c}`);
    await programarAvisos(estado({ avisos: {}, recordatorios: null, registros: new Map([registro('desayuno', 8, 20, 400)]) } as unknown as Partial<Estado>));
    const textos = deHoy().map(([, texto]) => texto);
    expect(textos).toEqual(expect.arrayContaining([sinAnotar('almuerzo'), sinAnotar('cena')]));
    // El desayuno ya está anotado.
    expect(textos).not.toContain(sinAnotar('desayuno'));
    expect(programadas.some((p) => p.content.data.tipo === 'horario')).toBe(false);
    // Con todo lo demás apagado, igual suenan: son de fábrica.
    await programarAvisos(estado({ avisos: APAGADO, recordatorios: null, registros: new Map([registro('desayuno', 8, 20, 400)]) } as unknown as Partial<Estado>));
    expect(deHoy().map(([, texto]) => texto)).toEqual(expect.arrayContaining([sinAnotar('almuerzo'), sinAnotar('cena')]));
  });

  it('apagadas en Perfil (vacío), las comidas sin anotar no se vuelven a prender', async () => {
    const apagadas = estado({ avisos: { habitos: estado().avisos.habitos }, recordatorios: [], registros: new Map([registro('desayuno', 8, 20, 400)]) });
    expect(comidasQueAvisan(apagadas)).toEqual([]);
    await programarAvisos(apagadas);
    expect(programadas.length).toBeGreaterThan(0);
    expect(programadas.some((p) => p.content.data.tipo === 'comida')).toBe(false);
  });

  it('cada comida suena a tu hora de comer: la que pusiste a mano o la de tu día; la que «No sueles», no suena', async () => {
    const respuestas = { horarios: { desayuno: 7 * 60 + 30, almuerzo: 13 * 60 + 30, merienda: null, cena: 21 * 60 + 30 } };
    const horario = (c: 'almuerzo' | 'merienda' | 'cena') => t(`recordatorios.horario.${c}`);
    await programarAvisos(estado({ avisos: { horario: ['almuerzo', 'merienda', 'cena'] }, respuestas, horasDeComer: { cena: 20 * 60 } } as unknown as Partial<Estado>));
    expect(deHoy().filter(([, texto]) => [horario('almuerzo'), horario('merienda'), horario('cena')].includes(String(texto))))
      .toEqual([[13 * 60 + 30, horario('almuerzo')], [20 * 60, horario('cena')]]);
    // Y lo que muestra Perfil › Avisos con el horario prendido: la merienda no está entre las que avisan.
    expect(avisosDe(estado({ avisos: { horario: ['desayuno', 'almuerzo', 'merienda', 'cena'] }, respuestas } as unknown as Partial<Estado>)).horario).toEqual(['desayuno', 'almuerzo', 'cena']);
    // Sin elegir, tampoco avisa si no la anotaste.
    const sinDesayuno = { horarios: { ...respuestas.horarios, desayuno: null } };
    expect(comidasQueAvisan(estado({ recordatorios: null, respuestas: sinDesayuno } as unknown as Partial<Estado>))).toEqual(['almuerzo', 'cena']);
    expect(avisosDe(estado({ avisos: { horario: ['merienda', 'cena'] }, respuestas } as unknown as Partial<Estado>)).horario).toEqual(['cena']);
  });

  it('con «sin déficit», nunca', async () => {
    await programarAvisos(estado({ perfil: { sinDeficit: true } as Estado['perfil'], avisos: { ...APAGADO, falta: { encendido: true } }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('la llave de lo que falta, en Perfil, dice lo mismo que lo que se programa', async () => {
    const llave = (e: Estado) => conLoQueFalta(avisosDe(e));
    const desayuno = new Map([registro('desayuno', 8, 20, 400)]);
    // Con todo apagado se ve apagada, y no suena.
    const nada = estado({ avisos: APAGADO, registros: desayuno });
    expect(llave(nada)).toBe(false);
    await programarAvisos(nada);
    expect(programadas).toEqual([]);
    // Prendida a mano, suena sola.
    const sola = estado({ avisos: { ...APAGADO, falta: { encendido: true } }, registros: desayuno });
    expect([algunAviso(sola), llave(sola)]).toEqual([false, true]);
    await programarAvisos(sola);
    expect(faltasDeHoy()).toEqual([[19 * 60, 'proteina']]);
  });

  it('sin elegirla, «Si voy muy bajo en algo» viene apagada como lo demás de «Más avisos», aunque suene lo de fábrica', async () => {
    const sinTocar = estado({ avisos: {}, recordatorios: null, registros: new Map([registro('desayuno', 8, 20, 400)]) } as unknown as Partial<Estado>);
    expect(algunAviso({ ...sinTocar, avisos: avisosDe(sinTocar), recordatorios: comidasQueAvisan(sinTocar) })).toBe(true);
    expect(conLoQueFalta(avisosDe(sinTocar))).toBe(false);
    await programarAvisos(sinTocar);
    expect(programadas.length).toBeGreaterThan(0);
    expect(faltasDeHoy()).toEqual([]);
    // Con otro aviso elegido, tampoco.
    await programarAvisos(estado({ registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(faltasDeHoy()).toEqual([]);
  });

  it('a la noche no repite lo que dijo a la tarde, aunque después se anote algo con una hora de antes', async () => {
    const desayuno = registro('desayuno', 8, 20, 400);
    jest.setSystemTime(a(17));
    await programarAvisos(estado({ avisos: { falta: { encendido: true }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([desayuno]) }));
    expect(faltasDeHoy()).toEqual([[19 * 60, 'proteina']]);
    // A las 19:30 dice «el almuerzo comí pollo», que va a las 13, y cena a las 21.
    const almuerzo = registro('almuerzo', 13, 60, 600, 'Pollo', a(19, 30));
    const cena = registro('cena', 21, 40, 500);
    jest.setSystemTime(a(21, 30));
    await programarAvisos(estado({ avisos: { falta: { encendido: true }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([desayuno, almuerzo, cena]) }));
    // Lo de la proteína ya lo dijo: a la noche, las calorías.
    expect(faltasDeHoy()).toEqual([[22 * 60 + 15, 'calorias']]);
  });

  it('la cena anotada antes de su aviso no corre lo de después de cenar cuando pasa su hora: no suena dos veces', async () => {
    const leer: Habito = { ...entrenar, id: 'leer', nombre: 'Leer', icono: 'book' };
    // Cenó y lo anotó a las 20: leer, a las 20:30; «¿Anotaste la cena?» (20:45) ya no suena.
    const conCena = estado({
      habitos: [leer], recordatorios: ['cena'], registros: new Map([registro('cena', 20, 30, 500)]),
      avisos: { ...APAGADO, falta: { encendido: false }, habitos: [{ habito: 'leer', cuando: { tipo: 'evento', evento: 'cena', despues: 30 }, dias: [] }] },
    });
    jest.setSystemTime(a(20, 1));
    await programarAvisos(conCena);
    expect(deHoy()).toEqual([[20 * 60 + 30, 'Leer']]);
    // Leer sonó a las 20:30; pasadas las 20:45 no vuelve a las 21:05.
    jest.setSystemTime(a(20, 46));
    await programarAvisos(conCena);
    expect(deHoy()).toEqual([]);
  });

  it('un hábito a las 0:30 es de la noche de su día (D32): hecho ese día, no suena', async () => {
    const leer: Habito = { ...entrenar, id: 'leer', nombre: 'Leer', icono: 'book' };
    const conLeer = (marcas: Estado['marcas']) => estado({ habitos: [leer], marcas, avisos: { habitos: [{ habito: 'leer', cuando: { tipo: 'hora', minutos: 30 }, dias: [] }] } });
    const a03 = () => programadas.filter((p) => p.trigger.date.getDate() === 3 && p.trigger.date.getHours() === 0).length;
    await programarAvisos(conLeer(new Map()));
    expect(a03()).toBe(1);
    await programarAvisos(conLeer(new Map([[claveDeMarca('leer', HOY), { hecho: true }]]) as Estado['marcas']));
    expect(a03()).toBe(0);
  });

  it('con la prueba cancelada, nada después de que vence', async () => {
    const vence = new Date(2026, 10, 3, 12, 0).getTime();
    mockPremium = { sabe: true, hay: true, suscripcion: { producto: 'uy.moss.suscripcion.anual', vence, prueba: true, renueva: false }, acceso: 'prueba' };
    await programarAvisos(estado());
    expect(deHoy()).toEqual([[17 * 60 + 30, MERIENDA()], [17 * 60 + 50, 'Entrenar']]);
    expect(programadas.every((p) => p.trigger.date.getTime() < vence)).toBe(true);
    // De regalo, sigue la semana entera.
    mockPremium = { ...mockPremium, acceso: 'regalo' };
    await programarAvisos(estado());
    expect(programadas.some((p) => p.trigger.date.getTime() >= vence)).toBe(true);
  });

  it('de regalo, nada después de que termina, y dos días antes de su último día avisa que elijas un plan', async () => {
    // El último día del regalo es el jueves 5: después de esa medianoche no hay acceso.
    mockPremium = { ...mockPremium, fin: '2026-11-05' };
    await programarAvisos(estado());
    const termina = new Date(2026, 10, 6).getTime();
    const delRegalo = programadas.filter((p) => p.content.title === t('recordatorios.regaloTermina.titulo'));
    expect(delRegalo).toHaveLength(1);
    expect(delRegalo[0].trigger.date).toEqual(new Date(2026, 10, 3, 10));
    expect(delRegalo[0].content.data.tipo).toBe('prueba');
    expect(programadas.every((p) => p.trigger.date.getTime() < termina)).toBe(true);
    // Ya suscripto, el regalo no cuenta: ni el aviso ni el corte.
    mockPremium = { ...mockPremium, acceso: 'activa' };
    await programarAvisos(estado());
    expect(programadas.some((p) => p.content.title === t('recordatorios.regaloTermina.titulo'))).toBe(false);
  });

  it('suenan a la hora del reloj (calendario), no «dentro de tantos segundos»: así siguen la zona horaria', async () => {
    await programarAvisos(estado());
    expect(programadas.length).toBeGreaterThan(0);
    expect(programadas.every((p) => p.tipo === 'calendar')).toBe(true);
  });

  it('los que ya llegaron y no dicen nada salen del centro de notificaciones', async () => {
    const llegado = (identifier: string, cuando: Date, data: Record<string, unknown>) => ({ date: cuando.getTime(), request: { identifier, content: { data } } });
    const ayer = new Date(2026, 10, 1, 21, 0);
    mockLlegados = [
      llegado('cena-ayer', ayer, { tipo: 'horario', comida: 'cena', dia: '2026-11-01' }),
      llegado('desayuno-hoy', a(9), { tipo: 'horario', comida: 'desayuno', dia: HOY }),
      llegado('merienda-hoy', a(9, 30), { tipo: 'horario', comida: 'merienda', dia: HOY }),
      llegado('peso-hoy', a(8), { tipo: 'pesarse' }),
      llegado('prueba', ayer, { tipo: 'prueba' }),
    ];
    mockSacados.length = 0;
    await programarAvisos(estado({ registros: new Map([registro('desayuno', 8, 20, 400)]), pesos: [{ fecha: HOY, kg: 70 }] as unknown as Estado['pesos'] }));
    // La cena de ayer (otro día), el desayuno ya anotado y el peso ya puesto; la merienda sin anotar y el fin de la prueba quedan.
    expect(mockSacados.sort()).toEqual(['cena-ayer', 'desayuno-hoy', 'peso-hoy']);
    // «Lo que hay que hacer hoy» queda mientras falte algo, y sale con todo tachado.
    const conLista = (hecho: boolean) => estado({ pendientes: [{ id: '1', texto: 'Pagar la luz', hecho, para: HOY }] } as Partial<Estado>);
    mockLlegados = [llegado('lista-hoy', a(9), { tipo: 'pendientes' })];
    mockSacados.length = 0;
    await programarAvisos(conLista(false));
    expect(mockSacados).toEqual([]);
    await programarAvisos(conLista(true));
    expect(mockSacados).toEqual(['lista-hoy']);
    mockLlegados = [];
  });

  it('en iOS la hora de lo que llegó viene en segundos: el de hoy sin día queda en la pantalla bloqueada; el de ayer sale', async () => {
    // iOS da timeIntervalSince1970 (segundos); Android, milisegundos. Leído como milisegundos, cae en 1970.
    const enSegundos = (identifier: string, cuando: Date, data: Record<string, unknown>) => ({ date: cuando.getTime() / 1000, request: { identifier, content: { data } } });
    mockLlegados = [
      enSegundos('entrenar-hoy', a(9), { tipo: 'habito' }),
      enSegundos('entrenar-ayer', new Date(2026, 10, 1, 21, 0), { tipo: 'habito' }),
      enSegundos('prueba', new Date(2026, 10, 1, 21, 0), { tipo: 'prueba' }),
    ];
    mockSacados.length = 0;
    await programarAvisos(estado());
    expect(mockSacados).toEqual(['entrenar-ayer']);
    mockLlegados = [];
  });

  it('con la cena anotada salen también los de las comidas de antes y lo que ya no falta: la merienda, comer antes de entrenar, la última comida', async () => {
    const llegado = (identifier: string, data: Record<string, unknown>) => ({ date: a(20).getTime(), request: { identifier, content: { data: { dia: HOY, ...data } } } });
    jest.setSystemTime(a(21, 30));
    mockLlegados = [
      llegado('merienda', { tipo: 'horario', comida: 'merienda' }),
      llegado('merienda-sin-anotar', { tipo: 'comida', comida: 'merienda' }),
      llegado('antes', { tipo: 'antesDeEntrenar', comida: 'merienda' }),
      llegado('despues', { tipo: 'despuesDeEntrenar', comida: 'cena' }),
      llegado('ultima', { tipo: 'ultimaComida', comida: 'cena' }),
      // Con la cena, la proteína llegó (140 de 150 g); las calorías siguen bajas (800 de 2200).
      llegado('proteina', { tipo: 'falta', que: 'proteina' }),
      llegado('calorias', { tipo: 'falta', que: 'calorias' }),
      // El agua: «toma uno ahora», hasta que anotas un vaso.
      llegado('agua', { tipo: 'falta', que: 'agua' }),
      // Lo de un hábito no tiene que ver con lo anotado.
      llegado('leer', { tipo: 'habito' }),
    ];
    mockSacados.length = 0;
    await programarAvisos(estado({ registros: new Map([registro('cena', 21, 140, 800)]) }));
    expect(mockSacados.sort()).toEqual(['antes', 'despues', 'merienda', 'merienda-sin-anotar', 'proteina', 'ultima']);
    mockSacados.length = 0;
    const vaso = { id: 'v', dia: HOY, ml: 250, momento: a(21).toISOString(), actualizado: a(21).toISOString() };
    await programarAvisos(estado({ registros: new Map([registro('cena', 21, 140, 800)]), agua: new Map([['v', vaso]]) as unknown as Estado['agua'] }));
    expect(mockSacados).toContain('agua');
    expect(mockSacados).not.toContain('calorias');
    mockLlegados = [];
  });

  it('cada aviso lleva su día, no solo los de una comida: así no depende de la hora que da el teléfono', async () => {
    await programarAvisos(estado());
    const calendario = programadas.filter((p) => p.tipo === 'calendar');
    expect(calendario.length).toBeGreaterThan(0);
    expect(calendario.find((p) => p.content.body === 'Entrenar')?.content.data.dia).toBe(HOY);
    expect(calendario.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.content.data.dia ?? ''))).toBe(true);
  });

  it('cada aviso lleva un identificador fijo, su día y cuál es: así se puede sacar uno sin abrir Moss', async () => {
    await programarAvisos(estado({ avisos: { ...estado().avisos, falta: { encendido: true } }, recordatorios: ['almuerzo', 'cena'], registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    const calendario = programadas.filter((p) => p.tipo === 'calendar');
    expect(calendario.find((p) => p.content.body === 'Entrenar')?.identifier).toBe(`${HOY}:habito:entrenar:0`);
    expect(calendario.find((p) => p.content.body === MERIENDA())?.identifier).toBe(`${HOY}:horario:merienda`);
    expect(calendario.find((p) => p.content.data.tipo === 'falta')?.identifier).toBe(`${HOY}:falta:proteina`);
    expect(calendario.find((p) => p.content.data.tipo === 'comida' && p.content.data.dia === '2026-11-03')?.identifier).toBe('2026-11-03:comida:almuerzo');
    // Ninguno repetido: dos iguales, y iOS se queda con el último.
    expect(new Set(calendario.map((p) => p.identifier)).size).toBe(calendario.length);
  });

  it('iOS guarda 64 avisos y descarta el resto en silencio: el del fin de la prueba va primero, después los más cercanos, y nunca más de 60', async () => {
    // Doce hábitos, uno por hora de 8 a 19, y la prueba que termina el lunes 9: más de 80 en la semana.
    const doce = Array.from({ length: 12 }, (_, i): Habito => ({ ...entrenar, id: `h${i}`, nombre: `Hábito ${i}`, icono: 'star' }));
    const vence = new Date(2026, 10, 9, 12, 0).getTime();
    mockPremium = { sabe: true, hay: true, suscripcion: { producto: 'uy.moss.suscripcion.anual', vence, prueba: true, renueva: true }, acceso: 'prueba' };
    await programarAvisos(estado({
      habitos: doce, avisos: { ...APAGADO, maximoPorDia: 12, habitos: doce.map((h, i) => ({ habito: h.id, cuando: { tipo: 'hora', minutos: (8 + i) * 60 }, dias: [] })) },
    }));
    expect(programadas).toHaveLength(60);
    expect(programadas[0].content.data.tipo).toBe('prueba');
    // Los demás, en orden: lo que queda afuera es lo último de la semana.
    const fechas = programadas.slice(1).map((p) => p.trigger.date.getTime());
    expect(fechas).toEqual([...fechas].sort((x, y) => x - y));
    expect(programadas.at(-1)!.trigger.date.getDate()).toBeLessThan(8);
  });

  it('«Voy directo al almuerzo» abre Moss, como «Sí»: con Moss cerrada, sin abrirla no se guardaba', async () => {
    await programarAvisos(estado());
    type Botones = { identifier: string; options: { opensAppToForeground: boolean } }[];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setNotificationCategoryAsync } = require('expo-notifications') as { setNotificationCategoryAsync: { mock: { calls: [string, Botones][] } } };
    const desayuno = setNotificationCategoryAsync.mock.calls.find(([id]) => id === 'desayuno')!;
    expect(desayuno[1].map((b) => [b.identifier, b.options.opensAppToForeground])).toEqual([['desayuno:si', true], ['desayuno:directo', true]]);
  });

  it('mientras Apple no contesta, lo programado queda como estaba', async () => {
    await programarAvisos(estado());
    const antes = programadas.length;
    expect(antes).toBeGreaterThan(0);
    mockPremium = { ...mockPremium, sabe: false, hay: false };
    await programarAvisos(estado({ avisos: {} }));
    expect(programadas).toHaveLength(antes);
    // Contestó que no hay acceso: ahora sí se borra.
    mockPremium = { ...mockPremium, sabe: true };
    await programarAvisos(estado());
    expect(programadas).toEqual([]);
  });

  it('si algo falla al armar los avisos, lo programado queda como estaba: antes se borraba todo primero y el error no se veía', async () => {
    await programarAvisos(estado());
    const antes = programadas.length;
    expect(antes).toBeGreaterThan(0);
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Un estado roto (sin la lista de hábitos) hace fallar la cuenta.
    await programarAvisos(estado({ habitos: null } as unknown as Partial<Estado>));
    expect(programadas).toHaveLength(antes);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('las sesiones de cada día y lo del deporte', () => {
  const si = { encendido: true };
  const deTipo = (dia: number, tipo: string) => programadas.filter((p) => p.trigger.date.getDate() === dia && p.content.data.tipo === tipo);
  const horas = (lista: typeof programadas) => lista.map((p) => p.trigger.date.getHours() * 60 + p.trigger.date.getMinutes());

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(10));
    programadas.length = 0;
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('con dos deportes el mismo día, cada sesión lleva su aviso de antes y el de después', async () => {
    // El martes 3, pesas a las 10 y partido a las 18; el horario único llevaba una sola sesión.
    const entreno = entrenoParaGuardar({
      tipos: ['fuerza', 'equipo'], viaje: 15,
      sesiones: [{ tipo: 'fuerza', dias: [2, 4], hora: 10 * 60, minutos: 60 }, { tipo: 'equipo', dias: [2], hora: 18 * 60, minutos: 90 }],
    });
    await programarAvisos(estado({ entreno, habitos: [], avisos: { ...APAGADO, antesDeEntrenar: si, despuesDeEntrenar: si } }));
    // Antes: el desayuno de las 8 y la merienda adelantada a las 16:30, media hora antes de cada una. Después, al terminar.
    expect(horas(deTipo(3, 'antesDeEntrenar'))).toEqual([7 * 60 + 30, 16 * 60]);
    expect(horas(deTipo(3, 'despuesDeEntrenar'))).toEqual([11 * 60, 19 * 60 + 30]);
    // El jueves, solo las pesas.
    expect(horas(deTipo(5, 'antesDeEntrenar'))).toEqual([7 * 60 + 30]);
  });

  it('«Mañana juegas», la víspera del partido de cada semana, y «Tu carrera es pasado mañana», con su interruptor', async () => {
    // Fútbol con partido los sábados: el viernes 6, a la hora del almuerzo.
    const conPartido = entrenoParaGuardar({
      tipos: ['fuerza', 'equipo'], viaje: 15, partidos: { dia: 6, hora: 16 * 60 },
      sesiones: [{ tipo: 'fuerza', dias: [1, 3], hora: 19 * 60, minutos: 60 }, { tipo: 'equipo', dias: [6], hora: 16 * 60, minutos: 90 }],
    });
    await programarAvisos(estado({ entreno: conPartido, habitos: [], avisos: { ...APAGADO, partido: si } }));
    const partido = programadas.filter((p) => p.content.data.tipo === 'partido');
    expect(partido.map((p) => [p.trigger.date.getDate(), p.trigger.date.getHours(), p.content.title, p.content.body])).toEqual([
      [6, 13, t('recordatorios.conviene.partido.titulo'), t('recordatorios.conviene.partido.texto')],
    ]);
    // Apagado de fábrica.
    await programarAvisos(estado({ entreno: conPartido, habitos: [], avisos: { ...APAGADO, antesDeEntrenar: si } }));
    expect(programadas.some((p) => p.content.data.tipo === 'partido')).toBe(false);
    // Corre, con una carrera de dos horas el viernes 6: el miércoles 4.
    const corre = { dias: [2, 4], hora: 7 * 60, minutos: 45, tipo: 'resistencia', carrera: { fecha: '2026-11-06', minutos: 120 } } as Estado['entreno'];
    await programarAvisos(estado({ entreno: corre, habitos: [], avisos: { ...APAGADO, carrera: si } }));
    expect(programadas.filter((p) => p.content.data.tipo === 'carrera').map((p) => [p.trigger.date.getDate(), p.trigger.date.getHours(), p.content.title])).toEqual([
      [4, 13, t('recordatorios.conviene.carrera.titulo')],
    ]);
    // Sin ese deporte, la carrera que quedó guardada no avisa.
    await programarAvisos(estado({ entreno: { ...corre!, tipo: 'fuerza' }, habitos: [], avisos: { ...APAGADO, carrera: si } }));
    expect(programadas).toEqual([]);
  });
});

describe('los cuidados de salud, en los avisos', () => {
  const PERFIL = { sexo: 'f', nacimiento: 1994, alturaCm: 165, actividad: 'algo' };
  const con = (marcados: string[], extra: Partial<Estado> = {}) =>
    estado({ perfil: PERFIL, pesos: [{ fecha: '2026-11-01', kg: 62 }], cuidados: { marcados, datos: {} }, habitos: [], ...extra } as unknown as Partial<Estado>);
  const desayuno = () => new Map([registro('desayuno', 8, 20, 400)]);
  const toma = { id: 'v', dia: HOY, ml: 500, momento: a(9).toISOString(), actualizado: a(9).toISOString() };

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(10));
    programadas.length = 0;
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('lo que falta, cada cosa según lo marcado: con cálculos, el agua con su meta y no la proteína; con el riñón, nada', async () => {
    const falta = { ...APAGADO, falta: { encendido: true } };
    const agua = new Map([['v', toma]]) as unknown as Estado['agua'];
    // Sin cuidados, con 20 g de proteína a las 10, avisa de la proteína (500 ml no son poca agua para 2 L).
    await programarAvisos(con([], { avisos: falta, registros: desayuno(), agua }));
    expect(faltasDeHoy()).toEqual([[19 * 60, 'proteina']]);
    // Con cálculos: 500 ml sí son poca para 2,5 L, y de la proteína no se habla.
    await programarAvisos(con(['calculos'], { avisos: falta, registros: desayuno(), agua }));
    expect(faltasDeHoy()).toEqual([[19 * 60, 'agua']]);
    expect(programadas.find((p) => p.content.data.tipo === 'falta')!.content.body).toMatch(/8 vasos|vaso|glass/);
    // Con el riñón, ni comer más ni tomar más agua.
    await programarAvisos(con(['renal'], { avisos: falta, registros: desayuno(), agua }));
    expect(programadas).toEqual([]);
    // Ningún aviso nombra la condición.
    await programarAvisos(con(['calculos', 'reflujo'], { avisos: { falta: { encendido: true } }, registros: desayuno(), agua }));
    expect(programadas.length).toBeGreaterThan(0);
    expect(programadas.every((p) => !/cálculo|reflujo|riñ|kidney|reflux|stone/i.test(`${p.content.title} ${p.content.body}`))).toBe(true);
  });

  it('con reflujo, la última comida grande viene prendida, y lo elegido se respeta; con un trastorno de la alimentación, pesarte no suena', async () => {
    expect(avisosDe(con(['reflujo'])).ultimaComida).toEqual({ encendido: true });
    expect(avisosDe(con([])).ultimaComida).toBeUndefined();
    expect(avisosDe(con(['reflujo'], { avisos: { ultimaComida: { encendido: false } } })).ultimaComida).toEqual({ encendido: false });
    // Con otro cuidado que la apaga, no se prende.
    expect(avisosDe(con(['reflujo', 'tca'])).ultimaComida).toBeUndefined();
    // Pesarte, cada día al despertarte: con un trastorno de la alimentación marcado, no.
    const pesarse = { ...APAGADO, pesarse: { encendido: true, todos: true } };
    const despertares = { [HOY]: { despertar: 7 * 60, sabido: 7 * 60 + 5 } };
    jest.setSystemTime(a(7, 5));
    await programarAvisos(con([], { avisos: pesarse, despertares }));
    expect(programadas.some((p) => p.content.data.tipo === 'pesarse')).toBe(true);
    await programarAvisos(con(['tca'], { avisos: pesarse, despertares }));
    expect(programadas.some((p) => p.content.data.tipo === 'pesarse')).toBe(false);
  });

  it('la línea de qué comer al entrenar, en Comida: cada una según lo marcado; con el «sin déficit» de antes, ninguna', () => {
    // Pesas los lunes a las 19: a las 15, la merienda de las 17:30 lleva la línea de antes.
    const entreno = { dias: [1], hora: 19 * 60, minutos: 60, tipo: 'fuerza' } as Estado['entreno'];
    const lineas = (marcados: string[], perfil = PERFIL) => [...lineasDeHoy(con(marcados, { entreno, verEntreno: true, perfil } as unknown as Partial<Estado>), a(15)).values()].map((l) => [l.comida, l.clase]);
    expect(lineas([])).toEqual([['merienda', 'previaLiviana']]);
    expect(lineas(['calculos'])).toEqual([['merienda', 'previaLiviana']]);
    // La diabetes tipo 1 apaga lo de comer al entrenar: va con su plan de insulina.
    expect(lineas(['diabetes1'])).toEqual([]);
    expect(lineas([], { ...PERFIL, sinDeficit: true } as typeof PERFIL)).toEqual([]);
  });
});

describe('lo que vuelve a programar los avisos', () => {
  it('lo que tardas en dormirte y la hora en que empieza el día los mueven', async () => {
    const almacen = crearAlmacen({ abrir: async () => repositorioEnMemoria(), catalogo: datos.constelaciones as unknown as Constelacion[], ahora: () => a(10), nuevaSemilla: () => 's' });
    await almacen.iniciar();
    const mueve = () => LO_QUE_MUEVE_LOS_AVISOS.map((k) => almacen.estado()[k]);
    const cambio = (hacer: () => void) => {
      const antes = mueve();
      hacer();
      return mueve().some((x, i) => x !== antes[i]);
    };
    expect(cambio(() => almacen.ponerLatencia(45))).toBe(true);
    expect(cambio(() => almacen.ponerCorte(0))).toBe(true);
    expect(cambio(() => almacen.ponerNecesidad(420))).toBe(true);
    // Lo que anotas para mañana: «Lo que hay que hacer hoy» lo dice.
    expect(cambio(() => almacen.ponerPendiente('Pagar la luz'))).toBe(true);
    expect(cambio(() => almacen.ponerCalidad('baja'))).toBe(false);
  });
});

describe('el día que sigue tu despertar, en el teléfono', () => {
  /** Dos semanas durmiendo de 23:00 a 7:00, confirmadas (sin reloj). */
  const local = (clave: string, hora: number) => {
    const [y, m, d] = clave.split('-').map(Number);
    return new Date(y, m - 1, d, hora).toISOString();
  };
  const noche = (fecha: string, dormirse = local(sumarDias(fecha, -1), 23)) =>
    [fecha, { fecha, actualizado: '2026-11-01T09:00:00.000Z', hora: { dormirse, despertar: local(fecha, 7), origen: 'confirmada' as const, confianza: 'media' as const } }] as const;
  const noches = new Map(Array.from({ length: 14 }, (_, i) => noche(sumarDias(HOY, -i - 1))));
  /** Con la de anoche: al abrir Moss a la mañana, sin reloj, se estima (estimarAnoche) antes de buscar tu despertar. */
  const conLaDeHoy = new Map([...noches, noche(HOY)]);
  /** La hora de cada comida y la noche entera, prendidas a mano: de fábrica (25/11/2026) no suenan. */
  const PRENDIDO = { horario: ['desayuno', 'almuerzo', 'cena'], dormir: { encendido: true }, luces: { encendido: true }, revoluciones: { encendido: true } };
  const conNoches = (extra: Partial<Estado> = {}) =>
    estado({ perfil: { nacimiento: 1994 }, noches, avisos: { pesarse: { encendido: true, todos: true }, ...PRENDIDO }, habitos: [], ...extra } as unknown as Partial<Estado>);
  const dice = (tipo: string) => programadas.filter((p) => p.trigger.date.getDate() === 2 && p.content.data.tipo === tipo);
  const hora = (p: (typeof programadas)[number] | undefined) => (p ? p.trigger.date.getHours() * 60 + p.trigger.date.getMinutes() : null);

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(6));
    programadas.length = 0;
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('antes de saber que te despertaste, de la mañana queda solo la deuda, 45 minutos después de tu hora de siempre; la noche sí', async () => {
    await programarAvisos(conNoches());
    for (const tipo of ['pesarse', 'desayuno']) expect(dice(tipo)).toEqual([]);
    expect(dice('deuda').map(hora)).toEqual([7 * 60 + 45]);
    expect(dice('melatonina')).toHaveLength(1);
  });

  it('la deuda queda programada para cada mañana, aunque Moss no se abra: hoy dice la de ayer, y mañana la de hoy solo con la noche de hoy', async () => {
    // Trece noches de 8 h y la de ayer, de 4 h: la deuda de ayer (sin la noche de hoy) y la de hoy no son la misma.
    const hastaAyer = new Map([...noches].map(([fecha, n]) => (fecha === sumarDias(HOY, -1) ? noche(fecha, local(fecha, 3)) : [fecha, n])));
    const conHoy = new Map([...hastaAyer, noche(HOY)]);
    const deudaHasta = (dia: string, lasNoches: typeof noches) => redondearDeuda(suenoParaAvisos(conNoches({ hoy: dia, noches: lasNoches } as unknown as Partial<Estado>))!.deuda!);
    const [deAyer, deHoy] = [deudaHasta(sumarDias(HOY, -1), hastaAyer), deudaHasta(HOY, conHoy)];
    expect(deAyer).not.toBe(deHoy);
    const texto = (deuda: number | null) =>
      t(`recordatorios.despertar.deuda.sinLaNoche.${deuda === null ? 'despues' : deuda === 0 ? 'ayerSin' : 'ayer'}`, { deuda: duracion(deuda ?? 0) });
    const deudas = () => programadas.filter((p) => p.content.data.tipo === 'deuda').map((p) => [p.trigger.date.getDate(), hora(p), p.content.body]);
    const sin = { avisos: {}, recordatorios: [] };
    // A las 6:00, dormido: la de hoy a las 7:45 (tu despertar de siempre, las 7:00, más 45), con la de ayer. Mañana, sin
    // la noche de hoy, sin número.
    await programarAvisos(conNoches({ ...sin, noches: hastaAyer } as unknown as Partial<Estado>));
    expect(deudas().slice(0, 2)).toEqual([[2, 7 * 60 + 45, texto(deAyer)], [3, 7 * 60 + 45, texto(null)]]);
    expect(programadas.filter((p) => p.content.data.tipo === 'deuda').map((p) => p.identifier).slice(0, 2)).toEqual([`${HOY}:deuda`, '2026-11-03:deuda']);
    // A las 21:00, con la noche de hoy: mañana dice la de hoy; de pasado mañana en adelante, sin número.
    jest.setSystemTime(a(21));
    await programarAvisos(conNoches({ ...sin, noches: conHoy } as unknown as Partial<Estado>));
    expect(deudas()).toEqual([3, 4, 5, 6, 7, 8].map((d) => [d, 7 * 60 + 45, texto(d === 3 ? deHoy : null)]));
    // Si la noche de hoy no llegó (el anillo todavía no sincronizó), mañana no dice una vieja: sin número.
    await programarAvisos(conNoches({ ...sin, noches: hastaAyer } as unknown as Partial<Estado>));
    expect(deudas()[0]).toEqual([3, 7 * 60 + 45, texto(null)]);
  });

  it('si Moss se entera antes, la de siempre (bajó o subió) va en su lugar, con el mismo nombre; después ya sonó, y no suena otra', async () => {
    // A las 6:50 abriste Moss: te despertaste a las 6:45 y ya está la noche. Suena a las 6:52, y no a las 7:45.
    const despertares = { [HOY]: { despertar: 6 * 60 + 45, sabido: 6 * 60 + 50 } };
    jest.setSystemTime(a(6, 50));
    await programarAvisos(conNoches({ noches: conLaDeHoy, avisos: {}, recordatorios: [], despertares } as unknown as Partial<Estado>));
    expect(dice('deuda').map((p) => [hora(p), p.identifier, p.content.title])).toEqual([[6 * 60 + 52, `${HOY}:deuda`, t('recordatorios.despertar.deuda.titulos.sin')]]);
    // A las 10:05 la abres otra vez: la de las 6:52 ya sonó, y no suena otra. La de mañana sigue en su lugar.
    jest.setSystemTime(a(10, 5));
    await programarAvisos(conNoches({ noches: conLaDeHoy, avisos: {}, recordatorios: [], despertares } as unknown as Partial<Estado>));
    expect(dice('deuda')).toEqual([]);
    expect(programadas.filter((p) => p.content.data.tipo === 'deuda').map((p) => [p.trigger.date.getDate(), hora(p)])[0]).toEqual([3, 7 * 60 + 45]);
  });

  it('una semana abriendo Moss solo a las 21: cada mañana suena la deuda a tu hora de siempre, y cada noche, tu periodo', async () => {
    const sonaron: [number, number | null, string][] = [];
    for (let i = 0; i < 7; i++) {
      const dia = sumarDias(HOY, i);
      const ahora = new Date(2026, 10, 2 + i, 21);
      // Lo que sonó desde la última vez que se abrió.
      for (const p of programadas) if (p.trigger.date <= ahora) sonaron.push([p.trigger.date.getDate(), hora(p), p.content.data.tipo]);
      jest.setSystemTime(ahora);
      // Abrirla a las 21 no dice a qué hora te despertaste; la noche de hoy ya está.
      const hasta = new Map(Array.from({ length: 14 }, (_, k) => noche(sumarDias(dia, -k))));
      await programarAvisos(conNoches({ hoy: dia, noches: hasta, avisos: {}, recordatorios: [] } as unknown as Partial<Estado>));
    }
    expect(sonaron.filter(([, , tipo]) => tipo === 'deuda')).toEqual([3, 4, 5, 6, 7, 8].map((d) => [d, 7 * 60 + 45, 'deuda']));
    expect(sonaron.filter(([, , tipo]) => tipo === 'melatonina')).toEqual([2, 3, 4, 5, 6, 7].map((d) => [d, 21 * 60 + 30, 'melatonina']));
  });

  it('con las noches de un anillo y Salud sin leer (de fondo con el iPhone bloqueado), lo de las noches sale de las guardadas: antes se borraba', async () => {
    // Duerme con un anillo: sus noches, de 23:00 a 7:00, están solo en Salud.
    const delAnillo = (clave: string): Noche => ({
      clave, fuente: { id: 'darings', nombre: 'Da Rings', tipo: 'otra' }, conEtapas: false, dormirse: 5 * 60, despertar: 13 * 60, enCama: null,
      dormido: 420, despierto: 60, despertares: 1, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: 420 }, siestas: 0, tramos: [], intervalos: [],
      confianza: { duracion: 'media', horario: 'media', despertares: 'baja', etapas: null, enCama: null },
    });
    const delSalud = Array.from({ length: 14 }, (_, i) => delAnillo(sumarDias(HOY, -i)));
    const e = estado({ perfil: { nacimiento: 1994 }, salud: { noches: delSalud }, nochesDeSalud: nochesParaGuardar(delSalud, HOY), avisos: {}, recordatorios: [], habitos: [] } as unknown as Partial<Estado>);
    const delSueno = () => programadas.filter((p) => p.content.data.tipo === 'deuda' || p.content.data.tipo === 'melatonina').map((p) => `${p.identifier} ${hora(p)} ${p.content.body}`);
    jest.setSystemTime(a(21));
    await programarAvisos(e);
    const antes = delSueno();
    expect(antes.map((x) => x.split(' ')[0])).toEqual(expect.arrayContaining([`${HOY}:melatonina`, '2026-11-03:deuda', '2026-11-03:melatonina']));
    // A las 21:15, iOS abre Moss de fondo con el teléfono bloqueado: Salud no deja leer nada, y están las guardadas.
    jest.setSystemTime(a(21, 15));
    await programarAvisos({ ...e, salud: null });
    expect(delSueno()).toEqual(antes);
    // Sin noches en Salud (sin reloj, o sin permiso para el sueño) se guarda que no hay ninguna: se rehace con las de Moss.
    await programarAvisos({ ...e, salud: null, nochesDeSalud: [] });
    expect(delSueno()).toEqual([]);
  });

  it('sin noches también: quien recién empieza y se despierta a las 10 no recibe pesarte a las 7:45', async () => {
    const meditar: Habito = { ...entrenar, id: 'meditar', nombre: 'Meditar', icono: 'leaf' };
    const nuevo = (despertares: Estado['despertares'] = {}) => estado({
      avisos: { pesarse: { encendido: true, todos: true }, habitos: [{ habito: 'meditar', cuando: { tipo: 'despertar', despues: 60 }, dias: [] }] },
      recordatorios: null, habitos: [meditar], despertares,
    } as unknown as Partial<Estado>);
    await programarAvisos(nuevo());
    expect(dice('pesarse')).toEqual([]);
    expect(dice('habito')).toEqual([]);
    expect(dice('comida').map((p) => p.content.body)).not.toContain(t('recordatorios.sinAnotar.desayuno'));
    // A las 10:05 Moss sabe que te despertaste a las 10: pesarte y meditar, desde ahí.
    jest.setSystemTime(a(10, 5));
    await programarAvisos(nuevo({ [HOY]: { despertar: 10 * 60, sabido: 10 * 60 + 5 } }));
    expect([hora(dice('pesarse')[0]), hora(dice('habito')[0])]).toEqual([10 * 60 + 15, 11 * 60]);
  });

  it('la noche es la de tu periodo de melatonina: el aviso del periodo y el de acostarte dicen las horas de Sueño', async () => {
    // Durmiendo de 23:00 a 7:00, el punto medio son las 3:00: el periodo va de 22:30 a 23:30; con 15 minutos de
    // margen, acostarse a las 22:15. Su aviso, una hora antes (21:30), caía a 15 minutos del de acostarte (21:45): va
    // a SEPARACION de él, a las 21:25.
    const e = conNoches();
    const p = periodoDeMelatonina(suenoDe(HOY, e.perfil, e.salud, e.noches, e.necesidad).noches, HOY, { margen: e.latencia });
    expect(p).toMatchObject({ desde: 4 * 60 + 30, hasta: 5 * 60 + 30, acostarse: 4 * 60 + 15 });
    await programarAvisos(e);
    const periodo = dice('melatonina')[0];
    expect([hora(periodo), periodo.content.title]).toEqual([21 * 60 + 25, t('recordatorios.despertar.melatonina.titulo', { hora: '22:30' })]);
    expect(periodo.content.body).toBe(t('recordatorios.despertar.melatonina.texto'));
    const acostarte = dice('dormir')[0];
    expect([hora(acostarte), acostarte.content.title]).toEqual([21 * 60 + 45, t('recordatorios.acostarte.titulo', { cama: '22:15' })]);
    expect(acostarte.content.body).toContain('22:30 – 23:30');
    expect(acostarte.content.categoryIdentifier).toBe('dormir');
    // Solo con lo de fábrica (sin acostarte), a la hora justa: una hora antes de que empiece.
    await programarAvisos(conNoches({ avisos: { pesarse: { encendido: true, todos: true } } }));
    expect(hora(dice('melatonina')[0])).toBe(21 * 60 + 30);
  });

  it('con menos de tres noches en la semana no hay periodo: su aviso no suena y el de acostarte usa la hora de antes', async () => {
    const viejas = new Map([...noches].filter(([fecha]) => fecha < sumarDias(HOY, -6)));
    await programarAvisos(conNoches({ noches: viejas } as unknown as Partial<Estado>));
    expect(dice('melatonina')).toEqual([]);
    const acostarte = dice('dormir')[0];
    // Despertarte a las 7:00 con 8 h: dormirte a las 23:00 y, con el margen, acostarte a las 22:45.
    expect([hora(acostarte), acostarte.content.title]).toEqual([22 * 60 + 15, t('recordatorios.acostarte.titulo', { cama: '22:45' })]);
  });

  it('de fábrica y sin periodo, el de la noche suena igual una hora antes de acostarte, sin nombrar la melatonina', async () => {
    // Dos noches en la última semana: no alcanzan para el periodo, pero sí para tu hora de siempre.
    const pocas = new Map([...noches].filter(([fecha]) => fecha < sumarDias(HOY, -4)));
    await programarAvisos(conNoches({ noches: pocas, avisos: {}, recordatorios: [] } as unknown as Partial<Estado>));
    // Te acuestas a las 22:45: a las 21:45, con el texto de bajar el ritmo.
    expect(dice('melatonina').map((p) => [hora(p), p.identifier, p.content.title, p.content.body])).toEqual([
      [21 * 60 + 45, `${HOY}:melatonina`, t('recordatorios.despertar.acostarte.titulo', { hora: '22:45' }), t('recordatorios.despertar.acostarte.texto')],
    ]);
    // Y los días que siguen, también.
    expect(programadas.filter((p) => p.content.data.tipo === 'melatonina')).toHaveLength(7);
  });

  it('sin periodo, Energía y la línea de entrenar dicen la misma hora de acostarte que el aviso, también con el despertar de hoy', async () => {
    // De 0:00 a 7:00, y solo noches de hace más de una semana: sin periodo de melatonina.
    const viejas = new Map([...noches].filter(([fecha]) => fecha < sumarDias(HOY, -6)).map(([fecha, n]) => [fecha, { ...n, hora: { ...n.hora, dormirse: local(fecha, 0) } }]));
    const entreno = { dias: [1], hora: 19 * 60, minutos: 60, tipo: 'fuerza' };
    const con = (despertares: Estado['despertares']) => conNoches({ noches: viejas, despertares, entreno } as unknown as Partial<Estado>);
    const ahora = a(9, 10);
    jest.setSystemTime(ahora);
    const dicen = async (e: Estado) => {
      await programarAvisos(e);
      const energia = energiaDeHoy(e, suenoDe(HOY, e.perfil, e.salud, e.noches, e.necesidad), ahora);
      return { aviso: dice('dormir')[0]?.content.title, energia: energia?.noche?.cama, entreno: contextoDeHoy(e, ahora)?.acostarse, despertar: energia?.despertar };
    };
    // Despertarte a las 9:00 y no a las 7:00 corre la noche: a la cama a las 23:45, no a las 22:45.
    expect(await dicen(con({ [HOY]: { despertar: 9 * 60, sabido: 9 * 60 + 5 } }))).toEqual({
      aviso: t('recordatorios.acostarte.titulo', { cama: '23:45' }), energia: '23:45', entreno: 23 * 60 + 45, despertar: 9 * 60,
    });
    // Sin saber todavía a qué hora te despertaste, la de siempre en todos; Energía sigue con tu despertar de siempre.
    expect(await dicen(con({}))).toEqual({
      aviso: t('recordatorios.acostarte.titulo', { cama: '22:45' }), energia: '22:45', entreno: 22 * 60 + 45, despertar: 7 * 60,
    });
  });

  it('con el despertar, de a uno desde que se supo: la deuda, pesarse y «¿Desayunas hoy?» con sus dos botones', async () => {
    // Te despertaste a las 6:30 y Moss lo supo a las 6:40, antes de tu hora de siempre (las 7:00).
    jest.setSystemTime(a(6, 40));
    await programarAvisos(conNoches({ noches: conLaDeHoy, despertares: { [HOY]: { despertar: 6 * 60 + 30, sabido: 6 * 60 + 40 } } } as unknown as Partial<Estado>));
    expect(hora(dice('deuda')[0])).toBe(6 * 60 + 42);
    expect(hora(dice('pesarse')[0])).toBe(7 * 60 + 2);
    // Cada uno, con su título: la deuda dice cuánta, y pesarte, qué hacer.
    expect(dice('deuda')[0].content.title).not.toBe('Moss');
    expect(dice('pesarse')[0].content.title).toBe(t('recordatorios.pesarte.titulo'));
    const pregunta = dice('desayuno')[0];
    expect([pregunta.content.title, pregunta.content.body]).toEqual([t('recordatorios.despertar.desayuno.titulo'), t('recordatorios.despertar.desayuno.texto')]);
    expect(pregunta.content.categoryIdentifier).toBe('desayuno');
    // Reemplaza la hora del desayuno.
    expect(dice('horario').some((p) => p.content.body === t('recordatorios.horario.desayuno'))).toBe(false);
  });

  it('«Voy directo al almuerzo»: ni la pregunta ni la hora del desayuno, y el almuerzo dice adónde va lo del desayuno', async () => {
    jest.setSystemTime(a(9));
    await programarAvisos(conNoches({ despertares: { [HOY]: { despertar: 7 * 60 + 30, sabido: 7 * 60 + 40 } }, desayunos: { [HOY]: 'directo' } }));
    expect(dice('desayuno')).toEqual([]);
    const almuerzo = dice('horario').find((p) => hora(p) === 13 * 60);
    expect(almuerzo?.content.title).toMatch(/kcal/);
    expect(almuerzo?.content.body).toBe(t('recordatorios.despertar.comida.texto', { lista: t('recordatorios.despertar.y', { a: t('recordatorios.despertar.a.almuerzo'), b: t('recordatorios.despertar.a.cena') }) }));
  });

  it('«Lo que hay que hacer hoy»: con anotar prendido, lo que anotaste anoche llega 20 minutos después de la pregunta del desayuno', async () => {
    jest.setSystemTime(a(7, 40));
    const pendiente = (id: string, texto: string, hecho = false, para = HOY) => ({ id, texto, hecho, para });
    const con = (pendientes: ReturnType<typeof pendiente>[], avisos: Estado['avisos'] = { ...PRENDIDO, descarga: { encendido: true } } as Estado['avisos']) =>
      conNoches({ noches: conLaDeHoy, despertares: { [HOY]: { despertar: 7 * 60 + 30, sabido: 7 * 60 + 40 } }, avisos, pendientes } as unknown as Partial<Estado>);
    await programarAvisos(con([pendiente('1', 'Llamar al dentista'), pendiente('2', 'Pagar la luz', true), pendiente('3', 'Comprar el regalo'), pendiente('4', 'Lo de mañana', false, sumarDias(HOY, 1))]));
    const aviso = dice('pendientes')[0];
    // La deuda a las 7:42 (Moss lo supo antes de las 7:45, con la noche), la pregunta a las 8:02 (sin pesarte) y la lista,
    // a las 8:22, con lo de hoy sin tachar.
    expect([hora(dice('desayuno')[0]), hora(aviso)]).toEqual([8 * 60 + 2, 8 * 60 + 22]);
    expect([aviso.content.title, aviso.content.body]).toEqual([t('recordatorios.despertar.pendientes.titulo'), '· Llamar al dentista\n· Comprar el regalo']);
    // El de la noche, con el mismo interruptor. Lo de mañana espera a tu despertar de mañana, como todo lo de la mañana.
    expect(dice('descarga')).toHaveLength(1);
    expect(programadas.filter((p) => p.content.data.tipo === 'pendientes')).toHaveLength(1);
    // Con todo tachado, o con el interruptor apagado, no suena.
    await programarAvisos(con([pendiente('1', 'Llamar al dentista', true)]));
    expect(dice('pendientes')).toEqual([]);
    await programarAvisos(con([pendiente('1', 'Llamar al dentista')], PRENDIDO as Estado['avisos']));
    expect(dice('pendientes')).toEqual([]);
  });

  it('sin elegir el máximo, prender anotar lo sube solo a 12 y entran todos; el que elegiste a mano queda', async () => {
    jest.setSystemTime(a(6, 40));
    // Con pesarte y la merienda son doce: con diez se quedaban afuera el de anotar y bajar el ritmo.
    const horasDeComer = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60, cena: 20 * 60 };
    const con = (maximoPorDia?: number) => conNoches({
      despertares: { [HOY]: { despertar: 6 * 60 + 30, sabido: 6 * 60 + 40 } }, horasDeComer,
      avisos: { ...PRENDIDO, pesarse: { encendido: true, todos: true }, horario: ['desayuno', 'almuerzo', 'merienda', 'cena'], descarga: { encendido: true }, ...(maximoPorDia ? { maximoPorDia } : {}) },
      pendientes: [{ id: '1', texto: 'Pagar la luz', hecho: false, para: HOY }],
    } as unknown as Partial<Estado>);
    // Lo que muestra Perfil › Avisos: el máximo que vale.
    expect([avisosDe(con()).maximoPorDia, avisosDe(con(10)).maximoPorDia, avisosDe(con(8)).maximoPorDia]).toEqual([12, 10, 8]);
    const deHoy = () => programadas.filter((p) => p.trigger.date.getDate() === 2).map((p) => p.content.data.tipo);
    await programarAvisos(con());
    expect(deHoy()).toHaveLength(12);
    expect(deHoy()).toEqual(expect.arrayContaining(['pendientes', 'descarga', 'revoluciones']));
    // Con todo prendido, tampoco hay dos con el mismo identificador.
    expect(new Set(programadas.map((p) => p.identifier)).size).toBe(programadas.length);
    await programarAvisos(con(10));
    expect(deHoy()).toHaveLength(10);
    expect(deHoy()).not.toContain('descarga');
    expect(deHoy()).not.toContain('revoluciones');
  });
});

describe('mientras Salud no se puede leer: las noches guardadas en el teléfono (D45, 27/11/2026)', () => {
  /** Una noche del anillo, solo en Salud: de 23:00 a `despertar` (en la cuenta de las noches), con una hora despierta. */
  const delAnillo = (clave: string, despertar = 13 * 60, dormido = 420): Noche => ({
    clave, fuente: { id: 'darings', nombre: 'Da Rings', tipo: 'otra' }, conEtapas: false, dormirse: 5 * 60, despertar, enCama: null,
    dormido, despierto: 60, despertares: 1, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: dormido }, siestas: 0, tramos: [], intervalos: [],
    confianza: { duracion: 'media', horario: 'media', despertares: 'baja', etapas: null, enCama: null },
  } as unknown as Noche);
  /** Las noches del anillo de las dos semanas hasta `dia` (la de hoy llega cuando el anillo sincroniza). */
  const hasta = (dia = sumarDias(HOY, -1), despertar?: number) => Array.from({ length: 14 }, (_, i) => delAnillo(sumarDias(dia, -i), despertar));
  /** Salud leída y, como hace el almacén al leerla (ponerSalud), lo mínimo de sus noches guardado en el teléfono. */
  const leida = (noches = hasta(), dia = HOY) => ({ salud: { dia, noches }, nochesDeSalud: nochesParaGuardar(noches, dia) }) as unknown as Partial<Estado>;
  /** De fondo con el iPhone bloqueado: Salud no se lee, y están las noches que se guardaron la última vez que se leyó. */
  const deFondo = (noches = hasta(), dia = HOY) => ({ salud: null, nochesDeSalud: nochesParaGuardar(noches, dia) }) as unknown as Partial<Estado>;
  const MEDITAR: Habito = { ...entrenar, id: 'meditar', nombre: 'Meditar', icono: 'leaf' };
  const LEER: Habito = { ...entrenar, id: 'leer', nombre: 'Leer', icono: 'book' };
  const AVISOS = {
    pesarse: { encendido: true, todos: true }, horario: ['desayuno'], descarga: { encendido: true },
    habitos: [{ habito: 'meditar', cuando: { tipo: 'hora', minutos: 18 * 60 }, dias: [] }, { habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }],
  };
  /** La mañana prendida (pesarte, «¿Desayunas hoy?» y anotar lo que tienes en la cabeza), meditar a las 18 y leer antes de dormirte. */
  const conAnillo = (extra: Partial<Estado> = {}) => estado({
    perfil: { nacimiento: 1994 }, ...leida(), recordatorios: [], habitos: [MEDITAR, LEER], noches: new Map(), avisos: AVISOS,
    pendientes: [{ id: '1', texto: 'Llamar al dentista', hecho: false, para: HOY }],
    ...extra,
  } as unknown as Partial<Estado>);
  const hora = (p: (typeof programadas)[number]) => p.trigger.date.getHours() * 60 + p.trigger.date.getMinutes();
  const deHoy = (tipo: string) => programadas.filter((p) => p.trigger.date.getDate() === 2 && p.content.data.tipo === tipo);
  const DE_LAS_NOCHES = ['dormir', 'deuda', 'melatonina', 'revoluciones', 'gafas', 'descarga', 'luces', 'cafe', 'ultimaComida', 'entrenarTarde'];
  /** Lo de las noches programado (también leer, antes de dormirte): cuándo suena y lo que dice. */
  const deLasNoches = () => programadas.filter((p) => DE_LAS_NOCHES.includes(p.content.data.tipo) || p.content.body === 'Leer')
    .map((p) => `${p.identifier} ${p.trigger.date.getDate()}/${hora(p)} ${p.content.title} · ${p.content.body}`);
  /** Lo que iOS entregó desde la última vez que se programó: «2 deuda». */
  const sonaron: string[] = [];
  const programarA = async (cuando: Date, e: Estado) => {
    for (const p of programadas) if (p.trigger.date <= cuando) sonaron.push(`${p.trigger.date.getDate()} ${p.content.data.tipo}`);
    jest.setSystemTime(cuando);
    await programarAvisos(e);
  };
  const SIN_LA_NOCHE = () => t('recordatorios.despertar.deuda.titulos.sinLaNoche');

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(6));
    programadas.length = 0;
    sonaron.length = 0;
    mockLlegados = [];
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('se guarda lo mínimo: el día, las horas, lo dormido y lo despierto, el aparato y la confianza; ni las etapas, ni los tramos, ni de qué app', () => {
    const [guardada] = nochesParaGuardar([delAnillo(HOY)], HOY);
    expect(guardada).toEqual({
      clave: HOY, dormirse: 5 * 60, despertar: 13 * 60, dormido: 420, siestas: 0, despierto: 60, aparato: 'otra', confianza: { duracion: 'media', horario: 'media' },
    });
  });

  it('la semana de fondo: abres Moss el lunes con Salud y después solo corre de fondo, bloqueado; suena lo mismo que con Salud', async () => {
    // El almacén de verdad: lo que guarda al leer Salud, y lo que carga cuando iOS abre Moss de fondo (sin Salud).
    const avisos = { ...AVISOS, dormir: { encendido: true }, maximoPorDia: 6 };
    const noches = hasta(HOY);
    const salud = (dia: string): LoDeSalud => ({
      dia, valores: {}, noches, soloEnCama: new Map(), lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() }, fuentes: [], aparatos: [], pasosRecientes: [], pesos: new Map(),
    });
    const semana = async (conSalud: boolean) => {
      programadas.length = 0;
      const llego: string[] = [];
      const telefono = repositorioEnMemoria({
        perfil: { nacimiento: 1994 }, habitos: [MEDITAR, LEER], ajustes: { entrada: 'hecha', semilla: 's', avisos: JSON.stringify(avisos), horasDeComer: JSON.stringify({ cena: 20 * 60 + 50 }) },
      } as unknown as Partial<Memoria>);
      const abrir = async () => {
        const almacen = crearAlmacen({ abrir: async () => telefono, catalogo: datos.constelaciones as unknown as Constelacion[], nuevaSemilla: () => 's' });
        await almacen.iniciar();
        return almacen;
      };
      const correr = async (cuando: Date, leerSalud: boolean) => {
        for (const p of programadas) if (p.trigger.date <= cuando) llego.push(`${p.trigger.date.getDate()}/${hora(p)} ${p.content.data.tipo} ${p.content.title} · ${p.content.body}`);
        jest.setSystemTime(cuando);
        // Cada vez, iOS abre Moss desde cero: el almacén arranca de lo guardado en el teléfono.
        const almacen = await abrir();
        if (leerSalud) almacen.ponerSalud(salud(almacen.estado().hoy));
        await almacen.enCola(async () => {});
        await programarAvisos(almacen.estado());
      };
      // El lunes a las 21, abierta: Salud con las noches del anillo hasta hoy.
      await correr(new Date(2026, 10, 2, 21), true);
      // Después, nueve días de fondo: a las 22:30, a las 3 y a las 6.
      for (let i = 0; i < 9; i++) {
        for (const [d, h, m] of [[0, 22, 30], [1, 3, 0], [1, 6, 0]]) await correr(new Date(2026, 10, 2 + i + d, h, m), conSalud);
      }
      return llego;
    };
    const deFondo = await semana(false);
    const conSalud = await semana(true);
    expect(deFondo).toEqual(conSalud);
    // Y suena lo de las noches todos los días: la deuda cada mañana, y el periodo y acostarte cada noche.
    const dias = (tipo: string) => [...new Set(deFondo.filter((x) => x.split(' ')[1] === tipo).map((x) => Number(x.split('/')[0])))];
    expect(dias('deuda')).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
    expect(dias('dormir')).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('si de fondo Moss supo que te despertaste (paraste el despertador), la mañana llega igual y la deuda suena una vez, con la de hoy si la sabe', async () => {
    const despertares = { [HOY]: { despertar: 6 * 60 + 30, sabido: 6 * 60 + 31 } };
    // 6:00, con Salud: la deuda de hoy a las 7:45 (tu despertar de siempre, las 7:00, más 45) y la noche de la semana.
    await programarA(a(6), conAnillo());
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title])).toEqual([[7 * 60 + 45, SIN_LA_NOCHE()]]);
    const noche = deLasNoches().filter((x) => !x.startsWith(`${HOY}:deuda`));
    expect(noche.length).toBeGreaterThan(20);
    // 6:31, de fondo y bloqueado: con las noches guardadas, lo de las noches igual; la mañana, desde que se supo.
    await programarA(a(6, 31), conAnillo({ ...deFondo(), despertares }));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title])).toEqual([[7 * 60 + 45, SIN_LA_NOCHE()]]);
    expect(deLasNoches().filter((x) => !x.startsWith(`${HOY}:deuda`))).toEqual(noche);
    expect(['pesarse', 'desayuno', 'pendientes'].map((tipo) => deHoy(tipo).length)).toEqual([1, 1, 1]);
    const manana = ['pesarse', 'desayuno', 'pendientes'].map((tipo) => hora(deHoy(tipo)[0]));
    // 6:45 abres Moss y Salud ya tiene la noche de hoy: la deuda dice la de hoy, en su lugar; lo demás, donde estaba.
    await programarA(a(6, 45), conAnillo({ ...leida(hasta(HOY)), despertares }));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title === SIN_LA_NOCHE()])).toEqual([[7 * 60 + 45, false]]);
    expect(['pesarse', 'desayuno', 'pendientes'].map((tipo) => hora(deHoy(tipo)[0]))).toEqual(manana);
    // A las 9 sonó una vez cada uno, y no queda nada más de la mañana.
    await programarA(a(9), conAnillo({ ...leida(hasta(HOY)), despertares }));
    expect(['deuda', 'pesarse', 'desayuno', 'pendientes'].map((tipo) => sonaron.filter((x) => x === `2 ${tipo}`).length)).toEqual([1, 1, 1, 1]);
    expect(['deuda', 'pesarse', 'desayuno', 'pendientes'].flatMap(deHoy)).toEqual([]);
  });

  it('lo que marcas mientras Salud no se puede leer deja de sonar, también lo de antes de dormirte; lo demás de las noches, como con Salud', async () => {
    jest.setSystemTime(a(12));
    await programarAvisos(conAnillo());
    const habitos = () => deHoy('habito').map((p) => p.content.body);
    expect(habitos()).toEqual(['Meditar', 'Leer']);
    const leerALas = programadas.filter((p) => p.content.body === 'Leer').map((p) => `${p.trigger.date.getDate()}/${hora(p)}`);
    // 15:00, la tarea de fondo con el iPhone bloqueado aplica lo tocado en los widgets: meditar y leer, hechos.
    jest.setSystemTime(a(15));
    const hecho = (id: string) => [claveDeMarca(id, HOY), { hecho: true, momento: a(14, 50).toISOString() }] as const;
    const marcas = new Map([hecho('meditar'), hecho('leer')]) as Estado['marcas'];
    await programarAvisos(conAnillo({ ...deFondo(), marcas }));
    expect(habitos()).toEqual([]);
    // Leer ya no corre tu periodo, que vuelve a su hora: lo mismo que con Salud.
    const noche = deLasNoches();
    await programarAvisos(conAnillo({ marcas }));
    expect(deLasNoches()).toEqual(noche);
    // Leer, los otros días, sigue a su hora: la de tu noche, que sale de las noches guardadas del anillo.
    expect(programadas.filter((p) => p.content.body === 'Leer').map((p) => `${p.trigger.date.getDate()}/${hora(p)}`)).toEqual(leerALas.slice(1));
  });

  it('lo que apagas o cambias mientras Salud no se puede leer no vuelve', async () => {
    jest.setSystemTime(a(12));
    await programarAvisos(conAnillo());
    expect(programadas.filter((p) => p.content.data.tipo === 'melatonina')).toHaveLength(7);
    // Sin poder leer Salud apagas tu periodo y pasas leer a las 21:00.
    const habitos = [{ habito: 'meditar', cuando: { tipo: 'hora', minutos: 18 * 60 }, dias: [] }, { habito: 'leer', cuando: { tipo: 'hora', minutos: 21 * 60 }, dias: [] }];
    await programarAvisos(conAnillo({ ...deFondo(), avisos: { ...AVISOS, melatonina: { encendido: false }, habitos } } as unknown as Partial<Estado>));
    expect(programadas.filter((p) => p.content.data.tipo === 'melatonina')).toEqual([]);
    expect(deHoy('habito').map((p) => [p.content.body, hora(p)])).toEqual([['Meditar', 18 * 60], ['Leer', 21 * 60]]);
    // Lo demás de las noches, como con Salud: la deuda de mañana.
    expect(programadas.some((p) => p.identifier === '2026-11-03:deuda')).toBe(true);
  });

  it('sin reloj (Salud sin noches) no hay nada que esperar: lo marcado de fondo deja de sonar como siempre', async () => {
    jest.setSystemTime(a(12));
    await programarAvisos(conAnillo(leida([])));
    expect(deHoy('habito').map((p) => p.content.body)).toEqual(['Meditar', 'Leer']);
    jest.setSystemTime(a(15));
    await programarAvisos(conAnillo({ ...deFondo([]), marcas: new Map([[claveDeMarca('meditar', HOY), { hecho: true, momento: a(14, 50).toISOString() }]]) as Estado['marcas'] }));
    expect(deHoy('habito').map((p) => p.content.body)).toEqual(['Leer']);
  });

  it('entrenaste temprano y lo marcaste en el widget: de fondo, «Entrenar tarde» y el café dicen lo mismo que con Salud', async () => {
    const entreno = { dias: [0, 1, 2, 3, 4, 5, 6], hora: 20 * 60, minutos: 60, tipo: 'fuerza' };
    const base = { habitos: [entrenar], entreno, avisos: { entrenarTarde: { encendido: true }, cafe: { encendido: true } } } as unknown as Partial<Estado>;
    const marcas = new Map([[claveDeMarca('entrenar', HOY), { hecho: true, momento: a(13).toISOString() }]]) as Estado['marcas'];
    const dicen = () => programadas.filter((p) => p.trigger.date.getDate() === 2 && ['entrenarTarde', 'cafe'].includes(p.content.data.tipo)).map((p) => `${p.content.data.tipo} ${hora(p)} ${p.content.title} · ${p.content.body}`);
    jest.setSystemTime(a(9));
    await programarAvisos(conAnillo(base));
    expect(dicen().some((x) => x.startsWith('entrenarTarde'))).toBe(true);
    jest.setSystemTime(a(13, 30));
    await programarAvisos(conAnillo({ ...base, ...deFondo(), marcas }));
    const deFondoDice = dicen();
    programadas.length = 0;
    jest.setSystemTime(a(9));
    await programarAvisos(conAnillo(base));
    jest.setSystemTime(a(13, 30));
    await programarAvisos(conAnillo({ ...base, marcas }));
    expect(deFondoDice).toEqual(dicen());
    expect(deFondoDice.some((x) => x.startsWith('entrenarTarde'))).toBe(false);
  });

  it('apagar todo, o quedarse sin acceso, borra todo aunque Salud no se pueda leer', async () => {
    await programarAvisos(conAnillo());
    expect(programadas.length).toBeGreaterThan(0);
    await programarAvisos(conAnillo({ ...deFondo(), avisos: { ...APAGADO, deuda: { encendido: false }, melatonina: { encendido: false } } } as unknown as Partial<Estado>));
    expect(programadas).toEqual([]);
    await programarAvisos(conAnillo());
    expect(programadas.length).toBeGreaterThan(0);
    mockPremium = { ...mockPremium, hay: false };
    await programarAvisos(conAnillo(deFondo()));
    expect(programadas).toEqual([]);
  });

  it('cerrar sesión, borrar tus datos o la cuenta (olvidarTodo) borra las noches guardadas, lo programado y lo que llegó, aunque Apple no haya contestado', async () => {
    await programarAvisos(conAnillo());
    expect(programadas.some((p) => p.content.body === 'Meditar')).toBe(true);
    // Leer, ya entregado en el centro de notificaciones con el nombre de un hábito de esta cuenta.
    mockLlegados = [{ date: a(5).getTime() / 1000, request: { identifier: `${HOY}:habito:leer:0`, content: { data: { tipo: 'habito', dia: HOY } } } }];
    const telefono = repositorioEnMemoria();
    const almacen = crearAlmacen({ abrir: async () => telefono, catalogo: datos.constelaciones as unknown as Constelacion[], ahora: () => a(6), nuevaSemilla: () => 's' });
    await almacen.iniciar();
    almacen.ponerSalud({ dia: HOY, valores: {}, noches: hasta(), soloEnCama: new Map(), lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() }, fuentes: [], aparatos: [], pasosRecientes: [], pesos: new Map() });
    await almacen.enCola(async () => {});
    expect(almacen.estado().nochesDeSalud).toHaveLength(14);
    expect((await telefono.cargar('2026-01-01', '2026-01-01')).nochesDeSalud).toHaveLength(14);
    await almacen.olvidarTodo();
    // Vuelve la entrada, sin Salud ni noches guardadas, y lo de fábrica prendido: no suena nada hasta terminarla.
    expect([almacen.estado().salud, almacen.estado().nochesDeSalud, almacen.estado().entradaHecha]).toEqual([null, null, false]);
    expect((await telefono.cargar('2026-01-01', '2026-01-01')).nochesDeSalud).toBeNull();
    mockPremium = { ...mockPremium, sabe: false };
    const antes = mockSacadosTodos;
    await programarAvisos(almacen.estado());
    expect(programadas).toEqual([]);
    expect(mockSacadosTodos).toBe(antes + 1);
  });

  it('de fondo la semana sigue: el día nuevo llega entero, también lo de las noches, como con Salud', async () => {
    jest.setSystemTime(a(21));
    await programarAvisos(conAnillo());
    // El martes 3 a las 21, de fondo y bloqueado, con las noches guardadas el lunes: todo llega al lunes 9.
    const martes = { hoy: '2026-11-03', pendientes: [] } as unknown as Partial<Estado>;
    jest.setSystemTime(new Date(2026, 10, 3, 21));
    await programarAvisos(conAnillo({ ...martes, ...deFondo() }));
    const dias = (que: (p: (typeof programadas)[number]) => boolean) => [...new Set(programadas.filter(que).map((p) => p.trigger.date.getDate()))];
    const deFondoLlega = [dias((p) => p.content.body === 'Meditar'), dias((p) => p.content.body === 'Leer'), dias((p) => p.content.data.tipo === 'melatonina')];
    expect(deFondoLlega).toEqual([[4, 5, 6, 7, 8, 9], [3, 4, 5, 6, 7, 8, 9], [3, 4, 5, 6, 7, 8, 9]]);
    const lo = deLasNoches();
    await programarAvisos(conAnillo({ ...martes, ...leida(hasta(), HOY) }));
    expect(deLasNoches()).toEqual(lo);
  });

  it('abrir Moss antes de que el anillo sincronice no dice la deuda sin la noche de hoy: sigue la de ayer, hasta que llegue', async () => {
    const abriste = { despertares: { [HOY]: { despertar: 7 * 60 + 3, sabido: 7 * 60 + 5 } } };
    await programarA(a(6), conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    // 7:05: Salud se lee, pero todavía sin la noche de hoy. La de ayer sigue a las 7:45.
    await programarA(a(7, 5), conAnillo({ avisos: {}, ...abriste } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title])).toEqual([[7 * 60 + 45, SIN_LA_NOCHE()]]);
    // 7:20 el anillo sincroniza: la de hoy, en su lugar.
    await programarA(a(7, 20), conAnillo({ avisos: {}, ...leida(hasta(HOY)), ...abriste } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title === SIN_LA_NOCHE()])).toEqual([[7 * 60 + 45, false]]);
  });

  it('la deuda que otro aviso corrió suena una vez, a su hora de verdad, y con la de hoy si Moss ya la sabe', async () => {
    const meditar = { avisos: { habitos: [{ habito: 'meditar', cuando: { tipo: 'hora', minutos: 7 * 60 + 40 }, dias: [] }] } } as unknown as Partial<Estado>;
    // Meditar a las 7:40 corre la de las 7:45 a las 8:00.
    await programarA(a(6), conAnillo(meditar));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title])).toEqual([[8 * 60, SIN_LA_NOCHE()]]);
    // 7:42: abres Moss con la noche de hoy (te despertaste a las 7:41). Antes quedaba la de «sin saber la noche».
    await programarA(a(7, 42), conAnillo({ ...meditar, ...leida(hasta(HOY)), despertares: { [HOY]: { despertar: 7 * 60 + 41, sabido: 7 * 60 + 42 } } }));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title === SIN_LA_NOCHE()])).toEqual([[8 * 60, false]]);
    await programarA(a(9), conAnillo({ ...meditar, ...leida(hasta(HOY)), despertares: { [HOY]: { despertar: 7 * 60 + 41, sabido: 7 * 60 + 42 } } }));
    expect(sonaron.filter((x) => x === '2 deuda')).toHaveLength(1);
  });

  it('la que ya dice la de hoy no se corre: suena a la hora en que quedó, aunque Moss lo sepa antes', async () => {
    const sabe = { ...leida(hasta(HOY)), despertares: { [HOY]: { despertar: 7 * 60 + 50, sabido: 8 * 60 } } } as unknown as Partial<Estado>;
    await programarA(a(6), conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    const deuda = deHoy('deuda')[0];
    // La de las 7:45 quedó a las 8:25, ya con la de hoy (otro aviso la corrió y después se hizo).
    deuda.trigger.date = a(8, 25);
    delete deuda.content.data.sinLaNoche;
    await programarA(a(8), conAnillo({ avisos: {}, ...sabe } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map(hora)).toEqual([8 * 60 + 25]);
    // La que todavía no sabía la noche, sí: va al saberlo.
    deHoy('deuda')[0].content.data.sinLaNoche = true;
    await programarA(a(8), conAnillo({ avisos: {}, ...sabe } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map(hora)).toEqual([8 * 60 + 2]);
  });

  it('si tu hora de siempre cambia con noches nuevas, la deuda no suena dos veces ni se pierde: cuenta la hora a la que quedó', async () => {
    const sabe = (despertar: number, sabido: number, despertarDeLasNoches: number) =>
      conAnillo({ avisos: {}, ...leida(hasta(HOY, despertarDeLasNoches)), despertares: { [HOY]: { despertar, sabido } } } as unknown as Partial<Estado>);
    // Programada con noches que terminan a las 7:00 (a las 7:45); sonó, y a las 7:50 llegan noches que terminan a las 7:20.
    await programarA(a(6), conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    await programarA(a(7, 50), sabe(7 * 60 + 48, 7 * 60 + 50, 13 * 60 + 20));
    expect([sonaron.filter((x) => x === '2 deuda').length, deHoy('deuda').length]).toEqual([1, 0]);
    // Al revés: programada a las 8:05 (noches de las 7:20); a las 7:55 llegan las de las 7:00 y Moss sabe la noche: va la de hoy.
    programadas.length = 0;
    sonaron.length = 0;
    await programarA(a(6), conAnillo({ avisos: {}, ...leida(hasta(sumarDias(HOY, -1), 13 * 60 + 20)) } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map(hora)).toEqual([8 * 60 + 5]);
    await programarA(a(7, 55), sabe(7 * 60 + 54, 7 * 60 + 55, 13 * 60));
    expect(deHoy('deuda').map((p) => [hora(p), p.content.title === SIN_LA_NOCHE()])).toEqual([[7 * 60 + 57, false]]);
  });

  it('en el borde del minuto no suenan dos: si la de las 7:45 ya sonó, saberlo a las 7:44 y pico no arma otra', async () => {
    await programarA(a(6), conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    // 7:45:00,6: la de las 7:45 acaba de sonar; Moss anotó que lo supo a las 7:44 (en minutos enteros).
    await programarA(new Date(2026, 10, 2, 7, 45, 0, 600), conAnillo({ avisos: {}, ...leida(hasta(HOY)), despertares: { [HOY]: { despertar: 7 * 60 + 44, sabido: 7 * 60 + 44 } } } as unknown as Partial<Estado>));
    expect([sonaron.filter((x) => x === '2 deuda').length, deHoy('deuda').length]).toEqual([1, 0]);
  });

  it('la deuda que nunca quedó programada suena igual hoy: recién prendida, o la primera vez con esta versión aunque sea después de su hora', async () => {
    const deudas = () => [...sonaron.filter((x) => x === '2 deuda'), ...deHoy('deuda').map(() => 'pendiente')];
    // Estaba apagada; a las 7:10 la prendes, con la noche de hoy y tu despertar (7:00) sabidos: suena al saberlo.
    await programarA(a(6), conAnillo({ avisos: { deuda: { encendido: false } } } as unknown as Partial<Estado>));
    const sabido = (h: number, m: number) => ({ despertares: { [HOY]: { despertar: h * 60 + m - 10, sabido: h * 60 + m } } });
    await programarA(a(7, 10), conAnillo({ avisos: {}, ...leida(hasta(HOY)), ...sabido(7, 10) } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map(hora)).toEqual([7 * 60 + 12]);
    await programarA(a(12), conAnillo({ avisos: {}, ...leida(hasta(HOY)), ...sabido(7, 10) } as unknown as Partial<Estado>));
    expect(deudas()).toEqual(['2 deuda']);
    // La primera vez con esta versión: la de antes no dejaba la deuda programada de antes. Abres Moss a las 8:40, después
    // de las 7:45: suena una vez, al saberlo.
    programadas.length = 0;
    sonaron.length = 0;
    await programarA(a(6), conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    programadas.splice(0, programadas.length, ...programadas.filter((p) => p.content.data.tipo !== 'deuda'));
    await programarA(a(8, 40), conAnillo({ avisos: {}, ...leida(hasta(HOY)), ...sabido(8, 40) } as unknown as Partial<Estado>));
    expect(deHoy('deuda').map(hora)).toEqual([8 * 60 + 42]);
    await programarA(a(12), conAnillo({ avisos: {}, ...leida(hasta(HOY)), ...sabido(8, 40) } as unknown as Partial<Estado>));
    expect(deudas()).toEqual(['2 deuda']);
  });

  it('con el despertador de Moss, la deuda sin saber la noche cuenta desde él', async () => {
    jest.setSystemTime(a(21));
    const deudas = () => programadas.filter((p) => p.content.data.tipo === 'deuda').map((p) => [p.trigger.date.getDate(), hora(p)]).slice(0, 3);
    // El miércoles 4 suena a las 9:00: ese día, a las 9:45.
    mockAlarma = { hora: 9, minuto: 0, dias: [diaDeLaSemana('2026-11-04')] };
    await programarAvisos(conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    expect(deudas()).toEqual([[3, 7 * 60 + 45], [4, 9 * 60 + 45], [5, 7 * 60 + 45]]);
    // Uno de una sola vez, el día en que va a sonar: el lunes a las 21, uno a las 8:30 es del martes.
    mockAlarma = { hora: 8, minuto: 30, dias: [] };
    await programarAvisos(conAnillo({ avisos: {} } as unknown as Partial<Estado>));
    expect(deudas()).toEqual([[3, 9 * 60 + 15], [4, 7 * 60 + 45], [5, 7 * 60 + 45]]);
  });

  it('«Acostarte» nombra la deuda solo la noche en que se sabe: hoy, con la noche de hoy; los días que vienen, sin número', async () => {
    // El 5/11 y el 9/11 son de los que la nombran (una noche de cada cuatro). Cinco horas cada noche: mucha deuda.
    const JUEVES = '2026-11-05';
    const cortas = (dia: string) => Array.from({ length: 14 }, (_, i) => delAnillo(sumarDias(dia, -i), 13 * 60, 300));
    // El texto que nombra la deuda, en el idioma de la app: «Falta media hora. Tienes 3 h de deuda de sueño…».
    const conDeuda = new RegExp(`^${t('recordatorios.acostarte.conDeuda', { tiempo: '§', deuda: '§' }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/§/g, '.+')}$`);
    const acostarte = () => programadas.filter((p) => p.content.data.tipo === 'dormir').map((p) => [p.trigger.date.getDate(), conDeuda.test(p.content.body)]);
    const el = (dia: number) => acostarte().find(([d]) => d === dia)?.[1];
    jest.setSystemTime(new Date(2026, 10, 5, 12));
    const conDormir = { hoy: JUEVES, avisos: { dormir: { encendido: true } } } as unknown as Partial<Estado>;
    await programarAvisos(conAnillo({ ...conDormir, ...leida(cortas(JUEVES), JUEVES) }));
    expect([el(5), el(9)]).toEqual([true, false]);
    // Sin la noche de hoy (el anillo no sincronizó), tampoco hoy: diría una que no es.
    await programarAvisos(conAnillo({ ...conDormir, ...leida(cortas(sumarDias(JUEVES, -1)), JUEVES) }));
    expect([el(5), el(9)]).toEqual([false, false]);
  });
});

describe('la primera vez con esta versión (la OTA del 27/11/2026), antes de guardar las noches', () => {
  const delAnillo = (clave: string): Noche => ({
    clave, fuente: { id: 'darings', nombre: 'Da Rings', tipo: 'otra' }, conEtapas: false, dormirse: 5 * 60, despertar: 13 * 60, enCama: null,
    dormido: 420, despierto: 60, despertares: 1, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: 420 }, siestas: 0, tramos: [], intervalos: [],
    confianza: { duracion: 'media', horario: 'media', despertares: 'baja', etapas: null, enCama: null },
  } as unknown as Noche);
  const noches = Array.from({ length: 14 }, (_, i) => delAnillo(sumarDias(HOY, -i)));
  const MEDITAR: Habito = { ...entrenar, id: 'meditar', nombre: 'Meditar', icono: 'leaf' };
  const LEER: Habito = { ...entrenar, id: 'leer', nombre: 'Leer', icono: 'book' };
  const AVISOS = {
    dormir: { encendido: true },
    habitos: [{ habito: 'meditar', cuando: { tipo: 'hora', minutos: 18 * 60 }, dias: [] }, { habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }],
  };
  const conAnillo = (extra: Partial<Estado> = {}) => estado({
    perfil: { nacimiento: 1994 }, salud: { dia: HOY, noches }, nochesDeSalud: nochesParaGuardar(noches, HOY), recordatorios: [], habitos: [MEDITAR, LEER], avisos: AVISOS, ...extra,
  } as unknown as Partial<Estado>);
  /** Recién llegada la OTA: Salud sin leer y todavía nada guardado. */
  const conLaOta = (extra: Partial<Estado> = {}) => conAnillo({ salud: null, nochesDeSalud: null, ...extra } as unknown as Partial<Estado>);
  const DE_LAS_NOCHES = ['dormir', 'deuda', 'melatonina', 'revoluciones', 'gafas', 'descarga', 'luces'];
  /** Cada aviso de las noches entero, como está en iOS: identificador, hora y contenido. */
  const deLasNoches = () => JSON.stringify(programadas.filter((p) => DE_LAS_NOCHES.includes(p.content.data.tipo) || p.content.body === 'Leer'));

  beforeEach(async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(12));
    programadas.length = 0;
    mockLlegados = [];
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
    // La versión de antes dejó la semana programada, sin lo que la nueva suma (la deuda de antes de saber que te despertaste).
    await programarAvisos(conAnillo());
    programadas.splice(0, programadas.length, ...programadas.filter((p) => p.content.data.tipo !== 'deuda'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('de fondo y bloqueado, lo de las noches queda como está, y lo demás se rehace: antes la primera corrida de fondo lo borraba', async () => {
    const antes = deLasNoches();
    expect(JSON.parse(antes).length).toBeGreaterThan(15);
    jest.setSystemTime(a(15));
    await programarAvisos(conLaOta({ marcas: new Map([[claveDeMarca('meditar', HOY), { hecho: true, momento: a(14).toISOString() }]]) as Estado['marcas'] }));
    expect(deLasNoches()).toEqual(antes);
    // Lo demás, rehecho: meditar ya hecho hoy no suena, y llega a los días que siguen.
    expect(programadas.filter((p) => p.content.body === 'Meditar').map((p) => p.trigger.date.getDate())).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('lo que se apagó, el hábito que ya no está y lo hecho hoy salen; al leer Salud, se guardan las noches y todo se arma como siempre', async () => {
    jest.setSystemTime(a(15));
    // Leer, hecho hoy: el de hoy sale y los otros días quedan como estaban.
    const leer = () => programadas.filter((p) => p.content.body === 'Leer').map((p) => p.trigger.date.getDate());
    expect(leer()).toEqual([2, 3, 4, 5, 6, 7, 8]);
    await programarAvisos(conLaOta({ marcas: new Map([[claveDeMarca('leer', HOY), { hecho: true, momento: a(14).toISOString() }]]) as Estado['marcas'] }));
    expect(leer()).toEqual([3, 4, 5, 6, 7, 8]);
    // Sin acostarte y sin leer (el hábito se borró): nada de eso queda de lo de antes. Tu periodo, sí.
    await programarAvisos(conLaOta({ avisos: { ...AVISOS, dormir: { encendido: false } }, habitos: [MEDITAR] } as unknown as Partial<Estado>));
    expect(programadas.filter((p) => p.content.data.tipo === 'dormir' || p.content.body === 'Leer')).toEqual([]);
    expect(programadas.filter((p) => p.content.data.tipo === 'melatonina')).toHaveLength(7);
    // Abres Moss: Salud se lee, las noches quedan guardadas y la semana se arma entera, con la deuda de cada mañana.
    jest.setSystemTime(a(16));
    await programarAvisos(conAnillo());
    expect(programadas.filter((p) => p.content.data.tipo === 'deuda').map((p) => p.trigger.date.getDate())).toEqual([3, 4, 5, 6, 7, 8]);
    expect(programadas.filter((p) => p.content.body === 'Leer').map((p) => p.trigger.date.getDate())).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('una programación no deja media semana, aunque se corte', () => {
  const delAnillo = (clave: string): Noche => ({
    clave, fuente: { id: 'darings', nombre: 'Da Rings', tipo: 'otra' }, conEtapas: false, dormirse: 5 * 60, despertar: 13 * 60, enCama: null,
    dormido: 420, despierto: 60, despertares: 1, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: 420 }, siestas: 0, tramos: [], intervalos: [],
    confianza: { duracion: 'media', horario: 'media', despertares: 'baja', etapas: null, enCama: null },
  } as unknown as Noche);
  const noches = Array.from({ length: 14 }, (_, i) => delAnillo(sumarDias(HOY, -i)));
  const deFondo = (extra: Partial<Estado> = {}) => estado({
    perfil: { nacimiento: 1994 }, salud: null, nochesDeSalud: nochesParaGuardar(noches, HOY), recordatorios: null, habitos: [], avisos: { dormir: { encendido: true } }, ...extra,
  } as unknown as Partial<Estado>);
  /** Lo que tiene iOS en cada paso de una programación (antes de cada cambio). */
  const pasos: string[][] = [];
  let enCadaPaso: (() => void) | null = null;
  const ids = () => programadas.map((p) => p.identifier ?? '');
  const notificaciones = jest.requireMock('expo-notifications') as Record<'scheduleNotificationAsync' | 'cancelScheduledNotificationAsync', jest.Mock<(...args: never[]) => unknown>>;
  const reales: Partial<Record<keyof typeof notificaciones, (...args: never[]) => unknown>> = {};

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(21));
    programadas.length = 0;
    pasos.length = 0;
    mockPremium = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };
    for (const f of ['scheduleNotificationAsync', 'cancelScheduledNotificationAsync'] as const) {
      const real = notificaciones[f].getMockImplementation()!;
      reales[f] = real;
      notificaciones[f].mockImplementation(async (...args: never[]) => {
        pasos.push(ids());
        enCadaPaso?.();
        return real(...args);
      });
    }
  });
  afterEach(() => {
    jest.useRealTimers();
    enCadaPaso = null;
    for (const f of ['scheduleNotificationAsync', 'cancelScheduledNotificationAsync'] as const) notificaciones[f].mockImplementation(reales[f]!);
  });

  it('si iOS suspende a Moss en cualquier momento, queda la semana de antes con parte de la nueva: lo que sigue nunca falta', async () => {
    await programarAvisos(deFondo());
    const antes = new Set(ids());
    // El martes a las 21, de fondo: cambia el texto de casi todo y suma el lunes 9.
    jest.setSystemTime(new Date(2026, 10, 3, 21));
    pasos.length = 0;
    await programarAvisos(deFondo({ hoy: '2026-11-03' } as unknown as Partial<Estado>));
    const despues = new Set(ids());
    const siguen = [...antes].filter((x) => despues.has(x));
    expect(siguen.length).toBeGreaterThan(10);
    expect(pasos.length).toBeGreaterThan(siguen.length);
    for (const paso of pasos) expect(siguen.filter((x) => !paso.includes(x))).toEqual([]);
  });

  it('si llega otra mientras programa (la tarea de fondo y el almacén, casi juntas), no se pisan: queda la semana entera', async () => {
    await programarAvisos(deFondo());
    jest.setSystemTime(a(22, 30));
    pasos.length = 0;
    let segunda: Promise<void> | undefined;
    enCadaPaso = () => {
      if (pasos.length !== 6) return;
      enCadaPaso = null;
      segunda = programarAvisos(deFondo());
    };
    await programarAvisos(deFondo());
    await segunda;
    expect(segunda).toBeDefined();
    // Quedó la semana entera: una corrida más, sola, no cambia nada.
    const quedo = JSON.stringify(programadas);
    await programarAvisos(deFondo());
    expect(JSON.stringify(programadas)).toBe(quedo);
    expect(new Set(programadas.filter((p) => p.content.data.tipo === 'melatonina').map((p) => p.trigger.date.getDate()))).toEqual(new Set([3, 4, 5, 6, 7, 8]));
  });
});

describe('lo del sueño de los avisos', () => {
  /** Una noche de 23:30 a 7:00 en la hora del teléfono, confirmada (sin reloj). */
  const local = (clave: string, hora: number, minuto = 0) => {
    const [y, m, d] = clave.split('-').map(Number);
    return new Date(y, m - 1, d, hora, minuto).toISOString();
  };
  const noches = new Map(Array.from({ length: 14 }, (_, i) => {
    const fecha = sumarDias(HOY, -i);
    return [fecha, { fecha, actualizado: '2026-11-02T09:00:00.000Z', hora: { dormirse: local(sumarDias(fecha, -1), 23, 30), despertar: local(fecha, 7), origen: 'confirmada' as const, confianza: 'media' as const } }];
  }));
  const perfil = { nacimiento: 1994 };

  it('con 7 h elegidas, la deuda y la hora de dormir usan 7 h, y sin reloj no se resta un rato despierto', () => {
    const sinElegir = suenoParaAvisos(estado({ perfil, noches } as unknown as Partial<Estado>))!;
    const conSiete = suenoParaAvisos(estado({ perfil, noches, necesidad: 420 } as unknown as Partial<Estado>))!;
    expect([sinElegir.necesidad, conSiete.necesidad]).toEqual([480, 420]);
    // Sin reloj cuenta la noche entera, 7 h 30: con 8 h falta media hora cada noche, con 7 sobra.
    expect(conSiete.despierto).toBe(0);
    expect(sinElegir.deuda).toBeCloseTo(30 * Array.from({ length: 14 }, (_, i) => Math.exp(-i / 7)).reduce((s, p) => s + p, 0), 5);
    expect(conSiete.deuda).toBe(0);
    // El margen para dormirte, de fábrica: la hora de acostarte lo descuenta.
    expect(conSiete.latencia).toBe(15);
    // Sin periodo de melatonina, a dormirse a las 0:00: las 7:00 menos 7 h.
    expect(horasDeSueno(HOY, { ...conSiete, periodo: undefined }).dormir).toBe(24 * 60);
    // Con el periodo (de 23:30 a 7:00, el punto medio son las 3:15), a las 22:45, necesites 7 h u 8: es el de Sueño.
    expect([horasDeSueno(HOY, conSiete).dormir, horasDeSueno(HOY, sinElegir).dormir]).toEqual([22 * 60 + 45, 22 * 60 + 45]);
    // Fuera de lo de tu edad no: a los 32, hasta 9 h.
    expect(suenoParaAvisos(estado({ perfil, noches, necesidad: 600 } as unknown as Partial<Estado>))!.necesidad).toBe(540);
  });
});
