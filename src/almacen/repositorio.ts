// Dónde se guarda todo en el teléfono. La app usa SQLite (sqlite.ts); los tests y la web, la
// versión en memoria de acá abajo. Cada escritura lleva un número de cambio que solo crece: lo
// que tiene un número mayor que el último subido está pendiente de subir a Supabase. Lo que baja
// de la cuenta se guarda con el número 0: la cuenta ya lo tiene.

import type { Periodo } from '@/dominio/constelaciones';
import type { Medidas } from '@/dominio/cuerpo';
import type { Peso } from '@/dominio/control';
import type { Dia, Marca } from '@/dominio/dias';
import type { ClaveDia } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { Logro } from '@/dominio/logros';
import type { MetaGuardada, Perfil } from '@/dominio/metas';
import { leerNombre, type Nombre } from '@/dominio/nombre';
import type { NochePropia } from '@/dominio/sueno';
import { claveDeFavorito, type AlimentoPropio, type Favorito, type Receta, type Registro, type TomaDeAgua } from '@/dominio/registros';

/**
 * Lo que se come, las medidas del cuerpo y las noches propias, por colección. Cada cosa va entera y
 * la reemplaza la que llega con la misma clave.
 */
export type DeComida = { registros: Registro; recetas: Receta; propios: AlimentoPropio; favoritos: Favorito; agua: TomaDeAgua; medidas: Medidas; noches: NochePropia };
export type Coleccion = keyof DeComida;

/** La clave de cada cosa y, en lo que tiene día, el día: de eso se carga solo lo reciente. */
export const DE_COMIDA: { [C in Coleccion]: { clave: (x: DeComida[C]) => string; dia?: (x: DeComida[C]) => ClaveDia } } = {
  registros: { clave: (r) => r.id, dia: (r) => r.dia },
  recetas: { clave: (r) => r.id },
  propios: { clave: (a) => a.id },
  favoritos: { clave: claveDeFavorito },
  agua: { clave: (t) => t.id, dia: (t) => t.dia },
  // Las medidas y las noches son pocas: se cargan todas.
  medidas: { clave: (m) => m.fecha },
  noches: { clave: (n) => n.fecha },
};
export const COLECCIONES: Coleccion[] = ['registros', 'recetas', 'propios', 'favoritos', 'agua', 'medidas', 'noches'];

export type ListasDeComida = { [C in Coleccion]: DeComida[C][] };
export const sinComida = (): ListasDeComida => ({ registros: [], recetas: [], propios: [], favoritos: [], agua: [], medidas: [], noches: [] });

export type Guardado = ListasDeComida & {
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
export type Cambios = ListasDeComida & {
  habitos: Habito[];
  periodos: Periodo[] | null;
  marcas: Marca[];
  dias: Dia[];
  logros: Logro[];
  perfil: Perfil | null;
  metas: MetaGuardada[];
  pesos: Peso[];
  semilla: string | null;
  /** Tu nombre, con su hora; sin cambios, nada. */
  nombre?: Nombre | null;
};

/**
 * De los ajustes, los que suben a la cuenta: la semilla y tu nombre (en JSON, con su hora). Los demás
 * quedan en el teléfono.
 */
export const AJUSTES_QUE_SUBEN = ['semilla', 'nombre'] as const;
export const NOMBRE = 'nombre';

/** El nombre guardado en los ajustes, si se entiende. */
export function nombreDeAjuste(texto: string | null | undefined): Nombre | null {
  try {
    return texto ? leerNombre(JSON.parse(texto)) : null;
  } catch {
    return null;
  }
}

/** Lo que falta subir, hasta el cambio `hasta`. */
export type Pendientes = Cambios & { hasta: number };

export const sinCambios = (c: Cambios) =>
  !c.habitos.length && !c.periodos && !c.marcas.length && !c.dias.length && !c.logros.length && !c.perfil && !c.metas.length && !c.pesos.length && !c.semilla
  && !c.nombre && COLECCIONES.every((k) => !c[k].length);

export interface Repositorio {
  /**
   * Todo, salvo las marcas y lo de cada día de la comida: de las marcas, las de `desde` en adelante
   * (los días ya vividos están en `dias`); de los registros y el agua, los de `comidaDesde` en adelante.
   */
  cargar(desde: ClaveDia, comidaDesde: ClaveDia): Promise<Guardado>;
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
  /** Lo que se come: registros, recetas, propios, favoritos o agua. Cada cosa reemplaza la de su misma clave. */
  guardarComida<C extends Coleccion>(coleccion: C, lista: DeComida[C][]): Promise<void>;
  /** De los ajustes, solo la semilla y tu nombre suben a la cuenta (AJUSTES_QUE_SUBEN). */
  guardarAjuste(clave: string, valor: string): Promise<void>;
  leerAjuste(clave: string): Promise<string | null>;
  /** Lo que bajó de la cuenta y ganó: reemplaza lo del teléfono y no queda pendiente. */
  guardarDeLaNube(cambios: Cambios): Promise<void>;
  pendientes(): Promise<Pendientes>;
  /** Ya subió todo lo que tenía un número de cambio hasta ese. */
  subidoHasta(cambio: number): Promise<void>;
  /** Borra todo lo del teléfono: al cerrar sesión o al borrar los datos. */
  borrarTodo(): Promise<void>;
}

export const guardadoVacio = (): Guardado => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], ...sinComida(), ajustes: {} });

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

function pendientesDeComida(m: Memoria, pendiente: (clave: string) => boolean): ListasDeComida {
  const de = <C extends Coleccion>(c: C) => (m[c] as DeComida[C][]).filter((x) => pendiente(`${c}|${DE_COMIDA[c].clave(x)}`));
  return { registros: de('registros'), recetas: de('recetas'), propios: de('propios'), favoritos: de('favoritos'), agua: de('agua'), medidas: de('medidas'), noches: de('noches') };
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
    async cargar(desde, comidaDesde) {
      const { cambios: _c, secuencia: _s, subido: _u, ...datos } = m;
      return copia({
        ...datos, marcas: m.marcas.filter((x) => x.dia >= desde),
        registros: m.registros.filter((x) => x.dia >= comidaDesde), agua: m.agua.filter((x) => x.dia >= comidaDesde),
      });
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
    async guardarComida(coleccion, lista) {
      const clave = DE_COMIDA[coleccion].clave as (x: (typeof lista)[number]) => string;
      (m[coleccion] as (typeof lista)[number][]) = encima(m[coleccion] as (typeof lista)[number][], lista, clave);
      lista.forEach((x) => tocar(`${coleccion}|${clave(x)}`));
      await listo();
    },
    async guardarAjuste(clave, valor) {
      m.ajustes = { ...m.ajustes, [clave]: valor };
      if ((AJUSTES_QUE_SUBEN as readonly string[]).includes(clave)) tocar(clave);
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
      if (c.nombre) {
        m.ajustes = { ...m.ajustes, [NOMBRE]: JSON.stringify(c.nombre) };
        llego(NOMBRE);
      }
      for (const coleccion of COLECCIONES) {
        const clave = DE_COMIDA[coleccion].clave as (x: unknown) => string;
        (m[coleccion] as unknown[]) = encima(m[coleccion] as unknown[], c[coleccion], clave);
        c[coleccion].forEach((x: unknown) => llego(`${coleccion}|${clave(x)}`));
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
        nombre: pendiente(NOMBRE) ? nombreDeAjuste(m.ajustes[NOMBRE]) : null,
        ...pendientesDeComida(m, pendiente),
      });
    },
    async subidoHasta(cambio) {
      m.subido = Math.max(m.subido, cambio);
      await listo();
    },
    async borrarTodo() {
      Object.assign(m, memoriaVacia());
      await listo();
    },
  };
}
