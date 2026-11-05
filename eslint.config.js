// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Las simulaciones del estudio de la evidencia (spec/estudio) son cuentas sueltas, no código de la app.
    ignores: ['dist/*', 'galeria/dist/*', 'capturas/*', 'spec/**'],
  },
]);
