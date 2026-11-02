import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Estado } from '@/almacen/almacen';
import { claveDeMarca } from '@/dominio/dias';
import type { Habito } from '@/dominio/habitos';
import type { MetaGuardada } from '@/dominio/metas';
import type { Registro } from '@/dominio/registros';

const programadas: { content: { body: string; data: { tipo: string } }; trigger: { date: Date } }[] = [];

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
jest.mock('@/lib/premium', () => ({ hayPremium: () => true, suscripcionActual: () => null }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { programarAvisos } = require('./programar') as typeof import('./programar');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { t } = require('@/textos') as typeof import('@/textos');
const MERIENDA = () => t('recordatorios.horario.merienda');

const HOY = '2026-11-02';
const a = (hora: number, minuto = 0) => new Date(2026, 10, 2, hora, minuto);
const entrenar: Habito = { id: 'entrenar', nombre: 'Entrenar', icono: 'dumbbell', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' };
const META = { kcal: 2200, proteina: 150, carbohidratos: 250, grasas: 70, desde: '2026-01-01', gasto: 2200, motivo: 'inicial', momento: '2026-01-01T00:00:00Z' } as MetaGuardada;

const registro = (comida: Registro['comida'], hora: number, proteina: number, kcal: number, nombre = 'Algo'): [string, Registro] => {
  const id = `${comida}-${hora}`;
  return [id, {
    id, dia: HOY, comida, momento: a(hora).toISOString(), planificado: false, actualizado: a(hora).toISOString(),
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

describe('los avisos que se programan', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(a(10));
    programadas.length = 0;
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
});
