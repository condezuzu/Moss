# Los widgets y la noche sin abrir Moss

Investigado el 25/11/2026. Lo que dijiste ese día:

- Te encantan los widgets de la pantalla bloqueada con las calorías que quedan: «muy rápido y clean», ya no
  entrás a Moss para eso.
- Mejorarías el de la pantalla de inicio, el único con algo visual.
- Lo malo: para el sueño tenés que entrar a Moss. Querés que la noche quede sola apenas prendés el teléfono.

Leí `spec/widgets.md`, D8 y D43 de `spec/decisiones.md`, `galeria/src/widgets-nuevos.js`,
`spec/sueno-sin-esfuerzo.md`, «Sin reloj» de `spec/sueno.md`, `src/widgets/`, `src/salud/`, `src/fondo/tarea.ts`,
`modules/movimiento`, `app-intents/`, `app.json` y, en `node_modules`, `expo-widgets` 58.0.29, `@expo/ui` 58.0.29,
`expo-task-manager`, `expo-background-task`, `expo-app-intents` 0.5.18 y `@react-native-healthkit/core`.

Las fuentes están al final, numeradas. Todas se consultaron el 25/11/2026. Lo que no se pudo confirmar dice
**sin confirmar**. Lo que deduzco yo dice **inferencia**.

---

## Lo que ya está en tu iPhone (la build 8)

Todo lo de D43 salió con la build 8. `CON_WIDGETS_NUEVOS` está en `true` y los cinco widgets están declarados en
`app.json`.

| Widget | Tamaños | Qué hace hoy |
|---|---|---|
| **Hoy** | chico, mediano y grande; redondo, rectangular y en línea | lo que queda, la luna y los macros. En mediano y grande, las comidas: «+633» anota tu comida de siempre sin abrir Moss |
| **Anotar** | chico, mediano y redondo | abre el buscador, la voz, el escáner o la etiqueta |
| **Agua** | chico | «+» y «−» sin abrir Moss |
| **Cielo** | chico, mediano, grande y redondo | la figura sobre el cielo de verdad y los «hecho» |
| **Tu noche** | chico, redondo y rectangular | a la mañana, «Anoche» con «Sí»; a la tardecita, «A dormir» con la hora |

Tres cosas que limitan todo lo demás:

- **Con el teléfono bloqueado, un botón de widget no hace nada hasta que te identificás.** Apple, literal: «On a
  locked device, buttons and toggles are inactive» [A1]. Con Face ID es mirar y tocar. Pero «sumar un vaso sin
  desbloquear» no existe con widgets.
- **La línea del widget la escribe la app al abrirse, o la tarea de fondo.** El widget solo suma toques a la suya
  (`src/widgets/index.ts`).
- **A la mañana, «Tu noche» muestra la noche esperada, no la medida.** Es lo de siempre o la hora del despertador
  (`nocheEsperada`, en `src/widgets/noche.ts`). Moss estima la de verdad recién al abrirse. Eso es lo que sentís.
  Con un reloj o un anillo, ni siquiera eso: el widget queda sin horas hasta que Moss lee Salud.

## Qué va por aire y qué pide build

- **Por aire:**
  - el dibujo de cada widget: la app registra la vista al arrancar (`createWidget`);
  - sus textos y todo lo que va en las props;
  - una Live Activity: la extensión de la build 8 ya trae `WidgetLiveActivity`, y el plugin ya puso
    `NSSupportsLiveActivities` (`node_modules/expo-widgets/plugin/build/ios/withAppInfoPlist.js`).
- **Build que cambia la huella** (corta las OTA a las builds que ya están):
  - un widget o un tamaño nuevo, o la configuración al editar el widget (`app.json`);
  - un entitlement, como el de Salud en segundo plano;
  - Swift en la extensión de widgets (los controles, la relevancia), con un plugin propio.
- **Build que no cambia la huella:** el Swift de `app-intents/` (CLAUDE.md, 1/11/2026). Igual, solo anda en las
  builds que lo traen.

Lo que `expo-widgets` 58.0.29 ya permite y Moss todavía no usa:

- `Text` con `timerInterval` o `dateStyle: 'relative'`: iOS lo actualiza solo, de a segundo o minuto, sin gastar
  recargas [A6]. Está en `@expo/ui` desde antes del SDK 58.
- `Gauge`, `ProgressView` y `Chart` (Swift Charts): están en el renderizador de la extensión
  (`ios/Widgets/ViewRenderer.swift`).
- `widgetAccentedRenderingMode`, para las imágenes en tintado (desde `@expo/ui` 58.0.10).

Lo que no permite: los controles del Centro de control, la relevancia en la pila, `widgetAccentable`, el tamaño
nuevo de iOS 27 y poner una hora de inicio a una Live Activity [E1].

---

## 1. La pantalla de inicio

De la que más suma a la que menos. Antes de programar cualquiera de estas: la galería, con datos de mentira.

### 1.1 Hoy, tan rápido como el de la pantalla bloqueada

- **Qué ves:**
  - Chico: una cifra grande («1.025 te quedan»), los tres macros en barras finas y la luna chica. Nada más. El
    cielo, muy tenue o fuera.
  - Mediano: eso a la izquierda y tus comidas a la derecha, con «+633» de un toque.
  - Grande: además, la semana en siete barras contra tu meta.
- **Qué hay:** el chico de hoy junta la luna, el «+», la etiqueta, la cifra, los tres macros con letra, número y
  barra, y el cielo al 40 % (`src/widgets/Hoy.widget.tsx`). Es el más cargado de los cinco. El de la pantalla
  bloqueada que te gusta tiene una línea de título, la cifra y una línea de macros.
- **Cómo:** con lo que ya tiene `expo-widgets`: `Gauge` o `ProgressView` para las barras, `Chart` para la semana,
  `Button` para las comidas (ya anda).
- **Llega:** por aire. Los tres tamaños ya están declarados.
- **Trabajo:** chico. Un día en la galería y uno en la app. La semana, medio día más: la app tiene que pasar los
  siete días en las props.
- **Por qué primero:** es lo que pediste, es la comida (lo más usado) y no pide build. Es lo mismo que hacen
  Cronometer y MyFitnessPal: lo que queda y un toque para anotar [C17][C18].

### 1.2 Controles: Centro de control, pantalla bloqueada y botón de Acción

- **Qué ves:** botones redondos del sistema, por ejemplo «Decir lo que comí», «Escanear» y «+1 vaso». Los ponés en
  el Centro de control, abajo en la pantalla bloqueada (en lugar de la linterna o la cámara) o en el botón de
  Acción.
- **Qué hay:** nada. Las acciones rápidas del ícono (Anotar, Escanear, Agua, Peso) ya estaban en la lista de la
  próxima build (`spec/lo-que-te-toca.md`).
- **Cómo:**
  - `ControlWidget` en Swift, desde iOS 18, dentro de una extensión de widgets, con un `AppIntent` [A2].
  - `expo-widgets` no los arma [E1]. `@bacons/apple-targets` los hace, pero no está confirmado con el SDK 58 ni
    junto a `expo-widgets` [E6].
  - Lo más seguro: un plugin propio que sume un archivo Swift a la extensión de `expo-widgets` y lo meta en su
    `WidgetBundle`.
- **Con el teléfono bloqueado:** Apple da a entender que un control corre bloqueado, salvo que pida identificarse
  con `authenticationPolicy` [A3]. **Sin confirmar en un iPhone.** Los que abren Moss igual piden Face ID.
  - **Inferencia:** «+1 vaso» podría ser el único toque de Moss que anda sin desbloquear. Guardaría el vaso en el
    App Group, como los toques del widget, y Moss lo anota al abrirse.
- **Llega:** build, y cambia la huella.
- **Trabajo:** grande. De 3 a 5 días. Es Swift sin Mac: cada error aparece recién en EAS.
- **Quién lo tiene:** Foodnoms (controles que abren el escáner) [C16], Waterllama y WaterMinder (el agua)
  [C20][C21], Sleep Cycle (empezar la noche) [C10].

### 1.3 Tu noche en la mesa de luz (StandBy)

- **Qué ves:** de noche, cargando y de costado, el chico de «Tu noche»: «A dormir 23:15» y la cuenta que baja de
  a un minuto. A la mañana, la noche (parte 3).
- **Qué hay:** el chico ya existe. «en 1 h 30» cambia de a media hora, porque es texto fijo en cada entrada
  (`lineaDeLaNoche`, en `src/widgets/noche.ts`).
- **Cómo:** `Text` con `timerInterval`, que iOS actualiza solo [A6]. StandBy muestra solo los chicos, sin fondo y,
  con poca luz, en rojo [A7].
- **Llega:** por aire.
- **Trabajo:** chico (medio día).

### 1.4 El cielo en los modos tintado y transparente

- **Qué ves:** hoy, en tintado y transparente, Moss saca la imagen del cielo y queda la figura en blanco. Con
  `widgetAccentedRenderingMode('fullColor')` la imagen podría quedar con su color [A4].
- **Ojo:** Apple lo pensó para portadas de discos y fotos [A4], y el redondo y el en línea no tienen `fullColor`
  [A13]. Hay que verlo en el iPhone: puede desentonar con el resto de la pantalla.
- **Llega:** por aire (la build 8 trae `@expo/ui` 58.0.29).
- **Trabajo:** chico. Suma solo para quien usa tintado.

### 1.5 El agua dentro del mediano de Hoy

- **Qué ves:** una fila de vasos con «+» debajo de las comidas.
- **Qué hay:** el widget Agua, aparte, con «+» y «−».
- **Llega:** por aire. **Trabajo:** chico.
- **Solo si el mediano queda limpio.** Si no, mejor dos widgets que uno cargado.

### 1.6 Live Activity o Dynamic Island: no por ahora

- **Qué sería:** «A dormir en 45 min» en la isla, o «Durmiendo» toda la noche.
- **Lo que dice Apple** [A5]:
  - dura como mucho 8 horas activa y 4 más en la pantalla bloqueada;
  - se empieza con la app abierta, por push o desde un `LiveActivityIntent`;
  - desde iOS 26 se puede programar a una hora (`request(… start:)`), pero tiene que traer una alerta.
- **En `expo-widgets`:** sin hora de inicio [E1], y sus botones solo avisan a la app si está viva
  (`spec/sueno-sin-esfuerzo.md`, 6).
- **Llega:** por aire si arranca al abrir Moss a la noche. Programada, build.
- **Por qué no:** ocupa la isla toda la noche e insiste, y «Moss nunca insiste» y es más sobria. «Tu noche» ya
  muestra lo mismo sin ocupar nada. Yazio la usa para anotar comidas [C19]; Pillow, para la alarma [C12].

### 1.7 Que Hoy suba solo en la pila a la hora de comer

- `TimelineEntryRelevance` sirve en iPhone. Pero Apple dice que «puede» rotar el widget, sin garantía, y limita
  cuántas veces [A8].
- `expo-widgets` no lo tiene: Swift y un parche. Build.
- Suma poco.

### 1.8 Lo de iOS 26 y 27 que no hace falta

- **Widgets por push (iOS 26):** sirven para datos de un servidor [A9]. Lo de Moss está en el teléfono.
- **El extra grande vertical de iOS 27** (4 × 6) [A10]: un cielo de página entera. `expo-widgets` todavía no lo
  tiene. Esperar.
- **`levelOfDetail`:** en iPhone siempre es `default` [A11].
- **iOS 27 actualiza el widget casi en tiempo real con la app abierta** [A12]. Viene gratis.

---

## 2. La pantalla bloqueada

Lo que te gusta: un dato, grande, sin abrir nada. La regla que sale de ahí: **un dato por widget.** No sumar líneas
al que ya te gusta.

| # | Qué ves | Qué hay hoy | Llega | Trabajo |
|---|---|---|---|---|
| 1 | **«Tu noche» con la noche de verdad a la mañana:** «Anoche 23:46 → 07:02 · 7 h 16», con «Sí» | la noche esperada | build (Swift en `app-intents/`, sin cambiar la huella) y la vista por aire. Es la parte 3 | 1 a 2 días |
| 2 | **La deuda debajo de la noche:** «7 h 16 · deuda baja», con la palabra que ya usa Sueño | nada | por aire (props y vista) | chico |
| 3 | **A la tardecita, la hora de acostarte con la cuenta viva:** «A dormir 23:15 · en 1 h 30», sacada de tu periodo de melatonina, como el aviso | «A dormir» con la hora, de a media hora | por aire (`Text` con `timerInterval`) | chico |
| 4 | **La hora de acostarte junto a la hora del reloj,** en línea: «A dormir 23:15» | «Tu noche» no tiene el tamaño en línea | build (declarar `accessoryInline`) | chico |
| 5 | **El agua en un redondo:** un anillo con «5 de 8» | Agua es solo de la pantalla de inicio | build (declarar `accessoryCircular`). El botón anda en el redondo, con Face ID [A1] | chico |
| 6 | **Elegir qué muestra el redondo y el en línea:** calorías, proteína o agua, como el «Nutrient Focus» de MacroFactor [C15] | siempre calorías | build (`ios.configuration`) | chico a medio |
| 7 | **Un control abajo,** en lugar de la linterna: «Decir lo que comí» | nada | build (1.2) | grande |

La 2 y la 3 salen por aire ya. La 4, la 5 y la 6 conviene juntarlas en la build en que igual cambie la huella.

---

## 3. La noche sin abrir Moss

### Lo que no se puede

- **No hay aviso de «desbloqueó el teléfono» ni de «se despertó».**
  - Apple, en junio de 2026: «there is no direct, real-time callback» [B1].
  - Atajos no tiene disparador de desbloqueo ni de primer uso del día, tampoco en iOS 27 [B2][B3].
- **Con el teléfono bloqueado, Salud no se puede leer.** Está cifrada [B4][B5].
- **Si cerrás Moss deslizándola, iOS no la lanza en segundo plano hasta que la abras** [B6]. Ni los avisos de
  Salud, ni la tarea de fondo, ni las notificaciones silenciosas [B7][E4]. Rise les pide a sus usuarios que no la
  cierren [C1].
- **JavaScript en segundo plano, con el SDK 58. Inferencia: hay que medirlo.**
  - Desde el SDK 58, React Native arranca cuando se conecta una escena (`SceneDelegate`), no al lanzar la app
    [E2][E3]. iOS 27 lo exige.
  - Cuando iOS lanza Moss en segundo plano, no hay escena. Apple no dice si conecta una [B9].
  - `expo-task-manager`, para correr la tarea sin pantalla, busca un cargador (`react-native-experience`) que
    ninguna librería de Moss registra (`node_modules/expo-task-manager/ios/EXTaskManager/EXTaskService.m`).
  - Expo dice que correr tareas desde un App Intent viene «pronto» [E3]: hoy no se puede.
  - **Lo probable:** la tarea de fondo, un aviso de Salud o un Atajo corren JavaScript solo si Moss seguía en
    memoria, suspendida. Si iOS la había cerrado, no. Puede que la tarea de fondo casi nunca haya corrido.
- **La tarea de fondo no sirve para «al despertarme».** Es un `BGProcessingTask`: corre cuando iOS quiere, suele
  ser de noche y cargando [B10], y `expo-background-task` le pide red
  (`requiresNetworkConnectivity = true`). Apple no deja correr código a una hora fija [B6].

### Cómo lo hacen otras apps

| App | Cómo sabe la noche | ¿Sin abrirla? |
|---|---|---|
| **Rise** | el movimiento, los pasos y el uso del teléfono; o el reloj o el anillo por Salud [C2] | Lee Salud cada mañana [C3]. Pide no cerrarla: si la cerrás, el teléfono no le pasa nada hasta abrirla [C1]. Su widget muestra la deuda, la energía y la melatonina [C4] |
| **AutoSleep** | el reloj; sin reloj, la noche termina cuando tocás el iPhone [C5] | Notificación a la mañana. Su versión 6.18 (3/11) dice que el historial y los widgets se ponen al día sin abrirla [C6]. Pide la actualización en segundo plano [C7] |
| **Sleep Cycle** | con el teléfono solo, hay que empezarla cada noche [C8]; con el reloj, sola (Premium) [C9] | Con el reloj, sí. Tiene controles para empezar y terminar [C10] |
| **Pillow** | el reloj y Salud [C11] | Notificación con el resumen, de 0 a 90 minutos después, según lo que iOS la deje correr [C12] |
| **Athlytic** | el reloj | Avisa por escrito: con el teléfono bloqueado sus widgets no se actualizan, y a la mañana compite con otras apps por correr [C13][C14] |

**Lo que se repite:** nadie lee Salud con el teléfono bloqueado, todas dependen del tiempo que les da iOS, y la que
más promete admite hasta 90 minutos de demora.

### Las opciones, una por una

| Opción | Con reloj o anillo | Con el teléfono solo | Qué tan confiable | Qué pide | Qué haría falta en Moss |
|---|---|---|---|---|---|
| **Salud en segundo plano** (`HKObserverQuery` y `enableBackgroundDelivery`) | Sí: avisa cuando llega la noche. Pero la del reloj llega «muchos minutos» después de despertarte [B11], y la de un anillo, cuando su app sincroniza (Oura y Da Rings piden abrirla; `spec/aparatos.md`) | A medias: los pasos avisan como mucho una vez por hora [B12], y para leerlos el teléfono tiene que estar desbloqueado | Media a baja. Bloqueado no lee; cerrada a la fuerza, nada; un reporte de noviembre de 2026 habla de una hora de demora [B13]; y lo del JavaScript, arriba | El entitlement de background delivery [B14]. Hoy está apagado (`"background": false` en `app.json`): cambia la huella | `background: true`; `configureBackgroundTypes` con `sleepAnalysis` inmediato; suscribirse al cargar el módulo, no en un componente; y al aviso, `leerSalud`, `estimarAnoche` y `actualizarWidgets`. La librería ya registra los observers al lanzar y guarda los avisos hasta que llega el JavaScript (`@react-native-healthkit/core/ios/BackgroundDeliveryManager.swift`) |
| **La tarea de fondo** (lo que ya hay) | Casi nunca a la hora justa | Ídem | Baja para esto | Nada nuevo | Medir si corre (paso 0) |
| **Notificación silenciosa** a la hora de despertar | Igual, Salud no se lee bloqueada | Ídem | Baja: dos o tres por hora como mucho, iOS las demora o las descarta, y nada si la cerraste [B7] | Un servidor APNs y el entitlement de push: build | No |
| **Un Atajo al despertar:** Alarma › Se detiene, Sueño › Al despertar o Cargador › Desconectado, que llama a una acción de Moss | La hora de despertar mientras llega la noche del aparato | **La mejor:** la hora exacta, en el momento | Alta para que corra: en iOS 27 corren sin preguntar, con «Permitir con el iPhone bloqueado» [B2][B15]. La acción tiene unos 30 segundos [B16] | Que la persona arme la automatización. Afinar ya la guía; en iOS 27, de un toque | Hoy la acción solo guarda la invocación, y nada cambia hasta abrir Moss. **Falta que también escriba en el widget** (el camino, abajo) |
| **El despertador de Moss** (AlarmKit) | Ídem | Igual que el Atajo, sin armar nada | Media: el `stopIntent` no corrió en casos reportados en iOS 26.2.1, 26.6 y 27.0 [B17][B18][B19][B20] | Ya está | Lo mismo que el Atajo. Complemento, no la base |
| **El movimiento** (Core Motion) | — | Es un dato, no un aviso: no despierta a Moss. Guarda 7 días, con unos minutos de demora [B21] | — | Ya está | Leerlo con el teléfono bloqueado: **sin confirmar** |

Descartadas, como ya decía `spec/sueno-sin-esfuerzo.md`: la Live Activity «Durmiendo» (un toque cada mañana), la
notificación con botones (la regla de no insistir), el filtro de Concentración (da lo mismo que el Atajo) y
`BGContinuedProcessingTask` de iOS 26 (solo si la persona la empieza [B22]).

### El camino que recomiendo

La idea: **no esperar a que corra JavaScript.** Que el Swift de las acciones de Moss anote la hora en el widget al
instante, y que Moss haga la cuenta de verdad al abrirse, como hoy.

**Paso 0. Medir (por aire, chico).**

- Que Moss guarde en el teléfono cada vez que su JavaScript corre sin que la abras (la tarea de fondo, una acción
  atendida) y si estaba suspendida o se lanzó de cero. Mostrarlo en Sueño › Afinar, junto a lo que llegó de los
  Atajos.
- Con una semana se sabe si la tarea de fondo corre de verdad con el SDK 58.
- En Afinar, una línea: no cerrar Moss deslizándola, como pide Rise.

**Paso 1. La acción escribe en «Tu noche» (build, Swift en `app-intents/`, no cambia la huella; 1 a 2 días).**

Cuando llega «Paré la alarma», «Desconecté el cargador», «Terminó el enfoque Sueño», «Me desperté» o el despertador
de Moss, el Swift, además de guardar la invocación como hoy:

1. lee la línea de «Tu noche» del App Group (`__expo_widgets_Noche_timeline`, la que escribe `expo-widgets`);
2. suma la señal y su hora, en milisegundos, a las entradas de esa mañana (una lista `anclas` en las props);
3. recarga el widget (`WidgetCenter.shared.reloadTimelines`).

A la noche, lo mismo con «Conecté el cargador», «Empezó el enfoque Sueño» y «Me voy a dormir».

La vista, en JavaScript y por aire, decide qué mostrar:

- despertar: la última señal de despertar después de las 4;
- dormirse: la última de irse a dormir entre las 19 y las 4, más tu margen, que la app deja en las props;
- si falta una, la esperada.

Ninguna regla de `sinReloj.ts` pasa a Swift: el Swift solo anota. Al abrir Moss, la cuenta de siempre usa esas
mismas señales, así que el «Sí» del widget coincide con lo estimado (los 20 minutos de `COINCIDE`) y Sueño no
pregunta.

- **Qué ves:** parás la alarma y la pantalla bloqueada ya dice «Anoche 23:46 → 07:02 · 7 h 16», con «Sí». Sin
  abrir Moss.
- **Con reloj o anillo:** lo mismo, como adelanto, hasta que la noche del aparato llegue a Moss.
- **Riesgo:** dos escriben la línea a la vez, el Swift y un toque. El Swift lee y escribe en el momento, y la app
  ya vuelve a leer antes de pisar (`alDia`). Hay que probarlo en el iPhone.

**Paso 2. Que cada mañana tenga una señal (por aire).**

Empujar las automatizaciones que Afinar ya guía: Alarma › Se detiene (o Sueño › Al despertar) y el cargador. Sin
señal, el widget muestra la esperada, como hoy.

**Paso 3. Salud en segundo plano (build que cambia la huella; 1 día más las pruebas).**

Para quien tiene un reloj o un anillo que escribe en Salud: `sleepAnalysis` inmediato. Cuando el aviso llega con
Moss viva y el teléfono desbloqueado, la noche medida reemplaza al adelanto del paso 1. Va en la build en que igual
cambie la huella, por ejemplo la de los controles (1.2).

**Paso 4. Cuando Expo deje correr tareas desde un App Intent [E3].**

La misma acción corre `estimarAnoche` entero, y la noche queda guardada en el almacén, no solo en el widget. El
paso 1 queda de respaldo.

**Qué quiere decir «registrada».** Moss guarda la noche al abrirse por primera vez en el día, y la abrís 4 a 6
veces por día para la comida. Con una señal, la confianza sube y Sueño no pregunta. Lo que cambia con este camino:
la ves, y la confirmás si querés, desde la pantalla bloqueada, sin entrar a Sueño.

**Tu anillo:** si Da Rings no escribe el sueño en Salud (`spec/aparatos.md`, sin confirmar), el paso 3 no te
cambia nada. El 1 sí.

### Cómo probarlo

1. El paso 0, una semana: si la tarea de fondo corre, y si con Moss suspendida o lanzada de cero.
2. Con la build del paso 1, con el teléfono bloqueado y Moss cerrada (y también cerrada a la fuerza):
   - parar la alarma con la automatización armada y mirar el widget en el momento;
   - tocar «Sí» con Face ID;
   - abrir Moss: Sueño no tiene que preguntar.
3. Lo mismo con el despertador de Moss, en iOS 26 y en iOS 27.
4. Con tu anillo: si la noche llega a Salud › Explorar › Sueño.

---

## Resumen

1. **Hoy, limpio como el de la pantalla bloqueada:** una cifra, tres barras y la luna; la semana en el grande.
   Por aire.
2. **Controles «Decir lo que comí», «Escanear» y «+1 vaso»** en el Centro de control, la pantalla bloqueada y el
   botón de Acción. Build.
3. **Tu noche en StandBy, con la cuenta hasta acostarte viva.** Por aire.
4. **Pantalla bloqueada:** la deuda debajo de la noche y la hora de acostarte con la cuenta viva, por aire. El
   agua en un redondo, «A dormir» en línea y elegir qué muestra cada uno, build.
5. **La noche:** iOS no avisa al desbloquear, Salud no se lee bloqueado, y puede que el JavaScript no corra sin
   escena (hay que medirlo).
6. **Paso 0:** medir si la tarea de fondo corre, y decir en Afinar que no cierren Moss. Por aire.
7. **Paso 1:** las acciones de la alarma, el cargador y el despertador anotan su hora en «Tu noche» y la recargan.
   Ves «Anoche 23:46 → 07:02» sin abrir Moss. Build, sin cambiar la huella.
8. **Paso 2:** empujar las automatizaciones de la alarma y el cargador que ya guía Afinar. Por aire.
9. **Paso 3:** Salud en segundo plano para relojes y anillos. Build, cambia la huella.
10. **Paso 4:** cuando Expo deje correr tareas desde un App Intent, la cuenta entera sin abrir Moss.

---

## Fuentes

Todas consultadas el 25/11/2026. Las páginas de documentación de Apple no muestran fecha.

### Apple: widgets, controles y Live Activities

- [A1] «Adding interactivity to widgets and Live Activities»:
  https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities
- [A2] «Creating controls to perform actions across the system»:
  https://developer.apple.com/documentation/widgetkit/creating-controls-to-perform-actions-across-the-system ·
  `ControlWidget`: https://developer.apple.com/documentation/swiftui/controlwidget
- [A3] «Adding refinements and configuration to controls»:
  https://developer.apple.com/documentation/widgetkit/adding-refinements-and-configuration-to-controls ·
  `authenticationPolicy`: https://developer.apple.com/documentation/appintents/appintent/authenticationpolicy
- [A4] «Optimizing your widget for accented rendering mode and Liquid Glass»:
  https://developer.apple.com/documentation/widgetkit/optimizing-your-widget-for-accented-rendering-mode-and-liquid-glass
- [A5] «Displaying live data with Live Activities»:
  https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities ·
  `request(attributes:content:pushType:style:alertConfiguration:start:)`, iOS 26:
  https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:start:)
- [A6] «Keeping a widget up to date»: https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date ·
  «Displaying dynamic dates in widgets»: https://developer.apple.com/documentation/widgetkit/displaying-dynamic-dates
- [A7] «Adding StandBy and CarPlay support to your widget»:
  https://developer.apple.com/documentation/widgetkit/adding-standby-and-carplay-support-to-your-widget
- [A8] «Increasing the visibility of widgets in Smart Stacks»:
  https://developer.apple.com/documentation/widgetkit/widget-suggestions-in-smart-stacks
- [A9] «Updating widgets with WidgetKit push notifications»:
  https://developer.apple.com/documentation/widgetkit/updating-widgets-with-widgetkit-push-notifications · WWDC25,
  «What's new in widgets»: https://developer.apple.com/videos/play/wwdc2025/278/
- [A10] WWDC26, «WidgetKit foundations»: https://developer.apple.com/videos/play/wwdc2026/277 · 9to5Mac, «iOS 27 adds
  extra large widgets…», 8/6/2026:
  https://9to5mac.com/2026/06/08/ios-27-adds-extra-large-widgets-for-your-extra-large-needs/
- [A11] `levelOfDetail`: https://developer.apple.com/documentation/widgetkit/levelofdetail
- [A12] Foro de Apple, actualizaciones de widgets con la app abierta (junio de 2026):
  https://developer.apple.com/forums/thread/834432 · 9to5Mac, la lista del keynote de iOS 27, 12/6/2026:
  https://9to5mac.com/2026/06/12/heres-everything-new-in-ios-27-and-more-per-apples-keynote-list/
- [A13] «Preparing widgets for additional platforms, contexts, and appearances»:
  https://developer.apple.com/documentation/widgetkit/preparing-widgets-for-additional-contexts-and-appearances

### Apple: segundo plano, Salud, Atajos y AlarmKit

- [B1] Foro de Apple, saber cuándo se despertó (DTS, junio de 2026): https://developer.apple.com/forums/thread/834573
- [B2] «Event triggers in Shortcuts on iPhone or iPad» (iOS 26):
  https://support.apple.com/guide/shortcuts/apd932ff833f/9.0/ios/26
- [B3] «Setting triggers in Shortcuts on iPhone or iPad» (iOS 26):
  https://support.apple.com/guide/shortcuts/apde31e9638b/9.0/ios/26 · «New in iOS 27», 26/10/2026:
  https://support.apple.com/en-us/149045
- [B4] «Protecting user privacy» (HealthKit): https://developer.apple.com/documentation/healthkit/protecting-user-privacy
- [B5] Foro de Apple, Salud con el teléfono bloqueado (DTS, mayo de 2026):
  https://developer.apple.com/forums/thread/824819
- [B6] Foro de Apple, apps cerradas a la fuerza (DTS, octubre de 2025): https://developer.apple.com/forums/thread/803365 ·
  «iOS Background Execution Limits» (último cambio 9/1/2026): https://developer.apple.com/forums/thread/685525
- [B7] «Pushing background updates to your app»:
  https://developer.apple.com/documentation/usernotifications/pushing-background-updates-to-your-app
- [B9] «Managing your app's life cycle»: https://developer.apple.com/documentation/uikit/managing-your-app-s-life-cycle
- [B10] «Choosing background strategies for your app»:
  https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app · WWDC25,
  «Finish tasks in the background»: https://developer.apple.com/videos/play/wwdc2025/227/
- [B11] Foro de Apple, el sueño del reloj llega tarde (septiembre de 2024): https://developer.apple.com/forums/thread/763329 ·
  la sincronización del reloj (DTS, febrero de 2025): https://developer.apple.com/forums/thread/774953
- [B12] `enableBackgroundDelivery(for:frequency:withCompletion:)`:
  https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:)
- [B13] Foro de Apple, una hora de demora (noviembre de 2026): https://developer.apple.com/forums/thread/856115
- [B14] El entitlement `com.apple.developer.healthkit.background-delivery`:
  https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit.background-delivery
- [B15] Las automatizaciones que corren solas (iOS 27): https://support.apple.com/guide/shortcuts/apdfbdbd7123/ios
- [B16] `supportedModes` (iOS 26): https://developer.apple.com/documentation/appintents/appintent/supportedmodes · el tope
  de unos 30 segundos: https://developer.apple.com/documentation/appintents/intentcancellationreason/timeout ·
  `LiveActivityIntent`: https://developer.apple.com/documentation/appintents/liveactivityintent
- [B17] Foro de Apple, preguntas de AlarmKit (DTS, 15/8/2025): https://developer.apple.com/forums/thread/797158
- [B18] AlarmKit en iOS 26.2.1: https://developer.apple.com/forums/thread/815064 · con el botón de encendido
  (noviembre de 2025): https://developer.apple.com/forums/thread/807710
- [B19] AlarmKit en iOS 26.6: https://developer.apple.com/forums/thread/842638
- [B20] AlarmKit en iOS 27.0: https://developer.apple.com/forums/thread/855611
- [B21] `queryActivityStarting(from:to:to:withHandler:)`:
  https://developer.apple.com/documentation/coremotion/cmmotionactivitymanager/queryactivitystarting(from:to:to:withhandler:)
- [B22] «Performing long-running tasks on iOS and iPadOS»:
  https://developer.apple.com/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados

### Expo

- [E1] `expo-widgets`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/widgets/ · el blog, «iOS widgets and Live
  Activities are stable in Expo SDK 56», 18/6/2026: https://expo.dev/blog/ios-widgets-and-live-activities-in-expo
- [E2] El ciclo de vida con escenas: https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md (sin fecha)
- [E3] «Expo SDK 58», 15/10/2026: https://expo.dev/changelog/sdk-58
- [E4] `expo-background-task`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/background-task/
- [E6] `@bacons/apple-targets`: https://github.com/EvanBacon/expo-apple-targets

### Otras apps

- [C1] Rise, «Should I leave the RISE app running in the background?», 20/5/2026:
  https://help.risescience.com/hc/en-us/articles/40609702562583
- [C2] Rise, «How does RISE track my sleep?», 20/5/2026: https://help.risescience.com/hc/en-us/articles/40624579537303
- [C3] Rise, «How do I set up RISE on my Apple Watch?», 3/8/2026:
  https://help.risescience.com/hc/en-us/articles/4405263000471
- [C4] Rise, «How do I set up RISE widgets?», 19/5/2026: https://help.risescience.com/hc/en-us/articles/40590423725719
- [C5] AutoSleep, «Quick Guide» (noviembre de 2026): https://autosleepapp.tantsissa.com/user-guide/quick-guide
- [C6] AutoSleep en la App Store (versión 6.18): https://apps.apple.com/us/app/1164801111
- [C7] AutoSleep, «FAQ»: https://autosleepapp.tantsissa.com/faq · «Widgets»:
  https://autosleepapp.tantsissa.com/user-guide/widgets
- [C8] Sleep Cycle, «How does Sleep goal work?», 11/4/2025: https://support.sleepcycle.com/hc/en-us/articles/9189536640018
- [C9] Sleep Cycle, «Sleep Cycle and Apple Watch Integration»: https://support.sleepcycle.com/hc/en-us/articles/206704349
- [C10] Sleep Cycle, «New features in Sleep Cycle with iOS 18», 1/10/2026:
  https://support.sleepcycle.com/hc/en-us/articles/15811841255452
- [C11] Pillow, «Automatic Sleep Tracking», 26/9/2025:
  https://intercom.help/pillow_app/en/articles/3733498-automatic-sleep-tracking
- [C12] Pillow, «Sleep Report Notification», 28/11/2025:
  https://intercom.help/pillow_app/en/articles/5827960-sleep-report-notification-setting-up-and-troubleshooting · la
  Live Activity de la alarma: https://apps.apple.com/gb/app/pillow-sleep-tracker/id878691772
- [C13] Athlytic, «Widgets or Complications Not Updating», 24/2/2025:
  https://athlyticapp.helpscoutdocs.com/article/18-widgets-complications-not-updating
- [C14] Athlytic, los avisos de la mañana, 26/2/2025:
  https://athlyticapp.helpscoutdocs.com/article/41-why-am-i-not-getting-notifications-on-time
- [C15] MacroFactor, «Widgets», 16/1/2024: https://macrofactor.com/widgets/
- [C16] Foodnoms en la App Store: https://apps.apple.com/us/app/-/id1479461686 · «How do I set up widgets?», 21/11/2026:
  https://www.foodnoms.com/help/widgets/
- [C17] Cronometer, «iOS Home Screen Widgets», 22/10/2026: https://support.cronometer.com/hc/en-us/articles/4407693442324
- [C18] MyFitnessPal, «How to add a Widget to mobile Home Screen», 27/8/2026:
  https://support.myfitnesspal.com/hc/en-us/articles/6886354417165
- [C19] Yazio, «How can I use Live Activities? (iOS)», 20/11/2026:
  https://help.yazio.com/hc/en-us/articles/29612994653201
- [C20] Waterllama en la App Store: https://apps.apple.com/us/app/-/id1454778585
- [C21] 9to5Mac, WaterMinder para iOS 18, 30/9/2024: https://9to5mac.com/2024/09/30/waterminder-calory-ios-18-update/

### El repo

`src/widgets/` (las vistas y `noche.ts`), `src/fondo/tarea.ts`, `src/salud/`, `app-intents/`, `app.json` y, en
`node_modules`: `expo-widgets/ios/Widgets/` (`AppIntent.swift`, `ViewRenderer.swift`, `WidgetLiveActivity.swift`),
`expo-widgets/ios/LiveActivityFactory.swift`, `expo-background-task/ios/BackgroundTaskScheduler.swift`,
`expo-task-manager/ios/EXTaskManager/EXTaskService.m`, `expo-app-intents/ios/AppIntentDispatcher.swift`,
`@react-native-healthkit/core/ios/BackgroundDeliveryManager.swift` y `expo/ios/Expo/ExpoAppSceneDelegate.swift`.
