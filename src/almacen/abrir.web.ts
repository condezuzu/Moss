// La web solo sirve para probar el cielo sin un iPhone: guarda todo junto en localStorage.
// (SQLite en la web pide encabezados COOP/COEP y un wasm propio, y no hace falta para probar).

import { repositorioEnMemoria, type Memoria } from './repositorio';

const CLAVE = 'moss:datos';

export async function abrirRepositorio() {
  let inicial: Partial<Memoria> = {};
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto) inicial = JSON.parse(texto) as Partial<Memoria>;
  } catch {
    // Sin localStorage (navegación privada, por ejemplo) se empieza de cero en cada carga.
  }
  return repositorioEnMemoria(inicial, (m) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(m));
    } catch {
      // Ídem.
    }
  });
}
