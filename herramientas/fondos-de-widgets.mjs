// Los fondos de los widgets: el cielo de la app, sacado de sus mismos shaders con CanvasKit y guardado
// como imagen (un widget no puede correr shaders). Una noche con estrellas y la misma noche con la
// aurora del día completo, a @3× de un widget grande: los otros tamaños recortan el medio.
// Uso: node herramientas/fondos-de-widgets.mjs   → assets/widgets/cielo-noche.jpg y cielo-aurora.jpg
// Tarda varios minutos: dibuja en CPU. No es un script de package.json porque esos cuentan para la huella.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fuenteCielo, fuenteFondo } from '../src/cielo/sksl.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
const ck = await CanvasKitInit({ locateFile: (archivo) => join(raiz, 'node_modules/canvaskit-wasm/bin/full', archivo) });

const leer = (nombre) => readFileSync(join(raiz, 'src/cielo/shaders', nombre), 'utf8');
const glsl = { comun: leer('comun.glsl'), fondo: leer('fondo.glsl'), aurora: leer('aurora.glsl'), vivo: leer('vivo.glsl') };
const efectoFondo = ck.RuntimeEffect.Make(fuenteFondo(glsl));
const efectoCielo = ck.RuntimeEffect.Make(fuenteCielo(glsl));

function uniformes(efecto, valores) {
  const arreglo = new Float32Array(efecto.getUniformFloatCount());
  for (let i = 0; i < efecto.getUniformCount(); i++) {
    const nombre = efecto.getUniformName(i);
    if (!(nombre in valores)) throw new Error(`Falta el uniform ${nombre}`);
    [].concat(valores[nombre]).forEach((v, k) => { arreglo[efecto.getUniform(i).slot + k] = v; });
  }
  return arreglo;
}

// Un widget grande de 338 × 354 puntos a @3×, con la misma escala que el cielo de un teléfono de 852
// puntos: las estrellas tienen el tamaño que tienen en la app.
const ANCHO = 1014;
const ALTO = 1062;
const ESCALA = 852 * 3;
// La cámara un poco más abajo que en Hábitos: la base de la aurora queda en el tercio de abajo del widget.
const CAMARA = -0.1;
const RIQUEZA = 0.8;
const HORIZONTE = -0.36;

const w = ANCHO / ESCALA;
const h = ALTO / ESCALA;
const mundoMin = [-w / 2 - 0.02, CAMARA - h / 2 - 0.02];
const mundoTam = [w + 0.04, h + 0.04];
const tex = [Math.ceil(mundoTam[0] * ESCALA), Math.ceil(mundoTam[1] * ESCALA)];

// El cielo fijo se dibuja una vez: las dos imágenes tienen las mismas estrellas, así el cambio es solo
// la aurora que sube.
const superficieFondo = ck.MakeSurface(tex[0], tex[1]);
const pinturaFondo = new ck.Paint();
pinturaFondo.setShader(efectoFondo.makeShader(uniformes(efectoFondo, {
  uRes: tex, uMundoMin: mundoMin, uMundoTam: mundoTam, uPxPorUnidad: ESCALA,
  uHorizonte: HORIZONTE, uOctavas: 6, uCapas: 3, uSemilla: 7, uRiqueza: RIQUEZA, uVia: 0,
})));
superficieFondo.getCanvas().drawRect(ck.XYWHRect(0, 0, tex[0], tex[1]), pinturaFondo);
const imagenFondo = superficieFondo.makeImageSnapshot();

function cielo(intensidad, oleada) {
  const superficie = ck.MakeSurface(ANCHO, ALTO);
  const hijo = imagenFondo.makeShaderOptions(ck.TileMode.Clamp, ck.TileMode.Clamp, ck.FilterMode.Linear, ck.MipmapMode.None);
  const pintura = new ck.Paint();
  pintura.setShader(efectoCielo.makeShaderWithChildren(uniformes(efectoCielo, {
    uLienzo: [ANCHO, ALTO], uEscala: ESCALA, uDpr: 1, uCamY: CAMARA, uMundoMin: mundoMin, uMundoTam: mundoTam, uTex: tex,
    uHorizonte: HORIZONTE, uTiempo: 12, uTiempoAurora: 80, uIntensidad: intensidad, uOleada: oleada, uCortinas: 3, uParalajeAurora: 1,
    uDensidad: 0.54, uOnda: [0, 0, 0, 0], uFugaz: [5, 5, 0, -1], uFugazEstela: [0, 0, 0, 0], uAparicion: 1, uRiqueza: RIQUEZA,
  }), [hijo]));
  superficie.getCanvas().drawRect(ck.XYWHRect(0, 0, ANCHO, ALTO), pintura);
  return superficie.makeImageSnapshot().encodeToBytes(ck.ImageFormat.JPEG, 84);
}

const carpeta = join(raiz, 'assets/widgets');
mkdirSync(carpeta, { recursive: true });
for (const [nombre, intensidad, oleada] of [['cielo-noche', 0, 0], ['cielo-aurora', 1, 0.6]]) {
  const bytes = cielo(intensidad, oleada);
  writeFileSync(join(carpeta, `${nombre}.jpg`), bytes);
  console.log(`${nombre}.jpg: ${ANCHO}×${ALTO}, ${Math.round(bytes.length / 1024)} KB`);
}
