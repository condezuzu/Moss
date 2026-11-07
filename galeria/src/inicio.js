// Inicio: lo primero que se ve, hecho de bloques que cada uno elige y ordena (spec/especificacion.md,
// cambio 9). De fábrica: las calorías y los macros que quedan, el progreso al objetivo, el peso con
// el balance, el día en el cielo y, al final, «Para hoy» (los comentarios cortos de la comida, que
// reemplazan al saludo de arriba desde el 2/11/2026). El sueño de anoche y el agua están para
// sumarlos. Cuando el control está cerca, va debajo de la luna. Tocar un bloque lleva a su sección.
// Con un día de ejemplo de «Según el deporte» (deporte.js, para aprobar): la fecha de ese día, «Para hoy» con
// lo del deporte primero (SegunElDeporte y ParaHoy) y, si toca, la tarjeta de la energía baja debajo de la luna.

const SeccionInicio = (() => {
  const BLOQUES = ['calorias', 'objetivo', 'peso', 'cielo', 'sueno', 'agua', 'consejos'];
  const DE_FABRICA = ['calorias', 'objetivo', 'peso', 'cielo', 'consejos'];
  // El control se muestra en Inicio desde dos días antes (lo pediste el 2/11/2026).
  const CONTROL_CERCA = 2;
  // Lo elegido queda en este navegador, como quedaría en el teléfono.
  const GUARDADO = 'moss-galeria-inicio';

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, conSigno, el, boton, icono } = u;
    // `primerDia`: recién instalada, sin nada anotado (la maqueta del 29/10/2026).
    const s = { orden: [...BLOQUES], visibles: new Set(DE_FABRICA), primerDia: false };
    try {
      const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
      if (g && Array.isArray(g.orden)) {
        s.orden = [...g.orden.filter((b) => BLOQUES.includes(b)), ...BLOQUES.filter((b) => !g.orden.includes(b))];
        // Un bloque nuevo de fábrica aparece aunque haya algo guardado de antes.
        s.visibles = new Set([...g.visibles, ...DE_FABRICA.filter((b) => !g.orden.includes(b))]);
      }
    } catch (_) { /* sin guardado, lo de fábrica */ }
    // «Para hoy» de ejemplo, para las capturas: null es el día de la galería.
    s.ejemplo = null;
    const guardar = () => { try { localStorage.setItem(GUARDADO, JSON.stringify({ orden: s.orden, visibles: [...s.visibles] })); } catch (_) { /* no pasa nada */ } };

    const zona = el('section', 'inicio pagina-app');
    zona.innerHTML = '<div class="in-scroll"><header class="in-cab"><div class="in-fecha"></div><h2 class="in-titulo"></h2><button type="button" class="in-energia-boton" hidden></button></header><div class="in-bloques"></div><div class="in-pie"></div><div class="in-suelo"></div></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const bloquesEl = zona.querySelector('.in-bloques');
    // El aviso con «Deshacer» de Comida, también acá (lo del agua).
    const avisar = Detalles.aviso(zona, tx);
    // La figura de las kcal, en el estilo elegido (kcal.js). Se rehace solo al cambiar de estilo, así
    // anima de lo que mostraba a lo nuevo.
    let figura = null;
    let estiloDeLaFigura = null;
    const figuraDeKcal = () => {
      if (estiloDeLaFigura !== Kcal.estilo) {
        figura = Kcal.grande((n) => tx('comida.porcentaje', { n: numero(n) }));
        estiloDeLaFigura = Kcal.estilo;
      }
      return figura;
    };

    // `irA`: la sección a la que lleva, o qué hace al tocarlo.
    const carta = (clase, titulo, irA) => {
      const c = el('article', 'in-bloque ' + clase);
      if (irA != null) {
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.addEventListener('click', () => (typeof irA === 'function' ? irA() : opciones.ir(irA)));
      }
      if (titulo) {
        const cab = el('header', 'in-bloque-cab');
        cab.appendChild(el('span', 'in-bloque-titulo', titulo));
        c.appendChild(cab);
      }
      return c;
    };

    // Lo que quedaba la última vez que se pintó: al anotar, la cifra cuenta desde ahí (como la de
    // Comida, y la de la app: src/secciones/animados.tsx). Con Reducir movimiento, va directo.
    let quedaAntes = null;
    const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function cifraQueCuenta(hasta) {
      const b = el('b', null, numero(quedaAntes == null || quieto() ? hasta : quedaAntes));
      const desde = quedaAntes;
      quedaAntes = hasta;
      if (desde == null || desde === hasta || quieto()) return b;
      const t0 = performance.now();
      const paso = (ahora) => {
        const k = Math.min(1, (ahora - t0) / 480);
        b.textContent = numero(Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 3))));
        if (k < 1 && b.isConnected) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
      return b;
    }

    // Cada barra arranca donde estaba la vez anterior (al sumar un vaso, los macros no vuelven a cero)
    // y la primera vez, de cero: como en la app, que se llena al aparecer y después solo se corre.
    const anchosAntes = new Map();
    function llenar(nodo, clave, valor, prop = 'width') {
      const antes = anchosAntes.get(clave + prop);
      if (antes != null) nodo.style[prop] = antes;
      anchosAntes.set(clave + prop, valor);
      requestAnimationFrame(() => { nodo.style[prop] = valor; });
    }

    // ------------------------------------------------------------ calorías y macros: lo que queda
    function calorias(ms) {
      const c = carta('in-calorias', null, abrirTodo);
      const meta = opciones.comida.meta;
      const t = opciones.comida.totalDe(0);
      const queda = meta.kcal - t.kcal;
      const f = figuraDeKcal();
      c.classList.add('con-' + Kcal.estilo);
      const arriba = el('div', 'in-cal-arriba');
      const cifra = el('div', 'in-cal-cifra');
      cifra.append(el('span', 'in-cal-etq', tx(queda >= 0 ? 'inicio.teQuedan' : 'inicio.deMas')), cifraQueCuenta(Math.abs(Math.round(queda))),
        el('small', null, tx('inicio.kcalDe', { comido: numero(Math.round(t.kcal)), meta: numero(meta.kcal) })));
      // La barra va debajo de la cifra; las otras, al lado o alrededor.
      if (Kcal.estilo === 'barra') arriba.append(cifra, f.el);
      else arriba.append(f.el, cifra);
      f.ir(t.kcal / meta.kcal, ms, opciones.comida.porComida(0), { p: t.p / meta.p, c: t.c / meta.c, g: t.g / meta.g });
      const macros = el('div', 'in-macros');
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => {
        const estado = Metas.estadoDeMacro(t[m], meta[m]);
        const x = el('div', `in-macro in-macro-${m} ${estado}`);
        const resto = meta[m] - t[m];
        const valor = estado === 'falta' ? tx('inicio.gramos', { n: numero(Math.round(resto)) })
          : estado === 'pasado' ? tx('inicio.gramos', { n: '+' + numero(Math.round(-resto)) }) : tx('inicio.listo');
        const barra = el('i', 'in-macro-barra');
        const relleno = el('i');
        barra.appendChild(relleno);
        // Lo comido y la meta siempre a la vista: también al pasarse.
        x.append(el('span', 'in-macro-nombre', tx('comida.' + clave)), el('b', null, valor), barra, el('small', null, tx('comida.gramosDe', { n: numero(Math.round(t[m])), meta: numero(meta[m]) })));
        llenar(relleno, 'macro-' + m, `${Math.min(100, (t[m] / meta[m]) * 100).toFixed(1)}%`);
        macros.appendChild(x);
      });
      c.append(arriba, macros);
      Util.caber([...macros.querySelectorAll('.in-macro-nombre')], 12);
      return c;
    }

    // ------------------------------------------------------------ el progreso al objetivo
    function objetivo() {
      const d = opciones.persona();
      const p = d.progreso;
      const c = carta('in-objetivo', tx('inicio.bloques.objetivo'), 2);
      c.querySelector('header').appendChild(el('em', 'in-estado ' + p.estado, tx('progreso.estados.' + p.estado)));
      const fila = el('div', 'in-obj-fila');
      const metaKg = d.perfil.pesoMeta;
      if (p.fecha) fila.append(el('b', null, u.fechaCorta(p.fecha)), el('span', null, tx('inicio.llegarias', { kg: numero(metaKg, metaKg % 1 ? 1 : 0), unidad: 'kg' })));
      else if (p.estado === 'llegaste') fila.append(el('b', null, `${numero(metaKg, metaKg % 1 ? 1 : 0)} kg`), el('span', null, tx('inicio.yaLlegaste')));
      else fila.append(el('b', null, p.peso == null ? '—' : `${numero(p.peso, 1)} kg`), el('span', null, tx('inicio.tendencia')));
      c.appendChild(fila);
      if (p.hecho != null) c.appendChild(barraDelCamino(d.pesoInicial, p.peso, metaKg, p.hecho));
      return c;
    }

    // La barra del camino: de dónde se empezó a la meta, con el peso de hoy marcado.
    function barraDelCamino(desde, ahora, hasta, hecho) {
      const b = el('div', 'in-camino');
      const pista = el('div', 'in-camino-pista');
      const relleno = el('i');
      const marca = el('span', 'in-camino-marca');
      pista.append(relleno, marca);
      const pct = (hecho * 100).toFixed(1) + '%';
      llenar(relleno, 'camino', pct);
      llenar(marca, 'camino', pct, 'left');
      const etiquetas = el('div', 'in-camino-etq');
      etiquetas.append(el('span', null, numero(desde, 1)), el('span', 'ahora', numero(ahora, 1)), el('span', null, numero(hasta, hasta % 1 ? 1 : 0)));
      b.append(pista, etiquetas);
      return b;
    }

    // ------------------------------------------------------------ el peso y el balance
    function peso() {
      const d = opciones.persona();
      const c = carta('in-peso', tx('inicio.bloques.peso'), 2);
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, d.pesoHoy == null ? '—' : numero(d.pesoHoy, 1)), el('small', null, ' kg'));
      izq.append(cifra, el('span', null, d.cambio7 == null ? tx('inicio.tendencia') : tx('inicio.enSieteDias', { n: conSigno(d.cambio7, 1), unidad: 'kg' })));
      fila.append(izq, Graficos.linea(d.serie30, { clase: 'in-chispa', ancho: 150, alto: 44 }));
      const fila2 = el('div', 'in-fila');
      const izq2 = el('div', 'in-dato');
      const cifra2 = el('div', 'in-dato-cifra');
      const bal = d.balance.promedio;
      cifra2.append(el('b', null, bal == null ? '—' : conSigno(Math.round(bal))), el('small', null, ' ' + tx('inicio.kcalPorDia')));
      // Sin días todavía, solo lo que falta: una raya y «kcal por día» no dicen nada.
      if (d.balance.dias.length) izq2.append(cifra2, el('span', null, u.plural('inicio.balanceCorto', d.balance.dias.length)));
      else izq2.append(el('span', null, tx('progreso.sinBalance')));
      fila2.append(izq2, Graficos.balance(d.balance.dias, d.gasto, { ancho: 150, alto: 44 }));
      c.append(fila, fila2);
      return c;
    }

    // ------------------------------------------------------------ el día en el cielo
    // La constelación de hoy en chico, con lo encendido: lo que llega de Salud está en Sueño y en Hábitos.
    function cielo() {
      const { constelacion, habitos } = opciones.cielo();
      const c = carta('in-cielo', tx('inicio.bloques.cielo'), 4);
      // Un día sin hábitos que toquen (6/11, para aprobar): lo dice, chico, en vez de la constelación.
      if (!habitos.length) { c.appendChild(el('p', 'in-nota', tx('cielo.sinHabitosHoy'))); return c; }
      const hechos = habitos.filter((h) => h.encendido).length;
      c.querySelector('header').appendChild(el('em', 'in-cuenta', tx('inicio.encendidas', { n: hechos, total: habitos.length })));
      const lienzo = el('canvas', 'in-mini-cielo');
      c.appendChild(lienzo);
      requestAnimationFrame(() => dibujarConstelacion(lienzo, constelacion, habitos));
      return c;
    }

    function dibujarConstelacion(lienzo, c, habitos) {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const W = lienzo.clientWidth || 300, H = lienzo.clientHeight || 120;
      lienzo.width = Math.round(W * dpr);
      lienzo.height = Math.round(H * dpr);
      const ctx = lienzo.getContext('2d');
      ctx.scale(dpr, dpr);
      const plano = Escena.proyectar(c.estrellas);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const esc = Math.min((W - 60) / Math.max(x1 - x0, 1e-6), (H - 30) / Math.max(y1 - y0, 1e-6));
      const pos = plano.map(([x, y]) => [W / 2 + (x - (x0 + x1) / 2) * esc, H / 2 - (y - (y0 + y1) / 2) * esc]);
      // Unas estrellas de fondo, quietas.
      const r = Datos.azar(17);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(239, 230, 207, ${(0.08 + r() * 0.22).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(r() * W, r() * H, 0.3 + r() * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      const completo = habitos.every((h) => h.encendido);
      ctx.lineCap = 'round';
      ctx.strokeStyle = completo ? 'rgba(232, 196, 106, 0.7)' : 'rgba(232, 196, 106, 0.22)';
      ctx.lineWidth = 1;
      c.lineas.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); ctx.stroke(); });
      c.estrellas.forEach((st, i) => {
        const h = habitos[i];
        const encendida = h && h.encendido;
        const radio = Math.max(1.4, Math.min(3.4, 3.2 - 0.45 * st.mag));
        if (encendida) {
          const g = ctx.createRadialGradient(pos[i][0], pos[i][1], 0, pos[i][0], pos[i][1], radio * 5);
          g.addColorStop(0, 'rgba(246, 227, 166, 0.55)');
          g.addColorStop(1, 'rgba(246, 227, 166, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbf2d9';
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(239, 230, 207, 0.4)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio + 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // ------------------------------------------------------------ el sueño de anoche
    function sueno() {
      const n = opciones.sueno();
      const c = carta('in-sueno', tx('inicio.bloques.sueno'), 3);
      if (!n) { c.appendChild(el('p', 'in-nota', tx('sueno.sinNoche'))); return c; }
      if (n.calidad != null) c.querySelector('header').appendChild(el('em', 'in-cuenta', tx('inicio.calidad', { n: n.calidad })));
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, u.duracion(n.dormido)));
      izq.append(cifra, el('span', null, tx('inicio.horario', { desde: u.horaMin(n.dormirse), hasta: u.horaMin(n.despertar) })));
      fila.append(izq, Graficos.hipnograma(n, { ancho: 150, alto: 44 }));
      c.appendChild(fila);
      return c;
    }

    // ------------------------------------------------------------ el agua
    let vasosAntes = null;
    function agua() {
      const a = opciones.comida.agua();
      const c = carta('in-agua', tx('inicio.bloques.agua'));
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, Porciones.decimal(a.litros, u.idioma())), el('small', null, ' ' + tx('inicio.deLitros', { meta: Porciones.decimal(a.meta, u.idioma()) })));
      izq.appendChild(cifra);
      const vasos = el('div', 'in-vasos');
      // El que se acaba de sumar se llena con un fundido, y el que se quitó se vacía; los demás ya estaban.
      for (let i = 0; i < Math.max(a.vasosMeta, a.vasos); i++) {
        vasos.appendChild(el('i', i < a.vasos ? (vasosAntes != null && i >= vasosAntes ? 'lleno nuevo' : 'lleno') : vasosAntes != null && i < vasosAntes ? 'sale' : null));
      }
      vasosAntes = a.vasos;
      const mas = boton('in-agua-mas', icono('mas'), () => { opciones.comida.sumarAgua(); }, tx('mas.sumarVaso'));
      mas.setAttribute('aria-description', tx('mas.mantenerParaQuitar'));
      fila.append(izq, vasos, mas);
      // Restar un vaso (6/11, para aprobar): mantener apretado el agua quita el último de hoy, con «Deshacer».
      Detalles.mantener(fila, {
        alMantener: () => {
          if (!opciones.comida.agua().vasos) return;
          opciones.comida.quitarAgua();
          if (opciones.haptico) opciones.haptico('toque');
          avisar(tx('mas.vasoQuitado'), () => opciones.comida.sumarAgua());
        },
      });
      c.appendChild(fila);
      return c;
    }

    // ------------------------------------------------------------ para hoy
    // Al final de Inicio (lo pediste el 2/11/2026), en vez del saludo de arriba: hasta tres comentarios
    // cortos de la comida, una idea cada uno (ParaHoy.paraHoy, la regla de la app). Sin nada que decir,
    // una línea tranquila. La hora de dormir y lo de entrenar van en los avisos.
    const EJEMPLOS_PARA_HOY = {
      mediodia: { ahora: 14 * 60 + 30, comido: { kcal: 480, proteina: 22, carbohidratos: 70, grasas: 14 }, sinAnotar: ['almuerzo'], anotadas: 1, proxima: 'merienda' },
      tarde: { ahora: 17 * 60 + 40, comido: { kcal: 1250, proteina: 110, carbohidratos: 95, grasas: 38 }, sinAnotar: [], anotadas: 3, proxima: 'cena', agua: { ml: 750, meta: 2000 } },
      nada: { ahora: 15 * 60, comido: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 }, sinAnotar: ['desayuno', 'almuerzo'], anotadas: 0, proxima: 'merienda' },
      bien: { ahora: 20 * 60, comido: { kcal: 2050, proteina: 135, carbohidratos: 250, grasas: 62 }, sinAnotar: [], anotadas: 3, proxima: 'cena', agua: { ml: 1750, meta: 2000 } },
    };
    // Un día de ejemplo de «Según el deporte» (deporte.js): su día, «Para hoy» con lo del deporte y la tarjeta.
    const delDeporte = () => (opciones.deporte ? opciones.deporte() : null);
    function entradaDeParaHoy() {
      const meta = opciones.comida.meta;
      const metaDeHoy = { kcal: meta.kcal, proteina: meta.p, carbohidratos: meta.c, grasas: meta.g };
      const sinDeficit = !!(opciones.sinDeficit && opciones.sinDeficit());
      const deporte = delDeporte();
      if (deporte) return Object.assign({ sinDeficit }, deporte.paraHoy);
      if (s.ejemplo) return Object.assign({ meta: metaDeHoy, agua: null, sinDeficit }, EJEMPLOS_PARA_HOY[s.ejemplo]);
      const t = opciones.comida.totalDe(0);
      const agua = opciones.comida.agua();
      const ahora = Datos.AHORA_MIN;
      return {
        ahora, meta: metaDeHoy, sinDeficit,
        comido: { kcal: t.kcal, proteina: t.p, carbohidratos: t.c, grasas: t.g },
        sinAnotar: opciones.comida.sinAnotar(),
        anotadas: new Set(opciones.comida.comidasDeHoy().map((c) => c.tipo)).size,
        proxima: Comidas.CON_HORA.find((c) => Comidas.HORA_TIPICA[c] > ahora) || null,
        agua: agua.vasos > 0 ? { ml: agua.litros * 1000, meta: agua.meta * 1000 } : null,
      };
    }
    const ICONO_DEL_CONSEJO = { anotar: 'comida', nadaAnotado: 'comida', pocosCarbohidratos: 'rayo', pocaProteina: 'rayo', muchaGrasa: 'rayo', faltaProteina: 'rayo', agua: 'gota' };
    const MACRO_DEL_CONSEJO = { pocosCarbohidratos: 'c', pocaProteina: 'p', muchaGrasa: 'g', faltaProteina: 'p' };
    // Lo del deporte, por su tema: los carbohidratos con el color de los carbohidratos, el agua como el agua.
    const ICONO_DEL_TEMA = { carbohidratos: 'rayo', agua: 'gota', alcohol: 'sueno', piernas: 'huellas', minerales: 'comida' };
    const paraElTexto = () => ({ t: tx, numero });
    function textoDelConsejo(x, sinNumeros) {
      if (x.tipo === 'deporte') return SegunElDeporte.textoDelDeporte(x.consejo, paraElTexto());
      const en = tx('inicio.paraHoy.en.' + (x.proxima || 'resto'));
      if (x.tipo === 'anotar') {
        const nombres = x.comidas.map((c) => tx('inicio.paraHoy.comidas.' + c));
        const ni = u.idioma() === 'es' ? ' ni ' : ' or ';
        return tx('inicio.paraHoy.anotar', { comidas: nombres.length < 2 ? nombres[0] : `${nombres.slice(0, -1).join(', ')}${ni}${nombres[nombres.length - 1]}` });
      }
      if (x.tipo === 'faltaProteina') return tx(sinNumeros ? 'inicio.paraHoy.faltaProteinaSinNumeros' : 'inicio.paraHoy.faltaProteina', { g: numero(x.gramos), en });
      if (x.tipo === 'agua') return tx(sinNumeros ? 'inicio.paraHoy.aguaSinNumeros' : 'inicio.paraHoy.agua', { n: x.vasos });
      return tx('inicio.paraHoy.' + x.tipo, { en });
    }
    function consejos() {
      const c = carta('in-consejos', tx('inicio.bloques.consejos'));
      const e = entradaDeParaHoy();
      const lista = ParaHoy.paraHoy(e);
      const sinNumeros = tel.classList.contains('sin-numeros');
      if (!lista.length) {
        c.appendChild(el('p', 'in-consejo-nada', tx(e.anotadas ? 'inicio.paraHoy.bien' : 'inicio.paraHoy.todaviaNada')));
        return c;
      }
      const ul = el('ul', 'in-consejos-lista');
      lista.forEach((x, i) => {
        const tema = x.tipo === 'deporte' ? x.consejo.tema : null;
        const clase = tema ? `in-consejo-deporte in-consejo-${x.consejo.que}${tema === 'carbohidratos' ? ' in-macro-c' : tema === 'agua' ? ' in-consejo-agua' : ''}`
          : 'in-consejo-' + x.tipo + (MACRO_DEL_CONSEJO[x.tipo] ? ' in-macro-' + MACRO_DEL_CONSEJO[x.tipo] : '');
        const li = el('li', 'in-consejo ' + clase);
        li.style.animationDelay = `${(0.06 * i).toFixed(2)}s`;
        const ico = el('span', 'in-consejo-ico');
        ico.innerHTML = icono(tema ? ICONO_DEL_TEMA[tema] : ICONO_DEL_CONSEJO[x.tipo]);
        li.append(ico, el('p', null, textoDelConsejo(x, sinNumeros)));
        // Lo que falta anotar se anota de ahí mismo, en esa comida.
        if (x.tipo === 'anotar' || x.tipo === 'nadaAnotado') {
          li.appendChild(boton('in-consejo-accion', tx('inicio.paraHoy.anotarBoton'), (ev) => {
            ev.stopPropagation();
            opciones.comida.abrirHoja({ comida: x.tipo === 'anotar' ? x.comidas[0] : Comidas.comidaDeLaHora(e.ahora) });
          }));
        }
        ul.appendChild(li);
      });
      c.appendChild(ul);
      return c;
    }

    // ------------------------------------------------------------ tu energía (5/11, para aprobar)
    // La de ahora, según la hora (Energia.energiaDeAhora): el sueño, la comida de estos días, lo de hoy contra lo que
    // sueles haber comido a esta hora (a la mañana no se juzga: todavía no es hora) y, con Ascent vinculada, los
    // músculos de hoy, con la regla del eslabón más débil. Lo que se dice cambia con el momento: al despertar, el día,
    // antes y después de entrenar, y la noche. Baja va arriba de todo, como advertencia; suficiente o alta, debajo de
    // los macros. Arriba, la batería, el título y una frase; la tira de tu día (las comidas, la sesión y ahora) y cada
    // parte con su estado. «Más» abre qué te conviene ahora y de dónde sale; se pliega en vez de «No mostrar más». Con
    // Ascent, lleva su marca: es lo que hace Moss con el vínculo, en Inicio para no tener que abrir Ascent cada vez.
    const PERSONA_DE_ENERGIA = { sexo: 'm', objetivo: 'bajar', pesoKg: 75, alturaCm: 178, grasaPct: 19.5 };
    const NECESIDAD_DE_ENERGIA = 8 * 60;
    const hm = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
    // El día de ejemplo: se despierta a las 7, se acuesta a las 23, entrena piernas de 18:40 a 19:55 (como en Ascent)
    // y come cuatro veces, con la parte del día de cada comida (Plan.REPARTO).
    const DIA_DE_ENERGIA = { despertar: hm('7:00'), cama: hm('23:00'), sesion: { inicio: hm('18:40'), minutos: 75 }, meta: 2600 };
    const HORAS_DE_ENERGIA = { desayuno: hm('7:30'), almuerzo: hm('13:00'), merienda: hm('17:00'), cena: hm('21:00') };
    const COMIDAS_DE_ENERGIA = Object.entries(HORAS_DE_ENERGIA).map(([c, hora]) => ({ comida: c, hora, parte: Plan.REPARTO[4][c] }));
    // Lo anotado hoy: un día como siempre, o uno sin desayuno y con poco almuerzo.
    const HOY_COMO_SIEMPRE = [['desayuno', '7:40', 520], ['almuerzo', '13:10', 900], ['merienda', '17:10', 390], ['cena', '21:05', 780]];
    const HOY_ATRASADO = [['almuerzo', '13:20', 600], ['cena', '21:10', 700]];
    // Los días de ejemplo: lo que queda por kg de masa magra después de entrenar, qué parte de la meta comió estos días,
    // lo dormido anoche, la deuda de las dos semanas y lo de hoy.
    const EJEMPLOS_DE_ENERGIA = {
      baja: { porKg: 33, llega: 1, dormido: 320, deuda: { minutos: 300, porNoche: 40 }, hoy: HOY_COMO_SIEMPRE },
      bajaComida: { porKg: 21, llega: 0.72, dormido: 455, deuda: { minutos: 60, porNoche: 8 }, hoy: HOY_COMO_SIEMPRE },
      atrasado: { porKg: 36, llega: 1, dormido: 470, deuda: { minutos: 30, porNoche: 4 }, hoy: HOY_ATRASADO },
      suficiente: { porKg: 33, llega: 0.84, dormido: 450, deuda: { minutos: 90, porNoche: 12 }, hoy: HOY_COMO_SIEMPRE },
      alta: { porKg: 36, llega: 1, dormido: 485, deuda: { minutos: 0, porNoche: -5 }, hoy: HOY_COMO_SIEMPRE },
      sinDatos: null,
    };
    // Los momentos para mirar la propuesta, con su hora.
    const HORAS_DE_LA_PROPUESTA = { manana: '7:30', mediodia: '14:30', antes: '17:15', despues: '20:30', noche: '22:00' };
    const ICONO_DE_PARTE = { sueno: 'sueno', comida: 'comida', hoy: 'reloj', musculos: 'pesa' };
    function energiaDeHoy(deporte) {
      const ascent = opciones.ascentDeHoy ? opciones.ascentDeHoy() : null;
      const ahora = hm(HORAS_DE_LA_PROPUESTA[s.energiaHora || 'mediodia']);
      // Con un día de ejemplo del deporte, la señal de su peso (la del rugby) manda en la comida.
      const ej = deporte && deporte.tarjeta ? EJEMPLOS_DE_ENERGIA.suficiente : EJEMPLOS_DE_ENERGIA[s.energia || 'suficiente'];
      if (!ej) return { dia: null, ej: null, ascent, comoMusculos: null, ahora, anotado: [] };
      const magra = Energia.masaMagraEstimada(PERSONA_DE_ENERGIA);
      const dias = Array.from({ length: 7 }, (_, i) => {
        const entreno = 450 + (i % 3) * 40;
        const kcal = ej.porKg * magra + entreno;
        return { dia: Fechas.sumarDias(Datos.HOY, -(i + 1)), kcal, entreno, anotadas: 3, meta: kcal / ej.llega };
      });
      const deEstosDias = Energia.energiaDeEstosDias({ ...PERSONA_DE_ENERGIA, hoy: Datos.HOY, entrenaHoy: true, dias: deporte && deporte.tarjeta ? [] : dias, senal: deporte && deporte.tarjeta ? deporte.tarjeta.senal : null });
      const sueno = {
        anoche: Rendimiento.estadoDeLaNoche({ dormido: ej.dormido, necesidad: NECESIDAD_DE_ENERGIA, despertoAntes: null }),
        seguidas: false,
        deuda: Sueno.juicioDeLaDeuda(ej.deuda),
      };
      // Lo anotado hasta ahora: cuánto y a qué hora lo último.
      const anotado = ej.hoy.map(([comida, hora, kcal]) => ({ comida, hora: hm(hora), kcal })).filter((x) => x.hora <= ahora);
      const hoy = { meta: DIA_DE_ENERGIA.meta, comido: anotado.reduce((t, x) => t + x.kcal, 0), comidas: COMIDAS_DE_ENERGIA, ultima: anotado.length ? Math.max(...anotado.map((x) => x.hora)) : null };
      // Con Ascent, el titular de hoy de su sección: lo que entrenas hoy, cargado o no; y, para decirlo, si ya
      // entrenaste o hoy descansas.
      const musculos = ascent ? (ascent.que === 'cargado' ? 'cargados' : 'listos') : null;
      const comoMusculos = ascent ? ({ cargado: 'cargados', hecha: 'entrenaste', descanso: 'descanso', sinHorario: 'descanso' }[ascent.que] || 'listos') : null;
      // La cama de esta noche es la de los avisos: con deuda, un poco antes que la de siempre.
      const cama = horasDeEstaNoche(ej).acostarse;
      // Moss sola habla de tu día; lo del gimnasio (la sesión, «para entrenar», sin llegar al fallo) es con Ascent.
      const dia = Energia.energiaDeAhora({ deEstosDias, sueno, musculos, entrenaHoy: !!ascent, ahora, despertar: DIA_DE_ENERGIA.despertar, cama, sesion: ascent ? DIA_DE_ENERGIA.sesion : null, hoy });
      return { dia, ej, ascent, comoMusculos, ahora, anotado, cama };
    }
    // La hora de ir a la cama esta noche, como la de los avisos (Avisos.horasDeSueno): se despierta a las 7 y se
    // acuesta a las 23, tarda un cuarto de hora en dormirse y pasa media hora despierto en la noche.
    const horasDeEstaNoche = (ej) => Avisos.horasDeSueno(Datos.HOY, { habitual: () => ({ dormirse: 5 * 60, despertar: 13 * 60 }), necesidad: NECESIDAD_DE_ENERGIA, deuda: ej ? ej.deuda.minutos : null, latencia: 15, despierto: 30 });
    function estaNoche(ej) {
      const h = horasDeEstaNoche(ej);
      return { hora: Avisos.horaDeReloj(h.acostarse), despertar: Avisos.horaDeReloj(h.despertarManana), cama: Avisos.horaDeReloj(h.acostarse) };
    }
    // La batería: una raya por nivel, la de baja con el color de «atención» (como las franjas de Ascent).
    const bateria = (estado) => {
      const n = { baja: 1, suficiente: 2, alta: 3 }[estado] || 0;
      return `<svg class="in-energia-bateria" viewBox="0 0 30 18" aria-hidden="true"><rect x="1" y="1.5" width="24" height="15" rx="3.5"/><path d="M27.5 6.5v5"/>${[0, 1, 2].map((k) => `<rect class="${k < n ? 'llena' : 'vacia'}" x="${4 + k * 6.8}" y="4.5" width="5" height="9" rx="1.4"/>`).join('')}</svg>`;
    };
    // Cuándo es, para la etiqueta: el momento, o la parte del día.
    function cuandoEs(e) {
      const m = e.dia ? e.dia.momento : null;
      if (m === 'recienDespierto') return 'alDespertar';
      if (m === 'antesDeEntrenar') return 'antes';
      if (m === 'despuesDeEntrenar') return 'despues';
      if (m === 'noche') return 'noche';
      return e.ahora < 12 * 60 ? 'manana' : e.ahora < 20 * 60 ? 'tarde' : 'noche';
    }
    const CLAVE_DEL_MOMENTO = { recienDespierto: 'manana', antesDeEntrenar: 'antes', despuesDeEntrenar: 'despues', noche: 'noche', dia: 'dia' };
    function fraseDeEnergia(e) {
      const en = e.dia;
      if (!en) return tx('inicio.energia.texto.sinDatos');
      const momento = CLAVE_DEL_MOMENTO[en.momento];
      const hora = en.sesion ? Avisos.horaDeReloj(en.sesion.inicio) : '';
      if (en.estado !== 'alta') {
        // De día y sin sesión cerca: lo de siempre (con Ascent y entrenando hoy, «para entrenar de forma normal»).
        if (momento === 'dia') return tx(en.estado === 'suficiente' && en.entrenaHoy ? 'inicio.energia.texto.suficienteEntrena' : 'inicio.energia.texto.' + en.estado);
        return tx(`inicio.energia.momento.${momento}.${en.estado}`, { hora, cama: estaNoche(e.ej).cama });
      }
      // Alta: por qué, de estos días y de anoche.
      const sueno = en.deuda === 'muyBien' || en.deuda === 'bien' ? en.deuda : 'soloAnoche';
      const comida = en.comida.como === 'deSobra' && e.ascent ? 'deSobraEntrena' : en.comida.como;
      const razones = { comida: tx('inicio.energia.razon.comida.' + comida), sueno: tx('inicio.energia.razon.sueno.' + sueno), hora };
      if (momento === 'dia') return tx(en.entrenaHoy ? 'inicio.energia.texto.altaEntrena' : 'inicio.energia.texto.alta', razones);
      return tx(`inicio.energia.momento.${momento}.alta`, razones);
    }
    // La tira de tu día: de despertarte a ir a la cama, con cada comida (anotada, pasada sin anotar o por venir), la
    // sesión y ahora. Se lee sin leer: lo que ya pasó, lo que falta y dónde estás.
    function tiraDelDia(e) {
      const D = { ...DIA_DE_ENERGIA, cama: e.cama };
      const x = (t) => `${(Math.min(1, Math.max(0, (t - D.despertar) / (D.cama - D.despertar))) * 100).toFixed(1)}%`;
      const caja = el('div', 'in-energia-dia');
      caja.setAttribute('aria-hidden', 'true');
      const curva = e.dia && e.dia.curva;
      if (curva) caja.appendChild(dibujoDeLaCurva(curva, x, e));
      const pista = el('div', 'pista');
      const hecho = el('i', 'hecho');
      hecho.style.width = x(e.ahora);
      pista.appendChild(hecho);
      // La sesión, solo con Ascent.
      if (e.dia && e.dia.sesion) {
        const s0 = e.dia.sesion.inicio, s1 = s0 + e.dia.sesion.minutos;
        const sesion = el('span', 'sesion' + (e.ahora >= s1 ? ' hecha' : ''));
        sesion.style.left = x(s0);
        sesion.style.width = `calc(${x(s1)} - ${x(s0)})`;
        pista.appendChild(sesion);
      }
      COMIDAS_DE_ENERGIA.forEach((c) => {
        const anotada = e.anotado.some((a) => a.comida === c.comida);
        const clase = anotada ? 'anotada' : e.ahora >= c.hora + Energia.DESPUES_DE_SU_HORA ? 'vencida' : 'futura';
        const punto = el('b', 'comida ' + clase);
        punto.style.left = x(c.hora);
        pista.appendChild(punto);
      });
      const ahora = el('em', 'ahora');
      ahora.style.left = x(e.ahora);
      pista.appendChild(ahora);
      const horas = el('div', 'horas');
      horas.append(el('span', null, Avisos.horaDeReloj(D.despertar)), el('span', 'ahora-hora', Avisos.horaDeReloj(e.ahora)), el('span', null, Avisos.horaDeReloj(D.cama)));
      // Cerca de los bordes, la hora de ahora va al costado de la rayita, hacia adentro (contra el borde parecía que
      // el día terminaba ahí), y la del borde se esconde solo si no entran las dos.
      const fr = Math.min(1, Math.max(0, (e.ahora - D.despertar) / (D.cama - D.despertar)));
      const etiqueta = horas.querySelector('.ahora-hora');
      etiqueta.style.left = x(e.ahora);
      if (fr < 0.14) { etiqueta.classList.add('a-la-derecha'); horas.firstChild.hidden = fr < 0.1; }
      else if (fr > 0.86) { etiqueta.classList.add('a-la-izquierda'); horas.lastChild.hidden = fr > 0.9; }
      caja.append(pista, horas);
      return caja;
    }
    // La curva de tu energía hoy (Energia.curvaDelDia), en el mismo eje que la tira: el mejor momento, el bajón y el
    // segundo pico, con su nombre, y dónde estás ahora. Se dibuja de izquierda a derecha al aparecer.
    function dibujoDeLaCurva(curva, x, e) {
      const W = 300, H = 56, base = 50;
      const D = curva.puntos[0].t, C = curva.puntos[curva.puntos.length - 1].t;
      const X = (t) => ((t - D) / (C - D)) * W;
      const Y = (n) => base - n * (base - 4);
      const linea = curva.puntos.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)} ${Y(p.nivel).toFixed(1)}`).join(' ');
      const caja = el('div', 'curva');
      caja.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="area" d="${linea} L${W} ${base} L0 ${base} Z"/><path class="linea" pathLength="1" d="${linea}"/></svg>`;
      // El nombre de cada tramo, sobre su centro.
      [['pico', 'pico'], ['bajon', 'bajon'], ['segundoPico', 'segundoPico']].forEach(([que, clave]) => {
        const t = curva.tramos.find((z) => z.que === que);
        if (!t) return;
        // «actual» y no «ahora»: esa clase ya es la rayita de la tira.
        const etq = el('span', 'tramo ' + que + (e.dia.tramo === que ? ' actual' : ''), tx('inicio.energia.curva.' + clave));
        etq.style.left = x((t.desde + t.hasta) / 2);
        caja.appendChild(etq);
      });
      // Dónde estás ahora, sobre la curva.
      const cerca = curva.puntos.reduce((a, p) => (Math.abs(p.t - e.ahora) < Math.abs(a.t - e.ahora) ? p : a), curva.puntos[0]);
      const punto = el('b', 'punto');
      punto.style.left = x(e.ahora);
      punto.style.top = `${((Y(cerca.nivel) / H) * 100).toFixed(1)}%`;
      caja.appendChild(punto);
      return caja;
    }
    // Las partes, de un vistazo: el ícono, el nombre y cómo está cada una.
    function partesDeEnergia(e) {
      const en = e.dia;
      const partes = [['sueno', en.sueno], ['comida', en.comida], ['hoy', en.hoy]];
      if (en.musculos) partes.push(['musculos', { parte: en.musculos === 'cargados' ? 'justa' : 'bien', como: e.comoMusculos || en.musculos }]);
      const fila = el('div', 'in-energia-partes' + (partes.length > 3 ? ' cuatro' : ''));
      partes.forEach(([k, p]) => {
        // Temprano, lo de hoy no se juzga: va sin color.
        const clase = !p ? 'sin' : k === 'hoy' && p.como === 'temprano' ? 'sin' : 'es-' + p.parte;
        const d = el('div', 'in-energia-parte ' + clase);
        d.innerHTML = `<span class="ico">${icono(ICONO_DE_PARTE[k])}</span>`;
        d.append(el('small', null, tx('inicio.energia.partes.' + k)), el('b', null, tx(`inicio.energia.como.${k}.${p ? p.como : 'sinDatos'}`)));
        fila.appendChild(d);
      });
      return fila;
    }
    // Qué te conviene ahora: primero lo que la baja, después lo que la frena y lo de la hora; si no, seguir así.
    function consejosDeEnergia(e) {
      const en = e.dia;
      const lista = [];
      const sueno = en.sueno;
      const noche = estaNoche(e.ej);
      const hora = en.sesion ? Avisos.horaDeReloj(en.sesion.inicio) : '';
      const conNumeros = !tel.classList.contains('sin-numeros') && !(opciones.sinDeficit && opciones.sinDeficit());
      if (en.hoy && en.hoy.como === 'sinComerParaEntrenar') lista.push(tx('inicio.energia.consejo.comerAntesYa', { hora }));
      if (sueno && (sueno.parte === 'baja' || sueno.como === 'algoCorta')) {
        // Con la noche corta, sin ir al fallo (Craven 2022; Knowles 2022): lo mismo que dice Ascent.
        if (sueno.parte === 'baja' && en.entrenaHoy && en.momento !== 'despuesDeEntrenar' && en.momento !== 'noche') lista.push(tx('inicio.energia.consejo.sinFallo'));
        lista.push(tx('inicio.energia.consejo.dormir', noche));
      } else if (sueno && sueno.como === 'deuda') lista.push(tx('inicio.energia.consejo.dormirDeuda', noche));
      if (en.comida && en.comida.parte === 'baja') lista.push(tx(e.ascent ? 'inicio.energia.consejo.comerMasEntrena' : 'inicio.energia.consejo.comerMas'));
      if (en.hoy && en.hoy.como === 'atrasado') lista.push(conNumeros ? tx('inicio.energia.consejo.atrasado', { kcal: numero(Math.round(en.hoy.falta / 10) * 10) }) : tx('inicio.energia.consejo.atrasadoSinNumeros'));
      if (en.comerAntes && !(en.hoy && en.hoy.como === 'sinComerParaEntrenar')) lista.push(tx('inicio.energia.consejo.comerAntes', { hora: Avisos.horaDeReloj(en.sesion.inicio - 60), sesion: hora }));
      if (en.comerDespues) lista.push(tx('inicio.energia.consejo.comerDespues'));
      if (en.musculos === 'cargados' && e.ascent) lista.push(e.ascent.texto);
      // Según el tramo de la curva, con sus horas: al despertar, cuándo llega el mejor momento.
      const tramo = (que) => (en.curva ? en.curva.tramos.find((t) => t.que === que) : null);
      en.notas.forEach((n) => {
        if (n === 'bajarElRitmo' && e.ahora >= e.cama) { lista.push(tx('inicio.energia.consejo.aLaCama')); return; }
        const t = tramo(n === 'inercia' ? 'pico' : n);
        lista.push(tx('inicio.energia.consejo.' + n, { ...noche, desde: t ? Avisos.horaDeReloj(t.desde) : '', hasta: t ? Avisos.horaDeReloj(t.hasta) : '' }));
      });
      if (!lista.length) lista.push(tx('inicio.energia.consejo.seguir'));
      return lista;
    }
    // De dónde sale: una línea por parte, con sus números si se ven.
    function detallesDeEnergia(e) {
      const en = e.dia;
      const ul = el('ul', 'in-energia-detalle');
      const fila = (k, parte, texto) => {
        const li = el('li', 'es-' + (parte || 'sin'));
        li.innerHTML = `<span class="ico">${icono(ICONO_DE_PARTE[k])}</span>`;
        li.appendChild(el('p', null, texto));
        ul.appendChild(li);
      };
      const conNumeros = !tel.classList.contains('sin-numeros') && !(opciones.sinDeficit && opciones.sinDeficit());
      const redondo = (x) => numero(Math.round(x / 10) * 10);
      // Sin Ascent, estos días contra tu meta, que ya trae lo que gastas entrenando: sin nombrar el gimnasio.
      const entrena = e.ascent ? 'Entrena' : '';
      fila('sueno', en.sueno && en.sueno.parte, e.ej ? tx('inicio.energia.detalle.sueno', { dormido: u.duracion(e.ej.dormido), deuda: en.deuda ? tx('inicio.energia.juicioDeuda.' + en.deuda) : '—' }) : tx('inicio.energia.detalle.suenoSinDatos'));
      const c = en.deEstosDias;
      const comida = !c ? tx('inicio.energia.detalle.comidaSinDatos')
        : c.porQue !== 'anotado' ? SegunElDeporte.tarjetaDeEnergia({ que: 'energiaBaja', donde: 'tarjeta', tema: 'energia', senal: c.porQue }, paraElTexto()).deQueSale
          : !conNumeros ? tx('inicio.energia.detalle.comidaSinNumeros' + entrena)
            : tx((c.meta ? 'inicio.energia.detalle.comida' : 'inicio.energia.detalle.comidaSinMeta') + entrena, { kcal: redondo(c.kcal), meta: c.meta ? redondo(c.meta) : '', entreno: redondo(c.entreno) });
      fila('comida', en.comida && en.comida.parte, comida);
      if (en.hoy) {
        const texto = en.hoy.como === 'temprano' ? tx('inicio.energia.detalle.hoyTemprano')
          : conNumeros ? tx('inicio.energia.detalle.hoy', { comido: redondo(en.hoy.comido), esperado: redondo(en.hoy.esperado) }) : tx('inicio.energia.detalle.hoySinNumeros');
        fila('hoy', en.hoy.como === 'temprano' ? null : en.hoy.parte, texto);
      }
      if (e.ascent && en.musculos) fila('musculos', en.musculos === 'cargados' ? 'justa' : 'bien', `${e.ascent.titulo}. ${e.ascent.texto}`);
      return ul;
    }
    // Tu energía, de un vistazo (lo pediste el 5/11, a la noche): un botón redondo arriba a la derecha de Inicio, con la
    // batería y cómo está, en todos los estados. Tocarlo abre ahí mismo un globo con lo básico, que crece desde el botón;
    // abajo, «Más en Sueño» se desliza a la tarjeta completa. Nada salta: el globo crece y se achica, y el viaje a Sueño
    // se desliza y baja suave.
    const botonDeEnergia = zona.querySelector('.in-energia-boton');
    botonDeEnergia.addEventListener('click', () => (globo ? cerrarGlobo() : abrirGlobo()));
    let globo = null;
    let velo = null;
    function abrirGlobo() {
      const e = energiaDeHoy(s.primerDia ? null : delDeporte());
      if (!e) return;
      const en = e.dia;
      const estado = en ? en.estado : 'sinDatos';
      velo = el('div', 'in-energia-velo');
      velo.addEventListener('click', () => cerrarGlobo());
      globo = el('div', 'in-energia-globo ' + estado);
      globo.setAttribute('role', 'dialog');
      globo.setAttribute('aria-label', tx('inicio.energia.boton.' + estado));
      // Debajo del botón, alineado a su derecha: de ahí crece.
      const z = zona.getBoundingClientRect(), b = botonDeEnergia.getBoundingClientRect();
      globo.style.top = `${(b.bottom - z.top + 6).toFixed(0)}px`;
      globo.style.right = `${(z.right - b.right).toFixed(0)}px`;
      const cab = el('div', 'in-energia-cab');
      const ico = el('span', 'in-energia-ico');
      ico.innerHTML = bateria(estado);
      const titulos = el('div', 'in-energia-titulos');
      titulos.append(el('span', 'in-energia-etq', tx('inicio.energia.etiqueta', { cuando: tx('inicio.energia.cuando.' + cuandoEs(e)) })), el('b', 'in-energia-titulo', tx('inicio.energia.titulo.' + estado)));
      const cerrar = boton('in-energia-cerrar', icono('cerrar'), () => cerrarGlobo(), tx('inicio.energia.cerrar'));
      cab.append(ico, titulos, cerrar);
      globo.append(cab, el('p', 'in-energia-texto', fraseDeEnergia(e)));
      if (en) globo.append(tiraDelDia(e), partesDeEnergia(e));
      const mas = boton('in-energia-globo-mas', `<span>${tx('inicio.energia.masEnSueno')}</span>${icono('adelante')}`, () => {
        cerrarGlobo();
        if (opciones.irAEnergia) opciones.irAEnergia();
      });
      globo.appendChild(mas);
      zona.append(velo, globo);
      botonDeEnergia.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => { velo.classList.add('abierto'); globo.classList.add('abierto'); });
      // Al mover Inicio, el globo se va: se quedaría colgado lejos del botón.
      zona.querySelector('.in-scroll').addEventListener('scroll', cerrarGlobo, { once: true });
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function cerrarGlobo() {
      if (!globo) return;
      const g = globo, v = velo;
      globo = null;
      velo = null;
      botonDeEnergia.setAttribute('aria-expanded', 'false');
      g.classList.remove('abierto');
      v.classList.remove('abierto');
      g.classList.add('saliendo');
      setTimeout(() => { g.remove(); v.remove(); }, quieto() ? 0 : 220);
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function pintarBotonDeEnergia(e) {
      if (!e) { botonDeEnergia.hidden = true; return; }
      const estado = e.dia ? e.dia.estado : 'sinDatos';
      // Debajo, por qué: lo que la baja o la frena; con todo bien, «Todo a favor».
      const por = !e.dia ? 'sinDatos' : estado === 'alta' ? 'todo' : e.dia.limita[0] || null;
      botonDeEnergia.hidden = false;
      botonDeEnergia.className = 'in-energia-boton ' + estado;
      botonDeEnergia.innerHTML = '';
      const textos = el('span', 'in-energia-boton-textos');
      textos.appendChild(el('b', null, tx('inicio.energia.boton.' + estado)));
      if (por) textos.appendChild(el('small', null, tx('inicio.energia.por.' + por)));
      const circulo = el('span', 'in-energia-boton-circulo');
      circulo.innerHTML = bateria(estado);
      botonDeEnergia.append(textos, circulo);
      botonDeEnergia.setAttribute('aria-label', `${tx('inicio.energia.boton.' + estado)}${por ? '. ' + tx('inicio.energia.por.' + por) : ''}. ${tx('inicio.energia.verEnSueno')}`);
    }
    function tarjetaDeEnergia(e) {
      const en = e.dia;
      const estado = en ? en.estado : 'sinDatos';
      const c = carta('in-energia in-energia-' + estado + (e.ascent ? ' con-ascent' : ''), null);
      c.classList.toggle('plegada', !!s.energiaPlegada);
      const cab = el('div', 'in-energia-cab');
      const ico = el('span', 'in-energia-ico');
      ico.innerHTML = bateria(estado);
      const titulos = el('div', 'in-energia-titulos');
      const etiqueta = el('span', 'in-energia-etq');
      etiqueta.appendChild(el('span', null, tx('inicio.energia.etiqueta', { cuando: tx('inicio.energia.cuando.' + cuandoEs(e)) })));
      if (e.ascent) etiqueta.appendChild(el('span', null, '· ' + tx('inicio.energia.conAscent')));
      // Con Ascent, su marca chica: la misma del ícono de Ascent.
      if (e.ascent && opciones.marcaDeAscent) etiqueta.insertAdjacentHTML('afterbegin', opciones.marcaDeAscent());
      titulos.append(etiqueta, el('b', 'in-energia-titulo', tx('inicio.energia.titulo.' + estado)));
      const plegar = boton('in-energia-plegar', icono('abajo'), () => {
        s.energiaPlegada = !s.energiaPlegada;
        c.classList.toggle('plegada', s.energiaPlegada);
        plegar.setAttribute('aria-expanded', String(!s.energiaPlegada));
      }, tx(s.energiaPlegada ? 'inicio.energia.desplegar' : 'inicio.energia.plegar'));
      plegar.setAttribute('aria-expanded', String(!s.energiaPlegada));
      cab.append(ico, titulos, plegar);
      const cuerpo = el('div', 'in-energia-cuerpo');
      const dentro = el('div', 'in-energia-dentro');
      dentro.appendChild(el('p', 'in-energia-texto', fraseDeEnergia(e)));
      if (en) {
        dentro.append(tiraDelDia(e), partesDeEnergia(e));
        const porque = el('div', 'in-energia-porque');
        const consejos = el('ul', 'in-energia-consejos');
        consejosDeEnergia(e).forEach((t) => consejos.appendChild(el('li', null, t)));
        porque.append(el('h4', null, tx('inicio.energia.conviene')), consejos);
        // Con la comida baja, cuándo hablarlo con alguien (el consenso del COI sobre REDs, 2023).
        if (en.comida && en.comida.parte === 'baja') porque.appendChild(el('p', 'in-energia-chico', tx(e.ascent ? 'inicio.energia.consejo.medicoEntrena' : 'inicio.energia.consejo.medico')));
        porque.append(el('h4', null, tx(en.musculos ? 'inicio.energia.deQueSale' : 'inicio.energia.deQueSaleSinEntreno')), detallesDeEnergia(e));
        // De qué días sale cada parte (lo preguntaste el 5/11): el sueño, de anoche y de dos semanas; la comida, de la
        // semana, porque un día malo no la baja; lo de hoy, de lo anotado hasta ahora.
        const cuando = el('ul', 'in-energia-cuando');
        ['sueno', 'comida', 'hoy', 'curva'].forEach((k) => cuando.appendChild(el('li', null, tx('inicio.energia.deCuando.' + k))));
        porque.append(el('h4', null, tx('inicio.energia.deCuando.titulo')), cuando, el('p', 'in-energia-chico', tx('inicio.energia.estimacion')));
        porque.hidden = !s.energiaMas;
        const mas = boton('in-energia-mas', `<span>${tx(s.energiaMas ? 'inicio.energia.menos' : 'inicio.energia.mas')}</span>`, () => {
          s.energiaMas = !s.energiaMas;
          mas.querySelector('span').textContent = tx(s.energiaMas ? 'inicio.energia.menos' : 'inicio.energia.mas');
          mas.setAttribute('aria-expanded', String(s.energiaMas));
          if (s.energiaMas) { porque.hidden = false; porque.classList.remove('entra', 'sale'); void porque.offsetWidth; porque.classList.add('entra'); } else {
            const quieto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
            porque.classList.remove('entra');
            porque.classList.add('sale');
            setTimeout(() => { if (!s.energiaMas) porque.hidden = true; porque.classList.remove('sale'); }, quieto ? 0 : 220);
          }
        });
        mas.setAttribute('aria-expanded', String(!!s.energiaMas));
        dentro.append(mas, porque);
      }
      cuerpo.appendChild(dentro);
      c.append(cab, cuerpo);
      return c;
    }

    // ------------------------------------------------------------ el control, cuando se acerca
    // Debajo de la luna, desde dos días antes (lo pediste el 2/11/2026): cuándo es y, si le falta algo,
    // qué, en una línea. Lleva a Progreso.
    function controlCerca() {
      const e = opciones.persona().estadoControl;
      if (!e || e.faltan > CONTROL_CERCA) return null;
      const c = carta('in-control', null, 2);
      const cuando = e.faltan === 1 ? tx('progreso.manana') : tx('progreso.enDias', { n: e.faltan });
      const titulo = e.faltan === 0 ? tx('inicio.control.hoy') : tx('inicio.control.titulo', { dia: tx('fecha.dias.' + Fechas.diaDeLaSemana(e.fecha)), cuando });
      const falta = e.pesadas < e.minimos.pesadas ? tx('inicio.control.faltaPesada')
        : e.diasConComida < e.minimos.diasConComida ? u.plural('inicio.control.faltanDias', e.minimos.diasConComida - e.diasConComida)
        : tx('inicio.control.listo');
      const textos = el('div', 'in-control-textos');
      textos.append(el('b', null, titulo), el('span', null, falta));
      const fila = el('div', 'in-control-fila');
      fila.innerHTML = icono('reloj');
      fila.appendChild(textos);
      fila.insertAdjacentHTML('beforeend', icono('adelante'));
      c.appendChild(fila);
      return c;
    }

    const ARMAR = { calorias, objetivo, peso, cielo, sueno, agua, consejos };

    // ------------------------------------------------------------ todo lo de hoy
    // Tocar la luna (lo pediste el 30/10/2026): lo de hoy con lo que falta, lo que Moss sabe de ti y de
    // dónde, lo que le falta y, abajo de todo, cómo lo estima. Saberlo da seguridad.
    const hojaTodo = Util.hoja(tel, 'in-todo', () => opciones.alCambiar());
    function abrirTodo() {
      pintarTodo();
      hojaTodo.abrir();
      opciones.alCambiar();
    }
    const enLista = (cosas) => {
      const y = u.idioma() === 'es' ? ' y ' : ' and ';
      return cosas.length < 2 ? cosas.join('') : `${cosas.slice(0, -1).join(', ')}${y}${cosas[cosas.length - 1]}`;
    };
    function filaDeHoy(nombre, comido, meta, unidad, clase) {
      const estado = Metas.estadoDeMacro(comido, meta);
      const resto = meta - comido;
      const fila = el('div', 'tt-fila ' + (clase || ''));
      const cuanto = (n) => `${numero(Math.round(n))}${unidad}`;
      fila.append(el('span', 'tt-nombre', nombre), el('b', null, cuanto(comido)), el('span', null, cuanto(meta)),
        el('em', estado, estado === 'falta' ? cuanto(resto) : estado === 'pasado' ? `+${cuanto(-resto)}` : '✓'));
      return fila;
    }
    function pintarTodo() {
      const h = hojaTodo.el;
      h.innerHTML = '';
      const d = opciones.persona();
      const p = d.perfil;
      const meta = opciones.comida.meta;
      const t = opciones.comida.totalDe(0);
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('inicio.todo.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaTodo.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'tt-cuerpo');

      // Arriba de todo, cómo ver las calorías (lo pediste el 2/11/2026): cada uno elige el suyo, y se
      // ve en Inicio y en Comida.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.estilo.titulo')));
      const estilos = el('div', 'tt-estilos');
      Kcal.ESTILOS.forEach((e) => {
        const b = boton('tt-estilo', '', () => { Kcal.poner(e); estilos.querySelectorAll('.tt-estilo').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.estilo === e))); });
        b.dataset.estilo = e;
        b.setAttribute('aria-pressed', String(e === Kcal.estilo));
        const muestra = el('span', 'tt-estilo-muestra');
        muestra.appendChild(Kcal.muestra(e));
        b.append(muestra, el('span', 'tt-estilo-nombre', tx('inicio.todo.estilo.' + e)));
        estilos.appendChild(b);
      });
      cuerpo.appendChild(estilos);

      // Hoy: lo comido, la meta y lo que falta o se pasó.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.hoy')));
      const tabla = el('div', 'tt-tabla');
      const cabeza = el('div', 'tt-fila tt-cabeza');
      cabeza.append(el('span'), el('span', null, tx('inicio.todo.comiste')), el('span', null, tx('inicio.todo.meta')), el('span', null, tx('inicio.todo.queda')));
      tabla.append(cabeza, filaDeHoy(tx('inicio.todo.calorias'), t.kcal, meta.kcal, '', 'tt-kcal'));
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => tabla.appendChild(filaDeHoy(tx('comida.' + clave), t[m], meta[m], ' g', 'tt-' + m)));
      cuerpo.appendChild(tabla);
      const macro = (m, clave, n) => tx('inicio.todo.deMacro', { n: numero(Math.round(n)), macro: tx('comida.' + clave).toLowerCase() });
      const macros = [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].map(([m, clave]) => ({ m, clave, estado: Metas.estadoDeMacro(t[m], meta[m]), resto: meta[m] - t[m] }));
      const faltan = macros.filter((x) => x.estado === 'falta').map((x) => macro(x.m, x.clave, x.resto));
      const pasados = macros.filter((x) => x.estado === 'pasado').map((x) => macro(x.m, x.clave, -x.resto));
      const frases = [];
      if (faltan.length) frases.push(tx('inicio.todo.teFaltan', { lista: enLista(faltan) }));
      if (pasados.length) frases.push(tx('inicio.todo.tePasaste', { lista: enLista(pasados) }));
      if (!faltan.length && !pasados.length) frases.push(tx('inicio.todo.llegaste'));
      const sinAnotar = opciones.comida.sinAnotar();
      if (sinAnotar.length) frases.push(tx('inicio.todo.sinAnotar', { lista: enLista(sinAnotar.map((c) => tx('comida.comidas.' + c).toLowerCase())) }));
      cuerpo.appendChild(el('p', 'tt-frase', frases.join(' ')));
      cuerpo.appendChild(boton('cm-enlace tt-enlace', `<span>${tx('inicio.todo.verComida')}</span>${icono('adelante')}`, () => { hojaTodo.cerrar(); opciones.ir(1); }));

      // Lo que Moss sabe de ti, y de dónde lo sacó.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.sabe')));
      const sabe = el('ul', 'pf-lista tt-sabe');
      const dato = (nombre, valor, origen) => {
        const li = el('li');
        const textos = el('div');
        textos.append(el('span', null, nombre), el('small', null, origen));
        li.append(textos, el('b', null, valor));
        sabe.appendChild(li);
      };
      const edad = Number(Datos.HOY.slice(0, 4)) - p.nacimiento;
      dato(tx('inicio.todo.peso'), `${numero(d.pesoHoy, 1)} kg`, tx('inicio.todo.origen.pesadas'));
      dato(tx('perfil.altura'), `${numero(p.alturaCm)} cm`, tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.edad'), numero(edad), tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.sexo'), tx(p.sexo === 'f' ? 'entrada.cuestionario.femenino' : 'entrada.cuestionario.masculino'), tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.actividad'), tx('entrada.cuestionario.actividad.' + p.actividad)[0], tx('inicio.todo.origen.dijiste'));
      const pct = p.objetivo === 'mantener' ? null : Math.abs(Metas.RITMOS[p.objetivo][p.ritmo]);
      dato(tx('progreso.objetivo'), p.objetivo === 'mantener' ? tx('progreso.objetivos.mantener') : tx('progreso.objetivoA.' + p.objetivo, { kg: numero(p.pesoMeta, p.pesoMeta % 1 ? 1 : 0) }), pct == null ? tx('inicio.todo.origen.elegiste') : tx('inicio.todo.origen.ritmo', { pct: numero(pct, 2) }));
      dato(tx('progreso.gasto'), `${numero(d.gasto)} ${tx('inicio.kcalPorDia')}`, tx('inicio.todo.origen.control', { fecha: u.fechaCorta(d.control.fecha) }));
      if (d.grasa) dato(tx('progreso.grasa'), tx('cuerpo.rango', { desde: d.grasa.desde, hasta: d.grasa.hasta }), tx('inicio.todo.origen.medidas'));
      const noche = opciones.sueno();
      if (noche) dato(tx('inicio.bloques.sueno'), u.duracion(noche.dormido), noche.fuente && noche.fuente.tipo !== 'moss' ? tx('inicio.todo.origen.aparato', { aparato: noche.fuente.nombre }) : tx('inicio.todo.origen.estimado'));
      cuerpo.appendChild(sabe);

      // Lo que le falta a Moss para estimar mejor (Progreso.faltaParaEstimar, la regla de la app).
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.falta')));
      const falta = Progreso.faltaParaEstimar({ control: d.estadoControl, objetivo: p.objetivo, pesoMeta: p.pesoMeta, conMedidas: !!d.grasa, sinReloj: opciones.sinReloj() });
      if (falta.length) {
        const lista = el('ul', 'tt-falta');
        falta.forEach((x) => {
          const texto = x.fecha ? u.plural('inicio.todo.faltaItems.' + x.que, x.n, { fecha: u.fechaCorta(x.fecha) }) : tx('inicio.todo.faltaItems.' + x.que);
          lista.appendChild(el('li', null, texto));
        });
        cuerpo.appendChild(lista);
      } else cuerpo.appendChild(el('p', 'tt-frase', tx('inicio.todo.faltaNada')));

      // Abajo de todo, cómo lo estima.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.como')));
      ['calorias', 'macros', 'peso', 'grasa', 'sueno', 'alimentos'].forEach((k) => {
        const parte = el('div', 'tt-como');
        parte.append(el('b', null, tx(`inicio.todo.comoEstima.${k}.titulo`)), el('p', null, tx(`inicio.todo.comoEstima.${k}.texto`)));
        cuerpo.appendChild(parte);
      });
      cuerpo.appendChild(el('p', 'tt-pie', tx('inicio.todo.pie')));
      h.append(cab, cuerpo);
    }

    // ------------------------------------------------------------ el primer día
    // Sin nada todavía, cada bloque dice qué hacer y con qué se va a llenar, en vez de ceros y rayas.
    function caloriasPrimerDia() {
      const c = carta('in-calorias in-primer', null, 1);
      const meta = opciones.comida.meta;
      const arriba = el('div', 'in-cal-arriba');
      const luna = el('div', 'in-luna-nueva');
      luna.appendChild(el('i'));
      const cifra = el('div', 'in-cal-cifra');
      cifra.append(el('span', 'in-cal-etq', tx('inicio.primerDia.etiqueta')), el('b', null, numero(meta.kcal)), el('small', null, tx('inicio.primerDia.kcalHoy')));
      arriba.append(luna, cifra);
      const metas = el('div', 'in-metas-chips');
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave], k) => {
        const x = el('span', 'in-meta-chip in-meta-' + m);
        x.style.animationDelay = `${(0.25 + k * 0.1).toFixed(2)}s`;
        x.append(el('i'), el('b', null, tx('inicio.gramos', { n: numero(meta[m]) })), ` ${tx('comida.' + clave).toLowerCase()}`);
        metas.appendChild(x);
      });
      const acciones = el('div', 'in-primer-acciones');
      acciones.append(
        boton('cm-accion principal', `${icono('mas')}<span>${tx('inicio.primerDia.anotar')}</span>`, () => opciones.ir(1)),
        boton('cm-accion', `${icono('microfono')}<span>${tx('inicio.primerDia.decir')}</span>`, () => opciones.ir(1)),
      );
      c.append(arriba, metas, el('p', 'in-primer-texto', tx('inicio.primerDia.caloriasTexto')), acciones);
      return c;
    }

    // El camino: hoy y la meta, unidos por lo que falta, con la fecha a un ritmo viable.
    function caminoPrimerDia() {
      const d = opciones.persona();
      const p = d.perfil;
      const c = carta('in-objetivo in-primer', tx('inicio.primerDia.camino'), 2);
      const desde = Math.round(d.pesoHoy * 10) / 10;
      const plazo = Progreso.plazoConRitmo({ hoy: Datos.HOY, pesoKg: desde, pesoMeta: p.pesoMeta, sexo: p.sexo, edad: Number(Datos.HOY.slice(0, 4)) - p.nacimiento, gasto: d.gasto, entrenaFuerza: true },
        Progreso.BORDES[p.objetivo === 'subir' ? 'subir' : 'bajar'][0]);
      const fila = el('div', 'in-obj-fila');
      fila.append(el('b', null, `${numero(desde, 1)} → ${numero(p.pesoMeta, p.pesoMeta % 1 ? 1 : 0)} kg`));
      c.appendChild(fila);
      if (plazo) {
        const total = Fechas.diasEntre(Datos.HOY, plazo.fecha);
        c.appendChild(Graficos.camino([{ dia: 0, kg: desde }], [{ dia: total, kg: p.pesoMeta }], p.pesoMeta, { ancho: 300, alto: 64, clase: 'in-camino-primer' }));
        c.appendChild(el('p', 'in-primer-texto', tx('inicio.primerDia.caminoTexto', { fecha: u.fechaCorta(plazo.fecha) })));
      }
      const acciones = el('div', 'in-primer-acciones');
      acciones.appendChild(boton('cm-accion', `${icono('balanza')}<span>${tx('inicio.primerDia.pesarme')}</span>`, () => opciones.ir(2)));
      c.appendChild(acciones);
      return c;
    }

    // El cielo: la constelación de hoy con sus estrellas esperando, que titilan.
    function cieloPrimerDia() {
      const { constelacion, habitos } = opciones.cielo();
      const c = carta('in-cielo in-primer', tx('inicio.bloques.cielo'), 4);
      const lienzo = el('canvas', 'in-mini-cielo in-cielo-espera');
      c.appendChild(lienzo);
      requestAnimationFrame(() => dibujarConstelacion(lienzo, constelacion, habitos.map((h) => Object.assign({}, h, { encendido: false }))));
      c.appendChild(el('p', 'in-primer-texto', tx('inicio.primerDia.cieloTexto')));
      const acciones = el('div', 'in-primer-acciones');
      acciones.appendChild(boton('cm-accion', `${icono('estrella')}<span>${tx('inicio.primerDia.habitos')}</span>`, () => opciones.ir(4)));
      c.appendChild(acciones);
      return c;
    }

    // «Para hoy» depende de lo anotado, del agua y de los números ocultos: se rehace solo ese bloque (y la
    // energía, que también los usa).
    function refrescarConsejos() {
      const viejo = bloquesEl.querySelector('.in-consejos');
      if (viejo) viejo.replaceWith(consejos());
      pintarBotonDeEnergia(s.primerDia ? null : energiaDeHoy(delDeporte()));
    }

    function pintar(ms) {
      // Con un día de ejemplo del deporte, es ese día.
      const deporte = s.primerDia ? null : delDeporte();
      const hoy = u.partes(deporte ? deporte.hoy : Datos.HOY);
      zona.querySelector('.in-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) });
      zona.querySelector('.in-titulo').textContent = tx('inicio.titulo');
      // Al vaciar los bloques el scroll se iba arriba de golpe (al sumar o quitar un vaso abajo): vuelve a donde estaba.
      const scroll = zona.querySelector('.in-scroll');
      const posicion = scroll ? scroll.scrollTop : 0;
      bloquesEl.innerHTML = '';
      if (s.primerDia) [caloriasPrimerDia(), caminoPrimerDia(), cieloPrimerDia()].forEach((b) => bloquesEl.appendChild(b));
      else s.orden.filter((b) => s.visibles.has(b)).forEach((b) => bloquesEl.appendChild(ARMAR[b](ms)));
      // Tu energía, debajo de los macros (la luna); si es baja, arriba de todo, como advertencia. Y el control,
      // cuando se acerca, debajo de la luna y de la energía.
      const luna = bloquesEl.querySelector('.in-calorias');
      // Tu energía vive en Sueño (5/11, a la noche); acá, el botón de arriba a la derecha.
      cerrarGlobo();
      pintarBotonDeEnergia(s.primerDia ? null : energiaDeHoy(deporte));
      const control = s.primerDia ? null : controlCerca();
      const arriba = luna;
      if (control) bloquesEl.insertBefore(control, arriba ? arriba.nextSibling : bloquesEl.firstChild);
      // La invitación de Ascent (ascent.js), debajo del segundo bloque: se ve sin bajar y no tapa lo de hoy.
      const invitacion = s.primerDia ? null : opciones.invitacionDeAscent();
      if (invitacion) bloquesEl.insertBefore(invitacion, bloquesEl.children[2 + (control ? 1 : 0)] || null);
      const pie = zona.querySelector('.in-pie');
      pie.innerHTML = '';
      pie.appendChild(boton('in-personalizar', `${icono('asa')}<span>${tx('inicio.personalizar')}</span>`, () => abrirPersonalizar()));
      // El musgo de abajo de todo se sacó el 5/11 (no te gustaba).
      if (scroll) scroll.scrollTop = posicion;
    }

    // ------------------------------------------------------------ personalizar
    // Una hoja con los bloques: la llave muestra u oculta, y se ordenan arrastrando de la manija.
    const hoja = Util.hoja(tel, 'in-hoja', () => opciones.alCambiar());
    function abrirPersonalizar() {
      pintarHoja();
      hoja.abrir();
      opciones.alCambiar();
    }
    function pintarHoja() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('inicio.personalizarTitulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      h.append(cab, el('p', 'hb-texto', tx('inicio.personalizarTexto')));
      const lista = el('ul', 'in-lista');
      s.orden.forEach((b) => {
        const li = el('li', 'in-fila-orden');
        li.dataset.bloque = b;
        const asa = el('span', 'in-asa');
        asa.innerHTML = icono('asa');
        asa.setAttribute('aria-label', tx('inicio.mover'));
        const llave = boton('in-llave', '<i></i>', () => {
          if (s.visibles.has(b)) s.visibles.delete(b); else s.visibles.add(b);
          llave.setAttribute('aria-pressed', String(s.visibles.has(b)));
          guardar();
          pintar(0);
        }, tx('inicio.bloques.' + b));
        llave.setAttribute('aria-pressed', String(s.visibles.has(b)));
        li.append(asa, el('span', 'in-fila-nombre', tx('inicio.bloques.' + b)), llave);
        arrastrable(li, asa, lista);
        lista.appendChild(li);
      });
      h.appendChild(lista);
      h.appendChild(el('p', 'hb-nota', tx('inicio.personalizarNota')));
    }

    // Arrastrar de la manija: la fila sigue al dedo y las otras le hacen lugar.
    function arrastrable(li, asa, lista) {
      asa.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        const filas = [...lista.children];
        const alto = li.offsetHeight;
        const y0 = ev.clientY;
        const desde = filas.indexOf(li);
        let hasta = desde;
        li.classList.add('moviendo');
        try { asa.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
        const mover = (e) => {
          const dy = e.clientY - y0;
          li.style.translate = `0 ${dy}px`;
          hasta = Math.max(0, Math.min(filas.length - 1, desde + Math.round(dy / alto)));
          filas.forEach((f, i) => {
            if (f === li) return;
            const corre = desde < hasta ? i > desde && i <= hasta ? -alto : 0 : i < desde && i >= hasta ? alto : 0;
            f.style.translate = `0 ${corre}px`;
          });
        };
        const soltar = () => {
          asa.removeEventListener('pointermove', mover);
          filas.forEach((f) => { f.style.translate = ''; });
          li.classList.remove('moviendo');
          if (hasta !== desde) {
            const b = s.orden.splice(desde, 1)[0];
            s.orden.splice(hasta, 0, b);
            guardar();
            pintar(0);
            pintarHoja();
          }
        };
        asa.addEventListener('pointermove', mover);
        asa.addEventListener('pointerup', soltar, { once: true });
        asa.addEventListener('pointercancel', soltar, { once: true });
      });
    }

    pintar(0);
    Kcal.alCambiar(() => pintar(600));
    return {
      zona,
      pintar,
      // Con una hoja arriba (personalizar o «Todo lo de hoy»), el gesto de las pestañas no anda y la galería la cierra.
      get editando() { return hoja.abierta || hojaTodo.abierta; },
      cerrar() { hoja.cerrar(); hojaTodo.cerrar(); },
      // Para las capturas y los botones de la galería.
      personalizar: abrirPersonalizar,
      poner(bloque, si) { if (si) s.visibles.add(bloque); else s.visibles.delete(bloque); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      mover(bloque, a) { const i = s.orden.indexOf(bloque); s.orden.splice(i, 1); s.orden.splice(a, 0, bloque); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      deFabrica() { s.orden = [...BLOQUES]; s.visibles = new Set(DE_FABRICA); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      primerDia(si) { s.primerDia = !!si; pintar(0); },
      refrescarConsejos,
      // «Para hoy» en otro momento del día (mediodia, tarde, nada, bien); null vuelve al de la galería.
      ejemplo(e) { s.ejemplo = e || null; refrescarConsejos(); },
      // Tu energía de ejemplo (baja por el sueño, bajaComida, atrasado, suficiente, alta o sinDatos), a qué hora, y abierta o plegada.
      // Para las capturas: el globo de tu energía, abierto o cerrado.
      abrirEnergia: () => { if (!globo) abrirGlobo(); },
      cerrarEnergia: () => cerrarGlobo(),
      get globoAbierto() { return !!globo; },
      // Tu energía completa, para Sueño (galeria.js la pasa como opciones.energia).
      tarjetaParaSueno() { return tarjetaDeEnergia(energiaDeHoy(s.primerDia ? null : delDeporte())); },
      ponerEnergia(e, { plegada, mas, hora } = {}) {
        s.energia = e || s.energia || 'suficiente';
        // El momento del día de la propuesta: manana, mediodia, antes, despues o noche.
        if (hora !== undefined) s.energiaHora = hora;
        if (plegada !== undefined) s.energiaPlegada = !!plegada;
        if (mas !== undefined) s.energiaMas = !!mas;
        pintar(0);
      },
      abrirTodo,
      cerrarTodo: () => hojaTodo.cerrar(),
      bajarTodo: (selector) => {
        const cuerpo = hojaTodo.el.querySelector('.tt-cuerpo');
        const n = hojaTodo.el.querySelector(selector);
        if (cuerpo && n) cuerpo.scrollTop += n.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top - 44;
      },
      bajar() { zona.querySelector('.in-scroll').scrollTo(0, 99999); },
      subir() { zona.querySelector('.in-scroll').scrollTo(0, 0); },
    };
  }

  return { crear };
})();

// Los gráficos chicos de las secciones nuevas: una línea con su tendencia, el balance de la semana,
// el hipnograma de una noche, el camino a la meta, las barras de cada semana y la línea chiquita de
// una medida. SVG con los colores de la galería.
const Graficos = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const svg = (ancho, alto, clase, html) => {
    const n = document.createElementNS(SVG, 'svg');
    n.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    n.setAttribute('class', 'gr ' + (clase || ''));
    n.setAttribute('aria-hidden', 'true');
    n.innerHTML = html;
    return n;
  };

  // Puntos (lo de cada día) y una línea (la tendencia): [{ x, punto, linea }], x de 0 a 1.
  function linea(serie, { ancho = 300, alto = 70, clase, meta } = {}) {
    const m = 4;
    const valores = serie.flatMap((p) => [p.punto, p.linea]).filter((v) => v != null).concat(meta != null ? [meta] : []);
    const min = Math.min(...valores) - 0.1, max = Math.max(...valores) + 0.1;
    const X = (x) => m + x * (ancho - 2 * m);
    const Y = (v) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
    const conLinea = serie.filter((p) => p.linea != null);
    const camino = conLinea.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.linea).toFixed(1)}`).join(' ');
    const area = conLinea.length ? `${camino} L${X(conLinea[conLinea.length - 1].x).toFixed(1)} ${alto} L${X(conLinea[0].x).toFixed(1)} ${alto} Z` : '';
    const puntos = serie.filter((p) => p.punto != null).map((p) => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.punto).toFixed(1)}" r="1.5" class="gr-punto"/>`).join('');
    const ultimo = conLinea[conLinea.length - 1];
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    const lineaMeta = meta != null && meta > min && meta < max ? `<line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-meta"/>` : '';
    return svg(ancho, alto, clase, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3a6" stop-opacity="0.18"/><stop offset="1" stop-color="#f6e3a6" stop-opacity="0"/></linearGradient></defs>
      ${lineaMeta}<path d="${area}" fill="url(#${id})" stroke="none"/>${puntos}<path d="${camino}" class="gr-linea"/>
      ${ultimo ? `<circle cx="${X(ultimo.x).toFixed(1)}" cy="${Y(ultimo.linea).toFixed(1)}" r="2.6" class="gr-fin"/>` : ''}`);
  }

  // Lo comido de cada día contra el gasto (la línea): debajo es déficit; arriba, de más.
  function balance(dias, gasto, { ancho = 300, alto = 70, clase } = {}) {
    const m = 3;
    if (!dias.length) return svg(ancho, alto, clase, '');
    const max = Math.max(gasto * 1.15, ...dias.map((d) => d.kcal));
    const Y = (v) => alto - m - (v / max) * (alto - 2 * m);
    const paso = (ancho - 2 * m) / 7;
    const barras = dias.map((d, i) => {
      const x = m + (7 - dias.length + i) * paso + paso * 0.28;
      return `<rect x="${x.toFixed(1)}" y="${Y(d.kcal).toFixed(1)}" width="${(paso * 0.44).toFixed(1)}" height="${(alto - m - Y(d.kcal)).toFixed(1)}" rx="1.6" class="${d.kcal > gasto ? 'gr-barra arriba' : 'gr-barra'}"/>`;
    }).join('');
    return svg(ancho, alto, 'gr-balance ' + (clase || ''), `${barras}<line x1="${m}" x2="${ancho - m}" y1="${Y(gasto).toFixed(1)}" y2="${Y(gasto).toFixed(1)}" class="gr-gasto"/>`);
  }

  // Las etapas de una noche en el tiempo: despierto arriba y profundo abajo, como la app Salud.
  const FILAS = { despierto: 0, rem: 1, nucleo: 2, profundo: 3, dormido: 2 };
  function hipnograma(noche, { ancho = 300, alto = 90, clase, etiquetas } = {}) {
    const inicio = noche.enCamaDesde, fin = noche.enCamaHasta;
    const X = (min) => ((min - inicio) / Math.max(1, fin - inicio)) * ancho;
    const alturaFila = alto / 4;
    const tramos = noche.tramos.map((t) => {
      const fila = FILAS[t.etapa];
      return `<rect x="${X(t.desde).toFixed(2)}" y="${(fila * alturaFila + 1).toFixed(1)}" width="${Math.max(0.6, X(t.hasta) - X(t.desde)).toFixed(2)}" height="${(alturaFila - 2).toFixed(1)}" rx="1.4" class="gr-etapa gr-${t.etapa}"/>`;
    }).join('');
    const guias = etiquetas ? [0, 1, 2, 3].map((i) => `<line x1="0" x2="${ancho}" y1="${(i * alturaFila + alturaFila / 2).toFixed(1)}" y2="${(i * alturaFila + alturaFila / 2).toFixed(1)}" class="gr-guia"/>`).join('') : '';
    return svg(ancho, alto, 'gr-hipno ' + (clase || ''), guias + tramos);
  }

  // El camino a la meta: la tendencia hasta hoy (llena) y el plan hasta la fecha (punteado), con la
  // meta. `pasado` y `plan` son [{ dia, kg }], con `dia` contado desde el primero.
  function camino(pasado, plan, meta, { ancho = 300, alto = 96, clase } = {}) {
    const m = 6;
    const todos = [...pasado, ...plan];
    const ultimoDia = Math.max(...todos.map((p) => p.dia), 1);
    const valores = todos.map((p) => p.kg).concat([meta]);
    const min = Math.min(...valores) - 0.4, max = Math.max(...valores) + 0.4;
    const X = (d) => m + (d / ultimoDia) * (ancho - 2 * m);
    const Y = (v) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
    const trazo = (lista) => lista.map((p, i) => `${i ? 'L' : 'M'}${X(p.dia).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join(' ');
    const hoy = pasado[pasado.length - 1];
    const fin = plan[plan.length - 1];
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    const area = pasado.length > 1 ? `${trazo(pasado)} L${X(hoy.dia).toFixed(1)} ${alto} L${X(pasado[0].dia).toFixed(1)} ${alto} Z` : '';
    return svg(ancho, alto, 'gr-camino ' + (clase || ''), `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6bf94" stop-opacity="0.22"/><stop offset="1" stop-color="#a6bf94" stop-opacity="0"/></linearGradient></defs>
      <line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-meta"/>
      <path d="${area}" fill="url(#${id})" stroke="none"/>
      <path d="${trazo(pasado)}" class="gr-linea gr-hecho"/>
      ${plan.length ? `<path d="${trazo([hoy, ...plan])}" class="gr-plan"/>` : ''}
      ${hoy ? `<circle cx="${X(hoy.dia).toFixed(1)}" cy="${Y(hoy.kg).toFixed(1)}" r="3" class="gr-fin"/>` : ''}
      ${fin ? `<circle cx="${X(fin.dia).toFixed(1)}" cy="${Y(fin.kg).toFixed(1)}" r="3.4" class="gr-destino"/>` : ''}`);
  }

  // Barras desde el cero: lo negativo baja y lo positivo sube (el cambio de cada semana). Si todo va
  // para el mismo lado, el cero queda en el borde y las barras usan todo el alto.
  function barras(valores, { ancho = 300, alto = 60, clase, tope } = {}) {
    const m = 3;
    const hay = valores.filter((v) => v != null);
    const max = tope || Math.max(0.1, ...hay.map((v) => Math.abs(v)));
    const cero = hay.every((v) => v <= 0) ? m : hay.every((v) => v >= 0) ? alto - m : alto / 2;
    const lugar = Math.max(cero - m, alto - m - cero);
    const paso = (ancho - 2 * m) / valores.length;
    const lista = valores.map((v, i) => {
      if (v == null) return '';
      const h = Math.max(1.5, (Math.abs(v) / max) * lugar);
      const x = m + i * paso + paso * 0.24;
      return `<rect x="${x.toFixed(1)}" y="${(v < 0 ? cero : cero - h).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${v < 0 ? 'gr-baja' : 'gr-sube'}"/>`;
    }).join('');
    return svg(ancho, alto, 'gr-barras ' + (clase || ''), `<line x1="${m}" x2="${ancho - m}" y1="${cero}" y2="${cero}" class="gr-guia"/>${lista}`);
  }

  // Lo comido de cada semana contra la meta (la línea): columnas que llegan o no.
  function columnas(valores, meta, { ancho = 300, alto = 60, clase } = {}) {
    const m = 3;
    const max = Math.max(meta * 1.2, ...valores.map((v) => v ?? 0));
    const Y = (v) => alto - m - (v / max) * (alto - 2 * m);
    const paso = (ancho - 2 * m) / valores.length;
    const lista = valores.map((v, i) => (v == null ? `<rect x="${(m + i * paso + paso * 0.24).toFixed(1)}" y="${(alto - m - 2).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="2" rx="1" class="gr-vacia"/>`
      : `<rect x="${(m + i * paso + paso * 0.24).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="${(alto - m - Y(v)).toFixed(1)}" rx="2" class="gr-columna${v > meta * 1.05 ? ' arriba' : v < meta * 0.9 ? ' abajo' : ''}"/>`)).join('');
    return svg(ancho, alto, 'gr-columnas ' + (clase || ''), `${lista}<line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-gasto"/>`);
  }

  // Una línea chiquita, para el lado de un número (las medidas).
  function chispa(valores, { ancho = 54, alto = 18, clase } = {}) {
    const m = 2.5;
    if (valores.length < 2) return svg(ancho, alto, clase, '');
    const min = Math.min(...valores), max = Math.max(...valores);
    const X = (i) => m + (i / (valores.length - 1)) * (ancho - 2 * m);
    const Y = (v) => (max === min ? alto / 2 : m + (1 - (v - min) / (max - min)) * (alto - 2 * m));
    const d = valores.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    const ult = valores.length - 1;
    return svg(ancho, alto, 'gr-chispa ' + (clase || ''), `<path d="${d}" class="gr-linea"/><circle cx="${X(ult).toFixed(1)}" cy="${Y(valores[ult]).toFixed(1)}" r="2" class="gr-fin"/>`);
  }

  return { linea, balance, hipnograma, camino, barras, columnas, chispa };
})();
