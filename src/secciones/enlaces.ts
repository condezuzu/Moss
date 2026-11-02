// Los enlaces de los widgets: moss://habitos, moss://sueno, moss://comida, moss://inicio y
// moss://anotar?comida=cena&via=decir. Solo arma y lee texto: lo usa también src/app/+native-intent.ts,
// que corre antes que la app. moss://compartido no es de estos: sigue siendo una pantalla.

import { COMIDAS, type Comida } from '@/dominio/comidas';

export type Via = 'buscar' | 'decir' | 'codigo' | 'etiqueta';
export type SeccionDeEnlace = 'inicio' | 'comida' | 'habitos' | 'sueno';
export type Enlace = { seccion: SeccionDeEnlace } | { anotar: { comida?: Comida; via?: Via } };

const SECCIONES: readonly string[] = ['inicio', 'comida', 'habitos', 'sueno'];
const VIAS: readonly string[] = ['buscar', 'decir', 'codigo', 'etiqueta'];

export const enlaceASeccion = (seccion: SeccionDeEnlace) => `moss://${seccion}`;

export function enlaceDeAnotar(op: { comida?: Comida | '{comida}'; via?: Via } = {}): string {
  const partes = [op.comida ? `comida=${op.comida}` : '', op.via ? `via=${op.via}` : ''].filter(Boolean);
  return `moss://anotar${partes.length ? `?${partes.join('&')}` : ''}`;
}

/** Lo que dice un enlace de los widgets, o null si no es de estos. Sirve con la URL o con el camino. */
export function leerEnlace(url: string): Enlace | null {
  const m = url.trim().match(/^(?:moss:\/*|\/)?([a-z]+)\/?(?:\?(.*))?$/i);
  if (!m) return null;
  const donde = m[1].toLowerCase();
  if (SECCIONES.includes(donde)) return { seccion: donde as SeccionDeEnlace };
  if (donde !== 'anotar') return null;
  const parametros = new Map((m[2] ?? '').split('&').filter(Boolean).map((p) => p.split('=') as [string, string]));
  const comida = parametros.get('comida');
  const via = parametros.get('via');
  return {
    anotar: {
      ...(comida && (COMIDAS as readonly string[]).includes(comida) ? { comida: comida as Comida } : {}),
      ...(via && VIAS.includes(via) ? { via: via as Via } : {}),
    },
  };
}
