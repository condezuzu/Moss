// El despertar real de hoy, para el día que sigue tu despertar (spec/avisos.md): con lo que ya está en el teléfono
// (la noche de Salud, las anclas del despertador y del atajo, y cuándo se abrió Moss) se busca a qué hora te
// despertaste, y queda guardado en el almacén (ponerDespertar). Lo buscan abrir Moss y la tarea de segundo plano;
// el almacén reprograma los avisos cuando cambia.

import type { Almacen } from '@/almacen/almacen';
import { minutosEnElDia } from '@/dominio/fechas';
import { habitualDe } from '@/dominio/sinReloj';
import { ANCLAS_DEL_DESPERTAR, despertarDelDia } from '@/dominio/sigueElDespertar';
import { suenoDe } from '@/secciones/persona';
import { leerSenales } from './anclas';

/** Las noches cuentan desde las 18 del día anterior (sueno.ts): la medianoche es su minuto 360. */
const MEDIANOCHE = 6 * 60;

export async function buscarDespertar(a: Pick<Almacen, 'estado' | 'ponerDespertar'>, ahora = new Date()): Promise<void> {
  const e = a.estado();
  if (!e.listo) return;
  const hoy = e.hoy;
  const minutos = (ms: number) => minutosEnElDia(new Date(ms), hoy);
  const senales = await leerSenales(ahora.getTime() - 86_400_000).catch(() => []);
  // Solo lo de Salud: las noches que estima Moss sin reloj salen, justamente, de abrir Moss.
  const noche = e.salud?.noches.find((n) => n.clave === hoy && !n.moss);
  const s = suenoDe(hoy, e.perfil, e.salud, e.noches, e.necesidad);
  const habitual = s.deEjemplo ? null : (habitualDe(s.noches, hoy)?.despertar ?? null);
  const minutoDeAhora = minutosEnElDia(ahora, hoy);
  const despertar = despertarDelDia({
    salud: noche ? noche.despertar - MEDIANOCHE : null,
    anclas: senales.filter((x) => (ANCLAS_DEL_DESPERTAR as readonly string[]).includes(x.que)).map((x) => minutos(x.en)),
    aperturas: e.uso.map(([desde]) => minutos(desde)),
    corte: e.corte,
    habitual: habitual === null ? null : habitual - MEDIANOCHE,
    ahora: minutoDeAhora,
  });
  if (despertar !== null) a.ponerDespertar(hoy, despertar, minutoDeAhora);
}
