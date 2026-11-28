// Los avisos a la vista y «Tu plan de sueño» (lo que pediste el 27/11, para aprobar). Tres partes de una propuesta:
// - La campanita en Hábitos: una pastilla abajo a la derecha del cielo, con su globo la primera vez y un punto
//   mientras hay algo nuevo. Abre «Avisos», una sola hoja: la línea de hoy, una sugerencia «Para ti», los grupos por
//   momento del día con cada fila diciendo a qué hora suena hoy o por qué no, tus hábitos y cuántos por día.
// - Activarlos en contexto: el chip de la tarjeta de la deuda, en Sueño.
// - «Tu plan de sueño», en Sueño, en lugar de la tarjeta del periodo: la rutina (A) y la noche entera (B).
// Va sobre las secciones de verdad: la pastilla cuelga de la capa de Hábitos, y el plan y el chip se insertan en
// Sueño (un observador los repone cuando Sueño se pinta de nuevo). Al cerrar la propuesta, todo queda como estaba.
// Las horas salen de tu periodo de melatonina, el mismo de Sueño (Melatonina, con sus noches). Qué suena hoy lo arma
// una regla corta, de mentira (agenda); lo que dice cada aviso que ya está en la app sale de Avisos.tituloDelAviso y
// textoDelAviso, y lo nuevo va acá, en es y en, hasta que se apruebe.

const TX = {
  es: {
    titulo: 'Avisos',
    globo: 'Aquí eliges qué te avisa Moss, y cuándo.',
    bajada: 'Pocos y a su hora: uno a la vez, y nunca lo que ya hiciste.',
    hoy: 'Hoy · {dia} {num}',
    ver: 'Ver cómo se ven',
    cuenta: { otros: 'Hasta {n} hoy · ya pasaron {m} · máximo {max}', uno: 'Hasta {n} hoy · ya pasó 1 · máximo {max}', nada: 'Hasta {n} hoy · todavía ninguno · máximo {max}', vacia: 'Hoy no suena ninguno · máximo {max}' },
    punto: { sono: '{hora} · {nombre} · sonó', callo: '{hora} · {nombre} · no hizo falta', sigue: '{hora} · {nombre}' },
    puntos: { anotar: 'Anotar {comida}' },
    asiSeVe: 'Así se ve en tu pantalla bloqueada.',
    paraTi: 'Para ti', activar: 'Activar', ahoraNo: 'Ahora no',
    cafe: 'Tomas café casi todos los días. ¿Te aviso desde qué hora conviene dejarlo? Hoy sería a las {hora}.',
    cafeListo: 'Listo: «Café» queda activado. Está en «La tarde».',
    grupos: { manana: 'La mañana', comidas: 'Las comidas', tarde: 'La tarde', noche: 'La noche', habitos: 'Tus hábitos', cuantos: 'Cuántos por día' },
    notas: {
      manana: 'Empiezan cuando Moss sabe que te despertaste.',
      comidas: 'Moss te recuerda anotar lo que comiste, solo si todavía no lo anotaste.',
      noche: 'Sale de tu periodo de melatonina ({desde} – {hasta}), que cambia cada día.',
      habitos: 'Cada hábito con su aviso. No suena si ya está hecho.',
    },
    filas: { pesarte: 'Pesarte', anotar: 'Anotar lo que comiste', plan: 'Tu plan de sueño' },
    comidas: { desayuno: 'el desayuno', almuerzo: 'el almuerzo', merienda: 'la merienda', cena: 'la cena' },
    estado: {
      hoy: 'hoy {hora}', sono: 'hoy sonó a las {hora}', seria: 'hoy sería a las {hora}',
      anotado: 'hoy no suena: ya lo anotaste', hecho: 'hoy no suena: ya está hecho', noEntrenas: 'hoy no entrenas',
      fuera: 'hoy no suena: queda fuera de tu máximo', sinRutina: 'hoy no suena: esta noche, sin rutina', noToca: 'hoy no toca',
      permiso: 'no suena: falta el permiso',
      manana: 'desde mañana · hoy ya pasó ({hora})', alDespertar: 'desde mañana, al despertarte',
      elProximo: 'desde el {dia} · hoy ya pasó ({hora})',
      deuda: 'Todos los días, al despertarte',
      pesarte: 'al despertarte, antes de desayunar', elControl: 'el {dia}, al despertarte',
      pendientes: 'por la mañana, con lo que anotaste anoche',
      anotar: 'después de cada comida, solo si no la anotaste', anotarHoy: 'hoy {hora}, solo si no anotaste {comida}',
      falta: 'por la tarde, solo si vas muy bajo', faltaManana: 'desde mañana, por la tarde',
      plan: 'hoy {hora} · tu rutina de sueño',
      enElPlan: 'en tu plan de sueño · {hora}', siFaltan: 'hoy {hora}, si todavía faltan',
      sinAviso: 'sin aviso', teAvisa: 'te avisa a las {hora}',
      conElPlan: 'con tu plan de sueño · {hora}', conElPlanCallado: 'con tu plan de sueño, que hoy no avisa',
    },
    anotarTexto: '45 min después de la hora en que sueles comer, y solo si todavía no la anotaste. Si no abres Moss en una semana, paran solos.',
    editarEnSueno: 'Editar en Sueño',
    agregar: 'Agregar',
    habitoNota: 'No suena si el hábito ya está hecho.',
    habitoEnElPlan: 'Es un paso de tu rutina de sueño: no suena aparte, va con el aviso de las {hora}.',
    comoMucho: 'Como mucho',
    suenan: 'Hoy suenan {n} de {max}. Entre uno y otro pasan al menos 20 minutos.',
    pie: 'Los avisos se arman en tu iPhone: no pasan por ningún servidor.',
    permiso: {
      apagado: 'Los avisos están apagados en tu iPhone', apagadoTexto: 'Lo que elijas aquí queda guardado y empieza a sonar cuando los actives.', ajustes: 'Abrir Ajustes',
      sinPedir: 'Moss todavía no tiene permiso para avisarte', sinPedirTexto: 'Elige con calma: nada suena hasta que lo permitas.', permitir: 'Permitir avisos',
    },
    desliza: 'Desliza para ver el día, hora por hora', nada: 'Todavía no sonó nada.',
    chip: { apagado: 'Avísame cada mañana', prendido: 'Te aviso al despertar' },
    plan: {
      titulo: 'Tu plan de sueño', editar: 'Editar', verNoche: 'Ver la noche entera', verRutina: 'Ver solo tu rutina',
      dia: 'Empieza {inicio} · te acuestas {cama}',
      rutina: 'Tu rutina de sueño · desde las {hora}',
      armar: 'Arma tu rutina de sueño', armarTexto: 'Menos de un minuto.',
      teAvisa: 'Te avisa a las {hora}', noAvisa: 'No te avisa', estaNocheNo: 'Esta noche no', sinRutina: 'Esta noche, sin rutina',
      pie: 'Una rutina te ayuda a llegar con sueño a tu hora; no trata el insomnio.',
      noche: 'Tu noche de hoy, hora por hora', rutinaCorta: 'Tu rutina de sueño', agregarPaso: 'Agregar un paso',
      avisoDe: 'Aviso de «{paso}»',
    },
    pasos: {
      luz: 'Luz baja', tranquilo: 'Algo tranquilo', luzYTranquilo: 'Luz baja y algo tranquilo', ducha: 'Ducha tibia', habitacion: 'La habitación, lista',
      anotar: 'Anotar lo que tienes en la cabeza', cama: 'Tu hora de acostarte',
    },
    cortos: { luz: 'luz baja', tranquilo: 'algo tranquilo', ducha: 'ducha tibia', habitacion: 'la habitación lista', anotar: 'anotar lo pendiente', leer: 'leer', escribir: 'escribir' },
    marcas: { cafe: 'Último café', fuerte: 'Lo fuerte, hasta aquí', comida: 'Última comida grande', despertar: 'Tu despertar de siempre' },
    hoja: {
      cuanto: '¿Cuánto antes de tu periodo empiezas?', antes: { 30: '30 min', 45: '45 min', 60: '1 hora', 90: '1 h 30', 120: '2 h' },
      resumen: 'Hoy empieza a las {inicio} y te acuestas a las {cama}.',
      que: '¿Qué haces en ese rato?', deMoss: 'De Moss', tusHabitos: 'Tus hábitos',
      desde: '{paso} · desde las {hora}', a: '{paso} · hoy {hora}',
      porque: {
        luz: 'Con luz baja y cálida, a tu melatonina le cuesta menos subir a tiempo.',
        tranquilo: 'Algo tranquilo y lejos de las pantallas brillantes hace más fácil dormirte.',
        ducha: 'Bien tibia, de 1 a 2 horas antes de acostarte, ayuda a dormirte antes.',
        habitacion: 'Fresca, oscura y en silencio: ayuda a dormirte y a seguir dormido.',
        anotar: 'Anotar tus pendientes antes de acostarte ayuda a dormirte antes.', anotarRecuerda: 'Mañana Moss te los recuerda.',
        habito: 'Es tu hábito: marcarlo aquí es marcar su estrella.',
      },
      conLaDucha: 'Con la ducha, tu rutina de sueño empieza a las {hora}.',
      avisarAlEmpezar: 'Avisarme al empezar', avisarAlAcostarme: 'Avisarme también al acostarme', crear: 'Crear mi rutina de sueño',
    },
    margen: {
      titulo: 'Cuánto antes te acuestas', justo: 'Justo al empezar', antes: '{n} min antes',
      hoy: 'Hoy te acuestas a las {cama}; tu periodo empieza a las {desde}.',
      texto: 'Te acuestas este rato antes de que empiece tu periodo, para estar dormido cuando llega.',
      sinReloj: 'Sin reloj, Moss también lo descuenta al medir tu noche.',
    },
    aviso: {
      titulo: 'Tu periodo de melatonina empieza a las {P}',
      tituloALaUna: 'Tu periodo de melatonina empieza a la {P}',
      falta: { 30: 'media hora', 45: '45 minutos', 60: '1 hora', 90: '1 h 30', 120: '2 horas', minutos: '{n} minutos', horas: '{h} h {m}' },
      conRutina: 'Evita las pantallas y las comidas pesadas. Empieza tu rutina de sueño.',
      soloCama: 'Evita las pantallas y las comidas pesadas. Empieza tu rutina de sueño.',
      sinRutina: 'Evita las pantallas y las comidas pesadas. Empieza tu rutina de sueño.',
    },
  },
  en: {
    titulo: 'Reminders',
    globo: 'Choose what Moss reminds you of, and when.',
    bajada: 'Few, and on time: one at a time, and never for what you’ve already done.',
    hoy: 'Today · {dia} {num}',
    ver: 'See how they look',
    cuenta: { otros: 'Up to {n} today · {m} already past · limit {max}', uno: 'Up to {n} today · 1 already past · limit {max}', nada: 'Up to {n} today · none yet · limit {max}', vacia: 'None today · limit {max}' },
    punto: { sono: '{hora} · {nombre} · sent', callo: '{hora} · {nombre} · not needed', sigue: '{hora} · {nombre}' },
    puntos: { anotar: 'Log {comida}' },
    asiSeVe: 'How it looks on your Lock Screen.',
    paraTi: 'For you', activar: 'Turn on', ahoraNo: 'Not now',
    cafe: 'You have coffee most days. Want a reminder of when it’s best to stop? Today that would be {hora}.',
    cafeListo: 'Done: “Coffee” is on. You’ll find it under “Afternoon”.',
    grupos: { manana: 'Morning', comidas: 'Meals', tarde: 'Afternoon', noche: 'Night', habitos: 'Your habits', cuantos: 'How many a day' },
    notas: {
      manana: 'They start once Moss knows you’re up.',
      comidas: 'Moss reminds you to log what you ate, only if you haven’t logged it yet.',
      noche: 'It follows your melatonin window ({desde} – {hasta}), which shifts every day.',
      habitos: 'Each habit with its reminder. Silent once it’s done.',
    },
    filas: { pesarte: 'Weigh-in', anotar: 'Log what you ate', plan: 'Your sleep plan' },
    comidas: { desayuno: 'breakfast', almuerzo: 'lunch', merienda: 'your afternoon snack', cena: 'dinner' },
    estado: {
      hoy: 'today {hora}', sono: 'sent today at {hora}', seria: 'today it would be {hora}',
      anotado: 'not today: already logged', hecho: 'not today: already done', noEntrenas: 'no training today',
      fuera: 'not today: over your limit', sinRutina: 'not today: no routine tonight', noToca: 'not scheduled today',
      permiso: 'silent: permission is off',
      manana: 'from tomorrow · already past today ({hora})', alDespertar: 'from tomorrow, when you wake up',
      elProximo: 'from {dia} · already past today ({hora})',
      deuda: 'Every day, when you wake up',
      pesarte: 'when you wake up, before breakfast', elControl: 'on {dia}, when you wake up',
      pendientes: 'in the morning, with what you wrote last night',
      anotar: 'after each meal, only if you haven’t logged it', anotarHoy: 'today {hora}, only if you haven’t logged {comida}',
      falta: 'in the afternoon, only if you’re running low', faltaManana: 'from tomorrow, in the afternoon',
      plan: 'today {hora} · your sleep routine',
      enElPlan: 'in your sleep plan · {hora}', siFaltan: 'today {hora}, if you’re still short',
      sinAviso: 'no reminder', teAvisa: 'reminds you at {hora}',
      conElPlan: 'with your sleep plan · {hora}', conElPlanCallado: 'with your sleep plan, silent today',
    },
    anotarTexto: '45 min after your usual time, and only if you haven’t logged it yet. If you don’t open Moss for a week, they stop on their own.',
    editarEnSueno: 'Edit in Sleep',
    agregar: 'Add',
    habitoNota: 'Silent once the habit is done.',
    habitoEnElPlan: 'It’s a step in your sleep routine: it doesn’t sound on its own; it comes with the {hora} reminder.',
    comoMucho: 'At most',
    suenan: '{n} of {max} today. At least 20 minutes pass between them.',
    pie: 'Reminders are set up on your iPhone: they don’t go through any server.',
    permiso: {
      apagado: 'Notifications are off on your iPhone', apagadoTexto: 'What you choose here is saved and starts once you turn them on.', ajustes: 'Open Settings',
      sinPedir: 'Moss doesn’t have permission to notify you yet', sinPedirTexto: 'Take your time: nothing is sent until you allow it.', permitir: 'Allow notifications',
    },
    desliza: 'Slide to see the day, hour by hour', nada: 'Nothing yet.',
    chip: { apagado: 'Remind me every morning', prendido: 'Reminding you when you wake up' },
    plan: {
      titulo: 'Your sleep plan', editar: 'Edit', verNoche: 'See the whole night', verRutina: 'See just your routine',
      dia: 'Starts {inicio} · bed at {cama}',
      rutina: 'Your sleep routine · from {hora}',
      armar: 'Set up your sleep routine', armarTexto: 'Under a minute.',
      teAvisa: 'Reminds you at {hora}', noAvisa: 'No reminder', estaNocheNo: 'Not tonight', sinRutina: 'No routine tonight',
      pie: 'A routine helps you reach bedtime sleepy; it doesn’t treat insomnia.',
      noche: 'Tonight, hour by hour', rutinaCorta: 'Your sleep routine', agregarPaso: 'Add a step',
      avisoDe: 'Reminder for “{paso}”',
    },
    pasos: {
      luz: 'Low light', tranquilo: 'Something calm', luzYTranquilo: 'Low light and something calm', ducha: 'Warm shower', habitacion: 'Bedroom ready',
      anotar: 'Write down what’s on your mind', cama: 'Your bedtime',
    },
    cortos: { luz: 'low light', tranquilo: 'something calm', ducha: 'a warm shower', habitacion: 'getting the bedroom ready', anotar: 'writing down your to-dos', leer: 'reading', escribir: 'journaling' },
    marcas: { cafe: 'Last coffee', fuerte: 'Hard training until here', comida: 'Last big meal', despertar: 'Your usual wake-up' },
    hoja: {
      cuanto: 'How long before your window do you start?', antes: { 30: '30 min', 45: '45 min', 60: '1 hour', 90: '1 h 30', 120: '2 h' },
      resumen: 'Today it starts at {inicio} and bedtime is {cama}.',
      que: 'What do you do in that time?', deMoss: 'From Moss', tusHabitos: 'Your habits',
      desde: '{paso} · from {hora}', a: '{paso} · today {hora}',
      porque: {
        luz: 'With low, warm light, your melatonin finds it easier to rise on time.',
        tranquilo: 'Something calm, away from bright screens, makes it easier to fall asleep.',
        ducha: 'Nice and warm, 1 to 2 hours before bed, it helps you fall asleep sooner.',
        habitacion: 'Cool, dark and quiet: it helps you fall asleep and stay asleep.',
        anotar: 'Writing down your to-dos before bed helps you fall asleep sooner.', anotarRecuerda: 'Moss reminds you of them tomorrow.',
        habito: 'It’s your habit: checking it here checks its star.',
      },
      conLaDucha: 'With the shower, your sleep routine starts at {hora}.',
      avisarAlEmpezar: 'Remind me when it starts', avisarAlAcostarme: 'Also remind me at bedtime', crear: 'Create my sleep routine',
    },
    margen: {
      titulo: 'How early you get into bed', justo: 'Right at the start', antes: '{n} min before',
      hoy: 'Today bedtime is {cama}; your window starts at {desde}.',
      texto: 'You get into bed this long before your window starts, so you’re asleep when it comes.',
      sinReloj: 'Without a watch, Moss also subtracts it when measuring your night.',
    },
    aviso: {
      titulo: 'Your melatonin window starts at {P}',
      tituloALaUna: 'Your melatonin window starts at {P}',
      falta: { 30: 'half an hour', 45: '45 minutes', 60: '1 hour', 90: '1 h 30', 120: '2 hours', minutos: '{n} minutes', horas: '{h} h {m}' },
      conRutina: 'Avoid screens and heavy meals. Start your sleep routine.',
      soloCama: 'Avoid screens and heavy meals. Start your sleep routine.',
      sinRutina: 'Avoid screens and heavy meals. Start your sleep routine.',
    },
  },
};

const CSS = `
[class^='avp-'][hidden], [class*=' avp-'][hidden] { display: none !important; }
/* El CSS de la galería va después que este (está en el cuerpo de la página): donde empata, gana el suyo. Por eso lo
   que pisa una regla general (el trazo de los íconos de las secciones, .pagina-app svg) lleva un selector más largo. */
/* ---------------- la campanita y la estrella de un hábito ---------------- */
.tel svg.avp-camp, .tel .pagina-app svg.avp-camp { flex: none; width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
.tel svg.avp-camp .cuerpo { fill: currentColor; fill-opacity: 0; transition: fill-opacity 0.25s ease; }
.tel svg.avp-camp.on .cuerpo { fill-opacity: 0.22; }
.tel svg.avp-camp .raya { opacity: 0; transition: opacity 0.25s ease; }
.tel svg.avp-camp.sin .raya { opacity: 1; }
.tel svg.avp-estrella, .tel .pagina-app svg.avp-estrella { flex: none; width: 13px; height: 13px; fill: var(--oro-claro); stroke: none; }

/* ---------------- en Hábitos: la pastilla, su punto y el globo de la primera vez ---------------- */
.avp-campana { position: absolute; right: 16px; bottom: calc(var(--pestanas) + 100px); pointer-events: none; }
.avp-campana > * { pointer-events: auto; transition: opacity 0.25s ease, transform 0.15s ease; }
/* El aviso de una estrella sale a esa altura: mientras está, la pastilla le deja el lugar. */
.ui .aviso[role='status'].visible ~ .avp-campana > *, .avp-campana.fuera > * { opacity: 0; pointer-events: none; }
.avp-pastilla { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; height: 44px; padding: 0 16px 0 13px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.17); background: rgba(6, 10, 22, 0.58); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); color: rgba(239, 230, 207, 0.92); font: 400 14px/1 var(--texto); letter-spacing: 0.01em; white-space: nowrap; animation: avp-pastilla 0.5s 0.12s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
.avp-pastilla:active { transform: scale(0.96); }
.avp-punto { width: 6px; height: 6px; margin-left: 1px; border-radius: 50%; background: var(--oro-claro); box-shadow: 0 0 8px rgba(246, 227, 166, 0.55); transition: opacity 0.4s ease, width 0.4s ease, margin 0.4s ease; }
.avp-pastilla.visto .avp-punto { opacity: 0; width: 0; margin-left: -7px; }
@keyframes avp-pastilla { from { opacity: 0; transform: translateY(10px); } }
/* El globo no ocupa lugar: va a la izquierda de la pastilla, centrado con ella, y ella no se mueve cuando se va. */
.avp-globo { appearance: none; cursor: pointer; position: absolute; right: calc(100% + 8px); top: 50%; translate: 0 -50%; width: max-content; max-width: 222px; padding: 10px 14px; border-radius: 18px 18px 6px 18px; border: 1px solid rgba(232, 196, 106, 0.3); background: rgba(8, 13, 28, 0.86); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); color: var(--tinta); font: 400 13.5px/1.36 var(--texto); text-align: left; text-wrap: balance; transform-origin: 100% 60%; animation: avp-globo 0.34s 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
.avp-globo.sale { animation: avp-globo-sale 0.26s ease forwards; pointer-events: none; }
/* Una sugerencia a la vez: mientras está el globo, el de las estrellas («Toca una estrella…») se aparta. */
.tel .ui:has(.avp-globo:not(.sale)) .globito.visible { opacity: 0; }
@keyframes avp-globo { from { opacity: 0; transform: scale(0.35); } }
@keyframes avp-globo-sale { to { opacity: 0; transform: scale(0.35); } }

/* ---------------- las hojas ---------------- */
.tel .hb.avp-hoja { padding-bottom: 0; }
/* Avisos crece desde la puerta por la que se entra (la campanita, de fábrica). */
.tel .hb.avp-avisos { height: calc(100% - var(--arriba) + 6px); transform-origin: var(--avp-ox, 82%) 100%; animation: avp-sube 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.tel .hb.avp-avisos.saliendo { animation: avp-baja 0.3s cubic-bezier(0.5, 0, 0.9, 0.6) both; }
@keyframes avp-sube { from { opacity: 0.2; transform: translateY(44%) scale(0.86); } }
@keyframes avp-baja { to { opacity: 0; transform: translateY(44%) scale(0.86); } }
.avp-hoja .hb-cab { padding-bottom: 8px; }
.avp-hoja .hb-titulo.avp-cambia { animation: avp-funde 0.3s ease both; }
.avp-cerrar::before, .avp-atras::before { content: ''; position: absolute; inset: -6px; }
.avp-atras { position: absolute; left: 12px; top: 8px; appearance: none; cursor: pointer; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 0; background: rgba(239, 230, 207, 0.08); color: rgba(239, 230, 207, 0.75); display: grid; place-items: center; opacity: 0; pointer-events: none; transform: translateX(8px); transition: opacity 0.25s ease, transform 0.3s ease; }
.avp-hoja .avp-atras svg { width: 15px; height: 15px; stroke-width: 2; }
.avp-avisos.en-sub .avp-atras { opacity: 1; pointer-events: auto; transform: none; }
.avp-paneles { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.avp-cuerpo { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 0 16px calc(var(--abajo) + 26px); }
.avp-cuerpo::-webkit-scrollbar { display: none; }
.avp-hoja > .avp-cuerpo { flex: 1; min-height: 0; }
.avp-avisos .avp-cuerpo { position: absolute; inset: 0; transition: transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.26s ease; }
.avp-avisos .avp-sub { transform: translateX(100%); opacity: 0; pointer-events: none; }
.avp-avisos.en-sub .avp-lista { transform: translateX(-24%); opacity: 0; pointer-events: none; }
.avp-avisos.en-sub .avp-sub { transform: none; opacity: 1; pointer-events: auto; }

.avp-bajada { margin: 2px 14px 0; text-align: center; font: 400 13.5px/1.42 var(--texto); color: rgba(239, 230, 207, 0.62); text-wrap: balance; }
.avp-etq { margin: 0; font: 400 11px/1.3 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: rgba(239, 230, 207, 0.6); }
.avp-nota { margin: 5px 4px 0; font: 400 13px/1.42 var(--texto); color: rgba(239, 230, 207, 0.58); text-wrap: pretty; font-variant-numeric: tabular-nums; }
.avp-grupo { margin-top: 24px; }
.avp-grupo > .avp-etq { margin: 0 4px; }
.avp-caja { margin-top: 10px; border-radius: 18px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(239, 230, 207, 0.035); overflow: hidden; }
/* Lo que entra o se va de la hoja se abre o se pliega: filas de 0 a su alto. */
.avp-pliega { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.32s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.26s ease; }
.avp-pliega > div { min-height: 0; overflow: hidden; }
.avp-pliega.fuera { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
.avp-cambia { animation: avp-funde 0.3s ease both; }
@keyframes avp-funde { from { opacity: 0; transform: translateY(3px); } }

/* Hoy: la línea del día, un punto por aviso; lo que ya pasó, lleno. */
.avp-hoy { padding-top: 20px; }
.avp-hoy-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 4px; min-height: 24px; }
.avp-enlace { appearance: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: flex-end; gap: 2px; height: 44px; min-width: 44px; padding: 0 4px 0 8px; border: 0; background: none; color: var(--oro-claro); font: 400 13.5px/1 var(--texto); font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity 0.15s ease; }
.avp-enlace:active { opacity: 0.6; }
.avp-enlace svg { width: 14px; height: 14px; }
.avp-hoy-cab .avp-enlace { margin: -10px -6px -10px 0; }
.avp-linea { --ahora: 0%; position: relative; height: 46px; margin: 8px 18px 0; }
.avp-linea-base, .avp-linea-hecha { position: absolute; left: -10px; top: 14px; height: 2px; border-radius: 1px; }
.avp-linea-base { right: -10px; background: rgba(239, 230, 207, 0.13); }
.avp-linea-hecha { width: calc(var(--ahora) + 10px); background: linear-gradient(90deg, rgba(246, 227, 166, 0.16), rgba(246, 227, 166, 0.6)); transition: width 0.4s ease; }
/* «Ahora»: una muesca donde termina lo que ya pasó. */
.avp-linea-ahora { position: absolute; left: var(--ahora); top: 9px; width: 2px; height: 12px; margin-left: -1px; border-radius: 1px; background: rgba(246, 227, 166, 0.85); transition: left 0.4s ease; }
.avp-bl-pie .avp-linea-ahora { display: none; }
.avp-pt { appearance: none; position: absolute; left: var(--x); top: 0; width: 44px; height: 44px; margin-left: -22px; padding: 0; border: 0; background: none; cursor: pointer; transition: left 0.36s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.25s ease; }
.avp-pt i { position: absolute; left: 50%; top: 15px; width: 10px; height: 10px; margin: -5px 0 0 -5px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid rgba(239, 230, 207, 0.6); background: #0c1329; transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.2s ease, transform 0.2s ease; }
.avp-pt.sono i { background: var(--oro-claro); border-color: var(--oro-claro); }
.avp-pt.callo i { transform: scale(0.6); background: rgba(239, 230, 207, 0.42); border-color: transparent; }
.avp-pt.elegido i { box-shadow: 0 0 0 4px rgba(246, 227, 166, 0.2); }
/* Las horas bajo los puntos son marcas de un eje, como las de los gráficos de Sueño. */
.avp-pt span { position: absolute; left: 50%; top: 27px; transform: translateX(-50%); font: 400 13px/1 var(--numeros); color: rgba(239, 230, 207, 0.5); font-variant-numeric: tabular-nums; white-space: nowrap; transition: color 0.2s ease; }
.avp-pt.sigue span, .avp-pt.elegido span { color: rgba(239, 230, 207, 0.88); }
.avp-pt.entra { animation: avp-punto 0.36s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + var(--espera, 180ms)); }
.avp-pt.sale { opacity: 0; pointer-events: none; }
@keyframes avp-punto { from { opacity: 0; transform: scale(0.3); } }
.avp-cuenta { margin: 2px 4px 0; min-height: 19px; font: 400 13px/1.45 var(--texto); color: rgba(239, 230, 207, 0.66); font-variant-numeric: tabular-nums; }

/* Para ti y el permiso: una tarjeta con su texto y, a la derecha, qué hacer. */
.avp-parati-dentro { padding-top: 22px; }
.avp-parati-dentro > .avp-etq { margin: 0 4px; }
.avp-permiso-dentro { padding-top: 12px; }
.avp-tarjeta { margin-top: 10px; padding: 14px 12px 8px 16px; border-radius: 18px; border: 1px solid rgba(232, 196, 106, 0.2); background: linear-gradient(140deg, rgba(232, 196, 106, 0.075), rgba(239, 230, 207, 0.025)); }
.avp-tarjeta p { margin: 0; padding-right: 4px; font: 400 14.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.92); text-wrap: pretty; font-variant-numeric: tabular-nums; }
.avp-permiso-dentro .avp-tarjeta { margin-top: 0; }
.avp-permiso-cab { display: flex; align-items: flex-start; gap: 9px; padding-right: 4px; color: var(--tinta); font: 500 15px/1.3 var(--texto); text-wrap: balance; }
.avp-permiso-cab svg { margin-top: 1px; color: var(--oro-claro); }
.avp-permiso-dentro .avp-tarjeta p { margin-top: 6px; font-size: 13.5px; color: rgba(239, 230, 207, 0.72); }
.avp-acciones { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 6px; }
.avp-quieto { appearance: none; cursor: pointer; height: 44px; padding: 0 12px; border: 0; background: none; color: rgba(239, 230, 207, 0.62); font: 400 14px/1 var(--texto); transition: opacity 0.15s ease; }
.avp-quieto:active { opacity: 0.6; }
.avp-boton { appearance: none; cursor: pointer; position: relative; height: 38px; margin: 3px 0; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(232, 196, 106, 0.5); background: rgba(232, 196, 106, 0.12); color: var(--oro-claro); font: 500 14px/1 var(--texto); white-space: nowrap; transition: transform 0.12s ease, background 0.2s ease; }
.avp-boton::before { content: ''; position: absolute; inset: -3px 0; }
.avp-boton:active { transform: scale(0.96); background: rgba(232, 196, 106, 0.2); }

/* Cada fila: su ícono, su nombre, a qué hora suena hoy o por qué no, su llave y la flecha que la abre. */
.avp-fila + .avp-fila { border-top: 1px solid rgba(239, 230, 207, 0.07); }
.avp-fila-cab { display: grid; grid-template-columns: 30px minmax(0, 1fr) 44px; column-gap: 12px; align-items: start; padding: 13px 12px 11px 14px; cursor: pointer; transition: background 0.2s ease; }
.avp-fila-cab:active { background: rgba(239, 230, 207, 0.03); }
.avp-fila-cab:focus-visible { outline-offset: -3px; }
.avp-ico { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: rgba(239, 230, 207, 0.06); color: rgba(239, 230, 207, 0.8); }
.avp-ico svg { width: 17px; height: 17px; }
.avp-ico.estrella { background: none; }
.avp-ico.estrella svg.avp-estrella { width: 15px; height: 15px; }
.avp-fila-textos { display: grid; gap: 3px; min-width: 0; padding-top: 5px; }
.avp-fila-textos b { font: 400 15.5px/1.25 var(--texto); color: var(--tinta); }
.avp-regla, .avp-estado { font: 400 13px/1.38 var(--texto); color: rgba(239, 230, 207, 0.56); font-variant-numeric: tabular-nums; text-wrap: pretty; }
.avp-estado.sigue { color: rgba(246, 227, 166, 0.9); }
.avp-estado:empty, .avp-regla:empty { display: none; }
.avp-fila-lado { display: grid; justify-items: end; gap: 7px; }
.avp-flecha { display: grid; place-items: center; width: 22px; height: 16px; margin-right: 1px; color: rgba(239, 230, 207, 0.42); }
.avp-flecha svg { width: 15px; height: 15px; transition: transform 0.26s cubic-bezier(0.2, 0.7, 0.2, 1); }
.avp-fila.abierta > .avp-fila-cab .avp-flecha svg { transform: rotate(180deg); }
/* La llave, como las de la app; el toque llega a 44 px aunque se vea de 26. */
.avp-llave { appearance: none; cursor: pointer; flex: none; width: 44px; height: 44px; margin: -6px 0 -12px; padding: 9px 0; border: 0; background: none; }
.avp-llave i { position: relative; display: block; width: 44px; height: 26px; border-radius: 999px; background: rgba(239, 230, 207, 0.15); transition: background 0.2s ease, opacity 0.25s ease; }
.avp-llave i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #f1ece0; transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1); }
.avp-llave[aria-pressed='true'] i { background: rgba(232, 196, 106, 0.82); }
.avp-llave[aria-pressed='true'] i::after { transform: translateX(18px); }
.avp-avisos.sin-permiso .avp-lista .avp-llave i { opacity: 0.42; }
.avp-abre { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 0.26s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.22s ease; }
.avp-abre > div { min-height: 0; overflow: hidden; }
.avp-fila.abierta > .avp-abre { grid-template-rows: 1fr; opacity: 1; }
.avp-abre-dentro { display: grid; gap: 10px; padding: 2px 12px 14px; }
.avp-fila.abierta .avp-abre-dentro > .avp-nt { transform-origin: 50% 0; animation: avp-previa 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; }
@keyframes avp-previa { from { opacity: 0; transform: scale(0.94) translateY(-6px); } }
.avp-asi { margin: -3px 0 0; text-align: center; font: 400 13px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); }
.avp-abre-dentro > .avp-nota { margin: 0 2px; }
.avp-pildoras { display: flex; flex-wrap: wrap; gap: 8px; }
.avp-pildora { appearance: none; cursor: pointer; position: relative; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 8px 13px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.14); background: transparent; color: rgba(239, 230, 207, 0.84); font: 400 13.5px/1.2 var(--texto); font-variant-numeric: tabular-nums; white-space: nowrap; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.12s ease; }
.avp-pildora::before { content: ''; position: absolute; inset: -4px 0; }
.avp-pildora:active { transform: scale(0.96); }
.avp-pildora[aria-pressed='true'] { border-color: rgba(232, 196, 106, 0.6); background: rgba(232, 196, 106, 0.13); color: var(--oro-claro); }
/* El plan de sueño, en su fila: sus pasos con su hora y el segundo aviso, el de acostarte. */
.avp-fila-pasos { margin: -4px 12px 0 56px; padding-bottom: 4px; }
.avp-mini { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; min-height: 30px; font: 400 13.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.82); }
.avp-mini time { font: 400 13px/1 var(--numeros); color: rgba(239, 230, 207, 0.5); font-variant-numeric: tabular-nums; }
.avp-mini > span { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
.avp-mini .avp-llave { margin: -8px 0; }
.avp-mini small { grid-column: 2 / -1; margin: -2px 0 4px; font: 400 13px/1.3 var(--texto); color: rgba(246, 227, 166, 0.9); font-variant-numeric: tabular-nums; }
/* Lo que ya hiciste hoy queda en el plan, apagado: el aviso no lo nombra. */
.avp-mini.hecho > span { color: rgba(239, 230, 207, 0.42); transition: color 0.25s ease; }
.avp-fila-pasos .avp-enlace { display: flex; margin: -2px -4px -6px auto; }
/* Tus hábitos: con aviso, su llave; sin aviso, una línea y «Agregar». */
.avp-fila.sin .avp-fila-cab { grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; padding-top: 6px; padding-bottom: 6px; }
.avp-fila.sin .avp-fila-textos { display: block; padding-top: 0; font: 400 13px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); }
.avp-fila.sin .avp-fila-textos b { color: rgba(239, 230, 207, 0.86); }
.avp-fila.sin .avp-enlace { margin-right: -6px; pointer-events: none; }
/* Dormir: sin llave propia, lleva al plan. */
.avp-fila.del-plan .avp-flecha { align-self: center; justify-self: end; }
.avp-cuantos { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 4px 0; }
.avp-cuantos > span { flex: 0 0 100%; font: 400 14px/1.2 var(--texto); color: rgba(239, 230, 207, 0.78); }
.avp-num { appearance: none; cursor: pointer; position: relative; width: 38px; height: 38px; padding: 0; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.14); background: none; color: rgba(239, 230, 207, 0.84); font: 400 14px/1 var(--numeros); font-variant-numeric: tabular-nums; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.12s ease; }
.avp-num::before { content: ''; position: absolute; inset: -3px -4px; }
.avp-num:active { transform: scale(0.94); }
.avp-num[aria-pressed='true'] { border-color: rgba(232, 196, 106, 0.6); background: rgba(232, 196, 106, 0.14); color: var(--oro-claro); }
.avp-pie { margin: 24px 14px 0; text-align: center; font: 400 13px/1.45 var(--texto); color: rgba(239, 230, 207, 0.45); text-wrap: balance; }
/* El aviso de un hábito, simple: cuándo y cómo se ve. */
.avp-sub-nombre { display: flex; align-items: center; gap: 8px; margin: 12px 4px 0; font: 400 19px/1.25 var(--numeros); color: var(--tinta); }
.avp-sub-nombre svg.avp-estrella { width: 15px; height: 15px; }
.avp-sub-nombre + .avp-pildoras { margin-top: 16px; }
/* Cuatro opciones de cada cosa: en dos columnas parejas, sin una sola colgando abajo. */
.avp-sub .avp-pildoras { display: grid; grid-template-columns: 1fr 1fr; }
.avp-sub .avp-pildora { justify-content: center; }
.avp-sub-detalle { margin-top: 22px; min-height: 44px; }
.avp-reloj { display: flex; align-items: center; gap: 4px; }
.avp-reloj b { min-width: 86px; text-align: center; font: 400 26px/1 var(--numeros); color: #fbf2d9; font-variant-numeric: tabular-nums; }
.avp-mm { appearance: none; cursor: pointer; width: 44px; height: 44px; padding: 0; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.14); background: none; color: var(--tinta); font: 300 22px/1 var(--numeros); transition: transform 0.12s ease, background 0.2s ease; }
.avp-mm:active { transform: scale(0.94); background: rgba(239, 230, 207, 0.06); }
.avp-sub .avp-nt { margin-top: 18px; }
.avp-sub .avp-asi { margin-top: 8px; }
.avp-sub .avp-nota { margin: 14px 4px 0; }

/* ---------------- un aviso, como lo dibuja iOS ---------------- */
.avp-nt { --avp-sis: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', system-ui, sans-serif; display: grid; grid-template-columns: 34px minmax(0, 1fr); column-gap: 10px; padding: 10px 12px 11px; border-radius: 18px; background: rgba(255, 255, 255, 0.09); color: #fff; text-align: left; }
.avp-nt > i { grid-row: 1 / span 2; align-self: center; width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(160deg, #24427a, #101a3a) center / cover no-repeat; }
.avp-nt-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
/* El título va en una línea y se corta, como en la pantalla bloqueada de verdad. En las vistas chicas (la de una
   fila, la del chip) va todo un poco menor, en la misma proporción: así se corta donde se cortaría en el iPhone. */
.avp-nt-cab b { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 600 13px/1.3 var(--avp-sis); }
.avp-nt-cab em { flex: none; font: 400 13px/1.3 var(--avp-sis); color: rgba(255, 255, 255, 0.58); font-variant-numeric: tabular-nums; }
.avp-nt p { grid-column: 2; margin: 1px 0 0; font: 400 13px/1.34 var(--avp-sis); color: rgba(255, 255, 255, 0.94); white-space: pre-line; text-wrap: pretty; font-variant-numeric: tabular-nums; }

/* ---------------- «Ver cómo se ven»: la pantalla bloqueada de hoy ---------------- */
.tel .avp-bloqueo { --avp-sis: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', system-ui, sans-serif; position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; overflow: hidden; color: #fff; background: #0a1024 center / cover no-repeat; transform-origin: var(--avp-ox, 80%) var(--avp-oy, 22%); animation: avp-crece 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.tel .avp-bloqueo[hidden] { display: none; }
.tel .avp-bloqueo::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8, 12, 30, 0.42), rgba(8, 12, 30, 0.2) 34%, rgba(8, 12, 30, 0.66)); pointer-events: none; }
.tel .avp-bloqueo > * { position: relative; }
.tel .avp-bloqueo.saliendo { animation: avp-achica 0.28s cubic-bezier(0.5, 0, 0.8, 0.5) both; pointer-events: none; }
@keyframes avp-crece { from { opacity: 0; transform: scale(0.1); border-radius: 80px; } }
@keyframes avp-achica { to { opacity: 0; transform: scale(0.1); border-radius: 80px; } }
.avp-bl-cab { display: flex; align-items: center; justify-content: space-between; padding: calc(var(--arriba) - 12px) 14px 0; }
.avp-bl-cerrar { appearance: none; cursor: pointer; position: relative; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.16); color: #fff; display: grid; place-items: center; }
.avp-bl-cerrar::before { content: ''; position: absolute; inset: -6px; }
.avp-bl-cerrar svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.avp-seg { display: inline-flex; padding: 2px; border-radius: 10px; background: rgba(255, 255, 255, 0.14); }
.avp-seg button { appearance: none; cursor: pointer; position: relative; min-width: 44px; padding: 6px 12px; border: 0; border-radius: 8px; background: none; color: rgba(255, 255, 255, 0.76); font: 600 13px/1.2 var(--avp-sis); transition: background 0.18s ease, color 0.18s ease; }
.avp-seg button::before { content: ''; position: absolute; inset: -8px 0; }
.avp-seg button[aria-pressed='true'] { background: rgba(255, 255, 255, 0.92); color: #10162e; }
.avp-bl-fecha { margin: 10px 0 0; text-align: center; font: 600 15px/1.2 var(--avp-sis); color: rgba(255, 255, 255, 0.86); }
.avp-bl-reloj { text-align: center; font: 600 72px/1.06 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.avp-bl-lista { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 7px; padding: 12px 10px 10px; scrollbar-width: none; }
.avp-bl-lista::-webkit-scrollbar { display: none; }
.avp-bloqueo .avp-nt { flex: none; grid-template-columns: 38px minmax(0, 1fr); padding: 11px 13px 12px; border-radius: 22px; background: rgba(30, 36, 62, 0.66); -webkit-backdrop-filter: blur(16px) saturate(1.3); backdrop-filter: blur(16px) saturate(1.3); }
.avp-bloqueo .avp-nt > i { width: 38px; height: 38px; }
.avp-bloqueo .avp-nt-cab b { font-size: 15px; }
.avp-bloqueo .avp-nt p { font-size: 15px; line-height: 1.3; }
.avp-nt.cae { animation: avp-cae 0.34s cubic-bezier(0.2, 0.9, 0.3, 1) backwards; animation-delay: calc(var(--i, 0) * 60ms + var(--espera, 0ms)); }
.avp-nt.se-va { animation: avp-se-va 0.22s ease forwards; }
@keyframes avp-cae { from { opacity: 0; transform: translateY(-16px) scale(0.97); } }
@keyframes avp-se-va { to { opacity: 0; transform: scale(0.96); } }
.avp-bl-nada { margin: auto; max-width: 240px; text-align: center; font: 400 14px/1.4 var(--avp-sis); color: rgba(255, 255, 255, 0.72); animation: avp-funde 0.3s ease both; }
.avp-bl-pie { margin: 0 12px calc(var(--abajo) + 8px); padding: 14px 18px 12px; border-radius: 22px; background: rgba(12, 16, 34, 0.76); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
.avp-bl-pie .avp-linea { margin: 0 6px; }
.avp-bl-pie .avp-linea-base { background: rgba(255, 255, 255, 0.2); }
.avp-bl-pie .avp-linea-hecha { background: rgba(255, 255, 255, 0.78); transition: none; }
.avp-bl-pie .avp-pt { pointer-events: none; }
.avp-bl-pie .avp-pt i { background: #141a36; border-color: rgba(255, 255, 255, 0.72); }
.avp-bl-pie .avp-pt.sono i { background: #fff; border-color: #fff; }
.avp-bl-pie .avp-pt.callo i { background: rgba(255, 255, 255, 0.5); border-color: transparent; }
.avp-bl-pie .avp-pt span { color: rgba(255, 255, 255, 0.62); }
.avp-pulgar { position: absolute; left: var(--ahora); top: 15px; width: 20px; height: 20px; margin: -10px 0 0 -10px; box-sizing: border-box; border-radius: 50%; border: 2px solid #fff; background: rgba(255, 255, 255, 0.24); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45); pointer-events: none; }
.avp-rango { position: absolute; left: -10px; top: -8px; width: calc(100% + 20px); height: 46px; margin: 0; opacity: 0; cursor: ew-resize; touch-action: pan-y; }
.avp-desliza { margin: 2px 0 0; text-align: center; font: 400 13px/1.3 var(--avp-sis); color: rgba(255, 255, 255, 0.64); }

/* ---------------- en Sueño: el chip de la deuda ---------------- */
.sueno.avp-sueno .sn-periodo, .sueno.avp-sueno .sn-pendientes { display: none; }
.sueno.avp-sueno .sn-deuda { position: relative; z-index: 2; }
.avp-deuda-pie { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 -4px; }
.avp-deuda-pie .sn-deuda-ver { min-height: 44px; margin: -4px 0; padding: 0; }
.avp-chip { appearance: none; cursor: pointer; display: grid; place-items: center; height: 44px; margin: -4px 0; padding: 0; border: 0; background: none; color: var(--sn-2); }
.avp-chip-caja { display: inline-flex; align-items: center; gap: 6px; box-sizing: border-box; height: 34px; padding: 0 13px 0 10px; border-radius: 999px; border: 1px solid rgba(150, 178, 240, 0.26); background: rgba(150, 178, 240, 0.07); font: 400 13px/1 var(--texto); white-space: nowrap; overflow: hidden; transition: width 0.3s cubic-bezier(0.2, 0.7, 0.2, 1), background 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.12s ease; }
.avp-chip:active .avp-chip-caja { transform: scale(0.97); }
.avp-chip[aria-pressed='true'] .avp-chip-caja { border-color: rgba(232, 196, 106, 0.5); background: rgba(232, 196, 106, 0.12); color: var(--oro-claro); }
.avp-chip-previa { position: absolute; right: -4px; top: calc(100% + 8px); width: min(306px, 100%); z-index: 4; pointer-events: none; transform-origin: 76% -14px; animation: avp-asoma 3.06s cubic-bezier(0.3, 0.7, 0.3, 1) both; }
/* Opaca: pasa por encima de la tarjeta de abajo y no deja ver su texto. */
.avp-chip-previa .avp-nt { background: #232a4c; border: 1px solid rgba(255, 255, 255, 0.07); box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5); }
.avp-chip-previa.sale { animation: avp-solo-sale 0.2s ease forwards; }
@keyframes avp-asoma { 0% { opacity: 0; transform: scale(0.3); } 9% { opacity: 1; transform: none; } 91% { opacity: 1; transform: none; } 100% { opacity: 0; transform: scale(0.3); } }

/* ---------------- en Sueño: tu plan de sueño ---------------- */
.sueno .pg-carta.avp-plan { background: linear-gradient(140deg, rgba(34, 44, 110, 0.5), rgba(18, 60, 74, 0.42)); border-color: rgba(150, 178, 240, 0.16); gap: 6px; }
.avp-plan.entra, .avp-de-dia.entra { transform-origin: 50% 0; animation: avp-carta 0.38s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
@keyframes avp-carta { from { opacity: 0; transform: scaleY(0.84) translateY(-6px); } }
.avp-plan .pg-carta-cab .avp-enlace, .avp-per-cab .avp-enlace { margin: -10px -6px -10px 0; }
.avp-per-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 22px; font: 400 13.5px/1.2 var(--texto); color: var(--sn-2); }
.avp-plan .sn-periodo-horas { margin-top: 2px; }
.avp-plan .sn-periodo-corrido { font-size: 13px; }
/* La noche en una línea, como la del periodo, con los pasos de la rutina encima; lo hecho la enciende. */
.avp-pista { position: relative; height: 36px; margin: 8px 4px 0; }
.avp-riel { position: absolute; left: 0; right: 0; top: 7px; height: 6px; border-radius: 3px; background: rgba(150, 178, 240, 0.12); overflow: hidden; }
.avp-riel i { position: absolute; top: 0; bottom: 0; }
.avp-riel .sube { background: linear-gradient(90deg, rgba(138, 219, 200, 0), rgba(138, 219, 200, 0.5)); }
.avp-riel .tramo { border-radius: 3px; background: linear-gradient(90deg, #8adbc8, #9fb6ff); transform-origin: left; }
.avp-plan.entra .avp-riel .tramo { animation: avp-tramo 0.7s 0.2s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; }
@keyframes avp-tramo { from { transform: scaleX(0); opacity: 0; } }
.avp-riel .hecho { left: var(--desde, 0%); width: var(--ancho, 0%); border-radius: 3px; background: var(--oro-claro); transition: width 0.26s ease, left 0.26s ease, opacity 0.3s ease; }
.avp-pista-pt { position: absolute; left: var(--x); top: 10px; width: 10px; height: 10px; margin: -5px 0 0 -5px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid rgba(214, 226, 250, 0.8); background: #1a2552; transition: background 0.16s ease, border-color 0.16s ease, opacity 0.3s ease, left 0.3s ease; }
.avp-pista-pt.hecho { background: var(--oro-claro); border-color: var(--oro-claro); }
.avp-plan.entra .avp-pista-pt { animation: avp-punto 0.36s cubic-bezier(0.2, 0.7, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 80ms + 0.36s); }
.avp-pista-hora { position: absolute; left: var(--x); top: 21px; transform: translateX(-50%); font: 400 13px/1 var(--numeros); color: var(--sn-3); font-variant-numeric: tabular-nums; white-space: nowrap; transition: opacity 0.3s ease; }
.avp-plan.sin-rutina .avp-pista-pt, .avp-plan.sin-rutina .avp-pista-hora, .avp-plan.sin-rutina .avp-riel .hecho { opacity: 0; }
.avp-rutina-etq { margin: 6px 0 0; font: 400 13px/1.3 var(--texto); color: var(--sn-2); font-variant-numeric: tabular-nums; }
.avp-pasos { list-style: none; margin: 2px 0 0 -11px; padding: 0; }
.avp-paso { display: grid; grid-template-columns: 44px 48px minmax(0, 1fr); align-items: center; min-height: 46px; }
.avp-tilde { appearance: none; cursor: pointer; width: 44px; height: 44px; padding: 0; border: 0; background: none; display: grid; place-items: center; }
.avp-tilde i { position: relative; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(214, 226, 250, 0.6); transition: background 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease; }
.tel .avp-tilde i svg { width: 13px; height: 13px; fill: none; stroke: #1a1608; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset 0.2s 0.05s ease; }
.avp-tilde[aria-pressed='true'] i { background: var(--oro-claro); box-shadow: none; }
.avp-tilde[aria-pressed='true'] i svg { stroke-dashoffset: 0; }
.avp-tilde:active i { transform: scale(0.88); }
.avp-paso time, .avp-nb time { font: 400 13.5px/1 var(--numeros); color: var(--sn-2); font-variant-numeric: tabular-nums; }
.avp-paso-nombre { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 44px; font: 400 15px/1.3 var(--texto); color: var(--tinta); text-align: left; transition: color 0.2s ease; }
.avp-paso-nombre > span { min-width: 0; text-wrap: pretty; }
.avp-paso.hecho .avp-paso-nombre, .avp-nb.hecho .avp-paso-nombre { color: rgba(239, 230, 207, 0.6); }
button.avp-paso-nombre { appearance: none; cursor: pointer; width: 100%; padding: 0; border: 0; background: none; }
button.avp-paso-nombre > svg:last-child { flex: none; width: 15px; height: 15px; margin-left: auto; color: var(--sn-3); }
button.avp-paso-nombre:active { opacity: 0.7; }
.avp-queda { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 44px; font: 400 14.5px/1.3 var(--texto); color: var(--sn-2); }
.avp-queda .avp-enlace { padding-right: 0; }
.avp-pista { transition: height 0.3s ease; }
.avp-plan.sin-rutina .avp-pista { height: 20px; }
.avp-plan-pie { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; padding-top: 4px; border-top: 1px solid var(--sn-linea); }
.avp-teavisa { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; min-height: 44px; padding: 0; border: 0; background: none; color: var(--sn-2); font: 400 13.5px/1.2 var(--texto); font-variant-numeric: tabular-nums; transition: opacity 0.15s ease; }
.avp-teavisa:active { opacity: 0.6; }
.avp-teavisa svg.avp-camp { width: 18px; height: 18px; }
.avp-plan-pie .avp-quieto { margin-right: -10px; color: var(--sn-3); font-size: 13.5px; }
.avp-plan-pie .avp-enlace { margin-left: -8px; }
.avp-plan-nota { margin: 0; font: 400 13px/1.45 var(--texto); color: var(--sn-3); text-wrap: pretty; }
.avp-plan > .avp-enlace { justify-self: start; margin: -10px 0 -10px -8px; }
/* De día, una fila; sin rutina todavía, la invitación a armarla. */
.avp-de-dia, .avp-armar-fila { appearance: none; cursor: pointer; display: grid; grid-template-columns: 32px minmax(0, 1fr) 18px; align-items: center; gap: 12px; width: 100%; text-align: left; color: var(--tinta); transition: transform 0.12s ease, background 0.2s ease; }
.avp-de-dia { margin-top: 12px; padding: 13px 12px 13px 14px; border-radius: 20px; border: 1px solid rgba(150, 178, 240, 0.16); background: linear-gradient(140deg, rgba(34, 44, 110, 0.44), rgba(18, 60, 74, 0.36)); }
.avp-armar-fila { margin-top: 4px; padding: 10px 2px 2px 0; border: 0; border-top: 1px solid var(--sn-linea); background: none; }
.avp-de-dia:active, .avp-armar-fila:active { transform: scale(0.985); }
.avp-de-dia .ico, .avp-armar-fila .ico { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: rgba(232, 196, 106, 0.12); color: var(--oro-claro); }
.avp-de-dia .ico svg, .avp-armar-fila .ico svg { width: 17px; height: 17px; }
.avp-de-dia > svg, .avp-armar-fila > svg { width: 16px; height: 16px; color: var(--sn-3); }
.avp-de-dia > span, .avp-armar-fila > span { display: grid; gap: 3px; min-width: 0; }
.avp-de-dia b, .avp-armar-fila b { font: 400 15px/1.25 var(--texto); }
.avp-de-dia small, .avp-armar-fila small { font: 400 13px/1.3 var(--texto); color: var(--sn-2); font-variant-numeric: tabular-nums; }
/* La noche entera (B): una línea vertical de la tarde al despertar. */
.avp-noche-sub { margin: -2px 0 2px; font: 400 14.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.9); }
.avp-noche { list-style: none; margin: 2px 0 0 -6px; padding: 0; }
.avp-nb { display: grid; grid-template-columns: 44px 44px minmax(0, 1fr) auto; align-items: center; min-height: 44px; }
.avp-nb time { justify-self: end; display: grid; gap: 15px; text-align: right; }
.avp-nb-nodo { position: relative; align-self: stretch; display: grid; place-items: center; min-height: 44px; }
.avp-nb-nodo::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: rgba(150, 178, 240, 0.3); transition: background 0.26s ease; transition-delay: calc(var(--i, 0) * 40ms); }
.avp-nb.marca .avp-nb-nodo::before { background: repeating-linear-gradient(180deg, rgba(150, 178, 240, 0.4) 0 3px, transparent 3px 7px); }
/* Lo hecho enciende la línea desde el primer paso hasta el más avanzado: de la mitad del primero a la mitad del último. */
.avp-nb.encendida .avp-nb-nodo::before { background: var(--oro-claro); }
.avp-nb.encendida.primera .avp-nb-nodo::before { background: linear-gradient(180deg, rgba(150, 178, 240, 0.3) 50%, var(--oro-claro) 50%); }
.avp-nb.llega .avp-nb-nodo::before { background: linear-gradient(180deg, var(--oro-claro) 50%, rgba(150, 178, 240, 0.3) 50%); }
.avp-nb.periodo .avp-nb-nodo::before { top: 6px; bottom: 6px; width: 6px; margin-left: -3px; border-radius: 3px; background: linear-gradient(180deg, #8adbc8, #9fb6ff); }
.avp-noche > li:first-child .avp-nb-nodo::before { top: 50%; }
.avp-noche > li:last-child .avp-nb-nodo::before { bottom: 50%; }
.avp-nb-nodo > .pto { position: relative; width: 7px; height: 7px; border-radius: 50%; background: #9fb2e6; box-shadow: 0 0 0 3px #17224c; }
.avp-nb-nodo .avp-tilde { position: relative; }
.avp-nb-nodo .avp-tilde i { background: #18234e; }
.avp-nb-nodo .avp-tilde[aria-pressed='true'] i { background: var(--oro-claro); }
/* «Ahora»: un aro que late despacio, unas veces y no para siempre. */
.avp-nb.ahora .avp-tilde i::after { content: ''; position: absolute; inset: -5px; border-radius: 50%; border: 1.5px solid rgba(246, 227, 166, 0.75); animation: avp-late 2.8s ease-in-out 10; }
@keyframes avp-late { 50% { transform: scale(1.24); opacity: 0.25; } }
.avp-nb-textos { display: grid; gap: 2px; min-width: 0; padding: 6px 0; font: 400 15px/1.3 var(--texto); color: var(--tinta); }
.avp-nb-textos > span { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.avp-nb-textos small { font: 400 13px/1.3 var(--texto); color: var(--sn-3); font-variant-numeric: tabular-nums; }
.avp-nb.marca .avp-nb-textos { color: var(--sn-2); font-size: 14px; }
.avp-nb.hecho .avp-nb-textos > span { color: rgba(239, 230, 207, 0.6); }
.avp-nb-camp { appearance: none; cursor: pointer; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: none; color: var(--sn-3); transition: color 0.2s ease, transform 0.12s ease; }
.avp-nb-camp[aria-pressed='true'] { color: var(--oro-claro); }
.avp-nb-camp:active { transform: scale(0.9); }

/* ---------------- las hojas del plan ---------------- */
.avp-seccion { margin-top: 20px; }
.avp-seccion:first-child { margin-top: 8px; }
.avp-seccion > .avp-etq { margin: 0 4px 10px; }
.avp-sub-etq { margin: 12px 4px 8px; font: 400 13px/1.2 var(--texto); color: rgba(239, 230, 207, 0.56); }
.avp-resumen { margin: 10px 4px 0; font: 400 14.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.9); font-variant-numeric: tabular-nums; text-wrap: pretty; }
.avp-resumen b { display: inline-block; font-weight: 500; color: #fbf2d9; }
.avp-info-dentro { padding-top: 12px; }
.avp-info { padding: 13px 14px; border-radius: 16px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(239, 230, 207, 0.04); display: grid; gap: 5px; }
.avp-info b { font: 500 14.5px/1.3 var(--texto); color: var(--tinta); font-variant-numeric: tabular-nums; }
.avp-info p { margin: 0; font: 400 13.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.78); text-wrap: pretty; font-variant-numeric: tabular-nums; }
.avp-info p.adelanta { color: var(--oro-claro); animation: avp-funde 0.36s 0.14s ease backwards; }
.avp-llaves { margin-top: 14px; }
.avp-llave-fila { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 50px; padding: 0 4px; font: 400 15px/1.3 var(--texto); color: var(--tinta); cursor: pointer; }
.avp-llave-fila + .avp-llave-fila { border-top: 1px solid rgba(239, 230, 207, 0.07); }
.avp-llave-fila .avp-llave { margin: 0; }
.avp-crear { appearance: none; cursor: pointer; width: 100%; height: 50px; margin-top: 14px; border: 0; border-radius: 999px; background: var(--oro-claro); color: #1a1608; font: 500 15.5px/1 var(--texto); transition: transform 0.12s ease; }
.avp-crear:active { transform: scale(0.98); }
.avp-margen-hoy { margin: 14px 4px 0; font: 400 14.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.92); font-variant-numeric: tabular-nums; }
.avp-margen-hoy b { display: inline-block; font-weight: 500; color: #fbf2d9; }

/* Con Reducir movimiento, solo fundidos: lo que entra aparece, lo que se va se apaga, y nada se mueve. Con !important
   porque varias reglas de arriba, y la de las hojas de la galería (.tel .hb), son más específicas. */
@media (prefers-reduced-motion: reduce) {
  .avp-pastilla, .avp-globo, .tel .hb.avp-hoja, .tel .avp-bloqueo, .avp-pt.entra, .avp-nt.cae, .avp-fila.abierta .avp-abre-dentro > .avp-nt, .avp-plan.entra, .avp-de-dia.entra,
  .avp-plan.entra .avp-riel .tramo, .avp-plan.entra .avp-pista-pt, .avp-cambia, .avp-bl-nada, .avp-info p.adelanta { animation-name: avp-solo-entra !important; animation-duration: 0.2s !important; animation-delay: 0s !important; animation-timing-function: ease !important; }
  .avp-globo.sale, .tel .hb.avp-hoja.saliendo, .tel .avp-bloqueo.saliendo, .avp-nt.se-va, .avp-chip-previa.sale { animation-name: avp-solo-sale !important; animation-duration: 0.2s !important; animation-delay: 0s !important; }
  .avp-chip-previa:not(.sale) { animation-name: avp-asoma-quieto !important; }
  .avp-nb.ahora .avp-tilde i::after { animation: none !important; }
  /* Lo que cambia de lugar, de tamaño o se dibuja (la tilde, la pista, las filas que se pliegan) cambia de una; los
     colores y los fundidos siguen. */
  .tel [class*='avp-'], .tel [class*='avp-'] *, .tel [class*='avp-']::before, .tel [class*='avp-']::after, .tel [class*='avp-'] *::before, .tel [class*='avp-'] *::after {
    transition-property: opacity, color, background-color, border-color, box-shadow, fill-opacity !important;
  }
  .tel [class*='avp-']:active, .tel .avp-tilde:active i, .tel .avp-chip:active .avp-chip-caja { transform: none !important; }
  .avp-avisos .avp-sub, .avp-avisos.en-sub .avp-lista { transform: none; }
}
@keyframes avp-solo-entra { from { opacity: 0; } }
@keyframes avp-solo-sale { to { opacity: 0; } }
@keyframes avp-asoma-quieto { 0% { opacity: 0; } 9% { opacity: 1; } 91% { opacity: 1; } 100% { opacity: 0; } }
`;

// La campanita, de línea fina: encendida (`on`), apagada o tachada (`sin`, sin permiso de iOS).
const campana = (estado) => `<svg class="avp-camp ${estado || ''}" viewBox="0 0 24 24" aria-hidden="true"><path class="cuerpo" d="M6.2 17.2h11.6c-.9-1-1.4-2.3-1.4-3.7v-3a4.4 4.4 0 0 0-8.8 0v3c0 1.4-.5 2.7-1.4 3.7z"/><path d="M10.3 19.6a1.8 1.8 0 0 0 3.4 0M12 6.1V4.9"/><path class="raya" d="M4.6 4.6l14.8 14.8"/></svg>`;
// Un hábito es una estrella.
const ESTRELLA = '<svg class="avp-estrella" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.7 5 3 7.8 9.5 9.5-6.5 1.7-8.8 4.5-9.5 9.5-.7-5-3-7.8-9.5-9.5C9 10.3 11.3 7.5 12 2.5z"/></svg>';
const TILDE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5.5 12.5 4.2 4.2L18.5 8"/></svg>';
const svg = (trazo) => `<svg viewBox="0 0 24 24" aria-hidden="true">${trazo}</svg>`;

Galeria.propuesta({
  id: 'avisosYPlan',
  titulo: 'Los avisos a la vista y tu plan de sueño',
  texto: 'Una campanita en Hábitos abre todos los avisos, cada uno con la hora a la que suena hoy. En Sueño, un plan para acostarte, en dos formas para elegir: con una rutina (A) o con la noche entera en una línea (B).',
  vistas: [['campanita', 'La campanita, en Hábitos'], ['avisos', 'Al tocar la campanita'], ['planNoche', 'El plan de sueño, con rutina (A)'], ['nocheEntera', 'El plan de sueño, la noche entera (B)']],
  mas: [
    ['avisosAbajo', 'Los avisos, más abajo'], ['fila', 'Al tocar un aviso'], ['comoSeVen', 'Cómo se ven en la pantalla bloqueada'],
    ['sinPermiso', 'Sin permiso para avisar'], ['chip', 'Prender el aviso desde la deuda de sueño'], ['planDia', 'El plan de sueño, de día'],
    ['sinRutina', 'El plan sin rutina todavía'], ['armar', 'Al armar la rutina'], ['margen', 'Cuánto antes acostarte'], ['en', 'En inglés'],
  ],
  principal: 0,
  crear(g) {
    g.estilo('avp-css', CSS);
    const tel = g.tel;
    const { sueno, perfil, comida } = g.secciones;
    const HOY = Datos.HOY;
    const LAS_18 = 18 * 60;
    const SEPARACION = 20;
    const MAXIMOS = [2, 3, 4, 6, 8, 10, 12];
    const COMIDAS = ['desayuno', 'almuerzo', 'merienda', 'cena'];
    const DE_MOSS = ['luz', 'tranquilo', 'ducha', 'habitacion', 'anotar'];
    // Los hábitos de la persona que se ofrecen para la rutina, con cuánto antes de dormirte va cada uno.
    const DE_NOCHE = { leer: 45, escribir: 30 };
    const quieto = () => g.movimientoReducido || !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const a5 = (m) => Math.round(m / 5) * 5;
    const despues = (ms, f) => setTimeout(f, quieto() ? 0 : ms);

    // Los textos: los de la app (tx) y los de la propuesta (t), en el idioma de la galería o en el que se pida
    // (la pantalla bloqueada cambia el suyo).
    const lenguas = {};
    function lengua(id) {
      if (lenguas[id]) return lenguas[id];
      const u = Util.crear(Object.assign({}, g.opciones, { idioma: () => id }));
      const crudo = (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TX[id] || TX.es);
      const t = (clave, vars) => { const v = crudo(clave); return typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : '')) : clave; };
      return (lenguas[id] = { id, u, tx: u.tx, t, crudo });
    }
    const L = () => lengua(g.idioma === 'en' ? 'en' : 'es');
    const { el, boton, icono } = lengua('es').u;
    const hora = (m) => lengua('es').u.horaMin(Math.round(m));
    /** Cambia un texto (y su clase, si se da) con un fundido, solo si cambió; `deUna`, al armar, sin fundido. */
    function decirEn(nodo, texto, clase, deUna) {
      const igual = nodo.textContent === texto;
      if (clase !== undefined && nodo.className.replace(' avp-cambia', '') !== clase) nodo.className = clase;
      if (igual) return;
      nodo.textContent = texto;
      if (deUna) return;
      nodo.classList.remove('avp-cambia');
      void nodo.offsetWidth;
      nodo.classList.add('avp-cambia');
    }

    // ------------------------------------------------------------ la persona y lo elegido
    const HABITOS = Datos.HABITOS;
    const habito = (id) => HABITOS.find((x) => x.id === id);
    const nombreDeHabito = (id, l) => { const x = habito(id); return x ? x.nombre[l.id] || x.nombre.es || x.nombre : id; };
    const hoySemana = Fechas.diaDeLaSemana(HOY);
    const tocaHoy = (id) => { const x = habito(id); return !!x && x.dias.includes(hoySemana); };
    const diaDelControl = Fechas.diaDeLaSemana(Datos.INICIO);
    const esControl = diaDelControl === hoySemana;
    // Cuántos días faltan para el próximo entreno (1 es mañana).
    const diasAlProximoEntreno = () => { const e = Datos.PERFIL.entreno; for (let k = 1; k <= 7; k++) if (e && e.dias.includes((hoySemana + k) % 7)) return k; return 1; };
    // El margen para dormirte que eligió la persona (Perfil › Avisos o Sueño › Afinar): se lee al abrir la propuesta y
    // vuelve al cerrarla. `margenPropio`, el que puso «Cuánto antes te acuestas» mientras tanto.
    let latenciaDeAntes = perfil.latencia;
    let margenPropio;
    // Lo encendido hoy en el cielo de la galería, el mismo de Hábitos: un hábito hecho no avisa.
    const hechoEnElCielo = (id) => {
      const x = habito(id);
      const nombres = x ? Object.values(x.nombre) : [];
      return [...tel.querySelectorAll('.etiquetas .etq.encendida .etq-nombre span')].some((n) => nombres.includes(n.textContent));
    };
    // Un paso del plan está hecho si lo tildaste; uno de tus hábitos, si su estrella está encendida.
    const estaHecho = (x) => (x.habito ? hechoEnElCielo(x.id) : s.hechos.has(x.id));
    /** Marcarlo en el plan es marcar su estrella, por el mismo camino que un toque en el cielo: el primero muestra su
     *  nombre y el segundo lo cambia (si el nombre ya estaba a la vista, alcanza uno). */
    function marcarEnElCielo(id, si) {
      if (typeof window.__tocar !== 'function' || hechoEnElCielo(id) === si) return;
      // El cielo atiende toques solo con Hábitos a la vista: se pasa a Hábitos y se vuelve en el mismo momento, antes de
      // que se dibuje nada (la galería no tiene otro camino para marcar un hábito; en la app es el mismo dato).
      const desde = g.pestana, foco = document.activeElement;
      if (desde !== 4) g.irA(4, true);
      const nombre = nombreDeHabito(id, L());
      for (let k = 0; k < 2 && hechoEnElCielo(id) !== si; k++) window.__tocar(nombre);
      if (desde !== 4) g.irA(desde, true);
      if (foco && foco.isConnected && foco !== document.activeElement) foco.focus({ preventScroll: true });
    }

    /** Como llega quien abre la propuesta: lo que está prendido de fábrica y una rutina ya armada. */
    function deFabrica() {
      return {
        permiso: 'ok', visto: false, ahora: Datos.AHORA_MIN, maximo: 10,
        av: { deuda: true, pesarte: false, pendientes: false, anotar: true, falta: false, cafe: false, antesDeEntrenar: false, plan: true, ultimaComida: false },
        // Lo que venía prendido de antes de hoy; lo demás, desde el minuto en que se prende: antes de esa hora no sonó.
        deAntes: { deuda: true, anotar: true, plan: true }, desde: {},
        comidas: ['desayuno', 'almuerzo', 'cena'], pesarte: 'control', paraTi: true,
        habitos: {
          leer: { prendido: true, cuando: { tipo: 'dormir', antes: 45 } },
          pasos: { prendido: true, cuando: { tipo: 'hora', minutos: 18 * 60 } },
          meditar: { prendido: true, cuando: { tipo: 'despertar', despues: 15 } },
        },
        abierta: null, elegido: null,
        rutina: { creada: true, antes: 60, pasos: ['luz', 'tranquilo', 'anotar'], alAcostarme: false },
        margen: SinReloj.margenParaDormirte(latenciaDeAntes), hechos: new Set(), estaNocheNo: false, deNoche: true, variante: 'a', campanas: {},
      };
    }
    let s = deFabrica();
    function prender(id, si) {
      s.av[id] = si;
      if (si && !s.deAntes[id]) s.desde[id] = s.ahora; else delete s.desde[id];
    }

    // ------------------------------------------------------------ las horas de hoy
    // Tu periodo de melatonina, el de la tarjeta de Sueño: con sus noches y el margen elegido. Si no alcanzan las
    // noches, el del ejemplo del diseño (23:30 – 00:30).
    function periodo() {
      let noches = [];
      try { noches = sueno.noches(); } catch (_) { /* quedan las de la persona */ }
      const op = { margen: s.margen };
      return Melatonina.periodoDeMelatonina(noches.length ? noches : Datos.NOCHES, HOY, op) || Melatonina.periodoDeMelatonina(Datos.NOCHES, HOY, op)
        || { inicio: 210, desde: 330, hasta: 390, corrido: -9, acostarse: a5(330 - s.margen), conDeuda: false, noches: 7 };
    }
    /** Todo en minutos del día: P y F, tu periodo; C, tu hora de acostarte; y cuándo empieza la rutina. */
    function horas(r = s.rutina) {
      const p = periodo();
      const P = p.desde + LAS_18, C = p.acostarse + LAS_18;
      let despertar = 7 * 60 + 15, deSiempre = 7 * 60 + 5;
      try {
        const anoche = sueno.anoche();
        if (anoche) despertar = anoche.despertar - 24 * 60;
        const habitual = SinReloj.habitualDe(sueno.noches(), Fechas.sumarDias(HOY, 1));
        if (habitual) deSiempre = a5(habitual.despertar + LAS_18 - 24 * 60);
      } catch (_) { /* queda el ejemplo */ }
      // La rutina empieza al menos un cuarto de hora antes de acostarte; la ducha, hora y media antes, la adelanta.
      const base = Math.min(P - r.antes, C - 15);
      const inicio = r.creada ? Math.min(base, r.pasos.includes('ducha') ? C - 90 : base) : P - 60;
      return { p, P, F: p.hasta + LAS_18, sube: p.inicio + LAS_18, C, despertar, deSiempre, base, inicio };
    }
    const habitosDeLaRutina = () => Object.keys(s.habitos).filter((id) => s.habitos[id].prendido && s.habitos[id].cuando.tipo === 'dormir' && tocaHoy(id));
    const antesDe = (id) => (s.habitos[id] && s.habitos[id].cuando.tipo === 'dormir' ? s.habitos[id].cuando.antes : DE_NOCHE[id] || 30);
    /** Los pasos de esta noche, en orden: lo de Moss que elegiste, tus hábitos de antes de dormir y tu hora de acostarte. */
    function pasosDeHoy(h, r = s.rutina, deNoche = habitosDeLaRutina()) {
      const lista = [];
      if (r.pasos.includes('ducha')) lista.push({ id: 'ducha', min: h.C - 90 });
      if (r.pasos.includes('luz') || r.pasos.includes('tranquilo')) lista.push({ id: 'comienzo', min: h.base });
      // Un hábito de antes de dormir va a su hora, pero siempre dentro de la rutina: después del comienzo y antes de acostarte.
      deNoche.forEach((id) => lista.push({ id, habito: true, min: Math.min(h.C - 10, Math.max(h.base, h.P - antesDe(id))) }));
      if (r.pasos.includes('habitacion')) lista.push({ id: 'habitacion', min: Math.max(h.base, h.C - 15) });
      if (r.pasos.includes('anotar')) lista.push({ id: 'anotar', min: Math.max(h.base, h.C - 5) });
      lista.push({ id: 'cama', min: h.C });
      return lista.map((x, i) => Object.assign(x, { i })).sort((a, b) => a.min - b.min || a.i - b.i);
    }
    function nombreDePaso(x, l, r = s.rutina) {
      if (x.habito) return nombreDeHabito(x.id, l);
      if (x.id === 'comienzo') return l.t('pasos.' + (r.pasos.includes('luz') && r.pasos.includes('tranquilo') ? 'luzYTranquilo' : r.pasos.includes('luz') ? 'luz' : 'tranquilo'));
      return l.t('pasos.' + x.id);
    }

    // ------------------------------------------------------------ lo que dice cada aviso
    /** Con las palabras de la app (Avisos.tituloDelAviso y textoDelAviso). */
    function decir(l, aviso, min) {
      const n = { dia: HOY, minutos: min || 0, aviso: Object.assign({ id: 'x', minutos: min || 0 }, aviso) };
      const para = { t: l.tx, habito: (id) => nombreDeHabito(id, l), plan: () => '', duracion: l.u.duracion };
      return { titulo: Avisos.tituloDelAviso(n, para), texto: Avisos.textoDelAviso(n, para) };
    }
    /** La deuda de hoy y la de ayer, a la media hora, como la tarjeta de Sueño. */
    function deudas() {
      try {
        const noches = sueno.noches();
        const necesidad = Sueno.necesidad(Number(HOY.slice(0, 4)) - Datos.PERFIL.nacimiento, perfil.necesidad);
        const de = (hasta) => { const d = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, hasta, 14), necesidad); return d ? Sueno.redondearDeuda(d.minutos) : null; };
        const ahora = de(HOY);
        if (ahora !== null) return { ahora, antes: de(Fechas.sumarDias(HOY, -1)) };
      } catch (_) { /* con otra forma de las noches, el ejemplo */ }
      return { ahora: 90, antes: 120 };
    }
    const pendientes = (l) => Periodo.pendientes.items().filter((x) => !x.hecho).map((x) => Periodo.pendientes.textoDe(x, l.u));
    /** El aviso de la noche, uno solo: cuánto falta para tu periodo y, con rutina, por dónde empezar. */
    function avisoDelPlan(l, h, r = s.rutina, deNoche = habitosDeLaRutina()) {
      const falta = Math.max(5, a5(h.P - h.inicio));
      const cuanto = l.crudo('aviso.falta.' + falta) || (falta < 60 ? l.t('aviso.falta.minutos', { n: falta }) : l.t('aviso.falta.horas', { h: Math.floor(falta / 60), m: String(falta % 60).padStart(2, '0') }));
      const titulo = l.t(Avisos.esALaUna(h.P) ? 'aviso.tituloALaUna' : 'aviso.titulo', { cuanto, P: hora(h.P) });
      if (!r.creada) return { titulo, texto: l.t('aviso.sinRutina', { P: hora(h.P) }) };
      const corto = (x) => {
        if (!x.habito) return l.t('cortos.' + (x.id === 'comienzo' ? (r.pasos.includes('luz') ? 'luz' : 'tranquilo') : x.id));
        const nombre = nombreDeHabito(x.id, l);
        return l.crudo('cortos.' + x.id) || nombre.charAt(0).toLowerCase() + nombre.slice(1);
      };
      // Los dos primeros alcanzan: el aviso es corto. Lo que ya hiciste no lo nombra.
      const lista = pasosDeHoy(h, r, deNoche).filter((x) => x.id !== 'cama' && !estaHecho(x)).map(corto).slice(0, 2).join(', ');
      return { titulo, texto: l.t(lista ? 'aviso.conRutina' : 'aviso.soloCama', { P: hora(h.P), C: hora(h.C), lista }) };
    }
    // Antes de entrenar: media hora antes de la comida que queda al menos una hora antes de salir.
    function antesDeEntrenar() {
      const e = Datos.PERFIL.entreno;
      if (!e || !e.dias.includes(hoySemana)) return null;
      const horario = Datos.PERFIL.horarios;
      const c = [...COMIDAS].reverse().find((x) => horario[x] <= e.hora - (e.viaje || 0) - 60);
      return c ? { comida: c, a: horario[c], min: horario[c] - 30 } : null;
    }
    /** Lo que diría hoy cada aviso y a qué hora: para sonar y para la vista de su fila, prendida o no. */
    function loQueDice(id, l, h, cual) {
      const con = (min, dice) => Object.assign({ min }, dice);
      switch (id) {
        case 'deuda': { const d = deudas(); return con(h.despertar, decir(l, { tipo: 'deuda', despertar: { que: 'deuda', ahora: d.ahora, antes: d.antes } })); }
        case 'pesarte': {
          // Solo el día del control, y hoy no es: se ve como llega ese día y, en lugar de la hora, el día.
          const otroDia = s.pesarte === 'control' && !esControl;
          const dice = con(h.despertar + 10, decir(l, esControl || otroDia ? { tipo: 'pesarse', control: true } : { tipo: 'pesarse' }));
          return otroDia ? Object.assign(dice, { cuando: l.tx('fecha.dias.' + diaDelControl) }) : dice;
        }
        case 'pendientes': return con(h.despertar + SEPARACION, decir(l, { tipo: 'pendientes', despertar: { que: 'pendientes', lista: pendientes(l) } }));
        case 'anotar': return con(Datos.PERFIL.horarios[cual] + 45, decir(l, { tipo: 'comida', comida: cual }));
        case 'falta': return con(18 * 60 + 30, decir(l, { tipo: 'falta', falta: { que: 'proteina', cuanto: 40, ideas: [{ id: 'yogurGriego' }, { id: 'huevos' }], alcanza: true, forma: 0 } }));
        case 'cafe': return con(h.C - 9 * 60, decir(l, { tipo: 'cafe', conviene: { que: 'cafe', forma: 'ultimo', a: h.C - 9 * 60, cama: h.C, periodo: h.P } }));
        case 'antesDeEntrenar': { const e = antesDeEntrenar(); return e ? con(e.min, decir(l, { tipo: 'antesDeEntrenar', conviene: { que: 'antesDeEntrenar', comida: e.comida, a: e.a, proteina: 25, carbohidratos: 75 } })) : null; }
        case 'plan': return con(h.inicio, avisoDelPlan(l, h));
        case 'cama': return con(h.C - 15, decir(l, { tipo: 'dormir', dormirA: h.C, periodo: { desde: h.P, hasta: h.F } }, h.C - 15));
        case 'ultimaComida': return con(h.C - 120, decir(l, { tipo: 'ultimaComida', conviene: { que: 'ultimaComida', a: h.C - 120, cama: h.C } }));
        default: return null;
      }
    }
    const horaDelHabito = (id, h) => { const c = s.habitos[id].cuando; return c.tipo === 'hora' ? c.minutos : c.tipo === 'despertar' ? h.despertar + c.despues : h.P - c.antes; };
    // Con la rutina y su aviso, un hábito de antes de dormir no suena aparte: va adentro.
    const enElPlan = (id) => s.av.plan && s.rutina.creada && !s.estaNocheNo && s.habitos[id].cuando.tipo === 'dormir';

    // ------------------------------------------------------------ qué suena hoy (la regla, corta y de mentira)
    // Cada aviso prendido que toca hoy, a su hora; entre uno y otro, al menos 20 minutos (el de la noche no se corre);
    // y si pasan del máximo, quedan los primeros: el plan, la deuda, tus hábitos y las comidas. `calla`: llega su hora
    // y no suena, porque ya lo hiciste.
    const PRIORIDAD = { plan: 1, deuda: 2, habito: 3, anotar: 4, pesarte: 5, pendientes: 6, cama: 7, antesDeEntrenar: 8, cafe: 8.1, ultimaComida: 8.2, falta: 8.3 };
    const DE_COMIDA = { cena: 0, almuerzo: 0.1, desayuno: 0.2, merienda: 0.3 };
    function agenda(l, h = horas()) {
      const todos = [];
      const sumar = (fila, id, prio, nombre, dice, mas) => {
        if (!dice || (s.desde[fila] != null && dice.min < s.desde[fila])) return;
        todos.push(Object.assign({ id, fila, prio, nombre, min: dice.min, titulo: dice.titulo, texto: dice.texto }, mas));
      };
      if (s.permiso === 'ok') {
        let anotadas = {};
        try { comida.comidasDeHoy().forEach((c) => { anotadas[c.tipo] = Math.min(c.hora, anotadas[c.tipo] == null ? Infinity : anotadas[c.tipo]); }); } catch (_) { anotadas = {}; }
        if (s.av.deuda) sumar('deuda', 'deuda', PRIORIDAD.deuda, l.tx('perfil.avisos.deuda'), loQueDice('deuda', l, h));
        if (s.av.pesarte && (s.pesarte === 'todos' || esControl)) sumar('pesarte', 'pesarte', PRIORIDAD.pesarte, l.t('filas.pesarte'), loQueDice('pesarte', l, h));
        if (s.av.pendientes && pendientes(l).length) sumar('pendientes', 'pendientes', PRIORIDAD.pendientes, l.tx('recordatorios.despertar.pendientes.titulo'), loQueDice('pendientes', l, h));
        if (s.av.anotar) {
          COMIDAS.filter((c) => s.comidas.includes(c)).forEach((c) => {
            const dice = loQueDice('anotar', l, h, c);
            sumar('anotar', 'anotar:' + c, PRIORIDAD.anotar + DE_COMIDA[c], l.t('puntos.anotar', { comida: l.t('comidas.' + c) }), dice, { comida: c, calla: anotadas[c] != null && anotadas[c] <= dice.min ? 'anotado' : null });
          });
        }
        ['falta', 'cafe', 'antesDeEntrenar', 'ultimaComida'].forEach((id) => { if (s.av[id]) sumar(id, id, PRIORIDAD[id], l.tx('perfil.avisos.' + id), loQueDice(id, l, h)); });
        if (s.av.plan && !(s.rutina.creada && s.estaNocheNo)) sumar('plan', 'plan', PRIORIDAD.plan, l.t('filas.plan'), loQueDice('plan', l, h), { fijo: true });
        if (s.rutina.creada && s.rutina.alAcostarme && !s.estaNocheNo) sumar('cama', 'cama', PRIORIDAD.cama, l.t('pasos.cama'), loQueDice('cama', l, h), { fijo: true });
        // En la noche entera (B), cada paso puede llevar su campanita.
        if (s.rutina.creada && !s.estaNocheNo) {
          pasosDeHoy(h).filter((x) => s.campanas[x.id]).forEach((x) => { const nombre = nombreDePaso(x, l); todos.push({ id: 'paso:' + x.id, fila: 'paso', prio: PRIORIDAD.cama + 0.5, nombre, min: x.min, titulo: 'Moss', texto: nombre, fijo: true }); });
        }
        Object.keys(s.habitos).forEach((id) => {
          const a = s.habitos[id];
          if (!a.prendido || !tocaHoy(id) || enElPlan(id)) return;
          const min = horaDelHabito(id, h);
          if (a.desde != null && min < a.desde) return;
          const nombre = nombreDeHabito(id, l);
          todos.push({ id: 'habito:' + id, fila: 'habito:' + id, prio: PRIORIDAD.habito, nombre, min, titulo: 'Moss', texto: nombre, calla: hechoEnElCielo(id) ? 'hecho' : null });
        });
      }
      // Lo que no va a sonar (ya lo hiciste) no ocupa lugar ni corre a los demás: queda en la línea, apagado.
      const callados = todos.filter((a) => a.calla), suenan = todos.filter((a) => !a.calla);
      // Entre uno y otro, 20 minutos; lo que cae cerca de uno fijo se corre para después de él.
      suenan.sort((a, b) => a.min - b.min || a.prio - b.prio);
      const fijos = suenan.filter((a) => a.fijo).map((a) => a.min);
      let ultimo = -Infinity;
      suenan.forEach((a) => {
        if (!a.fijo) {
          a.min = Math.max(a.min, ultimo + SEPARACION);
          fijos.forEach((f) => { if (Math.abs(a.min - f) < SEPARACION) a.min = f + SEPARACION; });
        }
        ultimo = Math.max(ultimo, a.min);
      });
      const entran = new Set([...suenan].sort((a, b) => a.prio - b.prio || a.min - b.min).slice(0, s.maximo));
      const lista = [...suenan.filter((a) => entran.has(a)), ...callados].sort((a, b) => a.min - b.min);
      return { h, lista, fuera: suenan.filter((a) => !entran.has(a)) };
    }
    const estadoDe = (a, ahora) => (a.calla ? 'callo' : a.min > ahora ? 'sigue' : 'sono');
    // Lo que cuenta para «Hasta n hoy» y para el máximo: lo que suena.
    const queSuenan = (ag) => ag.lista.filter((a) => !a.calla);

    // ------------------------------------------------------------ la línea del día
    // Cada punto va en proporción a su hora, pero nunca a menos de 46 px del anterior: así se leen las horas y cada
    // punto se toca entero (44 px). Devuelve
    // dónde cae cada uno y cómo pasar de una hora a su lugar y al revés (para «ahora» y para deslizar).
    const ENTRE_PUNTOS = 46;
    function acomodar(avisos, ancho, h) {
      const mins = avisos.map((a) => a.min);
      const desde = Math.min(h.despertar, ...mins) - 30, hasta = Math.max(h.P, ...mins) + 25;
      const sep = Math.min(ENTRE_PUNTOS, avisos.length > 1 ? ancho / (avisos.length - 1) : ENTRE_PUNTOS);
      const x = mins.map((m) => ((m - desde) / (hasta - desde)) * ancho);
      for (let i = 1; i < x.length; i++) x[i] = Math.max(x[i], x[i - 1] + sep);
      if (x.length && x[x.length - 1] > ancho) { x[x.length - 1] = ancho; for (let i = x.length - 2; i >= 0; i--) x[i] = Math.min(x[i], x[i + 1] - sep); }
      const nudos = [[desde, 0], ...mins.map((m, i) => [m, Math.max(0, x[i])]), [hasta, ancho]];
      const entre = (v, de, a) => {
        if (v <= nudos[0][de]) return nudos[0][a];
        for (let i = 1; i < nudos.length; i++) {
          if (v > nudos[i][de]) continue;
          const p = nudos[i - 1], q = nudos[i];
          return q[de] === p[de] ? q[a] : p[a] + ((v - p[de]) / (q[de] - p[de])) * (q[a] - p[a]);
        }
        return nudos[nudos.length - 1][a];
      };
      return { x: x.map((v) => Math.max(0, v)), desde, hasta, apretada: sep < ENTRE_PUNTOS - 4, aX: (m) => entre(m, 0, 1), aMin: (px) => entre(px, 1, 0) };
    }
    /** Pinta (o pone al día) una línea: los puntos que entran, entran; los que se van, se van. */
    function pintarLinea(caja, ag, ahora, op = {}) {
      if (!caja._pts) { caja._pts = new Map(); caja.append(el('i', 'avp-linea-base'), el('i', 'avp-linea-hecha'), el('i', 'avp-linea-ahora')); }
      const geo = acomodar(ag.lista, Math.max(160, caja.clientWidth || op.ancho || tel.clientWidth - 68), ag.h);
      const vivos = new Set(ag.lista.map((a) => a.id));
      caja._pts.forEach((n, id) => {
        if (vivos.has(id)) return;
        caja._pts.delete(id);
        n.classList.add('sale');
        despues(260, () => n.remove());
      });
      ag.lista.forEach((a, i) => {
        let n = caja._pts.get(a.id);
        if (!n) {
          n = boton('avp-pt entra', '<i></i><span></span>', () => op.alTocar && op.alTocar(a.id));
          n.style.setProperty('--i', i);
          if (op.espera != null) n.style.setProperty('--espera', op.espera + 'ms');
          n.addEventListener('animationend', () => n.classList.remove('entra'), { once: true });
          caja._pts.set(a.id, n);
          caja.appendChild(n);
        }
        n.style.setProperty('--x', geo.x[i].toFixed(1) + 'px');
        // Con muchos avisos, las horas no entran todas: una sí y una no, y siempre la última.
        n.querySelector('span').textContent = geo.apretada && i % 2 && i !== ag.lista.length - 1 ? '' : hora(a.min);
        const e = estadoDe(a, ahora);
        ['sono', 'callo', 'sigue'].forEach((c) => n.classList.toggle(c, c === e));
        n.classList.toggle('elegido', op.elegido === a.id);
        n.setAttribute('aria-label', (op.l || L()).t('punto.' + e, { hora: hora(a.min), nombre: a.nombre }));
      });
      caja.style.setProperty('--ahora', geo.aX(ahora).toFixed(1) + 'px');
      return geo;
    }
    /** Un aviso como lo dibuja iOS: el ícono de Moss, el título, la hora y lo que dice. */
    function notificacion(a, clase) {
      const n = el('article', 'avp-nt' + (clase ? ' ' + clase : ''));
      const ic = el('i');
      if (typeof TIENDA !== 'undefined' && TIENDA && TIENDA.icono) ic.style.backgroundImage = `url(${TIENDA.icono})`;
      const cab = el('div', 'avp-nt-cab');
      cab.append(el('b', null, a.titulo), el('em', null, a.hora));
      n.append(ic, cab, el('p', null, a.texto));
      return n;
    }
    function ponerNotificacion(n, a) {
      n.querySelector('.avp-nt-cab b').textContent = a.titulo;
      n.querySelector('.avp-nt-cab em').textContent = a.hora;
      n.querySelector('p').textContent = a.texto;
    }
    /** Una llave: `alCambiar(si)` cambia lo elegido, y el toque no abre la fila que la lleva. */
    function llave(prendida, nombre, alCambiar) {
      const b = boton('avp-llave', '<i></i>', () => { const si = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(si)); g.haptico('suave'); alCambiar(si); }, nombre);
      b.setAttribute('aria-pressed', String(!!prendida));
      return b;
    }
    /** Una píldora que se elige. */
    function pildora(texto, elegida, alTocar, conEstrella) {
      const b = boton('avp-pildora', (conEstrella ? ESTRELLA : '') + '<span></span>', alTocar);
      b.querySelector('span').textContent = texto;
      b.setAttribute('aria-pressed', String(!!elegida));
      return b;
    }

    const conTexto = (clase, texto, alTocar, etiqueta) => { const b = boton(clase, '', alTocar, etiqueta); b.textContent = texto; return b; };
    /** Todo lo de la propuesta que está a la vista se pone al día: la hoja, la campanita, el chip y el plan. */
    function alCambiar() {
      refrescarAvisos();
      pintarCampana();
      pintarChip();
      pintarPlan();
    }

    // ------------------------------------------------------------ la campanita, en Hábitos
    // Va en la capa de Hábitos (.ui), que la tira corre con su página, como «Tu mes» y el «+» de arriba.
    const capaDeHabitos = tel.querySelector('.ui');
    let pastilla = null;
    let cuadro = 0;
    let tiempoDelGlobo = 0;
    function montarCampana() {
      if (pastilla || !capaDeHabitos) return;
      const caja = el('div', 'avp-campana');
      const b = boton('avp-pastilla', `${campana('on')}<span></span><i class="avp-punto"></i>`, () => abrirAvisos({ desde: b }));
      caja.appendChild(b);
      capaDeHabitos.appendChild(caja);
      pastilla = { caja, b, globo: null };
      // Es de la zona de hoy: se va con la cabecera cuando la cámara sube a tu universo, y se mueve con la frase.
      const cab = capaDeHabitos.querySelector('.cab'), frase = capaDeHabitos.querySelector('.frase');
      const seguir = () => {
        if (!pastilla) return;
        const opacidad = cab ? cab.style.opacity : '';
        if (caja.style.opacity !== opacidad) { caja.style.opacity = opacidad; caja.classList.toggle('fuera', opacidad !== '' && Number(opacidad) < 0.4); }
        const corrida = frase ? frase.style.transform : '';
        if (caja.style.transform !== corrida) caja.style.transform = corrida;
        cuadro = requestAnimationFrame(seguir);
      };
      cuadro = requestAnimationFrame(seguir);
      pintarCampana();
    }
    function pintarCampana() {
      if (!pastilla) return;
      const b = pastilla.b, l = L();
      b.querySelector('span').textContent = l.t('titulo');
      const dibujo = b.querySelector('.avp-camp');
      dibujo.classList.toggle('on', s.permiso === 'ok');
      dibujo.classList.toggle('sin', s.permiso !== 'ok');
      // El punto, sin número y sin parpadear, hasta que se abre Avisos por primera vez.
      b.classList.toggle('visto', s.visto);
      if (pastilla.globo) { pastilla.globo.textContent = l.t('globo'); medirGlobo(); }
    }
    // El globo no se sale de la pantalla: a lo sumo, lo que queda a la izquierda de la campanita (en inglés y en un
    // iPhone chico, la pastilla es más ancha y deja menos).
    function medirGlobo() {
      const libre = pastilla.caja.offsetLeft - 8 - 16;
      pastilla.globo.style.maxWidth = `${Math.max(120, Math.min(222, libre))}px`;
    }
    /** El globo de la primera vez: crece desde la campanita y se va solo a los 6 s, o al tocarlo. */
    function ponerGlobo() {
      quitarGlobo(true);
      if (!pastilla) return;
      const globo = conTexto('avp-globo', L().t('globo'), () => quitarGlobo());
      pastilla.caja.prepend(globo);
      pastilla.globo = globo;
      medirGlobo();
      tiempoDelGlobo = setTimeout(() => quitarGlobo(), 6840);
    }
    function quitarGlobo(deUna) {
      clearTimeout(tiempoDelGlobo);
      const globo = pastilla && pastilla.globo;
      if (!globo) return;
      pastilla.globo = null;
      if (deUna || quieto()) { globo.remove(); return; }
      globo.classList.add('sale');
      setTimeout(() => globo.remove(), 280);
    }
    function desmontarCampana() {
      if (!pastilla) return;
      cancelAnimationFrame(cuadro);
      clearTimeout(tiempoDelGlobo);
      const caja = pastilla.caja;
      pastilla = null;
      caja.classList.add('fuera');
      despues(260, () => caja.remove());
    }

    // ------------------------------------------------------------ Avisos: una sola hoja, la misma desde cualquier puerta
    const ICONOS_DE_HABITOS = typeof SeccionHabitos !== 'undefined' ? SeccionHabitos.ICONOS : {};
    const ICONO = {
      deuda: Util.ICONOS.sueno, pesarte: Util.ICONOS.balanza, pendientes: ICONOS_DE_HABITOS['list.bullet'], anotar: Util.ICONOS.comida, falta: Util.ICONOS.objetivo,
      cafe: ICONOS_DE_HABITOS['cup.and.saucer'], antesDeEntrenar: Util.ICONOS.pesa, plan: ICONOS_DE_HABITOS['bed.double'] || Util.ICONOS.sueno, ultimaComida: Util.ICONOS.reloj,
    };
    const GRUPOS = [['manana', ['deuda', 'pesarte', 'pendientes']], ['comidas', ['anotar', 'falta']], ['tarde', ['cafe', 'antesDeEntrenar']], ['noche', ['plan', 'ultimaComida']]];
    // Lo que explica cada aviso al abrir su fila: las palabras de Perfil › Avisos, que ya están en la app.
    const EXPLICA = { deuda: 'deudaTexto', pesarte: 'pesarseTexto', pendientes: 'descargaTexto', falta: 'faltaTexto', cafe: 'cafeTexto', antesDeEntrenar: 'antesDeEntrenarTexto', ultimaComida: 'ultimaComidaTexto' };
    const nombreDeFila = (id, l) => l.crudo('filas.' + id) || (id === 'pendientes' ? l.tx('recordatorios.despertar.pendientes.titulo') : l.tx('perfil.avisos.' + id));
    const hojaAvisos = Util.hoja(tel, 'avp-hoja avp-avisos', () => { s.abierta = null; s.elegido = null; });
    let av = null;

    function abrirAvisos(op = {}) {
      quitarGlobo();
      s.visto = true;
      pintarCampana();
      // Crece desde la puerta por la que se entra: la campanita, o el aviso del plan en Sueño.
      const puerta = op.desde ? op.desde.getBoundingClientRect() : null;
      const marco = tel.getBoundingClientRect();
      hojaAvisos.el.style.setProperty('--avp-ox', puerta && puerta.width ? `${(((puerta.left + puerta.width / 2 - marco.left) / marco.width) * 100).toFixed(1)}%` : '82%');
      av = null;
      pintarAvisos();
      hojaAvisos.abrir();
      if (op.a) irAGrupo(op.a, true);
    }
    function irAGrupo(clave, deUna) {
      if (!av || !av.grupos[clave]) return;
      av.lista.scrollTo({ top: Math.max(0, av.grupos[clave].offsetTop - 10), behavior: deUna || quieto() ? 'auto' : 'smooth' });
    }

    /** A qué hora suena hoy un aviso, o por qué no; y el aviso de hoy, para la vista de su fila. */
    function estadoDeFila(id, ag, l) {
      const h = ag.h;
      const mios = ag.lista.filter((a) => a.fila === id);
      // Lo que ya hiciste no suena aunque su hora no haya llegado: eso se mira antes que la hora.
      const sigue = mios.find((a) => a.min > s.ahora && !a.calla), sono = [...mios].reverse().find((a) => a.min <= s.ahora && !a.calla);
      const callo = [...mios].reverse().find((a) => a.calla);
      const dice = loQueDice(id, l, h, 'cena');
      const r = { regla: id === 'deuda' ? l.t('estado.deuda') : '', texto: '', aviso: sigue || sono || dice || callo };
      const deManana = id === 'deuda' || id === 'pesarte' || id === 'pendientes';
      if (!s.av[id]) {
        r.texto = id === 'deuda' ? '' : deManana || id === 'anotar' || id === 'falta' ? l.t('estado.' + id) : dice ? l.t('estado.seria', { hora: hora(dice.min) }) : l.t('estado.noEntrenas');
      } else if (s.permiso !== 'ok') r.texto = l.t('estado.permiso');
      else if (id === 'antesDeEntrenar' && !dice) r.texto = l.t('estado.noEntrenas');
      else if (id === 'plan' && s.rutina.creada && s.estaNocheNo) r.texto = l.t('estado.sinRutina');
      else if (sigue) {
        r.sigue = true;
        r.texto = id === 'anotar' ? l.t('estado.anotarHoy', { hora: hora(sigue.min), comida: l.t('comidas.' + sigue.comida) }) : l.t(id === 'plan' && s.rutina.creada ? 'estado.plan' : 'estado.hoy', { hora: hora(sigue.min) });
      } else if (callo && callo.min > s.ahora) r.texto = l.t('estado.' + callo.calla);
      else if (sono) r.texto = l.t('estado.sono', { hora: hora(sono.min) });
      else if (callo) r.texto = l.t('estado.' + callo.calla);
      else if (ag.fuera.some((a) => a.fila === id)) r.texto = l.t('estado.fuera');
      // Prendido hoy, después de su hora: empieza mañana, o el próximo día que toca.
      else if (id === 'pesarte' && s.pesarte === 'control' && !esControl) r.texto = l.t('estado.elControl', { dia: l.tx('fecha.dias.' + diaDelControl) });
      else if (deManana) r.texto = l.t('estado.alDespertar');
      else if (id === 'falta') r.texto = l.t('estado.faltaManana');
      else if (id === 'antesDeEntrenar' && dice && diasAlProximoEntreno() > 1) r.texto = l.t('estado.elProximo', { dia: l.tx('fecha.dias.' + ((hoySemana + diasAlProximoEntreno()) % 7)), hora: hora(dice.min) });
      else if (dice) r.texto = l.t('estado.manana', { hora: hora(dice.min) });
      return r;
    }
    function estadoDeHabito(id, ag, l) {
      const h = ag.h, min = horaDelHabito(id, h);
      if (!s.habitos[id].prendido) return { texto: l.t('estado.seria', { hora: hora(min) }) };
      if (s.permiso !== 'ok') return { texto: l.t('estado.permiso') };
      if (!tocaHoy(id)) return { texto: l.t('estado.noToca') };
      // Hecho hoy, en el cielo: no suena, esté en tu plan de sueño o no.
      if (hechoEnElCielo(id)) return { texto: l.t('estado.hecho') };
      const paso = pasosDeHoy(h).find((x) => x.id === id);
      if (enElPlan(id) && paso) return { texto: l.t('estado.enElPlan', { hora: hora(paso.min) }), sigue: paso.min > s.ahora };
      const mio = ag.lista.find((a) => a.fila === 'habito:' + id);
      if (!mio) return { texto: ag.fuera.some((a) => a.fila === 'habito:' + id) ? l.t('estado.fuera') : l.t('estado.manana', { hora: hora(min) }) };
      if (mio.calla) return { texto: l.t('estado.hecho') };
      if (mio.min > s.ahora) return { texto: l.t(habito(id).fuente.tipo === 'salud' ? 'estado.siFaltan' : 'estado.hoy', { hora: hora(mio.min) }), sigue: true };
      return { texto: l.t('estado.sono', { hora: hora(mio.min) }) };
    }

    function abrirFila(id) {
      s.abierta = id;
      if (!av) return;
      av.filas.forEach((x) => {
        const abierta = x.id === id;
        x.f.classList.toggle('abierta', abierta);
        x.cab.setAttribute('aria-expanded', String(abierta));
        // Si lo que se abre queda debajo del borde, la hoja baja suave hasta mostrarlo.
        if (abierta) {
          despues(280, () => {
            const sobra = x.f.getBoundingClientRect().bottom - (av.lista.getBoundingClientRect().bottom - 28);
            if (sobra > 0) av.lista.scrollBy({ top: sobra, behavior: quieto() ? 'auto' : 'smooth' });
          });
        }
      });
    }
    /** Una fila con su llave: la cabecera se toca para abrirla, y adentro va cómo se ve el aviso de hoy. */
    function fila(id) {
      const l = av.l;
      const f = el('div', 'avp-fila' + (s.abierta === id ? ' abierta' : ''));
      f.dataset.fila = id;
      const cab = el('div', 'avp-fila-cab');
      cab.setAttribute('role', 'button');
      cab.setAttribute('aria-expanded', String(s.abierta === id));
      cab.tabIndex = 0;
      const ico = el('i', 'avp-ico');
      ico.innerHTML = svg(ICONO[id] || '');
      const textos = el('div', 'avp-fila-textos');
      const regla = el('span', 'avp-regla'), estado = el('span', 'avp-estado');
      textos.append(el('b', null, nombreDeFila(id, l)), regla, estado);
      const lado = el('div', 'avp-fila-lado');
      const ll = llave(s.av[id], nombreDeFila(id, l), (si) => { prender(id, si); alCambiar(); });
      const flecha = el('span', 'avp-flecha');
      flecha.innerHTML = icono('abajo');
      lado.append(ll, flecha);
      cab.append(ico, textos, lado);
      const alternar = () => abrirFila(s.abierta === id ? null : id);
      cab.addEventListener('click', alternar);
      cab.addEventListener('keydown', (ev) => { if (ev.target === cab && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); alternar(); } });
      const abre = el('div', 'avp-abre');
      const dentro = el('div', 'avp-abre-dentro');
      const previa = notificacion({ titulo: '', texto: '', hora: '' });
      dentro.append(previa, el('p', 'avp-asi', l.t('asiSeVe')));
      const elegir = (lista, nombre, elegida, alTocar) => {
        const caja = el('div', 'avp-pildoras');
        const botones = lista.map((v) => { const b = pildora(nombre(v), elegida(v), () => { alTocar(v); botones.forEach((x, i) => x.setAttribute('aria-pressed', String(elegida(lista[i])))); alCambiar(); }); caja.appendChild(b); return b; });
        dentro.appendChild(caja);
      };
      // Las comidas que avisan, de a una; y pesarte, el día del control o todos.
      if (id === 'anotar') elegir(COMIDAS, (c) => l.tx('comida.comidas.' + c), (c) => s.comidas.includes(c), (c) => { s.comidas = s.comidas.includes(c) ? s.comidas.filter((x) => x !== c) : [...s.comidas, c]; });
      if (id === 'pesarte') elegir(['control', 'todos'], (v) => l.tx(v === 'control' ? 'perfil.avisos.pesarseControl' : 'perfil.avisos.pesarseTodos'), (v) => s.pesarte === v, (v) => { s.pesarte = v; });
      if (id === 'anotar' || EXPLICA[id]) dentro.appendChild(el('p', 'avp-nota', id === 'anotar' ? l.t('anotarTexto') : l.tx('perfil.avisos.' + EXPLICA[id])));
      abre.appendChild(el('div')).appendChild(dentro);
      f.appendChild(cab);
      // El plan lleva debajo sus pasos de hoy, con el segundo aviso (el de acostarte) y el camino a Sueño.
      const pasos = id === 'plan' ? f.appendChild(el('div', 'avp-fila-pasos')) : null;
      f.appendChild(abre);
      av.filas.push({
        id, f, cab,
        poner(ag, primera) {
          const e = estadoDeFila(id, ag, l);
          decirEn(regla, e.regla, 'avp-regla', primera);
          decirEn(estado, e.texto, 'avp-estado' + (e.sigue ? ' sigue' : ''), primera);
          ll.setAttribute('aria-pressed', String(!!s.av[id]));
          previa.hidden = !e.aviso;
          if (e.aviso) ponerNotificacion(previa, { titulo: e.aviso.titulo, texto: e.aviso.texto, hora: e.aviso.cuando || hora(e.aviso.min) });
          if (pasos) pintarPasosDelPlan(pasos, ag, l, primera);
        },
      });
      return f;
    }
    function pintarPasosDelPlan(caja, ag, l, primera) {
      const h = ag.h;
      const lista = s.rutina.creada ? pasosDeHoy(h) : [];
      const firma = JSON.stringify([s.rutina.creada, lista.map((x) => [x.id, x.min])]);
      // Solo se rearma si cambiaron los pasos: así la llave de adentro se mueve en vez de aparecer movida.
      if (caja._firma !== firma) {
        caja._firma = firma;
        caja.innerHTML = '';
        lista.forEach((x) => {
          const m = el('div', 'avp-mini');
          m.dataset.paso = x.id;
          const nombre = el('span');
          nombre.innerHTML = x.habito ? ESTRELLA : '';
          nombre.appendChild(document.createTextNode(nombreDePaso(x, l)));
          m.append(el('time', null, hora(x.min)), nombre);
          if (x.id === 'cama') {
            m.appendChild(llave(s.rutina.alAcostarme, l.t('hoja.avisarAlAcostarme'), (si) => { s.rutina.alAcostarme = si; alCambiar(); }));
            caja._cama = m.appendChild(el('small'));
          }
          caja.appendChild(m);
        });
        const ir = boton('avp-enlace', '<span></span>' + icono('adelante'), () => irAlPlan(s.rutina.creada ? 'editar' : 'armar'));
        ir.querySelector('span').textContent = s.rutina.creada ? l.t('editarEnSueno') : l.t('plan.armar');
        caja.appendChild(ir);
      }
      lista.forEach((x) => { const m = caja.querySelector(`.avp-mini[data-paso="${x.id}"]`); if (m) m.classList.toggle('hecho', estaHecho(x)); });
      if (caja._cama && s.rutina.creada) {
        const cama = ag.lista.find((a) => a.id === 'cama');
        decirEn(caja._cama, cama ? l.t('estado.teAvisa', { hora: hora(cama.min) }) : '', undefined, primera);
        const ll = caja.querySelector('.avp-mini .avp-llave');
        if (ll) ll.setAttribute('aria-pressed', String(!!s.rutina.alAcostarme));
      }
    }
    /** Tus hábitos: los que tienen aviso, con su llave y su hora de hoy; los que no, abajo, con «Agregar». */
    function pintarHabitos() {
      const l = av.l, caja = av.habitos;
      caja.innerHTML = '';
      av.filas = av.filas.filter((x) => !x.deHabito);
      // Dormir no lleva aviso propio: lo trae el de tu plan de sueño (como en la app, con la hora de dormir).
      const delSueno = (x) => x.fuente.tipo === 'salud' && x.fuente.dato === 'sueno' && !s.habitos[x.id];
      const conAviso = HABITOS.filter((x) => s.habitos[x.id]), conElPlan = HABITOS.filter(delSueno), sinAviso = HABITOS.filter((x) => !s.habitos[x.id] && !delSueno(x));
      const estrella = () => { const i = el('i', 'avp-ico estrella'); i.innerHTML = ESTRELLA; return i; };
      conAviso.forEach(({ id }) => {
        const f = el('div', 'avp-fila');
        const cab = el('div', 'avp-fila-cab');
        cab.setAttribute('role', 'button');
        cab.tabIndex = 0;
        const textos = el('div', 'avp-fila-textos');
        const estado = el('span', 'avp-estado');
        textos.append(el('b', null, nombreDeHabito(id, l)), estado);
        const lado = el('div', 'avp-fila-lado');
        const ll = llave(s.habitos[id].prendido, nombreDeHabito(id, l), (si) => {
          const a = s.habitos[id];
          a.prendido = si;
          if (si) a.desde = s.ahora; else delete a.desde;
          alCambiar();
        });
        const flecha = el('span', 'avp-flecha');
        flecha.innerHTML = icono('adelante');
        lado.append(ll, flecha);
        cab.append(estrella(), textos, lado);
        cab.addEventListener('click', () => abrirSub(id));
        cab.addEventListener('keydown', (ev) => { if (ev.target === cab && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abrirSub(id); } });
        f.appendChild(cab);
        caja.appendChild(f);
        av.filas.push({ id: 'habito:' + id, deHabito: true, f, cab, poner(ag, primera) {
          const e = estadoDeHabito(id, ag, l);
          decirEn(estado, e.texto, 'avp-estado' + (e.sigue ? ' sigue' : ''), primera);
          ll.setAttribute('aria-pressed', String(!!s.habitos[id].prendido));
        } });
      });
      conElPlan.forEach(({ id }) => {
        const f = el('div', 'avp-fila del-plan');
        const cab = el('div', 'avp-fila-cab');
        cab.setAttribute('role', 'button');
        cab.tabIndex = 0;
        const textos = el('div', 'avp-fila-textos');
        const estado = el('span', 'avp-estado');
        textos.append(el('b', null, nombreDeHabito(id, l)), estado);
        const flecha = el('span', 'avp-flecha');
        flecha.innerHTML = icono('adelante');
        cab.append(estrella(), textos, flecha);
        cab.addEventListener('click', () => irAlPlan());
        cab.addEventListener('keydown', (ev) => { if (ev.target === cab && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); irAlPlan(); } });
        f.appendChild(cab);
        caja.appendChild(f);
        av.filas.push({ id: 'habito:' + id, deHabito: true, f, cab, poner(ag, primera) {
          const avisa = s.av.plan && !(s.rutina.creada && s.estaNocheNo);
          const texto = s.permiso !== 'ok' ? l.t('estado.permiso') : avisa ? l.t('estado.conElPlan', { hora: hora(ag.h.inicio) }) : l.t('estado.conElPlanCallado');
          decirEn(estado, texto, 'avp-estado' + (avisa && s.permiso === 'ok' && ag.h.inicio > s.ahora ? ' sigue' : ''), primera);
        } });
      });
      sinAviso.forEach(({ id }) => {
        const f = el('div', 'avp-fila sin');
        const cab = el('div', 'avp-fila-cab');
        cab.setAttribute('role', 'button');
        cab.tabIndex = 0;
        const textos = el('div', 'avp-fila-textos');
        textos.append(el('b', null, nombreDeHabito(id, l)), document.createTextNode(' · ' + l.t('estado.sinAviso')));
        const agregar = el('span', 'avp-enlace');
        agregar.innerHTML = '<span></span>' + icono('adelante');
        agregar.querySelector('span').textContent = l.t('agregar');
        cab.append(estrella(), textos, agregar);
        cab.addEventListener('click', () => abrirSub(id));
        cab.addEventListener('keydown', (ev) => { if (ev.target === cab && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abrirSub(id); } });
        f.appendChild(cab);
        caja.appendChild(f);
      });
    }

    function pintarAvisos() {
      const l = L(), h0 = hojaAvisos.el;
      const arriba = av ? av.lista.scrollTop : 0;
      h0.innerHTML = '';
      h0.classList.remove('en-sub');
      h0.setAttribute('aria-label', l.t('titulo'));
      const cab = el('header', 'hb-cab');
      const titulo = el('h3', 'hb-titulo', l.t('titulo'));
      cab.append(el('div', 'hb-asa'), boton('avp-atras', icono('atras'), () => cerrarSub(), l.tx('comun.atras')), titulo, boton('hb-cerrar avp-cerrar', icono('cerrar'), () => hojaAvisos.cerrar(), l.tx('comida.cerrar')));
      const paneles = el('div', 'avp-paneles');
      const lista = el('div', 'avp-cuerpo avp-lista'), sub = el('div', 'avp-cuerpo avp-sub');
      paneles.append(lista, sub);
      h0.append(cab, paneles);
      av = { l, titulo, lista, sub, filas: [], grupos: {}, notas: {} };
      lista.appendChild(el('p', 'avp-bajada', l.t('bajada')));

      // Con el permiso de iOS apagado o sin pedir: lo dice arriba, y lo de hoy no se muestra (no suena nada).
      av.permiso = el('div', 'avp-pliega' + (s.permiso === 'ok' ? ' fuera' : ''));
      av.permiso.innerHTML = '<div><div class="avp-permiso-dentro"><div class="avp-tarjeta"></div></div></div>';
      lista.appendChild(av.permiso);
      pintarPermiso();

      av.hoy = el('div', 'avp-pliega' + (s.permiso === 'ok' ? '' : ' fuera'));
      const dentro = av.hoy.appendChild(el('div'));
      const hoy = dentro.appendChild(el('section', 'avp-hoy'));
      const fecha = l.u.partes(HOY);
      const cabHoy = el('div', 'avp-hoy-cab');
      const ver = boton('avp-enlace', '<span></span>' + icono('adelante'), () => abrirBloqueo(ver));
      ver.querySelector('span').textContent = l.t('ver');
      av.ver = ver;
      cabHoy.append(el('span', 'avp-etq', l.t('hoy', { dia: l.tx('fecha.dias.' + fecha.dia), num: fecha.num })), ver);
      av.linea = el('div', 'avp-linea');
      av.cuenta = el('p', 'avp-cuenta');
      hoy.append(cabHoy, av.linea, av.cuenta);
      // Para ti: una sola sugerencia, sacada de tus datos. Nunca llega como aviso.
      const paraTi = dentro.appendChild(el('div', 'avp-pliega' + (s.paraTi && !s.av.cafe ? '' : ' fuera')));
      const tarjeta = el('div', 'avp-tarjeta');
      const pregunta = el('p', null, l.t('cafe', { hora: hora(horas().C - 9 * 60) }));
      const acciones = el('div', 'avp-pliega');
      const botones = el('div', 'avp-acciones');
      botones.append(
        conTexto('avp-quieto', l.t('ahoraNo'), () => { s.paraTi = false; paraTi.classList.add('fuera'); }),
        conTexto('avp-boton', l.t('activar'), () => {
          s.paraTi = false;
          prender('cafe', true);
          // Lo dice un momento y se pliega: la fila queda prendida en «La tarde».
          decirEn(pregunta, l.t('cafeListo'));
          acciones.classList.add('fuera');
          alCambiar();
          despues(2200, () => paraTi.classList.add('fuera'));
        }),
      );
      acciones.appendChild(el('div')).appendChild(botones);
      tarjeta.append(pregunta, acciones);
      const cajaDeParaTi = el('div', 'avp-parati-dentro');
      cajaDeParaTi.append(el('h4', 'avp-etq', l.t('paraTi')), tarjeta);
      paraTi.appendChild(el('div')).appendChild(cajaDeParaTi);
      lista.appendChild(av.hoy);

      GRUPOS.forEach(([clave, filas]) => {
        const sec = el('section', 'avp-grupo');
        sec.appendChild(el('h4', 'avp-etq', l.t('grupos.' + clave)));
        if (l.crudo('notas.' + clave)) av.notas[clave] = sec.appendChild(el('p', 'avp-nota', l.t('notas.' + clave)));
        const caja = sec.appendChild(el('div', 'avp-caja'));
        filas.forEach((id) => caja.appendChild(fila(id)));
        av.grupos[clave] = lista.appendChild(sec);
      });
      const deHabitos = el('section', 'avp-grupo');
      deHabitos.append(el('h4', 'avp-etq', l.t('grupos.habitos')), el('p', 'avp-nota', l.t('notas.habitos')));
      av.habitos = deHabitos.appendChild(el('div', 'avp-caja'));
      av.grupos.habitos = lista.appendChild(deHabitos);
      pintarHabitos();

      const cuantos = el('section', 'avp-grupo');
      cuantos.appendChild(el('h4', 'avp-etq', l.t('grupos.cuantos')));
      const numeros = cuantos.appendChild(el('div', 'avp-cuantos'));
      numeros.appendChild(el('span', null, l.t('comoMucho')));
      av.numeros = MAXIMOS.map((n) => numeros.appendChild(conTexto('avp-num', String(n), () => { s.maximo = n; alCambiar(); })));
      av.suenan = cuantos.appendChild(el('p', 'avp-nota'));
      av.grupos.cuantos = lista.appendChild(cuantos);
      lista.appendChild(el('p', 'avp-pie', l.t('pie')));

      refrescarAvisos(true);
      lista.scrollTop = arriba;
    }
    function pintarPermiso() {
      if (!av || s.permiso === 'ok') return;
      const l = av.l, caja = av.permiso.querySelector('.avp-tarjeta');
      const cual = s.permiso === 'sinPedir' ? 'sinPedir' : 'apagado';
      caja.innerHTML = '';
      const cab = el('div', 'avp-permiso-cab');
      cab.innerHTML = campana('sin');
      cab.appendChild(el('span', null, l.t('permiso.' + cual)));
      const acciones = el('div', 'avp-acciones');
      // En la app abre Ajustes (o el permiso de iOS); acá, como si ya los hubieras activado.
      acciones.appendChild(conTexto('avp-boton', l.t(cual === 'sinPedir' ? 'permiso.permitir' : 'permiso.ajustes'), () => { s.permiso = 'ok'; alCambiar(); }));
      caja.append(cab, el('p', null, l.t('permiso.' + cual + 'Texto')), acciones);
    }
    /** Pone al día lo que dice la hoja, sin rearmarla: las llaves se mueven y lo que cambia entra con un fundido. */
    function refrescarAvisos(primera) {
      if (!av || (!primera && !hojaAvisos.abierta)) return;
      const l = av.l, ag = agenda(l), h = ag.h;
      const conPermiso = s.permiso === 'ok';
      hojaAvisos.el.classList.toggle('sin-permiso', !conPermiso);
      av.permiso.classList.toggle('fuera', conPermiso);
      av.hoy.classList.toggle('fuera', !conPermiso);
      if (!ag.lista.some((a) => a.id === s.elegido)) s.elegido = null;
      // Tocar un punto dice qué aviso es; tocarlo otra vez vuelve a la cuenta.
      pintarLinea(av.linea, ag, s.ahora, { l, elegido: s.elegido, alTocar: (id) => { s.elegido = s.elegido === id ? null : id; refrescarAvisos(); } });
      const suenan = queSuenan(ag), n = suenan.length, pasaron = suenan.filter((a) => a.min <= s.ahora).length;
      const elegido = ag.lista.find((a) => a.id === s.elegido);
      decirEn(av.cuenta, elegido ? l.t('punto.' + estadoDe(elegido, s.ahora), { hora: hora(elegido.min), nombre: elegido.nombre })
        : !n ? l.t('cuenta.vacia', { max: s.maximo }) : l.t('cuenta.' + (pasaron === 0 ? 'nada' : pasaron === 1 ? 'uno' : 'otros'), { n, m: pasaron, max: s.maximo }), undefined, primera);
      if (av.notas.noche) av.notas.noche.textContent = l.t('notas.noche', { desde: hora(h.P), hasta: hora(h.F) });
      av.filas.forEach((x) => x.poner(ag, primera));
      av.numeros.forEach((b, i) => b.setAttribute('aria-pressed', String(MAXIMOS[i] === s.maximo)));
      decirEn(av.suenan, l.t('suenan', { n, max: s.maximo }), undefined, primera);
    }

    // ------------------------------------------------------------ el aviso de un hábito, dibujado simple
    // En la app es el editor del hábito, abierto en «Aviso»; acá, lo justo: cuándo suena y cómo se ve.
    const CUANDO = {
      hora: () => ({ tipo: 'hora', minutos: 18 * 60 }),
      despertar: () => ({ tipo: 'despertar', despues: 15 }),
      dormir: (id) => ({ tipo: 'dormir', antes: DE_NOCHE[id] || 30 }),
    };
    function abrirSub(id) {
      av.subDe = id;
      pintarSub();
      av.sub.scrollTop = 0;
      hojaAvisos.el.classList.add('en-sub');
      decirEn(av.titulo, av.l.tx('habitos.aviso.titulo'));
    }
    function cerrarSub() {
      if (!av || !hojaAvisos.el.classList.contains('en-sub')) return;
      hojaAvisos.el.classList.remove('en-sub');
      decirEn(av.titulo, av.l.t('titulo'));
      // El que ganó o perdió su aviso cambia de lugar en la lista.
      pintarHabitos();
      alCambiar();
    }
    function pintarSub() {
      const l = av.l, id = av.subDe, caja = av.sub, h = horas();
      const a = s.habitos[id];
      caja.innerHTML = '';
      const nombre = el('div', 'avp-sub-nombre');
      nombre.innerHTML = ESTRELLA;
      nombre.appendChild(el('span', null, nombreDeHabito(id, l)));
      const tipos = el('div', 'avp-pildoras');
      const cambiar = (cuando) => {
        if (cuando) s.habitos[id] = { prendido: true, cuando, desde: s.ahora }; else delete s.habitos[id];
        pintarSub();
      };
      ['no', 'hora', 'despertar', 'dormir'].forEach((tipo) => tipos.appendChild(pildora(l.tx('habitos.aviso.' + tipo), (a ? a.cuando.tipo : 'no') === tipo, () => cambiar(tipo === 'no' ? null : CUANDO[tipo](id)))));
      caja.append(nombre, tipos);
      if (!a) return;
      const c = a.cuando;
      const detalle = el('div', 'avp-sub-detalle');
      if (c.tipo === 'hora') {
        const reloj = el('div', 'avp-reloj');
        const mover = (d) => cambiar({ tipo: 'hora', minutos: Math.max(5 * 60, Math.min(23 * 60 + 45, c.minutos + d)) });
        reloj.append(conTexto('avp-mm', '−', () => mover(-15), l.tx('habitos.aviso.minutosAntes', { n: 15 })), el('b', null, hora(c.minutos)), conTexto('avp-mm', '+', () => mover(15), l.tx('habitos.aviso.minutosDespues', { n: 15 })));
        detalle.appendChild(reloj);
      } else {
        const clave = c.tipo === 'despertar' ? 'despues' : 'antes';
        const caja2 = el('div', 'avp-pildoras');
        (c.tipo === 'despertar' ? [0, 15, 30, 60] : [15, 30, 45, 60]).forEach((n) => caja2.appendChild(pildora(n ? l.tx('habitos.aviso.' + clave, { n }) : l.tx('habitos.aviso.enElMomento'), c[clave] === n, () => cambiar(Object.assign({}, c, { [clave]: n })))));
        detalle.appendChild(caja2);
      }
      // Dentro de la rutina no suena aparte: lo que se ve es el aviso del plan, el que la trae.
      const enLaRutina = enElPlan(id) && pasosDeHoy(h).some((x) => x.id === id);
      // A la hora de la línea de Hoy, que la corre si cae a menos de 20 minutos de otro.
      const mio = enLaRutina ? null : agenda(l, h).lista.find((x) => x.fila === 'habito:' + id);
      const dice = enLaRutina ? loQueDice('plan', l, h) : { titulo: 'Moss', texto: nombreDeHabito(id, l), min: mio ? mio.min : horaDelHabito(id, h) };
      caja.append(detalle, notificacion({ titulo: dice.titulo, texto: dice.texto, hora: hora(dice.min) }), el('p', 'avp-asi', l.t('asiSeVe')),
        el('p', 'avp-nota', enLaRutina ? l.t('habitoEnElPlan', { hora: hora(dice.min) }) : l.t('habitoNota')));
    }

    // ------------------------------------------------------------ «Ver cómo se ven»: hoy, en tu pantalla bloqueada
    // Crece desde el botón a pantalla entera, con los avisos de hoy que suenan de verdad (lo que ya hiciste no está);
    // la línea de abajo se desliza para ver el día, hora por hora.
    const bloqueo = el('section', 'avp-bloqueo');
    bloqueo.hidden = true;
    bloqueo.setAttribute('role', 'dialog');
    bloqueo.setAttribute('aria-modal', 'true');
    if (typeof FONDOS_WIDGETS !== 'undefined' && FONDOS_WIDGETS && FONDOS_WIDGETS.noche) bloqueo.style.backgroundImage = `url(${FONDOS_WIDGETS.noche})`;
    tel.appendChild(bloqueo);
    let bl = null;
    let cierreDelBloqueo = 0;
    function abrirBloqueo(desde, horaInicial) {
      clearTimeout(cierreDelBloqueo);
      const marco = tel.getBoundingClientRect(), r = desde ? desde.getBoundingClientRect() : null;
      bloqueo.style.setProperty('--avp-ox', r && r.width ? `${(r.left + r.width / 2 - marco.left).toFixed(0)}px` : '80%');
      bloqueo.style.setProperty('--avp-oy', r && r.width ? `${(r.top + r.height / 2 - marco.top).toFixed(0)}px` : '22%');
      bloqueo.classList.remove('saliendo');
      bloqueo.innerHTML = '';
      const l = L();
      const cab = el('header', 'avp-bl-cab');
      const seg = el('div', 'avp-seg');
      const idiomas = ['es', 'en'].map((id) => [id, seg.appendChild(conTexto('', id.toUpperCase(), () => { bl.idioma = id; bl.ag = null; ponerBloqueo(); }))]);
      cab.append(boton('avp-bl-cerrar', svg(Util.ICONOS.cerrar), () => cerrarBloqueo(), l.tx('comida.cerrar')), seg);
      const fecha = el('p', 'avp-bl-fecha'), reloj = el('div', 'avp-bl-reloj'), lista = el('div', 'avp-bl-lista');
      const pie = el('div', 'avp-bl-pie');
      const linea = el('div', 'avp-linea');
      const rango = el('input', 'avp-rango');
      Object.assign(rango, { type: 'range', min: 0, max: 1000, step: 1 });
      const desliza = el('p', 'avp-desliza');
      pie.append(linea, desliza);
      bloqueo.append(cab, fecha, reloj, lista, pie);
      bloqueo.hidden = false;
      bl = { idioma: l.id, hora: 0, ag: null, geo: null, nueva: true, idiomas, fecha, reloj, lista, linea, rango, desliza, nodos: new Map() };
      // Arranca un minuto después del último que suena hoy: con todos a la vista.
      const sonaron = agenda(l).lista.filter((a) => !a.calla);
      bl.hora = horaInicial != null ? horaInicial : sonaron.length ? sonaron[sonaron.length - 1].min + 1 : s.ahora;
      ponerBloqueo();
      linea.append(el('i', 'avp-pulgar'), rango);
      rango.value = String(Math.round((bl.geo.aX(bl.hora) / bl.ancho) * 1000));
      rango.addEventListener('input', () => {
        bl.hora = Math.round(bl.geo.aMin((Number(rango.value) / 1000) * bl.ancho));
        ponerBloqueo();
      });
    }
    function ponerBloqueo() {
      const l = lengua(bl.idioma);
      if (!bl.ag) bl.ag = agenda(l);
      const ag = bl.ag, T = bl.hora;
      bl.fecha.textContent = l.u.fechaLarga(HOY);
      bl.reloj.textContent = hora(T);
      bl.desliza.textContent = l.t('desliza');
      bl.rango.setAttribute('aria-label', l.t('desliza'));
      bl.idiomas.forEach(([id, b]) => b.setAttribute('aria-pressed', String(id === bl.idioma)));
      bl.ancho = bl.linea.clientWidth || tel.clientWidth - 72;
      bl.geo = pintarLinea(bl.linea, ag, T, { l, ancho: bl.ancho, espera: 320 });
      // Lo que ya sonó a esa hora, lo último arriba: lo nuevo cae y lo que deja de estar se va.
      const llegados = ag.lista.filter((a) => !a.calla && a.min <= T).reverse();
      const vivos = new Set(llegados.map((a) => a.id));
      bl.nodos.forEach((n, id) => {
        if (vivos.has(id)) return;
        bl.nodos.delete(id);
        if (quieto()) { n.remove(); return; }
        n.classList.remove('cae');
        n.classList.add('se-va');
        setTimeout(() => n.remove(), 230);
      });
      llegados.forEach((a, i) => {
        const datos = { titulo: a.titulo, texto: a.texto, hora: hora(a.min) };
        let n = bl.nodos.get(a.id);
        if (n) ponerNotificacion(n, datos);
        else {
          n = notificacion(datos, 'cae');
          // Al abrir caen de a uno, cada 60 ms; después, cada uno al llegar su hora.
          n.style.setProperty('--i', bl.nueva ? i : 0);
          n.style.setProperty('--espera', bl.nueva ? '220ms' : '0ms');
          n.addEventListener('animationend', (ev) => { if (ev.animationName === 'avp-cae') n.classList.remove('cae'); });
          bl.nodos.set(a.id, n);
        }
        const enEseLugar = bl.lista.children[i];
        if (enEseLugar !== n) bl.lista.insertBefore(n, enEseLugar || null);
      });
      const nada = bl.lista.querySelector('.avp-bl-nada');
      if (llegados.length) { if (nada) nada.remove(); } else if (!nada) bl.lista.appendChild(el('p', 'avp-bl-nada', l.t('nada'))); else nada.textContent = l.t('nada');
      if (llegados.length && !bl.nueva) bl.lista.scrollTop = 0;
      bl.nueva = false;
    }
    function cerrarBloqueo(deUna) {
      clearTimeout(cierreDelBloqueo);
      if (bloqueo.hidden) return;
      const fin = () => { bloqueo.hidden = true; bloqueo.classList.remove('saliendo'); bloqueo.innerHTML = ''; bl = null; };
      if (deUna) { fin(); return; }
      // Vuelve al botón del que creció.
      bloqueo.classList.add('saliendo');
      cierreDelBloqueo = setTimeout(fin, 290);
    }

    // ------------------------------------------------------------ en Sueño: el chip de la deuda y tu plan de sueño
    // Se insertan en la sección de verdad: el chip, al lado de «Más» en la tarjeta de la deuda, y el plan, en el lugar
    // de la tarjeta del periodo (que se esconde). Sueño se pinta entero cada vez que algo cambia: un observador los
    // vuelve a poner.
    const zonaDeSueno = sueno.zona;
    const scrollDeSueno = zonaDeSueno.querySelector('.sn-scroll');
    let enSueno = null;
    let observador = null;
    function montarEnSueno() {
      if (enSueno) return;
      enSueno = { pie: null, chip: null, plan: null, pasos: [], xs: null, fin: 0 };
      zonaDeSueno.classList.add('avp-sueno');
      observador = new MutationObserver(() => inyectar());
      observador.observe(scrollDeSueno, { childList: true });
      inyectar();
    }
    function inyectar() {
      if (!enSueno) return;
      const ver = scrollDeSueno.querySelector('.sn-deuda .sn-deuda-ver');
      if (ver && !ver.closest('.avp-deuda-pie')) {
        if (!enSueno.pie) {
          enSueno.pie = el('div', 'avp-deuda-pie');
          enSueno.chip = boton('avp-chip', `<span class="avp-chip-caja">${campana('')}<span></span></span>`, () => {
            const si = !s.av.deuda;
            prender('deuda', si);
            g.haptico('suave');
            pintarChip(true);
            if (si) asomarElAviso(); else if (enSueno.previa) { const p = enSueno.previa; enSueno.previa = null; p.classList.add('sale'); despues(220, () => p.remove()); }
            alCambiar();
          });
          enSueno.pie.appendChild(enSueno.chip);
        }
        // El «Más» de la tarjeta anterior, que quedó adentro, se va con ella.
        enSueno.pie.querySelectorAll('.sn-deuda-ver').forEach((n) => n.remove());
        ver.before(enSueno.pie);
        enSueno.pie.prepend(ver);
        pintarChip();
      }
      if (!enSueno.plan || !enSueno.plan.isConnected) pintarPlan();
    }
    function desmontarDeSueno() {
      if (!enSueno) return;
      observador.disconnect();
      observador = null;
      enSueno = null;
      zonaDeSueno.classList.remove('avp-sueno');
    }

    // Marcar un hábito en el cielo (o desmarcarlo) cambia su tilde en el plan y lo que dice Avisos.
    let ojoAlCielo = null;
    let firmaDelCielo = '';
    const delCielo = () => [...tel.querySelectorAll('.etiquetas .etq.encendida .etq-nombre span')].map((n) => n.textContent).join('|');
    function mirarElCielo() {
      const etiquetas = tel.querySelector('.etiquetas');
      if (ojoAlCielo || !etiquetas) return;
      firmaDelCielo = delCielo();
      ojoAlCielo = new MutationObserver(() => {
        const firma = delCielo();
        if (firma === firmaDelCielo) return;
        firmaDelCielo = firma;
        ponerHechos();
        refrescarAvisos();
      });
      ojoAlCielo.observe(etiquetas, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    }
    function dejarDeMirarElCielo() {
      if (ojoAlCielo) ojoAlCielo.disconnect();
      ojoAlCielo = null;
    }

    // Lo que la propuesta cambia afuera y devuelve al cerrarse: la sección, cómo estaba Sueño (el estado del panel, la
    // noche que mirabas y hasta dónde habías bajado) y el margen para dormirte.
    let deAfuera = null;
    /** La noche elegida en la tira de Sueño: su etiqueta es la fecha larga, la misma que arma `fechaLarga`. */
    function nocheQueSeMira() {
      const elegida = scrollDeSueno.querySelector('.sn-noches .sn-noche.elegida');
      const etiqueta = elegida && elegida.getAttribute('aria-label');
      for (let k = 0; etiqueta && k < 400; k++) { const clave = Fechas.sumarDias(HOY, -k); if (L().u.fechaLarga(clave) === etiqueta) return clave; }
      return HOY;
    }
    let esperaDeSueno = 0;
    function recordar() {
      clearTimeout(esperaDeSueno);
      deAfuera = { pestana: g.pestana, estado: sueno.estado, clave: nocheQueSeMira(), arriba: scrollDeSueno.scrollTop };
      latenciaDeAntes = perfil.latencia;
      margenPropio = undefined;
    }
    function devolver() {
      const a = deAfuera;
      deAfuera = null;
      if (!a) { try { sueno.pintar(); } catch (_) { /* queda como esté */ } return; }
      // El margen, si sigue el que puso la propuesta (si lo cambiaste afuera, queda el tuyo).
      try { if (margenPropio !== undefined && perfil.latencia === margenPropio) perfil.ponerLatencia(latenciaDeAntes); } catch (_) { /* queda como esté */ }
      margenPropio = undefined;
      const suenoComoEstaba = () => {
        try {
          if (a.clave !== HOY) sueno.verNoche(a.clave); else sueno.pintar();
          scrollDeSueno.scrollTop = a.arriba;
        } catch (_) { /* queda como esté */ }
      };
      // Otro estado se pone con un fundido (180 ms) que vuelve arriba: la noche y el lugar, después.
      if (sueno.estado !== a.estado) { sueno.ponerEstado(a.estado); esperaDeSueno = setTimeout(suenoComoEstaba, 220); } else suenoComoEstaba();
      if (g.pestana !== a.pestana) g.irA(a.pestana);
    }
    /** El chip: apagado, lo ofrece; encendido, lo dice y se apaga ahí mismo. Al cambiar, cambia de ancho. */
    function pintarChip(animar) {
      if (!enSueno || !enSueno.chip) return;
      const chip = enSueno.chip, caja = chip.querySelector('.avp-chip-caja'), texto = caja.querySelector('span');
      const si = !!s.av.deuda, dice = L().t(si ? 'chip.prendido' : 'chip.apagado');
      chip.setAttribute('aria-pressed', String(si));
      chip.querySelector('.avp-camp').classList.toggle('on', si);
      if (texto.textContent === dice) return;
      const antes = caja.getBoundingClientRect().width;
      texto.textContent = dice;
      if (!animar || !antes || quieto()) return;
      caja.style.width = 'auto';
      const ahora = caja.getBoundingClientRect().width;
      caja.style.width = `${antes}px`;
      void caja.offsetWidth;
      caja.style.width = `${ahora}px`;
      texto.classList.remove('avp-cambia');
      void texto.offsetWidth;
      texto.classList.add('avp-cambia');
      setTimeout(() => { caja.style.width = ''; }, 340);
    }
    /** Al encenderlo: cómo se va a ver el aviso crece desde el chip, queda 2,5 s y vuelve a él. */
    function asomarElAviso() {
      if (enSueno.previa) enSueno.previa.remove();
      const dice = loQueDice('deuda', L(), horas());
      const caja = el('div', 'avp-chip-previa');
      caja.appendChild(notificacion({ titulo: dice.titulo, texto: dice.texto, hora: hora(dice.min) }));
      caja.addEventListener('animationend', (ev) => { if (ev.target === caja) caja.remove(); });
      enSueno.pie.appendChild(caja);
      enSueno.previa = caja;
    }

    /** Pone el plan en su lugar (o lo rearma): de día, una fila; de noche, la tarjeta. `entra`: creciendo. */
    function pintarPlan(entra) {
      if (!enSueno) return;
      const ancla = scrollDeSueno.querySelector('.sn-periodo') || scrollDeSueno.querySelector('.sn-deuda');
      if (!ancla) return;
      const nodo = !s.deNoche ? filaDeDia() : !s.rutina.creada ? cartaSinRutina() : s.variante === 'b' ? cartaDeLaNoche() : cartaDeLaRutina();
      if (entra && !quieto()) nodo.classList.add('entra');
      const viejo = enSueno.plan;
      enSueno.plan = nodo;
      if (viejo && viejo.isConnected) viejo.replaceWith(nodo); else ancla.after(nodo);
      ponerHechos();
    }
    function bajarAlPlan(deUna) {
      if (!enSueno || !enSueno.plan) return;
      scrollDeSueno.scrollTo({ top: Math.max(0, enSueno.plan.offsetTop - 66), behavior: deUna || quieto() ? 'auto' : 'smooth' });
    }
    const queEs = (l) => conTexto('avp-enlace', l.tx('sueno.periodo.queEs'), () => { try { sueno.periodo('hoja'); } catch (_) { /* sin la hoja, nada */ } });
    function carta(titulo, derecha) {
      const c = el('article', 'pg-carta sn-carta avp-plan' + (s.estaNocheNo ? ' sin-rutina' : ''));
      const cab = el('header', 'pg-carta-cab');
      cab.append(el('span', 'pg-carta-titulo', titulo), derecha);
      c.appendChild(cab);
      return c;
    }
    /** Las dos horas del periodo, en grande, y cuánto se corrió desde ayer: como en la tarjeta de Sueño. */
    function horasDelPeriodo(l, h) {
      const horasDe = el('div', 'sn-periodo-horas');
      horasDe.appendChild(el('b', null, `${hora(h.P)} – ${hora(h.F)}`));
      const corrido = Periodo.corrido(l.u, h.p);
      if (corrido) horasDe.appendChild(el('em', 'sn-periodo-corrido', corrido));
      return horasDe;
    }
    /** La noche en una línea: la melatonina sube y el tramo es tu periodo; encima, los pasos de la rutina. */
    function pista(h, pasos) {
      const total = h.p.hasta + 60 - h.p.inicio;
      const pct = (m) => ((m - h.sube) / total) * 100;
      const caja = el('div', 'avp-pista');
      const riel = el('div', 'avp-riel');
      const parte = (clase, desde, hasta) => { const i = el('i', clase); i.style.left = `${pct(desde).toFixed(1)}%`; i.style.width = `${(pct(hasta) - pct(desde)).toFixed(1)}%`; riel.appendChild(i); };
      parte('sube', h.sube, h.P);
      parte('tramo', h.P, h.F);
      riel.appendChild(el('i', 'hecho'));
      caja.appendChild(riel);
      // Cada paso, en su hora; los que caen casi juntos se corren apenas a la izquierda para que se vean los dos.
      const xs = pasos.map((x) => pct(x.min));
      for (let i = xs.length - 2; i >= 0; i--) xs[i] = Math.max(0, Math.min(xs[i], xs[i + 1] - 4.4));
      pasos.forEach((x, i) => {
        const pt = el('i', 'avp-pista-pt');
        pt.dataset.paso = x.id;
        pt.style.setProperty('--x', `${xs[i].toFixed(1)}%`);
        pt.style.setProperty('--i', i);
        caja.appendChild(pt);
      });
      // Debajo, la hora en que empieza y la de acostarte (si quedan muy juntas, solo la de acostarte).
      const ultimo = pasos.length - 1;
      const rotulo = (i) => { const t = el('span', 'avp-pista-hora', hora(pasos[i].min)); t.style.setProperty('--x', `${Math.max(4, xs[i]).toFixed(1)}%`); caja.appendChild(t); };
      if (ultimo > 0 && xs[ultimo] - xs[0] > 13) rotulo(0);
      if (ultimo >= 0) rotulo(ultimo);
      return { caja, xs, fin: pct(h.P) };
    }
    /** Un paso se tilda en su círculo; uno de tus hábitos, también en su estrella del cielo (es la misma marca). Los
     *  que abren algo (la nota, cuánto antes te acuestas) llevan su flecha. */
    function tilde(x, nombre) {
      const b = boton('avp-tilde', `<i>${TILDE}</i>`, () => {
        if (x.habito) marcarEnElCielo(x.id, !hechoEnElCielo(x.id));
        else {
          if (s.hechos.has(x.id)) s.hechos.delete(x.id); else s.hechos.add(x.id);
          g.haptico(s.hechos.has(x.id) ? 'toque' : 'suave');
        }
        ponerHechos();
        refrescarAvisos();
      }, nombre);
      b.setAttribute('aria-pressed', String(estaHecho(x)));
      return b;
    }
    const abreDe = { anotar: () => { try { sueno.periodo('nota'); } catch (_) { /* sin la nota, nada */ } }, cama: () => abrirMargen() };
    function nombreDelPaso(x, l, sinFlecha) {
      const abre = abreDe[x.id];
      const n = abre ? boton('avp-paso-nombre', '', abre) : el('div', 'avp-paso-nombre');
      n.innerHTML = `${x.habito ? ESTRELLA : ''}<span></span>${abre && !sinFlecha ? icono('adelante') : ''}`;
      n.querySelector('span').textContent = nombreDePaso(x, l);
      return n;
    }
    /** Lo hecho, sin rearmar la tarjeta: el círculo se llena y la pista se enciende hasta el paso más avanzado. */
    function ponerHechos() {
      const c = enSueno && enSueno.plan;
      if (!c) return;
      const pasos = enSueno.pasos;
      let ultimo = -1;
      pasos.forEach((x, i) => { if (estaHecho(x)) ultimo = i; });
      c.querySelectorAll('[data-paso]').forEach((n) => {
        const paso = pasos.find((x) => x.id === n.dataset.paso);
        const hecho = !!paso && estaHecho(paso);
        n.classList.toggle('hecho', hecho);
        const t = n.querySelector('.avp-tilde');
        if (t) t.setAttribute('aria-pressed', String(hecho));
        // En la noche entera, la línea se enciende desde el primer paso hasta el más avanzado.
        if (!n.classList.contains('avp-nb')) return;
        const i = pasos.findIndex((x) => x.id === n.dataset.paso);
        n.classList.toggle('encendida', ultimo > 0 && i < ultimo);
        n.classList.toggle('primera', i === 0);
        n.classList.toggle('llega', ultimo > 0 && i === ultimo);
      });
      const hecho = c.querySelector('.avp-riel .hecho');
      const xs = enSueno.xs;
      if (hecho && xs && xs.length) {
        // Con todos hechos, queda encendida hasta tu periodo.
        const hasta = ultimo < 0 ? xs[0] : ultimo === xs.length - 1 ? enSueno.fin : xs[ultimo];
        hecho.style.setProperty('--desde', `${xs[0].toFixed(1)}%`);
        hecho.style.setProperty('--ancho', `${(hasta - xs[0]).toFixed(1)}%`);
      }
    }
    /** «Esta noche no»: la rutina se pliega y queda una línea; el periodo sigue ahí. */
    function ponerEstaNoche(no) {
      s.estaNocheNo = no;
      const c = enSueno && enSueno.plan;
      if (c) {
        c.classList.toggle('sin-rutina', no);
        c.querySelectorAll('.avp-de-rutina').forEach((n) => n.classList.toggle('fuera', no));
        c.querySelectorAll('.avp-sin-rutina').forEach((n) => n.classList.toggle('fuera', !no));
      }
      refrescarAvisos();
    }
    const plegado = (clase, fuera, ...hijos) => { const p = el('div', `avp-pliega ${clase}${fuera ? ' fuera' : ''}`); p.appendChild(el('div')).append(...hijos); return p; };
    function queda(l) {
      const fila = el('div', 'avp-queda');
      const deshacer = conTexto('avp-enlace', l.tx('comun.deshacer'), () => ponerEstaNoche(false));
      fila.append(el('span', null, l.t('plan.sinRutina')), deshacer);
      return fila;
    }
    const cambiarDeVariante = (a) => { s.variante = a; pintarPlan(true); bajarAlPlan(); };

    /** Variante A, la rutina: dentro de la tarjeta del periodo, los pasos como puntos sobre la pista y la lista para tildar. */
    function cartaDeLaRutina() {
      const l = L(), h = horas(), pasos = pasosDeHoy(h);
      const c = carta(l.t('plan.titulo'), conTexto('avp-enlace', l.t('plan.editar'), () => abrirArmar()));
      const per = el('div', 'avp-per-cab');
      per.append(el('span', null, l.tx('sueno.periodo.titulo')), queEs(l));
      const linea = pista(h, pasos);
      Object.assign(enSueno, { pasos, xs: linea.xs, fin: linea.fin, h });
      const lista = el('ul', 'avp-pasos');
      pasos.forEach((x) => {
        const li = el('li', 'avp-paso');
        li.dataset.paso = x.id;
        li.append(tilde(x, nombreDePaso(x, l)), el('time', null, hora(x.min)), nombreDelPaso(x, l));
        lista.appendChild(li);
      });
      const pie = el('div', 'avp-plan-pie');
      const avisa = boton('avp-teavisa', `${campana(s.av.plan ? 'on' : '')}<span></span>`, () => abrirAvisos({ desde: avisa, a: 'noche' }));
      avisa.querySelector('span').textContent = s.av.plan ? l.t('plan.teAvisa', { hora: hora(h.inicio) }) : l.t('plan.noAvisa');
      pie.append(avisa, conTexto('avp-quieto', l.t('plan.estaNocheNo'), () => ponerEstaNoche(true)));
      c.append(per, horasDelPeriodo(l, h), linea.caja,
        plegado('avp-de-rutina', s.estaNocheNo, el('p', 'avp-rutina-etq', l.t('plan.rutina', { hora: hora(h.inicio) })), lista, pie),
        plegado('avp-sin-rutina', !s.estaNocheNo, queda(l)),
        conTexto('avp-enlace', l.t('plan.verNoche'), () => cambiarDeVariante('b')),
        el('p', 'avp-plan-nota', l.t('plan.pie')));
      return c;
    }
    /** Sin rutina todavía: la tarjeta del periodo, como hoy, con la invitación a armarla. */
    function cartaSinRutina() {
      const l = L(), h = horas();
      const c = carta(l.tx('sueno.periodo.titulo'), queEs(l));
      const linea = pista(h, []);
      Object.assign(enSueno, { pasos: [], xs: null, h });
      const armar = boton('avp-armar-fila', `<i class="ico">${svg(ICONO.plan)}</i><span><b></b><small></small></span>${icono('adelante')}`, () => abrirArmar());
      armar.querySelector('b').textContent = l.t('plan.armar');
      armar.querySelector('small').textContent = l.t('plan.armarTexto');
      const texto = el('p', 'sn-periodo-texto', l.tx('sueno.periodo.texto'));
      c.append(horasDelPeriodo(l, h), linea.caja, texto, armar);
      return c;
    }
    /** De día (antes de las 19), una fila: tocarla abre la tarjeta. */
    function filaDeDia() {
      const l = L(), h = horas();
      const b = boton('avp-de-dia', `<i class="ico">${svg(ICONO.plan)}</i><span><b></b><small></small></span>${icono('adelante')}`, () => { s.deNoche = true; pintarPlan(true); bajarAlPlan(); });
      b.querySelector('b').textContent = l.t(s.rutina.creada ? 'plan.titulo' : 'plan.armar');
      b.querySelector('small').textContent = s.rutina.creada ? l.t('plan.dia', { inicio: hora(h.inicio), cama: hora(h.C) }) : l.t('plan.armarTexto');
      Object.assign(enSueno, { pasos: [], xs: null, h });
      return b;
    }
    /** Variante B, la noche entera: una línea vertical de la tarde al despertar, con lo que Moss ya sabe. */
    function cartaDeLaNoche() {
      const l = L(), h = horas(), r = s.rutina, pasos = pasosDeHoy(h);
      Object.assign(enSueno, { pasos, xs: null, h });
      const c = carta(l.t('plan.titulo'), queEs(l));
      c.appendChild(el('p', 'avp-noche-sub', l.t('plan.noche')));
      const lista = el('ul', 'avp-noche');
      const fila = (clase, cuando, nodo, textos, lado, de) => {
        const li = el('li', 'avp-pliega' + (de ? ` avp-${de}` : '') + ((de === 'de-rutina' && s.estaNocheNo) || (de === 'sin-rutina' && !s.estaNocheNo) ? ' fuera' : ''));
        const f = el('div', 'avp-nb ' + clase);
        const t = el('time');
        [].concat(cuando).forEach((m) => t.appendChild(el('span', null, m == null ? '' : hora(m))));
        const n = el('div', 'avp-nb-nodo');
        n.appendChild(nodo || el('i', 'pto'));
        f.append(t, n, textos, lado || el('span'));
        li.appendChild(el('div')).appendChild(f);
        lista.appendChild(li);
        return f;
      };
      const textos = (nombre, sub, conEstrella) => {
        const caja = el('div', 'avp-nb-textos');
        const n = el('span');
        n.innerHTML = conEstrella ? ESTRELLA : '';
        n.appendChild(document.createTextNode(nombre));
        caja.appendChild(n);
        if (sub) caja.appendChild(el('small', null, sub));
        return caja;
      };
      // Lo que conviene dejar, sin tildar: el último café y la última comida grande; lo fuerte, solo si entrenas tarde.
      fila('marca', h.C - 9 * 60, null, textos(l.t('marcas.cafe')));
      const e = Datos.PERFIL.entreno;
      if (e && e.dias.includes(hoySemana) && e.hora + e.minutos > h.C - 120) fila('marca', h.C - 120, null, textos(l.t('marcas.fuerte')));
      fila('marca', h.C - 120, null, textos(l.t('marcas.comida')));
      // «Ahora» es el paso en curso: el último que ya empezó. Antes de que empiece la rutina, ninguno.
      const yaEmpezaron = pasos.filter((x) => x.min <= s.ahora);
      const actual = yaEmpezaron.length ? yaEmpezaron[yaEmpezaron.length - 1] : null;
      // Cada paso con su campanita: la del comienzo es el aviso del plan y la de acostarte, el segundo.
      const prendida = (id) => (id === 'comienzo' ? s.av.plan : id === 'cama' ? s.rutina.alAcostarme : !!s.campanas[id]);
      pasos.forEach((x, i) => {
        const nombre = x.id === 'comienzo' ? l.t('plan.rutinaCorta') : nombreDePaso(x, l);
        const sub = x.id === 'comienzo' ? ['luz', 'tranquilo'].filter((p) => r.pasos.includes(p)).map((p) => l.t('cortos.' + p)).join(', ') : '';
        let camp = null;
        if (!x.habito) {
          camp = boton('avp-nb-camp', campana(prendida(x.id) ? 'on' : ''), () => {
            const si = !prendida(x.id);
            if (x.id === 'comienzo') prender('plan', si); else if (x.id === 'cama') r.alAcostarme = si; else s.campanas[x.id] = si;
            camp.setAttribute('aria-pressed', String(si));
            camp.querySelector('.avp-camp').classList.toggle('on', si);
            g.haptico('suave');
            refrescarAvisos();
          }, l.t('plan.avisoDe', { paso: nombre }));
          camp.setAttribute('aria-pressed', String(prendida(x.id)));
        }
        const f = fila('paso' + (x === actual ? ' ahora' : ''), x.min, tilde(x, nombre), abreDe[x.id] ? nombreDelPaso(x, l, true) : textos(nombre, sub, x.habito), camp, 'de-rutina');
        f.dataset.paso = x.id;
        f.style.setProperty('--i', i);
      });
      fila('marca', null, null, queda(l), null, 'sin-rutina');
      fila('periodo', [h.P, h.F], el('i'), textos(l.tx('sueno.periodo.titulo'), Periodo.corrido(l.u, h.p) || ''));
      fila('marca', h.deSiempre, null, textos(l.t('marcas.despertar')));
      const pie = el('div', 'avp-plan-pie');
      const agregar = boton('avp-enlace', `${svg(Util.ICONOS.mas)}<span></span>`, () => abrirArmar());
      agregar.querySelector('span').textContent = l.t('plan.agregarPaso');
      pie.append(agregar, conTexto('avp-quieto', l.t('plan.estaNocheNo'), () => ponerEstaNoche(true)));
      c.append(lista, plegado('avp-de-rutina', s.estaNocheNo, pie), conTexto('avp-enlace', l.t('plan.verRutina'), () => cambiarDeVariante('a')), el('p', 'avp-plan-nota', l.t('plan.pie')));
      return c;
    }

    // ------------------------------------------------------------ «Arma tu rutina de sueño»
    // Se arma en menos de un minuto: cuánto antes empiezas y qué haces en ese rato. Lo elegido es un borrador hasta
    // tocar el botón; al tocar una opción, su hora de hoy y su porqué.
    /** Un texto con sus valores en negrita; al cambiar un valor, entra con un fundido. */
    function conValores(nodo, plantilla, valores, deUna) {
      if (nodo._plantilla !== plantilla) {
        nodo._plantilla = plantilla;
        nodo._valores = {};
        nodo.innerHTML = '';
        plantilla.split(/(\{\w+\})/).forEach((parte) => {
          const m = /^\{(\w+)\}$/.exec(parte);
          if (m) nodo._valores[m[1]] = nodo.appendChild(el('b')); else if (parte) nodo.appendChild(document.createTextNode(parte));
        });
        deUna = true;
      }
      Object.keys(nodo._valores).forEach((k) => decirEn(nodo._valores[k], String(valores[k]), undefined, deUna));
    }
    const cabeceraDeHoja = (hoja, titulo, l) => {
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', titulo), boton('hb-cerrar avp-cerrar', icono('cerrar'), () => hoja.cerrar(), l.tx('comida.cerrar')));
      return cab;
    };
    const hojaArmar = Util.hoja(tel, 'avp-hoja avp-armar', () => {});
    let borrador = null;
    let ar = null;
    const delBorrador = () => Object.assign({ creada: true }, borrador);
    function abrirArmar() {
      const r = s.rutina;
      borrador = { nueva: !r.creada, antes: r.antes, pasos: [...r.pasos], habitos: habitosDeLaRutina(), avisar: s.av.plan, alAcostarme: r.alAcostarme, info: null };
      pintarArmar();
      hojaArmar.abrir();
    }
    function alternarPaso(id) {
      if (!borrador || !ar) return;
      const esHabito = !DE_MOSS.includes(id);
      const lista = esHabito ? borrador.habitos : borrador.pasos;
      const estaba = lista.includes(id);
      if (esHabito) borrador.habitos = estaba ? lista.filter((x) => x !== id) : [...lista, id];
      else borrador.pasos = estaba ? lista.filter((x) => x !== id) : [...lista, id];
      borrador.info = estaba ? null : id;
      g.haptico('suave');
      ponerArmar();
      // Lo que explica la opción crece debajo: si queda tapado, la hoja baja suave.
      if (!estaba) {
        despues(340, () => {
          if (!ar || !hojaArmar.abierta) return;
          const sobra = ar.info.getBoundingClientRect().bottom - (ar.cuerpo.getBoundingClientRect().bottom - 150);
          if (sobra > 0) ar.cuerpo.scrollBy({ top: sobra, behavior: quieto() ? 'auto' : 'smooth' });
        });
      }
    }
    function pintarArmar() {
      const l = L(), h0 = hojaArmar.el;
      h0.innerHTML = '';
      h0.setAttribute('aria-label', l.t('plan.armar'));
      const cuerpo = el('div', 'avp-cuerpo');
      const cuanto = el('section', 'avp-seccion');
      const antes = el('div', 'avp-pildoras');
      const deAntes = [30, 45, 60, 90, 120].map((n) => [n, antes.appendChild(pildora(l.t('hoja.antes.' + n), false, () => { borrador.antes = n; g.haptico('suave'); ponerArmar(); }))]);
      const resumen = el('p', 'avp-resumen');
      cuanto.append(el('h4', 'avp-etq', l.t('hoja.cuanto')), antes, resumen);
      const que = el('section', 'avp-seccion');
      const moss = el('div', 'avp-pildoras');
      const dePasos = DE_MOSS.map((id) => [id, moss.appendChild(pildora(l.t('pasos.' + id), false, () => alternarPaso(id)))]);
      const tuyos = el('div', 'avp-pildoras');
      const candidatos = [...new Set([...Object.keys(DE_NOCHE).filter(tocaHoy), ...borrador.habitos])];
      const deHabitos = candidatos.map((id) => [id, tuyos.appendChild(pildora(nombreDeHabito(id, l), false, () => alternarPaso(id), true))]);
      const info = plegado('', true, (() => { const d = el('div', 'avp-info-dentro'); d.appendChild(el('div', 'avp-info')); return d; })());
      que.append(el('h4', 'avp-etq', l.t('hoja.que')), el('p', 'avp-sub-etq', l.t('hoja.deMoss')), moss);
      if (deHabitos.length) que.append(el('p', 'avp-sub-etq', l.t('hoja.tusHabitos')), tuyos);
      que.appendChild(info);
      const llaves = el('div', 'avp-llaves');
      const conLlave = (texto, clave) => {
        const fila = el('div', 'avp-llave-fila');
        const ll = llave(borrador[clave], texto, (si) => { borrador[clave] = si; });
        fila.append(el('span', null, texto), ll);
        fila.addEventListener('click', () => ll.click());
        llaves.appendChild(fila);
      };
      conLlave(l.t('hoja.avisarAlEmpezar'), 'avisar');
      conLlave(l.t('hoja.avisarAlAcostarme'), 'alAcostarme');
      cuerpo.append(cuanto, que, llaves, conTexto('avp-crear', borrador.nueva ? l.t('hoja.crear') : l.tx('comun.guardar'), () => guardarRutina()));
      h0.append(cabeceraDeHoja(hojaArmar, l.t('plan.armar'), l), cuerpo);
      ar = { l, cuerpo, deAntes, dePasos, deHabitos, resumen, info };
      ponerArmar(true);
    }
    function ponerArmar(primera) {
      const l = ar.l, r = delBorrador(), h = horas(r);
      ar.deAntes.forEach(([n, b]) => b.setAttribute('aria-pressed', String(borrador.antes === n)));
      ar.dePasos.forEach(([id, b]) => b.setAttribute('aria-pressed', String(borrador.pasos.includes(id))));
      ar.deHabitos.forEach(([id, b]) => b.setAttribute('aria-pressed', String(borrador.habitos.includes(id))));
      conValores(ar.resumen, l.crudo('hoja.resumen'), { inicio: hora(h.inicio), cama: hora(h.C) }, primera);
      const info = borrador.info;
      const paso = info ? pasosDeHoy(h, r, borrador.habitos).find((x) => x.id === (info === 'luz' || info === 'tranquilo' ? 'comienzo' : info)) : null;
      if (paso) {
        const deHabito = !DE_MOSS.includes(info);
        const titulo = l.t(info === 'luz' || info === 'tranquilo' ? 'hoja.desde' : 'hoja.a', { paso: deHabito ? nombreDeHabito(info, l) : l.t('pasos.' + info), hora: hora(paso.min) });
        // La ducha va hora y media antes de acostarte: si eso es antes del comienzo, lo adelanta, y lo dice.
        const adelanta = info === 'ducha' && h.inicio < h.base ? l.t('hoja.conLaDucha', { hora: hora(h.inicio) }) : '';
        const firma = [info, titulo, adelanta].join('|');
        if (ar.info._firma !== firma) {
          ar.info._firma = firma;
          const caja = ar.info.querySelector('.avp-info');
          caja.innerHTML = '';
          // «Mañana Moss te los recuerda», solo con «Lo que hay que hacer hoy» prendido.
          const porque = l.t('hoja.porque.' + (deHabito ? 'habito' : info)) + (info === 'anotar' && s.av.pendientes ? ' ' + l.t('hoja.porque.anotarRecuerda') : '');
          caja.append(el('b', null, titulo), el('p', null, porque));
          if (adelanta) caja.appendChild(el('p', 'adelanta', adelanta));
          if (!primera) { caja.classList.remove('avp-cambia'); void caja.offsetWidth; caja.classList.add('avp-cambia'); }
        }
      }
      ar.info.classList.toggle('fuera', !paso);
    }
    function guardarRutina() {
      const r = s.rutina;
      Object.assign(r, { creada: true, antes: borrador.antes, pasos: DE_MOSS.filter((id) => borrador.pasos.includes(id)), alAcostarme: borrador.alAcostarme });
      prender('plan', borrador.avisar);
      // Un hábito que entra a la rutina pasa a avisar antes de dormir; el que sale se queda sin ese aviso.
      [...new Set([...Object.keys(DE_NOCHE), ...Object.keys(s.habitos)])].forEach((id) => {
        const a = s.habitos[id], adentro = borrador.habitos.includes(id);
        if (adentro && !(a && a.prendido && a.cuando.tipo === 'dormir')) s.habitos[id] = { prendido: true, cuando: { tipo: 'dormir', antes: DE_NOCHE[id] || 30 } };
        else if (!adentro && a && a.cuando.tipo === 'dormir' && tocaHoy(id)) delete s.habitos[id];
      });
      Object.assign(s, { estaNocheNo: false, deNoche: true });
      const quedan = new Set(pasosDeHoy(horas()).map((x) => x.id));
      s.hechos = new Set([...s.hechos].filter((id) => quedan.has(id)));
      hojaArmar.cerrar();
      pintarPlan(true);
      bajarAlPlan();
      refrescarAvisos();
    }

    // ------------------------------------------------------------ «Cuánto antes te acuestas»
    // En lugar de «Tardo en dormirme»: no es un aviso, es parte del plan. Se llega tocando tu hora de acostarte.
    const hojaMargen = Util.hoja(tel, 'avp-hoja avp-margen', () => {});
    let mg = null;
    function abrirMargen() {
      pintarMargen();
      hojaMargen.abrir();
    }
    function pintarMargen() {
      const l = L(), h0 = hojaMargen.el;
      h0.innerHTML = '';
      h0.setAttribute('aria-label', l.t('margen.titulo'));
      const cuerpo = el('div', 'avp-cuerpo');
      const caja = el('div', 'avp-pildoras');
      const opciones = SinReloj.MARGENES.map((n) => [n, caja.appendChild(pildora(n ? l.t('margen.antes', { n }) : l.t('margen.justo'), false, () => {
        s.margen = n;
        // El mismo margen de Sueño › Afinar: así el resto de Sueño dice las mismas horas.
        try { perfil.ponerLatencia(n); margenPropio = n; } catch (_) { /* queda solo en la propuesta */ }
        g.haptico('suave');
        ponerMargen();
        pintarPlan();
      }))]);
      const seccion = el('section', 'avp-seccion');
      const hoy = el('p', 'avp-margen-hoy');
      seccion.append(caja, hoy, el('p', 'avp-nota', l.t('margen.texto')));
      let sinReloj = !!s.sinReloj;
      try { sinReloj = sinReloj || sueno.noches().slice(-7).some((n) => n.moss); } catch (_) { /* queda lo elegido */ }
      if (sinReloj) seccion.appendChild(el('p', 'avp-nota', l.t('margen.sinReloj')));
      cuerpo.appendChild(seccion);
      h0.append(cabeceraDeHoja(hojaMargen, l.t('margen.titulo'), l), cuerpo);
      mg = { l, opciones, hoy };
      ponerMargen(true);
    }
    function ponerMargen(primera) {
      const h = horas();
      mg.opciones.forEach(([n, b]) => b.setAttribute('aria-pressed', String(s.margen === n)));
      conValores(mg.hoy, mg.l.crudo('margen.hoy'), { cama: hora(h.C), desde: hora(h.P) }, primera);
    }

    // En las hojas y en la pantalla bloqueada el dedo es de ellas: el gesto de las pestañas se mira en la captura,
    // antes que nadie, y sin esto deslizar de costado movería las secciones de atrás.
    const mias = [bloqueo, ...[hojaAvisos, hojaArmar, hojaMargen].flatMap((x) => [x.el, x.el.previousElementSibling])];
    const frenar = (ev) => { if (ev.target instanceof Element && mias.some((n) => n && n.contains(ev.target))) ev.stopPropagation(); };
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((n) => document.addEventListener(n, frenar, true));
    // Anotar algo en la nota de Sueño tilda su paso: se marca solo.
    let cuantosPendientes = Periodo.pendientes.items().length;
    Periodo.pendientes.alCambiar(() => {
      const n = Periodo.pendientes.items().length;
      if (enSueno && n > cuantosPendientes && enSueno.pasos.some((x) => x.id === 'anotar')) { s.hechos.add('anotar'); ponerHechos(); }
      cuantosPendientes = n;
    });

    // ------------------------------------------------------------ las vistas de la galería
    let idiomaDeAntes = null;
    let idiomaPintado = null;
    let vigia = 0;
    let citas = [];
    const luego = (ms, f) => { citas.push(setTimeout(f, ms)); };
    function cerrarLoMio() {
      citas.forEach(clearTimeout);
      citas = [];
      cerrarBloqueo(true);
      // De una, y el teléfono vuelve a su tamaño (la hoja, cerrada así, lo deja achicado para la que la reemplaza).
      [hojaAvisos, hojaArmar, hojaMargen].forEach((x) => { if (x.abierta) { x.cerrar(true); tel.classList.remove('con-hoja'); } });
    }
    function volverAlIdioma() {
      if (!idiomaDeAntes) return;
      const antes = idiomaDeAntes;
      idiomaDeAntes = null;
      if (g.idioma !== antes) window.__idioma(antes);
    }
    /** El idioma puede cambiar con la galería abierta: lo que está a la vista se pinta de nuevo. */
    function vigilar() {
      if (idiomaPintado === L().id) return;
      idiomaPintado = L().id;
      pintarCampana();
      if (hojaAvisos.abierta) pintarAvisos();
      if (hojaArmar.abierta) pintarArmar();
      if (hojaMargen.abierta) pintarMargen();
      if (bl) { bl.idioma = L().id; bl.ag = null; ponerBloqueo(); }
      if (enSueno && enSueno.chip) { enSueno.chip.querySelector('.avp-chip-caja span').textContent = ''; pintarChip(); }
      pintarPlan();
    }
    /** De Avisos al plan («Editar en Sueño»): la hoja baja, Sueño se desliza y, ya ahí, sube la hoja de la rutina. */
    function irAlPlan() {
      hojaAvisos.cerrar();
      s.deNoche = true;
      g.irA(3);
      pintarPlan();
      luego(quieto() ? 0 : 400, () => { bajarAlPlan(); luego(quieto() ? 0 : 380, () => abrirArmar()); });
    }
    /** Cada botón parte de cómo llega quien abre la propuesta, con lo que esa vista necesita. */
    function reiniciar(vista, arg) {
      // El margen que eligió la persona; si lo cambió afuera mientras la propuesta estaba abierta, ese.
      if (margenPropio === undefined || perfil.latencia !== margenPropio) latenciaDeAntes = perfil.latencia;
      margenPropio = undefined;
      s = deFabrica();
      try { perfil.ponerLatencia(latenciaDeAntes); } catch (_) { /* queda como esté */ }
      if (vista === 'sinPermiso') s.permiso = arg === 'sinPedir' ? 'sinPedir' : 'apagado';
      // La campanita tachada: con el permiso de iOS apagado.
      if (vista === 'campanita' && arg === 'sinPermiso') s.permiso = 'apagado';
      if (vista === 'chip') { s.av.deuda = false; s.deAntes.deuda = false; }
      if (vista === 'planDia') s.deNoche = false;
      if (vista === 'armar' || vista === 'sinRutina') s.rutina = { creada: false, antes: 60, pasos: ['luz', 'tranquilo'], alAcostarme: false };
      if (vista === 'nocheEntera') s.variante = 'b';
      // Para ver «ahora» en la noche entera: otra hora de esta noche (en la galería son las 21:47).
      if (vista === 'nocheEntera' && arg && arg.ahora) s.ahora = arg.ahora;
      // Sin reloj, «Cuánto antes te acuestas» dice también que Moss lo descuenta al medir la noche.
      if (vista === 'margen' && arg === 'sinReloj') s.sinReloj = true;
    }
    /** A Sueño, en la noche de hoy y con datos: ahí está la tarjeta del periodo, donde va el plan. */
    function aSueno() {
      g.irA(3, true);
      let cambio = false;
      try {
        cambio = sueno.estado !== 'datos';
        if (cambio) sueno.ponerEstado('datos');
        sueno.verNoche(0);
      } catch (_) { /* Sueño queda como esté */ }
      inyectar();
      return cambio;
    }
    function alPlan(entra) {
      const cambio = aSueno();
      pintarPlan(entra);
      bajarAlPlan(true);
      // Si Sueño venía en otro estado, se rearma con un fundido y vuelve arriba: se baja de nuevo.
      if (cambio) luego(280, () => bajarAlPlan(true));
    }
    const aAvisos = () => { g.irA(4, true); abrirAvisos({ desde: pastilla && pastilla.b }); };
    const VISTAS = {
      campanita(arg) { g.irA(4, true); if (!arg) ponerGlobo(); },
      avisos: aAvisos,
      avisosAbajo() { aAvisos(); irAGrupo('habitos', true); },
      fila(arg) { aAvisos(); const id = typeof arg === 'string' ? arg : 'anotar'; abrirFila(id); irAGrupo((GRUPOS.find(([, filas]) => filas.includes(id)) || ['comidas'])[0], true); },
      comoSeVen(arg) { aAvisos(); luego(quieto() ? 0 : 420, () => abrirBloqueo(av && av.ver, arg && arg.hora)); },
      sinPermiso: aAvisos,
      chip() { aSueno(); scrollDeSueno.scrollTop = 0; },
      // De día, Sueño desde arriba: la fila queda a la vista debajo de la deuda, como al abrir la sección.
      planDia() { aSueno(); pintarPlan(true); scrollDeSueno.scrollTop = 0; },
      sinRutina() { alPlan(true); },
      planNoche() { alPlan(true); },
      nocheEntera() { alPlan(true); },
      armar() { alPlan(false); luego(quieto() ? 0 : 380, () => { abrirArmar(); luego(quieto() ? 0 : 900, () => alternarPaso('ducha')); }); },
      margen() { alPlan(false); luego(quieto() ? 0 : 380, () => abrirMargen()); },
      // En inglés: el plan, y sobre él la hoja de Avisos, abierta desde su aviso; al cerrarla queda el plan.
      en(arg) { alPlan(true); if (arg !== 'plan') luego(quieto() ? 0 : 380, () => abrirAvisos({ desde: enSueno && enSueno.plan && enSueno.plan.querySelector('.avp-teavisa') })); },
    };
    return {
      abrir(vista, arg) {
        if (!VISTAS[vista]) return;
        // Al abrir la propuesta, lo de afuera como está, para devolverlo al cerrarla.
        if (!deAfuera) recordar();
        if (vista === 'en') { if (g.idioma !== 'en') { idiomaDeAntes = idiomaDeAntes || g.idioma; window.__idioma('en'); } } else volverAlIdioma();
        cerrarLoMio();
        reiniciar(vista, arg);
        montarCampana();
        montarEnSueno();
        mirarElCielo();
        if (!vigia) vigia = setInterval(vigilar, 500);
        quitarGlobo(true);
        pintarCampana();
        pintarChip();
        pintarPlan();
        VISTAS[vista](arg);
        idiomaPintado = L().id;
      },
      cerrar() {
        cerrarLoMio();
        clearInterval(vigia);
        vigia = 0;
        desmontarCampana();
        desmontarDeSueno();
        dejarDeMirarElCielo();
        volverAlIdioma();
        devolver();
      },
    };
  },
});
