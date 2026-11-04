import { describe, expect, it } from '@jest/globals';

import type { Deporte, EntrenoDicho, SesionDicha } from './cuestionario';
import { sumarDias, type DiaSemana } from './fechas';
import {
  diasParaLaCarrera, partidoManana, partidosEntre, segunElDeporte, senalDeEnergia, tarjetaDeEnergia, textoDelDeporte,
  type ConsejoDelDeporte, type EntradaDelDeporte,
} from './segunElDeporte';
import es from '../textos/es.json';
import en from '../textos/en.json';

// El viernes 6 de noviembre de 2026; el sábado 7 hay partido a las 21.
const HOY = '2026-11-06';
const dia = (n: number) => sumarDias(HOY, n);
const sesion = (tipo: Deporte, dias: DiaSemana[], hora = 19 * 60, minutos = 60): SesionDicha => ({ tipo, dias, hora, minutos });
const entreno = (sesiones: SesionDicha[], partidos: EntrenoDicho['partidos'] = null): Pick<EntrenoDicho, 'tipos' | 'sesiones' | 'partidos'> => ({
  tipos: [...new Set(sesiones.map((s) => s.tipo))], sesiones, partidos,
});
/** Fútbol martes, jueves y el partido del sábado a las 21, 90 minutos. */
const FUTBOL = entreno([sesion('equipo', [2, 4, 6], 20 * 60, 90)], { dia: 6, hora: 21 * 60 });
/** Correr martes y jueves a las 7, y el sábado largo. */
const CORRER = entreno([sesion('resistencia', [2, 4], 7 * 60, 50), sesion('resistencia', [6], 8 * 60, 90)]);
const futbolista = (extra: Partial<EntradaDelDeporte> = {}): EntradaDelDeporte => ({ hoy: HOY, entreno: FUTBOL, sexo: 'm', edad: 26, pesoKg: 72, ...extra });
const corredora = (extra: Partial<EntradaDelDeporte> = {}): EntradaDelDeporte => ({ hoy: HOY, entreno: CORRER, sexo: 'f', edad: 34, pesoKg: 58, ...extra });
const ques = (e: EntradaDelDeporte) => segunElDeporte(e).map((c) => c.que);
const de = (e: EntradaDelDeporte, que: ConsejoDelDeporte['que']) => segunElDeporte(e).find((c) => c.que === que);

describe('1. el partido', () => {
  it('la víspera y el día, con la meta sin déficit; antes y después, no', () => {
    expect(de(futbolista(), 'partido')).toEqual({ que: 'partido', donde: 'paraHoy', tema: 'carbohidratos', cuando: 'manana', sinDeficit: true });
    expect(de(futbolista({ hoy: dia(1) }), 'partido')).toMatchObject({ cuando: 'hoy' });
    expect(de(futbolista({ hoy: dia(-1) }), 'partido')).toBeUndefined();
    expect(de(futbolista({ hoy: dia(2) }), 'partido')).toBeUndefined();
  });

  it('entre dos partidos a menos de 72 h, también los días del medio', () => {
    const conMartes = (hora: number) => futbolista({ hoy: dia(2), partidos: [{ dia: dia(1), hora: 20 * 60 }, { dia: dia(4), hora }] });
    expect(de(conMartes(19 * 60 + 59), 'partido')).toMatchObject({ cuando: 'entrePartidos' });
    expect(de(conMartes(20 * 60), 'partido')).toBeUndefined();
    // Sin las horas, por días: a dos días, sí; a tres, no.
    expect(de(futbolista({ hoy: dia(2), partidos: [{ dia: dia(1) }, { dia: dia(3) }] }), 'partido')).toMatchObject({ cuando: 'manana' });
    expect(de(futbolista({ hoy: dia(2), partidos: [{ dia: dia(1) }, { dia: dia(4) }] }), 'partido')).toBeUndefined();
  });

  it('solo con partidos o choques y el día del partido', () => {
    expect(de(futbolista({ entreno: entreno([sesion('equipo', [2, 4])]) }), 'partido')).toBeUndefined();
    expect(de(futbolista({ entreno: { ...FUTBOL, tipos: ['fuerza'] } }), 'partido')).toBeUndefined();
    expect(de(futbolista({ entreno: entreno([sesion('contacto', [2, 4])], { dia: 6 }) }), 'partido')).toMatchObject({ cuando: 'manana' });
  });
});

describe('2. la carrera de más de 90 minutos', () => {
  const carrera = (minutos: number) => ({ fecha: dia(2), minutos });
  it('los dos días antes; con 90 minutos o menos, nada', () => {
    expect(de(corredora({ carrera: carrera(120) }), 'carrera')).toEqual({ que: 'carrera', donde: 'paraHoy', tema: 'carbohidratos', faltan: 2, sinDeficit: true });
    expect(de(corredora({ hoy: dia(1), carrera: carrera(120) }), 'carrera')).toMatchObject({ faltan: 1 });
    expect(de(corredora({ hoy: dia(-1), carrera: carrera(120) }), 'carrera')).toBeUndefined();
    expect(de(corredora({ hoy: dia(2), carrera: carrera(120) }), 'carrera')).toBeUndefined();
    expect(de(corredora({ carrera: carrera(90) }), 'carrera')).toBeUndefined();
    expect(de(corredora({ carrera: carrera(91) }), 'carrera')).toBeDefined();
    expect(diasParaLaCarrera(HOY, carrera(120))).toBe(2);
    expect(diasParaLaCarrera(HOY, null)).toBeNull();
  });
});

describe('3. los carbohidratos del día', () => {
  it('con una hora o más de resistencia o partidos hoy, no el promedio de la semana', () => {
    const con = (sesiones: EntradaDelDeporte['sesionesDeHoy']) => de(corredora({ sesionesDeHoy: sesiones }), 'carbohidratos');
    expect(con([{ tipo: 'resistencia', minutos: 59 }])).toBeUndefined();
    expect(con([{ tipo: 'resistencia', minutos: 60 }])).toEqual({ que: 'carbohidratos', donde: 'paraHoy', tema: 'carbohidratos' });
    expect(con([{ tipo: 'equipo', minutos: 30 }, { tipo: 'resistencia', minutos: 30 }])).toBeDefined();
    expect(con([{ tipo: 'fuerza', minutos: 90 }])).toBeUndefined();
    // Sin las de hoy, las del cuestionario: el sábado largo, sí; el viernes, nada.
    expect(de(corredora({ hoy: dia(1) }), 'carbohidratos')).toBeDefined();
    expect(de(corredora(), 'carbohidratos')).toBeUndefined();
  });
});

describe('4. pesarse antes y después', () => {
  // La bici de 9:00 a 11:30, pesada a las 8:50 y a las 11:40.
  const pesadas = (antes: number, despues: number, extra: Partial<NonNullable<EntradaDelDeporte['pesadas']>> = {}) => ({
    antes: { minutos: 8 * 60 + 50, kg: antes }, despues: { minutos: 11 * 60 + 40, kg: despues }, sesion: { inicio: 9 * 60, minutos: 150 }, ...extra,
  });
  it('lo perdido, 1,25 L por kilo y, con más de 2 h, algo salado: el ejemplo de 5.12', () => {
    expect(de(corredora({ pesadas: pesadas(70.4, 69.2) }), 'pesarse')).toEqual({ que: 'pesarse', donde: 'paraHoy', tema: 'agua', kg: 1.2, litros: 1.5, conSal: true, masDurante: false });
  });

  it('desde medio kilo, con las dos pesadas a menos de 3 h y la sesión en el medio', () => {
    expect(de(corredora({ pesadas: pesadas(70.4, 70) }), 'pesarse')).toBeUndefined();
    expect(de(corredora({ pesadas: pesadas(70.4, 69.9) }), 'pesarse')).toMatchObject({ kg: 0.5, litros: 0.6 });
    const a = { minutos: 9 * 60, kg: 70.4 };
    expect(de(corredora({ pesadas: { ...pesadas(70.4, 69.2), antes: a, despues: { minutos: 11 * 60 + 59, kg: 69.2 } } }), 'pesarse')).toBeDefined();
    expect(de(corredora({ pesadas: { ...pesadas(70.4, 69.2), antes: a, despues: { minutos: 12 * 60, kg: 69.2 } } }), 'pesarse')).toBeUndefined();
    // Pesada después de empezar: no es «antes».
    expect(de(corredora({ pesadas: { ...pesadas(70.4, 69.2), antes: { minutos: 9 * 60 + 5, kg: 70.4 } } }), 'pesarse')).toBeUndefined();
  });

  it('más del 2 %: la próxima vez, tomar más durante', () => {
    expect(de(corredora({ pesadas: pesadas(60, 58.8) }), 'pesarse')).toMatchObject({ masDurante: false });
    expect(de(corredora({ pesadas: pesadas(60, 58.7) }), 'pesarse')).toMatchObject({ masDurante: true });
  });

  it('algo salado con más de 2 h o mucho sudor (1,5 L por hora, contando lo que tomaste en el medio)', () => {
    const hora = (perdido: number, aguaEntre = 0) => pesadas(70, 70 - perdido, { despues: { minutos: 10 * 60 + 5, kg: 70 - perdido }, sesion: { inicio: 9 * 60, minutos: 60 }, aguaEntre });
    expect(de(corredora({ pesadas: hora(1.4) }), 'pesarse')).toMatchObject({ conSal: false });
    expect(de(corredora({ pesadas: hora(1.4, 100) }), 'pesarse')).toMatchObject({ conSal: true });
    expect(de(corredora({ pesadas: pesadas(70.4, 69.2, { sesion: { inicio: 9 * 60, minutos: 120 } }) }), 'pesarse')).toMatchObject({ conSal: false });
  });

  it('lo que ya tomaste después cuenta: repuesto, no se dice; sin números, sin kilos ni litros', () => {
    expect(de(corredora({ pesadas: pesadas(70.4, 69.2, { aguaDespues: 1400 }) }), 'pesarse')).toBeDefined();
    expect(de(corredora({ pesadas: pesadas(70.4, 69.2, { aguaDespues: 1500 }) }), 'pesarse')).toBeUndefined();
    expect(de(corredora({ pesadas: pesadas(70.4, 69.2), sinNumeros: true }), 'pesarse')).toEqual({ que: 'pesarse', donde: 'paraHoy', tema: 'agua', conSal: true, masDurante: false });
  });
});

describe('5. el alcohol después de jugar', () => {
  // El partido del sábado termina a las 22:30; el domingo se dice.
  const domingo = (alcohol: EntradaDelDeporte['alcohol'], extra: Partial<EntradaDelDeporte> = {}) => futbolista({ hoy: dia(2), alcohol, ...extra });
  const sabado = dia(1);
  it('un gramo por kilo o más en las 12 h siguientes, al día siguiente', () => {
    expect(de(domingo([{ dia: sabado, minutos: 23 * 60, gramos: 40 }, { dia: sabado, minutos: 25 * 60, gramos: 32 }]), 'alcohol')).toEqual({ que: 'alcohol', donde: 'paraHoy', tema: 'alcohol' });
    expect(de(domingo([{ dia: sabado, minutos: 23 * 60, gramos: 40 }, { dia: sabado, minutos: 25 * 60, gramos: 31.9 }]), 'alcohol')).toBeUndefined();
    // Lo de antes del partido y lo de pasadas las 12 h no cuenta.
    expect(de(domingo([{ dia: sabado, minutos: 18 * 60, gramos: 72 }]), 'alcohol')).toBeUndefined();
    expect(de(domingo([{ dia: dia(2), minutos: 10 * 60 + 31, gramos: 72 }]), 'alcohol')).toBeUndefined();
    expect(de(domingo([{ dia: dia(2), minutos: 10 * 60 + 30, gramos: 72 }]), 'alcohol')).toBeDefined();
  });

  it('sin la hora del partido, lo de ese día; sin peso, nada; el mismo día, todavía no', () => {
    const sinHora = { entreno: { ...FUTBOL, partidos: { dia: 6 as DiaSemana } } };
    expect(de(domingo([{ dia: sabado, minutos: 12 * 60, gramos: 72 }], sinHora), 'alcohol')).toBeDefined();
    expect(de(domingo([{ dia: sabado, minutos: 23 * 60, gramos: 90 }], { pesoKg: null }), 'alcohol')).toBeUndefined();
    expect(de(futbolista({ hoy: sabado, alcohol: [{ dia: sabado, minutos: 23 * 60, gramos: 90 }] }), 'alcohol')).toBeUndefined();
  });
});

describe('6. el partido de noche', () => {
  it('si terminó después de las 20, la mañana siguiente, en Sueño; sin la hora, nada', () => {
    const con = (hora: number | null) => de(futbolista({ hoy: dia(2), entreno: { ...FUTBOL, partidos: { dia: 6, hora } } }), 'partidoDeNoche');
    expect(con(21 * 60)).toEqual({ que: 'partidoDeNoche', donde: 'sueno', tema: 'sueno' });
    expect(con(18 * 60 + 30)).toBeUndefined();
    expect(con(18 * 60 + 31)).toBeDefined();
    expect(con(null)).toBeUndefined();
  });
});

describe('7. dormir más en semanas de partidos', () => {
  const noches = (minutos: number, cuantas = 7) => Array.from({ length: 7 }, (_, i) => (i < 7 - cuantas ? null : minutos));
  const enSueno = (e: EntradaDelDeporte) => segunElDeporte(e).filter((c) => c.donde === 'sueno').map((c) => c.que);
  it('con una hora o más de deuda por noche, de 4 noches medidas o más', () => {
    expect(enSueno(futbolista({ noches: noches(420) }))).toEqual(['dormirMas']);
    expect(enSueno(futbolista({ noches: noches(421) }))).toEqual([]);
    expect(enSueno(futbolista({ noches: noches(420, 3) }))).toEqual([]);
    expect(enSueno(futbolista({ noches: noches(420, 4) }))).toEqual(['dormirMas']);
    // Lo que necesitas cuenta: con 7 h y media, ya no.
    expect(enSueno(futbolista({ noches: noches(420), necesidad: 450 }))).toEqual([]);
  });

  it('antes de los 18, la necesidad es 9 h; sin partidos, nada', () => {
    expect(enSueno(futbolista({ edad: 17, noches: noches(480) }))).toEqual(['dormirMas']);
    expect(enSueno(futbolista({ edad: 18, noches: noches(480) }))).toEqual([]);
    expect(enSueno(corredora({ noches: noches(400) }))).toEqual([]);
  });
});

describe('8. más carga y menos sueño', () => {
  const noches = [400, 410, 419, 420, 480, 480, 480];
  const enSueno = (e: EntradaDelDeporte) => segunElDeporte(e).filter((c) => c.donde === 'sueno').map((c) => c.que);
  it('la semana un 25 % arriba de las 4 anteriores y 3 de 7 noches de menos de 7 h', () => {
    expect(enSueno(corredora({ carga: { semana: 500, anteriores: [400, 400, 400, 400] }, noches }))).toEqual(['cargaYSueno']);
    expect(enSueno(corredora({ carga: { semana: 499, anteriores: [400, 400, 400, 400] }, noches }))).toEqual([]);
    expect(enSueno(corredora({ carga: { semana: 500, anteriores: [400, 400, 400, 400] }, noches: [400, 410, 420, 420, 480, 480, 480] }))).toEqual([]);
    // Con menos de 4 semanas para comparar, no se sabe.
    expect(enSueno(corredora({ carga: { semana: 900, anteriores: [400, 400, 400] }, noches }))).toEqual([]);
  });

  it('antes de los 18, las noches de menos de 8 h; y gana a dormir más, que es del mismo tema', () => {
    expect(enSueno(corredora({ edad: 17, carga: { semana: 500, anteriores: [400, 400, 400, 400] }, noches: [470, 470, 479, 480, 540, 540, 540] }))).toEqual(['cargaYSueno']);
    expect(enSueno(futbolista({ carga: { semana: 500, anteriores: [400, 400, 400, 400] }, noches: [400, 400, 400, 400, 400, 400, 400] }))).toEqual(['cargaYSueno']);
    // Y el partido de anoche gana a los dos.
    expect(enSueno(futbolista({ hoy: dia(2), carga: { semana: 500, anteriores: [400, 400, 400, 400] }, noches: [400, 400, 400, 400, 400, 400, 400] }))).toEqual(['partidoDeNoche']);
  });
});

describe('9. el pico de distancia', () => {
  it('la de hoy, más de un 10 % más larga que la más larga de los 30 días anteriores', () => {
    const con = (hoyKm: number, antes = [{ dia: dia(-10), km: 10 }, { dia: dia(-3), km: 8 }]) => de(corredora({ corridas: [...antes, { dia: HOY, km: hoyKm }] }), 'pico');
    expect(con(11)).toBeUndefined();
    expect(con(11.1)).toEqual({ que: 'pico', donde: 'paraHoy', tema: 'piernas' });
    // La de hace 31 días no cuenta; sin ninguna antes, no hay con qué comparar.
    expect(con(11.1, [{ dia: dia(-31), km: 20 }, { dia: dia(-30), km: 10 }])).toBeDefined();
    expect(con(15, [])).toBeUndefined();
    expect(de(futbolista({ corridas: [{ dia: dia(-10), km: 5 }, { dia: HOY, km: 9 }] }), 'pico')).toBeUndefined();
  });
});

describe('10. la energía baja', () => {
  /** Una tendencia que baja `enTres` (parte del peso) cada 3 semanas, pareja, hasta hoy. */
  const tendencia = (enTres: number, desde = 80) => {
    const porDia = 1 - Math.pow(1 - enTres, 1 / 21);
    return new Map(Array.from({ length: 60 }, (_, i) => [dia(-i), desde / Math.pow(1 - porDia, i)] as [string, number]));
  };
  /** Lo mismo, por semana. */
  const porSemana = (enUna: number) => tendencia(1 - Math.pow(1 - enUna, 3));
  const RUGBY = entreno([sesion('contacto', [2, 4], 19 * 60, 90), sesion('fuerza', [1, 3, 5], 7 * 60, 60)], { dia: 6, hora: 15 * 60 });
  const rugby = (energia: EntradaDelDeporte['energia'], extra: Partial<EntradaDelDeporte> = {}) => ({ ...futbolista({ entreno: RUGBY, pesoKg: 95 }), energia, ...extra });

  it('mantener con la tendencia un 1 % abajo en 3 semanas, con 3 sesiones por semana, durante dos semanas', () => {
    expect(senalDeEnergia(rugby({ objetivo: 'mantener', tendencia: tendencia(0.0101) }))).toEqual({ senal: 'tendencia', semanas: 3, sesiones: 5 });
    expect(senalDeEnergia(rugby({ objetivo: 'mantener', tendencia: tendencia(0.0099) }))).toBeNull();
    expect(senalDeEnergia(rugby({ objetivo: 'subir', tendencia: tendencia(0.0101) }))).toMatchObject({ senal: 'tendencia' });
    // Bajando, es lo buscado; con 2 sesiones por semana, tampoco.
    expect(senalDeEnergia(rugby({ objetivo: 'bajar', tendencia: tendencia(0.0101) }))).toBeNull();
    expect(senalDeEnergia(rugby({ objetivo: 'mantener', tendencia: tendencia(0.0101) }, { entreno: entreno([sesion('contacto', [2, 4])]) }))).toBeNull();
    // Hace dos semanas todavía no bajaba: no van dos semanas.
    const reciente = new Map([...tendencia(0.0101)].map(([d, kg]) => [d, d <= dia(-21) ? tendencia(0.0101).get(dia(-21))! : kg] as [string, number]));
    expect(senalDeEnergia(rugby({ objetivo: 'mantener', tendencia: reciente }))).toBeNull();
  });

  it('bajar más de un 1 % por semana con mucha carga (5 h por semana), dos semanas seguidas', () => {
    expect(senalDeEnergia(rugby({ objetivo: 'bajar', tendencia: porSemana(0.0101) }))).toEqual({ senal: 'bajaRapida' });
    expect(senalDeEnergia(rugby({ objetivo: 'bajar', tendencia: porSemana(0.0099) }))).toBeNull();
    const pocaCarga = entreno([sesion('contacto', [2, 4], 19 * 60, 90), sesion('fuerza', [3], 7 * 60, 119)]);
    expect(senalDeEnergia(rugby({ objetivo: 'bajar', tendencia: porSemana(0.0101) }, { entreno: pocaCarga }))).toBeNull();
  });

  it('con la masa magra: lo que queda después de entrenar, por kilo, debajo de 30 en mujeres o de 25 en hombres', () => {
    const dias = (kcal: number, entrenoKcal = 450, cuantos = 14) => Array.from({ length: cuantos }, (_, i) => ({ dia: dia(-i), kcal, entreno: entrenoKcal }));
    const quieta = tendencia(0);
    const mujer = (kcal: number, extra: Partial<NonNullable<EntradaDelDeporte['energia']>> = {}) => senalDeEnergia(corredora({ energia: { objetivo: 'mantener', tendencia: quieta, dias: dias(kcal), masaMagra: 50, ...extra } }));
    expect(mujer(1949)).toEqual({ senal: 'disponibilidad', kcal: 1949, entreno: 450 });
    expect(mujer(1950)).toBeNull();
    expect(mujer(1500, { masaMagra: null })).toBeNull();
    // 6 de 7 días anotados en cada semana; con 5, no.
    expect(mujer(1500, { dias: dias(1500).filter((d) => d.dia !== dia(-1)) })).toMatchObject({ senal: 'disponibilidad' });
    expect(mujer(1500, { dias: dias(1500).filter((d) => d.dia !== dia(-1) && d.dia !== dia(-2)) })).toBeNull();
    // Si el peso subió, lo anotado no cierra: pesa más el peso.
    expect(mujer(1500, { tendencia: tendencia(-0.003) })).toBeNull();
    const hombre = (kcal: number) => senalDeEnergia(futbolista({ energia: { objetivo: 'mantener', tendencia: quieta, dias: dias(kcal), masaMagra: 60 } }));
    expect(hombre(1949)).toMatchObject({ senal: 'disponibilidad' });
    expect(hombre(1950)).toBeNull();
  });

  it('una tarjeta, una sola vez; sin números con «Mostrar números» apagado o con «sin déficit»', () => {
    const e = rugby({ objetivo: 'mantener', tendencia: tendencia(0.012) });
    expect(de(e, 'energiaBaja')).toEqual({ que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: 'tendencia', semanas: 3, sesiones: 5 });
    expect(de({ ...e, energiaBajaDicha: true }, 'energiaBaja')).toBeUndefined();
    expect(de({ ...e, sinNumeros: true }, 'energiaBaja')).toEqual({ que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: 'tendencia' });
    expect(de({ ...e, sinDeficit: true }, 'energiaBaja')).toEqual({ que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: 'tendencia' });
  });
});

describe('11. el hierro y el calcio', () => {
  const dias = (hierro: number | null, calcio: number | null, bien = 14) => Array.from({ length: 14 }, (_, i) => ({ dia: dia(-i), kcal: i < bien ? 1600 : 1400, meta: 2000, hierro, calcio }));
  it('con 10 de 14 días bien anotados: el hierro debajo de 18 mg en mujeres, el calcio debajo de 1.000', () => {
    expect(de(corredora({ minerales: dias(17.9, 1200) }), 'minerales')).toEqual({ que: 'minerales', donde: 'paraHoy', tema: 'minerales', hierro: true, calcio: false });
    expect(de(corredora({ minerales: dias(18, 1200) }), 'minerales')).toBeUndefined();
    expect(de(corredora({ minerales: dias(20, 999) }), 'minerales')).toMatchObject({ hierro: false, calcio: true });
    expect(de(corredora({ minerales: dias(17, 900) }), 'minerales')).toMatchObject({ hierro: true, calcio: true });
    expect(de(corredora({ minerales: dias(12, 900, 10) }), 'minerales')).toBeDefined();
    expect(de(corredora({ minerales: dias(12, 900, 9) }), 'minerales')).toBeUndefined();
    // Sin datos del mineral, no se sabe.
    expect(de(corredora({ minerales: dias(null, null) }), 'minerales')).toBeUndefined();
  });

  it('en hombres, debajo de 8 mg; solo para quien corre, las mujeres o quien no come carne', () => {
    const corredor = (hierro: number) => de(corredora({ sexo: 'm', minerales: dias(hierro, 1200) }), 'minerales');
    expect(corredor(7.9)).toBeDefined();
    expect(corredor(8)).toBeUndefined();
    expect(de(futbolista({ minerales: dias(5, 500) }), 'minerales')).toBeUndefined();
    expect(de(futbolista({ minerales: dias(5, 1200), vegetariano: true }), 'minerales')).toBeDefined();
    expect(de(futbolista({ sexo: 'f', minerales: dias(15, 1200) }), 'minerales')).toBeDefined();
  });

  it('con energía baja, el calcio debajo de 1.500', () => {
    const energia = { objetivo: 'mantener' as const, tendencia: new Map(Array.from({ length: 60 }, (_, i) => [dia(-i), 60 * Math.pow(1.0006, i)] as [string, number])) };
    expect(de(corredora({ minerales: dias(20, 1499), energia }), 'minerales')).toMatchObject({ calcio: true });
    expect(de(corredora({ minerales: dias(20, 1499) }), 'minerales')).toBeUndefined();
  });
});

describe('dónde y en qué orden', () => {
  // La corredora el jueves antes de la carrera del sábado: corrió más que nunca, se pesó y viene baja de hierro.
  const todo = corredora({
    hoy: dia(-1),
    carrera: { fecha: dia(1), minutos: 120 },
    sesionesDeHoy: [{ tipo: 'resistencia', minutos: 75 }],
    corridas: [{ dia: dia(-12), km: 12 }, { dia: dia(-1), km: 16 }],
    pesadas: { antes: { minutos: 6 * 60 + 50, kg: 58 }, despues: { minutos: 8 * 60 + 20, kg: 57.2 }, sesion: { inicio: 7 * 60, minutos: 75 } },
    minerales: Array.from({ length: 14 }, (_, i) => ({ dia: dia(-1 - i), kcal: 1800, meta: 2000, hierro: 12, calcio: 1100 })),
  });

  it('lo más urgente primero, y nunca dos del mismo tema: la carrera gana a los carbohidratos del día', () => {
    expect(ques(todo)).toEqual(['pesarse', 'carrera', 'pico', 'minerales']);
  });

  it('con «sin déficit», nada de lo que es de comer: quedan el agua, las piernas, el sueño y la tarjeta', () => {
    expect(ques({ ...todo, sinDeficit: true })).toEqual(['pesarse', 'pico']);
    const domingo = futbolista({ hoy: dia(2), sinDeficit: true, alcohol: [{ dia: dia(1), minutos: 23 * 60, gramos: 120 }], noches: [400, 400, 400, 400, 400, 400, 400] });
    expect(ques(domingo)).toEqual(['partidoDeNoche']);
  });

  it('sin entrenar, nada', () => {
    expect(segunElDeporte({ ...todo, entreno: null })).toEqual([]);
  });

  it('los partidos de cada semana, con su hora y lo que dura ese deporte', () => {
    expect(partidosEntre(FUTBOL, dia(-7), dia(7))).toEqual([{ dia: dia(-6), hora: 21 * 60, minutos: 90 }, { dia: dia(1), hora: 21 * 60, minutos: 90 }]);
    expect(partidosEntre(entreno([sesion('fuerza', [1])], { dia: 3 }), dia(0), dia(6))).toEqual([{ dia: dia(5), hora: null, minutos: 90 }]);
    expect(partidosEntre(CORRER, dia(-7), dia(7))).toEqual([]);
    expect(partidoManana(HOY, partidosEntre(FUTBOL, HOY, dia(7)))).toBe(true);
    expect(partidoManana(dia(1), partidosEntre(FUTBOL, HOY, dia(7)))).toBe(false);
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
  const numero = (idioma: 'es' | 'en') => (n: number, d: number) => n.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const para = (idioma: 'es' | 'en') => ({ t: palabras((idioma === 'es' ? es : en) as unknown as Rama), numero: numero(idioma) });
  const p = { donde: 'paraHoy' as const };
  const TODOS: ConsejoDelDeporte[] = [
    ...(['hoy', 'manana', 'entrePartidos'] as const).map((cuando) => ({ ...p, que: 'partido' as const, tema: 'carbohidratos' as const, cuando, sinDeficit: true as const })),
    { ...p, que: 'carrera', tema: 'carbohidratos', faltan: 2, sinDeficit: true }, { ...p, que: 'carrera', tema: 'carbohidratos', faltan: 1, sinDeficit: true },
    { ...p, que: 'carbohidratos', tema: 'carbohidratos' },
    ...[true, false].flatMap((conSal) => [true, false].flatMap((masDurante) => [
      { ...p, que: 'pesarse' as const, tema: 'agua' as const, kg: 1.2, litros: 1.5, conSal, masDurante },
      { ...p, que: 'pesarse' as const, tema: 'agua' as const, conSal, masDurante },
    ])),
    { ...p, que: 'alcohol', tema: 'alcohol' }, { ...p, que: 'pico', tema: 'piernas' },
    { ...p, que: 'minerales', tema: 'minerales', hierro: true, calcio: false }, { ...p, que: 'minerales', tema: 'minerales', hierro: false, calcio: true },
    { ...p, que: 'minerales', tema: 'minerales', hierro: true, calcio: true },
    { que: 'partidoDeNoche', donde: 'sueno', tema: 'sueno' }, { que: 'cargaYSueno', donde: 'sueno', tema: 'sueno' }, { que: 'dormirMas', donde: 'sueno', tema: 'sueno' },
  ];
  const TARJETAS = [
    { que: 'energiaBaja' as const, donde: 'tarjeta' as const, tema: 'energia' as const, senal: 'bajaRapida' as const },
    { que: 'energiaBaja' as const, donde: 'tarjeta' as const, tema: 'energia' as const, senal: 'tendencia' as const, semanas: 3, sesiones: 5 },
    { que: 'energiaBaja' as const, donde: 'tarjeta' as const, tema: 'energia' as const, senal: 'tendencia' as const },
    { que: 'energiaBaja' as const, donde: 'tarjeta' as const, tema: 'energia' as const, senal: 'disponibilidad' as const, kcal: 1950, entreno: 450 },
    { que: 'energiaBaja' as const, donde: 'tarjeta' as const, tema: 'energia' as const, senal: 'disponibilidad' as const },
  ];

  it('las líneas de 5.12, tal cual', () => {
    const t = (c: ConsejoDelDeporte) => textoDelDeporte(c, para('es'));
    expect(t({ ...p, que: 'partido', tema: 'carbohidratos', cuando: 'manana', sinDeficit: true })).toBe('Mañana juegas: hoy y mañana, carbohidratos en cada comida.');
    expect(t({ ...p, que: 'carrera', tema: 'carbohidratos', faltan: 2, sinDeficit: true })).toBe('Tu carrera es pasado mañana: carbohidratos en todas tus comidas y menos fibra.');
    expect(t({ ...p, que: 'carbohidratos', tema: 'carbohidratos' })).toBe('Hoy entrenas más de una hora: que tu plato tenga más carbohidratos.');
    expect(t({ ...p, que: 'pesarse', tema: 'agua', kg: 1.2, litros: 1.5, conSal: true, masDurante: false })).toBe('Perdiste 1,2 kg: toma unos 1,5 L en las próximas horas, con algo salado.');
    expect(t({ ...p, que: 'alcohol', tema: 'alcohol' })).toBe('Después de jugar, mucho alcohol frena la recuperación y empeora el sueño.');
    expect(t({ que: 'cargaYSueno', donde: 'sueno', tema: 'sueno' })).toBe('Esta semana entrenas más y duermes menos: es la combinación que más se asocia con lesiones.');
    expect(t({ que: 'dormirMas', donde: 'sueno', tema: 'sueno' })).toBe('En semanas de partidos, una hora más de sueño es de lo que más ayuda.');
    expect(t({ ...p, que: 'pico', tema: 'piernas' })).toBe('Fue tu carrera más larga del mes por bastante: subir poco a poco cuida tus piernas.');
    // El del hierro, sin género; el del partido de noche, para leerlo a la mañana siguiente («esta noche»).
    expect(t({ ...p, que: 'minerales', tema: 'minerales', hierro: true, calcio: false })).toBe('Tu hierro viene bajo: carne, legumbres u hojas verdes con vitamina C. Si notas mucho cansancio, pide un análisis de ferritina.');
    expect(t({ que: 'partidoDeNoche', donde: 'sueno', tema: 'sueno' })).toBe('Jugaste tarde: es normal dormirte tarde. Si puedes, duerme más esta noche o haz una siesta corta temprano.');
    expect(tarjetaDeEnergia(TARJETAS[0], para('es')).texto).toMatch(/^En las últimas semanas comiste bastante menos de lo que pide tu entrenamiento\. Que pase unos días es normal;/);
    expect(tarjetaDeEnergia(TARJETAS[1], para('es')).deQueSale).toBe('Moss lo vio en tu peso de las últimas 3 semanas, con 5 sesiones por semana.');
    expect(tarjetaDeEnergia(TARJETAS[3], para('es')).deQueSale).toBe('Moss lo vio en lo que anotaste: unas 1.950 kcal por día, y entrenar te pide unas 450.');
  });

  it('cada consejo tiene su texto en los dos idiomas, sin nada sin completar', () => {
    for (const idioma of ['es', 'en'] as const) {
      for (const c of TODOS) expect(textoDelDeporte(c, para(idioma))).not.toMatch(/[{}]|undefined|NaN/);
      for (const c of TARJETAS) expect(Object.values(tarjetaDeEnergia(c, para(idioma))).join(' ')).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('ningún texto nombra suplementos ni diagnósticos, ni un riesgo en %; la ferritina, solo como análisis', () => {
    const textos = (idioma: Rama) => {
      const todo: string[] = [];
      const juntar = (x: string | Rama) => (typeof x === 'string' ? todo.push(x) : Object.values(x).forEach(juntar));
      const r = idioma as Rama;
      const rama = (ruta: string) => ruta.split('.').reduce<string | Rama>((o, k) => (o as Rama)[k], r);
      ['inicio.paraHoy.deporte', 'inicio.energiaBaja', 'sueno.deporte', 'recordatorios.conviene.partido', 'recordatorios.conviene.carrera'].forEach((x) => juntar(rama(x)));
      return todo;
    };
    const PROHIBIDO = /suplement|supplement|RED-?S|anemi|deshidrat|dehydrat|sobreentren|overtrain|creatin|cafeína|caffeine|BCAA|preentren|pre-?workout|quemador|fat burner|detox|megadosis|megadose|prohormon|diur[eé]tic|sauna|\d\s?%/i;
    for (const idioma of [es, en] as unknown as Rama[]) {
      for (const texto of textos(idioma)) {
        expect(texto).not.toMatch(PROHIBIDO);
        // La ferritina, solo como análisis.
        expect(texto.replace(/análisis de ferritina|ferritin test/gi, '')).not.toMatch(/ferritin/i);
      }
    }
  });
});
