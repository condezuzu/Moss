import { describe, expect, it } from '@jest/globals';

import {
  caloriasSegunElDia, costoDeSesion, frecuenciaPorDia, metaConEntrenamiento, porQueNoSube, promedioDeSesiones,
  proteinaDespuesDeEntrenar, recuperacion, semanaDeMoss, tamanoDeSesion, TECHO_PROTEINA_POR_KG,
  type DiaConEntrenamiento, type SemanaDeMoss, type Sesion,
} from './entrenamiento';
import { sumarDias, type DiaSemana } from './fechas';
import { pisoDe, type Macros } from './metas';

// La semana del control empieza el lunes 19 de octubre de 2026.
const LUNES = '2026-10-19';
const META: Macros = { kcal: 2590, proteina: 150, carbohidratos: 322, grasas: 78 };
const COSTO = 280;
const sesion = (fecha: string, series = 16, kilos = 1000, minutos = 55): Sesion => ({ fecha, series, kilos, minutos });
const enLaSemana = (...dias: number[]) => dias.map((d) => sesion(sumarDias(LUNES, d)));
const total = (dias: DiaConEntrenamiento[]) => dias.reduce((s, d) => s + d.meta.kcal, 0);
/** Entrena lunes, miércoles, viernes y domingo, como en las 4 semanas anteriores. */
const DE_COSTUMBRE: Record<DiaSemana, number> = { 0: 1, 1: 1, 2: 0, 3: 1, 4: 0, 5: 1, 6: 0 };
const semana = (hoy: number, sesiones: Sesion[], frecuencia = DE_COSTUMBRE, meta = META, costo = COSTO) =>
  caloriasSegunElDia({ meta, inicio: LUNES, hoy: sumarDias(LUNES, hoy), sesiones, frecuencia, costo, sexo: 'm' });

describe('las calorías según el día', () => {
  it('la semana suma exactamente lo que da el control: no se suma nada por entrenar', () => {
    const dias = semana(6, enLaSemana(0, 2, 4, 6));
    expect(total(dias)).toBe(7 * META.kcal);
  });

  it('un día de gimnasio tiene lo que cuesta una sesión más que uno de descanso', () => {
    const dias = semana(6, enLaSemana(0, 2, 4, 6));
    expect(dias[0].meta.kcal - dias[1].meta.kcal).toBe(COSTO);
    expect(dias.map((d) => d.meta.kcal)).toEqual([2710, 2430, 2710, 2430, 2710, 2430, 2710]);
  });

  it('si entrena más o menos que de costumbre, los días que quedan se acomodan y la semana suma igual', () => {
    for (const sesiones of [enLaSemana(0, 1, 2, 3, 4, 5), enLaSemana(), enLaSemana(6), enLaSemana(0, 1, 2, 3, 4, 5, 6)]) {
      expect(total(semana(6, sesiones))).toBe(7 * META.kcal);
    }
  });

  it('sin historia de Ascent también cierra: cada sesión se lleva su costo de lo que queda', () => {
    const nunca: Record<DiaSemana, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dias = semana(6, enLaSemana(0, 2, 4), nunca);
    expect(total(dias)).toBe(7 * META.kcal);
    expect(dias[0].meta.kcal).toBeGreaterThan(dias[1].meta.kcal);
  });

  it('hoy, sin sesión todavía, es de descanso; cuando Ascent la anota, sube, y la semana sigue cerrando', () => {
    const antes = semana(2, enLaSemana(0));
    const despues = semana(2, enLaSemana(0, 2));
    expect(antes[2].entrena).toBe(false);
    expect(despues[2].entrena).toBe(true);
    expect(despues[2].meta.kcal).toBeGreaterThan(antes[2].meta.kcal);
    expect(total(antes)).toBe(7 * META.kcal);
    expect(total(despues)).toBe(7 * META.kcal);
  });

  it('los días que vienen son una previsión: todavía no se sabe si entrena', () => {
    const dias = semana(2, enLaSemana(0, 2));
    expect(dias.slice(3).every((d) => d.entrena === null)).toBe(true);
  });

  it('se mueven los carbohidratos: la proteína y las grasas quedan', () => {
    const dias = semana(6, enLaSemana(0, 2, 4, 6));
    for (const d of dias) {
      expect(d.meta.proteina).toBe(META.proteina);
      expect(d.meta.grasas).toBe(META.grasas);
      expect(d.meta.carbohidratos).toBe(Math.round(META.carbohidratos + (d.meta.kcal - META.kcal) / 4));
    }
  });

  it('ningún día baja del piso de calorías', () => {
    const chica: Macros = { kcal: 1500, proteina: 110, carbohidratos: 150, grasas: 50 };
    const dias = semana(6, enLaSemana(0, 1, 2, 3, 4, 5), { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, chica, 500);
    expect(Math.min(...dias.map((d) => d.meta.kcal))).toBeGreaterThanOrEqual(pisoDe('m'));
  });

  it('lo que cuesta una sesión: 4 kcal por kilo y por hora, de a 10, entre 100 y 500', () => {
    expect(costoDeSesion(75, 56)).toBe(280);
    expect(costoDeSesion(40, 20)).toBe(100);
    expect(costoDeSesion(120, 120)).toBe(500);
  });

  it('qué tan seguido entrena cada día: en cuántas de las 4 semanas anteriores', () => {
    const sesiones = [-7, -14, -21, -12].map((d) => sesion(sumarDias(LUNES, d)));
    const f = frecuenciaPorDia(sesiones, LUNES);
    expect(f[1]).toBe(0.75);
    expect(f[3]).toBe(0.25);
    expect(f[2]).toBe(0);
  });
});

describe('la proteína después de entrenar', () => {
  const promedio = promedioDeSesiones([sesion('2026-10-12', 16, 1000), sesion('2026-10-14', 14, 900), sesion('2026-10-16', 18, 1100)]);

  it('el tamaño de la sesión: las series y el peso movido contra el promedio', () => {
    expect(tamanoDeSesion({ series: 16, kilos: 1000 }, promedio)).toBeCloseTo(1, 5);
    expect(tamanoDeSesion({ series: 24, kilos: 1500 }, promedio)).toBeCloseTo(1.5, 5);
    expect(tamanoDeSesion({ series: 8, kilos: 500 }, null)).toBe(1);
  });

  it('una sesión de las de siempre suma la mitad de lo que falta hasta 2,2 g por kilo, de a 5 g', () => {
    // 75 kg manteniendo: 120 g, y el techo es 165.
    expect(proteinaDespuesDeEntrenar({ tamano: 1, pesoKg: 75, proteina: 120 })).toBe(20);
  });

  it('una un 50 % más grande suma todo lo que falta, hasta 40 g; una de la mitad o menos, nada', () => {
    expect(proteinaDespuesDeEntrenar({ tamano: 1.5, pesoKg: 75, proteina: 120 })).toBe(40);
    expect(proteinaDespuesDeEntrenar({ tamano: 0.5, pesoKg: 75, proteina: 120 })).toBe(0);
  });

  it('nunca pasa el techo útil de 2,2 g por kilo', () => {
    for (const tamano of [1, 1.3, 2, 3]) {
      const extra = proteinaDespuesDeEntrenar({ tamano, pesoKg: 75, proteina: 150 });
      expect(150 + extra).toBeLessThanOrEqual(TECHO_PROTEINA_POR_KG * 75);
    }
  });

  it('sale de los carbohidratos del día: las calorías quedan como las dejó el reparto', () => {
    const [lunes, martes] = semana(1, enLaSemana(0));
    const m = metaConEntrenamiento(lunes, 20);
    expect(m.kcal).toBe(lunes.meta.kcal);
    expect(m.proteina).toBe(lunes.meta.proteina + 20);
    expect(m.carbohidratos).toBe(lunes.meta.carbohidratos - 20);
    expect(metaConEntrenamiento(martes, 20)).toEqual(martes.meta);
  });
});

describe('la recuperación', () => {
  const base = {
    dormido: 443, necesidad: 480, calidad: 92, kilos3: 1800, kilosPorDia: 4000 / 7, seguidos: 0,
    proteinaAyer: 115, metaProteina: 150, kcalAyer: 2450, metaKcal: 2590,
  };

  it('suma sus tres partes y dice qué conviene', () => {
    const r = recuperacion(base);
    expect(r.partes).toEqual({ sueno: 37, carga: 18, comida: 18 });
    expect(r.total).toBe(73);
    expect(r.conviene).toBe('fuerte');
  });

  it('mucha carga y varios días seguidos bajan la recuperación', () => {
    const r = recuperacion({ ...base, kilos3: 3600, seguidos: 4 });
    expect(r.partes.carga).toBe(0);
    expect(r.conviene).toBe('normal');
  });

  it('con poco sueño y sin comer, conviene ir suave', () => {
    expect(recuperacion({ ...base, dormido: 240, calidad: 20, kilos3: 3000, proteinaAyer: 40, kcalAyer: 900 }).conviene).toBe('suave');
  });
});

describe('por qué no subís', () => {
  const semanaCon = (sueno: number, proteina: number, balance: number, dias = 7): SemanaDeMoss => ({ sueno, proteina, balance, diasConComida: dias, nochesConSueno: dias });
  const conMarcas = [semanaCon(460, 150, -280), semanaCon(455, 154, -300), semanaCon(465, 152, -290)];

  it('sin 3 semanas de cada lado, todavía está juntando información', () => {
    expect(porQueNoSube(conMarcas.slice(0, 2), conMarcas)).toEqual({ estado: 'juntando', conMarcas: 2, sinMarcas: 3 });
  });

  it('una semana con menos de 4 días de comida o de sueño no cuenta', () => {
    const r = porQueNoSube([...conMarcas.slice(0, 2), semanaCon(460, 150, -280, 3)], conMarcas);
    expect(r.estado).toBe('juntando');
  });

  it('con datos suficientes, la diferencia más grande es la causa probable', () => {
    const r = porQueNoSube(conMarcas, [semanaCon(430, 112, -440), semanaCon(425, 110, -430), semanaCon(440, 115, -450)]);
    expect(r.estado).toBe('probable');
    if (r.estado === 'probable') expect(r.causa).toBe('proteina');
  });

  it('solo cuenta lo que va para el lado malo: dormir más no es una causa', () => {
    const r = porQueNoSube(conMarcas, [semanaCon(560, 150, -290), semanaCon(550, 152, -280), semanaCon(565, 151, -300)]);
    expect(r.estado).toBe('sinDiferencia');
  });

  it('si ninguna diferencia llega a su escala, no hay una diferencia clara', () => {
    const r = porQueNoSube(conMarcas, [semanaCon(445, 145, -350), semanaCon(450, 146, -340), semanaCon(452, 148, -360)]);
    expect(r.estado).toBe('sinDiferencia');
  });

  it('el resumen de una semana: los promedios con lo que haya', () => {
    const s = semanaDeMoss([420, 450], [{ kcal: 2400, proteina: 120 }, { kcal: 2600, proteina: 140 }], 3000);
    expect(s).toEqual({ sueno: 435, proteina: 130, balance: -500, diasConComida: 2, nochesConSueno: 2 });
  });
});
