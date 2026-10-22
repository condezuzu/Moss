export const colores = {
  noche0: '#03050c',
  noche1: '#070d1f',
  noche2: '#0d1a38',
  noche3: '#16295a',
  oro: '#e8c46a',
  oroClaro: '#f6e3a6',
  oroProfundo: '#b8892f',
  musgo: '#7fae6a',
  musgoLuz: '#b9e36b',
  musgoProfundo: '#2f4a2a',
  pergamino: '#efe6cf',
  pergaminoTenue: 'rgba(239,230,207,0.62)',
  pergaminoApagado: 'rgba(239,230,207,0.42)',
  // Los de la comida, como en la galería: cada macro con su color y la luz de las cifras grandes.
  salvia: '#a6bf94',
  grasas: '#a9c4f5',
  cifra: '#fbf2d9',
  hoja: '#0c1329',
  ventana: '#10183a',
  tinta: '#1a1406',
} as const;

/** Las letras: Jost para el texto, Outfit para los números y los títulos de la comida. */
export const letras = {
  texto: 'Jost_400Regular',
  textoLiviano: 'Jost_300Light',
  textoMedio: 'Jost_500Medium',
  numero: 'Outfit_400Regular',
  numeroLiviano: 'Outfit_300Light',
  numeroMedio: 'Outfit_500Medium',
} as const;

export type Color = keyof typeof colores;
