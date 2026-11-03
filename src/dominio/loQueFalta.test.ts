import { describe, expect, it } from '@jest/globals';

import { ATRASO_MAXIMO, avisosDelDia } from './avisos';
import { AGUA_META_ML, bajoAlFinal, CALORIAS_BAJAS, ESPERA_DE_LA_TARDE, horaDeLaTarde, loQueFaltaHoy, PROTEINA_BAJA, type DeHoy } from './loQueFalta';
import { sumarDias } from './fechas';
import type { Habito } from './habitos';

const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};
const META = { kcal: 2200, proteina: 150, carbohidratos: 250, grasas: 70 };
const macros = (kcal: number, proteina: number) => ({ kcal, proteina, carbohidratos: 0, grasas: 0 });
// Un día par, contando desde el 5 de enero de 2026, y su siguiente, impar.
const PAR = '2026-10-22';
const IMPAR = sumarDias(PAR, 1);
const base = (extra: Partial<DeHoy> = {}): DeHoy => ({
  dia: PAR, ahora: h('12:00'), meta: META, comido: macros(900, 50), anotadas: { desayuno: h('8:00'), almuerzo: h('12:00') },
  horaDeCena: h('21:00'), acostarse: h('23:30'), comidasHabituales: 3, ...extra,
});
const deNoche = (extra: Partial<DeHoy> = {}) => base({
  ahora: h('21:30'), comido: macros(1700, 110), comidoALaTarde: macros(1100, 90), anotadas: { desayuno: h('8:00'), almuerzo: h('12:00'), cena: h('21:10') }, ...extra,
});

describe('a la tarde', () => {
  it('si va a faltar mucha proteína aun con la cena, dos horas antes de cenar, con todo lo que falta', () => {
    const [uno, ...resto] = loQueFaltaHoy(base());
    expect(resto).toEqual([]);
    expect(uno.minutos).toBe(h('19:00'));
    expect(uno.falta).toMatchObject({ que: 'proteina', cuanto: 100 });
    expect(uno.falta.ideas.length).toBeGreaterThan(0);
  });

  it('si la cena alcanza, no hay nada que avisar', () => {
    expect(loQueFaltaHoy(base({ comido: macros(1200, 90) }))).toEqual([]);
  });

  it('nunca antes de las 16:30, aunque se cene temprano', () => {
    expect(loQueFaltaHoy(base({ horaDeCena: h('18:00') }))[0].minutos).toBe(h('16:30'));
  });

  it('con merienda, una comida más que todavía puede dar lo suyo', () => {
    expect(loQueFaltaHoy(base({ comidasHabituales: 4, comido: macros(900, 60) }))).toEqual([]);
  });

  it('lo planificado cuenta: si la cena planeada lo resuelve, nada', () => {
    expect(loQueFaltaHoy(base({ comido: macros(1600, 130), planeadas: new Set(['cena']) }))).toEqual([]);
  });

  it('sin lugar en las calorías, no pide comer más', () => {
    expect(loQueFaltaHoy(base({ comido: macros(2150, 50) }))).toEqual([]);
  });

  it('la hora de la tarde es la misma para todos: dos horas antes de la cena, no antes de las 16:30', () => {
    expect([horaDeLaTarde(h('21:00')), horaDeLaTarde(h('20:30')), horaDeLaTarde(h('18:00'))]).toEqual([h('19:00'), h('18:30'), h('16:30')]);
  });

  it('pasada su hora sigue un rato, porque otro aviso pudo correrlo: lo que ya sonó lo saca avisosDelDia', () => {
    expect(ESPERA_DE_LA_TARDE).toBe(ATRASO_MAXIMO);
    expect(loQueFaltaHoy(base({ ahora: h('19:05') }))[0].minutos).toBe(h('19:00'));
    expect(loQueFaltaHoy(base({ ahora: h('19:00') + ESPERA_DE_LA_TARDE }))).toEqual([]);
    // Cena a las 20, así que a las 18; los pasos avisan a las 18 y lo que falta espera a las 18:20.
    const pasos: Habito = { id: 'pasos', nombre: 'Pasos', icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' };
    const suena = (ahora: string) => avisosDelDia({
      dia: PAR, ahora: h(ahora), ajustes: { habitos: [{ habito: 'pasos', cuando: { tipo: 'hora', minutos: h('18:00') }, dias: [] }] }, habitos: [pasos], sueno: null,
      horaDeComida: () => h('20:00'), faltas: loQueFaltaHoy(base({ ahora: h(ahora), horaDeCena: h('20:00') })),
    }).map((n) => [n.minutos, n.aviso.id]);
    expect(suena('17:00')).toEqual([[h('18:00'), 'habito:pasos:0'], [h('18:20'), 'falta:proteina']]);
    // A las 18:05 se reprograma: todavía no sonó, y sigue a las 18:20.
    expect(suena('18:05')).toEqual([[h('18:20'), 'falta:proteina']]);
    expect(suena('18:25')).toEqual([]);
  });
});

describe('a la noche', () => {
  it('después de anotar la cena, con lo que falta', () => {
    const lista = loQueFaltaHoy(deNoche());
    expect(lista).toHaveLength(1);
    expect(lista[0].minutos).toBe(h('22:15'));
    expect(lista[0].falta).toMatchObject({ que: 'proteina', cuanto: 40 });
  });

  it('sin la cena anotada, no se sabe: nada', () => {
    expect(loQueFaltaHoy(deNoche({ anotadas: { desayuno: h('8:00') } }))).toEqual([]);
  });

  it('nunca a menos de media hora de ir a la cama', () => {
    expect(loQueFaltaHoy(deNoche({ acostarse: h('22:30') }))).toEqual([]);
    // Sin hora de la cama, hasta las 23:30.
    expect(loQueFaltaHoy(deNoche({ acostarse: null }))).toHaveLength(1);
    expect(loQueFaltaHoy(deNoche({ acostarse: null, horaDeCena: h('23:00') }))).toEqual([]);
  });

  it('un rato después de anotar, si cenó tarde', () => {
    expect(loQueFaltaHoy(deNoche({ anotadas: { cena: h('21:50') } }))[0].minutos).toBe(h('22:35'));
  });

  it('no repite lo que ya dijo a la tarde; si están bajas las calorías, dice eso', () => {
    // A las 19 ya faltaba proteína aun con la cena, así que a esa hora avisó.
    const dijo = { comidoALaTarde: macros(500, 40) };
    expect(loQueFaltaHoy(deNoche({ ...dijo, comido: macros(1900, 110) }))).toEqual([]);
    const lista = loQueFaltaHoy(deNoche({ ...dijo, comido: macros(1500, 100) }));
    expect(lista).toHaveLength(1);
    expect(lista[0].falta).toMatchObject({ que: 'calorias', cuanto: 700 });
  });

  it('como mucho dos por día, y cada uno de algo distinto', () => {
    const lista = loQueFaltaHoy(base({ anotadas: { desayuno: h('8:00'), cena: h('15:00') }, comido: macros(900, 50), agua: null }));
    expect(lista.length).toBeLessThanOrEqual(2);
    expect(new Set(lista.map((x) => x.falta.que)).size).toBe(lista.length);
    expect(lista.map((x) => x.falta.que)).toEqual(['proteina', 'calorias']);
  });
});

describe('sin molestar', () => {
  it('sin nada anotado hoy, nada: no reta a quien no anota', () => {
    expect(loQueFaltaHoy(base({ anotadas: {}, comido: macros(0, 0) }))).toEqual([]);
  });

  it('con «sin déficit», nunca', () => {
    expect(loQueFaltaHoy(base({ sinDeficit: true }))).toEqual([]);
    expect(loQueFaltaHoy(deNoche({ sinDeficit: true }))).toEqual([]);
  });

  it('si ayer quedó igual de bajo, día por medio', () => {
    expect(loQueFaltaHoy(base({ bajoAyer: ['proteina'] }))).toHaveLength(1);
    expect(loQueFaltaHoy(base({ dia: IMPAR, bajoAyer: ['proteina'] }))).toEqual([]);
    expect(loQueFaltaHoy(base({ dia: IMPAR, bajoAyer: ['calorias'] }))).toHaveLength(1);
  });

  it('lo que falta se redondea: 5 g, 50 kcal', () => {
    expect(loQueFaltaHoy(deNoche({ comido: macros(1700, 113) }))[0].falta.cuanto).toBe(35);
    expect(loQueFaltaHoy(deNoche({ comidoALaTarde: macros(500, 40), comido: macros(1490, 100) }))[0].falta.cuanto).toBe(700);
  });

  it('sin números, lo marca para que el texto no los diga', () => {
    expect(loQueFaltaHoy(base({ sinNumeros: true }))[0].falta.sinNumeros).toBe(true);
  });
});

describe('las ideas', () => {
  const POLLO = { nombre: 'Pechuga de pollo', proteina: 45, kcal: 240 };
  const YOGUR = { nombre: 'Yogur griego', proteina: 15, kcal: 130 };
  const ALFAJOR = { nombre: 'Alfajor', proteina: 3, kcal: 200, azucares: 25 };
  const CERVEZA = { nombre: 'Cerveza', proteina: 1, kcal: 150, alcohol: 15 };

  it('primero lo que comes, con una sola si alcanza', () => {
    expect(loQueFaltaHoy(deNoche({ propios: [POLLO] }))[0].falta).toMatchObject({ ideas: [{ nombre: 'Pechuga de pollo' }], alcanza: true });
  });

  it('si no alcanza, otra que complete, y entonces lo resuelven', () => {
    const f = loQueFaltaHoy(deNoche({ propios: [YOGUR, { nombre: 'Atún al natural', proteina: 25, kcal: 120 }] }))[0].falta;
    expect(f.ideas).toHaveLength(2);
    expect(f.alcanza).toBe(true);
  });

  it('nada de lo dulce o con alcohol: con esos, la lista', () => {
    const f = loQueFaltaHoy(deNoche({ propios: [ALFAJOR, CERVEZA] }))[0].falta;
    expect(f.ideas.every((i) => 'id' in i)).toBe(true);
  });

  it('cada día, otra', () => {
    const ideas = new Set(Array.from({ length: 6 }, (_, i) => JSON.stringify(loQueFaltaHoy(deNoche({ dia: sumarDias(PAR, i) }))[0]?.falta.ideas)));
    expect(ideas.size).toBeGreaterThan(2);
    const formas = new Set(Array.from({ length: 6 }, (_, i) => loQueFaltaHoy(deNoche({ dia: sumarDias(PAR, i) }))[0]?.falta.forma));
    expect(formas.size).toBeGreaterThan(2);
  });

  it('la lista respeta tu dieta y tus alergias', () => {
    for (let i = 0; i < 8; i++) {
      const dia = sumarDias(PAR, i);
      const vegana = JSON.stringify(loQueFaltaHoy(deNoche({ dia, dieta: 'vegana' }))[0]?.falta.ideas);
      expect(vegana).not.toMatch(/pollo|atun|huevos|leche|yogur/i);
      const sinHuevo = JSON.stringify(loQueFaltaHoy(deNoche({ dia, alergias: ['huevo', 'pescado'] }))[0]?.falta.ideas);
      expect(sinHuevo).not.toMatch(/huevos|atun/i);
    }
  });

  it('lo propuesto tiene que entrar en las calorías que quedan', () => {
    const f = loQueFaltaHoy(deNoche({ propios: [POLLO, YOGUR], comido: macros(2050, 110) }))[0].falta;
    expect(f.ideas).toEqual([{ nombre: 'Yogur griego' }]);
    expect(f.alcanza).toBe(false);
  });
});

describe('el agua', () => {
  it('solo para quien la anota, a la tarde y si no hay proteína que avisar', () => {
    const conProteina = base({ comido: macros(1200, 90), agua: { ml: 500 } });
    expect(loQueFaltaHoy(conProteina)[0].falta).toMatchObject({ que: 'agua', cuanto: 6, ideas: [] });
    expect(loQueFaltaHoy(base({ comido: macros(1200, 90), agua: null }))).toEqual([]);
    expect(loQueFaltaHoy(base({ comido: macros(1200, 90), agua: { ml: AGUA_META_ML * 0.5 } }))).toEqual([]);
    expect(loQueFaltaHoy(base({ agua: { ml: 500 } }))[0].falta.que).toBe('proteina');
  });
});

describe('cómo quedó un día', () => {
  it('muy bajo en lo que falta, y sin anotar nada, nada', () => {
    expect(bajoAlFinal(META, macros(META.kcal - CALORIAS_BAJAS - 50, META.proteina - PROTEINA_BAJA))).toEqual(['proteina', 'calorias']);
    expect(bajoAlFinal(META, macros(META.kcal, META.proteina))).toEqual([]);
    expect(bajoAlFinal(META, macros(0, 0))).toEqual([]);
  });
});
