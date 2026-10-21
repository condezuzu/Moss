// Dónde se guarda todo en el teléfono. La app usa SQLite (sqlite.ts); los tests y la web, la
// versión en memoria de acá abajo.

import type { Periodo } from '@/dominio/constelaciones';
import type { Dia, Marca } from '@/dominio/dias';
import type { ClaveDia } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { Logro } from '@/dominio/logros';

export type Guardado = {
  habitos: Habito[];
  periodos: Periodo[];
  dias: Dia[];
  marcas: Marca[];
  logros: Logro[];
  ajustes: Record<string, string>;
};

export interface Repositorio {
  /** Todo, salvo las marcas: de esas, solo las de `desde` en adelante (los días ya vividos están en `dias`). */
  cargar(desde: ClaveDia): Promise<Guardado>;
  /** La lista entera: son pocos y se reemplazan juntos. Lo mismo los períodos y los logros. */
  guardarHabitos(habitos: Habito[]): Promise<void>;
  guardarPeriodos(periodos: Periodo[]): Promise<void>;
  guardarMarca(marca: Marca): Promise<void>;
  guardarDia(dia: Dia): Promise<void>;
  guardarLogros(logros: Logro[]): Promise<void>;
  guardarAjuste(clave: string, valor: string): Promise<void>;
}

export const guardadoVacio = (): Guardado => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], ajustes: {} });

const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** En memoria. `alCambiar` recibe todo después de cada escritura (la web lo guarda en localStorage). */
export function repositorioEnMemoria(inicial: Guardado = guardadoVacio(), alCambiar?: (g: Guardado) => void): Repositorio {
  const g = copia(inicial);
  const listo = async () => alCambiar?.(copia(g));
  return {
    async cargar(desde) {
      return copia({ ...g, marcas: g.marcas.filter((m) => m.dia >= desde) });
    },
    async guardarHabitos(habitos) {
      g.habitos = copia(habitos);
      await listo();
    },
    async guardarPeriodos(periodos) {
      g.periodos = copia(periodos);
      await listo();
    },
    async guardarMarca(marca) {
      g.marcas = [...g.marcas.filter((m) => m.habito !== marca.habito || m.dia !== marca.dia), copia(marca)];
      await listo();
    },
    async guardarDia(dia) {
      g.dias = [...g.dias.filter((d) => d.clave !== dia.clave), copia(dia)];
      await listo();
    },
    async guardarLogros(logros) {
      g.logros = copia(logros);
      await listo();
    },
    async guardarAjuste(clave, valor) {
      g.ajustes = { ...g.ajustes, [clave]: valor };
      await listo();
    },
  };
}
