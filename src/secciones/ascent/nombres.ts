// Cómo se nombra una sesión de Ascent, en la sección y en la señal de Hábitos.

import type { GrupoDeAscent } from '@/dominio/musculos';
import { t } from '@/textos';

/** «Piernas», «Pecho y hombros» o, sin ejercicios, «Gimnasio». */
export function nombreDeSesion(grupos: GrupoDeAscent[]): string {
  const n = grupos.slice(0, 2).map((g) => t(`ascent.hoy.grupos.${g}`));
  if (!n.length) return t('ascent.gimnasio.nombre');
  return n.length === 2 ? t('ascent.hoy.y', { a: n[0], b: n[1].toLowerCase() }) : n[0];
}
