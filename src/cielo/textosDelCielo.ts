import { useMemo } from 'react';

import type { Texto } from '@/datos/catalogo';
import { idioma, t } from '@/textos';
import type { HabitoDeMentira } from './mentira';

// Separador de miles a mano: Intl en español no separa los números de cuatro cifras (8000), y
// la especificación escribe "8.000 pasos".
function miles(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, idioma() === 'es' ? '.' : ',');
}

export function nombreEn(texto: Texto) {
  return texto[idioma()];
}

export function valorAutomatico(h: HabitoDeMentira) {
  if (h.auto === 'pasos') return `${miles(h.valor ?? 0)} / ${miles(h.meta ?? 0)}`;
  if (h.auto === 'sueno') {
    const minutos = h.valor ?? 0;
    return t('cielo.horasMinutos', { h: Math.floor(minutos / 60), m: minutos % 60 });
  }
  return '';
}

export function useTextos() {
  return useMemo(() => ({ t, nombre: nombreEn, valorAutomatico }), []);
}
