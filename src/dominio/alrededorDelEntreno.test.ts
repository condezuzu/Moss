import { describe, expect, it } from '@jest/globals';

import { carbohidratosPrevios, larga, lineasDelDia, proteinaDeComida, sesionesDelDia, type Contexto, type Sesion } from './alrededorDelEntreno';

/** «19:00» en minutos desde la medianoche. */
const h = (texto: string) => {
  const [hora, minuto] = texto.split(':').map(Number);
  return hora * 60 + minuto;
};

const NADA = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };

/** Fuerza a la tarde, bajando: 70 kg, 30 años, 140 g de proteína y 180 de carbohidratos; pesas de 60 minutos a las 19. */
const PESAS: Sesion = { inicio: h('19:00'), minutos: 60, tipo: 'fuerza' };
const tarde = (extra: Partial<Contexto> = {}): Contexto => ({
  ahora: h('15:00'),
  sesiones: [PESAS],
  horaDeComida: { desayuno: h('8:00'), almuerzo: h('13:00'), merienda: h('17:30'), cena: h('21:30') },
  anotado: { desayuno: { hora: h('8:00'), proteina: 30, kcal: 450 }, almuerzo: { hora: h('13:00'), proteina: 40, kcal: 650 } },
  meta: { kcal: 2100, proteina: 140, carbohidratos: 180, grasas: 70 },
  comido: { kcal: 1100, proteina: 70, carbohidratos: 60, grasas: 30 },
  comidasHabituales: 4,
  pesoKg: 70,
  edad: 30,
  despertar: h('7:30'),
  dormir: h('23:45'),
  cafeinaPorToma: 95,
  sinDeficit: false,
  ...extra,
});

describe('antes y después de entrenar', () => {
  it('la merienda hora y media antes es la previa liviana: 60 g de carbohidratos, 20 de proteína y el café antes de las 15:45', () => {
    expect(lineasDelDia(tarde())).toEqual([
      { comida: 'merienda', clase: 'previaLiviana', hora: h('19:00'), proteina: 20, carbohidratos: 60, cafeinaHasta: h('15:45') },
    ]);
  });

  it('al terminar, la cena es la de después: 35 g de proteína, la parte de la meta', () => {
    const despues = tarde({ ahora: h('20:00'), anotado: { ...tarde().anotado, merienda: { hora: h('17:30'), proteina: 20, kcal: 400 } } });
    expect(lineasDelDia(despues)).toEqual([{ comida: 'cena', clase: 'despues', hora: h('19:00'), proteina: 35 }]);
  });

  it('si después de la cena faltan 25 g o más de proteína, algo antes de dormir también cuenta', () => {
    const noche = tarde({
      ahora: h('22:15'),
      anotado: { ...tarde().anotado, merienda: { hora: h('17:30'), proteina: 20, kcal: 400 }, cena: { hora: h('21:30'), proteina: 20, kcal: 600 } },
      comido: { kcal: 2000, proteina: 110, carbohidratos: 170, grasas: 60 },
    });
    expect(lineasDelDia(noche)).toEqual([{ comida: 'snack', clase: 'antesDeDormir', hora: h('21:30'), proteina: 30 }]);
  });

  it('lo de antes de dormir dice lo que falta, sin pasarse; con un snack después de la cena, nada', () => {
    const noche = (proteina: number, snack?: number): Contexto => tarde({
      ahora: h('22:15'),
      anotado: {
        ...tarde().anotado, merienda: { hora: h('17:30'), proteina: 20, kcal: 400 }, cena: { hora: h('21:30'), proteina: 20, kcal: 600 },
        ...(snack !== undefined ? { snack: { hora: snack, proteina: 5, kcal: 100 } } : {}),
      },
      comido: { kcal: 2000, proteina, carbohidratos: 170, grasas: 60 },
    });
    expect(lineasDelDia(noche(113))[0].proteina).toBe(25);
    expect(lineasDelDia(noche(70))[0].proteina).toBe(70);
    // El snack de la mañana no cuenta; el de después de la cena, sí.
    expect(lineasDelDia(noche(110, h('10:30')))).toHaveLength(1);
    expect(lineasDelDia(noche(110, h('22:00')))).toEqual([]);
  });

  it('una sesión larga sin comida antes: el snack, salvo que ya se haya anotado uno en las 4 horas de antes', () => {
    const larga: Sesion = { inicio: h('16:00'), minutos: 90, tipo: 'resistencia' };
    const sinMerienda = (snack?: number): Contexto => tarde({
      ahora: h('12:00'), sesiones: [larga],
      horaDeComida: { desayuno: h('8:00'), almuerzo: h('11:00'), merienda: h('20:30'), cena: h('22:00') },
      anotado: { desayuno: { hora: h('8:00'), proteina: 30, kcal: 450 }, almuerzo: { hora: h('11:00'), proteina: 40, kcal: 650 }, ...(snack !== undefined ? { snack: { hora: snack, proteina: 5, kcal: 150 } } : {}) },
    });
    expect(lineasDelDia(sinMerienda()).map((l) => [l.comida, l.clase])).toEqual([['snack', 'snackPrevio']]);
    expect(lineasDelDia(sinMerienda(h('14:30')))).toEqual([]);
    expect(lineasDelDia(sinMerienda(h('9:00'))).map((l) => l.clase)).toEqual(['snackPrevio']);
  });

  it('correr en ayunas, sin peso: antes, algo chico si es larga; al terminar, proteína apenas se pueda', () => {
    const correr: Sesion = { inicio: h('7:00'), minutos: 75, tipo: 'resistencia' };
    const manana = (ahora: number): Contexto => ({
      ...tarde(), ahora, sesiones: [correr], pesoKg: null, anotado: {}, comido: NADA, meta: { kcal: 2000, proteina: 100, carbohidratos: 250, grasas: 60 },
      despertar: h('6:30'), horaDeComida: { desayuno: h('9:00'), almuerzo: h('13:00'), merienda: h('17:30'), cena: h('21:00') }, cafeinaPorToma: null,
    });
    expect(lineasDelDia(manana(h('6:40')))).toEqual([{ comida: 'desayuno', clase: 'ayunasLarga', hora: h('7:00'), carbohidratos: 30 }]);
    expect(lineasDelDia(manana(h('8:15')))).toEqual([{ comida: 'desayuno', clase: 'despuesPronto', hora: h('7:00'), proteina: 30 }]);
    // Corta, en ayunas, no lleva nada antes.
    expect(lineasDelDia({ ...manana(h('6:40')), sesiones: [{ ...correr, minutos: 40 }] })).toEqual([]);
  });

  it('dos sesiones a menos de 8 horas: reponer en la comida de después y en la siguiente', () => {
    const dos: Contexto = {
      ...tarde(), ahora: h('9:00'), anotado: {}, comido: NADA,
      sesiones: [{ inicio: h('7:00'), minutos: 120, tipo: 'resistencia' }, { inicio: h('15:00'), minutos: 90, tipo: 'mixta' }],
      horaDeComida: { desayuno: h('9:30'), almuerzo: h('13:00'), merienda: h('17:30'), cena: h('21:00') },
    };
    const lineas = lineasDelDia(dos);
    expect(lineas.map((l) => [l.comida, l.clase, l.carbohidratos])).toEqual([['desayuno', 'reponer', 70], ['almuerzo', 'reponer', 70]]);
  });

  it('con «sin déficit», lo suave o sin sesiones, nada', () => {
    expect(lineasDelDia(tarde({ sinDeficit: true }))).toEqual([]);
    expect(lineasDelDia(tarde({ sesiones: [{ inicio: h('19:00'), minutos: 60, tipo: 'suave' }] }))).toEqual([]);
    expect(lineasDelDia(tarde({ sesiones: [] }))).toEqual([]);
  });

  it('una comida ya anotada no lleva línea', () => {
    expect(lineasDelDia(tarde({ anotado: { ...tarde().anotado, merienda: { hora: h('17:00'), proteina: 15, kcal: 300 } } }))).toEqual([]);
  });
});

describe('el horario de entrenamiento', () => {
  it('da la sesión de los días que se entrena, y ninguna los demás', () => {
    const entreno = { dias: [1, 3, 5] as const, hora: h('19:00'), minutos: 60, tipo: 'fuerza' as const };
    // El lunes 26 de octubre de 2026 se entrena; el martes, no.
    expect(sesionesDelDia({ ...entreno, dias: [...entreno.dias] }, '2026-10-26')).toEqual([{ inicio: h('19:00'), minutos: 60, tipo: 'fuerza' }]);
    expect(sesionesDelDia({ ...entreno, dias: [...entreno.dias] }, '2026-10-27')).toEqual([]);
    expect(sesionesDelDia(null, '2026-10-26')).toEqual([]);
  });
});

describe('las cantidades', () => {
  it('la proteína de una comida: 0,3 g/kg de 20 a 40, o su parte de la meta; sin peso, 25 o 30; nunca más de lo que queda', () => {
    expect(proteinaDeComida(tarde(), 'liviana')).toBe(20);
    expect(proteinaDeComida(tarde(), 'despues')).toBe(35);
    expect(proteinaDeComida(tarde({ pesoKg: null, comido: NADA, meta: { ...tarde().meta, proteina: 80 } }), 'ayunas')).toBe(30);
    expect(proteinaDeComida(tarde({ comido: { ...tarde().comido, proteina: 130 } }), 'despues')).toBe(10);
    // Desde los 65, 0,4 g/kg.
    expect(proteinaDeComida(tarde({ edad: 70, comido: NADA, meta: { ...tarde().meta, proteina: 80 } }), 'normal')).toBe(30);
  });

  it('los carbohidratos de antes, solo con peso y sesión larga; la mitad de lo que queda se guarda', () => {
    expect(carbohidratosPrevios(tarde(), PESAS, 90)).toBe(60);
    expect(carbohidratosPrevios(tarde({ pesoKg: null }), PESAS, 90)).toBeNull();
    expect(carbohidratosPrevios(tarde(), { ...PESAS, minutos: 40 }, 90)).toBeNull();
    // Resistencia de 90 minutos o más: 1 g/kg por hora de anticipación, hasta 4.
    expect(carbohidratosPrevios(tarde({ comido: NADA, meta: { ...tarde().meta, carbohidratos: 600 } }), { inicio: h('19:00'), minutos: 120, tipo: 'resistencia' }, 180)).toBe(210);
  });

  it('larga: fuerza de más de 45 minutos o con 10 series por músculo; resistencia de una hora', () => {
    expect(larga({ ...PESAS, minutos: 45 })).toBe(false);
    expect(larga({ ...PESAS, minutos: 40, seriesPorMusculo: 10 })).toBe(true);
    expect(larga({ inicio: 0, minutos: 60, tipo: 'resistencia' })).toBe(true);
    expect(larga({ inicio: 0, minutos: 59, tipo: 'mixta' })).toBe(false);
  });
});
