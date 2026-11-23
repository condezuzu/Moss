# Sueño

La sección nueva (cambio 9 de la [especificación](especificacion.md),
22/10/2026). Lo que pediste:

- la duración, las etapas, lo despierto y el tiempo en cama;
- el horario y qué tan regular es;
- una calidad calculada con todo eso, explicando de qué sale;
- la deuda;
- la frecuencia en reposo, la variabilidad y la respiración de noche, si el reloj las registra;
- de dónde sale cada dato y qué tan confiable es: si falta una noche, mostrarlo en vez de inventar.

Investigué qué más hace falta para que sea confiable; lo que salió está acá. Las
reglas están en `src/dominio/sueno.ts`, con sus tests, y la galería las usa tal
cual con cuatro semanas de mentira.

## Qué tiene la sección

0. **La pregunta de la mañana** (lo pediste el 22/10/2026): arriba, cada día,
   «¿Cómo dormiste anoche?» con cinco caras de línea, de «Muy mal» a «Muy bien».
   - Un toque y listo; queda una línea con la respuesta y «Cambiar».
   - «Ahora no» la esconde por hoy, sin recordatorios ni rachas. Al otro día
     pregunta por la noche nueva.
   - Es un dato de verdad: la calidad que uno siente es de lo más usado en los
     estudios de sueño (los diarios de sueño, la pregunta de calidad del PSQI), y
     sin reloj es la única calidad posible.
   - Va a la recuperación (ver [`ascent.md`](ascent.md)): sin reloj, es la
     calidad de la noche; con reloj, el promedio con la del reloj. En «La calidad»
     aparece aparte («Cómo dijiste que dormiste»): no cambia el puntaje de la
     noche, que sale de lo medido.
   - **Sin reloj, arriba de las caras va la hora** que estimó Moss: «¿Dormiste de
     00:30 a 08:10?», con «Sí» y «Cambiar», solo si no está segura (ver «Sin
     reloj», abajo).
1. **Las últimas dos semanas:** una barra por noche con lo dormido y la línea de
   lo que necesitás. Las que faltan van en gris. Se toca una para verla.
2. **La noche:**
   - cuánto dormiste (lo que el reloj mide mejor), y a qué hora te dormiste y te despertaste;
   - sin reloj, la noche que estimó Moss, con su rango y qué tan segura es
     («Estimada · confianza media»), o la que confirmaste;
   - si parece cortada, se pregunta (ver abajo);
   - el hipnograma y las etapas, marcadas como estimación;
   - lo despierto y los despertares de 5 minutos o más;
   - el tiempo en cama, solo si alguna fuente lo escribió;
   - las siestas del día.
3. **La deuda de sueño** de las dos semanas, arriba de todo y compacta. Desde el
   17/11/2026 (lo pediste así, cuando Moss te daba 16 h 30 y Rise 4 h):
   - «Deuda de sueño» y el número de una («4 h», «6 h 30»; «Sin deuda» en 0), con
     la palabra a la derecha en una pastilla: Baja, Media o Alta;
   - debajo, «Duermes unas 7 h 10 · Necesitas 8 h». «Necesitas 8 h» se toca y se
     cambia ahí mismo (el mismo ajuste de «Necesito dormir»), y si tu historial da
     otra, una línea chica la propone: «Tus noches largas rondan 7 h 30. Usar 7 h 30»;
   - solo con el teléfono, una línea: «Estimada con tu teléfono. Con un reloj o un
     anillo es más precisa.», que abre Perfil › Aparatos, con la guía para conectar
     cada marca arriba (`spec/aparatos.md`, «Conectar cada marca»);
   - «Más» despliega lo de cada noche, la última comida grande de esta noche (2 h
     antes de acostarte; 3 con reflujo) y cómo se calcula. Ya no va el medidor ni la
     frase que juzgaba («hace días que duermes bastante menos…»): el número es una
     estimación. Tampoco «Acuéstate a las…»: la hora de acostarte va debajo, en tu
     periodo de melatonina.

   Debajo, con la noche de hoy, **tu periodo de melatonina** y, con su aviso
   activado, la fila de **«Lo que tienes en la cabeza»** (ver «Tu periodo de
   melatonina» y «Lo que tienes en la cabeza», más abajo); después la noche, tu
   energía y, más abajo, la tira de los días para elegir otra noche.
4. **La calidad,** de 0 a 100, con sus tres partes y «Cómo se calcula».
5. **El horario de las dos semanas:**
   - cada noche como una barra de cuándo te dormiste a cuándo te despertaste;
   - el promedio de cada hora con su ±;
   - qué tan regular es;
   - cuánto más tarde dormís el fin de semana.
6. **De noche, según el reloj:**
   - la frecuencia cardíaca, la variabilidad y la respiración mientras dormías, contra lo tuyo;
   - la frecuencia en reposo, marcada «del día».
7. **De dónde sale cada dato** y qué tan confiable es: el aparato de la noche y
   su nivel de precisión, lo que llegó de otros y no se usó, y lo que falta (ver
   [`aparatos.md`](aparatos.md)).
8. **Al pie:** Moss no es un dispositivo médico; si te preocupa cómo dormís,
   consultá a un médico.

## Lo que trae Salud

- **Los valores de `HKCategoryValueSleepAnalysis`:**
  - `inBed`;
  - `asleepUnspecified` (el `asleep` viejo);
  - `awake`;
  - las etapas `asleepCore`, `asleepDeep` y `asleepREM`, desde iOS 16 y watchOS 9. El núcleo es N1 más N2.

  Las etapas quedan adentro del `inBed` y no se pisan entre sí.
- **El Apple Watch:**
  - registra dormido o despierto desde watchOS 7, y las etapas desde watchOS 9;
  - pide «Registrar el sueño con el Apple Watch» y al menos 30 % de batería;
  - escribe `awake` solo entre dos muestras de sueño. Por eso casi nunca se sabe cuánto tardaste en dormirte ni cuánto quedaste en cama después.
- **El iPhone solo** escribía `inBed` alrededor del horario de sueño, por el uso
  del teléfono, hasta iOS 17: desde iOS 18 ya no escribe nada (ver «Sin reloj»,
  abajo). Sin reloj no hay etapas.
- **Otras apps:**
  - Oura y Garmin escriben etapas.
  - WHOOP escribe dormido y despierto, sin la variabilidad: mide RMSSD, y Salud guarda SDNN.
- **Sumar todo falla:** en un foro de Cronometer, una noche de 7:37 del reloj
  aparecía como 14:30.
- **Lo que no se puede leer:**
  - el orden de prioridad de fuentes que elegiste en Salud;
  - el puntaje de sueño de Apple (watchOS 26): no hay forma de leerlo desde otra app.
- **Un permiso negado se ve igual que «no hay datos».**

## Las reglas para que sea confiable

1. **Una sola fuente por noche, nunca dos sumadas.** El orden, por cómo
   distingue el sueño de la vigilia, está en [`aparatos.md`](aparatos.md): la que
   elijas, el Apple Watch u Oura, Google o Fitbit, WHOOP, Polar, Garmin y
   Withings, lo que no está validado, las apps del teléfono, lo anotado a mano en
   Salud y, al final, la estimación de Moss sin reloj.
2. **Dentro de una fuente:**
   - gana la revisión más nueva;
   - lo que tiene etapa, o está despierto, gana a lo «dormido» sin etapa que se le encima. Lo que pierde se corta, no se descarta: es lo que hace Salud, según el soporte de Apple.
3. **Qué día es cada noche:** el de cuando te despertás, en la hora local, y el
   día cambia a las 18:
   - una siesta de la tarde es de ese día;
   - lo que termina a la noche ya es del siguiente.

   Es la regla de Fitbit y encaja con la de Moss (las fechas en la hora local del momento).
4. **Episodios, sueño partido y siestas:**
   - lo dormido separado por una hora o menos es un episodio, y el más largo es el principal (18/11/2026: te despiertas a
     las 6:22 y vuelves a dormirte a las 6:30, es una noche de tu primer dormirte a tu último despertar, con esos 8 minutos
     despierto; `HUECO_DE_LA_MISMA_NOCHE`);
   - con más de una hora despierto, lo que sigue es otra cosa (una siesta), salvo el sueño partido: dos episodios de 3 horas o
     más son una noche (hasta el 18/11 también se pegaban los que empezaban o terminaban a 2 horas del principal);
   - de las fuentes que registraron el mismo sueño, la noche es de una que lo tenga casi entero (dos tercios o más de lo que
     registró la que más): antes, otra app con etapas que solo vio el segundo tramo se quedaba con la noche (6:22 a 8:30). Un
     tramo que registró otra fuente, pegado a la noche (a una hora o menos) y sin encimarse, también es la noche. Lo de cada
     fuente se suma con todos sus tramos (23/11/2026, spec/bugs.md 7): la noche partida del reloj (23:00 a 2:30 y 4:00 a
     7:00) ya no pierde contra otra app que la tiene de corrido;
   - lo que dura menos de 3 horas y termina entre las 12 y las 24 es una siesta aunque sea lo único del día en Salud: no es
     la noche (23/11/2026, spec/bugs.md 6: con el anillo cargando de noche, una siesta de 40 minutos se volvía la noche y le
     ganaba a la de Moss). Ese día queda la noche de Moss; la siesta de ese día todavía no suma a la deuda;
   - lo demás, desde 15 minutos, son siestas: cuentan para la deuda, no para el horario.
5. **En cama** se muestra solo si alguna fuente lo escribió de verdad, y si es del
   teléfono va con confianza baja. Nunca cuenta como sueño.
6. **La noche que falta** queda en gris, «sin datos»:
   - no es un cero, no se rellena y no entra en los promedios ni en la deuda;
   - si solo está el «en cama» del iPhone, se muestra aparte y no cuenta para nada;
   - los hábitos de sueño de ese día quedan pendientes y se pueden marcar a mano;
   - con un reloj o un anillo, mientras su noche no llega a Salud, se muestra la estimada con el teléfono y de cuál
     aparato se espera (`aparatoQueFalta`); al llegar, gana la del aparato. Lo pediste el 21/11/2026 («siempre debería
     tener información»): Da Rings la escribe recién al sincronizar su app, y antes Moss esperaba hasta las 14 sin nada.
7. **La noche cortada** se pregunta: menos de la mitad de lo que solés dormir y
   despertarte más de dos horas antes que siempre. ¿Se quedó sin batería? Se
   puede dejar fuera; no se descarta sola.
8. **La hora:**
   - las duraciones salen de los instantes, y las horas, de la zona de cada muestra;
   - de viaje, la noche es del día en que te despertás en esa zona;
   - un cambio de zona de más de una hora cuenta en los totales, pero no en el horario ni en la regularidad;
   - quien trabaja de noche puede apagar el horario.
9. **Lo mínimo para cada cosa:**

   | Qué | Desde |
   |---|---|
   | La calidad | la primera noche |
   | El horario dentro de la calidad | 5 noches anteriores |
   | La deuda | 5 noches de 14 |
   | La regularidad | 8 de 14 |
   | Lo tuyo (frecuencia, variabilidad, respiración) | 7 noches |
   | El fin de semana | 2 noches de viernes y sábado y 4 de entre semana |

10. **Leer:**
    - con consultas ancladas al abrir Moss, que traen también lo editado y lo borrado;
    - se rehacen las últimas 14 noches, como los días de las últimas dos semanas;
    - si no vuelve nada, se dice «revisá que Moss pueda leer el sueño en Salud».

## Las cuentas

- **Lo que necesitás dormir** (`necesidad` y `rangoDeNecesidad`):
  - 8 horas, las mismas de la recuperación de Ascent;
  - 7 y media desde los 65;
  - antes de los 18, 9 (desde el 5/11: Moss es desde los 16, y les daba 8, el borde
    de abajo de lo recomendado);
  - se elige en «Necesito dormir», de media hora en media hora, dentro de lo de tu
    edad: de 7 a 9, y de 8 a 10 antes de los 18 (`necesidadesPara`). Queda en el
    teléfono, como «Tardo en dormirme» (`necesidad` del almacén, `ponerNecesidad`);
    los avisos, el widget, la línea de la comida y Sueño ya la usan (`suenoParaAvisos`
    y `suenoDe`, en `persona.ts`, desde el 5/11). La pantalla, en Perfil › Avisos, está en la
    galería para aprobar (5/11): «Lo de tu edad (8 h)» o de 7 a 9 horas;
  - **a la vista y editable en la tarjeta de la deuda** (17/11): sigue en 8 h de
    fábrica (lo decidiste así), pero «Necesitas 8 h» se toca y se cambia ahí, porque
    media hora de necesidad son más de 3 horas de deuda;
  - **Moss propone ajustarla** (`necesidadPropuesta`, 17/11) y nunca la cambia sola:
    el percentil 75 de lo que dormiste las noches medidas de las últimas 4 semanas
    (14 noches como mínimo), a la media hora, y solo si difiere media hora o más
    de la que tienes y cae dentro de lo de tu edad: fuera de eso no propone nada (a
    quien duerme 5 h 30 no se le dice que necesita 7). **Es una convención, no un
    método validado**: no hay ninguno para medir en casa cuánto necesita dormir
    alguien. El promedio se queda corto si hay deuda y las noches libres exageran
    (el rebote); el percentil 75 queda entre los dos
    ([`estudio/deuda-y-melatonina.md`](estudio/deuda-y-melatonina.md), 2.3). **Ojo:**
    quien la acepta queda casi siempre con deuda baja, porque la necesidad pasa a
    salir de lo que duerme. Queda para después lo que ese informe pide de más:
    preferir las noches libres desde la segunda seguida, y sin reloj proponer solo
    con la mitad de las noches confirmadas.

  Las guías: la AASM y la SRS piden 7 horas o más de 18 a 60 años (más de 9 puede
  ser apropiado para jóvenes, quien se recupera de una deuda o está enfermo); la
  National Sleep Foundation, de 7 a 9, y de 7 a 8 desde los 65; la AASM pediátrica
  (Paruthi 2016), de 8 a 10 de los 13 a los 18. La necesidad cambia de una persona
  a otra (Kitamura 2016: de 7,3 a 9,3 h en el laboratorio): por eso se elige.
- **La calidad** (`calidadDeNoche`), de 0 a 100, en tres partes, como el puntaje
  de Apple (duración 50, horario 30, interrupciones 20), que no se puede leer:
  - **Duración (50):** 50 · (dormido − 4 h) / (necesidad − 4 h), entre 0 y 50.
  - **Horario (30):** d es el promedio de cuánto se corrieron la hora de dormirte
    y la de despertarte de las medianas de las noches anteriores. Da 30 · (90 − d) / 60:
    todo hasta media hora y nada desde hora y media. Es una convención con la idea
    de Huang y otros (2020), que midió otra cosa: el desvío de la hora de dormirse
    en 7 días de actigrafía, y con más de 90 minutos contra 30 o menos, el doble de
    eventos cardiovasculares (HR 2,11), no el corrimiento de una noche.
  - **Continuidad (20):** 10 · (60 − minutos despierto) / 40 más 10 · (4 −
    despertares) / 3, cada parte entre 0 y 10. Las guías de la National Sleep
    Foundation: como mucho un despertar y 20 minutos despierto.
  - **Si falta una parte** (el horario, sin 5 noches), el total se reescala y dice
    «parcial».
  - **No entran** las etapas, la latencia, la eficiencia, el corazón ni la
    variabilidad: el reloj las mide con menos acierto, y no hay consenso sobre
    cuánto deberían pesar.
  - **Palabras:** excelente desde 85, buena desde 70, regular desde 50 y baja
    debajo.
- **La deuda** (`deudaDeSueno`, rehecha el 17/11/2026: Moss te daba 16 h 30 y Rise
  4 h; el porqué, en [`estudio/auditoria-del-sueno.md`](estudio/auditoria-del-sueno.md),
  cómo lo hace Rise, en [`estudio/rise.md`](estudio/rise.md), y la evidencia, en
  [`estudio/deuda-y-melatonina.md`](estudio/deuda-y-melatonina.md)):
  - es lo que faltó para tu necesidad cada noche de las últimas 14, con las noches
    pesando e^(−i/7): anoche 1, la anterior 0,87, después 0,75, 0,65, 0,56, 0,49,
    0,42, 0,37, 0,32, 0,28, 0,24, 0,21, 0,18 y, hace 13 noches, 0,16. Suman 6,5. Son
    los pesos que publica Rise en su calculadora, y la constante de 7 noches es la
    del único modelo validado que la publica (7,0 ± 1,7 días, Ramakrishnan 2016).
    Antes era una rampa (1 a 1/14, 7,5 en total);
  - **lo que falta o sobra en una noche tiene topes** (`faltaDeLaNoche`,
    `TOPES_DE_UNA_NOCHE`): lo que sobra paga hasta 1 hora (antes, 2: con cama de
    sobra casi no se duerme más que eso por encima de lo que se necesita, Harrison
    y Horne 1996); lo que falta suma hasta 3 horas, y hasta 2 si la noche la estimó
    el teléfono y no la confirmaste (una de cada siete de esas tiene un borde errado
    en más de 2 horas, Sahha 2026). Los dos topes de lo que falta son una convención;
  - nunca baja de cero;
  - las siestas cuentan;
  - **las noches sin datos no cuentan como si hubieras dormido lo que necesitas**
    (desde el 5/11): es el promedio con pesos de las noches medidas, llevado a la
    suma de los pesos de las 14 (6,5). Las de confianza baja tampoco cuentan. Hacen
    falta 5 noches. Devuelve también lo que faltó y lo que dormiste por noche
    (`porNoche`, `duermes`), para decir «Duermes unas 7 h 10 · Necesitas 8 h»;
  - **cuánto da:** dormir 7 h necesitando 8 da 6 h 30 (antes 7 h 30); 6 h, 13 h;
    7 h 30, 3 h. Una noche de 4 h suma 3 h si fue anoche, 1 h 06 a la semana y media
    hora a las dos semanas. Durmiendo justo lo que necesitas, baja a la mitad en
    unas cuatro noches; con una hora de más, cuatro noches borran una falta de 1 h
    por noche (lo que vio Kitamura 2016);
  - **se dice a la media hora** (`redondearDeuda`): el número depende sobre todo
    de la necesidad supuesta (media hora de diferencia la cambia en más de 3
    horas), y «4 h 32 min» es precisión falsa. Menos de 15 minutos, sin deuda;
  - **en una palabra, al lado del número** (`juicioDeLaDeuda`, lo decidiste el
    17/11/2026), por el número como se dice: «Sin deuda» en 0, «Baja» con menos de
    5 h, «Media» de 5 a 10 y «Alta» desde 10. Son los tramos de Rise, que busca
    menos de 5 h: no hay un corte clínico, es una convención. Antes eran «Muy bien»,
    «Bien», «Algo alta» y «Alta», por lo que faltaba cada noche, con «Alta» desde
    una hora: con 8 h justas de teléfono quieto ya decía «Alta». La energía la usa
    igual: con deuda media o alta, el sueño queda «justo» (`suenoParaLaEnergia`);
  - **esta noche:** debajo de la deuda, con la noche de hoy elegida, «Acuéstate a
    las…»: para despertarte a la hora de siempre habiendo dormido lo que necesitas,
    con la deuda un poco más (`horasDeSueno`, la misma cuenta del aviso de dormir),
    menos tu margen para dormirte; y la última comida grande, 2 h antes (3 con
    reflujo, de Cuidados). Si el tope de una hora antes de lo de siempre no deja
    dormir todo, lo dice.

  Que se acumule tiene base (Van Dongen 2003: el déficit crece casi en línea recta,
  y casi no se nota); que se pague hora por hora, no (Banks 2010, Depner 2019). Lo
  que paga la hora de dormir (un tercio, hasta 30 minutos) es una convención: en el
  laboratorio, una falta de cerca de una hora por noche se recuperó en unas cuatro
  noches con 12 h en la cama (Kitamura y otros, 2016). Ni con reloj se conoce la
  deuda a menos de ±3 h; solo con el teléfono, ±4 h: por eso la palabra va en tramos
  anchos y el número, a la media hora.
- **Poco sueño por semanas** (`pocoSuenoSostenido`): con 10 noches medidas de 14 y
  menos de 6 horas de promedio, sugiere hablarlo con un médico. Antes de los 18,
  menos de 7 (una convención: a esa edad se recomiendan de 8 a 10), con su texto
  (`sueno.pocoSueno.textoMenor`); para eso, Sueño le tiene que pasar la edad.
- **El horario y la regularidad** (`horario`):
  - el promedio y el desvío estándar de la hora de dormirte y de despertarte en las dos semanas;
  - hasta 30 minutos es muy regular; hasta 60, regular; hasta 90, irregular; más, muy irregular (las categorías de Huang 2020, para el desvío de 7 días);
  - el fin de semana compara la mitad del sueño de las noches que terminan sábado y domingo con las de lunes a viernes, y dice que supone que esos días no trabajás;
  - **con la mitad o más de las noches sin reloj** (de Moss), es aproximada
    (`aprox`, y el texto lo dice): el error de cada noche estimada suma al desvío
    (desvío² ≈ el de verdad² + error², Fischer 2021: con 30 a 35 minutos de error,
    ±20 de verdad se ven como ±36 a 40). Se resta el error de cada una (de su
    rango), y no dice «irregular» ni «muy irregular» salvo que pase de 90 minutos
    aun así.

  El índice de regularidad (SRI, Phillips y otros, 2017) predice mejor la
  mortalidad que la duración (Windred y otros, 2024, en UK Biobank), pero
  necesita días seguidos, es sensible a las siestas, y dos calculadoras comunes
  dan valores muy distintos con los mismos datos (Czeisler y otros, 2026). Queda
  para después, sin compararlo con nadie.
- **Lo del reloj** (`vitalDeNoche`):
  - el promedio de lo medido mientras dormías, de la misma fuente;
  - hace falta una lectura de frecuencia cada media hora, y dos de variabilidad y de respiración;
  - se compara con la mediana de tus últimas 28 noches (al menos 7) y se dice solo «lo usual», «más» o «menos»: más de 3 lpm, un 15 % de variabilidad o 1 respiración por minuto;
  - nunca se mezclan SDNN y RMSSD;
  - la frecuencia en reposo de Salud es del día entero, y lo dice.

## Tu periodo de melatonina y la deuda con su palabra (aprobado el 17/11/2026 en la galería 50, y en la app)

Lo pediste el 17/11, al rehacer el sueño: en lugar de «Esta noche, a la cama a las…», tu periodo de melatonina, como
la ventana de Rise pero con palabras propias. La evidencia está en
[`estudio/deuda-y-melatonina.md`](estudio/deuda-y-melatonina.md), sección 3.

- **La regla** está en `src/dominio/melatonina.ts`, con sus tests. La usan la galería y la app
  (`src/secciones/sueno/Periodo.tsx`), con tus noches de verdad y tu margen para dormirte.
  - Con las noches de los últimos 7 días (hacen falta 3), el inicio estimado de la melatonina es el punto medio
    del sueño menos 6 h 30, y el periodo va de ese inicio + 2 h a + 3 h.
  - Dice cuánto cambió desde ayer («9 min antes que ayer», «7 min más tarde que ayer»).
  - La hora de acostarte es el comienzo del periodo menos tu margen para dormirte (15 min de fábrica, el de
    `sinReloj.ts`), de a 5 minutos. Con deuda es la misma, y el texto dice que antes no: acostarse mucho antes
    cuesta dormirse.
  - Las noches estimadas con poca confianza en el horario no entran. Sin noches suficientes, nada.
  - **Convenciones**, que no salen de un estudio: que dure una hora; que alcancen 3 noches (el informe proponía
    5); y decirlo al minuto, como lo pediste, aunque el informe aconseja no dar una hora exacta.
  - **El margen honesto es de ±1 h**: lo dice la hoja «¿Qué es?».
- **En la app y en la galería** (escenario `melatonina`, `galeria/src/periodo.js` y `sueno.js`; en la app,
  `src/secciones/sueno/Deuda.tsx` y `Periodo.tsx`):
  - **La deuda**: el número de una («4 h»; «Sin deuda» en 0), la palabra a la derecha en una pastilla (Baja,
    Media o Alta), «Duermes unas 7 h 10 · Necesitas 8 h» con lo que necesitas cambiado ahí mismo, lo que Moss
    propone y, solo con el teléfono, «Estimada con tu teléfono. Con un reloj o un anillo es más precisa.», que
    lleva a Perfil › Aparatos, con la guía arriba. Sin el medidor y sin la frase de «puede que no lo notes».
  - **La tarjeta del periodo**, debajo de la deuda y solo con la noche de hoy: «22:57 – 23:57», cuánto cambió
    desde ayer, la noche en una línea (la melatonina que sube y el tramo del periodo, que crece al aparecer) y
    «Acuéstate a las 22:40 para estar dormido dentro de tu periodo»; con deuda, «…cuando empieza tu periodo.
    Antes no: te costaría dormirte». Con menos de 3 noches en la semana, cuántas faltan; sin noches, el de la
    persona de ejemplo, con su chip y sin deuda.
  - **«¿Qué es?»**: una hoja con el dibujo de la noche (la curva se traza y el tramo entra después) y cinco
    partes cortas: qué es, cómo lo calcula Moss (con el punto medio de tu semana y con cuántas noches), con qué
    margen y qué pasa si te acuestas antes o después. Se baja con el dedo, como las demás hojas.
  - **«Más»** de la deuda conserva la última comida grande, ahora contada desde esa hora de acostarte.
  - **En Afinar**, el margen para dormirte.
- **Lo que queda de las cuentas:** la hora de acostarte de Sueño sale del periodo (`acostarse`, en
  `melatonina.ts`). Que los avisos de la noche digan esa misma hora es de los avisos (`spec/avisos.md`).
- **Para decidir:**
  - En 0, la tarjeta dice «Sin deuda» en grande y sin pastilla. La alternativa es «0 h» con la pastilla «Sin
    deuda».
  - Si el periodo se muestra más ancho o no se muestra con horarios muy irregulares (el informe lo sugiere con
    más de 90 min de desvío): hoy se muestra siempre que haya 3 noches.

## Lo que tienes en la cabeza y «Lo que hay que hacer hoy» (aprobado el 17/11/2026 en la galería 50, y en la app)

Anotar los pendientes antes de acostarte, para sacártelos de la cabeza, y encontrarlos por la mañana. Los avisos
(el de la noche, que abre la nota, y el de la mañana, con la lista) están en `spec/avisos.md`, «Lo que hay que hacer
hoy»; acá, las pantallas.

- **La regla** está en `src/dominio/pendientes.ts`, con sus tests:
  - cada pendiente lleva su texto, si está hecho y **para qué día es**: lo que se anota es para el día que sigue al
    de Moss, así que lo anotado a la noche es para mañana y lo anotado de madrugada, antes del corte, también;
  - es una lista corta: hasta 6 por día, de hasta 60 letras cada uno;
  - los de hace más de 7 días se olvidan.
- **Quedan en el teléfono**, como un ajuste del almacén (`estado.pendientes`, con `ponerPendiente`,
  `quitarPendiente` y `marcarPendiente`): no suben a la cuenta ni tienen tabla en Supabase.
- **Un solo interruptor**, apagado de fábrica: el aviso «Anotar lo que tienes en la cabeza» (Perfil › Avisos).
  Con él activado se ven la fila de Sueño y la lista de Inicio.
- **En Sueño** (`src/secciones/sueno/Pendientes.tsx`), debajo de tu periodo de melatonina, la fila «Lo que tienes
  en la cabeza» con cuántos hay para mañana. Abre la nota:
  - se escriben de a uno: «Listo» en el teclado (o el «+») anota lo escrito y deja el campo para el próximo; sin
    nada escrito, baja el teclado. El campo va en el pie de la hoja, que sube con el teclado: siempre a la vista;
  - cada uno se quita con su cruz; el que entra y el que se va lo hacen con un fundido, y la hoja acompaña el alto;
  - con los 6, el campo se apaga y dice «Hasta 6: es una lista corta.»;
  - «Listo» cierra y, si quedó algo escrito sin agregar, lo anota. Cerrar de otra forma (la cruz, tocar afuera o
    bajar la hoja) con algo escrito pregunta antes de descartarlo, como las demás hojas;
  - el aviso de la noche la abre desde afuera con `abrirLaNota()`.
- **En Inicio** (`src/secciones/inicio/Pendientes.tsx`), arriba de «Para hoy», «Lo que hay que hacer hoy»: los
  de hoy, para ir tachando. Tocar uno lo tacha (el círculo se llena y la raya crece sobre el texto); tocarlo otra
  vez lo deja como estaba. Sin pendientes para hoy, no ocupa lugar. Si «Para hoy» no está a la vista (el primer
  día, sin nada anotado, o sacado en Personalizar), la lista va sola en su bloque: el aviso de la mañana lleva a
  Inicio y tiene que estar.

## Qué tan confiable es cada dato

| Dato | Confianza | Por qué |
|---|---|---|
| Cuánto dormiste, cuándo te dormiste y te despertaste | confiable | todos los estudios encuentran más del 95 % del sueño; el Series 8 da 8 minutos de más en sanos |
| Despertares y minutos despierto | aproximada | encuentra solo del 26 al 57 % de lo despierto |
| Frecuencia cardíaca y respiración de noche | aproximada | la frecuencia coincide muy bien con el electrocardiograma (ICC 0,96) |
| Etapas | estimación | acierta el 83 % del núcleo, el 69 % del REM y el 51 % del profundo; en apnea, el profundo da 25 minutos de menos (Schyvens, 2025) |
| Variabilidad | estimación | solo moderada (ICC 0,67), y con menos de 3 lecturas, baja |
| La noche estimada por Moss, sin reloj | estimación, con su confianza | del 46 al 66 % de las noches con los dos bordes dentro de una hora; confirmada, como un diario (79 a 86 %). Ver «Sin reloj» |
| En cama, del iPhone (hasta iOS 17) | estimación | es el uso del teléfono |

La AASM dice que estos aparatos no sirven para diagnosticar. La National Sleep
Foundation pide explicar los métodos y sus límites, y avisa del riesgo de
obsesionarse con los números («ortosomnia»): por eso la calidad va con su
explicación y sin rojos.

## Sin reloj: el sueño con el iPhone solo (22/10/2026)

Lo pediste así: que Moss sea muy confiable para saber cuánto dormiste sin anillo
ni reloj. Lo investigué a fondo; las fuentes están al final de esta parte.

### Lo que cambió: Salud ya no tiene nada sin reloj

- **El iPhone dejó de anotar «en cama» con iOS 18** (y el reloj con watchOS 11).
  Un ingeniero de Apple: «We stopped recording the inBed samples … because the
  samples are not quite as accurate as what we'd like them to be» [1][2][3].
  Desde entonces, sin reloj ni anillo, Salud no tiene nada automático. Lo de iOS
  14 a 17 sigue en el historial.
- **Ningún método que usa el teléfono se validó contra polisomnografía.** Todos
  se comparan con un diario, con actigrafía o con un reloj.
- **iOS no deja saber cuándo se bloqueó o se desbloqueó el teléfono** si la app
  no está abierta. No hay forma pública [17][18].

Así que, sin reloj, la estimación la arma Moss.

### Los métodos

| Método | Qué tan preciso (estudios) | Batería | Privacidad | Para la persona | ¿Apple lo deja? |
|---|---|---|---|---|---|
| **El último uso de la noche y el primero de la mañana** | Contra un diario, ±31 a ±49 min [63][64]. Contra un reloj o actigrafía: error típico de 20 a 24 min en cada borde, y el 65,6 % de las noches con los dos bordes dentro de ±60 min (105.826 noches, sin revisión de pares) [72][73] | Nada | Baja | Nada | **En parte:** no hay eventos de bloqueo con la app dormida; sí los eventos de Moss |
| **El historial de movimiento** (`CMMotionActivityManager`) | Sin validación independiente; Rise dice «cerca del 80 %» sin decir contra qué [43][44] | Casi nada | Permiso de Movimiento | Un permiso | **Sí**: 7 días, con quieto, caminando, en auto y su confianza [9][10] |
| **Los pasos** (`CMPedometer`) | Solos: el 46,4 % de las noches dentro de ±60 min; el contador es el que «lleva» la estimación [73] | Casi nada | Ídem | Nada | **Sí**: 7 días [11] |
| **El micrófono toda la noche** (Sleep Cycle, SnoreLab) | Sleep Cycle contra polisomnografía: 104 min de menos [48]; «no es confiable» [47] | Unos 30 % por noche [46] | Alta (el audio del dormitorio) | Iniciarlo cada noche, con cargador | **Sí**, con el modo de fondo de audio [33][34] |
| **El sonar** (SleepScore) | κ 0,21; vigilia: sensibilidad 0,37 [53] | Pide cargador | Alta | El teléfono a un brazo, apuntando al pecho | Sí |
| **El teléfono en el colchón** | Sin correlación con polisomnografía [49]; κ 0,07 [53] | Unos 30 % | Baja | Iniciarlo cada noche | **Difícil**: la app tiene que estar viva toda la noche [35][36] |
| **El Tiempo de uso** (DeviceActivity) | Sin validación; es el primer método, por bloques | Casi nada | El sistema no da nombres de apps | Face ID | **Con un permiso especial** de Apple (Family Controls), que tarda de días a semanas [24][25] |
| **Rutinas** (el Focus de Sueño, el cargador, la alarma) | Sin validación | Nada | Baja | Configurar un Atajo | **Sí** [29][30] |
| **La confirmación de la mañana** | Un diario contra actigrafía: el 79 % y el 86 % de los bordes dentro de ±1 h [78]; cuenta 20 a 30 min de más [77] | Nada | Mínima | Un toque | **Sí** |

### Lo que hace Moss (sin permisos especiales)

**De noche solo se guarda la hora de un Atajo o del despertador de Moss**
([`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md)). Al abrir Moss a la mañana,
arma la noche con lo que el teléfono guardó:

1. **Los pasos**, en bloques de 5 minutos, de las últimas 36 horas.
2. **El movimiento**: caminar o ir en auto es estar despierto; un movimiento corto
   de madrugada es alguien que tocó el teléfono. Hace falta un módulo nativo
   propio (`modules/movimiento`).
3. **Los eventos de Moss**: abrirla, cerrarla, registrar algo. Son anclas exactas
   de que estabas despierto.
4. **Opcional, «Afinar»**: un Atajo que avisa a Moss cuando prendés el Focus de
   Sueño, conectás el cargador o parás la alarma.

**Las cuentas, rehechas el 17/11/2026** (lo decidiste así, para que el número de
la deuda sea creíble): **como Rise, cuenta como sueño todo el rato que el teléfono
estuvo quieto, menos un margen para dormirte**. Hasta ese día, Moss le restaba a
cada noche 79 minutos fijos (31 hasta dormirte, 18 antes de agarrar el teléfono y
30 despierto adentro), que solos eran 9 h 53 de deuda para cualquiera; cortaba la
noche en el primer toque de la mañana, y a las noches más largas que lo de siempre
les creía como mucho 47 minutos. El diagnóstico, con los casos simulados, está en
[`estudio/auditoria-del-sueno.md`](estudio/auditoria-del-sueno.md); cómo lo hace
Rise, en [`estudio/rise.md`](estudio/rise.md); y la evidencia, en
[`estudio/deuda-y-melatonina.md`](estudio/deuda-y-melatonina.md) (sección 4).

- **La ventana tranquila:** el hueco de 5 a 12 horas sin actividad que empieza
  entre las 18 y las 4; si hay dos (el teléfono quedó en la mesa toda la tarde),
  el que más se parece a lo de siempre, y pesan las señales: empezar con el
  cargador o un aviso, o terminar con ellos.
- **Cuándo te dormiste:** lo último que hiciste con el teléfono **más tu margen
  para dormirte**, y nada más.
  - El margen son **15 minutos de fábrica** y se elige en Sueño › Afinar: 0, 15,
    30, 45 o 60 (`MARGEN`, `MARGENES`, `margenParaDormirte`), con su texto: «Si
    sueles dejar el teléfono un rato antes de dormirte, sube este margen». Es el
    mismo ajuste de «Tardo en dormirme» de Perfil › Avisos (`latencia` en el
    almacén): lo elegido antes (5, 10, 20 o 90 minutos) vale como el más cercano
    de los de ahora. Rise le dice «buffer» y en su captura muestra 30; para anotar
    a mano sugiere restar unos 20, y de intentar dormir a dormirse pasan unos 17
    minutos por polisomnografía (Silva 2007). El número de fábrica es una
    convención.
  - **Cambiar el margen vuelve a armar** las noches estimadas y sin confirmar de
    las últimas cuatro semanas (`ponerLatencia`, con `sinLasRestas`): la deuda
    cambia en el momento.
  - **Moss ya no aprende lo que tardas** de tus respuestas (era D33): un «Sí» le
    enseñaba lo que ya suponía, y los 31 minutos se confirmaban solos. Si lo que
    corriges enseña algo, se puede volver a sumar; hoy el margen es el que eliges.
  - **Tu hora de siempre ya no mueve la hora**: antes tiraba de los dos bordes, y
    recortaba las noches largas. Dejar el teléfono tres horas antes cuenta desde
    ahí (lo que Rise dice de sí mismo: cuenta de más cuando estás quieto y
    despierto): para eso está el margen, y Moss pregunta (abajo, la confianza).
  - **El cargador** conectado de noche, con hasta 20 minutos de uso después, afirma
    que te acostaste. **Si seguiste usando el teléfono más que eso, no cuenta** y
    manda lo último que hiciste. «Me voy a dormir» o el Focus prendido a mano son lo
    último del día, y nunca una interrupción.
- **Cuándo te despertaste: con la actividad que sigue.** Ya no se restan los 18
  minutos.
  - **Tocar el teléfono y que vuelva a quedar quieto no termina la noche** (apagar
    la alarma, mirar la hora): es una interrupción si dura hasta 20 minutos y el
    teléfono quedó quieto 45 minutos antes y 45 después (`SUELTO`). Antes hacían
    falta 90 de cada lado: apagar la alarma a las 7:30 y dormir hasta las 8:30
    cortaba la noche a las 7:12, con confianza alta.
  - **Si en ese rato te levantaste** (diste pasos, ibas caminando, abriste Moss),
    hace falta hora y media quieta después, como antes: quien se levanta y deja el
    teléfono en la mesa mientras desayuna no sigue durmiendo.
  - **Vale desde una hora después de tu hora de siempre de dormirte** (sin
    historia, desde la 1:30) y a hora y media o más de haber dejado el teléfono.
    Antes de eso, mirarlo es lo último del día: si no, quien deja el teléfono lejos
    toda la tarde y lo mira antes de acostarse quedaba dormido desde la tarde.
  - **La alarma, el despertador de Moss o el Focus apagado a mano** son la hora si
    son esa actividad que sigue; si después el teléfono quedó quieto 45 minutos o
    más, te volviste a dormir y son una interrupción. «Me desperté» lo dijiste tú:
    vale aunque después dejes el teléfono, hasta hora y media.
  - **Sin ventana** (ningún hueco de 5 horas): de la última actividad antes de las
    2 a la primera después de las 4 **tras la que el teléfono ya no vuelve a quedar
    quieto hora y media**, con confianza baja: no cuenta hasta que la confirmes.
    Antes tomaba la primera después de las 4, aunque quedaran cuatro horas quietas.
  - Los minutos de estas reglas (45, 90, la hora después de lo de siempre) son una
    convención, a calibrar con la prueba de abajo.
- **Dice por qué:** `pistas` lleva la señal de cada borde con su hora (ya no hay
  pesos: es una por borde, y el cargador la afirma), y «Cómo llegó Moss a esta
  hora» dice tu margen.
- **Sin armar nada**, las anclas exactas son el despertador de Moss y «Me voy a
  dormir» en el aviso de la noche; los Atajos quedan como opcionales.
- **Los despertares de la noche** quedan marcados como interrupciones, sin decir
  cuánto: el teléfono lo mide mal (48,8 minutos de error) [72].
- **Lo despierto que el teléfono no ve ya no se resta** (17/11): del 5/11 al
  17/11 se restaban 30 minutos fijos a cada noche de Moss (`DESPIERTO_SIN_RELOJ`),
  también a la hora que la persona escribía: 3 h 45 de deuda para todos. Rise no
  lo resta (si te despiertas y no tocas el teléfono, no se ve). Queda solo lo
  tuyo: si tuviste 7 noches o más con un reloj o un anillo, a las noches de Moss
  se les descuenta su mediana de lo despierto más 15, lo que el reloj ve de menos
  (`despiertoDeLaNoche`), para que se parezcan a las medidas. La hora de acostarte
  tampoco suma ya esa media hora sin reloj.
- **El rango que se muestra** («entre 23:50 y 00:40») es el del 80 % del modelo:
  ±1,28 veces la duda de la señal de ese borde (35 minutos el teléfono, 28 con el
  cargador, 20 con «Me voy a dormir»; 30 a la mañana, 20 al desconectar; `DUDA`),
  que crece con el rato quieto de más (dejarlo antes de tu hora, agarrarlo
  después), por 1,5 si hay de lo que más hace errar en él (dejarlo antes, agarrarlo
  tarde, usarlo de noche, sin ventana), y ±10 minutos con un ancla exacta; nunca
  antes de la última actividad ni después de la primera. Con solo el teléfono son
  ±45 al dormirte y ±38 al despertarte. El margen del rango se guarda con la noche,
  para calibrarlo (queda en el teléfono: la cuenta no lo guarda); sin él, el de su
  confianza (alta ±40/35, media ±50/45, baja ±75/65).
- **La confianza** (una propuesta, para calibrar con la prueba de abajo): parte de
  0,85 y baja sin historia (−0,15), sin pasos ni movimiento (−0,2) y por cada uso
  de noche (−0,08, hasta tres). Un ancla de despertar suma 0,1, y una de dormir al
  empezar el hueco, 0,05; el cargador al empezar o desconectarlo al terminar, 0,05,
  y conectarlo y seguir usándolo resta 0,05. Sin hueco, como mucho 0,4.
  - **Que la noche sea más larga o distinta de lo de siempre** (dejaste el teléfono
    más de una hora antes, hasta −0,3; lo agarraste más de una hora después, hasta
    −0,3; dura dos horas más o menos, −0,1) **baja la confianza hasta media, nunca
    a baja**: Moss pregunta, pero la noche cuenta. Antes, las largas eran las que
    más quedaban fuera de la deuda.
  - Las cuentas están en `src/dominio/sinReloj.ts`, con sus tests, que incluyen los
    casos de la auditoría.
- **Las siestas** no se estiman.

**Los casos de la auditoría, antes y ahora** (alguien que duerme de 00:45 a 8:30,
con 8 h de necesidad y 14 noches iguales):

| Caso | Antes: dormido y deuda | Ahora: dormido y deuda |
|---|---|---|
| (a) Lo deja a las 00:30 y lo agarra a las 8:30 | 6 h 41 · 9 h 53, «Alta» | 7 h 45 · 1 h 30, «Baja» |
| (b) Igual, y mira la hora a las 5:10 | 6 h 41 · 9 h 53 | 7 h 45 · 1 h 30, con una interrupción |
| (c) Lo usa en la cama hasta las 00:43 | 6 h 28 · 11 h 30 | 7 h 32 · 3 h, «Baja» |
| (d1) Apaga la alarma a las 7:30 y duerme hasta las 8:30 | 5 h 41 · 17 h 23 | 7 h 45 · 1 h 30 |
| (d2) Igual, con el despertador de Moss o el atajo | 5 h 59 · 15 h 08 | 7 h 45 · 1 h 30 |
| (d3) Pospone a las 7:30, 7:39 y 7:48 y se levanta a las 8:00 | 5 h 41 · 17 h 23 | 6 h 45 · 8 h, «Media» |
| (e) Lo deja cargando en otro cuarto a las 23:15 y lo agarra a las 9:00 | 8 h 26 · sin deuda | 9 h 30 · sin deuda |
| (g) Dos toques, a las 3:00 y a las 3:50 | sin ventana: no contaba | 7 h 45, con dos interrupciones y confianza media |
| (j) 25 minutos de teléfono a las 4:00 | de 01:01 a 03:42, 2 h 11 | de 00:45 a 8:30, con confianza baja: no cuenta hasta confirmarla |

Lo que sigue pendiente de la auditoría (su sección 7): los dos toques a menos de
hora y media de dejar el teléfono (h), los pasos que escriben otras fuentes (o, p),
el movimiento sin clasificar (q), que con confianza baja no haya «Sí» de un toque,
anotar las siestas y guardar las señales de cada noche. El caso (e) sigue contando
de más: es el límite del método, el mismo de Rise, y para eso está el margen.

**Rehacer las noches guardadas** (`rehacerLasNoches`, en `src/salud/nocheSinReloj.ts`):
la primera vez que corre esta versión, una sola vez en cada teléfono (la marca
`suenoRehecho` de los ajustes), vuelve a armar las noches estimadas de las últimas
cuatro semanas, para que la deuda cambie ese mismo día:
- las de los últimos seis días, **con sus señales** (el movimiento, que iOS guarda
  siete días, y los pasos de Salud): así se arregla también la mañana cortada;
- las demás, y las que ya no tienen pasos ni movimiento, con su ventana guardada:
  todo el rato quieto menos el margen (`sinLasRestas`). Sin la ventana (las noches
  de las primeras versiones), deshace los 31 y los 18 minutos de fábrica y deja la
  ventana guardada: hecho otra vez en otro teléfono de la cuenta, da lo mismo;
- **también las que aceptaste con «Sí» tal como Moss las propuso**
  (`aceptadaSinCambios`: confirmadas con las mismas horas que lo estimado). El «Sí»
  aceptaba una propuesta que ya traía los 31 y los 18 minutos de antes, así que no
  es una medición tuya: se rehacen igual y **vuelven a ser estimadas** (en la
  deuda suman hasta 2 h, y si eran poco seguras no cuentan hasta confirmarlas). Un
  «Sí» a una propuesta que ya es de la regla nueva (las horas de su ventana) queda
  confirmado;
- **lo que corregiste o escribiste no se toca**: son tus horas. A esas solo se les
  va la media hora despierto, que se restaba al leerlas.

Cambiar el margen después (`ponerLatencia`) vuelve a armar solo las estimadas: lo
que confirmes con la regla nueva ya no se mueve.

**Qué tan bien anda, esperable:** entre el 46 % (solo los pasos) y el 66 % de
las noches con los dos bordes dentro de una hora [73]. Con la confirmación de la
mañana cuando la confianza no es alta, la meta es la de un diario: 79 a 86 %
[78].

**Para más adelante:**
- **Family Controls** (pedirle a Apple el permiso): con avisos de uso de 15
  minutos de noche, ataca justo las tres causas de los errores grandes (usar el
  teléfono de noche, dejarlo mucho antes y agarrarlo mucho después: el 74 %)
  [20][21][73]. Ver D26.
- **El micrófono, no:** errores de 104 minutos [48], 30 % de batería [46] y la
  pareja o el perro lo confunden [54][58].

### Aprender de cada persona

- **Lo de siempre:** la hora de dormirte y de despertarte de las últimas 14
  noches, aparte entre semana y fin de semana [64][73]. Desde el 17/11/2026 ya no
  mueve las horas de la noche: sirve para elegir entre dos huecos, para saber desde
  cuándo un toque es una interrupción y para la confianza.
- **El margen para dormirte** lo eliges tú (Sueño › Afinar, o «Tardo en dormirme»
  en Perfil › Avisos: es el mismo ajuste), y la ventana tranquila de cada noche se
  guarda con lo estimado y sube a la cuenta, así que la noche se puede volver a
  armar con otro margen.
- **Lo que se dejó de aprender (17/11):** hasta ese día, Moss aprendía de cada
  «¿Dormiste de… a…?» lo que tardabas en dormirte y en agarrar el teléfono
  (`aprenderPersonal`, D33), encogido hacia los 31 y 18 minutos de Sahha. Un «Sí»
  enseñaba lo que Moss ya suponía y además lo hacía fiarse más. Los modelos
  personales le ganan a los generales (91,8 contra 87,6 % [66]) y el sesgo de cada
  persona es estable (Massar 2021): volver a aprender, solo de las correcciones y
  desde los 15 minutos, queda para después.

### La confianza y la pregunta de la mañana

- **Cada noche estimada dice de dónde sale y qué tan segura es**, como Sahha
  [73]: «alta» si es probable (75 % o más) que los dos bordes estén dentro de una
  hora; «media» de 50 a 75 %; «baja» debajo. Con un rango: «entre 23:50 y 00:40».
- **La deuda y la regularidad son más firmes que una noche:** el punto medio de 7
  noches tiene un error de 13 minutos (r 0,91), contra r 0,77 de una sola [73].
- **«¿Dormiste de 00:30 a 08:10?»**, arriba en Sueño, junto con las cinco caras:
  - solo si la confianza es media o baja, la primera vez que abrís Moss ese día,
    nunca con una notificación aparte;
  - «Sí» la confirma; «Cambiar» abre las dos horas para correrlas;
  - una mañana por semana pregunta sin proponer, para medir cuánto se acepta lo
    propuesto sin mirarlo (no hay estudios de eso) [87].
- Lo que se confirma o se corrige queda en las noches propias, que sincronizan
  (`0005_noches.sql`).

### Con un reloj o un anillo

- **Una noche, una fuente:** el aparato con etapas, después otro aparato o app,
  después lo anotado a mano en Salud, y recién al final la estimación de Moss. El
  orden entre aparatos está en [`aparatos.md`](aparatos.md).
- **Nunca se suman fuentes** y nunca se rellena una con otra.
- **La estimación no se escribe en Salud** (guía 5.1.3(ii): nada inexacto en
  Salud) [38].
- **Una validación gratis:** en las noches con reloj, Moss estima en silencio con
  el teléfono y compara, con permiso [74].

### Cómo probarlo

1. **Lo técnico:** si `CMSensorRecorder` anda en los iPhone actuales (sería la
   mejor señal sin permisos; está sin confirmar [13][14]), el historial de
   movimiento con el teléfono en la mesa de luz y cuándo llegan los avisos del
   Atajo, en 3 o 4 modelos de iPhone.
2. **En sombra:** personas con Apple Watch u Oura, al menos 100 × 14 noches.
3. **Personas sin reloj:** al menos 40 × 14 noches, contra actigrafía y diario;
   con gente que usa el teléfono en la cama (25 %), que lo deja fuera del cuarto
   (15 %), que duerme acompañada (25 %) y de 50 o más (20 %).
4. **Qué se mide** [85]: sesgo, error absoluto, límites de acuerdo, el % dentro de
   ±30 y ±60 minutos, los errores de más de 2 horas, la cobertura y si «alta»
   acierta lo que promete.
5. **Las metas** (propuesta, de [73][77][78]):

| | Sin confirmar | Confirmada |
|---|---|---|
| Error típico de cada borde | 30 min al dormirte, 25 al despertar | — |
| Noches con los dos bordes en ±1 h | 60 % o más | 85 % o más |
| Errores de más de 2 h | 12 % o menos | — |
| Sesgo del sueño total | ±15 min | 20 min o menos |
| «Alta» dentro de ±1 h | 80 % o más | — |

Mientras no esté medido, Moss no publica ningún porcentaje de precisión (guía
1.4.1) [38].

### Fuentes de esta parte

1. Apple, foro: https://developer.apple.com/forums/thread/766977
2. https://developer.apple.com/forums/thread/761477
3. https://techissuestoday.com/ios-18-beta-removed-option-to-track-time-in-bed-with-iphone/
9. `queryActivityStarting`: https://developer.apple.com/documentation/coremotion/cmmotionactivitymanager/queryactivitystarting(from:to:to:withhandler:)
10. https://developer.apple.com/documentation/coremotion/cmmotionactivity
11. https://developer.apple.com/documentation/coremotion/cmpedometer/querypedometerdata(from:to:withhandler:)
13. `CMSensorRecorder`: https://developer.apple.com/documentation/coremotion/cmsensorrecorder/isaccelerometerrecordingavailable()
14. https://developer.apple.com/forums/thread/113845
17. https://developer.apple.com/forums/thread/69333
18. https://developer.apple.com/forums/thread/76608
20. https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter/monitoringerror/intervaltooshort
21. https://developer.apple.com/documentation/deviceactivity/deviceactivityevent/init(applications:categories:webdomains:threshold:includespastactivity:)
24. https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement
25. https://developer.apple.com/forums/thread/809190
29. https://developer.apple.com/documentation/appintents/setfocusfilterintent
30. https://support.apple.com/guide/shortcuts/apd932ff833f/ios
33. https://developer.apple.com/documentation/xcode/configuring-background-execution-modes
34. https://developer.apple.com/forums/thread/776949
35. https://developer.apple.com/forums/thread/826849
36. https://developer.apple.com/forums/thread/827920
38. Guías de revisión de Apple: https://developer.apple.com/app-store/review/guidelines/
43. https://help.risescience.com/hc/en-us/articles/4405262973591-RISE-Automatic-Phone-Motion
44. https://help.risescience.com/hc/en-us/articles/40624579537303-How-does-RISE-track-my-sleep
46. https://support.sleepcycle.com/hc/en-us/articles/206704539-Do-I-have-to-keep-the-charger-connected-all-night
47. https://pubmed.ncbi.nlm.nih.gov/31674096
48. https://pmc.ncbi.nlm.nih.gov/articles/PMC6806072/
49. https://pmc.ncbi.nlm.nih.gov/articles/PMC4481053/
53. Lee 2023: https://pmc.ncbi.nlm.nih.gov/articles/PMC10654909/
54. https://pmc.ncbi.nlm.nih.gov/articles/PMC10273036/
58. https://www.snorelab.com/faq/
63. Toss 'N' Turn: https://users.cs.utah.edu/~wiese/publications/tossnturn.pdf
64. Abdullah 2014: https://saeedabdullah.com/files/pubs/circadian-computing-ubicomp-2014.pdf
65. SensibleSleep: https://pmc.ncbi.nlm.nih.gov/articles/PMC5226832/
66. Saeb 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC5413802/
72. Lopaczynski (preprint): https://pmc.ncbi.nlm.nih.gov/articles/PMC13004090/
73. Sahha, 105.826 noches: https://sahha.ai/research/phone-only-sleep-estimation/
74. https://pubmed.ncbi.nlm.nih.gov/38570223
77. https://pmc.ncbi.nlm.nih.gov/articles/PMC5771411/
78. Diario contra actigrafía: https://pmc.ncbi.nlm.nih.gov/articles/PMC5788380/
85. Menghini, cómo evaluar aparatos: https://pmc.ncbi.nlm.nih.gov/articles/PMC7879416/
87. Tversky y Kahneman 1974: https://www.science.org/doi/10.1126/science.185.4157.1124

## Lo que pide Apple

- **Guía 1.4.1:** explicar los datos y el método de lo que se mide y recordar
  consultar a un médico.
- **Guía 5.1.3:** nada de publicidad con datos de salud, decir qué se lee y no
  guardarlos en iCloud.
- **Los nombres:** se dice «Salud» («Apple Health» en inglés), nunca «HealthKit»,
  y no se muestran capturas de la app Salud.
- **No se llama «puntaje de sueño»,** y se explica que el de Apple no se puede
  leer, así que los números pueden no coincidir.

## Fuera de la v1

- **La oxigenación en sangre, las alteraciones de la respiración y la
  temperatura de la muñeca:** son casi médicas y solo están en algunos relojes.
- **El índice de regularidad (SRI).**
- **La recuperación con Ascent.** Una noche sin datos tiene que repartir el peso
  entre lo demás, no contar como cero (ver [`ascent.md`](ascent.md)).
- **Las conexiones directas con los aparatos** (WHOOP, Garmin, Oura, Polar,
  Withings): ver [`aparatos.md`](aparatos.md).
- **El Tiempo de uso para estimar la noche** (Family Controls), que necesita un
  permiso de Apple (D26).

## Para decidir (D19)

- **La calidad sin las etapas ni el tiempo en cama.** La especificación decía «con
  las etapas»; lo saqué por la evidencia y porque el puntaje de Apple tampoco las
  usa.
- **«Acostarse antes de las X» pasa a «dormirte antes de las X»:** el reloj sabe
  cuándo te dormiste, no cuándo te acostaste.
- **8 horas de fábrica.**
- **Lo que queda fuera de la v1.**

## Las fuentes principales

- **Apple:**
  - `HKCategoryValueSleepAnalysis`, la charla de WWDC 2022 sobre el sueño;
  - la ayuda del sueño del Apple Watch (support.apple.com/108906) y la de Signos vitales (120142);
  - el foro de desarrolladores (hilo 842919, sobre cómo Salud junta las fuentes);
  - las guías de revisión y las de interfaz de HealthKit.
- **Estudios:**
  - Miller y otros (2022, PMC9412437);
  - Schyvens y otros (2025, Sleep Advances);
  - Robbins y otros (2024, PMC11511193);
  - de Zambotti y otros (2024, Sleep);
  - Phillips y otros (2017), Windred y otros (2024);
  - Fischer y otros (2021), Huang y otros (2020), Kitamura y otros (2016);
  - el estudio de la evidencia del sueño, con todas sus fuentes:
    [`estudio/sueno.md`](estudio/sueno.md).
- **Guías:**
  - AASM y SRS (2015);
  - National Sleep Foundation (2015, 2017 y 2025);
  - AASM sobre los aparatos de consumo (2018).
- **Cómo lo hacen otros:**
  - la ayuda de Oura sobre la deuda y la puntuación;
  - la de Fitbit;
  - la de Garmin sobre lo que necesitás dormir;
  - el registro por fecha de despertar de Fitbit.
