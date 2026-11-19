# Las sugerencias de hoy: entrenamiento, comida y sueño

*Estudio del 19/11/2026 para la sección de músculos que comparten Moss y Ascent: cada día, tres «sugerencias para
hoy», una de entrenamiento, una de comida y una de sueño. Parte de lo que ya está y no lo repite:
[`musculos-recuperacion.md`](musculos-recuperacion.md) (recuperación, sueño y comida contra el rendimiento; la regla
de subir el peso), [`../musculos-compartido.md`](../musculos-compartido.md) (el puntaje, la franja de 10 a 20, la
fatiga en días y la doble progresión), [`../entreno.md`](../entreno.md), [`../sueno.md`](../sueno.md),
[`deuda-y-melatonina.md`](deuda-y-melatonina.md), [`ascent.md`](ascent.md) y la investigación de Ascent («Ascent y
Moss: la evidencia de los músculos»: volumen, esfuerzo, partes del músculo y variación).*

*Código leído (rama `mejoras-1.1`): en Moss, `src/dominio/paraHoy.ts`, `loQueConviene.ts`, `alrededorDelEntreno.ts`,
`melatonina.ts`, `energia.ts`, `diagnostico.ts`, `rendimiento.ts` (`suenoCorto`), `entrenamiento.ts` y `cuidados.ts`;
en Ascent, `nucleo/rutinaAutomatica.ts` (el objetivo, la experiencia y las repeticiones de cada objetivo). No se
tocó nada.*

*Cómo leer las cifras. Cada número lleva su fuente entre corchetes; las fuentes están al final, con lo que se leyó:
«resumen», «texto» o «revisada» (ya la leyó otro estudio de Moss o el de Ascent, y no se volvió a abrir).
**Evidencia** es lo que sale de estudios; **convención** es una elección razonable sin estudios a favor ni en
contra; **derivado** es una cuenta propia con datos citados. Para quien no entrena: una **serie** es una tanda de
repeticiones seguidas; la **reserva** (RIR, en inglés) es cuántas repeticiones más podrías haber hecho al terminar
la serie: 0 es «al fallo», no podías una más.*

---

## 1. Resumen

1. **Para crecer, el peso casi no importa; para la fuerza, sí.** Con series cerca del fallo, el músculo crece
   parecido con cargas de entre ~30 y 100 % del máximo [1][2][3][4]; con el 20 %, la mitad [5]. La fuerza máxima
   sube más con cargas de 80 % o más [1][2][3][4]. Distinguir el objetivo sirve para el peso, no para el músculo.
2. **No hace falta llegar al fallo.** Acercarse ayuda algo al músculo y nada a la fuerza [6][7][8]; el ACSM 2026
   propone dejar 2 o 3 repeticiones y dice que no hay datos para fijar un número exacto [1]. El fallo alarga la
   recuperación [19]. Principiante o avanzado cambia cuántas series, no las repeticiones ni la reserva: estimar la
   reserva sale igual de mal con o sin experiencia (una repetición de error) [9].
3. **El rango de repeticiones es una convención útil dentro de lo que se defiende.** El de músculo de Ascent (8 a
   12) está bien; el de fuerza (5 a 10) queda liviano para los ejercicios grandes: con «80 % o más» serían de 3 a 6.
4. **El descanso activo no tiene respaldo para recuperar más rápido.** Moverse suave alivia el dolor un rato
   [20][21], pero no adelanta la vuelta de la fuerza en la mayoría de los estudios [21][22][24]; un ensayo a favor
   usó series muy livianas del mismo músculo [23]. Tampoco perjudica: el ejercicio aeróbico no frena el músculo
   [25]. Se puede sugerir moverse, sin prometer que recupera.
5. **Los pasos son de salud, no de músculo.** La mortalidad baja hasta unos 6.000 a 10.000 pasos según la edad
   [26], y la mayor parte del beneficio está hacia los 7.000 [27]; son estudios de observación.
6. **Compensar la comida de ayer no conviene.** No cambia la sesión de hoy [34][35][36]; para el peso, lo que cuenta
   es la suma de los días [38]; nadie probó que recuperar proteína al día siguiente sirva; y compensar es justo lo
   que hay que evitar con un trastorno de la alimentación [39][40]. Lo que sí: volver a la meta de siempre y
   repartir la proteína en las comidas [28][30].
7. **El día de descanso, la proteína es la de siempre:** el músculo sigue más sensible a la proteína al menos 24 h
   después de entrenar [32].
8. **Lo que mejora el rendimiento después de dormir poco es dormir:** dormir más noches seguidas [41][42][43][44] y,
   en menor medida, una siesta [45]. Para la fuerza, la siesta da resultados opuestos [46][47]. El café ayuda en el
   día [50][51] pero le quita sueño a la noche si es tarde [52]. Acostarse mucho antes de tu periodo de melatonina
   no ayuda (`deuda-y-melatonina.md`, 3.5).
9. **La franja en palabras:** debajo de 10 series el músculo crece, pero menos [14][10]; de 10 a 20, «sigue así»;
   arriba de 20 todavía puede sumar, cada vez menos, y la fuerza ya no [10][12][13]. Ninguna de las tres quiere
   decir «no lo entrenes».
10. **Contra lo pedido:** el descanso activo como «recuperación» y compensar la comida de ayer no se sostienen; la
    siesta de 20 minutos de hoy queda corta para lo físico y su efecto en la fuerza es dudoso; y `recuperado.ts`
    todavía suma la comida de ayer a la recuperación, cuando lo comido no cambia la sesión de hoy.

---

## 2. Entrenamiento, día de entrenar (pregunta 1)

Lo pedido: una o dos líneas sobre la sesión de hoy (qué músculos, cuántas series, en qué rango de repeticiones,
con cuánta reserva, cuándo subir o mantener el peso).

### 2.1 El rango de repeticiones

**A favor de que, para crecer, el peso importe poco:**
- Schoenfeld 2017 [3] (21 estudios de 6 semanas o más, todas las series al fallo): con ≤60 % o >60 % del máximo, el
  mismo crecimiento.
- Lopez 2021 [4] (28 estudios, 747 adultos sanos): más de 15 repeticiones máximas, de 9 a 15 o de 8 o menos, el mismo
  crecimiento; más efecto en quienes no entrenaban.
- Currier 2023 [2] (metaanálisis en red; 119 estudios y 3.364 personas para el músculo): todas las formas de
  entrenar dieron un crecimiento parecido.
- ACSM 2026 [1] (revisión de revisiones): sin efecto de la carga en el crecimiento entre el 30 y el 100 % del
  máximo.

**En contra, o con límites:**
- Lasevicius 2018 [5] (30 hombres, 12 semanas, cada pierna y brazo con otra carga y el mismo volumen): con el 20 %
  el muslo creció 8,9 % contra 19,5 % con el 80 %, y el bíceps 11,4 % contra 25 %. Entre 40 y 80 %, parecido. El
  piso está cerca del 30 a 40 %, que son series muy largas.
- Las series largas cuestan más de estimar: la reserva se adivina mejor con menos repeticiones en total [9].

**Para la fuerza máxima, más peso:**
- Schoenfeld 2017 [3]: el máximo (1RM) subió más con cargas altas; la fuerza isométrica, igual. Lo que mejora es
  levantar pesado, no «la fuerza» en general.
- Lopez 2021 [4]: cargas altas y medias, más que bajas; altas contra medias, una diferencia chica que no llegó a
  ser significativa (DE 0,26 a 0,28, p = 0,068).
- Currier 2023 [2] (178 estudios y 5.097 personas para la fuerza): más del 80 % del máximo dio más fuerza; lo mejor
  rankeado, varias series tres veces por semana.
- ACSM 2026 [1]: 80 % o más, como dosis-respuesta.

**Veredicto:** **se sostiene** distinguir el objetivo para el peso: músculo, casi cualquier carga desde ~30 %;
fuerza, 80 % o más en los ejercicios que se quieren hacer más fuertes. El rango exacto de repeticiones es
**convención**: pasar de «% del máximo» a «repeticiones» depende del ejercicio y de la persona. El 80 % son unas 8
repeticiones al fallo; con 2 o 3 de reserva, unas 5 o 6 (derivado, con las tablas habituales).

### 2.2 La reserva

**A favor de acercarse al fallo:**
- Robinson 2024 [6] (meta-regresiones): el músculo crece más cuanto más cerca del fallo termina la serie; la fuerza,
  parecido en un rango amplio de reservas. Los autores lo llaman exploratorio: la reserva de los estudios está
  estimada.
- Grgic 2022 [7] (15 estudios, jóvenes): en entrenados, el fallo dio algo más de músculo (DE 0,15; 0,03 a 0,26).

**En contra del fallo:**
- Grgic 2022 [7]: en total, sin diferencia en fuerza ni en músculo; con volumen libre, no ir al fallo dio más
  fuerza (DE −0,32).
- Refalo 2024 [8] (entrenados, 8 semanas): al fallo o a 1 o 2 de reserva, el mismo crecimiento.
- ACSM 2026 [1]: el fallo no mejora fuerza, músculo ni potencia; propone 2 o 3 de reserva; no hay datos para fijar
  el número.
- Morán-Navarro 2017 [19]: el fallo alarga la recuperación; las piernas con un ejercicio grande al fallo tardan 3
  días (`musculos-compartido.md`, 4.2).
- Halperin 2022 [9]: la gente cree que le queda una repetición menos de las que le quedan (0,95), sin diferencia por
  experiencia: «2 de reserva» suele ser 3.

**Principiante o avanzado:**
- El ACSM 2026 dice que sus recomendaciones valen desde el que empieza hasta el experimentado [1], y que en el que
  empieza la carga puede ser baja; quien no entrenaba crece con casi todo [4].
- Lo que sí cambia con la experiencia es cuántas series hacen falta (6 a 10 al empezar; `musculos-compartido.md`,
  4.1, y Ascent).
- «Más lejos del fallo al empezar» es **convención** (la técnica), no evidencia: estimar la reserva sale igual de
  mal con o sin experiencia [9].

**Veredicto:** **se sostiene** que no hace falta el fallo y que para el músculo conviene terminar cerca (1 o 2);
para la fuerza, 2 o 3 alcanza. **Convención:** 2 o 3 al empezar, y nunca al fallo en un ejercicio grande de piernas o
de espalda baja.

### 2.3 Cuántas series hoy

- La semana ya está decidida: de 10 a 20 series duras por músculo, 6 a 10 al empezar (`musculos-compartido.md`,
  4.1). Repartidas en dos días o más (Schoenfeld 2016, en la nota de la rutina, 4.4).
- **Por sesión:** Remmert 2025 [11] (preprint, sin revisión de pares; meta-regresiones de 67 estudios): para el
  músculo, después de ~11 series por sesión (contando 0,5 al que ayuda) ya no se distingue un beneficio; para la
  fuerza, después de ~2 series directas. El ACSM 2026 da 2 o 3 series por sesión para la fuerza [1].
- **Veredicto:** **débil**. Sirve como aviso, no como regla: si la rutina de hoy tiene más de 10 series de un mismo
  músculo, conviene repartirlas.

### 2.4 Subir o mantener el peso

Ya está decidido (`musculos-compartido.md`, 4.3): la doble progresión, nunca por una sola serie, sin la comida como
freno y, el día de una noche corta, mantener. Lo único que se suma: sumar repeticiones con el mismo peso da casi lo
mismo que subir kilos [17], así que «mantén» se dice como meta («buscando una repetición más»), no como freno.

### 2.5 La regla para la app

Con lo de hoy de Ascent: la sesión de la rutina (sus ejercicios, series y repeticiones), su objetivo y su
experiencia (`rutinaAutomatica.ts`), y por cada músculo su puntaje y su fatiga (`puntajeMuscular.ts`).

- **E1. Qué músculos:** los principales de la sesión de hoy, los dos con más series. Sin sesión en la rutina, no se
  adivina: va la sugerencia de descanso (sección 3).
- **E2. Repeticiones:** las de la rutina. Sin ellas: músculo, 8 a 12 (el rango de Ascent); fuerza, 3 a 6 en los
  ejercicios grandes y 6 a 12 en el resto. **Convención** dentro de la evidencia (2.1). *Para Ascent:* su `REPS` de
  fuerza (5 a 10) queda liviano para «80 % o más» en los grandes.
- **E3. Reserva:** músculo, 1 o 2; fuerza, 2 o 3; con la experiencia `nunca` o `menos6m`, 2 o 3. **Evidencia** para
  «sin fallo» y «cerca para crecer» [1][6][7][8]; los números son **convención**.
- **E4. El peso:** `proximaSesion` de `puntajeMuscular.ts` (4.3). Sube: todas las series al tope con 2 o más de
  reserva, dos sesiones seguidas. Mantén: buscando una repetición más [17].
- **E5. Noche corta** (`suenoCorto`: 6 h o menos, despertarse 1 h antes o 2 de las últimas 3 noches cortas): mantén
  el peso y sin fallo (4.3) [18].
- **E6. Un músculo de hoy todavía cargado** (`diasParaEstarListo`, faltan 2 días o más): más liviano y sin fallo.
  **Convención** para la sesión de hoy (es el «más liviano» de `diagnostico.ts`). Para lo que se gana, entrenar con
  ~24 h de descanso no dio menos que con 48 a 72 h: 30 hombres activos, 12 semanas, 3 × 10 al 10RM tres días
  seguidos o salteados, la misma fuerza y composición (Yang 2018 [53]). Por eso E6 no dice «no lo entrenes».
- **E7. Más de 10 series de un músculo en la sesión:** repartirlas. **Débil** [11].
- **Las dos líneas:** la primera, E1 a E3 juntas; la segunda, la primera que aplique de E5, E6, E7 y E4.

---

## 3. Entrenamiento, día de descanso (pregunta 2)

### 3.1 ¿Moverse suave ayuda a recuperar?

**A favor:**
- Dupuy 2018 [20] (metaanálisis de 99 estudios de técnicas de recuperación): la recuperación activa bajó el dolor
  muscular de los días siguientes (g = −0,94; −1,61 a −0,28; 8 grupos, 90 personas). No midieron el rendimiento.
- Bartolomei 2021 [23] (25 hombres entrenados; banca 8 × 10 al 70 %; después, 5 × 10 con el 10 % del máximo a las 6 y
  a las 30 h, o nada): con las series livianas, la potencia y la fuerza ya estaban a las 24 h; sin ellas, todavía
  bajas. El dolor, igual. Es un ensayo chico, del mismo músculo y con pesas, no caminar.
- Zainuddin 2006 [21] (14 personas): justo después de un ejercicio suave, el dolor bajó un 40 %.

**En contra:**
- Zainuddin 2006 [21]: el alivio duró poco y la fuerza no volvió antes. Lo que hace es calmar el dolor, no
  recuperar.
- Dupuy 2018 [20]: sin efecto en la fatiga que se siente (g = 0,64; −0,43 a 1,70) ni en los marcadores de daño.
- Van Hooren y Peake 2018 [22] (revisión narrativa): la vuelta a la calma activa casi no mejora el rendimiento del
  día siguiente, no previene lesiones y no frena lo que se gana.
- Park 2026 [24] (tesis sin revisión de pares; 15 entrenados, 10 hombres y 5 mujeres, cruzado): sentadilla y banca al
  20 % justo después y a las 24 h, sin ventaja en dolor, salto, el músculo ni el trabajo de la sesión siguiente.

**¿Perjudica?** No hay datos de que moverse suave frene: el ejercicio aeróbico no le quita músculo ni fuerza máxima
al entrenamiento de fuerza (Schumann 2022 [25], metaanálisis actualizado; algo de potencia si va en la misma
sesión). Caminar es bastante más suave que eso.

**Veredicto:** el descanso activo para recuperar más rápido, **débil**: alivia el dolor un rato y no se probó que
adelante la próxima sesión. No perjudica. Descansar del todo también está bien.

### 3.2 ¿Cuándo no?

- **Con los músculos muy cargados:** no hay estudios de caminar con piernas cargadas. Lo que sí está es que la
  recuperación depende de lo cerca del fallo que se llegó (`musculos-recuperacion.md`, 2): lo que hay que evitar es
  que la «actividad suave» sea intensa con esos músculos (correr rápido, saltos, una clase fuerte de piernas).
  **Convención.**
- **Con una noche corta:** no se encontró nada que diga que moverse suave empeore; la sugerencia de ese día va en el
  sueño (sección 5).

### 3.3 Los pasos

- Paluch 2022 [26] (15 cohortes, 47.471 adultos): la mortalidad bajó con más pasos hasta 6.000 a 8.000 por día en
  mayores de 60 y hasta 8.000 a 10.000 en menores; contra el cuarto más bajo (~3.500), el más alto (~10.900) tuvo un
  riesgo de 0,47. Lo pagaron los CDC de EE. UU.
- Ding 2025 [27] (57 estudios de 35 cohortes): buena parte del beneficio en varias enfermedades llega hacia los
  5.000 a 7.000 pasos; más allá, poco. Los porcentajes por enfermedad se citan distinto en la prensa: no se usan.
- **Límites:** son estudios de observación (quien camina más puede estar más sano por otras razones) y no dicen nada
  del músculo.

**Veredicto:** los pasos, **se sostiene** como salud general; no como recuperación.

### 3.4 La regla para la app

- **D1. Día de descanso:** «moverte suave está bien», sin prometer que recupera. **Evidencia** de que no perjudica
  [25]; de que ayuda, débil [20][23].
- **D2. Pocos pasos:** si Moss lee los pasos de Salud, es día de descanso, son las 17 o más y van menos de 5.000:
  una caminata de 20 minutos. El 5.000 es **convención** (debajo de donde los estudios ven la mayor parte del
  beneficio [26][27]); 20 minutos son ~2.000 pasos (derivado, a ~100 pasos por minuto). Nunca como «quemar» ni
  compensar comida, y con un trastorno de la alimentación marcado en Cuidados, no aparece (**convención** prudente:
  seguir la actividad se asocia a más síntomas [39]).
- **D3. Piernas cargadas el día de descanso:** «si te mueves, que sea suave». **Convención.**
- **D4. Si duele:** no es una sugerencia del día; va en «En qué se basa»: moverse suave alivia un rato, no acelera
  [20][21]. Como ya dice la sección, el dolor no cuenta para la fatiga.
- **Orden:** D3, D2, D1.

---

## 4. Comida (pregunta 3)

Lo pedido: según cómo le fue ayer con sus metas y si hoy entrena, qué priorizar. Y si sirve compensar.

### 4.1 Lo que pesa

- **La proteína del día, como promedio:** la ganancia se aplana en ~1,6 g/kg (Morton 2018 [28], 49 ensayos; Nunes
  2022 [29], 74 ensayos, con autores con fondos de la industria de la carne y los lácteos). Las metas de Moss ya están
  ahí o arriba (1,6 a 2,0 g/kg y, con Ascent, más los días de entrenar).
- **Repartida:** 0,4 g/kg en al menos 4 comidas para llegar a 1,6 [30]; no hay techo por comida (100 g dieron una
  respuesta más larga [31]). Que el reparto cambie el músculo a largo plazo está menos probado que el total
  (`entreno.md`, 2.5).
- **El día después de entrenar:** el músculo responde más a la proteína al menos 24 h después de una sesión cerca del
  fallo (Burd 2011 [32], 15 hombres jóvenes). El día de descanso no es un día de menos proteína.
- **Antes de una sesión larga:** los carbohidratos ayudaron en sesiones de más de 45 minutos y tras 8 h sin comer
  (King 2022 [33]), pero un ensayo cruzado después de 10 h de ayuno y 90 minutos de sesión no vio nada (King 2025
  [34]). **A medias.**
- **La comida de ayer no cambia la sesión de hoy** [34][35][36]; el déficit frena el músculo, no la fuerza [37]
  (`musculos-recuperacion.md`, 5).

### 4.2 ¿Compensar?

**A favor de que «no pasa nada» con un día distinto:**
- Para el peso cuenta la suma de los días: comer menos algunos días o un poco menos todos dio la misma pérdida de
  peso (Cioffi 2018 [38], 11 ensayos de 8 a 24 semanas: −0,61 kg, −1,70 a 0,47). Un día corto o largo no «se
  pierde».

**En contra de compensar:**
- **Para rendir, no sirve:** lo de ayer no cambia la sesión [34][35][36].
- **Para la proteína, no hay estudios** que prueben recuperar al día siguiente lo que faltó; lo que se sostiene es
  el promedio [28][29] y repartirla [30].
- **Con un trastorno de la alimentación, compensar es el problema:** en 493 universitarios, quienes contaban
  calorías con una app tenían más preocupación por comer y más restricción (Simpson y Mazzeo 2017 [39]); de 105
  personas con un trastorno, el 75 % usaba MyFitnessPal y el 73 % de ellas sentía que contribuía (Levinson 2017
  [40]). Son estudios de asociación, no de causa. Moss ya tiene la regla: nada de compensar, quemar ni ganarse la
  comida (`entreno.md`, E3).

**Veredicto:** compensar, **no conviene** (refutado para rendir, sin evidencia para la proteína, con riesgo). Lo
honesto es «hoy, tu meta de siempre». «Puedes estar tranquilo» **se sostiene**: un día no cambia la sesión ni la
tendencia.

### 4.3 La regla para la app

Ayer cuenta solo si está anotado (2 de las 3 comidas de siempre, o 3 de 4: el mismo criterio que `energia.ts`).
Si no, no se habla de ayer.

- **C1. Energía baja estos días** (`energiaDeEstosDias`, `estado === 'baja'`): manda el texto de `energia.ts` («intenta
  llegar a tu meta»), nunca más que la meta.
- **C2. Ayer, poca proteína** (menos del 80 % de la meta): no recuperarla; hoy, proteína en cada comida, con los
  gramos de `proteinaDeComida` (0,3 a 0,4 g/kg, de a 5). El 80 % es **convención**.
- **C3. Hoy, una sesión larga** (más de 45 minutos y 10 series o más de un músculo, el mismo corte que la
  investigación de Ascent): carbohidratos de 1 a 3 h antes, como «puede ayudar». **Débil** [33][34]. Ya es la
  propuesta de `musculos-recuperacion.md` (5.3).
- **C4. Ayer, menos calorías** (menos del 80 % de la meta, el corte de `recuperado.ts`): «hoy, la de siempre; no hace
  falta compensar». **Convención** en el corte.
- **C5. Hoy entrena:** la proteína de la comida de después (`alrededorDelEntreno.ts`, 0,3 g/kg).
- **C6. Hoy descansa:** «la proteína de siempre» [32].
- **C7. Ayer bien** (proteína 90 % o más y calorías entre 90 y 110 %; el 90 % es `LLEGASTE` de `energia.ts`): «vas
  bien: hoy, lo mismo».
- **Ayer, más calorías:** no se dice nada de ayer; va la siguiente que aplique, o «hoy, tu meta de siempre».
- **Con «sin déficit»** (embarazo, lactancia o una condición): nada, como `paraHoy.ts`. **Con un trastorno de la
  alimentación** (`tca` en `cuidados.ts`): nada de ayer ni de gramos; solo C6 o C5 sin números, si
  `apagaConsejo` no los apaga. **Con los números ocultos:** sin gramos.
- **Orden:** C1, C2, C3, C4, C5 o C6, C7.

---

## 5. Sueño (pregunta 4)

### 5.1 Qué mejora de verdad el rendimiento

- **Dormir más, varias noches:** extender el sueño fue lo que más ayudó al rendimiento (Bonnar 2018 [43], 10
  estudios, 218 deportistas de 18 a 24 años; Cunha 2023 [44], 25 estudios, con la siesta). Son estudios chicos.
- **La deuda no se paga con una noche:** con 10 h en la cama después de 5 noches cortas quedaron déficits (Banks
  2010 [41]); una falta de ~1 h por noche se recuperó en ~4 noches largas (Kitamura 2016 [42]).
- **Acostarse mucho antes no sirve:** 1 a 3 h antes de la hora habitual hay una zona en la que cuesta dormirse; lo
  que da más sueño es despertarse más tarde o acostarse en tu periodo (`deuda-y-melatonina.md`, 3.5). Moss ya lo
  calcula: `periodoDeMelatonina().acostarse`, con deuda sin adelantar.
- **Comer distinto no lo compensa:** nadie lo probó (`entreno.md`, 3.3).

### 5.2 La siesta

**A favor:**
- Mesas 2023 [45] (22 ensayos, 291 hombres de 18 a 35, 164 deportistas): después de una noche normal, la siesta
  mejoró el rendimiento físico (DE 0,99) y bajó la fatiga (−0,76); también después de dormir poco. Lo mejor, de 30 a
  menos de 60 minutos, con más de 1 h entre despertarse y la prueba. Heterogeneidad alta; casi todo sprint, salto o
  resistencia, poca fuerza.
- Brotherton 2019 [46] (15 entrenados, dos noches de ~3 h): una siesta de 1 h a las 13 devolvió la fuerza de agarre
  y la banca a las 17.

**En contra:**
- Gallagher 2023 [47] (15 entrenados, dos noches de 4 h): siestas de 30 o 60 minutos a las 13 no cambiaron agarre,
  banca ni sentadilla; mejoraron el ánimo y la atención.
- Brooks y Lack 2006 [48]: después de dormir poco, 10 minutos fue lo que más despertó; 30 minutos dieron
  aturdimiento al despertar.
- Mograss 2022 [49]: la siesta a menos de 7 h de la noche se asocia a dormir peor esa noche. Las siestas habituales
  de 30 minutos o más se asocian a más mortalidad en cohortes, con confusión posible (`momentos.md`).

**Veredicto:** la siesta, **a medias**: ayuda al ánimo y a la atención; a la fuerza, dudoso. El largo es
**convención** entre los estudios: hasta 30 minutos, temprano (antes de las 16) y terminada 1 h antes de entrenar
(como `SIESTA_ANTES` de `diagnostico.ts`). Hoy la app dice «20 minutos»: está dentro, pero para lo físico Mesas
encontró más con 30 a 60.

### 5.3 La cafeína

- **A favor:** después de dormir poco, la cafeína mejora la atención y, con más variación, lo físico (Irwin 2020
  [50], 45 publicaciones, ~341 mg de promedio); en 10 jugadores de rugby, 1 o 5 mg/kg evitaron la caída en un pase
  después de 3 a 5 h de sueño (Cook 2011 [51]).
- **En contra:** le quita sueño a la noche siguiente según la dosis y la hora: un café (~107 mg), al menos 8,8 h antes
  de acostarse (Gardiner 2023 [52]). Una noche corta seguida de café tarde arma la siguiente noche corta.
- **Veredicto:** **se sostiene**, con la hora de corte que ya calcula Moss (`corteDeCafeina`). Nunca proponer café a
  quien no lo toma (`momentos.md`).

### 5.4 La regla para la app

Con lo de Moss: la noche (`estadoDelSueno`, `suenoCorto`), la deuda, `periodoDeMelatonina()` y, si se anota, la
cafeína de una toma.

- **S1. Noche corta y una sesión hoy con tiempo** (la sesión empieza en 1 h o más, antes de las 16 y sin siesta
  hoy): la siesta corta. **A medias** [45][46][47][48].
- **S2. Noche corta** (sin lugar para la siesta): «esta noche, a la cama hacia las {acostarse}; antes no ayuda
  mucho». **Evidencia** para la hora (`melatonina.ts`); lo de no adelantar, `deuda-y-melatonina.md` (3.5).
- **S3. Noche corta y toma café** (`cafeinaPorToma` anotada): «si tomas café, antes de las {corte}». **Evidencia**
  [50][51][52].
- **S4. Deuda de 7 h o más** (`DEUDA_QUE_PESA` de `diagnostico.ts`): «la bajan varias noches a tu hora, no una
  larga» [41][42].
- **S5. Lo demás:** «esta noche, a la cama hacia las {acostarse}». Sin periodo (menos de 3 noches), no hay línea.
- **Orden:** S1, S3, S2, S4, S5. Con trabajo de noche o turnos, nada de la hora (el periodo no sirve).

---

## 6. La franja de cada músculo en palabras (pregunta 5)

Los cortes son los de `musculos-compartido.md` (4.1): sin entrenar (0 series), poco (menos de 10), en su punto (10 a
20) y mucho (más de 20).

**Debajo de 10:**
- **A favor de que crece igual:** con menos de 5 series ya se crece, aunque menos que con 10 o más (Schoenfeld 2017
  [14]); cada serie suma menos que la anterior [10]; al empezar, 6 a 10 alcanzan (Ascent).
- **No se pierde:** en jóvenes, una sesión por semana con una serie por ejercicio, con el mismo peso relativo, mantuvo
  fuerza y músculo hasta 32 semanas; en mayores, quizás 2 sesiones y 2 o 3 series (Spiering 2021 [15], revisión
  narrativa). «Poco» no es «retrocedes».

**Entre 10 y 20:**
- Es la zona donde se junta la evidencia (convención de la investigación de Ascent). El riesgo es que se lea «ya
  está, no lo entrenes»: la palabra tiene que decir «sigue así».

**Arriba de 20:**
- **A favor de que todavía suma:** el músculo sigue creciendo con más series, cada vez menos (Pelland 2026 [10]).
- **En contra:** la fuerza se estanca antes [10]; en 35 muy entrenados, 12, 18 o 24 series de piernas dieron el
  mismo grosor, y con 24 subió menos la sentadilla (5,4 % contra 16,2 % con 18; p = 0,052) (Aube 2022 [12]); 9, 18 o
  27 series de bíceps dieron parecido (Heaselgrave 2019 [13]); el ACSM 2026 ve rendimientos que caen desde ~18 a 20
  [1]. Más series al fallo, más días de recuperación (`musculos-compartido.md`, 4.2).
- *Se dejaron afuera* los estudios de Barbalho sobre «techo de volumen»: varios se retiraron por datos poco
  confiables.

**Veredicto:** las tres palabras **se sostienen** como dirección; los cortes son **convención**. «Mucho» va en ámbar,
no en rojo: no es dañino, rinde menos por serie.

**La regla:** debajo del estado, una línea. Con «poco», cuántas faltan para 10 (de a 1, redondeado hacia arriba); con
la experiencia `nunca` o `menos6m` y 6 series o más, el texto de principiante.

---

## 7. Lo que no se dice

- «Al fallo» como meta, «sin dolor no hay ganancia» o que doler sea señal de haber crecido.
- Que caminar o estirar «acelera la recuperación» o «limpia» algo.
- «Compensa», «recupera lo de ayer», «come menos», «quema» o «gánate la comida»; nada sobre haber comido de más.
- «Perdiste músculo» por un día de comida o una noche.
- Café a quien no lo toma, o café para «compensar» la noche después del corte.
- «Ya no lo entrenes» o «demasiado» para un músculo en mucho.
- Una hora exacta de melatonina o melatonina en pastillas (`deuda-y-melatonina.md`, 3.5).

---

## 8. Lo que contradice el pedido

1. **El descanso activo como recuperación:** sin respaldo para adelantar la próxima sesión; se sugiere como
   «está bien moverte», no como «te recupera».
2. **Compensar la comida de ayer:** no conviene. La sugerencia de comida mira ayer solo para decir «tu meta de
   siempre» o «proteína en cada comida».
3. **La siesta:** para la fuerza, dos ensayos se contradicen; el «20 minutos» actual (`diagnostico.consejos.siesta`)
   es prudente pero corto para lo físico. Se propone «hasta 30».
4. **Principiante y avanzado:** cambia el número de series, no las repeticiones ni la reserva; lo de «más lejos del
   fallo al empezar» es convención.
5. **El rango de fuerza de Ascent** (5 a 10): liviano para lo que se defiende en los ejercicios grandes (3 a 6).
6. **`recuperado.ts` y `entrenamiento.ts:206`** suman la comida de ayer (proteína y calorías) a la recuperación, y lo
   comido ayer no cambia la sesión de hoy [34][35][36] (`musculos-recuperacion.md`, 5.3, ya lo dice para
   `porLaComida()`).
7. **Los pasos** son salud por observación, no músculo: no van como «recuperación».

---

## 9. La tabla: regla, texto y de dónde sale

Los textos van en `src/textos/es.json` y `en.json` cuando se aprueben en la galería. Entre llaves, lo que se
reemplaza; con los nombres más largos, cada uno tiene que seguir en 90 caracteres o menos (con más de dos músculos,
van los dos con más series).

| Regla | Texto propuesto | De dónde sale |
|---|---|---|
| E1–E3, músculo | Hoy: {pecho y tríceps}. Series de {8} a {12}; para cuando te queden 1 o 2 repeticiones. | Evidencia [1][3][4][6][7][8]; rango y reserva, convención |
| E1–E3, fuerza | Hoy: {sentadilla}. Series de 3 a 6 con peso alto; para cuando te queden 2 o 3. | Evidencia [1][2][3][4]; 3 a 6, derivado |
| E1–E3, principiante | Hoy: {piernas}. Series de {10} a {12}; para cuando te queden 2 o 3. Primero, la técnica. | Convención [1][9] |
| E4, sube | {Press de banca}: llegaste al tope dos veces seguidas. Hoy, sube el peso lo mínimo. | Convención con apoyo (4.3) [16] |
| E4, mantén | {Press de banca}: el mismo peso que la última vez, buscando una repetición más. | Evidencia [17]; doble progresión, convención |
| E5, noche corta | Dormiste poco: mantén el peso y no vayas al fallo. Si sale fácil, sube la próxima. | Evidencia [18]; mantener, convención (4.3) |
| E6, cargado | Tus {piernas} todavía se recuperan: hoy, más liviano y sin llegar al fallo. | Convención; los días, `musculos-compartido.md` 4.2; [53] |
| E7, muchas series | Hoy son {14} series de {pecho}: más de 10 en un día suman poco. Mejor en dos días. | Débil, preprint [11] |
| D1, descanso | Hoy descansas. Caminar o moverte suave está bien: no le quita a tu recuperación. | Evidencia de que no perjudica [25]; de que ayuda, débil [20][23] |
| D2, pasos | Llevas {3.200} pasos. Una caminata de 20 minutos le suma a tu salud, no a tu cansancio. | Observación [26][27]; 5.000 y 20 min, convención |
| D3, cargadas | Hoy, si te mueves, que sea suave: tus {piernas} todavía se recuperan. | Convención |
| D4, dolor (en «En qué se basa») | Si te duele, moverte suave lo alivia un rato, pero no te recupera más rápido. | Evidencia [20][21] |
| C1, energía baja | Estos días comiste poco para lo que entrenas: hoy, intenta llegar a tu meta. | `energia.ts` (Loucks; COI 2023) |
| C2, poca proteína | Ayer te faltó proteína. No hace falta recuperarla: hoy, unos {30} g en cada comida. | Evidencia [28][30]; 80 %, convención |
| C2, sin números | Ayer te faltó proteína. No hace falta recuperarla: hoy, algo de proteína en cada comida. | Igual |
| C3, sesión larga | Hoy entrenas mucho rato: come algo con carbohidratos de 1 a 3 horas antes. | Débil [33][34] |
| C4, pocas calorías | Ayer comiste menos que tu meta. Hoy, la de siempre: no hace falta compensar. | Evidencia [34][35][36][38]; 80 %, convención |
| C5, entrena | Hoy entrenas: en la comida de después, unos {30} g de proteína. | Evidencia (`entreno.md`, 2.1) |
| C6, descansa | Hoy descansas, pero tus músculos siguen creciendo: la proteína de siempre. | Evidencia [32] |
| C7, ayer bien | Ayer llegaste a tu proteína y a tus calorías. Hoy, lo mismo: vas bien. | Convención (90 %) |
| Ayer de más, o nada que decir | Hoy, tu meta de siempre. | Convención (sin culpa) |
| S1, siesta | Si puedes, una siesta corta (hasta 30 min) antes de las 16: tras dormir poco, ayuda. | A medias [45][46][47][48][49] |
| S2, noche corta | Dormiste {5 h 40}. Esta noche, a la cama hacia las {23:30}: antes no ayuda mucho. | `melatonina.ts`; `deuda-y-melatonina.md` 3.5 |
| S3, café | Si tomas café, que sea antes de las {14:00}: más tarde le quita sueño a esta noche. | Evidencia [50][51][52] |
| S4, deuda | Tienes deuda de sueño: la bajan varias noches a tu hora, no una noche larga. | Evidencia [41][42] |
| S5, de siempre | Esta noche, a la cama hacia las {23:30}: es cuando menos te cuesta dormirte. | `melatonina.ts` (estimado, ±1 h) |
| Franja, sin entrenar | Esta semana, todavía sin series. Con una sesión ya empieza a sumar. | Convención |
| Franja, poco | Crece, pero le faltan series: con unas {4} más por semana, crecería más. | Evidencia [10][14] |
| Franja, poco, principiante | Para empezar está bien: de 6 a 10 series por semana ya alcanzan. | Convención de Ascent |
| Franja, en su punto | En su punto: sigue entrenándolo así y sube el peso cuando toque. | Convención (10 a 20) |
| Franja, mucho | Mucho: más series ya suman poco. Si te cuesta recuperarte, vuelve a unas 20. | Evidencia [1][10][12][13] |

---

## 10. Fuentes

Leídas el 19/11/2026. «Resumen»: el resumen (casi siempre en Europe PMC o PubMed); «texto»: partes del texto
completo; «revisada»: la leyó otro estudio y no se volvió a abrir.

**Repeticiones, esfuerzo y volumen**
1. Currier BS y otros (ACSM). 2026. *Resistance Training Prescription for Muscle Function, Hypertrophy, and
   Physical Performance in Healthy Adults: An Overview of Reviews.* Med Sci Sports Exerc 58(4):851-872.
   https://doi.org/10.1249/mss.0000000000003897 — texto (PMC12965823: carga, fallo, reserva, series, frecuencia y
   experiencia).
2. Currier BS y otros. 2023. *Resistance training prescription for muscle strength and hypertrophy in healthy
   adults: a systematic review and Bayesian network meta-analysis.* Br J Sports Med 57(18):1211-1220.
   https://doi.org/10.1136/bjsports-2023-106807 — resumen.
3. Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. 2017. *Strength and Hypertrophy Adaptations Between Low- vs.
   High-Load Resistance Training: A Systematic Review and Meta-analysis.* J Strength Cond Res 31(12):3508-3523.
   https://doi.org/10.1519/JSC.0000000000002200 — resumen.
4. Lopez P y otros. 2021. *Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic
   Review and Network Meta-analysis.* Med Sci Sports Exerc 53(6):1206-1216.
   https://doi.org/10.1249/MSS.0000000000002585 — resumen.
5. Lasevicius T y otros. 2018. *Effects of different intensities of resistance training with equated volume load on
   muscle strength and hypertrophy.* Eur J Sport Sci 18(6):772-780. https://doi.org/10.1080/17461391.2018.1450898 —
   resumen.
6. Robinson ZP y otros. 2024. *Exploring the Dose–Response Relationship Between Estimated Resistance Training
   Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions.* Sports Med 54(9).
   https://doi.org/10.1007/s40279-024-02069-2 — resumen.
7. Grgic J, Schoenfeld BJ, Orazem J, Sabol F. 2022. *Effects of resistance training performed to repetition failure
   or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis.* J Sport Health Sci
   11(2):202-211. https://doi.org/10.1016/j.jshs.2021.01.007 — resumen.
8. Refalo MC y otros. 2024. Fallo contra 1 o 2 de reserva, 8 semanas, en entrenados.
   https://pubmed.ncbi.nlm.nih.gov/38393985/ — revisada (la investigación de Ascent).
9. Halperin I y otros. 2022. *Accuracy in Predicting Repetitions to Task Failure in Resistance Exercise: A Scoping
   Review and Exploratory Meta-analysis.* Sports Med 52(2):377-390. https://doi.org/10.1007/s40279-021-01559-x —
   resumen.
10. Pelland JC y otros. 2026. *The Resistance Training Dose Response.* Sports Med 56(2):481-505.
    https://doi.org/10.1007/s40279-025-02344-w — revisada.
11. Remmert JF y otros (con Pelland, Robinson y Zourdos). 2025. *Is There Too Much of a Good Thing?
    Meta-Regressions of the Effect of Per-Session Volume on Hypertrophy and Strength.* SportRxiv (preprint, sin
    revisión de pares). https://sportrxiv.org/index.php/server/preprint/view/537 — el comunicado de la universidad
    (EurekAlert, 10/6/2025) y resúmenes de terceros; el texto no se pudo abrir.
12. Aube D y otros. 2022. *Progressive Resistance Training Volume: Effects on Muscle Thickness, Mass, and Strength
    Adaptations in Resistance-Trained Individuals.* J Strength Cond Res 36(3):600-607.
    https://doi.org/10.1519/JSC.0000000000003524 — resumen.
13. Heaselgrave SR y otros. 2019. Volumen y frecuencia por semana en hombres entrenados.
    https://pubmed.ncbi.nlm.nih.gov/30160627/ — revisada (la investigación de Ascent).
14. Schoenfeld BJ, Ogborn D, Krieger JW. 2017. Dosis-respuesta del volumen semanal y el músculo.
    https://pubmed.ncbi.nlm.nih.gov/27433992/ — revisada (la investigación de Ascent).
15. Spiering BA, Mujika I, Sharp MA, Foulis SA. 2021. *Maintaining Physical Performance: The Minimal Dose of
    Exercise Needed to Preserve Endurance and Strength Over Time.* J Strength Cond Res 35(5):1449-1458.
    https://doi.org/10.1519/jsc.0000000000003964 — resumen.
16. Hickmott LM y otros. 2022. *The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy.*
    Sports Med Open 8:9. https://doi.org/10.1186/s40798-021-00404-9 — revisada.
17. Plotkin D y otros. 2022. *Progressive overload without progressing load?* PeerJ 10:e14142.
    https://doi.org/10.7717/peerj.14142 — revisada (un autor asesora a un fabricante de máquinas).
18. Craven J y otros. 2022. *Effects of Acute Sleep Loss on Physical Performance.* Sports Med 52(11):2669-2690.
    https://doi.org/10.1007/s40279-022-01706-y — revisada.
19. Morán-Navarro R y otros. 2017. *Time course of recovery following resistance training leading or not to
    failure.* Eur J Appl Physiol 117(12):2387-2399. https://doi.org/10.1007/s00421-017-3725-7 — revisada.

**Descanso activo y pasos**
20. Dupuy O, Douzi W, Theurot D, Bosquet L, Dugué B. 2018. *An Evidence-Based Approach for Choosing Post-exercise
    Recovery Techniques to Reduce Markers of Muscle Damage, Soreness, Fatigue, and Inflammation: A Systematic Review
    With Meta-Analysis.* Front Physiol 9:403. https://doi.org/10.3389/fphys.2018.00403 — texto (PMC5932411: los
    resultados de la recuperación activa).
21. Zainuddin Z, Sacco P, Newton M, Nosaka K. 2006. *Light concentric exercise has a temporarily analgesic effect on
    delayed-onset muscle soreness, but no effect on recovery from eccentric exercise.* Appl Physiol Nutr Metab
    31(2):126-134. https://doi.org/10.1139/h05-010 — resumen.
22. Van Hooren B, Peake JM. 2018. *Do We Need a Cool-Down After Exercise? A Narrative Review of the
    Psychophysiological Effects and the Effects on Performance, Injuries and the Long-Term Adaptive Response.* Sports
    Med 48(7):1575-1595. https://doi.org/10.1007/s40279-018-0916-2 — resumen.
23. Bartolomei S, Totti V, Griggio F, Malerba C, Ciacci S, Semprini G, Di Michele R. 2021. *Upper-Body Resistance
    Exercise Reduces Time to Recover After a High-Volume Bench Press Protocol in Resistance-Trained Men.* J Strength
    Cond Res 35(Suppl 1):S180-S187. https://doi.org/10.1519/jsc.0000000000002960 — resumen.
24. Park KS. 2026. *Effects of Different Recovery Modalities on Performance and Recovery Following High-Volume
    Resistance Training.* Tesis doctoral, East Tennessee State University (sin revisión de pares).
    https://dc.etsu.edu/etd/4737/ — resumen.
25. Schumann M y otros. 2022. *Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size
    and Function: An Updated Systematic Review and Meta-Analysis.* Sports Med 52(3):601-612.
    https://doi.org/10.1007/s40279-021-01587-7 — resumen.
26. Paluch AE y otros. 2022. *Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts.*
    Lancet Public Health 7(3):e219-e228. https://doi.org/10.1016/S2468-2667(21)00302-9 — resumen.
27. Ding D y otros. 2025. *Daily steps and health outcomes in adults: a systematic review and dose-response
    meta-analysis.* Lancet Public Health. https://doi.org/10.1016/S2468-2667(25)00164-1 — resumen y prensa (los
    porcentajes por enfermedad no coinciden entre medios: no se usan).

**Comida**
28. Morton RW y otros. 2018. *A systematic review, meta-analysis and meta-regression of the effect of protein
    supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.* Br J Sports
    Med 52(6):376-384. https://doi.org/10.1136/bjsports-2017-097608 — revisada.
29. Nunes EA y otros. 2022. *Systematic review and meta-analysis of protein intake to support muscle mass and
    function in healthy adults.* J Cachexia Sarcopenia Muscle 13(2):795-810. https://doi.org/10.1002/jcsm.12922 —
    revisada (fondos de la industria de la carne y los lácteos).
30. Schoenfeld BJ, Aragon AA. 2018. *How much protein can the body use in a single meal for muscle-building?* J Int
    Soc Sports Nutr 15:10. https://doi.org/10.1186/s12970-018-0215-1 — revisada (`entreno.md`).
31. Trommelen J y otros. 2023. *The anabolic response to protein ingestion during recovery from exercise has no upper
    limit in magnitude and duration in vivo in humans.* Cell Rep Med 4(12):101324.
    https://doi.org/10.1016/j.xcrm.2023.101324 — revisada (`entreno.md`).
32. Burd NA y otros. 2011. *Enhanced amino acid sensitivity of myofibrillar protein synthesis persists for up to 24 h
    after resistance exercise in young men.* J Nutr 141(4):568-573. https://doi.org/10.3945/jn.110.135038 — resumen.
33. King A y otros. 2022. *The Ergogenic Effects of Acute Carbohydrate Feeding on Resistance Exercise Performance.*
    Sports Med 52(11):2691-2712. https://doi.org/10.1007/s40279-022-01716-w — revisada.
34. King A, Jukic I, Sousa CA, Zinn C, Helms ER. 2025. *Isoenergetic Pre-Exercise Meals Varying in Carbohydrate
    Similarly Affect Resistance Training Volume Performance Compared to Placebo.* Eur J Sport Sci 25(3):e12274.
    https://doi.org/10.1002/ejsc.12274 — revisada.
35. Stratton MT y otros. 2024. *No Effect of Breakfast Consumption Observed for Afternoon Resistance Training
    Performance.* J Acad Nutr Diet 124(8):995-1013. https://doi.org/10.1016/j.jand.2023.09.008 — revisada.
36. Henselmans M y otros. 2022. *The Effect of Carbohydrate Intake on Strength and Resistance Training Performance: A
    Systematic Review.* Nutrients 14(4):856. https://doi.org/10.3390/nu14040856 — revisada.
37. Murphy C, Koehler K. 2022. *Energy deficiency impairs resistance training gains in lean mass but not strength.*
    Scand J Med Sci Sports 32(1):125-137. https://doi.org/10.1111/sms.14075 — revisada.
38. Cioffi I y otros. 2018. *Intermittent versus continuous energy restriction on weight loss and cardiometabolic
    outcomes: a systematic review and meta-analysis of randomized controlled trials.* J Transl Med.
    https://doi.org/10.1186/s12967-018-1748-4 — resumen.
39. Simpson CC, Mazzeo SE. 2017. *Calorie counting and fitness tracking technology: Associations with eating disorder
    symptomatology.* Eat Behav 26:89-92. https://doi.org/10.1016/j.eatbeh.2017.02.002 — resumen.
40. Levinson CA, Fewell L, Brosof LC. 2017. *My Fitness Pal calorie tracker usage in the eating disorders.* Eat Behav
    27:14-16. https://doi.org/10.1016/j.eatbeh.2017.08.003 — resumen.

**Sueño**
41. Banks S, Van Dongen HPA, Maislin G, Dinges DF. 2010. *Neurobehavioral dynamics following chronic sleep
    restriction: dose-response effects of one night for recovery.* Sleep 33(8):1013-1026.
    https://doi.org/10.1093/sleep/33.8.1013 — revisada (`deuda-y-melatonina.md`).
42. Kitamura S y otros. 2016. *Estimating individual optimal sleep duration and potential sleep debt.* Sci Rep
    6:35812. https://doi.org/10.1038/srep35812 — revisada (`deuda-y-melatonina.md`).
43. Bonnar D, Bartel K, Kakoschke N, Lang C. 2018. *Sleep Interventions Designed to Improve Athletic Performance and
    Recovery: A Systematic Review of Current Approaches.* Sports Med 48(3):683-703.
    https://doi.org/10.1007/s40279-017-0832-x — resumen.
44. Cunha LA y otros. 2023. *The Impact of Sleep Interventions on Athletic Performance: A Systematic Review.* Sports
    Med Open 9:58. https://doi.org/10.1186/s40798-023-00599-z — resumen.
45. Mesas AE y otros. 2023. *Is daytime napping an effective strategy to improve sport-related cognitive and physical
    performance and reduce fatigue? A systematic review and meta-analysis of randomised controlled trials.* Br J
    Sports Med 57(7):417-426. https://doi.org/10.1136/bjsports-2022-106355 — resumen.
46. Brotherton EJ y otros. 2019. *Effects of two nights partial sleep deprivation on an evening submaximal
    weightlifting performance; are 1 h powernaps useful on the day of competition?* Chronobiol Int 36(3):407-426.
    https://doi.org/10.1080/07420528.2018.1552702 — resumen.
47. Gallagher C, Green CE, Kenny ML, Evans JR, McCullagh GDW, Pullinger SA, Edwards BJ. 2023. *Is implementing a
    post-lunch nap beneficial on evening performance, following two nights partial sleep restriction?* Chronobiol Int
    40(9):1169-1186. https://doi.org/10.1080/07420528.2023.2253908 — resumen.
48. Brooks A, Lack L. 2006. *A brief afternoon nap following nocturnal sleep restriction: which nap duration is most
    recuperative?* Sleep 29(6):831-840. https://doi.org/10.1093/sleep/29.6.831 — revisada (`momentos.md`).
49. Mograss M y otros. 2022. *The effects of napping on night-time sleep in healthy young adults.* J Sleep Res
    31(5):e13578. https://doi.org/10.1111/jsr.13578 — revisada (`momentos.md`).
50. Irwin C, Khalesi S, Desbrow B, McCartney D. 2020. *Effects of acute caffeine consumption following sleep loss on
    cognitive, physical, occupational and driving performance: A systematic review and meta-analysis.* Neurosci
    Biobehav Rev 108:877-888. https://doi.org/10.1016/j.neubiorev.2019.12.008 — resumen.
51. Cook CJ y otros. 2011. *Skill execution and sleep deprivation: effects of acute caffeine or creatine
    supplementation - a randomized placebo-controlled trial.* J Int Soc Sports Nutr 8:2.
    https://doi.org/10.1186/1550-2783-8-2 — resumen.
52. Gardiner C y otros. 2023. *The effect of caffeine on subsequent sleep: A systematic review and meta-analysis.*
    Sleep Med Rev 69:101764. https://doi.org/10.1016/j.smrv.2023.101764 — revisada (`entreno.md`).

**El descanso entre sesiones**
53. Yang Y, Bay PB, Wang YR, Huang J, Teo HWJ, Goh J. 2018. *Effects of Consecutive Versus Non-consecutive Days of
    Resistance Training on Strength, Body Composition, and Red Blood Cells.* Front Physiol 9:725.
    https://doi.org/10.3389/fphys.2018.00725 — resumen.

**Lo que se buscó y no se encontró:** un ensayo de caminar o andar en bici suave el día de descanso contra el
rendimiento del día siguiente en gente que entrena fuerza (los dos que aparecieron usan series livianas del mismo
músculo [23][24]); un estudio de compensar al día siguiente la proteína o las calorías que faltaron; un ensayo grande
de entrenar un músculo antes de que se recupere (aparecieron [53] y uno de 19 hombres, de 2005, que no se leyó); y uno
de la siesta contra la fuerza con más de 15 personas. No se revisaron las declaraciones de conflictos de interés de
[2] a [7], [11], [12], [20] a [27], [43] a [51] ni [53].
