// El micrófono de «Decir lo que comí» (lo pediste el 27/11/2026): encendido desde que se pide, sin un
// instante apagado antes de prenderse, y de vuelta apagado si no arranca. El reconocimiento de voz de
// iOS, de mentira: cada evento se dispara a mano.

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot, type Root } from 'test-renderer';

import { contextoDelDictado, useDictado } from './dictado';

type Oyente = (ev?: unknown) => void;
const mockOyentes: Record<string, Oyente> = {};
const mockModulo = {
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  getSupportedLocales: jest.fn(async () => ({ locales: ['es-419', 'en-US'] })),
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
};
// Con un getter: jest.mock sube arriba de todo, antes de que exista mockModulo.
jest.mock('expo-speech-recognition', () => ({
  get ExpoSpeechRecognitionModule() { return mockModulo; },
  useSpeechRecognitionEvent: (nombre: string, oyente: Oyente) => { mockOyentes[nombre] = oyente; },
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));
jest.mock('./datos', () => ({ region: () => 'UY' }));

type Dictado = ReturnType<typeof useDictado>;
function Prueba({ alAbrir, ver }: { alAbrir?: boolean; ver: (d: Dictado) => void }) {
  ver(useDictado({ alTexto: () => {}, alTerminar, alAbrir }));
  return null;
}
const alTerminar = jest.fn();

/** Cada cuadro, con el micrófono encendido o apagado. */
let cuadros: boolean[] = [];
let d: Dictado;
let raiz: Root;
async function abrir(alAbrir?: boolean) {
  cuadros = [];
  raiz = createRoot();
  await act(async () => raiz.render(<Prueba alAbrir={alAbrir} ver={(x) => { d = x; cuadros.push(x.escuchando); }} />));
}
/** Lo que iOS tarda: el permiso y los idiomas. */
const esperarAIos = () => act(async () => {});

beforeEach(() => {
  jest.clearAllMocks();
  mockModulo.getPermissionsAsync.mockImplementation(async () => ({ granted: true, canAskAgain: true }));
  mockModulo.requestPermissionsAsync.mockImplementation(async () => ({ granted: true, canAskAgain: true }));
});

describe('el micrófono no se ve apagado un instante antes de prenderse', () => {
  it('la pantalla que abre escuchando lo muestra encendido desde el primer cuadro', async () => {
    await abrir(true);
    expect(cuadros[0]).toBe(true);
    act(() => { void d.empezar([]); });
    await esperarAIos();
    expect(mockModulo.start).toHaveBeenCalledTimes(1);
    act(() => mockOyentes.start());
    expect(cuadros).not.toContain(false);
    act(() => mockOyentes.end());
    expect(d.escuchando).toBe(false);
    expect(alTerminar).toHaveBeenCalledWith('');
  });

  it('al tocarlo, encendido en el mismo toque, mientras iOS arranca y escuchando', async () => {
    await abrir();
    expect(d.escuchando).toBe(false);
    act(() => { void d.empezar([]); });
    expect(d.escuchando).toBe(true);
    const desde = cuadros.length - 1;
    await esperarAIos();
    act(() => mockOyentes.start());
    expect(cuadros.slice(desde)).not.toContain(false);
  });

  it('sin permiso, vuelve a apagado con su mensaje', async () => {
    mockModulo.getPermissionsAsync.mockImplementation(async () => ({ granted: false, canAskAgain: true }));
    mockModulo.requestPermissionsAsync.mockImplementation(async () => ({ granted: false, canAskAgain: true }));
    await abrir(true);
    act(() => { void d.empezar([]); });
    await esperarAIos();
    expect([d.escuchando, d.error]).toEqual([false, 'permiso']);
    expect(mockModulo.start).not.toHaveBeenCalled();
  });

  it('con un error de iOS, apagado con su mensaje; sin hablar, apagado sin mensaje', async () => {
    await abrir(true);
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => mockOyentes.error({ error: 'no-speech' }));
    expect([d.escuchando, d.error]).toEqual([false, null]);
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => mockOyentes.error({ error: 'network' }));
    expect([d.escuchando, d.error]).toEqual([false, 'otro']);
  });

  it('parado mientras arranca, no se prende aunque iOS avise después que empezó', async () => {
    await abrir();
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => d.parar());
    expect(d.escuchando).toBe(false);
    act(() => mockOyentes.start());
    expect(d.escuchando).toBe(false);
    expect(mockModulo.abort).toHaveBeenCalledTimes(1);
  });

  it('cerrado mientras pide el permiso, no llega a escuchar', async () => {
    await abrir(true);
    act(() => { void d.empezar([]); });
    await act(async () => raiz.unmount());
    await esperarAIos();
    expect(mockModulo.start).not.toHaveBeenCalled();
  });

  it('parado mientras arranca, el «end» de iOS no vuelve a traer lo dicho la vez anterior', async () => {
    await abrir();
    // Una vez entera: se habla y termina.
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => mockOyentes.start());
    act(() => mockOyentes.result({ results: [{ transcript: 'dos huevos' }] }));
    act(() => mockOyentes.end());
    expect(alTerminar).toHaveBeenLastCalledWith('dos huevos');
    alTerminar.mockClear();
    // Se toca otra vez y se para mientras pide el permiso: iOS manda «end» sin haber empezado.
    act(() => { void d.empezar([]); });
    act(() => d.parar());
    act(() => mockOyentes.end());
    await esperarAIos();
    // También si el pedido ya había llegado a iOS.
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => d.parar());
    act(() => mockOyentes.end());
    expect(alTerminar).not.toHaveBeenCalled();
    // La vez siguiente empieza de cero.
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => mockOyentes.start());
    act(() => mockOyentes.end());
    expect(alTerminar).toHaveBeenLastCalledWith('');
  });

  it('un «end» viejo que llega después de volver a tocar no apaga el pedido nuevo, y al cerrar se corta', async () => {
    await abrir();
    // Se toca, el pedido llega a iOS y se para antes de que empiece.
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => d.parar());
    // Se vuelve a tocar: el pedido nuevo también llega a iOS.
    act(() => { void d.empezar([]); });
    await esperarAIos();
    expect(mockModulo.start).toHaveBeenCalledTimes(2);
    // Recién ahora llega el «end» del primero: el segundo sigue encendido, sin terminar nada.
    act(() => mockOyentes.end());
    expect(d.escuchando).toBe(true);
    expect(alTerminar).not.toHaveBeenCalled();
    // Y al cerrar, se corta lo que quedó en iOS.
    await act(async () => raiz.unmount());
    expect(mockModulo.abort).toHaveBeenCalled();
  });

  it('parado mientras escucha, llega lo dicho', async () => {
    await abrir();
    act(() => { void d.empezar([]); });
    await esperarAIos();
    act(() => mockOyentes.start());
    act(() => mockOyentes.result({ results: [{ transcript: 'una banana' }] }));
    act(() => d.parar());
    expect(mockModulo.stop).toHaveBeenCalled();
    act(() => mockOyentes.end());
    expect([d.escuchando, alTerminar.mock.calls.at(-1)]).toEqual([false, ['una banana']]);
  });
});

describe('las palabras que ayudan a reconocer los nombres', () => {
  it('lo que suele comer y lo guardado, intercalados y sin repetir: con mucho guardado, lo de todos los días sigue entrando', () => {
    const suele = Array.from({ length: 60 }, (_, i) => `comida ${i}`);
    const guardado = Array.from({ length: 150 }, (_, i) => `guardado ${i}`);
    const contexto = contextoDelDictado(suele, guardado);
    expect(contexto).toHaveLength(100);
    expect(contexto.slice(0, 4)).toEqual(['comida 0', 'guardado 0', 'comida 1', 'guardado 1']);
    expect(contexto).toContain('comida 49');
    expect(contextoDelDictado(['Café', 'Pan'], ['café', 'Mi batido'])).toEqual(['Café', 'Pan', 'Mi batido']);
  });
});
