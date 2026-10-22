// En la web, Skia (CanvasKit) recién está cuando carga el cielo: la marca va con vistas. La web
// solo sirve para probar sin iPhone; la marca de verdad es la de MarcaDeAscent.tsx.

import { StyleSheet, View } from 'react-native';

export function MarcaDeAscent() {
  return (
    <View style={estilos.marca}>
      <View style={estilos.orbita} />
      <View style={estilos.planeta} />
      <View style={estilos.luna} />
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: { alignSelf: 'center', width: 124, height: 124, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  orbita: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1.3, borderStyle: 'dotted', borderColor: 'rgba(138, 147, 168, 0.6)' },
  planeta: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2b313e', borderWidth: 0.8, borderColor: 'rgba(232, 236, 246, 0.14)' },
  luna: { position: 'absolute', left: 62 + 51 - 5, top: 62 - 36 - 5, width: 10.4, height: 10.4, borderRadius: 5.2, backgroundColor: '#e6dfcf', opacity: 0.6 },
});
