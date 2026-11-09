// Lo escrito sin guardar no se pierde sin preguntar (lo pediste el 9/11/2026): cerrar una hoja con algo a
// medio escribir (bajarla con el dedo, tocar afuera o la cruz) hace la pregunta de iOS, como Notas o
// Calendario: «Descartar», en rojo, y «Seguir editando». Un aviso o un widget que llevan a otro lado
// cierran sin preguntar.

import { Alert, Platform } from 'react-native';

import { t } from '@/textos';

export function confirmarDescartar(alDescartar: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(t('comun.descartarTitulo'))) alDescartar();
    return;
  }
  Alert.alert(t('comun.descartarTitulo'), undefined, [
    { text: t('comun.seguirEditando'), style: 'cancel' },
    { text: t('comun.descartar'), style: 'destructive', onPress: alDescartar },
  ]);
}
