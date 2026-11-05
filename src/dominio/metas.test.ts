import { describe, expect, it } from '@jest/globals';

import { cambioPorDia, controlSemanal, pesadasQueCuentan, tendencia, type ComidaDelDia, type Pesada } from './control';
import { eleccionDe, metaDelCuestionario, proteinaDelNivel, type Respuestas } from './cuestionario';
import { sumarDias, type DiaSemana } from './fechas';
import {
  ajusteDiario, ajustePorRitmo, EDAD_MINIMA, enRango, ESTILOS, gastoBasal, macrosConProteina, macrosDePorcentajes, macrosPara, metaDeFibra, metaManual, metaPara, metaRepartida, metasIniciales, motivoParaNo, objetivoPermitido, pesoMinimoSano, pisoDe,
  RANGOS_DEL_CUESTIONARIO, repartirSemana, RITMOS, ritmoPermitido,
  type Cuestionario, type Macros,
} from './metas';

const BASE: Cuestionario = { edad: 29, sexo: 'm', alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado' };

describe('los límites que cuidan', () => {
  it('Moss es para mayores de 16', () => {
    expect(EDAD_MINIMA).toBe(16);
    expect(RANGOS_DEL_CUESTIONARIO.edad[0]).toBe(EDAD_MINIMA);
    expect(enRango(RANGOS_DEL_CUESTIONARIO.edad, 15)).toBe(false);
    expect(enRango(RANGOS_DEL_CUESTIONARIO.edad, 16)).toBe(true);
  });

  it('sin déficit (embarazo, lactancia o una condición médica), bajar queda en mantener', () => {
    const bajar = { ...BASE, objetivo: 'bajar' as const, ritmo: 'rapido' as const };
    expect(objetivoPermitido({ ...bajar, sinDeficit: true })).toBe('mantener');
    expect(objetivoPermitido({ ...BASE, objetivo: 'subir', sinDeficit: true })).toBe('subir');
    const gasto = 2700;
    expect(metaPara(gasto, { ...bajar, sinDeficit: true }).kcal).toBe(metaPara(gasto, BASE).kcal);
    expect(metaPara(gasto, bajar).kcal).toBeLessThan(gasto);
  });

  it('sin déficit, keto no: queda la equilibrada', () => {
    const sin = { ...BASE, sinDeficit: true };
    expect(metaPara(2700, sin, 'keto').carbohidratos).toBeGreaterThan(30);
    expect(metaPara(2700, sin, 'keto')).toEqual(metaPara(2700, sin, 'equilibrada'));
    expect(metaPara(2700, sin, 'bajaEnCarbohidratos')).not.toEqual(metaPara(2700, sin, 'equilibrada'));
    expect(metaPara(2700, BASE, 'keto').carbohidratos).toBe(30);
  });

  it('el ritmo más rápido para bajar no pasa del 1 % del peso por semana', () => {
    expect(Math.max(...Object.values(RITMOS.bajar).map(Math.abs))).toBeLessThanOrEqual(1);
  });

  it('bajar rápido con 150 kg: el déficit no pasa de 1.000 kcal ni de 1 kg por semana', () => {
    // El 0,75 % de 150 kg pediría 1.238 kcal por día y 1,13 kg por semana.
    expect(ajusteDiario('bajar', 'rapido', 150)).toBe(-1000);
    const m = metaPara(3600, { edad: 40, sexo: 'm', pesoKg: 150, objetivo: 'bajar', ritmo: 'rapido' });
    expect(3600 - m.kcal).toBeLessThanOrEqual(1000);
    expect(((3600 - m.kcal) * 7) / 7700).toBeLessThanOrEqual(1);
    // Con menos peso manda el ritmo, y subir no tiene tope.
    expect(ajusteDiario('bajar', 'rapido', 80)).toBeCloseTo(-660, 6);
    expect(ajustePorRitmo(-2, 80)).toBe(-1000);
    expect(ajustePorRitmo(0.4, 150)).toBeCloseTo(660, 6);
  });

  it('una meta a mano por debajo del piso no se acepta, y dice por qué', () => {
    expect(motivoParaNo({ kcal: 1100 }, 'f')).toBe('piso');
    expect(motivoParaNo({ kcal: 1200 }, 'f')).toBeNull();
    expect(motivoParaNo({ kcal: 1300 }, 'm')).toBe('piso');
    expect(pisoDe('m')).toBe(1500);
  });

  it('el peso meta más bajo es el de un IMC de 18,5', () => {
    expect(pesoMinimoSano(172)).toBe(54.8);
    expect(pesoMinimoSano(160)).toBe(47.4);
  });
});

describe('la meta inicial', () => {
  // La de la app hasta programar el cuestionario nuevo (cuestionario.ts), que en la galería da otra.
  it('con el nivel de actividad: 2.770 kcal, 119 g de proteína, 387 de carbohidratos y 83 de grasas', () => {
    expect(metasIniciales(BASE)).toEqual({ gasto: 2770, metas: { kcal: 2770, proteina: 119, carbohidratos: 387, grasas: 83 } });
  });

  it('Mifflin-St Jeor: 166 kcal menos en reposo para una mujer de las mismas medidas (−161 en lugar de +5)', () => {
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
    expect(ritmoPermitido({ edad: 17, objetivo: 'bajar', ritmo: 'rapido' })).toBe('recomendado');
    expect(ritmoPermitido({ edad: 18, objetivo: 'bajar', ritmo: 'rapido' })).toBe('rapido');
  });

  it('la proteína nunca pasa del 40 % de las kcal, y los carbohidratos no son negativos', () => {
    const m = macrosPara(1400, 160, 'bajar');
    expect(m.proteina * 4).toBeLessThanOrEqual(1400 * 0.4);
    expect(m.carbohidratos).toBeGreaterThanOrEqual(0);
  });

  it('la fibra: 14 g cada 1.000 kcal y, desde los 18, al menos 25 g', () => {
    expect(metaDeFibra(1200, 30)).toBe(25);
    expect(metaDeFibra(2500, 30)).toBe(35);
    expect(metaDeFibra(1200, 17)).toBe(17);
    // Sin la edad, como un adulto.
    expect(metaDeFibra(1200)).toBe(25);
  });
});

const kcalDe = (m: Macros) => m.proteina * 4 + m.carbohidratos * 4 + m.grasas * 9;

describe('los macros con mucho peso', () => {
  it('una mujer de 140 kg y 165 cm a 1.760 kcal: las grasas no pasan del 35 %', () => {
    // Con 0,6 g por kilo serían 84 g, el 43 %, y quedarían 75 g de carbohidratos.
    const m = macrosPara(1760, 140, 'bajar');
    expect((m.grasas * 9) / 1760).toBeLessThanOrEqual(0.35);
    expect(m.carbohidratos).toBeGreaterThan(100);
    expect((macrosPara(1760, 140, 'bajar', 'bajaEnGrasas').grasas * 9) / 1760).toBeLessThanOrEqual(0.35);
  });

  it('160 kg a 1.400 kcal: los macros suman las kcal (antes, 1.424 y sin carbohidratos)', () => {
    const m = macrosPara(1400, 160, 'bajar');
    expect(Math.abs(kcalDe(m) - 1400)).toBeLessThanOrEqual(10);
    expect(m.carbohidratos).toBeGreaterThan(0);
  });

  it('con poco peso, el mínimo de siempre: 0,6 g por kilo o el 27 %', () => {
    expect(macrosPara(2770, 74.5, 'mantener').grasas).toBe(Math.round((2770 * 0.27) / 9));
    expect(macrosPara(1600, 90, 'bajar').grasas).toBe(54);
  });
});

describe('lo elegido en el cuestionario nuevo', () => {
  it('la meta del control parte de lo mismo que la del cuestionario', () => {
    const pesas = { tipos: ['fuerza' as const], sesiones: [{ tipo: 'fuerza' as const, dias: [1, 3, 5] as DiaSemana[], hora: 18 * 60, minutos: 60 }], viaje: 15 };
    const casos: Respuestas[] = [
      { edad: 30, sexo: 'm', alturaCm: 178, pesoKg: 80, movimiento: 'sentado', entreno: pesas, objetivo: 'recomponer', ritmo: 'recomendado', grasa: { como: 'dicha', pct: 28 }, proteina: 'alta' },
      { edad: 30, sexo: 'f', alturaCm: 165, pesoKg: 70, movimiento: 'dePie', entreno: null, objetivo: 'bajar', ritmo: 'recomendado', pct: 0.62 },
      { edad: 30, sexo: 'm', alturaCm: 178, pesoKg: 70, movimiento: 'sentado', entreno: pesas, objetivo: 'subir', ritmo: 'suave', proteina: 'baja' },
    ];
    for (const r of casos) {
      const x = metaDelCuestionario(r);
      expect(metaPara(x.gasto.total, { ...r, objetivo: x.objetivo }, 'equilibrada', eleccionDe(r))).toEqual(x.metas);
    }
  });
});

describe('cómo se reparten los macros', () => {
  const kcal = 2770;
  const de = Object.fromEntries(ESTILOS.map((e) => [e, macrosPara(kcal, 74.5, 'mantener', e)]));

  it('sin decir nada es la equilibrada, la de siempre', () => {
    expect(macrosPara(kcal, 74.5, 'mantener')).toEqual(de.equilibrada);
  });

  it('con la proteína ya elegida, el resto se reparte igual, y nunca pasa del 40 %', () => {
    for (const e of ESTILOS) expect(macrosConProteina(kcal, 74.5, 74.5 * 1.6, e)).toEqual(de[e]);
    expect(macrosConProteina(1400, 74.5, 200).proteina).toBe(140);
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

  it('la meta de cada día sale del perfil: sin repartir, la guardada', () => {
    expect(metaRepartida(meta, { sexo: 'm' }, 6)).toEqual(meta);
    expect(metaRepartida(meta, null, 6)).toEqual(meta);
    expect(metaRepartida(meta, { sexo: 'm', semana: { altos: finde, extra: 500 } }, 6).kcal).toBe(3000);
    expect(metaRepartida(meta, { sexo: 'm', semana: { altos: finde, extra: 500 } }, 3).kcal).toBe(2300);
  });

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

  it('después de la última pesada no la copia: sigue con su pendiente, hasta una semana', () => {
    const t = tendencia(pesadas('2026-09-01', 30, (i) => 80 - 0.1 * i), '2026-10-15');
    const ultima = t.get('2026-09-30')!;
    expect(t.get('2026-10-03')!).toBeCloseTo(ultima - 0.3, 6);
    expect(t.get('2026-10-07')!).toBeCloseTo(ultima - 0.7, 6);
    // Más de una semana sin pesarse, no se adivina: queda donde llegó.
    expect(t.get('2026-10-15')!).toBeCloseTo(ultima - 0.7, 6);
  });
});

describe('las pesadas raras', () => {
  // Una serie con el ruido del peso (0,5 kg que dura unos días, como en spec/estudio/progreso.md), con semilla fija.
  function azar(semilla: number) {
    let a = semilla >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const normal = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

  it('pesándose los lunes, una de 2 kg de más mueve el gasto medido un cuarto de lo que lo movería entera', () => {
    const lunes = '2026-10-19';
    const deLunes = (raro: number) => Array.from({ length: 9 }, (_, i) => ({ fecha: sumarDias(lunes, -7 * (8 - i)), kg: 85 - 0.5 * i + (i === 7 ? raro : 0) }));
    const control = (p: Pesada[]) => controlSemanal({
      hoy: lunes, pesadas: p, comidas: comidas(sumarDias(lunes, -63), 63, () => 2000), gastoAnterior: 2550,
      metasAnteriores: { kcal: 2000, proteina: 150, carbohidratos: 200, grasas: 60 }, perfil: { edad: 30, sexo: 'm', pesoKg: 85, objetivo: 'bajar', ritmo: 'recomendado' },
    }).datos.gastoMedido!;
    // Entera, la última de las tres pesadas del tramo inclina la recta 2 × 7 / 98 kg por día: 1.100 kcal.
    const movio = Math.abs(control(deLunes(2)) - control(deLunes(0)));
    expect(movio).toBeGreaterThan(250);
    expect(movio).toBeLessThan(300);
  });

  it('pesándose a diario con el ruido de siempre, casi nunca toca una pesada y la tendencia queda igual', () => {
    const r = azar(7);
    let tocadas = 0;
    let total = 0;
    let lejos = 0;
    for (let k = 0; k < 300; k++) {
      let e = 0;
      const p = pesadas('2026-07-01', 90, (i) => {
        e = i === 0 ? normal(r) * 0.5 : 0.6 * e + normal(r) * 0.5 * Math.sqrt(1 - 0.36);
        return Math.round((80 - (0.4 / 7) * i + e) * 10) / 10;
      });
      const cuentan = pesadasQueCuentan(p);
      tocadas += cuentan.filter((x, i) => x.kg !== p[i].kg).length;
      total += p.length;
      // La media móvil de las pesadas tal cual (todas son de días seguidos), contra la de la app.
      const tal = p.reduce<number | null>((m, x) => (m === null ? x.kg : m + 0.1 * (x.kg - m)), null)!;
      if (Math.abs(tendencia(p, p[p.length - 1].fecha).get(p[p.length - 1].fecha)! - tal) > 0.02) lejos++;
    }
    expect(tocadas / total).toBeLessThan(0.01);
    expect(lejos / 300).toBeLessThan(0.05);
  });

  it('un salto de verdad, confirmado por la pesada siguiente, entra entero; una sola rara, con un cuarto', () => {
    const salto = pesadas('2026-08-01', 60, (i) => (i < 50 ? 80 : 82));
    expect(pesadasQueCuentan(salto).slice(50).map((x) => x.kg)).toEqual(salto.slice(50).map((x) => x.kg));
    const una = pesadasQueCuentan(pesadas('2026-08-01', 60, (i) => (i === 50 ? 82 : 80)));
    expect(una[50].kg).toBeCloseTo(80.5, 6);
    expect(una[51].kg).toBe(80);
    // Las primeras, sin con qué compararlas, cuentan enteras.
    expect(pesadasQueCuentan([{ fecha: '2026-08-01', kg: 80 }, { fecha: '2026-08-02', kg: 83 }])[1].kg).toBe(83);
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

  it('sin déficit, el control nunca baja la meta: el peso que sube en un embarazo no es comer de más', () => {
    // Sube 0,06 kg por día comiendo parejo: medido así, el gasto baja y la meta bajaría hasta que el peso no suba.
    const sube = { hoy: HOY, pesadas: pesadas(desde, 60, (i) => 80 + 0.06 * i), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores };
    expect(controlSemanal({ ...sube, perfil }).metas.kcal).toBeLessThan(anteriores.kcal);
    const sin = controlSemanal({ ...sube, perfil: { ...perfil, sinDeficit: true } });
    expect(sin.motivo).toBe('control');
    expect(sin.metas.kcal).toBe(anteriores.kcal);
    // El gasto se sigue midiendo, y los macros salen del peso de ahora.
    expect(sin.gasto).toBeLessThan(2700);
    expect(sin.metas.proteina).toBe(Math.round(sin.datos.pesoDeTendencia! * 1.6));
    // Si la meta sube, sube.
    const baja = controlSemanal({ ...sube, pesadas: pesadas(desde, 60, (i) => 80 - 0.06 * i), perfil: { ...perfil, sinDeficit: true } });
    expect(baja.metas.kcal).toBeGreaterThan(anteriores.kcal);
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

  it('el primer control, con la primera semana entera (7 días con datos), ya mide', () => {
    const d0 = sumarDias(HOY, -7);
    const c = controlSemanal({ hoy: HOY, pesadas: pesadas(d0, 7, (i) => (i % 3 === 0 ? 80 : null)), comidas: comidas(d0, 7, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(c.motivo).toBe('control');
    expect(c.datos.gastoMedido).toBe(2500);
    // Con la primera comida un día después, son 6 días: todavía no.
    const tarde = controlSemanal({ hoy: HOY, pesadas: pesadas(d0, 7, () => 80), comidas: comidas(d0, 7, (i) => (i ? 2500 : null)), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(tarde.motivo).toBe('faltanDatos');
  });

  it('las pesadas de antes de la primera comida (las de Salud) no cuentan', () => {
    // Dos meses subiendo medio kilo por semana antes de Moss; con Moss, 2.000 kcal y el peso quieto.
    const d0 = sumarDias(HOY, -14);
    const antes = pesadas(sumarDias(d0, -60), 60, (i) => 78 + (0.5 * i) / 7);
    const tope = antes[antes.length - 1].kg;
    const todas = [...antes, ...pesadas(d0, 14, () => tope)];
    const conMoss = comidas(d0, 14, () => 2000);
    const semana1 = controlSemanal({ hoy: sumarDias(d0, 7), pesadas: todas, comidas: conMoss, gastoAnterior: 2000, metasAnteriores: anteriores, perfil });
    expect(semana1.datos.gastoMedido).toBe(2000);
    const semana2 = controlSemanal({ hoy: HOY, pesadas: todas, comidas: conMoss, gastoAnterior: 2000, metasAnteriores: anteriores, perfil });
    expect(semana2.datos.gastoMedido).toBe(2000);
    expect(semana2.datos.dias).toBe(13);
  });

  it('las primeras semanas mide el ritmo entero, sin el atraso de la tendencia', () => {
    // Medio kilo por semana con 2.000 kcal: el gasto es 2.000 + 0,5 × 7.700 / 7 = 2.550.
    const d0 = sumarDias(HOY, -15);
    const c = controlSemanal({ hoy: HOY, pesadas: pesadas(d0, 15, (i) => 85 - (0.5 * i) / 7), comidas: comidas(d0, 15, () => 2000), gastoAnterior: 2550, metasAnteriores: anteriores, perfil });
    expect(c.datos.gastoMedido).toBe(2550);
    expect(c.datos.cambioDeTendencia!).toBeCloseTo((-0.5 * 14) / 7, 5);
  });

  it('con una pesada por semana, el ritmo medido es el real: no inventa los días después de la última', () => {
    // Los lunes, medio kilo menos por semana en línea recta; el control de un lunes mira hasta el domingo.
    // Copiando la última pesada hasta el domingo daba 0,39 kg por semana y 2.425 kcal.
    const lunes = '2026-10-19';
    const deLunes = Array.from({ length: 9 }, (_, i) => ({ fecha: sumarDias(lunes, -7 * (8 - i)), kg: 85 - 0.5 * i }));
    const c = controlSemanal({ hoy: lunes, pesadas: deLunes, comidas: comidas(sumarDias(lunes, -63), 63, () => 2000), gastoAnterior: 2550, metasAnteriores: anteriores, perfil });
    expect(c.motivo).toBe('control');
    const porSemana = (c.datos.cambioDeTendencia! / c.datos.dias!) * 7;
    expect(porSemana).toBeGreaterThan(-0.52);
    expect(porSemana).toBeLessThan(-0.48);
    expect(Math.abs(c.datos.gastoMedido! - 2550)).toBeLessThanOrEqual(15);
  });

  it('una sola pesada en el tramo no mide: tomaría lo comido por el gasto', () => {
    const d0 = sumarDias(HOY, -7);
    const una = controlSemanal({ hoy: HOY, pesadas: [{ fecha: sumarDias(d0, 3), kg: 80 }], comidas: comidas(d0, 7, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(una).toMatchObject({ motivo: 'faltanDatos', gasto: 2700, metas: anteriores });
    // Dos, a menos de una semana una de otra, tampoco.
    const cerca = controlSemanal({ hoy: HOY, pesadas: [{ fecha: sumarDias(d0, 1), kg: 80 }, { fecha: sumarDias(d0, 5), kg: 79.8 }], comidas: comidas(d0, 7, () => 2500), gastoAnterior: 2700, metasAnteriores: anteriores, perfil });
    expect(cerca.motivo).toBe('faltanDatos');
  });

  describe('con lo elegido en el cuestionario nuevo', () => {
    const quieto = { hoy: HOY, pesadas: pesadas(desde, 60, () => 80), comidas: comidas(desde, 60, () => 2500), gastoAnterior: 2700 };
    const pesas = { tipos: ['fuerza' as const], sesiones: [{ tipo: 'fuerza' as const, dias: [1, 3, 5] as DiaSemana[], hora: 18 * 60, minutos: 60 }], viaje: 15 };

    it('con recomposición (mucha grasa) y proteína alta, después del control siguen el −0,25 % por semana y la proteína', () => {
      const r: Respuestas = { edad: 30, sexo: 'm', alturaCm: 178, pesoKg: 80, movimiento: 'sentado', entreno: pesas, objetivo: 'recomponer', ritmo: 'recomendado', grasa: { como: 'dicha', pct: 28 }, proteina: 'alta' };
      const x = metaDelCuestionario(r);
      const eleccion = eleccionDe(r);
      expect(eleccion).toEqual({ proteinaPorKg: proteinaDelNivel(r) / 80, pct: -0.25 });
      const c = controlSemanal({ ...quieto, metasAnteriores: x.metas, perfil: { ...perfil, objetivo: x.objetivo }, eleccion });
      // El gasto toma un cuarto: de 2.700 a 2.650; menos el 0,25 % de 80 kg (220 kcal).
      expect(c.metas.kcal).toBe(2430);
      expect(c.metas.proteina).toBe(Math.round(proteinaDelNivel(r)));
      // Sin la elección volvería a la de fábrica: mantener, 1,6 g por kilo.
      const deFabrica = controlSemanal({ ...quieto, metasAnteriores: x.metas, perfil: { ...perfil, objetivo: x.objetivo } });
      expect(deFabrica.metas).toMatchObject({ kcal: 2650, proteina: 128 });
    });

    it('con la fecha que pide el 0,62 % por semana, el control mantiene el 0,62 %', () => {
      const bajar = { ...perfil, objetivo: 'bajar' as const };
      const c = controlSemanal({ ...quieto, metasAnteriores: anteriores, perfil: bajar, eleccion: { pct: -0.62 } });
      expect(c.metas.kcal).toBe(Math.round((2650 + ajustePorRitmo(-0.62, 80)) / 10) * 10);
      // Sin la fecha, el ritmo del perfil: el recomendado, 0,5 %.
      expect(controlSemanal({ ...quieto, metasAnteriores: anteriores, perfil: bajar }).metas.kcal).toBe(2650 - 440);
      // Sin déficit, la fecha tampoco baja.
      expect(controlSemanal({ ...quieto, metasAnteriores: anteriores, perfil: { ...bajar, sinDeficit: true }, eleccion: { pct: -0.62 } }).metas.kcal).toBe(2700);
    });
  });
});

describe('el cambio del peso por día', () => {
  const desde = '2026-09-01';
  const hasta = '2026-09-15';

  it('la recta por las pesadas de verdad: salteadas, o con la tendencia ya arrancada, igual', () => {
    const lineal = pesadas(desde, 15, (i) => 80 - 0.1 * i);
    expect(cambioPorDia(lineal, desde, hasta)!).toBeCloseTo(-0.1, 6);
    expect(cambioPorDia(lineal.filter((_, i) => i % 4 === 0 || i === 14), desde, hasta)!).toBeCloseTo(-0.1, 6);
    // La tendencia atrasa; la recta, no.
    const largo = pesadas('2026-07-01', 77, (i) => 85 - 0.1 * i);
    expect(cambioPorDia(largo, desde, hasta)!).toBeCloseTo(-0.1, 6);
  });

  it('con menos de dos pesadas, o a menos de una semana una de otra, no hay cambio', () => {
    expect(cambioPorDia([], desde, hasta)).toBeNull();
    expect(cambioPorDia([{ fecha: '2026-09-10', kg: 80 }], desde, hasta)).toBeNull();
    expect(cambioPorDia(pesadas('2026-09-10', 6, () => 80), desde, hasta)).toBeNull();
    expect(cambioPorDia(pesadas('2026-09-09', 7, () => 80), desde, hasta)).toBe(0);
  });
});

const KCAL = 7700;

describe('lo que se puede contestar', () => {
  it('cabe en lo que acepta la base, y lo de afuera no entra', () => {
    // supabase/moss: la altura de 50 a 260 cm y el peso de 20 a 400 kg.
    expect(RANGOS_DEL_CUESTIONARIO.alturaCm[0]).toBeGreaterThanOrEqual(50);
    expect(RANGOS_DEL_CUESTIONARIO.alturaCm[1]).toBeLessThanOrEqual(260);
    expect(RANGOS_DEL_CUESTIONARIO.pesoKg[0]).toBeGreaterThanOrEqual(20);
    expect(RANGOS_DEL_CUESTIONARIO.pesoKg[1]).toBeLessThanOrEqual(400);
    expect(enRango(RANGOS_DEL_CUESTIONARIO.edad, 95)).toBe(true);
    expect(enRango(RANGOS_DEL_CUESTIONARIO.pesoKg, 260)).toBe(false);
    expect(enRango(RANGOS_DEL_CUESTIONARIO.alturaCm, Number.NaN)).toBe(false);
  });
});
