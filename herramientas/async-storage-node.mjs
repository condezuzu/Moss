// Lo de AsyncStorage que usa la app, en la memoria de Node: así lo que guarda en el teléfono (el
// catálogo del servidor, por ejemplo) se prueba fuera del teléfono (lo usa verificar-supabase.mjs).

const guardado = new Map();

export default {
  async getItem(clave) {
    return guardado.has(clave) ? guardado.get(clave) : null;
  },
  async setItem(clave, valor) {
    guardado.set(clave, String(valor));
  },
  async removeItem(clave) {
    guardado.delete(clave);
  },
};
