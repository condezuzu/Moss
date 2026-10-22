# Moss y Ascent: cómo se conectan

La parte de producto está en [`especificacion.md`](especificacion.md), «Conexión
con Ascent». Acá está cómo se resuelve: dónde viven los datos, qué es una cuenta,
qué es vincular, qué lee cada app de la otra, qué cambia en el repo de Ascent y
qué tenés que hacer vos.

Se armó con una lectura completa del repo de Ascent (`C:\Users\agusc\ascent`, el
21/10/2026, versión del esquema 94). No se abrió ningún `.env` ni secreto.

## La decisión: el mismo proyecto de Supabase, con un esquema propio

Moss usa el proyecto de Supabase de Ascent (`okeanaihymbvbdmrdqph`). Todas sus
tablas y funciones van en un esquema **`moss`**. Moss nunca crea nada en
`public`, que es de Ascent.

Antes había recomendado un proyecto aparte (D1). Cambié porque ahora el pedido es
**una sola cuenta, una sola lista de amigos, un solo peso** y funciones que cruzan
los datos de las dos apps:

- **Con dos proyectos**, cada una de esas cosas necesita un puente:
  - un proveedor OAuth entre proyectos, que Supabase no documenta;
  - sincronizar pesos, con conflictos;
  - copiar amigos;
  - llamar de un proyecto al otro con claves de servicio.
- **Con uno solo**, son consultas dentro de la misma base, con la misma cuenta y
  con RLS.

Los riesgos que había anotado tienen arreglo, y está más abajo, en «Lo que hay
que cuidar».

## Una cuenta

- Las dos apps usan el mismo `auth.users`. La misma cuenta entra en las dos.
- **Métodos:**
  - **Correo y contraseña**, como Ascent hoy: las mismas credenciales andan en
    las dos apps.
  - **Sign in with Apple**, en las dos apps. Apple le da el mismo identificador
    a una persona en todas las apps de un mismo equipo (`XF9N8X9KJG`). Si
    `uy.moss.app` y `uy.ascent.app` están como Client IDs del proveedor Apple
    del proyecto, el mismo Apple ID cae en la misma cuenta.
  - **Google no.** Obligaría a Sign in with Apple por la regla 4.8 de Apple, y
    Ascent lo sacó el 15/9.
- **Si alguien termina con dos cuentas** (por ejemplo, entró a Moss con Apple
  ocultando el correo y a Ascent con su correo):
  - Puede sumar la otra forma de entrar a una de las dos cuentas: Supabase lo
    llama *manual identity linking* (`linkIdentity`), y va en Ajustes › Cuenta.
  - Fusionar dos cuentas que ya tienen datos no es automático: es un caso de
    soporte.
  - Desde el 22/10/2026, la entrada de Moss no nombra a Ascent (Moss es Moss),
    así que dos cuentas es más probable. Vincular tiene que andar igual y rápido
    (ver «Vincular en menos de 10 segundos»).
- **Para más adelante:** «Continuar como… (tu cuenta de Ascent)» en un toque.
  - Usa un grupo de llavero compartido entre las dos apps (`keychain-access-groups`,
    mismo equipo) y una función que emite una sesión nueva para Moss
    (`generateLink` más `verifyOtp`).
  - Nunca se comparte el token de refresco: Supabase lo rota, y la otra app
    quedaría deslogueada.

## Vincular es dar permiso, no unir cuentas

Como la cuenta es la misma, «vincular» quiere decir: **la persona acepta que las
dos apps compartan sus datos**. Hace falta igual, porque Moss guarda sueño y
comida, y Apple pide consentimiento para compartir datos de salud (reglas 5.1.2
y 5.1.3).

- Una fila en `moss.vinculo` (usuario, desde, desde qué app) y tres funciones que
  llaman las dos apps:
  - `moss.estado_del_vinculo()` devuelve si están vinculadas, si esta cuenta ya
    usó Ascent (tiene perfil con nombre de usuario) y si ya usó Moss.
  - `moss.vincular()` y `moss.desvincular()`.
- **El botón «Vincular»** está en las tarjetas bloqueadas y en Ajustes:
  1. Si la otra app no está instalada, abre su página en la App Store. Para
     saberlo, cada app declara el esquema de la otra en
     `LSApplicationQueriesSchemes` y prueba `canOpenURL`.
  2. Si está instalada y esta cuenta ya la usó, muestra qué se comparte y un
     botón para aceptar. Con eso quedan desbloqueadas las dos.
  3. Si está instalada pero esta cuenta nunca la usó, muestra «Entra a Ascent con
     esta misma cuenta» y abre `ascent://vincular` (o `moss://vincular` desde
     Ascent). Allá se ve el mismo permiso.
- **Desvincular** está en Ajustes de cada app. Los datos quedan en cada app y se
  deja de leer lo de la otra.
- **La regla:** toda lectura cruzada pasa por funciones `security definer` del
  esquema `moss`. Cada función revisa `auth.uid()` y el vínculo. Ninguna app lee
  las tablas de la otra directo.

## Qué lee cada app de la otra (con el vínculo)

| Función | De dónde sale | La usa |
|---|---|---|
| `moss.ascent_dia(fecha)` | `public.logs` y `public.sesiones`: entrenó o descansó, las series, el peso movido (la suma del peso de cada serie de `bloques`, como lo cuenta Ascent), los minutos y los días seguidos | Moss: gimnasio automático, calorías y proteína del día, recuperación |
| `moss.pesos_compartidos(desde)` | `moss.pesos` y `public.weights` juntos | Moss (tendencia) y Ascent (DOTS, Stats › Peso) |
| `moss.recuperacion(fecha)` | sueño y comida de Moss, más entrenamiento de Ascent | las dos |
| `moss.semanas_para_ascent(desde)` | por semana: sueño promedio, proteína promedio por día y balance por día | las dos: «Por qué no subís» |
| `moss.objetivo()` | objetivo y ritmo de Moss | Ascent: qué espera de la fuerza |
| `moss.anio(anio)` y `moss.ascent_anio(anio)` | totales del año de cada app | el resumen anual, en las dos |
| `moss.amigos()` | `public.friendships`, respetando `son_amigos()` y `bloqueos` | Moss, cuando tenga social |

### Cada función conectada

Las cuentas de Moss están en `src/dominio/entrenamiento.ts`, con sus tests; la
galería las usa tal cual. Las funciones de Supabase que comparten un número con
Ascent (la recuperación) hacen la misma cuenta.

1. **Recuperación**
   - Un puntaje de 0 a 100, con una fórmula escrita y a la vista:
     - **Sueño, 40:** 20 × lo dormido anoche contra lo que necesitás (hasta
       1), más 20 × la calidad de la noche sobre 100. La calidad es la del
       reloj, la que dijiste a la mañana (las cinco caras de Sueño, de 1 a 5
       llevadas a 0, 25, 50, 75 y 100) o el promedio de las dos. Sin ninguna, la
       duración vale los 40 (22/10/2026): antes, sin reloj, nunca se pasaba de
       20.
     - **Carga, 40:** r es el peso movido de los 3 días anteriores sobre 3
       veces el promedio diario de las 4 semanas anteriores. Da 40 × (1,5 − r),
       entre 0 y 40, menos 5 por cada día seguido entrenando después del
       segundo.
     - **Comida, 20:** 10 × la proteína de ayer contra la meta (hasta 1), más
       10 × las calorías de ayer contra el 80 % de la meta (hasta 1).
   - **Qué conviene:** «fuerte» de 70 para arriba, «normal» de 45 a 69 y
     «suave» debajo de 45.
   - Va en Ascent antes de entrenar, y en Moss en su sección (arriba de
     Hábitos) y arriba en Sueño.
   - Es orientativo y lo dice: Apple pide mostrar el método detrás de cualquier
     número de salud (regla 1.4.1).
   - **Debajo, el rendimiento esperado de hoy, los músculos y la marca posible**
     (lo pediste el 22/10/2026). Es otra cuenta, en % respecto de lo tuyo y por
     ejercicio: la fórmula, sus estudios y lo que se podría ajustar en la recuperación
     están en [`rendimiento.md`](rendimiento.md).
2. **Por qué no subís**
   - Ascent ya detecta el estancamiento (`detectar()` en
     `nucleo/estancamiento.ts`).
   - Vinculada, compara las semanas con mejores marcas contra las otras: sueño,
     proteína y calorías.
   - Elige la diferencia más grande y la escribe en una oración. Por ejemplo:
     «tus mejores marcas llegan las semanas que dormís 7 h o más y llegás a la
     proteína».
   - Compara el sueño promedio, la proteína promedio por día y el balance por
     día. Cada diferencia se mide en su escala: 45 minutos de sueño, 15 g de
     proteína o 250 kcal de balance cuentan lo mismo.
   - **Solo habla con datos suficientes:** 3 semanas con marcas y 3 sin, cada
     una con al menos 4 días de comida y 4 noches de sueño registrados. Si
     faltan, dice que todavía está juntando información y cuántas van de cada
     lado.
   - Solo cuenta la diferencia que va para el lado malo: dormir menos, menos
     proteína o más déficit. Si la más grande llega a una escala entera, es la
     **causa probable**; si no, dice que no hay una diferencia clara y que la
     causa probable está en otro lado.
   - Muestra la tabla y la oración, y aclara que es una causa probable, no
     segura: compara semanas. Como el aviso de Ascent, describe y no receta.
3. **Resumen anual:** una pantalla «Tu año» en cada app, con lo de las dos.
4. **Peso único**
   - Cada app escribe en su tabla: Ascent en `public.weights` (con sus funciones
     de siempre) y Moss en `moss.pesos` (a mano o desde Salud).
   - Vinculadas, las dos leen la unión: por día gana el último registro.
   - No hay copias ni sincronización, y desvincular separa todo solo.
5. **Calorías según el día**
   - El control semanal ya cuenta el entrenamiento de siempre en el gasto: no se
     suma nada, se reparte. La semana del control (de su día a los 6
     siguientes) suma lo mismo que da el control: 7 veces su meta.
   - Un día de gimnasio tiene lo que cuesta una sesión más que uno de
     descanso. Es el costo **neto**: el gasto total de esa hora menos lo que se
     gasta igual en reposo, que el día de descanso ya incluye. El Compendio de
     Actividades Físicas de 2024 le da a la fuerza de 3,5 a 6 MET: se toman 5 en
     total, menos el 1 del reposo, y quedan 4 kcal por kilo y por hora, con la
     duración promedio de sus sesiones, de a 10 kcal, entre 100 y 500.
   - Los días se resuelven en orden, y cada uno se lleva su parte de lo que
     queda de la semana:
     - lo que ya pasó se sabe (entrenó o no);
     - hoy cuenta como entrenado cuando Ascent anota la sesión: a la mañana es de
       descanso y, cuando llega el registro, sube;
     - lo que viene se espera según qué tan seguido entrena ese día de la
       semana (las 4 semanas anteriores).
   - Si entrena más o menos que de costumbre, los días que quedan se acomodan y
     el último cierra la cuenta exacta.
   - Se mueven los carbohidratos; la proteína y las grasas quedan. Ningún día
     baja del piso de calorías ni de lo que piden la proteína y las grasas: solo
     ahí la semana puede pasarse.
6. **Objetivo compartido:** en definición, Ascent relaja el umbral de
   estancamiento y no espera marcas; en volumen, espera progreso.
7. **Login y amigos**
   - Es la misma cuenta.
   - La lista de amigos es `public.friendships` de Ascent: Moss la lee y no
     tiene otra.
8. **Proteína post-entreno** (la fórmula que propuse el 22/10, D24)
   - Depende del tamaño de la sesión en Ascent: las series y el peso movido,
     cada uno contra el promedio de sus sesiones de las 4 semanas anteriores, y
     la media de los dos. 1 es una sesión de las de siempre.
   - La proteína del día sube hacia 2,2 g por kilo, el techo útil: el punto de
     quiebre de Morton y otros (2018) está en 1,62 g por kilo, y 2,2 es el
     límite de arriba de su estimación.
   - Una sesión de la mitad de lo de siempre o menos no suma; una de las de
     siempre suma la mitad de lo que falta hasta el techo; una un 50 % más
     grande, todo. De a 5 g y hasta 40 g. Después de entrenar todo el cuerpo, más
     proteína da más síntesis muscular (Macnaughton y otros, 2016; Trommelen y
     otros, 2023).
   - Sale de los carbohidratos del día: las calorías quedan como las dejó
     «Calorías según el día».
9. **Gimnasio automático**
   - Un hábito automático más, como los de Salud, con fuente «Ascent»: se
     enciende cuando `moss.ascent_dia(hoy)` dice que entrenó.
   - Se revisa al abrir la app. Sube del musgo con la misma luz que los de Salud.

### La sección de Ascent en Moss

Está arriba de Hábitos (cambio 10 de la especificación) y es lo único de Moss que
es de las dos apps. En la galería, sección 7.

- **Cómo se llega:**
  - En Hábitos, una flecha muy tenue abajo, sobre el musgo y debajo de la frase,
    apunta para arriba.
  - Deslizar para arriba sube la sección desde el musgo, siguiendo al dedo.
    Cambia con un quinto de la pantalla o con un tirón, como las pestañas.
  - El gesto solo arranca arriba de la barra de pestañas: nunca en el borde de
    abajo, que es del gesto de inicio del iPhone. Tocar la flecha también abre
    la sección.
  - Se vuelve deslizando para abajo desde arriba de todo, con la flecha de
    arriba o tocando Hábitos.
  - Arrastrar el cielo para abajo sigue llevando a tu universo.
  - También se llega desde Perfil y desde la recuperación en Sueño.
- **Cómo se ve:**
  - Con los colores de Ascent (su fondo casi negro, su azul gris y su crema),
    esquinas vivas y una línea arriba de cada parte en vez de cajas.
  - Arriba, el planeta de Ascent con su órbita abierta, como en su ícono, y la
    luna de Moss: sin vincular queda afuera de la órbita, y al vincular entra.
- **Sin vincular:**
  - Arriba, «Si usas Ascent», «Vincular con Ascent» y «¿No tienes Ascent?» (la
    App Store). Vincular es dar permiso, y lo dice.
  - Después, «Solo con las dos»: la recuperación con el rendimiento y los
    músculos, por qué no subís y tu año.
  - Cada una muestra vacío lo que va a mostrar, con un candado chico.
  - Lo que anda solo y mejora con las dos apps está al final de Perfil, en
    «Información adicional» (lo pediste el 22/10/2026).
- **Vinculada:**
  - la sesión de hoy en Ascent y lo que le suma a la meta de la comida;
  - la recuperación, con sus tres partes y cómo se calcula;
  - debajo, el rendimiento esperado, los músculos y, si da, la marca posible
    ([`rendimiento.md`](rendimiento.md));
  - por qué no subís, con la tabla y la oración;
  - tu año.
- **La recuperación también vive en Sueño**, arriba, con el vínculo: cruza justo
  el sueño con el entrenamiento.

En Ascent van en Stats (ver la lista de cambios).

## Lo que hay que cuidar (y cómo)

1. **Altas de Moss.** Hoy cada alta crea un perfil de Ascent (trigger
   `on_auth_user_created`).
   - Cambio en Ascent: crear el perfil solo cuando el alta viene de Ascent, o al
     entrar por primera vez a Ascent.
   - Las vistas públicas (`usuarios_publicos`, ranking, buscar amigos) dejan
     afuera perfiles sin nombre de usuario.
2. **Borrar la cuenta**
   - `eliminar_cuenta()` borra `auth.users`, y eso borra todo. Está bien, porque
     la cuenta es una sola, pero las dos apps lo tienen que decir: «Tu cuenta es
     la misma en Moss y en Ascent: borrarla borra los datos de las dos».
   - Además, cada app ofrece «Borrar mis datos de Moss» (o «de Ascent») sin
     borrar la cuenta.
   - Con Sign in with Apple, al borrar la cuenta hay que revocar el token de
     Apple. Va en una función del servidor con la clave de Apple.
3. **Las pruebas de Ascent.** `retrato_del_schema()` y `npm run test:conexion`
   marcan lo que sobra en `public`. Moss no toca `public`, así que no saltan.
4. **Funciones de Ascent con efectos.**
   - `fijar_zona` tiene un antitrampas que puede frenar el registro 20 horas.
   - `pantalla_inicio` aplica pérdidas de racha.
   - **Moss nunca llama funciones de Ascent:** lee sus tablas desde funciones
     propias.
5. **Notificaciones.** `mandar_push` manda a todos los `tokens_push` del usuario
   con el título «Ascent». Moss tiene su propia tabla `moss.tokens_push` y no
   toca la de Ascent.
6. **Correos y Auth compartidos**
   - En las direcciones de redirección se suma `moss://**`.
   - El correo de restablecer la contraseña tiene que nombrar a las dos apps.
     Cada app pide su propio `redirectTo`.
   - El SMTP de fábrica manda 2 correos por hora: antes de lanzar hace falta un
     SMTP propio. Ascent ya usa Resend para otra cosa.
7. **Migraciones**
   - Las de Moss viven en el repo de Moss (`supabase/moss/*.sql`) y solo tocan
     el esquema `moss`.
   - Un chequeo en Moss rechaza cualquier sentencia sobre otro esquema que no
     sea una lectura dentro de una función `security definer`.
   - Se aplican a mano en el SQL Editor, como las de Ascent.
8. **Copias de seguridad.** El plan gratis no tiene, y una base con dos apps
   publicadas pesa más si se rompe. Recomiendo Pro (25 dólares por mes) antes de
   lanzar Moss.
9. **Claves.** Las claves viejas de Supabase dejan de andar a fin de 2026. Moss
   arranca con la clave publicable nueva, y Ascent tiene ese cambio pendiente.

## Cambios en el repo de Ascent

Para la sesión aparte sobre Ascent.

### Base (migraciones de Ascent, porque tocan `public` y `auth`)

1. **Perfil solo para altas de Ascent**
   - El trigger mira `raw_user_meta_data->>'app'`.
   - Una función crea el perfil al entrar por primera vez a Ascent con una
     cuenta que vino de Moss.
2. **Vistas públicas:** `usuarios_publicos`, ranking y búsqueda de amigos dejan
   afuera a quien no tiene nombre de usuario.
3. **Peso**
   - `peso_actual()`, el DOTS y Stats › Peso leen `moss.pesos_compartidos()`
     cuando hay vínculo.
   - Ascent sigue escribiendo solo en `public.weights`.
4. **Borrar:** `borrar_datos_de_ascent()` borra lo de Ascent y deja la cuenta;
   `eliminar_cuenta()` queda igual, con el texto nuevo.

### App (`movil/`)

Necesita una build nativa nueva: va en una rama, como siempre que cambia
`app.json`.

5. **Sign in with Apple** con `expo-apple-authentication` y `signInWithIdToken`,
   junto a correo y contraseña. Es la misma pantalla `movil/src/Login.tsx`.
6. **Stats › General** (`movil/src/StatsGeneral.tsx`): las tarjetas bloqueadas
   después de Peso y Pasos:
   - Recuperación.
   - Por qué no subís, con datos de Moss.
   - Tu año con Moss.

   Cada una con «Vincular», o «Conseguir Moss» si no está instalada.
7. **Ajustes › Perfil**, después de `<Salud />` (`movil/src/Ajustes.tsx`): una
   fila «Moss» con vincular o desvincular y qué se comparte.
8. **Recuperación antes de entrenar**, en inicio o al empezar la sesión: «Hoy
   conviene ir fuerte» o «suave».
9. **Estancamiento:** `nucleo/estancamiento.ts` suma la causa probable cuando hay
   vínculo, y el umbral se ajusta al objetivo de Moss.
10. **Resumen anual** con lo de Moss.
11. **Esquemas y enlaces:**
    - `LSApplicationQueriesSchemes: ["moss"]` en `app.json`.
    - La ruta `ascent://vincular`.
12. **Texto de borrar la cuenta:** que avise que la cuenta se borra en
    cualquier app donde se entre con ella, como en Moss.
13. **El peso movido, con las repeticiones** (pedido el 22/10/2026): hoy
    `kilosDelBloque` (`nucleo/volumen.ts`) suma el peso de cada serie, sin las
    repeticiones. Debería contar peso × repeticiones cuando las repeticiones
    están anotadas (migración 94), y el peso solo cuando no. Mientras tanto, Moss
    compara cada sesión contra el promedio de las del mismo usuario, así que la
    forma de contar no cambia el resultado.
14. **El rendimiento antes de entrenar** (pedido el 22/10/2026), junto a la
    recuperación: el rendimiento esperado, los músculos de lo que vas a entrenar
    y, si da, «Buen día para intentar marca» ([`rendimiento.md`](rendimiento.md)).
15. **«Lo intenté y no salió»** junto a «¿Lo guardo como marca?»: sin los
    intentos fallidos, Moss solo aprende de los días buenos.
16. **Una marca opcional de «serie al fallo»**, para la fatiga de cada músculo.

### Infraestructura (las hacés vos en el panel)

17. **Correo:** SMTP propio (Resend), el correo de contraseña con el nombre de
    las dos apps y `moss://**` en las redirecciones.
18. **Claves:** pasar a las claves nuevas de Supabase, que ya estaba pendiente.
19. **Plan:** pasar a Pro para tener copias diarias. Lo recomiendo.

## Lo que tenés que hacer vos

Nada de esto frena lo que sigue ahora (la build del cielo en tu iPhone). Cada
cosa va cuando llegue su etapa del [plan](plan.md).

**En Supabase**, proyecto `okeanaihymbvbdmrdqph`, para la etapa de cuentas:

1. SQL Editor: correr, en orden, cada uno entero y una sola vez:
   - `supabase/moss/0001_esquema.sql`;
   - `supabase/moss/0002_comida.sql` (lo que se come, desde el 22/10/2026);
   - `supabase/moss/0003_progreso.sql` (la estrategia y las medidas del cuerpo, desde el 22/10/2026);
   - `supabase/moss/0004_medir.sql` (cómo se mide lo comido, el catálogo en el servidor y la semana repartida);
   - `supabase/moss/0005_noches.sql` (las noches propias: la cara y la hora confirmada o corregida).
   - Ya están escritos y probados con `npm run supabase:verificar`.
   - Solo crean cosas en el esquema `moss`: no tocan nada de Ascent.
   - Conviene correrlos cuando estén las pantallas de la cuenta. Así, si cambia
     algo antes, no hace falta una migración.
2. Settings › Data API › *Exposed schemas*: sumar `moss`. Va después del paso 1,
   porque el esquema tiene que existir.
3. Authentication › URL Configuration › *Redirect URLs*: sumar `moss://**`.
4. Authentication › Sign In / Providers › **Apple**: activarlo y poner en
   *Client IDs* `uy.moss.app`. Cuando Ascent tenga Apple, sumar `uy.ascent.app`.
   Para el inicio nativo en iPhone alcanza con los identificadores.
5. Authentication › Sign In / Providers: activar *Allow manual linking*.
6. Antes de lanzar:
   - plan Pro (Settings › Billing);
   - SMTP propio (Authentication › Emails › SMTP Settings);
   - el texto del correo de contraseña.

**En Apple Developer**, equipo `XF9N8X9KJG`:

1. Nada a mano para la build: la primera `eas build` interactiva registra
   `uy.moss.app` y sus capacidades (Sign in with Apple, HealthKit y, para los
   widgets, App Groups). Solo hay que iniciar sesión cuando lo pida.
2. Keys › nueva clave con «Sign in with Apple»: es para revocar el token al
   borrar una cuenta. Se descarga una sola vez (`.p8`). Te digo dónde guardarla
   cuando lleguemos.

**En EAS:** las variables `EXPO_PUBLIC_SUPABASE_URL` y la clave publicable para
el proyecto de Moss, con `eas env:create` o en el panel. Te paso los comandos
cuando haya sesión de EAS.
