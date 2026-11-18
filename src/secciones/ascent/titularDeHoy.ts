// El titular de hoy de la sección de Ascent (spec/ascent.md, «Ascent en Progreso»), para quien lo muestra
// afuera (la entrada de Progreso, Inicio y Sueño) y para la sección misma: así todos dicen lo mismo.

import { useEffect, useMemo, useState } from 'react';

import { useAscent } from '@/almacen/ascent';
import type { Limita, QueTitular } from '@/dominio/recuperado';
import { useEstado } from '../comida/datos';
import { usePersona, useSueno } from '../ganchos';
import { textosDelTitular } from './palabras';
import { calcularHoy, type Hoy } from './vista';

export type TitularParaAfuera = {
  que: QueTitular;
  limita: Limita;
  titulo: string;
  texto: string;
  /** inicio: minutos desde la medianoche del día de Moss. */
  sesion: { inicio: number; minutos: number; hecha: boolean } | null;
};

/** El momento que se mira, al minuto: así lo de hoy se vuelve a calcular cuando pasa la hora de la sesión. */
export function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(reloj);
  }, []);
  return ahora;
}

/** Lo de hoy en la sección, con lo que llegó de Ascent; null sin vincular. */
export function useHoyEnAscent(ahora: Date): Hoy | null {
  const e = useEstado();
  const d = useAscent();
  const sueno = useSueno();
  const persona = usePersona();
  const vinculada = d.vinculo.vinculada;
  return useMemo(() => (vinculada && e.listo ? calcularHoy({ e, d, sueno, persona, ahora }) : null), [vinculada, e, d, sueno, persona, ahora]);
}

export function paraAfuera(h: Hoy): TitularParaAfuera {
  const [titulo, texto] = textosDelTitular(h);
  return {
    que: h.titular.que, limita: h.titular.limita, titulo, texto,
    sesion: h.sesion ? { inicio: h.sesion.inicio, minutos: h.sesion.minutos, hecha: h.sesion.como === 'hecha' } : null,
  };
}

/** null sin vincular o sin datos. */
export function useTitularDeAscent(): TitularParaAfuera | null {
  const h = useHoyEnAscent(useAhora());
  return useMemo(() => (h ? paraAfuera(h) : null), [h]);
}
