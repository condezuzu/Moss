// La hoja de registro es una sola, arriba de todo (Secciones.tsx): la abren Comida, Inicio y la
// hoja del «+». Este es su pedido: qué comida, qué día y con qué abre.

import { useSyncExternalStore } from 'react';

import type { Comida } from '@/dominio/comidas';
import type { ClaveDia } from '@/dominio/fechas';
import type { Item } from '@/dominio/registros';

export type Panel = 'revision' | 'rapida' | 'guardadas' | 'crear' | 'receta' | 'pegar' | 'codigo' | 'etiqueta' | 'decir' | 'foto';

export type Pedido = {
  /** Sin comida, la de la hora. */
  comida?: Comida;
  /** Sin día, hoy. Un día que no llegó queda planificado. */
  dia?: ClaveDia;
  /** Abre la ventana de un registro de la línea del día, para corregirlo. */
  editar?: string;
  /** Abre directo en un panel. */
  panel?: Panel;
  /** Lo que se suma a la comida que se arma al abrir (copiar de ayer abre la revisión con eso). */
  items?: Item[];
  /** Desde la hoja del «+»: la carga rápida registra sin pasar por la revisión. */
  directo?: boolean;
  /**
   * La foto de la comida (fotos.ts): «¿Qué es?» de una que quedó sin anotar (con el panel «decir»), o el
   * visor (el panel «foto») para sacar otra en su lugar o, con `paraComida`, sumarle una a una comida ya anotada.
   */
  foto?: { anotar?: string; reemplazar?: string; paraComida?: { comida: Comida; minutos: number } };
};

let actual: (Pedido & { vez: number }) | null = null;
const oyentes = new Set<() => void>();
const cambio = () => oyentes.forEach((o) => o());

export function abrirRegistro(pedido: Pedido = {}) {
  actual = { ...pedido, vez: (actual?.vez ?? 0) + 1 };
  cambio();
}

export function cerrarRegistro() {
  if (!actual) return;
  actual = null;
  cambio();
}

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

/** El pedido abierto, o null con la hoja cerrada. */
export function useRegistro() {
  return useSyncExternalStore(suscribir, () => actual);
}

// El aviso de abajo de toda la app: lo que se registró desde la hoja o desde el «+», con «Deshacer» (o, con `boton`,
// lo que diga: «Reintentar»).
let aviso: { texto: string; deshacer?: () => void; boton?: string; vez: number } | null = null;
const oyentesDelAviso = new Set<() => void>();

export function avisar(texto: string, deshacer?: () => void, boton?: string) {
  aviso = { texto, deshacer, boton, vez: (aviso?.vez ?? 0) + 1 };
  oyentesDelAviso.forEach((o) => o());
}

export function quitarAviso() {
  aviso = null;
  oyentesDelAviso.forEach((o) => o());
}

export function useAviso() {
  return useSyncExternalStore((o: () => void) => {
    oyentesDelAviso.add(o);
    return () => oyentesDelAviso.delete(o);
  }, () => aviso);
}
