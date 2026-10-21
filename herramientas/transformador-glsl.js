// Transformador de Metro: un .glsl pasa a ser un módulo que exporta su texto; todo lo demás va
// al transformador de Expo sin cambios.
const expo = require('@expo/metro-config/babel-transformer');

module.exports = {
  ...expo,
  transform(parametros) {
    if (parametros.filename.endsWith('.glsl')) {
      return expo.transform({ ...parametros, src: `module.exports = ${JSON.stringify(parametros.src)};` });
    }
    return expo.transform(parametros);
  },
};
