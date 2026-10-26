# La revisión de Apple

Todo lo que hace falta para mandar Moss a revisión: las respuestas de privacidad
de App Store Connect, los textos de los permisos, cada guía de Apple contra lo
que hace la app, la ficha de la tienda, las capturas, las notas para quien
revisa y la lista de pasos. Armado el 22/10/2026 con el código de esa noche y
con las fuentes de Apple de ese día (al final).

Los textos legales están en `docs/` (GitHub Pages):

| Página | URL (con Pages en este repo) |
|---|---|
| Portada y soporte | https://condezuzu.github.io/moss/ |
| Privacidad | https://condezuzu.github.io/moss/privacidad/ |
| Términos | https://condezuzu.github.io/moss/terminos/ |
| Privacy | https://condezuzu.github.io/moss/en/privacy/ |
| Terms | https://condezuzu.github.io/moss/en/terms/ |

Tienen tres marcadores para completar a mano: `[correo de contacto]`,
`[nombre del responsable]` y `[domicilio del responsable]` (la Ley 18.331, art.
13, pide el domicilio del responsable; puede ser un domicilio constituido). Las
dos políticas describen la app **con los arreglos de abajo hechos**: lo marcado
FALTA tiene que estar en la build antes de publicarlas.

## Lo que tiene que cambiar en la app antes de mandarla

En orden de gravedad. Las guías y los detalles están en «c».

**Estado (23/10/2026, de madrugada).** Hechos en la app: del 1 al 9.
- **1. Revocar Apple:** listo, en `supabase/functions/moss-borrar-cuenta`. Falta
  que crees la clave `.p8` y despliegues la función: los pasos están en su
  README. Hasta entonces la app borra como antes (`moss.borrar_cuenta()`).
- **8.** Los archivos van con la protección de datos de fábrica del iPhone
  (`NSFileProtectionCompleteUntilFirstUserAuthentication`, cifrados con el
  teléfono apagado) y la carpeta de SQLite queda fuera de la
  copia de seguridad (`modules/respaldo`).
- **10. El correo:** falta, y es tuyo: configurar un SMTP propio en Supabase.
- La clasificación de edad 18+ se elige en App Store Connect.

1. **Revocar el token de Apple al borrar la cuenta** (5.1.1(v)). Hoy
   `moss.borrar_cuenta()` borra el usuario y nada más.
2. **Enlaces a la política y a los términos dentro de la app** (5.1.1(i)). Hoy
   «Al continuar aceptas los Términos y la Política de privacidad» es texto
   suelto, y Perfil › Privacidad muestra un resumen sin enlace.
3. **El texto de Privacidad de Perfil dice algo falso** (5.1.3(i)): «Lo que lee
   de Salud se queda en el teléfono». El peso de Salud, el año de nacimiento, el
   sexo y la altura, los hábitos cumplidos y la noche estimada suben a la cuenta.
4. **Edad mínima de 18** en el cuestionario (`RANGOS_DEL_CUESTIONARIO.edad` es
   `[14, 100]`) y en Perfil › Tus datos.
5. **La pregunta de embarazo, lactancia o condición médica**, que deja las metas
   sin déficit y sugiere ver a un profesional. No existe todavía.
6. **El piso de calorías también en las metas a mano** (`metaManual` no tiene
   piso) y un peso meta que no baje de un IMC de 18,5 (hoy llega a 20 kg).
7. **El consentimiento expreso para los datos de salud** (5.1.1(ii) y Ley
   18.331, art. 18), y las búsquedas sin resultado **solo si la persona dice que
   sí** (5.1.1(ii) pide permiso aunque el dato sea anónimo).
8. **Los datos cifrados en el teléfono** (lo decidido) y `moss.db` fuera de la
   copia de iCloud (5.1.3(ii)).
9. **Contacto dentro de la app** (1.5): una fila «Ayuda y contacto» en Perfil.
10. **El correo**: sin un SMTP propio, Supabase solo manda correos al equipo del
    proyecto; crear cuenta o recuperar la contraseña con correo falla para quien
    revisa (2.1).

Lo demás de «c» es RIESGO: conviene, pero no frena la revisión.

---

## a) Privacidad de la app (App Store Connect › App Privacy)

«Recopilar», para Apple, es mandar un dato fuera del teléfono y poder verlo
después. Lo que se usa solo en el teléfono no se declara: los pasos, la
frecuencia, la variabilidad y la respiración de Salud, el movimiento, las fotos
de la comida, la canasta y cuándo se abrió Moss.

**¿Recopilan datos de esta app? Sí.** Ningún dato se usa para rastrear: a «Is
this data used to track?», siempre **No**. Moss no usa el identificador de
publicidad ni pide permiso de rastreo.

| Tipo (en inglés, como en App Store Connect) | Qué es en Moss | ¿Vinculado a la persona? | Para qué |
|---|---|---|---|
| Contact Info › Email Address | El correo de la cuenta (o el de reenvío de Apple) | Sí | App Functionality |
| Identifiers › User ID | El id de la cuenta en Supabase | Sí | App Functionality |
| Health & Fitness › Health | El perfil (año de nacimiento, sexo, altura, objetivo y ritmo, peso meta, «sin déficit»), el peso (también el que llega de Salud), las medidas, lo comido con sus nutrientes, el agua, las metas y el gasto, y las noches de Moss (las caras, la hora estimada, confirmada o corregida) | Sí | App Functionality |
| Health & Fitness › Fitness | Cuánto se mueve la persona, y los hábitos de pasos y atención plena con su meta y si se cumplieron (sí o no) | Sí | App Functionality |
| User Content › Other User Content | Los hábitos (nombre, ícono y días), las recetas y comidas guardadas, los alimentos propios, los favoritos, el resumen de cada día y los logros | Sí | App Functionality |
| Search History | Las búsquedas sin resultado: el texto, el idioma, la región y el día (`moss.busquedas_vacias`, en `0006_alimentos.sql`) | **No** | Analytics |
| User Content › Customer Support | «Reportar un error»: el alimento, qué está mal, la nota y el día (`moss.reportes`) | **No** | App Functionality |

**No se recopila:** Name (si se saca el pedido del nombre de Sign in with Apple,
ver «c», 5.1.1(iii)), Phone Number, Physical Address, Location, Sensitive Info,
Contacts, Photos or Videos, Audio, Browsing History, Purchases, Financial Info,
Usage Data, Diagnostics, Device ID, Surroundings, Body.

Notas:
- **Sensitive Info** incluye el embarazo. Si la app guarda «estoy embarazada»
  en la cuenta, hay que declararlo. Por eso la propuesta es guardar solo «sin
  déficit», sin el motivo (así lo dicen las políticas).
- **Las búsquedas y los reportes** van sin usuario ni hora (bien hecho en
  `0006_alimentos.sql`). Viajan con la sesión, y los registros técnicos de
  Supabase guardan unos días quién pidió: nunca se cruzan. Si las búsquedas son
  un sí explícito con dos opciones, que se cambia en Perfil, Apple las deja como
  optativas («Product Improvement Programs»); igual conviene declararlas, porque
  la política las nombra.
- **Privacy Policy URL**, por idioma: `/privacidad/` en las dos localizaciones
  en español y `/en/privacy/` en inglés.

## b) Los textos de los permisos

Apple pide que el texto diga **clara y completamente** para qué se usa cada dato
(5.1.1(ii)) y, para Salud, qué datos se leen (5.1.3(i)); las guías de interfaz
piden decir **Salud** con el nombre del sistema (en inglés, **Apple Health**) y
nunca «HealthKit». Los textos van en `app.json` (`ios.infoPlist` y los plugins) y
en `locales/es.json` y `locales/en.json`, iguales en los dos lugares.

### NSHealthShareUsageDescription (leer Salud) — cambiar

Hoy dice «edad» (se lee la fecha de nacimiento) y «lo que mide el reloj de
noche» (no dice qué). Propuesta:

- **es:** «Moss lee de Salud tu fecha de nacimiento, sexo, altura y peso para
  calcular tus metas; tus pasos, agua, minutos de atención plena y sueño para
  encender esos hábitos y estimar tu noche si no tienes reloj; y tu frecuencia
  cardíaca, frecuencia en reposo, variabilidad y respiración de la noche para la
  sección Sueño. Moss no escribe en Salud.»
- **en:** «Moss reads your date of birth, sex, height and weight from Apple
  Health to set your targets; your steps, water, mindful minutes and sleep to
  light up those habits and estimate your night if you don’t wear a watch; and
  your nighttime heart rate, resting heart rate, heart rate variability and
  respiratory rate for the Sleep section. Moss never writes to Apple Health.»

### NSHealthUpdateUsageDescription (escribir en Salud) — sacarlo

Es para escribir, y Moss no escribe. El plugin lo deja sacar: en `app.json`,
`"NSHealthUpdateUsageDescription": false` en las opciones de
`@kingstinct/react-native-healthkit`, y borrar la clave de los dos
`locales/*.json`. Si se deja, iOS nunca lo muestra, pero un texto que dice «no
escribo» en una clave de escribir confunde a quien revisa.

### NSCameraUsageDescription (cámara) — cambiar

«Las fotos no salen del teléfono» no es exacto: entran en la copia de iCloud del
iPhone (D10). Lo exacto es que Moss no las sube. Propuesta (va igual en las
opciones de `expo-camera` y de `expo-image-picker` y en los dos `locales`):

- **es:** «Moss usa la cámara para escanear el código de barras o la etiqueta
  nutricional de lo que comes, y para la foto de una comida si quieres sacarla.
  La etiqueta se lee en el teléfono y Moss no sube tus fotos.»
- **en:** «Moss uses the camera to scan the barcode or nutrition label of what
  you eat, and to take a meal photo if you want one. Labels are read on your
  phone, and Moss never uploads your photos.»

### NSMotionUsageDescription (movimiento) — bien; más claro

Está bien y se pide en contexto (la tarjeta de Sueño). Propuesta, para que diga
qué se mira:

- **es:** «Si no usas reloj, Moss mira la actividad del teléfono (quieto,
  caminando o en auto) para estimar a qué hora te dormiste y te despertaste. Esa
  actividad no sale del teléfono: solo se guarda la hora estimada.»
- **en:** «If you don’t wear a watch, Moss looks at your phone’s activity
  (still, walking or driving) to estimate when you fell asleep and woke up. That
  activity never leaves your phone: only the estimated times are saved.»

### NSMicrophoneUsageDescription y NSSpeechRecognitionUsageDescription (decir la comida) — nuevos

Desde el 26/10, «Decir lo que comí» escucha con el reconocimiento de voz del
iPhone, **solo en el teléfono** (`requiresOnDeviceRecognition`): el audio no se
guarda ni sale de ahí. Se piden al tocar el micrófono. Van en las opciones de
`expo-speech-recognition` y de `expo-camera` y `expo-image-picker` (si quedan en
`false` en esos dos, borran la clave del micrófono y la app se cierra al pedirlo)
y en los dos `locales`:

- **es:** «Moss usa el micrófono solo mientras dices lo que comiste, para
  anotarlo. El audio se procesa en el teléfono y no se guarda.» / «Moss convierte
  en texto, en el teléfono, lo que dices de tu comida para anotarlo. No se guarda
  ni sale del teléfono.»
- **en:** «Moss uses the microphone only while you say what you ate, to log it.
  The audio is processed on your phone and never saved.» / «Moss turns what you
  say about your meal into text, on your phone, to log it. It is never saved or
  sent anywhere.»

En las respuestas de privacidad no cambia nada: el audio y el texto no se
recolectan (no salen del teléfono).

### Lo que no necesita texto

Los avisos (se piden al prender Recordatorios o al elegir los primeros hábitos)
y la fototeca (no se usa: la foto es solo con la cámara). Ninguno falta.

## c) Guía por guía

Las guías son las del 16/10/2026.

| Guía | Estado |
|---|---|
| 1.4.1 Daño físico (salud) | FALTA |
| 1.5 Información del desarrollador | FALTA |
| 2.1 App completa | FALTA |
| 2.3 Metadatos (incluye 2.3.3, 2.3.6 a 2.3.9) | RIESGO |
| 2.4.1 Apps de iPhone en el iPad | RIESGO |
| 2.5.1 Salud (HealthKit) | PASA |
| 4.8 Inicio de sesión | PASA |
| 5.1.1(i) Política de privacidad | FALTA |
| 5.1.1(ii) Permiso | FALTA |
| 5.1.1(iii) Mínimos datos | RIESGO |
| 5.1.1(iv) Acceso | PASA |
| 5.1.1(v) Cuenta y borrar la cuenta | FALTA |
| 5.1.1(ix) Campos regulados | RIESGO |
| 5.1.2 Uso y rastreo | PASA |
| 5.1.3(i) Datos de salud | FALTA |
| 5.1.3(ii) Nada falso en Salud, nada en iCloud | RIESGO |

### 1.4.1 · Daño físico (salud) — FALTA

Pide mostrar los datos y el método detrás de cada número de salud, recordar
consultar a un médico y no prometer precisión que no se puede validar.

- **Bien:** cada número tiene «Cómo se calcula» (Mifflin-St Jeor, la Marina para
  la grasa, el control semanal); el sueño dice de dónde sale y qué tan seguro es;
  no se publica ningún porcentaje de precisión; los pisos de 1.200 y 1.400 kcal
  y el ritmo máximo de 0,75 % por semana.
- **Falta:**
  - **Edad mínima de 18:** `RANGOS_DEL_CUESTIONARIO.edad` a `[18, 100]` (lo
    usan el cuestionario y Perfil), un texto en el paso de la edad («Moss es para
    mayores de 18 años») y sacar la regla de menores de `ritmoPermitido`.
  - **Embarazo, lactancia o condición médica:** un paso nuevo después del
    objetivo. Propuesta:
    - **es:** «¿Algo que debamos tener en cuenta?» · «Estoy embarazada o en
      lactancia» · «Tengo una condición médica que afecta lo que como (por
      ejemplo, diabetes, una enfermedad renal o un trastorno de la conducta
      alimentaria)» · «Nada de esto». Con cualquiera de las dos primeras: «Moss no
      te va a proponer un déficit. Habla con un profesional de la salud sobre tus
      metas.»
    - **en:** «Anything we should know?» · «I’m pregnant or breastfeeding» · «I
      have a medical condition that affects what I eat (for example, diabetes,
      kidney disease or an eating disorder)» · «None of these». «Moss won’t
      suggest a deficit. Talk to a health professional about your targets.»
    - Se guarda solo «sin déficit» (un booleano en `moss.perfiles`), no el
      motivo: así no es «Sensitive Info» y la política lo dice así.
  - **Metas a mano:** que `metaManual` respete `pisoDe(sexo)`, o que avise y pida
    confirmar debajo del piso.
  - **Peso meta:** al bajar, no menos que un IMC de 18,5 para la altura
    (`PasosDelPesoMeta` hoy deja llegar a 20 kg).
  - **«Consulta a un profesional»** también en la comida: debajo del resultado
    del cuestionario y en Progreso › Cómo se calcula. Sueño ya lo tiene.

### 1.5 · Información del desarrollador — FALTA

La app y la URL de soporte tienen que tener una forma fácil de contacto. La
portada de `docs/` la tiene; en la app falta una fila «Ayuda y contacto» en
Perfil, que abra el correo o la portada.

### 2.1 · App completa — FALTA

- **Cuenta de prueba que no venza**, con datos de ejemplo (ver «f»).
- **El servidor prendido:** correr `0001` a `0006` en Supabase, exponer `moss` y
  el proveedor de Apple con `uy.moss.app` (`ascent.md`, «Lo que tenés que hacer
  vos»).
- **SMTP propio:** sin él, Supabase «se niega a mandar» a direcciones que no
  son del equipo del proyecto, y manda 2 por hora. Con correo, crear cuenta (si
  pide confirmar) y «Olvidé mi contraseña» fallan para quien revisa.
- **La build de la tienda limpia:** el perfil `store` de `eas.json` usa el
  entorno `preview`, el mismo de las pruebas. Si ahí está
  `EXPO_PUBLIC_CON_ASCENT=1` o `EXPO_PUBLIC_DIAGNOSTICO=1`, sale la sección de
  Ascent con «pronto» o el panel de prueba: contenido a medias. Un entorno
  `production` con solo las dos variables de Supabase.
- **RIESGO:** los datos de ejemplo cuando faltan los propios pueden parecer
  contenido de relleno. Que el aviso «Son datos de ejemplo» se vea siempre, y
  explicarlo en las notas.

### 2.3 · Metadatos exactos — RIESGO

- **2.3.1 y 2.3.10:** la ficha describe solo lo que está en esta build: nada de
  widgets, Apple Watch, amigos ni Ascent. La de «d» ya está así.
- **2.3.3:** capturas de la app en uso, no la entrada ni la pantalla de la
  cuenta.
- **2.3.6:** contestar el cuestionario de edad (ver «d») y **subir a 18+**: los
  términos piden 18 años, y Apple dice que con un contrato que pide más edad que
  la calculada «you must override».
- **2.3.7:** el nombre tiene que ser único (`Moss` solo puede estar tomado);
  nada de nombres de otras apps (MacroFactor) en el nombre, el
  subtítulo, las palabras clave ni las capturas; nada de precios en el nombre, el
  subtítulo ni las capturas.
- **2.3.8 y 2.3.9:** capturas aptas para todo público (sin bebidas alcohólicas
  en lo comido) y con una persona inventada (la de `persona.ts`), sin un correo
  real en Perfil.
- **2.3.12:** «Novedades» no existe en la primera versión; desde la 1.0.1, cada
  cambio importante se nombra.

### 2.4.1 · Apps de iPhone en el iPad — RIESGO

`supportsTablet` es `false`, pero Apple puede probar la app de iPhone en un iPad
(modo compatibilidad). Probar la build de TestFlight en un iPad: la entrada, el
cielo de Skia, el escáner y Salud (el iPad tiene Salud desde iPadOS 17).

### 2.5.1 · Salud (HealthKit) — PASA

Solo APIs públicas, Salud para salud y forma física, y la descripción de «d» lo
nombra («Funciona con Salud»). Detalles chicos:
- en español, «Salud» o «la app Salud», no «Apple Salud» (`perfil.salud`): las
  guías piden el nombre que muestra el sistema;
- en inglés, «Apple Health» y no «Health» solo: son 19 textos de `en.json`
  (entre ellos `entrada.cuestionario.saludTitulo`, `conectar` y `saludTexto`,
  `cielo.seEnciendeSola`, `habitos.conSalud`, `mas.pesoNota` y
  `perfil.privacidadTexto`); se encuentran buscando «Health» sin «Apple»
  adelante;
- nunca mostrar la app Salud ni su permiso en las capturas.

### 4.8 · Inicio de sesión — PASA

Sign in with Apple y correo propio; ningún inicio de terceros. El botón es el
nativo de Apple y va primero.

### 5.1.1(i) · Política de privacidad — FALTA

La política tiene que estar en App Store Connect **y dentro de la app**, decir
qué se recoge y para qué, confirmar que los terceros protegen igual y explicar
cuánto se guarda y cómo se borra. `docs/` lo cubre; en la app falta:
- en la pantalla de la cuenta, que «Términos» y «Política de privacidad» sean
  enlaces;
- en Perfil › Privacidad y datos, los dos enlaces debajo del resumen.

### 5.1.1(ii) · Permiso — FALTA

- **Datos de salud:** Apple pide consentimiento para recoger datos, y la Ley
  18.331 (art. 18) lo pide **expreso y escrito** para los de salud. Propuesta,
  antes del cuestionario, con un botón «Acepto»:
  - **es:** «Moss guarda lo que comes, tu peso, tus medidas y tu sueño en el
    teléfono y en tu cuenta, en servidores fuera de Uruguay, para que la app
    funcione. Puedes borrarlos cuando quieras.»
  - **en:** «Moss stores what you eat, your weight, your measurements and your
    sleep on your phone and in your account, on servers outside Uruguay, so the
    app can work. You can delete them at any time.»
- **Búsquedas sin resultado:** Apple pide permiso aunque el dato sea anónimo
  («even if such data is considered to be anonymous»).
  Preguntar una vez, la primera vez que una búsqueda no encuentra nada, con dos
  opciones («Mandar» y «No»), y un interruptor en Perfil › Privacidad y datos.
  `moss.anotar_busqueda_vacia` solo se llama con el sí.
- **Reportar un error:** ya es un sí en cada envío. Bien.
- **Los textos de los permisos:** los de «b».

### 5.1.1(iii) · Mínimos datos — RIESGO

`entrarConApple` pide `FULL_NAME` y no lo usa nunca. Pedir solo `EMAIL`.

### 5.1.1(iv) · Acceso — PASA

Salud tiene «Ahora no» y todo se carga a mano; el movimiento, la cámara y los
avisos se piden en su momento y son optativos.

### 5.1.1(v) · Cuenta y borrar la cuenta — FALTA

- **Borrar la cuenta desde la app:** está (Perfil › Privacidad y datos › Borrar
  la cuenta), es inmediato, avisa que no se deshace y que se borra en cualquier
  app donde se entre con esa cuenta. Bien.
- **Falta revocar Sign in with Apple** («should use the Sign in with Apple REST
  API to revoke user tokens»). Cómo:
  1. Apple Developer › Keys: una clave con Sign in with Apple (`.p8`).
  2. Una Edge Function `moss-borrar-cuenta` con la clave en sus secretos.
  3. Al tocar «Borrar», si la cuenta es de Apple, la app vuelve a pedir Apple
     (`AppleAuthentication.signInAsync`) para tener un `authorizationCode` nuevo
     (dura 5 minutos) y lo manda con la sesión.
  4. La función arma el `client_secret` (un JWT ES256 firmado con la `.p8`, con
     `iss` el equipo `XF9N8X9KJG` y `sub` `uy.moss.app`), canjea el código en
     `https://appleid.apple.com/auth/token`, revoca el `refresh_token` en
     `https://appleid.apple.com/auth/revoke` y recién ahí borra el usuario.
- **RIESGO: la cuenta es obligatoria** y Moss guarda todo en el teléfono.
  Apple dice: «If your app doesn’t include significant account-based features,
  let people use it without a login». La cuenta sincroniza y restaura en un
  teléfono nuevo, que es una función de cuenta de verdad (y las notas lo
  explican), pero en la v1 no hay ni Ascent ni amigos. Si la rechazan por esto,
  el arreglo es «Seguir sin cuenta» en la pantalla de la cuenta: el almacén ya
  anda sin Supabase.

### 5.1.1(ix) · Campos regulados — RIESGO bajo

Apple pide que las apps de salud o con datos sensibles las mande una empresa, no
una persona. Moss no da un servicio de salud: es bienestar (registro de comida).
Que la ficha y las notas lo digan así, sin palabras médicas. Si la cuenta de
desarrollador es personal y Apple lo pide, la salida es una cuenta de empresa.

### 5.1.2 · Uso y rastreo — PASA

Sin anuncios, sin analítica de terceros, sin rastreo, sin IA de terceros. Lo de
Salud no se usa para marketing (5.1.2(vi)). Supabase es el único que trata datos
por Moss, como encargado.

### 5.1.3(i) · Datos de salud — FALTA

Apple pide decir qué datos de salud se recogen del teléfono. La política lo
dice; la app no, o lo dice mal. Nuevo `perfil.privacidadTexto`:

- **es:**
  1. «Moss guarda tus datos en el teléfono y, con tu cuenta, en su servidor,
     para sincronizarlos. No los vende, no muestra anuncios y no te rastrea.»
  2. «De Salud, a tu cuenta solo llegan tu año de nacimiento, sexo y altura, tu
     peso, si se cumplieron tus hábitos y la hora estimada de tu noche. Lo demás
     (pasos, frecuencia cardíaca, variabilidad, respiración) queda en el
     teléfono. Moss no escribe en Salud.»
  3. «Las fotos de la comida quedan en el teléfono. Al escanear un código que
     Moss no conoce, solo ese código se busca en Open Food Facts.»
  4. «Puedes exportar tus datos y borrar tus datos o tu cuenta desde aquí. El
     detalle está en la política de privacidad.» (con los dos enlaces)
- **en:**
  1. «Moss keeps your data on your phone and, with your account, on its server
     to sync it. It doesn’t sell it, show ads or track you.»
  2. «From Apple Health, only your year of birth, sex and height, your weight,
     whether your habits were completed and the estimated time of your night
     reach your account. Everything else (steps, heart rate, variability,
     respiration) stays on your phone. Moss never writes to Apple Health.»
  3. «Meal photos stay on your phone. When you scan a code Moss doesn’t know,
     only that code is looked up on Open Food Facts.»
  4. «You can export your data and delete your data or your account from here.
     The details are in the privacy policy.»

### 5.1.3(ii) · Nada falso en Salud, nada de salud en iCloud — RIESGO

- **Bien:** Moss no escribe en Salud, tampoco la noche estimada.
- **`moss.db`** (en Documentos, con el peso, las medidas, lo comido y las
  noches) entra en la copia de iCloud del iPhone. Apple dice «may not store
  personal health information in iCloud». Arreglo:
  - **Cifrado (lo decidido, 23/10/2026):** la protección de datos de fábrica de
    iOS, `NSFileProtectionCompleteUntilFirstUserAuthentication`: cifrado con el
    teléfono apagado y legible con el teléfono bloqueado después del primer
    desbloqueo, que es lo que necesitan los widgets, los avisos y la noche sin
    reloj. Por eso no se pide el entitlement
    `com.apple.developer.default-data-protection` (con `CompleteUnlessOpen` la
    build fallaba, porque el perfil no tenía la capacidad, y además trababa lo
    que corre con el teléfono bloqueado). Es el cifrado del iPhone: no cambia el control de exportación
    (`ITSAppUsesNonExemptEncryption` sigue `false`). SQLCipher sí lo cambiaría.
  - **Fuera de la copia:** marcar `moss.db`, `-wal` y `-shm` con
    `isExcludedFromBackup` desde uno de los módulos de Swift (expo no lo trae).
    Con la cuenta obligatoria, nada se pierde: un teléfono nuevo baja todo. Si
    entra «Seguir sin cuenta», avisar que sin cuenta un teléfono nuevo empieza de
    cero, y sumar una línea a la política.
- Las fotos de la comida pueden quedar en la copia (D10): no son datos de salud.

### Otros arreglos chicos (RIESGO)

- **«Exportar todo»** exporta lo comido, el peso y las metas. Sumar las medidas,
  las noches, los hábitos, las recetas y los propios (la portabilidad de la ley
  europea habla de todo lo que dio la persona), o llamarlo «Exportar comida, peso
  y metas».
- **Un registro borrado queda entero en la cuenta**, con `borrado`. Conviene
  subir la marca sin el contenido (el nombre en «·» y los valores en 0): así lo
  borrado deja de estar en el servidor. Si se hace, cambiar esa línea de la
  política.
- **El `User-Agent` de Open Food Facts** dice `github.com/condezuzu/moss`, que es
  privado. Poner la portada de `docs/` o el correo de contacto (decisiones,
  «Fuera de la galería»).
- **El manifiesto de privacidad:** si al subir la build llega un aviso
  `ITMS-91053`, declarar las API con motivo en `ios.privacyManifests` de
  `app.json`.

## d) La ficha de la tienda

Los límites: nombre y subtítulo, 30 caracteres; palabras clave, 100 **bytes**
(una letra con tilde ocupa 2); texto promocional, 170; descripción, 4.000. No se repiten
en las palabras clave las del nombre ni las del subtítulo, que Apple ya indexa.
El texto en español sirve igual para «Spanish (Mexico)» y «Spanish (Spain)».

| Campo | Español | Inglés |
|---|---|---|
| Nombre | Moss: calorías y macros (23) | Moss: Calorie & Macro Tracker (29) |
| Subtítulo | Comida, peso, sueño y hábitos (29) | Food, weight, sleep & habits (28) |
| Palabras clave | `contador,kcal,proteína,dieta,nutrición,alimentos,bajar,código de barras,agua,recetas,déficit` (96 bytes) | `counter,kcal,protein,diet,nutrition,log,diary,barcode,scanner,lose,water,goals,recipes,meal,cut,bulk` (100 bytes) |
| Texto promocional | Registra lo que comes en pocos toques. Tus metas de calorías y macros se ajustan cada semana con la tendencia de tu peso. Sin anuncios. (135) | Log what you eat in a few taps. Your calorie and macro targets adjust every week to your weight trend. No ads. (110) |

Si `Moss` sola queda libre, el nombre puede ser solo «Moss» y el subtítulo
cargar lo demás; con el nombre largo se encuentra mejor.

### Descripción (español, 2.713 caracteres)

```
Moss es un registro de comida para iPhone. Anotas lo que comes en pocos toques y Moss ajusta tus metas de calorías y macros cada semana, con la tendencia de tu peso. Tus hábitos te acompañan como estrellas en un cielo nocturno.

REGISTRA EN POCOS TOQUES
• Una base de alimentos con los nombres de tu país, como palta o aguacate, que tolera errores al escribir.
• Escanea el código de barras de un envase. Si no aparece, saca una foto de la etiqueta y Moss la lee en el teléfono.
• Recientes, favoritos, comidas guardadas y recetas, con la última porción que usaste.
• Porciones caseras, gramos u onzas, crudo o cocido, y el aceite de la sartén.
• Copia una comida o un día, planifica los días que vienen y comparte recetas con un enlace.
• Carga rápida de calorías y macros, y el agua.

METAS QUE SE AJUSTAN SOLAS
• Empiezas con una meta calculada con tu edad, sexo, altura, peso, actividad y objetivo.
• Cada semana, Moss estima tu gasto con lo que registraste y la tendencia de tu peso, y ajusta la meta. Siempre muestra cómo lo calculó.
• Elige cómo repartir los macros (equilibrada, baja en grasas, baja en carbohidratos o keto), pon tus metas a mano o reparte la semana con días más altos.
• Además de los macros: fibra, azúcares, grasas saturadas y sodio.

TU PROGRESO
• La tendencia de tu peso, no el número de un día.
• Tus medidas con cinta y una estimación de tu grasa corporal, como un rango.
• Tu gasto estimado, tu balance y en qué fecha llegarías a tu objetivo.

TU SUEÑO
• Desde la app Salud: cuánto dormiste, a qué hora, qué tan regular es tu horario y tu deuda de sueño.
• Sin reloj, Moss estima tu noche con el teléfono y te pregunta cuando no está segura.
• Cada dato dice de dónde sale y qué tan confiable es.

HÁBITOS COMO ESTRELLAS
• Cada hábito es una estrella y los de cada día forman una constelación real.
• Algunos se encienden solos: tus pasos, tu sueño, tu agua o llegar a tu proteína.
• Sin rachas que se rompen: tu cielo crece con lo que sostienes.

FUNCIONA CON SALUD
Con tu permiso, Moss lee de la app Salud tu peso, altura, pasos, agua, minutos de atención plena, sueño y lo que mide tu reloj de noche. Moss no escribe en Salud.

TUS DATOS SON TUYOS
Sin anuncios y sin rastreo. Moss guarda tus datos en el teléfono y en tu cuenta para sincronizarlos. Puedes exportarlos y borrar tu cuenta desde la app.

Moss es para mayores de 18 años. No es un dispositivo médico: sus números son estimaciones y no reemplazan a un profesional de la salud. Si estás embarazada, amamantando o tienes una condición médica, consulta a un profesional antes de cambiar lo que comes.

Términos de uso: https://condezuzu.github.io/moss/terminos/
Privacidad: https://condezuzu.github.io/moss/privacidad/
```

### Description (inglés, 2.613 caracteres)

```
Moss is a food log for iPhone. Log what you eat in a few taps and Moss adjusts your calorie and macro targets every week, based on your weight trend. Your habits keep you company as stars in a night sky.

LOG IN A FEW TAPS
• A food database with the names used where you live, like avocado or palta, that forgives typos.
• Scan a package’s barcode. If it isn’t there, take a photo of the nutrition label and Moss reads it on your phone.
• Recents, favorites, saved meals and recipes, with the last serving you used.
• Household servings, grams or ounces, raw or cooked, and the oil in the pan.
• Copy a meal or a day, plan the days ahead and share recipes with a link.
• Quick-add calories and macros, and log water.

TARGETS THAT ADJUST ON THEIR OWN
• You start with a target based on your age, sex, height, weight, activity and goal.
• Every week, Moss estimates your expenditure from what you logged and your weight trend, and adjusts your target. It always shows how it was calculated.
• Choose how to split your macros (balanced, low fat, low carb or keto), set your own targets or split the week with higher days.
• Beyond macros: fiber, sugars, saturated fat and sodium.

YOUR PROGRESS
• Your weight trend, not one day’s number.
• Tape measurements and a body fat estimate, shown as a range.
• Your estimated expenditure, your balance and the date you’d reach your goal.

YOUR SLEEP
• From Apple Health: how long you slept, when, how regular your schedule is and your sleep debt.
• Without a watch, Moss estimates your night with your phone and asks when it isn’t sure.
• Every number says where it comes from and how reliable it is.

HABITS AS STARS
• Every habit is a star, and each day’s habits form a real constellation.
• Some light up on their own: your steps, your sleep, your water or hitting your protein.
• No streaks to break: your sky grows with what you keep up.

WORKS WITH APPLE HEALTH
With your permission, Moss reads your weight, height, steps, water, mindful minutes, sleep and what your watch measures at night from Apple Health. Moss never writes to Apple Health.

YOUR DATA IS YOURS
No ads and no tracking. Moss keeps your data on your phone and in your account to sync it. You can export it and delete your account from the app.

Moss is for people 18 and older. It isn’t a medical device: its numbers are estimates and don’t replace a health professional. If you’re pregnant, breastfeeding or have a medical condition, talk to a professional before changing what you eat.

Terms of Use: https://condezuzu.github.io/moss/en/terms/
Privacy: https://condezuzu.github.io/moss/en/privacy/
```

### Novedades

App Store Connect no muestra el campo en la primera versión. Para la 1.0.1, lo
que cambie, con detalle (2.3.12). Si algún día hace falta un texto genérico:
- **es:** «Primera versión de Moss: registra lo que comes, ajusta tus metas cada
  semana y sigue tu peso, tu sueño y tus hábitos.»
- **en:** «The first version of Moss: log what you eat, adjust your targets
  every week, and follow your weight, sleep and habits.»

### Lo demás de la ficha

- **Categoría:** Salud y forma física; la segunda, Estilo de vida.
- **Precio:** gratis. Sin compras.
- **URL de soporte:** https://condezuzu.github.io/moss/ (tiene el contacto, como
  pide App Store Connect).
- **URL de marketing:** opcional; la misma portada.
- **Copyright:** `2026 [nombre del responsable]`.
- **Derechos de contenido:** «sí, tiene contenido de terceros y los derechos
  para usarlo» (USDA, Open Food Facts, TACO y el catálogo de estrellas).
- **Edad** (Set Up Age Ratings):
  - controles parentales, verificación de edad, web sin límite, contenido de
    usuarios, redes sociales, mensajes y publicidad: no (compartir una receta con
    un enlace no es contenido distribuido);
  - **Health or Wellness Topics: Frequent** (contar calorías);
  - Medical or Treatment Information: None;
  - Alcohol, Tobacco, or Drug Use or References: Infrequent (la base tiene
    bebidas alcohólicas y el alcohol de lo comido);
  - todo lo demás: None;
  - **Age Categories and Override › Override to Higher Age Rating › 18+.**

## e) Las capturas

**Tamaños.** Solo iPhone, así que no van las del iPad. Apple pide «al menos una
captura de iPhone con Dynamic Island (pantalla mediana)», y para la pantalla
grande una de Dynamic Island o, si no está, una de Face ID. Subí dos tamaños,
verticales, en PNG o JPEG sin transparencia, de 1 a 10 por tamaño y por idioma:

| Tamaño | Píxeles | Teléfonos | Con Playwright (viewport × escala) |
|---|---|---|---|
| Dynamic Island, grande | 1320 × 2868 | iPhone 16, 17 y 18 Pro Max | 440 × 956 × 3 |
| Dynamic Island, mediana | 1206 × 2622 | iPhone 16 Pro, 17, 17 Pro y 18 Pro | 402 × 874 × 3 |

Los demás tamaños App Store Connect los saca achicando. `npm run app:capturas`
hoy saca 393 × 852 × 2 (786 × 1704), que **no sirve**: con × 3 da 1179 × 2556,
que sí vale como mediana. El iPhone Duo pide capturas propias recién desde abril
de 2027 (SDK de iOS 27.1).

**Cómo.** Desde la app en la web (`npm run web:exportar` y `web:ver`) con la
persona de ejemplo, o en el iPhone si es de los de Dynamic Island mediana. El
texto va arriba, sobre el cielo, en la serif de Moss, y abajo la pantalla.

**Reglas:** la app en uso (no la entrada, la cuenta ni el arranque); datos
inventados; sin bebidas alcohólicas; sin precios ni «gratis»; sin «el más
preciso» ni nada médico; sin la app Salud ni su permiso; los anillos de los
macros no como protagonistas (las guías prohíben imitar los anillos de
Actividad); la misma pantalla en las tres localizaciones, cada una con su texto.

| # | Pantalla | Texto en español | Texto en inglés |
|---|---|---|---|
| 1 | Inicio: lo que queda y los macros, con la luna | Lo que te queda hoy, de un vistazo | What’s left today, at a glance |
| 2 | La hoja de registro: la búsqueda y la comida que se arma | Registra en pocos toques | Log food in a few taps |
| 3 | El escáner y la revisión de la etiqueta | Escanea el código o la etiqueta | Scan the barcode or the label |
| 4 | Comida: la semana | Tu día, tu semana y tu mes | Your day, week and month |
| 5 | Progreso: el peso con su tendencia y el último control | Metas que se ajustan cada semana | Targets that adjust every week |
| 6 | Sueño: la noche, la deuda y de dónde sale | Tu sueño, y de dónde sale cada dato | Your sleep, and where each number comes from |
| 7 | Hábitos: la constelación de hoy | Cada hábito es una estrella | Every habit is a star |

Las tres primeras son las que se ven en la búsqueda: comida primero.

## f) Las notas para quien revisa

App Store Connect › la versión › App Review Information:
- **Sign-in required:** sí, con la cuenta de prueba.
- **Contact:** nombre, correo y teléfono con `+598`.
- **Notes:** hasta 4.000 bytes; Apple lee en inglés. Pegar solo la versión en
  inglés (2.974 bytes). La española es para vos.

**La cuenta de prueba:** creala con correo y contraseña (no con Apple), que no
venza, con tres semanas de la persona de ejemplo (comida, peso, hábitos y
noches de Moss) y el cuestionario completo: al entrar baja todo y aparece
Inicio. Las notas dicen lo que la build hace **con los arreglos de arriba**
(revocar Apple, 18+, la pregunta de embarazo, los enlaces): si algo no entra,
sacarlo de las notas.

### En inglés (para pegar)

```
Moss is a food log (calories and macros) with weight, body measurements, sleep and habits. It is free, with no ads, no in-app purchases and no tracking.

DEMO ACCOUNT
On the account screen, tap "Continue with email" and sign in with [demo account email] / [demo account password]. It has three weeks of sample data, so you land on Home with food, weight and habits. To see the onboarding questionnaire and the Apple Health request, create a new account instead (Continue with Apple, or Create account with any email).

ACCOUNT AND DELETION
An account is required: it stores and syncs the food log, weight, targets and habits across devices and restores them on a new iPhone. Sign in with Apple and email/password are offered; there is no third-party login. To delete the account: Profile tab > Privacy and data > Delete account. Deletion is immediate, removes all data from our server and the phone, and revokes the Sign in with Apple token. "Delete my data" removes the data but keeps the account. The account system is shared with another app by the same developer, so the warning says the account is deleted in any app where the user signs in with it.

APPLE HEALTH (READ ONLY)
Requested during onboarding ("Connect to Apple Health", with "Not now") and later from Profile > Apple Health. Moss reads date of birth, sex, height and weight to prefill the questionnaire; steps, water, mindful minutes and sleep to complete habits automatically and to estimate the night without a watch; and nighttime heart rate, resting heart rate, HRV and respiratory rate for the Sleep tab. Moss never writes to Apple Health. Without Health data, sections show sample data labeled as examples.

MOTION
Optional. A card in the Sleep tab asks for Motion & Fitness access to estimate sleep without a watch. Only the estimated times are saved.

CAMERA: BARCODE AND LABEL SCANNER
Tap + (center of the tab bar) > Add food > the barcode icon next to the search field. Point at any packaged food barcode. Unknown codes are looked up on Open Food Facts (only the barcode is sent). If the product is not found, the label scanner opens: take a photo of a nutrition facts panel. The text is read on device with Apple's Vision framework and shown for review before saving. The camera is also used for an optional meal photo, which stays on the device.

NOTIFICATIONS
Optional local reminders to log meals, in Profile > Reminders. No push server.

HEALTH AND SAFETY
Moss is not a medical device. Targets use published formulas (Mifflin-St Jeor; the U.S. Navy method for body fat) and each number has a "How it's calculated" explanation. Users must be 18 or older. Pregnancy, breastfeeding or a medical condition removes any calorie deficit and suggests seeing a professional. Suggested targets never go below a calorie floor or aim to lose more than 1% of body weight per week.

PRIVACY
https://condezuzu.github.io/moss/en/privacy/ (also linked on the sign-in screen and in Profile > Privacy and data).
```

«Connect to Apple Health» supone el cambio de «b» y de 2.5.1; hoy el botón dice
«Connect to Health».

### En español (referencia)

```
Moss es un registro de comida (calorías y macros) con peso, medidas, sueño y hábitos. Es gratis, sin anuncios, sin compras y sin rastreo.

CUENTA DE PRUEBA
En la pantalla de la cuenta, «Continuar con correo» y entrar con [correo de la cuenta de prueba] / [contraseña de la cuenta de prueba]. Tiene tres semanas de datos de ejemplo: se llega a Inicio con comida, peso y hábitos. Para ver el cuestionario y el pedido de Salud, crear una cuenta nueva (con Apple, o «Crear cuenta» con cualquier correo).

CUENTA Y BORRADO
La cuenta es obligatoria: guarda y sincroniza lo comido, el peso, las metas y los hábitos entre teléfonos, y los recupera en un iPhone nuevo. Hay Sign in with Apple y correo con contraseña; ningún inicio de terceros. Para borrar la cuenta: Perfil › Privacidad y datos › Borrar la cuenta. Es inmediato, borra todo del servidor y del teléfono y revoca el token de Sign in with Apple. «Borrar mis datos» borra los datos y deja la cuenta. La cuenta es compartida con otra app del mismo desarrollador: por eso el aviso dice que se borra en cualquier app donde se entre con ella.

SALUD (SOLO LECTURA)
Se pide en la entrada («Conectar con Salud», con «Ahora no») y después desde Perfil › Salud. Moss lee la fecha de nacimiento, el sexo, la altura y el peso para completar el cuestionario; los pasos, el agua, los minutos de atención plena y el sueño para cumplir hábitos solos y estimar la noche sin reloj; y la frecuencia cardíaca de noche, la de reposo, la variabilidad y la respiración para Sueño. Nunca escribe en Salud. Sin datos de Salud, las secciones muestran datos de ejemplo, marcados como tales.

MOVIMIENTO
Optativo. Una tarjeta en Sueño pide el permiso de Movimiento y forma física para estimar el sueño sin reloj. Solo se guardan las horas estimadas.

CÁMARA: CÓDIGO DE BARRAS Y ETIQUETA
«+» (en el medio de la barra) › Agregar comida › el ícono del código junto a la búsqueda. Apuntar a cualquier código de un envase. Los códigos desconocidos se buscan en Open Food Facts (solo se manda el código). Si no está, se abre el escáner de etiqueta: una foto de la tabla nutricional, que se lee en el teléfono con Vision de Apple y se revisa antes de guardar. La cámara también sirve para una foto de la comida, optativa, que queda en el teléfono.

AVISOS
Recordatorios locales y optativos para anotar, en Perfil › Recordatorios. Sin servidor de avisos.

SALUD Y SEGURIDAD
Moss no es un dispositivo médico. Las metas usan fórmulas publicadas (Mifflin-St Jeor; la de la Marina de EE. UU. para la grasa) y cada número tiene su «Cómo se calcula». Es para mayores de 18. Embarazo, lactancia o una condición médica sacan todo déficit y sugieren ver a un profesional. Las metas propuestas nunca bajan de un piso de calorías ni apuntan a perder más del 1 % del peso por semana.

PRIVACIDAD
https://condezuzu.github.io/moss/privacidad/ (también enlazada en la pantalla de la cuenta y en Perfil › Privacidad y datos).
```

## g) La lista, en orden

**1. En la app** (los FALTA de arriba, y después lo de «b» y los RIESGO):
1. Revocar Sign in with Apple al borrar la cuenta (con el paso 2.4 de abajo).
2. Enlaces a los términos y la política en la cuenta y en Perfil, y «Ayuda y
   contacto».
3. El consentimiento de los datos de salud, antes del cuestionario.
4. 18 años como mínimo.
5. La pregunta de embarazo, lactancia o condición médica (guarda solo «sin
   déficit», con su columna en una migración nueva y su lugar en `mezclar.ts` y
   `remoto.ts`).
6. El piso en las metas a mano y el IMC mínimo del peso meta.
7. «Consulta a un profesional» en el resultado y en «Cómo se calcula».
8. Las búsquedas sin resultado con su sí, y el interruptor en Perfil.
9. El cifrado (el entitlement) y `moss.db` fuera de la copia de iCloud.
10. `perfil.privacidadTexto` nuevo, «Salud» y «Apple Health» bien dichos.
11. Los textos de los permisos de «b», y fuera `NSHealthUpdateUsageDescription`.
12. Sign in with Apple sin `FULL_NAME`.
13. Exportar también lo demás, o cambiarle el nombre.
14. Las capturas a × 3 en `herramientas/capturar-app.mjs`.

**2. Supabase y Apple Developer:**
1. Correr en el SQL Editor `0001` a `0006`, en orden, y exponer `moss`
   (Settings › Data API).
2. Authentication: el proveedor Apple con `uy.moss.app` y `moss://**` en las
   redirecciones.
3. SMTP propio (Resend) y los correos de la cuenta sin nombrar ninguna app, o
   nombrando las dos: el proyecto es uno solo.
4. Apple Developer › Keys: la clave de Sign in with Apple (`.p8`), en los
   secretos de la Edge Function.
5. Plan Pro (copias diarias) y el acuerdo de tratamiento de datos de Supabase
   (DPA), que la política nombra.
6. Ver la región del proyecto (Settings › General): la política dice «fuera de
   Uruguay, en Amazon Web Services». Si querés, nombrarla.
7. La cuenta de prueba con su persona de ejemplo.

**3. GitHub** (Pages desde `/docs`):
1. **El repo es privado:** con GitHub Free, Pages solo publica repos públicos.
   Dos caminos: pasar la cuenta a GitHub Pro (el sitio queda público igual,
   aunque el repo no) o un repo público aparte solo con `docs/` (y entonces
   cambian las URL de este documento).
2. Completar los tres marcadores en las cinco páginas.
3. Llevar `docs/` a la rama por defecto (Settings › General › Default branch).
4. Settings › Pages › Build and deployment › Source: **Deploy from a branch** ›
   la rama por defecto › carpeta **/docs** › Save.
5. Esperar «Your site is live at https://condezuzu.github.io/moss/» y abrir las
   cinco URL en el iPhone.
6. Con el sitio arriba, el `User-Agent` de Open Food Facts con su URL.

**4. EAS:**
1. Un entorno `production` con solo `EXPO_PUBLIC_SUPABASE_URL` y
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, y el perfil `store` apuntando a él.
2. `npx eas-cli@latest build --profile store --platform ios` y
   `npx eas-cli@latest submit --profile store --platform ios`.
3. TestFlight: probar en el iPhone y en un iPad. Revisar los correos de App Store
   Connect por avisos (`ITMS-91053`).

**5. App Store Connect:**
1. Business: el acuerdo de apps gratis (viene aceptado) y el **estado de
   comerciante de la DSA**: sin él, la app no sale en la Unión Europea. Si sos
   comerciante, el domicilio, el teléfono y el correo se muestran ahí.
2. Apps › + › New App: iOS, el nombre de «d», idioma principal English (U.S.),
   bundle `uy.moss.app`, SKU `moss`.
3. App Information: las localizaciones Spanish (Mexico) y Spanish (Spain),
   subtítulo, categorías, derechos de contenido y la edad con el cambio a 18+.
4. Pricing and Availability: gratis, todos los países (con la DSA, la UE).
5. App Privacy: las respuestas de «a» y la URL de la política en cada idioma.
6. La versión 1.0, en cada idioma: capturas, texto promocional, descripción,
   palabras clave, URL de soporte, copyright, la build, App Review Information
   (cuenta de prueba, contacto y notas) y la publicación a mano.
7. Cifrado: ya contestado en el Info.plist (`ITSAppUsesNonExemptEncryption`).
8. Add for Review › Submit.

**6. Fuera de Apple** (la ley; mejor con un abogado):
- **URCDP:** inscribir la base de datos (Ley 18.331, art. 29;
  [trámite](https://tramites.gub.uy/ampliados?id=1665)).
- **Unión Europea:** con datos de salud de europeos, el reglamento europeo puede
  pedir un representante en la UE (art. 27).
- **Washington (EE. UU.):** la ley «My Health My Data» pide una política de
  datos de salud propia, con su enlace aparte en la portada. Si Moss se publica
  en Estados Unidos, una página más en `docs/`.

---

## Fuentes (22/10/2026)

- Guías de revisión de la App Store, actualizadas el 16/10/2026:
  https://developer.apple.com/app-store/review/guidelines/
- Borrar la cuenta en la app y revocar Sign in with Apple:
  https://developer.apple.com/support/offering-account-deletion-in-your-app/ y
  https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- Detalles de privacidad (tipos, propósitos, optativos):
  https://developer.apple.com/app-store/app-privacy-details/
- Capturas:
  https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Límites de la ficha:
  https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
  y https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Edad y el cambio a una mayor:
  https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
  y https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Salud: https://developer.apple.com/documentation/healthkit/protecting-user-privacy
  y https://developer.apple.com/design/human-interface-guidelines/healthkit
- El entitlement de protección de datos:
  https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.default-data-protection
- Estado de comerciante (DSA): https://developer.apple.com/news/?id=einwn76m
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
