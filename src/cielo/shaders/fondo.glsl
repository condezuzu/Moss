// El cielo fijo: degradé, vía láctea y miles de estrellas débiles.
// Se calcula UNA vez por tamaño de pantalla y calidad, y queda en una textura que después
// solo se desplaza con la cámara. Por eso puede ser caro: no se paga en cada cuadro.
// Unidades: `w` es una posición del mundo, donde 1.0 es el alto de la pantalla y el centro de
// la zona "hoy" es (0, 0). `pxPorUnidad` dice cuántos píxeles mide una unidad (para que una
// estrella mida lo mismo en cualquier resolución).
// Necesita comun.glsl antes.

vec3 temperaturaEstrella(float t) {
  vec3 naranja = vec3(1.0, 0.74, 0.50);
  vec3 blanca = vec3(1.0, 0.96, 0.90);
  vec3 azul = vec3(0.72, 0.82, 1.0);
  if (t < 0.5) {
    return mix(naranja, blanca, smoothstep(0.0, 0.5, t));
  }
  return mix(blanca, azul, smoothstep(0.5, 1.0, t));
}

// Una capa de estrellas sobre una grilla: cada celda tiene como mucho una estrella, en un
// lugar al azar. Se miran las 8 vecinas para que el brillo de una estrella no se corte en el borde.
vec3 capaEstrellas(vec2 w, float pxPorUnidad, float celdaPx, float densidad, float brillo, float radioPx, float semilla) {
  float celda = celdaPx / pxPorUnidad;
  vec2 id = floor(w / celda);
  vec3 suma = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = id + vec2(float(i), float(j));
      if (hash12(c + semilla * 7.13) < densidad) {
        vec2 pos = (c + hash22(c + semilla)) * celda;
        float m = hash12(c + semilla * 3.31 + 11.7);
        // Cola larga: casi todas débiles, unas pocas brillantes, como en un cielo real.
        float b = brillo * (0.12 + 0.88 * pow(m, 7.0));
        float r = radioPx * (0.7 + 1.5 * pow(m, 4.0));
        float d = length(w - pos) * pxPorUnidad;
        suma += temperaturaEstrella(hash12(c + semilla * 5.77 + 3.1)) * b * exp(-d * d / (r * r));
      }
    }
  }
  return suma;
}

// x: luz de la banda · y: cuánto es núcleo · z: cuánto polvo · w: presencia de la banda
vec4 viaLactea(vec2 w, float horizonte, float octavas) {
  // Nace cerca del horizonte, a la derecha, con el núcleo cálido, y cruza el cielo en diagonal
  // por detrás de la constelación de hoy.
  vec2 centro = vec2(0.24, horizonte + 0.05);
  vec2 dir = normalize(vec2(-0.50, 1.0));
  vec2 nor = vec2(dir.y, -dir.x);
  vec2 q = w - centro;
  float largo = dot(q, dir);
  // Se arquea hacia la derecha al subir, como en una foto panorámica: así cruza el cielo de hoy
  // y vuelve a pasar por el centro del universo, más arriba.
  float ancho = dot(q, nor) - 0.18 * largo * largo;
  // El borde serpentea: una banda recta se ve dibujada.
  ancho += (fbm(vec2(largo * 1.1, 4.3), 3.0) - 0.5) * 0.16;
  float bulbo = exp(-pow(largo / 0.40, 2.0));
  float mitad = 0.15 + 0.10 * bulbo + 0.05 * (ruido(vec2(largo * 2.3, 1.7)) - 0.5);
  float banda = exp(-pow(ancho / mitad, 2.0));

  vec2 deform = vec2(fbm(w * 2.1 + 3.0, 3.0), fbm(w * 2.1 + 8.0, 3.0));
  float nubes = fbm(w * 4.2 + deform * 1.3, octavas);
  float grumos = smoothstep(0.35, 0.85, nubes);
  float grano = ruido(w * 70.0);

  // La Gran Grieta corre por el medio de la banda y se deshace en filamentos.
  float filamentos = smoothstep(0.48, 0.72, fbm(w * 3.4 + deform * 2.2 + 17.0, octavas));
  float anchoGrieta = 0.016 + 0.022 * ruido(vec2(largo * 4.0, 9.0));
  float grieta = exp(-pow((ancho - 0.015 * sin(largo * 7.0)) / anchoGrieta, 2.0));
  grieta *= smoothstep(-0.35, 0.05, largo) * (0.6 + 0.4 * ruido(vec2(largo * 9.0, 2.0)));
  float polvo = clamp(filamentos * exp(-pow(ancho / (mitad * 0.7), 2.0)) * 0.8 + grieta * 0.85, 0.0, 1.0);

  float luz = banda * (0.30 + 0.95 * grumos) * (0.85 + 0.30 * grano) + bulbo * banda * 0.55;
  luz *= 1.0 - 0.72 * polvo;
  // Un halo ancho y tenue alrededor de la banda: así se ve en una foto de larga exposición.
  luz += exp(-pow(ancho / (mitad * 2.6), 2.0)) * (0.06 + 0.09 * bulbo);
  return vec4(luz, bulbo * banda, polvo * banda, banda);
}

vec3 colorFondo(vec2 w, float pxPorUnidad, float horizonte, float octavas, float capas, float semilla) {
  float alt = max(w.y - horizonte, 0.0);
  vec3 cenit = vec3(0.010, 0.016, 0.040);
  vec3 medio = vec3(0.024, 0.045, 0.110);
  vec3 bajo = vec3(0.060, 0.105, 0.200);
  vec3 col = mix(bajo, medio, smoothstep(0.0, 0.35, alt));
  col = mix(col, cenit, smoothstep(0.30, 1.40, alt));
  // Luminiscencia atmosférica: el verde tenue que tiene de verdad un cielo sin luces.
  col += vec3(0.020, 0.060, 0.035) * exp(-alt * 7.0);

  vec4 vl = viaLactea(w, horizonte, octavas);
  vec3 tono = mix(vec3(0.60, 0.70, 0.98), vec3(1.00, 0.84, 0.60), clamp(vl.y * 1.3 + vl.x * 0.25, 0.0, 1.0));
  col += tono * vl.x * 0.40;
  // El polvo enrojece y apaga lo que tiene atrás.
  col = mix(col, col * vec3(0.55, 0.42, 0.36), vl.z * 0.5);

  float neb = fbm(w * 1.3 + 21.0, 4.0);
  col += vec3(0.020, 0.032, 0.060) * smoothstep(0.55, 0.90, neb);

  float masDensa = 1.0 + 2.6 * vl.w;
  vec3 estrellas = capaEstrellas(w, pxPorUnidad, 34.0, 0.55, 1.25, 0.95, semilla + 3.0);
  if (capas > 1.5) {
    estrellas += capaEstrellas(w, pxPorUnidad, 13.0, 0.40 * masDensa, 0.75, 0.75, semilla + 1.0);
  }
  if (capas > 2.5) {
    estrellas += capaEstrellas(w, pxPorUnidad, 5.5, min(0.22 * masDensa, 0.9), 0.42, 0.55, semilla + 2.0);
  }
  estrellas *= (1.0 - 0.75 * vl.z) * smoothstep(0.0, 0.10, alt);
  return col + estrellas;
}
