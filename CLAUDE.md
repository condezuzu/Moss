# Moss

App de comida para iPhone: trackear calorías y macros como MacroFactor, sin IA de
fotos, global y de pago, con 7 días gratis (D40). Seis secciones con el «+» en el medio de la barra: Inicio,
Comida, Progreso, Sueño, Hábitos y Perfil. La comida es el centro; los hábitos y
el cielo acompañan:
cada hábito es una estrella, los hábitos de cada día forman una constelación real
y el progreso es el cielo mismo. Expo SDK 58 + Supabase + Skia.

**Este archivo es lo único que se lee siempre.** Lo que está en `spec/` ya está
decidido y no se rediscute; lo marcado PENDIENTE se pregunta antes de asumir.
Para todo lo de Expo, leé también [`AGENTS.md`](AGENTS.md): Expo cambia en cada
SDK y la memoria no alcanza.

## Reglas de trabajo

- **Lo visual nuevo se aprueba primero en la galería**, con datos de mentira, y
  recién después se programa en la app.
- **Nada aparece ni desaparece de golpe** (lo pediste el 22/10/2026): lo que
  cambia en pantalla entra, sale o se acomoda con una animación (en la app,
  `entering`, `exiting` y `layout` de Reanimated; en la galería, CSS), y respeta
  Reducir movimiento. Tampoco se salta de un lugar a otro (5/11/2026: «nada de
  teletransportarse»): ir a otra sección se desliza, bajar hasta algo es suave y lo
  que se abre crece desde lo que tocaste. Microanimaciones en casi todo.
- **Moss es Moss**: no se presenta como «tu cuenta de Moss y Ascent», y la entrada,
  la ficha y lo de cada día no la necesitan ni la nombran. Con `CON_ASCENT` apagada,
  Ascent no se nombra en ningún lado. Prendida, solo en lo que lleva a vincular y en
  lo que anda con las dos: su sección, su señal (en la app, en Hábitos; en la propuesta
  para aprobar, en Progreso), la invitación de Inicio (solo con Ascent en ese iPhone),
  la fila y el final de Perfil, la recuperación en Sueño y, vinculada, la etiqueta de tu energía
  en Inicio (`spec/ascent.md`, «Ascent en Progreso» y «Que se encuentre»; `spec/entreno.md` 5.13).
- **Sin mitos**:
  - nada de capítulos, historias, héroes ni figuras;
  - el nombre de la constelación va chico;
  - el día completo es la constelación que se conecta y la aurora que sube, sin
    texto.
- **Todo el texto que se lee está en `src/textos/es.json` y `en.json`.**
  - El inglés tiene que tener exactamente las mismas claves (lo comprueba
    `tsc`).
  - Interfaz en **español neutro** (tú) e inglés, también con el iPhone en Uruguay
    o Argentina: nada de voseo ni de palabras rioplatenses (D31).
  - El código y los comentarios, en español.
- **Un solo juego de shaders**: `src/cielo/shaders/*.glsl`, que usan la galería
  (WebGL) y la app (Skia).
  - Se escriben en el GLSL que también acepta SkSL: sin `#define`, sin texturas,
    bucles con tope constante, sin uniforms adentro de las funciones.
  - Nunca `pow()` con base negativa: da NaN en SkSL y en Metal. Para eso está
    `gauss()`.
- **La galería usa la lógica de la app tal cual**: `construir.mjs` pasa a
  JavaScript los módulos que usa, con los alimentos curados de
  `assets/alimentos.db`:
  - `src/comida/buscar.ts`, `porciones.ts` y `etiqueta.ts`, que no importan nada, `recetaDeTexto.ts`, que usa `porciones.ts`, y `frase.ts`, que usa los dos;
  - de `src/dominio`: `comidas.ts`, `fechas.ts`, `metas.ts`, `micronutrientes.ts`, `dejaElDia.ts`, `control.ts`,
    `cuerpo.ts`, `progreso.ts`, `sueno.ts`, `sinReloj.ts`, `entrenamiento.ts`, `cuestionario.ts`, `cuidados.ts`, `alrededorDelEntreno.ts`,
    `musculos.ts`, `rendimiento.ts`, `fatiga.ts`, `recuperado.ts`, `estancados.ts`, `estadisticas.ts`, `senalDeAscent.ts`, `diagnostico.ts`, `paraHoy.ts`, `segunElDeporte.ts`, `energia.ts`, `rangoDeAscent.ts`, `plan.ts` y `premium.ts`, que solo importan entre ellos (también `avisos.ts`, `loQueFalta.ts` y `loQueConviene.ts`, con `luz.ts`, `dias.ts`, `habitos.ts` y `recordatorios.ts`, que usan)
    (`DEL_DOMINIO` en `construir.mjs`).
- **Worklets**: el plugin captura lo que usa cada worklet al definirlo. Lo que
  usa una función tiene que estar definido antes que ella. Por eso `paso()` va
  última en `escena.ts`.
- **Los gestos del cielo van solo sobre el lienzo**, nunca sobre la interfaz: si
  no, un toque en un botón enciende también la estrella de abajo.
- **El catálogo es uno**: `src/datos/constelaciones.json`. Se valida con
  `npm run catalogo:verificar`; fuentes y simplificaciones en `spec/catalogo.md`.
- **Marcar un hábito es instantáneo**: nada caro en el camino del toque. Lo
  espectacular va en el cielo y en las animaciones.
- **Registrar comida es lo más usado** (4 a 6 veces por día): cada toque cuenta.
  Los flujos y sus toques están en `spec/nutricion.md`; un cambio que sume un
  toque se discute antes.
- **La base de alimentos es una**:
  - `alimentos/genericos.txt` (los curados) más USDA, armados con `npm run
    alimentos` en `assets/alimentos.db`, que va en el repo.
  - Cada curado apunta a la descripción exacta de USDA.
  - Los nombres regionales llevan su país, y el asterisco marca el que se muestra
    ahí.
  - Se revisa con `npm run alimentos:verificar`.
- **El dominio es puro**: `src/dominio/` no importa nada del teléfono ni de
  React, y cada regla tiene su test. Las fechas son claves `AAAA-MM-DD` del día
  de Moss: el día empieza a la hora de corte (las 4 de fábrica, D32), así que lo
  de la madrugada es del día anterior (`diaLogico()` en `fechas.ts`).
- **Local primero**:
  - Todo pasa por el almacén (`src/almacen/`): actualiza en memoria al instante y
    guarda atrás, en orden.
  - Los días vividos quedan resumidos en `dias`. Solo se rearman los de las
    últimas dos semanas, cuando llegan marcas de otro teléfono.
  - Para cambiar el esquema de SQLite, se suma un bloque en `migrar()`
    (`src/almacen/sqlite.ts`).
- **Sincronización**:
  - Cada cosa lleva la hora de su cambio, y entre dos versiones gana la más
    nueva:
    - en el teléfono, con `src/almacen/mezclar.ts`;
    - en Supabase, con el trigger `al_recibir`.
  - Lo que baja de la cuenta se guarda sin quedar pendiente, así no rebota.
  - Una tabla nueva que sincroniza lleva:
    - la hora del cambio y `recibido`;
    - el trigger y RLS;
    - su regla en `mezclar.ts`;
    - sus filas en `remoto.ts`;
    - una comprobación en `herramientas/verificar-supabase.mjs`.
- **Supabase es el proyecto de Ascent**:
  - Moss vive en el esquema `moss` y **nunca toca `public`** (es de Ascent).
  - **Nunca llama funciones de Ascent**: lee sus tablas desde funciones propias
    que revisan el vínculo. Ver `spec/ascent.md`.
- **Respondeme siempre en español** (lo pediste el 28/10/2026): los mensajes, los
  resúmenes y las preguntas, aunque el pedido o una herramienta vengan en otro idioma.
- **La huella nativa (lo aprendí el 31/10/2026):** los `scripts` de `package.json` y el
  `.gitignore` cuentan como el código nativo: cambiar una línea corta las OTA a las
  builds instaladas. Se tocan solo para la próxima build, y antes de cada OTA se corre
  `node herramientas/verificar-huella.mjs`. Al revés, el Swift de `app-intents/` no cuenta (lo
  comprobé el 1/11/2026): una OTA también le llega a la build que no lo tiene, así que lo que lo
  usa va con `requireOptionalNativeModule` y sin él no se rompe nada.
- Paquetes siempre con `npx expo install`.
- Comentá solo las líneas que tienen un porqué no obvio.
- **Antes de dar algo por terminado:**
  - `npm test`, `npm run typecheck`, `npx expo lint`, `npx expo-doctor` y
    `npx expo export --platform ios --output-dir <carpeta temporal>`.
  - Si tocaste `supabase/`, `src/almacen/` o `src/dominio/`:
    `npm run supabase:verificar`.
  - Si tocaste `alimentos/` o `herramientas/alimentos.mjs`: `npm run alimentos`
    y `npm run alimentos:verificar` (los tests del buscador corren contra la
    base armada).
  - Si tocaste los shaders: `npm run shaders:verificar`.
  - Si tocaste el cielo de la app: `node herramientas/exportar-web.mjs` (deja la app en `web-exportada/`) y
    `npm run app:capturas` (con `npm run web:ver` prendido).
  - Si tocaste la galería: `npm run galeria` y `npm run galeria:capturas` (con
    `npm run galeria:ver` prendido).
  - **Mirá las capturas.**

## Dónde

| | |
|---|---|
| Galería privada | https://claude.ai/artifact/FcsCWWmMgfzmJ7G6eVSNYr. Se republica con la herramienta Artifact desde `galeria/dist/index.html` (después de `npm run galeria`), pasando ese enlace como `url`: así queda en el mismo lugar. |
| Rama | `cimientos` (sale de `master`) |
| Repo | github.com/condezuzu/moss, privado (el remoto `origin`); Moss tiene su propio repo, aparte del de Ascent |
| App | `uy.moss.app` · equipo `XF9N8X9KJG` · EAS `condeag` |
| Supabase | el proyecto de Ascent (`okeanaihymbvbdmrdqph`), esquema `moss`. Cómo y por qué: `spec/ascent.md` |
| Sitio | la portada, la privacidad y los términos: https://condezuzu.github.io/moss-app/, del repo público `condezuzu/moss-app` (GitHub Pages, rama `main`). Se publica copiando `docs/` tal cual a la raíz de ese repo. **Ojo:** lo publicado (6/11/2026) es el de la 1.0, sin Ascent ni la suscripción; `docs/` ya trae las dos, para cuando se prendan (`CON_ASCENT` y `PREMIUM_SALE`): hasta entonces, no se publica `docs/` entero |
| Actualizaciones por aire | `expo-updates`, con la huella nativa como versión. Canales: `production` (la build `store`), `preview` (`telefono` y `simulador`) y `development` (`dev`). Una OTA solo llega a las builds con la misma huella. Cada OTA se publica en `production` y en `preview` (con `--environment preview`): la build `telefono` de tu iPhone escucha `preview` |
| La otra app | Ascent: `C:\Users\agusc\ascent`, github.com/condezuzu/ascent. Lo de Ascent para el vínculo (D27) está en la rama `moss-vinculo`, en el worktree `C:\Users\agusc\ascent-moss` |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | los tests del dominio, del almacén y de la sincronización (Jest con `jest-expo`) |
| `npm run supabase:verificar` | el esquema de `supabase/moss/` en un Postgres local (PGlite): RLS, conflictos, semilla, borrar, y la app de verdad sincronizando varios teléfonos contra él |
| `npm run alimentos` | arma `assets/alimentos.db`: baja USDA (FNDDS y SR Legacy) a `.cache/usda` la primera vez, suma `alimentos/genericos.txt` y arma los índices de búsqueda. Con `VER_PORCIONES=1` lista las porciones que faltan traducir |
| `npm run alimentos:verificar` | revisa la base: valores posibles, porciones en español, nombres regionales sin ambigüedad, índices y tamaño; avisa de lo que no cierra con 4/4/9. Los controles de toda la base (macros, micronutrientes, porciones, platos, lo verificado) son tests: `src/comida/controles.test.ts` (con `BASE=otra.db`, contra otra base) |
| `npm run alimentos:comparar` | compara cada curado con una segunda tabla oficial (TACO, Ciqual o CoFID) según `herramientas/fuentes/pares.txt` y deja `alimentos/verificacion.txt`, que `npm run alimentos` lee. Cuáles, por qué y cómo, en `spec/fuentes.md` |
| `npm run typecheck` | tipos (incluye que `en.json` tenga las claves de `es.json`) |
| `npx expo lint` | ESLint con la configuración de Expo, que incluye las reglas de React |
| `npm run galeria` | arma `galeria/dist/index.html` con los shaders, el catálogo, los textos, los alimentos curados y los módulos de la comida |
| `npm run galeria:ver` | sirve la galería en http://localhost:4173 |
| `npm run galeria:capturas` | capturas a 393×852 @2× en `capturas/galeria` (ver los escenarios abajo) |
| `npm run tienda:capturas` | las capturas para la App Store (spec/revision.md «e»), sacadas de la app de verdad en la web con una persona inventada (Lucía), dentro de un iPhone dibujado y con su texto arriba: `capturas/tienda/<tamaño>/<idioma>/`, en 1320×2868 y 1206×2622, y las vistas chicas para la galería en `capturas/tienda/vista/` (con `npm run web:ver` prendido; después, `npm run galeria`) |
| `npm run shaders:verificar` | compila los shaders con CanvasKit y deja vistas previas con riqueza 0, 0,6 y 1 en `capturas/shaders` |
| `node herramientas/exportar-web.mjs` + `npm run web:ver` | la app de verdad en la web (Skia es CanvasKit) en http://localhost:4174 |
| `node herramientas/fondos-de-widgets.mjs` | los fondos de los widgets, de los shaders de la app, en `assets/widgets/` (tarda varios minutos) |
| `node herramientas/verificar-huella.mjs` | compara la huella nativa de esta carpeta con la de la build de la tienda: se corre antes de cada OTA |
| `node herramientas/preparar-proxima-build.mjs` | declara en `app.json` los widgets nuevos y prende `CON_WIDGETS_NUEVOS`. Cambia la huella: solo al armar la próxima build |
| `node herramientas/bajar-marcas.mjs` + `node herramientas/marcas.mjs` | baja la exportación de Open Food Facts a `.cache/off` y arma `alimentos/marcas.txt`; después, `npm run alimentos` |
| `node herramientas/recorrer-pantallas.mjs <carpeta>` | todas las pantallas de la app en la web (las seis secciones con su scroll, el «+» y la entrada hasta el resultado) en un iPhone chico y uno grande, en es-UY, es-ES y en-US (con `npm run web:ver` prendido) |
| `npm run app:capturas` | capturas de la app en la web, con una persona que ya pasó la entrada: calidad, riqueza, toque, que se acuerde al recargar, día completo, universo, las secciones (Ascent desde el cielo y no desde la barra, la señal, las pestañas, Inicio y el «+»), decir lo que comí y, en un navegador limpio, las primeras pantallas de la entrada |
| `npx eas-cli@latest build --profile dev --platform ios` | la build de desarrollo para el iPhone (la primera vez pide entrar a Apple); su JavaScript llega de `npx expo start` |
| `npx eas-cli@latest build --profile simulador --platform ios --non-interactive` | compila todo lo nativo sin credenciales de Apple: la forma de probar Swift nuevo sin una Mac |
| `npx eas-cli@latest build --profile store --platform ios` | la build para la tienda. Con una capacidad o una extensión nueva, la primera vez sin `--non-interactive`: pide entrar a Apple para armar los perfiles |
| `npx eas-cli@latest update --channel production --environment production --message "…"` | una actualización por aire para la build de la tienda |
| `npm run migraciones` | qué migraciones de `supabase/moss/` están en la base real y cuáles faltan; `-- --aplicar --yes` aplica las que faltan (cada una en su transacción) y `-- --marcar 0003 --yes` anota una como aplicada sin correrla (sin `--yes`, el CLI de Supabase no escribe en la base real: se suma solo con tu sí). Necesita `npx supabase login` y `npx supabase link --project-ref okeanaihymbvbdmrdqph`. El historial de Moss va en `moss.migraciones`, no en el del CLI, que es de Ascent (su `db push` se trabaría con versiones ajenas) |
| `npm run servidor:preparar -- <ruta a AuthKey_XXXXXXXXXX.p8>` | carga la clave de Sign in with Apple como secreto y despliega `moss-borrar-cuenta` y `moss-vincular` (antes, una vez: `npx supabase login`). Sin la ruta, solo despliega. La `.p8` está en la raíz del repo, fuera de Git (`*.p8` en `.gitignore`) |
| `npm run catalogo:verificar` | valida el catálogo y las distancias entre estrellas |
| `npx expo start` | Metro para la build `dev` del teléfono (Expo Go no sirve: Salud necesita build propia) |

Los escenarios de `herramientas/capturar-galeria.mjs` (`node
herramientas/capturar-galeria.mjs <carpeta> <escenarios…>`) son estos:

- `inicio` (las seis secciones, «Para hoy» en cuatro momentos del día y el control cerca, debajo de la luna), `deslizar`;
- `tocar`, `completo`, `universo`;
- `ingles`, `baja`;
- `riqueza` (con la vía láctea), `fugaz`;
- `entrada` (la frase, la introducción, la cuenta, el cuestionario nuevo con Salud, la pantalla de pago y el flum);
- `comida` (con el cuadro de día, semana y mes), `registrar`, `marcas` (buscar una cadena, una marca del súper o lo genérico), `ventana` (verificado, cómo deja el día, las vitaminas y reportar), `plan` (armar el día y la semana, otra, tus comidas y la lista de compras), `receta` (pegar una receta, revisarla y guardarla), `decir` (decir lo que comí, sus preguntas, tu comida de siempre y anotar todo junto), `entreno` (qué comer antes y después de entrenar, por qué y Perfil › Entrenamiento), `foto` (la foto de la comida: el visor, «¿Qué es?», anotar después, «Tu día en fotos» y lo que se ve sin fotos), `etiqueta`, `comida-ingles`, `kcal` (los estilos de las calorías);
- `mas` (la hoja del «+», el peso y las medidas), `macros`, `personalizar`;
- `progreso` (el control en una línea, el plan por etapas y cambiarlo, el ritmo con su margen a los diez días, a las tres semanas y a las cuatro, la grasa con su invitación y «Más datos»), `plazo` (el ritmo y el plazo, D35, con el estado del plan al ritmo con margen, más lento y adelantado), `metas`, `sueno` (con datos: el arco de la noche, la deuda en una palabra con esta noche, la calidad, el horario y los vitales), `sueno-vacio` (sin noches, con una y con dos, sin deuda, con mucha, y en inglés);
- `primerdia` (Inicio sin datos), `cuestionario` (cada pregunta de la entrada: la grasa, el tipo de deporte, cuándo entrenas, el plan y tu día, también en inglés) y `todo` (tocar la luna: Todo lo de hoy, con cómo ver las calorías, también al pasarse);
- `senales` (cómo llegó a la hora de la noche sin reloj), `guia` (la guía del cargador, los dos caminos y lo que ve en Afinar) y `suscripcion` (D40: la pantalla de pago con cada estado, la hoja de Apple dibujada, cuando vence, el regalo y Tu suscripción en Perfil);
- `editor` (el «+» y mantener apretada una estrella), `avisos` (Perfil › Avisos, con «Lo que conviene hacer», el aviso de un hábito y el viaje al gimnasio), `bloqueo` (los avisos en la pantalla bloqueada: tres días de ejemplo, con lo que cambia lo que hiciste, y todos los textos, en es y en), `mes`, `sugeridos` (los primeros hábitos, después de la entrada) y `perfil` (la tarjeta, la suscripción en cada estado, Ascent prendida, apagada y vinculada, las subpantallas y en inglés);
- `cuidados` (D44, para aprobar: la pregunta del cuestionario con varios marcados, el consentimiento, el embarazo, la diálisis, el objetivo y el resultado; Perfil › Cuidados para marcar y desmarcar, con cómo cambia tu dieta con el riñón, la diabetes y la presión, un trastorno de la alimentación y reflujo, y el embarazo; la fila y en inglés);
- `ascent` (arriba de Progreso, para aprobar: «Estás 87 % recuperado» con sus franjas, «Hoy, concéntrate en», de qué sale, la fatiga por músculo, Marcas, Razones de estancamiento, Tu año, cómo se calcula, sin vincular, la hoja, los días de ejemplo, «sin déficit», los números ocultos y lo que cambia en las otras secciones), `ascent-ingles`, `ascent-senal` (la entrada de arriba a la derecha y el borde del planeta en cada estado, tocarla y arrastrar para abajo desde arriba de todo, volver empujando para arriba, que el scroll, las pestañas, la rueda y tu universo sigan andando, y la invitación de Inicio con «Ahora no» y al vincular);
- `deporte` (según el tipo de deporte, para aprobar: cada día de ejemplo en Inicio, Sueño y la pantalla bloqueada, el domingo sin alcohol, la energía baja del rugby con «Más», sin números, con «sin déficit» y plegada, Perfil › Entrenamiento con el partido y la carrera, sus avisos, la hora del partido en el cuestionario, «Todos» y en inglés);
- `energia` (tu energía, para aprobar: de tu día y no del gimnasio salvo con Ascent, con la curva del día; vive en Sueño, debajo de la noche, con el sueño, la comida de estos días, lo de hoy según la hora y, con Ascent, los músculos; baja, suficiente, alta y sin datos, con «Más» y plegada; al despertar, el mediodía con lo de hoy atrasado, antes y después de entrenar y la noche; en Inicio, el botón de arriba a la derecha en cada estado, el globo que crece al tocarlo y «Más en Sueño» deslizándose; sin números, en inglés y con Ascent vinculada), `base` (Perfil › En qué se basa Moss: la fila, el dibujo de cómo se ordena lo que llega, cada área abierta y en inglés) y `ascent-rangos` (la sección de Ascent con el color y el cuerpo de cada rango y de cada planeta del rango 4, sin vincular con el título nuevo, y el logo igual al ícono de Ascent en la entrada de Progreso y en la invitación);
- `widgets` (el chico y el mediano con un «hecho» tocado, tintados y transparentes, StandBy, la noche en la pantalla bloqueada antes y después del «Sí», en inglés, y abrir Moss con lo tocado) y `widgets-nuevos` (la propuesta de D43: la comida, el cielo, la noche, la pantalla bloqueada y StandBy).

La galería abre en Inicio. Las secciones son 0 Inicio, 1 Comida, 2 Progreso,
3 Sueño, 4 Hábitos y 5 Perfil: los escenarios del cielo pasan antes a Hábitos
(`window.__pagina(4, true)`) y los de la comida, a Comida. `deslizar` arrastra
con el mouse, como un dedo, y saca la foto con el dedo todavía abajo. Las
capturas se sacan en primer plano: corridas de fondo, el cielo sale negro. El render por software es lento: para
mirar una animación cuadro a cuadro está la cámara lenta
(`window.__velocidad(0.3)`).

## La spec

| Archivo | Qué hay |
|---|---|
| [spec/especificacion.md](spec/especificacion.md) | el documento del producto, con los cambios del 21/10/2026 |
| [spec/plan.md](spec/plan.md) | las etapas hasta la v1 y en qué etapa estamos |
| [spec/decisiones.md](spec/decisiones.md) | decisiones: primero las pendientes |
| [spec/nutricion.md](spec/nutricion.md) | la comida, el centro de la app: la base de datos y los nombres, la búsqueda, los flujos de registro con sus toques, los escáneres, las metas |
| [spec/evidencia-1.1.md](spec/evidencia-1.1.md) | la evidencia de la 1.1 (D32 a D36): dormirse sin reloj, la hora de ir a la cama, el día que empieza al despertarse, pesarse, la meta con plazo y las porciones de los platos |
| [spec/registrar-rapido.md](spec/registrar-rapido.md) | registrar más rápido: cómo lo hacen las otras apps, la voz en el iPhone sin costo y cómo entender la frase sin nube, con sus fuentes |
| [spec/progreso.md](spec/progreso.md) | Progreso: el peso, las medidas y la grasa corporal con cinta, el progreso al objetivo, el balance y la estrategia con el día del control |
| [spec/sueno.md](spec/sueno.md) | Sueño: lo que trae Salud, las reglas para que sea confiable, la calidad, la deuda, la regularidad, lo del reloj y cómo se estima la noche sin reloj |
| [spec/aparatos.md](spec/aparatos.md) | relojes y anillos: qué escribe cada marca en Salud, el orden de las fuentes, el mismo sueño desde dos fuentes y las conexiones directas |
| [spec/ascent.md](spec/ascent.md) | la conexión con Ascent, los cambios de su repo y lo que hace el usuario |
| [spec/rendimiento.md](spec/rendimiento.md) | con Ascent: el rendimiento esperado, la fatiga por músculo y los días para intentar marca, con sus estudios |
| [spec/entreno.md](spec/entreno.md) | qué comer antes y después de entrenar, en la comida que toca: la evidencia, las reglas, lo que hay en la v1 y lo que falta decidir; y según el tipo de deporte (5.12): las once reglas, dónde va cada una en la galería y qué dato le falta a la app |
| [spec/sueno-sin-esfuerzo.md](spec/sueno-sin-esfuerzo.md) | el sueño con menos esfuerzo: los Atajos (App Intents), el despertador (AlarmKit), el filtro de Concentración y el widget, con sus fuentes |
| [spec/avisos.md](spec/avisos.md) | los avisos: la hora de dormir, los de cada hábito, las comidas sin anotar y lo que falta, de a uno y con un máximo por día |
| [spec/widgets.md](spec/widgets.md) | los widgets |
| [spec/saludo.md](spec/saludo.md) | el saludo del día, descartado el 2/11/2026: lo que se probó y lo que lo reemplazó («Para hoy» en Inicio y los avisos) |
| [spec/revision.md](spec/revision.md) | la revisión de Apple: las respuestas de privacidad, los permisos, cada guía, la ficha en es y en, las capturas, las notas para quien revisa y lo que hay que hacer en App Store Connect |
| [spec/suscripcion.md](spec/suscripcion.md) | la suscripción (D40): toda Moss de pago con 7 días gratis, quién entra, lo que pide Apple, lo que hay que cargar en App Store Connect para cobrar, qué cambia en los términos y el código de oferta para la publicidad |
| [spec/fuentes.md](spec/fuentes.md) | las segundas tablas oficiales de los curados: cuáles y por qué, cómo se comparan, lo que hay que mostrar en Créditos y lo que queda por revisar |
| [spec/estudio.md](spec/estudio.md) | el estudio de la evidencia (5/11/2026): cada área refutada contra los mejores estudios (metas, peso, sueño, el momento de cada aviso, Ascent, cuidados y la IA de fotos, en `spec/estudio/`), lo que se sostiene, lo que cae, lo que se arregló y lo que decidís vos; de ahí sale «En qué se basa Moss» |
| [spec/catalogo.md](spec/catalogo.md) | el catálogo por cantidad de estrellas, fuentes y licencias |
| [spec/fluidez.md](spec/fluidez.md) | que ande fluido en un iPhone viejo: la revisión del dibujo de la app del 5/11/2026, lo que se arregló y lo que falta, del más al menos importante |
| [spec/lo-que-te-toca.md](spec/lo-que-te-toca.md) | lo que hace el dueño y no Claude: aprobar en la galería, las decisiones abiertas, los pasos cuando Apple aprueba, la próxima build, App Store Connect, Ascent y lo del iPhone (al 5/11/2026; se actualiza al cerrar cada tanda) |

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/app/` | rutas de Expo Router: las secciones y `compartido`, que abre los enlaces `moss://compartido` |
| `src/secciones/` | las seis secciones (`Secciones.tsx`): la tira con el gesto de Ascent, la barra con el «+» (`Barra.tsx`), la hoja del «+» (`HojaMas.tsx`), Ascent abajo de Hábitos (`Ascent.tsx`, `MarcaDeAscent.tsx`) y los movimientos (`movimiento.ts`). Cada sección en su carpeta: `inicio/`, `comida/` (con la foto de cada comida, compartir y el plan de comidas, `Plan.tsx`), `progreso/`, `sueno/`, `habitos/` (el editor, «Tu mes» y los primeros hábitos), `perfil/` (con exportar y borrar) y `entrada/` (la cuenta y el cuestionario). Lo que comparten: `tarjetas.tsx`, `HojaModal.tsx`, `teclado.ts` (el teclado como valor animado), `graficos/` y la persona de ejemplo mientras faltan datos (`persona.ts`, `ejemplo.ts`) |
| `src/dominio/` | las reglas, puras y con tests: fechas, luz y riqueza, hábitos, constelaciones por día, días, logros, semana, metas de comida (con los estilos, las metas a mano, repartir la semana y cuándo brilla o tiembla cada macro), control semanal (con el día que se elige), la comida de cada hora, lo que se come (`registros.ts`: registros, recetas, propios, favoritos, agua, los atajos y los hábitos de comida), exportar en CSV, el cuerpo (`cuerpo.ts`: la grasa con cinta y su rango), el progreso al objetivo, el balance y el plan por etapas (`progreso.ts`), el sueño (`sueno.ts`), lo que Moss hace con el entrenamiento de Ascent (`entrenamiento.ts`: calorías según el día, proteína después de entrenar, recuperación y por qué no subís), «Tu mes» (`estadisticas.ts`, sin rachas), los enlaces para compartir (`compartir.ts`), cuándo recordar anotar (`recordatorios.ts`), el plan de comidas (`plan.ts`: lo tuyo y las comidas tipo, armar el día y la semana, otra, la lista de compras y adaptar a la meta nueva), qué comer antes y después de entrenar (`alrededorDelEntreno.ts`), cómo se encuentra lo de Ascent (`senalDeAscent.ts`: la señal y la invitación de Inicio), el diagnóstico de tu rendimiento con Ascent, para aprobar (`diagnostico.ts`: cómo vienes, qué comer, «Hoy, concéntrate en» y cómo ir en el gimnasio), la recuperación nueva, para aprobar (`recuperado.ts`: el sueño, la fatiga muscular y la comida, con sus franjas), la fatiga por músculo y por día de la rutina (`fatiga.ts`), las razones de estancamiento (`estancados.ts`), el cuestionario nuevo (`cuestionario.ts`: el gasto con la grasa y el entrenamiento aparte, los tipos de deporte, la recomposición y la proteína), los cuidados de salud, para aprobar (`cuidados.ts`: qué cambia cada condición en la meta y en lo que dice Moss, con varias la regla más cuidadosa, el extra y la banda del embarazo, y lo único que subiría a la cuenta) y cuándo suena cada aviso y qué dice (`avisos.ts`: la hora de dormir, los hábitos y las comidas, de a uno y con un máximo por día; `loQueFalta.ts`: si vas muy bajo en proteína, calorías o agua; `loQueConviene.ts`: lo que conviene hacer, al estilo de RISE: comer antes y después de entrenar según tus comidas y el viaje, el café, la última comida, no entrenar fuerte tan tarde, las luces y la recuperación) y «Para hoy» (`paraHoy.ts`: hasta tres comentarios cortos de la comida, abajo de Inicio, con lo del deporte primero) y, para aprobar, los consejos según el tipo de deporte (`segunElDeporte.ts`: el partido, la carrera larga, los carbohidratos del día, cuánto tomar si te pesaste antes y después, el alcohol después de jugar, el partido de noche, dormir más, más carga con poco sueño, el pico de distancia, la energía baja y el hierro o el calcio, cada uno con dónde va), tu energía (`energia.ts`, para aprobar: la de estos días, con la disponibilidad de energía de lo anotado, lo de entrenar y la masa magra, y la del día, con el sueño y, con Ascent, los músculos de hoy: baja, suficiente o alta, con la regla del eslabón más débil) y el rango de Ascent (`rangoDeAscent.ts`, para aprobar: el espejo de su regla, para el color y el cuerpo de su sección) |
| `src/almacen/` | el almacén local (SQLite en el teléfono, localStorage en la web), con los hábitos, las metas, la estrategia, lo que se come (y la canasta, que no sube) y las medidas del cuerpo, sus ganchos, los hábitos de ejemplo y la sincronización: `sincronizar.ts` (cuándo), `remoto.ts` (Supabase) y `mezclar.ts` (qué gana) |
| `supabase/moss/` | las migraciones del esquema `moss`. Las aplica `npm run migraciones -- --aplicar` (no el SQL Editor), y quedan anotadas en `moss.migraciones` |
| `supabase/functions/` | las funciones de Moss en el servidor: `moss-borrar-cuenta` revoca Sign in with Apple y borra la cuenta, y `moss-vincular` vincula una cuenta de Moss con una de Ascent con las dos sesiones (cómo desplegarlas, en sus README; se prueban con `node herramientas/probar-borrar-cuenta.mjs` y `node herramientas/probar-vincular.mjs`; los dos borrados, contra la base real y sin dejar nada, con `npx supabase db query --linked -f herramientas/probar-borrado-en-produccion.sql`) |
| `modules/` | los módulos nativos propios: `movimiento` (el historial de movimiento, para la noche sin reloj), `leer-etiqueta` (Vision) y `respaldo` (saca la carpeta de SQLite de la copia de seguridad) |
| `app-intents/` | el Swift que va dentro del target de la app (módulos en línea): las acciones de Atajos de la noche, sus frases, el despertador con AlarmKit (iOS 26+) y las compras con StoreKit 2 (`Compras.swift`). Lo que llega se guarda como anclas (`src/salud/anclas.ts`) |
| `plugins/` | los plugins de configuración propios: `con-alarmkit.js` enlaza AlarmKit como opcional |
| `src/comida/` | lo de la comida que usa la base de alimentos: el buscador (`buscar.ts`), con tests contra la base de verdad, cómo se leen las cantidades (`porciones.ts`: «2 rebanadas», «1½ tazas»), el lector de la tabla de una etiqueta (`etiqueta.ts`), el de una receta pegada como texto (`recetaDeTexto.ts`: cada ingrediente con su cantidad, lo que rinde y el peso final), el de la comida dicha de una vez (`frase.ts`) y lo dicho en alimentos de la base, con sus preguntas (`entender.ts`, con los platos dichos sin cantidad de `platos.ts`: chico, mediano o grande) y Open Food Facts por código de barras (`off.ts`) |
| `alimentos/` | los genéricos curados (`genericos.txt`): nombre en español y en inglés, de dónde salen en USDA, porciones y nombres de cada región; las cadenas (`cadenas.txt`: McDonald's, Burger King, Subway, Mostaza, La Pasiva, Starbucks, KFC, Domino's, Grido, Sbarro y otras, con sus combos, cada producto con su fuente o «aproximado») y lo de marca del súper (`marcas.txt`, de Open Food Facts: lo arma `node herramientas/marcas.mjs` con lo que baja `node herramientas/bajar-marcas.mjs`; no se edita a mano) |
| `assets/alimentos.db` | la base de alimentos que arma `npm run alimentos` (no se edita a mano) |
| `src/salud/` | Salud: los permisos, lo que llena el cuestionario y la lectura de cada día (`leer.ts`, con `convertir.ts` puro y con tests) |
| `src/recordatorios/` | los avisos (la hora de dormir, los hábitos y las comidas), programados en el teléfono con la regla de `src/dominio/avisos.ts` |
| `src/widgets/` | los widgets (`expo-widgets`): el del cielo (`Cielo.widget.tsx`), el de la noche (`Noche.widget.tsx`) y, para la próxima build, Hoy, Anotar y Agua, que corren solos en la extensión, sus líneas de tiempo y los toques (`cielo.ts`, `noche.ts`, `hoy.ts`, `anotar.ts`, `agua.ts`, puros y con tests) y lo que los pone al día desde la app (`index.ts`). Ver `spec/widgets.md` |
| `src/fondo/` | la tarea de segundo plano (`expo-background-task`): con Moss cerrada, pone el día al día y los widgets |
| `src/contenido/` | las frases del día |
| `src/cielo/` | el cielo en Skia (ver la lista de abajo) |
| `src/cielo/shaders/` | ruido y `crece()`, cielo fijo, aurora, estrellas que titilan y estrella fugaz |
| `src/datos/` | catálogo de constelaciones |
| `src/textos/` | el diccionario y `t()`: cielo, entrada, comida, Inicio, el «+», el cuerpo, Progreso, Sueño, Perfil, diagnóstico |
| `src/lib/supabase.ts` | cliente, esquema `moss`, y `haySupabase()` (sin las variables, Moss anda sin cuenta) |
| `src/lib/ascent.ts` | Ascent en este iPhone: si está instalada, abrirla y su página en la App Store |
| `src/lib/banderas.ts` | lo que se prende por OTA: `CON_ASCENT`, la vinculación con Ascent, apagada en la 1.0 (D30), y `PREMIUM_SALE`, el día en que Moss pasa a ser de pago (D40; pide la build con StoreKit) |
| `src/lib/premium.ts` | La suscripción en el teléfono: lo que dice Apple (`app-intents/Compras.swift`), sin servidor ni terceros, y en la web una tienda de mentira. La pantalla de pago y Tu suscripción están en `src/secciones/premium/` y la regla de acceso, en `src/dominio/premium.ts` |
| `src/lib/llavero.ts` | el llavero que comparten Moss y Ascent (D27): la sesión de cada app, con su contrato (`sesionCompartida.ts`) |
| `src/secciones/ascent/` | la sección de Ascent vinculada (`Vinculada.tsx`, `calculos.ts`), la hoja de vincular (con la cuenta de Ascent, `cuentaDeAscent.ts`), la señal de Hábitos (`SenalDeAscent.tsx`, que usa `src/cielo/Interfaz.tsx`), la invitación de Inicio (`Invitacion.tsx`), la recuperación en Sueño y la fila de Perfil; lo que llega de Ascent queda en `src/almacen/ascent.ts` |
| `galeria/` | la galería: `src/` (ver la lista de abajo) y `construir.mjs` |
| `herramientas/` | capturas y verificaciones |
| `docs/` | el sitio: la portada, la política de privacidad y los términos, en es y en, con enlaces relativos. Se publica en el repo público `condezuzu/moss-app` |

`src/cielo/` tiene estas piezas:

- `Cielo.tsx`: el lienzo y los valores por cuadro.
- `dia.ts`: lo que el cielo de hoy toma del almacén. Separa la forma, que rehace
  la escena, de lo encendido, que no la rehace.
- `escena.ts`: los worklets de cada cuadro.
- `luces.ts`: las luces de los dos Atlas, solo las que hay en cada cuadro.
- `Interfaz.tsx`: el texto y el panel de prueba.
- `plano.ts`, `musgo.ts` y `mundo.ts`: la geometría.

`galeria/src/` tiene estas piezas:

- `motor.js`: el motor WebGL, con la pasada del flum.
- `escena.js`: la escena, con los modos hoy y entrada, y la constelación que
  se corre con su pestaña.
- `entrada.js`: la entrada a la app, con la introducción y el cuestionario (con Salud, la grasa, el tipo
  de deporte, tu día y el plan).
- `util.js`: lo que comparten las secciones nuevas (textos, números, íconos y
  la hoja de abajo).
- `luna.js`: la luna de la comida, en SVG, con la luz cenicienta y los cráteres con relieve.
- `kcal.js`: las kcal del día en cinco estilos (la luna, un anillo, un arco, una barra por comidas y
  los anillos de los macros), que cada uno elige en Todo lo de hoy: en Inicio, el día de Comida y la semana.
- `datos.js`: la persona de mentira (perfil con lo del cuestionario, pesadas, medidas, noches de Salud y
  lo que tiene en Ascent: la rutina, las marcas y el año).
- `comida.js`: Comida, con el cuadro de día, semana y mes, y la hoja de
  registro con la ventana del alimento, la comida que se arma, la revisión, la
  etiqueta, el teclado, decir lo que comí y tu comida de siempre; y qué comer
  antes y después de entrenar.
- `fotos.js`: la foto de la comida, para aprobar: el visor, la miniatura de «¿Qué es?», la tira «Tu día en fotos» y la hoja de cada foto, con los platos dibujados.
- `inicio.js`: Inicio con sus bloques, «Para hoy», tu energía (baja arriba de todo; suficiente o alta,
  debajo de los macros), el control cuando se acerca, personalizar y los gráficos chicos.
- `mas.js`: la hoja del «+»: tu comida de siempre de un toque, el agua, lo que sueles comer a esa hora,
  las guardadas, el peso y las medidas.
- `progreso.js`: Progreso: el control en una línea, el plan por etapas con la estrategia adentro, el
  peso, la grasa (o su invitación), «Más datos» y las metas.
- `sueno.js`: Sueño, sobre una noche oscura con auroras.
- `perfil.js`: Perfil, con conectar directo en Aparatos, «Tus respuestas» (el cuestionario para cambiarlo
  cuando quieras) y, abajo de todo, «En qué se basa Moss».
- `ascent.js`: la propuesta de Ascent, arriba de Progreso, con su CSS: la entrada de arriba a la derecha
  y el planeta, sin vincular y vinculada, «Estás 87 % recuperado» con sus partes, la fatiga por músculo,
  Marcas, Razones de estancamiento, Tu año, los días de ejemplo y la invitación de Inicio.
- `habitos.js`: Hábitos: el editor, «Tu mes» y los primeros hábitos.
- `atajos.js`: la guía del cargador, con un iPhone dibujado.
- `avisos.js`: los avisos en la pantalla bloqueada, con la regla de verdad: tres días de ejemplo y todos
  los textos; con un día de ejemplo del deporte, también ese.
- `deporte.js`: según el tipo de deporte, para aprobar: los siete días de ejemplo (la persona, el día y lo que
  recibe la regla) y lo que ve cada lugar: «Para hoy» y la tarjeta en Inicio, la línea de Sueño, la pantalla
  bloqueada y Perfil › Entrenamiento.
- `suscripcion.js`: la pantalla de pago y Tu suscripción (D40), sin compras de verdad.
- `widgets.js`: los widgets, en la pantalla de inicio, la bloqueada y StandBy, con su sección.
- `widgets-nuevos.js`: la propuesta de widgets (D43), para aprobar.
- `tienda.js`: la sección «Tienda»: el ícono y las capturas de la App Store, en es y en.
- `galeria.js`: la página y las seis secciones, con el gesto de Ascent y el
  «+» en la barra.
