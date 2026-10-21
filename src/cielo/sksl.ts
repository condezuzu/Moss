// Envoltorios SkSL de los shaders compartidos con la galería (src/cielo/shaders/*.glsl).
// Solo arman texto: los usa la app (efectos.ts) y también herramientas/verificar-shaders.mjs,
// que los compila con CanvasKit en Node. Por eso acá no hay imports ni sintaxis que Node no
// pueda borrar al leer TypeScript.

type Fuentes = { comun: string; fondo?: string; aurora?: string; vivo?: string };

// Skia mide la y hacia abajo y el mundo la mide hacia arriba: cada envoltorio da vuelta la y.

/** El cielo fijo, una sola vez por tamaño, calidad y riqueza. Se dibuja a una textura de uRes píxeles. */
export function fuenteFondo(f: Fuentes): string {
  return `
uniform float2 uRes;
uniform float2 uMundoMin;
uniform float2 uMundoTam;
uniform float uPxPorUnidad;
uniform float uHorizonte;
uniform float uOctavas;
uniform float uCapas;
uniform float uSemilla;
uniform float uRiqueza;
${f.comun}
${f.fondo}
vec4 main(vec2 p) {
  vec2 uv = vec2(p.x / uRes.x, 1.0 - p.y / uRes.y);
  vec2 w = uMundoMin + uv * uMundoTam;
  vec3 c = colorFondo(w, uPxPorUnidad, uHorizonte, uOctavas, uCapas, uSemilla, uRiqueza);
  c += (hash12(p) - 0.5) / 255.0;
  return vec4(c, 1.0);
}`;
}

/**
 * El cielo de cada cuadro: el cielo fijo desplazado por la cámara, la onda del día completo, la
 * aurora, las estrellas que titilan y la estrella fugaz, en un solo pase a pantalla completa.
 * `fondo` es la textura del cielo fijo, en sus píxeles.
 */
export function fuenteCielo(f: Fuentes): string {
  return `
uniform shader fondo;
uniform float2 uLienzo;
uniform float uEscala;
uniform float uDpr;
uniform float uCamY;
uniform float2 uMundoMin;
uniform float2 uMundoTam;
uniform float2 uTex;
uniform float uHorizonte;
uniform float uTiempo;
uniform float uTiempoAurora;
uniform float uIntensidad;
uniform float uOleada;
uniform float uCortinas;
uniform float uParalajeAurora;
uniform float uDensidad;
uniform float4 uOnda;
uniform float4 uFugaz;
uniform float4 uFugazEstela;
uniform float uAparicion;
uniform float uRiqueza;
${f.comun}
${f.aurora}
${f.vivo}
vec4 main(vec2 p) {
  vec2 rel = vec2(p.x - 0.5 * uLienzo.x, 0.5 * uLienzo.y - p.y) / uEscala;
  vec2 w = vec2(0.0, uCamY) + rel;
  vec2 uv = (w - uMundoMin) / uMundoTam;
  vec3 c = vec3(fondo.eval(vec2(uv.x * uTex.x, (1.0 - uv.y) * uTex.y)).rgb);
  float onda = ondaDelDia(w, uOnda.xy, uOnda.z, uOnda.w);
  c = c * (1.0 + onda * 1.8) + vec3(1.0, 0.84, 0.52) * onda * 0.03;
  vec2 wAurora = vec2(0.0, uCamY * uParalajeAurora) + rel;
  c += colorAurora(wAurora, uTiempoAurora, uHorizonte, uIntensidad, uOleada, uCortinas, uRiqueza);
  float pxPorUnidad = uEscala * uDpr;
  c += estrellasVivas(w, pxPorUnidad, uTiempo, uDensidad * crece(uRiqueza, 0.5, 1.3));
  c += estrellaFugaz(w, uFugaz.xy, uFugaz.zw, uFugazEstela, pxPorUnidad);
  vec2 q = p / uLienzo - 0.5;
  c *= 1.0 - 0.40 * dot(q, q);
  c *= uAparicion;
  c += (hash12(p * uDpr) - 0.5) / 255.0;
  return vec4(c, 1.0);
}`;
}

/**
 * La hoja de sprites: seis celdas de uCelda px con las formas de luz que dibujan los Atlas, en
 * blanco y con alfa (el color lo pone cada sprite). Son las mismas fórmulas que FS_SPRITES de la
 * galería: brillo, núcleo, brazos en cruz, aro, aro fino y disco.
 */
export function fuenteHoja(): string {
  return `
uniform float uCelda;
vec4 main(vec2 p) {
  float celda = floor(p.x / uCelda);
  vec2 q = vec2(mod(p.x, uCelda), p.y) / uCelda * 2.0 - 1.0;
  float r = length(q);
  float a = 0.0;
  if (celda < 0.5) {
    a = (exp(-r * r * 5.0) * 0.9 + exp(-r * 3.2) * 0.25) * smoothstep(1.0, 0.72, r);
  } else if (celda < 1.5) {
    a = (exp(-r * r * 70.0) * 1.3 + exp(-r * r * 14.0) * 0.45) * smoothstep(1.0, 0.82, r);
  } else if (celda < 2.5) {
    a = (exp(-abs(q.x) * 60.0) * exp(-abs(q.y) * 2.8) + exp(-abs(q.y) * 60.0) * exp(-abs(q.x) * 2.8)) * smoothstep(1.0, 0.82, r);
  } else if (celda < 3.5) {
    a = smoothstep(0.075, 0.0, abs(r - 0.86));
  } else if (celda < 4.5) {
    a = smoothstep(0.03, 0.0, abs(r - 0.9));
  } else {
    a = smoothstep(1.0, 0.0, r);
    a *= a;
  }
  a = clamp(a, 0.0, 1.0);
  return vec4(a, a, a, a);
}`;
}

/** El cuerpo de una loma de musgo: textura fina y más oscuro hacia abajo. */
export function fuenteMusgo(f: Fuentes): string {
  return `
uniform float2 uLienzo;
uniform float uEscala;
uniform float3 uCuerpo;
uniform float uBase;
${f.comun}
vec4 main(vec2 p) {
  vec2 w = vec2(p.x - 0.5 * uLienzo.x, 0.5 * uLienzo.y - p.y) / uEscala;
  float textura = ruido(w * 260.0) * 0.55 + ruido(w * 70.0) * 0.45;
  vec3 c = uCuerpo * (0.70 + 0.60 * textura);
  c *= 1.0 - 0.55 * smoothstep(0.0, 0.22, uBase - w.y);
  return vec4(c, 1.0);
}`;
}
