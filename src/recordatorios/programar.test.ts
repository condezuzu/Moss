import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen, type Estado } from '@/almacen/almacen';
import { repositorioEnMemoria } from '@/almacen/repositorio';
import type { Constelacion } from '@/datos/catalogo';
import datos from '@/datos/constelaciones.json';
import { claveDeMarca } from '@/dominio/dias';
import type { Habito } from '@/dominio/habitos';
import type { MetaGuardada } from '@/dominio/metas';
import type { Acceso, Suscripcion } from '@/dominio/premium';
import type { Registro } from '@/dominio/registros';

const programadas: { content: { body: string; data: { tipo: string; que?: string } }; trigger: { date: Date } }[] = [];
/** Lo que dice Apple, para cada test: de fábrica, que hay acceso y ninguna suscripción. */
let mockPremium: { sabe: boolean; hay: boolean; suscripcion: Suscripcion | null; acceso: Acceso } = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    programadas.length = 0;
  }),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async (p: (typeof programadas)[number]) => {
    programadas.push(p);
    return 'id';
  }),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
jest.mock('@/almacen', () => ({ elAlmacen: jest.fn() }));
jest.mock('@/almacen/ascent', () => ({ estadoConAscent: jest.fn(), metaConAscent: (m: unknown) => m, suscribirConAscent: jest.fn() }));
jest.mock('@/lib/premium', () => ({
  seSabeElAcceso: () => mockPremium.sabe,
  hayPremium: () => mockPremium.hay,
  suscripcionActual: () => mockPremium.suscripcion,
  accesoActual: () => mockPremium.acceso,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { algunAviso, conLoQueFalta, LO_QUE_MUEVE_LOS_AVISOS, programarAvisos } = require('./programar') as typeof import('./programar');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { t } = require('@/textos') as typeof import('@/textos');
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

const estado = (extra: Partial<Estado> = {}) => ({
  hoy: HOY, corte: 240, latencia: null, registros: new Map(), recordatorios: [], habitos: [entrenar], marcas: new Map(), perfil: null, salud: null, noches: new Map(),
  metas: [META], pesos: [], entreno: null, agua: new Map(), numeros: true,
  avisos: { horario: { merienda: 17 * 60 + 30 }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 17 * 60 + 35 }, dias: [] }] },
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
    await programarAvisos(estado({ avisos: { habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    const falta = deHoy().find(([, texto]) => /proteína|protein/.test(String(texto)));
    expect(falta).toBeDefined();
    expect(falta![0]).toBe(19 * 60);
    expect(falta![1]).toMatch(/130 g/);
  });

  it('apagado en Perfil, no hay aviso de lo que falta', async () => {
    await programarAvisos(estado({ avisos: { falta: { encendido: false }, habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(deHoy().some(([, texto]) => /proteína|protein/.test(String(texto)))).toBe(false);
  });

  it('sin ningún aviso elegido, tampoco', async () => {
    await programarAvisos(estado({ avisos: {}, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('con «sin déficit», nunca', async () => {
    await programarAvisos(estado({ perfil: { sinDeficit: true } as Estado['perfil'], avisos: { falta: { encendido: true } }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('la llave de lo que falta, en Perfil, dice lo mismo que lo que se programa', async () => {
    const llave = (e: Estado) => conLoQueFalta(e.avisos, algunAviso(e));
    const desayuno = new Map([registro('desayuno', 8, 20, 400)]);
    // Sin ningún aviso elegido se ve apagada, y no suena.
    const nada = estado({ avisos: {}, registros: desayuno });
    expect(llave(nada)).toBe(false);
    await programarAvisos(nada);
    expect(programadas).toEqual([]);
    // Prendida a mano, suena sola.
    const sola = estado({ avisos: { falta: { encendido: true } }, registros: desayuno });
    expect([algunAviso(sola), llave(sola)]).toEqual([false, true]);
    await programarAvisos(sola);
    expect(faltasDeHoy()).toEqual([[19 * 60, 'proteina']]);
    // Con otro aviso prendido, sin elegirla, anda.
    expect(llave(estado())).toBe(true);
  });

  it('a la noche no repite lo que dijo a la tarde, aunque después se anote algo con una hora de antes', async () => {
    const desayuno = registro('desayuno', 8, 20, 400);
    jest.setSystemTime(a(17));
    await programarAvisos(estado({ avisos: { habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([desayuno]) }));
    expect(faltasDeHoy()).toEqual([[19 * 60, 'proteina']]);
    // A las 19:30 dice «el almuerzo comí pollo», que va a las 13, y cena a las 21.
    const almuerzo = registro('almuerzo', 13, 60, 600, 'Pollo', a(19, 30));
    const cena = registro('cena', 21, 40, 500);
    jest.setSystemTime(a(21, 30));
    await programarAvisos(estado({ avisos: { habitos: [{ habito: 'entrenar', cuando: { tipo: 'hora', minutos: 12 * 60 }, dias: [] }] }, registros: new Map([desayuno, almuerzo, cena]) }));
    // Lo de la proteína ya lo dijo: a la noche, las calorías.
    expect(faltasDeHoy()).toEqual([[22 * 60 + 15, 'calorias']]);
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
    expect(cambio(() => almacen.ponerCalidad('baja'))).toBe(false);
  });
});
