# La revisión de Apple

Todo lo que hace falta para mandar Moss 1.0 a revisión: las respuestas de
privacidad de App Store Connect, los textos de los permisos, cada guía de Apple
contra lo que hace la app, la ficha de la tienda, las capturas, las notas para
quien revisa, la lista de pasos y la clasificación por edad. Armado el 22/10/2026
y puesto al día el 26/10/2026, a la noche, para la build que va a revisión, con
las fuentes de Apple de ese día (al final).

**Lo que trae esta build** (decidido el 26/10/2026):
- la cuenta **solo con Apple** (Sign in with Apple), sin correo ni contraseña;
- **la conexión real con Ascent**: vincular en dos toques con el llavero
  compartido del equipo, o entrando con la cuenta de Ascent dentro de Moss; ya
  no hay interruptor (`EXPO_PUBLIC_CON_ASCENT`). Vinculada: la recuperación, el
  rendimiento esperado, los días para intentar marca, un solo peso, las calorías
  según el día, la proteína después de entrenar y el gimnasio que se enciende
  solo ([`ascent.md`](ascent.md));
- **los widgets** (el cielo en la pantalla de inicio y «Tu noche» en la pantalla
  bloqueada), **el despertador** (AlarmKit, iOS 26 o más) y **las acciones de
  Atajos** (la alarma, el cargador, la Concentración Sueño);
- **las actualizaciones por aire** (`expo-updates`) y **una tarea de segundo
  plano** que tiene los widgets al día;
- en Perfil, **tu nombre** (sincroniza con la cuenta, `0009_perfil.sql`) y **tu
  foto** (queda en el teléfono).

## El sitio

Las páginas legales se escriben en `docs/` de este repo y se publican en un repo
público aparte, **`condezuzu/moss-app`**, con GitHub Pages desde la raíz (el
código de Moss sigue privado). Todos los enlaces son relativos y el sitio no usa
nada de afuera; `docs/README.md` es el README de ese repo y `docs/.nojekyll` hace
que Pages sirva los archivos tal cual.

| Página | URL |
|---|---|
| Portada y soporte | https://condezuzu.github.io/moss-app/ |
| Privacidad | https://condezuzu.github.io/moss-app/privacidad/ |
| Términos | https://condezuzu.github.io/moss-app/terminos/ |
| Privacy | https://condezuzu.github.io/moss-app/en/privacy/ |
| Terms | https://condezuzu.github.io/moss-app/en/terms/ |

- **Responsable:** Agustín Conde Zuzulich, Montevideo, Uruguay,
  nodoexpweb@gmail.com. Ya no quedan marcadores.
- **La app** abre estas páginas desde `src/lib/sitio.ts` (`SITIO`, las mismas
  rutas; `CORREO` es el contacto). Una app instalada no se entera de un cambio de
  ruta: no se cambian.
- **Las dos políticas** (26/10/2026) suman la cuenta solo con Apple, el nombre
  (sincroniza) y la foto (en el teléfono), cómo comes (dieta y alergias del plan,
  que faltaban), Ascent (qué comparte cada app, el consentimiento, deshacerlo,
  qué pasa con los datos, que son dos cuentas aunque usen el mismo correo
  (28/10/2026, D29), el token de una hora en el llavero del equipo y entrar con
  la cuenta de Ascent), los widgets, el
  despertador y los Atajos (las horas quedan en el teléfono), el micrófono, las
  actualizaciones de Expo y la tabla de quién trata los datos.
- **Los términos** suman la cuenta con Apple, que la de Moss es aparte de la de
  Ascent y que borrar una deja la otra intacta (28/10/2026, D29), Ascent, el despertador, los widgets, los Atajos, las actualizaciones y que lo
  de entrenar es una estimación. `#edad` y `#age` marcan «Quién puede usarla».

## Lo que tiene que estar en la build

En orden de gravedad. Los arreglos del 22 y 23/10 están hechos (revocar Apple en
`moss-borrar-cuenta`, los enlaces a la política y a los términos, el
consentimiento de los datos de salud, 16 años, sin déficit, el piso y el IMC del
peso meta, las búsquedas con su sí, los datos cifrados y fuera de la copia, y
«Ayuda y contacto»). Lo que falta o hay que mirar para esta build:

1. **`moss-borrar-cuenta` desplegada con la `.p8`, y *Allow manual linking*
   activado** (5.1.1(v)). Con la cuenta solo con Apple, todas las cuentas tienen
   que revocar. Desde D29 ya no hay respaldo: sin la función, la app no borra la
   cuenta (`moss.borrar_cuenta(cuenta)` solo la llama la función, con la clave
   de servicio). Sin *Allow manual linking*, la cuenta que también es la de
   Ascent no se puede separar.
2. **Solo Apple en la entrada:** sin «Continuar con correo», «Crear cuenta» ni
   «Olvidé mi contraseña». El correo y la contraseña quedan solo en la hoja de
   vincular, para la cuenta de Ascent.
3. **El texto de la cámara tiene que nombrar la foto de perfil** (5.1.1(ii)): ver
   «b». Va en las opciones de `expo-camera` y de `expo-image-picker` y en los dos
   `locales`.
4. **«Elegir foto» con el selector del sistema** (`launchImageLibraryAsync`, sin
   pedir permiso de fotos). `photosPermission: false` saca
   `NSPhotoLibraryUsageDescription`: si la app pidiera el permiso, se cierra.
5. **La hoja de vincular dice lo mismo que la política.** Hoy «Ascent le pasa a
   Moss» lista «Tus amigos», y la v1 no lee amigos (no hay `moss.amigos()` en
   `0008_vinculo.sql`): sacarlo de la hoja y la fila «Tus amigos» de «Información
   adicional», o sumarlo a la política. «Moss le pasa a Ascent» no dice «tu
   objetivo», que Ascent usa («El mismo objetivo»): sumarlo.
6. **El sueño que ve Ascent.** La política dice «cuánto dormiste y cómo dijiste
   que dormiste»: en la cuenta están las caras y, sin reloj, la noche estimada
   (`moss.noches`). Si para la recuperación de Ascent Moss sube también las
   noches del reloj, hay que sumar esa línea en «Salud» de las dos políticas
   («con el vínculo, cuánto dormiste cada noche») antes de publicarla.
7. **El token del llavero** se guarda con el grupo
   `XF9N8X9KJG.uy.condeag.compartido`, solo en este dispositivo
   (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`), y se borra al cerrar sesión: la
   política lo dice así.
8. **`perfil.privacidadTexto`** (el resumen de Perfil › Privacidad) dice «No los
   vende ni los comparte»: con Ascent, «no los comparte con terceros». Propuesta
   en «b», con el nombre, la foto, los widgets y Ascent.
9. **El `User-Agent` de Open Food Facts** dice `github.com/condezuzu/moss`, que es
   privado (`src/secciones/comida/HojaRegistro.tsx`): usar `CORREO` de
   `src/lib/sitio.ts`, como piden ellos (`Moss/versión (correo)`).
10. **«Salud» y «Apple Health» bien dichos** (2.5.1, RIESGO chico): en español
    «Salud», no «Apple Salud» (`perfil.salud`); en inglés «Apple Health», no
    «Health» solo (unos 20 textos de `en.json`, entre ellos
    `entrada.cuestionario.conectar`, `cielo.seEnciendeSola`, `habitos.conSalud`
    y `mas.pesoNota`).
11. **La build de la tienda limpia:** el perfil `store` usa el entorno
    `preview`. Un entorno `production` con solo las dos variables de Supabase,
    sin `EXPO_PUBLIC_DIAGNOSTICO`.
12. **RIESGO:** «Exportar todo» exporta lo comido, el peso y las metas. Sumar lo
    demás o llamarlo «Exportar comida, peso y metas». Y las capturas a × 3 en
    `herramientas/capturar-app.mjs` (ver «e»).

---

## a) Privacidad de la app (App Store Connect › App Privacy)

«Recopilar», para Apple, es mandar un dato fuera del teléfono y poder verlo
después. Lo que se usa solo en el teléfono no se declara: los pasos, la
frecuencia, la variabilidad y la respiración de Salud, el movimiento, las fotos
(de la comida y la de perfil), la canasta, el despertador, las horas de los
Atajos, lo de los widgets y cuándo se abrió Moss. Tampoco lo que recoge Apple:
la voz que reconoce en sus servidores y el inicio de sesión («You are not
responsible for disclosing data collected by Apple»).

**¿Recopilan datos de esta app? Sí.** Ninguno se usa para rastrear: a «Is this
data used to track?», siempre **No**. Moss no usa el identificador de publicidad
ni pide permiso de rastreo.

| Tipo (en inglés, como en App Store Connect) | Qué es en Moss | ¿Vinculado? | Para qué |
|---|---|---|---|
| Contact Info › Name | El nombre de Perfil: el que da Apple la primera vez o el que escribe la persona (`0009_perfil.sql`) | Sí | App Functionality |
| Contact Info › Email Address | El correo que da Apple (o su reenvío). Con «Entrar con tu cuenta de Ascent», el de esa cuenta, solo para vincular | Sí | App Functionality |
| Identifiers › User ID | El id de la cuenta y, con el vínculo, el de la cuenta de Ascent (`moss.vinculo`) | Sí | App Functionality |
| Identifiers › Device ID | **Recomendado:** el identificador al azar de la instalación que `expo-updates` manda a Expo en cada búsqueda de actualización (ver abajo) | **No** | App Functionality |
| Health & Fitness › Health | El perfil (año de nacimiento, sexo, altura, objetivo y ritmo, peso meta, «sin déficit»), cómo comes (dieta, alergias, gustos), el peso (también el de Salud), las medidas, lo comido con sus nutrientes, el agua, las metas y el gasto, y las noches de Moss. Con el vínculo, Ascent lee parte de esto | Sí | App Functionality |
| Health & Fitness › Fitness | Cuánto se mueve la persona, los hábitos de pasos y atención plena con su meta y si se cumplieron, y el del gimnasio con Ascent | Sí | App Functionality |
| User Content › Other User Content | Los hábitos, las recetas y comidas guardadas, los propios, los favoritos, lo planificado, el resumen de cada día y los logros | Sí | App Functionality |
| Search History | Las búsquedas sin resultado: el texto, el idioma, la región y el día (`moss.busquedas_vacias`) | **No** | Analytics |
| User Content › Customer Support | «Reportar un error»: el alimento, qué está mal, la nota y el día (`moss.reportes`) | **No** | App Functionality |

**No se recopila:** Phone Number, Physical Address, Other User Contact Info,
Precise y Coarse Location, Sensitive Info, Contacts, Emails or Text Messages,
Photos or Videos, Audio Data, Gameplay Content, Browsing History, Purchases,
Financial Info, Product Interaction, Advertising Data, Other Usage Data, Crash
Data, Performance Data, Other Diagnostic Data, Environment Scanning, Hands, Head,
Other Data Types.

Notas:
- **Sensitive Info** incluye el embarazo: por eso Moss guarda solo «sin
  déficit», sin el motivo. Las alergias son **Health**, no Sensitive Info.
- **Ascent no cambia estas respuestas:** los tipos que comparte el vínculo ya
  están, y Apple no pregunta por apps del mismo desarrollador. Las de Ascent sí
  tienen que sumar lo que recibe de Moss.
- **Las búsquedas y los reportes** van sin usuario ni hora. Como son un sí
  explícito que se cambia en Perfil, Apple podría dejarlas como optativas
  («Product Improvement Programs»); igual se declaran, porque la política las
  nombra.
- **Privacy Policy URL**, por idioma: `/privacidad/` en las dos localizaciones
  en español y `/en/privacy/` en inglés.

### El manifiesto de privacidad contra la tabla

`app.json` › `ios.privacyManifests` (el `PrivacyInfo.xcprivacy` de la app):

- **Coinciden:** Email Address, Name, User ID, Health, Fitness y Other User
  Content (vinculados, App Functionality); Search History (sin vincular,
  Analytics); Customer Support (sin vincular, App Functionality);
  `NSPrivacyTracking` en `false` y sin dominios de rastreo. El nombre ya estaba
  en el manifiesto y faltaba en esta tabla: ya está.
- **No cierra: el identificador de `expo-updates`.** Cada vez que Moss busca una
  actualización, manda a Expo el encabezado `EAS-Client-ID`: un UUID al azar,
  guardado en `UserDefaults` (`expo-eas-client`), que Expo usa para contar
  instalaciones. Sale del teléfono y queda después del pedido, así que para
  Apple es «recopilado»; no está unido a la cuenta. El manifiesto de Expo
  (`expo-eas-client`) no declara nada, y Expo dice que esos pedidos no llevan
  identificadores únicos del dispositivo. **Recomiendo declararlo**, que es lo
  prudente y no cuesta nada: en App Store Connect, Identifiers › Device ID, sin
  vincular, App Functionality; en el manifiesto, un
  `NSPrivacyCollectedDataTypeDeviceID` con `Linked` y `Tracking` en `false` y
  `NSPrivacyCollectedDataTypePurposeAppFunctionality`. Las políticas ya lo
  nombran. Si preferís no declararlo, que no esté en ninguno de los dos.
- **La extensión de los widgets no tiene manifiesto propio.** El widget corre en
  `uy.moss.app.ExpoWidgetsTarget` y lee el `UserDefaults` del App Group (motivo
  `1C8F.1`, que el de la app ya tiene). Si al subir la build llega un
  `ITMS-91053` que nombra la extensión, hay que sumarle un
  `PrivacyInfo.xcprivacy` con ese motivo (un plugin chico) antes de mandarla.
- **Sobran, sin molestar:** `85F4.1` (mostrar el espacio libre: Moss no lo
  muestra) y `0A2A.1` (es el de los SDK). Se pueden dejar.

## b) Los textos de los permisos

Apple pide que el texto diga **clara y completamente** para qué se usa cada dato
(5.1.1(ii)) y, para Salud, qué datos se leen (5.1.3(i)). Van en `app.json`
(`ios.infoPlist` y las opciones de los plugins) y en `locales/es.json` y
`locales/en.json`, iguales en los dos lugares.

| Clave | Cuándo se pide | Estado |
|---|---|---|
| `NSHealthShareUsageDescription` | En la entrada y en Perfil | Bien |
| `NSHealthUpdateUsageDescription` | Nunca (Moss no escribe) | **Se queda**, como en Ascent: la biblioteca de HealthKit enlaza las APIs de escritura, y sin la clave App Store Connect puede rechazar la build por falta de texto (`ITMS-90683`). Las notas lo explican |
| `NSCameraUsageDescription` | Escáner, foto de una comida, foto de perfil | **Cambiar:** sumar la foto de perfil |
| `NSMotionUsageDescription` | La tarjeta de Sueño | Bien |
| `NSMicrophoneUsageDescription` y `NSSpeechRecognitionUsageDescription` | «Decir lo que comí» | Bien |
| `NSAlarmKitUsageDescription` | Al poner el despertador, en iOS 26 o más | Bien, nueva |
| `NSPhotoLibraryUsageDescription` | No va | «Elegir foto» usa el selector del sistema, que no pide permiso |

### NSCameraUsageDescription (cámara) — cambiar

Desde el 26/10 la cámara también saca la foto de perfil, y el texto no lo dice.
Va igual en las opciones de `expo-camera` y de `expo-image-picker` y en los dos
`locales`:

- **es:** «Moss usa la cámara para escanear el código de barras o la etiqueta
  nutricional de lo que comes, y para sacar la foto de una comida o la de tu
  perfil, si quieres. La etiqueta se lee en el teléfono y Moss no sube tus
  fotos.»
- **en:** «Moss uses the camera to scan the barcode or nutrition label of what
  you eat, and to take a meal photo or your profile photo if you want. Labels
  are read on your phone, and Moss never uploads your photos.»

### NSAlarmKitUsageDescription (el despertador) — nueva, bien

Ya está en `app.json` y en los dos `locales`. Dice qué hace y para qué, y la
política dice lo mismo: el despertador suena a la hora que se elige y Moss anota
cuándo se para. Se pide al poner el despertador en Sueño; en un iOS anterior al
26, la opción no aparece.

- **es:** «Moss suena a la hora que eliges en Sueño y anota cuándo paras la
  alarma, para saber a qué hora te despertaste.»
- **en:** «Moss rings at the time you choose in Sleep and notes when you stop the
  alarm, to know when you woke up.»

### Los que ya estaban (sin cambios)

- **Salud, es:** «Moss lee de Salud tu fecha de nacimiento, sexo, altura y peso
  para calcular tus metas; tus pasos, agua, minutos de atención plena y sueño
  para encender esos hábitos y estimar tu noche si no tienes reloj; y tu
  frecuencia cardíaca, frecuencia en reposo, variabilidad y respiración de la
  noche para la sección Sueño. Moss no escribe en Salud.» En inglés, con «Apple
  Health».
- **Movimiento:** «Si no usas reloj, Moss mira la actividad del teléfono
  (quieto, caminando o en auto) para estimar a qué hora te dormiste y te
  despertaste. Esa actividad no sale del teléfono: solo se guarda la hora
  estimada.»
- **Micrófono y voz:** «Moss usa el micrófono solo mientras dices lo que
  comiste, para anotarlo. Moss no guarda el audio.» / «Moss convierte en texto
  lo que dices de tu comida para anotarlo, con el reconocimiento de voz de Apple
  (en el teléfono cuando el idioma lo permite). Moss no guarda el audio.» Se
  piden al tocar el micrófono, y van también en las opciones de `expo-camera` y
  `expo-image-picker` (si quedan en `false` ahí, borran la clave y la app se
  cierra al pedirla).

### Lo que no lleva texto

Los avisos (se piden al prender Avisos o al elegir los primeros hábitos), los
widgets, las acciones de Atajos (la automatización la arma la persona), la tarea
de segundo plano y el llavero compartido. Face ID no se usa
(`faceIDPermission: false`) ni la ubicación.

### El resumen de Perfil › Privacidad (`perfil.privacidadTexto`), propuesta

- **es:**
  1. «Tus datos son tuyos. Moss guarda lo que anotas, tus respuestas, tu nombre,
     tu peso y tus noches en el teléfono y, con tu cuenta, en su servidor, para
     tus otros dispositivos. Tu foto queda solo en este iPhone. No vende tus
     datos ni los comparte con terceros, no muestra publicidad y no te rastrea.»
  2. El de Salud, como está.
  3. «Las fotos de la comida, el despertador y lo que anotan los Atajos quedan en
     el teléfono. Al escanear un código que no está en Moss, se le pregunta a
     Open Food Facts solo por ese código. Lo que muestran los widgets en la
     pantalla bloqueada se ve sin desbloquear.»
  4. «Si vinculas Ascent, las dos apps comparten lo que dice la hoja de vincular,
     y lo deshaces desde Perfil. Si lo eliges, lo que buscas y no encuentras se
     manda sin tu nombre; un error que reportas, también. Puedes exportar todo en
     CSV y borrar tus datos o tu cuenta desde aquí.»
- **en:**
  1. «Your data is yours. Moss keeps what you log, your answers, your name, your
     weight and your nights on your phone and, with your account, on its server,
     for your other devices. Your photo stays only on this iPhone. It doesn’t
     sell your data or share it with third parties, show ads or track you.»
  2. The Apple Health one, as it is.
  3. «Meal photos, the alarm and what Shortcuts record stay on your phone. When
     you scan a code that isn’t in Moss, only that code is looked up on Open Food
     Facts. What widgets show on the Lock Screen can be seen without unlocking.»
  4. «If you link Ascent, the two apps share what the link sheet lists, and you
     can undo it from Profile. If you choose, what you search for and don’t find
     is sent without your name; so is a problem you report. You can export
     everything as CSV and delete your data or your account from here.»

## c) Guía por guía

Las guías son las del 16/10/2026 (siguen siendo las vigentes el 26/10).

| Guía | Estado |
|---|---|
| 1.4.1 Daño físico (salud y entrenamiento) | PASA |
| 2.1 App completa | DEPENDE de la lista de «g» |
| 2.3 Metadatos (2.3.1, 2.3.3, 2.3.7 a 2.3.9, 2.3.12) | PASA con «d» y «e» |
| 2.3.6 Clasificación por edad | 16+ (ver «h») |
| 2.4.1 Apps de iPhone en el iPad | RIESGO |
| 2.5.1 Salud (HealthKit) y AlarmKit | PASA (RIESGO chico: los nombres de Salud) |
| 2.5.2 Las actualizaciones por aire | PASA |
| 2.5.4 Segundo plano | PASA |
| 2.5.11 Atajos | PASA |
| 2.5.16 Widgets | PASA |
| 4.2.3 Anda sola | PASA |
| 4.8 Inicio de sesión | PASA |
| 5.1.1(i) Política de privacidad | PASA |
| 5.1.1(ii) Permiso | PASA con el texto nuevo de la cámara |
| 5.1.1(iii) y (x) Mínimos datos y el nombre | PASA si el nombre es optativo |
| 5.1.1(v) Cuenta y borrar la cuenta | DEPENDE de desplegar `moss-borrar-cuenta` y activar *Allow manual linking* |
| 5.1.1(ix) Campos regulados | RIESGO bajo |
| 5.1.2 Uso y compartir (con Ascent) | PASA |
| 5.1.3 Datos de salud (con Ascent) | PASA |

### 4.8 · Inicio de sesión — PASA

La guía pide otra opción equivalente solo a las apps que usan un inicio de
terceros (Google, Facebook y similares). Moss usa **solo Sign in with Apple**,
con el botón nativo: no hace falta nada más. «Entrar con tu cuenta de Ascent» no
es el inicio de Moss: es el sistema de cuentas propio del desarrollador, usado
solo para autorizar el vínculo, y la cuenta de Moss sigue siendo la de Apple.

### 5.1.1(v) · Cuenta y borrar la cuenta — DEPENDE

- **Borrar desde la app:** Perfil › Privacidad y datos › Borrar la cuenta,
  inmediato, con el aviso de que no se deshace y de que se borra todo lo de Moss.
  Vinculada, el aviso suma que la cuenta de Ascent sigue intacta y deja de
  recibir los datos de Moss. Bien.
- **Revocar Sign in with Apple** («should use the Sign in with Apple REST API to
  revoke user tokens»): la persona confirma con Apple, `moss-borrar-cuenta`
  canjea el código, revoca y recién ahí borra. **Tiene que estar desplegada con
  la `.p8`** (su README): con la cuenta solo con Apple, toda cuenta revoca, y el
  respaldo que borra sin revocar no pasa.
- **Con Ascent** (D29, 28/10/2026): son dos cuentas, así que la de Moss deja
  de existir aunque la de Ascent siga, como pide la guía. Si el usuario de Auth
  es solo de Moss (solo Apple), se borra entero; si también es el de Ascent (el
  mismo correo), se borra todo lo de Moss y el vínculo y se le quita la
  identidad de Apple: Moss ya no puede entrar a esa cuenta ni guarda nada de
  ella, y Ascent queda intacta. En los dos casos se revoca Apple antes. Probado
  caso por caso (`npm run supabase:verificar`, sección 9, y `node
  herramientas/probar-borrar-cuenta.mjs`).
- **La cuenta obligatoria** era un RIESGO («If your app doesn’t include
  significant account-based features, let people use it without a login»). Ahora
  la cuenta sincroniza, restaura en un teléfono nuevo y vincula con Ascent:
  riesgo bajo.

### 5.1.2 y 5.1.3 · Compartir con Ascent, también datos de salud — PASA

- **Ascent no es un tercero** (es del mismo desarrollador y equipo), pero
  compartir entre dos apps es un uso nuevo de los datos, así que se trata como
  tal:
  - 5.1.2(i) pide permiso antes de usar, transmitir o compartir datos personales
    y decir cómo y dónde se usan: la hoja de vincular muestra qué pasa cada app
    y nada se comparte hasta «Vincular»;
  - 5.1.2(ii) no deja usar para otro fin sin otro consentimiento: vincular es
    ese consentimiento;
  - 5.1.1(ii) pide una forma fácil de retirarlo: desvincular en Perfil ›
    Conexiones › Ascent y en los Ajustes de Ascent.
- **Los datos de salud** (5.1.3(i) y 5.1.2(vi)): el peso de la cuenta, que puede
  venir de Salud, va a Ascent solo con permiso y para mejorar el manejo de la
  salud (la recuperación, las calorías según el día), nunca para publicidad,
  marketing ni minería de datos. «You must disclose the specific health data»:
  la hoja y la política lo listan.
- **5.1.1(i)** pide que la política confirme que las entidades relacionadas
  protegen igual: la política lo dice de Ascent.
- **5.1.3(ii), nada en iCloud:** el token del llavero no es un dato de salud, y
  se guarda solo en el dispositivo (ver «Lo que tiene que estar en la build»).
- **Seguridad del vínculo:** hacen falta las dos sesiones vivas, solo las apps
  del equipo leen el llavero compartido, nunca se comparte el token de refresco
  y toda lectura cruzada pasa por funciones del esquema `moss` que revisan el
  vínculo (`0008_vinculo.sql`).
- **Del lado de Ascent:** su política, su App Privacy y sus notas tienen que
  decir lo que recibe de Moss (sueño, comida por día, peso, objetivo).

### 2.5.x · Widgets, Atajos, AlarmKit, segundo plano y actualizaciones — PASA

- **2.5.16, widgets:** muestran lo de la app (el cielo y los hábitos de hoy, la
  noche para confirmar) y tocarlos abre Moss. Sin publicidad (2.5.18).
- **2.5.11, Atajos:** acciones que se esperan de una app con sección de sueño,
  resueltas de la forma más directa (anotan la hora); ninguna de algo que Moss no
  hace, y las frases llevan el nombre de Moss.
- **AlarmKit:** no tiene guía propia. Es una API pública usada para lo suyo
  (2.5.1): solo la alarma que pone la persona, nunca un aviso ni marketing (Apple
  dice que no reemplaza a los avisos críticos). El permiso se pide al ponerla.
- **2.5.4, segundo plano:** solo la tarea que tiene los widgets al día
  (`expo-background-task`), para lo suyo. Sin ubicación ni audio de fondo.
- **2.5.2, las actualizaciones por aire:** la guía no deja bajar código que
  cambie lo que hace la app; el acuerdo del programa (DPLA) permite código
  interpretado si no cambia el propósito de la app, no arma una tienda y no
  saltea la seguridad. Por aire, solo arreglos y mejoras de lo mismo que dice la
  ficha; lo nativo, siempre con una build.

### 2.1 · App completa — DEPENDE

- **El servidor prendido:** las migraciones `0001` a `0009`, `moss` expuesto, el
  proveedor de Apple, `moss-borrar-cuenta` y `moss-vincular` desplegadas.
- **La cuenta:** con Sign in with Apple no hay cuenta de prueba que dar: quien
  revisa entra con su cuenta de Apple, pasa la entrada y ve los datos de ejemplo
  marcados como tales hasta tener los suyos. Las notas lo explican.
- **Ascent:** la parte que solo anda con las dos apps tiene que poder probarse
  (2.1 y 2.3.1(a)): «Entrar con tu cuenta de Ascent» con una cuenta de
  demostración con entrenamientos, el video de los dos toques y las notas
  («f»).
- **4.2.3(i):** Moss anda sola; Ascent es optativa y lo dice.

### 1.4.1 · Daño físico — PASA

Cada número tiene su «Cómo se calcula», sin porcentajes de precisión. Lo de
entrenar (la recuperación, el rendimiento esperado, «buen día para intentar
marca») dice que es una estimación, muestra sus motivos y avisa «si la entrada en
calor se siente pesada, guárdala para otro día». Los términos suman que entrenar
es decisión de cada uno.

### 2.3 · Metadatos — PASA con «d» y «e»

- **2.3.1:** la ficha describe solo lo que está en esta build, y las notas
  detallan lo nuevo (Ascent, widgets, despertador, Atajos).
- **2.3.7:** ni otras apps ni precios en el nombre, el subtítulo, las palabras
  clave ni las capturas. Ascent se nombra solo en su párrafo de la descripción
  (Moss es Moss).
- **2.3.3, 2.3.8 y 2.3.9:** capturas de la app en uso, con una persona inventada,
  sin alcohol y sin un correo real.
- **2.3.12:** «Novedades» no existe en la primera versión.

### 5.1.1(i), (ii), (iii) y (x) — PASA

- **(i):** la política está en la ficha y dentro de la app (la entrada y Perfil).
- **(ii):** cada permiso con su texto, el consentimiento de los datos de salud
  antes de la cuenta, las búsquedas con su sí y el vínculo con su hoja. Falta el
  texto nuevo de la cámara.
- **(iii) y (x):** Sign in with Apple pide el nombre y el correo, y los dos se
  usan. El nombre tiene que ser **optativo**: Apple deja no compartirlo, y Perfil
  tiene que dejarlo vacío («Agrega tu nombre»).

### 2.5.1 · Salud — PASA (RIESGO chico)

Solo APIs públicas, Salud para salud y forma física, y la descripción dice
«Funciona con Salud». En español, «Salud» o «la app Salud», no «Apple Salud»; en
inglés, «Apple Health» (ver «Lo que tiene que estar en la build», 10). Nunca la
app Salud ni su permiso en las capturas.

### 2.4.1 · Apps de iPhone en el iPad — RIESGO

`supportsTablet` es `false`, pero Apple puede probar la app en un iPad. Probar la
build de TestFlight en un iPad: la entrada con Apple, el cielo, el escáner, Salud
y la hoja de vincular.

### 5.1.1(ix) · Campos regulados — RIESGO bajo

Moss es bienestar (registro de comida), no un servicio de salud. La ficha y las
notas lo dicen sin palabras médicas. Si Apple pidiera una empresa, la salida es
una cuenta de desarrollador de empresa.

## d) La ficha de la tienda

Los límites: nombre y subtítulo, 30 caracteres; palabras clave, 100 **bytes**
(una letra con tilde ocupa 2); texto promocional, 170; descripción, 4.000. No se
repiten en las palabras clave las del nombre ni las del subtítulo. El texto en
español sirve igual para «Spanish (Mexico)» y «Spanish (Spain)». Ascent no va en
el nombre, el subtítulo, las palabras clave ni el texto promocional.

| Campo | Español | Inglés |
|---|---|---|
| Nombre | Moss: calorías y macros (23) | Moss: Calorie & Macro Tracker (29) |
| Subtítulo | Comida, peso, sueño y hábitos (29) | Food, weight, sleep & habits (28) |
| Palabras clave | `contador,kcal,proteína,dieta,nutrición,alimentos,bajar,código de barras,agua,recetas,déficit` (96 bytes) | `counter,kcal,protein,diet,nutrition,log,diary,barcode,scanner,lose,water,goals,recipes,meal,cut,bulk` (100 bytes) |
| Texto promocional | Registra lo que comes en pocos toques, o dilo. Tus metas de calorías y macros se ajustan cada semana con la tendencia de tu peso. Sin anuncios. (143) | Log what you eat in a few taps, or just say it. Your calorie and macro targets adjust every week to your weight trend. No ads. (126) |

Si `Moss` sola queda libre, el nombre puede ser solo «Moss» y el subtítulo
cargar lo demás; con el nombre largo se encuentra mejor.

### Descripción (español, 3.785 caracteres)

```
Moss es un registro de comida para iPhone. Anotas lo que comes en pocos toques, o lo dices, y Moss ajusta tus metas de calorías y macros cada semana con la tendencia de tu peso. Tus hábitos te acompañan como estrellas en un cielo nocturno.

REGISTRA EN POCOS TOQUES
• Di todo junto lo que comiste («dos huevos revueltos, una tostada y un café con leche») y Moss lo anota, con el reconocimiento de voz del iPhone.
• Una base de alimentos con los nombres de tu país, como palta o aguacate, que tolera errores al escribir.
• Escanea el código de barras de un envase. Si no aparece, saca una foto de la etiqueta y Moss la lee en el teléfono.
• Tu comida de siempre en dos toques, y recientes, favoritos, comidas guardadas y recetas, con la última porción que usaste. Pega una receta como texto y Moss la arma.
• Porciones caseras, gramos u onzas, crudo o cocido, y el aceite de la sartén.
• Planifica el día o la semana con lo que te gusta, y saca la lista de compras.
• Copia una comida o un día, comparte recetas con un enlace y anota el agua.

METAS QUE SE AJUSTAN SOLAS
• Empiezas con una meta calculada con tu edad, sexo, altura, peso, actividad y objetivo.
• Cada semana, Moss estima tu gasto con lo que registraste y la tendencia de tu peso, y ajusta la meta. Siempre muestra cómo lo calculó.
• Elige cómo repartir los macros (equilibrada, baja en grasas, baja en carbohidratos o keto), pon tus metas a mano o reparte la semana con días más altos.
• Qué comer antes y después de entrenar, en la comida que toca.
• Además de los macros: fibra, azúcares, grasas saturadas, sodio y vitaminas.

TU PROGRESO
• La tendencia de tu peso, no el número de un día.
• Tus medidas con cinta y una estimación de tu grasa corporal, como un rango.
• Tu gasto estimado, tu balance y en qué fecha llegarías a tu objetivo.

TU SUEÑO
• Desde la app Salud: cuánto dormiste, a qué hora, qué tan regular es tu horario y tu deuda de sueño.
• Sin reloj, Moss estima tu noche con el teléfono y te pregunta cuando no está segura.
• El despertador de Moss (iOS 26 o más) y sus acciones para Atajos (la alarma, el cargador, la Concentración Sueño) le dicen a qué hora te despertaste, sin pasos de más.
• Un aviso para ir a la cama a tiempo de dormir lo que necesitas.

HÁBITOS COMO ESTRELLAS
• Cada hábito es una estrella y los de cada día forman una constelación real.
• Algunos se encienden solos: tus pasos, tu sueño, tu agua o llegar a tu proteína.
• Sin rachas que se rompen: tu cielo crece con lo que sostienes.
• Avisos a tu medida, con un máximo por día.

WIDGETS
Tu cielo de hoy en la pantalla de inicio, y tu noche en la pantalla bloqueada, para confirmarla con un toque.

SI USAS ASCENT
Vincula Moss con Ascent, nuestra app de gimnasio, y tu sueño y tu comida se cruzan con tu entrenamiento: tu recuperación, el rendimiento que puedes esperar, los días buenos para intentar una marca, un solo peso, las calorías según el día, la proteína después de entrenar y el gimnasio que se enciende solo. Es opcional: Moss funciona igual sin Ascent.

FUNCIONA CON SALUD
Con tu permiso, Moss lee de la app Salud tu peso, altura, pasos, agua, minutos de atención plena, sueño y lo que mide tu reloj de noche. Moss no escribe en Salud.

TUS DATOS SON TUYOS
Sin anuncios y sin rastreo. Entras con Apple, y Moss guarda tus datos en el teléfono y en tu cuenta para sincronizarlos. Puedes exportarlos y borrar tu cuenta desde la app.

Moss es para mayores de 16 años. No es un dispositivo médico: sus números son estimaciones y no reemplazan a un profesional de la salud. Si estás embarazada, amamantando o tienes una condición médica, consulta a un profesional antes de cambiar lo que comes.

Términos de uso: https://condezuzu.github.io/moss-app/terminos/
Privacidad: https://condezuzu.github.io/moss-app/privacidad/
```

### Description (inglés, 3.623 caracteres)

```
Moss is a food log for iPhone. Log what you eat in a few taps, or just say it, and Moss adjusts your calorie and macro targets every week, based on your weight trend. Your habits keep you company as stars in a night sky.

LOG IN A FEW TAPS
• Say everything you ate at once (“two scrambled eggs, a toast and a coffee with milk”) and Moss logs it, with the iPhone’s speech recognition.
• A food database with the names used where you live, like avocado or palta, that forgives typos.
• Scan a package’s barcode. If it isn’t there, take a photo of the nutrition label and Moss reads it on your phone.
• Your usual meal in two taps, plus recents, favorites, saved meals and recipes, with the last serving you used. Paste a recipe as text and Moss builds it.
• Household servings, grams or ounces, raw or cooked, and the oil in the pan.
• Plan the day or the week with what you like, and get the shopping list.
• Copy a meal or a day, share recipes with a link and log water.

TARGETS THAT ADJUST ON THEIR OWN
• You start with a target based on your age, sex, height, weight, activity and goal.
• Every week, Moss estimates your expenditure from what you logged and your weight trend, and adjusts your target. It always shows how it was calculated.
• Choose how to split your macros (balanced, low fat, low carb or keto), set your own targets or split the week with higher days.
• What to eat before and after training, in the meal it falls on.
• Beyond macros: fiber, sugars, saturated fat, sodium and vitamins.

YOUR PROGRESS
• Your weight trend, not one day’s number.
• Tape measurements and a body fat estimate, shown as a range.
• Your estimated expenditure, your balance and the date you’d reach your goal.

YOUR SLEEP
• From Apple Health: how long you slept, when, how regular your schedule is and your sleep debt.
• Without a watch, Moss estimates your night with your phone and asks when it isn’t sure.
• The Moss alarm (iOS 26 or later) and its Shortcuts actions (your alarm, your charger, the Sleep Focus) tell it when you woke up, with no extra steps.
• A reminder to get to bed in time to sleep what you need.

HABITS AS STARS
• Every habit is a star, and each day’s habits form a real constellation.
• Some light up on their own: your steps, your sleep, your water or hitting your protein.
• No streaks to break: your sky grows with what you keep up.
• Reminders that fit you, with a daily limit.

WIDGETS
Today’s sky on your Home Screen, and last night on your Lock Screen, to confirm it with a tap.

IF YOU USE ASCENT
Link Moss with Ascent, our gym app, and your sleep and food meet your training: your recovery, the performance you can expect, good days to try a personal record, one weight for both apps, calories by day, protein after training and a gym habit that lights up on its own. It’s optional: Moss works just the same without Ascent.

WORKS WITH APPLE HEALTH
With your permission, Moss reads your weight, height, steps, water, mindful minutes, sleep and what your watch measures at night from Apple Health. Moss never writes to Apple Health.

YOUR DATA IS YOURS
No ads and no tracking. You sign in with Apple, and Moss keeps your data on your phone and in your account to sync it. You can export it and delete your account from the app.

Moss is for people 16 and older. It isn’t a medical device: its numbers are estimates and don’t replace a health professional. If you’re pregnant, breastfeeding or have a medical condition, talk to a professional before changing what you eat.

Terms of Use: https://condezuzu.github.io/moss-app/en/terms/
Privacy: https://condezuzu.github.io/moss-app/en/privacy/
```

### Novedades

App Store Connect no muestra el campo en la primera versión. Desde la primera
actualización, lo que cambie, con detalle (2.3.12). Si algún día hace falta un
texto genérico:
- **es:** «Primera versión de Moss: registra lo que comes, ajusta tus metas cada
  semana y sigue tu peso, tu sueño y tus hábitos.»
- **en:** «The first version of Moss: log what you eat, adjust your targets
  every week, and follow your weight, sleep and habits.»

### Lo demás de la ficha

- **Categoría:** Salud y forma física; la segunda, Estilo de vida.
- **Precio:** gratis. Sin compras.
- **URL de soporte:** https://condezuzu.github.io/moss-app/ (tiene el contacto).
- **URL de marketing:** opcional; la misma portada.
- **Copyright:** `2026 Agustín Conde Zuzulich` (Apple suma el ©).
- **Derechos de contenido:** «sí, tiene contenido de terceros y los derechos
  para usarlo» (USDA, Open Food Facts, TACO, Ciqual, CoFID y el catálogo de
  estrellas).
- **Edad:** ver «h».

## e) Las capturas

**Tamaños.** Solo iPhone, verticales, en PNG o JPEG sin transparencia, de 1 a 10
por tamaño y por idioma. Hoy la página de Apple marca como obligatoria «iPhone
with Dynamic Island (medium display)» y pide además la pantalla grande (con
Dynamic Island o, si no, la de Face ID). Se suben las mismas pantallas en dos
tamaños:

| Tamaño | Píxeles | Teléfonos | Con Playwright (viewport × escala) |
|---|---|---|---|
| 6,9" (Dynamic Island, grande) | **1320 × 2868** (o 1290 × 2796) | iPhone 16, 17 y 18 Pro Max | 440 × 956 × 3 |
| Dynamic Island, mediana | 1206 × 2622 (o 1179 × 2556) | iPhone 16 Pro, 17, 17 Pro y 18 Pro (y tu 15 Pro, a 1179 × 2556) | 402 × 874 × 3 |

**Cómo.** `npm run tienda:capturas` (herramientas/capturas-tienda.mjs) las saca
de la app de verdad en la web (`npm run web:exportar` y `web:ver`), a × 3 con
esos dos viewports, con una persona inventada, **Lucía**, sin correo: tres
semanas de comidas de la base, siete de pesadas y dos de noches sin reloj, a las
ocho y pico de la noche (le falta la cena). La web se corrige solo en lo que
dibuja distinto del iPhone: los márgenes de la isla, los SF Symbols (dibujados
en línea fina), la sombra de las vistas sin fondo y el panel de prueba del cielo.
Cada pantalla va dentro de un iPhone dibujado, con la hora 9:41, sobre el azul
noche de `src/tema.ts`, con el texto arriba en Cormorant Garamond, crema. Las
vistas chicas quedan en la sección «Tienda» de la galería. Lo que no se puede
sacar de la web (los widgets) sale de tu iPhone.

**El orden** (las tres primeras se ven en la búsqueda: lo mejor primero):

| # | Pantalla | Texto en español | Texto en inglés |
|---|---|---|---|
| 1 | La hoja de registro de la cena: la búsqueda y la comida que se arma abajo | Anota tu comida en segundos | Log your meals in seconds |
| 2 | Hábitos: la constelación de hoy, con el día completo | Cada hábito, una estrella | Every habit is a star |
| 3 | Sueño: anoche, las noches y la deuda | Tu sueño, noche a noche | Your sleep, night by night |
| 4 | Inicio: lo que queda hoy, la luna y los macros | Lo que te queda hoy | What’s left for today |
| 5 | Decir lo que comí: lo dicho y los alimentos entendidos | Dilo de una vez | Say it all at once |
| 6 | Progreso: el objetivo y el peso con su tendencia | Tu progreso, semana a semana | Your progress, week by week |
| 7 | Optativa, del iPhone: el widget del cielo y «Anoche» en la pantalla bloqueada | Tu cielo y tu noche, sin abrir Moss | Your sky and your night, without opening Moss |

**Datos:** los de Lucía (arriba): comidas de todos los días, sin bebidas
alcohólicas; un peso que baja de a poco de 71,8 a 69,6 kg, con meta en 65; los
hábitos de ejemplo (Meditar 10 min, Dormir 7 h, Leer 20 páginas…).

**Reglas:** la app en uso (no la entrada, la cuenta ni el arranque); datos
inventados; sin precios ni «gratis»; sin «el más preciso» ni nada médico; sin la
app Salud ni su permiso; sin Ascent (es lo único que no se ve sin la otra app, y
va en la descripción); los anillos de los macros no como protagonistas (no
imitar los anillos de Actividad); la misma pantalla en cada idioma, con su texto.

## f) Las notas para quien revisa

App Store Connect › la versión › App Review Information:
- **Sign-in required:** sí. En **User name** y **Password**, la cuenta de
  demostración de **Ascent** (Moss entra con Apple; esa cuenta es para
  vincular). Las notas lo aclaran.
- **Contact:** Agustín Conde Zuzulich, nodoexpweb@gmail.com y tu teléfono con
  `+598`.
- **Notes:** hasta 4.000 bytes; se pega la versión en inglés (3.445 bytes con el
  marcador, unos 3.500 con la cuenta). La española es para vos.
- **Attachment:** el video de la vinculación (abajo).

**La cuenta de demostración de Ascent.** Conviene reusar la de la revisión de
Ascent (`supabase/cuenta-de-revision.mjs`, en su repo), que tiene unas seis
semanas de entrenamientos con series, pesos, marcas y un peso: con eso se ven la
recuperación, los músculos y el rendimiento. Cuidados:
- Ascent la re-siembra con `--de-cero` justo antes de mandar a revisión. Si eso
  borra el usuario, se borra también un vínculo hecho antes: re-sembrar primero y
  mandar las dos después.
- Si quien revisa Moss la vincula, quien revisa Ascent la va a ver vinculada con
  Moss. Está bien (muestra la función) y se desvincula desde cualquiera de las
  dos.
- La contraseña va solo en App Store Connect, nunca en un repo.

**El video (dos toques, con las dos apps).** En tu iPhone, con la build nueva de
Ascent por TestFlight, entrada con la cuenta de demostración, y Moss entrada con
una cuenta de Apple de prueba:
1. Centro de control › Grabación de pantalla (si no está: Ajustes › Centro de
   control › sumar «Grabación de pantalla»). Cuenta tres segundos.
2. En Moss, Hábitos › deslizar para arriba (o la flecha) › «Vincular con
   Ascent»: la hoja dice «@usuario · Ascent en este iPhone» y qué pasa cada app ›
   «Vincular». La luna entra en la órbita; bajar por la sección vinculada (la
   sesión de hoy, la recuperación).
3. Opcional: Perfil › Conexiones › Ascent › desvincular.
4. Parar con la pastilla roja de arriba. En Fotos, recortar a un minuto o menos,
   sin tu correo a la vista. Pasarlo a la PC (iCloud Drive, Google Drive o el
   cable: AirDrop no llega a Windows) y subirlo en **Attachment**. Si no lo
   toma, un enlace que no pida cuenta, en las notas.

### En inglés (para pegar)

```
Moss is a food log (calories and macros) with weight, sleep and habits. Free, with no ads, no in-app purchases and no tracking.

SIGN IN
Please sign in with your own Apple Account: Sign in with Apple is the only way to sign in to Moss, so no demo account is needed for Moss itself. A new account goes through a short onboarding: a data consent screen, a questionnaire (users must be 16 or older) and an optional Apple Health request with "Not now". Until there is enough of your own data, Progress and Sleep show sample data labeled as examples.

LINKING WITH ASCENT (OPTIONAL)
Ascent is our gym app, already on the App Store (same developer and team). Moss works fully without it. The demo account below is an Ascent account: use it only to test the link, not to sign in to Moss.
Ascent demo account: [EMAIL] / [PASSWORD]
1. In Moss, Habits tab: swipe up from above the tab bar, or tap the small arrow (also Profile > Connections > Ascent).
2. "Link with Ascent" > "Sign in with your Ascent account", and enter the demo account above. You don't need to install Ascent.
3. The sheet lists what each app shares. Nothing is shared until you tap "Link".
Once linked, Moss shows today's workout, recovery, expected performance, good days to try a PR, one weight for both apps, calories by day and protein after training, and the Gym habit lights up on its own. Unlink in Profile > Connections > Ascent.
With both apps on the iPhone (Ascent's update is in review now), linking takes two taps: each app leaves a one-hour session token in a keychain access group that only our team's apps can read (never a refresh token), and our server checks both sessions before saving the link. The attached video shows it.
Moss shares with Ascent: sleep duration and quality, daily calories and protein, weight and goal. Ascent shares with Moss: workouts (sets, weights, reps), PRs and weight. Same developer, explicit consent, no third parties.

ACCOUNT DELETION
Profile > Privacy and data > Delete account. The user confirms with Apple, we revoke the Sign in with Apple token with the REST API and delete the Moss account and all its Moss data at once, on the server and on the phone. Moss and Ascent are separate accounts: deleting the Moss account also removes the link, and the Ascent account stays as it is (it just stops receiving Moss data). If the person used the same email for both, we delete everything from Moss and remove the Sign in with Apple identity, so the Moss account no longer exists.

PERMISSIONS (ALL OPTIONAL)
- Apple Health, read only: onboarding and Profile. NSHealthUpdateUsageDescription is there only because the HealthKit library links write APIs; Moss never writes.
- Motion: a card in Sleep, to estimate sleep without a watch.
- Camera: Add (+) > Add food > barcode icon (barcodes; labels are read on device), meal photos and the profile photo. Choosing a photo uses the system picker; Moss only reads the photo you pick.
- Microphone and Speech Recognition: Add (+) > Say what I ate.
- Notifications: local reminders, Profile > Reminders.
- AlarmKit (iOS 26+): Sleep > Fine-tune > Alarm (the card shows when no watch or ring has written sleep in two weeks). It rings at the time the user sets and records when it is stopped, as the wake-up time.
- Shortcuts: Moss actions (alarm stopped, charger, Sleep Focus) for automations the user builds in the Shortcuts app. No prompt.
- Widgets: Home Screen (today's sky) and Lock Screen (last night, confirmed with a tap). A background task keeps them current.

HEALTH AND SAFETY
Moss is not a medical device. Targets use published formulas (Mifflin-St Jeor; U.S. Navy for body fat), each with "How it's calculated". 16+ only; no fast weight loss under 18. Pregnancy, breastfeeding or a medical condition remove any deficit. Targets never go below a calorie floor or aim to lose more than 1% of body weight a week. Training estimates say they are estimates.

Privacy: https://condezuzu.github.io/moss-app/en/privacy/
```

Los nombres coinciden con los textos de la app en inglés (revisado el 26/10/2026
contra `src/textos/en.json`: «Link with Ascent», «Sign in with your Ascent
account», «Profile › Connections», «Sleep › Fine-tune › Alarm», «Say what I
ate», «Privacy and data › Delete account»).

### En español (referencia)

```
Moss es un registro de comida (calorías y macros) con peso, sueño y hábitos. Es gratis, sin anuncios, sin compras y sin rastreo.

ENTRAR
La única forma de entrar es Sign in with Apple: sirve cualquier cuenta de Apple. Una cuenta nueva pasa por una entrada corta: el consentimiento de los datos, un cuestionario (hay que tener 16 años o más) y el pedido de Salud, optativo, con «Ahora no». Hasta tener datos propios, Progreso y Sueño muestran datos de ejemplo, marcados como tales.

VINCULAR CON ASCENT (OPTATIVO)
Ascent es nuestra app de gimnasio, ya en la App Store (mismo desarrollador y equipo). Moss anda entera sin ella. Para probar el vínculo sin la versión nueva de Ascent:
1. Hábitos: deslizar para arriba desde encima de la barra, o tocar la flecha chica (también Perfil › Conexiones › Ascent).
2. «Vincular con Ascent» › «Entrar con tu cuenta de Ascent», con la cuenta de demostración: [correo y contraseña de la cuenta de demostración de Ascent] (también en Sign-In Information).
3. La hoja dice qué pasa cada app. Nada se comparte hasta tocar «Vincular».
Vinculada, Moss muestra la sesión de hoy, la recuperación, el rendimiento esperado, los días buenos para intentar marca, un solo peso, las calorías según el día y la proteína después de entrenar, y el hábito del gimnasio se enciende solo. Se desvincula en Perfil › Conexiones › Ascent.
Con las dos apps en el iPhone (la actualización de Ascent está en revisión ahora), vincular son dos toques: cada app deja una sesión de una hora en un grupo del llavero que solo leen las apps de nuestro equipo (nunca el token de refresco), y el servidor revisa las dos sesiones antes de guardar el vínculo. El video adjunto lo muestra.
Moss le pasa a Ascent: cuánto y cómo dormiste, las calorías y la proteína de cada día, el peso y el objetivo. Ascent le pasa a Moss: los entrenamientos (series, pesos, repeticiones), las marcas y el peso. Mismo desarrollador, consentimiento expreso, sin terceros.

BORRAR LA CUENTA
Perfil › Privacidad y datos › Borrar la cuenta. La persona confirma con Apple, revocamos el token de Sign in with Apple con la API REST y borramos la cuenta de Moss y todo lo de Moss en el acto, en el servidor y en el teléfono. Moss y Ascent son cuentas separadas: borrar la de Moss también borra el vínculo, y la de Ascent sigue intacta (solo deja de recibir los datos de Moss). Si la persona usó el mismo correo en las dos, borramos todo lo de Moss y quitamos la identidad de Sign in with Apple, así la cuenta de Moss deja de existir.

PERMISOS (TODOS OPTATIVOS)
- Salud, solo lectura: la entrada y Perfil. NSHealthUpdateUsageDescription está solo porque la biblioteca de HealthKit enlaza las APIs de escritura; Moss nunca escribe.
- Movimiento: una tarjeta en Sueño, para estimar el sueño sin reloj.
- Cámara: Agregar (+) › Agregar comida › el ícono del código (códigos; las etiquetas se leen en el teléfono), las fotos de la comida y la de perfil. Las fotos usan el selector del sistema, sin acceso a la fototeca.
- Micrófono y reconocimiento de voz: Agregar (+) › Decir lo que comí.
- Avisos: locales, en Perfil › Avisos.
- AlarmKit (iOS 26 o más): Sueño › Afinar › Despertador (la tarjeta aparece si ningún reloj o anillo escribió sueño en dos semanas). Suena a la hora elegida y anota cuándo se para, como la hora de despertarse.
- Atajos: acciones de Moss (la alarma parada, el cargador, la Concentración Sueño) para las automatizaciones que arma la persona en la app Atajos. Sin pedido.
- Widgets: pantalla de inicio (el cielo de hoy) y pantalla bloqueada (anoche, para confirmar con un toque). Una tarea de segundo plano los tiene al día.

SALUD Y SEGURIDAD
Moss no es un dispositivo médico. Las metas usan fórmulas publicadas (Mifflin-St Jeor; la de la Marina de EE. UU. para la grasa), cada una con su «Cómo se calcula». Solo mayores de 18. Embarazo, lactancia o una condición médica sacan todo déficit. Las metas nunca bajan de un piso de calorías ni apuntan a perder más del 1 % del peso por semana. Lo de entrenar dice que es una estimación.

Privacidad: https://condezuzu.github.io/moss-app/privacidad/
```

## g) La lista, en orden

**0. El sitio** (`condezuzu/moss-app`, público):
1. Copiar a la raíz del repo todo lo de `docs/`, también `.nojekyll`, y subirlo a
   `main`.
2. Settings › Pages › Build and deployment › Source: **Deploy from a branch** ›
   `main` › **/ (root)** › Save.
3. Esperar «Your site is live at https://condezuzu.github.io/moss-app/» y abrir
   las cinco URL en el iPhone.

**1. Supabase** (proyecto `okeanaihymbvbdmrdqph`):
1. SQL Editor: correr en orden, cada una entera y una sola vez, las migraciones
   que falten de `0001` a `0009` (al 26/10 faltaban de la `0004` en adelante).
   Antes de instalar la build, que ya sube el nombre (`0009`).
2. Settings › Data API › Exposed schemas: `moss`, si no está.
3. Authentication › URL Configuration › Redirect URLs: `moss://**`.
4. Authentication › Sign In / Providers › **Apple**: activado, con
   `uy.moss.app` en Client IDs (y `uy.ascent.app` cuando Ascent tenga Apple).
5. Apple Developer › Keys: una clave nueva con Sign in with Apple, Primary App ID
   `uy.moss.app` (la `.p8` no está en esta PC; se baja una sola vez: al gestor de
   contraseñas).
6. Los secretos y `moss-borrar-cuenta`, con los comandos de su README
   (`supabase/functions/moss-borrar-cuenta/README.md`): `npx supabase login`,
   `secrets set` con `APPLE_TEAM_ID`, `APPLE_KEY_ID` y `APPLE_PRIVATE_KEY`, y
   `npx supabase functions deploy moss-borrar-cuenta --project-ref okeanaihymbvbdmrdqph --no-verify-jwt`.
   Probarla con el código de mentira (su paso 4).
7. `npx supabase functions deploy moss-vincular --project-ref okeanaihymbvbdmrdqph --no-verify-jwt`
   (no necesita secretos propios).
8. Plan Pro (copias diarias) y el acuerdo de tratamiento de datos (DPA), que la
   política nombra.
9. **El SMTP propio ya no hace falta para Moss** (no hay correo). Para Ascent,
   que entra con correo y contraseña, conviene igual: el correo de fábrica de
   Supabase solo manda al equipo del proyecto y unos pocos por hora. Si Ascent no
   tiene uno, Resend.

**2. La build:**
1. `eas.json`: el perfil `store` con un entorno `production` que tenga solo
   `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. **La primera build de la tienda, interactiva** (te pide entrar a Apple): los
   widgets suman el App Group `group.uy.moss.app` y la extensión
   `uy.moss.app.ExpoWidgetsTarget`, con su propio perfil; EAS registra las
   capacidades (Sign in with Apple, HealthKit, App Groups, Data Protection) y el
   grupo de llavero va con el prefijo del equipo:
   `npx eas-cli@latest build --profile store --platform ios`.
3. `npx eas-cli@latest submit --profile store --platform ios`.
4. Mirar el correo de App Store Connect: `ITMS-91053` (la extensión) o
   `ITMS-90683` (un texto que falte). Si llega uno, arreglarlo antes de mandar.
5. TestFlight en tu iPhone: entrar con Apple; vincular de las dos formas (con
   Ascent por TestFlight); los widgets; el despertador (iOS 26); un Atajo; borrar
   una cuenta de prueba y ver que Moss sale de Ajustes › tu nombre › Iniciar
   sesión con Apple. Y en un iPad, si podés.
6. Grabar el video («f») y sacar las capturas («e»).

**3. App Store Connect:**
1. Business: los acuerdos y el **estado de comerciante de la DSA** (sin él, la
   app no sale en la Unión Europea; si sos comerciante, se muestran el
   domicilio, el teléfono y el correo).
2. Apps › + › New App: iOS, el nombre de «d», idioma principal English (U.S.),
   bundle `uy.moss.app`, SKU `moss`.
3. App Information: las localizaciones Spanish (Mexico) y Spanish (Spain), el
   subtítulo, las categorías, los derechos de contenido, la edad («h») y la
   Privacy Policy URL de cada idioma.
4. Pricing and Availability: gratis, todos los países (con la DSA, la UE).
5. App Privacy: las respuestas de «a».
6. La versión 1.0, en cada idioma: capturas, texto promocional, descripción,
   palabras clave, URL de soporte, copyright, la build, App Review Information
   (la cuenta de Ascent, el contacto, las notas y el video) y la publicación a
   mano.
7. Cifrado: ya contestado en el Info.plist (`ITSAppUsesNonExemptEncryption`).
8. Add for Review › Submit, después de que Ascent re-siembre su cuenta de
   demostración.

**4. Ascent, en paralelo** (su rama `moss-vinculo`):
1. Su actualización: deja su sesión en el llavero compartido
   (`XF9N8X9KJG.uy.condeag.compartido`) al entrar y al renovar, la borra al
   salir, y suma su lado de la hoja y desvincular en Ajustes.
2. Su política, su App Privacy y sus notas, con lo que recibe de Moss (sueño,
   comida por día, peso, objetivo) y el vínculo.
3. Su cuestionario de edad nuevo, si no lo contestó: calorías o entrenamiento ya
   son «Health or Wellness Topics».
4. Re-sembrar su cuenta de demostración justo antes de mandar las dos.
5. Cuando sume Sign in with Apple: agruparla con `uy.moss.app` como App ID
   principal (si no, `moss-borrar-cuenta` revoca solo lo de Moss) y sumar
   `uy.ascent.app` en Supabase.

**5. Fuera de Apple** (la ley; mejor con un abogado):
- **URCDP:** inscribir la base de datos (Ley 18.331, art. 29;
  [trámite](https://tramites.gub.uy/ampliados?id=1665)). La ley pide el
  domicilio del responsable: si «Montevideo, Uruguay» no alcanza, la dirección
  o un domicilio constituido, también en las políticas.
- **Unión Europea:** con datos de salud de europeos, el reglamento europeo puede
  pedir un representante en la UE (art. 27).
- **Washington (EE. UU.):** la ley «My Health My Data» pide una política de datos
  de salud propia, con su enlace aparte en la portada.
- **Texas, Utah y Luisiana:** sus leyes de edad en las tiendas rigen desde junio,
  mayo y julio de 2026. Con 16+, la App Store pide el permiso de los padres a los
  menores. Más adelante, la Declared Age Range API podría confirmar la edad sin
  preguntarla.

## h) La clasificación por edad

Investigado el 26/10/2026 en la ayuda de App Store Connect y las noticias de
Apple (fuentes al final).

**Cómo es ahora.** Desde julio de 2025, las clasificaciones son 4+, 9+, 13+,
16+ y 18+ (ya no hay 12+ ni 17+). El cuestionario pregunta por controles en la
app, capacidades (desde julio de 2026 también redes sociales), temas maduros,
medicina o bienestar, sexualidad o desnudez, violencia y actividades de azar, y
calcula la clasificación con lo que pida más edad. Desde septiembre de 2026 hay
que contestarlo para mandar cualquier app o actualización.

**Las respuestas para Moss:**

| Sección | Pregunta | Respuesta | Por qué |
|---|---|---|---|
| In-App Controls | Parental Controls | No | No tiene |
| | Age Assurance | No | Pide el año de nacimiento y no deja seguir a menores, pero es lo que dice la persona: no confirma la edad (Apple da de ejemplo la Declared Age Range API, estimarla o un documento) |
| Capabilities | Unrestricted Web Access | No | La política y los términos se abren en el navegador; Moss no tiene uno libre |
| | User-Generated Content | No | Compartir una receta con un enlace es de persona a persona, no una distribución amplia |
| | Social Media | No | Sin muro ni nada que se difunda |
| | Messaging and Chat | No | |
| | Advertising | No | |
| Mature Themes | Profanity or Crude Humor | None | |
| | Horror/Fear Themes | None | |
| | Alcohol, Tobacco, or Drug Use or References | **Infrequent** | La base tiene bebidas alcohólicas y Moss cuenta su alcohol, sin promoverlo |
| Medical or Wellness | Medical or Treatment Information | None | No diagnostica ni da tratamientos: ante embarazo o una condición médica, solo saca el déficit y sugiere un profesional |
| | Health or Wellness Topics | **Yes** | Contar calorías es el ejemplo de Apple |
| Sexuality or Nudity | Las tres | None | |
| Violence | Las cuatro | None | |
| Chance-Based Activities | Simulated Gambling, Contests | None | Los logros son de cada uno: no hay competencia entre personas |
| | Gambling, Loot Boxes | No | |

**Lo que calcula Apple: 13+**, por el alcohol «Infrequent» (sin eso, 9+ por
«Health or Wellness Topics»). MacroFactor contestó «None» al alcohol y quedó en
9+; MyFitnessPal está en 16+ (información médica frecuente) y Lose It! en 18+.
«None» también se defiende; con la subida de abajo, el número no cambia.

**El mínimo de 16 de Moss obliga a subirla a 16+** (lo decidiste el 28/10/2026;
antes era 18). Apple: «If your app has a EULA with minimum age requirements that
exceed the rating that Apple calculated, you must override to a rating that
adheres to the requirements.» Los términos de Moss piden 16 (el punto 2), así
que: Age Categories and Override › **Override to Higher Age Rating › 16+**. Es
todo lo que Apple pide por eso: ni verificar la edad ni nada para la revisión.
La página sigue mostrando lo que se contestó (salud y bienestar, alcohol poco
frecuente). **Age Suitability URL** (opcional):
https://condezuzu.github.io/moss-app/en/terms/#age. «Made for Kids»: no.

**Lo que cambia con 16+** (y no pasaría con 18+): en Australia, Brasil y
Singapur la App Store no pide confirmar que se es adulto; en Texas, Utah y
Luisiana los menores igual necesitan el permiso de los padres (ver «g», 5); los
padres que limitan por edad en Tiempo de uso no ven Moss si el límite es menor.

**Cómo convive con la regla de adentro.** El cuestionario arranca en 16 y, si
Salud dice menos, la entrada no sigue. Antes de los 18, bajar «rápido» no está
(se usa el ritmo recomendado). Los términos, la app y la tienda dicen lo mismo.

---

## Fuentes (26/10/2026)

- Guías de revisión de la App Store, actualizadas el 16/10/2026:
  https://developer.apple.com/app-store/review/guidelines/
- Detalles de privacidad (qué es recopilar, los tipos, lo de Apple, los
  optativos): https://developer.apple.com/app-store/app-privacy-details/
- Clasificación por edad: los valores y las definiciones,
  https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions;
  cómo se contesta y la subida obligatoria con un EULA,
  https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Las clasificaciones nuevas y el plazo del 31/1/2026:
  https://developer.apple.com/news/?id=ks775ehf
- Las preguntas de redes sociales, obligatorias desde septiembre de 2026
  (9/7/2026): https://developer.apple.com/news/?id=tlur8uvi
- 18+ en Australia, Brasil y Singapur, y Utah y Luisiana (24/2/2026):
  https://developer.apple.com/news/?id=f5zj08ey
- Texas (3/6/2026): https://developer.apple.com/news/?id=sg176nne
- Fichas de referencia (26/10/2026): MacroFactor
  (https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471),
  MyFitnessPal (https://apps.apple.com/us/app/myfitnesspal-calorie-counter/id341232718)
  y Lose It! (https://apps.apple.com/us/app/lose-it-calorie-counter/id297368629)
- Capturas:
  https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Límites de la ficha y App Review Information:
  https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
  y https://developer.apple.com/help/app-store-connect/reference/app-review-information
- Los adjuntos para quien revisa (videos y documentos):
  https://developer.apple.com/documentation/appstoreconnectapi/app-store-review-attachments
- Borrar la cuenta en la app y revocar Sign in with Apple:
  https://developer.apple.com/support/offering-account-deletion-in-your-app/ y
  https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- Salud: https://developer.apple.com/documentation/healthkit/protecting-user-privacy
  y https://developer.apple.com/design/human-interface-guidelines/healthkit
- AlarmKit: https://developer.apple.com/documentation/alarmkit (y las de
  [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md))
- Estado de comerciante (DSA): https://developer.apple.com/news/?id=einwn76m
- Expo y las actualizaciones: https://expo.dev/privacy-explained y el
  identificador de la instalación,
  https://docs.expo.dev/eas/observe/reference/client-id/
- El correo de Supabase: https://supabase.com/docs/guides/auth/auth-smtp
- GitHub Pages:
  https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Ley 18.331: https://www.impo.com.uy/bases/leyes/18331-2008 · URCDP:
  https://www.gub.uy/unidad-reguladora-control-datos-personales/
- Washington, My Health My Data:
  https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy
- Licencias: USDA (https://fdc.nal.usda.gov/api-guide/), Open Food Facts
  (https://world.openfoodfacts.org/terms-of-use) y TACO, 4.ª edición
  (NEPA-UNICAMP: reproducción permitida citando la fuente).
