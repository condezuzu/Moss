import datos from './constelaciones.json';

export type Texto = { es: string; en: string };

export type Estrella = {
  id: string;
  nombre: string;
  bayer: string;
  hr?: number;
  ra: number;
  dec: number;
  mag: number;
};

export type Constelacion = {
  id: string;
  iau: string;
  tipo: 'constelacion' | 'asterismo' | 'estrella';
  nombres: { la: string; es: string; en: string };
  /** De la más brillante a la más débil: el hábito i va en la estrella i. */
  estrellas: Estrella[];
  lineas: [number, number][];
  nota?: string;
};

// La forma del JSON la garantiza npm run catalogo:verificar; acá solo se le pone el tipo.
export const catalogo = datos.constelaciones as unknown as Constelacion[];

export function buscarConstelacion(id: string): Constelacion {
  const c = catalogo.find((x) => x.id === id);
  if (!c) throw new Error(`No hay ninguna constelación "${id}" en el catálogo`);
  return c;
}
