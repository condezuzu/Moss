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
3. **La deuda de sueño** de las dos semanas, con cuántas noches tiene. Va
   segunda (lo pediste el 22/10/2026): solo necesita cuánto dormiste, así que es
   lo que más gente puede tener bien.
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
   - lo dormido separado por menos de una hora es un episodio, y el más largo es el principal;
   - a la noche se suman los de 3 horas o más y los que empiezan o terminan a 2 horas del principal: el sueño partido es una noche;
   - lo demás, desde 15 minutos, son siestas: cuentan para la deuda, no para el horario.
5. **En cama** se muestra solo si alguna fuente lo escribió de verdad, y si es del
   teléfono va con confianza baja. Nunca cuenta como sueño.
6. **La noche que falta** queda en gris, «sin datos»:
   - no es un cero, no se rellena y no entra en los promedios ni en la deuda;
   - si solo está el «en cama» del iPhone, se muestra aparte y no cuenta para nada;
   - los hábitos de sueño de ese día quedan pendientes y se pueden marcar a mano;
   - hasta las 14, la de anoche dice «esperando al reloj» (el reloj escribe al despertarte).
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

- **Lo que necesitás dormir** (`necesidad`):
  - 8 horas, las mismas de la recuperación de Ascent;
  - 7 y media desde los 65;
  - se cambia de 7 a 9.

  Las guías: la AASM y la SRS piden 7 horas o más de 18 a 60 años; la National
  Sleep Foundation, de 7 a 9.
- **La calidad** (`calidadDeNoche`), de 0 a 100, en tres partes, como el puntaje
  de Apple (duración 50, horario 30, interrupciones 20), que no se puede leer:
  - **Duración (50):** 50 · (dormido − 4 h) / (necesidad − 4 h), entre 0 y 50.
  - **Horario (30):** d es el promedio de cuánto se corrieron la hora de dormirte
    y la de despertarte de las medianas de las noches anteriores. Da 30 · (90 − d) / 60:
    todo hasta media hora y nada desde hora y media. Hora y media de desvío se
    asocia con el doble de riesgo cardiovascular que media hora (Huang y otros, 2020).
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
- **La deuda** (`deudaDeSueno`):
  - es lo que faltó cada noche de las últimas 14, pesando más las recientes (anoche pesa 1 y hace 13 noches, 1/14);
  - menos lo que sobró, hasta 2 horas por noche;
  - nunca baja de cero;
  - las siestas cuentan.

  Recuperar una hora de deuda lleva unos cuatro días (Kitamura y otros, 2016).
- **El horario y la regularidad** (`horario`):
  - el promedio y el desvío estándar de la hora de dormirte y de despertarte en las dos semanas;
  - hasta 30 minutos es muy regular; hasta 60, regular; hasta 90, irregular; más, muy irregular;
  - el fin de semana compara la mitad del sueño de las noches que terminan sábado y domingo con las de lunes a viernes, y dice que supone que esos días no trabajás.

  El índice de regularidad (SRI, Phillips y otros, 2017) predice mejor la
  mortalidad que la duración, pero necesita días seguidos, es sensible a las
  siestas, y dos calculadoras comunes difieren 18 puntos. Queda para después,
  sin compararlo con nadie.
- **Lo del reloj** (`vitalDeNoche`):
  - el promedio de lo medido mientras dormías, de la misma fuente;
  - hace falta una lectura de frecuencia cada media hora, y dos de variabilidad y de respiración;
  - se compara con la mediana de tus últimas 28 noches (al menos 7) y se dice solo «lo usual», «más» o «menos»: más de 3 lpm, un 15 % de variabilidad o 1 respiración por minuto;
  - nunca se mezclan SDNN y RMSSD;
  - la frecuencia en reposo de Salud es del día entero, y lo dice.

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

**Nada corre de noche.** Al abrir Moss a la mañana, arma la noche con lo que el
teléfono guardó:

1. **Los pasos**, en bloques de 5 minutos, de las últimas 36 horas.
2. **El movimiento**: caminar o ir en auto es estar despierto; un movimiento corto
   de madrugada es alguien que tocó el teléfono. Hace falta un módulo nativo
   propio (`modules/movimiento`).
3. **Los eventos de Moss**: abrirla, cerrarla, registrar algo. Son anclas exactas
   de que estabas despierto.
4. **Opcional, «Afinar»**: un Atajo que avisa a Moss cuando prendés el Focus de
   Sueño, conectás el cargador o parás la alarma.

**Las cuentas** (las reglas publicadas de Sahha como punto de partida [73]):

- **La ventana tranquila:** el primer hueco de 5 a 12 horas sin actividad que
  empieza entre las 18 y las 4. La actividad suelta, con más de 90 minutos de
  silencio de cada lado, no lo corta. Sin hueco, de la última actividad antes de
  las 2 a la primera después de las 4, con confianza baja.
- **Cuándo te dormiste:** la última actividad más lo que tardás en dormirte, que
  depende de cuánto antes de lo de siempre dejaste el teléfono: 31 minutos a la
  hora de siempre, 76 si fue 1 a 1,5 horas antes, 153 si fue 2 a 3 horas antes y
  202 si fue 3 a 4 horas antes; 15 a 22 minutos si fue más tarde [73].
- **Cuándo te despertaste:** la primera actividad menos 18 minutos, sin pasar la
  primera caminata, la alarma parada o el Focus apagado [73].
- **Los despertares de la noche** quedan marcados como interrupciones, sin decir
  cuánto: el teléfono lo mide mal (48,8 minutos de error) [72].
- **Las siestas** no se estiman.

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
  noches, aparte entre semana y fin de semana [64][73].
- **Lo que tardás en dormirte** después de dejar el teléfono, y lo que tardás en
  agarrarlo al despertar: arrancan con los números de arriba y se ajustan con
  tus correcciones [64][65][73].
- **Las correcciones valen más que un «Sí»**, que puede ser por no pensar: una
  corrección pesa como 5 a 7 noches y lo viejo pierde la mitad del peso en unas
  30 noches (propuesta, sin estudio directo).
- **Las noches de viaje** o con cambio de huso no enseñan nada [73].
- Los modelos personales le ganan a los generales: 91,8 contra 87,6 % [66].

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
  - Fischer y otros (2021), Huang y otros (2020), Kitamura y otros (2016).
- **Guías:**
  - AASM y SRS (2015);
  - National Sleep Foundation (2015, 2017 y 2025);
  - AASM sobre los aparatos de consumo (2018).
- **Cómo lo hacen otros:**
  - la ayuda de Oura sobre la deuda y la puntuación;
  - la de Fitbit;
  - la de Garmin sobre lo que necesitás dormir;
  - el registro por fecha de despertar de Fitbit.
