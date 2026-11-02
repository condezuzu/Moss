// El saludo del día, para aprobar (spec/saludo.md): la frase de arriba de Inicio, con la regla de verdad
// (src/dominio/saludo.ts) y con lo que la galería tiene de la persona. Y una hoja para juzgarla: varios días
// de ejemplo, la hora, abrir de nuevo y todo lo que fue diciendo en dos semanas. La hoja deja a la vista el
// Inicio de verdad, así se ve la frase donde iría.

const SeccionSaludo = (() => {
  const CSS = `
.in-saludo { margin: 11px 0 0; min-height: calc(2 * 1.38em); font: 300 16.5px/1.38 var(--texto); color: rgba(239, 230, 207, 0.88); text-wrap: pretty; transition: opacity 0.18s ease; }
.in-saludo.sale { opacity: 0; }
.in-saludo.entra { animation: sl-entra 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes sl-entra { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.tel .sl { position: absolute; left: 0; right: 0; top: calc(var(--arriba) + 136px); bottom: 0; z-index: 20; display: flex; flex-direction: column; background: #0f1631; border-top: 1px solid rgba(232, 196, 106, 0.3); border-radius: 26px 26px 0 0; color: var(--tinta); box-shadow: 0 -18px 50px rgba(1, 2, 6, 0.55); animation: sl-sube 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sl[hidden] { display: none; }
.sl.saliendo { animation: sl-baja 0.3s cubic-bezier(0.5, 0, 0.9, 0.6) both; pointer-events: none; }
@keyframes sl-sube { from { transform: translateY(100%); } to { transform: none; } }
@keyframes sl-baja { to { transform: translateY(100%); } }
.sl svg { stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.sl-cuerpo { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px 18px calc(var(--abajo) + 20px); display: grid; align-content: start; gap: 14px; scrollbar-width: none; }
.sl-cuerpo::-webkit-scrollbar { display: none; }
.sl-grupo { margin: 0 0 7px; font: 400 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.58); }
.sl-dias { display: flex; flex-wrap: wrap; gap: 6px; }
.sl-dia { appearance: none; cursor: pointer; padding: 7px 11px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.14); background: rgba(239, 230, 207, 0.04); color: rgba(239, 230, 207, 0.78); font: 400 12.5px/1.15 var(--texto); transition: border-color 0.2s, color 0.2s, background 0.2s; }
.sl-dia[aria-pressed='true'] { border-color: rgba(232, 196, 106, 0.7); color: var(--oro-claro); background: rgba(232, 196, 106, 0.1); }
.sl-hora { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 14px; }
.sl-hora b { font: 400 22px/1 var(--numeros); font-variant-numeric: tabular-nums; color: #fbf2d9; min-width: 58px; }
.sl-hora input { width: 100%; height: 28px; margin: 0; accent-color: var(--oro); }
.sl-acciones { display: flex; flex-wrap: wrap; gap: 7px; }
.sl-accion { appearance: none; cursor: pointer; padding: 9px 13px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.16); background: none; color: rgba(239, 230, 207, 0.82); font: 400 13px/1 var(--texto); transition: background 0.2s, border-color 0.2s, opacity 0.2s; }
.sl-accion:active { background: rgba(239, 230, 207, 0.08); }
.sl-accion[disabled] { opacity: 0.35; cursor: default; }
.sl-accion.principal { border-color: rgba(232, 196, 106, 0.6); background: rgba(232, 196, 106, 0.12); color: var(--oro-claro); }
.sl-nota { margin: 8px 0 0; min-height: 2.8em; font: 400 12.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.62); animation: sl-aparece 0.3s ease both; }
.sl-por { margin: 0; font: 400 11.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.5); animation: sl-aparece 0.3s ease both; }
.sl-por code { font: 400 11px/1 var(--mono); color: rgba(239, 230, 207, 0.62); }
@keyframes sl-aparece { from { opacity: 0; } to { opacity: 1; } }
.sl-ajustes { display: flex; flex-wrap: wrap; gap: 12px 14px; }
.sl-ajustes .grupo { gap: 5px; }
.sl-ajustes .grupo > span { font-size: 10px; letter-spacing: 0.13em; }
.sl-ajustes .segmento button { padding: 6px 10px; font-size: 12.5px; }
.sl-dos { padding-top: 14px; border-top: 1px solid rgba(239, 230, 207, 0.08); animation: sl-aparece 0.35s ease both; }
.sl-cuenta { margin: 0 0 10px; font: 400 13px/1.45 var(--texto); color: rgba(239, 230, 207, 0.78); }
.sl-cuenta b { font-weight: 500; color: #fbf2d9; }
.sl-cuenta span { display: block; font-size: 12px; color: rgba(239, 230, 207, 0.55); }
.sl-lista h5 { margin: 14px 0 3px; font: 500 12.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.7); }
.sl-lista h5::first-letter { text-transform: uppercase; }
.sl-lista ul { margin: 0; padding: 0; list-style: none; }
.sl-lista li { display: grid; grid-template-columns: 38px minmax(0, 1fr); gap: 8px; padding: 6px 0; border-top: 1px solid rgba(239, 230, 207, 0.06); }
.sl-lista li time { padding-top: 2px; font: 400 11.5px/1.2 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.48); }
.sl-lista li span { font: 300 14px/1.36 var(--texto); color: rgba(239, 230, 207, 0.88); }
.sl-lista li.nuevo { animation: sl-entra 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .in-saludo.entra, .sl-lista li.nuevo { animation: sl-aparece 0.2s ease both; }
  .tel .sl, .sl.saliendo { animation-duration: 0.01s; }
}
`;

  const hm = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const TODOS = [0, 1, 2, 3, 4, 5, 6];
  const META = { kcal: 2200, proteina: 150, carbohidratos: 230, grasas: 70 };
  const HORAS_DE_COMIDA = { desayuno: hm('8:00'), almuerzo: hm('13:00'), merienda: hm('17:00'), cena: hm('21:00') };
  const NECESIDAD = 480;
  const LATENCIA = 15;
  const LO_DE_SIEMPRE = { dormirse: 330, despertar: 795 };
  const FIN_DE_SEMANA = { dormirse: 390, despertar: 885 };
  const habitualDe = (clave) => ([0, 6].includes(Fechas.diaDeLaSemana(clave)) ? FIN_DE_SEMANA : LO_DE_SIEMPRE);
  const comidaDe = (comida, hora, kcal, proteina) => ({ comida, hora: typeof hora === 'string' ? hm(hora) : hora, kcal, proteina });
  const fuerza = (hora, dias = TODOS) => ({ dias, hora: hm(hora), minutos: 60, tipo: 'fuerza' });
  const hoy = () => Datos.HOY;
  const elDia = Fechas.diaDeLaSemana(Datos.HOY);
  const ayerBien = { kcal: 2010, meta: META.kcal };

  // Los días de ejemplo: lo que Moss sabría, con la hora en que conviene mirarlos. Lo anotado aparece según
  // la hora; `hecha` es lo que Ascent confirma una vez terminada la sesión.
  const EJEMPLOS = [
    { id: 'pocoEntrena', nombre: 'Durmió poco y entrena hoy', ahora: hm('7:40'), anoche: { dormido: hm('5:35') }, deuda: 70, entreno: fuerza('18:30'), ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:15', 450, 28), comidaDe('almuerzo', '13:00', 720, 42), comidaDe('merienda', '16:10', 260, 12), comidaDe('cena', '20:45', 640, 48)] },
    { id: 'yaEntreno', nombre: 'Ya entrenó y le falta proteína', ahora: hm('20:10'), anoche: { dormido: hm('7:30') }, deuda: 20, entreno: fuerza('17:30'), hecha: true, ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:00', 420, 16), comidaDe('almuerzo', '12:45', 760, 26), comidaDe('merienda', '15:30', 300, 8), comidaDe('cena', '21:15', 700, 40)] },
    { id: 'descanso', nombre: 'Día de descanso, va bien', ahora: hm('13:40'), anoche: { dormido: hm('7:50') }, deuda: 10, entreno: fuerza('18:30', TODOS.filter((d) => d !== elDia)), ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:10', 480, 32), comidaDe('almuerzo', '13:10', 760, 48), comidaDe('merienda', '17:00', 230, 15), comidaDe('cena', '21:00', 680, 50)] },
    { id: 'pasoAyer', nombre: 'Se pasó ayer', ahora: hm('8:20'), anoche: { dormido: hm('7:05') }, deuda: 25, ayer: { kcal: 2950, meta: META.kcal },
      comidas: [comidaDe('desayuno', '8:40', 430, 26), comidaDe('almuerzo', '13:05', 700, 44), comidaDe('merienda', '17:00', 220, 14), comidaDe('cena', '21:00', 690, 46)] },
    { id: 'pasoHoy', nombre: 'Se pasó hoy', ahora: hm('21:30'), anoche: { dormido: hm('7:40') }, deuda: 15, ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:00', 520, 30), comidaDe('almuerzo', '13:20', 980, 44), comidaDe('merienda', '17:10', 380, 10), comidaDe('cena', '21:00', 1050, 45)] },
    { id: 'sinSueno', nombre: 'Sin datos de sueño', ahora: hm('9:15'), anoche: null, habitual: null, deuda: null, entreno: fuerza('19:00'), ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:30', 400, 24), comidaDe('almuerzo', '13:00', 720, 42), comidaDe('merienda', '16:50', 240, 12), comidaDe('cena', '21:10', 680, 50)] },
    { id: 'primerDia', nombre: 'El primer día', ahora: hm('10:00'), anoche: null, habitual: null, deuda: null, diasConDatos: 0, ayer: null,
      comidas: [comidaDe('desayuno', '10:30', 420, 22), comidaDe('almuerzo', '13:30', 720, 40), comidaDe('merienda', '17:00', 230, 12), comidaDe('cena', '21:00', 680, 45)] },
    { id: 'noche', nombre: 'Noche, la cama cerca', ahora: hm('22:05'), anoche: { dormido: hm('6:40') }, deuda: 95, entreno: fuerza('7:00', [(elDia + 1) % 7]), ayer: ayerBien,
      comidas: [comidaDe('desayuno', '8:00', 460, 30), comidaDe('almuerzo', '13:00', 760, 46), comidaDe('merienda', '17:00', 240, 14), comidaDe('cena', '20:50', 700, 52)] },
  ];

  // Lo que Moss sabría de un día a una hora, con las reglas de la app: lineasDelDia y horasDeSueno.
  function delDia(e, ahora, aj) {
    const dia = e.dia || hoy();
    const hechas = [...e.comidas.filter((c) => c.hora <= ahora), ...(e.anotadasAhora || [])];
    const comido = hechas.reduce((t, c) => ({ kcal: t.kcal + c.kcal, proteina: t.proteina + c.proteina, carbohidratos: t.carbohidratos + c.kcal * 0.11, grasas: t.grasas + c.kcal * 0.03 }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
    const anotado = {};
    hechas.forEach((c) => { anotado[c.comida] = { hora: anotado[c.comida] ? anotado[c.comida].hora : c.hora, proteina: (anotado[c.comida] ? anotado[c.comida].proteina : 0) + c.proteina, kcal: (anotado[c.comida] ? anotado[c.comida].kcal : 0) + c.kcal }; });
    const deuda = e.deuda == null ? null : e.deuda;
    const horas = e.habitual === null ? null : Avisos.horasDeSueno(dia, { habitual: habitualDe, necesidad: NECESIDAD, deuda, latencia: LATENCIA });
    const entreno = e.entreno || null;
    const sesiones = AlrededorDelEntreno.sesionesDelDia(entreno, dia);
    return {
      dia, ahora, numeros: aj.numeros, sinDeficit: aj.sinDeficit, diasConDatos: e.diasConDatos == null ? 40 : e.diasConDatos,
      meta: META, comido, anotadas: [...new Set(hechas.map((c) => c.comida))], horaDeComida: HORAS_DE_COMIDA,
      ayer: e.ayer || null, anoche: e.anoche, necesidad: NECESIDAD, deuda, horas,
      sesiones: sesiones.map((x) => Object.assign({}, x, { hecha: !!e.hecha && ahora >= x.inicio + x.minutos })),
      lineas: AlrededorDelEntreno.lineasDelDia({
        ahora, sesiones, horaDeComida: HORAS_DE_COMIDA, anotado, meta: META, comido, comidasHabituales: 4, pesoKg: 76, edad: 31,
        despertar: horas ? horas.despertar : null, dormir: horas ? horas.dormir : null, cafeinaPorToma: e.cafe == null ? null : e.cafe, sinDeficit: aj.sinDeficit,
      }),
      entrenaAlgunDia: !!entreno, sesionManana: (AlrededorDelEntreno.sesionesDelDia(entreno, Fechas.sumarDias(dia, 1))[0] || { inicio: null }).inicio,
    };
  }

  // Dos semanas de una persona de mentira que vive como cualquiera: entrena lunes, miércoles y viernes,
  // duerme de todo, algún día come de más y algún día no anota nada. Abre Moss unas cuatro veces por día.
  function dosSemanas(semilla, aj) {
    const r = Datos.azar(1009 + semilla * 97);
    const entre = (a, b) => Math.round(a + r() * (b - a));
    const dias = [];
    for (let i = 14; i >= 1; i--) {
      const dia = Fechas.sumarDias(Datos.HOY, -i);
      const anterior = dias[dias.length - 1];
      const deMas = r() < 0.16;
      const comidas = i === 5 ? [] : [
        comidaDe('desayuno', entre(470, 520), entre(350, 540), entre(18, 34)),
        comidaDe('almuerzo', entre(770, 830), entre(620, 850), entre(30, 55)),
        ...(r() < 0.75 ? [comidaDe('merienda', entre(1000, 1050), entre(150, 320), entre(6, 20))] : []),
        comidaDe('cena', entre(1240, 1290), deMas ? entre(1150, 1500) : entre(520, 800), entre(30, 55)),
      ];
      const kcal = comidas.reduce((t, c) => t + c.kcal, 0);
      const sinNoche = r() < 0.07;
      dias.push({
        dia, comidas, kcal, entreno: fuerza('18:30', [1, 3, 5]), hecha: r() < 0.5,
        anoche: sinNoche ? null : { dormido: entre(335, 525) },
        deuda: entre(0, 110),
        ayer: anterior ? { kcal: anterior.kcal, meta: META.kcal } : ayerBien,
        aberturas: [entre(445, 490), entre(795, 845), entre(1015, 1075), entre(1270, 1345), ...(r() < 0.3 ? [entre(600, 650)] : [])].sort((a, b) => a - b),
      });
    }
    let historial = [];
    const filas = [];
    dias.forEach((e) => {
      e.aberturas.forEach((ahora) => {
        const d = delDia(e, ahora, aj);
        const saludo = Saludo.saludoDelDia(d, historial, semilla);
        if (saludo.nuevo) filas.push({ dia: e.dia, ahora, saludo });
        historial = Saludo.recordar(historial, saludo, d);
      });
    });
    return { filas, historial };
  }

  // La frase cambia con un fundido corto: nada aparece ni desaparece de golpe. Si es la misma, no se toca.
  function mostrar(nodo, texto) {
    if (nodo.dataset.texto === texto) return;
    const antes = nodo.dataset.texto;
    nodo.dataset.texto = texto;
    clearTimeout(nodo.espera);
    const poner = () => {
      nodo.textContent = texto;
      nodo.classList.remove('sale', 'entra');
      void nodo.offsetWidth;
      nodo.classList.add('entra');
    };
    if (!antes) { poner(); return; }
    nodo.classList.remove('entra');
    nodo.classList.add('sale');
    nodo.espera = setTimeout(poner, 180);
  }

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono, horaMin, duracion } = u;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    const formato = () => ({
      numero: (n) => numero(n), hora: horaMin, duracion, comida: (c) => tx('saludo.comidas.' + c), dia: (d) => tx('fecha.dias.' + d),
    });
    const textoDe = (saludo) => {
      const [situacion, forma] = saludo.codigo.split('.');
      return Saludo.armar(tx(`saludo.frases.${situacion}.${forma}`), saludo.valores, formato());
    };

    // ------------------------------------------------------------ lo de Inicio, con la persona de la galería
    let historialVivo = null;
    function delDiaEnVivo(primerDia) {
      const c = opciones.comida;
      const noches = opciones.noches();
      const edad = Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento;
      const necesidad = Sueno.necesidad(edad);
      const ultimas = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, Datos.HOY, 14), necesidad);
      const deuda = ultimas ? ultimas.minutos : null;
      const horas = noches.length ? Avisos.horasDeSueno(Datos.HOY, { habitual: (clave) => SinReloj.habitualDe(noches, clave), necesidad, deuda, latencia: LATENCIA }) : null;
      const m = c.meta;
      const meta = { kcal: m.kcal, proteina: m.p, carbohidratos: m.c, grasas: m.g };
      const t = c.totalDe(0);
      const comido = { kcal: t.kcal, proteina: t.p, carbohidratos: t.c, grasas: t.g };
      const registros = c.comidasDeHoy();
      const anotado = {};
      registros.forEach((r) => { anotado[r.tipo] = { hora: r.hora, proteina: r.valores.p, kcal: r.valores.kcal }; });
      const noche = noches.find((n) => n.clave === Datos.HOY) || null;
      const anoche = noche && noche.confianza.duracion !== 'baja'
        ? { dormido: noche.dormido, cara: opciones.cara(noche.clave), incompleta: Sueno.pareceIncompleta(noche, Sueno.ultimasNoches(noches, Fechas.sumarDias(noche.clave, -1), 14)) } : null;
      const sinDeficit = opciones.sinDeficit();
      const entreno = c.entreno;
      const sesiones = AlrededorDelEntreno.sesionesDelDia(entreno, Datos.HOY);
      const ayer = c.kcalPorDia().find((x) => x.fecha === Fechas.sumarDias(Datos.HOY, -1));
      const base = {
        dia: Datos.HOY, ahora: Datos.AHORA_MIN, numeros: !tel.classList.contains('sin-numeros'), sinDeficit, necesidad, horaDeComida: Comidas.HORA_TIPICA,
      };
      if (primerDia) {
        return Object.assign(base, { diasConDatos: 0, meta, comido: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 }, anotadas: [], ayer: null, anoche: null, deuda: null, horas: null, sesiones: [], lineas: [], entrenaAlgunDia: false, sesionManana: null });
      }
      return Object.assign(base, {
        diasConDatos: c.kcalPorDia().length, meta, comido, anotadas: registros.map((r) => r.tipo),
        ayer: { kcal: ayer ? ayer.kcal : 0, meta: meta.kcal }, anoche, deuda, horas, sesiones,
        lineas: !entreno.ver ? [] : AlrededorDelEntreno.lineasDelDia({
          ahora: Datos.AHORA_MIN, sesiones, horaDeComida: Comidas.HORA_TIPICA, anotado, meta, comido, comidasHabituales: 4, pesoKg: opciones.persona().pesoHoy, edad,
          despertar: horas ? horas.despertar : null, dormir: horas ? horas.dormir : null, cafeinaPorToma: null, sinDeficit,
        }),
        entrenaAlgunDia: true, sesionManana: (AlrededorDelEntreno.sesionesDelDia(entreno, Fechas.sumarDias(Datos.HOY, 1))[0] || { inicio: null }).inicio,
      });
    }

    // ------------------------------------------------------------ la hoja para probarla
    const raiz = el('section', 'sl');
    raiz.hidden = true;
    raiz.setAttribute('role', 'dialog');
    tel.appendChild(raiz);
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());

    const s = {
      ejemplo: EJEMPLOS[0], ahora: EJEMPLOS[0].ahora, anotadas: [], semilla: 1, numeros: true, sinDeficit: false,
      vida: null, historial: [], saludo: null, deHoy: [], nota: '', cierre: 0,
    };
    const ajustes = () => ({ numeros: s.numeros, sinDeficit: s.sinDeficit });
    const ejemploDeAhora = () => Object.assign({}, s.ejemplo, { anotadasAhora: s.anotadas });

    function vivirDosSemanas() {
      s.vida = dosSemanas(s.semilla, ajustes());
      s.historial = s.vida.historial;
      s.deHoy = [];
      s.saludo = null;
    }
    // Abre Moss a esta hora: dice lo que corresponde y queda en el historial si es nuevo.
    function abrirMoss() {
      const d = delDia(ejemploDeAhora(), s.ahora, ajustes());
      const saludo = Saludo.saludoDelDia(d, s.historial, s.semilla);
      s.historial = Saludo.recordar(s.historial, saludo, d);
      s.saludo = saludo;
      if (saludo.nuevo) s.deHoy.unshift({ ahora: s.ahora, saludo, nuevo: true });
      return saludo;
    }
    function ponerHoja() {
      pintar();
      opciones.alDecir();
    }

    const proxima = () => {
      const anotadas = new Set([...s.ejemplo.comidas.filter((c) => c.hora <= s.ahora).map((c) => c.comida), ...s.anotadas.map((c) => c.comida)]);
      return s.ejemplo.comidas.find((c) => !anotadas.has(c.comida)) || null;
    };
    const elegirDia = (e) => {
      s.ejemplo = e;
      s.ahora = e.ahora;
      s.anotadas = [];
      vivirDosSemanas();
      abrirMoss();
      s.nota = 'Es la primera vez que abre Moss hoy. Antes de este día vivió las dos semanas de abajo: lo que ya dijo cuenta.';
      ponerHoja();
    };
    const abrirDeNuevo = () => {
      s.ahora += 5;
      const saludo = abrirMoss();
      s.nota = saludo.nuevo ? 'Cambió: algo que decir apareció justo ahora.' : 'Igual que recién: pasaron 5 minutos y no hay nada nuevo que decir. Cambia si anotas algo o si pasa un rato.';
      ponerHoja();
    };
    const pasarRato = () => {
      s.ahora = Math.min(MAXIMO, s.ahora + 120);
      const saludo = abrirMoss();
      s.nota = saludo.nuevo ? 'Pasaron dos horas: cambia, y no repite lo que acaba de decir ni su tema.' : 'Pasaron dos horas, pero no hay otra cosa para decir.';
      ponerHoja();
    };
    const anotarProxima = () => {
      const c = proxima();
      if (!c) return;
      s.anotadas = [...s.anotadas, Object.assign({}, c, { hora: s.ahora })];
      s.ahora += 2;
      const saludo = abrirMoss();
      s.nota = `Anotó ${tx('saludo.comidas.' + c.comida)}: ${saludo.nuevo ? 'hay algo distinto que decir, aunque no haya pasado un rato.' : 'sigue valiendo lo que decía.'}`;
      ponerHoja();
    };
    const ponerHora = (minutos) => {
      s.ahora = minutos;
      const saludo = abrirMoss();
      s.nota = saludo.nuevo ? 'A esa hora dice otra cosa.' : 'A esa hora sigue valiendo lo mismo.';
      ponerHoja();
    };
    const MINIMO = hm('4:30');
    const MAXIMO = hm('2:30') + 24 * 60;

    function segmento(titulo, valores, activo, alElegir) {
      const g = el('div', 'grupo');
      const seg = el('div', 'segmento');
      valores.forEach(([valor, nombre]) => {
        const b = el('button', null, nombre);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(valor === activo));
        b.addEventListener('click', (ev) => { ev.stopPropagation(); alElegir(valor); });
        seg.appendChild(b);
      });
      g.append(el('span', null, titulo), seg);
      return g;
    }

    const NOMBRE_DE_TEMA = { primero: 'el primer día', sueno: 'el sueño', entreno: 'el entrenamiento', antes: 'qué comer antes de entrenar', despues: 'qué comer después de entrenar', comida: 'la comida', cama: 'la cama', dia: 'el día', nada: 'nada en especial' };
    const NOMBRE_DE_FORMA = { dice: 'una observación', sugiere: 'una sugerencia', pregunta: 'una pregunta' };

    function fila(ahora, saludo, nuevo) {
      const li = el('li', nuevo ? 'nuevo' : null);
      li.append(el('time', null, horaMin(ahora)), el('span', null, textoDe(saludo)));
      return li;
    }

    let scrollDeLaHoja = 0;
    function pintar() {
      const anterior = raiz.querySelector('.sl-cuerpo');
      if (anterior) scrollDeLaHoja = anterior.scrollTop;
      raiz.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', 'El saludo del día'), boton('hb-cerrar', icono('cerrar'), cerrar, tx('comida.cerrar')));
      const cuerpo = el('div', 'sl-cuerpo');

      const dias = el('div');
      dias.appendChild(el('h4', 'sl-grupo', 'Un día de ejemplo'));
      const chips = el('div', 'sl-dias');
      EJEMPLOS.forEach((e) => {
        const b = boton('sl-dia', e.nombre, () => elegirDia(e));
        b.setAttribute('aria-pressed', String(e === s.ejemplo));
        chips.appendChild(b);
      });
      dias.appendChild(chips);

      const hora = el('div');
      hora.appendChild(el('h4', 'sl-grupo', 'La hora'));
      const fHora = el('div', 'sl-hora');
      const salida = el('b', null, horaMin(s.ahora));
      const rango = el('input');
      rango.type = 'range';
      rango.min = MINIMO;
      rango.max = MAXIMO;
      rango.step = 5;
      rango.value = s.ahora;
      rango.setAttribute('aria-label', 'La hora');
      rango.addEventListener('input', () => { salida.textContent = horaMin(Number(rango.value)); });
      rango.addEventListener('change', () => ponerHora(Number(rango.value)));
      fHora.append(salida, rango);
      hora.appendChild(fHora);

      const abrir = el('div');
      const acciones = el('div', 'sl-acciones');
      const anotar = boton('sl-accion', 'Anotar la próxima comida', anotarProxima);
      anotar.disabled = !proxima();
      acciones.append(boton('sl-accion principal', 'Abrir de nuevo', abrirDeNuevo), boton('sl-accion', 'Dos horas después', pasarRato), anotar);
      abrir.appendChild(acciones);
      abrir.appendChild(el('p', 'sl-nota', s.nota));
      if (s.saludo) {
        const por = el('p', 'sl-por');
        por.innerHTML = `Es ${NOMBRE_DE_FORMA[s.saludo.forma]} sobre ${s.saludo.temas.map((t) => NOMBRE_DE_TEMA[t]).join(' y ')}: <code>${s.saludo.codigo}</code>`;
        abrir.appendChild(por);
      }

      const aj = el('div', 'sl-ajustes');
      aj.append(
        segmento('Idioma', [['es', 'ES'], ['en', 'EN']], opciones.idioma(), (v) => opciones.ponerIdioma(v)),
        segmento('Los números', [[true, 'Visibles'], [false, 'Ocultos']], s.numeros, (v) => { s.numeros = v; elegirDia(s.ejemplo); }),
        segmento('Cuidados', [[false, 'Ninguno'], [true, 'Sin déficit']], s.sinDeficit, (v) => { s.sinDeficit = v; elegirDia(s.ejemplo); }),
      );

      const dos = el('div', 'sl-dos');
      dos.appendChild(el('h4', 'sl-grupo', 'Lo que fue diciendo en dos semanas'));
      const filas = s.vida.filas;
      const distintas = new Set(filas.map((f) => f.saludo.codigo)).size;
      const repetidas = filas.length - distintas;
      const cuenta = el('p', 'sl-cuenta');
      const preguntas = filas.filter((f) => f.saludo.forma === 'pregunta').length;
      const sugerencias = filas.filter((f) => f.saludo.forma === 'sugiere').length;
      const cruzan = filas.filter((f) => f.saludo.temas.length > 1).length;
      cuenta.innerHTML = `<b>${filas.length} saludos, ${distintas} frases distintas</b>: ${repetidas ? `${repetidas} ${repetidas === 1 ? 'repetida' : 'repetidas'}` : 'ninguna se repite'}.`
        + `<span>${preguntas} preguntas, ${sugerencias} sugerencias, ${filas.length - preguntas - sugerencias} observaciones; ${cruzan} cruzan dos temas.</span>`;
      dos.appendChild(cuenta);
      const otras = boton('sl-accion', 'Otras dos semanas', () => { s.semilla += 1; elegirDia(s.ejemplo); });
      dos.appendChild(otras);
      const lista = el('div', 'sl-lista');
      if (s.deHoy.length) {
        lista.appendChild(el('h5', null, 'Hoy, en este ejemplo'));
        const ul = el('ul');
        s.deHoy.forEach((f, i) => { ul.appendChild(fila(f.ahora, f.saludo, i === 0 && f.nuevo)); f.nuevo = false; });
        lista.appendChild(ul);
      }
      const porDia = new Map();
      filas.forEach((f) => porDia.set(f.dia, [...(porDia.get(f.dia) || []), f]));
      [...porDia.keys()].reverse().forEach((dia) => {
        const p = u.partes(dia);
        lista.appendChild(el('h5', null, `${tx('fecha.dias.' + p.dia)} ${tx('fecha.corta', { num: p.num, mes: tx('fecha.mesesCortos.' + p.mes) })}`));
        const ul = el('ul');
        porDia.get(dia).forEach((f) => ul.appendChild(fila(f.ahora, f.saludo, false)));
        lista.appendChild(ul);
      });
      dos.appendChild(lista);

      cuerpo.append(dias, hora, abrir, aj, dos);
      raiz.append(cab, cuerpo);
      cuerpo.scrollTop = scrollDeLaHoja;
    }

    function abrir() {
      clearTimeout(s.cierre);
      raiz.hidden = false;
      raiz.classList.remove('saliendo');
      scrollDeLaHoja = 0;
      elegirDia(s.ejemplo);
    }
    function cerrar() {
      if (raiz.hidden) return;
      raiz.classList.add('saliendo');
      s.cierre = setTimeout(() => { raiz.hidden = true; raiz.classList.remove('saliendo'); }, 300);
      s.saludo = null;
      opciones.alDecir();
    }

    return {
      abrir, cerrar,
      get abierta() { return !raiz.hidden && !raiz.classList.contains('saliendo'); },
      // Lo que va arriba de Inicio: el del día de ejemplo con la hoja abierta; si no, el de la persona de la galería.
      deInicio(primerDia) {
        if (s.saludo) return textoDe(s.saludo);
        const d = delDiaEnVivo(primerDia);
        if (historialVivo === null) historialVivo = dosSemanas(1, { numeros: true, sinDeficit: false }).historial;
        const saludo = Saludo.saludoDelDia(d, historialVivo, 'moss');
        historialVivo = Saludo.recordar(historialVivo, saludo, d);
        return textoDe(saludo);
      },
      pintar() { if (!raiz.hidden) pintar(); },
      // Para las capturas.
      dia(id) { elegirDia(EJEMPLOS.find((e) => e.id === id)); },
      hora: (t) => ponerHora(hm(t) + (hm(t) < MINIMO ? 24 * 60 : 0)),
      abrirDeNuevo, pasarRato, anotarProxima,
      numeros(v) { s.numeros = v; elegirDia(s.ejemplo); },
      sinDeficit(v) { s.sinDeficit = v; elegirDia(s.ejemplo); },
      bajar(selector) {
        const cuerpo = raiz.querySelector('.sl-cuerpo');
        const n = raiz.querySelector(selector);
        if (cuerpo && n) cuerpo.scrollTop += n.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top - 8;
      },
      subir() { const cuerpo = raiz.querySelector('.sl-cuerpo'); if (cuerpo) cuerpo.scrollTop = 0; },
      otrasDosSemanas() { s.semilla += 1; elegirDia(s.ejemplo); },
      texto: () => (s.saludo ? textoDe(s.saludo) : null),
      frases: () => s.vida.filas.map((f) => ({ dia: f.dia, hora: horaMin(f.ahora), texto: textoDe(f.saludo), codigo: f.saludo.codigo })),
    };
  }

  return { crear, mostrar };
})();
