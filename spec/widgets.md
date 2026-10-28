# Widgets

Investigado el 21/10/2026 y hecho el 26/10/2026, para la build de la revisión. La galería
(escenario `widgets`, sección «Los widgets») es la referencia visual.

## Qué hay en la v1

- **`Cielo`, en la pantalla de inicio** (`systemSmall` y `systemMedium`):
  - **Chico:** el cielo de hoy de un vistazo: la constelación del día con lo encendido, «3 de 6»
    y el nombre de la constelación, chico. Tocarlo abre Moss.
  - **Mediano:** lo mismo y hasta 4 botones «hecho» de los hábitos que se marcan a mano, en el
    orden de sus estrellas. Los de Salud, Ascent y la comida se encienden solos: no llevan botón.
  - **Día completo:** las líneas y las estrellas pasan a oro, sin texto.
- **`Noche`, en la pantalla bloqueada** (`accessoryRectangular`): «Anoche», «23:40 → 07:10» y
  «Sí» (spec/sueno-sin-esfuerzo.md, 5: ya no es «por qué no ahora»).
- **Una tarea de segundo plano** (`expo-background-task`) que los refresca con Moss cerrada.
- **Gratis:** StandBy, y los modos tintado y transparente de iOS 26.

## Con qué: `expo-widgets` 58.0.23

- Las vistas son TypeScript con `@expo/ui/swift-ui`: `src/widgets/Cielo.widget.tsx` y
  `Noche.widget.tsx`.
- **La función con `'widget'` vive sola.** El armado la pasa a texto y corre en el JavaScript de la
  extensión, que solo tiene los componentes y modificadores de Expo UI:
  - sin hooks, sin el almacén, sin `t()` y sin nada de afuera de la función, ni constantes del
    mismo archivo;
  - todo llega en las props, ya traducido (`src/widgets/tipos.ts`);
  - `src/widgets/widgets.test.ts` los corre así, en un contexto vacío con esos nombres, y toca sus
    botones como la extensión.
- **Sin imágenes:** la figura son círculos y rectángulos finos girados. Así no hay archivos en el
  App Group ni riesgo con el tope de memoria (unos 30 MB).
- **La figura tiene medidas fijas** (112 × 76 en el chico, 126 × 80 en el mediano): Expo UI no da
  el tamaño del widget, y así entra en el más chico (148 puntos, iPhone SE).
- **La app registra la vista al arrancar** (`createWidget`) y la guarda en el App Group. Una
  actualización por aire cambia los widgets.
  - Sin `initialLayout` en `app.json`: así no corre un armado más en Xcode, que podría romper la
    build. El costo: recién instalada, hasta abrir Moss una vez, la galería de widgets muestra uno
    vacío.
- **Los nombres de la galería de widgets van en español** («Moss», «Tu noche»): el plugin los
  escribe tal cual en Swift y no los traduce.

## Cómo llegan los toques a la app

- **El toque corre en la extensión** (iOS 17 o más), no en la app. Lo que devuelve el botón se
  suma a las props de la entrada que se veía, y iOS la vuelve a dibujar.
- **En el cielo,** el «hecho» se suma a `pendientes` de su entrada, con el hábito, si queda
  encendido y la hora. Hay uno solo por hábito: el último.
  - El destino del botón lleva el día. Si la línea cambió entre que se dibujó y el toque, el toque
    no cae en otro día.
- **Al abrir Moss** (y al volver a ella, y cuando cambia algo que muestran), `src/widgets/index.ts`:
  1. lee la línea (`getTimeline()`);
  2. aplica los toques de hoy por el almacén (`marcar`), con la clave `hábito:día`. Gana el último:
     si en Moss se cambió después del toque, el toque se olvida;
  3. escribe la línea nueva, y antes la vuelve a leer: si llegó un toque en el medio, empieza de
     nuevo, así no se pierde.
- **Solo la app y la tarea de fondo escriben la línea;** el widget solo suma toques a la suya.
- **No sirve `addUserInteractionListener`:** escucha solo con la app viva.

## La medianoche

- Moss deja armados **hoy y los seis días que siguen**, cada uno desde su medianoche, con su
  constelación y todo apagado. A las 0:00 el widget pasa solo al día nuevo, aunque no se abra
  Moss en una semana.
- **El día lo calcula la app** y va en cada entrada.
- **Un toque de ayer** (marcar a las 23:50 y abrir Moss al otro día) se aplica a ese día, hasta 14
  días atrás, con `marcarEnDia` del almacén, que rearma el resumen de ese día (o lo arma, si Moss
  no se abrió).
  - Todos los toques van con la hora del toque, no la de abrir Moss: entre teléfonos gana de
    verdad el último.
  - Lo `atrasados` que dejó en la línea una versión anterior se lee y se aplica igual.

## La noche, sin abrir Moss

- **El problema:** Moss estima la noche al abrirse (`estimarAnoche`), y el widget tiene que mostrar
  algo a la mañana, antes.
- **La solución:** la app deja armada desde antes **la noche esperada** para la mañana siguiente,
  desde las 4:
  - lo de siempre (`habitualDe`), de a 5 minutos;
  - con el despertador de Moss, su hora para despertar (`despertador` en `lineaDeLaNoche`; falta
    pasársela cuando exista).
- **Con la noche ya estimada,** el widget muestra la estimada. La tarea de fondo la estima si Salud
  se puede leer.
- **El «Sí» del widget** queda en su entrada con las horas que mostraba. Al abrir Moss:
  - si Moss ya estimó esa noche y las dos horas coinciden (20 minutos de cada lado), la estimada
    queda **confirmada**, como el «Sí» de la mañana en Sueño, y la pregunta no aparece;
  - si no coinciden, se olvida: Moss pregunta como siempre;
  - si todavía no la estimó, espera.
- **No propone** con un reloj o un anillo: muestra lo medido, sin botón. Tampoco la mañana de cada
  semana en que Moss pregunta sin proponer (`quePreguntar`): ahí dice «Anótala en Moss».
- **Con el teléfono bloqueado,** iOS pide Face ID antes de correr el «Sí».
- **Hasta las 4,** «anoche» es la de ayer. Si Moss no se abre en dos días, una tercera entrada deja
  el widget sin horas, para no mostrar una noche vieja.

## La tarea de segundo plano

- **Qué es:** `src/fondo/tarea.ts`, definida al cargar el módulo (`TaskManager.defineTask`, que
  importa `src/app/_layout.tsx`) y registrada al abrir Moss, con un mínimo de 4 horas.
- **Cuándo corre:** iOS decide (`BGProcessingTask`, suele ser de noche y cargando).
- **Qué hace:**
  - arranca el almacén y cambia de día;
  - si Salud se puede leer: enciende los hábitos de Salud y estima la noche;
  - aplica lo tocado en los widgets y les escribe la línea.
- **Qué no hace:** no sube nada, no programa avisos y no anota que Moss se abrió.
- **En la web, en los tests o sin los módulos en la build** (una build vieja), los widgets y la
  tarea no hacen nada: se cargan con `requireOptionalNativeModule`.

## Lo que falta o no se pudo

- **Que Moss no anote «abierta» cuando iOS la abre en segundo plano.** `useAlmacenListo`
  (`src/almacen/index.ts`) llama a `anotarUso('abrir')` aunque la app arranque en segundo plano: por
  la tarea, por un Atajo o por el pre-arranque de iOS.
  - Sin reloj, eso dice que estabas despierto a esa hora y corre la noche.
  - Arreglo: anotarlo solo si `AppState.currentState !== 'background'`. El cambio a `active` ya lo
    anota.
- **Abrir directo en Hábitos o en Sueño** al tocar un widget: hoy abre Moss en Inicio
  (`moss://`), porque `Secciones` no lee la sección del enlace.
- **El despertador:** cuando exista, pasar su hora de mañana a `lineaDeLaNoche`.
- **El tamaño grande y el Centro de control:** para después.

## Riesgos de la build

- **La extensión es nueva:** `uy.moss.app.ExpoWidgetsTarget` con el App Group
  `group.uy.moss.app`.
  - La primera `eas build` tiene que ser interactiva, para registrar el App Group y el perfil de la
    extensión (a Ascent le pasó con HealthKit).
  - El plugin la suma a `extra.eas.build.experimental.ios.appExtensions`.
- **El armado de la extensión** corre Node en Xcode (`ExpoWidgets.bundle`, de `expo-widgets`). Sin
  `initialLayout` no corre nada nuestro ahí.
- **Si una vista falla en el teléfono,** con build de desarrollo se ve un recuadro rojo con el
  error; en la de la tienda, un widget vacío.
- **Agregar el widget cambia la huella:** corta las actualizaciones por aire a las builds ya
  instaladas.

## Cómo probarlo en el iPhone

1. Con la build nueva, abrir Moss una vez y agregar el chico, el mediano y, en la pantalla
   bloqueada, «Tu noche».
2. Tocar un «hecho» en el mediano con Moss cerrada: el círculo se llena y la cuenta sube. Abrir
   Moss: la estrella está encendida en Hábitos.
3. Marcar algo en Moss y volver al inicio: el widget lo muestra.
4. Dejar pasar la medianoche sin abrir Moss: el widget pasa al día nuevo, todo apagado.
5. Sin reloj, a la mañana con el teléfono bloqueado: «Anoche» con las horas de siempre y «Sí».
   Tocarlo, abrir Moss: si coincide con lo estimado, Sueño no pregunta.
6. Probar el tintado y el transparente (iOS 26) y StandBy (cargando, de costado).

## Fuentes

- `expo-widgets`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/widgets/
- `expo-background-task`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/background-task/
- El ejemplo de Expo: https://github.com/expo/examples/tree/master/with-widgets
- Botones en widgets: https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities
- Recargas: https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
- Lo de cómo llega un toque, del código de `expo-widgets` 58.0.23 (`ios/Widgets/AppIntent.swift`,
  `WidgetsStorage.swift`, `bundle/index.ts`).
