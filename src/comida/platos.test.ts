import { describe, expect, it } from '@jest/globals';

import { porcionesDePlato } from './platos';

const GUISO = { chico: 200, mediano: 300, grande: 450 };
const ENSALADA = { chico: 75, mediano: 150, grande: 250 };
const MILANESA = { chico: 120, mediano: 160, grande: 240 };

describe('los platos por su nombre (D36)', () => {
  it('el plato es la primera palabra entera, no un pedazo del nombre', () => {
    const noSonPlatos = [
      'Crema de leche', 'Crema de avellanas', 'Pasta de maní', 'Pastafrola', 'Galletas de arroz', 'Leche de arroz', 'Arroz con leche', 'Arroz inflado',
      'Sándwich de milanesa', 'Milanesa al pan', 'Carne para guiso', 'Cubito de caldo', 'Masa de pizza', 'Tapas de empanada', 'Bife con ensalada',
    ];
    expect(noSonPlatos.filter((n) => porcionesDePlato(n))).toEqual([]);
    expect(porcionesDePlato('Guiso de lentejas')).toEqual(GUISO);
    expect(porcionesDePlato('Crema de calabaza')).toEqual(GUISO);
    expect(porcionesDePlato('Sopa de verduras')).toEqual(GUISO);
    expect(porcionesDePlato('Ñoquis con tuco')).toEqual(GUISO);
    // «Ensalada de arroz con atún» es una ensalada, no un plato de arroz.
    expect(porcionesDePlato('Ensalada de arroz con atún')).toEqual(ENSALADA);
  });

  it('una milanesa sola; al pan, con guarnición o a la napolitana va con su porción', () => {
    expect(porcionesDePlato('Milanesa de pollo')).toEqual(MILANESA);
    expect(['Milanesa con puré', 'Milanesa de pollo con papas fritas', 'Milanesa a la napolitana', 'Milanesa de pollo al pan'].filter((n) => porcionesDePlato(n))).toEqual([]);
  });

  it('lo instantáneo va por el paquete, no por el plato', () => {
    expect(porcionesDePlato('Fideos instantáneos')).toBeNull();
    expect(porcionesDePlato('Puré de papas instantáneo')).toBeNull();
    expect(porcionesDePlato('Puré de papas')).toEqual({ chico: 125, mediano: 200, grande: 300 });
  });

  it('lo dicho en singular también: «canelón», «macarrón», «tirabuzón», «raviol»', () => {
    expect(['canelón', 'macarrón', 'tirabuzón', 'raviol', 'guisos'].map((n) => porcionesDePlato(n))).toEqual([GUISO, GUISO, GUISO, GUISO, GUISO]);
  });
});
