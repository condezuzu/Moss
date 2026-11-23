import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen, type Estado } from '@/almacen/almacen';
import { repositorioEnMemoria } from '@/almacen/repositorio';
import type { Constelacion } from '@/datos/catalogo';
import datos from '@/datos/constelaciones.json';
import { horasDeSueno } from '@/dominio/avisos';
import { entrenoParaGuardar } from '@/dominio/cuestionario';
import { claveDeMarca } from '@/dominio/dias';
import { sumarDias } from '@/dominio/fechas';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import type { Habito } from '@/dominio/habitos';
import type { MetaGuardada } from '@/dominio/metas';
import type { Acceso, Suscripcion } from '@/dominio/premium';
import type { Registro } from '@/dominio/registros';

type Disparador = { type: string; date?: Date; year?: number; month?: number; day?: number; hour?: number; minute?: number };
/** Lo programado, con la fecha en que suena (de un disparador de calendario o de fecha). */
const programadas: { content: { title: string; body: string; data: { tipo: string; que?: string; dia?: string }; categoryIdentifier?: string }; trigger: { date: Date }; tipo: string }[] = [];
/** Los avisos que ya llegaron (el centro de notificaciones) y los que Moss sacó de ahí. */
let mockLlegados: { date: number; request: { identifier: string; content: { data: Record<string, unknown> } } }[] = [];
const mockSacados: string[] = [];
/** Lo que dice Apple, para cada test: de fábrica, que hay acceso y ninguna suscripción. `fin`, el último día del regalo, si se sabe. */
let mockPremium: { sabe: boolean; hay: boolean; suscripcion: Suscripcion | null; acceso: Acceso; fin?: string } = { sabe: true, hay: true, suscripcion: null, acceso: 'regalo' };

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    programadas.length = 0;
  }),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationCategoryAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async (p: { content: (typeof programadas)[number]['content']; trigger: Disparador }) => {
    const d = p.trigger;
    const date = d.date ?? new Date(d.year!, d.month! - 1, d.day!, d.hour!, d.minute!);
    programadas.push({ content: p.content, trigger: { date }, tipo: d.type });
    return 'id';
  }),
  getPresentedNotificationsAsync: jest.fn(async () => mockLlegados),
  dismissNotificationAsync: jest.fn(async (id: string) => {
    mockSacados.push(id);
  }),
  SchedulableTriggerInputTypes: { DATE: 'date', CALENDAR: 'calendar' },
}));
jest.mock('@/almacen', () => ({ elAlmacen: jest.fn() }));
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
const { algunAviso, avisosDe, conLoQueFalta, LO_QUE_MUEVE_LOS_AVISOS, programarAvisos, suenoParaAvisos } = require('./programar') as typeof import('./programar');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { t } = require('@/textos') as typeof import('@/textos');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { suenoDe } = require('@/secciones/persona') as typeof import('@/secciones/persona');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextoDeHoy, lineasDeHoy } = require('@/secciones/comida/entreno') as typeof import('@/secciones/comida/entreno');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { energiaDeHoy } = require('@/secciones/sueno/datosDeEnergia') as typeof import('@/secciones/sueno/datosDeEnergia');
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

/** Todo lo que viene prendido de fábrica, apagado a mano: sin esto, suena lo del día que sigue tu despertar. */
const APAGADO = {
  dormir: { encendido: false }, horario: [], deuda: { encendido: false }, melatonina: { encendido: false }, revoluciones: { encendido: false }, luces: { encendido: false },
};

const estado = (extra: Partial<Estado> = {}) => ({
  hoy: HOY, corte: 240, latencia: null, registros: new Map(), recordatorios: [], habitos: [entrenar], marcas: new Map(), perfil: null, salud: null, noches: new Map(),
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

  it('con todo apagado, tampoco', async () => {
    await programarAvisos(estado({ avisos: APAGADO, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('sin tocar nada, suena lo de fábrica: el horario del desayuno, el almuerzo y la cena', async () => {
    await programarAvisos(estado({ avisos: {}, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    const horario = (c: 'almuerzo' | 'cena') => t(`recordatorios.horario.${c}`);
    expect(deHoy().map(([, texto]) => texto)).toEqual(expect.arrayContaining([horario('almuerzo'), horario('cena')]));
    // Lo que elegiste se respeta: con el horario apagado (vacío), no vuelve.
    await programarAvisos(estado({ avisos: { horario: [] }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(deHoy().map(([, texto]) => texto)).not.toContain(horario('almuerzo'));
  });

  it('cada comida suena a tu hora de comer: la que pusiste a mano o la de tu día; la que «No sueles», no suena', async () => {
    const respuestas = { horarios: { desayuno: 7 * 60 + 30, almuerzo: 13 * 60 + 30, merienda: null, cena: 21 * 60 + 30 } };
    const horario = (c: 'almuerzo' | 'merienda' | 'cena') => t(`recordatorios.horario.${c}`);
    await programarAvisos(estado({ avisos: { horario: ['almuerzo', 'merienda', 'cena'] }, respuestas, horasDeComer: { cena: 20 * 60 } } as unknown as Partial<Estado>));
    expect(deHoy().filter(([, texto]) => [horario('almuerzo'), horario('merienda'), horario('cena')].includes(String(texto))))
      .toEqual([[13 * 60 + 30, horario('almuerzo')], [20 * 60, horario('cena')]]);
    // Y lo que muestra Perfil › Avisos: la merienda no está entre las que avisan.
    expect(avisosDe(estado({ avisos: {}, respuestas } as unknown as Partial<Estado>)).horario).toEqual(['desayuno', 'almuerzo', 'cena']);
    expect(avisosDe(estado({ avisos: { horario: ['merienda', 'cena'] }, respuestas } as unknown as Partial<Estado>)).horario).toEqual(['cena']);
  });

  it('con «sin déficit», nunca', async () => {
    await programarAvisos(estado({ perfil: { sinDeficit: true } as Estado['perfil'], avisos: { ...APAGADO, falta: { encendido: true } }, registros: new Map([registro('desayuno', 8, 20, 400)]) }));
    expect(programadas).toEqual([]);
  });

  it('la llave de lo que falta, en Perfil, dice lo mismo que lo que se programa', async () => {
    const llave = (e: Estado) => conLoQueFalta(avisosDe(e), algunAviso({ ...e, avisos: avisosDe(e) }));
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

  it('cada aviso lleva su día, no solo los de una comida: así no depende de la hora que da el teléfono', async () => {
    await programarAvisos(estado());
    const calendario = programadas.filter((p) => p.tipo === 'calendar');
    expect(calendario.length).toBeGreaterThan(0);
    expect(calendario.find((p) => p.content.body === 'Entrenar')?.content.data.dia).toBe(HOY);
    expect(calendario.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.content.data.dia ?? ''))).toBe(true);
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
    await programarAvisos(con(['calculos', 'reflujo'], { avisos: {}, registros: desayuno(), agua }));
    expect(programadas.length).toBeGreaterThan(0);
    expect(programadas.every((p) => !/cálculo|reflujo|riñ|kidney|reflux|stone/i.test(`${p.content.title} ${p.content.body}`))).toBe(true);
  });

  it('con reflujo, la última comida grande viene prendida, y lo elegido se respeta; con un trastorno de la alimentación, pesarte no suena', async () => {
    expect(avisosDe(con(['reflujo'])).ultimaComida).toEqual({ encendido: true });
    expect(avisosDe(con([])).ultimaComida).toBeUndefined();
    expect(avisosDe(con(['reflujo'], { avisos: { ultimaComida: { encendido: false } } })).ultimaComida).toEqual({ encendido: false });
    // Con otro cuidado que la apaga, no se prende.
    expect(avisosDe(con(['reflujo', 'tca'])).ultimaComida).toBeUndefined();
    // Pesarte, cada día a las 8: con un trastorno de la alimentación marcado, no.
    const pesarse = { ...APAGADO, pesarse: { encendido: true, todos: true } };
    jest.setSystemTime(a(6));
    await programarAvisos(con([], { avisos: pesarse }));
    expect(programadas.some((p) => p.content.data.tipo === 'pesarse')).toBe(true);
    await programarAvisos(con(['tca'], { avisos: pesarse }));
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
  const noches = new Map(Array.from({ length: 14 }, (_, i) => {
    const fecha = sumarDias(HOY, -i - 1);
    return [fecha, { fecha, actualizado: '2026-11-01T09:00:00.000Z', hora: { dormirse: local(sumarDias(fecha, -1), 23), despertar: local(fecha, 7), origen: 'confirmada' as const, confianza: 'media' as const } }];
  }));
  const conNoches = (extra: Partial<Estado> = {}) =>
    estado({ perfil: { nacimiento: 1994 }, noches, avisos: { pesarse: { encendido: true, todos: true } }, habitos: [], ...extra } as unknown as Partial<Estado>);
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

  it('antes de saber que te despertaste no suena nada de la mañana; la noche sí', async () => {
    await programarAvisos(conNoches());
    for (const tipo of ['deuda', 'pesarse', 'desayuno']) expect(dice(tipo)).toEqual([]);
    expect(dice('melatonina')).toHaveLength(1);
  });

  it('la noche es la de tu periodo de melatonina: el aviso del periodo y el de acostarte dicen las horas de Sueño', async () => {
    // Durmiendo de 23:00 a 7:00, el punto medio son las 3:00: el periodo va de 22:30 a 23:30 y la melatonina
    // empieza a subir a las 20:30; con 15 minutos de margen, acostarse a las 22:15.
    const e = conNoches();
    const p = periodoDeMelatonina(suenoDe(HOY, e.perfil, e.salud, e.noches, e.necesidad).noches, HOY, { margen: e.latencia });
    expect(p).toMatchObject({ desde: 4 * 60 + 30, hasta: 5 * 60 + 30, acostarse: 4 * 60 + 15 });
    await programarAvisos(e);
    const periodo = dice('melatonina')[0];
    expect([hora(periodo), periodo.content.title]).toEqual([20 * 60 + 30, t('recordatorios.despertar.melatonina.titulo', { desde: '22:30' })]);
    expect(periodo.content.body).toBe(t('recordatorios.despertar.melatonina.texto', { desde: '22:30', hasta: '23:30' }));
    const acostarte = dice('dormir')[0];
    expect([hora(acostarte), acostarte.content.title]).toEqual([21 * 60 + 45, t('recordatorios.acostarte.titulo', { cama: '22:15' })]);
    expect(acostarte.content.body).toContain('22:30 – 23:30');
    expect(acostarte.content.categoryIdentifier).toBe('dormir');
  });

  it('con menos de tres noches en la semana no hay periodo: su aviso no suena y el de acostarte usa la hora de antes', async () => {
    const viejas = new Map([...noches].filter(([fecha]) => fecha < sumarDias(HOY, -6)));
    await programarAvisos(conNoches({ noches: viejas } as unknown as Partial<Estado>));
    expect(dice('melatonina')).toEqual([]);
    const acostarte = dice('dormir')[0];
    // Despertarte a las 7:00 con 8 h: dormirte a las 23:00 y, con el margen, acostarte a las 22:45.
    expect([hora(acostarte), acostarte.content.title]).toEqual([22 * 60 + 15, t('recordatorios.acostarte.titulo', { cama: '22:45' })]);
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
    jest.setSystemTime(a(7, 40));
    await programarAvisos(conNoches({ despertares: { [HOY]: { despertar: 7 * 60 + 30, sabido: 7 * 60 + 40 } } }));
    expect(hora(dice('deuda')[0])).toBe(7 * 60 + 42);
    expect(hora(dice('pesarse')[0])).toBe(8 * 60 + 2);
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
    const con = (pendientes: ReturnType<typeof pendiente>[], avisos: Estado['avisos'] = { descarga: { encendido: true } }) =>
      conNoches({ despertares: { [HOY]: { despertar: 7 * 60 + 30, sabido: 7 * 60 + 40 } }, avisos, pendientes } as unknown as Partial<Estado>);
    await programarAvisos(con([pendiente('1', 'Llamar al dentista'), pendiente('2', 'Pagar la luz', true), pendiente('3', 'Comprar el regalo'), pendiente('4', 'Lo de mañana', false, sumarDias(HOY, 1))]));
    const aviso = dice('pendientes')[0];
    // La deuda a las 7:42 y la pregunta a las 8:02 (sin pesarte): la lista, a las 8:22, con lo de hoy sin tachar.
    expect([hora(dice('desayuno')[0]), hora(aviso)]).toEqual([8 * 60 + 2, 8 * 60 + 22]);
    expect([aviso.content.title, aviso.content.body]).toEqual([t('recordatorios.despertar.pendientes.titulo'), '· Llamar al dentista\n· Comprar el regalo']);
    // El de la noche, con el mismo interruptor. Lo de mañana espera a tu despertar de mañana, como todo lo de la mañana.
    expect(dice('descarga')).toHaveLength(1);
    expect(programadas.filter((p) => p.content.data.tipo === 'pendientes')).toHaveLength(1);
    // Con todo tachado, o con el interruptor apagado, no suena.
    await programarAvisos(con([pendiente('1', 'Llamar al dentista', true)]));
    expect(dice('pendientes')).toEqual([]);
    await programarAvisos(con([pendiente('1', 'Llamar al dentista')], {}));
    expect(dice('pendientes')).toEqual([]);
  });

  it('sin elegir el máximo, prender anotar lo sube solo a 12 y entran todos; el que elegiste a mano queda', async () => {
    jest.setSystemTime(a(7, 40));
    // Con pesarte y la merienda son doce: con diez se quedaban afuera el de anotar y bajar el ritmo.
    const horasDeComer = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60, cena: 20 * 60 };
    const con = (maximoPorDia?: number) => conNoches({
      despertares: { [HOY]: { despertar: 7 * 60 + 30, sabido: 7 * 60 + 40 } }, horasDeComer,
      avisos: { pesarse: { encendido: true, todos: true }, horario: ['desayuno', 'almuerzo', 'merienda', 'cena'], descarga: { encendido: true }, ...(maximoPorDia ? { maximoPorDia } : {}) },
      pendientes: [{ id: '1', texto: 'Pagar la luz', hecho: false, para: HOY }],
    } as unknown as Partial<Estado>);
    // Lo que muestra Perfil › Avisos: el máximo que vale.
    expect([avisosDe(con()).maximoPorDia, avisosDe(con(10)).maximoPorDia, avisosDe(con(8)).maximoPorDia]).toEqual([12, 10, 8]);
    const deHoy = () => programadas.filter((p) => p.trigger.date.getDate() === 2).map((p) => p.content.data.tipo);
    await programarAvisos(con());
    expect(deHoy()).toHaveLength(12);
    expect(deHoy()).toEqual(expect.arrayContaining(['pendientes', 'descarga', 'revoluciones']));
    await programarAvisos(con(10));
    expect(deHoy()).toHaveLength(10);
    expect(deHoy()).not.toContain('descarga');
    expect(deHoy()).not.toContain('revoluciones');
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
