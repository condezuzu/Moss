// La persona de mentira de la galería: quiere bajar a 71 kg y empezó el lunes 31 de agosto. Acá
// están lo que la app guardaría (su perfil, sus pesadas, sus medidas, lo que Salud trae de sus
// noches, sus hábitos y lo que hizo cada día); lo que se calcula con eso (la tendencia, el
// control, el progreso, la grasa, el sueño y las estadísticas de Hábitos) lo calculan los módulos
// de la app (Control, Progreso, Cuerpo, Sueno y Estadisticas) en cada sección.

const Datos = (() => {
  const HOY = '2026-10-21';
  // Las 21:47 del miércoles, como el resto de la galería.
  const AHORA_MIN = 21 * 60 + 47;
  const INICIO = '2026-08-31';
  const PERFIL = {
    sexo: 'm', nacimiento: 1995, alturaCm: 178, actividad: 'activo', objetivo: 'bajar', ritmo: 'recomendado',
    estilo: 'equilibrada', pesoMeta: 71, nombre: 'Agustín',
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
  const ASCENT = (() => {
    const r = azar(17);
    const RUTINA = {
      1: { nombre: { es: 'Empuje', en: 'Push' }, series: 18, kilos: 990, minutos: 62, hora: 19 * 60 + 10 },
      3: { nombre: { es: 'Piernas', en: 'Legs' }, series: 15, kilos: 1150, minutos: 56, hora: 18 * 60 + 45 },
      5: { nombre: { es: 'Torso', en: 'Upper body' }, series: 16, kilos: 900, minutos: 54, hora: 19 * 60 },
      0: { nombre: { es: 'Tirón', en: 'Pull' }, series: 13, kilos: 720, minutos: 44, hora: 11 * 60 + 5 },
    };
    const SALTEADOS = new Set(['2026-09-27', '2026-10-09']);
    const sesiones = [];
    for (let fecha = '2026-09-14'; fecha < HOY; fecha = Fechas.sumarDias(fecha, 1)) {
      const d = RUTINA[Fechas.diaDeLaSemana(fecha)];
      if (!d || SALTEADOS.has(fecha)) continue;
      const k = 0.92 + r() * 0.16;
      sesiones.push({ fecha, nombre: d.nombre, series: d.series + Math.round((r() - 0.5) * 2), kilos: Math.round(d.kilos * k / 5) * 5, minutos: Math.round(d.minutos * (0.95 + r() * 0.1)), hora: d.hora });
    }
    sesiones.push({ fecha: HOY, nombre: RUTINA[3].nombre, series: 17, kilos: 1290, minutos: 58, hora: 18 * 60 + 40 });
    // Las semanas en que el press banca subía, con lo que Moss guardó de cada una.
    const semanasConMarcas = [
      { sueno: 7 * 60 + 42, proteina: 151, balance: -280, diasConComida: 7, nochesConSueno: 7 },
      { sueno: 7 * 60 + 35, proteina: 154, balance: -300, diasConComida: 6, nochesConSueno: 7 },
      { sueno: 7 * 60 + 48, proteina: 149, balance: -270, diasConComida: 7, nochesConSueno: 6 },
      { sueno: 7 * 60 + 38, proteina: 152, balance: -310, diasConComida: 5, nochesConSueno: 7 },
    ];
    return {
      vinculadaDesde: '2026-10-03',
      amigos: 4,
      sesiones,
      estancado: { ejercicio: { es: 'Press banca', en: 'Bench press' }, marca: '80 kg × 5', semanas: 3, desde: '2026-09-28' },
      semanasConMarcas,
      // Lo de Moss del año también: la galería tiene la comida desde el 28 de septiembre, y antes
      // también registraba casi todos los días.
      anio: { entrenamientos: 148, marcas: 21, diasConHabitos: 47, diasConComida: 49 },
    };
  })();

  return {
    HOY, AHORA_MIN, INICIO, PERFIL, GASTO_ANTERIOR, PESADAS, MEDIDAS, azar,
    FUENTES, MUESTRAS, LECTURAS, NOCHES, SOLO_EN_CAMA, NOCHE_SIN_RELOJ: SIN_RELOJ, NOCHE_SIN_NADA: SIN_NADA, NOCHE_CORTADA: CORTADA,
    HABITOS, DIAS,
    ASCENT,
  };
})();
