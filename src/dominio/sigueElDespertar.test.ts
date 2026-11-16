import { describe, expect, it } from '@jest/globals';

import { horasDeSueno, SEPARACION, textoDelAviso, tituloDelAviso, type Avisos, type Notificacion, type ParaElTexto, type Sueno } from './avisos';
import type { Comida } from './comidas';
import type { Habito } from './habitos';
import {
  avisosDelDespertar, avisosQueSiguenElDespertar, DE_FABRICA, deFabrica, despertarDelDia, MAS, MAXIMO_QUE_SIGUE_EL_DESPERTAR, MELATONINA, REVOLUCIONES,
  type DeSigueElDespertar,
} from './sigueElDespertar';
import es from '../textos/es.json';
import en from '../textos/en.json';

const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};
/** En la cuenta de las noches, desde las 18 del día anterior. */
const n = (texto: string) => (h(texto) + 6 * 60) % (24 * 60);

const VIERNES = '2026-10-23';
// Se duerme a las 23:15 y se despierta a las 7:30; necesita 8 h, media hora despierta en la noche, tarda 15
// minutos en dormirse y tiene 1 h 30 min de deuda (ayer, 2 h 20 min).
const SUENO: Sueno = { habitual: () => ({ dormirse: n('23:15'), despertar: n('7:30') }), necesidad: 480, deuda: 90, despierto: 30, latencia: 15 };
const conDespertar = (despertar: number | null): Sueno => ({ ...SUENO, despertarReal: (d) => (d === VIERNES ? despertar : null) });
const HORARIO = { desayuno: h('7:30'), almuerzo: h('13:00'), merienda: h('17:00'), cena: h('20:30') };
const HORA: Record<Comida, number> = { ...HORARIO, snack: h('16:00') };
const META = { kcal: 2400, proteina: 150, carbohidratos: 280, grasas: 75 };
const NADA = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
const AJUSTES: Avisos = deFabrica({ pesarse: { encendido: true, todos: true }, horario: HORARIO }, (c) => HORA[c]);
const MEDITAR: Habito = { id: 'meditar', nombre: 'meditar', icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' };

const dia = (extra: Partial<DeSigueElDespertar & { ahora: number; habitos: Habito[] }> = {}): Notificacion[] =>
  avisosQueSiguenElDespertar({
    dia: VIERNES, ajustes: AJUSTES, habitos: [], sueno: conDespertar(h('10:00')), horaDeComida: (c) => HORA[c],
    deudaAntes: 140, meta: META, comido: NADA, ...extra,
  });
const ids = (lista: Notificacion[]) => lista.map((x) => x.aviso.id);
const aLa = (lista: Notificacion[], id: string) => lista.find((x) => x.aviso.id === id)?.minutos;

type Rama = { [k: string]: string | Rama };
const palabras = (idioma: Rama) => (clave: string, valores: Record<string, string | number> = {}) => {
  const hoja = clave.split('.').reduce<string | Rama>((o, k) => (o as Rama)[k], idioma);
  if (typeof hoja !== 'string') throw new Error(`Falta ${clave}`);
  return hoja.replace(/\{(\w+)\}/g, (_, k) => {
    if (valores[k] === undefined) throw new Error(`Falta {${k}} en ${clave}`);
    return String(valores[k]);
  });
};
const duracion = (m: number) => (m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);
const ES = es as unknown as Rama;
const EN = en as unknown as Rama;
const para = (idioma: Rama): ParaElTexto => ({ t: palabras(idioma), habito: () => '', plan: () => '', duracion });
const dice = (x: Notificacion | undefined, idioma: Rama = ES) => (x ? textoDelAviso(x, para(idioma)) : '');

describe('la mañana espera a tu despertar', () => {
  it('mientras no se sabe a qué hora te despertaste, no suena nada de la mañana', () => {
    const lista = dia({ sueno: conDespertar(null), ajustes: { ...AJUSTES, habitos: [{ habito: 'meditar', cuando: { tipo: 'despertar', despues: 15 }, dias: [] }] }, habitos: [MEDITAR] });
    for (const id of ['deuda', 'pesarse', 'desayuno', 'horario:desayuno', 'habito:meditar:0']) expect(ids(lista)).not.toContain(id);
    // El almuerzo y la noche sí: no dependen de la mañana.
    expect(ids(lista)).toEqual(expect.arrayContaining(['horario:almuerzo', 'melatonina', 'dormir']));
  });

  it('con el despertar, de a uno: la deuda, pesarse y «¿Desayunas hoy?», en lugar de la hora del desayuno', () => {
    const lista = dia();
    expect([aLa(lista, 'deuda'), aLa(lista, 'pesarse'), aLa(lista, 'desayuno')]).toEqual([h('10:00'), h('10:20'), h('10:40')]);
    expect(ids(lista)).not.toContain('horario:desayuno');
    expect(lista.find((x) => x.aviso.id === 'desayuno')?.aviso.comida).toBe('desayuno');
    // Los hábitos de al despertar cuentan desde el despertar de verdad.
    const conHabito = dia({ ajustes: { ...AJUSTES, habitos: [{ habito: 'meditar', cuando: { tipo: 'despertar', despues: 15 }, dias: [] }] }, habitos: [MEDITAR] });
    expect(aLa(conHabito, 'habito:meditar:0')).toBeGreaterThanOrEqual(h('10:00'));
  });

  it('sin la deuda prendida, pesarse va como siempre, a los 10 minutos; si ya desayunaste, ni pesarse ni la pregunta', () => {
    const sinDeuda = dia({ ajustes: { ...AJUSTES, deuda: { encendido: false } } });
    expect(ids(sinDeuda)).not.toContain('deuda');
    expect(aLa(sinDeuda, 'pesarse')).toBe(h('10:10'));
    const desayuno = dia({ anotadas: new Set(['desayuno']), eventos: { desayuno: h('10:30') } });
    expect(ids(desayuno)).not.toContain('pesarse');
    expect(ids(desayuno)).not.toContain('desayuno');
  });

  it('pesarse sigue siendo lo que elegiste: el día del control o todos', () => {
    expect(ids(dia({ ajustes: { ...AJUSTES, pesarse: { encendido: true } } }))).not.toContain('pesarse');
    expect(dia({ ajustes: { ...AJUSTES, pesarse: { encendido: true } }, diaDelControl: 5 }).find((x) => x.aviso.id === 'pesarse')?.aviso.control).toBe(true);
    expect(ids(dia({ ajustes: { ...AJUSTES, pesarse: undefined } }))).not.toContain('pesarse');
  });

  it('la deuda, en una línea y sin festejar: bajó, subió, sigue o no hay', () => {
    const deuda = (ahora: number, antes: number | null) =>
      dice(dia({ sueno: { ...conDespertar(h('10:00')), deuda: ahora }, deudaAntes: antes }).find((x) => x.aviso.id === 'deuda'));
    expect(deuda(90, 140)).toBe('Tu deuda de sueño bajó a 1 h 30 min.');
    expect(deuda(120, 90)).toBe('Tu deuda de sueño subió a 2 h.');
    // A la media hora, como en Sueño: 80 y 95 son lo mismo.
    expect(deuda(80, 95)).toBe('Tu deuda de sueño sigue en 1 h 30 min.');
    expect(deuda(0, 60)).toBe('Tu deuda de sueño bajó a cero.');
    expect(deuda(0, 0)).toBe('No tienes deuda de sueño.');
    expect(deuda(60, null)).toBe('Tu deuda de sueño es de 1 h.');
    // Sin datos de la deuda, no hay aviso.
    expect(ids(dia({ sueno: { ...conDespertar(h('10:00')), deuda: null } }))).not.toContain('deuda');
  });
});

describe('sin desayuno, lo del desayuno se reparte', () => {
  it('«Voy directo al almuerzo»: lo del día entre el almuerzo, la merienda y la cena, sin pasarse', () => {
    const lista = dia({ desayuno: 'directo' });
    const kcal = ['almuerzo', 'merienda', 'cena'].map((c) => {
      const x = lista.find((a) => a.aviso.id === `despertar:${c}`);
      return x?.aviso.despertar?.que === 'comida' ? x.aviso.despertar.kcal ?? 0 : 0;
    });
    expect(kcal).toEqual([1050, 450, 900]);
    expect(kcal.reduce((s, x) => s + x, 0)).toBeLessThanOrEqual(META.kcal);
    for (const c of ['almuerzo', 'merienda', 'cena']) expect(ids(lista)).not.toContain(`horario:${c}`);
    expect(dice(lista.find((a) => a.aviso.id === 'despertar:almuerzo')))
      .toBe('Hora del almuerzo: unas 1050 kcal. Lo que no comiste en el desayuno va al almuerzo, a la merienda y a la cena.');
    expect(dice(lista.find((a) => a.aviso.id === 'despertar:almuerzo'), EN))
      .toBe('Time for lunch: about 1050 kcal. What you didn’t eat at breakfast goes to lunch, your afternoon snack and dinner.');
  });

  it('la primera comida que anotas corre las demás, y lo que queda se reparte entre ellas', () => {
    const lista = dia({ desayuno: 'directo', anotadas: new Set(['almuerzo']), eventos: { almuerzo: h('13:30') }, comido: { ...NADA, kcal: 950 }, ahora: h('13:31') });
    expect(aLa(lista, 'despertar:merienda')).toBe(h('17:30'));
    expect(aLa(lista, 'despertar:cena')).toBe(h('21:00'));
    expect(dice(lista.find((a) => a.aviso.id === 'despertar:merienda'))).toBe('Hora de la merienda: unas 480 kcal. Lo que no comiste en el desayuno va a la merienda y a la cena.');
    expect(dice(lista.find((a) => a.aviso.id === 'despertar:cena'))).toBe('Hora de la cena: unas 970 kcal. Lo que no comiste en el desayuno va a la cena.');
  });

  it('con desayuno, aunque sea tarde, las demás quedan a su hora de siempre', () => {
    const lista = dia({ desayuno: 'si', anotadas: new Set(['desayuno']), eventos: { desayuno: h('10:50') }, ahora: h('10:51') });
    expect([aLa(lista, 'horario:almuerzo'), aLa(lista, 'horario:merienda'), aLa(lista, 'horario:cena')]).toEqual([h('13:00'), h('17:00'), h('20:30')]);
  });

  it('sin contestar, también si la primera que anotas es el almuerzo; con números ocultos, sin kcal', () => {
    const lista = dia({ anotadas: new Set(['almuerzo']), eventos: { almuerzo: h('13:00') }, comido: { ...NADA, kcal: 900 }, sinNumeros: true, ahora: h('13:01') });
    expect(dice(lista.find((a) => a.aviso.id === 'despertar:merienda'))).toBe('Hora de la merienda. Lo que no comiste en el desayuno va a la merienda y a la cena.');
    // Si desayunaste, cada comida a su hora, como siempre.
    expect(ids(dia({ desayuno: 'si', anotadas: new Set(['desayuno']), eventos: { desayuno: h('10:45') }, ahora: h('10:46') }))).toContain('horario:almuerzo');
  });

  it('la pregunta calla el «falta anotar» del desayuno, que con un despertar tarde sonaba mientras dormías', () => {
    const conFalta = { ...AJUSTES, comidas: ['desayuno' as const, 'cena' as const] };
    expect(ids(dia({ ajustes: conFalta }))).not.toContain('comida:desayuno');
    // Sin horario para el desayuno no hay pregunta, y el de «falta anotar» espera al despertar.
    const sinHorario = { ...conFalta, horario: { almuerzo: HORARIO.almuerzo, cena: HORARIO.cena } };
    expect(ids(dia({ ajustes: sinHorario, sueno: conDespertar(null) }))).not.toContain('comida:desayuno');
  });
});

describe('la noche sale de tu despertar y tu deuda', () => {
  it('despertarte tarde corre la cama de esta noche, la mitad de lo que te atrasaste', () => {
    const temprano = horasDeSueno(VIERNES, conDespertar(h('7:30')));
    const tarde = horasDeSueno(VIERNES, conDespertar(h('10:00')));
    expect([temprano.despertar, temprano.acostarse]).toEqual([h('7:30'), h('22:15')]);
    expect([tarde.despertar, tarde.acostarse]).toEqual([h('10:00'), h('23:15')]);
    // Despertarte temprano no la adelanta más de lo de siempre.
    expect(horasDeSueno(VIERNES, conDespertar(h('6:00'))).acostarse).toBe(h('22:15'));
  });

  it('en orden: la melatonina, las luces, bajar las revoluciones y la cama', () => {
    const lista = dia();
    expect(aLa(lista, 'melatonina')).toBe(h('23:30') - MELATONINA);
    expect(aLa(lista, 'revoluciones')).toBe(h('23:15') - REVOLUCIONES);
    // Las luces caían 15 minutos después de la melatonina: esperan a estar a SEPARACION.
    expect(aLa(lista, 'luces')).toBe(h('21:30') + SEPARACION);
    expect(aLa(lista, 'dormir')).toBe(h('22:45'));
    const noche = lista.filter((x) => x.minutos >= h('21:00')).map((x) => x.aviso.id);
    expect(noche).toEqual(['despertar:cena', 'melatonina', 'luces', 'revoluciones', 'dormir'].filter((id) => noche.includes(id)));
    expect(dice(lista.find((x) => x.aviso.id === 'melatonina'))).toBe('Más o menos ahora empieza a subir tu melatonina: a las 23:15, a la cama.');
    expect(tituloDelAviso(lista.find((x) => x.aviso.id === 'revoluciones')!, para(ES))).toBe('Baja las revoluciones');
  });

  it('las gafas y anotar lo pendiente, solo si los prendes', () => {
    expect(ids(dia())).not.toEqual(expect.arrayContaining(['gafas']));
    expect(ids(dia())).not.toContain('descarga');
    const conTodo = dia({ ajustes: { ...AJUSTES, gafas: { encendido: true }, descarga: { encendido: true }, maximoPorDia: 12 } });
    expect(aLa(conTodo, 'descarga')).toBe(h('23:10'));
    expect(aLa(conTodo, 'gafas')).toBeDefined();
  });
});

describe('las reglas de siempre', () => {
  it('lo de fábrica: la deuda, el horario, la melatonina, las revoluciones, las luces y la cama; lo demás, apagado', () => {
    const f = deFabrica({}, (c) => HORA[c]);
    expect([f.deuda, f.melatonina, f.revoluciones, f.luces, f.dormir].every((x) => x?.encendido)).toBe(true);
    expect(Object.keys(f.horario ?? {})).toEqual(['desayuno', 'almuerzo', 'cena']);
    expect([f.descarga, f.gafas, f.cafe, f.entrenarTarde, f.ultimaComida, f.pesarse]).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(f.maximoPorDia).toBe(MAXIMO_QUE_SIGUE_EL_DESPERTAR);
    // Lo que elegiste no se toca.
    expect(deFabrica({ luces: { encendido: false }, maximoPorDia: 4 }, (c) => HORA[c])).toMatchObject({ luces: { encendido: false }, maximoPorDia: 4 });
    expect([...DE_FABRICA, ...MAS]).toHaveLength(12);
  });

  it('el día entero entra en el máximo de fábrica; con 6, quedan primero la cama, la mañana y las comidas', () => {
    expect(dia({ desayuno: 'directo' })).toHaveLength(10);
    const seis = ids(dia({ desayuno: 'directo', ajustes: { ...AJUSTES, maximoPorDia: 6 } }));
    expect(seis).toHaveLength(6);
    expect(seis).toContain('dormir');
    expect(seis).not.toContain('luces');
  });

  it('nada de lo que ya pasó, y nunca dos a menos de SEPARACION', () => {
    const lista = dia({ ahora: h('11:00') });
    expect(lista.every((x) => x.minutos > h('11:00'))).toBe(true);
    const horas = dia().map((x) => x.minutos);
    horas.slice(1).forEach((m, i) => expect(m - horas[i]).toBeGreaterThanOrEqual(SEPARACION));
  });

  it('sin el día que sigue tu despertar, nada de esto', () => {
    expect(avisosDelDespertar({ dia: VIERNES, ajustes: AJUSTES, sueno: SUENO, horaDeComida: (c) => HORA[c] })).toEqual([]);
  });

  it('los textos, sin culpa y en los dos idiomas', () => {
    const todos = (o: Rama): string[] => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : todos(v)));
    for (const texto of todos((ES.recordatorios as Rama).despertar as Rama)) expect(texto).not.toMatch(/deber[ií]as|\bdebes\b|tienes que|\bvos\b|ten[ée]s/i);
    for (const texto of todos((EN.recordatorios as Rama).despertar as Rama)) expect(texto).not.toMatch(/\bshould\b|\bmust\b|have to/i);
  });
});

describe('cuándo te despertaste de verdad', () => {
  const de = (extra: Partial<Parameters<typeof despertarDelDia>[0]>) =>
    despertarDelDia({ salud: null, anclas: [], aperturas: [], corte: h('4:00'), habitual: h('7:30'), ahora: h('11:00'), ...extra });

  it('lo primero que llegó: la noche de Salud, el despertador, el atajo o abrir Moss de mañana', () => {
    expect(de({})).toBeNull();
    expect(de({ aperturas: [h('8:10')] })).toBe(h('8:10'));
    expect(de({ aperturas: [h('8:10')], salud: h('7:40') })).toBe(h('7:40'));
    expect(de({ aperturas: [h('8:10')], anclas: [h('7:20')], salud: h('7:40') })).toBe(h('7:20'));
  });

  it('abrir Moss de madrugada o pasado el mediodía no es despertarse; nada de antes del corte ni del futuro', () => {
    // Tres horas antes de lo de siempre, a las 4:30, es mirar la hora y seguir durmiendo.
    expect(de({ aperturas: [h('4:20'), h('9:00')] })).toBe(h('9:00'));
    expect(de({ aperturas: [h('13:30')], ahora: h('14:00') })).toBeNull();
    // El despertador sí, aunque sea temprano: lo paraste.
    expect(de({ anclas: [h('3:50'), h('4:30')] })).toBe(h('4:30'));
    expect(de({ salud: h('11:30') })).toBeNull();
    // Sin noches para saber lo de siempre, desde el corte.
    expect(de({ aperturas: [h('4:20')], habitual: null })).toBe(h('4:20'));
  });
});

describe('lo de la mañana, desde que Moss lo sabe', () => {
  const sabido = (cuando: number): Sueno => ({ ...conDespertar(h('8:00')), despertarSabido: (d) => (d === VIERNES ? cuando : null) });

  it('si Moss se enteró después (la noche de Salud llegó más tarde), la mañana empieza dos minutos después de saberlo', () => {
    const lista = dia({ sueno: sabido(h('8:40')) });
    expect(aLa(lista, 'deuda')).toBe(h('8:42'));
    expect(aLa(lista, 'pesarse')).toBe(h('9:02'));
    // Saberlo no corre la noche: sale de la hora en que te despertaste.
    expect(horasDeSueno(VIERNES, sabido(h('8:40'))).acostarse).toBe(horasDeSueno(VIERNES, conDespertar(h('8:00'))).acostarse);
  });

  it('enterarse al momento no cambia nada; más de dos horas tarde, ni la deuda ni pesarse, pero sí la pregunta', () => {
    expect(aLa(dia({ sueno: sabido(h('7:00')) }), 'deuda')).toBe(h('8:00'));
    const tarde = dia({ sueno: sabido(h('10:30')) });
    expect(ids(tarde)).not.toContain('deuda');
    expect(ids(tarde)).not.toContain('pesarse');
    expect(aLa(tarde, 'desayuno')).toBe(h('10:32'));
  });

  it('lo de un hábito «al despertarte» tampoco suena antes de saberlo', () => {
    const lista = dia({ sueno: sabido(h('8:40')), ajustes: { ...AJUSTES, habitos: [{ habito: 'meditar', cuando: { tipo: 'despertar', despues: 15 }, dias: [] }] }, habitos: [MEDITAR] });
    expect(aLa(lista, 'habito:meditar:0')).toBeGreaterThanOrEqual(h('8:42'));
  });
});
