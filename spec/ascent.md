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
  - Para que no pase, la pantalla de cuenta de la entrada dice «¿Ya usas Ascent?
    Entra con la misma cuenta».
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
| `moss.ascent_dia(fecha)` | `public.logs` y `public.sesiones`: entrenó o descansó, volumen (`bloques`), series, duración, días seguidos | Moss: gimnasio automático, calorías y proteína del día, recuperación |
| `moss.pesos_compartidos(desde)` | `moss.pesos` y `public.weights` juntos | Moss (tendencia) y Ascent (DOTS, Stats › Peso) |
| `moss.recuperacion(fecha)` | sueño y comida de Moss, más entrenamiento de Ascent | las dos |
| `moss.semanas_para_ascent(desde)` | por semana: sueño promedio, proteína promedio por día y balance por día | las dos: «Por qué no subís» |
| `moss.objetivo()` | objetivo y ritmo de Moss | Ascent: qué espera de la fuerza |
| `moss.anio(anio)` y `moss.ascent_anio(anio)` | totales del año de cada app | el resumen anual, en las dos |
| `moss.amigos()` | `public.friendships`, respetando `son_amigos()` y `bloqueos` | Moss, cuando tenga social |

### Cada función conectada

1. **Recuperación**
   - Un puntaje de 0 a 100, con una fórmula escrita y a la vista:
     - **Sueño, 40:** 20 × lo dormido anoche contra lo que necesitás (hasta
       1), más 20 × la calidad de la noche de Moss sobre 100.
     - **Carga, 40:** r es el volumen de los 3 días anteriores sobre 3 veces el
       promedio diario de las 4 semanas anteriores. Da 40 × (1,5 − r), entre 0
       y 40, menos 5 por cada día seguido entrenando después del segundo.
     - **Comida, 20:** 10 × la proteína de ayer contra la meta (hasta 1), más
       10 × las calorías de ayer contra el 80 % de la meta (hasta 1).
   - **Qué conviene:** «fuerte» de 70 para arriba, «normal» de 45 a 69 y
     «suave» debajo de 45.
   - Va en Ascent antes de entrenar, y en Moss en su sección (arriba de
     Hábitos) y arriba en Sueño.
   - Es orientativo y lo dice: Apple pide mostrar el método detrás de cualquier
     número de salud (regla 1.4.1).
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
   - Muestra la tabla y la oración, y aclara que compara semanas: no es una
     causa segura. Como el aviso de Ascent, describe y no receta.
3. **Resumen anual:** una pantalla «Tu año» en cada app, con lo de las dos.
4. **Peso único**
   - Cada app escribe en su tabla: Ascent en `public.weights` (con sus funciones
     de siempre) y Moss en `moss.pesos` (a mano o desde Salud).
   - Vinculadas, las dos leen la unión: por día gana el último registro.
   - No hay copias ni sincronización, y desvincular separa todo solo.
5. **Calorías según el día**
   - El total de la semana lo fija el control semanal y no cambia: los días de
     entrenamiento suben y los de descanso bajan lo mismo, repartido.
   - El reparto sale de cuántos días entrenó en las últimas 4 semanas.
   - Si a la mañana Ascent todavía no anotó el día, Moss muestra la meta de
     descanso. Cuando llega el registro, la sube y avisa: «Hoy entrenaste: +250
     kcal».
6. **Objetivo compartido:** en definición, Ascent relaja el umbral de
   estancamiento y no espera marcas; en volumen, espera progreso.
7. **Login y amigos**
   - Es la misma cuenta.
   - La lista de amigos es `public.friendships` de Ascent: Moss la lee y no
     tiene otra.
8. **Proteína post-entreno:** si el volumen de la sesión supera el promedio de
   las del usuario, ese día suben 0,3 g por kilo, hasta 40 g más. Salen de los
   carbohidratos que sumó el día de gimnasio: las calorías quedan como las dejó
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
  - «Vincular con Ascent», «¿No tienes Ascent?» (la App Store) y que es la misma
    cuenta.
  - Después, «Solo con las dos» (recuperación, por qué no subís y tu año) y
    «Andan solas, mejor conectadas» (las otras seis).
  - Cada una muestra vacío lo que va a mostrar, con un candado chico.
- **Vinculada:**
  - la sesión de hoy en Ascent y lo que le suma a la meta de la comida;
  - la recuperación, con sus tres partes y cómo se calcula;
  - por qué no subís, con la tabla y la oración;
  - tu año;
  - las seis que andan solas, con lo de hoy.
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
12. **Texto de borrar la cuenta**: decir que es la misma cuenta que Moss.

### Infraestructura (las hacés vos en el panel)

13. **Correo:** SMTP propio (Resend), el correo de contraseña con el nombre de
    las dos apps y `moss://**` en las redirecciones.
14. **Claves:** pasar a las claves nuevas de Supabase, que ya estaba pendiente.
15. **Plan:** pasar a Pro para tener copias diarias. Lo recomiendo.

## Lo que tenés que hacer vos

Nada de esto frena lo que sigue ahora (la build del cielo en tu iPhone). Cada
cosa va cuando llegue su etapa del [plan](plan.md).

**En Supabase**, proyecto `okeanaihymbvbdmrdqph`, para la etapa de cuentas:

1. SQL Editor: correr, en orden, cada uno entero y una sola vez:
   - `supabase/moss/0001_esquema.sql`;
   - `supabase/moss/0002_comida.sql` (lo que se come, desde el 22/10/2026);
   - `supabase/moss/0003_progreso.sql` (la estrategia y las medidas del cuerpo, desde el 22/10/2026).
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
