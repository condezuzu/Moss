// Los datos de la sección de Ascent para las propuestas que la rehacen (spec/seccion-ascent.md, 27/11/2026). No anota
// ninguna propuesta: deja `window.AscentDeMentira`, con la persona de la galería ya en palabras y los dibujos sueltos,
// así las tres muestran lo mismo. Las cuentas son las de la app (src/secciones/ascent/vista.ts, con PuntajeMuscular,
// ProgresoCompartido, Estancados, TuSesion, Fatiga y Recuperado) sobre Datos.ASCENT; los textos, los de src/textos
// cuando existen (ascent.*) y, si no, los de MIOS, acá abajo.
//
// ─── Cómo se usa
//   const M = window.AscentDeMentira;
//   const d = M.dia('cargado');   // en el idioma de ahora (Galeria.idioma): se pide de nuevo cada vez que se pinta
//   titulo.textContent = d.hoy.corto;                                    // «Más ligero hoy»
//   caja.innerHTML = M.figura('frente', M.estadosDe(d, 'semana'));       // el cuerpo, con una clase por estado
// Las frases vienen listas para mostrar; los números sueltos (series, días, enLaEscala, avance, trazo) son para dibujar.
// null es «no hay» o «no corresponde». Los músculos van por su id de la app: pecho, hombros, biceps, antebrazos,
// abdomen, cuadriceps, aductores, trapecio, dorsales, triceps, espaldaBaja, gluteos, isquios, pantorrillas.
//
// ─── Los días (M.DIAS): todos son el miércoles 21/10 de la galería, y toca piernas a las 18:40
//   cargado     ayer entrenó piernas fuera de la rutina (12 series, 4 al fallo): cuádriceps y glúteos siguen cargados.
//               Es el aviso que pide algo. Sesión: = = ↑ = ↑.
//   normal      nada limita («Todo listo para entrenar»). Sesión: ↑ = ↑ = ↑.
//   casi        el tirón del domingo lo hizo ayer: a glúteos e isquios les falta 1 día. El aviso chico, que no pide nada.
//   nocheCorta  durmió 5 h 40 min: hoy no sube nada.
//   descanso    hoy no entrena (pasó piernas al jueves): `sesion` es null y `siguiente` es mañana.
//   hecha       son las 20:10 y ya entrenó: `sesion.estado` es 'hecha' y trae `comoFue` («Dura»).
//   nueva       empezó con Ascent el domingo (2 entrenamientos): `nueva` no es null y casi todo dice lo que falta.
//
// ─── Lo que devuelve M.dia(clave) (los ejemplos son de 'cargado')
// {
//   clave, idioma, fecha: '2026-10-21', fechaTexto: 'miércoles 21 de octubre', hora: '15:00',
//   hoy: {
//     que,                    // el titular de la app: 'listo' | 'casi' | 'cargado' | 'suenoCorto' | 'descanso' | 'hecha'
//     limita,                 // lo que pone el límite hoy (lo único con color): null | 'musculos' | 'sueno'
//     corto: 'Más ligero hoy', linea: 'Piernas · 18:40',        // la entrada de Progreso: dos palabras y su segunda línea
//     titulo: 'Lo que entrenas hoy sigue cansado', texto: 'Mejor más ligero, u otra cosa: lo de hoy (…) probablemente esté listo pasado mañana.',
//     noche: { minutos: 443, texto: '7 h 23 min', estado: 'normal' | 'algoCorta' | 'corta' | 'muyCorta', palabra: 'Bien', corta: false, frase: '7 h 23 min de las ~8 h que necesitas.' },
//   },
//   sesion: null | {
//     estado: 'prevista' | 'hecha', nombre: 'Piernas', hora: '18:40', minutos: 58, duracion: '58 min',
//     musculos: ['cuadriceps', 'gluteos', 'isquios', 'pantorrillas'], musculosTexto: 'cuádriceps, glúteos, isquios y pantorrillas',
//     ejercicios: [Ejercicio + { series: 4, plan: '4 × 5', hecho: null | '5 × 105 kg × 5' (solo ya hecha) }],   // en orden
//     suben: 2, igual: 3, sinSaber: 0, resumen: '2 suben, 3 igual', flechas: '= = ↑ = ↑',
//     comoFue: null | { titulo: 'Cómo fue', nota: 'buena' | 'comoSiempre' | 'dura' | 'floja', palabra: 'Dura', porque, implica,
//       rendimiento: [{ nombre, diferencia: 1.2, texto: '+1 %', como: 'arriba' | 'igual' | 'abajo' }], contraLoTuyo, franja,
//       caidas: [{ nombre: 'Prensa', etiqueta: 'repeticiones con 180 kg', reps: [10, 8, 5] }],
//       volumen: [{ musculo, nombre, series, texto }], comoSeCalcula: { titulo, parrafos: [] } },
//   },
//   siguiente: null | { fecha, dias: 2, nombre: 'Espalda y hombros', hora: '19:00', cuando: 'el viernes', linea: 'El viernes: Espalda y hombros', musculos, musculosTexto },
//   aviso: null | {            // solo si hoy hay sesión prevista y algún músculo suyo no está listo
//     nivel: 'cargado' | 'seRecupera', pide: true,            // cargado (2 días o más) pide algo; seRecupera (1 día) no
//     musculos: ['cuadriceps', 'gluteos'], musculosTexto: 'Cuádriceps y glúteos', tambien: [],
//     titulo: 'Hoy, piernas más ligero', etiqueta: 'Hoy tocan y siguen cargados', corto: 'Cuádriceps y glúteos, de ayer',
//     hecho: 'Los entrenaste ayer: 12 series, 4 al fallo.', cuando: 'ayer', series: 12, alFallo: 4,          // primero el hecho
//     estimacion: 'Faltan unos 2 días (estimado, puede variar un día).', dias: 2, total: 3, fase: 'cargado', paso: 3, listo: 'listo el viernes',
//     queHacer: 'Hoy, una serie menos y sin llegar al fallo, o entrena otra cosa.', queHacerCorto: 'Más ligero, u otra cosa.',
//     linea: 'Cuádriceps y glúteos: los entrenaste ayer, 12 series, 4 al fallo. Faltan unos 2 días (…). Más ligero, u otra cosa.',
//     sinRir: null | 'No anotaste cuántas repeticiones te quedaban: …',
//     notificacion: { titulo: 'Hoy, piernas más ligero', texto: 'Cuádriceps y glúteos probablemente sigan cargados. …' },
//     respuestas: ['Entendido', 'Me siento bien'],
//   },
//   sugerencias: [{ tipo: 'entreno' | 'comida' | 'sueno', titulo: 'Entrenamiento', texto, clave,          // tres; ya entrenado, dos
//     macros: 'proteína' (comida), hora: '22:35' y horas: '8 h' (sueno), enlace: 'Más en Sueño' (sueno) }],
//   semana: {
//     titulo: 'Esta semana', texto, paraQue, anotas, escala: { desde: 10, hasta: 20, tope: 30 },
//     primera: false,          // true en 'nueva': no se compara con lo ideal (estado es 'entrenado' o 'sinEntrenar')
//     cuentas: { poco: 5, enSuPunto: 7, sinEntrenar: 2 }, partes: [{ estado, n, texto: 'A 5 les faltan series' }], resumen: 'A 5 les faltan series · 2 sin entrenar',
//     destacados: ['cuadriceps', 'gluteos', …],          // los que se salen, de lo que más importa hoy a lo que menos
//     leyenda: [{ estado, nombre: 'Le faltan', texto: 'súmale series esta semana.' }],
//     dias: [{ fecha, letra: 'L', dia: 'lunes', hoy, toca, hecho, fuera, nombre: 'Pecho y hombros' | null }],          // 7, de lunes a domingo
//     hechas: 2, previstas: 5, fuera: 'fuera de tu rutina',
//     rutina: { titulo: 'Tu rutina', nota: 'muyBuena' | 'buena' | 'mejorable', palabra: 'Buena', mejoras: ['Entrena pecho dos veces por semana o más.'] },
//   },
//   musculos: [{              // los 14: primero los 7 que se ven de frente y después los 7 de espalda
//     id: 'cuadriceps', nombre: 'Cuádriceps', lado: 'frente' | 'espalda',
//     series: 14, seriesExactas: 13.5, enLaEscala: 0.45 (de 0 a 30 series), seriesTexto: '14 series duras en los últimos 7 días',
//     estado: 'sinEntrenar' | 'poco' | 'enSuPunto' | 'mucho' (en 'nueva': 'entrenado' | 'sinEntrenar'), estadoTexto: 'Al día',
//     accion: 'Al día: sigue con tu rutina, no hace falta agregar más.', sugerencia: 'Súmale 4 series: con 10 llega a lo recomendado.',
//     hoyToca: true,          // es principal en la sesión prevista de hoy
//     fatiga: { dias: 2, total: 3, hecho: 0.33 (lo ya recuperado, de 0 a 1), fase, paso: 0..3, nombre: 'Cargado', texto: 'faltan 2 días', estimado: 'estimado',
//       listo: 'listo el viernes', listoEl: '2026-10-23', desde: 'ayer' (su última vez), sinRir: false },
//     partes: null | { titulo, nota, filas: [{ clave, nombre: 'Pecho alto', series: 3, texto: 'Pecho alto: 3 series' }] },          // pecho y tríceps
//     ejercicios: [Ejercicio + { series: 4, seriesTexto: '4 series', ayuda: false, ayudaTexto: null | 'También trabaja …' }],          // los de la semana
//     sinEjercicios: null | 'No lo entrenaste en los últimos 7 días.',
//     deHoy: ['sentadilla', 'prensa', 'extension_cuadriceps'],          // de sesion.ejercicios, los que lo trabajan como principal
//   }],
//   fatiga: { titulo: 'Músculos fatigados', texto, comoSeCalcula, lista: ['cuadriceps', 'gluteos', 'hombros'], ninguno: null | 'Todo recuperado: …', sinRir: null | '…',
//     fases: [{ fase, paso, nombre: 'Falta poco', texto: 'Falta 1 día y ya pasó la mayor parte. No cambia la sesión.' }] },          // las 4
//   fuerza: {
//     titulo: 'Tu fuerza', semanas: '12 semanas', texto, ruido,
//     resumen: '3 suben, 1 sin subida clara, 1 bajó y 1 todavía no se sabe', respuesta: 'En 3 de 6 ejercicios, sí', cuentas: { sube: 3, sinSubidaClara: 1, bajo: 1, noSeSabe: 1 },
//     vacio: null | 'Con 6 sesiones de un ejercicio en 6 semanas, aquí verás si sube.',
//     ejercicios: [{           // sentadilla, prensa, remo_barra, peso_muerto, press_banca y press_militar
//       id, nombre, musculo, hoyToca, estado: 'sube' | 'sinSubidaClara' | 'bajo' | 'noSeSabe', corto: 'sube',
//       veredicto: 'Sube, ~2,7 % por mes', dato: 'entre +2,3 y +3,2 · 10 sesiones', sesiones, semanas, porMes, rango, nivelKg,
//       marca: '105 kg × 5', sinMarca: 3, sinMarcaTexto: null | '10 semanas sin marca' (solo si no sube),
//       trazo: { desde: -12, hasta: 0, puntos: [{ t, kg, fecha }], recta: [{ t, nivel, abajo, arriba }] },          // t en semanas (0 es hoy), kg de 1RM estimado
//       estancado: null | { dato: '10 semanas sin marca · 80 kg × 5', razones: [Razon], sinCausa, faltan, contexto, compara: Compara, queCambiar: ['Vuelve a unas 13 series …'] },
//       bajo: null | { dato: '−6 % · desde el 28 sep', caida: 6.1, antes: 'Las 8 de antes · 53,2 kg', ahora: 'Las 4 de ahora · 50,0 kg', grafico, promedios: { antes, ahora },
//         puntos: [{ fecha, kg, reps, ahora }] (las 12 sesiones), contexto: [], razones: [Razon], sinCausa, faltan, compara: Compara, queCambiar: [] },
//     }],
//     estancados: { titulo: 'Estancados', texto, lista: ['press_banca'], ninguno: null | '…', porQue: 'Por qué puedes estar estancado', queCambiar: 'Qué cambiar', nota },
//     bajaron: { titulo: 'Por qué bajaste', texto, lista: ['press_militar'], porQue: 'Por qué puede ser', queCambiar: 'Qué cambiar' },
//   },
//   metas: {
//     titulo: 'Metas', nueva: 'Nueva meta', editar: 'Editar meta', ninguna, comer: 'Para llegar: come unos 119 g de proteína por día.',
//     lista: [{                // sentadilla (en camino), press_banca (así no llega) y peso_muerto (todavía no se sabe)
//       id, nombre, kilos: 140, reps: 1, objetivo: 'Levantar 140 kg una vez', estado: 'enCamino' | 'noSube' | 'noSeSabe' | 'lograda', realista,
//       avance: 0.88 (lo de hoy sobre la meta, o null), nivelKg: 122.5, hoy: 'Hoy levantarías 122,5 kg',
//       llegas: 'Llegas entre febrero y abril de 2027', ventana: 'febrero a abril de 2027', ventanaCorta: 'febrero a abril', semanas: [18, 24],
//       linea: 'Hoy levantarías 122,5 kg · Llegas entre febrero y abril de 2027',
//       estadoTexto: null | 'Así no llega: …', falta: null | 'Te faltan 2 sesiones de este ejercicio para estimar cuándo llegas.', llevas: null | 'Llevas 4 de 6 sesiones (…).',
//       antes: null | 'febrero a abril de 2027',          // en 'hecha': cuándo llegabas esta mañana, si la sesión de hoy lo movió
//       comoLlegar: 'Cómo llegar', pasos: [{ que: 'ritmo' | 'series' | 'veces' | 'sueno' | 'proteina', estado: 'bien' | 'mejorar' | 'noSeSabe', marca: '✓' | '↑' | '', etiqueta: 'Bien', texto: 'Subes 0,7 kg por semana: vas bien.' }],
//       proxima: null | 'Próxima vez: sube a 107,5 kg.',
//     }],
//   },
//   anio: { anio: 2026, hoy: '2026-10-21', titulo: 'Tu año', derecha: '2026, hasta hoy', texto, mapa: '142 días entrenados y 26 marcas este año.',
//     dias: [{ fecha, grupo: 'pecho' | 'piernas' | 'espalda' | 'brazos', marca }] (solo los entrenados), colores: { pecho: '#419ec6', … }, entrenamientos: 142, marcas: 26,
//     leyenda: [{ clave, nombre, color }], datos: [{ clave, valor: '142', nombre: 'entrenamientos' }] (5), ultimasTitulo,
//     ultimas: [{ id, grupo, color, destacada, texto: 'Piernas: sentadilla 105 kg × 5', cuando: 'hace 3 semanas' }],
//     recientes: [{ fecha, grupo, marca, hoy }] (los últimos 28 días), detalle(fecha) → '30 sep: piernas, con marca.' },
//   nueva: null | { entrenamientos: 2, texto: 'Llevas 2 entrenamientos en Ascent. Con cada uno, esto se llena.', aqui: 'Estás aquí', alcanzados: 1,
//     hitos: [{ cuando: '1 sesión', que: 'el cuerpo', alcanzado: true }, …] },          // los 4; «estás aquí» va después del último alcanzado
//   base: { titulo: 'En qué se basa', musculos: [], fatigados: [], estancados: [], porQue: [], metas: [] },          // los párrafos de la app
// }
// Ejercicio: { id, nombre, principal: [], ayudan: [], decision: 'sube' | 'igual' | 'noSeSabe' | 'primera', flecha: '↑' | '=' | '',
//   razon: 'subir' | 'faltaElTope' | 'sueno' | 'fatiga' | 'sinObjetivo' | 'pocasSesiones' | 'primera', motivo: 'todavía se recupera',
//   proxima: 'Hoy: 105 kg, sin subir: todavía se recupera.' (la frase de la app), corto: '105 kg' | 'sube a 42,5 kg',
//   peso: 105, pesoTexto: '105 kg', sube: null | 42.5, subeTexto, tope: 5, ultima: null | { fecha, cuando: 'el 14 oct', series: '2 × 105 kg × 5', texto } }
// Razon: { que: 'series' | 'frecuencia' | 'pesadas' | 'bajando' | 'definicion' | 'proteina' | 'sueno', titulo, valor: '13,3 → 10', texto,
//   semanas: { antes: [], ahora: [] } (series), parte y raya: { en, texto } (pesadas y proteina, de 0 a 1) }
// Compara: { antes: 'Cuando subía', ahora: 'Ahora', sinDatos: 'sin datos', filas: [{ que: 'series' | 'veces' | 'comida' | 'proteina' | 'sueno', nombre,
//   antes: '13,3' | null, ahora: '10' | null, cambio: 'baja' | 'sube' | 'igual' | null, marcada (la cuenta lo da como razón) }] }
//
// ─── La fatiga en cuatro fases (M.FASES, `fatiga.fase` y `fatiga.paso`)
//   0 recuperado (○) listo · 1 faltaPoco (◔) falta 1 día de una recuperación de 3 o más · 2 seRecupera (◑) falta 1 día
//   · 3 cargado (●) faltan 2 días o más. La app tiene tres estados; «falta poco» parte el día que falta (ver faseDe).
//   M.MUSCULOS es { frente: [7 id], espalda: [7 id] }: en qué lista va cada músculo (su `lado`), como en la app.
//
// ─── Los dibujos: devuelven SVG en texto. Traen un pintado de fábrica como el de la app, con :where() (no pesa nada: cualquier
// regla de tu CSS lo pisa). Los colores salen de --as-claro, --as-lejos y --as-tinta (clase as-vars); con el rango 1,
// --as-claro es gris: la semana necesita un color que no dependa del rango.
//   M.figura(lado, estados, { etiqueta })   lado: 'frente' | 'espalda'; estados: { [idDelMusculo]: 'clase otra' | ['clase'] }.
//       → <svg class="am-figura frente" viewBox="0 0 100 188"> con <g class="am-base"> (la silueta), un
//         <g class="am-m {clases}" data-musculo="{id}"> por músculo (el relleno y el trazo se ponen en el <g>) y <path class="am-linea">.
//         De frente: trapecio, hombros, pecho, biceps, antebrazos, abdomen, aductores, cuadriceps y pantorrillas; de espalda:
//         trapecio, dorsales, hombros, triceps, antebrazos, espaldaBaja, gluteos, isquios y pantorrillas. Tocar: ev.target.closest('[data-musculo]').
//   M.estadosDe(d, lente)                   las clases para figura: 'semana' → el estado y, si le faltan días, 'fatigado'; 'fatiga' → la fase;
//       'hoy' → 'hoy {fase}' en los de la sesión prevista ('hecho {fase}' si ya entrenó) y 'manana' en los de mañana si hoy descansa.
//       De fábrica: poco, enSuPunto, entrenado, hoy, hecho, manana, mucho, fatigado, faltaPoco, seRecupera, cargado y elegido.
//   M.fase(paso) / M.fases(paso)            un disco (<svg class="am-fase paso-2">, con currentColor) / los cuatro, con <i class="actual"> en el de ahora.
//   M.chispa(ejercicio, { ancho, alto })    de fuerza.ejercicios: <svg class="am-chispa {estado}" viewBox="0 0 128 48"> con .am-chispa-banda, -recta y -punto.
//   M.mapaDelAnio(d.anio)                   <svg class="am-anio" viewBox="0 0 350 130">: <rect class="am-anio-dia {grupo | descanso | futuro} [hoy]" data-fecha>,
//       <circle class="am-anio-marca"> y <text class="am-anio-mes">; d.anio.detalle(fecha) da la frase del día tocado.
//   M.cuerpoDelRango() y M.rango()          el cuerpo del rango de ahora, como lo pone la sección en `.as-cielo i` (galeria/src/ascent.js): un
//       <svg viewBox="0 0 1180 1180"> de una esfera con la luz en el borde de arriba (allá va girada 225° dentro de un círculo con
//       overflow: hidden); con el rango 1 no es una esfera: son <div> con una nube de 560 × 380 que piden `.as-cielo.polvo`.
//       rango() → { rango: 1..7, cuerpo: 'polvo' | 'asteroide' | 'luna' | 'planeta' | 'sol' | 'galaxia' | 'agujeroNegro', planeta, paleta: { apagado, principal, claro } }.
//       El rango se cambia con Galeria.secciones.ascent.ponerRango(n, planeta).
//   M.marca / M.marcaChica                  el ícono de Ascent (svg.as-marca y svg.as-marca-chica; con la clase `unida`, encendido).
//   M.frases()                              { queEsAscent, ejemplo, conecta, sinRutina }: lo que se dice sin vincular o sin rutina.

// ------------------------------------------------------------ los textos que todavía no están en src/textos
// Lo que ya existe en la app se toma de ahí (tx). Esto es lo nuevo de las propuestas: el aviso de fatiga, las cuatro
// fases, los resúmenes de una línea y lo que ve quien recién vincula (spec/seccion-ascent.md).
const MIOS = {
  es: {
    letras: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    cuando: { dia: 'el {dia}' },
    desde: { hoy: 'de hoy', ayer: 'de ayer', dia: 'del {dia}' },
    siguiente: { manana: 'Mañana: {sesion}', dia: 'El {dia}: {sesion}' },
    fases: {
      recuperado: { nombre: 'Recuperado', texto: 'Listo para entrenarlo.' },
      faltaPoco: { nombre: 'Falta poco', texto: 'Falta 1 día y ya pasó la mayor parte. No cambia la sesión.' },
      seRecupera: { nombre: 'Se recupera', texto: 'Falta 1 día. No cambia la sesión.' },
      cargado: { nombre: 'Cargado', texto: 'Faltan 2 días o más. Hoy, mejor más ligero u otra cosa.' },
    },
    fatiga: {
      listo: 'listo {cuando}',
      yaListo: 'listo',
      ninguno: 'Todo recuperado: hoy puedes entrenar lo que toque.',
      sinRir: 'No anotaste cuántas repeticiones te quedaban: Moss supone que fueron duras. Anótalo en Ascent y acierta más.',
    },
    aviso: {
      titulo: { cargado: 'Hoy, {sesion} más ligero', seRecupera: 'Hoy, {sesion} como siempre' },
      etiqueta: {
        cargado: { uno: 'Hoy toca y sigue cargado', otros: 'Hoy tocan y siguen cargados' },
        seRecupera: { uno: 'Hoy toca y todavía se recupera', otros: 'Hoy tocan y todavía se recuperan' },
      },
      hecho: { uno: 'Lo entrenaste {cuando}: {series}.', otros: 'Los entrenaste {cuando}: {series}.' },
      hechoCorto: { uno: 'lo entrenaste {cuando}, {series}', otros: 'los entrenaste {cuando}, {series}' },
      series: { uno: '1 serie', otros: '{n} series' },
      estimacion: { uno: 'Falta cerca de 1 día (estimado, puede variar un día).', otros: 'Faltan unos {n} días (estimado, puede variar un día).' },
      queHacer: { cargado: 'Hoy, una serie menos y sin llegar al fallo, o entrena otra cosa.', seRecupera: 'No cambia la sesión: entrena como siempre.' },
      queHacerCorto: { cargado: 'Más ligero, u otra cosa.', seRecupera: 'No cambia la sesión.' },
      notificacion: {
        cargado: { uno: '{musculos} probablemente siga cargado. Una serie menos y sin llegar al fallo, o entrena otra cosa.', otros: '{musculos} probablemente sigan cargados. Una serie menos y sin llegar al fallo, o entrena otra cosa.' },
        seRecupera: { uno: '{musculos} todavía se recupera un poco. No cambia la sesión.', otros: '{musculos} todavía se recuperan un poco. No cambia la sesión.' },
      },
      respuestas: ['Entendido', 'Me siento bien'],
    },
    sesion: {
      suben: { uno: '1 sube', otros: '{n} suben' },
      igual: { uno: '1 igual', otros: '{n} igual' },
      sinSaber: { uno: '1 por primera vez', otros: '{n} por primera vez' },
      plan: '{series} × {reps}',
      planSinReps: { uno: '1 serie', otros: '{n} series' },
      corto: { sube: 'sube a {kg} kg', subeSinPeso: 'una repetición más', mismoPeso: 'igual' },
      motivo: {
        subir: 'dos sesiones seguidas al tope',
        faltaElTope: 'hasta hacer {tope} con 2 de sobra',
        sueno: 'dormiste poco',
        fatiga: 'todavía se recupera',
        sinObjetivo: 'sin repeticiones de objetivo en tu rutina',
        pocasSesiones: 'con una sesión más se sabe',
        primera: 'primera vez',
      },
      primera: 'Primera vez con este ejercicio: con dos sesiones, aquí verás si conviene subir.',
      ultima: '{cuando}: {series}',
      seriesIguales: '{n} × {peso} × {reps}',
      seriesDelCuerpo: '{n} × {reps}',
    },
    semana: {
      partes: {
        poco: { uno: 'A 1 le faltan series', otros: 'A {n} les faltan series' },
        enSuPunto: { uno: '1 al día', otros: '{n} al día' },
        mucho: { uno: '1 de más', otros: '{n} de más' },
        sinEntrenar: { uno: '1 sin entrenar', otros: '{n} sin entrenar' },
        entrenado: { uno: '1 entrenado', otros: '{n} entrenados' },
      },
      todoAlDia: 'Todos al día',
      sugerencia: {
        poco: { uno: 'Súmale 1 serie: con 10 llega a lo recomendado.', otros: 'Súmale {n} series: con 10 llega a lo recomendado.' },
        sinEntrenar: 'No lo entrenaste en los últimos 7 días: con 10 series llega a lo recomendado.',
      },
      primera: 'Tu primera semana: todavía no se compara con lo ideal.',
      entrenado: 'Entrenado',
      fuera: 'fuera de tu rutina',
    },
    fuerza: {
      corto: { sube: 'sube', sinSubidaClara: 'sin subida clara', bajo: 'bajó', noSeSabe: 'todavía no se sabe' },
      cuenta: {
        sube: { uno: '1 sube', otros: '{n} suben' },
        sinSubidaClara: { uno: '1 sin subida clara', otros: '{n} sin subida clara' },
        bajo: { uno: '1 bajó', otros: '{n} bajaron' },
        noSeSabe: { uno: '1 todavía no se sabe', otros: '{n} todavía no se saben' },
      },
      respuesta: { si: 'En {n} de {de} ejercicios, sí', ninguno: 'Por ahora, en ninguno' },
      sinMarca: { uno: '1 semana sin marca', otros: '{n} semanas sin marca' },
      vacio: 'Con 6 sesiones de un ejercicio en 6 semanas, aquí verás si sube.',
    },
    estancados: {
      pronto: { uno: 'Todavía es pronto: hacen falta 8 semanas con un ejercicio. Llevas 1.', otros: 'Todavía es pronto: hacen falta 8 semanas con un ejercicio. Llevas {n}.' },
    },
    compara: {
      antes: 'Antes',
      series: 'Series de {musculo} por semana',
      veces: 'Veces por semana',
      comida: 'Días dentro de tus calorías',
      proteina: 'Proteína por kilo',
      sueno: 'Sueño por noche',
      de7: '{n} de 7',
      sinDatos: 'sin datos',
    },
    metas: {
      llevasSesiones: 'Llevas {n} de 6 sesiones (cuentan las de las últimas 12 semanas).',
      llevasSemanas: 'Ya tienes 6 sesiones; faltan semanas entre la primera y la última: van {n} de 6.',
      ninguna: 'Elige un ejercicio y un peso. Con 6 sesiones en 6 semanas, Moss te dice cuándo llegas.',
      ventana: { entre: '{de} a {a}', desde: 'desde {mes}' },
    },
    nueva: {
      texto: { uno: 'Llevas 1 entrenamiento en Ascent. Con cada uno, esto se llena.', otros: 'Llevas {n} entrenamientos en Ascent. Con cada uno, esto se llena.' },
      aqui: 'Estás aquí',
      hitos: [['1 sesión', 'el cuerpo'], ['2 por ejercicio', 'la próxima vez'], ['6 sesiones en 6 semanas', 'tu fuerza y tus metas'], ['8 a 12 semanas', 'lo que no sube']],
    },
    frases: {
      queEsAscent: 'Ascent es la app donde anotas tus entrenamientos.',
      ejemplo: 'ejemplo',
      conecta: 'Fuerza · conecta Ascent',
      sinRutina: 'No sé si hoy entrenas. Arma tu rutina en Ascent o elige tus días.',
    },
  },
  en: {
    letras: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    cuando: { dia: 'on {dia}' },
    desde: { hoy: 'from today', ayer: 'from yesterday', dia: 'from {dia}' },
    siguiente: { manana: 'Tomorrow: {sesion}', dia: '{dia}: {sesion}' },
    fases: {
      recuperado: { nombre: 'Recovered', texto: 'Ready to train.' },
      faltaPoco: { nombre: 'Almost there', texto: '1 day left and most of it is behind. It doesn’t change the session.' },
      seRecupera: { nombre: 'Recovering', texto: '1 day left. It doesn’t change the session.' },
      cargado: { nombre: 'Loaded', texto: '2 days or more left. Today, better go lighter or train something else.' },
    },
    fatiga: {
      listo: 'ready {cuando}',
      yaListo: 'ready',
      ninguno: 'All recovered: today you can train whatever is planned.',
      sinRir: 'You didn’t log how many reps you had left: Moss assumes they were hard. Log it in Ascent and it gets more accurate.',
    },
    aviso: {
      titulo: { cargado: 'Today, go lighter on {sesion}', seRecupera: 'Today, {sesion} as usual' },
      etiqueta: {
        cargado: { uno: 'Planned today and still loaded', otros: 'Planned today and still loaded' },
        seRecupera: { uno: 'Planned today and still recovering', otros: 'Planned today and still recovering' },
      },
      hecho: { uno: 'You trained it {cuando}: {series}.', otros: 'You trained them {cuando}: {series}.' },
      hechoCorto: { uno: 'you trained it {cuando}, {series}', otros: 'you trained them {cuando}, {series}' },
      series: { uno: '1 set', otros: '{n} sets' },
      estimacion: { uno: 'About 1 day to go (an estimate; it can be off by a day).', otros: 'About {n} days to go (an estimate; it can be off by a day).' },
      queHacer: { cargado: 'Today, one set fewer and not to failure, or train something else.', seRecupera: 'It doesn’t change the session: train as usual.' },
      queHacerCorto: { cargado: 'Go lighter, or train something else.', seRecupera: 'It doesn’t change the session.' },
      notificacion: {
        cargado: { uno: '{musculos} is probably still loaded. One set fewer and not to failure, or train something else.', otros: '{musculos} are probably still loaded. One set fewer and not to failure, or train something else.' },
        seRecupera: { uno: '{musculos} is still recovering a little. It doesn’t change the session.', otros: '{musculos} are still recovering a little. It doesn’t change the session.' },
      },
      respuestas: ['Got it', 'I feel fine'],
    },
    sesion: {
      suben: { uno: '1 goes up', otros: '{n} go up' },
      igual: { uno: '1 stays', otros: '{n} stay' },
      sinSaber: { uno: '1 for the first time', otros: '{n} for the first time' },
      plan: '{series} × {reps}',
      planSinReps: { uno: '1 set', otros: '{n} sets' },
      corto: { sube: 'up to {kg} kg', subeSinPeso: 'one more rep', mismoPeso: 'same' },
      motivo: {
        subir: 'two sessions in a row at the top',
        faltaElTope: 'until you hit {tope} with 2 in reserve',
        sueno: 'you slept little',
        fatiga: 'still recovering',
        sinObjetivo: 'no target reps in your routine',
        pocasSesiones: 'one more session to know',
        primera: 'first time',
      },
      primera: 'First time with this exercise: after two sessions, you’ll see here whether to add weight.',
      ultima: '{cuando}: {series}',
      seriesIguales: '{n} × {peso} × {reps}',
      seriesDelCuerpo: '{n} × {reps}',
    },
    semana: {
      partes: {
        poco: { uno: '1 needs more sets', otros: '{n} need more sets' },
        enSuPunto: { uno: '1 on track', otros: '{n} on track' },
        mucho: { uno: '1 over', otros: '{n} over' },
        sinEntrenar: { uno: '1 not trained', otros: '{n} not trained' },
        entrenado: { uno: '1 trained', otros: '{n} trained' },
      },
      todoAlDia: 'All on track',
      sugerencia: {
        poco: { uno: 'Add 1 set: 10 gets it into the recommended range.', otros: 'Add {n} sets: 10 gets it into the recommended range.' },
        sinEntrenar: 'You haven’t trained it in the last 7 days: 10 sets gets it into the recommended range.',
      },
      primera: 'Your first week: it isn’t compared with the ideal yet.',
      entrenado: 'Trained',
      fuera: 'outside your routine',
    },
    fuerza: {
      corto: { sube: 'going up', sinSubidaClara: 'no clear increase', bajo: 'down', noSeSabe: 'too early to tell' },
      cuenta: {
        sube: { uno: '1 going up', otros: '{n} going up' },
        sinSubidaClara: { uno: '1 with no clear increase', otros: '{n} with no clear increase' },
        bajo: { uno: '1 down', otros: '{n} down' },
        noSeSabe: { uno: '1 too early to tell', otros: '{n} too early to tell' },
      },
      respuesta: { si: 'Yes, in {n} of {de} exercises', ninguno: 'Not in any yet' },
      sinMarca: { uno: '1 week without a best', otros: '{n} weeks without a best' },
      vacio: 'After 6 sessions of an exercise over 6 weeks, you’ll see here whether it’s going up.',
    },
    estancados: {
      pronto: { uno: 'It’s early: it takes 8 weeks with an exercise. You have 1.', otros: 'It’s early: it takes 8 weeks with an exercise. You have {n}.' },
    },
    compara: {
      antes: 'Before',
      series: '{musculo} sets a week',
      veces: 'Times a week',
      comida: 'Days within your calories',
      proteina: 'Protein per kilo',
      sueno: 'Sleep per night',
      de7: '{n} of 7',
      sinDatos: 'no data',
    },
    metas: {
      llevasSesiones: 'You have {n} of 6 sessions (only the last 12 weeks count).',
      llevasSemanas: 'You already have 6 sessions; it needs more weeks between the first and the last: {n} of 6 so far.',
      ninguna: 'Pick an exercise and a weight. After 6 sessions over 6 weeks, Moss tells you when you’ll get there.',
      ventana: { entre: '{de} to {a}', desde: 'from {mes} on' },
    },
    nueva: {
      texto: { uno: 'You have 1 workout in Ascent. With each one, this fills in.', otros: 'You have {n} workouts in Ascent. With each one, this fills in.' },
      aqui: 'You are here',
      hitos: [['1 session', 'the body'], ['2 per exercise', 'next time'], ['6 sessions over 6 weeks', 'your strength and your goals'], ['8 to 12 weeks', 'what isn’t going up']],
    },
    frases: {
      queEsAscent: 'Ascent is the app where you log your workouts.',
      ejemplo: 'example',
      conecta: 'Strength · connect Ascent',
      sinRutina: 'I can’t tell whether you train today. Set up your routine in Ascent or pick your days.',
    },
  },
};

// ------------------------------------------------------------ lo de siempre
const G = window.Galeria;
const A = Datos.ASCENT;
const HOY = Datos.HOY;
const AYER = Fechas.sumarDias(HOY, -1);
const u = Util.crear(G.opciones);
const { tx, numero, duracion, horaMin } = u;

const propio = (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), MIOS[G.idioma] || MIOS.es);
const conVariables = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
/** Un texto de este archivo (MIOS) con sus variables; y uno de { uno, otros }, con `n` adentro. */
const mi = (clave, vars) => conVariables(propio(clave), vars);
const miPlural = (clave, n, vars) => conVariables(propio(clave)[n === 1 ? 'uno' : 'otros'], Object.assign({ n }, vars));

const enFrase = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** «a, b y c»; delante de i o hi, «e», como en la app (palabras.ts). */
const enLista = (xs) => {
  if (xs.length <= 1) return xs[0] || '';
  const ultimo = xs[xs.length - 1];
  return `${xs.slice(0, -1).join(', ')} ${tx(/^(i|hi(?!e))/i.test(ultimo) ? 'ascent.ye' : 'ascent.y')} ${ultimo}`;
};
const nombreDelEjercicio = (e) => (e.id && !e.id.startsWith('propio_') ? tx('ascent.ejercicios.' + e.id) : e.ejercicio);
const nombreDelMusculo = (x) => tx('ascent.musculos.nombres.' + x);
const listaDeMusculos = (ms) => enLista(ms.map((x) => nombreDelMusculo(x).toLowerCase()));
const kilos = (v) => `${u.peso(v)} kg`;
const horasDe = (min) => duracion(Math.round(min / 5) * 5);
const unDecimal = (n) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
const nombreDelDia = (fecha) => tx('fecha.dias.' + Fechas.diaDeLaSemana(fecha));
/** «hoy», «ayer» o «el lunes»; de hace una semana o más, «el 14 oct» (el miércoles pasado se confundiría con hoy). */
const cuandoFue = (fecha) => {
  const dias = Fechas.diasEntre(fecha, HOY);
  return dias === 0 ? tx('ascent.recuperado.cuando.hoy') : dias === 1 ? tx('ascent.recuperado.cuando.ayer') : mi('cuando.dia', { dia: dias < 7 ? nombreDelDia(fecha) : u.fechaCorta(fecha) });
};
/** «Piernas», «Pecho y hombros» o, sin ejercicios, «Gimnasio»: como nombra la app una sesión (nombres.ts). */
const nombreDeSesion = (grupos) => {
  const n = grupos.slice(0, 2).map((x) => tx('ascent.hoy.grupos.' + x));
  return !n.length ? tx('ascent.gimnasio.nombre') : n.length === 2 ? tx('ascent.hoy.y', { a: n[0], b: n[1].toLowerCase() }) : n[0];
};
/** Los grupos de unos ejercicios ({ id, series }), del que tiene más series al que menos (conAscent.ts). */
function gruposDe(ejercicios) {
  const series = new Map();
  ejercicios.forEach((e) => {
    const grupo = Musculos.grupoDelEjercicio({ id: e.id });
    if (grupo) series.set(grupo, (series.get(grupo) || 0) + Math.max(1, e.series));
  });
  return [...series].sort((a, b) => b[1] - a[1]).map(([grupo]) => grupo);
}
const clave = (x) => Musculos.claveDelEjercicio(x);
const promedio = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const promedioDe3 = (xs) => (xs.length >= 3 ? promedio(xs) : null);
/** Un instante de un día a unos minutos de su medianoche, en la hora de la persona (como Datos.ASCENT). */
const instante = (fecha, minutos) => Date.parse(fecha + 'T00:00:00.000Z') - Datos.ZONA * 60e3 + minutos * 60e3;

// ------------------------------------------------------------ la persona: la de la galería, con lo que le falta
const NECESIDAD = Sueno.necesidad(Number(HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
// Lo que tarda en dormirse: lo que aprendió Moss, como en la sección de la galería.
const LATENCIA = 20;
const ANIOS = { principiante: 0, intermedio: 2, avanzado: 4 };
// Las repeticiones del objetivo de cada ejercicio en su rutina de Ascent (el tope de la doble progresión): las de
// Datos.ASCENT.objetivos y, del resto, las que hace siempre.
const REPS = Object.assign({
  prensa: 10, curl_femoral: 12, extension_cuadriceps: 12, gemelos: 15, press_inclinado_mancuernas: 8, press_militar: 10, fondos: 10, triceps_polea: 12,
  remo_barra: 8, dominadas: 6, elevaciones_laterales: 12, curl_barra: 10, remo_mancuerna: 10, face_pull: 15,
}, A.objetivos);
/** La última sesión de un día de la rutina que tuvo todos sus ejercicios (la descarga no). */
const completaDel = (lista, r) => [...lista].reverse().find((s) => Fechas.diaDeLaSemana(s.fecha) === r.dia && r.ejercicios.every((e) => s.bloques.some((x) => x.id === e.id)));

// Su historia en Ascent hasta ayer, la de Datos.ASCENT, con tres cambios para que estén todos los casos:
// - el press militar bajó: sus últimos cuatro lunes, 37,5 kg («Por qué bajaste»);
// - en el press de banca, que no sube desde agosto, los dos últimos lunes no llegó a las 5 en la última serie;
// - en la última sesión entera de piernas no llegó a las repeticiones en la última serie de prensa ni de extensión.
// Esos tres no suben la próxima vez: la doble progresión pide dos sesiones con todas las series al tope.
const HISTORIA = (() => {
  const antes = A.sesiones.filter((s) => s.fecha < HOY);
  const lunes = antes.filter((s) => Fechas.diaDeLaSemana(s.fecha) === 1).slice(-4).map((s) => s.fecha);
  const piernas = completaDel(antes, A.rutina.find((r) => r.dia === 3));
  const conLaUltima = (x, reps) => Object.assign({}, x, { series: x.series.map((y, i) => (i === x.series.length - 1 ? Object.assign({}, y, { reps }) : y)) });
  return antes.map((s) => ({
    fecha: s.fecha, inicio: s.inicio, hora: s.hora, minutos: s.minutos,
    bloques: s.bloques.map((x) => {
      if (x.id === 'press_militar' && lunes.includes(s.fecha)) return Object.assign({}, x, { series: x.series.map(() => ({ peso: 37.5, reps: 10 })) });
      if (x.id === 'press_banca' && lunes.slice(-2).includes(s.fecha)) return conLaUltima(x, 4);
      if (s === piernas && x.id === 'prensa') return conLaUltima(x, 8);
      if (s === piernas && x.id === 'extension_cuadriceps') return conLaUltima(x, 10);
      return x;
    }),
  }));
})();
// La de hoy (piernas, 18:40), que solo cuenta en el día `hecha`: la de Datos.ASCENT, con la prensa cayendo de 10 a 5
// repeticiones con el mismo peso (así «Cómo fue» tiene algo que decir: «Dura»).
const DE_HOY = (() => {
  const s = A.sesiones.find((x) => x.fecha === HOY);
  return Object.assign({}, s, { bloques: s.bloques.map((x) => (x.id === 'prensa' ? Object.assign({}, x, { series: x.series.map((y, i) => Object.assign({}, y, { reps: [10, 8, 5][i] != null ? [10, 8, 5][i] : 5 })) }) : x)) });
})();
const ULTIMO_DOMINGO = [...HISTORIA].reverse().find((s) => Fechas.diaDeLaSemana(s.fecha) === 0).fecha;

/**
 * Ayer, fuera de la rutina: 12 series de cuádriceps, las 4 de zancadas al fallo (el día `cargado`). Sin la sentadilla:
 * así su tendencia y su meta son las mismas que en los otros días.
 */
function piernasDeAyer() {
  const peso = (id) => [...HISTORIA].reverse().flatMap((s) => s.bloques).find((x) => x.id === id).series[0].peso;
  const series = (n, kg, reps, rir) => Array.from({ length: n }, () => (rir == null ? { peso: kg, reps } : { peso: kg, reps, rir }));
  return {
    fecha: AYER, hora: 19 * 60, inicio: instante(AYER, 19 * 60), minutos: 52,
    bloques: [
      { id: 'sentadilla_bulgara', ejercicio: 'Sentadilla búlgara', series: series(4, 30, 10) },
      { id: 'prensa', ejercicio: 'Prensa', series: series(4, peso('prensa'), 10) },
      { id: 'zancadas', ejercicio: 'Zancadas', series: series(4, 20, 10, 0) },
    ],
  };
}

// Los días de ejemplo: todos son el miércoles de la galería (Datos.HOY), con piernas a las 18:40.
// - cargado: ayer entrenó piernas fuera de la rutina: cuádriceps y glúteos siguen cargados (el aviso);
// - normal: nada limita;
// - casi: el tirón del domingo lo hizo ayer: glúteos e isquios todavía se recuperan (la nota que no pide nada);
// - nocheCorta: durmió 5 h 40 min;
// - descanso: esta semana pasó piernas al jueves: hoy no entrena y mañana sí;
// - hecha: ya entrenó (son las 20:10);
// - nueva: empezó con Ascent el domingo: lleva dos entrenamientos.
const DIAS = {
  cargado: { ahora: 15 * 60, sesion: 'prevista', ayer: piernasDeAyer },
  normal: { ahora: 15 * 60 + 30, sesion: 'prevista' },
  casi: { ahora: 15 * 60 + 30, sesion: 'prevista', mover: ULTIMO_DOMINGO },
  nocheCorta: { ahora: 14 * 60 + 30, sesion: 'prevista', dormido: 340 },
  descanso: { ahora: 15 * 60, sesion: null, piernasEl: 4 },
  hecha: { ahora: 20 * 60 + 10, sesion: 'hecha' },
  nueva: { ahora: 15 * 60 + 30, sesion: 'prevista', desde: ULTIMO_DOMINGO },
};

function sesionesDe(d) {
  let lista = HISTORIA;
  if (d.desde) lista = lista.filter((s) => s.fecha >= d.desde);
  if (d.mover) lista = lista.map((s) => (s.fecha === d.mover ? Object.assign({}, s, { fecha: AYER, hora: 19 * 60, inicio: instante(AYER, 19 * 60) }) : s));
  if (d.ayer) lista = lista.concat(d.ayer());
  if (d.sesion === 'hecha') lista = lista.concat({ fecha: HOY, inicio: DE_HOY.inicio, hora: DE_HOY.hora, minutos: DE_HOY.minutos, bloques: DE_HOY.bloques });
  return [...lista].sort((a, b) => a.inicio - b.inicio);
}
/** Las noches de Salud de la galería; en `nocheCorta`, la de anoche más corta (se durmió más tarde). */
function nochesDe(d) {
  if (!d.dormido) return Datos.NOCHES;
  return Datos.NOCHES.map((n) => (n.clave === HOY ? Object.assign({}, n, { dormido: d.dormido, dormirse: n.despertar - d.dormido - (typeof n.despierto === 'number' ? n.despierto : 0) }) : n));
}
/** Su rutina de Ascent, con las series de cada ejercicio y sus repeticiones; en `descanso`, piernas va el jueves. */
function rutinaDe(d) {
  return A.rutina.map((r) => {
    const completa = completaDel(HISTORIA, r);
    return {
      dia: d.piernasEl != null && r.dia === 3 ? d.piernasEl : r.dia,
      hora: r.dia === 3 ? DE_HOY.hora : r.hora,
      minutos: completa.minutos,
      ejercicios: r.ejercicios.map((e) => ({ id: e.id, nombre: e.ejercicio, series: completa.bloques.find((x) => x.id === e.id).series.length, reps: REPS[e.id] || null })),
    };
  });
}
/** La sesión que toca según la rutina, como la arma Ascent: sus series, con el peso de la última vez (conAscent.ts). */
function bloquesDeLaRutina(dia, previas) {
  return dia.ejercicios.filter((e) => e.series > 0).map((e) => {
    let ultima;
    for (let i = previas.length - 1; i >= 0 && !ultima; i--) ultima = [...previas[i].bloques].reverse().find((x) => clave(x) === e.id && x.series.length);
    const series = Array.from({ length: e.series }, (_, i) => {
      const s = ultima && ultima.series[Math.min(i, ultima.series.length - 1)];
      return { peso: s ? s.peso : 0, reps: e.reps != null ? e.reps : s ? s.reps : null };
    });
    return { ejercicio: e.nombre, id: e.id, series };
  });
}

// ------------------------------------------------------------ las cuentas, como la app (src/secciones/ascent/vista.ts)
// Todo sale de los módulos del dominio que tiene la galería. Lo único copiado acá es lo que la galería no trae:
// las sugerencias de hoy (src/dominio/sugerenciasDeHoy.ts, tal cual) y lo que falta para una meta (vista.ts, loQueFalta).
const CUANDO = ['ya', 'manana', 'pasadoManana', 'enUnosDias'];
const FASES = ['recuperado', 'faltaPoco', 'seRecupera', 'cargado'];
/**
 * La fase de la fatiga. La app tiene tres estados (estadoDeFatiga): listo, falta 1 día (no cambia la sesión) y faltan 2
 * o más (cargado: cambia el titular). La cuarta, «falta poco», parte el día que falta: cuando ya pasaron dos tercios o
 * más de la recuperación (una de 3 días o más).
 */
const faseDe = (dias, total) => (dias <= 0 ? 'recuperado' : dias >= 2 ? 'cargado' : total >= 3 ? 'faltaPoco' : 'seRecupera');

/** La fatiga en días con lo hecho hasta `ahora`: fatigaEnDias de vista.ts, con las cuentas de puntajeMuscular.ts. */
function fatigaEnDias(x) {
  const previas = x.sesiones.filter((s) => s.inicio < x.ahora && s.inicio >= x.ahora - PuntajeMuscular.DIAS_DEL_E1RM * 86400000);
  const vistos = new Map();
  const unoRM = (b) => {
    const k = clave(b);
    if (!vistos.has(k)) vistos.set(k, PuntajeMuscular.mejorE1rm(previas.flatMap((s) => s.bloques.filter((y) => clave(y) === k).flatMap((y) => y.series))));
    return vistos.get(k);
  };
  const hechoDe = (b) => {
    const m = Musculos.musculosDe(b);
    if (!m) return null;
    const uno = unoRM(b);
    const parte = b.id ? Musculos.PARTES[b.id] : undefined;
    return Object.assign({ principal: m.principal, ayuda: m.ayudan, objetivo: (b.id && x.topeDe.get(b.id)) || null }, parte ? { parte } : {}, {
      series: b.series.filter((s) => PuntajeMuscular.esDeTrabajo(s, uno)).map((s) => ({ reps: s.reps, rir: s.rir != null ? s.rir : null })),
    });
  };
  const primera = x.sesiones.length ? x.sesiones[0].fecha : null;
  const nuevoEl = (b, fecha) => {
    const desde = Fechas.sumarDias(fecha, -182);
    if (!primera || primera > desde) return false;
    const k = clave(b);
    return !x.sesiones.some((s) => s.fecha >= desde && s.fecha < fecha && s.bloques.some((y) => clave(y) === k));
  };
  const porSesion = new Map();
  for (const s of x.sesiones) {
    if (s.inicio > x.ahora || Fechas.diasEntre(s.fecha, x.hoy) > 14) continue;
    const delDia = new Map();
    for (const b of s.bloques) {
      const m = Musculos.musculosDe(b);
      const hecho = hechoDe(b);
      if (!m || !hecho || !hecho.series.length) continue;
      const rirs = hecho.series.flatMap((y) => (y.rir != null ? [y.rir] : []));
      const multi = !!(b.id && Musculos.CATALOGO[b.id] && Musculos.CATALOGO[b.id].multiarticular);
      for (const musculo of m.principal) {
        const antes = delDia.get(musculo);
        const deAntes = antes && antes.rirMinimo != null ? [antes.rirMinimo] : [];
        delDia.set(musculo, {
          fecha: s.fecha,
          series: (antes ? antes.series : 0) + hecho.series.length,
          rirMinimo: rirs.length ? Math.min(...rirs, ...deAntes) : antes ? antes.rirMinimo : null,
          multiarticularDePiernas: (antes ? antes.multiarticularDePiernas : false) || (multi && PuntajeMuscular.DE_PIERNAS.includes(musculo)),
          nuevo: (antes ? antes.nuevo : false) || nuevoEl(b, s.fecha),
        });
      }
    }
    for (const [musculo, y] of delDia) porSesion.set(musculo, [...(porSesion.get(musculo) || []), y]);
  }
  return { hechoDe, porSesion };
}

/** La última sesión en que unos músculos fueron principales: sus series de trabajo y cuántas al fallo (vista.ts, ultimaCon). */
function ultimaCon(previas, musculos) {
  const vistos = new Map();
  const unoRM = (b) => {
    const k = clave(b);
    if (!vistos.has(k)) vistos.set(k, Musculos.mejorE1rm(previas, b));
    return vistos.get(k);
  };
  for (const s of [...previas].reverse()) {
    let series = 0;
    let alFallo = 0;
    s.bloques.forEach((b) => {
      const m = Musculos.musculosDe(b);
      if (!m || !m.principal.some((y) => musculos.includes(y))) return;
      const deTrabajo = b.series.filter((y) => Musculos.esfuerzoDeSerie(y, unoRM(b)) > 0);
      series += deTrabajo.length;
      alFallo += deTrabajo.filter((y) => y.rir === 0).length;
    });
    if (series > 0) return { fecha: s.fecha, series, alFallo };
  }
  return null;
}

// src/dominio/sugerenciasDeHoy.ts, tal cual (la galería no lo trae: ver el informe).
const SERIES_SEGUN = { musculo: { reps: [8, 12], reserva: [1, 2] }, fuerza: { reps: [3, 6], reserva: [2, 3] } };
function sugerenciasDeHoy(e) {
  const corta = !!e.noche && (e.noche.dormido <= 360 || (e.noche.despertoAntes || 0) >= 60);
  let entreno;
  if (!e.sesion) entreno = { clave: 'descanso' };
  else if (e.sesion.hecha) entreno = null;
  else if (corta) entreno = { clave: 'nocheCorta', musculos: e.sesion.musculos };
  else if (e.sinRecuperar.length) entreno = { clave: 'conFatiga', musculos: e.sesion.musculos, fatigados: e.sinRecuperar };
  else entreno = Object.assign({ clave: 'entrenar', musculos: e.sesion.musculos }, SERIES_SEGUN[e.objetivo]);

  let comida;
  const a = e.ayer;
  if (e.cuidadoConLaComida) comida = { clave: 'cuidado' };
  else {
    const de = (m) => (a ? { proteina: [a.proteina, a.metaProteina], carbohidratos: [a.carbohidratos, a.metaCarbohidratos], grasas: [a.grasas, a.metaGrasas] }[m] : [0, 0]);
    const parte = (m) => de(m)[0] / de(m)[1];
    const faltaron = ['proteina', 'carbohidratos', 'grasas'].filter((m) => de(m)[1] > 0 && de(m)[0] < 0.8 * de(m)[1]).sort((x, y) => parte(x) - parte(y)).slice(0, 2);
    comida = faltaron.length ? { clave: 'faltaron', macros: faltaron } : { clave: 'recuperar', macros: e.sesion ? ['proteina', 'carbohidratos'] : ['proteina'] };
  }

  const hora = e.acostarse != null ? e.acostarse : undefined;
  const deMas = Math.max(corta ? 30 : 0, e.deuda === 'media' ? 30 : e.deuda === 'alta' ? 60 : 0);
  const minutos = e.necesidad + deMas;
  const conHora = (k) => (hora === undefined ? { clave: k + 'SinHora', minutos } : { clave: k, hora, minutos });
  let sueno;
  if (!e.noche) sueno = hora === undefined ? { clave: 'sinDatos', minutos } : { clave: 'soloHora', hora, minutos };
  else if (corta) sueno = conHora('dormistePoco');
  else if (e.deuda === 'media' || e.deuda === 'alta') sueno = conHora('deuda');
  else sueno = conHora('bien');
  return { entreno, comida, sueno };
}

/** Lo que le falta a un ejercicio para que se estime cuándo llegas (vista.ts, loQueFalta). */
function loQueFalta(t) {
  const sesiones = Math.max(0, ProgresoCompartido.SESIONES_MINIMAS - t.sesiones);
  const semanas = Math.max(0, Math.ceil(ProgresoCompartido.SEMANAS_MINIMAS_DE_HISTORIA - t.semanas));
  if (!sesiones && !semanas) return null;
  const porSemana = t.sesiones > 1 && t.semanas > 0 ? (t.sesiones - 1) / t.semanas : 1;
  return sesiones && sesiones / porSemana >= semanas ? { que: 'sesiones', n: sesiones } : { que: 'semanas', n: semanas };
}

/** Todo lo de un día de ejemplo, en números. No depende del idioma: se calcula una vez. */
function calcular(nombre) {
  const d = DIAS[nombre];
  const sesiones = sesionesDe(d);
  const noches = nochesDe(d);
  const ahora = instante(HOY, d.ahora);
  const rutina = rutinaDe(d);
  const marcas = d.desde ? [] : A.marcas;
  const pesoKg = Datos.PESADAS[Datos.PESADAS.length - 1].kg;
  const persona = G.persona();
  const objetivo = persona.perfil.objetivo;
  const metaDeComida = persona.control.metas;
  const topeDe = new Map();
  rutina.forEach((r) => r.ejercicios.forEach((e) => { if (e.reps) topeDe.set(e.id, e.reps); }));
  const viejas = [...sesiones.map((s) => s.fecha), ...marcas.map((m) => m.fecha)].sort();
  const entrenado = !!viejas.length && Fechas.diasEntre(viejas[0], HOY) >= 7 * 26;
  const comidos = new Map();
  const comidoEl = (fecha) => {
    if (!comidos.has(fecha)) comidos.set(fecha, G.secciones.comida.totalDe(Fechas.diasEntre(HOY, fecha)));
    return comidos.get(fecha);
  };

  // ---- la sesión de hoy: anotada, hecha; si no, la de la rutina con el peso de la última vez
  const hoyDia = Fechas.diaDeLaSemana(HOY);
  const deLaRutina = rutina.find((r) => r.dia === hoyDia) || null;
  const hechasHoy = sesiones.filter((s) => s.fecha === HOY);
  let sesion = null;
  if (hechasHoy.length) {
    const bloques = hechasHoy.flatMap((s) => s.bloques);
    sesion = { estado: 'hecha', inicio: hechasHoy[0].hora, minutos: hechasHoy.reduce((t, s) => t + s.minutos, 0), bloques, grupos: gruposDe(bloques.map((b) => ({ id: b.id, series: b.series.length }))) };
  } else if (deLaRutina) {
    sesion = { estado: 'prevista', inicio: deLaRutina.hora, minutos: deLaRutina.minutos, bloques: bloquesDeLaRutina(deLaRutina, sesiones), grupos: gruposDe(deLaRutina.ejercicios) };
  }
  const prevista = !!sesion && sesion.estado === 'prevista';
  const en = prevista ? instante(HOY, sesion.inicio - 10) : ahora;
  const previas = sesiones.filter((s) => s.inicio < en);
  let siguiente = null;
  for (let k = 1; k <= 7 && !siguiente; k++) {
    const r = rutina.find((x) => x.dia === (hoyDia + k) % 7);
    if (r) siguiente = { dias: k, fecha: Fechas.sumarDias(HOY, k), hora: r.hora, grupos: gruposDe(r.ejercicios), musculos: Fatiga.musculosPrincipales(r.ejercicios) };
  }

  // ---- la noche
  const anoche = noches.find((n) => n.clave === HOY) || null;
  const ultimas3 = [0, 1, 2].flatMap((k) => noches.filter((n) => n.clave === Fechas.sumarDias(HOY, -k)).map((n) => n.dormido));
  const habitual = SinReloj.habitualDe(noches, HOY);
  const noche = anoche ? { dormido: anoche.dormido, necesidad: NECESIDAD, despertoAntes: habitual && anoche.despertar < habitual.despertar ? habitual.despertar - anoche.despertar : null } : null;
  const deuda = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, HOY, 14), NECESIDAD);
  const periodo = Melatonina.periodoDeMelatonina(noches, HOY, { margen: LATENCIA, deuda: deuda ? deuda.minutos : null });
  const nocheCorta = !!noche && (noche.dormido <= Rendimiento.NOCHE_CORTA || (noche.despertoAntes || 0) >= Rendimiento.DESPERTO_ANTES);

  // ---- la fatiga de cada músculo, en días, y la semana (calcularTusMusculos)
  const F = fatigaEnDias({ sesiones, hoy: HOY, ahora, topeDe });
  const fatigaDe = (musculo) => {
    const lista = F.porSesion.get(musculo) || [];
    const listo = PuntajeMuscular.listoEl(lista);
    const dias = PuntajeMuscular.diasHastaListo(listo, HOY);
    const ultima = lista.length ? lista[lista.length - 1] : null;
    const total = dias && ultima ? Math.max(dias, Fechas.diasEntre(ultima.fecha, listo)) : 0;
    return { dias, total, listo: dias ? listo : null, fatiga: PuntajeMuscular.estadoDeFatiga(dias), fase: faseDe(dias, total), ultimaVez: ultima ? ultima.fecha : null, sinRir: !!ultima && ultima.rirMinimo === null };
  };
  const hechos = sesiones.filter((s) => PuntajeMuscular.dentroDeLaSemana(s.fecha, HOY)).flatMap((s) => s.bloques.flatMap((b) => {
    const x = F.hechoDe(b);
    return x ? [{ b, x }] : [];
  }));
  const porMusculo = PuntajeMuscular.seriesPorMusculo(hechos.map((y) => y.x));
  const musculosHoy = Fatiga.musculosParaLaFatiga({ deHoy: sesion ? sesion.bloques : null, sesiones, en });
  const deLaSesion = sesion ? Fatiga.musculosPrincipales(sesion.bloques) : [];
  const musculos = Musculos.MUSCULOS.map((musculo) => {
    const x = porMusculo.get(musculo);
    const series = x ? x.series : 0;
    return Object.assign({ musculo, series, estado: PuntajeMuscular.estadoDelPuntaje(PuntajeMuscular.puntaje(series)), partes: x ? x.partes : {}, hoyToca: prevista && deLaSesion.includes(musculo) }, fatigaDe(musculo));
  });
  const delMusculo = (x) => musculos.find((y) => y.musculo === x);

  // ---- la próxima vez de un ejercicio: la doble progresión con sus sesiones de verdad
  const deHoy = new Set(prevista ? sesion.bloques.map(clave) : []);
  const proximaDe = (e) => {
    const k = clave(e);
    const deVerdad = (y) => clave(y) === k && !y.copiada;
    const suyas = sesiones.map((s) => ({ series: s.bloques.filter(deVerdad).flatMap((y) => { const h = F.hechoDe(y); return h ? h.series : []; }) })).filter((s) => s.series.length);
    const ultima = [...sesiones].reverse().find((s) => s.bloques.some(deVerdad));
    const ultimos = ultima ? ultima.bloques.filter(deVerdad) : [];
    const m = Musculos.musculosDe(e);
    const tope = (e.id && topeDe.get(e.id)) || null;
    const toca = deHoy.has(k);
    return {
      tope, veces: suyas.length,
      peso: Math.max(0, ...ultimos.flatMap((y) => y.series.map((z) => z.peso))),
      ultima: ultima ? { fecha: ultima.fecha, series: ultimos.flatMap((y) => y.series) } : null,
      proxima: PuntajeMuscular.proximaSesion({ sesiones: suyas, tope, nocheCortaHoy: nocheCorta && toca, fatigadoHoy: toca && !!m && m.principal.some((y) => delMusculo(y).dias > 0) }),
    };
  };
  // Cada ejercicio de la semana una vez, con sus series duras.
  const juntos = new Map();
  for (const { b, x } of hechos) {
    const k = clave(b);
    const g = juntos.get(k) || { b, x, duras: 0, alFallo: 0 };
    g.duras += x.series.filter((s) => PuntajeMuscular.esDura(s, x.objetivo)).length;
    g.alFallo += x.series.filter((s) => s.rir === 0).length;
    juntos.set(k, g);
  }
  const ejercicios = [...juntos.values()].map(({ b, x, duras, alFallo }) => Object.assign({ e: { id: b.id, ejercicio: b.ejercicio }, principal: x.principal, ayudan: x.ayuda, parte: x.parte || null, duras, alFallo }, proximaDe(b)));
  const enLaSesion = sesion ? sesion.bloques.map((b) => {
    const m = Musculos.musculosDe(b);
    return Object.assign({ e: { id: b.id, ejercicio: b.ejercicio }, series: b.series, principal: m ? m.principal : [], ayudan: m ? m.ayudan : [] }, proximaDe(b));
  }) : [];

  // ---- lo de hoy: el titular (calcularHoy) y el aviso de fatiga
  const f = musculosHoy.map((x) => {
    const y = delMusculo(x);
    return { musculo: x, dias: y.dias, estado: y.fatiga === 'descansado' ? 'recuperado' : y.fatiga, cuando: CUANDO[Math.min(y.dias, CUANDO.length - 1)] };
  });
  const titular = Recuperado.titularDeHoy({
    sesion: sesion ? sesion.estado : null, sabeCuandoEntrena: true, noche, ultimas3,
    musculos: prevista ? Musculos.peorEstado(f.map((x) => x.estado)) : null, comoTeSientes: null,
  });
  const noListos = prevista ? f.filter((x) => x.dias > 0) : [];
  const cargados = noListos.filter((x) => x.dias >= 2);
  const delAviso = (cargados.length ? cargados : noListos).map((x) => x.musculo);
  const aviso = delAviso.length ? {
    nivel: cargados.length ? 'cargado' : 'seRecupera', musculos: delAviso,
    tambien: cargados.length ? noListos.filter((x) => x.dias === 1).map((x) => x.musculo) : [],
    dias: Math.max(...delAviso.map((x) => delMusculo(x).dias)),
    total: Math.max(...delAviso.map((x) => delMusculo(x).total)),
    listo: delAviso.map((x) => delMusculo(x).listo).sort().pop(),
    ultima: ultimaCon(previas, delAviso),
    sinRir: delAviso.every((x) => delMusculo(x).sinRir),
  } : null;

  // ---- las sugerencias de hoy (ParaHoy, en Vinculada.tsx)
  const comidoAyer = comidoEl(AYER);
  const sugerencias = sugerenciasDeHoy({
    sesion: sesion ? { musculos: deLaSesion, minutos: sesion.minutos, hecha: sesion.estado === 'hecha' } : null,
    sinRecuperar: deLaSesion.filter((x) => delMusculo(x).fatiga === 'cargado'),
    objetivo: 'musculo',
    noche: noche ? { dormido: noche.dormido, despertoAntes: noche.despertoAntes } : null,
    deuda: deuda ? Sueno.juicioDeLaDeuda(deuda) : null,
    necesidad: NECESIDAD,
    acostarse: periodo ? (periodo.acostarse + 18 * 60) % (24 * 60) : null,
    ayer: comidoAyer.kcal > 0 ? {
      kcal: comidoAyer.kcal, proteina: comidoAyer.p, carbohidratos: comidoAyer.c, grasas: comidoAyer.g,
      metaKcal: metaDeComida.kcal, metaProteina: metaDeComida.proteina, metaCarbohidratos: metaDeComida.carbohidratos, metaGrasas: metaDeComida.grasas,
    } : null,
    cuidadoConLaComida: false,
  });

  // ---- la nota de la rutina (calcularTusMusculos) y la semana en siete días, de lunes a domingo
  const nota = PuntajeMuscular.notaDeLaRutina(rutina.map((r) => r.ejercicios.flatMap((y) => {
    const m = Musculos.musculosDe({ id: y.id });
    return m ? [{ principal: m.principal, ayuda: m.ayudan, series: Array.from({ length: y.series }, () => ({ reps: null })) }] : [];
  })));
  const lunesHoy = Fechas.lunesDe(HOY);
  const semana = Array.from({ length: 7 }, (_, i) => {
    const fecha = Fechas.sumarDias(lunesHoy, i);
    const r = rutina.find((x) => x.dia === Fechas.diaDeLaSemana(fecha)) || null;
    const hechas = sesiones.filter((s) => s.fecha === fecha && s.inicio <= ahora);
    const bloques = hechas.flatMap((s) => s.bloques);
    return {
      fecha, hoy: fecha === HOY, toca: !!r, hecho: hechas.length > 0, fuera: hechas.length > 0 && !r,
      grupos: hechas.length ? gruposDe(bloques.map((b) => ({ id: b.id, series: b.series.length }))) : r ? gruposDe(r.ejercicios) : [],
    };
  });

  // ---- tu fuerza: los multiarticulares de la rutina con marca en Ascent, desde hoy en la semana (calcularTodo)
  const hasta = sesion && sesion.estado === 'hecha' ? Fechas.sumarDias(HOY, 1) : HOY;
  const hastaAhi = sesiones.filter((s) => s.fecha < hasta);
  const pasadas = sesiones.filter((s) => s.fecha < HOY);
  const tendenciaDe = (e) => {
    const puntos = Estancados.puntosDelEjercicio(hastaAhi, e, HOY);
    return { t: ProgresoCompartido.tendenciaDeFuerza(puntos, { hoy: 0, entrenado }), puntos };
  };
  const desdeHoy = (dia) => (dia - hoyDia + 7) % 7;
  const seguidos = [];
  [...rutina].sort((a, b) => desdeHoy(a.dia) - desdeHoy(b.dia)).forEach((r) => r.ejercicios.forEach((y) => {
    const c = Musculos.CATALOGO[y.id];
    if (!c || !c.multiarticular || seguidos.some((x) => x.id === y.id) || !marcas.some((m) => m.id === y.id)) return;
    seguidos.push({ id: y.id, ejercicio: y.nombre });
  }));
  const ultimaMarca = (id) => marcas.filter((m) => m.id === id).reduce((a, m) => (!a || m.fecha > a.fecha ? m : a), null);
  // Lo de Moss de la semana que empieza un lunes (solo los días que ya pasaron): la comida anotada y las noches.
  const dentroDeLasCalorias = (t) => {
    const quedan = Math.round(metaDeComida.kcal - t.kcal);
    if ((objetivo === 'bajar' && quedan < 0) || (objetivo === 'subir' && quedan > 0)) return false;
    return Math.abs(quedan) <= 0.1 * metaDeComida.kcal;
  };
  const moss = (lunes) => {
    const fechas = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(lunes, i)).filter((x) => x < HOY);
    const dias = fechas.map(comidoEl).filter((t) => t.kcal > 0);
    return {
      comida: { dias: dias.length, proteina: dias.length ? promedio(dias.map((t) => t.p)) : 0 },
      dentro: dias.filter(dentroDeLasCalorias).length,
      noches: noches.filter((n) => fechas.includes(n.clave)).map((n) => n.dormido),
    };
  };
  const conSesion = (lista) => (lunes) => lista.some((s) => s.fecha >= lunes && s.fecha < Fechas.sumarDias(lunes, 7));
  const bajaSemanal = persona.cambio7 != null ? (-persona.cambio7 / pesoKg) * 100 : null;
  /** Las razones (razonesDeEstancamiento) de un ejercicio con las semanas de antes y las de ahora, y lo mismo lado a lado. */
  const razonesDe = (e, musculo, s, anios) => {
    const semanaDe = (l) => Estancados.semanaDeEntreno(pasadas, l, e, musculo);
    const antes = s.antes.filter(conSesion(pasadas)).map(semanaDe);
    const ahoraS = s.ahora.filter(conSesion(pasadas)).map(semanaDe);
    const mossAntes = s.antes.map(moss);
    const mossAhora = s.ahora.map(moss);
    const r = ProgresoCompartido.razonesDeEstancamiento({
      antes, ahora: ahoraS, objetivo, sinDeficit: false, bajaSemanal, comida: mossAhora.map((x) => x.comida), pesoKg,
      sueno: { antes: promedioDe3(mossAntes.flatMap((x) => x.noches)), ahora: promedioDe3(mossAhora.flatMap((x) => x.noches)) }, anios,
    });
    const deMoss = (xs) => {
      const conComida = xs.filter((x) => x.comida.dias >= ProgresoCompartido.DIAS_DE_COMIDA);
      return {
        dentro: conComida.length ? promedio(conComida.map((x) => (x.dentro / x.comida.dias) * 7)) : null,
        gPorKg: conComida.length ? promedio(conComida.map((x) => x.comida.proteina)) / pesoKg : null,
        sueno: promedioDe3(xs.flatMap((x) => x.noches)),
      };
    };
    const lado = (semanas, xs) => Object.assign({ series: semanas.length ? promedio(semanas.map((x) => x.series)) : null, veces: semanas.length ? promedio(semanas.map((x) => x.veces)) : null }, deMoss(xs));
    return { antes, ahora: ahoraS, r, compara: { antes: lado(antes, mossAntes), ahora: lado(ahoraS, mossAhora) } };
  };
  const puntosDeLaBajada = (e) => {
    const k = clave(e);
    return pasadas.flatMap((s) => {
      let mejor = null;
      s.bloques.filter((b) => clave(b) === k && !b.copiada).forEach((b) => b.series.forEach((x) => {
        const v = PuntajeMuscular.e1rm(x.peso, x.reps);
        if (v !== null && (!mejor || v > mejor.e1rm)) mejor = { fecha: s.fecha, e1rm: v, reps: x.reps };
      }));
      return mejor ? [mejor] : [];
    });
  };
  const mediana = (xs) => {
    const o = [...xs].sort((a, b) => a - b);
    return o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2;
  };
  const fuerza = seguidos.map((e) => {
    const { t, puntos } = tendenciaDe(e);
    const m = Musculos.musculosDe(e);
    const musculo = m ? m.principal[0] : null;
    const ultima = ultimaMarca(e.id);
    const sinMarca = ultima ? Math.floor(Fechas.diasEntre(ultima.fecha, HOY) / 7) : 0;
    // Si bajó (TuSesion.bajadaDeFuerza), es lo que se dice: no va además como estancado.
    const deLaBajada = puntosDeLaBajada(e);
    const b = TuSesion.bajadaDeFuerza(deLaBajada);
    let bajo = null;
    let estancado = null;
    if (b && musculo) {
      const n = TuSesion.SESIONES_DE_ANTES + TuSesion.SESIONES_RECIENTES;
      const ultimos = [...deLaBajada].sort((x, y) => (x.fecha < y.fecha ? -1 : 1)).slice(-n);
      const reps = (xs) => xs.map((p) => p.reps).filter((x) => x !== null);
      bajo = Object.assign({
        b, ultimos,
        rango: b.cambioDeRango ? { a: mediana(reps(ultimos.slice(0, TuSesion.SESIONES_DE_ANTES))), b: mediana(reps(ultimos.slice(TuSesion.SESIONES_DE_ANTES))) } : null,
      }, razonesDe(e, musculo, TuSesion.semanasDeLaBajada(b, HOY), null));
    } else if (ultima && musculo && ProgresoCompartido.estaEstancado(t, sinMarca, A.umbral)) {
      const anios = ANIOS[Datos.PERFIL.experiencia];
      estancado = razonesDe(e, musculo, Estancados.semanasParaLasRazones(ultima.fecha, HOY), anios != null ? anios : null);
    }
    return { e, t, puntos, musculo, ultima, sinMarca, bajo, estancado, estado: bajo ? 'bajo' : t.estado };
  });

  // ---- las metas (calcularTodo, con «Cómo llegar» de ProgresoCompartido.comoLlegar)
  const ultimas4 = [4, 3, 2, 1].map((i) => Fechas.sumarDias(lunesHoy, -7 * i));
  const suenoReciente = promedioDe3(noches.filter((n) => n.clave >= Fechas.sumarDias(lunesHoy, -7) && n.clave <= HOY).map((n) => n.dormido));
  const metas = (d.desde ? [{ id: 'press_banca', kilos: 100, reps: 1 }] : A.metas).map((meta) => {
    const e = { id: meta.id, ejercicio: meta.id };
    const { t } = tendenciaDe(e);
    const m = Musculos.musculosDe(e);
    const musculo = m ? m.principal[0] : null;
    const nivelObjetivo = PuntajeMuscular.e1rm(meta.kilos, meta.reps);
    const objetivoKg = nivelObjetivo != null ? nivelObjetivo : meta.kilos;
    const proyeccion = ProgresoCompartido.proyeccionDeMeta(t, objetivoKg);
    // Con menos de 3 sesiones no hay nada que juzgar todavía: «Cómo llegar» espera.
    const pasos = t.sesiones < 3 ? [] : ProgresoCompartido.comoLlegar({
      tendencia: t,
      semanas: musculo ? ultimas4.filter(conSesion(hastaAhi)).map((l) => Estancados.semanaDeEntreno(hastaAhi, l, e, musculo)) : [],
      comida: ultimas4.map((l) => moss(l).comida), pesoKg, sueno: suenoReciente, necesidad: NECESIDAD,
    }).filter((x) => x.que !== 'series' || musculo);
    // Ya entrenado hoy, cuándo llegabas esta mañana: si la sesión de hoy lo movió, se puede decir.
    const estaManana = hasta === HOY ? null : ProgresoCompartido.proyeccionDeMeta(ProgresoCompartido.tendenciaDeFuerza(Estancados.puntosDelEjercicio(pasadas, e, HOY), { hoy: 0, entrenado }), objetivoKg);
    return Object.assign({ meta, e, t, musculo, objetivoKg, proyeccion, estaManana, pasos, falta: proyeccion.estado === 'noSeSabe' ? loQueFalta(t) : null }, proximaDe(e));
  });

  // ---- tu año: cada día entrenado con su grupo y sus marcas; la última marca de cada ejercicio
  const anio = HOY.slice(0, 4);
  const conMarca = new Set([...A.anioDias.filter((x) => x.marca).map((x) => x.fecha), ...marcas.map((x) => x.fecha)]);
  const diasDelAnio = d.desde ? [] : A.anioDias.filter((x) => x.grupo && x.fecha < A.desde).map((x) => ({ fecha: x.fecha, grupo: x.grupo, marca: x.marca }));
  const yaEsta = new Set(diasDelAnio.map((x) => x.fecha));
  sesiones.filter((s) => s.fecha.startsWith(anio) && s.inicio <= ahora).forEach((s) => {
    if (yaEsta.has(s.fecha)) return;
    yaEsta.add(s.fecha);
    diasDelAnio.push({ fecha: s.fecha, grupo: ProgresoCompartido.grupoDelAnio(gruposDe(s.bloques.map((b) => ({ id: b.id, series: b.series.length })))), marca: !d.desde && conMarca.has(s.fecha) });
  });
  const porEjercicio = new Map();
  marcas.forEach((x) => { if (!porEjercicio.has(x.id) || porEjercicio.get(x.id).fecha < x.fecha) porEjercicio.set(x.id, x); });
  const DESTACADOS = ['piernas', 'pecho', 'espalda'];
  const lugar = (x) => (x.destacada ? DESTACADOS.indexOf(x.de) : DESTACADOS.length);
  const ultimasMarcas = [...porEjercicio.values()].map((x) => {
    const de = Musculos.grupoDelEjercicio({ id: x.id }) || null;
    return Object.assign({}, x, { de, grupo: de ? ProgresoCompartido.grupoDelAnio([de]) : null, destacada: !!de && DESTACADOS.includes(de) });
  }).sort((a, b) => lugar(a) - lugar(b) || (a.fecha < b.fecha ? 1 : -1));

  // ---- cómo fue la sesión de hoy, ya hecha (TuSesion.comoFueLaSesion)
  let comoFue = null;
  if (sesion && sesion.estado === 'hecha') {
    comoFue = TuSesion.comoFueLaSesion({ sesion: { bloques: sesion.bloques }, antes: sesiones.filter((s) => s.inicio < hechasHoy[0].inicio), nocheCorta: !!noche && noche.dormido <= Rendimiento.NOCHE_CORTA });
  }

  return {
    d, sesion, siguiente, noche, nocheCorta, musculos, musculosHoy, deLaSesion, f, titular, aviso,
    ejercicios, enLaSesion, sugerencias, nota, semana, fuerza, metas, comoFue, pesoKg,
    anio: { dias: diasDelAnio, ultimas: ultimasMarcas },
    entrenamientos: new Set(sesiones.filter((s) => s.inicio <= ahora).map((s) => s.fecha)).size,
  };
}
const CUENTAS = new Map();
const cuentasDe = (nombre) => {
  if (!CUENTAS.has(nombre)) CUENTAS.set(nombre, calcular(nombre));
  return CUENTAS.get(nombre);
};

// ------------------------------------------------------------ en palabras, en el idioma de ahora (no se guarda)
// Los músculos, en el orden de la sección: los que se ven de frente y los de espalda (Vinculada.tsx).
const DEL_FRENTE = ['pecho', 'hombros', 'biceps', 'antebrazos', 'abdomen', 'cuadriceps', 'aductores'];
const DE_ESPALDA = ['trapecio', 'dorsales', 'triceps', 'espaldaBaja', 'gluteos', 'isquios', 'pantorrillas'];
const TOPE_DE_SERIES = 30;
/** «+6 %» o, en inglés, «+6%». */
const porCiento = (texto) => (G.idioma === 'en' ? `${texto}%` : `${texto} %`);
const cuandoDe = (x) => tx('ascent.titular.cuando.' + x);
const ORDEN_DE_CUANDO = ['ya', 'hoy', 'manana', 'pasadoManana', 'enUnosDias'];
const cuandoTodos = (xs) => xs.reduce((a, x) => (ORDEN_DE_CUANDO.indexOf(x.cuando) > ORDEN_DE_CUANDO.indexOf(a) ? x.cuando : a), 'ya');
const deADosYMedioAbajo = (kg) => Math.floor(kg / 2.5 + 1e-9) * 2.5;
const unDecimalAbajo = (n) => {
  const v = Math.floor(n * 10 + 1e-9) / 10;
  return numero(v, Math.round(v * 10) % 10 ? 1 : 0);
};
/** «el viernes» o «mañana»: el día en que algo está listo. */
const elDia = (fecha) => (Fechas.diasEntre(HOY, fecha) === 1 ? cuandoDe('manana') : mi('cuando.dia', { dia: nombreDelDia(fecha) }));
/** Unas series como se leen: «4 × 105 kg × 5»; si las repeticiones cambian, «180 kg × 10, 8, 5». */
function seriesEnPalabras(series) {
  if (!series.length) return '';
  const peso = series[0].peso;
  const reps = series.map((s) => (s.reps == null ? '–' : s.reps));
  const iguales = series.every((s) => s.peso === peso && s.reps === series[0].reps);
  if (iguales) return peso > 0 ? mi('sesion.seriesIguales', { n: series.length, peso: kilos(peso), reps: reps[0] }) : mi('sesion.seriesDelCuerpo', { n: series.length, reps: reps[0] });
  return peso > 0 ? `${kilos(peso)} × ${reps.join(', ')}` : reps.join(', ');
}

/** El titular y su frase, como la app (palabras.ts, textosDelTitular). */
function titularEnPalabras(c, sesion) {
  const que = c.titular.que;
  const musculos = listaDeMusculos(c.musculosHoy);
  if (que === 'hecha') {
    const cuando = cuandoTodos(c.f);
    return [tx('ascent.titular.hecha.titulo', { sesion }), cuando === 'ya' ? tx('ascent.titular.hecha.yaListos') : tx('ascent.titular.hecha.texto', { musculos, cuando: cuandoDe(cuando) })];
  }
  if (que === 'descanso' || que === 'sinHorario') {
    const falta = c.f.filter((x) => x.estado !== 'recuperado').sort((a, b) => b.dias - a.dias)[0];
    return [tx(`ascent.titular.${que}.titulo`), falta ? tx('ascent.titular.descanso.texto', { musculo: nombreDelMusculo(falta.musculo).toLowerCase(), cuando: cuandoDe(falta.cuando) }) : tx('ascent.titular.descanso.listos')];
  }
  if (que === 'faltaNoche') return [tx('ascent.titular.faltaNoche.titulo'), tx('ascent.titular.faltaNoche.texto', { sesion })];
  const faltan = c.f.filter((x) => x.estado !== 'recuperado');
  const deFaltan = faltan.length ? listaDeMusculos(faltan.map((x) => x.musculo)) : musculos;
  if (que === 'cargado') return [tx('ascent.titular.cargado.titulo'), tx('ascent.titular.cargado.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
  if (que === 'suenoCorto') {
    const estado = Rendimiento.estadoDeLaNoche(c.noche);
    const porque = estado === 'corta' || estado === 'muyCorta' ? ((c.noche.despertoAntes || 0) >= 60 && c.noche.dormido > 360 ? 'temprano' : 'poco') : 'seguidas';
    return [tx('ascent.titular.suenoCorto.titulo'), tx('ascent.titular.suenoCorto.' + porque)];
  }
  if (que === 'teSientes') return [tx('ascent.titular.teSientes.titulo'), tx('ascent.titular.teSientes.texto')];
  if (que === 'casi') return [tx('ascent.titular.casi.titulo'), tx('ascent.titular.casi.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
  return [tx('ascent.titular.listo.titulo', { sesion }), tx('ascent.titular.listo.texto')];
}

/** Un ejercicio con su decisión para la próxima vez, como FilaDelEjercicio de la app, y lo mismo en corto. */
function ejercicioEnPalabras(x) {
  const p = x.proxima;
  const primera = x.veces === 0;
  const siguiente = PuntajeMuscular.pesoSiguiente(x.peso);
  const peso = x.peso > 0 ? kilos(x.peso) : tx('ascent.tus.mismoPeso');
  const decision = primera ? 'primera' : p.decision === 'subir' ? 'sube' : p.decision === 'noSeSabe' ? 'noSeSabe' : 'igual';
  const razon = primera ? 'primera' : p.decision === 'subir' ? 'subir' : p.razon;
  const proxima = primera ? mi('sesion.primera')
    : p.decision === 'subir' ? (siguiente === null ? tx('ascent.tus.proxima.subirSinPeso') : tx('ascent.tus.proxima.subirA', { kg: u.peso(siguiente) }))
    : p.decision === 'noSeSabe' ? tx('ascent.tus.proxima.pocasSesiones', { peso })
    : tx('ascent.tus.proxima.' + p.razon, { tope: x.tope != null ? x.tope : '', peso });
  return {
    id: x.e.id, nombre: nombreDelEjercicio(x.e), principal: x.principal.slice(), ayudan: x.ayudan.slice(),
    decision, razon, flecha: decision === 'sube' ? '↑' : decision === 'igual' ? '=' : '',
    proxima, motivo: mi('sesion.motivo.' + razon, { tope: x.tope != null ? x.tope : '' }),
    corto: decision === 'sube' ? (siguiente === null ? mi('sesion.corto.subeSinPeso') : mi('sesion.corto.sube', { kg: u.peso(siguiente) })) : x.peso > 0 ? kilos(x.peso) : primera ? '' : mi('sesion.corto.mismoPeso'),
    peso: x.peso, pesoTexto: x.peso > 0 ? kilos(x.peso) : '',
    sube: decision === 'sube' ? siguiente : null, subeTexto: decision === 'sube' && siguiente !== null ? kilos(siguiente) : '',
    tope: x.tope,
    ultima: x.ultima ? { fecha: x.ultima.fecha, cuando: cuandoFue(x.ultima.fecha), series: seriesEnPalabras(x.ultima.series), texto: mi('sesion.ultima', { cuando: conMayuscula(cuandoFue(x.ultima.fecha)), series: seriesEnPalabras(x.ultima.series) }) } : null,
  };
}

/** Cómo fue la sesión de hoy, con las palabras de la galería (ascent.sesion.*, para aprobar desde el 26/11). */
function comoFueEnPalabras(cf, sesion, noche) {
  const bloqueDe = (nombre) => sesion.bloques.find((b) => b.ejercicio === nombre);
  const nombreEn = (nombre) => { const b = bloqueDe(nombre); return b ? nombreDelEjercicio(b) : nombre; };
  const conElMismoPeso = (b) => {
    const series = b.series.filter((x) => x.peso > 0 && x.reps !== null && x.reps >= 1);
    return series.length ? series.filter((x) => Math.abs(x.peso - series[0].peso) <= TuSesion.MISMO_PESO * series[0].peso) : [];
  };
  const mitades = (n) => numero(Math.round(n * 2) / 2, n % 1 ? 1 : 0);
  let porque;
  let implica;
  if (cf.nota === 'dura') {
    const f = cf.fallo[0];
    if (f) {
      const nombre = enFrase(nombreEn(f.ejercicio));
      const s = conElMismoPeso(bloqueDe(f.ejercicio));
      porque = f.caida === null || f.caida < TuSesion.CAIDA_CERCA_DEL_FALLO ? tx('ascent.sesion.porque.alFallo', { ejercicio: nombre, n: f.alFallo }) : tx('ascent.sesion.porque.fallo', { ejercicio: nombre, a: s[0].reps, b: s[s.length - 1].reps });
      const musculos = [...new Set(cf.fallo.flatMap((y) => { const b = bloqueDe(y.ejercicio); const m = b && Musculos.musculosDe(b); return m ? m.principal : []; }))];
      implica = tx('ascent.sesion.implica.fallo', { musculos: listaDeMusculos(musculos) });
    } else {
      const v = cf.volumen[0];
      porque = tx('ascent.sesion.porque.volumen', { n: mitades(v.series), musculo: nombreDelMusculo(v.musculo).toLowerCase() });
      implica = tx('ascent.sesion.implica.volumen');
    }
  } else if (cf.nota === 'floja') {
    const n = cf.rendimiento.filter((r) => r.como === 'abajo').length;
    porque = n === cf.rendimiento.length ? tx('ascent.sesion.porque.flojaTodo') : tx('ascent.sesion.porque.floja', { n, de: cf.rendimiento.length });
    implica = cf.nocheCorta && noche ? tx('ascent.sesion.implica.flojaCorta', { horas: horasDe(noche.dormido) }) : tx('ascent.sesion.implica.floja');
  } else if (cf.nota === 'buena') {
    porque = tx('ascent.sesion.porque.buena', { ejercicios: enLista(cf.rendimiento.filter((r) => r.como === 'arriba').map((r) => enFrase(nombreEn(r.ejercicio)))) });
    implica = tx('ascent.sesion.implica.buena');
  } else {
    porque = tx(cf.rendimiento.length ? 'ascent.sesion.porque.comoSiempre' : 'ascent.sesion.porque.comoSiempreSinComparar');
    implica = tx('ascent.sesion.implica.comoSiempre');
  }
  return {
    titulo: tx('ascent.sesion.titulo'), nota: cf.nota, palabra: tx('ascent.sesion.palabras.' + cf.nota), porque, implica,
    contraLoTuyo: tx('ascent.sesion.contraLoTuyo'), franja: tx('ascent.sesion.franja'),
    rendimiento: cf.rendimiento.map((r) => ({ nombre: nombreEn(r.ejercicio), diferencia: r.diferencia, texto: porCiento(u.conSigno(Math.round(r.diferencia), 0)), como: r.como })),
    caidas: cf.fallo.flatMap((y) => {
      const s = conElMismoPeso(bloqueDe(y.ejercicio));
      return s.length < 2 ? [] : [{ nombre: nombreEn(y.ejercicio), etiqueta: tx('ascent.sesion.reps', { kg: u.peso(s[0].peso) }), reps: s.map((x) => x.reps) }];
    }),
    volumen: cf.volumen.map((v) => ({ musculo: v.musculo, nombre: nombreDelMusculo(v.musculo), series: v.series, texto: tx('ascent.sesion.seriesHoy', { n: mitades(v.series) }) })),
    comoSeCalcula: { titulo: tx('ascent.sesion.comoSeCalcula'), parrafos: tx('ascent.sesion.calculo') },
  };
}

/** El aviso de fatiga: el hecho primero, después la estimación y por último qué hacer. */
function avisoEnPalabras(c, sesion) {
  const a = c.aviso;
  if (!a) return null;
  const forma = a.musculos.length > 1 ? 2 : 1;
  const musculos = conMayuscula(listaDeMusculos(a.musculos));
  const dias = a.ultima ? Fechas.diasEntre(a.ultima.fecha, HOY) : null;
  const cuando = a.ultima ? cuandoFue(a.ultima.fecha) : '';
  const series = a.ultima ? miPlural('aviso.series', a.ultima.series) + (a.ultima.alFallo ? `, ${tx('ascent.tus.alFallo', { n: a.ultima.alFallo })}` : '') : '';
  const estimacion = miPlural('aviso.estimacion', a.dias);
  const queHacerCorto = mi('aviso.queHacerCorto.' + a.nivel);
  const titulo = mi('aviso.titulo.' + a.nivel, { sesion: enFrase(sesion) });
  return {
    nivel: a.nivel, pide: a.nivel === 'cargado',
    musculos: a.musculos.slice(), musculosTexto: musculos, tambien: a.tambien.slice(),
    titulo, etiqueta: miPlural('aviso.etiqueta.' + a.nivel, forma),
    cuando, series: a.ultima ? a.ultima.series : 0, alFallo: a.ultima ? a.ultima.alFallo : 0,
    hecho: a.ultima ? miPlural('aviso.hecho', forma, { cuando, series }) : '',
    estimacion, dias: a.dias, total: a.total, fase: faseDe(a.dias, a.total), paso: FASES.indexOf(faseDe(a.dias, a.total)),
    listo: mi('fatiga.listo', { cuando: elDia(a.listo) }),
    queHacer: mi('aviso.queHacer.' + a.nivel), queHacerCorto,
    corto: `${musculos}, ${dias === 0 ? mi('desde.hoy') : dias === 1 ? mi('desde.ayer') : mi('desde.dia', { dia: nombreDelDia(a.ultima.fecha) })}`,
    linea: `${musculos}: ${a.ultima ? miPlural('aviso.hechoCorto', forma, { cuando, series }) + '. ' : ''}${estimacion} ${queHacerCorto}`,
    sinRir: a.sinRir ? mi('fatiga.sinRir') : null,
    notificacion: { titulo, texto: miPlural('aviso.notificacion.' + a.nivel, forma, { musculos }) },
    respuestas: propio('aviso.respuestas').slice(),
  };
}

/** Las sugerencias de hoy, con los textos de la app (ParaHoy, en Vinculada.tsx). */
function sugerenciasEnPalabras(c, sesion) {
  const lista = (ms) => (ms && ms.length ? listaDeMusculos(ms) : (sesion || '').toLowerCase());
  const claveDe = (x) => (x.clave === 'conFatiga' && (x.fatigados || []).length > 1 ? 'conFatigaVarios' : x.clave);
  return [['entreno', c.sugerencias.entreno], ['comida', c.sugerencias.comida], ['sueno', c.sugerencias.sueno]].filter((x) => x[1]).map(([tipo, x]) => {
    const macros = enLista((x.macros || []).map((k) => tx('comida.' + k).toLowerCase()));
    const hora = x.hora === undefined ? '' : horaMin(x.hora);
    const horas = x.minutos === undefined ? '' : duracion(x.minutos);
    return {
      tipo, titulo: tx('ascent.sugerencias.tipos.' + tipo), clave: x.clave,
      texto: tx(`ascent.sugerencias.${tipo}.${claveDe(x)}`, {
        musculos: lista(x.musculos), fatigados: conMayuscula(lista(x.fatigados)), repsDe: x.reps ? x.reps[0] : '', repsA: x.reps ? x.reps[1] : '',
        reservaDe: x.reserva ? x.reserva[0] : '', reservaA: x.reserva ? x.reserva[1] : '', hora, macros, horas,
      }),
      // Lo mismo, suelto, para una línea chica: «proteína» y «22:35».
      macros, hora, horas,
      enlace: tipo === 'sueno' ? tx('ascent.sugerencias.masEnSueno') : null,
    };
  });
}

/** Una razón (razonesDeEstancamiento) con su título, su valor y su frase, como la app (RazonVista). */
function razonEnPalabras(x, e) {
  const musculo = nombreDelMusculo(e.musculo).toLowerCase();
  if (x.que === 'series') {
    const vars = { antes: unDecimal(x.antes), ahora: unDecimal(x.ahora) };
    return { que: x.que, titulo: tx('ascent.estancados.series.titulo', { musculo }), valor: `${vars.antes} → ${vars.ahora}`, texto: tx('ascent.estancados.series.texto'), etiqueta: tx('ascent.estancados.series.etiqueta', vars), semanas: { antes: e.antes.map((s) => s.series), ahora: e.ahora.map((s) => s.series) } };
  }
  if (x.que === 'frecuencia') {
    const vars = { antes: unDecimal(x.antes), ahora: unDecimal(x.ahora) };
    return { que: x.que, titulo: tx('ascent.estancados.frecuencia.titulo'), valor: `${vars.antes} → ${vars.ahora}`, texto: tx('ascent.estancados.frecuencia.texto', vars) };
  }
  if (x.que === 'pesadas') return { que: x.que, titulo: tx('ascent.estancados.pesadas.titulo'), valor: `${x.pesadas} / ${x.de}`, texto: tx('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de }), parte: x.pesadas / x.de, raya: { en: ProgresoCompartido.POCAS_PESADAS, texto: tx('ascent.estancados.pesadas.raya') } };
  if (x.que === 'bajando') return { que: x.que, titulo: tx('ascent.estancados.bajando.titulo'), valor: tx('ascent.estancados.bajando.valor', { n: numero(x.porSemana, 1) }), texto: tx('ascent.estancados.bajando.texto') };
  if (x.que === 'definicion') return { que: x.que, titulo: tx('ascent.estancados.definicion.titulo'), valor: '', texto: tx('ascent.estancados.definicion.texto') };
  if (x.que === 'proteina') return { que: x.que, titulo: tx('ascent.estancados.proteina.titulo'), valor: tx('ascent.filas.comida.valor', { g: numero(x.gPorKg, 1) }), texto: tx('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) }), parte: x.gPorKg / 2.6, raya: { en: ProgresoCompartido.PROTEINA_POR_KG / 2.6, texto: tx('ascent.filas.comida.raya') } };
  return { que: x.que, titulo: tx('ascent.estancados.sueno.titulo'), valor: horasDe(x.ahora), texto: x.antes !== null ? tx('ascent.estancados.sueno.texto', { ahora: horasDe(x.ahora), antes: horasDe(x.antes) }) : tx('ascent.estancados.sueno.sinAntes', { ahora: horasDe(x.ahora) }) };
}
/** Qué cambiar, una acción por razón (los textos de «Por qué bajaste» de la galería valen también para lo estancado). */
function queCambiarEnPalabras(razones, e, c, extra) {
  const acciones = [];
  const medias = (n) => numero(Math.round(n * 2) / 2, Math.round(n * 2) % 2 ? 1 : 0);
  if (extra && extra.pausa) acciones.push(tx('ascent.bajo.hacer.pausa'));
  if (extra && extra.rango) acciones.push(tx('ascent.bajo.hacer.rango'));
  razones.forEach((r) => {
    if (r.que === 'series') acciones.push(tx('ascent.bajo.hacer.series', { n: numero(Math.round(r.antes)), musculo: nombreDelMusculo(e.musculo).toLowerCase() }));
    else if (r.que === 'frecuencia') acciones.push(tx('ascent.bajo.hacer.frecuencia', { n: medias(r.antes) }));
    else if (r.que === 'proteina') acciones.push(tx('ascent.bajo.hacer.proteina', { g: numero(Math.round((ProgresoCompartido.PROTEINA_POR_KG * c.pesoKg) / 5) * 5) }));
    else if (r.que === 'sueno') acciones.push(tx('ascent.bajo.hacer.sueno', { horas: duracion(NECESIDAD) }));
    else acciones.push(tx('ascent.bajo.hacer.' + r.que));
  });
  if (!acciones.length) acciones.push(tx('ascent.bajo.hacer.sinRazon'));
  return acciones;
}
/**
 * Antes y ahora, lado a lado: las series del músculo, las veces, los días dentro de las calorías, la proteína y el sueño.
 * `cambio` es solo la dirección; `marcada`, que la cuenta lo da como razón (una diferencia chica puede ser azar).
 */
function comparaEnPalabras(x, e, deBajada, razones) {
  const RAZON = { series: 'series', veces: 'frecuencia', proteina: 'proteina', sueno: 'sueno' };
  const fila = (que, nombre, a, b, texto) => {
    const antes = a == null ? null : texto(a);
    const ahora = b == null ? null : texto(b);
    return { que, nombre, antes, ahora, cambio: antes === null || ahora === null ? null : antes === ahora ? 'igual' : b < a ? 'baja' : 'sube', marcada: !!RAZON[que] && razones.includes(RAZON[que]) };
  };
  return {
    antes: deBajada ? mi('compara.antes') : tx('ascent.estancados.leyenda.antes'), ahora: tx('ascent.estancados.leyenda.ahora'), sinDatos: mi('compara.sinDatos'),
    filas: [
      fila('series', conMayuscula(mi('compara.series', { musculo: nombreDelMusculo(e.musculo).toLowerCase() })), x.antes.series, x.ahora.series, unDecimal),
      fila('veces', mi('compara.veces'), x.antes.veces, x.ahora.veces, unDecimal),
      fila('comida', mi('compara.comida'), x.antes.dentro, x.ahora.dentro, (n) => mi('compara.de7', { n: Math.round(n) })),
      fila('proteina', mi('compara.proteina'), x.antes.gPorKg, x.ahora.gPorKg, (n) => tx('ascent.filas.comida.valor', { g: numero(n, 1) })),
      fila('sueno', mi('compara.sueno'), x.antes.sueno, x.ahora.sueno, horasDe),
    ],
  };
}

/** «Llegas entre febrero y abril de 2027» (como la galería); en corto, «febrero a abril de 2027», y sin el año si no entra. */
function cuandoLlegas(p, corto, sinAnio) {
  const anio = Number(HOY.slice(0, 4));
  const mesEn = (semanas) => { const x = u.partes(Fechas.sumarDias(HOY, semanas * 7)); return { mes: tx('fecha.meses.' + x.mes), anio: x.anio }; };
  const con = (x) => (sinAnio || x.anio === anio ? x.mes : tx('ascent.metas.llegas.delAnio', { mes: x.mes, anio: x.anio }));
  const de = mesEn(p.semanas[0]);
  if (p.semanas[1] === null) return corto ? mi('metas.ventana.desde', { mes: con(de) }) : tx('ascent.metas.llegas.desde', { mes: con(de) });
  const a = mesEn(p.semanas[1]);
  if (de.mes === a.mes && de.anio === a.anio) return corto ? con(de) : tx('ascent.metas.llegas.en', { mes: con(de) });
  const vars = { de: de.anio === a.anio || de.anio === anio ? de.mes : con(de), a: con(a) };
  return corto ? mi('metas.ventana.entre', vars) : tx('ascent.metas.llegas.entre', vars);
}
/** Una meta de fuerza: lo de hoy, cuándo llegas, cómo llegar y la próxima vez (filaDeMeta de la galería, la A de Ascent). */
function metaEnPalabras(x, c) {
  const p = x.proyeccion;
  const L = 'ascent.metas.llegar.';
  const nombre = nombreDelEjercicio(x.e);
  const kg = u.peso(x.meta.kilos);
  // Lo de hoy con las repeticiones de la meta (Epley al revés), para abajo de a 2,5 kg, como se carga en la barra.
  const nivelKg = x.t.nivel === null ? null : deADosYMedioAbajo(x.meta.reps === 1 ? x.t.nivel : x.t.nivel / (1 + x.meta.reps / 30));
  const hoy = nivelKg === null ? null : tx('ascent.metas.levantarias', { kg: u.peso(nivelKg) });
  const llegas = p.estado === 'enCamino' ? cuandoLlegas(p, false) : null;
  const textoDelPaso = (s) => {
    if (s.que === 'ritmo') {
      if (s.estado === 'bien') return tx(L + 'ritmo.bien', { kg: unDecimalAbajo(Math.max(0.1, s.kgPorSemana)) });
      if (s.estado === 'mejorar') return tx(L + 'ritmo.mejorar');
      if (x.t.sesiones < ProgresoCompartido.SESIONES_MINIMAS) return u.plural(L + 'ritmo.faltanSesiones', ProgresoCompartido.SESIONES_MINIMAS - x.t.sesiones);
      if (x.t.semanas < ProgresoCompartido.SEMANAS_MINIMAS_DE_HISTORIA) return tx(L + 'ritmo.faltanSemanas', { n: Math.floor(x.t.semanas) });
      return tx(L + 'ritmo.noSeSabe');
    }
    if (s.que === 'series' || s.que === 'veces') {
      const vars = { musculo: x.musculo ? nombreDelMusculo(x.musculo).toLowerCase() : '', ejercicio: nombre, a: numero(s.apunta) };
      if (s.porSemana === null) return tx(L + s.que + '.noSeSabe', vars);
      vars.n = unDecimalAbajo(s.porSemana);
      if (s.que === 'series') return tx(L + 'series.' + s.estado, vars);
      return conVariables(tx(L + 'veces.' + s.estado)[Math.floor(s.porSemana * 10 + 1e-9) === 10 ? 'uno' : 'otros'], vars);
    }
    if (s.que === 'sueno') return s.promedio === null ? tx(L + 'sueno.noSeSabe') : tx(L + 'sueno.' + s.estado, { h: horasDe(s.promedio) });
    return s.gPorKg === null ? tx(L + 'proteina.noSeSabe') : tx(L + 'proteina.' + s.estado, { g: unDecimalAbajo(s.gPorKg), a: numero(s.apunta, 1) });
  };
  const siguiente = PuntajeMuscular.pesoSiguiente(x.peso);
  const proxima = x.proxima.decision === 'noSeSabe' ? null
    : x.proxima.decision === 'subir' ? (siguiente === null ? tx('ascent.tus.proxima.subirSinPeso') : tx('ascent.tus.proxima.subirA', { kg: u.peso(siguiente) }))
    : x.proxima.razon === 'faltaElTope' && x.peso > 0 ? tx('ascent.metas.proxima', { kg: u.peso(x.peso), reps: x.tope })
    : tx('ascent.tus.proxima.' + x.proxima.razon, { peso: x.peso > 0 ? kilos(x.peso) : tx('ascent.tus.mismoPeso'), tope: x.tope != null ? x.tope : '' });
  const ventana = p.estado === 'enCamino' ? cuandoLlegas(p, true) : null;
  const deEstaManana = x.estaManana && x.estaManana.estado === 'enCamino' ? cuandoLlegas(x.estaManana, true) : null;
  return {
    id: x.meta.id, nombre, kilos: x.meta.kilos, reps: x.meta.reps,
    objetivo: x.meta.reps === 1 ? tx('ascent.metas.objetivoUna', { kg }) : tx('ascent.metas.objetivoVarias', { kg, reps: x.meta.reps }),
    estado: p.estado, realista: p.estado === 'enCamino' ? p.realista : null,
    avance: x.t.nivel === null ? null : Math.min(1, x.t.nivel / x.objetivoKg), nivelKg,
    hoy, llegas, ventana, ventanaCorta: p.estado === 'enCamino' ? cuandoLlegas(p, true, true) : null, semanas: p.estado === 'enCamino' ? p.semanas.slice() : null,
    linea: p.estado === 'enCamino' ? [hoy, llegas].filter(Boolean).join(' · ') : hoy,
    // Lo que se dice si no hay cuándo: que así no llega, que ya llegó o lo que falta de verdad para saberlo.
    estadoTexto: p.estado === 'enCamino' ? (p.realista ? null : tx('ascent.metas.lejana')) : p.estado === 'noSeSabe' ? null : tx('ascent.metas.' + p.estado),
    falta: x.falta ? u.plural(x.falta.que === 'sesiones' ? 'ascent.metas.faltanSesiones' : 'ascent.metas.faltanSemanas', x.falta.n) : null,
    llevas: !x.falta ? null : x.t.sesiones < ProgresoCompartido.SESIONES_MINIMAS ? mi('metas.llevasSesiones', { n: x.t.sesiones }) : mi('metas.llevasSemanas', { n: Math.floor(x.t.semanas) }),
    // Ya entrenado hoy: si la sesión movió la fecha, cuándo llegabas esta mañana (para un aviso); si no, null.
    antes: deEstaManana && ventana && deEstaManana !== ventana ? deEstaManana : null,
    comoLlegar: tx(L + 'titulo'),
    pasos: x.pasos.map((s) => ({ que: s.que, estado: s.estado, marca: s.estado === 'bien' ? '✓' : s.estado === 'mejorar' ? '↑' : '', etiqueta: tx(L + 'marcas.' + s.estado), texto: textoDelPaso(s) })),
    proxima,
  };
}

/** El modelo de un día de ejemplo, ya en palabras (la forma, en el comentario de arriba del archivo). */
function dia(nombre) {
  if (!DIAS[nombre]) throw new Error(`AscentDeMentira: no hay un día «${nombre}» (${Object.keys(DIAS).join(', ')})`);
  const c = cuentasDe(nombre);
  const nueva = !!c.d.desde;
  const sesionDeHoy = c.sesion ? nombreDeSesion(c.sesion.grupos) : '';
  const [titulo, texto] = titularEnPalabras(c, enFrase(sesionDeHoy));
  const marcaEnPalabras = (x) => tx('ascent.estancamiento.marca', { kg: u.peso(x.peso), reps: x.reps });

  // ---- lo que sigue en la rutina
  const siguiente = c.siguiente ? (() => {
    const s = nombreDeSesion(c.siguiente.grupos);
    return {
      fecha: c.siguiente.fecha, dias: c.siguiente.dias, nombre: s, hora: horaMin(c.siguiente.hora), cuando: elDia(c.siguiente.fecha),
      linea: c.siguiente.dias === 1 ? mi('siguiente.manana', { sesion: s }) : mi('siguiente.dia', { dia: nombreDelDia(c.siguiente.fecha), sesion: s }),
      musculos: c.siguiente.musculos.slice(), musculosTexto: listaDeMusculos(c.siguiente.musculos),
    };
  })() : null;

  // ---- hoy: el titular y la entrada de Progreso
  const hoy = {
    que: c.titular.que, limita: c.titular.limita,
    corto: tx('ascent.entrada.titular.' + c.titular.que), titulo, texto,
    linea: !c.sesion ? (siguiente ? siguiente.linea : tx('ascent.entrada.descanso'))
      : c.sesion.estado === 'hecha' ? tx('ascent.senal.hoy', { sesion: enFrase(sesionDeHoy) })
      : tx('ascent.entrada.sesion', { sesion: sesionDeHoy, hora: horaMin(c.sesion.inicio) }),
    noche: c.noche ? (() => {
      const estado = Rendimiento.estadoDeLaNoche(c.noche);
      return { minutos: c.noche.dormido, texto: duracion(c.noche.dormido), estado, palabra: tx('ascent.noche.' + estado), corta: c.nocheCorta, frase: tx('ascent.filas.sueno.de', { horas: duracion(c.noche.dormido), necesidad: duracion(NECESIDAD) }) };
    })() : null,
  };

  // ---- la sesión de hoy, con la decisión de cada ejercicio
  const deHoy = c.enLaSesion.map((x) => {
    const reps = x.tope != null ? x.tope : x.series[0] ? x.series[0].reps : null;
    return Object.assign(ejercicioEnPalabras(x), {
      series: x.series.length,
      plan: reps != null ? mi('sesion.plan', { series: x.series.length, reps }) : miPlural('sesion.planSinReps', x.series.length),
      hecho: c.sesion.estado === 'hecha' ? seriesEnPalabras(x.series) : null,
    });
  });
  const cuantos = (k) => deHoy.filter((x) => (k === 'sinSaber' ? x.decision === 'primera' || x.decision === 'noSeSabe' : x.decision === k)).length;
  const sesion = c.sesion ? {
    estado: c.sesion.estado, nombre: sesionDeHoy, hora: horaMin(c.sesion.inicio), minutos: c.sesion.minutos, duracion: duracion(c.sesion.minutos),
    musculos: c.deLaSesion.slice(), musculosTexto: listaDeMusculos(c.deLaSesion),
    ejercicios: deHoy, suben: cuantos('sube'), igual: cuantos('igual'), sinSaber: cuantos('sinSaber'),
    resumen: [['suben', cuantos('sube')], ['igual', cuantos('igual')], ['sinSaber', cuantos('sinSaber')]].filter((x) => x[1]).map(([k, n]) => miPlural('sesion.' + k, n)).join(', '),
    flechas: deHoy.map((x) => x.flecha || '·').join(' '),
    comoFue: c.comoFue ? comoFueEnPalabras(c.comoFue, c.sesion, c.noche) : null,
  } : null;

  // ---- los 14 músculos: la semana, la fatiga y sus ejercicios
  const filaDelMusculo = (id) => {
    const x = c.musculos.find((y) => y.musculo === id);
    const estado = nueva ? (x.series > 0 ? 'entrenado' : 'sinEntrenar') : x.estado;
    const estadoTexto = estado === 'entrenado' ? mi('semana.entrenado') : tx('ascent.tus.estados.' + estado);
    const fuerte = (e) => e.principal.includes(id);
    const suyos = c.ejercicios.filter((e) => fuerte(e) || e.ayudan.includes(id)).sort((a, b) => Number(fuerte(b)) - Number(fuerte(a)));
    const parte = id === 'pecho' ? 'pechoAlto' : id === 'triceps' ? 'tricepsLarga' : null;
    const enParte = parte ? x.partes[parte] || 0 : 0;
    return {
      id, nombre: nombreDelMusculo(id), lado: DEL_FRENTE.includes(id) ? 'frente' : 'espalda',
      series: Math.round(x.series), seriesExactas: x.series, enLaEscala: Math.min(1, x.series / TOPE_DE_SERIES),
      seriesTexto: tx('ascent.tus.seriesCorto', { n: numero(Math.round(x.series)) }),
      estado, estadoTexto,
      accion: nueva ? '' : estado === 'sinEntrenar' ? tx('ascent.tus.acciones.sinEntrenar') : `${estadoTexto}: ${tx('ascent.tus.acciones.' + estado)}`,
      sugerencia: nueva ? '' : estado === 'poco' ? miPlural('semana.sugerencia.poco', Math.max(1, Math.ceil(PuntajeMuscular.RANGO.desde - x.series)))
        : estado === 'sinEntrenar' ? mi('semana.sugerencia.sinEntrenar') : conMayuscula(tx('ascent.tus.acciones.' + estado)),
      hoyToca: x.hoyToca,
      fatiga: {
        dias: x.dias, total: x.total, hecho: x.dias ? 1 - x.dias / x.total : 1, fase: x.fase, paso: FASES.indexOf(x.fase), nombre: mi(`fases.${x.fase}.nombre`),
        texto: x.dias ? u.plural('ascent.fatigados.faltan', x.dias) : '', estimado: x.dias ? tx('ascent.fatigados.estimado') : '',
        listo: x.dias ? mi('fatiga.listo', { cuando: elDia(x.listo) }) : mi('fatiga.yaListo'), listoEl: x.listo,
        desde: x.dias && x.ultimaVez ? cuandoFue(x.ultimaVez) : null, sinRir: !!x.dias && x.sinRir,
      },
      partes: parte ? {
        titulo: tx('ascent.tus.partes.titulo'), nota: tx('ascent.tus.partes.como.' + id),
        filas: [[parte, enParte], [id + 'Resto', Math.max(0, x.series - enParte)]].map(([k, n]) => ({ clave: k, nombre: tx('ascent.tus.partes.' + k), series: Math.round(n), texto: tx('ascent.tus.partes.linea', { parte: tx('ascent.tus.partes.' + k), n: numero(Math.round(n)) }) })),
      } : null,
      ejercicios: suyos.map((e) => Object.assign(ejercicioEnPalabras(e), {
        series: e.duras, seriesTexto: tx('ascent.tus.duras', { n: e.duras }), ayuda: !fuerte(e),
        ayudaTexto: fuerte(e) ? null : tx('ascent.tus.ayuda', { musculo: nombreDelMusculo(id).toLowerCase() }),
      })),
      sinEjercicios: suyos.length ? null : tx('ascent.tus.sinEjercicios'),
      // Los ejercicios de la sesión de hoy que lo trabajan como principal (sus id, en el orden de sesion.ejercicios).
      deHoy: deHoy.filter((e) => e.principal.includes(id)).map((e) => e.id),
    };
  };
  const musculos = [...DEL_FRENTE, ...DE_ESPALDA].map(filaDelMusculo);
  const cuentas = {};
  musculos.forEach((x) => { cuentas[x.estado] = (cuentas[x.estado] || 0) + 1; });
  const partes = (nueva ? ['entrenado', 'sinEntrenar'] : ['mucho', 'poco', 'sinEntrenar', 'enSuPunto']).filter((k) => cuentas[k]).map((k) => ({ estado: k, n: cuentas[k], texto: miPlural('semana.partes.' + k, cuentas[k]) }));
  // Los que se salen, de lo que más importa hoy a lo que menos: lo del aviso, lo que va de más, lo de hoy que falta y el resto.
  const orden = (x) => (c.aviso && c.aviso.musculos.includes(x.id) ? 0 : x.estado === 'mucho' ? 1 : x.hoyToca && x.estado !== 'enSuPunto' && x.estado !== 'entrenado' ? 2 : x.estado === 'sinEntrenar' ? 3 : x.estado === 'poco' ? 4 : 9);
  const destacados = musculos.filter((x) => orden(x) < 9).sort((a, b) => orden(a) - orden(b)
    || (orden(a) === 0 ? c.aviso.musculos.indexOf(a.id) - c.aviso.musculos.indexOf(b.id) : a.estado === 'mucho' ? b.seriesExactas - a.seriesExactas : a.seriesExactas - b.seriesExactas)).map((x) => x.id);
  const fatigados = musculos.filter((x) => x.fatiga.dias > 0).sort((a, b) => b.fatiga.dias - a.fatiga.dias);
  const semana = {
    titulo: tx('ascent.tus.semana'), texto: tx('ascent.tus.semanaTexto'), paraQue: tx('ascent.tus.paraQue'), anotas: tx('ascent.tus.anotas'),
    escala: { desde: PuntajeMuscular.RANGO.desde, hasta: PuntajeMuscular.RANGO.hasta, tope: TOPE_DE_SERIES },
    primera: nueva, cuentas, partes, destacados,
    resumen: nueva ? mi('semana.primera') : partes.filter((x) => x.estado !== 'enSuPunto').slice(0, 2).map((x) => x.texto).join(' · ') || mi('semana.todoAlDia'),
    leyenda: nueva ? [] : [
      ...['poco', 'enSuPunto', 'mucho'].map((k) => ({ estado: k, nombre: tx('ascent.tus.estados.' + k), texto: tx('ascent.tus.acciones.' + k) })),
      { estado: 'fatigado', nombre: tx('ascent.tus.estados.fatigado'), texto: tx('ascent.tus.acciones.fatigado') },
    ],
    dias: c.semana.map((x) => ({
      fecha: x.fecha, letra: propio('letras')[Fechas.diaDeLaSemana(x.fecha)], dia: nombreDelDia(x.fecha), hoy: x.hoy, toca: x.toca, hecho: x.hecho, fuera: x.fuera,
      nombre: x.grupos.length ? nombreDeSesion(x.grupos) : null,
    })),
    hechas: c.semana.filter((x) => x.hecho).length, previstas: c.semana.filter((x) => x.toca || x.hecho).length, fuera: mi('semana.fuera'),
    rutina: {
      titulo: tx('ascent.tus.rutina.titulo'), nota: c.nota.nota, palabra: tx('ascent.tus.rutina.nota.' + c.nota.nota),
      mejoras: c.nota.mejoras.length ? c.nota.mejoras.map((x) => conMayuscula(tx('ascent.tus.rutina.' + x.que, { musculo: nombreDelMusculo(x.musculo).toLowerCase(), n: numero(Math.round(x.series)) }))) : [tx('ascent.tus.rutina.bien')],
    },
  };
  const fatiga = {
    titulo: tx('ascent.fatigados.titulo'), texto: tx('ascent.fatigados.texto'), comoSeCalcula: tx('ascent.fatigados.comoSeCalcula'),
    lista: fatigados.map((x) => x.id), ninguno: fatigados.length ? null : mi('fatiga.ninguno'),
    sinRir: fatigados.some((x) => x.fatiga.sinRir) ? mi('fatiga.sinRir') : null,
    fases: FASES.map((k, i) => ({ fase: k, paso: i, nombre: mi(`fases.${k}.nombre`), texto: mi(`fases.${k}.texto`) })),
  };

  // ---- tu fuerza: la tendencia de cada ejercicio, lo estancado y lo que bajó, todo en el ejercicio
  const conSigno1 = (n) => u.conSigno(Math.round(n * 10) / 10, 1);
  const kg1 = (v) => numero(Math.round(v * 10) / 10, 1);
  const desde = -ProgresoCompartido.SEMANAS_DE_LA_TENDENCIA;
  const deLaFuerza = c.fuerza.map((x) => {
    const t = x.t;
    const [veredicto, dato] = t.estado === 'sube' ? [tx('ascent.fuerza.sube', { n: unDecimal(t.porMes) }), `${tx('ascent.fuerza.rango', { a: conSigno1(t.rango[0]), b: conSigno1(t.rango[1]) })} · ${u.plural('ascent.fuerza.sesiones', t.sesiones)}`]
      : t.estado === 'sinSubidaClara' ? [tx('ascent.fuerza.sinSubidaClara'), `${tx('ascent.fuerza.enSemanas', { n: Math.round(t.semanas) })} · ${u.plural('ascent.fuerza.sesiones', t.sesiones)}`]
      : [tx('ascent.fuerza.noSeSabe'), t.sesiones < ProgresoCompartido.SESIONES_MINIMAS ? u.plural('ascent.fuerza.faltanSesiones', t.sesiones) : tx('ascent.fuerza.faltanSemanas', { n: Math.round(t.semanas) })];
    const enVentana = x.puntos.filter((p) => p.t > desde && p.t <= 0);
    const primero = enVentana.length ? Math.min(...enVentana.map((p) => p.t)) : 0;
    const e = { musculo: x.musculo };
    const lado = (y, deBajada) => {
      const razones = y.r.razones.map((r) => razonEnPalabras(r, { musculo: x.musculo, antes: y.antes, ahora: y.ahora }));
      return {
        razones, compara: comparaEnPalabras(y.compara, e, deBajada, y.r.razones.map((r) => r.que)),
        faltan: y.r.faltan.includes('comida') || y.r.faltan.includes('sueno') ? tx('ascent.estancados.faltan') : null,
      };
    };
    let estancado = null;
    let bajo = null;
    if (x.estancado) {
      const l = lado(x.estancado, false);
      estancado = Object.assign(l, {
        dato: tx('ascent.estancados.dato', { n: x.sinMarca, marca: marcaEnPalabras(x.ultima) }),
        sinCausa: l.razones.length ? null : tx('ascent.estancados.sinCausa'),
        contexto: x.estancado.r.anios !== null ? tx('ascent.estancados.anios') : null,
        queCambiar: queCambiarEnPalabras(x.estancado.r.razones, e, c, null),
      });
    }
    if (x.bajo) {
      const b = x.bajo.b;
      const l = lado(x.bajo, true);
      bajo = Object.assign(l, {
        caida: b.caida, dato: tx('ascent.bajo.dato', { n: numero(Math.round(b.caida)), desde: u.fechaCorta(b.desde) }),
        antes: tx('ascent.bajo.antes', { kg: kg1(b.antes) }), ahora: tx('ascent.bajo.ahora', { kg: kg1(b.ahora) }),
        grafico: tx('ascent.bajo.grafico', { antes: kg1(b.antes), ahora: kg1(b.ahora) }),
        promedios: { antes: b.antes, ahora: b.ahora },
        puntos: x.bajo.ultimos.map((p, i) => ({ fecha: p.fecha, kg: p.e1rm, reps: p.reps, ahora: i >= TuSesion.SESIONES_DE_ANTES })),
        contexto: [b.pausa ? tx('ascent.bajo.pausa', { n: b.pausa }) : null, x.bajo.rango ? tx('ascent.bajo.rango', { a: numero(x.bajo.rango.a), b: numero(x.bajo.rango.b) }) : null].filter(Boolean),
        sinCausa: l.razones.length ? null : b.pausa || x.bajo.rango ? tx('ascent.estancados.sinCausa') : tx('ascent.bajo.sinRazon'),
        queCambiar: queCambiarEnPalabras(x.bajo.r.razones, e, c, { pausa: b.pausa, rango: x.bajo.rango }),
      });
    }
    return {
      id: x.e.id, nombre: nombreDelEjercicio(x.e), musculo: x.musculo, estado: x.estado, corto: mi('fuerza.corto.' + x.estado),
      veredicto: bajo ? tx('ascent.bajo.enFuerza', { n: numero(Math.round(x.bajo.b.caida)) }) : veredicto, dato,
      sesiones: t.sesiones, semanas: t.semanas, porMes: t.porMes, rango: t.rango ? t.rango.slice() : null, nivelKg: t.nivel,
      // Las semanas sin marca se dicen solo de lo que no sube: algo puede subir sin haberle ganado a una marca vieja.
      sinMarca: x.ultima ? x.sinMarca : null, sinMarcaTexto: x.ultima && (x.estado === 'sinSubidaClara' || x.estado === 'bajo') ? miPlural('fuerza.sinMarca', x.sinMarca) : null,
      marca: x.ultima ? marcaEnPalabras(x.ultima) : null,
      hoyToca: deHoy.some((y) => y.id === x.e.id),
      // Para dibujarla (chispa): cada sesión de las 12 semanas (t en semanas, 0 es hoy) y la recta con su rango.
      trazo: {
        desde, hasta: 0, puntos: enVentana.map((p) => ({ t: p.t, kg: p.e1rm, fecha: p.fecha })),
        recta: t.ajuste ? Array.from({ length: 13 }, (_, i) => desde + i).filter((s) => s >= primero).map((s) => Object.assign({ t: s }, ProgresoCompartido.nivelEn(t.ajuste, s))) : [],
      },
      estancado, bajo,
    };
  });
  const cuentasDeFuerza = { sube: 0, sinSubidaClara: 0, bajo: 0, noSeSabe: 0 };
  deLaFuerza.forEach((x) => { cuentasDeFuerza[x.estado]++; });
  const sigmas = c.fuerza.filter((x) => x.t.ajuste).map((x) => x.t.sigma);
  const hayEstancados = deLaFuerza.some((x) => x.estancado);
  const fuerza = {
    titulo: tx('ascent.fuerza.titulo'), semanas: tx('ascent.fuerza.semanas'), texto: tx('ascent.fuerza.texto'),
    ruido: sigmas.length ? tx('ascent.fuerza.ruido', { n: numero(promedio(sigmas), 1) }) : null,
    ejercicios: deLaFuerza, cuentas: cuentasDeFuerza,
    resumen: enLista(['sube', 'sinSubidaClara', 'bajo', 'noSeSabe'].filter((k) => cuentasDeFuerza[k]).map((k) => miPlural('fuerza.cuenta.' + k, cuentasDeFuerza[k]))),
    respuesta: !deLaFuerza.length ? '' : cuentasDeFuerza.sube ? mi('fuerza.respuesta.si', { n: cuentasDeFuerza.sube, de: deLaFuerza.length }) : mi('fuerza.respuesta.ninguno'),
    vacio: deLaFuerza.length ? null : mi('fuerza.vacio'),
    estancados: {
      titulo: tx('ascent.estancados.lista'), texto: tx('ascent.estancados.texto', { n: A.umbral }), lista: deLaFuerza.filter((x) => x.estancado).map((x) => x.id),
      ninguno: hayEstancados ? null : nueva ? miPlural('estancados.pronto', 1) : tx('ascent.estancados.ninguno'),
      porQue: tx('ascent.porQue.titulo'), queCambiar: tx('ascent.bajo.queCambiar'), nota: tx('ascent.estancamiento.nota'),
    },
    bajaron: {
      titulo: tx('ascent.bajo.titulo'), texto: tx('ascent.bajo.texto'), lista: deLaFuerza.filter((x) => x.bajo).map((x) => x.id),
      porQue: tx('ascent.bajo.porQue'), queCambiar: tx('ascent.bajo.queCambiar'),
    },
  };

  // ---- las metas
  const deLasMetas = c.metas.map((x) => metaEnPalabras(x, c));
  const metas = {
    titulo: tx('ascent.metas.titulo'), nueva: tx('ascent.metas.nueva'), editar: tx('ascent.metas.editar'), ninguna: mi('metas.ninguna'),
    lista: deLasMetas,
    comer: deLasMetas.some((x) => x.estado !== 'lograda') ? tx('ascent.metas.comer', { g: Math.round(ProgresoCompartido.PROTEINA_POR_KG * c.pesoKg) }) : null,
  };

  // ---- tu año
  const colores = ProgresoCompartido.COLORES_DEL_ANIO;
  const porFecha = new Map(c.anio.dias.map((x) => [x.fecha, x]));
  const conMarca = c.anio.dias.filter((x) => x.marca).length;
  const suenoDelAnio = promedio(Datos.NOCHES.map((n) => n.dormido));
  const anio = {
    anio: Number(HOY.slice(0, 4)), hoy: HOY, titulo: tx('ascent.anio.titulo'), derecha: tx('ascent.anio.hastaHoy', { anio: HOY.slice(0, 4) }), texto: tx('ascent.anio.texto2'),
    dias: c.anio.dias.map((x) => Object.assign({}, x)), colores: Object.assign({}, colores), entrenamientos: c.anio.dias.length, marcas: conMarca, mapa: tx('ascent.anio.mapa', { n: c.anio.dias.length, m: conMarca }),
    leyenda: [...['pecho', 'espalda', 'piernas', 'brazos'].map((k) => ({ clave: k, nombre: tx('ascent.hoy.grupos.' + k), color: colores[k] })), { clave: 'descanso', nombre: tx('ascent.anio.descanso'), color: null }, { clave: 'marca', nombre: tx('ascent.anio.marca'), color: null }],
    datos: [
      ['entrenamientos', numero(c.anio.dias.length)], ['marcas', numero(conMarca)], ['habitos', numero(A.anio.diasConHabitos)],
      ['sueno', tx('ascent.anio.horas', { h: Math.floor(suenoDelAnio / 60), m: String(Math.round(suenoDelAnio % 60)).padStart(2, '0') })], ['comida', numero(A.anio.diasConComida)],
    ].map(([k, valor]) => ({ clave: k, valor, nombre: tx('ascent.anio.datos.' + k) })),
    ultimasTitulo: tx('ascent.anio.ultimas'),
    ultimas: c.anio.ultimas.map((x) => {
      const semanas = Math.floor(Fechas.diasEntre(x.fecha, HOY) / 7);
      return {
        id: x.id, grupo: x.grupo, color: x.grupo ? colores[x.grupo] : null, destacada: x.destacada,
        texto: `${x.de ? `${tx('ascent.hoy.grupos.' + x.de)}: ${enFrase(nombreDelEjercicio(x))}` : conMayuscula(nombreDelEjercicio(x))} ${marcaEnPalabras(x)}`,
        cuando: semanas ? u.plural('ascent.anio.hace', semanas) : tx('ascent.anio.estaSemana'),
      };
    }),
    // Las últimas cuatro semanas, de la más vieja a hoy: para una tira chica.
    recientes: Array.from({ length: 28 }, (_, i) => {
      const fecha = Fechas.sumarDias(HOY, i - 27);
      const x = porFecha.get(fecha);
      return { fecha, grupo: x ? x.grupo : null, marca: !!x && x.marca, hoy: fecha === HOY };
    }),
    detalle(fecha) {
      const x = porFecha.get(fecha);
      const cuando = u.fechaCorta(fecha);
      if (fecha === HOY && !x) return tx('ascent.anio.detalle.hoy', { cuando });
      if (!x || !x.grupo) return tx('ascent.anio.detalle.descanso', { cuando });
      return tx(x.marca ? 'ascent.anio.detalle.marca' : 'ascent.anio.detalle.entreno', { cuando, grupo: enFrase(tx('ascent.hoy.grupos.' + x.grupo)) });
    },
  };

  return {
    clave: nombre, idioma: G.idioma, fecha: HOY, fechaTexto: u.fechaLarga(HOY), hora: horaMin(c.d.ahora),
    hoy, sesion, siguiente, aviso: avisoEnPalabras(c, sesionDeHoy), sugerencias: sugerenciasEnPalabras(c, sesionDeHoy),
    semana, musculos, fatiga, fuerza, metas, anio,
    // Recién vinculada: lo que ya se sabe y cuándo se enciende lo demás (cuatro hitos y «estás aquí»).
    nueva: nueva ? {
      entrenamientos: c.entrenamientos, texto: miPlural('nueva.texto', c.entrenamientos), aqui: mi('nueva.aqui'),
      alcanzados: c.ejercicios.some((x) => x.veces >= 2) ? 2 : c.entrenamientos ? 1 : 0,
      hitos: propio('nueva.hitos').map(([cuando, que], i) => ({ cuando, que, alcanzado: i < (c.ejercicios.some((x) => x.veces >= 2) ? 2 : c.entrenamientos ? 1 : 0) })),
    } : null,
    base: {
      titulo: tx('ascent.enQueSeBasa'), musculos: tx('ascent.baseDe.musculos'), fatigados: tx('ascent.baseDe.fatigados'), estancados: tx('ascent.baseDe.estancados'),
      porQue: tx('ascent.baseDe.porQue'), metas: tx('ascent.baseDe.metas'),
    },
  };
}

// ------------------------------------------------------------ los dibujos: SVG en texto, con clases para pintar
const soloClases = (s) => String(s || '').replace(/[^\w\- ]/g, '');
const escapar = (s) => String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
// Los trazos del cuerpo son los de la sección de la galería (galeria/src/ascent.js, piezas.trazosDelCuerpo), los mismos
// de la app (src/secciones/ascent/cuerpo.ts): se arman una vez.
const TRAZOS = {};
function trazosDe(lado) {
  if (!TRAZOS[lado]) {
    const T = G.secciones.ascent.piezas.trazosDelCuerpo;
    TRAZOS[lado] = {
      base: T.BASE, espejo: T.ESPEJO, lineas: T.LINEAS[lado],
      musculos: Object.entries(T.FORMAS[lado]).map(([musculo, formas]) => [musculo, formas.map((x) => (typeof x === 'string' ? x : T.curvaCerrada(x)))]),
    };
  }
  return TRAZOS[lado];
}
/** El cuerpo de frente o de espalda: cada músculo, un <g class="am-m …" data-musculo="…"> con las clases de `estados`. */
function figura(lado, estados, o) {
  const cual = lado === 'espalda' ? 'espalda' : 'frente';
  const T = trazosDe(cual);
  const clasesDe = (musculo) => {
    const e = estados ? estados[musculo] : '';
    return soloClases(Array.isArray(e) ? e.join(' ') : e);
  };
  const musculos = T.musculos.map(([musculo, ds]) => `<g class="am-m ${clasesDe(musculo)}" data-musculo="${musculo}">${ds.map((d) => `<path d="${d}"/><path d="${d}" transform="${T.espejo}"/>`).join('')}</g>`).join('');
  const lineas = T.lineas.map((d) => `<path class="am-linea" d="${d}"/><path class="am-linea" d="${d}" transform="${T.espejo}"/>`).join('');
  return `<svg class="am-figura ${cual}" viewBox="0 0 100 188" role="img" aria-label="${escapar((o && o.etiqueta) || tx('ascent.cuerpo.' + cual))}"><g class="am-base">${T.base}</g>${musculos}${lineas}</svg>`;
}
/** Las clases de cada músculo para `figura`, según lo que se mira: la semana (como la app), la fatiga en fases o lo de hoy. */
function estadosDe(modelo, lente) {
  const r = {};
  const deManana = !modelo.sesion && modelo.siguiente ? modelo.siguiente.musculos : [];
  modelo.musculos.forEach((x) => {
    if (lente === 'fatiga') r[x.id] = x.fatiga.fase;
    else if (lente === 'hoy') r[x.id] = modelo.sesion && modelo.sesion.musculos.includes(x.id) ? `${modelo.sesion.estado === 'hecha' ? 'hecho' : 'hoy'} ${x.fatiga.fase}` : deManana.includes(x.id) ? 'manana' : '';
    else r[x.id] = `${x.estado}${x.fatiga.dias > 0 ? ' fatigado' : ''}`;
  });
  return r;
}

/** Una fase de la fatiga en un disco (0 ○ recuperado, 1 ◔ falta poco, 2 ◑ se recupera, 3 ● cargado). */
function fase(paso) {
  const lleno = [0, 0.25, 0.5, 1][Math.max(0, Math.min(3, paso))];
  const hasta = `${(6 + 5 * Math.sin(2 * Math.PI * lleno)).toFixed(2)} ${(6 - 5 * Math.cos(2 * Math.PI * lleno)).toFixed(2)}`;
  const relleno = lleno === 1 ? '<circle class="am-fase-lleno" cx="6" cy="6" r="5"/>' : lleno > 0 ? `<path class="am-fase-lleno" d="M6 6 L6 1 A5 5 0 0 1 ${hasta} Z"/>` : '';
  return `<svg class="am-fase paso-${paso}" viewBox="0 0 12 12" aria-hidden="true">${relleno}<circle class="am-fase-aro" cx="6" cy="6" r="5"/></svg>`;
}
/** Las cuatro fases en fila, con la de ahora marcada (`actual`); se lee con el nombre de la fase. */
function fases(paso) {
  const nombre = mi(`fases.${FASES[Math.max(0, Math.min(3, paso))]}.nombre`);
  return `<span class="am-fases" role="img" aria-label="${escapar(nombre)}">${[0, 1, 2, 3].map((i) => `<i class="${i === paso ? 'actual' : ''}">${fase(i)}</i>`).join('')}</span>`;
}

/** La tendencia de un ejercicio de `fuerza.ejercicios` en chico: el rango de la recta, la recta y cada sesión en un punto. */
function chispa(ejercicio, o) {
  const W = (o && o.ancho) || 128;
  const H = (o && o.alto) || 48;
  const M = 4;
  const z = ejercicio.trazo;
  if (!z.puntos.length) return `<svg class="am-chispa vacia" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="am-chispa-vacio" d="M${M} ${H / 2} H${W - M}"/></svg>`;
  const valores = [...z.puntos.map((p) => p.kg), ...z.recta.flatMap((b) => [b.abajo, b.arriba])];
  const lo = Math.min(...valores);
  const hi = Math.max(...valores);
  const pad = (hi - lo) * 0.12 || 1;
  const X = (t) => (M + ((t - z.desde) / (z.hasta - z.desde)) * (W - 2 * M)).toFixed(1);
  const Y = (v) => (H - M - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 2 * M)).toFixed(1);
  let svg = '';
  if (z.recta.length > 1) {
    svg += `<path class="am-chispa-banda" d="M${z.recta.map((b) => `${X(b.t)} ${Y(b.arriba)}`).join(' L')} L${[...z.recta].reverse().map((b) => `${X(b.t)} ${Y(b.abajo)}`).join(' L')} Z"/>`;
    svg += `<path class="am-chispa-recta" d="M${z.recta.map((b) => `${X(b.t)} ${Y(b.nivel)}`).join(' L')}"/>`;
  }
  svg += z.puntos.map((p) => `<circle class="am-chispa-punto" cx="${X(p.t)}" cy="${Y(p.kg)}" r="1.9"/>`).join('');
  return `<svg class="am-chispa ${ejercicio.estado}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapar(`${ejercicio.nombre}: ${ejercicio.veredicto}`)}">${svg}</svg>`;
}

/** El mapa del año de `modelo.anio`: un cuadro por día, los meses en filas; cada <rect> lleva data-fecha. */
function mapaDelAnio(anio) {
  const L = 9;
  const S = 1.5;
  const MES = 26;
  const porFecha = new Map(anio.dias.map((x) => [x.fecha, x]));
  let svg = '';
  for (let mes = 0; mes < 12; mes++) {
    const y = mes * (L + 2);
    svg += `<text class="am-anio-mes" x="0" y="${y + L - 1.5}">${conMayuscula(tx('fecha.mesesCortos.' + mes))}</text>`;
    const dias = new Date(anio.anio, mes + 1, 0).getDate();
    for (let n = 1; n <= dias; n++) {
      const fecha = `${anio.anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const d = porFecha.get(fecha);
      const x = (MES + (n - 1) * (L + S)).toFixed(1);
      svg += `<rect class="am-anio-dia ${fecha > anio.hoy ? 'futuro' : d && d.grupo ? d.grupo : 'descanso'}${fecha === anio.hoy ? ' hoy' : ''}" data-fecha="${fecha}" x="${x}" y="${y}" width="${L}" height="${L}" rx="1.6"/>`;
      if (d && d.marca) svg += `<circle class="am-anio-marca" cx="${(Number(x) + L / 2).toFixed(1)}" cy="${y + L / 2}" r="1.5"/>`;
    }
  }
  return `<svg class="am-anio" viewBox="0 0 ${MES + 31 * L + 30 * S} ${12 * L + 11 * 2}" role="img" aria-label="${escapar(anio.mapa)}">${svg}</svg>`;
}

// Lo de fábrica de los dibujos, como los pinta la app (DibujosSkia.tsx). Con :where() no pesa nada: cualquier regla de
// una propuesta lo pisa. Cada pieza declara su relleno y su trazo: dentro de .pagina-app, los svg heredan el trazo de
// los íconos de la galería.
const COLORES = ProgresoCompartido.COLORES_DEL_ANIO;
const CSS = `
:where(.am-figura) { display: block; overflow: visible; }
:where(.am-figura .am-base) { fill: rgba(170, 178, 196, 0.1); stroke: none; }
:where(.am-figura .am-m) { fill: rgba(170, 178, 196, 0.2); fill-opacity: 1; stroke: #07080d; stroke-width: 0.9; stroke-dasharray: none; transition: fill 0.6s ease, fill-opacity 0.6s ease, stroke 0.3s ease; }
:where(.am-figura .am-m.poco) { fill: var(--as-claro, #c4c2ba); fill-opacity: 0.38; }
:where(.am-figura .am-m.enSuPunto, .am-figura .am-m.entrenado, .am-figura .am-m.hoy, .am-figura .am-m.hecho) { fill: var(--as-claro, #c4c2ba); fill-opacity: 0.92; }
:where(.am-figura .am-m.manana) { fill: var(--as-claro, #c4c2ba); fill-opacity: 0.3; }
:where(.am-figura .am-m.mucho) { fill: #f0c48a; fill-opacity: 0.85; }
:where(.am-figura .am-m.fatigado) { stroke: var(--as-lejos, #cb8569); stroke-width: 0.8; stroke-dasharray: 1.8 1.2; }
:where(.am-figura .am-m.faltaPoco) { fill: var(--as-lejos, #cb8569); fill-opacity: 0.22; }
:where(.am-figura .am-m.seRecupera) { fill: var(--as-lejos, #cb8569); fill-opacity: 0.48; }
:where(.am-figura .am-m.cargado) { fill: var(--as-lejos, #cb8569); fill-opacity: 0.9; }
:where(.am-figura .am-m.elegido) { stroke: var(--as-tinta, #e8ecf6); stroke-width: 1.3; stroke-dasharray: none; }
:where(.am-figura .am-linea) { fill: none; stroke: #07080d; stroke-width: 0.7; stroke-linecap: round; pointer-events: none; }
:where(.am-fases) { display: inline-flex; gap: 4px; vertical-align: middle; }
:where(.am-fases i) { display: block; width: 12px; height: 12px; opacity: 0.35; transition: opacity 0.3s ease; }
:where(.am-fases i.actual) { opacity: 1; }
:where(.am-fase) { display: block; width: 100%; height: 100%; overflow: visible; }
:where(.am-fase .am-fase-aro) { fill: none; stroke: currentColor; stroke-width: 1.2; }
:where(.am-fase .am-fase-lleno) { fill: currentColor; stroke: none; }
:where(.am-chispa) { display: block; overflow: visible; }
:where(.am-chispa .am-chispa-banda) { fill: rgba(170, 178, 196, 0.14); stroke: none; }
:where(.am-chispa .am-chispa-recta) { fill: none; stroke: var(--as-sub, #aab2c4); stroke-width: 1.2; stroke-linecap: round; }
:where(.am-chispa .am-chispa-punto) { fill: var(--as-tinta, #e8ecf6); stroke: none; }
:where(.am-chispa.sube .am-chispa-recta) { stroke: var(--as-claro, #c4c2ba); }
:where(.am-chispa.bajo .am-chispa-recta) { stroke: var(--as-lejos, #cb8569); }
:where(.am-chispa .am-chispa-vacio) { fill: none; stroke: rgba(170, 178, 196, 0.3); stroke-width: 1; stroke-dasharray: 2 3; }
:where(.am-anio) { display: block; width: 100%; height: auto; overflow: visible; }
:where(.am-anio .am-anio-mes) { fill: var(--as-apagado, #9098ab); stroke: none; font: 400 7px/1 var(--texto, sans-serif); }
:where(.am-anio .am-anio-dia) { fill: rgba(170, 178, 196, 0.1); stroke: none; }
:where(.am-anio .am-anio-dia.futuro) { fill: none; stroke: rgba(170, 178, 196, 0.12); stroke-width: 0.5; }
:where(.am-anio .am-anio-dia.pecho) { fill: ${COLORES.pecho}; }
:where(.am-anio .am-anio-dia.piernas) { fill: ${COLORES.piernas}; }
:where(.am-anio .am-anio-dia.espalda) { fill: ${COLORES.espalda}; }
:where(.am-anio .am-anio-dia.brazos) { fill: ${COLORES.brazos}; }
:where(.am-anio .am-anio-dia.hoy) { stroke: var(--as-tinta, #e8ecf6); stroke-width: 1; }
:where(.am-anio .am-anio-marca) { fill: #fff; stroke: none; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { :where(.am-figura .am-m, .am-fases i) { transition: none; } }
`;
G.estilo('ascent-de-mentira', CSS);

// ------------------------------------------------------------ lo que usan las propuestas
window.AscentDeMentira = {
  DIAS: Object.keys(DIAS),
  FASES: FASES.slice(),
  MUSCULOS: { frente: DEL_FRENTE.slice(), espalda: DE_ESPALDA.slice() },
  dia,
  /** Lo que no es de un día: qué es Ascent en una línea y lo que se dice sin vincular o sin rutina. */
  frases: () => Object.assign({}, propio('frases')),
  figura, estadosDe, fase, fases, chispa, mapaDelAnio,
  cuerpoDelRango: () => G.secciones.ascent.piezas.cuerpoDelRango(),
  rango() {
    const r = G.secciones.ascent.rango;
    return RangoDeAscent.cuerpoDeAscent(RangoDeAscent.rachaDe(r.rango, r.planeta));
  },
  get marca() { return G.secciones.ascent.piezas.marca; },
  get marcaChica() { return G.secciones.ascent.piezas.marcaChica; },
};
