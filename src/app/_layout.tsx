import { CormorantGaramond_400Regular_Italic, CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { Jost_300Light, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { registrarTareaDeFondo } from '@/fondo/tarea';
import { RecibirAnclas } from '@/secciones/sueno/RecibirAnclas';
import { colores } from '@/tema';
import { useWidgets } from '@/widgets';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Un enlace (moss://compartido) abre encima de las secciones: al volver, están ahí.
export const unstable_settings = { initialRouteName: 'index' };

export default function Raiz() {
  // Las tipografías aprobadas en la galería: Cormorant Garamond y Jost, y Outfit para los números.
  const [cargadas, error] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_400Regular_Italic,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
  });

  useEffect(() => {
    if (cargadas || error) SplashScreen.hideAsync().catch(() => {});
  }, [cargadas, error]);

  // Los widgets aplican lo tocado en ellos y quedan al día; la tarea de fondo los refresca con Moss cerrada.
  useWidgets();
  useEffect(() => {
    registrarTareaDeFondo();
  }, []);

  if (!cargadas && !error) return null;

  return (
    <GestureHandlerRootView style={estilos.raiz}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RecibirAnclas />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.noche0 } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.noche0 },
});
