// Los pesos de la sección de Ascent en la unidad de cada uno (spec/bugs.md, 25): llegan y se guardan en kg; con el
// sistema imperial se dicen en libras. En español (es-UY).

import { describe, expect, it, jest } from '@jest/globals';

import { t } from '@/textos';
import { buscarEjercicios, enLaUnidad, enLista, kilosDeLaMeta, ladoDe, nivelEn, pesoEn, siguienteEn } from './palabras';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));

// 135 lb anotadas en Ascent llegan como 61,23 kg (la base redondea a la centésima).
const LB135 = 61.23;

describe('los pesos de Ascent con el sistema métrico', () => {
  it('no cambian', () => {
    expect(pesoEn(61.25, 'metrico')).toBe(61.25);
    expect(siguienteEn(60, 'metrico')).toBe(62.5);
    expect(siguienteEn(10, 'metrico')).toBe(11);
    expect(siguienteEn(0, 'metrico')).toBeNull();
    expect(nivelEn(101.3, 'metrico')).toBe(100);
    // Para abajo: con 98,6 kg no dice 100 al lado de una meta de 100.
    expect(nivelEn(98.6, 'metrico')).toBe(97.5);
    expect(nivelEn(100, 'metrico')).toBe(100);
    expect(kilosDeLaMeta('62,5', 'metrico')).toBe(62.5);
    expect(enLaUnidad(t('ascent.tus.proxima.subirA', { kg: '62,5' }), 'metrico')).toBe('Próxima vez: sube a 62,5 kg.');
  });
});

describe('los pesos de Ascent con el sistema imperial', () => {
  it('lo cargado va en libras, al medio como en Ascent: lo anotado en libras vuelve igual', () => {
    expect(pesoEn(LB135, 'imperial')).toBe(135);
    expect(pesoEn(60, 'imperial')).toBe(132.5);
  });

  it('la próxima vez sube 5 lb en la barra y 2,5 lb debajo de 20 kg, nunca lo mismo', () => {
    expect(siguienteEn(LB135, 'imperial')).toBe(140);
    expect(siguienteEn(60, 'imperial')).toBe(137.5);
    // Una mancuerna de 20 lb (9,07 kg): el kilo de más eran 2,2 lb, y redondeado de a 5 volvía a 20.
    expect(siguienteEn(9.07, 'imperial')).toBe(22.5);
    expect(siguienteEn(0, 'imperial')).toBeNull();
  });

  it('el nivel de hoy de una meta va de a 5 lb para abajo, como los 2,5 kg', () => {
    expect(nivelEn(101.3, 'imperial')).toBe(220);
  });

  it('la meta nueva se escribe en libras y se guarda en kilos', () => {
    const kg = kilosDeLaMeta('225', 'imperial');
    expect(kg).toBeCloseTo(102.06, 2);
    expect(pesoEn(kg, 'imperial')).toBe(225);
    expect(kilosDeLaMeta('', 'imperial')).toBe(0);
  });

  it('los textos dicen lb', () => {
    expect(enLaUnidad(t('ascent.tus.proxima.subirA', { kg: '140' }), 'imperial')).toBe('Próxima vez: sube a 140 lb.');
    expect(enLaUnidad(t('ascent.estancamiento.marca', { kg: '135', reps: 5 }), 'imperial')).toBe('135 lb × 5');
    expect(enLaUnidad(t('ascent.metas.objetivoVarias', { kg: '225', reps: 3 }), 'imperial')).toBe('Levantar 225 lb 3 veces');
  });
});

describe('lo que se anota por mancuerna o por lado', () => {
  it('se dice así, con la mitad: los kilos de Ascent y los de la meta van en total', () => {
    expect(ladoDe({ id: 'press_militar_mancuernas', carga: 'par' })).toBe('porMancuerna');
    expect(ladoDe({ id: 'prensa_una_pierna', carga: 'una' })).toBe('porLado');
    // Dos poleas no son dos mancuernas.
    expect(ladoDe({ id: 'cruce_polea_alta', carga: 'par' })).toBe('porLado');
    expect(enLaUnidad(t('ascent.metas.objetivoVarias', { kg: '35', reps: 8 }), 'metrico', 'porMancuerna')).toBe('Levantar 35 kg por mancuerna 8 veces');
    expect(enLaUnidad(t('ascent.metas.nivelKg', { kg: '60' }), 'imperial', 'porLado')).toBe('Hoy podrías levantar cerca de 60 lb por lado (estimado)');
    // Con 27,5 kg por mancuerna la próxima vez son 30; sobre el total (55) daba 57,5, que en mancuernas no existe.
    expect(siguienteEn(55 / 2, 'metrico')).toBe(30);
    expect(enLaUnidad(t('ascent.tus.proxima.subirA', { kg: '30' }), 'metrico', 'porMancuerna')).toBe('Próxima vez: sube a 30 kg por mancuerna.');
  });

  it('en total lo de la barra y la máquina, y todo mientras la base no manda cómo se anotó', () => {
    expect(ladoDe({ id: 'press_banca', carga: 'total' })).toBeNull();
    expect(ladoDe({ id: 'dominadas_lastradas', carga: 'lastre' })).toBeNull();
    expect(ladoDe({ id: 'press_militar_mancuernas' })).toBeNull();
    expect(enLaUnidad(t('ascent.metas.objetivoUna', { kg: '100' }), 'metrico')).toBe('Levantar 100 kg una vez');
  });
});

describe('buscar el ejercicio de una meta, como en Ascent', () => {
  const lista = [
    { id: 'press_banca', ejercicio: 'press_banca', grupo: 'pecho' as const },
    { id: 'press_inclinado', ejercicio: 'press_inclinado', grupo: 'pecho' as const },
    { id: 'propio_1', ejercicio: 'Press inclinado en máquina', grupo: 'pecho' as const },
    { id: 'press_militar', ejercicio: 'press_militar', grupo: 'hombros' as const },
    { id: 'propio_2', ejercicio: 'Súper curl', grupo: 'brazos' as const },
    { id: 'curl_barra', ejercicio: 'curl_barra', grupo: 'brazos' as const },
  ];
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

  it('coinciden los que tienen todas las palabras, sin importar acentos ni mayúsculas; también los propios', () => {
    const r = buscarEjercicios(lista, 'MAQUINA press');
    expect(ids(r.coinciden)).toEqual(['propio_1']);
    // «Entrenan lo mismo»: los demás de su grupo.
    expect(ids(r.parecidos)).toEqual(['press_banca', 'press_inclinado']);
  });

  it('primero los que empiezan con lo escrito, y el nombre del grupo también cuenta', () => {
    expect(ids(buscarEjercicios(lista, 'curl').coinciden)).toEqual(['curl_barra', 'propio_2']);
    expect(ids(buscarEjercicios(lista, 'hombros').coinciden)).toEqual(['press_militar']);
  });

  it('sin texto, nada', () => {
    expect(buscarEjercicios(lista, '  ')).toEqual({ coinciden: [], parecidos: [] });
  });
});

describe('una lista de músculos', () => {
  it('lleva «e» delante de i o hi, y «y» delante de hie', () => {
    expect(enLista(['cuádriceps', 'glúteos', 'isquios'])).toBe('cuádriceps, glúteos e isquios');
    expect(enLista(['pecho', 'hombros'])).toBe('pecho y hombros');
    expect(enLista(['pecho', 'hierro'])).toBe('pecho y hierro');
    expect(enLista(['pecho'])).toBe('pecho');
  });
});
