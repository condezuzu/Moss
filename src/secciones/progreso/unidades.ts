// Los pesos de Progreso en la unidad de cada uno: con lo redondeado para mostrar y sin redondear para las cuentas.

import { KG_POR_LIBRA, pesoCorporalEn, type Sistema } from '@/dominio/cantidades';
import { numero } from '../comida/datos';

export function unidades(sistema: Sistema) {
  const unidad = pesoCorporalEn(1, sistema).unidad;
  const enUnidad = (kg: number) => (sistema === 'imperial' ? kg / KG_POR_LIBRA : kg);
  return {
    unidad,
    peso: (kg: number, decimales = 1) => numero(pesoCorporalEn(kg, sistema).valor, decimales),
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
