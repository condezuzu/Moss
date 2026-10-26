// Lo que lleva cada entrada de la línea de tiempo de los widgets. Lo arma la app (cielo.ts y
// noche.ts) y lo lee el widget, que corre aparte, en la extensión, sin `t()` ni el almacén: todo
// va ya traducido y calculado. Se guarda como lista de propiedades en el App Group: nunca `null`
// ni `undefined` (iOS no los guarda).

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
};

export type PropsNoche = {
  /** La noche: el día en que te despertás, como las noches de Salud. */
  clave: string;
  titulo: string;
  /** «23:40 → 07:10», o vacío si no hay qué mostrar. */
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
};
