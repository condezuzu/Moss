import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import en from '../textos/en.json';
import es from '../textos/es.json';
import { controlSemanal, type ComidaDelDia, type EntradaDelControl, type Pesada } from './control';
import { metaDelCuestionario, NIVELES_DE_PROTEINA, type Respuestas } from './cuestionario';
import {
  apagaConsejo, apagaLinea, apagaLoQueConviene, apagaLoQueFalta, controlConCuidados, CUIDADOS, estadoConCuidados, extraDeLaLactancia, extraDelEmbarazo,
  fechaProbableDe, GRUPOS, gruposPara, LO_QUE_DICE, loQueSube, metaConCuidados, metaDeAgua, metaDelCuestionarioConCuidados, objetivoConCuidados,
  preguntarSiNacio, rangoDelEmbarazo, referenciaConCuidados, reglasDe, semanaDeEmbarazo, sinDeficitDe,
  type Cuidado, type DatosDelCuidado, type Marca, type PersonaDelCuidado,
} from './cuidados';
import { sumarDias } from './fechas';
import { ESTILOS, metaPara, type Objetivo, type Ritmo, type Sexo } from './metas';
import { paraHoy, type EntradaDeParaHoy } from './paraHoy';

const HOY = '2026-11-05';
// Ella: 30 años, 165 cm y 68 kg, algo activa. Él: la persona de la galería.
const ELLA: PersonaDelCuidado = { sexo: 'f', edad: 30, alturaCm: 165, pesoKg: 68, actividad: 'algo' };
const EL: PersonaDelCuidado = { sexo: 'm', edad: 31, alturaCm: 178, pesoKg: 75, actividad: 'activo' };
const reglas = (c: Cuidado[], d: DatosDelCuidado = {}, p: PersonaDelCuidado = ELLA, hoy = HOY) => reglasDe(c, d, p, hoy);
const NINGUNA = reglas([]);
const EN_LA_SEMANA_20: DatosDelCuidado = { embarazo: { fechaProbable: fechaProbableDe(20, HOY), pesoAntes: 65, mellizos: false } };
const persona = (p: PersonaDelCuidado, objetivo: Objetivo = 'bajar', ritmo: Ritmo = 'recomendado') => ({ edad: p.edad, sexo: p.sexo, pesoKg: p.pesoKg, objetivo, ritmo });

const RESPUESTAS: Respuestas = { edad: 29, sexo: 'm', alturaCm: 172, pesoKg: 74.5, movimiento: 'sentado', entreno: null, objetivo: 'mantener', ritmo: 'recomendado' };

// Una serie de días para el control: 60 días con el peso de `kg(i)` y 2.500 kcal por día.
const pesadas = (kg: (i: number) => number): Pesada[] => Array.from({ length: 60 }, (_, i) => ({ fecha: sumarDias(HOY, i - 60), kg: kg(i) }));
const comidas: ComidaDelDia[] = Array.from({ length: 60 }, (_, i) => ({ fecha: sumarDias(HOY, i - 60), kcal: 2500 }));
const control = (kg: (i: number) => number, objetivo: Objetivo = 'mantener'): EntradaDelControl => ({
  hoy: HOY, pesadas: pesadas(kg), comidas, gastoAnterior: 2700, metasAnteriores: { kcal: 2700, proteina: 128, carbohidratos: 412, grasas: 81 },
  perfil: { edad: 30, sexo: 'f', pesoKg: 80, objetivo, ritmo: 'recomendado' },
});
const SUBE = (i: number) => 80 + 0.06 * i;

describe('sin nada marcado, todo como hoy', () => {
  it('las reglas son las de siempre', () => {
    expect(NINGUNA).toMatchObject({ cuidados: [], ritmoMaximo: 'rapido', subir: true, extraKcal: 0, control: 'normal', grasa: true, apagar: [], prender: [], manuales: false, profesional: null, pesoMeta: true });
    expect(sinDeficitDe(NINGUNA)).toBe(false);
  });

  it('la meta es la de metaPara, para cualquier persona, objetivo, ritmo, reparto y gasto', () => {
    for (const sexo of ['f', 'm'] as Sexo[]) for (const edad of [17, 30]) for (const objetivo of ['bajar', 'mantener', 'subir'] as Objetivo[]) {
      for (const ritmo of ['suave', 'recomendado', 'rapido'] as Ritmo[]) for (const estilo of ESTILOS) for (const gasto of [1450, 2210, 3105]) {
        const c = { edad, sexo, pesoKg: 74.5, objetivo, ritmo };
        expect(metaConCuidados(gasto, c, estilo, NINGUNA)).toEqual(metaPara(gasto, c, estilo));
      }
    }
  });

  it('la del cuestionario es la de metaDelCuestionario', () => {
    const casos: Respuestas[] = [
      RESPUESTAS, { ...RESPUESTAS, objetivo: 'bajar' }, { ...RESPUESTAS, objetivo: 'bajar', pct: 0.9 }, { ...RESPUESTAS, objetivo: 'subir', ritmo: 'rapido' },
      { ...RESPUESTAS, objetivo: 'recomponer', grasa: { como: 'dicha', pct: 28 } }, { ...RESPUESTAS, estilo: 'keto', proteina: 'alta' },
      { ...RESPUESTAS, edad: 17, sexo: 'f', objetivo: 'bajar', pct: 1 }, { ...RESPUESTAS, grasa: { como: 'imagen', pct: 12 }, proteina: 'baja' },
    ];
    for (const r of casos) expect(metaDelCuestionarioConCuidados(r, NINGUNA)).toEqual(metaDelCuestionario(r));
  });

  it('el control es el de siempre', () => {
    expect(controlConCuidados(control(SUBE), NINGUNA)).toEqual(controlSemanal(control(SUBE)));
  });
});

describe('el embarazo', () => {
  const ella = { edad: 30, alturaCm: 165, pesoKg: 68, pesoAntes: 65, actividad: 'algo' as const };

  it('NASEM 2023: nada en el primer trimestre; en la semana 20, unas 410 kcal (260 si es poco activa)', () => {
    expect(extraDelEmbarazo({ ...ella, semana: 10 })).toBe(0);
    expect(extraDelEmbarazo({ ...ella, semana: 20 })).toBe(410);
    expect(extraDelEmbarazo({ ...ella, semana: 20, actividad: 'poco' })).toBe(260);
    // Con obesidad el depósito resta, pero Moss nunca propone comer menos de lo que se gasta.
    expect(extraDelEmbarazo({ edad: 30, alturaCm: 165, pesoKg: 91, pesoAntes: 90, semana: 14, actividad: 'poco' })).toBe(0);
    expect(reglas(['embarazo'], EN_LA_SEMANA_20).extraKcal).toBe(410);
    expect(reglas(['embarazo'], { embarazo: { fechaProbable: fechaProbableDe(10, HOY), pesoAntes: 65, mellizos: false } }).extraKcal).toBe(0);
  });

  it('la semana sale de la fecha probable, y dos semanas después Moss pregunta si ya nació', () => {
    expect(semanaDeEmbarazo(fechaProbableDe(20, HOY), HOY)).toBe(20);
    expect(semanaDeEmbarazo(sumarDias(HOY, 280), HOY)).toBe(0);
    expect(preguntarSiNacio(sumarDias(HOY, -13), HOY)).toBe(false);
    expect(preguntarSiNacio(sumarDias(HOY, -14), HOY)).toBe(true);
  });

  it('sin déficit ni subir, el control en pausa, sin keto, la cafeína hasta 200 mg, nada de alcohol y las referencias del embarazo', () => {
    const r = reglas(['embarazo'], EN_LA_SEMANA_20);
    expect(r).toMatchObject({ ritmoMaximo: 'ninguno', subir: false, control: 'pausa', cafeinaTope: 200, alcoholTope: 0, etapa: 'embarazo', pesoMeta: false, profesional: 'necesario' });
    expect(r.estilosSin).toContain('keto');
    expect(r.marcar).toEqual(expect.arrayContaining(['alcohol', 'cafeina', 'listeria', 'mercurio']));
    for (const objetivo of ['bajar', 'mantener', 'subir'] as Objetivo[]) {
      expect(metaConCuidados(2100, persona(ELLA, objetivo), 'keto', r)).toEqual(metaConCuidados(2100, persona(ELLA, 'mantener'), 'equilibrada', r));
    }
    expect(metaConCuidados(2100, persona(ELLA), 'equilibrada', r)).toMatchObject({ kcal: 2510, proteina: Math.round(1.6 * 68) });
    expect(referenciaConCuidados('hierro', { sexo: 'f', edad: 30 }, r)).toEqual({ meta: 27 });
    expect(referenciaConCuidados('folato', { sexo: 'f', edad: 30 }, r)).toEqual({ meta: 600 });
    expect(referenciaConCuidados('cafeina', { sexo: 'f', edad: 30 }, r)).toEqual({ tope: 200 });
  });

  it('solo para mujeres; antes de los 18, Moss no calcula: las metas van a mano', () => {
    expect(reglas(['embarazo', 'lactancia'], EN_LA_SEMANA_20, EL)).toEqual(reglas([], {}, EL));
    expect(gruposPara('m').map((g) => g.grupo)).not.toContain('etapa');
    expect(gruposPara('f').flatMap((g) => g.cuidados)).toEqual(CUIDADOS);
    const menor = reglas(['embarazo'], EN_LA_SEMANA_20, { ...ELLA, edad: 17 });
    expect(menor.manuales).toBe(true);
    expect(metaConCuidados(2100, persona({ ...ELLA, edad: 17 }), 'equilibrada', menor)).toBeNull();
  });

  it('el control no corre: ninguna meta nueva mientras dure', () => {
    expect(controlConCuidados(control(SUBE), reglas(['embarazo'], EN_LA_SEMANA_20))).toBeNull();
  });

  it('IOM 2009: la banda de lo que se sube, sin saltos', () => {
    expect(rangoDelEmbarazo(22, 40, false)).toEqual([11.5, 16]);
    expect(rangoDelEmbarazo(22, 12, false)).toEqual([0.5, 2]);
    expect(rangoDelEmbarazo(31, 40, false)).toEqual([5, 9]);
    expect(rangoDelEmbarazo(17, 40, false)).toEqual([12.5, 18]);
    expect(rangoDelEmbarazo(27, 41, false)).toEqual([7, 11.5]);
    expect(rangoDelEmbarazo(22, 26, false)).toEqual([5.8, 8.7]);
    let antes = rangoDelEmbarazo(22, 13, false)!;
    for (let s = 14; s <= 40; s++) {
      const ahora = rangoDelEmbarazo(22, s, false)!;
      expect(ahora[0]).toBeGreaterThanOrEqual(antes[0]);
      expect(ahora[1]).toBeGreaterThanOrEqual(antes[1]);
      // De a medio kilo por semana, más o menos: sin el salto de casi 2 kg que darían los ritmos del IOM en la semana 40.
      expect(ahora[0] - antes[0]).toBeLessThan(0.7);
      expect(ahora[1] - antes[1]).toBeLessThan(0.7);
      antes = ahora;
    }
  });

  it('con gemelos o mellizos, solo el total provisorio al término (y nada con bajo peso)', () => {
    expect(rangoDelEmbarazo(22, 30, true)).toBeNull();
    expect(rangoDelEmbarazo(22, 38, true)).toEqual([17, 25]);
    expect(rangoDelEmbarazo(32, 37, true)).toEqual([11, 19]);
    expect(rangoDelEmbarazo(17, 38, true)).toBeNull();
  });
});

describe('la lactancia', () => {
  const parto = (semanas: number) => ({ lactancia: { parto: sumarDias(HOY, -7 * semanas), soloPecho: true } });

  it('las primeras seis semanas, sin déficit y con unas 400 kcal más', () => {
    const r = reglas(['lactancia'], parto(2));
    expect(r.ritmoMaximo).toBe('ninguno');
    expect(r.deficitDesde).toBe(sumarDias(HOY, 28));
    expect(metaConCuidados(2200, persona(ELLA, 'bajar', 'rapido'), 'equilibrada', r)!.kcal).toBe(2600);
    expect(r.apagar).toEqual(expect.arrayContaining(['faltaCalorias', 'pesarse', 'antesDeEntrenar']));
  });

  it('después, bajar despacio y nunca debajo de 1.800 kcal', () => {
    const r = reglas(['lactancia'], parto(8));
    expect(r.ritmoMaximo).toBe('suave');
    expect(r.apagar).toEqual([]);
    expect(metaConCuidados(2200, persona(ELLA, 'bajar', 'rapido'), 'equilibrada', r)!.kcal).toBe(2410);
    expect(metaConCuidados(1500, persona(ELLA, 'bajar', 'rapido'), 'equilibrada', r)!.kcal).toBe(1800);
    expect(r.alcoholTope).toBe(34);
  });

  it('400 kcal hasta los 6 meses y 380 hasta el año; con pecho y fórmula, la mitad', () => {
    expect(extraDeLaLactancia(sumarDias(HOY, -90), HOY, true)).toBe(400);
    expect(extraDeLaLactancia(sumarDias(HOY, -240), HOY, true)).toBe(380);
    expect(extraDeLaLactancia(sumarDias(HOY, -90), HOY, false)).toBe(200);
    expect(reglas(['lactancia'], { lactancia: { parto: sumarDias(HOY, -240), soloPecho: false } }).extraKcal).toBe(190);
  });

  it('vegana, Moss mira la vitamina B12', () => {
    expect(reglas(['lactancia'], parto(8), { ...ELLA, dieta: 'vegana' }).mirar).toContain('vitaminaB12');
    expect(reglas(['lactancia'], parto(8)).mirar).not.toContain('vitaminaB12');
  });
});

describe('el azúcar', () => {
  it('con prediabetes o diabetes tipo 2, bajar sí (ADA 2026), con el sodio debajo de 2.300 mg', () => {
    const r = reglas(['diabetes2'], { diabetes2: { bajaElAzucar: false } });
    expect(objetivoConCuidados('bajar', r)).toBe('bajar');
    expect(metaConCuidados(2400, persona(EL, 'bajar', 'rapido'), 'keto', r)).toEqual(metaPara(2400, persona(EL, 'bajar', 'rapido'), 'keto'));
    expect(r).toMatchObject({ sodioMax: 2300, profesional: 'sugerido' });
  });

  it('con insulina o algo que baja mucho el azúcar, hasta el ritmo recomendado y sin keto; «no sé» va como «sí»', () => {
    for (const bajaElAzucar of [true, null]) {
      const r = reglas(['diabetes2'], { diabetes2: { bajaElAzucar } });
      expect(r).toMatchObject({ ritmoMaximo: 'recomendado', profesional: 'necesario' });
      expect(r.estilosSin).toContain('keto');
      expect(metaConCuidados(2400, persona(EL, 'bajar', 'rapido'), 'keto', r)).toEqual(metaPara(2400, persona(EL, 'bajar', 'recomendado')));
    }
    expect(reglas(['diabetes2']).ritmoMaximo).toBe('recomendado');
  });

  it('con diabetes tipo 1, suave como mucho, sin keto y sin lo de comer al entrenar', () => {
    const r = reglas(['diabetes1']);
    expect(r.ritmoMaximo).toBe('suave');
    expect(r.estilosSin).toContain('keto');
    expect(r.apagar).toEqual(['antesDeEntrenar', 'despuesDeEntrenar', 'ayunasLarga', 'deporte']);
    expect(apagaLoQueConviene('antesDeEntrenar', r)).toBe(true);
    expect(apagaLinea('ayunasLarga', r)).toBe(true);
    expect(apagaLinea('reponer', r)).toBe(true);
    expect(apagaLinea('nocheCorta', r)).toBe(false);
  });
});

describe('el corazón', () => {
  it('con la presión alta, el sodio debajo de 2.000 mg y el potasio de 3.510 mg o más (OMS)', () => {
    const r = reglas(['presion']);
    expect(r).toMatchObject({ ritmoMaximo: 'rapido', sodioMax: 2000, potasio: 3510 });
    expect(referenciaConCuidados('potasio', { sexo: 'f', edad: 30 }, r)).toEqual({ meta: 3510 });
    expect(r.prender).toEqual(['sal']);
  });

  it('con el colesterol alto, saturadas debajo del 7 %, colesterol de 300 mg y de 25 a 40 g de fibra (ESC/EAS 2019)', () => {
    const r = reglas(['colesterol']);
    expect(r).toMatchObject({ saturadasMax: 0.07, colesterolMax: 300, fibra: [25, 40] });
    expect(referenciaConCuidados('colesterol', { sexo: 'm', edad: 30 }, r)).toEqual({ tope: 300 });
    expect(referenciaConCuidados('colesterol', { sexo: 'm', edad: 30 }, NINGUNA)).toBeNull();
  });
});

describe('los riñones', () => {
  it('con enfermedad renal, la proteína en 0,8 g por kilo para cualquier objetivo, reparto y nivel (KDIGO 2024)', () => {
    const r = reglas(['renal']);
    for (const objetivo of ['bajar', 'mantener', 'subir'] as Objetivo[]) for (const estilo of ESTILOS) for (const gasto of [1600, 2400, 3200]) {
      expect(metaConCuidados(gasto, persona(EL, objetivo), estilo, r)!.proteina).toBe(Math.round(0.8 * EL.pesoKg));
    }
    for (const proteina of NIVELES_DE_PROTEINA) for (const objetivo of ['bajar', 'mantener', 'subir', 'recomponer'] as const) {
      expect(metaDelCuestionarioConCuidados({ ...RESPUESTAS, objetivo, proteina }, r)!.metas.proteina).toBe(Math.round(0.8 * RESPUESTAS.pesoKg));
    }
    expect(r).toMatchObject({ ritmoMaximo: 'ninguno', sodioMax: 2000, potasio: 'sinMeta', agua: 'noPedir' });
  });

  it('con el riñón, la proteína nunca pasa de 1,3 g por kilo, con lo que sea que se marque además', () => {
    const otros = CUIDADOS.filter((c) => c !== 'renal');
    for (let m = 0; m < 1 << otros.length; m++) {
      const marcados: Cuidado[] = ['renal', ...otros.filter((_, i) => m & (1 << i))];
      const r = reglas(marcados, EN_LA_SEMANA_20);
      const meta = metaConCuidados(2600, persona(ELLA, 'subir'), 'equilibrada', r);
      if (meta) expect(meta.proteina).toBeLessThanOrEqual(1.3 * ELLA.pesoKg);
    }
  });

  it('con el riñón, Moss no dice que falta proteína ni pide agua', () => {
    const r = reglas(['renal']);
    for (const que of ['proteina', 'agua'] as const) expect(apagaLoQueFalta(que, r)).toBe(true);
    // Un día con poca proteína a la tarde y poca agua: «Para hoy» lo diría.
    const dia: EntradaDeParaHoy = { ahora: 18 * 60, meta: { kcal: 2600, proteina: 150, carbohidratos: 325, grasas: 78 }, comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, sinAnotar: [], anotadas: 2, proxima: 'cena', agua: { ml: 500, meta: 2000 } };
    expect(paraHoy(dia).map((c) => c.tipo)).toEqual(['pocaProteina', 'agua']);
    expect(paraHoy(dia).filter((c) => !apagaConsejo(c, r))).toEqual([]);
    expect(referenciaConCuidados('potasio', { sexo: 'm', edad: 30 }, r)).toBeNull();
    expect(referenciaConCuidados('fosforo', { sexo: 'm', edad: 30 }, r)).toBeNull();
  });

  it('con diálisis, Moss no calcula: las metas van a mano', () => {
    const r = reglas(['renal'], { renal: { dialisis: true } });
    expect(r.manuales).toBe(true);
    expect(metaConCuidados(2400, persona(EL), 'equilibrada', r)).toBeNull();
    expect(controlConCuidados(control(SUBE), r)).toBeNull();
  });

  it('con cálculos, 2,5 L de agua y la proteína hasta 1 g por kilo (EAU 2026)', () => {
    const r = reglas(['calculos']);
    expect(r.agua).toBe(2500);
    expect(metaDeAgua(r, 2000)).toBe(2500);
    expect(metaDeAgua(NINGUNA, 2000)).toBe(2000);
    expect(metaConCuidados(2600, persona(EL), 'equilibrada', r)!.proteina).toBe(Math.round(1 * EL.pesoKg));
    expect(r.apagar).toEqual(['faltaProteina']);
    expect(r.prender).toEqual(['agua']);
  });

  it('con el riñón y cálculos, el agua es del equipo: Moss no la pide', () => {
    const r = reglas(['renal', 'calculos']);
    expect(r.agua).toBe('noPedir');
    expect(metaDeAgua(r, 2000)).toBeNull();
    expect(r.prender).toEqual([]);
  });
});

describe('la digestión y las articulaciones', () => {
  it('con reflujo, la última comida se prende, también con otra sin déficit; con un trastorno de la alimentación, no', () => {
    expect(reglas(['reflujo']).prender).toEqual(['ultimaComida']);
    expect(reglas(['reflujo', 'renal']).prender).toEqual(['ultimaComida']);
    expect(apagaLoQueConviene('ultimaComida', reglas(['reflujo', 'renal']))).toBe(false);
    expect(reglas(['reflujo', 'tca']).prender).toEqual([]);
    expect(apagaLoQueConviene('ultimaComida', reglas(['reflujo', 'tca']))).toBe(true);
  });

  it('con celiaquía, el gluten marcado y el hierro, el folato, la vitamina D y la B12 a la vista', () => {
    const r = reglas(['celiaquia']);
    expect(r.marcar).toEqual(['gluten']);
    expect(r.mirar).toEqual(['hierro', 'folato', 'vitaminaD', 'vitaminaB12']);
    expect(r.ritmoMaximo).toBe('rapido');
  });

  it('con gota, el alcohol y las bebidas azucaradas a la vista, sin culpa y sin cambiar la meta', () => {
    const r = reglas(['gota']);
    expect(r.marcar).toEqual(['alcohol', 'azucaradas']);
    expect(metaConCuidados(2400, persona(EL), 'equilibrada', r)).toEqual(metaPara(2400, persona(EL)));
  });
});

describe('lo que pide más cuidado', () => {
  it('con un trastorno de la alimentación: sin déficit, los números ocultos, sin peso meta y sin lo que empuja a comer más o menos', () => {
    const r = reglas(['tca']);
    expect(r).toMatchObject({ ritmoMaximo: 'ninguno', control: 'nuncaBaja', numerosOcultos: true, pesoMeta: false, profesional: 'necesario' });
    expect(r.apagar).toEqual(expect.arrayContaining(['faltaProteina', 'faltaCalorias', 'reparto', 'pasado', 'pesarse', 'ultimaComida', 'nocheCorta']));
    expect(r.estilosSin).toContain('keto');
    expect(estadoConCuidados('pasado', r)).toBe('cumplido');
    expect(estadoConCuidados('pasado', NINGUNA)).toBe('pasado');
  });

  it('con un trastorno de la alimentación, el control nunca baja la meta, aunque el peso suba', () => {
    const r = reglas(['tca']);
    const entrada = control(SUBE);
    expect(controlSemanal(entrada).metas.kcal).toBeLessThan(entrada.metasAnteriores.kcal);
    const c = controlConCuidados(entrada, r)!;
    expect(c.motivo).toBe('control');
    expect(c.metas.kcal).toBe(entrada.metasAnteriores.kcal);
    expect(c.gasto).toBe(controlSemanal(entrada).gasto);
  });

  it('con un medicamento para bajar de peso: la proteína, al menos 1,2 g por kilo (con obesidad, hasta 120 g), y un piso de 1.800 kcal en hombres', () => {
    const r = reglas(['glp1'], {}, EL);
    expect(r.piso).toBe(1800);
    expect(metaConCuidados(1500, persona(EL, 'bajar', 'rapido'), 'equilibrada', r)!.kcal).toBe(1800);
    expect(reglas(['glp1']).piso).toBeNull();
    // 120 kg y 170 cm (IMC 41,5): 1,2 g por kilo serían 144 g; alcanza con 120.
    const grande: PersonaDelCuidado = { ...EL, pesoKg: 120, alturaCm: 170 };
    expect(reglas(['glp1'], {}, grande).proteina).toMatchObject({ min: 1.2, minimoHasta: 120 });
    expect(r.prender).toEqual(['faltaProteina', 'faltaCalorias']);
    expect(apagaLoQueFalta('proteina', r)).toBe(false);
  });

  it('con otra o sin decir: sin déficit, la proteína hasta 1,2 g por kilo, sin keto y sin pedir agua', () => {
    const r = reglas(['otra']);
    expect(r).toMatchObject({ ritmoMaximo: 'ninguno', control: 'nuncaBaja', agua: 'noPedir' });
    expect(metaConCuidados(2700, persona(EL, 'subir'), 'keto', r)!.proteina).toBe(Math.round(1.2 * EL.pesoKg));
    expect(metaConCuidados(2700, persona(EL), 'keto', r)!.carbohidratos).toBeGreaterThan(30);
  });
});

describe('varias a la vez: gana la regla más cuidadosa', () => {
  it('el ritmo más lento, el piso más alto, el sodio más bajo, la cafeína más baja', () => {
    expect(reglas(['diabetes2', 'diabetes1'], { diabetes2: { bajaElAzucar: false } }).ritmoMaximo).toBe('suave');
    expect(reglas(['diabetes2', 'presion']).sodioMax).toBe(2000);
    expect(reglas(['lactancia', 'glp1']).piso).toBe(1800);
    expect(reglas(['embarazo', 'lactancia'], EN_LA_SEMANA_20)).toMatchObject({ etapa: 'embarazo', cafeinaTope: 200, control: 'pausa', alcoholTope: 0 });
  });

  it('el máximo de proteína le gana al mínimo: el riñón al medicamento', () => {
    const r = reglas(['renal', 'glp1'], {}, EL);
    expect(metaConCuidados(2600, persona(EL), 'equilibrada', r)!.proteina).toBe(Math.round(0.8 * EL.pesoKg));
    expect(metaConCuidados(2600, persona(EL), 'equilibrada', reglas(['otra', 'glp1'], {}, EL))!.proteina).toBe(Math.round(1.2 * EL.pesoKg));
  });

  it('el potasio sin meta del riñón le gana a la meta de la presión', () => {
    expect(reglas(['presion', 'renal']).potasio).toBe('sinMeta');
    expect(reglas(['renal', 'presion']).potasio).toBe('sinMeta');
  });

  it('lo que se prende nunca es algo que otra apaga', () => {
    for (const a of CUIDADOS) for (const b of CUIDADOS) {
      const r = reglas([a, b], EN_LA_SEMANA_20);
      for (const x of r.prender) expect(r.apagar).not.toContain(x);
    }
  });

  it('con cualquier cuidado no se pregunta la grasa', () => {
    for (const c of CUIDADOS) expect(reglas([c], EN_LA_SEMANA_20).grasa).toBe(false);
  });
});

describe('la privacidad', () => {
  it('a la cuenta va solo lo que se deriva, sin nombrar la condición', () => {
    expect(loQueSube(reglas(['embarazo'], EN_LA_SEMANA_20))).toEqual({ sinDeficit: true, controlEnPausa: true });
    expect(loQueSube(reglas(['celiaquia']))).toEqual({ sinDeficit: false, controlEnPausa: false });
  });

  it('ni las filas que suben ni el esquema de la base nombran un cuidado', () => {
    // «otra» y «colesterol» son palabras de todos los días (el colesterol, un micronutriente).
    const nombres = new RegExp(`\\b(cuidados?|${CUIDADOS.filter((c) => c !== 'otra' && c !== 'colesterol').join('|')})\\b`, 'i');
    expect(readFileSync(join(__dirname, '../almacen/remoto.ts'), 'utf8')).not.toMatch(nombres);
    const carpeta = join(__dirname, '../../supabase/moss');
    for (const archivo of readdirSync(carpeta).filter((a) => a.endsWith('.sql'))) {
      const sinComentarios = readFileSync(join(carpeta, archivo), 'utf8').replace(/--.*$/gm, '');
      expect(sinComentarios).not.toMatch(nombres);
    }
  });

  it('los avisos y los widgets nunca nombran una condición', () => {
    const plano = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(plano) : []);
    const nombra = /embaraz|lactancia|amamant|diabet|presi[oó]n|colesterol|triglic|ri[ñn][oó]n|renal|c[aá]lculos|reflujo|cel[ií]ac|\bgota\b|trastorno|insulina|medicamento|pregnan|breastfe|blood pressure|cholesterol|kidney|reflux|celiac|\bgout\b|eating disorder|insulin|medication/i;
    for (const t of [es, en]) for (const texto of [...plano(t.recordatorios), ...plano(t.widgets)]) expect(texto).not.toMatch(nombra);
  });
});

describe('los textos', () => {
  const de = (t: unknown, clave: string) => clave.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), t);
  const MARCAS: Marca[] = ['alcohol', 'cafeina', 'listeria', 'mercurio', 'azucaradas', 'sodio', 'potasio', 'saturadas', 'colesterol', 'fibra', 'carbohidratos', 'proteina', 'gluten'];

  it('cada condición tiene su nombre y su línea; cada grupo, lo que se apaga y lo que se marca, su texto, en los dos idiomas', () => {
    for (const t of [es, en]) {
      for (const c of CUIDADOS) {
        expect(typeof de(t, `cuidados.nombres.${c}`)).toBe('string');
        expect(typeof de(t, `cuidados.lineas.${c}`)).toBe('string');
      }
      for (const g of GRUPOS) expect(typeof de(t, `cuidados.grupos.${g.grupo}`)).toBe('string');
      for (const x of LO_QUE_DICE) expect(typeof de(t, `cuidados.dice.${x}`)).toBe('string');
      for (const m of MARCAS) expect(typeof de(t, `cuidados.marcas.${m}`)).toBe('string');
    }
  });

  it('las líneas no prometen tratar nada ni dan dosis', () => {
    for (const c of CUIDADOS) {
      expect(de(es, `cuidados.lineas.${c}`)).not.toMatch(/trat(a|ar|amos) (tu|la|el)|control(a|ar) (tu|la|el)|mejora(r)? (tu|la|el)|revert|cura|dosis|\d+ ?(mg|µg|UI) de/i);
      expect(de(en, `cuidados.lineas.${c}`)).not.toMatch(/\btreat(s)? (your|the)|control(s)? (your|the)|improve(s)? (your|the)|revers|\bcure|\bdose|\d+ ?(mg|µg|IU) of/i);
    }
  });
});
