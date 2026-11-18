import { describe, expect, it } from '@jest/globals';

import { armarNoches } from '@/dominio/sueno';
import { CORTE_DE_FABRICA } from '@/dominio/fechas';
import { cuentaComoEntrenar, entrenoDeSalud, entrenosDelDia, fuentesDe, lecturasDe, minutosDe, muestraDeSueno, pasosDe, primeraPorDia, tipoDeFuente, ultimaPorDia, type DeSalud, type DeSaludEntreno } from './convertir';

const reloj = { source: { name: 'Apple Watch de Ana', bundleIdentifier: 'com.apple.health.A1' }, productType: 'Watch7,3' };
const iphone = { source: { name: 'iPhone de Ana', bundleIdentifier: 'com.apple.health.B2' }, productType: 'iPhone15,2' };
const local = (dia: string, hora: string) => new Date(`${dia}T${hora}:00`);
const sueno = (value: number, desde: Date, hasta: Date, fuente = reloj, metadata?: Record<string, unknown>): DeSalud => ({ value, startDate: desde, endDate: hasta, sourceRevision: fuente, metadata });

describe('de Salud al dominio', () => {
  it('el reloj, el teléfono y lo demás, por el modelo del aparato', () => {
    expect(tipoDeFuente('Watch7,3')).toBe('reloj');
    expect(tipoDeFuente('iPhone15,2')).toBe('telefono');
    expect(tipoDeFuente(undefined)).toBe('otra');
    // Oura, Garmin o WHOOP escriben desde su app del iPhone: se reconocen por la app, no por el modelo.
    expect(tipoDeFuente('iPhone15,2', 'com.ouraring.oura', 'Oura')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.garmin.connect.mobile', 'Connect')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.northcube.sleepcycle', 'Sleep Cycle')).toBe('telefono');
    // Un anillo de cualquier marca: su app corre en el iPhone, pero mide un aparato.
    expect(tipoDeFuente('iPhone15,2', 'com.qcwireless.qring', 'QRing')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.movano.evie', 'Evie')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.ejemplo.salud', 'Smart Ring')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.ejemplo.spring', 'Spring')).toBe('telefono');
    // Da Rings, con cualquier forma de escribirlo.
    expect(tipoDeFuente('iPhone15,2', 'com.moyoung.ejemplo', 'Da Rings')).toBe('otra');
    expect(tipoDeFuente('iPhone15,2', 'com.ejemplo.salud', 'DaRings')).toBe('otra');
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

  it('la noche de un anillo en dos tramos, como la escribe en Salud, es una sola noche (18/11/2026)', () => {
    const rings = { source: { name: 'Da Rings', bundleIdentifier: 'com.moyoung.darings' }, productType: 'iPhone15,2' };
    // Un tramo con etapas y otro sin, escrito un rato después (otra versión de la app), con «despierto» y «en cama» en el medio.
    const despues = { ...rings, version: '2.1' };
    const muestras: DeSalud[] = [
      sueno(0, local('2026-11-18', '00:05'), local('2026-11-18', '08:35'), iphone),
      sueno(3, local('2026-11-18', '00:16'), local('2026-11-18', '02:00'), rings),
      sueno(4, local('2026-11-18', '02:00'), local('2026-11-18', '03:10'), rings),
      sueno(5, local('2026-11-18', '03:10'), local('2026-11-18', '06:22'), rings),
      sueno(2, local('2026-11-18', '06:22'), local('2026-11-18', '06:30'), rings),
      sueno(1, local('2026-11-18', '06:30'), local('2026-11-18', '08:30'), despues),
    ];
    const [n, ...otras] = armarNoches(muestras.flatMap((m) => muestraDeSueno(m) ?? []), fuentesDe(muestras));
    expect(otras).toEqual([]);
    expect(n).toMatchObject({ clave: '2026-11-18', dormido: 366 + 120, despierto: 8, despertares: 1, siestas: 0, fuente: { id: 'com.moyoung.darings', tipo: 'otra' } });
    expect(n.intervalos[0][0]).toBe(local('2026-11-18', '00:16').getTime());
    expect(n.intervalos[n.intervalos.length - 1][1]).toBe(local('2026-11-18', '08:30').getTime());
  });

  it('las lecturas, la última de cada día y los minutos de unas sesiones', () => {
    const q = (quantity: number, desde: Date): DeSalud => ({ quantity, startDate: desde, endDate: desde, sourceRevision: reloj });
    expect(lecturasDe([q(52, local('2026-10-22', '02:00')), q(Number.NaN, local('2026-10-22', '03:00'))])).toEqual([{ en: local('2026-10-22', '02:00').getTime(), valor: 52 }]);
    expect(ultimaPorDia([q(74.9, local('2026-10-21', '07:00')), q(74.5, local('2026-10-22', '07:10')), q(74.3, local('2026-10-22', '21:00'))])).toEqual(new Map([['2026-10-21', 74.9], ['2026-10-22', 74.3]]));
    expect(minutosDe([{ startDate: local('2026-10-22', '08:00'), endDate: local('2026-10-22', '08:10'), sourceRevision: iphone }, { startDate: local('2026-10-22', '21:00'), endDate: local('2026-10-22', '21:05'), sourceRevision: iphone }])).toBe(15);
    // Los pasos con cuándo y cuántos; las muestras en cero no dicen nada.
    const p = (quantity: number, desde: Date, hasta: Date): DeSalud => ({ quantity, startDate: desde, endDate: hasta, sourceRevision: iphone });
    expect(pasosDe([p(84, local('2026-10-22', '07:02'), local('2026-10-22', '07:04')), p(0, local('2026-10-22', '03:00'), local('2026-10-22', '03:01'))]))
      .toEqual([{ desde: local('2026-10-22', '07:02').getTime(), hasta: local('2026-10-22', '07:04').getTime(), pasos: 84 }]);
  });

  it('el peso de cada día es el primero, el de la mañana; lo de antes de la hora de corte es del día anterior', () => {
    const kg = (quantity: number, desde: Date): DeSalud => ({ quantity, startDate: desde, endDate: desde, sourceRevision: iphone });
    // Pesarse por la mañana y por la noche: queda el de la mañana, aunque llegue después.
    expect(primeraPorDia([kg(71.2, local('2026-10-22', '22:30')), kg(70.0, local('2026-10-22', '07:05'))], CORTE_DE_FABRICA)).toEqual(new Map([['2026-10-22', 70.0]]));
    // A las 2, antes del corte de las 4: es del día anterior.
    expect(primeraPorDia([kg(70.4, local('2026-10-23', '02:00')), kg(70.1, local('2026-10-23', '07:00'))], CORTE_DE_FABRICA))
      .toEqual(new Map([['2026-10-22', 70.4], ['2026-10-23', 70.1]]));
    expect(primeraPorDia([kg(Number.NaN, local('2026-10-22', '07:00'))], CORTE_DE_FABRICA)).toEqual(new Map());
  });
});

describe('los entrenamientos de Salud', () => {
  const w = (tipo: number, desde: Date, hasta: Date, extra: Partial<DeSaludEntreno> = {}): DeSaludEntreno => ({ workoutActivityType: tipo, startDate: desde, endDate: hasta, ...extra });

  it('el tipo, cuándo, cuánto duró sin las pausas y las calorías activas si vienen; el día es el de Moss', () => {
    const pesas = w(50, local('2026-11-18', '18:00'), local('2026-11-18', '19:10'), { duration: { unit: 's', quantity: 3600 }, totalEnergyBurned: { unit: 'kcal', quantity: 312.6 } });
    expect(entrenoDeSalud(pesas, CORTE_DE_FABRICA)).toEqual({ dia: '2026-11-18', tipo: 50, desde: local('2026-11-18', '18:00').getTime(), hasta: local('2026-11-18', '19:10').getTime(), minutos: 60, kcal: 313 });
    // Sin duración ni calorías: de punta a punta y sin kcal. A la 1, antes del corte de las 4, es del día anterior.
    expect(entrenoDeSalud(w(37, local('2026-11-19', '01:00'), local('2026-11-19', '01:40')), CORTE_DE_FABRICA)).toMatchObject({ dia: '2026-11-18', minutos: 40, kcal: null });
    expect(entrenoDeSalud(w(37, local('2026-11-18', '10:00'), local('2026-11-18', '10:00')), CORTE_DE_FABRICA)).toBeNull();
  });

  it('cuenta como entrenar desde 10 minutos, salvo caminar, enfriar, recuperarse y mente y cuerpo', () => {
    const de = (tipo: number, minutos: number) => entrenoDeSalud(w(tipo, local('2026-11-18', '08:00'), new Date(local('2026-11-18', '08:00').getTime() + minutos * 60_000)), CORTE_DE_FABRICA)!;
    expect([de(37, 30), de(50, 9), de(52, 45), de(80, 15), de(33, 20), de(29, 20), de(63, 10)].map(cuentaComoEntrenar)).toEqual([true, false, false, false, false, false, true]);
    const lista = [de(50, 60), de(52, 45), entrenoDeSalud(w(37, local('2026-11-18', '07:00'), local('2026-11-18', '07:30')), CORTE_DE_FABRICA)!, entrenoDeSalud(w(37, local('2026-11-17', '07:00'), local('2026-11-17', '07:30')), CORTE_DE_FABRICA)!];
    expect(entrenosDelDia(lista, '2026-11-18').map((e) => [e.tipo, e.minutos])).toEqual([[37, 30], [50, 60]]);
    expect(entrenosDelDia(undefined, '2026-11-18')).toEqual([]);
  });
});
