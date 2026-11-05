// Según el tipo de deporte, para aprobar (spec/entreno.md, 5.12): siete días de ejemplo, cada uno con su
// deporte, su persona y su día, y lo que dice cada lugar con las reglas de la app tal cual: SegunElDeporte
// (src/dominio/segunElDeporte.ts), mezclado en «Para hoy» por ParaHoy y en los avisos por LoQueConviene. Se ve
// en Inicio («Para hoy» y la tarjeta de la energía baja), en Sueño (la línea debajo de la noche), en la
// pantalla bloqueada y en Perfil › Entrenamiento (el partido y la próxima carrera). Se elige en la sección
// «Según el deporte» de la galería; sin ejemplo, todo queda como siempre.

const Deporte = (() => {
  const hm = (h, m = 0) => h * 60 + m;
  const sesion = (tipo, dias, hora, minutos) => ({ tipo, dias, hora, minutos });
  const entreno = (sesiones, partidos = null) => ({ tipos: [...new Set(sesiones.map((s) => s.tipo))], sesiones, partidos });
  /** Una tendencia del peso que baja `enTres` (parte del peso) cada tres semanas, pareja, hasta `hoy`. */
  const tendencia = (hoy, kg, enTres) => {
    const porDia = 1 - Math.pow(1 - enTres, 1 / 21);
    return new Map(Array.from({ length: 50 }, (_, i) => [Fechas.sumarDias(hoy, -i), kg / Math.pow(1 - porDia, i)]));
  };
  const catorce = (hoy, f) => Array.from({ length: 14 }, (_, i) => f(Fechas.sumarDias(hoy, -i), i));

  // Las personas de los ejemplos: un futbolista que juega los sábados a las 21, una corredora con una carrera
  // de 2 h el domingo 25, uno de básquetbol y pesas, uno de rugby y uno de bici.
  const FUTBOLISTA = { sexo: 'm', edad: 26, pesoKg: 72 };
  const META_FUTBOL = { kcal: 2700, proteina: 130, carbohidratos: 380, grasas: 75 };
  const FUTBOL = entreno([sesion('equipo', [2, 4, 6], hm(20), 90)], { dia: 6, hora: hm(21) });
  const CORREDORA = { sexo: 'f', edad: 34, pesoKg: 58 };
  const META_CORREDORA = { kcal: 2150, proteina: 105, carbohidratos: 290, grasas: 62 };
  const CORRER = entreno([sesion('resistencia', [2, 4], hm(7), 50), sesion('resistencia', [6], hm(8), 100)]);
  const CARRERA = { fecha: '2026-10-25', minutos: 120 };

  // Cada ejemplo: la persona y su meta, el día, el entreno (lo del cuestionario), lo que recibe la regla además
  // (`regla`), el resto del día en «Para hoy» (`paraHoy`: la hora, lo anotado y el agua) y en la pantalla
  // bloqueada la sesión de ese día, lo que tarda en llegar y a qué hora mirarla (`bloqueo`). Lo que muestra cada
  // uno está en la sección «Según el deporte» de la galería (pagina.html).
  const EJEMPLOS = {
    vispera: {
      nombre: 'Fútbol, la víspera', persona: FUTBOLISTA, meta: META_FUTBOL, hoy: '2026-10-23', entreno: FUTBOL, regla: {},
      paraHoy: { ahora: hm(17, 40), comido: { kcal: 1250, proteina: 110, carbohidratos: 95, grasas: 38 }, sinAnotar: [], anotadas: 3, proxima: 'cena', agua: { ml: 750, meta: 2000 } },
      bloqueo: { sesion: null, viaje: 15, hora: hm(13, 5) },
    },
    anoche: {
      nombre: 'Fútbol, jugaste anoche', persona: FUTBOLISTA, meta: META_FUTBOL, hoy: '2026-10-25', entreno: FUTBOL,
      // Dos rondas después del partido: 84 g de alcohol, más de un gramo por kilo (72 g).
      regla: { alcohol: [{ dia: '2026-10-24', minutos: hm(23, 20), gramos: 42 }, { dia: '2026-10-24', minutos: hm(24, 50), gramos: 42 }] },
      paraHoy: { ahora: hm(11), comido: { kcal: 520, proteina: 26, carbohidratos: 72, grasas: 15 }, sinAnotar: [], anotadas: 1, proxima: 'almuerzo' },
      bloqueo: { sesion: null, viaje: 15, hora: hm(9) },
    },
    carrera: {
      nombre: 'Corredora, la carrera del domingo', persona: CORREDORA, meta: META_CORREDORA, hoy: '2026-10-23', entreno: CORRER, carrera: CARRERA, regla: {},
      paraHoy: { ahora: hm(13, 30), comido: { kcal: 880, proteina: 52, carbohidratos: 120, grasas: 26 }, sinAnotar: [], anotadas: 2, proxima: 'merienda' },
      bloqueo: { sesion: null, viaje: 0, hora: hm(13, 5) },
    },
    pico: {
      nombre: 'Corredora, la más larga del mes', persona: CORREDORA, meta: META_CORREDORA, hoy: '2026-10-17', entreno: CORRER,
      regla: {
        // Hoy, 18 km; la más larga de los 30 días anteriores, 15 (el 20 % más).
        corridas: [['2026-09-19', 13], ['2026-09-26', 14], ['2026-10-03', 15], ['2026-10-06', 8], ['2026-10-08', 8], ['2026-10-10', 15], ['2026-10-13', 8], ['2026-10-15', 8], ['2026-10-17', 18]].map(([dia, km]) => ({ dia, km })),
        // Dos semanas bien anotadas con unos 7 mg de hierro por día: debajo de los 8,1 del requerimiento promedio (EAR) de
        // las mujeres de 19 a 50, que es contra lo que se compara (no contra los 18 recomendados: IOM 2000).
        minerales: catorce('2026-10-17', (dia, i) => ({ dia, kcal: 1950, meta: 2150, hierro: 6.6 + (i % 3) * 0.4, calcio: 1080 })),
      },
      paraHoy: { ahora: hm(12, 30), comido: { kcal: 640, proteina: 30, carbohidratos: 96, grasas: 16 }, sinAnotar: [], anotadas: 1, proxima: 'almuerzo' },
      bloqueo: { sesion: { inicio: hm(8), minutos: 100, tipo: 'resistencia' }, viaje: 0, hora: hm(12) },
    },
    carga: {
      nombre: 'Básquetbol y pesas, más carga', persona: { sexo: 'm', edad: 23, pesoKg: 80 }, meta: { kcal: 2900, proteina: 145, carbohidratos: 390, grasas: 80 },
      hoy: '2026-10-21', entreno: entreno([sesion('equipo', [1, 3, 5], hm(19), 90), sesion('fuerza', [2, 4], hm(18), 60)], { dia: 6, hora: hm(11) }),
      // La semana, 560 minutos contra unos 425 de las cuatro anteriores; 5 de 7 noches de menos de 7 h.
      regla: { carga: { semana: 560, anteriores: [410, 440, 430, 420] }, noches: [390, 410, 440, 400, 415, 430, 405] },
      paraHoy: { ahora: hm(13, 30), comido: { kcal: 1150, proteina: 60, carbohidratos: 150, grasas: 34 }, sinAnotar: [], anotadas: 2, proxima: 'merienda' },
      bloqueo: { sesion: { inicio: hm(19), minutos: 90, tipo: 'mixta' }, viaje: 15, hora: hm(17, 30) },
    },
    energia: {
      nombre: 'Rugby, comiendo de menos', persona: { sexo: 'm', edad: 27, pesoKg: 95 }, meta: { kcal: 3400, proteina: 170, carbohidratos: 430, grasas: 105 },
      hoy: '2026-10-22', entreno: entreno([sesion('contacto', [2, 4], hm(19, 30), 90), sesion('fuerza', [1, 3, 5], hm(7), 60)], { dia: 6, hora: hm(15) }),
      // Quiere mantener, y su tendencia baja un 1,4 % cada tres semanas hace más de dos semanas.
      regla: { energia: { objetivo: 'mantener', tendencia: tendencia('2026-10-22', 95.2, 0.014) } },
      paraHoy: { ahora: hm(17, 30), comido: { kcal: 1500, proteina: 85, carbohidratos: 180, grasas: 50 }, sinAnotar: [], anotadas: 3, proxima: 'cena' },
      bloqueo: { sesion: { inicio: hm(19, 30), minutos: 90, tipo: 'mixta' }, viaje: 15, hora: hm(18) },
    },
    bici: {
      nombre: 'Bici, pesado antes y después', persona: { sexo: 'm', edad: 41, pesoKg: 70 }, meta: { kcal: 2700, proteina: 125, carbohidratos: 360, grasas: 80 },
      hoy: '2026-10-24', entreno: entreno([sesion('resistencia', [2, 4], hm(7), 60), sesion('resistencia', [6], hm(9), 150)]),
      // Pesado a las 8:50 (70,4 kg) y a las 11:40 (69,2 kg), alrededor de 2 h 30 de bici, con medio litro en el medio.
      regla: { pesadas: { antes: { minutos: hm(8, 50), kg: 70.4 }, despues: { minutos: hm(11, 40), kg: 69.2 }, sesion: { inicio: hm(9), minutos: 150 }, aguaEntre: 500 } },
      paraHoy: { ahora: hm(12, 10), comido: { kcal: 700, proteina: 32, carbohidratos: 110, grasas: 16 }, sinAnotar: [], anotadas: 1, proxima: 'almuerzo' },
      bloqueo: { sesion: { inicio: hm(9), minutos: 150, tipo: 'resistencia' }, viaje: 0, hora: hm(12) },
    },
  };

  function crear(opciones) {
    // `dichas`: los ejemplos en que se tocó «No mostrar más»; volver a elegirlo la trae de nuevo (solo en la galería).
    const s = { clave: null, alcohol: true, dichas: new Set(), antes: null };
    const actual = () => (s.clave ? EJEMPLOS[s.clave] : null);

    /** Lo que recibe la regla: la persona, el día, el entreno y lo de cada ejemplo, con los números y «sin déficit» de Perfil. */
    function entrada(ej) {
      return Object.assign(
        { hoy: ej.hoy, entreno: ej.entreno, carrera: ej.carrera || null, sinNumeros: opciones.sinNumeros(), sinDeficit: opciones.sinDeficit(), energiaBajaDicha: s.dichas.has(s.clave) },
        ej.persona, ej.regla, s.clave === 'anoche' && !s.alcohol ? { alcohol: [] } : {},
      );
    }
    const consejos = () => { const ej = actual(); return ej ? SegunElDeporte.segunElDeporte(entrada(ej)) : []; };
    const partidos = (ej) => SegunElDeporte.partidosEntre(ej.entreno, Fechas.sumarDias(ej.hoy, -7), Fechas.sumarDias(ej.hoy, 7));

    return {
      EJEMPLOS,
      get clave() { return s.clave; },
      get alcohol() { return s.alcohol; },
      /** Elegir un ejemplo (null, ninguno): la tarjeta vuelve, y el alcohol del domingo vuelve a estar anotado. */
      poner(clave) {
        s.clave = clave && EJEMPLOS[clave] ? clave : null;
        if (s.clave) s.dichas.delete(s.clave);
        s.alcohol = true;
        opciones.alCambiar();
      },
      ponerAlcohol(si) { s.alcohol = !!si; opciones.alCambiar(); },
      /** Para Inicio: el día, «Para hoy» (el resto del día y lo del deporte) y la tarjeta, si hay. */
      paraInicio() {
        const ej = actual();
        if (!ej) return null;
        const lista = consejos();
        return {
          hoy: ej.hoy,
          paraHoy: Object.assign({ meta: ej.meta, agua: null }, ej.paraHoy, { deporte: lista }),
          tarjeta: lista.find((c) => c.donde === 'tarjeta') || null,
          noMostrarMas: () => { s.dichas.add(s.clave); opciones.alCambiar(); },
        };
      },
      /** Para Sueño: el día y la línea de debajo de la noche, si hay. */
      paraSueno() {
        const ej = actual();
        return ej ? { hoy: ej.hoy, linea: consejos().find((c) => c.donde === 'sueno') || null } : null;
      },
      /** Para la pantalla bloqueada: el día, la sesión, los partidos y la carrera, y a qué hora mirarlo. */
      paraBloqueo() {
        const ej = actual();
        if (!ej) return null;
        return { nombre: ej.nombre, dia: ej.hoy, sesion: ej.bloqueo.sesion, viaje: ej.bloqueo.viaje, hora: ej.bloqueo.hora, partidos: partidos(ej), carrera: ej.carrera || null, pesoKg: ej.persona.pesoKg };
      },
      /** Para Perfil › Entrenamiento: los deportes, el horario principal, el partido y la carrera. */
      paraPerfil() {
        const ej = actual();
        if (!ej) return null;
        const horario = Cuestionario.horarioDeLosAvisos(ej.entreno);
        return Object.assign({}, horario, { tipos: ej.entreno.tipos, partido: ej.entreno.partidos, carrera: ej.carrera || null });
      },
    };
  }

  return { crear, EJEMPLOS };
})();
