# Plan hasta la versión 1

Cada etapa termina en algo que se puede mirar o probar: la galería o el teléfono.
Lo visual nuevo se aprueba primero en la galería y recién después se programa
(ver [`especificacion.md`](especificacion.md), «Cómo trabajamos»).

**Dónde estamos (21/10/2026):** la etapa 1 está hecha en código y probada en la
web. Falta la primera build en tu iPhone, que necesita dos pasos tuyos. En la
galería, para aprobar:

- la entrada a la app;
- el flum;
- el cielo que crece;
- la estrella fugaz nueva.

Las etapas van en orden, con estas excepciones:

- El **contenido** (etapa 8) se puede escribir desde ya.
- **Salud** (etapa 5) empieza apenas esté el dominio (etapa 2).
- **Preparar la base de alimentos** (primera parte de la etapa 6) se puede hacer
  en cualquier momento: es trabajo de datos, sin pantallas.

## Etapa 0 · Cimientos — hecha (21/10/2026)

- Proyecto Expo SDK 58 (React Native 0.88, Nueva Arquitectura), solo iPhone,
  `uy.moss.app`, equipo `XF9N8X9KJG`, dueño de EAS `condeag`.
- Perfiles de EAS `dev`, `telefono`, `simulador` y `store`, como en Ascent.
- Diccionario es/en tipado ([`src/textos`](../src/textos)), tema
  ([`src/tema.ts`](../src/tema.ts)), cliente de Supabase con esquema `moss`
  ([`src/lib/supabase.ts`](../src/lib/supabase.ts)), permisos de Salud en los
  dos idiomas.
- Galería privada con el cielo y catálogo de constelaciones reales.

## Etapa 1 · El cielo nativo — hecha en código; falta tu iPhone

Hecho (21/10/2026):

- **El cielo de la galería en Skia**, en el hilo de la interfaz:
  - un pase de shader por cuadro (cielo fijo, aurora, estrellas que titilan,
    estrella fugaz);
  - dos Atlas con todas las luces;
  - las líneas;
  - el musgo;
  - la cámara con Gesture Handler y Reanimated.
- **Calidad alta, media o baja** según el modelo de iPhone, y baja un escalón
  sola si los primeros segundos van lentos.
  - Cambiarla ya no rehace la escena: antes el cielo quedaba negro.
- **Sin mitos:** sin figura ni tarjeta en el día completo. La constelación se
  conecta y la aurora sube. El nombre va chico.
- **El cielo que crece con la riqueza**, la estrella fugaz nueva y el panel de
  prueba (calidad, riqueza, estrella fugaz).
- **Probado en la web**, porque Skia en la web es CanvasKit, y los shaders
  compilados con CanvasKit en Node.

Falta:

1. **Lo tuyo, una sola vez:** registrar el iPhone (`npx eas-cli@latest
   device:create`) y aceptar el login de EAS y de Apple en la primera build
   `dev` (`npx eas-cli@latest build --profile dev --platform ios`).
2. **Medir en el teléfono con el contador de cuadros:**
   - el presupuesto es 60 cuadros por segundo en un iPhone 12 y 120 en los
     ProMotion;
   - el toque responde en el mismo cuadro.

**Sale:** el cielo de la galería corriendo en tu iPhone, con toque, deshacer y
día completo, todavía con datos de mentira.

## Etapa 2 · Dominio y datos en el teléfono

- **Hábito**: nombre, ícono, días de la semana, a mano o automático (Salud, y
  después Ascent y la comida) con su meta.
- **Constelación por día**
  - Sale de la cantidad de hábitos de ese día y no se repite entre días. La
    regla para cuando se agotan es D3.
  - Cambiar la cantidad pasa el día a otra constelación; la anterior queda
    guardada en el cielo con todo su progreso.
- **Registro por día local**: el día corta a la medianoche de la zona del
  teléfono; si viajás, corta en tu hora.
- **Luz y riqueza**
  - Luz: 3 por el primer hábito del día y 1 por cada uno más.
  - La riqueza sale de la luz juntada desde siempre, con la curva de
    `src/cielo/mundo.ts`.
  - El cielo crece de noche, con la animación al abrir (D5).
- **Logros**, con los nombres de D6. Cuentan días acumulados, nunca seguidos.
- **Local primero**: marcar se guarda en el teléfono al instante y funciona sin
  conexión.
- **Tests del dominio:**
  - las dos semanas de la especificación (49 y 36);
  - la curva de riqueza;
  - zonas horarias y viajes;
  - cambio de hábitos a mitad de semana;
  - deshacer.

**Sale:** la app guarda y recuerda, todavía sin cuentas.

## Etapa 3 · La entrada, las cuentas y la sincronización

- **La entrada**, tal como se apruebe en la galería:
  - la frase;
  - las dos diapositivas con su animación (Casiopea que se enciende sola y la
    luna que se llena);
  - la cuenta;
  - el cuestionario con Salud primero;
  - el resultado.

  Va en Reanimated y Skia, con el mismo cielo de fondo y la cámara que sube.
  - La frase y las diapositivas no se saltean durante 2,5 s.
  - La entrada termina con un flum al cielo de hoy.
- **La meta inicial**: la fórmula de [`nutricion.md`](nutricion.md), con tests.
- **Supabase**: el proyecto de Ascent, esquema `moss` y RLS en todas las tablas
  (D1 y [`ascent.md`](ascent.md)).
  - Las migraciones van en `supabase/moss/`.
  - Un chequeo impide tocar otro esquema.
  - Tus pasos en el panel de Supabase están en `ascent.md`.
- **Cuenta:** Sign in with Apple nativo (`expo-apple-authentication` +
  `signInWithIdToken`) y correo con contraseña, la misma cuenta que Ascent.
- **Sincronización**: una cola local que sube a Supabase. Si hay conflicto por el
  mismo hábito y día, gana el último cambio.
- **Borrar la cuenta y los datos**, como pide Apple:
  - «Borrar mis datos de Moss» deja la cuenta.
  - «Borrar la cuenta» avisa que también es la de Ascent.
  - Con Apple, se revoca su token.

**Sale:** alguien nuevo instala Moss, entra, contesta y llega a su cielo; cambiar
de teléfono no pierde nada.

## Etapa 4 · Crear y editar hábitos desde el cielo

- Sin listas: el editor se abre desde la estrella o desde un «+» en el cielo.
- Al cambiar la cantidad de un día, la constelación vieja se apaga y sube a tu
  cielo, y la nueva se arma.
- Primer día, apenas termina la entrada: elegir de 3 a 5 hábitos sugeridos, que
  arman la primera constelación.

**Sale:** alguien nuevo arma su semana en menos de un minuto.

## Etapa 5 · Apple Health

- Los permisos se piden juntos en la entrada (leer un tipo no pedido cierra la
  app). Cada hábito automático se activa recién cuando se crea.
- Pasos, agua y mindfulness: la suma del día local.
- **Sueño:**
  - duración, etapas (REM, núcleo, profundo), despierto y en cama;
  - una calidad de sueño con una fórmula propia y escrita en la spec;
  - hábitos automáticos «dormir X horas» y «acostarse antes de X hora».
- **Peso** (`BodyMass`) para la comida.
- **Qué sale del teléfono:** si el hábito se cumplió y el número que se muestra.
  Con Ascent vinculada, también el resumen del sueño y el peso.
- El encendido automático usa la luz que sube del musgo (ya está en la galería).

**Sale:** hábitos que se cumplen solos, probados con los datos reales de tu
teléfono.

## Etapa 6 · La comida

Lo que entra en la v1 está en D7 y el cómo en [`nutricion.md`](nutricion.md).

1. **La base de alimentos** (se puede adelantar):
   - un script que baja FNDDS y SR Legacy de USDA y arma una SQLite con
     porciones y los dos índices de búsqueda;
   - los 500 a 1.000 genéricos en español, con alias regionales revisados.
2. **El registro:**
   - buscador con sugerencias, porciones y gramos;
   - escáner (Open Food Facts) y crear producto desde la etiqueta;
   - historial, frecuentes y copiar una comida o un día;
   - carga manual.
3. **Las metas:** tendencia del peso, control semanal neutral al cumplimiento,
   con «cómo se calcula» a la vista.
4. **Los hábitos de comida**, que se encienden solos.
5. **La zona de la comida (la luna)**, primero en la galería.

**Sale:** registrar una comida en segundos y ver cómo se ajusta la meta en la
primera semana.

## Etapa 7 · Las zonas del cielo y el flum

- **Las zonas:**
  - hoy;
  - constelaciones (tu cielo y el universo);
  - comida;
  - calendario (el mes en mini cielos);
  - estadísticas, con las tarjetas de Ascent bloqueadas y su botón «Vincular»;
  - ajustes (calidad, idioma, Salud, cuenta y Ascent).

  La zona de amigos queda reservada para después de la v1. Cada zona pasa
  primero por la galería.
- **El flum** para ir de una sección a otra, como se apruebe en la galería:
  - un pase de Skia sobre todo el cielo (acercamiento con estelas radiales);
  - la interfaz con Reanimated;
  - dos vibraciones.

**Sale:** la app completa, navegable de punta a punta.

## Etapa 8 · Contenido (en paralelo desde ya)

- **Frases del día:**
  - estoicos, en traducciones propias o de dominio público;
  - frases modernas cortas y atribuidas, con la atribución verificada;
  - frases propias.

  Sin fragmentos de mitos.
- **Logros:** la lista final y sus condiciones (D6).
- **Los nombres de los alimentos en español** (etapa 6).
- **Textos legales:** términos, privacidad (con Salud y Ascent explicados) y la
  ficha de la tienda.

## Etapa 9 · Pulido y revisión de Apple

- **Pulido:**
  - ícono y pantalla de arranque;
  - accesibilidad: VoiceOver en las estrellas, Reducir movimiento (también en el
    flum y en la entrada) y tamaño de texto;
  - rendimiento en teléfonos viejos;
  - uso sin conexión.
- **Para la tienda:**
  - ficha en dos idiomas y capturas;
  - política de privacidad y etiquetas de privacidad;
  - cuenta para la revisión;
  - lo que pide Apple para salud y comida (ver `nutricion.md`).
- TestFlight y envío.

## Después de la v1

- **v1.1:**
  - los widgets (D8, [`widgets.md`](widgets.md));
  - recetas y foto de la comida;
  - escribir la comida en Salud (D7).
- **La conexión con Ascent** ([`ascent.md`](ascent.md)):
  - El lado de Moss va en este repo: el vínculo, las funciones cruzadas, las
    tarjetas bloqueadas y las cuatro funciones conectadas de Moss.
  - **Los cambios del repo de Ascent** se hacen en una sesión aparte sobre
    Ascent. La lista está en `ascent.md`, «Cambios en el repo de Ascent»:
    - base: altas, vistas públicas, peso y borrar;
    - app: Sign in with Apple, Stats, Ajustes, recuperación, estancamiento,
      resumen anual y enlaces;
    - infraestructura: SMTP, claves y plan.
- **Amigos y todo lo social**, con la lista de amigos de Ascent.
- **La estimación del sueño sin reloj.**
