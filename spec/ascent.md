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

**Desde el 28/10/2026 (D29) las cuentas son dos** y la lista de amigos ya no se
comparte (ver «Dos cuentas»). El proyecto compartido sigue: el peso único y las
lecturas cruzadas siguen siendo consultas dentro de la misma base, con RLS.

## Dos cuentas (D29, la decidiste el 28/10/2026)

Lo dijiste así: Moss y Ascent tienen cuentas separadas, cada una con su
información, y se pueden vincular aunque usen correos o Apple ID distintos.
Vincular es conectar dos cuentas distintas para que compartan datos, no
fusionarlas. Borrar la cuenta de Moss borra todo lo de Moss y corta el vínculo;
Ascent sigue intacta y solo deja de recibir datos de Moss. Y al revés igual.

**El principio:** Moss y Ascent tienen que funcionar perfectamente solas.
Ninguna necesita a la otra para nada básico. Vincular es un plus, y lo exclusivo
(la recuperación, el rendimiento esperado, los días para intentar marca, por qué
no subís y tu año) es el premio por vincular.

- **Cómo se entra:** Moss, solo con Sign in with Apple; Ascent, con correo y
  contraseña. Google no (obligaría a Sign in with Apple por la regla 4.8, y
  Ascent lo sacó el 15/9).
- **Qué es cada cuenta.** Las dos apps usan el mismo proyecto y el mismo
  `auth.users`, pero la cuenta de Moss es lo de `moss` y la de Ascent es lo de
  `public`. Casi siempre son dos usuarios de Auth. A veces son el mismo: si
  alguien entra a Moss con un Apple ID cuyo correo (no oculto y confirmado) es
  el de su cuenta de Ascent, Supabase une esa identidad de Apple al usuario que
  ya existía. Aun así son dos cuentas: cada una se borra sin tocar la otra.
- **Cómo se sabe de qué app es un usuario, sin leer `public`:** por sus
  identidades en Auth. Solo Apple es solo de Moss; con la identidad `email`
  también es de Ascent. Si Ascent suma Sign in with Apple (el cambio 5 de
  abajo), esto deja de valer: Apple le da el mismo identificador a una persona
  en todas las apps del equipo, así que un Apple ID caería en el mismo usuario
  para las dos sin ninguna otra identidad. Antes de ese cambio hay que elegir
  otra señal (por ejemplo, una función de Ascent que diga si la cuenta usa
  Ascent, que lea solo `public` y que Moss llame desde el servidor; hoy Moss no
  llama funciones de Ascent, así que sería una excepción a discutir).
- **Ya no va:** el inicio de sesión compartido («Continuar como…» con la cuenta
  de Ascent, fusionar cuentas, sumar a una la forma de entrar de la otra con
  `linkIdentity`) y la lista de amigos compartida. Moss no tiene amigos, y la
  fila «Tus amigos» salió de Perfil.

### Borrar, de cada lado

| Desde | Mismo usuario de Auth | Qué pasa |
|---|---|---|
| Moss | no (solo Apple) | `moss-borrar-cuenta` revoca Apple, borra todo lo de `moss` y borra el usuario de Auth. El vínculo se va (`on delete cascade`). Ascent queda intacta y deja de recibir lo de Moss |
| Moss | sí (Apple y el correo) | Revoca Apple, borra todo lo de `moss` con sus vínculos del lado de Moss y le quita la identidad de Apple al usuario (`DELETE /auth/v1/user/identities/{id}`, con la sesión de quien llama). El usuario, `public` y la sesión de Ascent quedan intactos. Los otros teléfonos con Moss salen solos: Moss no sigue con una sesión sin Apple |
| Ascent | no | `eliminar_cuenta()` borra su usuario de Auth, y el vínculo se va con él. Moss queda intacta |
| Ascent | sí | `eliminar_cuenta()` llama a `moss.desvincular()`, borra lo suyo de `public` y no borra el usuario de Auth (si le quita la identidad `email`, Ascent deja de existir para esa persona). Moss queda intacta |

Así se cumple la 5.1.1(v): la cuenta de Moss deja de existir aunque la de Ascent
siga. «Borrar mis datos de Moss» borra lo mismo que borrar la cuenta en `moss`,
salvo el vínculo, y deja la cuenta. Las pruebas, caso por caso, están en `npm
run supabase:verificar` (sección 9) y en `node
herramientas/probar-borrar-cuenta.mjs`.

**En producción (28/10/2026).** La migración de Ascent está aplicada como la
**99** (`099_borrar_solo_ascent` en su historial; la 98 de su main es la de
grupos). Los cuatro casos de la tabla se probaron contra la base real con
`npx supabase db query --linked -f herramientas/probar-borrado-en-produccion.sql`.
Es un solo bloque con cuentas de prueba que termina en `raise exception` con el
resultado, así que todo se deshace y no queda nada. Los cuatro dieron bien.

**El mismo usuario de Auth es lo normal.** Ascent no tiene Sign in with Apple
(revisado en todas sus ramas). El usuario es el mismo cuando el Apple ID con
que se entra a Moss comparte su correo real con la cuenta de Ascent: Supabase
los une solo. Si Ascent suma Sign in with Apple en este proyecto, el mismo
Apple ID sería siempre el mismo usuario: Apple da el mismo identificador a las
apps del equipo. Entonces `moss-borrar-cuenta`, que decide por las identidades,
hay que cambiarlo antes (D29).

**Al juntar `moss-vinculo` en el main de Ascent:** van a chocar
`migracion-98-borrar-solo-ascent.sql` y los cambios de `eliminar_cuenta()` en
`schema.sql`. Queda lo de main: la 98 es la de grupos y la 99 es la del borrado,
con el mismo cuerpo. Los textos de la baja (`bajaMoss`, `dosCuentas`) siguen
solo en `moss-vinculo`.

### Cada app anda sola (revisado el 28/10/2026)

Sin vincular, o si `moss-vincular` y las lecturas de Ascent fallan o tardan,
nada básico de Moss espera a Ascent: la entrada, las seis secciones, el cielo,
las metas, los avisos, los widgets, la tarea de fondo y la sincronización no lo
llaman. Lo que llega de Ascent cambia, vinculada, la meta de calorías del día, la
proteína después de entrenar, el peso único y el hábito del gimnasio, y cada uno
vuelve solo a lo de Moss sin el vínculo. Lo que se corrigió con este criterio:

- Al abrir sin sesión (la cuenta se borró o se cerró en otro lado), lo guardado
  de Ascent seguía moviendo la meta, el peso y la fila de Perfil: ahora se va
  (`src/almacen/ascent.ts`, `src/almacen/index.ts`).
- El aviso de borrar la cuenta ya no dice que se borra «en cualquier app»: borra
  lo de Moss y, vinculada, dice que Ascent sigue intacta.
- «Tus amigos» salió de lo que anda con las dos apps (Moss no tiene amigos).

## Vincular conecta dos cuentas, no las junta

«Vincular» quiere decir: **la persona acepta que sus dos cuentas compartan
datos**, sean dos usuarios de Auth o el mismo. Hace falta igual, porque Moss
guarda sueño y comida, y Apple pide consentimiento para compartir datos de salud
(reglas 5.1.2 y 5.1.3).

- Una fila en `moss.vinculo` (la cuenta de Moss, la de Ascent, desde cuándo y
  desde qué app) y dos funciones que llaman las dos apps:
  - `moss.estado_del_vinculo()` devuelve si está vinculada, el usuario de Ascent
    y desde cuándo.
  - `moss.desvincular()`.
  - Vincular no es una función que llame la app: pasa por `moss-vincular`, que
    revisa las dos sesiones (ver «Vincular en menos de 10 segundos»).
- **El botón «Vincular»** está en la sección de Ascent, en Perfil y en la
  invitación de Inicio (ver «Que se encuentre»), y sigue el flujo de D27 (más
  abajo). El de antes, que pedía entrar a la otra app «con
  esta misma cuenta», ya no va: con dos cuentas no hace falta que coincidan.
  Para saber si la otra app está instalada, cada app declara el esquema de la
  otra en `LSApplicationQueriesSchemes` y prueba `canOpenURL`.
- **Desvincular** está en Ajustes de cada app. Los datos quedan en cada app y se
  deja de leer lo de la otra. Borrar cualquiera de las dos cuentas también
  desvincula (ver «Borrar, de cada lado»).
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
  las dos apps. `moss.desvincular()` corta el vínculo de `auth.uid()` de
  cualquiera de los dos lados: Ascent la llama también desde su
  `eliminar_cuenta()` cuando el usuario de Auth sigue porque también es la cuenta
  de Moss. «Borrar mis datos de Moss» no desvincula: el permiso se quita desde
  Perfil.
- **`moss.borrar_cuenta(cuenta)`** (D29): la llama solo `moss-borrar-cuenta`, con
  la clave de servicio. Borra todo lo de `moss` de esa cuenta y sus vínculos del
  lado de Moss; el usuario de Auth lo decide la función (ver «Borrar, de cada
  lado»).
- **Las lecturas para Moss** (ver la tabla de abajo): `moss.ascent_sesiones`,
  `moss.ascent_marcas` y `moss.pesos_compartidos`.
- **En la app:** `src/lib/ascentRemoto.ts` (`vincular`, `desvincular`,
  `estadoDelVinculo`, `sesionesDeAscent`, `marcasDeAscent` y
  `pesosCompartidos`).
- **Las pruebas:**
  - `npm run supabase:verificar`, sección 8: contra las tablas de Ascent de
    mentira, con la app llamando a la función de verdad; sección 9: las dos
    cuentas, con `moss-vincular` y `moss-borrar-cuenta` de verdad.
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

1. **Recuperación** (la que usa la app hoy; la propuesta del 2/11/2026 la reemplaza con el sueño, la
   fatiga muscular y la comida: ver «Ascent en Progreso, con «Estás 87 % recuperado»» más abajo)
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
7. **Login y amigos: ya no van** (D29, 28/10/2026)
   - Cada app tiene su cuenta y su forma de entrar: no hay inicio de sesión
     compartido.
   - Moss no tiene amigos ni lee `public.friendships`. Si algún día tiene algo
     social, es suyo, con su cuenta.
   - **Lo social, para cuando se prenda el vínculo** (lo pediste el 29/10/2026):
     la parte social de [`especificacion.md`](especificacion.md) (ver el cielo
     de un amigo, el ranking por constancia, sus hábitos si los muestra y el
     destello al completar el día) se piensa junto con `CON_ASCENT`. Antes hay
     que decidir de dónde salen los amigos: los de Ascent, con la amistad
     confirmada en las dos apps y leídos con una función de Moss que revise el
     vínculo (como lo demás de Ascent, y cambiando lo de arriba), o una lista
     propia de Moss. Nada de esto va en la 1.1.
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

### Ascent en Progreso (para aprobar, lo pediste el 2/11/2026; revisada con la evidencia el 5/11/2026)

**Revisión del 5/11/2026.** Pediste que fuera «lo más confiable posible», más
visual («que explique sin tener que leer mucho») y con las mismas listas de
ejercicios que Ascent. El estudio de la evidencia (resumido en
[`rendimiento.md`](rendimiento.md), «Lo que cambió») sacó el porcentaje de
recuperación, la probabilidad de marca y el estancamiento de 3 semanas; lo de
abajo ya está así en la galería. Donde dice «Estás 87 % recuperado», ahora va el
titular del día.

**Es una propuesta: está en la galería (sección 7) y la app todavía no cambia.** La
app sigue como dicen «La sección de Ascent en Moss» y «Que se encuentre», apagada con
`CON_ASCENT`. Cuando la apruebes, esta parte reemplaza a esas dos, y el código de la
señal en Hábitos (`src/secciones/ascent/SenalDeAscent.tsx`, y lo suyo en
`src/cielo/Cielo.tsx` y `src/cielo/Interfaz.tsx`) se saca. Hasta entonces no se toca.

Lo pediste así (la segunda vuelta, el 2/11): Ascent **arriba** de Progreso, como tu
universo («entro, boom, subo a lo de Ascent»), con algo en el encabezado que diga que
subiendo entras a la colaboración con Ascent; la invitación de Inicio queda. Arriba de
todo, lo que hay que hacer hoy y el porcentaje en grande: «Estás 87 % recuperado desde
el último entrenamiento», explicado corto. Debajo, Sueño, Fatiga muscular (no «Carga»:
«Carga 11» se leía como poca carga) y Alimentación, cada una con su franja y lo que
conviene, con la UI de RISE. Que el sueño perfecto pida registrar la calidad, y poder
corregir la noche en Sueño. Qué comer antes y después con su hora. La fatiga de cada
músculo por día de la rutina (bíceps y tríceps aparte). «Marcas» y «Razones de
estancamiento» con todos los ejercicios y sus razones. Tu año con colores. Y sacar «El
gimnasio se enciende solo».

**Cómo se llega.** Los números del gesto son los de siempre (`UMBRAL` 0,22 de la
pantalla o `VELOCIDAD_MIN` 0,35 px/ms, y 8 puntos para decidir).

| Dónde empieza el dedo | Para abajo | Para arriba | De costado |
|---|---|---|---|
| Progreso, arriba de todo | Baja Ascent, siguiendo al dedo | El scroll | Las pestañas |
| Progreso, más abajo | El scroll | El scroll | Las pestañas |
| La entrada del encabezado | Baja Ascent | Nada, o el scroll | Las pestañas |
| Ascent, abajo de todo (donde se llega) | El scroll: subes por Ascent | Ascent sube y vuelve Progreso | Nada |
| La barra | Nada: el borde de abajo es del gesto de inicio del iPhone | Nada | Nada |

- **Con la rueda o el trackpad, lo mismo:** arriba de todo de Progreso, seguir subiendo
  la baja; abajo de todo de Ascent, seguir bajando la cierra. Lo que venía con inercia
  no cuenta: hace falta una pausa de 200 ms.
- **Ascent sigue a Progreso para arriba** (lo pediste el 5/11/2026 a la noche: «subo y
  quiero encontrarlo desde arriba»; «como si fuese una expansión de Progreso»). Se llega
  por abajo, a lo principal: lo de hoy (o, sin vincular, vincular), pegado a Progreso.
  Subiendo está el resto, del más al menos importante («Hoy, concéntrate en», de qué
  sale, tus músculos, tu fuerza, marcas, estancamiento, tu año, lo que comparten y en qué
  se basa) y, arriba de todo, de fondo, el cuerpo de tu rango, como las estrellas.
- **Volver es bajar:** «Volver a Progreso», abajo de todo, con la flecha para abajo
  (antes había una flecha arriba que apuntaba para arriba y te bajaba: no tenía
  sentido), empujando para arriba abajo de todo, con la rueda para abajo o tocando
  Progreso. También se llega desde Perfil y desde la recuperación en Sueño.
- **Que se note que arriba está Ascent:**
  - **La entrada**, arriba a la derecha del encabezado de Progreso: el planeta de Ascent
    con su órbita cerrada (las dos apps, juntas) y la luna de Moss, el titular del día en
    dos palabras, sin porcentaje («Sin ir al fallo», «Todo listo para entrenar», «Más
    liviano hoy», «Hoy descansas»…) y la sesión («Piernas · 18:40»; ya hecha, «Hoy:
    piernas»). Sin vincular, la órbita abierta con la luna afuera, como en el ícono, y
    «Vincular con Ascent» (sin Ascent en el iPhone, «Ascent»). Si algo pone el límite hoy
    (la noche corta, lo de hoy cargado o cómo te sientes), la órbita va en terracota.
    Tocarla abre Ascent; deslizar desde ella también.
  - Debajo, «Desliza hacia abajo» con su flecha, hasta que se abre una vez: al volver a
    Progreso se pliega a la vista.
  - Arriba de todo de la pantalla asoma el borde del planeta, colgado: baja con el dedo y
    se va a medida que Ascent llega. Se apaga al bajar el scroll y en las metas.
  - La primera vez que se llega a Progreso, Progreso baja 24 puntos y vuelve, y el borde
    asoma un poco más, como si alguien tirara. Una sola vez; con Reducir movimiento, nada.
- **La transición:** Ascent baja siguiendo al dedo, con su parte de abajo primero, y
  Progreso baja pegado a ella, sin apagarse: es lo mismo que sigue para arriba. El cielo
  sube con la cámara, como hacia tu universo, y el cuerpo de tu rango, de fondo, baja,
  más despacio que la sección (está más lejos). En Ascent van a tener una entrada a Moss
  arriba de Stats: son dos caras del mismo gesto.

**Cómo se ve:** el lenguaje nuevo de Ascent (su `spec/estetica.md` y lo que contó su
sesión; está sin publicar y puede ajustarse), con la sobriedad de Moss.

- Un titular grande sin caja por pantalla (Outfit 200) y lo demás chico, sin caja.
- Línea de pelo y aire en vez de tarjetas; octágono de esquinas cortadas solo para la
  acción (y la hoja de vincular, cortada arriba); píldora para lo que se elige; lo
  secundario, subrayado.
- El cuerpo de tu rango **de fondo**, como las estrellas, detrás del texto: arriba a la
  derecha y cortado por el borde, como en Ascent, sin espacio vacío arriba que lo vuelva
  algo de la pantalla y sin colgar (lo pediste el 5/11/2026 a la noche: «quiero que acá
  sea el fondo»; hasta esa tarde era un horizonte que subía desde abajo). Se corre apenas
  con el scroll: está lejos. El polvo es una nube; los demás, el mismo dibujo, girado para
  que su luz mire a la pantalla y más tenues (el sol, más todavía).
- Fondo `#05060a`, tinta `#e8ecf6`, secundario `#aab2c4`, apagado `#9098ab`, con piso
  de contraste 4,5:1 en el texto. **El acento y el cuerpo de arriba son los de tu rango
  en Ascent** (lo propusiste el 5/11/2026; en la galería, para aprobar, con los siete rangos
  y los cinco planetas del 4 en la sección 7): `src/dominio/rangoDeAscent.ts` es el espejo de
  la regla de Ascent (el rango sale de la racha; en el 4, el planeta cambia cada cuatro días)
  y la sección toma su paleta. Sin vincular, el polvo: el rango 1, el día uno de Ascent (hasta el
  5/11/2026 era la luna, que no te gustó). El polvo se dibuja como la nebulosa de Ascent
  (`crearPolvo` y el modo 5 de su motor) pero a la manera de Moss: una nube más o menos
  redonda, sin círculo ni borde, de gas violeta y azul con vetas, calles oscuras y una
  estrella que nace en el medio, sin las cortinas de aurora. **Se mueve** (5/11/2026: «está
  estático»): el gas gira despacio alrededor de la estrella (una vuelta en 5 minutos, como
  el polvo de Ascent, que gira) y late; los granos giran más rápido, porque están más
  cerca, en tres grupos que titilan a destiempo; la estrella respira. Con Reducir
  movimiento, quieta. Para usarlo, Moss
  tiene que leer la racha de Ascent con su función del vínculo (nunca una de Ascent): **falta
  decidir** si se lee.
- **El color:** solo lo que pone el límite hoy y lo cargado (terracota `#CB8569`); lo
  que se recupera, en crema, y lo descansado, apenas. Sin franjas ni puntajes (las de
  Oura se sacaron el 5/11/2026).
- **Visual antes que texto:** la noche en una escala con la raya de las 6 h; los
  músculos en un cuerpo dibujado de frente y de espalda (tocar uno dice cuándo vuelve a
  lo suyo) y en píldoras con su estado; cada ejercicio con su tendencia en un dibujo
  chico (cada sesión un punto, la recta con su rango); la marca como una raya contra tu
  nivel de hoy con lo que cambia de un día a otro; cada cuánto haces marca en cuadros; y
  las series de cada semana en barras, antes y ahora.
- **El cuerpo dibujado** (rehecho el 5/11/2026: el abdomen era un rectángulo y se leía
  raro): cada músculo llena su zona, separado por una línea de pelo, y unas líneas finas
  lo definen por dentro. De frente: el trapecio que asoma, los deltoides, los pectorales,
  el bíceps, el antebrazo, el abdomen en seis con la parte de abajo y los oblicuos, los
  aductores, el cuádriceps entero con el recto y la gota del vasto interno, y los gemelos
  a los costados. De espalda: el trapecio en rombo, lo de arriba del omóplato, el dorsal
  como un ala, el deltoides de atrás, el tríceps en herradura, los erectores a los dos
  lados de la columna (se abren hacia los glúteos), los glúteos, los isquios con sus dos
  cabezas y el gemelo en rombo. Se dibuja la mitad y la otra en espejo. En la app va con
  `react-native-svg` o Skia, con los mismos trazos.
- **Que ande en un teléfono viejo** (5/11/2026): todo lo que se mueve sin parar va en su
  capa y solo cambia transform u opacity, así no se repinta nada en cada cuadro (el polvo,
  las flechas que respiran); el gas del polvo se pinta una sola vez y queda como imagen; el
  scroll de la sección no lleva máscara. En la app: el polvo, como imagen hecha una vez
  (o un shader barato), girado en el hilo de la interfaz con Reanimated.
- **Las letras:** Ascent usa Inter para leer y Geist Mono para los datos. La maqueta
  usa las que ya tiene Moss: Jost, y Outfit con cifras tabulares. **Falta decidir** si
  esta sección trae las de Ascent.

**Sin vincular:** arriba de todo, «Ascent», sin «Si usas Ascent» ni «Con» (lo pediste el
5/11/2026), y la frase «Vincula las dos apps para progresar mucho más rápido y tener claro,
en un solo lugar, qué te frena.». La invitación de Inicio sigue con la suya. El octágono «Vincular con Ascent» y, subrayado, la App Store. Debajo, «Solo con
las dos»: cada parte vacía, con su candado y su línea (cómo llegas a entrenar, de qué
sale, tus músculos con el cuerpo apagado, tu fuerza, las marcas, las razones de
estancamiento y tu año).

**Vinculada, desde el 5/11/2026 (en la galería):**

1. **El titular del día,** grande y sin porcentaje (`titularDeHoy()` en
   `recuperado.ts`, con tests). Arriba, la sesión («Hoy · Piernas · 18:40»). Manda lo
   más flojo y nada lo compensa, en este orden: ya entrenaste («Ya entrenaste piernas»,
   y cuándo vuelve a estar lo de hoy), descansas, falta la noche («Anota cómo
   dormiste»), lo de hoy cargado («Lo que entrenas hoy sigue cansado»: más liviano u
   otra cosa), la noche corta («Puedes entrenar, sin ir al fallo»: 6 h o menos,
   despertarte una hora antes o dos de tres noches cortas), dijiste que no te sientes
   bien (4 o menos de 10), lo de hoy todavía se recupera («Entrena como siempre») o
   «Todo listo para piernas».
   - **Lo que decide hoy,** en tres con su ícono: tu noche, lo de hoy y cómo te
     sientes; lo que pone el límite va en terracota.
   - **Tu último entreno** (lo pediste el 5/11): «Lunes: Pecho, Hombros, Tríceps», los
     músculos que trabajó como principales, de los que más series tuvieron a los que
     menos (`musculosTrabajados()`), con un cuerpo chico que los muestra.
   - **«¿Cómo te sientes para entrenar?»,** de 0 a 10 en píldoras (Laurent 2011): cambia
     el titular y «Hoy, concéntrate en» con un fundido. Suma un toque: **para que
     decidas** si va acá, en Ascent al abrir la sesión o junto a las caras de la mañana.
   - «¿Por qué no hay un porcentaje?» despliega dos líneas y lleva a «En qué se basa».
2. **Hoy, concéntrate en,** como antes, con `comoEntrenar()` por factor: sin ir al
   fallo con la noche corta, más liviano con lo de hoy cargado, escúchate, la marca con
   todo a favor o como siempre (nunca «más fuerte»). «Termina antes de las…» dice
   «mejor 4 horas antes de dormir y por lo menos 2» (Frimpong 2021; Leota 2025).
3. **De qué sale,** en tres filas con sus datos y sin puntos: el sueño (lo dormido en
   una escala con la raya de las 6 h y lo tuyo, si te despertaste antes, la calidad
   como dato que no cuenta, y lo que conviene), los músculos de hoy (en píldoras, la
   última vez que los entrenaste con sus series y cuándo vuelven a estar) y la comida
   (la proteína de la semana por kilo contra la raya de 1,6 y la de ayer, que no cambia
   tu fuerza de hoy). Con «sin déficit», la comida sin metas.
4. **Tus músculos:** el cuerpo de frente y de espalda con cada músculo descansado,
   recuperándose o cargado (`todosLosMusculos()` en `fatiga.ts`); tocar uno dice
   «Cuádriceps: con carga; probablemente vuelva a lo suyo pasado mañana». Debajo, tu
   semana en Ascent: cada día de la rutina con sus músculos en píldoras.
5. **Tu fuerza:** los multiarticulares de la rutina con marca en Ascent, cada uno con su
   tendencia de 12 semanas (`tendenciaDeFuerza()`): «Sube, ~+2,7 % por mes · entre
   +2,3 y +3,2 · 10 sesiones», «Sin subida clara en 10 semanas» o «Todavía no se sabe ·
   4 sesiones: hacen falta 6», y tu ruido de un día a otro.
6. **Marcas:** los ejercicios de la sesión de hoy: cerca de tu marca o a cuánto, tu
   nivel de hoy contra tu marca (en 1RM estimado, de a 2,5 kg), lo que acompaña con
   cerca (más de 6 h, los músculos descansados y una semana como siempre), cada cuánto
   haces marca en cuadros y la regla de la serie de aproximación. Los de más de 10
   repeticiones van juntos en una línea.
7. **Razones de estancamiento:** los ejercicios sin subida clara en 8 semanas o más y
   pasado el umbral de Ascent, con sus razones de la más a la menos sólida (las series
   duras de su músculo por semana en barras, antes y ahora; las veces por semana; las
   series pesadas contra un tercio; bajar rápido o la definición; la proteína contra
   1,6; el sueño). Lo que es de la persona y les toca a todos va una vez, arriba; los
   años de entrenamiento, al final, de contexto.
8. **Tu año** y **Lo que comparten las dos,** como antes.
9. **En qué se basa,** al final y desplegable: por qué no hay un porcentaje, el titular,
   la noche corta, los músculos, la fuerza, la marca, el estancamiento y lo de comer,
   con sus fuentes.

**En la maqueta (5/11):** siete días de ejemplo (los de antes y «Piernas cargadas»,
con una sesión de piernas ayer, que la galería suma al panel); las sesiones de Ascent
desde mayo con los ejercicios del catálogo por su id, inventadas para que se vea cada
caso (la sentadilla sube y está cerca de su marca; el press de banca no sube desde
agosto, con menos series de pecho; el press militar, plano y sin series pesadas; el
peso muerto, nuevo). **Sueño todavía muestra el número de antes:** el gancho nuevo es
`titularDeHoy()` (y `lineaDeHoy()` para la línea del rendimiento) en la sección de
Ascent de la galería.

**Lo de antes (2/11/2026), como quedó hasta el 5/11:**

1. **Cuánto estás recuperado** (`src/dominio/recuperado.ts`, puro y con tests; reemplaza a
   `recuperacion()` de `entrenamiento.ts` cuando se apruebe).
   - «Estás / 87 % / recuperado» («recuperada» con el perfil en `f`; en inglés, «You're
     87% recovered») y «Desde tu último entreno: el lunes, empuje.». Ya entrenado:
     «Llegaste / 91 % / recuperado» y «Así llegaste a piernas, hoy a las 18:40.».
   - **Es un número del día**, como el de WHOOP: se mira a la hora de la sesión de hoy
     (la que empieza ahí todavía no cuenta) o, sin sesión, a la hora de despertarse. Es
     el mismo antes y después de entrenar, y el mismo que muestra Ascent.
   - **Sueño, de 40:** 20 × lo dormido sobre lo que necesitas (hasta 1) + 20 × la calidad
     sobre 100 (la del reloj, la de la mañana o el promedio: `calidadParaRecuperar()`).
     **Sin calidad cuenta como regular (50): el sueño llega a 30**, y la fila lo dice.
   - **Músculos, de 40:** 40 × (1 − la fatiga). **La fatiga muscular**
     (`src/dominio/fatiga.ts`) es un índice de 0 a 100 donde menos es mejor: el promedio
     de lo que les falta (`residual()` de `musculos.ts`) a los músculos principales de la
     sesión de hoy o, sin sesión, a los que fueron principales en los 3 días anteriores,
     sobre el 30 % que deja como mucho una sesión (el techo de `caidaInicial()`).
   - **Comida, de 20:** como antes, 10 por la proteína de ayer contra la meta y 10 por
     haber comido al menos el 80 % de las calorías.
   - **Las franjas**, de mejor a peor: el total, 85 o más muy bien, de 70 a 84 bien, de 50
     a 69 aceptable y menos atención; el sueño (de 40), 34, 26 y 18; la comida (de 20),
     17, 13 y 9; la fatiga, al revés: hasta 5 % muy bien, hasta 15 bien (baja), hasta 40
     aceptable (moderada) y más atención (alta). En la barra, un tramo igual por franja y
     el punto en proporción dentro del suyo (`enLaBarra()`).
   - **Qué conviene** (lo usa Sueño): muy bien, fuerte; bien o aceptable, normal;
     atención, suave. La frase de debajo de la barra, antes de entrenar, sale de
     `comoEntrenar()` (ver abajo), así no contradice lo del gimnasio.
   - «¿Qué es este número?» despliega dos líneas llanas y lleva a «Cómo se calcula».
   - El día de ejemplo «Durmió poco y entrena» da: sueño 24 (5 h 50 de 8 h, calidad 46),
     fatiga 2 % → 39, comida 18 → **81, «Bien»**, «Hoy, entrena normal y sin ir al
     fallo». «Durmió bien»: 93, muy bien, buen día para marca en sentadilla.
   - **Las constantes son una propuesta para calibrar** con lo tuyo: el 30 %, los 3 días,
     la calidad de 50 y los cortes de las franjas.
   - **`moss.recuperacion(fecha)`, todavía sin escribir en Supabase, tiene que seguir
     esta cuenta** (con la fatiga por músculo, que necesita las series de Ascent), para
     que Ascent muestre el mismo número.
2. **Hoy, concéntrate en** (`focoDeHoy()` en `diagnostico.ts`, con tests): hasta tres
   cosas, cada una una sola idea, con su hora y en el orden del día.
   - Primero lo que falta saber («Anota cómo dormiste», si no hay noche) y lo que conviene
     comer antes de entrenar, a la hora de esa comida: la línea de la comida tal cual
     (`alrededorDelEntreno.ts`), con los gramos de carbohidratos y proteína y «poca
     grasa», y el café hasta su hora de corte. Por ejemplo, 17:30 «Merienda: algo
     liviano · 75 g de carbohidratos, 20 g de proteína y poca grasa. Café, hasta las
     15:30.»: una hora antes de entrenar, no apenas.
   - Después, cómo ir en el gimnasio a la hora de la sesión (`comoEntrenar()`): buen día
     para marca si está muy bien y una marca cerca; sin ir al fallo si la noche fue de 6 h
     o menos; suave si los músculos de hoy piden atención o el total también; un poco
     más fuerte si está muy bien con la fatiga baja; si no, como siempre (este va solo si
     sobra lugar). No depende de la comida: vale con «sin déficit».
   - «Termina antes de las 21:30», si lo fuerte termina a menos de 2 h de dormir
     (Frimpong 2021; Leota 2025: 36 minutos más para dormirse). La misma regla que los
     avisos.
   - «A la cama» a la hora que deja dormir lo que necesitas, si el sueño es lo que más
     falta y está aceptable o peor, o con deuda de 7 h o más.
   - Al final, lo de después de entrenar y antes de dormir, y en un día de descanso,
     «Descanso» (el músculo que más le falta) y la proteína del día.
   - Con «sin déficit», nada, como el diagnóstico; con los números ocultos, sin gramos.
3. **De qué sale:** Sueño, Fatiga muscular y Alimentación, en filas sin cajas: nombre,
   valor («24 de 40», «2 %», «18 de 20»), la franja con su palabra y la barra; debajo, una
   o dos líneas de explicación y lo que conviene según la franja (antes de entrenar, en
   el gimnasio o para que sea perfecta).
   - Sueño: lo dormido contra lo que necesitas y la calidad; la siesta, las series
     pesadas o la deuda si toca. «Registra cómo dormiste: así puede llegar a 40» (sin
     calidad) lleva a la pregunta de la mañana; siempre, «¿Dormiste distinto? Corrígelo
     en Sueño» lleva a esa noche.
   - Fatiga muscular: en qué músculos y cuánto; antes de entrenar, cómo ir; ya entrenado,
     cuánto necesita lo de hoy (desde 48 h, en días); y, chico, el rendimiento esperado
     (fuerza máxima y repeticiones, ± el ruido de cada día).
   - Alimentación: la proteína y las calorías de ayer y qué falta para que sea perfecta;
     después de una noche corta, «no hace falta comer distinto». Con «sin déficit», sin
     metas.
4. **Fatiga muscular, por músculo** (`fatigaPorDia()`, con tests): cada día de la rutina
   de Ascent, hoy primero y después lo que sigue en la semana; en cada uno, cada músculo
   principal por separado (bíceps y tríceps aparte) con su barra (de 0 a 15 %, con marcas
   en 3 y 10), su palabra (recuperado, recuperándose o cargado; solo cargado con color) y
   «listo en ~10 h». Es ahora, no a la hora de la sesión.
5. **Marcas:** los ejercicios de la sesión de hoy con su probabilidad contra la línea de
   35 % (`buenDiaParaMarca()`), los de buen día primero (`ordenarMarcas()`), y el porqué
   de cada «hoy no» (`queFalla()`: las cinco condiciones, en palabras). En el de buen día,
   la seguridad y los aciertos. Sin sesión, ya entrenado o sin la noche, lo dice.
6. **Razones de estancamiento** (`src/dominio/estancados.ts`, con tests; no cambia
   `porQueNoSube()`, que usa la app): todos los ejercicios que Ascent ve sin subir con el
   umbral que se elige en sus Ajustes (2, 3, 6 u 8 semanas; 6 de fábrica; la maqueta usa
   3 y lo dice), cada uno con «3 semanas sin subir · 80 kg × 5» y sus razones, de la que
   más pesa a la que menos, cada una con su número y antes y ahora en una línea:
   - en definición (objetivo «bajar»): mantener la fuerza ya es un buen resultado;
   - dormiste menos, menos proteína o comiste más por debajo, cuando la diferencia con
     las semanas en que subía llega a una escala entera (45 min, 15 g o 250 kcal por día,
     como `porQueNoSube()`);
   - poco descanso entre sesiones: el músculo principal con más de 10 % sin recuperar al
     empezar, en la mitad o más de sus últimas sesiones (3 o más);
   - lo entrenas menos seguido: dos tercios de lo de antes o menos;
   - tus sesiones se achicaron: un 25 % menos, como la señal de Ascent.
   Lo que vale para todos (la definición y lo que cambió igual en todos) va una vez,
   arriba. Sin ninguna, «Sin una causa clara en tu sueño ni en tu comida». Siempre
   «causa probable, no segura». Con «sin déficit», sin la definición ni las calorías.
7. **Tu año:** un mapa del año, los meses en filas y los días en columnas; cada día
   entrenado con el color de su grupo principal (pecho, piernas o espalda: tres tonos
   apagados que pasan las comprobaciones de la skill dataviz de a pares, para
   daltonismo y visión normal, sobre el fondo), un punto en cada marca y hoy con borde;
   tocar un día dice qué fue. Debajo, la leyenda, «Tus últimas marcas» por grupo («Piernas:
   sentadilla 107,5 kg × 5 · hace 8 semanas») y las cifras chicas de antes.
8. **Lo que comparten las dos**, compacto: un solo peso, calorías según el día (un día de
   gimnasio y uno de descanso), el mismo objetivo y la proteína después de entrenar.
9. **Cómo se calcula**, al final y desplegable: las tres partes sumando 100 (40 + 40 + 20),
   llenas con lo de hoy, la suma («24 + 39 + 18 = 81 %»), qué es cada parte, las franjas,
   cuándo se mira, lo de comer con sus fuentes (ACSM 2016, ISSN 2017, Gardiner 2023,
   Leota 2025) y que es orientativo (Apple 1.4.1).

**Se sacó:** «El gimnasio se enciende solo» y su botón (el hábito con Ascent sigue en el
editor de Hábitos), «Hoy en Ascent» con la semana en columnas (lo de las calorías pasó a
«Lo que comparten»), el titular y la línea del día del diagnóstico (ahora están en «Hoy,
concéntrate en»), la pestaña de arriba de la barra y el asomo del final de Progreso.

**En la maqueta:** seis días de ejemplo para elegir (los cinco de antes y «Sin la calidad
del sueño», que la galería suma al panel); la rutina sale de las sesiones de mentira
(lunes empuje, miércoles piernas, viernes torso y domingo tirón); lo de Ascent de cada
ejercicio estancado (cómo llegó a cada sesión, cada cuánto y los minutos) y los días del
año antes del 14 de septiembre son inventados y lo dicen en `galeria/src/datos.js`.

**Lo que falta programar en la app cuando lo apruebes:**

1. El gesto en Progreso: hoy es un `ScrollView` adentro de la tira. Hace falta saber
   cuándo está arriba de todo y seguir el sobre-scroll para abajo con el dedo (`onScroll`
   y `onScrollEndDrag`, o un `Gesture.Pan()` que conviva con él), y lo mismo abajo de
   todo de Ascent para volver, sin robarle el gesto al scroll ni a la tira.
2. La entrada en el encabezado de `src/secciones/progreso/` (la órbita con el arco y la
   luna, en Skia o con vistas), la pista y el movimiento de la primera vez guardados en el
   teléfono, y sacar la señal de Hábitos.
3. El borde del planeta arriba de Progreso y, en Ascent, el cuerpo de tu rango arriba, de
   fondo (el polvo, una nube), en Skia; Progreso bajando pegado a Ascent, el recorrido
   del cielo con Ascent bajando desde Progreso (hoy sube desde Hábitos) y llegar abajo
   de todo de su scroll.
4. La sección nueva en `src/secciones/ascent/Vinculada.tsx`, sin tarjetas, con el
   cuerpo dibujado, las escalas, la tendencia de cada ejercicio y el mapa del año en
   `src/secciones/graficos/`.
5. Con los datos de verdad: la noche, la calidad y la deuda de Salud, la hora de
   despertarse de siempre, lo anotado y la meta de `src/almacen/`, y las sesiones de
   Ascent con sus bloques y el id de cada ejercicio (ya llegan con
   `moss.ascent_sesiones`; Ascent manda 12 semanas o desde el 1 de enero, lo que
   alcanza para la tendencia). Las cuentas están listas y con tests: `titularDeHoy()`
   en `recuperado.ts`, `tendenciaDeFuerza()`, `cercaDeLaMarca()`,
   `condicionesDeLaMarca()` y `frecuenciaDeMarcas()` en `rendimiento.ts`, `fatiga.ts`
   (en días), `estancados.ts` (las razones nuevas y `semanaDeEntreno()`), `CATALOGO` y
   `musculosTrabajados()` en `musculos.ts`, y `focoDeHoy()`, `comoEntrenar()`,
   `ordenarMarcas()` y `queFalla()` en `diagnostico.ts`. «¿Cómo te sientes?» se
   guarda en el teléfono, si lo apruebas.
6. En Supabase: `moss.recuperacion(fecha)` devuelve el titular y las filas, no un
   número (así Ascent muestra lo mismo); leer la rutina activa de Ascent
   (`nucleo/rutinas.ts`; hoy no hay función) y el umbral de estancamiento de sus
   Ajustes. Lo de cada sesión (las series duras, las veces, las pesadas) sale en Moss
   de `moss.ascent_sesiones`.
7. Los textos nuevos están en `ascent.*` (y los nombres de los ejercicios en
   `ascent.ejercicios.*`); los de antes (`ascent.recuperacion.*`,
   `ascent.estancamiento.*`, `ascent.rendimiento.*`, `ascent.marca.*`,
   `ascent.musculos.*`, `ascent.gimnasio.*`) los sigue usando la app y se limpian al
   programarlo.
8. Outfit 200 en la app, y Geist Mono e Inter si las querés. El acento del rango, si se
   decide que Moss lo recibe.

### La sección de Ascent en Moss

Está abajo de Hábitos y sube desde el musgo (el cambio 10 de la especificación la
llama «arriba de Hábitos» porque queda encima del cielo, pero se llega desde
abajo) y es lo único de Moss que es de las dos apps. En la galería, sección 7.

- **Cómo se llega:**
  - En Hábitos, abajo, sobre el musgo y debajo de la frase, la señal de Ascent,
    con su flecha para arriba (ver «Que se encuentre»).
  - Deslizar para arriba sube la sección desde el musgo, siguiendo al dedo.
    Cambia con un quinto de la pantalla o con un tirón, como las pestañas.
  - El gesto solo arranca arriba de la barra de pestañas: nunca en el borde de
    abajo, que es del gesto de inicio del iPhone. Tocar la señal también abre
    la sección, y deslizar desde ella también la sube.
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
    App Store). Vincular conecta tus dos cuentas para que compartan datos, y lo
    dice.
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

### Que se encuentre (lo pediste el 2/11/2026)

Esto es lo que hoy está en la app, apagado. Lo reemplaza «Ascent en Progreso», que
está para aprobar.

Lo dijiste así: para la próxima build, cuando se prenda, que la vinculación sea
fácil de encontrar en Moss; en Hábitos, una señal clara de que abajo está lo de
Ascent. Y que en Ascent también sea muy visible la opción de vincular con Moss.
Todo va detrás de `CON_ASCENT` (D30): con la bandera apagada, la app se ve igual
que antes y Ascent no se nombra en ningún lado. Las reglas están en
`src/dominio/senalDeAscent.ts`, con sus tests, y la galería las usa tal cual.

**La dirección.** La sección está abajo y el dedo la sube, como dijiste: la señal
va en el borde de abajo, sobre el musgo, con la flecha hacia donde se desliza. Tu
universo queda del otro lado: arrastrar el cielo para abajo lo baja. No cambia
ningún gesto.

| | Sin vincular, con Ascent en este iPhone | Sin vincular, sin Ascent | Vinculada |
|---|---|---|---|
| **Hábitos: la señal** | «Vincular con Ascent», con la luna afuera de la órbita | «Ascent», con la luna afuera | La última sesión de la semana («Hoy: piernas», «Ayer: empuje», «El lunes: empuje»), con la luna en la órbita; sin una, «Ascent» |
| **Inicio: la invitación** | Siempre; después de «Ahora no», 4 horas después | Nada | Nada |
| **Perfil: la fila** | «Vincular» | «Vincular» | «@usuario» |
| **La sección** | «Vincular con Ascent» | «Vincular con Ascent» y la App Store | Lo de hoy |

- **La señal de Hábitos**
  - Una pastilla con la marca de Ascent en chico (a ese tamaño, la órbita y la luna
    van más gruesas), qué hay y la flecha: siempre a la vista y sin competir con el
    cielo, con los colores de Ascent. La frase sube 8 puntos para hacerle lugar, el
    globito 12 y el aviso 28.
  - Se toca o se desliza. No es un botón sobre el lienzo: el toque y el deslizamiento
    los resuelven los gestos del cielo (`Cielo.tsx`). Así un deslizamiento que
    empieza en ella también sube, y un toque no enciende la estrella de abajo. Para
    VoiceOver sí es un botón.
  - La primera vez que se ve sube y baja dos veces, apenas, y queda guardado en el
    teléfono. Con Reducir movimiento, no se mueve. La flecha respira con el reloj
    del cielo, como antes.
  - Una sesión más vieja que una semana ya no dice nada útil: vuelve a «Ascent».
- **La invitación de Inicio**
  - Solo con Ascent en este iPhone (`canOpenURL`, ya declarado), con la cuenta de
    Moss y sin vincular. Sin Ascent no se dice nada. El título es una pregunta: «¿Tienes
    Ascent en este iPhone?» (5/11/2026).
  - Va debajo del segundo bloque: se ve sin bajar y no tapa lo de hoy.
  - «Vincular» abre la hoja sin salir de Inicio: dos toques, como pide D27.
  - «Ahora no» la guarda 4 horas (lo pediste el 5/11/2026: que vuelva sin molestar, así
    se ve cuando vuelves a anotar una comida; `VUELVE_EN` en `senalDeAscent.ts`). Se
    guarda la hora en este iPhone; lo que guardaba la 1.0 cuenta como un «Ahora no»
    viejo. La señal y Perfil siguen ahí. Al vincular, se va sola.
- **Perfil:** con la bandera prendida, Conexiones pasa a ser lo primero, debajo de
  tu foto, con Ascent en ella, como en la galería.
- **Moss es Moss sigue valiendo:** la entrada, la ficha y lo de cada día no dependen
  de Ascent, y nunca se habla de «tu cuenta de Moss y Ascent». Ascent se nombra solo
  en lo que lleva a vincular.

**En Ascent** (lo pediste junto con lo de arriba, y se lo pasamos a su sesión, que
lo anota en su spec): la opción de vincular con Moss tiene que ser igual de visible.
Hoy son la fila de Ajustes (el cambio 7) y las tarjetas de Stats (el cambio 6): que
no haya que ir a buscarlas. Ver el cambio 17 bis.

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
2. **Borrar la cuenta** (cambió el 28/10/2026, D29: ver «Borrar, de cada lado»)
   - Cada app borra solo su cuenta. Borrar la de Moss borra todo lo de `moss` y
     el vínculo; Ascent sigue intacta y deja de recibir lo de Moss. Y al revés.
     Ya no se avisa que «se borra en las dos».
   - Además, cada app ofrece «Borrar mis datos de Moss» (o «de Ascent») sin
     borrar la cuenta.
   - Con Sign in with Apple, al borrar la cuenta se revoca el token de Apple, en
     `moss-borrar-cuenta`, con la clave de Apple.
   - Moss borra el usuario de Auth solo cuando solo tiene Apple. Ese usuario
     nunca pudo usar Ascent (Ascent entra con correo), así que de Ascent solo
     tiene el perfil sin nombre que crea `handle_new_user()`, y la cascada no
     deja nada colgado. Lo de antes (26/10/2026: los ejercicios propios que
     pasaban al catálogo de todos y `challenges.ganador` frenando el borrado) ya
     no lo puede provocar Moss; el cambio 4 de Ascent sigue sirviendo para borrar
     desde el panel.
   - Cuando el usuario de Auth es el mismo, Moss no lo borra: le quita Apple. Y
     Ascent, al borrar su cuenta, no lo borra: llama a `moss.desvincular()` y
     borra lo suyo (el cambio 4).
   - El vínculo (`moss.vinculo`) se borra solo con cualquiera de los dos
     usuarios de Auth, y con `moss.borrar_cuenta` o `moss.desvincular()` cuando
     el usuario sigue.
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
   - `borrar_datos_de_ascent()` borra lo de Ascent y deja la cuenta.
   - **`eliminar_cuenta()` borra solo la cuenta de Ascent** (D29, 28/10/2026).
     Si el usuario de Auth también tiene la identidad de Apple (es también la
     cuenta de Moss), no borra `auth.users`: llama a `moss.desvincular()` (con
     la sesión de quien borra; está en `authenticated`), borra lo suyo de
     `public` (el perfil, con su cascada, y lo que hoy hace antes de borrar) y,
     para que la cuenta de Ascent deje de existir, le quita la identidad `email`
     y la contraseña (por ejemplo, desde la app con `unlinkIdentity`, que pide
     *Allow manual linking*). Si no, borra `auth.users` como hoy, y el vínculo
     se va solo. Como el esquema `moss` puede no estar todavía en la base, que la
     llame solo si existe (`to_regprocedure('moss.desvincular()')`).
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
   **En pausa desde D29:** con Apple en Ascent, «solo tiene Apple» deja de
   querer decir «es solo de Moss», y borrar la cuenta de Moss podría borrar la
   de Ascent (ver «Dos cuentas»). Antes hay que elegir otra señal.
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
12. **Texto de borrar la cuenta:** que diga que borra la cuenta de Ascent y lo
    de Ascent, y que Moss, si la tiene, sigue intacta y deja de recibir sus
    datos (D29; en Moss, `perfil.borrarCuentaTexto` y
    `perfil.borrarCuentaConAscent`).
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

**17 bis. Vincular con Moss, muy visible** (pedido el 2/11/2026, junto con «Que se
encuentre»): en Ascent tiene que encontrarse sin buscarla, como en Moss. La pasó a
su sesión la de Moss; lo que se decida ahí va en su spec.

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
     semana repartida);
   - `0005_noches.sql` (las noches propias: la cara y la hora confirmada o
     corregida);
   - `0006_alimentos.sql` (los micronutrientes, las búsquedas sin resultado y
     los reportes);
   - `0007_plan.sql` (el plan de comidas);
   - `0008_vinculo.sql` (el vínculo con Ascent, lo que Moss lee de Ascent y
     borrar la cuenta de Moss);
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
5. Authentication › Sign In / Providers: activar *Allow manual linking*. Hace
   falta para borrar la cuenta de Moss cuando el usuario de Auth también es el
   de Ascent: `moss-borrar-cuenta` le quita Apple con `DELETE
   /auth/v1/user/identities/{id}`, que sin esto responde 404
   (`manual_linking_disabled`).
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

- el cambio 4 de la lista de arriba (borrar solo la cuenta de Ascent, con
  `moss.desvincular()` cuando el usuario de Auth es el mismo), antes de que
  Moss salga;
- su lado de D27 (el cambio 17).
