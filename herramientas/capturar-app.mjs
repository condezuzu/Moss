// Capturas de la app de verdad (Skia en la web, con CanvasKit) a 393×852 @2×:
// - el cielo de Hábitos, calidad baja y dos riquezas;
// - un toque sobre una estrella, y otra vez el cielo después de recargar (tiene que acordarse);
// - el día completo y tu universo;
// - las secciones: Ascent desde el cielo (y no desde la barra), la flecha, las pestañas, Inicio y el «+»;
// - decir lo que comí, escrito (en la web no hay micrófono), con sus preguntas, y anotarlo;
// - las primeras pantallas de la entrada, en un navegador sin perfil.
// Es lo más cerca del iPhone que se puede llegar desde Windows; el rendimiento real se mide en el
// teléfono. Cada corrida arranca de cero: el navegador es nuevo y los hábitos de ejemplo también,
// con una persona que ya pasó la entrada.
// Uso: npm run web:exportar && npm run web:ver   (en otra terminal)
//      npm run app:capturas

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const salida = process.argv[2] || 'capturas/app';
mkdirSync(salida, { recursive: true });
const URL = process.env.APP_URL || 'http://localhost:4174/';

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const PANTALLA = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, locale: 'es-UY' };
const pagina = await navegador.newPage(PANTALLA);
const errores = [];
// Cada error, en el momento y con la última foto: así se sabe en qué paso pasó.
let ultimaFoto = '(antes de la primera foto)';
const anotarErrores = (p) => {
  const anotar = (texto) => {
    errores.push(texto);
    console.log(`  ! después de «${ultimaFoto}»: ${texto.slice(0, 200)}`);
  };
  p.on('console', (m) => { if (m.type() === 'error') anotar(m.text()); });
  p.on('pageerror', (e) => anotar(String(e)));
};
anotarErrores(pagina);

// Sin perfil aparece la entrada: se guarda uno antes de la primera carga (en src/almacen/abrir.web.ts,
// el mismo formato). Solo si no hay nada, así recargar no borra lo que se tocó.
await pagina.addInitScript(() => {
  if (localStorage.getItem('moss:datos')) return;
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const momento = d.toISOString();
  localStorage.setItem('moss:datos', JSON.stringify({
    perfil: { sexo: 'm', alturaCm: 178, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', nacimiento: d.getFullYear() - 34, actualizado: momento },
    pesos: [{ fecha: hoy, kg: 82, origen: 'manual', momento }],
    metas: [{ desde: hoy, kcal: 2150, proteina: 165, carbohidratos: 215, grasas: 70, gasto: 2650, motivo: 'inicial', momento }],
    // Sin la entrada terminada en este teléfono, la app vuelve a la entrada aunque haya perfil.
    ajustes: { entrada: 'hecha' },
    // Sin reloj: nueve noches que estimó Moss, algunas confirmadas; la de anoche, sin estar segura.
    noches: Array.from({ length: 9 }, (_, i) => {
      const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      const clave = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
      const dormirse = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() - 1, 23, 25 + (i % 3) * 10);
      const despertar = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 7, 5 + (i % 4) * 6);
      const origen = i > 0 && i % 3 === 0 ? 'confirmada' : 'estimada';
      return { fecha: clave, hora: { dormirse: dormirse.toISOString(), despertar: despertar.toISOString(), origen, confianza: i === 0 ? 'media' : 'alta' }, actualizado: momento };
    }),
  }));
});

// La app abre en Inicio; el cielo se toca en Hábitos. CanvasKit pesa 8 MB y el cielo fijo se
// dibuja por software: hay que esperar.
async function abrir() {
  await pagina.goto(URL);
  await pagina.getByRole('tab', { name: 'Hábitos' }).click({ timeout: 60000 });
  await pagina.getByText(/cps ·/).waitFor({ timeout: 60000 });
  await pagina.waitForTimeout(6000);
  // Dónde quedó cada estrella del día (Cielo.tsx lo deja a mano en la web).
  return pagina.evaluate(() => globalThis.__cielo);
}

const foto = async (nombre, p = pagina) => {
  await p.screenshot({ path: join(salida, nombre + '.png') });
  ultimaFoto = nombre;
  console.log('·', nombre);
};
const panel = async (texto) => {
  await pagina.getByText(/cps ·/).click();
  await pagina.getByText(texto, { exact: true }).click();
  await pagina.getByText(/cps ·/).click();
};
const cuenta = () => pagina.getByText(/de \d+ encendidas|DÍA COMPLETO/i).first().textContent();

const cielo = await abrir();
await foto('inicio');
// Cambiar de calidad o de riqueza rehace la textura del cielo fijo, pero no la escena: el cielo
// no puede quedar negro ni volver a aparecer desde cero.
for (const [boton, nombre, espera] of [['baja', 'calidad-baja', 3000], ['alta', null, 3000], ['Cielo 0 %', 'riqueza-0', 4000], ['Cielo 100 %', 'riqueza-100', 4000], ['Cielo 60 %', null, 4000]]) {
  await panel(boton);
  await pagina.waitForTimeout(espera);
  if (nombre) await foto(nombre);
}

// El primer hábito a mano del día.
const indice = cielo.habitos.findIndex((h) => !h.auto);
const [ex, ey] = cielo.estrellas[indice];
const antes = await cuenta();
await pagina.mouse.click(ex, ey);
await pagina.waitForTimeout(150);
await foto('toque');
await pagina.waitForTimeout(900);
await foto('toque-despues');
const despues = await cuenta();

// Local primero: después de recargar, lo encendido sigue encendido.
await abrir();
await foto('recordado');
const recordado = await cuenta();
console.log(`  ${cielo.habitos[indice].nombre}: «${antes}» → «${despues}» → al recargar «${recordado}»`);
if (recordado !== despues) errores.push(`Al recargar no se acordó: «${despues}» pasó a «${recordado}»`);

await panel('Completar el día');
for (const ms of [1500, 3500, 6000]) {
  await pagina.waitForTimeout(ms === 1500 ? 1500 : ms - (ms === 3500 ? 1500 : 3500));
  await foto('completo-' + ms);
}
await panel('Hoy / Universo');
await pagina.waitForTimeout(2500);
await foto('universo');

// Las secciones (cambios 9 y 10): Ascent sube con el dedo desde el cielo, pero no desde la barra;
// la flecha de arriba la baja y la tenue de abajo la sube; la tira de pestañas y el «+». Con la
// conexión con Ascent apagada (la v1, src/lib/ascent.ts) el gesto no sube nada.
await abrir();
const { width: an, height: al } = pagina.viewportSize();
const arrastrar = async (desde, hasta, nombre) => {
  await pagina.mouse.move(desde[0], desde[1]);
  await pagina.mouse.down();
  await pagina.mouse.move(hasta[0], hasta[1], { steps: 14 });
  await pagina.waitForTimeout(400);
  if (nombre) await foto(nombre);
  await pagina.mouse.up();
  await pagina.waitForTimeout(1200);
};
// En el borde de la barra, donde no hay botón: soltar sobre un botón lo tocaría.
await arrastrar([3, al - 30], [3, al - 330], 'ascent-desde-la-barra');
await arrastrar([an / 2, al - 220], [an / 2, al - 520], 'ascent-subiendo');
if (await pagina.getByLabel('Volver al cielo').count()) {
  await foto('ascent');
  await pagina.getByLabel('Volver al cielo').click();
  await pagina.waitForTimeout(1200);
  await foto('ascent-bajada');
  await pagina.mouse.click(an / 2, al - 58 - 24);
  await pagina.waitForTimeout(1200);
  await foto('ascent-por-la-flecha');
  await pagina.getByLabel('Volver al cielo').click();
  await pagina.waitForTimeout(1200);
} else {
  console.log('  Ascent: apagada (EXPO_PUBLIC_CON_ASCENT), el gesto no sube nada');
}
await arrastrar([an - 40, 420], [an - 200, 420], 'pestanas-deslizando');
await foto('perfil');
// Sueño sin reloj: la pregunta de la hora (o las horas, la mañana que pregunta sin proponer), la
// noche corregida y de dónde sale cada dato.
await pagina.getByRole('tab', { name: 'Sueño' }).click();
await pagina.waitForTimeout(2000);
await foto('seccion-sueno');
const cambiarLaHora = pagina.getByRole('button', { name: 'Cambiar', exact: true });
if (await cambiarLaHora.count()) {
  await cambiarLaHora.first().click();
  await pagina.waitForTimeout(900);
}
await foto('sueno-hora');
await pagina.getByRole('button', { name: 'Guardar', exact: true }).first().click();
await pagina.waitForTimeout(1500);
await foto('sueno-corregida');
await pagina.mouse.move(an / 2, al / 2);
await pagina.mouse.wheel(0, 2600);
await pagina.waitForTimeout(1000);
await foto('sueno-fuentes');
await pagina.getByRole('tab', { name: 'Inicio' }).click();
await pagina.waitForTimeout(1500);
await foto('seccion-inicio');
// Las tarjetas de Comida, al lado, también tienen su «Agregar», e Inicio su vaso: los de la barra y
// de la hoja van después en la página.
await pagina.getByLabel('Agregar', { exact: true }).last().click();
await pagina.waitForTimeout(900);
await foto('mas');
await pagina.getByLabel('Sumar un vaso de 250 ml').last().click();
await pagina.waitForTimeout(500);
await foto('mas-agua');
// Decir lo que comí (lo pediste el 26/10): lo entendido, con sus preguntas, y anotado con deshacer.
await pagina.getByText('Decir lo que comí').first().click();
await pagina.waitForTimeout(1500);
await pagina.getByLabel('Decir lo que comí').last().fill('en el almuerzo comí 200 gramos de arroz, una milanesa con puré y un vaso de leche');
await pagina.getByRole('button', { name: 'Entender' }).click();
await pagina.waitForTimeout(3500);
await foto('decir');
await pagina.getByRole('button', { name: /Agregar al almuerzo/ }).click();
await pagina.waitForTimeout(1200);
await foto('decir-anotado');

// La entrada, en un navegador sin nada guardado: la frase, los hábitos y la comida. El círculo de
// abajo se llama «Seguir», se habilita cuando se llena el aro y late sin parar: se toca forzado.
const nueva = await navegador.newPage(PANTALLA);
anotarErrores(nueva);
await nueva.goto(URL);
const seguir = nueva.getByRole('button', { name: 'Seguir', exact: true });
const tocarSeguir = async () => {
  await nueva.waitForFunction(() => document.querySelector('[aria-label="Seguir"]')?.getAttribute('aria-disabled') !== 'true', null, { timeout: 30000 });
  await seguir.click({ force: true });
};
await seguir.waitFor({ timeout: 60000 });
await nueva.waitForTimeout(8000);
await foto('entrada-frase', nueva);
for (const nombre of ['entrada-habitos', 'entrada-comida']) {
  await tocarSeguir();
  await nueva.waitForTimeout(4000);
  await foto(nombre, nueva);
}

await navegador.close();
if (errores.length) {
  console.log('Errores:\n' + [...new Set(errores)].join('\n'));
  process.exit(1);
}
