# El saludo del día (descartado)

**Descartado el 2/11/2026, al verlo en la galería.** Lo dijiste así: «este tipo de
texto los odio» («falta la cena y a las 22:20 a la cama; si cenas pronto, mejor»). Lo
reemplazan dos cosas:

- **En Inicio, abajo de todo, «Para hoy»** (`src/dominio/paraHoy.ts`, con tests): hasta
  tres comentarios cortos de la comida, una idea cada uno: lo que falta anotar (con
  «Anotar»), el reparto de los macros («vas bien de proteína y bajo en carbohidratos: en
  la cena, suma arroz, papa, pan o fruta»), lo que falta de proteína y el agua. Con «sin
  déficit», solo anotar y el agua.
- **La hora de dormir, la última comida y lo de entrenar van en los avisos**, al estilo
  de RISE ([`avisos.md`](avisos.md)).

Se borraron `src/dominio/saludo.ts`, sus tests, `galeria/src/saludo.js` y los textos
`saludo.*`; están en la historia de Git (el último commit con ellos es `5a1d35d`). Lo de
abajo queda como registro de lo que se probó.

---

Lo pediste el 2/11/2026: al abrir Moss, arriba de Inicio, una frase corta con los
datos reales del día, que cambie y no se repita, sin IA y sin sonar a plantilla.

La regla estaba en `src/dominio/saludo.ts`, con sus tests. Devolvía un código y sus
valores; el texto estaba en `saludo.frases.<código>` de `es.json` y `en.json`.

## Las señales

Recibe todo ya calculado; no rehace ninguna cuenta.

| Señal | De dónde sale |
|---|---|
| El día y la hora | `diaLogico` y `minutosEnElDia`: lo de la madrugada es del día anterior |
| Lo que falta comer | la meta, lo comido, lo anotado (`metas.ts`, `estadoDeMacro`) |
| Lo de ayer | lo comido contra la meta de ayer |
| Cómo durmió | `dormido` de la noche, la cara de la mañana y `pareceIncompleta` (`sueno.ts`) |
| La deuda | `deudaDeSueno` |
| La hora de acostarse | `horasDeSueno` (`avisos.ts`) |
| Si entrena | `sesionesDelDia` (`alrededorDelEntreno.ts`) y, si está, lo que confirma Ascent |
| Qué comer antes y después | `lineasDelDia` (`alrededorDelEntreno.ts`) |

## Cuándo dice qué

Cada situación tiene un peso según la hora; gana la que más pesa, con un poco de
azar para que dos parecidas se turnen.

| Momento | Lo que más pesa |
|---|---|
| Mañana (hasta las 11, o 2 h y media después de despertarse) | cómo durmió, cruzado con si entrena; lo de ayer si se pasó; lo que viene |
| Mediodía (hasta las 15:30) | lo que falta, si va a buen ritmo, la comida sin anotar |
| Antes de entrenar | qué comer, en la comida que toca; el café, solo a quien lo anota |
| Después de entrenar | la proteína |
| Noche (desde las 19:30, o 3 h antes de la cama) | lo que queda, lo justo o lo pasado, y la cama. A menos de una hora de acostarse, la cama |
| Madrugada | solo dormir: cuánto dormiría si se acuesta ahora |

Lo que cruza dos señales pesa más que cada una: «Noche corta y entreno a las 18:30.
Si cuesta más, es por el sueño, no por ti.»

## Lo que nunca hace

- **Hablar de lo que no hay.** Sin noche no habla de sueño; sin horario, de la cama;
  sin sesión, de entrenar; sin meta, de calorías. El primer día no finge conocerte.
- **Anunciar lo que ya pasó.** Mientras dura la sesión no dice nada de entrenar, y
  después no dice «hoy entrenas». La sesión sale de un horario, así que **solo si
  Ascent la confirma dice «ya entrenaste»**; sin eso, «después de entrenar».
- **Retar.** No dice «deberías», no pide compensar, no sugiere saltear una comida:
  si llegaste a la meta antes de la cena, la cena va igual. Tampoco habla de peso,
  con ningún ajuste.
- **Ignorar lo que pediste.**
  - Con los **números ocultos**: ni calorías, ni gramos, ni porcentajes, ni «te
    pasaste». Las horas y lo dormido sí, como en Inicio.
  - Con **«sin déficit»**: nada de entrenar, ni de proteína (spec/entreno.md, 5.9), ni
    «te pasaste», ni «poco margen para la cena». Quedan el sueño, la cama, lo sin
    anotar y lo que queda («hay lugar»).
- **Decir que dormir poco da más hambre.** Está probado, pero la línea de la noche
  corta sigue **pendiente** (spec/entreno.md, 7.3). Tampoco sugiere comer más por
  haber dormido poco: no está probado que sirva.

## No suena a plantilla

- **Formas distintas:** cada frase es una observación, una sugerencia o una pregunta
  (`dice1`, `sugiere1`, `pregunta1`). Dos saludos seguidos del mismo día no usan la
  misma forma, si hay otra.
- **Muchas frases:** son más de 280 en 87 situaciones, en los dos idiomas. Hay más
  donde más hace falta: los días en que no pasa nada son la mayoría.
- **Sin molde:** ninguna palabra abre más del 10 % de las frases, dos frases de una
  situación no empiezan igual y solo 4 empiezan con un saludo: solo salen si no hay
  nada más para decir.
- **Como lo diría alguien:** «unas 650 kcal», no «unas 637» (el número exacto está en
  Inicio); «unos 35 g».

## No se repite

- **Una frase** no vuelve en 21 días mientras haya otra que decir. Si ya se dijo todo,
  vuelve la que hace más que no se dice.
- **Un tema** no se dice dos veces seguidas en el día si otro tiene algo nuevo, salvo
  lo que no puede esperar (la cama a media hora, la proteína después de entrenar). Un tema ya tocado hoy pesa menos, y una situación usada en los últimos 3
  días, también.
- **Dentro del día** la frase queda igual mientras no haya nada distinto que decir y no
  hayan pasado dos horas: abrir y cerrar Moss diez veces es una sola frase. Si anotas
  algo, cambia enseguida. Los valores siempre son los de ahora.
- **Es determinista:** con los mismos datos, el mismo historial y la misma semilla, la
  misma frase.

## Cómo se probó

`src/dominio/saludo.test.ts`:

- **Cada situación** de la lista, con las reglas de verdad (`lineasDelDia`,
  `horasDeSueno`).
- **6.000 días al azar, siempre los mismos,** con todas las combinaciones: toda
  situación se puede decir, no queda ningún `{hueco}`, nunca nombra lo que no hay, no
  pregunta por lo ya anotado, no anuncia lo que ya pasó, y respeta los dos ajustes.
- **Dos semanas simuladas:** con una vida mezclada y con todos los días iguales, a
  cuatro aperturas por día, ninguna frase se dice dos veces. Con seis aperturas por
  día, sin reloj ni horario, con los números ocultos o con «sin déficit», hay menos
  para decir: ninguna se repite en una semana y ninguna va más de dos veces.
- **Los textos:** cada código tiene texto en los dos idiomas y no sobra ninguno; los
  mismos valores en es y en; 90 letras como mucho con los valores más largos; nada de
  «¡», de retos, de peso ni de género para quien lee; y `tuteo.test.ts` para el voseo.

## Para conectarlo a la app

1. **El historial:** `Dicho[]` en SQLite con `guardarAjuste`, como los números. Queda
   en el teléfono, sin sincronizar: que otro iPhone repita una frase no importa.
2. **La semilla:** `semilla` del almacén, la misma del cielo.
3. **Armar `DelDia`:** en `src/secciones/inicio/`, con `contextoDeHoy` y `lineasDeHoy`
   (`comida/entreno.ts`), `suenoParaAvisos` y `horasDeSueno`. Sin perfil o sin noches
   de verdad (las de ejemplo no valen), lo que corresponda en null.
4. **`diasConDatos` y `habituales`:** salen de `registros`; lo de ayer, de
   `totalDelDia` y la meta de ayer.
5. **La sesión confirmada:** con Ascent vinculado, `hecha` en la sesión de hoy.
6. **Mostrarlo:** arriba de Inicio, con `entering` y `exiting` de Reanimated y el
   formato de `armar()`. Se pide al volver a primer plano y al cambiar lo anotado, no
   en cada render; se llama a `recordar()` solo si `nuevo`.
