import { useMemo } from 'react';

import type { Texto } from '@/datos/catalogo';
import { idioma, t } from '@/textos';
import type { HabitoDelCielo } from './dia';

// Separador de miles a mano: Intl en español no separa los números de cuatro cifras (8000), y
// la especificación escribe "8.000 pasos".
function miles(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, idioma() === 'es' ? '.' : ',');
}

export function nombreEn(texto: Texto) {
  return texto[idioma()];
}

/** Lo que lleva hoy un hábito automático, o nada si todavía no hay datos (Salud llega en la etapa 8). */
export function valorAutomatico(h: HabitoDelCielo) {
  if (h.valor === undefined) return '';
  if (h.auto === 'pasos') return `${miles(h.valor)} / ${miles(h.meta ?? 0)}`;
  if (h.auto === 'sueno') {
    const minutos = Math.round(h.valor);
    return t('cielo.horasMinutos', { h: Math.floor(minutos / 60), m: minutos % 60 });
  }
  return '';
}

/** Debajo de la etiqueta, solo lo que lleva hoy: la meta ya está en el nombre («8.000 pasos»). */
export function valorCorto(h: HabitoDelCielo) {
  if (h.valor === undefined) return '';
  if (h.auto === 'pasos') return miles(h.valor);
  return valorAutomatico(h);
}

export function useTextos() {
  return useMemo(() => ({ t, nombre: nombreEn, valorAutomatico }), []);
}
