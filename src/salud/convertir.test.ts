import { describe, expect, it } from '@jest/globals';

import { armarNoches } from '@/dominio/sueno';
import { fuentesDe, lecturasDe, minutosDe, muestraDeSueno, tipoDeFuente, ultimaPorDia, type DeSalud } from './convertir';

const reloj = { source: { name: 'Apple Watch de Ana', bundleIdentifier: 'com.apple.health.A1' }, productType: 'Watch7,3' };
const iphone = { source: { name: 'iPhone de Ana', bundleIdentifier: 'com.apple.health.B2' }, productType: 'iPhone15,2' };
const local = (dia: string, hora: string) => new Date(`${dia}T${hora}:00`);
const sueno = (value: number, desde: Date, hasta: Date, fuente = reloj, metadata?: Record<string, unknown>): DeSalud => ({ value, startDate: desde, endDate: hasta, sourceRevision: fuente, metadata });

describe('de Salud al dominio', () => {
  it('el reloj, el teléfono y lo demás, por el modelo del aparato', () => {
    expect(tipoDeFuente('Watch7,3')).toBe('reloj');
    expect(tipoDeFuente('iPhone15,2')).toBe('telefono');
    expect(tipoDeFuente(undefined)).toBe('otra');
    expect(fuentesDe([sueno(3, local('2026-10-21', '23:40'), local('2026-10-22', '00:20')), sueno(0, local('2026-10-21', '23:20'), local('2026-10-22', '07:30'), iphone)])).toEqual([
      { id: 'com.apple.health.A1', nombre: 'Apple Watch de Ana', tipo: 'reloj' },
      { id: 'com.apple.health.B2', nombre: 'iPhone de Ana', tipo: 'telefono' },
    ]);
  });

  it('cada valor de sueño es su etapa; lo anotado a mano se marca y lo que no se entiende queda afuera', () => {
    const desde = local('2026-10-21', '23:40');
    const hasta = local('2026-10-22', '00:20');
    expect(muestraDeSueno(sueno(4, desde, hasta))).toMatchObject({ etapa: 'profundo', desde: desde.getTime(), hasta: hasta.getTime(), fuente: 'com.apple.health.A1', zona: -desde.getTimezoneOffset() });
    expect(muestraDeSueno(sueno(5, desde, hasta))?.etapa).toBe('rem');
    expect(muestraDeSueno(sueno(1, desde, hasta, reloj, { HKWasUserEntered: true }))).toMatchObject({ etapa: 'dormido', aMano: true });
    expect(muestraDeSueno(sueno(9, desde, hasta))).toBeNull();
    expect(muestraDeSueno(sueno(3, hasta, desde))).toBeNull();
  });

  it('con lo que trae Salud se arma la noche, del día en que te despertás', () => {
    const muestras: DeSalud[] = [
      sueno(0, local('2026-10-21', '23:15'), local('2026-10-22', '07:20'), iphone),
      sueno(3, local('2026-10-21', '23:40'), local('2026-10-22', '01:00')),
      sueno(4, local('2026-10-22', '01:00'), local('2026-10-22', '02:00')),
      sueno(5, local('2026-10-22', '02:00'), local('2026-10-22', '03:00')),
      sueno(3, local('2026-10-22', '03:00'), local('2026-10-22', '07:00')),
    ];
    const noches = armarNoches(muestras.flatMap((m) => muestraDeSueno(m) ?? []), fuentesDe(muestras));
    expect(noches).toHaveLength(1);
    expect(noches[0]).toMatchObject({ clave: '2026-10-22', dormido: 440, conEtapas: true });
    expect(noches[0].fuente.tipo).toBe('reloj');
  });

  it('las lecturas, la última de cada día y los minutos de unas sesiones', () => {
    const q = (quantity: number, desde: Date): DeSalud => ({ quantity, startDate: desde, endDate: desde, sourceRevision: reloj });
    expect(lecturasDe([q(52, local('2026-10-22', '02:00')), q(Number.NaN, local('2026-10-22', '03:00'))])).toEqual([{ en: local('2026-10-22', '02:00').getTime(), valor: 52 }]);
    expect(ultimaPorDia([q(74.9, local('2026-10-21', '07:00')), q(74.5, local('2026-10-22', '07:10')), q(74.3, local('2026-10-22', '21:00'))])).toEqual(new Map([['2026-10-21', 74.9], ['2026-10-22', 74.3]]));
    expect(minutosDe([{ startDate: local('2026-10-22', '08:00'), endDate: local('2026-10-22', '08:10'), sourceRevision: iphone }, { startDate: local('2026-10-22', '21:00'), endDate: local('2026-10-22', '21:05'), sourceRevision: iphone }])).toBe(15);
  });
});
