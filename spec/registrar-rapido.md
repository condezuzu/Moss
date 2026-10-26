# Registrar más rápido: las otras apps, la voz y entender la frase

*26 de octubre de 2026. Cada dato lleva su fuente entre corchetes ([n]); la lista del final (§6) da el enlace y la fecha de cada una, y marca **(2025)** o **(2026)** lo que es de esos años. «Sin verificar» quiere decir que no lo pude confirmar en una fuente primaria. [M1]–[M4] son archivos de Moss.*

**Lo que ya está (26/10):** «Lo de siempre» (`deSiempre`, en la hoja de registro, 2 toques) y decir o escribir la comida entera con el micrófono propio (`expo-speech-recognition`, en el teléfono cuando el idioma lo permite), `frase.ts` y `entender.ts`, con las preguntas de §5.4. Cómo quedó, en [`nutricion.md`](nutricion.md), «Decir la comida de una vez». Falta medir la voz con frases de acá (§5.6) y lo de §4 desde el 3.

---

## 0. En una página

**Lo que hacen las demás (2025–2026)**

- Las grandes ya dejan **decir o escribir la comida entera**, pero, en todo lo que pude verificar, **es pago, va por la nube y casi siempre es solo en inglés**:
  - MyFitnessPal Voice Log: Premium, solo inglés y con conexión. La voz se reconoce en el teléfono y la frase la ordena Claude 3.5 Sonnet en Amazon Bedrock [14][15].
  - Cronometer Voice Logging y Siri: Gold, desde abril de 2026 [25][27].
  - Lose It! Say It: Premium y solo inglés [33][34].
  - FatSecret Smart Assistant: Premium [42].
  - MacroFactor Describe: con suscripción, y la voz es el micrófono del teclado [2].
  - Carbon Smart Logger: la voz también es el dictado del teclado, y corre en la nube [46].
- **Ninguna hace preguntas de seguimiento.** Todas muestran una lista editable antes de anotar: cambiar la porción, cambiar por otra coincidencia o quitar. MacroFactor dice que a propósito no tiene «chat» [4].
- **Lo que más ahorra no es la voz, sino repetir.**
  - Carbon (agosto de 2026) deja lo que comes seguido ya puesto en el diario y se anota con ✓ o «Add all», en 1 o 2 toques [47].
  - Cronometer Gold repite alimentos con un botón por día [30].
  - MacroFactor junta los «hourly go-tos» y anunció «predicciones por hora y un toque» [8][10].
  - El desayuno es la comida que más se repite [107].

**Lo que recomiendo para Moss** (detalle en §5)

1. **Primero, «Lo de siempre» de un toque** para la comida de esa hora. La lógica ya existe (`opcionesTuyas()` en `src/dominio/plan.ts` [M3]). Es lo de más impacto y menos costo.
2. **Decir o escribir la comida entera.**
   - La entiende un **intérprete de reglas en TypeScript**, en el teléfono y en cualquier iPhone, que reutiliza `recetaDeTexto.ts` y el buscador.
   - Después viene la revisión de siempre.
   - Hay **preguntas solo cuando cambian las calorías**: chips con una respuesta ya marcada, y «Agregar» nunca espera.
3. **La voz:**
   - Se arranca con el **dictado del teclado**: cero código nativo, en el teléfono y en español. Es lo que usan MacroFactor y Carbon [2][46].
   - Si las grabaciones de prueba con acento uruguayo lo piden, se suma un módulo propio:
     - con iOS 26 o más, **SpeechAnalyzer + DictationTranscriber + un modelo de lenguaje armado con los nombres de la base de Moss** [67][74];
     - antes de iOS 26, `SFSpeechRecognizer` en el teléfono.
4. **Foundation Models es opcional y va después.**
   - El **iPhone 15 común no lo tiene**, y tampoco tiene Private Cloud Compute [83][90].
   - Por eso las reglas son a la vez el camino principal y el respaldo.

---

## 1. Cómo registran rápido las otras apps (2025–2026)

### 1.0 Resumen comparativo

El detalle y las fuentes de cada celda están en §1.1 a §1.5.

| App | Decir o escribir la comida | ¿Gratis? | ¿Sin conexión? | ¿En español? | Si duda | Repetir rápido | Siri · widgets · reloj |
|---|---|---|---|---|---|---|---|
| MacroFactor | Sí («Describe»; voz con el teclado) | No: no hay plan gratis | No (deducido) | No (inglés y japonés) | Plato editable, sin preguntas | «Hourly go-tos»; 6 acciones para 2 alimentos conocidos | Siri todavía no · widgets que abren · reloj con voz |
| MyFitnessPal | Sí («Voice Log») | No (Premium) | **No** | **No** (solo inglés) | Lista editable, sin preguntas | Quick Log: 1 toque por alimento | No encontrado · calorías y agua · agua y calorías rápidas |
| Cronometer | Sí («Voice Logging») | No (Gold) | Sin verificar | No | Lista con «otras coincidencias» | «Repeat Items»: 1 toque por día (Gold) | **Siri sin abrir la app** (Gold) · sí · sí |
| Lose It! | Sí («Say It») | No (Premium) | Sin verificar | **No** (solo inglés) | Se elige al revisar | «Previous Meals»: 5–6 toques | No encontrado · no encontrado · solo vía Salud |
| FatSecret | Sí («Smart Assistant») | No (Premium) | Sin verificar | Sí | Deseleccionar lo erróneo | «Saved Meals» y «From History» | No encontrado · sí · complicaciones |
| Carbon | Sí («Smart Logger»; voz con el teclado) | No | **No** (nube) | No | Borrador editable | **«Smart Suggestions»: 1–2 toques** | — |
| Yazio | Foto con IA; voz sin verificar | No (Pro) | — | La app sí; la IA, sin verificar | Se edita | — | **Live Activities para anotar** · — · watchOS 9 |
| Fitia | Voz y foto Premium; texto con IA (no está claro en qué plan) | En parte | — | Sí | Sin verificar | Sin verificar | Widgets (gratis según su lista de funciones) |
| **Moss hoy** | Dictado del teclado, un alimento por vez | **Sí** | **Sí** | **Sí, con nombres de cada país** | — | Guardada o «copiar de ayer»: 2 toques | Después de la v1 · planeados · después de la v1 |
| **Moss propuesto** | La comida entera, entendida en el teléfono | **Sí** | **Sí** | **Sí** | **Pregunta solo si cambia el número, con la respuesta ya marcada** | **«Lo de siempre»: 1–2 toques** | Siri y widgets en la etapa 5 (§5.6) |

### 1.1 Decir o escribir la comida

| App | Cómo es | Precio | Dónde corre | Idioma | Si no entiende | Fuentes |
|---|---|---|---|---|---|---|
| **MacroFactor** | «Describe»: se escribe o se dicta con el micrófono del teclado y busca en una base de «common foods», sin marcas. En el reloj, voz con IA («coffee with croissant», sept. 2025) | Solo suscripción: 71,99 USD/año, sin plan gratis | No lo dicen. Varios prompts de LLM que consultan su base (deduzco que es en la nube) | La app está en inglés y japonés [M1] | **No pregunta.** Arma el «plato» para revisar y editar. Las descripciones largas se pueden partir en ingredientes sueltos con cantidades por defecto | [2][4][6][12] |
| **MyFitnessPal** | «Voice Log»: todo lo comido en una frase, y sugiere coincidencias de su base. Salió en febrero de 2025 | Premium (79,99 USD/año) | Voz en el teléfono. La frase la ordena Claude 3.5 Sonnet en Bedrock (alimentos, cantidades, unidades, marcas y comida). **Necesita conexión** | **Solo inglés** | **No pregunta.** Se toca un alimento para cambiar la porción o la comida, o «Try again». No usa My Foods, My Meals, recetas ni Quick Add | [14][15][16][17] |
| **Cronometer** | «Voice Logging», desde el 29/4/2026: hablar o escribir, «Match Foods» y revisar. Con Siri: «Log food in Cronometer», Siri pregunta qué comiste y lo anota sin abrir la app | Gold (59,99 USD/año) | No lo dicen | La app está en inglés [M1] | Lista con un botón para ver otras coincidencias («swap») y «Search For More». Avisan que las cantidades pueden salir mal y que lo nuevo puede venir en gramos | [25][26][27][32] |
| **Lose It!** | «Say It» con IA: «I had 2 eggs, toast with butter and jam» | Premium (los gratis pueden probarlo) | No lo dicen | **Solo inglés** | Empareja con «la más apropiada» de su base, y se revisa al elegir | [33][34][36] |
| **FatSecret** | «Smart Assistant»: voz o texto, la comida entera de una vez | Premium | No lo dicen (su API vende «NLP») | Tiene la guía en español | Se deselecciona lo mal emparejado o se vuelve a la frase. **Las cantidades se corrigen después, en el diario** | [42][43] |
| **Carbon** | «Smart Logger»: foto o descripción. La voz es el dictado del teclado («no graba audio»). Tarda unos 10 s | Suscripción (99,99 USD/año) | **Nube**, con conexión | Inglés | Un borrador editable; nada se anota hasta «Add to diary». Sin preguntas | [46][50] |
| **Yazio** | Foto con IA, que empezó gratis y ahora es Pro. Voz o texto: **sin verificar** (no tiene artículo de ayuda) | Pro | Sin verificar | Varios | Se revisa y se edita | [38][41] |
| **Cal AI** (de MyFitnessPal desde marzo de 2026) | Foto; la ficha no menciona voz | Suscripción para el análisis | Nube | Sin verificar | Sin verificar | [24][51] |
| **Fitia** (la más usada en Latinoamérica [M1]) | Voz «Premium». Texto con IA: gratis según una tabla suya y Premium según su FAQ; se contradicen | Premium | Sin verificar | Español | Sin verificar | [52][53] |
| **Moss hoy** | Dictado del teclado en el buscador, un alimento por vez (6 toques) | Gratis | Teléfono | Español e inglés | — | [M1] |

En resumen, de lo verificado:

- **Ninguna ofrece la voz gratis.**
- **En español solo están FatSecret y Fitia**, las dos pagas.
- **Ninguna pregunta.**

Moss sería la única que lo hace gratis, sin conexión y en español con nombres de cada país.

### 1.2 Foto (solo de referencia; Moss no la hace)

| App | Foto con IA |
|---|---|
| MacroFactor | «Snap» y «Describe» con fotos y texto: beta desde marzo de 2025, mejorada en mayo de 2026 [4][5] |
| MyFitnessPal | Meal Scan (Premium) y, desde febrero de 2026, subir la foto para anotar después [17] |
| Cronometer | Photo Logging (Gold, 1/8/2025) y, desde abril de 2026, sugerencias de lo que no se ve, como la manteca o el aceite [29] |
| Lose It! | Snap It (Premium) [33] |
| Yazio | Foto con IA (Pro) [38] |
| FatSecret | Smart Food Scan (Premium) [43] |
| Carbon | El Smart Logger también acepta fotos [46] |

Cronometer avisa que con la foto se escapa lo escondido (aceite, salsas, la leche del café) [28]. MacroFactor y Yazio piden revisar todo, porque la IA se equivoca [4][38].

### 1.3 Repetir, sugerir, Siri, widgets y reloj

**MacroFactor**
- **Repetir:** historial arriba de la búsqueda, «Latest», favoritos, multi-add, copiar y pegar, recetas [3][12].
- **Sugerencias:** **«Hourly go-tos»**: lo que sueles comer a esa hora, por frecuencia y por lo reciente, y se suma todo junto. El informe 2026 anuncia «predicciones por hora y un toque» [8][10].
- **Siri y Atajos:** atajos dentro de la app (de 1 a 14). App Intents, todavía no: está «en camino» [10].
- **Widgets:** de inicio y de bloqueo, que *abren* la búsqueda, el escáner o el registro; no anotan solos. La Live Activity es solo de Workouts [9][13].
- **Reloj:** app con 8 flujos, voz con IA y complicaciones (sept. 2025) [6][7].

**MyFitnessPal**
- **Repetir:** **Quick Log**: el «+» de cada resultado lo anota con su porción, en 1 toque [18]. También Recent/Frequent, My Meals y copiar a otra fecha [19].
- **Sugerencias:** Food Suggestions de dietistas, no por hora [16].
- **Siri y Atajos:** no encontré.
- **Widgets:** calorías y macros, más un widget interactivo de agua (iOS 18) [20].
- **Reloj:** agua, calorías rápidas y complicaciones; no busca alimentos [21].

**Cronometer**
- **Repetir:** multi-add, recientes y comidas propias (gratis) [29].
- **Sugerencias:** **«Repeat Items»** (Gold): se eligen días y hora, y cada día aparece un botón «Log Items» [30].
- **Siri y Atajos:** **con Siri anota sin abrir la app** (Gold). También tiene acciones rápidas del ícono [27][29].
- **Widgets:** de inicio (2021) y de bloqueo (2023) [29].
- **Reloj:** «Log Food via your Apple Watch» (2026) [32].

**Lose It!**
- **Repetir:** «My Foods» y la pestaña «Meals», con lo comido las últimas semanas [34][35].
- **Sugerencias:** la búsqueda muestra lo que sueles comer en esa comida y tus comidas recientes de esa hora [34].
- **Siri, Atajos y widgets:** no encontré.
- **Reloj:** solo como fuente de datos, vía Salud [37].

**Yazio**
- **Repetir:** comidas propias, y plantillas a partir de la foto [38].
- **Sugerencias:** —
- **Siri y Atajos:** no encontré.
- **Widgets:** **Live Activities para anotar desde la pantalla bloqueada y la Dynamic Island** [39].
- **Reloj:** la ficha pide watchOS 9 [41].

**FatSecret**
- **Repetir:** «Most Eaten», «Recently Eaten», «From History» (con la porción de la vez anterior y un «+»), Saved Meals y copiar [43][44].
- **Sugerencias:** —
- **Siri y Atajos:** no encontré.
- **Widgets:** la ayuda tiene una sección de widgets [42].
- **Reloj:** complicaciones [45].

**Carbon**
- **Repetir:** copiar comidas, favoritos y las porciones más usadas [48][50].
- **Sugerencias:** **«Smart Suggestions»** (agosto de 2026).
  - Detecta lo que comes a diario o ciertos días y lo deja «SUGGESTED» en su comida.
  - Se anota con ✓ o con «Add all».
  - Funciona en el teléfono y sin conexión, y necesita 7 días con registros [47].
- **Siri, Atajos, widgets y reloj:** —

**Moss hoy** [M1]
- **Repetir:** recientes y comidas guardadas desde el «+» (2 toques), copiar de ayer (2), copiar un día (3) y carga rápida (3).
- **Sugerencias:** lo que sueles comer a esa hora, **por alimento** (6 toques), y el plan con «Comí esto» (1).
- **Siri y Atajos:** después de la v1.
- **Widgets:** de bloqueo, planeados con expo-widgets.
- **Reloj:** después de la v1.

### 1.4 Porciones y crudo o cocido

| App | Porciones | Crudo y cocido | Fuentes |
|---|---|---|---|
| MacroFactor | **Recuerda la última porción usada.** Lo propio se convierte solo a g, oz, ml y taza | Los «common foods» suelen ser crudos y en peso comestible. Para lo cocido hay que escribir cómo se cocinó («grilled») | [8][11] |
| MyFitnessPal | Quick Log usa la porción actual, y se cambia tocando | No convierte. Su ayuda sugiere buscar con «cooked», «raw» o «generic» | [18][23] |
| Cronometer | Se toca la cantidad para cambiarla. Con la voz, lo nuevo puede venir en gramos | Los nombres de NCCDB dicen «Raw» o «Cooked». Las carnes que no lo aclaran son cocidas | [25][26][31] |
| Lose It! | Se elige la unidad y la cantidad | No encontré | [34] |
| Yazio | No lo revisé | Se anota como dice el envase, que casi siempre es crudo | [40] |
| FatSecret | «From History» trae la porción y la cantidad de la vez anterior. Hay porciones como «cup, cooked» | El estado va en la porción | [44] |
| Carbon | La porción más usada queda fija y como chips. Desde octubre de 2026, una calculadora de «cuánto para X g» | Lo que no dice «cooked» es crudo, y aconsejan pesar crudo. Para lo cocido, asumir −25 % en las proteínas | [48][49] |
| **Moss** | La última porción, las porciones caseras y de envase, g y ml, ×½ ×1½ ×2, y «Pesado · A ojo» | **Las dos versiones y «Crudo · Cocido» sin perder los gramos, con lo que rinde**, la parte comestible y «¿Llevó aceite?» | [M1] |

Moss ya va adelante en porciones y en crudo o cocido. **Lo que le falta es la entrada.**

### 1.5 Toques para un desayuno repetido (tres alimentos, igual que ayer)

| App | El camino más corto que encontré | Toques | Fuente |
|---|---|---|---|
| Carbon | Smart Suggestions: «Add all» | **1–2** | [47] |
| Cronometer (Gold) | Repeat Items: «Log Items», arriba del diario | **1** por día, una vez configurado (cuenta mía) | [30] |
| MyFitnessPal | Quick Log: el «+» y después el «+» de cada alimento, si están en la lista | **4** (cuenta mía: 1 + 3) | [18] |
| MyFitnessPal | Copiar en iOS: Editar, marcar cada uno, Copiar y elegir la fecha | **≈6** (cuenta mía) | [19] |
| Lose It! | Previous Meals: Log, +, la comida, Meals, la comida anterior y Add | **5–6** (son los pasos de su ayuda) | [35] |
| MacroFactor | «Hourly go-tos»: se suman juntos | No publicado. En su índice: **6 acciones** para 2 alimentos ya registrados | [1][8] |
| FatSecret | Saved Meal | «en unos pocos toques», sin número | [43] |
| Yazio | — | No encontrado | — |
| **Moss hoy** | Comida guardada desde el «+», o «copiar de ayer» | **2** | [M1] |
| **Moss hoy** | Sugerencia de la hora, por alimento | **6** por alimento | [M1] |

### 1.6 Las mediciones de velocidad que existen

**El índice de MacroFactor, actualizado el 1/10/2025 [1].** Lo hace MacroFactor sobre sí mismo. Cuenta acciones (toques y selecciones), y menos es mejor. Es «≥ n» cuando no pasó el umbral de «fuerte», que es menos de 17, 9, 9 y 8.

| App | 1. Buscar 2 alimentos con porción a mano | 2. Multi-add de 2 ya conocidos | 3. Código de barras | 4. Calorías rápidas |
|---|---|---|---|---|
| MacroFactor (modo velocidad) | 10 | 6 | 5 | 3 |
| MyNetDiary | 11 | 7 | 7 | 5 |
| Lose It! | 13 | 7 | 7 | 5 |
| MyFitnessPal | 15 | ≥ 9 | 7 | 5 |
| Yazio | 16 | ≥ 9 | ≥ 9 | ≥ 8 |
| Carbon | ≥ 17 | 8 | 9 | 5 |
| FatSecret | ≥ 17 | 8 | 8 | ≥ 8 |
| Cronometer | ≥ 17 | ≥ 9 | 7 | 7 |
| Cal AI | ≥ 17 | 8 | ≥ 9 | ≥ 8 |

**La prueba de 7 días de MyNetDiary [56].**
- La hizo MyNetDiary en enero de 2026, y avisa que tiene interés comercial.
- Midió 127 alimentos reales en un iPhone Air con iOS 26.
- Dejó afuera copiar de ayer, las plantillas y la IA.

| App | Acciones en total | Por alimento (cuenta mía) |
|---|---|---|
| MyNetDiary | 711 | 5,6 |
| Lose It! | 872 | 6,9 |
| MacroFactor | 877 | 6,9 |
| Noom | 896 | 7,1 |
| Yazio | 997 | 7,9 |
| Cronometer | 1.003 | 7,9 |
| MyFitnessPal | 1.035 | 8,1 |

### 1.7 Qué sacar de esto

- **La voz del teléfono es casi siempre «texto más un intérprete».**
  - MacroFactor y Carbon usan directamente el dictado del teclado [2][46].
  - MyFitnessPal reconoce la voz en el teléfono y manda el texto a un LLM [15].
  - Lo caro (y lo que las hace pagas) es el intérprete en la nube. **Moss puede hacer el intérprete en el teléfono.**
- **Nadie conversa.** El patrón es frase → lista editable → «Agregar». Cronometer agrega «otras coincidencias» por alimento [26], y FatSecret, deseleccionar [42].
- **El ahorro grande está en lo repetido.** La tendencia de 2026 son las sugerencias de un toque por costumbre (Carbon, Cronometer y lo anunciado por MacroFactor) [10][30][47].
- **Medir con toques:** Moss ya cuenta toques por flujo [M1]. Conviene seguir haciéndolo con cada idea de §4.

---

## 2. Voz a texto en el iPhone, sin costo por uso

### 2.1 `SFSpeechRecognizer` en el teléfono

- **Cómo:**
  - Con `requiresOnDeviceRecognition = true`, que solo se respeta si `supportsOnDeviceRecognition` es verdadero; si no, necesita red [58][59].
  - Apple avisa: «on-device requests won't be as accurate» [58]. En 2019 dijo: «Accuracy is good on-device, but you may find it is better on server» [63].
- **Español:**
  - Admite los mismos idiomas que el dictado del teclado [60].
  - En iOS 27, el dictado en el teléfono incluye **español de Chile, Colombia, México, España y Estados Unidos. No hay «español (Uruguay)»** [75].
- **El límite de un minuto:**
  - La documentación pide «Plan for a one-minute limit on audio duration» y avisa de límites diarios por equipo y por app, porque es un servicio en red [57].
  - En WWDC19 Apple aclaró: «With on-device recognition, these limits do not apply» [63].
  - Una comida dicha dura entre 5 y 20 s, así que no afecta.
- **Vocabulario propio:**
  - `contextualStrings`: frases cortas, de una o dos palabras, y «no more than 100» [61].
  - Desde **iOS 17** hay modelos de lenguaje propios: `customizedLanguageModel` con `SFCustomLanguageModelData`, que acepta frases con peso, **plantillas** y pronunciaciones. Solo funcionan en el teléfono [62][64].
- **Un problema conocido:** forzar el modo en el teléfono puede dar `No asset installed for language=es-ES` hasta que el sistema baja el modelo.
  - En el foro lo arreglaron activando Siri y bajando el idioma, y esperando.
  - A uno le volvió a pasar días después. No respondió nadie de Apple [65].

### 2.2 SpeechAnalyzer (iOS 26): `SpeechTranscriber` y `DictationTranscriber`

- **Dos transcriptores** [66][67][68]:
  - `SpeechTranscriber`: el modelo nuevo, «faster and more flexible», pensado para conversación y para audio largo o lejano.
  - `DictationTranscriber`: el modelo del dictado, compatible con equipos viejos.
- **Todo en el teléfono.**
  - El sistema baja los modelos (AssetInventory), y Apple dice: «does not increase the download or storage size of your application» [68].
  - Con `DictationTranscriber`, «you will NOT need to tell your users to go into Settings and turn on Siri or keyboard dictation», a diferencia de `SFSpeechRecognizer` [68].
- **Idiomas:**
  - `SpeechTranscriber` salió con 10: cantonés, chino, inglés, francés, alemán, italiano, japonés, coreano, portugués y **español** [73].
  - Un blog listó `es_CL`, `es_ES`, `es_MX` y `es_US` en `supportedLocales` (julio de 2025) [72].
  - `DictationTranscriber` admite los mismos idiomas que `SFSpeechRecognizer` en el teléfono [68].
  - Para un teléfono en es-UY hay que usar `supportedLocale(equivalentTo:)` y probarlo; **sin verificar a qué variante lo lleva.**
- **Equipos:**
  - `SpeechTranscriber` está en todas las plataformas menos watchOS, «with certain hardware requirements» [68].
  - En el foro de Apple, sin respuesta de Apple, `isAvailable` da **falso en iPhone 11 y SE 2** y verdadero del iPhone 12 al 17 [70].
  - **El iPhone 15 debería poder; se confirma con `isAvailable`.**
- **Vocabulario:**
  - Un ingeniero de Apple respondió en el foro (enero de 2026): «contextual strings only help transcriptions from the `DictationTranscriber` module. The `SpeechTranscriber` module does not currently take contextual strings into account» [69].
  - `DictationTranscriber` también acepta un modelo de lenguaje propio (`SFSpeechLanguageModel` con `customizedLanguage(modelConfiguration:)`) [67].
  - **El ejemplo oficial de iOS 27, «Recognizing speech in live audio», hace exactamente eso:** `DictationTranscriber` con el preset `progressiveLongDictation` y un modelo armado con plantillas («`<piece> to <royal> <piece> <rank>`») [74]. Para Moss serían plantillas como «`<cantidad> <unidad> de <alimento>`», con los nombres de la base.
- **Precisión:**
  - Argmax (20/6/2025) midió **en inglés** llamadas de resultados en un M4.
  - `SpeechTranscriber` sacó WER 14,0, contra 15,2 de whisper-base.en y 12,8 de whisper-small.en [71].
  - **No encontré ninguna medición en español.**

### 2.3 El dictado del teclado

- **Cero código.** Ya funciona en el buscador de Moss [M1].
- Apple dice que «Dictation is processed on your iPhone in many languages, and no internet connection is required» [76]:
  - el teclado queda abierto para mezclar voz y tipeo;
  - pone comas y puntos solo;
  - **se detiene tras 30 s de silencio.**
- **Español en el teléfono:** Chile, Colombia, México, España y Estados Unidos [75].
- **Lo que cuesta:** un toque más (el micrófono del teclado), y no admite vocabulario propio.
- **Una ventaja:** las comas que pone ayudan a separar los alimentos.
- **Es lo que usan MacroFactor y Carbon** para la voz en el teléfono [2][46].

### 2.4 `expo-speech-recognition` (jamsch)

- **Última versión: 58.0.0 (16/10/2026).** Dice: «Align the package version with Expo SDK 58 and upgrade the example app to React Native 0.88 and React 19.3» [77][78].
  - Desde la 56 sigue la numeración de Expo y pide iOS 16.4 o más [78].
  - Se instala con `npx expo install expo-speech-recognition`.
- **Nueva arquitectura:** sí.
  - Es un módulo de Expo («The existing Expo Modules API remains supported») [78].
  - Desde RN 0.82, la nueva arquitectura es la única [81].
  - El issue #185, un cierre con la nueva arquitectura, era la 57.1.0 instalada en SDK 54. El autor indicó la versión para SDK 54 [80].
- **En el teléfono:** sí, con `requiresOnDeviceRecognition` y `supportsOnDeviceRecognition()` [79].
- **SpeechAnalyzer de iOS 26: no.**
  - Revisé el código iOS de la 58.0.0: usa solo `SFSpeechRecognizer`.
  - No hay issues que pidan SpeechAnalyzer [77][79].
- **Vocabulario:**
  - `contextualStrings`: sí, pasa a `request.contextualStrings`, con el tope de Apple de 100 frases.
  - **Modelo de lenguaje propio: no** [79].
- **Otras opciones:**
  - `addsPunctuation` (iOS 16 o más), `iosTaskHint` y eventos de volumen para animar el micrófono [79].
  - Pide los permisos de micrófono y de reconocimiento de voz [79].

### 2.5 Otros paquetes

| Paquete | Versión | Qué usa | Vocabulario propio |
|---|---|---|---|
| `expo-speech-transcriber` | 0.1.9 (10/12/2025) | `SFSpeechRecognizer` y SpeechAnalyzer | Su README no lo menciona [82] |
| `@react-native-ai/apple` | — | Transcripción con SpeechAnalyzer, vía el AI SDK de Vercel | Su README no lo menciona [95] |
| `expo-ai-kit` | — | Opción `speech` | Su README no lo menciona [95] |

### 2.6 Comparación de caminos

| Camino | Costo de programar | En el teléfono | Español | Vocabulario propio | Toques para hablar |
|---|---|---|---|---|---|
| Dictado del teclado | Nada | Sí | 5 variantes, sin es-UY [75] | No | El micrófono del teclado (+1) |
| `expo-speech-recognition` 58 | Bajo | Sí, si el modelo está bajado | Las mismas | `contextualStrings` (≤ 100) | Un botón propio |
| Módulo propio: SpeechAnalyzer + `DictationTranscriber` (iOS 26 o más) | Medio | Sí; el sistema baja el modelo solo | Las del dictado | `contextualStrings` + **modelo con plantillas** | Un botón propio |
| Módulo propio: `SpeechTranscriber` | Medio | Sí | 10 idiomas, con español [73] | **No** [69] | Un botón propio |

---

## 3. Entender la frase sin nube

### 3.1 Foundation Models (iOS 26 o más)

**Qué es**
- Es el modelo de Apple Intelligence: unos 3.000 millones de parámetros a 2 bits.
- Apple lo describe así: «optimized for … summarization, extraction, classification» y «not designed for world knowledge or advanced reasoning» [88].
- **Sirve para separar la frase en alimentos, no para saber calorías.** Los números salen siempre de la base de Moss.

**Salida guiada**
- Con `@Generable` y `@Guide`, el framework «guarantees structural correctness using … constrained decoding» [88].
- Admite Bool, Int, Float, Double, Decimal, Array, tipos anidados y enums [87].
- Para esquemas armados en tiempo de ejecución está `DynamicGenerationSchema` [87].

**Contexto**
- **4.096 tokens por sesión**, contando instrucciones, prompt, esquema y respuesta (TN3193, revisada el 31/3/2026) [86].
- Desde iOS 26.4 hay `contextSize` y `tokenCount(for:)`.
- El modelo cambia con el sistema: hay tres versiones, para 26.0–26.3, 26.4 y 27.0 [84].
- En WWDC26, un comentario del código de ejemplo muestra 8.192 [89]. Hay que leerlo en tiempo de ejecución.
- Una comida dicha ocupa pocos cientos de tokens.

**Equipos**
- Apple Intelligence funciona en «iPhone Duo, iPhone 16 models or later, iPhone 15 Pro, iPhone 15 Pro Max, iPhone Air» (publicado el 22/10/2026) [83].
- **El iPhone 15 común queda afuera, y es el tuyo:** no lo vas a poder probar en tu teléfono.
- Hay que mirar `SystemLanguageModel.default.availability` (`.deviceNotEligible`, `.modelNotReady`…) [84].

**Idiomas**
- Entiende los idiomas de Apple Intelligence, **que incluyen el español** [83][85].
- El idioma del teléfono y el de Siri tienen que ser el mismo idioma admitido [83].
- Hay que llamar a `supportsLocale()` antes. Si el idioma no se admite, la sesión lanza `unsupportedLanguageOrLocale`.
- Apple sugiere poner en las instrucciones la frase exacta «The person's locale is es_UY.» [85].
- **No hay mediciones públicas de su calidad en español para esta tarea.**

**iOS 27 (WWDC26)**
- Trae un modelo nuevo, «rebuilt from the ground up … better at logic and tool calling».
- Acepta imágenes y otros proveedores que sigan el protocolo `LanguageModel` [89][92].
- Según Callstack, suma un segundo modelo, más capaz, solo para equipos de gama alta [94]. Es una fuente secundaria.

**Private Cloud Compute**
- Es **gratis** para quienes están en el Small Business Program y tienen menos de 2 millones de primeras descargas, **contando todas tus apps, también Ascent** [91].
- Pero «PCC is only available on Apple Intelligence devices».
- Necesita conexión y tiene un **límite diario por usuario** [90].
- Apple ya anunció que el acceso ampliado será «for a fee in the future» [91].
- **No arregla el iPhone 15 y va contra «local primero».** No lo recomiendo.

**Cómo llamarlo desde Expo**

Apple lo dijo en junio de 2026: «There is no official React Native binding for the Foundation Models framework» [93]. Las opciones son estas.

| Opción | Versión | Qué es |
|---|---|---|
| **Módulo propio de Expo en Swift** | — | Como `modules/leer-etiqueta`: el esquema vive en Swift y desde JS se llama con `requireOptionalNativeModule`. Es el más chico y el que da más control. **Es el que recomiendo** |
| `react-native-apple-llm` | 1.0.16 (17/1/2026) | Sesiones y salida JSON con esquema [95] |
| `react-native-foundation-models` | 0.1.3 (6/8/2026) | Módulo Nitro. Moss ya usa `react-native-nitro-modules` 0.37 [95] |
| `@react-native-ai/apple` (Callstack) | 0.12.0 (28/1/2026) | Proveedor para el AI SDK de Vercel. Pide iOS 26 y la nueva arquitectura [95] |
| `expo-ai-kit` | 0.18.2 (17/9/2026) | Salida JSON. La opción `llm` **suma unos 30 MB** (un runtime LiteRT-LM) en iOS [95] |

**El módulo propio, en esbozo.** Lo de abajo es mío; cada nombre del API hay que confirmarlo contra la documentación.

```swift
import FoundationModels

@available(iOS 26.0, *)
@Generable(description: "Lo que la persona dice que comió o tomó")
struct ComidaDicha {
  @Guide(description: "Cada alimento o bebida, en el orden en que se dijo")
  var items: [ItemDicho]
}

@available(iOS 26.0, *)
@Generable
struct ItemDicho {
  @Guide(description: "El alimento como se dijo, sin la cantidad: «huevos revueltos», «café con leche»")
  var alimento: String
  @Guide(description: "La cantidad dicha como número; 0 si no se dijo")
  var cantidad: Double
  @Guide(description: "La unidad dicha (unidad, taza, cucharada, rebanada, plato, g, ml); vacío si no se dijo")
  var unidad: String
}

// En el módulo: si availability == .available y supportsLocale(), entonces
// LanguageModelSession(instructions: "Separa los alimentos… No inventes cantidades. The person's locale is es_UY.")
// .respond(to: texto, generating: ComidaDicha.self), y a JS van solo los textos.
```

Lo que devuelve pasa por **el mismo buscador y las mismas preguntas** que las reglas (§3.3). El modelo nunca pone calorías.

### 3.2 Reglas para el español, sin modelo

**Lo que ya está en Moss** (`src/comida/recetaDeTexto.ts` [M2], que lee español del Río de la Plata, de España y de México, e inglés):

- **Números con palabras:**
  - de «un», «una» y «uno» hasta «doce», más «quince» y «veinte»;
  - «medio» y «media», «un par de», «media docena», «un cuarto de», «tres cuartos», «un tercio»;
  - «y medio»; rangos como «dos o tres»; docenas.
- **Cantidades vagas:** «un poco de», «unos» y «algunos».
- **Unidades:** taza, tacita, cucharada, cucharadita, pizca, vaso, copa, **pocillo**, chorrito, unidad o pieza, diente, rebanada, rodaja, tajada o loncha, **feta**, lata, paquete (bolsa, pote, botella, barra), sobre, **puñado**, hoja, rama, atado, cabeza, filete y trozo o pedazo.
- **Tamaños:** chico, mediano, grande.
- **Notas** como «a gusto».

**Lo que falta para la comida dicha:**

- **Partir la frase en alimentos:**
  - por comas, punto y coma, puntos, «y» o «e», «más», «también», «después», «de postre» y «para tomar»;
  - pero **nunca** el «y» de «y medio» o «y cuarto».
- **El «con».**
  - Primero se prueba el nombre más largo que exista en la base:
    - «café con leche» es **un** alimento de la base («Coffee, cafe con leche», 1 taza = 252 g);
    - «arroz con leche» también.
  - Si no existe, se parte: «tostada con manteca» da tostada + manteca.
  - Lo que viene detrás de «con» toma una porción chica de acompañante (1 cdta de manteca o de azúcar), marcada «supuesto».
- **Muletillas y verbos** que se sacan: «eh», «bueno», «a ver», «este», «comí», «me comí», «tomé», «desayuné», «almorcé».
- **La comida del día** cuando se dice: «en el almuerzo», «de cena», «a la merienda».
- **Correcciones:** «dos, no, tres medialunas» son 3.
- **Unidades nuevas:** plato, bol, tazón o cuenco, porción, cucharón y **bocha** (de helado).
- **Números más grandes,** para los gramos dichos: trece a diecinueve, decenas, cien, doscientos… El dictado suele escribir cifras, pero no siempre.
- **La preparación:** «revueltos», «fritos», «a la plancha», «al horno» y «tostado» eligen la versión cocida que ya existe («Huevos revueltos», «Huevo frito»).
- **«Lo de siempre»** dentro de una frase: «el desayuno de siempre y una banana».

**Dónde va.** En un archivo puro, por ejemplo `src/comida/frase.ts`:
- importa solo `porciones.ts` y `recetaDeTexto.ts`;
- recibe la búsqueda inyectada (`esNombre(texto)`), para no partir «café con leche»;
- se suma a la galería en `construir.mjs`;
- tiene tests con 150 frases reales en español e inglés.

**Ejemplos.** Las porciones salen de `alimentos/genericos.txt`.

| Lo que se dice | Lo que sale | ¿Pregunta? |
|---|---|---|
| «dos huevos revueltos, una tostada con manteca y un café con leche» | Huevos revueltos ×2 (122 g) · Pan tostado («tostada» en UY), 1 rebanada (25 g) · Mantequilla («manteca» en UY), sin cantidad: la última que usaste, o 1 cdta (4,7 g) supuesta · Café con leche, 1 taza (252 g) | Solo «¿Cuánta manteca?», y solo si no hay historia: 1 cdta (≈34 kcal) contra 1 cda (≈102) |
| «un vaso de leche y una banana» | Leche, 1 vaso (206 g) · Banana, 1 mediana (118 g) | «¿Qué leche?»: entera (≈126 kcal) o descremada (≈70), salvo que tu historia ya lo diga |
| «200 gramos de arroz» | «arroz» es Arroz blanco cocido, pero hay versión cruda | «¿Los 200 g son crudos o cocidos?»: crudo ≈730 kcal, cocido ≈260 |
| «una taza de arroz» | Arroz blanco cocido, 1 taza; la medida queda como se dijo, no en gramos | «¿Lo mediste crudo o cocido?»: cada versión con el peso de su taza |
| «dos, no, tres medialunas» | Croissant («medialuna» en UY) ×3, 57 g cada uno | No |
| «two scrambled eggs, a toast with butter and a coffee with milk» | Lo mismo que el primero, en inglés | Lo mismo |

### 3.3 Del texto al alimento: buscar y decidir

- **Cada trozo pasa por el buscador de siempre** (`src/comida/buscar.ts` [M1]):
  - los nombres de cada país (en UY, «manteca» es mantequilla y «tostada», pan tostado);
  - el premio del historial;
  - los errores de tipeo.
- **Se resuelve solo con lo de la persona:**
  - `ultimaCantidad` (la última porción de ese alimento) [M4];
  - `sueles` (lo de esa comida) [M4];
  - y un **alias personal nuevo**: «para mí, "leche" es la descremada», que se aprende de cada corrección.
- **Si se pregunta o no** lo decide una función pura con tests (§5.4).
- **Lo que no se encuentra** se anota sin datos personales, como ya se hace con las búsquedas vacías [M1]: así la base aprende lo que la gente dice.

### 3.4 Lo que dice la investigación

**MIT: Korpusik, Glass y colaboradores**
- **Cómo lee la frase:** marcaba cada palabra de la comida dicha como alimento, cantidad, marca o modificador. En «bowl of oatmeal», «bowl» es cantidad. En «oatmeal cookie», «oatmeal» es modificador [103].
- **Correcciones:** se hacían hablando («I had half a banana») y cambiaban solo ese alimento [103].
- **Preguntas de aclaración:** en 2019 publicaron que «boosts food recall», porque achican la búsqueda (IEEE/ACM TASLP, agosto de 2019). Es el resumen de la autora; no leí el paper [104].
- **Piloto COCO Nutritionist** (JMIR, diciembre de 2021):
  - 35 personas, 5 días;
  - **sin diferencia significativa de calorías** contra el recordatorio de 24 h con entrevistadora (2.092 contra 2.030 kcal, P = 0,70) [105].

**Por qué la gente deja de registrar**
- Cordeiro et al. (CHI 2015) analizaron 141 encuestas y 5.526 mensajes de foros.
- Describen las barreras para registrar con constancia y los «empujones negativos» de las apps [106].

**Repetición**
- Liu et al. (2019) estudiaron datos de MyFitnessPal [107]:
  - «about 50% of users reconsumed up to 50% of the past breakfast items in the last 7 days»;
  - la cena es la que menos se repite: la mitad repitió hasta el 17 %.
- **El desayuno se resuelve repitiendo; el almuerzo y la cena, diciendo.**

---

## 4. Otras ideas, ordenadas por impacto y costo

| # | Idea | Impacto en el esfuerzo | Costo | Por qué |
|---|---|---|---|---|
| 1 | **«Lo de siempre»**: la comida entera que sueles comer a esa hora, en una tarjeta arriba de la hoja del «+» y en Inicio durante esa franja. Un toque, con Deshacer | **Muy alto** | **Bajo** | `opcionesTuyas()` ya junta las mismas listas comidas al menos 2 veces en 28 días, en la comida en que más se comieron y con la cantidad del medio [M3]. El plan ya tiene «Comí esto» [M1]. Pasa de 6 toques por alimento a **1 o 2** por comida. Carbon y Cronometer ya lo hacen y MacroFactor lo anunció [10][30][47] |
| 2 | **Decir o escribir la comida entera**: reglas, revisión y preguntas | **Alto**, sobre todo en almuerzo y cena | Medio | De 3 + 2 por alimento a 5 toques fijos (§5.5). Gratis, sin conexión y en español: nadie más lo tiene |
| 3 | **Aviso a la hora de siempre con acciones**: «Anotar lo de siempre» y «Decir qué comí» | Alto, porque ataca el olvido | Bajo a medio | Moss ya avisa de las comidas sin anotar [M1]. En iOS la acción tiene que abrir la app: según la documentación de Expo, la tarea en segundo plano para las acciones corre «only on Android» [98] |
| 4 | **Botón de micrófono propio** (§2) | Medio: ahorra 1 o 2 toques y suma vocabulario | Medio | Lo deciden las mediciones (§5.6) |
| 5 | **Widget de bloqueo o de inicio** que abre «Lo de siempre» o «Decir» | Medio | **Bajo**, si solo abre Moss | `expo-widgets` (SDK 58) hace widgets de bloqueo, con botones desde iOS 17. Pero el toque corre en un runtime aislado, y el oyente de la app «only fires while the app process is alive» [97]. Anotar sin abrir la app pide una cola de pendientes. Se empieza con un widget que solo abre |
| 6 | **Siri: «Anotar comida en Moss»**: Siri pregunta «¿Qué comiste?» y Moss abre en la revisión | Medio: manos libres. Además sirve para Back Tap, en cualquier iPhone 8 o más, y el botón de Acción del 15 Pro en adelante [101][102] | Medio | `expo-app-intents` (alfa, SDK 58): los intents se escriben en Swift; las frases llevan el nombre de la app, son fijas y como máximo 10; JS las atiende al abrir [96]. **La frase no puede traer texto libre**: Apple dice que los parámetros de una frase «can't be open ended» [99]; por eso Siri pregunta, como en Cronometer [27]. La Siri nueva de iOS 27 empieza solo en inglés [76] |
| 7 | **Foundation Models** como ayuda para frases desordenadas, solo con Apple Intelligence | Bajo a medio | Medio, y no se puede probar en un iPhone 15 | §3.1 |
| 8 | **Control en el Centro de control o en la pantalla bloqueada** (iOS 18) que abre «Decir» | Bajo a medio | Medio | Pide una extensión propia; `expo-widgets` no lo cubre [97] |
| 9 | **Live Activity para anotar**, como la de Yazio [39] | Bajo | Medio a alto | Dura como máximo 8 horas activa, más 4 en la pantalla bloqueada [100]; no cubre un día entero |
| 10 | **Apple Watch con voz**, como MacroFactor [6] | Medio, para quien tiene reloj | Alto | Ya está para después de la v1 [M1] |

---

## 5. Recomendación para Moss

### 5.1 La voz

1. **Etapa 1: el dictado del teclado.**
   - Va en un campo nuevo en la hoja del «+», «Di o escribe lo que comiste».
   - Abre con el teclado y con un ejemplo de frase.
   - No hay código nativo, corre en el teléfono y anda en español. Lo mismo sirve para escribir, y nadie depende del micrófono.
2. **Medir antes de pasar a lo nativo** (§5.6).
3. **Etapa 2, si la medición lo pide.** Es un módulo propio, `modules/dictado`, como `leer-etiqueta`:
   - **Con iOS 26 o más:** SpeechAnalyzer + **`DictationTranscriber`**, con:
     - un **modelo de lenguaje propio** generado con los nombres y alias de `alimentos/genericos.txt` y plantillas («`<cantidad> <unidad> de <alimento>`»), como el ejemplo de Apple [74];
     - y `contextualStrings` con lo que esa persona más come.
     - **No conviene `SpeechTranscriber`:** ignora el vocabulario [69].
   - **Con iOS 17 a 25:** `SFSpeechRecognizer` en el teléfono, con `customizedLanguageModel` [62].
   - **Con iOS 16.4 a 16.x:** `SFSpeechRecognizer` con `contextualStrings` (hasta 100) [61].
   - Ahorra 1 o 2 toques respecto del teclado y mejora los nombres de acá: fainá, chivito, pascualina, bizcochos, medialunas, Conaprole.
4. **Lo más barato, si la etapa 2 se demora:** `expo-speech-recognition` 58 con `requiresOnDeviceRecognition` y `contextualStrings` [77][79].
   - Es compatible con SDK 58, RN 0.88 y la nueva arquitectura.
   - No trae SpeechAnalyzer ni modelo propio.
5. **Permisos:** el micrófono, y el reconocimiento de voz con `SFSpeechRecognizer`.
   - Con SpeechAnalyzer, **sin verificar** si también hace falta el segundo: conviene poner los dos textos en `locales/es.json` y `en.json`.
   - El audio no sale del teléfono y no se guarda.

### 5.2 La interpretación

- **Reglas en TypeScript para todos** (§3.2): son puras, tienen tests y la galería usa las mismas. Es el camino principal.
- **El buscador y el historial** eligen el alimento (§3.3). **Ningún número sale de un modelo.**
- **Foundation Models va después y es opcional.**
  - Se usa solo en equipos con Apple Intelligence y **solo cuando las reglas dudan**: si quedan palabras sin alimento o si el «con» se puede leer de dos maneras.
  - Su salida pasa por el mismo buscador.
  - Hace falta un teléfono compatible para probarlo, o TestFlight con quienes tengan uno.
  - La puerta queda abierta desde ahora: el intérprete recibe una función opcional que separa la frase.

### 5.3 En los teléfonos sin Apple Intelligence

- **Es el mismo camino:** las reglas son lo principal, no un plan B. El iPhone 15 común, el 14 y anteriores hacen exactamente lo mismo.
- **Lo que mejora con el uso:** los alias personales que se aprenden de cada corrección, la última porción, «Lo de siempre» y los recientes.
- **Lo que no hace falta:** ni Private Cloud Compute, que exige Apple Intelligence, conexión y tiene límite diario [90][91], ni bajar un modelo de lenguaje, que pesa cientos de MB contra los 5,9 MB de la base [M1].

### 5.4 Las preguntas

1. **Nunca un chat.**
   - Es la revisión de siempre: arriba la frase, que se puede editar, y abajo los alimentos.
   - Es lo que hacen todas [2][14][26][42][46] y la regla de Moss: «registrar es armar la comida y revisarla antes de agregarla» [M1].
2. **Se pregunta solo si cambia el número:** cuando las opciones difieren en **40 kcal o más, o en un 15 % o más**, para la cantidad dicha.
   - El umbral se calibra con las 150 frases.
   - «Café» con o sin azúcar no se pregunta. Un vaso de leche entera o descremada sí: ≈126 contra ≈70 kcal.
3. **Primero se resuelve solo:**
   - con el alias personal;
   - con `ultimaCantidad` y `sueles` [M4];
   - y con la región, por los nombres de cada país.
   - Cada respuesta se recuerda: **la segunda vez, «leche» ya no pregunta.** Las preguntas bajan con el uso.
4. **Una respuesta ya marcada y un toque.**
   - Cada pregunta trae marcada la opción más probable, en chips, sin otra pantalla.
   - **«Agregar» siempre está activo:** no contestar es aceptar lo marcado.
   - Como mucho **una pregunta por alimento y tres por comida**, ordenadas por cuántas calorías mueven.
   - Lo demás queda marcado «supuesto» y se corrige tocándolo, como hoy.
5. **Los tipos, en orden:**
   1. **No encontrado:** «No encontré «chajá». ¿Es alguno de estos?», con «Postre chajá» y «Buscar…».
   2. **Cuál:** «¿Qué leche?», con Entera, Semidescremada y Descremada.
   3. **Cuánto**, cuando no se dijo, no hay historia y las porciones cambian mucho: «¿Cuánto arroz?», con ½ taza, 1 taza y 1 plato.
   4. **Crudo o cocido**, solo si se dijeron gramos y existen las dos versiones: «¿Los 200 g son crudos o cocidos?».
   5. **Aceite**, con la regla que ya existe y la respuesta anterior.
6. **Lo que no se pregunta:**
   - la marca: solo cuenta si se dijo;
   - la comida del día: sale de la hora, o de «en el almuerzo»;
   - la hora.
7. **Corregir hablando o escribiendo:** «no, eran tres», o el micrófono otra vez para sumar («y una banana»).
8. **Las reglas de Moss:**
   - el texto va en `src/textos/es.json` y `en.json`, en tú;
   - las preguntas entran, salen y se acomodan con animación, y respetan Reducir movimiento;
   - se prueba primero en la galería con frases de mentira.
9. **Para saber si anda:**
   - al menos el 90 % de los alimentos tiene que salir bien sin tocar nada;
   - en promedio, como mucho media pregunta por comida a las dos semanas de uso.

### 5.5 Toques, antes y después

| Situación | Hoy [M1] | Con la propuesta |
|---|---|---|
| Desayuno repetido de 3 alimentos, sin guardar | 6 por alimento con la sugerencia de la hora | **2** («+» y «Lo de siempre»), o **1** desde Inicio o el aviso |
| Desayuno repetido, guardado o igual que ayer | 2 | 1 o 2 |
| Comida nueva de 3 alimentos | 3 + 2 por alimento = **9**, más escribir tres búsquedas | **5** con el teclado («+», «Decir», micrófono del teclado, «Entender», «Agregar»), más 1 por pregunta contestada, que es opcional. **3 o 4** con micrófono propio |
| Con Siri | — | Decir «Anotar comida en Moss» y la comida; después **1** («Agregar») |

Ningún flujo de hoy suma toques; solo hay una entrada nueva en la hoja del «+».

### 5.6 Por etapas

1. **Galería:**
   - la tarjeta «Lo de siempre»;
   - la hoja «Di o escribe lo que comiste»;
   - la revisión con las preguntas y frases de mentira.
2. **«Lo de siempre» en la app**, con `opcionesTuyas()` por franja y «Comí esto».
3. **El intérprete de reglas** (`src/comida/frase.ts`):
   - sus tests con 150 frases reales de acá y en inglés;
   - el campo que usa el dictado del teclado;
   - la función que decide las preguntas, con sus tests.
4. **Medir la voz**, como se planeó con las 50 etiquetas:
   - 50 a 100 frases grabadas por 3 a 5 personas con acento uruguayo, en el iPhone 15;
   - medir qué porcentaje de **alimentos** sale bien con cada camino: teclado, `SFSpeechRecognizer` con `contextualStrings` y `DictationTranscriber` con modelo propio;
   - si el teclado acierta bien los nombres de acá, alcanza con `expo-speech-recognition` para el botón propio;
   - si no, se hace el módulo propio.
5. **El aviso con acciones, el widget que abre «Decir» y Siri** con `expo-app-intents`.
6. **Foundation Models**, opcional, cuando haya un equipo para probarlo.

### 5.7 Lo que no pude verificar

- **La precisión de las APIs de voz de Apple en español.** La única medición pública es en inglés [71].
- **Las variantes de español de `SpeechTranscriber`** en iOS 26 y 27. Solo un blog nombra es_CL, es_ES, es_MX y es_US [72], y no sé a cuál lleva es-UY.
- **La regla de hardware de `SpeechTranscriber`.** Son reportes del foro, sin Apple [70].
- **Si SpeechAnalyzer pide**, además del micrófono, el permiso de reconocimiento de voz.
- **La calidad y la demora de Foundation Models en español** para esta tarea. Tampoco el contexto de iOS 27: el 8.192 sale de un comentario de código [89].
- **Si la voz de MacroFactor, Cronometer, Lose It! y FatSecret corre en la nube.** No lo dicen. Sí está confirmado para MyFitnessPal (necesita conexión y usa Claude) [14][15] y para Carbon (nube) [46].
- **La voz o el texto de Yazio y de Cal AI, y en qué plan está el texto con IA de Fitia**, porque sus fuentes se contradicen.
- **Los toques de la mayoría de las apps.** Solo hay dos mediciones, y son de las propias empresas: el índice de MacroFactor y la prueba de MyNetDiary. El resto los conté yo a partir de los pasos de sus ayudas.
- **El comunicado de febrero de 2025 de MyFitnessPal.** No lo pude abrir; la fecha sale del buscador y los detalles, de su ayuda [14][16].
- **Si un botón de `expo-widgets` puede escribir en el almacén de Moss con la app cerrada**, y si una acción de un aviso en iOS puede correr JS sin abrir la app. La documentación sugiere que no [97][98].

---

## 6. Fuentes

Todas las consulté el 26/10/2026. Donde la página no tiene fecha, lo digo.

**MacroFactor**
1. MacroFactor, «Is MacroFactor Still the Fastest Food Logger? (2025 FLSI Update)», https://macrofactor.com/fastest-food-logger-2025/ — actualizado el 1/10/2025 **(2025)**
2. MacroFactor Help, «Log Foods with Describe», https://help.macrofactorapp.com/en/articles/216-log-foods-with-describe — sin fecha
3. MacroFactor Help, «How to Log Food in MacroFactor», https://help.macrofactorapp.com/en/articles/215-how-to-log-food-in-macrofactor — sin fecha
4. MacroFactor, «AI-Powered Food Logging Comes to MacroFactor», https://macrofactor.com/ai-food-logging/ — actualizado el 8/4/2025 **(2025)**
5. MacroFactor, «Version 5.5.7 Release Notes», https://macrofactor.com/version-5-5-7/ — 10/5/2026 **(2026)**
6. MacroFactor, «Version 5.4.0 Release Notes» (watchOS), https://macrofactor.com/version-5-4-0/ — 9/9/2025 **(2025)**
7. MacroFactor Monthly, septiembre de 2025 (watchOS e índice), https://macrofactor.com/mm-sept-2025/ — **(2025)**
8. MacroFactor, «MacroFactor is Rolling out the Fastest Food Logging Workflows on the Market», https://macrofactor.com/new-food-logger/ — actualizado el 25/9/2024
9. MacroFactor, «Widgets», https://macrofactor.com/widgets/ — actualizado el 16/1/2024
10. MacroFactor, «The 2026 MacroFactor Annual Report», https://macrofactor.com/annual-report-2026/ — actualizado el 30/9/2026 **(2026)**
11. MacroFactor Help, «Are Default Food Weights for Cooked or Raw Food?», https://help.macrofactorapp.com/en/articles/24-are-default-food-weights-for-cooked-or-raw-food — sin fecha
12. App Store (EE. UU.), MacroFactor, https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471 — versión 5.8.9 del 24/9, precios **(2026)**
13. MacroFactor Monthly, mayo de 2026 (Live Activity de Workouts y mejora de la IA), https://macrofactor.com/mm-may-2026/ — **(2026)**

**MyFitnessPal**

14. MyFitnessPal Help, «How to log food with your voice», https://support.myfitnesspal.com/hc/en-us/articles/30332897072269-How-to-log-food-with-your-voice — actualizado hace un mes según la página, ≈ septiembre de 2026 **(2026)**
15. Tribe AI, caso MyFitnessPal («Powered by Claude 3.5 Sonnet on Amazon Bedrock»; «On-device voice recognition with Claude-powered language processing»), https://www.tribe.ai/case-studies/myfitnesspal — sin fecha (© 2026)
16. PR Newswire, «MyFitnessPal Unveils Its 2025 Winter Release», https://www.prnewswire.com/news-releases/myfitnesspal-unveils-its-2025-winter-release-302385598.html — 26/2/2025 **(2025)**. No la pude abrir: la vi por el extracto del buscador
17. AP/AOL, «MyFitnessPal Debuts Its 2026 Winter Release», https://lite.aol.com/sports/other/story/0022/20260224/9659625.htm — 24/2/2026 **(2026)**
18. MyFitnessPal Help, «Getting started with Quick Log», https://support.myfitnesspal.com/hc/en-us/articles/360032622491-Getting-started-with-Quick-Log — actualizado hace un mes **(2026)**
19. MyFitnessPal Help, «How do I copy a meal from one day to another?», https://support.myfitnesspal.com/hc/en-us/articles/360032622131-How-do-I-copy-a-meal-from-one-day-to-another — actualizado hace dos años
20. MyFitnessPal Help, «How to add a Widget to mobile Home Screen», https://support.myfitnesspal.com/hc/en-us/articles/6886354417165-How-to-add-a-Widget-to-mobile-Home-Screen — actualizado hace dos meses **(2026)**
21. MyFitnessPal Help, «Apple Watch App», https://support.myfitnesspal.com/hc/en-us/articles/360032625731-Apple-Watch-App — actualizado hace dos meses **(2026)**
22. App Store (EE. UU.), MyFitnessPal, https://apps.apple.com/us/app/myfitnesspal-calorie-counter/id341232718 — versión 26.42.0 **(2026)**
23. MyFitnessPal Help, búsqueda «raw or cooked» (resultado «How to log food to your diary»), https://support.myfitnesspal.com/hc/en-us/search?query=raw+or+cooked — **(2026)**
24. TechCrunch, «MyFitnessPal has acquired Cal AI, the viral calorie app built by teens», https://techcrunch.com/2026/03/02/myfitnesspal-has-acquired-cal-ai-the-viral-calorie-app-built-by-teens — 2/3/2026 **(2026)**

**Cronometer**

25. Cronometer Blog, «Voice Logging» y Siri, https://cronometer.com/blog/voice-logging-siri/ — 29/4/2026 **(2026)**
26. Cronometer Support, «Mobile – Voice Logging», https://support.cronometer.com/hc/en-us/articles/47549391461780-Mobile-Voice-Logging — actualizado hace cuatro meses **(2026)**
27. Cronometer Support, «Mobile – Siri Voice Logging», https://support.cronometer.com/hc/en-us/articles/47664884315412-Mobile-Siri-Voice-Logging — actualizado hace cuatro meses **(2026)**
28. Cronometer Blog, «Four ways to log food on Cronometer», https://cronometer.com/blog/?p=58829 — 14/5/2026 **(2026)**
29. Cronometer, novedades de la app, https://cronometer.com/blog/cronometer-updates-whats-new-improved — foto el 1/8/2025, voz el 29/4/2026 **(2025–2026)**
30. Cronometer Support, «Mobile – Set Repeating Foods», https://support.cronometer.com/hc/en-us/articles/16510562495764-Mobile-Set-Repeating-Foods — actualizado hace cuatro meses **(2026)**
31. Cronometer Support, «Do I log my foods raw or cooked?», https://support.cronometer.com/hc/en-us/articles/4405155125012-Do-I-log-my-foods-raw-or-cooked — actualizado hace nueve meses **(2026)**
32. App Store (EE. UU.), Cronometer, https://apps.apple.com/us/app/cronometer-calorie-counter/id1145935738 — versión 4.60.1, precios de Gold **(2026)**

**Lose It!, Yazio, FatSecret y Carbon**

33. Lose It!, comunicado de ACCESS Newswire, «Lose It! Finds AI-Powered Logging Boosts Weight Loss Success…», https://www.accessnewswire.com/newsroom/en/publishing-and-media/lose-it-finds-ai-powered-logging-boosts-weight-loss-success-and-greater-nutrit-1015267 — 22/4/2025 **(2025)**
34. Lose It! Support, «How to Log Food in Lose It!», https://loseit.zendesk.com/hc/en-us/articles/49210381551380-How-to-Log-Food-in-Lose-It — actualizado el 25/8/2026 **(2026)**
35. Lose It! Support, «Previous Meals», https://loseit.zendesk.com/hc/en-us/articles/49209714942996-Previous-Meals — actualizado el 4/8/2026 **(2026)**
36. App Store (EE. UU.), Lose It!, https://apps.apple.com/us/app/lose-it-calorie-counter/id297368629 — versión 18.5.702 **(2026)**
37. Lose It! Support, búsqueda «apple watch», https://loseit.zendesk.com/hc/en-us/search?query=apple+watch — **(2026)**
38. Yazio Help, «What is the AI Calorie Tracking Feature, and how does it work?», https://help.yazio.com/hc/en-us/articles/39137901903889-What-is-the-AI-Calorie-Tracking-Feature-and-how-does-it-work — sin fecha
39. Yazio Help, «How can I use Live Activities? (iOS)», https://help.yazio.com/hc/en-us/articles/29612994653201-How-can-I-use-Live-Activities-iOS — sin fecha
40. Yazio Help, «Should I log the raw or cooked weight of my food?», https://help.yazio.com/hc/en-us/articles/360000538317-Should-I-log-the-raw-or-cooked-weight-of-my-food — sin fecha
41. App Store (EE. UU.), Yazio, https://apps.apple.com/us/app/yazio-calorie-counter-app/id946099227 — versión 26.42.0 **(2026)**
42. FatSecret Help, «How to Use the Smart Assistant», https://www.fatsecret.com/fatsecret-app-help/getting-started-with-premium/smart-assistant-guide — sin fecha
43. FatSecret Help, «All the ways to log food in the fatsecret app», https://www.fatsecret.com/fatsecret-app-help/getting-started/food-add-options — sin fecha
44. FatSecret Help, «How to find and log food in the fatsecret app», https://www.fatsecret.com/fatsecret-app-help/getting-started/how-to-find-and-log-food — sin fecha
45. App Store (EE. UU.), FatSecret, https://apps.apple.com/us/app/calorie-counter-by-fatsecret/id347184248 — versión 11.9 **(2026)**
46. Carbon Help, «Log meals faster with Carbon's Smart Logger», https://help.joincarbon.com/en/articles/16182813-log-meals-faster-with-carbon-s-smart-logger — 3/8/2026 **(2026)**
47. Carbon Help, «Smart Suggestions: log foods you eat often without searching», https://help.joincarbon.com/en/articles/16242219-smart-suggestions-log-foods-you-eat-often-without-searching — 10/8/2026 **(2026)**
48. Carbon Blog, «Release 77», https://www.joincarbon.com/blog/release-77 — 9/10/2026 **(2026)**
49. Carbon Help, «Should I weigh foods raw or cooked?», https://help.joincarbon.com/en/articles/6004880-should-i-weigh-foods-raw-or-cooked — 10/3/2022
50. App Store (EE. UU.), Carbon, https://apps.apple.com/us/app/carbon-macro-coach-tracker/id1437820611 — versión 2.77.6010, precios **(2026)**

**Las nuevas y las mediciones**

51. App Store (EE. UU.), Cal AI, https://apps.apple.com/us/app/-/id6480417616 — versión 26.42.0 **(2026)**
52. Fitia, «¿Cuál es la diferencia entre Fitia Free y Premium?», https://fitia.app/es/ayuda/articulos/free-vs-premium-fitia — «modificado el año pasado» **(2025)**
53. Fitia, «All Fitia Features», https://fitia.app/features/ — sin fecha
54. MacrosFirst Help, «Apple Watch App» («Hey Siri, log food in MacrosFirst»), https://help.macrosfirst.com/en/articles/77-apple-watch-app — sin fecha
55. MacrosFirst Help, «Lock Screen Widgets», https://help.macrosfirst.com/en/articles/65-lock-screen-widgets — sin fecha
56. MyNetDiary, «Which Calorie Tracker App Is Fastest in Real Life? A 7-Day Test», https://www.mynetdiary.com/which-calorie-tracker-app-is-the-fastest.html — estudio de enero de 2026 **(2026)**

**Voz en iOS**

57. Apple, `SFSpeechRecognizer`, https://developer.apple.com/documentation/speech/sfspeechrecognizer — sin fecha
58. Apple, `requiresOnDeviceRecognition`, https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/requiresondevicerecognition — sin fecha
59. Apple, `supportsOnDeviceRecognition`, https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportsondevicerecognition — sin fecha
60. Apple, `supportedLocales()`, https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportedlocales() — sin fecha
61. Apple, `contextualStrings`, https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/contextualstrings — sin fecha
62. Apple, `customizedLanguageModel` (iOS 17), https://developer.apple.com/documentation/speech/sfspeechrecognitionrequest/customizedlanguagemodel — sin fecha
63. WWDC19, «Advances in Speech Recognition» (256), https://developer.apple.com/videos/play/wwdc2019/256/ — 2019
64. WWDC23, «Customize on-device speech recognition» (10101), https://developer.apple.com/videos/play/wwdc2023/10101/ — 2023
65. Apple Developer Forums, «SFSpeechRecognizer kLSRErrorDomain 102», https://developer.apple.com/forums/thread/703770 — 2022–2023
66. Apple, `SpeechTranscriber`, https://developer.apple.com/documentation/speech/speechtranscriber — iOS 26 **(2025)**
67. Apple, `DictationTranscriber`, https://developer.apple.com/documentation/speech/dictationtranscriber — iOS 26 **(2025)**
68. WWDC25, «Bring advanced speech-to-text to your app with SpeechAnalyzer» (277), https://developer.apple.com/videos/play/wwdc2025/277/ — junio de 2025 **(2025)**
69. Apple Developer Forums, «SpeechAnalyzer > AnalysisContext lack of documentation», https://developer.apple.com/forums/thread/811083 — pregunta de diciembre de 2025, respuesta de enero de 2026 **(2025–2026)**
70. Apple Developer Forums, «SpeechTranscriber not supported», https://developer.apple.com/forums/thread/806765 — noviembre de 2025 a marzo de 2026 **(2025–2026)**
71. Argmax, «Apple and Argmax» (comparación con Whisper), https://www.argmaxinc.com/blog/apple-and-argmax — 20/6/2025 **(2025)**
72. Anton Gubarenko, «iOS 26: SpeechAnalyzer Guide», https://antongubarenko.substack.com/p/ios-26-speechanalyzer-guide — 28/7/2025, actualizado el 15/9/2025 **(2025)**
73. addpipe, «A Quick Look at Apple's SpeechAnalyzer API», https://blog.addpipe.com/apple-speechanalyzer-api/ — 17/8/2026 **(2026)**
74. Apple, ejemplo «Recognizing speech in live audio» (iOS 27, `DictationTranscriber` con modelo propio), https://developer.apple.com/documentation/speech/recognizing-speech-in-live-audio — **(2026)**
75. Apple, «iOS and iPadOS 27 Feature Availability» (dictado, dictado en el teléfono, Siri, Apple Intelligence), https://www.apple.com/ios/feature-availability/ — **(2026)**
76. Apple Support, «Dictate text on iPhone» (iOS 27), https://support.apple.com/guide/iphone/dictate-text-iph2c0651d2/ios — **(2026)**
77. npm, `expo-speech-recognition` (58.0.0 del 16/10/2026; código iOS revisado en unpkg), https://www.npmjs.com/package/expo-speech-recognition — **(2026)**
78. GitHub, jamsch/expo-speech-recognition, versiones (56.0.0 del 17/5/2026, 57.0.0 del 30/8/2026 y 58.0.0 del 16/10/2026), https://github.com/jamsch/expo-speech-recognition/releases — **(2026)**
79. GitHub, README de `expo-speech-recognition`, https://github.com/jamsch/expo-speech-recognition — **(2026)**
80. GitHub, issue #185, https://github.com/jamsch/expo-speech-recognition/issues/185 — 11/10/2026 **(2026)**
81. React Native, «React Native 0.82 – A New Era», https://reactnative.dev/blog/2025/10/08/react-native-0.82 — 8/10/2025 **(2025)**
82. npm, `expo-speech-transcriber` 0.1.9, https://www.npmjs.com/package/expo-speech-transcriber — 10/12/2025 **(2025)**

**Foundation Models**

83. Apple Support, «How to get Apple Intelligence» (equipos, idiomas, mismo idioma del teléfono y de Siri), https://support.apple.com/en-us/121115 — publicado el 22/10/2026 **(2026)**
84. Apple, `SystemLanguageModel`, https://developer.apple.com/documentation/foundationmodels/systemlanguagemodel — **(2025–2026)**
85. Apple, «Supporting languages and locales with Foundation Models», https://developer.apple.com/documentation/foundationmodels/supporting-languages-and-locales-with-foundation-models — **(2025–2026)**
86. Apple, TN3193, «Managing the on-device foundation model's context window», https://developer.apple.com/documentation/technotes/tn3193-managing-the-on-device-foundation-model-s-context-window — 6/10/2025, revisada el 31/3/2026 **(2025–2026)**
87. Apple, «Generating Swift data structures with guided generation», https://developer.apple.com/documentation/foundationmodels/generating-swift-data-structures-with-guided-generation — **(2025)**
88. WWDC25, «Meet the Foundation Models framework» (286), https://developer.apple.com/videos/play/wwdc2025/286/ — junio de 2025 **(2025)**
89. WWDC26, «What's new in the Foundation Models framework» (241), https://developer.apple.com/videos/play/wwdc2026/241 — junio de 2026 **(2026)**
90. WWDC26, «Build with the new Apple Foundation Model on Private Cloud Compute» (319), https://developer.apple.com/videos/play/wwdc2026/319 — junio de 2026 **(2026)**
91. Apple, «Accessing Private Cloud Compute», https://developer.apple.com/private-cloud-compute — **(2026)**
92. Apple, «What's new in iOS 27» (guía de WWDC26), https://developer.apple.com/wwdc26/guides/ios/ — junio de 2026 **(2026)**
93. Apple Developer Forums, «React Native + native AI bridge» (respuesta de un Frameworks Engineer), https://developer.apple.com/forums/thread/833676 — junio de 2026 **(2026)**
94. Callstack, «On-device AI after WWDC 2026: What's new?», https://callstack.com/blog/on-device-ai-after-wwdc-2026-whats-new — 8/6/2026 **(2026)**
95. npm, versiones y README, consultados el 26/10/2026 **(2026)**:
    - `react-native-apple-llm` 1.0.16 (17/1/2026), https://www.npmjs.com/package/react-native-apple-llm
    - `react-native-foundation-models` 0.1.3 (6/8/2026), https://www.npmjs.com/package/react-native-foundation-models
    - `@react-native-ai/apple` 0.12.0 (28/1/2026), https://www.npmjs.com/package/@react-native-ai/apple
    - `expo-ai-kit` 0.18.2 (17/9/2026), https://www.npmjs.com/package/expo-ai-kit

**Siri, widgets y avisos**

96. Expo, «AppIntents» (`expo-app-intents`, alfa, SDK 58), https://docs.expo.dev/versions/latest/sdk/app-intents/ — **(2026)**
97. Expo, «Widgets» (`expo-widgets`, SDK 58), https://docs.expo.dev/versions/latest/sdk/widgets/ — **(2026)**
98. Expo, «Notifications» (SDK 58), https://docs.expo.dev/versions/latest/sdk/notifications/ — **(2026)**
99. Apple Developer Forums, parámetros en las frases de App Shortcuts (respuesta de DTS), https://developer.apple.com/forums/thread/770037 — diciembre de 2024
100. Apple, «Displaying live data with Live Activities», https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities — sin fecha
101. Apple Support, «Run shortcuts by tapping the back of your iPhone», https://support.apple.com/guide/shortcuts/run-shortcuts-tapping-iphone-apd897693606/ios — sin fecha
102. Apple Support, «Run shortcuts with the Action button», https://support.apple.com/guide/shortcuts/run-shortcuts-with-the-action-button-apdfea15680b/ios — sin fecha

**Investigación**

103. MIT News, «Voice-controlled calorie counter», https://news.mit.edu/2016/voice-controlled-calorie-counter-0324 — 24/3/2016
104. Mandy Korpusik (MIT CSAIL), página y publicaciones, con «Deep Learning for Database Mapping and Asking Clarification Questions in Dialogue Systems» (IEEE/ACM TASLP, agosto de 2019), http://people.csail.mit.edu/korpusik/ — sin fecha
105. Taylor et al., «Use of Natural Spoken Language With Automated Mapping of Self-reported Food Intake to Food Composition Data for Low-Burden Real-time Dietary Assessment», JMIR 23(12):e26988, https://www.jmir.org/2021/12/e26988 — diciembre de 2021
106. Cordeiro et al., «Barriers and Negative Nudges: Exploring Challenges in Food Journaling», CHI 2015, https://doi.org/10.1145/2702123.2702155 — 2015. Lo vi solo por el resumen
107. Liu et al., «Characterizing and Predicting Repeat Food Consumption Behavior for Just-in-Time Interventions» (datos de MyFitnessPal), https://arxiv.org/abs/1909.07683 — 2019. Las cifras salen de la versión HTML de ar5iv

**Moss**

- [M1] `spec/nutricion.md`: los flujos y sus toques, la búsqueda, cómo se mide, lo que tienen las otras apps (21 a 23/10/2026).
- [M2] `src/comida/recetaDeTexto.ts`: números con palabras, unidades, tamaños y notas.
- [M3] `src/dominio/plan.ts`: `opcionesTuyas()`, las comidas de siempre (al menos 2 veces en 28 días, con la cantidad del medio).
- [M4] `src/dominio/registros.ts`: `ultimaCantidad()`, `sueles()`, `premios()`.
