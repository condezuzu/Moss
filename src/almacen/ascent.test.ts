// Lo de Ascent en el teléfono, con un servidor de mentira (el de verdad se prueba con
// `npm run supabase:verificar`).

import { describe, expect, it, jest } from '@jest/globals';

import type { RutinaDeAscent, SesionDeAscent } from '../dominio/conAscent';
import { crearAscent, falloDeMeta, gimnasioGuardado, type MetaPedida, type RemotoDeAscent } from './ascent';

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

describe('las metas de fuerza, sin esperar al servidor', () => {
  /** El servidor de mentira con las metas: guardar contesta cuando se lo suelta, así se mira lo de mientras tanto. */
  function conMetas() {
    const s = servidor(true);
    const m = { ...s, enLaBase: [] as { id: string; ejercicio: string; kilos: number; reps: number }[], soltar: () => {}, proxima: 1 };
    m.remoto = {
      ...s.remoto,
      metasDeFuerza: async () => m.enLaBase.map((x) => ({ ...x })),
      guardarMetaDeFuerza: (x) => new Promise((listo, mal) => {
        m.soltar = () => {
          if (!m.conexion) return mal(new Error('Failed to fetch'));
          const id = x.id ?? `m-${m.proxima++}`;
          const meta = { id, ejercicio: x.ejercicio, kilos: x.kilos, reps: x.reps };
          // Como la base, que las da por orden de creación: la que se cambia queda en su lugar.
          m.enLaBase = m.enLaBase.some((y) => y.id === id) ? m.enLaBase.map((y) => (y.id === id ? meta : y)) : [...m.enLaBase, meta];
          listo(id);
        };
      }),
      borrarMetaDeFuerza: async () => true,
    };
    return m;
  }
  const PRESS = { ejercicio: 'press_militar_mancuernas', kilos: 70, reps: 8 };

  it('una meta nueva queda al instante, pendiente, y después con el id del servidor; lo pendiente no se guarda en el teléfono', async () => {
    const s = conMetas();
    const guardado = { texto: null as string | null };
    const a = crear(s.remoto, guardado);
    await a.ponerSesion('u-1');
    const guardando = a.guardarMeta(PRESS);
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'pendiente:1', pendiente: true }]);
    a.ponerComoTeSientes(7);
    expect(guardado.texto).not.toContain('pendiente');
    s.soltar();
    await guardando;
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    expect(guardado.texto).toContain('"m-1"');
  });

  it('si no se guarda, la meta nueva se va y la que se cambiaba vuelve a como estaba; quien la pidió se entera', async () => {
    const s = conMetas();
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    const primera = a.guardarMeta(PRESS);
    s.soltar();
    await primera;
    s.conexion = false;
    const nueva = a.guardarMeta({ ejercicio: 'sentadilla', kilos: 140, reps: 1 });
    expect(a.estado().metas).toHaveLength(2);
    s.soltar();
    await expect(nueva).rejects.toThrow();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    const cambio = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 });
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 80 }]);
    s.soltar();
    await expect(cambio).rejects.toThrow();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
  });

  it('cambiar una meta la deja en su lugar; y una lista del servidor que llega mientras se guarda otra no la saca', async () => {
    const s = conMetas();
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    for (const m of [PRESS, { ejercicio: 'sentadilla', kilos: 140, reps: 1 }]) {
      const g = a.guardarMeta(m);
      s.soltar();
      await g;
    }
    const cambio = a.guardarMeta({ ...PRESS, id: 'm-1', reps: 5 });
    s.soltar();
    await cambio;
    expect(a.estado().metas.map((x) => [x.id, x.reps])).toEqual([['m-1', 5], ['m-2', 1]]);
    // La lista del servidor llega (sin la de recién) antes de que conteste guardar: no la saca, y después no se repite.
    const otra = a.guardarMeta({ ejercicio: 'press_banca', kilos: 100, reps: 1 });
    await a.refrescar();
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-2', 'pendiente:3']);
    s.soltar();
    await otra;
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-2', 'm-3']);
  });

  it('una por ejercicio: otra del mismo ejercicio cambia la que había, en su lugar, y no crea otra', async () => {
    const s = conMetas();
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    const primera = a.guardarMeta(PRESS);
    s.soltar();
    await primera;
    const otra = a.guardarMeta({ ...PRESS, kilos: 75, reps: 6 });
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 75, reps: 6 }]);
    s.soltar();
    await otra;
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 75, reps: 6 }]);
    expect(s.enLaBase).toEqual([{ ...PRESS, id: 'm-1', kilos: 75, reps: 6 }]);
  });
});

describe('las metas, con lo que pasa en el servidor mientras tanto', () => {
  type Meta = { id: string; ejercicio: string; kilos: number; reps: number };
  const PRESS = { ejercicio: 'press_militar_mancuernas', kilos: 70, reps: 8 };
  const SENTADILLA = { ejercicio: 'sentadilla', kilos: 140, reps: 1 };
  const tic = () => new Promise((r) => setTimeout(r, 0));
  /** Lo que retiene un pedido hasta que se lo suelta. */
  function enEspera() {
    let soltar = () => {};
    const listo = new Promise<void>((r) => (soltar = r));
    return { listo, soltar: () => soltar() };
  }
  /**
   * Un servidor como la base desde 0022: crear sin id cambia la del ejercicio si ya hay una, cambiar una que ya no está
   * da null y sin vínculo, null. Los cambios se hacen al llegar el pedido; `antes` retiene la respuesta, y las metas
   * contestan con la lista de cuando se pidieron.
   */
  function conLaBase() {
    const s = servidor(true);
    const b = {
      ...s,
      metas: [] as Meta[],
      proxima: 1,
      sinVinculo: false,
      antes: {} as Partial<Record<'sesiones' | 'metas' | 'guardar' | 'borrar', Promise<void>>>,
      /** Lo que retiene un cambio antes de que llegue a la base (la señal es mala). */
      llega: {} as Partial<Record<'guardar' | 'borrar', Promise<void>>>,
      fallanLasMetas: false,
      pedidasLasMetas: 0,
    };
    const aplicar = (x: MetaPedida): string | null => {
      if (b.sinVinculo) return null;
      const esa = x.id ? b.metas.find((y) => y.id === x.id) : b.metas.find((y) => y.ejercicio === x.ejercicio);
      if (x.id && !esa) return null;
      if (!esa && b.metas.length >= 20) throw new Error('demasiadas');
      const id = esa?.id ?? `m-${b.proxima++}`;
      const meta = { id, ejercicio: x.ejercicio, kilos: x.kilos, reps: x.reps };
      b.metas = esa ? b.metas.map((y) => (y === esa ? meta : y)) : [...b.metas, meta];
      return id;
    };
    b.remoto = {
      ...s.remoto,
      sesionesDeAscent: async (desde) => {
        await b.antes.sesiones;
        return s.remoto.sesionesDeAscent(desde);
      },
      metasDeFuerza: async () => {
        b.pedidasLasMetas++;
        const lista = b.metas.map((x) => ({ ...x }));
        await b.antes.metas;
        if (b.fallanLasMetas) throw new Error('moss.metas_de_fuerza: sin respuesta');
        return b.sinVinculo ? null : lista;
      },
      guardarMetaDeFuerza: async (x) => {
        await b.llega.guardar;
        const id = aplicar(x);
        await b.antes.guardar;
        return id;
      },
      borrarMetaDeFuerza: async (id) => {
        await b.llega.borrar;
        const habia = !b.sinVinculo && b.metas.some((y) => y.id === id);
        if (habia) b.metas = b.metas.filter((y) => y.id !== id);
        await b.antes.borrar;
        return habia;
      },
    };
    return b;
  }
  async function conectada(b: ReturnType<typeof conLaBase>, guardado = { texto: null as string | null }) {
    const a = crear(b.remoto, guardado);
    await a.ponerSesion('u-1');
    return a;
  }
  const enElTelefono = (g: { texto: string | null }) => (JSON.parse(g.texto!) as { metas: Meta[] }).metas;

  it('un refresco que salió antes de guardar una meta no la saca de la pantalla ni del teléfono', async () => {
    const b = conLaBase();
    const guardado = { texto: null as string | null };
    const a = await conectada(b, guardado);
    // Vuelve a primer plano: las metas contestan enseguida (sin la nueva) y las sesiones tardan.
    const sesiones = enEspera();
    b.antes.sesiones = sesiones.listo;
    const refresco = a.refrescar();
    await tic();
    await a.guardarMeta(PRESS);
    sesiones.soltar();
    await refresco;
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    expect(enElTelefono(guardado)).toEqual([{ ...PRESS, id: 'm-1' }]);
    // Y ponerla otra vez la cambia: no hay dos.
    await a.guardarMeta({ ...PRESS, kilos: 75 });
    expect(b.metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 75 }]);
  });

  it('borrar mientras un refresco espera: la borrada no vuelve con la lista de antes', async () => {
    const b = conLaBase();
    const guardado = { texto: null as string | null };
    const a = await conectada(b, guardado);
    await a.guardarMeta(PRESS);
    const sesiones = enEspera();
    b.antes.sesiones = sesiones.listo;
    const refresco = a.refrescar();
    await tic();
    await a.borrarMeta('m-1');
    sesiones.soltar();
    await refresco;
    expect([a.estado().metas, enElTelefono(guardado), b.metas]).toEqual([[], [], []]);
    // El refresco siguiente ya trae la lista de verdad.
    b.metas = [{ ...SENTADILLA, id: 'm-9' }];
    await a.refrescar();
    expect(a.estado().metas).toEqual([{ ...SENTADILLA, id: 'm-9' }]);
  });

  it('si en el refresco fallan solo las metas, la que se estaba guardando no vuelve a quedar pendiente', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    b.fallanLasMetas = true;
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const guardando = a.guardarMeta(PRESS);
    await a.refrescar();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'pendiente:1', pendiente: true }]);
    respuesta.soltar();
    await guardando;
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    await a.refrescar();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
  });

  it('cambiar una meta que se borró en Ascent la guarda como nueva, en su lugar; y «Nueva meta» de ese ejercicio también', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(SENTADILLA);
    await a.guardarMeta(PRESS);
    // Ascent borra la del press.
    b.metas = b.metas.filter((x) => x.id !== 'm-2');
    await a.guardarMeta({ ...PRESS, id: 'm-2', kilos: 80 });
    expect(a.estado().metas).toEqual([{ ...SENTADILLA, id: 'm-1' }, { ...PRESS, id: 'm-3', kilos: 80 }]);
    expect(b.metas).toEqual([{ ...SENTADILLA, id: 'm-1' }, { ...PRESS, id: 'm-3', kilos: 80 }]);
    // Otra vez, ahora desde «Nueva meta» (sin id): usaba el id que ya no está.
    b.metas = b.metas.filter((x) => x.id !== 'm-3');
    await a.guardarMeta({ ...PRESS, kilos: 90 });
    expect(a.estado().metas.map((x) => [x.id, x.kilos])).toEqual([['m-1', 140], ['m-4', 90]]);
    expect(b.metas.map((x) => [x.id, x.kilos])).toEqual([['m-1', 140], ['m-4', 90]]);
  });

  it('cambiar una meta y borrarla antes de que conteste: no vuelve, ni en la pantalla ni en el teléfono ni en la base', async () => {
    const b = conLaBase();
    const guardado = { texto: null as string | null };
    const a = await conectada(b, guardado);
    await a.guardarMeta(PRESS);
    // La base cambia los kilos enseguida, pero la respuesta tarda; y la persona la borra.
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const cambio = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 });
    await a.borrarMeta('m-1');
    respuesta.soltar();
    await cambio;
    expect([a.estado().metas, enElTelefono(guardado), b.metas]).toEqual([[], [], []]);
  });

  it('y si la base borra antes de cambiar, cambiar no la crea de nuevo', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    // El cambio llega a la base después del borrado: no encuentra la meta y da null.
    const llega = enEspera();
    const guardarla = b.remoto.guardarMetaDeFuerza!;
    b.remoto.guardarMetaDeFuerza = async (x) => {
      await llega.listo;
      return guardarla(x);
    };
    const cambio = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 });
    await a.borrarMeta('m-1');
    llega.soltar();
    await cambio;
    expect([a.estado().metas, b.metas]).toEqual([[], []]);
  });

  it('dos guardados seguidos del mismo ejercicio nuevo quedan en una', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await Promise.all([a.guardarMeta(PRESS), a.guardarMeta({ ...PRESS, kilos: 72.5 })]);
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 72.5 }]);
    expect(b.metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 72.5 }]);
  });

  it('cada fallo dice lo suyo: la conexión, el tope de 20, sin vínculo y sin respuesta (mirando si quedó guardada)', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    const fallo = (p: Promise<unknown>) => p.then(() => null, falloDeMeta);
    b.metas = Array.from({ length: 20 }, (_, i) => ({ id: `m-${i + 100}`, ejercicio: `propio_${i}`, kilos: 50, reps: 5 }));
    await a.refrescar();
    expect(await fallo(a.guardarMeta(PRESS))).toBe('demasiadas');
    // Cambiar una de las 20 sí se puede.
    expect(await fallo(a.guardarMeta({ ejercicio: 'propio_3', kilos: 55, reps: 5 }))).toBeNull();
    b.metas = [];
    await a.refrescar();
    const guardarla = b.remoto.guardarMetaDeFuerza!;
    b.remoto.guardarMetaDeFuerza = async () => {
      throw new Error('moss.guardar_meta_de_fuerza: TypeError: Network request failed');
    };
    expect(await fallo(a.guardarMeta(PRESS))).toBe('red');
    // Sin respuesta a tiempo, pero guardada: queda, con su id.
    b.remoto.guardarMetaDeFuerza = async (x) => {
      await guardarla(x);
      throw new Error('moss.guardar_meta_de_fuerza: sin respuesta');
    };
    expect(await fallo(a.guardarMeta(PRESS))).toBeNull();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    // Sin respuesta y sin guardar: la lista lo dice. Y si la lista tampoco contesta, no se sabe.
    b.remoto.guardarMetaDeFuerza = async () => {
      throw new Error('moss.guardar_meta_de_fuerza: sin respuesta');
    };
    expect(await fallo(a.guardarMeta(SENTADILLA))).toBe('red');
    b.fallanLasMetas = true;
    expect(await fallo(a.guardarMeta(SENTADILLA))).toBe('sinRespuesta');
    b.fallanLasMetas = false;
    b.remoto.guardarMetaDeFuerza = guardarla;
    b.sinVinculo = true;
    expect(await fallo(a.guardarMeta(SENTADILLA))).toBe('sinVinculo');
    expect(await fallo(a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 }))).toBe('sinVinculo');
    // Ninguna quedó pendiente ni a medias.
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
  });

  it('si borrar falla, la meta vuelve a su lugar y dice por qué; sin respuesta pero borrada, queda borrada', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    for (const m of [SENTADILLA, PRESS, { ejercicio: 'press_banca', kilos: 100, reps: 1 }]) await a.guardarMeta(m);
    const borrarla = b.remoto.borrarMetaDeFuerza!;
    b.remoto.borrarMetaDeFuerza = async () => {
      throw new Error('moss.borrar_meta_de_fuerza: TypeError: Network request failed');
    };
    expect(await a.borrarMeta('m-2').then(() => null, falloDeMeta)).toBe('red');
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-2', 'm-3']);
    b.remoto.borrarMetaDeFuerza = async () => {
      throw new Error('moss.borrar_meta_de_fuerza: sin respuesta');
    };
    b.fallanLasMetas = true;
    expect(await a.borrarMeta('m-2').then(() => null, falloDeMeta)).toBe('sinRespuesta');
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-2', 'm-3']);
    b.fallanLasMetas = false;
    b.remoto.borrarMetaDeFuerza = async (id) => {
      await borrarla(id);
      throw new Error('moss.borrar_meta_de_fuerza: sin respuesta');
    };
    await a.borrarMeta('m-2');
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-3']);
    // Una recién puesta todavía no tiene id: no se borra (la pantalla no lo ofrece).
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const nueva = a.guardarMeta({ ejercicio: 'remo_barra', kilos: 90, reps: 5 });
    await a.borrarMeta('pendiente:4');
    respuesta.soltar();
    await nueva;
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-1', 'm-3', 'm-4']);
  });

  it('un refresco que leyó la lista antes de que la base guardara la meta, y terminó después: no la saca y las pide otra vez', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    // La meta sale, pero llega a la base tarde.
    const llega = enEspera();
    b.llega.guardar = llega.listo;
    const guardando = a.guardarMeta(PRESS);
    // Vuelve a primer plano: el refresco lee las metas ya (sin la nueva) y las sesiones tardan.
    const sesiones = enEspera();
    b.antes.sesiones = sesiones.listo;
    const refresco = a.refrescar();
    await tic();
    llega.soltar();
    await guardando;
    const pedidas = b.pedidasLasMetas;
    sesiones.soltar();
    await refresco;
    await tic();
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
    // Las descartadas se pidieron otra vez (ya no había cambios en curso).
    expect(b.pedidasLasMetas).toBe(pedidas + 1);
  });

  it('lo mismo al borrar: la lista de antes del borrado no la trae de vuelta', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const llega = enEspera();
    b.llega.borrar = llega.listo;
    const borrando = a.borrarMeta('m-1');
    const sesiones = enEspera();
    b.antes.sesiones = sesiones.listo;
    const refresco = a.refrescar();
    await tic();
    llega.soltar();
    await borrando;
    sesiones.soltar();
    await refresco;
    await tic();
    expect([a.estado().metas, b.metas]).toEqual([[], []]);
  });

  it('las metas descartadas por un cambio se piden al terminar el último: llega lo que se puso en Ascent mientras tanto', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    // En Ascent ponen una de sentadilla; el refresco termina con un cambio de acá todavía esperando.
    b.metas = [...b.metas, { ...SENTADILLA, id: 'm-50' }];
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const cambio = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 72.5 });
    const pedidas = b.pedidasLasMetas;
    await a.refrescar();
    expect(a.estado().metas.map((x) => x.ejercicio)).toEqual([PRESS.ejercicio]);
    // Mientras espera, no se vuelven a pedir; al terminar, sí, una vez.
    expect(b.pedidasLasMetas).toBe(pedidas + 1);
    respuesta.soltar();
    await cambio;
    await tic();
    expect(b.pedidasLasMetas).toBe(pedidas + 2);
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 72.5 }, { ...SENTADILLA, id: 'm-50' }]);
  });

  it('con otra cuenta, lo que estaba en curso de la anterior no cuenta ni pisa nada', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const guardando = a.guardarMeta(PRESS).catch(falloDeMeta);
    // Sale de la cuenta y entra con otra, también vinculada, que tiene una meta.
    await a.ponerSesion(null);
    b.metas = [{ ...SENTADILLA, id: 'm-90' }];
    await a.ponerSesion('u-2');
    expect(a.estado().metas).toEqual([{ ...SENTADILLA, id: 'm-90' }]);
    respuesta.soltar();
    await guardando;
    await tic();
    expect(a.estado().metas).toEqual([{ ...SENTADILLA, id: 'm-90' }]);
    // Y los refrescos de la nueva siguen trayendo sus metas.
    b.metas = [...b.metas, { ...PRESS, id: 'm-91' }];
    await a.refrescar();
    expect(a.estado().metas.map((x) => x.id)).toEqual(['m-90', 'm-91']);
  });

  it('cambiar y borrar sin red: vuelve como está en la base, no con el cambio que no se guardó, y el teléfono guarda lo mismo', async () => {
    const b = conLaBase();
    const guardado = { texto: null as string | null };
    const a = await conectada(b, guardado);
    await a.guardarMeta(PRESS);
    const cambio = enEspera();
    const borrado = enEspera();
    b.remoto.guardarMetaDeFuerza = async () => {
      await cambio.listo;
      throw new Error('moss.guardar_meta_de_fuerza: TypeError: Network request failed');
    };
    b.remoto.borrarMetaDeFuerza = async () => {
      await borrado.listo;
      throw new Error('moss.borrar_meta_de_fuerza: TypeError: Network request failed');
    };
    const cambiando = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }).then(() => null, falloDeMeta);
    const borrando = a.borrarMeta('m-1').then(() => null, falloDeMeta);
    cambio.soltar();
    expect(await cambiando).toBe('red');
    expect(enElTelefono(guardado)).toEqual([]);
    borrado.soltar();
    expect(await borrando).toBe('red');
    expect([a.estado().metas, enElTelefono(guardado), b.metas]).toEqual([[{ ...PRESS, id: 'm-1' }], [{ ...PRESS, id: 'm-1' }], [{ ...PRESS, id: 'm-1' }]]);
  });

  it('y si el cambio sí se guardó y el borrado falla, vuelve con lo nuevo', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const respuesta = enEspera();
    b.antes.guardar = respuesta.listo;
    const borrado = enEspera();
    b.remoto.borrarMetaDeFuerza = async () => {
      await borrado.listo;
      throw new Error('moss.borrar_meta_de_fuerza: TypeError: Network request failed');
    };
    const cambiando = a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 });
    const borrando = a.borrarMeta('m-1').catch(falloDeMeta);
    respuesta.soltar();
    await cambiando;
    borrado.soltar();
    expect(await borrando).toBe('red');
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 80 }]);
  });

  it('si el borrado falla cuando la meta ya volvió a la lista, no queda dos veces', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const borrado = enEspera();
    b.remoto.borrarMetaDeFuerza = async () => {
      await borrado.listo;
      throw new Error('moss.borrar_meta_de_fuerza: TypeError: Network request failed');
    };
    const borrando = a.borrarMeta('m-1').catch(falloDeMeta);
    // Mientras, se guarda otra vez con su id (la base todavía la tiene).
    await a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 });
    borrado.soltar();
    expect(await borrando).toBe('red');
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 90 }]);
  });

  it('sin respuesta, se da por guardada solo si la base tiene la misma meta: el mismo ejercicio con otros kilos no', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    b.remoto.guardarMetaDeFuerza = async () => {
      throw new Error('moss.guardar_meta_de_fuerza: sin respuesta');
    };
    expect(await a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }).then(() => null, falloDeMeta)).toBe('red');
    expect(await a.guardarMeta({ ...PRESS, id: 'm-1', reps: 6 }).then(() => null, falloDeMeta)).toBe('red');
    expect(a.estado().metas).toEqual([{ ...PRESS, id: 'm-1' }]);
  });

  it('sin respuesta y sin vínculo (la lista da null): guardar dice «sin vínculo» y borrar la da por borrada', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    b.remoto.guardarMetaDeFuerza = async () => {
      throw new Error('moss.guardar_meta_de_fuerza: sin respuesta');
    };
    b.remoto.borrarMetaDeFuerza = async () => {
      throw new Error('moss.borrar_meta_de_fuerza: sin respuesta');
    };
    b.sinVinculo = true;
    expect(await a.guardarMeta(SENTADILLA).then(() => null, falloDeMeta)).toBe('sinVinculo');
    expect(await a.borrarMeta('m-1').then(() => null, falloDeMeta)).toBeNull();
    expect(a.estado().metas).toEqual([]);
  });

  it('«Moss ya no está vinculada»: la sección pasa a desvinculada, como al desvincular desde Ascent', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    b.sinVinculo = true;
    b.remoto.estadoDelVinculo = async () => ({ vinculada: false, nombre: null, desde: null });
    expect(await a.guardarMeta(SENTADILLA).then(() => null, falloDeMeta)).toBe('sinVinculo');
    await tic();
    expect(a.estado()).toMatchObject({ vinculo: { vinculada: false }, metas: [], sesiones: [] });
  });

  /** Una base donde cada guardado espera a que se lo suelte: al llegar (`llegadas`) o al contestar (`respuestas`). */
  function conPedidosSueltos(b: ReturnType<typeof conLaBase>, que: 'llegadas' | 'respuestas') {
    const retenidos: (() => void)[] = [];
    const guardarla = b.remoto.guardarMetaDeFuerza!;
    const retener = () => new Promise<void>((r) => retenidos.push(r));
    b.remoto.guardarMetaDeFuerza = async (x) => {
      if (que === 'llegadas') await retener();
      const id = await guardarla(x);
      if (que === 'respuestas') await retener();
      return id;
    };
    /** Suelta lo retenido del último al primero, hasta que no quede nada. */
    return async () => {
      await tic();
      while (retenidos.length) {
        retenidos.pop()!();
        await tic();
      }
    };
  }

  it('dos cambios de la misma meta cuyas respuestas llegan al revés: queda el último, en la pantalla, el teléfono y la base', async () => {
    const b = conLaBase();
    const guardado = { texto: null as string | null };
    const a = await conectada(b, guardado);
    await a.guardarMeta(PRESS);
    const soltar = conPedidosSueltos(b, 'respuestas');
    const cambios = Promise.all([a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }), a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 })]);
    const vistos: number[] = [];
    const dejar = a.suscribir(() => vistos.push(a.estado().metas[0]?.kilos));
    await soltar();
    await cambios;
    dejar();
    expect([a.estado().metas, enElTelefono(guardado), b.metas]).toEqual([[{ ...PRESS, id: 'm-1', kilos: 90 }], [{ ...PRESS, id: 'm-1', kilos: 90 }], [{ ...PRESS, id: 'm-1', kilos: 90 }]]);
    // La respuesta del primero no vuelve a mostrar sus kilos mientras se ve el segundo.
    expect(vistos).not.toContain(80);
  });

  it('dos cambios de la misma meta que llegan a la base al revés: la base se queda con el último', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const soltar = conPedidosSueltos(b, 'llegadas');
    const cambios = Promise.all([a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }), a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 })]);
    await soltar();
    await cambios;
    expect([a.estado().metas, b.metas]).toEqual([[{ ...PRESS, id: 'm-1', kilos: 90 }], [{ ...PRESS, id: 'm-1', kilos: 90 }]]);
  });

  it('dos metas nuevas del mismo ejercicio cuyas respuestas llegan al revés: queda una, con la última', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    const soltar = conPedidosSueltos(b, 'respuestas');
    const nuevas = Promise.all([a.guardarMeta(PRESS), a.guardarMeta({ ...PRESS, kilos: 72.5 })]);
    await soltar();
    await nuevas;
    expect([a.estado().metas, b.metas]).toEqual([[{ ...PRESS, id: 'm-1', kilos: 72.5 }], [{ ...PRESS, id: 'm-1', kilos: 72.5 }]]);
  });

  it('un cambio que espera al anterior del mismo ejercicio no sale si mientras tanto se borró la meta', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const soltar = conPedidosSueltos(b, 'respuestas');
    const pedidos: number[] = [];
    const guardarla = b.remoto.guardarMetaDeFuerza!;
    b.remoto.guardarMetaDeFuerza = (x) => (pedidos.push(x.kilos), guardarla(x));
    const cambios = Promise.allSettled([a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }), a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 })]);
    await a.borrarMeta('m-1');
    await soltar();
    await cambios;
    expect([pedidos, a.estado().metas, b.metas]).toEqual([[80], [], []]);
  });

  it('un cambio que espera al anterior del mismo ejercicio no sale si mientras tanto se cerró la sesión', async () => {
    const b = conLaBase();
    const a = await conectada(b);
    await a.guardarMeta(PRESS);
    const soltar = conPedidosSueltos(b, 'respuestas');
    const cambios = Promise.allSettled([a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 80 }), a.guardarMeta({ ...PRESS, id: 'm-1', kilos: 90 })]);
    await tic();
    await a.ponerSesion(null);
    await soltar();
    await cambios;
    expect(b.metas).toEqual([{ ...PRESS, id: 'm-1', kilos: 80 }]);
  });
});

describe('la carga de cada ejercicio (0020_carga_de_cada_ejercicio.sql)', () => {
  it('la primera vez que llega, lo guardado de antes no la trae: se pide todo de nuevo, una vez', async () => {
    const s = servidor(true);
    // Una sesión de hace más de una semana: la segunda vez ya no se vuelve a pedir.
    const dias = ['2026-10-01', '2026-10-24', HOY].map(sesion);
    let laManda = false;
    const conCarga = (x: SesionDeAscent): SesionDeAscent => ({ ...x, ejercicios: x.ejercicios.map((e) => ({ ...e, carga: x.fecha === HOY ? 'par' : null })) });
    s.remoto.sesionesDeAscent = async (desde) => (s.pedidos.push(desde), dias.filter((x) => x.fecha >= desde).map((x) => (laManda ? conCarga(x) : x)));
    const a = crear(s.remoto);
    await a.ponerSesion('u-1');
    await a.refrescar();
    expect(s.pedidos).toEqual(['2026-01-01', '2026-10-19']);
    expect(a.estado().sesiones.map((x) => x.ejercicios[0].carga)).toEqual([undefined, undefined, undefined]);
    // La base ya la manda: cada ejercicio con su carga, o null si el bloque no la trae.
    laManda = true;
    await a.refrescar();
    expect(s.pedidos.slice(2)).toEqual(['2026-10-19', '2026-01-01']);
    expect(a.estado().sesiones.map((x) => x.ejercicios[0].carga)).toEqual([null, null, 'par']);
    await a.refrescar();
    expect(s.pedidos.slice(4)).toEqual(['2026-10-19']);
  });
});

describe('lo de Ascent que mueve la meta, de lo guardado en el teléfono (gimnasioGuardado)', () => {
  it('con el vínculo, desde cuándo y las sesiones; sin vínculo, sin nada guardado o roto, null', () => {
    const g = { v: 1, usuario: 'u-1', conSeries: 126, vinculo: { vinculada: true, nombre: 'agustin', desde: '2026-10-03T12:00:00.000Z' }, sesiones: [sesion(HOY)], marcas: [], pesos: [], desde: '2026-01-01', llego: null, noches: {}, siente: null };
    expect(gimnasioGuardado({ ascent: JSON.stringify(g) })).toEqual({ desde: '2026-01-01', sesiones: [sesion(HOY)] });
    expect(gimnasioGuardado({ ascent: JSON.stringify({ ...g, vinculo: { vinculada: false, nombre: null, desde: null } }) })).toBeNull();
    expect(gimnasioGuardado({})).toBeNull();
    expect(gimnasioGuardado({ ascent: '{roto' })).toBeNull();
  });
});
