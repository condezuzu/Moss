// La página de revisión: datos de mentira, controles, las seis secciones con el «+» en el medio de
// la barra (Inicio, Comida, Progreso, Sueño, Hábitos con el cielo, su editor y «Tu mes», y Perfil),
// la entrada a la app con los primeros hábitos y el catálogo. CATALOGO, TEXTOS, SHADERS, ALIMENTOS y
// los módulos de la app los inyecta galeria/construir.mjs desde src/ y assets/ (una sola fuente).

(() => {
  // La Lira de la demo sale del catálogo; esta copia es solo por si el armado viene sin él.
  const LIRA_RESPALDO = {
    id: 'lyra', iau: 'Lyr', tipo: 'constelacion',
    nombres: { la: 'Lyra', es: 'Lira', en: 'Lyra' },
    estrellas: [
      { id: 'vega', nombre: 'Vega', bayer: 'α Lyr', hr: 7001, ra: 279.2346, dec: 38.7836, mag: 0.03 },
      { id: 'sulafat', nombre: 'Sulafat', bayer: 'γ Lyr', hr: 7178, ra: 284.7358, dec: 32.6894, mag: 3.24 },
      { id: 'sheliak', nombre: 'Sheliak', bayer: 'β Lyr', hr: 7106, ra: 282.52, dec: 33.3628, mag: 3.45 },
      { id: 'delta2-lyr', nombre: 'δ² Lyr', bayer: 'δ² Lyr', hr: 7139, ra: 283.6258, dec: 36.8989, mag: 4.3 },
      { id: 'zeta1-lyr', nombre: 'ζ¹ Lyr', bayer: 'ζ¹ Lyr', hr: 7056, ra: 281.1933, dec: 37.605, mag: 4.36 },
      { id: 'epsilon1-lyr', nombre: 'ε¹ Lyr', bayer: 'ε¹ Lyr', hr: 7051, ra: 281.085, dec: 39.67, mag: 5.06 },
    ],
    lineas: [[0, 4], [0, 5], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]],
  };

  const lista = (typeof CATALOGO !== 'undefined' && CATALOGO && CATALOGO.constelaciones) || [];
  const LIRA = lista.find((c) => c.id === 'lyra') || LIRA_RESPALDO;

  const ICONOS = {
    loto: '<path d="M12 4c2 2.5 2 6.5 0 9-2-2.5-2-6.5 0-9z"/><path d="M12 13c-3-.5-6-2.5-7-6 3.5 0 6 2 7 6zm0 0c3-.5 6-2.5 7-6-3.5 0-6 2-7 6z"/><path d="M5 17h14"/>',
    luna: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    libro: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
    pluma: '<path d="M19.5 4.5C13 5.5 8 10 6.5 17.5"/><path d="M19.5 4.5c-.5 6-4.5 10.5-11 12.5"/><path d="M6.5 17.5 4 20"/>',
    huellas: '<ellipse cx="8.5" cy="7.5" rx="2.6" ry="4"/><ellipse cx="15.5" cy="13.5" rx="2.6" ry="4"/><path d="M7.3 14h2.4M14.3 20h2.4"/>',
    gota: '<path d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5z"/>',
    pesa: '<path d="M3.5 9v6M6.5 7v10M17.5 7v10M20.5 9v6M6.5 12h11"/>',
    circulo: '<circle cx="12" cy="12" r="7"/>',
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/>',
    nota: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    corazon: '<path d="M12 19s-7-4.3-7-9.2A4 4 0 0 1 12 7.5a4 4 0 0 1 7 2.3C19 14.7 12 19 12 19z"/>',
    sol: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
    balanza: '<rect x="4" y="4.5" width="16" height="15" rx="3.5"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.4-1.6"/>',
  };
  // Los hábitos de la app guardan íconos de SF Symbols (Editor.tsx): los que la galería ya dibujaba
  // van con su dibujo, y el resto viene de SeccionHabitos.
  Object.entries(SeccionHabitos.DE_LA_GALERIA).forEach(([nuestro, sf]) => { ICONOS[sf] = ICONOS[nuestro]; });
  Object.assign(ICONOS, SeccionHabitos.ICONOS);
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ICONOS.circulo}</svg>`;

  // Lo dormido anoche y los pasos de hoy salen de lo de mentira, como saldrían de Salud.
  const DORMIDO_ANOCHE = Math.round((Datos.NOCHES.find((n) => n.clave === Datos.HOY) || { dormido: 452 }).dormido);
  const PASOS_DE_HOY = 6240;
  // Hasta dónde sube la cámara del cielo con Ascent arriba: menos que el dedo, porque está más lejos.
  const CAMARA_DE_ASCENT = 1;
  let subidaDeAscent = 0;
  // Si la cámara es de Ascent mientras sube: desde tu universo, se queda donde está.
  let camaraConAscent = false;
  // Los seis del miércoles, con los ids de la persona de mentira (Datos.HABITOS): así el editor y
  // «Tu mes» saben de cuál se trata.
  const habitosLira = () => [
    { id: 'meditar', nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'loto', encendido: true },
    { id: 'dormir', nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'luna', encendido: true, auto: 'sueno', valor: DORMIDO_ANOCHE, meta: 420 },
    { id: 'leer', nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'libro', encendido: true },
    { id: 'escribir', nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pluma', encendido: false },
    { id: 'pasos', nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'huellas', encendido: false, auto: 'pasos', valor: PASOS_DE_HOY, meta: 8000 },
    { id: 'agua', nombre: { es: 'Agua 2 L', en: 'Water 2 L' }, icono: 'gota', encendido: false },
  ];

  const POZO = [
    { nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'loto' },
    { nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'libro' },
    { nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'huellas', auto: 'pasos', valor: 6240, meta: 8000 },
    { nombre: { es: 'Gimnasio', en: 'Gym' }, icono: 'pesa' },
    { nombre: { es: 'Agua 2 L', en: 'Water 2 L' }, icono: 'gota' },
    { nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pluma' },
    { nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'luna', auto: 'sueno', valor: 452, meta: 420 },
    { nombre: { es: 'Idiomas 15 min', en: 'Languages 15 min' }, icono: 'globo' },
    { nombre: { es: 'Guitarra', en: 'Guitar' }, icono: 'nota' },
    { nombre: { es: 'Estirar 5 min', en: 'Stretch 5 min' }, icono: 'circulo' },
    { nombre: { es: 'Llamar a mamá', en: 'Call mom' }, icono: 'corazon' },
    { nombre: { es: 'Sol de mañana', en: 'Morning sun' }, icono: 'sol' },
    { nombre: { es: 'Gratitud', en: 'Gratitude' }, icono: 'pluma' },
    { nombre: { es: 'Respirar', en: 'Breathe' }, icono: 'loto' },
    { nombre: { es: 'Caminar', en: 'Walk' }, icono: 'huellas' },
    { nombre: { es: 'Sin pantallas 22 h', en: 'No screens 10 pm' }, icono: 'luna' },
    { nombre: { es: 'Fruta', en: 'Fruit' }, icono: 'circulo' },
    { nombre: { es: 'Ordenar 10 min', en: 'Tidy 10 min' }, icono: 'circulo' },
    { nombre: { es: 'Proteína', en: 'Protein' }, icono: 'pesa' },
    { nombre: { es: 'Dibujar', en: 'Sketch' }, icono: 'pluma' },
  ];

  function habitosDeMentira(n) {
    const encendidos = Math.max(1, Math.round(n * 0.6));
    return Array.from({ length: n }, (_, i) => {
      const base = POZO[i % POZO.length];
      return Object.assign({}, base, { encendido: i < encendidos && !(base.auto && i === encendidos - 1) });
    });
  }

  // Semana de mentira: cantidades del ejemplo de la especificación.
  // Semana de mentira: el lunes y el sábado tienen la misma cantidad, igual que el miércoles y
  // el domingo, para ver que cada día recibe una constelación distinta.
  const SEMANA = [
    { dia: 1, total: 4, hechos: 4 },
    { dia: 2, total: 5, hechos: 3 },
    { dia: 3, total: 6, hoy: true },
    { dia: 4, total: 3, hechos: 0 },
    { dia: 5, total: 7, hechos: 0 },
    { dia: 6, total: 4, hechos: 0 },
    { dia: 0, total: 6, hechos: 0 },
  ];

  // Una constelación de `n` estrellas que no esté en `usadas`, las constelaciones primero.
  function elegirConstelacion(n, usadas) {
    const conLineas = (c) => c.estrellas.length === 1 || c.lineas.length > 0;
    return lista.find((x) => x.estrellas.length === n && !usadas.has(x.id) && x.tipo === 'constelacion' && conLineas(x))
      || lista.find((x) => x.estrellas.length === n && !usadas.has(x.id) && conLineas(x)) || null;
  }

  function semanaDeMentira() {
    if (!lista.length) return [];
    const usadas = new Set(['lyra']);
    return SEMANA.map((d) => {
      if (d.hoy) return Object.assign({}, d, { datos: LIRA });
      const c = elegirConstelacion(d.total, usadas);
      if (!c) return null;
      usadas.add(c.id);
      return Object.assign({}, d, { datos: c });
    }).filter(Boolean);
  }
  const SEMANA_DE_FABRICA = semanaDeMentira();
  // La de ahora: cambia si el editor le cambia la cantidad de hábitos a hoy.
  let semana = SEMANA_DE_FABRICA;

  // Los días vividos de la persona de mentira (Datos.DIAS) llevan la constelación de su día de la
  // semana mientras ese día tuvo la misma cantidad de hábitos; antes, otra de esa cantidad que la
  // semana no usa: el día que cambia de cantidad pasa a otra constelación, como en la app.
  (() => {
    const usadas = new Set(SEMANA_DE_FABRICA.map((d) => d.datos.id));
    const antes = new Map();
    Datos.DIAS.forEach((dia) => {
      const ds = Fechas.diaDeLaSemana(dia.clave);
      const n = dia.habitos.length;
      const actual = SEMANA_DE_FABRICA.find((d) => d.dia === ds);
      if (actual && actual.total === n) { dia.constelacion = actual.datos.id; return; }
      if (!antes.has(ds + '/' + n)) {
        const c = elegirConstelacion(n, usadas);
        if (c) usadas.add(c.id);
        antes.set(ds + '/' + n, c ? c.id : null);
      }
      dia.constelacion = antes.get(ds + '/' + n);
    });
  })();
  // Para «Reiniciar»: los hábitos como estaban antes de pasar por el editor.
  const HABITOS_DE_FABRICA = JSON.stringify(Datos.HABITOS);

  const FRASE = {
    texto: { es: 'Nada grande nace de golpe, ni siquiera un racimo de uvas o un higo.', en: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.' },
    autor: { es: 'Epicteto · Disertaciones I.15', en: 'Epictetus · Discourses I.15' },
  };

  // Vibración: navigator.vibrate donde existe (Android). En Safari de iOS 18+ no existe, pero
  // tocar un interruptor nativo hace vibrar al sistema: se usa uno escondido.
  const haptico = (() => {
    let etiqueta = null;
    const preparar = () => {
      if (etiqueta) return etiqueta;
      etiqueta = document.createElement('label');
      etiqueta.setAttribute('aria-hidden', 'true');
      etiqueta.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0';
      const entrada = document.createElement('input');
      entrada.type = 'checkbox';
      entrada.setAttribute('switch', '');
      entrada.tabIndex = -1;
      etiqueta.appendChild(entrada);
      document.body.appendChild(etiqueta);
      return etiqueta;
    };
    return (tipo) => {
      try {
        if (navigator.vibrate) {
          navigator.vibrate(tipo === 'completo' ? [14, 70, 22, 70, 34] : tipo === 'suave' ? 6 : 12);
          return;
        }
        preparar().click();
      } catch (_) { /* sin vibración no pasa nada */ }
    };
  })();

  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTactil = window.matchMedia('(pointer: coarse)').matches;
  const tel = document.getElementById('tel');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let escena;
  // Las secciones y las pestañas se arman después de la escena; hasta entonces, los controles no las miran.
  let comida = null;
  let widgets = null;
  let pestanas = null;
  let inicio = null;
  let mas = null;
  let progreso = null;
  let sueno = null;
  let perfilSec = null;
  let ascent = null;
  let habitosSec = null;
  // Mantener apretada una estrella abre su hábito: el click que llega al soltar no cierra la hoja.
  let mantenido = false;
  try {
    escena = Escena.crear(tel, SHADERS, {
      calidad: 'alta',
      riqueza: 0.6,
      idioma: 'es',
      textos: TEXTOS,
      icono,
      frase: FRASE,
      semana,
      diaSemana: 3,
      diaMes: 21,
      mes: 9,
      movimientoReducido,
      haptico,
      permitirArrastre: () => !esTactil || tel.classList.contains('inmersivo'),
      alCambiar: () => refrescarControles(),
      alMantener: (i) => { mantenido = true; habitosSec.editar(i); },
      // Tocar la estrella de un hábito de comida dice qué la enciende, con un botón a Comida.
      alIrAComida: () => pestanas.ir(1),
    });
  } catch (err) {
    const aviso = document.createElement('div');
    aviso.className = 'error-cielo';
    aviso.textContent = 'Este navegador no pudo dibujar el cielo (' + err.message + '). Probá con Safari o Chrome actualizados.';
    tel.appendChild(aviso);
    console.error(err);
    return;
  }

  function cargarLira() {
    escena.ponerConstelacion(LIRA, habitosLira());
  }

  // ------------------------------------------------------------ la entrada a la app
  let avanceSolo = false;
  // La suscripción (D40) y la guía del cargador: maquetas, para aprobar. La pantalla de pago va al terminar
  // la entrada que se ve desde el principio, y no en los saltos a una pantalla de los otros escenarios.
  let conSuscripcion = false;
  let suscripcion = null;
  let guiaAtajos = null;
  const entrada = Entrada.crear(tel, escena, {
    textos: TEXTOS,
    catalogo: lista,
    icono,
    aspecto: () => tel.clientWidth / Math.max(1, tel.clientHeight),
    avanceSolo: () => avanceSolo,
    alCambiar: () => refrescarControles(),
    // Durante la entrada no hay pestañas; al final, el flum deja en Inicio y ahí se eligen los
    // primeros hábitos.
    alEmpezar: () => tel.classList.add('en-entrada'),
    alSalir: () => tel.classList.remove('en-entrada'),
    llegada: () => { pestanas.ir(0, true); comida.verDia(0); inicio.subir(); return inicio.zona; },
    alTerminar: () => habitosSec.sugeridos(),
    // La pantalla de pago (D40) va después de la meta.
    antesDeTerminar: (seguir) => {
      if (!conSuscripcion) return seguir();
      conSuscripcion = false;
      suscripcion.abrir({ despues: seguir, acceso: 'nueva' });
    },
  });

  // ------------------------------------------------------------ la comida
  const toques = [];
  // Lo calculado de la persona (se rehace cuando algo cambia) y lo encendido en el cielo la última vez.
  let calculada = null;
  let firmaDelCielo = '';
  comida = Comida.crear(tel, escena, {
    textos: TEXTOS,
    alimentos: (typeof ALIMENTOS !== 'undefined' && ALIMENTOS) || [],
    alCambiar: () => refrescarControles(),
    alCambiarComida: () => repintar(900),
    // Cada registro, con los toques que llevó desde el «+» o desde Comida: para compararlos con la especificación.
    alRegistrar: (r) => {
      toques.unshift(r);
      toques.length = Math.min(toques.length, 6);
      const lista = $('#toques ol');
      lista.innerHTML = '';
      toques.forEach((t) => {
        const li = document.createElement('li');
        const texto = document.createElement('span');
        texto.textContent = t.texto;
        const n = document.createElement('b');
        n.textContent = (t.toques === 1 ? '1 toque' : t.toques + ' toques') + (t.escribio ? ' y escribir' : '');
        li.append(texto, n);
        lista.appendChild(li);
      });
      $('#toques .vacio').hidden = true;
    },
  });
  // Lo de la comida pasa en la pestaña Comida: los botones de la galería llevan ahí primero.
  const COMIDA = 1;
  const enLaZona = (fn) => { cerrarHojas(); pestanas.ir(COMIDA); fn(); };
  const conHoja = (fn) => { if (mas.abierta) mas.cerrar(true); pestanas.ir(COMIDA); if (!comida.hojaAbierta && !comida.abrirHoja()) return; fn(); };
  const accionesComida = {
    registrar: () => { if (comida.hojaAbierta) comida.cerrarHoja(); else { cerrarHojas(); pestanas.ir(COMIDA); comida.abrirHoja(); } },
    linea: () => enLaZona(() => { comida.vista('dia'); comida.bajarA('dia'); }),
    semana: () => enLaZona(() => comida.vista('semana')),
    mes: () => enLaZona(() => comida.vista('mes')),
    frutila: () => conHoja(() => escribirDespacio('frutila')),
    ficha: () => conHoja(() => comida.ficha('Banana')),
    rapida: () => conHoja(() => comida.cargaRapida()),
    copiar: () => enLaZona(() => comida.copiarDeAyer('cena')),
    etiqueta: () => conHoja(() => comida.etiqueta()),
    armar: () => enLaZona(() => { comida.verDia(0); comida.armarDia(); comida.bajarA('ahora'); }),
    armarSemana: () => enLaZona(() => { comida.vista('semana'); comida.armarSemana(); }),
    compras: () => enLaZona(() => comida.compras()),
    tusComidas: () => enLaZona(() => comida.tusComidas()),
    pegarReceta: () => conHoja(() => comida.pegarReceta()),
    foto: () => conHoja(() => comida.foto('visor')),
    fotoEjemplo: () => enLaZona(() => { comida.verDia(0); comida.foto('ejemplo'); comida.bajarA('fotos'); }),
    fotoSinFotos: () => enLaZona(() => comida.foto('nada')),
  };
  // Como si se escribiera: letra por letra, con la búsqueda en cada una.
  let escribiendo = 0;
  function escribirDespacio(texto) {
    clearInterval(escribiendo);
    let i = 0;
    escribiendo = setInterval(() => { i++; comida.escribir(texto.slice(0, i)); if (i >= texto.length) clearInterval(escribiendo); }, 90);
  }

  // ------------------------------------------------------------ la persona: peso, medidas, control y progreso
  // Lo que la app calcularía con lo guardado, con sus mismos módulos: la tendencia y el control
  // (Control), el progreso al objetivo y el balance (Progreso) y la grasa (Cuerpo). El último
  // control, el del lunes 19, sale de lo comido y de las pesadas de las tres semanas anteriores, y
  // fija la meta de la comida.
  const perfil = Object.assign({}, Datos.PERFIL);
  const edad = Number(Datos.HOY.slice(0, 4)) - perfil.nacimiento;
  const diaDelControl = () => (perfil.diaDelControl != null ? perfil.diaDelControl : Fechas.diaDeLaSemana(Datos.INICIO));
  const controlHecho = (() => {
    const fecha = Control.ultimoDiaDeControl(Datos.HOY, diaDelControl());
    const pesadas = Datos.PESADAS.filter((p) => p.fecha < fecha);
    const c = { edad, sexo: perfil.sexo, pesoKg: pesadas[pesadas.length - 1].kg, objetivo: perfil.objetivo, ritmo: perfil.ritmo };
    const hecho = Control.controlSemanal({
      hoy: fecha, pesadas, comidas: comida.kcalPorDia().filter((x) => x.fecha < fecha), gastoAnterior: Datos.GASTO_ANTERIOR,
      metasAnteriores: Metas.metaPara(Datos.GASTO_ANTERIOR, c, perfil.estilo), perfil: c, estilo: perfil.estilo,
    });
    return Object.assign(hecho, { fecha });
  })();
  // La meta de Moss para la estrategia de ahora, con el gasto del último control.
  const metaDeMoss = () => Metas.metaPara(controlHecho.gasto, {
    edad, sexo: perfil.sexo, pesoKg: controlHecho.datos.pesoDeTendencia || Datos.PESADAS[Datos.PESADAS.length - 1].kg, objetivo: perfil.objetivo, ritmo: perfil.ritmo,
  }, perfil.estilo);
  let metasAMano = false;
  // La meta de la comida de hoy: la de Moss y, vinculada con Ascent, el reparto de la semana del
  // control (calorías según el día) y la proteína de la sesión, con las cuentas de la app
  // (Entrenamiento, src/dominio/entrenamiento.ts).
  let metaBase = controlHecho.metas;
  let vinculada = false;
  // Ascent en Perfil: prendida o apagada, como la 1.0 (CON_ASCENT en src/lib/banderas.ts).
  let ascentPrendida = true;
  // Sin reloj: la misma persona, solo con el iPhone (spec/sueno.md, «Sin reloj»).
  let soloIphone = false;
  // «Por qué no subes» con pocas semanas: un botón de la galería, para ver cuando todavía junta.
  let pocasSemanas = false;
  // Con `sinHoy`, la sesión de hoy todavía no está anotada: hoy no cuenta como día de gimnasio.
  function conAscent(sinHoy) {
    const sesiones = sinHoy ? Datos.ASCENT.sesiones.filter((x) => x.fecha !== Datos.HOY) : Datos.ASCENT.sesiones;
    const inicio = controlHecho.fecha;
    const promedio = Entrenamiento.promedioDeSesiones(Entrenamiento.sesionesAnteriores(sesiones, inicio));
    const pesoKg = Datos.PESADAS[Datos.PESADAS.length - 1].kg;
    const costo = Entrenamiento.costoDeSesion(pesoKg, promedio ? promedio.minutos : 60);
    const semana = Entrenamiento.caloriasSegunElDia({
      meta: metaBase, inicio, hoy: Datos.HOY, sesiones, frecuencia: Entrenamiento.frecuenciaPorDia(sesiones, inicio), costo, sexo: perfil.sexo,
    });
    const hoy = semana.find((d) => d.fecha === Datos.HOY);
    const sesion = sesiones.find((x) => x.fecha === Datos.HOY) || null;
    const tamano = sesion ? Entrenamiento.tamanoDeSesion(sesion, promedio) : 1;
    const extra = sesion ? Entrenamiento.proteinaDespuesDeEntrenar({ tamano, pesoKg, proteina: hoy.meta.proteina }) : 0;
    // Lo de un día de descanso: el último de la semana que ya pasó sin entrenar.
    const descansos = semana.filter((d) => d.entrena === false);
    return {
      semana, hoy, sesion, promedio, costo, tamano, extra,
      entreno: hoy.meta.kcal,
      descanso: descansos.length ? descansos[descansos.length - 1].meta.kcal : hoy.meta.kcal - costo,
      total: semana.reduce((t, d) => t + d.meta.kcal, 0),
      meta: Entrenamiento.metaConEntrenamiento(hoy, extra),
    };
  }
  function ponerMetaDeHoy(m) {
    metaBase = m;
    comida.ponerMeta(vinculada ? conAscent().meta : m);
  }
  ponerMetaDeHoy(controlHecho.metas);

  // Una serie para los gráficos: los últimos `dias`, con la pesada de cada día y la tendencia.
  function serieDe(tendencia, dias) {
    const porFecha = new Map(Datos.PESADAS.map((p) => [p.fecha, p.kg]));
    return Array.from({ length: dias }, (_, i) => {
      const f = Fechas.sumarDias(Datos.HOY, i - dias + 1);
      return { x: i / (dias - 1), punto: porFecha.has(f) ? porFecha.get(f) : null, linea: tendencia.has(f) ? tendencia.get(f) : null };
    });
  }

  function calcularPersona() {
    const hoy = Datos.HOY;
    const t = Control.tendencia(Datos.PESADAS, hoy);
    const pesoHoy = t.get(hoy);
    const atras = (dias) => t.get(Fechas.sumarDias(hoy, -dias));
    const comidas = comida.kcalPorDia();
    const ultimasMedidas = Cuerpo.ultimasMedidas(Datos.MEDIDAS, hoy);
    return {
      perfil,
      pesadas: Datos.PESADAS,
      tendencia: t,
      pesoHoy,
      cambio7: pesoHoy - atras(7),
      cambio30: pesoHoy - atras(30),
      pesoInicial: t.get([...t.keys()][0]),
      serie: serieDe(t, 56),
      serieDesde: Fechas.sumarDias(hoy, -55),
      serie30: serieDe(t, 30),
      progreso: Progreso.progresoAlObjetivo({ hoy, tendencia: t, pesadas: Datos.PESADAS, objetivo: perfil.objetivo, ritmo: perfil.ritmo, pesoMeta: perfil.pesoMeta, pesoInicial: t.get([...t.keys()][0]) }),
      gasto: controlHecho.gasto,
      control: controlHecho,
      balance: Progreso.balance(comidas, controlHecho.gasto, Fechas.sumarDias(hoy, -1), 7),
      diaDelControl: diaDelControl(),
      estadoControl: Control.estadoDelControl({ hoy, dia: diaDelControl(), ultimaMeta: controlHecho.fecha, pesadas: Datos.PESADAS, comidas }),
      ultimasMedidas,
      grasa: Cuerpo.rangoDeGrasa(perfil.sexo, perfil.alturaCm, ultimasMedidas),
    };
  }
  const persona = () => calculada || (calculada = calcularPersona());

  // Algo cambió (lo comido, el peso, las medidas o la estrategia): las secciones se pintan de nuevo.
  function repintar(ms) {
    calculada = null;
    if (inicio) inicio.pintar(ms || 0);
    if (progreso) progreso.pintar();
    refrescarControles();
  }

  function ponerEstrategia(cambios) {
    const antes = { objetivo: perfil.objetivo, ritmo: perfil.ritmo, estilo: perfil.estilo };
    Object.assign(perfil, cambios);
    // Como en el almacén (ponerEstrategia): cambiar el objetivo, el ritmo o el reparto fija metas
    // nuevas con el gasto medido; con las metas a mano, quedan las que había.
    const cambiaLaMeta = perfil.objetivo !== antes.objetivo || perfil.ritmo !== antes.ritmo || perfil.estilo !== antes.estilo;
    if (cambiaLaMeta && !metasAMano) ponerMetaDeHoy(metaDeMoss());
    else repintar();
  }

  const opcionesDeSeccion = { textos: TEXTOS, idioma: () => escena.idioma, alCambiar: () => refrescarControles() };

  // ------------------------------------------------------------ según el deporte (para aprobar)
  // Los días de ejemplo de deporte.js: cada uno cambia «Para hoy» y la tarjeta de Inicio, la línea de Sueño, la
  // pantalla bloqueada y Perfil › Entrenamiento (alCambiarElDeporte, más abajo). Sin ejemplo, todo como siempre.
  const deporte = Deporte.crear({
    sinNumeros: () => tel.classList.contains('sin-numeros'),
    sinDeficit: () => !!(perfilSec && perfilSec.sinDeficit),
    alCambiar: () => alCambiarElDeporte(),
  });

  // ------------------------------------------------------------ las secciones nuevas
  inicio = SeccionInicio.crear(tel, Object.assign({}, opcionesDeSeccion, {
    deporte: () => deporte.paraInicio(),
    comida,
    persona,
    cielo: () => escena.hoy || { constelacion: LIRA, habitos: habitosLira() },
    sueno: () => (sueno ? sueno.anoche() : null),
    sinReloj: () => soloIphone,
    registrarPeso: () => mas.ir('peso'),
    medir: () => mas.ir('medidas'),
    ir: (i) => pestanas.ir(i),
    invitacionDeAscent: () => (ascent ? ascent.invitacion() : null),
    // Tu energía, con Ascent vinculada y prendida: el titular de hoy de su sección (los músculos) y su marca.
    ascentDeHoy: () => (vinculada && ascentPrendida && ascent ? ascent.titularDeHoy() : null),
    marcaDeAscent: () => (ascent && ascent.marcaChica ? ascent.marcaChica() : ''),
    // «Sin déficit» es de Perfil, que se arma después.
    sinDeficit: () => !!(perfilSec && perfilSec.sinDeficit),
  }));
  mas = Mas.crear(tel, Object.assign({}, opcionesDeSeccion, {
    comida,
    persona,
    alPeso: (kg) => {
      const i = Datos.PESADAS.findIndex((p) => p.fecha === Datos.HOY);
      const pesada = { fecha: Datos.HOY, kg, origen: 'manual', momento: new Date().toISOString() };
      if (i >= 0) Datos.PESADAS[i] = pesada; else Datos.PESADAS.push(pesada);
      repintar();
    },
    alMedidas: (m) => {
      const hoy = Datos.MEDIDAS.find((x) => x.fecha === Datos.HOY);
      if (hoy) Object.assign(hoy, m, { actualizado: new Date().toISOString() });
      else Datos.MEDIDAS.push(Object.assign({ fecha: Datos.HOY, actualizado: new Date().toISOString() }, m));
      repintar();
    },
  }));
  progreso = SeccionProgreso.crear(tel, Object.assign({}, opcionesDeSeccion, {
    // Arriba a la derecha del encabezado, la entrada a Ascent, que está arriba de Progreso; y el borde
    // de su planeta asomando arriba de todo, según lo arriba que esté el scroll.
    marcaDeAscent: () => (ascent && ascentPrendida ? ascent.marcaDeProgreso() : null),
    alPintar: () => { if (ascent) ascent.mirarArriba(); },
    comida,
    persona,
    ponerEstrategia,
    metaDeMoss,
    ponerMeta: (m) => { metasAMano = !m || m.kcal !== metaDeMoss().kcal || m.proteina !== metaDeMoss().proteina; ponerMetaDeHoy(m); },
    registrarPeso: () => mas.ir('peso'),
    medir: () => mas.ir('medidas'),
    // Con «sin déficit» (Perfil o Cuidados), ni el plan de bajar ni «el control ajusta tus calorías para mantenerlo».
    sinDeficit: () => !!(perfilSec && perfilSec.sinDeficit),
  }));
  sueno = SeccionSueno.crear(tel, Object.assign({}, opcionesDeSeccion, {
    deporte: () => deporte.paraSueno(),
    noches: () => (soloIphone ? [] : Datos.NOCHES),
    sinReloj: () => soloIphone,
    metaDeSueno: 8 * 60,
    sexo: () => persona().perfil.sexo,
    // Reflujo en Cuidados (Perfil): la última comida de esta noche, 3 h antes de la cama.
    reflujo: () => !!(perfilSec && perfilSec.reflujo),
    // «Necesito dormir», en Perfil › Avisos.
    necesidadElegida: () => (perfilSec ? perfilSec.necesidad : null),
    // Con Ascent: el titular de hoy, sin porcentaje, y la línea del rendimiento con la noche corta.
    titular: () => (ascent ? ascent.titularDeHoy() : null),
    linea: () => (ascent ? ascent.lineaDeHoy() : null),
    abrirAscent: () => abrirAscent(),
    // La cara de la mañana cambia la recuperación, que también está en Ascent.
    alCambiarCara: () => { if (ascent) ascent.pintar(); },
    abrirGuia: () => guiaAtajos.abrir(versionDeLaGuia),
    abrirAparatos: () => accionesSeccion.aparatos(),
    ponerAparato: (soloElIphone) => ponerAparato(soloElIphone),
    alCambiarEstado: (v) => $$('#s-noches button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === v))),
  }));
  // Qué iOS muestra la guía: en iOS 27 el atajo trae la automatización; hasta iOS 26, se arma a mano.
  let versionDeLaGuia = 27;
  guiaAtajos = GuiaAtajos.crear(tel, Object.assign({}, opcionesDeSeccion, { alArmar: () => sueno.cargador('anda') }));
  const avisosBloqueo = AvisosBloqueo.crear(tel, opcionesDeSeccion);
  window.__avisosBloqueo = (p) => avisosBloqueo.poner(p);
  suscripcion = Suscripcion.crear(tel, Object.assign({}, opcionesDeSeccion, {
    alCambiar: () => { if (perfilSec) perfilSec.pintar(); refrescarControles(); },
  }));
  perfilSec = SeccionPerfil.crear(tel, Object.assign({}, opcionesDeSeccion, {
    // Comida, para Entrenamiento: cuándo entrenas cambia lo que dice cada comida.
    comida,
    persona, vinculada: () => vinculada, abrirAscent: () => abrirAscent(), sinReloj: () => soloIphone, nochesSinReloj: () => Datos.PROPIAS_SIN_RELOJ.length,
    // Tus respuestas (5/11): el cuestionario con lo contestado; al guardar, la meta nueva y de vuelta a Perfil.
    revisarCuestionario: () => {
      cerrarHojas();
      // Con lo que contestó la persona de la galería (en la app, lo guardado en el perfil).
      const P = Datos.PERFIL;
      window.__cuestionario('responder', { sexo: P.sexo, edad: Number(Datos.HOY.slice(0, 4)) - P.nacimiento, altura: P.alturaCm, peso: 75, objetivo: P.objetivo, pesoMeta: P.pesoMeta, estilo: P.estilo, movimiento: P.movimiento });
      entrada.revisar({ kcalAntes: comida.meta.kcal, alGuardar: (m) => { comida.ponerMeta(m); pestanas.ir(5, true); perfilSec.pintar(); } });
    },
    suscripcion: () => suscripcion.valorDeFila(), abrirSuscripcion: () => suscripcion.abrirHoja(),
    accesoDeSuscripcion: () => suscripcion.acceso,
    ascentPrendida: () => ascentPrendida,
    irAMetas: () => accionesSeccion.estrategia(),
    // «Necesito dormir» cambia la deuda, la calidad y esta noche en Sueño.
    alCambiarNecesidad: () => { if (sueno) sueno.pintar(); },
    // Los números ocultos (Perfil): sin calorías ni gramos en Inicio, Comida y la ventana del alimento.
    alNumeros: (si) => { tel.classList.toggle('sin-numeros', !si); inicio.refrescarConsejos(); },
  }));
  ascent = SeccionAscent.crear(tel, Object.assign({}, opcionesDeSeccion, {
    comida,
    persona,
    anoche: () => sueno.anoche(),
    noches: () => sueno.noches(),
    cara: (clave) => sueno.cara(clave),
    metaBase: () => metaBase,
    conAscent: (sinHoy) => (vinculada ? conAscent(sinHoy) : null),
    pocasSemanas: () => pocasSemanas,
    sinDeficit: () => perfilSec.sinDeficit,
    alVincular: (si) => vincular(si),
    // Lo que falta se anota en su sección: la noche de anoche en Sueño (`corregir` la abre para cambiarla;
    // `manana`, con la pregunta de cómo dormiste), lo comido en Comida y el horario en Perfil.
    irASeccion: (que) => {
      ascent.cerrar(true);
      if (que === 'sueno' || que === 'corregir' || que === 'manana') {
        pestanas.ir(3);
        if (que === 'corregir') sueno.editarNoche(0); else sueno.verNoche(0);
        return;
      }
      pestanas.ir(que === 'comida' ? COMIDA : 5);
    },
    // Los mismos umbrales que el gesto de abrirla (se declaran más abajo, con las pestañas).
    umbral: () => UMBRAL,
    velocidadMin: () => VELOCIDAD_MIN,
    // Al bajar Ascent, el cielo sube con el dedo, más despacio (está más lejos), y Progreso se apaga y
    // baja un poco, como empujado: Ascent queda sobre el mismo cielo, como «Tu universo».
    alMover: (p) => {
      // Solo mientras Ascent se mueve: cerrada, la cámara es del cielo (hoy o el universo).
      // Lo de Progreso se apaga en la primera mitad del gesto, así no se mezcla con lo de Ascent.
      if (p > 0 || subidaDeAscent > 0) {
        progreso.zona.style.opacity = String(Math.max(0, 1 - p * 2.2));
        progreso.zona.style.transform = p > 0 ? `translate3d(0, ${(p * 0.22 * (tel.clientHeight || 1)).toFixed(1)}px, 0)` : '';
        if (subidaDeAscent === 0) camaraConAscent = escena.zona() === 'hoy';
        if (camaraConAscent) {
          escena.velar(Math.min(1, p * 2));
          escena.camara(CAMARA_DE_ASCENT * p, true);
        }
      }
      subidaDeAscent = p;
      if (pestanas) pestanas.repintar();
    },
    curva: bezier(0.16, 1, 0.3, 1),
    movimientoReducido,
    repintarInicio: () => inicio.pintar(0),
    repintarProgreso: () => progreso.pintar(),
    // Con Ascent apagada (CON_ASCENT), no se nombra: ni la entrada de Progreso ni el borde del planeta.
    prendida: () => ascentPrendida,
  }));
  // Inicio y Progreso se pintaron antes de que existiera Ascent, y su invitación y su entrada salen de ahí.
  inicio.pintar(0);
  progreso.pintar();


  // Un día de ejemplo del deporte (o ninguno): Perfil › Entrenamiento toma sus deportes, su horario, su partido y
  // su carrera (sin ejemplo, vuelve lo de antes), y se pintan Inicio, Sueño y la pantalla bloqueada.
  let entrenoAntesDelDeporte = null;
  // Lo de Perfil sin «Qué comer antes y después», que va aparte.
  const sinVer = (e) => { const x = Object.assign({}, e); delete x.ver; return x; };
  function alCambiarElDeporte() {
    const delEjemplo = deporte.paraPerfil();
    if (delEjemplo) {
      if (!entrenoAntesDelDeporte) entrenoAntesDelDeporte = comida.entreno;
      comida.ponerEntreno(Object.assign(sinVer(entrenoAntesDelDeporte), delEjemplo, { tipo: Cuestionario.tipoDeSesion(delEjemplo.tipos) }));
    } else if (entrenoAntesDelDeporte) {
      comida.ponerEntreno(sinVer(entrenoAntesDelDeporte));
      entrenoAntesDelDeporte = null;
    }
    inicio.pintar(0);
    sueno.pintar();
    perfilSec.pintar();
    avisosBloqueo.ponerDeporte(deporte.paraBloqueo());
    $$('#s-deporte button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === (deporte.clave || 'ninguno'))));
    $$('#s-alcohol button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.valor === 'si') === deporte.alcohol)));
    refrescarControles();
  }

  // Vincular cambia la meta de hoy (el día de gimnasio), la recuperación en Sueño y la fila de Perfil.
  function vincular(si) {
    vinculada = si;
    ponerMetaDeHoy(metaBase);
    ascent.ponerVinculo(si);
    sueno.pintar();
    perfilSec.pintar();
    $$('#s-vinculo button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.valor === 'si') === si)));
    refrescarControles();
  }
  // Con reloj o solo con el iPhone: cambia Sueño, el bloque de Inicio, Perfil y la recuperación.
  function ponerAparato(soloElIphone) {
    soloIphone = soloElIphone;
    sueno.pintar();
    inicio.pintar(0);
    perfilSec.pintar();
    if (ascent) ascent.pintar();
    $$('#s-aparato button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.valor === 'iphone') === soloElIphone)));
  }
  // A Ascent se llega por Progreso: desde Sueño o Perfil, se pasa por ahí.
  function abrirAscent(deUna) {
    if (!ascent.ocupada) { cerrarHojas(); pestanas.ir(PROGRESO, true); }
    ascent.abrir(deUna);
  }

  // ------------------------------------------------------------ los hábitos: el editor, tu mes y los primeros
  // Lo que se guarda va al cielo de hoy y a la persona de mentira (lo que lista «Tu mes»).
  habitosSec = SeccionHabitos.crear(tel, Object.assign({}, opcionesDeSeccion, {
    icono,
    catalogo: lista,
    cielo: () => escena.hoy,
    habitos: () => Datos.HABITOS,
    alGuardar: guardarHabito,
    alArchivar: archivarHabito,
    alArmar: armarPrimeros,
    avisar: (texto) => escena.avisar(texto),
  }));

  // El cielo de hoy con estos hábitos. Con otra cantidad, el día pasa a otra constelación, una que
  // el resto de la semana no usa, como en la app; con la misma, queda la que tenía.
  function ponerHoy(habitos) {
    const hoy = escena.hoy;
    if (!hoy || !habitos.length) return;
    let datos = hoy.constelacion;
    if (habitos.length !== hoy.habitos.length) {
      datos = elegirConstelacion(habitos.length, new Set(semana.filter((d) => !d.hoy).map((d) => d.datos.id))) || datos;
      semana = semana.map((d) => (d.hoy ? Object.assign({}, d, { total: habitos.length, datos }) : d));
      escena.ponerSemana(semana);
    }
    escena.ponerConstelacion(datos, habitos);
  }

  // Un hábito como lo dibuja el cielo: los de Salud y los de comida se encienden solos (los pasos y
  // el sueño con lo de hoy, contra su meta).
  function paraElCielo(datos, antes) {
    const f = datos.fuente;
    const auto = f.tipo === 'salud' ? f.dato : f.tipo === 'comida' ? 'comida' : undefined;
    const valor = auto === 'pasos' ? PASOS_DE_HOY : auto === 'sueno' ? DORMIDO_ANOCHE : 0;
    const meta = f.tipo === 'salud' ? f.meta : 0;
    const encendido = auto === 'pasos' || auto === 'sueno' ? valor >= meta : auto ? false : !!(antes && antes.encendido);
    return Object.assign({}, antes, { nombre: datos.nombre, icono: datos.icono, dias: datos.dias, fuente: f, auto, valor, meta, encendido });
  }

  // `original` es el hábito de la estrella `original.indice` del cielo de hoy; null, uno nuevo.
  function guardarHabito(original, datos) {
    const hoyToca = datos.dias.includes(Fechas.diaDeLaSemana(Datos.HOY));
    const lista = escena.hoy.habitos;
    if (original) {
      const guardado = original.id && Datos.HABITOS.find((h) => h.id === original.id);
      if (guardado) Object.assign(guardado, datos);
      const i = original.indice;
      ponerHoy(hoyToca ? lista.map((h, k) => (k === i ? paraElCielo(datos, h) : h)) : lista.filter((_, k) => k !== i));
      return;
    }
    const id = 'nuevo-' + Date.now().toString(36);
    Datos.HABITOS.push(Object.assign({ id, orden: Math.max(-1, ...Datos.HABITOS.map((h) => h.orden)) + 1, desde: Datos.HOY }, datos));
    // Un hábito nuevo va al final: la estrella menos brillante.
    if (hoyToca) ponerHoy([...lista, paraElCielo(datos, { id })]);
  }

  // Archivar es dejar de tocar desde hoy: lo de antes queda en el cielo.
  function archivarHabito(original) {
    const guardado = original.id && Datos.HABITOS.find((h) => h.id === original.id);
    if (guardado) guardado.hasta = Fechas.sumarDias(Datos.HOY, -1);
    ponerHoy(escena.hoy.habitos.filter((_, k) => k !== original.indice));
  }

  // Los primeros hábitos arman el cielo de hoy (en la app, la primera constelación).
  function armarPrimeros(habitos) {
    const hoy = Fechas.diaDeLaSemana(Datos.HOY);
    ponerHoy(habitos.filter((h) => h.dias.includes(hoy)).map((h) => paraElCielo(h, { id: h.id })));
  }

  // «Reiniciar» también deja los hábitos como estaban.
  function reiniciarHabitos() {
    Datos.HABITOS.splice(0, Datos.HABITOS.length, ...JSON.parse(HABITOS_DE_FABRICA));
    semana = SEMANA_DE_FABRICA;
    escena.ponerSemana(semana);
    habitosSec.cerrar();
  }

  const cerrarHojas = () => {
    if (widgets && widgets.vista) widgets.cerrar();
    if (comida.hojaAbierta) comida.cerrarHoja();
    if (comida.hojaPlanAbierta) comida.cerrarPlan();
    if (mas.abierta) mas.cerrar();
    if (inicio.editando) inicio.cerrar();
    if (habitosSec.abierta) habitosSec.cerrar();
    if (perfilSec && perfilSec.hojaAbierta) perfilSec.cerrarHoja();
    if (ascent && ascent.hojaVincularAbierta) ascent.cerrarVincular();
    if (suscripcion && suscripcion.abierta) suscripcion.cerrar();
    if (suscripcion && suscripcion.hojaAbierta) suscripcion.cerrarHoja();
    if (guiaAtajos && guiaAtajos.abierta) guiaAtajos.cerrar();
    if (avisosBloqueo.abierta) avisosBloqueo.cerrar();
  };

  // ------------------------------------------------------------ las seis secciones, como en Ascent
  // Abajo van Inicio, Comida y Progreso, el «+» en el medio, y Sueño, Hábitos y Perfil. Se pasa de
  // una a otra tocando su nombre o deslizando, con la de al lado asomando mientras se arrastra. Las
  // reglas del gesto son las de Ascent (nucleo/deslizar.ts): cambia con un quinto de la pantalla o
  // con un tirón rápido, y el viaje dura 340 ms. El cielo no se desliza: queda quieto detrás de
  // todas, como el planeta de Ascent, oscurecido salvo en Hábitos; la constelación va con su página.
  const PESTANAS = ['inicio', 'comida', 'progreso', 'sueno', 'habitos', 'perfil'];
  const HABITOS = 4;
  const PROGRESO = 2;
  const UMBRAL = 0.22;
  const VELOCIDAD_MIN = 0.35;
  const VIAJE_MS = 340;
  const CEDE_EN_EL_BORDE = 0.25;
  // Cuánto tiene que moverse el dedo, y más de costado que para abajo, para que el gesto sea de las
  // pestañas y no de una lista o de la cámara del cielo.
  const DECIDE_PX = 14;
  // Cuánto se oscurece el cielo detrás de cada sección, de 0 a 1. En Sueño deja ver un poco la noche.
  const VELO = [0.8, 0.8, 0.8, 0.7, 0, 0.8];

  // cubic-bezier(0.16, 1, 0.3, 1), la curva de Ascent: sale rápido y frena largo.
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const enX = (t) => ((ax * t + bx) * t + cx) * t;
    const derivada = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (u) => {
      let t = u;
      for (let i = 0; i < 8; i++) {
        const d = derivada(t);
        if (Math.abs(d) < 1e-6) break;
        t = Math.min(1, Math.max(0, t - (enX(t) - u) / d));
      }
      return ((ay * t + by) * t + cy) * t;
    };
  }

  const tx = (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS[escena.idioma]) || clave;

  pestanas = (() => {
    const paginas = [inicio.zona, comida.zona, progreso.zona, sueno.zona, tel.querySelector('.ui'), perfilSec.zona];
    const velo = document.createElement('div');
    velo.className = 'velo-pestanas';
    velo.innerHTML = '<i></i><i class="velo-sueno"></i>';
    tel.querySelector('canvas').after(velo);
    const barra = document.createElement('nav');
    barra.className = 'pestanas';
    barra.setAttribute('role', 'tablist');
    tel.appendChild(barra);
    // Cada una con su ícono y su nombre, apagados, y encima los mismos encendidos: lo que cambia es
    // la opacidad de los de arriba, que siguen a la tira.
    const capa = (n, luz) => `<span class="pt-capa${luz ? ' pt-luz' : ''}"${luz ? ' aria-hidden="true"' : ''}>${Util.icono(n)}<span class="pt-nombre"></span></span>`;
    const botones = PESTANAS.map((n, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.className = 'pt-' + n;
      b.innerHTML = capa(n, false) + capa(n, true);
      b.addEventListener('click', () => ir(i));
      return b;
    });
    // El «+», en el medio, del mismo tamaño que las demás: un círculo fino, sin brillo.
    const botonMas = document.createElement('button');
    botonMas.type = 'button';
    botonMas.className = 'pt-mas';
    botonMas.innerHTML = `<span>${Util.icono('mas')}</span>`;
    botonMas.addEventListener('click', () => {
      if (entrada.paso) return;
      comida.empezarCuenta();
      comida.contarToque();
      mas.abrir();
    });
    botones.forEach((b, i) => { if (i === 3) barra.appendChild(botonMas); barra.appendChild(b); });

    const curva = bezier(0.16, 1, 0.3, 1);
    // La que está a la vista o a la que se va (el «rumbo» de Ascent), y cuánto está corrida la
    // tira, en píxeles.
    let actual = 0;
    let x = 0;
    let animacion = 0;
    let gesto = null;
    let ultimoArrastre = -1e9;
    const ancho = () => tel.clientWidth || 1;
    const reposo = (i) => -i * ancho();
    const vecina = (i, dx) => { const d = dx < 0 ? i + 1 : i - 1; return d < 0 || d >= PESTANAS.length ? null : d; };

    // Se enciende con la tira, no al soltar: mientras arrastrás, el nombre de destino se va prendiendo.
    function luz(i) {
      const d = (x - reposo(i)) / ancho();
      if ((i === 0 && d > 0) || (i === PESTANAS.length - 1 && d < 0)) return 1;
      return Math.max(0, 1 - Math.abs(d));
    }

    function pintar() {
      const w = ancho();
      paginas.forEach((p, i) => {
        const corrida = i * w + x;
        p.style.translate = `${corrida.toFixed(1)}px 0`;
        p.style.visibility = Math.abs(corrida) >= w ? 'hidden' : '';
      });
      escena.desplazarPagina(HABITOS * w + x);
      // El planeta que asoma al final de Progreso se va con su página.
      ascent.seguirPagina(PROGRESO * w + x);
      // El cielo se aclara mientras arrastrás hacia Hábitos, no de golpe al llegar.
      const k = Math.min(PESTANAS.length - 1, Math.max(0, -x / w));
      const a = VELO[Math.floor(k)], b = VELO[Math.ceil(k)];
      const oscuro = a + (b - a) * (k - Math.floor(k));
      // Ascent trae su propio velo: el cielo se aclara mientras sube, como hacia Hábitos.
      velo.firstChild.style.opacity = (oscuro * (1 - ascent.progreso)).toFixed(3);
      // El azul de Sueño sigue al dedo, como el velo: la página se desliza y el fondo no.
      velo.lastChild.style.opacity = Math.max(0, 1 - Math.abs(k - 3)).toFixed(3);
      // Sobre las secciones la barra es pareja, como en Ascent; sobre el cielo deja ver el musgo.
      barra.style.setProperty('--solida', Math.max(Math.min(1, ascent.progreso * 3), Math.min(1, oscuro / 0.7)).toFixed(3));
      botones.forEach((boton, i) => { boton.querySelector('.pt-luz').style.opacity = luz(i).toFixed(3); });
    }

    function marcar() {
      botones.forEach((b, i) => b.setAttribute('aria-selected', String(i === actual)));
      paginas.forEach((p, i) => { p.inert = i !== actual; });
      comida.ponerEnZona(actual === COMIDA);
      // Al volver a Inicio: lo que se cambió en otra sección (lo anotado, el agua) ya cuenta para «Para hoy».
      if (actual === 0) inicio.refrescarConsejos();
      if (actual === PROGRESO) ascent.asomar();
      refrescarControles();
    }

    function ir(i, deUna) {
      // Con Ascent arriba, Progreso la baja; otra pestaña la saca de una.
      if (ascent.ocupada) ascent.cerrar(i !== PROGRESO || deUna);
      cancelAnimationFrame(animacion);
      animacion = 0;
      actual = Math.max(0, Math.min(PESTANAS.length - 1, i));
      marcar();
      const desde = x, hasta = reposo(actual);
      if (deUna || movimientoReducido || desde === hasta) { x = hasta; pintar(); return; }
      const t0 = performance.now();
      const paso = (t) => {
        const u = Math.min(1, (t - t0) / VIAJE_MS);
        x = desde + (hasta - desde) * curva(u);
        pintar();
        animacion = u < 1 ? requestAnimationFrame(paso) : 0;
      };
      animacion = requestAnimationFrame(paso);
    }

    // El gesto se mira antes que nadie (en captura): si es de costado, es de las pestañas, y ni las
    // listas ni el cielo se enteran.
    // Con los avisos de la pantalla bloqueada arriba, tampoco: el gesto se quedaría con el deslizador de la hora.
    const bloqueado = () => !!(entrada.paso || comida.hojaAbierta || mas.abierta || inicio.editando || habitosSec.abierta || escena.viajando || ascent.ocupada || avisosBloqueo.abierta);
    tel.addEventListener('pointerdown', (ev) => {
      gesto = null;
      if (bloqueado() || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      if (ev.target.closest('.pestanas, .barra-inmersiva, .sn-noches, .vt-porciones, .mas-chips, .cm-cuadro, .fd-tira')) return;
      gesto = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, desde: 0 };
    }, true);
    tel.addEventListener('pointermove', (ev) => {
      const g = gesto;
      if (!g || ev.pointerId !== g.id) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (escena.arrastrando || (subida && subida.decidido)) { gesto = null; return; }
        if (Math.abs(dx) < DECIDE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        g.decidido = true;
        g.desde = performance.now();
        cancelAnimationFrame(animacion);
        animacion = 0;
        escena.soltarGesto();
        try { tel.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
      }
      ev.stopImmediatePropagation();
      ev.preventDefault();
      // En los bordes no hay pestaña: la tira cede un cuarto de lo que se mueve el dedo.
      x = reposo(actual) + (vecina(actual, dx) === null ? dx * CEDE_EN_EL_BORDE : dx);
      pintar();
    }, true);
    const soltar = (ev) => {
      const g = gesto;
      if (!g || ev.pointerId !== g.id) return;
      gesto = null;
      if (!g.decidido) return;
      ev.stopImmediatePropagation();
      ultimoArrastre = performance.now();
      if (ev.type === 'pointercancel') { ir(actual); return; }
      const dx = ev.clientX - g.x0;
      const v = dx / Math.max(1, performance.now() - g.desde);
      const destino = vecina(actual, dx);
      const lejos = Math.abs(dx) >= ancho() * UMBRAL;
      const rapido = dx < 0 ? v <= -VELOCIDAD_MIN : v >= VELOCIDAD_MIN;
      ir(destino !== null && (lejos || rapido) ? destino : actual);
    };
    tel.addEventListener('pointerup', soltar, true);
    tel.addEventListener('pointercancel', soltar, true);
    // El click que llega después de arrastrar no es un toque: no enciende ni abre nada.
    tel.addEventListener('click', (ev) => {
      if (performance.now() - ultimoArrastre < 400) { ev.stopImmediatePropagation(); ev.preventDefault(); }
    }, true);

    new ResizeObserver(() => {
      if (gesto && gesto.decidido) return;
      cancelAnimationFrame(animacion);
      animacion = 0;
      x = reposo(actual);
      pintar();
    }).observe(tel);

    function ponerTextos() {
      botones.forEach((b, i) => {
        const nombre = tx('pestanas.' + PESTANAS[i]);
        b.querySelectorAll('.pt-nombre').forEach((n) => { n.textContent = nombre; });
        b.setAttribute('aria-label', nombre);
      });
      botonMas.setAttribute('aria-label', tx('pestanas.mas'));
    }
    ponerTextos();
    // Moss abre en Inicio.
    marcar();
    pintar();

    return {
      ir,
      ponerTextos,
      repintar: pintar,
      get actual() { return actual; },
      get deslizando() { return !!animacion || !!(gesto && gesto.decidido); },
    };
  })();

  // ------------------------------------------------------------ Ascent, arriba de Progreso
  // Como a tu universo desde Hábitos: arriba de todo del scroll de Progreso, arrastrar para abajo baja Ascent
  // siguiendo al dedo, con los mismos umbrales que las pestañas; también desde la entrada del encabezado.
  // Más abajo el dedo es del scroll y de costado es de las pestañas; la barra, nunca: es del gesto de inicio
  // del iPhone. Se vuelve empujando para arriba abajo de todo de Ascent (ascent.js).
  let subida = null;
  let ultimaSubida = -1e9;
  const scrollDeProgreso = progreso.zona.querySelector('.pg-scroll');
  const arribaDeProgreso = () => scrollDeProgreso.scrollTop <= 0;
  const puedeAbrir = () => ascentPrendida && pestanas.actual === PROGRESO && !pestanas.deslizando && !ascent.ocupada && !entrada.paso && !comida.hojaAbierta
    && !mas.abierta && !inicio.editando && !habitosSec.abierta && !progreso.zona.classList.contains('en-metas') && (!esTactil || tel.classList.contains('inmersivo'));
  const abreDesde = (objetivo) => !!objetivo.closest('.progreso') && (!!objetivo.closest('.as-entrada') || arribaDeProgreso());
  tel.addEventListener('pointerdown', (ev) => {
    subida = null;
    if (!puedeAbrir() || (ev.pointerType === 'mouse' && ev.button !== 0) || !abreDesde(ev.target)) return;
    subida = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, v: 0, ultimoY: ev.clientY, ultimoT: performance.now() };
  }, true);
  tel.addEventListener('pointermove', (ev) => {
    const g = subida;
    if (!g || ev.pointerId !== g.id) return;
    const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
    if (!g.decidido) {
      if (dy < -8 || Math.abs(dx) >= DECIDE_PX) { subida = null; return; }
      if (dy <= 8 || Math.abs(dx) > dy) return;
      g.decidido = true;
      try { tel.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
    }
    ev.stopImmediatePropagation();
    ev.preventDefault();
    const ahora = performance.now();
    g.v = g.v * 0.6 + ((ev.clientY - g.ultimoY) / Math.max(1, ahora - g.ultimoT)) * 0.4;
    g.ultimoY = ev.clientY;
    g.ultimoT = ahora;
    ascent.arrastrar(Math.max(0, dy - 8) / (tel.clientHeight || 1));
  }, true);
  const soltarSubida = (ev) => {
    const g = subida;
    if (!g || ev.pointerId !== g.id) return;
    subida = null;
    if (!g.decidido) return;
    ev.stopImmediatePropagation();
    ultimaSubida = performance.now();
    ascent.soltar(ev.type === 'pointerup' && (ascent.progreso >= UMBRAL || g.v >= VELOCIDAD_MIN));
  };
  tel.addEventListener('pointerup', soltarSubida, true);
  tel.addEventListener('pointercancel', soltarSubida, true);
  tel.addEventListener('click', (ev) => {
    if (performance.now() - ultimaSubida < 400) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);
  // En el iPhone, arriba de todo, el navegador se queda con el dedo (rebota) si no se le dice nada.
  let toqueDeSubida = null;
  scrollDeProgreso.addEventListener('touchstart', (ev) => {
    const t = ev.touches[0];
    toqueDeSubida = t && puedeAbrir() && abreDesde(ev.target) ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  scrollDeProgreso.addEventListener('touchmove', (ev) => {
    const t = ev.touches[0];
    if (!toqueDeSubida || !t) return;
    const dy = t.clientY - toqueDeSubida.y;
    if (dy > 0 && dy > Math.abs(t.clientX - toqueDeSubida.x)) ev.preventDefault();
  }, { passive: false });
  // Con la rueda o el trackpad, lo mismo: arriba de todo, seguir subiendo la baja. Lo que venía subiendo
  // (la inercia) no cuenta: tiene que haber una pausa antes de arrancar.
  let rueda = 0;
  let ultimaRueda = -1e9;
  let finDeRueda = 0;
  progreso.zona.addEventListener('wheel', (ev) => {
    const antes = ultimaRueda;
    ultimaRueda = performance.now();
    if (!rueda && (ev.deltaY >= 0 || !puedeAbrir() || !arribaDeProgreso() || ultimaRueda - antes < 200)) return;
    ev.preventDefault();
    rueda = Math.max(0, rueda - ev.deltaY);
    // Rinde el doble que el dedo: una vuelta de la rueda alcanza.
    ascent.arrastrar((2 * rueda) / (tel.clientHeight || 1));
    clearTimeout(finDeRueda);
    // Se decide cuando la rueda para un cuarto de segundo, como al volver (ascent.js).
    finDeRueda = setTimeout(() => { ascent.soltar(ascent.progreso >= UMBRAL); rueda = 0; }, 260);
  }, { passive: false });
  // Después de mantener apretada una estrella, el click de soltar no cierra la hoja que se abrió.
  let soltoTrasMantener = -1e9;
  tel.addEventListener('pointerup', () => { if (mantenido) { mantenido = false; soltoTrasMantener = performance.now(); } }, true);
  tel.addEventListener('click', (ev) => {
    if (performance.now() - soltoTrasMantener < 400) { ev.stopImmediatePropagation(); ev.preventDefault(); }
  }, true);

  function refrescarControles() {
    if (!escena || !comida || !pestanas || !mas || !inicio || !ascent || !habitosSec) return;
    const enEntrada = !!entrada.paso;
    const quieto = enEntrada || comida.hojaAbierta || mas.abierta || inicio.editando || habitosSec.abierta;
    $('#b-repetir').disabled = !escena.completo || quieto;
    $('#b-salud').disabled = !escena.hayAutoPendiente || quieto;
    $('#b-completar').disabled = escena.completo || quieto;
    $('#b-registrar').textContent = comida.hojaAbierta ? 'Cerrar la hoja' : 'Registrar';
    $$('#comida [data-comida], [data-seccion], [data-ascent], [data-habitos]').forEach((b) => { b.disabled = enEntrada; });
    const enUniverso = escena.zona() === 'universo';
    $('#b-zona').textContent = enUniverso ? 'Volver a hoy' : 'Subir a tu universo';
    $$('.barra-inmersiva [data-accion="zona"]').forEach((b) => { b.textContent = enUniverso ? 'Hoy' : 'Universo'; });
    $('#b-entrada').textContent = enEntrada ? 'Salir de la entrada' : 'Ver la entrada desde el principio';
    $$('[data-pestana]').forEach((b) => { b.setAttribute('aria-pressed', String(Number(b.dataset.pestana) === pestanas.actual)); b.disabled = quieto; });
    // Lo encendido en el cielo cambia el bloque de Inicio.
    const firma = escena.encendidas + '/' + escena.total + escena.nombre;
    if (firma !== firmaDelCielo) { firmaDelCielo = firma; inicio.pintar(0); }
  }

  // Los botones de la galería para las secciones nuevas.
  const accionesSeccion = {
    // «Para hoy», al final de Inicio (2/11).
    paraHoy: () => { cerrarHojas(); inicio.primerDia(false); pestanas.ir(0, true); inicio.bajar(); },
    mas: () => { cerrarHojas(); comida.empezarCuenta(); comida.contarToque(); mas.abrir(); },
    peso: () => { cerrarHojas(); mas.ir('peso'); },
    medidas: () => { cerrarHojas(); mas.ir('medidas'); },
    rapida: () => { cerrarHojas(); mas.ir('rapida'); },
    personalizar: () => { cerrarHojas(); pestanas.ir(0); inicio.personalizar(); },
    agua: () => { cerrarHojas(); pestanas.ir(0); inicio.poner('agua', true); inicio.bajar(); },
    sueno: () => { cerrarHojas(); pestanas.ir(0); inicio.poner('sueno', true); inicio.bajar(); },
    fabrica: () => { cerrarHojas(); pestanas.ir(0); inicio.deFabrica(); inicio.subir(); },
    cena: () => { cerrarHojas(); pestanas.ir(0); inicio.subir(); comida.simularCena(); },
    metas: () => { cerrarHojas(); pestanas.ir(2); progreso.verMetas(); },
    estrategia: () => { cerrarHojas(); pestanas.ir(2); progreso.verPrincipal(); progreso.bajarA('.pg-seccion'); },
    mantener: () => { ponerEstrategia({ objetivo: perfil.objetivo === 'mantener' ? 'bajar' : 'mantener' }); pestanas.ir(0); },
    noche: () => { cerrarHojas(); pestanas.ir(3); sueno.verNoche(-3); },
    // Sueño para aprobar: con datos, con pocas noches, sin noches y sin deuda.
    suenoDatos: () => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado('datos'); },
    suenoDos: () => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado('dos'); },
    suenoUna: () => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado('una'); },
    suenoVacio: () => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado('vacio'); },
    suenoPagada: () => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado('pagada'); setTimeout(() => sueno.bajarA('.sn-deuda'), 240); },
    sinReloj: () => { cerrarHojas(); ponerAparato(false); pestanas.ir(3); sueno.verNoche(Datos.NOCHE_SIN_RELOJ); },
    hora: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.preguntarHora('proponer'); sueno.verNoche(0); },
    horaSinProponer: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.preguntarHora('sinProponer'); sueno.verNoche(0); },
    aparatos: () => { cerrarHojas(); pestanas.ir(5); perfilSec.abrirAparatos(); },
    avisos: () => { cerrarHojas(); pestanas.ir(5); perfilSec.ponerAvisos({ dormir: true, comidas: ['almuerzo', 'cena'] }); perfilSec.abrirAvisos(); },
    entreno: () => { cerrarHojas(); pestanas.ir(5); perfilSec.abrirEntreno(); },
    // Lo nuevo de la 1.1, para aprobar.
    plazo: () => { cerrarHojas(); pestanas.ir(2); progreso.verPrincipal(); progreso.plazo({}); progreso.bajarA('.pg-seccion'); },
    graficos: () => { cerrarHojas(); pestanas.ir(2); progreso.verPrincipal(); progreso.abrir(null); progreso.subir(); },
    primerDia: () => { cerrarHojas(); pestanas.ir(0); inicio.primerDia(true); inicio.subir(); },
    conDatos: () => { cerrarHojas(); pestanas.ir(0); inicio.primerDia(false); inicio.subir(); },
    cuestionario: () => { cerrarHojas(); entrada.irA('edad'); },
    plan: () => { cerrarHojas(); pestanas.ir(1); comida.armarDia(); },
    todo: () => { cerrarHojas(); pestanas.ir(0); inicio.subir(); inicio.abrirTodo(); },
    // Lo nuevo del 31/10.
    porque: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.preguntarHora('proponer'); sueno.verNoche(0); sueno.porque(true); },
    guia27: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.bajarA('.sn-afinar'); versionDeLaGuia = 27; guiaAtajos.abrir(27); },
    guia26: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.bajarA('.sn-afinar'); versionDeLaGuia = 26; guiaAtajos.abrir(26); },
    avisosBloqueo: () => { cerrarHojas(); avisosBloqueo.abrir(); },
    guiaAMano: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.bajarA('.sn-afinar'); versionDeLaGuia = 'aMano'; guiaAtajos.abrir('aMano'); },
    cargadorSinArmar: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.cargador('sinArmar'); sueno.bajarA('.sn-afinar'); },
    cargadorAnda: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.cargador('anda'); sueno.bajarA('.sn-afinar'); },
    cargadorDejo: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.cargador('dejoDeLlegar'); sueno.bajarA('.sn-aviso-cargador'); },
    cargadorMedias: () => { cerrarHojas(); ponerAparato(true); pestanas.ir(3); sueno.cargador('aMedias'); sueno.bajarA('.sn-afinar'); },
    suscripcion: () => { cerrarHojas(); suscripcion.abrir({ acceso: 'nueva' }); },
    entradaConSuscripcion: () => { cerrarHojas(); conSuscripcion = true; if (entrada.paso) entrada.salir(); entrada.empezar(); },
    metaConSuscripcion: () => { cerrarHojas(); conSuscripcion = true; entrada.irA('resultado'); },
    pagoVencida: () => { cerrarHojas(); suscripcion.poner('vencida', { deLaPrueba: true }); suscripcion.abrir(); },
    pagoTermino: () => { cerrarHojas(); suscripcion.poner('vencida', { deLaPrueba: false }); suscripcion.abrir(); },
    pagoSinConexion: () => { cerrarHojas(); suscripcion.abrir({ acceso: 'nueva' }); suscripcion.sinConexion(true); },
    pagoRestaurada: () => { cerrarHojas(); suscripcion.abrir({ acceso: 'nueva' }); suscripcion.conAlgo(true); suscripcion.restaurar(); },
    pagoRegalo: () => { cerrarHojas(); suscripcion.poner('regalo'); suscripcion.abrir({ vista: 'regalo' }); },
    perfilPrueba: () => { cerrarHojas(); suscripcion.poner('prueba', { tengo: 'anual' }); pestanas.ir(5); perfilSec.pintar(); suscripcion.abrirHoja(); },
    perfilActiva: () => { cerrarHojas(); suscripcion.poner('activa', { tengo: 'mensual' }); pestanas.ir(5); perfilSec.pintar(); suscripcion.abrirHoja(); },
    perfilCancelada: () => { cerrarHojas(); suscripcion.poner('activa', { tengo: 'anual', cancelada: true }); pestanas.ir(5); perfilSec.pintar(); suscripcion.abrirHoja(); },
    perfilRegalo: () => { cerrarHojas(); suscripcion.poner('regalo'); pestanas.ir(5); perfilSec.pintar(); suscripcion.abrirHoja(); },
    // Los widgets nuevos (D43).
    widgetsComida: () => { cerrarHojas(); widgets.ir('n-comida'); },
    widgetsCielo: () => { cerrarHojas(); widgets.ir('n-cielo'); },
    widgetsBloqueo: () => { cerrarHojas(); widgets.ir('n-bloqueo'); },
    // Según el deporte (3/11, para aprobar): sin ejemplo elegido, el primero; cada lugar donde se ve.
    deporte: () => { if (!deporte.clave) deporte.poner('vispera'); accionesSeccion.deporteInicio(); },
    deporteInicio: () => { cerrarHojas(); inicio.primerDia(false); pestanas.ir(0, true); inicio.bajar(); },
    deporteTarjeta: () => { cerrarHojas(); deporte.poner('energia'); inicio.primerDia(false); pestanas.ir(0, true); inicio.subir(); },
    // En qué se basa Moss (5/11, para aprobar): abajo de todo de Perfil.
    base: () => { cerrarHojas(); pestanas.ir(5); perfilSec.abrirBase(); },
    // Tu energía (5/11, para aprobar): en Inicio, arriba si es baja y debajo de los macros si no.
    energia: () => { cerrarHojas(); if (deporte.clave) deporte.poner(null); inicio.primerDia(false); pestanas.ir(0, true); inicio.subir(); },
    // La deuda en una palabra y esta noche (5/11, para aprobar): en Sueño, con la noche de hoy.
    deudaEstaNoche: () => { cerrarHojas(); ponerAparato(false); pestanas.ir(3, true); sueno.ponerEstado('datos'); sueno.verNoche(0); setTimeout(() => sueno.bajarA('.sn-deuda'), 240); },
    // Cuidados (5/11, para aprobar): en Perfil, y también en el cuestionario.
    cuidados: () => { cerrarHojas(); pestanas.ir(5); perfilSec.abrirCuidados(); },
    deporteSueno: () => { cerrarHojas(); ponerAparato(false); pestanas.ir(3, true); sueno.ponerEstado('datos'); sueno.verNoche(0); setTimeout(() => sueno.bajarA('.sn-heroe'), 240); },
    deporteBloqueo: () => {
      cerrarHojas();
      const d = deporte.paraBloqueo();
      avisosBloqueo.abrir();
      avisosBloqueo.poner(d ? { modo: 'dia', dia: 'deporte', hora: d.hora, otraHora: false, cenaTemprano: false, pocaProteina: false } : { modo: 'dia' });
    },
    deporteVispera: () => { deporte.poner('vispera'); accionesSeccion.deporteBloqueo(); },
    deportePerfil: () => { cerrarHojas(); pestanas.ir(5); perfilSec.abrirEntreno(); },
    deporteCuestionario: () => {
      cerrarHojas();
      window.__cuestionario('entreno', { tipos: ['equipo'], partidos: true, diaDePartido: 6, horaDePartido: 21 * 60, de: { equipo: { dias: [2, 4], hora: 20 * 60, minutos: 90 } } });
      entrada.irA('cuando');
    },
  };

  // Lo del cielo pasa en Hábitos: los botones de la galería llevan ahí primero.
  const enHabitos = (fn) => () => { cerrarHojas(); pestanas.ir(HABITOS); fn(); };
  const acciones = {
    salud: enHabitos(() => escena.simularSalud()),
    completar: enHabitos(() => escena.completarDia()),
    repetir: enHabitos(() => escena.repetirAnimacion()),
    reiniciar: () => { if (entrada.paso) entrada.salir(); reiniciarHabitos(); cargarLira(); escena.irA('hoy'); pestanas.ir(HABITOS); },
    zona: enHabitos(() => escena.irA(escena.zona() === 'universo' ? 'hoy' : 'universo')),
    fugaz: enHabitos(() => escena.lanzarFugaz()),
    entrada: () => { if (comida.hojaAbierta || mas.abierta) return; conSuscripcion = !entrada.paso; if (entrada.paso) entrada.salir(); else entrada.empezar(); },
  };
  // Va después de todo lo que usa refrescarControles (la escena lo llama al poner la constelación).
  cargarLira();
  $$('[data-accion]').forEach((b) => b.addEventListener('click', () => { acciones[b.dataset.accion](); refrescarControles(); }));
  $$('[data-comida]').forEach((b) => b.addEventListener('click', () => { accionesComida[b.dataset.comida](); refrescarControles(); }));
  $$('[data-pestana]').forEach((b) => b.addEventListener('click', () => { cerrarHojas(); pestanas.ir(Number(b.dataset.pestana)); }));
  $$('[data-seccion]').forEach((b) => b.addEventListener('click', () => { accionesSeccion[b.dataset.seccion](); refrescarControles(); }));
  const accionesAscent = {
    abrir: () => abrirAscent(),
    cerrar: () => { if (ascent.ocupada) ascent.cerrar(); else pestanas.ir(PROGRESO); },
    sueno: () => { cerrarHojas(); pestanas.ir(3); sueno.verNoche(0); },
    asomar: () => { cerrarHojas(); if (ascent.ocupada) ascent.cerrar(true); pestanas.ir(PROGRESO); ascent.asomar(true); },
    invitacion: () => { cerrarHojas(); pestanas.ir(0); ascent.volverAInvitar(); },
  };
  $$('[data-ascent]').forEach((b) => b.addEventListener('click', () => { accionesAscent[b.dataset.ascent](); refrescarControles(); }));
  // Los botones de la galería para los hábitos: el editor (como el «+» o mantener apretada una
  // estrella), «Tu mes» y los primeros hábitos.
  const enHabitosDeUna = () => { cerrarHojas(); if (ascent.ocupada) ascent.cerrar(true); escena.irA('hoy'); pestanas.ir(HABITOS); };
  const accionesHabitos = {
    nuevo: () => { enHabitosDeUna(); habitosSec.nuevo(); },
    editar: () => {
      enHabitosDeUna();
      const i = escena.hoy.habitos.findIndex((h) => !h.auto && !h.encendido);
      habitosSec.editar(Math.max(0, i));
    },
    mes: () => { enHabitosDeUna(); habitosSec.mes(); },
    sugeridos: () => { if (entrada.paso) return; cerrarHojas(); pestanas.ir(0); habitosSec.sugeridos(); },
  };
  $$('[data-habitos]').forEach((b) => b.addEventListener('click', () => { accionesHabitos[b.dataset.habitos](); refrescarControles(); }));
  $$('#saltos-entrada [data-paso]').forEach((b) => b.addEventListener('click', () => {
    if (comida.hojaAbierta) return;
    entrada.irA(b.dataset.paso);
    refrescarControles();
  }));

  function segmento(id, alElegir) {
    const cont = document.getElementById(id);
    cont.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      cont.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      alElegir(b.dataset.valor);
    });
  }
  segmento('s-idioma', (v) => { escena.ponerIdioma(v); comida.ponerIdioma(v); pestanas.ponerTextos(); inicio.pintar(0); progreso.pintar(); sueno.pintar(); perfilSec.pintar(); ascent.pintar(); habitosSec.pintar(); dibujarCatalogo(); });
  segmento('s-vinculo', (v) => vincular(v === 'si'));
  segmento('s-aparato', (v) => ponerAparato(v === 'iphone'));
  segmento('s-noches', (v) => { cerrarHojas(); pestanas.ir(3); sueno.ponerEstado(v); });
  // Prenderla o apagarla cambia Perfil, Progreso (la entrada y el borde del planeta) e Inicio (la invitación).
  const ponerAscentPrendida = (si) => { ascentPrendida = si; perfilSec.pintar(); progreso.pintar(); inicio.pintar(0); };
  segmento('s-ascent-perfil', (v) => { cerrarHojas(); if (ascent.ocupada) ascent.cerrar(true); pestanas.ir(5); ponerAscentPrendida(v === 'si'); });
  window.__ascentEnPerfil = (si) => ponerAscentPrendida(si);
  window.__aparato = (v) => ponerAparato(v === 'iphone');
  segmento('s-estanc', (v) => { pocasSemanas = v === 'pocas'; ascent.pintar(); });
  // Tu rango en Ascent (5/11, para aprobar): el color de la sección y su horizonte. Un planeta lleva al rango 4.
  const marcarRango = () => {
    const r = ascent.rango;
    $$('#s-rango button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.valor) === r.rango)));
    $$('#s-planeta button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === r.planeta)));
  };
  const ponerRango = (n, planeta) => { ascent.ponerRango(n, planeta); ascent.pintar(); marcarRango(); };
  segmento('s-rango', (v) => ponerRango(Number(v), Number(v) === 4 ? 'Ceres' : null));
  // Tu energía de ejemplo: baja, suficiente, alta o sin datos.
  segmento('s-energia', (v) => { if (deporte.clave) deporte.poner(null); inicio.ponerEnergia(v); });
  window.__energia = (v, extra) => { if (deporte.clave) deporte.poner(null); inicio.ponerEnergia(v, extra); };
  segmento('s-planeta', (v) => ponerRango(4, v));
  // Según el deporte: el día de ejemplo (o ninguno) y, el domingo después del partido, con o sin alcohol anotado.
  segmento('s-deporte', (v) => { deporte.poner(v === 'ninguno' ? null : v); });
  segmento('s-alcohol', (v) => { if (deporte.clave !== 'anoche') deporte.poner('anoche'); deporte.ponerAlcohol(v === 'si'); });
  segmento('s-calidad', (v) => escena.ponerCalidad(v));
  // Las kcal: lo elegido queda en el navegador (kcal.js), y el segmento arranca mostrándolo.
  const marcarKcal = () => $$('#s-kcal button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === Kcal.estilo)));
  segmento('s-kcal', (v) => Kcal.poner(v));
  marcarKcal();
  // También se elige dentro de la app, en Todo lo de hoy.
  Kcal.alCambiar(marcarKcal);
  window.__kcal = (v) => { Kcal.poner(v); marcarKcal(); };
  segmento('s-avance', (v) => { avanceSolo = v === 'solo'; });

  // La riqueza del cielo, como la luz juntada desde siempre y el tiempo que lleva juntarla con
  // unos 7 de luz por día (seis hábitos casi todos los días).
  const rRiqueza = $('#r-riqueza');
  let esperaRiqueza = 0;
  function mostrarRiqueza() {
    const r = rRiqueza.value / 100;
    const luz = Math.round(Escena.luzParaRiqueza(r));
    const dias = luz / 7;
    const tiempo = r === 0 ? 'el primer día' : dias < 14 ? `unos ${Math.max(1, Math.round(dias))} días` : dias < 60 ? `unas ${Math.round(dias / 7)} semanas` : dias < 540 ? `unos ${Math.round(dias / 30)} meses` : 'un año y medio';
    $('#o-riqueza').textContent = `${rRiqueza.value}% · ${luz.toLocaleString('es-UY')} de luz · ${tiempo}`;
  }
  rRiqueza.addEventListener('input', () => {
    mostrarRiqueza();
    clearTimeout(esperaRiqueza);
    esperaRiqueza = setTimeout(() => escena.ponerRiqueza(rRiqueza.value / 100), 80);
  });
  mostrarRiqueza();

  // Cuánto se ve la vía láctea: su polvo blanco va al 30 % desde el 21/10/2026 (VIA_LACTEA en
  // src/cielo/mundo.ts).
  const rVia = $('#r-via');
  let esperaVia = 0;
  rVia.addEventListener('input', () => {
    $('#o-via').textContent = rVia.value + '%';
    clearTimeout(esperaVia);
    esperaVia = setTimeout(() => escena.ponerVia(rVia.value / 100), 80);
  });

  const bFps = $('#b-fps');
  bFps.addEventListener('click', () => {
    const si = bFps.getAttribute('aria-pressed') !== 'true';
    bFps.setAttribute('aria-pressed', String(si));
    bFps.textContent = si ? 'Ocultar cuadros por segundo' : 'Mostrar cuadros por segundo';
    escena.mostrarFps(si);
  });

  function inmersivo(si) {
    tel.classList.toggle('inmersivo', si);
    document.body.classList.toggle('inmersivo', si);
    escena.redimensionar();
  }
  $('#b-inmersivo').addEventListener('click', () => inmersivo(true));
  $('#salir-inmersivo').addEventListener('click', () => inmersivo(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && tel.classList.contains('inmersivo')) inmersivo(false); });

  // Sin dibujar cuando no se ve: la batería del teléfono también es parte de la experiencia.
  let visible = true;
  new IntersectionObserver((entradas) => {
    visible = entradas[0].isIntersecting;
    escena.pausar(!visible || document.hidden);
  }).observe(tel);
  document.addEventListener('visibilitychange', () => escena.pausar(!visible || document.hidden));

  // ------------------------------------------------------------ catálogo
  const nombreDe = (v) => (v && typeof v === 'object' ? v[idiomaActual()] || v.es : v);
  const idiomaActual = () => (document.querySelector('#s-idioma [aria-pressed="true"]') || {}).dataset?.valor || 'es';

  function miniatura(lienzo, c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 132, H = 104;
    lienzo.width = W * dpr;
    lienzo.height = H * dpr;
    const ctx = lienzo.getContext('2d');
    ctx.scale(dpr, dpr);
    const plano = Escena.proyectar(c.estrellas);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const esc = plano.length > 1 ? Math.min((W - 26) / Math.max(x1 - x0, 1e-6), (H - 26) / Math.max(y1 - y0, 1e-6)) : 1;
    const pos = plano.map(([x, y]) => [W / 2 + (x - (x0 + x1) / 2) * esc, H / 2 - (y - (y0 + y1) / 2) * esc]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(232, 196, 106, 0.55)';
    ctx.lineWidth = 1;
    c.lineas.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); ctx.stroke(); });
    c.estrellas.forEach((s, i) => {
      const r = Math.max(1.1, Math.min(3.6, 3.3 - 0.5 * s.mag));
      ctx.shadowColor = 'rgba(246, 227, 166, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fbf2d9';
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function dibujarCatalogo() {
    const cont = $('#lista-catalogo');
    if (!lista.length) {
      cont.innerHTML = '<p class="vacio">El catálogo todavía no está en este armado.</p>';
      return;
    }
    const grupos = new Map();
    lista.forEach((c) => {
      const n = c.estrellas.length;
      const clave = n >= 16 ? 16 : n;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(c);
    });
    cont.innerHTML = '';
    [...grupos.keys()].sort((a, b) => a - b).forEach((n) => {
      const fila = document.createElement('div');
      fila.className = 'fila-cat';
      const etiquetaN = n >= 16 ? '16+' : String(n);
      fila.innerHTML = `<div class="num">${etiquetaN}<small>${n === 1 ? 'estrella' : 'estrellas'}</small></div><div class="tarjetas-cat"></div>`;
      const carril = fila.querySelector('.tarjetas-cat');
      grupos.get(n).sort((a, b) => a.estrellas.length - b.estrellas.length).forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cat';
        const tipo = c.tipo === 'asterismo' ? 'Asterismo' : c.tipo === 'estrella' ? 'Estrella' : 'Constelación';
        b.innerHTML = `<canvas></canvas><b></b><span></span><span class="tipo"></span>`;
        b.querySelector('b').textContent = nombreDe(c.nombres);
        // La más brillante: es la que lleva el primer hábito del día.
        b.querySelector('span').textContent = c.estrellas[0] ? c.estrellas[0].nombre : '';
        b.querySelector('.tipo').textContent = tipo + (n >= 16 ? ' · ' + c.estrellas.length : '');
        miniatura(b.querySelector('canvas'), c);
        b.addEventListener('click', () => {
          if (entrada.paso || comida.hojaAbierta || mas.abierta || habitosSec.abierta) return;
          const datos = c.id === 'lyra' ? LIRA : c;
          const habitos = c.id === 'lyra' ? habitosLira() : habitosDeMentira(c.estrellas.length);
          escena.ponerConstelacion(datos, habitos);
          escena.irA('hoy');
          pestanas.ir(HABITOS);
          refrescarControles();
          if (!tel.classList.contains('inmersivo')) tel.scrollIntoView({ behavior: movimientoReducido ? 'auto' : 'smooth', block: 'center' });
        });
        carril.appendChild(b);
      });
      cont.appendChild(fila);
    });
  }
  dibujarCatalogo();
  refrescarControles();
  SeccionTienda.crear($('#tienda-contenido'));
  SeccionRevision.crear($('#revision-contenido'));

  // ------------------------------------------------------------ los widgets (spec/widgets.md)
  // Abrir Moss desde un widget: lo tocado ahí se enciende en el cielo, de a una estrella.
  widgets = SeccionWidgets.crear(tel, Object.assign({}, opcionesDeSeccion, {
    cielo: () => escena.hoy,
    anoche: () => sueno.anoche(),
    sinReloj: () => soloIphone,
    comida: () => comida,
    movimientoReducido,
    alAbrirMoss: (cambios, seccion, confirmada, tocado, anotar) => {
      cerrarHojas();
      if (ascent.ocupada) ascent.cerrar(true);
      escena.irA('hoy');
      pestanas.ir({ sueno: 3, comida: COMIDA, inicio: 0 }[seccion] ?? HABITOS, true);
      cambios.forEach((nombre, i) => setTimeout(() => { escena.tocarPorNombre(nombre); refrescarControles(); }, (movimientoReducido ? 0 : 450) + i * 320));
      // Lo tocado en los widgets de comida y de agua pasa al día, por el mismo camino que en Moss.
      (tocado ? tocado.comidas : []).forEach((tipo) => comida.sumarDeSiempre(tipo));
      for (let i = 0; tocado && i < tocado.vasos; i++) comida.sumarAgua();
      for (let i = 0; tocado && i > tocado.vasos; i--) comida.quitarAgua();
      // Un botón de un widget abre Moss justo ahí: la hoja de anotar, en esa comida.
      if (anotar) {
        comida.abrirHoja({ comida: anotar.tipo });
        if (anotar.via === 'decir') comida.decir({ escuchar: true });
        if (anotar.via === 'etiqueta') comida.etiqueta();
        if (anotar.via === 'codigo') comida.escanear();
      }
    },
  }));

  // Ganchos para las capturas automáticas (herramientas/capturar-galeria.mjs).
  let cenaDeMas = null;
  window.__widgets = (accion, arg) => {
    const pasos = {
      inicio: () => widgets.ir('inicio'), bloqueo: () => widgets.ir('bloqueo'), standby: () => widgets.ir('standby'), cerrar: () => widgets.cerrar(),
      tocar: () => widgets.tocar(arg), confirmar: () => widgets.confirmar(), modo: () => widgets.ponerModo(arg), deNoche: () => widgets.deNoche(arg),
      abrirMoss: () => widgets.abrirMoss(arg), olvidar: () => widgets.olvidar(),
      n: () => widgets.ir('n-' + arg), momento: () => widgets.momento(arg), tocarComida: () => widgets.tocarComida(arg), vasos: () => widgets.vasos(arg),
      completar: () => widgets.completar(), olvidarTodo: () => widgets.olvidarTodo(),
      pasarse: () => { cenaDeMas = comida.simularCena(); widgets.pintar(); }, noPasarse: () => { if (cenaDeMas) cenaDeMas.deshacer(); cenaDeMas = null; widgets.pintar(); },
    };
    return pasos[accion]();
  };
  window.__tocar = (texto) => escena.tocarPorNombre(texto);
  window.__accion = (nombre) => { acciones[nombre](); refrescarControles(); };
  window.__idioma = (v) => document.querySelector(`#s-idioma [data-valor="${v}"]`).click();
  window.__calidad = (v) => document.querySelector(`#s-calidad [data-valor="${v}"]`).click();
  window.__riqueza = (r) => { rRiqueza.value = Math.round(r * 100); mostrarRiqueza(); escena.ponerRiqueza(r); };
  window.__via = (v) => { rVia.value = Math.round(v * 100); $('#o-via').textContent = rVia.value + '%'; escena.ponerVia(v); };
  window.__pagina = (i, deUna) => pestanas.ir(i, deUna);
  window.__inicio = (accion, arg) => {
    const pasos = { personalizar: () => inicio.personalizar(), cerrar: () => inicio.cerrar(), poner: () => inicio.poner(arg[0], arg[1]), mover: () => inicio.mover(arg[0], arg[1]), fabrica: () => inicio.deFabrica(), bajar: () => inicio.bajar(), subir: () => inicio.subir(), primerDia: () => inicio.primerDia(arg), cerrarTodo: () => inicio.cerrarTodo(), bajarTodo: () => inicio.bajarTodo(arg) };
    pasos[accion]();
    refrescarControles();
  };
  window.__mas = (accion, arg) => {
    const pasos = { abrir: () => accionesSeccion.mas(), cerrar: () => mas.cerrar(), ir: () => mas.ir(arg), medir: () => mas.medir(arg[0], arg[1]), bajar: () => mas.bajar(), reciente: () => mas.tocarReciente() };
    pasos[accion]();
    refrescarControles();
  };
  window.__progreso = (accion, arg) => {
    const pasos = { metas: () => progreso.verMetas(), principal: () => progreso.verPrincipal(), quien: () => progreso.ponerQuien(arg), repartir: () => progreso.repartir(arg), abrir: () => progreso.abrir(arg), bajar: () => progreso.bajarA(arg), subir: () => progreso.subir(), plazo: () => progreso.plazo(arg), rango: () => progreso.rango(arg), masDatos: () => progreso.masDatos(arg), cambiarPlan: () => progreso.cambiarPlan(arg), sinMedidas: () => progreso.sinMedidas(arg) };
    pasos[accion]();
  };
  window.__estrategia = (cambios) => ponerEstrategia(cambios);
  window.__sueno = (accion, arg) => {
    const pasos = {
      noche: () => sueno.verNoche(arg), bajar: () => sueno.bajarA(arg), subir: () => sueno.subir(), abrir: () => sueno.abrir(arg),
      hora: () => sueno.preguntarHora(arg), editarHora: () => sueno.editarHora(), editarNoche: () => sueno.editarNoche(arg), olvidar: () => sueno.olvidarHoras(),
      afinar: () => (Array.isArray(arg) ? sueno.afinar(arg[0], arg[1]) : sueno.afinar(arg)),
      porque: () => sueno.porque(arg),
      cargador: () => sueno.cargador(arg),
      estado: () => sueno.ponerEstado(arg),
    };
    pasos[accion]();
  };
  window.__seccion = (nombre) => { accionesSeccion[nombre](); refrescarControles(); };
  // Según el deporte, para las capturas: elegir un día de ejemplo (o null), el alcohol del domingo, y cada lugar.
  window.__deporte = (accion, arg) => {
    const pasos = {
      poner: () => deporte.poner(arg), alcohol: () => deporte.ponerAlcohol(arg),
      inicio: () => accionesSeccion.deporteInicio(), tarjeta: () => accionesSeccion.deporteTarjeta(), sueno: () => accionesSeccion.deporteSueno(),
      bloqueo: () => accionesSeccion.deporteBloqueo(), perfil: () => accionesSeccion.deportePerfil(), cuestionario: () => accionesSeccion.deporteCuestionario(),
    };
    pasos[accion]();
    refrescarControles();
  };
  window.__guia = (paso, extra) => guiaAtajos.irA(paso, extra);
  // «Para hoy» en otro momento del día, para las capturas (mediodia, tarde, nada, bien; null, el de la galería).
  window.__paraHoy = (e) => inicio.ejemplo(e);
  window.__suscripcion = (accion, arg) => suscripcion[accion](arg);
  // Para las capturas de lo que cuida (lo pediste el 22/10): Salud dice 16 años, es su caso, los números ocultos, poco sueño.
  window.__seguridad = (accion, arg) => {
    const pasos = {
      menor: () => entrada.menor(), caso: () => entrada.caso(arg), numeros: () => perfilSec.poner({ numeros: arg }),
      sinDeficit: () => perfilSec.poner({ sinDeficit: arg }), poco: () => sueno.poco(arg),
    };
    pasos[accion]();
  };
  window.__ascent = (accion, arg) => {
    const pasos = {
      abrir: () => abrirAscent(true),
      cerrar: () => ascent.cerrar(true),
      arrastrar: () => { if (pestanas.actual !== PROGRESO) pestanas.ir(PROGRESO, true); ascent.arrastrar(arg); },
      vincular: () => vincular(arg),
      hojaVincular: () => ascent.abrirVincular(),
      pocas: () => { pocasSemanas = arg; ascent.pintar(); },
      bajar: () => ascent.bajarA(arg),
      subir: () => ascent.subir(),
      iphone: () => ascent.ponerIphone(arg),
      dia: () => ascent.ponerDia(arg),
      // [rango, planeta]: tu rango en Ascent.
      rango: () => ponerRango(arg[0], arg[1]),
      asomar: () => ascent.asomar(true),
      como: () => ascent.abrirComo(),
      volverAInvitar: () => ascent.volverAInvitar(),
    };
    pasos[accion]();
    refrescarControles();
  };
  // Los hábitos: el editor, «Tu mes» y los primeros hábitos. `__estrella` dice dónde apretar.
  window.__habitos = (accion, arg) => {
    const aHabitos = () => { cerrarHojas(); pestanas.ir(HABITOS, true); };
    const pasos = {
      nuevo: () => { aHabitos(); habitosSec.nuevo(); },
      editar: () => { aHabitos(); habitosSec.editar(escena.hoy.habitos.findIndex((h) => (h.nombre.es || h.nombre) === arg)); },
      como: () => habitosSec.como(arg),
      escribir: () => habitosSec.escribir(arg),
      icono: () => habitosSec.ponerIcono(arg),
      guardar: () => habitosSec.guardar(),
      mes: () => { aHabitos(); habitosSec.mes(); },
      mover: () => habitosSec.moverMes(arg),
      sugeridos: () => { cerrarHojas(); habitosSec.sugeridos(); },
      elegir: () => habitosSec.alternar(arg),
      armar: () => habitosSec.armar(),
      bajar: () => habitosSec.bajar(arg),
      cerrar: () => habitosSec.cerrar(),
      aviso: () => habitosSec.ponerAviso(arg),
    };
    pasos[accion]();
    refrescarControles();
  };
  window.__estrella = (texto) => escena.dondeEsta(texto);
  window.__deslizando = () => pestanas.deslizando;
  window.__entrada = (paso) => { if (paso === null) { conSuscripcion = false; entrada.salir(); } else entrada.irA(paso); refrescarControles(); };
  window.__metas = () => entrada.metas();
  window.__velocidad = (v) => escena.velocidad(v);
  window.__comida = (accion, arg) => {
    const pasos = {
      registrar: () => comida.abrirHoja(), cerrar: () => comida.cerrarHoja(),
      escribir: () => comida.escribir(arg), ficha: () => comida.ficha(arg), agregar: () => comida.agregarPrimero(),
      sumar: () => comida.sumar(), listo: () => comida.listo(), confirmar: () => comida.confirmar(), cena: () => comida.simularCena(),
      vista: () => comida.vista(arg),
      rapida: () => comida.cargaRapida(), guardadas: () => comida.guardadas(), copiar: () => comida.copiarDeAyer(arg), etiqueta: () => comida.etiqueta(arg),
      dia: () => comida.verDia(arg), bajar: () => comida.bajarA(arg), teclado: () => comida.teclado(arg), dictar: () => comida.dictar(),
      armar: () => comida.armarDia(), armarSemana: () => comida.armarSemana(), compras: () => comida.compras(), tusComidas: () => comida.tusComidas(),
      cerrarPlan: () => comida.cerrarPlan(), otra: () => comida.otraDel(arg), comiEsto: () => comida.comiEsto(arg), pegarReceta: () => comida.pegarReceta(),
      decir: () => comida.decir(arg), porQue: () => comida.porQue(), entreno: () => comida.ponerEntreno(arg.entreno || comida.entreno, arg.ver),
      foto: () => (Array.isArray(arg) ? comida.foto(arg[0], arg[1]) : comida.foto(arg)),
    };
    const r = pasos[accion]();
    refrescarControles();
    return r;
  };
  window.__viajando = () => escena.viajando;
})();
