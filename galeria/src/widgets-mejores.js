// Lo que pediste el 25/11/2026, para aprobar (spec/estudio/widgets-y-noche.md: 1.1, 1.3 y las filas 2 y 3 de la
// pantalla bloqueada):
// - Hoy, tan limpio como el de la pantalla bloqueada que te gusta: el chico es la cifra, la luna chica y los tres
//   macros en barras finas; el mediano suma tus comidas a la derecha, con «+633» de un toque; el grande, además, tus
//   últimos siete días contra la meta. Cada uno, junto al de ahora.
// - Tu noche en StandBy: «A dormir 23:15» y la cuenta que baja de a un minuto, sin fondo y en rojo con poca luz.
// - La pantalla bloqueada: a la mañana, la deuda debajo de la noche; a la tardecita, la hora de acostarte (la de tu
//   periodo de melatonina, como el aviso) con la cuenta viva. Un dato por widget: el de las calorías no cambia.
// Con lo que deja dibujar SwiftUI en un widget y los mismos datos de mentira que los widgets de D43
// (widgets-nuevos.js). Los textos nuevos van acá, con las claves que tendrían en src/textos, hasta que se aprueben.

const WidgetsMejores = (() => {
  const TEXTOS_NUEVOS = {
    es: {
      widgets: {
        mejores: {
          quedan: 'te quedan', deMas: 'de más', semana: 'Últimos 7 días', meta: 'meta {n}',
          deuda: { sinDeuda: 'sin deuda', baja: 'deuda baja', media: 'deuda media', alta: 'deuda alta' },
          antes: 'Antes', despues: 'Después',
        },
      },
    },
    en: {
      widgets: {
        mejores: {
          quedan: 'left', deMas: 'over', semana: 'Last 7 days', meta: 'goal {n}',
          deuda: { sinDeuda: 'no debt', baja: 'low debt', media: 'medium debt', alta: 'high debt' },
          antes: 'Before', despues: 'After',
        },
      },
    },
  };
  function completar(destino, origen) {
    Object.entries(origen).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (!destino[k] || typeof destino[k] !== 'object') destino[k] = {};
        completar(destino[k], v);
      } else if (destino[k] == null) destino[k] = v;
    });
  }
  if (typeof TEXTOS !== 'undefined' && TEXTOS) ['es', 'en'].forEach((i) => { if (TEXTOS[i]) completar(TEXTOS[i], TEXTOS_NUEVOS[i]); });

  const COMIDAS = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  // Las horas de mentira, las de los widgets de D43. La de la tardecita corre con el reloj, de a minuto.
  const TARDECITA = 21 * 60 + 47;
  const MANANA = 7 * 60 + 12;
  // Sin periodo de melatonina (menos de tres noches en la semana), la hora de los widgets de D43.
  const A_DORMIR = 23 * 60 + 15;
  const DIAS = 7;

  const CSS = `
/* Las páginas: el de ahora y el nuevo, cada uno con su rótulo. */
.wm-pagina { position: absolute; left: 27.5px; right: 27.5px; top: 56px; display: grid; gap: 14px; }
.wm-dos { display: flex; justify-content: space-between; }
.wm-par { display: grid; gap: 6px; justify-items: start; }
.wm-rotulo { padding-left: 6px; font: 600 9.5px/1 var(--letra); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255, 255, 255, 0.42); }
.wm-rotulo.nuevo { color: rgba(246, 227, 166, 0.85); }
.wm-pagina.grande { gap: 12px; }

/* Al mostrarse, cada widget entra corto y de a uno; las barras crecen desde cero. */
.wg-vista.activa .wm-entra { animation: wm-entra 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 60ms); }
@keyframes wm-entra { from { opacity: 0; transform: translateY(10px) scale(0.985); } }
.wg-vista.activa .wm-w .wn-barra i { animation: wm-crece 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 220ms); }
@keyframes wm-crece { from { width: 0; } }
.wg-vista.activa .wm-dia i { animation: wm-sube 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + var(--d) * 45ms + 260ms); }
@keyframes wm-sube { from { transform: scaleY(0); } }

/* Hoy, nuevo: la luna chica, lo que queda y los tres macros en barras finas. Nada más; el cielo, muy tenue. */
.wm-w .wn-noche { opacity: 0.14; }
.wg.tintado .wm-w .wn-noche, .wg.transparente .wm-w .wn-noche { opacity: 0; }
.wm-hoy { position: absolute; inset: 16px; display: flex; flex-direction: column; min-width: 0; }
.wm-hoy .wn-luna-sitio { margin: -5px 0 0 -5px; }
.wm-cifra { display: block; margin-top: auto; font: 300 42px/0.95 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.03em; color: #fbf2d9; font-variant-numeric: tabular-nums; white-space: nowrap; transition: color 0.4s; }
.wm-queda { display: block; margin-top: 4px; font: 400 12px/1.2 var(--letra); color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.de-mas .wm-cifra { color: #e8c46a; }
.wg.tintado .wm-cifra, .wg.transparente .wm-cifra { color: var(--texto); }
.wm-barras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.wm-barras > span { display: grid; gap: 4px; min-width: 0; }
.wm-barras small { font: 500 9px/1 var(--letra); letter-spacing: 0.04em; color: var(--tenue); }

/* Hoy, mediano y la parte de arriba del grande: lo mismo a la izquierda y tus comidas a la derecha. */
.wm-med { position: absolute; inset: 16px; display: grid; grid-template-columns: 116px minmax(0, 1fr); column-gap: 14px; }
.wm-med .wm-hoy, .wm-gr-arriba .wm-hoy { position: static; }
.wm-comidas { display: grid; grid-template-rows: repeat(4, minmax(0, 1fr)); padding-left: 14px; border-left: 0.5px solid rgba(239, 230, 207, 0.12); }
.wm-comida { appearance: none; border: 0; background: none; margin: 0; padding: 0; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; text-align: left; color: var(--texto); font: inherit; transition: opacity 0.15s; }
.wm-comida:active { opacity: 0.55; }
.wm-comida span { min-width: 0; font: 400 12.5px/1.2 var(--letra); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wm-comida b { flex: none; height: 24px; min-width: 24px; padding: 0 9px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; font: 500 12.5px/1 var(--letra); font-variant-numeric: tabular-nums; white-space: nowrap; transition: background 0.3s, box-shadow 0.3s, color 0.3s; }
.wm-comida b .wn-ic { width: 11px; height: 11px; flex: none; }
.wm-comida b .wn-ic svg { stroke-width: 2.4; }
.wm-comida.anotada span { color: var(--tenue); }
.wm-comida.anotada b { padding: 0; font-weight: 400; color: var(--tenue); }
.wm-comida.siempre b { color: var(--luz); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); }
.wm-comida.vacia b { width: 24px; padding: 5px; color: var(--luz); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.3); }
.wm-comida.vacia b .wn-ic { width: 14px; height: 14px; }
.wm-comida.tocada b { color: var(--luz); background: rgba(246, 227, 166, 0.15); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.5); }

/* Hoy, grande: arriba, como el mediano; abajo, tus últimos siete días contra la meta (la línea punteada). */
.wm-gr { position: absolute; inset: 16px; display: flex; flex-direction: column; }
.wm-gr-arriba { flex: none; height: 126px; display: grid; grid-template-columns: 116px minmax(0, 1fr); column-gap: 14px; }
.wm-semana { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 14px; padding-top: 12px; border-top: 0.5px solid rgba(239, 230, 207, 0.12); }
.wm-semana-cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font: 400 11px/1 var(--letra); color: var(--tenue); white-space: nowrap; }
.wm-semana-cab b { font-weight: 500; color: var(--texto); }
.wm-semana-cab span { font-variant-numeric: tabular-nums; }
.wm-zona { position: relative; flex: 1; min-height: 0; margin-top: 12px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.wm-meta { position: absolute; left: 0; right: 0; bottom: var(--meta); border-top: 1px dashed rgba(239, 230, 207, 0.3); pointer-events: none; }
.wm-dia { position: relative; display: flex; justify-content: center; align-items: flex-end; }
.wm-dia i { position: relative; width: 12px; height: var(--h); border-radius: 6px 6px 3px 3px; overflow: hidden; background: rgba(239, 230, 207, 0.2); transform-origin: 50% 100%; }
.wm-dia i em { position: absolute; left: 0; right: 0; top: 0; height: var(--sobre, 0%); background: #e8c46a; }
.wm-dia.hoy i { background: var(--luz); }
.wm-dia.vacio i { height: 3px; background: rgba(239, 230, 207, 0.12); }
.wg.tintado .wm-dia i em, .wg.transparente .wm-dia i em { background: var(--texto); }
.wm-letras { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 6px; }
.wm-letras span { text-align: center; font: 500 10px/1 var(--letra); color: var(--tenue); }
.wm-letras span.hoy { color: var(--luz); }

/* Tu noche, chico: la hora de acostarte y la cuenta que baja; a la mañana, lo dormido y la deuda. */
.wm-noche { position: absolute; inset: 16px; display: flex; flex-direction: column; min-width: 0; }
.wm-noche-cab { display: flex; justify-content: space-between; align-items: center; }
.wm-noche-cab .wn-ic { width: 14px; height: 14px; color: var(--tenue); }
.wm-falta { display: block; margin-top: 5px; font: 400 13px/1.2 var(--letra); color: var(--texto); opacity: 0.78; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wm-noche .wm-cifra { font-size: 38px; }
.wm-noche .wn-si { margin-top: 10px; }

/* StandBy: de costado y cargando, sin el fondo que iOS saca; con poca luz, todo en rojo. */
.wm-standby { background: #000; }
.wm-standby .wn-capa { display: none; }
.wm-standby .wg-acostado { justify-content: space-evenly; padding: 0; transition: filter 0.6s ease; }
.wm-standby::after { content: ''; position: absolute; inset: 0; background: #ff3b2f; mix-blend-mode: multiply; opacity: 0; pointer-events: none; transition: opacity 0.6s ease; }
.wm-standby.de-noche::after { opacity: 1; }
.wm-standby.de-noche .wg-acostado { filter: grayscale(1) brightness(0.72); }

/* La pantalla bloqueada: iOS lo dibuja de un solo color sobre el fondo. */
.wm-bloqueo .wg-reloj { position: absolute; top: 92px; left: 0; right: 0; text-align: center; font: 600 104px/1 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.03em; color: rgba(255, 255, 255, 0.93); font-variant-numeric: tabular-nums; }
.wm-bloqueo .wg-noche { flex: none; cursor: pointer; grid-template-columns: minmax(0, 1fr) auto; }
.wm-bloqueo .wg-noche strong { overflow: hidden; }
.wm-bloqueo .wg-noche.sin-pregunta .wg-si { position: absolute; right: 0; }
/* Con el «Sí» al lado, las horas se achican para caber, como minimumScaleFactor en el iPhone. */
.wm-bloqueo .wg-noche:not(.sin-pregunta) strong { font-size: 15px; }

@media (prefers-reduced-motion: reduce) {
  .wg-vista.activa .wm-entra, .wg-vista.activa .wm-w .wn-barra i, .wg-vista.activa .wm-dia i { animation: none; }
  .wm-cifra, .wm-comida, .wm-comida b, .wm-standby .wg-acostado, .wm-standby::after { transition: none; }
}
`;

  function crear(raiz, o) {
    const { u, nuevos } = o;
    const p = nuevos.piezas;
    const { tx, el, numero, horaMin, duracion } = u;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    // La hora de la tardecita: la elegida más lo que pasó desde entonces, de a minuto, como el reloj del iPhone.
    const s = { hora: TARDECITA, desde: Date.now() };
    const ahora = () => (p.momento === 'noche' ? s.hora + Math.floor((Date.now() - s.desde) / 60000) : MANANA);
    const ms = () => (o.movimientoReducido ? 0 : 700);
    const entra = (nodo) => { nodo.classList.add('wm-entra'); return nodo; };
    // Cada widget entra con su turno, en el orden de la página.
    const turnos = (vista) => { vista.querySelectorAll('.wm-entra').forEach((n, i) => n.style.setProperty('--i', String(i))); return vista; };

    // ------------------------------------------------------------ la noche, de Sueño
    function laNoche() {
      const n = o.anoche();
      const extra = o.paraLaNoche ? o.paraLaNoche() || {} : {};
      return { n, acostarse: extra.acostarse == null ? A_DORMIR : extra.acostarse, deuda: extra.deuda || null };
    }
    // Lo que falta para acostarte, contando desde las 18 como las noches de Moss: pasada la hora, «Ya es hora».
    function cuenta(acostarse) {
      const desdeLas18 = (m) => (((m - 18 * 60) % 1440) + 1440) % 1440;
      const falta = desdeLas18(acostarse) - desdeLas18(ahora());
      return falta > 0 ? tx('widgets.enTiempo', { tiempo: duracion(falta) }) : tx('widgets.yaEsHora');
    }
    const dormido = (n) => Periodo.corta(u, n.dormido);
    const conDeuda = (n, deuda) => (deuda ? `${dormido(n)} · ${tx('widgets.mejores.deuda.' + deuda)}` : dormido(n));

    // ------------------------------------------------------------ Hoy, nuevo
    const barra = () => '<span class="wn-barra"><i></i></span>';
    // Lo de la izquierda, igual en los tres tamaños: la luna chica, la cifra, «te quedan» y las tres barras.
    function izquierda(contenedor) {
      const caja = el('div', 'wm-hoy');
      const { l, sitio } = p.nuevaLuna(34);
      const cifra = el('b', 'wm-cifra');
      const queda = el('span', 'wm-queda');
      const barras = el('div', 'wm-barras');
      const celdas = ['p', 'c', 'g'].map((k) => {
        const c = el('span', `wn-m-${k}`);
        c.innerHTML = `<small></small>${barra()}`;
        barras.appendChild(c);
        return c;
      });
      caja.append(sitio, cifra, queda, barras);
      return {
        el: caja,
        pintar(d, animar) {
          l.ir(d.fraccion, animar ? ms() : 0);
          contenedor.classList.toggle('de-mas', d.queda < 0);
          p.poner(cifra, p.cifraDe(d));
          queda.textContent = tx(d.queda < 0 ? 'widgets.mejores.deMas' : 'widgets.mejores.quedan');
          p.macrosDe(d).forEach((m, i) => {
            celdas[i].querySelector('small').textContent = m.corto;
            celdas[i].classList.toggle('de-mas', m.mas);
            celdas[i].querySelector('.wn-barra i').style.setProperty('--f', `${(m.f * 100).toFixed(1)}%`);
          });
          contenedor.setAttribute('aria-label', `${cifra.textContent} ${queda.textContent}`);
        },
      };
    }

    // Tus comidas: la anotada dice sus kcal, quieta; la que falta, lo que sumaría tu comida de siempre, y un toque la
    // anota sin abrir Moss (otro la saca). Sin comida de siempre, el toque abre la hoja de anotar en esa comida.
    function comidas() {
      const lista = el('div', 'wm-comidas');
      const filas = COMIDAS.map((tipo) => {
        const b = el('button', 'wm-comida');
        b.type = 'button';
        b.append(el('span'), el('b'));
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          p.alTocarFila(p.elDia().filas.find((f) => f.tipo === tipo));
        });
        lista.appendChild(b);
        return b;
      });
      return {
        el: lista,
        pintar(d) {
          d.filas.forEach((f, i) => {
            const b = filas[i];
            const estado = p.estadoDe(f);
            ['anotada', 'tocada', 'siempre', 'vacia'].forEach((x) => b.classList.toggle(x, x === estado));
            const nombre = tx('widgets.comidaCorta.' + f.tipo);
            b.firstChild.textContent = nombre;
            const valor = b.lastChild;
            const kcal = (v) => numero(Math.round(v.kcal));
            if (estado === 'tocada') valor.innerHTML = `${tx('widgets.anotado')}<span class="wn-ic">${p.icono('listo')}</span>`;
            else if (estado === 'vacia') valor.innerHTML = `<span class="wn-ic">${p.icono('mas')}</span>`;
            else p.poner(valor, estado === 'anotada' ? kcal(f.anotada.valores) : `+${kcal(f.siempre.valores)}`);
            b.setAttribute('aria-label', `${nombre}: ${estado === 'vacia' ? tx('widgets.sinAnotar') : valor.textContent}`);
            b.setAttribute('aria-pressed', String(estado === 'tocada'));
          });
        },
      };
    }

    function hoyChico() {
      const w = p.conFondo(el('div', 'wg-w chico wm-w'));
      const izq = izquierda(w);
      w.appendChild(izq.el);
      w.addEventListener('click', () => o.abrirMoss('comida', { tipo: p.comidaDeAhora() }));
      p.alPintar((d, animar) => izq.pintar(d, animar));
      return w;
    }

    function hoyMediano() {
      const w = p.conFondo(el('div', 'wg-w mediano wm-w'));
      const dentro = el('div', 'wm-med');
      const izq = izquierda(w);
      const lista = comidas();
      dentro.append(izq.el, lista.el);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      p.alPintar((d, animar) => { izq.pintar(d, animar); lista.pintar(d); });
      return w;
    }

    // Tus últimos siete días, con hoy a la derecha: lo comido contra la meta, y lo que pasó la meta, en oro.
    function semana() {
      const caja = el('div', 'wm-semana');
      const cab = el('div', 'wm-semana-cab');
      const titulo = el('b');
      const meta = el('span');
      cab.append(titulo, meta);
      const zona = el('div', 'wm-zona');
      const linea = el('div', 'wm-meta');
      const letras = el('div', 'wm-letras');
      const columnas = Array.from({ length: DIAS }, (_, i) => {
        const c = el('div', 'wm-dia');
        c.style.setProperty('--d', String(i));
        c.innerHTML = '<i><em></em></i>';
        zona.appendChild(c);
        letras.appendChild(el('span'));
        return c;
      });
      zona.appendChild(linea);
      caja.append(cab, zona, letras);
      const hoy = u.partes(Datos.HOY).dia;
      return {
        el: caja,
        pintar(d) {
          const c = o.comida();
          const dias = columnas.map((_, i) => {
            const k = i - (DIAS - 1);
            const kcal = k === 0 ? d.suma.kcal : p.momento === 'primerDia' ? 0 : c.totalDe(k).kcal;
            return { k, kcal, dia: (hoy + k + 7 * DIAS) % 7 };
          });
          const tope = Math.max(d.meta.kcal * 1.2, ...dias.map((x) => x.kcal));
          titulo.textContent = tx('widgets.mejores.semana');
          meta.textContent = tx('widgets.mejores.meta', { n: numero(d.meta.kcal) });
          linea.style.setProperty('--meta', `${((d.meta.kcal / tope) * 100).toFixed(1)}%`);
          dias.forEach((x, i) => {
            const col = columnas[i];
            col.classList.toggle('hoy', x.k === 0);
            col.classList.toggle('vacio', !x.kcal);
            col.firstChild.style.setProperty('--h', `${((x.kcal / tope) * 100).toFixed(1)}%`);
            col.firstChild.style.setProperty('--sobre', x.kcal > d.meta.kcal ? `${(((x.kcal - d.meta.kcal) / x.kcal) * 100).toFixed(1)}%` : '0%');
            const letra = letras.children[i];
            letra.textContent = tx('fecha.diasCortos.' + x.dia).charAt(0);
            letra.classList.toggle('hoy', x.k === 0);
          });
          zona.setAttribute('role', 'img');
          zona.setAttribute('aria-label', dias.map((x) => `${tx('fecha.diasCortos.' + x.dia)} ${numero(Math.round(x.kcal))}`).join(', '));
        },
      };
    }

    function hoyGrande() {
      const w = p.conFondo(el('div', 'wg-w grande wm-w'));
      const dentro = el('div', 'wm-gr');
      const arriba = el('div', 'wm-gr-arriba');
      const izq = izquierda(w);
      const lista = comidas();
      arriba.append(izq.el, lista.el);
      const sem = semana();
      dentro.append(arriba, sem.el);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      p.alPintar((d, animar) => { izq.pintar(d, animar); lista.pintar(d); sem.pintar(d); });
      return w;
    }

    // ------------------------------------------------------------ Tu noche, nuevo
    // El chico, el que StandBy pone de costado: a la tardecita, la hora de acostarte y cuánto falta, que iOS baja
    // solo de a un minuto (`Text` con `dateStyle: 'relative'`, sin gastar recargas; con `timerInterval` sería de a
    // segundo, «1:27:59»); a la mañana, lo dormido y la deuda.
    function nocheChico() {
      const w = p.conFondo(el('div', 'wg-w chico wm-w'));
      const dentro = el('div', 'wm-noche');
      const cab = el('div', 'wm-noche-cab');
      const etq = el('span', 'wn-etq');
      const ic = el('span', 'wn-ic');
      ic.innerHTML = p.icono('sueno');
      cab.append(etq, ic);
      const cifra = el('b', 'wm-cifra');
      const falta = el('span', 'wm-falta');
      const si = el('button', 'wn-si');
      si.type = 'button';
      si.innerHTML = `<span class="wn-ic">${p.icono('listo')}</span><span></span>`;
      si.addEventListener('click', (ev) => { ev.stopPropagation(); p.confirmar(); });
      dentro.append(cab, cifra, falta, si);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('sueno'));
      p.alPintar(() => {
        const { n, acostarse, deuda } = laNoche();
        const deNoche = p.momento === 'noche';
        etq.textContent = tx(deNoche ? 'widgets.aDormir' : 'widgets.anoche');
        const pregunta = !deNoche && o.sinReloj() && !!n;
        if (deNoche) {
          p.poner(cifra, horaMin(acostarse));
          p.poner(falta, cuenta(acostarse));
        } else {
          p.poner(cifra, n ? dormido(n) : '—');
          p.poner(falta, !n ? tx('widgets.seVeEnMoss') : pregunta && !p.confirmada ? tx('widgets.fueAsi') : deuda ? tx('widgets.mejores.deuda.' + deuda) : tx('widgets.horas', { desde: horaMin(n.dormirse), hasta: horaMin(n.despertar) }));
        }
        si.hidden = !pregunta;
        si.classList.toggle('lista', p.confirmada);
        si.lastElementChild.textContent = p.confirmada ? tx('widgets.confirmada') : tx('widgets.siFueAsi');
        w.setAttribute('aria-label', `${etq.textContent}: ${cifra.textContent}, ${falta.textContent}`);
      });
      return w;
    }

    // El rectangular de la pantalla bloqueada: a la mañana, «Anoche» con las dos horas y, debajo, lo dormido con la
    // palabra de la deuda de Sueño; a la tardecita, «A dormir», la hora y la cuenta viva.
    function nocheRectangular() {
      const w = el('div', 'wg-noche');
      const titulo = el('b');
      const valor = el('strong');
      const si = el('button', 'wg-si');
      si.type = 'button';
      const nota = el('small');
      const candado = el('span', 'wg-candado');
      candado.innerHTML = p.icono('candado');
      w.append(titulo, valor, si, nota, candado);
      w.addEventListener('click', () => o.abrirMoss('sueno'));
      // Con el teléfono bloqueado, el «Sí» pide Face ID antes de correr.
      si.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (p.confirmada) return;
        w.classList.add('abriendo');
        setTimeout(() => { w.classList.remove('abriendo'); p.confirmar(); }, o.movimientoReducido ? 0 : 520);
      });
      p.alPintar(() => {
        const { n, acostarse, deuda } = laNoche();
        const deNoche = p.momento === 'noche';
        titulo.textContent = tx(deNoche ? 'widgets.aDormir' : 'widgets.anoche');
        si.textContent = tx('widgets.si');
        const pregunta = !deNoche && o.sinReloj() && !!n;
        w.classList.toggle('sin-pregunta', !pregunta || p.confirmada);
        if (deNoche) {
          p.poner(valor, horaMin(acostarse));
          p.poner(nota, cuenta(acostarse));
        } else {
          p.poner(valor, n ? tx('widgets.horas', { desde: horaMin(n.dormirse), hasta: horaMin(n.despertar) }) : '—');
          p.poner(nota, !n ? tx('widgets.seVeEnMoss') : pregunta && !p.confirmada ? tx('widgets.fueAsi') : conDeuda(n, deuda));
        }
        w.setAttribute('aria-label', `${titulo.textContent}: ${valor.textContent}, ${nota.textContent}`);
      });
      return w;
    }

    // ------------------------------------------------------------ las páginas
    const dock = raiz.querySelector('.wg-dock');
    // El de ahora y el nuevo, cada uno con su rótulo.
    const par = (nodo, nuevo) => {
      const caja = entra(el('div', 'wm-par'));
      caja.append(el('span', 'wm-rotulo' + (nuevo ? ' nuevo' : '')), nodo);
      p.alPintar(() => { caja.firstChild.textContent = tx(nuevo ? 'widgets.mejores.despues' : 'widgets.mejores.antes'); });
      return caja;
    };
    function inicio(clase, filas, conDock) {
      const v = el('div', `wg-vista ${clase}`);
      const hora = el('div', 'wg-hora');
      const cont = el('div', 'wm-pagina' + (conDock ? '' : ' grande'));
      filas.forEach((f) => {
        if (Array.isArray(f)) {
          const dos = el('div', 'wm-dos');
          dos.append(...f);
          cont.appendChild(dos);
        } else cont.appendChild(f);
      });
      v.append(hora, cont);
      if (conDock) {
        v.insertAdjacentHTML('beforeend', '<div class="wg-puntos"><i></i><i></i></div>');
        v.appendChild(dock.cloneNode(true));
      }
      p.alPintar(() => { hora.textContent = horaMin(ahora()); });
      return turnos(v);
    }

    const standby = el('div', 'wg-vista wg-m-standby wm-standby');
    const acostado = el('div', 'wg-acostado');
    // El envoltorio entra; el widget adentro lleva la escala de StandBy.
    const envuelto = (w) => { const c = entra(el('div')); c.appendChild(w); return c; };
    acostado.append(envuelto(nocheChico()), envuelto(hoyChico()));
    standby.appendChild(acostado);
    turnos(standby);

    const bloqueo = el('div', 'wg-vista wg-m-bloqueo wm-bloqueo');
    bloqueo.innerHTML = `<div class="wn-fecha"><span></span><i></i></div><div class="wg-reloj"></div><div class="wn-acc"></div>
      <div class="wg-abajo"><i>${p.icono('linterna')}</i><i>${p.icono('camara')}</i></div><div class="wg-barrita"></div>`;
    bloqueo.querySelector('.wn-acc').append(entra(nocheRectangular()), entra(p.hoyRectangular()));
    turnos(bloqueo);
    p.alPintar((d) => {
      bloqueo.querySelector('.wg-reloj').textContent = horaMin(ahora()).replace(/^0/, '');
      const f = u.partes(Datos.HOY);
      const dia = tx('fecha.dias.' + f.dia);
      bloqueo.querySelector('.wn-fecha span').textContent = `${dia.charAt(0).toUpperCase()}${dia.slice(1, 3)} ${f.num}`;
      bloqueo.querySelector('.wn-fecha i').textContent = `${p.cifraDe(d)} kcal`;
    });

    raiz.append(
      inicio('wg-m-hoy', [[par(p.hoyChico()), par(hoyChico(), true)], par(p.hoyMediano()), par(hoyMediano(), true)], true),
      inicio('wg-m-grande', [par(p.hoyGrande()), par(hoyGrande(), true)], false),
      standby,
      bloqueo,
    );

    // La cuenta viva: cada minuto, con una página de estas a la vista, se vuelve a dibujar, como hace iOS solo.
    let minuto = ahora();
    setInterval(() => {
      if (ahora() === minuto) return;
      minuto = ahora();
      if (raiz.querySelector('.wg-vista.activa[class*="wg-m-"]')) o.repintar();
    }, 1000);

    return {
      // La hora de la tardecita (en minutos del día); sin hora, la de siempre (21:47). Desde ahí corre sola.
      hora(min) {
        s.hora = min == null ? TARDECITA : min;
        s.desde = Date.now();
        minuto = ahora();
        o.repintar();
      },
      confirmar() { const b = bloqueo.querySelector('.wg-si'); if (b) b.click(); },
    };
  }

  return { crear };
})();
