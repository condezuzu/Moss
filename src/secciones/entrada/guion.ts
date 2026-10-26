// El guion de la estrella guía de la entrada, el mismo de la galería (galeria/src/entrada.js): por
// dónde va en cada pantalla, cuándo, y lo que pasa mientras (Casiopea, los anillos de la luna, la
// barra del cuestionario). Lo de cada cuadro (estado, barraEn, enLut) corre en el hilo de la
// interfaz: son worklets, y lo que usan está definido antes. Lo demás arma el guion una vez por pantalla.

import { encajar, proyectar, type Punto } from '@/cielo/mundo';
import type { Estrella } from '@/datos/catalogo';

export type Facil = 'lineal' | 'suave' | 'llega' | 'sale';
export type Tramo = { t0: number; ms: number; lut: number[]; largo: number; facil: Facil; estela?: boolean; escala?: [number, number]; brillo?: [number, number] };
/** Dónde está la estrella, su tamaño, su brillo y, si va en la barra del cuestionario, cuánto lleva. */
export type Lugar = { pos: Punto; escala: number; brillo: number; enBarra?: number | null };
export type Barra = { k: [number, number]; t0?: number; ms?: number; visible: [number, number]; tv?: number };
/** Lo que corre en cada cuadro: solo números, para pasarlo al hilo de la interfaz. */
export type Recorrido = { inicio: Lugar; tramos: Tramo[]; barra: Barra | null };
export type Evento = 'suave' | 'toque' | 'completo';

export type EscenaDeCasiopea = {
  pos: Punto[];
  lineas: readonly (readonly [number, number])[];
  /** Cuándo se enciende cada estrella (ms desde que empieza la pantalla). */
  luz: number[];
  /** Cada línea que dibuja la guía: de qué estrella a cuál, y entre qué momentos. */
  saltos: [number, number, number, number][];
  completo: number;
};
export type EscenaDeLuna = { centro: Punto; radios: number[]; vueltas: [number, number][]; llena: [number, number] };

export type Guion = {
  recorrido: Recorrido;
  /** Cuándo termina su parte: en la frase y las diapositivas, desde ahí se puede tocar. */
  fin: number;
  eventos: [number, Evento][];
  casiopea?: EscenaDeCasiopea;
  luna?: EscenaDeLuna;
  /** En la cuenta: cuándo aparece cada letra de la marca, al pasar la estrella. */
  letras?: number[];
};

export type Anclas = {
  W: number;
  H: number;
  /** Donde espera abajo para que la toquen: el centro del botón de 72 puntos. */
  descanso: Punto;
  nacer: Punto;
  frase: Punto;
  figura: Punto;
  compania: Punto;
  marca: Punto;
  chispa: Punto;
  barra: { y: number; x0: number; x1: number };
};

// ------------------------------------------------------------------ cada cuadro
const PUNTOS = 48;
// La estela mide 150 puntos y, cuando la estrella para, la alcanza en 280 ms.
const ESTELA = 150;
const RETRAE = 280;

export function limitar(x: number, a: number, b: number) {
  'worklet';
  return Math.min(b, Math.max(a, x));
}

export function mezclar(a: number, b: number, k: number) {
  'worklet';
  return a + (b - a) * k;
}

export function facil(nombre: Facil, u: number) {
  'worklet';
  if (nombre === 'suave') return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(2 - 2 * u, 3) / 2;
  if (nombre === 'llega') return 1 - Math.pow(1 - u, 3);
  if (nombre === 'sale') return u * u * u;
  return u;
}

export function enLut(lut: number[], s: number): Punto {
  'worklet';
  const f = limitar(s, 0, 1) * PUNTOS;
  const k = Math.min(PUNTOS - 1, Math.floor(f));
  const r = f - k;
  return [mezclar(lut[2 * k], lut[2 * k + 2], r), mezclar(lut[2 * k + 1], lut[2 * k + 3], r)];
}

export type Estela = { lut: number[]; desde: number; hasta: number };
export type Cuadro = { x: number; y: number; escala: number; brillo: number; base: number; estelas: Estela[] };

/**
 * Dónde está la estrella en el momento t y las estelas que deja. Con Reducir movimiento no viaja: se
 * apaga donde estaba y se enciende donde va, sin estela.
 */
export function estado(g: Recorrido | null, t: number, reducido: boolean): Cuadro {
  'worklet';
  if (!g) return { x: -100, y: -100, escala: 1, brillo: 0, base: 0, estelas: [] };
  let pos = g.inicio.pos;
  let escala = g.inicio.escala;
  let brillo = g.inicio.brillo;
  let visible = 1;
  const estelas: Estela[] = [];
  for (const tr of g.tramos) {
    if (t < tr.t0) break;
    const u = limitar((t - tr.t0) / tr.ms, 0, 1);
    const s = facil(tr.facil, u);
    if (tr.escala) escala = mezclar(tr.escala[0], tr.escala[1], s);
    if (tr.brillo) brillo = mezclar(tr.brillo[0], tr.brillo[1], s);
    if (reducido && tr.largo > 1) {
      pos = enLut(tr.lut, u < 0.5 ? 0 : 1);
      visible = u >= 1 ? 1 : Math.abs(2 * u - 1);
    } else {
      pos = enLut(tr.lut, s);
      visible = 1;
    }
    if (tr.estela && !reducido) {
      const pasado = t - tr.t0 - tr.ms;
      const k = pasado <= 0 ? 1 : 1 - pasado / RETRAE;
      if (k > 0) estelas.push({ lut: tr.lut, desde: Math.max(0, s - (ESTELA / Math.max(1, tr.largo)) * k), hasta: s });
    }
  }
  return { x: pos[0], y: pos[1], escala, brillo: brillo * visible, base: brillo, estelas };
}

/** La barra del cuestionario: cuánto lleva y cuánto se ve. */
export function barraEn(g: Recorrido | null, t: number) {
  'worklet';
  const b = g?.barra;
  if (!b) return { k: 0, visible: 0 };
  const u = b.ms ? limitar((t - (b.t0 ?? 0)) / b.ms, 0, 1) : 1;
  return { k: mezclar(b.k[0], b.k[1], facil('llega', u)), visible: mezclar(b.visible[0], b.visible[1], limitar((t - (b.tv ?? 0)) / 500, 0, 1)) };
}

// ------------------------------------------------------------------ los caminos
// Cada tramo es una lista de puntos repartidos por largo y no por el parámetro de la curva: así la
// estrella va pareja y la estela mide lo mismo en una curva que en una vuelta.
function porLargo(muestra: (u: number) => Punto): { lut: number[]; largo: number } {
  const N = PUNTOS * 4;
  const finos: [number, number, number][] = [];
  let largo = 0;
  let antes = muestra(0);
  finos.push([antes[0], antes[1], 0]);
  for (let k = 1; k <= N; k++) {
    const p = muestra(k / N);
    largo += Math.hypot(p[0] - antes[0], p[1] - antes[1]);
    finos.push([p[0], p[1], largo]);
    antes = p;
  }
  const lut: number[] = [];
  let j = 0;
  for (let k = 0; k <= PUNTOS; k++) {
    const meta = (largo * k) / PUNTOS;
    while (j < N - 1 && finos[j + 1][2] < meta) j++;
    const a = finos[j];
    const b = finos[j + 1];
    const f = b[2] > a[2] ? limitar((meta - a[2]) / (b[2] - a[2]), 0, 1) : 0;
    lut.push(mezclar(a[0], b[0], f), mezclar(a[1], b[1], f));
  }
  return { lut, largo };
}

const bezier = (p0: Punto, p1: Punto, p2: Punto, p3: Punto) =>
  porLargo((u) => {
    const v = 1 - u;
    const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });
const recta = (p0: Punto, p1: Punto) => porLargo((u) => [mezclar(p0[0], p1[0], u), mezclar(p0[1], p1[1], u)]);
// Una vuelta entera alrededor de c, desde arriba y en el sentido del reloj.
const vuelta = (c: Punto, r: number) => porLargo((u) => [c[0] + r * Math.sin(u * 2 * Math.PI), c[1] - r * Math.cos(u * 2 * Math.PI)]);

// ------------------------------------------------------------------ los lugares
/** Los de la galería, con las medidas de la app: el botón de abajo y la barra del cuestionario. */
export function anclas(W: number, H: number, arriba: number, abajo: number, arribaDelContenido: number, lados: number): Anclas {
  const descanso: Punto = [W / 2, H - abajo - 26 - 36];
  const y = arriba + arribaDelContenido + 1;
  const marca: Punto = [W / 2, H * 0.36];
  return {
    W, H, descanso, marca,
    nacer: [W * 0.17, descanso[1] - 34],
    frase: [W / 2, H * 0.44 - 140],
    figura: [W / 2, H * 0.5],
    compania: [W - 44, y + 26],
    chispa: [marca[0] + 74, marca[1] - 30],
    barra: { y, x0: lados, x1: W - lados },
  };
}

export type Paso = 'frase' | 'habitos' | 'comida' | 'datos' | 'cuenta' | 'salud' | 'edad' | 'sexo' | 'altura' | 'peso' | 'actividad' | 'cuidado' | 'objetivo' | 'resultado';
const DIAPOSITIVAS: readonly Paso[] = ['frase', 'habitos', 'comida'];
/** La frase y las diapositivas: la estrella espera abajo y tocarla es seguir. */
export const esDiapositiva = (p: Paso) => DIAPOSITIVAS.includes(p);

/** Dónde queda la estrella al terminar una pantalla: de ahí sale la siguiente. k: lo que lleva la barra. */
export function reposo(p: Paso | undefined, a: Anclas, k: number): Lugar {
  if (!p) return { pos: a.nacer, escala: 0.3, brillo: 0 };
  if (esDiapositiva(p)) return { pos: a.descanso, escala: 1, brillo: 1 };
  if (p === 'datos') return { pos: a.compania, escala: 0.62, brillo: 0.85 };
  if (p === 'cuenta') return { pos: a.chispa, escala: 0.7, brillo: 0.95 };
  if (p === 'resultado') return { pos: [a.W / 2, a.barra.y], escala: 0.62, brillo: 1 };
  return { pos: [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y], escala: 0.5, brillo: 0.9, enBarra: k };
}

// ------------------------------------------------------------------ los guiones
// La frase: la estrella nace en el musgo, sube por la izquierda hasta arriba de la frase mientras
// aparecen las palabras, y baja por la derecha a esperar.
export const PALABRAS = { desde: 1300, cada: 75, autor: 2500 };

function guionDeFrase(a: Anclas): Guion {
  const { W, H } = a;
  return {
    recorrido: {
      inicio: { pos: a.nacer, escala: 0.3, brillo: 0 },
      tramos: [
        { t0: 0, ms: 450, ...recta(a.nacer, a.nacer), facil: 'llega', escala: [0.3, 1], brillo: [0, 1] },
        { t0: 450, ms: 1300, ...bezier(a.nacer, [0, H * 0.55], [W * 0.12, H * 0.16], a.frase), facil: 'suave', estela: true },
        { t0: 2700, ms: 850, ...bezier(a.frase, [W * 1.02, H * 0.3], [W * 1.02, H * 0.8], a.descanso), facil: 'suave', estela: true },
      ],
      barra: null,
    },
    fin: 3550,
    eventos: [[380, 'suave']],
  };
}

/** Casiopea en la pantalla y el orden en que la recorre la guía, de una punta a la otra empezando por la de la izquierda. */
function casiopeaEn(a: Anclas, estrellas: readonly Estrella[], lineas: readonly (readonly [number, number])[]) {
  const plano = encajar(proyectar([...estrellas]), [0, 0], a.W * 0.64, a.H * 0.2);
  const pos = plano.map(([x, y]): Punto => [a.figura[0] + x, a.figura[1] - y]);
  const vecinos = pos.map((): number[] => []);
  lineas.forEach(([i, j]) => {
    vecinos[i].push(j);
    vecinos[j].push(i);
  });
  const puntas = pos.map((_, i) => i).filter((i) => vecinos[i].length === 1).sort((i, j) => pos[i][0] - pos[j][0]);
  let ahora = puntas.length ? puntas[0] : 0;
  const orden = [ahora];
  while (orden.length < pos.length) {
    const otra = vecinos[ahora].find((v) => !orden.includes(v));
    if (otra === undefined) break;
    orden.push(otra);
    ahora = otra;
  }
  return { pos, orden };
}

// «Tus hábitos son estrellas»: la guía llega a la primera estrella y salta de una a la otra; cada una
// se enciende al tocarla, la línea queda detrás, y al final se conecta como un día completo.
function guionDeHabitos(a: Anclas, desde: Lugar, estrellas: readonly Estrella[], lineas: readonly (readonly [number, number])[]): Guion {
  const { pos, orden } = casiopeaEn(a, estrellas, lineas);
  const LLEGA = 1100;
  const SALTO = 310;
  const PAUSA = 90;
  const luz = pos.map(() => Infinity);
  const saltos: [number, number, number, number][] = [];
  luz[orden[0]] = LLEGA;
  const primera = pos[orden[0]];
  const tramos: Tramo[] = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.08, a.H * 0.8], [a.W * 0.02, primera[1] + 80], primera), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
  for (let k = 1; k < orden.length; k++) {
    const t0 = LLEGA + PAUSA + (k - 1) * (SALTO + PAUSA);
    tramos.push({ t0, ms: SALTO, ...recta(pos[orden[k - 1]], pos[orden[k]]), facil: 'suave', estela: true });
    luz[orden[k]] = t0 + SALTO;
    saltos.push([orden[k - 1], orden[k], t0, t0 + SALTO]);
  }
  const ultima = pos[orden[orden.length - 1]];
  const completo = luz[orden[orden.length - 1]] + 180;
  const sale = completo + 420;
  tramos.push({ t0: sale, ms: 850, ...bezier(ultima, [ultima[0] + 60, ultima[1] + 90], [a.W * 0.86, a.H * 0.86], a.descanso), facil: 'suave', estela: true });
  return {
    recorrido: { inicio: desde, tramos, barra: null },
    fin: sale + 850,
    eventos: [...orden.map((i): [number, Evento] => [luz[i], 'toque']), [completo, 'completo']],
    casiopea: { pos, lineas, luz, saltos, completo },
  };
}

/** Los anillos de la luna, en la caja de 230 puntos (54, 62 y 70 en la de 200). */
export const LUNA = { caja: 230, radios: [54, 62, 70].map((r) => r * 1.15) };

// «Tu comida, a tu medida»: la guía da tres vueltas a la luna, una por macro, y cada vuelta deja su
// anillo mientras la luna se llena.
function guionDeComida(a: Anclas, desde: Lugar): Guion {
  const c = a.figura;
  const R = LUNA.radios;
  const arriba = (r: number): Punto => [c[0], c[1] - r];
  const LLEGA = 1100;
  const VUELTA = 560;
  const CAMBIO = 90;
  const vueltas = R.map((_, i): [number, number] => [LLEGA + i * (VUELTA + CAMBIO), LLEGA + i * (VUELTA + CAMBIO) + VUELTA]);
  const tramos: Tramo[] = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.1, a.H * 0.86], [c[0] - 120, c[1] - R[0] - 6], arriba(R[0])), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
  R.forEach((r, i) => {
    tramos.push({ t0: vueltas[i][0], ms: VUELTA, ...vuelta(c, r), facil: 'lineal', estela: true });
    if (i < R.length - 1) tramos.push({ t0: vueltas[i][1], ms: CAMBIO, ...recta(arriba(r), arriba(R[i + 1])), facil: 'suave' });
  });
  const termina = vueltas[R.length - 1][1];
  tramos.push({ t0: termina, ms: 900, ...bezier(arriba(R[2]), [c[0] + 140, c[1] - R[2]], [a.W * 0.96, a.H * 0.84], a.descanso), facil: 'llega', estela: true });
  return {
    recorrido: { inicio: desde, tramos, barra: null },
    fin: termina + 900,
    eventos: vueltas.map(([, fin]): [number, Evento] => [fin, 'suave']),
    luna: { centro: c, radios: R, vueltas, llena: [LLEGA, termina] },
  };
}

// Tus datos: la estrella sube a acompañar desde un rincón.
function guionDeDatos(a: Anclas, desde: Lugar): Guion {
  return {
    recorrido: { inicio: desde, tramos: [{ t0: 120, ms: 1100, ...bezier(desde.pos, [a.W * 0.9, a.H * 0.86], [a.W * 1.02, a.H * 0.32], a.compania), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 0.85] }], barra: null },
    fin: 1220,
    eventos: [],
  };
}

// La cuenta: la estrella baja hasta la marca, pasa por encima mientras aparecen las letras y queda
// arriba de la última, como un brillo.
function guionDeCuenta(a: Anclas, desde: Lugar): Guion {
  const m = a.marca;
  const PASA = 1000;
  const MS = 800;
  const antes: Punto = [m[0] - 84, m[1] + 8];
  return {
    recorrido: {
      inicio: desde,
      tramos: [
        { t0: 100, ms: PASA - 100, ...bezier(desde.pos, [a.W * 0.6, desde.pos[1] + 10], [m[0] - 150, m[1] - 70], antes), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
        { t0: PASA, ms: MS, ...bezier(antes, [m[0] - 20, m[1] + 14], [m[0] + 50, m[1] + 4], a.chispa), facil: 'llega', estela: true, escala: [0.8, 0.7], brillo: [1, 0.95] },
      ],
      barra: null,
    },
    fin: PASA + MS,
    eventos: [],
    // Cada letra aparece cuando la estrella pasa por encima (sale rápido y frena).
    letras: [0.24, 0.44, 0.63, 0.81].map((s) => PASA + MS * (1 - Math.cbrt(1 - s))),
  };
}

// En el cuestionario la estrella va en la punta de la barra y la estira al avanzar. Si llega de
// afuera, baja al principio de la barra y la recorre hasta la pregunta de ahora.
function guionDeBarra(a: Anclas, desde: Lugar, k: number): Guion {
  const punta: Punto = [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y];
  if (desde.enBarra != null) {
    return {
      recorrido: { inicio: desde, tramos: [{ t0: 60, ms: 700, ...recta(desde.pos, punta), facil: 'llega', escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] }], barra: { k: [desde.enBarra, k], t0: 60, ms: 700, visible: [1, 1] } },
      fin: 760,
      eventos: [],
    };
  }
  const comienzo: Punto = [a.barra.x0, a.barra.y];
  return {
    recorrido: {
      inicio: desde,
      tramos: [
        { t0: 80, ms: 900, ...bezier(desde.pos, [mezclar(desde.pos[0], comienzo[0], 0.3), desde.pos[1] + 80], [comienzo[0] + 70, comienzo[1] + 70], comienzo), facil: 'suave', estela: true, escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] },
        { t0: 980, ms: 700, ...recta(comienzo, punta), facil: 'llega' },
      ],
      barra: { k: [0, k], t0: 980, ms: 700, visible: [0, 1], tv: 600 },
    },
    fin: 1680,
    eventos: [],
  };
}

// El resultado: la estrella deja la barra y queda arriba del título, el punto de partida.
function guionDeResultado(a: Anclas, desde: Lugar): Guion {
  const k = desde.enBarra ?? 1;
  return {
    recorrido: { inicio: desde, tramos: [{ t0: 150, ms: 900, ...recta(desde.pos, [a.W / 2, a.barra.y]), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 1] }], barra: { k: [k, k], visible: [desde.enBarra != null ? 1 : 0, 0] } },
    fin: 1050,
    eventos: [],
  };
}

/** Al empezar: la estrella sube y se va. */
export function guionDeSalida(desde: Lugar): Guion {
  return {
    recorrido: { inicio: desde, tramos: [{ t0: 0, ms: 650, ...recta(desde.pos, [desde.pos[0], -60]), facil: 'sale', estela: true, brillo: [desde.brillo, 0] }], barra: null },
    fin: 650,
    eventos: [],
  };
}

/** El guion de una pantalla. k: lo que lleva la barra si es una pregunta del cuestionario. */
export function guionDe(p: Paso, a: Anclas, desde: Lugar, k: number, casiopea: { estrellas: readonly Estrella[]; lineas: readonly (readonly [number, number])[] }): Guion {
  if (p === 'frase') return guionDeFrase(a);
  if (p === 'habitos') return guionDeHabitos(a, desde, casiopea.estrellas, casiopea.lineas);
  if (p === 'comida') return guionDeComida(a, desde);
  if (p === 'datos') return guionDeDatos(a, desde);
  if (p === 'cuenta') return guionDeCuenta(a, desde);
  if (p === 'resultado') return guionDeResultado(a, desde);
  return guionDeBarra(a, desde, k);
}
