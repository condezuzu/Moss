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
} as const;

export type Color = keyof typeof colores;
