// Los parámetros de cada cuerpo de Ascent, copiados de su repo (léelos allá si cambian):
// - RANGOS_CFG y PLANETAS_CFG: compartido/motor/cuerpos.ts;
// - NEBULOSA_CFG, AURORA_CFG, crearPolvo, crearGalaxia, los resplandores del bulbo y cuánto gira cada cosa:
//   compartido/motor/escena.ts (montarEscena), con el nivel «medio» de partículas, el del teléfono;
// - el nivel de la cara nocturna: nivelDeNocheDeCuerpo en nucleo/noche.ts.
// Sin imports: también lo usa la verificación con CanvasKit en Node.

type Hex = string;
export type ConfigCuerpo = {
  paleta: [Hex, Hex, Hex, Hex];
  bandas: number;
  contraste: number;
  turbulencia: number;
  anillo: boolean;
  crateres: number;
  casquetes: number;
  puntos: number;
  mares: number;
  rayos: number;
  /** 0 planeta, 1 sol, 2 agujero negro, 3 roca, 4 el gas de la galaxia, 5 la nebulosa del polvo (MODO en rangos.sksl.ts). */
  modo: number;
};

const base: Omit<ConfigCuerpo, 'paleta'> = { bandas: 0, contraste: 0, turbulencia: 0.8, anillo: false, crateres: 0, casquetes: 0, puntos: 0, mares: 0, rayos: 0, modo: 0 };

/** Los planetas del rango 4 que muestra Ascent (los de su nucleo/reglas.ts), con lo de PLANETAS_CFG. */
export const PLANETAS_CFG: Record<string, ConfigCuerpo> = {
  Ceres: { ...base, paleta: ['#1e2228', '#333a44', '#5c6a76', '#8e9aa4'], crateres: 0.3, puntos: 1.0, turbulencia: 0.7 },
  Mercurio: { ...base, paleta: ['#26252a', '#453f3a', '#7d746a', '#b9b2ac'], crateres: 1.35, turbulencia: 1.05 },
  Marte: { ...base, paleta: ['#4a1204', '#8a2810', '#c23c14', '#e2703a'], casquetes: 0.85, turbulencia: 1.1 },
  Venus: { ...base, paleta: ['#9c8358', '#cdb27a', '#eedfb0', '#fff8ec'], bandas: 5, contraste: 0.28, turbulencia: 2.2 },
  Saturno: { ...base, paleta: ['#7a5a1e', '#c19a34', '#e8c65e', '#faefc6'], bandas: 10, contraste: 0.5, turbulencia: 0.9, anillo: true },
};

/** Lo de RANGOS_CFG; el 1 y el 6 son gas con partículas (la nebulosa y la galaxia de escena.ts). */
export const RANGOS_CFG: Record<number, ConfigCuerpo> = {
  1: { ...base, paleta: ['#241540', '#2f45a8', '#8f5fe0', '#f0a06a'], turbulencia: 1.4, modo: 5 },
  2: { ...base, paleta: ['#241408', '#5c2a10', '#95491a', '#c9762e'], modo: 3, turbulencia: 0.5, crateres: 0.75 },
  3: { ...base, paleta: ['#3c3f46', '#5c6069', '#949aa5', '#d8dce4'], crateres: 1.0, mares: 1, rayos: 0.6, turbulencia: 0.7 },
  4: PLANETAS_CFG.Ceres,
  5: { ...base, paleta: ['#EF9F27', '#F2C230', '#FFF1C2', '#ffffff'], modo: 1, turbulencia: 1.3 },
  6: { ...base, paleta: ['#ffe0b8', '#9a6fe6', '#6f86ff', '#ff5fb0'], turbulencia: 1.0, modo: 4 },
  7: { ...base, paleta: ['#05050A', '#4A2A8C', '#FF6A00', '#FFC46B'], modo: 2 },
};

const canales = (hex: Hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
/** THREE.Color(hex) pasa el sRGB a lineal, y los shaders de Ascent muestran ese número tal cual: así se ve allá. */
export const lineal = (hex: Hex) => canales(hex).map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as [number, number, number];

/** nivelDeNocheDeCuerpo de Ascent: los cuerpos grises y oscuros suben su piso; los de color, no. */
export function nivelDeNoche(paleta: readonly Hex[]): number {
  const luminancia = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const saturacion = (c: number[]) => {
    const mx = Math.max(...c), mn = Math.min(...c);
    return mx <= 0 ? 0 : (mx - mn) / mx;
  };
  const suave = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const c1 = canales(paleta[1]), c2 = canales(paleta[2]);
  const lum = (luminancia(c1) + luminancia(c2)) / 2;
  const sat = (saturacion(c1) + saturacion(c2)) / 2;
  const pisoGris = 0.014 / Math.pow(Math.max(lum, 0.05), 2);
  const alivio = suave(0.2, 0.5, sat);
  const nivel = pisoGris * (1 - alivio) + 0.055 * alivio;
  return Math.min(0.2, Math.max(0.055, nivel));
}

/** El cuerpo de un rango de Ascent y, en el 4, de su planeta. */
export function configDe(rango: number, planeta?: string | null): ConfigCuerpo {
  if (rango === 4 && planeta && PLANETAS_CFG[planeta]) return PLANETAS_CFG[planeta];
  return RANGOS_CFG[rango] ?? RANGOS_CFG[1];
}

/** Los uniforms del cuerpo que no cambian con el tiempo ni con dónde se dibuja. */
export function uniformsDelCuerpo(cfg: ConfigCuerpo) {
  const [p0, p1, p2, p3] = cfg.paleta.map(lineal);
  return {
    uPaleta0: p0, uPaleta1: p1, uPaleta2: p2, uPaleta3: p3,
    uBandas: cfg.bandas, uContraste: cfg.contraste, uTurbulencia: cfg.turbulencia, uAnillo: cfg.anillo ? 1 : 0,
    uCrateres: cfg.crateres, uCasquetes: cfg.casquetes, uPuntos: cfg.puntos, uMares: cfg.mares, uRayos: cfg.rayos,
    uNoche: nivelDeNoche(cfg.paleta),
  };
}

/** El radio del cuerpo adentro del quad de Ascent (`R` en el shader). */
export const RADIO_EN_EL_QUAD = 0.46;

/** Un azar con semilla: las mismas partículas cada vez (en Ascent salen de Math.random al montar). */
export const azar = (semilla: number) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let x = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

/**
 * Las partículas de un cuerpo: posición (en el plano del cuerpo, y hacia arriba), su diámetro en puntos (gl_PointSize)
 * y su color lineal con el brillo de alfa (pasado de 1, el núcleo ya no sube en Ascent: el alfa se recorta).
 */
export type Particulas = { x: number[]; y: number[]; z: number[]; tam: number[]; color: [number, number, number, number][] };

type RGB = [number, number, number];
const mezcla = (a: RGB, b: RGB, f: number): RGB => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];

/** crearPolvo de Ascent, sin el estado vacío: 1.100 partículas al nivel medio (660), en grumos, vetas y sueltas. */
export function particulasDelPolvo(): Particulas {
  const r = azar(1);
  const n = Math.round(1100 * 0.6);
  const paleta = RANGOS_CFG[1].paleta.map(lineal);
  const grumos = Array.from({ length: 6 }, () => ({ x: (r() - 0.5) * 0.85, y: (r() - 0.5) * 0.62, r: 0.1 + r() * 0.2 }));
  const vetas = Array.from({ length: 4 }, () => {
    const a = r() * Math.PI * 2;
    const largo = 0.35 + r() * 0.5;
    return { x: (r() - 0.5) * 0.5, y: (r() - 0.5) * 0.4, dx: Math.cos(a) * largo, dy: Math.sin(a) * largo * 0.7 };
  });
  const out: Particulas = { x: [], y: [], z: [], tam: [], color: [] };
  for (let i = 0; i < n; i++) {
    let x: number, y: number;
    const dado = r();
    if (dado < 0.3) {
      const v = vetas[Math.floor(r() * vetas.length)];
      const t = r();
      const desvio = (r() - 0.5) * 0.05;
      x = v.x + v.dx * t - v.dy * desvio;
      y = v.y + v.dy * t + v.dx * desvio;
    } else if (dado < 0.74) {
      const g = grumos[Math.floor(r() * grumos.length)];
      const a = r() * Math.PI * 2;
      const d = Math.pow(r(), 0.7) * g.r;
      x = g.x + Math.cos(a) * d;
      y = g.y + Math.sin(a) * d * 0.8;
    } else {
      const a = r() * Math.PI * 2;
      const d = Math.pow(r(), 0.5) * 0.62;
      x = Math.cos(a) * d;
      y = Math.sin(a) * d * 0.78;
    }
    const grande = r() < 0.06;
    const tam = grande ? 4.5 + r() * 4 : 1.1 + Math.pow(r(), 2.2) * 2.6;
    const brillo = grande ? 0.85 + r() * 0.5 : 0.18 + Math.pow(r(), 2) * 0.75;
    const t = r();
    let c: RGB;
    if (t < 0.42) c = mezcla(paleta[1], paleta[2], r());
    else if (t < 0.72) c = mezcla(paleta[2], paleta[0], r() * 0.6);
    else if (t < 0.96) c = mezcla(paleta[3], paleta[2], r() * 0.5);
    else c = mezcla(lineal('#eaf0ff'), paleta[2], 0.45 + r() * 0.3);
    out.x.push(x);
    out.y.push(y);
    out.z.push(0);
    out.tam.push(tam);
    out.color.push([...c, Math.min(1, brillo)]);
  }
  return out;
}

/** crearGalaxia de Ascent: 4.200 al nivel medio (2.520), en el plano del disco: el bulbo, el disco viejo, los cúmulos y los brazos. */
export function particulasDeLaGalaxia(): Particulas {
  const r = azar(2);
  const n = Math.round(4200 * 0.6);
  const VUELTA = 2.0;
  const cNucleo = lineal('#ffd2a0'), cAzul = lineal('#7ea4ff'), cRosa = lineal('#ff5fb0'), cLila = lineal('#b98cf5');
  const blanco: RGB = [1, 1, 1];
  const radioDe = (t: number) => 0.07 + t * 0.88;
  const anguloDe = (brazo: number, rr: number) => brazo * (Math.PI / 2) + VUELTA * Math.log(rr);
  const nudos = Array.from({ length: 26 }, () => {
    const rr = radioDe(0.18 + r() * 0.72);
    const a = anguloDe(r() < 0.5 ? 0 : 2, rr) + (r() - 0.5) * 0.12;
    return { r: rr, a, rosa: r() < 0.4 };
  });
  const campana = () => (r() + r() + r() - 1.5) / 1.5;
  const out: Particulas = { x: [], y: [], z: [], tam: [], color: [] };
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number, c: RGB;
    let t = 0;
    const dado = r();
    let tam = 1.2 + Math.pow(r(), 2.5) * 1.7;
    let bri = 0.5 + Math.pow(r(), 1.6) * 0.9;
    if (dado < 0.17) {
      const d = Math.pow(r(), 1.7) * 0.17;
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = Math.cos(a) * s * d;
      y = Math.sin(a) * s * d;
      z = u * d * 0.8;
      c = mezcla(cNucleo, blanco, r() * 0.35);
      bri *= 1.25 - d * 3.0;
    } else if (dado < 0.33) {
      t = Math.pow(r(), 0.8);
      const rr = radioDe(t);
      const a = r() * Math.PI * 2;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = (r() - 0.5) * 0.04;
      c = mezcla(cNucleo, cLila, 0.25 + r() * 0.6);
      bri *= 0.55;
    } else if (dado < 0.45) {
      const k = nudos[Math.floor(r() * nudos.length)];
      const da = (campana() * 0.07) / k.r;
      const rr = k.r * (1 + da / VUELTA) + campana() * 0.016;
      x = Math.cos(k.a + da) * rr;
      y = Math.sin(k.a + da) * rr;
      z = (r() - 0.5) * 0.02;
      t = Math.min(1, rr);
      c = mezcla(k.rosa ? cRosa : cAzul, blanco, 0.2 + r() * 0.5);
      tam = 1.3 + Math.pow(r(), 2.0) * 2.0;
      bri = 0.75 + r() * 0.7;
    } else {
      t = Math.pow(r(), 0.85);
      const rr = radioDe(t);
      const mayor = r() < 0.74;
      const brazo = (mayor ? 0 : 1) + (r() < 0.5 ? 0 : 2);
      const g = campana();
      const a = anguloDe(brazo, rr) + g * (0.2 + t * 0.3);
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = (r() - 0.5) * (0.035 - t * 0.02);
      const tinte = r();
      c = tinte < 0.62 ? mezcla(cAzul, blanco, r() * 0.5) : tinte < 0.88 ? cLila : mezcla(cRosa, cLila, r() * 0.6);
      if (t < 0.25) c = mezcla(c, cNucleo, 1 - t / 0.25);
      if (!mayor) bri *= 0.6;
      if (r() < 0.05) {
        tam = 2.6 + r() * 1.8;
        bri = 1.1 + r() * 0.5;
      }
      if (g > 0.22 && g < 0.55) bri *= 0.2;
    }
    bri *= 1.1 - t * 0.45;
    out.x.push(x);
    out.y.push(y);
    out.z.push(z);
    out.tam.push(tam);
    out.color.push([...c, Math.min(1, Math.max(0, bri))]);
  }
  return out;
}

/** Los dos resplandores del bulbo: color, medio lado del quad (en unidades del plano de la galaxia) y fuerza. */
export const RESPLANDORES_DE_LA_GALAXIA = [
  { color: '#ffe9cf', escala: 0.12, fuerza: 0.85 },
  { color: '#e2a9c9', escala: 0.42, fuerza: 0.4 },
] as const;

/**
 * Dónde cae una partícula en el lienzo (x, y): la deriva de VERTEX_PUNTOS, el giro y, en la galaxia, el disco inclinado
 * de escena.ts. `escala`: en el polvo, el medio lado del quad de la nebulosa (las partículas van en unidades de su
 * grupo, 1,5 veces más chico); en la galaxia, los puntos por unidad del plano del disco.
 */
export function posicionDeParticula(x: number, y: number, z: number, galaxia: boolean, t: number, cx: number, cy: number, escala: number): [number, number] {
  'worklet';
  const px = x + Math.sin(t * 0.08 + y * 5) * 0.012;
  const py = y + Math.cos(t * 0.06 + x * 4) * 0.01;
  const a = t * (galaxia ? 0.022 : 0.03);
  const u = Math.cos(a) * px - Math.sin(a) * py;
  const v = Math.sin(a) * px + Math.cos(a) * py;
  if (!galaxia) return [cx + (u * escala) / 1.5, cy - (v * escala) / 1.5];
  const w = Math.cos(1.1) * v - Math.sin(1.1) * z;
  const o = 0.95;
  return [cx + escala * (Math.cos(o) * u - Math.sin(o) * w), cy - escala * (Math.sin(o) * u + Math.cos(o) * w)];
}

/**
 * Cómo va el cuerpo en el lienzo: su tamaño, el centro del cuerpo adentro, `radio` (el del disco; en el polvo, el medio
 * lado de la nebulosa; en la galaxia, el radio de su disco) y `giro`, en grados, para que la luz de los que tienen cara
 * de noche (los planetas, la luna y el asteroide) mire hacia la pantalla.
 */
export type Geometria = { ancho: number; alto: number; cx: number; cy: number; radio: number; giro: number };

const giroDe = (modo: number) => (modo === 0 || modo === 3 ? 225 : 0);
/** Cuánto pasa del centro lo que se dibuja: el quad de Ascent entero. */
export function alcanceDe(modo: number, radio: number) {
  return modo === 5 ? radio : modo === 4 ? radio / 0.95 : radio / RADIO_EN_EL_QUAD;
}

/**
 * De fondo en la sección: el cuerpo arriba a la derecha, cortado por el borde, en un disco de 360 (el polvo, como
 * antes, a la derecha y más abajo). El lienzo va solo de lo que se ve: de arriba de la sección (lo de más arriba no
 * se ve nunca, ni bajando con ella) a donde termina el quad.
 */
export function geometriaEnLaSeccion(rango: number, planeta: string | null | undefined, ancho: number): Geometria {
  const { modo } = configDe(rango, planeta);
  const cx = modo === 5 ? ancho * 0.7 + 14 : ancho - 40;
  const cy = modo === 5 ? 126 : 70;
  // El agujero negro, más chico, como en Ascent (92 contra 165 del sol, en su nucleo/horizonte.ts): su disco es ancho.
  const radio = modo === 5 ? 330 : modo === 4 ? 340 : modo === 2 ? 100 : 180;
  return { ancho, alto: Math.ceil(cy + alcanceDe(modo, radio)), cx, cy, radio, giro: giroDe(modo) };
}

/**
 * Arriba de Progreso: un cuerpo de 760 que cuelga del borde de arriba y asoma 7 puntos. El lienzo cubre la franja de
 * 190 y 90 más arriba, que se ven cuando baja con el dedo.
 */
export function geometriaDelTecho(rango: number, planeta: string | null | undefined, ancho: number): Geometria {
  const { modo } = configDe(rango, planeta);
  return { ancho, alto: 280, cx: ancho * 0.62, cy: 90 + 7 - 380, radio: 380, giro: giroDe(modo) };
}
