# Moss

App de comida para iPhone: trackear calorías y macros como MacroFactor, sin IA de
fotos, global y gratis. La comida es el centro; los hábitos y el cielo acompañan:
cada hábito es una estrella, los hábitos de cada día forman una constelación real
y el progreso es el cielo mismo. Expo SDK 58 + Supabase + Skia.

**Este archivo es lo único que se lee siempre.** Lo que está en `spec/` ya está
decidido y no se rediscute; lo marcado PENDIENTE se pregunta antes de asumir.
Para todo lo de Expo, leé también [`AGENTS.md`](AGENTS.md): Expo cambia en cada
SDK y la memoria no alcanza.

## Reglas de trabajo

- **Lo visual nuevo se aprueba primero en la galería**, con datos de mentira, y
  recién después se programa en la app.
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
- **La galería usa la lógica de la comida tal cual**: `construir.mjs` pasa a
  JavaScript `src/comida/buscar.ts`, `src/comida/porciones.ts` y
  `src/dominio/comidas.ts`, con los alimentos curados de `assets/alimentos.db`.
  Por eso esos tres no importan nada.
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
| `npm run app:capturas` | capturas de la app en la web: calidad, riqueza, toque, que se acuerde al recargar, día completo y universo |
| `npm run catalogo:verificar` | valida el catálogo y las distancias entre estrellas |
| `npx expo start` | Metro para la build `dev` del teléfono (Expo Go no sirve: Salud necesita build propia) |

Los escenarios de `herramientas/capturar-galeria.mjs` (`node
herramientas/capturar-galeria.mjs <carpeta> <escenarios…>`) son estos:

- `inicio` (las tres pestañas), `deslizar`;
- `tocar`, `completo`, `universo`;
- `ingles`, `baja`;
- `riqueza` (con la vía láctea), `fugaz`;
- `entrada`;
- `comida`, `registrar`, `etiqueta`, `comida-ingles`.

La galería abre en Inicio, y los escenarios del cielo pasan antes a Hábitos
(`window.__pagina(1, true)`). `deslizar` arrastra con el mouse, como un dedo,
y saca la foto con el dedo todavía abajo. El render por software es lento: para
mirar una animación cuadro a cuadro está la cámara lenta
(`window.__velocidad(0.3)`).

## La spec

| Archivo | Qué hay |
|---|---|
| [spec/especificacion.md](spec/especificacion.md) | el documento del producto, con los cambios del 21/10/2026 |
| [spec/plan.md](spec/plan.md) | las etapas hasta la v1 y en qué etapa estamos |
| [spec/decisiones.md](spec/decisiones.md) | decisiones: primero las pendientes |
| [spec/nutricion.md](spec/nutricion.md) | la comida, el centro de la app: la base de datos y los nombres, la búsqueda, los flujos de registro con sus toques, los escáneres, las metas |
| [spec/ascent.md](spec/ascent.md) | la conexión con Ascent, los cambios de su repo y lo que hace el usuario |
| [spec/widgets.md](spec/widgets.md) | los widgets |
| [spec/catalogo.md](spec/catalogo.md) | el catálogo por cantidad de estrellas, fuentes y licencias |

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/app/` | rutas de Expo Router (hoy, un solo cielo) |
| `src/dominio/` | las reglas, puras y con tests: fechas, luz y riqueza, hábitos, constelaciones por día, días, logros, semana, metas de comida (con los estilos, las metas a mano y repartir la semana), control semanal, la comida de cada hora y lo que se come (`registros.ts`: registros, recetas, propios, favoritos, agua y los atajos) |
| `src/almacen/` | el almacén local (SQLite en el teléfono, localStorage en la web), con los hábitos, las metas y lo que se come (y la canasta, que no sube), sus ganchos, los hábitos de ejemplo y la sincronización: `sincronizar.ts` (cuándo), `remoto.ts` (Supabase) y `mezclar.ts` (qué gana) |
| `supabase/moss/` | las migraciones del esquema `moss`, que se corren a mano en el SQL Editor |
| `src/comida/` | lo de la comida que usa la base de alimentos: el buscador (`buscar.ts`), con tests contra la base de verdad, cómo se leen las cantidades (`porciones.ts`: «2 rebanadas», «1½ tazas»), el lector de la tabla de una etiqueta (`etiqueta.ts`) y Open Food Facts por código de barras (`off.ts`) |
| `alimentos/` | los genéricos curados (`genericos.txt`): nombre en español y en inglés, de dónde salen en USDA, porciones y nombres de cada región |
| `assets/alimentos.db` | la base de alimentos que arma `npm run alimentos` (no se edita a mano) |
| `src/contenido/` | las frases del día |
| `src/cielo/` | el cielo en Skia (ver la lista de abajo) |
| `src/cielo/shaders/` | ruido y `crece()`, cielo fijo, aurora, estrellas que titilan y estrella fugaz |
| `src/datos/` | catálogo de constelaciones |
| `src/textos/` | el diccionario y `t()`: cielo, entrada, ajustes, comida, diagnóstico |
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
- `comida.js`: la comida. Tiene la pestaña Inicio, con el día, la semana y el
  mes, y la hoja de registro con la ventana del alimento, la comida que se arma,
  la revisión y el teclado.
- `galeria.js`: la página y las pestañas, con el gesto de Ascent.
