import { describe, expect, it } from '@jest/globals';

import type { Sesion } from './alrededorDelEntreno';
import { textoDelAviso, tituloDelAviso, type Aviso, type Avisos, type Notificacion, type ParaElTexto, type Sueno } from './avisos';
import type { Comida } from './comidas';
import type { Habito } from './habitos';
import { avisosConLoQueConviene, loQueConviene, QUE_CONVIENE, VIAJE_DE_FABRICA, type Conviene, type DeLoQueConviene } from './loQueConviene';
import es from '../textos/es.json';
import en from '../textos/en.json';

/** «7:30» en minutos desde la medianoche. */
const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};
/** Lo mismo en la cuenta de las noches, desde las 18 del día anterior. */
const n = (texto: string) => (h(texto) + 6 * 60) % (24 * 60);

const DIA = '2026-11-03';
/** Se despierta a las 7 y se acuesta a las 23: necesita 8 horas, sin deuda y sin tardar en dormirse. */
const SUENO: Sueno = { habitual: () => ({ dormirse: n('23:00'), despertar: n('7:00') }), necesidad: 8 * 60, deuda: null };
const HORA: Record<Comida, number> = { desayuno: h('7:30'), almuerzo: h('13:00'), merienda: h('17:30'), cena: h('20:30'), snack: h('16:00') };
const META = { kcal: 2400, proteina: 160, carbohidratos: 280, grasas: 75 };
const si = { encendido: true };
const TODOS = Object.fromEntries(QUE_CONVIENE.map((q) => [q, si])) as Avisos;
const pesas = (inicio: string, minutos = 60): Sesion => ({ inicio: h(inicio), minutos, tipo: 'fuerza' });

/** Tu caso: almuerzas a las 13, entrenas pesas a las 16 una hora y tardas una hora en llegar. 75 kg. */
const dia = (extra: Partial<DeLoQueConviene> = {}): DeLoQueConviene => ({
  dia: DIA, ajustes: TODOS, sueno: SUENO, horaDeComida: (c) => HORA[c], sesiones: [pesas('16:00')], viaje: 60,
  meta: META, pesoKg: 75, edad: 32, comidasHabituales: 4, ...extra,
});
const conviene = (extra: Partial<DeLoQueConviene> = {}) => loQueConviene(dia(extra));
const de = (lista: Aviso[], tipo: Aviso['tipo']) => lista.filter((a) => a.tipo === tipo);
const uno = (lista: Aviso[], tipo: Aviso['tipo']) => {
  const [a, ...otros] = de(lista, tipo);
  expect(otros).toEqual([]);
  return a;
};
/** A qué hora suena cada cosa, con el horario de comidas y el de dormir prendidos. */
const elDia = (ajustes: Avisos, { ahora, ...extra }: Partial<DeLoQueConviene> & { ahora?: number } = {}) =>
  avisosConLoQueConviene({
    ...dia(extra), ahora, habitos: [],
    ajustes: { dormir: si, horario: { desayuno: HORA.desayuno, almuerzo: HORA.almuerzo, merienda: HORA.merienda, cena: HORA.cena }, maximoPorDia: 8, ...ajustes },
  }).map((x): [string, string] => [`${String(Math.floor(x.minutos / 60)).padStart(2, '0')}:${String(x.minutos % 60).padStart(2, '0')}`, x.aviso.id]);

describe('tu día: almuerzas a las 13, entrenas a las 16 y tardas una hora en llegar', () => {
  it('el de comer suena antes del almuerzo, con lo que conviene; el café, con su hora; y nada mientras vas', () => {
    expect(elDia({ ...TODOS, comidas: ['cena'] })).toEqual([
      ['07:30', 'horario:desayuno'],
      // Media hora antes del almuerzo: reemplaza a «Hora del almuerzo».
      ['12:30', 'antesDeEntrenar:0'],
      // El café de antes sería al salir, a las 15, y ya quita sueño: el último del día es a las 14.
      ['13:30', 'cafe'],
      ['17:00', 'despuesDeEntrenar:0'],
      ['20:15', 'ultimaComida'],
      // «Falta anotar la cena» no se pisa con las luces: suena un rato antes.
      ['21:10', 'comida:cena'],
      ['21:30', 'luces'],
      ['22:30', 'dormir'],
    ]);
  });

  it('dice la hora de esa comida, los gramos de carbohidratos y de proteína, y reemplaza la hora del almuerzo', () => {
    const antes = uno(conviene(), 'antesDeEntrenar');
    expect(antes).toMatchObject({ minutos: h('12:30'), comida: 'almuerzo', reemplaza: ['horario:almuerzo'] });
    // 1 g/kg de carbohidratos (pesas de más de 45 minutos) y la parte de la proteína del día (160 / 4).
    expect(antes.conviene).toEqual({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00'), proteina: 40, carbohidratos: 75 });
  });

  it('el café: a las 15, al salir, ya cae después del corte (9 h antes de la cama, las 14): queda el último del día', () => {
    expect(uno(conviene(), 'cafe')).toMatchObject({ minutos: h('13:30'), conviene: { que: 'cafe', forma: 'ultimoEntrenas', a: h('14:00'), entreno: h('16:00') } });
    // Entrenando a las 14, el de las 13 sí entra: faltan 10 h para ir a la cama.
    expect(uno(conviene({ sesiones: [pesas('14:00')] }), 'cafe')).toMatchObject({ minutos: h('12:45'), conviene: { que: 'cafe', forma: 'antes', a: h('13:00'), faltan: 10 * 60 } });
  });

  it('al terminar, la proteína en la merienda: hace más de 4 horas que almorzaste', () => {
    const despues = uno(conviene(), 'despuesDeEntrenar');
    expect(despues).toMatchObject({ minutos: h('17:00'), comida: 'merienda', reemplaza: ['horario:merienda'] });
    expect(despues.conviene).toEqual({ que: 'despuesDeEntrenar', comida: 'merienda', a: h('17:30'), proteina: 40 });
  });
});

describe('comer antes de entrenar', () => {
  it('cuenta desde que sales: con una hora de viaje, la merienda de las 14:30 ya cae encima', () => {
    const horas = { ...HORA, merienda: h('14:30') };
    const sinViaje = uno(conviene({ viaje: 0, horaDeComida: (c) => horas[c] }), 'antesDeEntrenar');
    // Sin viaje, la merienda es hora y media antes: algo más liviano, con la proteína de la regla (0,3 g/kg).
    expect(sinViaje.conviene).toMatchObject({ comida: 'merienda', a: h('14:30'), proteina: 25, carbohidratos: 75 });
    const conViaje = uno(conviene({ viaje: 60, horaDeComida: (c) => horas[c] }), 'antesDeEntrenar');
    expect(conViaje.conviene).toMatchObject({ comida: 'almuerzo', a: h('13:00') });
    // Y la merienda, que caería mientras vas, no suena a su hora.
    expect(conViaje.reemplaza).toEqual(['horario:almuerzo', 'horario:merienda', 'comida:merienda']);
    expect(VIAJE_DE_FABRICA).toBe(15);
  });

  it('si ninguna comida cae entre 1 y 4 horas antes de salir, algo liviano 75 minutos antes: la que caía encima, más temprano', () => {
    const horas = { ...HORA, merienda: h('17:00') };
    const antes = uno(conviene({ sesiones: [pesas('18:00')], viaje: 30, horaDeComida: (c) => horas[c] }), 'antesDeEntrenar');
    expect(antes).toMatchObject({ minutos: h('15:45'), comida: 'merienda', reemplaza: ['horario:merienda', 'comida:merienda'] });
    expect(antes.conviene).toEqual({ que: 'antesDeEntrenar', comida: 'merienda', a: h('16:15'), adelantada: true, proteina: 25, carbohidratos: 75 });
  });

  it('sin una comida encima, algo liviano', () => {
    const horas = { ...HORA, desayuno: h('7:00') };
    const antes = uno(conviene({ sesiones: [pesas('11:30')], viaje: 15, horaDeComida: (c) => horas[c] }), 'antesDeEntrenar');
    expect(antes.comida).toBeUndefined();
    expect(antes.conviene).toMatchObject({ comida: 'snack', a: h('10:00') });
    expect(antes.reemplaza).toEqual([]);
  });

  it('hasta 4 horas antes de empezar: con una hora de viaje, almorzar a las 11:30 para entrenar a las 16 ya no es la de antes', () => {
    const horas = { ...HORA, almuerzo: h('11:30') };
    const antes = uno(conviene({ horaDeComida: (c) => horas[c] }), 'antesDeEntrenar');
    // Contado desde la salida (15:00) eran 3 h y media; desde que empiezas, 4 h y media: algo liviano.
    expect(antes.comida).toBeUndefined();
    expect(antes.conviene).toMatchObject({ comida: 'snack', a: h('13:45') });
    expect(antes.minutos).toBe(h('13:15'));
  });

  it('nada antes de despertarte: si entrenas temprano, no hay antes', () => {
    expect(de(conviene({ sesiones: [pesas('7:30')], viaje: 15 }), 'antesDeEntrenar')).toEqual([]);
  });

  it('el horario de comidas gana a la hora de siempre, y hoy corre con lo que anotaste', () => {
    const conHorario = uno(conviene({ ajustes: { ...TODOS, horario: { almuerzo: h('12:30') } } }), 'antesDeEntrenar');
    expect(conHorario.conviene).toMatchObject({ comida: 'almuerzo', a: h('12:30') });
    // Desayunaste hora y media tarde: el almuerzo sería a las 14:30, encima de salir; se adelanta.
    const tarde = uno(conviene({ eventos: { desayuno: h('9:00') } }), 'antesDeEntrenar');
    expect(tarde.conviene).toMatchObject({ comida: 'almuerzo', adelantada: true, a: h('13:45') });
    // Una hora tarde, el almuerzo de las 14 todavía cae justo una hora antes de salir.
    expect(uno(conviene({ eventos: { desayuno: h('8:30') } }), 'antesDeEntrenar').conviene).toMatchObject({ comida: 'almuerzo', a: h('14:00') });
    // Cinco minutos tarde no corren el almuerzo a las 13:05: las horas van al cuarto de hora.
    expect(uno(conviene({ eventos: { desayuno: h('7:35') } }), 'antesDeEntrenar')).toMatchObject({ minutos: h('12:30'), conviene: { a: h('13:00') } });
  });

  it('sin peso, sin carbohidratos con número; sin meta o con los números ocultos, sin gramos', () => {
    expect(uno(conviene({ pesoKg: null }), 'antesDeEntrenar').conviene).toEqual({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00'), proteina: 40 });
    expect(uno(conviene({ meta: null }), 'antesDeEntrenar').conviene).toEqual({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00') });
    expect(uno(conviene({ sinNumeros: true }), 'antesDeEntrenar').conviene).toEqual({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00') });
  });

  it('una sesión corta: la proteína, sin carbohidratos especiales', () => {
    expect(uno(conviene({ sesiones: [pesas('16:00', 40)] }), 'antesDeEntrenar').conviene).toEqual({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00'), proteina: 40 });
    // Lo suave o de menos de 20 minutos no es entrenar: nada.
    expect(conviene({ sesiones: [{ inicio: h('16:00'), minutos: 60, tipo: 'suave' }] }).filter((a) => a.tipo !== 'luces' && a.tipo !== 'cafe' && a.tipo !== 'ultimaComida')).toEqual([]);
  });
});

describe('el café', () => {
  it('si entrenas tarde, el último del día, y que antes de entrenar mejor sin café', () => {
    expect(uno(conviene({ sesiones: [pesas('20:30')] }), 'cafe')).toMatchObject({ minutos: h('13:30'), conviene: { forma: 'ultimoEntrenas', a: h('14:00'), entreno: h('20:30') } });
  });

  it('sin entreno, el último del día, media hora antes del corte (9 horas antes de ir a la cama, sin saber la toma)', () => {
    expect(uno(conviene({ sesiones: [] }), 'cafe')).toEqual({ id: 'cafe', tipo: 'cafe', minutos: h('13:30'), conviene: { que: 'cafe', forma: 'ultimo', a: h('14:00') } });
  });

  it('cuenta desde la hora de ir a la cama: con 20 minutos para dormirte, el corte no se corre', () => {
    const conLatencia: Sueno = { habitual: () => ({ dormirse: n('23:20'), despertar: n('7:20') }), necesidad: 8 * 60, deuda: null, latencia: 20 };
    // A la cama a las 23:00 y dormida a las 23:20: el corte es a las 14, no a las 14:15.
    expect(uno(conviene({ sesiones: [], sueno: conLatencia }), 'cafe').conviene).toEqual({ que: 'cafe', forma: 'ultimo', a: h('14:00') });
  });

  it('con más cafeína por toma, el corte es antes: con 250 mg, el tope de 13,2 horas', () => {
    expect(uno(conviene({ cafeinaPorToma: 250 }), 'cafe').conviene).toMatchObject({ forma: 'ultimoEntrenas', a: h('9:45') });
  });

  it('con un té (50 mg o menos), sin corte: el de antes de entrenar a su hora y ningún último café', () => {
    expect(uno(conviene({ cafeinaPorToma: 47 }), 'cafe')).toMatchObject({ minutos: h('14:45'), conviene: { forma: 'antes', a: h('15:00'), faltan: 8 * 60 } });
    expect(de(conviene({ cafeinaPorToma: 47, sesiones: [] }), 'cafe')).toEqual([]);
  });

  it('si entrenas apenas te despiertas, no hay café de antes: queda el corte', () => {
    expect(uno(conviene({ sesiones: [pesas('7:30')] }), 'cafe').conviene).toMatchObject({ forma: 'ultimo' });
  });

  it('con «sin déficit», nunca para entrenar; sin datos del sueño, nada', () => {
    expect(uno(conviene({ sinDeficit: true }), 'cafe').conviene).toMatchObject({ forma: 'ultimo' });
    expect(de(conviene({ sueno: null }), 'cafe')).toEqual([]);
  });
});

describe('la proteína después de entrenar', () => {
  it('sin pasar 4 horas desde la comida de antes, en la que sigue', () => {
    const horas = { ...HORA, merienda: h('16:30') };
    const despues = uno(conviene({ sesiones: [pesas('15:00')], viaje: 15, horaDeComida: (c) => horas[c] }), 'despuesDeEntrenar');
    expect(despues.conviene).toEqual({ que: 'despuesDeEntrenar', comida: 'merienda', a: h('16:30'), proteina: 40 });
  });

  it('si hace mucho que no comes y la comida siguiente está lejos, antes de una hora', () => {
    const despues = uno(conviene({ sesiones: [pesas('17:00')], viaje: 15 }), 'despuesDeEntrenar');
    expect(despues).toMatchObject({ minutos: h('18:00'), conviene: { que: 'despuesDeEntrenar', a: h('19:00'), proteina: 40 } });
    expect(despues.comida).toBeUndefined();
    expect(despues.reemplaza).toBeUndefined();
  });

  it('en ayunas a la mañana: antes de una hora, sin comida a la vista', () => {
    expect(uno(conviene({ sesiones: [pesas('7:30')], viaje: 15 }), 'despuesDeEntrenar').conviene).toEqual({ que: 'despuesDeEntrenar', a: h('9:30'), proteina: 40 });
  });
});

describe('lo que cuenta hacia atrás desde la cama', () => {
  it('la última comida grande: cena 2 horas antes de acostarte (3 con reflujo), y reemplaza la hora de la cena', () => {
    expect(uno(conviene(), 'ultimaComida')).toEqual({
      id: 'ultimaComida', tipo: 'ultimaComida', minutos: h('20:15'), comida: 'cena', conviene: { que: 'ultimaComida', a: h('21:00'), cama: h('23:00') }, reemplaza: ['horario:cena'],
    });
    // Con reflujo, en Cuidados: 3 horas, y el aviso 45 minutos antes.
    expect(uno(conviene({ reflujo: true }), 'ultimaComida')).toMatchObject({ minutos: h('19:15'), conviene: { que: 'ultimaComida', a: h('20:00'), cama: h('23:00') } });
    // Si cenas antes, un cuarto de hora antes de tu cena.
    const horas = { ...HORA, cena: h('18:30') };
    expect(uno(conviene({ horaDeComida: (c) => horas[c] }), 'ultimaComida').minutos).toBe(h('18:15'));
  });

  it('si entrenas a esa hora, o el de después ya habla de la cena, no hay última comida', () => {
    expect(de(conviene({ sesiones: [pesas('20:30')] }), 'ultimaComida')).toEqual([]);
    const horas = { ...HORA, cena: h('18:30') };
    const conCena = conviene({ sesiones: [pesas('17:00')], viaje: 15, horaDeComida: (c) => horas[c] });
    expect(uno(conCena, 'despuesDeEntrenar').comida).toBe('cena');
    expect(de(conCena, 'ultimaComida')).toEqual([]);
  });

  it('si terminarías a menos de 2 horas de la cama: hasta qué hora lo fuerte, media hora antes de salir', () => {
    expect(uno(conviene({ sesiones: [pesas('20:30')] }), 'entrenarTarde')).toEqual({
      id: 'entrenarTarde:0', tipo: 'entrenarTarde', minutos: h('19:00'), conviene: { que: 'entrenarTarde', a: h('21:00'), entreno: h('20:30'), cama: h('23:00') },
    });
    // Si empiezas tan tarde que no da, mejor suave.
    expect(uno(conviene({ sesiones: [pesas('21:00')] }), 'entrenarTarde').conviene).toMatchObject({ suave: true });
    expect(de(conviene(), 'entrenarTarde')).toEqual([]);
  });

  it('las luces, hora y media antes de la cama', () => {
    expect(uno(conviene(), 'luces')).toEqual({ id: 'luces', tipo: 'luces', minutos: h('21:30'), conviene: { que: 'luces', cama: h('23:00') } });
  });

  it('sin datos del sueño, nada de esto', () => {
    expect(conviene({ sueno: null }).map((a) => a.tipo)).toEqual(['antesDeEntrenar', 'despuesDeEntrenar']);
  });
});

describe('la recuperación, con Ascent', () => {
  const con = (recuperacion: DeLoQueConviene['recuperacion']) => de(conviene({ conAscent: true, recuperacion }), 'recuperacion');

  it('media hora después de despertarte, los días que entrenas: fuerte desde 70', () => {
    expect(con({ porcentaje: 87 })).toEqual([{ id: 'recuperacion', tipo: 'recuperacion', minutos: h('7:30'), conviene: { que: 'recuperacion', porcentaje: 87, fuerte: true } }]);
    expect(con({ porcentaje: 52, dormido: 340 })[0].conviene).toEqual({ que: 'recuperacion', porcentaje: 52, fuerte: false, dormido: 340 });
    // Lo dormido se nombra solo si fue poco.
    expect(con({ porcentaje: 52, dormido: 450 })[0].conviene).toEqual({ que: 'recuperacion', porcentaje: 52, fuerte: false });
    expect([con({ porcentaje: 69 })[0].conviene, con({ porcentaje: 70 })[0].conviene]).toMatchObject([{ fuerte: false }, { fuerte: true }]);
  });

  it('mientras no llega, guarda su lugar sin sonar; sin Ascent o sin entreno, nada', () => {
    expect(con(null)[0].sobra).toBe(true);
    expect(de(conviene({ recuperacion: { porcentaje: 87 } }), 'recuperacion')).toEqual([]);
    expect(de(conviene({ conAscent: true, recuperacion: { porcentaje: 87 }, sesiones: [] }), 'recuperacion')).toEqual([]);
  });
});

describe('lo que ya pasó no suena', () => {
  it('si entrenaste a otra hora, nada de antes ni de después; el café queda en el corte', () => {
    const otraHora = conviene({ entrenado: h('9:10') });
    expect([uno(otraHora, 'antesDeEntrenar'), uno(otraHora, 'despuesDeEntrenar')]).toMatchObject([{ sobra: true, sobraDesde: h('9:10') }, { sobra: true, sobraDesde: h('9:10') }]);
    expect(uno(otraHora, 'cafe')).toEqual({ id: 'cafe', tipo: 'cafe', minutos: h('13:30'), conviene: { que: 'cafe', forma: 'ultimo', a: h('14:00') } });
    // Si el café de antes ya había sonado cuando marcaste, queda como estaba, y no suena otro.
    expect(uno(conviene({ sesiones: [pesas('14:30')], entrenado: h('13:30') }), 'cafe')).toMatchObject({ minutos: h('13:15'), sobra: true });
    expect(uno(conviene({ entrenado: h('9:10'), sesiones: [pesas('20:30')] }), 'cafe').conviene).toMatchObject({ forma: 'ultimo' });
    expect(uno(conviene({ entrenado: h('9:10'), sesiones: [pesas('20:30')] }), 'entrenarTarde').sobra).toBe(true);
    // Entrenaste a tu hora: lo de después sigue.
    expect(uno(conviene({ entrenado: h('17:05') }), 'despuesDeEntrenar').sobra).toBeUndefined();
  });

  it('si entrenaste a otra hora, la hora del almuerzo y la de la merienda vuelven a sonar en su lugar', () => {
    expect(elDia(TODOS, { entrenado: h('9:10'), ahora: h('9:15') })).toEqual([
      ['13:00', 'horario:almuerzo'],
      ['13:30', 'cafe'],
      ['17:30', 'horario:merienda'],
      ['20:15', 'ultimaComida'],
      ['21:30', 'luces'],
      ['22:30', 'dormir'],
    ]);
    // Y no cambia al reprogramar más tarde: a las 12:45 la hora del almuerzo sigue en pie.
    expect(elDia(TODOS, { entrenado: h('9:10'), ahora: h('12:45') })[0]).toEqual(['13:00', 'horario:almuerzo']);
    // Si el de antes ya había sonado cuando marcaste, la hora del almuerzo no suena además; la merienda, que no sonó, sí.
    const ids = elDia(TODOS, { entrenado: h('12:40'), ahora: h('12:45') }).map(([, id]) => id);
    expect(ids).not.toContain('horario:almuerzo');
    expect(ids).toContain('horario:merienda');
  });

  it('el de antes no suena si ya almorzaste; el de la última comida, si ya cenaste', () => {
    const almorzaste = elDia(TODOS, { anotadas: new Set<Comida>(['desayuno', 'almuerzo']), eventos: { desayuno: h('7:35'), almuerzo: h('12:20') } });
    expect(almorzaste.map(([, id]) => id)).not.toContain('antesDeEntrenar:0');
    // Tampoco vuelve la hora del almuerzo, que ya pasó.
    expect(almorzaste.map(([, id]) => id)).not.toContain('horario:almuerzo');
    const cenaste = elDia(TODOS, { anotadas: new Set<Comida>(['cena']), eventos: { cena: h('19:00') } });
    expect(cenaste.map(([, id]) => id)).not.toContain('ultimaComida');
  });

  it('lo que sobra guarda su lugar en el máximo, como un hábito hecho', () => {
    const leer: Habito = { id: 'leer', nombre: 'Leer', icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' };
    const ajustes: Avisos = { dormir: si, antesDeEntrenar: si, maximoPorDia: 2, habitos: [{ habito: 'leer', cuando: { tipo: 'hora', minutos: h('18:00') }, dias: [] }] };
    const lista = (entrenado: number | null) => avisosConLoQueConviene({ ...dia(), habitos: [leer], ajustes, entrenado }).map((x) => x.aviso.id);
    expect(lista(null)).toEqual(['antesDeEntrenar:0', 'dormir']);
    // Entrenaste a la mañana: el de comer antes no suena, y leer no entra en su lugar.
    expect(lista(h('9:00'))).toEqual(['dormir']);
  });

  it('lo que ya sonó hoy no vuelve', () => {
    expect(elDia(TODOS, { ahora: h('15:00') }).map(([hora]) => hora)).toEqual(['17:00', '20:15', '21:30', '22:30']);
  });
});

describe('las prioridades y el máximo', () => {
  it('con pocos, quedan el de dormir, lo de entrenar, tus hábitos y el horario; al final lo que cuenta desde la cama', () => {
    const ids = (maximo: number) => elDia({ ...TODOS, maximoPorDia: maximo }).map(([, id]) => id);
    expect(ids(3)).toEqual(['antesDeEntrenar:0', 'despuesDeEntrenar:0', 'dormir']);
    expect(ids(4)).toEqual(['horario:desayuno', 'antesDeEntrenar:0', 'despuesDeEntrenar:0', 'dormir']);
    // Después, la última comida; luego el café; las luces, lo último.
    expect(ids(5)).toContain('ultimaComida');
    expect(ids(6)).toContain('cafe');
    expect(ids(6)).not.toContain('luces');
  });

  it('cada uno se apaga solo; apagados todos, nada cambia', () => {
    // Con todo lo del día: el entreno tarde, Ascent, el partido de mañana y la carrera de pasado mañana.
    const todo = { conAscent: true, recuperacion: { porcentaje: 80 }, sesiones: [pesas('20:30')], partidos: [{ dia: '2026-11-04' }], carrera: { fecha: '2026-11-05', minutos: 120 } };
    const prendidos = conviene(todo).map((a) => a.tipo);
    expect(prendidos).toEqual(expect.arrayContaining(['antesDeEntrenar', 'recuperacion', 'partido', 'carrera']));
    for (const q of QUE_CONVIENE) {
      const sin = conviene({ ...todo, ajustes: { ...TODOS, [q]: { encendido: false } } as Avisos });
      expect(sin.map((a) => a.tipo)).toEqual(prendidos.filter((t) => t !== q));
    }
    expect(conviene({ ajustes: {} })).toEqual([]);
    // Apagado el de antes, la hora del almuerzo vuelve a sonar.
    expect(elDia({ ...TODOS, antesDeEntrenar: { encendido: false } }).map(([, id]) => id)).toContain('horario:almuerzo');
  });

  it('con «sin déficit», nada de comida para entrenar ni la última comida', () => {
    expect(conviene({ sinDeficit: true }).map((a) => a.tipo)).toEqual(['cafe', 'luces']);
  });
});

describe('según el deporte: la víspera del partido y la carrera larga', () => {
  const MIERCOLES = '2026-11-04';
  const JUEVES = '2026-11-05';
  const sinEntreno = (extra: Partial<DeLoQueConviene> = {}) => conviene({ sesiones: [], ...extra });

  it('la víspera del partido, a la hora del almuerzo de siempre y en lugar de ella; el día del partido, no', () => {
    expect(uno(sinEntreno({ partidos: [{ dia: MIERCOLES, hora: h('21:00') }] }), 'partido')).toEqual({
      id: 'partido', tipo: 'partido', minutos: h('13:00'), reemplaza: ['horario:almuerzo'], conviene: { que: 'partido' },
    });
    expect(de(sinEntreno({ partidos: [{ dia: DIA }] }), 'partido')).toEqual([]);
    expect(de(sinEntreno({ partidos: [{ dia: JUEVES }] }), 'partido')).toEqual([]);
  });

  it('dos días antes de una carrera de más de 90 minutos; el día antes, o con 90 minutos, no', () => {
    expect(uno(sinEntreno({ carrera: { fecha: JUEVES, minutos: 120 } }), 'carrera')).toMatchObject({ minutos: h('13:00'), conviene: { que: 'carrera' } });
    expect(de(sinEntreno({ carrera: { fecha: JUEVES, minutos: 90 } }), 'carrera')).toEqual([]);
    expect(de(sinEntreno({ carrera: { fecha: MIERCOLES, minutos: 120 } }), 'carrera')).toEqual([]);
  });

  it('la hora del almuerzo corre con lo que anotaste hoy, y anotar el almuerzo no lo calla', () => {
    expect(uno(sinEntreno({ partidos: [{ dia: MIERCOLES }], eventos: { desayuno: h('9:00') } }), 'partido').minutos).toBe(h('14:30'));
    const almorzaste = elDia(TODOS, { sesiones: [], partidos: [{ dia: MIERCOLES }], anotadas: new Set<Comida>(['desayuno', 'almuerzo']), eventos: { desayuno: h('7:35'), almuerzo: h('13:00') } });
    expect(almorzaste.map(([, id]) => id)).toContain('partido');
  });

  it('apagados de fábrica, nada con «sin déficit», y cuentan para el máximo como lo de entrenar', () => {
    const partidos = [{ dia: MIERCOLES }];
    expect(loQueConviene({ ...dia({ partidos }), ajustes: { dormir: si } })).toEqual([]);
    expect(loQueConviene({ ...dia({ partidos, sesiones: [] }), ajustes: { partido: si } }).map((a) => a.id)).toEqual(['partido']);
    expect(de(sinEntreno({ partidos, sinDeficit: true }), 'partido')).toEqual([]);
    const ids = (maximo: number) => elDia({ ...TODOS, maximoPorDia: maximo }, { sesiones: [], partidos }).map(([, id]) => id);
    expect(ids(8)).not.toContain('horario:almuerzo');
    expect(ids(2)).toEqual(['partido', 'dormir']);
  });
});

describe('lo que dice cada uno', () => {
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
  const para = (idioma: Rama): ParaElTexto => ({ t: palabras(idioma), habito: () => '', plan: () => '', duracion });
  const aviso = (c: Conviene): Notificacion => ({ dia: DIA, minutos: 0, aviso: { id: 'x', minutos: 0, tipo: c.que, conviene: c } });
  const dicho = (c: Conviene, idioma: Rama = es as unknown as Rama) => [tituloDelAviso(aviso(c), para(idioma)), textoDelAviso(aviso(c), para(idioma))];

  it('el título dice qué hacer y el texto, a qué hora y cuánto', () => {
    expect(dicho({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00'), proteina: 40, carbohidratos: 75 }))
      .toEqual(['Come antes de entrenar', 'Almuerzo a las 13:00: 75 g de carbohidratos, 40 g de proteína y poca grasa.']);
    expect(dicho({ que: 'antesDeEntrenar', comida: 'merienda', a: h('16:15'), adelantada: true, proteina: 25 })[1]).toBe('Merienda más temprano, a las 16:15: 25 g de proteína, carbohidratos y poca grasa.');
    expect(dicho({ que: 'cafe', forma: 'antes', a: h('15:00'), faltan: 480 })).toEqual(['Café antes de entrenar', 'Si tomas, a las 15:00: faltan 8 h para ir a la cama.']);
    expect(dicho({ que: 'cafe', forma: 'ultimoEntrenas', a: h('15:00'), entreno: h('20:30') })).toEqual(['Último café', 'Hasta las 15:00. Antes de entrenar a las 20:30, mejor sin café.']);
    expect(dicho({ que: 'despuesDeEntrenar', comida: 'merienda', a: h('17:30'), proteina: 40 })).toEqual(['Proteína después de entrenar', 'Unos 40 g, en la merienda de las 17:30.']);
    expect(dicho({ que: 'despuesDeEntrenar', a: h('19:00') })[1]).toBe('Algo con proteína, antes de las 19:00.');
    expect(dicho({ que: 'ultimaComida', a: h('20:00'), cama: h('23:00') })).toEqual(['Última comida grande', 'Cena antes de las 20:00: a las 23:00, a la cama. Después, algo ligero.']);
    expect(dicho({ que: 'entrenarTarde', a: h('21:00'), entreno: h('20:30'), cama: h('23:00') })).toEqual(['Termina antes de las 21:00', 'Más tarde, que sea suave: te acuestas a las 23:00.']);
    expect(dicho({ que: 'luces', cama: h('23:00') })).toEqual(['Baja las luces', 'Luz tenue y cálida: a las 23:00, a la cama.']);
    expect(dicho({ que: 'recuperacion', porcentaje: 52, fuerte: false, dormido: 340 })).toEqual(['Recuperación: 52 %', 'Hoy, mejor suave: dormiste 5 h 40 min.']);
    expect(dicho({ que: 'partido' })).toEqual(['Mañana juegas', 'Hoy y mañana, carbohidratos en cada comida.']);
    expect(dicho({ que: 'carrera' })).toEqual(['Tu carrera es pasado mañana', 'Carbohidratos en todas tus comidas y menos fibra.']);
    expect(dicho({ que: 'carrera' }, en as unknown as Rama)).toEqual(['Race in two days', 'Carbs at every meal, and less fiber.']);
    expect(dicho({ que: 'antesDeEntrenar', comida: 'almuerzo', a: h('13:00'), proteina: 40, carbohidratos: 75 }, en as unknown as Rama))
      .toEqual(['Eat before your workout', 'Lunch at 13:00: 75 g of carbs, 40 g of protein and little fat.']);
  });

  it('los demás avisos siguen con el nombre de la app de título', () => {
    expect(tituloDelAviso({ dia: DIA, minutos: 0, aviso: { id: 'dormir', minutos: 0, tipo: 'dormir' } }, para(es as unknown as Rama))).toBe('Moss');
  });

  it('todas las formas tienen su texto en los dos idiomas, sin nada sin completar y cortas', () => {
    const formas: Conviene[] = [
      ...(['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'] as const).flatMap((comida) => [
        { que: 'antesDeEntrenar' as const, comida, a: h('13:00'), proteina: 40, carbohidratos: 75 },
        { que: 'antesDeEntrenar' as const, comida, a: h('13:00'), proteina: 40 },
        { que: 'antesDeEntrenar' as const, comida, a: h('13:00') },
        ...(comida === 'snack' ? [] : [{ que: 'antesDeEntrenar' as const, comida, a: h('13:00'), adelantada: true as const, proteina: 25, carbohidratos: 75 }]),
      ]),
      ...(['desayuno', 'almuerzo', 'merienda', 'cena'] as const).flatMap((comida) => [
        { que: 'despuesDeEntrenar' as const, comida, a: h('17:30'), proteina: 40 },
        { que: 'despuesDeEntrenar' as const, comida, a: h('17:30') },
      ]),
      { que: 'despuesDeEntrenar', a: h('19:00'), proteina: 40 },
      { que: 'cafe', forma: 'antes', a: h('15:00'), faltan: 480 }, { que: 'cafe', forma: 'ultimo', a: h('15:00') }, { que: 'cafe', forma: 'ultimoEntrenas', a: h('15:00'), entreno: h('20:30') },
      { que: 'ultimaComida', a: h('20:00'), cama: h('23:00') },
      { que: 'entrenarTarde', a: h('21:00'), entreno: h('20:30'), cama: h('23:00') }, { que: 'entrenarTarde', a: h('21:00'), entreno: h('21:15'), cama: h('23:00'), suave: true },
      { que: 'luces', cama: h('23:00') },
      { que: 'recuperacion', porcentaje: 87, fuerte: true }, { que: 'recuperacion', porcentaje: 52, fuerte: false, dormido: 340 }, { que: 'recuperacion', porcentaje: 40, fuerte: false },
      { que: 'partido' }, { que: 'carrera' },
    ];
    for (const idioma of [es, en] as unknown as Rama[]) {
      for (const c of formas) {
        const [titulo, texto] = dicho(c, idioma);
        expect(`${titulo} ${texto}`).not.toMatch(/[{}]|undefined|NaN/);
        expect(titulo.length).toBeLessThanOrEqual(32);
        expect(texto.length).toBeLessThanOrEqual(100);
      }
    }
  });
});
