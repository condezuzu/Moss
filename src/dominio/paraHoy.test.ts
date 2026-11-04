import { describe, expect, it } from '@jest/globals';

import * as Fechas from './fechas';
import { MAXIMO_DE_CONSEJOS, paraHoy, type ConsejoDeHoy, type EntradaDeParaHoy } from './paraHoy';
import { segunElDeporte, type ConsejoDelDeporte, type EntradaDelDeporte } from './segunElDeporte';

const META = { kcal: 2600, proteina: 150, carbohidratos: 325, grasas: 78 };
const dia = (cambios: Partial<EntradaDeParaHoy>): EntradaDeParaHoy => ({
  ahora: 14 * 60,
  meta: META,
  comido: { kcal: 1100, proteina: 65, carbohidratos: 140, grasas: 33 },
  sinAnotar: [],
  anotadas: 2,
  proxima: 'merienda',
  ...cambios,
});

describe('para hoy', () => {
  it('lo que falta anotar va primero; sin nada anotado, solo cuando ya pasaron dos comidas', () => {
    expect(paraHoy(dia({ sinAnotar: ['almuerzo'] }))[0]).toEqual({ tipo: 'anotar', comidas: ['almuerzo'] });
    const nada = { anotadas: 0, comido: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 } };
    expect(paraHoy(dia({ ...nada, sinAnotar: ['desayuno', 'almuerzo'] }))).toEqual([{ tipo: 'nadaAnotado' }]);
    expect(paraHoy(dia({ ...nada, sinAnotar: ['desayuno'] }))).toEqual([]);
  });

  it('el reparto: mucha proteína y pocos carbohidratos, o al revés, con lo que conviene en la próxima comida', () => {
    const conProteina = dia({ comido: { kcal: 1100, proteina: 110, carbohidratos: 90, grasas: 30 } });
    expect(paraHoy(conProteina)).toEqual([{ tipo: 'pocosCarbohidratos', proxima: 'merienda' }]);
    const conCarbos = dia({ comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, proxima: 'cena', ahora: 18 * 60 });
    expect(paraHoy(conCarbos)).toEqual([{ tipo: 'pocaProteina', proxima: 'cena' }]);
    // Con poco comido, no se mira: cualquier comida desequilibra.
    expect(paraHoy(dia({ comido: { kcal: 500, proteina: 40, carbohidratos: 20, grasas: 15 } }))).toEqual([]);
  });

  it('con la meta baja en carbohidratos (keto o baja en carbohidratos), no pide carbohidratos', () => {
    const keto = { kcal: 2400, proteina: 119, carbohidratos: 30, grasas: 200 };
    expect(paraHoy(dia({ ahora: 15 * 60, meta: keto, comido: { kcal: 1000, proteina: 70, carbohidratos: 8, grasas: 78 } }))).toEqual([]);
    const bajaEnCarbohidratos = { kcal: 2400, proteina: 119, carbohidratos: 150, grasas: 147 };
    expect(paraHoy(dia({ ahora: 15 * 60, meta: bajaEnCarbohidratos, comido: { kcal: 1000, proteina: 70, carbohidratos: 40, grasas: 60 } }))).toEqual([]);
    // Con la equilibrada, lo mismo comido sí lo dice.
    expect(paraHoy(dia({ ahora: 15 * 60, comido: { kcal: 1000, proteina: 90, carbohidratos: 80, grasas: 30 } })).map((x) => x.tipo)).toEqual(['pocosCarbohidratos']);
  });

  it('muchas grasas, si pasan por mucho a los otros dos', () => {
    const grasoso = dia({ comido: { kcal: 1300, proteina: 60, carbohidratos: 120, grasas: 60 } });
    expect(paraHoy(grasoso)).toEqual([{ tipo: 'muchaGrasa', proxima: 'merienda' }]);
  });

  it('lo que falta de proteína, desde la tarde y con 25 g o más, de a 5; sin repetir lo del reparto', () => {
    expect(paraHoy(dia({ ahora: 17 * 60, proxima: 'cena' }))).toEqual([{ tipo: 'faltaProteina', gramos: 85, proxima: 'cena' }]);
    expect(paraHoy(dia({ ahora: 15 * 60 }))).toEqual([]);
    expect(paraHoy(dia({ ahora: 21 * 60, comido: { kcal: 2400, proteina: 130, carbohidratos: 300, grasas: 70 } }))).toEqual([]);
    const conCarbos = dia({ ahora: 19 * 60, comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, proxima: 'cena' });
    expect(paraHoy(conCarbos).map((x) => x.tipo)).toEqual(['pocaProteina']);
    // «Vas bien de proteína» y «te faltan 40 g de proteína» juntos se contradicen: queda el reparto.
    const conProteina = dia({ ahora: 17 * 60 + 40, comido: { kcal: 1250, proteina: 110, carbohidratos: 95, grasas: 38 }, proxima: 'cena' });
    expect(paraHoy(conProteina).map((x) => x.tipo)).toEqual(['pocosCarbohidratos']);
  });

  it('el agua, desde las tres y debajo de la mitad, en vasos', () => {
    expect(paraHoy(dia({ ahora: 16 * 60, comido: { kcal: 1500, proteina: 130, carbohidratos: 230, grasas: 45 }, agua: { ml: 750, meta: 2000 } }))).toEqual([{ tipo: 'agua', vasos: 5 }]);
    expect(paraHoy(dia({ ahora: 14 * 60, agua: { ml: 250, meta: 2000 } }))).toEqual([]);
  });

  it('con «sin déficit», solo anotar y el agua', () => {
    const e = dia({ sinDeficit: true, ahora: 18 * 60, sinAnotar: ['merienda'], comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, agua: { ml: 500, meta: 2000 } });
    expect(paraHoy(e).map((x) => x.tipo)).toEqual(['anotar', 'agua']);
  });

  it(`como mucho ${MAXIMO_DE_CONSEJOS}, en orden`, () => {
    const todo = dia({ ahora: 18 * 60, sinAnotar: ['merienda'], comido: { kcal: 1400, proteina: 45, carbohidratos: 230, grasas: 66 }, agua: { ml: 500, meta: 2000 }, proxima: 'cena' });
    expect(paraHoy(todo).map((x) => x.tipo)).toEqual(['anotar', 'pocaProteina', 'muchaGrasa']);
  });
});

describe('para hoy, con lo del deporte', () => {
  // La corredora el viernes: su carrera de 2 h es el domingo, se pesó antes y después de la bici y viene baja de hierro.
  const HOY = '2026-10-23';
  const corredora = (extra: Partial<EntradaDelDeporte> = {}): EntradaDelDeporte => ({
    hoy: HOY, sexo: 'f', edad: 34, pesoKg: 58, carrera: { fecha: '2026-10-25', minutos: 120 },
    entreno: { tipos: ['resistencia'], sesiones: [{ tipo: 'resistencia', dias: [2, 4, 6], hora: 7 * 60, minutos: 50 }], partidos: null },
    ...extra,
  });
  const pesadas = { antes: { minutos: 6 * 60 + 50, kg: 58 }, despues: { minutos: 8 * 60 + 20, kg: 57.2 }, sesion: { inicio: 7 * 60, minutos: 75 } };
  const minerales = Array.from({ length: 14 }, (_, i) => ({ dia: Fechas.sumarDias(HOY, -i), kcal: 1800, meta: 2000, hierro: 12, calcio: 1100 }));
  const tipos = (lista: ConsejoDeHoy[]) => lista.map((x) => (x.tipo === 'deporte' ? x.consejo.que : x.tipo));
  const conProteina = { comido: { kcal: 1100, proteina: 110, carbohidratos: 90, grasas: 30 } };

  it('lo del deporte va primero, en su orden, y siguen siendo tres como mucho', () => {
    const deporte = segunElDeporte(corredora({ pesadas, minerales }));
    expect(deporte.map((c) => c.que)).toEqual(['pesarse', 'carrera', 'minerales']);
    expect(tipos(paraHoy(dia({ deporte, sinAnotar: ['almuerzo'] })))).toEqual(['pesarse', 'carrera', 'minerales']);
    expect(tipos(paraHoy(dia({ deporte: segunElDeporte(corredora()), sinAnotar: ['almuerzo'], ...conProteina })))).toEqual(['carrera', 'anotar']);
  });

  it('nunca dos de lo mismo: con los carbohidratos del deporte no va «pocos carbohidratos»; con el agua del deporte, no va el agua', () => {
    expect(tipos(paraHoy(dia(conProteina)))).toEqual(['pocosCarbohidratos']);
    expect(tipos(paraHoy(dia({ ...conProteina, deporte: segunElDeporte(corredora()) })))).toEqual(['carrera']);
    // Sin el «vas bien de proteína», lo que falta de proteína puede decirse.
    expect(tipos(paraHoy(dia({ ...conProteina, ahora: 17 * 60, proxima: 'cena', deporte: segunElDeporte(corredora()) })))).toEqual(['carrera', 'faltaProteina']);
    const agua = { ahora: 16 * 60, comido: { kcal: 1500, proteina: 130, carbohidratos: 230, grasas: 45 }, agua: { ml: 750, meta: 2000 } };
    expect(tipos(paraHoy(dia(agua)))).toEqual(['agua']);
    expect(tipos(paraHoy(dia({ ...agua, deporte: segunElDeporte(corredora({ carrera: null, pesadas })) })))).toEqual(['pesarse']);
  });

  it('lo de Sueño y la tarjeta no entran; dos del mismo tema, tampoco', () => {
    const deporte: ConsejoDelDeporte[] = [
      { que: 'partidoDeNoche', donde: 'sueno', tema: 'sueno' },
      { que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: 'tendencia' },
      { que: 'carrera', donde: 'paraHoy', tema: 'carbohidratos', faltan: 2, sinDeficit: true },
      { que: 'carbohidratos', donde: 'paraHoy', tema: 'carbohidratos' },
    ];
    expect(tipos(paraHoy(dia({ deporte })))).toEqual(['carrera']);
  });

  it('con «sin déficit», del deporte llega solo lo que no es de comer, y de lo suyo, anotar y el agua', () => {
    const deporte = segunElDeporte(corredora({ pesadas, minerales, sinDeficit: true }));
    expect(tipos(paraHoy(dia({ deporte, sinDeficit: true, sinAnotar: ['merienda'], ahora: 18 * 60, comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, agua: { ml: 500, meta: 2000 } })))).toEqual(['pesarse', 'anotar']);
  });
});
