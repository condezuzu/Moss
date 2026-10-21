// Lo que cambia en cada cuadro sobre el cielo fijo: las estrellas que titilan, la estrella fugaz
// y la onda del día completo. Va en el mismo pase que la aurora.
// Necesita comun.glsl antes.

// Estrellas brillantes que titilan, una como mucho por celda y siempre lejos del borde de su
// celda: así alcanza con mirar una sola celda por píxel.
vec3 estrellasVivas(vec2 w, float pxPorUnidad, float t, float densidad) {
  float celdaPx = 64.0;
  float celda = celdaPx / pxPorUnidad;
  vec2 id = floor(w / celda);
  if (hash12(id + 91.7) >= densidad) {
    return vec3(0.0);
  }
  vec2 pos = (id + 0.3 + 0.4 * hash22(id + 13.1)) * celda;
  float m = pow(hash12(id + 7.7), 2.6);
  float tam = 1.4 + 3.6 * m;
  vec2 d = (w - pos) * pxPorUnidad;
  float r = length(d);
  float fase = hash12(id + 3.3) * 6.2831853;
  float vel = 0.7 + 2.4 * hash12(id + 5.9);
  float tit = 0.72 + 0.28 * sin(t * vel + fase) * sin(t * vel * 0.37 + fase * 2.1);
  float nucleo = exp(-r * r / (tam * tam * 0.35));
  float halo = exp(-r / (tam * 2.2)) * 0.16;
  // Solo las más brillantes tienen destellos en cruz.
  float brazos = 0.0;
  if (m > 0.85) {
    brazos = (exp(-abs(d.x) * 1.2) * exp(-abs(d.y) / (tam * 3.0)) + exp(-abs(d.y) * 1.2) * exp(-abs(d.x) / (tam * 3.0))) * 0.25;
  }
  vec3 color = temperaturaEstrella(hash12(id + 19.3));
  return color * (0.14 + 0.6 * m) * tit * (nucleo + halo + brazos);
}

// La estrella fugaz: una cabeza y una estela que se apaga hacia atrás.
// cabeza y dir en el mundo. f: x = camino recorrido, y = largo máximo de la estela (los dos en
// unidades del mundo), z = brillo de la cabeza, w = brillo de la estela.
// La estela nace con la cabeza (nunca es más larga que lo recorrido), se afina hacia atrás y pasa
// del blanco cálido a un verde tenue, como un meteoro de verdad. Va dejando chispas fijas en el
// camino. Cuando la cabeza se apaga, la estela queda un instante donde estaba y se desvanece.
vec3 estrellaFugaz(vec2 w, vec2 cabeza, vec2 dir, vec4 f, float pxPorUnidad) {
  if (f.z <= 0.0 && f.w <= 0.0) {
    return vec3(0.0);
  }
  vec2 q = w - cabeza;
  float a = -dot(q, dir);
  float b = dot(q, vec2(-dir.y, dir.x));
  float largo = max(min(f.x, f.y), 0.0001);
  float detras = a / largo;
  vec3 color = vec3(0.0);
  if (a > 0.0 && detras < 1.0) {
    float ancho = mix(1.2, 0.35, detras) / pxPorUnidad;
    float nucleo = exp(-b * b / (ancho * ancho));
    float halo = exp(-abs(b) * pxPorUnidad / 3.5) * 0.16;
    float caida = exp(-detras * 3.0) * smoothstep(1.0, 0.7, detras);
    // Las chispas quedan quietas en el camino: se miden desde donde empezó, no desde la cabeza.
    float chispas = 0.7 + 0.3 * ruido1((f.x - a) * pxPorUnidad / 5.0);
    vec3 tono = mix(vec3(1.0, 0.93, 0.80), vec3(0.55, 0.95, 0.74), smoothstep(0.08, 0.75, detras));
    color += tono * (nucleo + halo) * caida * chispas * f.w;
  }
  float r = length(q) * pxPorUnidad;
  float punta = exp(-r * r / 3.0) * 1.4 + exp(-r / 4.0) * 0.32;
  color += vec3(1.0, 0.97, 0.90) * punta * f.z;
  return color;
}

// La onda del día completo: un anillo que enciende el cielo a su paso. Multiplica el color.
float ondaDelDia(vec2 w, vec2 centro, float radio, float fuerza) {
  if (fuerza <= 0.0) {
    return 0.0;
  }
  float d = length(w - centro);
  return fuerza * gauss((d - radio) / 0.07);
}
