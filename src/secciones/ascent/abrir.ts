// Abrir la sección de Ascent desde otra sección (la recuperación en Sueño, la fila de Perfil): la
// abre Secciones.tsx, que pasa por Hábitos y la sube, como en la galería.

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
