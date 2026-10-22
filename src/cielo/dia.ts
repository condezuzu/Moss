// Lo que el cielo de hoy necesita saber, armado desde el almacén. La forma (constelación,
// hábitos, semana) cambia poco y rehace la escena; lo encendido cambia con cada toque y no.

import { useSyncExternalStore } from 'react';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { fraseDelDia, type Frase } from '@/contenido/frases';
import { catalogo, type Constelacion } from '@/datos/catalogo';
import { periodoDe } from '@/dominio/constelaciones';
import { claveDeMarca, luzAcumulada } from '@/dominio/dias';
import { partesDe, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { habitosDelDia, type Habito } from '@/dominio/habitos';
import { semanaDe } from '@/dominio/semana';

/**
 * D5, pendiente: si la luz de hoy hace crecer el cielo recién mañana (de noche, lo recomendado) o
 * al instante. Con `false`, crece apenas se enciende algo.
 */
const CRECE_DE_NOCHE = true;

export type Automatico = 'pasos' | 'agua' | 'mindfulness' | 'sueno' | 'acostarse' | 'ascent' | 'comida';

export type HabitoDelCielo = {
  id: string;
  nombre: string;
  /** Nombre de SF Symbol. */
  icono: string;
  auto?: Automatico;
  /** Lo que lleva hoy un hábito automático (llega con Salud, etapa 8) y su meta. */
  valor?: number;
  meta?: number;
};

export type DiaDeLaSemanaDelCielo = { dia: DiaSemana; constelacion: Constelacion; hechos: number; hoy: boolean };

export type DiaDelCielo = {
  clave: ClaveDia;
  /** Sin hábitos hoy, no hay constelación. */
  constelacion: Constelacion | null;
  /** En el orden de las estrellas: el hábito i va en la estrella i. */
  habitos: HabitoDelCielo[];
  frase: Frase;
  luzAcumulada: number;
  semana: DiaDeLaSemanaDelCielo[];
  fecha: { diaSemana: DiaSemana; diaMes: number; mes: number };
};

function automatico(h: Habito, salud: Estado['salud'], hoy: ClaveDia): Pick<HabitoDelCielo, 'auto' | 'meta' | 'valor'> {
  if (h.fuente.tipo === 'salud') {
    // Lo que lleva hoy, si Salud lo dijo.
    const valor = salud?.dia === hoy && h.fuente.dato !== 'acostarse' ? salud.valores[h.fuente.dato] : undefined;
    return { auto: h.fuente.dato, meta: h.fuente.meta, ...(valor !== undefined ? { valor } : {}) };
  }
  if (h.fuente.tipo === 'manual') return {};
  return { auto: h.fuente.tipo };
}

/** Con más estrellas que hábitos (ver `asignar`), el día usa las más brillantes. */
function paraHabitos(id: string | null | undefined, cantidad: number): Constelacion | null {
  const c = id ? catalogo.find((x) => x.id === id) : undefined;
  if (!c || cantidad === 0) return null;
  if (c.estrellas.length <= cantidad) return c;
  return { ...c, estrellas: c.estrellas.slice(0, cantidad), lineas: c.lineas.filter(([a, b]) => a < cantidad && b < cantidad) };
}

export function armarCieloDeHoy(e: Estado): DiaDelCielo {
  const habitos = habitosDelDia(e.habitos, e.hoy);
  const { diaSemana, dia, mes } = partesDe(e.hoy);
  const semana: DiaDeLaSemanaDelCielo[] = [];
  for (const d of semanaDe(e.hoy, e.periodos, e.dias, e.habitos)) {
    const constelacion = paraHabitos(d.constelacion, d.total);
    if (constelacion) semana.push({ dia: d.dia, constelacion, hechos: d.hechos, hoy: d.hoy });
  }
  return {
    clave: e.hoy,
    constelacion: paraHabitos(e.dias.get(e.hoy)?.constelacion ?? periodoDe(e.periodos, e.hoy)?.constelacion, habitos.length),
    habitos: habitos.map((h) => ({ id: h.id, nombre: h.nombre, icono: h.icono, ...automatico(h, e.salud, e.hoy) })),
    frase: fraseDelDia(e.hoy),
    luzAcumulada: luzAcumulada(e.dias.values(), CRECE_DE_NOCHE ? e.hoy : undefined),
    semana,
    fecha: { diaSemana, diaMes: dia, mes },
  };
}

let forma: { numero: number; dia: DiaDelCielo } | undefined;
let encendidos: { version: number; lista: boolean[] } | undefined;

/** Cambia solo con la forma del cielo: el día, los hábitos o sus constelaciones. */
export function useCieloDeHoy(): DiaDelCielo {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => {
    const e = a.estado();
    if (forma?.numero !== e.forma) forma = { numero: e.forma, dia: armarCieloDeHoy(e) };
    return forma.dia;
  });
}

/** La calidad elegida en Perfil, o null si es la automática. */
export function useCalidadElegida() {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => a.estado().calidad);
}

/** Qué hábito de hoy está encendido, en el orden de las estrellas. */
export function useEncendidos(): boolean[] {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => {
    const e = a.estado();
    if (encendidos?.version !== e.version) {
      encendidos = { version: e.version, lista: habitosDelDia(e.habitos, e.hoy).map((h) => e.marcas.get(claveDeMarca(h.id, e.hoy))?.hecho ?? false) };
    }
    return encendidos.lista;
  });
}
