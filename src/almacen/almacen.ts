// El almacén: el estado de los hábitos en el teléfono. Local primero: cada cambio se ve al
// instante y se guarda atrás, en orden, sin que la pantalla espere. En la etapa 3, lo mismo sube
// a Supabase con una cola.

import type { Constelacion } from '@/datos/catalogo';
import { asignar, periodoDe, type Periodo } from '@/dominio/constelaciones';
import { claveDeMarca, resumirDia, type Dia, type Marca, type Origen } from '@/dominio/dias';
import { claveDelDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { archivar, cantidadesPorDia, habitosDelDia, type Habito } from '@/dominio/habitos';
import { logrosNuevos, type Logro } from '@/dominio/logros';
import type { Repositorio } from './repositorio';

export type Estado = {
  listo: boolean;
  hoy: ClaveDia;
  habitos: Habito[];
  periodos: Periodo[];
  dias: Map<ClaveDia, Dia>;
  /** Solo las de los últimos días: lo anterior ya está resumido en `dias`. */
  marcas: Map<string, Marca>;
  logros: Logro[];
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
  /** Los hábitos de la primera vez, hasta que exista el editor (etapa 4). */
  sembrar?: (hoy: ClaveDia) => Habito[];
  nuevaSemilla?: () => string;
};

/** Cuántos días de marcas se cargan: alcanzan para deshacer y para los días recién vividos. */
const DIAS_DE_MARCAS = 14;

export type Almacen = ReturnType<typeof crearAlmacen>;

export function crearAlmacen(op: Opciones) {
  const ahora = op.ahora ?? (() => new Date());
  const zona = op.zona ?? (() => undefined);
  let repositorio: Repositorio | undefined;
  let estado: Estado = {
    listo: false, hoy: claveDelDia(ahora(), zona()), habitos: [], periodos: [], dias: new Map(), marcas: new Map(), logros: [], semilla: '', version: 0, forma: 0,
  };
  const oyentes = new Set<() => void>();
  let escrituras: Promise<void> = Promise.resolve();
  let iniciando: Promise<void> | undefined;

  // En orden y sin esperar: si algo falla se avisa, y el estado en memoria sigue siendo el bueno.
  const guardar = (tarea: (r: Repositorio) => Promise<void>) => {
    escrituras = escrituras.then(() => tarea(repositorio!)).catch((error) => console.warn('Moss no pudo guardar', error));
  };

  const cambiar = (nuevo: Partial<Estado>, cambiaLaForma: boolean) => {
    estado = { ...estado, ...nuevo, version: estado.version + 1, forma: estado.forma + (cambiaLaForma ? 1 : 0) };
    oyentes.forEach((o) => o());
  };

  /**
   * Pone el día al día: las constelaciones según la cantidad de hábitos de cada día, el resumen
   * de hoy y los logros que se ganen. Guarda lo que cambió y devuelve el estado nuevo.
   */
  function alDia(base: Pick<Estado, 'hoy' | 'habitos' | 'periodos' | 'dias' | 'marcas' | 'logros'>) {
    const { hoy, habitos, marcas } = base;
    const periodos = asignar(base.periodos, cantidadesPorDia(habitos, hoy), hoy, op.catalogo, estado.semilla);
    if (JSON.stringify(periodos) !== JSON.stringify(base.periodos)) guardar((r) => r.guardarPeriodos(periodos));

    const delDia = [...marcas.values()].filter((m) => m.dia === hoy);
    const resumen = resumirDia(hoy, habitosDelDia(habitos, hoy), delDia, periodoDe(periodos, hoy)?.constelacion ?? null);
    let dias = base.dias;
    if (JSON.stringify(dias.get(hoy)) !== JSON.stringify(resumen)) {
      dias = new Map(dias).set(hoy, resumen);
      guardar((r) => r.guardarDia(resumen));
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
    estado = { ...estado, semilla };
    let habitos = g.habitos;
    if (!habitos.length && op.sembrar) {
      habitos = op.sembrar(hoy);
      const h = habitos;
      guardar((r) => r.guardarHabitos(h));
    }
    const { estado: nuevo } = alDia({
      hoy,
      habitos,
      periodos: g.periodos,
      dias: new Map(g.dias.map((d) => [d.clave, d])),
      marcas: new Map(g.marcas.map((m) => [claveDeMarca(m.habito, m.dia), m])),
      logros: g.logros,
    });
    cambiar({ ...nuevo, listo: true }, true);
  }

  /** Encender o apagar un hábito hoy. Devuelve los logros que se ganaron con eso. */
  function marcar(habito: string, hecho: boolean, origen: Origen): Logro[] {
    const marca: Marca = { habito, dia: estado.hoy, hecho, momento: ahora().toISOString(), origen };
    const marcas = new Map(estado.marcas).set(claveDeMarca(habito, estado.hoy), marca);
    guardar((r) => r.guardarMarca(marca));
    const { estado: nuevo, ganados } = alDia({ ...estado, marcas });
    cambiar(nuevo, false);
    return ganados;
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
    marcar,
    /** Crear o editar un hábito. Si cambia la cantidad de un día, ese día pasa a otra constelación. */
    ponerHabito(habito: Habito) {
      const habitos = [...estado.habitos.filter((h) => h.id !== habito.id), habito];
      guardar((r) => r.guardarHabitos(habitos));
      cambiar(alDia({ ...estado, habitos }).estado, true);
    },
    archivarHabito(id: string) {
      const habitos = estado.habitos.map((h) => (h.id === id ? archivar(h, estado.hoy) : h));
      guardar((r) => r.guardarHabitos(habitos));
      cambiar(alDia({ ...estado, habitos }).estado, true);
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
    /** Espera a que termine de guardarse lo pendiente (para los tests). */
    esperar: () => escrituras,
  };
}
