// Arma galeria/dist/index.html: un solo archivo con la página, los shaders del cielo, el
// catálogo, los textos, los alimentos curados y los módulos de la app que usa (la comida, las
// metas, el control, el cuerpo, el progreso, el sueño con y sin reloj, el rendimiento y los músculos
// con Ascent, y las estadísticas de Hábitos), y para la sección «Tienda», el ícono y las capturas
// de la App Store achicadas (capturas/tienda/vista). Todo lo demás se lee
// de src/ y de assets/, que es lo mismo que usa la app: la galería nunca tiene una copia propia.
// Uso: npm run galeria

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');
const leerJson = (p) => (existsSync(join(raiz, p)) ? JSON.parse(leer(p)) : null);

// Los módulos de src/dominio que puede importar otro módulo de la galería, con el nombre de su
// constante. Van antes en el armado que los que los usan.
const DEL_DOMINIO = { porciones: 'Porciones', recetaDeTexto: 'RecetaDeTexto', fechas: 'Fechas', metas: 'Metas', micronutrientes: 'Micronutrientes', dejaElDia: 'DejaElDia', plan: 'Plan', control: 'Control', cuerpo: 'Cuerpo', progreso: 'Progreso', sueno: 'Sueno', sinReloj: 'SinReloj', entrenamiento: 'Entrenamiento', musculos: 'Musculos', rendimiento: 'Rendimiento', estadisticas: 'Estadisticas' };

// Un módulo de src/ pasado a JavaScript, como una constante con lo que exporta. Solo puede
// importar otros módulos de la galería (DEL_DOMINIO), que se leen de su constante; los imports de
// solo tipos se borran al pasarlo.
function modulo(nombre, ruta) {
  const { outputText: js } = ts.transpileModule(leer(ruta), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const outputText = js.replace(/^import \{([^}]*)\} from '\.\/(\w+)';$/gm, (_, nombres, archivo) => {
    if (!DEL_DOMINIO[archivo]) throw new Error(`${ruta} importa ./${archivo}, que la galería no tiene`);
    return `const {${nombres}} = ${DEL_DOMINIO[archivo]};`;
  });
  if (/^import\s/m.test(outputText)) throw new Error(`${ruta} importa otros módulos: la galería no puede usarlo`);
  const exportado = /^export (?:async )?(?:function|const|let|class) (\w+)/gm;
  const nombres = [...outputText.matchAll(exportado)].map((m) => m[1]);
  const cuerpo = outputText.replace(/^export (?=(?:async )?(?:function|const|let|class) )/gm, '').replace(/^export \{\s*\};?$/gm, '');
  return `const ${nombre} = (() => {\n${cuerpo}\nreturn { ${nombres.join(', ')} };\n})();`;
}

// Los genéricos curados de assets/alimentos.db, compactos: la galería busca sobre ellos en la
// memoria con el mismo orden que la app (src/comida/buscar.ts). Por alimento: id, nombres, valores
// por 100 g (kcal, proteína, carbohidratos, grasas, y aparte lo secundario), porciones [es, en,
// gramos], la de siempre y los textos de búsqueda [idioma, región, principal, texto].
function alimentosCurados() {
  // Con BASE=otra.db, la galería usa otra base (la de un archivo de alimentos en revisión).
  const ruta = join(raiz, process.env.BASE ?? 'assets/alimentos.db');
  if (!existsSync(ruta)) return null;
  const db = new DatabaseSync(ruta, { readOnly: true });
  const redondo = (n) => Math.round(n * 100) / 100;
  // Los micronutrientes, en el orden de src/dominio/micronutrientes.ts (MICROS).
  const MICROS = ['colesterol', 'trans', 'monoinsaturadas', 'poliinsaturadas', 'potasio', 'calcio', 'hierro', 'magnesio', 'fosforo', 'zinc', 'selenio',
    'vitaminaA', 'vitaminaC', 'vitaminaD', 'vitaminaE', 'vitaminaK', 'tiamina', 'riboflavina', 'niacina', 'vitaminaB6', 'folato', 'vitaminaB12', 'cafeina'];
  const microsDe = (a) => {
    const u = MICROS.map((k) => (a[k] === null || a[k] === undefined ? null : Math.round(a[k] * 1000) / 1000));
    while (u.length && u[u.length - 1] === null) u.pop();
    return u;
  };
  const alimentos = new Map(db.prepare(`SELECT * FROM alimentos WHERE nombre_es IS NOT NULL ORDER BY id`).all()
    .map((a) => [a.id, {
      id: a.id, es: a.nombre_es, en: a.nombre_en, cat: a.categoria, v: [a.kcal, a.proteina, a.carbohidratos, a.grasas].map(redondo),
      // Lo secundario: fibra, azúcares, saturadas, sodio (mg) y alcohol; null si la base no lo tiene.
      s: [a.fibra, a.azucares, a.saturadas, a.sodio, a.alcohol].map((n) => (n === null ? null : redondo(n))),
      // Los micronutrientes (MICROS) y lo verificado: [día, con qué], o null.
      u: microsDe(a), w: a.verificado && a.segunda ? [a.verificado, a.segunda] : null, f: a.fuente, o: a.atribucion,
      p: [], d: 0, t: [], porcion: a.porcion,
    }]));
  for (const p of db.prepare(`SELECT p.id, p.alimento, p.es, p.en, p.gramos FROM porciones p JOIN alimentos a ON a.id = p.alimento WHERE a.nombre_es IS NOT NULL ORDER BY p.id`).all()) {
    const a = alimentos.get(p.alimento);
    if (p.id === a.porcion) a.d = a.p.length;
    a.p.push([p.es, p.en, redondo(p.gramos)]);
  }
  for (const t of db.prepare(`SELECT t.alimento, t.idioma, t.region, t.principal, t.texto FROM textos t JOIN alimentos a ON a.id = t.alimento WHERE a.nombre_es IS NOT NULL ORDER BY t.id`).all()) {
    alimentos.get(t.alimento).t.push([t.idioma, t.region || '', t.principal, t.texto]);
  }
  // Los platos: lo que pesan terminados y cuántos ingredientes tienen, para «¿De dónde sale esto?».
  for (const r of db.prepare('SELECT plato, peso_final, (SELECT count(*) FROM ingredientes i WHERE i.plato = r.plato) AS n FROM recetas r').all()) {
    const a = alimentos.get(r.plato);
    if (a) a.r = [r.peso_final, r.n];
  }
  db.close();
  return [...alimentos.values()].map(({ porcion, ...a }) => a);
}

const shaders = {
  comun: leer('src/cielo/shaders/comun.glsl'),
  fondo: leer('src/cielo/shaders/fondo.glsl'),
  aurora: leer('src/cielo/shaders/aurora.glsl'),
  vivo: leer('src/cielo/shaders/vivo.glsl'),
};

const catalogo = leerJson('src/datos/constelaciones.json');
const textos = { es: leerJson('src/textos/es.json'), en: leerJson('src/textos/en.json') };

const claves = ['comun.deshacer', 'fecha.dias', 'fecha.diasCortos', 'fecha.mesesCortos', 'cielo.fecha', 'cielo.luzDeHoy', 'cielo.encendidas',
  'cielo.completa', 'cielo.encendida', 'cielo.apagada', 'cielo.seEnciendeSola', 'cielo.desdeSalud', 'cielo.horasMinutos',
  'cielo.tuUniverso', 'entrada.frase', 'entrada.fraseAutor', 'entrada.habitosTitulo', 'entrada.comidaTitulo', 'entrada.cuenta.apple',
  'entrada.cuestionario.resultadoTitulo', 'perfil.titulo', 'comida.comidas.cena', 'comida.quedanKcal', 'comida.buscar', 'comida.sueles.cena',
  'comida.agregarA.cena', 'comida.tuDia', 'progreso.controlTexto', 'inicio.bloques.calorias', 'mas.agregarComida', 'cuerpo.aviso', 'sueno.titulo',
  'comida.porcentaje', 'habitos.nuevo', 'habitos.metas.pasos', 'habitos.mes.titulo', 'habitos.sugeridos.titulo', 'perfil.borrarCuenta', 'perfil.creditos', 'perfil.fuentes.estrellas'];
const faltan = [];
for (const idioma of ['es', 'en']) {
  if (!textos[idioma]) { faltan.push(`src/textos/${idioma}.json`); continue; }
  for (const clave of claves) {
    const valor = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), textos[idioma]);
    if (valor == null) faltan.push(`${idioma}:${clave}`);
  }
}
if (faltan.length) {
  console.error('Faltan textos en el diccionario:', faltan.join(', '));
  process.exit(1);
}

const alimentos = alimentosCurados();
if (!alimentos) console.warn('Sin assets/alimentos.db (npm run alimentos): la galería de la comida queda sin alimentos.');

// La sección «Tienda»: las vistas chicas en JPEG que deja npm run tienda:capturas (los PNG de tamaño
// exacto pesan demasiado para un solo HTML). Sin correr esa herramienta, la sección lo dice.
function tienda() {
  const carpeta = join(raiz, 'capturas/tienda/vista');
  const textos = leerJson('capturas/tienda/vista/textos.json');
  if (!textos) return null;
  const jpeg = (archivo) => (existsSync(join(carpeta, archivo)) ? 'data:image/jpeg;base64,' + readFileSync(join(carpeta, archivo)).toString('base64') : null);
  const capturas = textos.map((c) => {
    const archivo = `${String(c.n).padStart(2, '0')}-${c.nombre}.jpg`;
    return { ...c, es: jpeg(`es-${archivo}`), en: jpeg(`en-${archivo}`) };
  }).filter((c) => c.es || c.en);
  return { icono: jpeg('icono.jpg'), iconoRecibido: jpeg('icono-recibido.jpg'), capturas };
}
const datosDeTienda = tienda();
if (!datosDeTienda) console.warn('Sin capturas/tienda/vista (npm run tienda:capturas): la sección «Tienda» queda vacía.');

// "</" adentro de un <script> lo cortaría.
const json = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');
const js = [
  `const SHADERS = ${json(shaders)};`,
  `const CATALOGO = ${json(catalogo)};`,
  `const TEXTOS = ${json(textos)};`,
  `const ALIMENTOS = ${json(alimentos)};`,
  `const TIENDA = ${json(datosDeTienda)};`,
  modulo('Buscar', 'src/comida/buscar.ts'),
  modulo('Porciones', 'src/comida/porciones.ts'),
  modulo('RecetaDeTexto', 'src/comida/recetaDeTexto.ts'),
  modulo('Frase', 'src/comida/frase.ts'),
  modulo('Comidas', 'src/dominio/comidas.ts'),
  modulo('Etiqueta', 'src/comida/etiqueta.ts'),
  modulo('Fechas', 'src/dominio/fechas.ts'),
  modulo('AlrededorDelEntreno', 'src/dominio/alrededorDelEntreno.ts'),
  modulo('Plan', 'src/dominio/plan.ts'),
  modulo('Metas', 'src/dominio/metas.ts'),
  modulo('Micronutrientes', 'src/dominio/micronutrientes.ts'),
  modulo('DejaElDia', 'src/dominio/dejaElDia.ts'),
  modulo('Control', 'src/dominio/control.ts'),
  modulo('Cuerpo', 'src/dominio/cuerpo.ts'),
  modulo('Progreso', 'src/dominio/progreso.ts'),
  modulo('Sueno', 'src/dominio/sueno.ts'),
  modulo('SinReloj', 'src/dominio/sinReloj.ts'),
  modulo('Entrenamiento', 'src/dominio/entrenamiento.ts'),
  modulo('Musculos', 'src/dominio/musculos.ts'),
  modulo('Rendimiento', 'src/dominio/rendimiento.ts'),
  modulo('Estadisticas', 'src/dominio/estadisticas.ts'),
  ...['motor', 'escena', 'entrada', 'util', 'luna', 'kcal', 'datos', 'comida', 'inicio', 'mas', 'progreso', 'sueno', 'perfil', 'ascent', 'habitos', 'widgets', 'tienda', 'galeria'].map((n) => leer(`galeria/src/${n}.js`)),
].join('\n');

const html = leer('galeria/src/pagina.html').replace('/*@SCRIPTS*/', () => js);
mkdirSync(join(raiz, 'galeria/dist'), { recursive: true });
writeFileSync(join(raiz, 'galeria/dist/index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
const n = catalogo ? catalogo.constelaciones.length : 0;
console.log(`galeria/dist/index.html · ${kb} KB · ${n} constelaciones en el catálogo · ${alimentos ? alimentos.length : 0} alimentos curados`);
