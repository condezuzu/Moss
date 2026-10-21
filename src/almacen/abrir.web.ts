// La web solo sirve para probar el cielo sin un iPhone: guarda todo junto en localStorage.
// (SQLite en la web pide encabezados COOP/COEP y un wasm propio, y no hace falta para probar).

import { guardadoVacio, repositorioEnMemoria, type Guardado } from './repositorio';

const CLAVE = 'moss:datos';

export async function abrirRepositorio() {
  let inicial: Guardado = guardadoVacio();
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto) inicial = JSON.parse(texto) as Guardado;
  } catch {
    // Sin localStorage (navegación privada, por ejemplo) se empieza de cero en cada carga.
  }
  return repositorioEnMemoria(inicial, (g) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(g));
    } catch {
      // Ídem.
    }
  });
}
