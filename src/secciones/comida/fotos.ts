// Las fotos de la comida (spec/nutricion.md, «La foto de la comida»; D10): opcionales, no se
// analizan y quedan solo en el teléfono, en la carpeta de documentos de Moss, que entra en la copia de
// iCloud del iPhone. No se suben a la cuenta. Cada una con su comida (o sin anotar) en `fotos.json`,
// al lado. En la web de prueba, en localStorage.

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { anotada, deLaVersionAnterior, desanotada, leerFotos, type FotoDeComida } from '@/dominio/fotos';

const enLaWeb = Platform.OS === 'web';
const CLAVE_WEB = 'moss:fotos';
const INDICE = 'fotos.json';
/** Lo que espera el archivo de una foto borrada: más que el aviso con «Deshacer» (10 s con VoiceOver). */
const BORRAR_EN_MS = 15000;

const carpeta = () => new Directory(Paths.document, 'fotos');

let fotos: FotoDeComida[] | null = null;
const oyentes = new Set<() => void>();

function delTelefono(): FotoDeComida[] {
  const d = carpeta();
  if (!d.exists) return [];
  const indice = new File(d, INDICE);
  const archivos = d.list().filter((x): x is File => x instanceof File && x.name !== INDICE);
  const guardadas = indice.exists ? leerFotos(indice.textSync()) : null;
  if (guardadas) {
    // Lo de una foto borrada cuando Moss se cerró antes de que venciera el deshacer.
    const usados = new Set(guardadas.map((f) => f.archivo));
    for (const a of archivos) if (!usados.has(a.name)) a.delete();
    return guardadas;
  }
  // Sin índice: las de antes, una por comida, pasan a ser la foto de toda su comida.
  const anteriores = archivos.flatMap((a) => {
    const f = deLaVersionAnterior(a.name, 0);
    return f ? [{ ...f, minutos: f.comida && f.comida !== 'snack' ? HORA_TIPICA[f.comida] : 11 * 60 }] : [];
  });
  guardar(anteriores);
  return anteriores;
}

function cargar(): FotoDeComida[] {
  if (fotos) return fotos;
  try {
    fotos = enLaWeb ? (leerFotos(localStorage.getItem(CLAVE_WEB)) ?? []) : delTelefono();
  } catch {
    fotos = [];
  }
  return fotos;
}

function guardar(lista: FotoDeComida[]) {
  try {
    if (enLaWeb) {
      localStorage.setItem(CLAVE_WEB, JSON.stringify(lista));
      return;
    }
    const d = carpeta();
    if (!d.exists) d.create({ intermediates: true });
    const indice = new File(d, INDICE);
    indice.create({ overwrite: true });
    indice.writeSync(JSON.stringify(lista));
  } catch (error) {
    console.warn('Moss no pudo guardar las fotos', error);
  }
}

function cambiar(lista: FotoDeComida[]) {
  fotos = lista;
  guardar(lista);
  oyentes.forEach((o) => o());
}

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

/** Todas las fotos de este teléfono. */
export function useFotos(): readonly FotoDeComida[] {
  return useSyncExternalStore(suscribir, cargar);
}

export const fotoPorId = (id: string) => cargar().find((f) => f.id === id) ?? null;

/** Cómo mostrarla. Cada foto nueva tiene su archivo: la imagen guardada en memoria nunca es la de otra. */
export const uriDe = (f: FotoDeComida) => (enLaWeb ? f.archivo : new File(carpeta(), f.archivo).uri);

const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** La pasa a la carpeta de las fotos y devuelve su nombre; en la web, la imagen misma. */
async function copiar(uri: string, id: string): Promise<string> {
  if (enLaWeb) return uri;
  const d = carpeta();
  if (!d.exists) d.create({ intermediates: true });
  const nombre = `${id}.jpg`;
  await new File(uri).copy(new File(d, nombre));
  return nombre;
}

function borrarArchivo(archivo: string) {
  if (enLaWeb) return;
  try {
    const f = new File(carpeta(), archivo);
    if (f.exists) f.delete();
  } catch {
    // Si no estaba, no hay nada que borrar.
  }
}

/** Guarda la que se sacó o se eligió. */
export async function guardarFoto(uri: string, datos: Omit<FotoDeComida, 'id' | 'archivo'>): Promise<FotoDeComida> {
  const id = nuevoId();
  const f: FotoDeComida = { ...datos, id, archivo: await copiar(uri, id) };
  cambiar([...cargar(), f]);
  return f;
}

/** «Sacar otra»: la nueva queda en su lugar, con lo que tenía anotado. */
export async function reemplazarFoto(id: string, uri: string): Promise<void> {
  const archivo = await copiar(uri, nuevoId());
  const antes = fotoPorId(id);
  if (!antes) return;
  cambiar(cargar().map((f) => (f.id === id ? { ...f, archivo } : f)));
  borrarArchivo(antes.archivo);
}

export function anotarFoto(id: string, comida: Comida, registros: string[]) {
  cambiar(cargar().map((f) => (f.id === id ? anotada(f, comida, registros) : f)));
}

export function desanotarFoto(id: string) {
  cambiar(cargar().map((f) => (f.id === id ? desanotada(f) : f)));
}

/** Se borra la foto, nunca lo anotado. Devuelve cómo deshacerlo: el archivo se va al vencer el deshacer. */
export function quitarFoto(id: string): () => void {
  const f = fotoPorId(id);
  if (!f) return () => {};
  cambiar(cargar().filter((x) => x.id !== id));
  const espera = setTimeout(() => borrarArchivo(f.archivo), BORRAR_EN_MS);
  return () => {
    clearTimeout(espera);
    if (!fotoPorId(f.id)) cambiar([...cargar(), f]);
  };
}

/** El selector del sistema: no pide permiso y le da a Moss solo la foto que se elige. */
export async function elegirDeTusFotos(): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  return r.canceled ? null : (r.assets[0]?.uri ?? null);
}

/** Todas: al borrar los datos o la cuenta y al cerrar sesión, así ninguna aparece en otra cuenta. */
export function borrarFotos(): void {
  try {
    if (enLaWeb) localStorage.removeItem(CLAVE_WEB);
    else {
      const d = carpeta();
      if (d.exists) d.delete();
    }
  } catch (error) {
    console.warn('Moss no pudo borrar las fotos', error);
  }
  fotos = [];
  oyentes.forEach((o) => o());
}
