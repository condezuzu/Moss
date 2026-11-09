// El buzón de la app (buzon.ts): lo que espera queda en AsyncStorage y sale por las funciones de Moss
// en Supabase, solo con sesión (supabase/moss/0006_alimentos.sql y 0012_comunidad.sql). Sin las variables de
// Supabase (la web de prueba), espera para siempre y no molesta.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { haySupabase, supabase } from '@/lib/supabase';
import { crearBuzon, type Buzon, type Carta, type Correo } from './buzon';

const CLAVE = 'moss:buzon';
let conSesion = false;

// Lo que no entra por la carta misma (un dato fuera de lo posible: errores 22 y 23 de Postgres) no
// tiene arreglo y se descarta; lo demás (sin conexión, la migración sin correr) se reintenta.
const sinArreglo = (codigo: string | undefined) => /^2[23]/.test(codigo ?? '');

function rpcDe(c: Carta) {
  switch (c.tipo) {
    case 'busqueda':
      return supabase().rpc('anotar_busqueda_vacia', { buscado: c.texto, idioma_app: c.idioma, region_app: c.region });
    case 'reporte':
      return supabase().rpc('reportar_alimento', {
        de_la_base: c.alimento, de_barras: c.codigo, como_se_llama: c.nombre, que_esta_mal: c.motivo, nota_libre: c.nota, version_base: c.version,
      });
    case 'propuesta': {
      const p = c.propuesta;
      return supabase().rpc('proponer_alimento', {
        de_barras: p.codigo, como_se_llama: p.nombre, de_marca: p.marca, kcal_100: p.kcal, proteina_100: p.proteina, carbohidratos_100: p.carbohidratos,
        grasas_100: p.grasas, fibra_100: p.fibra, azucares_100: p.azucares, saturadas_100: p.saturadas, sodio_100: p.sodio,
        porcion_nombre: p.porcion, porcion_gramos: p.porcionGramos, region_app: p.region,
      });
    }
    case 'reporteComunidad':
      return supabase().rpc('reportar_de_la_comunidad', { del_catalogo: c.alimento, que_esta_mal: c.motivo, nota_libre: c.nota });
  }
}

const correo: Correo = {
  async enviar(c: Carta) {
    const { error } = await rpcDe(c);
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
