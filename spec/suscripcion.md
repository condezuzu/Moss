# La suscripción (D40)

Lo pediste el 31/10/2026, con los números, y aprobaste la maqueta ese mismo día
(`galeria/src/suscripcion.js`, sección 1.1). **Está programada en la rama `suscripcion`,
apagada**: pide una build y se prende con `PREMIUM_SALE` (abajo, «Cómo llega»). Falta
probarla con una compra de verdad, en el sandbox de Apple.

## Qué es gratis y qué es Premium

| Gratis, siempre | Premium |
|---|---|
| Registrar comida | Ajuste semanal de las metas |
| Hábitos y cielo | Plan de comidas |
| Peso | Sueño avanzado y hora de dormir |
| | «Todo lo de hoy» |

**USD 4,99 por mes o USD 29,99 por año, con 7 días gratis.** El anual equivale a
USD 2,50 por mes.

**Lo que no nombraste y quedó así** (lo aprobaste con la maqueta):

- **Registrar comida** incluye buscar, la voz, el código de barras y la etiqueta:
  es lo más usado y lo que hace volver a la app.
- **Sin el ajuste semanal**, la meta es la del cuestionario y se cambia a mano.
- **Sueño gratis:** cuánto dormiste anoche. **Premium:** calidad, deuda,
  regularidad, la noche sin reloj y Afinar.
- **Peso gratis:** el peso y su tendencia. El camino a la meta y los gráficos de
  Progreso quedan gratis mientras no digas otra cosa: no estaban en tu lista.
- **«Todo lo de hoy»** todavía no está en la app (D39, sin aprobar): cuando esté, va con
  su candado.
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
digas. **Sin esto, la compra no se puede probar ni en el sandbox.**

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

**3. Para probar**

- **Sandbox:** Users and Access › Sandbox, una cuenta de prueba.

**No hace falta** la clave de In-App Purchase ni las App Store Server Notifications: el
teléfono le pregunta a Apple directo, con StoreKit 2. Hacen falta recién si algún día
un servidor tiene que saber quién pagó (por ejemplo, para Moss en la web).

**4. La ficha**

- **App Privacy:** no cambia. Moss no guarda la compra ni la manda a ningún servidor.
- **Pricing:** la app sigue gratis para bajar; «In-App Purchases» aparece solo.
- **Descripción y notas:** lo de abajo.

## Qué cambia en la ficha

En `spec/revision.md` de la rama `suscripcion`, para pegar cuando se mande esa versión:

- **«Lo demás de la ficha»:** «Precio: gratis. Sin compras.» pasa a «Gratis para
  bajar, con suscripción opcional».
- **La descripción:** una parte nueva, «Moss Premium», antes de lo de mayores de 16 años,
  con qué es gratis, qué suma, el precio y cómo se renueva. Los enlaces a los términos y a
  la privacidad ya están al final, y Apple los pide en la metadata [S1].

- **Las notas para quien revisa:** «Free, with no ads, no in-app purchases and no
  tracking» pasa a «Free to download with an optional subscription; no ads and no
  tracking». Y una línea para llegar a Premium: al terminar la entrada o desde Perfil.
- **Las capturas:** al menos una con lo que da Premium; los precios no van en las
  capturas.

## Qué cambia en los términos y la privacidad

Ya están en `docs/` de la rama `suscripcion`, y se publican recién con la versión que cobra
(con la fecha de ese día):

- **El resumen:** «Moss es gratis, sin anuncios» pasa a «Lo básico de Moss es gratis y
  sin anuncios. Premium es una suscripción opcional».
- **Propiedad intelectual:** la licencia ya no dice «gratuita».
- **Sin garantías:** «Moss se ofrece gratis y “tal cual”» pasa a «Moss se ofrece “tal
  cual”».
- **Una sección nueva, la 9, «Moss Premium»:**
  - qué incluye, el precio, y que la prueba es una por persona;
  - que el cobro y la renovación los hace Apple, cuándo se cancela y cómo;
  - que los reembolsos se piden a Apple;
  - que al cancelar sigue hasta el fin del período, tus datos quedan y Premium se
    apaga;
  - que un cambio de precio se avisa antes, como manda Apple.
- **La privacidad** (`docs/privacidad/`, `docs/en/privacy/`): Moss no ve la tarjeta y no
  guarda la compra en sus servidores.

Conviene que un abogado mire estos textos antes de cobrar: Uruguay y la UE tienen
reglas propias para las suscripciones y el derecho a arrepentirse.

## Lo decidido (31/10/2026)

- **Quien ya usa Moss 1.0, que salió gratis, sigue con Premium gratis** (lo aprobaste).
  Es lo que dijimos en la ficha, y sale barato: son los primeros. Se sabe por la fecha
  de la cuenta, comparada con `PREMIUM_SALE`.
- **El cobro: StoreKit 2 con un módulo propio** (`app-intents/Compras.swift`), sin RevenueCat
  ni servidor. Menos datos, nada nuevo en la privacidad, anda sin conexión y sirve en
  cualquier aparato con el mismo Apple ID. Si alguien entra a su cuenta de Moss con otro
  Apple ID, ahí no ve Premium hasta que use el suyo: es lo que se resigna.

## Cómo llega

**Lo que hay en la rama `suscripcion`:**

- `app-intents/Compras.swift`: los precios, comprar, restaurar y lo que tiene comprado.
- `src/dominio/premium.ts`, con tests: quién lo tiene, la prueba y el aviso.
- `src/lib/premium.ts`: lo que dice Apple. Hasta que contesta no se muestra ningún candado,
  y lo que corre solo (el control, la noche, el aviso de dormir) espera.
- `src/secciones/premium/Premium.tsx`: la pantalla de la maqueta, y una tarjeta para Sueño y
  Progreso que **no estaba en la maqueta**: dice qué es de Premium y lleva a verlo. Está en
  la galería, para aprobarla.
- **Los candados:** el plan de comidas y la lista de compras, el ajuste semanal (la meta queda
  como estaba), el sueño avanzado y la noche sin reloj, y la hora de dormir (queda elegida,
  pero no suena).
- **Dos días antes de que termine la prueba, un aviso.** Al empezarla, Moss pide el permiso.

**Para prenderlo:**

1. Hacer lo de App Store Connect, arriba.
2. Poner el día de salida en `PREMIUM_SALE` (`src/lib/banderas.ts`): quien tenga cuenta de
   antes de ese día queda con Premium de regalo.
3. Una build, con la versión nueva: StoreKit es nativo y no va por OTA. Esa build corta las OTA
   a la build 6: a partir de ahí, `herramientas/verificar-huella.mjs` lleva su huella.
4. Probar la compra, cancelarla y restaurar con la cuenta de sandbox, en el iPhone.

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
