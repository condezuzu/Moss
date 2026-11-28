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

/** Cuántas palabras de contexto se le pasan a iOS. */
const CONTEXTO = 100;

/**
 * Las palabras que ayudan a reconocer los nombres: lo que la persona suele comer y lo que guardó, intercaladas y sin
 * repetir. Con muchas cosas guardadas, lo de todos los días sigue entrando en las que acepta iOS.
 */
export function contextoDelDictado(suele: readonly string[], guardado: readonly string[]): string[] {
  const vistas = new Set<string>();
  const lista: string[] = [];
  for (let i = 0; i < Math.max(suele.length, guardado.length) && lista.length < CONTEXTO; i++) {
    for (const nombre of [suele[i], guardado[i]]) {
      const clave = nombre?.trim().toLowerCase();
      if (!clave || vistas.has(clave) || lista.length >= CONTEXTO) continue;
      vistas.add(clave);
      lista.push(nombre);
    }
  }
  return lista;
}

/**
 * Escuchar: el texto llega mientras se habla (`alTexto`) y, al terminar, entero (`alTerminar`). Para
 * solo con un silencio, o con `parar`. Las palabras de `contexto` (lo que la persona suele comer)
 * ayudan a reconocer los nombres de acá. `escuchando` ya es verdadero mientras arranca (lo pediste el
 * 27/11/2026: el micrófono no se ve apagado un instante antes de prenderse); con `alAbrir`, desde el
 * primer cuadro, para la pantalla que abre escuchando. Si no arranca, vuelve a apagado con su `error`.
 */
export function useDictado(op: { alTexto: (texto: string) => void; alTerminar: (texto: string) => void; alAbrir?: boolean }) {
  const [escuchando, setEscuchando] = useState(false);
  // Desde que se pide hasta que iOS avisa que empezó: el permiso, el idioma y el audio tardan un momento.
  const [arrancando, setArrancando] = useState(!!op.alAbrir);
  const [error, setError] = useState<ErrorDelDictado | null>(null);
  const ultimo = useRef('');
  // Cada pedido de escuchar, con su número: parar o cerrar deja sin efecto al que todavía está arrancando.
  const pedido = useRef(0);
  // El último pedido que llegó a iOS y el que iOS empezó a escuchar. Los eventos de iOS no dicen de qué pedido son:
  // solo tocan el de ahora si es el que llegó (y empezó); un «end» viejo que llega tarde no lo apaga.
  const enviado = useRef(0);
  const empezado = useRef(0);
  // Hay algo mandado a iOS que no terminó: si se cierra, el micrófono se apaga y no queda escuchando de fondo.
  const vivo = useRef(false);
  useEffect(() => {
    const mandado = vivo;
    const elPedido = pedido;
    return () => {
      elPedido.current += 1;
      if (!mandado.current) return;
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ya había terminado.
      }
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    // De un pedido que se paró o se reemplazó mientras arrancaba: se corta.
    if (enviado.current !== pedido.current) {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ya había terminado.
      }
      return;
    }
    empezado.current = pedido.current;
    setArrancando(false);
    setEscuchando(true);
  });
  useSpeechRecognitionEvent('result', (ev) => {
    if (empezado.current !== pedido.current) return;
    const texto = ev.results[0]?.transcript ?? '';
    ultimo.current = texto;
    op.alTexto(texto);
  });
  useSpeechRecognitionEvent('end', () => {
    // De un pedido viejo, del que se paró mientras arrancaba o del stop() de iOS quieto: no toca el de ahora, y lo
    // de la vez anterior no vuelve.
    if (empezado.current !== pedido.current) return;
    empezado.current = 0;
    vivo.current = false;
    setArrancando(false);
    setEscuchando(false);
    op.alTerminar(ultimo.current);
  });
  useSpeechRecognitionEvent('error', (ev) => {
    // «Aborted» es de un abort de acá; y el error de un pedido viejo no apaga el de ahora.
    if (ev.error === 'aborted' || enviado.current !== pedido.current) return;
    vivo.current = false;
    setArrancando(false);
    setEscuchando(false);
    // Sin hablar no es un error: solo no hay nada.
    if (ev.error === 'no-speech') return;
    setError(ev.error === 'not-allowed' ? 'permiso' : ev.error === 'language-not-supported' || ev.error === 'service-not-allowed' ? 'idioma' : 'otro');
  });

  const empezar = async (contexto: readonly string[]) => {
    const mio = ++pedido.current;
    // Cada pedido empieza de cero.
    ultimo.current = '';
    /** No arrancó: vuelve a apagado, con su mensaje. Si ya se pidió otra cosa, no toca nada. */
    const dejar = (porQue: ErrorDelDictado) => {
      if (mio !== pedido.current) return;
      setArrancando(false);
      setError(porQue);
    };
    setError(null);
    setArrancando(true);
    try {
      // Si recién se le dijo que no a la pregunta de iOS, alcanza con el texto del panel; si ya se había
      // dicho antes, iOS no vuelve a preguntar y se ofrece ir a Ajustes.
      const antes = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      const permiso = antes.granted ? antes : await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permiso.granted) {
        if (!antes.canAskAgain) ofrecerAjustes();
        return dejar('permiso');
      }
      const lang = await idiomaDelDictado();
      if (!lang) return dejar('idioma');
      // Se tocó de nuevo, o se cerró, mientras arrancaba.
      if (mio !== pedido.current) return;
      // Desde acá hay algo que apagar si se cierra, aunque iOS todavía no haya avisado que empezó.
      vivo.current = true;
      enviado.current = mio;
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        // Solo en el teléfono: el audio no sale de ahí.
        requiresOnDeviceRecognition: true,
        addsPunctuation: true,
        contextualStrings: contexto.slice(0, CONTEXTO),
        iosTaskHint: 'dictation',
      });
    } catch {
      if (mio === pedido.current) vivo.current = false;
      dejar('otro');
    }
  };
  const parar = () => {
    // Mientras arranca, se deja sin efecto; si ya escucha, se para y llega lo dicho.
    if (empezado.current !== pedido.current) pedido.current += 1;
    setArrancando(false);
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      setEscuchando(false);
    }
  };
  return { escuchando: escuchando || arrancando, error, empezar, parar };
}
