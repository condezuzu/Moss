# Moss

App de comida para iPhone: trackear calorías y macros como MacroFactor, sin IA de
fotos, global y gratis. Seis secciones con el «+» en el medio de la barra: Inicio,
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
  Reducir movimiento.
- **Moss es Moss**: no se presenta como «tu cuenta de Moss y Ascent». Ascent se
  nombra solo donde se vincula (su sección, y lo que anda con las dos al final de
  Perfil), y ni ahí hace falta.
- **Sin mitos**:
  - nada de capítulos, historias, héroes ni figuras;
  - el nombre de la constelación va chico;
  - el día completo es la constelación que se conecta y la aurora que sube, sin
    texto.
- **Todo el texto que se lee está en `src/textos/es.json` y `en.json`.**
  - El inglés tiene que tener exactamente las mismas claves (lo comprueba
    `tsc`).
  - Interfaz en **español neutro** (tú, nunca vos) e inglés.
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
  - `src/comida/buscar.ts`, `porciones.ts` y `etiqueta.ts`, que no importan nada;
  - de `src/dominio`: `comidas.ts`, `fechas.ts`, `metas.ts`, `control.ts`,
    `cuerpo.ts`, `progreso.ts`, `sueno.ts`, `sinReloj.ts`, `entrenamiento.ts` y
    `estadisticas.ts`, que solo importan entre ellos (`DEL_DOMINIO` en `construir.mjs`).
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
  React, y cada regla tiene su test. Las fechas son claves `AAAA-MM-DD` en la
  hora local del momento en que pasa cada cosa.
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
  - Si tocaste el cielo de la app: `npm run web:exportar` y
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
| La otra app | Ascent: `C:\Users\agusc\ascent`, github.com/condezuzu/ascent |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | los tests del dominio, del almacén y de la sincronización (Jest con `jest-expo`) |
| `npm run supabase:verificar` | el esquema de `supabase/moss/` en un Postgres local (PGlite): RLS, conflictos, semilla, borrar, y la app de verdad sincronizando varios teléfonos contra él |
| `npm run alimentos` | arma `assets/alimentos.db`: baja USDA (FNDDS y SR Legacy) a `.cache/usda` la primera vez, suma `alimentos/genericos.txt` y arma los índices de búsqueda. Con `VER_PORCIONES=1` lista las porciones que faltan traducir |
| `npm run alimentos:verificar` | revisa la base: valores posibles, porciones en español, nombres regionales sin ambigüedad, índices y tamaño; avisa de lo que no cierra con 4/4/9 |
| `npm run typecheck` | tipos (incluye que `en.json` tenga las claves de `es.json`) |
| `npx expo lint` | ESLint con la configuración de Expo, que incluye las reglas de React |
| `npm run galeria` | arma `galeria/dist/index.html` con los shaders, el catálogo, los textos, los alimentos curados y los módulos de la comida |
| `npm run galeria:ver` | sirve la galería en http://localhost:4173 |
| `npm run galeria:capturas` | capturas a 393×852 @2× en `capturas/galeria` (ver los escenarios abajo) |
| `npm run shaders:verificar` | compila los shaders con CanvasKit y deja vistas previas con riqueza 0, 0,6 y 1 en `capturas/shaders` |
| `npm run web:exportar` + `npm run web:ver` | la app de verdad en la web (Skia es CanvasKit) en http://localhost:4174 |
| `npm run app:capturas` | capturas de la app en la web, con una persona que ya pasó la entrada: calidad, riqueza, toque, que se acuerde al recargar, día completo, universo, las secciones (Ascent desde el cielo y no desde la barra, la flecha, las pestañas, Inicio y el «+») y, en un navegador limpio, las primeras pantallas de la entrada |
| `npx eas-cli@latest build --profile dev --platform ios` | la build de desarrollo para el iPhone (la primera vez pide entrar a Apple); su JavaScript llega de `npx expo start` |
| `npm run catalogo:verificar` | valida el catálogo y las distancias entre estrellas |
| `npx expo start` | Metro para la build `dev` del teléfono (Expo Go no sirve: Salud necesita build propia) |

Los escenarios de `herramientas/capturar-galeria.mjs` (`node
herramientas/capturar-galeria.mjs <carpeta> <escenarios…>`) son estos:

- `inicio` (las seis secciones), `deslizar`;
- `tocar`, `completo`, `universo`;
- `ingles`, `baja`;
- `riqueza` (con la vía láctea), `fugaz`;
- `entrada`;
- `comida` (con el cuadro de día, semana y mes), `registrar`, `etiqueta`, `comida-ingles`, `kcal` (los cuatro estilos);
- `mas` (la hoja del «+», el peso y las medidas), `macros`, `personalizar`;
- `progreso`, `metas`, `sueno`;
- `editor` (el «+» y mantener apretada una estrella), `mes`, `sugeridos` (los primeros hábitos, después de la entrada) y `perfil`;
- `ascent` (la flecha, el gesto, sin vincular, vinculada y lo que cambia en las otras secciones), `ascent-ingles`.

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
| [spec/progreso.md](spec/progreso.md) | Progreso: el peso, las medidas y la grasa corporal con cinta, el progreso al objetivo, el balance y la estrategia con el día del control |
| [spec/sueno.md](spec/sueno.md) | Sueño: lo que trae Salud, las reglas para que sea confiable, la calidad, la deuda, la regularidad, lo del reloj y cómo se estima la noche sin reloj |
| [spec/aparatos.md](spec/aparatos.md) | relojes y anillos: qué escribe cada marca en Salud, el orden de las fuentes, el mismo sueño desde dos fuentes y las conexiones directas |
| [spec/ascent.md](spec/ascent.md) | la conexión con Ascent, los cambios de su repo y lo que hace el usuario |
| [spec/rendimiento.md](spec/rendimiento.md) | con Ascent: el rendimiento esperado, la fatiga por músculo y los días para intentar marca, con sus estudios |
| [spec/widgets.md](spec/widgets.md) | los widgets |
| [spec/catalogo.md](spec/catalogo.md) | el catálogo por cantidad de estrellas, fuentes y licencias |

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/app/` | rutas de Expo Router: las secciones y `compartido`, que abre los enlaces `moss://compartido` |
| `src/secciones/` | las seis secciones (`Secciones.tsx`): la tira con el gesto de Ascent, la barra con el «+» (`Barra.tsx`), la hoja del «+» (`HojaMas.tsx`), Ascent arriba de Hábitos (`Ascent.tsx`, `MarcaDeAscent.tsx`) y los movimientos (`movimiento.ts`). Cada sección en su carpeta: `inicio/`, `comida/` (con la foto de cada comida y compartir), `progreso/`, `sueno/`, `habitos/` (el editor, «Tu mes» y los primeros hábitos), `perfil/` (con exportar y borrar) y `entrada/` (la cuenta y el cuestionario). Lo que comparten: `tarjetas.tsx`, `HojaModal.tsx`, `graficos/` y la persona de ejemplo mientras faltan datos (`persona.ts`, `ejemplo.ts`) |
| `src/dominio/` | las reglas, puras y con tests: fechas, luz y riqueza, hábitos, constelaciones por día, días, logros, semana, metas de comida (con los estilos, las metas a mano, repartir la semana y cuándo brilla o tiembla cada macro), control semanal (con el día que se elige), la comida de cada hora, lo que se come (`registros.ts`: registros, recetas, propios, favoritos, agua, los atajos y los hábitos de comida), exportar en CSV, el cuerpo (`cuerpo.ts`: la grasa con cinta y su rango), el progreso al objetivo y el balance (`progreso.ts`), el sueño (`sueno.ts`), lo que Moss hace con el entrenamiento de Ascent (`entrenamiento.ts`: calorías según el día, proteína después de entrenar, recuperación y por qué no subís), «Tu mes» (`estadisticas.ts`, sin rachas), los enlaces para compartir (`compartir.ts`) y cuándo recordar anotar (`recordatorios.ts`) |
| `src/almacen/` | el almacén local (SQLite en el teléfono, localStorage en la web), con los hábitos, las metas, la estrategia, lo que se come (y la canasta, que no sube) y las medidas del cuerpo, sus ganchos, los hábitos de ejemplo y la sincronización: `sincronizar.ts` (cuándo), `remoto.ts` (Supabase) y `mezclar.ts` (qué gana) |
| `supabase/moss/` | las migraciones del esquema `moss`, que se corren a mano en el SQL Editor |
| `src/comida/` | lo de la comida que usa la base de alimentos: el buscador (`buscar.ts`), con tests contra la base de verdad, cómo se leen las cantidades (`porciones.ts`: «2 rebanadas», «1½ tazas»), el lector de la tabla de una etiqueta (`etiqueta.ts`) y Open Food Facts por código de barras (`off.ts`) |
| `alimentos/` | los genéricos curados (`genericos.txt`): nombre en español y en inglés, de dónde salen en USDA, porciones y nombres de cada región |
| `assets/alimentos.db` | la base de alimentos que arma `npm run alimentos` (no se edita a mano) |
| `src/salud/` | Salud: los permisos, lo que llena el cuestionario y la lectura de cada día (`leer.ts`, con `convertir.ts` puro y con tests) |
| `src/recordatorios/` | los avisos para anotar, programados en el teléfono |
| `src/contenido/` | las frases del día |
| `src/cielo/` | el cielo en Skia (ver la lista de abajo) |
| `src/cielo/shaders/` | ruido y `crece()`, cielo fijo, aurora, estrellas que titilan y estrella fugaz |
| `src/datos/` | catálogo de constelaciones |
| `src/textos/` | el diccionario y `t()`: cielo, entrada, comida, Inicio, el «+», el cuerpo, Progreso, Sueño, Perfil, diagnóstico |
| `src/lib/supabase.ts` | cliente, esquema `moss`, y `haySupabase()` (sin las variables, Moss anda sin cuenta) |
| `galeria/` | la galería: `src/` (ver la lista de abajo) y `construir.mjs` |
| `herramientas/` | capturas y verificaciones |

`src/cielo/` tiene estas piezas:

- `Cielo.tsx`: el lienzo y los valores por cuadro.
- `dia.ts`: lo que el cielo de hoy toma del almacén. Separa la forma, que rehace
  la escena, de lo encendido, que no la rehace.
- `escena.ts`: los worklets de cada cuadro.
- `Interfaz.tsx`: el texto y el panel de prueba.
- `plano.ts`, `musgo.ts` y `mundo.ts`: la geometría.

`galeria/src/` tiene estas piezas:

- `motor.js`: el motor WebGL, con la pasada del flum.
- `escena.js`: la escena, con los modos hoy y entrada, y la constelación que
  se corre con su pestaña.
- `entrada.js`: la entrada a la app.
- `util.js`: lo que comparten las secciones nuevas (textos, números, íconos y
  la hoja de abajo).
- `luna.js`: la luna de la comida, en SVG.
- `kcal.js`: las kcal del día en cuatro estilos para elegir (la luna, un anillo, un arco y una
  barra por comidas), en Inicio, el día de Comida y la semana.
- `datos.js`: la persona de mentira (perfil, pesadas, medidas, noches de Salud y lo que tiene en Ascent).
- `comida.js`: Comida, con el cuadro de día, semana y mes, y la hoja de
  registro con la ventana del alimento, la comida que se arma, la revisión, la
  etiqueta y el teclado.
- `inicio.js`: Inicio con sus bloques, personalizar, y los gráficos chicos.
- `mas.js`: la hoja del «+», con el peso y las medidas.
- `progreso.js`: Progreso, con la estrategia y las metas.
- `sueno.js`: Sueño.
- `perfil.js`: Perfil.
- `ascent.js`: Ascent, arriba de Hábitos, sin vincular y vinculada.
- `habitos.js`: Hábitos: el editor, «Tu mes» y los primeros hábitos.
- `galeria.js`: la página y las seis secciones, con el gesto de Ascent y el
  «+» en la barra.
