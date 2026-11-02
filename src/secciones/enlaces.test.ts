import { describe, expect, it } from '@jest/globals';

import { redirectSystemPath } from '../app/+native-intent';
import { enlaceASeccion, enlaceDeAnotar, leerEnlace } from './enlaces';

describe('los enlaces de los widgets', () => {
  it('llevan a su sección, con la URL o con el camino', () => {
    expect(leerEnlace('moss://habitos')).toEqual({ seccion: 'habitos' });
    expect(leerEnlace('moss:///sueno')).toEqual({ seccion: 'sueno' });
    expect(leerEnlace('/comida')).toEqual({ seccion: 'comida' });
    expect(leerEnlace(enlaceASeccion('inicio'))).toEqual({ seccion: 'inicio' });
  });

  it('anotar lleva la comida y por dónde, y lo que no conoce se ignora', () => {
    expect(leerEnlace(enlaceDeAnotar())).toEqual({ anotar: {} });
    expect(leerEnlace(enlaceDeAnotar({ comida: 'cena', via: 'decir' }))).toEqual({ anotar: { comida: 'cena', via: 'decir' } });
    expect(leerEnlace('moss://anotar?comida=pizza&via=magia')).toEqual({ anotar: {} });
  });

  it('lo demás no es de estos: la raíz y lo compartido siguen como siempre', () => {
    expect(leerEnlace('moss://')).toBeNull();
    expect(leerEnlace('moss://compartido?d=abc')).toBeNull();
    expect(leerEnlace('https://moss.uy/algo/mas')).toBeNull();
  });

  it('Expo Router se queda en las secciones con los enlaces de los widgets', () => {
    expect(redirectSystemPath({ path: 'moss://habitos', initial: true })).toBe('/');
    expect(redirectSystemPath({ path: '/anotar?comida=cena', initial: false })).toBe('/');
    expect(redirectSystemPath({ path: 'moss://compartido?d=abc', initial: false })).toBe('moss://compartido?d=abc');
  });
});
