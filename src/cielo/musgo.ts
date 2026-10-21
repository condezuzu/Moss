// Las lomas de musgo y la luz que tienen adentro, igual que en la galería (galeria/src/escena.js, armarMusgo).
// Todo en el mundo, con la cámara en cero: la escena después las desplaza con su paralaje.

import { azar, HORIZONTE, PARALAJE, type Punto } from './mundo';

type Color = [number, number, number];

export type Loma = {
  /** El borde de arriba, de izquierda a derecha. */
  borde: Punto[];
  base: number;
  paralaje: number;
  cuerpo: Color;
  colorBorde: Color;
  luz: number;
};

/** Un puntito de luz dentro del musgo de adelante. */
export type Brote = { x: number; y: number; tam: number; fase: number; brillo: number };

function ruido1(x: number, semilla: number) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => { const s = Math.sin((n + semilla * 57.31) * 127.1) * 43758.5453; return s - Math.floor(s); };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

function fbm1(x: number, semilla: number, octavas: number) {
  let s = 0, a = 0.5, t = 0;
  for (let k = 0; k < octavas; k++) { s += a * ruido1(x, semilla + k * 13.7); t += a; x *= 2.07; a *= 0.5; }
  return s / t;
}

// De atrás hacia adelante: la de atrás más azulada y clara (aire de por medio), la de adelante
// casi negra con el borde encendido por la aurora.
const DEFINICIONES = [
  { base: HORIZONTE + 0.03, amp: 0.024, frec: 3.0, semilla: 3, cojines: 8, pelusa: 0.0008, cuerpo: [0.032, 0.052, 0.078] as Color, colorBorde: [0.24, 0.4, 0.42] as Color, luz: 0.22 },
  { base: HORIZONTE + 0.008, amp: 0.026, frec: 4.2, semilla: 7, cojines: 14, pelusa: 0.0012, cuerpo: [0.016, 0.03, 0.03] as Color, colorBorde: [0.32, 0.55, 0.36] as Color, luz: 0.32 },
  { base: HORIZONTE - 0.036, amp: 0.018, frec: 5.4, semilla: 11, cojines: 24, pelusa: 0.0018, cuerpo: [0.007, 0.014, 0.012] as Color, colorBorde: [0.46, 0.68, 0.32] as Color, luz: 0.46 },
];

type Cojin = { x: number; r: number; h: number };

function altura(d: (typeof DEFINICIONES)[number], cojines: Cojin[], x: number) {
  let h = d.base + d.amp * (fbm1(x * d.frec + 3.1, d.semilla, 4) - 0.5) * 2;
  h += 0.0028 * (fbm1(x * 95, d.semilla + 5, 2) - 0.5);
  // Pelusa del borde: de cerca, el musgo son miles de tallitos, no una línea lisa.
  h += d.pelusa * (ruido1(x * 260, d.semilla + 9) - 0.5);
  cojines.forEach((c) => {
    const u = (x - c.x) / c.r;
    if (u > -1 && u < 1) h += c.h * Math.sqrt(1 - u * u);
  });
  return h;
}

/**
 * crecimiento va de 0 a 1: la riqueza del cielo, que sale de la luz juntada desde siempre. Más
 * musgo, más cojines y más luz dentro del musgo; nunca baja. Cada loma y los manchones de luz
 * tienen su propio azar: al crecer, lo que ya estaba queda donde estaba y solo se suma lo nuevo.
 * `pasoMundo` es cuánto mide un punto de pantalla en el mundo.
 */
export function armarMusgo(aspecto: number, crecimiento: number, pasoMundo: number): { lomas: Loma[]; brotes: Brote[] } {
  const ancho = aspecto / 2 + 0.25;
  const paso = 1.5 * pasoMundo;
  const listas: Cojin[][] = [];
  const lomas = DEFINICIONES.map((d, k) => {
    const r = azar(99 + 101 * k);
    // Cojines bajos y anchos: el musgo crece en almohadones, no en copas como un árbol.
    const cojines: Cojin[] = [];
    const n = Math.round(d.cojines * (0.45 + 0.9 * crecimiento));
    for (let i = 0; i < n; i++) {
      const radio = 0.014 + r() * 0.032;
      cojines.push({ x: (r() * 2 - 1) * ancho, r: radio, h: radio * (0.18 + 0.2 * r()) * (0.6 + 0.7 * crecimiento) });
    }
    listas.push(cojines);
    const borde: Punto[] = [];
    for (let x = -ancho; x <= ancho + paso; x += paso) borde.push([x, altura(d, cojines, x)]);
    return { borde, base: d.base, paralaje: PARALAJE.lomas[k], cuerpo: d.cuerpo, colorBorde: d.colorBorde, luz: d.luz };
  });

  // Luz atrapada en el musgo de adelante: el musgo luminoso de verdad (Schistostega) no tiene
  // tallos que brillan, refleja la poca luz que hay desde adentro, en manchones de puntitos.
  const r = azar(7777);
  const brotes: Brote[] = [];
  const manchones = Math.round(4 + 8 * crecimiento);
  for (let m = 0; m < manchones; m++) {
    const cx = (r() * 2 - 1) * (aspecto / 2 + 0.02);
    const n = 4 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 0.04;
      brotes.push({ x, y: altura(DEFINICIONES[2], listas[2], x) - 0.002 - r() * 0.013, tam: 0.6 + r() * 0.8, fase: r() * Math.PI * 2, brillo: 0.4 + r() * 0.6 });
    }
  }
  return { lomas, brotes };
}
