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

1. **Las últimas dos semanas:** una barra por noche con lo dormido y la línea de
   lo que necesitás. Las que faltan van en gris. Se toca una para verla.
2. **La noche:**
   - cuánto dormiste (lo que el reloj mide mejor), y a qué hora te dormiste y te despertaste;
   - si parece cortada, se pregunta (ver abajo);
   - el hipnograma y las etapas, marcadas como estimación;
   - lo despierto y los despertares de 5 minutos o más;
   - el tiempo en cama, solo si alguna fuente lo escribió;
   - las siestas del día.
3. **La calidad,** de 0 a 100, con sus tres partes y «Cómo se calcula».
4. **El horario de las dos semanas:**
   - cada noche como una barra de cuándo te dormiste a cuándo te despertaste;
   - el promedio de cada hora con su ±;
   - qué tan regular es;
   - cuánto más tarde dormís el fin de semana.
5. **La deuda de sueño** de las dos semanas, con cuántas noches tiene.
6. **De noche, según el reloj:**
   - la frecuencia cardíaca, la variabilidad y la respiración mientras dormías, contra lo tuyo;
   - la frecuencia en reposo, marcada «del día».
7. **De dónde sale cada dato** y qué tan confiable es.
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
- **El iPhone solo** escribe `inBed` alrededor del horario de sueño, por el uso
  del teléfono: no es sueño. Sin reloj no hay etapas.
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

1. **Una sola fuente por noche, nunca dos sumadas.** El orden:
   1. la que elijas;
   2. el reloj;
   3. otro aparato con etapas;
   4. otro sin etapas;
   5. las apps del teléfono.

   Lo anotado a mano cuenta solo si no hay otra cosa.
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
| En cama, del iPhone | estimación | es el uso del teléfono |

La AASM dice que estos aparatos no sirven para diagnosticar. La National Sleep
Foundation pide explicar los métodos y sus límites, y avisa del riesgo de
obsesionarse con los números («ortosomnia»): por eso la calidad va con su
explicación y sin rojos.

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
