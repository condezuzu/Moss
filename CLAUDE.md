# Moss

App de hábitos y comida para iPhone. Cada hábito es una estrella y los hábitos de
cada día forman una constelación real. El progreso es el cielo mismo, que se vuelve
más rico con la luz juntada. Expo SDK 58 + Supabase + Skia.

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
- **Worklets**: el plugin captura lo que usa cada worklet al definirlo. Lo que
  usa una función tiene que estar definido antes que ella. Por eso `paso()` va
  última en `escena.ts`.
- **Los gestos del cielo van solo sobre el lienzo**, nunca sobre la interfaz: si
  no, un toque en un botón enciende también la estrella de abajo.
- **El catálogo es uno**: `src/datos/constelaciones.json`. Se valida con
  `npm run catalogo:verificar`; fuentes y simplificaciones en `spec/catalogo.md`.
- **Marcar un hábito es instantáneo**: nada caro en el camino del toque. Lo
  espectacular va en el cielo y en las animaciones.
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
| `npm run typecheck` | tipos (incluye que `en.json` tenga las claves de `es.json`) |
| `npx expo lint` | ESLint con la configuración de Expo, que incluye las reglas de React |
| `npm run galeria` | arma `galeria/dist/index.html` con los shaders, el catálogo y los textos de `src/` |
| `npm run galeria:ver` | sirve la galería en http://localhost:4173 |
| `npm run galeria:capturas` | capturas a 393×852 @2× en `capturas/galeria` (ver los escenarios abajo) |
| `npm run shaders:verificar` | compila los shaders con CanvasKit y deja vistas previas con riqueza 0, 0,6 y 1 en `capturas/shaders` |
| `npm run web:exportar` + `npm run web:ver` | la app de verdad en la web (Skia es CanvasKit) en http://localhost:4174 |
| `npm run app:capturas` | capturas de la app en la web: calidad, riqueza, toque, que se acuerde al recargar, día completo y universo |
| `npm run catalogo:verificar` | valida el catálogo y las distancias entre estrellas |
| `npx expo start` | Metro para la build `dev` del teléfono (Expo Go no sirve: Salud necesita build propia) |

Los escenarios de `herramientas/capturar-galeria.mjs` (`node
herramientas/capturar-galeria.mjs <carpeta> <escenarios…>`) son estos:

- `inicio`, `tocar`, `completo`, `universo`;
- `ingles`, `baja`;
- `riqueza`, `fugaz`;
- `entrada`, `flum`.

El render por software es lento. Por eso la galería tiene cámara lenta
(`window.__velocidad(0.3)`), y `flum` la usa.

## La spec

| Archivo | Qué hay |
|---|---|
| [spec/especificacion.md](spec/especificacion.md) | el documento del producto, con los cambios del 21/10/2026 |
| [spec/plan.md](spec/plan.md) | las etapas hasta la v1 y en qué etapa estamos |
| [spec/decisiones.md](spec/decisiones.md) | decisiones: primero las pendientes |
| [spec/nutricion.md](spec/nutricion.md) | la comida: bases de datos, nombres en español, búsqueda, metas |
| [spec/ascent.md](spec/ascent.md) | la conexión con Ascent, los cambios de su repo y lo que hace el usuario |
| [spec/widgets.md](spec/widgets.md) | los widgets |
| [spec/catalogo.md](spec/catalogo.md) | el catálogo por cantidad de estrellas, fuentes y licencias |

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/app/` | rutas de Expo Router (hoy, un solo cielo) |
| `src/dominio/` | las reglas, puras y con tests: fechas, luz y riqueza, hábitos, constelaciones por día, días, logros, semana, metas de comida y control semanal |
| `src/almacen/` | el almacén local (SQLite en el teléfono, localStorage en la web), sus ganchos, los hábitos de ejemplo y la sincronización: `sincronizar.ts` (cuándo), `remoto.ts` (Supabase) y `mezclar.ts` (qué gana) |
| `supabase/moss/` | las migraciones del esquema `moss`, que se corren a mano en el SQL Editor |
| `src/contenido/` | las frases del día |
| `src/cielo/` | el cielo en Skia (ver la lista de abajo) |
| `src/cielo/shaders/` | ruido y `crece()`, cielo fijo, aurora, estrellas que titilan y estrella fugaz |
| `src/datos/` | catálogo de constelaciones |
| `src/textos/` | el diccionario y `t()`: cielo, entrada, ajustes, diagnóstico |
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
- `escena.js`: la escena, con los modos hoy, entrada y ajustes.
- `entrada.js`: la entrada a la app.
- `galeria.js`: la página.
