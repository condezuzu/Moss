# Los avisos

Lo pediste el 22/10/2026: un aviso de la hora de dormir como el de Rise, los de
cada hábito (a una hora, relativos, después de algo, por día de la semana y con
mensaje propio), los de comida solo si no se anotó, y un máximo por día con lo
que cae cerca junto. El 26/10 sumaste el horario de comidas (para comer
ordenado), pesarte a la mañana y que los hábitos lleguen con su aviso. El 2/11
los pediste más simples: cada uno dice una sola cosa, nada de lo que ya pasó, y
un aviso aparte si vas muy bajo en algo. Pocos y útiles: Moss nunca insiste ni
culpa. Se ven todos, en español y en inglés, como en la pantalla bloqueada, en la
galería («Los avisos en la pantalla bloqueada»).

La regla está en `src/dominio/avisos.ts` (con sus tests); el teléfono los
programa en `src/recordatorios/programar.ts`; se eligen en Perfil › Avisos y en
el editor de cada hábito. Son avisos locales: no pasan por ningún servidor, y lo
elegido queda en el teléfono (no sube a la cuenta).

## La hora de dormir

- **La meta:** la hora de despertar de mañana, menos lo que necesitas dormir
  (por tu edad), menos un tercio de la deuda de las dos semanas (como mucho 30
  minutos). La deuda se paga despacio: una hora lleva unos cuatro días
  (Kitamura, 2016, en [`sueno.md`](sueno.md)).
- **Sin adelantarse más de una hora** a tu hora de siempre: la tarde tiene una
  «zona prohibida» para dormir (Lavie, 1986), así que la meta se corre de a poco.
- **La hora de despertar** es la alarma de ese día, si se sabe (después de la
  v1, con AlarmKit), o lo de siempre para esa noche: el viernes a la noche usa
  el despertar del sábado.
- **El aviso** suena un rato antes (15, 30, 45 o 60 minutos; 30 de fábrica). Sin
  noches para saber cuándo te despertás, no hay aviso de dormir.
- **Lo que dice** (lo pediste el 31/10/2026, repetía siempre lo mismo): cada noche otro
  texto, corto y con un dato de esa noche. Pasa por los nueve antes de repetir
  (`textoDeDormir`, en `avisos.ts`). Sale del día y nada más: reprogramar no lo cambia.
  - «Deberías irte a dormir en una hora.»
  - «Esta noche, a la cama a las 23:20.»
  - «Baja las luces: a la cama en media hora.»
  - «Para despertarte a las 7:30, a la cama a las 23:20.»
  - «En 45 minutos te toca acostarte.»
  - «Ve dejando el teléfono: a las 23:20, a la cama.»
  - «A las 23:20 te toca ir a la cama.»
  - «A la cama a las 23:20 y duermes 8 h.»
  - «Empieza a bajar el ritmo: a las 23:20, a la cama.»
  - Con una hora de deuda o más, una noche de cada cuatro: «Te faltan 1 h 30 min de
    sueño: acostarte a las 23:20 ayuda.»
- **De Rise:** recuerda la rutina de la noche, la ventana de melatonina, cuándo dejar
  el café, la hora de dormir y bajar las luces, a una hora de su reloj del cuerpo
  [R1][R2]. **No encontré sus textos literales:** los de arriba son nuestros, con esa
  idea.

## Los de cada hábito

- **Cuándo:** a una hora; al despertar (en el momento o 15, 30 o 60 minutos
  después); antes de dormir (15, 30 o 60 minutos); o después de comer (desayuno,
  almuerzo, merienda o cena, en el momento o un rato después).
- **Qué días:** los del hábito, o algunos de ellos.
- **Qué dice:** tu mensaje (hasta 120 letras) o el nombre del hábito: «Entrenar».
- **No suena** si el hábito ya está hecho ese día. El de entrenar (el de los
  primeros hábitos, o uno que se llame así), tampoco si la sesión de tu horario
  ya empezó a esa hora o si ya entrenaste con Ascent. Lo de «después de comer»
  espera a que anotes esa comida; «en el momento» suena dos minutos después
  (el minuto en que se anotó ya pasó cuando se reprograma). Los que van con la
  hora de despertarse o de dormirse usan las 7:30 y las 23:00 mientras no haya
  noches medidas.

## Los primeros hábitos

Los que se eligen al terminar la entrada llegan con un aviso a la hora en que
más ayudan (`avisoDeFabrica`): leer 45 minutos antes de dormir, escribir 30,
meditar 15 minutos después de despertarte, los pasos a las 18 y el agua a las 16
(si todavía faltan: lo hecho no avisa) y entrenar a las 17:30. Dormir enciende el
aviso de la hora de dormir; lo de la comida va con el horario de comidas. El
permiso se pide al elegirlos, y cada aviso se cambia o se saca en su hábito.

## El horario de comidas

Cada comida elegida avisa a su hora (de a un cuarto de hora, entre las 5 y las
23:45), si todavía no se anotó y no anotaste una posterior (con la cena anotada,
la merienda ya fue): «Hora de la merienda». Si hay un plan para esa
comida, dice qué toca: «Hora del almuerzo: pollo a la plancha, arroz». Arranca
con el desayuno, el almuerzo y la cena a la hora en que se suelen anotar. Con
horario, el aviso de «sin anotar» de esa comida cuenta desde esta hora; si con
una comida tarde caería a 20 minutos o menos del de su hora (o antes, por el tope
de las 23:30), no suena: alcanza con el del horario.

## Pesarse

Al rato de despertarse (10 minutos; sin noches, a las 8), antes de desayunar: el
día del control o todos los días. Si ya te pesaste, no suena: pesarse vuelve a
programar los avisos, igual que cambiar el perfil o la meta. El día del control
lo dice, sin prometer que pesarse en ese momento cambia la meta (el control ya
corrió al abrir Moss).

## Las comidas sin anotar

Las que elijas, un rato después de tu hora de siempre (45 minutos, no después de
las 23:30), y solo si esa comida no está anotada: «Falta anotar la cena». Si no
abres Moss en una semana, paran solas.

## Si vas muy bajo en algo

Un aviso aparte, corto y concreto: qué te falta y una idea de qué comer. «Te
faltan 40 g de proteína: un yogur griego y dos huevos lo resuelven.» La regla está
en `src/dominio/loQueFalta.ts`.

- **Cuándo:** como mucho dos por día, y nunca dos veces de lo mismo. A la tarde
  (dos horas antes de tu cena de siempre, no antes de las 16:30), si la proteína
  va a quedar corta aun con las comidas que quedan, o si el agua va muy baja. A la
  noche (después de anotar la cena, al menos media hora antes de ir a la cama), si
  faltan 25 g de proteína o más, o 400 kcal o más (y al menos el 20 % de tu meta).
- **Sin molestar:** solo si ese día anotaste algo; con lo planificado ya contado,
  así que si la cena planeada lo resuelve no suena; y si ayer quedaste igual de
  bajo en lo mismo, día por medio. Con «sin déficit» no aparece nunca. No propone
  comer si ya no queda lugar en tus calorías.
- **Las ideas:** primero lo que comes (lo de tus últimos registros que tenga
  proteína de verdad, o calorías sin ser dulce ni alcohol); si no alcanza, una
  lista corta que respeta tu dieta y tus alergias. Rotan cada día. Si no llegan a
  cubrirlo, dice «te acercan» y no «lo resuelven».
- **El agua:** solo si la sueles anotar. No propone comida: un vaso ahora.
- **Con «Mostrar números» apagado**, sin números: «Vas bajo de proteína hoy: …».
- **Se apaga** en Perfil › Avisos («Si voy muy bajo en algo»). Sin elegir, anda si
  hay algún otro aviso prendido, y no cuenta para el máximo.
- **Al tocarlo:** la hoja para anotar; el del agua, Inicio.

## De a uno y con un máximo

- **De a uno:** nada se junta. Entre dos avisos hay al menos 20 minutos: si dos
  caen más cerca, el que importa menos suena un rato antes, si entra, o espera
  (como mucho 45 minutos; más tarde ya no viene al caso, y no suena). Lo que estaba
  en una misma línea, como «Hora de la merienda · Entrenar», ya no puede pasar.
- **Lo que ya pasó no suena:** lo hecho y lo anotado salen de la lista cada vez
  que cambia algo. Lo hecho antes de su hora tampoco atrasa a los demás.
- **Al salir de Moss:** si marcas algo y sales enseguida, se reprograma en ese
  momento. Antes esperaba un segundo y medio: con Moss de fondo ese reloj se paraba
  y sonaba igual lo que ya habías hecho. Esa era la causa más probable del aviso
  de entrenar después de haber entrenado.
- **El máximo** cuenta las veces que suena (2, 3, 4, 6 u 8 por día; 6 de
  fábrica, para que el horario de comidas no deje sin lugar a los hábitos). Si
  sobran, quedan primero el de dormir, después los de hábitos, el horario y
  pesarse, y al final los de comidas sin anotar, que casi siempre ya se anotaron.
  Lo de «muy bajo en algo» va aparte, con su propio tope.
- **Cuáles entran** sale de lo elegido y de las horas de siempre, no de lo
  ya hecho: al reprogramar (cada vez que se abre Moss o cambia algo) lo que ya
  sonó no vuelve a sonar y el máximo no se pasa.
- **Una programación a la vez:** si llega otra mientras una programa, la primera
  se corta y la segunda empieza de cero (dos a la vez duplicaban avisos). Lo que
  ya pasó no se programa (iOS lo rechaza y cortaba los demás), y hoy y ahora
  salen del mismo instante, también a la medianoche.
- **Las horas son de reloj:** un cambio de hora no corre nada. La noche es del
  día en que empieza (un aviso a las 0:15 es de la noche anterior).

## Al tocarlo

Tocar un aviso abre lo suyo: el horario y las comidas, la hoja para anotar esa
comida; pesarse, el peso del «+»; dormir, Sueño; un hábito, el cielo de Hábitos;
lo que falta, la hoja para anotar; el fin de la prueba, Perfil, donde está tu suscripción y cómo cancelarla.

## Fuentes de los textos

- [R1] Rise, la rutina de la noche: https://www.risescience.com/blog/wind-down-time
- [R2] Una reseña, los avisos de Rise: https://www.mattressclarity.com/accessories/rise-app-review/

## Lo que queda

- Los avisos de después de entrenar (con Ascent) andan en la regla, pero la
  conexión con Ascent está apagada en la v1.
- La alarma propia de Moss (AlarmKit) y los Atajos para el sueño, después de la
  v1: ver [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md).
