// Compila los shaders de la app con CanvasKit (el mismo compilador SkSL de Skia) y dibuja una
// vista previa en CPU. Es la forma de saber, sin un iPhone, que el GLSL compartido con la galería
// sigue siendo SkSL válido.
// Uso: npm run shaders:verificar   → sale con código 1 si alguno no compila; deja PNG en capturas/shaders.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fuenteCielo, fuenteFondo, fuenteHoja, fuenteMusgo } from '../src/cielo/sksl.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');
const ck = await CanvasKitInit({ locateFile: (archivo) => join(raiz, 'node_modules/canvaskit-wasm/bin/full', archivo) });

const leer = (nombre) => readFileSync(join(raiz, 'src/cielo/shaders', nombre), 'utf8');
const glsl = { comun: leer('comun.glsl'), fondo: leer('fondo.glsl'), aurora: leer('aurora.glsl'), vivo: leer('vivo.glsl') };
const fuentes = { fondo: fuenteFondo(glsl), cielo: fuenteCielo(glsl), musgo: fuenteMusgo(glsl), hoja: fuenteHoja() };

const efectos = {};
let fallas = 0;
for (const [nombre, fuente] of Object.entries(fuentes)) {
  const errores = [];
  const efecto = ck.RuntimeEffect.Make(fuente, (e) => errores.push(e));
  if (!efecto) {
    fallas++;
    console.log(`✗ ${nombre}\n${errores.join('\n')}`);
    continue;
  }
  efectos[nombre] = efecto;
  console.log(`✓ ${nombre} (${efecto.getUniformCount()} uniforms)`);
}
if (fallas) process.exit(1);

// Los uniforms van en un solo arreglo, en el lugar (slot) que dice el efecto: así no dependen
// del orden en que se escriben acá.
function uniformes(efecto, valores) {
  const arreglo = new Float32Array(efecto.getUniformFloatCount());
  for (let i = 0; i < efecto.getUniformCount(); i++) {
    const nombre = efecto.getUniformName(i);
    const info = efecto.getUniform(i);
    if (!(nombre in valores)) throw new Error(`Falta el uniform ${nombre}`);
    [].concat(valores[nombre]).forEach((v, k) => { arreglo[info.slot + k] = v; });
  }
  return arreglo;
}

// Vista previa a la mitad de un iPhone de 393×852 puntos, con la cámara en hoy, para tres riquezas
// del cielo: el primer día (0), la que se aprobó en la galería (0.6) y la plena (1).
const ancho = 196, alto = 426, escala = alto;
const aspecto = ancho / alto;
const mundoMin = [-aspecto / 2 - 0.08, -0.62];
const mundoTam = [aspecto + 0.16, 2.54];
const tex = [Math.ceil(mundoTam[0] * escala), Math.ceil(mundoTam[1] * escala)];

const carpeta = join(raiz, 'capturas/shaders');
mkdirSync(carpeta, { recursive: true });

for (const riqueza of [0, 0.6, 1]) {
  const superficieFondo = ck.MakeSurface(tex[0], tex[1]);
  const pintura = new ck.Paint();
  pintura.setShader(efectos.fondo.makeShader(uniformes(efectos.fondo, {
    uRes: tex, uMundoMin: mundoMin, uMundoTam: mundoTam, uPxPorUnidad: escala,
    uHorizonte: -0.36, uOctavas: 6, uCapas: 3, uSemilla: 7, uRiqueza: riqueza,
  })));
  superficieFondo.getCanvas().drawRect(ck.XYWHRect(0, 0, tex[0], tex[1]), pintura);
  const imagenFondo = superficieFondo.makeImageSnapshot();

  const superficie = ck.MakeSurface(ancho, alto);
  const hijo = imagenFondo.makeShaderOptions(ck.TileMode.Clamp, ck.TileMode.Clamp, ck.FilterMode.Linear, ck.MipmapMode.None);
  const pinturaCielo = new ck.Paint();
  pinturaCielo.setShader(efectos.cielo.makeShaderWithChildren(uniformes(efectos.cielo, {
    uLienzo: [ancho, alto], uEscala: escala, uDpr: 1, uCamY: 0, uMundoMin: mundoMin, uMundoTam: mundoTam, uTex: tex,
    uHorizonte: -0.36, uTiempo: 12, uTiempoAurora: 52, uIntensidad: 1, uOleada: 0, uCortinas: 3, uParalajeAurora: 1.12,
    uDensidad: 0.54, uOnda: [0, 0, 0, 0], uFugaz: [0.05, 0.3, -0.82, -0.57], uFugazEstela: [0.3, 0.22, 0.9, 1], uAparicion: 1,
    uRiqueza: riqueza,
  }), [hijo]));
  superficie.getCanvas().drawRect(ck.XYWHRect(0, 0, ancho, alto), pinturaCielo);

  const sufijo = `-r${Math.round(riqueza * 100)}`;
  writeFileSync(join(carpeta, `fondo${sufijo}.png`), imagenFondo.encodeToBytes());
  writeFileSync(join(carpeta, `cielo${sufijo}.png`), superficie.makeImageSnapshot().encodeToBytes());
}

const celda = 64;
const superficieHoja = ck.MakeSurface(celda * 6, celda);
const pinturaHoja = new ck.Paint();
pinturaHoja.setShader(efectos.hoja.makeShader(uniformes(efectos.hoja, { uCelda: celda })));
superficieHoja.getCanvas().clear(ck.BLACK);
superficieHoja.getCanvas().drawRect(ck.XYWHRect(0, 0, celda * 6, celda), pinturaHoja);
writeFileSync(join(carpeta, 'hoja.png'), superficieHoja.makeImageSnapshot().encodeToBytes());

console.log(`Vistas previas en capturas/shaders (fondo ${tex[0]}×${tex[1]}, cielo ${ancho}×${alto}, riquezas 0, 60 y 100)`);
