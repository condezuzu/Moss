// El sueño rehecho, tanda 2 (17/11/2026, para aprobar): lo que comparten Sueño, la pantalla bloqueada, Perfil e
// Inicio.
// - Tu periodo de melatonina (Melatonina, src/dominio/melatonina.ts): la tarjeta de Sueño, en lugar de «Esta
//   noche, a la cama a las…», y la hoja «¿Qué es?».
// - Los avisos de la noche y de la mañana reescritos (el título dice qué hacer y el cuerpo, el detalle con la hora)
//   ya están en la app, con sus palabras en src/textos (recordatorios): la pantalla bloqueada los toma de ahí
//   (Avisos.tituloDelAviso y textoDelAviso), con el mismo periodo de melatonina de la tarjeta de Sueño. Los nombres
//   de Perfil › Avisos también (perfil.avisos).
// - «Lo que hay que hacer hoy»: los pendientes que anotas por la noche (quedan en este navegador, como quedarían
//   en el teléfono), la nota donde se escriben y la lista que vuelve por la mañana, arriba de «Para hoy».
// - La guía para que cada reloj o anillo escriba el sueño en Salud (Perfil › Aparatos): cada paso está confirmado
//   en la ayuda de la marca o de Apple (spec/aparatos.md, «Conectar cada marca»). WHOOP y Sleep Cycle no tienen
//   ayuda en español: sus menús van como los escribe su ayuda.
// Los textos nuevos van acá, con las claves que tendrían en src/textos (la galería no toca src/textos mientras se
// aprueba): se suman al diccionario solo donde falta la clave, así lo que ya esté en la app manda.

const Periodo = (() => {
  const TEXTOS_NUEVOS = {
    es: {
      sueno: {
        periodo: {
          titulo: 'Tu periodo de melatonina', queEs: '¿Qué es?',
          antes: '{n} min antes que ayer', despues: '{n} min más tarde que ayer', igual: 'Igual que ayer',
          acuestate: 'Acuéstate a las {hora} para estar dormido dentro de tu periodo.',
          conDeuda: 'Acuéstate a las {hora}, cuando empieza tu periodo. Antes no: te costaría dormirte.',
          faltan: { uno: 'Falta {n} noche', otros: 'Faltan {n} noches' }, paraSaber: 'para estimarlo',
          faltanTexto: 'Moss lo calcula con tus horarios: hacen falta {minimo} noches de la última semana.',
          hoja: {
            dibujo: { sube: 'empieza a subir', periodo: 'Tu periodo' },
            queEs: 'Qué es',
            queEsTexto: 'Es la hora de la noche en que a tu cuerpo le cuesta menos dormirse. Un par de horas antes, con poca luz, empieza a subir la melatonina, la hormona que le avisa que es de noche.',
            como: 'Cómo lo calcula Moss',
            comoTexto: 'No lo mide: lo estima con tus horarios. Toma el punto medio de tu sueño de la última semana (las {medio}, con {noches}) y cuenta hacia atrás. Por eso cambia un poco cada día: si te duermes y te despiertas más tarde, tu periodo también se atrasa.',
            noches: { uno: '{n} noche', otros: '{n} noches' },
            margen: 'Con qué margen',
            margenTexto: 'Es una estimación: el de verdad puede llegar hasta una hora antes o después. Con luz fuerte o pantallas hasta tarde, llega más tarde.',
            antes: 'Si te acuestas antes',
            antesTexto: 'Para tu cuerpo todavía es temprano y puede que tardes en dormirte. Si no tienes sueño, espera un rato con luz baja.',
            despues: 'Si te acuestas después',
            despuesTexto: 'Te duermes sin problema: el periodo no se cierra. Pero la noche queda más corta.',
            pie: 'Si trabajas de noche o por turnos, esta cuenta no te sirve.',
          },
        },
        pendientes: {
          fila: 'Lo que tienes en la cabeza', filaVacia: 'Anota tus pendientes antes de acostarte',
          filaCon: { uno: '{n} pendiente para mañana', otros: '{n} pendientes para mañana' },
          titulo: 'Lo que tienes en la cabeza',
          texto: 'Escribe tus pendientes, uno por uno, y déjalos aquí. Mañana, después de despertarte, Moss te los recuerda.',
          campo: 'Un pendiente', agregar: 'Agregar', quitar: 'Quitar', listo: 'Listo',
          queda: 'Queda en tu teléfono.', lleno: 'Hasta {n}: es una lista corta.',
          ejemplos: ['Llamar al dentista', 'Pagar la luz', 'Comprar el regalo de Ana'],
        },
      },
      inicio: { pendientes: { titulo: 'Lo que hay que hacer hoy', hecho: 'Hecho' } },
      perfil: {
        aparatos: {
          guia: {
            titulo: 'Conectar un reloj o un anillo',
            texto: 'Moss lee tu sueño de la app Salud. Elige el tuyo y sigue los pasos para que lo escriba ahí.',
            marcas: {
              appleWatch: {
                nombre: 'Apple Watch',
                pasos: [
                  'En el iPhone, abre Salud › Explorar › Sueño y sigue la configuración de Sueño.',
                  'En esa configuración, deja activado el seguimiento del sueño con el Apple Watch.',
                  'Si ya la habías hecho: en la app Watch › Mi reloj › Sueño, activa el seguimiento del sueño.',
                  'Duerme con el reloj puesto: tiene que tener al menos un 30 % de batería al acostarte.',
                ],
              },
              oura: {
                nombre: 'Oura',
                pasos: [
                  'En la app Oura, abre el menú de arriba a la izquierda y entra en «Ajustes».',
                  'En «Compartir datos», toca «Salud de Apple» y activa «Conectar con Salud de Apple».',
                  'Deja activado Sueño entre lo que Oura puede escribir.',
                ],
                nota: 'Con un anillo Gen3 o posterior hace falta la membresía de Oura.',
              },
              whoop: {
                nombre: 'WHOOP',
                pasos: [
                  'En la app WHOOP, entra en More › App Settings › Integrations › Apple Health y toca «Connect».',
                  'Activa las categorías, al menos Sueño, y toca «Permitir».',
                ],
                nota: 'Si reinstalas WHOOP, hay que volver a conectarla.',
              },
              garmin: {
                nombre: 'Garmin',
                pasos: [
                  'En Garmin Connect, entra en Más › Configuración › Connect Apps › Apple Health y conéctala.',
                  'Activa Sueño y toca «Permitir».',
                  'Abre Garmin Connect por la mañana, después de sincronizar el reloj: solo envía los datos con la app abierta.',
                ],
              },
              fitbit: {
                nombre: 'Fitbit',
                pasos: [
                  'En la app Google Health, toca Conexiones › Apps y servicios.',
                  'Elige «Salud de Apple», toca «Comenzar» y acepta.',
                  'Activa las categorías de sueño y toca «Permitir».',
                ],
                nota: 'Hace falta iOS 16.4 o posterior y una cuenta de Google de adulto. Si reinstalas la app, hay que volver a conectarla.',
              },
              polar: {
                nombre: 'Polar',
                pasos: [
                  'En Polar Flow, toca Más › Ajustes generales.',
                  'Activa «Apple Health».',
                  'Activa las categorías, al menos Sueño, y toca «Permitir».',
                ],
                nota: 'Llega cuánto dormiste y a qué hora, sin etapas. «Sincronizar ahora» vuelve a enviar las dos últimas semanas.',
              },
              sleepCycle: {
                nombre: 'Sleep Cycle',
                pasos: [
                  'En Sleep Cycle, entra en Profile › More › Apple Health y toca «Connect».',
                  'En Salud › tu foto › Apps › Sleep Cycle, deja activados sus permisos.',
                ],
                nota: 'Sleep Cycle ofrece conectarse con Salud después de la noche 15.',
              },
              autoSleep: {
                nombre: 'AutoSleep',
                pasos: [
                  'AutoSleep guarda el sueño en Salud sin activar nada más: solo necesita los permisos.',
                  'En Salud › tu foto › Apps › AutoSleep, deja todo activado.',
                ],
                nota: 'Con la actualización en segundo plano desactivada, solo escribe cuando abres AutoSleep.',
              },
              otros: {
                nombre: 'Otro reloj, anillo o app',
                pasos: [
                  'En la app de tu aparato, busca la conexión con Salud (Apple Health) y actívala.',
                  'Deja que escriba Sueño.',
                  'Abre esa app por la mañana: muchas solo envían los datos al abrirlas.',
                ],
                nota: 'Sirve cualquiera que escriba el sueño en Salud. El Galaxy Watch, el Galaxy Ring y el Pixel Watch no funcionan con iPhone.',
              },
            },
            comprobar: {
              titulo: 'Cómo comprobar que llegó',
              pasos: [
                'Abre Salud › Explorar › Sueño: tiene que estar tu última noche.',
                'Baja hasta el final de esa pantalla, a las fuentes de datos: ahí aparece cada app o aparato que escribe tu sueño.',
                'Si escriben dos, Salud usa primero el de arriba: con «Editar» puedes cambiar el orden.',
                'Lo que puede escribir cada app está en Salud › tu foto › Apps.',
                'En Moss, en Sueño › «De dónde sale cada dato», ves de cuál salió la noche. Si la noche no está en Salud, a Moss no le llega.',
              ],
            },
          },
        },
      },
    },
    en: {
      sueno: {
        periodo: {
          titulo: 'Your melatonin window', queEs: 'What is it?',
          antes: '{n} min earlier than yesterday', despues: '{n} min later than yesterday', igual: 'Same as yesterday',
          acuestate: 'Go to bed at {hora} to be asleep within your window.',
          conDeuda: 'Go to bed at {hora}, when your window starts. Not earlier: you would struggle to fall asleep.',
          faltan: { uno: '{n} night to go', otros: '{n} nights to go' }, paraSaber: 'to estimate it',
          faltanTexto: 'Moss works it out from your schedule: it takes {minimo} nights from the last week.',
          hoja: {
            dibujo: { sube: 'starts rising', periodo: 'Your window' },
            queEs: 'What it is',
            queEsTexto: 'It is the time of night when your body finds it easiest to fall asleep. A couple of hours earlier, in dim light, melatonin starts rising: the hormone that tells your body it is night.',
            como: 'How Moss works it out',
            comoTexto: 'It is not measured: Moss estimates it from your schedule. It takes the midpoint of your sleep over the last week ({medio}, from {noches}) and counts back. That is why it shifts a little every day: if you fall asleep and wake up later, your window moves later too.',
            noches: { uno: '{n} night', otros: '{n} nights' },
            margen: 'How precise it is',
            margenTexto: 'It is an estimate: the real one can come up to an hour earlier or later. With bright light or screens late at night, it comes later.',
            antes: 'If you go to bed earlier',
            antesTexto: 'For your body it is still early and you may take a while to fall asleep. If you are not sleepy, wait a bit in dim light.',
            despues: 'If you go to bed later',
            despuesTexto: 'You will fall asleep just fine: the window does not close. But the night gets shorter.',
            pie: 'If you work nights or shifts, this estimate does not work for you.',
          },
        },
        pendientes: {
          fila: 'What’s on your mind', filaVacia: 'Write down your to-dos before bed',
          filaCon: { uno: '{n} to-do for tomorrow', otros: '{n} to-dos for tomorrow' },
          titulo: 'What’s on your mind',
          texto: 'Write down your to-dos, one by one, and leave them here. Tomorrow, after you wake up, Moss reminds you.',
          campo: 'A to-do', agregar: 'Add', quitar: 'Remove', listo: 'Done',
          queda: 'It stays on your phone.', lleno: 'Up to {n}: it is a short list.',
          ejemplos: ['Call the dentist', 'Pay the electricity bill', 'Buy Ana’s gift'],
        },
      },
      inicio: { pendientes: { titulo: 'To do today', hecho: 'Done' } },
      perfil: {
        aparatos: {
          guia: {
            titulo: 'Connect a watch or a ring',
            texto: 'Moss reads your sleep from the Health app. Pick yours and follow the steps so it writes there.',
            marcas: {
              appleWatch: {
                nombre: 'Apple Watch',
                pasos: [
                  'On your iPhone, open Health › Browse › Sleep and follow the Sleep setup.',
                  'During setup, leave “Track Sleep with Apple Watch” on.',
                  'If you already set it up: in the Watch app › My Watch › Sleep, turn on sleep tracking.',
                  'Wear the watch to bed: it needs at least 30% battery at bedtime.',
                ],
              },
              oura: {
                nombre: 'Oura',
                pasos: [
                  'In the Oura app, open the menu in the top left corner and go to “Settings”.',
                  'Under “Data sharing”, tap “Apple Health” and turn on “Connect to Health”.',
                  'Leave Sleep on among what Oura can write.',
                ],
                nota: 'A Gen3 ring or later needs an Oura membership.',
              },
              whoop: {
                nombre: 'WHOOP',
                pasos: [
                  'In the WHOOP app, go to More › App Settings › Integrations › Apple Health and tap “Connect”.',
                  'Turn on the categories, at least Sleep, and tap “Allow”.',
                ],
                nota: 'If you reinstall WHOOP, you have to connect it again.',
              },
              garmin: {
                nombre: 'Garmin',
                pasos: [
                  'In Garmin Connect, go to More › Settings › Connect Apps › Apple Health and connect it.',
                  'Turn on Sleep and tap “Allow”.',
                  'Open Garmin Connect in the morning, after syncing your watch: it only sends data while the app is open.',
                ],
              },
              fitbit: {
                nombre: 'Fitbit',
                pasos: [
                  'In the Google Health app, tap Connections › Apps and services.',
                  'Choose “Apple Health”, tap “Get started” and agree.',
                  'Turn on the sleep categories and tap “Allow”.',
                ],
                nota: 'It needs iOS 16.4 or later and an adult Google Account. If you reinstall the app, connect it again.',
              },
              polar: {
                nombre: 'Polar',
                pasos: [
                  'In Polar Flow, tap More › General settings.',
                  'Turn on “Apple Health”.',
                  'Turn on the categories, at least Sleep, and tap “Allow”.',
                ],
                nota: 'It sends how long you slept and when, without stages. “Sync now” resends the last two weeks.',
              },
              sleepCycle: {
                nombre: 'Sleep Cycle',
                pasos: [
                  'In Sleep Cycle, go to Profile › More › Apple Health and tap “Connect”.',
                  'In Health › your picture › Apps › Sleep Cycle, leave its permissions on.',
                ],
                nota: 'Sleep Cycle offers to connect with Health after your 15th night.',
              },
              autoSleep: {
                nombre: 'AutoSleep',
                pasos: [
                  'AutoSleep saves sleep to Health with nothing else to turn on: it only needs the permissions.',
                  'In Health › your picture › Apps › AutoSleep, leave everything on.',
                ],
                nota: 'With Background App Refresh off, it only writes when you open AutoSleep.',
              },
              otros: {
                nombre: 'Another watch, ring or app',
                pasos: [
                  'In your device’s app, find the Health (Apple Health) connection and turn it on.',
                  'Let it write Sleep.',
                  'Open that app in the morning: many only send data when opened.',
                ],
                nota: 'Anything that writes sleep to Health works. The Galaxy Watch, the Galaxy Ring and the Pixel Watch do not work with iPhone.',
              },
            },
            comprobar: {
              titulo: 'How to check it arrived',
              pasos: [
                'Open Health › Browse › Sleep: your latest night should be there.',
                'Scroll to the bottom of that screen, to the data sources: every app or device that writes your sleep is listed.',
                'If two of them write, Health uses the top one first: “Edit” lets you change the order.',
                'What each app can write is in Health › your picture › Apps.',
                'In Moss, Sleep › “Where each number comes from” shows which one the night came from. If the night is not in Health, Moss does not get it.',
              ],
            },
          },
        },
      },
    },
  };
  function completar(destino, origen) {
    Object.entries(origen).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (!destino[k] || typeof destino[k] !== 'object') destino[k] = {};
        completar(destino[k], v);
      } else if (destino[k] == null) destino[k] = v;
    });
  }
  if (typeof TEXTOS !== 'undefined' && TEXTOS) ['es', 'en'].forEach((i) => { if (TEXTOS[i]) completar(TEXTOS[i], TEXTOS_NUEVOS[i]); });

  const CSS = `
/* La deuda, como la pediste el 17/11: el número de una, la palabra a la derecha en una pastilla y, debajo, lo que
   duermes y lo que necesitas, que se cambia ahí mismo. */
.sn-deuda-cifra { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sn-deuda-cifra b { font: 400 34px/1 var(--numeros); letter-spacing: -0.015em; color: #fbf2d9; font-variant-numeric: tabular-nums; }
.sn-deuda-cifra b.cambia { animation: sn-aparece 0.3s ease both; }
.sn-palabra { flex: none; padding: 7px 12px; border-radius: 999px; font: 500 12.5px/1 var(--texto); font-style: normal; letter-spacing: 0.02em; transition: background 0.3s ease, color 0.3s ease; }
.sn-palabra.sinDeuda { color: var(--sn-verde-claro); background: rgba(46, 168, 160, 0.2); }
.sn-palabra.baja { color: #b9d6fb; background: rgba(120, 170, 240, 0.18); }
.sn-palabra.media { color: var(--oro-claro); background: rgba(232, 196, 106, 0.15); }
.sn-palabra.alta { color: #f3bf9f; background: rgba(239, 176, 140, 0.16); }
.sn-deuda-linea { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 7px; margin: 2px 0 0; font: 400 13.5px/1.4 var(--texto); color: #c9d8f5; font-variant-numeric: tabular-nums; }
.sn-deuda-linea i { font-style: normal; color: var(--sn-3); }
.sn-necesitas { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin: -5px -6px; padding: 5px 6px; border: 0; border-radius: 8px; background: none; color: var(--oro-claro); font: inherit; transition: background 0.2s ease; }
.sn-necesitas svg { width: 13px; height: 13px; transition: transform 0.3s ease; }
.sn-necesitas[aria-expanded='true'] { background: rgba(232, 196, 106, 0.1); }
.sn-necesitas[aria-expanded='true'] svg { transform: rotate(180deg); }
.sn-necesidades { display: grid; gap: 8px; margin: 4px 0 2px; overflow: hidden; }
.sn-necesidades.entra { animation: pe-abre 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sn-necesidades.sale { animation: pe-cierra 0.24s ease both; }
.sn-necesidades span { font: 400 11.5px/1.2 var(--texto); color: var(--sn-3); }
.sn-necesidades div { display: flex; flex-wrap: wrap; gap: 6px; }
.sn-necesidades button { appearance: none; cursor: pointer; padding: 8px 11px; border-radius: 999px; border: 1px solid rgba(150, 178, 240, 0.24); background: rgba(150, 178, 240, 0.08); color: var(--sn-2); font: 400 13px/1 var(--numeros); font-variant-numeric: tabular-nums; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.12s ease; }
.sn-necesidades button:active { transform: scale(0.96); }
.sn-necesidades button[aria-pressed='true'] { background: rgba(232, 196, 106, 0.2); border-color: rgba(232, 196, 106, 0.55); color: var(--tinta); }
.sn-necesidades > span { text-wrap: pretty; line-height: 1.4; }
.sn-propuesta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; margin: 0; font: 400 12.5px/1.4 var(--texto); color: var(--sn-3); animation: sn-aparece 0.35s ease both; }
.sn-propuesta button { appearance: none; cursor: pointer; padding: 4px 0; border: 0; background: none; color: var(--oro-claro); font: inherit; }
.sn-con-telefono { appearance: none; cursor: pointer; display: flex; align-items: center; gap: 6px; margin: 2px 0 0; padding: 2px 0; border: 0; background: none; color: var(--sn-3); font: 400 12px/1.4 var(--texto); text-align: left; text-wrap: pretty; }
.sn-con-telefono svg { flex: none; width: 13px; height: 13px; }
/* En Afinar, el margen para dormirte: el título, lo que se elige y qué es. */
.sn-afinar-margen { display: grid; gap: 9px; padding: 13px 0 4px; border-top: 1px solid rgba(239, 230, 207, 0.07); }
.sn-afinar-margen b { font: 400 15px/1.2 var(--texto); }
.sn-afinar-margen .sn-nota { margin: 0; }
@keyframes pe-abre { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 120px; } }
@keyframes pe-cierra { from { opacity: 1; max-height: 120px; } to { opacity: 0; max-height: 0; margin: 0; } }

/* Tu periodo de melatonina: las dos horas en grande, cuánto cambió desde ayer y a qué hora acostarte. */
.sueno .pg-carta.sn-periodo { background: linear-gradient(140deg, rgba(34, 44, 110, 0.5), rgba(18, 60, 74, 0.42)); border-color: rgba(150, 178, 240, 0.16); gap: 8px; }
.sn-periodo-que { appearance: none; cursor: pointer; margin: -6px -6px -6px 0; padding: 6px; border: 0; background: none; color: var(--oro-claro); font: 400 13px/1 var(--texto); }
.sn-periodo-horas { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 10px; }
.sn-periodo-horas b { font: 400 30px/1 var(--numeros); letter-spacing: -0.01em; color: #fbf2d9; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sn-periodo-corrido { font: 400 12px/1 var(--texto); font-style: normal; padding: 6px 9px; border-radius: 999px; color: #c6d6fa; background: rgba(150, 178, 240, 0.14); white-space: nowrap; }
.sn-periodo-pista { position: relative; height: 6px; margin: 4px 0 2px; border-radius: 3px; background: rgba(150, 178, 240, 0.12); overflow: hidden; }
.sn-periodo-pista i { position: absolute; top: 0; bottom: 0; }
.sn-periodo-pista .sube { background: linear-gradient(90deg, rgba(138, 219, 200, 0), rgba(138, 219, 200, 0.5)); }
.sn-periodo-pista .tramo { border-radius: 3px; background: linear-gradient(90deg, #8adbc8, #9fb6ff); transform-origin: left; }
.sn-periodo.sn-entra .sn-periodo-pista .tramo { animation: pe-tramo 0.7s 0.2s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes pe-tramo { from { transform: scaleX(0); opacity: 0; } }
.sn-periodo-texto { margin: 0; font: 400 14.5px/1.42 var(--texto); color: rgba(239, 230, 207, 0.9); text-wrap: pretty; }
.sn-periodo-texto b { font-weight: 500; color: #fbf2d9; font-variant-numeric: tabular-nums; }

/* La fila de lo pendiente, debajo del periodo: solo con el aviso activado. */
.sn-pendientes { appearance: none; cursor: pointer; display: grid; grid-template-columns: 30px minmax(0, 1fr) 18px; align-items: center; gap: 11px; width: 100%; margin-top: 10px; padding: 11px 12px 11px 14px; border-radius: 16px; border: 1px solid rgba(150, 178, 240, 0.11); background: rgba(12, 20, 46, 0.5); color: var(--tinta); text-align: left; transition: transform 0.12s ease, background 0.2s ease; }
.sn-pendientes:active { transform: scale(0.985); background: rgba(20, 30, 62, 0.6); }
.sn-pendientes.sn-entra { animation: sn-aparece 0.42s 0.08s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sn-pendientes .ico { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: rgba(232, 196, 106, 0.12); color: var(--oro-claro); }
.sn-pendientes svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.sn-pendientes > svg { color: var(--sn-3); }
.sn-pendientes span { display: grid; gap: 3px; min-width: 0; }
.sn-pendientes b { font: 400 14.5px/1.2 var(--texto); }
.sn-pendientes small { font: 400 12px/1.2 var(--texto); color: var(--sn-3); }

/* La hoja «¿Qué es?»: el dibujo de la noche y cinco párrafos cortos. */
.tel .pe-hoja .pe-cuerpo { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; padding: 4px 20px calc(var(--abajo) + 20px); }
.tel .pe-hoja .pe-cuerpo::-webkit-scrollbar { display: none; }
.pe-dibujo { margin: 6px 0 2px; padding: 12px 10px 8px; border-radius: 18px; background: linear-gradient(150deg, rgba(34, 44, 110, 0.42), rgba(18, 60, 74, 0.34)); border: 1px solid rgba(150, 178, 240, 0.14); }
.pe-dibujo svg { display: block; width: 100%; height: auto; overflow: visible; fill: none; }
.pe-dibujo .eje { stroke: rgba(196, 212, 246, 0.26); stroke-width: 1; }
.pe-dibujo .marca { stroke: rgba(196, 212, 246, 0.5); stroke-width: 1; }
.pe-dibujo .curva { stroke: #8adbc8; stroke-width: 2; stroke-dasharray: 1; stroke-dashoffset: 0; animation: pe-traza 1.1s 0.25s cubic-bezier(0.3, 0.7, 0.2, 1) both; }
.pe-dibujo .banda { stroke: none; animation: hj-aparece 0.6s 0.7s ease both; }
.pe-dibujo text { stroke: none; fill: rgba(214, 226, 250, 0.86); font: 400 10.5px var(--numeros); text-anchor: middle; font-variant-numeric: tabular-nums; }
.pe-dibujo text.chico { fill: rgba(196, 212, 246, 0.66); font: 400 9.5px var(--texto); }
.pe-dibujo text.nombre { fill: #fbf2d9; font: 500 10.5px var(--texto); }
@keyframes pe-traza { from { stroke-dashoffset: 1; } }
.pe-parte { margin: 16px 2px 0; }
.pe-parte h4 { margin: 0 0 5px; font: 500 14.5px/1.25 var(--texto); color: var(--tinta); }
.pe-parte p { margin: 0; font: 300 14px/1.5 var(--texto); color: rgba(239, 230, 207, 0.82); text-wrap: pretty; }
.pe-pie { margin: 18px 2px 0; padding-top: 12px; border-top: 1px solid rgba(239, 230, 207, 0.08); font: 400 12.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.5); }

/* La nota de lo pendiente: se escribe uno, entra en la lista; se quita, y la lista se cierra sobre él. */
.tel .pe-nota .pe-cuerpo { padding-top: 0; }
.pe-nota-texto { margin: 6px 4px 12px; font: 300 14px/1.48 var(--texto); color: rgba(239, 230, 207, 0.78); text-wrap: pretty; }
.pe-lista { list-style: none; margin: 0; padding: 0; }
.pe-item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.28s ease, opacity 0.22s ease; }
.pe-item > div { min-height: 0; overflow: hidden; }
.pe-item.entra { animation: pe-entra 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.pe-item.sale { grid-template-rows: 0fr; opacity: 0; }
@keyframes pe-entra { from { grid-template-rows: 0fr; opacity: 0; } }
.pe-item-fila { display: grid; grid-template-columns: 8px minmax(0, 1fr) 30px; align-items: center; gap: 11px; padding: 9px 2px 9px 6px; border-bottom: 1px solid rgba(239, 230, 207, 0.07); }
.pe-item-fila i { width: 6px; height: 6px; border-radius: 50%; background: var(--oro-claro); opacity: 0.8; }
.pe-item-fila span { font: 400 15px/1.3 var(--texto); color: var(--tinta); overflow-wrap: anywhere; }
.pe-quitar { appearance: none; cursor: pointer; display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 50%; background: none; color: rgba(239, 230, 207, 0.45); transition: background 0.2s ease, color 0.2s ease; }
.pe-quitar:active { background: rgba(239, 230, 207, 0.1); color: var(--tinta); }
.pe-quitar svg { width: 13px; height: 13px; stroke-width: 2; }
.pe-nuevo { display: grid; grid-template-columns: minmax(0, 1fr) 46px; gap: 8px; margin-top: 12px; }
.pe-nuevo .hh-campo { padding: 12px 14px; }
.pe-agregar { appearance: none; cursor: pointer; display: grid; place-items: center; border-radius: 14px; border: 1px solid rgba(232, 196, 106, 0.45); background: rgba(232, 196, 106, 0.1); color: var(--oro-claro); transition: opacity 0.2s ease, transform 0.12s ease; }
.pe-agregar:active { transform: scale(0.94); }
.pe-agregar:disabled { opacity: 0.35; cursor: default; }
.pe-agregar svg { width: 18px; height: 18px; stroke-width: 2; }
.pe-nota-pie { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; }
.pe-nota-pie small { font: 400 12px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); transition: color 0.2s ease; }
.pe-nota-pie small.lleno { color: var(--oro-claro); }
.pe-listo { appearance: none; cursor: pointer; padding: 11px 22px; border: 0; border-radius: 999px; background: var(--oro-claro); color: #1a1608; font: 500 14px/1 var(--texto); transition: transform 0.12s ease; }
.pe-listo:active { transform: scale(0.96); }

/* En Inicio, arriba de «Para hoy»: lo que anotaste anoche, para ir tachando. */
.pe-hoy { display: grid; gap: 2px; padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px solid rgba(239, 230, 207, 0.06); animation: sn-aparece 0.4s both; }
.pe-hoy h4 { margin: 0 0 4px; font: 500 14px/1.3 var(--texto); color: var(--tinta); }
.pe-hoy ul { list-style: none; margin: 0; padding: 0; display: grid; }
.pe-hoy-item { appearance: none; cursor: pointer; display: grid; grid-template-columns: 22px minmax(0, 1fr); align-items: center; gap: 11px; width: 100%; padding: 7px 0; border: 0; background: none; color: rgba(239, 230, 207, 0.9); text-align: left; font: 300 14.5px/1.35 var(--texto); }
.pe-hoy-item i { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgba(239, 230, 207, 0.4); transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1); }
.pe-hoy-item i svg { width: 12px; height: 12px; fill: none; stroke: #14200f; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset 0.3s 0.05s ease; }
.pe-hoy-item span { position: relative; justify-self: start; transition: color 0.3s ease; }
.pe-hoy-item span::after { content: ''; position: absolute; left: 0; right: 0; top: 52%; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease; }
.pe-hoy-item[aria-pressed='true'] i { background: var(--salvia); box-shadow: none; transform: scale(1.08); }
.pe-hoy-item[aria-pressed='true'] i svg { stroke-dashoffset: 0; }
.pe-hoy-item[aria-pressed='true'] span { color: rgba(239, 230, 207, 0.45); }
.pe-hoy-item[aria-pressed='true'] span::after { transform: scaleX(1); }

/* La guía de cada marca, en Perfil › Aparatos: los pasos numerados y lo que conviene saber. */
.pf-guia .pf-marca-texto > div { overflow: hidden; min-height: 0; padding: 0 16px; opacity: 0; transition: opacity 0.25s ease, padding 0.35s ease; }
.pf-guia li.abierta .pf-marca-texto > div { opacity: 1; padding-bottom: 14px; }
.pf-guia-paso { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; margin: 0 0 8px; font: 400 13.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.84); text-wrap: pretty; }
.pf-guia-paso i { font: 500 12.5px/1.56 var(--numeros); font-style: normal; color: var(--oro-claro); font-variant-numeric: tabular-nums; }
.pf-guia .pf-marca-texto small { display: block; margin-top: 2px; font: 400 12.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.55); }
.pf-guia li.pf-guia-comprobar .pf-marca span { color: var(--oro-claro); }

@media (prefers-reduced-motion: reduce) {
  .sn-deuda-cifra b.cambia, .sn-propuesta, .sn-necesidades.entra, .sn-necesidades.sale, .sn-periodo.sn-entra .sn-periodo-pista .tramo, .sn-pendientes.sn-entra, .pe-dibujo .curva, .pe-dibujo .banda, .pe-item.entra, .pe-hoy { animation: none; }
  .sn-palabra, .sn-necesitas, .sn-necesitas svg, .sn-necesidades button, .sn-pendientes, .pe-item, .pe-quitar, .pe-agregar, .pe-listo, .pe-nota-pie small, .pe-hoy-item i, .pe-hoy-item i svg, .pe-hoy-item span, .pe-hoy-item span::after { transition: none; }
}
`;
  let conEstilo = false;
  function estilo() {
    if (conEstilo) return;
    conEstilo = true;
    const e = document.createElement('style');
    e.textContent = CSS;
    document.head.appendChild(e);
  }
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const LAPIZ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5l4 4L9 19H5v-4z"/><path d="M13 7l4 4"/></svg>';
  const TILDE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /** «7 h 10», «8 h» o «45 min»: la duración corta de la tarjeta de la deuda, como en la app (enHoras, en Deuda.tsx). */
  function corta(u, min) {
    const total = Math.round(min), h = Math.floor(total / 60), m = total % 60;
    if (!h) return u.tx('fecha.minutos', { m });
    return m ? u.tx('sueno.deuda.horasYMinutos', { h, m: String(m).padStart(2, '0') }) : u.tx('fecha.horas', { h });
  }
  /** «9 min antes que ayer», «7 min más tarde que ayer» o «Igual que ayer»; sin ayer, nada. */
  function corrido(u, p) {
    if (p.corrido === null) return null;
    return p.corrido === 0 ? u.tx('sueno.periodo.igual') : u.tx(p.corrido < 0 ? 'sueno.periodo.antes' : 'sueno.periodo.despues', { n: Math.abs(p.corrido) });
  }

  // ------------------------------------------------------------ lo pendiente
  // Queda en este navegador, como quedaría en el teléfono: si está activado (apagado de fábrica, con el aviso
  // «Anotar lo que tienes en la cabeza») y los pendientes. Los de mentira se guardan por su número, así se leen en
  // el idioma de la galería.
  const GUARDADO = 'moss-galeria-pendientes';
  const MAXIMO = 6;
  const LARGO = 60;
  const pendientes = (() => {
    let estado = null;
    const oyentes = new Set();
    const deFabrica = () => ({ activo: false, items: [0, 1, 2].map((ejemplo) => ({ id: 'e' + ejemplo, ejemplo, hecho: false })) });
    const leer = () => {
      if (estado) return estado;
      try { estado = JSON.parse(localStorage.getItem(GUARDADO) || 'null'); } catch (_) { estado = null; }
      if (!estado || !Array.isArray(estado.items)) estado = deFabrica();
      return estado;
    };
    const guardar = (callado) => {
      try { localStorage.setItem(GUARDADO, JSON.stringify(estado)); } catch (_) { /* no pasa nada */ }
      if (!callado) oyentes.forEach((f) => f());
    };
    return {
      MAXIMO,
      get activo() { return leer().activo; },
      activar(si) { leer().activo = !!si; guardar(); },
      items: () => leer().items,
      textoDe: (item, u) => (item.texto != null ? item.texto : u.tx('sueno.pendientes.ejemplos')[item.ejemplo] || ''),
      agregar(texto) {
        const limpio = Array.from(String(texto).trim()).slice(0, LARGO).join('').trim();
        if (!limpio || leer().items.length >= MAXIMO) return null;
        const item = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), texto: limpio, hecho: false };
        estado.items.push(item);
        guardar();
        return item;
      },
      quitar(id) { leer().items = estado.items.filter((x) => x.id !== id); guardar(); },
      /** Tachar en Inicio no rearma nada: la fila ya cambió sola. */
      marcar(id, hecho) { const item = leer().items.find((x) => x.id === id); if (item) { item.hecho = !!hecho; guardar(true); } },
      reiniciar(activo) { estado = deFabrica(); estado.activo = !!activo; guardar(); },
      alCambiar(f) { oyentes.add(f); },
    };
  })();

  /** La fila de Sueño que abre la nota; sin el aviso activado, nada. */
  function filaDePendientes(u, alTocar, entra) {
    estilo();
    if (!pendientes.activo) return null;
    const n = pendientes.items().length;
    const b = u.boton('sn-pendientes' + (entra ? ' sn-entra' : ''), `<i class="ico">${LAPIZ}</i>`, alTocar);
    const textos = u.el('span');
    textos.append(u.el('b', null, u.tx('sueno.pendientes.fila')), u.el('small', null, n ? u.plural('sueno.pendientes.filaCon', n) : u.tx('sueno.pendientes.filaVacia')));
    b.appendChild(textos);
    b.insertAdjacentHTML('beforeend', u.icono('adelante'));
    return b;
  }

  /** La nota corta: lo pendiente, uno por uno. Se abre desde la fila de Sueño o tocando el aviso de la noche. */
  function nota(tel, opciones) {
    estilo();
    const u = Util.crear(opciones);
    const { tx, el, boton, icono } = u;
    const hoja = Util.hoja(tel, 'sn-hoja pe-hoja pe-nota', () => {});
    let lista = null, campo = null, agregar = null, cuenta = null;
    const alDia = () => {
      const lleno = pendientes.items().length >= MAXIMO;
      campo.disabled = lleno;
      agregar.disabled = lleno || !campo.value.trim();
      cuenta.textContent = lleno ? tx('sueno.pendientes.lleno', { n: MAXIMO }) : tx('sueno.pendientes.queda');
      cuenta.classList.toggle('lleno', lleno);
    };
    function fila(item, nueva) {
      const li = el('li', 'pe-item' + (nueva && !quieto() ? ' entra' : ''));
      const dentro = el('div');
      const f = el('div', 'pe-item-fila');
      f.append(el('i'), el('span', null, pendientes.textoDe(item, u)), boton('pe-quitar', icono('cerrar'), () => {
        pendientes.quitar(item.id);
        alDia();
        if (quieto()) { li.remove(); return; }
        li.classList.remove('entra');
        li.classList.add('sale');
        setTimeout(() => li.remove(), 300);
      }, tx('sueno.pendientes.quitar')));
      dentro.appendChild(f);
      li.appendChild(dentro);
      return li;
    }
    function sumar() {
      const item = pendientes.agregar(campo.value);
      if (!item) return;
      campo.value = '';
      lista.appendChild(fila(item, true));
      alDia();
      campo.focus();
    }
    function pintar() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('sueno.pendientes.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pe-cuerpo');
      cuerpo.appendChild(el('p', 'pe-nota-texto', tx('sueno.pendientes.texto')));
      lista = el('ul', 'pe-lista');
      pendientes.items().forEach((item) => lista.appendChild(fila(item, false)));
      const nuevo = el('form', 'pe-nuevo');
      campo = el('input', 'hh-campo');
      campo.type = 'text';
      campo.maxLength = LARGO;
      campo.placeholder = tx('sueno.pendientes.campo');
      campo.setAttribute('aria-label', tx('sueno.pendientes.campo'));
      campo.setAttribute('enterkeyhint', 'done');
      agregar = boton('pe-agregar', icono('mas'), sumar, tx('sueno.pendientes.agregar'));
      campo.addEventListener('input', alDia);
      nuevo.addEventListener('submit', (ev) => { ev.preventDefault(); sumar(); });
      nuevo.append(campo, agregar);
      const pie = el('div', 'pe-nota-pie');
      cuenta = el('small');
      pie.append(cuenta, boton('pe-listo', tx('sueno.pendientes.listo'), () => hoja.cerrar()));
      cuerpo.append(lista, nuevo, pie);
      h.append(cab, cuerpo);
      alDia();
    }
    return {
      abrir() { pintar(); hoja.abrir(); },
      cerrar: (deUna) => hoja.cerrar(deUna),
      get abierta() { return hoja.abierta; },
      // Para las capturas: escribir uno sin agregarlo, agregarlo o quitar el primero.
      escribir(texto) { if (campo) { campo.value = texto; alDia(); } },
      sumar: () => sumar(),
      quitarPrimero() { const b = hoja.el.querySelector('.pe-quitar'); if (b) b.click(); },
    };
  }

  /** En Inicio, arriba de «Para hoy»: lo que anotaste anoche, para ir tachando. Sin nada o con el aviso apagado, null. */
  function listaDeHoy(u) {
    estilo();
    const items = pendientes.items();
    if (!pendientes.activo || !items.length) return null;
    const caja = u.el('div', 'pe-hoy');
    caja.appendChild(u.el('h4', null, u.tx('inicio.pendientes.titulo')));
    const ul = u.el('ul');
    items.forEach((item) => {
      const li = u.el('li');
      const b = u.boton('pe-hoy-item', `<i>${TILDE}</i>`, () => {
        const hecho = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(hecho));
        pendientes.marcar(item.id, hecho);
      });
      b.setAttribute('aria-pressed', String(!!item.hecho));
      b.appendChild(u.el('span', null, pendientes.textoDe(item, u)));
      li.appendChild(b);
      ul.appendChild(li);
    });
    caja.appendChild(ul);
    return caja;
  }

  // ------------------------------------------------------------ la hoja «¿Qué es?»
  /** La noche en un dibujo: la melatonina que sube desde su inicio y el tramo del periodo, con sus horas. */
  function dibujo(u, p) {
    const W = 320, H = 118, base = 78, alto = 54;
    const desde = p.inicio - 50, hasta = p.hasta + 62;
    const x = (m) => 6 + ((m - desde) / (hasta - desde)) * (W - 12);
    // Una curva en S: casi nada antes del inicio, arriba cuando empieza el periodo.
    const nivel = (m) => 1 / (1 + Math.exp(-(m - (p.inicio + 62)) / 20));
    let d = '';
    for (let m = desde; m <= hasta; m += 4) d += `${d ? 'L' : 'M'}${x(m).toFixed(1)} ${(base - alto * nivel(m)).toFixed(1)}`;
    const hora = (m) => u.horaMin(m + 18 * 60);
    const id = 'pe' + Math.random().toString(36).slice(2, 8);
    const caja = u.el('div', 'pe-dibujo');
    caja.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9fb6ff" stop-opacity="0.34"/><stop offset="1" stop-color="#8adbc8" stop-opacity="0.08"/></linearGradient></defs>
      <rect class="banda" x="${x(p.desde).toFixed(1)}" y="12" width="${(x(p.hasta) - x(p.desde)).toFixed(1)}" height="${base - 12}" rx="7" fill="url(#${id})"/>
      <text class="nombre" x="${((x(p.desde) + x(p.hasta)) / 2).toFixed(1)}" y="8">${u.tx('sueno.periodo.hoja.dibujo.periodo')}</text>
      <line class="eje" x1="6" x2="${W - 6}" y1="${base}" y2="${base}"/>
      <path class="curva" pathLength="1" d="${d}"/>
      ${[p.inicio, p.desde, p.hasta].map((m) => `<line class="marca" x1="${x(m).toFixed(1)}" x2="${x(m).toFixed(1)}" y1="${base}" y2="${base + 5}"/><text x="${x(m).toFixed(1)}" y="${base + 18}">${hora(m)}</text>`).join('')}
      <text class="chico" x="${x(p.inicio).toFixed(1)}" y="${base + 31}">${u.tx('sueno.periodo.hoja.dibujo.sube')}</text>
    </svg>`;
    return caja;
  }
  /** Qué es, cómo lo estima Moss, con qué margen y qué pasa si te acuestas antes o después. */
  function hoja(tel, opciones) {
    estilo();
    const u = Util.crear(opciones);
    const { tx, el, boton, icono } = u;
    const h = Util.hoja(tel, 'sn-hoja pe-hoja', () => {});
    function pintar(p) {
      h.el.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('sueno.periodo.titulo')), boton('hb-cerrar', icono('cerrar'), () => h.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pe-cuerpo');
      cuerpo.appendChild(dibujo(u, p));
      const parte = (clave, valores) => {
        const s = el('section', 'pe-parte');
        s.append(el('h4', null, tx('sueno.periodo.hoja.' + clave)), el('p', null, tx(`sueno.periodo.hoja.${clave}Texto`, valores)));
        cuerpo.appendChild(s);
      };
      // El punto medio de tu sueño: del comienzo del periodo, 4 h 30 hacia adelante.
      const medio = p.desde - Melatonina.PERIODO.desde + Melatonina.ANTES_DEL_PUNTO_MEDIO;
      parte('queEs');
      parte('como', { medio: u.horaMin(medio + 18 * 60), noches: u.plural('sueno.periodo.hoja.noches', p.noches) });
      parte('margen');
      parte('antes');
      parte('despues');
      cuerpo.appendChild(el('p', 'pe-pie', tx('sueno.periodo.hoja.pie')));
      h.el.append(cab, cuerpo);
    }
    return {
      abrir(p) { pintar(p); h.abrir(); },
      cerrar: (deUna) => h.cerrar(deUna),
      get abierta() { return h.abierta; },
      bajar(y) { const c = h.el.querySelector('.pe-cuerpo'); if (c) c.scrollTop = y == null ? c.scrollHeight : y; },
    };
  }

  // Las marcas de la guía, en el orden en que se muestran.
  const GUIA = ['appleWatch', 'oura', 'whoop', 'garmin', 'fitbit', 'polar', 'sleepCycle', 'autoSleep', 'otros'];

  return { estilo, corta, corrido, pendientes, filaDePendientes, nota, listaDeHoy, hoja, GUIA };
})();
