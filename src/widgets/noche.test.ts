import { describe, expect, it } from '@jest/globals';

import type { Estado } from '../almacen/almacen';
import { sumarDias, type ClaveDia } from '../dominio/fechas';
import { instanteDe } from '../dominio/sinReloj';
import type { Noche, NochePropia, OrigenDeNoche } from '../dominio/sueno';
import { confirmacionesDeLaLinea, decidir, lineaDeLaNoche, nocheDeAhora, nocheEsperada, reloj, type ConfirmacionDelWidget } from './noche';

// Montevideo, todo el año a −3: los minutos se cuentan desde las 18 del día anterior.
const ZONA = -180;
const TEXTOS = {
  anoche: 'Anoche', si: 'Sí', fueAsi: '¿Fue así?', confirmada: 'Confirmada', seVeEnMoss: 'Se ve al abrir Moss', seAnotaEnMoss: 'Anótala en Moss',
  horas: '{desde} → {hasta}', duracion: '{h} h {m} min',
};
const iso = (clave: ClaveDia, minutos: number) => new Date(instanteDe(clave, ZONA, minutos)).toISOString();

/** Una noche de Moss: de 23:40 (340) a 07:10 (790) si no se dice otra cosa. */
function propia(fecha: ClaveDia, origen: OrigenDeNoche = 'confirmada', dormirse = 340, despertar = 790): NochePropia {
  return {
    fecha, actualizado: '2026-10-01T00:00:00.000Z',
    hora: { dormirse: iso(fecha, dormirse), despertar: iso(fecha, despertar), origen, confianza: 'media', estimada: { dormirse: iso(fecha, dormirse), despertar: iso(fecha, despertar) } },
  };
}

/** Las cinco noches confirmadas antes de `hoy`, y la de hoy si se pasa. */
function estado(hoy: ClaveDia, deHoy?: NochePropia, salud: Estado['salud'] = null): Pick<Estado, 'hoy' | 'noches' | 'salud' | 'metas'> {
  const noches = new Map<ClaveDia, NochePropia>();
  for (let k = 1; k <= 5; k++) noches.set(sumarDias(hoy, -k), propia(sumarDias(hoy, -k)));
  if (deHoy) noches.set(hoy, deHoy);
  return { hoy, noches, salud, metas: [] };
}

const armar = (e: Parameters<typeof lineaDeLaNoche>[0], ahora: Date, extra: Partial<Parameters<typeof lineaDeLaNoche>[1]> = {}) =>
  lineaDeLaNoche(e, { ahora, zona: ZONA, textos: TEXTOS, url: 'moss://', ...extra });

describe('la línea de tiempo del widget de la noche', () => {
  it('con la noche estimada, la propone con «Sí»; y deja armada la de mañana desde las 4', () => {
    const ahora = new Date(2026, 9, 21, 9, 0);
    const l = armar(estado('2026-10-21', propia('2026-10-21', 'estimada', 352, 792)), ahora);
    expect(l).toHaveLength(3);
    expect(l[0].date).toBe(ahora);
    expect(l[0].props).toMatchObject({ clave: '2026-10-21', horas: '23:52 → 07:12', pregunta: true, nota: '¿Fue así?', confirmada: 0, hecha: false, dormirse: 352, despertar: 792 });
    // La de mañana: lo de siempre, a las 4, para verla al despertar sin abrir Moss.
    expect([l[1].date.getDate(), l[1].date.getHours()]).toEqual([22, 4]);
    expect(l[1].props).toMatchObject({ clave: '2026-10-22', horas: '23:40 → 07:10', pregunta: true, notaConfirmada: 'Confirmada · 7 h 30 min' });
    // Si Moss no se abre en dos días, el widget no se queda con una noche vieja.
    expect([l[2].date.getDate(), l[2].date.getHours()]).toEqual([23, 4]);
    expect(l[2].props).toMatchObject({ clave: '2026-10-23', horas: '', pregunta: false, nota: 'Se ve al abrir Moss' });
  });

  it('hasta las 4 sigue siendo «anoche» la de ayer', () => {
    expect(nocheDeAhora('2026-10-22', new Date(2026, 9, 22, 2, 30))).toBe('2026-10-21');
    expect(nocheDeAhora('2026-10-22', new Date(2026, 9, 22, 4, 0))).toBe('2026-10-22');
    const l = armar(estado('2026-10-22'), new Date(2026, 9, 22, 2, 30));
    expect(l[0].props).toMatchObject({ clave: '2026-10-21', hecha: true, pregunta: false });
    expect(l[1].props.clave).toBe('2026-10-22');
  });

  it('sin estimar todavía, propone lo de siempre; y con el despertador, despierta a su hora', () => {
    const e = estado('2026-10-21');
    expect(nocheEsperada([], '2026-10-21')).toBeNull();
    const l = armar(e, new Date(2026, 9, 21, 7, 0), { despertador: 780 });
    expect(l[0].props).toMatchObject({ horas: '23:40 → 07:10', pregunta: true });
    expect(l[1].props).toMatchObject({ horas: '23:40 → 07:00', despertar: 780, pregunta: true });
  });

  it('la mañana de la semana en que Moss pregunta sin proponer, el widget no propone', () => {
    // El sábado 24 de octubre de 2026 es esa mañana (quePreguntar).
    const l = armar(estado('2026-10-23', propia('2026-10-23', 'confirmada')), new Date(2026, 9, 23, 20, 0));
    expect(l[1].props).toMatchObject({ clave: '2026-10-24', horas: '', pregunta: false, nota: 'Anótala en Moss' });
  });

  it('con un reloj muestra lo medido, sin botón, y no propone la de mañana', () => {
    const delReloj = { clave: '2026-10-21', fuente: { id: 'w', nombre: 'Apple Watch', tipo: 'reloj' }, dormirse: 341, despertar: 793, confianza: { horario: 'alta', duracion: 'alta' } } as unknown as Noche;
    const salud = { noches: [delReloj] } as unknown as Estado['salud'];
    const l = armar(estado('2026-10-21', undefined, salud), new Date(2026, 9, 21, 9, 0));
    expect(l[0].props).toMatchObject({ horas: '23:41 → 07:13', pregunta: false, hecha: false, nota: '7 h 32 min' });
    expect(l[1].props).toMatchObject({ horas: '', pregunta: false });
  });

  it('un «Sí» que espera la estimación sigue a la vista con sus horas', () => {
    const esperando: ConfirmacionDelWidget = { clave: '2026-10-21', dormirse: 340, despertar: 790, en: 123 };
    const l = armar(estado('2026-10-21'), new Date(2026, 9, 21, 7, 30), { esperando });
    expect(l[0].props).toMatchObject({ confirmada: 123, dormirse: 340, despertar: 790, horas: '23:40 → 07:10' });
  });

  it('las horas, de 0 a 23', () => {
    expect([reloj(340), reloj(790), reloj(-30), reloj(360)]).toEqual(['23:40', '07:10', '17:30', '00:00']);
  });
});

describe('el «Sí» del widget al abrir Moss', () => {
  const conf = (dormirse = 340, despertar = 790, clave = '2026-10-21'): ConfirmacionDelWidget => ({ clave, dormirse, despertar, en: 1 });

  it('confirma la estimada si coincide (20 minutos de cada lado); si no, Moss pregunta como siempre', () => {
    const estimada = propia('2026-10-21', 'estimada', 352, 792);
    expect(decidir(conf(), estimada, '2026-10-21', ZONA)).toBe('aplicar');
    expect(decidir(conf(335, 805), estimada, '2026-10-21', ZONA)).toBe('aplicar');
    expect(decidir(conf(300), estimada, '2026-10-21', ZONA)).toBe('olvidar');
    expect(decidir(conf(340, 830), estimada, '2026-10-21', ZONA)).toBe('olvidar');
  });

  it('espera si Moss todavía no estimó la de hoy, y se olvida de lo ya contestado o viejo', () => {
    expect(decidir(conf(), undefined, '2026-10-21', ZONA)).toBe('esperar');
    expect(decidir(conf(), propia('2026-10-21', 'corregida'), '2026-10-21', ZONA)).toBe('olvidar');
    expect(decidir(conf(340, 790, '2026-10-20'), undefined, '2026-10-21', ZONA)).toBe('olvidar');
    expect(decidir(conf(340, 790, '2026-10-20'), propia('2026-10-20', 'estimada'), '2026-10-21', ZONA)).toBe('aplicar');
    expect(decidir(conf(340, 790, '2026-10-18'), propia('2026-10-18', 'estimada'), '2026-10-21', ZONA)).toBe('olvidar');
  });

  it('lee de la línea solo los «Sí» tocados, el último de cada noche', () => {
    const base = { clave: '2026-10-21', dormirse: 340, despertar: 790, hecha: false };
    const leidas = confirmacionesDeLaLinea([
      { props: { ...base, confirmada: 0 } },
      { props: { ...base, confirmada: 5 } },
      { props: { ...base, confirmada: 9, dormirse: 345 } },
      { props: { ...base, clave: '2026-10-20', confirmada: 7, hecha: true } },
      { props: null },
    ]);
    expect(leidas).toEqual([{ clave: '2026-10-21', dormirse: 345, despertar: 790, en: 9 }]);
  });
});
