// Lo que lleva cada entrada de la línea de tiempo de los widgets. Lo arma la app (cielo.ts, noche.ts,
// hoy.ts, agua.ts y anotar.ts) y lo lee el widget, que corre aparte, en la extensión, sin `t()` ni el
// almacén: todo va ya traducido y calculado. Se guarda como lista de propiedades en el App Group: nunca
// `null` ni `undefined` (iOS no los guarda).

import type { Comida } from '@/dominio/comidas';

/** Un toque en un «hecho» del widget: el hábito, encendido o no, y cuándo (en milisegundos). */
export type ToqueDelWidget = { id: string; hecho: boolean; en: number };

export type HabitoDelWidget = { id: string; nombre: string; aMano: boolean; hecho: boolean };

export type PropsCielo = {
  /** El día de la entrada, «AAAA-MM-DD»: lo calcula la app, nunca el widget. */
  dia: string;
  /** El nombre de la constelación, que va chico. */
  nombre: string;
  /**
   * Las estrellas, de la más brillante a la más débil: x e y de 0 a 1 en una caja de proporción
   * ASPECTO (cielo.ts), y el tamaño por el brillo, de 0 a 1.
   */
  estrellas: number[][];
  lineas: number[][];
  /** Los hábitos del día, en el orden de sus estrellas: el hábito i va en la estrella i. */
  habitos: HabitoDelWidget[];
  /** Lo tocado en el widget que la app todavía no aplicó. */
  pendientes: ToqueDelWidget[];
  /** Lo tocado en días anteriores que la app no pudo aplicar todavía: no se dibuja, espera. */
  atrasados: (ToqueDelWidget & { dia: string })[];
  textos: { cuenta: string; solos: string; sinHabitos: string; hecho: string; sinHacer: string };
  url: string;
  /** Las imágenes del cielo en el App Group (fondos.ts), o vacío si todavía no están. */
  fondoNoche: string;
  fondoAurora: string;
};

export type PropsNoche = {
  /** La noche: el día en que te despertás, como las noches de Salud. */
  clave: string;
  titulo: string;
  /** «23:40 → 07:10», «23:15» a la hora de dormir, o vacío si no hay qué mostrar. */
  horas: string;
  /** Lo de abajo mientras no está confirmada, y lo de abajo después del «Sí». */
  nota: string;
  notaConfirmada: string;
  si: string;
  /** Si lleva el «Sí». */
  pregunta: boolean;
  /** Lo que muestra, en minutos desde las 18 del día anterior: con eso se compara al abrir Moss. */
  dormirse: number;
  despertar: number;
  /** Cuándo se tocó «Sí» en el widget (en milisegundos), o 0. */
  confirmada: number;
  /** Ya confirmada o corregida en Moss: lleva la marca y no pregunta. */
  hecha: boolean;
  url: string;
  /** La hora de dormir: «A dormir» en vez de «Anoche». */
  aDormir: boolean;
  /** Lo grande del chico y del redondo: «7 h 36» o «23:15». */
  cifra: string;
  /** «en 1 h 30», o «Ya es hora». */
  falta: string;
  /** «Sí, fue así», para el botón del chico. */
  siLargo: string;
  /** El cielo de fondo del chico (fondos.ts), o vacío. */
  fondo: string;
};

export type ValoresDelWidget = { kcal: number; p: number; c: number; g: number };

/** Una comida del día en el widget Hoy. */
export type ComidaDeHoy = {
  tipo: Comida;
  nombre: string;
  /** Lo anotado en esa comida; todo en 0, nada. */
  anotado: ValoresDelWidget;
  /** Lo anotado, o lo de siempre: «Café con leche, Tostada». */
  detalle: string;
  /** Lo que sumaría un toque (tu comida de siempre, o lo del plan de hoy); kcal en 0, nada. */
  siempre: ValoresDelWidget;
  /** Los alimentos de siempre, en JSON: si se toca, eso es lo que se anota. Vacío, lo del plan. */
  items: string;
  /** Anotado con un toque de este widget: los registros, separados por comas. Otro toque los saca. */
  deshacer: string;
};

/** Un toque en una comida: anotada o no, y cuándo (en milisegundos). */
export type ToqueDeComida = { comida: Comida; hecho: boolean; en: number };

export type PropsHoy = {
  dia: string;
  meta: ValoresDelWidget;
  /** Lo comido según Moss, sin lo tocado en el widget. */
  comido: ValoresDelWidget;
  comidas: ComidaDeHoy[];
  pendientes: ToqueDeComida[];
  textos: {
    teQuedan: string; deMas: string; kcal: string; de: string; anotado: string; sinAnotar: string; miles: string;
    macros: { p: string; c: string; g: string }; cortos: { p: string; c: string; g: string };
    buscar: string; decir: string; codigo: string;
  };
  /** Adónde lleva tocar: el widget chico, lo anotado, y una comida sin nada para sumar (con {comida}). */
  urls: { anotar: string; inicio: string; comida: string; anotarComida: string; buscar: string; decir: string; codigo: string };
  fondo: string;
};

export type PropsAnotar = {
  /** «Anotar la cena»: cambia con la hora. */
  titulo: string;
  /** «te quedan 1.025». */
  queda: string;
  acciones: { id: 'buscar' | 'decir' | 'codigo' | 'etiqueta'; nombre: string; url: string; icono: string }[];
  /** La de siempre del chico, si no se elige otra al editar el widget. */
  url: string;
  decirTitulo: string;
  fondo: string;
};

export type PropsAgua = {
  dia: string;
  /** Lo que tomó según Moss, en ml. */
  ml: number;
  meta: number;
  /** Lo tocado en el widget y la app todavía no aplicó: en vasos, puede ser negativo. */
  vasos: number;
  /** Cuándo fue el último toque (en milisegundos), o 0. */
  en: number;
  textos: { titulo: string; vasos: string; sumar: string; quitar: string; decimal: string };
  url: string;
  fondo: string;
};
