// En la web, Skia recién está cuando carga el cielo: el anillo va con una vista (solo la pista). La
// web solo sirve para probar sin iPhone; el anillo de verdad es el de Anillo.tsx.

import { View } from 'react-native';

import { C } from './colores';

export function Anillo({ valor, tam = 92 }: { valor: number | null; tam?: number }) {
  const r = (42 / 100) * tam;
  return (
    <View
      style={{
        position: 'absolute', left: tam / 2 - r, top: tam / 2 - r, width: 2 * r, height: 2 * r, borderRadius: r,
        borderWidth: valor === null ? 2 : 3, borderStyle: valor === null ? 'dotted' : 'solid', borderColor: valor === null ? C.apagado : C.claro,
      }}
    />
  );
}
