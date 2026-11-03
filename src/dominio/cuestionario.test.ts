import { describe, expect, it } from '@jest/globals';

import {
  actividadEquivalente, ajusteDeRecomposicion, diasConDosSesiones, entrenaFuerza, FACTORES_DE_VIDA, FIGURAS, gastoEnReposo, gastoEstimado, grasaDeFigura,
  horarioDeLosAvisos, katchMcArdle, kcalDelDia, kcalDelEntreno, masaMagra, MET_DEL_DEPORTE, metaDelCuestionario, movimientoPorPasos, NIVELES_DE_PROTEINA,
  objetivoGuardado, objetivoUsado, partesRedondas, pesoMetaSugerido, preguntasDelEntreno, PROTEINA_POR_NIVEL, proteinaDelNivel, rangoDelPesoMeta,
  ritmoSugerido, sesionesDeUnDia, tipoDeSesion, usaGrasa, VIAJES,
  type Deporte, type EntrenoDicho, type GrasaDicha, type ObjetivoDicho, type Respuestas, type SesionDicha,
} from './cuestionario';
import { KCAL_POR_KILO_Y_HORA } from './entrenamiento';
import { ajusteDiario, gastoBasal, macrosPara, NIVELES, pesoMinimoSano, pisoDe } from './metas';

// La persona del ejemplo de la galería: 29 años, 172 cm y 74,5 kg, sentada casi todo el día y con pesas
// tres veces por semana, una hora.
const sesion = (tipo: Deporte, dias: SesionDicha['dias'], hora = 18 * 60, minutos = 60): SesionDicha => ({ tipo, dias, hora, minutos });
const entreno = (...sesiones: SesionDicha[]): EntrenoDicho => ({ tipos: [...new Set(sesiones.map((x) => x.tipo))], sesiones, viaje: 15 });
const PESAS = entreno(sesion('fuerza', [1, 3, 5]));
const BASE: Respuestas = { edad: 29, sexo: 'm', alturaCm: 172, pesoKg: 74.5, movimiento: 'sentado', entreno: PESAS, objetivo: 'mantener', ritmo: 'recomendado' };
const grasa = (pct: number, como: GrasaDicha['como'] = 'dicha'): GrasaDicha => ({ como, pct });

describe('el gasto en reposo', () => {
  it('sin la grasa, Mifflin-St Jeor; con la grasa, Katch-McArdle por la masa magra', () => {
    expect(gastoEnReposo(BASE)).toBe(gastoBasal(BASE));
    expect(gastoEnReposo(BASE)).toBe(1680);
    expect(masaMagra(74.5, 20)).toBeCloseTo(59.6, 6);
    expect(gastoEnReposo({ ...BASE, grasa: grasa(20, 'imagen') })).toBeCloseTo(370 + 21.6 * 59.6, 6);
    expect(katchMcArdle(60)).toBeCloseTo(1666, 6);
  });

  it('la grasa no se usa antes de los 18, con un cuidado ni fuera de lo posible', () => {
    expect(usaGrasa({ ...BASE, grasa: grasa(18) })).toBe(true);
    expect(usaGrasa({ ...BASE, edad: 17, grasa: grasa(18) })).toBe(false);
    expect(usaGrasa({ ...BASE, sinDeficit: true, grasa: grasa(18) })).toBe(false);
    expect(usaGrasa({ ...BASE, grasa: grasa(2) })).toBe(false);
    expect(usaGrasa({ ...BASE, grasa: grasa(70) })).toBe(false);
    expect(usaGrasa({ ...BASE, sexo: 'f', grasa: grasa(6) })).toBe(false);
    expect(usaGrasa({ ...BASE, grasa: null })).toBe(false);
    expect(gastoEnReposo({ ...BASE, edad: 17, grasa: grasa(18) })).toBe(gastoBasal({ ...BASE, edad: 17 }));
  });
});

describe('el gasto de un día, por partes', () => {
  it('la vida diaria va sin el entrenamiento: sentado es el «poco» de siempre', () => {
    expect(FACTORES_DE_VIDA.sentado).toBe(NIVELES.poco);
    expect(FACTORES_DE_VIDA.sentado).toBeLessThan(FACTORES_DE_VIDA.dePie);
    expect(FACTORES_DE_VIDA.dePie).toBeLessThan(FACTORES_DE_VIDA.fisico);
    expect(gastoEstimado({ ...BASE, entreno: null }).total).toBeCloseTo(gastoBasal(BASE) * NIVELES.poco, 6);
  });

  it('el entrenamiento suma lo neto de sus MET: las pesas, lo mismo por hora que una sesión de Ascent', () => {
    expect(kcalDelEntreno(entreno(sesion('fuerza', [1])), 75) * 7).toBeCloseTo(KCAL_POR_KILO_Y_HORA * 75, 6);
    const de = (tipo: Deporte) => kcalDelEntreno(entreno(sesion(tipo, [1, 3, 5])), 74.5);
    expect(de('resistencia')).toBeGreaterThan(de('contacto'));
    expect(de('contacto')).toBeGreaterThan(de('equipo'));
    expect(de('equipo')).toBeGreaterThan(de('fuerza'));
    expect(MET_DEL_DEPORTE.fuerza).toBe(5);
    expect(kcalDelEntreno(null, 74.5)).toBe(0);
    expect(kcalDelEntreno(entreno(), 74.5)).toBe(0);
    // Un día repetido en una sesión cuenta una vez.
    expect(kcalDelEntreno(entreno(sesion('fuerza', [1, 1, 3, 5])), 74.5)).toBeCloseTo(kcalDelEntreno(PESAS, 74.5), 6);
  });

  it('cada día suma lo que se hace ese día, también con dos sesiones; nada de promediar los MET de todos los deportes', () => {
    // Pesas lunes, miércoles y viernes una hora, y correr el lunes a la mañana 45 minutos: el lunes tiene dos sesiones.
    const e = entreno(sesion('fuerza', [1, 3, 5], 19 * 60), sesion('resistencia', [1], 7 * 60, 45));
    const pesas = (MET_DEL_DEPORTE.fuerza - 1) * 70;
    const correr = (MET_DEL_DEPORTE.resistencia - 1) * 70 * 0.75;
    expect(kcalDelDia(e, 1, 70)).toBeCloseTo(pesas + correr, 6);
    expect(kcalDelDia(e, 3, 70)).toBeCloseTo(pesas, 6);
    expect(kcalDelDia(e, 2, 70)).toBe(0);
    expect(kcalDelEntreno(e, 70)).toBeCloseTo((3 * pesas + correr) / 7, 6);
    // Con el promedio de los MET en todos los días daría otra cosa: correr no es lo de los cuatro días.
    const promediado = (((MET_DEL_DEPORTE.fuerza + MET_DEL_DEPORTE.resistencia) / 2 - 1) * 70 * 4) / 7;
    expect(Math.abs(kcalDelEntreno(e, 70) - promediado)).toBeGreaterThan(20);
    expect(sesionesDeUnDia(e, 1).map((x) => x.tipo)).toEqual(['resistencia', 'fuerza']);
    expect(diasConDosSesiones(e)).toEqual([1]);
    expect(diasConDosSesiones(PESAS)).toEqual([]);
  });

  it('el tipo reducido es solo para el horario de los avisos: solo pesas o solo correr son eso; lo demás, mixto', () => {
    expect(tipoDeSesion(['fuerza'])).toBe('fuerza');
    expect(tipoDeSesion(['resistencia'])).toBe('resistencia');
    expect(tipoDeSesion(['equipo'])).toBe('mixta');
    expect(tipoDeSesion(['contacto'])).toBe('mixta');
    expect(tipoDeSesion(['fuerza', 'equipo'])).toBe('mixta');
    expect(tipoDeSesion(['fuerza', 'fuerza'])).toBe('fuerza');
    expect(tipoDeSesion([])).toBeNull();
    // El horario: los días de todas, la hora y la duración de la principal (la de más días).
    const e = entreno(sesion('fuerza', [1, 3, 5], 19 * 60, 60), sesion('equipo', [6], 10 * 60, 90));
    expect(horarioDeLosAvisos(e)).toEqual({ tipo: 'mixta', dias: [1, 3, 5, 6], hora: 19 * 60, minutos: 60 });
    expect(horarioDeLosAvisos(PESAS)).toEqual({ tipo: 'fuerza', dias: [1, 3, 5], hora: 18 * 60, minutos: 60 });
    expect(horarioDeLosAvisos(entreno())).toBeNull();
  });

  it('los partidos, con partidos o choques; la categoría de peso, solo con combate', () => {
    expect(preguntasDelEntreno(['fuerza'])).toEqual({ partidos: false, categoriaDePeso: false });
    expect(preguntasDelEntreno(['fuerza', 'equipo'])).toEqual({ partidos: true, categoriaDePeso: false });
    expect(preguntasDelEntreno(['contacto'])).toEqual({ partidos: true, categoriaDePeso: true });
    expect(preguntasDelEntreno(['resistencia'])).toEqual({ partidos: false, categoriaDePeso: false });
  });

  it('el ejemplo de la galería: 1.680 en reposo, 590 de la vida diaria y 130 de entrenar', () => {
    expect(partesRedondas(gastoEstimado(BASE))).toEqual({ reposo: 1680, vida: 590, entreno: 130, total: 2400 });
  });

  it('las partes de a 10 suman justo el total', () => {
    for (const movimiento of ['sentado', 'dePie', 'fisico'] as const) {
      for (const e of [null, PESAS, entreno(sesion('resistencia', [0, 2], 7 * 60, 45), sesion('equipo', [4, 6], 20 * 60, 90))]) {
        const p = partesRedondas(gastoEstimado({ ...BASE, pesoKg: 81.3, movimiento, entreno: e }));
        expect(p.reposo + p.vida + p.entreno).toBe(p.total);
        expect(p.total % 10).toBe(0);
      }
    }
  });

  it('el nivel de actividad de siempre que más se parece, para la base de hoy', () => {
    expect(actividadEquivalente(gastoEstimado({ ...BASE, entreno: null }))).toBe('poco');
    expect(actividadEquivalente(gastoEstimado({ ...BASE, movimiento: 'dePie', entreno: entreno(sesion('fuerza', [1, 2, 4, 5])) }))).toBe('activo');
    expect(actividadEquivalente(gastoEstimado({ ...BASE, movimiento: 'fisico', entreno: entreno(sesion('resistencia', [1, 2, 3, 4, 5])) }))).toBe('muy');
  });

  it('los pasos de Salud sugieren cuánto se mueve', () => {
    expect(movimientoPorPasos(3800)).toBe('sentado');
    expect(movimientoPorPasos(7400)).toBe('dePie');
    expect(movimientoPorPasos(10000)).toBe('dePie');
    expect(movimientoPorPasos(12500)).toBe('fisico');
    expect(movimientoPorPasos(null)).toBeNull();
    expect(movimientoPorPasos(0)).toBeNull();
  });

  it('el viaje se guarda con el borde de arriba de cada tramo, y entrena con pesas si eligió el gimnasio', () => {
    expect(VIAJES).toEqual([0, 15, 30, 45]);
    expect(entrenaFuerza(PESAS)).toBe(true);
    expect(entrenaFuerza({ tipos: ['equipo', 'fuerza'] })).toBe(true);
    expect(entrenaFuerza({ tipos: ['contacto'] })).toBe(false);
    expect(entrenaFuerza({ tipos: ['resistencia'] })).toBe(false);
    expect(entrenaFuerza(null)).toBe(false);
  });
});

describe('la grasa por figuras', () => {
  it('nueve por sexo, seguidas y de menos a más; se usa el medio de cada una', () => {
    for (const sexo of ['m', 'f'] as const) {
      expect(FIGURAS[sexo]).toHaveLength(9);
      FIGURAS[sexo].forEach(([desde, hasta], i) => {
        expect(hasta).toBeGreaterThan(desde);
        if (i) expect(desde).toBe(FIGURAS[sexo][i - 1][1] + 1);
      });
    }
    expect(grasaDeFigura('m', 3)).toBe(19.5);
    expect(grasaDeFigura('f', 0)).toBe(13.5);
    expect(grasaDeFigura('m', 12)).toBe(42.5);
  });
});

describe('la proteína por nivel', () => {
  const objetivos: ObjetivoDicho[] = ['bajar', 'mantener', 'subir', 'recomponer'];

  it('la recomendada es la de siempre', () => {
    for (const objetivo of ['bajar', 'mantener', 'subir'] as const) {
      expect(Math.round(proteinaDelNivel({ ...BASE, objetivo }))).toBe(macrosPara(2400, 74.5, objetivo).proteina);
    }
  });

  it('de menos a más, y siempre entre 1,2 y 2,2 g por kilo', () => {
    for (const objetivo of objetivos) {
      const g = NIVELES_DE_PROTEINA.map((proteina) => proteinaDelNivel({ ...BASE, objetivo, proteina }));
      expect(g[0]).toBeLessThan(g[1]);
      expect(g[1]).toBeLessThan(g[2]);
      for (const nivel of NIVELES_DE_PROTEINA) {
        expect(PROTEINA_POR_NIVEL[objetivo][nivel]).toBeGreaterThanOrEqual(1.2);
        expect(PROTEINA_POR_NIVEL[objetivo][nivel]).toBeLessThanOrEqual(2.2);
      }
    }
    // Con muy poca grasa, la cuenta por masa magra pasaría el techo: queda en 2,2 g por kilo.
    expect(proteinaDelNivel({ ...BASE, objetivo: 'bajar', proteina: 'alta', grasa: grasa(6) })).toBeCloseTo(2.2 * 74.5, 6);
  });

  it('la recomposición pide más que mantener', () => {
    expect(proteinaDelNivel({ ...BASE, objetivo: 'recomponer' })).toBeGreaterThan(proteinaDelNivel({ ...BASE, objetivo: 'mantener' }));
  });

  it('con la grasa, por la masa magra: más si es muy magro, menos con mucha grasa', () => {
    const sin = proteinaDelNivel({ ...BASE, objetivo: 'mantener' });
    expect(proteinaDelNivel({ ...BASE, objetivo: 'mantener', grasa: grasa(15) })).toBeCloseTo(sin, 6);
    expect(proteinaDelNivel({ ...BASE, objetivo: 'mantener', grasa: grasa(10) })).toBeGreaterThan(sin);
    expect(proteinaDelNivel({ ...BASE, objetivo: 'mantener', grasa: grasa(30) })).toBeLessThan(sin);
    expect(proteinaDelNivel({ ...BASE, sexo: 'f', objetivo: 'mantener', grasa: grasa(25) })).toBeCloseTo(1.6 * 74.5, 6);
  });

  it('sin déficit, bajar y recomponer usan la de mantener', () => {
    expect(objetivoUsado({ objetivo: 'recomponer', sinDeficit: true })).toBe('mantener');
    expect(objetivoUsado({ objetivo: 'bajar', sinDeficit: true })).toBe('mantener');
    expect(objetivoUsado({ objetivo: 'subir', sinDeficit: true })).toBe('subir');
    expect(proteinaDelNivel({ ...BASE, objetivo: 'bajar', sinDeficit: true })).toBe(proteinaDelNivel({ ...BASE, objetivo: 'mantener' }));
  });
});

describe('la recomposición', () => {
  it('se guarda como mantener, con su marca', () => {
    expect(objetivoGuardado('recomponer')).toBe('mantener');
    expect(objetivoGuardado('bajar')).toBe('bajar');
    expect(metaDelCuestionario({ ...BASE, objetivo: 'recomponer' })).toMatchObject({ objetivo: 'mantener', recomponer: true });
    expect(metaDelCuestionario({ ...BASE, objetivo: 'recomponer', sinDeficit: true })).toMatchObject({ objetivo: 'mantener', recomponer: false });
  });

  it('en mantenimiento, salvo con mucha grasa: ahí baja muy despacio', () => {
    const mantener = metaDelCuestionario(BASE).metas.kcal;
    expect(metaDelCuestionario({ ...BASE, objetivo: 'recomponer' }).metas.kcal).toBe(mantener);
    expect(ajusteDeRecomposicion({ ...BASE, grasa: grasa(20) })).toBe(0);
    expect(ajusteDeRecomposicion({ ...BASE, grasa: grasa(28) })).toBeCloseTo(ajusteDiario('bajar', 'suave', 74.5), 6);
    expect(ajusteDeRecomposicion({ ...BASE, sexo: 'f', grasa: grasa(28) })).toBe(0);
    const conGrasa = { ...BASE, objetivo: 'recomponer' as const, grasa: grasa(28) };
    expect(metaDelCuestionario(conGrasa).metas.kcal).toBeLessThan(metaDelCuestionario({ ...conGrasa, objetivo: 'mantener' }).metas.kcal);
  });

  it('sin déficit, nada de bajar, tampoco con mucha grasa', () => {
    expect(ajusteDeRecomposicion({ ...BASE, sinDeficit: true, grasa: grasa(30) })).toBe(0);
  });
});

describe('la meta de arranque', () => {
  it('el ejemplo de la galería: 2.400 kcal, 119 g de proteína, 319 de carbohidratos y 72 de grasas', () => {
    expect(metaDelCuestionario(BASE)).toMatchObject({ metas: { kcal: 2400, proteina: 119, carbohidratos: 319, grasas: 72 }, objetivo: 'mantener', recomponer: false });
  });

  it('bajar al ritmo recomendado es medio por ciento del peso por semana', () => {
    expect(metaDelCuestionario({ ...BASE, objetivo: 'bajar' }).metas.kcal).toBe(1990);
    expect(metaDelCuestionario({ ...BASE, objetivo: 'bajar' }).metas.proteina).toBe(149);
  });

  it('con una fecha, el ritmo que pide; antes de los 18, bajando, nunca más que el recomendado', () => {
    expect(metaDelCuestionario({ ...BASE, objetivo: 'bajar', pct: 0.75 }).metas.kcal).toBe(1780);
    const menor = { ...BASE, edad: 17, objetivo: 'bajar' as const };
    expect(metaDelCuestionario({ ...menor, pct: 0.9 }).metas.kcal).toBe(metaDelCuestionario(menor).metas.kcal);
    expect(metaDelCuestionario({ ...menor, ritmo: 'rapido' }).metas.kcal).toBe(metaDelCuestionario(menor).metas.kcal);
    expect(metaDelCuestionario({ ...BASE, objetivo: 'subir', pct: 0.25 }).metas.kcal).toBe(metaDelCuestionario({ ...BASE, objetivo: 'subir' }).metas.kcal);
  });

  it('sin déficit, bajar queda en mantener', () => {
    expect(metaDelCuestionario({ ...BASE, objetivo: 'bajar', sinDeficit: true }).metas.kcal).toBe(metaDelCuestionario(BASE).metas.kcal);
  });

  it('nunca baja del piso de calorías', () => {
    const chica: Respuestas = { ...BASE, sexo: 'f', edad: 60, alturaCm: 150, pesoKg: 48, entreno: null, objetivo: 'bajar', ritmo: 'rapido' };
    expect(metaDelCuestionario(chica).metas.kcal).toBe(pisoDe('f'));
  });

  it('el estilo reparte como siempre, y la grasa cambia el gasto', () => {
    expect(metaDelCuestionario({ ...BASE, estilo: 'keto' }).metas.carbohidratos).toBe(30);
    expect(metaDelCuestionario({ ...BASE, grasa: grasa(12) }).gasto.conGrasa).toBe(true);
    expect(metaDelCuestionario({ ...BASE, grasa: grasa(12) }).gasto.reposo).toBeGreaterThan(gastoBasal(BASE));
  });

  it('subiendo, el ritmo que se propone baja con los años de pesas', () => {
    expect(ritmoSugerido('subir', 'principiante')).toBe('recomendado');
    expect(ritmoSugerido('subir', 'intermedio')).toBe('recomendado');
    expect(ritmoSugerido('subir', 'avanzado')).toBe('suave');
    expect(ritmoSugerido('bajar', 'avanzado')).toBe('recomendado');
    expect(ritmoSugerido('subir', null)).toBe('recomendado');
  });
});

describe('el peso meta', () => {
  it('un 5 % menos o más, de a medio kilo', () => {
    expect(pesoMetaSugerido(78.4, 176, 'bajar')).toBe(74.5);
    expect(pesoMetaSugerido(78.4, 176, 'subir')).toBe(82.5);
    expect(rangoDelPesoMeta(78.4, 176, 'bajar')).toEqual([57.5, 77]);
    expect(rangoDelPesoMeta(78.4, 176, 'subir')).toEqual([79.5, 101.5]);
  });

  it('nunca debajo de un IMC de 18,5; sin lugar para bajar, no hay peso meta', () => {
    expect(pesoMetaSugerido(56.5, 172, 'bajar')).toBeGreaterThanOrEqual(pesoMinimoSano(172));
    expect(pesoMetaSugerido(56.5, 172, 'bajar')).toBe(55);
    expect(rangoDelPesoMeta(55.5, 172, 'bajar')).toBeNull();
    expect(pesoMetaSugerido(55.5, 172, 'bajar')).toBeNull();
  });
});
