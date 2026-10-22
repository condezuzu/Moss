import { describe, expect, it } from '@jest/globals';

import type { Periodo } from '../dominio/constelaciones';
import type { Peso } from '../dominio/control';
import type { Marca } from '../dominio/dias';
import type { Habito } from '../dominio/habitos';
import type { MetaGuardada, Perfil } from '../dominio/metas';
import { borrado, type Registro } from '../dominio/registros';
import { aplicar, ganadores, type Datos } from './mezclar';
import { sinCambios, sinComida } from './repositorio';

/** Una hora de ese día, en minutos desde las 15:00 UTC. */
const a = (minutos: number) => new Date(Date.UTC(2026, 9, 21, 15, minutos)).toISOString();

const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });
const registro = (id: string, kcal: number, actualizado: string): Registro => ({
  id, dia: '2026-10-21', comida: 'cena', momento: a(0), fuente: 'rapida', ref: null, nombre: id, cantidad: null,
  valores: { kcal, proteina: 0, carbohidratos: 0, grasas: 0 }, planificado: false, actualizado,
});
const habito = (id: string, actualizado: string): Habito => ({ id, nombre: id, icono: 'star', dias: [1, 3], fuente: { tipo: 'manual' }, orden: 0, desde: '2026-10-19', actualizado });
const marca = (habito: string, hecho: boolean, momento: string): Marca => ({ habito, dia: '2026-10-21', hecho, momento, origen: 'toque' });
const peso = (kg: number, momento: string): Peso => ({ fecha: '2026-10-21', kg, origen: 'manual', momento });
const meta = (kcal: number, momento: string): MetaGuardada => ({ desde: '2026-10-21', kcal, proteina: 120, carbohidratos: 300, grasas: 80, gasto: 2700, motivo: 'manual', momento });
const perfil = (alturaCm: number, actualizado: string): Perfil => ({ sexo: 'f', alturaCm, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado', nacimiento: 1994, actualizado });
const periodo = (dia: Periodo['dia'], constelacion: string, hasta?: string): Periodo => ({ dia, constelacion, cantidad: 3, desde: '2026-10-19', ...(hasta ? { hasta } : {}) });

describe('mezclar lo que baja de la cuenta', () => {
  it('de hábitos, marcas, pesos y metas gana la versión más nueva', () => {
    const local: Datos = { ...nada(), habitos: [habito('leer', a(5)), habito('agua', a(1))], marcas: [marca('leer', true, a(5))], pesos: [peso(80, a(2))], metas: [meta(2500, a(9))] };
    const remoto: Datos = {
      ...nada(),
      habitos: [habito('leer', a(3)), habito('agua', a(4)), habito('correr', a(0))],
      marcas: [marca('leer', false, a(6))],
      pesos: [peso(79, a(1))],
      metas: [meta(2400, a(10))],
    };
    const g = ganadores(local, remoto);
    expect(g.habitos.map((h) => h.id)).toEqual(['agua', 'correr']);
    expect(g.marcas).toEqual([marca('leer', false, a(6))]);
    expect(g.pesos).toEqual([]);
    expect(g.metas.map((m) => m.kcal)).toEqual([2400]);
    expect(aplicar(local, g).habitos.map((h) => [h.id, h.actualizado])).toEqual([['leer', a(5)], ['agua', a(4)], ['correr', a(0)]]);
  });

  it('el día: gana el resumen más nuevo', () => {
    const dia = (hechos: string[], actualizado: string) => ({ clave: '2026-10-20', constelacion: 'lyra', habitos: ['leer', 'agua'], hechos, luz: 3, completo: false, actualizado });
    expect(ganadores({ ...nada(), dias: [dia(['leer'], a(2))] }, { ...nada(), dias: [dia(['agua'], a(1))] }).dias).toEqual([]);
    expect(ganadores({ ...nada(), dias: [dia(['leer'], a(2))] }, { ...nada(), dias: [dia(['agua'], a(3))] }).dias).toHaveLength(1);
  });

  it('un logro nunca se pierde y, si los dos lo tienen, queda la fecha de la cuenta', () => {
    const local: Datos = { ...nada(), logros: [{ id: 'primeraLuz', desde: '2026-10-21' }, { id: 'constelacion', desde: '2026-10-21' }] };
    const remoto: Datos = { ...nada(), logros: [{ id: 'primeraLuz', desde: '2026-10-19' }, { id: 'esporas', desde: '2026-10-20' }] };
    const g = ganadores(local, remoto);
    expect(aplicar(local, g).logros).toEqual([
      { id: 'primeraLuz', desde: '2026-10-19' },
      { id: 'constelacion', desde: '2026-10-21' },
      { id: 'esporas', desde: '2026-10-20' },
    ]);
  });

  it('los períodos y la semilla son de la cuenta, pero los mismos en otro orden no cambian nada', () => {
    const propios = [periodo(1, 'lyra', '2026-10-20'), periodo(1, 'crater'), periodo(3, 'sagitta')];
    const local: Datos = { ...nada(), periodos: propios, semilla: 'del-telefono' };
    expect(ganadores(local, { ...nada(), periodos: [periodo(1, 'aselli')], semilla: 'de-la-cuenta' })).toMatchObject({ periodos: [periodo(1, 'aselli')], semilla: 'de-la-cuenta' });
    const reordenados = [propios[2], { constelacion: 'crater', cantidad: 3, desde: '2026-10-19', dia: 1 } as Periodo, propios[0]];
    expect(ganadores(local, { ...nada(), periodos: reordenados, semilla: 'del-telefono' })).toMatchObject({ periodos: null, semilla: null });
    // Una cuenta sin períodos todavía no le borra los suyos al teléfono.
    expect(ganadores(local, nada()).periodos).toBeNull();
  });

  it('el perfil: el más nuevo; si la cuenta no tiene, queda el del teléfono', () => {
    const local: Datos = { ...nada(), perfil: perfil(165, a(5)) };
    expect(ganadores(local, { ...nada(), perfil: perfil(170, a(4)) }).perfil).toBeNull();
    expect(ganadores(local, { ...nada(), perfil: perfil(170, a(6)) }).perfil?.alturaCm).toBe(170);
    expect(aplicar(local, ganadores(local, nada())).perfil?.alturaCm).toBe(165);
  });

  it('de lo que se come gana lo más nuevo, y un borrado más nuevo también gana', () => {
    const local: Datos = { ...nada(), registros: [registro('cena', 500, a(5)), registro('postre', 200, a(5)), registro('mate', 2, a(5))] };
    const remoto: Datos = { ...nada(), registros: [registro('cena', 600, a(6)), borrado(registro('postre', 200, a(5)), a(7)), registro('mate', 9, a(4)), registro('fruta', 80, a(1))] };
    const g = ganadores(local, remoto);
    expect(g.registros.map((r) => [r.id, r.valores.kcal, !!r.borrado])).toEqual([['cena', 600, false], ['postre', 200, true], ['fruta', 80, false]]);
    expect(aplicar(local, g).registros.map((r) => r.id)).toEqual(['cena', 'postre', 'mate', 'fruta']);
  });

  it('los favoritos van por alimento: gana el cambio más nuevo', () => {
    const fav = (favorito: boolean, actualizado: string) => ({ fuente: 'base' as const, ref: '1105314', favorito, actualizado });
    expect(ganadores({ ...nada(), favoritos: [fav(true, a(2))] }, { ...nada(), favoritos: [fav(false, a(3))] }).favoritos).toEqual([fav(false, a(3))]);
    expect(ganadores({ ...nada(), favoritos: [fav(true, a(2))] }, { ...nada(), favoritos: [fav(false, a(1))] }).favoritos).toEqual([]);
  });

  it('si la cuenta no trae nada nuevo, no hay nada que guardar', () => {
    const datos: Datos = {
      habitos: [habito('leer', a(1))], periodos: [periodo(1, 'lyra')], marcas: [marca('leer', true, a(2))], logros: [{ id: 'primeraLuz', desde: '2026-10-21' }],
      dias: [{ clave: '2026-10-21', constelacion: 'lyra', habitos: ['leer'], hechos: ['leer'], luz: 3, completo: true, actualizado: a(2) }],
      perfil: perfil(170, a(0)), metas: [meta(2400, a(0))], pesos: [peso(80, a(0))], semilla: 'semilla',
      ...sinComida(), registros: [registro('cena', 500, a(1))],
    };
    expect(sinCambios(ganadores(datos, structuredClone(datos)))).toBe(true);
  });
});
