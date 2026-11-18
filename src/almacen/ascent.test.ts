// Lo de Ascent en el teléfono, con un servidor de mentira (el de verdad se prueba con
// `npm run supabase:verificar`).

import { describe, expect, it, jest } from '@jest/globals';

import type { RutinaDeAscent, SesionDeAscent } from '../dominio/conAscent';
import { crearAscent, type RemotoDeAscent } from './ascent';

jest.mock('./index', () => ({ elAlmacen: () => undefined, oirLaSesion: () => () => {} }));
jest.mock('@/lib/ascentRemoto', () => ({}));

const HOY = '2026-10-26';
const sesion = (fecha: string): SesionDeAscent => ({ fecha, series: 16, kilos: 1000, minutos: 55, ejercicios: [{ nombre: 'Sentadilla', musculos: ['piernas'], series: [{ kilos: 100, reps: 5 }] }] });

const RUTINA: RutinaDeAscent = {
  nombre: 'Entrenamiento 1',
  dias: [{ dia: 1, descanso: false, ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', musculos: ['piernas'], series: 4, reps: 5 }] }, { dia: 2, descanso: true, ejercicios: [] }],
};

function servidor(vinculada = false) {
  const s = {
    vinculada,
    conexion: true,
    /** La base ya tiene 0013_ascent_rutina.sql (la OTA puede llegar antes). */
    conRutina: true,
    rutina: RUTINA as RutinaDeAscent | null,
    pedidos: [] as string[],
    remoto: null as unknown as RemotoDeAscent,
  };
  const red = () => {
    if (!s.conexion) throw new Error('Failed to fetch');
  };
  const nueva = (funcion: string) => {
    red();
    if (!s.conRutina) throw new Error(`moss.${funcion}: PGRST202`);
  };
  s.remoto = {
    estadoDelVinculo: async () => (red(), s.vinculada ? { vinculada: true, nombre: 'agustin', desde: '2026-10-03T12:00:00.000Z' } : { vinculada: false, nombre: null, desde: null }),
    vincular: async (token) => {
      if (token !== 'bueno') return { ok: false, error: 'vencida' };
      s.vinculada = true;
      return { ok: true, nombre: 'agustin' };
    },
    desvincular: async () => {
      red();
      s.vinculada = false;
    },
    sesionesDeAscent: async (desde) => (red(), s.pedidos.push(desde), [sesion('2026-10-24'), sesion(HOY)].filter((x) => x.fecha >= desde)),
    marcasDeAscent: async () => [{ ejercicio: 'Sentadilla', fecha: '2026-10-01', kilos: 105, reps: 5 }],
    pesosCompartidos: async () => [{ fecha: '2026-10-25', kg: 80, de: 'ascent' }],
    rutinaDeAscent: async () => (nueva('ascent_rutina'), s.vinculada ? s.rutina : null),
    ajustesDeAscent: async () => (nueva('ascent_ajustes'), s.vinculada ? { umbral: 3, racha: 37 } : null),
  };
  return s;
}

function crear(remoto: RemotoDeAscent, guardado: { texto: string | null } = { texto: null }) {
  return crearAscent({
    remoto,
    guardado: { leer: async () => guardado.texto, escribir: async (t) => void (guardado.texto = t) },
    hoy: () => HOY,
    ahora: () => new Date('2026-10-26T15:00:00.000Z'),
  });
}

describe('lo de Ascent en el teléfono', () => {
  it('sin vincular no pide nada más que el vínculo; vincular la deja vinculada y trae lo de Ascent', async () => {
    const s = servidor();
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    expect(a.estado()).toMatchObject({ conCuenta: true, vinculo: { vinculada: false }, sesiones: [] });
    expect(s.pedidos).toEqual([]);
    expect(await a.vincular('malo')).toEqual({ ok: false, error: 'vencida' });
    expect(a.estado().vinculo.vinculada).toBe(false);
    expect(await a.vincular('bueno')).toEqual({ ok: true, nombre: 'agustin' });
    expect(a.estado().vinculo).toMatchObject({ vinculada: true, nombre: 'agustin' });
    await a.refrescar();
    expect(a.estado().sesiones.map((x) => x.fecha)).toEqual(['2026-10-24', HOY]);
    expect(a.estado().marcas).toHaveLength(1);
    expect(a.estado().pesos).toHaveLength(1);
  });

  it('lo que queda guardado vuelve al abrir, solo para la misma cuenta, y sin conexión queda lo que había', async () => {
    const s = servidor(true);
    const guardado = { texto: null as string | null };
    const a = crear(s.remoto, guardado);
    await a.ponerSesion('u-1');
    expect(a.estado().sesiones).toHaveLength(2);
    // Las sesiones viejas se guardan sin las series.
    expect(guardado.texto).toContain('Sentadilla');

    s.conexion = false;
    const otra = crear(s.remoto, guardado);
    await otra.ponerSesion('u-1');
    expect(otra.estado()).toMatchObject({ vinculo: { vinculada: true }, sesiones: [expect.objectContaining({ fecha: '2026-10-24' }), expect.objectContaining({ fecha: HOY })] });

    const deOtraCuenta = crear(s.remoto, guardado);
    await deOtraCuenta.ponerSesion('u-2');
    expect(deOtraCuenta.estado()).toMatchObject({ vinculo: { vinculada: false }, sesiones: [] });
  });

  it('si al abrir ya no hay sesión (la cuenta se borró o se cerró en otro lado), lo guardado de Ascent se va y la meta vuelve a ser la de Moss', async () => {
    const s = servidor(true);
    const guardado = { texto: null as string | null };
    await crear(s.remoto, guardado).ponerSesion('u-1');
    const alAbrir = crear(s.remoto, guardado);
    await alAbrir.iniciar();
    // Mientras no se sabe de quién es la sesión, vale lo guardado: no parpadea.
    expect(alAbrir.estado().vinculo.vinculada).toBe(true);
    await alAbrir.ponerSesion(null);
    expect(alAbrir.estado()).toMatchObject({ conCuenta: false, vinculo: { vinculada: false }, sesiones: [], pesos: [] });

    // Y si la sesión se sabe antes de leer lo guardado, tampoco vuelve.
    const antesDeLeer = crear(s.remoto, guardado);
    await crear(s.remoto, guardado).ponerSesion('u-1');
    await antesDeLeer.ponerSesion(null);
    await antesDeLeer.iniciar();
    expect(antesDeLeer.estado().vinculo.vinculada).toBe(false);
  });

  it('la segunda vez pide desde una semana antes del último día, no todo de nuevo', async () => {
    const s = servidor(true);
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    await a.refrescar();
    expect(s.pedidos[0]).toBe('2026-01-01');
    expect(s.pedidos[1]).toBe('2026-10-19');
    expect(a.estado().sesiones.map((x) => x.fecha)).toEqual(['2026-10-24', HOY]);
  });

  it('desvincular saca lo de Ascent; sin conexión no cambia nada y tira el error', async () => {
    const s = servidor(true);
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    s.conexion = false;
    await expect(a.desvincular()).rejects.toThrow('Failed to fetch');
    expect(a.estado().vinculo.vinculada).toBe(true);
    s.conexion = true;
    await a.desvincular();
    expect(a.estado()).toMatchObject({ vinculo: { vinculada: false }, sesiones: [], marcas: [], pesos: [] });
  });

  it('si la desvincularon desde Ascent, al refrescar se saca todo; al cerrar sesión también', async () => {
    const s = servidor(true);
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    s.vinculada = false;
    await a.refrescar();
    expect(a.estado()).toMatchObject({ vinculo: { vinculada: false }, sesiones: [] });
    s.vinculada = true;
    await a.refrescar();
    await a.ponerSesion(null);
    expect(a.estado()).toMatchObject({ conCuenta: false, vinculo: { vinculada: false }, sesiones: [] });
  });

  it('lo dormido se junta solo con el vínculo; cómo te sientes vale ese día y queda guardado', async () => {
    const s = servidor();
    const guardado = { texto: null as string | null };
    const a = crear(s.remoto, guardado);
    await a.ponerSesion('u-1');
    a.anotarNoches([{ clave: '2026-10-25', dormido: 420 }]);
    expect(a.estado().noches).toEqual({});
    await a.vincular('bueno');
    a.anotarNoches([{ clave: '2026-10-25', dormido: 420.4 }, { clave: '2024-01-01', dormido: 400 }]);
    a.ponerComoTeSientes(7);
    expect(a.estado().noches).toEqual({ '2026-10-25': 420 });
    expect(a.estado().siente).toEqual({ fecha: HOY, n: 7 });
    const otra = crear(s.remoto, guardado);
    await otra.ponerSesion('u-1');
    expect(otra.estado().siente).toEqual({ fecha: HOY, n: 7 });
    otra.ponerComoTeSientes(null);
    expect(otra.estado().siente).toBeNull();
  });

  it('lo de hace más de 18 semanas queda sin las series pero con los ejercicios; lo guardado por la build 6 se vuelve a pedir entero', async () => {
    const s = servidor(true);
    const vieja = { ...sesion('2026-05-04'), ejercicios: [{ nombre: 'Sentadilla', musculos: ['piernas'], series: [{ kilos: 90, reps: 5 }] }] };
    s.remoto.sesionesDeAscent = async (desde) => (s.pedidos.push(desde), [vieja, sesion(HOY)]);
    const guardado = { texto: null as string | null };
    await crear(s.remoto, guardado).ponerSesion('u-1');
    const g = JSON.parse(guardado.texto!);
    expect(g.sesiones[0].ejercicios).toEqual([{ nombre: 'Sentadilla', musculos: ['piernas'], series: [] }]);
    expect(g.sesiones[1].ejercicios[0].series).toHaveLength(1);
    guardado.texto = JSON.stringify({ ...g, conSeries: undefined, avisos: [{ ejercicio: 'Sentadilla', fecha: HOY }] });
    s.pedidos.length = 0;
    const otra = crear(s.remoto, guardado);
    await otra.ponerSesion('u-1');
    expect(s.pedidos).toEqual(['2026-01-01']);
    expect('avisos' in otra.estado()).toBe(false);
  });

  it('la rutina y los ajustes llegan y quedan guardados; sin sus funciones en la base, lo demás llega igual y queda lo que había', async () => {
    // La OTA antes que la migración: la base no tiene las funciones nuevas.
    const s = servidor(true);
    s.conRutina = false;
    const guardado = { texto: null as string | null };
    const a = crear(s.remoto, guardado);
    await a.ponerSesion('u-1');
    expect(a.estado()).toMatchObject({ vinculo: { vinculada: true }, rutina: null, ajustes: null });
    expect(a.estado().sesiones).toHaveLength(2);
    expect(a.estado().pesos).toHaveLength(1);

    // Con la migración aplicada, llegan.
    s.conRutina = true;
    await a.refrescar();
    expect(a.estado().rutina).toEqual(RUTINA);
    expect(a.estado().ajustes).toEqual({ umbral: 3, racha: 37 });
    // Vuelven al abrir, aunque no haya conexión; y si la base deja de contestar por la rutina, queda la de antes.
    s.conexion = false;
    const otra = crear(s.remoto, guardado);
    await otra.ponerSesion('u-1');
    expect(otra.estado()).toMatchObject({ rutina: RUTINA, ajustes: { umbral: 3, racha: 37 } });
    s.conexion = true;
    s.conRutina = false;
    await otra.refrescar();
    expect(otra.estado()).toMatchObject({ rutina: RUTINA, ajustes: { umbral: 3, racha: 37 } });
    // Sin rutina activa en Ascent, se va.
    s.conRutina = true;
    s.rutina = null;
    await otra.refrescar();
    expect(otra.estado().rutina).toBeNull();
    // Desvincular las saca.
    await otra.desvincular();
    expect(otra.estado()).toMatchObject({ rutina: null, ajustes: null });
  });

  it('lo guardado por la build 6 (sin rutina ni ajustes) sigue andando, y lo guardado roto se descarta', async () => {
    const s = servidor(true);
    s.conexion = false;
    const g = { v: 1, usuario: 'u-1', conSeries: 126, vinculo: { vinculada: true, nombre: 'agustin', desde: '2026-10-03T12:00:00.000Z' }, sesiones: [sesion(HOY)], marcas: [], pesos: [], desde: '2026-01-01', llego: null, noches: {}, siente: null };
    const deLaBuild6 = crear(s.remoto, { texto: JSON.stringify(g) });
    await deLaBuild6.ponerSesion('u-1');
    expect(deLaBuild6.estado()).toMatchObject({ vinculo: { vinculada: true }, rutina: null, ajustes: null, sesiones: [expect.objectContaining({ fecha: HOY })] });
    const roto = crear(s.remoto, { texto: JSON.stringify({ ...g, rutina: { dias: 'x' }, ajustes: { umbral: 5, racha: 3 } }) });
    await roto.ponerSesion('u-1');
    expect(roto.estado()).toMatchObject({ rutina: null, ajustes: null });
  });
});
