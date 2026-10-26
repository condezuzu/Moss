import { describe, expect, it } from '@jest/globals';

import es from '../textos/es.json';
import { csvDeMetas, csvDePesos, csvDeRegistros } from './exportar';
import { metaDeFibra } from './metas';
import { borrado, gramosPara, itemDeAlimento, itemRapido, type Registro } from './registros';

const reg = (id: string, dia: string, momento: string, item: ReturnType<typeof itemRapido>, extra: Partial<Registro> = {}): Registro => ({
  ...item, id, dia, comida: 'cena', momento, planificado: false, actualizado: momento, ...extra,
});
/** La hora local de un instante, como la escribe el CSV. */
const local = (iso: string) => {
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
};
const op = { columnas: es.exportar.columnas, comida: (c: string) => es.comida.comidas[c as keyof typeof es.comida.comidas], si: es.exportar.si, no: es.exportar.no };

describe('exportar en CSV', () => {
  const banana = itemDeAlimento('base', '1105314', 'Banana', { kcal: 89, proteina: 1.09, carbohidratos: 22.84, grasas: 0.33, fibra: 2.6, sodio: 1 }, { porcion: '1 mediana', gramosPorcion: 118, veces: 1.5 });

  it('lo comido, en el orden del día, sin lo borrado y con los nombres del idioma de la app', () => {
    const texto = csvDeRegistros([
      reg('b', '2026-10-21', '2026-10-21T23:00:00.000Z', banana),
      reg('a', '2026-10-21', '2026-10-21T11:00:00.000Z', itemRapido('Pan, con manteca', { kcal: 250, proteina: 6, carbohidratos: 30, grasas: 11 }), { comida: 'desayuno' }),
      borrado(reg('c', '2026-10-21', '2026-10-21T12:00:00.000Z', banana), '2026-10-21T13:00:00.000Z'),
      reg('d', '2026-10-22', '2026-10-22T23:00:00.000Z', banana, { planificado: true }),
    ], op);
    const lineas = texto.trimEnd().split('\n');
    expect(lineas[0]).toBe('día,comida,momento,alimento,fuente,porción,veces,gramos,kcal,proteína (g),carbohidratos (g),grasas (g),fibra (g),azúcares (g),grasas saturadas (g),sodio (mg),alcohol (g),planificado');
    expect(lineas).toHaveLength(4);
    // Lo que tiene una coma va entre comillas; la carga rápida no tiene porción ni gramos.
    expect(lineas[1]).toBe(`2026-10-21,Desayuno,${local('2026-10-21T11:00:00.000Z')},"Pan, con manteca",rapida,,,,250,6,30,11,,,,,,no`);
    expect(lineas[2]).toBe(`2026-10-21,Cena,${local('2026-10-21T23:00:00.000Z')},Banana,base,1 mediana,1.5,177,157.53,1.93,40.43,0.58,4.6,,,1.77,,no`);
    // La hora es la del teléfono, no la de UTC.
    expect(lineas[2]).not.toContain('Z');
    expect(lineas[3].endsWith(',sí')).toBe(true);
  });

  it('el peso y las metas, de lo más viejo a lo más nuevo', () => {
    expect(csvDePesos([{ fecha: '2026-10-21', kg: 74.3, origen: 'salud', momento: '' }, { fecha: '2026-10-20', kg: 74.55, origen: 'manual', momento: '' }], es.exportar.columnas))
      .toBe('fecha,kg,origen\n2026-10-20,74.55,manual\n2026-10-21,74.3,salud\n');
    expect(csvDeMetas([{ desde: '2026-10-14', kcal: 2770, proteina: 119, carbohidratos: 387, grasas: 83, gasto: 2770, motivo: 'inicial', momento: '' }], es.exportar.columnas))
      .toBe('desde,kcal,proteína (g),carbohidratos (g),grasas (g),gasto (kcal),motivo\n2026-10-14,2770,119,387,83,2770,inicial\n');
  });
});

describe('registrar por lo que falta y la fibra', () => {
  const pollo = { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 };

  it('cuántos gramos dan lo que falta de un nutriente', () => {
    expect(gramosPara(pollo, 'proteina', 30)).toBe(97);
    expect(gramosPara(pollo, 'kcal', 500)).toBe(303);
    // Sin ese nutriente no hay cantidad que alcance.
    expect(gramosPara(pollo, 'carbohidratos', 20)).toBeNull();
    expect(gramosPara(pollo, 'fibra', 5)).toBeNull();
  });

  it('la fibra: 14 g cada 1.000 kcal', () => {
    expect(metaDeFibra(2740)).toBe(38);
    expect(metaDeFibra(2000)).toBe(28);
  });
});
