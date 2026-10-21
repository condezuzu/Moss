import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

function crearCliente() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const clave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !clave) {
    throw new Error(
      'Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'En local, copia .env.example a .env y completa los valores; en EAS, defínelas en el entorno "preview".',
    );
  }

  const nuevo = createClient(url, clave, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    db: { schema: 'moss' },
  });

  // Fuera del navegador, supabase-js no se entera de que la app pasó a segundo plano: se le avisa.
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') nuevo.auth.startAutoRefresh();
    else nuevo.auth.stopAutoRefresh();
  });

  return nuevo;
}

let cliente: ReturnType<typeof crearCliente> | undefined;

// Se crea en el primer pedido: sin las variables la app arranca igual y el error aparece solo al usar el cliente.
export function supabase() {
  cliente ??= crearCliente();
  return cliente;
}
