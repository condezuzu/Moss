// El polvo de Ascent (el cuerpo del rango 1, de fondo en su sección) como imágenes, sacado de la galería tal cual
// (galeria/src/ascent.js: gasDelPolvo y granosDelPolvo): el gas, pintado con ruido por píxel, y los granos en sus tres
// grupos. En el teléfono, pintar el gas en JavaScript tardaba segundos; así se pinta una sola vez, acá.
// Uso: node herramientas/polvo-de-ascent.mjs   → assets/ascent/polvo-gas.png y polvo-granos-0.png, -1 y -2
// No es un script de package.json porque esos cuentan para la huella.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
const ck = await CanvasKitInit({ locateFile: (archivo) => join(raiz, 'node_modules/canvaskit-wasm/bin/full', archivo) });

// Lo de la galería que hace el polvo, sin tocarlo: de NUBE a nubeDelPolvo, con un lienzo de mentira que guarda los píxeles.
const fuente = readFileSync(join(raiz, 'galeria/src/ascent.js'), 'utf8');
const trozo = (desde, hasta) => fuente.slice(fuente.indexOf(desde), fuente.indexOf(hasta));
let pixeles = null;
const document = {
  createElement: () => ({
    getContext: () => ({
      createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (img) => { pixeles = img; },
    }),
    toDataURL: () => '',
  }),
};
const polvo = new Function('document', `
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  ${trozo('  const NUBE = {', '  // El borde del planeta')}
  ${trozo('  const azar = (semilla)', '  /** `n` puntos en la parte')}
  ${trozo('  const PALETA_DEL_POLVO', '  function nubeDelPolvo()')}
  return { NUBE, PALETA_DEL_POLVO, ESTRELLA_DEL_POLVO, gasDelPolvo, granosDelPolvo };
`)(document);

const ESCALA = 2;
const salida = join(raiz, 'assets/ascent');
mkdirSync(salida, { recursive: true });
const png = (imagen, nombre) => writeFileSync(join(salida, nombre), imagen.encodeToBytes());

polvo.gasDelPolvo();
png(ck.MakeImage({ width: pixeles.width, height: pixeles.height, alphaType: ck.AlphaType.Unpremul, colorType: ck.ColorType.RGBA_8888, colorSpace: ck.ColorSpace.SRGB }, pixeles.data, pixeles.width * 4), 'polvo-gas.png');

const hex = (h, a) => ck.Color(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), a);
const num = (c, k) => Number(c.match(new RegExp(`${k}="([^"]+)"`))[1]);
polvo.granosDelPolvo().forEach((grupo, i) => {
  const superficie = ck.MakeSurface(polvo.NUBE.ancho * ESCALA, polvo.NUBE.alto * ESCALA);
  const lienzo = superficie.getCanvas();
  lienzo.scale(ESCALA, ESCALA);
  for (const circulo of grupo.match(/<circle[^>]*\/>/g)) {
    const [x, y, r, op] = ['cx', 'cy', 'r', 'opacity'].map((k) => num(circulo, k));
    const pintura = new ck.Paint();
    pintura.setAntiAlias(true);
    const halo = circulo.match(/url\(#asGrano(\d)\)/);
    if (halo) {
      const c = polvo.PALETA_DEL_POLVO[Number(halo[1])];
      pintura.setShader(ck.Shader.MakeRadialGradient([x, y], r, [hex(c, 0.9), hex(c, 0.25), hex(c, 0)], [0, 0.35, 1], ck.TileMode.Clamp));
      pintura.setAlphaf(op);
    } else {
      const [rr, g, b] = circulo.match(/fill="rgb\(([^)]+)\)"/)[1].split(',').map(Number);
      pintura.setColor(ck.Color(rr, g, b, op));
    }
    lienzo.drawCircle(x, y, r, pintura);
    pintura.delete();
  }
  png(superficie.makeImageSnapshot(), `polvo-granos-${i}.png`);
  superficie.delete();
});
console.log(`Listo: ${salida} (la estrella del medio está en ${polvo.ESTRELLA_DEL_POLVO.x}, ${polvo.ESTRELLA_DEL_POLVO.y} de ${polvo.NUBE.ancho} × ${polvo.NUBE.alto})`);
