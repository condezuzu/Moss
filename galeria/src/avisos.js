// Los avisos como se ven en la pantalla bloqueada (spec/avisos.md), con la regla y los textos de verdad
// (Avisos y LoQueFalta, de src/dominio). Dos vistas:
// - «Un día»: se mueve la hora y van llegando los avisos de un día, cada uno por su lado. Lo que haces en
//   el día (entrenar, merendar antes, comer poca proteína) cambia lo que suena después.
// - «Todos»: cada aviso de la app, para revisar cómo dice cada cosa, en español y en inglés.

const AvisosBloqueo = (() => {
  const CSS = `
.tel .ab { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; color: #fff; overflow: hidden; background: #0a1024 center / cover no-repeat; animation: ab-abre 280ms ease; }
.tel .ab.saliendo { opacity: 0; transform: translateY(12px); transition: opacity 240ms ease, transform 240ms ease; }
.tel .ab::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8, 12, 30, 0.42), rgba(8, 12, 30, 0.2) 34%, rgba(8, 12, 30, 0.66)); pointer-events: none; }
.tel .ab > * { position: relative; }
.ab-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: calc(var(--arriba) - 10px) 12px 0; }
.ab-cerrar { width: 32px; height: 32px; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 17px; line-height: 1; }
.ab-seg { display: inline-flex; padding: 2px; border-radius: 10px; background: rgba(255, 255, 255, 0.12); }
.ab-seg button { padding: 5px 11px; border: 0; border-radius: 8px; background: none; color: rgba(255, 255, 255, 0.72); font: 600 12.5px/1.2 var(--letra, inherit); transition: background 180ms ease, color 180ms ease; }
.ab-seg button[aria-pressed='true'] { background: rgba(255, 255, 255, 0.92); color: #10162e; }
.ab-reloj { text-align: center; overflow: hidden; max-height: 118px; transition: max-height 260ms ease, opacity 200ms ease; }
.ab-reloj.fuera { max-height: 0; opacity: 0; }
.ab-reloj span { display: block; margin-top: 8px; font: 600 15px/1.2 var(--letra, inherit); color: rgba(255, 255, 255, 0.86); }
.ab-reloj b { display: block; font: 600 70px/1.08 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ab-lista { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 7px; padding: 8px 10px 10px; scrollbar-width: none; }
.ab-lista::-webkit-scrollbar { display: none; }
.ab-grupo { margin: 8px 6px 0; font: 600 11.5px/1.2 var(--letra, inherit); letter-spacing: 0.04em; text-transform: uppercase; color: rgba(255, 255, 255, 0.72); }
.ab-aviso { flex: none; display: grid; grid-template-columns: 36px 1fr; column-gap: 10px; padding: 10px 12px; border-radius: 20px; background: rgba(30, 36, 62, 0.66); -webkit-backdrop-filter: blur(16px) saturate(1.3); backdrop-filter: blur(16px) saturate(1.3); }
.ab-aviso.entra { animation: ab-entra 340ms cubic-bezier(0.2, 0.9, 0.3, 1); }
.ab-aviso.sale { animation: ab-sale 240ms ease forwards; }
.ab-aviso i { grid-row: span 2; width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(160deg, #24427a, #101a3a) center / cover no-repeat; align-self: center; }
.ab-titulo { display: flex; justify-content: space-between; align-items: baseline; font: 600 14px/1.25 var(--letra, inherit); }
.ab-titulo em { font: 400 12px/1.2 var(--letra, inherit); font-style: normal; color: rgba(255, 255, 255, 0.62); font-variant-numeric: tabular-nums; }
.ab-aviso p { margin: 1px 0 0; font: 400 14px/1.28 var(--letra, inherit); color: rgba(255, 255, 255, 0.94); }
.ab-vacio { margin: auto; max-width: 240px; text-align: center; font: 400 13.5px/1.35 var(--letra, inherit); color: rgba(255, 255, 255, 0.72); }
.ab-panel { margin: 0 10px calc(var(--abajo) + 4px); padding: 11px 12px; border-radius: 20px; background: rgba(12, 16, 34, 0.76); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); display: flex; flex-direction: column; gap: 9px; }
.ab-hora { display: flex; align-items: center; gap: 10px; }
.ab-hora input { flex: 1; min-width: 0; accent-color: #7ba7ff; }
.ab-siguiente { flex: none; padding: 7px 10px; border: 0; border-radius: 10px; background: rgba(123, 167, 255, 0.24); color: #d7e4ff; font: 600 12.5px/1.2 var(--letra, inherit); }
.ab-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ab-chip { padding: 6px 10px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 999px; background: none; color: rgba(255, 255, 255, 0.82); font: 500 12.5px/1.2 var(--letra, inherit); transition: background 180ms ease, color 180ms ease, border-color 180ms ease; }
.ab-chip[aria-pressed='true'] { background: rgba(123, 167, 255, 0.26); border-color: rgba(123, 167, 255, 0.6); color: #fff; }
.ab-nota { margin: 0; font: 400 12px/1.32 var(--letra, inherit); color: rgba(255, 255, 255, 0.66); }
@keyframes ab-abre { from { opacity: 0; transform: translateY(12px); } }
@keyframes ab-entra { from { opacity: 0; transform: translateY(-14px) scale(0.97); } }
@keyframes ab-sale { to { opacity: 0; transform: scale(0.96); } }
@media (prefers-reduced-motion: reduce) { .tel .ab, .ab-aviso.entra, .ab-aviso.sale { animation-duration: 1ms; } .ab-reloj, .tel .ab.saliendo { transition: none; } }
`;
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hm = (texto) => { const [h, m] = texto.split(':').map(Number); return h * 60 + m; };
  const TODOS = [0, 1, 2, 3, 4, 5, 6];
  const DIA = '2026-11-02';

  // Lo de la persona de ejemplo: se despierta 7:30 y se duerme 23:30.
  const SUENO = { habitual: () => ({ dormirse: 330, despertar: 810 }), necesidad: 480, deuda: 0 };
  const HORARIO = { desayuno: hm('8:00'), almuerzo: hm('13:00'), merienda: hm('17:30'), cena: hm('21:00') };
  const META = { kcal: 2200, proteina: 150, carbohidratos: 250, grasas: 70 };
  const AJUSTES = {
    dormir: { encendido: true },
    horario: HORARIO,
    pesarse: { encendido: true, todos: true },
    comidas: ['cena'],
    maximoPorDia: 8,
    habitos: [
      { habito: 'vitaminas', cuando: { tipo: 'hora', minutos: hm('10:00') }, dias: [] },
      // Como en tu caso: entrenar avisa cerca de la merienda.
      { habito: 'entrenar', cuando: { tipo: 'hora', minutos: hm('17:35') }, dias: [] },
      { habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] },
    ],
  };

  function crear(tel, opciones) {
    const s = { modo: 'dia', hora: hm('17:30'), idioma: null, entreno: true, merendo: false, pocaProteina: false, cierre: 0 };
    const u = Util.crear(Object.assign({}, opciones, { idioma: () => s.idioma || opciones.idioma() }));
    const { tx, el, boton } = u;
    const en = () => (s.idioma || opciones.idioma()) === 'en';

    if (!document.getElementById('ab-css')) {
      const estilo = document.createElement('style');
      estilo.id = 'ab-css';
      estilo.textContent = CSS;
      document.head.appendChild(estilo);
    }
    const raiz = el('section', 'ab');
    raiz.hidden = true;
    raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-modal', 'true');
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    if (typeof FONDOS_WIDGETS !== 'undefined' && FONDOS_WIDGETS.noche) raiz.style.backgroundImage = `url(${FONDOS_WIDGETS.noche})`;
    tel.appendChild(raiz);

    const nombresDeHabitos = () => ({ entrenar: en() ? 'Work out' : 'Entrenar', leer: en() ? 'Read' : 'Leer', vitaminas: en() ? 'Take vitamins' : 'Vitaminas' });
    const habitos = () => Object.entries(nombresDeHabitos()).map(([id, nombre]) => ({ id, nombre, icono: id === 'entrenar' ? 'dumbbell' : 'star', dias: TODOS, fuente: { tipo: 'manual' }, orden: 0, desde: '2026-01-01' }));
    const paraElTexto = (plan) => ({ t: tx, habito: (id) => nombresDeHabitos()[id] || '', plan: plan || (() => ''), duracion: u.duracion });
    const propios = () => (en()
      ? [{ nombre: 'Chicken breast', proteina: 45, kcal: 240 }, { nombre: 'Greek yogurt', proteina: 15, kcal: 130 }, { nombre: 'Tuna salad', proteina: 22, kcal: 210 }]
      : [{ nombre: 'Pechuga de pollo', proteina: 45, kcal: 240 }, { nombre: 'Yogur griego', proteina: 15, kcal: 130 }, { nombre: 'Ensalada de atún', proteina: 22, kcal: 210 }]);

    /** Lo que pasa durante el día de ejemplo, según los botones. */
    function guion() {
      const merienda = s.merendo ? hm('16:50') : hm('18:10');
      const parte = (s.pocaProteina ? 0.55 : 1);
      return {
        // Cada comida se anota un rato después de su aviso, como pasa de verdad.
        comidas: [
          ['desayuno', hm('8:05'), 400, 30 * parte],
          ['almuerzo', hm('13:20'), 750, 55 * parte],
          ['merienda', merienda, 250, 15],
          ['cena', hm('21:55'), 650, 55 * parte],
        ],
        entreno: s.entreno ? hm('9:10') : hm('18:40'),
      };
    }

    /** El día entero, minuto a minuto, con la regla de verdad: lo que ya sonó queda y lo que hiciste cambia lo que sigue. */
    function linea() {
      const g = guion();
      const llegados = [];
      const ya = new Set();
      const dias = habitos();
      for (let T = hm('6:00'); T <= 24 * 60 + 30; T++) {
        const hechas = g.comidas.filter(([, cuando]) => cuando <= T);
        const anotadas = Object.fromEntries(hechas.map(([c, cuando]) => [c, cuando]));
        const comido = hechas.reduce((m, [, , kcal, proteina]) => ({ ...m, kcal: m.kcal + kcal, proteina: m.proteina + proteina }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
        const aLaTarde = g.comidas.filter(([, cuando]) => cuando <= hm('19:00')).reduce((m, [, , kcal, proteina]) => ({ ...m, kcal: m.kcal + kcal, proteina: m.proteina + proteina }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
        // Se programa antes de que suene: lo que ve el teléfono es el minuto anterior.
        const faltas = LoQueFalta.loQueFaltaHoy({ dia: DIA, ahora: T - 1, meta: META, comido, comidoALaTarde: aLaTarde, anotadas, horaDeCena: HORARIO.cena, acostarse: hm('23:30'), comidasHabituales: 4, propios: propios() });
        const marcas = new Map(g.entreno <= T ? [[Dias.claveDeMarca('entrenar', DIA), { hecho: true }]] : []);
        const lista = Avisos.avisosDelDia({
          dia: DIA, ajustes: AJUSTES, habitos: dias, sueno: SUENO, horaDeComida: (c) => HORARIO[c] ?? hm('16:00'), marcas, anotadas: new Set(Object.keys(anotadas)), eventos: anotadas, ahora: T - 1, sesiones: s.entreno ? [{ inicio: hm('8:00'), minutos: 60 }] : [], faltas,
        });
        for (const n of lista) {
          if (n.minutos !== T || ya.has(n.aviso.id)) continue;
          ya.add(n.aviso.id);
          llegados.push(n);
        }
      }
      return llegados;
    }

    // Los avisos que ya están en pantalla, por su clave: los nuevos entran y los que se van, salen, sin saltos.
    const enPantalla = new Map();
    function tarjeta(texto, hora) {
      const a = el('article', 'ab-aviso entra');
      const ic = el('i');
      if (typeof TIENDA !== 'undefined' && TIENDA && TIENDA.icono) ic.style.backgroundImage = `url(${TIENDA.icono})`;
      const titulo = el('div', 'ab-titulo');
      titulo.append(el('b', null, 'Moss'), el('em', null, hora));
      a.append(ic, titulo, el('p', null, texto));
      a.addEventListener('animationend', (ev) => { if (ev.animationName === 'ab-entra') a.classList.remove('entra'); });
      return a;
    }
    function ponerAvisos(lista, avisos) {
      const vivas = new Set(avisos.map((x) => x.clave));
      for (const [clave, nodo] of enPantalla) {
        if (vivas.has(clave)) continue;
        enPantalla.delete(clave);
        if (quieto()) { nodo.remove(); continue; }
        nodo.classList.remove('entra');
        nodo.classList.add('sale');
        nodo.addEventListener('animationend', () => nodo.remove(), { once: true });
      }
      avisos.forEach((x, i) => {
        let nodo = enPantalla.get(x.clave);
        if (!nodo) { nodo = tarjeta(x.texto, x.hora); enPantalla.set(x.clave, nodo); }
        else nodo.querySelector('p').textContent = x.texto;
        const enEseLugar = lista.children[i];
        if (enEseLugar !== nodo) lista.insertBefore(nodo, enEseLugar || null);
      });
    }

    function pintarDia(cuerpo) {
      const todos = linea();
      s.todos = todos;
      const llegados = todos.filter((n) => n.minutos <= s.hora).reverse();
      const vacio = el('p', 'ab-vacio', 'Todavía no sonó nada.');
      if (!llegados.length) cuerpo.appendChild(vacio);
      else ponerAvisos(cuerpo, llegados.map((n) => ({ clave: n.aviso.id, texto: Avisos.textoDelAviso(n, paraElTexto()), hora: u.horaMin(n.minutos) })));
      return { todos, llegados };
    }

    function todasLasFalta() {
      const f = (extra) => ({ que: 'proteina', cuanto: 40, ideas: [{ id: 'yogurGriego' }, { id: 'huevos' }], alcanza: true, forma: 0, ...extra });
      return [
        f({}), f({ ideas: [{ nombre: propios()[0].nombre }], forma: 3 }), f({ forma: 1 }), f({ forma: 2, ideas: [{ nombre: propios()[1].nombre }, { id: 'huevos' }] }),
        f({ cuanto: 85, alcanza: false }), f({ cuanto: 85, alcanza: false, forma: 1, ideas: [{ nombre: propios()[0].nombre }] }),
        f({ que: 'calorias', cuanto: 500, ideas: [{ id: 'pasta' }] }), f({ que: 'calorias', cuanto: 450, ideas: [{ id: 'sandwich' }, { id: 'frutaConYogur' }], forma: 1 }), f({ que: 'calorias', cuanto: 700, alcanza: false, ideas: [{ id: 'avena' }] }),
        f({ que: 'agua', cuanto: 5, ideas: [] }), f({ que: 'agua', cuanto: 5, ideas: [], forma: 1 }), f({ que: 'agua', cuanto: 5, ideas: [], forma: 2 }),
        f({ sinNumeros: true }), f({ que: 'calorias', ideas: [{ id: 'sandwich' }], sinNumeros: true }),
      ];
    }

    function pintarTodos(cuerpo) {
      const n = (aviso, plan) => Avisos.textoDelAviso({ dia: DIA, minutos: 0, aviso: { id: 'x', minutos: 0, ...aviso } }, paraElTexto(plan));
      const grupos = [
        ['Comidas', [
          ...['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map((comida) => n({ tipo: 'horario', comida })),
          n({ tipo: 'horario', comida: 'almuerzo' }, () => (en() ? 'grilled chicken, rice' : 'pollo a la plancha, arroz')),
          n({ tipo: 'comida', comida: 'merienda' }), n({ tipo: 'comida', comida: 'cena' }),
        ]],
        ['Si vas muy bajo en algo', todasLasFalta().map((falta) => n({ tipo: 'falta', falta }))],
        ['Hábitos', [n({ tipo: 'habito', habito: 'entrenar' }), n({ tipo: 'habito', habito: 'leer' }), n({ tipo: 'habito', habito: 'leer', mensaje: en() ? 'One chapter, phone in the other room' : 'Un capítulo, con el teléfono en otra pieza' })]],
        ['Pesarte', [n({ tipo: 'pesarse' }), n({ tipo: 'pesarse', control: true })]],
        ['La hora de dormir', [...Avisos.TEXTOS_DE_DORMIR, 'deuda'].map((texto) => n({ tipo: 'dormir', minutos: hm('23:00'), texto, dormirA: hm('23:30'), despertarA: 24 * 60 + hm('7:30'), duerme: 480, deuda: 90 }))],
        ['La prueba', [tx('recordatorios.pruebaTermina')]],
      ];
      for (const [titulo, avisos] of grupos) {
        cuerpo.appendChild(el('h4', 'ab-grupo', titulo));
        for (const texto of avisos) cuerpo.appendChild(tarjeta(texto, en() ? 'now' : 'ahora'));
      }
    }

    function pintar() {
      const scrollAntes = raiz.querySelector('.ab-lista')?.scrollTop ?? 0;
      const listaDeAntes = s.modo === 'dia' ? raiz.querySelector('.ab-lista') : null;
      raiz.replaceChildren();
      const cab = el('header', 'ab-cab');
      cab.appendChild(boton('ab-cerrar', '×', cerrar));
      const seg = el('div', 'ab-seg');
      for (const [modo, texto] of [['dia', 'Un día'], ['todos', 'Todos']]) {
        const b = boton('', texto, () => { if (s.modo === modo) return; s.modo = modo; enPantalla.clear(); pintar(); });
        b.setAttribute('aria-pressed', String(s.modo === modo));
        seg.appendChild(b);
      }
      const idioma = el('div', 'ab-seg');
      for (const [codigo, texto] of [['es', 'ES'], ['en', 'EN']]) {
        const b = boton('', texto, () => { s.idioma = codigo; pintar(); });
        b.setAttribute('aria-pressed', String((s.idioma || opciones.idioma()) === codigo));
        idioma.appendChild(b);
      }
      cab.append(seg, idioma);
      raiz.appendChild(cab);

      const reloj = el('div', 'ab-reloj' + (s.modo === 'todos' ? ' fuera' : ''));
      reloj.append(el('span', null, u.fechaLarga(DIA).replace(/^./, (c) => c.toUpperCase())), el('b', null, u.horaMin(s.hora)));
      raiz.appendChild(reloj);

      const cuerpo = listaDeAntes || el('div', 'ab-lista');
      if (!listaDeAntes) cuerpo.className = 'ab-lista';
      raiz.appendChild(cuerpo);
      if (s.modo === 'todos') {
        cuerpo.replaceChildren();
        pintarTodos(cuerpo);
        cuerpo.scrollTop = scrollAntes;
        return;
      }
      cuerpo.querySelector('.ab-vacio')?.remove();
      const { todos, llegados } = pintarDia(cuerpo);

      const panel = el('div', 'ab-panel');
      const hora = el('div', 'ab-hora');
      const rango = el('input');
      Object.assign(rango, { type: 'range', min: hm('6:00'), max: 24 * 60 + 30, step: 5, value: s.hora });
      rango.setAttribute('aria-label', 'La hora del día');
      rango.addEventListener('input', () => { s.hora = Number(rango.value); pintar(); });
      hora.appendChild(rango);
      const proximo = todos.find((n) => n.minutos > s.hora);
      const siguiente = boton('ab-siguiente', 'Siguiente ›', () => { if (proximo) { s.hora = proximo.minutos; pintar(); } });
      siguiente.disabled = !proximo;
      hora.appendChild(siguiente);
      panel.appendChild(hora);
      const chips = el('div', 'ab-chips');
      for (const [clave, texto] of [['entreno', 'Entrené a la mañana'], ['merendo', 'Merendé antes de hora'], ['pocaProteina', 'Comí poca proteína']]) {
        const c = boton('ab-chip', texto, () => { s[clave] = !s[clave]; pintar(); });
        c.setAttribute('aria-pressed', String(s[clave]));
        chips.appendChild(c);
      }
      panel.appendChild(chips);
      const faltas = todos.filter((n) => n.aviso.tipo === 'falta').length;
      const nota = [`${todos.length} avisos en todo el día${faltas ? `, ${faltas} de lo que falta` : ''}.`];
      if (!todos.some((n) => n.aviso.id.startsWith('habito:entrenar'))) nota.push('«Entrenar» no suena: ya entrenaste.');
      if (!todos.some((n) => n.aviso.id === 'horario:merienda')) nota.push('«Hora de la merienda» no suena: ya merendaste.');
      panel.appendChild(el('p', 'ab-nota', nota.join(' ')));
      raiz.appendChild(panel);
      if (llegados.length) cuerpo.scrollTop = 0;
    }

    function abrir() {
      clearTimeout(s.cierre);
      raiz.hidden = false;
      raiz.classList.remove('saliendo');
      enPantalla.clear();
      raiz.replaceChildren();
      pintar();
    }
    function cerrar() {
      raiz.classList.add('saliendo');
      s.cierre = setTimeout(() => { raiz.hidden = true; raiz.classList.remove('saliendo'); raiz.replaceChildren(); enPantalla.clear(); }, quieto() ? 0 : 260);
    }
    return {
      abrir, cerrar,
      get abierta() { return !raiz.hidden; },
      // Para las capturas: { modo, hora, idioma, entreno, merendo, pocaProteina, abajo }.
      poner(p) {
        Object.assign(s, p);
        if (p.modo || p.idioma) { enPantalla.clear(); raiz.querySelector('.ab-lista')?.remove(); }
        pintar();
        if (p.abajo !== undefined) { const l = raiz.querySelector('.ab-lista'); if (l) l.scrollTop = p.abajo; }
      },
    };
  }
  return { crear };
})();
