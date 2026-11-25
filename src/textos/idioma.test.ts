// El idioma de Moss es el primero de la lista del teléfono que Moss tiene, como hace iOS con lo nativo.

import { expect, jest, test } from '@jest/globals';

function idiomaCon(etiquetas: string[]) {
  jest.resetModules();
  jest.doMock('expo-localization', () => ({ getLocales: () => etiquetas.map((languageTag) => ({ languageTag })) }));
  // El idioma se lee una vez: cada lista necesita el módulo de nuevo.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('./index') as typeof import('./index')).idioma();
}

test('con catalán o portugués primero y español después, español', () => {
  expect(idiomaCon(['ca-ES', 'es-ES', 'en-US'])).toBe('es');
  expect(idiomaCon(['pt-BR', 'es-419', 'en-US'])).toBe('es');
});

test('con inglés antes que español, inglés', () => {
  expect(idiomaCon(['fr-FR', 'en-GB', 'es-ES'])).toBe('en');
});

test('sin español ni inglés, inglés', () => {
  expect(idiomaCon(['pt-BR'])).toBe('en');
  expect(idiomaCon([])).toBe('en');
});
