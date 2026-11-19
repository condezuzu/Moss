// Los cuerpos de los rangos de Ascent en SkSL: FRAGMENT y FRAGMENT_PRESAGIO de su compartido/motor/shaders.ts
// (la versión del 16/11: galaxia, sol, agujero negro y asteroide nuevos), línea por línea. Solo arman texto: los usan
// DibujosSkia.tsx y la verificación con CanvasKit en Node, así que acá no hay imports.
//
// Lo que cambia contra el GLSL de Ascent, y por qué:
// - El hash. Ascent usa uno entero (uint, ^ y >>), y SkSL no tiene ni uint ni operadores de bits. Este es de coma
//   flotante (el «hash without sine» de Dave Hoskins), sin sin(), que es lo que Ascent evitaba. Mismas entradas y
//   misma salida uniforme en [0, 1): el ruido tiene la misma forma y el mismo grano, pero no las mismas manchas.
//   Lo que sale de pocos números fijos sí es el de Ascent: el hash entero se calcula acá, en JavaScript, y entra
//   al texto como constantes. Así el contorno del asteroide y el tamaño y el ritmo de cada protuberancia del sol
//   son exactamente los de allá.
// - MODO es una constante del texto, no un #define: un efecto por modo, como un programa por modo en Ascent, para
//   que el compilador tire las ramas de los otros (en Ascent, las seis juntas tardaban minutos en Direct3D).
// - Sin uCero: SkSL pide bucles con tope constante, que es lo que uCero evitaba en Direct3D.
// - Sin varyings: el punto del quad (vP de -1 a 1, y hacia arriba) sale del píxel con uCentro y uEscala.
// - Lo que en el teléfono de Ascent es siempre igual va fijo: uSemilla 0,37, uHorizonte 1 (allá el cuerpo hace de
//   horizonte), sin reposo, sin apagado y uAtenua 1. Y solo lo que usan los cuerpos que Moss muestra (los cinco
//   planetas del rango 4 de Ascent): sin tormenta, continentes, manchas ni anillo de canto.
// - Las funciones no leen uniforms: los reciben.
// - Skia quiere el color premultiplicado; three mezcla con el alfa aparte. Por eso al final va col · alfa.

/** Los modos del shader de Ascent (`modo` en su cuerpos.ts). */
export const MODO = { planeta: 0, sol: 1, agujeroNegro: 2, roca: 3, galaxia: 4, nebulosa: 5 } as const;

/** El disco de la galaxia, como en su escena.ts: cuánto se lo mira de costado y hacia dónde apunta. */
export const GALAXIA_INCLINACION = 1.1;
export const GALAXIA_ORIENTACION = 0.95;
/** Cuánto gira por segundo lo de adentro del disco (la galaxia) y el polvo del rango 1. */
export const GIRO_GALAXIA = 0.022;
export const GIRO_POLVO = 0.03;

/** hash1 de Ascent, con su hash entero (hu y hash3, uSemilla 0,37), tal cual. */
function hash1DeAscent(i: number, s: number): number {
  let x = (Math.imul(i + 128, 73856093) ^ Math.imul(Math.trunc(s * 31), 19349663) ^ Math.imul(7, 83492791) ^ Math.trunc(0.37 * 1913)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967295;
}
const num = (x: number) => x.toFixed(7);

const UNIFORMS = `
uniform float2 uCentro;
uniform float uEscala;
uniform float2 uGiro;
uniform float uDensidad;
uniform float uTime;
uniform float3 uPaleta0;
uniform float3 uPaleta1;
uniform float3 uPaleta2;
uniform float3 uPaleta3;
uniform float uBandas;
uniform float uContraste;
uniform float uTurbulencia;
uniform float uAnillo;
uniform float uCrateres;
uniform float uCasquetes;
uniform float uPuntos;
uniform float uMares;
uniform float uRayos;
uniform float uNoche;
uniform float uPixel;
`;

const COMUN = `
const float R = 0.46;
const float PI = 3.14159265;
// int(uSemilla * 1913) con la uSemilla de Ascent, 0,37
const float SEMILLA = 707.0;
const float HORIZONTE = 1.0;

// Las entradas son enteras, como las ivec3 de Ascent.
float hash3(vec3 c) {
  vec3 q = fract((c + vec3(0.0, 0.0, SEMILLA)) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float hash2f(vec2 c, float s) {
  return hash3(vec3(c + 512.0, floor(s * 97.0 + 0.5)));
}
float hash1(float i, float s) {
  return hash3(vec3(i + 128.0, floor(s * 31.0 + 0.5), 7.0));
}

float ruido(vec3 p) {
  vec3 i = floor(p) + 1000.0;
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash3(i);
  float b = hash3(i + vec3(1.0, 0.0, 0.0));
  float c = hash3(i + vec3(0.0, 1.0, 0.0));
  float d = hash3(i + vec3(1.0, 1.0, 0.0));
  float e = hash3(i + vec3(0.0, 0.0, 1.0));
  float f2 = hash3(i + vec3(1.0, 0.0, 1.0));
  float g = hash3(i + vec3(0.0, 1.0, 1.0));
  float h = hash3(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
    u.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * ruido(p);
    p = p * 2.03 + vec3(17.1, 9.2, 4.3);
    amp *= 0.5;
  }
  return v;
}

float turbulento(vec3 p, float fuerza, out vec3 warp) {
  float qa = fbm(p + vec3(0.0, 0.0, 1.7));
  float qb = fbm(p + vec3(5.2, 1.3, 8.4));
  warp = vec3(qa, qb, qa * 0.5);
  return fbm(p + fuerza * warp);
}

vec3 paleta(float t, vec3 c0, vec3 c1, vec3 c2, vec3 c3) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.3333) { float s = t * 3.0; return mix(c0, c1, s * s * (3.0 - 2.0 * s)); }
  if (t < 0.6666) { float s = (t - 0.3333) * 3.0; return mix(c1, c2, s * s * (3.0 - 2.0 * s)); }
  float s = (t - 0.6666) * 3.0;
  return mix(c2, c3, s * s * (3.0 - 2.0 * s));
}
`;

// Los que solo usan los cuerpos con superficie (planetas, luna y roca).
const SUPERFICIE = `
vec2 crateres(float lon, float lat, float escala, float sem, vec2 luz2) {
  float piso = 0.0;
  float luz = 0.0;
  float gy = lat * escala + sem * 0.37;
  float fila = floor(gy);
  for (int y = -1; y <= 1; y++) {
    float fy = fila + float(y);
    float latFila = (fy + 0.5 - sem * 0.37) / escala;
    float nx = max(3.0, floor(6.2831853 * escala * max(cos(latFila), 0.05)));
    float gx = lon / 6.2831853 * nx + sem * 1.3;
    float colX = floor(gx);
    float anchoCelda = 6.2831853 / nx;
    for (int x = -1; x <= 1; x++) {
      float cx = colX + float(x);
      vec2 id = vec2(mod(cx, nx), fy);
      float hSel = hash2f(id + 31.0, sem);
      if (hSel < 0.34) continue;
      float hProf = hash2f(id + 53.0, sem);
      float hAgu = hash2f(id + 71.0, sem);
      float cLon = (cx + 0.15 + 0.7 * hash2f(id, sem) - sem * 1.3) * anchoCelda;
      float cLat = (fy + 0.15 + 0.7 * hash2f(id + 17.0, sem) - sem * 0.37) / escala;
      vec2 rel = vec2((lon - cLon) * cos(lat), lat - cLat) * escala;
      float dist = length(rel) + 1e-5;
      if (dist > 0.75) continue;
      vec2 dir = rel / dist;
      float rug = ruido(vec3(dir * 2.3, hSel * 40.0));
      float r = (0.14 + hSel * 0.32) * (0.86 + 0.24 * rug);
      float t = dist / r;
      if (t > 1.6) continue;
      float prof = pow(hProf, 2.2) * 1.2 + 0.08;
      float agu = 3.0 + hAgu * 3.5;
      float adentro = 1.0 - smoothstep(0.92, 1.02, t);
      float dTazon = 2.0 * prof * t * adentro;
      float labio = prof * (0.18 + 0.30 * hAgu);
      float k = (t - 1.0) * agu;
      float e = exp(-k * k);
      float dLabio = -2.0 * agu * agu * (t - 1.0) * labio * e;
      float dhdt = dTazon + dLabio;
      luz += -dot(dir, luz2) * dhdt;
      piso += prof * (1.0 - smoothstep(0.2, 0.95, t)) * (0.8 + 0.4 * ruido(vec3(rel * 7.0, hSel * 5.0)));
    }
  }
  float ero = 0.35 + 0.9 * fbm(vec3(lon * 0.9, lat * 1.7, sem * 11.0));
  return vec2(clamp(piso * ero, 0.0, 1.0), clamp(luz * ero * 0.5, -1.5, 1.5));
}

float ridged(vec3 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    float n = 1.0 - abs(ruido(p) * 2.0 - 1.0);
    v += amp * n * n;
    p = p * 2.11 + vec3(3.7, 8.3, 1.9);
    amp *= 0.5;
  }
  return v;
}

float cara(float ang, float a, float lejos) {
  float c = cos(ang - a);
  return c > 0.08 ? exp(-42.0 * lejos / c) : 0.0;
}

float alturaRoca(vec3 s) {
  float cr = ridged(s * 3.2);
  float cr2 = ridged(s * 9.0 + vec3(7.0));
  float piedra = cr * 0.7 + cr2 * 0.3;
  return mix(piedra, floor(piedra * 7.0) / 7.0, 0.45);
}
`;

// Una protuberancia de las ocho; sa, sb y sc son los de Ascent (ver hash1DeAscent).
const PROTUBERANCIAS = `
float protuberancia(vec2 p, float d, float tiempo, float fi, float sa, float sb, float sc) {
    float dur = 9.0 + sb * 12.0;
    float reloj = tiempo / dur + sa;
    float vida = sin(fract(reloj) * PI);
    if (vida <= 0.01) return 0.0;
    vida = pow(vida, 0.7);
    float ang = hash1(fi + floor(reloj) * 13.0, 3.0) * 6.2831 + tiempo * 0.012;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 tg = vec2(-dir.y, dir.x);
    float asoma = (0.022 + sb * 0.058) * (0.35 + 0.65 * vida);
    float alto = asoma * 2.0;
    float medio = asoma * (0.7 + 1.3 * sc);
    vec2 q = p - dir * (R - asoma);
    float e = length(vec2(dot(q, dir) / alto, dot(q, tg) / medio));
    float k = (e - 1.0) / (0.09 + 0.10 * sc);
    float forma = exp(-k * k) * smoothstep(R - 0.010, R + 0.006, d);
    if (forma < 0.002) return 0.0;
    float hilo = 0.50 + 1.0 * fbm(vec3(p * 34.0, tiempo * 0.25 + fi * 3.0));
    float arriba = clamp((d - R) / asoma, 0.0, 1.0);
    return forma * vida * hilo * (1.0 - 0.5 * arriba);
}

float protuberancias(vec2 p, float d, float tiempo) {
  float total = 0.0;
  if (d > R + 0.20 || d < R - 0.015) return total;
${Array.from({ length: 8 }, (_, i) => `  total += protuberancia(p, d, tiempo, ${i}.0, ${num(hash1DeAscent(i, 3))}, ${num(hash1DeAscent(i + 20, 5))}, ${num(hash1DeAscent(i + 40, 9))});`).join('\n')}
  return total;
}
`;

// El contorno del asteroide: nueve caras planas, con el ángulo y la distancia de cada una que salen en Ascent.
const CARAS_DEL_ASTEROIDE = Array.from({ length: 9 }, (_, i) => {
  const a = (i + 0.15 + 0.7 * hash1DeAscent(i, 11)) * ((Math.PI * 2) / 9);
  const lejos = 0.46 * (0.74 + 0.22 * hash1DeAscent(i + 30, 13)) * (1 + 0.1 * Math.cos(2 * (a - 0.6)));
  return `    suma += cara(ang, ${num(a)}, ${num(lejos)});`;
}).join('\n');

// Del píxel al punto del quad: x a la derecha, y hacia arriba, como vP. uGiro gira la imagen entera (coseno y seno).
const PUNTO = `
  vec2 q = vec2(pos.x - uCentro.x, uCentro.y - pos.y) / uEscala;
  vec2 p = vec2(uGiro.x * q.x - uGiro.y * q.y, uGiro.y * q.x + uGiro.x * q.y);
  // Afuera del quad de Ascent no se dibuja nada.
  if (abs(p.x) > 1.0 || abs(p.y) > 1.0) return vec4(0.0);
`;

// El grano por píxel del aparato, como gl_FragCoord.
const GRANO = `hash3(vec3(floor(pos * uDensidad), floor(mod(uTime * 24.0, 100.0))))`;

/** La nebulosa del rango 1 (modo 5): el gas del polvo, que se suma a lo de atrás. */
function mainNebulosa() {
  return `
vec4 main(vec2 pos) {
  vec2 p = vec2(pos.x - uCentro.x, uCentro.y - pos.y) / uEscala;
  if (abs(p.x) > 1.0 || abs(p.y) > 1.0) return vec4(0.0);
  vec3 w;
  float base = turbulento(vec3(p * 1.25, uTime * 0.022), 3.0, w);
  float fino = fbm(vec3(p * 4.5 + w.xy * 0.6, uTime * 0.03));
  float hueco = smoothstep(0.30, 0.62, fbm(vec3(p * 1.8 + vec2(11.0), 0.5)));
  float masa = smoothstep(0.34, 0.86, base) * (0.45 + 0.75 * fino) * hueco;
  float veta = 1.0 - abs(fbm(vec3(p * 2.3 + w.xy * 0.9, uTime * 0.018)) * 2.0 - 1.0);
  veta = pow(clamp(veta, 0.0, 1.0), 3.2);
  float calle = smoothstep(0.42, 0.74, fbm(vec3(p * 2.9 + vec2(-7.0, 3.0), uTime * 0.01)));
  float densidad = (masa * 0.5 + veta * masa * 1.6) * (1.0 - calle * 0.72);
  float nucleo = smoothstep(0.66, 0.04, length(p * vec2(1.0, 1.15)));
  vec3 c = mix(uPaleta0, uPaleta1, smoothstep(0.2, 0.7, base));
  c = mix(c, uPaleta2, smoothstep(0.5, 0.95, fino));
  c = mix(c, uPaleta3, densidad * densidad * nucleo * 0.9);
  float bordes = smoothstep(1.15, 0.35, length(p * vec2(0.85, 1.0)));
  float inten = densidad * bordes * (0.72 + 0.95 * nucleo);
  float rc = length(p * vec2(1.0, 1.12));
  float corazon = exp(-rc * rc * 430.0);
  float glow = exp(-rc * rc * 90.0);
  float ang = atan(p.y, p.x);
  float pelusa = 0.60 + 0.40 * fbm(vec3(cos(ang) * 2.0, sin(ang) * 2.0, uTime * 0.05));
  float halo = exp(-rc * 12.0) * pelusa * 0.35;
  float rayos = pow(max(0.0, cos(ang * 3.0 + uTime * 0.06)), 12.0) * exp(-rc * 13.0) * 0.25;
  vec3 cCalido = mix(uPaleta3, vec3(1.0, 0.72, 0.45), 0.35);
  vec3 cEstrella = mix(cCalido, vec3(1.0, 0.92, 0.78), corazon * 0.6);
  float brilloEstrella = corazon * 0.95 + glow * 0.55 + halo + rayos;
  float cx = p.x * 2.3 + fbm(vec3(p.x * 1.4, p.y * 0.6 - uTime * 0.05, 3.0)) * 2.4;
  float cortina = pow(max(0.0, sin(cx)), 3.0);
  cortina *= smoothstep(-1.05, -0.15, p.y) * smoothstep(1.05, 0.05, p.y);
  cortina *= 0.45 + 0.55 * fbm(vec3(p.x * 3.0, p.y * 2.0 - uTime * 0.09, 7.0));
  vec3 cAurora = mix(uPaleta1, vec3(0.38, 0.92, 0.72), 0.55);
  vec3 finalCol = c * inten * 1.35 + cEstrella * brilloEstrella + cAurora * cortina * 0.75;
  float finalA = clamp(inten * 0.85 + brilloEstrella * 0.9 + cortina * 0.5, 0.0, 1.0);
  return vec4(clamp(finalCol, 0.0, 1.0) * finalA, finalA);
}`;
}

/**
 * El gas del disco de la galaxia (modo 4). En Ascent es un quad inclinado en 3D que gira con las estrellas; acá se
 * deshace la proyección: uEscala son los puntos por unidad del plano del disco.
 */
function mainGalaxia() {
  return `
vec4 main(vec2 pos) {
  vec2 q = vec2(pos.x - uCentro.x, uCentro.y - pos.y) / uEscala;
  float co = cos(${GALAXIA_ORIENTACION.toFixed(4)});
  float so = sin(${GALAXIA_ORIENTACION.toFixed(4)});
  q = vec2(co * q.x + so * q.y, -so * q.x + co * q.y);
  q.y /= cos(${GALAXIA_INCLINACION.toFixed(4)});
  float th = uTime * ${GIRO_GALAXIA};
  vec2 p = vec2(cos(th) * q.x + sin(th) * q.y, -sin(th) * q.x + cos(th) * q.y);
  if (abs(p.x) > 1.0 || abs(p.y) > 1.0) return vec4(0.0);
  float r = length(p) + 1e-5;
  float disco = exp(-r * 2.4) * (1.0 - smoothstep(0.60, 0.97, r));
  if (disco < 0.003) return vec4(0.0);
  float fase = atan(p.y, p.x) - 2.0 * log(r);
  float grande = fbm(vec3(cos(fase) * 1.5, sin(fase) * 1.5, r * 3.2));
  float hilos = fbm(vec3(cos(fase) * 4.0 + p.x * 2.6, sin(fase) * 4.0 + p.y * 2.6, r * 3.4 + grande * 1.8));
  float torcido = fase + (grande - 0.5) * 1.1;
  float onda = 0.5 + 0.5 * cos(2.0 * torcido);
  float brazo = mix(0.75, smoothstep(0.22, 0.98, onda + (hilos - 0.5) * 0.7), smoothstep(0.07, 0.26, r));
  float polvo = pow(max(1.0 - abs(hilos * 2.0 - 1.0), 0.0), 6.0);
  float nudo = smoothstep(0.58, 0.80, grande) * brazo;
  float luz = disco * (0.18 + 1.5 * brazo * (0.22 + 1.25 * smoothstep(0.30, 0.70, grande)) + 1.2 * nudo);
  luz *= (0.60 + 0.8 * hilos) * (1.0 - 0.6 * polvo * smoothstep(0.06, 0.2, r));
  float afuera = smoothstep(0.10, 0.55, r);
  vec3 c = mix(uPaleta0, uPaleta1, smoothstep(0.03, 0.24, r));
  c = mix(c, uPaleta2, afuera * (0.30 + 0.60 * brazo));
  c = mix(c, uPaleta3, nudo * afuera * 0.7);
  float a = clamp(luz * 0.8, 0.0, 1.0);
  return vec4(clamp(c, 0.0, 1.0) * a, a);
}`;
}

/** Planeta (0), sol (1), agujero negro (2) y roca (3): el cuerpo de FRAGMENT, con su modo fijo. */
function mainCuerpo(modo: number) {
  return `
const float MODO = ${modo.toFixed(1)};
vec4 main(vec2 pos) {
${PUNTO}
  float aa = max(uPixel, 0.0015) * 1.5;
  vec3 col = vec3(0.0);
  float alfa = 0.0;

  vec3 L = normalize(vec3(-0.55, 0.6, 0.58));
  vec2 L2 = normalize(L.xy);

  float rEff = R;
  if (MODO > 2.5) {
    float ang = atan(p.y, p.x);
    float suma = 0.0;
${CARAS_DEL_ASTEROIDE}
    float g2 = ruido(vec3(cos(ang) * 7.0, sin(ang) * 7.0, 0.37 + 3.0));
    rEff = (-log(max(suma, 1e-30)) / 42.0) * (0.975 + 0.05 * g2);
  }

  float d = length(p);
  float dentro = 1.0 - smoothstep(rEff - aa, rEff + aa, d);

  if (MODO > 2.5) {
    vec2 marcha = normalize(vec2(0.80, 0.55));
    float t = dot(p, marcha);
    float perp = abs(dot(p, vec2(-marcha.y, marcha.x)));
    if (t < 0.0) {
      float largo = exp(t * 2.6);
      float k = perp / (0.10 + (-t) * 0.30);
      float ancho = exp(-k * k);
      float turb = fbm(vec3(p * 7.0 + marcha * uTime * 0.38, uTime * 0.12));
      float est = largo * ancho * (0.45 + 0.9 * turb);
      vec3 cEst = mix(uPaleta3, vec3(1.0, 0.72, 0.35), 0.55);
      col += cEst * est * 1.15;
      alfa = max(alfa, est * 0.9);
    }
  }

  // El anillo de Saturno (el de Urano, de canto, no lo muestra Moss).
  float zAnillo = -1.0;
  vec3 colAnillo = vec3(0.0);
  float alfaAnillo = 0.0;
  if (uAnillo > 0.5) {
    float tilt = 0.34;
    vec2 qa = p;
    float rr = length(vec2(qa.x, qa.y / tilt));
    zAnillo = -qa.y / tilt;
    float franjas = ruido(vec3(rr * 26.0, 0.0, 0.37 * 7.0));
    float franjas2 = ruido(vec3(rr * 70.0, 3.0, 0.37 * 2.0));
    float dentroAnillo = smoothstep(R * 1.28, R * 1.33, rr) * (1.0 - smoothstep(R * 1.93, R * 2.02, rr));
    float gap = 1.0 - 0.85 * smoothstep(R * 1.60, R * 1.64, rr) * (1.0 - smoothstep(R * 1.71, R * 1.75, rr));
    alfaAnillo = dentroAnillo * gap * (0.30 + 0.45 * franjas + 0.2 * franjas2);
    float sombra = 1.0 - 0.8 * smoothstep(0.15, -0.25, dot(normalize(vec3(p, 0.001)), L)) * step(d, R * 1.5);
    colAnillo = paleta(0.72 + 0.25 * franjas, uPaleta0, uPaleta1, uPaleta2, uPaleta3) * (0.5 + 0.5 * sombra);
  }
  if (alfaAnillo > 0.0 && (zAnillo < 0.0 || d > rEff)) {
    col = mix(col, colAnillo, alfaAnillo);
    alfa = max(alfa, alfaAnillo);
  }

  if (dentro > 0.0) {
    vec3 n = vec3(p / rEff, 0.0);
    n.z = sqrt(max(0.0, 1.0 - dot(n.xy, n.xy)));
    vec3 nLisa = n;
    float vel = MODO > 2.5 ? 0.045 : 0.02;
    float rot = uTime * vel;
    float lon = atan(n.x, n.z) + rot;
    float lat = asin(clamp(n.y, -1.0, 1.0));
    vec3 sc = vec3(cos(lon) * 1.6, sin(lon) * 1.6, lat * 2.2);

    vec3 warp = vec3(0.0);
    float t = 0.0;
    if (!(MODO > 0.5 && MODO < 1.5)) {
      t = turbulento(sc * 2.0, uTurbulencia, warp);
    }

    if (uBandas > 0.5) {
      float banda = sin(lat * uBandas + warp.x * uTurbulencia * 2.2) * 0.5 + 0.5;
      banda = mix(banda, smoothstep(0.35, 0.65, banda), 0.5);
      t = mix(t, banda, uContraste);
    }

    vec3 superficie = paleta(t, uPaleta0, uPaleta1, uPaleta2, uPaleta3);

    if (uCasquetes > 0.0) {
      float bordePolo = 0.80 - 0.22 * uCasquetes;
      float hielo = smoothstep(bordePolo, bordePolo + 0.16, abs(sin(lat)) + fbm(sc * 5.0) * 0.16 - 0.08);
      superficie = mix(superficie, vec3(0.93, 0.95, 1.0), hielo * uCasquetes);
    }

    if (MODO > 2.5) {
      float piedra = alturaRoca(sc);
      superficie = paleta(clamp(piedra * 1.15, 0.0, 1.0), uPaleta0, uPaleta1, uPaleta2, uPaleta3);
      superficie *= 0.75 + 0.5 * ridged(sc * 20.0);
      float e = 0.06;
      float h0 = piedra;
      float hLon = alturaRoca(vec3(cos(lon + e) * 1.6, sin(lon + e) * 1.6, lat * 2.2));
      float hLat = alturaRoca(vec3(cos(lon) * 1.6, sin(lon) * 1.6, (lat + e) * 2.2));
      vec3 tanE = vec3(cos(lon), 0.0, -sin(lon));
      vec3 tanN = vec3(-sin(lat) * sin(lon), cos(lat), -sin(lat) * cos(lon));
      n = normalize(n - 1.4 * ((hLon - h0) * tanE + (hLat - h0) * tanN));
    }

    if (uCrateres > 0.0) {
      vec2 c1 = crateres(lon, lat, 2.2, 1.0, L2);
      vec2 c2 = crateres(lon, lat, 4.6, 2.0, L2);
      vec2 c3 = crateres(lon, lat, 9.5, 3.0, L2);
      vec2 c4 = crateres(lon, lat, 19.0, 4.0, L2);
      float piso = min(1.0, c1.x + c2.x * 0.7 + c3.x * 0.5 + c4.x * 0.3);
      float luzC = c1.y + c2.y * 0.85 + c3.y * 0.55 + c4.y * 0.25;
      superficie *= (1.0 - 0.22 * piso * uCrateres);
      superficie *= clamp(1.0 + 0.62 * luzC * uCrateres, 0.28, 1.75);
    }

    if (uMares > 0.0) {
      float mar = smoothstep(0.54, 0.70, fbm(sc * 1.25 + vec3(4.4)));
      superficie *= (1.0 - 0.34 * mar * uMares);
    }

    if (uRayos > 0.0) {
      float rr2 = fbm(sc * 2.2 + vec3(13.0));
      float estrias = pow(max(0.0, ruido(sc * 14.0 + vec3(31.0))), 3.0);
      float rayo = smoothstep(0.55, 0.80, rr2) * estrias;
      superficie += vec3(0.22, 0.23, 0.26) * rayo * uRayos;
    }

    if (uPuntos > 0.0) {
      float pt = smoothstep(0.74, 0.86, fbm(sc * 5.5 + vec3(21.0)));
      float pt2 = smoothstep(0.80, 0.92, fbm(sc * 12.0 + vec3(9.0)));
      superficie += vec3(0.85, 0.88, 0.95) * (pt * 0.9 + pt2 * 0.5) * uPuntos;
    }

    if (MODO > 0.5 && MODO < 1.5) {
      // EL SOL
      vec3 es = vec3(cos(lat) * cos(lon), cos(lat) * sin(lon), sin(lat));
      float lento = fbm(es * 5.2 + vec3(uTime * 0.03, 0.0, 9.0));
      float hervor = fbm(es * 21.0 - vec3(uTime * 0.15));
      float red = ridged(es * 9.5 + vec3(lento * 2.4, hervor * 1.5 + uTime * 0.05, -lento * 1.8 - uTime * 0.04));
      float mirando = smoothstep(0.0, 0.45, n.z);
      float mancha = smoothstep(0.74, 0.86, lento);
      float temp = 0.24 + 0.60 * red * red + 0.34 * (lento - 0.5) + 0.22 * (hervor - 0.5) * mirando;
      temp *= 1.0 - 0.8 * mancha;
      temp += 0.5 * pow(max(1.0 - n.z, 0.0), 2.6);
      vec3 vivo = vec3(1.0, 0.66, 0.16);
      vec3 cara = mix(vec3(0.28, 0.045, 0.0), vec3(0.88, 0.31, 0.03), smoothstep(0.0, 0.45, temp));
      cara = mix(cara, vec3(0.96, 0.47, 0.05), smoothstep(0.42, 0.85, temp));
      cara = mix(cara, vivo, smoothstep(0.85, 1.25, temp));
      cara *= 0.50 + 0.55 * temp;
      float discoSol = 1.0 - smoothstep(rEff - 0.014, rEff + 0.004, d);
      col = mix(col, cara, discoSol);
      alfa = max(alfa, discoSol);
      float filo = exp(-abs(d - rEff) * 26.0);
      col += mix(vec3(1.0, 0.46, 0.10), vivo, filo * 0.7) * filo * 1.15;
    } else if (MODO > 1.5 && MODO < 2.5) {
      col = mix(col, vec3(0.0), dentro);
      alfa = max(alfa, dentro);
    } else {
      float dif = max(dot(n, L), 0.0);
      float term = smoothstep(0.0, 0.35, dif);
      vec3 lit = superficie * (0.06 + 0.94 * term * (0.55 + 0.45 * dif));
      if (uNoche > 0.0) {
        float rim = pow(max(1.0 - n.z, 0.0), 4.0);
        vec2 dirB = normalize(n.xy + vec2(1e-5));
        float ladoLuz = max(dot(dirB, L2), 0.0);
        vec3 nocturno = superficie * uNoche;
        nocturno += paleta(0.92, uPaleta0, uPaleta1, uPaleta2, uPaleta3) * rim * pow(ladoLuz, 1.4) * 1.9;
        lit = nocturno;
        if (MODO > 2.5) {
          vec3 luzRoca = normalize(mix(vec3(-0.52, 0.57, -0.58), vec3(-0.30, 0.33, -0.90), HORIZONTE));
          float rasante = smoothstep(-0.12, 0.55, dot(n, luzRoca));
          vec2 dirL = normalize(nLisa.xy + vec2(1e-5));
          float canto = pow(max(1.0 - nLisa.z, 0.0), 5.0) * pow(max(dot(dirL, L2), 0.0), 1.4);
          lit = superficie * uNoche + sqrt(max(superficie, vec3(0.0))) * rasante * 1.1
              + sqrt(paleta(0.92, uPaleta0, uPaleta1, uPaleta2, uPaleta3)) * canto * (0.5 + 1.0 * rasante);
        }
      }
      if (MODO < 0.5) {
        float rot2 = uTime * 0.034;
        float lon2 = atan(n.x, n.z) + rot2;
        vec3 sc2 = vec3(cos(lon2) * 1.1, sin(lon2) * 1.1, lat * 1.5);
        float neb = fbm(sc2 * 2.4 + vec3(31.7));
        lit = mix(lit, paleta(0.92, uPaleta0, uPaleta1, uPaleta2, uPaleta3) * (0.1 + 0.9 * term), smoothstep(0.55, 0.9, neb) * 0.22);
      }
      col = mix(col, lit, dentro);
      alfa = max(alfa, dentro);
    }
  }

  float fuera = smoothstep(rEff - aa, rEff + aa, d);

  if (MODO > 0.5 && MODO < 1.5) {
    float dx = max(d - rEff, 0.0);
    float angC = atan(p.y, p.x);
    float pluma = 0.62 + 0.76 * ruido(vec3(cos(angC) * 2.2, sin(angC) * 2.2, uTime * 0.04 + 5.0));
    float halo = (exp(-dx * 15.0) * 0.50 + exp(-dx * 3.6) * 0.17 * pluma) * fuera * smoothstep(1.0, 0.72, d);
    col += mix(vec3(1.0, 0.40, 0.07), vec3(1.0, 0.62, 0.18), exp(-dx * 9.0)) * halo;
    float pelo = ruido(vec3(cos(angC) * 46.0, sin(angC) * 46.0, uTime * 0.22));
    float espicula = exp(-dx * (42.0 + 70.0 * pelo)) * fuera;
    col += vec3(1.0, 0.54, 0.14) * espicula * 0.75;
    float pr = protuberancias(p, d, uTime);
    col += mix(vec3(1.0, 0.38, 0.07), vec3(1.0, 0.66, 0.16), clamp(pr * 0.75, 0.0, 1.0)) * pr * 1.25;
  } else if (MODO > 1.5 && MODO < 2.5) {
    float achata = 0.26;
    float rr = length(vec2(p.x, p.y / achata));
    float angD = atan(p.y / achata, p.x);
    float banda = smoothstep(R * 1.00, R * 1.09, rr) * (1.0 - smoothstep(R * 1.65, R * 2.15, rr));
    float giro = angD - 2.4 * (rr / R) + uTime * 0.28;
    float grueso = fbm(vec3(cos(giro) * 2.0, sin(giro) * 2.0, rr * 1.4));
    float giroFino = (giro + uTime * 0.17) * 3.0;
    float fino = fbm(vec3(cos(giroFino) * 3.0, sin(giroFino) * 3.0, rr * 5.0));
    float franjas = smoothstep(0.22, 0.78, grueso + 0.17 * (fino - 0.5));
    float doppler = 0.42 + 0.88 * smoothstep(0.7, -0.7, p.x);
    float temp = 1.0 - smoothstep(R * 1.02, R * 2.0, rr);
    vec3 frio = mix(uPaleta1 * 0.95, uPaleta2 * 0.32, 0.42);
    vec3 naranja = mix(uPaleta2, uPaleta3, 0.42);
    vec3 calor = vec3(1.0, 0.60, 0.14);
    vec3 gasCol = mix(frio, naranja, smoothstep(0.06, 0.50, temp));
    gasCol = mix(gasCol, calor, pow(max(temp, 0.0), 2.4));
    gasCol *= doppler * (0.50 + 0.78 * franjas);
    float dens = banda * (0.30 + 0.86 * franjas) * (0.50 + 1.15 * pow(max(temp, 0.0), 1.3));
    float cercano = smoothstep(0.03, -0.03, p.y);
    col += gasCol * dens * (1.0 - cercano) * fuera * 3.4;
    vec2 dirp = normalize(p + vec2(1e-5));
    float vertical = pow(abs(dirp.y), 1.2);
    float deArriba = smoothstep(-0.12, 0.12, p.y);
    float anchoL = R * (0.05 + 0.17 * vertical) * mix(0.70, 1.0, deArriba);
    float dl = max(d - R * 1.03, 0.0);
    float aro = smoothstep(R * 1.012, R * 1.04, d) * exp(-pow(dl / anchoL, 2.4));
    float angL = atan(p.y, p.x) + uTime * 0.10;
    float texL = 0.15 + 1.5 * fbm(vec3(cos(angL) * 1.6, sin(angL) * 1.6, d * 30.0));
    float lente = aro * (0.30 + 0.80 * vertical) * mix(0.60, 1.0, deArriba) * (0.55 + 0.45 * doppler) * texL * fuera;
    col += mix(mix(uPaleta2, naranja, 0.55), calor, exp(-dl / (R * 0.06))) * lente * 3.6;
    col += naranja * exp(-pow(dl / (anchoL * 2.0), 1.2)) * (0.30 + 0.55 * vertical) * mix(0.6, 1.0, deArriba) * fuera * 0.32;
    float rrG = length(vec2(p.x, p.y / 0.50));
    float kG = (rrG - R * 1.35) / (R * 0.50);
    col += naranja * doppler * exp(-kG * kG) * fuera * 0.20;
    col += uPaleta1 * exp(-pow(dl / (anchoL * 2.4), 1.3)) * (0.25 + 0.5 * vertical) * fuera * 0.22;
    col += gasCol * dens * cercano * 3.7;
    float foton = exp(-abs(d - R * 1.012) * 150.0);
    col += vec3(1.0, 0.70, 0.26) * foton * 2.2 * fuera;
  } else if (MODO < 0.5 && dentro < 1.0) {
    vec2 dirBorde = normalize(p + vec2(1e-5));
    float ladoLuz = max(dot(vec3(dirBorde, 0.0), L), 0.0);
    float halo = exp(-(d - rEff) * 24.0) * fuera * ladoLuz;
    col += paleta(0.95, uPaleta0, uPaleta1, uPaleta2, uPaleta3) * halo * 0.8;
    alfa = max(alfa, halo * 0.7);
  }

  if (uAnillo > 0.5 && alfaAnillo > 0.0 && zAnillo >= 0.0 && d <= rEff) {
    col = mix(col, colAnillo, alfaAnillo);
    alfa = max(alfa, alfaAnillo);
  }

  bool enHorizonte = (MODO > 1.5 && MODO < 2.5 && d < rEff);

  if (MODO > 0.5 && MODO < 2.5) {
    float pico = max(col.r, max(col.g, col.b));
    float sobra = max(pico - 0.7, 0.0);
    col *= (min(pico, 0.7) + sobra / (1.0 + 3.3 * sobra)) / max(pico, 1e-4);
    if (!enHorizonte) {
      alfa = clamp(max(alfa, max(col.r, max(col.g, col.b))), 0.0, 1.0);
      col /= max(alfa, 1e-4);
    }
  }

  float grano = ${GRANO} - 0.5;
  if (!enHorizonte) col += grano * (MODO > 2.5 ? 0.004 : 0.018);
  if (enHorizonte) alfa = 1.0;

  float a = clamp(alfa, 0.0, 1.0);
  return vec4(clamp(col, 0.0, 1.0) * a, a);
}`;
}

/** El texto de un efecto: el del modo, con lo común y lo que ese modo usa. */
export function fuenteDelCuerpo(modo: number): string {
  if (modo === MODO.nebulosa) return UNIFORMS + COMUN + mainNebulosa();
  if (modo === MODO.galaxia) return UNIFORMS + COMUN + mainGalaxia();
  return UNIFORMS + COMUN + SUPERFICIE + PROTUBERANCIAS + mainCuerpo(modo);
}

/**
 * El resplandor del bulbo de la galaxia (FRAGMENT_PRESAGIO de Ascent con su materialResplandor): una luz sin borde,
 * que se suma. uEscala es el medio lado de su quad, en puntos.
 */
export function fuenteDelResplandor(): string {
  return `
uniform float2 uCentro;
uniform float uEscala;
uniform float uDensidad;
uniform float uTime;
uniform float3 uColor;
uniform float uFuerza;
vec4 main(vec2 pos) {
  vec2 p = (pos - uCentro) / uEscala;
  float d = length(p);
  if (d >= 1.0) return vec4(0.0);
  float campo = pow(1.0 - smoothstep(0.0, 1.0, d), 2.6);
  float respira = 0.82 + 0.18 * sin(uTime * 0.52);
  float a = campo * respira * uFuerza;
  vec2 g = floor(pos * uDensidad);
  a += (fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.004;
  a = clamp(a, 0.0, 1.0);
  return vec4(uColor * a, a);
}`;
}

/**
 * La partícula redonda de Ascent (FRAGMENT_PUNTOS): un núcleo compacto y un halo que se apaga, en blanco. Se pinta
 * una vez en una imagen y cada partícula la usa con su color.
 */
export function fuenteDeLaParticula(): string {
  return `
uniform float uLado;
vec4 main(vec2 pos) {
  float d = length(pos / uLado - vec2(0.5)) * 2.0;
  if (d > 1.0) return vec4(0.0);
  float nucleo = 1.0 - smoothstep(0.0, 0.45, d);
  float halo = 1.0 - smoothstep(0.15, 1.0, d);
  float a = clamp(nucleo * 0.85 + halo * 0.5, 0.0, 1.0);
  if (a < 0.004) return vec4(0.0);
  return vec4(a);
}`;
}
