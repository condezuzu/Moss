# Widgets: los hábitos en la pantalla de inicio

Se puede. Investigado el 21/10/2026.

## Con qué: `expo-widgets`

- Es el paquete de Expo, versionado con el SDK 58 (58.0.22). Ya no lleva la
  etiqueta de alfa.
- **Cómo se arma:**
  - Las vistas del widget se escriben en TypeScript con `@expo/ui/swift-ui`.
  - Los botones corren un AppIntent ya hecho, en iOS 17 o más.
  - Su plugin crea la extensión, el App Group y la entrada de EAS.
- **Lo que evita:** el costo grande que tuvo Ascent, que fue escribir Swift sin
  una Mac para probarlo. Cada retoque era una build y una reinstalación.
- **La alternativa** es `@bacons/apple-targets` (la de Ascent) con SwiftUI a
  mano. Su versión 5.0.0 es para el SDK 55, y el SDK 58 no está confirmado.
  - Es el plan B si la prueba de abajo falla.

## Qué entra primero

- **Un widget en dos tamaños:**
  - **Chico:** el cielo de hoy de un vistazo. Tocarlo abre la app.
  - **Mediano:** el cielo y hasta 4 botones «hecho».
- **Gratis:** StandBy.
- **Para después:** la pantalla bloqueada (es monocroma y los toques piden
  desbloquear), el tamaño grande y el Centro de control.

## Cómo se dibuja

- Skia guarda una imagen transparente por día con las líneas y las estrellas
  apagadas (`drawAsImage`).
- El widget dibuja encima las estrellas encendidas como círculos con brillo, en
  posiciones que le pasa la app.
- El degradé del cielo va en un fondo que el sistema puede sacar: StandBy lo saca.
- En los modos «tintado» y «transparente» de iOS 26 las imágenes se vuelven
  blancas, salvo con `.widgetAccentedRenderingMode(.fullColor)`. Por eso
  «hecho» se muestra con brillo, no con color.
- **Límites:**
  - Unos 30 MB de memoria. Sale de reportes de cierres, no de la documentación
    de Apple.
  - Un tope de área por imagen.
  - Las imágenes se arman al tamaño del widget (170×170 pt el chico y 364×170
    pt el mediano), a 2× o 3×.

## Cómo llegan los toques a la app

- **Dónde corre el toque:** en el proceso del widget, no en el de la app.
  Después, iOS vuelve a dibujar el widget.
- **Cómo se guarda:** el toque se suma a una lista `pendientes` dentro de la
  entrada de hoy del widget. Va una entrada por día, más las de medianoche ya
  armadas.
- **Al abrir la app:**
  1. Lee esa línea de tiempo (`getTimeline()`).
  2. Aplica los toques al registro local, con la clave `hábito:día` (gana el
     último).
  3. Sincroniza.
  4. Escribe una línea de tiempo nueva. Solo se escribe así, con la app abierta,
     para no perder un toque en el medio.
- **El día lo calcula la app**, no el widget, y va en cada entrada.
- **No sirve `addUserInteractionListener`:** escucha dentro del mismo proceso y
  los toques del widget de la pantalla de inicio no le llegan (problema abierto
  #49828 de Expo).
- **Cuántas recargas:** las que pide la app abierta o un botón del widget no
  cuentan. El resto sale de un cupo de 40 a 70 por día.

## Costo y riesgos

- **Esfuerzo:**
  - **Solo para mirar:** 2 a 3 días con `expo-widgets`, o 4 a 5 con SwiftUI a
    mano.
  - **Con botones:** 2 a 3 días más.
- **Primero, una prueba de un día** en una build `dev`, para saber si:
  - la imagen con los círculos encima se dibuja bien;
  - un toque queda guardado;
  - la memoria alcanza.
- **Riesgos:**
  - `expo-widgets` es joven. Además del problema del escucha, la galería de
    widgets a veces muestra una entrada vieja (#51732).
  - Hay un reporte de que `expo export` deja afuera las vistas para
    actualizaciones por aire (#50457).
  - No se sabe cuánta memoria come su motor de JS.
- **Builds:**
  - La primera `eas build` con el widget tiene que ser interactiva, para
    registrar el App Group y el identificador de la extensión. A Ascent le pasó
    igual con HealthKit.
  - Agregar el widget cambia la huella de la build y corta las actualizaciones
    por aire a las builds ya instaladas, como en Ascent.

## Cómo lo hizo Ascent

- **Qué es:** un solo target (`movil/targets/descanso`) con una Live Activity.
- **Cómo se conecta:** un módulo propio en Swift (`movil/modules/descanso-vivo`)
  y la estructura compartida copiada en los dos lados, con un test que las
  mantiene iguales.
- **App Groups:** no usa (ActivityKit lleva los datos), así que para Moss es
  terreno nuevo.
- **Lo que le costó**, escrito en `movil/EAS.md`:
  - El perfil de aprovisionamiento propio de la extensión: hizo falta una build
    interactiva.
  - Un cierre por `ClosedRange` que en el teléfono solo se veía como un widget
    en blanco.
