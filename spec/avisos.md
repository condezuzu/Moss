# Los avisos

Lo pediste el 22/10/2026: un aviso de la hora de dormir como el de Rise, los de
cada hábito (a una hora, relativos, después de algo, por día de la semana y con
mensaje propio), los de comida solo si no se anotó, y un máximo por día con lo
que cae cerca junto. El 26/10 sumaste el horario de comidas (para comer
ordenado), pesarte a la mañana y que los hábitos lleguen con su aviso. El 2/11
los pediste más simples: cada uno dice una sola cosa, nada de lo que ya pasó, y
un aviso aparte si vas muy bajo en algo. El 3/11, como los de Rise, los de lo que
conviene hacer: qué comer antes de entrenar y a qué hora, el café, la proteína de
después, la última comida grande, no entrenar fuerte tan tarde y bajar las luces
(«Lo que conviene hacer», para aprobar). Pocos y útiles: Moss nunca insiste ni
culpa. Se ven todos, en español y en inglés, como en la pantalla bloqueada, en la
galería («Los avisos en la pantalla bloqueada»).

La regla está en `src/dominio/avisos.ts` (con sus tests); el teléfono los
programa en `src/recordatorios/programar.ts`; se eligen en Perfil › Avisos y en
el editor de cada hábito. Son avisos locales: no pasan por ningún servidor, y lo
elegido queda en el teléfono (no sube a la cuenta).

## Lo de fábrica, desde el 25/11/2026 (lo pediste)

Para quien no eligió nada en Perfil › Avisos (`deFabrica` y `comidasSinAnotar`, en `src/dominio/sigueElDespertar.ts`):

- **Prendidos:** la deuda al despertarte, tu periodo de melatonina y las comidas sin anotar.
- **Apagados:** el horario de comidas (la hora de cada comida), acostarte (`dormir`), bajar las luces y bajar el ritmo
  (`revoluciones`). Se prenden en Perfil › Avisos. Lo de «Más avisos» sigue apagado, y pesarse, como lo elegiste.
- **Tu periodo de melatonina** suena una hora antes de que empiece (`ANTES_DEL_PERIODO`): «En 1 hora empieza tu
  periodo de melatonina · A las 23:30. Ve dejando las pantallas y baja las luces: así te duermes más fácil.» Antes
  sonaba dos horas antes, cuando la melatonina empieza a subir.
- **La deuda al despertar:** el título dice si bajó o subió, y el cuerpo, en cuánto quedó: «Tu deuda de sueño bajó ·
  Ahora es de 3 h 20 min: 40 min menos que ayer.» Si no, «subió», «sigue igual», «bajó a cero» o «Sin deuda de
  sueño»; sin el día anterior, «Tu deuda de sueño: 4 h».
- **Las comidas sin anotar:** sin elegir, el desayuno, el almuerzo y la cena, salvo la que en tu día dice «No suelo».
  Dicen «No olvides anotar lo que comiste en el almuerzo». Sin elegir se guarda `null`; apagadas, vacías (`[]`), y
  no vuelven a prenderse. Quien las había apagado antes del 25/11 lo guardaba como `null`: le vuelven prendidas.
- **El máximo de fábrica** sigue en 10.

## La hora de dormir

**Desde el 17/11/2026 (galería 50), con tu periodo de melatonina la hora es la suya:** te acuestas tu margen para
dormirte antes de que empiece el periodo, la misma hora que dice la tarjeta de Sueño, y el aviso se llama «Acuéstate
a las…» (ver «Los avisos reescritos», abajo). Lo que sigue es la cuenta de antes, que queda para cuando todavía no
hay periodo (menos de 3 noches en la última semana).

- **La meta:** la hora de despertar de mañana, menos lo que necesitas dormir
  (por tu edad, o lo que elegiste: [`sueno.md`](sueno.md)), menos lo que se suele
  estar despierto adentro de la noche (la necesidad es de sueño: sin reloj, 30
  minutos; con reloj, la mediana de tus noches más 15, lo que el reloj no ve;
  `despiertoDeLaNoche`), menos un tercio de la deuda de las dos semanas (como
  mucho 30 minutos). El tercio es una convención: en el laboratorio, una falta de
  cerca de una hora por noche se recuperó en unas cuatro noches con 12 h en la
  cama (Kitamura, 2016, en [`sueno.md`](sueno.md)). Lo que dicen el aviso y
  Perfil que vas a dormir es la necesidad, sin ese rato despierto.
- **Sin adelantarse más de una hora** a tu hora de siempre: la tarde tiene una
  «zona prohibida» para dormir (Lavie, 1986), así que la meta se corre de a poco.
- **La hora de despertar** es la alarma de ese día, si se sabe (después de la
  v1, con AlarmKit), o lo de siempre para esa noche: el viernes a la noche usa
  el despertar del sábado.
- **El aviso** suena un rato antes (15, 30, 45 o 60 minutos; 30 de fábrica). Sin
  noches para saber cuándo te despertás, no hay aviso de dormir. Desde el 25/11/2026 viene apagado: se prende en
  Perfil › Avisos.
- **Lo que dice** (reescrito el 17/11/2026; antes rotaba entre nueve textos, que ya no están): el título, «Acuéstate
  a las 23:15»; el cuerpo, cuánto falta y por qué esa hora: «En media hora. Así te duermes dentro de tu periodo de
  melatonina (23:30 – 00:30).» Sin periodo: «En media hora. Así duermes 8 h y te despiertas a las 07:30.» Sin culpa:
  ninguno dice «deberías», «debes» ni «tienes que», ni «a la cama» (lo comprueba `avisos.test.ts`).
  - Con una hora de deuda o más, una noche de cada cuatro (`nombraLaDeuda`, en `avisos.ts`; sale del día y nada
    más: reprogramar no lo cambia): «En media hora. Con 1 h 30 min de deuda de sueño, esta noche no lo dejes para
    más tarde.» La deuda va a la media hora: es aproximada.
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

Cada comida elegida avisa a tu hora de comer, si todavía no se anotó y no anotaste una posterior (con la cena
anotada, la merienda ya fue): «Hora de la merienda». Si hay un plan para esa
comida, dice qué toca: «Hora del almuerzo: pollo a la plancha, arroz». Desde el
25/11/2026 viene apagado; al prenderlo en Perfil › Avisos, arranca con el desayuno, el almuerzo y la cena. Desde el 18/11 las horas son una sola lista para todo (`horasDeComer`, en
`recordatorios.ts`; ver `entreno.md` 5.11): la que cambiaste a mano en Perfil › Tus respuestas, fija; si no, la
mediana de lo anotado con 5 días o más en dos semanas, la de tu día o la típica. Perfil › Avisos las muestra y lleva a
«¿Cómo es tu día?»; la que ahí dice «No suelo» no avisa. El horario de antes, con su hora, pasó a ser tus horas
puestas a mano. El aviso de «sin anotar» de esa comida cuenta desde esta hora; si con
una comida tarde caería a 20 minutos o menos del de su hora (o antes, por el tope
de las 23:30), no suena: alcanza con el del horario.

## Pesarse

Al rato de despertarse (10 minutos; sin noches, a las 8), antes de desayunar: el
día del control o todos los días. Si ya te pesaste, no suena: pesarse vuelve a
programar los avisos, igual que cambiar el perfil o la meta. El día del control
lo dice, sin prometer que pesarse en ese momento cambia la meta (el control ya
corrió al abrir Moss). Desde el 17/11, en dos partes: «Pésate antes de desayunar · Después de ir al baño y siempre
igual: así se ve la tendencia.» y, el día del control, «Hoy es tu control: pésate · Antes de desayunar, como siempre.»

## Las comidas sin anotar

Prendidas de fábrica desde el 25/11/2026: sin elegir, el desayuno, el almuerzo y la cena, salvo la que en tu día dice
«No suelo» (`comidasSinAnotar`). En Perfil › Avisos eliges otras o las apagas. Suenan un rato después de tu hora de
siempre (45 minutos, no después de las 23:30), y solo si esa comida no está anotada: «No olvides anotar lo que
comiste en la cena». Si no abres Moss en una semana, paran solas.

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
- **Cerca de la cama, nada grande:** si lo de la noche suena a menos de 3 h de ir
  a la cama (sin hora de la cama, de la medianoche), lo de las calorías propone
  una sola idea de hasta 250 kcal, que acerca: «Te faltan 700 kcal: fruta con
  yogur te acerca.» Antes podía proponer un plato de pasta una hora antes de
  acostarte, el mismo día en que «Última comida grande» decía «Después, algo
  ligero». Son las mismas 3 h (`CERCA_DE_LA_CAMA`, en `loQueFalta.ts`): la guía
  del ACG 2022 pide evitar comidas 2 a 3 h antes de acostarse, y algo de unas 150
  kcal de noche no perjudica (Kinsey y Ormsbee 2015; las 250 son derivadas). La
  proteína de noche no cambia: 20 a 40 g antes de dormir no perjudican (Reis
  2021; Kerksick 2017).
- **El agua:** solo si la sueles anotar. No propone comida: un vaso ahora.
- **Con «Mostrar números» apagado**, sin números: «Vas bajo de proteína hoy: …».
- **Se apaga** en Perfil › Avisos («Si voy muy bajo en algo»). Sin elegir, anda si
  hay algún otro aviso prendido, y no cuenta para el máximo.
- **Al tocarlo:** la hoja para anotar; el del agua, Inicio.

## Lo que conviene hacer (como Rise, para aprobar)

Lo pediste el 3/11/2026: que el aviso te diga qué hacer, a qué hora y qué evitar,
para no tener que abrir Moss. Como en Rise, cada uno lleva de **título lo que hay
que hacer** («Come antes de entrenar», «Última comida grande») y de texto la hora
y lo concreto; los demás avisos siguen con «Moss». Salen del entreno de ese día
(Perfil › Entrenamiento, con lo que tardas en llegar al gimnasio) y de la hora de
ir a la cama (la del aviso de dormir). La regla está en
`src/dominio/loQueConviene.ts`, con sus tests (tu día incluido), y entra en
`avisosDelDia` con los demás; el texto, en `textoDelAviso` y `tituloDelAviso`
(`avisos.ts`). **Todavía no se programan en el teléfono**: se ven en la galería
(«Un día»: sin entreno, el tuyo y entrenando tarde; «Todos»: cada texto en es y
en) y en Perfil › Avisos de la galería, cada uno con su interruptor, apagado de
fábrica como todo lo demás.

### Comer antes de entrenar

- **Qué comida:** la de siempre (la del horario de comidas si la elegiste; si no,
  la hora en que la sueles anotar, o la típica) que cae **desde 4 h antes de
  empezar hasta 1 h antes de salir** al gimnasio (la salida es la hora de entrenar
  menos lo que tardas en llegar: Perfil › Entrenamiento, «Tardo en llegar al
  gimnasio»: en casa, 15, 30, 45 o 60 minutos; 15 de fábrica). Lo más cerca cuenta
  desde que sales (comer y salir enseguida no conviene) y lo más lejos, desde que
  empiezas: hasta el 5/11 las 4 h contaban desde la salida, y con una hora de viaje
  aceptaba una comida 5 h antes de empezar, fuera de lo de ACSM. De las que caen,
  la más cercana a la salida. Hoy, corrida por lo que ya anotaste (como el
  horario), al cuarto de hora: desayunar cinco minutos tarde no hace decir
  «almuerzo a las 13:05».
- **Si ninguna cae:** algo liviano 75 minutos antes de salir (entre 60 y 90). Si
  una comida caía justo antes de salir o en medio del entreno, es esa, más
  temprano: «Merienda más temprano, a las 16:15: …».
- **Cuándo suena:** media hora antes de esa comida, para elegir qué; nunca antes de
  despertarte. Si entrenas apenas te despiertas no hay (la línea de la comida dice
  lo de entrenar en ayunas).
- **Qué dice:** la hora, los carbohidratos y la proteína, con la regla de
  `alrededorDelEntreno.ts` (proteína, 0,3 g/kg o la parte de la meta; de 1 a 2 h
  antes, solo la regla. Carbohidratos, 1 g/kg en las sesiones largas, con la mitad
  de lo que queda del día de tope; en las cortas, sin número), y «poca grasa». Sin
  peso, sin número de carbohidratos; sin meta o con los números ocultos, sin
  gramos.
- **Reemplaza** la hora de esa comida (no suena aparte) y calla la hora y el «falta
  anotar» de las comidas que caerían una hora antes de salir o en medio del
  entreno: comer apenas sales no conviene.
- **Tu día:** almuerzas a las 13:00, entrenas pesas una hora a las 16:00 y tardas
  una hora en llegar (sales a las 15:00). A las 12:30: «Come antes de entrenar ·
  Almuerzo a las 13:00: 75 g de carbohidratos, 40 g de proteína y poca grasa.» (75
  kg, 160 g de proteína en cuatro comidas). Entre que sales y empiezas, nada.
- **De dónde sale:** ACSM 2016 (1 a 4 g/kg de carbohidratos 1 a 4 h antes; cerca de
  entrenar, poca grasa y poca fibra) y la ISSN 2017 (20 a 40 g de proteína por
  comida): [3] y [2] de [`entreno.md`](entreno.md).

### El café

- **El corte:** el de la línea de la comida (`corteDeCafeina`, en
  `alrededorDelEntreno.ts`), **desde la hora de ir a la cama** (como en los estudios;
  desde la de dormirse cortaba 15 a 30 minutos tarde) y **según la cafeína de una
  toma**, como en el modelo de Gardiner 2023 (24 estudios): un café de 107 mg, al
  menos 8,8 h antes de acostarte; un preentreno de 217,5 mg, 13,2 h. En el medio, la
  recta entre los dos; con más, 13,2; con menos, 8,8; sin saber la toma, como un
  café: 9 h. Con 50 mg o menos (un té, una cola), sin corte: no hay último café, y
  el de antes de entrenar va a su hora. Al cuarto de hora de antes. Con la cama a
  las 23:00: sin saber la toma, las 14:00; con 150 mg, las 12:15; con 220 o más, las
  9:45. El «8 h hasta 200 mg, 12 con más» de antes no salía de ninguna fuente.
  Drake 2013: 400 mg 6 h antes todavía le quitan sueño; Gardiner 2025: nada de 400
  mg en las 12 h previas. **El número base (9 h para un café) queda para decidir**
  (D1 de [`estudio/momentos.md`](estudio/momentos.md), Pendiente 4 de `entreno.md`):
  9 h (el metaanálisis, recomendado), 8 h o 6 h; se cambia en `CORTE`.
- **Los días que entrenas,** si una hora antes de empezar (ISSN 2021: la cafeína
  rinde unos 60 minutos antes) todavía está antes del corte, un cuarto de hora
  antes: «Café antes de entrenar · Si tomas, a las 13:00: faltan 10 h para ir a la
  cama.» Con tu hora de viaje, es al salir.
- **Si entrenas tarde,** media hora antes del corte: «Último café · Hasta las 14:00.
  Antes de entrenar a las 20:30, mejor sin café.»
- **Sin entreno,** media hora antes del corte: «Último café · Hasta las 14:00.
  Después, descafeinado.»
- **Nunca una dosis** ni la idea de tomar cafeína a quien no toma ([`entreno.md`](entreno.md),
  3.4): dice la hora, y el interruptor lo prende quien toma café. Con «sin déficit»,
  nunca el de antes de entrenar: queda el corte.

### Proteína después de entrenar

- **Cuándo:** al terminar (la hora de la sesión más lo que dura).
- **Dónde:** en la primera comida hasta 4 h después: «Proteína después de entrenar ·
  Unos 40 g, en la merienda de las 17:30.» Si hace más de 4 h que comiste (o
  entrenaste en ayunas) y esa comida no cae en la primera hora, o no hay comida
  cerca, una hora para eso: «Unos 40 g, antes de las 18:00.» (dos horas si no hace
  tanto que comiste).
- **Cuánto:** la regla de `alrededorDelEntreno.ts` (0,3 g/kg o la parte de la meta;
  al menos 25 g si hace mucho que no comes). Sin carbohidratos: solo importan con
  otra sesión en menos de 8 h (B3 y B4 de `entreno.md`), y el horario a mano tiene
  una sesión por día.
- **Reemplaza** la hora de esa comida si cae en la primera hora.
- **De dónde sale:** [1], [2], [4], [5] y [10] de `entreno.md`.

### La última comida grande

- **Cuándo:** 45 minutos antes del límite, que es 2 h antes de ir a la cama (3 con
  reflujo, en Cuidados), o un cuarto de hora antes de tu cena si cenas más temprano.
  Hasta el 5/11 eran 3 h para todos: lo pediste a las 2 h y la guía dice de 2 a 3; las
  3 h quedan para el reflujo, que es donde está la evidencia (Fujiwara 2005). Como la
  hora de la cama se corre con la deuda, la de la última comida también.
- **Qué dice:** «Última comida grande · Cena antes de las 21:00: a las 23:00, a la
  cama. Después, algo ligero.» Lo que pediste: a qué hora cenar, a qué hora
  acostarte y qué evitar. Reemplaza al comentario del saludo de Inicio («falta la
  cena y a las 22:20, a la cama»).
- **Reemplaza** la hora de la cena del horario: ya dice cuándo cenar. Vale lo mismo
  que ella en el máximo, así la cena nunca se queda sin aviso.
- **No suena** si ya cenaste; si entrenas a esa hora (comes después, y de eso
  habla el de después de entrenar); si el de antes o el de después ya hablan de la
  cena; sin datos del sueño; ni con «sin déficit».
- **De dónde sale:** la guía de reflujo del ACG 2022 («evitar comidas 2 a 3 h antes
  de acostarse», condicional, evidencia baja); Fujiwara 2005 (cenar a menos de 3 h
  de acostarse, 7,45 veces más reflujo que a 4 h o más); para el sueño, cenar 1 h
  antes no cambió nada medido con polisomnografía (Gu 2020, 20 jóvenes sanos); Kinsey
  y Ormsbee 2015 (un snack de unas 150 kcal no perjudica: «algo ligero»). Lo de la
  noche de «lo que falta» cuenta lo mismo (`cercaDeLaCama`, en `loQueFalta.ts`).

### Si entrenas tarde

- **Cuándo:** si la sesión terminaría a menos de 2 h de ir a la cama, media hora
  antes de salir.
- **Qué dice:** «Termina antes de las 21:00 · Más tarde, que sea suave: te acuestas
  a las 23:00.» Si empiezas tan tarde que no quedan 30 minutos antes de esa hora:
  «Hoy, mejor suave · Entrenar fuerte a las 21:15 te quitaría sueño: te acuestas a
  las 23:00.»
- **De dónde sale:** las 2 h, de los ensayos: lo intenso que termina 2 a 4 h antes
  no altera el sueño (Frimpong 2021, metaanálisis de 15 estudios) y el vigoroso en
  la hora antes, quizá sí (Stutz 2019, [46] de `entreno.md`). En noches reales
  (Leota 2025, 14.689 personas con WHOOP), cuanto más tarde y más intenso, más
  tarde se duermen, menos y peor, con la VFC más baja, y desde 4 h antes no se ve
  nada: Leota recomienda 4 h, no 2 (2 h es el borde permisivo; decir «mejor 4 h» en
  el porqué es la D3 de [`estudio/momentos.md`](estudio/momentos.md)). Más estricta
  que la hora de Rise.

### Bajar las luces

- Hora y media antes de acostarte: «Baja las luces · Luz baja y cálida desde ahora: la luz fuerte atrasa tu sueño.
  Te acuestas a las 23:00.» (reescrito el 17/11).
- **De dónde sale:** la hora y media, de Rise [R1]. El consenso de 18 expertos
  (Brown 2022) pide luz muy baja desde al menos 3 h antes de la cama; 90 minutos o 3
  h es la D2 de [`estudio/momentos.md`](estudio/momentos.md). Gooley 2011 no da un
  horario: la luz de una habitación en las 8 h antes de dormir atrasó la melatonina
  y la acortó unos 90 minutos.

### Tu recuperación (con Ascent)

- Solo con Ascent prendida y vinculada (`CON_ASCENT`), los días que entrenas, media
  hora después de despertarte (pesarse va a los 10): «Recuperación: 87 % · Hoy
  puedes entrenar fuerte.» o, debajo de 70, «Recuperación: 52 % · Hoy, mejor suave:
  dormiste 5 h 40 min.» (lo dormido, solo si fue una hora menos de lo que
  necesitas). 70 es «bien» en la propuesta de `recuperado.ts`.
- Guarda su lugar en el máximo; si a esa hora todavía no llegó el número de esa
  mañana, no suena.
- No nombra Ascent («Moss es Moss»): su interruptor aparece solo vinculada.

### Según el deporte: la víspera del partido y la carrera larga (4/11, para aprobar)

- Con partidos o choques, la víspera del partido: «Mañana juegas · Hoy y mañana,
  carbohidratos en cada comida.» Con correr, bici o nadar, dos días antes de una
  carrera de más de hora y media (Perfil › Entrenamiento, «Próxima carrera»): «Tu
  carrera es pasado mañana · Carbohidratos en todas tus comidas y menos fibra.»
- A la hora del almuerzo de siempre y en lugar de «Hora del almuerzo»; suenan aunque
  ya hayas almorzado, porque hablan de todas las comidas. En el máximo valen como lo
  de entrenar. Con «sin déficit», no. Sus interruptores («La víspera del partido» y
  «Antes de una carrera larga») aparecen solo con esos deportes.
- **De dónde sale:** [`entreno.md`](entreno.md), 5.12, reglas 1 y 2 (ACSM 2016; UEFA
  2021); la regla es `segunElDeporte.ts` (`partidoManana` y `diasParaLaCarrera`).

### Lo que ya pasó no suena

- **Ya comiste esa comida** (o una posterior): no suenan el de antes, el de después
  ni la última comida. Algo liviano tampoco, si ya comiste desde una hora antes
  hasta salir.
- **Entrenaste a otra hora** (marcaste «Entrenar», o terminó la sesión de Ascent,
  antes de la hora de tu sesión): no suenan lo de antes, el café de antes, lo de
  entrenar tarde ni lo de después. Lo que reemplazaban vuelve: la hora del almuerzo
  y la de la merienda suenan como siempre, y el café queda en el corte. Sale de la
  hora en que lo marcaste y no de la de ahora, así reprogramar no lo cambia; si ya
  había sonado, no suena otra cosa en su lugar.
- **Lo que no suena guarda su lugar en el máximo**, como un hábito hecho.

### Las prioridades y el máximo

- Entran en **el mismo máximo** que los demás (6 de fábrica; 2, 3, 4, 6 u 8). Si
  sobran, quedan en este orden:
  1. A la cama.
  2. Lo de entrenar: antes, después y la recuperación (solo los días de entreno, y
     dicen qué comer y cuándo).
  3. Tus hábitos, el horario de comidas y pesarte.
  4. Entrenar tarde, la última comida grande (si reemplaza la hora de la cena, vale
     como ella), el café y las luces, en ese orden.
  5. Las comidas sin anotar.

  Lo de «muy bajo en algo», aparte, con su tope. Entre iguales, el más temprano.
- **Nunca dos juntos:** la separación sigue en 20 minutos (`SEPARACION`). La
  investigación proponía una hora; con 6 a 8 avisos por día haría esperar más de 45
  minutos a varios, que entonces no sonarían, y estos casi nunca caen cerca: salen
  de puntos distintos (la comida, la salida, el final del entreno, la cama). En tu
  día, entre dos de lo que conviene hay al menos dos horas, y las luces quedan a una
  hora del de dormir.
- **Tu día, con todo prendido y el horario de comidas** (máximo 8): 7:30 hora del
  desayuno · 12:30 come antes de entrenar · 13:30 último café (hasta las 14: el de
  las 15, al salir, ya quitaría sueño) · 17:00 proteína · 20:15 última comida grande
  · 21:30 luces · 22:10 leer · 22:30 a la cama. Entrenando a las 20:30, las luces no
  entran.

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
- **El máximo** cuenta las veces que suena (2, 3, 4, 6, 8, 10 o 12 por día; 10 de
  fábrica desde el día que sigue tu despertar, D9 de `estudio/momentos.md`). Mientras no lo elijas a mano, el de
  fábrica sube solo con lo que prendes aparte: dos por anotar lo que tienes en la cabeza, uno por las gafas y uno por
  el café (18/11: si no, el café dejaba afuera «Se acerca tu hora de acostarte»), hasta 14 (`maximoDeFabrica`, en
  `sigueElDespertar.ts`). Si
  sobran, quedan primero el de dormir, después los de hábitos, el horario y
  pesarse, y al final los de comidas sin anotar, que casi siempre ya se anotaron.
  Lo de «muy bajo en algo» va aparte, con su propio tope. Lo que conviene entra en
  el mismo máximo, con el orden de «Las prioridades y el máximo».
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
Lo que conviene: comer antes, después y la última comida, la
hoja para anotar esa comida (llevan su comida, como el horario); el café, las luces
y entrenar tarde, Sueño; la recuperación, Ascent. Lo del día que sigue tu despertar: la deuda, tu periodo de
melatonina, bajar el ritmo y las gafas, Sueño; «¿Desayunas hoy?» y las comidas sin desayuno, la hoja para anotar esa
comida; «Anota lo que tienes en la cabeza», Sueño con la nota abierta (`abrirLaNota`, de
`src/secciones/sueno/Pendientes.tsx`); y «Lo que hay que hacer hoy», Inicio, donde está la lista para ir tachando.

## Fuentes de los textos

- [R1] Rise, la rutina de la noche: https://www.risescience.com/blog/wind-down-time
- [R2] Una reseña, los avisos de Rise: https://www.mattressclarity.com/accessories/rise-app-review/
- Lo que conviene, además de [1] a [5], [10], [27], [28], [30] y [46] de
  [`entreno.md`](entreno.md):
  - Katz PO, Dunbar KB, Schnoll-Sussman FH, et al. 2022. ACG Clinical Guideline for
    the Diagnosis and Management of Gastroesophageal Reflux Disease. *Am J
    Gastroenterol* 117(1):27–56. https://doi.org/10.14309/ajg.0000000000001538
  - Fujiwara Y, Machida A, Watanabe Y, et al. 2005. Association between
    dinner-to-bed time and gastro-esophageal reflux disease. *Am J Gastroenterol*
    100(12):2633–2636. https://doi.org/10.1111/j.1572-0241.2005.00354.x
  - Kinsey AW, Ormsbee MJ. 2015. The health impact of nighttime eating: old and new
    perspectives. *Nutrients* 7(4):2648–2662. https://doi.org/10.3390/nu7042648
  - Frimpong E, Mograss M, Zvionow T, Dang-Vu TT. 2021. The effects of evening
    high-intensity exercise on sleep in healthy adults: A systematic review and
    meta-analysis. *Sleep Med Rev* 60:101535. https://doi.org/10.1016/j.smrv.2021.101535
  - Leota J, et al. 2025. Dose-response relationship between evening exercise and
    sleep. *Nat Commun* 16. https://doi.org/10.1038/s41467-025-58271-x
  - Gooley JJ, et al. 2011. Exposure to room light before bedtime suppresses melatonin
    onset and shortens melatonin duration in humans. *J Clin Endocrinol Metab*
    96(3):E463–E472. https://doi.org/10.1210/jc.2010-2098
  - Brown TM, Brainard GC, Cajochen C, et al. 2022. Recommendations for daytime,
    evening, and nighttime indoor light exposure to best support physiology, sleep,
    and wakefulness in healthy adults. *PLoS Biol* 20(3):e3001571.
    https://doi.org/10.1371/journal.pbio.3001571
  - Stutz J, Eiholzer R, Spengler CM. 2019. Effects of evening exercise on sleep in
    healthy participants: a systematic review and meta-analysis. *Sports Med*
    49(2):269–287. https://doi.org/10.1007/s40279-018-1015-0
  - Gardiner CL, Weakley J, Burke LM, et al. 2025. Dose and timing effects of
    caffeine on subsequent sleep: a randomized clinical crossover trial. *Sleep*
    48(4):zsae230. https://doi.org/10.1093/sleep/zsae230
  - Reis CEG, Loureiro LMR, Roschel H, da Costa THM. 2021. Effects of pre-sleep
    protein consumption on muscle-related outcomes: a systematic review. *J Sci Med
    Sport* 24(2):177–182. https://doi.org/10.1016/j.jsams.2020.07.016
  - Las demás, y el estudio entero de los horarios, en
    [`estudio/momentos.md`](estudio/momentos.md).

## El día que sigue tu despertar (16/11/2026, lo pediste; aprobado en la galería 49 y programado)

**Lo que pasó:** el 16/11 te llegó «Buen momento para pesarte» antes de despertarte. Los avisos se programan
de antemano: pesarse va a tu despertar habitual + 10 min (`PESARSE_DESPUES`) o a las 8:00 sin noches
(`PESARSE_SIN_SUENO`). Si ese día te despertás más tarde, suena igual.

**Lo que pediste:** como Rise, que el día se acomode a cómo es el tuyo, y que cada día sea distinto.

1. **El día arranca cuando te despertás de verdad.** El despertar real sale de lo primero que llegue: el final
   de la noche en Salud, el despertador o el atajo (las anclas, `src/salud/anclas.ts`) o la primera vez que
   abres Moss de mañana. La tarea de segundo plano (`src/fondo/`) lo busca de mañana, con el teléfono ya
   desbloqueado. Hasta saberlo, no suena nada de la mañana: ni pesarse, ni el desayuno.
2. **Al despertar, de a uno y separados:**
   - tu deuda de sueño en una línea, sin festejar: «Tu deuda de sueño bajó a 1 h 20 min» (o subió);
   - un rato después, pesarse, si lo tienes prendido;
   - después, el desayuno: «¿Desayunas hoy?», con dos botones en el aviso: «Sí» y «Voy directo al almuerzo».
3. **El día de comidas se ordena con la primera comida.** Si la primera que anotas es el desayuno, las demás
   van a su hora de siempre. Si es el almuerzo, porque no desayunaste, la merienda y la cena se corren
   (`horasCorridas` en `avisos.ts`) y lo que te queda del día se reparte entre ellas: «Lo que no comiste en
   el desayuno va a la merienda y la cena». Sin culpa y sin pasarse del día.
4. **La noche se arma con tu despertar y tu deuda.** Con la hora a la que te despertaste, cuánto necesitas
   dormir y la deuda, Moss calcula la hora de ir a la cama de esa noche, y desde ahí, en orden:
   - **tu ventana de melatonina** (de fábrica): cuándo te va a costar menos dormirte;
   - **bajar las revoluciones** (de fábrica), una hora antes: lo tranquilo, sin pantallas brillantes;
   - **bajar las luces** (de fábrica, como ahora);
   - **la hora de ir a la cama** (de fábrica, como ahora).
5. **Cada aviso con su interruptor en Perfil › Avisos**, en dos grupos:
   - **de fábrica:** la deuda al despertar, pesarse (si lo elegiste), las comidas, la ventana de melatonina,
     bajar las revoluciones, bajar las luces y la hora de dormir;
   - **más (apagados de fábrica):** descargar lo que tienes en la cabeza antes de dormir, las gafas que
     bloquean la luz azul (no todos las tienen), el café, no entrenar fuerte tan tarde y la última comida
     grande.
   Siguen las reglas de siempre: de a uno, con un máximo por día, y nada de lo que ya pasó.

**Antes de programarlo:** lo visual (Perfil › Avisos con los dos grupos, los botones del desayuno y los textos
nuevos) va primero a la galería. La ventana de melatonina y la descarga de pensamientos van con su evidencia
en `spec/estudio/momentos.md`: la melatonina sube unas 2 horas antes de la hora habitual de dormirse
(DLMO), y escribir lo pendiente antes de acostarse acortó el tiempo en dormirse en un ensayo chico
(Scullin, 2018); se revisa antes de escribir los textos.

**Aprobado el 16/11** en la galería 49 (escenario `dia`: Perfil › Avisos con sus dos grupos y la pantalla bloqueada),
con D8 (la cama se corre la mitad de lo que te despertaste tarde), D9 (máximo de fábrica 10) y D10 (las gafas,
apagadas y sin marca) de [`estudio/momentos.md`](estudio/momentos.md).

**Cómo quedó** (el 16/11; **desde el 17/11, las palabras de cada aviso y la cuenta de la noche son las de «Los avisos
reescritos», abajo**: donde acá dice «la ventana de melatonina», «las revoluciones» o «la cama», léase tu periodo de
melatonina, bajar el ritmo y acostarte; **desde el 25/11, lo de fábrica es el de «Lo de fábrica», arriba de todo**):

- **La regla** está en `src/dominio/sigueElDespertar.ts`, con sus tests, y entra en `avisosDelDia` como lo que
  conviene (`avisosQueSiguenElDespertar`). Se prende con `Sueno.despertarReal` (el despertar de verdad de cada día, o
  null mientras no se sabe): sin él, todo sigue como antes.
- **La mañana:** sin despertar, no suena pesarse, ni el desayuno, ni lo de un hábito «al despertar». Con él: la deuda
  a esa hora («Tu deuda de sueño bajó a 1 h 30 min», a la media hora como en Sueño; subió, sigue, bajó a cero o no
  hay), pesarse 20 minutos después (10 sin la deuda) y «¿Desayunas hoy?» 20 minutos después o a la hora del
  desayuno, con «Sí» y «Voy directo al almuerzo». La pregunta reemplaza la hora del desayuno y su «falta anotar».
- **Sin desayuno** (lo contestaste, o lo primero que anotaste es otra comida): cada comida que queda dice cuánto le
  toca de lo que falta del día, con el reparto del plan (`REPARTO`): «Hora del almuerzo: unas 1050 kcal. Lo que no
  comiste en el desayuno va al almuerzo, a la merienda y a la cena.» Lo anotado corre las demás (`horasCorridas`).
  Con los números ocultos o sin meta, sin kcal.
- **La noche:** la cama sale de mañana, la necesidad y la deuda, como siempre, y despertarte más tarde corre la mitad
  la hora de siempre de dormirte (D8 de [`estudio/momentos.md`](estudio/momentos.md)). La melatonina, 2 h antes de
  dormirte; las luces, hora y media antes de la cama; las revoluciones, una hora antes; la cama, como siempre. Las
  gafas (2 h antes) y anotar lo pendiente (al acostarte), apagados. La evidencia, en la sección 10 de ese estudio.
- **De fábrica** (`deFabrica`), desde el 25/11/2026: la deuda y la melatonina, con un máximo de 10 (D9); las comidas
  sin anotar, aparte (`comidasSinAnotar`); pesarse, como lo elegiste. Hasta el 25/11 también venían prendidos el
  horario (desayuno, almuerzo y cena), las revoluciones, las luces y la cama.
- **En el teléfono (16/11):**
  - **El despertar real** (`despertarDelDia`, en `sigueElDespertar.ts`): lo más temprano entre el final de la noche
    en Salud, las anclas del despertador o el atajo (`alarmaParada`, `despertadorParado`, `meDesperte`) y la
    primera vez que abres Moss de mañana. Abrir Moss o un final de noche de Salud de más de 3 h antes de tu despertar
    de siempre no cuentan (mirar la hora de madrugada no es despertarse), ni abrirla pasadas las 13; el despertador
    sí, desde el corte. Lo busca `src/salud/despertar.ts` al abrir Moss y en la tarea de segundo plano, y queda en el
    teléfono por día (`despertares`, dos semanas), con la hora en que Moss lo supo.
  - **Lo de la mañana, desde que Moss lo sabe:** el teléfono se entera un rato después (abres Moss, llega la noche de
    Salud, corre la tarea), y lo de antes ya no puede sonar. La deuda suena dos minutos después de saberlo
    (`inicioDeLaManana`, en `avisos.ts`), y lo demás sigue desde ahí; lo de un hábito «al despertarte», igual. Si se
    supo más de 2 h después de despertarte, la deuda y pesarse ya no suenan (`MANANA_QUE_SE_PASO`, una convención);
    la pregunta del desayuno sí.
  - **«¿Desayunas hoy?»** trae los dos botones (la categoría `desayuno` de `programar.ts`). «Sí» abre Moss en el
    desayuno, para anotarlo; «Voy directo al almuerzo» se guarda sin abrirla (`desayunos`). Si iOS no le pasa la
    respuesta a Moss, anotar el almuerzo primero dice lo mismo. Contestada, sale del centro de notificaciones.
  - **`programar.ts`** arma cada día lo que conviene (`loQueConviene`) y lo del despertar (`avisosDelDespertar`), con
    la deuda de ayer, la meta, lo comido, las sesiones, la cafeína por toma, el peso, la edad y los cuidados (lo que un
    cuidado apaga no suena; con reflujo, la última comida 3 h antes). Lo que conviene y lo de la noche llevan su título.
  - **De fábrica** (`avisosDe`, con `deFabrica`): vale para lo que nunca se tocó; lo elegido se respeta. El horario
    apagado queda vacío (`{}`) y ya no vuelve al de fábrica. Quien lo había apagado antes del 16/11 lo guardaba sin
    nada (igual que no haberlo tocado): le vuelve prendido. Las comidas sin anotar, igual desde el 25/11 (`comidasQueAvisan`,
    en `programar.ts`): sin elegir son las de fábrica; apagadas quedan vacías.
  - **Perfil › Avisos**, como en la galería: «Tu día» (la deuda, pesarse, el horario, la melatonina, las luces, las
    revoluciones, la hora de dormir, «Tardo en dormirme» y «Necesito dormir») y «Más avisos» (anotar lo pendiente, las
    gafas, el café, entrenar tarde, la última comida, comer antes y la proteína después de entrenar, las comidas sin
    anotar y si vas muy bajo), y el máximo con 10. La víspera del partido y la carrera larga, todavía no (según el
    deporte está para aprobar); la recuperación, con Ascent.

## Los avisos reescritos y «Lo que hay que hacer hoy» (17/11/2026: aprobados con la galería 50 y programados)

Lo pediste el 17/11: que el título diga qué hacer y el cuerpo dé el detalle con la hora, en español neutro, sin «a
la cama» y con palabras propias. Lo aprobaste en la galería 50 (escenario `melatonina`) y está en la app: las
palabras, en `src/textos` (`recordatorios.acostarte`, `recordatorios.pesarte`, `recordatorios.despertar` y
`recordatorios.conviene.luces`; los nombres de Perfil, en `perfil.avisos`), y las escriben `tituloDelAviso` y
`textoDelAviso` (`avisos.ts`). La pantalla bloqueada de la galería las toma de ahí. El horario de comidas, las
comidas sin anotar, lo que falta, los hábitos y lo demás de lo que conviene conservan su texto, con «Moss» de título
los cuatro primeros.

| Aviso | Título | Cuerpo |
|---|---|---|
| Tu periodo de melatonina (25/11, una hora antes) | «En 1 hora empieza tu periodo de melatonina» | «A las 23:30. Ve dejando las pantallas y baja las luces: así te duermes más fácil.» |
| Bajar las luces | «Baja las luces» | «Luz baja y cálida desde ahora: la luz fuerte atrasa tu sueño. Te acuestas a las 23:15.» |
| Bajar el ritmo (antes, «las revoluciones») | «Baja el ritmo» | «Deja lo que te acelera y las pantallas brillantes. Te acuestas a las 23:15.» |
| Acostarte | «Acuéstate a las 23:15» | «En media hora. Así te duermes dentro de tu periodo de melatonina (23:30 – 00:30).» Con la deuda: «En media hora. Con 4 h de deuda de sueño, esta noche no lo dejes para más tarde.» |
| Anotar lo que tienes en la cabeza | «Anota lo que tienes en la cabeza» | «Escribe tus pendientes antes de acostarte: con la cabeza despejada cuesta menos dormirse. Mañana Moss te los recuerda.» |
| Las gafas | «Ponte las gafas para la luz azul» | «Si las tienes, úsalas desde ahora hasta acostarte, a las 23:15.» |
| La deuda al despertar (25/11) | «Tu deuda de sueño bajó» (o «subió», «sigue igual», «bajó a cero», «Sin deuda de sueño»; sin el día anterior, «Tu deuda de sueño: 4 h») | «Ahora es de 4 h: 30 min menos que ayer.» (la primera vez, qué es) |
| Pesarte | «Pésate antes de desayunar» | «Después de ir al baño y siempre igual: así se ve la tendencia.» |
| El desayuno | «¿Desayunas hoy?» | «Si vas directo al almuerzo, lo del desayuno se reparte en el resto del día.», con «Sí» y «Voy directo al almuerzo» |
| Lo que hay que hacer hoy (nuevo) | «Lo que hay que hacer hoy» | Tus pendientes, uno por línea: hasta cuatro, y «y 2 más» |
| Las comidas sin desayuno (el título es nuevo, del 17/11) | «Almuerza unas 1050 kcal» («Merienda unas…», «Cena unas…») | «Lo que no comiste en el desayuno va al almuerzo, a la merienda y a la cena.» Sin números o sin meta, el título es «Hora del almuerzo» |
| Acostarte sin periodo (el cuerpo es nuevo) | «Acuéstate a las 22:45» | «En media hora. Así duermes 8 h y te despiertas a las 07:00.» |

### Una sola cuenta de la noche

El aviso del periodo, el de acostarte, la tarjeta de Sueño, Perfil › Avisos y la pantalla bloqueada de la galería
dicen las mismas horas, porque salen de la misma cuenta: `periodoDeMelatonina` (`src/dominio/melatonina.ts`), con
tus noches de los últimos 7 días y tu margen para dormirte.

- **Cómo entra en la regla:** `Sueno.periodo(dia)` (`avisos.ts`) da el periodo de la noche que empieza ese día, y
  `horasDeSueno` lo usa: te duermes cuando empieza (`desde`) y te acuestas tu margen antes (`acostarse`, de a 5
  minutos). De esa hora cuentan todos: acostarte (un rato antes), las luces (hora y media antes), bajar el ritmo (una
  hora), las gafas (dos), anotar lo que tienes en la cabeza (cinco minutos), la última comida grande, el corte del
  café, entrenar tarde, lo que falta a la noche, los hábitos «antes de dormir» y el widget de la noche. En el
  teléfono lo arma `suenoParaAvisos` (`programar.ts`) con las mismas noches, el mismo día y el mismo margen que la
  tarjeta (`Sueno.tsx`); los días que vienen todavía no tienen noches y usan el de hoy.
- **El aviso del periodo**, desde el 25/11/2026, suena una hora antes de que empiece (`ANTES_DEL_PERIODO`) y dice a
  qué hora empieza, al minuto: «En 1 hora empieza tu periodo de melatonina · A las 22:57…». Antes sonaba cuando la
  melatonina empieza a subir (`inicio`, dos horas antes). Con acostarte prendido y 15 minutos de margen, el de
  acostarte cae 15 minutos después: el del periodo va 20 minutos antes de él, y la noche queda las luces, bajar el
  ritmo, el periodo y acostarte.
- **Sin periodo** (menos de 3 noches en la última semana, o noches con poca confianza en el horario): el aviso del
  periodo no suena, y «Acuéstate a las…» y lo demás de la noche usan la cuenta de antes («La hora de dormir»,
  arriba), con el cuerpo que dice cuánto dormirías.
- **La deuda ya no adelanta la hora** cuando hay periodo: antes del periodo cuesta dormirse (`melatonina.ts`). Una
  noche de cada cuatro, el cuerpo dice que no lo dejes para más tarde. **Lo que necesitas dormir tampoco la mueve**:
  sigue en la deuda y en la calidad, y el texto de «Necesito dormir», en Perfil, ya dice solo eso («la usan la deuda
  y la calidad»).
- **D8, la mitad de lo que te despertaste tarde:** con periodo, **no se aplica**. Correr la hora daría un «Acuéstate
  a las…» distinto del de la tarjeta de Sueño y del de Perfil, que dicen el comienzo del periodo: lo contradice. Y el
  periodo ya se corre solo con tu despertar, porque la noche de hoy entra en el punto medio de los 7 días:
  despertarte 2 h 30 más tarde lo atrasa unos 11 minutos (con las 7 noches), que es la parte del reloj del cuerpo (el estudio la estima
  en un 10 a 15 % para una sola mañana: `estudio/deuda-y-melatonina.md`, 3.3). La otra parte de D8 (hay menos horas
  despierto encima) queda afuera. **Sin periodo, D8 sigue como estaba** (`CORRE_CON_EL_DESPERTAR`). Si prefieres que
  también con periodo la hora se corra (hasta el final del periodo, para seguir durmiéndote dentro de él), es un
  cambio chico en `horasDeSueno`, y la tarjeta de Sueño tendría que tomar la hora de ahí.

### En Perfil › Avisos

- Los mismos nombres: «Tu periodo de melatonina», «Bajar las luces», «Bajar el ritmo», «Acostarte» (con la hora de
  esta noche y tu periodo; sin periodo, la hora de antes con su porqué; sin noches, que la calcula con tu periodo) y
  «Anotar lo que tienes en la cabeza». «Tardo en dormirme» es el margen de Sueño › Afinar (0, 15, 30, 45 o 60 min).
- Lo guardado no cambió de nombre (`melatonina`, `revoluciones`, `dormir`, `descarga`): lo que ya habías elegido
  se respeta.
- **El máximo que se muestra es el que vale:** el que elegiste o, sin elegir, el de fábrica, que es 10 y sube solo a
  12 con anotar lo que tienes en la cabeza, a 11 con las gafas y a 13 con los dos. Las opciones son 2, 3, 4, 6, 8, 10
  y 12; si quedó en 11 o 13, aparece entre ellas. Cuando subió solo, una línea lo dice: «Subió solo a 12 por los
  avisos que encendiste. Si eliges otro, queda el tuyo.» Elegido a mano, se respeta tal cual, también si es menos.

### Lo que hay que hacer hoy

- **A la noche**, «Anota lo que tienes en la cabeza» abre una nota corta en Sueño: escribes tus pendientes uno
  por uno (hasta 6, de hasta 60 letras), se quitan con la cruz y quedan en el teléfono. Con el aviso activado,
  Sueño muestra la fila «Lo que tienes en la cabeza», debajo del periodo, para abrirla cuando quieras.
- **A la mañana**, después del despertar, llega «Lo que hay que hacer hoy» con lo de ese día que todavía no
  tachaste: 20 minutos después de «¿Desayunas hoy?» (sin la pregunta, después de lo último de la mañana; sin nada
  más, al despertarte). Hasta cuatro líneas, y «y 2 más». Está en `sigueElDespertar.ts` (`avisosDelDespertar`, con
  los pendientes del día: `pendientesPara`, de `src/dominio/pendientes.ts`): entra en la regla como un aviso más,
  de a uno y dentro del máximo, y vale como pesarte o el horario. Como todo lo de la mañana, espera a que Moss sepa
  que te despertaste. Con todo tachado no suena (y si ya había llegado, sale del centro de notificaciones).
- **Al tocarlos:** el de la noche abre Sueño con la nota para escribir; el de la mañana, Inicio.
- **Después se ven en Inicio**, arriba de «Para hoy», para ir tachando.
- **Apagado de fábrica**, con «Anotar lo que tienes en la cabeza»: un solo interruptor (`descarga`, en lo guardado)
  para la nota, el aviso de la noche, el de la mañana y la lista de Inicio. Anotar o tachar un pendiente vuelve a
  programar los avisos (`LO_QUE_MUEVE_LOS_AVISOS`).

**Lo que se decidió (17/11):**

- **El máximo:** de fábrica sigue en 10, sube solo con los extras (dos por anotar, uno por las gafas; hasta 13), como
  en la pantalla bloqueada de la galería 50, y Perfil › Avisos suma el 12 a las opciones. El que elegiste a mano no
  se toca. Así, prender «Anotar lo que tienes en la cabeza» no deja afuera ni ese aviso ni «Baja el ritmo», que eran
  los primeros en caerse con diez (los últimos de los que menos valen).
- **Las comidas sin desayuno** pasaron a título y cuerpo (la tabla de arriba).

**Para tener en cuenta:**

- **Si elegiste el máximo a mano, no sube solo.** Con el horario, las luces, el ritmo y acostarte prendidos son ocho
  avisos (la deuda, el desayuno, el almuerzo, la cena, el periodo, las luces, el ritmo y acostarte); con pesarte y la
  merienda, diez; con lo pendiente, doce. Las comidas sin anotar (de fábrica desde el 25/11) suman las suyas, pero son
  las primeras en caerse: casi siempre ya se anotaron. Quien eligió 10 a mano y prende «Anotar» tiene que pasar a 12
  para que suenen todos: después de las comidas sin anotar, los primeros en caerse son el de anotar y bajar el ritmo.
- **Las gafas aprietan la noche**: cada aviso va a 20 minutos del anterior, y el que tendría que esperar más de 45 no
  suena. Con la cena a las 21:00 y acostarte a las 22:40 (el día de ejemplo de la galería), con las gafas se cae
  «Baja el ritmo»; con la cena más temprano, entran todos.
- **Solo se prueba en el iPhone:** los dos botones de «¿Desayunas hoy?» y «Me voy a dormir», que tocar el de la noche
  abra la nota con Moss cerrada, y que la tarea de segundo plano encuentre tu despertar para que la lista de la
  mañana llegue sin abrir Moss. La regla, los textos y lo que se programa tienen tests.

## Lo que queda

- Los avisos de después de entrenar (con Ascent) andan en la regla, pero la
  conexión con Ascent está apagada en la v1.
- La alarma propia de Moss (AlarmKit) y los Atajos para el sueño, después de la
  v1: ver [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md).
- **Para programar lo que conviene en el teléfono**, una vez aprobado en la galería. **Hecho el 16/11**, con el día
  que sigue tu despertar (arriba), salvo la recuperación (con Ascent), el partido y la carrera (según el deporte, para
  aprobar), «Tardo en llegar al gimnasio» en Perfil y el texto de Perfil › Entrenamiento:
  1. `src/recordatorios/programar.ts`: armar `loQueConviene` de cada día y pasarlo
     con `convieneDe` a `avisosDeLaSemana` (ya lo recibe). Lo que pide: las sesiones
     con su tipo (`sesionesDelDia`), el viaje (`Entreno.viaje`), cuándo entrenaste
     hoy (el `momento` de la marca de un hábito de entrenar, o el final de la sesión
     de Ascent), la meta del día y lo comido hoy, el peso, la edad, las comidas que
     sueles anotar (3 o 4) y la cafeína por toma (los dos, como en
     `secciones/comida/entreno.ts`), «sin déficit», los números y, con Ascent, la
     recuperación de esa mañana.
  2. El título: `content.title` con `tituloDelAviso` (hoy, siempre «Moss»).
  3. Al tocarlo, como dice «Al tocarlo» (`useAlTocarUnAviso` y `Secciones.tsx`).
  4. El almacén: que `leerAvisos` lea los interruptores nuevos y `leerEntreno`, el
     viaje. Hoy `leerAvisos` tampoco lee `falta`: si lo apagas en Perfil, vuelve a
     andar al reabrir Moss.
  5. `Perfil.tsx`: los interruptores (la recuperación, solo vinculada) y «Tardo en
     llegar al gimnasio». Los textos ya están: el de Perfil › Entrenamiento pasa a
     `entreno.perfil.textoConAvisos` (el de hoy dice «Nunca te avisa») y el del
     máximo, a `perfil.avisos.maximoTextoConviene`.
  6. Un test en `programar.test.ts` con tu día.
- **Para decidir:**
  - De fábrica, apagados como todo, o que se prendan solos al cargar tu
    entrenamiento o la hora de dormir.
  - ~~Si el aviso de dormir deja de decir «Baja las luces» las noches que suena el de
    las luces.~~ Quedó (5/11, arreglo claro del estudio de los horarios): con el de las
    luces prendido, no lo dice.
  - El número base del corte del café, para la línea y el aviso: 9 h para un café
    (lo de hoy, el metaanálisis), 8 o 6 (D1 de [`estudio/momentos.md`](estudio/momentos.md),
    Pendiente 4 de `entreno.md`).
  - La recuperación: el umbral de 70 y el número, cuando se apruebe
    `recuperado.ts`.
  - Las horas de comer de los días de entreno: hoy salen de todos los días. Si los
    días que entrenas comes a otra hora, conviene aprenderlas aparte (con 4 de esos
    días o más), o una hora a mano «los días que entreno».
