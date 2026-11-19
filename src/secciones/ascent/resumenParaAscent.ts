// Lo de Moss que lee Ascent y no sube con lo demás (0015_moss_para_ascent.sql): el sueño de Salud, lo que necesitas, la
// deuda, la energía de hoy y la meta de cada día, que se calculan en el teléfono; y, desde 0017, cuánto bajas por semana
// y tu experiencia, para «Por qué puedes estar estancado». Mientras está vinculada, Moss sube
// los últimos 14 días cuando algo cambia; al desvincular, la base lo borra. La privacidad lo dice (docs/privacidad).

import { useEffect } from 'react';

import type { Estado } from '@/almacen/almacen';
import { useAscent } from '@/almacen/ascent';
import { sumarDias } from '@/dominio/fechas';
import { deudaDeSueno, juicioDeLaDeuda, ultimasNoches } from '@/dominio/sueno';
import { guardarResumenes, type ResumenParaAscent } from '@/lib/ascentRemoto';
import { metaDelDia, useEstado } from '../comida/datos';
import { usePersona, useSueno } from '../ganchos';
import type { Persona, Sueno } from '../persona';
import { useEnergia } from '../sueno/Energia';

const DIAS = 14;
/** Se espera a que se calme: con cada minuto cambia la energía, y con cada toque, lo comido. */
const ESPERA_MS = 5000;

export function resumenesParaAscent(
  e: Pick<Estado, 'hoy' | 'metas' | 'perfil' | 'pesos' | 'respuestas'>, sueno: Sueno, energia: ResumenParaAscent['energia'], persona: Pick<Persona, 'deEjemplo' | 'cambio7'>,
): ResumenParaAscent[] {
  // Como en vista.ts (las razones de estancamiento): la tendencia de 7 días contra el peso de hoy, dentro de lo que
  // acepta la base (±10 %), así un dato raro no deja sin subir lo demás.
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg;
  const baja = !persona.deEjemplo && persona.cambio7 !== null && pesoKg ? Math.max(-10, Math.min(10, Math.round((-persona.cambio7 / pesoKg) * 10000) / 100)) : null;
  const noches = sueno.deEjemplo ? [] : sueno.noches;
  const deuda = noches.length ? deudaDeSueno(ultimasNoches(noches, e.hoy, 14), sueno.necesidad) : null;
  return Array.from({ length: DIAS }, (_, i) => {
    const fecha = sumarDias(e.hoy, -i);
    const noche = noches.find((n) => n.clave === fecha);
    const meta = metaDelDia(e, fecha);
    return {
      fecha,
      dormido: noche ? Math.round(noche.dormido) : null,
      necesidad: sueno.necesidad,
      meta: meta ? { kcal: meta.kcal, proteina: meta.proteina, carbohidratos: meta.carbohidratos, grasas: meta.grasas } : null,
      // La deuda y la energía son de hoy: los días de antes guardan las que tenían.
      ...(i === 0 ? { deuda: deuda ? Math.round(deuda.minutos) : null, deuda_palabra: deuda ? juicioDeLaDeuda(deuda) : null, energia, baja_semanal: baja, experiencia: e.respuestas?.experiencia ?? null } : {}),
    };
  });
}

let ultimoEnviado = '';

/** Sube el resumen mientras esté vinculada. Va en la sección de Ascent, que está siempre montada. */
export function useResumenParaAscent() {
  const { vinculo } = useAscent();
  const e = useEstado();
  const sueno = useSueno();
  const energia = useEnergia()?.dia?.estado ?? null;
  const persona = usePersona();
  const vinculada = vinculo.vinculada;
  useEffect(() => {
    if (!vinculada) {
      ultimoEnviado = '';
      return;
    }
    const dias = resumenesParaAscent(e, sueno, energia, persona);
    const texto = JSON.stringify(dias);
    if (texto === ultimoEnviado) return;
    const reloj = setTimeout(() => {
      guardarResumenes(dias).then((ok) => {
        if (ok) ultimoEnviado = texto;
      }, () => {});
    }, ESPERA_MS);
    return () => clearTimeout(reloj);
  }, [vinculada, e, sueno, energia, persona]);
}
