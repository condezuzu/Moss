// Si Ascent está en este iPhone, para la señal de Hábitos y la invitación de Inicio: se mira al armarse y
// cada vez que Moss vuelve a primer plano, por si la instalaron o la borraron mientras tanto.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { hayAscent } from '@/lib/ascent';

/** null: todavía no se sabe. */
export function useHayAscent(): boolean | null {
  const [hay, setHay] = useState<boolean | null>(null);
  useEffect(() => {
    let viva = true;
    const mirar = () => {
      hayAscent().then((si) => {
        if (viva) setHay(si);
      }).catch(() => {});
    };
    mirar();
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') mirar();
    });
    return () => {
      viva = false;
      sub.remove();
    };
  }, []);
  return hay;
}
