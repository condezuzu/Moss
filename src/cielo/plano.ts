// Todo lo que depende del tamaño de la pantalla y no cambia cuadro a cuadro: dónde cae cada
// estrella, las etiquetas, el universo y los caminos fijos de Skia. Se arma en el hilo de JS y la
// escena lo usa tal cual. Los caminos van en puntos de pantalla con la cámara en cero: cada capa
// los desplaza con su paralaje. El musgo va aparte (armarPlanoDelMusgo) porque crece con la
// riqueza del cielo, y la textura del cielo fijo también, porque depende de la calidad.

import { Skia, type SkPath } from '@shopify/react-native-skia';

import type { Texto } from '@/datos/catalogo';
import type { EstrellaDelUniverso } from './escena';
import type { DiaDeMentira } from './mentira';
import { encajar, mundoDelFondo, profundidades, proyectar, ZONA_UNIVERSO, type Punto } from './mundo';
import { armarMusgo, type Brote } from './musgo';

export type Lado = 'abajo' | 'der' | 'izq';

export type Plano = {
  ancho: number;
  alto: number;
  /** El rectángulo del mundo que cubre la textura del cielo fijo. */
  fondo: { min: Punto; tam: Punto };
  estrellas: Punto[];
  lineas: { a: number; b: number; prof: number }[];
  centro: Punto;
  etiquetas: { x: number; y: number; lado: Lado }[];
  autos: { indice: number; avance: number }[];
  fantasmas: SkPath;
  universo: {
    estrellas: EstrellaDelUniverso[];
    hechas: SkPath;
    pendientes: SkPath;
    hoy: SkPath;
    etiquetas: { x: number; y: number; dia: number; nombre: Texto; hoy: boolean }[];
    titulo: Punto;
  };
};

export type PlanoDelMusgo = {
  lomas: { cuerpo: SkPath; borde: SkPath; base: number; color: number[]; colorBorde: number[]; luz: number; paralaje: number }[];
  brotes: Brote[];
};

const HUECOS_DEL_UNIVERSO: Punto[] = [[-0.55, 0.3], [0.5, 0.24], [-0.06, 0.07], [-0.58, -0.12], [0.52, -0.1], [-0.24, -0.32], [0.42, -0.36]];

export function armarPlano(ancho: number, alto: number, dia: DiaDeMentira): Plano {
  const aspecto = ancho / alto;
  const aPantalla = ([x, y]: Punto): Punto => [ancho / 2 + x * alto, alto / 2 - y * alto];

  const c = dia.constelacion;
  const estrellas = encajar(proyectar(c.estrellas), [0, 0.075], aspecto * 0.68, 0.4);
  const prof = profundidades(estrellas.length, c.lineas);
  const lineas = c.lineas.map(([a, b]) => (prof[a] <= prof[b] ? { a, b, prof: prof[a] } : { a: b, b: a, prof: prof[b] }));
  const centro = estrellas.reduce<Punto>((s, p) => [s[0] + p[0] / estrellas.length, s[1] + p[1] / estrellas.length], [0, 0]);

  // Cada etiqueta va del lado de afuera de la constelación, para no taparle las líneas. Nunca
  // arriba: la estrella más alta quedaría pegada a la cabecera. Si de costado no entra, va abajo.
  let x0 = Infinity, x1 = -Infinity;
  estrellas.forEach(([x]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); });
  const anchoFigura = Math.max(x1 - x0, 1e-6);
  const etiquetas = estrellas.map((p, i) => {
    const [sx, sy] = aPantalla(p);
    const h = dia.habitos[i];
    const largo = Math.max(h.nombre.es.length, h.nombre.en.length);
    const anchoEtiqueta = 18 + 6.4 * largo;
    const dx = (p[0] - centro[0]) / anchoFigura;
    let lado: Lado = estrellas.length < 2 || Math.abs(dx) < 0.22 ? 'abajo' : dx > 0 ? 'der' : 'izq';
    if (lado === 'der' && sx + 22 + anchoEtiqueta > ancho - 8) lado = 'abajo';
    if (lado === 'izq' && sx - 22 - anchoEtiqueta < 8) lado = 'abajo';
    return { x: sx, y: sy, lado };
  });

  const constructorFantasmas = Skia.PathBuilder.Make();
  lineas.forEach(({ a, b }) => {
    const [ax, ay] = aPantalla(estrellas[a]);
    const [bx, by] = aPantalla(estrellas[b]);
    constructorFantasmas.moveTo(ax, ay).lineTo(bx, by);
  });
  const fantasmas = constructorFantasmas.detach();

  const A = aspecto / 2;
  const caminos = { hechas: Skia.PathBuilder.Make(), pendientes: Skia.PathBuilder.Make(), hoy: Skia.PathBuilder.Make() };
  const estrellasDelUniverso: EstrellaDelUniverso[] = [];
  const etiquetasDelUniverso: Plano['universo']['etiquetas'] = [];
  dia.semana.forEach((d, k) => {
    const hueco = HUECOS_DEL_UNIVERSO[k];
    const centroDia: Punto = [hueco[0] * A * 0.92, ZONA_UNIVERSO + hueco[1]];
    const pos = encajar(proyectar(d.constelacion.estrellas), centroDia, A * 0.62, 0.15);
    pos.forEach(([x, y], i) => estrellasDelUniverso.push({ x, y, encendida: i < d.hechos, habito: d.hoy ? i : -1 }));
    const camino = d.hoy ? caminos.hoy : d.hechos >= pos.length ? caminos.hechas : caminos.pendientes;
    d.constelacion.lineas.forEach(([a, b]) => {
      const [ax, ay] = aPantalla(pos[a]);
      const [bx, by] = aPantalla(pos[b]);
      camino.moveTo(ax, ay).lineTo(bx, by);
    });
    const bajo = pos.reduce((m, p) => Math.min(m, p[1]), Infinity);
    const [sx, sy] = aPantalla([centroDia[0], bajo]);
    etiquetasDelUniverso.push({ x: sx, y: sy + 14, dia: d.dia, nombre: { es: d.constelacion.nombres.es, en: d.constelacion.nombres.en }, hoy: d.hoy });
  });
  const universo: Plano['universo'] = {
    estrellas: estrellasDelUniverso,
    hechas: caminos.hechas.detach(),
    pendientes: caminos.pendientes.detach(),
    hoy: caminos.hoy.detach(),
    etiquetas: etiquetasDelUniverso,
    titulo: aPantalla([0, ZONA_UNIVERSO + 0.42]),
  };

  const autos = dia.habitos
    .map((h, indice) => ({ indice, avance: h.auto && h.meta ? Math.min(1, (h.valor ?? 0) / h.meta) : -1 }))
    .filter((a) => a.avance >= 0);

  return { ancho, alto, fondo: mundoDelFondo(aspecto), estrellas, lineas, centro, etiquetas, autos, fantasmas, universo };
}

/** El musgo en caminos de Skia, con la riqueza del cielo como crecimiento (0 a 1). */
export function armarPlanoDelMusgo(ancho: number, alto: number, crecimiento: number): PlanoDelMusgo {
  const aPantalla = ([x, y]: Punto): Punto => [ancho / 2 + x * alto, alto / 2 - y * alto];
  const { lomas: lomasMundo, brotes } = armarMusgo(ancho / alto, crecimiento, 1 / alto);
  const fondoMusgo = aPantalla([0, -0.85])[1];
  const lomas = lomasMundo.map((l) => {
    const borde = Skia.PathBuilder.Make();
    const cuerpo = Skia.PathBuilder.Make();
    l.borde.forEach((p, i) => {
      const [sx, sy] = aPantalla(p);
      if (i === 0) { borde.moveTo(sx, sy); cuerpo.moveTo(sx, sy); } else { borde.lineTo(sx, sy); cuerpo.lineTo(sx, sy); }
    });
    cuerpo.lineTo(aPantalla(l.borde[l.borde.length - 1])[0], fondoMusgo);
    cuerpo.lineTo(aPantalla(l.borde[0])[0], fondoMusgo);
    cuerpo.close();
    return { cuerpo: cuerpo.detach(), borde: borde.detach(), base: l.base, color: l.cuerpo, colorBorde: l.colorBorde, luz: l.luz, paralaje: l.paralaje };
  });
  return { lomas, brotes };
}
