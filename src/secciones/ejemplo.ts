// La persona de ejemplo, la de la galería (galeria/src/datos.js), con las fechas corridas a hoy:
// Progreso y Sueño la muestran, con un aviso, mientras no hay datos propios ni Salud conectada.
// Quiere bajar a 71 kg y empezó hace siete semanas; tiene cuatro semanas de noches del reloj y del
// iPhone, con una noche sin nada, una sin reloj, una cortada y una siesta, para ver cómo se muestra
// lo que falta. No se guarda en ningún lado.

import type { Peso } from '@/dominio/control';
import type { Medidas } from '@/dominio/cuerpo';
import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia } from '@/dominio/fechas';
import type { Perfil } from '@/dominio/metas';
import { armarNoches, soloEnCama, type Fuente, type Medida, type Muestra, type Noche } from '@/dominio/sueno';

export type Ejemplo = {
  perfil: Perfil;
  pesos: Peso[];
  medidas: Medidas[];
  /** El gasto del control anterior, del que parte el de esta semana. */
  gastoAnterior: number;
  inicio: ClaveDia;
  fuentes: Fuente[];
  noches: Noche[];
  soloEnCama: ReturnType<typeof soloEnCama>;
  lecturas: { frecuencia: Medida[]; variabilidad: Medida[]; respiracion: Medida[]; reposo: Map<ClaveDia, number> };
};

// Un azar que sale igual cada vez.
const azar = (semilla: number) => {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

let guardado: { hoy: ClaveDia; ejemplo: Ejemplo } | undefined;

/** El ejemplo de hoy: se arma una vez por día. */
export function ejemplo(hoy: ClaveDia): Ejemplo {
  if (guardado?.hoy !== hoy) guardado = { hoy, ejemplo: armar(hoy) };
  return guardado.ejemplo;
}

function armar(hoy: ClaveDia): Ejemplo {
  const inicio = sumarDias(hoy, -51);
  const perfil: Perfil = {
    sexo: 'm', nacimiento: Number(hoy.slice(0, 4)) - 31, alturaCm: 178, actividad: 'activo', objetivo: 'bajar', ritmo: 'recomendado',
    estilo: 'equilibrada', pesoMeta: 71, actualizado: `${inicio}T08:00:00.000Z`,
  };

  // Siete semanas bajando unos 380 g por semana, con el ruido de todos los días. Casi nunca se pesa
  // los domingos, y hoy todavía no se pesó.
  const r = azar(5);
  const pesos: Peso[] = [];
  for (let d = 0; d < diasEntre(inicio, hoy); d++) {
    const fecha = sumarDias(inicio, d);
    const dia = diaDeLaSemana(fecha);
    const salta = (dia === 0 && r() < 0.8) || r() < 0.1;
    const kg = 77.3 - 0.055 * d + (r() - 0.5) * 0.7 + (dia === 1 ? 0.3 : 0);
    if (!salta) pesos.push({ fecha, kg: Math.round(kg * 10) / 10, origen: 'salud', momento: `${fecha}T07:20:00.000Z` });
  }

  // Tres veces con la cinta, cada tres semanas.
  const medidas: Medidas[] = [
    { fecha: inicio, cintura: 88.5, cuello: 38.5, cadera: 99, brazo: 34, pecho: 103, muslo: 58.5 },
    { fecha: sumarDias(inicio, 21), cintura: 87, cuello: 38.5, cadera: 98, brazo: 33.5, pecho: 101.5, muslo: 58 },
    { fecha: sumarDias(inicio, 42), cintura: 85.5, cuello: 38, cadera: 97, brazo: 33.5, pecho: 100.5, muslo: 57.5 },
  ].map((m) => ({ ...m, actualizado: `${m.fecha}T08:00:00.000Z` }));

  // ------------------------------------------------------------ las noches, como las trae Salud
  const zona = -new Date().getTimezoneOffset();
  const fuentes: Fuente[] = [{ id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' }, { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' }];
  const sinNada = sumarDias(hoy, -11);
  const sinReloj = sumarDias(hoy, -4);
  const cortada = sumarDias(hoy, -17);
  // Un instante a una hora local, en minutos desde las 18 del día anterior a la clave.
  const instante = (clave: ClaveDia, minuto: number) => Date.parse(`${clave}T00:00:00.000Z`) - 6 * 3_600_000 - zona * 60_000 + minuto * 60_000;
  const s = azar(31);
  const muestras: Muestra[] = [];
  const lecturas: Ejemplo['lecturas'] = { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() };
  for (let i = 27; i >= 0; i--) {
    const clave = sumarDias(hoy, -i);
    const dia = diaDeLaSemana(clave);
    const finde = dia === 6 || dia === 0;
    const anoche = i === 0;
    const dormirse = anoche ? 341 : 330 + (finde ? 70 : 0) + Math.round((s() - 0.5) * 40);
    const despertar = anoche ? 793 : 785 + (finde ? 85 : 0) + Math.round((s() - 0.5) * 30);
    lecturas.reposo.set(clave, Math.round(55 + (s() - 0.5) * 4));
    if (clave === sinNada) continue;
    muestras.push({ etapa: 'enCama', desde: instante(clave, dormirse - 12 - Math.round(s() * 15)), hasta: instante(clave, despertar + 6 + Math.round(s() * 10)), fuente: 'iphone', zona });
    if (clave === sinReloj) continue;
    const fin = clave === cortada ? 510 : despertar;
    // Los ciclos: núcleo, profundo (cada vez menos), núcleo y REM (cada vez más), con algún despertar.
    let t = dormirse;
    let ciclo = 0;
    const despertares = anoche ? [178, 395] : [Math.round(150 + s() * 120), Math.round(320 + s() * 120)].slice(0, 1 + Math.floor(s() * 2));
    const poner = (etapa: Muestra['etapa'], minutos: number) => {
      const hasta = Math.min(fin, t + minutos);
      if (hasta > t) muestras.push({ etapa, desde: instante(clave, t), hasta: instante(clave, hasta), fuente: 'reloj', zona });
      t = hasta;
    };
    while (t < fin) {
      const profundo = Math.max(4, 38 - ciclo * 11 + Math.round((s() - 0.5) * 10));
      const rem = Math.min(48, 12 + ciclo * 9 + Math.round((s() - 0.5) * 8));
      poner('nucleo', 24 + Math.round(s() * 12));
      poner('profundo', profundo);
      poner('nucleo', 16 + Math.round(s() * 10));
      if (despertares.length && t - dormirse >= despertares[0]) {
        despertares.shift();
        poner('despierto', anoche ? 9 : 2 + Math.round(s() * 10));
      }
      poner('rem', rem);
      ciclo++;
    }
    for (let m = dormirse + 5; m < fin; m += 7) lecturas.frecuencia.push({ en: instante(clave, m), valor: Math.round(51 + Math.sin(m / 40) * 2 + (s() - 0.5) * 3 + (anoche ? 1.5 : 0)) });
    for (let m = dormirse + 40; m < fin; m += 95 + Math.round(s() * 40)) lecturas.variabilidad.push({ en: instante(clave, m), valor: Math.round(47 + (s() - 0.5) * 16 - (anoche ? 4 : 0)) });
    for (let m = dormirse + 20; m < fin; m += 30) lecturas.respiracion.push({ en: instante(clave, m), valor: Math.round((14.2 + (s() - 0.5) * 1.2) * 10) / 10 });
  }
  // Una siesta, hace tres días.
  const siesta = sumarDias(hoy, -3);
  muestras.push({ etapa: 'nucleo', desde: instante(siesta, 21 * 60 + 20), hasta: instante(siesta, 21 * 60 + 55), fuente: 'reloj', zona });
  const noches = armarNoches(muestras, fuentes);
  return { perfil, pesos, medidas, gastoAnterior: 3000, inicio, fuentes, noches, soloEnCama: soloEnCama(muestras, fuentes, noches), lecturas };
}
