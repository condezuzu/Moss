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

- Una fila en `moss.vinculo` (la cuenta de Moss, la de Ascent, desde cuándo y
  desde qué app) y dos funciones que llaman las dos apps:
  - `moss.estado_del_vinculo()` devuelve si está vinculada, el usuario de Ascent
    y desde cuándo.
  - `moss.desvincular()`.
  - Vincular no es una función que llame la app: pasa por `moss-vincular`, que
    revisa las dos sesiones (ver «Vincular en menos de 10 segundos»).
- **El botón «Vincular»** está en las tarjetas bloqueadas y en Ajustes (lo que
  sigue era con la misma cuenta; desde D27, el flujo es el de más abajo):
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

## Vincular en menos de 10 segundos (D27, aceptada el 22/10/2026)

Lo pediste así: que vincular se haga en menos de 10 segundos. Con la entrada de
Moss sin nombrar a Ascent (Moss es Moss), mucha gente va a tener dos cuentas:
una de Ascent con su correo y otra de Moss con Apple. El flujo de arriba, en ese
caso, no llega: pide entrar a Ascent con la cuenta de Moss.

**La propuesta: vincular junta tu Moss con tu Ascent, sea la misma cuenta o no.**
Las dos apps son del mismo equipo de Apple (`XF9N8X9KJG`), así que pueden
compartir un lugar del llavero que ninguna otra app puede leer
(`keychain-access-groups`).

1. **Ascent deja en el llavero compartido quién sos:** su sesión (un token que
   vence en una hora) y tu nombre de usuario, cada vez que entra o renueva la
   sesión. Al cerrar sesión, lo borra.
2. **En Moss, «Vincular con Ascent»** (un toque):
   - si Ascent dejó la sesión, Moss muestra una hoja: «@usuario · Ascent en este
     iPhone», qué comparte cada app y «Vincular»;
   - si Ascent no está instalada, «Conseguir Ascent» (la App Store);
   - si está pero sin sesión, «Abre Ascent y vuelve»: Ascent, al entrar, deja la
     sesión, y Moss la ve al volver.
3. **«Vincular»** (el segundo toque): una función propia de Moss en el servidor
   (`moss-vincular`, una Edge Function) recibe las dos sesiones, revisa las dos
   con Supabase y guarda el vínculo entre las dos cuentas. La luna entra en la
   órbita y se desbloquea todo, en las dos apps.

**Cuánto tarda:** dos toques y nada que escribir, de 3 a 5 segundos. Si Ascent
estaba sin sesión, abrirla suma unos 5 más: sigue debajo de 10. Desde Ascent es lo
mismo al revés, con la sesión de Moss en el llavero.

**Lo que cambia:**
- `moss.vinculo` guarda las dos cuentas (la de Moss y la de Ascent; pueden ser
  la misma) y las funciones que leen lo de Ascent usan la de Ascent del vínculo,
  no `auth.uid()`.
- Nadie puede vincular algo ajeno: hacen falta las dos sesiones vivas, y solo las
  apps del equipo leen el llavero compartido. No se usan enlaces `ascent://`
  con un código: otra app podría registrar el mismo esquema y quedarse con él.
- Desvincular sigue en Ajustes de cada app y borra el vínculo de las dos.
- **En Ascent:** dejar la sesión en el llavero compartido al entrar y al renovar,
  borrarla al salir, y su lado de la hoja (ver «Cambios en el repo de Ascent»).
- **En Moss:** `expo-secure-store` con el grupo de llavero, el entitlement en
  `app.json` y la Edge Function. Va en la v1 (26/10/2026).
- **Sin interruptor** (26/10/2026): la sección, su gesto, su flecha y lo de
  Ascent en Perfil se ven siempre. El llavero va en `src/lib/llavero.ts` (Moss
  deja su sesión al entrar y al renovarla, y la saca al salir y al borrar la
  cuenta), la hoja de vincular en `src/secciones/ascent/` (con la sesión de
  Ascent, «Abre Ascent y vuelve», «Conseguir Ascent» y, abajo y chico, entrar
  con la cuenta de Ascent, que no se guarda) y lo que llega de Ascent, guardado
  en el teléfono, en `src/almacen/ascent.ts`.

**Lo que quedó en el servidor (26/10/2026):**

- **`moss.vinculo`** ([`0008_vinculo.sql`](../supabase/moss/0008_vinculo.sql)):
  `moss` (la cuenta de Moss, clave), `ascent` (la de Ascent, única), `desde` y
  `origen` (`moss` o `ascent`: desde qué app se vinculó).
  - Puede ser la misma cuenta en las dos columnas.
  - Cada cuenta está en un solo vínculo: vincular de nuevo borra los anteriores
    de las dos cuentas, de cualquier lado.
  - RLS: cada cuenta ve la fila donde está, de un lado o del otro. Nadie la
    escribe directo; se borra con `moss.desvincular()`, y sola al borrar
    cualquiera de las dos cuentas.
  - No se sincroniza con el teléfono: se pregunta.
- **`moss.vincular_cuentas(cuenta_moss, cuenta_ascent, origen)`**: la llama solo
  la clave de servicio. Exige que la cuenta de Ascent tenga nombre de usuario (si
  no, `sin_ascent`), borra los vínculos anteriores, guarda y devuelve
  `{ nombre }`.
- **`moss-vincular`** ([su README](../supabase/functions/moss-vincular/README.md)),
  la Edge Function. El contrato, que usan las dos apps:
  - `POST /functions/v1/moss-vincular` con `Authorization: Bearer <la sesión de
    la app que llama>` y `{ "otra": "<la sesión de la otra app>", "desde":
    "moss" | "ascent" }`.
  - Con `desde: "moss"`, la cuenta de Moss es la de `Authorization`; con
    `"ascent"`, la de `otra`.
  - Revisa las dos sesiones con Auth, a la vez, y llama a
    `moss.vincular_cuentas`.
  - Responde `200 { ok, nombre }`, o `sin_sesion` (401), `vencida` (401: la
    sesión de la otra app), `sin_ascent` (409), `pedido` (400),
    `configuracion` o `interno`.
- **`moss.estado_del_vinculo()`** y **`moss.desvincular()`**, desde cualquiera de
  las dos apps. «Borrar mis datos de Moss» no desvincula: el permiso se quita
  desde Perfil.
- **Las lecturas para Moss** (ver la tabla de abajo): `moss.ascent_sesiones`,
  `moss.ascent_marcas` y `moss.pesos_compartidos`.
- **En la app:** `src/lib/ascentRemoto.ts` (`vincular`, `desvincular`,
  `estadoDelVinculo`, `sesionesDeAscent`, `marcasDeAscent` y
  `pesosCompartidos`).
- **Las pruebas:**
  - `npm run supabase:verificar`, sección 8: contra las tablas de Ascent de
    mentira, con la app llamando a la función de verdad.
  - `node herramientas/probar-vincular.mjs`: la función contra Auth y PostgREST
    de mentira.

## Qué lee cada app de la otra (con el vínculo)

Las tres primeras están escritas, en
[`0008_vinculo.sql`](../supabase/moss/0008_vinculo.sql); las demás, todavía no.

| Función | De dónde sale | La usa |
|---|---|---|
| `moss.ascent_sesiones(desde)` | `public.logs`, `public.sesiones` (con sus `bloques`) y `public.ejercicios` | Moss: gimnasio automático, calorías y proteína del día, recuperación, rendimiento y músculos |
| `moss.ascent_marcas(desde)` | `public.prs` y `public.ejercicios` | Moss: los días para intentar marca |
| `moss.pesos_compartidos(desde, app)` | `moss.pesos` y `public.weights` juntos | Moss (tendencia) y Ascent (DOTS, Stats › Peso) |
| `moss.recuperacion(fecha)` | sueño y comida de Moss, más entrenamiento de Ascent | las dos |
| `moss.semanas_para_ascent(desde)` | por semana: sueño promedio, proteína promedio por día y balance por día | las dos: «Por qué no subís» |
| `moss.objetivo()` | objetivo y ritmo de Moss | Ascent: qué espera de la fuerza |
| `moss.anio(anio)` y `moss.ascent_anio(anio)` | totales del año de cada app | el resumen anual, en las dos |
| `moss.amigos()` | `public.friendships`, respetando `son_amigos()` y `bloqueos` | Moss, cuando tenga social |

### Lo que devuelven las tres escritas

Son `security definer` con `search_path` vacío: miran quién llama y el vínculo,
y de Ascent solo leen. Sin vínculo devuelven una lista vacía. La forma, en la app,
es la de `src/lib/ascentRemoto.ts`.

- **`moss.ascent_sesiones(desde)`**
  - La llama la cuenta de Moss del vínculo y lee la de Ascent. Desde el lado de
    Ascent no devuelve nada: Ascent lee lo suyo directo.
  - Un elemento por día de gimnasio desde `desde`, con la clave local con que lo
    guarda Ascent (`logs.fecha`) y todas las sesiones de ese día juntas.
  - Un día de gimnasio es un `logs` sin `es_descanso`, o un descanso con una
    sesión con series. Anotado sin cronómetro, va con 0 series, 0 kilos, 0
    minutos y sin ejercicios.
  - `series`: el contador de Ascent (`sesiones.series`), que es la verdad del
    conteo aunque no se haya elegido ejercicio.
  - `kilos`: el peso movido como lo cuenta Ascent (`kilosDelBloque` en
    `nucleo/volumen.ts`): la suma del peso de cada serie, ×2 con dos mancuernas
    o un lado por vez (`par`, `una`), el lastre sin el cuerpo y el peso del
    cuerpo sin número (`corporal`). Sin repeticiones (ver el cambio 13 de Ascent).
  - `minutos`: solo las sesiones terminadas de 5 minutos o más, como en Stats
    (`resumen_sesiones`).
  - `inicio`: cuándo empezó la primera sesión del día; falta sin cronómetro.
  - `ejercicios`: en orden, cada uno con su id, su nombre (el del catálogo o el
    que le puso la persona), su grupo de Ascent y sus series, con los kilos de
    cada una (como arriba) y las repeticiones, o null lo que no se anotó.
  - Lo roto de los bloques (un ejercicio que no es texto, series que no son un
    número) se saltea, como en Ascent. La sección 8 de `npm run
    supabase:verificar` compara las cuentas con las de Ascent.
- **`moss.ascent_marcas(desde)`**: las marcas (`public.prs`) desde `desde` y, de
  cada ejercicio, la mejor de siempre por el 1RM de Ascent (`un_rm`), aunque sea
  de antes. Cada una con el ejercicio (el mismo nombre que en las sesiones), el
  día, el peso levantado y las repeticiones.
- **`moss.pesos_compartidos(desde, app)`**
  - Se puede llamar desde las dos apps.
  - Une `moss.pesos` de la cuenta de Moss con `public.weights` de la de Ascent:
    uno por día, con de dónde salió.
  - Ascent no guarda la hora de su peso, así que no se puede saber cuál es el
    último. Si un día hay de las dos, gana el de la app que pregunta: `app` es
    `'moss'` de fábrica y Ascent pasa `'ascent'`. Así cada una muestra lo que se
    anotó en ella.

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
   - Vinculadas, las dos leen la unión (`moss.pesos_compartidos`): uno por día.
     Ascent no guarda la hora de su peso, así que el día que hay de las dos gana
     el de la app que pregunta.
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
     enciende cuando `moss.ascent_sesiones(hoy)` trae el día de hoy.
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

1. **Altas de Moss** (revisado el 26/10/2026 con la versión 96 de Ascent).
   - Cada alta crea un perfil de Ascent sin nombre de usuario, también las de
     Moss con Apple: `on_auth_user_created` corre `handle_new_user()` con
     cualquier fila nueva de `auth.users`, sin mirar de qué app viene.
   - **Ese perfil no se ve en ningún lado:**
     - `usuarios_publicos` (el buscador, el perfil de un amigo, «entrenando
       ahora») ya pide `username is not null`;
     - el ranking (`ranking_fuerza`), los días de amigos y las rutinas son solo
       entre amigos, y sin nombre no se llega a ser amigo de nadie;
     - el barrido de rachas mira `racha_actual > 0`, y los avisos de Ascent, sus
       propias suscripciones.
   - **Y Ascent lo necesita:** si alguien entra a Ascent con una cuenta de Moss,
     Inicio (`movil/src/Inicio.tsx`) encuentra el perfil sin nombre y le pide
     elegirlo; sin perfil, cree que la cuenta no existe.
   - **El disparador se queda como está.** Mirar `raw_user_meta_data->>'app'`
     tampoco serviría: Sign in with Apple (`signInWithIdToken`) no deja mandar
     datos propios al crear la cuenta.
   - Lo único: al contar usuarios de Ascent, un perfil sin nombre no cuenta
     (`where username is not null`).
2. **Borrar la cuenta**
   - `eliminar_cuenta()` borra `auth.users`, y eso borra todo. Está bien, porque
     la cuenta es una sola, pero las dos apps lo tienen que decir: «Tu cuenta es
     la misma en Moss y en Ascent: borrarla borra los datos de las dos».
   - Además, cada app ofrece «Borrar mis datos de Moss» (o «de Ascent») sin
     borrar la cuenta.
   - Con Sign in with Apple, al borrar la cuenta hay que revocar el token de
     Apple. Va en una función del servidor con la clave de Apple.
   - **Borrar desde Moss saltea `eliminar_cuenta()`** (26/10/2026). Moss borra
     `auth.users` (con `moss-borrar-cuenta` o `moss.borrar_cuenta()`) y la
     cascada no hace lo que `eliminar_cuenta()` hace antes de borrar:
     - los ejercicios propios quedan con `creado_por` en null y sin `huerfano`,
       que es como se ve el catálogo: **todos los usuarios de Ascent pasarían a
       verlos**;
     - si la cuenta ganó un reto, `challenges.ganador` (sin cascada) frena el
       borrado, y Moss dice que no se pudo.
     - El arreglo va en Ascent: el cambio 4 de la lista de abajo.
   - El vínculo (`moss.vinculo`) se borra solo con cualquiera de las dos cuentas.
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
     sea una lectura dentro de una función `security definer`, que llame una
     función de Ascent o una función `security definer` sin `search_path = ''`
     (`npm run supabase:verificar`, sección 1).
   - Se aplican a mano en el SQL Editor, como las de Ascent.
8. **Copias de seguridad.** El plan gratis no tiene, y una base con dos apps
   publicadas pesa más si se rompe. Recomiendo Pro (25 dólares por mes) antes de
   lanzar Moss.
9. **Claves.** Las claves viejas de Supabase dejan de andar a fin de 2026. Moss
   arranca con la clave publicable nueva, y Ascent tiene ese cambio pendiente.
10. **Las columnas de Ascent que lee Moss** (`0008_vinculo.sql`):
    - `profiles`: `id`, `username`;
    - `logs`: `id`, `user_id`, `fecha`, `es_descanso`;
    - `sesiones`: `id`, `user_id`, `log_id`, `inicio`, `fin`, `estado`,
      `series`, `bloques` (y de cada bloque, `ejercicio`, `series`, `pesos`,
      `reps` y `carga`);
    - `ejercicios`: `id`, `nombre`, `grupo`;
    - `prs`: `id`, `user_id`, `ejercicio`, `peso`, `reps`, `es_real`, `fecha`,
      `creado`;
    - `weights`: `user_id`, `fecha`, `valor`.

    Postgres no ata el cuerpo de una función a las columnas que lee: si una
    migración de Ascent cambia alguna, las funciones de Moss fallan recién al
    llamarlas, y el retrato de Ascent no lo ve. Esa migración tiene que cambiar
    también la de Moss (y las tablas que imita `npm run supabase:verificar`).

## Cambios en el repo de Ascent

Para la sesión aparte sobre Ascent.

### Base (migraciones de Ascent, porque tocan `public` y `auth`)

1. **Un perfil por cada alta: queda como está** (revisado el 26/10/2026; ver
   «Altas de Moss»). Ascent necesita el perfil para pedir el nombre, y el
   disparador no puede saber de qué app viene una cuenta de Apple.
2. **Vistas públicas: ya está.** `usuarios_publicos` pide nombre de usuario, y
   el ranking y la búsqueda de amigos pasan por ella o por la amistad.
3. **Peso**
   - `peso_actual()`, el DOTS y Stats › Peso leen
     `moss.pesos_compartidos(desde, app => 'ascent')` cuando hay vínculo.
   - Ascent sigue escribiendo solo en `public.weights`.
4. **Borrar**
   - `borrar_datos_de_ascent()` borra lo de Ascent y deja la cuenta;
     `eliminar_cuenta()` queda igual, con el texto nuevo.
   - **Lo que hace falta antes de que Moss salga** (una migración de Ascent, la
     97): un disparador `before delete on public.profiles` que haga lo que
     `eliminar_cuenta()` hace antes de borrar. Es decir, borrar los retos donde
     la cuenta es `ganador`; dejar huérfanos los ejercicios propios que usó otra
     cuenta; y borrar los demás, con sus `prs`, `cargas_elegidas` y
     `subidas_marcadas`. Así borrar desde Moss, desde el panel o con
     `eliminar_cuenta()` da lo mismo, y los propios nunca pasan al catálogo de
     todos.

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
17. **Vincular en menos de 10 segundos** (D27): dejar la sesión y el nombre de
    usuario en el llavero compartido del equipo (`keychain-access-groups`) al
    entrar y al renovar, y borrarla al salir; leer la de Moss para vincular desde
    Ascent con dos toques.
    - Vincular: `POST /functions/v1/moss-vincular` con la sesión de Ascent en
      `Authorization` y `{ "otra": <la sesión de Moss>, "desde": "ascent" }`
      (el contrato está en «Lo que quedó en el servidor»).
    - El estado y desvincular: `moss.estado_del_vinculo()` y
      `moss.desvincular()`, por RPC en el esquema `moss`
      (`supabase.schema('moss').rpc(...)`).

### Infraestructura (las hacés vos en el panel)

18. **Correo:** SMTP propio (Resend), el correo de contraseña con el nombre de
    las dos apps y `moss://**` en las redirecciones.
19. **Claves:** pasar a las claves nuevas de Supabase, que ya estaba pendiente.
20. **Plan:** pasar a Pro para tener copias diarias. Lo recomiendo.

## Lo que tenés que hacer vos

La v1 va a revisión con la cuenta (Sign in with Apple) y con la conexión con
Ascent (26/10/2026). Antes de mandarla, en este orden:

**En Supabase**, proyecto `okeanaihymbvbdmrdqph`:

1. SQL Editor: correr, en orden, cada archivo entero y una sola vez:
   - `supabase/moss/0001_esquema.sql`;
   - `0002_comida.sql` (lo que se come);
   - `0003_progreso.sql` (la estrategia y las medidas del cuerpo);
   - `0004_medir.sql` (cómo se mide lo comido, el catálogo en el servidor, la
     semana repartida y borrar la cuenta);
   - `0005_noches.sql` (las noches propias: la cara y la hora confirmada o
     corregida);
   - `0006_alimentos.sql` (los micronutrientes, las búsquedas sin resultado y
     los reportes);
   - `0007_plan.sql` (el plan de comidas);
   - `0008_vinculo.sql` (el vínculo con Ascent y lo que Moss lee de Ascent);
   - y los que haya después (`0009_…`), siempre por número.

   Todos están probados con `npm run supabase:verificar`. Solo crean cosas en el
   esquema `moss`. De Ascent, la 0008 solo lee, y necesita sus tablas como están
   en la versión 96. Si uno falla a la mitad, no sigas con el siguiente: pasame
   el error.
2. Settings › Data API › *Exposed schemas*: sumar `moss`. Va después del paso 1,
   porque el esquema tiene que existir.
3. Authentication › URL Configuration › *Redirect URLs*: sumar `moss://**`.
4. Authentication › Sign In / Providers › **Apple**: activarlo y poner en
   *Client IDs* `uy.moss.app`. Cuando Ascent tenga Apple, sumar `uy.ascent.app`.
   Para el inicio nativo en iPhone alcanza con los identificadores.
5. Authentication › Sign In / Providers: activar *Allow manual linking*.
6. Las dos funciones del servidor: `moss-borrar-cuenta` (revoca Apple y borra la
   cuenta) y `moss-vincular` (vincula con Ascent).
   - Una vez, `npx supabase login`.
   - `npm run servidor:preparar -- <ruta a AuthKey_XXXXXXXXXX.p8>`: carga la
     clave de Apple y despliega las dos. Sin la ruta, solo las despliega.
   - O a mano, como dicen sus README
     ([`moss-borrar-cuenta`](../supabase/functions/moss-borrar-cuenta/README.md)
     y [`moss-vincular`](../supabase/functions/moss-vincular/README.md)).
   - `moss-vincular` no necesita secretos propios. Las dos van con
     `--no-verify-jwt`.
7. Antes de lanzar:
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
el proyecto de Moss, con `eas env:create` o en el panel. Ascent ya no tiene
interruptor: `EXPO_PUBLIC_CON_ASCENT` no hace falta.

**En Ascent** (la sesión de su repo):

- el cambio 4 de la lista de arriba (borrar por cualquier camino), antes de que
  Moss salga;
- su lado de D27 (el cambio 17).
