// Los ganchos de Inicio, Progreso y Sueño: lo calculado en persona.ts, rehecho cuando cambia lo guardado.

import { useMemo } from 'react';

import { useEstado } from './comida/datos';
import { calcularPersona, suenoDe, type Persona, type Sueno } from './persona';

/** La persona de hoy: se rehace cuando cambia lo guardado. */
export function usePersona(): Persona {
  const e = useEstado();
  const { hoy, perfil, pesos, metas, registros, medidas } = e;
  return useMemo(() => calcularPersona({ hoy, perfil, pesos, metas, registros, medidas }), [hoy, perfil, pesos, metas, registros, medidas]);
}

export function useSueno(): Sueno {
  const { hoy, perfil, salud } = useEstado();
  return useMemo(() => suenoDe(hoy, perfil, salud), [hoy, perfil, salud]);
}
