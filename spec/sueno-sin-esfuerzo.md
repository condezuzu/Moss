# El sueño sin esfuerzo

Investigado el 22/10/2026. Lo pedido: las dos primeras semanas, Moss pregunta
cada mañana a qué hora se durmió; después, solo si duda. Para que cueste menos,
se buscó cómo saber la hora de dormir y de despertar sin reloj y sin esfuerzo
diario:

- (a) un despertador dentro de Moss;
- (b) Atajos automáticos que se arman una vez (el cargador de noche, el Focus de Sueño);
- (c) confirmar la noche desde un widget de la pantalla bloqueada, con un toque;
- (d) cualquier otra señal: filtros de Concentración, el horario de Salud, Live
  Activities, notificaciones con botones, el desbloqueo.

Completa «Sin reloj» de [`sueno.md`](sueno.md), que ya prevé las anclas de un
Atajo (`Ancla` en `src/dominio/sinReloj.ts`). Las fuentes, numeradas, están al
final.

## La recomendación

| | Qué aprende Moss | Lo que hace la persona, una vez | Cuándo |
|---|---|---|---|
| 1. **Atajos que avisan a Moss** (App Intents) | La hora exacta en que paró la alarma, conectó o desconectó el cargador, o empezó y terminó el Focus de Sueño | Armar una o dos automatizaciones en Atajos; en iOS 27, agregarlas desde un enlace | **v1** |
| 2. **Preguntar solo lo dudoso** | — | Nada | **v1** |
| 3. **El despertador de Moss** (AlarmKit, iOS 26+) | La hora programada y la hora exacta en que lo paró | Poner la alarma en Moss en vez del Reloj y aceptar el permiso | **v1** desde el 26/10/2026 (D28), sin «posponer» |
| 4. **El filtro de Concentración de Sueño** | La hora en que el Focus empieza y termina | Agregar el filtro de Moss en Ajustes | después, solo si los Atajos no alcanzan |
| 5. **Confirmar desde la pantalla bloqueada** (widget) | Solo «sí» a la noche que muestra | Agregar el widget | después, y solo si la noche puede estar lista antes de abrir Moss |
| 6. Live Activity, notificación con botones y lo demás | — | — | no |

Por qué este orden:

- **Lo que más ahorra es preguntar menos, no mover el toque.** Moss se abre 4 a 6
  veces por día para la comida, así que la pregunta dentro de Moss ya cuesta un
  toque. Cada ancla exacta sube la confianza y saca preguntas.
- **Sirve lo que la persona hace con el teléfono:** parar la alarma, conectar el
  cargador, prender el Focus a mano. Lo que sale de un horario dice el plan, no
  lo que pasó: con horario, el Focus de Sueño empieza solo al comenzar la
  relajación [17].
- **Ninguna señal da la hora exacta de dormirse.** Son topes: «despierto a las
  23:52», «despierto desde las 7:31 o antes». Lo que tarda en dormirse sigue
  saliendo de lo aprendido y de la confirmación.
- **La 1 no pide permisos, ni extensión, ni App Group**, anda desde iOS 16.4 y
  no cambia ninguna costumbre: la persona sigue con su alarma.
- **La 3 obliga a cambiar de despertador** y pide iOS 26 (el 79 % de los iPhone
  el 7/6/2026 [41]), con fallas reportadas en iOS 26.2 y en las betas de iOS 27
  [38][39].
- **La 5 no tiene qué mostrar a tiempo:** la noche se estima al abrir Moss.

## 1. Atajos que avisan a Moss (v1)

### Qué es

- Moss declara acciones (App Intents, iOS 16+) que aparecen solas en la app
  Atajos [1].
- La persona arma una automatización: «cuando pase esto, correr la acción de
  Moss». Moss no puede crearla sola.
- **Los disparadores que sirven** (guía de Apple [7][8]):
  - **Alarma, al detenerse:** cualquier alarma del Reloj, una en particular o la
    de despertar.
  - **Cargador, al conectarse o desconectarse:** con cable, inalámbrico o funda.
  - **Concentración (el Focus de Sueño), al activarse o desactivarse.**
  - **Sueño:** «empieza la relajación», «empieza la hora de dormir» y «al
    despertar» (cuando suena la alarma de Salud). Piden el horario de Salud y
    dicen el plan.

### Las acciones de Moss

Una acción por disparador, así el dominio sabe de dónde vino. Los nombres son
una propuesta; los de Apple en español (Atajos, Concentración) se copian del
iPhone.

| Acción | Disparador | Para el dominio |
|---|---|---|
| «Paré la alarma» | Alarma, al detenerse | `Ancla` de despertar, y actividad |
| «Conecté el cargador» | Cargador, al conectarse | actividad (tocó el teléfono); de 19 a 4, candidata a lo último del día |
| «Desconecté el cargador» | Cargador, al desconectarse | actividad |
| «Empezó el Focus de Sueño» / «Terminó el Focus de Sueño» | Concentración | ancla solo si no es la hora del horario (abajo) |
| «Me voy a dormir» / «Me desperté» | a mano, con Siri o el botón de Acción | `Ancla` de dormir o de despertar |

- **Ojo con el Focus programado.** Hoy `sinReloj.ts` cuenta «prender el Focus de
  Sueño» como tocar el teléfono. Con horario, el Focus empieza solo con la
  relajación [17] y termina solo a la hora de despertar [18]. Propuesta: si la
  hora se repite al minuto varias noches, es el horario y no cuenta.
- **El horario de Salud como punto de partida:** con el disparador «empieza la
  hora de dormir», Moss sabe el plan desde la primera noche. Hoy, sin historia,
  supone las 0:30.

### Qué aprende Moss

- **Solo la hora en que corrió la acción** y cuál fue. Nada más: ni qué alarma
  ni la batería.
- **La hora llega sola:** cada invocación trae `createdAt`, en milisegundos [55].

### Lo que hace la persona, una vez

- **De iOS 16.4 a iOS 26:** en Atajos, crear la automatización, elegir el
  disparador y la acción de Moss, y que corra sin preguntar [10][11]. Son unos
  10 toques por automatización (estimación). Moss lo explica paso a paso en
  «Afinar».
- **En iOS 27:**
  - las automatizaciones pasaron a ser atajos con un disparador, y viajan cuando
    se comparten [12][13]. Los disparadores nuevos de iOS 27 no son del sueño [15];
  - una app ya ofrece «agregar a Atajos»: se abre el enlace, se activa la
    automatización y se agrega [14];
  - Moss puede hacer lo mismo, con un enlace de iCloud por automatización, armado
    en el iPhone;
  - hay que confirmarlo en el teléfono: sale de reportes de terceros, y las
    automatizaciones que llegan sincronizadas vienen apagadas [13].
- **Con el teléfono bloqueado:**
  - la acción queda con `authenticationPolicy` de fábrica, `alwaysAllowed`, que
    corre aun bloqueado [5];
  - en iOS 27, la guía de Apple pide activar en el atajo la opción de privacidad
    que lo deja correr bloqueado [9].
- **Puede aparecer un aviso de Atajos cada vez que corre.** Según la versión se
  puede apagar o no [11]: hay que verlo en el iPhone.

### Con Moss cerrada

- **Corre.** La acción corre en el proceso de Moss, en segundo plano, «en un modo
  especial, sin escenas» [1]. Apple pide que las acciones corran en segundo
  plano siempre que se pueda [2].
- **Por eso no hay que contar con JavaScript en ese momento:** el Swift guarda la
  invocación y el JavaScript la aplica al abrir Moss.
- Cambia una frase de `sueno.md`: «Nada corre de noche» pasa a «de noche solo se
  guarda la hora de un Atajo».

### Permisos, privacidad y revisión

- **Ningún pedido del sistema:** la automatización la arma la persona.
- **Las horas quedan en el teléfono**, como el movimiento. Sube solo la noche
  confirmada (`0005_noches.sql`).
- **Riesgo bajo en la revisión.** La guía 2.5.11 pide acciones que se esperan de
  la app, resueltas de la forma más directa [16]. Anotar que alguien se durmió o
  se despertó, en una app con sección de sueño, lo es.
- **Las frases para Siri son opcionales.** Cada una lleva el nombre de la app, y
  una app tiene como mucho 10 atajos propios [55].

### Cómo se arma en el SDK 58

- **Un módulo local de `modules/` no sirve.** Es un pod estático, y la extracción
  de metadatos de App Intents solo ve el código del target de la app o de un
  framework dinámico [6][57].
- **Con `expo-app-intents`** (alfa, 0.5.11 del 21/10/2026) [55][56][70]:
  - el Swift va en `app-intents/`, y los módulos en línea (experimentales desde
    el SDK 56) lo compilan dentro del target de la app [59];
  - `AppIntentDispatcher.shared.dispatch(name:params:)` guarda la invocación antes
    de avisar a JavaScript. Llega «al menos una vez», y la cola guarda las
    últimas 100 [55];
  - en JavaScript, `useAppIntents` en `src/app/_layout.tsx`: cada invocación trae
    `id`, `name`, `params` y `createdAt`. Se aplica al almacén y se borra con
    `removePendingInvocationAsync(id)` [55];
  - su plugin no agrega permisos ni claves: solo revisa la carpeta [58].
- **Sin `openAppWhenRun`, la acción corre en segundo plano** [1]. En iOS 26,
  `openAppWhenRun` quedó obsoleto y el modo se declara con `supportedModes` [3][4].
- **Las anclas van al almacén local**, en una tabla que no sincroniza, con el `id`
  de la invocación como clave para no duplicar.
- **Los nombres de las acciones son nativos** (`LocalizedStringResource` y un
  `.xcstrings` en el target de la app). Es la única excepción a «todo el texto
  está en `es.json` y `en.json`»: conviene generarlos desde ahí con un plugin. Hay
  que confirmar cómo entra el `.xcstrings` con los módulos en línea.
- **El riesgo:** `expo-app-intents` es alfa y cambia seguido. El plan B es el
  mismo Swift en una carpeta propia de módulos en línea, sin la cola de Expo.
- **Esfuerzo (estimación):** 2 a 3 días, con la guía de «Afinar» primero en la
  galería, más una build `dev` de prueba.

Boceto, sin compilar:

```swift
// app-intents/PareLaAlarma.swift
import AppIntents
internal import ExpoAppIntents

// Solo deja constancia: la hora es `createdAt`, y la aplica JavaScript al abrir Moss.
struct PareLaAlarma: AppIntent {
  static let title: LocalizedStringResource = "Paré la alarma"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "alarmaParada", params: [:])
    return .result()
  }
}
```

```ts
// src/app/_layout.tsx (nombres del almacén de ejemplo)
AppIntents.useAppIntents(async (pendientes) => {
  for (const inv of pendientes) {
    await almacen.anclas.agregar({ id: inv.id, que: inv.name, en: inv.createdAt });
    await AppIntents.removePendingInvocationAsync(inv.id);
  }
});
```

## 2. Preguntar solo lo dudoso (v1)

- **Las dos primeras semanas, cada mañana.** Después, solo con confianza media o
  baja, como dice «La confianza y la pregunta de la mañana» en `sueno.md`.
- **Con la alarma parada, el borde de despertar queda casi resuelto.** Se pregunta
  solo «¿Te dormiste a las 00:30?», con «Sí» y «Cambiar». Es un toque igual, pero
  se corrige menos.
- **Hoy la alarma suma 0,05 a la confianza** (`sinReloj.ts`). Con un ancla
  exacta, conviene que suba más. Se calibra con la prueba en sombra de
  `sueno.md`.
- **La pregunta sigue dentro de Moss**, la primera vez que se abre en el día, y
  nunca con una notificación aparte (regla de `sueno.md`).

## 3. El despertador de Moss (AlarmKit, después de la v1)

### Qué es

- **AlarmKit, desde iOS 26.0** [32]: alarmas de una app que suenan aunque el
  teléfono esté en silencio o con cualquier Focus [36][37].
- Se ven en la pantalla bloqueada, en StandBy y en el Apple Watch [36].
- Van a una fecha fija o a una hora con días de la semana; las de hora siguen el
  cambio de zona [36].

### Qué aprende Moss

- **La hora programada**, porque la pone Moss.
- **La hora exacta en que la persona la paró.** Al detenerla, deslizando o con un
  botón físico, el sistema corre el `stopIntent` de la alarma [37]. Es una
  `LiveActivityIntent`: corre en el proceso de Moss, sin abrirla [35][40].
- **No sabe cuándo empezó a sonar** con Moss cerrada: en las betas de iOS 27, ese
  aviso (`alarmUpdates`) llega recién cuando Moss vuelve a correr [39].

### Lo que hace la persona, una vez

- Poner su hora de despertar en Moss, aceptar el pedido del sistema y apagar la
  alarma del Reloj.
- **Es un cambio de costumbre.** El Atajo de la opción 1 da lo mismo con la
  alarma de siempre.

### Con Moss cerrada

- **Suena igual:** la alarma queda en el sistema y sobrevive a reinicios, cierres
  forzados y fallas de la app [37].
- **Fallas reportadas:**
  - en iOS 26.2.1, si suena con el teléfono desbloqueado y la persona sigue
    usándolo o desliza el aviso, la alarma para pero el `stopIntent` no corre
    [38];
  - en las betas de iOS 27, alarmas que vuelven a sonar horas tarde, y sonido sin
    pantalla con un Focus (FB23754550, abierto en septiembre de 2026) [39].
- **Si Moss está oculta o pide Face ID para abrirse**, sus alarmas fallan sin
  avisar [37]. Moss tiene que decirlo al programar.

### Permisos y revisión

- **`NSAlarmKitUsageDescription` en el Info.plist.** Sin esa clave, o vacía, no
  se puede programar ninguna alarma [33].
- **El pedido** aparece con `requestAuthorization()` o solo, con la primera
  alarma [33][34]. Se cambia en Ajustes en cualquier momento [36].
- **Sin entitlement especial:** ni la documentación ni la sesión de Apple piden
  uno [33][36].
- **No hay una guía de revisión propia de AlarmKit** [16]. Apple dice que estas
  alarmas no reemplazan a los avisos críticos ni a los urgentes [36]: solo
  alarmas que pone la persona, nunca un «hora de dormir».
- **El riesgo es de confianza:** una alarma que falla deja a alguien dormido. Se
  prueba en iOS 26 y 27 antes de publicarla.

### Cómo se arma en el SDK 58

- **No hay módulo de Expo.** Hay varios de la comunidad, sin revisar a fondo:
  `expo-alarm-kit`, por ejemplo, pide iOS 26 como mínimo de la app, y Moss pide
  16.4 [43]. Además, un `stopIntent` dentro de un pod estático puede tener el
  problema de metadatos de la opción 1 (sin confirmar).
- **Swift propio en el target de la app**, con los módulos en línea (la carpeta de
  `expo-app-intents`):
  - un módulo `Despertador` con `programar`, `cancelar` y `permiso`;
  - `PareElDespertador`, una `LiveActivityIntent` que hace de `stopIntent` y llama
    a `dispatch`, como los Atajos.
- **Todo dentro de `if #available(iOS 26, *)`**, con AlarmKit enlazado como
  opcional (`-weak_framework AlarmKit`). El enlace automático a un framework más
  nuevo que el mínimo no siempre queda opcional [42].
- **Sin «posponer», no hace falta extensión.** Con cuenta regresiva o
  «posponer», AlarmKit espera una Live Activity en la extensión de widgets; sin
  ella, el sistema puede cerrar la alarma y no sonar [33]. `expo-widgets` no la
  puede alojar (sus Live Activities son de su propio tipo): haría falta un target
  propio (`@bacons/apple-targets`).
- **Esfuerzo (estimación):** 3 a 4 días sin «posponer», con la pantalla primero
  en la galería, más las pruebas en dos versiones de iOS.

## 4. El filtro de Concentración de Sueño (solo si los Atajos no alcanzan)

### Qué es

- `SetFocusFilterIntent`, desde iOS 16 [20]. Es lo que una app ofrece en
  Ajustes, en Concentración, dentro de cada Focus, en «Filtros» [19].

### ¿Llama iOS a Moss cuando el Focus de Sueño empieza y termina?

- **Sí.** Al empezar, con los valores que eligió la persona; al terminar, con los
  de fábrica [21][22].
- **Los parámetros tienen que ser opcionales:** con uno obligatorio, en un reporte
  solo llegó la llamada del comienzo [24].
- **Con Moss cerrada, solo desde una extensión de App Intents.** Apple: con la
  extensión, el aviso llega en el momento, sin que la app tenga que estar abierta
  antes [1][22]. Dentro de la app, un reporte de iOS 18 dice que solo corre con
  la app abierta [23].
- **Puede guardar la hora:** la extensión la escribe en el App Group, y Moss la
  lee al abrir [21].
- **No sabe qué Focus es:** la persona agrega el filtro de Moss solo a Sueño.

### Lo malo

- **Con horario, la señal es el plan:** el Focus empieza con la relajación y
  termina a la hora de despertar [17][18].
- **Fallas reportadas:** en una beta de iOS 18 no se llamaba a ningún filtro
  (FB14715113) [23]; en macOS 26.5, tampoco [25].
- **Da lo mismo que el disparador de Concentración de Atajos**, que no pide
  extensión.

### Una vez, permisos y revisión

- **Una vez:** Ajustes, Concentración, Sueño, Filtros, agregar el de Moss [19].
  Unos 6 toques, sin salir de Ajustes.
- **Sin pedido del sistema.**
- **Riesgo bajo si el filtro hace algo de verdad**, como callar los recordatorios
  de comida de Moss mientras dura (`appContext`) [20].

### Cómo se arma

- Un target `app-intent` de `@bacons/apple-targets` con el `SetFocusFilterIntent`
  en Swift, el App Group `group.uy.moss.app` y la lectura desde JavaScript con
  `ExtensionStorage` [65].
- **Riesgos de la herramienta:**
  - su rama principal sigue en el SDK 55, el paso al 57 es un borrador (#210) y el
    SDK 58 no está confirmado [66];
  - un `prebuild` sin `--clean` duplica los targets `app-intent` (#202) [67]. En
    EAS no pasa: arma `ios/` de cero.
- **La extensión lleva su propio perfil:** la primera build tiene que ser
  interactiva, como le pasó a Ascent.

## 5. Confirmar desde la pantalla bloqueada (widget)

### Qué se puede

- Un widget rectangular de la pantalla bloqueada (iOS 16+) con un botón «Sí»
  (iOS 17+) [44].
- **Con el teléfono bloqueado, el botón no hace nada hasta que la persona se
  identifica** [44]. Con Face ID es mirar y tocar; con Touch ID, apoyar el dedo.
- El toque corre en la extensión, con Moss cerrada. Moss lo aplica al abrir con
  `getTimeline()`, como los toques del widget de hábitos ([`widgets.md`](widgets.md)).
- **Moss aprende solo «sí»** a la noche que se mostraba.

### Por qué no ahora

- **La noche se estima al abrir Moss.** Para mostrarla antes, Moss tendría que
  estimarla en segundo plano, y:
  - con la app cerrada, una acción corre sin escenas y no hay garantía de que
    corra JavaScript [1];
  - Salud se cifra al bloquear el teléfono y puede no leerse en segundo plano
    [31];
  - estimar en Swift duplicaría `sinReloj.ts`, que también usa la galería.
- **Con lo de la noche anterior**, el widget mostraría la noche equivocada.
- **Moss se abre igual para anotar el desayuno**, y ahí la pregunta cuesta un
  toque.

### Cuándo tendría sentido

- Si la prueba muestra que JavaScript corre cuando llega «Paré la alarma» con
  Moss cerrada: estimar en ese momento y escribir la línea de tiempo del widget.
- Con `expo-widgets`, que la v1 ya prevé para la comida en la pantalla bloqueada
  (D8): la familia `accessoryRectangular` y un `Button` con `target` y un `onPress`
  que devuelve `{ confirmada: true }` [51].

## 6. Lo demás que se miró

- **Una Live Activity «Durmiendo», con «Me desperté»:**
  - se puede empezar en segundo plano desde una `LiveActivityIntent` [40][45], o
    programar para una hora desde iOS 26 [46][47];
  - dura como mucho 8 horas activa y 4 más en la pantalla bloqueada [45];
  - sus botones también piden identificarse [44];
  - en `expo-widgets`, el toque de una Live Activity solo avisa a JavaScript y no
    se guarda [52]: haría falta Swift propio.

  Pide un toque cada mañana y da lo mismo que la alarma: **no**.
- **Una notificación con «Sí» y «Cambiar»:** iOS abre Moss en segundo plano al
  elegir una acción, aun con el teléfono bloqueado [50]. Pero:
  - en `expo-notifications`, la tarea de segundo plano corre con un toque en una
    acción solo en Android [61]; en iOS haría falta un delegado nativo;
  - la noche tendría que estar estimada antes de avisar, el mismo problema del
    widget;
  - choca con la regla «nunca con una notificación aparte».

  **No**, salvo que se cambie la regla.
- **El horario de sueño de Salud no se puede leer.** El único tipo de categoría
  del sueño es `sleepAnalysis` [28], y en el foro de Apple la respuesta es que no
  está [29][30]. Los disparadores de Sueño de Atajos dan el plan como eventos
  (opción 1).
- **El bloqueo y el desbloqueo:** no hay forma pública con la app cerrada (ya en
  `sueno.md`).
- **`INFocusStatusCenter`:** solo dice si hay algún Focus, no cuál ni desde
  cuándo; se consulta con Moss abierta y pide la capacidad de notificaciones de
  comunicación, que es para apps de mensajes [26][27]. **No.**
- **Automatizaciones al abrir o cerrar otras apps:** darían el último uso del
  teléfono, pero piden una por app, muestran avisos y registran lo que hace la
  persona (guía 2.5.14) [16]. **No.**
- **Siri, el botón de Acción y el Centro de control:** las acciones de la opción 1
  sirven gratis con la voz o el botón de Acción. Un control del Centro de control
  (iOS 18) pide una extensión de widgets con Swift propio. Son esfuerzo diario:
  opcionales.
- **El Tiempo de uso (Family Controls):** después de la v1 (D26).

## Los widgets en el SDK 58

### `expo-widgets`: lo recomendado

- **Es el paquete de Expo**, 58.0.22 del 21/10/2026 [69]. Desde el SDK 58 también
  hace widgets de Android [60].
- **Su plugin** [51][54]:
  - crea la extensión `uy.moss.app.ExpoWidgetsTarget` y el App Group
    `group.uy.moss.app` (los de fábrica), y pone el grupo en la app y en la
    extensión;
  - agrega a la app `NSSupportsLiveActivities`,
    `NSSupportsLiveActivitiesFrequentUpdates` y `ExpoWidgetsAppGroupIdentifier`;
  - suma la extensión a `extra.eas.build.experimental.ios.appExtensions`, para que
    EAS arme sus credenciales [63].
- **Familias:** `systemSmall`, `systemMedium`, `systemLarge` y, en la pantalla
  bloqueada, `accessoryCircular`, `accessoryRectangular` y `accessoryInline` [51].
  Los botones andan en las dos primeras de la pantalla bloqueada [44].
- **Cómo escribe la app lo que muestra el widget** [51][53]:
  - `createWidget('Nombre', componente)` devuelve un objeto con
    `updateSnapshot(props)`, `updateTimeline([{ date, props }])`, `getTimeline()` y
    `reload()`;
  - lo guarda en `UserDefaults` del App Group, con la clave
    `__expo_widgets_<nombre>_timeline`;
  - las imágenes van en `widgetsDirectory`, una carpeta compartida.
- **Las recargas:** WidgetKit da de 40 a 70 por día a un widget que se mira
  seguido. No cuentan las que pide la app abierta ni las de un botón [48].
- **Los botones (iOS 17+):** `onPress` corre en el JavaScript del widget, dentro
  de la extensión (`WidgetUserInteraction`, un `AppIntent`). Guarda las props
  nuevas en la línea de tiempo y recarga [52]. `addUserInteractionListener` solo
  escucha con la app viva [51].
- **Las Live Activities:** `createLiveActivity`, y `start`, `update` y `end`, con
  `staleDate` desde el SDK 58 [51][60].

### `@bacons/apple-targets`: solo para lo que `expo-widgets` no hace

- **5.0.0 del 17/07/2026**, pide `expo >= 52`; el README dice SDK 53 o más
  [65][68]. Ascent la usa con el SDK 54.
- **El SDK 58 no está confirmado:** la rama principal es la del SDK 55, y el paso
  al 57 es un borrador (#210) [66].
- **Arma targets de muchos tipos:** `widget` (widgets y Live Activities),
  `app-intent` (extensión de App Intents), controles y más [65].
- **App Groups:** copia a cada target
  `ios.entitlements['com.apple.security.application-groups']` de `app.json`, salvo
  que el target diga otro [65].
- **Los datos:** `new ExtensionStorage('group.uy.moss.app')` con `set`, `get` y
  `remove`; `ExtensionStorage.reloadWidget(tipo?)` y `reloadControls()` [65].
- **Para Moss:** la extensión del filtro de Concentración (4), la Live Activity de
  la cuenta regresiva de AlarmKit (3) y los controles del Centro de control.

### Las dos juntas

- No hay registro de que se hayan probado juntas.
- `expo-widgets` agrega el App Group desde su plugin. Para que
  `@bacons/apple-targets` lo copie, el grupo tiene que estar también en
  `ios.entitlements` de `app.json`.
- EAS registra solo el App Group al compilar [64].

## La configuración

Cualquier Swift nuevo cambia la huella: pide una build nueva y corta las
actualizaciones por aire a las builds ya instaladas, como en Ascent. Los
paquetes, con `npx expo install`.

### v1: los Atajos

Se suma a lo que ya tiene `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-app-intents"],
    "experiments": {
      "inlineModules": { "watchedDirectories": ["app-intents"] }
    }
  }
}
```

- La carpeta se arma con `npx expo-app-intents init` [55].
- Sin entitlements, sin claves del Info.plist y sin extensión: las credenciales de
  EAS no cambian.

### El despertador (AlarmKit)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAlarmKitUsageDescription": "Moss suena a la hora que eliges en Sueño y anota cuándo paras la alarma, para saber a qué hora te despertaste."
      }
    }
  }
}
```

- La misma clave en `locales/es.json` y `locales/en.json`.
- Un plugin propio que sume `-weak_framework AlarmKit` a `OTHER_LDFLAGS` del
  target de la app.
- Sin entitlement.
- Con «posponer»: un target `widget` con la Live Activity de la alarma
  (`AlarmAttributes`) y `NSSupportsLiveActivities`.

### Un widget de la noche (`expo-widgets`)

```json
["expo-widgets", {
  "groupIdentifier": "group.uy.moss.app",
  "widgets": [{
    "name": "Noche",
    "displayName": "Tu noche",
    "description": "La noche que estimó Moss, para confirmarla.",
    "ios": { "supportedFamilies": ["accessoryRectangular"] }
  }]
}]
```

### El filtro de Concentración (`@bacons/apple-targets`)

En `app.json`:

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.security.application-groups": ["group.uy.moss.app"]
      }
    }
  }
}
```

En `targets/foco/expo-target.config.js`:

```js
module.exports = (config) => ({
  type: 'app-intent',
  name: 'foco',
  deploymentTarget: '16.4',
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
```

- El identificador del grupo sigue el formato `group.<nombre>` [49].

## Sin una Mac

- **Todo se compila en EAS desde Windows.** La imagen `sdk-58` es macOS 26.6 con
  Xcode 27.1 RC [62]; AlarmKit pide Xcode 26 o más [33].
- **Se prueba solo en el iPhone**, con una build `dev`: sin Mac no hay simulador.
  Los Atajos, AlarmKit, los filtros y los widgets piden un teléfono de verdad.
- **Un error de Swift aparece recién en el registro de EAS:** cada intento es una
  build. Por eso el Swift va mínimo (dejar constancia) y la lógica queda en
  TypeScript.
- **Sin vistas previas de SwiftUI ni el depurador de Xcode.** Lo que pasa de noche
  se ve en el diagnóstico de Moss: la lista de anclas, con su origen y su hora.
- **Se puede revisar desde Windows:**
  - que el `.ipa` (un zip) tenga `Metadata.appintents` dentro de `Moss.app`; sin
    eso, Atajos no ve las acciones;
  - que AlarmKit quede opcional, con `llvm-objdump --macho --dylibs-used` sobre el
    binario.
- **Los enlaces de iCloud de los Atajos (iOS 27)** se arman en el iPhone.
- **Probar en un iOS anterior al 26** (de 16.4 a 18: que Moss abra sin AlarmKit)
  pide otro teléfono o una Mac con simulador.

## Cómo probarlo

1. Con una build `dev`, armar las automatizaciones de la alarma y del cargador.
2. Cerrar Moss a la fuerza, bloquear el teléfono, conectar el cargador a la noche
   y parar la alarma a la mañana. Al abrir Moss tienen que estar las dos anclas,
   con su hora y una sola vez.
3. Repetirlo en iOS 26 y 27. En iOS 27, agregar el atajo con su disparador desde
   un enlace.
4. Ver si aparece el aviso de Atajos y si se puede apagar.
5. Ver si corre JavaScript cuando llega «Paré la alarma» con Moss cerrada: decide
   la opción 5.
6. Medir, con la prueba en sombra de `sueno.md`, cuánto bajan el error y las
   preguntas con anclas.

## El orden

1. La guía de «Afinar» en la galería, con datos de mentira, para aprobarla.
2. Las acciones en Swift, la tabla de anclas, las reglas del dominio (el Focus
   programado, el cargador de 19 a 4, la pregunta de un solo borde) y sus tests.
3. La build `dev` y las pruebas de arriba.

## D28, resuelta (26/10/2026)

- **Los Atajos y el despertador, en la v1** (lo pediste para esta build, «si iOS
  lo permite»). El despertador, sin «posponer».
- **Con la hora de despertar sacada de un ancla, se pregunta solo la de
  dormirse.**
- **Ni widget ni notificación para confirmar**, por ahora.

## Lo que quedó en la v1 (26/10/2026)

### El Swift (`app-intents/`, en el target de la app)

| Archivo | Qué hay |
|---|---|
| `AccionesDeSueno.swift` | Las siete acciones. Cada una solo llama a `AppIntentDispatcher.shared.dispatch(name:)` y corre en segundo plano (sin `openAppWhenRun`) |
| `AtajosDeMoss.swift` | El `AppShortcutsProvider`: «Me voy a dormir» y «Me desperté», con dos frases cada una |
| `PareElDespertador.swift` | La `LiveActivityIntent` que AlarmKit corre al parar el despertador (iOS 26, oculta en Atajos) |
| `AlarmasDeMoss.swift` | Lo de AlarmKit: permiso, la alarma puesta, poner (reemplaza la que había) y sacar. Todo con `@available(iOS 26.0, *)`; el `stopButton` de iOS 26.0 solo antes de la 26.1, que lo pone el sistema |
| `Despertador.swift` | El módulo en línea `Despertador`: `disponible`, `permiso`, `pedirPermiso`, `programada`, `programar(hora, minuto, días, título, detener)` y `cancelar` |
| `es.lproj/AppShortcuts.strings` | Las frases en español |

| Acción (es / en) | Lo que despacha | Para el dominio |
|---|---|---|
| Paré la alarma / I stopped the alarm | `alarmaParada` | ancla de despertar |
| Conecté el cargador / I plugged in the charger | `cargadorConectado` | actividad; de 19 a 4, puede ser lo último del día |
| Desconecté el cargador / I unplugged the charger | `cargadorDesconectado` | actividad |
| Empezó el enfoque Sueño / Sleep Focus started | `enfoqueEmpezo` | ancla de dormir, salvo que sea el horario |
| Terminó el enfoque Sueño / Sleep Focus ended | `enfoqueTermino` | ancla de despertar, salvo que sea el horario |
| Me voy a dormir / I'm going to sleep | `meVoyADormir` | ancla de dormir |
| Me desperté / I woke up | `meDesperte` | ancla de despertar |
| (el despertador de Moss) | `despertadorParado` | ancla de despertar |

- **Los títulos** son claves de `Localizable.strings`, que arma Expo desde
  `locales/es.json` y `locales/en.json` («Localizable.strings» dentro de `ios`).
  Es la excepción a «todo el texto está en `src/textos`».
- **Las frases** van en inglés en el código, el idioma de desarrollo del
  proyecto (`developmentRegion = en`), y en español en
  `app-intents/es.lproj/AppShortcuts.strings`, que entra como recurso por la
  carpeta sincronizada de los módulos en línea.
- **AlarmKit se enlaza como opcional** (`plugins/con-alarmkit.js`:
  `-weak_framework AlarmKit` en `OTHER_LDFLAGS` del target de la app).

### En JavaScript

- **`src/secciones/sueno/RecibirAnclas.tsx`**, montado en `src/app/_layout.tsx`:
  `useAppIntents` espera a que el almacén abra la base, guarda cada invocación
  en la tabla `anclas` (bloque 5 de `migrar()`, con el `id` de la invocación como
  clave), la saca de la cola y vuelve a estimar la noche. Si no se pudo guardar,
  queda en la cola para la próxima.
- **`src/salud/anclas.ts`**: la tabla, que no sube a la cuenta; se guarda un mes y
  `borrarTodo()` también la borra.
- **Las reglas** (`src/dominio/sinReloj.ts`, `deLasSenales`, con sus tests):
  - el enfoque Sueño con horario: la misma hora, al minuto (±1), en 2 noches más
    de las últimas 14, no cuenta;
  - el cargador conectado de 19 a 4 puede ser lo último del día (nunca una
    interrupción), salvo que se vuelva a conectar a los 30 minutos de
    desconectarlo;
  - «Me voy a dormir» y el enfoque prendido a mano, igual;
  - un ancla de despertar no cuenta si después hubo hora y media de silencio (te
    volviste a dormir);
  - la confianza sube 0,1 con un ancla de despertar y 0,05 con una de dormir al
    empezar el hueco (propuestas, a calibrar con la prueba en sombra).
- **La pregunta de la mañana**: con la hora de despertar sacada de un ancla, «¿Te
  dormiste a las 00:30?», y el editor muestra solo esa hora.
- **«Afinar» en Sueño** (sin reloj ni anillo en las dos semanas): la fila del
  despertador (hora, días y la llave; en la hoja, lo que hay que saber), y los
  Atajos automáticos con la guía paso a paso de las cinco automatizaciones, si
  llegó cada una y la lista de lo que llegó estos días, con su hora (lo del
  horario dice que no cuenta). Es también el diagnóstico de la noche.

### Lo que hay que mirar en la build

- Que el `.ipa` tenga `Metadata.appintents` y que en Atajos aparezcan las
  acciones de Moss, en español y en inglés.
- Que AlarmKit quede opcional (`llvm-objdump --macho --dylibs-used`: `AlarmKit`
  con `weak`).
- Las pruebas de «Cómo probarlo», arriba, también con el despertador en iOS 26 y
  27.

## Fuentes

**Apple: App Intents y Atajos**

1. WWDC22, «Dive into App Intents»: https://developer.apple.com/videos/play/wwdc2022/10032/
2. «Creating your first app intent»: https://developer.apple.com/documentation/appintents/creating-your-first-app-intent
3. `supportedModes` (iOS 26): https://developer.apple.com/documentation/appintents/appintent/supportedmodes
4. `openAppWhenRun`: https://developer.apple.com/documentation/appintents/appintent/openappwhenrun
5. `authenticationPolicy`: https://developer.apple.com/documentation/appintents/appintent/authenticationpolicy
6. Apple DTS, los App Intents van en el target de la app: https://developer.apple.com/forums/thread/759160
7. Atajos, disparadores de eventos (Alarma, Sueño): https://support.apple.com/guide/shortcuts/apd932ff833f/ios
8. Atajos, disparadores de ajustes (Concentración, Cargador): https://support.apple.com/guide/shortcuts/apde31e9638b/ios
9. Atajos, agregar automatizaciones (iOS 27): https://support.apple.com/guide/shortcuts/create-a-new-personal-automation-apdfbdbd7123/ios
10. Atajos, activar o desactivar una automatización (iOS 26): https://support.apple.com/guide/shortcuts/enable-or-disable-a-personal-automation-apd602971e63/9.0/ios/26
11. Cassinelli, correr de inmediato en iOS 17: https://matthewcassinelli.com/automations-run-immediately-shortcuts-notifications
12. Cassinelli, Atajos en iOS 27 beta 5: https://matthewcassinelli.com/ios-27-beta-5-whats-new-in-shortcuts/
13. iThinkDifferent, Atajos en iOS 27 beta 2: https://www.ithinkdiff.com/?p=339738
14. one sec, automatizaciones en iOS 27: https://tutorials.one-sec.app/en/articles/10309122
15. 9to5Mac, disparadores nuevos de iOS 27: https://9to5mac.com/2026/09/29/ios-27s-shortcuts-app-adds-35-new-improved-actions-heres-whats-new/
16. Guías de revisión de Apple: https://developer.apple.com/app-store/review/guidelines/

**Apple: Sueño, Concentración y Salud**

17. Horario de sueño y relajación: https://support.apple.com/en-us/guide/iphone/iphaf56dceb4/ios
18. Prender o apagar el Focus de Sueño: https://support.apple.com/en-us/guide/iphone/iph7cdb86325/ios
19. Filtros de Concentración: https://support.apple.com/en-us/guide/iphone/iphd6288a67f/ios
20. `SetFocusFilterIntent`: https://developer.apple.com/documentation/appintents/setfocusfilterintent
21. «Defining your app's Focus filter»: https://developer.apple.com/documentation/appintents/defining-your-app-s-focus-filter
22. WWDC22, «Meet Focus filters»: https://developer.apple.com/videos/play/wwdc2022/10121/
23. Foro, el filtro no corre en segundo plano (iOS 18): https://developer.apple.com/forums/thread/761593
24. Foro, parámetros opcionales para la llamada final: https://developer.apple.com/forums/thread/766761
25. Foro, macOS 26.5: https://developer.apple.com/forums/thread/826766
26. `INFocusStatusCenter`: https://developer.apple.com/documentation/intents/infocusstatuscenter
27. Foro, Focus Status pide Communication Notifications: https://developer.apple.com/forums/thread/682143
28. `HKCategoryTypeIdentifier`: https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier
29. Foro, leer el horario de sueño: https://developer.apple.com/forums/thread/739452
30. Foro, ídem: https://developer.apple.com/forums/thread/725203
31. Salud se cifra con el bloqueo: https://developer.apple.com/documentation/healthkit/protecting-user-privacy

**AlarmKit**

32. AlarmKit: https://developer.apple.com/documentation/alarmkit
33. «Scheduling an alarm with AlarmKit»: https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit
34. `AlarmManager`: https://developer.apple.com/documentation/alarmkit/alarmmanager
35. `AlarmManager.AlarmConfiguration`: https://developer.apple.com/documentation/alarmkit/alarmmanager/alarmconfiguration
36. WWDC25, «Wake up to the AlarmKit API»: https://developer.apple.com/videos/play/wwdc2025/230/
37. Apple, preguntas frecuentes de AlarmKit: https://developer.apple.com/forums/thread/797158
38. Foro, `stopIntent` que no corre (iOS 26.2.1): https://developer.apple.com/forums/thread/815064
39. Foro, AlarmKit en las betas de iOS 27 (FB23754550): https://developer.apple.com/forums/thread/844479
40. `LiveActivityIntent`: https://developer.apple.com/documentation/appintents/liveactivityintent
41. Uso de iOS 26 (7/6/2026): https://developer.apple.com/support/app-store/
42. Enlace opcional de frameworks nuevos: https://forums.swift.org/t/weak-linking-of-frameworks-with-greater-deployment-targets/26017
43. `expo-alarm-kit`: https://www.npmjs.com/package/expo-alarm-kit

**Widgets, Live Activities y notificaciones**

44. Botones en widgets y Live Activities: https://developer.apple.com/documentation/widgetkit/adding-interactivity-to-widgets-and-live-activities
45. Live Activities: https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities
46. Live Activity programada (iOS 26): https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:start:)
47. WWDC26, «Live Activities essentials»: https://developer.apple.com/videos/play/wwdc2026/223/
48. «Keeping a widget up to date»: https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
49. App Groups: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups
50. Notificaciones con acciones: https://developer.apple.com/documentation/usernotifications/declaring-your-actionable-notification-types

**Expo y EAS**

51. `expo-widgets`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/widgets/
52. `expo-widgets`, `AppIntent.swift`: https://github.com/expo/expo/blob/main/packages/expo-widgets/ios/Widgets/AppIntent.swift
53. `expo-widgets`, `WidgetsStorage.swift`: https://github.com/expo/expo/blob/main/packages/expo-widgets/ios/WidgetsStorage.swift
54. `expo-widgets`, el plugin de iOS: https://github.com/expo/expo/tree/main/packages/expo-widgets/plugin/src/ios
55. `expo-app-intents`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/app-intents/
56. Expo, «Introducing expo-app-intents» (19/10/2026): https://expo.dev/blog/introducing-expo-app-intents
57. `expo-app-intents`, README: https://github.com/expo/expo/tree/main/packages/expo-app-intents
58. `expo-app-intents`, el plugin: https://github.com/expo/expo/blob/main/packages/expo-app-intents/plugin/src/withAppIntents.ts
59. Módulos en línea: https://docs.expo.dev/modules/inline-modules-reference/
60. SDK 58 beta: https://expo.dev/changelog/sdk-58-beta
61. `expo-notifications`, SDK 58: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
62. EAS, imágenes de build: https://docs.expo.dev/build-reference/infrastructure/
63. EAS, extensiones: https://docs.expo.dev/build-reference/app-extensions/
64. EAS, capacidades: https://docs.expo.dev/build-reference/ios-capabilities/
65. `@bacons/apple-targets`: https://github.com/EvanBacon/expo-apple-targets
66. Issue #196, SDK 56 y 57: https://github.com/EvanBacon/expo-apple-targets/issues/196
67. Issue #202, targets `app-intent` duplicados: https://github.com/EvanBacon/expo-apple-targets/issues/202
68. `@bacons/apple-targets` en npm: https://www.npmjs.com/package/@bacons/apple-targets
69. `expo-widgets` en npm: https://www.npmjs.com/package/expo-widgets
70. `expo-app-intents` en npm: https://www.npmjs.com/package/expo-app-intents
