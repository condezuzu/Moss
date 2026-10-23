// El almacén: el estado de Moss en el teléfono. Local primero: cada cambio se ve al instante y se
// guarda atrás, en orden, sin que la pantalla espere. La sincronización (sincronizar.ts) sube lo
// pendiente a la cuenta y mezcla acá lo que baja. Tiene los hábitos y el cielo, el perfil, las
// metas y el peso, y lo que se come (src/dominio/registros.ts).

import type { Calidad } from '@/cielo/mundo';
import type { Constelacion } from '@/datos/catalogo';
import type { Sistema } from '@/dominio/cantidades';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { asignar, mismosPeriodos, periodoDe, type Periodo } from '@/dominio/constelaciones';
import { medidaValida, SITIOS, type Centimetros, type Medidas } from '@/dominio/cuerpo';
import { controlSemanal, ultimoDiaDeControl, type Peso } from '@/dominio/control';
import { claveDeMarca, mismoResumen, rehacerDia, resumirDia, type Dia, type Marca, type Origen } from '@/dominio/dias';
import { claveDelDia, diaDeLaSemana, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { archivar, cantidadesPorDia, habitosDelDia, type Habito } from '@/dominio/habitos';
import { logrosNuevos, type Logro } from '@/dominio/logros';
import {
  edadDe, metaManual, metaPara, metaRepartida, metasIniciales, motivoParaNo, pesoMinimoSano, type Cuestionario, type Macros, type MetaGuardada, type Perfil,
} from '@/dominio/metas';
import { adaptarRegistros, type ComidaPlaneada, type Preferencias } from '@/dominio/plan';
import {
  borrado, claveDeFavorito, comidasParaElControl, confirmar, copiar, cumpleLaComida, delDia, restaurado,
  type AlimentoPropio, type Fuente, type Item, type Receta, type Registro, type TomaDeAgua,
} from '@/dominio/registros';
import { aplicar, ganadores, type Datos } from './mezclar';
import type { LoDeSalud } from '@/salud/convertir';
import type { Cara, NochePropia } from '@/dominio/sueno';
import { DE_COMIDA, sinCambios, type Coleccion, type DeComida, type Guardado, type ListasDeComida, type Repositorio } from './repositorio';

/**
 * Lo que se come, por colección y por clave: de los registros y el agua, los de los últimos
 * DIAS_DE_COMIDA días. Lo borrado sigue acá con su marca (la marca también sube): las pantallas
 * muestran `vigentes`.
 */
export type MapasDeComida = { [C in Coleccion]: Map<string, DeComida[C]> };

export type Estado = MapasDeComida & {
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
  /** La comida que se arma en la hoja de registro: queda en el teléfono hasta agregarla, aunque se cierre la hoja. */
  canasta: Item[];
  /** Métrico o imperial, si se eligió en Perfil; sin elegir, el del país del teléfono. Queda en el teléfono. */
  sistema: Sistema | null;
  /** Los bloques de Inicio: en qué orden y cuáles se ven. Sin elegir, los de fábrica. Queda en el teléfono. */
  inicio: { orden: string[]; visibles: string[] } | null;
  /** Las comidas que avisan si no se anotaron; apagados, null. Queda en el teléfono. */
  recordatorios: Comida[] | null;
  /** La calidad de las animaciones, si se eligió en Perfil; sin elegir, la automática. Queda en el teléfono. */
  calidad: Calidad | null;
  /**
   * Cuándo estuvo Moss abierta los últimos tres días (desde y hasta, en milisegundos): sin reloj, es lo
   * más exacto para saber que estabas despierto (spec/sueno.md, «Sin reloj»). Queda en el teléfono.
   */
  uso: [number, number][];
  /** De cuál aparato sale la noche (su id en Salud), si se eligió en Perfil › Aparatos; sin elegir, la automática. Queda en el teléfono. */
  fuenteDelSueno: string | null;
  /** Los números de la comida (las calorías y los gramos), o solo las figuras y las barras. Queda en el teléfono. */
  numeros: boolean;
  /**
   * Si se manda, sin la cuenta, lo que se busca y no se encuentra (src/almacen/buzon.ts). Lo elige la
   * persona en la entrada o en Perfil, y empieza apagado (guía 5.1.1 de Apple). Queda en el teléfono.
   */
  mandarBusquedas: boolean;
  /** Lo de Salud, leído al abrir la app y al volver (src/salud/leer.ts): en memoria, no se guarda ni sube. */
  salud: LoDeSalud | null;
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
  /** El id de lo que se crea (registros, recetas…). Los tests ponen el suyo. */
  nuevoId?: () => string;
};

/** Cuántos días de marcas se tienen a mano: alcanzan para deshacer y para los días recién vividos. */
export const DIAS_DE_MARCAS = 14;
/** Cuántos días de lo comido se tienen a mano: alcanzan para el control (tres semanas), el mes y lo que solés comer. */
export const DIAS_DE_COMIDA = 120;

/** Lo que va en los ajustes del teléfono no se sincroniza: la canasta, las unidades, Inicio, los recordatorios, la calidad y cuándo se usó Moss. */
const CANASTA = 'canasta';
const SISTEMA = 'sistema';
const INICIO = 'inicio';
const RECORDATORIOS = 'recordatorios';
const CALIDAD = 'calidad';
const CALIDADES: readonly Calidad[] = ['alta', 'media', 'baja'];
const USO = 'uso';
const FUENTE_DEL_SUENO = 'fuenteDelSueno';
const NUMEROS = 'numeros';
const BUSQUEDAS = 'mandarBusquedas';
/** Tres días de uso alcanzan para la noche de anoche. */
const DIAS_DE_USO = 3;

/** Un id para lo que se crea en el teléfono: la hora y un azar, así dos teléfonos de la misma cuenta no se pisan. */
const idNuevo = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const mapasDe = (l: ListasDeComida): MapasDeComida => ({
  registros: new Map(l.registros.map((x) => [x.id, x])),
  recetas: new Map(l.recetas.map((x) => [x.id, x])),
  propios: new Map(l.propios.map((x) => [x.id, x])),
  favoritos: new Map(l.favoritos.map((x) => [claveDeFavorito(x), x])),
  agua: new Map(l.agua.map((x) => [x.id, x])),
  medidas: new Map(l.medidas.map((x) => [x.fecha, x])),
  noches: new Map(l.noches.map((x) => [x.fecha, x])),
});
const listasDe = (m: MapasDeComida): ListasDeComida => ({
  registros: [...m.registros.values()], recetas: [...m.recetas.values()], propios: [...m.propios.values()],
  favoritos: [...m.favoritos.values()], agua: [...m.agua.values()], medidas: [...m.medidas.values()], noches: [...m.noches.values()],
});

function leerRecordatorios(texto: string | undefined): Comida[] | null {
  try {
    const lista = texto ? JSON.parse(texto) : null;
    return Array.isArray(lista) ? lista.filter((c): c is Comida => COMIDAS.includes(c)) : null;
  } catch {
    return null;
  }
}

function leerInicio(texto: string | undefined): Estado['inicio'] {
  try {
    const x = texto ? (JSON.parse(texto) as Estado['inicio']) : null;
    return x && Array.isArray(x.orden) && Array.isArray(x.visibles) ? x : null;
  } catch {
    return null;
  }
}

function leerUso(texto: string | undefined): [number, number][] {
  try {
    const lista: unknown = texto ? JSON.parse(texto) : [];
    return Array.isArray(lista) ? lista.filter((x): x is [number, number] => Array.isArray(x) && x.length === 2 && x.every(Number.isFinite)) : [];
  } catch {
    return [];
  }
}

function leerCanasta(texto: string | undefined): Item[] {
  try {
    return texto ? (JSON.parse(texto) as Item[]) : [];
  } catch {
    return [];
  }
}

/** La hora de los hábitos de ejemplo: así nunca le ganan a un cambio de verdad que llegue de la cuenta. */
const DESDE_SIEMPRE = new Date(0).toISOString();

/** La meta de comida que vale en un día: la última que empezó antes o ese mismo día. */
export function metaVigente(e: Pick<Estado, 'metas'>, clave: ClaveDia): MetaGuardada | null {
  let vigente: MetaGuardada | null = null;
  for (const m of e.metas) if (m.desde <= clave) vigente = m;
  return vigente;
}

const porFecha = <T>(clave: (x: T) => string) => (a: T, b: T) => (clave(a) < clave(b) ? -1 : 1);
const soloMacros = (m: Macros): Macros => ({ kcal: m.kcal, proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas });
const soloMacrosIguales = (a: Macros, b: Macros) => a.kcal === b.kcal && a.proteina === b.proteina && a.carbohidratos === b.carbohidratos && a.grasas === b.grasas;

export type Almacen = ReturnType<typeof crearAlmacen>;

export function crearAlmacen(op: Opciones) {
  const ahora = op.ahora ?? (() => new Date());
  const zona = op.zona ?? (() => undefined);
  const nuevoId = op.nuevoId ?? idNuevo;
  let repositorio: Repositorio | undefined;
  const vacio = (): Omit<Estado, 'version' | 'forma'> => ({
    listo: false, hoy: claveDelDia(ahora(), zona()), habitos: [], periodos: [], dias: new Map(), marcas: new Map(), logros: [],
    perfil: null, metas: [], pesos: [], ...mapasDe({ registros: [], recetas: [], propios: [], favoritos: [], agua: [], medidas: [], noches: [] }), canasta: [], sistema: null, inicio: null,
    recordatorios: null, calidad: null, uso: [], fuenteDelSueno: null, numeros: true, mandarBusquedas: false, salud: null, semilla: '',
  });
  let estado: Estado = { ...vacio(), version: 0, forma: 0 };
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
   * Pone el día al día: los hábitos de comida según lo registrado hoy, las constelaciones según la
   * cantidad de hábitos de cada día, el resumen de hoy y los logros que se ganen. Guarda lo que
   * cambió y devuelve el estado nuevo.
   */
  function alDia(base: Pick<Estado, 'hoy' | 'habitos' | 'periodos' | 'dias' | 'marcas' | 'logros' | 'semilla' | 'registros' | 'metas'>) {
    const { hoy, habitos } = base;
    // Los hábitos de comida se encienden, y se apagan, solos con lo registrado.
    let marcas = base.marcas;
    const meta = metaVigente(base, hoy);
    for (const h of habitosDelDia(habitos, hoy)) {
      if (h.fuente.tipo !== 'comida') continue;
      const cumple = cumpleLaComida(h.fuente.meta, base.registros.values(), hoy, meta, h.fuente.comidas);
      const clave = claveDeMarca(h.id, hoy);
      if ((marcas.get(clave)?.hecho ?? false) === cumple) continue;
      const marca: Marca = { habito: h.id, dia: hoy, hecho: cumple, momento: momento(), origen: 'comida' };
      marcas = new Map(marcas).set(clave, marca);
      guardar((r) => r.guardarMarca(marca));
    }
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
    const g = await repositorio.cargar(sumarDias(hoy, -DIAS_DE_MARCAS), sumarDias(hoy, -DIAS_DE_COMIDA));
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
    const comida = mapasDe(g);
    const { estado: nuevo } = alDia({
      hoy,
      habitos,
      semilla,
      periodos: g.periodos,
      dias: new Map(g.dias.map((d) => [d.clave, d])),
      marcas: new Map(g.marcas.map((m) => [claveDeMarca(m.habito, m.dia), m])),
      logros: g.logros,
      registros: comida.registros,
      metas: g.metas,
    });
    const sistema = g.ajustes[SISTEMA] === 'imperial' || g.ajustes[SISTEMA] === 'metrico' ? g.ajustes[SISTEMA] : null;
    cambiar({ ...nuevo, semilla, perfil: g.perfil, metas: g.metas, pesos: g.pesos, ...comida, canasta: leerCanasta(g.ajustes[CANASTA]), sistema, inicio: leerInicio(g.ajustes[INICIO]), recordatorios: leerRecordatorios(g.ajustes[RECORDATORIOS]), calidad: CALIDADES.find((c) => c === g.ajustes[CALIDAD]) ?? null, uso: leerUso(g.ajustes[USO]), fuenteDelSueno: g.ajustes[FUENTE_DEL_SUENO] || null, numeros: g.ajustes[NUMEROS] !== 'no', mandarBusquedas: g.ajustes[BUSQUEDAS] === 'si', listo: true }, true);
    revisarControl();
  }

  /** Cambiar las metas, y con eso los hábitos de comida de hoy. */
  function ponerMetas(metas: MetaGuardada[]) {
    const antes = estado.metas;
    cambiar({ metas, ...alDia({ ...estado, metas }).estado }, false);
    adaptarElPlan(antes);
  }

  /** La meta de un día, con el reparto de la semana: la que usa el plan. */
  function metaDelDia(metas: MetaGuardada[], dia: ClaveDia): Macros | null {
    const m = metaVigente({ metas }, dia);
    return m ? metaRepartida(soloMacros(m), estado.perfil, diaDeLaSemana(dia)) : null;
  }

  /** Si cambió la meta de un día con comidas armadas (de hoy en adelante), lo armado se escala a la nueva (plan.ts). */
  function adaptarElPlan(metasAntes: MetaGuardada[]) {
    const dias = new Set<ClaveDia>();
    for (const r of estado.registros.values()) if (!r.borrado && r.planificado && r.plan && r.dia >= estado.hoy) dias.add(r.dia);
    const cuando = momento();
    const cambiados = [...dias].flatMap((dia) => {
      const nueva = metaDelDia(estado.metas, dia);
      const vieja = metaDelDia(metasAntes, dia);
      if (!nueva || (vieja && soloMacrosIguales(vieja, nueva))) return [];
      return adaptarRegistros(estado.registros.values(), dia, nueva).map((r) => ({ ...r, actualizado: cuando }));
    });
    ponerComida('registros', cambiados);
  }

  /** Un instante de un día a unos minutos de la hora local, para la línea del día. */
  const instanteDe = (dia: ClaveDia, minutos: number) => {
    const p = partesDe(dia);
    return new Date(p.anio, p.mes, p.dia, Math.floor(minutos / 60), Math.round(minutos % 60)).getTime();
  };

  /**
   * Lo que armó el plan: cada comida, planificada aunque sea hoy (se anota con «Comí esto»), con la
   * clave de su opción y a su hora de siempre o, hoy, no antes de ahora. `desde`, la hora de cada
   * comida si ya tenía (al cambiarla por otra).
   */
  function planificar(dia: ClaveDia, comidas: readonly ComidaPlaneada[], horaDe: (c: Comida) => number, desde: Partial<Record<Comida, number>> = {}): Registro[] {
    const cuando = momento();
    const ya = ahora();
    const minutosAhora = ya.getHours() * 60 + ya.getMinutes();
    const nuevos = comidas.flatMap((c) => {
      const inicio = desde[c.comida] ?? instanteDe(dia, dia === estado.hoy ? Math.max(horaDe(c.comida), minutosAhora) : horaDe(c.comida));
      return c.items.map((it, i): Registro => ({
        fuente: it.fuente, ref: it.ref, nombre: it.nombre, cantidad: it.cantidad, valores: it.valores, ...(it.estimado ? { estimado: true as const } : {}),
        id: nuevoId(), dia, comida: c.comida, momento: new Date(inicio + i).toISOString(), planificado: true, plan: c.opcion, actualizado: cuando,
      }));
    });
    ponerComida('registros', nuevos);
    return nuevos;
  }

  /**
   * El control de la semana (src/dominio/control.ts): corre solo, una vez por semana, el día que se
   * eligió en Progreso o, sin elegir, el día de la semana en que se fijó la primera meta (como
   * MacroFactor). Si ese día no se abrió Moss, corre la próxima vez. Con las metas a mano, mide el
   * gasto pero deja los macros.
   */
  function revisarControl() {
    const { hoy, perfil, metas, pesos } = estado;
    const ultima = metas[metas.length - 1];
    if (!perfil || !ultima) return;
    const diaDelControl = ultimoDiaDeControl(hoy, perfil.diaDelControl ?? diaDeLaSemana(metas[0].desde));
    const pesoKg = pesos[pesos.length - 1]?.kg;
    if (diaDelControl <= ultima.desde || pesoKg === undefined) return;
    const c = controlSemanal({
      hoy, pesadas: pesos, comidas: comidasParaElControl(estado.registros.values()), gastoAnterior: ultima.gasto, metasAnteriores: soloMacros(ultima),
      perfil: { edad: edadDe(perfil, hoy), sexo: perfil.sexo, pesoKg, objetivo: perfil.objetivo, ritmo: perfil.ritmo, sinDeficit: perfil.sinDeficit }, estilo: perfil.estilo,
    });
    const aMano = ultima.motivo === 'manual';
    const meta: MetaGuardada = { ...(aMano ? soloMacros(ultima) : c.metas), desde: hoy, gasto: c.gasto, motivo: aMano ? 'manual' : c.motivo, momento: momento() };
    guardar((r) => r.guardarMeta(meta));
    ponerMetas([...metas, meta]);
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

  /** Guarda cosas de una colección de la comida y las pone en el estado: cada una reemplaza la de su clave. */
  function ponerComida<C extends Coleccion>(coleccion: C, lista: DeComida[C][]) {
    if (!lista.length) return;
    const clave = DE_COMIDA[coleccion].clave as (x: DeComida[C]) => string;
    const mapa = new Map(estado[coleccion] as Map<string, DeComida[C]>);
    for (const x of lista) mapa.set(clave(x), x);
    guardar((r) => r.guardarComida(coleccion, lista));
    // Lo registrado puede encender o apagar los hábitos de comida de hoy.
    const alDiaConComida = coleccion === 'registros' ? alDia({ ...estado, registros: mapa as Estado['registros'] }).estado : {};
    cambiar({ [coleccion]: mapa, ...alDiaConComida } as Partial<Estado>, false);
  }

  /** Borrar deja la marca, con su hora: así el borrado llega a los otros teléfonos. */
  function borrarDe<C extends 'registros' | 'recetas' | 'propios' | 'agua'>(coleccion: C, id: string): DeComida[C] | undefined {
    const x = (estado[coleccion] as Map<string, DeComida[C]>).get(id);
    if (!x || x.borrado) return undefined;
    ponerComida(coleccion, [borrado(x, momento())]);
    return x;
  }

  /**
   * Cada alimento es un registro; en un día que no llegó, planificado. Los de una misma vez van con
   * un milisegundo de diferencia: así, en cualquier teléfono, la línea los muestra en el orden en que se sumaron.
   */
  function registrar(items: Item[], donde: { comida: Comida; dia?: ClaveDia; momento?: string }): Registro[] {
    const dia = donde.dia ?? estado.hoy;
    const cuando = momento();
    const desde = Date.parse(donde.momento ?? cuando);
    const nuevos = items.map((it, i): Registro => ({
      fuente: it.fuente, ref: it.ref, nombre: it.nombre, cantidad: it.cantidad, valores: it.valores, ...(it.estimado ? { estimado: true as const } : {}),
      id: nuevoId(), dia, comida: donde.comida, momento: new Date(desde + i).toISOString(), planificado: dia > estado.hoy, actualizado: cuando,
    }));
    ponerComida('registros', nuevos);
    return nuevos;
  }

  function ponerCanasta(canasta: Item[]) {
    guardar((r) => r.guardarAjuste(CANASTA, JSON.stringify(canasta)));
    cambiar({ canasta }, false);
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
    /** Todo lo guardado, para exportarlo: también lo comido de hace más de cuatro meses, que no está en memoria. */
    async paraExportar(): Promise<Pick<Guardado, 'registros' | 'pesos' | 'metas'>> {
      const g = await enCola((r) => r.cargar('0000-01-01', '0000-01-01'));
      return { registros: g.registros, pesos: g.pesos, metas: g.metas };
    },
    /**
     * Borra todo lo del teléfono (al cerrar sesión o al borrar los datos) y arranca de nuevo como la
     * primera vez: con los hábitos de ejemplo y sin perfil, así que vuelve la entrada.
     */
    async olvidarTodo() {
      await iniciando;
      await enCola((r) => r.borrarTodo());
      cambiar({ ...vacio(), listo: false }, true);
      iniciando = arrancar();
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
    /** Un hábito nuevo, desde hoy, después de los que hay. */
    crearHabito(datos: Pick<Habito, 'nombre' | 'icono' | 'dias' | 'fuente'>): Habito {
      const orden = Math.max(-1, ...estado.habitos.map((h) => h.orden)) + 1;
      const habito: Habito = { ...datos, id: nuevoId(), orden, desde: estado.hoy, actualizado: momento() };
      cambiarHabitos([...estado.habitos, habito]);
      return habito;
    },
    /**
     * Los primeros hábitos, apenas termina la entrada: los que había (los de ejemplo) se archivan y
     * quedan los elegidos, desde hoy y en ese orden. Arman la primera constelación.
     */
    elegirPrimerosHabitos(elegidos: Pick<Habito, 'nombre' | 'icono' | 'dias' | 'fuente'>[]) {
      const ahora = momento();
      const viejos = estado.habitos.map((h) => (h.hasta && h.hasta < estado.hoy ? h : { ...archivar(h, estado.hoy), actualizado: ahora }));
      const nuevos = elegidos.map((d, i): Habito => ({ ...d, id: nuevoId(), orden: i, desde: estado.hoy, actualizado: ahora }));
      cambiarHabitos([...viejos, ...nuevos]);
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
      cambiar({ perfil, pesos: [...estado.pesos.filter((p) => p.fecha !== peso.fecha), peso].sort(porFecha((p) => p.fecha)) }, false);
      ponerMetas([...estado.metas.filter((m) => m.desde !== meta.desde), meta].sort(porFecha((m) => m.desde)));
      return meta;
    },
    /**
     * La estrategia de Progreso: el objetivo y su ritmo, cómo se reparten los macros, el peso al que
     * se quiere llegar, el día del control y si se reparte la semana (`semana: undefined` deja de
     * repartirla). Cambiar el objetivo, el ritmo, el reparto o si va sin déficit (embarazo, lactancia o
     * una condición médica) fija metas nuevas desde hoy con el gasto que se venía midiendo; con las
     * metas a mano, quedan las que había. Un peso meta con un IMC de menos de 18,5 no se guarda.
     */
    ponerEstrategia(cambios: Partial<Pick<Perfil, 'objetivo' | 'ritmo' | 'estilo' | 'pesoMeta' | 'diaDelControl' | 'semana' | 'sinDeficit'>>) {
      const antes = estado.perfil;
      if (!antes) return;
      const { pesoMeta, ...resto } = cambios;
      const sano = pesoMeta === undefined || pesoMeta >= pesoMinimoSano(antes.alturaCm);
      const perfil: Perfil = { ...antes, ...resto, ...(sano && 'pesoMeta' in cambios ? { pesoMeta } : {}), actualizado: momento() };
      guardar((r) => r.guardarPerfil(perfil));
      cambiar({ perfil }, false);
      const ultima = estado.metas[estado.metas.length - 1];
      const pesoKg = estado.pesos[estado.pesos.length - 1]?.kg;
      const cambiaLaMeta = perfil.objetivo !== antes.objetivo || perfil.ritmo !== antes.ritmo || perfil.estilo !== antes.estilo || !!perfil.sinDeficit !== !!antes.sinDeficit;
      if (!ultima || ultima.motivo === 'manual' || pesoKg === undefined || !cambiaLaMeta) return;
      const c = { edad: edadDe(perfil, estado.hoy), sexo: perfil.sexo, pesoKg, objetivo: perfil.objetivo, ritmo: perfil.ritmo, sinDeficit: perfil.sinDeficit };
      const meta: MetaGuardada = { ...metaPara(ultima.gasto, c, perfil.estilo), desde: estado.hoy, gasto: ultima.gasto, motivo: 'objetivo', momento: momento() };
      guardar((r) => r.guardarMeta(meta));
      ponerMetas([...estado.metas.filter((m) => m.desde !== meta.desde), meta].sort(porFecha((m) => m.desde)));
    },
    /**
     * Tus datos, desde Perfil: el sexo, el año de nacimiento, la altura y la actividad. Las metas no
     * cambian: el control de cada semana mide el gasto de verdad.
     */
    ponerDatos(cambios: Partial<Pick<Perfil, 'sexo' | 'nacimiento' | 'alturaCm' | 'actividad'>>) {
      const antes = estado.perfil;
      if (!antes) return;
      const perfil: Perfil = { ...antes, ...cambios, actualizado: momento() };
      guardar((r) => r.guardarPerfil(perfil));
      cambiar({ perfil }, false);
    },
    /**
     * Lo que se leyó de Salud. Los hábitos automáticos de hoy que llegaron a su meta se encienden
     * solos (Salud nunca los apaga), y los días sin peso toman el de Salud.
     */
    ponerSalud(s: LoDeSalud) {
      const nuevos: Peso[] = [];
      for (const [fecha, kg] of s.pesos) {
        if (kg >= 20 && kg <= 400 && !estado.pesos.some((p) => p.fecha === fecha)) nuevos.push({ fecha, kg: Math.round(kg * 10) / 10, origen: 'salud', momento: momento() });
      }
      for (const peso of nuevos) guardar((r) => r.guardarPeso(peso));
      const pesos = nuevos.length ? [...estado.pesos, ...nuevos].sort(porFecha((p) => p.fecha)) : estado.pesos;
      // Los valores se ven en las etiquetas del cielo: si cambian, se rearma.
      cambiar({ salud: s, pesos }, JSON.stringify(estado.salud?.valores ?? null) !== JSON.stringify(s.valores));
      if (s.dia !== estado.hoy) return;
      for (const h of habitosDelDia(estado.habitos, estado.hoy)) {
        if (h.fuente.tipo !== 'salud' || h.fuente.dato === 'acostarse') continue;
        const valor = s.valores[h.fuente.dato];
        if (valor !== undefined && valor >= h.fuente.meta && !estado.marcas.get(claveDeMarca(h.id, estado.hoy))?.hecho) marcar(h.id, true, 'salud');
      }
    },
    /** Volver de las metas a mano a las de Moss: las del objetivo y el reparto, con el gasto que se venía midiendo. */
    metasDeMoss(): MetaGuardada | null {
      const ultima = estado.metas[estado.metas.length - 1];
      const perfil = estado.perfil;
      const pesoKg = estado.pesos[estado.pesos.length - 1]?.kg;
      if (!ultima || !perfil || pesoKg === undefined) return null;
      const c = { edad: edadDe(perfil, estado.hoy), sexo: perfil.sexo, pesoKg, objetivo: perfil.objetivo, ritmo: perfil.ritmo, sinDeficit: perfil.sinDeficit };
      const meta: MetaGuardada = { ...metaPara(ultima.gasto, c, perfil.estilo), desde: estado.hoy, gasto: ultima.gasto, motivo: 'objetivo', momento: momento() };
      guardar((r) => r.guardarMeta(meta));
      ponerMetas([...estado.metas.filter((m) => m.desde !== meta.desde), meta].sort(porFecha((m) => m.desde)));
      return meta;
    },
    /**
     * Las metas a mano, desde hoy: los gramos de cada macro (y las kcal, si se dan), con el gasto que
     * se venía midiendo. Por debajo del piso de calorías no se guardan (motivoParaNo).
     */
    ponerMetasAMano(macros: Omit<Macros, 'kcal'> & { kcal?: number }): MetaGuardada | null {
      const ultima = estado.metas[estado.metas.length - 1];
      if (!ultima) return null;
      const manual = metaManual(macros);
      if (estado.perfil && motivoParaNo(manual, estado.perfil.sexo)) return null;
      const meta: MetaGuardada = { ...manual, desde: estado.hoy, gasto: ultima.gasto, motivo: 'manual', momento: momento() };
      guardar((r) => r.guardarMeta(meta));
      ponerMetas([...estado.metas.filter((m) => m.desde !== meta.desde), meta].sort(porFecha((m) => m.desde)));
      return meta;
    },
    // ---------------------------------------------------------------- lo que se come
    /** Anotar lo comido (o lo planificado, en un día que no llegó). Devuelve los registros nuevos. */
    registrar,
    /**
     * Corregir un registro desde su ventana: la cantidad y sus valores, si fue a ojo, la comida o la
     * hora; o pasarlo a la otra versión del mismo alimento (de crudo a cocido).
     */
    cambiarRegistro(id: string, cambios: Partial<Pick<Registro, 'fuente' | 'ref' | 'nombre' | 'cantidad' | 'valores' | 'comida' | 'momento'>> & { estimado?: boolean }) {
      const r = estado.registros.get(id);
      if (!r || r.borrado) return;
      const { estimado, ...resto } = cambios;
      const { estimado: _antes, ...sinMarca } = r;
      const marca = (estimado ?? r.estimado) ? { estimado: true as const } : {};
      ponerComida('registros', [{ ...sinMarca, ...resto, ...marca, actualizado: momento() }]);
    },
    /** Devuelve lo borrado (para el aviso de deshacer). */
    borrarRegistro: (id: string) => borrarDe('registros', id),
    deshacerBorrado(id: string) {
      const r = estado.registros.get(id);
      if (r?.borrado) ponerComida('registros', [restaurado(r, momento())]);
    },
    /** Una comida (o el día entero, sin `comida`) a otro día: a la misma hora y, si el día no llegó, planificada. */
    copiar(desde: { dia: ClaveDia; comida?: Comida }, hacia: { dia: ClaveDia; comida?: Comida }): Registro[] {
      const copia = copiar(estado.registros.values(), desde, hacia, { hoy: estado.hoy, ahora: momento(), nuevoId });
      ponerComida('registros', copia);
      return copia;
    },
    /** Llegó el día: lo planificado pasa a registrado. Devuelve cuántos. */
    confirmarPlanificados(dia: ClaveDia = estado.hoy): number {
      const hechos = confirmar(estado.registros.values(), dia, momento());
      ponerComida('registros', hechos);
      return hechos.length;
    },
    // ---------------------------------------------------------------- el plan de comidas
    planificar,
    /** «Comí esto»: lo planificado de una comida pasa a anotado, con un toque. Devuelve los ids, para deshacer. */
    confirmarComida(dia: ClaveDia, comida: Comida): string[] {
      const hechos = confirmar(estado.registros.values(), dia, momento(), comida);
      ponerComida('registros', hechos);
      return hechos.map((r) => r.id);
    },
    /** Deshacer «Comí esto». */
    volverAPlanificar(ids: readonly string[]) {
      const cuando = momento();
      ponerComida('registros', ids.flatMap((id) => {
        const r = estado.registros.get(id);
        return r && !r.borrado ? [{ ...r, planificado: true, actualizado: cuando }] : [];
      }));
    },
    /**
     * «Otra» y «No me gusta»: la comida planificada pasa a ser otra, a la misma hora. Devuelve cómo
     * deshacerlo.
     */
    cambiarPlanificada(dia: ClaveDia, nueva: ComidaPlaneada, horaDe: (c: Comida) => number): () => void {
      const viejos = delDia(estado.registros.values(), dia).filter((r) => r.planificado && r.comida === nueva.comida);
      const cuando = momento();
      ponerComida('registros', viejos.map((r) => borrado(r, cuando)));
      const nuevos = planificar(dia, [nueva], horaDe, viejos.length ? { [nueva.comida]: Date.parse(viejos[0].momento) } : {});
      return () => {
        const despues = momento();
        ponerComida('registros', [...nuevos.map((r) => borrado(r, despues)), ...viejos.map((r) => restaurado(r, despues))]);
      };
    },
    /** Cómo comes (dieta, alergias, comidas, tiempo y lo que gusta o no): va en el perfil y sube con él. */
    ponerComer(comer: Preferencias) {
      const antes = estado.perfil;
      if (!antes) return;
      const perfil: Perfil = { ...antes, comer, actualizado: momento() };
      guardar((r) => r.guardarPerfil(perfil));
      cambiar({ perfil }, false);
    },
    /** Los bloques de Inicio, en su orden y cuáles se ven. */
    ponerInicio(inicio: NonNullable<Estado['inicio']>) {
      guardar((r) => r.guardarAjuste(INICIO, JSON.stringify(inicio)));
      cambiar({ inicio }, false);
    },
    /** Las comidas que avisan; null los apaga. */
    ponerRecordatorios(comidas: Comida[] | null) {
      guardar((r) => r.guardarAjuste(RECORDATORIOS, JSON.stringify(comidas)));
      cambiar({ recordatorios: comidas }, false);
    },
    ponerSistema(sistema: Sistema) {
      guardar((r) => r.guardarAjuste(SISTEMA, sistema));
      cambiar({ sistema }, false);
    },
    /** La calidad de las animaciones; null vuelve a la automática. */
    ponerCalidad(calidad: Calidad | null) {
      guardar((r) => r.guardarAjuste(CALIDAD, calidad ?? ''));
      cambiar({ calidad }, false);
    },
    /** Los números de la comida: a la vista o no (solo las figuras y las barras). */
    ponerNumeros(numeros: boolean) {
      guardar((r) => r.guardarAjuste(NUMEROS, numeros ? '' : 'no'));
      cambiar({ numeros }, false);
    },
    /** Mandar, sin la cuenta, lo que se busca y no se encuentra. */
    ponerMandarBusquedas(si: boolean) {
      guardar((r) => r.guardarAjuste(BUSQUEDAS, si ? 'si' : ''));
      cambiar({ mandarBusquedas: si }, false);
    },
    /** De cuál aparato sale la noche; null vuelve a la automática (la más precisa de cada noche). */
    ponerFuenteDelSueno(id: string | null) {
      guardar((r) => r.guardarAjuste(FUENTE_DEL_SUENO, id ?? ''));
      cambiar({ fuenteDelSueno: id }, false);
    },
    /**
     * Moss se abrió o se cerró. Al abrir queda un momento; al cerrar, ese momento se vuelve un rato.
     * Si se cerró sin avisar (el sistema la cerró), queda el momento. Lo de hace más de tres días se va.
     */
    anotarUso(que: 'abrir' | 'cerrar', en = ahora().getTime()) {
      const lista = estado.uso.filter(([, hasta]) => hasta >= en - DIAS_DE_USO * 86_400_000);
      const ultimo = lista[lista.length - 1];
      let uso: [number, number][];
      if (que === 'abrir') uso = [...lista, [en, en]];
      else if (ultimo && ultimo[0] === ultimo[1] && en >= ultimo[0]) uso = [...lista.slice(0, -1), [ultimo[0], en]];
      else return;
      guardar((r) => r.guardarAjuste(USO, JSON.stringify(uso)));
      cambiar({ uso }, false);
    },
    ponerEnCanasta: (item: Item) => ponerCanasta([...estado.canasta, item]),
    cambiarEnCanasta: (i: number, item: Item) => ponerCanasta(estado.canasta.map((x, k) => (k === i ? item : x))),
    quitarDeCanasta: (i: number) => ponerCanasta(estado.canasta.filter((_, k) => k !== i)),
    /** «Agregar»: lo de la canasta pasa de una vez a registros, y la canasta queda vacía. */
    agregarCanasta(donde: { comida: Comida; dia?: ClaveDia; momento?: string }): Registro[] {
      const nuevos = registrar(estado.canasta, donde);
      if (nuevos.length) ponerCanasta([]);
      return nuevos;
    },
    /** Una receta o una comida guardada, nueva o editada. */
    guardarReceta(receta: Omit<Receta, 'id' | 'actualizado' | 'borrado'> & { id?: string }): Receta {
      const r: Receta = { ...receta, id: receta.id ?? nuevoId(), actualizado: momento() };
      ponerComida('recetas', [r]);
      return r;
    },
    borrarReceta: (id: string) => borrarDe('recetas', id),
    guardarPropio(alimento: Omit<AlimentoPropio, 'id' | 'actualizado' | 'borrado'> & { id?: string }): AlimentoPropio {
      const a: AlimentoPropio = { ...alimento, id: alimento.id ?? nuevoId(), actualizado: momento() };
      ponerComida('propios', [a]);
      return a;
    },
    borrarPropio: (id: string) => borrarDe('propios', id),
    ponerFavorito(fuente: Fuente, ref: string, favorito: boolean) {
      ponerComida('favoritos', [{ fuente, ref, favorito, actualizado: momento() }]);
    },
    /** Un vaso de 250 ml, o lo que se diga, hoy. */
    sumarAgua(ml = 250): TomaDeAgua {
      const cuando = momento();
      const toma: TomaDeAgua = { id: nuevoId(), dia: estado.hoy, ml, momento: cuando, actualizado: cuando };
      ponerComida('agua', [toma]);
      return toma;
    },
    quitarAgua: (id: string) => borrarDe('agua', id),
    // ---------------------------------------------------------------- el cuerpo
    /**
     * Las medidas de un día: se suman a las que ya había ese día (no hace falta medir todo junto).
     * Lo que está fuera de lo posible no se guarda. Devuelve cómo quedó el día, o null si no había nada válido.
     */
    guardarMedidas(cm: Centimetros, fecha: ClaveDia = estado.hoy): Medidas | null {
      const validas = Object.fromEntries(SITIOS.flatMap((s) => (cm[s] !== undefined && medidaValida(s, cm[s]!) ? [[s, cm[s]]] : [])));
      if (!Object.keys(validas).length) return null;
      const antes = estado.medidas.get(fecha);
      const { borrado: _b, ...previas } = antes && !antes.borrado ? antes : { fecha };
      const dia: Medidas = { ...previas, ...validas, fecha, actualizado: momento() };
      ponerComida('medidas', [dia]);
      return dia;
    },
    /** Cómo dijiste que dormiste la noche que terminó `fecha` (de 1 a 5). */
    ponerCara(fecha: ClaveDia, cara: Cara) {
      const antes = estado.noches.get(fecha);
      ponerComida('noches', [{ ...(antes && !antes.borrado ? antes : {}), fecha, cara, actualizado: momento() }]);
    },
    /** La hora del sueño de una noche sin reloj: la estimada, o la que confirmaste o corregiste. */
    ponerHoraDeLaNoche(fecha: ClaveDia, hora: NonNullable<NochePropia['hora']>) {
      const antes = estado.noches.get(fecha);
      ponerComida('noches', [{ ...(antes && !antes.borrado ? antes : {}), fecha, hora, actualizado: momento() }]);
    },
    borrarMedidas(fecha: ClaveDia) {
      const x = estado.medidas.get(fecha);
      if (x && !x.borrado) ponerComida('medidas', [borrado(x, momento())]);
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
        logros: estado.logros, perfil: estado.perfil, metas: estado.metas, pesos: estado.pesos, semilla: estado.semilla, ...listasDe(estado),
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
      const comida = mapasDe(d);
      const { estado: nuevo } = alDia({
        hoy: estado.hoy,
        habitos: d.habitos,
        periodos: d.periodos,
        semilla,
        dias,
        marcas: new Map(marcas.map((m) => [claveDeMarca(m.habito, m.dia), m])),
        logros: d.logros,
        registros: comida.registros,
        metas: d.metas,
      });
      cambiar({ ...nuevo, semilla, perfil: d.perfil, metas: d.metas, pesos: d.pesos, ...comida }, true);
      return true;
    },
    /** Si ya es otro día (medianoche, o la app vuelve del fondo), arma el nuevo. */
    revisarDia(): boolean {
      const hoy = claveDelDia(ahora(), zona());
      if (!estado.listo || hoy === estado.hoy) return false;
      cambiar(alDia({ ...estado, hoy }).estado, true);
      revisarControl();
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
