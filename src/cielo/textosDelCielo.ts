import { useMemo } from 'react';

import type { Texto } from '@/datos/catalogo';
import type { MetaDeComida } from '@/dominio/habitos';
import type { Objetivo } from '@/dominio/metas';
import { duracion } from '@/secciones/comida/datos';
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

/**
 * Lo que enciende la estrella de un hábito de comida (tocarla lo dice, y VoiceOver): las calorías, según hacia dónde vas
 * (registros.ts, cumpleLaComida).
 */
export function seEnciendeCon(comida: MetaDeComida | undefined, objetivo: Objetivo): string {
  if (comida === 'calorias' && objetivo !== 'mantener') return t(objetivo === 'bajar' ? 'cielo.seEnciendeCon.caloriasBajando' : 'cielo.seEnciendeCon.caloriasSubiendo');
  return t(`cielo.seEnciendeCon.${comida ?? 'registrar'}`);
}

/** Lo que lleva hoy un hábito automático, o nada si todavía no hay datos (Salud llega en la etapa 8). */
export function valorAutomatico(h: HabitoDelCielo) {
  if (h.valor === undefined) return '';
  if (h.auto === 'pasos') return `${miles(h.valor)} / ${miles(h.meta ?? 0)}`;
  if (h.auto === 'sueno') return duracion(h.valor);
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
