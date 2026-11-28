// Abrir la sección de Ascent desde otra sección (la recuperación en Sueño, la fila de Perfil): la
// abre Secciones.tsx, que pasa por Hábitos y la sube, como en la galería. Y, en ella, la hoja de una meta con lo
// escrito («Reintentar», si no se pudo guardar): el pedido queda acá hasta que las metas de la sección se arman, así
// anda también con la sección cerrada.

import type { Borrador } from './HojaDeMeta';

let oyente: (() => void) | null = null;

export function alAbrirAscent(abrir: () => void): () => void {
  oyente = abrir;
  return () => {
    if (oyente === abrir) oyente = null;
  };
}

export function abrirAscent(): void {
  oyente?.();
}

let metaPedida: Borrador | null = null;
let alPedirLaMeta: ((b: Borrador) => void) | null = null;

/** Las metas de la sección, armadas: abren la hoja con lo que se pida y, si ya había algo pedido, enseguida. */
export function alReabrirLaMeta(abrir: (b: Borrador) => void): () => void {
  alPedirLaMeta = abrir;
  if (metaPedida) {
    const b = metaPedida;
    metaPedida = null;
    abrir(b);
  }
  return () => {
    if (alPedirLaMeta === abrir) alPedirLaMeta = null;
  };
}

/** Abre la sección y, en ella, la hoja de la meta con lo escrito. */
export function reabrirLaMeta(b: Borrador): void {
  abrirAscent();
  if (alPedirLaMeta) alPedirLaMeta(b);
  else metaPedida = b;
}

/** Desvinculada, lo pedido ya no va. */
export function olvidarLaMetaPedida(): void {
  metaPedida = null;
}
