# Decisiones

Primero las que esperan tu respuesta, después las resueltas y al final las que
tomé por mi cuenta para poder avanzar (cualquiera se puede revertir).

## Pendientes

### D5 · La riqueza del cielo: cuándo crece

El progreso es el cielo: la riqueza va de 0 a 1 y sale de la luz juntada desde
siempre, con una curva que crece rápido al principio y cada vez más despacio.
Nunca baja.

| Riqueza | Luz juntada | Más o menos |
|---|---|---|
| 0 | 0 | el primer día |
| 0,2 | 56 | una semana |
| 0,4 | 200 | un mes |
| 0,6 | 564 | tres meses: el cielo que ya aprobaste |
| 0,8 | 1.450 | siete meses |
| 1 | 3.650 | un año y medio: el cielo pleno |

El tiempo está contado con unos 7 de luz por día.

Un día suma muy poca riqueza, así que el crecimiento se tiene que *ver*, no solo
acumular. Propongo:

- **A (recomendada): de noche.** La luz de hoy se suma al cielo de mañana. Al
  abrir Moss el día siguiente, el cielo crece frente a vos en dos segundos, sin
  texto: aparecen las estrellas nuevas, sube el musgo y la vía láctea gana un
  poco de brillo. Es un ritual diario y no le quita lugar al momento del día
  completo.
- **B: al instante**, apenas termina la animación del día completo.

Además:

- **La entrada usa el cielo de 0,6**, el más lindo que aprobaste, como promesa.
  El cielo propio arranca en 0.
- **Después de un año y medio** el cielo está pleno. Para más adelante: fenómenos
  raros que aparecen de vez en cuando (un cometa que pasa, un eclipse).

Se puede probar en la galería con el deslizador «Riqueza del cielo».

### D6 · Los nombres de los logros

Pediste otro enfoque sin mitología. Propongo **fenómenos reales del cielo
nocturno y del musgo**, elegidos para que el fenómeno cuente el logro sin
narrarlo. Cada logro tiene su nombre y una línea que dice qué lo ganó.

| Logro | Qué lo gana | Por qué ese nombre |
|---|---|---|
| Primera luz · *First Light* | tu primer hábito encendido | así se llama la primera observación de un telescopio nuevo |
| Constelación · *Constellation* | tu primer día completo | — |
| Luna llena · *Full Moon* | 30 noches completas | un ciclo lunar dura 29,5 días |
| Cometa · *Comet* | volver después de una semana sin actividad | los cometas se van y vuelven |
| Solsticio · *Solstice* | tu día con más luz | el día más largo |
| Esporas · *Spores* | tus primeros 7 días con luz | — |
| Tapiz · *Carpet* | 100 días con luz | el musgo cubre el suelo de a poco |
| Aurora · *Aurora* | 100 noches completas | — |
| Vía láctea · *Milky Way* | llegar al cielo pleno | — |
| Liquen · *Lichen* | vincular Moss con Ascent | un liquen son dos seres que viven como uno |
| Luna nueva · *New Moon* | tu primera comida registrada | — |
| Marea · *Tide* | 30 días llegando a la proteína | la luna mueve las mareas, y la comida es la luna |
| Hora azul · *Blue Hour* | 30 noches acostándote antes de tu hora | — |

Todos cuentan días o noches **acumulados, nunca seguidos**: Moss no tiene rachas.

Otras opciones que descarté:

- **Nombres que describen** («30 noches completas»): claros pero planos.
- **Nombres de estrellas** (Vega, Sirio): astronómicos pero arbitrarios.

### D7 · Qué parte de la comida entra en la v1

La entrada es obligatoria y ya calcula las metas, así que la comida entra en la
v1. Para no frenar la revisión de Apple propongo:

- **En la v1:**
  - cuestionario, metas y control semanal;
  - peso desde Salud y a mano;
  - buscador (USDA más nombres en español) con porciones;
  - código de barras (Open Food Facts) y crear producto desde la etiqueta;
  - historial y frecuentes, y copiar una comida o un día;
  - carga manual;
  - hábitos de comida;
  - la zona de la comida.
- **En la v1.1:** recetas y comidas propias armadas, foto de la comida y escribir
  la comida en Salud.

**Base de datos:** tu idea está bien, con un ajuste en cómo se usa cada una:

- **USDA FoodData Central** (FNDDS más SR Legacy) va **adentro de la app** como
  base para buscar.
- **Open Food Facts** se usa **solo para escanear**, desde el teléfono y
  guardando lo escaneado.
- **Los nombres en español** son una lista curada a mano de 500 a 1.000
  alimentos, con alias regionales sacados de Wikidata y revisados.

Todo el detalle está en [`nutricion.md`](nutricion.md).

### D8 · Widgets en la v1.1

Se puede, con `expo-widgets` (el de Expo, para el SDK 58):

- **Chico:** el cielo de hoy.
- **Mediano:** el cielo con hasta 4 botones «hecho».

Primero una prueba de un día en una build `dev`. Lo propongo para la v1.1, apenas
después de la revisión, porque cambia la build nativa. Detalle en
[`widgets.md`](widgets.md).

### D9 · La entrada

Está en la galería, sección 2.

- **Cuenta:** Sign in with Apple y correo con contraseña.
  - Correo y contraseña es lo que usa Ascent, así que la misma cuenta entra en
    las dos.
  - Sin Google: obligaría a Sign in with Apple por la regla 4.8, y Ascent lo sacó.
  - Apple acepta el inicio de sesión obligatorio porque la cuenta sirve para algo
    de verdad: guardar y sincronizar, Ascent y, después, los amigos.
  - Hay que poder borrar la cuenta desde la app y revocar el token de Apple al
    hacerlo.
- **Salud primero en el cuestionario.** En tu lista iba al final. Lo puse
  primero porque, si se conecta, la edad, el sexo, la altura y el peso llegan
  completos. Si lo preferís al final, es un cambio chico.
- **Agregué el ritmo** cuando el objetivo es bajar o subir, como MacroFactor: por
  defecto, «recomendado».
- **La frase y las diapositivas pasan tocando**, cuando se llena el aro (como el
  circulito de Ascent), o solas. En la galería están las dos.

### D3 · Varios días con la misma cantidad de hábitos (importante)

Lo más común va a ser tener los mismos hábitos todos los días: entonces los siete
días tienen la misma cantidad y piden siete constelaciones distintas de esa
cantidad. El catálogo real ([`catalogo.md`](catalogo.md)) tiene como mucho
**cuatro por cantidad**.

Opciones:

1. **Repetir**: dos días con la misma constelación, cada uno con su progreso.
2. **Sumar asterismos tradicionales** de las constelaciones grandes (el Cinturón
   de Orión, el Gran Cuadrado de Pegaso, la Hoz de Leo, la Tetera de Sagitario,
   la Cruz del Norte…). Así se llega a unas siete por cantidad entre 3 y 8. Desde
   el cambio de foco ya no necesitan un mito propio, así que hay más para elegir.
3. **Usar la cantidad vecina** con estrellas que no son hábitos. Rompe la regla de
   la especificación.

Recomiendo la 2, y la 1 solo como último recurso.

### D4 · El lema

"Do so much volume that it will be unreasonable to fail" circula atribuida a
Alex Hormozi. Como frase del día va atribuida. Si va a ser el lema de la tienda,
conviene confirmar el origen o escribir uno propio.

### Las de la galería

Están en la galería, sección 6, «Para decidir»:

- cuándo crece el cielo (D5);
- el cielo de la entrada;
- la luna de la comida;
- cómo pasan las diapositivas;
- las tipografías;
- el color de la aurora;
- la orientación.

## Resueltas

### D1 · Supabase: el proyecto de Ascent, con un esquema `moss` (cambió)

Me pediste que lo resuelva yo, con el pedido nuevo: una sola cuenta, una sola
lista de amigos, un solo peso y funciones que cruzan los datos de las dos apps.
Con eso, compartir el proyecto es más simple y más seguro que tender puentes
entre dos.

- Moss vive en el esquema `moss` y nunca toca `public`.
- La cuenta es la misma.
- **Vincular** es dar permiso para compartir datos.
- Toda lectura cruzada pasa por funciones que revisan el vínculo.

Los riesgos que había anotado antes tienen arreglo, uno por uno:

- el trigger de altas;
- borrar la cuenta;
- los correos;
- las migraciones.

Está todo en [`ascent.md`](ascent.md), con los cambios del repo de Ascent y lo
que tenés que hacer vos.

### D2 · Entrar sin registrarse (reemplazada)

La entrada nueva es obligatoria y pide la cuenta antes del cuestionario. Ya no
hacen falta las cuentas anónimas.

## Tomadas por mi cuenta

- **Expo SDK 58** (la última, React Native 0.88). Reanimated 4 exige la Nueva
  Arquitectura, que ya viene prendida.
- **Identidad y builds:**
  - `uy.moss.app`, siguiendo a `uy.ascent.app`.
  - Dueño de EAS `condeag`.
  - Perfiles de EAS con los mismos nombres y la misma lógica que Ascent
    (`environment: preview` en todos, variables en el panel de EAS).
- **Código en español**, como Ascent. **Interfaz en español neutro** (tú, nunca
  vos) e inglés.
- **Local primero**: el teléfono es la fuente inmediata y Supabase guarda y
  sincroniza.
- **Datos de Salud:**
  - Sin vínculo, quedan en el teléfono: a Supabase sube si el hábito se cumplió
    y el número que se muestra.
  - Con Ascent vinculada y con permiso, también suben el resumen del sueño de
    cada noche y el peso, que la otra app necesita.
- **Un solo juego de shaders** para la galería y la app (`src/cielo/shaders`).
- **Sin mitos en la app.** El catálogo conserva las constelaciones y
  asterismos reales, pero se sacaron:
  - los resúmenes de mitos, el héroe y la figura de cada entrada;
  - los nombres griegos;
  - la tipografía GFS Didot.

  Quedan en el historial de git por si algún día sirven: el último commit que los
  tiene es `fed8acd`, y la figura de la lira también.
- **Sin la figura de la lira en el día completo.**
  - El día completo es la constelación que se conecta y la aurora que sube.
  - La figura dibujada era iconografía del mito.
  - Además, pedía dibujar 52 figuras.
- **El cielo que crece**: además de la curva de D5, lo que cambia con la
  riqueza (de 0 a 1):
  - **Estrellas:** la densidad de cada capa va de la mitad a 1,3 veces.
  - **Vía láctea:** el brillo va de 0,45 a 1,2.
  - **Aurora:** el brillo va de 0,55 a 1,35 y la altura de los rayos de 0,7 a 1,4.
  - **Musgo:** crece con la riqueza.

  Una estrella que ya estaba nunca se mueve ni se apaga, y cada loma de musgo
  tiene su propio azar: al crecer, solo se suma lo nuevo.
- **La estrella fugaz nueva**:
  - **Nacimiento:** la estela nace con la cabeza y nunca es más larga que lo
    recorrido.
  - **Forma:** se afina hacia atrás, pasa del blanco cálido a un verde tenue y
    deja chispas fijas.
  - **Final:** queda medio segundo después de apagarse.
  - **Bolas de fuego:** una de cada cinco, y estallan.
  - **Frecuencia:** cada 12 a 36 segundos.
- **El flum**:
  - **Duración:** un segundo, con 0,45 s de aceleración y 0,55 de frenado.
  - **Cielo:** se acerca hasta 2,5 veces con estelas radiales hacia un punto de
    fuga, con un destello al cruzar.
  - **Pantallas:** la que se va crece y se desenfoca; la que llega viene chica y
    borrosa.
  - **Detrás de Ajustes:** el mismo cielo, 2,2 veces más cerca y oscurecido.
  - **Vibración:** una al salir y otra al llegar.
  - Dentro de la entrada el cielo se desliza más suave.
- **Los gestos del cielo van solo sobre el lienzo.** Si envuelven también a la
  interfaz, un toque en un botón (Deshacer, el panel de prueba) le llega además
  al cielo y enciende la estrella de abajo. Lo encontré probando la app en la
  web.
- **Datos en el teléfono** (etapa 2):
  - SQLite con `expo-sqlite`, que trae la búsqueda de texto de SQLite (FTS5) para
    la comida.
  - Las versiones del esquema van en `PRAGMA user_version`.
  - En la web, solo para probar, localStorage.
  - Lo de cada día queda resumido aparte (`dias`): si después cambian los
    hábitos, los días vividos no se tocan.
- **Tests con Jest y `jest-expo`**, lo que recomienda Expo. El dominio no importa
  nada del teléfono, así se prueba solo.
- **Las constelaciones del dominio**, mientras D3 sigue pendiente:
  - **Si no alcanzan:** se repite la menos repetida (la opción 1 de D3). Si
    elegís sumar asterismos (la 2), solo se agregan al catálogo.
  - **Orden del catálogo:** cada usuario recibe el suyo, así dos personas con
    los mismos hábitos tienen cielos distintos.
  - **La primera vez** la semana arranca el lunes, así tu universo ya muestra
    los siete días.
  - **Volver a una cantidad:** el día recupera la constelación que tuvo con ella.
  - **Con más de 15 hábitos en un día** (raro), se usa la más chica de las que
    tienen más estrellas, con sus estrellas más brillantes.
- **D5 quedó como una sola línea** (`CRECE_DE_NOCHE` en `src/cielo/dia.ts`):
  hoy el cielo crece de noche, como recomendé, y cambiarlo es poner `false`.
- **Las condiciones de los logros** (los nombres esperan D6):
  - Solsticio es un día con 8 hábitos (10 de luz).
  - Cometa es volver después de 7 días enteros sin luz.
  - Los de Ascent, la comida y el sueño llegan con sus etapas.
- **Galería interactiva**, no capturas como la de Ascent: lo que hay que aprobar
  son animaciones y toques.
- **Rama `cimientos`**, que sale de `master` (el commit inicial de la plantilla).
