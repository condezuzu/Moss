// «Decir lo que comí», mejor (27/11, para aprobar). El micrófono al tocarlo, sobrio: cede, el ícono pasa a «parar» y
// según la forma sale una onda, se mueven unas barras con la voz o se dibuja un aro; al parar, se recoge. Con Reducir
// movimiento, solo cambian el ícono y el color. Y un batido dicho con lo que lleva («me tomo un batido de: …») se ve
// como un plato con sus ingredientes (src/comida/frase.ts: cada uno con su cantidad y el nombre del plato), se guarda
// como receta ahí mismo, con su nombre, y la próxima vez alcanza con decirlo.
// Lo escrito se entiende como en el «Decir» de la galería (galeria/src/comida.js, copiado acá porque no está a mano
// desde afuera): la misma base, el mismo lector, las mismas cantidades. «Agregar» anota con ese mismo «Decir»: abre su
// hoja abajo de esta pantalla, repite lo que se cambió acá y toca su «Agregar»; lo tuyo dicho por su nombre va como una
// sola cosa, como en la app. En la app, las barras y el aro seguirían el volumen de verdad (el evento «volumechange»
// de expo-speech-recognition).
/* global Galeria, Util, ALIMENTOS, Buscar, Frase, Porciones, RecetaDeTexto, Comidas */

const PALABRAS = {
  es: {
    frase: 'me tomo un batido de: una banana, una taza de leche, dos cucharadas de avena y una de mantequilla de maní',
    fraseNombre: 'mi batido de la mañana',
    guardadoComo: 'Batido de la mañana',
    guardarComoReceta: 'Guardar como receta',
    nombre: 'Nombre de la receta',
    guardar: 'Guardar',
    guardada: 'Guardada como «{nombre}». La próxima vez, solo di su nombre.',
    tuReceta: 'Tu receta',
    verLoQueLleva: 'Ver lo que lleva',
  },
  en: {
    frase: 'I’m having a smoothie with a banana, a cup of whole milk, two tablespoons of oats and a tablespoon of peanut butter',
    fraseNombre: 'my morning smoothie',
    guardadoComo: 'Morning smoothie',
    guardarComoReceta: 'Save as a recipe',
    nombre: 'Recipe name',
    guardar: 'Save',
    guardada: 'Saved as “{nombre}.” Next time, just say its name.',
    tuReceta: 'Your recipe',
    verLoQueLleva: 'Show what’s in it',
  },
};
// Lo que se ve dicho mientras escucha, en las capturas de «escuchando»: dos de las cuatro cosas.
const A_MEDIAS = { es: 'me tomo un batido de: una banana, una taza de leche', en: 'I’m having a smoothie with a banana, a cup of whole milk' };
const FORMAS = { microfono: 'onda', barras: 'barras', aro: 'aro' };
// El largo del aro (r = 46 en un cuadro de 100).
const VUELTA = 289.03;
const ICONO_PARAR = '<svg class="dme-i-parar" viewBox="0 0 24 24" aria-hidden="true"><rect x="7.25" y="7.25" width="9.5" height="9.5" rx="2.2"/></svg>';
// La región de la persona de la galería, como en comida.js.
const REGION = 'UY';

const CSS = `
.dme-pantalla .dme-hoja { position: absolute; left: 0; right: 0; bottom: 0; top: calc(var(--arriba) - 6px); display: flex; flex-direction: column; overflow: hidden; border-radius: 28px 28px 0 0; border-top: 1px solid rgba(232, 196, 106, 0.22); background: linear-gradient(180deg, #0e1631 0%, #090f23 100%); box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.55); }
.dme-asa { flex: none; width: 38px; height: 5px; margin: 7px auto 22px; border-radius: 3px; background: rgba(239, 230, 207, 0.22); }
.dme-cuerpo { padding-top: 6px; }
.dme-pantalla .dme-hoja svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.dme-pantalla .dc-area { transition: color 0.2s ease; }
.dme-pantalla .dc-area.dme-borrando { color: transparent; }

.dme-mic-lugar { position: relative; display: grid; place-items: center; height: 112px; }
.dme-mic-lugar > * { grid-area: 1 / 1; }
.dme-mic { appearance: none; cursor: pointer; position: relative; display: grid; place-items: center; width: 74px; height: 74px; padding: 0; border-radius: 50%; border: 1px solid rgba(232, 196, 106, 0.5); background: rgba(232, 196, 106, 0.1); color: var(--oro-claro); transition: background-color 0.24s ease, border-color 0.24s ease, color 0.24s ease; }
.dme-mic svg { grid-area: 1 / 1; width: 30px; height: 30px; transition: opacity 0.2s ease, transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dme-mic svg.dme-i-mic { stroke-width: 1.6; }
.dme-mic svg.dme-i-parar { fill: currentColor; stroke: none; opacity: 0; transform: scale(0.55); }
.dme-escucha .dme-mic { background-color: var(--oro); border-color: var(--oro); color: #1a1406; }
.dme-escucha .dme-mic svg.dme-i-mic { opacity: 0; transform: scale(0.55); }
.dme-escucha .dme-mic svg.dme-i-parar { opacity: 1; transform: none; }
.dme-mic.dme-cede { animation: dme-cede 0.3s cubic-bezier(0.3, 0.7, 0.4, 1); }
@keyframes dme-cede { 35% { transform: scale(0.94); } }

.dme-onda, .dme-respira { width: 74px; height: 74px; border-radius: 50%; pointer-events: none; opacity: 0; }
.dme-onda { box-sizing: border-box; border: 1.5px solid var(--oro); }
.dme-respira { box-sizing: border-box; border: 1px solid rgba(232, 196, 106, 0.7); }
.dme-v-onda.dme-escucha .dme-onda { animation: dme-onda 0.75s cubic-bezier(0.15, 0.6, 0.3, 1) both; }
.dme-v-onda.dme-escucha .dme-respira { animation: dme-respira-entra 0.45s ease-out 0.55s both, dme-respira 1.8s ease-in-out 1s infinite alternate; }
@keyframes dme-onda { from { opacity: 0.85; transform: scale(1); } to { opacity: 0; transform: scale(1.8); } }
@keyframes dme-respira-entra { from { opacity: 0; transform: scale(1); } to { opacity: 0.2; transform: scale(1.08); } }
@keyframes dme-respira { from { opacity: 0.2; transform: scale(1.08); } to { opacity: 0.55; transform: scale(1.22); } }

.dme-aro { width: 104px; height: 104px; overflow: visible; transform: rotate(-90deg); pointer-events: none; }
.dme-aro circle { fill: none; stroke-width: 2; }
.dme-aro-pista { stroke: rgba(232, 196, 106, 0.16); opacity: 0; transition: opacity 0.3s ease; }
.dme-aro-trazo { stroke: var(--oro); stroke-linecap: round; stroke-dasharray: ${VUELTA}; stroke-dashoffset: ${VUELTA}; }
.dme-v-aro.dme-escucha .dme-aro-pista { opacity: 1; }
.dme-v-aro.dme-escucha .dme-aro-trazo { animation: dme-traza 0.7s cubic-bezier(0.3, 0.6, 0.3, 1) both, dme-late 1.6s ease-in-out 0.7s infinite alternate; }
@keyframes dme-traza { to { stroke-dashoffset: 0; } }
@keyframes dme-late { from { stroke-opacity: 1; } to { stroke-opacity: 0.45; } }

.dme-ayuda { min-height: 38px; }
.dme-ayuda-texto { animation: dme-funde 0.24s ease both; }
.dme-barras { display: inline-flex; align-items: center; gap: 3px; height: 14px; width: 0; margin-right: 0; vertical-align: middle; opacity: 0; overflow: hidden; transition: width 0.28s ease, margin-right 0.28s ease, opacity 0.2s ease; }
.dme-barras i { flex: none; width: 3px; height: 4px; border-radius: 2px; background: var(--oro); transition: height 0.11s ease-out; }
.dme-v-barras.dme-escucha .dme-barras { width: 27px; margin-right: 10px; opacity: 1; }

.dme-resultado { margin-top: 12px; }
.dme-plato, .dme-tuya { animation: dme-entra 0.36s ease both; }
.dme-resultado.dme-quieto .dc-bloque, .dme-resultado.dme-quieto .dme-plato, .dme-resultado.dme-quieto .dme-tuya, .dme-resultado.dme-quieto .dc-grupo { animation: none; }
.dme-plato-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 4px 0; }
.dme-plato-cab b { min-width: 0; font: 500 16px/1.3 var(--texto); color: var(--tinta); }
.dme-plato-cab b.dme-cambia { animation: dme-funde 0.36s ease both; }
.dme-plato-cab span { flex: none; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.62); font-variant-numeric: tabular-nums; }
.dme-plato-lista { margin: 2px 0 0 1px; padding-left: 13px; border-left: 1px solid rgba(232, 196, 106, 0.28); }
.dme-plato-lista .dc-bloque:last-child { border-bottom: 0; }

.dme-guardar-lugar { display: grid; margin-top: 4px; }
.dme-guardar-lugar > * { grid-area: 1 / 1; align-self: start; }
.dme-guardar-b { appearance: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 2px; border: 0; background: none; color: var(--oro-claro); font: 400 14.5px/1 var(--texto); transition: opacity 0.2s ease, visibility 0.2s; }
.dme-guardar-b svg { width: 18px; height: 18px; }
.dme-guardar-b:active { opacity: 0.6; }
.dme-guardando .dme-guardar-b, .dme-guardado .dme-guardar-b { opacity: 0; visibility: hidden; }
.dme-plegable { display: grid; grid-template-rows: 0fr; opacity: 0; pointer-events: none; transition: grid-template-rows 0.34s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.26s ease; }
.dme-plegable > div { min-height: 0; overflow: hidden; }
.dme-guardando .dme-campo, .dme-guardado .dme-hecho, .dme-abierta .dme-lleva { grid-template-rows: 1fr; opacity: 1; pointer-events: auto; }
.dme-campo label { display: block; margin: 8px 2px 7px; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.62); }
.dme-campo-fila { display: flex; gap: 8px; padding-bottom: 8px; }
.dme-campo input { flex: 1; min-width: 0; height: 46px; box-sizing: border-box; padding: 0 14px; border-radius: 14px; border: 1px solid rgba(232, 196, 106, 0.55); background: rgba(6, 10, 22, 0.6); color: var(--tinta); font: 400 15px/1 var(--texto); outline: none; user-select: text; -webkit-user-select: text; }
.dme-campo input::selection { background: rgba(232, 196, 106, 0.38); color: var(--tinta); }
.dme-guardar-ok { appearance: none; cursor: pointer; flex: none; height: 46px; padding: 0 20px; border-radius: 999px; border: 0; background: var(--oro); color: #1a1406; font: 500 15px/1 var(--texto); }
.dme-guardar-ok:active { transform: scale(0.97); }
.dme-hecho p { display: flex; align-items: flex-start; gap: 9px; margin: 6px 0 4px; font: 400 13.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.74); }
.dme-hecho svg { flex: none; width: 17px; height: 17px; margin-top: 2px; color: var(--oro-claro); }
.dme-pantalla .dme-hecho svg { stroke-width: 2; }
.dme-hecho b { font-weight: 500; color: var(--tinta); }

.dme-abrir { appearance: none; cursor: pointer; display: block; min-width: 0; min-height: 44px; padding: 0; border: 0; background: none; color: inherit; text-align: left; font: inherit; }
.dme-nombre { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dme-flecha { flex: none; width: 16px; height: 16px; color: var(--oro-claro); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dme-pantalla .dme-flecha { stroke-width: 2; }
.dme-abierta .dme-flecha { transform: rotate(180deg); }
.dme-lleva ul { list-style: none; margin: 2px 0 6px 1px; padding: 0 0 0 13px; border-left: 1px solid rgba(232, 196, 106, 0.28); }
.dme-lleva li { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; font: 400 13.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.82); }
.dme-lleva li span { flex: none; font-size: 13px; color: rgba(239, 230, 207, 0.55); font-variant-numeric: tabular-nums; }

.dme-pie { grid-template-areas: 'uno'; }
.dme-pie > button { grid-area: uno; align-self: center; transition: opacity 0.22s ease, visibility 0.22s; }
.dme-pie > button.dme-oculto { opacity: 0; visibility: hidden; }
.dme-pie .fi-secundario:disabled { opacity: 0.45; cursor: default; }

/* «Agregar»: la hoja baja, como la del «Decir» de la galería, y queda Comida con lo anotado. */
.tel .dme-pantalla.dme-se-va { animation: dme-velo 0.38s ease both; pointer-events: none; }
.dme-se-va .dme-hoja { animation: dme-baja 0.38s cubic-bezier(0.5, 0, 0.9, 0.6) both; }
@keyframes dme-velo { to { background-color: rgba(5, 6, 10, 0); } }
@keyframes dme-baja { to { transform: translateY(100%); } }
@keyframes dme-sale { to { opacity: 0; } }
@keyframes dme-entra { from { opacity: 0; translate: 0 10px; } }
@keyframes dme-funde { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .dme-pantalla .dme-onda, .dme-pantalla .dme-respira, .dme-pantalla .dme-aro, .dme-pantalla .dme-barras { display: none; }
  .dme-pantalla .dme-mic, .dme-pantalla .dme-mic svg, .dme-pantalla .dme-flecha { transition: none; }
  .dme-pantalla .dme-mic.dme-cede, .dme-pantalla .dme-ayuda-texto, .dme-plato-cab b.dme-cambia { animation: none; }
  /* Sin movimiento, un fundido corto: lo que crece aparece ya abierto. */
  .dme-pantalla .dme-plegable, .dme-pantalla .dme-guardar-b, .dme-pie > button { transition: opacity 0.15s ease, visibility 0.15s; }
  .dme-pantalla .dme-plato, .dme-pantalla .dme-tuya { animation: dme-funde 0.15s ease both; }
  .tel .dme-pantalla.dme-se-va { animation: dme-sale 0.16s ease both; }
  .dme-se-va .dme-hoja { animation: none; }
}`;

Galeria.propuesta({
  id: 'decirMejor',
  titulo: 'Decir lo que comí',
  texto: 'El micrófono mientras escucha, en tres formas para elegir. Y un batido dicho con sus ingredientes, que se guarda como receta: la próxima vez alcanza con decir su nombre.',
  vistas: [['microfono', 'El micrófono, con una onda'], ['barras', 'El micrófono, con barras'], ['aro', 'El micrófono, con un aro'], ['batido', 'Un batido con sus ingredientes']],
  mas: [['guardar', 'Al guardarlo como receta'], ['guardado', 'Ya guardado'], ['nombre', 'La próxima vez, diciendo su nombre'], ['en', 'En inglés']],
  principal: 3,
  crear(g) {
    g.estilo('dme-css', CSS);
    const p = g.pantalla('dme-pantalla');
    const comidaSec = g.secciones.comida;
    const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Los relojes: los de la pantalla, el dictado (uno solo a la vez) y las barras.
    let relojes = [];
    const despues = (ms, f) => { relojes.push(setTimeout(f, ms)); };
    let dictado = 0;
    let esperaDictado = 0;
    let barras = 0;
    const pararDictado = () => { clearInterval(dictado); clearTimeout(esperaDictado); dictado = 0; esperaDictado = 0; };
    const calmar = () => { relojes.forEach((r) => clearTimeout(r)); relojes = []; pararDictado(); clearInterval(barras); };

    // ------------------------------------------------------------ lo que entiende, como el «Decir» de la galería
    const porId = new Map(ALIMENTOS.map((a) => [a.id, a]));
    const porNombre = new Map(ALIMENTOS.map((a) => [a.es, a]));
    let corpus = null;
    const textosDe = (a) => a.t.map(([i, region, principal, texto]) => {
      const normal = Buscar.normalizar(texto);
      const trigramas = new Set();
      normal.split(' ').forEach((q) => { for (let k = 0; k + 3 <= q.length; k++) trigramas.add(q.slice(k, k + 3)); });
      return { alimento: a.id, idioma: i, region: region || null, principal, texto, palabras: normal.split(' '), trigramas, rango: 0, marca: a.m, orden: a.b, paises: a.n, variante: a.e };
    });
    function buscar(texto, L, conocidos) {
      corpus = corpus || ALIMENTOS.flatMap(textosDe);
      const normal = Buscar.normalizar(texto);
      const palabras = normal.split(' ').filter(Boolean);
      if (!palabras.length) return [];
      const candidatos = corpus.filter((t) => !porId.get(t.alimento).borrado && palabras.every((q) => t.palabras.some((w) => w.startsWith(q)))).map((t) => ({ ...t, aproximado: false }));
      if (normal.length >= 3 && new Set(candidatos.map((c) => c.alimento)).size < Buscar.POCOS) {
        const buscados = new Set();
        palabras.forEach((q) => { for (let k = 0; k + 3 <= q.length; k++) buscados.add(q.slice(k, k + 3)); });
        corpus.forEach((t) => {
          if (t.idioma !== L || porId.get(t.alimento).borrado || ![...buscados].some((x) => t.trigramas.has(x))) return;
          if (Buscar.parecido(texto, t.texto) >= Buscar.PARECIDO_MINIMO) candidatos.push({ ...t, aproximado: true });
        });
      }
      // Lo que se anotó en estos días sube, como lo usado en la galería.
      const premio = (id) => (conocidos.has(id) ? 2.5 * Math.log1p(1) : 0) + (porId.get(id).cat === 'etiqueta' ? 5 : 0);
      return Buscar.mejoresPorAlimento(candidatos, texto, { idioma: L, region: REGION, premio }, () => true)
        .slice(0, Buscar.limiteDe(candidatos, texto, { region: REGION, limite: 12, limiteDeMarca: 200 }))
        .map((c) => ({ a: porId.get(c.alimento), coincide: c.texto }));
    }
    function nombreDe(a, L) {
      if (L === 'en') return a.en || a.es;
      const regional = a.t.find(([i, r, principal]) => i === 'es' && r === REGION && principal);
      return regional ? Buscar.conMayuscula(regional[3]) : a.es;
    }
    const nombreDeItem = (it, L) => nombreDe(porId.get(it.alimento), L);
    const porcionDe = (a, i, L) => (L === 'en' ? a.p[i][1] : a.p[i][0] || a.p[i][1]);
    const gramosDe = (it) => (it.gramos != null ? it.gramos : porId.get(it.alimento).p[it.porcion][2] * it.veces);
    function valoresDe(it) {
      const [kcal, pr, c, gr] = porId.get(it.alimento).v;
      const f = gramosDe(it) / 100;
      return { kcal: kcal * f, p: pr * f, c: c * f, g: gr * f };
    }
    const kcalDe = (it) => valoresDe(it).kcal;
    const sumarValores = (vs) => vs.reduce((t, v) => ({ kcal: t.kcal + v.kcal, p: t.p + v.p, c: t.c + v.c, g: t.g + v.g }), { kcal: 0, p: 0, c: 0, g: 0 });
    const cantidadDe = (it, L) => (it.gramos != null ? `${Porciones.decimal(it.gramos, L)} g` : Porciones.cantidadDePorcion(it.veces, porcionDe(porId.get(it.alimento), it.porcion, L), L));
    const llano = (t) => Buscar.normalizar(t).split(' ').map((q) => (q.length > 3 ? q.replace(/(?:es|s)$/, '') : q)).join(' ');
    const COCCION = /(?:plancha|horno|hervid|frit|asad|cocid|crud|revuelt|guisad|saltead|grill|baked|boiled|fried|roast|cooked|raw|scrambled)/;
    const cambiaElNumero = (a, b) => { const d = Math.abs(a - b); return d >= 40 || (d >= 15 && d >= 0.15 * Math.max(a, b)); };

    function itemDicho(a, dicho, L, ultimas) {
      const porciones = a.p.map((q, i) => ({ nombre: porcionDe(a, i, L), gramos: q[2], i }));
      if (dicho.cantidad != null && dicho.medida) {
        const medida = Buscar.normalizar('1 ' + dicho.medida);
        const propia = porciones.find((q) => { const x = Buscar.normalizar(q.nombre); return x === medida || x.startsWith(medida + ' '); });
        if (propia) return { item: { alimento: a.id, porcion: propia.i, veces: dicho.cantidad }, supuesto: false };
      }
      if (dicho.cantidad != null && (dicho.unidad || dicho.tamano)) {
        const gr = RecetaDeTexto.gramosDeLinea(dicho, { porciones, densidad: null });
        if (gr) return { item: { alimento: a.id, gramos: Math.round(gr) }, supuesto: false };
      }
      if (dicho.cantidad != null) {
        if (dicho.cantidad >= 20) return { item: { alimento: a.id, gramos: dicho.cantidad }, supuesto: false };
        const palabra = llano(dicho.buscado).split(' ')[0];
        const una = porciones.find((q) => /^1\s/.test(q.nombre) && llano(q.nombre).split(' ')[1] === palabra)
          || porciones.find((q) => /^1\s+(?:unidad|mediana?o?|grande|pieza|rebanada|porci[oó]n t[ií]pica|medium|large|piece|slice)/i.test(q.nombre));
        return { item: { alimento: a.id, porcion: una ? una.i : a.d, veces: dicho.cantidad }, supuesto: false };
      }
      const ultima = ultimas.get(a.id);
      if (ultima) return { item: { ...ultima, alimento: a.id }, supuesto: false };
      const chica = dicho.acompanante ? porciones.slice().sort((x, y) => x.gramos - y.gramos)[0] : null;
      return { item: { alimento: a.id, porcion: chica ? chica.i : a.d, veces: 1 }, supuesto: true };
    }
    function entenderDicho(dicho, L, conocidos, ultimas) {
      const buscado = llano(dicho.buscado);
      const exacto = (r) => llano(nombreDe(r.a, L)) === buscado || llano(r.coincide) === buscado;
      const res = buscar(dicho.buscado, L, conocidos).sort((x, y) => Number(exacto(y)) - Number(exacto(x)));
      if (!res.length) return { dicho, opciones: [], elegida: 0, pregunta: null, supuesto: false };
      const top = res[0].a;
      const { item, supuesto } = itemDicho(top, dicho, L, ultimas);
      const sola = { dicho, opciones: [item], elegida: 0, pregunta: null, supuesto };
      if (!exacto(res[0]) && !conocidos.has(top.id)) {
        const cabeza = buscado.split(' ')[0];
        const parecidos = res.slice(1).filter((r) => { const q = llano(nombreDe(r.a, L)).split(' '); return q[0] === cabeza && q.length <= 3 && !q.includes('con'); }).slice(0, 2);
        const opciones = [item, ...parecidos.map((r) => itemDicho(r.a, dicho, L, ultimas).item)];
        if (opciones.some((o) => cambiaElNumero(kcalDe(o), kcalDe(item)))) return { ...sola, opciones, pregunta: 'cual' };
      }
      if ((item.gramos != null || dicho.medida) && dicho.unidad && !COCCION.test(buscado)) {
        const otro = porNombre.get(top.es.replace(/cocid([oa])/, 'crud$1')) || porNombre.get(top.es.replace(/crud([oa])/, 'cocid$1'));
        if (otro && otro !== top) {
          const alterna = item.gramos != null ? { alimento: otro.id, gramos: item.gramos } : itemDicho(otro, dicho, L, ultimas).item;
          if (cambiaElNumero(kcalDe(alterna), kcalDe(item))) return { ...sola, opciones: [item, alterna], pregunta: 'crudo' };
        }
      }
      if (supuesto && item.porcion != null) {
        const opciones = [0.5, 1, 1.5].map((veces) => ({ ...item, veces }));
        if (opciones.some((o) => cambiaElNumero(kcalDe(o), kcalDe(item)))) return { ...sola, opciones, elegida: 1, pregunta: 'cuanto' };
      }
      return sola;
    }
    // Por comida, en el orden del día (lo de ayer primero).
    function gruposDichos(filas) {
      const gs = [];
      filas.forEach((f) => {
        const clave = (f.x.ayer ? 'ayer:' : 'hoy:') + f.x.comida;
        let gr = gs.find((y) => y.clave === clave);
        if (!gr) gs.push((gr = { clave, comida: f.x.comida, ayer: f.x.ayer, filas: [] }));
        gr.filas.push(f);
      });
      return gs.sort((a, b) => Number(b.ayer) - Number(a.ayer) || Comidas.COMIDAS.indexOf(a.comida) - Comidas.COMIDAS.indexOf(b.comida));
    }

    // Lo que la persona guardó en esta galería, por idioma: el nombre se dice en uno.
    const recetasDe = { es: [], en: [] };
    const listo = (x) => !!x.receta || x.opciones.length > 0;
    const escalar = (v, f) => ({ kcal: v.kcal * f, p: v.p * f, c: v.c * f, g: v.g * f });
    const valoresDeFila = (x) => (x.receta ? escalar(sumarValores(x.receta.filas.map((f) => valoresDe(f.item))), x.veces) : valoresDe(x.opciones[x.elegida]));

    /** La frase, en filas: cada cosa con su comida, el plato del que es parte (`plato`, un número) y lo tuyo por su nombre. */
    function leer(frase, L) {
      const recientes = comidaSec.recientes(60);
      const conocidos = new Set(recientes.map((r) => r.id));
      const ultimas = new Map(recientes.map((r) => [r.id, r.item]));
      const conNombre = new Set(Frase.conCon(frase, L).filter((b) => { const r = buscar(b, L, conocidos)[0]; return r && Frase.mismoNombre(r.coincide, b); }));
      const recetas = recetasDe[L];
      const leida = Frase.leerFrase(frase, L, (b) => conNombre.has(b), recetas.map((r) => r.nombre));
      let plato = 0;
      let antes = null;
      return Frase.porComida(leida.grupos, comidaSec.comidaDeAhora()).flatMap((gr) => gr.dichos.map((d) => {
        if (d.grupo !== antes) { antes = d.grupo; if (d.grupo) plato++; }
        const base = d.tuyo != null && recetas[d.tuyo]
          ? { dicho: d, receta: recetas[d.tuyo], veces: d.cantidad > 0 ? d.cantidad : 1 }
          : entenderDicho(d, L, conocidos, ultimas);
        return { ...base, comida: gr.comida, ayer: gr.ayer, plato: d.grupo ? plato : 0, registro: [] };
      }));
    }
    /** «Batido de la mañana», para decirlo por su nombre: lo que lleva la frase de ejemplo. */
    function asegurarEjemplo(L) {
      const P = PALABRAS[L];
      if (recetasDe[L].some((r) => r.nombre === P.guardadoComo)) return;
      const filas = leer(P.frase, L).filter((x) => x.plato && !x.receta && x.opciones.length);
      recetasDe[L].push({ nombre: P.guardadoComo, filas: filas.map((x) => ({ item: { ...x.opciones[x.elegida] } })) });
    }

    // ------------------------------------------------------------ la pantalla
    let s = null;
    let n = null;
    let actual = null;

    function armar(lengua, forma) {
      const u = Util.crear({ ...g.opciones, idioma: () => lengua });
      const { el, boton, tx } = u;
      s = { lengua, forma, u, P: PALABRAS[lengua], escuchando: false, lista: null, entendido: null, guardando: 0, guardados: new Map() };
      p.el.innerHTML = '';
      p.el.lang = lengua;
      p.el.className = p.el.className.replace(/\s*dme-(?:v-\S+|escucha|se-va)/g, '') + ' dme-v-' + forma;

      const hoja = el('div', 'dme-hoja');
      const cab = el('header', 'hj-sub-cab');
      cab.append(boton('hj-atras', Util.icono('atras'), () => g.ver('decirMejor', null), tx('comun.cancelar')), el('span', 'hj-sub-titulo', tx('comida.decir.titulo')), el('span'));
      const cuerpo = el('div', 'hj-cuerpo dme-cuerpo');
      const lugar = el('div', 'dme-mic-lugar');
      lugar.innerHTML = `<span class="dme-respira"></span><span class="dme-onda"></span><svg class="dme-aro" viewBox="0 0 100 100" aria-hidden="true"><circle class="dme-aro-pista" cx="50" cy="50" r="46"/><circle class="dme-aro-trazo" cx="50" cy="50" r="46"/></svg>`;
      const mic = boton('dme-mic', Util.icono('microfono').replace('<svg', '<svg class="dme-i-mic"') + ICONO_PARAR, () => (s.escuchando ? soltar(true) : tocar({ escribir: true })), tx('comida.decir.hablar'));
      lugar.appendChild(mic);
      const ayuda = el('p', 'dc-ayuda dme-ayuda');
      const lasBarras = el('span', 'dme-barras');
      lasBarras.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 5; i++) lasBarras.appendChild(el('i'));
      const ayudaTexto = el('span', 'dme-ayuda-texto', tx('comida.decir.ayuda'));
      ayuda.append(lasBarras, ayudaTexto);
      const area = el('textarea', 'hj-pegar-area dc-area');
      area.rows = 3;
      area.placeholder = tx('comida.decir.ejemplo');
      area.setAttribute('aria-label', tx('comida.decir.titulo'));
      area.addEventListener('input', () => pintarPie());
      const resultado = el('div', 'dme-resultado');
      cuerpo.append(lugar, ayuda, area, resultado);

      const pie = el('footer', 'fi-pie dme-pie');
      const entender = boton('fi-secundario', tx('comida.decir.entender'), () => entenderAhora());
      const agregar = boton('fi-agregar dme-oculto', '', () => agregarLoEntendido());
      pie.append(entender, agregar);
      hoja.append(el('div', 'dme-asa'), cab, cuerpo, pie);
      p.el.appendChild(hoja);
      n = { mic, ayudaTexto, barras: lasBarras, area, resultado, cuerpo, entender, agregar, respira: lugar.querySelector('.dme-respira'), trazo: lugar.querySelector('.dme-aro-trazo') };
      pintarPie();
    }

    function pintarPie() {
      const { tx, numero } = s.u;
      const listos = s.lista && s.entendido === n.area.value.trim() ? s.lista.filter(listo) : [];
      n.entender.classList.toggle('dme-oculto', listos.length > 0);
      n.agregar.classList.toggle('dme-oculto', !listos.length);
      n.entender.disabled = !!s.escuchando || !n.area.value.trim();
      if (!listos.length) return;
      // Con una comida, «Agregar a la cena» (la de la hora, si no se dijo otra); con varias, «Agregar todo».
      const gs = gruposDichos(listos.map((x) => ({ x })));
      const una = gs.length === 1 ? gs[0] : null;
      const que = !una ? tx('comida.decir.agregarTodo')
        : una.ayer ? tx('comida.agregarADia.ayer', { aLa: tx('comida.aLa.' + una.comida), comida: tx('comida.comidas.' + una.comida).toLowerCase() })
          : tx('comida.agregarA.' + una.comida);
      n.agregar.textContent = `${que} · ${numero(Math.round(sumarValores(listos.map(valoresDeFila)).kcal))} kcal`;
    }
    function ponerAyuda(clave) {
      const nuevo = s.u.el('span', 'dme-ayuda-texto', s.u.tx(clave));
      n.ayudaTexto.replaceWith(nuevo);
      n.ayudaTexto = nuevo;
    }

    // ------------------------------------------------------------ el micrófono
    // El toque: el botón cede, el ícono pasa a «parar» y sale la onda, las barras o el aro (todo en el CSS). Un
    // dictado nuevo corta al anterior, y lo de antes se va con su animación: decir de nuevo empieza de cero.
    function tocar({ escribir }) {
      g.haptico('suave');
      pararDictado();
      s.escuchando = true;
      [n.respira, n.trazo].forEach((nodo) => nodo.getAnimations().forEach((a) => { if (!(a instanceof CSSAnimation)) a.cancel(); }));
      n.mic.classList.remove('dme-cede');
      void n.mic.offsetWidth;
      if (!reducido()) n.mic.classList.add('dme-cede');
      p.el.classList.add('dme-escucha');
      n.mic.setAttribute('aria-label', s.u.tx('comida.decir.parar'));
      ponerAyuda('comida.decir.teEscucho');
      if (s.forma === 'barras') moverBarras();
      vaciar();
      pintarPie();
      if (!escribir) return;
      const frase = s.P.frase;
      let i = 0;
      // Lo dicho llega a medida que se habla, como el dictado de iOS.
      esperaDictado = setTimeout(() => {
        dictado = setInterval(() => {
          i = Math.min(frase.length, i + 3);
          n.area.value = frase.slice(0, i);
          if (i < frase.length) return;
          pararDictado();
          esperaDictado = setTimeout(() => soltar(false), 450);
        }, 55);
      }, 650);
    }

    // Al parar, lo que se abrió se recoge desde donde estaba: el aro que respira vuelve al botón, el trazo se deshace.
    // Queda donde termina, que es lo mismo que el CSS sin escuchar; el próximo toque lo quita. Como en el teléfono, al
    // terminar se entiende lo que se dijo hasta ahí.
    function soltar(tocado) {
      if (tocado) g.haptico('suave');
      pararDictado();
      s.escuchando = false;
      const animar = (nodo, propiedad, hasta) => {
        const desde = getComputedStyle(nodo)[propiedad];
        return () => nodo.animate([{ [propiedad]: desde }, { [propiedad]: hasta }], { duration: 340, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)', fill: 'forwards' });
      };
      const pasos = reducido() ? [] : s.forma === 'onda'
        ? [animar(n.respira, 'opacity', '0'), animar(n.respira, 'transform', 'scale(0.94)')]
        : s.forma === 'aro' ? [animar(n.trazo, 'strokeDashoffset', String(VUELTA))] : [];
      p.el.classList.remove('dme-escucha');
      pasos.forEach((animacion) => animacion());
      n.mic.setAttribute('aria-label', s.u.tx('comida.decir.hablar'));
      ponerAyuda('comida.decir.ayuda');
      pintarPie();
      if (n.area.value.trim()) esperaDictado = setTimeout(() => entenderAhora(), 380);
    }

    // Las barras siguen la voz: altas mientras llegan palabras, bajas en las pausas.
    function moverBarras() {
      const alturas = [0.35, 0.7, 1, 0.55, 0.3, 0.85, 0.45, 0.95, 0.6, 0.25];
      let k = 0;
      let largo = n.area.value.length;
      clearInterval(barras);
      barras = setInterval(() => {
        const habla = s.escuchando && n.area.value.length !== largo;
        largo = n.area.value.length;
        [...n.barras.children].forEach((b, i) => {
          b.style.height = s.escuchando ? `${4 + Math.round((habla || dictado ? 10 : 2) * alturas[(k + i * 3) % alturas.length])}px` : '4px';
        });
        k++;
      }, 110);
    }

    // Lo de antes sale con su animación: el texto se apaga y lo entendido se pliega.
    function vaciar() {
      const r = n.resultado;
      s.lista = null;
      s.entendido = null;
      if (r.firstChild) {
        const viejos = [...r.childNodes];
        if (reducido()) r.innerHTML = '';
        else {
          r.style.overflow = 'hidden';
          const a = r.animate([{ opacity: 1, height: `${r.offsetHeight}px` }, { opacity: 0, height: '0px' }], { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
          a.onfinish = () => { if (viejos.every((x) => x.parentNode === r)) r.innerHTML = ''; r.style.overflow = ''; };
        }
      }
      if (!n.area.value) return;
      if (reducido()) { n.area.value = ''; return; }
      const area = n.area;
      area.classList.add('dme-borrando');
      despues(200, () => { if (!area.classList.contains('dme-borrando')) return; area.value = ''; area.classList.remove('dme-borrando'); pintarPie(); });
    }

    // ------------------------------------------------------------ lo entendido
    function entenderAhora() {
      const frase = n.area.value.trim();
      if (!frase || s.escuchando) return;
      n.area.classList.remove('dme-borrando');
      s.lista = leer(frase, s.lengua);
      s.entendido = frase;
      s.guardando = 0;
      s.guardados = new Map();
      g.haptico('suave');
      n.resultado.classList.remove('dme-quieto');
      pintarResultado();
    }
    // Después de un cambio (−, +, ×, otra opción), lo que ya estaba no vuelve a entrar.
    function repintar() {
      n.resultado.classList.add('dme-quieto');
      pintarResultado();
    }

    function pintarResultado() {
      const { el, tx, numero } = s.u;
      const r = n.resultado;
      r.getAnimations().forEach((a) => a.cancel());
      r.style.overflow = '';
      r.innerHTML = '';
      const lista = s.lista || [];
      if (s.lista && !lista.length) r.appendChild(el('p', 'hj-pegar-texto', tx('comida.decir.nada')));
      const orden = gruposDichos(lista.map((x) => ({ x })));
      orden.forEach((gr) => {
        if (orden.length > 1) {
          const nombre = tx('comida.comidas.' + gr.comida);
          const titulo = gr.ayer ? tx('comida.decir.grupoAyer', { comida: nombre }) : nombre;
          const kcal = sumarValores(gr.filas.filter(({ x }) => listo(x)).map(({ x }) => valoresDeFila(x))).kcal;
          r.appendChild(el('h4', 'hj-titulo dc-grupo', `${titulo} · ${numero(Math.round(kcal))} kcal`));
        }
        // Lo de un mismo plato va junto, con su nombre y su total.
        let k = 0;
        while (k < gr.filas.length) {
          const { x } = gr.filas[k];
          if (!x.plato) { r.appendChild(x.receta ? filaDeReceta(x) : fila(x)); k++; continue; }
          const juntas = [];
          while (k < gr.filas.length && gr.filas[k].x.plato === x.plato) juntas.push(gr.filas[k++].x);
          r.appendChild(platoDe(juntas));
        }
      });
      pintarPie();
    }

    /** Una cosa entendida, como en el «Decir» de la galería: su cantidad con − y +, quitarla y, si hace falta, la pregunta. */
    function fila(x, i = 0) {
      const { el, boton, tx, numero } = s.u;
      const L = s.lengua;
      const bloque = el('div', 'dc-bloque');
      bloque.style.animationDelay = `${60 + i * 45}ms`;
      const f = el('div', 'dc-fila');
      const textos = el('div', 'hj-fila-txt');
      const it = x.opciones[x.elegida];
      if (!it) {
        textos.append(el('b', 'dc-sin', tx('comida.decir.noEncontre', { que: x.dicho.buscado })), boton('dc-buscar', tx('comida.decir.buscar'), () => buscarloEnLaGaleria(x.dicho.buscado)));
        f.append(textos, boton('rv-quitar', Util.icono('cerrar'), () => quitar(x, bloque), tx('comida.quitar')));
        bloque.appendChild(f);
        return bloque;
      }
      const nombre = nombreDeItem(it, L);
      const detalle = el('span', null, `${cantidadDe(it, L)} · ${numero(Math.round(kcalDe(it)))} kcal`);
      if (x.supuesto) detalle.appendChild(el('em', 'dc-supuesto', ` · ${tx('comida.decir.supuesto')}`));
      textos.append(el('b', null, nombre), detalle);
      const pasos = el('div', 'dc-pasos');
      pasos.append(boton('fi-paso', Util.icono('menos'), () => mover(x, -1), tx('comun.menos', { que: nombre })), boton('fi-paso', Util.icono('mas'), () => mover(x, 1), tx('comun.mas', { que: nombre })));
      f.append(textos, pasos, boton('rv-quitar', Util.icono('cerrar'), () => quitar(x, bloque), tx('comida.quitar')));
      bloque.appendChild(f);
      if (x.pregunta) {
        const gr = x.opciones[0].gramos;
        const crudo = gr != null ? tx('comida.decir.crudo', { gramos: numero(gr) }) : tx('comida.decir.crudoMedida');
        bloque.appendChild(el('p', 'dc-pregunta', x.pregunta === 'crudo' ? crudo : tx(x.pregunta === 'cual' ? 'comida.decir.cual' : 'comida.decir.cuanto', { que: x.dicho.buscado })));
        const chips = el('div', 'fi-porciones dc-opciones');
        x.opciones.forEach((o, k) => {
          const b = boton('fi-porcion', `<span>${x.pregunta === 'cuanto' ? cantidadDe(o, L) : nombreDeItem(o, L)}</span><small>${numero(Math.round(kcalDe(o)))} kcal</small>`, () => {
            x.elegida = k;
            x.registro.push({ elegir: k });
            g.haptico('suave');
            repintar();
          });
          b.setAttribute('aria-pressed', String(k === x.elegida));
          chips.appendChild(b);
        });
        bloque.appendChild(chips);
      }
      return bloque;
    }

    /** Un paso más o menos, como en el «Decir» de la galería: las porciones de a una (o media), los gramos de a 10. */
    function mover(x, signo) {
      const o = x.receta ? x : x.opciones[x.elegida];
      if (o.gramos != null) o.gramos = Math.max(1, o.gramos + 10 * signo);
      else o.veces = signo > 0 ? (o.veces < 1 ? Math.min(1, o.veces + 0.5) : Math.floor(o.veces) + 1) : (o.veces > 1 ? Math.ceil(o.veces) - 1 : o.veces > 0.5 ? 0.5 : 0.25);
      x.supuesto = false;
      if (!x.receta) x.registro.push({ signo });
      g.haptico('suave');
      repintar();
    }

    // Lo quitado se pliega; si era lo último de su plato, se va el plato entero.
    function quitar(x, bloque) {
      g.haptico('suave');
      const solo = x.plato && s.lista.filter((y) => y.plato === x.plato).length === 1;
      const nodo = (solo && bloque.closest('.dme-plato')) || bloque;
      const fuera = () => { s.lista.splice(s.lista.indexOf(x), 1); repintar(); };
      if (reducido()) { nodo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).onfinish = fuera; return; }
      nodo.style.overflow = 'hidden';
      nodo.animate([{ opacity: 1, height: `${nodo.offsetHeight}px` }, { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px' }], { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).onfinish = fuera;
    }

    // El plato dicho con lo que lleva: su nombre, su total, lo suyo y, debajo, «Guardar como receta».
    function platoDe(filas) {
      const { el, boton, numero } = s.u;
      const P = s.P;
      const id = filas[0].plato;
      const guardado = s.guardados.get(id);
      const sec = el('section', 'dme-plato' + (s.guardando === id ? ' dme-guardando' : '') + (guardado ? ' dme-guardado' : ''));
      const cab = el('div', 'dme-plato-cab');
      const titulo = el('b', null, guardado || Buscar.conMayuscula(filas[0].dicho.grupo));
      const total = sumarValores(filas.filter(listo).map(valoresDeFila)).kcal;
      cab.append(titulo, el('span', null, `${numero(Math.round(total))} kcal`));
      const lista = el('div', 'dme-plato-lista');
      filas.forEach((x, i) => lista.appendChild(x.receta ? filaDeReceta(x) : fila(x, i)));

      const lugar = el('div', 'dme-guardar-lugar');
      const abrirCampo = boton('dme-guardar-b', Util.icono('guardadas') + `<span>${P.guardarComoReceta}</span>`, () => {
        s.guardando = id;
        sec.classList.add('dme-guardando');
        entrada.focus({ preventScroll: true });
        entrada.select();
        bajarHasta(lugar);
      });
      const campo = el('div', 'dme-campo dme-plegable');
      const dentro = el('div');
      const etiqueta = el('label', null, P.nombre);
      const idCampo = `dme-nombre-${s.lengua}-${id}`;
      etiqueta.htmlFor = idCampo;
      const entrada = el('input');
      entrada.id = idCampo;
      entrada.value = guardado || Buscar.conMayuscula(filas[0].dicho.grupo);
      entrada.enterKeyHint = 'done';
      entrada.autocomplete = 'off';
      const guardar = () => {
        const nombre = entrada.value.trim() || Buscar.conMayuscula(filas[0].dicho.grupo);
        g.haptico('suave');
        entrada.blur();
        guardarReceta(id, nombre);
        titulo.textContent = nombre;
        titulo.classList.remove('dme-cambia');
        void titulo.offsetWidth;
        titulo.classList.add('dme-cambia');
        texto.replaceChildren(...partesDeGuardada(nombre));
        sec.classList.remove('dme-guardando');
        sec.classList.add('dme-guardado');
      };
      entrada.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') guardar(); });
      const filaCampo = el('div', 'dme-campo-fila');
      filaCampo.append(entrada, boton('dme-guardar-ok', P.guardar, guardar));
      dentro.append(etiqueta, filaCampo);
      campo.appendChild(dentro);
      const hecho = el('div', 'dme-hecho dme-plegable');
      hecho.setAttribute('role', 'status');
      const texto = el('span');
      if (guardado) texto.append(...partesDeGuardada(guardado));
      const parrafo = el('p');
      parrafo.innerHTML = Util.icono('listo');
      parrafo.appendChild(texto);
      hecho.appendChild(el('div')).appendChild(parrafo);
      lugar.append(abrirCampo, campo, hecho);
      sec.append(cab, lista, lugar);
      return sec;
    }
    function guardarReceta(id, nombre) {
      const L = s.lengua;
      const filas = s.lista.filter((x) => x.plato === id && !x.receta && x.opciones.length);
      const receta = { nombre, filas: filas.map((x) => ({ item: { ...x.opciones[x.elegida] } })) };
      // Si ya había una con ese nombre, queda la última.
      recetasDe[L] = [receta, ...recetasDe[L].filter((r) => Buscar.normalizar(r.nombre) !== Buscar.normalizar(nombre))];
      s.guardados.set(id, nombre);
      s.guardando = 0;
    }
    function partesDeGuardada(nombre) {
      const [antes, despuesDe] = s.P.guardada.split('{nombre}');
      return [document.createTextNode(antes), s.u.el('b', null, nombre), document.createTextNode(despuesDe)];
    }
    // Bajar hasta algo es suave, también cuando crece el campo.
    function bajarHasta(nodo) {
      despues(reducido() ? 0 : 180, () => {
        const falta = nodo.getBoundingClientRect().bottom - n.cuerpo.getBoundingClientRect().bottom + 16;
        if (falta > 0) n.cuerpo.scrollBy({ top: falta, behavior: reducido() ? 'auto' : 'smooth' });
      });
    }

    // Lo tuyo, dicho por su nombre: una fila con su total; la flecha muestra lo que lleva.
    function filaDeReceta(x) {
      const { el, boton, tx, numero } = s.u;
      const L = s.lengua;
      const P = s.P;
      const r = x.receta;
      const bloque = el('div', 'dc-bloque dme-tuya' + (x.abierta ? ' dme-abierta' : ''));
      const f = el('div', 'dc-fila');
      const abrir = el('button', 'dme-abrir');
      abrir.type = 'button';
      abrir.setAttribute('aria-label', `${r.nombre}: ${P.verLoQueLleva}`);
      abrir.setAttribute('aria-expanded', String(!!x.abierta));
      const textos = el('span', 'hj-fila-txt');
      const nombre = el('span', 'dme-nombre');
      nombre.append(el('b', null, r.nombre));
      nombre.insertAdjacentHTML('beforeend', Util.icono('abajo').replace('<svg', '<svg class="dme-flecha"'));
      const veces = x.veces === 1 ? '' : ` · ×${Porciones.decimal(x.veces, L)}`;
      textos.append(nombre, el('span', null, `${P.tuReceta}${veces} · ${numero(Math.round(valoresDeFila(x).kcal))} kcal`));
      abrir.appendChild(textos);
      abrir.addEventListener('click', (ev) => {
        ev.stopPropagation();
        g.haptico('suave');
        x.abierta = !x.abierta;
        bloque.classList.toggle('dme-abierta', x.abierta);
        abrir.setAttribute('aria-expanded', String(x.abierta));
      });
      const pasos = el('div', 'dc-pasos');
      pasos.append(boton('fi-paso', Util.icono('menos'), () => mover(x, -1), tx('comun.menos', { que: r.nombre })), boton('fi-paso', Util.icono('mas'), () => mover(x, 1), tx('comun.mas', { que: r.nombre })));
      f.append(abrir, pasos, boton('rv-quitar', Util.icono('cerrar'), () => quitar(x, bloque), tx('comida.quitar')));
      const lleva = el('div', 'dme-lleva dme-plegable');
      const ul = el('ul');
      r.filas.forEach(({ item }) => {
        const li = el('li', null, nombreDeItem(item, L));
        li.appendChild(el('span', null, `${cantidadDe(item, L)} · ${numero(Math.round(kcalDe(item)))} kcal`));
        ul.appendChild(li);
      });
      lleva.appendChild(el('div')).appendChild(ul);
      bloque.append(f, lleva);
      return bloque;
    }

    // ------------------------------------------------------------ «Agregar» y «Buscarlo», con la galería de verdad
    function agregarLoEntendido() {
      const listos = s.lista ? s.lista.filter(listo) : [];
      if (!listos.length) return;
      g.haptico('suave');
      const mismoIdioma = s.lengua === g.idioma;
      // Lo tuyo va como una sola cosa, con su nombre, como en la app; en otro idioma que el de la galería, todo así.
      const sueltas = listos.filter((x) => x.receta || !mismoIdioma);
      const nombreDeFila = (x) => (x.receta ? x.receta.nombre : nombreDeItem(x.opciones[x.elegida], s.lengua));
      const anotadas = sueltas.map((x) => comidaSec.registrarRapida(valoresDeFila(x), nombreDeFila(x))).filter(Boolean);
      const deLaBase = listos.filter((x) => !sueltas.includes(x));
      const conSuAviso = deLaBase.length > 0 && anotarConElDecir(deLaBase);
      if (!conSuAviso && anotadas.length) {
        avisarEnComida(s.u.plural('comida.decir.anotado', anotadas.length, { comida: s.u.tx('comida.aLa.' + anotadas[0].tipo) }), () => anotadas.forEach((a) => a.deshacer()));
      }
      irse();
    }

    // El «Decir» de la galería, abajo de esta pantalla: entiende la misma frase, se le repite lo que se cambió acá
    // (cada fila de acá con la suya de allá, por el nombre; lo que allá sobra se quita) y se toca su «Agregar», que
    // anota en la comida, cierra su hoja y avisa con «Deshacer».
    function anotarConElDecir(mias) {
      if (comidaSec.hojaAbierta || !comidaSec.abrirHoja({})) return false;
      comidaSec.decir({ texto: s.entendido });
      const sub = g.tel.querySelector('.hoja .hj-decir');
      if (!sub) { comidaSec.cerrarHoja(); return false; }
      const bloques = () => [...sub.querySelectorAll('.dc-resultado .dc-bloque')];
      const nombres = bloques().map((b) => (b.querySelector('.hj-fila-txt b') || {}).textContent || '');
      const usadas = new Set();
      mias.forEach((x) => {
        const k = nombres.findIndex((nombre, i) => !usadas.has(i) && nombre === nombreDeItem(x.opciones[0], s.lengua));
        if (k < 0) return;
        usadas.add(k);
        x.registro.forEach((paso) => {
          const b = bloques()[k];
          const control = paso.elegir != null ? b.querySelectorAll('.fi-porcion')[paso.elegir] : b.querySelectorAll('.dc-pasos .fi-paso')[paso.signo > 0 ? 1 : 0];
          if (control) control.click();
        });
      });
      for (let k = nombres.length - 1; k >= 0; k--) {
        if (usadas.has(k)) continue;
        const quitarAlla = bloques()[k].querySelector('.rv-quitar');
        if (quitarAlla) quitarAlla.click();
      }
      const agregarAlla = sub.querySelector('.fi-pie .fi-agregar');
      if (!agregarAlla || agregarAlla.hidden) { comidaSec.cerrarHoja(); return false; }
      agregarAlla.click();
      return true;
    }
    // El aviso de Comida, como el de su «Decir», para lo que se anotó sin él.
    function avisarEnComida(texto, deshacer) {
      const a = comidaSec.zona.querySelector('.cm-aviso');
      if (!a) return;
      a.querySelector('span').textContent = texto;
      const viejo = a.querySelector('button');
      if (viejo) viejo.remove();
      a.appendChild(s.u.boton('cm-aviso-btn', s.u.tx('comun.deshacer'), () => { a.classList.remove('visible'); deshacer(); }));
      a.classList.add('visible');
      setTimeout(() => a.classList.remove('visible'), 3200);
    }
    // La hoja baja y queda Comida, con lo anotado llegando y su aviso.
    function irse() {
      calmar();
      g.irA(1, true);
      p.el.classList.add('dme-se-va');
      despues(reducido() ? 170 : 400, () => g.ver('decirMejor', null));
    }
    function buscarloEnLaGaleria(que) {
      g.ver('decirMejor', null);
      if (comidaSec.abrirHoja({})) comidaSec.escribir(que);
    }

    // ------------------------------------------------------------ las vistas
    function abrirVista(vista, arg) {
      calmar();
      actual = { vista, arg };
      const forma = FORMAS[vista];
      const L = vista === 'en' ? 'en' : g.idioma;
      armar(L, forma || 'onda');
      p.abrir();
      if (forma) {
        if (arg === 'toque') tocar({ escribir: false });
        else if (arg === 'escuchando') {
          tocar({ escribir: false });
          n.area.value = A_MEDIAS[L];
          pintarPie();
        } else if (arg !== 'quieto') despues(700, () => tocar({ escribir: true }));
        return;
      }
      if (vista === 'nombre' || arg === 'nombre') {
        asegurarEjemplo(L);
        n.area.value = s.P.fraseNombre;
        entenderAhora();
        const tuya = s.lista.find((x) => x.receta);
        if (tuya && arg === 'abierta') { tuya.abierta = true; pintarResultado(); }
        return;
      }
      n.area.value = s.P.frase;
      entenderAhora();
      const id = (s.lista.find((x) => x.plato) || {}).plato;
      if (!id || (vista !== 'guardar' && vista !== 'guardado')) return;
      if (vista === 'guardado') guardarReceta(id, s.P.guardadoComo);
      else s.guardando = id;
      pintarResultado();
      n.cuerpo.scrollTop = n.cuerpo.scrollHeight;
      const entrada = n.resultado.querySelector('.dme-campo input');
      if (vista === 'guardar' && entrada) { entrada.focus({ preventScroll: true }); entrada.select(); }
    }

    // Cambiar el idioma con la propuesta abierta la vuelve a pintar (la de inglés ya está en inglés).
    const idiomas = document.getElementById('s-idioma');
    if (idiomas) idiomas.addEventListener('click', () => setTimeout(() => { if (actual && p.abierta && actual.vista !== 'en') abrirVista(actual.vista, actual.arg); }, 0));

    return {
      // `arg`, para las capturas: en el micrófono, 'quieto', 'toque' o 'escuchando'; en «nombre», 'abierta'; en «en»,
      // 'nombre'. Sin `arg`, el micrófono se toca solo, escucha la frase y la entiende.
      abrir: abrirVista,
      cerrar() {
        const seVa = p.el.classList.contains('dme-se-va');
        calmar();
        actual = null;
        p.cerrar(seVa);
      },
    };
  },
});
