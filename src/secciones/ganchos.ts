// Los ganchos de Inicio, Progreso y Sueño: lo calculado en persona.ts, rehecho cuando cambia lo guardado.

import { useMemo } from 'react';

import { usePesoUnico } from '@/almacen/ascent';
import { useEstado } from './comida/datos';
import { calcularPersona, suenoDe, type Persona, type Sueno } from './persona';

/** La persona de hoy: se rehace cuando cambia lo guardado. */
export function usePersona(): Persona {
  const e = useEstado();
  const { hoy, perfil, metas, registros, medidas } = e;
  // Con Ascent vinculada, el peso de las dos apps (spec/ascent.md, función 4).
  const pesos = usePesoUnico(e.pesos);
  return useMemo(() => calcularPersona({ hoy, perfil, pesos, metas, registros, medidas }), [hoy, perfil, pesos, metas, registros, medidas]);
}

export function useSueno(): Sueno {
  const { hoy, perfil, salud, noches } = useEstado();
  return useMemo(() => suenoDe(hoy, perfil, salud, noches), [hoy, perfil, salud, noches]);
}
