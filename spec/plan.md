# Plan hasta la versión 1

Cada etapa termina en algo que se puede mirar o probar: la galería o el teléfono.
Lo visual nuevo se aprueba primero en la galería y recién después se programa
(ver [`especificacion.md`](especificacion.md), «Cómo trabajamos»).

**Desde el 21/10/2026, la comida es el centro.** El plan se reordenó: después
de la entrada y las cuentas (etapa 3) vienen cuatro etapas de comida (4 a 7) y
recién después los hábitos, Salud y las zonas del cielo. Lo hecho no se tira:
- el cielo es el fondo de toda la app;
- el almacén y la sincronización sirven igual para la comida;
- las metas ya están programadas.

**Dónde estamos (21/10/2026):**
- **Hechas en código y probadas en la web:** las etapas 1 y 2, el cielo nativo y la app que guarda y recuerda.
- **De la etapa 3** está lo que no depende de la galería: el esquema de Supabase, la sincronización y la fórmula de las metas.
- **De la etapa 4** está la base de alimentos con USDA, 557 genéricos curados en español e inglés, y el buscador.
- **De las etapas 5 y 7** está la galería de la comida: la zona de comida, la línea del día y la hoja de registro, con la base y el buscador de verdad.
- **Falta:**
  - la primera build en tu iPhone, que necesita dos pasos tuyos;
  - aprobar en la galería la comida, las pestañas, la entrada a la app, el cielo que crece y la estrella fugaz nueva.

Las etapas van en orden, con estas excepciones:

- La **galería de la comida** (etapas 5 y 7) puede empezar ya, mientras termina
  la etapa 3: es lo que más importa aprobar.
- La **carga del catálogo uruguayo** (etapa 4) y el **contenido** (etapa 11) se
  pueden hacer en paralelo con todo: son datos y textos, sin pantallas.

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

## Etapa 2 · Dominio y datos en el teléfono — hecha en código (21/10/2026)

Hecho:

- **El dominio** en `src/dominio/`: fechas, luz y riqueza, hábitos,
  constelaciones por día, el resumen de cada día, logros y la semana.
  - Son funciones puras, sin nada del teléfono, con 42 tests (`npm test`).
- **El almacén** en `src/almacen/`.
  - Local primero: un toque se ve al instante y se guarda atrás, en orden.
  - En el teléfono guarda en SQLite (`moss.db`, con versiones del esquema); en
    la web, en localStorage.
- **El cielo lee del almacén**:
  - la constelación de hoy;
  - los hábitos y lo encendido;
  - tu semana;
  - la riqueza con la luz hasta ayer (D5).

  Cambia de día a la medianoche y al volver a la app.
- **Hábitos de ejemplo**: la primera vez se arman los de la galería, repartidos
  en la semana, hasta que exista el editor (etapa 9).
- **Probado en la web:** se toca una estrella, se recarga y sigue encendida.

Quedan para otras etapas:

- los valores de los hábitos automáticos (Salud, etapa 8);
- crear y editar hábitos desde la pantalla (etapa 9);
- dos etiquetas pueden pisarse cuando dos estrellas quedan muy juntas: es un
  arreglo visual, primero en la galería.

Lo pedido para esta etapa:

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

Hecho (21/10/2026), lo que no depende de la galería:

- **El esquema** en [`supabase/moss/0001_esquema.sql`](../supabase/moss/0001_esquema.sql):
  perfil, hábitos, constelaciones por día, marcas, días, logros, pesos y metas.
  - Todo en `moss`, con RLS en cada tabla.
  - En un conflicto la base se queda con el cambio más nuevo, y anota a qué hora
    llegó cada fila para que los teléfonos bajen solo lo nuevo.
  - `npm run supabase:verificar` lo prueba en un Postgres local (PGlite), sin
    tocar Supabase: 23 comprobaciones del SQL y 12 de la app de verdad
    sincronizando dos y tres teléfonos contra él. Uno de los teléfonos guarda
    con el SQLite del iPhone (`sqlite.ts`), sobre el SQLite que trae Node.
- **La sincronización** en `src/almacen/`: `sincronizar.ts`, `remoto.ts` y
  `mezclar.ts`.
  - El teléfono guarda primero y sube lo pendiente a los pocos segundos.
  - Al volver del fondo baja lo nuevo.
  - La primera vez en un teléfono baja todo antes de subir: así un teléfono
    nuevo recibe tus constelaciones en lugar de pisarlas.
  - Sin conexión no se pierde nada: se reintenta cada vez más espaciado.
  - Las reglas de cada conflicto están en `decisiones.md`.
  - Se conecta sola cuando hay sesión. Como todavía no hay pantalla de cuenta,
    hoy no arranca nunca.
- **La meta inicial y el control semanal** en `src/dominio/metas.ts` y
  `control.ts`, con 15 tests: la fórmula de [`nutricion.md`](nutricion.md), con
  los números de la galería.
- **El cuestionario ya tiene dónde guardarse**: el almacén guarda el perfil, el
  peso del día y la meta de arranque, y los sube.

Falta:

- La entrada, cuando la apruebes en la galería.
- Las pantallas de la cuenta (Apple y correo).
- Borrar la cuenta y los datos.
- **Cerrar sesión borra los datos del teléfono.** Si entra otra cuenta en un
  teléfono con datos de la anterior, la sincronización no arranca, para no
  mezclarlas.
- Tus pasos en Supabase (`ascent.md`, «Lo que tenés que hacer vos»).
- **Validar en cada pantalla los rangos del esquema** (peso de 20 a 400 kg,
  altura de 50 a 260 cm). Si una fila no los cumple, Supabase la rechaza, y esa
  tabla deja de subir hasta corregirla.

Lo pedido para esta etapa:

- **La entrada**, tal como se apruebe en la galería:
  - la frase;
  - las dos diapositivas con su animación (Casiopea que se enciende sola y la
    luna que se llena);
  - la cuenta;
  - el cuestionario con Salud primero;
  - el resultado.

  Va en Reanimated y Skia, con el mismo cielo de fondo y la cámara que sube.
  - La frase y las diapositivas no se saltean durante 2,5 s.
  - La entrada termina con un flum a Inicio.
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

## Etapa 4 · La base de alimentos — empezada (21/10/2026)

El cómo, en [`nutricion.md`](nutricion.md), «La base de datos».

Hecho:

- **`npm run alimentos`** arma `assets/alimentos.db` (5,9 MB):
  - USDA, FNDDS y SR Legacy, con los valores por 100 g y las porciones;
  - los genéricos curados de `alimentos/genericos.txt`;
  - los dos índices de búsqueda.
- **557 genéricos curados**, con nombre en español y en inglés, nombres de cada región con su país, y porciones en español.
- **El buscador** (`src/comida/buscar.ts`):
  - tolera errores;
  - pone primero el idioma de la app y el nombre de tu región;
  - tiene lugar para el premio por uso;
  - tiene 12 tests contra la base de verdad.
- **`npm run alimentos:verificar`**.

Falta:

- **Llegar a ~1.000 genéricos:** las formas cocidas, los platos del mundo que faltan y lo que se busque sin encontrar.
- **Las ~200 comidas uruguayas**, como recetas con ingredientes de la lista curada. El armado de la base calcula sus valores.
- **Los ~300 productos uruguayos:**
  - de Open Food Facts, los que están;
  - el resto, con fotos de etiquetas en un supermercado.
- **El catálogo uruguayo en Supabase** (`moss.catalogo`, solo lectura), que el teléfono baja y guarda. Ver D11.
- **El cliente de Open Food Facts:** buscar por código, validar y guardar.
- **El premio por uso**, con los registros de la etapa 5.

**Sale:** cualquier cosa que se coma en Uruguay, y lo común del mundo, se
encuentra en dos o tres letras.

## Etapa 5 · Registrar la comida — en la galería (21/10/2026)

El corazón de la app. Los flujos y sus toques están en
[`nutricion.md`](nutricion.md), «Registrar».

- **Primero en la galería** (hecho, falta tu aprobación):
  - la línea del día con las comidas;
  - la hoja de registro (buscador, sugerencias de la hora, recientes, favoritos);
  - la ficha del alimento con sus porciones;
  - el aviso de deshacer.

  La galería usa la base y el buscador de verdad, y cuenta los toques de cada
  registro. Lo que ya quedó programado y con tests:
  - `src/comida/porciones.ts`, que escribe las cantidades;
  - `src/dominio/comidas.ts`, que elige la comida por la hora.
- **En el almacén:**
  - registros, favoritos, recetas y comidas guardadas, y lo planificado;
  - con la misma sincronización de la etapa 3 y sus tests.
- **Los atajos** 3 a 12:
  - recetas y comidas guardadas;
  - copiar una comida o un día;
  - favoritos y recientes;
  - varios alimentos de una vez y armar un plato;
  - la última porción;
  - lo que solés comer a esa hora;
  - la carga rápida;
  - el dictado del teclado;
  - planificar días futuros.
- **La foto como recuerdo**, guardada en el teléfono (D10).
- **Medir en el iPhone** los toques y el tiempo de cada flujo. Lo de siempre entra en cinco toques, revisando antes de agregar.

**Sale:** registrar algo de siempre en cinco toques, revisado, y un día entero en
menos de un minuto.

## Etapa 6 · Escáneres y alimentos propios

- **Código de barras:** `expo-camera` y Open Food Facts, con lo escaneado guardado en el teléfono.
- **Escáner de etiqueta:**
  - un módulo propio en Swift: Vision con `RecognizeDocumentsRequest` en iOS 26 y líneas de texto antes;
  - un lector de la tabla en TypeScript, con tests;
  - la pantalla de revisión, primero en la galería.

  Se mide con 50 etiquetas uruguayas antes de darlo por bueno.
- **Alimentos propios:** a mano o desde la etiqueta, con su código de barras.
- **Compartir** recetas y alimentos propios con un enlace (D12).

**Sale:** escanear cualquier envase y, si no existe, crearlo desde la etiqueta en
menos de un minuto.

## Etapa 7 · La pantalla de comida y las metas

- **Primero en la galería:** la zona de comida, por día, por semana y por mes (hecha el 21/10/2026, falta tu aprobación).
  - Las calorías que quedan, grande.
  - Las barras de los macros.
  - La tendencia del peso y el gasto estimado.
  - El agua.
  - El resumen del último control.
  - La propuesta es la luna.
- **Peso:** desde Salud y a mano. Siempre la tendencia.
- **Agua:** desde Salud y con un toque.
- **El control semanal automático:**
  - el cálculo ya está (`src/dominio/control.ts`);
  - falta que corra solo, su resumen y el «cómo se calcula».
- **Widgets de la pantalla de bloqueo** con calorías y macros (`expo-widgets`). Primero una prueba en una build `dev`.

**Sale:** una semana entera: registrar, pesarse y ver cómo se ajusta la meta.

## Etapa 8 · Apple Health

- **Permisos:** se piden juntos en la entrada, porque leer un tipo no pedido cierra la app. Cada hábito automático se activa recién cuando se crea.
- **Peso y agua:** ya entran en la etapa 7.
- **Pasos y mindfulness:** la suma del día local.
- **Sueño:**
  - duración, etapas (REM, núcleo, profundo), despierto y en cama;
  - una calidad de sueño con una fórmula propia y escrita en la spec;
  - hábitos automáticos «dormir X horas» y «acostarse antes de X hora».
- **Qué sale del teléfono:** si el hábito se cumplió y el número que se muestra. Con Ascent vinculada, también el resumen del sueño y el peso.

**Sale:** hábitos que se cumplen solos, probados con los datos reales de tu
teléfono.

## Etapa 9 · Los hábitos

- **El editor:**
  - Sin listas: se abre desde la estrella o desde un «+» en el cielo.
  - Al cambiar la cantidad de un día, la constelación vieja se apaga y sube a tu cielo, y la nueva se arma.
- **El primer día**, apenas termina la entrada: elegir de 3 a 5 hábitos sugeridos, entre ellos los de comida, que arman la primera constelación.
- **Hábitos que se encienden solos** con la luz que sube del musgo (ya está en la galería):
  - **los de comida:** llegar a la proteína, registrar todas las comidas, quedar dentro de las calorías;
  - **los de Salud.**

**Sale:** alguien nuevo arma su semana en menos de un minuto, y la comida
enciende estrellas.

## Etapa 10 · Las pestañas y las zonas del cielo

- **Las pestañas**, como se aprueben en la galería (D14): Inicio (la comida, de
  la etapa 7), Hábitos (el cielo) y Ajustes, con el gesto de Ascent
  (`nucleo/deslizar.ts`):
  - una tira con las tres pantallas, montadas una vez, que se corre entera, como
    Ascent después del titileo del 24/9;
  - el cielo de Skia quieto detrás, con la constelación corrida con su pestaña y
    el velo de cada pestaña;
  - la barra de texto, con el nombre encendido según dónde está la tira;
  - el universo un poco más arriba y más junto, para que el domingo no quede
    debajo de la barra (`HUECOS_DEL_UNIVERSO` en `plano.ts`, como en la galería).
- **Las zonas del cielo**, en Hábitos:
  - hoy;
  - constelaciones (tu cielo y el universo);
  - calendario (el mes en mini cielos);
  - estadísticas, con las tarjetas de Ascent bloqueadas y su botón «Vincular».
- **Ajustes:** calidad, idioma, unidades, Salud, cuenta y Ascent.

  La zona de amigos queda reservada para después de la v1. Cada pantalla pasa
  primero por la galería.
- **El flum** del final de la entrada:
  - un pase de Skia sobre todo el cielo (acercamiento con estelas radiales);
  - la interfaz con Reanimated;
  - dos vibraciones.

**Sale:** la app completa, navegable de punta a punta.

## Etapa 11 · Contenido (en paralelo desde ya)

- **Frases del día:**
  - estoicos, en traducciones propias o de dominio público;
  - frases modernas cortas y atribuidas, con la atribución verificada;
  - frases propias.

  Sin fragmentos de mitos.
- **Logros:** la lista final y sus condiciones (D6).
- **Textos legales:**
  - términos;
  - privacidad, con Salud, Ascent y Open Food Facts explicados;
  - la ficha de la tienda.

## Etapa 12 · Pulido y revisión de Apple

- **Pulido:**
  - ícono y pantalla de arranque;
  - accesibilidad: VoiceOver en las estrellas y en el registro, Reducir
    movimiento (también en el flum y en la entrada) y tamaño de texto;
  - rendimiento en teléfonos viejos;
  - uso sin conexión.
- **Para la tienda:**
  - ficha en dos idiomas y capturas;
  - política de privacidad y etiquetas de privacidad;
  - cuenta para la revisión;
  - lo que pide Apple para salud y comida (ver `nutricion.md`).
- TestFlight y envío.

## Después de la v1

- **Importar recetas desde un link.**
- **La app para Apple Watch.**
- **Los widgets de hábitos** (D8, [`widgets.md`](widgets.md)).
- **Escribir la comida en Salud.**
- **La conexión con Ascent** ([`ascent.md`](ascent.md)):
  - Lo que toca a la comida ya está definido: peso único, calorías según el día de entrenamiento y proteína post-entreno.
  - El lado de Moss va en este repo: el vínculo, las funciones cruzadas, las tarjetas bloqueadas y las funciones conectadas.
  - **Los cambios del repo de Ascent** se hacen en una sesión aparte sobre Ascent. La lista está en `ascent.md`, «Cambios en el repo de Ascent»:
    - base: altas, vistas públicas, peso y borrar;
    - app: Sign in with Apple, Stats, Ajustes, recuperación, estancamiento, resumen anual y enlaces;
    - infraestructura: SMTP, claves y plan.
- **Amigos y todo lo social**, con la lista de amigos de Ascent. Compartir pasa a mandarse también a un amigo, no solo con un enlace.
- **La estimación del sueño sin reloj.**
