# Avisos visibles y «Tu plan de sueño» (27/11/2026, para aprobar)

Está en la galería, en «Lo nuevo, para aprobar» (`galeria/src/propuestas/40-avisos-y-plan.js`). La app no cambia
hasta que lo apruebes.

## Lo que dijo el dueño (27/11, dictado)

«Hoy no me llegó ningún aviso… todos los avisos están buenos. No los había visto. Y ese es el problema. Tienen que
estar en un lugar más visible… Yo lo pondría capaz que en Hábitos, y abajo a la derecha pondría un cosito de
campanita, y que diga Avisos… Quiero que estén \[ahí\] avisos de los hábitos que tenés… si podés pensar una mejor manera
de activarlas… que te avise: en 1 hora empieza tu periodo de melatonina, andá bajando, andá tranquilizándote y
empezando tu rutina de sueño… que en Sueño puedas crear tu plan de sueño… \[el aviso de\] tu deuda de sueño por la
mañana, todos los días. Tu horario de comida: no quiero que te diga a qué hora vas a comer; quiero que te recuerde que
tenés que registrar lo que comiste. Lo de “tardo en dormirme” no me gusta.»

## Anclas y ejemplo (los mismos números en todas las pantallas)

**P** = comienzo de tu periodo de melatonina; **C** = tu hora de acostarte = P − tu margen (15 min de fábrica);
**D** = tu despertar. Ejemplo: P 23:30 (hasta 00:30), C 23:15, D 07:30. Usá el periodo que ya calcula la galería
(`Melatonina`, con las noches de `Datos.NOCHES`; mirá cómo lo usan `galeria/src/periodo.js` y `galeria/src/avisos.js`)
para que Sueño, los avisos y esta propuesta digan las mismas horas; si no lo lográs, usá el ejemplo fijo y decilo.

## 1. La campanita en Hábitos (B1, B2)

Una pastilla «◗ Avisos» abajo a la derecha de Hábitos, sobre el musgo y arriba de la frase del día (derecha 16 px;
abajo = la barra + 100 px): ahí no tapa estrellas ni se cruza con el globito. Es interfaz: el toque no llega al cielo.
Insertala en la sección de Hábitos de verdad (`Galeria.secciones.habitos`, mirá su `zona`; si no tiene, colgala del
teléfono con la página de Hábitos a la vista: `Galeria.irA(4, true)`) y quitala al cerrar la propuesta.
- La primera vez, un globo crece desde ella hacia la izquierda: «Aquí eliges qué te avisa Moss, y cuándo.» Se va solo
  a los 6 s o al tocar.
- Un punto dorado, sin número, hasta que abras Avisos por primera vez, cuando hay un aviso nuevo o una sugerencia
  «Para ti». Nunca parpadea. Sin permiso de iOS, la campanita va tachada.

## 2. Avisos: una sola hoja, la misma desde cualquier puerta (B3 a B7)

Sube desde abajo (crece desde la campanita). Arriba, «Avisos» y la bajada «Pocos y a su hora: uno a la vez, y nunca lo
que ya hiciste.»
- **HOY:** una línea del día con un punto por aviso (los que ya pasaron, llenos) y «Hasta 5 hoy · ya pasaron 3 · máximo
  10»; a la derecha, «Ver cómo se ven ›», que crece a la pantalla bloqueada de hoy con los avisos de verdad (B7; la
  pantalla bloqueada dibujada de `galeria/src/avisos.js` sirve de referencia de estilo).
- **PARA TI:** una sola sugerencia sacada de tus datos, con «Ahora no» y «Activar» («Tomas café casi todos los días.
  ¿Te aviso desde qué hora conviene dejarlo? Hoy sería a las 14:15.»). Nunca llega como aviso.
- **Grupos por momento del día**, cada fila con su llave y **a qué hora suena hoy, o por qué no**; tocar la fila la
  abre con la vista de la pantalla bloqueada hecha con el texto de verdad de hoy (B4) y sus opciones:
  - **La mañana** («Empiezan cuando Moss sabe que te despertaste.»): Tu deuda de sueño (prendido, «hoy sonó a las
    07:30»), Pesarte (apagado), Lo que hay que hacer hoy.
  - **Las comidas** («Moss te recuerda anotar. Nunca te dice a qué hora comer.»): Anotar lo que comiste (prendido, «hoy
    21:45, solo si no anotaste la cena»; abierta: Desayuno, Almuerzo, Cena, Merienda como píldoras y «45 min después de
    la hora en que sueles comer, y solo si todavía no la anotaste. Si no abres Moss en una semana, paran solos.»), Si
    voy muy bajo en algo (apagado). **No hay «Horario de comidas».**
  - **La tarde:** Café («hoy sería a las 14:15»), Comer antes de entrenar («hoy no entrenas»).
  - **La noche** («Sale de tu periodo de melatonina (23:30 – 00:30), que cambia cada día.»): Tu plan de sueño
    (prendido, «hoy 22:30 · tu rutina de sueño», con sus pasos debajo y «Editar en Sueño ›»), Última comida grande.
  - **Tus hábitos** («Cada hábito con su aviso. No suena si ya está hecho.»): cada hábito de la persona con su ★, su
    llave y su hora de hoy («en tu plan de sueño · 22:45», «hoy 18:00, si todavía faltan», «hoy no suena: ya está
    hecho»); los que no tienen aviso, abajo, con «Agregar ›». Tocar uno abre su editor en «Aviso» (dibujalo simple).
  - **Cuántos por día:** «Como mucho 2 3 4 6 8 [10] 12» y «Hoy suenan 5 de 10. Entre uno y otro pasan al menos 20
    minutos.» Pie: «Los avisos se arman en tu iPhone: no pasan por ningún servidor.»
- **Estados de arriba:** con el permiso de iOS apagado (B6: «Los avisos están apagados en tu iPhone · Lo que elijas
  aquí queda guardado y empieza a sonar cuando los actives. · Abrir Ajustes»; las llaves quedan como estaban, tenues,
  y cada fila dice «no suena: falta el permiso»); sin permiso pedido («Moss todavía no tiene permiso para avisarte ·
  Permitir avisos»).
- **«Tardo en dormirme» y «Necesito dormir» no están acá:** no son avisos (ver 4).
- **Activarlos en contexto (B11), la «mejor manera» que pidió:** un chip con campanita en la tarjeta que origina el
  aviso. Apagado, lo ofrece («◖ Avísame cada mañana», en la tarjeta de la deuda de Sueño); encendido, lo dice («◗ Te
  aviso al despertar») y se apaga ahí mismo. Al encenderlo, crece desde el chip, 2,5 s, cómo se va a ver el aviso, y
  vuelve a él. Mostralo sobre una tarjeta de la deuda dibujada simple.

## 3. «Tu plan de sueño», en Sueño (B8 a B10)

Es la noche de hoy puesta en orden: cada cosa a su hora, contada hacia atrás desde tu periodo de melatonina; como el
periodo se corre un poco cada día, el plan se corre con él. Dos nombres, siempre con «de sueño»: **plan de sueño** es
lo que se ve en Sueño; **rutina de sueño**, el tramo final, el que arranca con el aviso.

| Paso | Viene | Ancla | Hoy | Cómo se marca |
|---|---|---|---|---|
| Comienzo: luz baja y algo tranquilo | de fábrica | P − 60, o lo elegido | 22:30 | a mano |
| Tus hábitos «antes de dormir» (★) | solos, si los tienes | el de su aviso | 22:45 | es su estrella: la misma marca |
| Tu hora de acostarte | de fábrica | C | 23:15 | sola, con «Me voy a dormir»; o a mano |
| Ducha tibia | se elige | C − 90 (adelanta el comienzo) | 21:45 | a mano |
| Anotar lo que tienes en la cabeza | se elige | C − 5 | 23:10 | sola, al anotar algo |
| La habitación, lista (fresca, oscura, en silencio) | se elige | C − 15 | 23:00 | a mano |
| Marcas, sin tildar: último café, lo fuerte, última comida grande | solas, si aplican (variante B) | C − 9 h, C − 2 h, C − 2 h | 14:15, 21:15, 21:15 | — |
| Tu periodo de melatonina | siempre | P a P + 60 | 23:30 – 00:30 | — |

- **Variante A, «la rutina» (recomendada):** dentro de la tarjeta del periodo. De día es una fila («Tu plan de sueño ·
  Empieza 22:30 · te acuestas 23:15 ›»); desde las 19, la tarjeta: el periodo con su pista de hoy, **los pasos como
  puntos sobre la pista** y debajo la lista para tildar; al pie, «◗ Te avisa a las 22:30» y «Esta noche no».
  Se arma en menos de un minuto con la hoja **«Arma tu rutina de sueño»** (B9): «¿Cuánto antes de tu periodo
  empiezas?» (30 min, 45 min, [1 hora], 1 h 30, 2 h, con «Hoy empieza a las 22:30 y te acuestas a las 23:15.»), «¿Qué
  haces en ese rato?» (De Moss: Luz baja, Algo tranquilo, Ducha tibia, La habitación lista, Anotar lo que tienes en la
  cabeza; Tus hábitos: ★ Leer 20 páginas, ★ Escribir), al tocar una su hora y su porqué («Ducha tibia · hoy 21:45.
  Bien tibia, de 1 a 2 horas antes de acostarte, ayuda a dormirte antes. Con la ducha, tu rutina de sueño empieza a las
  21:45.»), «Avisarme al empezar», «Avisarme también al acostarme» y «Crear mi rutina de sueño».
- **Variante B, «la noche entera»:** una línea vertical de la tarde al despertar, armada sola con lo que Moss ya sabe;
  cada paso con su campanita, «ahora» con un aro que late despacio, «+ Agregar un paso» y «Esta noche no».
- **Tildar un paso:** tocar el círculo; se llena y el tramo de la pista hasta ese punto se enciende. Con todos hechos,
  la pista queda encendida, **sin texto ni festejo, sin rachas ni puntaje**; se borra con el día.
- **«Cuánto antes te acuestas»** (reemplaza a «Tardo en dormirme», que al dueño no le gusta y no es un aviso): se llega
  tocando «Tu hora de acostarte» en el plan; opciones «Justo al empezar · 15 min antes · 30 · 45 · 60»; texto: «Te
  acuestas este rato antes de que empiece tu periodo, para estar dormido cuando llega.» y, sin reloj, «Sin reloj, Moss
  también lo descuenta al medir tu noche.»
- Pie del plan: «Una rutina te ayuda a llegar con sueño a tu hora; no trata el insomnio.» Sin plan todavía: de noche,
  la tarjeta del periodo con la fila «Arma tu rutina de sueño · Menos de un minuto.»

**El aviso de la noche, uno solo** (reemplaza a «tu periodo», «bajar el ritmo» y los hábitos que caen dentro de la
rutina; no se corre por otros avisos):

| Aviso | Título | Cuerpo |
|---|---|---|
| Comienzo (28/11, lo pidió el dueño: el dato y la sugerencia corta) | Tu periodo de melatonina empieza a las 23:30 | Evita las pantallas y las comidas pesadas. Empieza tu rutina de sueño. |
| EN | Your melatonin window starts at 23:30 | Avoid screens and heavy meals. Start your sleep routine. |
| Sin periodo todavía | Tu hora de acostarte es a las 23:15 | (igual) |
| EN | Your bedtime is at 23:15 | (same) |
| Acostarte (opcional) | Tu hora de acostarte: 23:15 | Faltan 15 minutos. Es la que te deja dormido dentro de tu periodo de melatonina (23:30 – 00:30). |
| La mañana | Tu deuda de sueño bajó | Ahora es de 1 h 30 min: 30 min menos que ayer. |
| Las comidas | Moss | No olvides anotar lo que comiste en la cena |

Otras anticipaciones cambian el título: «En media hora…», «En 45 minutos…», «En 1 h 30…», «En 2 horas empieza tu
periodo de melatonina» (EN: “…starts in half an hour · in 45 minutes · in 1 h 30 · in 2 hours”). En inglés las horas
van como en la app (mirá cómo las escribe `galeria/src/avisos.js` en inglés).

## 4. Los textos, en español neutro y en inglés

| Dónde | Español | English |
|---|---|---|
| Campanita y título | Avisos | Reminders |
| Globo | Aquí eliges qué te avisa Moss, y cuándo. | Choose what Moss reminds you of, and when. |
| Bajada | Pocos y a su hora: uno a la vez, y nunca lo que ya hiciste. | Few, and on time: one at a time, and never for what you've already done. |
| Hoy | Hasta {n} hoy · ya pasaron {m} · máximo {max} | Up to {n} today · {m} already past · limit {max} |
| | Ver cómo se ven | See how they look |
| Vista previa | Así se ve en tu pantalla bloqueada. | How it looks on your Lock Screen. |
| Para ti | Para ti · Activar · Ahora no | For you · Turn on · Not now |
| | Tomas café casi todos los días. ¿Te aviso desde qué hora conviene dejarlo? Hoy sería a las {hora}. | You have coffee most days. Want a reminder of when it's best to stop? Today that would be {hora}. |
| Grupos | La mañana · Las comidas · La tarde · La noche · Tus hábitos · Cuántos por día | Morning · Meals · Afternoon · Night · Your habits · How many a day |
| Mañana | Empiezan cuando Moss sabe que te despertaste. | They start once Moss knows you're up. |
| Comidas | Moss te recuerda anotar. Nunca te dice a qué hora comer. | Moss reminds you to log. It never tells you when to eat. |
| Noche | Sale de tu periodo de melatonina ({desde} – {hasta}), que cambia cada día. | It follows your melatonin window ({desde} – {hasta}), which shifts every day. |
| Hábitos | Cada hábito con su aviso. No suena si ya está hecho. | Each habit with its reminder. Silent once it's done. |
| Estado | hoy {hora} · hoy sonó a las {hora} · hoy sería a las {hora} | today {hora} · sent today at {hora} · today it would be {hora} |
| | hoy no suena: ya lo anotaste · ya está hecho · no entrenas · queda fuera de tu máximo | not today: already logged · already done · no training · over your limit |
| Fila | Anotar lo que comiste | Log what you ate |
| | Un rato después de la hora en que sueles comer, y solo si todavía no la anotaste. Moss nunca te dice a qué hora comer. | A while after your usual time, and only if you haven't logged it yet. Moss never tells you when to eat. |
| Permiso | Los avisos están apagados en tu iPhone | Notifications are off on your iPhone |
| | Lo que elijas aquí queda guardado y empieza a sonar cuando los actives. · Abrir Ajustes | What you choose here is saved and starts once you turn them on. · Open Settings |
| | Moss todavía no tiene permiso para avisarte · Permitir avisos | Moss doesn't have permission to notify you yet · Allow notifications |
| Cuántos | Como mucho · Hoy suenan {n} de {max}. Entre uno y otro pasan al menos 20 minutos. | At most · {n} of {max} today. At least 20 minutes pass between them. |
| Pie | Los avisos se arman en tu iPhone: no pasan por ningún servidor. | Reminders are set up on your iPhone: they don't go through any server. |
| Plan | Tu plan de sueño · Editar · Ver la noche entera | Your sleep plan · Edit · See the whole night |
| | Empieza {inicio} · te acuestas {cama} | Starts {inicio} · bed at {cama} |
| | Tu rutina de sueño · desde las {hora} | Your sleep routine · from {hora} |
| | Arma tu rutina de sueño · Menos de un minuto. | Set up your sleep routine · Under a minute. |
| Hoja | ¿Cuánto antes de tu periodo empiezas? | How long before your window do you start? |
| | Hoy empieza a las {inicio} y te acuestas a las {cama}. | Today it starts at {inicio} and bedtime is {cama}. |
| | ¿Qué haces en ese rato? · De Moss · Tus hábitos | What do you do in that time? · From Moss · Your habits |
| Pasos | Luz baja · Algo tranquilo · Ducha tibia · La habitación, lista · Anotar lo que tienes en la cabeza · Tu hora de acostarte | Low light · Something calm · Warm shower · Bedroom ready · Write down what's on your mind · Your bedtime |
| Marcas | Último café · Lo fuerte, hasta aquí · Última comida grande · Tu despertar de siempre | Last coffee · Hard training until here · Last big meal · Your usual wake-up |
| | Con la ducha, tu rutina de sueño empieza a las {hora}. | With the shower, your sleep routine starts at {hora}. |
| | Avisarme al empezar · Avisarme también al acostarme · Crear mi rutina de sueño | Remind me when it starts · Also remind me at bedtime · Create my sleep routine |
| | Te avisa a las {hora} · Esta noche no | Reminds you at {hora} · Not tonight |
| Margen | Cuánto antes te acuestas · Justo al empezar · {n} min antes | How early you get into bed · Right at the start · {n} min before |
| | Te acuestas este rato antes de que empiece tu periodo, para estar dormido cuando llega. | You get into bed this long before your window starts, so you're asleep when it comes. |
| | Sin reloj, Moss también lo descuenta al medir tu noche. | Without a watch, Moss also subtracts it when measuring your night. |
| Pie del plan | Una rutina te ayuda a llegar con sueño a tu hora; no trata el insomnio. | A routine helps you reach bedtime sleepy; it doesn't treat insomnia. |
| Chips | Avísame cada mañana · Te aviso al despertar | Remind me every morning · Reminding you when you wake up |

## 5. Los movimientos (con Reducir movimiento, solo fundidos)

| Qué | De dónde crece | Cómo |
|---|---|---|
| Campanita | — | entra con la página de Hábitos; al apretarla baja a 0,96 |
| Globo de la primera vez | de la campanita, hacia la izquierda | escala de 0,35 a 1 en 340 ms; se achica a los 6 s o al tocar |
| El punto | — | fundido; nunca parpadea |
| Hoja de Avisos | sube desde abajo, con origen en la campanita | 340 ms |
| Abrir una fila | de la fila, hacia abajo | la vista previa crece desde arriba con un fundido; lo de abajo se acomoda (260 ms) |
| Prender una llave | — | la hora de hoy entra con un fundido |
| «Ver cómo se ven» | del botón, a pantalla entera | 320 ms; los avisos caen de a uno cada 60 ms; al cerrar vuelve al botón |
| Línea de «Hoy» | — | los puntos entran en orden |
| Chip en contexto | del chip | cambia de ancho al encenderse; la vista previa crece desde él 2,5 s y vuelve |
| Pista del plan | de la izquierda | el tramo del periodo crece (700 ms); los puntos entran de a uno cada 80 ms |
| Tildar un paso | del círculo | se llena en 160 ms; el tramo hasta él se enciende de izquierda a derecha en 260 ms |
| «Ahora» (variante B) | — | un aro que late despacio |
| Hoja «Arma tu rutina de sueño» | de la fila | sube desde abajo; las horas del resumen cambian con un fundido; si un paso adelanta el comienzo, entra la nota |
| «Esta noche no» | — | la lista se pliega hacia arriba y queda una línea, «Esta noche, sin rutina» |

## Los tiempos, con su respaldo (lo que preguntaste: «buscar qué es lo más óptimo»)

Anclas: **P** = comienzo de tu periodo de melatonina (inicio estimado de la melatonina + 2 h); **C** = hora de acostarte
= P − tu margen (15 min de fábrica); **D** = tu despertar de verdad.

**La respuesta corta.** No existe una hora «óptima» medida para empezar a bajar el ritmo: nadie estudió cuánto antes
avisar, ni una rutina como tal en adultos sanos (`spec/estudio/momentos.md` §3, `spec/estudio/priorizar-cada-noche.md`
§4). Sí hay respaldo para las piezas. Lo que hacen los productos: Rise, de 30 a 120 minutos antes; Sleep Cycle, 2 h;
Apple deja elegir de 15 minutos a 3 horas. **Una hora antes del periodo es buena elección para empezar la rutina**
(está en el centro de lo que se usa, cae una hora después del inicio estimado de la melatonina y deja 45 minutos hasta
acostarte), pero ningún estudio dice que 60 sea mejor que 45 o 90. **No alcanza para dos cosas:** la luz baja (el
consenso es desde 3 h antes de acostarte, Brown 2022) y la ducha tibia (1 a 2 h antes, Haghayegh 2019). Las «2 horas»
coinciden con la última comida grande y con terminar lo fuerte; las «4 horas» solo tienen respaldo para terminar lo
intenso (Leota 2025).

| Aviso | Hoy en Moss | Recomendado | Respaldo | Fuerza |
|---|---|---|---|---|
| Sin cafeína desde… | C − 9 h | queda | Gardiner 2023 y 2025, Drake 2013 | fuerte (el efecto); moderada (el número) |
| Lo fuerte, hasta… | termina C − 2 h | queda, con «mejor 4 h» en el porqué | Frimpong 2021, Stutz 2019, Leota 2025 | moderada |
| Última comida grande | C − 2 h (3 h con reflujo) | queda | ACG 2022, Fujiwara 2005, Gu 2020 | moderada (reflujo); débil (sueño) |
| Gafas | C − 2 h | apagado; fuera de lo sugerido | Shechter 2018, Cochrane 2023 | débil |
| Bajar las luces | C − 90 min | consenso: desde C − 3 h; va con el comienzo de la rutina | Brown 2022, Gooley 2011, Phillips 2019 | moderada (la idea); convención (los 90 min) |
| Ducha tibia (no existe) | — | C − 90 min, unos 10 min | Haghayegh 2019 | moderada (estudios chicos) |
| Bajar el ritmo | C − 60 min | sin hora medida; se funde con el comienzo de la rutina | — | convención |
| Tu periodo de melatonina | P − 60 min | queda, como comienzo de la rutina; elegible (30, 45, 60, 90, 120) | `spec/estudio/deuda-y-melatonina.md` §3 | moderada (dónde cae, ±1 h); convención (la anticipación) |
| Tu hora de acostarte | C − 30 | con rutina: C − 15 o al acostarte | `spec/evidencia-1.1.md` §2 | convención; moderada (no acostarse antes del periodo) |
| Anotar lo que tienes en la cabeza | C − 5 | queda | Scullin 2018 | moderada a débil |
| Alcohol | sin aviso | sin aviso: no hay hora segura | Gardiner 2025, Landolt 1996 | fuerte (efecto); horario sin evidencia |
| Tu deuda de sueño | al saber que te despertaste | queda, todos los días | convención (Rise) | convención |
| Pesarte | 20 min después de la deuda | queda | `spec/evidencia-1.1.md` §4 | convención |
| Anotar lo que comiste | tu hora de siempre + 45 min | queda | `spec/avisos.md` | convención |

**Lo que no se sabe:** cuánto antes empezar una rutina; si un aviso cambia el sueño (lo que hay: un aviso hace abrir la
app, el efecto puede gastarse, más avisos molestan más y agruparlos ayuda); la hora exacta del periodo (es una
estimación de ±1 h; con turnos de noche no sirve); cuántos minutos de luz de día. Nada de esto trata el insomnio.

**Cómo suena hoy** (simulado con las reglas de `src/dominio`, P 23:30, C 23:15, cena a las 21:00): de fábrica, 07:30
la deuda, 08:45, 13:45 y 21:45 las comidas y 22:30 «En 1 hora empieza tu periodo…»: bien. Con «Dormir» y «Leer» entre
los primeros hábitos: 22:25 leer, 22:45 acostarte y **23:05 «En 1 hora empieza tu periodo de melatonina · A las
23:30»**: suena 25 minutos antes y después de «acostarte» (la separación de 20 minutos lo corre y el título queda
fijo). Con toda la noche prendida: siete avisos, cinco en la última hora y media. El plan resuelve los tres casos con
un solo aviso de comienzo, que no se corre y arma su título con lo que falta de verdad.

**De paso, lo que encontró el diseño:** `perfil.avisos.melatoninaTexto` dice «Unas dos horas antes» y desde el 25/11
es una hora; `perfil.avisos.tuDiaTexto` dice que la noche «se calcula con esa hora y tu deuda», y con periodo ninguna
de las dos la mueve; «Leer» llega con 45 minutos antes y el editor del hábito solo ofrece 15, 30 y 60; iOS guarda 64
avisos pendientes y Moss programa 60 por semana: un aviso por paso llenaría el cupo.
