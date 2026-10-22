// El almacén: el estado de Moss en el teléfono. Local primero: cada cambio se ve al instante y se
// guarda atrás, en orden, sin que la pantalla espere. La sincronización (sincronizar.ts) sube lo
// pendiente a la cuenta y mezcla acá lo que baja.

import type { Constelacion } from '@/datos/catalogo';
import { asignar, mismosPeriodos, periodoDe, type Periodo } from '@/dominio/constelaciones';
import type { Peso } from '@/dominio/control';
import { claveDeMarca, mismoResumen, rehacerDia, resumirDia, type Dia, type Marca, type Origen } from '@/dominio/dias';
import { claveDelDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { archivar, cantidadesPorDia, habitosDelDia, type Habito } from '@/dominio/habitos';
import { logrosNuevos, type Logro } from '@/dominio/logros';
import { metasIniciales, type Cuestionario, type MetaGuardada, type Perfil } from '@/dominio/metas';
import { aplicar, ganadores, type Datos } from './mezclar';
import { sinCambios, type Repositorio } from './repositorio';

export type Estado = {
  listo: boolean;
  hoy: ClaveDia;
  habitos: Habito[];
  periodos: Periodo[];
  dias: Map<ClaveDia, Dia>;
  /** Solo las de los últimos días: lo anterior ya está resumido en `dias`. */
  marcas: Map<string, Marca>;
  logros: Logro[];
  /** Las respuestas del cuestionario; hasta contestarlo, nada. */
  perfil: Perfil | null;
  /** Las metas de comida desde cada fecha, de la más vieja a la más nueva. */
  metas: MetaGuardada[];
  pesos: Peso[];
  /** Para que cada usuario reciba su propio orden del catálogo. */
  semilla: string;
  /** Sube con cada cambio. */
  version: number;
  /** Sube solo cuando cambia la forma del cielo: el día, los hábitos o sus constelaciones. */
  forma: number;
};

export type Opciones = {
  abrir: () => Promise<Repositorio>;
  catalogo: Constelacion[];
  /** El reloj y la zona del teléfono. Los tests ponen los suyos. */
  ahora?: () => Date;
  zona?: () => string | undefined;
  /** Los hábitos de la primera vez, hasta que exista el editor (etapa 9). */
  sembrar?: (hoy: ClaveDia) => Habito[];
  nuevaSemilla?: () => string;
};

/** Cuántos días de marcas se tienen a mano: alcanzan para deshacer y para los días recién vividos. */
export const DIAS_DE_MARCAS = 14;

/** La hora de los hábitos de ejemplo: así nunca le ganan a un cambio de verdad que llegue de la cuenta. */
const DESDE_SIEMPRE = new Date(0).toISOString();

/** La meta de comida que vale en un día: la última que empezó antes o ese mismo día. */
export function metaVigente(e: Pick<Estado, 'metas'>, clave: ClaveDia): MetaGuardada | null {
  let vigente: MetaGuardada | null = null;
  for (const m of e.metas) if (m.desde <= clave) vigente = m;
  return vigente;
}

const porFecha = <T>(clave: (x: T) => string) => (a: T, b: T) => (clave(a) < clave(b) ? -1 : 1);

export type Almacen = ReturnType<typeof crearAlmacen>;

export function crearAlmacen(op: Opciones) {
  const ahora = op.ahora ?? (() => new Date());
  const zona = op.zona ?? (() => undefined);
  let repositorio: Repositorio | undefined;
  let estado: Estado = {
    listo: false, hoy: claveDelDia(ahora(), zona()), habitos: [], periodos: [], dias: new Map(), marcas: new Map(), logros: [],
    perfil: null, metas: [], pesos: [], semilla: '', version: 0, forma: 0,
  };
  const oyentes = new Set<() => void>();
  let cola: Promise<unknown> = Promise.resolve();
  let iniciando: Promise<void> | undefined;
  const momento = () => ahora().toISOString();

  /** Todo lo que toca el repositorio pasa por esta cola, en orden: nadie ve una escritura a medias. */
  function enCola<T>(tarea: (r: Repositorio) => Promise<T>): Promise<T> {
    const resultado = cola.then(() => tarea(repositorio!));
    cola = resultado.catch(() => undefined);
    return resultado;
  }

  // Sin esperar: si algo falla se avisa, y el estado en memoria sigue siendo el bueno.
  const guardar = (tarea: (r: Repositorio) => Promise<void>) => {
    enCola(tarea).catch((error) => console.warn('Moss no pudo guardar', error));
  };

  const cambiar = (nuevo: Partial<Estado>, cambiaLaForma: boolean) => {
    estado = { ...estado, ...nuevo, version: estado.version + 1, forma: estado.forma + (cambiaLaForma ? 1 : 0) };
    oyentes.forEach((o) => o());
  };

  /**
   * Pone el día al día: las constelaciones según la cantidad de hábitos de cada día, el resumen
   * de hoy y los logros que se ganen. Guarda lo que cambió y devuelve el estado nuevo.
   */
  function alDia(base: Pick<Estado, 'hoy' | 'habitos' | 'periodos' | 'dias' | 'marcas' | 'logros' | 'semilla'>) {
    const { hoy, habitos, marcas } = base;
    const periodos = asignar(base.periodos, cantidadesPorDia(habitos, hoy), hoy, op.catalogo, base.semilla);
    if (!mismosPeriodos(periodos, base.periodos)) guardar((r) => r.guardarPeriodos(periodos));

    const delDia = [...marcas.values()].filter((m) => m.dia === hoy);
    const resumen = resumirDia(hoy, habitosDelDia(habitos, hoy), delDia, periodoDe(periodos, hoy)?.constelacion ?? null);
    let dias = base.dias;
    if (!mismoResumen(dias.get(hoy), resumen)) {
      const nuevo: Dia = { ...resumen, actualizado: momento() };
      dias = new Map(dias).set(hoy, nuevo);
      guardar((r) => r.guardarDia(nuevo));
    }

    const ganados = logrosNuevos(dias.values(), base.logros, hoy);
    const logros = ganados.length ? [...base.logros, ...ganados] : base.logros;
    if (ganados.length) guardar((r) => r.guardarLogros(logros));
    return { estado: { hoy, habitos, periodos, dias, marcas, logros }, ganados };
  }

  async function arrancar() {
    repositorio = await op.abrir();
    const hoy = claveDelDia(ahora(), zona());
    const g = await repositorio.cargar(sumarDias(hoy, -DIAS_DE_MARCAS));
    let semilla = g.ajustes.semilla;
    if (!semilla) {
      semilla = (op.nuevaSemilla ?? (() => Math.random().toString(36).slice(2)))();
      const s = semilla;
      guardar((r) => r.guardarAjuste('semilla', s));
    }
    let habitos = g.habitos;
    if (!habitos.length && op.sembrar) {
      habitos = op.sembrar(hoy).map((h) => ({ ...h, actualizado: DESDE_SIEMPRE }));
      const h = habitos;
      guardar((r) => r.guardarHabitos(h));
    }
    const { estado: nuevo } = alDia({
      hoy,
      habitos,
      semilla,
      periodos: g.periodos,
      dias: new Map(g.dias.map((d) => [d.clave, d])),
      marcas: new Map(g.marcas.map((m) => [claveDeMarca(m.habito, m.dia), m])),
      logros: g.logros,
    });
    cambiar({ ...nuevo, semilla, perfil: g.perfil, metas: g.metas, pesos: g.pesos, listo: true }, true);
  }

  /** Encender o apagar un hábito hoy. Devuelve los logros que se ganaron con eso. */
  function marcar(habito: string, hecho: boolean, origen: Origen): Logro[] {
    const marca: Marca = { habito, dia: estado.hoy, hecho, momento: momento(), origen };
    const marcas = new Map(estado.marcas).set(claveDeMarca(habito, estado.hoy), marca);
    guardar((r) => r.guardarMarca(marca));
    const { estado: nuevo, ganados } = alDia({ ...estado, marcas });
    cambiar(nuevo, false);
    return ganados;
  }

  function cambiarHabitos(habitos: Habito[]) {
    guardar((r) => r.guardarHabitos(habitos));
    cambiar(alDia({ ...estado, habitos }).estado, true);
  }

  return {
    estado: () => estado,
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    /** Se puede llamar varias veces: arranca una sola. */
    iniciar() {
      iniciando ??= arrancar();
      return iniciando;
    },
    /** Para la sincronización: el repositorio, en la misma cola que las escrituras. */
    enCola,
    marcar,
    /** Crear o editar un hábito. Si cambia la cantidad de un día, ese día pasa a otra constelación. */
    ponerHabito(habito: Habito) {
      cambiarHabitos([...estado.habitos.filter((h) => h.id !== habito.id), { ...habito, actualizado: momento() }]);
    },
    archivarHabito(id: string) {
      cambiarHabitos(estado.habitos.map((h) => (h.id === id ? { ...archivar(h, estado.hoy), actualizado: momento() } : h)));
    },
    /**
     * El final de la entrada: guarda las respuestas, el peso de hoy y la meta de arranque.
     * Devuelve esa meta para mostrarla.
     */
    responderCuestionario(c: Cuestionario, origenDelPeso: Peso['origen'] = 'manual'): MetaGuardada {
      const { edad: _edad, pesoKg, ...resto } = c;
      const perfil: Perfil = { ...resto, nacimiento: Number(estado.hoy.slice(0, 4)) - c.edad, actualizado: momento() };
      const peso: Peso = { fecha: estado.hoy, kg: pesoKg, origen: origenDelPeso, momento: momento() };
      const { gasto, metas } = metasIniciales(c);
      const meta: MetaGuardada = { ...metas, desde: estado.hoy, gasto, motivo: 'inicial', momento: momento() };
      guardar((r) => r.guardarPerfil(perfil));
      guardar((r) => r.guardarPeso(peso));
      guardar((r) => r.guardarMeta(meta));
      cambiar({
        perfil,
        pesos: [...estado.pesos.filter((p) => p.fecha !== peso.fecha), peso].sort(porFecha((p) => p.fecha)),
        metas: [...estado.metas.filter((m) => m.desde !== meta.desde), meta].sort(porFecha((m) => m.desde)),
      }, false);
      return meta;
    },
    /** Un peso por día: si ese día ya tenía uno, queda el último. */
    anotarPeso(kg: number, origen: Peso['origen'], fecha: ClaveDia = estado.hoy) {
      const peso: Peso = { fecha, kg, origen, momento: momento() };
      guardar((r) => r.guardarPeso(peso));
      cambiar({ pesos: [...estado.pesos.filter((p) => p.fecha !== fecha), peso].sort(porFecha((p) => p.fecha)) }, false);
    },
    /**
     * Mezcla lo que bajó de la cuenta: de cada cosa gana la versión más nueva. Lo que llega y gana
     * se guarda sin quedar pendiente, y el día de hoy se vuelve a armar con eso. Devuelve si cambió algo.
     */
    mezclar(remoto: Datos): boolean {
      const local: Datos = {
        habitos: estado.habitos, periodos: estado.periodos, dias: [...estado.dias.values()], marcas: [...estado.marcas.values()],
        logros: estado.logros, perfil: estado.perfil, metas: estado.metas, pesos: estado.pesos, semilla: estado.semilla,
      };
      const g = ganadores(local, remoto);
      if (sinCambios(g)) return false;
      guardar((r) => r.guardarDeLaNube(g));
      const d = aplicar(local, g);
      const semilla = d.semilla ?? estado.semilla;
      const desde = sumarDias(estado.hoy, -DIAS_DE_MARCAS);
      const marcas = d.marcas.filter((m) => m.dia >= desde);
      const dias = new Map(d.dias.map((x) => [x.clave, x]));
      // Los días recientes se rearman con las marcas de todos los teléfonos: si dos marcaron cosas
      // distintas el mismo día sin conexión, el resumen que ganó tiene solo las de uno. Hoy lo rearma alDia.
      const tocados = new Set([...g.marcas.map((m) => m.dia), ...g.dias.map((x) => x.clave)]);
      for (const clave of tocados) {
        const dia = dias.get(clave);
        if (!dia || clave < desde || clave === estado.hoy) continue;
        const rehecho = rehacerDia(dia, marcas);
        if (mismoResumen(dia, rehecho)) continue;
        const arreglado: Dia = { ...rehecho, actualizado: momento() };
        dias.set(clave, arreglado);
        guardar((r) => r.guardarDia(arreglado));
      }
      const { estado: nuevo } = alDia({
        hoy: estado.hoy,
        habitos: d.habitos,
        periodos: d.periodos,
        semilla,
        dias,
        marcas: new Map(marcas.map((m) => [claveDeMarca(m.habito, m.dia), m])),
        logros: d.logros,
      });
      cambiar({ ...nuevo, semilla, perfil: d.perfil, metas: d.metas, pesos: d.pesos }, true);
      return true;
    },
    /** Si ya es otro día (medianoche, o la app vuelve del fondo), arma el nuevo. */
    revisarDia(): boolean {
      const hoy = claveDelDia(ahora(), zona());
      if (!estado.listo || hoy === estado.hoy) return false;
      cambiar(alDia({ ...estado, hoy }).estado, true);
      return true;
    },
    /** Para el panel de prueba: apaga todo lo de hoy. */
    reiniciarHoy() {
      for (const h of habitosDelDia(estado.habitos, estado.hoy)) {
        if (estado.marcas.get(claveDeMarca(h.id, estado.hoy))?.hecho) marcar(h.id, false, 'deshacer');
      }
    },
    /** Espera a que termine de guardarse lo pendiente (para los tests y antes de subir). */
    esperar: () => cola,
  };
}
