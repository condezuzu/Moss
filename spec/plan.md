# Plan hasta la versión 1

Cada etapa termina en algo que se puede mirar o probar: la galería o el teléfono.
Lo visual nuevo se aprueba primero en la galería y recién después se programa
(ver [`especificacion.md`](especificacion.md), "Cómo trabajamos").

Las etapas van en orden, con dos excepciones: el **contenido** (etapa 7) se puede
escribir desde ya, en paralelo con todo, y **Salud** (etapa 5) puede empezar
apenas esté el dominio (etapa 2).

## Etapa 0 · Cimientos — hecha (21/10/2026)

- Proyecto Expo SDK 58 (React Native 0.88, Nueva Arquitectura), solo iPhone,
  `uy.moss.app`, equipo `XF9N8X9KJG`, dueño de EAS `condeag`.
- Perfiles de EAS `dev`, `telefono`, `simulador` y `store`, como en Ascent.
- Diccionario es/en tipado ([`src/textos`](../src/textos)), tema
  ([`src/tema.ts`](../src/tema.ts)), cliente de Supabase con esquema `moss`
  ([`src/lib/supabase.ts`](../src/lib/supabase.ts)), permisos de Salud en los
  dos idiomas.
- Galería privada con el cielo. Los shaders viven en
  [`src/cielo/shaders`](../src/cielo/shaders) y los usan la galería y la app.
- Catálogo de constelaciones reales
  ([`src/datos/constelaciones.json`](../src/datos/constelaciones.json)).
- Recomendación de Supabase en [`decisiones.md`](decisiones.md) (D1, espera tu OK).

## Etapa 1 · El cielo nativo y la primera build en tu iPhone

1. **Lo tuyo, una sola vez:** registrar el iPhone (`npx eas-cli device:create`) y
   aceptar el login de EAS y de Apple en la primera build `dev`.
2. Pasar el motor de la galería a Skia, pieza por pieza:
   - **Fondo** (vía láctea y estrellas débiles): `RuntimeEffect` con
     `fondo.glsl`, dibujado una vez a una imagen fuera de pantalla que después
     solo se desplaza.
   - **Aurora**: `RuntimeEffect` con `aurora.glsl`, por cuadro y a resolución
     reducida.
   - **Estrellas, destellos y partículas**: `Atlas` (todas en una sola llamada).
   - **Líneas y figuras**: `Path` con recorte de inicio y fin (es el mismo
     "trazo que avanza" de la galería) y halo con `MaskFilter`.
   - **Musgo**: `Path` con el mismo ruido y los mismos cojines.
   - **Cámara**: `Gesture Handler` y `Reanimated`. Todo en el hilo de la
     interfaz, sin pasar por React en cada cuadro.
3. Calidad alta / media / baja: el valor de fábrica sale del modelo de iPhone
   (`expo-device`) más una medición de los primeros segundos.
4. Presupuesto: 60 cuadros por segundo en un iPhone 12 (120 en los ProMotion).
   El toque responde en el mismo cuadro y lo que se guarda va después.
5. Medir en el teléfono con un contador de cuadros, como el de Ascent.

**Sale:** el cielo de la galería corriendo en tu iPhone, con toque, deshacer y
día completo, todavía con datos de mentira.

## Etapa 2 · Dominio y datos en el teléfono

- **Hábito**: nombre, ícono, días de la semana, a mano o automático (dato de
  Salud y meta).
- **Constelación por día**: sale de la cantidad de hábitos de ese día y no se
  repite entre días (regla para cuando se agotan: D3). Cambiar la cantidad pasa
  el día a otra constelación; la anterior queda guardada en el cielo con todo
  su progreso.
- **Registro por día local**: el día corta a la medianoche de la zona del
  teléfono; si viajás, corta en tu hora.
- **Luz**: 3 por el primer hábito del día y 1 por cada uno más. Mitos por
  capítulos que se desbloquean con la luz de sus días; logros.
- **Local primero**: marcar se guarda en el teléfono al instante y funciona sin
  conexión.
- Tests del dominio: las dos semanas de la especificación (49 y 36), zonas
  horarias, viaje, cambio de hábitos a mitad de semana, deshacer.

**Sale:** la app guarda y recuerda, todavía sin cuentas.

## Etapa 3 · Cuentas y sincronización

- Proyecto de Supabase según D1, esquema `moss` y RLS en todas las tablas.
- Entrada según D2 (recomiendo arrancar sin registro y ofrecer guardar el cielo
  con Apple o con mail).
- Sign in with Apple nativo (`expo-apple-authentication` + `signInWithIdToken`)
  y mail con código.
- Sincronización: una cola local que sube a Supabase; si hay conflicto por el
  mismo hábito y día, gana el último cambio.
- Borrar la cuenta desde la app (Apple lo exige), revocando el token de Apple.

**Sale:** cambiar de teléfono no pierde nada.

## Etapa 4 · Crear y editar hábitos desde el cielo

- Sin listas: el editor se abre desde la estrella o desde un "+" en el cielo.
- Al cambiar la cantidad de un día, la constelación vieja se apaga y sube a tu
  cielo, y la nueva se arma.
- Primer uso: elegir de 3 a 5 hábitos sugeridos → primera constelación.

**Sale:** alguien nuevo arma su semana en menos de un minuto.

## Etapa 5 · Apple Health

- Permisos de a uno, recién cuando se activa cada hábito automático.
- Pasos, agua y mindfulness: la suma del día local.
- Sueño: duración, etapas (REM, núcleo, profundo), despierto y en cama, y una
  calidad de sueño calculada con una fórmula propia y escrita en la spec.
  Hábitos automáticos "dormir X horas" y "acostarse antes de X hora".
- Los datos de Salud quedan en el teléfono: a Supabase sube solo si el hábito
  se cumplió y el número que se muestra. Es más simple para la revisión de
  Apple y para la política de privacidad.
- El encendido automático usa la luz que sube del musgo (ya está en la galería).

**Sale:** hábitos que se cumplen solos, probados con los datos reales de tu
teléfono.

## Etapa 6 · Las zonas del cielo

Hoy, constelaciones y mitos (con el lector de capítulos), calendario (el mes en
mini cielos), estadísticas básicas y ajustes (calidad, idioma, cuenta). La zona
de amigos queda reservada para después de la v1. Cada zona pasa primero por la
galería.

**Sale:** la app completa, navegable de punta a punta.

## Etapa 7 · Contenido (en paralelo desde ya)

- Mitos por capítulos, en español e inglés, para las constelaciones del
  catálogo de la v1, con las fuentes antiguas citadas. Traducciones propias:
  nada copiado de traducciones modernas con derechos.
- Logros con nombres de dioses: lista y condiciones.
- Frases del día: estoicos (traducciones propias o de dominio público),
  fragmentos de los mitos, frases modernas cortas y atribuidas, y propias.
- Arte de las figuras: el mismo trazo dorado de la lira para todo el catálogo
  (propuesta en la galería, punto 4 de "Para decidir").

## Etapa 8 · Pulido y revisión de Apple

- Ícono, pantalla de arranque, accesibilidad (VoiceOver en las estrellas,
  Reducir movimiento, tamaño de texto), rendimiento en teléfonos viejos y uso
  sin conexión.
- Ficha de la tienda en dos idiomas, capturas, política de privacidad (con Salud
  explicada), etiquetas de privacidad y cuenta para la revisión.
- TestFlight y envío.

## Después de la v1

Amigos y todo lo social; la conexión con Ascent (D1 explica cómo); la
estimación del sueño sin reloj.
