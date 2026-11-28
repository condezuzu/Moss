// «En qué se basa Moss», con dibujos (27/11/2026, para aprobar). Lo pediste: la propuesta del 26/11 (base.js) quedó
// bien de contenido y «muy aburrida» de ver. Acá el contenido es el mismo (sus áreas, sus sellos y sus fuentes, que se
// leen de perfil.baseInfo, donde las dejó base.js) y cada idea se entiende con un dibujo. Tres piezas:
// - «Cuánto confiar», la portada: la respuesta en una frase, la fecha y un solo cuadro con los cuatro sellos como
//   columnas y cada cifra como una píldora en la suya: de un vistazo se ve cuánto es sólido y cuánto decide Moss;
// - «Una cifra por tema»: una retícula de fichas (la cifra, su dibujo, una frase y su sello), con filtro por área. Cada
//   ficha crece desde su marco: el dibujo grande, «Para ti» con el dato de hoy, «Lo que no se sabe» y sus fuentes;
// - «¿Por qué me dice esto?», debajo de lo que Moss dice: tu dato, la regla y lo que se sabe, en una cadena.
// La persona es la de la galería, y cada «Para ti» dice lo mismo que la sección que lo muestra: anoche, la noche corta
// del día de ejemplo de Ascent (Datos.ASCENT.dias.corta, el que Ascent abre); la deuda, el horario y el periodo, los de
// Sueño; la meta, la de Inicio. Ninguna cifra nueva: las que no están en base.js salen de spec/estudio (el ruido del
// peso, progreso.md T4; la cintura según dónde se mide, T29; la deuda, deuda-y-melatonina.md 1.5 y 1.6; el periodo,
// 3.4; el café, momentos.md 3; la fórmula dentro de ±10 %, metas.md 2; la franja de 10 a 20 series, una convención,
// musculos-compartido.md 4.1; el déficit con cada cuidado, cuidados.md 3 y 6, como lo hace cuidados.ts).
// La firmeza de la línea dice lo mismo que el sello: llena y entera, lo sólido; a rayas o borrosa, lo estimado; a
// puntos, lo que decide Moss. En la app iría en src/secciones/perfil/, con estos textos en src/textos.

const SELLOS = ['solido', 'razonable', 'estimacion', 'decision'];
const PUNTOS_DEL_SELLO = { solido: 4, razonable: 3, estimacion: 2, decision: 1 };
const AREAS = ['comida', 'peso', 'sueno', 'avisos', 'entreno', 'cuidados'];

// Cada ficha: su área, su sello y sus fuentes («área#n» es la cita n de esa área en perfil.baseInfo; «+x», una de OTRAS).
const FICHAS = [
  ['gasto', 'comida', 'estimacion', ['metas#1', 'metas#2', '+frankenfield']],
  ['control', 'comida', 'solido', ['metas#3', 'progreso#1']],
  ['proteina', 'comida', 'solido', ['metas#4']],
  ['foto', 'comida', 'solido', ['fotos#1', 'fotos#2', 'fotos#3', 'fotos#4']],
  ['peso', 'peso', 'razonable', ['+cheuvront', '+kutac', 'progreso#1']],
  ['ritmo', 'peso', 'solido', ['progreso#2']],
  ['plazo', 'peso', 'razonable', ['progreso#1']],
  ['grasa', 'peso', 'estimacion', ['progreso#4']],
  ['cintura', 'peso', 'solido', ['progreso#5', '+ross']],
  ['imc', 'peso', 'solido', ['progreso#3']],
  ['horas', 'sueno', 'solido', ['sueno#1', 'sueno#2', 'sueno#3']],
  ['reloj', 'sueno', 'solido', ['sueno#4']],
  ['deuda', 'sueno', 'estimacion', ['+vandongen', '+ramakrishnan']],
  ['regularidad', 'sueno', 'razonable', ['sueno#5']],
  ['calidad', 'sueno', 'decision', []],
  ['cafe', 'avisos', 'razonable', ['momentos#1']],
  ['periodo', 'avisos', 'estimacion', ['+burgess']],
  ['luces', 'avisos', 'razonable', ['momentos#2']],
  ['comer', 'avisos', 'solido', ['momentos#3', 'momentos#4']],
  ['noche', 'entreno', 'solido', ['ascent#1']],
  // La franja de 10 a 20 es una convención (vinculo-ascent.md, musculos-compartido.md); la curva, Pelland 2026.
  ['series', 'entreno', 'decision', ['ascent#2']],
  ['fuerza', 'entreno', 'razonable', ['ascent#3', 'ascent#4']],
  ['fatiga', 'entreno', 'estimacion', ['ascent#5', 'ascent#6']],
  ['puntaje', 'entreno', 'decision', ['ascent#7']],
  // «Sin déficit» para todos los cuidados es «A medias» en cuidados.md; Moss lo saca según la condición (cuidados.ts).
  ['cuidados', 'cuidados', 'razonable', ['cuidados#2', '+iom1991', '+lovelady', 'cuidados#4', '+anderberg', 'cuidados#3', 'cuidados#6']],
  ['privado', 'cuidados', 'decision', []],
].map(([id, area, sello, refs]) => ({ id, area, sello, refs }));

// Las fuentes que base.js no trae, tal cual están en spec/estudio (metas.md, progreso.md, deuda-y-melatonina.md y
// cuidados.md).
const OTRAS = {
  ross: { anio: '2020', enlace: 'https://doi.org/10.1038/s41574-019-0310-7', es: { quien: 'Ross y otros', que: 'La cintura como signo vital · consenso' }, en: { quien: 'Ross et al.', que: 'Waist circumference as a vital sign · consensus statement' } },
  iom1991: { anio: '1991', enlace: 'https://doi.org/10.17226/1577', es: { quien: 'IOM', que: 'La nutrición durante la lactancia · guía' }, en: { quien: 'IOM', que: 'Nutrition During Lactation · guideline' } },
  lovelady: { anio: '2000', enlace: 'https://doi.org/10.1056/NEJM200002173420701', es: { quien: 'Lovelady y otros', que: 'Ensayo · 40 mujeres que bajaron de peso amamantando, sin efecto en el bebé' }, en: { quien: 'Lovelady et al.', que: 'Trial · 40 women who lost weight while breastfeeding, with no effect on the baby' } },
  anderberg: { anio: '2025', enlace: 'https://doi.org/10.1016/j.bodyim.2024.101836', es: { quien: 'Anderberg y otros', que: 'Revisión sistemática · 38 estudios sobre las apps de dieta y los trastornos de la alimentación' }, en: { quien: 'Anderberg et al.', que: 'Systematic review · 38 studies on diet apps and disordered eating' } },
  frankenfield: { anio: '2013', enlace: 'https://doi.org/10.1016/j.clnu.2013.03.022', es: { quien: 'Frankenfield', que: 'Las ecuaciones del gasto en reposo, contra lo medido · 337 personas' }, en: { quien: 'Frankenfield', que: 'Resting-burn equations against measurement · 337 people' } },
  cheuvront: { anio: '2004', enlace: 'https://doi.org/10.1123/ijsnem.14.5.532', es: { quien: 'Cheuvront y otros', que: 'Lo que varía el peso de un día a otro · 65 hombres activos' }, en: { quien: 'Cheuvront et al.', que: 'Day-to-day body mass variability · 65 active men' } },
  kutac: { anio: '2015', enlace: 'https://doi.org/10.1186/s40101-015-0070-6', es: { quien: 'Kutáč', que: 'La variación de un día a otro, en ayunas · 86 hombres jóvenes' }, en: { quien: 'Kutáč', que: 'Day-to-day variation, fasted · 86 young men' } },
  vandongen: { anio: '2003', enlace: 'https://doi.org/10.1093/sleep/26.2.117', es: { quien: 'Van Dongen y otros', que: 'Ensayo · 48 personas, 14 días durmiendo de menos' }, en: { quien: 'Van Dongen et al.', que: 'Trial · 48 people, 14 days of restricted sleep' } },
  ramakrishnan: { anio: '2016', enlace: 'https://doi.org/10.5665/sleep.5358', es: { quien: 'Ramakrishnan y otros', que: 'Modelo validado de cómo sube y baja la deuda' }, en: { quien: 'Ramakrishnan et al.', que: 'A validated model of how sleep debt builds and fades' } },
  burgess: { anio: '2005', enlace: 'https://doi.org/10.1111/j.1365-2869.2005.00470.x', es: { quien: 'Burgess y Eastman', que: 'El inicio de la melatonina según el horario · 120 jóvenes sanos' }, en: { quien: 'Burgess and Eastman', que: 'Melatonin onset from the sleep schedule · 120 healthy young adults' } },
};

// Los textos, hasta que se apruebe: cada ficha con su píldora (`corto`), su cifra y su unidad (`u`), su frase, «Para ti»
// (con los datos de la persona, `d`), «Lo que no se sabe» y los rótulos del dibujo grande (`e`).
const TEXTOS_BD = {
  es: {
    respuesta: ['Moss calcula con lo que anotas y con estudios revisados.', 'Donde no hay evidencia, lo dice.'],
    cuantas: '{cifras} cifras · {fuentes} fuentes',
    cifrasTitulo: 'Una cifra por tema',
    cifrasAyuda: 'Toca una para ver de dónde sale y qué dice de ti.',
    todo: 'Todo',
    areas: { comida: 'Comida', peso: 'Peso', sueno: 'Sueño', avisos: 'Avisos', entreno: 'Entrenamiento', cuidados: 'Cuidados' },
    paraTi: 'Para ti',
    noSabe: 'Lo que no se sabe',
    cerrar: 'Cerrar',
    verCifra: 'Ver la cifra',
    pc: (n) => `${n} %`,
    diaYMes: (num, mes) => `${num} de ${mes}`,
    porque: {
      titulo: '¿Por qué me dice esto?',
      intro: 'Debajo de cada cosa que Moss dice: tu dato, la regla y lo que se sabe.',
      nudos: ['Tu dato', 'La regla', 'Lo que se sabe'],
      enAscent: 'En Ascent',
      enInicio: 'En Inicio',
      noche: { abrir: () => '¿Por qué me dice esto?', dato: 'dormiste anoche', regla: ['6 h', 'o menos cuenta como noche corta'], sabe: ['−10 %', '', 'de repeticiones con poco sueño. La fuerza máxima casi no cambia.'] },
      meta: { abrir: (d) => `¿Por qué ${d.meta} kcal?`, dato: 'gastas por día, medido con tus pesadas', regla: (d) => (d.baja ? `para bajar ${d.pct} % de tu peso por semana` : 'tu meta es lo que gastas'), sabe: ['3–4', 'semanas', 'de pesadas y la cuenta es firme: se comprobó contra el laboratorio.'] },
    },
    fichas: {
      gasto: {
        corto: 'Gasto de partida', cifra: '±10 %',
        frase: 'Lo que puede errar la fórmula de tu gasto. A veces, más.',
        ti: (d) => `Tu primer número salió de esa fórmula. Hoy Moss usa lo que mide con tu peso: unas ${d.gasto} kcal por día.`,
        noSabe: 'Tu gasto exacto. En reposo, la fórmula queda dentro de ese margen en unas 8 de cada 10 personas; en atletas y en mayores, en menos.',
        e: { reposo: 'En reposo', dia: 'Tu día', entreno: 'Entrenar', margen: '±10 % o más' },
      },
      control: {
        corto: 'Control semanal', cifra: '3–4', u: 'semanas',
        frase: 'De pesadas frecuentes, y tu gasto medido se vuelve firme.',
        ti: (d) => (d.baja ? `Llevas ${d.semanas} semanas. Gastas unas ${d.gasto} kcal; para bajar ${d.pct} % por semana, tu meta es de ${d.meta}.` : `Llevas ${d.semanas} semanas. Gastas unas ${d.gasto} kcal, y tu meta es de ${d.meta}.`),
        noSabe: 'Lo que no se anota: la cuenta sale de tu comida y de tu peso, y un día anotado a medias la mueve.',
        e: { formula: 'Fórmula', peso: 'Con tu peso', semana: '{n} sem.', gastas: 'Gastas', meta: 'Tu meta' },
      },
      proteina: {
        corto: 'Proteína', cifra: '1,6–2,2', u: 'g/kg',
        frase: 'De proteína por día si entrenas. Nunca menos de 1,2.',
        ti: (d) => `Tu meta: ${d.proteina} g por día, ${d.gkgTexto} g por cada uno de tus ${d.kg} kg.`,
        noSabe: 'Si pasar de 1,6 suma algo: 2,2 es el borde de arriba del margen del estudio, no un óptimo.',
        e: { piso: 'nunca menos', tu: 'Tu meta' },
      },
      foto: {
        corto: 'Fotos de comida', cifra: '36–64 %',
        frase: 'Lo que erraron tres IA al calcular las calorías de un plato con una foto.',
        ti: (d) => `Hoy anotaste ${d.comidoTexto} kcal eligiendo cada alimento y su porción: su margen es el de la etiqueta.`,
        noSabe: 'Cuánto mejor es elegir de una base: nadie lo comparó de frente con la foto, con comida pesada.',
        e: { etiqueta: 'Una etiqueta', etiquetaN: 'hasta 20 %', foto: 'Una foto', fotoN: '36–64 %' },
      },
      peso: {
        corto: 'Peso de un día', cifra: '±0,5', u: 'kg',
        frase: 'Lo que el peso se mueve de un día a otro. Por eso Moss mira la tendencia.',
        ti: (d) => (d.pesoMin ? `Esta semana tus pesadas fueron de ${d.pesoMin} a ${d.pesoMax} kg. La línea, tu ritmo: ${d.ritmoKg} kg por semana.` : `Tu tendencia: ${d.tendencia} kg.`),
        noSabe: 'En un día suelto, cuánto es agua: por eso un número solo no dice nada.',
        e: { franja: '±0,5 kg', hoy: 'hoy', antes: 'hace 30 días' },
      },
      ritmo: {
        corto: 'Ritmo máximo', cifra: '1 %', u: 'por semana',
        frase: 'De tu peso, como mucho: así se baja grasa cuidando el músculo.',
        ti: (d) => (d.baja ? `Tu plan: ${d.pct} % por semana, unos ${d.planG} g. Vienes a ${d.ritmoKg} kg por semana.` : 'Hoy no estás bajando: el tope vale cuando elijas bajar.'),
        noSabe: 'Con mucho peso por bajar, si se puede ir más rápido sin perder más músculo: los estudios no coinciden.',
        e: { tu: 'Tu plan', tope: 'tope' },
      },
      plazo: {
        corto: 'Fecha de llegada', cifra: '4–6', u: 'semanas',
        frase: 'De pesadas antes de decir cuándo llegas. Y es un rango, no un día.',
        ti: (d) => (d.plazo ? `A tu ritmo, llegarías a ${d.metaKg} kg entre el ${d.llegaDesde} y el ${d.llegaHasta}.` : 'Todavía no hay un rango: aparece con unas semanas de pesadas.'),
        noSabe: 'El día exacto. Con el ruido del peso, una fecha sola acertaría pocas veces.',
        e: { hoy: 'Hoy' },
      },
      grasa: {
        corto: 'Grasa con cinta', cifra: '±4', u: 'puntos',
        frase: 'Lo que la cinta puede diferir de un estudio de laboratorio. O más.',
        ti: (d) => (d.grasa != null ? `Tu estimación: unos ${d.grasaTexto} %, entre ${d.grasaA} y ${d.grasaB}.` : 'Con tus medidas de cintura y cuello, aquí aparece tu estimación.'),
        noSabe: 'Si un cambio chico es real. Para ver cómo cambia tu cuerpo, sirve más tu cintura.',
        e: { tu: (d) => (d.grasa != null ? `unos ${d.grasaTexto} %` : '') },
      },
      cintura: {
        corto: 'Cintura', cifra: '0,5', u: 'de tu altura',
        frase: 'Tu cintura, por debajo de eso: lo que recomienda la guía NICE.',
        ti: (d) => (d.cintura ? `${d.cinturaTexto} cm de cintura con ${d.altura} cm de altura: ${d.caTexto}, por debajo de ${d.medio}.` : 'Con tu cintura medida, aquí aparece tu número.'),
        noSabe: 'Tu número exacto: según dónde midas, en las mujeres cambia unos 2 cm y en los hombres, casi nada. Mide siempre en el mismo lugar.',
        e: { altura: 'Altura', cintura: 'Cintura', mitad: 'la mitad' },
      },
      imc: {
        corto: 'Peso mínimo', cifra: '18,5', u: 'de IMC',
        frase: 'Moss nunca acepta un peso meta por debajo de este índice.',
        ti: (d) => `Con tu altura son ${d.pesoMinimo} kg. Tu meta, ${d.metaKg} kg, queda arriba.`,
        noSabe: 'Dónde está tu mejor peso: 18,5 es solo el borde que marca la OMS, no una meta.',
        e: { meta: 'Tu meta', hoy: 'Hoy' },
      },
      horas: {
        corto: 'Horas de sueño', cifra: '7 h', u: 'o más',
        frase: 'Lo que piden las guías para un adulto. Moss parte de 8 y lo cambias tú.',
        ti: (d) => `Tu necesidad: ${d.necTexto}. Anoche, ${d.anoche}.`,
        noSabe: 'Cuánto necesitas tú: cambia de una persona a otra, y en casa no hay cómo medirlo.',
        e: { nec: (d) => `Necesitas ${d.necTexto}`, anoche: (d) => `Anoche, ${d.anocheCorta}` },
      },
      reloj: {
        corto: 'Tu reloj', cifra: '> 90 %',
        frase: 'Del sueño lo detecta un reloj. Las etapas son bastante menos exactas.',
        ti: (d) => (d.nocheDesde ? `Anoche: ${d.anoche}, de ${d.nocheDesde} a ${d.nocheHasta}. Eso es confiable; tus etapas, una estimación.` : `Anoche: ${d.anoche}. Eso es confiable; tus etapas, una estimación.`),
        noSabe: 'Tus etapas: en el sueño profundo, un reloj puede errar de 25 a 43 minutos.',
        e: { firme: 'Cuánto y cuándo', borroso: 'Las etapas, borrosas' },
      },
      deuda: {
        corto: 'Deuda de sueño', cifra: '14', u: 'noches',
        frase: 'Lo que te faltó en cada una. Lo reciente pesa más.',
        ti: (d) => (d.deuda ? `Tu deuda: unas ${d.deuda} (${d.deudaPalabra}). Duermes unas ${d.duermes} de las ${d.necTexto} que necesitas.` : 'Con cinco noches, aquí aparece tu deuda.'),
        noSabe: 'El número: ni con reloj se conoce a menos de ±3 h. Por eso va con una palabra.',
        e: { nec: (d) => `Necesitas ${d.necTexto}`, anoche: 'anoche', antes: 'hace 2 semanas' },
      },
      regularidad: {
        corto: 'Horario regular', cifra: '60.977', u: 'personas',
        frase: 'En el estudio donde el horario regular se asoció con la salud.',
        ti: (d) => (d.semana7 ? `Te duermes con unos ${d.desvioD} min de diferencia entre noches y te despiertas con unos ${d.desvioW}: ${d.regular}.` : 'Con ocho noches, aquí aparece tu regularidad.'),
        noSabe: 'Si la regularidad mejora la salud o solo la acompaña: es un estudio de observación.',
        e: { dormir: 'Te duermes', despertar: 'Te despiertas' },
      },
      calidad: {
        corto: 'Calidad del sueño', cifra: '50 · 30 · 20',
        frase: 'Duración, horario y continuidad: los pesos los eligió Moss.',
        ti: (d) => (d.calidad == null ? 'Con una noche medida, aquí aparece tu calidad.' : `Anoche: ${d.calidad} de 100. Es un dato para ver cómo vienes: no cambia lo de hoy.`),
        noSabe: 'Ningún estudio valida esos pesos, ni los de ningún reloj. Sirve para ver tendencias, no es una medida.',
        e: { duracion: 'Duración', horario: 'Horario', continuidad: 'Continuidad', anoche: 'Anoche', de: '{n} de {de}' },
      },
      cafe: {
        corto: 'Último café', cifra: '9 h', u: 'antes de acostarte',
        frase: 'Un café deja de quitarte sueño. Con más cafeína, hasta 13 h.',
        ti: (d) => (d.cama ? `Hoy, a la cama a las ${d.cama}: el último café, hasta las ${d.corte}.` : 'Con tus noches, aquí aparece tu hora.'),
        noSabe: 'Cuánto te dura a ti: la cafeína baja a la mitad en 3 a 6 horas, y en algunas personas, en 8.',
        e: { corte: (d) => `Último café ${d.corte || ''}`, cama: (d) => `A la cama ${d.cama || ''}`, mitad: 'baja a la mitad en 3 a 6 h', mas: 'con más cafeína, 13 h' },
      },
      periodo: {
        corto: 'Periodo de melatonina', cifra: '±1 h',
        frase: 'El margen de tu periodo de melatonina: sale de tus horarios.',
        ti: (d) => (d.periodo ? `Esta noche, de ${d.perDesde} a ${d.perHasta}. De ahí salen tus avisos: el café hasta las ${d.corte} y las luces a las ${d.luces}.` : 'Con tres noches de esta semana, aquí aparece tu periodo.'),
        noSabe: 'Tu melatonina de verdad: con luz fuerte o pantallas hasta tarde, llega después.',
        e: { cafe: 'último café', comida: 'última comida', luces: 'luces', cama: 'a la cama', periodo: 'tu periodo' },
      },
      luces: {
        corto: 'Luces', cifra: '3 h', u: 'antes de acostarte',
        frase: 'Luz baja, según un consenso. Moss avisa a la hora y media.',
        ti: (d) => (d.cama ? `Hoy, el aviso a las ${d.luces}. Lo que pide el consenso: luz baja desde las ${d.luces3}.` : 'Con tus noches, aquí aparece tu hora.'),
        noSabe: 'Cuánta luz te afecta a ti: la sensibilidad cambia mucho de una persona a otra.',
        e: { consenso: (d) => ['3 h: el consenso', d.luces3].filter(Boolean).join(' · '), aviso: (d) => ['1 h 30: el aviso', d.luces].filter(Boolean).join(' · '), cama: (d) => (d.cama ? `A la cama ${d.cama}` : 'cama') },
      },
      comer: {
        corto: 'Comer y entrenar', cifra: '1–4 h', u: 'antes de entrenar',
        frase: 'La comida. Y después, proteína en la comida que sigue.',
        ti: (d) => (d.entreno ? `Hoy entrenas a las ${d.entreno}: tu comida de antes, entre las ${d.comerA} y las ${d.comerB}.` : 'Con tu horario de entrenamiento, aquí aparecen tus horas.'),
        noSabe: 'El minuto justo importa poco: lo que más pesa es la proteína del día entero.',
        e: { antes: 'Comer', entreno: (d) => `Entrenar ${d.entreno || ''}`, despues: 'Proteína' },
      },
      noche: {
        corto: 'Noche corta', cifra: '−10 %',
        frase: 'Repeticiones tras dormir 6 h o menos. La fuerza máxima, casi igual.',
        ti: (d) => `Anoche, ${d.anoche}: por eso hoy dice «sin ir al fallo».`,
        noSabe: 'Cuánto pesa dormir mal y no solo poco: casi todos los estudios midieron las horas.',
        e: { fuerza: 'Fuerza máxima', fuerzaN: '−3 %', reps: 'Repeticiones', repsN: '−10 %' },
      },
      series: {
        corto: 'Series por semana', cifra: '10–20', u: 'series',
        frase: 'Por músculo y semana, la franja de Moss. Más series, más progreso; cada vez menos.',
        ti: (d) => (d.series.length ? `Esta semana: ${d.series.slice(0, 3).map((m, i) => `${m.nombre.toLowerCase()}, ${m.nTexto}${i ? '' : ' series'}`).join('; ')}.` : 'Con tus sesiones de Ascent, aquí aparecen tus series.'),
        noSabe: 'El número justo: de 10 a 20 es una convención donde se junta la mayor parte de la evidencia, no la cifra de un estudio.',
        e: { x: 'series por semana', y: 'progreso', conv: 'convención' },
      },
      fuerza: {
        corto: 'Fuerza de un día', cifra: '~3 %',
        frase: 'Lo que tu fuerza cambia de un día a otro. Moss mira 12 semanas.',
        ti: (d) => (d.sentB ? `Tu sentadilla: de ${d.sentA} a ${d.sentB} kg en 12 semanas. Un día con ${d.sentRuido} kg más o menos no dice nada.` : 'Con tus sesiones de Ascent, aquí aparece tu tendencia.'),
        noSabe: 'Si una sesión floja fue un mal día o algo más: con menos de 12 semanas, todavía no se sabe.',
        e: { franja: '±3 %', tendencia: '+1 % por mes', semanas: '12 semanas' },
      },
      fatiga: {
        corto: 'Fatiga muscular', cifra: '±1 día',
        frase: 'Lo que puede errar el día en que un músculo vuelve a estar listo.',
        ti: (d) => (d.haceDias != null ? `Hoy toca ${d.sesion.toLowerCase()}: la última vez fue hace ${d.haceDias} días, y hoy figura como ${d.estadoMusculos}.` : 'Con tus sesiones de Ascent, aquí aparecen tus músculos.'),
        noSabe: 'Cómo te recuperas tú: ningún modelo está validado en una persona, y cambia mucho de una a otra.',
        e: { cargado: (d) => d.tx('ascent.decide.estados.cargado'), recuperandose: (d) => d.tx('ascent.decide.estados.recuperandose'), listo: (d) => d.tx('ascent.decide.estados.recuperado'), entrenas: 'Entrenas', dia: 'día {n}', margen: '±1 día' },
      },
      puntaje: {
        corto: 'Sin porcentaje', cifra: '— %', u: 'de recuperación',
        frase: 'Ningún puntaje de reloj o anillo está validado. Ves tus datos.',
        ti: (d) => (d.estadoMusculos ? `Hoy ves cada cosa por separado: tu noche fue ${d.estadoNoche} y lo que entrenas hoy figura como ${d.estadoMusculos}.` : `Hoy ves cada cosa por separado: tu noche fue ${d.estadoNoche}.`),
        noSabe: 'Cómo sumar sueño, músculos y comida en un solo número: nadie lo probó contra lo que rindes.',
        e: { nada: 'ninguno está validado' },
      },
      cuidados: {
        corto: 'Con un cuidado', cifra: '0', u: 'kcal de déficit',
        frase: 'Con embarazo, enfermedad renal, un trastorno de la alimentación u otra condición.',
        ti: (d) => (d.baja ? `No marcaste ningún cuidado: tu meta lleva su déficit, de ${d.deficit} kcal. Con diabetes o colesterol alto también lo llevaría: bajar de peso es parte de su guía.` : 'No marcaste ningún cuidado.'),
        nota: 'Con la lactancia, sin déficit las primeras 6 semanas; después, suave y nunca por debajo de 1.800 kcal.',
        noSabe: 'Tu caso: los cambios son generales. Las metas que te dé tu equipo de salud se ponen a mano.',
        e: { sin: 'Sin cuidados', sinN: (d) => (d.baja ? `−${d.deficit} kcal` : ''), sigue: 'Con diabetes o colesterol alto', con: 'Con embarazo o enfermedad renal', conN: '0 kcal' },
      },
      privado: {
        corto: 'Solo en tu iPhone', cifra: 'Solo aquí',
        frase: 'Qué cuidado marcas se guarda en este iPhone. No sube a tu cuenta.',
        ti: () => 'No marcaste ninguno. Si lo haces, su nombre tampoco aparece en avisos, en widgets ni en la pantalla bloqueada.',
        noSabeTitulo: 'Lo que sí sube',
        noSabe: 'Solo lo que se deriva, como que tu meta va sin déficit. Nunca el nombre.',
        e: { iphone: 'Este iPhone', cuenta: 'Tu cuenta' },
      },
    },
  },
  en: {
    respuesta: ['Moss works from what you log and from reviewed studies.', 'Where there’s no evidence, it says so.'],
    cuantas: '{cifras} figures · {fuentes} sources',
    cifrasTitulo: 'One figure per topic',
    cifrasAyuda: 'Tap one to see where it comes from and what it says about you.',
    todo: 'All',
    areas: { comida: 'Food', peso: 'Weight', sueno: 'Sleep', avisos: 'Reminders', entreno: 'Training', cuidados: 'Care' },
    paraTi: 'For you',
    noSabe: 'What isn’t known',
    cerrar: 'Close',
    verCifra: 'See the figure',
    pc: (n) => `${n}%`,
    diaYMes: (num, mes) => `${mes} ${num}`,
    porque: {
      titulo: 'Why is it telling me this?',
      intro: 'Under everything Moss tells you: your data, the rule and what’s known.',
      nudos: ['Your data', 'The rule', 'What’s known'],
      enAscent: 'In Ascent',
      enInicio: 'On Home',
      noche: { abrir: () => 'Why is it telling me this?', dato: 'slept last night', regla: ['6 h', 'or less counts as a short night'], sabe: ['−10%', '', 'reps on little sleep. Maximal strength barely changes.'] },
      meta: { abrir: (d) => `Why ${d.meta} kcal?`, dato: 'burned a day, measured from your weigh-ins', regla: (d) => (d.baja ? `to lose ${d.pct}% of your weight a week` : 'your goal is what you burn'), sabe: ['3–4', 'weeks', 'of weigh-ins and the math is solid: it was checked against the lab.'] },
    },
    fichas: {
      gasto: {
        corto: 'Starting burn', cifra: '±10%',
        frase: 'How far off the formula for your burn can be. Sometimes more.',
        ti: (d) => `Your first number came from that formula. Today Moss uses what it measures from your weight: about ${d.gasto} kcal a day.`,
        noSabe: 'Your exact burn. At rest, the formula lands within that margin for about 8 in 10 people; for fewer among athletes and older adults.',
        e: { reposo: 'At rest', dia: 'Your day', entreno: 'Training', margen: '±10% or more' },
      },
      control: {
        corto: 'Weekly check-in', cifra: '3–4', u: 'weeks',
        frase: 'Of frequent weigh-ins, and your measured burn becomes solid.',
        ti: (d) => (d.baja ? `You’re ${d.semanas} weeks in. You burn about ${d.gasto} kcal; to lose ${d.pct}% a week, your goal is ${d.meta}.` : `You’re ${d.semanas} weeks in. You burn about ${d.gasto} kcal, and your goal is ${d.meta}.`),
        noSabe: 'What isn’t logged: the math comes from your food and your weight, and a half-logged day shifts it.',
        e: { formula: 'Formula', peso: 'From your weight', semana: 'wk {n}', gastas: 'You burn', meta: 'Your goal' },
      },
      proteina: {
        corto: 'Protein', cifra: '1.6–2.2', u: 'g/kg',
        frase: 'Of protein a day if you train. Never below 1.2.',
        ti: (d) => `Your goal: ${d.proteina} g a day, ${d.gkgTexto} g for each of your ${d.kg} kg.`,
        noSabe: 'Whether going past 1.6 adds anything: 2.2 is the top of the study’s margin, not an optimum.',
        e: { piso: 'never below', tu: 'Your goal' },
      },
      foto: {
        corto: 'Food photos', cifra: '36–64%',
        frase: 'How far off three AIs were on a plate’s calories from a photo.',
        ti: (d) => `Today you logged ${d.comidoTexto} kcal by picking each food and its portion: its margin is the label’s.`,
        noSabe: 'How much better picking from a database is: nobody has compared it head-to-head with a photo, using weighed food.',
        e: { etiqueta: 'A label', etiquetaN: 'up to 20%', foto: 'A photo', fotoN: '36–64%' },
      },
      peso: {
        corto: 'One day’s weight', cifra: '±0.5', u: 'kg',
        frase: 'How much weight swings day to day. So Moss looks at the trend.',
        ti: (d) => (d.pesoMin ? `This week your weigh-ins ran from ${d.pesoMin} to ${d.pesoMax} kg. The line, your rate: ${d.ritmoKg} kg a week.` : `Your trend: ${d.tendencia} kg.`),
        noSabe: 'On any single day, how much of it is water: one number alone says nothing.',
        e: { franja: '±0.5 kg', hoy: 'today', antes: '30 days ago' },
      },
      ritmo: {
        corto: 'Top rate', cifra: '1%', u: 'a week',
        frase: 'Of your weight, at most: how fat is lost while protecting muscle.',
        ti: (d) => (d.baja ? `Your plan: ${d.pct}% a week, about ${d.planG} g. You’re at ${d.ritmoKg} kg a week.` : 'You’re not losing weight right now: the limit applies when you choose to.'),
        noSabe: 'With a lot of weight to lose, whether you can go faster without losing more muscle: studies disagree.',
        e: { tu: 'Your plan', tope: 'limit' },
      },
      plazo: {
        corto: 'Arrival date', cifra: '4–6', u: 'weeks',
        frase: 'Of weigh-ins before saying when you’ll arrive. A range, not a day.',
        ti: (d) => (d.plazo ? `At your rate, you’d reach ${d.metaKg} kg between ${d.llegaDesde} and ${d.llegaHasta}.` : 'There’s no range yet: it shows up after a few weeks of weigh-ins.'),
        noSabe: 'The exact day. With weight’s noise, a single date would rarely be right.',
        e: { hoy: 'Today' },
      },
      grasa: {
        corto: 'Tape body fat', cifra: '±4', u: 'points',
        frase: 'How far a tape measure can be from a lab scan. Or more.',
        ti: (d) => (d.grasa != null ? `Your estimate: about ${d.grasaTexto}%, between ${d.grasaA} and ${d.grasaB}.` : 'With your waist and neck measurements, your estimate shows up here.'),
        noSabe: 'Whether a small change is real. To see how your body is changing, your waist works better.',
        e: { tu: (d) => (d.grasa != null ? `about ${d.grasaTexto}%` : '') },
      },
      cintura: {
        corto: 'Waist', cifra: '0.5', u: 'of your height',
        frase: 'Your waist, below that: what the NICE guideline recommends.',
        ti: (d) => (d.cintura ? `${d.cinturaTexto} cm waist at ${d.altura} cm tall: ${d.caTexto}, below ${d.medio}.` : 'With your waist measured, your number shows up here.'),
        noSabe: 'Your exact number: depending on where you measure, it shifts about 2 cm in women and barely at all in men. Always measure in the same spot.',
        e: { altura: 'Height', cintura: 'Waist', mitad: 'half' },
      },
      imc: {
        corto: 'Lowest weight', cifra: '18.5', u: 'BMI',
        frase: 'Moss never accepts a goal weight below this index.',
        ti: (d) => `At your height that’s ${d.pesoMinimo} kg. Your goal, ${d.metaKg} kg, sits above it.`,
        noSabe: 'Where your best weight is: 18.5 is only the WHO’s threshold, not a target.',
        e: { meta: 'Your goal', hoy: 'Today' },
      },
      horas: {
        corto: 'Hours of sleep', cifra: '7 h', u: 'or more',
        frase: 'What guidelines ask of an adult. Moss starts at 8; you can change it.',
        ti: (d) => `Your need: ${d.necTexto}. Last night, ${d.anoche}.`,
        noSabe: 'How much you need: it varies from person to person, and there’s no way to measure it at home.',
        e: { nec: (d) => `You need ${d.necTexto}`, anoche: (d) => `Last night, ${d.anocheCorta}` },
      },
      reloj: {
        corto: 'Your watch', cifra: '>90%',
        frase: 'Of sleep is detected by a watch. Sleep stages are much less accurate.',
        ti: (d) => (d.nocheDesde ? `Last night: ${d.anoche}, from ${d.nocheDesde} to ${d.nocheHasta}. That’s reliable; your stages are an estimate.` : `Last night: ${d.anoche}. That’s reliable; your stages are an estimate.`),
        noSabe: 'Your stages: in deep sleep, a watch can be off by 25 to 43 minutes.',
        e: { firme: 'How long and when', borroso: 'Stages, blurry' },
      },
      deuda: {
        corto: 'Sleep debt', cifra: '14', u: 'nights',
        frase: 'What you fell short on each one. Recent nights count more.',
        ti: (d) => (d.deuda ? `Your debt: about ${d.deuda} (${d.deudaPalabra}). You sleep about ${d.duermes} of the ${d.necTexto} you need.` : 'With five nights, your debt shows up here.'),
        noSabe: 'The number: even with a watch it isn’t known to within ±3 h. That’s why it comes with a word.',
        e: { nec: (d) => `You need ${d.necTexto}`, anoche: 'last night', antes: '2 weeks ago' },
      },
      regularidad: {
        corto: 'Regular schedule', cifra: '60,977', u: 'people',
        frase: 'In the study where a regular schedule was linked to health.',
        ti: (d) => (d.semana7 ? `You fall asleep within about ${d.desvioD} min from night to night and wake within about ${d.desvioW}: ${d.regular}.` : 'With eight nights, your regularity shows up here.'),
        noSabe: 'Whether regularity improves health or just goes with it: it’s an observational study.',
        e: { dormir: 'Asleep', despertar: 'Awake' },
      },
      calidad: {
        corto: 'Sleep quality', cifra: '50 · 30 · 20',
        frase: 'Duration, schedule and continuity: Moss chose the weights.',
        ti: (d) => (d.calidad == null ? 'With one measured night, your quality shows up here.' : `Last night: ${d.calidad} out of 100. It’s there to show how you’re doing: it doesn’t change today.`),
        noSabe: 'No study validates those weights, or any watch’s. It’s for spotting trends, not a measurement.',
        e: { duracion: 'Duration', horario: 'Schedule', continuidad: 'Continuity', anoche: 'Last night', de: '{n} of {de}' },
      },
      cafe: {
        corto: 'Last coffee', cifra: '9 h', u: 'before bed',
        frase: 'A coffee stops costing you sleep. With more caffeine, up to 13 h.',
        ti: (d) => (d.cama ? `Today, bed at ${d.cama}: last coffee by ${d.corte}.` : 'With your nights, your time shows up here.'),
        noSabe: 'How long it lasts in you: caffeine drops by half in 3 to 6 hours, and in some people, 8.',
        e: { corte: (d) => `Last coffee ${d.corte || ''}`, cama: (d) => `Bed ${d.cama || ''}`, mitad: 'drops by half in 3 to 6 h', mas: 'with more caffeine, 13 h' },
      },
      periodo: {
        corto: 'Melatonin window', cifra: '±1 h',
        frase: 'The margin of your melatonin window: it comes from your schedule.',
        ti: (d) => (d.periodo ? `Tonight, ${d.perDesde} to ${d.perHasta}. Your reminders come from it: coffee until ${d.corte} and lights at ${d.luces}.` : 'With three nights this week, your window shows up here.'),
        noSabe: 'Your actual melatonin: with bright light or screens late, it arrives later.',
        e: { cafe: 'last coffee', comida: 'last big meal', luces: 'lights', cama: 'bed', periodo: 'your window' },
      },
      luces: {
        corto: 'Lights', cifra: '3 h', u: 'before bed',
        frase: 'Low light, says a consensus. Moss reminds you at an hour and a half.',
        ti: (d) => (d.cama ? `Today, the reminder at ${d.luces}. What the consensus asks: low light from ${d.luces3}.` : 'With your nights, your time shows up here.'),
        noSabe: 'How much light affects you: sensitivity varies a lot from person to person.',
        e: { consenso: (d) => ['3 h: the consensus', d.luces3].filter(Boolean).join(' · '), aviso: (d) => ['1 h 30: the reminder', d.luces].filter(Boolean).join(' · '), cama: (d) => (d.cama ? `Bed ${d.cama}` : 'bed') },
      },
      comer: {
        corto: 'Eating and training', cifra: '1–4 h', u: 'before training',
        frase: 'Your meal. And afterwards, protein in the meal that follows.',
        ti: (d) => (d.entreno ? `Today you train at ${d.entreno}: your meal before, between ${d.comerA} and ${d.comerB}.` : 'With your training schedule, your times show up here.'),
        noSabe: 'The exact minute matters little: what counts most is the whole day’s protein.',
        e: { antes: 'Eat', entreno: (d) => `Train ${d.entreno || ''}`, despues: 'Protein' },
      },
      noche: {
        corto: 'Short night', cifra: '−10%',
        frase: 'Reps after sleeping 6 h or less. Maximal strength, about the same.',
        ti: (d) => `Last night, ${d.anoche}: that’s why today it says “without going to failure”.`,
        noSabe: 'How much sleeping badly matters, not just sleeping little: nearly every study measured hours.',
        e: { fuerza: 'Maximal strength', fuerzaN: '−3%', reps: 'Reps', repsN: '−10%' },
      },
      series: {
        corto: 'Weekly sets', cifra: '10–20', u: 'sets',
        frase: 'Per muscle and week, Moss’s range. More sets, more progress; less each time.',
        ti: (d) => (d.series.length ? `This week: ${d.series.slice(0, 3).map((m, i) => `${m.nombre.toLowerCase()}, ${m.nTexto}${i ? '' : ' sets'}`).join('; ')}.` : 'With your Ascent sessions, your sets show up here.'),
        noSabe: 'The exact number: 10 to 20 is a convention where most of the evidence meets, not one study’s figure.',
        e: { x: 'sets a week', y: 'progress', conv: 'convention' },
      },
      fuerza: {
        corto: 'One day’s strength', cifra: '~3%',
        frase: 'How much your strength moves day to day. Moss looks at 12 weeks.',
        ti: (d) => (d.sentB ? `Your squat: from ${d.sentA} to ${d.sentB} kg in 12 weeks. A day ${d.sentRuido} kg up or down says nothing.` : 'With your Ascent sessions, your trend shows up here.'),
        noSabe: 'Whether a weak session was a bad day or something more: with less than 12 weeks, it isn’t known yet.',
        e: { franja: '±3%', tendencia: '+1% a month', semanas: '12 weeks' },
      },
      fatiga: {
        corto: 'Muscle fatigue', cifra: '±1 day',
        frase: 'How far off the day a muscle is ready again can be.',
        ti: (d) => (d.haceDias != null ? `Today is ${d.sesion.toLowerCase()}: the last time was ${d.haceDias} days ago, and today it shows as ${d.estadoMusculos}.` : 'With your Ascent sessions, your muscles show up here.'),
        noSabe: 'How you recover: no model has been validated on one person, and it varies a lot between people.',
        e: { cargado: (d) => d.tx('ascent.decide.estados.cargado'), recuperandose: (d) => d.tx('ascent.decide.estados.recuperandose'), listo: (d) => d.tx('ascent.decide.estados.recuperado'), entrenas: 'You train', dia: 'day {n}', margen: '±1 day' },
      },
      puntaje: {
        corto: 'No score', cifra: '—%', u: 'recovery',
        frase: 'No watch or ring score is validated. You see your data instead.',
        ti: (d) => (d.estadoMusculos ? `Today you see each thing on its own: your night was ${d.estadoNoche}, and what you train today shows as ${d.estadoMusculos}.` : `Today you see each thing on its own: your night was ${d.estadoNoche}.`),
        noSabe: 'How to add sleep, muscles and food into one number: nobody has tested it against performance.',
        e: { nada: 'none is validated' },
      },
      cuidados: {
        corto: 'With a condition', cifra: '0', u: 'kcal deficit',
        frase: 'With pregnancy, kidney disease, an eating disorder or another condition.',
        ti: (d) => (d.baja ? `You haven’t marked any condition: your goal carries its deficit, ${d.deficit} kcal. With diabetes or high cholesterol it still would: losing weight is part of their guidelines.` : 'You haven’t marked any condition.'),
        nota: 'While breastfeeding, no deficit for the first 6 weeks; after that, a gentle one, never below 1,800 kcal.',
        noSabe: 'Your case: the changes are general. You can enter the goals your care team gives you.',
        e: { sin: 'No conditions', sinN: (d) => (d.baja ? `−${d.deficit} kcal` : ''), sigue: 'With diabetes or high cholesterol', con: 'With pregnancy or kidney disease', conN: '0 kcal' },
      },
      privado: {
        corto: 'Only on your iPhone', cifra: 'Only here',
        frase: 'Which condition you mark stays on this iPhone, not in your account.',
        ti: () => 'You haven’t marked any. If you do, its name won’t show in reminders, widgets or on the lock screen either.',
        noSabeTitulo: 'What does sync',
        noSabe: 'Only what follows from it, like your goal having no deficit. Never the name.',
        e: { iphone: 'This iPhone', cuenta: 'Your account' },
      },
    },
  },
};

// Sobria: casi negro, tinta clara y un solo acento, el oro claro. Nada de verde.
const CSS = `
.tel .pr-pantalla.bd { background: #05060a; }
.bd-fondo { position: absolute; inset: 0; }
.bd-nav { position: absolute; z-index: 2; left: 0; right: 0; top: 0; height: calc(var(--arriba) + 56px); padding: var(--arriba) 6px 12px; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; background: linear-gradient(180deg, #05060a calc(100% - 14px), rgba(5, 6, 10, 0)); pointer-events: none; }
.bd-nav > * { pointer-events: auto; }
.bd-atras { appearance: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 1px; min-height: 44px; margin: 0; padding: 0 10px 0 2px; border: 0; background: none; color: #e8c46a; font: 400 16px/1 var(--texto); }
.bd-atras svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.bd-atras:active { opacity: 0.6; }
.bd-nav h2 { margin: 0; font: 500 15.5px/1 var(--numeros); color: var(--tinta); white-space: nowrap; }
.bd-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: calc(var(--arriba) + 52px) 16px calc(var(--pestanas) + 46px); }
.bd-scroll::-webkit-scrollbar, .bd-filtro::-webkit-scrollbar, .bd-capa-dentro::-webkit-scrollbar { display: none; }
.bd-etq { display: block; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(239, 230, 207, 0.55); }
.bd-respuesta { margin: 0 2px; font: 400 19px/1.3 var(--numeros); letter-spacing: -0.005em; color: var(--tinta); text-wrap: balance; }
.bd-respuesta em { display: block; font-style: normal; color: var(--oro-claro); }
.bd-revisado { margin: 8px 2px 0; font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.62); font-variant-numeric: tabular-nums; }

/* El sello, siempre igual: cuatro puntos y su nombre. */
.bd-puntos { display: inline-flex; flex: none; gap: 3px; }
.bd-puntos i { width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(239, 230, 207, 0.42); }
.bd-puntos[data-n='4'] i, .bd-puntos[data-n='3'] i:nth-child(-n+3), .bd-puntos[data-n='2'] i:nth-child(-n+2), .bd-puntos[data-n='1'] i:first-child { background: var(--oro-claro); box-shadow: none; }
.bd-sello { display: inline-flex; align-items: center; gap: 7px; font: 400 12.5px/1 var(--texto); color: rgba(239, 230, 207, 0.72); white-space: nowrap; }
.bd-sello b { font-weight: 400; }

/* Cuánto confiar: los cuatro sellos como columnas y cada cifra, una píldora en la suya. */
.bd-confiar { margin-top: 14px; padding: 12px 10px 10px; border-radius: 20px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(8, 12, 26, 0.72); }
.bd-confiar > .bd-etq { margin: 0 4px; }
.bd-columnas { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: 50px; grid-auto-rows: 36px; gap: 4px 6px; margin-top: 10px; }
.bd-col-cab { grid-row: 1; display: grid; grid-template-columns: 1fr auto; align-items: center; align-content: start; row-gap: 6px; height: 50px; padding: 0 3px; }
.bd-col-cab b { font: 400 12.5px/1 var(--numeros); color: rgba(239, 230, 207, 0.55); font-variant-numeric: tabular-nums; }
.bd-col-cab > span:last-child { grid-column: 1 / -1; font: 400 12.5px/1.12 var(--texto); color: var(--tinta); }
.bd-pildora { position: relative; appearance: none; cursor: pointer; display: grid; place-items: center; min-width: 0; margin: 0; padding: 0 4px; border-radius: 12px; border: 1px solid rgba(239, 230, 207, 0.3); background: rgba(239, 230, 207, 0.04); color: rgba(239, 230, 207, 0.94); font: 400 12.5px/1.1 var(--texto); text-align: center; text-wrap: balance; transition: transform 0.15s ease; }
.bd-pildora::before { content: ''; position: absolute; inset: -4px 0; }
.bd-pildora:active { transform: scale(0.95); }
.bd-pildora.solido { border-color: rgba(246, 227, 166, 0.55); background: rgba(246, 227, 166, 0.09); }
.bd-pildora.estimacion { border-style: dashed; border-color: rgba(239, 230, 207, 0.46); background: none; }
.bd-pildora.decision { border-style: dotted; border-color: rgba(239, 230, 207, 0.6); background: none; }
.bd-leyenda { align-self: start; margin: 0; padding: 14px 2px 0 6px; list-style: none; display: grid; gap: 9px; }
.bd-leyenda.abajo { padding: 12px 4px 0; }
.bd-leyenda.abajo { margin-top: 14px; border-top: 1px solid rgba(239, 230, 207, 0.07); }
.bd-leyenda li { display: grid; gap: 4px; font: 400 12.5px/1.26 var(--texto); color: rgba(239, 230, 207, 0.64); text-wrap: pretty; }
.bd-leyenda.abajo li { grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 0 8px; }
.bd-confiar:not(.vista) .bd-pildora, .bd-confiar:not(.vista) .bd-leyenda { opacity: 0; }
.bd-confiar.vista .bd-pildora { animation: bd-cae 0.44s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 24ms + 140ms); }
.bd-confiar.vista .bd-leyenda { animation: bd-ap 0.6s ease 0.85s backwards; }
@keyframes bd-cae { from { opacity: 0; transform: translateY(-9px); } }

/* Una cifra por tema: el filtro, que queda arriba, y la retícula. */
.bd-seccion { margin-top: 30px; }
.bd-seccion > .bd-etq { margin: 0 4px; }
.bd-ayuda { margin: 6px 4px 0; font: 400 13.5px/1.36 var(--texto); color: rgba(239, 230, 207, 0.62); text-wrap: pretty; }
.bd-filtro { position: sticky; z-index: 1; top: -8px; display: flex; gap: 6px; margin: 4px -16px 2px; padding: 9px 16px 11px; overflow-x: auto; scrollbar-width: none; background: linear-gradient(180deg, #05060a 80%, rgba(5, 6, 10, 0)); }
.bd-filtro button { position: relative; flex: none; appearance: none; cursor: pointer; min-height: 34px; margin: 0; padding: 0 13px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.14); background: rgba(239, 230, 207, 0.03); color: rgba(239, 230, 207, 0.72); font: 400 13.5px/1 var(--texto); transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease; }
.bd-filtro button::before { content: ''; position: absolute; inset: -5px 0; }
.bd-filtro button[aria-pressed='true'] { border-color: rgba(246, 227, 166, 0.55); background: rgba(246, 227, 166, 0.13); color: var(--oro-claro); }
.bd-fichas { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; align-content: start; }
.bd-ficha { appearance: none; cursor: pointer; display: flex; flex-direction: column; align-items: stretch; min-width: 0; margin: 0; padding: 13px 13px 12px; border-radius: 20px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(8, 12, 26, 0.72); color: var(--tinta); text-align: left; transition: border-color 0.2s ease, transform 0.15s ease; }
.bd-ficha[hidden] { display: none; }
.bd-ficha:active { transform: scale(0.985); border-color: rgba(239, 230, 207, 0.22); }
.bd-ficha.sale { position: absolute; pointer-events: none; }
.bd-ficha > .bd-etq { font-size: 9.5px; }
.bd-cifra { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 6px; margin-top: 7px; font: 300 27px/1.08 var(--numeros); letter-spacing: -0.02em; color: #fbf2d9; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bd-cifra.larga { font-size: 23px; }
.bd-cifra small { font: 400 12.5px/1.25 var(--texto); letter-spacing: 0; color: rgba(239, 230, 207, 0.6); }
/* En la tarjeta, una unidad larga se parte al lado de la cifra y no debajo: los dibujos de una fila quedan parejos. */
.bd-ficha .bd-cifra { flex-wrap: nowrap; align-items: last baseline; }
.bd-ficha .bd-cifra small { min-width: 0; white-space: normal; text-wrap: balance; }
.bd-ficha .bd-dib { margin: 10px 0 9px; }
.bd-frase { display: block; margin: 0; font: 400 13px/1.34 var(--texto); color: rgba(239, 230, 207, 0.74); text-wrap: pretty; }
.bd-ficha .bd-sello { margin-top: auto; padding-top: 10px; }
.bd-no { margin: 12px 4px 0; padding: 0; list-style: none; display: grid; gap: 9px; }
.bd-no li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; font: 400 13.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.74); text-wrap: pretty; }
.bd-no li svg { width: 12px; height: 12px; margin-top: 4px; fill: none; stroke: rgba(239, 230, 207, 0.42); stroke-width: 1.8; stroke-linecap: round; }
.bd-no-titulo { margin: 30px 4px 0; }
.bd-pie { margin: 22px 4px 0; font: 400 13px/1.4 var(--texto); color: rgba(239, 230, 207, 0.62); }

/* Los dibujos: línea fina, tinta y oro. Entera lo firme; a rayas o borroso lo estimado; a puntos lo que decide Moss. */
.bd-dib { display: block; width: 100%; height: auto; overflow: visible; fill: none; }
.bd-dib .e { stroke: rgba(239, 230, 207, 0.22); stroke-width: 1; }
.bd-dib .l { stroke: rgba(239, 230, 207, 0.88); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.bd-dib .ls { stroke: rgba(239, 230, 207, 0.42); stroke-width: 1.2; stroke-linecap: round; }
.bd-dib .ld { stroke: rgba(239, 230, 207, 0.5); stroke-width: 1.2; stroke-dasharray: 3 3; }
.bd-dib .lp { stroke: rgba(239, 230, 207, 0.64); stroke-width: 1.5; stroke-dasharray: 0.1 4; stroke-linecap: round; }
.bd-dib .a { stroke: #f6e3a6; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.bd-dib .ad { stroke: #f6e3a6; stroke-width: 1.3; stroke-dasharray: 3 3; }
.bd-dib .ag { stroke: #f6e3a6; stroke-width: 4; stroke-linecap: round; }
.bd-dib .fb { fill: rgba(246, 227, 166, 0.15); }
.bd-dib .ft { fill: rgba(239, 230, 207, 0.08); }
.bd-dib .r { fill: rgba(239, 230, 207, 0.84); }
.bd-dib .rm { fill: rgba(239, 230, 207, 0.48); }
.bd-dib .rs { fill: rgba(239, 230, 207, 0.24); }
.bd-dib .rp { fill: rgba(239, 230, 207, 0.62); }
.bd-dib .ra { fill: #f6e3a6; }
.bd-dib .aro { fill: #0a0d18; stroke: rgba(239, 230, 207, 0.72); stroke-width: 1.3; }
.bd-dib .hueco { stroke: rgba(239, 230, 207, 0.38); stroke-width: 1; stroke-dasharray: 2.5 2.5; }
.bd-dib .falta { stroke: #f6e3a6; stroke-width: 1.2; stroke-dasharray: 2.5 2.5; }
.bd-dib .arco-s { stroke: rgba(239, 230, 207, 0.17); stroke-width: 6; }
.bd-dib .arco-f { stroke: rgba(246, 227, 166, 0.3); stroke-width: 6; }
.bd-dib .arco-p { stroke: #f6e3a6; stroke-width: 6; }
.bd-dib .punto { fill: #efe6cf; stroke: #0a0d18; stroke-width: 1.5; }
.bd-dib text { font: 400 11.5px var(--texto); fill: rgba(239, 230, 207, 0.6); stroke: none; }
.bd-dib text.n { font-family: var(--numeros); font-variant-numeric: tabular-nums; }
.bd-dib text.f { fill: rgba(239, 230, 207, 0.94); font-size: 12.5px; }
.bd-dib text.o { fill: #f6e3a6; font-size: 12.5px; }
/* Cada uno se traza una sola vez, al entrar en pantalla. */
.bd-dib .tz { stroke-dasharray: 1; }
.bd-dib .cx, .bd-dib .cy, .bd-dib .ct, .bd-dib .pt { transform-box: fill-box; }
.bd-dib .cx { transform-origin: left center; }
.bd-dib .cy { transform-origin: center bottom; }
.bd-dib .ct { transform-origin: center top; }
.bd-dib .pt { transform-origin: center; }
.bd-dib.espera > * { opacity: 0 !important; }
.bd-dib.vista .tz { animation: bd-tz 0.85s cubic-bezier(0.3, 0.6, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 80ms + 80ms); }
.bd-dib.vista .ap { animation: bd-ap 0.55s ease backwards; animation-delay: calc(var(--i, 0) * 80ms + 80ms); }
.bd-dib.vista .cx { animation: bd-cx 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 80ms + 80ms); }
.bd-dib.vista .cy, .bd-dib.vista .ct { animation: bd-cy 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 80ms + 80ms); }
.bd-dib.vista .pt { animation: bd-pt 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 80ms + 80ms); }
.bd-dib.vista text { animation: bd-ap 0.6s ease backwards; animation-delay: calc(var(--i, 9) * 80ms + 80ms); }
@keyframes bd-tz { from { stroke-dashoffset: 1; opacity: 0; } 12% { opacity: 1; } }
@keyframes bd-ap { from { opacity: 0; } }
@keyframes bd-cx { from { transform: scaleX(0); } }
@keyframes bd-cy { from { transform: scaleY(0); } }
@keyframes bd-pt { from { opacity: 0; transform: scale(0.2); } }

/* La ficha, crecida desde su marco hasta ocupar la pantalla. */
.bd-capa { position: absolute; inset: 0; z-index: 3; overflow: hidden; background: #0a0d18; }
.bd-capa[hidden] { display: none; }
.bd-capa::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--pestanas) + 40px); background: linear-gradient(180deg, rgba(10, 13, 24, 0), #0a0d18 72%); pointer-events: none; }
.bd-capa-dentro { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: calc(var(--arriba) + 12px) 18px calc(var(--pestanas) + 46px); transform-origin: 0 0; }
.bd-capa-clon { position: absolute; transform-origin: 0 0; pointer-events: none; }
.bd-capa-clon[hidden] { display: none; }
.bd-capa-clon > * { width: 100%; height: 100%; margin: 0; }
.bd-capa-cerrar { position: absolute; z-index: 2; right: 10px; top: calc(var(--arriba) + 2px); appearance: none; cursor: pointer; width: 44px; height: 44px; margin: 0; padding: 0; border: 0; background: none; display: grid; place-items: center; color: rgba(239, 230, 207, 0.8); }
.bd-capa-cerrar i { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: #1f2029; }
/* Lo que se desliza se apaga debajo de la hora, como abajo. */
.bd-capa::before { content: ''; position: absolute; z-index: 1; left: 0; right: 0; top: 0; height: calc(var(--arriba) + 6px); background: linear-gradient(180deg, #0a0d18 72%, rgba(10, 13, 24, 0)); pointer-events: none; }
.bd-capa-cerrar svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.bd-capa-dentro .bd-cifra { margin-top: 12px; font-size: 58px; line-height: 1; letter-spacing: -0.03em; gap: 2px 10px; }
.bd-capa-dentro .bd-cifra.larga { font-size: 44px; }
.bd-capa-dentro .bd-cifra small { font-size: 16px; }
.bd-capa-dentro .bd-frase { margin-top: 12px; font-size: 16px; line-height: 1.42; color: rgba(239, 230, 207, 0.88); }
.bd-capa-sello { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 10px; margin-top: 14px; font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.62); }
.bd-capa-sello .bd-sello { color: rgba(239, 230, 207, 0.92); }
.bd-lamina { margin-top: 18px; padding: 16px 14px 12px; border-radius: 18px; border: 1px solid rgba(239, 230, 207, 0.08); background: rgba(4, 6, 13, 0.6); }
.bd-lamina-nota { margin: 14px 2px 2px; padding-top: 11px; border-top: 1px solid rgba(239, 230, 207, 0.07); font: 400 13px/1.4 var(--texto); color: rgba(239, 230, 207, 0.74); text-wrap: pretty; }
.bd-bloque { margin-top: 20px; padding-left: 13px; border-left: 2px solid var(--oro-claro); }
.bd-bloque h5 { margin: 0 0 5px; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: var(--oro-claro); }
.bd-bloque p { margin: 0; font: 400 15.5px/1.42 var(--texto); color: var(--tinta); text-wrap: pretty; font-variant-numeric: tabular-nums; }
.bd-bloque.duda { border-left: 2px dashed rgba(239, 230, 207, 0.36); }
.bd-bloque.duda h5 { color: rgba(239, 230, 207, 0.62); }
.bd-bloque.duda p { font-size: 14.5px; color: rgba(239, 230, 207, 0.78); }
.bd-fuentes { margin-top: 22px; border-top: 1px solid rgba(239, 230, 207, 0.07); }
.bd-fuentes-cab { appearance: none; cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%; min-height: 44px; margin: 0; padding: 0; border: 0; background: none; color: rgba(239, 230, 207, 0.66); font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; text-align: left; }
.bd-fuentes-cab svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.3s ease; }
.bd-fuentes.abiertas .bd-fuentes-cab svg { transform: rotate(90deg); }
.bd-fuentes-dentro { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.34s cubic-bezier(0.2, 0.7, 0.2, 1); }
.bd-fuentes.abiertas .bd-fuentes-dentro { grid-template-rows: 1fr; }
.bd-fuentes-dentro > ol { min-height: 0; overflow: hidden; margin: 0; padding: 0; list-style: none; display: grid; gap: 11px; }
.bd-fuentes.abiertas .bd-fuentes-dentro > ol { padding-bottom: 8px; }
.bd-cita a { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 6px; min-height: 44px; color: inherit; text-decoration: none; transition: opacity 0.15s ease; }
.bd-cita a:active { opacity: 0.6; }
.bd-cita-n { font: 500 11.5px/1.5 var(--numeros); color: var(--oro-claro); font-variant-numeric: tabular-nums; }
.bd-cita b { display: block; font: 500 13px/1.35 var(--texto); color: var(--tinta); }
.bd-cita em { display: block; margin-top: 2px; font: normal 400 13px/1.35 var(--texto); color: rgba(239, 230, 207, 0.66); }
.bd-cita-url { display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 12.5px/1.35 var(--texto); color: rgba(239, 230, 207, 0.66); text-decoration: underline; text-decoration-color: rgba(239, 230, 207, 0.26); text-underline-offset: 3px; }

/* ¿Por qué me dice esto?: dónde va (dos ejemplos) y la cadena, que se dibuja de izquierda a derecha. */
.bd-pq { display: grid; gap: 22px; margin-top: 16px; }
.bd-caso > .bd-etq { margin: 0 4px 8px; }
.bd-contexto { padding: 16px 16px 15px; border-radius: 20px 20px 0 0; border: 1px solid rgba(239, 230, 207, 0.09); border-bottom: 0; background: rgba(8, 12, 26, 0.72); }
.bd-porque { border-radius: 0 0 20px 20px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(8, 12, 26, 0.72); }
.bd-de-ascent .bd-contexto, .bd-de-ascent .bd-porque { background: #07080d; border-color: var(--as-linea); }
.bd-de-ascent .bd-contexto span { display: block; font: 500 10.5px/1 var(--texto); letter-spacing: 0.2em; text-transform: uppercase; color: var(--as-apagado); }
.bd-de-ascent .bd-contexto h4 { margin: 11px 0 0; font: 300 26px/1.1 var(--numeros); letter-spacing: -0.01em; color: var(--as-tinta); text-wrap: balance; }
.bd-de-ascent .bd-contexto p { margin: 8px 0 0; font: 400 14px/1.4 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.bd-contexto .in-cal-arriba { gap: 16px; }
.bd-contexto .in-cal-cifra b { font-size: 42px; }
.bd-porque-abrir { appearance: none; cursor: pointer; width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; padding: 0 16px; border: 0; background: none; color: #e8c46a; font: 400 14.5px/1.2 var(--texto); text-align: left; }
.bd-porque-abrir svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.3s ease; }
.bd-porque.abierta .bd-porque-abrir svg { transform: rotate(180deg); }
.bd-cadena-caja { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.bd-porque.abierta .bd-cadena-caja { grid-template-rows: 1fr; }
.bd-cadena-caja > div { min-height: 0; overflow: hidden; }
.bd-cadena { display: grid; grid-template-columns: 0.94fr 0.94fr 1.3fr; column-gap: 12px; padding: 6px 16px 2px; }
.bd-nudo { position: relative; min-width: 0; padding-top: 18px; }
.bd-nudo::before { content: ''; position: absolute; left: 0; top: 1px; width: 8px; height: 8px; border-radius: 50%; background: var(--oro-claro); }
.bd-nudo::after { content: ''; position: absolute; left: 12px; right: -8px; top: 4.5px; height: 1px; background: rgba(246, 227, 166, 0.5); transform-origin: left center; }
.bd-nudo:last-child::after { display: none; }
.bd-nudo .bd-etq { font-size: 9.5px; letter-spacing: 0.13em; }
.bd-nudo > b { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 4px; margin-top: 7px; font: 300 23px/1.05 var(--numeros); letter-spacing: -0.02em; color: #fbf2d9; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bd-nudo > b small { font: 400 12px/1.2 var(--texto); letter-spacing: 0; color: rgba(239, 230, 207, 0.6); }
.bd-nudo > p { margin: 5px 0 0; font: 400 13px/1.32 var(--texto); color: rgba(239, 230, 207, 0.76); text-wrap: pretty; }
/* Los tres dibujitos del mismo alto, aunque la última columna sea más ancha. */
.bd-nudo .bd-dib { height: 19px; margin-top: 9px; }
.bd-nudo .bd-sello { margin-top: 9px; font-size: 12px; }
.bd-nudo cite { display: block; margin-top: 5px; font: normal 400 12px/1.3 var(--texto); color: rgba(239, 230, 207, 0.62); }
.bd-ver { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: 0 0 2px 10px; padding: 0 6px; border: 0; background: none; color: #e8c46a; font: 400 14px/1 var(--texto); }
.bd-ver svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.bd-cadena:not(.vista) .bd-nudo > *, .bd-cadena:not(.vista) .bd-nudo::before { opacity: 0; }
.bd-cadena:not(.vista) .bd-nudo::after { transform: scaleX(0); }
.bd-cadena.vista .bd-nudo::before { animation: bd-pt 0.36s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 420ms + 160ms); }
.bd-cadena.vista .bd-nudo::after { animation: bd-cx 0.42s ease-out backwards; animation-delay: calc(var(--i) * 420ms + 280ms); }
.bd-cadena.vista .bd-nudo > * { animation: bd-sube 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 420ms + 240ms); }
@keyframes bd-sube { from { opacity: 0; transform: translateY(6px); } }

@media (prefers-reduced-motion: reduce) {
  .bd-dib.vista *, .bd-confiar.vista .bd-pildora, .bd-confiar.vista .bd-leyenda, .bd-cadena.vista .bd-nudo::before, .bd-cadena.vista .bd-nudo::after, .bd-cadena.vista .bd-nudo > * { animation: none !important; }
  .bd-pildora, .bd-ficha, .bd-filtro button, .bd-fuentes-dentro, .bd-fuentes-cab svg, .bd-cadena-caja, .bd-porque-abrir svg { transition: none; }
}
`;

// ------------------------------------------------------------ los dibujos
// Cada uno recibe el lienzo (W × H), si es el grande (G, con rótulos), los datos de la persona (d), sus rótulos (t) y
// cómo se escriben los números (n, pc, dur); devuelve el SVG de adentro. Las clases dicen el trazo (CSS) y cómo entra:
// tz se traza, ap aparece, cx, cy y ct crecen, pt salta; --i es el turno.
let serieDeIds = 0;
// Cada dibujo, sus propios ids: una ficha oculta (display: none) dejaría sin relleno a las que usaran los suyos.
const uid = () => 'bd-g' + (++serieDeIds);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f1 = (n) => String(Math.round(n * 10) / 10);
const turno = (i) => (i == null ? '' : ` style="--i:${i}"`);
const largoUno = (c) => (/\btz\b/.test(c) ? ' pathLength="1"' : '');
const L = (x1, y1, x2, y2, c, i) => `<line${largoUno(c)} class="${c}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${turno(i)}/>`;
const P = (d, c, i) => `<path${largoUno(c)} class="${c}" d="${d}"${turno(i)}/>`;
const R = (x, y, w, h, c, i, rx) => `<rect${largoUno(c)} class="${c}" x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}"${rx ? ` rx="${rx}"` : ''}${turno(i)}/>`;
const C = (x, y, r, c, i) => `<circle${largoUno(c)} class="${c}" cx="${f1(x)}" cy="${f1(y)}" r="${r}"${turno(i)}/>`;
const T = (x, y, s, c, a, i) => (s ? `<text class="${c || ''}" x="${f1(x)}" y="${f1(y)}"${a ? ` text-anchor="${a}"` : ''}${turno(i)}>${esc(s)}</text>` : '');
const camino = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('');
/** Un rectángulo rayado en diagonal: lo que queda afuera. */
const rayas = (x, y, w, h, c, i, paso = 5) => {
  let d = '';
  for (let o = -h + 2; o < w; o += paso) d += `M${f1(x + Math.max(o, 0))} ${f1(y + h + Math.min(o, 0))}L${f1(x + Math.min(o + h, w))} ${f1(y + Math.max(0, o + h - w))}`;
  return w > 1 ? `<path class="${c}" d="${d}"${turno(i)}/>` : '';
};
/** Un degradado que nace y muere en nada: el borde borroso de lo estimado. */
const niebla = (id, color = '#f6e3a6', fuerza = 0.6) => `<defs><linearGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity="${fuerza}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
const lleno = (id, x, y, w, h, c, i, rx) => `<rect class="${c}" x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}"${rx ? ` rx="${rx}"` : ''} fill="url(#${id})"${turno(i)}/>`;
const lados = (k) => [k.G ? 6 : 3, k.W - (k.G ? 6 : 3)];
const entre = (v, a, b) => Math.min(b, Math.max(a, v));

const DIBUJOS = {
  // El gasto de partida: en reposo, tu día y entrenar; el final, borroso (±10 % o más).
  gasto({ W, H, G, d, t }) {
    const x0 = G ? 6 : 3, x1 = W - (G ? 40 : 18), largo = x1 - x0, alto = G ? 26 : 16, y = G ? 70 : (H - alto) / 2;
    const a = x0 + largo * d.partes.reposo, b = a + largo * d.partes.dia, n = largo * 0.11, id = uid(), c3 = (b + x1) / 2;
    return niebla(id) + R(x0, y, a - x0 - 2, alto, 'r cx', 0, 4) + R(a, y, b - a - 2, alto, 'rm cx', 3, 4) + R(b, y, x1 - b, alto, 'rs cx', 5, 4)
      + lleno(id, x1 - n, y - 7, n * 2, alto + 14, 'ap', 8) + L(x1, y - 10, x1, y + alto + 10, 'a tz', 8)
      + (G ? T((x0 + a) / 2, y + alto + 20, t.reposo, '', 'middle') + T((a + b) / 2, y + alto + 20, t.dia, '', 'middle') + L(c3, y + alto + 4, c3, y + alto + 26, 'ls ap', 7) + T(c3 + 4, y + alto + 40, t.entreno, '', 'end') + T(W - 2, y - 18, t.margen, 'o', 'end') : '');
  },
  // El control de cada semana: de la franja ancha de la fórmula a una línea firme; debajo, el gasto, menos el déficit, la meta.
  control({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), yc = G ? 50 : H / 2, h0 = G ? 32 : 24, N = 28;
    const X = (u) => x0 + (x1 - x0) * u, mitad = (u) => h0 * Math.exp(-3.6 * u) + 0.8;
    const arriba = [], abajo = [];
    for (let i = 0; i <= N; i++) { const u = i / N; arriba.push([X(u), yc - mitad(u)]); abajo.unshift([X(u), yc + mitad(u)]); }
    let s = `<path class="fb ap" d="${camino([...arriba, ...abajo])}Z" style="--i:0"/>` + L(x0, yc, X(0.75), yc, 'ad ap', 2) + L(X(0.75), yc, x1, yc, 'a tz', 6);
    for (let w = 0; w <= 4; w++) s += C(X(w / 4), yc, G ? 3 : 2.4, (w >= 3 ? 'ra' : 'rp') + ' pt', 2 + w);
    if (!G) return s;
    s += T(x0, 12, t.formula) + T(x1, yc - 12, t.peso, 'o', 'end');
    for (let w = 1; w <= 4; w++) s += T(X(w / 4), yc + 36, t.semana.replace('{n}', w), 'n', w === 4 ? 'end' : 'middle');
    const yb = 114, fr = d.fraccionMeta, ancho = x1 - x0;
    s += R(x0, yb, ancho * fr - (d.baja ? 2 : 0), 18, 'r cx', 9, 4) + T(x0, yb - 7, `${t.meta} · ${d.meta} kcal`, 'f', null, 10);
    if (d.baja) s += R(x0 + ancho * fr + 1, yb, ancho * (1 - fr) - 1, 18, 'hueco ap', 11, 4) + rayas(x0 + ancho * fr + 2, yb + 1, ancho * (1 - fr) - 3, 16, 'ls ap', 11) + T(x1, yb - 7, `−${d.deficit}`, 'n', 'end', 11);
    return s + L(x0, yb + 27, x1, yb + 27, 'ls ap', 12) + L(x0, yb + 23, x0, yb + 31, 'ls ap', 12) + L(x1, yb + 23, x1, yb + 31, 'ls ap', 12) + T((x0 + x1) / 2, yb + 45, `${t.gastas} ${d.gasto} kcal`, '', 'middle', 12);
  },
  // La proteína por kilo: la franja de 1,6 a 2,2, el piso de 1,2 y tu marca.
  proteina({ W, H, G, d, t, n }) {
    const [x0, x1] = lados({ W, G }), y = G ? 88 : H / 2 + 2, b = G ? 13 : 9, X = (v) => x0 + ((v - 0.8) / 1.8) * (x1 - x0);
    return rayas(x0, y - b, X(1.2) - x0, b * 2, 'ls ap', 4) + R(X(1.6), y - b, X(2.2) - X(1.6), b * 2, 'fb cx', 1, b)
      + L(x0, y, x1, y, 'e tz', 0) + L(X(1.2), y - b - 4, X(1.2), y + b + 4, 'l tz', 3) + L(X(1.6), y - 4, X(1.6), y + 4, 'ls ap', 2) + L(X(2.2), y - 4, X(2.2), y + 4, 'ls ap', 2)
      + C(X(d.gkg), y, G ? 5 : 4, 'ra pt', 6)
      + (G ? T(X(1.2), y + b + 20, n(1.2, 1), 'n', 'middle') + T(X(1.6), y + b + 20, n(1.6, 1), 'n', 'middle') + T(X(2.2), y + b + 20, n(2.2, 1), 'n', 'middle') + T(x1, y + b + 20, 'g/kg', '', 'end')
        + T((x0 + X(1.2)) / 2, y - b - 10, t.piso, '', 'middle') + T(X(d.gkg), y - b - 10, `${t.tu} · ${d.gkgTexto}`, 'o', 'middle') : '');
  },
  // La foto contra la etiqueta, en la misma escala de error.
  foto({ W, H, G, t, pc }) {
    const [x0, x1] = lados({ W, G }), b = G ? 16 : 11, y1 = G ? 48 : H * 0.28, y2 = G ? 106 : H * 0.72, X = (v) => x0 + (v / 70) * (x1 - x0);
    return L(x0, y1, x1, y1, 'e tz', 0) + L(x0, y2, x1, y2, 'e tz', 0) + R(X(0), y1 - b / 2, X(20) - X(0), b, 'rm cx', 1, b / 2) + R(X(36), y2 - b / 2, X(64) - X(36), b, 'ra cx', 4, b / 2)
      + (G ? T(x0, y1 - b / 2 - 8, t.etiqueta, 'f') + T(x1, y1 - b / 2 - 8, t.etiquetaN, 'n', 'end') + T(x0, y2 - b / 2 - 8, t.foto, 'f') + T(x1, y2 - b / 2 - 8, t.fotoN, 'n o', 'end')
        + [0, 20, 40, 60].map((v) => L(X(v), y2 + b / 2 + 8, X(v), y2 + b / 2 + 12, 'ls ap', 6) + T(X(v), y2 + b / 2 + 27, v === 60 ? pc(v) : String(v), 'n', v ? 'middle' : 'start')).join('') : '');
  },
  // El peso de cada día, bailando dentro de ±0,5 kg alrededor de la tendencia: las pesadas de la persona.
  peso({ W, H, G, d, t, n }) {
    const [x0, x1] = lados({ W, G }), arriba = G ? 26 : 5, base = H - (G ? 30 : 5), s = d.serie.filter((p) => p.linea != null);
    if (s.length < 2) return '';
    const lo = Math.min(...s.map((p) => Math.min(p.linea - 0.5, p.punto == null ? 999 : p.punto))), hi = Math.max(...s.map((p) => Math.max(p.linea + 0.5, p.punto == null ? 0 : p.punto)));
    const X = (u) => x0 + u * (x1 - x0), Y = (v) => base - ((v - lo) / (hi - lo)) * (base - arriba), fin = s[s.length - 1], medio = s[Math.floor(s.length / 2)];
    return `<path class="fb ap" d="${camino([...s.map((p) => [X(p.x), Y(p.linea + 0.5)]), ...s.slice().reverse().map((p) => [X(p.x), Y(p.linea - 0.5)])])}Z" style="--i:0"/>`
      + s.filter((p) => p.punto != null).map((p, i) => C(X(p.x), Y(p.punto), G ? 2.3 : 1.7, 'rp pt', 2 + i * 0.3)).join('') + P(camino(s.map((p) => [X(p.x), Y(p.linea)])), 'a tz', 2)
      + (G ? T(x0, H - 6, t.antes) + T(x1, H - 6, t.hoy, '', 'end') + T(x0, Y(s[0].linea + 0.5) - 7, `${n(s[0].linea, 1)} kg`, 'n') + T(x1, Y(fin.linea + 0.5) - 7, `${n(fin.linea, 1)} kg`, 'n o', 'end') + T(X(medio.x), Y(medio.linea - 0.5) + 15, t.franja, '', 'middle') : '');
  },
  // El ritmo: los tres que propone Moss, el tuyo y el tope del 1 % por semana.
  ritmo({ W, H, G, d, t, n, pc }) {
    const [x0, x1] = lados({ W, G }), y = G ? 88 : H / 2 + 2, b = G ? 13 : 9, X = (v) => x0 + (v / 1.5) * (x1 - x0), plan = entre(d.plan || 0, 0, 1.4);
    return rayas(X(1), y - b, x1 - X(1), b * 2, 'ls ap', 4) + R(X(0.25), y - b, X(1) - X(0.25), b * 2, 'fb cx', 1, b) + L(x0, y, x1, y, 'e tz', 0) + L(X(1), y - b - 4, X(1), y + b + 4, 'l tz', 3)
      + [0.25, 0.5, 0.75].map((v) => C(X(v), y, G ? 3.4 : 2.6, 'aro pt', 5)).join('') + (plan ? C(X(plan), y, G ? 5 : 4, 'ra pt', 6) : '')
      + (G ? [0.25, 0.5, 0.75].map((v) => T(X(v), y + b + 20, n(v, v === 0.5 ? 1 : 2), 'n', 'middle')).join('') + T(X(1), y + b + 20, pc(1), 'n f', 'middle') + T(X(1) + 6, y - b - 10, t.tope) + (plan ? T(X(plan), y - b - 10, t.tu, 'o', 'middle') : '') : '');
  },
  // La meta con plazo: desde hoy, el ritmo con su margen se abre en un cono y toca la meta en una ventana, no en un día.
  plazo({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), arriba = G ? 28 : 6, base = H - (G ? 46 : 8);
    const p = d.plazo || { nivel: 75, meta: 71, antes: 75.8, temprana: 50, tardia: 73, metaTexto: '', rango: '', meses: [] };
    const d0 = -16, d1 = p.tardia + 12, X = (dia) => x0 + ((dia - d0) / (d1 - d0)) * (x1 - x0), Y = (kg) => arriba + ((p.antes - kg) / (p.antes - p.meta)) * (base - arriba);
    const hoy = [X(0), Y(p.nivel)], a = [X(p.temprana), base], b = [X(p.tardia), base];
    return L(x0, base, x1, base, 'ld ap', 0) + L(X(-14), Y(p.antes), hoy[0], hoy[1], 'l tz', 1) + `<path class="fb ap" d="${camino([hoy, b, a])}Z" style="--i:5"/>`
      + L(hoy[0], hoy[1], a[0], a[1], 'a tz', 3) + L(hoy[0], hoy[1], b[0], b[1], 'a tz', 4) + L(a[0], base, b[0], base, 'ag tz', 8) + C(hoy[0], hoy[1], G ? 3.6 : 2.8, 'r pt', 2)
      + (G ? T(hoy[0], hoy[1] - 11, t.hoy, 'f', 'middle') + T(x0, base - 8, p.metaTexto, 'n') + T((a[0] + b[0]) / 2, base + 19, p.rango, 'n o', 'middle')
        + p.meses.map((m) => L(X(m.dia), base + 28, X(m.dia), base + 33, 'ls ap', 6) + T(X(m.dia) + 4, base + 40, m.nombre)).join('') : '');
  },
  // La grasa con cinta: tu estimación en medio de una niebla de ±4 puntos.
  grasa({ W, H, G, d, t, n, pc }) {
    const [x0, x1] = lados({ W, G }), y = G ? 92 : H / 2 + 2, b = G ? 15 : 10, X = (v) => x0 + ((v - 6) / 24) * (x1 - x0), e = entre(d.grasa == null ? 18 : d.grasa, 11, 25), id = uid();
    return niebla(id, '#f6e3a6', 0.55) + lleno(id, X(e - 6), y - b, X(e + 6) - X(e - 6), b * 2, 'ap', 1, b) + L(x0, y, x1, y, 'e tz', 0)
      + [10, 15, 20, 25].map((v) => L(X(v), y - 3, X(v), y + 3, 'ls ap', 2)).join('') + L(X(e), y - b - 3, X(e), y + b + 3, 'a tz', 3)
      + (G ? [10, 15, 20, 25].map((v) => T(X(v), y + b + 20, v === 25 ? pc(v) : String(v), 'n', 'middle')).join('')
        + L(X(e - 4), y - b - 12, X(e + 4), y - b - 12, 'ls ap', 5) + L(X(e - 4), y - b - 16, X(e - 4), y - b - 8, 'ls ap', 5) + L(X(e + 4), y - b - 16, X(e + 4), y - b - 8, 'ls ap', 5)
        + T(X(e), y - b - 22, [t.tu, `±${n(4)}`].filter(Boolean).join(' · '), 'o', 'middle') : '');
  },
  // La cintura contra la altura, a escala, y la raya de la mitad.
  cintura({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), b = G ? 14 : 10, y1 = G ? 56 : H * 0.28, y2 = G ? 112 : H * 0.72, xm = (x0 + x1) / 2, ca = entre(d.ca || 0.48, 0.3, 0.75);
    return R(x0, y1 - b / 2, x1 - x0, b, 'rs cx', 0, b / 2) + R(x0, y2 - b / 2, (x1 - x0) * ca, b, 'r cx', 3, b / 2) + L(xm, y1 - b / 2 - (G ? 18 : 6), xm, y2 + b / 2 + (G ? 12 : 6), 'ad ap', 5)
      + (G ? T(x0, y1 - b / 2 - 9, `${t.altura} · ${d.altura} cm`, 'f') + T(x0, y2 - b / 2 - 9, d.cintura ? `${t.cintura} · ${d.cinturaTexto} cm` : t.cintura, 'f') + T(xm + 6, y1 - b / 2 - 9, t.mitad, 'o') : '');
  },
  // El piso del peso meta: debajo de 18,5 no se acepta; tu meta y tu hoy, arriba.
  imc({ W, H, G, d, t, n }) {
    const [x0, x1] = lados({ W, G }), y = G ? 88 : H / 2 + 2, b = G ? 13 : 9, X = (v) => x0 + ((entre(v, 16.2, 29.8) - 16) / 14) * (x1 - x0);
    return rayas(x0, y - b, X(18.5) - x0, b * 2, 'ls ap', 3) + L(x0, y, x1, y, 'e tz', 0) + L(X(18.5), y - b - 4, X(18.5), y + b + 4, 'l tz', 2) + C(X(d.imcHoy), y, G ? 3.4 : 2.6, 'aro pt', 5) + C(X(d.imcMeta), y, G ? 5 : 4, 'ra pt', 6)
      + (G ? T(X(18.5), y + b + 20, n(18.5, 1), 'n f', 'middle') + T(X(d.imcMeta), y - b - 10, t.meta, 'o', 'middle') + T(X(d.imcHoy), y + b + 20, t.hoy, '', 'middle') : '');
  },
  // Las horas: la franja de las guías para tu edad, lo que necesitas y anoche.
  horas({ W, H, G, d, t, dur }) {
    const [x0, x1] = lados({ W, G }), y = G ? 88 : H / 2 + 2, b = G ? 13 : 9, X = (h) => x0 + ((entre(h, 4.15, 9.85) - 4) / 6) * (x1 - x0);
    return R(X(d.necDesde), y - b, X(d.necHasta) - X(d.necDesde), b * 2, 'fb cx', 1, b) + L(x0, y, x1, y, 'e tz', 0) + [4, 5, 6, 7, 8, 9, 10].map((h) => L(x0 + ((h - 4) / 6) * (x1 - x0), y - 3, x0 + ((h - 4) / 6) * (x1 - x0), y + 3, 'ls ap', 2)).join('')
      + L(X(d.nec), y - b - 3, X(d.nec), y + b + 3, 'a tz', 4) + C(X(d.anocheH), y, G ? 4.4 : 3.4, 'r pt', 6)
      + (G ? T(X(d.necDesde), y + b + 20, dur(d.necDesde * 60), 'n', 'middle') + T(X(d.necHasta), y + b + 20, dur(d.necHasta * 60), 'n', 'middle') + T(X(d.nec), y - b - 10, t.nec, 'o', 'middle') + T(X(d.anocheH), y - b - 10, t.anoche, 'f', 'middle') : '');
  },
  // Lo que mide bien un reloj: el borde de la noche, nítido (cuánto y cuándo); adentro, las etapas, borrosas.
  reloj({ W, H, G, d, t }) {
    const x0 = G ? 8 : 4, x1 = W - (G ? 8 : 4), b = G ? 34 : 22, y = G ? 86 : H / 2, id = uid();
    return niebla(id, '#efe6cf', 0.5) + [[0.05, 0.16], [0.24, 0.13], [0.4, 0.2], [0.63, 0.12], [0.78, 0.17]].map(([a, w], i) => lleno(id, x0 + (x1 - x0) * a, y - b / 2 + 4, (x1 - x0) * w, b - 8, 'ap', 3 + i)).join('')
      + R(x0, y - b / 2, x1 - x0, b, 'l tz', 0, 7) + L(x0, y - b / 2 - 7, x0, y + b / 2 + 7, 'a tz', 1) + L(x1, y - b / 2 - 7, x1, y + b / 2 + 7, 'a tz', 2)
      + (G ? T(x0, y - b / 2 - 15, d.nocheDesde, 'n f') + T(x1, y - b / 2 - 15, d.nocheHasta, 'n f', 'end') + T((x0 + x1) / 2, y - b / 2 - 15, t.firme, 'o', 'middle') + T((x0 + x1) / 2, y + b / 2 + 24, t.borroso, '', 'middle') : '');
  },
  // La deuda: 14 noches contra lo que necesitas. Lo que faltó cuelga de la línea; lo de hace dos semanas pesa menos.
  deuda({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), yN = G ? 36 : 9, base = H - (G ? 26 : 2), filas = d.noches14 || [], id = uid();
    if (!filas.length) return '';
    const paso = (x1 - x0) / filas.length, ancho = paso * 0.64, s = ((base - yN) * 0.72) / 180;
    let out = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe6cf" stop-opacity=".3"/><stop offset="1" stop-color="#efe6cf" stop-opacity="0"/></linearGradient></defs>`;
    filas.forEach((f, i) => {
      const x = x0 + paso * i + (paso - ancho) / 2;
      if (f.falta == null) { out += C(x + ancho / 2, yN, 1.4, 'rp ap', i * 0.4); return; }
      const h = entre(f.falta, -60, 180) * s;
      out += lleno(id, x, yN + Math.max(h, 0), ancho, base - yN - Math.max(h, 0), 'ap', i * 0.4);
      if (h > 0.6) out += `<rect class="ra ct" x="${f1(x)}" y="${f1(yN)}" width="${f1(ancho)}" height="${f1(h)}" rx="1.5" style="--i:${4 + i * 0.4};opacity:${(0.35 + 0.65 * f.peso).toFixed(2)}"/>`;
      else if (h < -0.6) out += R(x, yN + h, ancho, -h, 'rs ap', 4 + i * 0.4, 1.5);
    });
    return out + L(x0, yN, x1, yN, 'a tz', 2) + (G ? T(x0, yN - 10, t.nec, 'o') + T(x0, H - 6, t.antes) + T(x1, H - 6, t.anoche, 'f', 'end') : '');
  },
  // La regularidad: tus últimas siete noches, una debajo de la otra, y cuánto se corren el comienzo y el final.
  regularidad({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), arriba = G ? 14 : 5, base = H - (G ? 42 : 5), r = d.semana7;
    if (!r) return '';
    const X = (m) => x0 + ((entre(m, 190, 950) - 180) / 780) * (x1 - x0), paso = (base - arriba) / 7, punta = G ? 3.2 : 2.3;
    const franja = (m, s) => R(X(m - s), arriba - 3, X(m + s) - X(m - s), base - arriba + 6, 'fb ap', 0, 4);
    return franja(r.mediaD, r.desvioD) + franja(r.mediaW, r.desvioW)
      // Una noche sin datos queda a rayas en su lugar: si no, el hueco parece un error.
      + r.noches.map((x, i) => { const y = arriba + paso * (i + 0.5), c = (i === 6 ? 'ra' : 'r') + ' pt'; return x ? L(X(x.dormirse), y, X(x.despertar), y, 'ls tz', 1 + i) + C(X(x.dormirse), y, punta, c, 2 + i) + C(X(x.despertar), y, punta, c, 2 + i) : L(X(r.mediaD), y, X(r.mediaW), y, 'hueco ap', 1 + i); }).join('')
      + (G ? T(X(r.mediaD), H - 22, t.dormir, 'f', 'middle') + T(X(r.mediaD), H - 6, `±${Math.round(r.desvioD)} min`, 'n', 'middle') + T(X(r.mediaW), H - 22, t.despertar, 'f', 'middle') + T(X(r.mediaW), H - 6, `±${Math.round(r.desvioW)} min`, 'n', 'middle') : '');
  },
  // La calidad: una barra partida en 50, 30 y 20, a puntos porque los pesos los eligió Moss; debajo, tu noche, de 100.
  calidad({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), b = G ? 22 : 14, y = G ? 42 : H * 0.3, hueco = 4, total = x1 - x0 - hueco * 2;
    let x = x0, out = '';
    [['duracion', 50], ['horario', 30], ['continuidad', 20]].forEach(([k, peso], i) => {
      const w = (total * peso) / 100;
      out += R(x, y - b / 2, w, b, 'ft ap', i, 5) + R(x, y - b / 2, w, b, 'lp ap', i, 5);
      if (G) out += T(i === 2 ? x + w : x, y - b / 2 - 10, t[k], 'f', i === 2 ? 'end' : null) + T(i === 2 ? x + w : x, y + b / 2 + 18, String(peso), 'n', i === 2 ? 'end' : null);
      x += w + hueco;
    });
    if (d.calidad == null) return out;
    const y2 = G ? 116 : H * 0.8, b2 = G ? 10 : 7;
    return out + R(x0, y2 - b2 / 2, x1 - x0, b2, 'ls ap', 4, b2 / 2) + R(x0, y2 - b2 / 2, ((x1 - x0) * entre(d.calidad, 0, 100)) / 100, b2, 'ra cx', 5, b2 / 2)
      + (G ? T(x0, y2 - b2 / 2 - 9, t.anoche, 'f') + T(x1, y2 - b2 / 2 - 9, t.de.replace('{n}', d.calidad).replace('{de}', 100), 'n o', 'end') : '');
  },
  // El último café: desde el corte, la cafeína baja a la mitad cada 3 a 6 horas hasta la cama.
  cafe({ W, H, G, t }) {
    const [x0, x1] = lados({ W, G }), base = H - (G ? 44 : 8), A = G ? 84 : 36, X = (h) => x1 + (h / 14) * (x1 - x0);
    const curva = (vida) => Array.from({ length: 19 }, (_, i) => [X(-9 + i / 2), base - A * Math.pow(0.5, i / 2 / vida)]);
    return `<path class="fb ap" d="${camino([...curva(6), ...curva(3).reverse()])}Z" style="--i:4"/>` + P(camino(curva(4.5)), 'a tz', 4) + L(x0, base, x1, base, 'e tz', 0) + L(X(-9), base, X(-9), base - A, 'ls ap', 2)
      + C(X(-13), base, G ? 3.2 : 2.4, 'aro pt', 1) + C(X(-9), base - A, G ? 4.6 : 3.4, 'ra pt', 3) + L(x1, base - (G ? 18 : 10), x1, base + (G ? 5 : 3), 'l tz', 6)
      + (G ? T(X(-9), base + 17, t.corte, 'o', 'middle') + T(x1, base + 17, t.cama, 'f', 'end') + T(X(-13) - 4, base + 34, t.mas) + T(x1, 14, t.mitad, '', 'end') : '');
  },
  // Tu periodo de melatonina en el reloj de 24 horas (medianoche arriba), con su margen, tu noche y los avisos.
  periodo({ W, H, G, d, t }) {
    const p = d.periodo || { desde: 1370, hasta: 1430, cama: 1355, despertar: 435, avisos: [{ min: 810, k: 'cafe' }, { min: 1235, k: 'comida' }, { min: 1265, k: 'luces' }, { min: 1355, k: 'cama' }] };
    const cx = G ? 86 : W / 2, cy = G ? 84 : H / 2, r = G ? 62 : 27;
    const en = (m, rr = r) => { const a = (m / 1440) * 2 * Math.PI - Math.PI / 2; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; };
    const arco = (a, b) => { const [xa, ya] = en(a), [xb, yb] = en(b); return `M${f1(xa)} ${f1(ya)}A${r} ${r} 0 ${(b - a + 1440) % 1440 > 720 ? 1 : 0} 1 ${f1(xb)} ${f1(yb)}`; };
    let out = C(cx, cy, r, 'e tz', 0) + [0, 360, 720, 1080].map((m) => { const [xa, ya] = en(m, r - (G ? 7 : 4)), [xb, yb] = en(m, r - 1); return L(xa, ya, xb, yb, 'ls ap', 1); }).join('')
      + P(arco(p.cama, p.despertar), 'arco-s ap', 2) + P(arco(p.desde - 60, p.hasta + 60), 'arco-f ap', 4) + P(arco(p.desde, p.hasta), 'arco-p tz', 5)
      + p.avisos.map((a, i) => { const [x, y] = en(a.min); return C(x, y, G ? 3.6 : 2.6, 'punto pt', 7 + i); }).join('');
    if (!G) return out;
    out += T(cx, cy - r + 20, '0', 'n', 'middle') + T(cx, cy + r - 12, '12', 'n', 'middle') + T(cx + r - 13, cy + 4, '6', 'n', 'end') + T(cx - r + 13, cy + 4, '18', 'n');
    p.avisos.forEach((a, i) => { const y = 42 + i * 22; out += C(182, y - 4, 3.2, 'punto pt', 7 + i) + T(192, y, a.hora, 'n f', null, 7 + i) + T(232, y, t[a.k], '', null, 7 + i); });
    return out + L(179, 132, 186, 132, 'ag ap', 5) + T(192, 136, d.perDesde ? `${d.perDesde}–${d.perHasta}` : '', 'n o', null, 5) + T(192, 152, `${t.periodo} · ±1 h`, '', null, 5);
  },
  // Las luces: brillante hasta 3 horas antes de la cama (el consenso) y baja desde ahí; a la hora y media, el aviso de Moss.
  luces({ W, H, G, t }) {
    const [x0, x1] = lados({ W, G }), b = G ? 24 : 16, y = G ? 86 : H / 2, id = uid(), X = (h) => x1 + (h / 4.5) * (x1 - x0);
    return `<defs><linearGradient id="${id}"><stop offset="0" stop-color="#f6e3a6" stop-opacity=".95"/><stop offset=".3" stop-color="#f6e3a6" stop-opacity=".95"/><stop offset=".47" stop-color="#f6e3a6" stop-opacity=".16"/><stop offset="1" stop-color="#f6e3a6" stop-opacity=".06"/></linearGradient></defs>`
      + lleno(id, x0, y - b / 2, x1 - x0, b, 'cx', 0, b / 2) + R(x0, y - b / 2, x1 - x0, b, 'ls ap', 1, b / 2) + L(X(-3), y - b / 2 - 7, X(-3), y + b / 2 + 7, 'a tz', 5) + L(X(-1.5), y - b / 2 - 6, X(-1.5), y + b / 2 + 6, 'lp ap', 7)
      + (G ? T(X(-3), y - b / 2 - 15, t.consenso, 'o', 'middle') + T(X(-1.5), y + b / 2 + 24, t.aviso, '', 'middle') + T(x1, y - b / 2 - 15, t.cama, 'f', 'end') : '');
  },
  // Comer y entrenar: la comida de 4 a 1 hora antes, la sesión y la proteína en la comida que sigue.
  comer({ W, H, G, t, dur }) {
    const [x0, x1] = lados({ W, G }), y = G ? 86 : H / 2 + 1, b = G ? 20 : 14, X = (h) => x0 + ((h + 5) / 9.5) * (x1 - x0);
    return L(x0, y, x1, y, 'e tz', 0) + R(X(-4), y - b / 2, X(-1) - X(-4), b, 'fb cx', 1, b / 2) + L(X(-4), y - b / 2 - 3, X(-4), y + b / 2 + 3, 'ls ap', 2) + L(X(-1), y - b / 2 - 3, X(-1), y + b / 2 + 3, 'ls ap', 2)
      + R(X(0), y - b / 2 - 3, X(1) - X(0), b + 6, 'r cx', 4, 4) + R(X(1) + 3, y - b / 2, X(4) - X(1) - 3, b, 'ft cx', 6, b / 2) + C(X(2.3), y, G ? 4.6 : 3.4, 'ra pt', 8)
      + (G ? T((X(-4) + X(-1)) / 2, y - b / 2 - 16, t.antes, 'o', 'middle') + T(X(-4), y + b / 2 + 22, dur(240), 'n', 'middle') + T(X(-1), y + b / 2 + 22, dur(60), 'n', 'middle') + T(X(0.5), y - b / 2 - 16, t.entreno, 'f', 'middle') + T(X(2.3), y + b / 2 + 22, t.despues, 'o', 'middle') : '');
  },
  // La noche corta: la fuerza máxima, casi entera; de diez repeticiones, una menos.
  noche({ W, H, G, t }) {
    const [x0, x1] = lados({ W, G }), w = x1 - x0, b = G ? 14 : 10, y1 = G ? 52 : H * 0.26, y2 = G ? 116 : H * 0.72, r = G ? 10.5 : 5.2, paso = w / 10;
    let out = R(x0, y1 - b / 2, w, b, 'ls ap', 0, 3) + R(x0 + 2, y1 - b / 2 + 2, (w - 4) * 0.9715, b - 4, 'r cx', 1, 2);
    for (let i = 0; i < 10; i++) out += C(x0 + paso * (i + 0.5), y2, r, i < 9 ? 'r pt' : 'falta ap', i < 9 ? 3 + i * 0.6 : 10);
    return out + (G ? T(x0, y1 - b / 2 - 9, t.fuerza, 'f') + T(x1, y1 - b / 2 - 9, t.fuerzaN, 'n', 'end') + T(x0, y2 - r - 10, t.reps, 'f') + T(x1, y2 - r - 10, t.repsN, 'n o', 'end') : '');
  },
  // Las series por semana: más series, más progreso, cada vez menos; la franja de 10 a 20, a puntos (es una convención).
  series({ W, H, G, d, t }) {
    const x0 = G ? 8 : 4, x1 = W - (G ? 8 : 4), arriba = G ? 26 : 6, base = H - (G ? 38 : 6);
    const X = (s) => x0 + (s / 30) * (x1 - x0), fn = (s) => 1 - Math.exp(-s / 9), Y = (v) => base - (v / fn(30)) * (base - arriba) * 0.94;
    return R(X(10), arriba, X(20) - X(10), base - arriba, 'fb ap', 1) + L(X(10), arriba, X(10), base, 'lp ap', 2) + L(X(20), arriba, X(20), base, 'lp ap', 2) + L(x0, base, x1, base, 'e tz', 0)
      + P(camino(Array.from({ length: 31 }, (_, s) => [X(s), Y(fn(s))])), 'l tz', 3)
      + (G ? d.series.slice(0, 3).map((m, i) => C(X(entre(m.n, 0, 30)), Y(fn(entre(m.n, 0, 30))), 3.6, 'ra pt', 9 + i)).join('') + T(X(10), base + 17, '10', 'n', 'middle') + T(X(20), base + 17, '20', 'n', 'middle') + T(x1, base + 32, t.x, '', 'end') + T(x0, arriba - 10, t.y) + T(X(15), arriba - 10, t.conv, '', 'middle') : '');
  },
  // La fuerza de cada sesión, bailando dentro de ±3 % alrededor de una tendencia que sube 1 % por mes (ilustración).
  fuerza({ W, H, G, t }) {
    const [x0, x1] = lados({ W, G }), arriba = G ? 26 : 5, base = H - (G ? 30 : 5), dias = 84, azar = Datos.azar(11);
    const X = (dd) => x0 + (dd / dias) * (x1 - x0), tend = (dd) => 1 + 0.01 * (dd / 30.4), Y = (v) => base - ((v - 0.955) / 0.12) * (base - arriba);
    const pts = [];
    for (let dd = 3; dd <= dias; dd += 6.2) pts.push([X(dd), Y(tend(dd) + (azar() - 0.5) * 0.058)]);
    return `<path class="fb ap" d="${camino([[x0, Y(1.033)], [x1, Y(tend(dias) + 0.033)], [x1, Y(tend(dias) - 0.033)], [x0, Y(0.967)]])}Z" style="--i:0"/>` + pts.map(([x, y], i) => C(x, y, G ? 2.6 : 1.9, 'rp pt', 2 + i * 0.5)).join('') + L(x0, Y(1), x1, Y(tend(dias)), 'a tz', 2)
      + (G ? T(x0, Y(1.033) - 7, t.franja) + T(x1, Y(tend(dias) - 0.033) + 16, t.tendencia, 'o', 'end') + T(x0, H - 6, t.semanas) : '');
  },
  // La fatiga de un músculo: cargado, recuperándose y descansado, en escalones de borde borroso. El día en que vuelve a
  // estar listo (el segundo borde) puede errar uno.
  fatiga({ W, H, G, t }) {
    const [x0, x1] = lados({ W, G }), b = G ? 26 : 18, y = G ? 68 : H / 2 - 4, id = uid(), X = (dd) => x0 + (dd / 3.5) * (x1 - x0);
    const escalones = [[0, 0.92], [0.2, 0.92], [0.36, 0.45], [0.5, 0.45], [0.64, 0.07], [1, 0.05]].map(([o, a]) => `<stop offset="${o}" stop-color="#f6e3a6" stop-opacity="${a}"/>`).join('');
    let out = `<defs><linearGradient id="${id}">${escalones}</linearGradient></defs>`
      + lleno(id, x0, y - b / 2, x1 - x0, b, 'cx', 1, b / 2) + R(x0, y - b / 2, x1 - x0, b, 'ls ap', 0, b / 2) + [0, 1, 2, 3].map((dd) => L(X(dd) + (dd ? 0 : 1), y + b / 2 + 5, X(dd) + (dd ? 0 : 1), y + b / 2 + 10, 'ls ap', 3)).join('');
    if (!G) return out;
    out += T(X(0.5), y - b / 2 - 11, t.cargado, 'f', 'middle') + T(X(1.5), y - b / 2 - 11, t.recuperandose, 'f', 'middle') + T(x1, y - b / 2 - 11, t.listo, 'f', 'end')
      + [0, 1, 2, 3].map((dd) => T(X(dd), y + b / 2 + 25, dd ? t.dia.replace('{n}', dd) : t.entrenas, dd ? 'n' : '', dd ? 'middle' : null)).join('');
    return out + L(X(1), y + b / 2 + 42, X(3), y + b / 2 + 42, 'a ap', 6) + L(X(1), y + b / 2 + 38, X(1), y + b / 2 + 46, 'a ap', 6) + L(X(3), y + b / 2 + 38, X(3), y + b / 2 + 46, 'a ap', 6) + T(X(2), y + b / 2 + 60, t.margen, 'o', 'middle', 6);
  },
  // Sin porcentaje de recuperación: un dial a puntos, sin aguja. Ninguno está validado.
  puntaje({ W, H, G, t }) {
    const cx = W / 2, base = H - (G ? 44 : 9), r = G ? 76 : 34, largo = G ? 9 : 6;
    let out = `<path class="lp ap" d="M${cx - r} ${base}A${r} ${r} 0 0 1 ${cx + r} ${base}" style="--i:0"/>`;
    for (let i = 0; i <= 6; i++) { const a = Math.PI + (Math.PI * i) / 6; out += L(cx + (r + 4) * Math.cos(a), base + (r + 4) * Math.sin(a), cx + (r + 4 + largo) * Math.cos(a), base + (r + 4 + largo) * Math.sin(a), 'ls ap', 1 + i * 0.5); }
    return out + L(cx - (G ? 13 : 7), base - r * 0.36, cx + (G ? 13 : 7), base - r * 0.36, 'l tz', 5) + (G ? T(cx, base + 26, t.nada, '', 'middle') : '');
  },
  // Con un cuidado (cuidados.ts): sin cuidados, la meta es el gasto menos el déficit; con diabetes o colesterol alto,
  // también; con embarazo o enfermedad renal, el gasto entero.
  cuidados({ W, H, G, d, t }) {
    const [x0, x1] = lados({ W, G }), w = x1 - x0, b = G ? 14 : 8, fr = d.fraccionMeta, filas = G ? [36, 88, 140] : [H * 0.2, H * 0.5, H * 0.8];
    const conDeficit = (y, i) => R(x0, y - b / 2, w * fr - (fr < 0.995 ? 1.5 : 0), b, 'rm cx', i, 3) + (fr < 0.995 ? R(x0 + w * fr + 1.5, y - b / 2, w * (1 - fr) - 1.5, b, 'hueco ap', i + 2, 3) : '');
    let out = conDeficit(filas[0], 0) + conDeficit(filas[1], 3) + R(x0, filas[2] - b / 2, w, b, 'ra cx', 6, 3);
    if (G) [[t.sin, t.sinN, ''], [t.sigue, t.sinN, ''], [t.con, t.conN, ' o']].forEach(([rotulo, n, o], i) => { out += T(x0, filas[i] - b / 2 - 9, rotulo, 'f') + T(x1, filas[i] - b / 2 - 9, n, 'n' + o, 'end'); });
    return out;
  },
  // Solo en este iPhone: tu dato queda adentro; el camino a la cuenta, a puntos, se corta.
  privado({ W, H, G, t }) {
    const s = G ? 1 : 0.5, pw = 50 * s, ph = 92 * s, px = G ? 78 : W * 0.26, py = (H - (G ? 22 : 0) - ph) / 2, nx = G ? 240 : W * 0.74, ny = py + ph / 2, xm = (px + nx) / 2;
    const nube = `M${f1(nx - 20 * s)} ${f1(ny + 12 * s)}a${11 * s} ${11 * s} 0 0 1 ${2 * s} ${-21.5 * s}a${15 * s} ${15 * s} 0 0 1 ${28 * s} ${-5 * s}a${14.6 * s} ${14.6 * s} 0 0 1 ${12 * s} ${26.5 * s}z`;
    return R(px - pw / 2, py, pw, ph, 'l tz', 0, G ? 10 : 5) + L(px - pw * 0.17, py + ph - 9 * s, px + pw * 0.17, py + ph - 9 * s, 'ls ap', 2) + C(px, py + ph * 0.42, G ? 7 : 3.8, 'ra pt', 3)
      + `<path class="ld ap" d="${nube}" style="--i:4"/>` + L(px + pw / 2 + 12 * s, ny, xm - 8 * s, ny, 'lp ap', 5) + L(xm, ny - 9 * s, xm, ny + 9 * s, 'l tz', 6)
      + (G ? T(px, H - 6, t.iphone, 'f', 'middle') + T(nx, H - 6, t.cuenta, '', 'middle') : '');
  },
};

// Los dibujitos de la cadena: tu dato sobre una escala; la regla sobre la misma escala, con tu dato adentro; y lo que se
// sabe, con el dibujo de su ficha en chico.
const MINIS = {
  horas: (h) => { const X = (v) => 3 + ((entre(v, 4, 9) - 4) / 5) * 90; return L(3, 10, 93, 10, 'e') + [4, 5, 6, 7, 8, 9].map((v) => L(X(v), 7.5, X(v), 12.5, 'ls')).join('') + C(X(h), 10, 4, 'ra'); },
  corta: (h) => { const X = (v) => 3 + ((entre(v, 4, 9) - 4) / 5) * 90; return L(3, 10, 93, 10, 'e') + L(3, 10, X(6), 10, 'ag') + L(X(6), 3, X(6), 17, 'l') + C(X(h), 10, 3.4, 'punto'); },
  // De diez repeticiones, una menos.
  reps: () => Array.from({ length: 10 }, (_, i) => C(7 + i * 9.1, 10, 3.3, i < 9 ? 'r' : 'falta')).join(''),
  gasto: () => R(3, 5, 90, 10, 'r', null, 3),
  deficit: (fr) => R(3, 5, 90 * fr - 1.5, 10, 'r', null, 3) + (fr < 0.99 ? R(3 + 90 * fr + 1.5, 5, 90 * (1 - fr) - 1.5, 10, 'falta', null, 3) : ''),
  // La franja de la fórmula que, semana a semana, se angosta hasta una línea firme.
  firme: () => {
    const X = (u) => 3 + 90 * u, mitad = (u) => 8 * Math.exp(-3.6 * u) + 0.6, arriba = [], abajo = [];
    for (let i = 0; i <= 20; i++) { arriba.push([X(i / 20), 10 - mitad(i / 20)]); abajo.unshift([X(i / 20), 10 + mitad(i / 20)]); }
    return `<path class="fb" d="${camino([...arriba, ...abajo])}Z"/>` + L(X(0.75), 10, 93, 10, 'a') + [0, 1, 2, 3, 4].map((w) => C(X(w / 4), 10, 2.2, w >= 3 ? 'ra' : 'rp')).join('');
  },
};

// ------------------------------------------------------------ la propuesta
Galeria.propuesta({
  id: 'baseConDibujos',
  titulo: 'En qué se basa Moss, con dibujos',
  texto: 'Lo mismo que «En qué se basa Moss», pero cada idea con un dibujo en lugar de párrafos. Mirá si de un vistazo se entiende qué está probado y qué decide Moss.',
  vistas: [['portada', 'Qué tan seguro es cada dato'], ['cifras', 'Un número por tema'], ['ficha', 'Al tocar un número'], ['porque', 'Al tocar «¿Por qué me dice esto?»']],
  mas: [['ficha2', 'Al tocar otro: cuándo llegas a tu meta'], ['en', 'En inglés']],
  principal: 1,
  crear(g) {
    g.estilo('bd-css', CSS);
    const p = g.pantalla('bd', { conBarra: true });
    const raiz = p.el;
    const u = Util.crear(g.opciones);
    const { tx, el, boton } = u;
    const icono = Util.icono;
    const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const textos = () => TEXTOS_BD[g.idioma] || TEXTOS_BD.es;

    // Detrás, la pantalla (la barra de arriba y lo que se desliza); encima, la ficha crecida.
    const fondo = el('div', 'bd-fondo');
    const capa = el('div', 'bd-capa');
    capa.hidden = true;
    capa.setAttribute('role', 'dialog');
    const capaDentro = el('div', 'bd-capa-dentro');
    const clon = el('div', 'bd-capa-clon');
    clon.hidden = true;
    const cerrarCapa = boton('bd-capa-cerrar', `<i>${icono('cerrar')}</i>`, () => cerrarFicha());
    capa.append(capaDentro, clon, cerrarCapa);
    raiz.append(fondo, capa);

    const estado = { modo: null, idioma: null, area: 'todo', ficha: null, origen: null, animaciones: [], espera: 0, idiomaDeAntes: null };
    let nav = null, scroll = null, seccion = null, filtro = null, rejilla = null;

    const puntos = (s) => `<span class="bd-puntos" data-n="${PUNTOS_DEL_SELLO[s]}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
    const nombreDelSello = (s) => tx(`perfil.baseInfo.sellos.${s}.nombre`);
    const sello = (s) => { const n = el('span', 'bd-sello'); n.innerHTML = puntos(s); n.appendChild(el('b', null, nombreDelSello(s))); return n; };
    const cifra = (t) => { const n = el('span', 'bd-cifra' + (t.cifra.length > 7 ? ' larga' : ''), t.cifra); if (t.u) n.appendChild(el('small', null, t.u)); return n; };
    /** Las fuentes de una ficha: las de base.js por su área y su número, y las de OTRAS. */
    const fuentesDe = (f) => f.refs.map((r) => {
      if (r[0] === '+') { const o = OTRAS[r.slice(1)]; return o ? Object.assign({ anio: o.anio, enlace: o.enlace }, o[g.idioma] || o.es) : null; }
      const [area, n] = r.split('#'), citas = tx(`perfil.baseInfo.areas.${area}.citas`);
      return Array.isArray(citas) ? citas[Number(n) - 1] : null;
    }).filter(Boolean);

    // Lo que se dibuja espera a entrar en pantalla, y se traza una sola vez.
    const ojo = 'IntersectionObserver' in window ? new IntersectionObserver((vistos) => vistos.forEach((v) => {
      if (!v.isIntersecting) return;
      v.target.classList.remove('espera');
      v.target.classList.add('vista');
      ojo.unobserve(v.target);
    }), { threshold: 0.3 }) : null;
    const alVerse = (n) => { if (!ojo || quieto()) n.classList.add('vista'); else { n.classList.add('espera'); ojo.observe(n); } };

    function dibujo(f, d, grande) {
      const t = textos(), [W, H] = grande ? [328, 168] : [148, 60];
      const rotulos = Object.fromEntries(Object.entries(t.fichas[f.id].e || {}).map(([k, v]) => [k, typeof v === 'function' ? v(d) : v]));
      let dentro = '';
      try { dentro = DIBUJOS[f.id]({ W, H, G: grande, d, t: rotulos, n: u.numero, pc: t.pc, dur: u.duracion }); } catch (e) { console.error('El dibujo de ' + f.id + ' falló:', e); }
      const caja = document.createElement('div');
      caja.innerHTML = `<svg class="bd-dib" viewBox="0 0 ${W} ${H}" aria-hidden="true">${dentro}</svg>`;
      return caja.firstChild;
    }

    // ------------------------------------------------------------ la persona, como la muestra cada sección
    // Todo sale de los módulos de la app con los datos de la galería: nada se escribe a mano.
    function datos() {
      const per = g.persona(), perfil = per.perfil, hoy = Datos.HOY, A = Datos.ASCENT, n = u.numero;
      const edad = Number(hoy.slice(0, 4)) - perfil.nacimiento;
      const d = { tx };

      // La comida: el gasto medido, la meta de hoy y la proteína.
      const gasto = Math.round(per.gasto / 10) * 10, metaKcal = per.control.metas.kcal, deficit = Math.round((gasto - metaKcal) / 10) * 10;
      const ritmoPct = Math.abs((Metas.RITMOS[perfil.objetivo] || {})[perfil.ritmo] || 0);
      const kg = per.pesoHoy, proteina = per.control.metas.proteina;
      const partida = Cuestionario.gastoEstimado({ edad, sexo: perfil.sexo, alturaCm: perfil.alturaCm, pesoKg: per.pesoInicial, grasa: perfil.grasaDicha || null, movimiento: perfil.movimiento || 'sentado', entreno: perfil.entreno || null });
      d.baja = perfil.objetivo === 'bajar' && deficit > 0;
      Object.assign(d, {
        gasto: n(gasto), meta: n(metaKcal), metaHoy: metaKcal, deficit: n(deficit), fraccionMeta: d.baja ? metaKcal / gasto : 1, plan: ritmoPct, pct: n(ritmoPct, Number.isInteger(ritmoPct * 10) ? 1 : 2),
        semanas: Math.max(1, Math.round(Fechas.diasEntre(Datos.INICIO, hoy) / 7)), partes: { reposo: partida.reposo / partida.total, dia: partida.vida / partida.total },
        gkg: entre(proteina / kg, 0.9, 2.5), gkgTexto: n(Math.round((proteina / kg) * 10) / 10, 1), proteina: n(proteina), kg: u.peso(Math.round(kg * 10) / 10),
        comido: Math.round(g.secciones.comida.totalDe(0).kcal),
      });
      d.comidoTexto = n(d.comido);

      // El peso: las pesadas de la semana, la tendencia y la llegada con su rango.
      const deLaSemana = per.pesadas.filter((x) => x.fecha > Fechas.sumarDias(hoy, -7)).map((x) => x.kg), pr = per.progreso || {};
      if (deLaSemana.length > 1) Object.assign(d, { pesoMin: u.peso(Math.min(...deLaSemana)), pesoMax: u.peso(Math.max(...deLaSemana)) });
      const recta = pr.nivel != null && pr.ritmo ? (i, dias) => pr.nivel - (pr.ritmo / 7) * (dias - 1 - i) : null;
      Object.assign(d, { tendencia: u.peso(Math.round(kg * 10) / 10), serie: (per.serie30 || []).map((x, i, todos) => (recta ? Object.assign({}, x, { linea: recta(i, todos.length) }) : x)), metaKg: u.peso(perfil.pesoMeta), ritmoKg: pr.ritmo != null ? n(Math.abs(pr.ritmo), 2) : '', planG: pr.ritmoPlan != null ? n(Math.round(Math.abs(pr.ritmoPlan) * 100) * 10) : '' });
      if (pr.fechas && pr.fechas.temprana && pr.fechas.tardia && pr.nivel != null && pr.ritmo) {
        const dia = (c) => Fechas.diasEntre(hoy, c), tardia = dia(pr.fechas.tardia), meses = [];
        const diaYMes = (c) => textos().diaYMes(u.partes(c).num, tx('fecha.meses.' + u.partes(c).mes));
        for (let c = Fechas.sumarDias(hoy, 1); dia(c) < tardia + 8; c = Fechas.sumarDias(c, 1)) if (c.endsWith('-01')) meses.push({ dia: dia(c), nombre: tx('fecha.mesesCortos.' + u.partes(c).mes) });
        d.plazo = {
          nivel: pr.nivel, meta: perfil.pesoMeta, antes: pr.nivel + (Math.abs(pr.ritmo) / 7) * 14 * (perfil.pesoMeta > pr.nivel ? -1 : 1), temprana: dia(pr.fechas.temprana), tardia,
          metaTexto: `${d.metaKg} kg`, rango: `${u.fechaCorta(pr.fechas.temprana)} – ${u.fechaCorta(pr.fechas.tardia)}`, meses,
        };
        Object.assign(d, { llegaDesde: diaYMes(pr.fechas.temprana), llegaHasta: diaYMes(pr.fechas.tardia) });
      }
      const metros = perfil.alturaCm / 100, medidas = per.ultimasMedidas || {};
      if (per.grasa && per.grasa.estimado != null) { const e = Math.round(per.grasa.estimado); Object.assign(d, { grasa: per.grasa.estimado, grasaTexto: n(e), grasaA: n(e - 4), grasaB: n(e + 4) }); }
      if (medidas.cintura) Object.assign(d, { cintura: medidas.cintura, cinturaTexto: u.peso(medidas.cintura), ca: medidas.cintura / perfil.alturaCm, caTexto: n(medidas.cintura / perfil.alturaCm, 2) });
      Object.assign(d, { altura: n(perfil.alturaCm), medio: n(0.5, 1), imcMeta: perfil.pesoMeta / (metros * metros), imcHoy: kg / (metros * metros), pesoMinimo: u.peso(Metas.pesoMinimoSano(perfil.alturaCm)) });

      // El sueño. Lo de varias noches (la deuda, lo que duermes, el horario y el periodo), tal cual lo calcula Sueño
      // (galeria/src/sueno.js: sus noches y la necesidad y el margen de Perfil). Anoche, la del día de ejemplo de Ascent
      // (5 h 50 y su calidad, a la hora de siempre y despertándose 80 min antes), como la muestra Ascent: no se mezcla
      // con las otras noches.
      const perfilSec = g.secciones.perfil, noches = g.secciones.sueno.noches(), corta = A.dias.corta.noche;
      const nec = Sueno.necesidad(edad, perfilSec && perfilSec.necesidad ? perfilSec.necesidad : null), rango = Sueno.rangoDeNecesidad(edad);
      const reloj = (m) => u.horaMin((((Math.round(m) % 1440) + 1440) % 1440)), delDia = (m) => ((Math.round(m) % 1440) + 1440) % 1440;
      const ult = Sueno.ultimasNoches(noches, hoy, 14), deuda = noches.length ? Sueno.deudaDeSueno(ult, nec) : null, horario = Sueno.horario(ult);
      Object.assign(d, {
        nec: nec / 60, necDesde: rango.desde / 60, necHasta: rango.hasta / 60, necTexto: Periodo.corta(u, nec), anocheH: corta.dormido / 60, anoche: u.duracion(corta.dormido), anocheCorta: Periodo.corta(u, corta.dormido),
        noches14: Sueno.nochesDeLaDeuda(ult, nec).map((x) => ({ falta: x.entra, peso: x.peso })), calidad: corta.calidad,
        estadoNoche: tx('ascent.noche.' + Rendimiento.estadoDeLaNoche({ dormido: corta.dormido, necesidad: nec, despertoAntes: corta.despertoAntes })).toLowerCase(),
      });
      if (deuda && Sueno.redondearDeuda(deuda.minutos) > 0) Object.assign(d, { deuda: Periodo.corta(u, Sueno.redondearDeuda(deuda.minutos)), deudaPalabra: tx('sueno.deuda.juicio.' + Sueno.juicioDeLaDeuda(deuda)).toLowerCase(), duermes: Periodo.corta(u, Math.round(deuda.duermes / 10) * 10) });
      if (horario) {
        Object.assign(d, {
          nocheDesde: reloj(horario.dormirse + 1080), nocheHasta: reloj(horario.despertar - (corta.despertoAntes || 0) + 1080),
          semana7: { noches: Sueno.ultimasNoches(noches, hoy, 7).map((x) => (x ? { dormirse: x.dormirse, despertar: x.despertar } : null)), mediaD: horario.dormirse, mediaW: horario.despertar, desvioD: horario.desvioDormirse, desvioW: horario.desvioDespertar },
          desvioD: Math.round(horario.desvioDormirse), desvioW: Math.round(horario.desvioDespertar), regular: tx('sueno.regularidad.' + horario.regularidad).toLowerCase(),
        });
      }

      // Los avisos: del periodo de melatonina sale la hora de acostarte y, de ella, lo demás, como en Sueño.
      const periodo = Melatonina.periodoDeMelatonina(noches, hoy, { margen: SinReloj.margenParaDormirte(perfilSec ? perfilSec.latencia : null), deuda: deuda ? deuda.minutos : null });
      if (periodo) {
        const cama = periodo.acostarse + 1080, corte = AlrededorDelEntreno.corteDeCafeina(cama, null);
        const avisos = [['cafe', corte], ['comida', cama - LoQueFalta.cercaDeLaCama(false)], ['luces', cama - LoQueConviene.LUCES], ['cama', cama]].filter(([, m]) => m != null).map(([k, m]) => ({ k, min: delDia(m), hora: reloj(m) }));
        Object.assign(d, {
          periodo: { desde: delDia(periodo.desde + 1080), hasta: delDia(periodo.hasta + 1080), cama: delDia(cama), despertar: delDia((horario ? horario.despertar : noches[noches.length - 1].despertar) + 1080), avisos },
          cama: reloj(cama), corte: corte != null ? reloj(corte) : '', perDesde: reloj(periodo.desde + 1080), perHasta: reloj(periodo.hasta + 1080), luces: reloj(cama - LoQueConviene.LUCES), luces3: reloj(cama - 180),
        });
      }

      // El entrenamiento: la sesión de hoy, las series de la semana, la sentadilla de 12 semanas y lo de hoy.
      const sesion = A.sesiones.find((s) => s.fecha === hoy), viaje = perfil.entreno && perfil.entreno.viaje != null ? perfil.entreno.viaje : LoQueConviene.VIAJE_DE_FABRICA;
      if (sesion) Object.assign(d, { sesion: sesion.nombre[g.idioma] || sesion.nombre.es, entreno: reloj(sesion.hora), comerA: reloj(sesion.hora - LoQueConviene.ANTES_DE_EMPEZAR), comerB: reloj(sesion.hora - viaje - LoQueConviene.ANTES_DE_SALIR) });
      const hechos = A.sesiones.filter((s) => s.fecha >= Fechas.sumarDias(hoy, -6) && s.fecha < hoy).flatMap((s) => s.bloques.map((b) => { const m = Musculos.musculosDe(b); return m ? { principal: m.principal, ayuda: m.ayudan || [], series: b.series.map((x) => ({ reps: x.reps })) } : null; }).filter(Boolean));
      d.series = [...PuntajeMuscular.seriesPorMusculo(hechos)].map(([m, x]) => ({ nombre: tx('ascent.musculos.nombres.' + m), n: x.series, nTexto: n(x.series, Number.isInteger(x.series) ? 0 : 1) })).sort((a, b) => b.n - a.n);
      const sentadilla = A.sesiones.filter((s) => s.fecha >= Fechas.sumarDias(hoy, -84) && s.fecha < hoy).map((s) => s.bloques.find((b) => b.id === 'sentadilla')).filter(Boolean).map((b) => Math.max(...b.series.map((x) => x.peso)));
      if (sentadilla.length > 1) { const fin = sentadilla[sentadilla.length - 1]; Object.assign(d, { sentA: u.peso(sentadilla[0]), sentB: u.peso(fin), sentRuido: n(Math.max(1, Math.round(fin * 0.03))) }); }
      const dePiernas = (b) => { const m = Musculos.musculosDe(b); return !!m && m.grupo === 'piernas'; };
      const ultimaDePiernas = [...A.sesiones].reverse().find((s) => s.fecha < hoy && s.bloques.some(dePiernas));
      if (ultimaDePiernas) {
        const listo = PuntajeMuscular.listoEl([{ fecha: ultimaDePiernas.fecha, series: ultimaDePiernas.bloques.filter(dePiernas).reduce((t, b) => t + b.series.length, 0), rirMinimo: null, multiarticularDePiernas: true, nuevo: false }]);
        const estadoHoy = PuntajeMuscular.estadoDeFatiga(PuntajeMuscular.diasHastaListo(listo, hoy));
        Object.assign(d, { haceDias: Fechas.diasEntre(ultimaDePiernas.fecha, hoy), estadoMusculos: tx('ascent.decide.estados.' + (estadoHoy === 'descansado' ? 'recuperado' : estadoHoy)).toLowerCase() });
      }
      return d;
    }

    // ------------------------------------------------------------ la portada y la retícula
    /** Cuánto confiar: cada sello, una columna; cada cifra, una píldora en la suya. */
    function cuadro() {
      const t = textos(), caja = el('section', 'bd-confiar'), cols = el('div', 'bd-columnas'), porSello = SELLOS.map((s) => FICHAS.filter((f) => f.sello === s));
      let i = 0;
      SELLOS.forEach((s, c) => {
        const cab = el('div', 'bd-col-cab');
        cab.style.gridColumn = String(c + 1);
        cab.innerHTML = puntos(s);
        cab.append(el('b', null, String(porSello[c].length)), el('span', null, nombreDelSello(s)));
        cols.appendChild(cab);
        porSello[c].forEach((f, fila) => {
          const b = boton('bd-pildora ' + s, '', () => abrirFicha(f.id, b), `${t.fichas[f.id].corto}. ${nombreDelSello(s)}`);
          b.textContent = t.fichas[f.id].corto;
          b.dataset.id = f.id;
          Object.assign(b.style, { gridColumn: String(c + 1), gridRow: String(fila + 2) });
          b.style.setProperty('--i', String(i++));
          cols.appendChild(b);
        });
      });
      const leyenda = el('ul', 'bd-leyenda');
      SELLOS.forEach((s) => { const li = el('li'); li.innerHTML = puntos(s); li.appendChild(el('span', null, tx(`perfil.baseInfo.sellos.${s}.texto`))); leyenda.appendChild(li); });
      caja.append(el('span', 'bd-etq', tx('perfil.baseInfo.sellosTitulo')), cols);
      // Qué quiere decir cada sello va en el hueco que dejan las columnas cortas; si no entra, debajo.
      const filas = Math.max(...porSello.map((l) => l.length)), ocupadas = Math.max(porSello[2].length, porSello[3].length);
      if (filas - ocupadas >= 5) { Object.assign(leyenda.style, { gridColumn: '3 / 5', gridRow: `${ocupadas + 2} / ${filas + 2}` }); cols.appendChild(leyenda); } else { leyenda.classList.add('abajo'); caja.appendChild(leyenda); }
      alVerse(caja);
      return caja;
    }

    function tarjeta(f, d) {
      const t = textos(), tf = t.fichas[f.id], dib = dibujo(f, d, false);
      const b = boton('bd-ficha', '', () => abrirFicha(f.id, b));
      Object.assign(b.dataset, { id: f.id, area: f.area });
      b.append(el('span', 'bd-etq', t.areas[f.area]), cifra(tf), dib, el('span', 'bd-frase', tf.frase), sello(f.sello));
      b.hidden = estado.area !== 'todo' && estado.area !== f.area;
      alVerse(dib);
      return b;
    }

    function pintarBase() {
      const t = textos(), d = datos();
      nav = el('div', 'bd-nav');
      nav.append(boton('bd-atras', `${icono('atras')}<span>${tx('pestanas.perfil')}</span>`, () => g.ver('baseConDibujos', null)), el('h2', null, tx('perfil.base')), el('span'));
      scroll = el('div', 'bd-scroll');
      const respuesta = el('p', 'bd-respuesta');
      respuesta.append(t.respuesta[0], el('em', null, t.respuesta[1]));
      const cuantas = new Set(FICHAS.flatMap((f) => fuentesDe(f).map((c) => c.enlace))).size;
      seccion = el('section', 'bd-seccion');
      filtro = el('div', 'bd-filtro');
      filtro.setAttribute('role', 'group');
      ['todo', ...AREAS].forEach((a) => {
        const b = boton('', '', () => filtrar(a));
        b.textContent = a === 'todo' ? t.todo : t.areas[a];
        b.dataset.area = a;
        b.setAttribute('aria-pressed', String(a === estado.area));
        filtro.appendChild(b);
      });
      rejilla = el('div', 'bd-fichas');
      FICHAS.forEach((f) => rejilla.appendChild(tarjeta(f, d)));
      seccion.append(el('span', 'bd-etq', t.cifrasTitulo), el('p', 'bd-ayuda', t.cifrasAyuda), filtro, rejilla);
      const no = el('ul', 'bd-no'), lista = tx('perfil.baseInfo.noHace');
      (Array.isArray(lista) ? lista : []).forEach((x) => { const li = el('li'); li.innerHTML = icono('cerrar'); li.appendChild(el('span', null, x)); no.appendChild(li); });
      scroll.append(respuesta, el('p', 'bd-revisado', `${tx('perfil.baseInfo.revisado')} · ${t.cuantas.replace('{cifras}', FICHAS.length).replace('{fuentes}', cuantas)}`), cuadro(), seccion, el('span', 'bd-etq bd-no-titulo', tx('perfil.baseInfo.noHaceTitulo')), no, el('p', 'bd-pie', tx('perfil.baseInfo.revisado')));
      fondo.replaceChildren(nav, scroll);
    }

    const altoDeNav = () => (nav ? nav.offsetHeight : 104);
    const topeDeLasCifras = () => Math.max(0, seccion.offsetTop - altoDeNav() - 2);
    const topeDeLaRejilla = () => Math.max(0, rejilla.offsetTop - altoDeNav() - filtro.offsetHeight + 4);
    const irA = (y, suave) => { if (suave && !quieto()) scroll.scrollTo({ top: y, behavior: 'smooth' }); else scroll.scrollTop = y; };
    /** Con pocas fichas a la vista, la retícula conserva el alto de la pantalla: el filtro queda arriba y nada salta. */
    function ajustarAlto() {
      rejilla.style.minHeight = `${Math.max(0, scroll.clientHeight - altoDeNav() - filtro.offsetHeight - (parseFloat(getComputedStyle(scroll).paddingBottom) || 0))}px`;
    }

    const seFue = (x) => { x.getAnimations().forEach((a) => a.cancel()); x.classList.remove('sale'); x.removeAttribute('style'); x.hidden = true; };
    /** El filtro por área: las que no son se apagan en su lugar y las que quedan se acomodan. */
    function filtrar(area, deUna) {
      if (area === estado.area || !rejilla) return;
      const tarjetas = [...rejilla.querySelectorAll('.bd-ficha')], sinMovimiento = deUna || quieto();
      tarjetas.filter((x) => x.classList.contains('sale')).forEach(seFue);
      const antes = new Map(tarjetas.filter((x) => !x.hidden).map((x) => [x, x.getBoundingClientRect()])), caja = rejilla.getBoundingClientRect(), salen = [];
      estado.area = area;
      filtro.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === area)));
      const elegido = filtro.querySelector(`[data-area="${area}"]`), a = elegido.getBoundingClientRect(), f = filtro.getBoundingClientRect();
      if (a.left < f.left + 16 || a.right > f.right - 16) filtro.scrollTo({ left: Math.max(0, filtro.scrollLeft + a.left - f.left - 60), behavior: sinMovimiento ? 'auto' : 'smooth' });
      tarjetas.forEach((x) => {
        const queda = area === 'todo' || x.dataset.area === area;
        if (queda || x.hidden || sinMovimiento) { x.hidden = !queda; return; }
        const r = antes.get(x);
        x.classList.add('sale');
        Object.assign(x.style, { left: `${r.left - caja.left}px`, top: `${r.top - caja.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        salen.push(x);
      });
      if (scroll.scrollTop > topeDeLaRejilla()) scroll.scrollTop = topeDeLaRejilla();
      if (sinMovimiento) return;
      const corrida = rejilla.getBoundingClientRect();
      // Las que se van quedan donde estaban en la pantalla, aunque la retícula se haya corrido.
      salen.forEach((x) => {
        x.style.top = `${parseFloat(x.style.top) + caja.top - corrida.top}px`;
        x.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }], { id: 'bd-filtro', duration: 220, easing: 'ease-out', fill: 'forwards' }).onfinish = () => seFue(x);
      });
      tarjetas.forEach((x) => {
        if (x.hidden || x.classList.contains('sale')) return;
        const de = antes.get(x), en = x.getBoundingClientRect();
        if (!de) x.animate([{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'scale(1)' }], { id: 'bd-filtro', duration: 320, delay: 90, easing: 'ease-out', fill: 'backwards' });
        else if (de.left !== en.left || de.top !== en.top) x.animate([{ transform: `translate(${de.left - en.left}px, ${de.top - en.top}px)` }, { transform: 'translate(0, 0)' }], { id: 'bd-filtro', duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      });
    }

    // ------------------------------------------------------------ la ficha, que crece desde su marco
    const rectEn = (n) => { const a = n.getBoundingClientRect(), b = raiz.getBoundingClientRect(), k = raiz.offsetWidth ? b.width / raiz.offsetWidth : 1; return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k }; };
    const seVe = (n) => { if (!n || !n.isConnected || n.hidden) return false; const a = rectEn(n); return a.w > 0 && a.y + a.h > 70 && a.y < raiz.clientHeight - 100; };
    // Con nombre («bd-…»): las capturas frenan estas animaciones a mitad de camino.
    const TIEMPO = { id: 'bd-ficha', duration: 440, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' };
    const parar = () => { clearTimeout(estado.espera); estado.animaciones.forEach((a) => a.cancel()); estado.animaciones = []; };
    const soltar = () => [capa, clon, capaDentro, cerrarCapa].forEach((x) => x.getAnimations().forEach((a) => a.cancel()));
    /** Lo que se tocó, copiado sobre la ficha: de ahí crece y ahí vuelve. Quieto: su dibujo no se traza de nuevo. */
    function copiar(origen, a) {
      const copia = origen.cloneNode(true);
      copia.removeAttribute('style');
      copia.classList.remove('sale');
      copia.querySelectorAll('.bd-dib').forEach((x) => x.classList.remove('vista', 'espera'));
      clon.replaceChildren(copia);
      clon.hidden = false;
      Object.assign(clon.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${a.w}px`, height: `${a.h}px` });
    }
    const marco = (origen, a) => `inset(${a.y}px ${raiz.clientWidth - a.x - a.w}px ${raiz.clientHeight - a.y - a.h}px ${a.x}px round ${parseFloat(getComputedStyle(origen).borderTopLeftRadius) || 14}px)`;
    const ENTERO = 'inset(0px 0px 0px 0px round 0px)', EN_SU_LUGAR = 'translate(0px, 0px) scale(1)', PAREJO = Object.assign({}, TIEMPO, { easing: 'linear' });
    const esChico = (a) => a.h < 80;

    function fuentes(f) {
      const citas = fuentesDe(f);
      if (!citas.length) return '';
      const caja = el('div', 'bd-fuentes'), dentro = el('div', 'bd-fuentes-dentro'), ol = el('ol');
      // Cada fuente entera es el enlace: así se toca con holgura (más de 44 px), no solo la línea de la dirección.
      citas.forEach((c, i) => {
        const li = el('li', 'bd-cita'), enlace = el('a'), texto = el('span');
        Object.assign(enlace, { href: c.enlace, target: '_blank', rel: 'noopener' });
        texto.append(el('b', null, c.anio ? `${c.quien} · ${c.anio}` : c.quien), el('em', null, c.que), el('span', 'bd-cita-url', c.enlace.replace(/^https?:\/\/(www\.)?/, '')));
        enlace.append(el('span', 'bd-cita-n', String(i + 1)), texto);
        li.appendChild(enlace);
        ol.appendChild(li);
      });
      dentro.appendChild(ol);
      dentro.inert = true;
      const cab = boton('bd-fuentes-cab', `${icono('adelante')}<span>${u.plural('perfil.baseInfo.citasN', citas.length)}</span>`, () => {
        const si = !caja.classList.contains('abiertas');
        caja.classList.toggle('abiertas', si);
        cab.setAttribute('aria-expanded', String(si));
        dentro.inert = !si;
        // Abiertas, quedan a la vista: baja lo justo, y solo la ficha.
        if (si) setTimeout(() => capaDentro.scrollTo({ top: capaDentro.scrollHeight, behavior: quieto() ? 'auto' : 'smooth' }), 360);
      });
      cab.setAttribute('aria-expanded', 'false');
      caja.append(cab, dentro);
      return caja;
    }

    function pintarFicha(f) {
      const t = textos(), tf = t.fichas[f.id], d = datos(), lamina = el('div', 'bd-lamina'), dib = dibujo(f, d, true), confianza = el('div', 'bd-capa-sello'), ti = el('section', 'bd-bloque'), duda = el('section', 'bd-bloque duda');
      dib.classList.add('espera');
      lamina.appendChild(dib);
      if (tf.nota) lamina.appendChild(el('p', 'bd-lamina-nota', tf.nota));
      confianza.append(sello(f.sello), el('span', null, tx(`perfil.baseInfo.sellos.${f.sello}.texto`)));
      ti.append(el('h5', null, t.paraTi), el('p', null, tf.ti(d)));
      duda.append(el('h5', null, tf.noSabeTitulo || t.noSabe), el('p', null, tf.noSabe));
      capaDentro.replaceChildren(el('span', 'bd-etq', t.areas[f.area]), cifra(tf), el('p', 'bd-frase', tf.frase), confianza, lamina, ti, duda, fuentes(f));
      capa.setAttribute('aria-label', tf.corto);
      cerrarCapa.setAttribute('aria-label', t.cerrar);
    }

    /** El dibujo grande ocupa lo que dibuja: sin aire de más arriba ni abajo. */
    function recortar(svg) {
      const b = svg.getBBox();
      if (b.height > 20) svg.setAttribute('viewBox', `0 ${Math.floor(b.y - 5)} 328 ${Math.ceil(b.height + 10)}`);
    }

    function abrirFicha(id, origen, deUna) {
      const f = FICHAS.find((x) => x.id === id);
      if (!f) return;
      parar();
      soltar();
      pintarFicha(f);
      capa.hidden = false;
      capaDentro.scrollTop = 0;
      recortar(capaDentro.querySelector('.bd-dib'));
      fondo.inert = true;
      Object.assign(estado, { ficha: id, origen: origen || null });
      const lamina = capaDentro.querySelector('.bd-dib');
      const listo = () => { estado.animaciones = []; soltar(); clon.hidden = true; clon.replaceChildren(); lamina.classList.remove('espera'); lamina.classList.add('vista'); };
      if (deUna || quieto()) { listo(); return; }
      if (!seVe(origen)) { clon.hidden = true; estado.animaciones = [capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease' })]; estado.animaciones[0].finished.then(listo, () => {}); return; }
      const a = rectEn(origen), ancho = raiz.clientWidth, chico = esChico(a);
      copiar(origen, a);
      estado.animaciones = [
        capa.animate([{ clipPath: marco(origen, a) }, { clipPath: ENTERO }], TIEMPO),
        // Una píldora o un enlace no crecen con la ficha (su letra saldría enorme): se apagan en su lugar.
        clon.animate([{ transform: EN_SU_LUGAR }, { transform: chico ? EN_SU_LUGAR : `translate(${-a.x}px, ${-a.y}px) scale(${ancho / a.w})` }], TIEMPO),
        clon.animate([{ opacity: 1 }, { opacity: 0, offset: chico ? 0.22 : 0.3 }, { opacity: 0 }], PAREJO),
        capaDentro.animate([{ transform: `translate(${a.x}px, ${a.y}px) scale(${a.w / ancho})` }, { transform: EN_SU_LUGAR }], TIEMPO),
        capaDentro.animate([{ opacity: 0 }, { opacity: 0, offset: chico ? 0.06 : 0.16 }, { opacity: 1, offset: chico ? 0.5 : 0.55 }, { opacity: 1 }], PAREJO),
        cerrarCapa.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], PAREJO),
      ];
      estado.animaciones[0].finished.then(listo, () => {});
    }

    function cerrarFicha(deUna) {
      if (!estado.ficha) return;
      parar();
      soltar();
      const origen = estado.origen;
      Object.assign(estado, { ficha: null, origen: null });
      fondo.inert = false;
      const fin = () => { estado.animaciones = []; soltar(); capa.hidden = true; clon.hidden = true; clon.replaceChildren(); capaDentro.replaceChildren(); };
      if (deUna || quieto()) { fin(); return; }
      if (!seVe(origen)) { estado.animaciones = [capa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease', fill: 'forwards' })]; estado.animaciones[0].finished.then(fin, () => {}); return; }
      const a = rectEn(origen), ancho = raiz.clientWidth, t = Object.assign({}, TIEMPO, { duration: 360 }), parejo = Object.assign({}, t, { easing: 'linear' }), chico = esChico(a);
      copiar(origen, a);
      estado.animaciones = [
        capa.animate([{ clipPath: ENTERO }, { clipPath: marco(origen, a) }], t),
        clon.animate([{ transform: chico ? EN_SU_LUGAR : `translate(${-a.x}px, ${-a.y}px) scale(${ancho / a.w})` }, { transform: EN_SU_LUGAR }], t),
        clon.animate([{ opacity: 0 }, { opacity: 0, offset: chico ? 0.6 : 0.25 }, { opacity: 1, offset: chico ? 0.9 : 0.7 }, { opacity: 1 }], parejo),
        capaDentro.animate([{ transform: EN_SU_LUGAR }, { transform: `translate(${a.x}px, ${a.y}px) scale(${a.w / ancho})` }], t),
        capaDentro.animate([{ opacity: 1 }, { opacity: 0, offset: 0.45 }, { opacity: 0 }], parejo),
        cerrarCapa.animate([{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }], parejo),
      ];
      estado.animaciones[0].finished.then(fin, () => {});
    }

    // ------------------------------------------------------------ ¿Por qué me dice esto?
    /** Un ejemplo: dónde va (el contexto, dibujado simple), la pregunta que la despliega y la cadena de tres nudos. */
    function caso(clase, donde, contexto, pregunta, nudos, ficha) {
      const t = textos(), c = el('article', 'bd-caso ' + clase), caja = el('div', 'bd-porque abierta'), cadena = el('div', 'bd-cadena'), pliegue = el('div', 'bd-cadena-caja'), dentro = el('div');
      nudos.forEach((x, i) => {
        const nudo = el('div', 'bd-nudo'), b = el('b', null, x.cifra);
        nudo.style.setProperty('--i', String(i));
        if (x.u) b.appendChild(el('small', null, x.u));
        nudo.append(el('span', 'bd-etq', t.porque.nudos[i]), b);
        if (x.mini) nudo.insertAdjacentHTML('beforeend', `<svg class="bd-dib" viewBox="0 0 96 20" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${x.mini}</svg>`);
        nudo.appendChild(el('p', null, x.texto));
        if (x.sello) nudo.appendChild(sello(x.sello));
        if (x.fuente) nudo.appendChild(el('cite', null, x.fuente));
        cadena.appendChild(nudo);
      });
      const ver = boton('bd-ver', `<span>${t.verCifra}</span>${icono('adelante')}`, () => abrirFicha(ficha, ver));
      dentro.append(cadena, ver);
      pliegue.appendChild(dentro);
      const abrir = boton('bd-porque-abrir', `<span></span>${icono('abajo')}`, () => {
        const si = !caja.classList.contains('abierta');
        caja.classList.toggle('abierta', si);
        abrir.setAttribute('aria-expanded', String(si));
        pliegue.inert = !si;
        // Al desplegarla, se dibuja otra vez de izquierda a derecha.
        cadena.classList.remove('vista');
        if (si) { void cadena.offsetWidth; cadena.classList.add('vista'); }
      });
      abrir.firstChild.textContent = pregunta;
      abrir.setAttribute('aria-expanded', 'true');
      caja.append(abrir, pliegue);
      c.append(el('span', 'bd-etq', donde), contexto, caja);
      alVerse(cadena);
      return c;
    }

    function pintarPorque() {
      const t = textos().porque, d = datos(), lamina = el('div', 'bd-pq');
      const cita = (ref) => { const c = fuentesDe({ refs: [ref] })[0]; return c ? [c.quien, c.anio].filter(Boolean).join(', ') : ''; };
      nav = el('div', 'bd-nav');
      nav.append(el('span'), el('h2', null, t.titulo), el('span'));
      scroll = el('div', 'bd-scroll');
      seccion = filtro = rejilla = null;
      // En Ascent: el titular del día de la noche corta, con los textos de la app.
      const enAscent = el('div', 'bd-contexto');
      enAscent.append(el('span', null, tx('ascent.dia.sesion', { sesion: d.sesion || '', hora: d.entreno || '' })), el('h4', null, tx('ascent.titular.suenoCorto.titulo')), el('p', null, tx('ascent.titular.suenoCorto.poco')));
      lamina.appendChild(caso('bd-de-ascent as-vars', t.enAscent, enAscent, t.noche.abrir(d), [
        { cifra: d.anocheCorta, texto: t.noche.dato, mini: MINIS.horas(d.anocheH) },
        { cifra: t.noche.regla[0], texto: t.noche.regla[1], mini: MINIS.corta(d.anocheH) },
        { cifra: t.noche.sabe[0], u: t.noche.sabe[1], texto: t.noche.sabe[2], mini: MINIS.reps(), sello: 'solido', fuente: cita('ascent#1') },
      ], 'noche'));
      // En Inicio: la luna y lo que queda de la meta de hoy.
      const enInicio = el('div', 'bd-contexto'), arriba = el('div', 'in-cal-arriba'), luna = Luna.crear({ tam: 76 }), queda = el('div', 'in-cal-cifra');
      luna.ir(d.comido / d.metaHoy, quieto() ? 0 : 900);
      queda.append(el('span', 'in-cal-etq', tx('inicio.teQuedan')), el('b', null, u.numero(Math.max(0, d.metaHoy - d.comido))), el('small', null, tx('inicio.kcalDe', { comido: d.comidoTexto, meta: d.meta })));
      arriba.append(luna.el, queda);
      enInicio.appendChild(arriba);
      lamina.appendChild(caso('', t.enInicio, enInicio, t.meta.abrir(d), [
        { cifra: d.gasto, u: 'kcal', texto: t.meta.dato, mini: MINIS.gasto() },
        { cifra: d.baja ? `−${d.deficit}` : '0', u: 'kcal', texto: t.meta.regla(d), mini: MINIS.deficit(d.fraccionMeta) },
        { cifra: t.meta.sabe[0], u: t.meta.sabe[1], texto: t.meta.sabe[2], mini: MINIS.firme(), sello: 'solido', fuente: cita('metas#3') },
      ], 'control'));
      scroll.append(el('p', 'bd-ayuda', t.intro), lamina);
      fondo.replaceChildren(nav, scroll);
    }

    // ------------------------------------------------------------ las vistas
    /** Pinta lo que haga falta y abre la pantalla; devuelve si ya estaba a la vista (lo que sigue se mueve suave). */
    function mostrar(modo) {
      const ya = p.abierta && estado.modo === modo && estado.idioma === g.idioma;
      if (!ya) {
        cerrarFicha(true);
        Object.assign(estado, { modo, idioma: g.idioma, area: 'todo' });
        if (modo === 'base') pintarBase(); else pintarPorque();
      }
      p.abrir();
      if (!ya && modo === 'base') ajustarAlto();
      return ya;
    }
    /** «En inglés» pone toda la galería en inglés (también la barra) y, al salir, la deja como estaba. */
    function ingles(si) {
      if (si && g.idioma !== 'en') { estado.idiomaDeAntes = g.idioma; window.__idioma('en'); }
      if (!si && estado.idiomaDeAntes) { const antes = estado.idiomaDeAntes; estado.idiomaDeAntes = null; if (g.idioma !== antes) window.__idioma(antes); }
    }
    // Si el idioma cambia con la pantalla abierta, se pinta de nuevo donde estaba.
    const selector = document.getElementById('s-idioma');
    if (selector) selector.addEventListener('click', () => {
      if (!p.abierta || estado.idioma === g.idioma) return;
      const y = scroll ? scroll.scrollTop : 0;
      cerrarFicha(true);
      estado.idioma = g.idioma;
      if (estado.modo === 'base') { pintarBase(); ajustarAlto(); } else pintarPorque();
      scroll.scrollTop = y;
    });

    return {
      abrir(vista, arg) {
        clearTimeout(estado.espera);
        ingles(vista === 'en');
        if (vista === 'porque') {
          if (mostrar('porque')) cerrarFicha(); else scroll.scrollTop = 0;
          return;
        }
        const ya = mostrar('base');
        g.irA(5, true);
        if (vista === 'portada') { cerrarFicha(!ya); irA(0, ya); return; }
        if (vista === 'cifras' || vista === 'en') { cerrarFicha(!ya); filtrar('todo', !ya); irA(topeDeLasCifras(), ya); return; }
        // Una ficha (la de `arg`, o la de la vista): su área en el filtro y, al rato, crece desde su tarjeta.
        const f = FICHAS.find((x) => x.id === (arg || (vista === 'ficha2' ? 'plazo' : 'noche')));
        if (!f) return;
        cerrarFicha(true);
        filtrar(f.area, !ya);
        irA(topeDeLasCifras(), false);
        estado.espera = setTimeout(() => abrirFicha(f.id, rejilla.querySelector(`[data-id="${f.id}"]`)), ya ? 460 : 640);
      },
      cerrar() {
        clearTimeout(estado.espera);
        cerrarFicha(true);
        ingles(false);
        p.cerrar();
      },
    };
  },
});
