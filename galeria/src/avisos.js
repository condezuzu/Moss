// Los avisos como se ven en la pantalla bloqueada (spec/avisos.md), con la regla y los textos de verdad
// (Avisos, LoQueConviene y LoQueFalta, de src/dominio). Dos vistas:
// - «Un día»: se mueve la hora y van llegando los avisos de un día, cada uno por su lado. Se elige el día
//   (sin entreno, entrenando a las 16:00 como tú, con una hora de viaje, o a las 20:30) y lo que pasa en él
//   (entrenar a otra hora, cenar temprano, comer poca proteína) cambia lo que suena después.
// - «Todos»: cada aviso de la app, para revisar cómo dice cada cosa, en español y en inglés.
// Lo que conviene (3/11, como Rise) lleva de título lo que hay que hacer; los demás, el nombre de la app.
// Con un día de ejemplo de «Según el deporte» (deporte.js), «Deporte» es ese día: su fecha, su sesión, sus
// partidos y su carrera, con «Mañana juegas» y «Tu carrera es pasado mañana» prendidos.

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
.ab-aviso { flex: none; display: grid; grid-template-columns: 36px minmax(0, 1fr); column-gap: 10px; padding: 10px 12px; border-radius: 20px; background: rgba(30, 36, 62, 0.66); -webkit-backdrop-filter: blur(16px) saturate(1.3); backdrop-filter: blur(16px) saturate(1.3); }
.ab-aviso.entra { animation: ab-entra 340ms cubic-bezier(0.2, 0.9, 0.3, 1); }
.ab-aviso.sale { animation: ab-sale 240ms ease forwards; }
.ab-aviso i { grid-row: span 2; width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(160deg, #24427a, #101a3a) center / cover no-repeat; align-self: center; }
.ab-titulo { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; min-width: 0; font: 600 14px/1.25 var(--letra, inherit); }
.ab-titulo b { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ab-titulo em { flex: none; font: 400 12px/1.2 var(--letra, inherit); font-style: normal; color: rgba(255, 255, 255, 0.62); font-variant-numeric: tabular-nums; }
.ab-aviso p { margin: 1px 0 0; font: 400 14px/1.28 var(--letra, inherit); color: rgba(255, 255, 255, 0.94); }
.ab-vacio { margin: auto; max-width: 240px; text-align: center; font: 400 13.5px/1.35 var(--letra, inherit); color: rgba(255, 255, 255, 0.72); animation: ab-abre 280ms ease; }
.ab-panel { margin: 0 10px calc(var(--abajo) + 4px); padding: 11px 12px; border-radius: 20px; background: rgba(12, 16, 34, 0.76); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); display: flex; flex-direction: column; gap: 9px; }
.ab-panel .ab-seg { align-self: flex-start; }
.ab-hora { display: flex; align-items: center; gap: 10px; }
.ab-hora input { flex: 1; min-width: 0; accent-color: #7ba7ff; }
.ab-siguiente { flex: none; padding: 7px 10px; border: 0; border-radius: 10px; background: rgba(123, 167, 255, 0.24); color: #d7e4ff; font: 600 12.5px/1.2 var(--letra, inherit); }
.ab-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ab-chip { padding: 5px 9px; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 999px; background: none; color: rgba(255, 255, 255, 0.82); font: 500 12px/1.2 var(--letra, inherit); transition: background 180ms ease, color 180ms ease, border-color 180ms ease; }
.ab-chip[aria-pressed='true'] { background: rgba(123, 167, 255, 0.26); border-color: rgba(123, 167, 255, 0.6); color: #fff; }
.ab-nota { margin: 0; font: 400 12px/1.32 var(--letra, inherit); color: rgba(255, 255, 255, 0.66); }
@keyframes ab-abre { from { opacity: 0; transform: translateY(12px); } }
@keyframes ab-entra { from { opacity: 0; transform: translateY(-14px) scale(0.97); } }
@keyframes ab-sale { to { opacity: 0; transform: scale(0.96); } }
@media (prefers-reduced-motion: reduce) { .tel .ab, .ab-aviso.entra, .ab-aviso.sale, .ab-vacio { animation-duration: 1ms; } .ab-reloj, .tel .ab.saliendo, .ab-seg button, .ab-chip { transition: none; } }
`;
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hm = (texto) => { const [h, m] = texto.split(':').map(Number); return h * 60 + m; };
  const TODOS = [0, 1, 2, 3, 4, 5, 6];
  const DIA = '2026-11-03';

  // La persona de ejemplo: se despierta a las 7:00 y se acuesta a las 23:00; 75 kg, y tarda una hora en
  // llegar al gimnasio, como tú.
  const SUENO = { habitual: () => ({ dormirse: 300, despertar: 780 }), necesidad: 480, deuda: 0 };
  const HORARIO = { desayuno: hm('7:30'), almuerzo: hm('13:00'), merienda: hm('17:30'), cena: hm('20:30') };
  const META = { kcal: 2400, proteina: 160, carbohidratos: 280, grasas: 75 };
  const VIAJE = 60;
  const MAXIMO = 8;
  const AJUSTES = {
    dormir: { encendido: true },
    horario: HORARIO,
    comidas: ['cena'],
    maximoPorDia: MAXIMO,
    habitos: [{ habito: 'leer', cuando: { tipo: 'dormir', antes: 45 }, dias: [] }],
    antesDeEntrenar: { encendido: true },
    despuesDeEntrenar: { encendido: true },
    cafe: { encendido: true },
    ultimaComida: { encendido: true },
    entrenarTarde: { encendido: true },
    luces: { encendido: true },
    partido: { encendido: true },
    carrera: { encendido: true },
  };
  // Los días de ejemplo: sin entreno, el tuyo (almuerzas a las 13:00 y entrenas a las 16:00) y uno tarde. El del
  // deporte, con un ejemplo elegido: su sesión de ese día.
  const DIAS = [['no', 'Sin entreno', null], ['tarde', 'Entreno 16:00', hm('16:00')], ['noche', 'Entreno 20:30', hm('20:30')], ['deporte', 'Deporte', null]];

  function crear(tel, opciones) {
    const s = { modo: 'dia', hora: hm('17:05'), idioma: null, dia: 'tarde', otraHora: false, cenaTemprano: false, pocaProteina: false, cierre: 0, deporte: null };
    const conDeporte = () => s.dia === 'deporte' && !!s.deporte;
    const entrenoDe = (dia) => (dia === 'deporte' ? (s.deporte && s.deporte.sesion ? s.deporte.sesion.inicio : null) : DIAS.find(([clave]) => clave === dia)[2]);
    const diaDe = () => (conDeporte() ? s.deporte.dia : DIA);
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
    const titulo = (n) => Avisos.tituloDelAviso(n, paraElTexto());
    const texto = (n) => Avisos.textoDelAviso(n, paraElTexto());
    const propios = () => (en()
      ? [{ nombre: 'Chicken breast', proteina: 45, kcal: 240 }, { nombre: 'Greek yogurt', proteina: 15, kcal: 130 }, { nombre: 'Tuna salad', proteina: 22, kcal: 210 }]
      : [{ nombre: 'Pechuga de pollo', proteina: 45, kcal: 240 }, { nombre: 'Yogur griego', proteina: 15, kcal: 130 }, { nombre: 'Ensalada de atún', proteina: 22, kcal: 210 }]);

    /** Lo que pasa durante el día de ejemplo, según el día y los botones. */
    function guion() {
      const entreno = entrenoDe(s.dia);
      const minutos = conDeporte() && s.deporte.sesion ? s.deporte.sesion.minutos : 60;
      const parte = s.pocaProteina ? 0.55 : 1;
      // Entrenando tarde, la cena es al volver; si no, antes de la hora que dice la última comida grande.
      const cena = s.cenaTemprano ? hm('19:00') : entreno !== null && entreno >= hm('19:00') ? hm('21:45') : hm('19:45');
      return {
        // Cada comida, a su hora, se anota apenas sonó su aviso: así no corre las que siguen (horasCorridas).
        comidas: [
          ['desayuno', HORARIO.desayuno, 450, 30 * parte],
          ['almuerzo', HORARIO.almuerzo, 750, 50 * parte],
          ['merienda', HORARIO.merienda, 300, 25],
          ['cena', cena, 700, 50 * parte],
        ],
        entreno,
        minutos,
        // Cuándo marcaste «Entrenar»: al volver, o a la mañana si entrenaste a otra hora.
        entrenado: s.otraHora ? hm('9:10') : entreno !== null ? entreno + minutos + 5 : null,
      };
    }

    const suma = (comidas) => comidas.reduce((m, [, , kcal, proteina]) => ({ ...m, kcal: m.kcal + kcal, proteina: m.proteina + proteina }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
    // El día entero tarda en armarse: se guarda por lo que lo cambia (el idioma, por las ideas de lo que falta).
    const hechos = new Map();
    /** El día entero, minuto a minuto, con la regla de verdad: lo que ya sonó queda y lo que hiciste cambia lo que sigue. */
    function linea(maximo = MAXIMO) {
      const clave = JSON.stringify([s.dia, conDeporte() ? s.deporte.nombre : null, s.otraHora, s.cenaTemprano, s.pocaProteina, maximo, en()]);
      if (hechos.has(clave)) return hechos.get(clave);
      const g = guion();
      const llegados = [];
      const ya = new Set();
      const dias = habitos();
      const dia = diaDe();
      // El día del deporte: su sesión (de su tipo), lo que tarda en llegar, sus partidos y su carrera.
      const d = conDeporte() ? s.deporte : null;
      const tipo = d && d.sesion ? d.sesion.tipo : 'fuerza';
      for (let T = hm('6:00'); T <= 24 * 60 + 30; T++) {
        // Se anota un par de minutos después de esa hora: lo que sonaba a esa hora ya sonó.
        const hechas = g.comidas.filter(([, cuando]) => cuando + 2 <= T);
        const anotadas = Object.fromEntries(hechas.map(([c, cuando]) => [c, cuando]));
        const comido = suma(hechas);
        // Se programa antes de que suene: lo que ve el teléfono es el minuto anterior.
        const faltas = LoQueFalta.loQueFaltaHoy({
          dia, ahora: T - 1, meta: META, comido, comidoALaTarde: suma(g.comidas.filter(([, cuando]) => cuando <= LoQueFalta.horaDeLaTarde(HORARIO.cena))), anotadas,
          horaDeCena: HORARIO.cena, acostarse: hm('23:00'), comidasHabituales: 4, propios: propios(),
        });
        const entrenado = g.entrenado !== null && g.entrenado <= T ? g.entrenado : null;
        const lista = LoQueConviene.avisosConLoQueConviene({
          dia, ajustes: { ...AJUSTES, maximoPorDia: maximo }, habitos: dias, sueno: SUENO, horaDeComida: (c) => HORARIO[c] ?? hm('16:00'),
          marcas: new Map(entrenado !== null ? [[Dias.claveDeMarca('entrenar', dia), { hecho: true }]] : []),
          anotadas: new Set(Object.keys(anotadas)), eventos: anotadas, ahora: T - 1, faltas,
          sesiones: g.entreno !== null ? [{ inicio: g.entreno, minutos: g.minutos, tipo }] : [], viaje: d ? d.viaje : VIAJE, entrenado,
          meta: META, comido, pesoKg: d ? d.pesoKg : 75, edad: 32, comidasHabituales: 4,
          ...(d ? { partidos: d.partidos, carrera: d.carrera } : {}),
        });
        for (const n of lista) {
          if (n.minutos !== T || ya.has(n.aviso.id)) continue;
          ya.add(n.aviso.id);
          llegados.push(n);
        }
      }
      hechos.set(clave, llegados);
      return llegados;
    }

    // Los avisos que ya están en pantalla, por su clave: los nuevos entran y los que se van, salen, sin saltos.
    const enPantalla = new Map();
    function tarjeta(arriba, dice, hora) {
      const a = el('article', 'ab-aviso entra');
      const ic = el('i');
      if (typeof TIENDA !== 'undefined' && TIENDA && TIENDA.icono) ic.style.backgroundImage = `url(${TIENDA.icono})`;
      const cab = el('div', 'ab-titulo');
      cab.append(el('b', null, arriba), el('em', null, hora));
      a.append(ic, cab, el('p', null, dice));
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
        if (!nodo) { nodo = tarjeta(x.titulo, x.texto, x.hora); enPantalla.set(x.clave, nodo); }
        else {
          nodo.querySelector('.ab-titulo b').textContent = x.titulo;
          nodo.querySelector('.ab-titulo em').textContent = x.hora;
          nodo.querySelector('p').textContent = x.texto;
        }
        const enEseLugar = lista.children[i];
        if (enEseLugar !== nodo) lista.insertBefore(nodo, enEseLugar || null);
      });
    }

    function pintarDia(cuerpo) {
      const todos = linea();
      const llegados = todos.filter((n) => n.minutos <= s.hora).reverse();
      // La clave lleva el día: al cambiarlo, lo de antes sale y entra lo nuevo. Sin nada, sale lo que había.
      const delDia = conDeporte() ? `deporte:${s.deporte.nombre}` : s.dia;
      ponerAvisos(cuerpo, llegados.map((n) => ({ clave: `${delDia}|${n.aviso.id}`, titulo: titulo(n), texto: texto(n), hora: u.horaMin(n.minutos) })));
      const vacio = cuerpo.querySelector('.ab-vacio');
      if (llegados.length) vacio?.remove();
      else if (!vacio) cuerpo.appendChild(el('p', 'ab-vacio', 'Todavía no sonó nada.'));
      return { todos, llegados };
    }

    // Cada aviso de lo que conviene, en todas sus formas.
    function todasLasDeConviene() {
      const c = (conviene) => ({ conviene });
      return [
        ['Comer antes de entrenar', [
          c({ que: 'antesDeEntrenar', comida: 'almuerzo', a: hm('13:00'), proteina: 40, carbohidratos: 75 }),
          c({ que: 'antesDeEntrenar', comida: 'merienda', a: hm('16:15'), adelantada: true, proteina: 25, carbohidratos: 75 }),
          c({ que: 'antesDeEntrenar', comida: 'snack', a: hm('10:00'), proteina: 25, carbohidratos: 75 }),
          c({ que: 'antesDeEntrenar', comida: 'desayuno', a: hm('7:30'), proteina: 40 }),
          c({ que: 'antesDeEntrenar', comida: 'almuerzo', a: hm('13:00') }),
        ]],
        ['Café', [
          c({ que: 'cafe', forma: 'antes', a: hm('15:00'), faltan: 480 }),
          c({ que: 'cafe', forma: 'ultimo', a: hm('15:00') }),
          c({ que: 'cafe', forma: 'ultimoEntrenas', a: hm('15:00'), entreno: hm('20:30') }),
        ]],
        ['Después de entrenar', [
          c({ que: 'despuesDeEntrenar', comida: 'merienda', a: hm('17:30'), proteina: 40 }),
          c({ que: 'despuesDeEntrenar', a: hm('19:00'), proteina: 40 }),
          c({ que: 'despuesDeEntrenar', comida: 'cena', a: hm('20:30') }),
        ]],
        ['Última comida grande', [c({ que: 'ultimaComida', a: hm('20:00'), cama: hm('23:00') })]],
        ['Si entrenas tarde', [
          c({ que: 'entrenarTarde', a: hm('21:00'), entreno: hm('20:30'), cama: hm('23:00') }),
          c({ que: 'entrenarTarde', a: hm('21:00'), entreno: hm('21:15'), cama: hm('23:00'), suave: true }),
        ]],
        ['Bajar las luces', [c({ que: 'luces', cama: hm('23:00') })]],
        ['Según el deporte', [c({ que: 'partido' }), c({ que: 'carrera' })]],
        ['Recuperación (con Ascent vinculada)', [
          c({ que: 'recuperacion', porcentaje: 87, fuerte: true }),
          c({ que: 'recuperacion', porcentaje: 52, fuerte: false, dormido: 340 }),
          c({ que: 'recuperacion', porcentaje: 58, fuerte: false }),
        ]],
      ];
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
      const n = (aviso, plan) => {
        const x = { dia: DIA, minutos: 0, aviso: { id: 'x', minutos: 0, ...(aviso.conviene ? { tipo: aviso.conviene.que } : {}), ...aviso } };
        return { titulo: Avisos.tituloDelAviso(x, paraElTexto(plan)), texto: Avisos.textoDelAviso(x, paraElTexto(plan)) };
      };
      const grupos = [
        ...todasLasDeConviene().map(([nombre, avisos]) => [nombre, avisos.map((a) => n(a))]),
        ['Comidas', [
          ...['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'].map((comida) => n({ tipo: 'horario', comida })),
          n({ tipo: 'horario', comida: 'almuerzo' }, () => (en() ? 'grilled chicken, rice' : 'pollo a la plancha, arroz')),
          n({ tipo: 'comida', comida: 'merienda' }), n({ tipo: 'comida', comida: 'cena' }),
        ]],
        ['Si vas muy bajo en algo', todasLasFalta().map((falta) => n({ tipo: 'falta', falta }))],
        ['Hábitos', [n({ tipo: 'habito', habito: 'entrenar' }), n({ tipo: 'habito', habito: 'leer' }), n({ tipo: 'habito', habito: 'leer', mensaje: en() ? 'One chapter, phone in the other room' : 'Un capítulo, con el teléfono en otra habitación' })]],
        ['Pesarte', [n({ tipo: 'pesarse' }), n({ tipo: 'pesarse', control: true })]],
        ['La hora de dormir', [...Avisos.TEXTOS_DE_DORMIR, 'deuda'].map((cual) => n({ tipo: 'dormir', minutos: hm('23:00'), texto: cual, dormirA: hm('23:30'), despertarA: 24 * 60 + hm('7:30'), duerme: 480, deuda: 90 }))],
        ['La prueba', [{ titulo: 'Moss', texto: tx('recordatorios.pruebaTermina') }]],
      ];
      for (const [nombre, avisos] of grupos) {
        cuerpo.appendChild(el('h4', 'ab-grupo', nombre));
        for (const a of avisos) cuerpo.appendChild(tarjeta(a.titulo, a.texto, en() ? 'now' : 'ahora'));
      }
    }

    /** Lo que explica el día: cuántos suenan, el viaje y lo que no suena, y por qué. */
    function notaDelDia(todos) {
      const entreno = entrenoDe(s.dia);
      const faltas = todos.filter((n) => n.aviso.tipo === 'falta').length;
      const nota = [`${todos.length} avisos en todo el día${faltas ? `, ${faltas} de lo que falta` : ''}.`];
      const viaje = conDeporte() ? s.deporte.viaje : VIAJE;
      if (conDeporte()) nota.unshift(`${s.deporte.nombre}.`);
      if (entreno !== null) nota.push(viaje ? `Sales a las ${u.horaMin(entreno - viaje)} y empiezas a las ${u.horaMin(entreno)}: mientras vas, nada.` : `Empiezas a las ${u.horaMin(entreno)}, desde casa.`);
      // Lo del deporte suena a la hora del almuerzo y toma su lugar.
      const delDeporte = todos.filter((x) => x.aviso.tipo === 'partido' || x.aviso.tipo === 'carrera');
      if (delDeporte.length) nota.push(`${delDeporte.map((x) => `«${titulo(x)}»`).join(' y ')}, a la hora del almuerzo, en lugar de «Hora del almuerzo».`);
      else if (conDeporte()) nota.push('Este día, nada del deporte en la pantalla bloqueada: lo de hoy está en Inicio y en Sueño.');
      const sinTope = linea(99);
      const nombre = (x) => (x.aviso.conviene ? titulo(x) : texto(x));
      const fuera = sinTope.filter((x) => x.aviso.tipo !== 'falta' && !todos.some((m) => m.aviso.id === x.aviso.id)).map((x) => `«${nombre(x)}»`);
      if (fuera.length) nota.push(`${fuera.join(' y ')} no ${fuera.length > 1 ? 'entran' : 'entra'}: como mucho, ${MAXIMO} por día.`);
      if (s.otraHora && entreno !== null) nota.push('Entrenaste a la mañana: lo de entrenar no suena.');
      if (s.cenaTemprano) nota.push('Cenaste a las 19:00: lo de la última comida ya no suena.');
      return nota.join(' ');
    }

    function pintar() {
      const scrollAntes = raiz.querySelector('.ab-lista')?.scrollTop ?? 0;
      const listaDeAntes = s.modo === 'dia' ? raiz.querySelector('.ab-lista') : null;
      raiz.replaceChildren();
      const cab = el('header', 'ab-cab');
      cab.appendChild(boton('ab-cerrar', '×', cerrar));
      const seg = el('div', 'ab-seg');
      for (const [modo, nombre] of [['dia', 'Un día'], ['todos', 'Todos']]) {
        // La lista de un modo no sirve para el otro: se arma de nuevo.
        const b = boton('', nombre, () => { if (s.modo === modo) return; s.modo = modo; enPantalla.clear(); raiz.querySelector('.ab-lista')?.remove(); pintar(); });
        b.setAttribute('aria-pressed', String(s.modo === modo));
        seg.appendChild(b);
      }
      const idioma = el('div', 'ab-seg');
      for (const [codigo, nombre] of [['es', 'ES'], ['en', 'EN']]) {
        const b = boton('', nombre, () => { s.idioma = codigo; pintar(); });
        b.setAttribute('aria-pressed', String((s.idioma || opciones.idioma()) === codigo));
        idioma.appendChild(b);
      }
      cab.append(seg, idioma);
      raiz.appendChild(cab);

      const reloj = el('div', 'ab-reloj' + (s.modo === 'todos' ? ' fuera' : ''));
      reloj.append(el('span', null, u.fechaLarga(s.modo === 'dia' ? diaDe() : DIA).replace(/^./, (c) => c.toUpperCase())), el('b', null, u.horaMin(s.hora)));
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
      const { todos, llegados } = pintarDia(cuerpo);

      const panel = el('div', 'ab-panel');
      const dias = el('div', 'ab-seg');
      // «Deporte», solo con un día de ejemplo de «Según el deporte» elegido; con él, las horas solas, así entran en
      // una fila.
      const corto = { tarde: '16:00', noche: '20:30' };
      for (const [clave, largo] of DIAS.filter(([c]) => c !== 'deporte' || s.deporte)) {
        const nombre = s.deporte && corto[clave] ? corto[clave] : largo;
        const b = boton('', nombre, () => { if (s.dia !== clave) { s.dia = clave; pintar(); } });
        b.setAttribute('aria-pressed', String(s.dia === clave));
        dias.appendChild(b);
      }
      panel.appendChild(dias);
      const hora = el('div', 'ab-hora');
      const rango = el('input');
      Object.assign(rango, { type: 'range', min: hm('6:00'), max: 24 * 60 + 30, step: 5, value: s.hora });
      rango.setAttribute('aria-label', 'La hora del día');
      hora.appendChild(rango);
      const proximo = () => todos.find((n) => n.minutos > s.hora);
      const siguiente = boton('ab-siguiente', 'Siguiente ›', () => { const p = proximo(); if (p) { s.hora = p.minutos; pintar(); } });
      siguiente.disabled = !proximo();
      // Mientras se arrastra cambian solo el reloj, la lista y «Siguiente»: rearmar el panel cortaría el gesto.
      rango.addEventListener('input', () => {
        s.hora = Number(rango.value);
        reloj.querySelector('b').textContent = u.horaMin(s.hora);
        if (pintarDia(cuerpo).llegados.length) cuerpo.scrollTop = 0;
        siguiente.disabled = !proximo();
      });
      hora.appendChild(siguiente);
      panel.appendChild(hora);
      const chips = el('div', 'ab-chips');
      for (const [clave, nombre] of [['otraHora', 'Ya entrené'], ['cenaTemprano', 'Cené temprano'], ['pocaProteina', 'Poca proteína']]) {
        const c = boton('ab-chip', nombre, () => { s[clave] = !s[clave]; pintar(); });
        c.setAttribute('aria-pressed', String(s[clave]));
        chips.appendChild(c);
      }
      panel.appendChild(chips);
      panel.appendChild(el('p', 'ab-nota', notaDelDia(todos)));
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
      /** El día de ejemplo de «Según el deporte» (Deporte.paraBloqueo), o null; abierta, se ve enseguida. */
      ponerDeporte(d) {
        s.deporte = d || null;
        if (s.dia === 'deporte' && !s.deporte) s.dia = 'tarde';
        if (raiz.hidden) return;
        enPantalla.clear();
        raiz.querySelector('.ab-lista')?.remove();
        pintar();
      },
      // Para las capturas: { modo, hora, idioma, dia, otraHora, cenaTemprano, pocaProteina, abajo, deporte }. `abajo`
      // es cuánto bajar la lista, o el nombre de un grupo de «Todos» para llevarlo arriba. `deporte`: el día de
      // ejemplo de «Según el deporte» (Deporte.paraBloqueo), o null para sacarlo.
      poner(p) {
        Object.assign(s, p);
        if (s.dia === 'deporte' && !s.deporte) s.dia = 'tarde';
        if (p.modo || p.idioma || p.dia || 'deporte' in p) { enPantalla.clear(); raiz.querySelector('.ab-lista')?.remove(); }
        pintar();
        const l = raiz.querySelector('.ab-lista');
        if (!l || p.abajo === undefined) return;
        const grupo = typeof p.abajo === 'string' ? [...l.querySelectorAll('.ab-grupo')].find((g) => g.textContent === p.abajo) : null;
        l.scrollTop = grupo ? grupo.offsetTop - l.offsetTop - 4 : Number(p.abajo) || 0;
      },
    };
  }
  return { crear };
})();
