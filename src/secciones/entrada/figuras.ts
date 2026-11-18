// Las figuras de la grasa (aprobadas en la galería 52, el 18/11/2026): de frente, de la cabeza a las rodillas, sin
// rasgos, como las guías de grasa corporal. Cada rango tiene sus medidas, no una recta: con poca grasa, hombros
// anchos, cintura chica y el abdomen y el pecho marcados; en el medio el contorno se suaviza y el abdomen deja de
// verse; con más, la panza que sale (con su pliegue), el pecho, la cara, los brazos y los costados. En las mujeres,
// la cadera, los muslos y los brazos. Puro: arma los caminos SVG que dibujan la app (LienzosSkia.tsx) y la galería
// (galeria/src/entrada.js), en un lienzo de 60 × 96.

type Sexo = 'f' | 'm';
type Punto = readonly [number, number];
export type Trazo = { d: string; opacidad: number };
export type Elipse = { cx: number; cy: number; rx: number; ry: number };
/**
 * Los brazos van detrás del cuerpo; la ropa, las líneas y el ombligo, recortados al contorno; la cabeza encima, con
 * la papada (si hay) sin recortar.
 */
export type DibujoDeFigura = { brazos: string; contorno: string; ropa: string[]; lineas: Trazo[]; ombligo: Elipse; cabeza: Elipse; papada: Trazo | null };

export const LIENZO_DE_FIGURA = { ancho: 60, alto: 96 } as const;

// Medidas: medio ancho, nueve por rango.
const MEDIDAS = {
  m: {
    cabeza: [4.7, 4.75, 4.8, 4.9, 5.0, 5.2, 5.45, 5.7, 6.0],
    cuello: [2.9, 2.9, 2.95, 3.0, 3.15, 3.35, 3.6, 3.9, 4.2],
    hombro: [14.2, 14.0, 13.8, 13.7, 13.7, 13.9, 14.3, 14.8, 15.4],
    axila: [12.2, 12.0, 11.9, 11.9, 12.1, 12.6, 13.3, 14.1, 15.0],
    costillas: [10.0, 10.2, 10.5, 10.9, 11.5, 12.3, 13.3, 14.4, 15.6],
    cintura: [8.3, 8.9, 9.7, 10.7, 11.9, 13.2, 14.5, 15.9, 17.3],
    barriga: [8.8, 9.3, 10.1, 11.2, 12.6, 14.1, 15.6, 17.1, 18.6],
    cadera: [10.0, 10.2, 10.5, 11.0, 11.6, 12.4, 13.4, 14.5, 15.7],
    muslo: [9.8, 10.0, 10.3, 10.8, 11.4, 12.2, 13.1, 14.1, 15.2],
    muslo2: [8.4, 8.6, 8.9, 9.3, 9.8, 10.4, 11.1, 11.9, 12.8],
    rodilla: [4.7, 4.8, 4.9, 5.1, 5.3, 5.6, 6.0, 6.4, 6.9],
    rodillaAncho: [3.4, 3.45, 3.5, 3.6, 3.75, 3.95, 4.2, 4.5, 4.8],
    entreArriba: [1.5, 1.4, 1.3, 1.1, 0.9, 0.6, 0.35, 0.3, 0.3],
    entreMedio: [1.9, 1.8, 1.7, 1.5, 1.3, 1.0, 0.6, 0.35, 0.3],
    brazo: [3.2, 3.2, 3.2, 3.25, 3.4, 3.65, 3.95, 4.3, 4.7],
    deltoides: [0.9, 0.8, 0.6, 0.4, 0.2, 0.1, 0, 0, 0],
    antebrazo: [2.6, 2.6, 2.6, 2.65, 2.75, 2.9, 3.1, 3.35, 3.6],
  },
  f: {
    cabeza: [4.5, 4.55, 4.6, 4.7, 4.8, 4.95, 5.15, 5.4, 5.7],
    cuello: [2.4, 2.45, 2.5, 2.6, 2.7, 2.85, 3.05, 3.3, 3.6],
    hombro: [12.2, 12.1, 12.0, 12.0, 12.1, 12.3, 12.7, 13.2, 13.8],
    axila: [10.6, 10.7, 10.9, 11.1, 11.4, 11.9, 12.5, 13.2, 14.0],
    costillas: [8.6, 8.9, 9.3, 9.8, 10.4, 11.1, 11.9, 12.8, 13.8],
    cintura: [7.0, 7.5, 8.1, 8.8, 9.6, 10.6, 11.8, 13.1, 14.6],
    barriga: [8.2, 8.7, 9.3, 10.0, 10.9, 12.0, 13.3, 14.8, 16.4],
    cadera: [11.4, 12.0, 12.7, 13.4, 14.2, 15.1, 16.1, 17.2, 18.4],
    muslo: [10.6, 11.2, 11.9, 12.6, 13.4, 14.3, 15.3, 16.4, 17.6],
    muslo2: [8.6, 9.1, 9.7, 10.3, 11.0, 11.8, 12.7, 13.7, 14.8],
    rodilla: [4.6, 4.75, 4.9, 5.1, 5.35, 5.65, 6.0, 6.4, 6.9],
    rodillaAncho: [3.2, 3.3, 3.4, 3.55, 3.7, 3.9, 4.15, 4.45, 4.8],
    entreArriba: [1.2, 1.0, 0.8, 0.6, 0.4, 0.3, 0.3, 0.3, 0.3],
    entreMedio: [1.6, 1.4, 1.2, 0.9, 0.6, 0.35, 0.3, 0.3, 0.3],
    brazo: [2.6, 2.7, 2.85, 3.0, 3.2, 3.45, 3.75, 4.1, 4.5],
    deltoides: [0.4, 0.3, 0.2, 0.1, 0, 0, 0, 0, 0],
    antebrazo: [2.1, 2.15, 2.2, 2.3, 2.4, 2.55, 2.75, 2.95, 3.2],
  },
};
type Medida = keyof (typeof MEDIDAS)['m'];
// A qué altura va cada medida; en las mujeres, la cintura y la barriga un poco más arriba.
const ALTURAS = {
  m: { cabeza: 7, cuello: 13, trapecio: 15.6, hombro: 19.5, axila: 25, costillas: 33, cintura: 42, barriga: 48, cadera: 55, muslo: 63.5, muslo2: 76, rodilla: 91, pie: 95, entrepierna: 61.8, interior: 65 },
  f: { cabeza: 7, cuello: 13, trapecio: 15.6, hombro: 19.5, axila: 25, costillas: 33, cintura: 41, barriga: 47.5, cadera: 55, muslo: 63.5, muslo2: 76, rodilla: 91, pie: 95, entrepierna: 61.8, interior: 65 },
};
// Qué tan marcada va cada línea en cada rango (0, no se ve).
const LINEAS = {
  m: {
    pecho: [0.7, 0.58, 0.42, 0.26, 0.12, 0, 0, 0, 0],
    pechoCaido: [0, 0, 0, 0, 0, 0.26, 0.38, 0.48, 0.55],
    alba: [0.6, 0.46, 0.3, 0.16, 0.05, 0, 0, 0, 0],
    filas: [[0.6, 0.58, 0.5], [0.46, 0.42, 0.3], [0.24, 0.16, 0.05], [0.08, 0, 0]],
    semilunar: [0.5, 0.38, 0.2, 0.06, 0, 0, 0, 0, 0],
    v: [0.55, 0.42, 0.26, 0.12, 0, 0, 0, 0, 0],
    cuadriceps: [0.36, 0.26, 0.14, 0.05, 0, 0, 0, 0, 0],
    panza: [0, 0, 0, 0, 0.14, 0.3, 0.42, 0.5, 0.56],
    costado: [0, 0, 0, 0, 0.1, 0.24, 0.36, 0.46, 0.52],
    papada: [0, 0, 0, 0, 0, 0, 0.28, 0.4, 0.5],
    alforja: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  f: {
    pecho: [0.34, 0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    pechoCaido: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    alba: [0.38, 0.2, 0.07, 0, 0, 0, 0, 0, 0],
    filas: [[0.26, 0.2], [0.1, 0.05]],
    semilunar: [0.32, 0.18, 0.06, 0, 0, 0, 0, 0, 0],
    v: [0.36, 0.22, 0.1, 0, 0, 0, 0, 0, 0],
    cuadriceps: [0.22, 0.12, 0.04, 0, 0, 0, 0, 0, 0],
    panza: [0, 0, 0, 0.08, 0.18, 0.3, 0.42, 0.5, 0.56],
    costado: [0, 0, 0, 0, 0.08, 0.2, 0.32, 0.42, 0.5],
    papada: [0, 0, 0, 0, 0, 0, 0, 0.26, 0.4],
    alforja: [0, 0, 0, 0, 0.12, 0.22, 0.3, 0.36, 0.4],
  },
};

const f2 = (x: number) => x.toFixed(2);
const f = (p: Punto) => `${f2(p[0])} ${f2(p[1])}`;
/** Catmull-Rom cerrada: una curva suave que pasa por cada punto. */
function cerrada(pts: readonly Punto[]): string {
  const n = pts.length;
  let d = `M ${f(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f(p2)}`;
  }
  return d + ' Z';
}

/** La figura `k` (de 0, la de menos grasa, a 8) de cada sexo. */
export function dibujoDeFigura(sexo: Sexo, k: number): DibujoDeFigura {
  const M = Object.fromEntries(Object.entries(MEDIDAS[sexo]).map(([n, v]) => [n, v[k]])) as Record<Medida, number>;
  const Y = ALTURAS[sexo];
  const L = LINEAS[sexo];
  const c = LIENZO_DE_FIGURA.ancho / 2;
  // El cuerpo y las piernas en un solo contorno: por fuera de la cabeza a la rodilla, por dentro hasta la entrepierna.
  const lado: Punto[] = [[M.cuello, Y.cuello], [M.cuello + 0.55 * (M.hombro - M.cuello), Y.trapecio], [M.hombro, Y.hombro], [M.axila, Y.axila],
    [M.costillas, Y.costillas], [M.cintura, Y.cintura], [M.barriga, Y.barriga], [M.cadera, Y.cadera], [M.muslo, Y.muslo], [M.muslo2, Y.muslo2],
    [M.rodilla + M.rodillaAncho, Y.rodilla], [M.rodilla, Y.pie], [M.rodilla - M.rodillaAncho, Y.rodilla], [M.entreMedio, Y.muslo2], [M.entreArriba, Y.interior]];
  const contorno = cerrada([...lado.map(([x, y]): Punto => [c - x, y]), [c, Y.entrepierna], ...lado.map(([x, y]): Punto => [c + x, y]).reverse()]);
  // El medio ancho del cuerpo a una altura (para que los brazos no lo pisen).
  const tabla = lado.slice(2, 10);
  const anchoEn = (y: number) => {
    for (let i = 0; i < tabla.length - 1; i++) {
      const [x0, y0] = tabla[i], [x1, y1] = tabla[i + 1];
      if (y >= y0 && y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
    return 0;
  };
  const maximo = (desde: number, hasta: number) => {
    let m = 0;
    for (let y = desde; y <= hasta; y += 1) m = Math.max(m, anchoEn(y));
    return m;
  };
  // Los brazos cuelgan al costado y se abren con lo que hay debajo: la cintura, la panza y la cadera.
  const hombro: Punto = [M.hombro - 2.2, Y.hombro + 2.6];
  const codo: Punto = [Math.max(M.hombro - 0.3, maximo(Y.costillas, Y.barriga) + M.brazo * 0.85 + 0.9), Y.cintura + 1];
  const muneca: Punto = [Math.max(codo[0] - 0.4, maximo(Y.barriga, Y.muslo) + M.antebrazo + 0.9), Y.cadera + 3.5];
  const lerp = (a: Punto, b: Punto, t: number): Punto => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const largoMano = Math.hypot(muneca[0] - codo[0], muneca[1] - codo[1]);
  const dirMano: Punto = [(muneca[0] - codo[0]) / largoMano, (muneca[1] - codo[1]) / largoMano];
  const muestras: [Punto, number][] = [
    [hombro, M.brazo + M.deltoides], [lerp(hombro, codo, 0.3), M.brazo + M.deltoides * 0.6], [lerp(hombro, codo, 0.7), M.brazo * 0.95], [codo, M.brazo * 0.8],
    [lerp(codo, muneca, 0.3), M.antebrazo], [muneca, M.antebrazo * 0.72], [[muneca[0] + dirMano[0] * 5.5, muneca[1] + dirMano[1] * 5.5], M.antebrazo * 0.8],
  ];
  const bordes = muestras.map(([p, w], i) => {
    const a = muestras[Math.max(0, i - 1)][0], b = muestras[Math.min(muestras.length - 1, i + 1)][0];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n: Punto = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l];
    return { afuera: [p[0] + n[0] * w, p[1] + n[1] * w] as Punto, adentro: [p[0] - n[0] * w, p[1] - n[1] * w] as Punto };
  });
  const arriba: Punto = [hombro[0] - 0.3, hombro[1] - (M.brazo + M.deltoides) * 0.9];
  const fin = muestras[muestras.length - 1];
  const abajo: Punto = [fin[0][0] + dirMano[0] * fin[1] * 0.9, fin[0][1] + dirMano[1] * fin[1] * 0.9];
  const brazoEnMedio: Punto[] = [arriba, ...bordes.map((b) => b.afuera), abajo, ...bordes.map((b) => b.adentro).reverse()];
  // De la mitad (x hacia afuera) a cada lado del lienzo.
  const P = (s: number, x: number, y: number) => `${f2(c + s * x)} ${f2(y)}`;
  const ambos = (fn: (s: number) => string) => fn(-1) + ' ' + fn(1);
  const brazos = ambos((s) => cerrada(brazoEnMedio.map(([x, y]): Punto => [c + s * x, y])));
  const lineas: Trazo[] = [];
  const linea = (o: number, d: string) => {
    if (o > 0.01) lineas.push({ d, opacidad: o });
  };
  const m = sexo === 'm';
  if (m) {
    linea(L.pecho[k], ambos((s) => `M ${P(s, 0.6, 25.6)} C ${P(s, 4, 30.4)} ${P(s, 8.4, 30.6)} ${P(s, M.axila - 1, 27.2)}`));
    const caida = Math.max(0, k - 5) * 0.8;
    linea(L.pechoCaido[k], ambos((s) => `M ${P(s, 1, 28 + caida)} C ${P(s, 4.5, 33 + caida)} ${P(s, 9.5, 33 + caida)} ${P(s, M.axila - 0.5, 29 + caida * 0.6)}`));
  } else {
    // El pecho, debajo del top: la curva de abajo crece un poco con la grasa.
    const b = k * 0.25;
    linea(L.pecho[k], ambos((s) => `M ${P(s, 0.5, 27)} C ${P(s, 2.6, 31.6 + b)} ${P(s, 7.6, 31.8 + b)} ${P(s, M.axila - 0.6, 28)}`));
  }
  const filas = m ? [33.6, 37.6, 41.8] : [34.5, 38.5];
  linea(L.alba[k], `M ${c} 29.5 L ${c} ${m ? 46 : 44.5}`);
  (L.filas[k] ?? []).forEach((o, i) => {
    const y = filas[i];
    linea(o, ambos((s) => `M ${P(s, 0.5, y)} Q ${P(s, 2.8, y + 0.8)} ${P(s, m ? 5 : 4.2, y - 0.3)}`));
  });
  const sl = m ? 6.2 : 5.3;
  linea(L.semilunar[k], ambos((s) => `M ${P(s, sl, 31)} C ${P(s, sl + 0.7, 35.5)} ${P(s, sl + 0.5, 40.5)} ${P(s, sl - 0.6, 45)}`));
  linea(L.v[k], ambos((s) => `M ${P(s, m ? 7.8 : 6.8, 46.5)} C ${P(s, m ? 6.2 : 5.4, 50.5)} ${P(s, 3.8, 53.5)} ${P(s, 1.8, 56)}`));
  linea(L.cuadriceps[k], ambos((s) => `M ${P(s, M.muslo - 2.4, 66)} C ${P(s, M.muslo2 - 1.2, 74)} ${P(s, M.rodilla + 0.8, 82)} ${P(s, M.rodilla, 87)}`));
  linea(0.22, ambos((s) => `M ${P(s, M.rodilla - 1.6, 88.3)} Q ${P(s, M.rodilla, 89.6)} ${P(s, M.rodilla + 1.6, 88.3)}`));
  // La panza: la curva de abajo, más honda con más grasa; y el costado que se dobla sobre la cadera.
  const hondo = Y.barriga + 5 + Math.max(0, k - 4) * 0.7;
  linea(L.panza[k], `M ${P(-1, M.barriga * 0.86, Y.barriga + 1.5)} Q ${P(1, 0, hondo + 2.4)} ${P(1, M.barriga * 0.86, Y.barriga + 1.5)}`);
  linea(L.costado[k], ambos((s) => `M ${P(s, M.cintura + 0.4, Y.cintura + 2.4)} q ${f2(-s * 2.4)} 1.2 ${f2(-s * 2.7)} 3.8`));
  linea(L.alforja[k], ambos((s) => `M ${P(s, M.muslo - 0.3, 60.5)} q ${f2(-s * 1.6)} 3 ${f2(-s * 0.6)} 6.5`));
  // El ombligo: un punto con poca grasa, una raya con mucha.
  const ombligo = { cx: c, cy: Y.barriga - 1 + Math.max(0, k - 4) * 0.4, rx: 0.5 + Math.max(0, k - 3) * 0.12, ry: Math.max(0.42, 0.85 - Math.max(0, k - 3) * 0.08) };
  // La ropa: la de abajo baja con la panza; las mujeres, con un top.
  const bajo = Y.cadera - 1.2 + Math.max(0, k - 4) * 0.7;
  const ropa = [`M ${c - 30} ${f2(bajo)} Q ${c} ${f2(bajo + 1.8)} ${c + 30} ${f2(bajo)} L ${c + 30} 62.5 Q ${c + 6} 63.5 ${c} 66.5 Q ${c - 6} 63.5 ${c - 30} 62.5 Z`];
  if (!m) {
    const t = 30 + k * 0.3;
    ropa.push(`M ${c - 30} 22.5 L ${c - 5.5} 22.5 Q ${c} 26.5 ${c + 5.5} 22.5 L ${c + 30} 22.5 L ${c + 30} ${f2(t)} Q ${c + 9} ${f2(t + 2.2)} ${c} ${f2(t + 0.6)} Q ${c - 9} ${f2(t + 2.2)} ${c - 30} ${f2(t)} Z`);
  }
  const altoCabeza = (m ? 5.7 : 5.5) + (M.cabeza - MEDIDAS[sexo].cabeza[0]) * 0.4;
  const cabeza = { cx: c, cy: Y.cabeza, rx: M.cabeza, ry: altoCabeza };
  const papada = L.papada[k] > 0
    ? { d: `M ${f2(c - M.cabeza * 0.55)} ${f2(Y.cabeza + altoCabeza * 0.78)} Q ${c} ${f2(Y.cabeza + altoCabeza * 1.08)} ${f2(c + M.cabeza * 0.55)} ${f2(Y.cabeza + altoCabeza * 0.78)}`, opacidad: L.papada[k] }
    : null;
  return { brazos, contorno, ropa, lineas, ombligo, cabeza, papada };
}
