// Lo de Perfil que sale del teléfono: exportar todo en CSV, y borrar los datos o la cuenta y cerrar
// sesión. Borrar y cerrar sesión dejan el teléfono como la primera vez (vuelve la entrada).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { File, Paths } from 'expo-file-system';
import { Platform, Share } from 'react-native';

import { elAlmacen, sinSincronizar, subirLoQueFalta } from '@/almacen';
import { buzon } from '@/almacen/buzonDeMoss';
import { csvDeMetas, csvDePesos, csvDeRegistros } from '@/dominio/exportar';
import { borrarMiSesion } from '@/lib/llavero';
import { haySupabase, supabase } from '@/lib/supabase';
import { t } from '@/textos';
import { borrarFotos } from '@/secciones/comida/fotos';
import { borrarEnElServidor } from './cuentaApple';
import { borrarFotoDePerfil } from './foto';

const columnas = () => ({
  dia: t('exportar.columnas.dia'), comida: t('exportar.columnas.comida'), momento: t('exportar.columnas.momento'), alimento: t('exportar.columnas.alimento'),
  fuente: t('exportar.columnas.fuente'), porcion: t('exportar.columnas.porcion'), veces: t('exportar.columnas.veces'), gramos: t('exportar.columnas.gramos'),
  kcal: t('exportar.columnas.kcal'), proteina: t('exportar.columnas.proteina'), carbohidratos: t('exportar.columnas.carbohidratos'), grasas: t('exportar.columnas.grasas'),
  fibra: t('exportar.columnas.fibra'), azucares: t('exportar.columnas.azucares'), saturadas: t('exportar.columnas.saturadas'), sodio: t('exportar.columnas.sodio'),
  alcohol: t('exportar.columnas.alcohol'), planificado: t('exportar.columnas.planificado'), fecha: t('exportar.columnas.fecha'), kg: t('exportar.columnas.kg'),
  origen: t('exportar.columnas.origen'), desde: t('exportar.columnas.desde'), gasto: t('exportar.columnas.gasto'), motivo: t('exportar.columnas.motivo'),
});

/**
 * Lo comido, el peso y las metas, cada uno en su CSV. En el iPhone se abren juntos en Vista Rápida,
 * que tiene el botón de compartir; si no se puede, se comparte lo comido.
 */
export async function exportarTodo(hoy: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const datos = await elAlmacen().paraExportar();
  const c = columnas();
  const archivos: [string, string][] = [
    [`${t('perfil.archivos.registros')} ${hoy}.csv`, csvDeRegistros(datos.registros, { columnas: c, comida: (x) => t(`comida.comidas.${x}`), si: t('exportar.si'), no: t('exportar.no') })],
    [`${t('perfil.archivos.pesos')} ${hoy}.csv`, csvDePesos(datos.pesos, c)],
    [`${t('perfil.archivos.metas')} ${hoy}.csv`, csvDeMetas(datos.metas, c)],
  ];
  const lista = archivos.map(([nombre, texto]) => {
    const f = new File(Paths.cache, nombre);
    f.create({ overwrite: true });
    f.writeSync(texto);
    return f;
  });
  if (await File.canPreview(lista).catch(() => false)) {
    await File.preview(lista);
    return;
  }
  await Share.share({ url: lista[0].uri });
}

/** El correo de la cuenta con sesión, o null (sin sesión o sin Supabase). */
export async function correoDeLaCuenta(): Promise<string | null> {
  if (!haySupabase()) return null;
  try {
    const { data } = await supabase().auth.getSession();
    return data.session?.user.email ?? (data.session ? '' : null);
  } catch {
    return null;
  }
}

/**
 * La sesión guardada, o null si no hay. undefined si hay una pero ahora no se puede confirmar (sin
 * conexión y vencida): entonces no se borra nada, porque la sesión sigue y volvería a sincronizar.
 */
async function laSesion(): Promise<Session | null | undefined> {
  const { data, error } = await supabase().auth.getSession();
  // Si la cuenta ya no la acepta, supabase-js la borró: no hay sesión.
  if (error) return isAuthRetryableFetchError(error) ? undefined : null;
  return data.session;
}

/** La lista de compras tachada (Plan.tsx). */
const COMPRADAS = 'moss:compradas';

/** Todo lo de la persona en el teléfono: el almacén (con tu nombre), las fotos de las comidas, tu foto, lo tachado y lo que esperaba en el buzón. */
async function borrarElTelefono() {
  await elAlmacen().olvidarTodo();
  borrarFotos();
  borrarFotoDePerfil();
  await AsyncStorage.removeItem(COMPRADAS).catch(() => {});
  await buzon().vaciar().catch(() => {});
}

/** «Borrar mis datos de Moss»: en la cuenta (la cuenta queda) y en el teléfono. */
export async function borrarMisDatos(): Promise<boolean> {
  return sinSincronizar(async () => {
    if (haySupabase()) {
      const sesion = await laSesion();
      if (sesion === undefined) return false;
      if (sesion) {
        const { error } = await supabase().rpc('borrar_mis_datos');
        if (error) return false;
      }
    }
    await borrarElTelefono();
    return true;
  });
}

/**
 * «Borrar la cuenta», con todo lo guardado en ella, en cualquier app donde se entre con ella. Si la
 * cuenta usa Apple, primero se confirma con Apple, así el servidor revoca la autorización antes de
 * borrar (cuentaApple.ts). Cancelar la hoja de Apple no borra nada y devuelve null: no es un error.
 */
export async function borrarLaCuenta(): Promise<boolean | null> {
  if (!haySupabase()) {
    await borrarElTelefono();
    return true;
  }
  const sesion = await laSesion();
  if (sesion === undefined) return false;
  return sinSincronizar(async () => {
    const borrada = await borrarEnElServidor(sesion?.user, {
      codigoDeApple: codigoNuevoDeApple,
      funcion: async (codigoDeApple) => {
        const { error, response } = await supabase().functions.invoke('moss-borrar-cuenta', { body: { codigoDeApple } });
        return error ? (response?.status ?? 0) : null;
      },
      // moss.borrar_cuenta(): solo mientras la función no esté desplegada (un 404).
      sinRevocar: async () => !(await supabase().rpc('borrar_cuenta')).error,
    });
    if (borrada !== true) return borrada;
    // La sesión que Ascent veía en el llavero compartido se va con la cuenta, aunque salir falle.
    await borrarMiSesion();
    await supabase().auth.signOut().catch(() => {});
    await borrarElTelefono();
    return true;
  });
}

/** Un código de autorización nuevo de Apple, o null si la persona cierra la hoja o falla. */
async function codigoNuevoDeApple(): Promise<string | null> {
  try {
    // Sin pedir el nombre ni el correo: alcanza con que confirme que es la persona.
    const credencial = await AppleAuthentication.signInAsync();
    return credencial.authorizationCode;
  } catch {
    return null;
  }
}

/**
 * Cómo terminó cerrar sesión: `sinSubir`, que lo último no llegó a la cuenta (sin conexión) y no se
 * tocó nada: se puede cerrar igual, perdiéndolo; `sinConexion`, que la sesión no se puede cerrar ahora.
 */
export type AlCerrarSesion = 'listo' | 'sinSubir' | 'sinConexion';

/**
 * Cerrar sesión borra lo del teléfono: los datos quedan en la cuenta. Por eso antes sube lo que
 * falta, salvo que se elija perderlo.
 */
export async function cerrarSesion(aunqueSePierda = false): Promise<AlCerrarSesion> {
  if (!haySupabase()) {
    await borrarElTelefono();
    return 'listo';
  }
  if (!aunqueSePierda) {
    try {
      await subirLoQueFalta();
    } catch {
      return 'sinSubir';
    }
  }
  if ((await laSesion()) === undefined) return 'sinConexion';
  return sinSincronizar(async () => {
    // Solo esta sesión: Ascent y los otros teléfonos con la misma cuenta siguen adentro.
    await supabase().auth.signOut({ scope: 'local' }).catch(() => {});
    // Si la sesión quedó, no se borra nada: seguiría sincronizando el teléfono vacío.
    if ((await laSesion()) !== null) return 'sinConexion';
    await borrarElTelefono();
    return 'listo';
  });
}
