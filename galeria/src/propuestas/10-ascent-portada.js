// Ascent A, «Portada» (27/11/2026, para aprobar; spec/seccion-ascent.md). La sección vive donde hoy (se baja desde
// Progreso), pero lo que baja es una sola pantalla que no se desliza: el titular de hoy, el aviso si toca y cuatro
// puertas que son preguntas con su respuesta en una línea (¿Qué hago hoy?, ¿Cómo va mi semana?, ¿Estoy mejorando?,
// ¿Llego a mi meta?), el año en una franja y el pie. Cada puerta crece hasta ser su página, que se lee de arriba hacia
// abajo, y vuelve con «‹» o arrastrando hacia abajo.
// - La cara, «Arco»: casi negra; del cuerpo de tu rango, solo su filo iluminado, que entra por la esquina detrás del
//   sello y nunca pasa debajo de un párrafo. El color del rango va en tres lugares: lo elegido, lo que sube (↑) y el
//   relleno «al día» del cuerpo; el terracota, en lo que pone el límite (la fatiga que cambia la sesión, la noche corta).
// - El sello de arriba a la derecha abre el selector de fondo (solo en esta propuesta, para decidir si gusta).
// - Los datos son los de window.AscentDeMentira (05-ascent-datos.js): la misma persona que en B y C. Lo único armado
//   acá son frases cortas con sus números (las puertas) y lo que ve quien guarda una meta nueva, que no se recalcula.

const M = window.AscentDeMentira;
const ID = 'ascentPortada';

// ------------------------------------------------------------ los textos de la propuesta, hasta que se apruebe
const TEXTOS_A = {
  es: {
    ascent: 'Ascent',
    atras: 'Ascent',
    hoy: 'Hoy · {linea}',
    puerta: { hoy: '¿Qué hago hoy?', fue: '¿Cómo fue hoy?', semana: '¿Cómo va mi semana?', fuerza: '¿Estoy mejorando?', metas: '¿Llego a mi meta?' },
    suben: { uno: '1 de {de} sube', otros: '{n} de {de} suben' },
    ninguno: 'Ninguno sube, por ahora',
    pronto: 'Se ve con 6 sesiones',
    primera: 'Tu primera semana',
    todoAlDia: 'Todos al día',
    llega: '{ejercicio}: {ventana}',
    noLlega: '{ejercicio}: así no llega',
    sesionesMeta: '{n} de 6 sesiones',
    sinMeta: 'Ponte una meta',
    enCamino: '{n} de {de}, en camino',
    anio: 'Tu año',
    entrenamientos: { uno: '{n} entrenamiento', otros: '{n} entrenamientos' },
    marcas: { uno: '{n} marca', otros: '{n} marcas' },
    comida: 'Comida: {que}',
    cama: 'Cama: {hora}',
    entendido: 'Entendido',
    bien: 'Me siento bien',
    anotado: 'Anotado: te sientes bien.',
    hitos: 'Cuándo se enciende cada parte',
    basa: 'En qué se basa',
    basaRespuesta: 'Cómo se calcula cada parte',
    basaGrupos: { musculos: 'Tu semana', fatigados: 'La fatiga', estancados: 'Lo que no sube', porQue: 'Por qué puede ser', metas: 'Tus metas' },
    // ¿Qué hago hoy?
    sesionLinea: '{sesion} · {hora}',
    sesionSub: '{resumen} · {duracion}',
    tuSesion: 'Tu sesión, en orden',
    tuSesionHecha: 'Lo que hiciste y la próxima vez',
    comidaCorta: 'Comida',
    tocaPorque: 'Toca un ejercicio para ver por qué.',
    hiciste: 'Hiciste {series}.',
    enTuCuerpo: 'Lo de hoy, en tu cuerpo',
    mananaEnTuCuerpo: 'Lo de mañana, en tu cuerpo',
    listo: 'Listo',
    estimadoLinea: '{texto} · {listo} (estimado)',
    alrededor: 'Alrededor del entreno',
    antes: 'Antes',
    despues: 'Después',
    estaNoche: 'Esta noche',
    // ¿Cómo va mi semana?
    sesionesSemana: { uno: '{n} de {de} sesión', otros: '{n} de {de} sesiones' },
    fueraEl: 'el {dia}, fuera de tu rutina',
    tocaUnMusculo: 'Toca un músculo para ver sus series.',
    musculoLinea: '{n} series en 7 días · {estado}',
    tira: 'Series de cada músculo, en 7 días',
    escala: 'Cada punto es un músculo; la franja es lo ideal, de 10 a 20 series.',
    leSalen: { poco: 'Le faltan: {lista}.', sinEntrenar: 'Sin entrenar: {lista}.', mucho: 'De más: {lista}.' },
    rutina: 'Tu rutina',
    // ¿Estoy mejorando?
    porQue: '¿Por qué no estás mejorando?',
    // ¿Llego a mi meta?
    hoyMeta: 'hoy',
    recalcula: 'Se recalcula con tu próxima sesión.',
    peso: 'Peso',
    borrarPregunta: '¿Borrar la meta de {ejercicio}? No se puede deshacer.',
    no: 'No',
    // Tu año
    ultimas4: 'Las últimas 4 semanas',
    tocaUnDia: 'Toca un día para verlo.',
    // El fondo
    fondo: 'Fondo',
    elegirFondo: 'Elegir el fondo',
    auto: 'Auto',
    autoSub: 'El de tu rango',
    velado: 'Se gana en Ascent',
    desliza: 'Desliza: el fondo cambia en vivo.',
    presencia: 'Presencia',
    tenue: 'Tenue',
    protagonista: 'Protagonista',
    encuadre: 'Encuadre',
    encuadres: { esquina: 'Esquina', horizonte: 'Horizonte', lejos: 'Lejos' },
    soloCielo: 'Solo el cielo de Moss',
    cerrar: 'Cerrar',
    cuerpos: { polvo: 'Polvo', asteroide: 'Asteroide', luna: 'Luna', planeta: 'Planeta', sol: 'Sol', galaxia: 'Galaxia', agujeroNegro: 'Agujero negro' },
  },
  en: {
    ascent: 'Ascent',
    atras: 'Ascent',
    hoy: 'Today · {linea}',
    puerta: { hoy: 'What do I do today?', fue: 'How did today go?', semana: 'How’s my week going?', fuerza: 'Am I getting stronger?', metas: 'Will I reach my goal?' },
    suben: { uno: '1 of {de} going up', otros: '{n} of {de} going up' },
    ninguno: 'None going up yet',
    pronto: 'Shows after 6 sessions',
    primera: 'Your first week',
    todoAlDia: 'All on track',
    llega: '{ejercicio}: {ventana}',
    noLlega: '{ejercicio}: not at this pace',
    sesionesMeta: '{n} of 6 sessions',
    sinMeta: 'Set a goal',
    enCamino: '{n} of {de} on pace',
    anio: 'Your year',
    entrenamientos: { uno: '{n} workout', otros: '{n} workouts' },
    marcas: { uno: '{n} PR', otros: '{n} PRs' },
    comida: 'Food: {que}',
    cama: 'Bed: {hora}',
    entendido: 'Got it',
    bien: 'I feel fine',
    anotado: 'Noted: you feel fine.',
    hitos: 'When each part turns on',
    basa: 'What it’s based on',
    basaRespuesta: 'How each part is worked out',
    basaGrupos: { musculos: 'Your week', fatigados: 'Fatigue', estancados: 'What isn’t going up', porQue: 'Why it might be', metas: 'Your goals' },
    sesionLinea: '{sesion} · {hora}',
    sesionSub: '{resumen} · {duracion}',
    tuSesion: 'Your session, in order',
    tuSesionHecha: 'What you did, and next time',
    comidaCorta: 'Food',
    tocaPorque: 'Tap an exercise to see why.',
    hiciste: 'You did {series}.',
    enTuCuerpo: 'Today’s muscles',
    mananaEnTuCuerpo: 'Tomorrow’s muscles',
    listo: 'Ready',
    estimadoLinea: '{texto} · {listo} (an estimate)',
    alrededor: 'Around your workout',
    antes: 'Before',
    despues: 'After',
    estaNoche: 'Tonight',
    sesionesSemana: { uno: '{n} of {de} session', otros: '{n} of {de} sessions' },
    fueraEl: '{dia}, outside your routine',
    tocaUnMusculo: 'Tap a muscle to see its sets.',
    musculoLinea: '{n} sets in 7 days · {estado}',
    tira: 'Sets per muscle, last 7 days',
    escala: 'Each dot is a muscle; the band is the ideal, 10 to 20 sets.',
    leSalen: { poco: 'Need more: {lista}.', sinEntrenar: 'Not trained: {lista}.', mucho: 'Too much: {lista}.' },
    rutina: 'Your routine',
    porQue: 'Why aren’t you getting stronger?',
    hoyMeta: 'today',
    recalcula: 'It’s worked out again after your next session.',
    peso: 'Weight',
    borrarPregunta: 'Delete the {ejercicio} goal? This can’t be undone.',
    no: 'No',
    ultimas4: 'The last 4 weeks',
    tocaUnDia: 'Tap a day to see it.',
    fondo: 'Background',
    elegirFondo: 'Choose the background',
    auto: 'Auto',
    autoSub: 'Your rank’s',
    velado: 'Earned in Ascent',
    desliza: 'Swipe: the background changes live.',
    presencia: 'Presence',
    tenue: 'Faint',
    protagonista: 'Bold',
    encuadre: 'Framing',
    encuadres: { esquina: 'Corner', horizonte: 'Horizon', lejos: 'Far' },
    soloCielo: 'Only Moss’s sky',
    cerrar: 'Close',
    cuerpos: { polvo: 'Dust', asteroide: 'Asteroid', luna: 'Moon', planeta: 'Planet', sol: 'Sun', galaxia: 'Galaxy', agujeroNegro: 'Black hole' },
  },
};

// ------------------------------------------------------------ cómo se ve
// Casi negra; tinta clara y grises (as-vars). El color del rango (--as-claro) solo en lo elegido, lo que sube y el
// relleno «al día»; el terracota (--as-lejos), en lo que pone el límite. Todo lo que se mueve, con la misma curva.
const CSS = `
.tel .pr-pantalla.apo { color: var(--as-tinta); background: #05060a; animation-name: apo-baja; --apo-p: 0.5; --apo-rgb: 214, 212, 226;
  /* Lo que sube, en el color del rango pero más claro: con el rango 1 (gris) igual tiene que verse más que lo igual. */
  --apo-sube: color-mix(in srgb, var(--as-claro) 68%, #ffffff); }
.tel .pr-pantalla.apo.saliendo { animation-name: apo-se-va; }
@keyframes apo-baja { from { opacity: 0; transform: translateY(-20px); } }
@keyframes apo-se-va { to { opacity: 0; transform: translateY(-24px); } }
/* La sombra de abajo (para leer sobre la barra) es de las páginas, que se deslizan; la portada no. */
.tel .pr-pantalla.apo::after { z-index: 6; opacity: 0; transition: opacity 0.3s; }
.tel .pr-pantalla.apo.con-pagina::after { opacity: 1; }
/* Sin peso propio (:where): las clases de abajo mandan. */
:where(.apo) button { -webkit-tap-highlight-color: transparent; }
:where(.apo) :where(p, h2, h3, ol, ul, dl, dd, hr) { margin: 0; padding: 0; }
.apo :focus-visible { outline: 2px solid var(--as-claro); outline-offset: 2px; }
.apo .apo-oculto { position: absolute; width: 0; height: 0; overflow: hidden; }

/* ---- el cielo: estrellas tenues y el cuerpo del rango, detrás de todo */
.apo-cielo { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; transition: opacity 0.35s; }
.apo-estrellas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.26; transition: opacity 0.8s; }
.apo-aurora { position: absolute; left: -30%; right: -30%; top: -12%; height: 52%; opacity: 0; transition: opacity 0.9s;
  background: radial-gradient(48% 42% at 34% 34%, rgba(92, 196, 150, 0.11), transparent 72%), radial-gradient(40% 36% at 74% 22%, rgba(96, 120, 214, 0.12), transparent 72%); }
.apo.solo-cielo .apo-estrellas { opacity: 0.85; }
.apo.solo-cielo .apo-aurora { opacity: 1; }
.apo.solo-cielo .apo-cielo .apo-astro { opacity: 0 !important; }
.apo-astro { position: absolute; transition: opacity 0.6s; }
/* La esfera: un disco casi negro con el dibujo del cuerpo apenas, y su filo encendido del lado que mira a la pantalla. */
.apo-disco { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; background: #06070b;
  box-shadow: 0 0 calc(16px + var(--apo-p) * 34px) rgba(var(--apo-rgb), calc(0.08 + var(--apo-p) * 0.24)); }
.apo-disco > svg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: calc(0.08 + var(--apo-p) * 0.62); transform: rotate(var(--apo-giro, 225deg)); }
/* El horizonte queda debajo de la hora: más oscuro, que se lea. */
.apo-astro.horizonte .apo-disco > svg { opacity: calc(0.04 + var(--apo-p) * 0.36); }
.apo-disco::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at var(--apo-luz, 18% 82%), rgba(var(--apo-rgb), calc(0.05 + var(--apo-p) * 0.16)), transparent 46%); }
.apo-filo { position: absolute; inset: -0.5px; border-radius: 50%; opacity: calc(0.5 + var(--apo-p) * 0.5);
  background: conic-gradient(from var(--apo-desde, 0deg), rgba(var(--apo-rgb), 0) 0deg 172deg, rgba(var(--apo-rgb), 0.5) 204deg, rgba(var(--apo-rgb), 1) 232deg, rgba(var(--apo-rgb), 0.55) 262deg, rgba(var(--apo-rgb), 0) 296deg 360deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
/* Esquina: el filo entra por arriba a la derecha, pasa detrás del sello y sale por el borde antes del titular. */
.apo-astro.esquina { width: 400px; height: 400px; right: -307px; top: -240px; }
/* Horizonte: el borde de un cuerpo enorme, arriba de todo, como visto desde la órbita. */
.apo-astro.horizonte { width: 1900px; height: 1900px; left: calc(50% - 950px); top: -1846px; --apo-giro: 180deg; --apo-desde: -52deg; --apo-luz: 50% 100%; }
/* Lejos: el cuerpo entero, chico, en el cielo entre la isla y el sello. */
.apo-astro.lejos { width: 46px; height: 46px; right: 70px; top: 10px; --apo-desde: -7deg; --apo-luz: 26% 74%; }
.apo-astro.lejos .apo-disco { box-shadow: 0 0 calc(6px + var(--apo-p) * 14px) rgba(var(--apo-rgb), calc(0.12 + var(--apo-p) * 0.3)); }
.apo-astro.lejos .apo-disco > svg { opacity: calc(0.4 + var(--apo-p) * 0.6); }
.apo-astro.lejos .apo-filo { background: conic-gradient(from -7deg, rgba(var(--apo-rgb), 0) 0deg 120deg, rgba(var(--apo-rgb), 0.9) 200deg 250deg, rgba(var(--apo-rgb), 0) 330deg 360deg); }
/* El polvo (rango 1) no tiene borde: es una nube; en la esquina se ve un arco de polvo, en el horizonte una franja. */
.apo-astro.polvo { width: 560px; height: 380px; opacity: calc(0.45 + var(--apo-p) * 0.55); }
.apo-astro.polvo .apo-nube { position: absolute; inset: 0; }
/* El anillo es el mismo borde de la esfera (centro arriba a la derecha, 200 px de radio) y pasa por el corazón de la
   nube: en la esquina se ve un arco de polvo. */
.apo-astro.polvo.esquina { right: -217px; top: -130px;
  -webkit-mask: radial-gradient(circle at 450px 90px, transparent 158px, #000 186px, #000 214px, transparent 252px); mask: radial-gradient(circle at 450px 90px, transparent 158px, #000 186px, #000 214px, transparent 252px); }
.apo-astro.polvo.horizonte { left: calc(50% - 280px); top: -236px; transform: scaleX(1.25);
  -webkit-mask: linear-gradient(180deg, #000 52%, transparent 80%); mask: linear-gradient(180deg, #000 52%, transparent 80%); }
.apo-astro.polvo.lejos { right: -177px; top: -158px; width: 560px; height: 380px; transform: scale(0.15); }

/* ---- el sello: el ícono de Ascent, arriba a la derecha; abre el fondo */
.apo-sello { position: absolute; z-index: 5; top: calc(var(--arriba) - 1px); right: 10px; width: 50px; height: 50px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-sello:active { transform: scale(0.94); }
.apo-sello { transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.25s; }
.apo-sello.apagado { opacity: 0; pointer-events: none; }
.apo-sello svg.as-marca { width: 44px; height: 44px; }

/* ---- la portada: una sola pantalla, sin scroll */
.apo-portada { position: absolute; z-index: 1; left: 0; right: 0; top: var(--arriba); bottom: var(--pestanas); display: flex; flex-direction: column; padding: 0 22px 2px; overflow: hidden; touch-action: none; transition: opacity 0.3s; }
.apo.con-bandeja .apo-portada { opacity: 0.18; }
.apo-portada.entra .apo-e { animation: apo-asienta 0.46s var(--d, 0ms) cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes apo-asienta { from { opacity: 0; transform: translateY(8px); } }
.apo-cab { flex: none; display: flex; align-items: center; height: 44px; margin-right: 64px; }
.apo-nombre { font: 500 13px/1 var(--texto); letter-spacing: 0.24em; text-transform: uppercase; color: var(--as-sub); }
.apo-ayuda { width: 44px; height: 44px; display: grid; place-items: center; margin-left: 2px; padding: 0; border: 0; background: none; cursor: pointer; color: var(--as-apagado); }
.apo-ayuda span { width: 22px; height: 22px; display: grid; place-items: center; border: 1px solid var(--as-linea-fuerte); border-radius: 50%; font: 400 13px/1 var(--texto); transition: border-color 0.2s, color 0.2s; }
.apo-ayuda:active span { border-color: var(--as-sub); color: var(--as-tinta); }
.apo-cuando { flex: none; font: 400 13.5px/1.3 var(--texto); color: var(--as-sub); }
/* El titular empieza debajo de donde el filo sale por el borde: puede usar todo el ancho. */
.apo-titular { flex: none; margin-top: 4px; font: 200 42px/1.04 var(--numeros); letter-spacing: -0.02em; color: var(--as-tinta); text-wrap: balance; }

/* El aviso, o la nota de una línea: siempre en el mismo lugar, debajo del titular. */
/* Lo que sobra de alto (sin aviso) queda entre la nota y las puertas: arriba lo de hoy, abajo las puertas. */
.apo-nota-caja { flex: none; margin-top: 14px; margin-bottom: auto; overflow: hidden; }
.apo-aviso { display: grid; grid-template-columns: 18px minmax(0, 1fr); column-gap: 10px; }
.apo-aviso-fase, .apo-chica-fase { color: var(--as-lejos); }
.apo-aviso-fase .am-fase, .apo-chica-fase .am-fase { width: 14px; height: 14px; margin-top: 3px; }
.apo-aviso-quien { font: 400 15.5px/1.3 var(--texto); color: var(--as-tinta); }
.apo-aviso-quien b { font-weight: 400; color: var(--as-lejos); }
.apo-aviso-texto { margin-top: 3px; font: 400 14px/1.42 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.apo-aviso-texto .corto, .apo.chica .apo-aviso-texto .largo { display: none; }
.apo.chica .apo-aviso-texto .corto { display: inline; }
.apo-aviso-pide { margin-top: 4px; font: 400 14px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.apo-aviso-botones { display: flex; gap: 8px; margin-top: 4px; margin-left: -2px; }
/* Se tocan en 44 px; la pastilla que se ve, de 36, va adentro (::before). */
.apo-pastilla { position: relative; height: 44px; min-width: 88px; padding: 0 16px; border: 0; background: none; cursor: pointer; font: 400 14px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.apo-pastilla::before { content: ''; position: absolute; inset: 4px 0; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; transition: background-color 0.15s, border-color 0.15s; }
.apo-pastilla:active::before { background: rgba(232, 236, 246, 0.07); border-color: var(--as-sub); }
.apo-chica { display: grid; grid-template-columns: 18px minmax(0, 1fr); column-gap: 10px; font: 400 14px/1.42 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.apo-chica.sin-fase { grid-template-columns: minmax(0, 1fr); }
.apo-chica .apo-chica-fase.suave { color: var(--as-sub); }
.apo-chica b { font-weight: 400; color: var(--as-lejos); }
.apo-chica em { font-style: normal; color: var(--as-tinta); }
/* Recién vinculada: lo que ya se sabe y cuándo se enciende lo demás. */
.apo-nueva-texto { font: 400 14.5px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.apo-hitos { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 6px; padding-top: 24px; list-style: none; }
.apo-hitos::before { content: ''; position: absolute; left: 12.5%; right: 12.5%; top: 29px; border-top: 1px solid var(--as-linea-fuerte); }
.apo-hito { position: relative; text-align: center; padding: 0 3px; }
.apo-hito i { position: relative; display: block; width: 11px; height: 11px; margin: 0 auto; border-radius: 50%; border: 1px solid var(--as-sub); background: #05060a; }
.apo-hito.alcanzado i { background: var(--as-tinta); border-color: var(--as-tinta); }
.apo-hito b { display: block; margin-top: 8px; font: 400 13px/1.25 var(--texto); color: var(--as-tinta); }
.apo-hito span { display: block; margin-top: 2px; font: 400 13px/1.25 var(--texto); color: var(--as-sub); }
.apo-hito:not(.alcanzado) b { color: var(--as-sub); }
.apo-hito:not(.alcanzado) span { color: var(--as-apagado); }
.apo-aqui { position: absolute; top: -1px; left: var(--x); translate: -50% 0; font: 400 13px/1 var(--texto); color: var(--as-claro); white-space: nowrap; }
.apo-aqui::after { content: ''; position: absolute; left: 50%; top: 24px; width: 7px; height: 7px; margin-left: -3.5px; border-radius: 50%; background: var(--as-claro); box-shadow: 0 0 0 4px rgba(5, 6, 10, 0.9); animation: apo-late 2.4s ease-in-out infinite; }
@keyframes apo-late { 50% { box-shadow: 0 0 0 4px rgba(5, 6, 10, 0.9), 0 0 0 8px rgba(var(--apo-rgb), 0.16); } }

/* ---- las cuatro puertas: celdas con línea de pelo, no cajas */
.apo-puertas { flex: 1 1 auto; max-height: 380px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, minmax(min-content, 1fr)); margin: 16px -22px 0; border-top: 1px solid var(--as-linea); border-bottom: 1px solid var(--as-linea); }
.apo-puerta { position: relative; display: flex; flex-direction: column; min-width: 0; padding: 12px 14px 12px 22px; border: 0; background: none; text-align: left; cursor: pointer; transition: background-color 0.2s; }
.apo-puerta:nth-child(2n) { padding: 12px 22px 12px 16px; }
.apo-puerta:nth-child(-n+2) { border-bottom: 1px solid var(--as-linea); }
.apo-puerta:nth-child(2n+1) { border-right: 1px solid var(--as-linea); }
.apo-puerta:active { background: rgba(232, 236, 246, 0.035); }
.apo-preg { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; font: 400 13.5px/1.25 var(--texto); color: var(--as-sub); }
.apo-chev { flex: none; width: 13px; height: 13px; margin-top: 1px; fill: none; stroke: var(--as-tenue); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
/* El dibujo toma el alto que le deja la celda (más grande sin aviso), con un mínimo. */
.apo-dib { flex: 1 1 auto; display: flex; align-items: center; min-height: 50px; margin: 4px 0; container-type: size; }
.apo-resp { font: 400 15px/1.28 var(--texto); color: var(--as-tinta); text-wrap: balance; }
/* Los dibujos chicos de las puertas. */
.apo-flechas { display: flex; gap: 2px; }
.apo-flecha { display: block; width: clamp(22px, 30cqh, 27px); text-align: center; font: 300 clamp(23px, 32cqh, 29px)/1 var(--numeros); color: var(--as-sub); }
.apo-flecha.igual { color: var(--as-apagado); }
.apo-flecha.sube { color: var(--apo-sube); }
.apo-flecha.nada { color: var(--as-tenue); }
.apo-figuras { display: flex; gap: 5px; height: clamp(50px, 100cqh, 86px); }
.apo-figuras > span { display: block; height: 100%; aspect-ratio: 100 / 188; }
.apo-figuras .am-figura { width: 100%; height: 100%; }
.apo-trazos { display: flex; gap: 3px; height: clamp(44px, 70cqh, 58px); }
.apo-trazo { display: block; width: 19px; height: 100%; }
.apo-trazo svg { display: block; width: 100%; height: 100%; overflow: visible; }
.apo-trazo path { fill: none; stroke: var(--as-sub); stroke-width: 1.8; stroke-linecap: round; }
.apo-trazo circle { fill: var(--as-sub); }
.apo-trazo.sube path { stroke: var(--apo-sube); stroke-width: 2.2; }
.apo-trazo.sube circle { fill: var(--apo-sube); }
.apo-trazo:not(.sube) path { stroke: var(--as-apagado); }
.apo-trazo:not(.sube) circle { fill: var(--as-apagado); }
.apo-trazo.noSeSabe path, .apo-trazo.vacio path { stroke: var(--as-tenue); stroke-dasharray: 2 3; }
.apo-trazo.noSeSabe circle, .apo-trazo.vacio circle { fill: none; }
.apo-pista { display: block; width: 100%; height: 44px; overflow: visible; }
.apo-pista .linea { stroke: var(--as-linea-fuerte); stroke-width: 1.4; stroke-linecap: round; }
.apo-pista .linea.no { stroke-dasharray: 2 4; }
.apo-pista .hoy { fill: var(--as-tinta); }
.apo-pista .ventana { fill: color-mix(in srgb, var(--as-claro) 24%, transparent); stroke: var(--as-claro); stroke-width: 1; stroke-opacity: 0.55; }
.apo-pista .meta { fill: var(--as-sub); font: 400 13px var(--numeros); }
.apo-pista .mes { fill: var(--as-apagado); font: 400 13px var(--texto); }
.apo-pista .tic { stroke: var(--as-linea-fuerte); stroke-width: 1; }
.apo-pista .fin { fill: var(--as-apagado); font: 400 13px var(--numeros); }
.apo-sesiones6 { display: flex; gap: 5px; align-items: center; }
.apo-sesiones6 i { width: 13px; height: 13px; border-radius: 50%; border: 1px solid var(--as-sub); }
.apo-sesiones6 i.hecha { background: var(--as-tinta); border-color: var(--as-tinta); }
.apo-barras { display: flex; align-items: flex-end; gap: 6px; height: 50px; }
.apo-barras i { position: relative; display: block; width: 16px; border-radius: 2px 2px 0 0; background: var(--as-sub); }
.apo-barras i:first-child { background: var(--as-tinta); }
.apo-barras i + i { opacity: 0.6; }
.apo-barras i b { position: absolute; left: 50%; bottom: calc(100% + 3px); translate: -50% 0; font: 400 13px/1 var(--numeros); color: var(--as-sub); }

/* ---- el año, en una franja */
.apo-anio-fila { flex: none; display: flex; align-items: center; gap: 12px; width: calc(100% + 44px); min-height: 50px; margin: 0 -22px; padding: 0 22px; border: 0; border-bottom: 1px solid var(--as-linea); background: none; cursor: pointer; text-align: left; transition: background-color 0.2s; }
.apo-anio-fila:active { background: rgba(232, 236, 246, 0.035); }
.apo-anio-etq { flex: none; font: 400 13.5px/1.2 var(--texto); color: var(--as-sub); }
/* Las últimas cuatro semanas, como un renglón del mapa del año: un cuadrito por día, el punto es una marca. */
.apo-tira { flex: 1 1 auto; display: flex; gap: 2.5px; align-items: center; height: 14px; }
.apo-tira i { position: relative; flex: 1 1 0; max-width: 9px; aspect-ratio: 1; border-radius: 2px; background: rgba(170, 178, 196, 0.12); }
.apo-tira i.entreno { background: rgba(232, 236, 246, 0.58); }
.apo-tira i.marca::after { content: ''; position: absolute; left: 50%; top: 50%; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: #05060a; }
.apo-tira i.hoy { box-shadow: 0 0 0 1px var(--as-tinta); background: transparent; }
.apo-anio-n { flex: none; font: 300 21px/1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.apo-anio-fila .apo-chev { align-self: center; margin: 0; }

/* ---- el pie */
.apo-pie { flex: none; padding-top: 4px; }
.apo-pie-linea { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 44px; padding: 0; border: 0; background: none; cursor: pointer; font: 400 13.5px/1.3 var(--texto); color: var(--as-sub); }
.apo-pie-linea i { font-style: normal; color: var(--as-tenue); }
.apo-volver { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; min-height: 44px; padding: 0; border: 0; background: none; cursor: pointer; font: 400 14px/1.2 var(--texto); color: var(--as-sub); }
.apo-volver svg { width: 16px; height: 16px; margin-top: 1px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
/* Un iPhone chico: lo que no entra se acomoda (el año pasa adentro de «¿Llego a mi meta?»). */
.apo.sin-anio .apo-portada .apo-anio-fila { display: none; }
/* Sin la línea de la hora, la puerta de hoy dice la sesión y su hora en lugar del resumen. */
.apo-resp-hora { display: none; }
.apo.sin-cuando .apo-puerta[data-puerta="hoy"] .apo-resp.con-hora { display: none; }
.apo.sin-cuando .apo-resp-hora { display: block; }
.apo.chica .apo-titular { font-size: 34px; }
.apo.chica .apo-dib { min-height: 40px; margin: 2px 0; }
.apo.chica .apo-figuras { height: 40px; }
.apo.chica .apo-trazos { height: 40px; }
.apo.chica .apo-puerta { padding-top: 9px; padding-bottom: 9px; }
.apo.chica .apo-nota-caja { margin-top: 10px; }
.apo.chica .apo-puertas { margin-top: 12px; }
.apo.chica .apo-aviso-texto, .apo.chica .apo-aviso-pide, .apo.chica .apo-chica { font-size: 13.5px; line-height: 1.38; }
.apo.sin-pie .apo-pie-linea { display: none; }
.apo.sin-cuando .apo-cuando { display: none; }
.apo.sin-dibujos .apo-puerta .apo-dib { display: none; }
.apo.sin-dibujos .apo-puerta .apo-resp { margin-top: 8px; }
/* Recién vinculada: tres puertas (lo que sube y el año esperan datos); la de las metas, a lo ancho. */
.apo-puertas.tres .apo-puerta:nth-child(3) { grid-column: 1 / -1; border-right: 0; padding-right: 22px; }

/* ---- la página de cada puerta: crece desde su celda */
.apo-pagina { position: absolute; inset: 0; z-index: 3; background: #07080d; will-change: clip-path, transform; }
.apo-pag-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) + 0px) 22px calc(var(--pestanas) + 48px); scrollbar-width: none; touch-action: pan-y; }
.apo-pag-scroll::-webkit-scrollbar { display: none; }
.apo-pagina.dt-con-teclado .apo-pag-scroll { padding-bottom: calc(var(--dt-teclado, 300px) + 40px); }
.apo-pagina.entra .apo-e { animation: apo-asienta 0.4s var(--d, 0ms) cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.apo-pag-cab { display: flex; align-items: center; height: 48px; margin: 0 64px 0 -14px; }
.apo-atras { display: inline-flex; align-items: center; height: 44px; padding: 0 12px 0 4px; border: 0; background: none; cursor: pointer; font: 400 15px/1 var(--texto); color: var(--as-tinta); }
.apo-atras svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.apo-pag-preg { display: block; width: max-content; max-width: 100%; margin-top: 10px; font: 400 13.5px/1.25 var(--texto); color: var(--as-sub); }
.apo-pag-resp { margin-top: 6px; max-width: 300px; font: 200 31px/1.1 var(--numeros); letter-spacing: -0.015em; color: var(--as-tinta); text-wrap: balance; }
.apo-pag-sub { margin-top: 8px; font: 400 14.5px/1.42 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.apo-pag-sub b { font-weight: 400; color: var(--as-lejos); }
.apo-sep { height: 0; margin: 24px -22px 0; border: 0; border-top: 1px solid var(--as-linea); }
.apo-sep.fino { margin: 0; border-top-color: rgba(48, 55, 72, 0.62); }
.apo-tit { margin-top: 16px; font: 400 13.5px/1.25 var(--texto); color: var(--as-sub); }
.apo-texto { margin-top: 8px; font: 400 14.5px/1.45 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.apo-nota { margin-top: 10px; font: 400 13px/1.42 var(--texto); color: var(--as-apagado); text-wrap: pretty; }
.apo-enlace { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0; border: 0; background: none; cursor: pointer; font: 400 14px/1.2 var(--texto); color: var(--as-tinta); text-decoration: underline; text-decoration-color: rgba(232, 236, 246, 0.35); text-underline-offset: 4px; }
/* La puerta a «¿Por qué no estás mejorando?»: sin subrayado, con su flecha, como en las filas de «¿Estoy mejorando?». */
.apo-enlace.apo-porque { display: flex; gap: 6px; margin-top: 2px; text-decoration: none; }
.apo-enlace.apo-porque .apo-chev { width: 14px; height: 14px; margin: 0; stroke: var(--as-sub); }
.apo-boton-ancho { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 50px; margin-top: 18px; padding: 0 16px 0 18px; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; background: rgba(232, 236, 246, 0.025); cursor: pointer; font: 400 15px/1.2 var(--texto); color: var(--as-tinta); text-align: left; transition: background-color 0.15s, border-color 0.15s; }
.apo-boton-ancho:active { background: rgba(232, 236, 246, 0.07); border-color: var(--as-sub); }
.apo-boton-ancho .apo-chev { stroke: var(--as-sub); width: 15px; height: 15px; }
/* Lo que se despliega en su lugar y empuja lo de abajo. */
.apo-pliegue { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.4s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-pliegue > * { min-height: 0; overflow: hidden; opacity: 0; transition: opacity 0.3s; }
.apo-pliegue.abierto { grid-template-rows: 1fr; }
.apo-pliegue.abierto > * { opacity: 1; }
.apo-desplegar { display: flex; align-items: center; gap: 6px; min-height: 44px; margin-top: 14px; padding: 0; border: 0; background: none; cursor: pointer; font: 400 14px/1.2 var(--texto); color: var(--as-sub); }
.apo-desplegar svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-desplegar[aria-expanded="true"] { color: var(--as-tinta); }
.apo-desplegar[aria-expanded="true"] svg { rotate: 180deg; }
.apo-basa p { margin-top: 8px; font: 400 13.5px/1.45 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.apo-basa h3 { margin: 18px 0 0; font: 400 14px/1.3 var(--texto); color: var(--as-tinta); }

/* ¿Qué hago hoy?: la sesión en orden, cada ejercicio con su flecha. */
.apo-ej { display: grid; grid-template-columns: 30px minmax(0, 1fr); column-gap: 8px; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; }
.apo-ej .apo-flecha { width: 30px; padding-top: 13px; font-size: 25px; }
.apo-ej .apo-flecha.sube { font-weight: 400; }
.apo-ej-texto { display: block; padding: 12px 0; border-top: 1px solid rgba(48, 55, 72, 0.62); }
.apo-tit + .apo-ej .apo-ej-texto { border-top: 0; }
.apo-ej-fila { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.apo-ej-nombre { font: 400 15.5px/1.3 var(--texto); color: var(--as-tinta); }
.apo-ej-peso { flex: none; font: 400 15px/1.3 var(--numeros); color: var(--as-sub); white-space: nowrap; font-variant-numeric: tabular-nums; }
.apo-ej-peso.sube { color: var(--apo-sube); font-weight: 500; }
.apo-ej-plan { display: block; margin-top: 2px; font: 400 13px/1.3 var(--texto); color: var(--as-apagado); }
.apo-ej-porque { font: 400 13.5px/1.42 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.apo-ej-porque span { display: block; padding-top: 6px; }
.apo-ej[aria-expanded="true"] .apo-ej-nombre { color: var(--as-tinta); }
.apo-musc { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; column-gap: 10px; align-items: baseline; padding: 10px 0; border-top: 1px solid rgba(48, 55, 72, 0.62); }
.apo-musc:first-of-type { border-top: 0; }
.apo-musc .am-fase { width: 13px; height: 13px; color: var(--as-sub); translate: 0 1px; }
.apo-musc.limita .am-fase { color: var(--as-lejos); }
.apo-musc-nombre { font: 400 15px/1.3 var(--texto); color: var(--as-tinta); }
.apo-musc-dato { font: 400 13.5px/1.3 var(--texto); color: var(--as-sub); text-align: right; }
.apo-musc.limita .apo-musc-dato { color: var(--as-lejos); }
.apo-fases-leyenda { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font: 400 13px/1.3 var(--texto); color: var(--as-apagado); }
.apo-fases-leyenda span { display: inline-flex; align-items: center; gap: 6px; }
.apo-fases-leyenda .am-fase { width: 12px; height: 12px; color: var(--as-sub); }
.apo-alrededor { display: grid; grid-template-columns: 84px minmax(0, 1fr); column-gap: 12px; row-gap: 12px; margin-top: 12px; }
.apo-alrededor dt { font: 400 13.5px/1.42 var(--texto); color: var(--as-sub); }
.apo-alrededor dd { margin: 0; font: 400 14.5px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.apo-barras.grande { height: 110px; gap: 12px; margin-top: 18px; }
.apo-barras.grande i { width: 46px; }
.apo-barras.grande i b { font-size: 14px; }

/* ¿Cómo va mi semana?: los siete días, el cuerpo grande y la tira de puntos. */
.apo-dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 18px; }
.apo-dia { display: flex; flex-direction: column; align-items: center; gap: 7px; }
.apo-dia small { font: 400 13px/1 var(--texto); color: var(--as-apagado); }
.apo-dia i { width: 16px; height: 16px; border-radius: 50%; border: 1px solid transparent; }
.apo-dia.descanso i { width: 5px; height: 5px; margin: 5.5px 0; background: var(--as-tenue); }
.apo-dia.toca i { border-color: var(--as-sub); }
.apo-dia.hecho i { background: var(--as-tinta); border-color: var(--as-tinta); }
.apo-dia.fuera i { background: transparent; border: 1.5px dashed var(--as-tinta); }
.apo-dia.hoy small { color: var(--as-tinta); }
.apo-dia.hoy.toca:not(.hecho) i { border-color: var(--as-claro); box-shadow: inset 0 0 0 3px #07080d, inset 0 0 0 9px var(--as-claro); }
.apo-dias-linea { margin-top: 12px; font: 400 13.5px/1.4 var(--texto); color: var(--as-sub); text-align: center; }
.apo-cuerpos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 6px 0; }
.apo-cuerpos > span { display: block; aspect-ratio: 100 / 188; }
.apo-cuerpos .am-figura { width: 100%; height: 100%; cursor: pointer; }
.apo-musculo-linea { min-height: 42px; margin-top: 12px; font: 400 14.5px/1.42 var(--texto); color: var(--as-sub); text-align: center; text-wrap: balance; transition: color 0.3s; }
.apo-musculo-linea b { font-weight: 400; color: var(--as-tinta); }
.apo-musculo-linea span { display: block; }
.apo-musculo-linea .fatiga { color: var(--as-sub); }
.apo-musculo-linea .fatiga.limita { color: var(--as-lejos); }
.apo-leyenda { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px; margin-top: 10px; font: 400 13px/1.2 var(--texto); color: var(--as-sub); }
.apo-leyenda span { display: inline-flex; align-items: center; gap: 7px; }
.apo-leyenda i { width: 12px; height: 12px; border-radius: 2px; }
.apo-leyenda .poco { background: repeating-linear-gradient(45deg, rgba(232, 236, 246, 0.6) 0 1px, transparent 1px 3.2px); box-shadow: inset 0 0 0 1px rgba(232, 236, 246, 0.25); }
.apo-leyenda .enSuPunto { background: var(--as-claro); }
.apo-leyenda .entrenado { background: color-mix(in srgb, var(--as-claro) 62%, transparent); }
.apo-leyenda .mucho { background: #e2b878; }
.apo-leyenda .sinEntrenar { background: rgba(170, 178, 196, 0.16); }
.apo-leyenda .fatigado { border: 1px dashed var(--as-sub); border-radius: 50%; }
.apo-puntos { display: block; width: 100%; height: auto; margin-top: 10px; overflow: visible; }
.apo-puntos .banda { fill: rgba(170, 178, 196, 0.1); }
.apo-puntos .eje { stroke: var(--as-linea-fuerte); stroke-width: 1; }
.apo-puntos .num { fill: var(--as-apagado); font: 400 13px var(--numeros); text-anchor: middle; }
.apo-puntos .punto { stroke-width: 1.3; transition: r 0.25s, stroke 0.25s; }
.apo-puntos .punto.poco { fill: url(#apo-rayas); stroke: rgba(232, 236, 246, 0.6); }
.apo-puntos .punto.enSuPunto, .apo-puntos .punto.entrenado { fill: var(--as-claro); stroke: none; }
.apo-puntos .punto.mucho { fill: #e2b878; stroke: none; }
.apo-puntos .punto.sinEntrenar { fill: #07080d; stroke: var(--as-apagado); }
.apo-puntos .punto.elegido { stroke: var(--as-tinta); stroke-width: 2; }
.apo-puntos .toque { fill: transparent; cursor: pointer; }
/* El cuerpo: «al día» lleno del color del rango; «le faltan», rayado (no depende del rango: con el 1 es gris). */
.apo .am-figura .am-base { fill: rgba(170, 178, 196, 0.07); }
.apo .am-figura .am-m { fill: rgba(170, 178, 196, 0.12); stroke: #07080d; stroke-width: 0.9; stroke-dasharray: none; }
.apo .am-figura .am-m.poco { fill: url(#apo-rayas); }
.apo .am-figura .am-m.enSuPunto, .apo .am-figura .am-m.hoy { fill: var(--as-claro); fill-opacity: 0.92; }
.apo .am-figura .am-m.entrenado { fill: var(--as-claro); fill-opacity: 0.62; }
.apo .am-figura .am-m.mucho { fill: #e2b878; fill-opacity: 0.9; }
.apo .am-figura .am-m.manana { fill: var(--as-claro); fill-opacity: 0.42; }
.apo .am-figura .am-m.fatigado { stroke: var(--as-sub); stroke-width: 0.9; stroke-dasharray: 1.8 1.4; }
.apo .am-figura .am-m.limita { stroke: var(--as-lejos); stroke-width: 1.1; }
.apo .am-figura .am-m.elegido { stroke: var(--as-tinta); stroke-width: 1.8; stroke-dasharray: none; }
.apo-rutina { margin-top: 6px; font: 200 26px/1.1 var(--numeros); color: var(--as-tinta); }

/* ¿Estoy mejorando?: cada ejercicio con su chispa y su veredicto. */
.apo-fz { display: grid; grid-template-columns: minmax(0, 1fr) 128px; column-gap: 14px; align-items: center; width: 100%; padding: 14px 0; border: 0; background: none; text-align: left; }
button.apo-fz { cursor: pointer; }
.apo-fz-nombre { display: flex; align-items: center; gap: 6px; font: 400 15.5px/1.3 var(--texto); color: var(--as-tinta); }
.apo-fz-nombre .apo-chev { stroke: var(--as-sub); }
.apo-fz-veredicto { display: block; margin-top: 3px; font: 400 14px/1.35 var(--texto); color: var(--as-sub); }
.apo-fz.sube .apo-fz-veredicto { color: var(--apo-sube); }
.apo-fz-dato { display: block; margin-top: 2px; font: 400 13px/1.35 var(--texto); color: var(--as-apagado); }
.apo-fz-marca { display: block; margin-top: 2px; font: 400 13px/1.35 var(--texto); color: var(--as-sub); }
.apo-fz-chispa { display: block; width: 128px; height: 48px; }
.apo-fz-chispa .am-chispa { width: 100%; height: 100%; }
.apo .am-chispa.bajo .am-chispa-recta { stroke: var(--as-sub); }
.apo .am-chispa.sube .am-chispa-recta { stroke: var(--apo-sube); }

/* ¿Llego a mi meta?: cada meta como una pista, con su ventana de llegada. */
.apo-meta { padding: 18px 0 6px; }
.apo-meta + .apo-meta { border-top: 1px solid var(--as-linea); margin: 0 -22px; padding-left: 22px; padding-right: 22px; }
.apo-meta .apo-desplegar { margin-top: 4px; }
.apo-meta-nombre { font: 400 17px/1.3 var(--texto); color: var(--as-tinta); }
.apo-meta-objetivo { margin-top: 2px; font: 400 14px/1.35 var(--texto); color: var(--as-sub); }
.apo-meta .apo-pista { height: 64px; margin-top: 12px; }
.apo-meta-llega { margin-top: 4px; font: 400 15px/1.4 var(--texto); color: var(--as-tinta); }
.apo-meta-llega.no { color: var(--as-sub); }
.apo-meta-acciones { display: flex; flex-wrap: wrap; gap: 0 20px; margin-top: 2px; }
.apo-pasos { margin-top: 4px; }
.apo-paso-fila { display: grid; grid-template-columns: 22px minmax(0, 1fr); column-gap: 8px; padding: 8px 0; border-top: 1px solid rgba(48, 55, 72, 0.62); font: 400 14px/1.42 var(--texto); color: var(--as-sub); }
.apo-paso-fila:first-child { border-top: 0; }
.apo-paso-fila i { font: 400 14px/1.42 var(--numeros); font-style: normal; color: var(--as-sub); text-align: center; }
.apo-paso-fila.mejorar i, .apo-paso-fila.mejorar span { color: var(--as-tinta); }
.apo-meta.nueva-meta { animation: apo-asienta 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.apo-meta.se-va { transition: opacity 0.25s; opacity: 0; }

/* El formulario de una meta: crece en su lugar, desde el botón que se tocó. */
.apo-form-caja { overflow: hidden; }
/* El botón que abrió el formulario se pliega en su lugar: el formulario crece desde ahí. */
.apo-plegado { overflow: hidden; }
.apo-form { margin-top: 10px; padding: 16px 16px 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 22px; background: rgba(232, 236, 246, 0.025); }
.apo-form-tit { font: 400 16px/1.3 var(--texto); color: var(--as-tinta); }
.apo-etq-campo { display: block; margin-top: 14px; font: 400 13px/1.2 var(--texto); color: var(--as-sub); }
.apo-campo { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 46px; margin-top: 6px; padding: 0 12px 0 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 14px; background: rgba(5, 6, 10, 0.5); cursor: pointer; font: 400 15.5px/1.2 var(--texto); color: var(--as-tinta); text-align: left; transition: border-color 0.2s; }
.apo-campo[aria-expanded="true"] { border-color: var(--as-claro); }
.apo-campo svg { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--as-sub); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-campo[aria-expanded="true"] svg { rotate: 180deg; }
.apo-lista { padding-top: 8px; }
.apo-buscar { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; }
.apo-buscar svg { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--as-sub); stroke-width: 1.8; stroke-linecap: round; }
.apo-buscar input, .apo-paso input { outline: none !important; }
.apo-buscar:focus-within, .apo-paso:focus-within { border-color: var(--as-claro); }
.apo-buscar { transition: border-color 0.2s; }
.apo-buscar input { flex: 1; min-width: 0; height: 42px; border: 0; background: none; font: 400 15px var(--texto); color: var(--as-tinta); }
.apo-buscar input::placeholder { color: var(--as-apagado); }
.apo-lista-scroll { max-height: 264px; margin-top: 6px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
.apo-lista-scroll::-webkit-scrollbar { display: none; }
.apo-lista-rotulo { margin: 12px 0 2px; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); }
.apo-opcion { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 44px; padding: 0 2px; border: 0; border-bottom: 1px solid rgba(48, 55, 72, 0.62); background: none; cursor: pointer; font: 400 15px/1.2 var(--texto); color: var(--as-sub); text-align: left; }
.apo-opcion.grupo { color: var(--as-tinta); }
.apo-opcion.grupo small { margin-left: auto; font: 400 13px var(--numeros); color: var(--as-apagado); }
.apo-opcion.grupo svg { width: 14px; height: 14px; flex: none; fill: none; stroke: var(--as-sub); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-opcion.grupo[aria-expanded="true"] svg { rotate: 180deg; }
.apo-opcion.elegida { color: var(--as-tinta); }
.apo-opcion.elegida::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--as-claro); }
.apo-del-grupo { padding-left: 12px; }
.apo-nada { margin-top: 12px; font: 400 13.5px/1.4 var(--texto); color: var(--as-apagado); }
.apo-numeros { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.apo-paso { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; min-height: 46px; margin-top: 6px; border: 1px solid var(--as-linea-fuerte); border-radius: 14px; background: rgba(5, 6, 10, 0.5); }
.apo-paso button { height: 44px; padding: 0; border: 0; background: none; cursor: pointer; font: 300 22px/1 var(--numeros); color: var(--as-tinta); transition: opacity 0.2s; }
.apo-paso button:disabled { opacity: 0.25; cursor: default; }
.apo-paso label { display: flex; align-items: baseline; justify-content: center; gap: 4px; min-width: 0; }
.apo-paso input { width: 100%; min-width: 0; max-width: 64px; border: 0; background: none; outline: none; text-align: right; font: 400 18px/1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.apo-paso input.solo { text-align: center; max-width: 100%; }
.apo-paso small { font: 400 13px var(--texto); color: var(--as-sub); }
.apo-total { min-height: 18px; margin-top: 8px; font: 400 13px/1.35 var(--texto); color: var(--as-sub); }
.apo-form-acciones { display: flex; gap: 10px; margin-top: 12px; }
.apo-form-acciones button { flex: 1; min-height: 46px; border-radius: 999px; cursor: pointer; font: 400 15px/1 var(--texto); transition: opacity 0.2s, background-color 0.2s; }
.apo-cancelar { border: 1px solid var(--as-linea-fuerte); background: none; color: var(--as-tinta); }
.apo-guardar { border: 0; background: var(--as-claro); color: #05060a; }
.apo-guardar:disabled { opacity: 0.32; cursor: default; }
.apo-borrar { display: block; min-height: 44px; margin: 10px auto 0; padding: 0 12px; border: 0; background: none; cursor: pointer; font: 400 14px/1 var(--texto); color: var(--as-lejos); }
.apo-confirmar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; font: 400 13.5px/1.35 var(--texto); color: var(--as-tinta); }
.apo-confirmar div { display: flex; gap: 4px; flex: none; }
.apo-confirmar button { min-height: 44px; padding: 0 12px; border: 0; background: none; cursor: pointer; font: 400 14px var(--texto); color: var(--as-sub); }
.apo-confirmar button.si { color: var(--as-lejos); }

/* Tu año: las últimas semanas, el mapa y las marcas. */
.apo-tira.grande { height: auto; margin-top: 12px; gap: 3px; }
.apo-tira.grande i { max-width: none; border-radius: 3px; }
.apo-tira.grande i.marca::after { width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; }
.apo-mapa { margin-top: 14px; }
.apo-mapa .am-anio { cursor: pointer; }
/* Los meses del mapa, a un tamaño que se lee: el mapa se separa por mes (mapaLegible) y les deja lugar. */
.apo .am-anio .am-anio-mes { font-size: 13.4px; }
.apo .am-anio .am-anio-dia.elegido { stroke: var(--as-claro); stroke-width: 1.4; }
.apo-dia-detalle { min-height: 22px; margin-top: 10px; font: 400 14px/1.4 var(--texto); color: var(--as-tinta); }
.apo-leyenda-anio { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 10px; font: 400 13px/1.2 var(--texto); color: var(--as-sub); }
.apo-leyenda-anio span { display: inline-flex; align-items: center; gap: 6px; }
.apo-leyenda-anio i { width: 11px; height: 11px; border-radius: 2px; background: rgba(170, 178, 196, 0.12); }
.apo-leyenda-anio i.marca { position: relative; background: rgba(170, 178, 196, 0.3); }
.apo-leyenda-anio i.marca::after { content: ''; position: absolute; left: 50%; top: 50%; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: #fff; }
.apo-cifras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 12px; margin-top: 16px; }
.apo-cifras div { display: flex; flex-direction: column; gap: 4px; }
.apo-cifras b { font: 200 27px/1 var(--numeros); color: var(--as-tinta); font-weight: 200; }
.apo-cifras span { font: 400 13px/1.3 var(--texto); color: var(--as-sub); }
.apo-marca-fila { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; column-gap: 10px; align-items: baseline; padding: 10px 0; border-top: 1px solid rgba(48, 55, 72, 0.62); font: 400 14px/1.35 var(--texto); color: var(--as-tinta); }
.apo-marca-fila i { width: 8px; height: 8px; border-radius: 50%; }
.apo-marca-fila small { font: 400 13px/1.35 var(--texto); color: var(--as-apagado); white-space: nowrap; }

/* ---- el selector de fondo: crece desde el sello */
.apo-velo { position: absolute; inset: 0; z-index: 6; background: transparent; }
.apo-velo[hidden] { display: none; }
.apo-bandeja { position: absolute; z-index: 7; left: 10px; right: 10px; top: calc(var(--arriba) + 50px); padding: 6px 0 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 26px; background: rgba(11, 13, 19, 0.97); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55); }
.apo-bandeja[hidden] { display: none; }
.apo-bandeja .apo-e { animation: apo-asienta 0.4s var(--d, 0ms) cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.apo-band-cab { display: flex; align-items: center; justify-content: space-between; height: 44px; padding: 0 6px 0 20px; }
.apo-band-tit { font: 500 13px/1 var(--texto); letter-spacing: 0.24em; text-transform: uppercase; color: var(--as-sub); }
.apo-band-cerrar { width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 0; background: none; cursor: pointer; color: var(--as-sub); }
.apo-band-cerrar svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.apo-minis { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 6px calc(50% - 36px) 2px; scrollbar-width: none; overscroll-behavior-x: contain; }
.apo-minis::-webkit-scrollbar { display: none; }
.apo-mini { flex: none; width: 72px; display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 0; border: 0; background: none; cursor: pointer; scroll-snap-align: center; }
.apo-mini-disco { position: relative; display: block; width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: #06070b; box-shadow: 0 0 0 1px var(--as-linea-fuerte); transition: box-shadow 0.3s, transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-mini.actual .apo-mini-disco { box-shadow: 0 0 0 2px var(--as-claro), 0 0 18px rgba(var(--apo-rgb), 0.25); transform: scale(1.06); }
.apo-mini-disco .apo-astro { position: absolute; }
.apo-mini-disco .apo-astro.lejos { left: 7px; top: 7px; right: auto; width: 42px; height: 42px; --apo-p: 1; }
.apo-mini-disco .apo-disco > svg { opacity: 1; }
.apo-mini-disco .apo-astro.polvo.lejos { left: -252px; top: -162px; width: 560px; height: 380px; transform: scale(0.19); }
.apo-mini-nombre { width: 76px; font: 400 13px/1.15 var(--texto); color: var(--as-sub); text-align: center; text-wrap: balance; }
.apo-mini.actual .apo-mini-nombre { color: var(--as-tinta); }
.apo-mini.velada .apo-mini-disco { filter: grayscale(0.7) brightness(0.45); }
.apo-mini.velada .apo-mini-disco::before { content: ''; position: absolute; inset: 0; z-index: 2; border-radius: 50%; background: rgba(5, 6, 10, 0.45); }
.apo-mini.velada .apo-mini-nombre { color: var(--as-apagado); }
.apo-candado { position: absolute; z-index: 3; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; fill: none; stroke: var(--as-sub); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.apo-band-pie { min-height: 19px; margin-top: 8px; padding: 0 20px; font: 400 13.5px/1.4 var(--texto); color: var(--as-sub); text-align: center; transition: color 0.3s; }
.apo-band-pista { margin-top: 2px; padding: 0 20px 6px; font: 400 13px/1.35 var(--texto); color: var(--as-apagado); text-align: center; }
.apo-band-pie b { font-weight: 400; color: var(--as-tinta); }
.apo-band-fila { display: grid; grid-template-columns: 96px minmax(0, 1fr); align-items: center; column-gap: 10px; min-height: 52px; margin: 0 20px; border-top: 1px solid rgba(48, 55, 72, 0.62); }
.apo-band-fila > span { font: 400 14px/1.2 var(--texto); color: var(--as-tinta); }
.apo-deslizador { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; font: 400 13px/1 var(--texto); color: var(--as-apagado); }
.apo-deslizador input { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; margin: 0; background: none; cursor: pointer; }
.apo-deslizador input::-webkit-slider-runnable-track { height: 2px; border-radius: 2px; background: linear-gradient(90deg, var(--as-claro) 0 var(--lleno, 50%), var(--as-linea-fuerte) var(--lleno, 50%) 100%); }
.apo-deslizador input::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; margin-top: -10px; border-radius: 50%; background: var(--as-tinta); box-shadow: 0 0 0 4px rgba(11, 13, 19, 0.97); }
.apo-deslizador input::-moz-range-track { height: 2px; background: var(--as-linea-fuerte); }
.apo-deslizador input::-moz-range-thumb { width: 22px; height: 22px; border: 0; border-radius: 50%; background: var(--as-tinta); }
.apo-segmentos { display: flex; gap: 6px; }
/* Se tocan en 44 px; la pastilla que se ve va adentro (::before). */
.apo-segmentos button { position: relative; flex: 1; min-height: 44px; padding: 0 6px; border: 0; background: none; cursor: pointer; font: 400 13.5px/1 var(--texto); color: var(--as-sub); transition: color 0.25s; }
.apo-segmentos button::before { content: ''; position: absolute; inset: 4px 0; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; transition: border-color 0.25s, background-color 0.25s; }
.apo-segmentos button[aria-pressed="true"] { color: var(--as-tinta); }
.apo-segmentos button[aria-pressed="true"]::before { border-color: var(--as-claro); background: rgba(232, 236, 246, 0.05); }
.apo-interruptor-fila { display: flex; align-items: center; justify-content: space-between; width: calc(100% - 40px); min-height: 52px; margin: 0 20px; padding: 0; border: 0; border-top: 1px solid rgba(48, 55, 72, 0.62); background: none; cursor: pointer; font: 400 14px/1.2 var(--texto); color: var(--as-tinta); text-align: left; }
.apo-interruptor { position: relative; flex: none; width: 46px; height: 28px; border-radius: 999px; background: var(--as-linea-fuerte); transition: background-color 0.25s; }
.apo-interruptor::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: var(--as-tinta); transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apo-interruptor-fila[aria-checked="true"] .apo-interruptor { background: var(--as-claro); }
.apo-interruptor-fila[aria-checked="true"] .apo-interruptor::after { transform: translateX(18px); background: #05060a; }

@media (prefers-reduced-motion: reduce) {
  .tel .pr-pantalla.apo, .apo-portada.entra .apo-e, .apo-pagina.entra .apo-e, .apo-bandeja .apo-e, .apo-meta.nueva-meta { animation-duration: 1ms !important; }
  .apo-aqui::after { animation: none; }
  .apo-mini-disco, .apo-mini.actual .apo-mini-disco { transform: none; transition: none; }
  .apo-pliegue, .apo-pliegue > div, .apo-campo svg, .apo-desplegar svg, .apo-interruptor::after { transition-duration: 1ms; }
}
`;

const ICONO = {
  chev: '<svg class="apo-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
  atras: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  abajo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15.5l6-6"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  candado: '<svg class="apo-candado" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10.5" width="12" height="9" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
};

const CUERPOS = ['polvo', 'asteroide', 'luna', 'planeta', 'sol', 'galaxia', 'agujeroNegro'];
// Lo que muestra cada botón de la galería: el día de ejemplo, la página que se abre y el rango que se pone.
const DIA_DE = { aviso: 'cargado', calma: 'normal', casi: 'casi', hecha: 'hecha', descanso: 'descanso', nocheCorta: 'nocheCorta', nueva: 'nueva' };
const PAGINA_DE = { paginaHoy: 'hoy', paginaSemana: 'semana', paginaFuerza: 'fuerza', paginaMetas: 'metas', paginaAnio: 'anio' };
const RANGO_DE = { rango3: 3, rango5: 5, rango7: 7, fondo: 4 };
const CURVA = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const DUR = 440;

Galeria.propuesta({
  id: ID,
  titulo: 'Ascent, opción A: todo en una pantalla',
  texto: 'Lo de hoy y cuatro preguntas en una sola pantalla, sin bajar; cada pregunta se abre en su página. Mirá si se entiende sin explicación.',
  vistas: [['aviso', 'La pantalla principal'], ['paginaHoy', 'Al tocar «¿Qué hago hoy?»'], ['calma', 'Un día normal, sin avisos'], ['fondo', 'Probar otros fondos']],
  mas: [
    ['casi', 'Un aviso suave: le falta 1 día'], ['nocheCorta', 'Después de dormir poco'], ['hecha', 'Después de entrenar'], ['descanso', 'Un día de descanso'],
    ['nueva', 'Recién vinculada'], ['paginaSemana', 'Al tocar «¿Cómo va mi semana?»'], ['paginaFuerza', 'Al tocar «¿Estoy mejorando?»'],
    ['paginaMetas', 'Al tocar «¿Llego a mi meta?»'], ['paginaAnio', 'Al tocar «Tu año»'], ['rango3', 'Con el rango 3'], ['rango5', 'Con el rango 5'],
    ['rango7', 'Con el rango 7'], ['en', 'En inglés'],
  ],
  principal: 0,
  crear(g) {
    g.estilo('apo-css', CSS);
    const p = g.pantalla('apo as-vars', { conBarra: true });
    // El gesto de costado de las pestañas (galeria.js) cede lo que empieza adentro (Detalles.gestoPropio), como en C:
    // deslizar sobre la portada, una página o las miniaturas del fondo no mueve las secciones de atrás.
    p.el.classList.add('dt-desliza', 'dt-abierta');
    const u = Util.crear(g.opciones);
    const { el, numero } = u;
    const quieto = g.movimientoReducido;

    // ------------------------------------------------------------ los textos
    const propio = (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS_A[g.idioma] || TEXTOS_A.es);
    const conVariables = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k])) : s);
    // Al cortar el renglón, el número no se separa de su unidad.
    const pegado = (s) => String(s).replace(/(\d) (%|kg\b|h\b|min\b|g\b)/g, '$1 $2');
    const t = (clave, vars) => pegado(conVariables(propio(clave), vars));
    const tp = (clave, n, vars) => pegado(conVariables(propio(clave)[n === 1 ? 'uno' : 'otros'], Object.assign({ n }, vars)));
    const esc = (s) => String(s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
    const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const enFrase = (s) => s.charAt(0).toLowerCase() + s.slice(1);
    // «a, b y c»; delante de i o hi, «e» («glúteos e isquios»), como en la app.
    const enLista = (xs) => {
      if (xs.length <= 1) return xs[0] || '';
      const ultimo = xs[xs.length - 1];
      return `${xs.slice(0, -1).join(', ')} ${u.tx(/^(i|hi(?!e))/i.test(ultimo) ? 'ascent.ye' : 'ascent.y')} ${ultimo}`;
    };
    /** «Faltan unos 2 días (estimado, puede variar un día).» → «faltan unos 2 días (estimado).» */
    const estimacionCorta = (s) => enFrase(s.replace(/\(([^,;)]+)[,;][^)]*\)/, '($1)'));
    const kg = (v) => `${u.peso(v)} kg`;

    // ------------------------------------------------------------ lo que se recuerda
    const estado = {
      vista: null, dia: 'cargado',
      // El aviso de cada día: null, «entendido» o «bien». Se olvida al tocar de nuevo el botón de la galería.
      respuestas: {},
      fondo: { cual: 'auto', encuadre: 'esquina', presencia: 0.5, soloCielo: false },
      // Las metas cambiadas a mano: las nuevas, las borradas y las editadas (no se recalculan: es la galería).
      metas: { nuevas: [], borradas: new Set(), editadas: {} },
      rangoDeAntes: null, idiomaDeAntes: null, vinculadaDeAntes: null,
      // Al ir a «¿Por qué no estás mejorando?»: la página a la que se vuelve.
      volverA: null,
    };
    const dia = () => M.dia(estado.dia);

    // ------------------------------------------------------------ las capas
    const cielo = el('div', 'apo-cielo');
    cielo.setAttribute('aria-hidden', 'true');
    cielo.innerHTML = estrellas() + '<div class="apo-aurora"></div>';
    // Las rayas de «le faltan»: un patrón que no depende del color del rango.
    const defs = el('div', 'apo-oculto');
    defs.innerHTML = '<svg width="0" height="0" aria-hidden="true"><defs><pattern id="apo-rayas" patternUnits="userSpaceOnUse" width="3.2" height="3.2" patternTransform="rotate(45)"><rect width="3.2" height="3.2" fill="rgba(232,236,246,0.06)"/><line x1="0" y1="0" x2="0" y2="3.2" stroke="rgba(232,236,246,0.62)" stroke-width="1.1"/></pattern></defs></svg>';
    const sello = el('button', 'apo-sello');
    sello.type = 'button';
    sello.addEventListener('click', (ev) => { ev.stopPropagation(); alternarBandeja(); });
    const velo = el('div', 'apo-velo');
    velo.hidden = true;
    velo.addEventListener('click', () => cerrarBandeja());
    const bandeja = el('div', 'apo-bandeja');
    bandeja.hidden = true;
    bandeja.setAttribute('role', 'dialog');
    let portada = null;
    let abierta = null;
    p.el.append(defs, cielo, sello, velo, bandeja);

    // ------------------------------------------------------------ el cielo y el cuerpo del rango
    function estrellas() {
      let s = 20261127;
      const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      let c = '';
      for (let i = 0; i < 96; i++) {
        const x = r() * 393, y = r() * 852, rad = 0.3 + Math.pow(r(), 3) * 1.05, o = 0.22 + r() * 0.62;
        c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" opacity="${o.toFixed(2)}"/>`;
      }
      return `<svg class="apo-estrellas" viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#dfe6f5">${c}</g></svg>`;
    }
    // Los dibujos de los cuerpos llevan ids (degradados): cada copia, con los suyos.
    let serie = 0;
    function aislar(html) {
      const pre = `apo${++serie}-`;
      const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      let r = html;
      ids.forEach((id) => {
        const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        r = r.replace(new RegExp(`id="${e}"`, 'g'), `id="${pre}${id}"`).replace(new RegExp(`url\\(#${e}\\)`, 'g'), `url(#${pre}${id})`).replace(new RegExp(`href="#${e}"`, 'g'), `href="#${pre}${id}"`);
      });
      return r;
    }
    const rgb = (hex, conBlanco = 0) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * conBlanco)).join(', ');
    };
    // El dibujo de cada cuerpo sale de la sección (piezas.cuerpoDelRango), que dibuja el del rango puesto: para otro
    // rango se pone un momento y se vuelve (en la misma tarea, sin que se pinte nada en el medio).
    const cuerpos = new Map();
    function cuerpoDe(rango, planeta) {
      const k = `${rango}|${planeta || ''}`;
      if (!cuerpos.has(k)) {
        const a = g.secciones.ascent;
        const antes = a.rango;
        const igual = antes.rango === rango && (antes.planeta || null) === (planeta || null);
        if (!igual) a.ponerRango(rango, planeta || null);
        const c = RangoDeAscent.cuerpoDeAscent(RangoDeAscent.rachaDe(rango, planeta || null));
        cuerpos.set(k, { html: a.piezas.cuerpoDelRango(), cuerpo: c.cuerpo, paleta: c.paleta, rango: c.rango });
        if (!igual) a.ponerRango(antes.rango, antes.planeta);
      }
      return cuerpos.get(k);
    }
    const rangoActual = () => g.secciones.ascent.rango;
    const planetaPara = (n) => (n === 4 ? (rangoActual().rango === 4 && rangoActual().planeta) || 'Ceres' : null);
    function cuerpoElegido() {
      const r = rangoActual();
      const cual = estado.fondo.cual;
      if (cual === 'auto' || cual + 1 > r.rango) return cuerpoDe(r.rango, r.planeta);
      return cuerpoDe(cual + 1, planetaPara(cual + 1));
    }
    const rgbDe = (c) => (c.cuerpo === 'agujeroNegro' ? rgb(c.paleta.principal) : rgb(c.paleta.claro, 0.35));
    /** Un cuerpo en su encuadre: la esfera con su filo, o la nube del polvo. */
    function astro(c, encuadre) {
      const n = el('div', `apo-astro ${encuadre} ${c.cuerpo === 'polvo' ? 'polvo' : 'esfera'}`);
      n.style.setProperty('--apo-rgb', rgbDe(c));
      n.innerHTML = c.cuerpo === 'polvo' ? `<div class="apo-nube">${aislar(c.html)}</div>` : `<i class="apo-disco">${aislar(c.html)}</i><b class="apo-filo"></b>`;
      return n;
    }
    let cuerpoPuesto = null;
    function pintarCielo(fundido) {
      const c = cuerpoElegido();
      p.el.style.setProperty('--apo-rgb', rgbDe(c));
      p.el.style.setProperty('--apo-p', String(estado.fondo.presencia));
      p.el.classList.toggle('solo-cielo', estado.fondo.soloCielo);
      const nuevo = astro(c, estado.fondo.encuadre);
      const viejo = cuerpoPuesto;
      cuerpoPuesto = nuevo;
      cielo.appendChild(nuevo);
      if (!viejo) return;
      if (fundido && !quieto) {
        nuevo.animate([{ opacity: 0 }, {}], { duration: 520, easing: 'ease' });
        viejo.animate([{}, { opacity: 0 }], { duration: 520, easing: 'ease', fill: 'forwards' }).finished.then(() => viejo.remove(), () => viejo.remove());
      } else viejo.remove();
    }

    // ------------------------------------------------------------ los dibujos chicos (y los grandes, que son los mismos)
    const claseFlecha = (e) => (e.flecha === '↑' ? 'sube' : e.flecha === '=' ? 'igual' : 'nada');
    const flechas = (ejs) => `<span class="apo-flechas">${ejs.map((e, i) => `<b class="apo-flecha ${claseFlecha(e)}" data-viaja="f${i}" aria-hidden="true">${e.flecha || '·'}</b>`).join('')}</span>`;
    function estadosDeLaSemana(d) {
      const r = {};
      const limitan = d.aviso && d.aviso.pide ? d.aviso.musculos : [];
      d.musculos.forEach((m) => { r[m.id] = [m.estado, m.fatiga.dias > 0 ? 'fatigado' : '', limitan.includes(m.id) ? 'limita' : ''].filter(Boolean).join(' '); });
      return r;
    }
    const figuras = (estados) => `<span class="apo-figuras"><span data-viaja="frente">${M.figura('frente', estados)}</span><span data-viaja="espalda">${M.figura('espalda', estados)}</span></span>`;
    function trazo(estado, i, viaja = true) {
      const [y0, y1] = estado === 'sube' ? [33, 9] : estado === 'bajo' ? [12, 33] : [23, 23];
      return `<span class="apo-trazo ${estado}"${viaja ? ` data-viaja="t${i}"` : ''}><svg viewBox="0 0 19 44" aria-hidden="true"><path d="M3 ${y0} L16 ${y1}"/><circle cx="16" cy="${y1}" r="2.3"/></svg></span>`;
    }
    const trazos = (ejs) => `<span class="apo-trazos">${ejs.length ? ejs.map((e, i) => trazo(e.estado, i)).join('') : [0, 1, 2].map((i) => trazo('vacio', i, false)).join('')}</span>`;
    /** Las semanas hasta el día 1 de cada mes, desde hoy. */
    function meses(hasta) {
      const [a, m, n] = Datos.HOY.split('-').map(Number);
      const hoy = new Date(a, m - 1, n);
      const r = [];
      for (let k = 1; k < 16; k++) {
        const f = new Date(a, m - 1 + k, 1);
        const semanas = (f - hoy) / (7 * 86400000);
        if (semanas > hasta) break;
        r.push({ semanas, mes: f.getMonth() });
      }
      return r;
    }
    /** La pista de una meta: hoy a la izquierda y, sombreada, la ventana en que llegas; con `grande`, los meses. */
    function pista(meta, grande) {
      const W = grande ? 349 : 150;
      const H = grande ? 64 : 44;
      const y = grande ? 34 : 30;
      const L = 5;
      const R = W - (grande ? 8 : 6);
      if (meta.estado === 'noSeSabe' || !meta.semanas) {
        const T = 30;
        const x = (s) => L + (s / T) * (R - L);
        const fin = meta.estado === 'noSube' ? `<text class="fin" x="${R}" y="${y - 9}" text-anchor="end">?</text>` : '';
        const ms = grande ? meses(T).map((m) => `<line class="tic" x1="${x(m.semanas).toFixed(1)}" y1="${y - 3}" x2="${x(m.semanas).toFixed(1)}" y2="${y + 3}"/><text class="mes" x="${x(m.semanas).toFixed(1)}" y="${y + 21}" text-anchor="middle">${esc(u.tx('fecha.mesesCortos.' + m.mes))}</text>`).join('') : '';
        return `<svg class="apo-pista" viewBox="0 0 ${W} ${H}" data-viaja="pista" aria-hidden="true"><line class="linea no" x1="${L}" y1="${y}" x2="${R}" y2="${y}"/>${ms}<circle class="hoy" cx="${L}" cy="${y}" r="${grande ? 4 : 3.2}"/>${fin}</svg>`;
      }
      const [a, b] = meta.semanas;
      const T = Math.max(26, b + 6);
      const x = (s) => L + (s / T) * (R - L);
      const ms = grande ? meses(T).map((m) => `<line class="tic" x1="${x(m.semanas).toFixed(1)}" y1="${y - 3}" x2="${x(m.semanas).toFixed(1)}" y2="${y + 3}"/><text class="mes" x="${x(m.semanas).toFixed(1)}" y="${y + 21}" text-anchor="middle">${esc(u.tx('fecha.mesesCortos.' + m.mes))}</text>`).join('') : '';
      const alto = grande ? 14 : 11;
      return `<svg class="apo-pista" viewBox="0 0 ${W} ${H}" data-viaja="pista" aria-hidden="true"><line class="linea" x1="${L}" y1="${y}" x2="${R}" y2="${y}"/>${ms}`
        + `<rect class="ventana" x="${x(a).toFixed(1)}" y="${y - alto / 2}" width="${(x(b) - x(a)).toFixed(1)}" height="${alto}" rx="${alto / 2}"/>`
        + `<text class="meta" x="${((x(a) + x(b)) / 2).toFixed(1)}" y="${y - alto / 2 - 6}" text-anchor="middle">${esc(kg(meta.kilos))}</text>`
        + `<circle class="hoy" cx="${L}" cy="${y}" r="${grande ? 4 : 3.2}"/>${grande ? `<text class="mes" x="${L}" y="${y - 11}" text-anchor="start">${esc(t('hoyMeta'))}</text>` : ''}</svg>`;
    }
    const sesionesDeLaMeta = (m) => {
      const n = m.llevas ? Number((m.llevas.match(/\d+/) || [0])[0]) : 0;
      return `<span class="apo-sesiones6" data-viaja="pista" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < n ? 'hecha' : ''}"></i>`).join('')}</span>`;
    };
    const tira = (recientes, grande) => `<span class="apo-tira${grande ? ' grande' : ''}" data-viaja="tira" aria-hidden="true">${recientes.map((x) => `<i class="${[x.grupo ? 'entreno' : '', x.marca ? 'marca' : '', x.hoy ? 'hoy' : ''].join(' ')}"></i>`).join('')}</span>`;
    function barras(caida, grande) {
      const tope = Math.max(...caida.reps);
      return `<span class="apo-barras${grande ? ' grande' : ''}" data-viaja="barras" aria-hidden="true">${caida.reps.map((r) => `<i style="height:${Math.max(16, (r / tope) * 78).toFixed(0)}%"><b>${r}</b></i>`).join('')}</span>`;
    }

    // ------------------------------------------------------------ lo que dice cada puerta
    const metaDeLaPuerta = (d) => {
      const lista = metasDe(d);
      return lista.find((m) => m.estado === 'enCamino') || lista[0] || null;
    };
    function puerta(clave, d) {
      if (clave === 'hoy') {
        if (!d.sesion) {
          const estados = {};
          (d.siguiente ? d.siguiente.musculos : []).forEach((m) => { estados[m] = 'manana'; });
          return { preg: t('puerta.hoy'), dib: figuras(estados), resp: d.siguiente ? d.siguiente.linea : d.hoy.corto };
        }
        if (d.sesion.estado === 'hecha' && d.sesion.comoFue) {
          const caida = d.sesion.comoFue.caidas[0];
          return { preg: t('puerta.fue'), dib: caida ? barras(caida) : flechas(d.sesion.ejercicios), resp: d.sesion.comoFue.palabra };
        }
        return { preg: t('puerta.hoy'), dib: flechas(d.sesion.ejercicios), resp: d.sesion.resumen };
      }
      if (clave === 'semana') {
        const s = d.semana;
        const fuera = s.partes.find((x) => x.estado !== 'enSuPunto' && x.estado !== 'entrenado');
        return { preg: t('puerta.semana'), dib: figuras(estadosDeLaSemana(d)), resp: s.primera ? t('primera') : fuera ? fuera.texto : t('todoAlDia') };
      }
      if (clave === 'fuerza') {
        const f = d.fuerza;
        const resp = f.vacio ? t('pronto') : f.cuentas.sube ? tp('suben', f.cuentas.sube, { de: f.ejercicios.length }) : t('ninguno');
        return { preg: t('puerta.fuerza'), dib: trazos(f.ejercicios), resp };
      }
      const m = metaDeLaPuerta(d);
      if (!m) return { preg: t('puerta.metas'), dib: '', resp: t('sinMeta') };
      if (m.estado === 'noSeSabe' && !m.semanas) {
        const n = m.llevas ? Number((m.llevas.match(/\d+/) || [0])[0]) : 0;
        return { preg: t('puerta.metas'), dib: sesionesDeLaMeta(m), resp: m.llevas ? t('sesionesMeta', { n }) : m.nombre };
      }
      return {
        preg: t('puerta.metas'), dib: pista(m, false),
        resp: m.estado === 'enCamino' ? t('llega', { ejercicio: m.nombre, ventana: m.ventanaCorta }) : t('noLlega', { ejercicio: m.nombre }),
      };
    }

    // ------------------------------------------------------------ la portada
    function lineaDeCuando(d) {
      if (!d.sesion) return conMayuscula(d.fechaTexto);
      if (d.sesion.estado === 'hecha') return `${d.hoy.linea} · ${d.sesion.duracion}`;
      return t('hoy', { linea: d.hoy.linea });
    }
    function fase(paso, clase) {
      const s = el('span', clase);
      s.innerHTML = M.fase(paso);
      return s;
    }
    /** Debajo del titular: el aviso que pide algo, o una línea chica que no pide nada. */
    function contenidoDeNota(d) {
      if (d.nueva) {
        const n = el('div', 'apo-nueva');
        n.appendChild(el('p', 'apo-nueva-texto', d.nueva.texto));
        const ol = el('ol', 'apo-hitos');
        ol.setAttribute('aria-label', t('hitos'));
        d.nueva.hitos.forEach((h) => {
          const li = el('li', 'apo-hito' + (h.alcanzado ? ' alcanzado' : ''));
          li.innerHTML = `<i></i><b>${esc(h.cuando)}</b><span>${esc(h.que)}</span>`;
          ol.appendChild(li);
        });
        const aqui = el('span', 'apo-aqui', d.nueva.aqui);
        aqui.style.setProperty('--x', `${Math.min(100, d.nueva.alcanzados * 25)}%`);
        ol.appendChild(aqui);
        n.appendChild(ol);
        return n;
      }
      const a = d.aviso;
      const resp = estado.respuestas[d.clave];
      if (a && a.pide && !resp) {
        const n = el('div', 'apo-aviso');
        n.setAttribute('role', 'note');
        n.appendChild(fase(a.paso, 'apo-aviso-fase'));
        const c = el('div');
        const quien = el('p', 'apo-aviso-quien');
        quien.innerHTML = `<b>${esc(a.musculosTexto)}</b>`;
        // Primero el hecho, después la estimación y por último qué hacer (lo largo está en «¿Qué hago hoy?»).
        // En un iPhone chico, «(estimado)» sin el resto del paréntesis: el aviso entra en una línea menos.
        const texto = el('p', 'apo-aviso-texto');
        texto.innerHTML = `<span class="largo">${esc(pegado(`${a.hecho} ${a.estimacion}`))}</span><span class="corto">${esc(pegado(`${a.hecho} ${conMayuscula(estimacionCorta(a.estimacion))}`))}</span>`;
        c.append(quien, texto, el('p', 'apo-aviso-pide', a.queHacerCorto));
        const botones = el('div', 'apo-aviso-botones');
        botones.append(
          u.boton('apo-pastilla', esc(t('entendido')), () => responder(d.clave, 'entendido')),
          u.boton('apo-pastilla', esc(t('bien')), () => responder(d.clave, 'bien')),
        );
        c.appendChild(botones);
        n.appendChild(c);
        return n;
      }
      if (a) {
        const n = el('p', 'apo-chica');
        n.appendChild(fase(a.paso, 'apo-chica-fase' + (a.pide ? '' : ' suave')));
        const texto = el('span');
        const cola = resp === 'bien' ? t('anotado') : a.queHacerCorto;
        texto.innerHTML = `${a.pide ? `<b>${esc(a.corto)}</b>` : `<em>${esc(a.corto)}</em>`}: ${esc(estimacionCorta(a.estimacion))} ${esc(cola)}`;
        n.appendChild(texto);
        return n;
      }
      if (d.hoy.limita === 'sueno' && d.hoy.noche) {
        const n = el('p', 'apo-chica sin-fase');
        const f = d.hoy.noche.frase;
        const inicio = d.hoy.noche.texto;
        const s = el('span');
        s.innerHTML = f.startsWith(inicio) ? `<b>${esc(inicio)}</b>${esc(f.slice(inicio.length))} ${esc(d.hoy.texto)}` : `${esc(f)} ${esc(d.hoy.texto)}`;
        n.appendChild(s);
        return n;
      }
      const n = el('p', 'apo-chica sin-fase');
      n.appendChild(el('span', null, d.hoy.texto));
      return n;
    }
    function pintarPortada(entra) {
      const d = dia();
      const n = el('div', 'apo-portada' + (entra && !quieto ? ' entra' : ''));
      const e = (nodo, ms) => { nodo.classList.add('apo-e'); nodo.style.setProperty('--d', `${ms}ms`); return nodo; };
      const cab = e(el('div', 'apo-cab'), 0);
      const ayuda = u.boton('apo-ayuda', '<span aria-hidden="true">?</span>', () => { if (!arrastrado()) abrirPagina('basa', ayuda); }, t('basa'));
      ayuda.dataset.puerta = 'basa';
      cab.append(el('span', 'apo-nombre', t('ascent')), ayuda);
      n.appendChild(cab);
      n.appendChild(e(el('p', 'apo-cuando', lineaDeCuando(d)), 30));
      n.appendChild(e(el('h2', 'apo-titular', d.hoy.corto), 60));
      const nota = e(el('div', 'apo-nota-caja'), 110);
      nota.appendChild(contenidoDeNota(d));
      n.appendChild(nota);
      // Recién vinculada no se muestra lo que todavía no puede decir nada (si sube pide 6 sesiones en 6 semanas; el año,
      // más de dos cuadritos): lo dicen los hitos de arriba.
      const claves = d.nueva ? ['hoy', 'semana', 'metas'] : ['hoy', 'semana', 'fuerza', 'metas'];
      const cuatro = el('div', 'apo-puertas' + (claves.length === 3 ? ' tres' : ''));
      claves.forEach((clave, i) => {
        const x = puerta(clave, d);
        const b = e(el('button', 'apo-puerta'), 170 + i * 40);
        b.type = 'button';
        b.dataset.puerta = clave;
        const conHora = clave === 'hoy' && d.sesion && d.sesion.estado === 'prevista';
        b.innerHTML = `<span class="apo-preg"><span data-viaja="preg">${esc(x.preg)}</span>${ICONO.chev}</span><span class="apo-dib">${x.dib}</span><span class="apo-resp${conHora ? ' con-hora' : ''}">${esc(pegado(x.resp))}</span>`
          + (conHora ? `<span class="apo-resp apo-resp-hora">${esc(t('sesionLinea', { sesion: d.sesion.nombre, hora: d.sesion.hora }))}</span>` : '');
        b.setAttribute('aria-label', `${x.preg} ${x.resp}`);
        b.addEventListener('click', (ev) => { ev.stopPropagation(); if (!arrastrado()) abrirPagina(clave, b); });
        cuatro.appendChild(b);
      });
      n.appendChild(cuatro);
      const anio = e(el('button', 'apo-anio-fila'), 340);
      anio.type = 'button';
      anio.dataset.puerta = 'anio';
      anio.innerHTML = `<span class="apo-anio-etq" data-viaja="preg">${esc(t('anio'))}</span>${tira(d.anio.recientes)}<span class="apo-anio-n">${esc(numero(d.anio.entrenamientos))}</span>${ICONO.chev}`;
      anio.setAttribute('aria-label', `${t('anio')}: ${tp('entrenamientos', d.anio.entrenamientos, { n: numero(d.anio.entrenamientos) })}`);
      anio.addEventListener('click', (ev) => { ev.stopPropagation(); if (!arrastrado()) abrirPagina('anio', anio); });
      if (!d.nueva) n.appendChild(anio);
      const pie = e(el('div', 'apo-pie'), 380);
      const comida = d.sugerencias.find((s) => s.tipo === 'comida');
      const sueno = d.sugerencias.find((s) => s.tipo === 'sueno');
      const partes = [comida && comida.macros ? t('comida', { que: comida.macros }) : null, sueno && sueno.hora ? t('cama', { hora: sueno.hora }) : null].filter(Boolean);
      if (partes.length) pie.appendChild(u.boton('apo-pie-linea', partes.map((x) => `<span>${esc(x)}</span>`).join('<i aria-hidden="true">·</i>'), () => { if (!arrastrado()) abrirPagina('hoy', n.querySelector('[data-puerta="hoy"]')); }));
      pie.appendChild(u.boton('apo-volver', `<span>${esc(u.tx('ascent.volverAProgreso'))}</span>${ICONO.abajo}`, () => { if (!arrastrado()) volverAProgreso(); }));
      n.appendChild(pie);
      gestoDePortada(n);
      const antes = portada;
      portada = n;
      p.el.insertBefore(n, sello);
      if (antes) antes.remove();
      acomodar();
      return n;
    }
    /** Cambia lo de la portada con un fundido: lo de antes se va y lo nuevo se asienta. */
    function cambiarPortada(entra) {
      const antes = portada;
      if (!antes || quieto || !p.abierta) { pintarPortada(entra); return; }
      antes.style.pointerEvents = 'none';
      antes.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'forwards' });
      setTimeout(() => { if (portada === antes) pintarPortada(true); }, 150);
    }
    // En un iPhone chico, lo que no entra se acomoda, de a un paso: el año pasa a «¿Llego a mi meta?», la línea de la
    // comida y la cama queda en «¿Qué hago hoy?», el titular y los dibujos se achican y, por último, la línea de la hora.
    const PASOS_CHICOS = ['sin-anio', 'sin-pie', 'chica', 'sin-cuando', 'sin-dibujos'];
    // Entra si lo último no se pasa del borde: con offsetTop, que no cambia con las animaciones de entrada.
    function cabe() {
      const ultimo = portada.lastElementChild;
      return ultimo.offsetTop + ultimo.offsetHeight <= portada.clientHeight - parseFloat(getComputedStyle(portada).paddingBottom) + 1.5;
    }
    function acomodar() {
      if (!portada || p.el.hidden) return;
      PASOS_CHICOS.forEach((c) => p.el.classList.remove(c));
      for (const c of PASOS_CHICOS) {
        if (cabe()) break;
        p.el.classList.add(c);
      }
    }
    new ResizeObserver(() => acomodar()).observe(p.el);

    /** «Entendido» o «Me siento bien»: el aviso se achica a una línea y las puertas suben a ocupar su lugar. */
    function responder(clave, que) {
      if (g.haptico) g.haptico('toque');
      estado.respuestas[clave] = que;
      const caja = portada && portada.querySelector('.apo-nota-caja');
      if (!caja) return;
      const d = dia();
      const viejo = caja.firstElementChild;
      const h0 = caja.offsetHeight;
      if (quieto) { caja.replaceChildren(contenidoDeNota(d)); acomodar(); return; }
      viejo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease', fill: 'forwards' });
      setTimeout(() => {
        const nuevo = contenidoDeNota(d);
        caja.replaceChildren(nuevo);
        const h1 = caja.offsetHeight;
        caja.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 420, easing: CURVA });
        nuevo.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 120, easing: CURVA, fill: 'backwards' });
        setTimeout(acomodar, 440);
      }, 150);
    }

    // ------------------------------------------------------------ volver a Progreso: la sección sube entera y deja ver
    // Progreso, que está abajo (como hoy).
    let saliendoArriba = false;
    function volverAProgreso(desde = 0) {
      cerrarBandeja(true);
      if (quieto) { Galeria.ver(ID, null); return; }
      p.el.animate([{ transform: `translateY(${desde}px)` }, { transform: 'translateY(-100%)' }], { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' })
        .finished.then(() => { saliendoArriba = true; Galeria.ver(ID, null); });
    }
    // Empujar la portada para arriba también vuelve a Progreso (como hoy, abajo de todo de la sección).
    let arrastre = 0;
    const arrastrado = () => performance.now() - arrastre < 350;
    function gestoDePortada(n) {
      let gx = null;
      n.addEventListener('pointerdown', (ev) => {
        if ((ev.pointerType === 'mouse' && ev.button !== 0) || abierta || !bandeja.hidden) return;
        gx = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, v: 0, y: ev.clientY, t: performance.now(), dy: 0 };
      });
      n.addEventListener('pointermove', (ev) => {
        if (!gx || ev.pointerId !== gx.id) return;
        const dx = ev.clientX - gx.x0;
        const dy = ev.clientY - gx.y0;
        if (!gx.decidido) {
          if (dy > 10 || Math.abs(dx) > 14) { gx = null; return; }
          if (-dy < 12 || Math.abs(dx) > -dy) return;
          gx.decidido = true;
          try { n.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
        }
        ev.preventDefault();
        const ahora = performance.now();
        gx.v = gx.v * 0.6 + ((gx.y - ev.clientY) / Math.max(1, ahora - gx.t)) * 0.4;
        gx.y = ev.clientY;
        gx.t = ahora;
        gx.dy = Math.min(0, dy + 12);
        p.el.style.transform = `translateY(${gx.dy.toFixed(1)}px)`;
      });
      const soltar = (ev) => {
        if (!gx || ev.pointerId !== gx.id) return;
        const x = gx;
        gx = null;
        if (!x.decidido) return;
        arrastre = performance.now();
        const desde = x.dy;
        p.el.style.transform = '';
        if (ev.type === 'pointerup' && (-desde > 120 || x.v > 0.55)) volverAProgreso(desde);
        else if (!quieto) p.el.animate([{ transform: `translateY(${desde}px)` }, { transform: 'none' }], { duration: 320, easing: CURVA });
      };
      n.addEventListener('pointerup', soltar);
      n.addEventListener('pointercancel', soltar);
      let toque = null;
      n.addEventListener('touchstart', (ev) => { const x = ev.touches[0]; toque = x ? { x: x.clientX, y: x.clientY } : null; }, { passive: true });
      n.addEventListener('touchmove', (ev) => {
        const x = ev.touches[0];
        if (!toque || !x) return;
        const dy = toque.y - x.clientY;
        if (dy > 0 && dy > Math.abs(x.clientX - toque.x)) ev.preventDefault();
      }, { passive: false });
    }

    // ------------------------------------------------------------ las páginas: crecen desde su puerta
    function recorteDe(celda) {
      const R = p.el.getBoundingClientRect();
      const c = celda.getBoundingClientRect();
      const r = (v) => Math.max(0, v).toFixed(1);
      return `inset(${r(c.top - R.top)}px ${r(R.right - c.right)}px ${r(R.bottom - c.bottom)}px ${r(c.left - R.left)}px round 14px)`;
    }
    /** Lo que viaja: el título y el dibujo de la puerta, con su par en la página. */
    function parejas(celda, pagina) {
      const r = [];
      celda.querySelectorAll('[data-viaja]').forEach((a) => {
        const b = pagina.querySelector(`[data-viaja="${a.dataset.viaja}"]`);
        if (b) r.push([a, b]);
      });
      return r;
    }
    /**
     * Dónde empieza (o termina) el par de la página para estar sobre el de la puerta. El título es el mismo texto: se
     * mueve tal cual. Un dibujo cambia de forma (el trazo chico pasa a ser la chispa): escala pareja, centro con centro,
     * y se funde con el de la puerta en el camino, así nunca se deforma.
     */
    function viajeDe(a, b) {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      if (!rb.width || !rb.height || !ra.width || !ra.height) return null;
      if (a.dataset.viaja === 'preg') return { a, b, funde: false, t: `translate(${(ra.left - rb.left).toFixed(1)}px, ${(ra.top - rb.top).toFixed(1)}px)`, origen: '0 0' };
      const s = Math.min(ra.width / rb.width, ra.height / rb.height);
      const dx = ra.left + ra.width / 2 - (rb.left + rb.width / 2);
      const dy = ra.top + ra.height / 2 - (rb.top + rb.height / 2);
      return { a, b, funde: true, t: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`, origen: '50% 50%' };
    }
    function viajar(viajes, ida) {
      viajes.forEach((v) => {
        v.b.style.transformOrigin = v.origen;
        const k = ida ? [{ transform: v.t }, { transform: 'none' }] : [{ transform: 'none' }, { transform: v.t }];
        if (v.funde) {
          k[0].opacity = ida ? 0 : 1;
          k[1].opacity = ida ? 1 : 0;
          if (ida) k.splice(1, 0, { opacity: 1, offset: 0.55 });
          else k.splice(1, 0, { opacity: 1, offset: 0.45 });
          // El de la puerta se va (o vuelve) en la mitad del camino.
          v.a.animate(ida ? [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: DUR, easing: 'linear', fill: 'both' });
        } else v.a.style.visibility = 'hidden';
        // El título llega antes que el resto: así no se cruza con la respuesta, que entra después.
        v.b.animate(k, { duration: v.funde ? DUR : DUR * 0.78, easing: CURVA, fill: ida ? 'none' : 'forwards' });
      });
    }
    const terminarViaje = (viajes) => viajes.forEach((v) => { v.a.style.visibility = ''; v.a.getAnimations().forEach((x) => x.cancel()); });
    /** Las otras partes de la portada se corren unos 12 px hacia afuera y se apagan (o vuelven). */
    function apartar(celda, ida) {
      if (!portada) return [];
      const rc = celda.getBoundingClientRect();
      const cx = rc.left + rc.width / 2;
      const cy = rc.top + rc.height / 2;
      return [...portada.querySelectorAll('.apo-e')].filter((n) => n !== celda && !n.contains(celda)).map((n) => {
        const r = n.getBoundingClientRect();
        let dx = r.left + r.width / 2 - cx;
        let dy = r.top + r.height / 2 - cy;
        const l = Math.hypot(dx, dy) || 1;
        dx = (dx / l) * 12;
        dy = (dy / l) * 12;
        const k = [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, opacity: 0 }];
        return n.animate(ida ? k : k.reverse(), { duration: ida ? DUR * 0.7 : DUR, easing: CURVA, fill: 'both' });
      });
    }
    let ocupada = false;
    async function abrirPagina(clave, celda, o = {}) {
      if (abierta || ocupada || !portada) return;
      if (!celda) celda = portada.querySelector(`[data-puerta="${clave}"]`);
      if (!celda) return;
      cerrarBandeja(true);
      const d = dia();
      const pag = armarPagina(clave, d, celda);
      abierta = { clave, celda, el: pag.el, scroll: pag.scroll };
      p.el.insertBefore(pag.el, sello);
      p.el.classList.add('con-pagina');
      if (o.scroll) {
        pag.scroll.scrollTop = o.scroll;
        sello.classList.toggle('apagado', o.scroll > 12);
      }
      if (o.deUna || quieto) {
        if (quieto && !o.deUna) await pag.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }).finished.catch(() => {});
        portada.style.visibility = 'hidden';
        portada.inert = true;
        return;
      }
      ocupada = true;
      if (g.haptico) g.haptico('suave');
      pag.el.classList.add('entra');
      const viajes = parejas(celda, pag.el).map(([a, b]) => viajeDe(a, b)).filter(Boolean);
      // Lo de la puerta que no viaja (la respuesta, la flecha) se apaga enseguida.
      const quietos = [...celda.querySelectorAll('.apo-resp, .apo-chev, .apo-anio-n')];
      quietos.forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'both' }));
      viajar(viajes, true);
      const otras = apartar(celda, true);
      await pag.el.animate([{ clipPath: recorteDe(celda) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: DUR, easing: CURVA }).finished.catch(() => {});
      if (abierta && abierta.el === pag.el) {
        portada.style.visibility = 'hidden';
        portada.inert = true;
      }
      otras.forEach((x) => x.cancel());
      quietos.forEach((n) => n.getAnimations().forEach((x) => x.cancel()));
      terminarViaje(viajes);
      ocupada = false;
    }
    async function cerrarPagina(deUna) {
      const a = abierta;
      if (!a || (ocupada && !deUna)) return;
      ocupada = true;
      // De una (otro botón de la galería, el idioma): lo que se estuviera moviendo se corta.
      if (deUna) {
        a.el.getAnimations({ subtree: true }).forEach((x) => x.cancel());
        if (portada) portada.getAnimations({ subtree: true }).forEach((x) => x.cancel());
        if (portada) portada.querySelectorAll('[data-viaja]').forEach((x) => { x.style.visibility = ''; });
      }
      portada.style.visibility = '';
      portada.inert = false;
      // La puerta de la que salió (si la portada se volvió a pintar, la nueva).
      const celda = a.celda.isConnected ? a.celda : portada.querySelector(`[data-puerta="${a.clave}"]`) || portada;
      const fin = () => {
        a.el.remove();
        if (abierta === a) abierta = null;
        p.el.classList.remove('con-pagina');
        sello.classList.remove('apagado');
        ocupada = false;
      };
      sello.classList.remove('apagado');
      if (deUna || quieto) {
        if (quieto && !deUna) await a.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).finished.catch(() => {});
        fin();
        return;
      }
      if (g.haptico) g.haptico('suave');
      const tirada = a.el.style.transform || 'none';
      const recorte = a.el.style.clipPath || 'inset(0px 0px 0px 0px round 0px)';
      a.el.style.transform = '';
      a.el.style.clipPath = '';
      const viajes = parejas(celda, a.el).map(([x, y]) => viajeDe(x, y)).filter(Boolean);
      viajar(viajes, false);
      a.scroll.querySelectorAll('.apo-e').forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, easing: 'ease', fill: 'forwards' }));
      const otras = apartar(celda, false);
      const quietos = [...celda.querySelectorAll('.apo-resp, .apo-chev, .apo-anio-n')];
      quietos.forEach((n) => n.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: DUR, easing: 'ease', fill: 'both' }));
      await a.el.animate([{ clipPath: recorte, transform: tirada }, { clipPath: recorteDe(celda), transform: 'none' }], { duration: DUR, easing: CURVA, fill: 'forwards' }).finished.catch(() => {});
      terminarViaje(viajes);
      otras.forEach((x) => x.cancel());
      quietos.forEach((n) => n.getAnimations().forEach((x) => x.cancel()));
      fin();
    }
    /** Arrastrar hacia abajo, con la página arriba de todo, la cierra: la página sigue al dedo. */
    function gestoDePagina(pag, s) {
      let gx = null;
      s.addEventListener('pointerdown', (ev) => {
        if ((ev.pointerType === 'mouse' && ev.button !== 0) || s.scrollTop > 0 || ocupada) return;
        if (ev.target.closest('input, .apo-lista-scroll, .apo-minis')) return;
        gx = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, v: 0, y: ev.clientY, t: performance.now(), dy: 0 };
      });
      s.addEventListener('pointermove', (ev) => {
        if (!gx || ev.pointerId !== gx.id) return;
        const dx = ev.clientX - gx.x0;
        const dy = ev.clientY - gx.y0;
        if (!gx.decidido) {
          if (dy < -8 || Math.abs(dx) > 14) { gx = null; return; }
          if (dy < 10 || Math.abs(dx) > dy) return;
          gx.decidido = true;
          try { s.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
          // Detrás asoma la portada, adonde vuelve.
          portada.style.visibility = '';
        }
        ev.preventDefault();
        const ahora = performance.now();
        gx.v = gx.v * 0.6 + ((ev.clientY - gx.y) / Math.max(1, ahora - gx.t)) * 0.4;
        gx.y = ev.clientY;
        gx.t = ahora;
        gx.dy = Math.max(0, dy - 10);
        const y = gx.dy;
        pag.style.transformOrigin = '50% 0';
        pag.style.transform = `translateY(${(y * 0.72).toFixed(1)}px) scale(${(1 - Math.min(0.1, y / 2200)).toFixed(4)})`;
        pag.style.clipPath = `inset(0px 0px 0px 0px round ${Math.min(34, y / 3).toFixed(1)}px)`;
      });
      const soltar = (ev) => {
        if (!gx || ev.pointerId !== gx.id) return;
        const x = gx;
        gx = null;
        if (!x.decidido) return;
        arrastre = performance.now();
        if (ev.type === 'pointerup' && (x.dy > 110 || x.v > 0.6)) { cerrarPagina(); return; }
        const de = pag.style.transform;
        const recorte = pag.style.clipPath;
        pag.style.transform = '';
        pag.style.clipPath = '';
        const tapar = () => { if (abierta && abierta.el === pag && !ocupada) portada.style.visibility = 'hidden'; };
        if (quieto) tapar();
        else pag.animate([{ transform: de, clipPath: recorte }, { transform: 'none', clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 320, easing: CURVA }).finished.then(tapar, tapar);
      };
      s.addEventListener('pointerup', soltar);
      s.addEventListener('pointercancel', soltar);
      s.addEventListener('click', (ev) => { if (arrastrado()) { ev.stopPropagation(); ev.preventDefault(); } }, true);
      let toque = null;
      s.addEventListener('touchstart', (ev) => { const x = ev.touches[0]; toque = x && s.scrollTop <= 0 ? { x: x.clientX, y: x.clientY } : null; }, { passive: true });
      s.addEventListener('touchmove', (ev) => {
        const x = ev.touches[0];
        if (!toque || !x) return;
        const dy = x.clientY - toque.y;
        if (dy > 0 && dy > Math.abs(x.clientX - toque.x)) ev.preventDefault();
      }, { passive: false });
    }

    // ------------------------------------------------------------ armar cada página
    function armarPagina(clave, d, celda) {
      const pag = el('div', 'apo-pagina');
      pag.dataset.pagina = clave;
      const s = el('div', 'apo-pag-scroll');
      pag.appendChild(s);
      const cab = el('div', 'apo-pag-cab apo-e');
      cab.appendChild(u.boton('apo-atras', `${ICONO.atras}<span>${esc(t('atras'))}</span>`, () => cerrarPagina(), u.tx('comun.atras')));
      s.appendChild(cab);
      const preg = el('p', 'apo-pag-preg', clave === 'anio' ? t('anio') : clave === 'basa' ? t('basa') : puerta(clave, d).preg);
      preg.dataset.viaja = 'preg';
      s.appendChild(preg);
      ({ hoy: paginaHoy, semana: paginaSemana, fuerza: paginaFuerza, metas: paginaMetas, anio: paginaAnio, basa: paginaBasa })[clave](s, d);
      // Lo que no viene de la puerta entra de arriba hacia abajo, después de lo que viaja.
      const deLaPuerta = new Set(celda ? [...celda.querySelectorAll('[data-viaja]')].map((x) => x.dataset.viaja) : []);
      s.querySelectorAll('[data-viaja]').forEach((x) => { if (!deLaPuerta.has(x.dataset.viaja)) x.classList.add('apo-e'); });
      [...s.querySelectorAll('.apo-e')].forEach((n, i) => n.style.setProperty('--d', `${Math.min(520, 190 + i * 30)}ms`));
      gestoDePagina(pag, s);
      // Al bajar, nada pasa por debajo del sello: se apaga, y la franja bajo la hora separa lo que sube.
      if (typeof Detalles !== 'undefined' && Detalles.franja) Detalles.franja(pag, s, '7, 8, 13');
      let pedido = 0;
      s.addEventListener('scroll', () => {
        if (pedido) return;
        pedido = requestAnimationFrame(() => { pedido = 0; sello.classList.toggle('apagado', s.scrollTop > 12 && abierta && abierta.scroll === s); });
      }, { passive: true });
      return { el: pag, scroll: s };
    }
    const bloque = (s, clase, texto) => { const n = el('p', `${clase} apo-e`, texto); s.appendChild(n); return n; };
    const separador = (s, fino) => { const n = el('hr', `apo-sep${fino ? ' fino' : ''} apo-e`); s.appendChild(n); return n; };
    const respuesta = (s, texto, sub) => {
      s.appendChild(el('p', 'apo-pag-resp apo-e', pegado(texto)));
      if (sub) { const n = el('p', 'apo-pag-sub apo-e'); n.innerHTML = sub; s.appendChild(n); }
    };
    /** «En qué se basa», plegado, al final de cada página. */
    function enQueSeBasa(s, parrafos) {
      if (!parrafos || !parrafos.length) return;
      separador(s);
      desplegable(s, t('basa'), (c) => parrafos.forEach((x) => c.appendChild(el('p', null, x))), 'apo-basa');
    }
    function desplegable(s, rotulo, llenar, clase, abiertoYa) {
      const b = u.boton('apo-desplegar apo-e', `<span>${esc(rotulo)}</span>${ICONO.abajo}`, () => {
        const si = !pl.classList.contains('abierto');
        b.setAttribute('aria-expanded', String(si));
        pl.classList.toggle('abierto', si);
        dentro.inert = !si;
      });
      const pl = el('div', 'apo-pliegue apo-e' + (abiertoYa ? ' abierto' : ''));
      const dentro = el('div', clase || '');
      llenar(dentro);
      pl.appendChild(dentro);
      b.setAttribute('aria-expanded', String(!!abiertoYa));
      dentro.inert = !abiertoYa;
      s.append(b, pl);
      return { boton: b, pliegue: pl, dentro };
    }

    function paginaHoy(s, d) {
      const ses = d.sesion;
      if (!ses) {
        respuesta(s, d.siguiente ? d.siguiente.linea : d.hoy.corto, esc(d.siguiente ? `${d.siguiente.hora} · ${d.siguiente.musculosTexto}` : ''));
        const entreno = d.sugerencias.find((x) => x.tipo === 'entreno');
        if (entreno) bloque(s, 'apo-texto', entreno.texto);
        bloque(s, 'apo-nota', d.hoy.texto);
        separador(s);
        bloque(s, 'apo-tit', t('mananaEnTuCuerpo'));
        const estados = {};
        (d.siguiente ? d.siguiente.musculos : []).forEach((m) => { estados[m] = 'manana'; });
        const c = el('div', 'apo-cuerpos');
        c.innerHTML = `<span data-viaja="frente">${M.figura('frente', estados)}</span><span data-viaja="espalda">${M.figura('espalda', estados)}</span>`;
        s.appendChild(c);
        musculosConFase(s, d, d.fatiga.lista);
      } else if (ses.estado === 'hecha' && ses.comoFue) {
        const cf = ses.comoFue;
        respuesta(s, cf.palabra, esc(cf.porque));
        const caida = cf.caidas[0];
        if (caida) {
          bloque(s, 'apo-tit', pegado(`${caida.nombre} · ${caida.etiqueta}`));
          const b = el('div');
          b.innerHTML = barras(caida, true);
          s.appendChild(b.firstElementChild);
        }
        bloque(s, 'apo-texto', cf.implica);
        separador(s);
        bloque(s, 'apo-tit', t('tuSesionHecha'));
        listaDeEjercicios(s, ses.ejercicios, true);
        separador(s);
        bloque(s, 'apo-tit', t('enTuCuerpo'));
        musculosConFase(s, d, ses.musculos);
        desplegable(s, cf.comoSeCalcula.titulo, (c) => cf.comoSeCalcula.parrafos.forEach((x) => c.appendChild(el('p', null, x))), 'apo-basa');
      } else {
        respuesta(s, t('sesionLinea', { sesion: ses.nombre, hora: ses.hora }), esc(t('sesionSub', { resumen: ses.resumen, duracion: ses.duracion })));
        if (d.aviso && d.aviso.pide) {
          const n = el('p', 'apo-pag-sub apo-e');
          n.innerHTML = `<b>${esc(d.aviso.musculosTexto)}</b>: ${esc(enFrase(d.aviso.hecho))} ${esc(d.aviso.queHacer)}`;
          s.appendChild(n);
        } else if (d.hoy.limita === 'sueno' && d.hoy.noche) {
          const n = el('p', 'apo-pag-sub apo-e');
          n.innerHTML = `<b>${esc(d.hoy.noche.frase)}</b> ${esc(d.hoy.texto)}`;
          s.appendChild(n);
        }
        separador(s);
        bloque(s, 'apo-tit', t('tuSesion'));
        listaDeEjercicios(s, ses.ejercicios, false);
        bloque(s, 'apo-nota', t('tocaPorque'));
        separador(s);
        bloque(s, 'apo-tit', t('enTuCuerpo'));
        musculosConFase(s, d, ses.musculos);
        if (d.aviso && d.aviso.sinRir) bloque(s, 'apo-nota', d.aviso.sinRir);
      }
      // Alrededor del entreno: antes, después, la comida de hoy y la noche (los textos de la app, sin números nuevos).
      separador(s);
      bloque(s, 'apo-tit', t('alrededor'));
      const dl = el('dl', 'apo-alrededor apo-e');
      const fila = (a, b) => { dl.append(el('dt', null, a), el('dd', null, b)); };
      // Los textos de la app ya dicen «antes de entrenar:»; con el rótulo al lado, va lo de después de los dos puntos.
      const sinRotulo = (s) => conMayuscula(s.includes(': ') ? s.slice(s.indexOf(': ') + 2) : s);
      if (ses && ses.estado === 'prevista') {
        fila(t('antes'), sinRotulo(u.tx('entreno.snackPrevioSinNumeros')));
        fila(t('despues'), sinRotulo(u.tx('entreno.despuesSinNumeros')));
      } else if (ses) fila(t('despues'), sinRotulo(u.tx('entreno.despuesSinNumeros')));
      const comida = d.sugerencias.find((x) => x.tipo === 'comida');
      const sueno = d.sugerencias.find((x) => x.tipo === 'sueno');
      if (comida) fila(t('comidaCorta'), comida.texto);
      if (sueno) fila(t('estaNoche'), sueno.texto);
      s.appendChild(dl);
      enQueSeBasa(s, [...d.base.fatigados, ...d.base.musculos.slice(6, 8)]);
    }
    function listaDeEjercicios(s, ejercicios, hecha) {
      ejercicios.forEach((e, i) => {
        const b = el('button', 'apo-ej');
        b.type = 'button';
        b.innerHTML = `<b class="apo-flecha ${claseFlecha(e)}" data-viaja="f${i}" aria-hidden="true">${e.flecha || '·'}</b>`;
        const texto = el('span', 'apo-ej-texto apo-e');
        const peso = e.decision === 'sube' ? e.subeTexto || e.corto : e.corto;
        texto.innerHTML = `<span class="apo-ej-fila"><span class="apo-ej-nombre">${esc(e.nombre)}</span><span class="apo-ej-peso${e.decision === 'sube' ? ' sube' : ''}">${esc(pegado(peso || ''))}</span></span><span class="apo-ej-plan">${esc(hecha && e.hecho ? t('hiciste', { series: e.hecho }) : e.plan)}</span>`;
        const pl = el('span', 'apo-pliegue apo-ej-porque');
        const dentro = el('span');
        dentro.innerHTML = `<span>${esc(pegado(e.proxima))}</span>${e.ultima && !hecha ? `<span>${esc(pegado(e.ultima.texto))}</span>` : ''}`;
        pl.appendChild(dentro);
        texto.appendChild(pl);
        b.appendChild(texto);
        b.setAttribute('aria-expanded', 'false');
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const si = !pl.classList.contains('abierto');
          pl.classList.toggle('abierto', si);
          b.setAttribute('aria-expanded', String(si));
        });
        s.appendChild(b);
      });
    }
    function musculosConFase(s, d, ids) {
      const lista = el('div', 'apo-e');
      const limitan = d.aviso && d.aviso.pide ? d.aviso.musculos : [];
      ids.forEach((id) => {
        const m = d.musculos.find((x) => x.id === id);
        if (!m) return;
        const f = el('div', 'apo-musc' + (limitan.includes(id) && m.fatiga.fase === 'cargado' ? ' limita' : ''));
        const disco = el('span');
        disco.innerHTML = M.fase(m.fatiga.paso);
        const dato = m.fatiga.dias ? t('estimadoLinea', { texto: m.fatiga.texto, listo: m.fatiga.listo }) : t('listo');
        f.append(disco, el('span', 'apo-musc-nombre', m.nombre), el('span', 'apo-musc-dato', dato));
        lista.appendChild(f);
      });
      s.appendChild(lista);
      const ley = el('div', 'apo-fases-leyenda apo-e');
      d.fatiga.fases.forEach((x) => { const sp = el('span'); sp.innerHTML = `${M.fase(x.paso)}${esc(x.nombre)}`; ley.appendChild(sp); });
      s.appendChild(ley);
    }

    function paginaSemana(s, d) {
      const sem = d.semana;
      const partes = sem.partes.filter((x) => x.estado !== 'enSuPunto' && x.estado !== 'entrenado');
      const principal = sem.primera ? t('primera') : partes[0] ? partes[0].texto : t('todoAlDia');
      // La primera semana: el resumen ya empieza con «Tu primera semana:», que es la respuesta.
      const resto = sem.primera ? conMayuscula(sem.resumen.includes(': ') ? sem.resumen.slice(sem.resumen.indexOf(': ') + 2) : sem.resumen) : sem.partes.filter((x) => x.texto !== principal).map((x) => x.texto).join(' · ');
      respuesta(s, principal, esc(resto));
      // Los siete días: lo hecho, lo que toca y hoy.
      const dias = el('div', 'apo-dias apo-e');
      sem.dias.forEach((x) => {
        const c = el('span', `apo-dia${x.hoy ? ' hoy' : ''}${x.toca ? ' toca' : ''}${x.hecho ? ' hecho' : ''}${x.fuera ? ' fuera' : ''}${!x.toca && !x.hecho ? ' descanso' : ''}`);
        c.innerHTML = `<small>${esc(x.letra)}</small><i></i>`;
        c.setAttribute('aria-label', `${x.dia}${x.nombre ? `: ${x.nombre}` : ''}`);
        dias.appendChild(c);
      });
      s.appendChild(dias);
      const fuera = sem.dias.find((x) => x.fuera);
      // El plural va por el total: «1 de 4 sesiones».
      bloque(s, 'apo-dias-linea', [tp('sesionesSemana', sem.previstas, { n: sem.hechas, de: sem.previstas }), fuera ? t('fueraEl', { dia: fuera.dia }) : null].filter(Boolean).join(' · '));
      // El cuerpo grande: tocar un músculo dice sus series (y lo marca también en la tira).
      const estados = estadosDeLaSemana(d);
      const cuerpos = el('div', 'apo-cuerpos');
      cuerpos.innerHTML = `<span data-viaja="frente">${M.figura('frente', estados)}</span><span data-viaja="espalda">${M.figura('espalda', estados)}</span>`;
      s.appendChild(cuerpos);
      const linea = bloque(s, 'apo-musculo-linea', t('tocaUnMusculo'));
      const ley = el('div', 'apo-leyenda apo-e');
      const entrenado = d.musculos.find((m) => m.estado === 'entrenado');
      (sem.primera ? [['entrenado', entrenado ? entrenado.estadoTexto : ''], ['sinEntrenar', u.tx('ascent.tus.estados.sinEntrenar')]] : [...sem.leyenda.map((x) => [x.estado, x.nombre]), ['sinEntrenar', u.tx('ascent.tus.estados.sinEntrenar')]])
        .forEach(([k, nombre]) => { const sp = el('span'); sp.innerHTML = `<i class="${k}"></i>${esc(nombre)}`; ley.appendChild(sp); });
      s.appendChild(ley);
      separador(s);
      bloque(s, 'apo-tit', t('tira'));
      const puntos = el('div', 'apo-e');
      puntos.innerHTML = tiraDePuntos(d);
      s.appendChild(puntos);
      bloque(s, 'apo-nota', t('escala'));
      if (!sem.primera) {
        ['poco', 'sinEntrenar', 'mucho'].forEach((k) => {
          const ms = d.musculos.filter((m) => m.estado === k).map((m) => m.nombre.toLowerCase());
          if (ms.length) bloque(s, 'apo-texto', t('leSalen.' + k, { lista: enLista(ms) }));
        });
      }
      const elegir = (id) => {
        s.querySelectorAll('.am-m.elegido, .punto.elegido').forEach((x) => x.classList.remove('elegido'));
        const m = d.musculos.find((x) => x.id === id);
        if (!m) return;
        s.querySelectorAll(`.am-m[data-musculo="${id}"], .punto[data-musculo="${id}"]`).forEach((x) => x.classList.add('elegido'));
        const limita = d.aviso && d.aviso.pide && d.aviso.musculos.includes(id);
        const fat = m.fatiga.dias ? `<span class="fatiga${limita ? ' limita' : ''}">${esc(conMayuscula(t('estimadoLinea', { texto: m.fatiga.texto, listo: m.fatiga.listo })))}</span>` : '';
        linea.innerHTML = `<span><b>${esc(m.nombre)}</b> · ${esc(t('musculoLinea', { n: m.series, estado: m.estadoTexto.toLowerCase() }))}</span>${fat}${m.sugerencia ? `<span>${esc(m.sugerencia)}</span>` : ''}`;
        if (!quieto) linea.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 260, easing: 'ease' });
      };
      s.addEventListener('click', (ev) => {
        const x = ev.target.closest('[data-musculo]');
        if (x && s.contains(x)) { ev.stopPropagation(); elegir(x.dataset.musculo); }
      });
      if (!sem.primera) {
        separador(s);
        bloque(s, 'apo-tit', t('rutina'));
        bloque(s, 'apo-rutina', sem.rutina.palabra);
        sem.rutina.mejoras.forEach((x) => bloque(s, 'apo-texto', x));
      }
      bloque(s, 'apo-nota', sem.anotas);
      enQueSeBasa(s, d.base.musculos.slice(0, 6));
    }
    /** Los 14 músculos en una escala de 0 a 30 series, con la franja de 10 a 20: un punto cada uno, apilados si se tocan. */
    function tiraDePuntos(d) {
      const W = 349;
      const L = 12;
      const R = W - 12;
      const { desde, hasta, tope } = d.semana.escala;
      const x = (v) => L + (Math.min(tope, v) / tope) * (R - L);
      const niveles = [];
      const puestos = [...d.musculos].sort((a, b) => a.seriesExactas - b.seriesExactas).map((m) => {
        const cx = x(m.seriesExactas);
        let k = 0;
        while ((niveles[k] || []).some((v) => Math.abs(v - cx) < 10.5)) k++;
        (niveles[k] = niveles[k] || []).push(cx);
        return { m, cx, k };
      });
      const eje = 12 + niveles.length * 10.5;
      const H = eje + 22;
      const cy = (k) => eje - 7 - k * 10.5;
      const ticks = [0, desde, hasta, tope].map((v) => `<text class="num" x="${x(v).toFixed(1)}" y="${eje + 17}">${v}</text>`).join('');
      return `<svg class="apo-puntos" viewBox="0 0 ${W} ${H.toFixed(1)}" role="img" aria-label="${esc(t('tira'))}">`
        + `<rect class="banda" x="${x(desde).toFixed(1)}" y="0" width="${(x(hasta) - x(desde)).toFixed(1)}" height="${eje}" rx="3"/>`
        + `<line class="eje" x1="${L}" y1="${eje}" x2="${R}" y2="${eje}"/>${ticks}`
        + puestos.map(({ m, cx, k }) => `<circle class="toque" data-musculo="${m.id}" cx="${cx.toFixed(1)}" cy="${cy(k).toFixed(1)}" r="9"/><circle class="punto ${m.estado}" data-musculo="${m.id}" cx="${cx.toFixed(1)}" cy="${cy(k).toFixed(1)}" r="4.4" pointer-events="none"><title>${esc(`${m.nombre}: ${m.series}`)}</title></circle>`).join('')
        + '</svg>';
    }

    function paginaFuerza(s, d) {
      const f = d.fuerza;
      if (f.vacio) {
        respuesta(s, t('pronto'), esc(f.vacio));
        enQueSeBasa(s, d.base.estancados);
        return;
      }
      respuesta(s, f.respuesta, esc(f.resumen));
      separador(s);
      f.ejercicios.forEach((e, i) => {
        const conPorQue = (e.estado === 'sinSubidaClara' || e.estado === 'bajo') && window.PorQueNoMejoro;
        const fila = el(conPorQue ? 'button' : 'div', `apo-fz ${e.estado}`);
        if (conPorQue) { fila.type = 'button'; fila.addEventListener('click', (ev) => { ev.stopPropagation(); porQue(e.id); }); }
        const texto = el('span', 'apo-e');
        texto.innerHTML = `<span class="apo-fz-nombre">${esc(e.nombre)}${conPorQue ? ICONO.chev : ''}</span><span class="apo-fz-veredicto">${esc(pegado(e.veredicto))}</span><span class="apo-fz-dato">${esc(pegado(e.dato))}</span>${e.sinMarcaTexto ? `<span class="apo-fz-marca">${esc(pegado(e.sinMarcaTexto))}</span>` : ''}`;
        const chispa = el('span', 'apo-fz-chispa');
        chispa.dataset.viaja = `t${i}`;
        chispa.innerHTML = M.chispa(e, { ancho: 128, alto: 48 });
        fila.append(texto, chispa);
        s.appendChild(fila);
        if (i < f.ejercicios.length - 1) separador(s, true);
      });
      const id = f.estancados.lista[0] || f.bajaron.lista[0];
      if (window.PorQueNoMejoro) {
        const b = u.boton('apo-boton-ancho apo-e', `<span>${esc(t('porQue'))}</span>${ICONO.chev}`, () => porQue(id));
        s.appendChild(b);
      }
      bloque(s, 'apo-nota', f.texto);
      if (f.ruido) bloque(s, 'apo-nota', f.ruido);
      enQueSeBasa(s, [...d.base.estancados, ...d.base.porQue]);
    }
    /**
     * «¿Por qué no estás mejorando?» es otra propuesta: se recuerda la página (y su vista) para volver con «‹». Si esa
     * pantalla se cierra por otro lado (una pestaña, otro botón) sin volver acá, la propuesta se cerró de verdad: vuelve
     * lo de antes (el idioma, el rango y el vínculo).
     */
    function porQue(id) {
      if (!window.PorQueNoMejoro) return;
      const ida = { vista: estado.vista, pagina: abierta ? abierta.clave : null, scroll: abierta ? abierta.scroll.scrollTop : 0 };
      estado.volverA = ida;
      window.PorQueNoMejoro.abrir(id);
      const otra = g.tel.querySelector('.pr-pantalla.pqn');
      if (!otra) return;
      const mira = new MutationObserver(() => {
        if (!otra.hidden) return;
        mira.disconnect();
        setTimeout(() => {
          if (estado.volverA !== ida || p.abierta) return;
          estado.volverA = null;
          devolver();
        }, 0);
      });
      mira.observe(otra, { attributes: true, attributeFilter: ['hidden'] });
    }

    // ---- las metas
    function metasDe(d) {
      const e = estado.metas;
      return [...e.nuevas, ...d.metas.lista.filter((m) => !e.borradas.has(m.id)).map((m) => (e.editadas[m.id] ? Object.assign({}, m, e.editadas[m.id]) : m))];
    }
    /** La respuesta grande de «¿Llego a mi meta?»: cuántas van en camino (o lo de la puerta, si ninguna). */
    function respuestaDeMetas(d) {
      const lista = metasDe(d);
      const enCamino = lista.filter((m) => m.estado === 'enCamino' && !m.editada).length;
      return !lista.length ? t('sinMeta') : enCamino ? t('enCamino', { n: enCamino, de: lista.length }) : puerta('metas', d).resp;
    }
    const ponerRespuestaDeMetas = () => {
      const n = abierta && abierta.scroll.querySelector('.apo-pag-resp');
      if (n) n.textContent = pegado(respuestaDeMetas(dia()));
    };
    function paginaMetas(s, d) {
      const lista = metasDe(d);
      const m0 = metaDeLaPuerta(d);
      respuesta(s, respuestaDeMetas(d), m0 ? null : esc(d.metas.ninguna));
      const caja = el('div', 'apo-metas');
      s.appendChild(caja);
      lista.forEach((m) => caja.appendChild(filaDeMeta(m, m === m0)));
      if (d.metas.comer && lista.length) bloque(s, 'apo-nota', d.metas.comer);
      // «Nueva meta», lejos de «Borrar» (que está adentro de cada meta, al editarla).
      const nueva = u.boton('apo-boton-ancho apo-e', `<span>${esc(d.metas.nueva)}</span><span aria-hidden="true">+</span>`, () => abrirFormulario(null, nueva, caja));
      s.appendChild(nueva);
      if (p.el.classList.contains('sin-anio') && !d.nueva) {
        separador(s);
        const b = u.boton('apo-anio-fila apo-e', `<span class="apo-anio-etq">${esc(t('anio'))}</span>${tira(d.anio.recientes).replace(' data-viaja="tira"', '')}<span class="apo-anio-n">${esc(numero(d.anio.entrenamientos))}</span>${ICONO.chev}`, () => {
          cerrarPagina(true);
          setTimeout(() => abrirPagina('anio'), 30);
        });
        b.style.borderBottom = '0';
        s.appendChild(b);
      }
      enQueSeBasa(s, d.base.metas);
    }
    function filaDeMeta(m, laDeLaPuerta) {
      const n = el('div', 'apo-meta');
      n.dataset.meta = m.id;
      const cab = el('div', 'apo-e');
      cab.append(el('p', 'apo-meta-nombre', m.nombre), el('p', 'apo-meta-objetivo', pegado([m.objetivo, m.hoy].filter(Boolean).join(' · '))));
      n.appendChild(cab);
      const dib = el('div', laDeLaPuerta ? '' : 'apo-e');
      // La que cambiaste a mano todavía no tiene ventana: la pista punteada, hasta la próxima sesión.
      if (m.estado === 'noSeSabe' && !m.semanas && !m.editada) dib.innerHTML = sesionesDeLaMeta(m);
      else dib.innerHTML = pista(m, true);
      if (!laDeLaPuerta) dib.firstElementChild.removeAttribute('data-viaja');
      if (dib.firstElementChild.classList.contains('apo-sesiones6')) dib.style.marginTop = '12px';
      n.appendChild(dib);
      // «Así no llega» remite en la app a un bloque que acá no existe («Mira “Por qué…”»): va su primera frase y, debajo,
      // la puerta a «¿Por qué no estás mejorando?».
      const primeraFrase = (s) => { const i = s.indexOf('. '); return i > 0 ? s.slice(0, i + 1) : s; };
      const noSube = m.estado === 'noSube' && !m.editada;
      const llega = m.editada ? t('recalcula') : m.estado === 'enCamino' ? m.llegas : noSube && m.estadoTexto ? primeraFrase(m.estadoTexto) : m.estadoTexto || m.falta || m.llevas || u.tx('ascent.metas.noSeSabe');
      n.appendChild(el('p', `apo-meta-llega apo-e${m.estado === 'enCamino' && !m.editada ? '' : ' no'}`, pegado(llega)));
      if (noSube && window.PorQueNoMejoro) n.appendChild(u.boton('apo-enlace apo-porque apo-e', `<span>${esc(t('porQue'))}</span>${ICONO.chev}`, () => porQue(m.ejercicio || m.id)));
      if (m.estado === 'noSeSabe' && m.llevas && m.falta && !m.editada) n.appendChild(el('p', 'apo-nota apo-e', m.llevas));
      if (m.proxima && !m.editada) n.appendChild(el('p', 'apo-nota apo-e', pegado(m.proxima)));
      if (m.pasos && m.pasos.length && !m.editada) {
        desplegable(n, m.comoLlegar, (c) => {
          const ul = el('div', 'apo-pasos');
          m.pasos.forEach((x) => {
            const f = el('div', `apo-paso-fila ${x.estado}`);
            f.innerHTML = `<i aria-hidden="true">${esc(x.marca || '·')}</i><span>${esc(pegado(x.texto))}</span>`;
            ul.appendChild(f);
          });
          c.appendChild(ul);
        });
      }
      const acciones = el('div', 'apo-meta-acciones apo-e');
      const editar = u.boton('apo-enlace', esc(u.tx('ascent.metas.editar')), () => abrirFormulario(m, editar, n));
      acciones.appendChild(editar);
      n.appendChild(acciones);
      return n;
    }
    // El formulario crece ahí donde se tocó: debajo del botón, empujando lo de abajo.
    let formulario = null;
    function abrirFormulario(meta, desde, contenedor) {
      if (formulario) cerrarFormulario(true);
      const d = dia();
      const nombreDe = (id) => u.tx('ascent.ejercicios.' + id);
      const ladoDe = (id) => (/mancuerna/.test(id) ? 'porMancuerna' : null);
      const nivelDe = (id) => {
        const e = d.fuerza.ejercicios.find((x) => x.id === id);
        return e && e.nivelKg ? e.nivelKg : null;
      };
      const f = { id: meta ? meta.ejercicio || meta.id : null, peso: meta ? meta.kilos : null, reps: meta ? meta.reps : null };
      const caja = el('div', 'apo-form-caja');
      const form = el('div', 'apo-form');
      caja.appendChild(form);
      form.appendChild(el('p', 'apo-form-tit', meta ? `${u.tx('ascent.metas.editar')} · ${meta.nombre}` : u.tx('ascent.metas.nueva')));
      // El ejercicio: un campo vacío que abre la lista con buscador (al editar, ya está elegido).
      let campoEj = null;
      let lista = null;
      if (!meta) {
        form.appendChild(el('span', 'apo-etq-campo', u.tx('ascent.metas.elegir')));
        campoEj = u.boton('apo-campo', `<span></span>${ICONO.abajo}`, () => alternarLista());
        campoEj.setAttribute('aria-expanded', 'false');
        campoEj.setAttribute('aria-label', u.tx('ascent.metas.elegir'));
        form.appendChild(campoEj);
        lista = el('div', 'apo-pliegue');
        const dentro = el('div');
        lista.appendChild(dentro);
        form.appendChild(lista);
        armarLista(dentro);
      }
      const numeros = el('div', 'apo-numeros');
      const etqPeso = el('span', 'apo-etq-campo');
      const pesoCaja = el('div');
      const pasoPeso = el('div', 'apo-paso');
      const menosP = el('button', null, '−');
      const masP = el('button', null, '+');
      [menosP, masP].forEach((b) => { b.type = 'button'; });
      const lblP = el('label');
      const inP = el('input');
      Object.assign(inP, { type: 'text', autocomplete: 'off' });
      inP.setAttribute('inputmode', 'decimal');
      lblP.append(inP, el('small', null, 'kg'));
      pasoPeso.append(menosP, lblP, masP);
      pesoCaja.append(etqPeso, pasoPeso);
      const repsCaja = el('div');
      const pasoReps = el('div', 'apo-paso');
      const menosR = el('button', null, '−');
      const masR = el('button', null, '+');
      [menosR, masR].forEach((b) => { b.type = 'button'; });
      const lblR = el('label');
      const inR = el('input', 'solo');
      Object.assign(inR, { type: 'text', autocomplete: 'off' });
      inR.setAttribute('inputmode', 'numeric');
      lblR.appendChild(inR);
      pasoReps.append(menosR, lblR, masR);
      repsCaja.append(el('span', 'apo-etq-campo', u.tx('ascent.metas.reps')), pasoReps);
      numeros.append(pesoCaja, repsCaja);
      form.appendChild(numeros);
      const total = el('p', 'apo-total');
      form.appendChild(total);
      const acciones = el('div', 'apo-form-acciones');
      const cancelar = u.boton('apo-cancelar', esc(u.tx('ascent.metas.cancelar')), () => cerrarFormulario());
      const guardar = u.boton('apo-guardar', esc(u.tx('ascent.metas.guardar')), () => guardarMeta());
      acciones.append(cancelar, guardar);
      form.appendChild(acciones);
      if (meta) {
        const borrar = u.boton('apo-borrar', esc(u.tx('ascent.metas.borrar')), () => {
          const conf = el('div', 'apo-confirmar');
          conf.appendChild(el('span', null, t('borrarPregunta', { ejercicio: enFrase(meta.nombre) })));
          const bs = el('div');
          bs.append(u.boton('', esc(t('no')), () => { conf.replaceWith(borrar); }), u.boton('si', esc(u.tx('ascent.metas.borrar')), () => borrarMeta(meta)));
          conf.appendChild(bs);
          borrar.replaceWith(conf);
          if (!quieto) conf.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
        });
        form.appendChild(borrar);
      }
      if (g.opciones.teclado) g.opciones.teclado.encadenar([inP, inR], { contenedor: abierta ? abierta.el : null });

      const lado = () => (f.id ? ladoDe(f.id) : null);
      const paso = () => (lado() ? 1 : 2.5);
      const mostrar = () => {
        etqPeso.textContent = `${t('peso')}${lado() ? ` ${u.tx('ascent.metas.' + lado())}` : ''}`;
        const enCampo = f.peso == null ? '' : u.peso(lado() ? f.peso / 2 : f.peso);
        if (document.activeElement !== inP) inP.value = enCampo;
        if (document.activeElement !== inR) inR.value = f.reps == null ? '' : String(f.reps);
        menosP.disabled = f.peso == null || f.peso <= paso();
        masP.disabled = !f.id;
        menosR.disabled = f.reps == null || f.reps <= 1;
        masR.disabled = f.reps != null && f.reps >= 10;
        total.textContent = lado() && f.peso ? u.tx('ascent.metas.enTotal', { kg: u.peso(f.peso) }) : '';
        guardar.disabled = !(f.id && f.peso >= 1 && f.reps >= 1 && f.reps <= 10);
        if (campoEj) campoEj.firstElementChild.textContent = f.id ? nombreDe(f.id) : '';
      };
      const leerNumero = (s) => { const v = parseFloat(String(s).replace(',', '.')); return Number.isFinite(v) ? v : null; };
      menosP.addEventListener('click', (ev) => { ev.stopPropagation(); f.peso = Math.max(paso(), Math.round((f.peso - paso() * (lado() ? 2 : 1)) * 100) / 100); mostrar(); });
      masP.addEventListener('click', (ev) => { ev.stopPropagation(); f.peso = f.peso == null ? paso() * (lado() ? 2 : 1) : Math.round((f.peso + paso() * (lado() ? 2 : 1)) * 100) / 100; mostrar(); });
      menosR.addEventListener('click', (ev) => { ev.stopPropagation(); f.reps = Math.max(1, (f.reps || 1) - 1); mostrar(); });
      masR.addEventListener('click', (ev) => { ev.stopPropagation(); f.reps = Math.min(10, (f.reps || 0) + 1); mostrar(); });
      inP.addEventListener('input', () => { const v = leerNumero(inP.value); f.peso = v == null ? null : lado() ? v * 2 : v; mostrar(); });
      inR.addEventListener('input', () => { const v = leerNumero(inR.value); f.reps = v == null ? null : Math.round(v); mostrar(); });

      function armarLista(dentro) {
        const c = el('div', 'apo-lista');
        const buscar = el('label', 'apo-buscar');
        buscar.innerHTML = ICONO.lupa;
        const campo = el('input');
        Object.assign(campo, { type: 'text', placeholder: u.tx('ascent.metas.buscar'), autocomplete: 'off', spellcheck: false });
        campo.setAttribute('aria-label', u.tx('ascent.metas.buscar'));
        campo.setAttribute('enterkeyhint', 'search');
        buscar.appendChild(campo);
        const sc = el('div', 'apo-lista-scroll');
        c.append(buscar, sc);
        dentro.appendChild(c);
        if (g.opciones.teclado) g.opciones.teclado.encadenar([campo], { contenedor: abierta ? abierta.el : null });
        const sinTildes = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const GRUPOS = ['pecho', 'espalda', 'hombros', 'brazos', 'piernas', 'core'];
        const todos = Object.keys(Musculos.CATALOGO).filter((id) => Musculos.CATALOGO[id].grupo !== 'cardio' && u.tx('ascent.ejercicios.' + id) !== 'ascent.ejercicios.' + id);
        // Los que ya hiciste: los de tus sesiones de Ascent, del más reciente al más viejo.
        const hechos = [];
        [...Datos.ASCENT.sesiones].reverse().forEach((x) => x.bloques.forEach((b) => { if (b.id && todos.includes(b.id) && !hechos.includes(b.id)) hechos.push(b.id); }));
        let abiertoGrupo = null;
        const opcion = (id) => {
          const b = u.boton('apo-opcion' + (f.id === id ? ' elegida' : ''), esc(nombreDe(id)), () => elegir(id));
          return b;
        };
        const pintar = () => {
          const q = sinTildes(campo.value.trim());
          sc.replaceChildren();
          if (q) {
            const hallados = todos.filter((id) => sinTildes(nombreDe(id)).includes(q) || sinTildes(u.tx('ascent.hoy.grupos.' + Musculos.CATALOGO[id].grupo)).includes(q));
            hallados.forEach((id) => sc.appendChild(opcion(id)));
            if (!hallados.length) sc.appendChild(el('p', 'apo-nada', u.tx('ascent.metas.nada')));
            return;
          }
          if (hechos.length) {
            sc.appendChild(el('p', 'apo-lista-rotulo', u.tx('ascent.metas.hechos')));
            hechos.forEach((id) => sc.appendChild(opcion(id)));
          }
          GRUPOS.forEach((gr) => {
            const suyos = todos.filter((id) => Musculos.CATALOGO[id].grupo === gr);
            if (!suyos.length) return;
            const cab = u.boton('apo-opcion grupo', `<span>${esc(u.tx('ascent.hoy.grupos.' + gr))}</span><small>${suyos.length}</small>${ICONO.abajo}`, () => {
              abiertoGrupo = abiertoGrupo === gr ? null : gr;
              sc.querySelectorAll('.apo-opcion.grupo').forEach((x) => x.setAttribute('aria-expanded', String(x === cab && abiertoGrupo === gr)));
              sc.querySelectorAll('.apo-del-grupo').forEach((x) => x.parentElement.classList.toggle('abierto', x.dataset.grupo === abiertoGrupo));
            });
            cab.setAttribute('aria-expanded', String(abiertoGrupo === gr));
            const pl = el('div', 'apo-pliegue' + (abiertoGrupo === gr ? ' abierto' : ''));
            const dd = el('div', 'apo-del-grupo');
            dd.dataset.grupo = gr;
            suyos.forEach((id) => dd.appendChild(opcion(id)));
            pl.appendChild(dd);
            sc.append(cab, pl);
          });
        };
        campo.addEventListener('input', pintar);
        pintar();
      }
      function alternarLista(si) {
        const abrir = si == null ? !lista.classList.contains('abierto') : si;
        lista.classList.toggle('abierto', abrir);
        campoEj.setAttribute('aria-expanded', String(abrir));
        lista.firstElementChild.inert = !abrir;
      }
      function elegir(id) {
        if (g.haptico) g.haptico('toque');
        f.id = id;
        const nivel = nivelDe(id);
        // Desde tu nivel, para subir con «+» (sin números de ejemplo si no hay nivel).
        if (f.peso == null && nivel) f.peso = Math.ceil(nivel / (ladoDe(id) ? 2 : 2.5)) * (ladoDe(id) ? 2 : 2.5);
        alternarLista(false);
        mostrar();
      }
      function guardarMeta() {
        if (guardar.disabled) return;
        if (g.haptico) g.haptico('exito');
        const reps = f.reps;
        // Por mancuerna se dice el peso de una, como se anota en Ascent; la meta se guarda en total.
        const enCampo = lado() ? f.peso / 2 : f.peso;
        const objetivo = (reps === 1 ? u.tx('ascent.metas.objetivoUna', { kg: u.peso(enCampo) }) : u.tx('ascent.metas.objetivoVarias', { kg: u.peso(enCampo), reps }))
          .replace(/\bkg\b/, lado() ? `kg ${u.tx('ascent.metas.' + lado())}` : 'kg');
        let nueva = null;
        if (meta) estado.metas.editadas[meta.id] = { kilos: f.peso, reps, objetivo, editada: true, semanas: null, estado: 'noSeSabe', hoy: meta.hoy };
        else {
          const nivel = nivelDe(f.id);
          nueva = { id: `nueva-${Date.now()}`, ejercicio: f.id, nombre: nombreDe(f.id), kilos: f.peso, reps, objetivo, estado: 'noSeSabe', semanas: null, editada: true, hoy: nivel ? u.tx('ascent.metas.nivelKg', { kg: u.peso(Math.floor(nivel / 2.5) * 2.5) }) : null, pasos: [] };
          estado.metas.nuevas.unshift(nueva);
        }
        cerrarFormulario(false, () => {
          const d2 = dia();
          const lista2 = abierta && abierta.scroll.querySelector('.apo-metas');
          if (!lista2) return;
          if (meta) {
            const vieja = lista2.querySelector(`[data-meta="${meta.id}"]`);
            const m2 = metasDe(d2).find((x) => x.id === meta.id);
            if (vieja && m2) { const n2 = filaDeMeta(m2, false); n2.classList.add('nueva-meta'); vieja.replaceWith(n2); }
          } else {
            const n2 = filaDeMeta(nueva, false);
            n2.classList.add('nueva-meta');
            lista2.prepend(n2);
            n2.scrollIntoView({ block: 'nearest', behavior: quieto ? 'auto' : 'smooth' });
          }
          ponerRespuestaDeMetas();
        });
      }
      function borrarMeta(m) {
        estado.metas.borradas.add(m.id);
        estado.metas.nuevas = estado.metas.nuevas.filter((x) => x.id !== m.id);
        cerrarFormulario(true);
        ponerRespuestaDeMetas();
        const fila = abierta && abierta.scroll.querySelector(`[data-meta="${m.id}"]`);
        if (!fila) return;
        if (quieto) { fila.remove(); return; }
        const h = fila.offsetHeight;
        fila.animate([{ opacity: 1, height: `${h}px` }, { opacity: 0, height: '0px' }], { duration: 360, easing: CURVA }).finished.then(() => fila.remove(), () => fila.remove());
      }
      // «Nueva meta» se pliega y el formulario crece en su lugar; «Editar meta» se apaga y el formulario se abre debajo
      // de su fila.
      const plegar = !desde.closest('.apo-meta-acciones');
      const formularioApi = { caja, desde, plegar };
      formulario = formularioApi;
      (desde.closest('.apo-meta-acciones') || desde).insertAdjacentElement('afterend', caja);
      mostrar();
      if (plegar) {
        const cs = getComputedStyle(desde);
        formularioApi.desdeAlto = { minHeight: cs.minHeight, height: `${desde.offsetHeight}px`, marginTop: cs.marginTop, borderTopWidth: cs.borderTopWidth, borderBottomWidth: cs.borderBottomWidth, opacity: 1 };
        desde.classList.add('apo-plegado');
        desde.animate([formularioApi.desdeAlto, { minHeight: '0px', height: '0px', marginTop: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', opacity: 0 }], { duration: quieto ? 1 : 360, easing: CURVA, fill: 'forwards' });
        desde.inert = true;
      } else {
        desde.style.transition = 'opacity 0.2s';
        desde.style.opacity = '0.35';
        desde.disabled = true;
      }
      if (!quieto) {
        const h = caja.offsetHeight;
        caja.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 420, easing: CURVA });
        form.animate([{ transform: 'scale(0.97)', transformOrigin: '50% 0' }, { transform: 'none', transformOrigin: '50% 0' }], { duration: 420, easing: CURVA });
      }
      return formularioApi;
    }
    function cerrarFormulario(deUna, despues) {
      const fx = formulario;
      if (!fx) return;
      formulario = null;
      if (document.activeElement && fx.caja.contains(document.activeElement)) document.activeElement.blur();
      if (g.opciones.teclado) g.opciones.teclado.ocultar();
      fx.desde.disabled = false;
      fx.desde.style.opacity = '';
      if (fx.plegar) {
        fx.desde.inert = false;
        fx.desde.getAnimations().forEach((x) => x.cancel());
        if (!deUna && !quieto) fx.desde.animate([{ minHeight: '0px', height: '0px', marginTop: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', opacity: 0 }, fx.desdeAlto], { duration: 340, easing: CURVA });
      }
      if (deUna || quieto) { fx.caja.remove(); if (despues) despues(); return; }
      const h = fx.caja.offsetHeight;
      fx.caja.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 340, easing: CURVA, fill: 'forwards' }).finished.then(() => { fx.caja.remove(); if (despues) despues(); }, () => {});
    }

    /**
     * El mapa del año (compartido) trae los meses a 7 px, en filas de 11. Acá cada mes baja 5 más y los cuadros se corren
     * 10 a la derecha: así los nombres de los meses entran a 13 px sin pisarse.
     */
    function mapaLegible(svg) {
      const BAJA = 5;
      const CORRE = 10;
      const fila = (y) => Math.floor((y + 0.01) / 11);
      const y2 = (y) => +(y + fila(y) * BAJA).toFixed(1);
      return svg
        .replace(/viewBox="0 0 ([\d.]+) ([\d.]+)"/, (_, w, h) => `viewBox="0 0 ${Number(w) + CORRE} ${Number(h) + 11 * BAJA + 3}"`)
        .replace(/(<rect [^>]*?)\bx="([\d.]+)" y="([\d.]+)"/g, (_, a, x, y) => `${a}x="${(Number(x) + CORRE).toFixed(1)}" y="${y2(Number(y))}"`)
        .replace(/(<circle [^>]*?)\bcx="([\d.]+)" cy="([\d.]+)"/g, (_, a, x, y) => `${a}cx="${(Number(x) + CORRE).toFixed(1)}" cy="${y2(Number(y))}"`)
        .replace(/(<text [^>]*?)\by="([\d.]+)"/g, (_, a, y) => `${a}y="${(y2(Number(y)) + 2).toFixed(1)}"`);
    }
    function paginaAnio(s, d) {
      const a = d.anio;
      respuesta(s, tp('entrenamientos', a.entrenamientos, { n: numero(a.entrenamientos) }), esc(`${tp('marcas', a.marcas, { n: numero(a.marcas) })} · ${a.derecha}`));
      bloque(s, 'apo-tit', t('ultimas4'));
      const tiraGrande = el('div');
      tiraGrande.innerHTML = tira(a.recientes, true);
      s.appendChild(tiraGrande.firstElementChild);
      separador(s);
      const mapa = el('div', 'apo-mapa apo-e');
      mapa.innerHTML = mapaLegible(M.mapaDelAnio(a));
      s.appendChild(mapa);
      const detalle = bloque(s, 'apo-dia-detalle', t('tocaUnDia'));
      detalle.style.color = 'var(--as-sub)';
      mapa.addEventListener('click', (ev) => {
        const r = ev.target.closest('[data-fecha]');
        if (!r || r.classList.contains('futuro')) return;
        ev.stopPropagation();
        mapa.querySelectorAll('.elegido').forEach((x) => x.classList.remove('elegido'));
        r.classList.add('elegido');
        detalle.textContent = a.detalle(r.dataset.fecha);
        detalle.style.color = '';
        if (!quieto) detalle.animate([{ opacity: 0.2, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: CURVA });
      });
      const ley = el('div', 'apo-leyenda-anio apo-e');
      a.leyenda.forEach((x) => { const sp = el('span'); sp.innerHTML = `<i class="${x.clave === 'marca' ? 'marca' : ''}"${x.color ? ` style="background:${x.color}"` : ''}></i>${esc(x.nombre)}`; ley.appendChild(sp); });
      s.appendChild(ley);
      separador(s);
      const cifras = el('div', 'apo-cifras apo-e');
      a.datos.forEach((x) => { const c = el('div'); c.innerHTML = `<b>${esc(x.valor)}</b><span>${esc(x.nombre)}</span>`; cifras.appendChild(c); });
      s.appendChild(cifras);
      if (a.ultimas.length) {
        separador(s);
        bloque(s, 'apo-tit', a.ultimasTitulo);
        const ul = el('div', 'apo-e');
        ul.style.marginTop = '8px';
        a.ultimas.forEach((x) => {
          const f = el('div', 'apo-marca-fila');
          f.innerHTML = `<i style="background:${x.color || 'var(--as-sub)'}"></i><span>${esc(pegado(x.texto))}</span><small>${esc(x.cuando)}</small>`;
          ul.appendChild(f);
        });
        s.appendChild(ul);
      }
      bloque(s, 'apo-nota', a.texto);
    }
    function paginaBasa(s, d) {
      respuesta(s, t('basaRespuesta'));
      ['musculos', 'fatigados', 'estancados', 'porQue', 'metas'].forEach((k, i) => {
        separador(s, i > 0);
        desplegable(s, t('basaGrupos.' + k), (c) => d.base[k].forEach((x) => c.appendChild(el('p', null, x))), 'apo-basa', i === 0);
      });
    }

    // ------------------------------------------------------------ el selector de fondo: crece desde el sello
    function armarBandeja() {
      const r = rangoActual();
      const cab = el('div', 'apo-band-cab apo-e');
      cab.append(el('span', 'apo-band-tit', t('fondo')), u.boton('apo-band-cerrar', ICONO.cerrar, () => cerrarBandeja(), t('cerrar')));
      // Auto (el de tu rango) y los siete cuerpos; los que no alcanzaste, velados: en Ascent el rango se gana.
      const items = [{ cual: 'auto', c: cuerpoDe(r.rango, r.planeta), nombre: t('auto'), abierto: true }]
        .concat(CUERPOS.map((k, i) => ({ cual: i, c: cuerpoDe(i + 1, planetaPara(i + 1)), nombre: t('cuerpos.' + k), abierto: i + 1 <= r.rango })));
      const minis = el('div', 'apo-minis apo-e');
      minis.setAttribute('role', 'listbox');
      minis.setAttribute('aria-label', t('fondo'));
      items.forEach((x, i) => {
        const b = el('button', `apo-mini${x.cual === 'auto' ? ' auto' : ''}${x.abierto ? '' : ' velada'}`);
        b.type = 'button';
        b.dataset.i = String(i);
        b.setAttribute('role', 'option');
        b.setAttribute('aria-label', x.abierto ? x.nombre : `${x.nombre}: ${t('velado')}`);
        const disco = el('span', 'apo-mini-disco');
        disco.style.setProperty('--apo-rgb', rgbDe(x.c));
        disco.appendChild(astro(x.c, 'lejos'));
        if (!x.abierto) disco.insertAdjacentHTML('beforeend', ICONO.candado);
        b.append(disco, el('span', 'apo-mini-nombre', x.nombre));
        b.addEventListener('click', (ev) => { ev.stopPropagation(); centrar(i, true); });
        minis.appendChild(b);
      });
      const pie = el('p', 'apo-band-pie apo-e');
      const ancho = 80;
      let actual = -1;
      // Lo que queda en el medio de la tira es el fondo, en vivo; lo velado no cambia el fondo, solo lo dice.
      const ponerActual = (i) => {
        if (i === actual) return;
        actual = i;
        minis.querySelectorAll('.apo-mini').forEach((b, k) => { b.classList.toggle('actual', k === i); b.setAttribute('aria-selected', String(k === i)); });
        const x = items[i];
        pie.innerHTML = x.cual === 'auto' ? `<b>${esc(t('auto'))}</b> · ${esc(t('autoSub'))}` : x.abierto ? `<b>${esc(x.nombre)}</b>` : `${esc(x.nombre)} · ${esc(t('velado'))}`;
        if (x.abierto && estado.fondo.cual !== x.cual) {
          estado.fondo.cual = x.cual;
          if (g.haptico) g.haptico('suave');
          pintarCielo(true);
        }
      };
      let pedido = 0;
      minis.addEventListener('scroll', () => {
        if (pedido) return;
        pedido = requestAnimationFrame(() => { pedido = 0; ponerActual(Math.max(0, Math.min(items.length - 1, Math.round(minis.scrollLeft / ancho)))); });
      }, { passive: true });
      const centrar = (i, suave) => { minis.scrollTo({ left: i * ancho, behavior: suave && !quieto ? 'smooth' : 'auto' }); if (!suave) ponerActual(i); };
      // Con el mouse, la tira también se arrastra (con el dedo ya se desliza sola): sigue al puntero sin el imán y, al
      // soltar, se centra en la más cercana. El clic que llega después de arrastrar no es un toque.
      let tiron = null;
      minis.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
        tiron = { id: ev.pointerId, x0: ev.clientX, desde: minis.scrollLeft, movio: false };
      });
      minis.addEventListener('pointermove', (ev) => {
        if (!tiron || ev.pointerId !== tiron.id) return;
        const dx = ev.clientX - tiron.x0;
        if (!tiron.movio) {
          if (Math.abs(dx) < 5) return;
          tiron.movio = true;
          minis.style.scrollSnapType = 'none';
          try { minis.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
        }
        minis.scrollLeft = tiron.desde - dx;
      });
      const soltarTira = (ev) => {
        if (!tiron || ev.pointerId !== tiron.id) return;
        const x = tiron;
        tiron = null;
        if (!x.movio) return;
        minis.style.scrollSnapType = '';
        centrar(Math.max(0, Math.min(items.length - 1, Math.round(minis.scrollLeft / ancho))), true);
        const tragar = (e) => { e.stopPropagation(); e.preventDefault(); };
        minis.addEventListener('click', tragar, { capture: true, once: true });
        setTimeout(() => minis.removeEventListener('click', tragar, { capture: true }), 350);
      };
      minis.addEventListener('pointerup', soltarTira);
      minis.addEventListener('pointercancel', soltarTira);
      // La presencia, el encuadre y «solo el cielo de Moss».
      const presencia = el('div', 'apo-band-fila apo-e');
      const des = el('div', 'apo-deslizador');
      const rango = el('input');
      Object.assign(rango, { type: 'range', min: '0', max: '1', step: '0.01', value: String(estado.fondo.presencia) });
      rango.setAttribute('aria-label', t('presencia'));
      rango.style.setProperty('--lleno', `${estado.fondo.presencia * 100}%`);
      rango.addEventListener('input', () => {
        estado.fondo.presencia = Number(rango.value);
        rango.style.setProperty('--lleno', `${estado.fondo.presencia * 100}%`);
        p.el.style.setProperty('--apo-p', rango.value);
      });
      rango.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      des.append(el('span', null, t('tenue')), rango, el('span', null, t('protagonista')));
      presencia.append(el('span', null, t('presencia')), des);
      const encuadre = el('div', 'apo-band-fila apo-e');
      const seg = el('div', 'apo-segmentos');
      ['esquina', 'horizonte', 'lejos'].forEach((k) => {
        const b = u.boton('', esc(t('encuadres.' + k)), () => {
          estado.fondo.encuadre = k;
          seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          pintarCielo(true);
        });
        b.dataset.encuadre = k;
        b.setAttribute('aria-pressed', String(estado.fondo.encuadre === k));
        seg.appendChild(b);
      });
      encuadre.append(el('span', null, t('encuadre')), seg);
      const solo = u.boton('apo-interruptor-fila apo-e', `<span>${esc(t('soloCielo'))}</span><span class="apo-interruptor" aria-hidden="true"></span>`, () => {
        estado.fondo.soloCielo = !estado.fondo.soloCielo;
        solo.setAttribute('aria-checked', String(estado.fondo.soloCielo));
        p.el.classList.toggle('solo-cielo', estado.fondo.soloCielo);
      });
      solo.setAttribute('role', 'switch');
      solo.setAttribute('aria-checked', String(estado.fondo.soloCielo));
      const pista = el('p', 'apo-band-pista apo-e', t('desliza'));
      bandeja.replaceChildren(cab, minis, pie, pista, presencia, encuadre, solo);
      bandeja.setAttribute('aria-label', t('elegirFondo'));
      [...bandeja.querySelectorAll('.apo-e')].forEach((n, i) => n.style.setProperty('--d', `${80 + i * 40}ms`));
      const elegido = estado.fondo.cual === 'auto' ? 0 : estado.fondo.cual + 1;
      return { centrar: () => centrar(elegido, false), irA: (i) => centrar(i, true), minis };
    }
    let laBandeja = null;
    function alternarBandeja() { if (bandeja.hidden) abrirBandeja(); else cerrarBandeja(); }
    function abrirBandeja() {
      if (!bandeja.hidden || ocupada) return;
      if (g.haptico) g.haptico('suave');
      laBandeja = armarBandeja();
      bandeja.hidden = false;
      velo.hidden = false;
      p.el.classList.add('con-bandeja');
      laBandeja.centrar();
      sello.setAttribute('aria-expanded', 'true');
      if (quieto) return;
      const r = bandeja.getBoundingClientRect();
      const s = sello.getBoundingClientRect();
      const x = s.left + s.width / 2 - r.left;
      const y = s.top + s.height / 2 - r.top;
      bandeja.animate([{ clipPath: `circle(0px at ${x.toFixed(0)}px ${y.toFixed(0)}px)` }, { clipPath: `circle(${Math.hypot(r.width, r.height).toFixed(0)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px)` }], { duration: 480, easing: CURVA });
    }
    function cerrarBandeja(deUna) {
      if (bandeja.hidden) return;
      sello.setAttribute('aria-expanded', 'false');
      p.el.classList.remove('con-bandeja');
      velo.hidden = true;
      if (deUna || quieto) { bandeja.hidden = true; return; }
      const r = bandeja.getBoundingClientRect();
      const s = sello.getBoundingClientRect();
      const x = s.left + s.width / 2 - r.left;
      const y = s.top + s.height / 2 - r.top;
      bandeja.animate([{ clipPath: `circle(${Math.hypot(r.width, r.height).toFixed(0)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px)` }, { clipPath: `circle(0px at ${x.toFixed(0)}px ${y.toFixed(0)}px)` }], { duration: 360, easing: CURVA })
        .finished.then(() => { if (sello.getAttribute('aria-expanded') !== 'true') bandeja.hidden = true; }, () => {});
    }

    // ------------------------------------------------------------ el idioma y el rango de la galería
    let cambiandoIdioma = false;
    function ponerIdioma(quiere) {
      const a = quiere || estado.idiomaDeAntes;
      if (!quiere) estado.idiomaDeAntes = null;
      if (!a || g.idioma === a) return;
      if (quiere && !estado.idiomaDeAntes) estado.idiomaDeAntes = g.idioma;
      cambiandoIdioma = true;
      window.__idioma(a);
      cambiandoIdioma = false;
    }
    function ponerRango(n) {
      const a = g.secciones.ascent;
      if (n) {
        if (!estado.rangoDeAntes) estado.rangoDeAntes = Object.assign({}, a.rango);
        if (a.rango.rango !== n) a.ponerRango(n, null);
      } else if (estado.rangoDeAntes) {
        const r = estado.rangoDeAntes;
        estado.rangoDeAntes = null;
        if (a.rango.rango !== r.rango || a.rango.planeta !== r.planeta) a.ponerRango(r.rango, r.planeta);
      }
    }
    /** Todo de nuevo, en el lugar (al cambiar el idioma o el rango desde la galería). */
    function repintar() {
      if (!p.abierta) return;
      sello.setAttribute('aria-label', t('elegirFondo'));
      pintarCielo(true);
      const pag = abierta ? { clave: abierta.clave, scroll: abierta.scroll.scrollTop } : null;
      const conBandeja = !bandeja.hidden;
      if (abierta) cerrarPagina(true);
      cerrarBandeja(true);
      pintarPortada(false);
      if (pag) abrirPagina(pag.clave, null, { deUna: true, scroll: pag.scroll });
      if (conBandeja) abrirBandeja();
    }
    document.getElementById('s-idioma').addEventListener('click', () => { if (!cambiandoIdioma) setTimeout(repintar, 0); });
    ['s-rango', 's-planeta'].forEach((id) => { const n = document.getElementById(id); if (n) n.addEventListener('click', () => setTimeout(repintar, 0)); });

    /** Lo de la galería como estaba antes de abrir la propuesta: el idioma, el rango y si Ascent estaba vinculada. */
    function devolver() {
      ponerIdioma(null);
      ponerRango(null);
      if (estado.vinculadaDeAntes != null) {
        const v = estado.vinculadaDeAntes;
        estado.vinculadaDeAntes = null;
        if (g.secciones.ascent.vinculada !== v) g.vincular(v);
      }
    }

    return {
      abrir(vista, arg) {
        const o = arg || {};
        if (estado.vinculadaDeAntes == null) estado.vinculadaDeAntes = g.secciones.ascent.vinculada;
        g.vincular(true);
        ponerIdioma(vista === 'en' ? 'en' : null);
        ponerRango(RANGO_DE[vista] || null);
        // Solo se vuelve a la página de antes si de verdad se vuelve de «¿Por qué no estás mejorando?» (con «‹», a la
        // misma vista); cualquier otro botón empieza de nuevo.
        const volviendo = estado.volverA && estado.volverA.vista === vista ? estado.volverA : null;
        estado.volverA = null;
        // Un botón de la galería empieza de nuevo: el aviso sin contestar y las metas como vienen.
        if (!volviendo) {
          estado.respuestas = {};
          estado.metas = { nuevas: [], borradas: new Set(), editadas: {} };
        }
        estado.vista = vista;
        estado.dia = DIA_DE[vista] || 'cargado';
        if (g.pestana !== 2) g.irA(2, true);
        if (g.secciones.ascent.abierta) g.secciones.ascent.cerrar(true);
        const yaAbierta = p.abierta;
        saliendoArriba = false;
        p.el.getAnimations().forEach((x) => x.cancel());
        p.el.style.transform = '';
        p.el.style.opacity = '';
        if (abierta) cerrarPagina(true);
        if (formulario) cerrarFormulario(true);
        cerrarBandeja(true);
        sello.innerHTML = aislar(M.marca.replace('class="as-marca"', 'class="as-marca unida"'));
        sello.setAttribute('aria-label', t('elegirFondo'));
        pintarCielo(yaAbierta);
        p.abrir();
        if (volviendo && volviendo.pagina) {
          pintarPortada(false);
          abrirPagina(volviendo.pagina, null, { deUna: true, scroll: volviendo.scroll });
          return;
        }
        if (yaAbierta) cambiarPortada(true); else pintarPortada(true);
        const pagina = PAGINA_DE[vista] || o.pagina;
        if (pagina) {
          if (quieto || o.deUna) abrirPagina(pagina, null, { deUna: true });
          else setTimeout(() => { if (estado.vista === vista && p.abierta) abrirPagina(pagina); }, yaAbierta ? 620 : 520);
        }
        if (vista === 'fondo') setTimeout(() => { if (estado.vista === vista && p.abierta) abrirBandeja(); }, quieto ? 0 : 560);
      },
      cerrar() {
        estado.vista = null;
        if (formulario) cerrarFormulario(true);
        cerrarBandeja(true);
        if (abierta) cerrarPagina(true);
        p.cerrar(saliendoArriba);
        if (saliendoArriba) { p.el.getAnimations().forEach((x) => x.cancel()); saliendoArriba = false; }
        // Al pasar a «¿Por qué no estás mejorando?» queda todo como está (el idioma también): lo decide la vuelta.
        if (!estado.volverA) devolver();
      },
    };
  },
});
