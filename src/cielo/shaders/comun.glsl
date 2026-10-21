// Ruido compartido por los shaders del cielo.
// Está escrito en el subconjunto de GLSL que también acepta SkSL (sin #define, sin texturas,
// bucles con tope constante, sin uniforms adentro de las funciones), así la galería web y la app
// nativa compilan exactamente el mismo cuerpo: cada plataforma solo pone su envoltorio.

// Hash sin seno de Dave Hoskins (licencia MIT): sin() pierde precisión en las GPU de teléfono.
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

// Ruido de una sola dimensión: la mitad de cuentas que el de dos. Alcanza para todo lo que
// cambia solo a lo largo de una columna, como los rayos de la aurora.
float ruido1(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), u);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// exp(-x²) sin pow: pow(x, 2.0) con x negativo da NaN en SkSL y en Metal (WebGL lo perdona).
float gauss(float x) {
  return exp(-x * x);
}

// t en [0,1]: de anaranjada a azulada; casi todas quedan cerca del blanco, como en el cielo real.
vec3 temperaturaEstrella(float t) {
  vec3 naranja = vec3(1.0, 0.74, 0.50);
  vec3 blanca = vec3(1.0, 0.96, 0.90);
  vec3 azul = vec3(0.72, 0.82, 1.0);
  if (t < 0.5) {
    return mix(naranja, blanca, smoothstep(0.0, 0.5, t));
  }
  return mix(blanca, azul, smoothstep(0.5, 1.0, t));
}

// Normalizado por el peso total: bajar octavas en calidad baja no oscurece el cielo.
float fbm(vec2 p, float octavas) {
  float suma = 0.0;
  float peso = 0.5;
  float total = 0.0;
  for (int i = 0; i < 7; i++) {
    if (float(i) >= octavas) {
      break;
    }
    suma += peso * ruido(p);
    total += peso;
    // Rotar entre octavas esconde la grilla del ruido.
    p = vec2(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03 + vec2(1.7, 9.2);
    peso *= 0.5;
  }
  return suma / total;
}

// La riqueza del cielo va de 0 a 1 y crece con la luz juntada desde siempre (nunca baja). En 0.6
// el cielo es el que se aprobó en la galería: antes es más pobre y después más rico. Devuelve el
// factor que corresponde, de `desde` (riqueza 0) a `hasta` (riqueza 1).
float crece(float riqueza, float desde, float hasta) {
  if (riqueza < 0.6) {
    return mix(desde, 1.0, riqueza / 0.6);
  }
  return mix(1.0, hasta, (riqueza - 0.6) / 0.4);
}
