# La suscripción (D40)

**Decidida el 2/11/2026:** toda Moss es de pago, con 7 días de prueba gratis. USD 9,99 por
mes o USD 39,99 por año, con el anual como opción recomendada. Va con la próxima build. Está
programada y apagada: sin `PREMIUM_SALE`, Moss sigue gratis y nada cambia. La maqueta, para
aprobar, en la galería, sección 1.1 y «La entrada a la app».

Esto reemplaza lo aprobado el 31/10 (gratis más Premium, a USD 4,99 y 29,99, con partes
bloqueadas). Sigue de aquel día: quien ya tenía cuenta queda de regalo, y StoreKit sin servidor
ni terceros.

## El modelo

- **Una sola regla** (`acceso()` en `src/dominio/premium.ts`). Con acceso (prueba, activa o
  regalo) se tiene todo; sin acceso (nueva o vencida), la pantalla de pago. **Nada se bloquea
  por partes.**
- **El precio.** El anual se muestra como USD 3,33 por mes y «Ahorras 67 %» (119,88 contra
  39,99; lo comprueba un test). Lo real lo da StoreKit (`displayPrice`), en la moneda de cada
  país: el precio por mes y el ahorro se calculan del precio real. Lo escrito a mano
  (`PRECIOS`) es solo el respaldo sin conexión y la maqueta.
- **La prueba:** 7 días, una por cuenta de Apple (lo controla Apple, por grupo de suscripciones).
- **El aviso del día 5 existe de verdad:** `avisoDePrueba` da la fecha y lo programa
  `src/recordatorios/programar.ts`, también desde la tarea de fondo. Necesita el permiso de avisos:
  se pide al empezar la prueba, la línea de tiempo dice «si permites los avisos», y sin permiso la
  pantalla de después dice la fecha y que no se le va a poder recordar. Si cancela, no suena.
- **Lo que Moss promete de comida y sueño existe de verdad:** el ejemplo de la pantalla de pago es
  `lineaDeNocheCorta` (`src/dominio/alrededorDelEntreno.ts`), la regla C2 de
  [`entreno.md`](entreno.md): con menos de 6 horas, en la primera comida sin anotar, «Dormiste 5 h
  40: es normal tener más hambre hoy». Sale solo con la suscripción prendida. Con «sin déficit», con
  una noche estimada sin confirmar o que parece cortada, no sale.

### Lo que decidí, y por qué

- **Quien ya tenía cuenta: la fecha de su identidad de Apple en Supabase.** Se compara con
  `PREMIUM_SALE` (`cuentaDeMossDesde` y `esDeRegalo`). No es una marca del teléfono: la pone el
  servidor al crear la identidad, no cambia, sobrevive a reinstalar y a un teléfono nuevo, llega con
  cada sesión y cada renovación del token, y queda guardada con la sesión, así que anda sin
  conexión. **No sirve `created_at` del usuario:** Moss y Ascent comparten `auth.users`, y si el
  correo de Apple es el de una cuenta de Ascent, Supabase une las dos ([`ascent.md`](ascent.md),
  «Dos cuentas»): alguien de Ascent que entra a Moss después de prenderla parecería de antes. La
  identidad de Apple sí es de Moss, porque Ascent entra con correo. **Si Ascent suma Sign in with
  Apple** (el cambio 5 de `ascent.md`), esto deja de alcanzar: hay que elegir otra señal, igual que
  para saber de qué app es una cuenta. Si borra la cuenta y crea otra, la nueva ya no es de regalo.
- **Cuando vence o cancela: la pantalla de pago, sin modo de solo lectura.** Es lo más simple: una
  sola regla y ningún estado a medias que probar en cada sección. No se borra nada; dice «Tus datos
  siguen aquí, a salvo» y deja a la vista exportar, cerrar sesión y borrar la cuenta, sin pagar. Los
  avisos dejan de sonar (lo elegido queda) y los widgets siguen con lo último; al tocarlos, la pantalla
  de pago. Si se vuelve a suscribir, todo sigue como estaba.
- **Sin conexión nadie queda afuera.** Apple guarda en el teléfono lo vigente, con la gracia de un
  pago que falló. Lo único que no puede saber sin conexión es que renovó: si Apple no da nada por
  vigente, la última que se conoce renovaba y la App Store no contesta, sigue adentro hasta 7 días
  después de la fecha que se sabe. Si Apple no contesta nada, no aparece la pantalla de pago. Quien
  nunca se suscribió y no tiene conexión ve los precios en dólares, «Sin conexión» y «Reintentar».
- **«Saltar» lleva a lo que cuesta, no al cuestionario.** El cuestionario es trabajo: nadie lo
  contesta sin saber que Moss es de pago (guía 3.1.2(a), nada de trampas). Lo que cuesta es la última
  pantalla de la introducción y no se saltea.
- **La cuenta, en la pantalla de pago.** Para quien recién llega, «Tu cuenta» es un enlace más al
  lado de Restaurar, Términos y Privacidad, y abre la hoja de acciones de iOS; un «Borrar mi cuenta»
  en rojo arriba del precio asusta a quien nunca pagó. Para quien venció va a la vista, debajo del título.
- **Los productos se llaman `uy.moss.suscripcion.anual` y `.mensual`.** Los de antes
  (`uy.moss.premium.*`) nunca se crearon, y un Product ID no se puede cambiar ni volver a usar.
- **El regalo se dice una vez**, con una pantalla: «Para ti, Moss sigue gratis». Quien ya usa Moss va
  a ver en la tienda que ahora es de pago, y no tiene que preguntarse nada.

## El orden de la entrada

Introducción, tus datos, **iniciar sesión**, cuestionario, meta y **pantalla de pago**
(`galeria/src/entrada.js`, `src/secciones/entrada/Entrada.tsx`). Sin `PREMIUM_SALE`, la de siempre.

La introducción: la frase, **Anota en segundos** (lo dicho, la luna que se llena), **Comida de
verdad, sin adivinar** (la base, sin IA de fotos), **Tu sueño, también**, **Comida y sueño,
juntos**, **Tus hábitos son estrellas** (el cielo real) y **Pruébala 7 días, gratis** (lo que
cuesta). La estrella guía hace algo en cada una: vueltas a la luna, baja por los resultados, cruza
la noche, une la noche con el día, camina la prueba.

## La pantalla, con lo que pide Apple

Lo que piden [S1] y el Apple Developer Program License Agreement, Schedule 2, 3.8(b) [S5]:

| Lo que piden | Dónde está |
|---|---|
| Nombre de la suscripción | «Moss anual», «Moss mensual», en cada plan |
| Duración | «por año», «por mes», debajo de cada precio |
| Precio de renovación completo, claro y en la moneda local | El número grande de cada plan, de StoreKit, y otra vez en la línea de abajo |
| Lo que se cobra es lo más destacado; lo equivalente y el ahorro, subordinados en lugar y tamaño | USD 39,99 a 22 puntos; «USD 3,33 por mes» y «Ahorras 67 %» a 11,5, debajo |
| Cuánto dura la prueba y lo que se cobra después | Junto al botón: «Gratis 7 días. Después, USD 39,99 por año. Cancela cuando quieras en Ajustes.» |
| Qué recibe por el precio (3.1.2(c)) | «Incluye todo Moss» y la lista |
| Restaurar compras | Abajo, siempre a la vista, y en Tu suscripción |
| Enlaces a Términos y Privacidad que funcionen | Abajo, siempre a la vista, y en Tu suscripción; en la ficha, los dos |
| Administrar la suscripción | Perfil › Tu suscripción › Administrar en Ajustes |
| Avisar al borrar la cuenta que el cobro sigue [S6] | El aviso de borrar la cuenta, con «Administrar suscripción» (`avisoAlBorrarLaCuenta`) |

Los planes, el botón y lo legal van en un pie fijo: se ven aunque el teléfono sea chico.

## Lo que tienes que cargar en App Store Connect para cobrar

El paso 1 solo lo puede hacer quien tiene el rol de Account Holder (tú): nadie más acepta acuerdos ni
carga datos de banco. Sin el paso 1, la compra no se puede probar ni en el sandbox. Los pasos 2 a
5 se pueden cargar por la API si me lo pides.

### 1. Para poder cobrar (Account Holder)

1. **Business › Agreements:** acepta el **Paid Apps Agreement**. Hasta que su estado sea *Active*, no
   se puede vender.
2. **Business › Bank Accounts:** agrega la cuenta donde cobrar.
3. **Business › Tax Forms:** completa los formularios de Estados Unidos (viviendo fuera de allá,
   **W-8BEN**) y los que te pida para otros países. Lo que corresponde pagar en Uruguay conviene verlo
   con tu contador.
4. **Small Business Program** (recomendado, antes de la primera venta) [S2]: 15 % de comisión en lugar de
   30 %. Te anotas después de aceptar el acuerdo, con la lista de cuentas asociadas. El ajuste corre desde
   15 días después del fin del mes fiscal en que te aprueban.
5. **Estado de comerciante de la UE (DSA):** sigue pendiente desde la 1.0. Sin él, Moss no se vende en
   la UE.

### 2. El grupo de suscripciones

En **Monetization › Subscriptions**, el botón **+**:

- **Reference Name:** `Moss`. Un solo grupo: cada persona tiene una suscripción activa por grupo, y
  así pasa de mensual a anual sin pagar las dos.
- **Display Name** del grupo (en *Subscription Group Localization*, en **English (U.S.)**, **Spanish
  (Mexico)** y **Spanish (Spain)**): `Moss`.

### 3. Los dos productos

Adentro del grupo, **Create** y después **+**:

| Campo | Anual | Mensual |
|---|---|---|
| Reference Name | `Moss anual` | `Moss mensual` |
| Product ID | `uy.moss.suscripcion.anual` | `uy.moss.suscripcion.mensual` |
| Subscription Duration | 1 Year | 1 Month |
| Subscription Prices (moneda base USD) | 39.99 | 9.99 |
| Availability | Los mismos países de la app | Los mismos países de la app |
| Family Sharing | Apagado (una vez prendido no se apaga) | Apagado |
| Tax Category | La de la app | La de la app |

- **El Product ID tiene que ser exactamente ese:** está en `src/dominio/premium.ts`, no se puede
  cambiar después y no se puede volver a usar.
- **La duración tampoco se cambia** después de mandarla a revisión.
- **Precios locales:** Apple los calcula desde USD. Mira los de Uruguay y los países que más te
  importen, en *View all Subscription pricing*. La pantalla los toma de Apple, con su moneda y sus
  decimales: el ahorro y el precio por mes se recalculan solos.
- **Niveles** (*Edit Order*): los dos en el **mismo nivel**. Es lo mismo con distinta duración.

### 4. La prueba de 7 días, en cada producto

En cada uno, **Subscription Prices › View all Subscription pricing › Set up Introductory Offer**:

1. **Countries or regions:** todos, **Next**.
2. **Start Date:** hoy o el día que salga. **End Date:** sin fecha de fin (si el formulario la pide,
   lo más lejos que deje; hay que renovarla antes de que termine). **Next**.
3. **Type:** **Free**. **Duration:** **1 Week**. **Next** y **Confirm**.

Una oferta no se edita: para cambiarla se borra y se crea otra. Apple da una sola prueba por persona
y por grupo. Si un país queda sin oferta, la pantalla muestra «Suscribirme» sin prometer prueba.

### 5. Los textos y la revisión de cada producto

En **Display Name and Description › Add** (Display Name, hasta 30 caracteres; Description, hasta 45; sin
marcas ni caracteres especiales):

| Idioma | Producto | Display Name | Description |
|---|---|---|---|
| Spanish (Mexico) y Spanish (Spain) | Anual | `Moss anual` | `Toda Moss: comida, sueño y hábitos` |
| Spanish (Mexico) y Spanish (Spain) | Mensual | `Moss mensual` | `Toda Moss: comida, sueño y hábitos` |
| English (U.S.) | Anual | `Moss yearly` | `All of Moss: food, sleep and habits` |
| English (U.S.) | Mensual | `Moss monthly` | `All of Moss: food, sleep and habits` |

En **Review Information**, en cada producto:

- **Screenshot:** la pantalla de pago sacada de la build (una sirve para los dos), en un tamaño de
  captura de iPhone de la ficha. No se ve en la tienda.
- **Review Notes:** `Unlocks the whole app. Shown after onboarding. To test: tap "Start 7 days free" with a sandbox account.`

Cuando le falte nada, el estado de cada uno pasa a **Ready to Submit**.

### 6. La versión y la ficha

1. **La primera suscripción y el primer grupo van con una versión nueva de la app** [S3]. Crea la
   versión con la build que trae `Compras`, y en su página, en **In-App Purchases and Subscriptions**,
   agrega los dos productos (*Add for Review* en cada uno). Si no van ahí, no se revisan.
2. **Descripción, texto promocional y notas para quien revisa:** los de [`revision.md`](revision.md),
   «d» y «f». La descripción dice que es de pago con 7 días gratis y lleva los enlaces a Términos y a
   Privacidad, que Apple pide en la ficha.
3. **App Information › Privacy Policy URL:** la de siempre, en cada idioma. **License Agreement:**
   queda el estándar de Apple: los términos lo nombran y sus enlaces van en la descripción.
4. **Pricing and Availability:** la app sigue en **Free**; la tienda agrega sola «Compras dentro de la
   app».
5. **App Privacy:** no cambia. Moss no guarda la compra ni la manda a ningún servidor.
6. **Las capturas:** sin precios ni «gratis», como siempre.

### 7. Para probarlo antes de mandarlo

1. **Users and Access › Sandbox › Test Accounts:** crea una cuenta de prueba con un correo que no sea
   de Apple.
2. En el iPhone, con una build de TestFlight o `telefono` que tenga `Compras`: **Ajustes › Desarrollador ›
   Sandbox Apple Account** (o en App Store, abajo), entra con esa cuenta. No hace falta salir de la tuya.
3. Prueba: empezar la prueba, cancelarla en la hoja de Apple, empezar de nuevo, cancelar en Ajustes,
   dejarla vencer y restaurar. En sandbox el tiempo corre mucho más rápido: una prueba de una semana dura
   unos minutos, así que sirve para ver la pantalla de cuando vence, y **el aviso del día 5 no se puede ver
   ahí**: suena a los dos días antes de la fecha que da Apple, y en sandbox esa fecha ya pasó.

**No hace falta** la clave de In-App Purchase ni las App Store Server Notifications: el teléfono le
pregunta a Apple directo, con StoreKit 2. Hacen falta recién si algún día un servidor tiene que saber
quién pagó (por ejemplo, para Moss en la web).

## Qué cambia en los términos y la privacidad

Ya está en `docs/`, y **se publica recién con la versión que cobra** (con la fecha de ese día, en
«Última actualización»): copiar `docs/` al repo público `condezuzu/moss-app`.

- **El resumen y «Qué es Moss»:** de pago, con 7 días gratis y sin anuncios.
- **La sección 9, «La suscripción»:** los planes y el precio, la prueba, el cobro y la renovación,
  cancelar y cambiar de plan, qué pasa cuando termina, otro iPhone, los reembolsos (Moss no hace: los
  maneja Apple), los cambios de precio y quien ya tenía cuenta.
- **Tu cuenta:** se puede borrar sin suscripción, y borrarla no cancela el cobro.
- **La privacidad:** Moss no ve la tarjeta, la compra no se guarda en sus servidores, la fecha de la
  cuenta dice si es de regalo, y terminar la suscripción no borra los datos.
- **La portada:** lo que cuesta y cómo cancelar.

**Conviene que un abogado mire estos textos antes de cobrar:** Uruguay y la UE tienen reglas propias
para las suscripciones y el derecho a arrepentirse.

## Cómo llega

**Lo que hay:**

- `app-intents/Compras.swift`: los precios, comprar, restaurar, lo vigente y la última que se conoce.
  **Sin compilar todavía:** en Windows no se puede; la primera build lo dice.
- `src/dominio/premium.ts`, con tests: la regla de acceso, el regalo, la prueba y el aviso, el precio por mes
  y el ahorro.
- `src/lib/premium.ts`: lo que dice Apple. Hasta que contesta no aparece la pantalla de pago.
- `src/secciones/premium/Premium.tsx`: la pantalla de pago, encima de todo, y la hoja «Tu suscripción».
- `src/secciones/entrada/`: la introducción más larga y «Saltar».
- `lineaDeNocheCorta`, en Comida.
- En la web, una tienda de mentira: `EXPO_PUBLIC_PREMIUM_SALE=2026-12-01 npx expo export --platform web`.

**Para prenderlo:**

1. Hacer lo de App Store Connect, arriba.
2. Aprobar la maqueta en la galería.
3. Poner el día de salida en `EXPO_PUBLIC_PREMIUM_SALE` (`src/lib/banderas.ts`), en las variables de EAS: quien
   tenga cuenta de antes de ese día queda de regalo.
4. Una build, con la versión nueva: StoreKit es nativo y no va por OTA. El Swift de `app-intents/` no cambia la
   huella, así que las OTA les llegan a las dos; en la build que no tiene `Compras`, Moss sigue abierta y sin
   pantalla de pago. Desde esa build, toda OTA tiene que salir de una rama con la suscripción: si no, la saca.
5. Probar con la cuenta de sandbox (el paso 7).
6. Publicar `docs/` con la fecha de ese día, y mandar la versión con los dos productos.

## Para más adelante: la publicidad (lo pediste el 31/10/2026)

Una **animación de Moss** para publicidad, con un **código de oferta de Apple de dos
semanas gratis**:

- **La animación** se puede sacar de la galería: el cielo, la estrella y la
  constelación que se conecta son los mismos shaders.
- **El código** [S4]: en Subscriptions, en cada producto, Offer Codes, tipo Free.
  - **Custom code** (como `MOSS14`): un solo nombre para toda la campaña, sin
    caracteres especiales, hasta 25.000 canjes por tanda.
  - Hasta 1 millón de códigos por trimestre en la app, 10 ofertas activas por producto
    y un canje por persona en cada oferta.
  - El enlace se copia de la página de la oferta. Una oferta no se edita: se crea otra.
  - **A confirmar en el desplegable de App Store Connect:** que esté la duración de 2
    semanas. Las páginas de Apple que pude leer no traen la lista.
- **Con la prueba de 7 días:** Apple pregunta si quien canjea recibe primero la prueba.
  Con «No», son 14 días y después el precio normal, no 21.
- **Para canjear dentro de la app** hace falta un botón «Canjear código» (StoreKit).

## Fuentes (consultadas el 2/11/2026)

- [S1] Apple, suscripciones: lo que debe tener la pantalla, lo que se cobra como lo más destacado, la prueba:
  https://developer.apple.com/app-store/subscriptions/
- [S2] Small Business Program: https://developer.apple.com/app-store/small-business-program/
- [S3] Crear una suscripción:
  https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions
- [S4] Códigos de oferta: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-offer-codes
- [S5] Apple Developer Program License Agreement, Schedule 2, 3.8:
  https://developer.apple.com/support/terms/apple-developer-program-license-agreement/
- [S6] Borrar la cuenta con una suscripción: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- [S7] Oferta de introducción:
  https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions
- [S8] Guías de revisión 3.1.1, 3.1.2 y 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
