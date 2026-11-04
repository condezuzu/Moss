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
  la hora en que la sueles anotar, o la típica) que cae **entre 1 y 4 h antes de
  salir** al gimnasio: la hora de entrenar menos lo que tardas en llegar (Perfil ›
  Entrenamiento, «Tardo en llegar al gimnasio»: en casa, 15, 30, 45 o 60 minutos;
  15 de fábrica). De las que caen, la más cercana a la salida. Hoy, corrida por lo
  que ya anotaste (como el horario), al cuarto de hora: desayunar cinco minutos
  tarde no hace decir «almuerzo a las 13:05».
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
  `alrededorDelEntreno.ts`): 8 h antes de dormirte, 12 h si una toma pasa de 200 mg
  (Gardiner 2023: un café de 107 mg, al menos 8,8 h antes; un preentreno de 217 mg,
  13,2 h. Drake 2013: 400 mg 6 h antes todavía le quitan sueño). La investigación
  proponía 9 h; queda en 8 para no decir otra hora que la línea (Pendiente 4 de
  `entreno.md`).
- **Los días que entrenas,** si una hora antes de empezar (ISSN 2021: la cafeína
  rinde unos 60 minutos antes) todavía está antes del corte, un cuarto de hora
  antes: «Café antes de entrenar · Si tomas, a las 15:00: faltan 8 h para dormir.»
  Con tu hora de viaje, es al salir.
- **Si entrenas tarde,** media hora antes del corte: «Último café · Hasta las 15:00.
  Antes de entrenar a las 20:30, mejor sin café.»
- **Sin entreno,** media hora antes del corte: «Último café · Hasta las 15:00.
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

- **Cuándo:** 45 minutos antes del límite, que es 3 h antes de ir a la cama, o un
  cuarto de hora antes de tu cena si cenas más temprano.
- **Qué dice:** «Última comida grande · Cena antes de las 20:00: a las 23:00, a la
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
  de acostarse, 7,45 veces más reflujo que a 4 h o más); Kinsey y Ormsbee 2015 (un
  snack de unas 150 kcal no perjudica: «algo ligero»).

### Si entrenas tarde

- **Cuándo:** si la sesión terminaría a menos de 2 h de ir a la cama, media hora
  antes de salir.
- **Qué dice:** «Termina antes de las 21:00 · Más tarde, que sea suave: te acuestas
  a las 23:00.» Si empiezas tan tarde que no quedan 30 minutos antes de esa hora:
  «Hoy, mejor suave · Entrenar fuerte a las 21:15 te quitaría sueño: te acuestas a
  las 23:00.»
- **De dónde sale:** Leota 2025 (14.689 personas con WHOOP: cuanto más tarde y más
  intenso, más tarde se duermen, menos y peor, con la VFC más baja; terminando 4 h
  antes, nada), Frimpong 2021 (lo intenso que termina 2 a 4 h antes no altera el
  sueño) y Stutz 2019 ([46] de `entreno.md`: el vigoroso a menos de 1 h, sí). Más
  estricta que la hora de Rise.

### Bajar las luces

- Hora y media antes de ir a la cama: «Baja las luces · Luz tenue y cálida: a las
  23:00, a la cama.»
- **De dónde sale:** Rise [R1]; Gooley 2011 (la luz de una habitación antes de dormir
  atrasa la melatonina y la acorta unos 90 minutos).

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
  desayuno · 12:30 come antes de entrenar · 14:45 café · 17:00 proteína · 19:15
  última comida grande · 21:30 luces · 22:10 leer · 22:30 a la cama. Entrenando a
  las 20:30, las luces no entran.

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
Lo que conviene (cuando se programe): comer antes, después y la última comida, la
hoja para anotar esa comida (llevan su comida, como el horario); el café, las luces
y entrenar tarde, Sueño; la recuperación, Ascent.

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

## Lo que queda

- Los avisos de después de entrenar (con Ascent) andan en la regla, pero la
  conexión con Ascent está apagada en la v1.
- La alarma propia de Moss (AlarmKit) y los Atajos para el sueño, después de la
  v1: ver [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md).
- **Para programar lo que conviene en el teléfono**, una vez aprobado en la galería:
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
  - Si el aviso de dormir deja de decir «Baja las luces» las noches que suena el de
    las luces.
  - El corte del café, 8 o 9 h, con la línea de la comida (Pendiente 4 de
    `entreno.md`).
  - La recuperación: el umbral de 70 y el número, cuando se apruebe
    `recuperado.ts`.
  - Las horas de comer de los días de entreno: hoy salen de todos los días. Si los
    días que entrenas comes a otra hora, conviene aprenderlas aparte (con 4 de esos
    días o más), o una hora a mano «los días que entreno».
