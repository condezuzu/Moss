// La conexión con Ascent (spec/ascent.md). Hasta que funcione de verdad, la v1 no muestra nada de
// Ascent: ni la sección arriba de Hábitos, ni su flecha, ni su fila en Perfil. Se prende con
// EXPO_PUBLIC_CON_ASCENT=1 (en las variables de EAS o en .env), sin tocar el código.

export const CONEXION_CON_ASCENT = process.env.EXPO_PUBLIC_CON_ASCENT === '1';
