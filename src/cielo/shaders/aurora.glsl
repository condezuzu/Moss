// Las auroras: cortinas con el borde de abajo nítido y rayos que se desvanecen hacia arriba,
// como las de verdad. Se calcula en cada cuadro y en el teléfono a resolución completa, así que
// todo lo que depende solo de la columna usa ruido de una dimensión (ruido1), que es barato.
// `oleada` va de 0 a 1 cuando se completa el día: las cortinas suben, se aceleran y el borde
// se vuelve dorado, como una subtormenta real. `riqueza` (ver crece) es el progreso de toda la
// vida: con más luz juntada, los rayos llegan más alto y la aurora brilla más.
// Necesita comun.glsl antes.

float alturaCortina(float x, float t, float k, float base, float amp) {
  return base + amp * (
      0.55 * sin(x * 1.7 + t * 0.11 + k * 2.1)
    + 0.30 * sin(x * 3.9 - t * 0.17 + k * 4.3)
    + 0.12 * sin(x * 9.0 + t * 0.35 + k)
    + 0.80 * (ruido1(x * 1.3 + t * 0.045 + k * 7.7) - 0.5));
}

// La pendiente sale de los senos solos: el ruido cambia lento y casi no la mueve.
float pendienteCortina(float x, float t, float k, float amp) {
  return amp * (
      0.55 * 1.7 * cos(x * 1.7 + t * 0.11 + k * 2.1)
    + 0.30 * 3.9 * cos(x * 3.9 - t * 0.17 + k * 4.3)
    + 0.12 * 9.0 * cos(x * 9.0 + t * 0.35 + k));
}

vec3 colorAurora(vec2 w, float t, float horizonte, float intensidad, float oleada, float cortinas, float riqueza) {
  vec3 suma = vec3(0.0);
  if (w.y < horizonte) {
    return suma;
  }
  float crecida = crece(riqueza, 0.7, 1.4);
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    if (k >= cortinas) {
      break;
    }
    float x = w.x * (1.0 + 0.22 * k) + k * 3.7;
    float base = horizonte + 0.15 + 0.075 * k + 0.04 * oleada;
    float amp = 0.045 + 0.02 * k + 0.035 * oleada;
    float dy = w.y - alturaCortina(x, t, k, base, amp);
    float pendiente = pendienteCortina(x, t, k, amp);

    // Una cortina no ocupa todo el cielo: aparece en tramos, con huecos oscuros entre medio.
    float tramo = smoothstep(0.14, 0.62, ruido1(x * 0.9 + t * 0.018 + k * 3.3 + 1.0));
    tramo = mix(tramo, 1.0, 0.55 * oleada);

    // Los rayos se corren de costado despacio, como en una aurora de verdad.
    float rayos = ruido1(x * 42.0 + t * 0.22 + k * 5.0);
    float finos = ruido1(x * 110.0 - t * 0.35 + k * 9.0);
    // Los rayos más brillantes también llegan más alto.
    float alto = (0.09 + 0.10 * rayos + 0.06 * ruido1(x * 2.0 + t * 0.05 + k)) * (1.0 + 0.9 * oleada) * crecida;
    float perfil = dy < 0.0 ? exp(dy * 55.0) : exp(-dy / alto);
    // Los rayos mandan también en el borde: si no, la base de la cortina es una barra horizontal.
    float estrias = 0.1 + 0.9 * pow(smoothstep(0.2, 0.95, rayos), 1.5) * (0.7 + 0.3 * finos);
    perfil *= estrias;

    float ondas = 0.55 + 0.45 * sin(x * 5.0 - t * (0.55 + 0.9 * oleada) + k * 1.3);
    // Donde la cortina se dobla se ve de canto y brilla más.
    float pliegue = 1.0 + 1.1 * smoothstep(0.4, 1.6, abs(pendiente));
    float fuerza = perfil * ondas * pliegue * tramo * (0.38 - 0.10 * k);

    vec3 borde = mix(vec3(0.78, 1.00, 0.62), vec3(1.00, 0.86, 0.50), oleada);
    vec3 cuerpo = mix(vec3(0.20, 0.92, 0.55), vec3(0.34, 1.00, 0.60), oleada);
    vec3 cima = vec3(0.30, 0.22, 0.70);
    vec3 c = mix(borde, cuerpo, smoothstep(0.0, 0.04, dy));
    c = mix(c, cima, smoothstep(0.10, 0.38, dy));
    suma += c * fuerza;
  }
  suma *= smoothstep(horizonte + 0.01, horizonte + 0.12, w.y);
  return suma * intensidad * crece(riqueza, 0.55, 1.35);
}
