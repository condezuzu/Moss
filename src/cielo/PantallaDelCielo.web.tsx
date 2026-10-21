// La web sirve para probar el cielo nativo sin un iPhone (y, más adelante, para la galería).
// Skia en la web es CanvasKit: hay que cargarlo antes de importar cualquier cosa que lo use, por
// eso el cielo llega con un import dinámico. canvaskit.wasm lo copia npm run web:preparar.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/textos';
import { colores } from '@/tema';

export default function PantallaDelCielo() {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (archivo: string) => `/${archivo}` }}
      getComponent={() => import('./Cielo')}
      fallback={
        <View style={estilos.espera}>
          <Text style={estilos.texto}>{t('cielo.armandose')}</Text>
        </View>
      }
    />
  );
}

const estilos = StyleSheet.create({
  espera: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.noche0 },
  texto: { color: colores.pergaminoTenue },
});
