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

**Dónde estamos (26/10/2026, tarde a la noche): la v1 entera, lista para la build
de la tienda.** Todo lo nativo compila en EAS (build de simulador `4cf64d0c`) y la
app está probada en la web. La tanda de esta noche sumó:
- **la conexión real con Ascent** (D27): el llavero compartido de las dos apps,
  vincular en dos toques o con la cuenta de Ascent, `moss-vincular` y
  `0008_vinculo.sql`, la sección vinculada con datos de verdad y lo que cambia en
  las otras secciones; sin el interruptor ([`ascent.md`](ascent.md));
- **los widgets**: el cielo en la pantalla de inicio (con «hecho») y la noche en la
  pantalla bloqueada para confirmarla, más una tarea de segundo plano
  ([`widgets.md`](widgets.md));
- **el sueño con menos esfuerzo**: las acciones de Atajos (alarma, cargador,
  enfoque Sueño) y el despertador de Moss con AlarmKit (D28,
  [`sueno-sin-esfuerzo.md`](sueno-sin-esfuerzo.md));
- **las actualizaciones por aire** (`expo-updates`, canales en CLAUDE.md), el
  manifiesto de privacidad, la protección de datos explícita y los textos de los
  permisos;
- **el calor**: el cielo y las animaciones se frenan del todo en reposo, en todas
  las calidades;
- **las notas del viernes**: la zona de toque de las estrellas, el globito, las
  estrellas de comida, el arranque con vida, menos información junta, la entrada
  con la estrella guía y Perfil con nombre, foto y editar;
- **la cuenta solo con Apple** y el sitio legal publicado en
  https://condezuzu.github.io/moss-app/ ([`revision.md`](revision.md)).

Antes de esta tanda:
- **La app tenía lo de la v1 menos los widgets**, con tests y probada en la web
  (`npm run app:capturas`).
  - La entrada: la frase, las dos diapositivas con la estrella guía, la cuenta
    solo con Apple (sin correo en la v1), el cuestionario con Salud primero, el
    resultado y los primeros hábitos.
  - Las seis secciones:
    - Inicio a tu medida;
    - Comida, con la hoja de registro, los escáneres y la foto de cada comida;
    - Progreso, con la estrategia y las metas;
    - Sueño;
    - Hábitos, con el editor y «Tu mes»;
    - Perfil, con exportar, borrar los datos y borrar la cuenta.
  - La hoja del «+» y Ascent arriba de Hábitos, sin vincular, con el rendimiento,
    los músculos y la marca posible bloqueados hasta la conexión.
  - Salud: los hábitos que se encienden solos, las noches y el peso.
  - **El sueño sin reloj** (22/10/2026, a la noche): cada mañana Moss estima la
    noche con los pasos, el movimiento y cuándo la usaste, y pregunta la hora si
    no está segura, junto a las caras. Falta probarlo en tu iPhone (el permiso
    del movimiento y el módulo nativo, `modules/movimiento`).
  - **Perfil › Aparatos**: los que escriben tu sueño, de cuál sale la noche y qué
    llega de cada marca; en Sueño, la precisión de cada noche.
  - Compartir recetas y alimentos propios con un enlace, y los recordatorios
    para anotar.
- **La noche del 22 al 23/10/2026** sumó, en la galería y en la app:
  - el plan de comidas: armar el día y la semana, «Comí esto», «Otra», me
    gusta y no me gusta, tus comidas y la lista de compras ([`nutricion.md`](nutricion.md));
  - pegar una receta como texto;
  - la ventana del alimento con los micronutrientes, cómo deja el día, de dónde
    sale el dato y reportar un error;
  - la seguridad: mayores de 18, sin déficit cuando corresponde, los límites con
    su porqué y los números ocultos;
  - los avisos: la hora de dormir, el de cada hábito y un máximo por día
    ([`avisos.md`](avisos.md));
  - la revisión de Apple: el sitio con la privacidad y los términos, borrar la
    cuenta revocando Sign in with Apple, los datos cifrados y fuera de iCloud, y
    la ficha ([`revision.md`](revision.md)).
- **El 26/10/2026** (lo que pediste después de probarla en el iPhone):
  - el lag: el cielo se frena detrás de las otras secciones y dibuja menos por
    cuadro; las animaciones salen rápido y nada va en cámara lenta;
  - registrar más rápido: decir o escribir la comida entera de una vez
    («Decir lo que comí», con el reconocimiento del iPhone, sin nube), tu comida
    de siempre en dos toques y «anotar todo junto» desde el buscador
    ([`registrar-rapido.md`](registrar-rapido.md), con cómo lo hacen las otras apps);
  - la porción de una unidad («1 galletita»), crudo o cocido arriba, el teclado
    que ya no tapa, los pasos que no saltan a 10 g, y el aviso de deshacer arriba
    y por poco tiempo; sin las frases de «Con esto llegas al…»;
  - qué comer antes y después de entrenar, en la comida que toca, con Perfil ›
    Entrenamiento ([`entreno.md`](entreno.md));
  - los avisos: el horario de comidas, pesarse y los hábitos con su aviso de
    fábrica; tocar un aviso abre lo suyo ([`avisos.md`](avisos.md)).
- **La base de alimentos**: USDA más 1.949 curados (313 platos como recetas y
  306 productos con su código de barras). 1.194 genéricos verificados con una
  segunda tabla oficial (TACO, Ciqual o CoFID), 112 platos por sus ingredientes
  y los productos por su etiqueta ([`fuentes.md`](fuentes.md)).
- **Lo que decidí solo** está en [`decisiones.md`](decisiones.md), «Tomadas por
  mi cuenta»; lo que espera tu respuesta, en «Pendientes» y en la galería.
- **Falta para mandarla** (la lista completa, en orden, en
  [`revision.md`](revision.md) «g»):
  - Supabase: correr `0001` a `0009` en el SQL Editor, exponer `moss`, el
    proveedor Apple, `moss://**`, y `npm run servidor:preparar` con la `.p8`;
  - la build de la tienda, la primera interactiva (los widgets suman un App
    Group y una extensión), y probarla en TestFlight;
  - las capturas para la tienda, el video de la vinculación y lo de App Store
    Connect;
  - Ascent 1.2.0 (la rama `moss-vinculo`), juntada con `build-8-nativo`.
- **Para después (por OTA):** que las constelaciones vuelvan a importar (la
  comida que enciende, el año como cielo, compartir); aplicar un toque del widget
  de un día anterior; el modo de bajo consumo; el flum entero al final de la
  entrada.

Las etapas van en orden, con estas excepciones:

- La **galería de la comida** (etapas 5 y 7) puede empezar ya, mientras termina
  la etapa 3: es lo que más importa aprobar.
- La **carga del catálogo uruguayo** (etapa 4) y el **contenido** (etapa 11) se
  pueden hacer en paralelo con todo: son datos y textos, sin pantallas.

## Etapa 0 · Cimientos — hecha (21/10/2026)

- Proyecto Expo SDK 58 (React Native 0.88, Nueva Arquitectura), solo iPhone,
  `uy.moss.app`, equipo `XF9N8X9KJG`, dueño de EAS `condeag`.
- Perfiles de EAS `dev`, `telefono`, `simulador` y `store`, como en Ascent. El proyecto de EAS es `@condeag/moss` (22/10/2026); los perfiles no llevan canal hasta que entren las actualizaciones por aire.
- Repo propio y privado: github.com/condezuzu/moss (22/10/2026).
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
  - La frase y las diapositivas no se saltean: la estrella guía hace su parte y
    recién ahí espera abajo; tocarla es seguir.
  - La entrada termina con un flum a Inicio.
- **La meta inicial**: la fórmula de [`nutricion.md`](nutricion.md), con tests.
- **Supabase**: el proyecto de Ascent, esquema `moss` y RLS en todas las tablas
  (D1 y [`ascent.md`](ascent.md)).
  - Las migraciones van en `supabase/moss/`.
  - Un chequeo impide tocar otro esquema.
  - Tus pasos en el panel de Supabase están en `ascent.md`.
- **Cuenta:** Sign in with Apple nativo (`expo-apple-authentication` +
  `signInWithIdToken`), una cuenta de Moss aparte de la de Ascent (D29).
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
- **Fibra, azúcares, grasas saturadas, sodio y alcohol** en la base, de USDA (se sumó el 22/10/2026, después de mirar las otras apps: [`nutricion.md`](nutricion.md), «Lo que tienen las otras apps»).
- **Las ~200 comidas uruguayas**, como recetas con ingredientes de la lista curada. El armado de la base calcula sus valores. La primera tanda, de 14, está desde el 22/10/2026: milanesa a la napolitana, chivito, pascualina, fainá, torta frita, capeletis a la caruso, buseca, postre chajá, Martín Fierro, choripán, polenta con tuco y alfajor de maicena, entre otros.
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
- **En el almacén** (hecho el 22/10/2026, sin pantallas todavía):
  - `src/dominio/registros.ts`: registros, recetas y comidas guardadas,
    alimentos propios, favoritos y agua, con lo planificado, copiar, confirmar,
    borrar con deshacer y los atajos (la última cantidad, lo que solés comer, los
    recientes y el premio del buscador);
  - el almacén, con la canasta que queda guardada en el teléfono;
  - `supabase/moss/0002_comida.sql`, con la misma sincronización de la etapa 3:
    gana lo más nuevo y un borrado llega como una marca;
  - los tests, y `npm run supabase:verificar` con dos teléfonos registrando,
    borrando y planificando.
- **Los atajos** 3 a 12. La lógica de casi todos ya está, con tests (`src/dominio/registros.ts` y el almacén, 22/10/2026); faltan las pantallas:
  - recetas y comidas guardadas (lógica hecha);
  - copiar una comida o un día (hecha);
  - favoritos y recientes (hecha);
  - varios alimentos de una vez y armar un plato (la canasta, hecha);
  - la última porción (hecha);
  - lo que solés comer a esa hora (hecha);
  - la carga rápida (hecha);
  - el dictado del teclado;
  - planificar días futuros (hecha, con confirmar al llegar el día).
- **La foto como recuerdo**, guardada en el teléfono (D10).
- **Medir en el iPhone** los toques y el tiempo de cada flujo. Lo de siempre entra en cinco toques, revisando antes de agregar.

**Sale:** registrar algo de siempre en cinco toques, revisado, y un día entero en
menos de un minuto.

## Etapa 6 · Escáneres y alimentos propios

- **Código de barras:** `expo-camera` y Open Food Facts, con lo escaneado guardado en el teléfono. El cliente ya está (`src/comida/off.ts`, 22/10/2026): la API 2 fija, el UPC-A de las dos formas, el sodio en mg, el alcohol en gramos y los avisos de 4/4/9 y de la porción.
- **Escáner de etiqueta:**
  - un módulo propio en Swift: Vision con `RecognizeDocumentsRequest` en iOS 26 y líneas de texto antes;
  - un lector de la tabla en TypeScript, con tests: hecho el 22/10/2026 (`src/comida/etiqueta.ts`), con las etiquetas del Mercosur, de Estados Unidos y europeas, en español, inglés y portugués, y los errores típicos del OCR;
  - la pantalla de revisión, primero en la galería (hecha el 22/10/2026, con el lector de verdad; falta tu aprobación).

  Se mide con 50 etiquetas uruguayas antes de darlo por bueno.
- **Alimentos propios:** a mano o desde la etiqueta, con su código de barras.
- **Compartir** recetas y alimentos propios con un enlace (D12).

**Sale:** escanear cualquier envase y, si no existe, crearlo desde la etiqueta en
menos de un minuto.

## Etapa 7 · Inicio, Comida, Progreso y el «+»

Desde el cambio 9 (22/10/2026) la pantalla de comida se repartió en secciones
([`especificacion.md`](especificacion.md), «Las secciones»;
[`progreso.md`](progreso.md)).

- **Primero en la galería** (hecho el 22/10/2026; falta tu aprobación):
  - **Inicio a tu medida:**
    - los bloques que se eligen y se ordenan;
    - lo que queda, grande, con la luna nueva;
    - los macros que brillan al cumplir y tiemblan al pasarse por mucho (`estadoDeMacro`, con tests).
  - **Comida:** el día, la semana y el mes.
  - **Progreso:**
    - el peso con su tendencia, las medidas y la grasa corporal como rango chico;
    - el gasto con el balance y el progreso al objetivo con su fecha;
    - la estrategia: el objetivo, las metas, el próximo control y su día.
  - **El «+»:** agregar comida, el peso, la carga rápida (con los recientes y las guardadas de un toque) y las medidas con su mini tutorial.
- **Ya programado, sin pantallas** (22/10/2026):
  - `src/dominio/cuerpo.ts`: la grasa de la Marina con su rango, la cintura sobre la altura y las últimas medidas;
  - `src/dominio/progreso.ts`: el ritmo, el progreso al objetivo y el balance;
  - en `control.ts`, el día del control y cómo viene el próximo;
  - en el almacén, `ponerEstrategia` y el control el día elegido;
  - las medidas del cuerpo, en el almacén y en Supabase (`0003_progreso.sql`), con su sincronización.
- **Antes, en la galería (21/10/2026):** la zona de comida por día, por semana y por mes, con lo que queda, los macros, el peso, el gasto, el último control y la luna.
- **Peso:** desde Salud y a mano. Siempre la tendencia.
- **Agua:** desde Salud y con un toque.
- **El control semanal automático:**
  - el cálculo ya está (`src/dominio/control.ts`);
  - ya corre solo en el almacén (22/10/2026), con las metas a mano;
  - falta su resumen en pantalla y el «cómo se calcula».
- **Metas en Ajustes**, primero en la galería (hecha el 22/10/2026, falta tu aprobación): quién las pone, cómo se reparten los macros y repartir la semana, con las cuentas de `src/dominio/metas.ts`.
- **Lo que se sumó después de mirar las otras apps** (22/10/2026), primero en la galería:
  - cómo se reparten los macros: equilibrada, baja en grasas, baja en carbohidratos y keto;
  - metas a mano;
  - repartir la semana, con los días altos que elijas;
  - fibra, azúcares, saturadas y sodio en el detalle del día, con la fibra contra una meta suave.
- **Widgets de la pantalla de bloqueo** con calorías y macros (`expo-widgets`). Primero una prueba en una build `dev`.

**Sale:** una semana entera: registrar, pesarse y ver cómo se ajusta la meta.

## Etapa 8 · Apple Health y Sueño

- **Permisos:** se piden juntos en la entrada, porque leer un tipo no pedido cierra la app. Cada hábito automático se activa recién cuando se crea.
- **Peso y agua:** ya entran en la etapa 7.
- **Pasos y mindfulness:** la suma del día local.
- **La sección de Sueño** ([`sueno.md`](sueno.md)):
  - en la galería desde el 22/10/2026, con cuatro semanas de mentira que incluyen una noche sin datos, una sin reloj, una cortada y una siesta;
  - las reglas, ya programadas con sus tests (`src/dominio/sueno.ts`): una sola fuente por noche, la noche del día en que te despertás (el día cambia a las 18), los episodios, el sueño partido y las siestas, lo que necesitás dormir, la calidad en tres partes, la deuda, el horario y la regularidad, y lo del reloj contra lo tuyo.
  - Falta:
    - leer Salud con consultas ancladas, con la fuente (`HKSourceRevision`), la zona de cada muestra y lo anotado a mano;
    - las noches en el teléfono, sin subir (Salud ya está en cada iPhone);
    - lo del reloj de noche (la frecuencia, la variabilidad SDNN y la respiración);
    - los hábitos «dormir X horas» y «dormirte antes de las X» (D19).
- **Qué sale del teléfono:** si el hábito se cumplió y el número que se muestra. Con Ascent vinculada, también el resumen del sueño y el peso.
- **Lo que pediste el 22/10/2026:**
  - **La deuda segunda** y **la pregunta de la mañana** con cinco caras: hechas en
    la galería y en la app (la pregunta, en la app, llega con las noches propias
    de abajo).
  - **Medir el sueño solo con el iPhone**, muy confiable y sin anillos ni
    relojes: investigar cómo lo hacen las apps que andan sin reloj, qué permite
    iOS y qué validan los estudios; proponer la combinación más confiable,
    calibrarla por persona, mostrar de dónde sale y qué tan seguro es cada dato,
    con una confirmación de un toque a la mañana («¿Dormiste de 00:30 a
    08:10?»), y probarla contra un reloj. Todo en [`sueno.md`](sueno.md), con
    fuentes.
    - **Investigado y elegido (22/10/2026):** sin permisos especiales, Moss arma
      la noche cada mañana con los pasos, el movimiento y cuándo usaste Moss, y
      pregunta solo si no está segura. Ver «Sin reloj» en [`sueno.md`](sueno.md).
  - **Las noches propias de Moss** (la cara, la hora confirmada o corregida y la
    estimación del iPhone), guardadas y sincronizadas: con el teléfono no se
    pierden al cambiarlo.
  - **Hecho el 22/10/2026 a la noche, en la galería y en la app:** la estimación
    (`src/dominio/sinReloj.ts`, con tests), la pregunta de la hora y las caras,
    la noche estimada con su rango, la precisión de cada noche, el orden de las
    fuentes por marca, el mismo sueño desde dos fuentes y Perfil › Aparatos.
    Falta: probarlo en el iPhone, la prueba contra un reloj (ver «Cómo probarlo»
    en [`sueno.md`](sueno.md)) y correr `0005_noches.sql` en Supabase.
  - **Relojes y anillos como beneficio:** la app anda bien solo con el teléfono
    y mejor con un aparato.
    - Niveles de precisión: solo el teléfono, el Apple Watch y los demás relojes y
      anillos (Oura, Whoop, Garmin, Fitbit, Samsung y otros).
    - Qué escribe cada marca en Apple Health y qué conexiones propias valen la
      pena; Apple Health primero, y las conexiones directas solo donde den algo
      que Salud no tiene.
    - Una sola fuente por noche, la más precisa, sin contar dos veces.
    - En Sueño, la fuente y la precisión de cada dato; en Perfil, «Aparatos», con
      lo que mejora cada uno.
    - **Investigado (22/10/2026):** en la v1, todo desde Salud y ninguna conexión
      directa; el orden de las fuentes, cómo se detecta el mismo sueño y los
      textos de cada marca están en [`aparatos.md`](aparatos.md).

**Sale:** hábitos que se cumplen solos, probados con los datos reales de tu
teléfono.

## Etapa 9 · Los hábitos

- **El editor:**
  - Sin listas: se abre desde la estrella o desde un «+» en el cielo.
  - Al cambiar la cantidad de un día, la constelación vieja se apaga y sube a tu cielo, y la nueva se arma.
- **El primer día**, apenas termina la entrada: elegir de 3 a 5 hábitos sugeridos, entre ellos los de comida, que arman la primera constelación.
- **Hábitos que se encienden solos** con la luz que sube del musgo (ya está en la galería):
  - **los de comida:** llegar a la proteína, registrar todas las comidas, quedar dentro de las calorías (ya se encienden solos en el almacén, desde el 22/10/2026);
  - **los de Salud.**

**Sale:** alguien nuevo arma su semana en menos de un minuto, y la comida
enciende estrellas.

## Etapa 10 · Las seis secciones y las zonas del cielo

**En la app desde el 22/10/2026**, para probarla en el iPhone: la tira con el gesto de Ascent (la
constelación se va con su página), la barra con el «+», la hoja del «+» y Ascent arriba de
Hábitos, sin vincular, con su gesto y su flecha. Desde esa noche están las seis secciones, y la
app abre en Inicio. En Hábitos, el calendario y las estadísticas son «Tu mes». Probado en la web
(`npm run app:capturas`); falta el iPhone.

- **Las secciones**, como se aprueben en la galería (cambio 9): Inicio, Comida y
  Progreso (etapa 7), el «+», Sueño (etapa 8), Hábitos (el cielo) y Perfil, con
  el gesto de Ascent (`nucleo/deslizar.ts`):
  - una tira con las seis pantallas, montadas una vez, que se corre entera, como
    Ascent después del titileo del 24/9;
  - el cielo de Skia quieto detrás, con la constelación corrida con su página y
    el velo de cada sección;
  - la barra con ícono y nombre, encendidos según dónde está la tira, y el «+» en el medio;
  - el universo un poco más arriba y más junto, para que el domingo no quede
    debajo de la barra (`HUECOS_DEL_UNIVERSO` en `plano.ts`, como en la galería).
- **Las zonas del cielo**, en Hábitos:
  - hoy;
  - constelaciones (tu cielo y el universo);
  - calendario (el mes en mini cielos);
  - estadísticas.
- **Ascent, arriba de Hábitos** (cambio 10): la sección, su gesto y su
  flecha. Sin vincular, las funciones vacías con «Vincular»; vinculada, lo de
  hoy, cuando entre la conexión (después de la v1). Armada en la galería el
  22/10/2026.
- **Perfil** (antes Ajustes): tus datos, calidad, idioma, unidades, Salud, cuenta, Ascent, exportar y borrar.

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
  - recordatorios suaves y opcionales para registrar, a la hora de siempre;
  - exportar todo en CSV (la lógica ya está: `src/dominio/exportar.ts`, 22/10/2026) y el país de los alimentos aparte del idioma, en Ajustes;
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

## Rendimiento y PRs (con las dos apps vinculadas; pedido el 22/10/2026)

Con el sueño y la comida de Moss y la carga, las series por músculo y las marcas
de Ascent:

1. **Rendimiento esperado hoy**, junto a la Recuperación: el sueño de anoche y
   de los últimos días, lo comido ayer y hoy (sobre todo los carbohidratos y las
   calorías) y la carga reciente.
2. **Días para buscar un PR:** Moss aprende en qué condiciones lograste tus marcas
   (sueño, comida, días de descanso de ese músculo, carga de la semana) y avisa
   cuando hoy se parece: «Buen día para intentar marca en sentadilla».
3. **Por músculo:** qué grupos están descansados y cuáles no, con las series por
   músculo de Ascent.

**Hecho el 22/10/2026 a la noche:** las cuentas (`src/dominio/rendimiento.ts` y
`musculos.ts`, con tests) y la galería, con Ascent vinculada (sección 7). En la
app, las tarjetas bloqueadas; se llenan con la conexión, que necesita leer las
series y las marcas de Ascent (ver [`rendimiento.md`](rendimiento.md), «Lo que
necesita de Ascent»).

Reglas: es una predicción, nunca una garantía; empieza con reglas generales
basadas en estudios y se vuelve personal con las semanas, mostrando cuánta
historia tiene y qué tan segura es. La fórmula y sus fuentes están en
[`rendimiento.md`](rendimiento.md) (22/10/2026). Se ve en Ascent antes de entrenar, junto a la
Recuperación, y en Moss en Sueño y en la sección de Ascent; sin vincular,
bloqueado con el botón para vincular. Las cuentas van en el dominio, con tests, y
la galería las muestra; los datos llegan con la conexión con Ascent.

## La próxima build (después de la 1.0, build 6)

Lo que necesita una build nueva, no una OTA (lo pediste el 28/10/2026):

- **Prender Ascent:** `CON_ASCENT = true` (D30), cuando Ascent 1.2.0 esté en la
  tienda, con la ficha y las notas para quien revisa de `revision.md` «f».
- **Los parches de Expo** que pide `npx expo-doctor` (por ejemplo `expo` 58.0.21,
  `@expo/ui` 58.0.25, `expo-camera` 58.0.14), con `npx expo install --fix`.
- **Las capturas en inglés:** en EN van ahora las cinco en español del usuario.

## Después de la aprobación de la 1.0 (lo pediste el 28/10/2026)

- **Recetas uruguayas, unas 100:** las de todos los días (guiso, tarta de
  verdura, milanesa con puré, ñoquis, torta frita, chivito, buseca…), cada una con
  sus ingredientes de la base curada y lo que rinde, para buscarlas como un
  alimento más.
- **El ayuno intermitente como hábito-estrella:** la ventana de comer (por
  ejemplo 16:8) es una estrella que se enciende si lo anotado del día cae
  adentro; sin rachas, como el resto.
- **El modo cocina:** una receta paso a paso, con la pantalla prendida y letras
  grandes, que al final anota la porción.

## Después de la v1

- **Importar recetas desde un link.**
- **La app para Apple Watch.**
- **Una Live Activity para registrar desde la isla, y Atajos y Siri.**
- **Todos los micronutrientes**, con qué alimento aporta cada uno.
- **Fotos de progreso.** Las medidas del cuerpo entraron en la v1 (cambio 9).
- **El índice de regularidad del sueño (SRI)**, la oxigenación, las alteraciones de la respiración y la temperatura de la muñeca ([`sueno.md`](sueno.md)).
- **Los pasos de Salud en el gasto**, para que se ajuste antes.
- **Los widgets de hábitos** (D8, [`widgets.md`](widgets.md)).
- **Escribir la comida en Salud.**
- **La conexión con Ascent** ([`ascent.md`](ascent.md)):
  - Lo que toca a la comida ya está definido: peso único, calorías según el día de entrenamiento y proteína post-entreno.
  - El lado de Moss va en este repo: el vínculo, las funciones cruzadas y la sección de Ascent arriba de Hábitos, con lo de hoy.
  - **Los cambios del repo de Ascent** se hacen en una sesión aparte sobre Ascent. La lista está en `ascent.md`, «Cambios en el repo de Ascent»:
    - base: altas, vistas públicas, peso y borrar;
    - app: Sign in with Apple, Stats, Ajustes, recuperación, estancamiento, resumen anual y enlaces;
    - infraestructura: SMTP, claves y plan.
- **Amigos y todo lo social**, con la lista de amigos de Ascent. Compartir pasa a mandarse también a un amigo, no solo con un enlace.
- **Las conexiones directas con los aparatos** ([`aparatos.md`](aparatos.md)):
  primero WHOOP, después Garmin; Oura, solo con su sí por escrito.
- **El Tiempo de uso para estimar la noche** (Family Controls, D26).
