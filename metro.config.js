// Metro con los shaders del cielo: un .glsl se importa como texto. Son los mismos archivos que
// lee la galería, así que la app y la galería dibujan con el mismo código.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('glsl');
config.transformer.babelTransformerPath = require.resolve('./herramientas/transformador-glsl.js');

module.exports = config;
