// La comida en la galería, para aprobar antes de programarla (etapas 5 y 7 del plan):
// - la pestaña Comida: lo comido contra la meta, la línea del día, la semana y el mes;
// - la hoja de registro: la búsqueda, la ventana del alimento, la comida que se arma y el teclado;
// - la revisión de la etiqueta (etapa 6), con el lector de verdad (Etiqueta, src/comida/etiqueta.ts);
// - lo que usan Inicio y la hoja del «+»: los totales, los recientes, las guardadas, el agua y
//   registrar de un toque.
// El día es de mentira, pero los alimentos, sus valores y sus porciones salen de
// assets/alimentos.db (ALIMENTOS), y la búsqueda, las cantidades y la comida de cada hora usan los
// mismos módulos que la app (Buscar, Porciones y Comidas: los arma construir.mjs desde src/).

const Comida = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  // Uruguay, a las 21:47 del miércoles 21 de octubre: lo mismo que el resto de la galería.
  const REGION = 'UY';
  const AHORA = 21 * 60 + 47;
  const HOY = [2026, 9, 21];
  // Los días de mentira: del lunes 28 de septiembre al domingo 1 de noviembre (el mes entero, de lunes a domingo).
  const PRIMER_DIA = -23;
  const ULTIMO_DIA = 11;
  // La meta la pone el control del lunes (galeria.js, con Control.controlSemanal); esta es solo la de arranque.
  const META = { kcal: 2610, p: 150, c: 327, g: 78 };
  const VASO_L = 0.25;
  const VASOS_META = 8;
  // A qué hora suele caer cada comida, para el hueco de la que falta.
  const HORA_TIPICA = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };

  // Cada alimento del día: [nombre en español, veces, porción (sin porción, la de siempre)].
  const DIAS = {
    '-1': [
      { tipo: 'desayuno', hora: 8 * 60 + 25, items: [['Café con leche', 1], ['Croissant', 2], ['Dulce de leche', 1], ['Jugo de naranja', 1]] },
      { tipo: 'almuerzo', hora: 13 * 60 + 10, items: [['Arroz blanco cocido', 1.5], ['Pechuga de pollo a la plancha', 2], ['Ensalada mixta', 1], ['Aceite de oliva', 1]] },
      { tipo: 'merienda', hora: 17 * 60 + 40, items: [['Mate', 1], ['Bizcocho', 1], ['Pan tostado', 2], ['Queso crema', 1], ['Banana', 1]] },
      { tipo: 'cena', hora: 21 * 60 + 15, items: [['Pasta cocida', 2], ['Salsa de tomate', 1], ['Queso rallado', 2], ['Helado de vainilla', 1]] },
    ],
    0: [
      { tipo: 'desayuno', hora: 8 * 60 + 10, items: [['Café con leche', 1], ['Pan tostado', 2], ['Dulce de leche', 1], ['Banana', 1]] },
      { tipo: 'snack', hora: 11 * 60, items: [['Manzana', 1]] },
      { tipo: 'almuerzo', hora: 13 * 60 + 5, items: [['Milanesa', 1], ['Puré de papas', 1], ['Ensalada mixta', 1]] },
      { tipo: 'merienda', hora: 17 * 60 + 30, items: [['Mate', 1], ['Yogur con frutas', 1], ['Granola', 0.5]] },
    ],
    1: [
      { tipo: 'desayuno', hora: 8 * 60, plan: true, items: [['Avena cocida', 1], ['Banana', 1], ['Café con leche', 1]] },
      { tipo: 'almuerzo', hora: 13 * 60, plan: true, items: [['Arroz con pollo', 1.5], ['Ensalada mixta', 1]] },
    ],
  };
  // Antes de ayer: tres días tipo que se turnan, y dos días sin registrar (el domingo 4 y el sábado 10).
  const DIAS_TIPO = [
    DIAS['-1'],
    [
      { tipo: 'desayuno', hora: 8 * 60 + 20, items: [['Café con leche', 1], ['Pan tostado', 3], ['Queso crema', 1], ['Banana', 1], ['Huevo duro', 2]] },
      { tipo: 'almuerzo', hora: 13 * 60, items: [['Bistec', 1, 1], ['Arroz blanco cocido', 1.5], ['Ensalada mixta', 1], ['Aceite de oliva', 1]] },
      { tipo: 'merienda', hora: 17 * 60 + 30, items: [['Mate', 1], ['Yogur con frutas', 1], ['Granola', 0.5], ['Manzana', 1]] },
      { tipo: 'cena', hora: 21 * 60 + 10, items: [['Pasta cocida', 2], ['Salsa de tomate', 1], ['Queso rallado', 2], ['Helado de vainilla', 1]] },
    ],
    [
      { tipo: 'desayuno', hora: 8 * 60, items: [['Avena cocida', 1], ['Banana', 1], ['Café con leche', 1], ['Dulce de leche', 1]] },
      { tipo: 'almuerzo', hora: 13 * 60 + 15, items: [['Milanesa', 1], ['Puré de papas', 1], ['Ensalada mixta', 1]] },
      { tipo: 'merienda', hora: 17 * 60 + 45, items: [['Mate', 1], ['Pan tostado', 2], ['Queso crema', 1], ['Yogur con frutas', 1]] },
      { tipo: 'cena', hora: 21 * 60 + 30, items: [['Empanada de carne', 2], ['Ensalada mixta', 1]] },
    ],
  ];
  const SIN_REGISTRO = new Set([-17, -11]);
  const SUELES = {
    desayuno: [['Café con leche', 1], ['Pan tostado', 2], ['Dulce de leche', 1], ['Banana', 1]],
    almuerzo: [['Milanesa', 1], ['Puré de papas', 1], ['Arroz blanco cocido', 1], ['Ensalada mixta', 1]],
    merienda: [['Mate', 1], ['Yogur con frutas', 1], ['Granola', 0.5], ['Bizcocho', 1]],
    cena: [['Pasta cocida', 2], ['Bistec', 1, 1], ['Ensalada mixta', 1], ['Pizza de queso', 2]],
    snack: [['Manzana', 1], ['Banana', 1], ['Mandarina', 1], ['Yogur con frutas', 1]],
  };
  const FAVORITOS = [['Huevo duro', 2], ['Aguacate', 1], ['Arroz blanco cocido', 1], ['Pechuga de pollo a la plancha', 1.5], ['Atún en agua', 1]];
  const GUARDADAS = [
    { nombre: { es: 'Desayuno de siempre', en: 'Usual breakfast' }, items: [['Café con leche', 1], ['Pan tostado', 2], ['Dulce de leche', 1]] },
    { nombre: { es: 'Fideos con tuco', en: 'Pasta with tomato sauce' }, items: [['Pasta cocida', 2], ['Salsa de tomate', 1], ['Queso rallado', 2]] },
    { nombre: { es: 'Merienda con mate', en: 'Mate and cake' }, items: [['Mate', 1], ['Bizcocho', 1]] },
  ];
  // Cuántas veces se registró cada uno: el premio de la búsqueda (lo más usado primero).
  const USOS = { 'Mate': 55, 'Café con leche': 40, 'Pan tostado': 30, 'Banana': 22, 'Dulce de leche': 18, 'Ensalada mixta': 14, 'Manzana': 12, 'Huevo duro': 11,
    'Yogur con frutas': 10, 'Granola': 9, 'Arroz blanco cocido': 9, 'Pasta cocida': 8, 'Pechuga de pollo a la plancha': 8, 'Bistec': 7, 'Milanesa': 6, 'Aguacate': 6, 'Puré de papas': 5 };

  const ICONOS = {
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    codigo: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 9v6M11 9v6M13.5 9v6M16 9v6"/>',
    etiqueta: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4"/>',
    copiar: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5 15.5V6.5A1.5 1.5 0 0 1 6.5 5h9"/>',
    guardadas: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
    rayo: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
    camara: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
    estrella: '<path d="m12 3.8 2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>',
    atras: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    adelante: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    cerrar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    listo: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    vaso: '<path class="cm-nivel" d="M7.7 9.5h8.6l-.95 9.1a1 1 0 0 1-1 .9H9.65a1 1 0 0 1-1-.9z"/><path d="M6.5 4.5h11l-1.4 14.2a1.5 1.5 0 0 1-1.5 1.3H9.4a1.5 1.5 0 0 1-1.5-1.3z"/>',
    microfono: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3"/>',
    pesa: '<path d="M3.5 9.5v5M6.5 7.5v9M17.5 7.5v9M20.5 9.5v5M6.5 12h11"/>',
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/>',
    borrar: '<path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>',
    mayus: '<path d="M12 4.5 4.5 12H9v7h6v-7h4.5z"/>',
    chispa: '<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5zM18.5 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z"/>',
    corazon: '<path d="M12 19s-7-4.3-7-9.2A4 4 0 0 1 12 7.5a4 4 0 0 1 7 2.3C19 14.7 12 19 12 19z"/>',
    compras: '<path d="M5 6.5h14l-1.4 8.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8.5 6.5 9.5 4h5l1 2.5M9 19.5h.01M15 19.5h.01"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;

  // La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de entrada.js.
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }
  const salida = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
  // Lo secundario de cada alimento (ALIMENTOS[].s), en ese orden, con su unidad. El alcohol solo si hay.
  const SECUNDARIOS = [['fibra', 'g'], ['azucares', 'g'], ['saturadas', 'g'], ['sodio', 'mg'], ['alcohol', 'g']];
  const LETRA = { proteina: 'p', carbohidratos: 'c', grasas: 'g' };

  function crear(tel, escena, opciones) {
    const ALIMENTOS = opciones.alimentos || [];
    const porId = new Map(ALIMENTOS.map((a) => [a.id, a]));
    const porNombre = new Map(ALIMENTOS.map((a) => [a.es, a]));
    const esTactil = window.matchMedia('(pointer: coarse)').matches;
    let idioma = 'es';

    // ------------------------------------------------------------ textos y números
    const tx = (clave, vars) => {
      let s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma]);
      if (s == null) return clave;
      if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return s;
    };
    const plural = (clave, n, vars) => {
      const formas = tx(clave);
      return (n === 1 ? formas.uno : formas.otros).replace(/\{(\w+)\}/g, (_, k) => (k === 'n' ? n : vars && vars[k] != null ? vars[k] : ''));
    };
    const numero = (n, dec) => n.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    const hora = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };
    const boton = (clase, contenido, alTocar, etiqueta) => {
      const b = el('button', clase);
      b.type = 'button';
      b.dataset.toque = '';
      b.innerHTML = contenido;
      if (etiqueta) b.setAttribute('aria-label', etiqueta);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); alTocar(ev); });
      return b;
    };

    // ------------------------------------------------------------ alimentos y cantidades
    function nombreDe(a) {
      if (idioma === 'en') return a.en || a.es;
      // El nombre de la región, como src/comida/buscar.ts.
      const regional = a.t.find(([i, r, principal]) => i === 'es' && r === REGION && principal);
      return regional ? Buscar.conMayuscula(regional[3]) : a.es;
    }
    const porcionDe = (a, i) => (idioma === 'en' ? a.p[i][1] : a.p[i][0] || a.p[i][1]);
    // Un registro: { alimento, porcion, veces } o, si es por gramos, { alimento, gramos }; la carga
    // rápida trae sus propios valores.
    function item(nombre, veces, porcion) {
      const a = porNombre.get(nombre);
      if (!a) { console.warn('No está en la base:', nombre); return null; }
      return { alimento: a.id, porcion: porcion == null ? a.d : porcion, veces };
    }
    const gramosDe = (it) => (it.gramos != null ? it.gramos : porId.get(it.alimento).p[it.porcion][2] * it.veces);
    function valoresDe(it) {
      if (it.rapida) return { kcal: it.kcal, p: it.p, c: it.c, g: it.g };
      const [kcal, p, c, g] = porId.get(it.alimento).v;
      const f = gramosDe(it) / 100;
      return { kcal: kcal * f, p: p * f, c: c * f, g: g * f };
    }
    const sumar = (items) => items.reduce((s, it) => { const v = valoresDe(it); return { kcal: s.kcal + v.kcal, p: s.p + v.p, c: s.c + v.c, g: s.g + v.g }; }, { kcal: 0, p: 0, c: 0, g: 0 });
    const nombreDeItem = (it) => (it.rapida ? it.nombre || tx('comida.cargaRapida') : nombreDe(porId.get(it.alimento)));
    function cantidadDe(it) {
      if (it.rapida) return '';
      if (it.gramos != null) return `${Porciones.decimal(it.gramos, idioma)} g`;
      return Porciones.cantidadDePorcion(it.veces, porcionDe(porId.get(it.alimento), it.porcion), idioma);
    }

    // ------------------------------------------------------------ el estado de mentira
    const s = {
      dia: 0,
      dias: {},
      agua: {},
      // Día, semana o mes, como en MacroFactor.
      vista: 'dia',
      favoritos: new Set(),
      usos: new Map(),
      ultima: new Map(),
      enZona: false,
      hoja: null,
      // La comida que se arma en la hoja: queda hasta agregarla, aunque se cierre la hoja.
      canasta: [],
      // Las recetas guardadas desde un texto pegado: { nombre, porciones, items }.
      recetas: [],
      // Cuándo entrena (Perfil › Entrenamiento): pesas a las 19, una hora, todos los días; y si se ve la línea.
      entreno: { dias: [0, 1, 2, 3, 4, 5, 6], hora: 19 * 60, minutos: 60, tipo: 'fuerza' },
      verEntreno: true,
      // Los toques desde Inicio hasta registrar algo (se cuentan para comparar con la especificación).
      toques: 0,
      escribio: false,
      // Lo del cuestionario para armar las comidas (Plan.Preferencias) y lo tachado de la lista de compras.
      pref: { dieta: 'todo', alergias: [], comidas: 4, tiempo: 'normal', noMeGusta: [], meGusta: [] },
      compradas: new Set(),
      semilla: 0,
    };
    const armarDia = (comidas) => comidas.map((c) => Object.assign({}, c, { items: c.items.map(([n, v, p]) => item(n, v, p)).filter(Boolean) }));
    for (let k = PRIMER_DIA; k <= ULTIMO_DIA; k++) {
      const plantilla = k >= -1 ? DIAS[k] : SIN_REGISTRO.has(k) ? null : DIAS_TIPO[-k % DIAS_TIPO.length];
      s.dias[k] = plantilla ? armarDia(plantilla) : [];
      s.agua[k] = k === 0 ? 5 : k < 0 && plantilla ? 6 + ((-k * 7) % 4) : 0;
    }
    Object.values(s.dias).forEach((l) => l.forEach((c) => { if (c.plan) c.opcion = 'galeria:' + c.tipo; }));
    FAVORITOS.forEach(([n]) => { const a = porNombre.get(n); if (a) s.favoritos.add(a.id); });
    Object.entries(USOS).forEach(([n, veces]) => { const a = porNombre.get(n); if (a) s.usos.set(a.id, veces); });
    // La última porción de cada alimento: la de los días de mentira, del más viejo al más nuevo.
    ['-1', '0'].forEach((d) => s.dias[d].forEach((c) => c.items.forEach((it) => s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces }))));
    const comoSuele = ([n, v, p]) => { const it = item(n, v, p); if (it) s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces }); return it; };
    Object.values(SUELES).forEach((lista) => lista.forEach(comoSuele));
    FAVORITOS.forEach(comoSuele);

    const comidasDe = (d) => s.dias[String(d)] || [];
    const diaDe = (c) => Number(Object.keys(s.dias).find((d) => s.dias[d].includes(c)) || 0);
    const totalDe = (d) => sumar(comidasDe(d).flatMap((c) => c.items));

    // Una cifra que cuenta de lo que mostraba hasta la nueva.
    function contar(nodo, hasta, ms) {
      const desde = Number(nodo.dataset.valor || 0);
      nodo.dataset.valor = hasta;
      cancelAnimationFrame(Number(nodo.dataset.cuadro || 0));
      if (!ms) { nodo.textContent = numero(Math.round(hasta)); return; }
      const t0 = performance.now();
      const paso = (t) => {
        const k = salida((t - t0) / ms);
        nodo.textContent = numero(Math.round(desde + (hasta - desde) * k));
        if (k < 1) nodo.dataset.cuadro = requestAnimationFrame(paso);
      };
      nodo.dataset.cuadro = requestAnimationFrame(paso);
    }

    // ------------------------------------------------------------ la pestaña Comida
    // Como MacroFactor: por día, por semana y por mes, en un cuadro que se desliza (lo pediste el
    // 22/10/2026): primero el día, lo comido contra la meta con los macros; deslizando a la izquierda,
    // la semana, con el promedio y los siete días con sus barras; y otra vez, el mes, con el
    // calendario de lunas. Arriba, la tira de la semana, con una luna chica por día (se toca para ver
    // ese día); abajo, la línea del día. Lo que queda, con la luna grande, está en Inicio; el peso y
    // el gasto, en Progreso.
    const VISTAS = ['dia', 'semana', 'mes'];
    const zona = el('section', 'comida pagina-app');
    zona.innerHTML = `
      <div class="cm-scroll">
        <header class="cm-cab"><div class="cm-fecha"></div><h2 class="cm-titulo"></h2></header>
        <div class="cm-tira"></div>
        <section class="cm-cuadro">
          <div class="cm-cuadro-tira">
            <div class="cm-pagina cm-pagina-dia">
              <div class="cm-resumen">
                <div class="cm-resumen-luna"></div>
                <div class="cm-resumen-txt"><div class="cm-resumen-cifra"><b></b><small></small></div><span></span></div>
              </div>
              <div class="cm-resumen-barra"></div>
              <div class="cm-macros cm-macros-dia"></div>
            </div>
            <div class="cm-pagina cm-pagina-semana">
              <div class="cm-promedio cm-promedio-semana"></div>
              <div class="cm-grafica"></div>
              <div class="cm-semana-plan"></div>
            </div>
            <div class="cm-pagina cm-pagina-mes">
              <div class="cm-promedio cm-promedio-mes"></div>
              <div class="cm-calendario"></div>
            </div>
          </div>
        </section>
        <nav class="cm-puntos"></nav>
        <h3 class="cm-seccion cm-seccion-dia"></h3>
        <p class="cm-nota" hidden></p>
        <div class="cm-armar"></div>
        <div class="cm-linea"></div>
      </div>
      <div class="cm-aviso" role="status"><span></span></div>`;
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const $z = (q) => zona.querySelector(q);
    // La figura de las kcal del día, en el estilo elegido (kcal.js): al lado de lo comido o, si es la
    // barra, debajo. Se rehace al cambiar de estilo.
    let lunaChica = null;
    function ponerFiguraDelDia() {
      lunaChica = Kcal.chica((n) => tx('comida.porcentaje', { n: numero(n) }));
      $z('.cm-resumen-luna').innerHTML = '';
      $z('.cm-resumen-barra').innerHTML = '';
      $z(Kcal.estilo === 'barra' ? '.cm-resumen-barra' : '.cm-resumen-luna').appendChild(lunaChica.el);
      zona.dataset.kcal = Kcal.estilo;
    }
    ponerFiguraDelDia();
    Kcal.alCambiar(() => { ponerFiguraDelDia(); pintarZona(600); });
    const scroll = $z('.cm-scroll');
    // Inicio y Progreso se pintan de nuevo cuando cambia lo comido.
    const avisarCambio = () => { if (opciones.alCambiarComida) opciones.alCambiarComida(); };

    let avisoZona = 0;
    let deshacerZona = null;
    // Tocarlo lo cierra; deshacer es el botón.
    $z('.cm-aviso').addEventListener('click', (ev) => { if (!ev.target.closest('button')) $z('.cm-aviso').classList.remove('visible'); });
    function avisarZona(texto, deshacer) {
      const a = $z('.cm-aviso');
      a.querySelector('span').textContent = texto;
      a.querySelector('button')?.remove();
      deshacerZona = deshacer || null;
      if (deshacer) a.appendChild(boton('cm-aviso-btn', tx('comun.deshacer'), () => { const f = deshacerZona; deshacerZona = null; a.classList.remove('visible'); if (f) f(); }));
      a.classList.add('visible');
      clearTimeout(avisoZona);
      avisoZona = setTimeout(() => a.classList.remove('visible'), deshacer ? 3200 : 2200);
    }

    // ------------------------------------------------------------ fechas y promedios
    const fechaDe = (k) => { const f = new Date(HOY[0], HOY[1], HOY[2] + k); return { dia: f.getDay(), num: f.getDate(), mes: f.getMonth(), anio: f.getFullYear() }; };
    // El lunes de la semana del día k (la semana empieza el lunes, como en MacroFactor).
    const lunesDe = (k) => k - ((fechaDe(k).dia + 6) % 7);
    const letraDe = (k) => tx('fecha.diasCortos.' + fechaDe(k).dia).charAt(0);
    // Un día cuenta para los promedios si ya terminó y tiene algo registrado.
    const cuenta = (k) => k < 0 && comidasDe(k).length > 0;
    function promedio(dias) {
      const validos = dias.filter(cuenta);
      if (!validos.length) return { n: 0 };
      const suma = validos.map(totalDe).reduce((a, t) => ({ kcal: a.kcal + t.kcal, p: a.p + t.p, c: a.c + t.c, g: a.g + t.g }), { kcal: 0, p: 0, c: 0, g: 0 });
      const n = validos.length;
      return { n, kcal: suma.kcal / n, p: suma.p / n, c: suma.c / n, g: suma.g / n };
    }
    const rango = (desde, hasta) => Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);

    // Una luna chica, sin mares: llena según lo comido. Lo planificado se ve tenue y lo que
    // todavía no llegó es solo el contorno. Con otro estilo de kcal, su mini (kcal.js).
    function lunita(k) {
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '-12 -12 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const comidas = comidasDe(k);
      const plan = comidas.some((c) => c.plan);
      const estado = k > 0 && !plan ? 'futuro' : comidas.length ? (plan ? 'plan' : 'comido') : 'vacio';
      if (Kcal.estilo !== 'luna') return Kcal.mini(totalDe(k).kcal / META.kcal, estado);
      svg.setAttribute('class', 'cm-lunita ' + estado);
      const fr = Math.min(1, totalDe(k).kcal / META.kcal);
      const luz = estado === 'comido' || estado === 'plan' ? `<path d="${fase(Math.max(0.04, fr), 9.5)}" class="cm-lunita-luz"/>` : '';
      svg.innerHTML = `<circle r="9.5" class="cm-lunita-noche"/>${luz}<circle r="9.5" class="cm-lunita-borde"/>`;
      return svg;
    }

    // Debajo del cuadro, dónde está: Día, Semana y Mes, con el de la vista encendido. Se tocan también.
    function pintarPuntos() {
      const cont = $z('.cm-puntos');
      cont.innerHTML = '';
      VISTAS.forEach((v) => {
        const b = boton('cm-punto', `<i></i><span>${tx('comida.vistas.' + v)}</span>`, () => verVista(v));
        b.setAttribute('aria-pressed', String(s.vista === v));
        cont.appendChild(b);
      });
    }

    // Arriba va siempre el día: la línea de abajo es la de ese día, aunque el cuadro muestre la semana o el mes.
    function pintarCabecera() {
      const d = s.dia;
      const f = fechaDe(d);
      $z('.cm-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + f.dia), num: f.num, mes: tx('fecha.mesesCortos.' + f.mes) });
      const cerca = { '-1': 'ayer', 0: 'hoy', 1: 'manana' }[d];
      $z('.cm-titulo').textContent = cerca ? tx('comida.dias.' + cerca) : Buscar.conMayuscula(tx('comida.tituloDia', { dia: tx('fecha.dias.' + f.dia), num: f.num }));
    }

    function pintarZona(ms) {
      pintarCabecera();
      pintarDia(ms);
      pintarVistaSemana();
      pintarMes();
      pintarPuntos();
      ubicarCuadro(false);
    }

    // ------------------------------------------------------------ el cuadro que se desliza
    // Con el dedo de costado se pasa del día a la semana y al mes; en los bordes cede un cuarto,
    // como las pestañas. El alto sigue a la página que se ve. Las pestañas no se enteran: el gesto
    // que empieza en el cuadro es del cuadro.
    const cuadro = $z('.cm-cuadro');
    const tiraCuadro = $z('.cm-cuadro-tira');
    let arrastreCuadro = null;
    let soltoCuadro = -1e9;
    function ubicarCuadro(animar) {
      const i = VISTAS.indexOf(s.vista);
      tiraCuadro.style.transition = animar ? '' : 'none';
      tiraCuadro.style.translate = `${-i * 100}% 0`;
      const alto = tiraCuadro.children[i].offsetHeight;
      cuadro.style.transition = animar ? '' : 'none';
      if (alto) cuadro.style.height = alto + 'px';
    }
    cuadro.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      arrastreCuadro = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, t0: 0 };
    });
    cuadro.addEventListener('pointermove', (ev) => {
      const a = arrastreCuadro;
      if (!a || ev.pointerId !== a.id) return;
      const dx = ev.clientX - a.x0, dy = ev.clientY - a.y0;
      if (!a.decidido) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { arrastreCuadro = null; return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        a.decidido = true;
        a.t0 = performance.now();
        try { cuadro.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
        tiraCuadro.style.transition = 'none';
      }
      ev.preventDefault();
      const i = VISTAS.indexOf(s.vista);
      const borde = (i === 0 && dx > 0) || (i === VISTAS.length - 1 && dx < 0);
      tiraCuadro.style.translate = `calc(${-i * 100}% + ${(borde ? dx * 0.25 : dx).toFixed(1)}px) 0`;
    });
    const soltarCuadro = (ev) => {
      const a = arrastreCuadro;
      if (!a || ev.pointerId !== a.id) return;
      arrastreCuadro = null;
      if (!a.decidido) return;
      soltoCuadro = performance.now();
      const dx = ev.clientX - a.x0;
      const v = dx / Math.max(1, performance.now() - a.t0);
      const i = VISTAS.indexOf(s.vista);
      const pasa = ev.type !== 'pointercancel' && (Math.abs(dx) > cuadro.clientWidth * 0.2 || Math.abs(v) > 0.35);
      verVista(VISTAS[Math.max(0, Math.min(VISTAS.length - 1, pasa ? i + (dx < 0 ? 1 : -1) : i))]);
    };
    cuadro.addEventListener('pointerup', soltarCuadro);
    cuadro.addEventListener('pointercancel', soltarCuadro);
    // El click que llega después de deslizar no abre un día.
    cuadro.addEventListener('click', (ev) => { if (performance.now() - soltoCuadro < 400) { ev.stopPropagation(); ev.preventDefault(); } }, true);

    // Las barras de proteína, carbohidratos y grasas contra su meta. En un día, el punto de cada
    // una brilla cuando se cumple lo pedido y tiembla si se pasa por mucho (Metas.estadoDeMacro);
    // en los promedios, no.
    function pintarMacros(cont, t, conEstado) {
      cont.innerHTML = '';
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => {
        const col = el('div', `cm-macro cm-macro-${m} ${conEstado ? Metas.estadoDeMacro(t[m], META[m]) : ''}`);
        const barra = el('div', 'cm-barra-macro');
        const relleno = el('i');
        barra.appendChild(relleno);
        col.append(el('span', 'cm-macro-nombre', tx('comida.' + clave)), el('b', null, tx('comida.gramosDe', { n: numero(Math.round(t[m])), meta: numero(META[m]) })), barra);
        cont.appendChild(col);
        requestAnimationFrame(() => { relleno.style.width = `${Math.min(100, (t[m] / META[m]) * 100).toFixed(1)}%`; });
      });
    }

    // ------------------------------------------------------------ el día
    function pintarTira() {
      const cont = $z('.cm-tira');
      cont.innerHTML = '';
      rango(lunesDe(s.dia), lunesDe(s.dia) + 6).forEach((k) => {
        const b = boton('cm-tira-dia' + (k === 0 ? ' hoy' : ''), '', () => verDia(k), tx('cielo.fecha', { dia: tx('fecha.dias.' + fechaDe(k).dia), num: fechaDe(k).num, mes: tx('fecha.mesesCortos.' + fechaDe(k).mes) }));
        b.setAttribute('aria-pressed', String(k === s.dia));
        b.append(el('span', 'cm-tira-letra', letraDe(k)), lunita(k), el('b', null, String(fechaDe(k).num)));
        cont.appendChild(b);
      });
    }

    function pintarDia(ms) {
      const d = s.dia;
      pintarTira();
      // Lo comido (o lo planificado) contra la meta, con la luna chica; hoy, también lo que queda.
      const t = totalDe(d);
      const queda = META.kcal - t.kcal;
      contar($z('.cm-resumen-cifra b'), t.kcal, ms);
      $z('.cm-resumen-cifra small').textContent = tx('comida.deMetaCorto', { meta: numero(META.kcal) });
      const linea = $z('.cm-resumen-txt > span');
      linea.textContent = d === 0
        ? tx(queda >= 0 ? 'comida.quedanKcal' : 'comida.deMasKcal', { n: numero(Math.abs(Math.round(queda))) })
        : d > 0 ? tx('comida.planificado') : '';
      linea.classList.toggle('de-mas', d === 0 && queda < 0);
      lunaChica.ir(t.kcal / META.kcal, ms, comidasDe(d).map((c) => sumar(c.items).kcal));
      zona.classList.toggle('planificado', d > 0);
      pintarMacros($z('.cm-macros-dia'), t, d <= 0);
      $z('.cm-seccion-dia').textContent = tx('comida.tuDia');
      const nota = $z('.cm-nota');
      nota.hidden = d <= 0;
      nota.textContent = tx(comidasDe(d).length ? 'comida.planificadoTexto' : 'comida.sinRegistros');
      pintarArmar();
      pintarLinea();
    }

    // La línea del día: las comidas sobre una línea de horas, con el espacio entre una y otra según
    // el tiempo que pasó. Hoy, la comida que falta espera en «ahora».
    function pintarLinea() {
      const cont = $z('.cm-linea');
      cont.innerHTML = '';
      const d = s.dia;
      const entradas = comidasDe(d).map((c) => ({ comida: c, hora: c.hora }));
      if (d === 0) {
        // Qué comer antes y después de entrenar: en la comida que toca, aunque todavía no sea su hora.
        const lineas = lineasDeEntreno();
        Object.entries(HORA_TIPICA).forEach(([tipo, h]) => {
          if (entradas.some((x) => (x.comida ? x.comida.tipo : x.vacia) === tipo)) return;
          const actual = Comidas.comidaDeLaHora(AHORA) === tipo;
          if (h <= AHORA || actual || lineas.has(tipo)) entradas.push({ vacia: tipo, hora: actual ? AHORA : h });
        });
        // El snack: el de antes de entrenar, un rato antes de la sesión; el de la noche, después de la cena.
        const snack = lineas.get('snack');
        if (snack && !entradas.some((x) => x.comida && x.comida.tipo === 'snack' && x.comida.plan)) {
          entradas.push({ vacia: 'snack', hora: Math.max(AHORA, snack.clase === 'antesDeDormir' ? snack.hora + 30 : snack.hora - 45) });
        }
        // Una comida registrada ahora ya marca la hora: «ahora» va solo si no la hay.
        if (!entradas.some((x) => x.comida && Math.abs(x.hora - AHORA) < 1)) entradas.push({ ahora: true, hora: AHORA - 0.5 });
      }
      entradas.sort((a, b) => a.hora - b.hora);
      let antes = null;
      entradas.forEach((x) => {
        const fila = el('div', 'cm-entrada');
        if (antes != null) fila.style.marginTop = `${(10 + Math.min(34, (x.hora - antes) * 0.12)).toFixed(0)}px`;
        antes = x.hora;
        if (x.ahora) {
          fila.className = 'cm-entrada cm-ahora';
          fila.append(el('div', 'cm-hora', hora(AHORA)), el('div', 'cm-nodo'), el('span', 'cm-ahora-txt', tx('comida.ahora')));
          cont.appendChild(fila);
          return;
        }
        // El hueco de la comida que falta, si es la de ahora, va sin hora: está justo debajo de «ahora».
        fila.append(el('div', 'cm-hora', x.vacia && x.hora === AHORA ? '' : hora(Math.round(x.hora))), el('div', 'cm-nodo'));
        fila.appendChild(x.vacia ? tarjetaVacia(x.vacia) : tarjeta(x.comida));
        if (x.vacia) fila.classList.add('vacia');
        if (x.comida && x.comida.plan) fila.classList.add('plan');
        cont.appendChild(fila);
      });
    }

    function tarjeta(c) {
      const t = sumar(c.items);
      const art = el('article', 'cm-tarjeta' + (c.entra ? ' entra' : ''));
      delete c.entra;
      const cab = el('header');
      const titulo = el('b', null, tx('comida.comidas.' + c.tipo));
      cab.appendChild(titulo);
      if (c.plan) cab.appendChild(el('em', 'cm-etiqueta', tx('comida.planificado')));
      const total = el('span', 'cm-tk');
      total.append(numero(Math.round(t.kcal)), el('small', null, ' kcal'));
      cab.appendChild(total);
      art.appendChild(cab);
      const lista = el('ul');
      c.items.forEach((it) => {
        const li = el('li', 'cm-item' + (it.nuevo ? ' nuevo' : ''));
        li.dataset.toque = '';
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        const txt = el('span', 'cm-item-txt');
        txt.append(nombreDeItem(it));
        const cant = cantidadDe(it);
        if (cant) txt.append(el('em', null, ` · ${cant}`));
        li.append(txt, el('span', 'cm-item-k', numero(Math.round(valoresDe(it).kcal))));
        li.addEventListener('click', (ev) => { ev.stopPropagation(); editar(c, it); });
        lista.appendChild(li);
        delete it.nuevo;
      });
      art.appendChild(lista);
      // En lo planificado, qué comer alrededor del entrenamiento (como en la app).
      const linea = c.plan && diaDe(c) === 0 ? lineasDeEntreno().get(c.tipo) : null;
      if (linea) art.appendChild(lineaDeEntreno(linea));
      const pie = el('footer');
      [['p', t.p], ['c', t.c], ['g', t.g]].forEach(([m, g]) => {
        const chip = el('span', 'cm-mini cm-mini-' + m);
        chip.append(el('i'), `${numero(Math.round(g))} g`);
        pie.appendChild(chip);
      });
      if (!c.plan) pie.appendChild(boton('cm-foto', icono('camara'), () => avisarZona('Galería: la foto queda como recuerdo, sin análisis.'), tx('comida.foto')));
      art.appendChild(pie);
      // Lo que armó Moss: «Comí esto» (hoy o antes), otra parecida, me gusta y no me gusta.
      if (c.plan && c.opcion) {
        const acciones = el('div', 'cm-acciones cm-plan-acciones');
        if (diaDe(c) <= 0) acciones.appendChild(boton('cm-accion principal', `${icono('listo')}<span>${tx('comida.plan.comiEsto')}</span>`, () => comiEsto(c)));
        acciones.appendChild(boton('cm-accion', `<span>${tx('comida.plan.otra')}</span>`, () => otra(c)));
        const gusta = boton('cm-accion cm-redondo cm-gusta', icono('corazon'), () => gusto(c, gusta), tx('comida.plan.meGusta'));
        gusta.setAttribute('aria-pressed', String(s.pref.meGusta.includes(c.opcion)));
        acciones.append(gusta, boton('cm-accion cm-redondo', icono('cerrar'), () => noMeGusta(c), tx('comida.plan.noMeGusta')));
        art.appendChild(acciones);
      }
      return art;
    }

    // ------------------------------------------------------------ el plan de comidas
    // Moss arma las comidas que faltan con Plan (src/dominio/plan.ts, el mismo módulo que la app):
    // primero lo que comes seguido, después comidas tipo de tu forma de comer, escaladas para llegar
    // a la meta. Quedan planificadas, tenues: «Comí esto» las anota, «Otra» la cambia por una
    // parecida y lo que no te gusta no vuelve.
    const HORA_DEL_PLAN = Object.assign({ snack: 11 * 60 }, HORA_TIPICA);
    const metaDelPlan = () => ({ kcal: META.kcal, proteina: META.p, carbohidratos: META.c, grasas: META.g });
    const aMacros = (v) => ({ kcal: v.kcal, proteina: v.p, carbohidratos: v.c, grasas: v.g });
    const sumaDelPlan = (items) => items.reduce((t, it) => ({ kcal: t.kcal + it.valores.kcal, proteina: t.proteina + it.valores.proteina,
      carbohidratos: t.carbohidratos + it.valores.carbohidratos, grasas: t.grasas + it.valores.grasas }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
    // De lo de la galería a lo del plan, y de vuelta: un alimento con su porción o sus gramos, o la carga rápida.
    function aItemDelPlan(it) {
      if (it.rapida) return { fuente: 'rapida', ref: null, nombre: nombreDeItem(it), cantidad: null, valores: aMacros(valoresDe(it)) };
      const a = porId.get(it.alimento);
      const cantidad = it.gramos != null ? { gramos: it.gramos } : { porcion: porcionDe(a, it.porcion), gramosPorcion: a.p[it.porcion][2], veces: it.veces };
      return { fuente: 'base', ref: String(a.id), nombre: nombreDe(a), cantidad, valores: aMacros(valoresDe(it)) };
    }
    function deItemDelPlan(item) {
      if (item.fuente === 'rapida') return { rapida: true, nombre: item.nombre, kcal: item.valores.kcal, p: item.valores.proteina, c: item.valores.carbohidratos, g: item.valores.grasas };
      const a = porId.get(Number(item.ref));
      const c = item.cantidad;
      if (c && 'porcion' in c) {
        const i = a.p.findIndex((p, j) => porcionDe(a, j) === c.porcion);
        return i >= 0 ? { alimento: a.id, porcion: i, veces: c.veces } : { alimento: a.id, gramos: Math.round(c.gramosPorcion * c.veces) };
      }
      return { alimento: a.id, gramos: c ? c.gramos : 100 };
    }
    let opcionesGuardadas = null;
    function opcionesDelPlan() {
      if (opcionesGuardadas && opcionesGuardadas.idioma === idioma) return opcionesGuardadas.lista;
      // Lo tuyo sale de los días de mentira que ya pasaron; las comidas tipo, de los alimentos curados.
      const registros = [];
      for (let k = PRIMER_DIA; k < 0; k++) {
        comidasDe(k).forEach((c) => c.items.forEach((it, j) => {
          if (c.plan) return;
          registros.push(Object.assign({ id: `${k}-${c.tipo}-${j}`, dia: fechaClave(k), comida: c.tipo, momento: hora(c.hora), planificado: false, actualizado: '' }, aItemDelPlan(it)));
        }));
      }
      const resolver = (nombre) => {
        const a = porNombre.get(nombre);
        if (!a) return null;
        return { fuente: 'base', ref: String(a.id), nombre: nombreDe(a), por100g: { kcal: a.v[0], proteina: a.v[1], carbohidratos: a.v[2], grasas: a.v[3] },
          porciones: a.p.map((p, i) => ({ nombre: porcionDe(a, i), gramos: p[2] })) };
      };
      const lista = [...Plan.opcionesTuyas(registros, fechaClave(0)), ...Plan.PLANTILLAS.map((p) => Plan.opcionDePlantilla(p, resolver, idioma)).filter(Boolean)];
      opcionesGuardadas = { idioma, lista };
      return lista;
    }
    const recientesDe = (k) => [k - 1, k - 2].flatMap((x) => comidasDe(x).filter((c) => c.opcion).map((c) => c.opcion));
    // Las comidas que faltan de un día; hoy, solo las que todavía no pasaron.
    function faltanDe(k) {
      const hay = new Set(comidasDe(k).map((c) => c.tipo));
      return Plan.comidasDelPlan(s.pref.comidas).filter((t) => !hay.has(t) && (k > 0 || HORA_DEL_PLAN[t] + 60 >= AHORA));
    }

    /** Arma las comidas que faltan de un día con lo que queda de la meta. Devuelve el día armado, o null. */
    function armarPlan(k) {
      const faltan = faltanDe(k);
      if (k < 0 || !faltan.length) return null;
      s.semilla++;
      const dia = Plan.planearDia({ dia: fechaClave(k), meta: metaDelPlan(), opciones: opcionesDelPlan(), pref: s.pref, semilla: s.semilla, solo: faltan, yaComido: aMacros(totalDe(k)), recientes: recientesDe(k) });
      if (!s.dias[String(k)]) s.dias[String(k)] = [];
      const lista = s.dias[String(k)];
      dia.comidas.forEach((c) => lista.push({ tipo: c.comida, hora: k === 0 ? Math.max(HORA_DEL_PLAN[c.comida], AHORA) : HORA_DEL_PLAN[c.comida], plan: true, entra: true, opcion: c.opcion,
        items: c.items.map((it) => Object.assign(deItemDelPlan(it), { nuevo: true })) }));
      lista.sort((a, b) => a.hora - b.hora);
      return dia.comidas.length ? dia : null;
    }
    function armarElDia() {
      const dia = armarPlan(s.dia);
      if (!dia) { avisarZona(tx('comida.plan.nadaQueArmar')); return; }
      escena.haptico('suave');
      pintarZona(800);
      avisarCambio();
      if (!dia.alcanza) avisarZona(tx('comida.plan.noAlcanza'));
    }
    function armarLaSemana() {
      const lunes = lunesDe(s.dia);
      let alguno = false;
      for (let k = Math.max(0, lunes); k <= Math.min(ULTIMO_DIA, lunes + 6); k++) alguno = !!armarPlan(k) || alguno;
      escena.haptico('suave');
      pintarZona(800);
      avisarCambio();
      avisarZona(tx(alguno ? 'comida.plan.armadaSemana' : 'comida.plan.nadaQueArmar'));
    }
    function diaPlaneadoDe(k) {
      const comidas = comidasDe(k).filter((x) => x.plan && x.opcion).map((x) => {
        const items = x.items.map(aItemDelPlan);
        return { comida: x.tipo, opcion: x.opcion, items, valores: sumaDelPlan(items) };
      });
      return { dia: fechaClave(k), comidas, valores: sumaDelPlan(comidas.flatMap((c) => c.items)), alcanza: true };
    }
    // «Comí esto»: un toque, y la comida armada queda anotada como cualquier otra.
    function comiEsto(c) {
      c.plan = false;
      c.items.forEach((it) => { it.nuevo = true; });
      escena.haptico('toque');
      pintarZona(900);
      avisarCambio();
      avisarZona(tx('comida.plan.anotado'), () => { c.plan = true; pintarZona(600); avisarCambio(); });
    }
    function otra(c, callado) {
      s.semilla++;
      const nuevo = Plan.cambiarPorOtra(diaPlaneadoDe(diaDe(c)), c.tipo, { opciones: opcionesDelPlan(), pref: s.pref, meta: metaDelPlan(), semilla: s.semilla });
      const cambiada = nuevo && nuevo.comidas.find((x) => x.comida === c.tipo);
      if (!cambiada) {
        if (!callado) avisarZona(tx('comida.plan.sinOtra'));
        return false;
      }
      c.opcion = cambiada.opcion;
      c.items = cambiada.items.map((it) => Object.assign(deItemDelPlan(it), { nuevo: true }));
      pintarZona(700);
      avisarCambio();
      return true;
    }
    function gusto(c, b) {
      const ya = s.pref.meGusta.includes(c.opcion);
      s.pref.meGusta = ya ? s.pref.meGusta.filter((x) => x !== c.opcion) : [...s.pref.meGusta, c.opcion];
      b.setAttribute('aria-pressed', String(!ya));
      escena.haptico('suave');
    }
    // No me gusta: no se vuelve a proponer (lo anotado no se toca) y se cambia ya por otra.
    function noMeGusta(c) {
      const antes = { opcion: c.opcion, items: c.items };
      s.pref.noMeGusta = [...s.pref.noMeGusta, c.opcion];
      if (!otra(c, true)) {
        s.pref.noMeGusta = s.pref.noMeGusta.filter((x) => x !== antes.opcion);
        avisarZona(tx('comida.plan.sinOtra'));
        return;
      }
      avisarZona(tx('comida.plan.quitada'), () => {
        s.pref.noMeGusta = s.pref.noMeGusta.filter((x) => x !== antes.opcion);
        c.opcion = antes.opcion;
        c.items = antes.items;
        pintarZona(500);
        avisarCambio();
      });
    }
    // «Armar el día» se va despacio cuando ya no falta nada (y vuelve si falta); «Tus comidas» queda.
    function pintarArmar() {
      const cont = $z('.cm-armar');
      if (!cont.firstChild) {
        cont.append(
          boton('cm-armar-boton cm-armar-dia', `${icono('chispa')}<span></span>`, armarElDia),
          boton('cm-armar-enlace', '', abrirPreferencias),
        );
      }
      cont.hidden = s.dia < 0;
      const armar = cont.querySelector('.cm-armar-dia');
      const falta = s.dia >= 0 && faltanDe(s.dia).length > 0;
      armar.querySelector('span').textContent = tx('comida.plan.armarDia');
      armar.classList.toggle('oculto', !falta);
      armar.disabled = !falta;
      cont.querySelector('.cm-armar-enlace').textContent = tx('comida.plan.tusComidas');
    }

    // Tus comidas: cómo comes, qué no, cuántas comidas y cuánto tiempo para cocinar.
    const hojaPlan = Util.hoja(tel, 'pl-hoja', () => opciones.alCambiar());
    function cabezaDeHojaPlan(titulo) {
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', titulo), boton('hb-cerrar', icono('cerrar'), () => hojaPlan.cerrar(), tx('comida.cerrar')));
      return cab;
    }
    function abrirPreferencias() {
      const h = hojaPlan.el;
      h.innerHTML = '';
      const cuerpo = el('div', 'pl-cuerpo');
      cuerpo.appendChild(el('p', 'hb-texto', tx('comida.plan.preferenciasTexto')));
      const grupo = (titulo, valores, nombre, elegido, alElegir) => {
        cuerpo.appendChild(el('div', 'fi-etq', titulo));
        const fila = el('div', 'fi-porciones pl-opciones');
        const botones = valores.map((v) => {
          const b = boton('fi-porcion', `<span>${nombre(v)}</span>`, () => {
            alElegir(v);
            botones.forEach((x, i) => x.setAttribute('aria-pressed', String(elegido(valores[i]))));
            opcionesGuardadas = null;
            escena.haptico('suave');
            pintarArmar();
          });
          b.setAttribute('aria-pressed', String(elegido(v)));
          fila.appendChild(b);
          return b;
        });
        cuerpo.appendChild(fila);
      };
      grupo(tx('comida.plan.dieta'), Plan.DIETAS, (d) => tx('comida.plan.dietas.' + d), (d) => s.pref.dieta === d, (d) => { s.pref.dieta = d; });
      grupo(tx('comida.plan.alergias'), Plan.ALERGENOS, (a) => tx('comida.plan.alergenos.' + a), (a) => s.pref.alergias.includes(a),
        (a) => { s.pref.alergias = s.pref.alergias.includes(a) ? s.pref.alergias.filter((x) => x !== a) : [...s.pref.alergias, a]; });
      grupo(tx('comida.plan.comidas'), [3, 4, 5], (n) => String(n), (n) => s.pref.comidas === n, (n) => { s.pref.comidas = n; });
      grupo(tx('comida.plan.tiempo'), ['poco', 'normal', 'mucho'], (t) => tx('comida.plan.tiempos.' + t), (t) => s.pref.tiempo === t, (t) => { s.pref.tiempo = t; });
      h.append(cabezaDeHojaPlan(tx('comida.plan.tusComidas')), cuerpo);
      hojaPlan.abrir();
      opciones.alCambiar();
    }

    // La lista de compras: lo de las comidas armadas desde hoy, sumado, para tachar en el súper.
    function abrirCompras() {
      const h = hojaPlan.el;
      h.innerHTML = '';
      const cuerpo = el('div', 'pl-cuerpo');
      const lista = Plan.listaDeCompras(rango(0, ULTIMO_DIA).map(diaPlaneadoDe));
      if (!lista.length) cuerpo.appendChild(el('p', 'hb-texto', tx('comida.plan.sinCompras')));
      else {
        cuerpo.appendChild(el('p', 'hb-texto', tx('comida.plan.comprasTexto')));
        const ul = el('ul', 'pl-compras');
        lista.forEach((x) => {
          const li = el('li', s.compradas.has(x.clave) ? 'comprada' : null);
          li.dataset.toque = '';
          li.setAttribute('role', 'checkbox');
          li.setAttribute('aria-checked', String(s.compradas.has(x.clave)));
          li.tabIndex = 0;
          const cuanto = x.porciones ? Porciones.cantidadDePorcion(x.porciones.veces, x.porciones.nombre, idioma) : `${numero(x.gramos)} g`;
          const marca = el('i', 'pl-marca');
          marca.innerHTML = icono('listo');
          li.append(marca, el('span', null, x.nombre), el('small', null, cuanto));
          li.addEventListener('click', () => {
            if (s.compradas.has(x.clave)) s.compradas.delete(x.clave); else s.compradas.add(x.clave);
            li.classList.toggle('comprada', s.compradas.has(x.clave));
            li.setAttribute('aria-checked', String(s.compradas.has(x.clave)));
            escena.haptico('suave');
          });
          ul.appendChild(li);
        });
        cuerpo.appendChild(ul);
      }
      h.append(cabezaDeHojaPlan(tx('comida.plan.compras')), cuerpo);
      hojaPlan.abrir();
      opciones.alCambiar();
    }

    function tarjetaVacia(tipo) {
      const art = el('article', 'cm-tarjeta vacia');
      art.appendChild(el('b', null, tx('comida.comidas.' + tipo)));
      const linea = s.dia === 0 ? lineasDeEntreno().get(tipo) : null;
      if (linea) art.appendChild(lineaDeEntreno(linea));
      const acciones = el('div', 'cm-acciones');
      acciones.append(
        boton('cm-accion principal', `${icono('mas')}<span>${tx('comida.agregar')}</span>`, () => abrirHoja({ comida: tipo })),
        boton('cm-accion', `${icono('copiar')}<span>${tx('comida.copiarDeAyer')}</span>`, () => copiarDeAyer(tipo)),
      );
      art.appendChild(acciones);
      return art;
    }

    // ------------------------------------------------------------ la semana
    // El promedio de los días que ya terminaron y la semana entera de lunes a domingo: por día, una
    // barra de calorías y una por macro contra su meta (la línea punteada), como en MacroFactor.
    function pintarPromedio(carta, prom, diasDelTramo, titulo, fechas) {
      carta.innerHTML = '';
      const cab = el('header', 'cm-pagina-cab');
      cab.append(el('b', null, titulo), el('span', null, fechas));
      carta.append(cab, el('span', 'cm-carta-titulo', tx('comida.promedio')));
      if (!prom.n) { carta.appendChild(el('p', 'cm-carta-texto', tx('comida.sinRegistros'))); return; }
      const cifra = el('div', 'cm-carta-cifra');
      cifra.append(el('b', null, numero(Math.round(prom.kcal))), el('span', null, ` ${tx('comida.kcal')}`));
      const nota = el('div', 'cm-carta-nota', `${tx('comida.metaDe', { n: numero(META.kcal) })} · ${tx('comida.diasRegistrados', { n: prom.n, total: diasDelTramo })}`);
      const macros = el('div', 'cm-macros cm-macros-promedio');
      carta.append(cifra, nota, macros);
      pintarMacros(macros, prom, false);
    }

    function pintarVistaSemana() {
      const lunes = lunesDe(s.dia);
      const dias = rango(lunes, lunes + 6);
      const desde = fechaDe(lunes), hasta = fechaDe(lunes + 6);
      const titulo = lunes === lunesDe(0) ? tx('comida.estaSemana') : tx('comida.semanaDel', { num: desde.num, mes: tx('fecha.mesesCortos.' + desde.mes) });
      pintarPromedio($z('.cm-promedio-semana'), promedio(dias), dias.filter((k) => k < 0).length, titulo,
        tx('comida.rangoSemana', { desde: desde.num, hasta: hasta.num, mes: tx('fecha.mesesCortos.' + hasta.mes) }));
      const grafica = $z('.cm-grafica');
      grafica.innerHTML = '';
      grafica.appendChild(el('i', 'cm-grafica-meta'));
      dias.forEach((k) => {
        const t = totalDe(k);
        const plan = comidasDe(k).some((c) => c.plan);
        const col = boton('cm-grafica-dia' + (k === 0 ? ' hoy' : '') + (plan ? ' plan' : ''), '', () => verDia(k));
        const barras = el('div', 'cm-grafica-barras');
        [['kcal', 'k'], ['p', 'p'], ['c', 'c'], ['g', 'g']].forEach(([m, clase]) => {
          const b = el('i', 'cm-grafica-' + clase);
          // Hasta 120 % de la meta: lo que pasa de ahí no cambia la lectura.
          b.style.height = `${(Math.min(1.2, t[m] / META[m]) / 1.2 * 100).toFixed(1)}%`;
          barras.appendChild(b);
        });
        col.append(barras, el('span', 'cm-tira-letra', letraDe(k)), el('b', null, String(fechaDe(k).num)));
        grafica.appendChild(col);
      });
      // Armar la semana y la lista de compras, debajo de las barras, si la semana no pasó.
      const plan = $z('.cm-semana-plan');
      plan.innerHTML = '';
      if (lunes + 6 >= 0) {
        plan.append(
          boton('cm-armar-boton', `${icono('chispa')}<span>${tx('comida.plan.armarSemana')}</span>`, armarLaSemana),
          boton('cm-armar-boton', `${icono('compras')}<span>${tx('comida.plan.compras')}</span>`, abrirCompras),
        );
      }
    }

    // ------------------------------------------------------------ el mes
    // El calendario del mes con una luna por día, de lunes a domingo, y el promedio del mes.
    function pintarMes() {
      const f = fechaDe(s.dia);
      const primero = s.dia - (f.num - 1);
      const ultimo = primero + new Date(f.anio, f.mes + 1, 0).getDate() - 1;
      const cal = $z('.cm-calendario');
      cal.innerHTML = '';
      const letras = el('div', 'cm-cal-letras');
      rango(lunesDe(primero), lunesDe(primero) + 6).forEach((k) => letras.appendChild(el('span', null, letraDe(k))));
      cal.appendChild(letras);
      const grilla = el('div', 'cm-cal-grilla');
      for (let k = lunesDe(primero); k <= lunesDe(ultimo) + 6; k++) {
        if (k < primero || k > ultimo) { grilla.appendChild(el('span', 'cm-cal-fuera')); continue; }
        const b = boton('cm-cal-dia' + (k === 0 ? ' hoy' : ''), '', () => verDia(k));
        b.append(lunita(k), el('b', null, String(fechaDe(k).num)));
        grilla.appendChild(b);
      }
      cal.appendChild(grilla);
      const dias = rango(primero, ultimo);
      pintarPromedio($z('.cm-promedio-mes'), promedio(dias), dias.filter((k) => k < 0).length, Buscar.conMayuscula(tx('fecha.meses.' + f.mes)), String(f.anio));
    }

    // Tocar un día de la semana o del mes vuelve el cuadro al día, con ese día.
    function verDia(d) {
      if (d < PRIMER_DIA || d > ULTIMO_DIA) return;
      s.dia = d;
      s.vista = 'dia';
      pintarZona(700);
      ubicarCuadro(true);
      scroll.scrollTo({ top: 0, behavior: 'smooth' });
      opciones.alCambiar();
    }

    function verVista(v) {
      s.vista = v;
      pintarPuntos();
      ubicarCuadro(true);
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ la pestaña a la vista
    // Las pestañas avisan cuándo Comida queda a la vista: los toques para registrar se cuentan
    // desde ahí, o desde el «+» de la barra.
    function ponerEnZona(si) {
      if (si === s.enZona) return;
      s.enZona = si;
      if (si && !s.hoja) { s.toques = 0; s.escribio = false; }
    }

    // ------------------------------------------------------------ la hoja de registro
    // Registrar es armar la comida: cada alimento se abre en una ventana con sus porciones y se
    // suma; abajo se ve lo que se va juntando. «Listo» muestra todo para revisarlo, y recién
    // «Agregar» lo registra. Lo juntado queda guardado si se cierra la hoja sin agregar.
    const fondo = el('div', 'hj-fondo');
    fondo.hidden = true;
    const hoja = el('section', 'hoja');
    hoja.hidden = true;
    hoja.setAttribute('role', 'dialog');
    hoja.setAttribute('aria-modal', 'true');
    hoja.innerHTML = `
      <div class="hj-arriba"><div class="hj-asa"></div><span class="hj-cerrar-lugar"></span></div>
      <div class="hj-paneles">
        <div class="hj-panel hj-lista">
          <header class="hj-cab"><div class="hj-chips"></div></header>
          <div class="hj-busca"></div>
          <div class="hj-atajos"></div>
          <div class="hj-cuerpo"></div>
        </div>
        <div class="hj-panel hj-sub" hidden></div>
      </div>
      <div class="hj-aviso" role="status"><span></span><div class="hj-aviso-btns"></div></div>
      <div class="hj-bandeja" hidden></div>
      <div class="hj-teclado" aria-hidden="true"></div>
      <div class="hj-velo" hidden></div>
      <section class="hj-ventana" hidden></section>`;
    tel.append(fondo, hoja);
    [fondo, hoja].forEach((n) => n.addEventListener('pointerdown', (ev) => ev.stopPropagation()));
    fondo.addEventListener('click', () => cerrarHoja());
    const $h = (q) => hoja.querySelector(q);

    const entrada = el('input', 'hj-entrada');
    entrada.type = 'search';
    entrada.autocomplete = 'off';
    entrada.spellcheck = false;
    entrada.setAttribute('enterkeyhint', 'search');
    const lupa = el('span', 'hj-lupa');
    lupa.innerHTML = icono('lupa');
    const escanear = boton('hj-icono', icono('codigo'), () => avisarHoja('Galería: el escáner de código de barras llega en la etapa 6.'));
    const etiqueta = boton('hj-icono', icono('etiqueta'), () => abrirEtiqueta());
    const microfono = boton('hj-icono', icono('microfono'), () => abrirDecir({ escuchar: true }));
    $h('.hj-busca').append(lupa, entrada, microfono, escanear, etiqueta);
    const cerrarB = boton('hj-cerrar', icono('cerrar'), () => cerrarHoja());
    $h('.hj-cerrar-lugar').replaceWith(cerrarB);
    entrada.addEventListener('input', () => { s.escribio = true; pintarCuerpo(); });
    entrada.addEventListener('focus', () => teclado(true));
    entrada.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== entrada) teclado(false); }, 120));
    entrada.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') entrada.blur(); if (ev.key === 'Escape') cerrarHoja(); });
    // Deslizar la lista baja el teclado, como en iOS.
    $h('.hj-cuerpo').addEventListener('scroll', () => { if (document.activeElement === entrada && $h('.hj-cuerpo').scrollTop > 6) entrada.blur(); }, { passive: true });
    // Cada toque adentro cuenta, antes de que lo atienda su botón.
    hoja.addEventListener('click', (ev) => { if (ev.target.closest('[data-toque]')) s.toques++; }, true);
    zona.addEventListener('click', (ev) => { if (ev.target.closest('[data-toque]')) s.toques++; }, true);

    // `revisar` abre directo la revisión (copiar de ayer); `soloEditar`, la ventana de un registro.
    function abrirHoja({ comida, revisar, soloEditar }) {
      if (s.hoja || escena.viajando || escena.modo === 'entrada') return false;
      s.hoja = { comida: comida || Comidas.comidaDeLaHora(AHORA), sub: null, ventana: null, agregado: false, soloEditar: !!soloEditar };
      entrada.value = '';
      entrada.placeholder = tx('comida.buscar');
      escanear.setAttribute('aria-label', tx('comida.escanear'));
      microfono.setAttribute('aria-label', tx('comida.decir.titulo'));
      etiqueta.setAttribute('aria-label', tx('comida.etiqueta'));
      hoja.setAttribute('aria-label', tx('comida.registrar'));
      pintarChips();
      pintarAtajos();
      pintarCuerpo();
      pintarBandeja();
      cerrarSub(true);
      cerrarVentana(true);
      tel.classList.add('hoja-anim', 'con-hoja');
      fondo.hidden = false;
      hoja.hidden = false;
      hoja.classList.remove('saliendo');
      setTimeout(() => tel.classList.remove('hoja-anim'), 520);
      // Abre lista para escribir: el teclado arriba.
      if (!revisar && !soloEditar) {
        entrada.focus({ preventScroll: true });
        teclado(true);
      }
      opciones.alCambiar();
      return true;
    }

    function cerrarHoja() {
      if (!s.hoja) return;
      const agregado = s.hoja.agregado;
      s.hoja = null;
      entrada.blur();
      teclado(false);
      tel.classList.add('hoja-anim');
      tel.classList.remove('con-hoja');
      hoja.classList.add('saliendo');
      setTimeout(() => { if (!s.hoja) { hoja.hidden = true; fondo.hidden = true; cerrarVentana(true); } tel.classList.remove('hoja-anim'); }, 420);
      // Lo nuevo se ve llegar: la luna se llena y la cifra baja.
      if (agregado) { s.dia = 0; s.vista = 'dia'; pintarZona(1100); avisarCambio(); }
      // Sin registrar nada, la cuenta de toques empieza de nuevo.
      s.toques = 0;
      s.escribio = false;
      opciones.alCambiar();
    }

    function pintarChips() {
      const cont = $h('.hj-chips');
      cont.innerHTML = '';
      Comidas.COMIDAS.forEach((tipo) => {
        const b = boton('hj-chip', tx('comida.comidas.' + tipo), () => { s.hoja.comida = tipo; pintarChips(); pintarAtajos(); pintarCuerpo(); pintarBandeja(); });
        b.setAttribute('aria-pressed', String(tipo === s.hoja.comida));
        cont.appendChild(b);
      });
      cerrarB.setAttribute('aria-label', tx('comida.cerrar'));
      // La comida elegida, a la vista en la fila (sin mover la página, como haría scrollIntoView).
      const elegido = cont.querySelector('[aria-pressed="true"]');
      if (elegido) requestAnimationFrame(() => { cont.scrollLeft = Math.max(0, elegido.offsetLeft - (cont.clientWidth - elegido.offsetWidth) / 2); });
    }

    function pintarAtajos() {
      const cont = $h('.hj-atajos');
      cont.innerHTML = '';
      cont.append(
        boton('hj-atajo', `${icono('copiar')}<span>${tx('comida.deAyer.' + s.hoja.comida)}</span>`, () => sumarDeAyer(s.hoja.comida)),
        boton('hj-atajo', `${icono('guardadas')}<span>${tx('comida.guardadasCorto')}</span>`, () => abrirGuardadas()),
        boton('hj-atajo', `${icono('rayo')}<span>${tx('comida.cargaRapida')}</span>`, () => abrirRapida()),
      );
    }

    // Una fila: el alimento con la porción que se va a usar. El «+», o la fila, abre su ventana.
    function fila(a, porcion, veces, extra, gramos) {
      const it = gramos != null ? { alimento: a.id, gramos } : { alimento: a.id, porcion, veces };
      const f = el('div', 'hj-fila');
      f.dataset.toque = '';
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      const textos = el('div', 'hj-fila-txt');
      const nombre = el('b', null, nombreDe(a));
      if (extra) nombre.appendChild(el('small', null, ` · ${extra}`));
      textos.append(nombre, el('span', null, `${cantidadDe(it)} · ${numero(Math.round(valoresDe(it).kcal))} kcal`));
      const mas = boton('hj-mas', icono('mas'), () => abrirVentana(a, { porcion, veces, gramos, boton: mas }), tx('comida.sumarAlimento', { alimento: nombreDe(a) }));
      f.append(textos, mas);
      f.addEventListener('click', () => abrirVentana(a, { porcion, veces, gramos, boton: mas }));
      f.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') abrirVentana(a, { porcion, veces, gramos, boton: mas }); });
      return f;
    }

    const conUltima = (a, veces, porcion) => {
      const u = s.ultima.get(a.id);
      if (u) return u.gramos != null ? [null, 1, u.gramos] : [u.porcion, u.veces, null];
      return [porcion == null ? a.d : porcion, veces || 1, null];
    };

    function pintarCuerpo() {
      const cuerpo = $h('.hj-cuerpo');
      cuerpo.innerHTML = '';
      const texto = entrada.value.trim();
      $h('.hj-atajos').hidden = !!texto;
      if (!texto) {
        const vistos = new Set();
        const seccion = (titulo, lista) => {
          const filas = lista.filter((a) => a && !vistos.has(a.id)).slice(0, 4);
          if (!filas.length) return;
          cuerpo.appendChild(el('h4', 'hj-titulo', titulo));
          filas.forEach((a) => { vistos.add(a.id); const [p, v, g] = conUltima(a); cuerpo.appendChild(fila(a, p, v, null, g)); });
        };
        const siempre = deSiempre(s.hoja.comida);
        if (siempre) {
          const b = boton('hj-siempre', '', () => {
            const r = registrarDirecto(siempre, tx('comida.deSiempre.' + s.hoja.comida), s.hoja.comida);
            const tipo = s.hoja.comida;
            cerrarHoja();
            avisarZona(tx('comida.deSiempre.' + tipo), r.deshacer);
          });
          b.dataset.toque = '';
          const textos = el('div', 'hj-fila-txt');
          textos.append(el('b', null, tx('comida.deSiempre.' + s.hoja.comida)), el('span', null, `${siempre.map(nombreDeItem).join(', ')} · ${numero(Math.round(sumar(siempre).kcal))} kcal`));
          const mas = el('span', 'hj-siempre-mas');
          mas.innerHTML = icono('mas');
          b.append(textos, mas);
          cuerpo.appendChild(b);
        }
        seccion(tx('comida.sueles.' + s.hoja.comida), SUELES[s.hoja.comida].map(([n]) => porNombre.get(n)));
        // Lo último que se registró, del más nuevo al más viejo.
        const recientes = [];
        ['0', '-1'].forEach((d) => comidasDe(d).slice().sort((x, y) => y.hora - x.hora).forEach((c) => c.items.slice().reverse().forEach((it) => { if (!it.rapida) recientes.push(porId.get(it.alimento)); })));
        seccion(tx('comida.recientes'), recientes);
        seccion(tx('comida.favoritos'), [...s.favoritos].map((id) => porId.get(id)));
        return;
      }
      // Una comida entera escrita de una vez (como pareceUnaComida en la app): se anota toda junta.
      const comidaEntera = /,/.test(texto) || /\s(?:y|e|and)\s+(?:\d|un|una|dos|tres|cuatro|media|medio|a|an|two|three)(?![\p{L}])/iu.test(texto);
      if (comidaEntera) {
        const b = boton('hj-siempre', '', () => abrirDecir({ texto }));
        b.dataset.toque = '';
        const textos = el('div', 'hj-fila-txt');
        textos.append(el('b', null, tx('comida.decir.todoJunto')), el('span', null, texto));
        const chispa = el('span', 'hj-siempre-mas');
        chispa.innerHTML = icono('chispa');
        b.append(textos, chispa);
        cuerpo.appendChild(b);
      }
      const resultados = buscar(texto);
      // Sin resultados para una comida entera no hay nada que crear: está «anotar todo junto».
      if (!resultados.length && comidaEntera) return;
      if (!resultados.length) {
        const vacio = el('div', 'hj-vacio');
        vacio.appendChild(el('p', null, tx('comida.sinResultados', { texto })));
        const acciones = el('div', 'hj-vacio-acciones');
        acciones.append(
          boton('hj-atajo', `${icono('etiqueta')}<span>${tx('comida.crearAlimento')}</span>`, () => avisarHoja('Galería: crear un alimento (a mano o con la etiqueta) llega en la etapa 6.')),
          boton('hj-atajo', `${icono('rayo')}<span>${tx('comida.cargaRapida')}</span>`, () => abrirRapida()),
        );
        vacio.appendChild(acciones);
        cuerpo.appendChild(vacio);
        return;
      }
      resultados.forEach(({ a, coincide }) => {
        const [p, v, g] = conUltima(a);
        // Si lo que coincidió es otro nombre («aguacate» para la palta), se muestra al lado.
        const n = Buscar.normalizar;
        const extra = n(coincide) !== n(nombreDe(a)) && !n(nombreDe(a)).includes(n(texto)) && coincide.length < 28 ? coincide.toLowerCase() : null;
        cuerpo.appendChild(fila(a, p, v, extra, g));
      });
    }

    // ------------------------------------------------------------ la búsqueda
    // Los textos de búsqueda de cada alimento, con sus palabras y trigramas ya armados: hacen las
    // veces de los dos índices FTS5 del teléfono (palabras con prefijo y trigramas). El orden es
    // el de la app (Buscar.mejoresPorAlimento); falta bm25, que acá vale lo mismo para todos.
    const textosDe = (a) => a.t.map(([i, region, principal, texto]) => {
      const normal = Buscar.normalizar(texto);
      const trigramas = new Set();
      normal.split(' ').forEach((p) => { for (let k = 0; k + 3 <= p.length; k++) trigramas.add(p.slice(k, k + 3)); });
      return { alimento: a.id, idioma: i, region: region || null, principal, texto, palabras: normal.split(' '), trigramas, rango: 0 };
    });
    const corpus = ALIMENTOS.flatMap(textosDe);
    function buscar(texto) {
      const normal = Buscar.normalizar(texto);
      const palabras = normal.split(' ').filter(Boolean);
      if (!palabras.length) return [];
      const candidatos = corpus.filter((t) => palabras.every((p) => t.palabras.some((w) => w.startsWith(p)))).map((t) => Object.assign({}, t, { aproximado: false }));
      if (normal.length >= 3 && new Set(candidatos.map((c) => c.alimento)).size < Buscar.POCOS) {
        const buscados = new Set();
        palabras.forEach((p) => { for (let k = 0; k + 3 <= p.length; k++) buscados.add(p.slice(k, k + 3)); });
        corpus.forEach((t) => {
          if (t.idioma !== idioma || ![...buscados].some((g) => t.trigramas.has(g))) return;
          if (Buscar.parecido(texto, t.texto) >= Buscar.PARECIDO_MINIMO) candidatos.push(Object.assign({}, t, { aproximado: true }));
        });
      }
      // Lo usado sube; lo tuyo (creado desde la etiqueta), también: lo buscás porque lo cargaste.
      const premio = (id) => (s.usos.has(id) ? 2.5 * Math.log1p(s.usos.get(id)) : 0) + (porId.get(id).cat === 'etiqueta' ? 5 : 0);
      return Buscar.mejoresPorAlimento(candidatos, texto, { idioma, region: REGION, premio }, () => true)
        .slice(0, 12)
        .map((c) => ({ a: porId.get(c.alimento), coincide: c.texto }));
    }

    // ------------------------------------------------------------ la comida que se arma
    function comidaDeHoy(tipo) {
      let c = comidasDe(0).find((x) => x.tipo === tipo && !x.plan);
      if (!c) {
        c = { tipo, hora: AHORA, items: [] };
        comidasDe(0).push(c);
      }
      return c;
    }

    // Sumar no registra nada: lo pone en la comida que se arma, que se ve abajo.
    function sumarACanasta(items, texto, botonMas) {
      s.canasta.push(...items);
      escena.haptico('suave');
      if (botonMas) {
        botonMas.innerHTML = icono('listo');
        botonMas.classList.add('hecho');
        setTimeout(() => { botonMas.innerHTML = icono('mas'); botonMas.classList.remove('hecho'); }, 900);
      }
      avisarHoja(tx('comida.sumado', { alimento: texto }), {
        deshacer: () => { s.canasta = s.canasta.filter((x) => !items.includes(x)); pintarBandeja(); },
      });
      pintarBandeja(true);
    }

    // «Agregar»: lo juntado pasa de una vez a la comida de hoy, y recién ahí queda registrado.
    function agregarCanasta() {
      if (!s.hoja || !s.canasta.length) return;
      const tipo = s.hoja.comida;
      const c = comidaDeHoy(tipo);
      const items = s.canasta.map((it) => Object.assign({}, it, { nuevo: true }));
      c.items.push(...items);
      items.forEach((it) => {
        if (it.rapida) return;
        s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces, gramos: it.gramos });
        s.usos.set(it.alimento, (s.usos.get(it.alimento) || 0) + 1);
      });
      const texto = items.length === 1
        ? [nombreDeItem(items[0]), cantidadDe(items[0])].filter(Boolean).join(' · ')
        : `${tx('comida.comidas.' + tipo)} · ${plural('comida.agregados', items.length, { kcal: numero(Math.round(sumar(items).kcal)) })}`;
      s.canasta = [];
      s.hoja.agregado = true;
      escena.haptico('toque');
      registrado(texto);
      cerrarHoja();
    }

    function registrado(texto) {
      opciones.alRegistrar({ texto, toques: s.toques, escribio: s.escribio });
      s.toques = 0;
      s.escribio = false;
    }

    const deAyer = (tipo) => {
      const ayer = comidasDe(-1).find((c) => c.tipo === tipo);
      return ayer ? ayer.items.map((it) => Object.assign({}, it)) : [];
    };

    // El atajo de la hoja («Cena de ayer»): lo de ayer, a la comida que se arma.
    function sumarDeAyer(tipo) {
      const items = deAyer(tipo);
      if (!items.length) { avisarHoja(tx('comida.sinResultados', { texto: tx('comida.deAyer.' + tipo) })); return; }
      sumarACanasta(items, tx('comida.deAyer.' + tipo));
    }

    // «Copiar de ayer» en la línea del día: la revisión con lo de ayer, para agregarlo de un toque.
    function copiarDeAyer(tipo) {
      const items = deAyer(tipo);
      if (!items.length) { avisarZona(tx('comida.sinResultados', { texto: tx('comida.deAyer.' + tipo) })); return; }
      if (!abrirHoja({ comida: tipo, revisar: true })) return;
      s.canasta.push(...items);
      pintarBandeja();
      abrirRevision();
    }

    // Tocar un registro en la línea del día abre su ventana para corregirlo.
    function editar(c, it) {
      if (it.rapida) return;
      if (!abrirHoja({ comida: c.tipo, soloEditar: true })) return;
      abrirVentana(porId.get(it.alimento), { porcion: it.porcion, veces: it.veces, gramos: it.gramos, editando: { comida: c, item: it } });
    }

    let avisoHoja = 0;
    function avisarHoja(texto, acciones) {
      const a = $h('.hj-aviso');
      a.querySelector('span').textContent = texto;
      const btns = a.querySelector('.hj-aviso-btns');
      btns.innerHTML = '';
      if (acciones && acciones.deshacer) btns.appendChild(boton('hj-aviso-btn', tx('comun.deshacer'), () => { a.classList.remove('visible'); acciones.deshacer(); }));
      a.classList.add('visible');
      clearTimeout(avisoHoja);
      avisoHoja = setTimeout(() => a.classList.remove('visible'), acciones ? 4200 : 2800);
    }

    // La comida que se arma, abajo, con su total y «Listo», que abre la revisión.
    function pintarBandeja(late) {
      const b = $h('.hj-bandeja');
      if (!s.hoja || !s.canasta.length || s.hoja.soloEditar) { b.hidden = true; hoja.classList.remove('con-bandeja'); return; }
      const t = sumar(s.canasta);
      b.hidden = false;
      hoja.classList.add('con-bandeja');
      b.innerHTML = '';
      const textos = el('div', 'hj-bandeja-txt');
      textos.append(el('b', null, tx('comida.tuComida.' + s.hoja.comida)), el('span', null, plural('comida.agregados', s.canasta.length, { kcal: numero(Math.round(t.kcal)) })));
      b.append(textos, boton('hj-listo', tx('comun.listo'), () => abrirRevision()));
      if (late) {
        b.classList.remove('late');
        void b.offsetWidth;
        b.classList.add('late');
      }
    }

    // ------------------------------------------------------------ los paneles: revisión, carga rápida y guardadas
    function abrirSub(clase, armar) {
      const sub = $h('.hj-sub');
      sub.className = 'hj-panel hj-sub ' + clase;
      sub.innerHTML = '';
      armar(sub);
      sub.hidden = false;
      entrada.blur();
      $h('.hj-aviso').classList.remove('visible');
      // Un cuadro con el panel a la derecha, para que entre deslizándose.
      void sub.offsetWidth;
      hoja.classList.add('en-sub');
      s.hoja.sub = clase;
    }
    function cerrarSub(deUna) {
      const sub = $h('.hj-sub');
      hoja.classList.remove('en-sub');
      if (s.hoja) s.hoja.sub = null;
      if (deUna) { sub.hidden = true; sub.innerHTML = ''; return; }
      setTimeout(() => { if (!hoja.classList.contains('en-sub')) { sub.hidden = true; sub.innerHTML = ''; } }, 380);
    }
    function cabezaDeSub(sub, titulo, derecha) {
      const cab = el('header', 'hj-sub-cab');
      cab.append(boton('hj-atras', icono('atras'), () => cerrarSub(), tx('comun.cancelar')), el('span', 'hj-sub-titulo', titulo || ''));
      cab.appendChild(derecha || el('span'));
      sub.appendChild(cab);
    }

    // La revisión: todo lo que se juntó, para cambiar una porción o quitar algo antes de agregar.
    function abrirRevision() {
      if (!s.hoja || !s.canasta.length) return;
      abrirSub('hj-revision', (sub) => {
        cabezaDeSub(sub, tx('comida.tuComida.' + s.hoja.comida));
        sub.appendChild(el('div', 'rv-cuerpo'));
        const pie = el('footer', 'fi-pie');
        pie.append(
          boton('fi-agregar', tx('comida.agregarA.' + s.hoja.comida), () => agregarCanasta()),
          boton('fi-quitar', tx('comida.guardarComida'), () => avisarHoja('Galería: guardar esta comida con un nombre, para la próxima.')),
        );
        sub.appendChild(pie);
      });
      pintarRevision();
    }

    function pintarRevision() {
      const cuerpo = $h('.hj-revision .rv-cuerpo');
      if (!cuerpo) return;
      cuerpo.innerHTML = '';
      cuerpo.appendChild(el('p', 'rv-texto', tx('comida.revisarTexto')));
      s.canasta.forEach((it) => {
        const f = el('div', 'hj-fila');
        const textos = el('div', 'hj-fila-txt');
        textos.append(el('b', null, nombreDeItem(it)), el('span', null, [cantidadDe(it), `${numero(Math.round(valoresDe(it).kcal))} kcal`].filter(Boolean).join(' · ')));
        const quitar = boton('rv-quitar', icono('cerrar'), () => {
          s.canasta = s.canasta.filter((x) => x !== it);
          pintarBandeja();
          if (!s.canasta.length) cerrarSub(); else pintarRevision();
        }, tx('comida.quitar'));
        f.append(textos, quitar);
        if (!it.rapida) {
          f.dataset.toque = '';
          f.tabIndex = 0;
          f.setAttribute('role', 'button');
          f.addEventListener('click', () => abrirVentana(porId.get(it.alimento), { porcion: it.porcion, veces: it.veces, gramos: it.gramos, enCanasta: it }));
        }
        cuerpo.appendChild(f);
      });
      // El total y lo que queda en el día después de agregar.
      const t = sumar(s.canasta);
      const total = el('div', 'rv-total');
      const kcal = el('div', 'fi-kcal');
      kcal.append(el('b', null, numero(Math.round(t.kcal))), el('span', null, tx('comida.kcal')));
      const restante = META.kcal - totalDe(0).kcal - t.kcal;
      total.append(kcal, el('div', 'fi-queda', tx(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) })), chipsDeMacros(t));
      cuerpo.appendChild(total);
    }

    function chipsDeMacros(v) {
      const macros = el('div', 'fi-macros');
      [['p', 'proteina', v.p], ['c', 'carbohidratos', v.c], ['g', 'grasas', v.g]].forEach(([m, clave, g]) => {
        const chip = el('span', 'fi-macro fi-macro-' + m);
        chip.append(el('i'), el('b', null, `${numero(g, g < 10 ? 1 : 0)} g`), el('small', null, tx('comida.' + clave)));
        macros.appendChild(chip);
      });
      return macros;
    }

    // La carga rápida: calorías y macros a mano, para lo que no está o no vale la pena buscar.
    function abrirRapida() {
      abrirSub('hj-rapida', (sub) => {
        cabezaDeSub(sub, tx('comida.cargaRapida'));
        const cuerpo = el('div', 'fi-cuerpo');
        const campos = {};
        const campo = (clave, etiqueta, unidad, modo) => {
          const fila = el('label', 'cr-campo');
          const input = el('input');
          input.type = 'text';
          if (modo !== 'texto') { input.inputMode = 'decimal'; input.placeholder = '0'; } else input.placeholder = tx('comida.opcional');
          fila.append(el('span', null, etiqueta), input);
          if (unidad) fila.appendChild(el('em', null, unidad));
          input.addEventListener('input', pintar);
          campos[clave] = input;
          cuerpo.appendChild(fila);
        };
        campo('nombre', tx('comida.nombre'), '', 'texto');
        campo('kcal', tx('comida.kcal'), 'kcal');
        campo('p', tx('comida.proteina'), 'g');
        campo('c', tx('comida.carbohidratos'), 'g');
        campo('g', tx('comida.grasas'), 'g');
        const nota = el('p', 'cr-nota', tx('comida.cargaRapidaTexto'));
        cuerpo.appendChild(nota);
        sub.appendChild(cuerpo);
        const pie = el('footer', 'fi-pie');
        const leer = (k) => Number(String(campos[k].value).replace(',', '.')) || 0;
        const valores = () => {
          const p = leer('p'), c = leer('c'), g = leer('g');
          const kcal = campos.kcal.value ? leer('kcal') : p * 4 + c * 4 + g * 9;
          return { kcal, p, c, g };
        };
        const sumarB = boton('fi-agregar', tx('comida.sumar'), () => {
          const v = valores();
          if (!v.kcal) { campos.kcal.focus(); return; }
          const it = Object.assign({ rapida: true, nombre: campos.nombre.value.trim() }, v);
          cerrarSub();
          sumarACanasta([it], nombreDeItem(it));
        });
        pie.appendChild(sumarB);
        sub.appendChild(pie);
        function pintar() {
          const v = valores();
          campos.kcal.placeholder = v.kcal && !campos.kcal.value ? numero(Math.round(v.kcal)) : '0';
          sumarB.disabled = !v.kcal;
        }
        pintar();
        setTimeout(() => campos.kcal.focus({ preventScroll: true }), 60);
      });
    }

    // La etiqueta (etapa 6): lo que el iPhone lee de la foto pasa por el lector de verdad
    // (src/comida/etiqueta.ts) y se revisa acá antes de guardar. El alimento queda guardado con su
    // código: la próxima vez se encuentra solo. La foto es de mentira; los números, de una etiqueta
    // uruguaya de galletitas.
    const ETIQUETA = [
      'INFORMACIÓN NUTRICIONAL', 'Porción 30 g (5 galletitas)', 'Cantidad por porción %VD(*)', 'Valor energético 140 kcal = 588 kJ 7',
      'Carbohidratos 20 g 7', 'Proteínas 2,4 g 3', 'Grasas totales 5,6 g 10', 'Grasas saturadas 2,5 g 11', 'Grasas trans 0 g -',
      'Fibra alimentaria 0,9 g 4', 'Sodio 105 mg 4',
    ];
    let creados = 0;
    function abrirEtiqueta(conError) {
      if (!s.hoja) return;
      // Con un número mal leído (un 1 que fue 3), para ver el aviso de 4/4/9.
      const lineas = conError ? ETIQUETA.map((l) => l.replace('140 kcal', '340 kcal')) : ETIQUETA;
      const leida = Etiqueta.leerEtiqueta(lineas);
      abrirSub('hj-etiqueta', (sub) => {
        cabezaDeSub(sub, tx('comida.etiquetaRevision.titulo'));
        const cuerpo = el('div', 'fi-cuerpo');
        const foto = el('div', 'et-foto');
        lineas.forEach((l) => foto.appendChild(el('div', null, l)));
        cuerpo.append(foto, el('p', 'et-leida', tx('comida.etiquetaRevision.leida')));
        leida.avisos.forEach((a) => cuerpo.appendChild(el('p', 'et-aviso', tx('comida.etiquetaRevision.' + a))));
        const campos = {};
        const campo = (clave, etiquetaTxt, unidad, valor, texto) => {
          const fila = el('label', 'cr-campo');
          const input = el('input');
          input.type = 'text';
          input.dataset.clave = clave;
          if (texto) input.placeholder = texto;
          else { input.inputMode = 'decimal'; input.placeholder = '0'; }
          if (valor != null) input.value = Porciones.decimal(valor, idioma);
          fila.append(el('span', null, etiquetaTxt), input);
          if (unidad) fila.appendChild(el('em', null, unidad));
          campos[clave] = input;
          cuerpo.appendChild(fila);
          return fila;
        };
        campo('nombre', tx('comida.nombre'), '', null, tx('comida.etiquetaRevision.nombreEjemplo'));
        campo('marca', tx('comida.etiquetaRevision.marca'), '', null, tx('comida.opcional'));
        campo('porcion', tx('comida.etiquetaRevision.porcion'), 'g', leida.porcion ? leida.porcion.gramos : null);
        cuerpo.appendChild(el('div', 'fi-etq', tx('comida.etiquetaRevision.porPorcion')));
        const v = leida.porPorcion;
        const kcal = campo('kcal', tx('comida.kcal'), 'kcal', v.kcal);
        kcal.classList.toggle('mal', leida.avisos.includes('noCierra'));
        campo('c', tx('comida.carbohidratos'), 'g', v.carbohidratos);
        campo('p', tx('comida.proteina'), 'g', v.proteina);
        campo('g', tx('comida.grasas'), 'g', v.grasas);
        campo('saturadas', tx('comida.secundarios.saturadas'), 'g', v.saturadas);
        campo('fibra', tx('comida.secundarios.fibra'), 'g', v.fibra);
        campo('sodio', tx('comida.secundarios.sodio'), 'mg', v.sodio);
        sub.appendChild(cuerpo);
        const leer = (k) => (campos[k].value.trim() === '' ? null : Number(campos[k].value.replace(/\./g, '').replace(',', '.')));
        const pie = el('footer', 'fi-pie');
        pie.appendChild(boton('fi-agregar', tx('comida.etiquetaRevision.guardarYSumar'), () => {
          const nombre = campos.nombre.value.trim();
          const gramos = leer('porcion');
          if (!nombre) { campos.nombre.focus(); return; }
          if (!gramos) { campos.porcion.focus(); return; }
          const f = 100 / gramos;
          const por100 = (k) => (leer(k) == null ? null : leer(k) * f);
          // Como un genérico más, pero tuyo: con su porción y encontrable desde ya.
          const medida = (leida.porcion && /\(([^)]+)\)/.exec(leida.porcion.texto)) || null;
          const nombrePorcion = medida ? medida[1] : `${Porciones.decimal(gramos, 'es')} g`;
          const a = {
            id: -(100000 + ++creados), es: nombre, en: nombre, cat: 'etiqueta',
            v: [por100('kcal') || 0, por100('p') || 0, por100('c') || 0, por100('g') || 0],
            s: [por100('fibra'), null, por100('saturadas'), por100('sodio'), null],
            p: [[nombrePorcion, nombrePorcion, gramos]], d: 0, t: [['es', '', 1, nombre], ['en', '', 1, nombre]],
          };
          ALIMENTOS.push(a);
          porId.set(a.id, a);
          porNombre.set(a.es, a);
          corpus.push(...textosDe(a));
          cerrarSub();
          sumarACanasta([{ alimento: a.id, porcion: 0, veces: 1 }], `${nombre} · ${nombrePorcion}`);
        }));
        sub.appendChild(pie);
        setTimeout(() => campos.nombre.focus({ preventScroll: true }), 60);
      });
    }

    // Las comidas guardadas: un toque suma todo a la comida que se arma.
    function abrirGuardadas() {
      abrirSub('hj-guardadas', (sub) => {
        cabezaDeSub(sub, tx('comida.guardadas'));
        const cuerpo = el('div', 'hj-cuerpo');
        GUARDADAS.forEach((g) => {
          const items = g.items.map(([n, v, p]) => item(n, v, p)).filter(Boolean);
          const t = sumar(items);
          const f = el('div', 'hj-fila');
          const textos = el('div', 'hj-fila-txt');
          textos.append(el('b', null, g.nombre[idioma]), el('span', null, `${items.map(nombreDeItem).join(', ')} · ${numero(Math.round(t.kcal))} kcal`));
          const mas = boton('hj-mas', icono('mas'), () => {
            sumarACanasta(items.map((it) => Object.assign({}, it)), g.nombre[idioma], mas);
            setTimeout(() => cerrarSub(), 500);
          }, tx('comida.sumarAlimento', { alimento: g.nombre[idioma] }));
          f.append(textos, mas);
          cuerpo.appendChild(f);
        });
        // Las recetas: un toque suma un plato (lo de la olla dividido por lo que rinde).
        if (s.recetas.length) cuerpo.appendChild(el('div', 'fi-etq hj-etq-recetas', tx('comida.recetas')));
        s.recetas.forEach((r) => {
          const plato = r.items.map((it) => Object.assign({}, it, { gramos: Math.max(1, Math.round(it.gramos / r.porciones)) }));
          const f = el('div', 'hj-fila');
          const textos = el('div', 'hj-fila-txt');
          textos.append(el('b', null, r.nombre), el('span', null, tx('comida.receta.porPlato', { kcal: numero(Math.round(sumar(plato).kcal)) })));
          const mas = boton('hj-mas', icono('mas'), () => {
            sumarACanasta(plato, `${r.nombre} · ${tx('comida.receta.plato')}`, mas);
            setTimeout(() => cerrarSub(), 500);
          }, tx('comida.receta.sumarPlato'));
          f.append(textos, mas);
          cuerpo.appendChild(f);
        });
        sub.appendChild(cuerpo);
        const pie = el('footer', 'fi-pie');
        pie.appendChild(boton('fi-secundario', `${icono('copiar')}<span>${tx('comida.receta.pegar')}</span>`, () => abrirPegarReceta()));
        sub.appendChild(pie);
      });
    }

    // Pegar una receta: el texto como venga (RecetaDeTexto, el mismo lector que la app), cada
    // ingrediente buscado en la base con sus gramos, y la revisión antes de guardarla.
    function abrirPegarReceta() {
      abrirSub('hj-pegar', (sub) => {
        cabezaDeSub(sub, tx('comida.receta.pegar'));
        const cuerpo = el('div', 'hj-cuerpo');
        cuerpo.appendChild(el('p', 'hj-pegar-texto', tx('comida.receta.pegarTexto')));
        const area = el('textarea', 'hj-pegar-area');
        area.value = tx('comida.receta.ejemplo');
        area.rows = 9;
        area.setAttribute('aria-label', tx('comida.receta.pegar'));
        const resultado = el('div', 'hj-pegar-resultado');
        cuerpo.append(area, resultado);
        sub.appendChild(cuerpo);
        const pie = el('footer', 'fi-pie');
        const guardar = boton('fi-agregar', tx('comida.receta.guardar'), () => {});
        guardar.disabled = true;
        pie.append(boton('fi-secundario', tx('comida.receta.leer'), () => leer()), guardar);
        sub.appendChild(pie);
        let leida = null;
        const leer = () => {
          const texto = area.value;
          const receta = RecetaDeTexto.leerReceta(texto, idioma);
          const primera = texto.split('\n').map((l) => l.trim()).find(Boolean) || '';
          const nombre = receta.lineas.some((l) => l.texto.trim() === primera) || !primera ? tx('comida.receta.titulo') : primera.replace(/^#+\s*/, '');
          const lineas = receta.lineas.map((l) => {
            const a = (buscar(l.buscado)[0] || {}).a || null;
            const gramos = a ? RecetaDeTexto.gramosDeLinea(l, { porciones: a.p.map((p, i) => ({ nombre: porcionDe(a, i), gramos: p[2] })), densidad: null }) : null;
            return { linea: l, a, gramos, fuera: false };
          });
          leida = { nombre, porciones: receta.porciones || 1, lineas };
          pintarLeida();
        };
        function pintarLeida() {
          resultado.innerHTML = '';
          const usables = leida.lineas.filter((x) => x.a && x.gramos && !x.fuera);
          guardar.disabled = !usables.length;
          if (!leida.lineas.length) { resultado.appendChild(el('p', 'hj-pegar-texto', tx('comida.receta.nadaLeido'))); return; }
          const cab = el('div', 'hj-pegar-cab');
          cab.append(el('b', null, leida.nombre), el('span', null, `${tx('comida.receta.porciones')} ${leida.porciones} ${tx('comida.receta.porcionesUnidad')}`));
          resultado.append(cab, el('p', 'hj-pegar-texto', tx('comida.receta.encontrados', { n: leida.lineas.filter((x) => x.a && x.gramos).length, total: leida.lineas.length })));
          const lista = el('ul', 'hj-pegar-lista');
          leida.lineas.forEach((x) => {
            const li = el('li', 'hj-pegar-fila' + (x.fuera ? ' fuera' : '') + (!x.a || !x.gramos ? ' sin' : ''));
            const textos = el('div', 'hj-fila-txt');
            textos.append(el('b', null, x.a ? nombreDe(x.a) : tx('comida.receta.sinEncontrar')), el('span', null, x.linea.texto));
            const kcal = x.a && x.gramos ? Math.round(valoresDe({ alimento: x.a.id, gramos: x.gramos }).kcal) : null;
            const derecha = el('div', 'hj-pegar-cuanto');
            derecha.append(el('b', null, x.gramos ? `${numero(Math.round(x.gramos))} g` : x.a ? tx('comida.receta.sinCantidad') : ''), el('span', null, kcal != null ? `${numero(kcal)} kcal` : ''));
            li.append(textos, derecha);
            if (x.a && x.gramos) {
              li.dataset.toque = '';
              li.addEventListener('click', () => { x.fuera = !x.fuera; escena.haptico('suave'); pintarLeida(); });
            }
            lista.appendChild(li);
          });
          resultado.appendChild(lista);
          const total = sumar(usables.map((x) => ({ alimento: x.a.id, gramos: x.gramos })));
          resultado.appendChild(el('p', 'hj-pegar-total', tx('comida.receta.porPlato', { kcal: numero(Math.round(total.kcal / leida.porciones)) })));
        }
        guardar.addEventListener('click', () => {
          if (!leida) return;
          const items = leida.lineas.filter((x) => x.a && x.gramos && !x.fuera).map((x) => ({ alimento: x.a.id, gramos: Math.round(x.gramos) }));
          if (!items.length) return;
          s.recetas.push({ nombre: leida.nombre, porciones: leida.porciones, items });
          escena.haptico('toque');
          avisarHoja(tx('comida.receta.guardada', { nombre: leida.nombre }));
          abrirGuardadas();
        });
        // En la galería se lee solo al abrir, para ver el resultado de una.
        leer();
      });
    }

    // ------------------------------------------------------------ tu comida de siempre
    // La misma combinación de alimentos en esa comida al menos dos veces en las dos últimas semanas
    // (deSiempre en src/dominio/registros.ts), con las cantidades de la última vez.
    function deSiempre(tipo) {
      const veces = new Map();
      for (let d = -1; d >= -14; d--) {
        const c = comidasDe(d).find((x) => x.tipo === tipo && !x.plan);
        if (!c) continue;
        const ids = [...new Set(c.items.filter((it) => !it.rapida).map((it) => it.alimento))].sort((a, b) => a - b);
        if (ids.length < 2) continue;
        const firma = ids.join('|');
        const v = veces.get(firma) || { n: 0, d, c };
        v.n += 1;
        veces.set(firma, v);
      }
      const mejor = [...veces.values()].filter((v) => v.n >= 2).sort((a, b) => b.n - a.n || b.d - a.d)[0];
      return mejor ? mejor.c.items.filter((it) => !it.rapida).map((it) => ({ alimento: it.alimento, porcion: it.porcion, veces: it.veces, gramos: it.gramos })) : null;
    }

    // ------------------------------------------------------------ decir lo que comí
    // Decir o escribir la comida de una vez (Frase, el mismo lector que la app): en el iPhone escucha
    // el reconocimiento de voz del teléfono; acá la frase de ejemplo se escribe sola, como si se
    // dictara. Cada cosa se busca con el buscador de siempre (como entender.ts) y se revisa: su
    // cantidad se cambia ahí, y se pregunta solo si cambia el número (40 kcal o un 15 %).
    const llano = (t) => Buscar.normalizar(t).split(' ').map((p) => (p.length > 3 ? p.replace(/(?:es|s)$/, '') : p)).join(' ');
    const COCCION = /(?:plancha|horno|hervid|frit|asad|cocid|crud|revuelt|guisad|saltead|grill|baked|boiled|fried|roast|cooked|raw|scrambled)/;
    const cambiaElNumero = (a, b) => { const d = Math.abs(a - b); return d >= 40 || (d >= 15 && d >= 0.15 * Math.max(a, b)); };
    const kcalDe = (it) => valoresDe(it).kcal;
    function itemDicho(a, dicho) {
      const porciones = a.p.map((p, i) => ({ nombre: porcionDe(a, i), gramos: p[2], i }));
      // Una medida de la casa queda como se dijo («1 vaso», no «206 g»), con la porción de ese nombre.
      if (dicho.cantidad != null && dicho.medida) {
        const medida = Buscar.normalizar('1 ' + dicho.medida);
        const propia = porciones.find((p) => { const n = Buscar.normalizar(p.nombre); return n === medida || n.startsWith(medida + ' '); });
        if (propia) return { item: { alimento: a.id, porcion: propia.i, veces: dicho.cantidad }, supuesto: false };
      }
      if (dicho.cantidad != null && (dicho.unidad || dicho.tamano)) {
        const g = RecetaDeTexto.gramosDeLinea(dicho, { porciones, densidad: null });
        if (g) return { item: { alimento: a.id, gramos: Math.round(g) }, supuesto: false };
      }
      if (dicho.cantidad != null) {
        if (dicho.cantidad >= 20) return { item: { alimento: a.id, gramos: dicho.cantidad }, supuesto: false };
        const palabra = llano(dicho.buscado).split(' ')[0];
        const una = porciones.find((p) => /^1\s/.test(p.nombre) && llano(p.nombre).split(' ')[1] === palabra)
          || porciones.find((p) => /^1\s+(?:unidad|mediana?o?|grande|pieza|rebanada|porci[oó]n t[ií]pica|medium|large|piece|slice)/i.test(p.nombre));
        return { item: { alimento: a.id, porcion: una ? una.i : a.d, veces: dicho.cantidad }, supuesto: false };
      }
      const ultima = s.ultima.get(a.id);
      if (ultima) return { item: Object.assign({ alimento: a.id }, ultima), supuesto: false };
      const chica = dicho.acompanante ? porciones.slice().sort((x, y) => x.gramos - y.gramos)[0] : null;
      return { item: { alimento: a.id, porcion: chica ? chica.i : a.d, veces: 1 }, supuesto: true };
    }
    function entenderDicho(dicho) {
      const buscado = llano(dicho.buscado);
      const exacto = (r) => llano(nombreDe(r.a)) === buscado || llano(r.coincide) === buscado;
      const res = buscar(dicho.buscado).sort((x, y) => Number(exacto(y)) - Number(exacto(x)));
      if (!res.length) return { dicho, opciones: [], elegida: 0, pregunta: null, supuesto: false };
      const top = res[0].a;
      const { item, supuesto } = itemDicho(top, dicho);
      const sola = { dicho, opciones: [item], elegida: 0, pregunta: null, supuesto };
      if (!exacto(res[0]) && !s.usos.has(top.id)) {
        const cabeza = buscado.split(' ')[0];
        const parecidos = res.slice(1).filter((r) => { const p = llano(nombreDe(r.a)).split(' '); return p[0] === cabeza && p.length <= 3 && !p.includes('con'); }).slice(0, 2);
        const opciones = [item, ...parecidos.map((r) => itemDicho(r.a, dicho).item)];
        if (opciones.some((o) => cambiaElNumero(kcalDe(o), kcalDe(item)))) return Object.assign({}, sola, { opciones, pregunta: 'cual' });
      }
      if ((item.gramos != null || dicho.medida) && dicho.unidad && !COCCION.test(buscado)) {
        const nombre = top.es;
        const otro = porNombre.get(nombre.replace(/cocid([oa])/, 'crud$1')) || porNombre.get(nombre.replace(/crud([oa])/, 'cocid$1'));
        if (otro && otro !== top) {
          // Los gramos son los mismos; la taza de arroz crudo pesa otra cosa que la de cocido.
          const alterna = item.gramos != null ? { alimento: otro.id, gramos: item.gramos } : itemDicho(otro, dicho).item;
          if (cambiaElNumero(kcalDe(alterna), kcalDe(item))) return Object.assign({}, sola, { opciones: [item, alterna], pregunta: 'crudo' });
        }
      }
      if (supuesto && item.porcion != null) {
        const opciones = [0.5, 1, 1.5].map((veces) => Object.assign({}, item, { veces }));
        if (opciones.some((o) => cambiaElNumero(kcalDe(o), kcalDe(item)))) return Object.assign({}, sola, { opciones, elegida: 1, pregunta: 'cuanto' });
      }
      return sola;
    }

    function abrirDecir({ escuchar, texto } = {}) {
      if (!s.hoja) return;
      abrirSub('hj-decir', (sub) => {
        cabezaDeSub(sub, tx('comida.decir.titulo'));
        const cuerpo = el('div', 'hj-cuerpo dc-cuerpo');
        const lugar = el('div', 'dc-mic-lugar');
        const mic = boton('dc-mic', icono('microfono'), () => (escuchando ? parar() : empezar()), tx('comida.decir.hablar'));
        mic.dataset.toque = '';
        lugar.append(el('span', 'dc-aro'), mic);
        const ayuda = el('p', 'dc-ayuda', tx('comida.decir.ayuda'));
        const area = el('textarea', 'hj-pegar-area dc-area');
        area.rows = 3;
        area.placeholder = tx('comida.decir.ejemplo');
        area.setAttribute('aria-label', tx('comida.decir.titulo'));
        if (texto) area.value = texto;
        const resultado = el('div', 'dc-resultado');
        cuerpo.append(lugar, ayuda, area, resultado);
        sub.appendChild(cuerpo);
        const pie = el('footer', 'fi-pie');
        const entenderB = boton('fi-secundario', tx('comida.decir.entender'), () => entenderYa());
        const agregarB = boton('fi-agregar', '', () => agregar());
        agregarB.dataset.toque = '';
        agregarB.hidden = true;
        pie.append(entenderB, agregarB);
        sub.appendChild(pie);
        let escuchando = false;
        let reloj = 0;
        let lista = null;
        let comidaDicha = s.hoja.comida;
        let entendido = null;
        area.addEventListener('input', () => pintarPie());
        function empezar() {
          escuchando = true;
          sub.classList.add('escuchando');
          mic.setAttribute('aria-label', tx('comida.decir.parar'));
          ayuda.textContent = tx('comida.decir.teEscucho');
          const frase = tx('comida.decir.ejemplo').toLowerCase();
          area.value = '';
          let i = 0;
          clearInterval(reloj);
          reloj = setInterval(() => {
            if (!sub.classList.contains('hj-decir')) { clearInterval(reloj); return; }
            i = Math.min(frase.length, i + 3);
            area.value = frase.slice(0, i);
            if (i >= frase.length) { parar(); entenderYa(); }
          }, 55);
        }
        function parar() {
          clearInterval(reloj);
          escuchando = false;
          sub.classList.remove('escuchando');
          mic.setAttribute('aria-label', tx('comida.decir.hablar'));
          ayuda.textContent = tx('comida.decir.ayuda');
        }
        function entenderYa() {
          const frase = area.value.trim();
          if (!frase) return;
          const conNombre = new Set(Frase.conCon(frase, idioma).filter((b) => { const r = buscar(b)[0]; return r && Buscar.normalizar(r.coincide) === Buscar.normalizar(b); }));
          const leida = Frase.leerFrase(frase, idioma, (b) => conNombre.has(b));
          if (leida.comida) comidaDicha = leida.comida;
          lista = leida.dichos.map(entenderDicho);
          entendido = frase;
          escena.haptico('suave');
          pintar();
        }
        function pintarPie() {
          const listos = lista && entendido === area.value.trim() ? lista.filter((x) => x.opciones.length) : [];
          agregarB.hidden = !listos.length;
          entenderB.hidden = !!listos.length;
          if (listos.length) agregarB.textContent = `${tx('comida.agregarA.' + comidaDicha)} · ${numero(Math.round(sumar(listos.map((x) => x.opciones[x.elegida])).kcal))} kcal`;
        }
        function pintar() {
          resultado.innerHTML = '';
          if (!lista.length) resultado.appendChild(el('p', 'hj-pegar-texto', tx('comida.decir.nada')));
          lista.forEach((x, i) => {
            const bloque = el('div', 'dc-bloque');
            const fila = el('div', 'dc-fila');
            const textos = el('div', 'hj-fila-txt');
            const it = x.opciones[x.elegida];
            if (!it) {
              textos.append(el('b', 'dc-sin', tx('comida.decir.noEncontre', { que: x.dicho.buscado })), boton('dc-buscar', tx('comida.decir.buscar'), () => { cerrarSub(); entrada.value = x.dicho.buscado; pintarCuerpo(); }));
              fila.append(textos, boton('rv-quitar', icono('cerrar'), () => { lista.splice(i, 1); pintar(); }, tx('comida.quitar')));
              bloque.appendChild(fila);
              resultado.appendChild(bloque);
              return;
            }
            const detalle = el('span', null, `${cantidadDe(it)} · ${numero(Math.round(kcalDe(it)))} kcal`);
            if (x.supuesto) detalle.appendChild(el('em', 'dc-supuesto', ` · ${tx('comida.decir.supuesto')}`));
            textos.append(el('b', null, nombreDeItem(it)), detalle);
            const mover = (signo) => {
              const o = x.opciones[x.elegida];
              if (o.gramos != null) o.gramos = Math.max(1, o.gramos + 10 * signo);
              else o.veces = signo > 0 ? (o.veces < 1 ? Math.min(1, o.veces + 0.5) : Math.floor(o.veces) + 1) : (o.veces > 1 ? Math.ceil(o.veces) - 1 : o.veces > 0.5 ? 0.5 : 0.25);
              x.supuesto = false;
              pintar();
            };
            const pasos = el('div', 'dc-pasos');
            pasos.append(boton('fi-paso', icono('menos'), () => mover(-1), '−'), boton('fi-paso', icono('mas'), () => mover(1), '+'));
            fila.append(textos, pasos, boton('rv-quitar', icono('cerrar'), () => { lista.splice(i, 1); pintar(); }, tx('comida.quitar')));
            bloque.appendChild(fila);
            if (x.pregunta) {
              const g = x.opciones[0].gramos;
              const crudo = g != null ? tx('comida.decir.crudo', { gramos: numero(g) }) : tx('comida.decir.crudoMedida');
              bloque.appendChild(el('p', 'dc-pregunta', x.pregunta === 'crudo' ? crudo : tx(x.pregunta === 'cual' ? 'comida.decir.cual' : 'comida.decir.cuanto', { que: x.dicho.buscado })));
              const chips = el('div', 'fi-porciones dc-opciones');
              x.opciones.forEach((o, k) => {
                const b = boton('fi-porcion', `<span>${x.pregunta === 'cuanto' ? cantidadDe(o) : nombreDeItem(o)}</span><small>${numero(Math.round(kcalDe(o)))} kcal</small>`, () => { x.elegida = k; escena.haptico('suave'); pintar(); });
                b.setAttribute('aria-pressed', String(k === x.elegida));
                chips.appendChild(b);
              });
              bloque.appendChild(chips);
            }
            resultado.appendChild(bloque);
          });
          pintarPie();
        }
        function agregar() {
          const items = lista.filter((x) => x.opciones.length).map((x) => Object.assign({}, x.opciones[x.elegida]));
          if (!items.length) return;
          const r = registrarDirecto(items, area.value.trim(), comidaDicha);
          cerrarHoja();
          avisarZona(plural('comida.decir.anotado', items.length, { comida: tx('comida.aLa.' + comidaDicha) }), r.deshacer);
        }
        if (escuchar) setTimeout(empezar, 380);
        else if (texto) entenderYa();
      });
    }

    // ------------------------------------------------------------ antes y después de entrenar
    // Una línea en la comida que toca (AlrededorDelEntreno, la misma regla que la app), nunca un
    // aviso. Tocarla dice por qué, con las fuentes, y ahí se apaga.
    function lineasDeEntreno() {
      if (!s.verEntreno) return new Map();
      const sesiones = AlrededorDelEntreno.sesionesDelDia(s.entreno, fechaClave(0));
      if (!sesiones.length) return new Map();
      const anotado = {};
      comidasDe(0).filter((c) => !c.plan).forEach((c) => {
        const v = sumar(c.items);
        const antes = anotado[c.tipo];
        anotado[c.tipo] = { hora: antes ? Math.min(antes.hora, c.hora) : c.hora, proteina: (antes ? antes.proteina : 0) + v.p, kcal: (antes ? antes.kcal : 0) + v.kcal };
      });
      // Lo comido, sin lo planificado (como totalDelDia(…, false) en la app).
      const t = sumar(comidasDe(0).filter((c) => !c.plan).flatMap((c) => c.items));
      const lineas = AlrededorDelEntreno.lineasDelDia({
        ahora: AHORA, sesiones, horaDeComida: HORA_TIPICA, anotado,
        meta: { kcal: META.kcal, proteina: META.p, carbohidratos: META.c, grasas: META.g },
        comido: { kcal: t.kcal, proteina: t.p, carbohidratos: t.c, grasas: t.g },
        comidasHabituales: 4, pesoKg: Datos.PESADAS[Datos.PESADAS.length - 1].kg, edad: HOY[0] - Datos.PERFIL.nacimiento,
        despertar: 7 * 60 + 30, dormir: 23 * 60 + 30, cafeinaPorToma: null, sinDeficit: false,
      });
      return new Map(lineas.map((l) => [l.comida, l]));
    }
    function textoDeLinea(l) {
      const h = hora(l.hora);
      const conNumeros = !tel.classList.contains('sin-numeros');
      const c = conNumeros ? l.carbohidratos : null;
      const p = conNumeros ? l.proteina : null;
      const cuanto = c && p ? tx('entreno.cantidades', { c, p }) : p ? tx('entreno.soloProteina', { p }) : c ? tx('entreno.soloCarbohidratos', { c }) : '';
      const partes = [];
      if (l.clase === 'previa') partes.push(tx('entreno.previa', { hora: h }), cuanto || tx('entreno.previaSinNumeros'));
      else if (l.clase === 'previaLiviana') partes.push(tx('entreno.previaLiviana', { hora: h }), cuanto);
      else if (l.clase === 'snackPrevio') partes.push(c ? tx('entreno.snackPrevio', { c }) : tx('entreno.snackPrevioSinNumeros'));
      else if (l.clase === 'ayunasLarga') partes.push(c ? tx('entreno.ayunasLarga', { c }) : tx('entreno.ayunasLargaSinNumeros'));
      else if (l.clase === 'despues') partes.push(p ? tx('entreno.despues', { p }) : tx('entreno.despuesSinNumeros'));
      else if (l.clase === 'despuesPronto') partes.push(p ? tx('entreno.despuesPronto', { p }) : tx('entreno.despuesProntoSinNumeros'));
      else if (l.clase === 'reponer') partes.push(tx('entreno.reponer', { hora: h }), cuanto);
      else partes.push(p ? tx('entreno.antesDeDormir', { p }) : tx('entreno.antesDeDormirSinNumeros'));
      if (l.durantePorHora) partes.push(conNumeros ? tx('entreno.durante', { a: l.durantePorHora[0], b: l.durantePorHora[1] }) : tx('entreno.duranteSinNumeros'));
      if (l.cafeinaHasta != null) partes.push(tx('entreno.cafeina', { hora: hora(l.cafeinaHasta) }));
      return partes.filter(Boolean).join(' ');
    }
    const hojaPorQue = Util.hoja(tel, 'pq-hoja', () => opciones.alCambiar());
    function abrirPorQue(l) {
      const h = hojaPorQue.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('entreno.porQue.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaPorQue.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pq-cuerpo');
      const clave = l.clase === 'reponer' ? 'reponer' : l.clase === 'antesDeDormir' ? 'antesDeDormir' : l.clase === 'despues' || l.clase === 'despuesPronto' ? 'despues' : 'antes';
      cuerpo.append(el('p', 'pq-texto', tx('entreno.porQue.' + clave)));
      if (l.cafeinaHasta != null) cuerpo.appendChild(el('p', 'pq-texto', tx('entreno.porQue.cafeina')));
      cuerpo.append(el('p', 'pf-nota', tx('entreno.porQue.fuentes')), el('p', 'pf-nota', tx('entreno.porQue.medico')), el('p', 'pf-nota', tx('entreno.porQue.volver')));
      const pie = el('footer', 'fi-pie');
      pie.appendChild(boton('fi-secundario', tx('entreno.porQue.noMostrar'), () => { s.verEntreno = false; hojaPorQue.cerrar(); pintarZona(400); avisarCambio(); }));
      h.append(cab, cuerpo, pie);
      hojaPorQue.abrir();
    }
    function lineaDeEntreno(l) {
      const b = boton('cm-entreno', `${icono('pesa')}<span>${textoDeLinea(l)}</span>`, () => abrirPorQue(l));
      b.setAttribute('aria-label', textoDeLinea(l));
      return b;
    }

    // ------------------------------------------------------------ la ventana del alimento
    // Sube desde abajo, sobre la lista: la porción, la cantidad o los gramos, y cuánto deja para el
    // resto del día. Sirve para sumar, para cambiar algo de la comida que se arma (`enCanasta`) y
    // para corregir un registro de la línea del día (`editando`).
    const velo = $h('.hj-velo');
    const ventana = $h('.hj-ventana');
    velo.addEventListener('click', () => cerrarVentana());

    function cerrarVentana(deUna) {
      const soloEditar = !deUna && s.hoja && s.hoja.soloEditar;
      if (s.hoja) s.hoja.ventana = null;
      hoja.classList.remove('con-ventana');
      const esconder = () => { if (!s.hoja || !s.hoja.ventana) { ventana.hidden = true; velo.hidden = true; ventana.innerHTML = ''; } };
      // Un reporte a medio escribir se va con la ventana.
      hoja.querySelectorAll('.vt-reporte').forEach((p) => { p.classList.remove('abierto'); setTimeout(() => p.remove(), 320); });
      if (deUna) esconder(); else setTimeout(esconder, 340);
      // Si la hoja se abrió solo para corregir un registro, se va con la ventana.
      if (soloEditar) cerrarHoja();
    }

    function abrirVentana(a, { porcion, veces, gramos, editando, enCanasta, boton: botonMas }) {
      if (!s.hoja) return;
      entrada.blur();
      teclado(false);
      $h('.hj-aviso').classList.remove('visible');
      s.hoja.ventana = a.id;
      const f = { porcion: gramos != null ? null : porcion, veces: veces || 1, gramos: gramos != null ? gramos : null };
      const elegido = () => (f.gramos != null ? { alimento: a.id, gramos: f.gramos } : { alimento: a.id, porcion: f.porcion, veces: f.veces });
      ventana.innerHTML = '';

      const cab = el('header', 'vt-cab');
      const titulos = el('div', 'vt-titulos');
      // Los ids dicen de dónde sale: receta#N es -(5000 + N) y producto#N, -(10000 + N) (herramientas/alimentos.mjs).
      const fuente = a.cat === 'etiqueta' ? 'etiqueta' : a.id <= -10000 ? 'producto' : a.id <= -5000 ? 'receta' : a.id < 0 ? 'propio' : 'usda';
      // La fuente y si está verificado; al tocarla se abre «¿De dónde sale esto?» (spec/fuentes.md).
      const verificado = !!a.w;
      const lineaFuente = boton('vt-fuente', `<span>${tx('comida.fuente.' + (fuente === 'producto' && a.o === 'off' ? 'productoOff' : fuente))}</span><span class="vt-sello${verificado ? ' si' : ''}">${verificado ? icono('listo') : ''}${tx(verificado ? 'comida.verificado' : 'comida.sinVerificar')}</span>`, () => {
        lineaFuente.setAttribute('aria-expanded', String(deDonde.classList.toggle('abierto')));
      }, tx('comida.deDonde.titulo'));
      lineaFuente.setAttribute('aria-expanded', 'false');
      titulos.append(el('h3', 'vt-nombre', nombreDe(a)), lineaFuente);
      const deDonde = el('div', 'vt-plegable vt-dedonde');
      const deDondeTexto = el('div');
      deDondeTexto.appendChild(el('b', null, tx('comida.deDonde.titulo')));
      const origen = fuente === 'receta' && a.r ? tx('comida.deDonde.receta', { n: a.r[1], g: numero(a.r[0]) })
        : fuente === 'producto' ? tx(a.o === 'off' ? 'comida.deDonde.off' : 'comida.deDonde.producto')
          : fuente === 'propio' ? tx('comida.deDonde.propio') : tx('comida.deDonde.usda');
      deDondeTexto.appendChild(el('p', null, origen));
      const conQue = !a.w ? tx('comida.deDonde.sin') : a.w[1] === 'ingredientes' ? tx('comida.deDonde.ingredientes') : a.w[1] === 'etiqueta' ? tx('comida.deDonde.etiqueta')
        : tx('comida.deDonde.con', { tabla: tx('comida.tablas.' + a.w[1].split(':')[0]) === 'comida.tablas.' + a.w[1].split(':')[0] ? tx('comida.tablas.otra') : tx('comida.tablas.' + a.w[1].split(':')[0]),
          fecha: new Date(a.w[0] + 'T12:00:00').toLocaleDateString(idioma === 'es' ? 'es-UY' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) });
      deDondeTexto.appendChild(el('p', null, conQue));
      deDonde.appendChild(deDondeTexto);
      const estrella = boton('hj-estrella' + (s.favoritos.has(a.id) ? ' activa' : ''), icono('estrella'), () => {
        if (s.favoritos.has(a.id)) s.favoritos.delete(a.id); else s.favoritos.add(a.id);
        estrella.classList.toggle('activa', s.favoritos.has(a.id));
        escena.haptico('suave');
      }, tx('comida.favorito'));
      cab.append(titulos, estrella, boton('vt-cerrar', icono('cerrar'), () => cerrarVentana(), tx('comida.cerrar')));

      const cifras = el('div', 'vt-cifras');
      const kcalB = el('b');
      const kcal = el('div', 'fi-kcal');
      kcal.append(kcalB, el('span', null, tx('comida.kcal')));
      const macros = el('div', 'vt-macros');
      cifras.append(kcal, macros);
      const queda = el('div', 'fi-queda');
      // Cómo deja el día (DejaElDia, el mismo módulo que la app): cada macro antes y con esto.
      const deja = el('div', 'vt-deja');
      const barras = {};
      DejaElDia.MACROS.forEach((m) => {
        const fila = el('div', 'vt-barra fi-macro-' + LETRA[m]);
        const pista = el('div', 'vt-pista');
        pista.append(el('i', 'vt-antes'), el('i', 'vt-suma'));
        fila.append(el('span', null, tx('comida.' + m)), pista, el('b'));
        barras[m] = fila;
        deja.appendChild(fila);
      });
      const secundarios = el('div', 'vt-secundarios');
      // Las vitaminas y los minerales: lo que más aporta, y todo al tocar «Ver todo».
      const persona = { sexo: Datos.PERFIL.sexo, edad: HOY[0] - Datos.PERFIL.nacimiento };
      const tieneMicros = !!(a.u && a.u.some((x) => x != null));
      const microsEtq = el('div', 'fi-etq', tx('comida.micros.titulo'));
      const microsChips = el('div', 'vt-micros');
      const microsTodo = el('div', 'vt-plegable');
      const microsLista = el('div', 'vt-micros-lista');
      microsTodo.appendChild(microsLista);
      const verTodo = boton('vt-ver', tx('comida.micros.verTodo'), () => {
        const abierto = microsTodo.classList.toggle('abierto');
        verTodo.textContent = tx(abierto ? 'comida.micros.verMenos' : 'comida.micros.verTodo');
        verTodo.setAttribute('aria-expanded', String(abierto));
      });
      verTodo.setAttribute('aria-expanded', 'false');
      const porciones = el('div', 'vt-porciones');
      const cantidad = el('div', 'fi-cantidad');
      const gramosTxt = el('div', 'fi-gramos');

      const pie = el('footer', 'vt-pie');
      const guardando = !!(editando || enCanasta);
      pie.appendChild(boton('fi-agregar', guardando ? tx('comun.guardar') : tx('comida.sumar'), () => {
        const it = elegido();
        if (enCanasta) {
          Object.assign(enCanasta, it);
          if (f.gramos == null) delete enCanasta.gramos;
          cerrarVentana();
          pintarRevision();
          pintarBandeja();
        } else if (editando) {
          Object.assign(editando.item, it, { nuevo: true });
          if (f.gramos == null) delete editando.item.gramos;
          s.ultima.set(a.id, { porcion: f.porcion, veces: f.veces, gramos: f.gramos });
          cerrarVentana(true);
          cerrarHoja();
          pintarZona(900);
          avisarCambio();
        } else {
          cerrarVentana();
          sumarACanasta([it], [nombreDe(a), cantidadDe(it)].join(' · '), botonMas);
        }
      }));
      if (enCanasta) {
        pie.appendChild(boton('fi-quitar', tx('comida.quitar'), () => {
          s.canasta = s.canasta.filter((x) => x !== enCanasta);
          cerrarVentana();
          pintarBandeja();
          if (!s.canasta.length) cerrarSub(); else pintarRevision();
        }));
      } else if (editando) {
        pie.appendChild(boton('fi-quitar', tx('comida.quitar'), () => {
          const nombre = nombreDeItem(editando.item);
          const c = editando.comida;
          const lista = comidasDe(diaDe(c));
          c.items.splice(c.items.indexOf(editando.item), 1);
          if (!c.items.length) lista.splice(lista.indexOf(c), 1);
          cerrarVentana(true);
          cerrarHoja();
          pintarZona(900);
          avisarCambio();
          avisarZona(tx('comida.quitado', { alimento: nombre }));
        }));
      }

      // «Reportar un error»: sin usuario, va al servidor de Moss (supabase/moss/0006_alimentos.sql).
      const reportar = boton('vt-reportar', tx('comida.reportar.boton'), () => abrirReporte(a));
      ventana.append(cab, deDonde, cifras, queda, deja, secundarios, ...(tieneMicros ? [microsEtq, microsChips, microsTodo] : []),
        el('div', 'fi-etq', tx('comida.porcion')), porciones, el('div', 'fi-etq', tx('comida.cantidad')), cantidad, gramosTxt, pie, reportar);

      const pintar = () => {
        const it = elegido();
        const v = valoresDe(it);
        contar(kcalB, v.kcal, kcalB.dataset.valor ? 300 : 0);
        // Lo que quedaría en el día: lo registrado, lo que ya se juntó y esto, sin contar lo que se cambia.
        const restarV = (x, y) => ({ kcal: x.kcal - y.kcal, p: x.p - y.p, c: x.c - y.c, g: x.g - y.g });
        const sumarV = (x, y) => ({ kcal: x.kcal + y.kcal, p: x.p + y.p, c: x.c + y.c, g: x.g + y.g });
        const juntado = restarV(sumar(s.canasta), enCanasta ? valoresDe(enCanasta) : { kcal: 0, p: 0, c: 0, g: 0 });
        const antesDia = editando ? restarV(totalDe(diaDe(editando.comida)), valoresDe(editando.item)) : sumarV(totalDe(0), juntado);
        const restante = META.kcal - antesDia.kcal - v.kcal;
        queda.textContent = tx(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) });
        const aMacros = (x) => ({ kcal: x.kcal, proteina: x.p, carbohidratos: x.c, grasas: x.g });
        const dejaria = DejaElDia.comoDejaElDia(aMacros(antesDia), aMacros(v), aMacros(META));
        DejaElDia.MACROS.forEach((m) => {
          const b = dejaria.barras[m];
          const desde = Math.min(1, b.antes);
          const hasta = Math.min(1, b.despues);
          const [antesI, sumaI] = barras[m].querySelectorAll('i');
          antesI.style.width = `${desde * 100}%`;
          sumaI.style.left = `${desde * 100}%`;
          sumaI.style.width = `${Math.max(0, hasta - desde) * 100}%`;
          barras[m].classList.toggle('lleno', b.despues >= 1);
          barras[m].querySelector('b').textContent = tx('comida.porcentaje', { n: numero(Math.round(b.despues * 100)) });
        });
        macros.innerHTML = '';
        [['p', v.p], ['c', v.c], ['g', v.g]].forEach(([m, g]) => {
          const chip = el('span', 'vt-macro fi-macro-' + m);
          chip.append(el('i'), `${numero(g, g < 10 ? 1 : 0)} g`);
          macros.appendChild(chip);
        });
        secundarios.innerHTML = '';
        const factor = gramosDe(it) / 100;
        SECUNDARIOS.forEach(([clave, unidad], i) => {
          const x = a.s ? a.s[i] : null;
          if (x == null || (clave === 'alcohol' && x === 0)) return;
          const n = x * factor;
          secundarios.appendChild(el('span', null, `${tx('comida.secundarios.' + clave)} ${numero(n, unidad === 'g' && n < 10 ? 1 : 0)} ${unidad}`));
        });
        if (tieneMicros) pintarMicros(factor);
        porciones.innerHTML = '';
        a.p.forEach((p, i) => {
          const b = boton('fi-porcion', `<span>${porcionDe(a, i)}</span><small>${Porciones.decimal(p[2], idioma)} g</small>`, () => { f.porcion = i; f.gramos = null; f.veces = 1; pintar(); });
          b.setAttribute('aria-pressed', String(f.gramos == null && f.porcion === i));
          porciones.appendChild(b);
        });
        const enGramos = boton('fi-porcion', `<span>${tx('comida.gramos')}</span><small>g</small>`, () => { f.gramos = Math.round(gramosDe(it)); pintar(); });
        enGramos.setAttribute('aria-pressed', String(f.gramos != null));
        porciones.appendChild(enGramos);

        cantidad.innerHTML = '';
        const paso = f.gramos != null ? 10 : 0.5;
        const menos = boton('fi-paso', icono('menos'), () => { if (f.gramos != null) f.gramos = Math.max(5, f.gramos - paso); else f.veces = Math.max(0.5, f.veces - paso); pintar(); });
        const mas = boton('fi-paso', icono('mas'), () => { if (f.gramos != null) f.gramos += paso; else f.veces += paso; pintar(); });
        const valor = el('b', 'fi-valor', f.gramos != null ? `${Porciones.decimal(f.gramos, idioma)} g` : Porciones.numeroDePorcion(f.veces) || Porciones.decimal(f.veces, idioma));
        const pasos = el('div', 'fi-stepper');
        pasos.append(menos, valor, mas);
        cantidad.appendChild(pasos);
        if (f.gramos == null) {
          const rapidas = el('div', 'fi-rapidas');
          [0.5, 1, 1.5, 2].forEach((n) => {
            const b = boton('fi-rapida', Porciones.numeroDePorcion(n), () => { f.veces = n; pintar(); });
            b.setAttribute('aria-pressed', String(Math.abs(f.veces - n) < 1e-9));
            rapidas.appendChild(b);
          });
          cantidad.appendChild(rapidas);
        }
        gramosTxt.textContent = f.gramos != null ? '' : `${cantidadDe(it)} = ${Porciones.decimal(gramosDe(it), idioma)} g`;
      };
      function pintarMicros(factor) {
        const m = {};
        Micronutrientes.MICROS.forEach((k, i) => { if (a.u[i] != null) m[k] = a.u[i] * factor; });
        const cifra = (n) => (n === 0 ? '0' : numero(n, n < 1 ? 2 : n < 10 ? 1 : 0));
        const parte = (k, n) => {
          const r = Micronutrientes.referenciaDe(k, persona);
          if (!r) return '';
          const p = Math.round((n / (r.meta ?? r.tope)) * 100);
          return tx(r.meta != null ? 'comida.micros.delDia' : 'comida.micros.delMaximo', { n: numero(p) });
        };
        microsChips.innerHTML = '';
        const destacados = Micronutrientes.destacados(m, persona).slice(0, 4);
        destacados.forEach((d) => {
          const chip = el('span', 'vt-micro');
          chip.append(el('span', null, tx('comida.micros.nombres.' + d.micro)), el('b', null, numero(Math.round(d.parte * 100)) + ' %'));
          microsChips.appendChild(chip);
        });
        if (!destacados.length) microsChips.appendChild(el('span', 'vt-micro poco', tx('comida.micros.poco')));
        microsChips.appendChild(verTodo);
        microsLista.innerHTML = '';
        const dentro = el('div');
        Object.entries(Micronutrientes.GRUPOS).forEach(([grupo, claves]) => {
          const filas = claves.filter((k) => m[k] != null);
          if (!filas.length) return;
          dentro.appendChild(el('h4', null, tx('comida.micros.grupos.' + grupo)));
          filas.forEach((k) => {
            const fila = el('div', 'vt-micro-fila');
            fila.append(el('span', null, tx('comida.micros.nombres.' + k)), el('b', null, `${cifra(m[k])} ${Micronutrientes.UNIDAD[k]}`), el('small', null, parte(k, m[k])));
            dentro.appendChild(fila);
          });
        });
        dentro.appendChild(el('p', 'vt-micros-nota', tx('comida.micros.referencia')));
        microsLista.appendChild(dentro);
      }
      pintar();
      // La porción elegida, a la vista en su fila.
      requestAnimationFrame(() => {
        const b = porciones.querySelector('[aria-pressed="true"]');
        if (b) porciones.scrollLeft = Math.max(0, b.offsetLeft - 18);
      });

      ventana.hidden = false;
      velo.hidden = false;
      void ventana.offsetWidth;
      hoja.classList.add('con-ventana');
    }

    // ------------------------------------------------------------ reportar un error
    // Sobre la ventana: qué está mal, una nota si quiere, y listo. Sin usuario: en la app va a
    // moss.reportar_alimento, y sin conexión espera (src/almacen/buzon.ts).
    function abrirReporte(a) {
      const panel = el('div', 'vt-reporte');
      const caja = el('div', 'vt-reporte-caja');
      let motivo = null;
      const cab = el('header', 'vt-cab');
      const titulos = el('div', 'vt-titulos');
      titulos.append(el('h3', 'vt-nombre', tx('comida.reportar.titulo')), el('div', 'vt-fuente-texto', nombreDe(a)));
      const cerrar = () => {
        panel.classList.remove('abierto');
        setTimeout(() => panel.remove(), 320);
      };
      cab.append(titulos, boton('vt-cerrar', icono('cerrar'), cerrar, tx('comida.cerrar')));
      const motivos = el('div', 'vt-motivos');
      const enviar = boton('fi-agregar', tx('comida.reportar.enviar'), () => {
        if (!motivo) return;
        escena.haptico('suave');
        caja.classList.add('enviado');
        setTimeout(cerrar, 1700);
      });
      enviar.disabled = true;
      ['valores', 'porcion', 'nombre', 'otro'].forEach((m) => {
        const b = boton('fi-porcion', `<span>${tx('comida.reportar.motivos.' + m)}</span>`, () => {
          motivo = m;
          motivos.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          enviar.disabled = false;
        });
        b.setAttribute('aria-pressed', 'false');
        motivos.appendChild(b);
      });
      const nota = el('textarea', 'vt-nota');
      nota.rows = 3;
      nota.maxLength = 500;
      nota.placeholder = tx('comida.reportar.nota');
      const gracias = el('p', 'vt-gracias', tx('comida.reportar.gracias'));
      caja.append(cab, motivos, nota, enviar, gracias);
      panel.appendChild(caja);
      // Sobre la hoja y no adentro de la ventana, que se desliza: así se ve aunque esté abajo de todo.
      ventana.parentElement.appendChild(panel);
      void panel.offsetWidth;
      panel.classList.add('abierto');
    }

    // ------------------------------------------------------------ el teclado
    // En la galería de escritorio se dibuja el teclado del iPhone para ver cuánto lugar queda; en
    // un teléfono, el de verdad ocupa ese lugar (se mide con visualViewport).
    const tecladoEl = $h('.hj-teclado');
    const FILAS = { es: ['qwertyuiop', 'asdfghjklñ', '⇧zxcvbnm⌫'], en: ['qwertyuiop', 'asdfghjkl', '⇧zxcvbnm⌫'] };
    function armarTeclado() {
      tecladoEl.innerHTML = '';
      const tecla = (texto, clase, alTocar) => {
        const k = el('span', 'tk ' + (clase || ''));
        if (texto.startsWith('<')) k.innerHTML = texto; else k.textContent = texto;
        // Sin robar el foco del buscador.
        k.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); alTocar(); });
        return k;
      };
      const escribir = (t) => { entrada.value += t; entrada.dispatchEvent(new Event('input')); };
      FILAS[idioma].forEach((fila, i) => {
        const f = el('div', 'tk-fila tk-fila-' + i);
        [...fila].forEach((c) => {
          if (c === '⇧') f.appendChild(tecla(icono('mayus'), 'tk-especial tk-ancha', () => {}));
          else if (c === '⌫') f.appendChild(tecla(icono('borrar'), 'tk-especial tk-ancha', () => { entrada.value = entrada.value.slice(0, -1); entrada.dispatchEvent(new Event('input')); }));
          else f.appendChild(tecla(c, '', () => escribir(c)));
        });
        tecladoEl.appendChild(f);
      });
      const ultima = el('div', 'tk-fila tk-fila-3');
      ultima.append(
        tecla('123', 'tk-especial tk-media', () => {}),
        tecla(idioma === 'es' ? 'espacio' : 'space', 'tk-espacio', () => escribir(' ')),
        tecla(idioma === 'es' ? 'buscar' : 'search', 'tk-especial tk-buscar', () => entrada.blur()),
      );
      const sistema = el('div', 'tk-sistema');
      sistema.append(tecla(icono('globo'), 'tk-sis', () => {}), tecla(icono('microfono'), 'tk-sis', () => dictar()));
      tecladoEl.append(ultima, sistema);
    }
    // El dictado es el del teclado: escribe en el buscador mientras se habla.
    let dictando = 0;
    function dictar() {
      clearInterval(dictando);
      s.toques++;
      const frase = idioma === 'es' ? 'yogur con frutas' : 'fruit yogurt';
      entrada.value = '';
      let i = 0;
      dictando = setInterval(() => {
        i = Math.min(frase.length, i + 2);
        entrada.value = frase.slice(0, i);
        entrada.dispatchEvent(new Event('input'));
        // Hablar no es escribir: para la cuenta, el dictado es un toque.
        if (i >= frase.length) { clearInterval(dictando); s.escribio = false; }
      }, 70);
    }
    function teclado(si) {
      if (esTactil) return;
      hoja.classList.toggle('con-teclado', !!si && !!s.hoja && !s.hoja.sub && !s.hoja.ventana);
    }
    hoja.classList.toggle('tactil', esTactil);
    if (esTactil && window.visualViewport) {
      const medir = () => {
        const tapado = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
        hoja.style.setProperty('--teclado-real', `${tapado}px`);
      };
      window.visualViewport.addEventListener('resize', medir);
      window.visualViewport.addEventListener('scroll', medir);
    }
    armarTeclado();

    // ------------------------------------------------------------ lo que usan Inicio y el «+»
    const fechaClave = (k) => { const f = fechaDe(k); return `${f.anio}-${String(f.mes + 1).padStart(2, '0')}-${String(f.num).padStart(2, '0')}`; };
    const comidaDeAhora = () => Comidas.comidaDeLaHora(AHORA);

    // Registrar de un toque, sin la revisión: lo que sale de la hoja del «+» (los recientes, las
    // guardadas, la carga rápida). Queda en la comida de esta hora y se puede deshacer.
    function registrarDirecto(items, texto, tipo = comidaDeAhora()) {
      const c = comidaDeHoy(tipo);
      const nuevos = items.map((it) => Object.assign({}, it, { nuevo: true }));
      c.items.push(...nuevos);
      nuevos.forEach((it) => {
        if (it.rapida) return;
        s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces, gramos: it.gramos });
        s.usos.set(it.alimento, (s.usos.get(it.alimento) || 0) + 1);
      });
      escena.haptico('toque');
      registrado(texto);
      if (s.dia === 0 && s.vista === 'dia') pintarZona(900);
      avisarCambio();
      return {
        tipo,
        deshacer() {
          nuevos.forEach((it) => { const i = c.items.indexOf(it); if (i >= 0) c.items.splice(i, 1); });
          if (!c.items.length) comidasDe(0).splice(comidasDe(0).indexOf(c), 1);
          if (s.dia === 0 && s.vista === 'dia') pintarZona(600);
          avisarCambio();
        },
      };
    }

    // Lo último que se registró, sin repetir y del más nuevo al más viejo, con la última cantidad.
    function recientes(n) {
      const vistos = new Set();
      const lista = [];
      [0, -1, -2].forEach((d) => comidasDe(d).slice().sort((x, y) => y.hora - x.hora).forEach((c) => c.items.slice().reverse().forEach((it) => {
        if (it.rapida || vistos.has(it.alimento)) return;
        vistos.add(it.alimento);
        const a = porId.get(it.alimento);
        const [porcion, veces, gramos] = conUltima(a);
        const item = gramos != null ? { alimento: a.id, gramos } : { alimento: a.id, porcion, veces };
        lista.push({ id: a.id, nombre: nombreDe(a), cantidad: cantidadDe(item), kcal: valoresDe(item).kcal, item });
      })));
      return lista.slice(0, n);
    }

    function listaGuardadas() {
      return GUARDADAS.map((g, i) => {
        const items = g.items.map(([n, v, p]) => item(n, v, p)).filter(Boolean);
        return { i, nombre: g.nombre[idioma], kcal: sumar(items).kcal, items };
      });
    }

    // ------------------------------------------------------------ arranque
    pintarZona(0);

    return {
      zona,
      ponerEnZona,
      abrirHoja: (op) => abrirHoja(op || {}),
      cerrarHoja,
      verDia,
      vista: verVista,
      get enZona() { return s.enZona; },
      get hojaAbierta() { return !!s.hoja; },
      // El plan de comidas: armar, las hojas de tus comidas y de compras, y lo armado del día que se ve.
      armarDia: () => armarElDia(),
      armarSemana: () => armarLaSemana(),
      compras: () => abrirCompras(),
      tusComidas: () => abrirPreferencias(),
      get hojaPlanAbierta() { return hojaPlan.abierta; },
      cerrarPlan: () => hojaPlan.cerrar(),
      otraDel(tipo) { const c = comidasDe(s.dia).find((x) => x.tipo === tipo && x.plan); return c ? otra(c) : false; },
      comiEsto(tipo) { const c = comidasDe(s.dia).find((x) => x.tipo === tipo && x.plan); if (c) comiEsto(c); },
      get dia() { return s.dia; },
      get vistaActual() { return s.vista; },
      get meta() { return Object.assign({}, META); },
      // Lo comido de un día (0 es hoy), y las kcal de cada día ya vivido con algo registrado: lo que
      // mira el control (Control.controlSemanal).
      totalDe,
      // Las kcal de cada comida de un día, en orden: la barra de las kcal se reparte entre ellas.
      porComida: (d) => comidasDe(d).map((c) => sumar(c.items).kcal),
      kcalPorDia: () => Object.keys(s.dias).map(Number).filter((k) => k < 0 && comidasDe(k).length).sort((a, b) => a - b)
        .map((k) => ({ fecha: fechaClave(k), kcal: totalDe(k).kcal })),
      comidaDeAhora,
      recientes,
      listaGuardadas,
      registrarReciente(id) {
        const r = recientes(20).find((x) => x.id === id);
        return r ? registrarDirecto([r.item], [r.nombre, r.cantidad].filter(Boolean).join(' · ')) : null;
      },
      registrarGuardada(i) {
        const g = listaGuardadas()[i];
        return g ? registrarDirecto(g.items.map((it) => Object.assign({}, it)), g.nombre) : null;
      },
      registrarRapida(v, nombre) { return registrarDirecto([{ rapida: true, nombre, kcal: v.kcal, p: v.p, c: v.c, g: v.g }], nombre || tx('comida.cargaRapida')); },
      // El agua de hoy, en vasos de 250 ml: ya no está en la pantalla, se suma desde el «+».
      agua: () => ({ litros: (s.agua[0] || 0) * VASO_L, meta: VASOS_META * VASO_L, vasos: s.agua[0] || 0, vasosMeta: VASOS_META }),
      sumarAgua() { s.agua[0] = Math.min(16, (s.agua[0] || 0) + 1); escena.haptico('suave'); avisarCambio(); },
      quitarAgua() { s.agua[0] = Math.max(0, (s.agua[0] || 0) - 1); avisarCambio(); },
      // Para ver los macros que brillan y tiemblan: una cena que llega a la proteína y a los
      // carbohidratos y se pasa de grasas.
      simularCena() {
        const t = totalDe(0);
        const p = Math.max(0, META.p + 3 - t.p), c = Math.max(0, META.c * 1.03 - t.c), g = Math.max(0, META.g * 1.32 - t.g);
        return registrarDirecto([{ rapida: true, nombre: tx('comida.cenaDeMentira'), kcal: p * 4 + c * 4 + g * 9, p, c, g }], tx('comida.cenaDeMentira'));
      },
      // La cuenta de toques: el «+» de la barra la empieza, y cada toque de su hoja suma.
      empezarCuenta() { s.toques = 0; s.escribio = false; },
      contarToque() { s.toques++; },
      // Las metas del control o de la estrategia (Progreso): la zona se pinta con las nuevas.
      ponerMeta(m) { Object.assign(META, { kcal: m.kcal, p: m.proteina, c: m.carbohidratos, g: m.grasas }); pintarZona(600); avisarCambio(); },
      ponerIdioma(id) {
        idioma = id;
        armarTeclado();
        pintarZona(0);
        if (s.hoja) { pintarChips(); pintarAtajos(); pintarCuerpo(); pintarBandeja(); entrada.placeholder = tx('comida.buscar'); }
      },
      // Para las capturas: los mismos caminos que los toques.
      escribir(texto) { if (!s.hoja) return; entrada.value = texto; s.escribio = true; pintarCuerpo(); },
      ficha(nombre) { const a = porNombre.get(nombre); if (!a || !s.hoja) return false; const [p, v, g] = conUltima(a); abrirVentana(a, { porcion: p, veces: v, gramos: g }); return true; },
      agregarPrimero() { const b = $h('.hj-cuerpo .hj-mas'); if (b) b.click(); },
      sumar() { const b = ventana.querySelector('.vt-pie .fi-agregar'); if (b) b.click(); },
      listo() { const b = $h('.hj-listo'); if (b) b.click(); },
      confirmar() { const b = $h('.hj-revision .fi-agregar'); if (b) b.click(); },
      cargaRapida() { if (s.hoja) abrirRapida(); },
      guardadas() { if (s.hoja) abrirGuardadas(); },
      pegarReceta() { if (s.hoja) abrirPegarReceta(); },
      decir(op) { if (s.hoja) abrirDecir(op || {}); },
      get entreno() { return Object.assign({}, s.entreno, { ver: s.verEntreno }); },
      ponerEntreno(e, ver) { s.entreno = e; if (ver !== undefined) s.verEntreno = ver; if (s.dia === 0) pintarZona(400); },
      // Para las capturas: la de hoy o, si ya no queda ninguna, la de después de entrenar.
      porQue() { abrirPorQue([...lineasDeEntreno().values()][0] || { comida: 'cena', clase: 'despues', hora: 20 * 60, proteina: 30 }); },
      etiqueta(conError) { if (s.hoja) abrirEtiqueta(conError); },
      copiarDeAyer: (tipo) => (s.hoja ? sumarDeAyer(tipo || s.hoja.comida) : copiarDeAyer(tipo || 'cena')),
      bajarA(destino) {
        const n = (destino === 'semana' && $z('.cm-grafica')) || (destino === 'ahora' && ($z('.cm-ahora') || $z('.cm-linea .cm-entrada:last-child'))) || $z('.cm-seccion-dia');
        const arriba = destino === 'ahora' ? 260 : 70;
        scroll.scrollTo({ top: Math.max(0, scroll.scrollTop + n.getBoundingClientRect().top - scroll.getBoundingClientRect().top - arriba), behavior: 'auto' });
        scroll.dispatchEvent(new Event('scroll'));
      },
      teclado,
      dictar,
    };
  }

  return { crear };
})();
