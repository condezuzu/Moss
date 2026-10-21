import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { progresoPorConstelacion } from '../dominio/dias';
import type { Habito } from '../dominio/habitos';
import { crearAlmacen } from './almacen';
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
