# Los avisos

Lo pediste el 22/10/2026: un aviso de la hora de dormir como el de Rise, los de
cada hábito (a una hora, relativos, después de algo, por día de la semana y con
mensaje propio), los de comida solo si no se anotó, y un máximo por día con lo
que cae cerca junto. Pocos y útiles: Moss nunca insiste ni culpa.

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
  espera a que anotes esa comida.

## Las comidas

Las que elijas, un rato después de tu hora de siempre (45 minutos, no después de
las 23:30), y solo si esa comida no está anotada. Si no abrís Moss en una semana,
paran solas.

## Juntos y con un máximo

- **Juntos:** lo que cae a 20 minutos o menos del primero de un grupo suena con
  él, a su hora: nada llega tarde y entre dos sonidos hay más de 20 minutos.
- **El máximo** cuenta las veces que suena (2, 3, 4 o 6 por día; 4 de fábrica).
  Si sobran, quedan primero el de dormir, después los de hábitos y al final los
  de comidas, que casi siempre ya se anotaron.
- **El plan de cada día** sale de lo elegido y de las horas de siempre, no de lo
  ya hecho: al reprogramar (cada vez que se abre Moss o cambia algo) lo que ya
  sonó no vuelve a sonar y el máximo no se pasa.
- **Las horas son de reloj:** un cambio de hora no corre nada. La noche es del
  día en que empieza (un aviso a las 0:15 es de la noche anterior).

## Lo que queda

- Los avisos de después de entrenar (con Ascent) andan en la regla, pero la
  conexión con Ascent está apagada en la v1.
- La alarma propia de Moss (AlarmKit) y los Atajos para el sueño, después de la
  v1: ver [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md).
