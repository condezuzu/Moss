// Los pesos de Progreso en la unidad de cada uno: con lo redondeado para mostrar y sin redondear para las cuentas.

import { KG_POR_LIBRA, pesoCorporalEn, type Sistema } from '@/dominio/cantidades';
import { idioma } from '@/textos';
import { numero } from '../comida/datos';

const formatos = new Map<string, Intl.NumberFormat>();
/** Con los decimales fijos, como la galería («75,0», «0,50 %»): en la línea del plan, «68» al lado de «66,5» baila. */
export function fijo(n: number, decimales: number): string {
  const clave = `${idioma()}${decimales}`;
  let f = formatos.get(clave);
  if (!f) {
    f = new Intl.NumberFormat(idioma() === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    formatos.set(clave, f);
  }
  return f.format(n);
}
/** Un cambio, con su signo de verdad (−) y los decimales fijos. */
export const conSignoFijo = (n: number, decimales: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${fijo(Math.abs(n), decimales)}`;

export function unidades(sistema: Sistema) {
  const unidad = pesoCorporalEn(1, sistema).unidad;
  const enUnidad = (kg: number) => (sistema === 'imperial' ? kg / KG_POR_LIBRA : kg);
  return {
    unidad,
    peso: (kg: number, decimales = 1) => fijo(pesoCorporalEn(kg, sistema).valor, decimales),
    /** El peso meta: de a medio kilo o de a una libra (PasosDelPesoMeta). */
    meta: (kg: number) => numero(pesoCorporalEn(kg, sistema).valor, kg % 1 && sistema !== 'imperial' ? 1 : 0),
    /** Un peso redondo cuando lo es («71»), con un decimal cuando no («70,5»). */
    corto: (kg: number) => {
      const v = enUnidad(kg);
      return numero(v, Math.abs(v - Math.round(v)) >= 0.05 ? 1 : 0);
    },
    enUnidad,
    // Los textos del plan y del plazo dicen «kg», como la galería: en libras, la misma frase con «lb».
    texto: (frase: string) => (unidad === 'kg' ? frase : frase.replace(/\bkg\b/g, unidad)),
  };
}

export type U = ReturnType<typeof unidades>;
