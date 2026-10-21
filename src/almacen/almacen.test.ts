import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { progresoPorConstelacion } from '../dominio/dias';
import type { Habito } from '../dominio/habitos';
import { metasIniciales, type Cuestionario, type MetaGuardada } from '../dominio/metas';
import { crearAlmacen, metaVigente } from './almacen';
import type { Datos } from './mezclar';
import { repositorioEnMemoria, type Repositorio } from './repositorio';

const catalogo = datos.constelaciones as unknown as Constelacion[];

const habito = (id: string, orden: number, dias: Habito['dias'] = [0, 1, 2, 3, 4, 5, 6]): Habito => ({
  id, nombre: id, icono: 'star', dias, fuente: { tipo: 'manual' }, orden, desde: '2026-10-19',
});
const TRES = () => [habito('meditar', 0), habito('leer', 1), habito('agua', 2)];

/** Un almacén con su reloj: `ir` mueve la hora y la zona del teléfono. */
async function armar(repositorio: Repositorio = repositorioEnMemoria(), sembrar = TRES) {
  let instante = new Date('2026-10-21T15:00:00Z');
  let zona = 'America/Montevideo';
  const almacen = crearAlmacen({ abrir: async () => repositorio, catalogo, ahora: () => instante, zona: () => zona, sembrar, nuevaSemilla: () => 'semilla' });
  await almacen.iniciar();
  return {
    almacen,
    repositorio,
    ir(iso: string, nuevaZona = zona) {
      instante = new Date(iso);
      zona = nuevaZona;
    },
  };
}

const hoy = (a: ReturnType<typeof crearAlmacen>) => a.estado().dias.get(a.estado().hoy)!;

describe('local primero', () => {
  it('arranca con los hábitos de ejemplo y la constelación de hoy', async () => {
    const { almacen } = await armar();
    const e = almacen.estado();
    expect(e.listo).toBe(true);
    expect(e.hoy).toBe('2026-10-21');
    expect(hoy(almacen)).toMatchObject({ habitos: ['meditar', 'leer', 'agua'], hechos: [], luz: 0 });
    expect(catalogo.find((c) => c.id === hoy(almacen).constelacion)!.estrellas).toHaveLength(3);
  });

  it('guarda y recuerda: otra sesión ve lo mismo', async () => {
    const { almacen, repositorio } = await armar();
    almacen.marcar('meditar', true, 'toque');
    await almacen.esperar();
    const otra = await armar(repositorio);
    expect(hoy(otra.almacen)).toMatchObject({ hechos: ['meditar'], luz: 3 });
    expect(otra.almacen.estado().semilla).toBe('semilla');
    expect(otra.almacen.estado().periodos).toEqual(almacen.estado().periodos);
  });

  it('deshacer deja todo como estaba, salvo los logros, que no se pierden', async () => {
    const { almacen } = await armar();
    for (const h of ['meditar', 'leer', 'agua']) almacen.marcar(h, true, 'toque');
    expect(hoy(almacen)).toMatchObject({ completo: true, luz: 5 });
    almacen.marcar('agua', false, 'deshacer');
    expect(hoy(almacen)).toMatchObject({ completo: false, luz: 4, hechos: ['meditar', 'leer'] });
    expect(almacen.estado().logros.map((l) => l.id)).toEqual(['primeraLuz', 'constelacion']);
  });

  it('marcar no cambia la forma del cielo; cambiar hábitos sí', async () => {
    const { almacen } = await armar();
    const forma = almacen.estado().forma;
    almacen.marcar('leer', true, 'toque');
    expect(almacen.estado().forma).toBe(forma);
    almacen.ponerHabito(habito('correr', 3));
    expect(almacen.estado().forma).toBe(forma + 1);
  });
});

describe('los días', () => {
  it('a la medianoche cambia el día y lo de ayer queda guardado', async () => {
    const { almacen, ir } = await armar();
    almacen.marcar('meditar', true, 'toque');
    ir('2026-10-22T03:30:00Z');
    expect(almacen.revisarDia()).toBe(true);
    expect(almacen.estado().hoy).toBe('2026-10-22');
    expect(almacen.estado().dias.get('2026-10-21')).toMatchObject({ hechos: ['meditar'], luz: 3 });
    expect(hoy(almacen)).toMatchObject({ hechos: [], luz: 0 });
  });

  it('si viajás, el día corta en tu hora', async () => {
    const { almacen, ir } = await armar();
    // 23:00 en Montevideo: todavía es el 21.
    ir('2026-10-22T02:00:00Z');
    expect(almacen.revisarDia()).toBe(false);
    almacen.marcar('leer', true, 'toque');
    // Llegás a Madrid: allá ya es el 22, y lo de anoche quedó en el 21.
    ir('2026-10-22T12:00:00Z', 'Europe/Madrid');
    expect(almacen.revisarDia()).toBe(true);
    expect(almacen.estado().hoy).toBe('2026-10-22');
    expect(almacen.estado().dias.get('2026-10-21')!.hechos).toEqual(['leer']);
  });

  it('cambiar hábitos a mitad de semana no toca los días vividos', async () => {
    const { almacen, ir } = await armar();
    for (const h of ['meditar', 'leer', 'agua']) almacen.marcar(h, true, 'toque');
    const miercoles = { ...hoy(almacen) };
    const jueves = almacen.estado().periodos.find((p) => p.dia === 4 && !p.hasta)!;

    // Al otro día se suma un hábito para jueves y viernes.
    ir('2026-10-22T15:00:00Z');
    almacen.revisarDia();
    almacen.ponerHabito({ ...habito('correr', 3, [4, 5]), desde: '2026-10-22' });

    const e = almacen.estado();
    expect(e.dias.get('2026-10-21')).toEqual(miercoles);
    // El jueves de hoy ya pasa a una de 4 estrellas; la de 3 queda guardada hasta ayer.
    expect(hoy(almacen).habitos).toEqual(['meditar', 'leer', 'agua', 'correr']);
    expect(catalogo.find((c) => c.id === hoy(almacen).constelacion)!.estrellas).toHaveLength(4);
    expect(e.periodos.find((p) => p.dia === 4 && p.constelacion === jueves.constelacion)).toMatchObject({ hasta: '2026-10-21' });
    // El miércoles conserva su constelación y lo que juntó.
    expect(e.periodos.find((p) => p.dia === 3 && !p.hasta)!.constelacion).toBe(miercoles.constelacion);
    expect(progresoPorConstelacion(e.dias.values()).get(miercoles.constelacion!)).toEqual({ luz: 5, completos: 1, dias: 1 });
  });

  it('archivar un hábito lo saca desde hoy', async () => {
    const { almacen } = await armar();
    almacen.marcar('agua', true, 'toque');
    almacen.archivarHabito('agua');
    expect(hoy(almacen)).toMatchObject({ habitos: ['meditar', 'leer'], hechos: [] });
  });
});

describe('el cuestionario, el peso y las metas', () => {
  const respuestas: Cuestionario = { edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' };

  it('el final de la entrada guarda el perfil, el peso de hoy y la meta de arranque, listos para subir', async () => {
    const { almacen, repositorio } = await armar();
    const meta = almacen.responderCuestionario(respuestas);
    expect(meta).toMatchObject({ ...metasIniciales(respuestas).metas, gasto: metasIniciales(respuestas).gasto, desde: '2026-10-21', motivo: 'inicial' });
    expect(almacen.estado().perfil).toMatchObject({ nacimiento: 1990, sexo: 'm', alturaCm: 178, objetivo: 'mantener' });
    expect(almacen.estado().pesos).toEqual([expect.objectContaining({ fecha: '2026-10-21', kg: 80, origen: 'manual' })]);
    await almacen.esperar();
    const pendientes = await repositorio.pendientes();
    expect([pendientes.perfil?.nacimiento, pendientes.metas.length, pendientes.pesos.length]).toEqual([1990, 1, 1]);
    const otra = await armar(repositorio);
    expect(otra.almacen.estado()).toMatchObject({ perfil: almacen.estado().perfil, metas: [meta], pesos: almacen.estado().pesos });
  });

  it('un peso por día: queda el último', async () => {
    const { almacen, ir } = await armar();
    almacen.anotarPeso(80.4, 'manual');
    ir('2026-10-21T20:00:00Z');
    almacen.anotarPeso(80.1, 'salud');
    almacen.anotarPeso(81, 'salud', '2026-10-19');
    expect(almacen.estado().pesos.map((p) => [p.fecha, p.kg, p.origen])).toEqual([['2026-10-19', 81, 'salud'], ['2026-10-21', 80.1, 'salud']]);
  });

  it('la meta de un día es la última que empezó ese día o antes', () => {
    const meta = (desde: string): MetaGuardada => ({ desde, kcal: 2400, proteina: 120, carbohidratos: 300, grasas: 80, gasto: 2400, motivo: 'control', momento: `${desde}T10:00:00.000Z` });
    const estado = { metas: [meta('2026-10-01'), meta('2026-10-15')] };
    expect(metaVigente(estado, '2026-09-30')).toBeNull();
    expect(metaVigente(estado, '2026-10-14')?.desde).toBe('2026-10-01');
    expect(metaVigente(estado, '2026-10-15')?.desde).toBe('2026-10-15');
  });
});

describe('lo que baja de la cuenta', () => {
  const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null });

  it('se guarda sin quedar pendiente y rearma el día de hoy', async () => {
    const { almacen, repositorio } = await armar();
    await almacen.esperar();
    await repositorio.subidoHasta((await repositorio.pendientes()).hasta);
    expect(almacen.mezclar({ ...nada(), marcas: [{ habito: 'leer', dia: '2026-10-21', hecho: true, momento: '2026-10-21T16:00:00.000Z', origen: 'toque' }] })).toBe(true);
    expect(hoy(almacen)).toMatchObject({ hechos: ['leer'], luz: 3 });
    await almacen.esperar();
    const pendientes = await repositorio.pendientes();
    // La marca ya está en la cuenta; el resumen de hoy se rehízo acá.
    expect(pendientes.marcas).toEqual([]);
    expect(pendientes.dias.map((d) => d.hechos)).toEqual([['leer']]);
  });

  it('lo que ya estaba no cambia nada', async () => {
    const { almacen } = await armar();
    almacen.marcar('leer', true, 'toque');
    const e = almacen.estado();
    const version = e.version;
    expect(almacen.mezclar({ ...nada(), habitos: e.habitos, periodos: [...e.periodos].reverse(), marcas: [...e.marcas.values()], dias: [...e.dias.values()], logros: e.logros, semilla: e.semilla })).toBe(false);
    expect(almacen.estado().version).toBe(version);
  });
});
