// Los ganchos de Inicio, Progreso y Sueño: lo calculado en persona.ts, rehecho cuando cambia lo guardado.

import { useMemo } from 'react';

import { usePesoUnico } from '@/almacen/ascent';
import type { Peso } from '@/dominio/control';
import { useEstado } from './comida/datos';
import { calcularPersona, suenoDe, type Persona, type Sueno } from './persona';

type ParaLaPersona = Parameters<typeof calcularPersona>[0];
type ParaElSueno = Parameters<typeof suenoDe>;

// Lo último que se calculó, para todos, como estadoConAscent (src/almacen/ascent.ts): Inicio y Progreso
// piden la persona en varias tarjetas, y una sección que se arma al deslizar la encuentra hecha.
let ultimaPersona: { de: ParaLaPersona; persona: Persona } | undefined;
let ultimoSueno: { de: ParaElSueno; sueno: Sueno } | undefined;

/** Los mismos pesos, aunque sean otra lista: con Ascent vinculada, cada tarjeta junta la suya (usePesoUnico). */
function mismosPesos(a: readonly Peso[], b: readonly Peso[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((p, i) => {
    const q = b[i];
    const claves = Object.keys(p) as (keyof Peso)[];
    return claves.length === Object.keys(q).length && claves.every((k) => p[k] === q[k]);
  });
}

function personaDe(de: ParaLaPersona): Persona {
  const u = ultimaPersona;
  if (u && u.de.hoy === de.hoy && u.de.perfil === de.perfil && u.de.metas === de.metas && u.de.registros === de.registros && u.de.medidas === de.medidas && mismosPesos(u.de.pesos, de.pesos)) {
    return u.persona;
  }
  const persona = calcularPersona(de);
  ultimaPersona = { de, persona };
  return persona;
}

function suenoDeHoy(...de: ParaElSueno): Sueno {
  const u = ultimoSueno;
  if (u && u.de.length === de.length && de.every((x, i) => x === u.de[i])) return u.sueno;
  const sueno = suenoDe(...de);
  ultimoSueno = { de, sueno };
  return sueno;
}

/** La persona de hoy: se rehace cuando cambia lo guardado. */
export function usePersona(): Persona {
  const e = useEstado();
  const { hoy, perfil, metas, registros, medidas } = e;
  // Con Ascent vinculada, el peso de las dos apps (spec/ascent.md, función 4).
  const pesos = usePesoUnico(e.pesos);
  return useMemo(() => personaDe({ hoy, perfil, pesos, metas, registros, medidas }), [hoy, perfil, pesos, metas, registros, medidas]);
}

export function useSueno(): Sueno {
  const { hoy, perfil, salud, noches, necesidad } = useEstado();
  return useMemo(() => suenoDeHoy(hoy, perfil, salud, noches, necesidad), [hoy, perfil, salud, noches, necesidad]);
}
