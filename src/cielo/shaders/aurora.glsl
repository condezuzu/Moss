// Las auroras: cortinas con el borde de abajo nítido y rayos que se desvanecen hacia arriba,
// como las de verdad. Se calcula en cada cuadro pero a resolución reducida (son suaves).
// `oleada` va de 0 a 1 cuando se completa el día: las cortinas suben, se aceleran y el borde
// se vuelve dorado, como una subtormenta real.
// Necesita comun.glsl antes.

float alturaCortina(float x, float t, float k, float base, float amp) {
  return base + amp * (
      0.55 * sin(x * 1.7 + t * 0.11 + k * 2.1)
    + 0.30 * sin(x * 3.9 - t * 0.17 + k * 4.3)
    + 0.12 * sin(x * 9.0 + t * 0.35 + k)
    + 0.80 * (ruido(vec2(x * 1.3 + t * 0.045, k * 7.7)) - 0.5));
}

vec3 colorAurora(vec2 w, float t, float horizonte, float intensidad, float oleada, float cortinas) {
  vec3 suma = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    if (k >= cortinas) {
      break;
    }
    float x = w.x * (1.0 + 0.22 * k) + k * 3.7;
    float base = horizonte + 0.15 + 0.075 * k + 0.04 * oleada;
    float amp = 0.045 + 0.02 * k + 0.035 * oleada;
    float h = alturaCortina(x, t, k, base, amp);
    float e = 0.004;
    float pendiente = (alturaCortina(x + e, t, k, base, amp) - alturaCortina(x - e, t, k, base, amp)) / (2.0 * e);
    float dy = w.y - h;

    // Una cortina no ocupa todo el cielo: aparece en tramos, con huecos oscuros entre medio.
    float tramo = smoothstep(0.14, 0.62, ruido(vec2(x * 0.9 + t * 0.018, k * 3.3 + 1.0)));
    tramo = mix(tramo, 1.0, 0.55 * oleada);

    float rayos = ruido(vec2(x * 42.0, t * 0.22 + k * 5.0));
    float finos = ruido(vec2(x * 110.0, t * 0.35 + k * 9.0));
    // Los rayos más brillantes también llegan más alto.
    float alto = (0.09 + 0.10 * rayos + 0.06 * ruido(vec2(x * 2.0, t * 0.05 + k))) * (1.0 + 0.9 * oleada);
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
  return suma * intensidad;
}
