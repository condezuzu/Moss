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

**Dónde estamos (22/10/2026, a la noche):**
- **La app tiene lo de la v1 menos los widgets**, con tests y probada en la web
  (`npm run app:capturas`). Falta probarla en tu iPhone.
  - La entrada: la frase, las dos diapositivas, la cuenta con Apple o correo, el
    cuestionario con Salud primero, el resultado y los primeros hábitos.
  - Las seis secciones:
    - Inicio a tu medida;
    - Comida, con la hoja de registro, los escáneres y la foto de cada comida;
    - Progreso, con la estrategia y las metas;
    - Sueño;
    - Hábitos, con el editor y «Tu mes»;
    - Perfil, con exportar, borrar los datos y borrar la cuenta.
  - La hoja del «+» y Ascent arriba de Hábitos, sin vincular.
  - Salud: los hábitos que se encienden solos, las noches y el peso.
  - Compartir recetas y alimentos propios con un enlace, y los recordatorios
    para anotar.
- **La base de alimentos**: USDA más 1.636 curados, entre ellos los genéricos,
  los del mundo, 136 de Uruguay (119 como recetas) y 306 productos con su código
  de barras.
- **Lo que decidí solo** está en [`decisiones.md`](decisiones.md), «Tomadas por
  mi cuenta»; lo que espera tu respuesta, en «Pendientes» y en la galería.
- **Falta para la v1:**
  - la build en tu iPhone, que necesita dos pasos tuyos, y probarla ahí;
  - correr `0004_medir.sql` en Supabase, con lo demás de [`ascent.md`](ascent.md);
  - los widgets de la pantalla de bloqueo (D8), después de la prueba de un día;
  - revocar el token de Apple al borrar la cuenta, que necesita la clave `.p8`;
  - el flum entero al final de la entrada (hoy, un fundido);
  - llegar a las ~200 comidas uruguayas y a los ~300 productos;
  - el contenido (logros, textos legales) y lo de la tienda (etapas 11 y 12).

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
- **La estimación del sueño sin reloj.**
