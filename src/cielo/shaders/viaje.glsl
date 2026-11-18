// El viaje de la entrada a la app («flum»): el cuadro entero se estira hacia un punto de fuga, con
// estelas, como si la cámara saliera disparada muy lejos. Acá van las cuentas; cada lado lee su
// cuadro (la galería, una textura; la app, la capa de Skia) donde dice muestraDelViaje y lo junta
// con pesoDelViaje. Con la estela en cero queda solo el acercamiento.

// Dónde se lee la muestra t (de 0 a 1) del píxel que está a d del punto de fuga.
vec2 muestraDelViaje(vec2 d, vec2 centro, float zoom, float estela, float t) {
  return centro + d / (zoom * (1.0 + estela * t));
}

// Las muestras más lejanas pesan menos: la estela se apaga hacia afuera.
float pesoDelViaje(float t) {
  return 1.0 - 0.75 * t;
}

// Lo juntado, ya promediado. Al estirarse, una estrella reparte su luz en la estela: se compensa para
// que no se apague. Las esquinas se oscurecen con la velocidad (el ojo va al punto de fuga) y el velo
// lo lleva hacia la noche. q es el píxel en el lienzo, de -0,5 a 0,5.
vec3 terminarElViaje(vec3 c, vec2 q, float estela, float brillo, float velo) {
  c *= (1.0 + 1.3 * estela) * brillo;
  c *= 1.0 - min(0.6, estela * 1.1) * dot(q, q) * 2.0;
  return mix(c, vec3(0.010, 0.016, 0.036), velo);
}
