// Decir la comida en voz alta: el reconocimiento de voz de Apple, sin costo, con
// expo-speech-recognition. Se pide en el teléfono (requiresOnDeviceRecognition), que iOS cumple cuando
// el idioma tiene su modelo ahí; si no, lo reconoce Apple. Moss no guarda el audio. Si el idioma no se
// reconoce, queda el micrófono del teclado, que hace lo mismo.

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { idioma, t } from '@/textos';
import { region } from './datos';

/** iOS pregunta por el micrófono una sola vez: si ya se dijo que no, la única salida es Ajustes. */
function ofrecerAjustes() {
  Alert.alert(t('comida.decir.titulo'), t('comida.decir.error.permiso'), [
    { text: t('comun.cancelar'), style: 'cancel' },
    { text: t('comida.escaner.abrirAjustes'), onPress: () => { Linking.openSettings().catch(() => {}); } },
  ]);
}

export type ErrorDelDictado = 'permiso' | 'idioma' | 'otro';

/** Sin la variante del país, la más parecida: para el Río de la Plata, la de América Latina. */
const PARECIDOS: Record<'es' | 'en', readonly string[]> = { es: ['es-419', 'es-US', 'es-MX', 'es-CL', 'es-CO', 'es-ES'], en: ['en-US', 'en-GB', 'en-AU', 'en-CA'] };

async function idiomaDelDictado(): Promise<string | null> {
  const lengua = idioma();
  const pais = region();
  const { locales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
  const exacta = pais ? `${lengua}-${pais}` : null;
  if (exacta && locales.includes(exacta)) return exacta;
  return PARECIDOS[lengua].find((x) => locales.includes(x)) ?? locales.find((x) => x.startsWith(`${lengua}-`)) ?? null;
}

/**
 * Si hay reconocimiento de voz: en el iPhone, sí; en la web de prueba, no. No con
 * isRecognitionAvailable, que mira el idioma del teléfono: «es-UY» no tiene reconocedor aunque
 * «es-419» sí. El idioma se elige al empezar (idiomaDelDictado) y, sin ninguno, se dice.
 */
export function hayDictado(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Escuchar: el texto llega mientras se habla (`alTexto`) y, al terminar, entero (`alTerminar`). Para
 * solo con un silencio, o con `parar`. Las palabras de `contexto` (lo que la persona suele comer)
 * ayudan a reconocer los nombres de acá.
 */
export function useDictado(op: { alTexto: (texto: string) => void; alTerminar: (texto: string) => void }) {
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<ErrorDelDictado | null>(null);
  const ultimo = useRef('');
  // Si se cierra mientras escucha, el micrófono se apaga: no queda escuchando de fondo.
  const activo = useRef(false);
  useEffect(() => {
    const vivo = activo;
    return () => {
      if (!vivo.current) return;
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ya había terminado.
      }
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    ultimo.current = '';
    activo.current = true;
    setEscuchando(true);
  });
  useSpeechRecognitionEvent('result', (ev) => {
    const texto = ev.results[0]?.transcript ?? '';
    ultimo.current = texto;
    op.alTexto(texto);
  });
  useSpeechRecognitionEvent('end', () => {
    activo.current = false;
    setEscuchando(false);
    op.alTerminar(ultimo.current);
  });
  useSpeechRecognitionEvent('error', (ev) => {
    activo.current = false;
    setEscuchando(false);
    // Sin hablar no es un error: solo no hay nada.
    if (ev.error === 'no-speech' || ev.error === 'aborted') return;
    setError(ev.error === 'not-allowed' ? 'permiso' : ev.error === 'language-not-supported' || ev.error === 'service-not-allowed' ? 'idioma' : 'otro');
  });

  const empezar = async (contexto: readonly string[]) => {
    setError(null);
    try {
      // Si recién se le dijo que no a la pregunta de iOS, alcanza con el texto del panel; si ya se había
      // dicho antes, iOS no vuelve a preguntar y se ofrece ir a Ajustes.
      const antes = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      const permiso = antes.granted ? antes : await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        if (!antes.canAskAgain) ofrecerAjustes();
        return setError('permiso');
      }
      const lang = await idiomaDelDictado();
      if (!lang) return setError('idioma');
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        // Solo en el teléfono: el audio no sale de ahí.
        requiresOnDeviceRecognition: true,
        addsPunctuation: true,
        contextualStrings: contexto.slice(0, 100),
        iosTaskHint: 'dictation',
      });
    } catch {
      setError('otro');
    }
  };
  const parar = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      setEscuchando(false);
    }
  };
  return { escuchando, error, empezar, parar };
}
