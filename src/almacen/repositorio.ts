// Dónde se guarda todo en el teléfono. La app usa SQLite (sqlite.ts); los tests y la web, la
// versión en memoria de acá abajo. Cada escritura lleva un número de cambio que solo crece: lo
// que tiene un número mayor que el último subido está pendiente de subir a Supabase. Lo que baja
// de la cuenta se guarda con el número 0: la cuenta ya lo tiene.

import type { Periodo } from '@/dominio/constelaciones';
import type { Peso } from '@/dominio/control';
import type { Dia, Marca } from '@/dominio/dias';
import type { ClaveDia } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { Logro } from '@/dominio/logros';
import type { MetaGuardada, Perfil } from '@/dominio/metas';

export type Guardado = {
  habitos: Habito[];
  periodos: Periodo[];
  dias: Dia[];
  marcas: Marca[];
  logros: Logro[];
  perfil: Perfil | null;
  metas: MetaGuardada[];
  pesos: Peso[];
  ajustes: Record<string, string>;
};

/** Un paquete de cambios: lo que falta subir, o lo que bajó de la cuenta y ganó. Los períodos van enteros o no van: se reemplazan juntos. */
export type Cambios = {
  habitos: Habito[];
  periodos: Periodo[] | null;
  marcas: Marca[];
  dias: Dia[];
  logros: Logro[];
  perfil: Perfil | null;
  metas: MetaGuardada[];
  pesos: Peso[];
  semilla: string | null;
};

/** Lo que falta subir, hasta el cambio `hasta`. */
export type Pendientes = Cambios & { hasta: number };

export const sinCambios = (c: Cambios) =>
  !c.habitos.length && !c.periodos && !c.marcas.length && !c.dias.length && !c.logros.length && !c.perfil && !c.metas.length && !c.pesos.length && !c.semilla;

export interface Repositorio {
  /** Todo, salvo las marcas: de esas, solo las de `desde` en adelante (los días ya vividos están en `dias`). */
  cargar(desde: ClaveDia): Promise<Guardado>;
  /** La lista entera: son pocos. Solo queda pendiente lo que cambió. */
  guardarHabitos(habitos: Habito[]): Promise<void>;
  guardarPeriodos(periodos: Periodo[]): Promise<void>;
  guardarMarca(marca: Marca): Promise<void>;
  guardarDia(dia: Dia): Promise<void>;
  /** Los logros nunca se borran: se suman los que no estaban. */
  guardarLogros(logros: Logro[]): Promise<void>;
  guardarPerfil(perfil: Perfil): Promise<void>;
  guardarMeta(meta: MetaGuardada): Promise<void>;
  guardarPeso(peso: Peso): Promise<void>;
  /** De los ajustes, solo la semilla sube a la cuenta. */
  guardarAjuste(clave: string, valor: string): Promise<void>;
  leerAjuste(clave: string): Promise<string | null>;
  /** Lo que bajó de la cuenta y ganó: reemplaza lo del teléfono y no queda pendiente. */
  guardarDeLaNube(cambios: Cambios): Promise<void>;
  pendientes(): Promise<Pendientes>;
  /** Ya subió todo lo que tenía un número de cambio hasta ese. */
  subidoHasta(cambio: number): Promise<void>;
}

export const guardadoVacio = (): Guardado => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], ajustes: {} });

/** Lo que guarda la versión en memoria: los datos, el número de cambio de cada cosa y hasta dónde subió. */
export type Memoria = Guardado & { cambios: Record<string, number>; secuencia: number; subido: number };

export const memoriaVacia = (): Memoria => ({ ...guardadoVacio(), cambios: {}, secuencia: 0, subido: 0 });

const copia = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const porFecha = <T>(clave: (x: T) => string) => (a: T, b: T) => (clave(a) < clave(b) ? -1 : 1);

/** La lista con los nuevos encima: reemplazan a los de la misma clave. */
function encima<T>(lista: T[], nuevos: T[], clave: (x: T) => string): T[] {
  const mapa = new Map(lista.map((x) => [clave(x), x]));
  for (const n of nuevos) mapa.set(clave(n), copia(n));
  return [...mapa.values()];
}

/** En memoria. `alCambiar` recibe todo después de cada escritura (la web lo guarda en localStorage). */
export function repositorioEnMemoria(inicial: Partial<Memoria> = {}, alCambiar?: (m: Memoria) => void): Repositorio {
  const m: Memoria = copia({ ...memoriaVacia(), ...inicial });
  const tocar = (clave: string) => {
    m.secuencia += 1;
    m.cambios[clave] = m.secuencia;
  };
  const pendiente = (clave: string) => (m.cambios[clave] ?? 0) > m.subido;
  const listo = async () => alCambiar?.(copia(m));

  return {
    async cargar(desde) {
      const { cambios: _c, secuencia: _s, subido: _u, ...datos } = m;
      return copia({ ...datos, marcas: m.marcas.filter((x) => x.dia >= desde) });
    },
    async guardarHabitos(habitos) {
      for (const h of habitos) if (!igual(m.habitos.find((x) => x.id === h.id), h)) tocar(`habitos|${h.id}`);
      m.habitos = copia(habitos);
      await listo();
    },
    async guardarPeriodos(periodos) {
      m.periodos = copia(periodos);
      tocar('periodos');
      await listo();
    },
    async guardarMarca(marca) {
      m.marcas = encima(m.marcas, [marca], (x) => `${x.habito}|${x.dia}`);
      tocar(`marcas|${marca.habito}|${marca.dia}`);
      await listo();
    },
    async guardarDia(dia) {
      m.dias = encima(m.dias, [dia], (d) => d.clave);
      tocar(`dias|${dia.clave}`);
      await listo();
    },
    async guardarLogros(logros) {
      for (const l of logros) {
        if (m.logros.some((x) => x.id === l.id)) continue;
        m.logros.push(copia(l));
        tocar(`logros|${l.id}`);
      }
      await listo();
    },
    async guardarPerfil(perfil) {
      m.perfil = copia(perfil);
      tocar('perfil');
      await listo();
    },
    async guardarMeta(meta) {
      m.metas = encima(m.metas, [meta], (x) => x.desde).sort(porFecha((x) => x.desde));
      tocar(`metas|${meta.desde}`);
      await listo();
    },
    async guardarPeso(peso) {
      m.pesos = encima(m.pesos, [peso], (x) => x.fecha).sort(porFecha((x) => x.fecha));
      tocar(`pesos|${peso.fecha}`);
      await listo();
    },
    async guardarAjuste(clave, valor) {
      m.ajustes = { ...m.ajustes, [clave]: valor };
      if (clave === 'semilla') tocar('semilla');
      await listo();
    },
    async leerAjuste(clave) {
      return m.ajustes[clave] ?? null;
    },
    async guardarDeLaNube(c) {
      const llego = (clave: string) => {
        m.cambios[clave] = 0;
      };
      m.habitos = encima(m.habitos, c.habitos, (h) => h.id);
      c.habitos.forEach((h) => llego(`habitos|${h.id}`));
      m.marcas = encima(m.marcas, c.marcas, (x) => `${x.habito}|${x.dia}`);
      c.marcas.forEach((x) => llego(`marcas|${x.habito}|${x.dia}`));
      m.dias = encima(m.dias, c.dias, (d) => d.clave);
      c.dias.forEach((d) => llego(`dias|${d.clave}`));
      m.logros = encima(m.logros, c.logros, (l) => l.id);
      c.logros.forEach((l) => llego(`logros|${l.id}`));
      m.metas = encima(m.metas, c.metas, (x) => x.desde).sort(porFecha((x) => x.desde));
      c.metas.forEach((x) => llego(`metas|${x.desde}`));
      m.pesos = encima(m.pesos, c.pesos, (x) => x.fecha).sort(porFecha((x) => x.fecha));
      c.pesos.forEach((x) => llego(`pesos|${x.fecha}`));
      if (c.periodos) {
        m.periodos = copia(c.periodos);
        llego('periodos');
      }
      if (c.perfil) {
        m.perfil = copia(c.perfil);
        llego('perfil');
      }
      if (c.semilla) {
        m.ajustes = { ...m.ajustes, semilla: c.semilla };
        llego('semilla');
      }
      await listo();
    },
    async pendientes() {
      return copia({
        hasta: m.secuencia,
        habitos: m.habitos.filter((h) => pendiente(`habitos|${h.id}`)),
        periodos: pendiente('periodos') ? m.periodos : null,
        marcas: m.marcas.filter((x) => pendiente(`marcas|${x.habito}|${x.dia}`)),
        dias: m.dias.filter((d) => pendiente(`dias|${d.clave}`)),
        logros: m.logros.filter((l) => pendiente(`logros|${l.id}`)),
        perfil: pendiente('perfil') ? m.perfil : null,
        metas: m.metas.filter((x) => pendiente(`metas|${x.desde}`)),
        pesos: m.pesos.filter((x) => pendiente(`pesos|${x.fecha}`)),
        semilla: pendiente('semilla') ? (m.ajustes.semilla ?? null) : null,
      });
    },
    async subidoHasta(cambio) {
      m.subido = Math.max(m.subido, cambio);
      await listo();
    },
  };
}
