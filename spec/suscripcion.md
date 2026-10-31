# La suscripción (D40)

Lo pediste el 31/10/2026, con los números. Está como maqueta en la galería, sin
código de compras: `galeria/src/suscripcion.js`, sección 1.1. Cambia algo decidido
(«global y gratis»): `CLAUDE.md` y `especificacion.md` se corrigen cuando se programe.

## Qué es gratis y qué es Premium

| Gratis, siempre | Premium |
|---|---|
| Registrar comida | Ajuste semanal de las metas |
| Hábitos y cielo | Plan de comidas |
| Peso | Sueño avanzado y hora de dormir |
| | «Todo lo de hoy» |

**USD 4,99 por mes o USD 29,99 por año, con 7 días gratis.** El anual equivale a
USD 2,50 por mes.

**Lo que no nombraste y queda así en la maqueta** (es una propuesta, se cambia si
querés):

- **Registrar comida** incluye buscar, la voz, el código de barras y la etiqueta:
  es lo más usado y lo que hace volver a la app.
- **Sin el ajuste semanal**, la meta es la del cuestionario y se cambia a mano.
- **Sueño gratis:** cuánto dormiste anoche. **Premium:** calidad, deuda,
  regularidad, la noche sin reloj y Afinar.
- **Peso gratis:** el peso y su tendencia. El camino a la meta y los gráficos de
  Progreso no están en tu lista: faltan decidir.
- **Los widgets y la conexión con Ascent:** gratis por ahora.

## El orden de la entrada

Introducción, datos, **iniciar sesión**, cuestionario, tu meta y recién ahí
**suscribirse**. Hasta la meta, ya es el orden de hoy (`entrada.js`, `Entrada.tsx`).
«Seguir con lo gratis» se ve tanto como el botón de empezar: nadie queda obligado.

## La pantalla, con lo que pide Apple

Lo que pide [S1] y cómo está en la maqueta:

- **Nombre, duración y lo que da:** «Moss Premium», «Anual», la lista.
- **El precio que se cobra, lo más visible:** «USD 29,99 al año» es lo más grande.
  «USD 2,50 por mes» va abajo y en chico: Apple pide que lo equivalente quede
  subordinado.
- **La prueba:** cuánto dura y lo que se cobra después, junto al botón.
- **Restaurar compras**, y los enlaces a los términos y a la privacidad.
- **Lo que suma Moss:** avisa dos días antes de que termine la prueba. Da confianza
  y evita reclamos.

En la app, los precios los da StoreKit en la moneda de cada país: nunca se escriben a
mano. La hoja de confirmar la pone iOS; la de la galería es un dibujo.

## Lo que tenés que cargar en App Store Connect

Tiene que hacerlo quien es Account Holder: yo no acepto acuerdos ni cargo datos de
banco. Lo demás (los productos, los textos) puedo cargarlo por la API cuando me
digas.

**1. Para poder cobrar (solo vos)**

1. **Business › Agreements:** aceptar el Paid Apps Agreement. Hasta que no esté
   activo, no se puede vender.
2. **Banco e impuestos:** la cuenta donde cobrar y los formularios fiscales de
   Estados Unidos (para quien no vive allá, W-8BEN). Lo que corresponde pagar en cada
   país conviene verlo con tu contador.
3. **Small Business Program** [S2]: 15 % de comisión en lugar de 30 %. Se inscribe
   después del acuerdo, listando las cuentas asociadas. Conviene antes de la primera
   venta: el ajuste corre desde 15 días después del fin del mes fiscal en que te
   aprueban.
4. **El estado de comerciante de la UE (DSA)**, que sigue pendiente desde la 1.0.

**2. La suscripción** [S3]

En Monetization › Subscriptions, un grupo y dos productos:

| | Mensual | Anual |
|---|---|---|
| Reference Name | Moss Premium mensual | Moss Premium anual |
| Product ID | `uy.moss.premium.mensual` | `uy.moss.premium.anual` |
| Duration | 1 month | 1 year |
| Price | USD 4.99 | USD 29.99 |
| Oferta de introducción | Free, 1 semana | Free, 1 semana |

- **El grupo:** «Moss Premium». Uno solo: cada persona tiene una suscripción activa
  por grupo, y así se pasa de mensual a anual sin duplicar.
- **Países:** los mismos de la app. Apple calcula los precios locales desde USD; hay
  que mirar los de Uruguay y los más vendidos.
- **Textos** del grupo y de cada producto, en en-US, es-MX y es-ES (Display Name y
  Description). Español: «Moss Premium» y «Metas semanales, plan de comidas y sueño
  completo». Inglés: «Moss Premium» y «Weekly goals, meal plan and full sleep».
- **Review Information:** una captura de la pantalla de Premium, desde una build, y
  una nota para quien revisa.
- **Family Sharing:** apagado por ahora. Una vez prendido no se puede apagar.
- **La primera suscripción y el primer grupo van con una versión nueva de la app**
  [S3]: se agregan en la página de la versión, con «Add for Review».

**3. Para probar y para que el servidor sepa quién pagó**

- **Sandbox:** Users and Access › Sandbox, una cuenta de prueba.
- **La clave de In-App Purchase:** Users and Access › Integrations. Es un `.p8`, como
  el de Sign in with Apple: nunca va a Git (`*.p8` ya está en `.gitignore`).
- **App Store Server Notifications**, versión 2, en App Information: la URL de una
  función nueva de Supabase, en producción y en sandbox.

**4. La ficha**

- **App Privacy:** sumar «Purchases» (Purchase History), ligado a la cuenta, si el
  servidor guarda quién es Premium.
- **Pricing:** la app sigue gratis para bajar; «In-App Purchases» aparece solo.
- **Descripción y notas:** lo de abajo.

## Qué cambia en la ficha

`spec/revision.md`, cuando se programe:

- **«Lo demás de la ficha»:** «Precio: gratis. Sin compras.» pasa a «Gratis para
  bajar, con suscripción opcional».
- **La descripción, al final, en los tres idiomas** (Apple pide los enlaces en la
  metadata) [S1]:

  > Moss Premium: USD 4,99 por mes o USD 29,99 por año, con 7 días gratis. El cobro va
  > a tu cuenta de Apple y se renueva solo salvo que lo canceles al menos 24 horas antes
  > de que termine el período. Se administra en Ajustes. Términos:
  > https://condezuzu.github.io/moss-app/terminos/ · Privacidad:
  > https://condezuzu.github.io/moss-app/privacidad/

- **Las notas para quien revisa:** «Free, with no ads, no in-app purchases and no
  tracking» pasa a «Free to download with an optional subscription; no ads and no
  tracking». Y una línea para llegar a Premium: al terminar la entrada o desde Perfil.
- **Las capturas:** al menos una con lo que da Premium; los precios no van en las
  capturas.

## Qué cambia en los términos y la privacidad

`docs/terminos/` y `docs/en/terms/`, que se publican recién con la versión que cobra:

- **El resumen:** «Moss es gratis, sin anuncios» pasa a «Lo básico de Moss es gratis y
  sin anuncios. Premium es una suscripción opcional».
- **La sección 10:** la licencia ya no dice «gratuita».
- **La sección 11:** «Moss se ofrece gratis y “tal cual”» pasa a «Moss se ofrece “tal
  cual”».
- **Una sección nueva, «Moss Premium»:**
  - qué incluye, el precio, y que la prueba es una por persona;
  - que el cobro y la renovación los hace Apple, cuándo se cancela y cómo;
  - que los reembolsos se piden a Apple;
  - que al cancelar sigue hasta el fin del período, tus datos quedan y Premium se
    apaga;
  - que un cambio de precio se avisa antes, como manda Apple.
- **La privacidad** (`docs/privacidad/`, `docs/en/privacy/`): Moss no ve la tarjeta;
  guarda si la cuenta tiene Premium y hasta cuándo.

Conviene que un abogado mire estos textos antes de cobrar: Uruguay y la UE tienen
reglas propias para las suscripciones y el derecho a arrepentirse.

## Lo que falta decidir

- **Quien ya usa Moss 1.0, que salió gratis:** hoy tiene todo eso. Mi recomendación:
  quien tenga cuenta antes de que salga Premium lo sigue teniendo gratis. Es lo que
  dijimos en la ficha, y sale barato: son los primeros. Se sabe por la fecha de la
  cuenta.
- **Lo que no nombraste**, arriba.
- **Cómo se arma el cobro:** RevenueCat (menos trabajo, y suma un tercero a la
  privacidad) o StoreKit con una función propia de Supabase.

## Cómo llega

- **Pide una build:** StoreKit es nativo. No va por OTA.
- **Primero la galería:** que apruebes la maqueta. Después, el cobro, lo que se
  bloquea en cada sección, la fila de Perfil y los textos de arriba.
- **La fecha de vencimiento se guarda en el teléfono y en la cuenta:** si no hay
  señal, Premium no se apaga de golpe.

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

## Fuentes

- [S1] Apple, suscripciones: https://developer.apple.com/app-store/subscriptions/
- [S2] Small Business Program: https://developer.apple.com/app-store/small-business-program/
- [S3] Crear una suscripción: https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions
- [S4] Códigos de oferta: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-offer-codes
