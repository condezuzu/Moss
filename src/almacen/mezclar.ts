// Mezclar lo que baja de la cuenta con lo del teléfono. De cada cosa gana la versión más nueva
// según la hora de su cambio, igual que en Supabase (los triggers de supabase/moss/). Devuelve lo
// que llegó y ganó: eso se guarda en el teléfono sin quedar pendiente.

import { mismosPeriodos, type Periodo } from '@/dominio/constelaciones';
import type { Peso } from '@/dominio/control';
import { claveDeMarca, type Dia, type Marca } from '@/dominio/dias';
import type { Habito } from '@/dominio/habitos';
import type { Logro } from '@/dominio/logros';
import type { MetaGuardada, Perfil } from '@/dominio/metas';
import type { Cambios } from './repositorio';

/** Lo que se mezcla: los datos guardados, más la semilla (que en el teléfono va con los ajustes). */
export type Datos = {
  habitos: Habito[];
  periodos: Periodo[];
  dias: Dia[];
  marcas: Marca[];
  logros: Logro[];
  perfil: Perfil | null;
  metas: MetaGuardada[];
  pesos: Peso[];
  semilla: string | null;
};

// Todas las horas son ISO en UTC (remoto.ts las normaliza al bajar): compararlas como texto es compararlas en el tiempo.
const masNueva = (llega: string | undefined, local: string | undefined) => (llega ?? '') > (local ?? '');

/** De cada clave, gana la que llega si el teléfono no la tiene o si `gana(llega, local)`. */
function porClave<T>(locales: T[], remotos: T[], clave: (x: T) => string, gana: (llega: T, local: T) => boolean): T[] {
  const mapa = new Map(locales.map((x) => [clave(x), x]));
  return remotos.filter((r) => {
    const l = mapa.get(clave(r));
    return !l || gana(r, l);
  });
}

export function ganadores(local: Datos, remoto: Datos): Cambios {
  return {
    habitos: porClave(local.habitos, remoto.habitos, (h) => h.id, (r, l) => masNueva(r.actualizado, l.actualizado)),
    marcas: porClave(local.marcas, remoto.marcas, (m) => claveDeMarca(m.habito, m.dia), (r, l) => masNueva(r.momento, l.momento)),
    dias: porClave(local.dias, remoto.dias, (d) => d.clave, (r, l) => masNueva(r.actualizado, l.actualizado)),
    metas: porClave(local.metas, remoto.metas, (m) => m.desde, (r, l) => masNueva(r.momento, l.momento)),
    pesos: porClave(local.pesos, remoto.pesos, (p) => p.fecha, (r, l) => masNueva(r.momento, l.momento)),
    perfil: remoto.perfil && (!local.perfil || masNueva(remoto.perfil.actualizado, local.perfil.actualizado)) ? remoto.perfil : null,
    // Un logro nunca se pierde. Si los dos teléfonos lo ganaron, queda la fecha que guardó la cuenta (la del que subió primero).
    logros: porClave(local.logros, remoto.logros, (l) => l.id, (r, l) => r.desde !== l.desde),
    // Los períodos y la semilla son de la cuenta: un teléfono usa los suyos solo hasta conocerlos.
    periodos: remoto.periodos.length && !mismosPeriodos(remoto.periodos, local.periodos) ? remoto.periodos : null,
    semilla: remoto.semilla && remoto.semilla !== local.semilla ? remoto.semilla : null,
  };
}

/** Los datos ya mezclados: lo del teléfono con los ganadores encima. */
export function aplicar(local: Datos, g: Cambios): Datos {
  const encima = <T>(base: T[], nuevos: T[], clave: (x: T) => string) => {
    const mapa = new Map(base.map((x) => [clave(x), x]));
    for (const n of nuevos) mapa.set(clave(n), n);
    return [...mapa.values()];
  };
  return {
    habitos: encima(local.habitos, g.habitos, (h) => h.id),
    marcas: encima(local.marcas, g.marcas, (m) => claveDeMarca(m.habito, m.dia)),
    dias: encima(local.dias, g.dias, (d) => d.clave),
    logros: encima(local.logros, g.logros, (l) => l.id),
    metas: encima(local.metas, g.metas, (m) => m.desde).sort((a, b) => (a.desde < b.desde ? -1 : 1)),
    pesos: encima(local.pesos, g.pesos, (p) => p.fecha).sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
    perfil: g.perfil ?? local.perfil,
    periodos: g.periodos ?? local.periodos,
    semilla: g.semilla ?? local.semilla,
  };
}
