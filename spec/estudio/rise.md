# Cómo hace RISE lo del sueño

Investigación en la web del 17/11/2026, sin tocar el repo. Sirve para entender por qué Moss dice 16 h 30 de
deuda y Rise 4 h con el mismo teléfono.

**Qué leí.** El centro de ayuda entero de Rise (77 artículos; la página devuelve 403 a los lectores
automáticos, así que lo leí por su API pública de Zendesk: `https://help.risescience.com/api/v2/help_center/en-us/articles.json`),
unas 45 páginas de risescience.com (blog, guía, preguntas frecuentes, `llms.txt`), el código de la calculadora
de deuda que Rise tiene publicada en su sitio, la ficha de la App Store con sus capturas de iPhone y iPad,
versiones de 2021 a 2024 de la ayuda en Wayback Machine, un recorrido de 170 pantallas de la app descrito por
un tercero y cinco reseñas externas.

**Cómo leer la confianza de cada cosa:**

- **Confirmado**: lo dice Rise en una fuente propia (ayuda, blog, ficha, captura oficial).
- **De terceros**: lo dice una reseña o un catálogo de pantallas; puede estar viejo o mal descrito.
- **Inferencia**: lo deduzco yo de lo anterior; lo marco siempre.
- **No confirmado**: lo busqué y no está publicado. Lista completa en la sección 8.

Los textos de Rise están parafraseados; las etiquetas de pantalla van en inglés, tal cual se ven.

---

## 0. Lo esencial

1. **La deuda de Rise no es la suma de lo que faltó en 14 noches.** Es una suma con pesos que caen noche a
   noche: anoche pesa 1 y la noche 14 pesa 0,16. Los pesos suman **6,5**, no 14. Por eso anoche es el 15 % y
   las otras trece el 85 %, como dice Rise. Los pesos exactos están en el JavaScript de su calculadora
   pública [C1].
2. **Con esos pesos**, quien necesita 8 h y duerme 7 h todas las noches tiene **6 h 30** de deuda (no 14 h), y
   quien duerme 6 h tiene **13 h** (no 28 h). Con un déficit parejo, una suma simple da 2,15 veces más; si las
   últimas noches fueron buenas, la diferencia es mucho mayor.
3. **Dormir de más descuenta** (en la calculadora, con el mismo peso de esa noche), las **siestas cuentan**
   igual que la noche, y el total nunca baja de cero [C1][H1][H4].
4. **La necesidad de sueño** sale de hasta 365 noches buscando «rebote» (dormir más de lo habitual después de
   noches cortas), con topes que no publican; se puede cambiar a mano [H9][H11].
5. **La ventana de melatonina** es una hora: calculan la hora en que empieza a subir la melatonina (DLMO) con
   un modelo matemático de temperatura corporal, las horas de sueño y la luz inferida; le suman 1,55 h y
   toman 30 min para cada lado [B7].
6. **Sin reloj**, Rise mira el movimiento del teléfono, los pasos y la actividad de la pantalla: cuándo lo
   dejaste a la noche y cuándo lo volviste a agarrar. Ellos mismos dicen que acierta más o menos el 80 % de
   las veces y que **tiende a contar de más** (quieto y despierto cuenta como dormido) [H13][H2][H16].
7. **Todos los relojes y anillos entran por Apple Health en iPhone.** Si el aparato mandó datos, Rise los usa;
   la noche que falta, vuelve solo al teléfono [H12][H22].
8. **En pantalla**: un círculo con el número en horas con un decimal y «Sleep debt», al lado cuánto cambió
   desde ayer, y abajo la noche con de dónde salió: «RISE Sleep Detection (Phone movement)» y «30m buffer» [A2].

---

## 1. La deuda de sueño

### 1.1 Lo que Rise dice con palabras (confirmado)

- Compara cada noche lo dormido contra tu necesidad, sobre las **últimas 14 noches**, en ventana móvil: cada
  día sale la más vieja y entra una nueva [H1][H2][H7].
- Si dormiste menos que tu necesidad, la diferencia suma; **si dormiste más, ayuda a bajarla** [H1].
- **Las noches recientes pesan más.** Una noche corta de hace dos o tres días sube la deuda más que la misma
  noche de hace doce [H1][H2].
- **Anoche pesa el 15 %** y las 13 anteriores el 85 %, con más peso para las más recientes. Está en el blog
  (escrito por el cofundador) y repetido en varias páginas [B1][B2][B3][B4]. Tu dato del 15 y el 85 queda
  confirmado.
- El blog aclara que el método es, textualmente, «a product choice, not a published formula» [B1]: la
  ventana de 14 días es cómo convierten los estudios de Van Dongen y Kitamura en un número.
- Se recalcula **cada mañana** [B1][H1]. Editar una noche recalcula la deuda [H21]. Cambiar la necesidad a
  mano la cambia al instante [H11]. Si Rise te sube la necesidad, la deuda sube aunque duermas igual [H2].
- Cuenta **tiempo dormido, no tiempo en cama**: resta lo que detecta como despierto [H3]. De los relojes usa
  solo la fase «despierto» para sacar el total y descarta el resto de las fases (ayuda de 2022) [W2].
- Rise explica por qué su número no coincide con el de otra app con cuatro razones: otra necesidad, otra
  ventana (7 noches o solo anoche), otros pesos y medir cama en vez de sueño [H3].

### 1.2 La fórmula de su calculadora pública (confirmado en el código)

Las páginas `/blog/sleep-debt`, `/blog/what-is-sleep-debt`, `/blog/sleep-debt-calculator` y la versión en
español `/es/blog/calculadora-de-sueno` traen una calculadora cuyo JavaScript está a la vista [C1][C2][C3].
Hace esto:

```
PESOS = [1, 0.87, 0.75, 0.65, 0.56, 0.49, 0.42, 0.37, 0.32, 0.28, 0.24, 0.21, 0.18, 0.16]
         anoche                                                            hace 14 noches

deuda = máx(0, Σ PESOS[k] × (necesidad − dormido[k]))      en horas, redondeada a un decimal
```

- Es una **suma ponderada** (con pesos), no un promedio: no divide por nada.
- Los pesos suman **6,50**. Anoche es 1 / 6,5 = **15,4 %** y las otras trece, 84,6 %. Coincide con el 15 %
  que el blog da como exacto [B2].
- Los pesos caen casi como una exponencial de razón 0,87 por noche (vida media de unas 4,9 noches). Las
  últimas 3 noches son el 40 % del número, las últimas 4 el 50 % y la última semana el 73 %.

| Noche | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Peso | 1 | 0,87 | 0,75 | 0,65 | 0,56 | 0,49 | 0,42 | 0,37 | 0,32 | 0,28 | 0,24 | 0,21 | 0,18 | 0,16 |
| % del total | 15,4 | 13,4 | 11,5 | 10,0 | 8,6 | 7,5 | 6,5 | 5,7 | 4,9 | 4,3 | 3,7 | 3,2 | 2,8 | 2,5 |

- La diferencia entra con su signo: una noche de más resta, con el peso de esa noche. El piso en cero es
  sobre el total, no por noche. La página lo dice: si quedás a favor, el resultado es cero, y la ventana no
  guarda crédito del mes pasado [C2].
- La página dice que es el mismo método de 14 noches de su explicación de la deuda y la misma ventana que usa
  la app, y que las tres bandas del resultado son las que usan en la app [C2].

### 1.3 Lo que sigue sin estar publicado

- **Que la app use exactamente estos 14 números: no confirmado.** Rise dice que la fórmula de la app no está
  publicada [B1]. Lo que sí cierra: los pesos de la calculadora dan justo el 15 % y el 85 % que Rise declara
  para la app, y la calculadora se presenta como el mismo método. **Inferencia razonable:** la app usa estos
  pesos o unos muy parecidos. Si la app difiere, lo esperable es en detalles (minutos en vez de cuartos de
  hora, la necesidad al minuto), no en la forma.
- **Noches sin datos: no confirmado** (ver 1.5).

### 1.4 Ejemplos (calculados con esos pesos)

| Caso (necesidad 8 h) | Deuda con los pesos de Rise | Suma simple de 14 noches |
|---|---|---|
| Duerme 7 h todas las noches | **6 h 30** | 14 h |
| Duerme 6 h todas las noches | **13 h 00** | 28 h |
| Duerme 7 h 30 todas las noches | 3 h 15 | 7 h |
| Una sola noche de 4 h, anoche (el resto, 8 h) | 4 h 00 | 4 h |
| La misma noche de 4 h, hace 7 noches | 1 h 41 | 4 h |
| La misma noche de 4 h, hace 14 noches | 0 h 38 | 4 h |
| 7 h siempre, y anoche 10 h | 3 h 30 | 11 h |
| 7 h siempre, y las dos últimas noches 9 h | 2 h 46 | 10 h |

- El ejemplo que da Rise: necesidad de 8 h 15 y 7 h por noche durante dos semanas dan unas 8 horas de deuda
  [C2]. Con los pesos: 6,5 × 1,25 = 8,1 h, que es el número que la calculadora muestra de entrada.
- **El caso más ilustrativo está en el propio blog de Rise.** Publica una tabla de 14 noches (necesidad
  8 h 10, semana corta y fines de semana largos) y la resuelve con suma simple: 6 h 15. Avisa que el número de
  la app no va a coincidir porque pesa más lo reciente [B1]. Con los pesos de la calculadora esa misma tabla
  da **1 h 17**, porque las dos últimas noches fueron de más. Misma persona, mismas noches: 6 h 15 contra
  1 h 17.
- Para quedar por debajo de 5 h con un déficit parejo, alcanza con dormir hasta 46 min menos que la necesidad
  cada noche; con 92 min menos por noche se llega a 10 h.

### 1.5 Dormir de más, siestas, noches sin datos

- **Dormir de más**: descuenta (confirmado, [H1][C2]). No hay tope publicado a cuánto descuenta una noche.
- **Siestas**: cuentan para el total dormido y bajan la deuda igual que el sueño de la noche [H4][H5].
  Rise **no las detecta sola** con el teléfono; un reloj puede traerlas pero no es confiable, así que piden
  anotarlas a mano («+ Nap» en la pantalla principal) [H4][H5]. El sueño de día de quien trabaja de noche
  tampoco se detecta: se anota como siesta [H48].
- **Noches sin datos: no confirmado cómo entran en la cuenta.** Lo que hay:
  - Rise insiste en que casi no existen: si faltó el reloj, la noche se llena con el teléfono, para que la
    ventana de 14 noches no quede en blanco [B6][B5].
  - Si igual faltó una noche, la ayuda pide anotarla a mano para que la deuda siga siendo correcta [H15]. Se
    puede editar hasta 14 días atrás [H21].
  - La pestaña Progress muestra un aviso de datos faltantes (de terceros, [T1]).
  - En la calculadora web, un casillero vacío vale 0 h dormidas, o sea que suma la necesidad entera de esa
    noche [C1]. Es un formulario, no la app: no sirve para afirmar qué hace la app.
- **Sin botón de reinicio**: lo viejo sale solo a los 14 días [H7].

### 1.6 Qué número es bajo o alto

- Recomendación de Rise: **menos de 5 horas** [H1][H8][B1]. Tu dato queda confirmado. Cero es lo ideal pero
  no lo ponen como meta, para que no estrese [B1][H1].
- La calculadora, con las bandas que según la página son las de la app [C1][C2]:
  - menos de 5 h: el rango buscado;
  - de 5 a 10 h: se nota;
  - más de 10 h: es mucho, y se paga con varias noches más largas, no con una.
- Dicen que no existe un corte oficial de deuda alta ni un máximo acumulable [C2][B2].
- En la app, las reseñas hablan de rangos con nombre: 4,8 h figuraba como deuda baja (2022) [T2] y otra
  persona pasó de «high» a «okay» en dos noches (2025) [T3]. Los cortes exactos de esas etiquetas dentro de la
  app: no confirmados (ver sección 7).

---

## 2. La necesidad de sueño («sleep need»)

- **Método (confirmado):** analiza **hasta 365 noches** de tus datos y busca **rebote de sueño**: períodos en
  que dormís más de lo habitual después de tramos de sueño corto. Eso, dicen, revela la necesidad biológica y
  no lo que dormís de costumbre [H9][H1].
- **Topes:** aplica un máximo y un mínimo que dice basados en investigación revisada por pares, para que no salga un
  número irreal aunque vengas durmiendo poco hace años [H9][H1]. **Los valores de esos topes no están
  publicados** (una reseña de 2026 señala lo mismo [T4]).
- **De dónde viene la idea (ayuda de 2021):** el estudio de dormir sin límite 9 días (la gente se estabilizó
  en unas 8,4 h, rango 7 h 17 a 9 h 16) y la relación entre el rebote de la primera noche y el déficit
  habitual. En la práctica comparan fin de semana contra días de semana [W1].
- **Datos que usa** [H9]:
  - obligatorios: movimiento y actividad del teléfono, y pasos;
  - opcionales por Apple Health: sueño de un reloj o app, minutos de ejercicio y entrenamientos, y tiempo a
    la luz del día.
- **Desde el primer día:** Rise dice que al instalarla trae el historial del teléfono y ya te da necesidad,
  deuda y hora de acostarte [B8]. El blog habla de un año de datos de uso del teléfono [B2].
  - **Inferencia:** ese año tiene que salir de Apple Health (pasos del iPhone y sueño), porque Core Motion
    solo guarda los últimos siete días de actividad [X1]. Rise no explica el mecanismo.
- **Cuándo cambia:** no se actualiza con horario fijo, solo cuando los datos dan una señal clara. Sube si hay
  rebote sostenido y baja si dormís menos que la estimación sin mostrar rebote. Que quede igual durante meses
  es normal [H9][H10].
- **Rango típico:** la ayuda dice que la mayoría de los adultos necesita entre 7,5 y 9 h [H9]. Con datos de
  1,95 millones de usuarios de 24 años o más: de **5 h a 11 h 30**, mediana **8 h**, y el 48 % necesita 8 h
  o más [B1][C2]. Lo dan al minuto.
- **A mano: sí.** Profile › My sleep need › Adjust, con «+» y «−», y guardar. Cambia la deuda al instante.
  Recomiendan esperar una o dos semanas antes de tocarla [H11]. También sugieren bajarla si el número de
  deuda te estresa en una etapa en que no podés dormir más [H45].
- Si no sabés la tuya, la calculadora arranca en **8 h 15** [C1][C2].
- En la entrada, la app muestra la necesidad calculada (8 h 30 en el recorrido) con un botón para confirmarla
  y otro para ajustarla con un deslizador (de terceros, [T1]).

---

## 3. La ventana de melatonina y los hitos del día

### 3.1 Qué es y cuánto dura

- Es la franja de **más o menos una hora** en que el cuerpo produce melatonina al ritmo más alto. Rise la
  presenta como la hora ideal de acostarse: ahí cuesta menos dormirse y seguir dormido [B7][B9][L1].
- Dura **una hora justa**. En las capturas oficiales se lee 12:08a–1:08a [A3]; en el recorrido, 12:20a–1:20a
  [T1].
- **Es la recomendación de hora de acostarse de Rise**: la ayuda las usa como sinónimos [H35].

### 3.2 Cómo la calculan (confirmado, artículo de 2023)

1. Estiman el **DLMO** (el momento en que empieza a subir la melatonina con poca luz) con el **modelo
   matemático de St. Hilaire** de la temperatura corporal, la **luz inferida** y las **horas de sueño** [B7].
2. Le suman **1,55 horas** (la investigación ubica la hora ideal de acostarse unas dos horas después del
   DLMO) [B7].
3. Toman **30 minutos antes y 30 después**: esa es la ventana de una hora [B7].

O sea: ventana = DLMO + 1 h 03 hasta DLMO + 2 h 03.

- La luz no se mide: se **infiere** de las horas de sueño y de la ubicación [B10][B7].
- El modelo general de energía está construido sobre **SAFTE** (del Departamento de Transporte y el de
  Defensa de EE. UU.), dentro del modelo de dos procesos: deuda y ritmo circadiano [B7][B11][G1].
- La ayuda actual lo resume como un modelo biomatemático que combina tus horas de sueño recientes con la luz
  y la actividad, y que mejora cuantas más noches junta [H37].
- Un artículo más viejo dice que el DLMO marca el *comienzo* de la ventana [B12]. Contradice al de 2023, que
  es el que da números; me quedo con ese.

### 3.3 Cómo cambia de un día a otro

- Se corre **todos los días** según tus horas de sueño recientes [B12][B13][H34]. El ritmo circadiano se
  mueve despacio, en algunos casos hasta una hora por día [G2].
- **La hora de despertarte manda**: cambiar el objetivo de hora de despertar (o la hora del despertador de
  Rise, que lo actualiza) recalcula la ventana y el día de energía [H35][H39][H40].
- Para moverla proponen acostarse unos **15 minutos** antes o después cada noche; tarda varios días [H34].
- Con horarios irregulares la ventana refleja esa variación y deja de ser una guía confiable; con jet lag se
  ajusta más o menos un día por hora de diferencia [H34][H36][H48].
- Si parece mal, lo primero que piden es corregir las noches mal detectadas; hay un cuestionario guiado en
  Tools › Melatonin Window («Data seem off?») [H34].
- **El «9 min antes» / «7 min más tarde»:** la captura oficial de iPad muestra el patrón. Al tocar un tramo
  del día aparece su horario y al lado «20m earlier · Since yesterday»; debajo, la duración con «20m longer ·
  Since yesterday», y arriba la hora de la última actualización («Updated: today 6:12a») [A3]. Que la ventana
  de melatonina use esa misma tarjeta: no confirmado con captura, pero es el mismo componente.

### 3.4 Los otros hitos del día («Energy Schedule»)

En orden, según la ayuda, la guía y las capturas [H38][G2][A3][A4]:

| Hito | Qué es | Dato |
|---|---|---|
| Wake zone | La hora en que el cuerpo quiere despertarse | Según necesidad y reloj biológico [C3] |
| Grogginess | Inercia del sueño al despertar | **Unos 90 min**; Rise predice hora y duración cada mañana [H38][B14] |
| Morning peak | Primer pico de energía y foco | Para lo más difícil [H38] |
| Afternoon dip | Bajón de la tarde | Ocurre comas o no; buen momento para la siesta [H38][W6] |
| Evening peak | Segundo pico | Para tareas difíciles o entrenar [H38] |
| Wind-down | El cuerpo empieza a prepararse para dormir | Ahí empieza lo de evitar la luz azul; va después del pico de la tarde y antes de la ventana [H38][B15] |
| Melatonin Window | La hora de acostarse | Una hora [B7] |

- Un ejemplo real de una reseña de 2025: pico de la mañana 8:15–11:30, bajón 13:37–15:41, pico de la tarde
  17:00–20:15, wind-down desde las 20:34 [T5].
- **La deuda no mueve los horarios sino la intensidad**: con deuda alta los picos se sienten más bajos y los
  bajones más hondos [H37][G2]. El «Energy potential» es un puntaje de 0 a 100 atado directo a la deuda [B5].
- El ejercicio no redibuja la curva; después de entrenar muestra un «energy boost» en el tramo actual (lee
  entrenamientos de Apple Health) [H47].
- Todo esto se puede mandar al calendario de Apple o de Google, y hay widgets [H43][H44].
- Para la hora en cama, Rise sugiere sumar entre 30 min y una hora a la necesidad, por lo que se tarda en
  dormirse y lo despierto de la noche [C3].

---

## 4. La detección sin reloj

### 4.1 Los modos

Rise tiene tres modos de detección más los aparatos [H12][B6][B5]:

1. **Movimiento del teléfono, automático** (el de fábrica; en la app se llama «Nightstand»). Usa el
   **movimiento, los pasos y la actividad de la pantalla** del teléfono para estimar cuándo te dormiste y
   cuándo te despertaste. Corre solo, sin tocar nada.
2. **Micrófono desde la mesa de noche** (opcional): hay que iniciarlo cada noche [B6][B5]. En el recorrido se
   ve el modo Nightstand con dos interruptores, movimiento y sonido, un botón «Tap at Bedtime» y un aviso de
   dejarlo enchufado (de terceros, [T1]).
3. **Colchón**: el teléfono sobre el colchón, cerca del cuerpo y no bajo la almohada; usa el acelerómetro.
   También se inicia cada noche; si te olvidás, vuelve al modo automático [H12].
4. **Reloj o anillo**, por Apple Health (sección 5).

El micrófono y el colchón son solo de iOS [B5].

### 4.2 Cómo estima dormirse y despertarse con el teléfono

- La idea, en palabras de Rise: la mayoría toca el teléfono poco antes de dormirse y poco después de
  despertarse. Lo que miden es la ventana entre que lo dejás y lo volvés a agarrar, y el tramo quieto del
  medio [G3][B16].
- En el blog lo llaman **«tappigraphy»**: el último toque de la noche y el primero de la mañana [B6]. Para
  decir que el teléfono es muy preciso citan un estudio de 2019 [L1]; según su resumen, con 79 personas y
  unas 1.400 noches, los toques de pantalla estimaron las horas de dormirse y despertarse casi igual que la
  actigrafía de muñeca [X2]. Ese estudio fue con Android y con una app que registraba cada toque.
- El teléfono tiene que estar **al alcance del brazo**: mesa de noche, colchón o almohada. En otro cuarto no
  registra nada [H15][H12].
- **Precisión que declaran: más o menos el 80 % de las veces** [H13]. Es un número propio, sin validación
  independiente publicada.
- El algoritmo no está publicado: la ayuda solo dice que hay uno detrás [H13]. Cómo consigue Rise la «actividad
  de pantalla» en iOS: no confirmado.

### 4.3 Dónde se equivoca (lo dice Rise)

- **Cuenta de más cuando estás quieto y despierto**: si dejás el teléfono mucho antes de dormirte, ese rato
  cuenta como sueño [H12][H16].
- **No ve los despertares si no tocás el teléfono**: sigue contando como sueño seguido, así que el total
  puede salir más alto que el real. Los relojes sí restan esos ratos. Por eso cambiar de reloj a teléfono, o
  al revés, mueve la deuda [H2].
- **Agarrar el teléfono de madrugada** puede hacerle creer que ya te despertaste, cortar la noche o partirla
  en dos [H17].
- Un movimiento que no es despertarse (darte vuelta, una mascota, tu pareja) puede figurar como despertar
  [H18].
- Recomiendan no forzar el cierre de la app: si la cerrás deslizando, el teléfono no le entrega sueño ni
  actividad hasta que la abras [H46].

### 4.4 El margen («Sleep Detection Buffer»)

- **Qué es:** un margen para quien suele tardar entre dejar el teléfono y dormirse; se agrega en la app
  [H13]. Está en la ayuda desde 2021 [W7].
- **Valor visto:** la captura oficial de la App Store muestra, debajo de la noche, «RISE Sleep Detection
  (Phone movement)» y en violeta **«30m buffer»** [A2].
- **Qué opciones hay, cuál viene de fábrica y si resta del principio de la noche o de las dos puntas: no
  confirmado.** No encontré ninguna fuente pública con la lista de valores. Lo único firme es que existe y
  que Rise eligió mostrar 30 min en su captura.
- Como referencia, para anotar a mano Rise sugiere restar unos 20 min si tardás en dormirte [C2].

### 4.5 Permisos de iOS

- **Motion & Fitness** (en iOS en inglés: Settings › Privacy & Security › Motion & Fitness): hacen falta el
  interruptor general, «Fitness Tracking», y el de «RISE Sleep». Lo usan por Core Motion y dicen que se
  procesa en el teléfono. Sin ese permiso no hay detección automática: queda anotar a mano o un reloj [H14].
- **Apple Health**: piden todas las categorías; las que nombran son sueño, pasos, entrenamientos, minutos de
  ejercicio y tiempo a la luz del día [H9][H24][H47]. Rise **solo lee**; no escribe nada en Health [H33].
- **Notificaciones**, con una pantalla previa que explica para qué (de terceros, [T1]).
- **Micrófono**, solo si prendés el sonido; **calendario**, opcional; y el pedido de seguimiento entre apps
  (de terceros, [T1]).
- En la entrada el orden es: movimiento, Health, seguimiento, notificaciones, y recién ahí «arma tu plan» y
  muestra la necesidad (de terceros, [T1]).

### 4.6 Cuando también hay reloj o anillo

- Si hay un aparato conectado y mandó sueño, **Rise lo usa solo**, sin que elijas nada [H12].
- **Cada mañana** revisa Apple Health por la noche anterior [H23][H24].
- **La noche que no lo usaste, vuelve al teléfono** [H23][H24][H26][H27].
- Al abrir la app a la mañana puede mostrar un rato lo del teléfono hasta que el reloj termine de
  sincronizar [H19].
- **Con varias fuentes**, el orden se elige en Profile › Data Sources, arrastrando; usa la primera y, si esa
  no tiene la noche, la siguiente [H12][H20]. Además cuenta el orden de fuentes de la app Salud (Sueño ›
  Fuentes de datos), que Rise pide revisar [H19][H24].
- La pantalla principal dice qué fuente se usó [H2][H15].
- Rise presenta el reloj como más preciso en un caso concreto: si dejás el teléfono bastante antes de
  dormirte o querés tenerlo fuera del cuarto [H12][H22].
- Las entradas de menos de 20 minutos no se pueden editar ni borrar [H21].

---

## 5. Aparatos y apps: por dónde entra cada uno (iPhone)

Regla general: **cualquier aparato o app que escriba sueño en Apple Health sirve** [H22].

| Aparato o app | Por dónde entra en iPhone | Qué le pide al usuario | Fuente |
|---|---|---|---|
| Apple Watch | Apple Health | Activar el seguimiento en la app Sueño del reloj (watchOS 7 o más) y dormir con él. La app de Rise para el reloj es aparte (complicación, despertador) | [H23] |
| Oura | Apple Health | En la app de Oura: menú › Settings › Health › Connect to Apple Health. En Salud, dar a Rise todas las categorías | [H24] |
| WHOOP | Apple Health | En WHOOP, activar compartir con Apple Health con Sueño prendido. En Salud, dar permisos a Rise | [H27] |
| Garmin | Apple Health (en Android, conexión directa) | En Salud › perfil › Apps › Garmin Connect, prender Sueño. Salud trae hasta dos semanas hacia atrás | [H26] |
| Fitbit | Apple Health, a través de la app Google Health | Desde septiembre de 2026 la conexión directa vieja ya no anda: se activa Apple Health dentro de Google Health, con Sueño prendido | [H25] |
| Sleep Cycle | Apple Health | Settings › Advanced › Apple Health › Connect. Puede no ofrecerlo hasta la noche 15 | [H29] |
| SleepWatch, Pillow, AutoSleep, Sleep++ | Apple Health | Activar en cada app que escriba el sueño en Salud | [H30][H31][H32][H22] |
| Eight Sleep, Withings (colchón) | Apple Health, si sincronizan ahí | Lo mismo | [H22][B6] |
| Samsung Galaxy Watch | Solo Android, por Health Connect | Samsung Health › Health Connect, y conectar Health Connect en Rise | [H28] |

- **Conexión directa** (Profile › Data Sources › Optional connections): hoy, Garmin en Android y Health
  Connect en Android [H26][H22]. Fitbit la tenía en iPhone en 2022, con inicio de sesión en la web de
  Fitbit [W3]; la ayuda actual dice que esa conexión ya no anda [H25].
- **Ojo con una contradicción de Rise:** su reseña propia dice que Apple Watch, Oura, Fitbit y Garmin se
  conectan directo [B5], pero los artículos de ayuda de cada uno, más nuevos y más concretos, mandan todo
  por Apple Health en iPhone. Vale la ayuda.
- **Pasos comunes cuando no aparece el sueño** [H19][H24][H26]:
  1. confirmar que el aparato escribe Sueño en Apple Health;
  2. abrir la app del aparato para forzar la sincronización;
  3. revisar los permisos de Rise en Salud;
  4. cerrar Rise y volver a abrirla;
  5. subir el aparato en el orden de fuentes de Sueño en Salud.
- La ficha de la App Store nombra Apple Health, Apple Watch, Fitbit, Oura, Sleep Cycle y ShutEye [A1].

---

## 6. Los avisos

### 6.1 Los tipos (confirmado)

Se administran en Profile › Notifications, y cada hábito en Tools › Habit Reminders, donde se prende o apaga
de a uno [H41]. Son cuatro familias [H41]:

1. **Recordatorios de hábitos**, cada uno con la hora atada a tu ritmo circadiano de ese día.
2. **Picos y bajones**: un aviso antes de cada pico y cada bajón. En la ayuda vieja, el hábito «Peaks and
   Dips» incluía un resumen de tu energía cada mañana, o el aviso justo antes de cada tramo, o las dos
   cosas [W4].
3. **Despertador inteligente.**
4. **Calidad del sueño**: una pregunta **90 minutos después de despertarte** sobre cómo descansaste [H41][G4].

### 6.2 Los hábitos que nombra Rise y sus tiempos

Rise hablaba de 16 hábitos en 2021 y hoy de más de 20 [B8][B5]. No encontré la lista completa en un solo
lugar. Los que aparecen nombrados, con su hora cuando la dan (los nombres en inglés son los de la app; que
«Dinner» sea el de las comidas tarde es lectura mía):

| Hábito | Cuándo avisa | Fuente |
|---|---|---|
| Cortar la cafeína (Caffeine cutoff / Avoid caffeine) | **10 h antes de la ventana de melatonina**; se ajusta entre 8 y 12 h | [B13][T1] |
| Evitar el alcohol tarde | **4 h antes de la ventana**, de fábrica; se puede adelantar, por ejemplo a 6 h | [B17] |
| Evitar comidas tarde (Dinner) | **3 h antes de la ventana** | [B18] |
| Evitar entrenar tarde / Workout | Hora no publicada. Como consejo: nada intenso en la hora previa a dormir | [B19][A5] |
| Luz a la mañana (Get bright light) | A la mañana; hora no publicada | [B20] |
| Anteojos de luz azul / Avoid blue light | Consejo general: unos 90 min antes de dormir. Hora exacta del aviso no publicada | [G4][A3][B21] |
| Antifaz, revisar el cuarto (Check your environment) | A la noche | [G4] |
| Rutina de la noche (Evening routine) | Al empezar el wind-down | [G4][B22] |
| Descarga de cerebro (Brain dump) | Recordatorio a la noche y, a la mañana siguiente, un resumen de lo que escribiste | [G4][B22][T1] |
| Relajación | Al final del wind-down | [G4] |
| Ventana de melatonina | Aviso cada noche; en el recorrido el ajuste dice «15m» | [G4][T1] |
| Guía para volver a dormirse (Sleep reset) | Cuando te despertás de noche | [G4] |
| Rutina de la mañana | Nombrada; hora no publicada | [B23] |
| Siesta | No la vi como hábito con aviso: Rise muestra la mejor hora para la siesta, en el bajón | [B2][W6] |

Las capturas oficiales muestran una lista de hábitos con campanita en cada uno (Workout, Avoid caffeine,
Dinner, Blue-light glasses, Evening routine, Melatonin window y «Add a habit») [A5], y los hábitos como
marcas sobre la línea del día («Caffeine cutoff», «Avoid blue light») [A3].

### 6.3 Cuáles vienen prendidos de fábrica

**No confirmado.** Rise no publica qué viene prendido. Lo que apunta a que **se eligen**:

- El blog dice que elegís cuáles recibir [B24][B3].
- La guía dice en cada caso que agregues el hábito a tu día de energía [G4].
- Para el alcohol: de fábrica te lo *muestra*, y manda el aviso si querés el empujón extra [B17].
- En el recorrido, la ventana de melatonina tiene un botón «Remind Me» y al aceptar confirma que el
  recordatorio quedó puesto (de terceros, [T1]).

Sobre la cantidad: una reseña de 2025 habla de varios avisos por día y advierte del riesgo de obsesionarse
con el sueño [T3].

### 6.4 Estructura y tono

- **No encontré el texto de ningún aviso real.** Hay una galería con 74 avisos de Rise capturados, pero está
  detrás de un registro y no entré [T6]. Así que **«el título dice qué hacer y el cuerpo el detalle» queda sin
  confirmar** con una captura.
- Lo que sí se ve:
  - Los nombres de los hábitos son **la acción en dos o tres palabras**, en imperativo (evitar la cafeína,
    evitar la luz azul), y son los que aparecen sobre la línea del día [A3][A5].
  - Los de energía se anuncian **antes**, como algo que se acerca: una reseña los describe como avisos de
    pico que se acerca y de bajón que se acerca [T3].
  - Cada pantalla de hábito trae una explicación de la ciencia aparte, en un panel para saber más, no en el
    aviso (de terceros, [T1]).
  - El tono de la ayuda y del blog es directo y sin culpa: la deuda como guía y no como nota, y la opción
    explícita de apagar lo que no te sirve [H45].
- **La deuda a la mañana:** la deuda se recalcula cada mañana [H1]. En el recorrido aparece, dentro de la
  app, una hoja de resumen de la mañana con la deuda (de terceros, [T1]). Rise dice que cada mañana te cuenta
  cuánto vas a estar aturdido, cuándo son tus mejores momentos y cuándo empezar a bajar [B8]. Que eso llegue
  como **notificación** con el número de la deuda: no confirmado.
- **Técnico:** en 2022 mandaban los avisos con OneSignal [W5]. Hoy dicen que llegan mejor si la app no fue
  cerrada a la fuerza [H42].

---

## 7. Cómo se ve la deuda en pantalla

De la captura oficial de iPhone en la App Store [A2] y la de iPad [A3]:

- Título «My sleep» y debajo el **rango de fechas de la ventana** (por ejemplo «October 12-26»).
- Un **arco grande** que se va llenando y, encima, un **círculo oscuro con el número**: «6.3 hrs» y debajo
  «Sleep debt». El número va en **horas con un decimal**, no en horas y minutos. Rise lo remarca: un número
  en horas, no un puntaje [B5].
- Al lado del arco, dos marcas: «GREAT 5» y «SUPER 0»; en iPad, además, «OKAY» sobre la zona actual.
  - **Lectura mía:** son los umbrales del arco (bien por debajo de 5 h, excelente en 0 h). Coincide con la
    recomendación de menos de 5 h, pero Rise no lo explica en ningún texto.
- Debajo, a la izquierda, una pastilla verde con **cuánto cambió desde ayer**: «1.2hrs debt · Since
  yesterday», con un signo menos.
- A la derecha, «Energy potential 77%».
- Tarjeta «LAST NIGHT»: «7h 50m · Total sleep time» y el horario «11:05p–6:55a».
- **De dónde salió la noche**, en una línea chica: «RISE Sleep Detection (Phone movement)» con una «i» de
  información, y en violeta «30m buffer».
- En iPad, además: «Naps today · Add time», la lista de las noches con su horario y su total, y a la
  izquierda los recordatorios con su hora.
- Pestañas: Sleep, Energy, Tools, Progress, Learn [A4].
- En Progress hay tres vistas de las 14 noches: horarios, deuda y calidad. No hay gráfico de meses [H6].

**Qué dice cuando la estimación viene solo del teléfono:**

- Lo único confirmado es esa línea: el nombre del método entre paréntesis («Phone movement»), la «i» y el
  margen [A2][A3]. La ayuda confirma que la pantalla principal muestra qué fuente se usó [H2][H15].
- **Qué dice al tocar la «i», y si hay alguna advertencia de que es una estimación: no confirmado.**
- En la ayuda sí lo dicen claro: el teléfono es una estimación, acierta cerca del 80 %, y lo que importa es
  tener una idea general de la deuda más que la precisión [H13].

---

## 8. Lo que no pude confirmar

1. Que la app use exactamente los 14 pesos de la calculadora web (muy probable, no declarado).
2. Cómo cuenta la app una **noche sin datos** dentro de la ventana.
3. Los **topes** de la necesidad de sueño y la fórmula del rebote.
4. Las **opciones y el valor de fábrica** del margen del teléfono (solo vi «30m» en la captura oficial), y a
   qué punta de la noche se aplica.
5. Qué hábitos y avisos vienen **prendidos de fábrica**.
6. El **texto real** de los avisos (título y cuerpo), y si hay un aviso de la mañana con la deuda.
7. La **lista completa** de los más de 20 hábitos y la hora de varios (entrenar tarde, luz de la mañana,
   anteojos, rutina de la noche).
8. Los **cortes** de las etiquetas de la deuda dentro de la app (high, okay, great, super).
9. Qué muestra la **«i»** al lado de «Phone movement».
10. Cómo lee Rise la **actividad de la pantalla** en iOS y de dónde saca el año de historial.
11. Si hay tope a cuánto puede descontar una noche de más.
12. No pude leer Reddit (bloqueado para mi buscador) ni el artículo de Nature directo (lo confirmé por
    PubMed Central).

---

## 9. Para comparar con Moss (inferencias mías, no hechos de Rise)

No miré el código de Moss. Con lo de arriba, estas son las causas posibles de 16 h 30 contra 4 h, de la más
a la menos probable; conviene medir cada una por separado:

1. **Suma simple contra suma con pesos.** Si Moss suma las 14 noches enteras, ya da 2,15 veces lo de Rise con
   déficit parejo, y mucho más si las últimas noches fueron buenas (el ejemplo del blog: 6 h 15 contra
   1 h 17). 16 h 30 ÷ 2,15 = 7 h 40, así que esto solo no alcanza para llegar a 4 h.
2. **Dormir de más no descuenta** (o descuenta con tope) en Moss y sí en Rise.
3. **Cuánto sueño se mide.** El teléfono de Rise tiende a contar de más (quieto es dormido, no ve los
   despertares). Si Moss recorta más la noche sin reloj, cada noche sale más corta.
4. **La necesidad.** Media hora más de necesidad son 3 h 15 más de deuda con los pesos de Rise, y 7 h con
   suma simple.
5. **Noches sin datos** contadas como cero o como noche corta.
6. **Siestas** que Rise tiene anotadas y Moss no.

Para comprobarlo en el teléfono del dueño: en Rise, Progress › Sleep Times da las 14 noches con su total, y
Profile › My sleep need la necesidad. Con esos 15 números y los pesos de 1.2 se puede reproducir el 4 h, y
de paso confirmar el punto 1 de la sección 8.

---

## Fuentes

Centro de ayuda de Rise (leído por su API pública el 17/11/2026; la mayoría, actualizados en mayo de 2026):

[H1]: https://help.risescience.com/hc/en-us/articles/40621334445335-How-is-my-sleep-debt-calculated
[H2]: https://help.risescience.com/hc/en-us/articles/40610367729687-Why-did-my-sleep-debt-go-up-even-though-I-slept-well
[H3]: https://help.risescience.com/hc/en-us/articles/40610389377943-Why-does-RISE-show-more-sleep-debt-than-my-other-app
[H4]: https://help.risescience.com/hc/en-us/articles/40621805049495-How-do-naps-affect-my-sleep-debt
[H5]: https://help.risescience.com/hc/en-us/articles/40611116762647-How-do-I-log-a-nap-in-RISE
[H6]: https://help.risescience.com/hc/en-us/articles/40621710877719-Can-I-see-my-sleep-debt-progress-over-time
[H7]: https://help.risescience.com/hc/en-us/articles/40621404441111-How-do-I-reset-my-sleep-data-and-start-over
[H8]: https://help.risescience.com/hc/en-us/articles/6047219133079-What-is-Sleep-Dept-And-how-to-track-it-with-RISE
[H9]: https://help.risescience.com/hc/en-us/articles/40621897428631-How-is-my-sleep-need-estimated
[H10]: https://help.risescience.com/hc/en-us/articles/40622025935767-Why-did-my-sleep-need-change
[H11]: https://help.risescience.com/hc/en-us/articles/40621964556567-How-do-I-manually-adjust-my-sleep-need
[H12]: https://help.risescience.com/hc/en-us/articles/40624579537303-How-does-RISE-track-my-sleep
[H13]: https://help.risescience.com/hc/en-us/articles/4405262973591-RISE-Automatic-Phone-Motion
[H14]: https://help.risescience.com/hc/en-us/articles/4405263297943-How-do-I-enable-Motion-Fitness-permissions-for-RISE
[H15]: https://help.risescience.com/hc/en-us/articles/40609697828631-Why-isn-t-RISE-recording-my-sleep
[H16]: https://help.risescience.com/hc/en-us/articles/40609998679319-Why-does-RISE-show-different-sleep-times-than-what-I-experienced
[H17]: https://help.risescience.com/hc/en-us/articles/40610292625303-Why-is-RISE-missing-chunks-of-my-sleep
[H18]: https://help.risescience.com/hc/en-us/articles/40610242681751-Why-does-RISE-show-me-waking-up-multiple-times
[H19]: https://help.risescience.com/hc/en-us/articles/40610096966807-Why-does-RISE-show-different-sleep-data-than-my-wearable
[H20]: https://help.risescience.com/hc/en-us/articles/11172004773527-How-do-I-set-my-preferred-Sleep-Source-in-RISE
[H21]: https://help.risescience.com/hc/en-us/articles/40611231547415-How-do-I-edit-add-or-delete-a-sleep-entry-in-RISE
[H22]: https://help.risescience.com/hc/en-us/articles/40590044797335-What-wearables-and-trackers-work-with-RISE
[H23]: https://help.risescience.com/hc/en-us/articles/4405263000471-How-do-I-set-up-RISE-on-my-Apple-Watch
[H24]: https://help.risescience.com/hc/en-us/articles/4405263267735-How-do-I-connect-my-Oura-Ring-to-RISE
[H25]: https://help.risescience.com/hc/en-us/articles/4405263176343-How-do-I-connect-my-Fitbit-to-RISE
[H26]: https://help.risescience.com/hc/en-us/articles/4405263358999-How-do-I-connect-my-Garmin-to-RISE
[H27]: https://help.risescience.com/hc/en-us/articles/4405248852503-How-do-I-connect-my-WHOOP-to-RISE
[H28]: https://help.risescience.com/hc/en-us/articles/4405248902167-How-do-I-connect-my-Samsung-watch-to-RISE
[H29]: https://help.risescience.com/hc/en-us/articles/4405248575767-How-do-I-connect-Sleep-Cycle-to-RISE
[H30]: https://help.risescience.com/hc/en-us/articles/4405248798615-How-do-I-connect-SleepWatch-to-RISE
[H31]: https://help.risescience.com/hc/en-us/articles/4405248683799-How-do-I-connect-Pillow-to-RISE
[H32]: https://help.risescience.com/hc/en-us/articles/4405248656791-How-do-I-connect-AutoSleep-to-RISE
[H33]: https://help.risescience.com/hc/en-us/articles/40590332000663-Does-RISE-write-data-back-to-Apple-Health
[H34]: https://help.risescience.com/hc/en-us/articles/40610561421591-Why-does-my-Melatonin-Window-seem-wrong
[H35]: https://help.risescience.com/hc/en-us/articles/40610594279191-Why-are-my-bedtime-recommendations-impractical-for-my-schedule
[H36]: https://help.risescience.com/hc/en-us/articles/40610618075543-Why-does-my-RISE-Energy-Schedule-look-wrong-after-traveling
[H37]: https://help.risescience.com/hc/en-us/articles/40672503374871-How-does-RISE-predict-my-Energy-Schedule
[H38]: https://help.risescience.com/hc/en-us/articles/6654243671191-What-is-my-Daily-Energy-Energy-Schedule
[H39]: https://help.risescience.com/hc/en-us/articles/40672627502871-How-do-I-change-my-sleep-schedule-in-RISE
[H40]: https://help.risescience.com/hc/en-us/articles/10960396186903-How-does-the-RISE-Smart-Alarm-work
[H41]: https://help.risescience.com/hc/en-us/articles/40620510022167-How-do-I-customize-my-RISE-notifications
[H42]: https://help.risescience.com/hc/en-us/articles/4405264615319-Why-aren-t-my-RISE-notifications-working
[H43]: https://help.risescience.com/hc/en-us/articles/40610919159575-How-does-RISE-Calendar-Integration-work
[H44]: https://help.risescience.com/hc/en-us/articles/40590423725719-How-do-I-set-up-RISE-widgets
[H45]: https://help.risescience.com/hc/en-us/articles/40610511674775-My-RISE-sleep-debt-keeps-going-up-and-I-can-t-get-more-sleep-can-RISE-still-help
[H46]: https://help.risescience.com/hc/en-us/articles/40609702562583-Should-I-leave-the-RISE-app-running-in-the-background
[H47]: https://help.risescience.com/hc/en-us/articles/40672649303191-Does-exercise-affect-my-Energy-Schedule
[H48]: https://help.risescience.com/hc/en-us/articles/40672537872663-Can-RISE-work-with-a-night-shift-or-irregular-schedule

- [H1] Cómo se calcula la deuda · [H2] Por qué subió si dormí bien · [H3] Por qué Rise muestra más deuda que otra app
- [H4] Siestas y deuda · [H5] Anotar una siesta · [H6] Ver la deuda en el tiempo · [H7] Reiniciar los datos · [H8] Qué es la deuda
- [H9] Cómo se estima la necesidad · [H10] Por qué cambió · [H11] Ajustarla a mano
- [H12] Cómo registra el sueño · [H13] Movimiento del teléfono · [H14] Permiso de Motion & Fitness
- [H15] No registra el sueño · [H16] Horarios distintos a lo vivido · [H17] Faltan tramos · [H18] Muchos despertares · [H19] Distinto al reloj
- [H20] Fuente preferida · [H21] Editar, agregar o borrar una noche · [H22] Qué aparatos sirven
- [H23] Apple Watch · [H24] Oura · [H25] Fitbit (actualizado el 29/9/2026) · [H26] Garmin · [H27] WHOOP · [H28] Samsung
- [H29] Sleep Cycle · [H30] SleepWatch · [H31] Pillow · [H32] AutoSleep · [H33] No escribe en Health
- [H34] La ventana parece mal · [H35] Hora de acostarse poco práctica · [H36] Después de viajar · [H37] Cómo predice la energía
- [H38] El día de energía · [H39] Cambiar el horario · [H40] Despertador · [H41] Personalizar avisos · [H42] Avisos que no llegan
- [H43] Calendario · [H44] Widgets · [H45] La deuda no para de subir · [H46] Dejarla en segundo plano · [H47] Ejercicio · [H48] Turnos de noche

Calculadora y blog de Rise (risescience.com):

[C1]: https://www.risescience.com/blog/sleep-debt-calculator
[C2]: https://www.risescience.com/blog/sleep-debt-calculator
[C3]: https://www.risescience.com/es/blog/calculadora-de-sueno
[B1]: https://www.risescience.com/blog/sleep-debt
[B2]: https://www.risescience.com/blog/how-much-sleep-debt-do-i-have
[B3]: https://www.risescience.com/blog/best-sleep-debt-tracking-app
[B4]: https://www.risescience.com/blog/oura-ring-vs-rise-app
[B5]: https://www.risescience.com/blog/rise-app-review
[B6]: https://www.risescience.com/blog/best-sleep-app-tracker-without-a-watch
[B7]: https://www.risescience.com/blog/circadian-rhythm-test
[B8]: https://www.risescience.com/fb
[B9]: https://www.risescience.com/blog/how-to-increase-melatonin-naturally
[B10]: https://www.risescience.com/blog/app-sleep-science-become-morning-person
[B11]: https://www.risescience.com/blog/personal-energy-tracker
[B12]: https://www.risescience.com/blog/biological-clock
[B13]: https://www.risescience.com/blog/how-long-does-caffeine-last
[B14]: https://www.risescience.com/blog/how-to-make-the-most-of-your-grogginess-zone
[B15]: https://www.risescience.com/blog/wind-down-time
[B16]: https://www.risescience.com/blog/do-sleep-trackers-work
[B17]: https://www.risescience.com/blog/how-long-before-bed-should-you-stop-drinking-alcohol
[B18]: https://www.risescience.com/blog/what-time-should-you-stop-eating-to-lose-weight
[B19]: https://www.risescience.com/blog/exercise-before-bed
[B20]: https://www.risescience.com/blog/how-to-sleep-early
[B21]: https://www.risescience.com/blog/do-blue-light-glasses-work
[B22]: https://www.risescience.com/blog/bedtime-routine
[B23]: https://www.risescience.com/blog/morning-routine-app
[B24]: https://www.risescience.com/blog/is-the-rise-sleep-app-worth-it
[G1]: https://www.risescience.com/improve-sleep-hygiene
[G2]: https://www.risescience.com/insights/second-law-of-sleep-circadian-rhythm
[G3]: https://www.risescience.com/faq
[G4]: https://www.risescience.com/improve-sleep-hygiene
[L1]: https://risescience.com/llms.txt

- [C1] El JavaScript de la calculadora (está dentro de la página; también en `/blog/sleep-debt` y en la versión en español) · [C2] El texto de esa misma página (actualizada el 18/8/2026) · [C3] La calculadora en español
- [B1] Qué es la deuda (18/8/2026) · [B2] Cuánta deuda tengo (24/8/2026) · [B3] Mejor app de deuda · [B4] Oura contra Rise
- [B5] La reseña de Rise sobre Rise · [B6] Registrar sin reloj · [B7] Test de ritmo circadiano (8/5/2023): la fórmula de la ventana
- [B8] Página de presentación (2021) · [B9] Melatonina natural · [B10] Volverse madrugador · [B11] Energía personal · [B12] Reloj biológico
- [B13] Cuánto dura la cafeína · [B14] La zona de aturdimiento · [B15] El wind-down · [B16] Si sirven los medidores de sueño
- [B17] Alcohol antes de dormir · [B18] Hasta qué hora comer · [B19] Ejercicio antes de dormir · [B20] Dormirse temprano
- [B21] Anteojos de luz azul · [B22] Rutina de la noche · [B23] Rutina de la mañana · [B24] Si vale la pena
- [G1] y [G4] Guía de higiene del sueño · [G2] La segunda ley del sueño · [G3] Preguntas frecuentes · [L1] `llms.txt`

App Store (capturas oficiales, vistas el 17/11/2026):

[A1]: https://apps.apple.com/us/app/rise-sleep-tracker/id1453884781
[A2]: https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/71/00/01/7100019c-af45-73f8-e3cc-12d4306b5197/9bc95cf2-1693-4a18-9fd3-ef943c826f12_6.5_SS2.png/460x996bb-60.jpg
[A3]: https://blog.reeoo.com/app-screenshot/rise-sleep-tracker/
[A4]: https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/24/ec/d4/24ecd422-e175-6408-bbc0-00d3330a40be/e719da0c-96d6-491d-83bc-fc798a03da30_6.5_SS3.png/460x996bb-60.jpg
[A5]: https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/25/20/9b/25209bb4-5b6c-ffa6-53f4-6a6270df9549/85b498dc-1e4a-4785-aa8f-79aed771948b_6.5_SS5.png/460x996bb-60.jpg

- [A1] La ficha (versión 1.651.0; 4,7 con 75 mil valoraciones; iOS 15.1 o más) · [A2] Captura 2 de iPhone: la deuda y el margen
- [A3] Capturas de iPad 2 y 3 (copia de las de la App Store en reeoo.com): la deuda, los recordatorios y el tramo con «desde ayer»
- [A4] Captura 3 de iPhone: el día de energía · [A5] Captura 5 de iPhone: la lista de hábitos

Versiones viejas de la ayuda (Wayback Machine):

[W1]: https://web.archive.org/web/20240303163804/https://help.risescience.com/hc/en-us/articles/4405179002519-How-do-Sleep-Need-and-Sleep-Debt-work
[W2]: https://web.archive.org/web/20221129113712/https://help.risescience.com/hc/en-us/articles/4405263412887-Connecting-with-Apple-Health-Compatible-Tracker
[W3]: https://web.archive.org/web/20221129111241/https://help.risescience.com/hc/en-us/articles/4405263176343-Fitbit
[W4]: https://web.archive.org/web/20240303165516/https://help.risescience.com/hc/en-us/articles/4405171553815-Circadian-Rhythm-aka-Energy-Schedule
[W5]: https://web.archive.org/web/20221129101055/https://help.risescience.com/hc/en-us/articles/4405264615319-Notifications-aren-t-working
[W6]: https://web.archive.org/web/20221129100525/https://help.risescience.com/hc/en-us/articles/4405171215255-Naps
[W7]: https://web.archive.org/web/20221129102635/https://help.risescience.com/hc/en-us/articles/4405262973591-RISE-Automatic-Phone-Motion

- [W1] Necesidad y deuda (2021) · [W2] Conectar un medidor por Apple Health (2022) · [W3] Fitbit directo (2022)
- [W4] Ritmo circadiano (2021) · [W5] Avisos que no llegan (2022) · [W6] Siestas (2021) · [W7] Movimiento del teléfono (2021)

Terceros:

[T1]: https://screensdesign.com/apps/rise-sleep-tracker/
[T2]: https://sleepopolis.com/sleep-accessories/rise-sleep-and-energy-app-review/
[T3]: https://www.tomsguide.com/wellness/sleep-tech/i-didnt-trust-the-rise-app-when-it-told-me-to-wake-up-at-4-45am-but-now-i-fall-asleep-quickly-and-sleep-through-the-night
[T4]: https://movewellapp.com/blog/rise-science-review/
[T5]: https://www.bustle.com/wellness/rise-sleep-tracking-app-review
[T6]: https://gallery.reteno.com/flows/push-notifications-rise
[X1]: https://developer.apple.com/documentation/coremotion/cmmotionactivitymanager/queryactivitystarting(from:to:to:withhandler:)
[X2]: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6662846/

- [T1] Recorrido de 170 pantallas de la app, con la descripción de cada una. Las descripciones son automáticas y las imágenes están detrás de un pago: usé solo el texto
- [T2] Sleepopolis (10/11/2022) · [T3] Tom's Guide (28/3/2025) · [T4] MoveWell (actualizada el 2/11/2026) · [T5] Bustle (16/5/2025)
- [T6] Galería de avisos de Rise, cerrada con registro: no la leí
- [X1] Apple: Core Motion guarda como mucho siete días de actividad · [X2] Borger y otros, 2019, npj Digital Medicine: los toques de pantalla para estimar el sueño

Lo crudo que bajé (las páginas, la ayuda en texto y los scripts para leerlas) quedó en la carpeta `crudo/` y
`herr/`, al lado de este archivo.
