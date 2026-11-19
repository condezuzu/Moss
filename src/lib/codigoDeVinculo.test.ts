import { describe, expect, it } from '@jest/globals';

import { codigoVencido, confirmarElVinculo, CONFIRMAR_HASTA_MS, enlaceDeVincular, esCodigoDeVinculo } from './codigoDeVinculo';

const CODIGO = 'Ab3_-9xYz0Ab3_-9xYz0Ab3_-9xYz0Ab3_-9xYz0Abc';

describe('el código de un uso para vincular', () => {
  it('es base64url de 32 bytes, sin relleno', () => {
    expect(CODIGO).toHaveLength(43);
    expect(esCodigoDeVinculo(CODIGO)).toBe(true);
    expect(esCodigoDeVinculo(CODIGO + '=')).toBe(false);
    expect(esCodigoDeVinculo(CODIGO.slice(1))).toBe(false);
    expect(esCodigoDeVinculo(CODIGO.replace('_', '/'))).toBe(false);
    expect(esCodigoDeVinculo(null)).toBe(false);
  });

  it('se abre en el enlace de Ascent', () => {
    expect(enlaceDeVincular(CODIGO)).toBe(`https://ascent-blush-seven.vercel.app/vincular/${CODIGO}`);
  });
});

describe('la confirmación después de vincular con el código', () => {
  const pedido = 1_000_000;
  const base = { pedido, ahora: pedido + 60_000, antes: false, vinculada: true };

  it('se pregunta al quedar vinculada dentro de los 10 minutos', () => {
    expect(confirmarElVinculo(base)).toBe(true);
    expect(confirmarElVinculo({ ...base, ahora: pedido + CONFIRMAR_HASTA_MS })).toBe(true);
  });

  it('no, sin código pedido, pasados los 10 minutos o con el reloj para atrás', () => {
    expect(confirmarElVinculo({ ...base, pedido: null })).toBe(false);
    expect(confirmarElVinculo({ ...base, ahora: pedido + CONFIRMAR_HASTA_MS + 1 })).toBe(false);
    expect(confirmarElVinculo({ ...base, ahora: pedido - 1 })).toBe(false);
  });

  it('no, si ya estaba vinculada o si sigue sin vincular', () => {
    expect(confirmarElVinculo({ ...base, antes: true })).toBe(false);
    expect(confirmarElVinculo({ ...base, vinculada: false })).toBe(false);
  });

  it('el código deja de esperarse a los 10 minutos', () => {
    expect(codigoVencido(pedido, pedido + CONFIRMAR_HASTA_MS)).toBe(false);
    expect(codigoVencido(pedido, pedido + CONFIRMAR_HASTA_MS + 1)).toBe(true);
    expect(codigoVencido(null, pedido)).toBe(true);
  });
});
