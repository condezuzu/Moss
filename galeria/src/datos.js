// La persona de mentira de la galería: quiere bajar a 71 kg y empezó el lunes 31 de agosto. Acá
// están lo que la app guardaría (su perfil, sus pesadas, sus medidas, lo que Salud trae de sus
// noches, sus hábitos y lo que hizo cada día); lo que se calcula con eso (la tendencia, el
// control, el progreso, la grasa, el sueño y las estadísticas de Hábitos) lo calculan los módulos
// de la app (Control, Progreso, Cuerpo, Sueno, SinReloj y Estadisticas) en cada sección.

const Datos = (() => {
  const HOY = '2026-10-21';
  // Las 21:47 del miércoles, como el resto de la galería.
  const AHORA_MIN = 21 * 60 + 47;
  const INICIO = '2026-08-31';
  const PERFIL = {
    sexo: 'm', nacimiento: 1995, alturaCm: 178, actividad: 'activo', objetivo: 'bajar', ritmo: 'recomendado',
    estilo: 'equilibrada', pesoMeta: 71, nombre: 'Agustín',
    // Lo que contestó en el cuestionario nuevo (src/dominio/cuestionario.ts, para aprobar): trabaja sentado,
    // va al gimnasio cuatro veces por semana (los días de Ascent) a 15 minutos de casa, sin partidos ni
    // combate, hace dos años; eligió la figura de 18 a 21 % de grasa; al llegar a 71 kg, mantener; come a
    // estas horas, y se acuesta y se despierta más tarde el fin de semana. `actividad` queda como lo de
    // siempre, que es lo que guarda la base.
    movimiento: 'sentado',
    entreno: {
      // Los deportes (de ahí salen los consejos) y la sesión de cada uno; los partidos con su día y la
      // categoría de peso, solo si corresponden.
      tipos: ['fuerza'],
      sesiones: [{ tipo: 'fuerza', dias: [1, 3, 5, 0], hora: 19 * 60, minutos: 60 }],
      viaje: 15, partidos: null, categoriaDePeso: null,
      // SOLO para el horario de los avisos, que hoy lleva uno (Cuestionario.horarioDeLosAvisos).
      tipo: 'fuerza', dias: [1, 3, 5, 0], hora: 19 * 60, minutos: 60,
    },
    experiencia: 'intermedio',
    grasaDicha: { como: 'imagen', pct: 19.5 },
    despues: 'mantener',
    proteina: 'recomendada',
    horarios: { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 + 30 },
    sueno: { despertar: 7 * 60 + 15, acostarse: 23 * 60 + 30, finDeSemana: 'tarde' },
  };
  // El gasto del control anterior (el del lunes 12), del que parte el del lunes 19.
  const GASTO_ANTERIOR = 3000;

  // Un azar que sale igual cada vez.
  const azar = (semilla) => { let s = semilla; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  // Siete semanas bajando unos 380 g por semana, con el ruido de todos los días (agua, sal, el
  // fin de semana). Casi nunca se pesa los domingos, y hoy todavía no se pesó.
  const PESADAS = (() => {
    const r = azar(5);
    const lista = [];
    const dias = Fechas.diasEntre(INICIO, HOY);
    for (let d = 0; d < dias; d++) {
      const fecha = Fechas.sumarDias(INICIO, d);
      const dia = Fechas.diaDeLaSemana(fecha);
      const salta = (dia === 0 && r() < 0.8) || r() < 0.1;
      const kg = 77.3 - 0.055 * d + (r() - 0.5) * 0.7 + (dia === 1 ? 0.3 : 0);
      if (!salta) lista.push({ fecha, kg: Math.round(kg * 10) / 10, origen: 'salud', momento: fecha + 'T07:20:00.000Z' });
    }
    return lista;
  })();

  // Tres veces con la cinta, cada tres semanas. La cadera, el brazo, el pecho y el muslo no entran
  // en la cuenta de un hombre, pero se siguen igual.
  const MEDIDAS = [
    { fecha: '2026-08-31', cintura: 88.5, cuello: 38.5, cadera: 99, brazo: 34, pecho: 103, muslo: 58.5 },
    { fecha: '2026-09-21', cintura: 87, cuello: 38.5, cadera: 98, brazo: 33.5, pecho: 101.5, muslo: 58 },
    { fecha: '2026-10-12', cintura: 85.5, cuello: 38, cadera: 97, brazo: 33.5, pecho: 100.5, muslo: 57.5 },
  ].map((m) => Object.assign({ actualizado: m.fecha + 'T08:00:00.000Z' }, m));

  // ------------------------------------------------------------ las noches, como las trae Salud
  // Cuatro semanas del reloj, con sus etapas en ciclos de hora y media (más profundo al principio,
  // más REM al final) y despertares cortos, y el «en cama» del iPhone todas las noches. Para ver
  // cómo se muestra lo que falta: el sábado 10 no hay nada, el sábado 17 el reloj se quedó sin
  // batería (solo está el iPhone) y el domingo 4 se cortó a las 2:30. El domingo 18 hay una siesta.
  const ZONA = -180;
  const FUENTES = [
    { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' },
    { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' },
  ];
  const SIN_NADA = '2026-10-10';
  const SIN_RELOJ = '2026-10-17';
  const CORTADA = '2026-10-04';
  // Un instante a una hora local (en minutos desde las 18 del día anterior a la clave).
  const instante = (clave, minuto) => Date.parse(clave + 'T00:00:00.000Z') - 6 * 3600e3 - ZONA * 60e3 + minuto * 60e3;
  const { MUESTRAS, LECTURAS } = (() => {
    const r = azar(31);
    const muestras = [];
    const lecturas = { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() };
    for (let i = 27; i >= 0; i--) {
      const clave = Fechas.sumarDias(HOY, -i);
      const dia = Fechas.diaDeLaSemana(clave);
      const finde = dia === 6 || dia === 0;
      // Anoche, a la hora de la galería: de 23:41 a 7:13.
      const anoche = i === 0;
      const dormirse = anoche ? 341 : 330 + (finde ? 70 : 0) + Math.round((r() - 0.5) * 40);
      const despertar = anoche ? 793 : 785 + (finde ? 85 : 0) + Math.round((r() - 0.5) * 30);
      lecturas.reposo.set(clave, Math.round(55 + (r() - 0.5) * 4));
      if (clave === SIN_NADA) continue;
      muestras.push({ etapa: 'enCama', desde: instante(clave, dormirse - 12 - Math.round(r() * 15)), hasta: instante(clave, despertar + 6 + Math.round(r() * 10)), fuente: 'iphone', zona: ZONA });
      if (clave === SIN_RELOJ) continue;
      const fin = clave === CORTADA ? 510 : despertar;
      // Los ciclos: núcleo, profundo (cada vez menos), núcleo y REM (cada vez más), con algún despertar.
      let t = dormirse;
      let ciclo = 0;
      const despertares = anoche ? [178, 395] : [Math.round(150 + r() * 120), Math.round(320 + r() * 120)].slice(0, 1 + Math.floor(r() * 2));
      const poner = (etapa, minutos) => {
        const hasta = Math.min(fin, t + minutos);
        if (hasta > t) muestras.push({ etapa, desde: instante(clave, t), hasta: instante(clave, hasta), fuente: 'reloj', zona: ZONA });
        t = hasta;
      };
      while (t < fin) {
        const profundo = Math.max(4, 38 - ciclo * 11 + Math.round((r() - 0.5) * 10));
        const rem = Math.min(48, 12 + ciclo * 9 + Math.round((r() - 0.5) * 8));
        poner('nucleo', 24 + Math.round(r() * 12));
        poner('profundo', profundo);
        poner('nucleo', 16 + Math.round(r() * 10));
        if (despertares.length && t - dormirse >= despertares[0]) { despertares.shift(); poner('despierto', anoche ? 9 : 2 + Math.round(r() * 10)); }
        poner('rem', rem);
        ciclo++;
      }
      // Lo que el reloj mide mientras dormís: el pulso seguido, la variabilidad pocas veces y la respiración.
      for (let m = dormirse + 5; m < fin; m += 7) lecturas.frecuencia.push({ en: instante(clave, m), valor: Math.round(51 + Math.sin(m / 40) * 2 + (r() - 0.5) * 3 + (anoche ? 1.5 : 0)) });
      for (let m = dormirse + 40; m < fin; m += 95 + Math.round(r() * 40)) lecturas.variabilidad.push({ en: instante(clave, m), valor: Math.round(47 + (r() - 0.5) * 16 - (anoche ? 4 : 0)) });
      for (let m = dormirse + 20; m < fin; m += 30) lecturas.respiracion.push({ en: instante(clave, m), valor: Math.round((14.2 + (r() - 0.5) * 1.2) * 10) / 10 });
    }
    // La siesta del domingo 18.
    muestras.push({ etapa: 'nucleo', desde: instante('2026-10-18', 21 * 60 + 20), hasta: instante('2026-10-18', 21 * 60 + 55), fuente: 'reloj', zona: ZONA });
    return { MUESTRAS: muestras, LECTURAS: lecturas };
  })();
  const NOCHES = Sueno.armarNoches(MUESTRAS, FUENTES);
  const SOLO_EN_CAMA = Sueno.soloEnCama(MUESTRAS, FUENTES, NOCHES);

  // ------------------------------------------------------------ la misma persona, sin reloj
  // Lo que guardó el teléfono cada día (los pasos, el movimiento y cuándo usó Moss) y lo que Moss
  // estimó con eso cada mañana (SinReloj, src/dominio/sinReloj.ts): algunas mañanas lo confirmó y dos
  // lo corrigió, y con eso aprendió. Anoche usó el teléfono a las 2 y a las 4: Moss no está segura y
  // pregunta. Las noches de verdad son las mismas que las del reloj. Con el atajo del cargador armado.
  const ESTIMACIONES = {};
  const PROPIAS_SIN_RELOJ = (() => {
    const r = azar(47);
    const propias = [];
    const iso = (clave, min) => new Date(instante(clave, Math.round(min))).toISOString();
    for (let i = 27; i >= 0; i--) {
      const clave = Fechas.sumarDias(HOY, -i);
      const dia = Fechas.diaDeLaSemana(clave);
      const finde = dia === 6 || dia === 0;
      const anoche = i === 0;
      const dormirse = anoche ? 341 : 330 + (finde ? 70 : 0) + Math.round((r() - 0.5) * 40);
      const despertar = anoche ? 793 : 785 + (finde ? 85 : 0) + Math.round((r() - 0.5) * 30);
      if (clave === SIN_NADA) continue;
      const ultimo = dormirse - 12 - r() * 25, primero = despertar + 4 + r() * 22;
      const actividad = [
        { desde: instante(clave, -300), hasta: instante(clave, -255), tipo: 'pasos' },
        { desde: instante(clave, 40), hasta: instante(clave, 75), tipo: 'pasos' },
        { desde: instante(clave, ultimo - 25), hasta: instante(clave, ultimo), tipo: 'movimiento' },
        { desde: instante(clave, primero), hasta: instante(clave, primero + 20), tipo: 'pasos' },
        { desde: instante(clave, primero + 30), hasta: instante(clave, primero + 33), tipo: 'moss' },
      ];
      if (anoche) actividad.push({ desde: instante(clave, 490), hasta: instante(clave, 494), tipo: 'moss' }, { desde: instante(clave, 620), hasta: instante(clave, 626), tipo: 'movimiento' });
      actividad.push(
        { desde: instante(clave, ultimo - 8), hasta: instante(clave, ultimo - 7), tipo: 'atajo', cargador: 'conectado', fin: true },
        { desde: instante(clave, primero), hasta: instante(clave, primero + 1), tipo: 'atajo', cargador: 'desconectado' },
      );
      const noches = SinReloj.conNochesDeMoss([], propias, ZONA);
      const e = SinReloj.estimarNoche({ clave, zona: ZONA, actividad, habitual: SinReloj.habitualDe(noches, clave), personal: SinReloj.aprenderPersonal(propias, clave) });
      if (!e) continue;
      ESTIMACIONES[clave] = e;
      // Como en la app (src/salud/nocheSinReloj.ts): lo estimado con la ventana tranquila, de donde se aprende lo suyo.
      const estimada = { dormirse: iso(clave, e.dormirse), despertar: iso(clave, e.despertar), quieto: { desde: iso(clave, e.quieto.desde), hasta: iso(clave, e.quieto.hasta) } };
      let hora = { dormirse: iso(clave, e.dormirse), despertar: iso(clave, e.despertar), origen: 'estimada', confianza: e.confianza, estimada };
      // Dos mañanas corrigió la hora (a la de verdad, de a 5 minutos) y varias la confirmó.
      if (i === 20 || i === 9) hora = Object.assign({}, hora, { dormirse: iso(clave, Math.round(dormirse / 5) * 5), despertar: iso(clave, Math.round(despertar / 5) * 5), origen: 'corregida' });
      else if (!anoche && e.confianza !== 'alta' && r() < 0.7) hora = Object.assign({}, hora, { origen: 'confirmada' });
      propias.push({ fecha: clave, hora, actualizado: iso(clave, primero + 32) });
    }
    return propias;
  })();

  // ------------------------------------------------------------ los hábitos y cada día
  // Empezó el lunes 31 de agosto con seis hábitos (la guitarra, solo los viernes) y el lunes 28 de
  // septiembre sumó el agua. Desde ahí cada día de la semana tiene la cantidad de la semana de la
  // galería: el lunes 4, el martes 5, el miércoles 6 (la Lira), el jueves 3, el viernes 7, el sábado
  // 4 y el domingo 6. La constelación de cada día la pone galeria.js. Los nombres van en los dos
  // idiomas porque la galería cambia de idioma; en la app los escribe la persona.
  const TODOS = [0, 1, 2, 3, 4, 5, 6];
  const CON_AGUA = '2026-09-28';
  const HABITOS = [
    { id: 'meditar', nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'loto', dias: TODOS, fuente: { tipo: 'manual' }, orden: 0, desde: INICIO },
    { id: 'dormir', nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'luna', dias: TODOS, fuente: { tipo: 'salud', dato: 'sueno', meta: 420 }, orden: 1, desde: INICIO },
    { id: 'leer', nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'libro', dias: [0, 1, 2, 3, 5], fuente: { tipo: 'manual' }, orden: 2, desde: INICIO },
    { id: 'escribir', nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pluma', dias: [0, 2, 3, 5], fuente: { tipo: 'manual' }, orden: 3, desde: INICIO },
    { id: 'pasos', nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'huellas', dias: TODOS, fuente: { tipo: 'salud', dato: 'pasos', meta: 8000 }, orden: 4, desde: INICIO },
    { id: 'agua', nombre: { es: 'Agua 2 L', en: 'Water 2 L' }, icono: 'gota', dias: [0, 3, 5, 6], fuente: { tipo: 'manual' }, orden: 5, desde: CON_AGUA },
    { id: 'guitarra', nombre: { es: 'Guitarra', en: 'Guitar' }, icono: 'nota', dias: [5], fuente: { tipo: 'manual' }, orden: 6, desde: INICIO },
  ];

  // Lo hecho cada día, hasta ayer: hoy es el cielo de la galería. Cada hábito con su constancia, y
  // el sueño según sus noches de Salud (sin noche, no se enciende). El sábado 12 de septiembre y el
  // sábado 10 de octubre no hizo nada, y eso no le resta nada a lo juntado. El lunes 19 completo y
  // el martes 20 con tres de cinco, como en el universo de la semana.
  const CONSTANCIA = { meditar: 0.86, leer: 0.74, escribir: 0.6, pasos: 0.6, agua: 0.8, guitarra: 0.7, dormir: 0.72 };
  const SIN_HABITOS = new Set(['2026-09-12', SIN_NADA]);
  const FIJOS = { '2026-10-19': ['meditar', 'dormir', 'leer', 'pasos'], '2026-10-20': ['meditar', 'dormir', 'leer'] };
  const DIAS = (() => {
    const r = azar(23);
    const conSalud = NOCHES.length ? NOCHES[0].clave : HOY;
    const lista = [];
    for (let clave = INICIO; clave < HOY; clave = Fechas.sumarDias(clave, 1)) {
      const dia = Fechas.diaDeLaSemana(clave);
      const habitos = HABITOS.filter((h) => h.desde <= clave && h.dias.includes(dia)).sort((a, b) => a.orden - b.orden).map((h) => h.id);
      const noche = NOCHES.find((n) => n.clave === clave);
      let hechos = habitos.filter((id) => {
        const suerte = r();
        if (id === 'dormir' && clave >= conSalud) return !!noche && noche.dormido >= 420;
        return suerte < CONSTANCIA[id];
      });
      if (SIN_HABITOS.has(clave)) hechos = [];
      if (FIJOS[clave]) hechos = FIJOS[clave];
      // La luz como en src/dominio/luz.ts: 3 por el primero y 1 por cada uno más.
      lista.push({ clave, constelacion: null, habitos, hechos, luz: hechos.length ? hechos.length + 2 : 0, completo: habitos.length > 0 && hechos.length === habitos.length });
    }
    return lista;
  })();

  // Lo que Ascent tiene de la persona, para la sección de Ascent con el vínculo. Entrena los lunes
  // (empuje), los miércoles (piernas), los viernes (torso) y los domingos (tirón), salvo algún
  // viernes y algún domingo; hoy hizo piernas a las 18:40, una sesión más grande que las de
  // siempre. El peso movido es como lo cuenta Ascent: la suma del peso de cada serie. El press
  // banca no sube desde hace tres semanas: lo de Moss de las semanas en que subía (septiembre)
  // está acá, y lo de estas tres semanas sale de lo comido y dormido de la galería.
  // Cada sesión tiene sus ejercicios con sus series (peso y repeticiones), para el rendimiento, los
  // músculos y la marca posible (spec/rendimiento.md). La semana pasada fue de descarga en piernas
  // (menos series, la misma carga), y la sentadilla está a un paso de su marca.
  const ASCENT = (() => {
    const r = azar(17);
    const RUTINA = {
      1: { nombre: { es: 'Empuje', en: 'Push' }, series: 18, kilos: 990, minutos: 62, hora: 19 * 60 + 10 },
      3: { nombre: { es: 'Piernas', en: 'Legs' }, series: 15, kilos: 1150, minutos: 56, hora: 18 * 60 + 45 },
      5: { nombre: { es: 'Torso', en: 'Upper body' }, series: 16, kilos: 900, minutos: 54, hora: 19 * 60 },
      0: { nombre: { es: 'Tirón', en: 'Pull' }, series: 13, kilos: 720, minutos: 44, hora: 11 * 60 + 5 },
    };
    const SALTEADOS = new Set(['2026-09-27', '2026-10-09']);
    // Los ejercicios de cada día: nombre, series, peso y repeticiones.
    const s = (n, peso, reps) => Array.from({ length: n }, () => ({ peso, reps }));
    const BLOQUES = {
      1: () => [
        { ejercicio: 'Press banca', series: s(4, 80, 5) }, { ejercicio: 'Press inclinado con mancuernas', series: s(3, 28, 8) },
        { ejercicio: 'Press militar', series: s(3, 45, 8) }, { ejercicio: 'Fondos', series: s(3, 0, null) }, { ejercicio: 'Tríceps en polea', series: s(3, 25, 12) },
      ],
      3: (semana) => [
        { ejercicio: 'Sentadilla', series: s(4, 95 + 2.5 * semana, 5) }, { ejercicio: 'Prensa', series: s(3, 180, 10) },
        { ejercicio: 'Curl femoral', series: s(3, 40, 12) }, { ejercicio: 'Extensión de piernas', series: s(3, 50, 12) }, { ejercicio: 'Pantorrillas', series: s(2, 60, 15) },
      ],
      5: () => [
        { ejercicio: 'Remo con barra', series: s(4, 70, 8) }, { ejercicio: 'Press banca inclinado', series: s(3, 60, 8) },
        { ejercicio: 'Dominadas', series: s(3, 0, null) }, { ejercicio: 'Elevaciones laterales', series: s(3, 10, 12) }, { ejercicio: 'Curl de bíceps', series: s(3, 14, 10) },
      ],
      0: () => [
        { ejercicio: 'Peso muerto', series: s(3, 130, 5) }, { ejercicio: 'Dominadas', series: s(4, 0, null) },
        { ejercicio: 'Remo con mancuerna', series: s(3, 30, 10) }, { ejercicio: 'Face pull', series: s(3, 20, 15) },
      ],
    };
    // La descarga del miércoles 14: la sentadilla con la misma carga y menos series, sin lo demás.
    const DESCARGA = '2026-10-14';
    const inicio = (fecha, hora) => Date.parse(fecha + 'T00:00:00.000Z') - ZONA * 60e3 + hora * 60e3;
    const sesiones = [];
    for (let fecha = '2026-09-14'; fecha < HOY; fecha = Fechas.sumarDias(fecha, 1)) {
      const dia = Fechas.diaDeLaSemana(fecha);
      const d = RUTINA[dia];
      if (!d || SALTEADOS.has(fecha)) continue;
      const k = 0.92 + r() * 0.16;
      const semana = Math.floor(Fechas.diasEntre('2026-09-14', fecha) / 7);
      const bloques = fecha === DESCARGA ? [{ ejercicio: 'Sentadilla', series: s(2, 105, 5) }, { ejercicio: 'Prensa', series: s(2, 180, 10) }] : BLOQUES[dia](semana);
      const series = bloques.reduce((t, b) => t + b.series.length, 0);
      sesiones.push({ fecha, nombre: d.nombre, series, kilos: Math.round(d.kilos * k / 5) * 5, minutos: Math.round(d.minutos * (0.95 + r() * 0.1)), hora: d.hora, inicio: inicio(fecha, d.hora), bloques });
    }
    sesiones.push({
      fecha: HOY, nombre: RUTINA[3].nombre, series: 17, kilos: 1290, minutos: 58, hora: 18 * 60 + 40, inicio: inicio(HOY, 18 * 60 + 40),
      bloques: [{ ejercicio: 'Sentadilla', series: s(5, 105, 5) }, ...BLOQUES[3](5).slice(1)],
    });
    // Las marcas de Ascent (la tabla prs): la de la sentadilla es de agosto, y las veces que Moss avisó
    // «buen día» y si hubo marca, para el historial de aciertos. Las de la prensa, el femoral, la
    // extensión y las pantorrillas, para «Marcas» con todos los ejercicios de hoy.
    const marcas = [
      { ejercicio: 'Sentadilla', peso: 107.5, reps: 5, fecha: '2026-08-26' },
      { ejercicio: 'Peso muerto', peso: 135, reps: 5, fecha: '2026-09-20' },
      { ejercicio: 'Press banca', peso: 80, reps: 5, fecha: '2026-09-28' },
      { ejercicio: 'Prensa', peso: 200, reps: 8, fecha: '2026-07-22' },
      { ejercicio: 'Curl femoral', peso: 45, reps: 10, fecha: '2026-09-02' },
      { ejercicio: 'Extensión de piernas', peso: 55, reps: 10, fecha: '2026-06-10' },
      { ejercicio: 'Pantorrillas', peso: 70, reps: 10, fecha: '2026-05-13' },
    ];
    const avisos = {
      Sentadilla: { veces: 4, marcas: 2, marcasEnTotal: 4, semanas: 7 },
      Prensa: { veces: 1, marcas: 0, marcasEnTotal: 3, semanas: 7 },
    };
    // La rutina de Ascent (nucleo/rutinas.ts): qué se hace cada día de la semana, para la fatiga por día.
    const rutina = Object.keys(RUTINA).map(Number).map((dia) => ({ dia, nombre: RUTINA[dia].nombre, hora: RUTINA[dia].hora, ejercicios: BLOQUES[dia](0).map((b) => b.ejercicio) }));
    // Los ejercicios que Ascent ve estancados con el umbral que se eligió en sus Ajustes (3 semanas; de fábrica,
    // 6), y lo que Ascent sabe de cada uno: cómo llegó el músculo principal a cada sesión (lo que le faltaba
    // recuperar, en %), cada cuánto lo entrena (veces por semana) y cuánto duran las sesiones. Lo de Moss (el
    // sueño, la proteína y el balance de cada semana) sale de lo comido y dormido de la galería.
    const estancados = {
      umbral: 3,
      ejercicios: [
        { ejercicio: 'Press banca', semanas: 3, desde: '2026-09-28', peso: 80, reps: 5, llegadas: [2.1, 1.4, 2.6], vecesPorSemana: { antes: 1, ahora: 1 }, minutos: { antes: 62, ahora: 61 } },
        { ejercicio: 'Peso muerto', semanas: 4, desde: '2026-09-20', peso: 135, reps: 5, llegadas: [1.2, 0.8, 1.5], vecesPorSemana: { antes: 1.5, ahora: 0.75 }, minutos: { antes: 46, ahora: 44 } },
        { ejercicio: 'Press militar', semanas: 5, desde: '2026-09-14', peso: 47.5, reps: 6, llegadas: [12.4, 11.2, 4.1, 13], vecesPorSemana: { antes: 1, ahora: 1 }, minutos: { antes: 62, ahora: 61 } },
      ],
    };
    // Tu año: cada día del año hasta ayer, con el grupo principal de lo que entrenó (null, descanso), y las
    // 21 marcas. El grupo de cada día es el de su rutina: pecho el lunes, piernas el miércoles y espalda el
    // viernes y el domingo. Desde el 14 de septiembre son las sesiones de arriba; antes, la misma semana con
    // días salteados, una semana enferma en marzo y dos de vacaciones en julio.
    const GRUPO_DEL_DIA = { 1: 'pecho', 3: 'piernas', 5: 'espalda', 0: 'espalda' };
    const MARCAS_DEL_ANIO = {
      piernas: ['2026-01-14', '2026-02-04', '2026-03-04', '2026-04-15', '2026-05-13', '2026-06-10', '2026-08-26'],
      pecho: ['2026-01-19', '2026-02-16', '2026-03-23', '2026-04-27', '2026-06-01', '2026-07-06', '2026-09-28'],
      espalda: ['2026-01-25', '2026-02-27', '2026-03-29', '2026-05-03', '2026-06-19', '2026-07-26', '2026-09-20'],
    };
    const anioDias = (() => {
      const ra = azar(29);
      const conMarca = new Set(Object.values(MARCAS_DEL_ANIO).flat());
      const lista = [];
      for (let fecha = '2026-01-01'; fecha < HOY; fecha = Fechas.sumarDias(fecha, 1)) {
        const dia = Fechas.diaDeLaSemana(fecha);
        const salteado = ra() < 0.12 && !conMarca.has(fecha);
        const ausente = (fecha >= '2026-03-10' && fecha <= '2026-03-16') || (fecha >= '2026-07-27' && fecha <= '2026-08-09');
        const entreno = fecha >= '2026-09-14' ? sesiones.some((x) => x.fecha === fecha) : !!GRUPO_DEL_DIA[dia] && !salteado && !ausente;
        lista.push({ fecha, grupo: entreno ? GRUPO_DEL_DIA[dia] : null, marca: entreno && conMarca.has(fecha) });
      }
      return lista;
    })();
    // La última marca de cada grupo, con el ejercicio.
    const ultimasMarcas = [
      { grupo: 'piernas', ejercicio: 'Sentadilla', peso: 107.5, reps: 5, fecha: '2026-08-26' },
      { grupo: 'pecho', ejercicio: 'Press banca', peso: 80, reps: 5, fecha: '2026-09-28' },
      { grupo: 'espalda', ejercicio: 'Peso muerto', peso: 135, reps: 5, fecha: '2026-09-20' },
    ];
    // Las semanas en que el press banca subía, con lo que Moss guardó de cada una.
    const semanasConMarcas = [
      { sueno: 7 * 60 + 42, proteina: 151, balance: -280, diasConComida: 7, nochesConSueno: 7 },
      { sueno: 7 * 60 + 35, proteina: 154, balance: -300, diasConComida: 6, nochesConSueno: 7 },
      { sueno: 7 * 60 + 48, proteina: 149, balance: -270, diasConComida: 7, nochesConSueno: 6 },
      { sueno: 7 * 60 + 38, proteina: 152, balance: -310, diasConComida: 5, nochesConSueno: 7 },
    ];
    // Los días de ejemplo del diagnóstico (spec/ascent.md, «El diagnóstico»), para elegir en la galería:
    // a qué hora se mira, la noche, si hoy se entrena (la de piernas de las 18:40) y lo anotado.
    const noche = (dormido, calidad, otras = {}) => ({ dormido, calidad, despertoAntes: false, seAcostoTarde: false, siesta: false, ...otras });
    const MANANA = { desayuno: { hora: 8 * 60 + 5, p: 18, c: 60, g: 14, kcal: 430 }, almuerzo: { hora: 13 * 60, p: 28, c: 95, g: 28, kcal: 750 } };
    const dias = {
      corta: { ahora: 14 * 60 + 30, sesion: 'prevista', cafe: 95, noche: noche(350, 46, { despertoAntes: true }), ultimas3: [350, 455, 470], deuda: 180, anotado: MANANA },
      bien: { ahora: 15 * 60 + 30, sesion: 'prevista', noche: noche(472, 84), ultimas3: [472, 455, 470], deuda: 40, anotado: MANANA },
      entreno: { ahora: 20 * 60 + 10, sesion: 'hecha', noche: noche(452, 78), ultimas3: [452, 455, 470], deuda: 40, anotado: { ...MANANA, merienda: { hora: 17 * 60 + 30, p: 15, c: 55, g: 15, kcal: 395 } } },
      descanso: { ahora: 15 * 60, sesion: null, noche: noche(445, 76), ultimas3: [445, 455, 470], deuda: 40, anotado: MANANA },
      sinSueno: { ahora: 15 * 60 + 30, sesion: 'prevista', noche: null, ultimas3: [], deuda: null, anotado: MANANA },
      // Sin reloj y sin contestar a la mañana: la noche sin calidad, que cuenta como regular.
      sinCalidad: { ahora: 9 * 60 + 10, sesion: 'prevista', noche: noche(470, null), ultimas3: [470, 455, 470], deuda: 40, anotado: { desayuno: MANANA.desayuno } },
    };
    return {
      vinculadaDesde: '2026-10-03',
      dias,
      // Los ejercicios son las claves de Musculos, en español; lo que se lee de ellos, en cada idioma.
      nombresDeEjercicios: {
        Sentadilla: { es: 'Sentadilla', en: 'Squat' }, Prensa: { es: 'Prensa', en: 'Leg press' }, 'Curl femoral': { es: 'Curl femoral', en: 'Leg curl' },
        'Extensión de piernas': { es: 'Extensión de piernas', en: 'Leg extension' }, Pantorrillas: { es: 'Pantorrillas', en: 'Calf raise' },
        'Press banca': { es: 'Press banca', en: 'Bench press' }, 'Peso muerto': { es: 'Peso muerto', en: 'Deadlift' }, 'Press militar': { es: 'Press militar', en: 'Overhead press' },
      },
      sesiones,
      rutina,
      estancados,
      anioDias,
      ultimasMarcas,
      marcas,
      avisos,
      estancado: { ejercicio: { es: 'Press banca', en: 'Bench press' }, marca: '80 kg × 5', semanas: 3, desde: '2026-09-28' },
      semanasConMarcas,
      // Lo de Moss del año también: la galería tiene la comida desde el 28 de septiembre, y antes
      // también registraba casi todos los días.
      anio: { entrenamientos: 148, marcas: 21, diasConHabitos: 47, diasConComida: 49 },
    };
  })();

  return {
    HOY, AHORA_MIN, INICIO, PERFIL, GASTO_ANTERIOR, PESADAS, MEDIDAS, azar,
    ZONA, FUENTES, MUESTRAS, LECTURAS, NOCHES, SOLO_EN_CAMA, NOCHE_SIN_RELOJ: SIN_RELOJ, NOCHE_SIN_NADA: SIN_NADA, NOCHE_CORTADA: CORTADA,
    PROPIAS_SIN_RELOJ, ESTIMACIONES,
    HABITOS, DIAS,
    ASCENT,
  };
})();
