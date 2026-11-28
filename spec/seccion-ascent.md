# La sección de Ascent, rehecha: tres propuestas (27/11/2026, para aprobar)

Están en la galería, arriba de todo en «Lo nuevo, para aprobar» (`galeria/src/propuestas/10-ascent-portada.js`,
`11-ascent-cuerpo.js` y `12-ascent-en-progreso.js`, con los datos de `05-ascent-datos.js`). La app no cambia hasta que
elijas una. Salen de tres revisiones de la sección de hoy: una creativa, una del uso de todos los días y una como
usuario nuevo.

## Lo que dijo el dueño

«Siento que es muy tosco… subir y tener que subir y subir y subir… esto está todo como lista… haceme tipo 3
propuestas… quiero que sean buenas propuestas. También quiero que juegues con lo visual… \[que dependa del rango\]…
capaz que arriba a la derecha pensás que no es muy bueno… capaz que ponés una opción para cambiar el fondo… capaz que
la parte de Ascent tiene que estar en Progreso, pero no arriba… músculos fatigados es importante, pero siento que
podría ser distinto, como… que sea tipo un aviso \[cuando el músculo que te toca hoy lo entrenaste hace poco\].»

## Lo que se encontró al mirarla (dos revisiones, una creativa y una del uso diario)

- **Se lee en zigzag.** Se llega abajo y los bloques van hacia arriba, pero cada bloque se lee hacia abajo: para pasar
  al siguiente hay que subir dos veces su alto. Mide más de cuatro pantallas.
- **Nueve bloques con el mismo peso.** Lo de hoy y lo de una vez por mes (Tu año, Metas) se ven igual: etiqueta en
  mayúsculas, frase gris y filas con línea de pelo. Casi todo es lista; los únicos dibujos son el cuerpo y el año.
- **Mezcla tres ritmos** (hoy, la semana, los meses), y casi todo lo que muestra es igual que ayer o está vacío.
- **Al llegar no se ve lo de hoy:** se llega al cuerpo con las barras y la leyenda.
- **«Músculos fatigados» dice un estado** («Dorsales, falta 1 día»); el dueño quiere un hecho que le toque hoy.
- **Lo más útil está escondido:** «Próxima vez: sube a 62,5 kg» solo aparece al tocar un músculo.
- **El cuerpo del rango pasa por debajo de párrafos.**
- La fatiga casi nunca choca con la sesión (sin «Registrar RIR» en Ascent todo músculo entrenado queda en 2 días):
  el aviso fuerte se va a ver poco; lo normal es la nota chica de «falta 1 día». Por eso el aviso dice **primero el
  hecho** («los entrenaste ayer, 12 series»), después la estimación y por último qué hacer.

## Las cinco piezas que comparten las tres propuestas

1. **El aviso de fatiga.** Sale solo si hoy hay sesión prevista y alguno de sus músculos principales no está listo.
   «Cuádriceps y glúteos: los entrenaste ayer, 12 series. Faltan unos 2 días (estimado, puede variar un día). Más
   ligero, u otra cosa.» «Cargado» (2 días o más) cambia el titular y pide algo; «se recupera» (1 día) es una línea
   chica que no pide nada. Si hoy no toca ese músculo, no se dice: queda como contorno punteado en el cuerpo.
   Dos respuestas: «Entendido» y «Me siento bien».
2. **Tu sesión de hoy.** Los ejercicios de hoy en orden, cada uno con ↑ (sube, con el peso nuevo) o = (igual) y su
   porqué en una línea al tocarlo.
3. **La tira de puntos.** Los 14 músculos en una sola escala de 0 a 30 series con la franja de 10 a 20 sombreada, un
   punto por músculo; solo llevan nombre los que se salen. Reemplaza las 14 barras.
4. **Fases, no anillos.** La fatiga en cuatro fases (○ ◔ ◑ ●): un anillo continuo o un porcentaje prometen una
   precisión que la cuenta no tiene.
5. **Un solo lugar por ejercicio.** «Estancados», «Por qué», «Por qué bajaste» y la tendencia se juntan en la página
   del ejercicio, que abre «¿Por qué no estás mejorando?» (otra propuesta, de otro constructor: si existe
   `window.PorQueNoMejoro`, se abre con `PorQueNoMejoro.abrir(idDelEjercicio)`; si no, la fila queda sin acción).

**El movimiento, igual en las tres:** lo tocado crece desde su marco hasta la pantalla (su título y su dibujo chico
viajan y pasan a ser los de la página); el resto entra unos 120 ms después, de arriba hacia abajo; dura 380 a 450 ms
con `cubic-bezier(0.2, 0.7, 0.2, 1)`; volver es tocar «‹» o arrastrar hacia abajo, y la página se encoge hacia su
origen. Con Reducir movimiento, un fundido de 120 ms sin escala. Nada aparece ni desaparece de golpe.

**Las palabras:** Moss sugiere, no manda; «estimado», «puede variar un día», «puede influir». Sin porcentajes de
recuperación ni puntajes. Español neutro (tú) e inglés.

**El rango:** la sección toma el color del rango de Ascent (`--rango-principal` y `--rango-claro` en `.tel`; se cambia
con `Galeria.secciones.ascent.ponerRango(n, planeta)`, n de 1 a 7) y el dibujo de su cuerpo
(`AscentDeMentira.cuerpoDelRango()`). Regla para las tres: **el cuerpo del rango nunca pasa por debajo de un párrafo.**

**Los datos:** `window.AscentDeMentira` (archivo `galeria/src/propuestas/05-ascent-datos.js`: leé el comentario de
arriba, dice la forma exacta). No recalcules ni inventes otros números: las tres propuestas muestran a la misma persona.

**Las vistas de cada propuesta** (los botones de la galería), para poder compararlas: `aviso` (el día `cargado`: hoy
tocan piernas y siguen cargadas; es la principal), `calma` (día `normal`), `hecha` (ya entrenó), `descanso`,
`nocheCorta`, `nueva` (recién vinculada) y `en` (la principal en inglés), más las propias de cada una (sus páginas de
detalle y, donde diga, el selector de fondo y los rangos). Capturas de todas, y de cada página de detalle.

---

## A. «Portada» (cambia lo menos posible y arregla el «subir y subir»)

Vive **donde hoy** (se entra desde Progreso, con el orbe y el gesto ya aprobados): lo que baja es **una sola pantalla
que no se desliza**: el titular, el aviso si toca y **cuatro puertas que son preguntas con su respuesta en una
línea**. Cada puerta crece hasta ser su página, que se lee de arriba hacia abajo.

```
 PRIMERA PANTALLA (no se desliza)        DETALLE: «¿Estoy mejorando?», crecida
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│ ASCENT  ?                      (◐) │  │ ‹ Ascent                       (◐) │
│ Hoy · Piernas · 18:40              │  │ ¿ESTOY MEJORANDO?                  │
│                                    │  │ En 3 de 4 ejercicios, sí           │
│ Más ligero hoy                     │  │                                    │
│                                    │  │ Sentadilla                         │
│ ◔ Cuádriceps y glúteos: los        │  │ . · · ˙ · ˙ ˙ ˙ ¨   sube ~1 %/mes  │
│   entrenaste ayer. Faltan unos     │  │ Peso muerto                        │
│   2 días (estimado).               │  │ . . · · ˙ · ˙ ˙ ˙   sube           │
│────────────────────────────────────│  │ Remo con barra                     │
│ ¿QUÉ HAGO HOY?   │ ¿CÓMO VA MI     │  │ · . · ˙ · · ˙ · ˙   sube           │
│ = = ↑ = ↑        │ SEMANA?    ▓▓   │  │ Press de banca                     │
│ 2 suben, 3 igual │           ▒██▒  │  │ ˙ ˙ ˙ · ˙ · · .   sin subida clara │
│                  │ 3 les      ▓▓   │  │   10 semanas sin marca             │
│                  │ faltan     ▒▒   │  │ ┌────────────────────────────────┐ │
│──────────────────┼─────────────────│  │ │ ¿Por qué no estás mejorando? › │ │
│ ¿ESTOY           │ ¿LLEGO A MI     │  │ └────────────────────────────────┘ │
│ MEJORANDO?       │ META?           │  │────────────────────────────────────│
│ ● ● ● ○          │ ━━━━━━▒▒▒░ 105  │  │ Cada punto es una sesión; la       │
│ 3 suben, 1 no    │ febrero a abril │  │ franja, lo que cambia tu fuerza    │
│──────────────────┴─────────────────│  │ de un día a otro (±3 %).           │
│ TU AÑO  ▪▫▪▪▫▪▫▫▪▪▫▪▪▫▪▫▪  48      │  │                                    │
│ Comida: proteína y carbohidratos   │  │ ? En qué se basa                   │
│ Cama: 22:25                        │  │                                    │
│         Volver a Progreso v        │  │                                    │
│ Inicio Comida PROGRESO + Sueño ··· │  │ Inicio Comida PROGRESO + Sueño ··· │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

- Las puertas son **celdas con línea de pelo, no cajas**, y cada una dice una sola cosa con su dibujo chico.
- Páginas: **¿Qué hago hoy?** (la sesión de hoy con ↑ y =, qué comer antes y después, la cama); **¿Cómo va mi
  semana?** (el cuerpo grande, la tira de puntos, lo que se sale y la rutina en una palabra); **¿Estoy mejorando?**
  (cada ejercicio con su chispa y su veredicto, y la puerta a «¿Por qué no estás mejorando?»); **¿Llego a mi meta?**
  (cada meta como una pista con su ventana de llegada sombreada, «Hoy levantarías», «Cómo llegar», «Editar meta» y
  «Nueva meta», que abre el formulario **ahí donde se tocó**); **Tu año** (el mapa y las marcas).
- Después de entrenar, «¿Qué hago hoy?» pasa a «Cómo fue: Dura». En descanso, a «Mañana: Piernas».
- Sin aviso, las puertas suben a ocupar su lugar con una transición.
- Al llegar, entra entera: el titular primero y las puertas se asientan de a una (40 ms entre sí, 8 px desde abajo).
  La celda tocada crece hasta los bordes y las otras tres se corren 12 px hacia afuera y se apagan.
- Tiene que entrar en un iPhone chico: si no entra todo, el año pasa adentro de «¿Llego a mi meta?».

**La cara, «Arco»:** de cada cuerpo del rango, solo su **filo iluminado** (un arco del color del rango que entra por
la esquina de arriba a la derecha, detrás del sello), nunca debajo del texto. Los datos repiten el arco: la semana en
siete marcas, la meta con su ventana sombreada, la fatiga en fases. El color del rango va en tres lugares y no más: lo
elegido, lo que sube (↑) y el relleno «al día» del cuerpo; el terracota (`--as-lejos`) queda para lo que pone el límite.

**El selector de fondo** (solo en esta propuesta, para decidir si gusta): se abre tocando el sello de arriba a la
derecha y la bandeja crece desde él.

```
 FONDO
  [ Auto ]   polvo   asteroide   luna   planeta   sol    galaxia   ····
   el de tu rango   <── desliza: el fondo cambia en vivo ──>     (los que no alcanzaste, velados)
 Presencia    Tenue ○─────●─────○ Protagonista
 Encuadre     ( Esquina )   [ Horizonte ]   ( Lejos )
 ○ Solo el cielo de Moss
```

«Auto» es el de fábrica (el de tu rango). No se puede elegir uno más alto que el propio: en Ascent el rango se gana.
Vistas propias: `fondo` (la bandeja abierta), `rango3`, `rango5` y `rango7` (la portada con otros rangos).

---

## B. «El cuerpo manda» (la que más juega con lo visual y mata las listas)

Vive donde hoy. **El cuerpo dibujado, grande, es la pantalla y el menú.** Se le cambia la **lente** (Hoy, Semana,
Fatiga) y lo que era fila pasa a ser un **rótulo con su línea**, como en una lámina de anatomía; solo se rotula lo que
se sale (tope de cuatro rótulos, todos a la izquierda, el cuerpo corrido a la derecha).

```
 PRIMERA PANTALLA (lente «Semana»)       DETALLE: tocaste «Cuádriceps»
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│ ASCENT  ?                      (◐) │  │ ‹                              (◐) │
│ Más ligero hoy · Piernas 18:40     │  │             CUÁDRICEPS             │
│                                    │  │ │▓▓▓│▓▓▓│   6 series · le faltan   │
│                      ___           │  │ │▓▓▓│▓▓▓│   0 ──●─░░░░░░░░──── 30  │
│                     (   )          │  │ │▓▓▓│▓▓▓│        10      20        │
│ Hombros 22        __/   \__        │  │ │▓▓▓│▓▓▓│                          │
│ de más ──────────●▓▓│▓▓▓│▓▓\       │  │ │ ▓▓│▓▓ │   ○ ◔ ◑ ●                │
│                  │▒▒│▓▓▓│▒▒│       │  │ (de cerca)  faltan ~2 días         │
│ Abdomen 0        │▒▒│░░░│▒▒│       │  │             estimado               │
│ sin entrenar ─────────● │▒▒│       │  │────────────────────────────────────│
│                  │▒▒│░░░│▒▒│       │  │ HOY, EN TU SESIÓN                  │
│ HOY TOCAN           │▒│▒│          │  │ Sentadilla     = 95 kg             │
│ Cuádriceps 6 ───────● │▒│          │  │   todavía se recupera              │
│ ◔ de ayer: faltan   │▒│▒│          │  │ Prensa         = 170 kg            │
│   ~2 días           │░│░│          │  │ Extensión      = 45 kg             │
│                     │░│░│          │  │────────────────────────────────────│
│       ‹ desliza: de espalda ›      │  │ ESTA SEMANA                        │
│                                    │  │ Súmale 4 series: con 10 llega a    │
│ ( Hoy )  [ Semana ]  ( Fatiga )    │  │ lo recomendado.                    │
│ 0      10 ░░░░░░░░░ 20        30   │  │                                    │
│ ●  ● ●  ●   ●● ●  ●      ●         │  │ Sentadilla, en el tiempo ›         │
│                                    │  │ ? En qué se basa                   │
│ Tu fuerza ›   Metas ›   Tu año ›   │  │                                    │
│         Volver a Progreso v        │  │                                    │
│ Inicio Comida PROGRESO + Sueño ··· │  │ Inicio Comida PROGRESO + Sueño ··· │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

- **Lente Hoy:** se encienden solo los músculos de la sesión de hoy; los rótulos son sus ejercicios con ↑ o = y el
  peso; si alguno sigue cargado, su rótulo es el aviso. En descanso, lo de mañana, tenue.
- **Lente Semana:** el relleno dice el estado (le faltan, al día, de más); debajo, la tira de puntos.
- **Lente Fatiga:** las cuatro fases (trama o contorno punteado para «se recupera»), con «listo el jueves».
- «De frente / De espalda» pasa a ser **arrastrar el cuerpo de costado** (el frente se angosta y la espalda se abre);
  con dos puntitos debajo y, para quien no arrastra, tocarlos.
- Tocar un músculo: se levanta apenas (escala 1,03), el cuerpo se corre y se acerca a esa zona, y su panel crece desde
  el músculo. Adentro: su escala con el punto, su fase, «Hoy, en tu sesión» (sus ejercicios con la decisión), «Esta
  semana» (una sugerencia) y «<Ejercicio>, en el tiempo ›» (que abre «¿Por qué no estás mejorando?»).
- Abajo, tres enlaces: «Tu fuerza ›», «Metas ›», «Tu año ›», cada uno crece a su página (las mismas de A).
- La comida y el sueño de hoy van en un pie de una línea («Antes: carbohidratos y algo de proteína · Cama 22:25»).
- Al cambiar de lente los rellenos se funden (300 ms) y las líneas de los rótulos se dibujan desde el músculo hacia el
  texto (400 ms); las que sobran se recogen.
- Como alternativa accesible, un «Ver como lista» chico que muestra los mismos datos en filas.

**La cara, «Lámina»:** todo a línea, como una lámina de atlas: órbitas de pelo, el cuerpo humano con rótulos, el cuerpo
del rango como un medallón de trazo arriba a la derecha. **El color del rango es la única tinta**, sobre casi negro con
un grano muy fino. Los estados se distinguen también por **trama** (rayado «le faltan», lleno «al día», punteado «se
recupera»): sirve para el daltonismo. Los rótulos chicos, en Cormorant itálica (`var(--titulos)`), para que se sienta
de Moss. Vistas propias: `hoy`, `semana` (principal junto con `aviso`), `fatiga`, `musculo` (el detalle de cuádriceps),
`espalda`, `lista`.

---

## C. «En Progreso, con avisos» (lo que el dueño dijo literal: «tipo un aviso» y «en Progreso, pero no arriba»)

Ascent **deja de ser un lugar arriba** y se reparte por ritmo:

1. **En Inicio**, solo cuando algo cambia el día: una tarjeta chica debajo de la luna («Hoy, piernas más ligero ·
   Cuádriceps y glúteos, de ayer»), como el control cuando está cerca. En un día normal, nada (o la primera línea de
   «Para hoy»). En descanso, nada.
2. **En Progreso**, la segunda carta: **«Fuerza · con Ascent»**, con el titular, el aviso si lo hay y un cuerpo chico.
   Al tocarla **crece hasta la pantalla** y se lee de arriba hacia abajo.
3. **En el teléfono**, un solo aviso por día de entreno, que suena únicamente si algo cambia la sesión («Hoy, piernas
   más ligero»), 90 minutos antes de salir; si nada cambia, no suena.

```
 Progreso, con la carta                  La carta, crecida
┌────────────────────────────────────┐  ┌────────────────────────────────────┐
│ MIÉRCOLES · 21 OCT                 │  │ v Progreso                     (◐) │
│ Progreso                           │  │ FUERZA                             │
│ ┌────────────────────────────────┐ │  │ Más ligero hoy                     │
│ │ Control el lunes · en 5 días v │ │  │ ┌────────────────────────────────┐ │
│ └────────────────────────────────┘ │  │ │◔ HOY TOCAN Y SIGUEN CARGADOS   │ │
│ ┌─────────────────────────── ◐ ──┐ │  │ │  Cuádriceps y glúteos          │ │
│ │ FUERZA · CON ASCENT            │ │  │ │  Los entrenaste ayer: 12       │ │
│ │ Más ligero hoy          ▓▓     │ │  │ │  series. Más ligero, u otra    │ │
│ │ Piernas · 18:40        ▒██▒    │ │  │ │  cosa.                       › │ │
│ │ ◔ Cuádriceps y glúteos, ▓▓     │ │  │ └────────────────────────────────┘ │
│ │   de ayer               ▒▒   › │ │  │ ┌────────────────────────────────┐ │
│ └────────────────────────────────┘ │  │ │↑ HOY PUEDES SUBIR              │ │
│ ┌────────────────────────────────┐ │  │ │  Curl femoral: 42,5 kg       › │ │
│ │ TU PLAN               Al ritmo │ │  │ └────────────────────────────────┘ │
│ │ Bajar a 71 kg                  │ │  │────────────────────────────────────│
│ │ ●━━━━━◉────○────○──◎┄┄┄┄┄·     │ │  │ HOY · Piernas 18:40             ^  │
│ └────────────────────────────────┘ │  │ = Sentadilla 95  ↑ Curl 42,5       │
│ ┌────────────────────────────────┐ │  │────────────────────────────────────│
│ │ PESO              + Registrar  │ │  │ ESTA SEMANA         ▓▓          v  │
│ └────────────────────────────────┘ │  │ 3 les faltan       ▒██▒            │
│ Inicio Comida PROGRESO + Sueño ··· │  │────────────────────────────────────│
└────────────────────────────────────┘  │ TU FUERZA      ● ● ● ○          v  │
                                        │ 1 sin subida clara                 │
 El aviso de fatiga, abierto            │────────────────────────────────────│
┌────────────────────────────────────┐  │ METAS          ━━━━━▒▒░         v  │
│ ‹ Fuerza                           │  │ febrero a abril                    │
│ ◔ Cuádriceps y glúteos             │  │────────────────────────────────────│
│      │▓▓▓│▓▓▓│  (solo esas zonas)  │  │ TU AÑO         ▪▫▪▪▫▪▫▫▪        v  │
│ LO QUE PASÓ                        │  │ 48 entrenamientos                  │
│ Ayer: 12 series de cuádriceps,     │  └────────────────────────────────────┘
│ 4 al fallo.                        │
│ LO QUE SE ESTIMA                   │
│ ○ ◔ ◑ ●   faltan unos 2 días       │
│ Puede variar un día.               │
│ QUÉ HACER HOY                      │
│ Más ligero y sin ir al fallo, o    │
│ cambia el día en Ascent.           │
│ ( Entendido )  ( Me siento bien )  │
└────────────────────────────────────┘
```

- **Avisos primero:** arriba de la página solo aparece lo que se sale hoy o esta semana, con **tope de tres**, uno por
  tema, en este orden: hoy tocas un músculo cargado; noche corta con sesión; hoy puedes subir; un músculo «de más» o
  «le faltan» que hoy toca; un ejercicio sin subida clara; la ventana de una meta que cambió; después de entrenar, cómo
  fue. Descartar uno es deslizarlo de costado: se va y los de abajo suben. Un día sin avisos queda **en calma, pero
  con vida**: el titular («Todo listo»), la semana en siete marcas y la luz del rango.
- Debajo, **cada parte plegada en una línea con su dibujo** (Hoy, Esta semana, Tu fuerza, Metas, Tu año); se despliega
  en su lugar y empuja lo de abajo. Adentro, las mismas piezas (la sesión de hoy, el cuerpo con la tira, las chispas
  con la puerta a «¿Por qué no estás mejorando?», las metas como pistas, el mapa del año).
- **Para dibujarla sobre lo real:** la carta se inserta en el scroll de la sección de Progreso de verdad
  (`Galeria.secciones.progreso.zona`, su `.pg-scroll`, después del control) y la tarjeta de Inicio, en el de Inicio
  (`Galeria.secciones.inicio.zona`, `.in-scroll`, debajo de la luna); al cerrar la propuesta se quitan (con su
  animación) y todo queda como estaba. Si Progreso o Inicio se vuelven a pintar y la pierden, volvé a insertarla.
- Sin vincular, la carta es una fila fina («Fuerza · conecta Ascent ›»).

**La cara, «Luz»:** el cuerpo del rango queda **fuera de cuadro y se ve su luz**: un resplandor del color del rango que
entra por un borde de la carta y, crecida, por arriba de la página. El cuerpo entero aparece solo en el sello del
encabezado (44 a 64 px). Los datos van en escalas finas, franjas y puntos.
Vistas propias: `inicio` (la tarjeta de Inicio), `progreso` (la carta en Progreso; principal junto con `aviso`, que es
la página crecida), `avisoAbierto` (el aviso de fatiga con lo que pasó, lo que se estima y qué hacer), `telefono` (el
aviso en la pantalla bloqueada, dibujada simple: hora grande, la notificación con el ícono de Moss, título «Hoy,
piernas más ligero» y texto «Cuádriceps y glúteos probablemente sigan cargados. Una serie menos y sin llegar al fallo,
o entrena otra cosa.»), `sinVincular`.

---

## Lo que agregó la mirada del usuario nuevo (vale para las tres)

Recorrió la app de verdad como tres personas: sin vincular, recién vinculada (2 sesiones) y vinculada hace meses.

**Qué necesita ver primero, en una pantalla y sin subir:** una frase grande para hoy (si no se sabe si entrena, una
pregunta: «¿Entrenas hoy?»); el cuerpo con lo de hoy (toca, listo, se recupera); una acción: el peso de la próxima vez
de lo que toca hoy; recién vinculada, qué se enciende y cuándo; sin vincular, qué es Ascent en una línea («Ascent es
la app donde anotas tus entrenamientos») y un ejemplo lleno con la etiqueta «ejemplo», no filas grises con candado.

**Lo que sobra el primer mes** (no se muestra hasta que haya datos): estancados y por qué (piden 8 a 12 semanas), «Tu
año» con dos cuadritos, la nota de la rutina sin rutina, la fecha de la meta antes de 6 sesiones en 6 semanas (alcanza
con el progreso), «En qué se basa» repetido en cada bloque (uno al final), la leyenda entera.

**La vista `nueva` (recién vinculada) no juzga con datos que no tiene.** Nada de nueve «Le faltan» ni «Hoy descansas»
sin saber sus días. Dice: «Llevas 2 entrenamientos en Ascent. Con cada uno, esto se llena», y **una línea con cuatro
hitos y «estás aquí»**: 1 sesión, el cuerpo · 2 por ejercicio, la próxima vez · 6 sesiones en 6 semanas, tu fuerza y
tus metas · 8 a 12 semanas, lo que no sube. La primera semana: «Tu primera semana: todavía no se compara con lo ideal».

**Estados vacíos, con lo que falta de verdad:**

| Dónde | Debería decir |
|---|---|
| Sin RIR anotado | «No anotaste cuántas repeticiones te quedaban: Moss supone que fueron duras. Anótalo en Ascent y acierta más.» |
| Sin rutina ni días | «No sé si hoy entrenas. Arma tu rutina en Ascent o elige tus días.» |
| Fatigados, ninguno | «Todo recuperado: hoy puedes entrenar lo que toque.» |
| Estancados, poca historia | «Todavía es pronto: hacen falta 8 semanas con un ejercicio. Llevas 1.» |
| Metas, ninguna | «Elige un ejercicio y un peso. Con 6 sesiones en 6 semanas, Moss te dice cuándo llegas.» |
| Meta sin datos | «Llevas 2 de 6 sesiones (cuentan las de las últimas 12 semanas). Faltan 4.» |
| Meta con 6 sesiones en pocas semanas | «Ya tienes 6 sesiones; faltan semanas entre la primera y la última: van 3 de 6.» |
| Meta a más de 10 repeticiones | «Lo haces a 15 repeticiones: con más de 10 no se puede estimar tu máximo.» |

**Otros hallazgos para no repetir:** con el rango 1 (el de todo usuario nuevo) el cuerpo es gris sobre gris: el estado
de la semana necesita un color propio, que no dependa del rango. No se sabe dónde estás ni cómo volver: el título y
«Progreso ⌄» siempre a la vista. Jerga: «series duras», «marca», «1RM», «multiarticular», «al fallo»: decilo en
palabras de todos o explicalo la primera vez. Las metas: el peso con «−/+» desde tu nivel, dice «por mancuerna» o «por
lado» cuando corresponde, sin el «100» gris de ejemplo, «Borrar» no va pegado a «Nueva meta» y pide confirmar, y el
ejercicio se elige de un campo que abre la lista completa (con buscador, agrupada por músculo, con todas las variantes).
