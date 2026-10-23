// Lo que Moss manda sin decir de quién (supabase/moss/0006_alimentos.sql): las búsquedas que no
// encontraron nada y los errores que se reportan en un alimento. Se guarda en el teléfono y sale
// cuando hay sesión y conexión, en orden; lo que falla por la red espera a la próxima. No lleva
// nada de la persona: ni la cuenta, ni la hora, ni el teléfono.

import type { ClaveDia } from '@/dominio/fechas';

export type Motivo = 'valores' | 'porcion' | 'nombre' | 'otro';
export const MOTIVOS: readonly Motivo[] = ['valores', 'porcion', 'nombre', 'otro'];

export type Carta =
  | { tipo: 'busqueda'; texto: string; idioma: 'es' | 'en'; region: string; dia: ClaveDia }
  | { tipo: 'reporte'; alimento: number | null; codigo: string | null; nombre: string; motivo: Motivo; nota: string | null; version: string };

/** Dónde queda lo que espera: un texto (AsyncStorage en la app). */
export interface Guardado {
  leer(): Promise<string | null>;
  escribir(texto: string): Promise<void>;
}

/** Cómo sale una carta. Tira un error si hay que reintentar; si no se pudo por la carta misma, vuelve igual: no tiene arreglo. */
export interface Correo {
  enviar(carta: Carta): Promise<void>;
}

// Lo que espera, y las búsquedas ya contadas de los últimos días: la misma búsqueda del mismo día
// cuenta una vez por teléfono.
type Contenido = { cartas: Carta[]; contadas: string[] };
const TOPE_DE_CARTAS = 200;
const TOPE_DE_CONTADAS = 300;

const claveDe = (c: Extract<Carta, { tipo: 'busqueda' }>) => `${c.dia}|${c.idioma}|${c.texto}`;

function leerContenido(texto: string | null): Contenido {
  try {
    const x = JSON.parse(texto ?? '') as Partial<Contenido>;
    return { cartas: Array.isArray(x.cartas) ? x.cartas : [], contadas: Array.isArray(x.contadas) ? x.contadas : [] };
  } catch {
    return { cartas: [], contadas: [] };
  }
}

/** Lo que se buscó, como se cuenta: en minúsculas, sin espacios de más; menos de dos letras no cuenta. */
export function textoDeBusqueda(texto: string): string | null {
  const limpio = texto.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 60);
  return limpio.length >= 2 ? limpio : null;
}

export function crearBuzon(guardado: Guardado, correo: () => Correo | null) {
  let contenido: Contenido | null = null;
  let enviando: Promise<void> | null = null;
  const cargar = async () => (contenido ??= leerContenido(await guardado.leer().catch(() => null)));
  const guardar = () => guardado.escribir(JSON.stringify(contenido)).catch(() => {});

  const buzon = {
    async echar(carta: Carta): Promise<void> {
      const c = await cargar();
      if (carta.tipo === 'busqueda') {
        const clave = claveDe(carta);
        if (c.contadas.includes(clave)) return;
        c.contadas.push(clave);
        if (c.contadas.length > TOPE_DE_CONTADAS) c.contadas.splice(0, c.contadas.length - TOPE_DE_CONTADAS);
      }
      c.cartas.push(carta);
      if (c.cartas.length > TOPE_DE_CARTAS) c.cartas.splice(0, c.cartas.length - TOPE_DE_CARTAS);
      await guardar();
      void buzon.enviar();
    },
    /** Manda lo que espera, en orden; al primer error de la red, para y queda para la próxima. */
    enviar(): Promise<void> {
      enviando ??= (async () => {
        const salida = correo();
        if (!salida) return;
        const c = await cargar();
        while (c.cartas.length) {
          try {
            await salida.enviar(c.cartas[0]);
          } catch {
            break;
          }
          c.cartas.shift();
          await guardar();
        }
      })().finally(() => {
        enviando = null;
      });
      return enviando;
    },
    async pendientes(): Promise<number> {
      return (await cargar()).cartas.length;
    },
  };
  return buzon;
}

export type Buzon = ReturnType<typeof crearBuzon>;
