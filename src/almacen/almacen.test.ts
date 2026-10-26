import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { progresoPorConstelacion } from '../dominio/dias';
import { diaDeLaSemana } from '../dominio/fechas';
import type { Habito } from '../dominio/habitos';
import { metasIniciales, type Cuestionario, type MetaGuardada } from '../dominio/metas';
import { aguaDelDia, borrado, delDia, itemDeAlimento, itemRapido, totalDelDia, vigentes, type Registro, type Valores } from '../dominio/registros';
import { crearAlmacen, metaVigente, soloLosDeEjemplo } from './almacen';
import type { Datos } from './mezclar';
import { repositorioEnMemoria, sinComida, type Repositorio } from './repositorio';

const catalogo = datos.constelaciones as unknown as Constelacion[];

const habito = (id: string, orden: number, dias: Habito['dias'] = [0, 1, 2, 3, 4, 5, 6]): Habito => ({
  id, nombre: id, icono: 'star', dias, fuente: { tipo: 'manual' }, orden, desde: '2026-10-19',
});
const TRES = () => [habito('meditar', 0), habito('leer', 1), habito('agua', 2)];

/** Un almacén con su reloj: `ir` mueve la hora y la zona del teléfono. */
async function armar(repositorio: Repositorio = repositorioEnMemoria(), sembrar = TRES) {
  let instante = new Date('2026-10-21T15:00:00Z');
  let zona = 'America/Montevideo';
  let ids = 0;
  const almacen = crearAlmacen({
    abrir: async () => repositorio, catalogo, ahora: () => instante, zona: () => zona, sembrar, nuevaSemilla: () => 'semilla', nuevoId: () => `id${++ids}`,
  });
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

  it('las noches propias: la cara y la hora de una noche sin reloj se guardan juntas y se recuerdan', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerCara('2026-10-21', 4);
    almacen.ponerHoraDeLaNoche('2026-10-21', { dormirse: '2026-10-21T03:30:00.000Z', despertar: '2026-10-21T11:10:00.000Z', origen: 'confirmada', confianza: 'media' });
    almacen.ponerCara('2026-10-21', 5);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().noches.get('2026-10-21')).toMatchObject({ cara: 5, hora: { origen: 'confirmada', confianza: 'media' } });
  });

  it('la calidad elegida en Perfil se recuerda, y null vuelve a la automática', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().calidad).toBeNull();
    almacen.ponerCalidad('baja');
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().calidad).toBe('baja');
    almacen.ponerCalidad(null);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().calidad).toBeNull();
  });

  it('los avisos se recuerdan en el teléfono: la hora de dormir, el máximo y el de cada hábito', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().avisos).toEqual({});
    const [habito] = almacen.estado().habitos;
    almacen.ponerAvisos({ dormir: { encendido: true, antes: 45 }, maximoPorDia: 3 });
    almacen.ponerAvisoDeHabito(habito.id, { cuando: { tipo: 'despertar', despues: 15 }, dias: [1, 3, 5], mensaje: 'Estirar' });
    await almacen.esperar();
    const otra = (await armar(repositorio)).almacen;
    expect(otra.estado().avisos).toEqual({
      dormir: { encendido: true, antes: 45 }, maximoPorDia: 3,
      habitos: [{ habito: habito.id, cuando: { tipo: 'despertar', despues: 15 }, dias: [1, 3, 5], mensaje: 'Estirar' }],
    });
    // Cambiar el aviso de un hábito reemplaza el que tenía; null lo saca.
    otra.ponerAvisoDeHabito(habito.id, { cuando: { tipo: 'hora', minutos: 540 }, dias: [] });
    expect(otra.estado().avisos.habitos).toEqual([{ habito: habito.id, cuando: { tipo: 'hora', minutos: 540 }, dias: [] }]);
    otra.ponerAvisoDeHabito(habito.id, null);
    expect(otra.estado().avisos.habitos).toEqual([]);
  });

  it('el aparato del que sale la noche se recuerda en el teléfono, y null vuelve a la automática', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().fuenteDelSueno).toBeNull();
    almacen.ponerFuenteDelSueno('com.ouraring.oura');
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().fuenteDelSueno).toBe('com.ouraring.oura');
    almacen.ponerFuenteDelSueno(null);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().fuenteDelSueno).toBeNull();
  });

  it('cuándo se usó Moss: al abrir un momento, al cerrar un rato; queda en el teléfono tres días', async () => {
    const { almacen, repositorio } = await armar();
    const t = (iso: string) => Date.parse(iso);
    almacen.anotarUso('abrir', t('2026-10-18T02:00:00Z'));
    almacen.anotarUso('cerrar', t('2026-10-18T02:05:00Z'));
    almacen.anotarUso('abrir', t('2026-10-21T02:10:00Z'));
    almacen.anotarUso('cerrar', t('2026-10-21T02:14:00Z'));
    // Si el sistema la cerró sin avisar, queda el momento; cerrar dos veces no cambia nada.
    almacen.anotarUso('abrir', t('2026-10-21T10:30:00Z'));
    almacen.anotarUso('abrir', t('2026-10-21T11:00:00Z'));
    almacen.anotarUso('cerrar', t('2026-10-21T11:02:00Z'));
    almacen.anotarUso('cerrar', t('2026-10-21T11:03:00Z'));
    const esperado = [[t('2026-10-21T02:10:00Z'), t('2026-10-21T02:14:00Z')], [t('2026-10-21T10:30:00Z'), t('2026-10-21T10:30:00Z')], [t('2026-10-21T11:00:00Z'), t('2026-10-21T11:02:00Z')]];
    expect(almacen.estado().uso).toEqual(esperado);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().uso).toEqual(esperado);
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

  it('un hábito nuevo entra desde hoy, después de los que había, y el día pasa a otra constelación', async () => {
    const { almacen } = await armar();
    const antes = hoy(almacen).constelacion;
    const nuevo = almacen.crearHabito({ nombre: 'Correr', icono: 'figure.run', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' } });
    expect(nuevo).toMatchObject({ desde: '2026-10-21', orden: 3 });
    expect(hoy(almacen).habitos).toEqual(['meditar', 'leer', 'agua', nuevo.id]);
    expect(catalogo.find((c) => c.id === hoy(almacen).constelacion)!.estrellas).toHaveLength(4);
    expect(hoy(almacen).constelacion).not.toBe(antes);
  });

  const PRIMEROS = [
    { nombre: 'Proteína', icono: 'fork.knife', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'comida', meta: 'proteina' } },
    { nombre: 'Dormir 7 h', icono: 'moon', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'salud', dato: 'sueno', meta: 420 } },
    { nombre: 'Leer', icono: 'book', dias: [1, 2, 3, 4, 5], fuente: { tipo: 'manual' } },
  ] satisfies Parameters<ReturnType<typeof crearAlmacen>['elegirPrimerosHabitos']>[0];
  const DE_EJEMPLO = () => [habito('ejemplo-meditar', 0), habito('ejemplo-leer', 1), habito('ejemplo-agua', 2)];

  it('los primeros hábitos reemplazan a los de ejemplo, en el orden elegido', async () => {
    const { almacen } = await armar(undefined, DE_EJEMPLO);
    expect(soloLosDeEjemplo(almacen.estado())).toBe(true);
    almacen.elegirPrimerosHabitos(PRIMEROS);
    const e = almacen.estado();
    expect(e.habitos.filter((h) => !h.hasta || h.hasta >= e.hoy).map((h) => h.nombre)).toEqual(['Proteína', 'Dormir 7 h', 'Leer']);
    expect(e.habitos.filter((h) => h.id.startsWith('ejemplo-')).every((h) => h.hasta === '2026-10-20')).toBe(true);
    expect(hoy(almacen).habitos).toHaveLength(3);
    expect(soloLosDeEjemplo(e)).toBe(false);
  });

  it('los hábitos que trajo la cuenta no se archivan con los primeros: solo los de ejemplo', async () => {
    const { almacen } = await armar(undefined, () => [habito('ejemplo-meditar', 0), habito('correr', 1)]);
    expect(soloLosDeEjemplo(almacen.estado())).toBe(false);
    almacen.elegirPrimerosHabitos(PRIMEROS);
    const e = almacen.estado();
    expect(e.habitos.find((h) => h.id === 'correr')!.hasta).toBeUndefined();
    expect(e.habitos.find((h) => h.id === 'ejemplo-meditar')!.hasta).toBe('2026-10-20');
    expect(hoy(almacen).habitos).toContain('correr');
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

  it('cerrar sesión o borrar los datos deja el teléfono como la primera vez, y otra sesión no ve nada', async () => {
    const { almacen, repositorio } = await armar();
    almacen.responderCuestionario(respuestas);
    almacen.marcar('meditar', true, 'toque');
    await almacen.olvidarTodo();
    const e = almacen.estado();
    expect(e.listo).toBe(true);
    expect(e.perfil).toBeNull();
    expect(e.metas).toEqual([]);
    expect(e.pesos).toEqual([]);
    expect(hoy(almacen)).toMatchObject({ habitos: ['meditar', 'leer', 'agua'], hechos: [] });
    const otra = await armar(repositorio);
    expect(otra.almacen.estado().perfil).toBeNull();
    expect(hoy(otra.almacen).hechos).toEqual([]);
  });

  it('lo de Salud enciende solos los hábitos que llegaron a su meta, y completa los días sin peso', async () => {
    const pasos = { ...habito('pasos', 0), fuente: { tipo: 'salud' as const, dato: 'pasos' as const, meta: 8000 } };
    const dormir = { ...habito('dormir', 1), fuente: { tipo: 'salud' as const, dato: 'sueno' as const, meta: 420 } };
    const { almacen } = await armar(undefined, () => [pasos, dormir, habito('leer', 2)]);
    almacen.anotarPeso(80, 'manual', '2026-10-20');
    const salud = (valores: Record<string, number>) => ({
      dia: '2026-10-21', valores, noches: [], soloEnCama: new Map(), fuentes: [], aparatos: [], pasosRecientes: [],
      lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() },
      pesos: new Map([['2026-10-20', 81], ['2026-10-21', 79.84]]),
    });
    almacen.ponerSalud(salud({ pasos: 6200, sueno: 450 }));
    expect(hoy(almacen).hechos).toEqual(['dormir']);
    expect(almacen.estado().marcas.get('dormir|2026-10-21')?.origen).toBe('salud');
    // El peso anotado a mano queda; el día sin peso toma el de Salud.
    expect(almacen.estado().pesos.map((p) => [p.fecha, p.kg, p.origen])).toEqual([['2026-10-20', 80, 'manual'], ['2026-10-21', 79.8, 'salud']]);
    almacen.ponerSalud(salud({ pasos: 8400, sueno: 450 }));
    expect(hoy(almacen).hechos).toEqual(['pasos', 'dormir']);
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

const BANANA: Valores = { kcal: 89, proteina: 1.09, carbohidratos: 22.84, grasas: 0.33, fibra: 2.6 };
const banana = (veces = 1) => itemDeAlimento('base', '1105314', 'Banana', BANANA, { porcion: '1 mediana', gramosPorcion: 118, veces });
const alfajor = () => itemRapido('Alfajor', { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 });

describe('lo que se come', () => {
  it('registrar se ve al instante, queda pendiente y otra sesión lo recuerda', async () => {
    const { almacen, repositorio } = await armar();
    const [r] = almacen.registrar([banana(2)], { comida: 'merienda' });
    expect(r).toMatchObject({ dia: '2026-10-21', comida: 'merienda', planificado: false, momento: '2026-10-21T15:00:00.000Z' });
    expect(totalDelDia(almacen.estado().registros.values(), '2026-10-21').kcal).toBeCloseTo(210.04, 6);
    await almacen.esperar();
    expect((await repositorio.pendientes()).registros.map((x) => x.id)).toEqual([r.id]);
    const otra = await armar(repositorio);
    expect(otra.almacen.estado().registros.get(r.id)).toEqual(r);
  });

  it('la canasta queda guardada aunque se cierre la app, y agregar la registra toda junta y la vacía', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerEnCanasta(banana());
    almacen.ponerEnCanasta(alfajor());
    almacen.cambiarEnCanasta(0, banana(2));
    await almacen.esperar();
    const otra = (await armar(repositorio)).almacen;
    expect(otra.estado().canasta.map((i) => i.nombre)).toEqual(['Banana', 'Alfajor']);
    otra.quitarDeCanasta(1);
    const nuevos = otra.agregarCanasta({ comida: 'cena' });
    expect(nuevos.map((r) => [r.nombre, r.comida])).toEqual([['Banana', 'cena']]);
    expect(nuevos[0].valores.kcal).toBeCloseTo(210.04, 6);
    expect(otra.estado().canasta).toEqual([]);
    // Con la canasta vacía, agregar no hace nada.
    expect(otra.agregarCanasta({ comida: 'cena' })).toEqual([]);
  });

  it('borrar deja la marca, que también sube; deshacer la saca', async () => {
    const { almacen, repositorio } = await armar();
    const [r] = almacen.registrar([alfajor()], { comida: 'snack' });
    await almacen.esperar();
    await repositorio.subidoHasta((await repositorio.pendientes()).hasta);
    expect(almacen.borrarRegistro(r.id)?.nombre).toBe('Alfajor');
    expect(delDia(almacen.estado().registros.values(), '2026-10-21')).toEqual([]);
    await almacen.esperar();
    expect((await repositorio.pendientes()).registros).toEqual([expect.objectContaining({ id: r.id, borrado: true })]);
    almacen.deshacerBorrado(r.id);
    expect(delDia(almacen.estado().registros.values(), '2026-10-21').map((x) => x.id)).toEqual([r.id]);
  });

  it('corregir la cantidad cambia el registro y su hora de cambio', async () => {
    const { almacen, ir } = await armar();
    const [r] = almacen.registrar([banana()], { comida: 'desayuno' });
    ir('2026-10-21T15:05:00Z');
    almacen.cambiarRegistro(r.id, { cantidad: banana(2).cantidad, valores: banana(2).valores });
    expect(almacen.estado().registros.get(r.id)).toMatchObject({ cantidad: { veces: 2 }, actualizado: '2026-10-21T15:05:00.000Z' });
  });

  it('copiar la cena a mañana la planifica, y al llegar el día se confirma', async () => {
    const { almacen, ir } = await armar();
    almacen.registrar([banana(), alfajor()], { comida: 'cena' });
    const copia = almacen.copiar({ dia: '2026-10-21', comida: 'cena' }, { dia: '2026-10-22' });
    expect(copia.every((r) => r.planificado && r.dia === '2026-10-22')).toBe(true);
    ir('2026-10-22T15:00:00Z');
    almacen.revisarDia();
    expect(almacen.confirmarPlanificados()).toBe(2);
    expect(vigentes(almacen.estado().registros.values()).filter((r) => r.planificado)).toEqual([]);
  });

  it('lo que armó el plan queda planificado aunque sea hoy, se anota de a una comida, y confirmar el día no lo toca', async () => {
    // El bug: «Confirmar lo planificado» anotaba también la cena armada que todavía no se comió.
    const { almacen } = await armar();
    const cena = { comida: 'cena' as const, opcion: 'pollo-arroz', items: [banana()], valores: banana().valores };
    const almuerzo = { comida: 'almuerzo' as const, opcion: 'lentejas', items: [alfajor()], valores: alfajor().valores };
    const armados = almacen.planificar('2026-10-21', [almuerzo, cena], () => 13 * 60);
    expect(armados.every((r) => r.planificado && r.plan)).toBe(true);
    // Lo copiado de lo planificado sigue planificado (sin ser del plan): confirmar el día anota esas dos copias, no lo armado.
    almacen.copiar({ dia: '2026-10-21' }, { dia: '2026-10-21', comida: 'snack' });
    expect(almacen.confirmarPlanificados()).toBe(2);
    const ids = almacen.confirmarComida('2026-10-21', 'almuerzo');
    expect(ids).toEqual([armados[0].id]);
    expect(almacen.estado().registros.get(armados[1].id)?.planificado).toBe(true);
    almacen.volverAPlanificar(ids);
    expect(almacen.estado().registros.get(armados[0].id)?.planificado).toBe(true);
  });

  it('se cargan solo los últimos cuatro meses de lo comido', async () => {
    const viejo: Registro = { ...alfajor(), id: 'viejo', dia: '2026-05-01', comida: 'snack', momento: '2026-05-01T15:00:00.000Z', planificado: false, actualizado: '2026-05-01T15:00:00.000Z' };
    const reciente: Registro = { ...viejo, id: 'reciente', dia: '2026-09-01' };
    const { almacen } = await armar(repositorioEnMemoria({ registros: [viejo, reciente] }));
    expect([...almacen.estado().registros.keys()]).toEqual(['reciente']);
  });

  it('el agua: cada vaso suma, y sacar uno lo marca', async () => {
    const { almacen } = await armar();
    almacen.sumarAgua();
    const vaso = almacen.sumarAgua();
    almacen.sumarAgua(500);
    almacen.quitarAgua(vaso.id);
    expect(aguaDelDia(almacen.estado().agua.values(), '2026-10-21')).toBe(750);
  });

  it('recetas, propios y favoritos', async () => {
    const { almacen } = await armar();
    const receta = almacen.guardarReceta({ tipo: 'comida', nombre: 'Mi merienda', items: [banana(), alfajor()], porciones: 1, pesoFinal: null });
    expect(almacen.estado().recetas.get(receta.id)?.items).toHaveLength(2);
    almacen.borrarReceta(receta.id);
    expect(almacen.estado().recetas.get(receta.id)?.borrado).toBe(true);
    const propio = almacen.guardarPropio({ nombre: 'Granola de la feria', marca: null, codigo: '7730000000017', por100g: BANANA, porciones: [{ nombre: '1 taza', gramos: 60 }] });
    expect(almacen.estado().propios.get(propio.id)?.codigo).toBe('7730000000017');
    almacen.ponerFavorito('base', '1105314', true);
    almacen.ponerFavorito('base', '1105314', false);
    expect([...almacen.estado().favoritos.values()]).toEqual([expect.objectContaining({ ref: '1105314', favorito: false })]);
  });
});

describe('la comida enciende estrellas', () => {
  const pollo = (gramos: number) => itemDeAlimento('base', '1', 'Pechuga', { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, { gramos });
  const conComida = () => [
    habito('meditar', 0),
    { ...habito('proteina', 1), fuente: { tipo: 'comida' as const, meta: 'proteina' as const } },
    { ...habito('registrar', 2), fuente: { tipo: 'comida' as const, meta: 'registrar' as const } },
  ];

  it('llegar a la proteína la enciende sola, y borrar lo que la hizo llegar la apaga', async () => {
    const { almacen } = await armar(repositorioEnMemoria(), conComida);
    almacen.responderCuestionario({ edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' });
    const meta = almacen.estado().metas[0].proteina;
    almacen.registrar([pollo(250)], { comida: 'almuerzo' });
    expect(hoy(almacen).hechos).toEqual([]);
    const [cena] = almacen.registrar([pollo(Math.ceil(((meta - 77.5) / 31) * 100) + 10)], { comida: 'cena' });
    expect(hoy(almacen).hechos).toEqual(['proteina']);
    expect(almacen.estado().marcas.get('proteina|2026-10-21')).toMatchObject({ hecho: true, origen: 'comida' });
    almacen.borrarRegistro(cena.id);
    expect(hoy(almacen).hechos).toEqual([]);
  });

  it('registrar las tres comidas la enciende; lo planificado no cuenta', async () => {
    const { almacen } = await armar(repositorioEnMemoria(), conComida);
    almacen.registrar([banana()], { comida: 'desayuno' });
    almacen.registrar([alfajor()], { comida: 'almuerzo' });
    almacen.copiar({ dia: '2026-10-21', comida: 'almuerzo' }, { dia: '2026-10-22', comida: 'cena' });
    expect(hoy(almacen).hechos).toEqual([]);
    almacen.registrar([banana()], { comida: 'cena' });
    expect(hoy(almacen).hechos).toEqual(['registrar']);
  });
});

describe('el control de cada semana corre solo', () => {
  const respuestas: Cuestionario = { edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' };

  /**
   * Empieza el miércoles 14, con los pesos de Salud desde el 1, y cada día hasta el martes 20 se
   * pesa y registra 2.500 kcal.
   */
  async function unaSemana() {
    const t = await armar();
    t.ir('2026-10-14T15:00:00Z');
    t.almacen.revisarDia();
    const inicial = t.almacen.responderCuestionario(respuestas);
    for (let d = 1; d < 14; d++) t.almacen.anotarPeso(80, 'salud', `2026-10-${String(d).padStart(2, '0')}`);
    for (let d = 14; d <= 20; d++) {
      t.ir(`2026-10-${d}T15:00:00Z`);
      t.almacen.revisarDia();
      t.almacen.anotarPeso(80, 'salud');
      t.almacen.registrar([itemRapido('Todo el día', { kcal: 2500, proteina: 150, carbohidratos: 300, grasas: 75 })], { comida: 'cena' });
    }
    return { ...t, inicial };
  }

  it('el miércoles siguiente mide el gasto con lo comido y el peso, y mueve la meta de a poco', async () => {
    const { almacen, ir, inicial } = await unaSemana();
    ir('2026-10-21T15:00:00Z');
    almacen.revisarDia();
    const metas = almacen.estado().metas;
    expect(metas.map((m) => [m.desde, m.motivo])).toEqual([['2026-10-14', 'inicial'], ['2026-10-21', 'control']]);
    // Con el peso quieto, el gasto medido es lo comido: la meta va un cuarto del camino hacia ahí.
    expect(metas[1].gasto).toBe(Math.round(inicial.gasto + 0.25 * (2500 - inicial.gasto)));
  });

  it('una sola vez por semana; si ese día no se abrió Moss, corre la próxima vez', async () => {
    const { almacen, ir } = await unaSemana();
    ir('2026-10-21T15:00:00Z');
    almacen.revisarDia();
    ir('2026-10-22T15:00:00Z');
    almacen.revisarDia();
    expect(almacen.estado().metas).toHaveLength(2);
    // El miércoles 28 no se abrió: corre el viernes 30.
    ir('2026-10-30T15:00:00Z');
    almacen.revisarDia();
    expect(almacen.estado().metas.map((m) => m.desde)).toEqual(['2026-10-14', '2026-10-21', '2026-10-30']);
  });

  it('con las metas a mano, mide el gasto pero deja los macros', async () => {
    const { almacen, ir } = await unaSemana();
    const aMano = almacen.ponerMetasAMano({ proteina: 160, carbohidratos: 250, grasas: 70 })!;
    expect(aMano).toMatchObject({ kcal: 2270, motivo: 'manual', desde: '2026-10-20' });
    ir('2026-10-21T15:00:00Z');
    almacen.revisarDia();
    const control = almacen.estado().metas[2];
    expect(control).toMatchObject({ desde: '2026-10-21', motivo: 'manual', kcal: 2270, proteina: 160, carbohidratos: 250, grasas: 70 });
    expect(control.gasto).not.toBe(aMano.gasto);
  });
});

describe('los límites que cuidan', () => {
  const respuestas: Cuestionario = { edad: 30, sexo: 'f', alturaCm: 165, pesoKg: 70, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado' };

  it('una meta a mano por debajo del piso no se guarda', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario(respuestas);
    expect(almacen.ponerMetasAMano({ proteina: 80, carbohidratos: 100, grasas: 30 })).toBeNull();
    expect(almacen.estado().metas.at(-1)!.motivo).toBe('inicial');
    expect(almacen.ponerMetasAMano({ proteina: 120, carbohidratos: 150, grasas: 50 })).toMatchObject({ kcal: 1530, motivo: 'manual' });
  });

  it('un peso meta con un IMC de menos de 18,5 no se guarda', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario(respuestas);
    almacen.ponerEstrategia({ pesoMeta: 48 });
    expect(almacen.estado().perfil!.pesoMeta).toBeUndefined();
    almacen.ponerEstrategia({ pesoMeta: 60 });
    expect(almacen.estado().perfil!.pesoMeta).toBe(60);
  });

  it('sin déficit (embarazo, lactancia o una condición médica), la meta deja de bajar', async () => {
    const { almacen } = await armar();
    const inicial = almacen.responderCuestionario(respuestas);
    expect(inicial.kcal).toBeLessThan(inicial.gasto);
    almacen.ponerEstrategia({ sinDeficit: true });
    const meta = almacen.estado().metas.at(-1)!;
    expect(meta.motivo).toBe('objetivo');
    expect(meta.kcal).toBe(Math.round(meta.gasto / 10) * 10);
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'bajar', sinDeficit: true });
  });

  it('desde el cuestionario, también', async () => {
    const { almacen } = await armar();
    const inicial = almacen.responderCuestionario({ ...respuestas, sinDeficit: true });
    expect(inicial.kcal).toBe(inicial.gasto);
    expect(almacen.estado().perfil!.sinDeficit).toBe(true);
  });
});

describe('lo que baja de la cuenta', () => {
  const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });

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

  it('lo comido en otro teléfono llega, y un borrado de allá borra acá', async () => {
    const { almacen, repositorio } = await armar();
    const [r] = almacen.registrar([alfajor()], { comida: 'snack' });
    await almacen.esperar();
    await repositorio.subidoHasta((await repositorio.pendientes()).hasta);
    const deAlla: Registro = { ...r, id: 'otro', nombre: 'Mate', actualizado: '2026-10-21T16:00:00.000Z' };
    expect(almacen.mezclar({ ...nada(), registros: [borrado(r, '2026-10-21T16:00:00.000Z'), deAlla] })).toBe(true);
    expect(delDia(almacen.estado().registros.values(), '2026-10-21').map((x) => x.nombre)).toEqual(['Mate']);
    await almacen.esperar();
    expect((await repositorio.pendientes()).registros).toEqual([]);
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

describe('volver a entrar a una cuenta que ya tenía todo', () => {
  const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });
  const respuestas: Cuestionario = { edad: 29, sexo: 'm', alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', sinDeficit: false };
  const deLaCuenta = (): Datos => ({
    ...nada(),
    habitos: [{ ...habito('correr', 0), actualizado: '2026-10-01T10:00:00.000Z' }],
    perfil: {
      sexo: 'm', alturaCm: 180, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado', nacimiento: 1990,
      estilo: 'keto', pesoMeta: 75, diaDelControl: 1, semana: { altos: [6, 0], extra: 300 }, actualizado: '2026-10-01T10:00:00.000Z',
    },
    metas: [{ desde: '2026-10-01', kcal: 1700, proteina: 140, carbohidratos: 120, grasas: 70, gasto: 2300, motivo: 'manual', momento: '2026-10-01T10:00:00.000Z' }],
  });

  it('el cuestionario no pisa lo que el cuestionario no pregunta, ni las metas de la cuenta', async () => {
    const { almacen } = await armar();
    almacen.mezclar(deLaCuenta());
    const meta = almacen.responderCuestionario(respuestas);
    const e = almacen.estado();
    expect(e.perfil).toMatchObject({ estilo: 'keto', pesoMeta: 75, diaDelControl: 1, semana: { altos: [6, 0], extra: 300 }, alturaCm: 172 });
    expect(e.metas.map((m) => [m.desde, m.kcal, m.motivo])).toEqual([['2026-10-01', 1700, 'manual']]);
    expect(meta).toMatchObject({ kcal: 1700, motivo: 'manual' });
    expect(e.entradaHecha).toBe(true);
  });

  it('con un objetivo distinto, las metas de Moss se mueven como en Progreso', async () => {
    const { almacen } = await armar();
    const cuenta = deLaCuenta();
    almacen.mezclar({ ...cuenta, metas: [{ ...cuenta.metas[0], motivo: 'control' }] });
    const meta = almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' });
    expect(meta).toMatchObject({ desde: '2026-10-21', motivo: 'objetivo', gasto: 2300 });
    expect(almacen.estado().metas).toHaveLength(2);
  });

  it('sin cuestionario, terminar la entrada solo la da por hecha: el perfil, las metas y los hábitos quedan', async () => {
    const { almacen, repositorio } = await armar();
    almacen.mezclar(deLaCuenta());
    const antes = almacen.estado();
    almacen.terminarEntrada();
    const e = almacen.estado();
    expect(e.entradaHecha).toBe(true);
    expect([e.perfil, e.metas, e.habitos, e.pesos]).toEqual([antes.perfil, antes.metas, antes.habitos, antes.pesos]);
    expect(soloLosDeEjemplo(e)).toBe(false);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().entradaHecha).toBe(true);
  });
});

describe('la comida enciende estrellas, también con la semana repartida y en los días anteriores', () => {
  const respuestas: Cuestionario = { edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' };
  const conComida = () => [
    habito('meditar', 0),
    { ...habito('calorias', 1), fuente: { tipo: 'comida' as const, meta: 'calorias' as const } },
    { ...habito('registrar', 2), fuente: { tipo: 'comida' as const, meta: 'registrar' as const } },
  ];
  const kcal = (n: number) => itemRapido('Todo', { kcal: n, proteina: 0, carbohidratos: 0, grasas: 0 });

  it('las calorías se miden contra la meta del día, la que se ve, no la de base', async () => {
    const { almacen } = await armar(repositorioEnMemoria(), conComida);
    const base = almacen.responderCuestionario(respuestas).kcal;
    almacen.ponerEstrategia({ semana: { altos: [diaDeLaSemana('2026-10-21')], extra: 500 } });
    // Un solo día alto: sube todo lo que se le saca a los otros seis.
    almacen.registrar([kcal(base + 500)], { comida: 'cena' });
    expect(hoy(almacen).hechos).toContain('calorias');
    // Dejar de repartir la semana vuelve a la meta de base: ya no está cerca.
    almacen.ponerEstrategia({ semana: undefined });
    expect(hoy(almacen).hechos).not.toContain('calorias');
  });

  it('la cena de ayer anotada hoy enciende la estrella de ayer, y borrarla la apaga', async () => {
    const { almacen, ir } = await armar(repositorioEnMemoria(), conComida);
    almacen.registrar([banana()], { comida: 'desayuno' });
    almacen.registrar([alfajor()], { comida: 'almuerzo' });
    ir('2026-10-22T13:00:00Z');
    almacen.revisarDia();
    const [cena] = almacen.registrar([banana()], { comida: 'cena', dia: '2026-10-21', momento: '2026-10-22T00:00:00.000Z' });
    const ayer = () => almacen.estado().dias.get('2026-10-21')!;
    expect(ayer().hechos).toEqual(['registrar']);
    expect(almacen.estado().marcas.get('registrar|2026-10-21')).toMatchObject({ hecho: true, origen: 'comida' });
    expect(hoy(almacen).hechos).toEqual([]);
    almacen.borrarRegistro(cena.id);
    expect(ayer().hechos).toEqual([]);
  });
});

describe('el control y los pesos de Salud que llegan después', () => {
  const respuestas: Cuestionario = { edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' };
  const salud = (pesos: [string, number][]) => ({
    dia: '2026-10-21', valores: {}, noches: [], soloEnCama: new Map(), fuentes: [], aparatos: [], pasosRecientes: [],
    lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() },
    pesos: new Map(pesos),
  });

  it('si el control corrió sin las pesadas que trae Salud, se vuelve a hacer con ellas, una sola meta por día', async () => {
    const { almacen, ir } = await armar();
    ir('2026-10-14T15:00:00Z');
    almacen.revisarDia();
    almacen.responderCuestionario(respuestas);
    for (let d = 14; d <= 20; d++) {
      ir(`2026-10-${d}T15:00:00Z`);
      almacen.revisarDia();
      almacen.registrar([itemRapido('Todo el día', { kcal: 2500, proteina: 150, carbohidratos: 300, grasas: 75 })], { comida: 'cena' });
    }
    ir('2026-10-21T15:00:00Z');
    almacen.revisarDia();
    const antes = almacen.estado().metas.at(-1)!;
    expect(antes).toMatchObject({ desde: '2026-10-21' });
    const pesadas: [string, number][] = [];
    for (let d = 1; d <= 20; d++) pesadas.push([`2026-10-${String(d).padStart(2, '0')}`, 80 - d * 0.1]);
    almacen.ponerSalud(salud(pesadas));
    const metas = almacen.estado().metas;
    expect(metas.map((m) => m.desde)).toEqual(['2026-10-14', '2026-10-21']);
    expect(metas[1]).toMatchObject({ motivo: 'control' });
    expect(metas[1].gasto).not.toBe(antes.gasto);
    // Lo que ya estaba no lo vuelve a hacer.
    almacen.ponerSalud(salud(pesadas));
    expect(almacen.estado().metas[1]).toBe(metas[1]);
  });
});

describe('tu nombre', () => {
  const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });
  const hace = (iso: string) => ({ valor: 'Agus', actualizado: iso });

  it('se guarda limpio, sube a la cuenta y otra sesión lo recuerda', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerNombre('  Agustín   Conde ');
    expect(almacen.estado().nombre).toEqual({ valor: 'Agustín Conde', actualizado: '2026-10-21T15:00:00.000Z' });
    await almacen.esperar();
    expect((await repositorio.pendientes()).nombre?.valor).toBe('Agustín Conde');
    expect((await armar(repositorio)).almacen.estado().nombre?.valor).toBe('Agustín Conde');
  });

  it('el mismo nombre no es un cambio; borrarlo sí, y viaja', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerNombre('Ana');
    await almacen.esperar();
    await repositorio.subidoHasta((await repositorio.pendientes()).hasta);
    const version = almacen.estado().version;
    almacen.ponerNombre(' Ana ');
    expect(almacen.estado().version).toBe(version);
    almacen.ponerNombre('');
    await almacen.esperar();
    expect((await repositorio.pendientes()).nombre).toMatchObject({ valor: '' });
  });

  it('el que trae Apple va con la hora más vieja: solo si no había ninguno', async () => {
    const { almacen } = await armar();
    almacen.ponerNombre('Agustín Conde', true);
    expect(almacen.estado().nombre).toEqual({ valor: 'Agustín Conde', actualizado: new Date(0).toISOString() });
    almacen.ponerNombre('Agus');
    almacen.ponerNombre('Otro de Apple', true);
    expect(almacen.estado().nombre?.valor).toBe('Agus');
    // Sin nombre, Apple no deja nada.
    const otro = await armar();
    otro.almacen.ponerNombre('   ', true);
    expect(otro.almacen.estado().nombre).toBeNull();
  });

  it('de la cuenta llega el más nuevo, sin quedar pendiente; al de Apple le gana cualquiera', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerNombre('Agustín Conde', true);
    await almacen.esperar();
    await repositorio.subidoHasta((await repositorio.pendientes()).hasta);
    expect(almacen.mezclar({ ...nada(), nombre: hace('2026-10-20T10:00:00.000Z') })).toBe(true);
    expect(almacen.estado().nombre?.valor).toBe('Agus');
    await almacen.esperar();
    expect((await repositorio.pendientes()).nombre).toBeNull();
    almacen.ponerNombre('Agustín');
    expect(almacen.mezclar({ ...nada(), nombre: hace('2026-10-20T11:00:00.000Z') })).toBe(false);
    expect(almacen.estado().nombre?.valor).toBe('Agustín');
  });

  it('borrar el teléfono lo borra', async () => {
    const { almacen } = await armar();
    almacen.ponerNombre('Ana');
    await almacen.olvidarTodo();
    expect(almacen.estado().nombre).toBeNull();
  });
});
