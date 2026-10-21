import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colores } from '@/tema';

export default function Raiz() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colores.noche0 },
        }}
      />
    </>
  );
}
