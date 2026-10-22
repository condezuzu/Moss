// La escena del cielo, en el hilo de la interfaz. Cada cuadro, `paso` avanza las animaciones y
// arma la lista de luces (sprites) que dibujan los Atlas de Skia. Es la misma lógica que
// galeria/src/escena.js. React se entera solo de lo que cambia texto (un toque, el día completo,
// la luz que llega desde Salud), por la cola `eventos`.

import { HORIZONTE, PARALAJE, type Punto } from './mundo';
import type { Brote } from './musgo';

/** Por cada luz: x, y (puntos), radio (puntos), rotación, celda de la hoja, r, g, b, intensidad. */
export const DATOS_POR_SPRITE = 9;
export const CAPACIDAD_CIELO = 900;
export const CAPACIDAD_FRENTE = 260;

/** Celdas de la hoja de sprites (Cielo.tsx, fuenteHoja). */
export const SPRITE = { brillo: 0, nucleo: 1, brazos: 2, aro: 3, aroFino: 4, disco: 5 } as const;

const ORO = [1.0, 0.8, 0.44];
const ORO_CLARO = [1.0, 0.93, 0.74];
const PERGAMINO = [0.94, 0.9, 0.81];
const MUSGO_LUZ = [0.74, 0.93, 0.45];
const BLANCO_CALIDO = [1.0, 0.96, 0.86];
const BROTE = [0.72, 0.9, 0.42];
const BROTE_NUCLEO = [0.95, 0.96, 0.7];
/** Segundos que la estela de una estrella fugaz sigue a la vista después de que se apaga la cabeza. */
const RESTO_DE_LA_ESTELA = 0.45;

export type HabitoEnEscena = { x: number; y: number; encendido: boolean; auto: boolean; luz: number; pop: number };
export type LineaEnEscena = { a: number; b: number; prof: number; avance: number };
export type EstrellaDelUniverso = { x: number; y: number; encendida: boolean; habito: number };

type Efecto = { tipo: 0 | 1 | 2; x: number; y: number; t0: number; dur: number };
type Particula = {
  x: number; y: number; vx: number; vy: number; vida: number; max: number; tam: number;
  color: number[]; brillo: number; frena: number; sube: number; par: number;
  espora: boolean; x0: number; fase: number;
};
type EsporaSalud = { indice: number; t0: number; dur: number; o: Punto; c: Punto; d: Punto };

export type Evento =
  | { tipo: 'encendida' | 'apagada' | 'automatico' | 'salud'; indice: number }
  | { tipo: 'completo' }
  | { tipo: 'incompleto' }
  | { tipo: 'cuadros'; valor: number }
  | { tipo: 'lento' }
  | { tipo: 'listo' };

export type Escena = {
  t: number;
  ancho: number;
  alto: number;
  cam: { y: number; v: number; objetivo: number; arrastrando: boolean; desde: number };
  /** Cuánto está corrida la pestaña Hábitos, en puntos: la constelación va con su página. */
  paginaX: number;
  habitos: HabitoEnEscena[];
  lineas: LineaEnEscena[];
  centro: Punto;
  completo: boolean;
  tCompleto: number;
  rafagaHecha: boolean;
  aurora: { tiempo: number; intensidad: number; oleada: number };
  efectos: Efecto[];
  particulas: Particula[];
  esporasSalud: EsporaSalud[];
  fugaz: { a: Punto; d: Punto; recorrido: number; largo: number; t0: number; dur: number; bola: boolean } | null;
  proximaFugaz: number;
  brotes: Brote[];
  universo: EstrellaDelUniverso[];
  factorParticulas: number;
  /** La riqueza del cielo (0 a 1): el progreso de toda la vida. Ver dominio/luz.ts, riquezaDe. */
  riqueza: number;
  movimientoReducido: boolean;
  fondoListo: boolean;
  aparicion: number;
  /**
   * Para el shader: onda (x, y, radio, fuerza); fugaz (x, y de la cabeza y su dirección) y su
   * estela (recorrido, largo máximo, brillo de la cabeza, brillo de la estela), como en vivo.glsl.
   */
  onda: number[];
  fugazU: number[];
  fugazEstela: number[];
  cielo: Float32Array;
  nCielo: number;
  frente: Float32Array;
  nFrente: number;
  eventos: Evento[];
  medicion: { cuadros: number; tiempo: number; desde: number; total: number; totalTiempo: number; avisado: boolean };
};

export type EntradaDeEscena = {
  ancho: number;
  alto: number;
  habitos: { x: number; y: number; encendido: boolean; auto: boolean }[];
  lineas: { a: number; b: number; prof: number }[];
  centro: Punto;
  brotes: Brote[];
  universo: EstrellaDelUniverso[];
  factorParticulas: number;
  riqueza: number;
  movimientoReducido: boolean;
};

export function crearEscena(d: EntradaDeEscena): Escena {
  const completo = d.habitos.length > 0 && d.habitos.every((h) => h.encendido);
  return {
    t: 0,
    ancho: d.ancho,
    alto: d.alto,
    cam: { y: 0, v: 0, objetivo: 0, arrastrando: false, desde: 0 },
    paginaX: 0,
    habitos: d.habitos.map((h) => ({ ...h, luz: h.encendido ? 1 : 0, pop: 0 })),
    lineas: d.lineas.map((l) => ({ ...l, avance: completo ? 1 : 0 })),
    centro: d.centro,
    completo,
    tCompleto: completo ? -30 : -1,
    rafagaHecha: completo,
    aurora: { tiempo: 40, intensidad: 1, oleada: 0 },
    efectos: [],
    particulas: [],
    esporasSalud: [],
    fugaz: null,
    proximaFugaz: 7,
    brotes: d.brotes,
    universo: d.universo,
    factorParticulas: d.factorParticulas,
    riqueza: d.riqueza,
    movimientoReducido: d.movimientoReducido,
    fondoListo: false,
    aparicion: 0,
    onda: [0, 0, 0, 0],
    fugazU: [0, 0, 1, 0],
    fugazEstela: [0, 0, 0, 0],
    cielo: new Float32Array(CAPACIDAD_CIELO * DATOS_POR_SPRITE),
    nCielo: 0,
    frente: new Float32Array(CAPACIDAD_FRENTE * DATOS_POR_SPRITE),
    nFrente: 0,
    eventos: [],
    medicion: { cuadros: 0, tiempo: 0, desde: 0, total: 0, totalTiempo: 0, avisado: false },
  };
}

function limitar(x: number, a: number, b: number) {
  'worklet';
  return x < a ? a : x > b ? b : x;
}

function suave(a: number, b: number, x: number) {
  'worklet';
  const t = limitar((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function salida(t: number) {
  'worklet';
  const u = 1 - limitar(t, 0, 1);
  return 1 - u * u * u;
}

/** De mundo a puntos de pantalla, para una capa con su paralaje. */
export function aPantalla(e: Escena, x: number, y: number, par: number): Punto {
  'worklet';
  // Lo que va con el cielo (la constelación y tu universo) se corre con su pestaña; el musgo queda.
  const corrida = par === PARALAJE.cielo ? e.paginaX : 0;
  return [e.ancho / 2 + x * e.alto + corrida, e.alto / 2 - (y - e.cam.y * par) * e.alto];
}

function sprite(b: Float32Array, n: number, cap: number, sx: number, sy: number, radio: number, rot: number, celda: number, color: number[], intensidad: number) {
  'worklet';
  if (n >= cap || intensidad <= 0.002 || radio <= 0) return n;
  const o = n * DATOS_POR_SPRITE;
  b[o] = sx; b[o + 1] = sy; b[o + 2] = radio; b[o + 3] = rot; b[o + 4] = celda;
  b[o + 5] = color[0]; b[o + 6] = color[1]; b[o + 7] = color[2]; b[o + 8] = intensidad;
  return n + 1;
}

export function cambiarHabito(e: Escena, i: number, encender: boolean, desdeSalud: boolean) {
  'worklet';
  const h = e.habitos[i];
  if (!h || h.encendido === encender) return;
  h.encendido = encender;
  if (encender) {
    h.pop = 1;
    e.efectos.push({ tipo: 0, x: h.x, y: h.y, t0: e.t, dur: 0.42 });
    e.efectos.push({ tipo: 1, x: h.x, y: h.y, t0: e.t, dur: 0.75 });
    const n = Math.round(14 * e.factorParticulas) + 4;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.05 + Math.random() * 0.12;
      e.particulas.push({
        x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: 0.45 + Math.random() * 0.5,
        tam: 2 + Math.random() * 3, color: Math.random() < 0.5 ? ORO_CLARO : ORO, brillo: 0.9, frena: 3.2, sube: 0, par: 1,
        espora: false, x0: 0, fase: 0,
      });
    }
  } else {
    e.efectos.push({ tipo: 2, x: h.x, y: h.y, t0: e.t, dur: 0.5 });
  }
  e.eventos.push({ tipo: desdeSalud ? 'salud' : encender ? 'encendida' : 'apagada', indice: i });
  const todos = e.habitos.every((x) => x.encendido);
  if (todos && !e.completo) {
    e.completo = true;
    e.tCompleto = e.t;
    e.rafagaHecha = false;
    e.eventos.push({ tipo: 'completo' });
  } else if (!todos && e.completo) {
    e.completo = false;
    e.eventos.push({ tipo: 'incompleto' });
  }
}

/**
 * Lo que se encendió o se apagó fuera del cielo (la comida, Salud u otro teléfono) llega a la escena
 * que está, con su brillo. Ya está guardado: no se avisa ni se vuelve a marcar. El día completo sí
 * se celebra.
 */
export function ponerEncendidos(e: Escena, encendidos: boolean[]) {
  'worklet';
  const antes = e.eventos.length;
  for (let i = 0; i < e.habitos.length && i < encendidos.length; i++) {
    if (e.habitos[i].encendido !== encendidos[i]) cambiarHabito(e, i, encendidos[i], false);
  }
  const nuevos = e.eventos.splice(antes);
  for (const x of nuevos) if (x.tipo === 'completo' || x.tipo === 'incompleto') e.eventos.push(x);
}

/** La estrella de un hábito que queda bajo (px, py), en puntos, o -1. */
export function estrellaEn(e: Escena, px: number, py: number): number {
  'worklet';
  if (e.paginaX !== 0) return -1;
  let mejor = -1;
  let distancia = 34;
  for (let i = 0; i < e.habitos.length; i++) {
    const [sx, sy] = aPantalla(e, e.habitos[i].x, e.habitos[i].y, PARALAJE.cielo);
    const d = Math.hypot(sx - px, sy - py);
    if (d < distancia) { distancia = d; mejor = i; }
  }
  return mejor;
}

/** Un toque en (px, py), en puntos. Devuelve el hábito tocado, o -1. */
export function tocar(e: Escena, px: number, py: number): number {
  'worklet';
  const mejor = estrellaEn(e, px, py);
  if (mejor < 0) return -1;
  const h = e.habitos[mejor];
  if (h.auto) {
    e.efectos.push({ tipo: 2, x: h.x, y: h.y, t0: e.t, dur: 0.4 });
    e.eventos.push({ tipo: 'automatico', indice: mejor });
    return mejor;
  }
  cambiarHabito(e, mejor, !h.encendido, false);
  return mejor;
}

/** La luz que sube desde el musgo hasta el primer hábito automático apagado. */
export function simularSalud(e: Escena): number {
  'worklet';
  const i = e.habitos.findIndex((h, k) => h.auto && !h.encendido && !e.esporasSalud.some((s) => s.indice === k));
  if (i < 0) return -1;
  const d: Punto = [e.habitos[i].x, e.habitos[i].y];
  const o: Punto = [d[0] * 0.6 + 0.04, HORIZONTE - 0.02];
  const c: Punto = [o[0] + (d[0] - o[0]) * 0.2 - 0.08, o[1] + (d[1] - o[1]) * 0.55];
  e.esporasSalud.push({ indice: i, t0: e.t, dur: 1.5, o, c, d });
  return i;
}

export function completarDia(e: Escena) {
  'worklet';
  for (let i = 0; i < e.habitos.length; i++) {
    if (!e.habitos[i].auto && !e.habitos[i].encendido) cambiarHabito(e, i, true, false);
  }
  while (simularSalud(e) >= 0) { /* una luz por cada automático apagado */ }
}

export function repetirAnimacion(e: Escena) {
  'worklet';
  if (!e.completo) return;
  e.tCompleto = e.t;
  e.rafagaHecha = false;
  e.lineas.forEach((l) => { l.avance = 0; });
}

/** Adelanta la próxima estrella fugaz (para el panel de prueba). */
export function lanzarFugaz(e: Escena) {
  'worklet';
  if (!e.fugaz) e.proximaFugaz = e.t;
}

function puntoDeEspora(s: EsporaSalud, u: number): Punto {
  'worklet';
  const k = salida(u);
  const v = 1 - k;
  return [v * v * s.o[0] + 2 * v * k * s.c[0] + k * k * s.d[0], v * v * s.o[1] + 2 * v * k * s.c[1] + k * k * s.d[1]];
}

// Cuadros por segundo cada medio segundo, y un aviso si los primeros segundos con el cielo ya
// dibujado van lentos: la pantalla baja un escalón de calidad.
function medir(e: Escena, dt: number) {
  'worklet';
  const m = e.medicion;
  m.cuadros++;
  m.tiempo += dt;
  if (m.tiempo >= 0.5) {
    e.eventos.push({ tipo: 'cuadros', valor: m.cuadros / m.tiempo });
    m.cuadros = 0;
    m.tiempo = 0;
  }
  if (e.aparicion >= 1 && !m.avisado) {
    if (m.desde === 0) m.desde = e.t;
    if (e.t - m.desde > 1) {
      m.total++;
      m.totalTiempo += dt;
    }
    if (e.t - m.desde > 4) {
      m.avisado = true;
      if (m.total / m.totalTiempo < 48) e.eventos.push({ tipo: 'lento' });
    }
  }
}

function armarSprites(e: Escena) {
  'worklet';
  const b = e.cielo;
  let n = 0;
  const cap = CAPACIDAD_CIELO;
  const dc = e.completo ? e.t - e.tCompleto : -1;
  const pulso = e.completo ? 1 + 0.55 * Math.exp(-Math.pow((dc - 1.05) / 0.13, 2)) : 1;

  for (let i = 0; i < e.habitos.length; i++) {
    const h = e.habitos[i];
    const [sx, sy] = aPantalla(e, h.x, h.y, PARALAJE.cielo);
    const luz = h.luz;
    const respira = 1 + 0.05 * Math.sin(e.t * 1.7 + i * 2.3);
    n = sprite(b, n, cap, sx, sy, (30 + 30 * luz) * (1 + 0.3 * h.pop) * pulso, 0, SPRITE.brillo, ORO, (0.1 + 0.45 * luz) * respira);
    const radioNucleo = (13 + 10 * luz) * (1 + 0.6 * h.pop) * pulso;
    const giro = e.t * 0.05 + i;
    n = sprite(b, n, cap, sx, sy, radioNucleo, giro, SPRITE.nucleo, BLANCO_CALIDO, 0.32 + 0.95 * luz);
    n = sprite(b, n, cap, sx, sy, radioNucleo, giro, SPRITE.brazos, BLANCO_CALIDO, (0.32 + 0.95 * luz) * (0.12 + 0.55 * luz));
    const apagada = 1 - luz;
    if (apagada > 0.01) {
      // Los automáticos llevan además el arco de avance, que es un Path (Cielo.tsx).
      if (h.auto) n = sprite(b, n, cap, sx, sy, 20, 0, SPRITE.aro, PERGAMINO, 0.16 * apagada);
      else n = sprite(b, n, cap, sx, sy, 18, 0, SPRITE.aro, PERGAMINO, (0.3 + 0.13 * Math.sin(e.t * 2.2 + i * 1.7)) * apagada);
    }
  }

  for (const f of e.efectos) {
    const u = (e.t - f.t0) / f.dur;
    const [sx, sy] = aPantalla(e, f.x, f.y, PARALAJE.cielo);
    if (f.tipo === 0) n = sprite(b, n, cap, sx, sy, 14 + 56 * salida(u), 0, SPRITE.disco, ORO_CLARO, 1.1 * (1 - u));
    else if (f.tipo === 1) n = sprite(b, n, cap, sx, sy, 14 + 78 * salida(u), 0, SPRITE.aroFino, ORO, 0.75 * (1 - u));
    else n = sprite(b, n, cap, sx, sy, 42 - 26 * salida(u), 0, SPRITE.aroFino, PERGAMINO, 0.4 * (1 - u));
  }

  // La chispa en la punta de cada línea mientras se enciende.
  for (const l of e.lineas) {
    if (l.avance > 0 && l.avance < 1) {
      const a = e.habitos[l.a], c = e.habitos[l.b];
      const [sx, sy] = aPantalla(e, a.x + (c.x - a.x) * l.avance, a.y + (c.y - a.y) * l.avance, PARALAJE.cielo);
      n = sprite(b, n, cap, sx, sy, 10, 0, SPRITE.brillo, ORO_CLARO, 0.9);
    }
  }

  for (const s of e.universo) {
    const [sx, sy] = aPantalla(e, s.x, s.y, PARALAJE.cielo);
    if (sy < -40 || sy > e.alto + 40) continue;
    const on = s.habito >= 0 ? e.habitos[s.habito].encendido : s.encendida;
    n = sprite(b, n, cap, sx, sy, on ? 20 : 13, 0, SPRITE.brillo, on ? ORO : PERGAMINO, on ? 0.32 : 0.1);
    n = sprite(b, n, cap, sx, sy, on ? 9 : 7, 0.3, SPRITE.nucleo, BLANCO_CALIDO, on ? 0.9 : 0.5);
    if (!on) n = sprite(b, n, cap, sx, sy, 9, 0, SPRITE.aro, PERGAMINO, 0.22);
  }

  for (const p of e.particulas) {
    if (p.espora) continue;
    const [sx, sy] = aPantalla(e, p.x, p.y, p.par);
    n = sprite(b, n, cap, sx, sy, p.tam * 2.2, 0, SPRITE.brillo, p.color, p.brillo * (1 - p.vida / p.max) * 0.5);
  }
  for (const s of e.esporasSalud) {
    const [x, y] = puntoDeEspora(s, (e.t - s.t0) / s.dur);
    const [sx, sy] = aPantalla(e, x, y, PARALAJE.cielo);
    n = sprite(b, n, cap, sx, sy, 26, 0, SPRITE.brillo, MUSGO_LUZ, 0.55);
    n = sprite(b, n, cap, sx, sy, 9, e.t * 2, SPRITE.nucleo, BLANCO_CALIDO, 1);
  }
  e.nCielo = n;

  // Lo que va delante del musgo: la luz dentro del musgo y las esporas.
  const f = e.frente;
  let m = 0;
  const capF = CAPACIDAD_FRENTE;
  const luzAurora = 0.75 + 0.25 * e.aurora.intensidad;
  for (const k of e.brotes) {
    const [sx, sy] = aPantalla(e, k.x, k.y, PARALAJE.lomas[2]);
    const titila = 0.7 + 0.3 * Math.sin(e.t * 0.9 + k.fase * 3);
    m = sprite(f, m, capF, sx, sy, 5.5 * k.tam, 0, SPRITE.brillo, BROTE, 0.15 * k.brillo * titila * luzAurora);
    m = sprite(f, m, capF, sx, sy, 1.8 * k.tam, 0, SPRITE.disco, BROTE_NUCLEO, 0.4 * k.brillo * titila);
  }
  for (const p of e.particulas) {
    if (!p.espora) continue;
    const u = p.vida / p.max;
    const alto = suave(HORIZONTE + 0.05, HORIZONTE + 0.4, p.y);
    const color = [MUSGO_LUZ[0] + (1 - MUSGO_LUZ[0]) * alto, MUSGO_LUZ[1] + (0.97 - MUSGO_LUZ[1]) * alto, MUSGO_LUZ[2] + (0.88 - MUSGO_LUZ[2]) * alto];
    const visible = suave(0, 0.8, p.vida) * (1 - suave(0.75, 1, u));
    const [sx, sy] = aPantalla(e, p.x, p.y, p.par);
    m = sprite(f, m, capF, sx, sy, p.tam * 2.6, 0, SPRITE.brillo, color, 0.28 * visible);
    m = sprite(f, m, capF, sx, sy, p.tam, 0.4, SPRITE.nucleo, color, 0.9 * visible);
  }
  e.nFrente = m;
}

// Va al final a propósito: el plugin de worklets guarda las funciones que usa cada worklet en el
// momento en que se define, así que todo lo que usa paso() tiene que estar definido antes.
export function paso(e: Escena, dt: number) {
  'worklet';
  e.t += dt;

  // La cámara va a la zona elegida con un resorte crítico (sin rebote).
  if (!e.cam.arrastrando) {
    const k = 70;
    const a = -k * (e.cam.y - e.cam.objetivo) - 2 * Math.sqrt(k) * e.cam.v;
    e.cam.v += a * dt;
    e.cam.y += e.cam.v * dt;
  }

  for (const h of e.habitos) {
    h.luz += ((h.encendido ? 1 : 0) - h.luz) * (1 - Math.exp(-dt * (h.encendido ? 16 : 7)));
    h.pop *= Math.exp(-dt * 6);
  }

  const dc = e.completo ? e.t - e.tCompleto : -1;
  let objetivoI = 1;
  let objetivoO = 0;
  if (e.completo) {
    const sube = suave(0.8, 2.2, dc);
    const baja = suave(3.2, 9.0, dc);
    objetivoI = 1 + sube * (1.2 - 0.7 * baja);
    objetivoO = sube * (1 - 0.45 * baja);
  }
  const ritmo = 1 - Math.exp(-dt * (e.completo ? 5 : 1.1));
  e.aurora.intensidad += (objetivoI - e.aurora.intensidad) * ritmo;
  e.aurora.oleada += (objetivoO - e.aurora.oleada) * ritmo;
  e.aurora.tiempo += dt * (1 + 2.2 * e.aurora.oleada) * (e.movimientoReducido ? 0.4 : 1);

  for (const l of e.lineas) {
    l.avance = e.completo ? salida((dc - 0.15 - l.prof * 0.3) / 0.4) : Math.max(0, l.avance - dt * 2.6);
  }

  if (e.completo && !e.rafagaHecha && dc >= 1.0) {
    e.rafagaHecha = true;
    const n = Math.round(26 * e.factorParticulas) + 6;
    for (const h of e.habitos) {
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.03 + Math.random() * 0.16;
        e.particulas.push({
          x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 0.02, vida: 0, max: 0.9 + Math.random() * 1.6,
          tam: 1.6 + Math.random() * 3.4, color: Math.random() < 0.6 ? ORO : ORO_CLARO, brillo: 0.85, frena: 1.6, sube: 0.012, par: 1,
          espora: false, x0: 0, fase: 0,
        });
      }
    }
  }

  e.particulas = e.particulas.filter((p) => {
    p.vida += dt;
    if (p.espora) {
      p.y += p.vy * dt;
      p.x = p.x0 + 0.012 * Math.sin(e.t * 0.9 + p.fase) * suave(0, 1.5, p.vida);
      // Al subir se alejan: el paralaje pasa del musgo al cielo.
      p.par = PARALAJE.lomas[2] + (1 - PARALAJE.lomas[2]) * suave(HORIZONTE - 0.02, HORIZONTE + 0.3, p.y);
    } else {
      const f = Math.exp(-dt * p.frena);
      p.vx *= f;
      p.vy = p.vy * f + p.sube * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    return p.vida < p.max;
  });
  e.efectos = e.efectos.filter((f) => e.t - f.t0 < f.dur);

  // Esporas: suben despacio desde la luz del musgo y, si llegan alto, se vuelven estrellas. Son
  // de vez en cuando: una cada siete segundos, más o menos.
  if (e.brotes.length && Math.random() < (0.05 + 0.15 * e.riqueza) * e.factorParticulas * dt) {
    const k = e.brotes[Math.floor(Math.random() * e.brotes.length)];
    e.particulas.push({
      x: k.x, y: k.y, vx: 0, vy: 0.018 + Math.random() * 0.03, vida: 0, max: 5 + Math.random() * 5,
      tam: 1.8 + Math.random() * 1.6, color: MUSGO_LUZ, brillo: 0.7, frena: 0, sube: 0, par: PARALAJE.lomas[2],
      espora: true, x0: k.x, fase: Math.random() * Math.PI * 2,
    });
  }

  e.esporasSalud = e.esporasSalud.filter((s) => {
    const u = (e.t - s.t0) / s.dur;
    if (u >= 1) {
      cambiarHabito(e, s.indice, true, true);
      return false;
    }
    const [x, y] = puntoDeEspora(s, u);
    e.particulas.push({
      x, y, vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, vida: 0, max: 0.5 + Math.random() * 0.4,
      tam: 1.5 + Math.random() * 2, color: MUSGO_LUZ, brillo: 0.8, frena: 2, sube: 0, par: 1, espora: false, x0: 0, fase: 0,
    });
    return true;
  });

  // Una estrella fugaz cada tanto, en la zona de hoy: cae en diagonal y rápido. Una de cada cinco
  // es una bola de fuego, más brillante, que estalla antes de apagarse. La cabeza se apaga y la
  // estela queda un instante donde estaba.
  if (!e.fugaz && e.t >= e.proximaFugaz && !e.movimientoReducido) {
    const izquierda = Math.random() < 0.5;
    const angulo = (izquierda ? Math.PI : 0) + (izquierda ? 1 : -1) * (0.45 + Math.random() * 0.45);
    e.fugaz = {
      a: [(Math.random() - 0.5) * (e.ancho / e.alto) * 0.7, 0.2 + Math.random() * 0.28],
      d: [Math.cos(angulo), Math.sin(angulo)],
      recorrido: 0.32 + Math.random() * 0.22, largo: 0.16 + Math.random() * 0.1,
      t0: e.t, dur: 0.45 + Math.random() * 0.35, bola: Math.random() < 0.2,
    };
    e.proximaFugaz = e.t + 12 + Math.random() * 24;
  }
  if (e.fugaz && e.t - e.fugaz.t0 > e.fugaz.dur + RESTO_DE_LA_ESTELA) e.fugaz = null;
  if (e.fugaz) {
    const f = e.fugaz;
    const u = (e.t - f.t0) / f.dur;
    const vuelo = limitar(u, 0, 1);
    const recorrido = f.recorrido * (0.65 * vuelo + 0.35 * vuelo * vuelo * (3 - 2 * vuelo));
    let cabeza = suave(0, 0.12, u) * (1 - suave(0.7, 1, u)) * (f.bola ? 1.5 : 1);
    if (f.bola) cabeza += 1.8 * Math.exp(-Math.pow((u - 0.86) / 0.06, 2));
    const estela = u < 1 ? suave(0, 0.2, u) : 1 - suave(0, RESTO_DE_LA_ESTELA, e.t - f.t0 - f.dur);
    e.fugazU = [f.a[0] + f.d[0] * recorrido, f.a[1] + f.d[1] * recorrido, f.d[0], f.d[1]];
    e.fugazEstela = [recorrido, f.largo, u < 1 ? cabeza : 0, estela * (f.bola ? 1.3 : 1)];
  } else {
    e.fugazEstela = [0, 0, 0, 0];
  }

  e.onda = e.completo && dc > 1.0 && dc < 3.4
    ? [e.centro[0], e.centro[1], (dc - 1.0) * 0.85, 0.9 * Math.pow(1 - (dc - 1.0) / 2.4, 1.5)]
    : [0, 0, 0, 0];

  if (e.fondoListo) e.aparicion = Math.min(1, e.aparicion + dt / 0.8);

  medir(e, dt);
  armarSprites(e);
}
