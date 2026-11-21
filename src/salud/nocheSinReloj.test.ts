import { describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import type { Movimiento } from '../dominio/sinReloj';
import { armarNoches, type Fuente, type NochePropia } from '../dominio/sueno';
import { estimarAnoche, nocheDeAhora, rehacerLasNoches } from './nocheSinReloj';

// Sin los Atajos (no hay módulo en los tests): la noche sale de cuándo se usó Moss y del movimiento de mentira.
jest.mock('./anclas', () => ({ leerSenales: async () => [] }));
let mockMovimiento: Movimiento[] = [];
jest.mock('../../modules/movimiento', () => ({ leerMovimiento: async (desde: number, hasta: number) => mockMovimiento.filter((m) => m.en >= desde && m.en <= hasta) }));

const almacenCon = (ahora: () => Date, repositorio = repositorioEnMemoria()) => crearAlmacen({
  abrir: async () => repositorio, catalogo: datos.constelaciones as unknown as Constelacion[], ahora, zona: () => 'America/Montevideo', sembrar: () => [], nuevaSemilla: () => 's',
});
/** Un momento del 22 de octubre (o del día que se diga), en la hora del teléfono. */
const el = (dia: number, hora: number, minuto = 0) => new Date(2026, 9, dia, hora, minuto);
const iso = (dia: number, hora: number, minuto = 0) => el(dia, hora, minuto).toISOString();

describe('la noche de anoche, sin reloj', () => {
  it('con el corte a las 6, a las 5 se estima la noche que acaba de terminar, no la de ayer (D32)', async () => {
    let instante = new Date(2026, 9, 21, 20, 0);
    const a = almacenCon(() => instante);
    await a.iniciar();
    a.ponerCorte(360);
    // Moss abierta hasta las 23:10 y otra vez a las 4:50.
    a.anotarUso('abrir', new Date(2026, 9, 21, 23, 0).getTime());
    a.anotarUso('cerrar', new Date(2026, 9, 21, 23, 10).getTime());
    a.anotarUso('abrir', new Date(2026, 9, 22, 4, 50).getTime());
    instante = new Date(2026, 9, 22, 5, 0);
    a.revisarDia();
    expect(a.estado().hoy).toBe('2026-10-21');
    expect(nocheDeAhora(instante)).toBe('2026-10-22');
    await estimarAnoche(a, instante);
    const hora = a.estado().noches.get('2026-10-22')?.hora;
    expect(hora?.origen).toBe('estimada');
    // Todo el rato quieto menos el margen de 15 minutos: de 23:25 a 4:50.
    expect([hora?.dormirse, hora?.despertar]).toEqual([iso(21, 23, 25), iso(22, 4, 50)]);
    expect(a.estado().noches.has('2026-10-21')).toBe(false);
  });

  it('con un anillo, estima igual desde temprano, sin esperar a las 14 (lo pediste el 21/11/2026); si ya llegó la del anillo, no estima', async () => {
    mockMovimiento = [];
    const instante = el(22, 7, 30);
    const anillo: Fuente = { id: 'com.moyoung.darings', nombre: 'Da Rings', tipo: 'otra' };
    const zona = -instante.getTimezoneOffset();
    const salud = (dias: number[]) => ({
      dia: '2026-10-22', valores: {}, soloEnCama: new Map(), fuentes: [anillo], aparatos: [], pasosRecientes: [],
      noches: armarNoches(dias.map((d) => ({ etapa: 'dormido' as const, desde: el(d, 0).getTime(), hasta: el(d, 7).getTime(), fuente: anillo.id, zona })), [anillo]),
      lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() }, pesos: new Map(),
    });
    const conAnillo = async (dias: number[]) => {
      const a = almacenCon(() => instante);
      await a.iniciar();
      a.ponerSalud(salud(dias));
      a.anotarUso('abrir', el(21, 23, 0).getTime());
      a.anotarUso('cerrar', el(21, 23, 10).getTime());
      a.anotarUso('abrir', el(22, 7, 20).getTime());
      await estimarAnoche(a, instante);
      return a.estado().noches.get('2026-10-22')?.hora;
    };
    // Da Rings todavía no mandó la de anoche: a las 7:30 ya hay una, la estimada.
    expect((await conAnillo([20, 21]))?.origen).toBe('estimada');
    // Ya la mandó: la noche es la suya.
    expect(await conAnillo([20, 21, 22])).toBeUndefined();
  });
});

describe('rehacer las noches estimadas con la regla del 17/11/2026, una sola vez', () => {
  /**
   * Una noche como la guardaba la regla de antes: el teléfono quieto de las 00:30 a las 7:30 de `dia`, dormido de
   * 01:01 a 07:12 (31 minutos después de dejarlo y 18 antes de agarrarlo).
   */
  const deAntes = (dia: number, origen: NonNullable<NochePropia['hora']>['origen'] = 'estimada'): NonNullable<NochePropia['hora']> => ({
    dormirse: iso(dia, 1, 1), despertar: iso(dia, 7, 12), origen, confianza: 'alta',
    estimada: { dormirse: iso(dia, 1, 1), despertar: iso(dia, 7, 12), quieto: { desde: iso(dia, 0, 30), hasta: iso(dia, 7, 30) } },
  });
  const horas = (a: ReturnType<typeof almacenCon>, clave: string) => {
    const h = a.estado().noches.get(clave)!.hora!;
    return [h.dormirse, h.despertar, h.origen];
  };

  it('sin las señales (más de seis días, o sin pasos ni movimiento), deshace las restas con la ventana guardada; lo que corregiste o escribiste no se toca', async () => {
    mockMovimiento = [];
    const repositorio = repositorioEnMemoria();
    const ahora = el(22, 9);
    const a = almacenCon(() => ahora, repositorio);
    await a.iniciar();
    a.ponerHoraDeLaNoche('2026-10-20', deAntes(20));
    // Aceptada con «Sí» tal como Moss la propuso: la propuesta ya traía las restas de antes.
    a.ponerHoraDeLaNoche('2026-10-19', deAntes(19, 'confirmada'));
    // Corregida a mano (de 01:30 a 7:00) y escrita sin propuesta: son tus horas.
    a.ponerHoraDeLaNoche('2026-10-17', { ...deAntes(17, 'corregida'), dormirse: iso(17, 1, 30), despertar: iso(17, 7, 0) });
    a.ponerHoraDeLaNoche('2026-10-16', { ...deAntes(16, 'manual'), dormirse: iso(16, 0, 50), despertar: iso(16, 7, 20) });
    // Aceptada con «Sí», pero ya con la regla nueva (las horas de su ventana): ese «Sí» vale.
    const nueva = { dormirse: iso(15, 0, 45), despertar: iso(15, 7, 30) };
    a.ponerHoraDeLaNoche('2026-10-15', { ...deAntes(15, 'confirmada'), ...nueva, estimada: { ...nueva, quieto: { desde: iso(15, 0, 30), hasta: iso(15, 7, 30) } } });
    a.ponerHoraDeLaNoche('2026-10-12', deAntes(12));
    // De hace más de cuatro semanas: ya no se mira.
    a.ponerHoraDeLaNoche('2026-09-20', { ...deAntes(20), dormirse: new Date(2026, 8, 20, 1, 1).toISOString(), despertar: new Date(2026, 8, 20, 7, 12).toISOString() });
    expect(a.estado().suenoRehecho).toBe(false);

    await rehacerLasNoches(a, ahora);
    // De 6 h 11 (con la media hora despierto, 5 h 41) a 6 h 45: de 00:45 a 7:30.
    expect(horas(a, '2026-10-20')).toEqual([iso(20, 0, 45), iso(20, 7, 30), 'estimada']);
    expect(horas(a, '2026-10-12')).toEqual([iso(12, 0, 45), iso(12, 7, 30), 'estimada']);
    // La aceptada con «Sí» también, y vuelve a ser estimada: no es una medición tuya.
    expect(horas(a, '2026-10-19')).toEqual([iso(19, 0, 45), iso(19, 7, 30), 'estimada']);
    expect(horas(a, '2026-10-17')).toEqual([iso(17, 1, 30), iso(17, 7, 0), 'corregida']);
    expect(horas(a, '2026-10-16')).toEqual([iso(16, 0, 50), iso(16, 7, 20), 'manual']);
    expect(horas(a, '2026-10-15')).toEqual([iso(15, 0, 45), iso(15, 7, 30), 'confirmada']);
    expect(a.estado().noches.get('2026-09-20')!.hora!.dormirse).toBe(new Date(2026, 8, 20, 1, 1).toISOString());
    expect(a.estado().suenoRehecho).toBe(true);

    // Una sola vez: una noche de antes que llegue después (de otro teléfono) ya no se rehace.
    a.ponerHoraDeLaNoche('2026-10-18', deAntes(18));
    await rehacerLasNoches(a, ahora);
    expect(horas(a, '2026-10-18')).toEqual([iso(18, 1, 1), iso(18, 7, 12), 'estimada']);
    // Y la marca queda guardada: al volver a abrir, tampoco.
    await a.esperar();
    const otra = almacenCon(() => ahora, repositorio);
    await otra.iniciar();
    expect(otra.estado().suenoRehecho).toBe(true);
    expect(horas(otra, '2026-10-20')).toEqual([iso(20, 0, 45), iso(20, 7, 30), 'estimada']);
  });

  it('con sus señales (los últimos seis días), la estima de nuevo: apagar la alarma a las 7:30 y seguir durmiendo ya no corta la mañana', async () => {
    const quieto = { quieto: true, caminando: false, corriendo: false, auto: false, bici: false, confianza: 2 as const };
    const en = (dia: number, hora: number, minuto: number, que: Partial<Movimiento>): Movimiento => ({ ...quieto, en: el(dia, hora, minuto).getTime(), ...que });
    // Caminó hasta las 00:30, apagó la alarma a las 7:30 (el teléfono se movió un momento) y se levantó a las 8:30.
    mockMovimiento = [
      en(21, 23, 50, { quieto: false, caminando: true }), en(22, 0, 30, {}),
      en(22, 7, 30, { quieto: false }), en(22, 7, 31, {}),
      en(22, 8, 30, { quieto: false, caminando: true }), en(22, 9, 30, {}),
    ];
    const ahora = el(22, 12);
    // Estimada, o aceptada con «Sí» tal como Moss la propuso: las dos se estiman de nuevo y quedan estimadas.
    for (const origen of ['estimada', 'confirmada'] as const) {
      const a = almacenCon(() => ahora);
      await a.iniciar();
      a.ponerHoraDeLaNoche('2026-10-22', deAntes(22, origen));
      await rehacerLasNoches(a, ahora);
      expect(horas(a, '2026-10-22')).toEqual([iso(22, 0, 45), iso(22, 8, 30), 'estimada']);
      expect(a.estado().noches.get('2026-10-22')!.hora!.estimada!.quieto).toEqual({ desde: iso(22, 0, 30), hasta: iso(22, 8, 30) });
    }
    // La que corregiste a mano no se estima de nuevo, aunque estén sus señales.
    const a = almacenCon(() => ahora);
    await a.iniciar();
    a.ponerHoraDeLaNoche('2026-10-22', { ...deAntes(22, 'corregida'), dormirse: iso(22, 1, 30), despertar: iso(22, 7, 40) });
    await rehacerLasNoches(a, ahora);
    expect(horas(a, '2026-10-22')).toEqual([iso(22, 1, 30), iso(22, 7, 40), 'corregida']);
    mockMovimiento = [];
  });

  it('cambiar el margen vuelve a armar las noches estimadas, y lo elegido antes vale como el más cercano de los de ahora', async () => {
    mockMovimiento = [];
    const ahora = el(22, 9);
    const a = almacenCon(() => ahora);
    await a.iniciar();
    a.ponerHoraDeLaNoche('2026-10-20', deAntes(20));
    a.ponerHoraDeLaNoche('2026-10-19', deAntes(19, 'confirmada'));
    a.ponerLatencia(45);
    expect(horas(a, '2026-10-20')).toEqual([iso(20, 1, 15), iso(20, 7, 30), 'estimada']);
    // Cambiar el margen no toca lo que aceptaste con «Sí»: eso lo rehace solo, una vez, la regla nueva al llegar.
    expect(horas(a, '2026-10-19')).toEqual([iso(19, 1, 1), iso(19, 7, 12), 'confirmada']);
    a.ponerLatencia(null);
    expect(horas(a, '2026-10-20')).toEqual([iso(20, 0, 45), iso(20, 7, 30), 'estimada']);
    // Lo de «Tardo en dormirme» de antes: 5, 10, 20 y 90 minutos.
    expect([5, 10, 20, 90, 30, 0].map((minutos) => {
      a.ponerLatencia(minutos);
      return a.estado().latencia;
    })).toEqual([0, 15, 15, 60, 30, 0]);
  });
});
