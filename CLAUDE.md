# Moss

App de hábitos para iPhone: cada hábito es una estrella y los hábitos de cada día
forman una constelación real con su mito griego. Expo SDK 58 + Supabase + Skia.

**Este archivo es lo único que se lee siempre.** Lo que está en `spec/` ya está
decidido y no se rediscute; lo marcado PENDIENTE se pregunta antes de asumir.
Para todo lo de Expo, leé también [`AGENTS.md`](AGENTS.md): Expo cambia en cada
SDK y la memoria no alcanza.

## Reglas de trabajo

- **Lo visual nuevo se aprueba primero en la galería**, con datos de mentira, y
  recién después se programa en la app.
- **Todo el texto que se lee está en `src/textos/es.json` y `en.json`.** El
  inglés tiene que tener exactamente las mismas claves (lo comprueba `tsc`).
  Interfaz en **español neutro** (tú, nunca vos) e inglés; el código y los
  comentarios, en español.
- **Un solo juego de shaders**: `src/cielo/shaders/*.glsl` los usan la galería
  (WebGL) y la app (Skia). Se escriben en el GLSL que también acepta SkSL: sin
  `#define`, sin texturas, bucles con tope constante, sin uniforms adentro de las
  funciones.
- **El catálogo es uno**: `src/datos/constelaciones.json`. Se valida con
  `npm run catalogo:verificar`; fuentes y simplificaciones en `spec/catalogo.md`.
- **Marcar un hábito es instantáneo**: nada caro en el camino del toque. Lo
  espectacular va en el cielo y en las animaciones.
- Paquetes siempre con `npx expo install`.
- Comentá solo las líneas que tienen un porqué no obvio.
- Antes de dar algo por terminado: `npm run typecheck`, `npx expo-doctor` y
  `npx expo export --platform ios --output-dir <carpeta temporal>`. Si tocaste
  la galería: `npm run galeria`, `npm run galeria:capturas` con
  `npm run galeria:ver` prendido, y **mirá las capturas**.

## Dónde

| | |
|---|---|
| Galería privada | https://claude.ai/artifact/FcsCWWmMgfzmJ7G6eVSNYr — se republica con la herramienta Artifact desde `galeria/dist/index.html` (después de `npm run galeria`), pasando ese enlace como `url`: así queda en el mismo lugar |
| Rama | `cimientos` (sale de `master`) |
| App | `uy.moss.app` · equipo `XF9N8X9KJG` · EAS `condeag` |
| Supabase | PENDIENTE (D1 en `spec/decisiones.md`) |
| La otra app | Ascent: `C:\Users\agusc\ascent`, github.com/condezuzu/ascent |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | tipos (incluye que `en.json` tenga las claves de `es.json`) |
| `npm run galeria` | arma `galeria/dist/index.html` con los shaders, el catálogo y los textos de `src/` |
| `npm run galeria:ver` | sirve la galería en http://localhost:4173 |
| `npm run galeria:capturas` | capturas a 393×852 @2× en `capturas/galeria` (inicio, toque, día completo, universo) |
| `npm run catalogo:verificar` | valida el catálogo y las distancias entre estrellas |
| `npx expo start` | Metro para la build `dev` del teléfono (Expo Go no sirve: Salud necesita build propia) |

## La spec

| Archivo | Qué hay |
|---|---|
| [spec/especificacion.md](spec/especificacion.md) | el documento original del producto |
| [spec/plan.md](spec/plan.md) | las etapas hasta la v1 y en qué etapa estamos |
| [spec/decisiones.md](spec/decisiones.md) | decisiones: primero las pendientes |
| [spec/catalogo.md](spec/catalogo.md) | el catálogo por cantidad de estrellas, fuentes y licencias |

## Dónde está cada cosa

| Carpeta | Qué hay |
|---|---|
| `src/app/` | rutas de Expo Router (hoy, un solo cielo) |
| `src/cielo/shaders/` | fondo (vía láctea y estrellas), aurora y ruido |
| `src/datos/` | catálogo de constelaciones |
| `src/textos/` | el diccionario y `t()` |
| `src/lib/supabase.ts` | cliente, esquema `moss` |
| `galeria/` | la galería: `src/` (motor WebGL, escena, página) y `construir.mjs` |
| `herramientas/` | capturas y verificaciones |
