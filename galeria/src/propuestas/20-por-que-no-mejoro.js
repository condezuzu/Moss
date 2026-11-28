// ¿Por qué no estás mejorando? (27/11/2026, para aprobar). Vive en la sección de Ascent: se elige un ejercicio y se
// ve su historial junto con lo que Moss sabe de esas semanas, todo en el mismo eje de tiempo.
// - El veredicto sale de las cuentas de la app tal cual, como en la sección: si bajó (TuSesion.bajadaDeFuerza, que va
//   primero), la tendencia de 12 semanas (ProgresoCompartido.tendenciaDeFuerza), cuándo está estancado (estaEstancado,
//   con el umbral de Ascent) y por qué puede ser (razonesDeEstancamiento, con las semanas de
//   Estancados.semanasParaLasRazones o de TuSesion.semanasDeLaBajada). Siempre «puede influir», nunca «la causa es».
//   «Los que no suben», en la hoja de elegir, sale de la misma regla.
// - «Carriles»: la fuerza (cada sesión, con la franja de tu ruido de un día a otro), las series del músculo, la comida
//   (los días que llegaste, con los cortes de Moss: Energia.LLEGASTE y Metas.estadoDeMacro) y el sueño (el promedio
//   contra lo que necesitas y las noches de menos de 6 h). Una semana elegida se abre día por día.
// - «Antes y ahora»: un cuadro de pendientes entre las semanas de cuando subía y las de ahora.
// - «Semana por semana»: lo mismo girado, para comparar.
// La persona es la de AscentDeMentira (05-ascent-datos.js) en su día «cargado», el que las propuestas de la sección
// muestran por defecto: así dice lo mismo que ellas. Sus sesiones de Ascent, su meta, su peso y lo que necesita dormir.
// Su diario de Moss empieza cuando empezó a usarla (Datos.INICIO, el 31 de agosto): la comida es la de la galería desde
// el 28 de septiembre y, antes, los mismos tres días que se turnan ahí (anotaba todos los días); las noches, las de
// Salud desde el 24 de septiembre y, antes, unas parecidas: lo único inventado.

const SEMANAS = ProgresoCompartido.SEMANAS_DE_LA_TENDENCIA;
const HOY = Datos.HOY;
const A = Datos.ASCENT;
const LUNES = Array.from({ length: SEMANAS }, (_, i) => Fechas.sumarDias(Fechas.lunesDe(HOY), -7 * (SEMANAS - 1 - i)));
// Los carriles, en las unidades del dibujo: 12 columnas de 26 y, a la derecha, el lugar de las referencias.
const ANCHO = 349;
const COL = 26;
const TRAZO = COL * SEMANAS;
// Las semanas enteras de antes de que empezara a usar Moss: sin comida ni noches.
const ANTES_DE_MOSS = LUNES.filter((l) => Fechas.sumarDias(l, 6) < Datos.INICIO).length;
// «Días que llegaste» no tiene regla en la app: acá, como las series, cuenta si baja 2 días por semana o más.
const MENOS_DIAS = 2;
// Los años entrenando según el cuestionario, como en AscentDeMentira: desde 2, «se sube más lento» va de contexto.
const ANIOS = { principiante: 0, intermedio: 2, avanzado: 4 };
// Lo que abre cada botón de la galería; desde otra propuesta, el que le pasen o el que lleva más tiempo sin subir.
const DE_LA_VISTA = { mejorando: 'sentadilla', pocosDatos: 'peso_muerto', bajo: 'press_militar' };
const DEL_EJEMPLO = 'press_banca';

// Los textos de la propuesta, con la forma que tendrían en src/textos, hasta que se apruebe.
const TEXTOS = {
  es: {
    titulo: '¿Por qué no estás mejorando?',
    elegir: 'Elige un ejercicio',
    buscar: 'Buscar un ejercicio',
    cerrar: 'Cerrar',
    noSuben: 'Los que no suben',
    desde: 'desde el {fecha}',
    bajoDesde: 'bajó un {n} % desde el {fecha}',
    nada: 'Nada con ese nombre.',
    soloConUnRm: 'Aparecen los ejercicios con 1RM estimado: con peso y 10 repeticiones o menos.',
    diaMes: '{num} de {mes}',
    semanaUnMes: 'Semana del {a} al {b} de {mes}',
    semanaDosMeses: 'Semana del {a} de {mesA} al {b} de {mesB}',
    enCurso: 'en curso',
    antesDeMoss: 'Antes de Moss',
    veredicto: {
      noSube: 'No sube desde el {fecha}',
      bajo: 'Bajó un {n} % desde el {fecha}',
      sube: 'Sí estás mejorando: ~{n} % por mes',
      faltanSesiones: { uno: 'Falta 1 sesión para poder comparar', otros: 'Faltan {n} sesiones para poder comparar' },
      faltanSemanas: 'Faltan semanas para poder comparar',
      noSeSabe: 'Todavía no se sabe si sube',
    },
    bajo: {
      cambio: 'Lo que cambió: <b>{que}</b>',
      seVe: 'Lo que se ve: <b>{que}</b>',
      que: {
        series: 'menos series de {musculo}', frecuencia: 'lo haces menos veces por semana', pesadas: 'pocas series pesadas ({n} de {de})', ningunaPesada: 'ninguna de tus {de} series es pesada',
        bajando: 'bajas de peso rápido', llegaste: 'llegas menos días a tu meta', proteina: 'poca proteína', sueno: 'duermes menos', suenoPoco: 'duermes menos de 6 horas',
      },
      definicion: 'Estás en definición: que la fuerza se mantenga ya es un buen resultado.',
      sinCambio: 'Sin un cambio claro en tus series, tu comida ni tu sueño.',
      sube: 'De {a} a {b} · {sesiones} en 12 semanas',
      subeSinKilos: '{sesiones} en 12 semanas: entre {a} % y {b} % por mes.',
      faltanSesiones: 'Con 6 sesiones en 12 semanas se puede decir si sube. Llevas {n}.',
      faltanSemanas: 'Van {n} semanas con este ejercicio: hacen falta 6.',
      noSeSabe: 'En 12 semanas no se ve claro: entre {a} % y {b} % por mes.',
      pronto: 'Sin subida clara en {n} semanas, pero tu última marca es del {fecha}: todavía es pronto.',
    },
    verAntesYAhora: 'Antes y ahora',
    carriles: {
      etiqueta: 'Las últimas 12 semanas. Arrastra para elegir una semana.',
      fuerza: 'Fuerza', fuerzaSub: '1RM estimado',
      series: 'Series', seriesSub: 'de {musculo}, por semana',
      comida: 'Comida', comidaSub: 'días que llegaste a tu meta',
      sueno: 'Sueño', suenoSub: 'promedio por noche',
      desdeAqui: 'desde aquí no sube', desdeAquiBajo: 'desde aquí bajó',
      desdeAntes: 'No sube desde antes de estas 12 semanas.',
      franja: 'Tu ruido de un día a otro en este ejercicio (±{n} %)', marca: 'Tu última marca', necesitas: 'Lo que necesitas ({horas})', nocheDeMenos: 'Una noche de menos de 6 h',
      seriesAntes: 'Tus series por semana cuando subías', seriesAntesBajo: 'Tus series por semana antes',
    },
    lee: {
      sinSesion: 'sin sesión',
      series: { uno: '1 serie', otros: '{n} series' },
      llegaste: 'llegaste {n} de {de}',
      sinAnotar: 'sin anotar',
      sinNoches: 'sin noches',
      antesDeMoss: 'antes de Moss',
      menosDe6: { uno: '1 noche < 6 h', otros: '{n} noches < 6 h' },
    },
    dias: { sesion: 'Sesión', comida: 'Comida', sueno: 'Sueño, la noche anterior', antesDeMoss: 'Todavía no usabas Moss: de esta semana solo están tus sesiones de Ascent.' },
    leyenda: {
      llegaste: 'Llegaste', pasaste: 'Te pasaste', noLlegaste: 'No llegaste', sinAnotar: 'Sin anotar',
      bien: 'Bien', corta: 'Corta', menosDe6: 'Menos de 6 h', antesDeSesion: 'La noche antes de la sesión',
    },
    cuadro: {
      antes: 'Cuando subías', antesBajo: 'Antes', ahora: 'Ahora',
      filas: { series: 'Series de {musculo}', veces: 'Veces por semana', llegaste: 'Días que llegaste', proteina: 'Proteína', sueno: 'Sueño' },
      unidades: { series: 'por semana', veces: 'con este ejercicio', llegaste: 'de 7, por semana', proteina: 'gramos por kilo, por día', sueno: 'por noche' },
      puedeInfluir: 'puede influir',
      sinAntes: 'No hay semanas de cuando subías para comparar: es de antes de lo que Moss tiene.',
      sinMoss: 'Empezaste con Moss el {fecha}: de cuando subías no hay comida ni sueño para comparar.',
      sinMossBajo: 'Empezaste con Moss el {fecha}: de antes no hay comida ni sueño para comparar.',
      queCambiar: 'Qué cambiar',
    },
    // Moss sugiere, no manda: una sugerencia por razón, en el orden de la app.
    hacer: {
      series: 'Puede ayudar volver a unas {n} series de {musculo} por semana, como {como}.',
      frecuencia: 'Puede ayudar volver a hacerlo {n} veces por semana, como {como}.',
      pesadas: 'Puede ayudar sumar series pesadas, de 6 repeticiones o menos: un tercio de tus series o más.',
      bajando: 'Si te importa más la fuerza, puede ayudar bajar de peso más despacio.',
      definicion: 'En déficit, mantener la fuerza ya es un buen resultado: las series pesadas y la proteína ayudan a lograrlo.',
      llegaste: 'Puede ayudar llegar a tu meta de calorías más días: unos {n} de 7, como {como}.',
      proteina: 'Puede ayudar llegar a unos {g} g de proteína por día (~1,6 g por kilo).',
      sueno: 'Si puedes, dormir más puede ayudar: lo tuyo es de unas {horas}.',
      nada: 'Si sigue así unas semanas más, puede ayudar cambiar el estímulo: otro rango de repeticiones u otra variante del ejercicio.',
    },
    como: { noSube: 'cuando subías', bajo: 'antes' },
    basa: {
      titulo: 'En qué se basa',
      lineas: [
        'La comida de ayer no cambia tu fuerza de hoy: por eso la comida se mira por semana. El sueño sí se mira noche por noche: una noche de menos de 6 horas puede notarse al día siguiente.',
        'Que dos cosas coincidan no prueba que una cause la otra: por eso dice «puede influir».',
        'De un día a otro tu fuerza cambia sin motivo: dentro de la franja, un cambio no dice nada. Por eso «no sube» pide 8 semanas o más sin subida clara y {n} semanas o más desde tu última marca, y «bajó», que tus últimas 4 sesiones queden más de un 4 % por debajo de las 8 de antes.',
        'Llegaste: desde el 90 % de tu meta de calorías. Te pasaste: 20 % o más por encima. Noche corta: 45 minutos o más por debajo de lo que necesitas.',
      ],
    },
    semanas: { fuerza: 'Fuerza', comida: 'Comida', sueno: 'Sueño', sube: 'subió', igual: 'igual', baja: 'bajó', desdeAqui: 'desde aquí no sube', desdeAquiBajo: 'desde aquí bajó' },
  },
  en: {
    titulo: 'Why am I not improving?',
    elegir: 'Choose an exercise',
    buscar: 'Search exercises',
    cerrar: 'Close',
    noSuben: 'Not improving',
    desde: 'since {fecha}',
    bajoDesde: 'down {n}% since {fecha}',
    nada: 'Nothing with that name.',
    soloConUnRm: 'Exercises with an estimated 1RM show up here: with weight and 10 reps or fewer.',
    diaMes: '{mes} {num}',
    semanaUnMes: 'Week of {mes} {a}–{b}',
    semanaDosMeses: 'Week of {mesA} {a} – {mesB} {b}',
    enCurso: 'in progress',
    antesDeMoss: 'Before Moss',
    veredicto: {
      noSube: 'Not improving since {fecha}',
      bajo: 'Down {n}% since {fecha}',
      sube: 'You are improving: ~{n}% a month',
      faltanSesiones: { uno: '1 more session needed to compare', otros: '{n} more sessions needed to compare' },
      faltanSemanas: 'More weeks needed to compare',
      noSeSabe: 'Too early to tell if it’s going up',
    },
    bajo: {
      cambio: 'What changed: <b>{que}</b>',
      seVe: 'What stands out: <b>{que}</b>',
      que: {
        series: 'fewer {musculo} sets', frecuencia: 'you do it less often', pesadas: 'few heavy sets ({n} of {de})', ningunaPesada: 'none of your {de} sets is heavy',
        bajando: 'you’re losing weight fast', llegaste: 'fewer days on your goal', proteina: 'low protein', sueno: 'you’re sleeping less', suenoPoco: 'you sleep under 6 hours',
      },
      definicion: 'You’re cutting: holding your strength is already a good result.',
      sinCambio: 'No clear change in your sets, your food, or your sleep.',
      sube: 'From {a} to {b} · {sesiones} in 12 weeks',
      subeSinKilos: '{sesiones} in 12 weeks: between {a}% and {b}% a month.',
      faltanSesiones: 'With 6 sessions in 12 weeks, Moss can tell if it’s going up. You have {n}.',
      faltanSemanas: '{n} weeks with this exercise so far: 6 are needed.',
      noSeSabe: 'Not clear over 12 weeks: between {a}% and {b}% a month.',
      pronto: 'No clear increase over {n} weeks, but your last best was {fecha}: it’s still early.',
    },
    verAntesYAhora: 'Before and now',
    carriles: {
      etiqueta: 'The last 12 weeks. Drag to choose a week.',
      fuerza: 'Strength', fuerzaSub: 'estimated 1RM',
      series: 'Sets', seriesSub: '{musculo}, per week',
      comida: 'Food', comidaSub: 'days you hit your goal',
      sueno: 'Sleep', suenoSub: 'nightly average',
      desdeAqui: 'not improving from here', desdeAquiBajo: 'down from here',
      desdeAntes: 'Not improving since before these 12 weeks.',
      franja: 'Your day-to-day noise in this exercise (±{n}%)', marca: 'Your last best', necesitas: 'What you need ({horas})', nocheDeMenos: 'A night under 6 h',
      seriesAntes: 'Your weekly sets while it was going up', seriesAntesBajo: 'Your weekly sets before',
    },
    lee: {
      sinSesion: 'no session',
      series: { uno: '1 set', otros: '{n} sets' },
      llegaste: 'hit {n} of {de}',
      sinAnotar: 'not logged',
      sinNoches: 'no nights',
      antesDeMoss: 'before Moss',
      menosDe6: { uno: '1 night < 6 h', otros: '{n} nights < 6 h' },
    },
    dias: { sesion: 'Session', comida: 'Food', sueno: 'Sleep, the night before', antesDeMoss: 'You weren’t using Moss yet: this week only has your Ascent sessions.' },
    leyenda: {
      llegaste: 'Hit your goal', pasaste: 'Went over', noLlegaste: 'Fell short', sinAnotar: 'Not logged',
      bien: 'Fine', corta: 'Short', menosDe6: 'Under 6 h', antesDeSesion: 'The night before the session',
    },
    cuadro: {
      antes: 'While it was going up', antesBajo: 'Before', ahora: 'Now',
      filas: { series: '{musculo} sets', veces: 'Times per week', llegaste: 'Days on your goal', proteina: 'Protein', sueno: 'Sleep' },
      unidades: { series: 'per week', veces: 'with this exercise', llegaste: 'out of 7, per week', proteina: 'grams per kg, per day', sueno: 'per night' },
      puedeInfluir: 'may be a factor',
      sinAntes: 'There are no weeks from while it was going up to compare: it’s from before what Moss has.',
      sinMoss: 'You started using Moss on {fecha}: there’s no food or sleep from while it was going up to compare.',
      sinMossBajo: 'You started using Moss on {fecha}: there’s no food or sleep from before to compare.',
      queCambiar: 'What to change',
    },
    hacer: {
      series: 'Going back to about {n} {musculo} sets a week, like {como}, may help.',
      frecuencia: 'Going back to doing it {n} times a week, like {como}, may help.',
      pesadas: 'Adding heavy sets of 6 reps or fewer may help: a third of your sets or more.',
      bajando: 'If strength matters more to you, losing weight more slowly may help.',
      definicion: 'On a deficit, holding your strength is already a good result: heavy sets and protein help with that.',
      llegaste: 'Hitting your calorie goal on more days may help: about {n} out of 7, like {como}.',
      proteina: 'Getting to about {g} g of protein a day may help (~1.6 g per kg).',
      sueno: 'If you can, sleeping more may help: you need about {horas}.',
      nada: 'If it stays like this for a few more weeks, changing the stimulus may help: another rep range or another variation of the exercise.',
    },
    como: { noSube: 'when it was going up', bajo: 'before' },
    basa: {
      titulo: 'What it’s based on',
      lineas: [
        'Yesterday’s food doesn’t change today’s strength: that’s why food is looked at by week. Sleep is looked at night by night: a night under 6 hours can show the next day.',
        'Two things happening together doesn’t prove one causes the other: that’s why it says “may be a factor.”',
        'From one day to the next, your strength varies for no reason: inside the band, a change means nothing. That’s why “not improving” takes 8 weeks or more with no clear increase and {n} weeks or more since your last best, and “down” takes your last 4 sessions more than 4% below the 8 before them.',
        'Hit your goal: 90% of your calorie goal or more. Went over: 20% or more above it. Short night: 45 minutes or more below what you need.',
      ],
    },
    semanas: { fuerza: 'Strength', comida: 'Food', sueno: 'Sleep', sube: 'went up', igual: 'same', baja: 'went down', desdeAqui: 'not improving from here', desdeAquiBajo: 'down from here' },
  },
};

// Con la paleta de la sección de Ascent (as-vars): tinta y grises, y terracota solo en lo que puede influir.
const CSS = `
.tel .pqn { color: var(--as-tinta); background: var(--as-fondo); }
.pqn-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) + 2px) 22px calc(var(--pestanas) + 46px); scrollbar-width: none; touch-action: pan-y; }
.pqn-scroll::-webkit-scrollbar { display: none; }
.pqn-i { display: inline-grid; flex: none; }
.pqn-i svg, .pqn-hoja .pqn-i svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.pqn button { -webkit-tap-highlight-color: transparent; }
.pqn :focus-visible, .pqn-hoja :focus-visible { outline: 2px solid var(--as-claro); outline-offset: 2px; }
.pqn-etq { margin: 0; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }

.pqn-cab { display: flex; align-items: center; min-height: 44px; margin-left: -13px; }
.pqn-atras { appearance: none; cursor: pointer; flex: none; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: none; color: var(--as-tinta); transition: background-color 0.15s; }
.pqn-atras:active { background: rgba(232, 236, 246, 0.08); }
.pqn-titulo { margin: 0; font: 500 17px/1.2 var(--texto); color: var(--as-tinta); }
.pqn-campo { appearance: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 46px; margin-top: 8px; padding: 0 14px 0 18px; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; background: rgba(232, 236, 246, 0.03); color: var(--as-tinta); font: 400 16px/1.2 var(--texto); text-align: left; transition: background-color 0.15s, border-color 0.15s; }
.pqn-campo:active { background: rgba(232, 236, 246, 0.08); border-color: var(--as-sub); }
.pqn-campo .pqn-i { color: var(--as-sub); }
.pqn-campo .pqn-i svg { width: 18px; height: 18px; }

.pqn-veredicto { appearance: none; display: block; width: 100%; margin: 24px 0 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; }
button.pqn-veredicto { cursor: pointer; }
.pqn-frase { display: block; font: 200 31px/1.1 var(--numeros); letter-spacing: -0.015em; color: var(--as-claro); text-wrap: balance; }
.pqn-bajo { display: block; margin-top: 12px; font: 400 15px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.pqn-bajo b { font-weight: 400; color: var(--as-lejos); }
.pqn-ver { display: inline-flex; align-items: center; gap: 5px; margin-top: 12px; padding-bottom: 3px; border-bottom: 1px solid rgba(170, 178, 196, 0.42); font: 400 13.5px/1.2 var(--texto); color: var(--as-sub); transition: color 0.2s, border-color 0.2s; }
.pqn-ver .pqn-i svg { width: 14px; height: 14px; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqn-veredicto[aria-expanded="true"] .pqn-ver { color: var(--as-tinta); border-color: rgba(232, 236, 246, 0.5); }
.pqn-veredicto[aria-expanded="true"] .pqn-ver .pqn-i svg { rotate: 180deg; }
.pqn-veredicto:active .pqn-frase { opacity: 0.82; }
.pqn-entra > * { animation: pqn-aparece 0.34s ease both; }

/* Lo que se abre crece desde lo que se tocó. */
.pqn-pliegue { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqn-pliegue > div { min-height: 0; overflow: hidden; opacity: 0; translate: 0 -8px; transition: opacity 0.28s, translate 0.4s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqn-pliegue.abierto { grid-template-rows: 1fr; }
.pqn-pliegue.abierto > div { opacity: 1; translate: 0 0; }

.pqn-cuadro { margin-top: 18px; padding: 14px 0 16px; border-top: 1px solid var(--as-linea); border-bottom: 1px solid var(--as-linea); }
/* «Ahora» lleva la columna más ancha: «23 sesiones» entra sin cortarse; «Cuando subías» crece hacia la izquierda. */
.pqn-cuadro-cab, .pqn-factor { display: grid; grid-template-columns: minmax(0, 1fr) 52px 56px 74px; column-gap: 8px; align-items: center; }
.pqn-cuadro-cab { padding-bottom: 8px; }
.pqn-cuadro-cab span { font: 400 13px/1.25 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.pqn-cuadro-cab small { display: block; margin-top: 2px; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); }
.pqn-cuadro-cab .antes { grid-column: 2; justify-self: end; text-align: right; }
.pqn-cuadro-cab .ahora { grid-column: 4; }
.pqn-factor { min-height: 50px; padding: 5px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.pqn-factor-nombre { font: 400 14px/1.25 var(--texto); color: var(--as-sub); }
.pqn-factor-nombre small { display: block; margin-top: 2px; font: 400 13px/1.25 var(--texto); color: var(--as-apagado); }
.pqn-factor-valor { font: 400 15px/1 var(--numeros); color: var(--as-sub); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pqn-factor-valor.antes { text-align: right; }
.pqn-pendiente { display: block; width: 56px; height: 30px; overflow: visible; }
.pqn-pendiente line { stroke: #6b7388; stroke-width: 1.5; stroke-linecap: round; }
.pqn-pendiente line.sin { stroke-dasharray: 1 4; }
.pqn-pendiente circle { fill: var(--as-apagado); }
.pqn-factor.marcado .pqn-factor-nombre, .pqn-factor.marcado .pqn-factor-nombre small, .pqn-factor.marcado .pqn-factor-valor.ahora { color: var(--as-lejos); }
.pqn-factor.marcado .pqn-pendiente line { stroke: var(--as-lejos); stroke-width: 2; }
.pqn-factor.marcado .pqn-pendiente circle { fill: var(--as-lejos); }
.pqn-pliegue.abierto .pqn-pendiente line { animation: pqn-traza 0.5s 0.16s cubic-bezier(0.3, 0.6, 0.2, 1) backwards; stroke-dasharray: 60; }
.pqn-pliegue.abierto .pqn-pendiente line.sin { animation: none; stroke-dasharray: 1 4; }
.pqn-sin-antes { margin: 10px 0 0; font: 400 13px/1.4 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.pqn-que { margin: 18px 0 0; }
.pqn-que p { margin: 8px 0 0; font: 400 15px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.pqn-que p.pqn-ademas { margin-top: 10px; font-size: 13px; line-height: 1.4; color: var(--as-sub); }

/* Los carriles: las cuatro bandas con el mismo eje. Las rayas (la semana elegida, la del dedo y «desde aquí no sube»)
   van por encima de los dibujos y por detrás de los rótulos. */
.pqn-carriles { position: relative; margin-top: 26px; touch-action: pan-y; outline-offset: 6px; cursor: default; }
.pqn-carriles.con-desde { padding-top: 18px; }
/* Terminan donde empieza el eje (36 px más 6 de margen): la raya y su punto no tapan los números. */
.pqn-rayas { position: absolute; left: 0; top: 0; bottom: 42px; width: calc(100% * ${TRAZO} / ${ANCHO}); z-index: 2; pointer-events: none; }
.pqn-carriles.con-desde .pqn-rayas { top: 18px; }
.pqn-banda { position: absolute; top: 0; bottom: 0; left: calc(var(--col, 0) * 100% / ${SEMANAS}); width: calc(100% / ${SEMANAS}); border-radius: 4px; background: rgba(232, 236, 246, 0.06); transition: left 0.18s cubic-bezier(0.2, 0.7, 0.2, 1); animation: pqn-aparece 0.4s 1s ease backwards; }
/* La raya llega con el dibujo, de izquierda a derecha, hasta la semana elegida: así se ve que se puede mover. */
.pqn-regla { position: absolute; top: 0; bottom: -5px; left: calc(var(--x, 0) * 100%); width: 1px; margin-left: -0.5px; background: rgba(232, 236, 246, 0.82); transition: left 0.2s cubic-bezier(0.2, 0.7, 0.2, 1); animation: pqn-llega 1.05s cubic-bezier(0.4, 0, 0.2, 1) 0.16s backwards; }
.pqn-regla::after { content: ''; position: absolute; left: -2.5px; bottom: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--as-tinta); }
.pqn-carriles.arrastrando .pqn-regla { transition: none; }
.pqn-carriles.tocada .pqn-regla { animation: none; }
.pqn-desde { position: absolute; top: -18px; bottom: 0; left: calc(var(--desde) * 100%); width: 0; border-left: 1px dashed rgba(232, 236, 246, 0.6); animation: pqn-aparece 0.4s 0.9s ease backwards; }
.pqn-desde b { position: absolute; top: 0; left: 7px; font: 400 13px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.pqn-desde.derecha b { left: auto; right: 7px; }
.pqn-desde-antes { position: absolute; left: 0; top: 0; margin: 0; font: 400 13px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.pqn-carril { position: relative; }
.pqn-carril + .pqn-carril { margin-top: 8px; }
.pqn-carril-cab { display: flex; align-items: baseline; gap: 8px; height: 19px; }
.pqn-carril-cab > span { position: relative; z-index: 3; background: var(--as-fondo); }
.pqn-carril-cab .pqn-etq { padding-right: 2px; transition: color 0.3s; }
.pqn-carril.marcado .pqn-etq { color: var(--as-lejos); }
.pqn-carril-sub { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); white-space: nowrap; padding-right: 4px; }
.pqn-lee { flex: none; margin-left: auto; padding-left: 6px; font: 400 13px/1.2 var(--texto); color: var(--as-tinta); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pqn-lee.cambia { animation: pqn-lee 0.2s ease both; }
.pqn-carril svg { display: block; width: 100%; height: auto; overflow: visible; animation: pqn-dibuja 0.9s cubic-bezier(0.4, 0, 0.2, 1) both; animation-delay: calc(0.16s + var(--n, 0) * 0.1s); }
/* Las semanas de antes de que usara Moss, sobre su lugar vacío; tapa las rayas, como los rótulos. */
.pqn-antes-moss { position: absolute; z-index: 3; left: 0; top: calc(19px + (100% - 19px) / 2); width: calc(100% * ${COL * ANTES_DE_MOSS} / ${ANCHO}); translate: 0 -50%; text-align: center; pointer-events: none; animation: pqn-aparece 0.4s 0.5s ease backwards; }
.pqn-antes-moss span { padding: 0 5px; background: var(--as-fondo); font: 400 13px/1.2 var(--texto); color: var(--as-apagado); white-space: nowrap; }
/* En unidades del dibujo: con 14, también pasa los 13 px en un teléfono de 375. */
.pqn-gut { font: 400 14px/1 var(--numeros); fill: var(--as-apagado); }
.pqn-gut.marcado { fill: var(--as-lejos); }
.pqn-f-franja { fill: rgba(232, 236, 246, 0.085); }
.pqn-f-tend { fill: none; stroke: rgba(232, 236, 246, 0.26); stroke-width: 1; }
.pqn-f-punto { fill: var(--as-tinta); transform-box: fill-box; transform-origin: center; transition: transform 0.18s; }
.pqn-f-punto.elegida { transform: scale(1.45); }
.pqn-f-aro { fill: none; stroke: var(--as-tinta); stroke-width: 1; opacity: 0.7; }
.pqn-b { color: var(--as-claro); fill: currentColor; fill-opacity: 0.72; transition: fill-opacity 0.2s; }
.pqn-carril.marcado .pqn-b.ahora { color: var(--as-lejos); fill-opacity: 0.85; }
/* La semana que corre todavía no terminó: solo el contorno. */
.pqn-b.parcial, .pqn-carril.marcado .pqn-b.ahora.parcial { fill-opacity: 0.22; stroke: currentColor; stroke-width: 1; }
.pqn-b.elegida, .pqn-carril.marcado .pqn-b.ahora.elegida { fill-opacity: 1; }
.pqn-b.parcial.elegida, .pqn-carril.marcado .pqn-b.ahora.parcial.elegida { fill-opacity: 0.4; }
.pqn-b-cero { stroke: var(--as-tenue); stroke-width: 2; stroke-linecap: round; }
.pqn-b-antes { stroke: var(--as-sub); stroke-width: 1; stroke-dasharray: 2 3; }
.pqn-c-si { fill: var(--as-claro); }
.pqn-c-aro { fill: none; stroke: var(--as-claro); stroke-width: 1; }
.pqn-c-no { fill: none; stroke: var(--as-apagado); stroke-width: 1.3; }
.pqn-c-sin { fill: #6b7388; }
.pqn-s-necesita { stroke: var(--as-apagado); stroke-width: 1; stroke-dasharray: 3 3; }
.pqn-s-linea { fill: none; stroke: var(--as-claro); stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.pqn-s-punto { fill: var(--as-claro); transform-box: fill-box; transform-origin: center; transition: transform 0.18s, fill 0.18s; }
.pqn-s-punto.elegida { transform: scale(1.45); fill: var(--as-tinta); }
.pqn-s-menos { fill: var(--as-lejos); }
.pqn-eje { position: relative; display: grid; grid-template-columns: repeat(${SEMANAS}, 1fr); width: calc(100% * ${TRAZO} / ${ANCHO}); height: 36px; margin-top: 6px; }
.pqn-eje span { text-align: center; font: 400 13px/1.1 var(--numeros); color: var(--as-apagado); font-variant-numeric: tabular-nums; transition: color 0.18s; }
.pqn-eje span.elegida { color: var(--as-tinta); font-weight: 500; }
.pqn-eje small { position: absolute; top: 19px; left: calc(var(--c) * 100% / ${SEMANAS}); width: calc(100% / ${SEMANAS}); text-align: center; font: 400 13px/1 var(--texto); color: var(--as-apagado); white-space: nowrap; }
.pqn-nota { margin: 8px 0 0; font: 400 13px/1.4 var(--texto); color: var(--as-apagado); text-wrap: pretty; }

/* La semana elegida, día por día. */
.pqn-detalle { position: relative; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--as-linea); }
.pqn-dias.entra { animation: pqn-aparece 0.22s ease both; }
.pqn-dias.sale { position: absolute; left: 0; right: 0; top: 16px; pointer-events: none; animation: pqn-sale 0.16s ease both; }
.pqn-dias-titulo { margin: 0; font: 400 15px/1.3 var(--texto); color: var(--as-tinta); }
.pqn-rejilla { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.pqn-r-dias { margin-top: 12px; }
.pqn-dia { text-align: center; font: 400 13px/1.2 var(--texto); color: var(--as-sub); }
.pqn-dia small { display: block; margin-top: 2px; font: 400 13px/1 var(--numeros); color: var(--as-apagado); }
.pqn-dia.hoy { color: var(--as-tinta); }
.pqn-fila-etq { margin: 14px 0 7px; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.17em; text-transform: uppercase; color: var(--as-apagado); }
.pqn-dias-nota { margin: 16px 0 0; font: 400 13px/1.4 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.pqn-celda { display: grid; justify-items: center; align-content: start; gap: 3px; min-height: 18px; text-align: center; }
.pqn-celda b { font: 400 13px/1.1 var(--numeros); color: var(--as-tinta); white-space: nowrap; }
.pqn-celda small { font: 400 13px/1.1 var(--numeros); color: var(--as-sub); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pqn-celda i { width: 3px; height: 3px; margin-top: 6px; border-radius: 50%; background: var(--as-tenue); }
.pqn-celda svg { width: 20px; height: 20px; overflow: visible; }
.pqn-r-sesion .pqn-celda { min-height: 30px; }
.pqn-noches { display: block; width: 100%; height: auto; overflow: visible; }
.pqn-r-horas { margin-top: 4px; }
.pqn-n-bien { fill: var(--as-claro); }
.pqn-n-corta { fill: var(--as-claro); fill-opacity: 0.45; }
.pqn-n-menosDe6 { fill: var(--as-lejos); }
.pqn-n-antes { fill: none; stroke: var(--as-sub); stroke-width: 1; }
.pqn-leyenda { margin-top: 16px; display: grid; gap: 7px; }
.pqn-carriles + .pqn-leyenda { margin-top: 10px; }
.pqn-leyenda div { display: flex; flex-wrap: wrap; gap: 6px 14px; font: 400 13px/1.25 var(--texto); color: var(--as-sub); }
.pqn-leyenda span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.pqn-leyenda svg { flex: none; width: 16px; height: 16px; overflow: visible; }

.pqn-basa { margin-top: 22px; }
.pqn-basa-boton { appearance: none; cursor: pointer; display: flex; align-items: center; min-height: 44px; padding: 0; border: 0; background: none; color: var(--as-sub); font: 400 13.5px/1.2 var(--texto); }
.pqn-basa-boton span { display: inline-flex; align-items: center; gap: 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(170, 178, 196, 0.42); }
.pqn-basa-boton .pqn-i svg { width: 14px; height: 14px; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqn-basa-boton[aria-expanded="true"] .pqn-i svg { rotate: 180deg; }
.pqn-basa p { margin: 0 0 10px; font: 400 13px/1.45 var(--texto); color: var(--as-sub); text-wrap: pretty; }

/* Semana por semana: los carriles girados, lo nuevo arriba. */
.pqn-semanas { margin-top: 24px; }
.pqn-sem-cab, .pqn-sem-fila { display: grid; grid-template-columns: 46px minmax(0, 1fr) 84px 84px 14px; column-gap: 8px; align-items: center; }
.pqn-semanas.sin-comida .pqn-sem-cab, .pqn-semanas.sin-comida .pqn-sem-fila { grid-template-columns: 46px minmax(0, 1fr) 84px 14px; }
.pqn-sem-cab { align-items: end; padding-bottom: 7px; border-bottom: 1px solid var(--as-linea); }
.pqn-sem-cab > span { display: grid; gap: 6px; }
.pqn-sem-letras { display: grid; grid-template-columns: repeat(7, 12px); }
.pqn-sem-letras i { text-align: center; font: 400 13px/1 var(--texto); font-style: normal; color: var(--as-apagado); }
.pqn-sem-fila { appearance: none; cursor: pointer; width: 100%; min-height: 48px; padding: 0; border: 0; border-bottom: 1px solid rgba(48, 55, 72, 0.6); background: none; color: inherit; font: inherit; text-align: left; transition: background-color 0.15s; }
.pqn-sem-fila:active { background: rgba(232, 236, 246, 0.05); }
.pqn-sem-fecha { font: 400 13px/1.2 var(--texto); color: var(--as-sub); white-space: nowrap; }
.pqn-sem-fuerza { display: flex; align-items: baseline; gap: 7px; font: 400 14px/1 var(--numeros); color: var(--as-tinta); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pqn-sem-fuerza i { width: 11px; text-align: center; font-style: normal; color: var(--as-apagado); }
.pqn-sem-fuerza i.sube { color: var(--as-tinta); }
.pqn-sem-fuerza.sin { color: var(--as-apagado); }
.pqn-sem-fila svg { display: block; width: 84px; height: 22px; overflow: visible; }
.pqn-sem-fila .pqn-i { color: var(--as-apagado); }
.pqn-sem-fila .pqn-i svg { width: 14px; height: 14px; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqn-sem-fila[aria-expanded="true"] .pqn-i svg { rotate: 180deg; }
.pqn-sem-fila[aria-expanded="true"] .pqn-sem-fecha { color: var(--as-tinta); }
.pqn-sem-antes { grid-column: 3 / span 2; text-align: center; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); }
.pqn-semanas.sin-comida .pqn-sem-antes { grid-column: 3 / span 1; }
.pqn-sem .pqn-dias { padding: 14px 0 18px; border-bottom: 1px solid rgba(48, 55, 72, 0.6); }
.pqn-sem-desde { display: flex; align-items: center; gap: 9px; height: 30px; font: 400 13px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.pqn-sem-desde::before, .pqn-sem-desde::after { content: ''; flex: 1; border-top: 1px dashed rgba(232, 236, 246, 0.6); }
.pqn-sem-desde::before { flex: 0 0 46px; }
/* Una marca distinta de la flecha de «subió»: el chevrón señala las semanas de arriba. */
.pqn-sem-desde span { display: inline-flex; align-items: center; gap: 4px; }
.pqn-sem-desde .pqn-i svg { width: 13px; height: 13px; stroke-width: 2; }
.pqn-sem-fila, .pqn-sem-desde { animation: pqn-aparece 0.4s ease both; animation-delay: calc(0.1s + var(--n, 0) * 0.03s); }

/* La hoja para elegir el ejercicio, como el selector de Ascent: el buscador en píldora y renglones con línea. */
.tel .hb.pqn-hoja { height: 80%; border-radius: 0; border-top: 0; clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px); background: linear-gradient(180deg, #0d1018 0%, #07080d 100%); color: var(--as-tinta); transition: height 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), padding-bottom 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
/* Con el teclado arriba, la hoja crece: la lista sigue a la vista. */
.tel .hb.pqn-hoja.dt-con-teclado { height: calc(100% - var(--arriba) + 6px); }
.pqn-hoja-cab { flex: none; display: flex; align-items: center; justify-content: space-between; padding: 4px 10px 0 22px; }
.pqn-hoja-cab h2 { margin: 0; font: 500 19px/1.2 var(--texto); color: var(--as-tinta); }
.pqn-hoja-cerrar { appearance: none; cursor: pointer; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: none; color: var(--as-sub); }
.pqn-hoja-cerrar .pqn-i svg { width: 18px; height: 18px; }
.pqn-buscar { flex: none; display: flex; align-items: center; gap: 8px; min-height: 44px; margin: 6px 22px 4px; padding: 0 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; color: var(--as-sub); transition: border-color 0.2s; }
.pqn-buscar:focus-within { border-color: var(--as-sub); }
.pqn-buscar .pqn-i svg { width: 18px; height: 18px; }
.pqn-buscar input { flex: 1; min-width: 0; height: 42px; padding: 0; border: 0; outline: 0; background: none; color: var(--as-tinta); font: 400 16px/1.2 var(--texto); }
.pqn-buscar input::placeholder { color: var(--as-apagado); }
/* El foco lo muestra el borde de la píldora. */
.pqn-hoja .pqn-buscar input:focus-visible { outline: 0; }
.pqn-lista { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 0 22px 26px; -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 30px), transparent); mask-image: linear-gradient(180deg, #000 calc(100% - 30px), transparent); }
.pqn-lista::-webkit-scrollbar { display: none; }
.pqn-lista > * { animation: pqn-aparece 0.2s ease both; }
.pqn-lista .pqn-etq { margin: 18px 0 4px; }
.pqn-opcion { appearance: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; min-height: 50px; padding: 6px 0; border: 0; border-bottom: 1px solid var(--as-linea); background: none; color: var(--as-sub); font: 400 16px/1.25 var(--texto); text-align: left; transition: color 0.15s; }
.pqn-opcion:active { color: var(--as-tinta); }
.pqn-opcion > span:first-child { min-width: 0; }
.pqn-opcion small { display: block; margin-top: 2px; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); }
.pqn-opcion > span:last-child { flex: none; font: 400 14.5px/1 var(--numeros); color: var(--as-tinta); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pqn-opcion.elegida { color: var(--as-tinta); font-weight: 500; }
.pqn-lista p { margin: 14px 0 0; font: 400 13px/1.4 var(--texto); color: var(--as-apagado); text-wrap: pretty; }

@keyframes pqn-aparece { from { opacity: 0; } }
@keyframes pqn-sale { to { opacity: 0; } }
@keyframes pqn-lee { from { opacity: 0.35; } }
@keyframes pqn-dibuja { from { clip-path: inset(-12px 100% -12px 0); } to { clip-path: inset(-12px -48px -12px 0); } }
@keyframes pqn-llega { from { left: 0; } }
@keyframes pqn-traza { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .pqn *, .pqn *::before, .pqn *::after, .pqn-hoja * { animation: none !important; transition: none !important; }
}`;

Galeria.propuesta({
  id: 'porQueNoMejoro',
  titulo: '¿Por qué no estás mejorando?',
  texto: 'Elegís un ejercicio que no sube y ves sus últimas 12 semanas junto a tus series, tu comida y tu sueño, para encontrar qué cambió. La lista semana por semana muestra lo mismo de otra forma: elegí cuál se lee mejor.',
  vistas: [['carriles', 'El historial con comida y sueño'], ['antesYAhora', 'Qué cambió desde que no subes'], ['semanas', 'Semana por semana, en lista'], ['mejorando', 'Un ejercicio que sí mejora']],
  mas: [['bajo', 'Un ejercicio que bajó'], ['pocosDatos', 'Con pocos datos'], ['elegir', 'Elegir el ejercicio'], ['en', 'En inglés']],
  principal: 0,
  crear(g) {
    g.estilo('pqn-css', CSS);
    const p = g.pantalla('pqn as-vars', { conBarra: true });
    const u = Util.crear(g.opciones);
    const { el, numero } = u;
    const piezas = () => g.secciones.ascent.piezas;

    // ------------------------------------------------------------ los textos y los números
    // Al cortar el renglón, el número no se separa de su unidad.
    const pegado = (s) => s.replace(/(\d) (%|kg\b|h\b|g\b|min\b)/g, '$1\u00a0$2');
    const tr = (clave, vars) => {
      const s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS[g.idioma]);
      if (typeof s !== 'string') return s == null ? clave : s;
      return pegado(vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k])) : s);
    };
    const plural = (clave, n) => { const f = tr(clave); return pegado((n === 1 ? f.uno : f.otros).replace('{n}', numero(n))); };
    const icono = (n) => `<span class="pqn-i">${Util.icono(n)}</span>`;
    const promedio = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const uno = (n) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
    const pct = (n) => (g.idioma === 'es' ? `${numero(n)}\u00a0%` : `${numero(n)}%`);
    const marcaDe = (x) => u.tx('ascent.estancamiento.marca', { kg: u.peso(x.peso), reps: x.reps });
    const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    /** Una noche en poco lugar: «7 h 05». */
    const horas = (min) => { const m = Math.round(min); return m % 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m / 60} h`; };
    const diaMes = (fecha) => { const x = u.partes(fecha); return tr('diaMes', { num: x.num, mes: u.tx('fecha.meses.' + x.mes) }); };
    function tituloDeSemana(lunes) {
      const a = u.partes(lunes), b = u.partes(Fechas.sumarDias(lunes, 6));
      const mes = (x) => u.tx('fecha.meses.' + x.mes);
      return a.mes === b.mes ? tr('semanaUnMes', { a: a.num, b: b.num, mes: mes(a) }) : tr('semanaDosMeses', { a: a.num, mesA: mes(a), b: b.num, mesB: mes(b) });
    }

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const pesoKg = Datos.PESADAS[Datos.PESADAS.length - 1].kg;
    // Como en la sección de Ascent: entrena hace 6 meses o más (su ruido de un día a otro es el de los entrenados).
    const entrenado = Fechas.diasEntre([...A.sesiones.map((s) => s.fecha), ...A.marcas.map((m) => m.fecha)].sort()[0], HOY) >= 7 * 26;
    // Sin déficit (o con un cuidado que no deja bajar) y con los números ocultos, nada de calorías ni de gramos.
    const sinComida = () => !!g.secciones.perfil.sinDeficit || g.tel.classList.contains('sin-numeros');
    const anios = ANIOS[Datos.PERFIL.experiencia] != null ? ANIOS[Datos.PERFIL.experiencia] : null;

    /**
     * Sus sesiones de Ascent hasta ayer, las del día «cargado» de AscentDeMentira (05-ascent-datos.js, HISTORIA y
     * piernasDeAyer), el que muestran por defecto las propuestas de la sección: así esta pantalla dice lo mismo que
     * ellas. Son las de Datos.ASCENT con tres cambios (el press militar bajó en sus últimos cuatro lunes; en el press
     * de banca, los dos últimos lunes la última serie quedó en 4; en la última sesión entera de piernas, la última serie
     * de prensa y la de extensión no llegaron a sus repeticiones) y, ayer, piernas fuera de la rutina.
     */
    let historia = null;
    function historiaDeAscent() {
      if (historia) return historia;
      const antes = A.sesiones.filter((s) => s.fecha < HOY);
      const lunes = antes.filter((s) => Fechas.diaDeLaSemana(s.fecha) === 1).slice(-4).map((s) => s.fecha);
      const r = A.rutina.find((x) => x.dia === 3);
      const piernas = [...antes].reverse().find((s) => Fechas.diaDeLaSemana(s.fecha) === r.dia && r.ejercicios.every((e) => s.bloques.some((x) => x.id === e.id)));
      const conLaUltima = (x, reps) => Object.assign({}, x, { series: x.series.map((y, i) => (i === x.series.length - 1 ? Object.assign({}, y, { reps }) : y)) });
      historia = antes.map((s) => Object.assign({}, s, {
        bloques: s.bloques.map((x) => {
          if (x.id === 'press_militar' && lunes.includes(s.fecha)) return Object.assign({}, x, { series: x.series.map(() => ({ peso: 37.5, reps: 10 })) });
          if (x.id === 'press_banca' && lunes.slice(-2).includes(s.fecha)) return conLaUltima(x, 4);
          if (s === piernas && x.id === 'prensa') return conLaUltima(x, 8);
          if (s === piernas && x.id === 'extension_cuadriceps') return conLaUltima(x, 10);
          return x;
        }),
      }));
      const series = (n, peso, reps, rir) => Array.from({ length: n }, () => (rir == null ? { peso, reps } : { peso, reps, rir }));
      const prensa = [...historia].reverse().flatMap((s) => s.bloques).find((x) => x.id === 'prensa').series[0].peso;
      historia.push({
        fecha: Fechas.sumarDias(HOY, -1), hora: 19 * 60, minutos: 52,
        bloques: [
          { id: 'sentadilla_bulgara', ejercicio: 'Sentadilla búlgara', series: series(4, 30, 10) },
          { id: 'prensa', ejercicio: 'Prensa', series: series(4, prensa, 10) },
          { id: 'zancadas', ejercicio: 'Zancadas', series: series(4, 20, 10, 0) },
        ],
      });
      return historia;
    }

    /**
     * Las 12 semanas de Moss, día por día: lo comido contra la meta y la noche con la que amaneció cada día, desde que
     * empezó a usarla. La comida es la de la galería y, antes de su primer día, se turnan sus tres primeros días: anotaba
     * todos (Datos.ASCENT.anio.diasConComida). Las noches son las de Salud, sin la que parece cortada (Moss pregunta
     * antes de contarla), y antes de la primera, unas parecidas: las de semana alrededor de 7 h 26, las del fin de
     * semana un poco más.
     */
    function semanasDeMoss(kcalMeta) {
      const comida = g.secciones.comida;
      const totalEl = (fecha) => comida.totalDe(Fechas.diasEntre(HOY, fecha));
      const conComida = comida.kcalPorDia().map((x) => x.fecha);
      const primerDia = conComida[0];
      const turnos = [0, 1, 2].map((k) => totalEl(Fechas.sumarDias(primerDia, k)));
      const deSalud = new Map(Datos.NOCHES.filter((n) => !Sueno.pareceIncompleta(n, Datos.NOCHES)).map((n) => [n.clave, n.dormido]));
      const primeraNoche = Datos.NOCHES[0].clave;
      const azar = Datos.azar(53);
      return LUNES.map((lunes) => {
        const dias = Array.from({ length: 7 }, (_, d) => {
          const fecha = Fechas.sumarDias(lunes, d);
          // El azar se pide siempre: así cambiar un día no corre los demás.
          const r = azar();
          const conMoss = fecha >= Datos.INICIO;
          const t = !conMoss || fecha >= HOY ? null
            : fecha >= primerDia ? (conComida.includes(fecha) ? totalEl(fecha) : null) : turnos[Fechas.diasEntre(Datos.INICIO, fecha) % 3];
          const kcal = t ? t.kcal : null;
          const noche = !conMoss || fecha > HOY ? null
            : fecha >= primeraNoche ? (deSalud.has(fecha) ? deSalud.get(fecha) : null) : Math.round(446 + (d >= 5 ? 15 : 0) + (r - 0.5) * 36);
          return {
            fecha, kcal, noche, conMoss,
            proteina: t ? t.p : null,
            // Lo que todavía no pasó, o es de antes de Moss, no es «sin anotar».
            comida: !conMoss || fecha >= HOY ? null : kcal === null ? 'sinAnotar' : Metas.estadoDeMacro(kcal, kcalMeta) === 'pasado' ? 'pasaste' : kcal >= Energia.LLEGASTE * kcalMeta ? 'llegaste' : 'noLlegaste',
            pct: kcal === null ? null : Math.round((kcal / kcalMeta) * 100),
            sueno: noche === null ? null : noche < Rendimiento.NOCHE_CORTA ? 'menosDe6' : necesidad - noche >= ProgresoCompartido.SUENO_MENOS ? 'corta' : 'bien',
          };
        });
        const anotados = dias.filter((d) => d.kcal !== null);
        const noches = dias.filter((d) => d.noche !== null).map((d) => d.noche);
        return {
          lunes, dias, noches,
          antesDeMoss: !dias.some((d) => d.conMoss),
          pasados: dias.filter((d) => d.conMoss && d.fecha < HOY).length,
          anotados: anotados.length,
          llegaste: anotados.filter((d) => d.comida !== 'noLlegaste').length,
          proteina: anotados.length ? promedio(anotados.map((d) => d.proteina)) : 0,
          promedio: noches.length ? promedio(noches) : null,
          menosDe6: dias.filter((d) => d.sueno === 'menosDe6').length,
        };
      });
    }

    /**
     * La última marca de un ejercicio, como la tabla de Ascent: las de antes de las sesiones con detalle y, desde ahí,
     * cada vez que la mejor serie le gana a todas las anteriores (con su 1RM, Musculos.unRmDeAscent).
     */
    function ultimaMarca(sesiones, e) {
      const clave = Musculos.claveDelEjercicio(e);
      let mejor = null;
      const mirar = (fecha, peso, reps) => {
        if (!(peso > 0) || !reps) return;
        const v = Musculos.unRmDeAscent({ kilos: peso, reps });
        if (!mejor || v > mejor.v + 1e-9) mejor = { v, fecha, peso, reps };
      };
      A.marcas.filter((m) => m.id === e.id && m.fecha < A.desde).forEach((m) => mirar(m.fecha, m.peso, m.reps));
      sesiones.forEach((s) => s.bloques.forEach((b) => { if (Musculos.claveDelEjercicio(b) === clave && !b.copiada) b.series.forEach((x) => mirar(s.fecha, x.peso, x.reps)); }));
      return mejor;
    }

    let mundo = null;
    /** Lo que no depende del ejercicio: las sesiones, el diario y los casos ya calculados. Una vez por pintada. */
    function armarMundo() {
      const kcalMeta = g.persona().control.metas.kcal;
      mundo = { sesiones: historiaDeAscent(), semanas: semanasDeMoss(kcalMeta), casos: new Map() };
    }
    const deMoss = (lunes) => mundo.semanas[LUNES.indexOf(lunes)] || null;
    const despuesDe = (c, i) => c.desdeCol !== null && i >= c.desdeCol;
    const musculoDe = (c) => (c.musculo ? piezas().nombreDelMusculo(c.musculo).toLowerCase() : '');

    /** Un ejercicio con todo lo suyo: sus sesiones, la tendencia, el veredicto y, si no sube o bajó, las razones. */
    function casoDe(e) {
      if (mundo.casos.has(e.id)) return mundo.casos.get(e.id);
      const { sesiones } = mundo;
      const clave = Musculos.claveDelEjercicio(e);
      // Cada sesión con el ejercicio: su mejor serie, la de más 1RM estimado (sin lo copiado, como la tendencia).
      const hechas = sesiones.flatMap((s) => {
        let mejor = null;
        s.bloques.filter((b) => Musculos.claveDelEjercicio(b) === clave && !b.copiada).forEach((b) => b.series.forEach((x) => {
          const v = PuntajeMuscular.e1rm(x.peso, x.reps);
          if (v !== null && (!mejor || v > mejor.e1rm)) mejor = { fecha: s.fecha, e1rm: v, peso: x.peso, reps: x.reps };
        }));
        return mejor ? [mejor] : [];
      });
      const t = ProgresoCompartido.tendenciaDeFuerza(Estancados.puntosDelEjercicio(sesiones, e, HOY), { hoy: 0, entrenado });
      const principales = (Musculos.musculosDe(e) || { principal: [] }).principal;
      const musculo = principales[0] || null;
      const marca = ultimaMarca(sesiones, e);
      const sinMarca = marca ? Math.floor(Fechas.diasEntre(marca.fecha, HOY) / 7) : 0;
      // Si bajó, es lo que se dice, como en la sección: no va además como estancado.
      const bajada = musculo ? TuSesion.bajadaDeFuerza(hechas) : null;
      const estado = bajada ? 'bajo'
        : t.sesiones < ProgresoCompartido.SESIONES_MINIMAS || t.semanas < ProgresoCompartido.SEMANAS_MINIMAS_DE_HISTORIA ? 'faltan'
          : t.estado === 'sube' ? 'sube'
            : marca && musculo && ProgresoCompartido.estaEstancado(t, sinMarca, A.umbral) ? 'noSube' : 'noSeSabe';
      const enVentana = hechas.filter((h) => h.fecha >= LUNES[0]);
      const c = { e, t, musculo, marca, sinMarca, bajada, estado, hechas, enVentana, nombre: piezas().nombreDelEjercicio(e), desdeCol: null, filas: null, razones: [], principal: null, anios: null };
      c.semanas = mundo.semanas.map((m, i) => {
        const fin = Fechas.sumarDias(m.lunes, 7);
        return Object.assign({}, m, {
          i, parcial: fin > HOY,
          series: musculo ? Estancados.semanaDeEntreno(sesiones, m.lunes, e, musculo).series : 0,
          sesiones: enVentana.filter((h) => h.fecha >= m.lunes && h.fecha < fin),
        });
      });
      mundo.casos.set(e.id, c);
      if (estado !== 'noSube' && estado !== 'bajo') return c;

      // Por qué puede ser, con la cuenta de la app: si bajó, las semanas de las 8 sesiones de antes contra las de ahora;
      // si no sube, las de cuando subía (las 6 hasta la marca) contra las de después.
      const s = bajada ? TuSesion.semanasDeLaBajada(bajada, HOY) : Estancados.semanasParaLasRazones(marca.fecha, HOY);
      // La raya: si bajó, donde empezó a bajar; si no sube, al final de la semana de la marca. 0, si es de antes de las 12 semanas.
      c.desdeCol = bajada ? Math.max(0, LUNES.indexOf(Fechas.lunesDe(bajada.desde))) : LUNES.indexOf(Fechas.lunesDe(marca.fecha)) + 1;
      const conSesion = (l) => sesiones.some((x) => x.fecha >= l && x.fecha < Fechas.sumarDias(l, 7));
      const deEntreno = (lunes) => (musculo ? lunes.filter(conSesion).map((l) => Estancados.semanaDeEntreno(sesiones, l, e, musculo)) : []);
      const antes = deEntreno(s.antes), ahora = deEntreno(s.ahora);
      const mossAntes = s.antes.map(deMoss).filter(Boolean), mossAhora = s.ahora.map(deMoss).filter(Boolean);
      const noches = (ms) => { const xs = ms.flatMap((m) => m.noches); return xs.length >= 3 ? promedio(xs) : null; };
      const persona = g.persona();
      const r = ProgresoCompartido.razonesDeEstancamiento({
        antes, ahora, objetivo: persona.perfil.objetivo, sinDeficit: !!g.secciones.perfil.sinDeficit,
        bajaSemanal: persona.cambio7 == null ? null : (-persona.cambio7 / pesoKg) * 100,
        comida: sinComida() ? [] : mossAhora.map((m) => ({ dias: m.anotados, proteina: m.proteina })),
        pesoKg, sueno: { antes: noches(mossAntes), ahora: noches(mossAhora) }, anios: bajada ? null : anios,
      });
      c.anios = r.anios;
      // De cuando subía (o de antes de bajar), nada de Moss: todavía no la usaba.
      c.sinMoss = !mossAntes.some((m) => !m.antesDeMoss);
      const conComida = (ms) => ms.filter((m) => m.anotados >= ProgresoCompartido.DIAS_DE_COMIDA);
      const llegA = conComida(mossAntes).map((m) => m.llegaste), llegB = conComida(mossAhora).map((m) => m.llegaste);
      const llegaste = sinComida() ? null : ProgresoCompartido.bajoDeVerdad(llegA, llegB, MENOS_DIAS);
      const prom = (xs) => (xs.length ? promedio(xs) : null);
      const gPorKg = (ms) => { const xs = conComida(ms).map((m) => m.proteina); return xs.length ? promedio(xs) / pesoKg : null; };
      const marcada = (que) => r.razones.some((x) => x.que === que);
      c.filas = [
        { que: 'series', antes: prom(antes.map((x) => x.series)), ahora: prom(ahora.map((x) => x.series)), marcada: marcada('series'), ver: uno },
        { que: 'veces', antes: prom(antes.map((x) => x.veces)), ahora: prom(ahora.map((x) => x.veces)), marcada: marcada('frecuencia'), ver: uno },
        ...(sinComida() ? [] : [
          { que: 'llegaste', antes: prom(llegA), ahora: prom(llegB), marcada: !!llegaste && llegaste.bajo, ver: uno },
          { que: 'proteina', antes: gPorKg(mossAntes), ahora: gPorKg(mossAhora), marcada: marcada('proteina'), ver: (n) => numero(n, 1) },
        ]),
        { que: 'sueno', antes: noches(mossAntes), ahora: noches(mossAhora), marcada: marcada('sueno'), ver: horas },
      ];
      // Las razones de la app y, si bajaron, los días que llegaste, antes de la proteína y del sueño.
      c.razones = [...r.razones];
      if (llegaste && llegaste.bajo) {
        const donde = c.razones.findIndex((x) => x.que === 'proteina' || x.que === 'sueno');
        c.razones.splice(donde < 0 ? c.razones.length : donde, 0, { que: 'llegaste', antes: llegaste.antes, ahora: llegaste.ahora });
      }
      // La definición es contexto: lo que cambió, si hay, va primero.
      c.principal = c.razones.find((x) => x.que !== 'definicion') || c.razones[0] || null;
      c.sesionesAntes = hechas.filter((h) => h.fecha >= s.antes[0] && h.fecha < s.ahora[0]).length;
      c.sesionesAhora = hechas.filter((h) => h.fecha >= s.ahora[0]).length;
      return c;
    }

    /** Los ejercicios con 1RM estimado en estas 12 semanas, en el orden en que aparecen. */
    function ejerciciosConFuerza() {
      const vistos = new Map();
      mundo.sesiones.filter((s) => s.fecha >= LUNES[0]).forEach((s) => s.bloques.forEach((b) => {
        if (!vistos.has(b.id) && Musculos.CATALOGO[b.id] && Musculos.mejorDeLasSeries(b.series) !== null) vistos.set(b.id, { id: b.id, ejercicio: b.ejercicio });
      }));
      return [...vistos.values()];
    }
    /** Desde cuándo no sube: la marca o, si bajó, la primera de las sesiones de ahora. */
    const desdeDe = (c) => (c.estado === 'bajo' ? c.bajada.desde : c.marca.fecha);
    /** Los que no suben o bajaron, con la misma regla que el veredicto: del que lleva más tiempo al que menos. */
    const losQueNoSuben = () => ejerciciosConFuerza().map(casoDe).filter((c) => c.estado === 'noSube' || c.estado === 'bajo').sort((a, b) => (desdeDe(a) < desdeDe(b) ? -1 : desdeDe(a) > desdeDe(b) ? 1 : 0));
    function ejercicioDe(id) {
      const lista = ejerciciosConFuerza();
      return lista.find((e) => e.id === id) || (losQueNoSuben()[0] || {}).e || lista[0];
    }

    // ------------------------------------------------------------ el veredicto y lo que cambió
    function fraseDe(c) {
      if (c.estado === 'bajo') return tr('veredicto.bajo', { n: numero(Math.round(c.bajada.caida)), fecha: diaMes(c.bajada.desde) });
      if (c.estado === 'noSube') return tr('veredicto.noSube', { fecha: diaMes(c.marca.fecha) });
      // Con el número de la sección («Sube, ~2,7 % por mes»): lo que sube por mes en la tendencia.
      if (c.estado === 'sube') return tr('veredicto.sube', { n: uno(c.t.porMes) });
      if (c.estado === 'faltan') {
        const faltan = ProgresoCompartido.SESIONES_MINIMAS - c.t.sesiones;
        return faltan > 0 ? plural('veredicto.faltanSesiones', faltan) : tr('veredicto.faltanSemanas');
      }
      return tr('veredicto.noSeSabe');
    }
    function bajoDe(c) {
      const sesiones = u.plural('ascent.fuerza.sesiones', c.t.sesiones);
      const rango = c.t.rango ? { a: u.conSigno(Math.round(c.t.rango[0] * 10) / 10, 1), b: u.conSigno(Math.round(c.t.rango[1] * 10) / 10, 1), sesiones } : null;
      if (c.estado === 'sube') {
        const a = c.enVentana[0], b = c.enVentana[c.enVentana.length - 1];
        return a.reps === b.reps && b.peso > a.peso ? tr('bajo.sube', { a: marcaDe(a), b: marcaDe(b), sesiones }) : tr('bajo.subeSinKilos', rango);
      }
      if (c.estado === 'faltan') {
        return c.t.sesiones < ProgresoCompartido.SESIONES_MINIMAS ? tr('bajo.faltanSesiones', { n: c.t.sesiones }) : tr('bajo.faltanSemanas', { n: Math.round(c.t.semanas) });
      }
      if (c.estado === 'noSeSabe') {
        return c.t.estado === 'sinSubidaClara' && c.marca ? tr('bajo.pronto', { n: Math.round(c.t.semanas), fecha: diaMes(c.marca.fecha) }) : tr('bajo.noSeSabe', rango);
      }
      const x = c.principal;
      if (!x) return tr('bajo.sinCambio');
      if (x.que === 'definicion') return tr('bajo.definicion');
      const cual = x.que === 'sueno' && x.antes === null ? 'suenoPoco' : x.que === 'pesadas' && !x.pesadas ? 'ningunaPesada' : x.que;
      const que = tr('bajo.que.' + cual, { musculo: musculoDe(c), n: x.pesadas, de: x.de });
      const cambio = x.que === 'series' || x.que === 'frecuencia' || x.que === 'llegaste' || (x.que === 'sueno' && x.antes !== null);
      return tr(cambio ? 'bajo.cambio' : 'bajo.seVe', { que });
    }
    /** Qué cambiar: una sugerencia por razón, como «Qué cambiar» de la sección; sin razones, cambiar el estímulo. */
    function sugerenciasDe(c) {
      if (!c.razones.length) return [tr('hacer.nada')];
      const como = tr('como.' + (c.estado === 'bajo' ? 'bajo' : 'noSube'));
      return c.razones.map((x) => tr('hacer.' + x.que, {
        musculo: musculoDe(c), como,
        n: x.que === 'frecuencia' ? uno(Math.round(x.antes * 2) / 2) : x.antes != null ? numero(Math.round(x.antes)) : '',
        g: numero(Math.round((ProgresoCompartido.PROTEINA_POR_KG * pesoKg) / 5) * 5),
        horas: u.duracion(necesidad),
      }));
    }

    // ------------------------------------------------------------ las marcas de la comida y de las noches
    function marcaDeComida(estado, cx, cy, r) {
      const en = `cx="${cx}" cy="${cy}"`;
      if (estado === 'llegaste') return `<circle class="pqn-c-si" ${en} r="${r}"/>`;
      if (estado === 'pasaste') return `<circle class="pqn-c-si" ${en} r="${r}"/><circle class="pqn-c-aro" ${en} r="${(r * 1.62).toFixed(1)}"/>`;
      if (estado === 'noLlegaste') return `<circle class="pqn-c-no" ${en} r="${(r - 0.6).toFixed(1)}"/>`;
      return `<circle class="pqn-c-sin" ${en} r="${Math.max(1, r * 0.34).toFixed(1)}"/>`;
    }
    /** Las noches de una semana en barras, contra lo que necesitas (la línea de rayas, si va); con aro, la de antes de cada sesión. */
    function svgDeNoches(sem, ancho, alto, barra, entero) {
      const paso = ancho / 7, base = alto - 1, tope = entero ? 7 : 2, piso = 4 * 60;
      const y = (min) => base - Math.min(1.15, Math.max(0.1, (min - piso) / (necesidad - piso))) * (base - tope);
      let s = entero ? `<line class="pqn-s-necesita" x1="0" x2="${ancho}" y1="${tope}" y2="${tope}"/>` : '';
      sem.dias.forEach((d, k) => {
        if (d.noche === null) return;
        const x = (k + 0.5) * paso - barra / 2, arriba = y(d.noche);
        if (entero && sem.sesiones.some((h) => h.fecha === d.fecha)) s += `<rect class="pqn-n-antes" x="${(x - 5).toFixed(1)}" y="${(Math.min(arriba, tope) - 5).toFixed(1)}" width="${barra + 10}" height="${(base - Math.min(arriba, tope) + 9).toFixed(1)}" rx="6"/>`;
        s += `<rect class="pqn-n-${d.sueno}" x="${x.toFixed(1)}" y="${arriba.toFixed(1)}" width="${barra}" height="${(base - arriba).toFixed(1)}" rx="${Math.min(2, barra / 3)}"/>`;
      });
      return `<svg class="${entero ? 'pqn-noches' : ''}" viewBox="0 0 ${ancho} ${alto}" aria-hidden="true">${s}</svg>`;
    }
    /** Una leyenda chica: en cada renglón, cada cosa con su dibujo ([dibujo, texto]). */
    function leyenda(renglones) {
      const l = el('div', 'pqn-leyenda');
      renglones.filter((r) => r.length).forEach((r) => {
        const fila = l.appendChild(el('div'));
        r.forEach(([dibujo, texto]) => {
          const s = fila.appendChild(el('span'));
          s.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true">${dibujo}</svg>`;
          s.appendChild(document.createTextNode(texto));
        });
      });
      return l;
    }
    /** La de las marcas de cada día: la comida y las noches. */
    const leyendaDeLosDias = () => leyenda([
      sinComida() ? [] : ['llegaste', 'pasaste', 'noLlegaste', 'sinAnotar'].map((e) => [marcaDeComida(e, 8, 8, 4), tr('leyenda.' + e)]),
      [
        ...[['bien', 13], ['corta', 10], ['menosDe6', 7]].map(([e, alto]) => [`<rect class="pqn-n-${e}" x="5" y="${15 - alto}" width="6" height="${alto}" rx="1.5"/>`, tr('leyenda.' + e)]),
        ['<rect class="pqn-n-antes" x="2.5" y="0.5" width="11" height="15" rx="4"/><rect class="pqn-n-bien" x="5.5" y="4" width="5" height="9" rx="1.5"/>', tr('leyenda.antesDeSesion')],
      ],
    ]);

    // ------------------------------------------------------------ una semana, día por día
    function diasDe(c, i) {
      const sem = c.semanas[i];
      const caja = el('div', 'pqn-dias');
      caja.appendChild(el('h3', 'pqn-dias-titulo', tituloDeSemana(sem.lunes) + (sem.parcial ? ` · ${tr('enCurso')}` : '')));
      const fila = (clase, etiqueta) => {
        if (etiqueta) caja.appendChild(el('div', 'pqn-fila-etq', etiqueta));
        return caja.appendChild(el('div', 'pqn-rejilla pqn-r-' + clase));
      };
      const cab = fila('dias');
      sem.dias.forEach((d) => {
        const x = u.partes(d.fecha);
        cab.appendChild(el('span', 'pqn-dia' + (d.fecha === HOY ? ' hoy' : ''), u.tx('fecha.diasCortos.' + x.dia))).appendChild(el('small', null, String(x.num)));
      });
      const sesion = fila('sesion', tr('dias.sesion'));
      sem.dias.forEach((d) => {
        const h = sem.sesiones.find((x) => x.fecha === d.fecha);
        const celda = sesion.appendChild(el('span', 'pqn-celda'));
        if (h) celda.append(el('b', null, `${u.peso(h.peso)} kg`), el('small', null, `× ${h.reps}`));
        else celda.appendChild(el('i'));
      });
      if (sem.antesDeMoss) {
        caja.appendChild(el('p', 'pqn-dias-nota', tr('dias.antesDeMoss')));
        return caja;
      }
      if (!sinComida()) {
        const comida = fila('comida', tr('dias.comida'));
        sem.dias.forEach((d) => {
          const celda = comida.appendChild(el('span', 'pqn-celda'));
          if (!d.comida) return;
          celda.innerHTML = `<svg viewBox="0 0 20 20" role="img" aria-label="${tr('leyenda.' + d.comida)}">${marcaDeComida(d.comida, 10, 10, 5)}</svg>`;
          celda.appendChild(el('small', null, d.pct === null ? '—' : pct(d.pct)));
        });
      }
      caja.appendChild(el('div', 'pqn-fila-etq', tr('dias.sueno')));
      caja.insertAdjacentHTML('beforeend', svgDeNoches(sem, ANCHO, 46, 10, true));
      const horasDe = fila('horas');
      sem.dias.forEach((d) => horasDe.appendChild(el('span', 'pqn-celda')).appendChild(el('small', null, d.noche === null ? (d.conMoss && d.fecha <= HOY ? '—' : '') : horas(d.noche))));
      return caja;
    }

    // ------------------------------------------------------------ los carriles
    const svg = (alto, dentro) => `<svg viewBox="0 0 ${ANCHO} ${alto}" aria-hidden="true">${dentro}</svg>`;
    const centro = (i) => i * COL + COL / 2;
    /** La fuerza: cada sesión en un punto, la franja del ruido de un día a otro alrededor de la tendencia y la marca con su aro. */
    function svgDeFuerza(c) {
      const alto = 76, arriba = 9, abajo = 8;
      const pts = c.enVentana;
      const semanaDe = (h) => Math.floor(Fechas.diasEntre(LUNES[0], h.fecha) / 7);
      // Cada sesión, en la columna de su semana: una sola va al medio, como lo de los otros carriles; dos o más se reparten.
      const x = (h) => { const suyas = c.semanas[semanaDe(h)].sesiones; return semanaDe(h) * COL + (COL * (suyas.indexOf(h) + 1)) / (suyas.length + 1); };
      const ajuste = c.estado === 'faltan' ? null : c.t.ajuste;
      const ruido = c.t.sigma / 100;
      // La franja, desde la primera sesión hasta hoy (el borde del dibujo).
      const muestras = ajuste && pts.length ? Array.from({ length: 13 }, (_, k) => {
        const fecha = Fechas.sumarDias(pts[0].fecha, Math.round((Fechas.diasEntre(pts[0].fecha, HOY) * k) / 12));
        return { x: x(pts[0]) + ((TRAZO - x(pts[0])) * k) / 12, nivel: ProgresoCompartido.nivelEn(ajuste, Fechas.diasEntre(HOY, fecha) / 7).nivel };
      }) : [];
      const valores = [...pts.map((h) => h.e1rm), ...muestras.flatMap((m) => [m.nivel * (1 - ruido), m.nivel * (1 + ruido)])];
      if (!valores.length) return svg(alto, '');
      const lo = Math.min(...valores), hi = Math.max(...valores);
      const aire = (hi - lo) * 0.06 || 1;
      const y = (v) => arriba + ((hi + aire - v) / (hi - lo + 2 * aire)) * (alto - arriba - abajo);
      const punto = (px, v) => `${px.toFixed(1)} ${y(v).toFixed(1)}`;
      let s = '';
      if (muestras.length) {
        s += `<path class="pqn-f-franja" d="M${muestras.map((m) => punto(m.x, m.nivel * (1 + ruido))).join(' L')} L${[...muestras].reverse().map((m) => punto(m.x, m.nivel * (1 - ruido))).join(' L')} Z"/>`;
        s += `<path class="pqn-f-tend" d="M${muestras.map((m) => punto(m.x, m.nivel)).join(' L')}"/>`;
        const fin = muestras[muestras.length - 1];
        s += `<text class="pqn-gut" x="${TRAZO + 7}" y="${(y(fin.nivel) + 3.6).toFixed(1)}">${u.peso(Math.round(fin.nivel))} kg</text>`;
      }
      pts.forEach((h) => {
        if (c.estado === 'noSube' && h.fecha === c.marca.fecha) s += `<circle class="pqn-f-aro" cx="${x(h).toFixed(1)}" cy="${y(h.e1rm).toFixed(1)}" r="6.6"/>`;
        s += `<circle class="pqn-f-punto" data-semana="${semanaDe(h)}" cx="${x(h).toFixed(1)}" cy="${y(h.e1rm).toFixed(1)}" r="3.2"/>`;
      });
      return svg(alto, s);
    }
    /**
     * Las series del músculo de cada semana; si es lo que cambió, las de después de la raya van en terracota. Con las de
     * cuando subía (o de antes de bajar), su promedio en una línea: esas semanas suelen quedar antes de estas 12.
     */
    function svgDeSeries(c) {
      const alto = 42;
      const antes = c.filas && c.filas[0].antes !== null ? c.filas[0].antes : null;
      const tope = Math.max(1, antes || 0, ...c.semanas.map((s) => s.series));
      const y = (n) => alto - Math.max(3, (n / tope) * (alto - 3));
      let s = '';
      c.semanas.forEach((sem) => {
        const x = sem.i * COL + 6;
        if (!sem.series) { s += `<line class="pqn-b-cero" x1="${x + 3}" x2="${x + 11}" y1="${alto - 1}" y2="${alto - 1}"/>`; return; }
        s += `<rect class="pqn-b${despuesDe(c, sem.i) ? ' ahora' : ''}${sem.parcial ? ' parcial' : ''}" data-semana="${sem.i}" x="${x}" y="${y(sem.series).toFixed(1)}" width="14" height="${(alto - y(sem.series)).toFixed(1)}" rx="2"/>`;
      });
      // A la derecha, la línea de antes con su número o, sin ella, el tope; arriba de todo, sin pisar el rótulo del carril.
      const referencia = antes !== null ? antes : tope;
      if (antes !== null) s += `<line class="pqn-b-antes" x1="0" x2="${TRAZO}" y1="${y(antes).toFixed(1)}" y2="${y(antes).toFixed(1)}"/>`;
      s += `<text class="pqn-gut" x="${TRAZO + 7}" y="${Math.max(y(referencia) + 4.5, 11).toFixed(1)}">${uno(referencia)}</text>`;
      return svg(alto, s);
    }
    /** La comida: los siete días de cada semana apilados, primero los que llegaste. */
    function svgDeComida(c) {
      const alto = 68;
      let s = '';
      c.semanas.forEach((sem) => {
        ['llegaste', 'pasaste', 'noLlegaste', 'sinAnotar'].flatMap((e) => sem.dias.filter((d) => d.comida === e).map(() => e))
          .forEach((e, k) => { s += marcaDeComida(e, centro(sem.i), alto - 5 - k * 9, 2.9); });
      });
      return svg(alto, s);
    }
    /** El sueño: el promedio de cada semana contra lo que necesitas y, abajo, un punto por cada noche de menos de 6 h. */
    function svgDeSueno(c) {
      const alto = 54, abajo = 16;
      const conNoches = c.semanas.filter((s) => s.noches.length >= 3);
      const hi = Math.max(necesidad, ...conNoches.map((s) => s.promedio)) + 16;
      const lo = Math.min(necesidad - 90, ...conNoches.map((s) => s.promedio - 12));
      const y = (v) => 4 + ((hi - v) / (hi - lo)) * (alto - 4 - abajo);
      let s = `<line class="pqn-s-necesita" x1="0" x2="${TRAZO}" y1="${y(necesidad).toFixed(1)}" y2="${y(necesidad).toFixed(1)}"/>`;
      s += `<text class="pqn-gut" x="${TRAZO + 7}" y="${(y(necesidad) + 3.6).toFixed(1)}">${u.duracion(necesidad)}</text>`;
      let linea = '', puntos = '', pluma = false;
      c.semanas.forEach((sem) => {
        for (let k = 0; k < sem.menosDe6; k++) puntos += `<circle class="pqn-s-menos" cx="${(centro(sem.i) + (k - (sem.menosDe6 - 1) / 2) * 6.5).toFixed(1)}" cy="${alto - 4}" r="2.2"/>`;
        if (sem.noches.length < 3) { pluma = false; return; }
        linea += `${pluma ? 'L' : 'M'}${centro(sem.i)} ${y(sem.promedio).toFixed(1)} `;
        pluma = true;
        puntos += `<circle class="pqn-s-punto" data-semana="${sem.i}" cx="${centro(sem.i)}" cy="${y(sem.promedio).toFixed(1)}" r="2.6"/>`;
      });
      return svg(alto, s + `<path class="pqn-s-linea" d="${linea}"/>` + puntos);
    }
    /** Lo que dice cada carril de una semana, a la derecha de su rótulo. */
    const lecturaDe = (sem) => ({
      fuerza: sem.sesiones.length ? marcaDe(sem.sesiones[sem.sesiones.length - 1]) : tr('lee.sinSesion'),
      series: plural('lee.series', sem.series),
      comida: sem.antesDeMoss ? tr('lee.antesDeMoss') : sem.anotados ? tr('lee.llegaste', { n: sem.llegaste, de: sem.pasados }) : tr('lee.sinAnotar'),
      sueno: sem.antesDeMoss ? tr('lee.antesDeMoss') : sem.promedio === null ? tr('lee.sinNoches') : pegado(horas(sem.promedio)) + (sem.menosDe6 ? ` · ${plural('lee.menosDe6', sem.menosDe6)}` : ''),
    });

    // vinculadaAntes: cómo estaba Ascent al abrirse desde la galería, para volver a eso al cerrar (null si la abrió otra propuesta).
    const estado = { modo: 'carriles', ejercicio: null, semana: SEMANAS - 2, cuadro: false, fila: null, volverA: null, vista: null, vinculadaAntes: null };
    let abrirCuadro = () => {};

    function carriles(c) {
      const caja = el('div', 'pqn-carriles' + (c.estado === 'noSube' || c.estado === 'bajo' ? ' con-desde' : ''));
      caja.tabIndex = 0;
      caja.setAttribute('role', 'slider');
      caja.setAttribute('aria-label', tr('carriles.etiqueta'));
      caja.setAttribute('aria-valuemin', '1');
      caja.setAttribute('aria-valuemax', String(SEMANAS));
      const rayas = caja.appendChild(el('div', 'pqn-rayas'));
      rayas.appendChild(el('i', 'pqn-banda'));
      if (c.desdeCol) {
        const d = rayas.appendChild(el('i', 'pqn-desde' + (c.desdeCol > 7 ? ' derecha' : '')));
        d.style.setProperty('--desde', c.desdeCol / SEMANAS);
        d.appendChild(el('b', null, tr(c.estado === 'bajo' ? 'carriles.desdeAquiBajo' : 'carriles.desdeAqui')));
      } else if (c.estado === 'noSube') caja.appendChild(el('p', 'pqn-desde-antes', tr('carriles.desdeAntes')));
      rayas.appendChild(el('i', 'pqn-regla'));

      const marcado = (que) => c.razones.some((x) => que.includes(x.que));
      const partes = [
        ['fuerza', svgDeFuerza, false],
        ['series', svgDeSeries, marcado(['series', 'frecuencia'])],
        ...(sinComida() ? [] : [['comida', svgDeComida, marcado(['llegaste'])]]),
        ['sueno', svgDeSueno, marcado(['sueno'])],
      ];
      const lecturas = {};
      partes.forEach(([clave, dibujar, conColor], n) => {
        const carril = caja.appendChild(el('section', `pqn-carril pqn-de-${clave}${conColor ? ' marcado' : ''}`));
        carril.style.setProperty('--n', n);
        const cab = carril.appendChild(el('header', 'pqn-carril-cab'));
        lecturas[clave] = el('span', 'pqn-lee');
        cab.append(el('span', 'pqn-etq', tr('carriles.' + clave)), el('span', 'pqn-carril-sub', tr(`carriles.${clave}Sub`, { musculo: musculoDe(c) })), lecturas[clave]);
        carril.insertAdjacentHTML('beforeend', dibujar(c));
        // Lo vacío de antes de Moss se dice una vez, en el primer carril de Moss.
        if (ANTES_DE_MOSS && clave === (sinComida() ? 'sueno' : 'comida')) carril.appendChild(el('div', 'pqn-antes-moss')).appendChild(el('span', null, tr('antesDeMoss')));
      });
      const eje = caja.appendChild(el('div', 'pqn-eje'));
      LUNES.forEach((l, i) => { eje.appendChild(el('span', null, String(u.partes(l).num))).dataset.semana = i; });
      // El mes, debajo de su primer lunes.
      LUNES.forEach((l, i) => {
        const x = u.partes(l);
        if (i === 0 || x.num <= 7) eje.appendChild(el('small', null, u.tx('fecha.mesesCortos.' + x.mes))).style.setProperty('--c', i);
      });

      // La leyenda de los carriles: solo lo que se ve en este dibujo.
      const hay = (clase) => !!caja.querySelector(clase);
      const deLosCarriles = leyenda([[
        hay('.pqn-f-franja') && ['<rect class="pqn-f-franja" x="0" y="3" width="16" height="10"/><line class="pqn-f-tend" x1="0" x2="16" y1="8" y2="8"/>', tr('carriles.franja', { n: numero(c.t.sigma, 1) })],
        hay('.pqn-f-aro') && ['<circle class="pqn-f-aro" cx="8" cy="8" r="6.4"/><circle class="pqn-f-punto" cx="8" cy="8" r="3.2"/>', tr('carriles.marca')],
        hay('.pqn-b-antes') && ['<line class="pqn-b-antes" x1="0" x2="16" y1="8" y2="8"/>', tr(c.estado === 'bajo' ? 'carriles.seriesAntesBajo' : 'carriles.seriesAntes')],
        ['<line class="pqn-s-necesita" x1="0" x2="16" y1="8" y2="8"/>', tr('carriles.necesitas', { horas: u.duracion(necesidad) })],
        hay('.pqn-s-menos') && ['<circle class="pqn-s-menos" cx="8" cy="8" r="2.4"/>', tr('carriles.nocheDeMenos')],
      ].filter(Boolean)]);
      const detalle = el('div', 'pqn-detalle');

      let puesta = -1;
      /** La semana elegida: la banda, la raya (en el dedo o al medio de la semana), las lecturas y el día por día. */
      function elegir(i, fr) {
        caja.style.setProperty('--x', (fr == null ? (i + 0.5) / SEMANAS : fr).toFixed(4));
        if (i === puesta) return;
        const primera = puesta < 0;
        puesta = i;
        estado.semana = i;
        const sem = c.semanas[i];
        caja.style.setProperty('--col', i);
        caja.setAttribute('aria-valuenow', String(i + 1));
        caja.setAttribute('aria-valuetext', tituloDeSemana(sem.lunes));
        caja.querySelectorAll('.elegida').forEach((n) => n.classList.remove('elegida'));
        caja.querySelectorAll(`[data-semana="${i}"]`).forEach((n) => n.classList.add('elegida'));
        Object.entries(lecturaDe(sem)).forEach(([clave, texto]) => {
          const n = lecturas[clave];
          if (!n || n.textContent === texto) return;
          n.textContent = texto;
          if (primera) return;
          n.classList.remove('cambia');
          void n.offsetWidth;
          n.classList.add('cambia');
        });
        // El día por día cambia con un fundido corto: el de antes se va encima del nuevo.
        const nuevo = diasDe(c, i);
        const viejo = detalle.querySelector('.pqn-dias:not(.sale)');
        detalle.querySelectorAll('.sale').forEach((n) => n.remove());
        if (viejo && !g.movimientoReducido) {
          viejo.classList.remove('entra');
          viejo.classList.add('sale');
          setTimeout(() => viejo.remove(), 180);
          nuevo.classList.add('entra');
        } else if (viejo) viejo.remove();
        detalle.appendChild(nuevo);
      }

      // La raya sigue al dedo. Con el dedo, recién al moverse de costado (o al tocar y soltar): bajar la pantalla
      // desde acá no elige nada.
      const fraccion = (ev) => { const r = rayas.getBoundingClientRect(); return Math.min(0.9999, Math.max(0, (ev.clientX - r.left) / r.width)); };
      const seguir = (ev) => { const fr = fraccion(ev); elegir(Math.floor(fr * SEMANAS), fr); };
      let dedo = null;
      caja.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        // Ya la mueve la persona: la raya deja de llegar sola.
        caja.classList.add('tocada');
        dedo = { id: ev.pointerId, x: ev.clientX, activo: ev.pointerType === 'mouse' };
        if (!dedo.activo) return;
        caja.setPointerCapture(dedo.id);
        caja.classList.add('arrastrando');
        seguir(ev);
      });
      caja.addEventListener('pointermove', (ev) => {
        if (!dedo || ev.pointerId !== dedo.id) return;
        if (!dedo.activo) {
          if (Math.abs(ev.clientX - dedo.x) < 6) return;
          dedo.activo = true;
          caja.setPointerCapture(dedo.id);
          caja.classList.add('arrastrando');
        }
        seguir(ev);
      });
      caja.addEventListener('pointerup', (ev) => {
        if (!dedo || ev.pointerId !== dedo.id) return;
        if (!dedo.activo) seguir(ev);
        dedo = null;
        caja.classList.remove('arrastrando');
        elegir(puesta);
      });
      caja.addEventListener('pointercancel', () => { dedo = null; caja.classList.remove('arrastrando'); elegir(puesta); });
      caja.addEventListener('keydown', (ev) => {
        const paso = ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowRight' ? 1 : 0;
        if (!paso) return;
        ev.preventDefault();
        caja.classList.add('tocada');
        elegir(Math.min(SEMANAS - 1, Math.max(0, puesta + paso)));
      });
      elegir(Math.min(SEMANAS - 1, Math.max(0, estado.semana)));
      return [caja, deLosCarriles, detalle, leyendaDeLosDias()];
    }

    // ------------------------------------------------------------ antes y ahora
    /** Una línea entre lo de cuando subía y lo de ahora: cae o sube según cuánto cambió, hasta un 40 %. */
    function pendiente(f) {
      if (f.antes === null || f.ahora === null || !f.antes) return '<svg class="pqn-pendiente" viewBox="0 0 56 30" aria-hidden="true"><line class="sin" x1="6" x2="44" y1="15" y2="15"/><circle cx="50" cy="15" r="3"/></svg>';
      const d = Math.max(-1, Math.min(1, (f.ahora - f.antes) / f.antes / 0.4)) * 9;
      return `<svg class="pqn-pendiente" viewBox="0 0 56 30" aria-hidden="true"><line x1="6" x2="50" y1="${(15 + d).toFixed(1)}" y2="${(15 - d).toFixed(1)}"/><circle cx="6" cy="${(15 + d).toFixed(1)}" r="3"/><circle cx="50" cy="${(15 - d).toFixed(1)}" r="3"/></svg>`;
    }
    function cuadro(c) {
      const caja = el('div', 'pqn-cuadro');
      const cab = caja.appendChild(el('div', 'pqn-cuadro-cab'));
      const titulo = (clase, texto, n) => cab.appendChild(el('span', clase, texto)).appendChild(el('small', null, n ? u.plural('ascent.fuerza.sesiones', n) : '—'));
      titulo('antes', tr(c.estado === 'bajo' ? 'cuadro.antesBajo' : 'cuadro.antes'), c.sesionesAntes);
      titulo('ahora', tr('cuadro.ahora'), c.sesionesAhora);
      c.filas.forEach((f) => {
        const fila = caja.appendChild(el('div', 'pqn-factor' + (f.marcada ? ' marcado' : '')));
        const nombre = fila.appendChild(el('span', 'pqn-factor-nombre', conMayuscula(tr('cuadro.filas.' + f.que, { musculo: musculoDe(c) }))));
        nombre.appendChild(el('small', null, tr('cuadro.unidades.' + f.que)));
        // «Puede influir», en su renglón: así no se corta a la mitad en una pantalla chica.
        if (f.marcada) nombre.appendChild(el('small', null, tr('cuadro.puedeInfluir')));
        fila.appendChild(el('span', 'pqn-factor-valor antes', f.antes === null ? '—' : f.ver(f.antes)));
        fila.insertAdjacentHTML('beforeend', pendiente(f));
        fila.appendChild(el('span', 'pqn-factor-valor ahora', f.ahora === null ? '—' : f.ver(f.ahora)));
      });
      if (!c.sesionesAntes) caja.appendChild(el('p', 'pqn-sin-antes', tr('cuadro.sinAntes')));
      else if (c.sinMoss) caja.appendChild(el('p', 'pqn-sin-antes', tr(c.estado === 'bajo' ? 'cuadro.sinMossBajo' : 'cuadro.sinMoss', { fecha: diaMes(Datos.INICIO) })));
      const que = caja.appendChild(el('div', 'pqn-que'));
      que.appendChild(el('h4', 'pqn-etq', tr('cuadro.queCambiar')));
      sugerenciasDe(c).forEach((s) => que.appendChild(el('p', null, s)));
      // Los años entrenando no son una causa: van aparte, de contexto (con el texto de la sección).
      if (c.anios !== null) que.appendChild(el('p', 'pqn-ademas', u.tx('ascent.estancados.anios')));
      return caja;
    }
    function veredicto(c) {
      const caja = el('div', 'pqn-veredicto-caja pqn-entra');
      const conCuadro = c.estado === 'noSube' || c.estado === 'bajo';
      const v = caja.appendChild(conCuadro ? u.boton('pqn-veredicto', '', () => abrirCuadro(!estado.cuadro)) : el('div', 'pqn-veredicto'));
      v.appendChild(el('span', 'pqn-frase', fraseDe(c)));
      v.appendChild(el('span', 'pqn-bajo')).innerHTML = bajoDe(c);
      abrirCuadro = () => {};
      if (!conCuadro) return caja;
      v.appendChild(el('span', 'pqn-ver')).innerHTML = `${tr('verAntesYAhora')}${icono('abajo')}`;
      const pliegue = caja.appendChild(el('div', 'pqn-pliegue'));
      const dentro = pliegue.appendChild(el('div'));
      dentro.appendChild(cuadro(c));
      abrirCuadro = (si) => {
        estado.cuadro = si;
        v.setAttribute('aria-expanded', String(si));
        pliegue.classList.toggle('abierto', si);
        dentro.inert = !si;
      };
      abrirCuadro(estado.cuadro);
      return caja;
    }

    // ------------------------------------------------------------ semana por semana
    function porSemana(c) {
      const caja = el('div', 'pqn-semanas' + (sinComida() ? ' sin-comida' : ''));
      const cab = caja.appendChild(el('div', 'pqn-sem-cab'));
      const conLetras = (texto) => {
        const s = cab.appendChild(el('span'));
        s.appendChild(el('b', 'pqn-etq', texto));
        const letras = s.appendChild(el('span', 'pqn-sem-letras'));
        Fechas.SEMANA.forEach((d) => letras.appendChild(el('i', null, u.tx('fecha.diasCortos.' + d).charAt(0))));
      };
      // La primera columna, la del lunes de cada semana, no necesita rótulo.
      cab.append(el('i'), el('b', 'pqn-etq', tr('semanas.fuerza')));
      if (!sinComida()) conLetras(tr('semanas.comida'));
      conLetras(tr('semanas.sueno'));
      const abiertas = new Map();
      const abrirFila = (i) => {
        const cual = estado.fila === i ? null : i;
        estado.fila = cual;
        abiertas.forEach((x, k) => {
          const si = k === cual;
          if (si && !x.dentro.firstChild) x.dentro.appendChild(diasDe(c, k));
          x.boton.setAttribute('aria-expanded', String(si));
          x.pliegue.classList.toggle('abierto', si);
          x.dentro.inert = !si;
        });
      };
      const raya = (n) => {
        const r = caja.appendChild(el('div', 'pqn-sem-desde'));
        r.style.setProperty('--n', n);
        r.innerHTML = `<span>${icono('arriba')}${tr(c.estado === 'bajo' ? 'semanas.desdeAquiBajo' : 'semanas.desdeAqui')}</span>`;
      };
      [...c.semanas].reverse().forEach((sem, n) => {
        if (c.desdeCol && sem.i === c.desdeCol - 1) raya(n);
        const fila = caja.appendChild(el('div', 'pqn-sem'));
        const boton = fila.appendChild(u.boton('pqn-sem-fila', '', () => abrirFila(sem.i), tituloDeSemana(sem.lunes)));
        boton.style.setProperty('--n', n);
        boton.appendChild(el('span', 'pqn-sem-fecha', u.fechaCorta(sem.lunes)));
        const h = sem.sesiones[sem.sesiones.length - 1];
        const fuerza = boton.appendChild(el('span', 'pqn-sem-fuerza' + (h ? '' : ' sin')));
        if (h) {
          // Contra la sesión anterior con el ejercicio: subió, igual o bajó.
          const anterior = c.hechas[c.hechas.indexOf(h) - 1];
          const como = !anterior ? null : h.e1rm > anterior.e1rm + 1e-9 ? 'sube' : h.e1rm < anterior.e1rm - 1e-9 ? 'baja' : 'igual';
          const flecha = fuerza.appendChild(el('i', como || '', como === 'sube' ? '↑' : como === 'baja' ? '↓' : como ? '=' : ''));
          if (como) flecha.setAttribute('aria-label', tr('semanas.' + como));
          fuerza.appendChild(document.createTextNode(`${u.peso(h.peso)} × ${h.reps}`));
        } else fuerza.append(el('i'), document.createTextNode('—'));
        if (sem.antesDeMoss) boton.appendChild(el('span', 'pqn-sem-antes', tr('lee.antesDeMoss')));
        else {
          if (!sinComida()) boton.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 84 22" aria-hidden="true">${sem.dias.map((d, k) => (d.comida ? marcaDeComida(d.comida, k * 12 + 6, 11, 3.3) : '')).join('')}</svg>`);
          boton.insertAdjacentHTML('beforeend', svgDeNoches(sem, 84, 22, 5, false));
        }
        boton.insertAdjacentHTML('beforeend', icono('abajo'));
        const pliegue = fila.appendChild(el('div', 'pqn-pliegue'));
        const dentro = pliegue.appendChild(el('div'));
        dentro.inert = true;
        boton.setAttribute('aria-expanded', 'false');
        abiertas.set(sem.i, { boton, pliegue, dentro });
      });
      if (c.estado === 'noSube' && !c.desdeCol) caja.appendChild(el('p', 'pqn-nota', tr('carriles.desdeAntes')));
      if (estado.fila !== null) { const i = estado.fila; estado.fila = null; abrirFila(i); }
      return [caja, leyendaDeLosDias()];
    }

    // ------------------------------------------------------------ en qué se basa
    function enQueSeBasa() {
      const caja = el('div', 'pqn-basa');
      const pliegue = el('div', 'pqn-pliegue');
      const dentro = pliegue.appendChild(el('div'));
      dentro.inert = true;
      tr('basa.lineas').forEach((linea) => dentro.appendChild(el('p', null, pegado(linea.replace('{n}', A.umbral)))));
      const boton = u.boton('pqn-basa-boton', `<span>${tr('basa.titulo')}${icono('abajo')}</span>`, () => {
        const si = !pliegue.classList.contains('abierto');
        boton.setAttribute('aria-expanded', String(si));
        pliegue.classList.toggle('abierto', si);
        dentro.inert = !si;
      });
      boton.setAttribute('aria-expanded', 'false');
      caja.append(boton, pliegue);
      return caja;
    }

    // ------------------------------------------------------------ la pantalla
    function volver() {
      const a = estado.volverA;
      Galeria.ver('porQueNoMejoro', null);
      if (a) Galeria.ver(a[0], a[1]);
    }
    let pintadas = 0;
    function pintar(deArriba) {
      pintadas++;
      armarMundo();
      const c = casoDe(ejercicioDe(estado.ejercicio));
      estado.ejercicio = c.e.id;
      const antes = p.el.querySelector('.pqn-scroll');
      const scroll = el('div', 'pqn-scroll');
      const cab = scroll.appendChild(el('header', 'pqn-cab'));
      cab.append(u.boton('pqn-atras', icono('atras'), volver, u.tx('comun.atras')), el('h1', 'pqn-titulo', tr('titulo')));
      const campo = scroll.appendChild(u.boton('pqn-campo', `<span>${c.nombre}</span>${icono('abajo')}`, () => abrirSelector(), `${tr('elegir')}: ${c.nombre}`));
      campo.setAttribute('aria-haspopup', 'dialog');
      scroll.appendChild(veredicto(c));
      scroll.append(...(estado.modo === 'semanas' ? porSemana(c) : carriles(c)), enQueSeBasa());
      p.el.replaceChildren(scroll);
      Detalles.franja(p.el, scroll, '5, 6, 10');
      scroll.scrollTop = deArriba || !antes ? 0 : antes.scrollTop;
    }

    // ------------------------------------------------------------ elegir el ejercicio
    const hoja = Util.hoja(g.tel, 'pqn-hoja as-vars');
    /** La hoja para elegir; si ya está abierta, se rearma en su lugar (con lo que se estaba buscando). */
    function abrirSelector(consulta) {
      const h = hoja.el;
      h.setAttribute('aria-label', tr('elegir'));
      const cab = el('header', 'pqn-hoja-cab');
      cab.append(el('h2', null, tr('elegir')), u.boton('pqn-hoja-cerrar', icono('cerrar'), () => hoja.cerrar(), tr('cerrar')));
      const buscar = el('label', 'pqn-buscar');
      buscar.innerHTML = icono('lupa');
      const campo = buscar.appendChild(el('input'));
      Object.assign(campo, { type: 'text', placeholder: tr('buscar'), autocomplete: 'off', spellcheck: false, value: consulta || '' });
      campo.setAttribute('aria-label', tr('buscar'));
      campo.setAttribute('enterkeyhint', 'search');
      const lista = el('div', 'pqn-lista');
      h.replaceChildren(el('div', 'hb-asa'), cab, buscar, lista);
      const todos = ejerciciosConFuerza().map(casoDe);
      const opcion = (c, bajo, derecha) => {
        const b = u.boton('pqn-opcion' + (c.e.id === estado.ejercicio ? ' elegida' : ''), '', () => {
          estado.ejercicio = c.e.id;
          estado.cuadro = false;
          estado.fila = null;
          hoja.cerrar();
          // La pantalla cambia cuando la hoja ya deja verla.
          setTimeout(() => { if (p.abierta) pintar(true); }, g.movimientoReducido ? 0 : 200);
        });
        const nombre = b.appendChild(el('span', null, c.nombre));
        if (bajo) nombre.appendChild(el('small', null, bajo));
        b.appendChild(el('span', null, derecha));
        return b;
      };
      const pintarLista = () => {
        const q = sinTildes(campo.value.trim());
        const va = (c) => !q || sinTildes(c.nombre).includes(q);
        lista.replaceChildren();
        const noSuben = losQueNoSuben().filter(va);
        if (noSuben.length) {
          lista.appendChild(el('h3', 'pqn-etq', tr('noSuben')));
          // Lo que no sube, con su marca; lo que bajó, con su última sesión.
          noSuben.forEach((c) => lista.appendChild(c.estado === 'bajo'
            ? opcion(c, tr('bajoDesde', { n: numero(Math.round(c.bajada.caida)), fecha: u.fechaCorta(c.bajada.desde) }), marcaDe(c.hechas[c.hechas.length - 1]))
            : opcion(c, tr('desde', { fecha: u.fechaCorta(c.marca.fecha) }), marcaDe(c.marca))));
        }
        Object.keys(u.tx('ascent.hoy.grupos')).forEach((grupo) => {
          const suyos = todos.filter((c) => Musculos.CATALOGO[c.e.id].grupo === grupo && va(c));
          if (!suyos.length) return;
          lista.appendChild(el('h3', 'pqn-etq', u.tx('ascent.hoy.grupos.' + grupo)));
          suyos.forEach((c) => lista.appendChild(opcion(c, '', c.hechas.length ? marcaDe(c.hechas[c.hechas.length - 1]) : '')));
        });
        lista.appendChild(el('p', null, lista.firstChild ? tr('soloConUnRm') : tr('nada')));
      };
      campo.addEventListener('input', pintarLista);
      if (g.opciones.teclado) g.opciones.teclado.encadenar([campo], { contenedor: h });
      pintarLista();
      hoja.abrir();
    }

    // El idioma de la galería cambia con la pantalla abierta: se pinta de nuevo.
    let idiomaDeAntes = null;
    let cambiandoIdioma = false;
    function ponerIdioma(quiere) {
      const a = quiere || idiomaDeAntes;
      if (!quiere) idiomaDeAntes = null;
      if (!a || g.idioma === a) return;
      if (quiere) idiomaDeAntes = g.idioma;
      cambiandoIdioma = true;
      window.__idioma(a);
      cambiandoIdioma = false;
    }
    document.getElementById('s-idioma').addEventListener('click', () => {
      if (cambiandoIdioma) return;
      const vez = pintadas;
      setTimeout(() => {
        // Si algo la pintó después del cambio (otro botón que la abrió, con su hoja), ya está en el idioma nuevo.
        if (!p.abierta || pintadas !== vez) return;
        pintar();
        if (hoja.abierta) abrirSelector(hoja.el.querySelector('.pqn-buscar input').value);
      }, 0);
    });

    return {
      abrir(vista, arg) {
        const pedido = typeof arg === 'string' ? { ejercicio: arg } : arg || {};
        // Recién abierta, cómo estaba Ascent: al cerrar vuelve a eso. Si la abrió otra propuesta, la vuelta es de ella.
        if (estado.vista === null) estado.vinculadaAntes = pedido.volverA ? null : g.secciones.ascent.vinculada;
        g.vincular(true);
        // «En inglés» pasa la galería a inglés; al salir de esa vista, vuelve el idioma que había.
        ponerIdioma(vista === 'en' ? 'en' : null);
        Object.assign(estado, {
          vista, modo: vista === 'semanas' ? 'semanas' : 'carriles', cuadro: false, fila: null,
          ejercicio: pedido.deAfuera ? pedido.ejercicio || null : pedido.ejercicio || DE_LA_VISTA[vista] || DEL_EJEMPLO,
          semana: pedido.semana == null ? SEMANAS - 2 : pedido.semana,
          volverA: pedido.volverA || null,
        });
        // Desde un botón de la galería, la pantalla va sobre Progreso, donde está Ascent: «‹» vuelve ahí.
        if (!estado.volverA && g.pestana !== 2) g.irA(2, true);
        // La hoja baja con su animación: así también se va el «con-hoja» del teléfono (Util.hoja, sin deUna).
        hoja.cerrar();
        pintar(true);
        p.abrir();
        // El cuadro crece desde la frase cuando la pantalla ya entró.
        if (vista === 'antesYAhora') setTimeout(() => { if (estado.vista === 'antesYAhora' && p.abierta) abrirCuadro(true); }, g.movimientoReducido ? 0 : 520);
        if (vista === 'elegir') abrirSelector();
      },
      cerrar() {
        estado.vista = null;
        hoja.cerrar();
        p.cerrar();
        ponerIdioma(null);
        if (estado.vinculadaAntes !== null) g.vincular(estado.vinculadaAntes);
        estado.vinculadaAntes = null;
      },
    };
  },
});

// Para las propuestas de la sección de Ascent: «¿Por qué no estás mejorando? ›» abre la pantalla en ese ejercicio (sin
// ejercicio, en el que lleva más tiempo sin subir). «‹» vuelve a la propuesta que la abrió.
window.PorQueNoMejoro = {
  abrir(ejercicioId) {
    const b = document.querySelector('[data-propuesta][aria-pressed="true"]:not([data-propuesta="porQueNoMejoro"])');
    return Galeria.ver('porQueNoMejoro', 'carriles', { deAfuera: true, ejercicio: ejercicioId, volverA: b ? [b.dataset.propuesta, b.dataset.vista] : null });
  },
};
