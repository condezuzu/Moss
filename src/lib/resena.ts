// Pedir la reseña de la App Store en un buen momento (src/dominio/resena.ts): cuando el día queda completo o cuando
// acabas de anotar comida, nunca al abrir Moss ni con lo que baja de la cuenta. Solo en el iPhone y con una build que
// trae app-intents/Resena.swift; en una build vieja, en la web y en los tests, nada.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { tocaPedirResena } from '@/dominio/resena';

const modulo = Platform.OS === 'ios' ? requireOptionalNativeModule<{ pedir(): Promise<boolean> }>('Resena') : null;
const PEDIDA = 'moss:resenaPedida';
/** Un rato después: que termine la aurora del día completo o se cierre la hoja de anotar. */
const ESPERA = 2500;
/** Lo anotado recién, en este teléfono: lo que baja de la cuenta trae la hora de antes. */
const RECIEN = 60_000;

const diasConComida = (e: Estado) => new Set([...e.registros.values()].filter((r) => !r.planificado).map((r) => r.dia)).size;

/** Si entre dos estados se completó el día o se anotó comida recién: los dos buenos momentos. */
function momentoBueno(antes: Estado, e: Estado): boolean {
  if (!antes.listo || !e.listo) return false;
  if (antes.hoy === e.hoy && !antes.dias.get(e.hoy)?.completo && e.dias.get(e.hoy)?.completo) return true;
  if (e.registros === antes.registros || e.registros.size <= antes.registros.size) return false;
  const desde = Date.now() - RECIEN;
  for (const [id, r] of e.registros) if (!antes.registros.has(id) && !r.planificado && Date.parse(r.actualizado) >= desde) return true;
  return false;
}

export function useResena() {
  useEffect(() => {
    const pedir = modulo?.pedir;
    if (!pedir) return;
    const a = elAlmacen();
    let antes = a.estado();
    let espera: ReturnType<typeof setTimeout> | undefined;
    let pidiendo = false;
    const sinOir = a.suscribir(() => {
      const e = a.estado();
      const bueno = momentoBueno(antes, e);
      antes = e;
      if (!bueno || pidiendo) return;
      pidiendo = true;
      AsyncStorage.getItem(PEDIDA).catch(() => null).then((ultimo) => {
        if (!tocaPedirResena({ hoy: e.hoy, ultimoPedido: ultimo, diasConComida: diasConComida(e), diaCompleto: !!e.dias.get(e.hoy)?.completo })) {
          pidiendo = false;
          return;
        }
        espera = setTimeout(() => {
          if (AppState.currentState !== 'active') {
            pidiendo = false;
            return;
          }
          pedir()
            .then((pedida) => (pedida ? AsyncStorage.setItem(PEDIDA, e.hoy) : undefined))
            .catch(() => {})
            .finally(() => {
              pidiendo = false;
            });
        }, ESPERA);
      });
    });
    return () => {
      clearTimeout(espera);
      sinOir();
    };
  }, []);
}
