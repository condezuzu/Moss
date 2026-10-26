# Los avisos

Lo pediste el 22/10/2026: un aviso de la hora de dormir como el de Rise, los de
cada hábito (a una hora, relativos, después de algo, por día de la semana y con
mensaje propio), los de comida solo si no se anotó, y un máximo por día con lo
que cae cerca junto. El 26/10 sumaste el horario de comidas (para comer
ordenado), pesarte a la mañana y que los hábitos lleguen con su aviso. Pocos y
útiles: Moss nunca insiste ni culpa.

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
- **El aviso** suena un rato antes (15, 30, 45 o 60 minutos; 30 de fábrica) y
  dice a qué hora ir a la cama. Sin noches para saber cuándo te despertás, no
  hay aviso de dormir.

## Los de cada hábito

- **Cuándo:** a una hora; al despertar (en el momento o 15, 30 o 60 minutos
  después); antes de dormir (15, 30 o 60 minutos); o después de comer (desayuno,
  almuerzo, merienda o cena, en el momento o un rato después).
- **Qué días:** los del hábito, o algunos de ellos.
- **Qué dice:** tu mensaje (hasta 120 letras) o «{hábito}, cuando puedas».
- **No suena** si el hábito ya está hecho ese día. Lo de «después de comer»
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
23:45), si todavía no se anotó: «Hora del almuerzo». Si hay un plan para esa
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
las 23:30), y solo si esa comida no está anotada. Si no abrís Moss en una semana,
paran solas.

## Juntos y con un máximo

- **Juntos:** lo que cae a 20 minutos o menos del primero de un grupo suena con
  él, a su hora: nada llega tarde y entre dos sonidos hay más de 20 minutos.
- **El máximo** cuenta las veces que suena (2, 3, 4, 6 u 8 por día; 6 de
  fábrica, para que el horario de comidas no deje sin lugar a los hábitos). Si
  sobran, quedan primero el de dormir, después los de hábitos, el horario y
  pesarse, y al final los de comidas sin anotar, que casi siempre ya se anotaron.
- **El plan de cada día** sale de lo elegido y de las horas de siempre, no de lo
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
comida; pesarse, el peso del «+»; dormir, Sueño; un hábito, el cielo de Hábitos.

## Lo que queda

- Los avisos de después de entrenar (con Ascent) andan en la regla, pero la
  conexión con Ascent está apagada en la v1.
- La alarma propia de Moss (AlarmKit) y los Atajos para el sueño, después de la
  v1: ver [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md).
