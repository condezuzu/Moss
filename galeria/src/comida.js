// La comida en la galería, para aprobar antes de programarla (etapas 5 y 7 del plan):
// - la pestaña Inicio: la luna, los macros, el agua, la línea del día, la semana y el mes;
// - la hoja de registro: la búsqueda, la ventana del alimento, la comida que se arma y el teclado.
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
      // Los toques desde Inicio hasta registrar algo (se cuentan para comparar con la especificación).
      toques: 0,
      escribio: false,
    };
    const armarDia = (comidas) => comidas.map((c) => Object.assign({}, c, { items: c.items.map(([n, v, p]) => item(n, v, p)).filter(Boolean) }));
    for (let k = PRIMER_DIA; k <= ULTIMO_DIA; k++) {
      const plantilla = k >= -1 ? DIAS[k] : SIN_REGISTRO.has(k) ? null : DIAS_TIPO[-k % DIAS_TIPO.length];
      s.dias[k] = plantilla ? armarDia(plantilla) : [];
      s.agua[k] = k === 0 ? 5 : k < 0 && plantilla ? 6 + ((-k * 7) % 4) : 0;
    }
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

    // ------------------------------------------------------------ la luna
    // Se llena con lo comido: la parte iluminada es lo que llevás del día. Es una luna de verdad, con
    // sus mares y su grano, y la sombra con el borde suave. Los tres arcos (proteína, carbohidratos y
    // grasas contra su meta) son opcionales: los macros ya están en las barras.
    let lunas = 0;
    const CAJA_CON_ARCOS = '-80 -80 160 160';
    const CAJA_SIN_ARCOS = '-50 -50 100 100';
    function crearLuna(clase) {
      const id = `cmLuna${++lunas}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', CAJA_CON_ARCOS);
      svg.setAttribute('class', clase);
      svg.setAttribute('aria-hidden', 'true');
      const arcos = [['p', 54], ['c', 62], ['g', 70]].map(([m, r]) => `<circle r="${r}" class="cm-pista"/><circle r="${r}" class="cm-arco cm-arco-${m}" transform="rotate(-90)"/>`).join('');
      svg.innerHTML = `
        <defs>
          <radialGradient id="${id}-cara" cx="40%" cy="36%" r="72%">
            <stop offset="0" stop-color="#f7f3e8"/><stop offset="0.6" stop-color="#e4ddcc"/><stop offset="1" stop-color="#b9b09b"/>
          </radialGradient>
          <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="4"/>
            <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 1.5 -0.72"/>
            <feComposite in2="SourceAlpha" operator="in"/>
          </filter>
          <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
          <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><path class="cm-luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
          <clipPath id="${id}-disco"><circle r="40"/></clipPath>
        </defs>
        <circle r="46" class="cm-luna-halo"/>
        <g clip-path="url(#${id}-disco)">
          <circle r="40" class="cm-luna-noche"/>
          <g mask="url(#${id}-luz)">
            <circle r="40" fill="url(#${id}-cara)"/>
            <g class="cm-mares" filter="url(#${id}-suave)">
              <ellipse cx="-13" cy="-15" rx="11" ry="8.5"/><ellipse cx="5" cy="-11" rx="7" ry="6"/><ellipse cx="13" cy="-1" rx="8" ry="7"/>
              <ellipse cx="-21" cy="5" rx="8" ry="15"/><ellipse cx="-3" cy="14" rx="7" ry="4.5"/><ellipse cx="22" cy="-14" rx="4" ry="3.2"/>
              <ellipse cx="19" cy="13" rx="5" ry="4"/>
            </g>
            <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.55"/>
            <circle cx="-7" cy="27" r="1.5" class="cm-crater"/><circle cx="9" cy="22" r="1" class="cm-crater"/>
          </g>
        </g>
        <circle r="40" class="cm-luna-contorno"/>${arcos}`;
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
        // Sin los arcos, la luna ocupa todo el lugar.
        arcos(si) { svg.setAttribute('viewBox', si ? CAJA_CON_ARCOS : CAJA_SIN_ARCOS); },
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

    // ------------------------------------------------------------ la pestaña Inicio: la comida
    // Como MacroFactor: por día, por semana y por mes. El día tiene arriba la tira de la semana, con
    // una luna chica por día que se llena con lo comido (se toca para ver ese día); la semana, el
    // promedio, los siete días con sus barras y el peso y el gasto; el mes, el calendario de lunas.
    const zona = el('section', 'comida');
    zona.innerHTML = `
      <div class="cm-scroll">
        <header class="cm-cab"><div class="cm-fecha"></div><h2 class="cm-titulo"></h2></header>
        <div class="cm-vistas"></div>
        <div class="cm-vista cm-vista-dia">
          <div class="cm-tira"></div>
          <div class="cm-heroe"><div class="cm-escenario"></div><div class="cm-cifra"><b></b><span></span></div><div class="cm-de"></div></div>
          <div class="cm-macros cm-macros-dia"></div>
          <div class="cm-agua"></div>
          <h3 class="cm-seccion cm-seccion-dia"></h3>
          <p class="cm-nota" hidden></p>
          <div class="cm-linea"></div>
        </div>
        <div class="cm-vista cm-vista-semana" hidden>
          <article class="cm-carta cm-promedio cm-promedio-semana"></article>
          <div class="cm-grafica"></div>
          <h3 class="cm-seccion cm-seccion-cuerpo"></h3>
          <div class="cm-semana"></div>
        </div>
        <div class="cm-vista cm-vista-mes" hidden>
          <div class="cm-calendario"></div>
          <article class="cm-carta cm-promedio cm-promedio-mes"></article>
        </div>
      </div>
      <nav class="cm-barra"></nav>
      <div class="cm-aviso" role="status"><span></span></div>`;
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const $z = (q) => zona.querySelector(q);
    const lunaGrande = crearLuna('cm-luna');
    $z('.cm-escenario').appendChild(lunaGrande.svg);
    function ponerArcos(si) {
      zona.classList.toggle('sin-arcos', !si);
      lunaGrande.arcos(si);
    }
    ponerArcos(false);
    const scroll = $z('.cm-scroll');

    // Registrar: el «+» de abajo a la derecha, siempre en el mismo lugar.
    const masZona = boton('bh-mas', icono('mas'), () => abrirHoja({}), tx('comida.registrar'));
    $z('.cm-barra').append(masZona);

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
    // todavía no llegó es solo el contorno.
    function lunita(k) {
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '-12 -12 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const comidas = comidasDe(k);
      const plan = comidas.some((c) => c.plan);
      const estado = k > 0 && !plan ? 'futuro' : comidas.length ? (plan ? 'plan' : 'comido') : 'vacio';
      svg.setAttribute('class', 'cm-lunita ' + estado);
      const fr = Math.min(1, totalDe(k).kcal / META.kcal);
      const luz = estado === 'comido' || estado === 'plan' ? `<path d="${fase(Math.max(0.04, fr), 9.5)}" class="cm-lunita-luz"/>` : '';
      svg.innerHTML = `<circle r="9.5" class="cm-lunita-noche"/>${luz}<circle r="9.5" class="cm-lunita-borde"/>`;
      return svg;
    }

    function pintarVistas() {
      const cont = $z('.cm-vistas');
      cont.innerHTML = '';
      ['dia', 'semana', 'mes'].forEach((v) => {
        const b = boton('cm-vista-btn', tx('comida.vistas.' + v), () => verVista(v));
        b.setAttribute('aria-pressed', String(s.vista === v));
        cont.appendChild(b);
      });
      zona.querySelectorAll('.cm-vista').forEach((n) => { n.hidden = !n.classList.contains('cm-vista-' + s.vista); });
    }

    function pintarCabecera() {
      const d = s.dia;
      const f = fechaDe(d);
      if (s.vista === 'dia') {
        $z('.cm-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + f.dia), num: f.num, mes: tx('fecha.mesesCortos.' + f.mes) });
        const cerca = { '-1': 'ayer', 0: 'hoy', 1: 'manana' }[d];
        $z('.cm-titulo').textContent = cerca ? tx('comida.dias.' + cerca) : Buscar.conMayuscula(tx('comida.tituloDia', { dia: tx('fecha.dias.' + f.dia), num: f.num }));
      } else if (s.vista === 'semana') {
        const lunes = fechaDe(lunesDe(d));
        const domingo = fechaDe(lunesDe(d) + 6);
        $z('.cm-fecha').textContent = tx('comida.rangoSemana', { desde: lunes.num, hasta: domingo.num, mes: tx('fecha.mesesCortos.' + domingo.mes) });
        $z('.cm-titulo').textContent = lunesDe(d) === lunesDe(0) ? tx('comida.estaSemana') : tx('comida.semanaDel', { num: lunes.num, mes: tx('fecha.mesesCortos.' + lunes.mes) });
      } else {
        $z('.cm-fecha').textContent = String(f.anio);
        $z('.cm-titulo').textContent = Buscar.conMayuscula(tx('fecha.meses.' + f.mes));
      }
    }

    function pintarZona(ms) {
      pintarVistas();
      pintarCabecera();
      if (s.vista === 'dia') pintarDia(ms);
      else if (s.vista === 'semana') pintarVistaSemana();
      else pintarMes();

      masZona.setAttribute('aria-label', tx('comida.registrar'));
    }

    // Las barras de proteína, carbohidratos y grasas contra su meta.
    function pintarMacros(cont, t) {
      cont.innerHTML = '';
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => {
        const col = el('div', 'cm-macro cm-macro-' + m);
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
      // La luna y la cifra grande: hoy, lo que queda; otro día, lo comido o lo planificado.
      const t = totalDe(d);
      const queda = META.kcal - t.kcal;
      const cifra = $z('.cm-cifra b');
      contar(cifra, d === 0 ? Math.abs(queda) : t.kcal, ms);
      $z('.cm-cifra span').textContent = tx(d < 0 ? 'comida.enElDia' : d > 0 ? 'comida.planificadas' : queda >= 0 ? 'comida.teQuedan' : 'comida.deMas');
      $z('.cm-de').textContent = tx('comida.deMeta', { comido: numero(Math.round(t.kcal)), meta: numero(META.kcal) });
      lunaGrande.ir(fraccionesDe(t), ms);
      zona.classList.toggle('planificado', d > 0);
      pintarMacros($z('.cm-macros-dia'), t);
      pintarAgua();
      $z('.cm-seccion-dia').textContent = tx('comida.tuDia');
      const nota = $z('.cm-nota');
      nota.hidden = d <= 0;
      nota.textContent = tx(comidasDe(d).length ? 'comida.planificadoTexto' : 'comida.sinRegistros');
      pintarLinea();
    }

    function pintarAgua() {
      const caja = $z('.cm-agua');
      const d = s.dia;
      caja.hidden = d > 0;
      if (d > 0) return;
      const vasos = s.agua[d] || 0;
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
        s.agua[d] = Math.min(12, (s.agua[d] || 0) + 1);
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
        boton('cm-accion', `${icono('copiar')}<span>${tx('comida.copiarDeAyer')}</span>`, () => copiarDeAyer(tipo)),
      );
      art.appendChild(acciones);
      return art;
    }

    // ------------------------------------------------------------ la semana
    // El promedio de los días que ya terminaron y la semana entera de lunes a domingo: por día, una
    // barra de calorías y una por macro contra su meta (la línea punteada), como en MacroFactor.
    function pintarPromedio(carta, prom, diasDelTramo) {
      carta.innerHTML = '';
      carta.appendChild(el('span', 'cm-carta-titulo', tx('comida.promedio')));
      if (!prom.n) { carta.appendChild(el('p', 'cm-carta-texto', tx('comida.sinRegistros'))); return; }
      const cifra = el('div', 'cm-carta-cifra');
      cifra.append(el('b', null, numero(Math.round(prom.kcal))), el('span', null, ` ${tx('comida.kcal')}`));
      const nota = el('div', 'cm-carta-nota', `${tx('comida.metaDe', { n: numero(META.kcal) })} · ${tx('comida.diasRegistrados', { n: prom.n, total: diasDelTramo })}`);
      const macros = el('div', 'cm-macros cm-macros-promedio');
      carta.append(cifra, nota, macros);
      pintarMacros(macros, prom);
    }

    function pintarVistaSemana() {
      const lunes = lunesDe(s.dia);
      const dias = rango(lunes, lunes + 6);
      pintarPromedio($z('.cm-promedio-semana'), promedio(dias), dias.filter((k) => k < 0).length);
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
      $z('.cm-seccion-cuerpo').textContent = tx('comida.pesoYGasto');
      pintarSemana();
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
      pintarPromedio($z('.cm-promedio-mes'), promedio(dias), dias.filter((k) => k < 0).length);
    }

    function verDia(d) {
      if (d < PRIMER_DIA || d > ULTIMO_DIA) return;
      s.dia = d;
      s.vista = 'dia';
      pintarZona(700);
      scroll.scrollTo({ top: 0, behavior: 'smooth' });
      opciones.alCambiar();
    }

    function verVista(v) {
      s.vista = v;
      pintarZona(0);
      scroll.scrollTo({ top: 0, behavior: 'smooth' });
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ la pestaña a la vista
    // Las pestañas avisan cuándo Inicio queda a la vista: los toques para registrar se cuentan
    // desde ahí.
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

    // `revisar` abre directo la revisión (copiar de ayer); `soloEditar`, la ventana de un registro.
    function abrirHoja({ comida, revisar, soloEditar }) {
      if (s.hoja || escena.viajando || escena.modo === 'entrada') return false;
      s.hoja = { comida: comida || Comidas.comidaDeLaHora(AHORA), sub: null, ventana: null, agregado: false, soloEditar: !!soloEditar };
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
      if (agregado) { s.dia = 0; s.vista = 'dia'; pintarZona(1100); }
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
      const mas = boton('hj-mas', icono('mas'), () => abrirVentana(a, { porcion, veces, boton: mas }), tx('comida.sumarAlimento', { alimento: nombreDe(a) }));
      f.append(textos, mas);
      f.addEventListener('click', () => abrirVentana(a, { porcion, veces, boton: mas }));
      f.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') abrirVentana(a, { porcion, veces, boton: mas }); });
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
        sub.appendChild(cuerpo);
      });
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
      titulos.append(el('h3', 'vt-nombre', nombreDe(a)), el('div', 'vt-fuente', tx(a.id < 0 ? 'comida.fuente.propio' : 'comida.fuente.usda')));
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
          avisarZona(tx('comida.quitado', { alimento: nombre }));
        }));
      }

      ventana.append(cab, cifras, queda, el('div', 'fi-etq', tx('comida.porcion')), porciones, el('div', 'fi-etq', tx('comida.cantidad')), cantidad, gramosTxt, pie);

      const pintar = () => {
        const it = elegido();
        const v = valoresDe(it);
        contar(kcalB, v.kcal, kcalB.dataset.valor ? 300 : 0);
        // Lo que quedaría en el día: lo registrado, lo que ya se juntó y esto, sin contar lo que se cambia.
        const juntado = sumar(s.canasta).kcal - (enCanasta ? valoresDe(enCanasta).kcal : 0);
        const antes = editando ? totalDe(diaDe(editando.comida)).kcal - valoresDe(editando.item).kcal : totalDe(0).kcal + juntado;
        const restante = META.kcal - antes - v.kcal;
        queda.textContent = tx(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) });
        macros.innerHTML = '';
        [['p', v.p], ['c', v.c], ['g', v.g]].forEach(([m, g]) => {
          const chip = el('span', 'vt-macro fi-macro-' + m);
          chip.append(el('i'), `${numero(g, g < 10 ? 1 : 0)} g`);
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
      get dia() { return s.dia; },
      ponerIdioma(id) {
        idioma = id;
        armarTeclado();
        pintarZona(0);
        if (s.hoja) { pintarChips(); pintarAtajos(); pintarCuerpo(); pintarBandeja(); entrada.placeholder = tx('comida.buscar'); }
      },
      // Para las capturas: los mismos caminos que los toques.
      escribir(texto) { if (!s.hoja) return; entrada.value = texto; s.escribio = true; pintarCuerpo(); },
      ficha(nombre) { const a = porNombre.get(nombre); if (!a || !s.hoja) return false; const [p, v] = conUltima(a); abrirVentana(a, { porcion: p, veces: v }); return true; },
      agregarPrimero() { const b = $h('.hj-cuerpo .hj-mas'); if (b) b.click(); },
      sumar() { const b = ventana.querySelector('.vt-pie .fi-agregar'); if (b) b.click(); },
      listo() { const b = $h('.hj-listo'); if (b) b.click(); },
      confirmar() { const b = $h('.hj-revision .fi-agregar'); if (b) b.click(); },
      cargaRapida() { if (s.hoja) abrirRapida(); },
      guardadas() { if (s.hoja) abrirGuardadas(); },
      copiarDeAyer: (tipo) => (s.hoja ? sumarDeAyer(tipo || s.hoja.comida) : copiarDeAyer(tipo || 'cena')),
      bajarA(destino) {
        const n = (destino === 'semana' && $z('.cm-seccion-cuerpo')) || (destino === 'ahora' && ($z('.cm-ahora') || $z('.cm-linea .cm-entrada:last-child'))) || $z('.cm-seccion-dia');
        const arriba = destino === 'ahora' ? 260 : 70;
        scroll.scrollTo({ top: Math.max(0, scroll.scrollTop + n.getBoundingClientRect().top - scroll.getBoundingClientRect().top - arriba), behavior: 'auto' });
        scroll.dispatchEvent(new Event('scroll'));
      },
      teclado,
      dictar,
      arcos: ponerArcos,
    };
  }

  return { crear };
})();
