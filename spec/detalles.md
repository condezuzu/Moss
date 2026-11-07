# Los detalles de app profesional (6/11/2026)

Lo pediste así: «vamos a hacer una búsqueda de bugs y vamos a ver qué tienen normalmente las apps
profesionales y agregarles esas cosas chicas que hacen un cambio grande realmente (como que si abrís el
teclado no tape donde escribís o que puedas deslizarlo para abajo para cerrarlo y esas cosas)».

Cinco revisiones de solo lectura, una por área (registrar comida; Comida, Inicio y el «+»; Progreso, Sueño y
Hábitos; la entrada, Perfil y el pago; la navegación y lo compartido), encontraron unos 125 bugs y detalles,
y una investigación juntó lo que hacen MacroFactor, Cronometer, Apple Salud, Things y las guías de Apple. Lo
que cambia solo el comportamiento ya está en la app; lo que se ve nuevo está en la galería, para aprobar.

## El teclado

- **Deslizar para bajarlo.** Todo scroll de una hoja lo baja al arrastrarlo (`keyboardDismissMode="on-drag"`,
  de fábrica en `ScrollQueBaja`), y el primer toque en un botón con el teclado arriba ya cuenta. Con el
  teclado arriba, el gesto de bajar una hoja solo baja el teclado y la hoja queda con lo escrito: antes, en el
  editor de hábitos y en el peso del «+», ese mismo gesto cerraba la hoja y se perdía todo (`arrastre.tsx`).
- **No tapa lo que se escribe.** `useCampoALaVista` mide con el alto real del teclado (con el de emojis o la
  barra de sugerencias, `Keyboard.metrics()` quedaba viejo); las hojas de Modal ya no dejan un hueco del
  borde de abajo encima del teclado.
- **«Listo» y «Siguiente» en los teclados de números**, que en iOS no tienen tecla de retorno: React Native
  les pone una barra nativa con un botón cuando el campo trae `returnKeyType`, y salía en inglés o no salía.
  Ahora está en todos los campos de números, en español (`tecladoDeNumeros` en `teclado.ts`): «Siguiente»
  pasa al campo que sigue (las medidas, los macros de crear un alimento) y «Listo» lo baja.
- **Se cierra cuando corresponde:** al cambiar de sección (deslizando o con la barra), al cerrar el «+» y al
  tocar un aviso.
- El buscador sin autocorrector, con la cruz para borrar y el teclado oscuro; la cantidad de la ventana se
  escribe encima (como Cronometer); tocar el nombre de una medida enfoca su campo.

**Lo que no se puede por OTA:** que el teclado baje siguiendo al dedo («interactive») dentro de una hoja
necesita `react-native-keyboard-controller` (módulo nativo, cambia la huella): va con la próxima build, y con
él también `KeyboardAwareScrollView` y la barra de «‹ ›» del teclado (abajo, «Para la próxima build»).

## Bugs de datos

- Corregir una cantidad de 1.000 o más en la ventana la guardaba mil veces más chica («1.500» se leía 1,5): el
  campo ya no separa los miles y una sola función lee los números (`leerNumero` en `src/comida/porciones.ts`,
  con «,5», «.5» y las fracciones).
- La meta propia de pasos «9.000» pasaba a 10 pasos al tocarla (`metaEscrita` en `src/dominio/habitos.ts`).
- En libras, el peso no volvía igual (160 lb se veía 160,1): ahora se guarda con 0,01 kg.
- Con el día que empieza a las 5 o 6, el desayuno temprano iba como un segundo desayuno del día anterior.
- Con bajo peso no se podía poner un peso meta; con 16 o 17 años «Rápido» decía 0,75 % y usaba 0,5 %.
- «Desayuno de ayer» y «de siempre» se volvían a sumar con cada toque, y copiaban lo planificado sin comer.
- Mientras se elegía un ingrediente de una receta, decir lo que comí lo anotaba como comido y se perdía la
  receta; «‹» y el velo tiraban la receta a medio armar; un producto incompleto de Open Food Facts perdía sus
  valores al pasar «A mano».
- Sin red, Perfil decía «Sin cuenta» y escondía cerrar sesión y borrar; la pantalla de menor de 16 quedaba
  para siempre aunque Salud cambiara; exportar con dos toques daba un error falso.

## Lo que pasaba al volver, con avisos y entre días

- Un aviso o un widget ahora cierran todo lo que taparía lo que abren (también las hojas de Perfil, Sueño o
  Inicio, que son otra ventana); el aviso del agua abre el «+», que siempre tiene el agua; los de «lo que
  conviene» y del deporte llevan a su sección (antes, todos a Hábitos).
- Los avisos suenan a la hora del reloj (antes, «dentro de tantos segundos»: con otra zona horaria o el cambio
  de hora, a la hora de antes) y los que ya no dicen nada salen del centro de notificaciones («¿Anotaste la
  cena?» con la cena anotada, «pesarse» con el peso de hoy, los de días anteriores).
- Bajar el centro de control ya no rehace todo como si se volviera del fondo; si Moss no pudo abrir sus datos,
  lo vuelve a intentar al volver; la pantalla de arranque se va con un fundido y cuando el cielo ya está.
- Comida vuelve a hoy al día siguiente; los ✓ del «+» no quedan de ayer; los primeros hábitos vuelven a
  ofrecerse si un aviso o iOS cerraron la hoja (con la cruz, no).

## Nada de golpe, y «Deshacer»

- Con Reducir movimiento, los fundidos se veían de golpe (Reanimated los salteaba): ahora se ven en toda la app.
- Entran y salen con su animación: la bandeja «Tu desayuno», las filas que se quitan (con «Deshacer»), las
  vistas del «+», «Copiar el día», «Cómo medir», Metas, el mes de «Tu mes», lo que aparece en Perfil, el chip
  «De Salud» de la entrada. Las hojas de Modal: el fondo se funde y solo la hoja sube.
- «Deshacer» nuevo en: el agua de Inicio, archivar un hábito, sugerir el día o la semana, «Otra», confirmar lo
  planificado y el peso que pisa el de ese día.

## Al tocar

- Los «−/+» (el peso, el peso meta, las horas, el despertador, la entrada, los pasos de Perfil) repiten al
  mantenerlos apretados y aceleran, vibran apenas con cada paso (`BotonDePaso` en `paso.tsx`).
- Todo lo tocable responde al apoyar el dedo y llega a 44 puntos; la vibración, pareja: elegir vibra apenas,
  sumar con un golpe liviano y una sola vez, guardar un hábito con éxito, el escáner sin encontrar con una
  advertencia, y el día completo ya no vibra dos veces.
- Tocar otra vez la pestaña en la que estás sube arriba de todo (Comida vuelve a hoy, Progreso sale de Metas,
  Hábitos vuelve a hoy), y tocar la hora sube la sección que se ve (`arriba.ts`).

## Accesibilidad

- VoiceOver: se pueden marcar los hábitos del cielo y abrir su editor; dice los avisos con «Deshacer» (y los
  espera); lee el valor de los deslizadores de la entrada (antes, porcentajes sin sentido), los bloques de
  Inicio con sus números, cada macro con su nombre, la barra como barra de pestañas; no recorre lo que queda
  detrás de una hoja ni las páginas ocultas; el escáner y los paneles son modales.
- El texto grande de iOS: las cifras grandes y lo de tamaño fijo tienen un tope, los botones crecen en vez de
  cortar el texto, y mantener apretada una pestaña la muestra en grande.

## Para aprobar en la galería (versión 46, «Detalles»)

Lo que se ve nuevo: mantener apretado un alimento o una comida (copiar, mover, borrar), deslizar para borrar,
editar y borrar lo guardado, el día en la hoja de registro cuando no es hoy, restar un vaso, «Atrás» en el
cuestionario, la franja bajo la hora, los estados de espera (entrar con Apple, borrar, exportar), «Cancelar»
en la hora de la noche, deslizar para actualizar Sueño, «Hoy no toca ningún hábito» y las filas de Perfil que
se prenden y apagan. También se ve la barra del teclado de números.

## Lo que decidís vos

- Con los números ocultos (Perfil, o D9), ¿la hoja de registro también esconde las kcal? Hoy solo se esconde
  «Te quedarían…», como en la galería.
- ¿Las hojas preguntan antes de descartar lo escrito? Hoy, con algo a medio escribir, no se cierran deslizando
  ni tocando afuera; la cruz sí cierra.
- El CSV: ¿punto y coma y coma decimal en español? (Ya lleva el BOM, así Excel muestra los tildes.)

## Para la próxima build (cambian la huella)

- `react-native-keyboard-controller`: el teclado que sigue al dedo en las hojas y la barra de «‹ ›».
- En `app.json`, `LSApplicationQueriesSchemes` con `mailto` y `x-apple-health`: hoy «Ayuda y contacto» y
  «Apple Salud: Conectada» abren directo, sin poder preguntar antes si se puede.
- Las acciones rápidas del ícono (Anotar, Escanear, Agua, Peso: `expo-quick-actions`).

## Lo que hay que probar en un iPhone

Con la build `telefono` y VoiceOver: escribir en el peso y en una medida y bajar el teclado deslizando (la
hoja tiene que quedar), «Siguiente» y «Listo» arriba del teclado de números, el «+» al pasar del menú al peso
con el teclado arriba, mantener apretado un «−/+», marcar un hábito del cielo con VoiceOver, un aviso tocado
con una hoja de Perfil abierta, la hora tocada en cada sección, Reducir movimiento y el texto más grande.
