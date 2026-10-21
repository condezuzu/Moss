// La semana de hoy, de lunes a domingo: es lo que muestra tu universo.

import { periodoDe, type Periodo } from './constelaciones';
import type { Dia } from './dias';
import { diaDeLaSemana, lunesDe, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { habitosDelDia, type Habito } from './habitos';

export type DiaDeLaSemana = {
  clave: ClaveDia;
  dia: DiaSemana;
  constelacion: string | null;
  hechos: number;
  total: number;
  hoy: boolean;
};

export function semanaDe(hoy: ClaveDia, periodos: Periodo[], dias: Map<ClaveDia, Dia>, habitos: Habito[]): DiaDeLaSemana[] {
  const lunes = lunesDe(hoy);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const clave = sumarDias(lunes, i);
    const guardado = dias.get(clave);
    return {
      clave,
      dia: diaDeLaSemana(clave),
      // Un día ya vivido muestra la constelación que tuvo; uno que viene, la que le toca.
      constelacion: guardado?.constelacion ?? periodoDe(periodos, clave)?.constelacion ?? null,
      hechos: guardado?.hechos.length ?? 0,
      total: guardado?.habitos.length ?? habitosDelDia(habitos, clave).length,
      hoy: clave === hoy,
    };
  });
}
