// Lo que cambia y no se ve sin mirar (un aviso, un valor nuevo, una señal que llegó) se le dice a
// VoiceOver. `accessibilityLiveRegion` es solo de Android: en iOS hay que anunciarlo.

import { AccessibilityInfo, Platform } from 'react-native';

let conLectorDePantalla = false;
if (Platform.OS !== 'web') {
  AccessibilityInfo.isScreenReaderEnabled().then((v) => {
    conLectorDePantalla = v;
  });
  AccessibilityInfo.addEventListener('screenReaderChanged', (v) => {
    conLectorDePantalla = v;
  });
}

/** Si VoiceOver está prendido: los avisos con «Deshacer» esperan a que se llegue a tocarlo. */
export const conLector = () => conLectorDePantalla;

/** Dice el texto con VoiceOver, después de lo que esté diciendo. */
export function anunciar(texto: string) {
  if (!conLectorDePantalla || !texto) return;
  AccessibilityInfo.announceForAccessibilityWithOptions(texto, { queue: true });
}
