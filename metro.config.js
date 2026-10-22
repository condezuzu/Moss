// Metro con los shaders del cielo: un .glsl se importa como texto. Son los mismos archivos que
// lee la galería, así que la app y la galería dibujan con el mismo código.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('glsl');
// La base de alimentos va en la app como un archivo más (src/comida/base.ts).
config.resolver.assetExts.push('db');
config.transformer.babelTransformerPath = require.resolve('./herramientas/transformador-glsl.js');

module.exports = config;
