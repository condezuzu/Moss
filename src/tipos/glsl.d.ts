// Los .glsl llegan como texto (metro.config.js + herramientas/transformador-glsl.js).
declare module '*.glsl' {
  const fuente: string;
  export default fuente;
}
