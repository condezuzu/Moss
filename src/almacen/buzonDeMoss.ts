// El buzón de la app (buzon.ts): lo que espera queda en AsyncStorage y sale por las dos funciones de
// Moss en Supabase, solo con sesión (supabase/moss/0006_alimentos.sql). Sin las variables de
// Supabase (la web de prueba), espera para siempre y no molesta.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { haySupabase, supabase } from '@/lib/supabase';
import { crearBuzon, type Buzon, type Carta, type Correo } from './buzon';

const CLAVE = 'moss:buzon';
let conSesion = false;

// Lo que no entra por la carta misma (un dato fuera de lo posible: errores 22 y 23 de Postgres) no
// tiene arreglo y se descarta; lo demás (sin conexión, la migración sin correr) se reintenta.
const sinArreglo = (codigo: string | undefined) => /^2[23]/.test(codigo ?? '');

const correo: Correo = {
  async enviar(c: Carta) {
    const { error } = c.tipo === 'busqueda'
      ? await supabase().rpc('anotar_busqueda_vacia', { buscado: c.texto, idioma_app: c.idioma, region_app: c.region })
      : await supabase().rpc('reportar_alimento', {
          de_la_base: c.alimento, de_barras: c.codigo, como_se_llama: c.nombre, que_esta_mal: c.motivo, nota_libre: c.nota, version_base: c.version,
        });
    if (error && !sinArreglo(error.code)) throw error;
  },
};

let elBuzon: Buzon | undefined;
export function buzon(): Buzon {
  elBuzon ??= crearBuzon(
    { leer: () => AsyncStorage.getItem(CLAVE), escribir: (texto) => AsyncStorage.setItem(CLAVE, texto) },
    () => (haySupabase() && conSesion ? correo : null),
  );
  return elBuzon;
}

/** Con sesión, sale lo que esperaba. */
export function avisarSesion(hay: boolean) {
  conSesion = hay;
  if (hay) buzon().enviar().catch(() => {});
}
