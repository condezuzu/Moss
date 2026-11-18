import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { progresoPorConstelacion } from '../dominio/dias';
import { diaDeLaSemana, sumarDias } from '../dominio/fechas';
import type { Habito } from '../dominio/habitos';
import { metaPara, metasIniciales, type Cuestionario, type MetaGuardada } from '../dominio/metas';
import { aguaDelDia, borrado, delDia, itemDeAlimento, itemRapido, totalDelDia, vigentes, type Registro, type Valores } from '../dominio/registros';
import { entrenoParaGuardar } from '../dominio/cuestionario';
import { crearAlmacen, metaVigente, reglasDeCuidados, soloLosDeEjemplo, type CuestionarioNuevo } from './almacen';
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

  it('cómo se ven las calorías se recuerda; de fábrica, la luna', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().kcal).toBe('luna');
    almacen.ponerKcal('macros');
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().kcal).toBe('macros');
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

  it('el interruptor de lo que falta y los de lo que conviene hacer también se recuerdan', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerAvisos({ falta: { encendido: false }, cafe: { encendido: true }, ultimaComida: { encendido: false } });
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().avisos).toEqual({ falta: { encendido: false }, cafe: { encendido: true }, ultimaComida: { encendido: false } });
  });

  it('los de según el deporte (la víspera del partido y la carrera larga) también, prendidos y apagados', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerAvisos({ partido: { encendido: true }, carrera: { encendido: false } });
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().avisos).toEqual({ partido: { encendido: true }, carrera: { encendido: false } });
  });

  it('los del día que sigue tu despertar y el horario apagado (vacío) también se recuerdan', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerAvisos({ deuda: { encendido: false }, melatonina: { encendido: true }, revoluciones: { encendido: false }, descarga: { encendido: true }, gafas: { encendido: false }, horario: {} });
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().avisos).toEqual({
      deuda: { encendido: false }, melatonina: { encendido: true }, revoluciones: { encendido: false }, descarga: { encendido: true }, gafas: { encendido: false }, horario: {},
    });
  });

  it('el despertar de cada día: queda lo más temprano, con la hora en que se supo la primera vez, y dos semanas', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().despertares).toEqual({});
    almacen.ponerDespertar('2026-10-21', 7 * 60 + 40, 7 * 60 + 40);
    // Después llega la noche de Salud, que terminó antes: el despertar se corre, cuándo se supo no.
    almacen.ponerDespertar('2026-10-21', 7 * 60 + 10, 8 * 60);
    // Abrir Moss más tarde no cambia nada.
    almacen.ponerDespertar('2026-10-21', 9 * 60, 9 * 60);
    almacen.ponerDespertar('2026-10-01', 8 * 60, 8 * 60);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().despertares).toEqual({ '2026-10-21': { despertar: 7 * 60 + 10, sabido: 7 * 60 + 40 } });
  });

  it('lo que contestaste a «¿Desayunas hoy?» se recuerda en el teléfono', async () => {
    const { almacen, repositorio } = await armar();
    almacen.ponerDesayuno('2026-10-21', 'directo');
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().desayunos).toEqual({ '2026-10-21': 'directo' });
  });

  it('los pendientes: lo anotado es para mañana, se tachan, se quitan y quedan en el teléfono', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().pendientes).toEqual([]);
    const dentista = almacen.ponerPendiente('  Llamar al   dentista ');
    const luz = almacen.ponerPendiente('Pagar la luz');
    expect(dentista).toEqual({ id: 'id1', texto: 'Llamar al dentista', hecho: false, para: '2026-10-22' });
    // Sin texto no se anota nada.
    expect(almacen.ponerPendiente('   ')).toBeNull();
    almacen.marcarPendiente(luz!.id, true);
    almacen.quitarPendiente(dentista!.id);
    const esperado = [{ id: 'id2', texto: 'Pagar la luz', hecho: true, para: '2026-10-22' }];
    expect(almacen.estado().pendientes).toEqual(esperado);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().pendientes).toEqual(esperado);
    // No suben a la cuenta: entre lo que falta subir no están.
    expect(JSON.stringify(await repositorio.pendientes())).not.toContain('Pagar la luz');
  });

  it('los pendientes: de madrugada, antes del corte, también son para el día que sigue al de Moss; hasta seis por día', async () => {
    const { almacen, ir } = await armar();
    // La 1:30 del 22: para Moss todavía es el 21.
    ir('2026-10-22T04:30:00Z');
    almacen.revisarDia();
    for (let i = 0; i < 8; i++) almacen.ponerPendiente(`Pendiente ${i}`);
    expect(almacen.estado().pendientes.map((p) => p.para)).toEqual(Array(6).fill('2026-10-22'));
    // Ya de mañana, lo que se anota es para el 23, y entra aunque el 22 esté lleno.
    ir('2026-10-22T11:00:00Z');
    almacen.revisarDia();
    expect(almacen.ponerPendiente('Otro')?.para).toBe('2026-10-23');
  });

  it('los pendientes de hace más de una semana se olvidan, al anotar y al abrir', async () => {
    const { almacen, repositorio, ir } = await armar();
    almacen.ponerPendiente('Viejo');
    ir('2026-10-25T15:00:00Z');
    almacen.revisarDia();
    almacen.ponerPendiente('De esta semana');
    ir('2026-10-30T15:00:00Z');
    almacen.revisarDia();
    // El del 22 ya tiene más de una semana: al anotar otro, se va.
    almacen.ponerPendiente('Nuevo');
    expect(almacen.estado().pendientes.map((p) => p.texto)).toEqual(['De esta semana', 'Nuevo']);
    // Al abrir (el 21), lo guardado para antes del 14 no vuelve, ni lo que no tiene forma.
    await repositorio.guardarAjuste('pendientes', JSON.stringify([
      { id: 'a', texto: 'De hace mucho', hecho: false, para: '2026-10-13' }, { id: 'b', texto: 'De hace una semana', hecho: true, para: '2026-10-14' }, { id: 'c', texto: 'Sin día' },
    ]));
    expect((await armar(repositorio)).almacen.estado().pendientes).toEqual([{ id: 'b', texto: 'De hace una semana', hecho: true, para: '2026-10-14' }]);
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
  it('a las 4 de la mañana cambia el día (D32) y lo de ayer queda guardado', async () => {
    const { almacen, ir } = await armar();
    almacen.marcar('meditar', true, 'toque');
    // A las 0:30 todavía es el 21: lo que se hace ahora cuenta para ese día.
    ir('2026-10-22T03:30:00Z');
    expect(almacen.revisarDia()).toBe(false);
    almacen.marcar('leer', true, 'toque');
    ir('2026-10-22T07:00:00Z');
    expect(almacen.revisarDia()).toBe(true);
    expect(almacen.estado().hoy).toBe('2026-10-22');
    expect(almacen.estado().dias.get('2026-10-21')).toMatchObject({ hechos: ['meditar', 'leer'] });
    expect(hoy(almacen)).toMatchObject({ hechos: [], luz: 0 });
  });

  it('el corte se elige: a la medianoche, como antes; y cambiarlo pasado el corte nuevo arma el día', async () => {
    const { almacen, ir } = await armar();
    ir('2026-10-22T03:30:00Z');
    almacen.ponerCorte(0);
    expect(almacen.estado().corte).toBe(0);
    expect(almacen.estado().hoy).toBe('2026-10-22');
    // Volver a las 4 a las 0:30: todavía es el 21.
    almacen.ponerCorte(240);
    expect(almacen.estado().hoy).toBe('2026-10-21');
    // Lo que no es un corte de los que se eligen queda en el de fábrica.
    almacen.ponerCorte(17);
    expect(almacen.estado().corte).toBe(240);
  });

  it('lo que necesitas dormir se elige y queda en el teléfono; solo vale lo que se puede elegir', async () => {
    const { almacen, repositorio } = await armar();
    expect(almacen.estado().necesidad).toBeNull();
    almacen.ponerNecesidad(450);
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().necesidad).toBe(450);
    // Lo que no es una de las que se eligen queda sin elegir; null vuelve a lo de tu edad.
    almacen.ponerNecesidad(455);
    expect(almacen.estado().necesidad).toBeNull();
    almacen.ponerNecesidad(420);
    almacen.ponerNecesidad(null);
    expect(almacen.estado().necesidad).toBeNull();
  });

  it('la cena anotada a las 0:30 es del día anterior', async () => {
    const { almacen, ir } = await armar();
    ir('2026-10-22T03:30:00Z');
    almacen.revisarDia();
    const [r] = almacen.registrar([{ fuente: 'rapida', ref: null, nombre: 'Pizza', cantidad: null, valores: { kcal: 600, proteina: 25, carbohidratos: 70, grasas: 22 } }], { comida: 'cena' });
    expect(r.dia).toBe('2026-10-21');
  });

  it('marcar otro día reciente rearma su resumen, o lo arma si Moss no se abrió ese día; fuera de las dos semanas, nada', async () => {
    const { almacen, ir } = await armar();
    // Moss no se abre el 22: se abre el 23.
    ir('2026-10-23T13:00:00Z');
    almacen.revisarDia();
    expect(almacen.estado().dias.has('2026-10-22')).toBe(false);
    almacen.marcarEnDia('leer', '2026-10-22', true, 'toque', '2026-10-23T02:40:00.000Z');
    almacen.marcarEnDia('meditar', '2026-10-21', true, 'toque', '2026-10-22T02:00:00.000Z');
    const e = almacen.estado();
    expect(e.dias.get('2026-10-22')).toMatchObject({ habitos: ['meditar', 'leer', 'agua'], hechos: ['leer'], luz: 3 });
    expect(e.dias.get('2026-10-22')!.constelacion).not.toBeNull();
    expect(e.dias.get('2026-10-21')!.hechos).toEqual(['meditar']);
    expect(hoy(almacen).hechos).toEqual([]);
    const antes = almacen.estado();
    expect(almacen.marcarEnDia('leer', '2026-10-01', true, 'toque')).toEqual([]);
    expect(almacen.marcarEnDia('leer', '2026-10-24', true, 'toque')).toEqual([]);
    expect(almacen.estado()).toBe(antes);
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

  it('copiar o mover alimentos sueltos: a otra comida a su hora, a mañana planificados, y mover se deshace', async () => {
    const { almacen } = await armar();
    const [pan, postre] = almacen.registrar([banana(), alfajor()], { comida: 'almuerzo' });
    // El postre del almuerzo a la merienda de hoy, a las 17:30.
    const [copia] = almacen.copiarRegistros([postre.id], { dia: '2026-10-21', comida: 'merienda', minutos: 17 * 60 + 30 });
    expect(copia).toMatchObject({ dia: '2026-10-21', comida: 'merienda', nombre: postre.nombre, planificado: false });
    expect(new Date(copia.momento).getHours() * 60 + new Date(copia.momento).getMinutes()).toBe(17 * 60 + 30);
    // A mañana: planificado. Lo de otra comida que se cuele en los ids no se copia.
    const manana = almacen.copiarRegistros([pan.id, copia.id], { dia: '2026-10-22', comida: 'almuerzo' });
    expect(manana).toHaveLength(1);
    expect(manana[0]).toMatchObject({ dia: '2026-10-22', planificado: true, nombre: pan.nombre });
    // Mover = copiar y borrar; deshacer = borrar la copia y devolver lo de antes.
    const [movido] = almacen.copiarRegistros([pan.id], { dia: '2026-10-21', comida: 'cena' });
    almacen.borrarRegistro(pan.id);
    expect(almacen.estado().registros.get(pan.id)?.borrado).toBe(true);
    almacen.borrarRegistro(movido.id);
    almacen.deshacerBorrado(pan.id);
    expect(vigentes(almacen.estado().registros.values()).filter((r) => r.dia === '2026-10-21').map((r) => r.comida).sort()).toEqual(['almuerzo', 'almuerzo', 'merienda']);
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

  it('la sugerencia se va al comer: anotar esa comida o una después de su hora la saca, y deshacer la devuelve', async () => {
    const { almacen, ir } = await armar();
    const comida = (c: 'desayuno' | 'almuerzo' | 'cena', item = banana()) => ({ comida: c, opcion: c, items: [item], valores: item.valores });
    ir('2026-10-21T10:00:00Z');
    const horas: Record<string, number> = { desayuno: 8 * 60, almuerzo: 13 * 60, cena: 21 * 60 };
    const [desayuno, almuerzo, cena] = almacen.planificar('2026-10-21', [comida('desayuno'), comida('almuerzo'), comida('cena')], (c) => horas[c]);
    const r = () => almacen.estado().registros;
    // A las 13, el almuerzo: se van lo sugerido del almuerzo y el desayuno, que ya pasó; la cena queda.
    ir('2026-10-21T16:00:00Z');
    const [anotado] = almacen.registrar([alfajor()], { comida: 'almuerzo' });
    expect(r().get(almuerzo.id)!.borrado).toBe(true);
    expect(r().get(desayuno.id)!.borrado).toBe(true);
    expect(r().get(cena.id)!.borrado).toBeUndefined();
    expect(vigentes(r().values()).filter((x) => x.comida === 'almuerzo').map((x) => x.id)).toEqual([anotado.id]);
    // Deshacer lo anotado las devuelve.
    almacen.borrarRegistro(anotado.id);
    expect(r().get(almuerzo.id)!.borrado).toBeUndefined();
    expect(r().get(desayuno.id)!.borrado).toBeUndefined();
  });

  it('«Comí esto» también saca lo sugerido que ya pasó, y deshacerlo lo devuelve', async () => {
    const { almacen, ir } = await armar();
    const comida = (c: 'desayuno' | 'almuerzo', item = banana()) => ({ comida: c, opcion: c, items: [item], valores: item.valores });
    ir('2026-10-21T10:00:00Z');
    const horas: Record<string, number> = { desayuno: 8 * 60, almuerzo: 13 * 60 };
    const [desayuno, almuerzo] = almacen.planificar('2026-10-21', [comida('desayuno'), comida('almuerzo')], (c) => horas[c]);
    ir('2026-10-21T16:00:00Z');
    const ids = almacen.confirmarComida('2026-10-21', 'almuerzo');
    const r = () => almacen.estado().registros;
    expect(r().get(desayuno.id)!.borrado).toBe(true);
    expect(r().get(almuerzo.id)!.planificado).toBe(false);
    almacen.volverAPlanificar(ids);
    expect(r().get(desayuno.id)!.borrado).toBeUndefined();
    expect(r().get(almuerzo.id)!.planificado).toBe(true);
  });

  it('anotar o confirmar una comida la pone a su hora y corre lo planificado que sigue, con la misma distancia', async () => {
    const { almacen, ir } = await armar();
    const comida = (c: 'desayuno' | 'almuerzo' | 'cena', item = banana()) => ({ comida: c, opcion: c, items: [item], valores: item.valores });
    // El plan, armado a las 7: desayuno a las 8, almuerzo a las 13 y cena a las 21 (en Montevideo, UTC−3).
    ir('2026-10-21T10:00:00Z');
    const horas: Record<string, number> = { desayuno: 8 * 60, almuerzo: 13 * 60, cena: 21 * 60 };
    const [, almuerzo, cena] = almacen.planificar('2026-10-21', [comida('desayuno'), comida('almuerzo', alfajor()), comida('cena')], (c) => horas[c]);
    // «Comí esto» del desayuno a las 9:30: hora y media tarde.
    ir('2026-10-21T12:30:00Z');
    almacen.confirmarComida('2026-10-21', 'desayuno');
    const r = almacen.estado().registros;
    expect(vigentes(r.values()).find((x) => x.comida === 'desayuno')!.momento).toBe('2026-10-21T12:30:00.000Z');
    expect(r.get(almuerzo.id)!.momento.slice(11, 16)).toBe('17:30');
    expect(r.get(cena.id)!.momento.slice(11, 16)).toBe('01:30');
    // Almorzar media hora antes de lo corrido adelanta la cena media hora.
    ir('2026-10-21T17:00:00Z');
    almacen.registrar([alfajor()], { comida: 'almuerzo' });
    expect(almacen.estado().registros.get(cena.id)!.momento.slice(11, 16)).toBe('01:00');
  });

  describe('lo que corre al comer, y deshacerlo', () => {
    // El plan, armado a las 7 (en Montevideo, UTC−3): las horas de abajo son las de UTC.
    const comida = (c: 'desayuno' | 'almuerzo' | 'merienda' | 'cena') => ({ comida: c, opcion: c, items: [banana()], valores: banana().valores });
    const HORAS: Record<string, number> = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };
    async function conPlan(comidas: ('desayuno' | 'almuerzo' | 'merienda' | 'cena')[]) {
      const t = await armar();
      t.ir('2026-10-21T10:00:00Z');
      const plan = t.almacen.planificar('2026-10-21', comidas.map(comida), (c) => HORAS[c]);
      const r = (id: string) => t.almacen.estado().registros.get(id)!;
      return { ...t, plan, r, hora: (id: string) => r(id).momento.slice(11, 16) };
    }

    it('corre solo con lo primero que se come de esa comida: lo que se suma después no la vuelve a correr', async () => {
      // El bug: cada cosa sumada al desayuno corría todo otra vez, y la cena terminaba a la madrugada.
      const { almacen, ir, plan: [, almuerzo, cena], hora } = await conPlan(['desayuno', 'almuerzo', 'cena']);
      ir('2026-10-21T12:30:00Z');
      almacen.registrar([alfajor()], { comida: 'desayuno' });
      expect([hora(almuerzo.id), hora(cena.id)]).toEqual(['17:30', '01:30']);
      ir('2026-10-21T12:40:00Z');
      almacen.registrar([banana()], { comida: 'desayuno' });
      expect([hora(almuerzo.id), hora(cena.id)]).toEqual(['17:30', '01:30']);
    });

    it('lo que se suma después de «Comí esto» tampoco la corre', async () => {
      const { almacen, ir, plan: [, almuerzo], hora } = await conPlan(['desayuno', 'almuerzo']);
      ir('2026-10-21T12:30:00Z');
      almacen.confirmarComida('2026-10-21', 'desayuno');
      ir('2026-10-21T12:35:00Z');
      almacen.registrar([alfajor()], { comida: 'desayuno' });
      expect(hora(almuerzo.id)).toBe('17:30');
    });

    it('con lo planificado a mano, dos cosas en el almuerzo corren la cena una sola vez', async () => {
      const { almacen, ir } = await armar();
      // Ayer, para hoy: el almuerzo a las 13 y la cena a las 21.
      const [cena] = almacen.registrar([banana()], { comida: 'cena', dia: '2026-10-22', momento: '2026-10-23T00:00:00.000Z' });
      almacen.registrar([alfajor()], { comida: 'almuerzo', dia: '2026-10-22', momento: '2026-10-22T16:00:00.000Z' });
      ir('2026-10-22T17:00:00Z');
      almacen.revisarDia();
      almacen.registrar([banana()], { comida: 'almuerzo' });
      ir('2026-10-22T17:10:00Z');
      almacen.registrar([alfajor()], { comida: 'almuerzo' });
      expect(almacen.estado().registros.get(cena.id)!.momento).toBe('2026-10-23T01:00:00.000Z');
    });

    it('lo que sigue a una comida ya comida no corre con una anterior anotada después', async () => {
      const { almacen, ir, plan: [, , cena], hora } = await conPlan(['desayuno', 'almuerzo', 'cena']);
      ir('2026-10-21T16:00:00Z');
      almacen.registrar([alfajor()], { comida: 'almuerzo' });
      // El desayuno de las 9:30, anotado después (el toque de un widget).
      almacen.registrar([banana()], { comida: 'desayuno', momento: '2026-10-21T12:30:00.000Z' });
      expect(hora(cena.id)).toBe('00:00');
    });

    it('sin plan de esa comida, corre desde la hora del horario o la de siempre, no desde la típica', async () => {
      const { almacen, ir, plan: [cena], hora } = await conPlan(['cena']);
      // Desayuna siempre a las 9:30: hoy, a las 9:33, no corre nada.
      for (const dia of ['2026-10-18', '2026-10-19', '2026-10-20']) almacen.registrar([banana()], { comida: 'desayuno', dia, momento: `${dia}T12:30:00.000Z` });
      ir('2026-10-21T12:33:00Z');
      almacen.registrar([banana()], { comida: 'desayuno' });
      expect(hora(cena.id)).toBe('00:00');
    });

    it('sin plan de esa comida, la espera a su hora corrida por lo que ya comiste: lo corrido no se cuenta dos veces', async () => {
      const { almacen, ir, plan: [, cena], hora } = await conPlan(['desayuno', 'cena']);
      // Desayuno una hora tarde: la cena pasa a las 22.
      ir('2026-10-21T12:00:00Z');
      almacen.confirmarComida('2026-10-21', 'desayuno');
      expect(hora(cena.id)).toBe('01:00');
      // El almuerzo, sin plan, a las 14: es su hora de siempre corrida esa misma hora, y la cena queda.
      ir('2026-10-21T17:00:00Z');
      almacen.registrar([alfajor()], { comida: 'almuerzo' });
      expect(hora(cena.id)).toBe('01:00');
    });

    it('deshacer «Comí esto» la vuelve a su hora y devuelve lo que corrió', async () => {
      const { almacen, ir, plan: [desayuno, almuerzo, merienda, cena], r, hora } = await conPlan(['desayuno', 'almuerzo', 'merienda', 'cena']);
      ir('2026-10-21T15:00:00Z');
      const ids = almacen.confirmarComida('2026-10-21', 'desayuno');
      expect(hora(almuerzo.id)).toBe('20:00');
      almacen.volverAPlanificar(ids);
      expect([desayuno, almuerzo, merienda, cena].map((x) => hora(x.id))).toEqual(['11:00', '16:00', '20:30', '00:00']);
      expect(r(desayuno.id).planificado).toBe(true);
    });

    it('deshacer lo anotado devuelve lo que corrió, además de lo sugerido', async () => {
      const { almacen, ir, plan: [almuerzo, merienda, cena], r, hora } = await conPlan(['almuerzo', 'merienda', 'cena']);
      ir('2026-10-21T18:00:00Z');
      const [anotado] = almacen.registrar([alfajor()], { comida: 'almuerzo' });
      expect([hora(merienda.id), hora(cena.id)]).toEqual(['22:30', '02:00']);
      almacen.borrarRegistro(anotado.id);
      expect([hora(merienda.id), hora(cena.id)]).toEqual(['20:30', '00:00']);
      expect(r(almuerzo.id).borrado).toBeUndefined();
    });

    it('deshacer el «Quitar» de lo comido vuelve a sacar lo sugerido y a correr lo que sigue', async () => {
      // El bug: quedaban lo comido y lo sugerido a la vez.
      const { almacen, ir, plan: [desayuno, almuerzo, cena], r, hora } = await conPlan(['desayuno', 'almuerzo', 'cena']);
      ir('2026-10-21T17:00:00Z');
      const [anotado] = almacen.registrar([alfajor()], { comida: 'almuerzo' });
      almacen.borrarRegistro(anotado.id);
      expect([r(desayuno.id).borrado, r(almuerzo.id).borrado, hora(cena.id)]).toEqual([undefined, undefined, '00:00']);
      almacen.deshacerBorrado(anotado.id);
      expect(delDia(almacen.estado().registros.values(), '2026-10-21').map((x) => [x.comida, x.planificado])).toEqual([['almuerzo', false], ['cena', true]]);
      expect(hora(cena.id)).toBe('01:00');
    });

    it('deshacer un borrado que no devolvió nada no corre dos veces lo que sigue', async () => {
      const { almacen, ir, plan: [, , cena], hora } = await conPlan(['desayuno', 'almuerzo', 'cena']);
      ir('2026-10-21T17:00:00Z');
      const [anotado] = almacen.registrar([alfajor()], { comida: 'almuerzo' });
      // Algo anotado después: lo del almuerzo ya no se puede devolver.
      ir('2026-10-21T17:30:00Z');
      almacen.registrar([banana()], { comida: 'snack' });
      almacen.borrarRegistro(anotado.id);
      almacen.deshacerBorrado(anotado.id);
      expect(hora(cena.id)).toBe('01:00');
    });

    it('lo que se cambió después de comer no vuelve al deshacer', async () => {
      const { almacen, ir, plan: [, almuerzo], r } = await conPlan(['desayuno', 'almuerzo']);
      ir('2026-10-21T12:30:00Z');
      const ids = almacen.confirmarComida('2026-10-21', 'desayuno');
      // «Otra» en el almuerzo, ya corrido: el de antes queda borrado aunque se deshaga «Comí esto».
      almacen.cambiarPlanificada('2026-10-21', { ...comida('almuerzo'), opcion: 'otra', items: [alfajor()] }, (c) => HORAS[c]);
      almacen.volverAPlanificar(ids);
      expect(r(almuerzo.id).borrado).toBe(true);
      expect(vigentes(almacen.estado().registros.values()).filter((x) => x.comida === 'almuerzo').map((x) => x.nombre)).toEqual(['Alfajor']);
    });

    it('anotar y «Comí esto» son un solo cambio, aunque corran lo que sigue y saquen lo sugerido', async () => {
      const { almacen, ir } = await conPlan(['desayuno', 'almuerzo', 'cena']);
      let cambios = 0;
      almacen.suscribir(() => cambios++);
      ir('2026-10-21T12:30:00Z');
      almacen.registrar([alfajor()], { comida: 'desayuno' });
      expect(cambios).toBe(1);
      ir('2026-10-21T18:00:00Z');
      almacen.confirmarComida('2026-10-21', 'almuerzo');
      expect(cambios).toBe(2);
    });

    it('«Comí esto» desde el widget va a la hora del toque y corre desde ahí', async () => {
      const { almacen, ir, plan: [desayuno, almuerzo], r, hora } = await conPlan(['desayuno', 'almuerzo']);
      // Tocado a las 8:30, aplicado al abrir Moss a las 12:30.
      ir('2026-10-21T15:30:00Z');
      almacen.confirmarComida('2026-10-21', 'desayuno', '2026-10-21T11:30:00.000Z');
      expect(r(desayuno.id)).toMatchObject({ planificado: false, momento: '2026-10-21T11:30:00.000Z', actualizado: '2026-10-21T15:30:00.000Z' });
      expect(hora(almuerzo.id)).toBe('16:30');
    });
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

  it('si se guardó el de la noche y después Salud trae uno más temprano del mismo día, queda el de la mañana; el anotado a mano, no se toca', async () => {
    const { almacen, ir } = await armar();
    ir('2026-10-21T15:00:00Z');
    almacen.revisarDia();
    almacen.ponerSalud(salud([['2026-10-20', 71.2], ['2026-10-19', 70.6]]));
    almacen.anotarPeso(70.9, 'manual');
    almacen.ponerSalud(salud([['2026-10-20', 70.0], ['2026-10-19', 70.6], ['2026-10-21', 70.2]]));
    const pesos = almacen.estado().pesos;
    expect(pesos.map((p) => [p.fecha, p.kg, p.origen])).toEqual([['2026-10-19', 70.6, 'salud'], ['2026-10-20', 70, 'salud'], ['2026-10-21', 70.9, 'manual']]);
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

describe('el cuestionario nuevo y los cuidados', () => {
  const respuestas: Cuestionario = { edad: 31, sexo: 'f', alturaCm: 165, pesoKg: 64, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' };
  const nuevo: CuestionarioNuevo = {
    respuestas: {
      movimiento: 'sentado', grasa: null, experiencia: null, despues: null, proteina: 'alta', recomponer: false, fecha: null,
      eleccion: { proteinaPorKg: 2, pct: null }, horarios: { desayuno: 450, almuerzo: 780, merienda: null, cena: 1260 },
      sueno: { despertar: 420, acostarse: 1380, finDeSemana: 'igual' }, salud: false,
    },
    cuidados: { marcados: ['celiaquia'], datos: {} },
    entreno: entrenoParaGuardar({ tipos: ['fuerza', 'equipo'], sesiones: [{ tipo: 'fuerza', dias: [1, 3], hora: 1080, minutos: 60 }, { tipo: 'equipo', dias: [6], hora: 960, minutos: 90 }], viaje: 15, partidos: { dia: 6, hora: 960 } }),
    meta: { gasto: 2104, metas: { kcal: 2100, proteina: 128, carbohidratos: 240, grasas: 70 } },
    perfil: { estilo: 'bajaEnGrasas', dieta: 'vegetariana' },
  };

  it('el final de la entrada guarda lo nuevo en el teléfono, con la meta que salió, y se recuerda', async () => {
    const { almacen, repositorio } = await armar();
    const meta = almacen.responderCuestionario(respuestas, 'manual', nuevo);
    expect(meta).toMatchObject({ kcal: 2100, proteina: 128, gasto: 2100, motivo: 'inicial' });
    expect(almacen.estado().perfil).toMatchObject({ estilo: 'bajaEnGrasas', comer: { dieta: 'vegetariana', comidas: 4 } });
    await almacen.esperar();
    // Lo marcado no va a la cuenta: solo lo que va con el perfil.
    expect(JSON.stringify(await repositorio.pendientes())).not.toContain('celiaquia');
    const otra = (await armar(repositorio)).almacen.estado();
    expect(otra.respuestas).toEqual(nuevo.respuestas);
    expect(otra.cuidados).toEqual(nuevo.cuidados);
    expect(otra.entreno).toEqual(nuevo.entreno);
  });

  it('«Tus respuestas» rehace la meta desde hoy, y el peso de hoy solo si cambió', async () => {
    const { almacen, ir } = await armar();
    almacen.responderCuestionario(respuestas, 'manual', nuevo);
    ir('2026-10-25T15:00:00Z');
    almacen.revisarDia();
    const meta = almacen.cambiarRespuestas({ ...respuestas, objetivo: 'bajar' }, 'manual', { ...nuevo, meta: { gasto: 2100, metas: { kcal: 1800, proteina: 130, carbohidratos: 190, grasas: 60 } }, perfil: { pesoMeta: 60 } });
    expect(meta).toMatchObject({ desde: '2026-10-25', kcal: 1800, motivo: 'objetivo' });
    expect(almacen.estado().metas.map((m) => m.desde)).toEqual(['2026-10-21', '2026-10-25']);
    expect(almacen.estado().pesos.map((p) => p.fecha)).toEqual(['2026-10-21']);
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'bajar', pesoMeta: 60 });
    almacen.cambiarRespuestas({ ...respuestas, objetivo: 'mantener' }, 'manual', { ...nuevo, perfil: { pesoMeta: undefined } });
    expect(almacen.estado().perfil?.pesoMeta).toBeUndefined();
  });

  it('marcar un cuidado que no deja bajar pone «sin déficit» y mueve la meta, como en Progreso', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' }, 'manual', nuevo);
    almacen.ponerCuidados({ marcados: ['renal'], datos: { renal: { dialisis: false } } });
    expect(almacen.estado().perfil?.sinDeficit).toBe(true);
    expect(almacen.estado().metas[almacen.estado().metas.length - 1]).toMatchObject({ motivo: 'objetivo' });
    expect(reglasDeCuidados(almacen.estado())?.proteina.fija).toBe(0.8);
  });

  it('con el embarazo, el control queda en pausa: ninguna meta nueva', async () => {
    const t = await armar();
    t.ir('2026-10-14T15:00:00Z');
    t.almacen.revisarDia();
    t.almacen.responderCuestionario({ ...respuestas, sinDeficit: true }, 'manual', { ...nuevo, cuidados: { marcados: ['embarazo'], datos: { embarazo: { fechaProbable: '2027-03-01', pesoAntes: 60, mellizos: false } } } });
    for (let d = 1; d < 14; d++) t.almacen.anotarPeso(64, 'salud', `2026-10-${String(d).padStart(2, '0')}`);
    for (let d = 14; d <= 21; d++) {
      t.ir(`2026-10-${d}T15:00:00Z`);
      t.almacen.revisarDia();
      t.almacen.anotarPeso(64, 'salud');
    }
    expect(t.almacen.estado().metas.map((m) => m.motivo)).toEqual(['inicial']);
  });

  it('cambiar el objetivo en Progreso olvida la fecha y el ritmo elegidos en el cuestionario', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' }, 'manual', { ...nuevo, respuestas: { ...nuevo.respuestas, fecha: '2027-01-04', eleccion: { proteinaPorKg: 2, pct: -0.6 } } });
    almacen.ponerEstrategia({ objetivo: 'mantener' });
    expect(almacen.estado().respuestas).toMatchObject({ fecha: null, eleccion: { pct: null, proteinaPorKg: null } });
  });

  it('el ritmo o la fecha elegidos en Progreso quedan en el teléfono y la meta los sigue', async () => {
    const repositorio = repositorioEnMemoria();
    const { almacen } = await armar(repositorio);
    almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' }, 'manual', { ...nuevo, cuidados: { marcados: [], datos: {} } });
    const ultima = () => almacen.estado().metas[almacen.estado().metas.length - 1];
    const gasto = ultima().gasto;
    const persona = { edad: 31, sexo: 'f' as const, pesoKg: 64, objetivo: 'bajar' as const, ritmo: 'recomendado' as const };
    const con = (pct: number) => metaPara(gasto, persona, 'bajaEnGrasas', { proteinaPorKg: 2, pct });
    expect(almacen.estado().plazo).toBeNull();
    almacen.ponerPlazo({ pct: 0.25, fecha: null });
    expect(almacen.estado().plazo).toEqual({ pct: 0.25, fecha: null });
    expect(ultima()).toMatchObject({ ...con(-0.25), motivo: 'objetivo', gasto });
    // El mismo otra vez no cambia nada.
    const antes = ultima();
    almacen.ponerPlazo({ pct: 0.25, fecha: null });
    expect(ultima()).toBe(antes);
    // Muy agresivo: el plan lo muestra, pero la meta no pasa de lo exigente (el 1 %).
    almacen.ponerPlazo({ pct: 1.15, fecha: '2026-12-20' });
    expect(ultima()).toMatchObject(con(-1));
    expect(con(-1).kcal).toBeLessThan(con(-0.25).kcal);
    // Queda en el teléfono, y no sube a la cuenta.
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().plazo).toEqual({ pct: 1.15, fecha: '2026-12-20' });
    expect(JSON.stringify(await repositorio.pendientes())).not.toContain('2026-12-20');
    // Otro de los tres ritmos lo suelta, y la meta vuelve a ser la de ese ritmo.
    almacen.ponerEstrategia({ ritmo: 'suave' });
    expect(almacen.estado().plazo).toBeNull();
    expect(ultima()).toMatchObject(metaPara(gasto, { ...persona, ritmo: 'suave' }, 'bajaEnGrasas'));
  });

  it('volver al ritmo del perfil suelta lo elegido en Progreso y la fecha del cuestionario', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' }, 'manual', { ...nuevo, cuidados: { marcados: [], datos: {} }, respuestas: { ...nuevo.respuestas, fecha: '2027-01-04', eleccion: { proteinaPorKg: 2, pct: -0.6 } } });
    const ultima = () => almacen.estado().metas[almacen.estado().metas.length - 1];
    const gasto = ultima().gasto;
    almacen.ponerPlazo({ pct: 0.3, fecha: null });
    almacen.ponerPlazo(null);
    expect(almacen.estado().plazo).toBeNull();
    // La proteína elegida en el cuestionario se queda; su fecha y su ritmo, no.
    expect(almacen.estado().respuestas).toMatchObject({ fecha: null, eleccion: { pct: null, proteinaPorKg: 2 } });
    expect(ultima()).toMatchObject(metaPara(gasto, { edad: 31, sexo: 'f', pesoKg: 64, objetivo: 'bajar', ritmo: 'recomendado' }, 'bajaEnGrasas', { proteinaPorKg: 2, pct: null }));
  });

  it('la próxima carrera de Perfil › Entrenamiento queda en el teléfono, y contestar otra vez el cuestionario no la pierde', async () => {
    const repositorio = repositorioEnMemoria();
    const { almacen } = await armar(repositorio);
    const corre = entrenoParaGuardar({ tipos: ['fuerza', 'resistencia'], sesiones: [{ tipo: 'fuerza', dias: [1, 3], hora: 1080, minutos: 60 }, { tipo: 'resistencia', dias: [6], hora: 540, minutos: 90 }], viaje: 15 })!;
    almacen.responderCuestionario(respuestas, 'manual', { ...nuevo, entreno: corre });
    const carrera = { fecha: '2026-11-28', minutos: 120 };
    almacen.ponerEntreno({ ...almacen.estado().entreno!, carrera });
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().entreno?.carrera).toEqual(carrera);
    almacen.cambiarRespuestas(respuestas, 'manual', { ...nuevo, entreno: corre });
    expect(almacen.estado().entreno?.carrera).toEqual(carrera);
    // Si ya no corre, la carrera se va con el deporte.
    almacen.cambiarRespuestas(respuestas, 'manual', nuevo);
    expect(almacen.estado().entreno?.carrera).toBeUndefined();
  });

  it('el país de los alimentos queda en el teléfono; uno que no es un país vuelve al del teléfono', async () => {
    const repositorio = repositorioEnMemoria();
    const { almacen } = await armar(repositorio);
    expect(almacen.estado().paisDeAlimentos).toBeNull();
    almacen.ponerPaisDeAlimentos('MX');
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().paisDeAlimentos).toBe('MX');
    almacen.ponerPaisDeAlimentos('México');
    expect(almacen.estado().paisDeAlimentos).toBeNull();
  });

  it('con las metas a mano, el ritmo elegido en Progreso se guarda y las metas quedan', async () => {
    const { almacen } = await armar();
    almacen.responderCuestionario({ ...respuestas, objetivo: 'bajar' }, 'manual', { ...nuevo, cuidados: { marcados: [], datos: {} } });
    const aMano = almacen.ponerMetasAMano({ proteina: 120, carbohidratos: 200, grasas: 60 });
    almacen.ponerPlazo({ pct: 0.7, fecha: null });
    expect(almacen.estado().plazo).toEqual({ pct: 0.7, fecha: null });
    expect(almacen.estado().metas[almacen.estado().metas.length - 1]).toMatchObject({ motivo: 'manual', kcal: aMano?.kcal });
  });
});

describe('al llegar al peso meta, Moss aplica lo que sigue', () => {
  // Bajando de 70 a 66 kg, con pesas y «perder grasa» para después.
  const respuestas: Cuestionario = { edad: 31, sexo: 'f', alturaCm: 165, pesoKg: 70, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado' };
  const nuevo = (despues: CuestionarioNuevo['respuestas']['despues']): CuestionarioNuevo => ({
    respuestas: {
      movimiento: 'sentado', grasa: null, experiencia: 'principiante', despues, proteina: 'recomendada', recomponer: false, fecha: null,
      eleccion: { proteinaPorKg: 2, pct: null }, horarios: { desayuno: 450, almuerzo: 780, merienda: null, cena: 1260 }, sueno: null, salud: false,
    },
    cuidados: { marcados: [], datos: {} },
    entreno: entrenoParaGuardar({ tipos: ['fuerza'], sesiones: [{ tipo: 'fuerza', dias: [1, 3, 5], hora: 1080, minutos: 60 }], viaje: 15 }),
    meta: { gasto: 2100, metas: { kcal: 1720, proteina: 140, carbohidratos: 170, grasas: 55 } },
    perfil: { pesoMeta: 66 },
  });
  const dia = (n: number) => sumarDias('2026-09-01', n);

  /** Desde el 1/9, un día por vez, pesándose cada mañana: 100 g menos por día hasta `hasta` y después, quieto. */
  async function bajando(despues: CuestionarioNuevo['respuestas']['despues'], alResponder?: (a: ReturnType<typeof crearAlmacen>) => void) {
    const t = await armar();
    const pesoDe = (n: number) => Math.round((70 - 0.1 * Math.min(n, 40)) * 10) / 10;
    const vivir = (n: number, kg = pesoDe(n)) => {
      t.ir(`${dia(n)}T15:00:00Z`);
      t.almacen.revisarDia();
      t.almacen.anotarPeso(kg, 'manual');
    };
    vivir(0);
    t.almacen.responderCuestionario(respuestas, 'manual', nuevo(despues));
    alResponder?.(t.almacen);
    let n = 0;
    while (!t.almacen.estado().llegada && n < 80) vivir(++n);
    return { ...t, vivir, n };
  }
  const ultima = (a: ReturnType<typeof crearAlmacen>) => a.estado().metas[a.estado().metas.length - 1];

  it('al llegar: dos semanas comiendo lo que gastas, una sola vez, y el día queda fijo aunque el peso rebote', async () => {
    const { almacen, vivir, n, repositorio } = await bajando('grasa');
    const llegada = almacen.estado().llegada!;
    expect(llegada).toMatchObject({ fecha: dia(n), despues: 'grasa', aplicada: 'mantenimiento', soltada: false });
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'mantener', pesoMeta: 66 });
    expect(almacen.estado().respuestas?.eleccion).toEqual({ pct: null, proteinaPorKg: 1.6 });
    const meta = ultima(almacen);
    const pesoKg = almacen.estado().pesos[almacen.estado().pesos.length - 1].kg;
    expect(meta).toMatchObject({ ...metaPara(meta.gasto, { edad: 31, sexo: 'f', pesoKg, objetivo: 'mantener', ritmo: 'recomendado' }, 'equilibrada', { pct: null, proteinaPorKg: 1.6 }), desde: dia(n), motivo: 'objetivo' });
    const cuantas = almacen.estado().metas.length;
    // Rebota medio kilo: sigue en el mantenimiento desde ese día, sin metas nuevas por la etapa.
    vivir(n + 1, 66.6);
    vivir(n + 2, 66.7);
    expect(almacen.estado().llegada).toMatchObject({ fecha: dia(n), aplicada: 'mantenimiento' });
    expect(almacen.estado().metas.slice(cuantas).every((m) => m.motivo !== 'objetivo')).toBe(true);
    // Queda en el teléfono (otra sesión, con su reloj, la sigue desde ese día) y no sube a la cuenta.
    await almacen.esperar();
    expect((await armar(repositorio)).almacen.estado().llegada).toMatchObject({ fecha: dia(n), despues: 'grasa' });
    expect(JSON.stringify(await repositorio.pendientes())).not.toContain('mantenimiento');
  });

  it('terminado el mantenimiento, perder grasa: 0,25 % por semana con la proteína alta, sin peso meta', async () => {
    const { almacen, vivir, n } = await bajando('grasa');
    for (let k = n + 1; k < n + 14; k++) vivir(k);
    expect(almacen.estado().perfil?.objetivo).toBe('mantener');
    vivir(n + 14);
    expect(almacen.estado().llegada?.aplicada).toBe('grasa');
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'bajar', ritmo: 'suave' });
    expect(almacen.estado().perfil?.pesoMeta).toBeUndefined();
    expect(almacen.estado().respuestas?.eleccion).toEqual({ pct: -0.25, proteinaPorKg: 2.2 });
    const meta = ultima(almacen);
    const pesoKg = almacen.estado().pesos[almacen.estado().pesos.length - 1].kg;
    expect(meta).toMatchObject({ ...metaPara(meta.gasto, { edad: 31, sexo: 'f', pesoKg, objetivo: 'bajar', ritmo: 'suave' }, 'equilibrada', { pct: -0.25, proteinaPorKg: 2.2 }), desde: dia(n + 14), motivo: 'objetivo' });
    // Una sola vez: los días siguientes, la etapa no pone otra meta.
    const cuantas = almacen.estado().metas.length;
    vivir(n + 15);
    expect(almacen.estado().metas.slice(cuantas).every((m) => m.motivo !== 'objetivo')).toBe(true);
  });

  it('cambiarlo a mano después: Moss ya no cambia nada solo', async () => {
    const { almacen, vivir, n } = await bajando('grasa');
    almacen.ponerEstrategia({ objetivo: 'subir', pesoMeta: 70 });
    expect(almacen.estado().llegada?.soltada).toBe(true);
    for (let k = n + 1; k <= n + 16; k++) vivir(k);
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'subir', pesoMeta: 70 });
    expect(almacen.estado().llegada).toMatchObject({ fecha: dia(n), aplicada: 'mantenimiento', soltada: true });
  });

  it('lo decido después: al terminar el mantenimiento pregunta y, al elegir, lo aplica desde ese día', async () => {
    const { almacen, vivir, n } = await bajando('despues');
    for (let k = n + 1; k <= n + 14; k++) vivir(k);
    expect(almacen.estado().llegada?.aplicada).toBe('pregunta');
    expect(almacen.estado().perfil?.objetivo).toBe('mantener');
    almacen.elegirLoQueSigue('musculo');
    // Con menos de un año de pesas, el ritmo sugerido para subir.
    expect(almacen.estado().llegada).toMatchObject({ despues: 'musculo', aplicada: 'musculo' });
    expect(almacen.estado().perfil).toMatchObject({ objetivo: 'subir', ritmo: 'recomendado' });
    expect(almacen.estado().respuestas?.eleccion).toEqual({ pct: 0.25, proteinaPorKg: 1.8 });
    expect(ultima(almacen)).toMatchObject({ desde: dia(n + 14), motivo: 'objetivo' });
  });

  it('con las metas a mano, cambia el plan pero no la meta', async () => {
    let aMano: MetaGuardada | null = null;
    const { almacen, vivir, n } = await bajando('grasa', (a) => { aMano = a.ponerMetasAMano({ proteina: 130, carbohidratos: 180, grasas: 60 }); });
    vivir(n + 1);
    expect(almacen.estado().perfil?.objetivo).toBe('mantener');
    expect(almacen.estado().metas.slice(1).every((m) => m.motivo === 'manual' && m.kcal === aMano!.kcal)).toBe(true);
  });

  it('con cuidados marcados, la meta la pone el control con su regla', async () => {
    const t = await armar();
    t.ir(`${dia(0)}T15:00:00Z`);
    t.almacen.revisarDia();
    t.almacen.anotarPeso(70, 'manual');
    t.almacen.responderCuestionario(respuestas, 'manual', { ...nuevo('grasa'), cuidados: { marcados: ['celiaquia'], datos: {} } });
    for (let n = 1; n <= 45; n++) {
      t.ir(`${dia(n)}T15:00:00Z`);
      t.almacen.revisarDia();
      t.almacen.anotarPeso(Math.round((70 - 0.1 * n) * 10) / 10, 'manual');
    }
    expect(t.almacen.estado().llegada?.aplicada).toBe('mantenimiento');
    expect(t.almacen.estado().perfil?.objetivo).toBe('mantener');
    expect(t.almacen.estado().metas.some((m) => m.motivo === 'objetivo')).toBe(false);
  });
});
