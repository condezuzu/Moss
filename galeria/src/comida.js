// La comida en la galería, para aprobar antes de programarla (etapas 5 y 7 del plan):
// - la barra de abajo del cielo de hoy, con la luna chica y el botón de registrar;
// - la zona de comida: la luna, los macros, el agua, la línea del día y la semana;
// - la hoja de registro: la búsqueda, la ficha del alimento, los atajos y el teclado.
// El día es de mentira, pero los alimentos, sus valores y sus porciones salen de
// assets/alimentos.db (ALIMENTOS), y la búsqueda, las cantidades y la comida de cada hora usan los
// mismos módulos que la app (Buscar, Porciones y Comidas: los arma construir.mjs desde src/).

const Comida = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  // Uruguay, a las 21:47 del miércoles 21 de octubre: lo mismo que el resto de la galería.
  const REGION = 'UY';
  const AHORA = 21 * 60 + 47;
  const FECHAS = { '-1': { dia: 2, num: 20, mes: 9 }, 0: { dia: 3, num: 21, mes: 9 }, 1: { dia: 4, num: 22, mes: 9 } };
  // La meta después del control del domingo: macrosPara(2740, 74,3 kg, mantener) de src/dominio/metas.ts.
  const META = { kcal: 2740, p: 119, c: 382, g: 82 };
  const CONTROL = { dia: 0, num: 19, mes: 9, medido: 2650, antes: 2770, ahora: 2740, promedio: 2610, cambio: -0.1 };
  const VASO_L = 0.25;
  const VASOS_META = 8;
  // Tres semanas de pesadas y la tendencia de antes: la misma media móvil que src/dominio/control.ts.
  const PESADAS = [74.6, 74.4, 74.7, 74.3, 74.6, 74.5, 74.2, 74.6, 74.4, 74.3, 74.6, 74.3, 74.1, 74.5, 74.3, 74.2, 74.5, 74.2, 74.1, 74.4, 74.2];
  const TENDENCIA_ANTES = 74.5;
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
  const AGUA = { '-1': 9, 0: 5, 1: 0 };
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
    constelacion: '<circle cx="5" cy="17.5" r="1.7"/><circle cx="10" cy="8.5" r="1.7"/><circle cx="16" cy="12.5" r="1.7"/><circle cx="19.5" cy="4.5" r="1.7"/><path d="M5.9 15.8 9.1 10.2M11.6 9.6l2.8 1.9M16.8 10.7l1.9-4.4"/>',
    microfono: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3"/>',
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/>',
    borrar: '<path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/>',
    mayus: '<path d="M12 4.5 4.5 12H9v7h6v-7h4.5z"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>`;

  // La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de entrada.js.
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }
  const salida = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

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
      agua: Object.assign({}, AGUA),
      favoritos: new Set(),
      usos: new Map(),
      ultima: new Map(),
      enZona: false,
      hoja: null,
      // Los toques desde el cielo hasta registrar algo (se cuentan para comparar con la especificación).
      toques: 0,
      escribio: false,
    };
    for (const d of ['-1', '0', '1']) {
      s.dias[d] = DIAS[d].map((c) => Object.assign({}, c, { items: c.items.map(([n, v, p]) => item(n, v, p)).filter(Boolean) }));
    }
    FAVORITOS.forEach(([n]) => { const a = porNombre.get(n); if (a) s.favoritos.add(a.id); });
    Object.entries(USOS).forEach(([n, veces]) => { const a = porNombre.get(n); if (a) s.usos.set(a.id, veces); });
    // La última porción de cada alimento: la de los días de mentira, del más viejo al más nuevo.
    ['-1', '0'].forEach((d) => s.dias[d].forEach((c) => c.items.forEach((it) => s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces }))));
    const comoSuele = ([n, v, p]) => { const it = item(n, v, p); if (it) s.ultima.set(it.alimento, { porcion: it.porcion, veces: it.veces }); return it; };
    Object.values(SUELES).forEach((lista) => lista.forEach(comoSuele));
    FAVORITOS.forEach(comoSuele);

    const comidasDe = (d) => s.dias[String(d)];
    const diaDe = (c) => Number(Object.keys(s.dias).find((d) => s.dias[d].includes(c)) || 0);
    const totalDe = (d) => sumar(comidasDe(d).flatMap((c) => c.items));

    // ------------------------------------------------------------ la luna
    // Se llena con lo comido; los tres arcos son proteína, carbohidratos y grasas contra su meta.
    let lunas = 0;
    function crearLuna(clase, conArcos) {
      const id = `cmCara${++lunas}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', conArcos ? '-80 -80 160 160' : '-48 -48 96 96');
      svg.setAttribute('class', clase);
      svg.setAttribute('aria-hidden', 'true');
      const arcos = conArcos
        ? [['p', 54], ['c', 62], ['g', 70]].map(([m, r]) => `<circle r="${r}" class="cm-pista"/><circle r="${r}" class="cm-arco cm-arco-${m}" transform="rotate(-90)"/>`).join('')
        : '';
      svg.innerHTML = `
        <defs><radialGradient id="${id}" cx="35%" cy="35%" r="75%">
          <stop offset="0" stop-color="#fff6dc"/><stop offset="0.6" stop-color="#f3dc9b"/><stop offset="1" stop-color="#c8a75c"/>
        </radialGradient></defs>
        <circle r="45" class="cm-luna-halo"/>
        <circle r="40" class="cm-luna-sombra"/>
        <path class="cm-luna-fase" fill="url(#${id})"/>${arcos}`;
      const faseEl = svg.querySelector('.cm-luna-fase');
      const arcosEl = [...svg.querySelectorAll('.cm-arco')];
      arcosEl.forEach((a) => {
        const largo = 2 * Math.PI * Number(a.getAttribute('r'));
        a.style.strokeDasharray = `${largo} ${largo}`;
        a.dataset.largo = largo;
      });
      let ahora = { luna: 0, p: 0, c: 0, g: 0 };
      let cuadro = 0;
      const dibujar = (v) => {
        faseEl.setAttribute('d', fase(0.04 + 0.96 * Math.min(1, v.luna), 40));
        arcosEl.forEach((a, i) => { a.style.strokeDashoffset = String(Number(a.dataset.largo) * (1 - Math.min(1, [v.p, v.c, v.g][i]))); });
      };
      return {
        svg,
        // De lo que muestra ahora a `hasta`, en `ms`.
        ir(hasta, ms) {
          cancelAnimationFrame(cuadro);
          const desde = ahora;
          if (!ms) { ahora = hasta; dibujar(hasta); return; }
          const t0 = performance.now();
          const paso = (t) => {
            const k = salida((t - t0) / ms);
            ahora = { luna: desde.luna + (hasta.luna - desde.luna) * k, p: desde.p + (hasta.p - desde.p) * k, c: desde.c + (hasta.c - desde.c) * k, g: desde.g + (hasta.g - desde.g) * k };
            dibujar(ahora);
            if (k < 1) cuadro = requestAnimationFrame(paso);
          };
          cuadro = requestAnimationFrame(paso);
        },
      };
    }

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

    const fraccionesDe = (t) => ({ luna: t.kcal / META.kcal, p: t.p / META.p, c: t.c / META.c, g: t.g / META.g });

    // ------------------------------------------------------------ la barra del cielo de hoy
    // A la izquierda, la comida de hoy en chico (lleva a la zona de comida); a la derecha, registrar.
    const ui = tel.querySelector('.ui');
    const barraCielo = ui.querySelector('.barra-hoy');
    const lunaChica = crearLuna('bh-luna', false);
    const pildoraCielo = boton('bh-pildora', '', () => ir(), tx('comida.irAComida'));
    const cifraCielo = el('b');
    const textoCielo = el('small');
    const caja = el('span', 'bh-textos');
    caja.append(cifraCielo, textoCielo);
    pildoraCielo.append(lunaChica.svg, caja);
    const masCielo = boton('bh-mas', icono('mas'), () => abrirHoja({}), tx('comida.registrar'));
    barraCielo.append(pildoraCielo, masCielo);
    // Los gestos del cielo van solo sobre el lienzo: la barra no los deja pasar.
    barraCielo.addEventListener('pointerdown', (ev) => ev.stopPropagation());

    function pintarBarraCielo(ms) {
      const t = totalDe(0);
      const queda = META.kcal - t.kcal;
      contar(cifraCielo, Math.abs(queda), ms);
      textoCielo.textContent = tx(queda >= 0 ? 'comida.teQuedan' : 'comida.deMas');
      lunaChica.ir(fraccionesDe(t), ms);
      pildoraCielo.setAttribute('aria-label', tx('comida.irAComida'));
      masCielo.setAttribute('aria-label', tx('comida.registrar'));
    }

    // ------------------------------------------------------------ la zona de comida
    const zona = el('section', 'comida');
    zona.hidden = true;
    zona.innerHTML = `
      <div class="cm-scroll">
        <header class="cm-cab"><div><div class="cm-fecha"></div><h2 class="cm-titulo"></h2></div><div class="cm-dias"></div></header>
        <div class="cm-heroe"><div class="cm-escenario"></div><div class="cm-cifra"><b></b><span></span></div><div class="cm-de"></div></div>
        <div class="cm-macros"></div>
        <div class="cm-agua"></div>
        <h3 class="cm-seccion cm-seccion-dia"></h3>
        <p class="cm-nota" hidden></p>
        <div class="cm-linea"></div>
        <h3 class="cm-seccion cm-seccion-semana"></h3>
        <div class="cm-semana"></div>
      </div>
      <nav class="cm-barra"></nav>
      <div class="cm-aviso" role="status"><span></span></div>`;
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const $z = (q) => zona.querySelector(q);
    const lunaGrande = crearLuna('cm-luna', true);
    $z('.cm-escenario').appendChild(lunaGrande.svg);
    const scroll = $z('.cm-scroll');
    // El cielo de atrás se mueve un poco con lo que se desliza: la zona es una parte del cielo.
    scroll.addEventListener('scroll', () => { if (s.enZona && !escena.viajando) escena.camara(Math.min(0.32, scroll.scrollTop / 1600)); }, { passive: true });

    const pildoraZona = boton('bh-pildora bh-cielo', '', () => volver(), tx('comida.alCielo'));
    const masZona = boton('bh-mas', icono('mas'), () => abrirHoja({}), tx('comida.registrar'));
    $z('.cm-barra').append(pildoraZona, masZona);

    let avisoZona = 0;
    let deshacerZona = null;
    function avisarZona(texto, deshacer) {
      const a = $z('.cm-aviso');
      a.querySelector('span').textContent = texto;
      a.querySelector('button')?.remove();
      deshacerZona = deshacer || null;
      if (deshacer) a.appendChild(boton('cm-aviso-btn', tx('comun.deshacer'), () => { const f = deshacerZona; deshacerZona = null; a.classList.remove('visible'); if (f) f(); }));
      a.classList.add('visible');
      clearTimeout(avisoZona);
      avisoZona = setTimeout(() => a.classList.remove('visible'), deshacer ? 4200 : 2800);
    }

    function pintarZona(ms) {
      const d = s.dia;
      const f = FECHAS[d];
      $z('.cm-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + f.dia), num: f.num, mes: tx('fecha.mesesCortos.' + f.mes) });
      $z('.cm-titulo').textContent = tx('comida.dias.' + (d < 0 ? 'ayer' : d > 0 ? 'manana' : 'hoy'));
      const dias = $z('.cm-dias');
      dias.innerHTML = '';
      const anterior = boton('cm-flecha', icono('atras'), () => verDia(s.dia - 1), tx('comida.diaAnterior'));
      const siguiente = boton('cm-flecha', icono('adelante'), () => verDia(s.dia + 1), tx('comida.diaSiguiente'));
      anterior.disabled = d <= -1;
      siguiente.disabled = d >= 1;
      dias.append(anterior, siguiente);

      // La luna y la cifra grande: hoy, lo que queda; otro día, lo comido o lo planificado.
      const t = totalDe(d);
      const queda = META.kcal - t.kcal;
      const cifra = $z('.cm-cifra b');
      contar(cifra, d === 0 ? Math.abs(queda) : t.kcal, ms);
      $z('.cm-cifra span').textContent = tx(d < 0 ? 'comida.enElDia' : d > 0 ? 'comida.planificadas' : queda >= 0 ? 'comida.teQuedan' : 'comida.deMas');
      $z('.cm-de').textContent = tx('comida.deMeta', { comido: numero(Math.round(t.kcal)), meta: numero(META.kcal) });
      lunaGrande.ir(fraccionesDe(t), ms);
      zona.classList.toggle('planificado', d > 0);

      const macros = $z('.cm-macros');
      macros.innerHTML = '';
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => {
        const col = el('div', 'cm-macro cm-macro-' + m);
        const barra = el('div', 'cm-barra-macro');
        const relleno = el('i');
        barra.appendChild(relleno);
        col.append(el('span', 'cm-macro-nombre', tx('comida.' + clave)), el('b', null, tx('comida.gramosDe', { n: numero(Math.round(t[m])), meta: numero(META[m]) })), barra);
        macros.appendChild(col);
        requestAnimationFrame(() => { relleno.style.width = `${Math.min(100, (t[m] / META[m]) * 100).toFixed(1)}%`; });
      });

      pintarAgua();
      $z('.cm-seccion-dia').textContent = tx('comida.tuDia');
      const nota = $z('.cm-nota');
      nota.hidden = d <= 0;
      nota.textContent = tx('comida.planificadoTexto');
      pintarLinea();
      $z('.cm-seccion-semana').textContent = tx('comida.tuSemana');
      pintarSemana();

      pildoraZona.innerHTML = `${icono('constelacion')}<span class="bh-textos"><b></b><small></small></span>`;
      pildoraZona.querySelector('b').textContent = escena.nombre;
      pildoraZona.querySelector('small').textContent = tx('cielo.encendidas', { n: escena.encendidas, total: escena.total });
      pildoraZona.setAttribute('aria-label', tx('comida.alCielo'));
      masZona.setAttribute('aria-label', tx('comida.registrar'));
    }

    function pintarAgua() {
      const caja = $z('.cm-agua');
      const d = s.dia;
      caja.hidden = d > 0;
      if (d > 0) return;
      const vasos = s.agua[d];
      caja.innerHTML = '';
      const textos = el('div', 'cm-agua-txt');
      textos.append(el('span', null, tx('comida.agua')), el('b', null, tx('comida.aguaDe', { n: Porciones.decimal(vasos * VASO_L, idioma), meta: Porciones.decimal(VASOS_META * VASO_L, idioma) })));
      const fila = el('div', 'cm-vasos');
      for (let i = 0; i < Math.max(VASOS_META, vasos); i++) {
        const v = el('i', 'cm-vaso' + (i < vasos ? ' lleno' : ''));
        v.innerHTML = icono('vaso');
        fila.appendChild(v);
      }
      const mas = boton('cm-agua-mas', icono('mas'), () => {
        s.agua[d] = Math.min(12, s.agua[d] + 1);
        escena.haptico('suave');
        pintarAgua();
        const nuevo = $z('.cm-vasos').children[s.agua[d] - 1];
        if (nuevo) nuevo.classList.add('recien');
      }, tx('comida.sumarVaso'));
      mas.disabled = d !== 0;
      caja.append(textos, fila, mas);
    }

    // La línea del día: las comidas sobre una línea de horas, con el espacio entre una y otra según
    // el tiempo que pasó. Hoy, la comida que falta espera en «ahora».
    function pintarLinea() {
      const cont = $z('.cm-linea');
      cont.innerHTML = '';
      const d = s.dia;
      const entradas = comidasDe(d).map((c) => ({ comida: c, hora: c.hora }));
      if (d === 0) {
        Object.entries(HORA_TIPICA).forEach(([tipo, h]) => {
          if (entradas.some((x) => (x.comida ? x.comida.tipo : x.vacia) === tipo)) return;
          const actual = Comidas.comidaDeLaHora(AHORA) === tipo;
          if (h <= AHORA || actual) entradas.push({ vacia: tipo, hora: actual ? AHORA : h });
        });
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
      const art = el('article', 'cm-tarjeta');
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
      const pie = el('footer');
      [['p', t.p], ['c', t.c], ['g', t.g]].forEach(([m, g]) => {
        const chip = el('span', 'cm-mini cm-mini-' + m);
        chip.append(el('i'), `${numero(Math.round(g))} g`);
        pie.appendChild(chip);
      });
      if (!c.plan) pie.appendChild(boton('cm-foto', icono('camara'), () => avisarZona('Galería: la foto queda como recuerdo, sin análisis.'), tx('comida.foto')));
      art.appendChild(pie);
      return art;
    }

    function tarjetaVacia(tipo) {
      const art = el('article', 'cm-tarjeta vacia');
      art.appendChild(el('b', null, tx('comida.comidas.' + tipo)));
      const acciones = el('div', 'cm-acciones');
      acciones.append(
        boton('cm-accion principal', `${icono('mas')}<span>${tx('comida.agregar')}</span>`, () => abrirHoja({ comida: tipo })),
        boton('cm-accion', `${icono('copiar')}<span>${tx('comida.copiarDeAyer')}</span>`, () => copiarDeAyer(tipo, 'zona')),
      );
      art.appendChild(acciones);
      return art;
    }

    function pintarSemana() {
      const cont = $z('.cm-semana');
      cont.innerHTML = '';
      // El peso: la tendencia (la línea) y las pesadas de cada día (los puntos).
      const tendencia = [];
      let actual = TENDENCIA_ANTES;
      PESADAS.forEach((kg) => { actual += 0.1 * (kg - actual); tendencia.push(actual); });
      const ultima = tendencia[tendencia.length - 1];
      const semana = ultima - tendencia[tendencia.length - 8];
      const peso = el('article', 'cm-carta cm-peso');
      const cab = el('header');
      cab.append(el('span', 'cm-carta-titulo', tx('comida.peso')), boton('cm-anotar', `${icono('mas')}<span>${tx('comida.anotarPeso')}</span>`, () => avisarZona('Galería: anotar el peso son 2 toques y el número, o llega solo desde Salud.')));
      const cifra = el('div', 'cm-carta-cifra');
      cifra.append(el('b', null, numero(ultima, 1)), el('span', null, ` kg · ${tx('comida.tendencia')}`));
      const signo = semana < 0 ? '−' : '+';
      peso.append(cab, cifra, el('div', 'cm-carta-nota', tx('comida.porSemana', { n: signo + numero(Math.abs(semana), 1) })), grafico(PESADAS, tendencia));
      cont.appendChild(peso);

      const control = el('article', 'cm-carta cm-control');
      const cabC = el('header');
      const fechaControl = tx('comida.fechaControl', { dia: tx('fecha.dias.' + CONTROL.dia), num: CONTROL.num, mes: tx('fecha.mesesCortos.' + CONTROL.mes) });
      cabC.append(el('span', 'cm-carta-titulo', tx('comida.gasto')));
      const cifraC = el('div', 'cm-carta-cifra');
      cifraC.append(el('b', null, numero(CONTROL.ahora)), el('span', null, ` ${tx('comida.porDia')}`));
      const detalle = el('p', 'cm-carta-texto', tx('comida.controlTexto', { gasto: numero(CONTROL.medido), antes: numero(CONTROL.antes), ahora: numero(CONTROL.ahora) }));
      const como = el('p', 'cm-carta-texto cm-como', tx('comida.comoSeCalculaTexto', { promedio: numero(CONTROL.promedio), cambio: (CONTROL.cambio < 0 ? '−' : '+') + numero(Math.abs(CONTROL.cambio), 1) }));
      como.hidden = true;
      const abrir = boton('cm-enlace', `<span>${tx('comida.comoSeCalcula')}</span>${icono('adelante')}`, () => { como.hidden = !como.hidden; abrir.classList.toggle('abierto', !como.hidden); });
      control.append(cabC, cifraC, el('div', 'cm-carta-nota', tx('comida.control', { fecha: fechaControl })), detalle, abrir, como);
      cont.appendChild(control);
    }

    // Una línea chica: las pesadas como puntos y la tendencia como una línea suave.
    function grafico(pesadas, tendencia) {
      const W = 300, H = 64, m = 6;
      const todos = pesadas.concat(tendencia);
      const min = Math.min(...todos) - 0.05, max = Math.max(...todos) + 0.05;
      const x = (i) => m + (i / (pesadas.length - 1)) * (W - 2 * m);
      const y = (kg) => m + (1 - (kg - min) / (max - min)) * (H - 2 * m);
      const linea = tendencia.map((kg, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(kg).toFixed(1)}`).join(' ');
      const puntos = pesadas.map((kg, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(kg).toFixed(1)}" r="1.9" class="cm-pesada"/>`).join('');
      const ultimo = tendencia.length - 1;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('class', 'cm-grafico');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `${puntos}<path d="${linea}" class="cm-tendencia"/><circle cx="${x(ultimo).toFixed(1)}" cy="${y(tendencia[ultimo]).toFixed(1)}" r="3.2" class="cm-tendencia-fin"/>`;
      return svg;
    }

    function verDia(d) {
      if (d < -1 || d > 1) return;
      s.dia = d;
      pintarZona(700);
      scroll.scrollTo({ top: 0, behavior: 'smooth' });
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ moverse entre el cielo y la zona
    function ir() {
      if (s.enZona || escena.viajando || escena.modo !== 'hoy' || s.hoja) return false;
      s.dia = 0;
      pintarZona(0);
      lunaGrande.ir({ luna: 0, p: 0, c: 0, g: 0 }, 0);
      contar($z('.cm-cifra b'), 0, 0);
      escena.viajar({
        hasta: { zoom: 1.45, velo: 0.52 }, sale: ui, llega: zona,
        alCambiar: () => { s.enZona = true; escena.ponerModo('comida'); pintarZona(1300); },
        alLlegar: () => opciones.alCambiar(),
      });
      // Recién ahora se ve (el viaje la muestra): escondida, no se puede llevar arriba.
      scroll.scrollTop = 0;
      opciones.alCambiar();
      return true;
    }

    function volver() {
      if (!s.enZona || escena.viajando || s.hoja) return false;
      escena.viajar({
        hasta: { zoom: 1, velo: 0 }, sale: zona, llega: ui,
        alCambiar: () => { s.enZona = false; escena.ponerModo('hoy'); escena.camara(0); pintarBarraCielo(900); },
        alLlegar: () => { s.toques = 0; s.escribio = false; opciones.alCambiar(); },
      });
      opciones.alCambiar();
      return true;
    }

    // ------------------------------------------------------------ la hoja de registro
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
      <div class="hj-teclado" aria-hidden="true"></div>`;
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
    const etiqueta = boton('hj-icono', icono('etiqueta'), () => avisarHoja('Galería: la foto de la etiqueta llega en la etapa 6.'));
    $h('.hj-busca').append(lupa, entrada, escanear, etiqueta);
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
    barraCielo.addEventListener('click', (ev) => { if (ev.target.closest('[data-toque]')) s.toques++; }, true);

    function abrirHoja({ comida, panel }) {
      if (s.hoja || escena.viajando || (escena.modo !== 'hoy' && !s.enZona)) return false;
      s.hoja = { comida: comida || Comidas.comidaDeLaHora(AHORA), agregados: [], sub: null };
      entrada.value = '';
      entrada.placeholder = tx('comida.buscar');
      escanear.setAttribute('aria-label', tx('comida.escanear'));
      etiqueta.setAttribute('aria-label', tx('comida.etiqueta'));
      hoja.setAttribute('aria-label', tx('comida.registrar'));
      pintarChips();
      pintarAtajos();
      pintarCuerpo();
      pintarBandeja();
      cerrarSub(true);
      tel.classList.add('hoja-anim', 'con-hoja');
      fondo.hidden = false;
      hoja.hidden = false;
      hoja.classList.remove('saliendo');
      setTimeout(() => tel.classList.remove('hoja-anim'), 520);
      // Abre lista para escribir: el teclado arriba.
      entrada.focus({ preventScroll: true });
      teclado(true);
      if (panel === 'rapida') abrirRapida();
      opciones.alCambiar();
      return true;
    }

    function cerrarHoja() {
      if (!s.hoja) return;
      const agregados = s.hoja.agregados.length > 0;
      s.hoja = null;
      entrada.blur();
      teclado(false);
      tel.classList.add('hoja-anim');
      tel.classList.remove('con-hoja');
      hoja.classList.add('saliendo');
      setTimeout(() => { if (!s.hoja) { hoja.hidden = true; fondo.hidden = true; } tel.classList.remove('hoja-anim'); }, 420);
      // Lo nuevo se ve llegar: la luna se llena y la cifra baja.
      if (agregados) {
        pintarBarraCielo(s.enZona ? 0 : 1100);
        if (s.enZona) { s.dia = 0; pintarZona(1100); }
      }
      // De vuelta en el cielo sin registrar nada, la cuenta de toques empieza de nuevo.
      if (!s.enZona) { s.toques = 0; s.escribio = false; }
      opciones.alCambiar();
    }

    function pintarChips() {
      const cont = $h('.hj-chips');
      cont.innerHTML = '';
      Comidas.COMIDAS.forEach((tipo) => {
        const b = boton('hj-chip', tx('comida.comidas.' + tipo), () => { s.hoja.comida = tipo; pintarChips(); pintarAtajos(); pintarCuerpo(); });
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
        boton('hj-atajo', `${icono('copiar')}<span>${tx('comida.deAyer.' + s.hoja.comida)}</span>`, () => copiarDeAyer(s.hoja.comida, 'hoja')),
        boton('hj-atajo', `${icono('guardadas')}<span>${tx('comida.guardadasCorto')}</span>`, () => abrirGuardadas()),
        boton('hj-atajo', `${icono('rayo')}<span>${tx('comida.cargaRapida')}</span>`, () => abrirRapida()),
      );
    }

    // Una fila: el alimento con la porción que se va a usar y su «+», que agrega sin abrir nada.
    function fila(a, porcion, veces, extra) {
      const it = { alimento: a.id, porcion, veces };
      const f = el('div', 'hj-fila');
      f.dataset.toque = '';
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      const textos = el('div', 'hj-fila-txt');
      const nombre = el('b', null, nombreDe(a));
      if (extra) nombre.appendChild(el('small', null, ` · ${extra}`));
      textos.append(nombre, el('span', null, `${cantidadDe(it)} · ${numero(Math.round(valoresDe(it).kcal))} kcal`));
      const mas = boton('hj-mas', icono('mas'), () => {
        agregar(it, mas);
      }, tx('comida.agregarAlimento', { alimento: nombreDe(a) }));
      f.append(textos, mas);
      f.addEventListener('click', () => abrirFicha(a, { porcion, veces }));
      f.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') abrirFicha(a, { porcion, veces }); });
      return f;
    }

    const conUltima = (a, veces, porcion) => {
      const u = s.ultima.get(a.id);
      return u ? [u.porcion, u.veces] : [porcion == null ? a.d : porcion, veces || 1];
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
          filas.forEach((a) => { vistos.add(a.id); const [p, v] = conUltima(a); cuerpo.appendChild(fila(a, p, v)); });
        };
        seccion(tx('comida.sueles.' + s.hoja.comida), SUELES[s.hoja.comida].map(([n]) => porNombre.get(n)));
        // Lo último que se registró, del más nuevo al más viejo.
        const recientes = [];
        ['0', '-1'].forEach((d) => comidasDe(d).slice().sort((x, y) => y.hora - x.hora).forEach((c) => c.items.slice().reverse().forEach((it) => { if (!it.rapida) recientes.push(porId.get(it.alimento)); })));
        seccion(tx('comida.recientes'), recientes);
        seccion(tx('comida.favoritos'), [...s.favoritos].map((id) => porId.get(id)));
        return;
      }
      const resultados = buscar(texto);
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
        const [p, v] = conUltima(a);
        // Si lo que coincidió es otro nombre («aguacate» para la palta), se muestra al lado.
        const n = Buscar.normalizar;
        const extra = n(coincide) !== n(nombreDe(a)) && !n(nombreDe(a)).includes(n(texto)) && coincide.length < 28 ? coincide.toLowerCase() : null;
        cuerpo.appendChild(fila(a, p, v, extra));
      });
    }

    // ------------------------------------------------------------ la búsqueda
    // Los textos de búsqueda de cada alimento, con sus palabras y trigramas ya armados: hacen las
    // veces de los dos índices FTS5 del teléfono (palabras con prefijo y trigramas). El orden es
    // el de la app (Buscar.mejoresPorAlimento); falta bm25, que acá vale lo mismo para todos.
    const corpus = ALIMENTOS.flatMap((a) => a.t.map(([i, region, principal, texto]) => {
      const normal = Buscar.normalizar(texto);
      const trigramas = new Set();
      normal.split(' ').forEach((p) => { for (let k = 0; k + 3 <= p.length; k++) trigramas.add(p.slice(k, k + 3)); });
      return { alimento: a.id, idioma: i, region: region || null, principal, texto, palabras: normal.split(' '), trigramas, rango: 0 };
    }));
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
      const premio = (id) => (s.usos.has(id) ? 2.5 * Math.log1p(s.usos.get(id)) : 0);
      return Buscar.mejoresPorAlimento(candidatos, texto, { idioma, region: REGION, premio }, () => true)
        .slice(0, 12)
        .map((c) => ({ a: porId.get(c.alimento), coincide: c.texto }));
    }

    // ------------------------------------------------------------ agregar, deshacer, cambiar
    function comidaDeHoy(tipo) {
      let c = comidasDe(0).find((x) => x.tipo === tipo && !x.plan);
      if (!c) {
        c = { tipo, hora: AHORA, items: [] };
        comidasDe(0).push(c);
      }
      return c;
    }

    function agregar(it, botonMas) {
      if (!s.hoja) return;
      const tipo = s.hoja.comida;
      const c = comidaDeHoy(tipo);
      const nuevo = Object.assign({ nuevo: true }, it);
      c.items.push(nuevo);
      if (!nuevo.rapida) {
        s.ultima.set(nuevo.alimento, { porcion: nuevo.porcion, veces: nuevo.veces, gramos: nuevo.gramos });
        s.usos.set(nuevo.alimento, (s.usos.get(nuevo.alimento) || 0) + 1);
      }
      s.hoja.agregados.push({ comida: c, item: nuevo });
      escena.haptico('suave');
      if (botonMas) {
        botonMas.innerHTML = icono('listo');
        botonMas.classList.add('hecho');
        setTimeout(() => { botonMas.innerHTML = icono('mas'); botonMas.classList.remove('hecho'); }, 900);
      }
      const texto = [nombreDeItem(nuevo), cantidadDe(nuevo)].filter(Boolean).join(' · ');
      avisarHoja(texto, {
        deshacer: () => quitarAgregado(nuevo),
        cambiar: nuevo.rapida ? null : () => editar(c, nuevo, true),
      });
      pintarBandeja();
      registrado(texto);
    }

    function registrado(texto) {
      opciones.alRegistrar({ texto, toques: s.toques, escribio: s.escribio });
      s.toques = 0;
      s.escribio = false;
    }

    function quitarAgregado(it) {
      const c = comidasDe(0).find((x) => x.items.includes(it));
      if (c) c.items.splice(c.items.indexOf(it), 1);
      if (c && !c.items.length) comidasDe(0).splice(comidasDe(0).indexOf(c), 1);
      if (s.hoja) s.hoja.agregados = s.hoja.agregados.filter((x) => x.item !== it);
      pintarBandeja();
    }

    function copiarDeAyer(tipo, desde) {
      const ayer = comidasDe(-1).find((c) => c.tipo === tipo);
      if (!ayer) { (desde === 'hoja' ? avisarHoja : avisarZona)(tx('comida.sinResultados', { texto: tx('comida.comidas.' + tipo) })); return; }
      const c = comidaDeHoy(tipo);
      const copias = ayer.items.map((it) => Object.assign({}, it, { nuevo: true }));
      c.items.push(...copias);
      escena.haptico('suave');
      const texto = plural('comida.copiado', copias.length);
      const deshacer = () => { copias.forEach((it) => quitarAgregado(it)); if (desde === 'zona') pintarZona(700); };
      if (desde === 'hoja') {
        copias.forEach((it) => s.hoja.agregados.push({ comida: c, item: it }));
        avisarHoja(texto, { deshacer });
        pintarBandeja();
      } else {
        pintarZona(1000);
        avisarZona(texto, deshacer);
      }
      registrado(`${tx('comida.comidas.' + tipo)} · ${texto.toLowerCase()}`);
    }

    // Tocar un registro en la línea del día abre su ficha para corregirlo.
    function editar(c, it, dentroDeLaHoja) {
      if (it.rapida) return;
      if (!dentroDeLaHoja) {
        if (!abrirHoja({ comida: c.tipo })) return;
        entrada.blur();
      }
      abrirFicha(porId.get(it.alimento), { porcion: it.porcion, veces: it.veces, gramos: it.gramos, editando: { comida: c, item: it } });
    }

    let avisoHoja = 0;
    function avisarHoja(texto, acciones) {
      const a = $h('.hj-aviso');
      a.querySelector('span').textContent = texto;
      const btns = a.querySelector('.hj-aviso-btns');
      btns.innerHTML = '';
      if (acciones && acciones.cambiar) btns.appendChild(boton('hj-aviso-btn', tx('comida.cambiar'), () => { a.classList.remove('visible'); acciones.cambiar(); }));
      if (acciones && acciones.deshacer) btns.appendChild(boton('hj-aviso-btn', tx('comun.deshacer'), () => { a.classList.remove('visible'); acciones.deshacer(); }));
      a.classList.add('visible');
      clearTimeout(avisoHoja);
      avisoHoja = setTimeout(() => a.classList.remove('visible'), acciones ? 4200 : 2800);
    }

    // Lo que se agregó desde que se abrió la hoja, y «Listo».
    function pintarBandeja() {
      const b = $h('.hj-bandeja');
      if (!s.hoja || !s.hoja.agregados.length) { b.hidden = true; hoja.classList.remove('con-bandeja'); return; }
      const t = sumar(s.hoja.agregados.map((x) => x.item));
      const tipos = new Set(s.hoja.agregados.map((x) => x.comida.tipo));
      b.hidden = false;
      hoja.classList.add('con-bandeja');
      b.innerHTML = '';
      const textos = el('div', 'hj-bandeja-txt');
      textos.append(el('b', null, [...tipos].map((tipo) => tx('comida.comidas.' + tipo)).join(' · ')), el('span', null, plural('comida.agregados', s.hoja.agregados.length, { kcal: numero(Math.round(t.kcal)) })));
      b.append(textos, boton('hj-listo', tx('comun.listo'), () => cerrarHoja()));
    }

    // ------------------------------------------------------------ los paneles: ficha, carga rápida y guardadas
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

    // La ficha: la porción, la cantidad y lo que deja para el resto del día.
    function abrirFicha(a, { porcion, veces, gramos, editando }) {
      const f = { porcion: gramos != null ? null : porcion, veces: veces || 1, gramos: gramos != null ? gramos : null };
      abrirSub('hj-ficha', (sub) => {
        const estrella = boton('hj-estrella' + (s.favoritos.has(a.id) ? ' activa' : ''), icono('estrella'), () => {
          if (s.favoritos.has(a.id)) s.favoritos.delete(a.id); else s.favoritos.add(a.id);
          estrella.classList.toggle('activa', s.favoritos.has(a.id));
          escena.haptico('suave');
        }, tx('comida.favorito'));
        cabezaDeSub(sub, '', estrella);
        const cuerpo = el('div', 'fi-cuerpo');
        cuerpo.append(el('h3', 'fi-nombre', nombreDe(a)), el('div', 'fi-fuente', tx(a.id < 0 ? 'comida.fuente.propio' : 'comida.fuente.usda')));
        const kcal = el('div', 'fi-kcal');
        const kcalB = el('b');
        kcal.append(kcalB, el('span', null, tx('comida.kcal')));
        const queda = el('div', 'fi-queda');
        const macros = el('div', 'fi-macros');
        cuerpo.append(kcal, queda, macros);

        cuerpo.appendChild(el('div', 'fi-etq', tx('comida.porcion')));
        const porciones = el('div', 'fi-porciones');
        cuerpo.appendChild(porciones);
        cuerpo.appendChild(el('div', 'fi-etq', tx('comida.cantidad')));
        const cantidad = el('div', 'fi-cantidad');
        cuerpo.appendChild(cantidad);
        const gramosTxt = el('div', 'fi-gramos');
        cuerpo.appendChild(gramosTxt);
        sub.appendChild(cuerpo);

        const pie = el('footer', 'fi-pie');
        const tipo = editando ? editando.comida.tipo : s.hoja.comida;
        const principal = boton('fi-agregar', editando ? tx('comun.guardar') : tx('comida.agregarA.' + tipo), () => {
          const it = f.gramos != null ? { alimento: a.id, gramos: f.gramos } : { alimento: a.id, porcion: f.porcion, veces: f.veces };
          if (editando) {
            Object.assign(editando.item, it, { nuevo: true });
            if (f.gramos == null) delete editando.item.gramos;
            s.ultima.set(a.id, { porcion: f.porcion, veces: f.veces, gramos: f.gramos });
            cerrarSub();
            if (!s.hoja.agregados.some((x) => x.item === editando.item)) { cerrarHoja(); pintarZona(900); pintarBarraCielo(0); return; }
            pintarBandeja();
            avisarHoja([nombreDeItem(editando.item), cantidadDe(editando.item)].join(' · '));
            return;
          }
          agregar(it);
          cerrarSub();
          pintarCuerpo();
        });
        pie.appendChild(principal);
        if (editando) {
          pie.appendChild(boton('fi-quitar', tx('comida.quitar'), () => {
            const nombre = nombreDeItem(editando.item);
            const c = editando.comida;
            const lista = comidasDe(diaDe(c));
            c.items.splice(c.items.indexOf(editando.item), 1);
            if (!c.items.length) lista.splice(lista.indexOf(c), 1);
            if (s.hoja) s.hoja.agregados = s.hoja.agregados.filter((x) => x.item !== editando.item);
            cerrarSub();
            cerrarHoja();
            pintarBarraCielo(s.enZona ? 0 : 900);
            if (s.enZona) { pintarZona(900); avisarZona(tx('comida.quitado', { alimento: nombre })); }
          }));
        }
        sub.appendChild(pie);

        const pintar = () => {
          const it = f.gramos != null ? { alimento: a.id, gramos: f.gramos } : { alimento: a.id, porcion: f.porcion, veces: f.veces };
          const v = valoresDe(it);
          contar(kcalB, v.kcal, kcalB.dataset.valor ? 300 : 0);
          // Lo que quedaría en el día de esa comida, sin contar lo que se está cambiando.
          const antes = editando ? totalDe(diaDe(editando.comida)).kcal - valoresDe(editando.item).kcal : totalDe(0).kcal;
          const restante = META.kcal - antes - v.kcal;
          queda.textContent = tx(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) });
          macros.innerHTML = '';
          [['p', 'proteina', v.p], ['c', 'carbohidratos', v.c], ['g', 'grasas', v.g]].forEach(([m, clave, g]) => {
            const chip = el('span', 'fi-macro fi-macro-' + m);
            chip.append(el('i'), el('b', null, `${numero(g, g < 10 ? 1 : 0)} g`), el('small', null, tx('comida.' + clave)));
            macros.appendChild(chip);
          });
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
          const paso1 = el('div', 'fi-stepper');
          paso1.append(menos, valor, mas);
          cantidad.appendChild(paso1);
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
        pintar();
      });
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
        const agregarB = boton('fi-agregar', tx('comida.agregarA.' + s.hoja.comida), () => {
          const v = valores();
          if (!v.kcal) { campos.kcal.focus(); return; }
          agregar(Object.assign({ rapida: true, nombre: campos.nombre.value.trim() }, v));
          cerrarSub();
        });
        pie.appendChild(agregarB);
        sub.appendChild(pie);
        function pintar() {
          const v = valores();
          campos.kcal.placeholder = v.kcal && !campos.kcal.value ? numero(Math.round(v.kcal)) : '0';
          agregarB.disabled = !v.kcal;
        }
        pintar();
        setTimeout(() => campos.kcal.focus({ preventScroll: true }), 60);
      });
    }

    // Las comidas guardadas: un toque agrega todo.
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
            const c = comidaDeHoy(s.hoja.comida);
            const copias = items.map((it) => Object.assign({ nuevo: true }, it));
            c.items.push(...copias);
            copias.forEach((it) => s.hoja.agregados.push({ comida: c, item: it }));
            escena.haptico('suave');
            mas.innerHTML = icono('listo');
            mas.classList.add('hecho');
            avisarHoja(g.nombre[idioma], { deshacer: () => copias.forEach((it) => quitarAgregado(it)) });
            pintarBandeja();
            registrado(g.nombre[idioma]);
            setTimeout(() => cerrarSub(), 500);
          }, tx('comida.agregarAlimento', { alimento: g.nombre[idioma] }));
          f.append(textos, mas);
          cuerpo.appendChild(f);
        });
        sub.appendChild(cuerpo);
      });
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
      hoja.classList.toggle('con-teclado', !!si && !!s.hoja && !s.hoja.sub);
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

    // ------------------------------------------------------------ arranque
    pintarBarraCielo(0);
    pintarZona(0);

    return {
      ir,
      volver,
      abrirHoja: (op) => abrirHoja(op || {}),
      cerrarHoja,
      verDia,
      get enZona() { return s.enZona; },
      get hojaAbierta() { return !!s.hoja; },
      get dia() { return s.dia; },
      ponerIdioma(id) {
        idioma = id;
        armarTeclado();
        pintarBarraCielo(0);
        pintarZona(0);
        if (s.hoja) { pintarChips(); pintarAtajos(); pintarCuerpo(); pintarBandeja(); entrada.placeholder = tx('comida.buscar'); }
      },
      // Para las capturas: los mismos caminos que los toques.
      escribir(texto) { if (!s.hoja) return; entrada.value = texto; s.escribio = true; pintarCuerpo(); },
      ficha(nombre) { const a = porNombre.get(nombre); if (!a || !s.hoja) return false; const [p, v] = conUltima(a); abrirFicha(a, { porcion: p, veces: v }); return true; },
      agregarPrimero() { const b = $h('.hj-cuerpo .hj-mas'); if (b) b.click(); },
      cargaRapida() { if (s.hoja) abrirRapida(); },
      guardadas() { if (s.hoja) abrirGuardadas(); },
      copiarDeAyer: (tipo) => copiarDeAyer(tipo || 'cena', s.hoja ? 'hoja' : 'zona'),
      bajarA(destino) {
        const n = (destino === 'semana' && $z('.cm-seccion-semana')) || (destino === 'ahora' && ($z('.cm-ahora') || $z('.cm-linea .cm-entrada:last-child'))) || $z('.cm-seccion-dia');
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
