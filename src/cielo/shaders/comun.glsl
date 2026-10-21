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
