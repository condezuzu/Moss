// Recorre todas las pantallas de la app de verdad (en la web) en un iPhone chico y uno grande, para
// buscar textos cortados, cosas encimadas y estados vacíos raros: las seis secciones con su scroll,
// la hoja del «+», y la entrada hasta el final del cuestionario en un navegador sin nada guardado.
// Uso: npm run web:exportar && npm run web:ver   (en otra terminal)
//      node herramientas/recorrer-pantallas.mjs capturas/revision/antes
// Deja <carpeta>/<tamaño>-<idioma>/NN-pantalla.png y, al final, los errores de la consola.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const raiz = process.argv[2] || 'capturas/revision';
const URL = process.env.APP_URL || 'http://localhost:4174/';
const TAMANOS = [
  { nombre: 'chico', viewport: { width: 375, height: 667 } },
  { nombre: 'grande', viewport: { width: 440, height: 956 } },
];
const IDIOMAS = (process.env.IDIOMAS || 'es-UY,es-ES,en-US').split(',');
const SECCIONES = { 'es-UY': ['Inicio', 'Comida', 'Progreso', 'Sueño', 'Hábitos', 'Perfil'], 'es-ES': ['Inicio', 'Comida', 'Progreso', 'Sueño', 'Hábitos', 'Perfil'], 'en-US': ['Home', 'Food', 'Progress', 'Sleep', 'Habits', 'Profile'] };

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];

// La misma persona de capturar-app.mjs, que ya pasó la entrada.
function persona() {
  if (localStorage.getItem('moss:datos')) return;
  const d = new Date();
  const clave = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const hoy = clave(d);
  const momento = d.toISOString();
  localStorage.setItem('moss:datos', JSON.stringify({
    perfil: { sexo: 'm', alturaCm: 178, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', nacimiento: d.getFullYear() - 34, actualizado: momento },
    pesos: [{ fecha: hoy, kg: 82, origen: 'manual', momento }],
    metas: [{ desde: hoy, kcal: 2150, proteina: 165, carbohidratos: 215, grasas: 70, gasto: 2650, motivo: 'inicial', momento }],
    ajustes: { entrada: 'hecha' },
    noches: Array.from({ length: 9 }, (_, i) => {
      const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      const dormirse = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() - 1, 23, 25 + (i % 3) * 10);
      const despertar = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 7, 5 + (i % 4) * 6);
      return { fecha: clave(dia), hora: { dormirse: dormirse.toISOString(), despertar: despertar.toISOString(), origen: i > 0 && i % 3 === 0 ? 'confirmada' : 'estimada', confianza: i === 0 ? 'media' : 'alta' }, actualizado: momento };
    }),
  }));
}

async function pagina(t, idioma) {
  const p = await navegador.newPage({ viewport: t.viewport, deviceScaleFactor: 2, locale: idioma });
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`${t.nombre}-${idioma}: ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => errores.push(`${t.nombre}-${idioma}: ${String(e).slice(0, 200)}`));
  return p;
}

for (const t of TAMANOS) {
  for (const idioma of IDIOMAS) {
    const carpeta = join(raiz, `${t.nombre}-${idioma}`);
    mkdirSync(carpeta, { recursive: true });
    let n = 0;
    const foto = async (p, nombre) => {
      await p.screenshot({ path: join(carpeta, `${String(++n).padStart(2, '0')}-${nombre}.png`) });
    };

    const p = await pagina(t, idioma);
    await p.addInitScript(persona);
    await p.goto(URL);
    const [inicio] = SECCIONES[idioma];
    await p.getByRole('tab', { name: inicio }).click({ timeout: 90000 });
    await p.waitForTimeout(4000);
    for (const seccion of SECCIONES[idioma]) {
      await p.getByRole('tab', { name: seccion }).click();
      await p.waitForTimeout(seccion === SECCIONES[idioma][4] ? 6000 : 1800);
      const base = seccion.normalize('NFD').replace(/[^\w]/g, '').toLowerCase();
      await foto(p, base);
      if (seccion === SECCIONES[idioma][4]) continue;
      // Lo de más abajo: la rueda sobre el centro mueve el scroll de la sección que se ve.
      for (let k = 1; k <= 3; k++) {
        await p.mouse.move(t.viewport.width / 2, t.viewport.height / 2);
        await p.mouse.wheel(0, t.viewport.height * 0.8);
        await p.waitForTimeout(700);
        await foto(p, `${base}-${k}`);
      }
    }
    await p.getByRole('tab', { name: inicio }).click();
    await p.waitForTimeout(1200);
    await p.getByLabel(idioma.startsWith('es') ? 'Agregar' : 'Add', { exact: true }).last().click();
    await p.waitForTimeout(1000);
    await foto(p, 'mas');
    await p.close();

    // La entrada, de cero, hasta el resultado del cuestionario.
    if (!idioma.startsWith('es-UY') && t.nombre === 'grande') continue;
    const q = await pagina(t, idioma);
    await q.goto(URL);
    const es = idioma.startsWith('es');
    const SEGUIR = es ? 'Seguir' : 'Continue';
    const estrella = q.locator(`[aria-label="${SEGUIR}"][role="button"]`).first();
    await estrella.waitFor({ timeout: 90000 });
    for (let k = 0; k < 3; k++) {
      await q.waitForTimeout(k === 0 ? 8000 : 4600);
      await foto(q, `entrada-${k + 1}`);
      await q.waitForFunction((s) => document.querySelector(`[aria-label="${s}"]`)?.getAttribute('aria-disabled') !== 'true', SEGUIR, { timeout: 30000 });
      await estrella.click({ force: true });
    }
    // Lo que sigue tiene botones de verdad: se toca el último que dice seguir, aceptar o empezar.
    for (let k = 0; k < 14; k++) {
      await q.waitForTimeout(2600);
      await foto(q, `entrada-${k + 4}`);
      const masculino = q.getByText(es ? 'Masculino' : 'Male', { exact: true });
      if (await masculino.count()) await masculino.last().click();
      const empezar = q.getByText(es ? 'Empezar' : 'Start', { exact: true });
      if (await empezar.count()) break;
      const boton = q.getByText(new RegExp(`^(${es ? 'Seguir|Acepto y sigo|Ahora no' : 'Continue|I agree, continue|Not now'})$`));
      if (!(await boton.count())) break;
      await boton.last().click();
    }
    await q.close();
    console.log('·', carpeta, n, 'fotos');
  }
}

await navegador.close();
console.log(errores.length ? 'Errores:\n' + [...new Set(errores)].join('\n') : 'Sin errores en la consola.');
