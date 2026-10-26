import { describe, expect, it } from '@jest/globals';

import { crearBuzon, textoDeBusqueda, type Carta, type Correo } from './buzon';

function enMemoria(inicial: string | null = null) {
  let texto = inicial;
  return { leer: async () => texto, escribir: async (t: string) => { texto = t; }, get texto() { return texto; } };
}

const busqueda = (texto: string, dia = '2026-10-22'): Carta => ({ tipo: 'busqueda', texto, idioma: 'es', region: 'UY', dia });
const reporte: Carta = { tipo: 'reporte', alimento: -5001, codigo: null, nombre: 'Arroz con leche', motivo: 'valores', nota: null, version: 'abc' };

describe('el buzón', () => {
  it('manda lo que espera, en orden, y lo saca al mandarlo', async () => {
    const enviadas: Carta[] = [];
    const guardado = enMemoria();
    const buzon = crearBuzon(guardado, () => ({ enviar: async (c) => { enviadas.push(c); } }));
    await buzon.echar(busqueda('chivito al pan'));
    await buzon.echar(reporte);
    await buzon.enviar();
    expect(enviadas).toEqual([busqueda('chivito al pan'), reporte]);
    expect(await buzon.pendientes()).toBe(0);
  });

  it('sin sesión espera; sin conexión, para al primer error y sigue la próxima vez', async () => {
    let conexion = false;
    const enviadas: Carta[] = [];
    const correo: Correo = { enviar: async (c) => { if (!conexion) throw new Error('sin conexión'); enviadas.push(c); } };
    let sesion = false;
    const buzon = crearBuzon(enMemoria(), () => (sesion ? correo : null));
    await buzon.echar(busqueda('pascualina'));
    await buzon.enviar();
    expect(await buzon.pendientes()).toBe(1);
    sesion = true;
    await buzon.enviar();
    expect(await buzon.pendientes()).toBe(1);
    conexion = true;
    await buzon.enviar();
    expect(enviadas).toHaveLength(1);
    expect(await buzon.pendientes()).toBe(0);
  });

  it('lo que espera queda guardado: sobrevive a cerrar la app', async () => {
    const guardado = enMemoria();
    await crearBuzon(guardado, () => null).echar(reporte);
    const otra = crearBuzon(guardado, () => null);
    expect(await otra.pendientes()).toBe(1);
  });

  it('la misma búsqueda del mismo día cuenta una vez por teléfono, aunque ya haya salido', async () => {
    const enviadas: Carta[] = [];
    const buzon = crearBuzon(enMemoria(), () => ({ enviar: async (c) => { enviadas.push(c); } }));
    await buzon.echar(busqueda('fainá'));
    await buzon.enviar();
    await buzon.echar(busqueda('fainá'));
    await buzon.echar(busqueda('fainá', '2026-10-23'));
    await buzon.enviar();
    expect(enviadas.map((c) => (c.tipo === 'busqueda' ? c.dia : ''))).toEqual(['2026-10-22', '2026-10-23']);
  });

  it('nunca guarda más de 200 cartas: sin conexión por meses, se van las más viejas', async () => {
    const buzon = crearBuzon(enMemoria(), () => null);
    for (let i = 0; i < 205; i++) await buzon.echar({ ...reporte, nota: String(i) });
    expect(await buzon.pendientes()).toBe(200);
  });

  it('lo guardado roto no rompe nada', async () => {
    const buzon = crearBuzon(enMemoria('{no es json'), () => null);
    expect(await buzon.pendientes()).toBe(0);
  });
});

describe('descartar y vaciar', () => {
  it('al dejar de mandar las búsquedas, las que esperaban no salen; los reportes sí', async () => {
    const enviadas: Carta[] = [];
    let sesion = false;
    const buzon = crearBuzon(enMemoria(), () => (sesion ? { enviar: async (c) => { enviadas.push(c); } } : null));
    await buzon.echar(busqueda('chivito al pan'));
    await buzon.echar(reporte);
    await buzon.descartar('busqueda');
    sesion = true;
    await buzon.enviar();
    expect(enviadas).toEqual([reporte]);
  });

  it('lo que se descarta mientras sale una carta no hace salir otra por error', async () => {
    let soltar: () => void = () => {};
    const enviadas: Carta[] = [];
    const buzon = crearBuzon(enMemoria(), () => ({ enviar: async (c) => { await new Promise<void>((listo) => (soltar = listo)); enviadas.push(c); } }));
    await buzon.echar(reporte);
    await buzon.echar(busqueda('fainá'));
    await new Promise((listo) => setTimeout(listo, 0));
    await buzon.descartar('busqueda');
    await buzon.echar(busqueda('pascualina'));
    soltar();
    await new Promise((listo) => setTimeout(listo, 0));
    soltar();
    await buzon.enviar();
    expect(enviadas).toEqual([reporte, busqueda('pascualina')]);
    expect(await buzon.pendientes()).toBe(0);
  });

  it('vaciar olvida lo que espera y lo contado', async () => {
    const guardado = enMemoria();
    const buzon = crearBuzon(guardado, () => null);
    await buzon.echar(busqueda('chivito al pan'));
    await buzon.vaciar();
    expect(await buzon.pendientes()).toBe(0);
    await buzon.echar(busqueda('chivito al pan'));
    expect(await buzon.pendientes()).toBe(1);
  });
});

describe('lo que se buscó', () => {
  it('va en minúsculas y sin espacios de más; una letra sola no cuenta', () => {
    expect(textoDeBusqueda('  Chivito   AL Pan ')).toBe('chivito al pan');
    expect(textoDeBusqueda(' a ')).toBeNull();
    expect(textoDeBusqueda('x'.repeat(80))).toHaveLength(60);
  });
});
