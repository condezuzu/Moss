// El mundo del cielo: en unidades de alto de pantalla, con la y hacia arriba y (0, 0) en el
// centro de la zona de hoy. Es el mismo sistema que la galería (galeria/src/escena.js).

import type { Estrella } from '@/datos/catalogo';

export type Punto = [number, number];

export const HORIZONTE = -0.36;
/** Dónde queda "tu universo", arriba de hoy. */
export const ZONA_UNIVERSO = 1.3;
/** Cuánto sigue cada capa a la cámara: lo que está más cerca se mueve más. */
export const PARALAJE = { cielo: 1, aurora: 1.12, lomas: [1.16, 1.3, 1.48] } as const;

export type Calidad = 'alta' | 'media' | 'baja';
export type AjustesDeCalidad = {
  /** Píxeles por punto del cielo fijo (la textura). */
  dprFondo: number;
  octavas: number;
  capas: number;
  /** Cortinas de aurora. En el teléfono la aurora va a resolución completa, así que son menos. */
  cortinas: number;
  /** Fracción de celdas de 64 px con una estrella que titila. */
  densidad: number;
  particulas: number;
};

export const CALIDADES: Record<Calidad, AjustesDeCalidad> = {
  alta: { dprFondo: 2, octavas: 6, capas: 3, cortinas: 3, densidad: 0.42, particulas: 1 },
  media: { dprFondo: 1.5, octavas: 5, capas: 3, cortinas: 2, densidad: 0.26, particulas: 0.6 },
  baja: { dprFondo: 1, octavas: 4, capas: 2, cortinas: 1, densidad: 0.14, particulas: 0.3 },
};

/** El rectángulo del mundo que cubre la textura del cielo fijo, con margen para la cámara. */
export function mundoDelFondo(aspecto: number): { min: Punto; tam: Punto } {
  const margenX = 0.08;
  return { min: [-aspecto / 2 - margenX, -0.62], tam: [aspecto + 2 * margenX, 1.24 + ZONA_UNIVERSO] };
}

/** Azar con semilla (mulberry32): el mismo musgo en cada arranque. */
export function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Proyección gnomónica centrada en la constelación, con el norte arriba y el este a la izquierda:
 * así se ve mirando el cielo, y así la dibujan los atlas.
 */
export function proyectar(estrellas: Estrella[]): Punto[] {
  const rad = Math.PI / 180;
  const vs = estrellas.map((e) => {
    const ra = e.ra * rad;
    const dec = e.dec * rad;
    return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
  });
  const c = [0, 0, 0];
  vs.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
  const lc = Math.hypot(c[0], c[1], c[2]);
  c[0] /= lc; c[1] /= lc; c[2] /= lc;
  const le = Math.hypot(c[0], c[1]);
  const este = le < 1e-6 ? [1, 0, 0] : [-c[1] / le, c[0] / le, 0];
  const norte = [c[1] * este[2] - c[2] * este[1], c[2] * este[0] - c[0] * este[2], c[0] * este[1] - c[1] * este[0]];
  return vs.map((v) => {
    const k = v[0] * c[0] + v[1] * c[1] + v[2] * c[2];
    return [-(v[0] * este[0] + v[1] * este[1] + v[2] * este[2]) / k, (v[0] * norte[0] + v[1] * norte[1] + v[2] * norte[2]) / k];
  });
}

/** Escala y centra la figura proyectada para que entre en el rectángulo pedido. */
export function encajar(plano: Punto[], centro: Punto, maxAncho: number, maxAlto: number): Punto[] {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  const escala = plano.length < 2 ? 1 : Math.min(maxAncho / Math.max(x1 - x0, 1e-6), maxAlto / Math.max(y1 - y0, 1e-6));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return plano.map(([x, y]) => [centro[0] + (x - cx) * escala, centro[1] + (y - cy) * escala]);
}

/** Orden en que se encienden las líneas: desde la estrella más brillante hacia afuera. */
export function profundidades(n: number, lineas: [number, number][]): number[] {
  const prof = new Array<number>(n).fill(Infinity);
  if (n === 0) return prof;
  prof[0] = 0;
  const cola = [0];
  while (cola.length) {
    const a = cola.shift()!;
    lineas.forEach(([p, q]) => {
      const b = p === a ? q : q === a ? p : -1;
      if (b >= 0 && prof[b] === Infinity) { prof[b] = prof[a] + 1; cola.push(b); }
    });
  }
  return prof.map((p) => (p === Infinity ? 0 : p));
}
