import { describe, expect, it } from '@jest/globals';

import { controlSemanal, tendencia, type ComidaDelDia, type Pesada } from './control';
import { sumarDias, type DiaSemana } from './fechas';
import {
  ajusteDiario, ESTILOS, gastoBasal, macrosDePorcentajes, macrosPara, metaManual, metasIniciales, pisoDe, repartirSemana, ritmoPermitido,
  type Cuestionario, type Macros,
} from './metas';

const BASE: Cuestionario = { edad: 29, sexo: 'm', alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado' };

describe('la meta inicial', () => {
  it('da lo mismo que el resultado de la galería: 2.770 kcal, 119 g de proteína, 387 de carbohidratos y 83 de grasas', () => {
    expect(metasIniciales(BASE)).toEqual({ gasto: 2770, metas: { kcal: 2770, proteina: 119, carbohidratos: 387, grasas: 83 } });
  });

  it('Mifflin-St Jeor: 161 kcal menos en reposo para una mujer de las mismas medidas', () => {
    expect(gastoBasal(BASE) - gastoBasal({ ...BASE, sexo: 'f' })).toBe(166);
  });

  it('bajar al ritmo recomendado es medio por ciento del peso por semana', () => {
    expect(ajusteDiario('bajar', 'recomendado', 74.5)).toBeCloseTo(-409.75, 2);
    expect(metasIniciales({ ...BASE, objetivo: 'bajar' }).metas.kcal).toBe(2360);
  });

  it('subir suma, y mantener no cambia nada', () => {
    // 0,25 % de 74,5 kg por semana: 205 kcal por día más.
    expect(metasIniciales({ ...BASE, objetivo: 'subir' }).metas.kcal).toBe(2980);
    expect(ajusteDiario('mantener', 'rapido', 100)).toBe(0);
  });

  it('nunca baja del piso de calorías', () => {
    const chica = { ...BASE, sexo: 'f' as const, edad: 60, alturaCm: 150, pesoKg: 48, actividad: 'poco' as const, objetivo: 'bajar' as const, ritmo: 'rapido' as const };
    expect(metasIniciales(chica).metas.kcal).toBe(1200);
  });

  it('bajar rápido queda para los mayores de edad', () => {
    expect(ritmoPermitido({ edad: 16, objetivo: 'bajar', ritmo: 'rapido' })).toBe('recomendado');
    expect(ritmoPermitido({ edad: 16, objetivo: 'subir', ritmo: 'rapido' })).toBe('rapido');
    expect(ritmoPermitido({ edad: 30, objetivo: 'bajar', ritmo: 'rapido' })).toBe('rapido');
  });

  it('la proteína nunca pasa del 40 % de las kcal, y los carbohidratos no son negativos', () => {
    const m = macrosPara(1400, 160, 'bajar');
    expect(m.proteina * 4).toBeLessThanOrEqual(1400 * 0.4);
    expect(m.carbohidratos).toBeGreaterThanOrEqual(0);
  });
});

const kcalDe = (m: Macros) => m.proteina * 4 + m.carbohidratos * 4 + m.grasas * 9;

describe('cómo se reparten los macros', () => {
  const kcal = 2770;
  const de = Object.fromEntries(ESTILOS.map((e) => [e, macrosPara(kcal, 74.5, 'mantener', e)]));

  it('sin decir nada es la equilibrada, la de siempre', () => {
    expect(macrosPara(kcal, 74.5, 'mantener')).toEqual(de.equilibrada);
  });

  it('en todos, la proteína es la misma y los gramos suman las kcal', () => {
    for (const e of ESTILOS) {
      expect(de[e].proteina).toBe(de.equilibrada.proteina);
      expect(Math.abs(kcalDe(de[e]) - kcal)).toBeLessThanOrEqual(9);
    }
  });

  it('baja en grasas: el 20 % en grasas y lo demás en carbohidratos', () => {
    expect(de.bajaEnGrasas.grasas).toBe(Math.round((kcal * 0.2) / 9));
    expect(de.bajaEnGrasas.carbohidratos).toBeGreaterThan(de.equilibrada.carbohidratos);
  });

  it('baja en carbohidratos: un cuarto de las kcal, y keto: 30 g; las grasas se llevan el resto', () => {
    expect(de.bajaEnCarbohidratos.carbohidratos * 4).toBeLessThanOrEqual(kcal * 0.25 + 2);
    expect(de.keto.carbohidratos).toBe(30);
    expect(de.keto.grasas).toBeGreaterThan(de.bajaEnCarbohidratos.grasas);
    expect(de.bajaEnCarbohidratos.grasas).toBeGreaterThan(de.equilibrada.grasas);
  });
});

describe('las metas a mano', () => {
  it('con los gramos, las kcal salen de los macros', () => {
    expect(metaManual({ proteina: 150, carbohidratos: 200, grasas: 70 })).toEqual({ kcal: 2030, proteina: 150, carbohidratos: 200, grasas: 70 });
  });

  it('si se dan las kcal, quedan las que se dieron', () => {
    expect(metaManual({ kcal: 2100, proteina: 150.4, carbohidratos: 200, grasas: 70 })).toEqual({ kcal: 2100, proteina: 150, carbohidratos: 200, grasas: 70 });
  });

  it('con porcentajes de las kcal, y en proporción si no suman 100', () => {
    expect(macrosDePorcentajes(2000, { proteina: 30, carbohidratos: 40, grasas: 30 })).toEqual({ kcal: 2000, proteina: 150, carbohidratos: 200, grasas: 67 });
    expect(macrosDePorcentajes(2000, { proteina: 3, carbohidratos: 4, grasas: 3 })).toEqual(macrosDePorcentajes(2000, { proteina: 30, carbohidratos: 40, grasas: 30 }));
  });
});

describe('repartir la semana', () => {
  const meta: Macros = { kcal: 2500, proteina: 150, carbohidratos: 290, grasas: 80 };
  const finde: DiaSemana[] = [6, 0];
  const total = (r: Record<DiaSemana, Macros>) => Object.values(r).reduce((s, m) => s + m.kcal, 0);

  it('los días altos suben y los demás bajan, con el mismo total de la semana', () => {
    const r = repartirSemana(meta, finde, 500, 'm');
    expect(r[6].kcal).toBe(3000);
    expect(r[0].kcal).toBe(3000);
    expect(r[1].kcal).toBe(2300);
    expect(Math.abs(total(r) - 7 * meta.kcal)).toBeLessThanOrEqual(7);
  });

  it('la proteína y las grasas no cambian: se mueven los carbohidratos', () => {
    const r = repartirSemana(meta, finde, 500, 'm');
    for (const d of [0, 1, 2, 3, 4, 5, 6] as DiaSemana[]) {
      expect(r[d].proteina).toBe(150);
      expect(r[d].grasas).toBe(80);
    }
    expect(r[6].carbohidratos).toBe(290 + 125);
    expect(r[1].carbohidratos).toBe(290 - 50);
  });

  it('ningún día bajo queda por debajo del piso: si no alcanza, se reparte menos', () => {
    const chica: Macros = { kcal: 1400, proteina: 110, carbohidratos: 140, grasas: 45 };
    const r = repartirSemana(chica, [5, 6, 0], 800, 'f');
    expect(r[1].kcal).toBeGreaterThanOrEqual(pisoDe('f'));
    expect(Math.abs(total(r) - 7 * chica.kcal)).toBeLessThanOrEqual(7);
  });

  it('sin días altos, o con todos, la semana queda pareja', () => {
    expect(repartirSemana(meta, [], 500, 'm')[3]).toEqual(meta);
    expect(repartirSemana(meta, [0, 1, 2, 3, 4, 5, 6], 500, 'm')[3]).toEqual(meta);
  });
});

// Una serie de días: `dato(i)` da el valor del día i (0 es el más viejo), o null si ese día no hay.
function serie<T>(desde: string, dias: number, dato: (i: number) => T | null): { fecha: string; valor: T }[] {
  return Array.from({ length: dias }, (_, i) => ({ fecha: sumarDias(desde, i), valor: dato(i) }))
    .filter((d): d is { fecha: string; valor: T } => d.valor !== null);
}
const pesadas = (desde: string, dias: number, kg: (i: number) => number | null): Pesada[] => serie(desde, dias, kg).map((d) => ({ fecha: d.fecha, kg: d.valor }));
const comidas = (desde: string, dias: number, kcal: (i: number) => number | null): ComidaDelDia[] => serie(desde, dias, kcal).map((d) => ({ fecha: d.fecha, kcal: d.valor }));

describe('la tendencia del peso', () => {
  it('con el peso quieto, queda quieta', () => {
    const t = tendencia(pesadas('2026-09-01', 30, () => 80), '2026-09-30');
    expect(t.get('2026-09-30')).toBeCloseTo(80, 6);
  });

  it('rellena en línea recta los días sin pesada', () => {
    const t = tendencia([{ fecha: '2026-09-01', kg: 80 }, { fecha: '2026-09-11', kg: 79 }], '2026-09-11');
    // Con una recta de 80 a 79, la media móvil queda un poco atrás, entre los dos.
    expect(t.get('2026-09-11')!).toBeGreaterThan(79);
    expect(t.get('2026-09-11')!).toBeLessThan(80);
  });

  it('un día raro casi no la mueve', () => {
    const t = tendencia(pesadas('2026-09-01', 30, (i) => (i === 25 ? 83 : 80)), '2026-09-30');
    expect(t.get('2026-09-30')! - 80).toBeLessThan(0.3);
  });
});

describe('el control semanal', () => {
  const HOY = '2026-10-21';
  const perfil = { edad: 30, sexo: 'm' as const, pesoKg: 80, objetivo: 'mantener' as const, ritmo: 'recomendado' as const };
  const anteriores = { kcal: 2700, proteina: 128, carbohidratos: 412, grasas: 81 };
  const desde = sumarDias(HOY, -60);

  it('con el peso quieto, el gasto es lo que se come; la meta se mueve de a poco hacia ahí', () => {
    const c = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(c.motivo).toBe('control');
    expect(c.datos.gastoMedido).toBe(2500);
    expect(c.gasto).toBe(2650);
    expect(c.metas.kcal).toBe(2650);
  });

  it('si el peso baja, se gastó más de lo que se comió', () => {
    // Medio kilo por semana con 2.500 kcal por día: el gasto es 2.500 + 0,5 × 7.700 / 7 = 3.050.
    const c = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, (i) => 85 - (0.5 * i) / 7), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 3050, metasAnteriores: anteriores, perfil });
    expect(c.datos.gastoMedido!).toBeGreaterThan(3030);
    expect(c.datos.gastoMedido!).toBeLessThan(3070);
  });

  it('es neutral al cumplimiento: comer de más no se «compensa» después', () => {
    // Las dos personas gastan 2.500 por día. Una come eso; la otra, 500 más, y sube lo que corresponde.
    const sube = (500 * 7) / KCAL;
    const justa = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2500, metasAnteriores: anteriores, perfil });
    const demas = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, (i) => 80 + (sube * i) / 7), comidas: comidas(desde, 60, () => 3000), gastoAnterior: 2500, metasAnteriores: anteriores, perfil });
    expect(Math.abs(demas.datos.gastoMedido! - justa.datos.gastoMedido!)).toBeLessThan(25);
    expect(Math.abs(demas.metas.kcal - justa.metas.kcal)).toBeLessThanOrEqual(10);
  });

  it('lo calculado a ojo mueve el gasto más despacio: con todo a ojo, la mitad', () => {
    const pesado = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    const aOjo = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500).map((c) => ({ ...c, kcalEstimadas: c.kcal })), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    const mitad = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500).map((c) => ({ ...c, kcalEstimadas: c.kcal / 2 })), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    // El gasto medido es el mismo: lo que cambia es cuánto se mueve.
    expect(aOjo.datos.gastoMedido).toBe(pesado.datos.gastoMedido);
    expect(pesado.gasto).toBe(2650);
    expect(aOjo.gasto).toBe(2675);
    expect(mitad.gasto).toBe(2663); // 2662,5, redondeado
    expect(aOjo.datos.fraccionEstimada).toBe(1);
    expect(pesado.datos.fraccionEstimada).toBe(0);
  });

  it('sin 4 días con comida o sin una pesada en la semana, la meta queda como estaba y dice por qué', () => {
    const pocaComida = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, (i) => (i >= 57 ? 2500 : null)), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(pocaComida).toMatchObject({ motivo: 'faltanDatos', gasto: 2700, metas: anteriores });
    expect(pocaComida.datos.diasConComida).toBe(3);
    const sinPeso = controlSemanal({ hoy: HOY, pesadas: pesadas(desde, 40, () => 80), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(sinPeso).toMatchObject({ motivo: 'faltanDatos', metas: anteriores });
  });

  it('la primera semana todavía no hay tendencia para medir', () => {
    const corta = sumarDias(HOY, -5);
    const c = controlSemanal({ hoy: HOY, pesadas: pesadas(corta, 5, () => 80), comidas: comidas(corta, 5, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(c.motivo).toBe('faltanDatos');
  });
});

const KCAL = 7700;
