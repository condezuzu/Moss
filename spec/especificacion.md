# Moss — especificación de producto

Documento del producto escrito el 21/10/2026, con los cambios que se sumaron ese
mismo día ya puestos en cada sección (la lista está abajo). Es la fuente de
verdad: lo que está acá ya está decidido. Las decisiones que se tomen después van
en [`decisiones.md`](decisiones.md) y el orden de trabajo en [`plan.md`](plan.md).
Los detalles técnicos están en [`nutricion.md`](nutricion.md),
[`progreso.md`](progreso.md), [`sueno.md`](sueno.md), [`ascent.md`](ascent.md) y
[`widgets.md`](widgets.md).

## Cambios del 21/10/2026

En el orden en que llegaron:

1. **Nutrición.** Moss pasa a tener dos partes principales con el mismo peso:
   los hábitos y la comida. Ver la sección «Nutrición».
2. **Widgets.** «Si se puede poner los hábitos como widgets estaría genial».
   Ver la sección «Widgets».
3. **Cambio de foco.** Las constelaciones y los mitos pasan a segundo plano y el
   progreso es el cielo mismo. Cambiaron «Concepto», «Mecánica», «Progresión»,
   «Visual» y «Contenido».
4. **Transiciones.** Moverse entre secciones es un «flum» de un segundo. Ver la
   sección «Visual».
5. **Conexión con Ascent y entrada a la app.** La conexión reemplaza a la de
   antes; la entrada es nueva.
6. **La comida pasa al centro.** Lo que más le interesa a la gente es trackear
   sus macros: si esa parte no es excelente, nadie usa la app. Los hábitos y el
   cielo siguen, pero acompañan. Reemplaza lo que había sobre nutrición: ver «La
   comida». Cambiaron también «Concepto», «Widgets», «Técnico», «Versión 1» y
   «Después».
7. **Más sobria, como Ascent.** Calcular los macros es lo principal, y todo
   estaba «superestimulante». Antes de cambios grandes, primero se prueba:
   - la vía láctea (el polvo estelar blanco) mucho más tenue, al 30 %, el musgo
     más apagado y las esporas de vez en cuando;
   - los números y los títulos de la comida en una sans sobria (Outfit), y una
     luna de verdad en lugar de la bola dorada;
   - registrar es armar la comida en una ventana y revisarla antes de agregarla;
   - la comida se ve por día, por semana y por mes, como en MacroFactor, sin las
     flechas de ayer y mañana.

8. **Pestañas, como Ascent** (tu propuesta, armada en la galería el 22/10/2026,
   D14). Abajo van tres pestañas de texto:
   - **Inicio:** la comida, con lo que queda y los macros, como MacroFactor;
   - **Hábitos:** el cielo de hoy con la constelación, y el universo arriba;
   - **Ajustes.**

   Se pasa deslizando, con la de al lado asomando y las reglas del gesto de
   Ascent. El cielo queda quieto detrás de las tres, y el flum queda solo para
   el final de la entrada. Cambió «Visual».

9. **Seis secciones y el «+» en el medio** (lo pediste el 22/10/2026; reemplaza
   las tres pestañas del cambio 8). La barra tiene Inicio, Comida y Progreso, el
   «+», y Sueño, Hábitos y Perfil:
   - **El «+»** es minimalista, parte de la barra. Abre una hoja con:
     - lo principal: agregar comida y registrar el peso;
     - la carga rápida: calorías y macros, los recientes, las comidas guardadas y el agua;
     - las medidas del cuerpo, con un mini tutorial y la grasa corporal estimada como un rango chico, con su aviso.
   - **Inicio, a tu medida:** bloques que se eligen y se ordenan.
     - De fábrica van lo que queda de calorías y macros, el progreso al objetivo, el peso con el balance y tu día en el cielo.
     - El agua sale de Inicio.
     - Los puntos de los macros brillan solo al cumplir lo pedido y tiemblan un poco si te pasás por mucho.
     - La luna, de mejor calidad.
   - **Comida:** el registro de siempre, por día, por semana y por mes.
   - **Progreso:**
     - el peso y su tendencia, las medidas y la grasa corporal;
     - el gasto, el balance y el progreso al objetivo;
     - la estrategia, con el día del control, que se elige.
   - **Sueño,** nueva: ver [`sueno.md`](sueno.md).
   - **Hábitos:** el cielo, como estaba.
   - **Perfil:** lo que era Ajustes, sin las metas.
   - **La entrada** sigue como está, sin tutoriales por sección.

   Cambiaron «Registro», «La comida», «Visual», «Las secciones» (nueva) y
   «Versión 1».

10. **Ascent, arriba de Hábitos** (lo pediste el 22/10/2026). La parte que solo
    se usa con Ascent vinculada es una sección propia, arriba de Hábitos:
    - en el cielo, abajo, sobre el musgo, una flecha muy tenue apunta para
      arriba; deslizar para arriba sube la sección siguiendo al dedo, y se
      vuelve deslizando para abajo o tocando Hábitos;
    - sin vincular, cada función muestra vacío lo que va a mostrar, con
      «Vincular» arriba; vinculada, lo de hoy. Las dos formas tienen que verse
      bien;
    - la recuperación también se ve en Sueño.

    En el mismo pedido, la luna volvió a ser la de antes, «Te quedan» cambió de
    color y la interfaz bajó el verde: el vivo quedó para el cielo.

    Cambiaron «Las secciones», «Visual» y «Conexión con Ascent».

---

Vamos a crear Moss, una app de hábitos para iPhone, desde cero. Es mi segunda app: la primera es Ascent (app de racha de gimnasio, Expo + Supabase, repo github.com/condezuzu/ascent, ya publicada en la App Store). El objetivo es mandar la versión 1 a revisión de Apple lo antes posible, pero lo visual es el producto: tiene que verse espectacular, muy por encima de una app de hábitos normal.

## Concepto

La comida es el centro de Moss: trackear calorías y macros tan bien como MacroFactor, sin IA de fotos, global desde el inicio y gratis. Los hábitos y el cielo siguen, pero acompañan: cada hábito es una estrella, los hábitos de cada día forman una constelación real, y todo vive en un cielo nocturno. El nombre viene de "mos" (costumbre en latín) y "moss" (musgo en inglés, que crece lento pero siempre).

Competencia directa que ya existe: MacroFactor en la comida; Sideria y Stellar Habits en los hábitos como estrellas. Moss se diferencia por:

- registrar la comida en muy pocos toques, con una base que encuentra lo que se come en cada país;
- el cielo que crece como progresión;
- un puntaje que premia el esfuerzo sostenido y nunca castiga;
- el registro automático (Apple Health, sueño, Ascent);
- la comida con metas que se ajustan solas;
- el cielo continuo como interfaz;
- lo exagerado de lo visual.

Las constelaciones y los mitos pasan a segundo plano: siguen siendo parte de la estética, pero no son lo principal.

## Mecánica

1. Hábitos: los crea el usuario y son totalmente personalizables (nombre, ícono, qué días de la semana tocan, y si se cumplen a mano o solos desde Apple Health con una meta, por ejemplo 8.000 pasos).
2. Una constelación por día de la semana: cada día tiene sus propios hábitos, y la cantidad de hábitos de ese día define qué constelación real le toca (si el lunes tiene 5 hábitos, el lunes es una constelación de 5 estrellas principales). Armá el catálogo de constelaciones reales agrupadas por cantidad de estrellas principales, cubriendo de 1 a 15 o más.
3. Cambiar hábitos: si se agrega o saca un hábito de un día, ese día pasa a otra constelación con la nueva cantidad. La anterior queda guardada en el cielo del usuario con todo su progreso.
4. Cada noche: los hábitos hechos se encienden como estrellas. Cuando se completa el día, la constelación se conecta y las auroras se intensifican, sin texto ni historia.
5. Puntos por día con rendimientos decrecientes: el primer hábito del día vale 3 puntos y cada hábito extra vale 1. Ejemplo: una semana de 6,4,3,7,5,4,6 hábitos suma 49; una de 10,2,2,2,2,2,2 suma 36. Gana la constancia, no los picos.
6. Nada se pierde: no hay rachas, ni vidas, ni multiplicadores que se reseteen. El progreso solo sube, más rápido o más lento. Faltar un día solo frena.

## Progresión

- El progreso pasa a ser el cielo mismo: a medida que se acumulan puntos, el cielo del usuario se vuelve más rico. Aparecen más estrellas, las auroras crecen y el musgo se expande. El progreso se ve, no se lee.
- Las constelaciones siguen existiendo como parte visual del cielo (una por día de la semana, con su forma real), pero su nombre aparece chico y discreto, no como protagonista.
- Nada de capítulos, historias ni el dios o héroe que aparece al completar.
- Las 7 constelaciones juntas forman el universo del usuario.
- Los logros se mantienen, pero sin narración mitológica (por ejemplo, 30 noches completas, o volver después de una semana sin actividad). Propuesta de nombres en [`decisiones.md`](decisiones.md), D6.
- La progresión es lenta y premia a quien sostiene durante más tiempo.

## Registro

- Marcar a mano: tocando la estrella directo en el cielo (no hay lista), con vibración y destello. Se puede deshacer.
- Automático desde Apple Health: pasos, agua, mindfulness y cualquier dato de Salud que el usuario elija como hábito. Una estrella de Salud también se corrige tocándola; la de un hábito de comida, no: sigue lo que se anota, y tocarla lo dice.
- Sueño desde Apple Health, en su sección (cambio 9, [`sueno.md`](sueno.md)):
  - la duración, las etapas (REM, núcleo, profundo), lo despierto y el tiempo en cama;
  - el horario y qué tan regular es, y la deuda;
  - una calidad de sueño que dice de qué sale;
  - lo que mide el reloj de noche;
  - de dónde sale cada dato y qué tan confiable es: una noche sin datos no se inventa.

  Los hábitos de sueño se cumplen solos: «dormir X horas» y «acostarse antes de
  las X» (la propuesta es «dormirte antes de las X», D19).
- Calendario donde cada día es un mini cielo; el mes se lee de un vistazo.
- La zona horaria es la del teléfono (si viajás, el día corta en tu hora local).

## La comida (el centro)

La comida es el centro de Moss. La gente quiere trackear sus macros: si esta parte no es excelente, nadie va a usar la app. El modelo es MacroFactor, sin IA de fotos. Global desde el inicio y gratis. El cómo está en [`nutricion.md`](nutricion.md).

**Base de datos**

- Una base propia curada antes de lanzar: unos 500 productos y comidas uruguayas comunes, más los 1.000 alimentos más comunes del mundo. Tiene que ser muy amplia y flexible: que la gente encuentre lo que come. Lo uruguayo está en la base, pero no se presenta como uruguayo.
- Además, Open Food Facts para los productos envasados y USDA FoodData Central para los alimentos genéricos.

**Metas**

- El cuestionario de la entrada (edad, sexo, altura, peso, actividad y objetivo) da la meta inicial de calorías y macros con una fórmula estándar.
- Un check-in semanal automático recalcula el gasto real con la comida registrada y la tendencia del peso, y ajusta las metas. El ajuste es igual haya cumplido o no.
- Peso diario desde Apple Health, desde Ascent o a mano en Moss. Se usa la tendencia, no el número de un día.
- Se registran calorías, proteína, carbohidratos y grasas.

**Cómo se registra**

- **El día:** comidas con nombre (desayuno, almuerzo, merienda, cena y snacks) que se ven sobre una línea de horas.
- **Cantidad:** gramos y porciones caseras (1 taza, 1 unidad, 1 cucharada); cada alimento con sus porciones típicas.
- **Una comida:**
  - foto opcional como recuerdo visual, sin análisis;
  - buscador con sugerencias mientras se escribe, tolerante a errores y con lo más usado primero;
  - la cantidad.

  Moss calcula los valores a partir de los datos por 100 g.
- **Registrar tiene que ser lo más rápido posible:** el usuario lo hace 4 a 6 veces por día. Los toques de cada flujo están contados y minimizados en [`nutricion.md`](nutricion.md).

**Cómo se miden los alimentos** (22/10/2026; el detalle, en [`nutricion.md`](nutricion.md))

1. **Crudo y cocido:** todo alimento que se cocina tiene las dos versiones, bien marcadas (arroz crudo y arroz cocido, pollo crudo y pollo a la plancha). En la ventana del alimento se pasa de una a la otra sin perder los gramos.
2. **Parte comestible:** lo que tiene hueso, cáscara o carozo se puede registrar con el peso entero o con el de lo que se come, y Moss descuenta lo que no se come.
3. **Aceite de cocción:** al registrar algo salteado o a la plancha, Moss pregunta si llevó aceite y cuánto (1 cucharadita, 1 cucharada). En lo frito, el aceite ya está en los valores, y lo dice.
4. **Recetas por peso final:** se cargan los ingredientes, se pesa la olla cocida una vez, y cada porción se registra en gramos.
5. **Porciones reales:** unidad chica, mediana o grande con sus gramos; y paquete, lata, rebanada o vaso según el producto.
6. **Líquidos en ml,** con la densidad de cada uno.
7. **Ajuste rápido:** botones ×½, ×1½ y ×2.
8. **Sistema métrico o imperial,** según el usuario. Se guarda siempre en gramos y ml.
9. **Pesado o estimado:** el usuario puede marcar si pesó o calculó a ojo. El control semanal mide igual, pero con lo calculado a ojo mueve el gasto más despacio.

**El catálogo es para todo el mundo:** unos 500 productos y comidas comunes de Uruguay, con sus marcas y porciones caseras, están en la base junto a unos 1.000 alimentos comunes del mundo. En la app no se presentan como uruguayos: nada de etiquetas, banderas, secciones ni filtros por país.

**Atajos (versión 1)**

1. Escáner de código de barras.
2. Escáner de etiqueta nutricional: si el producto no está, se le saca una foto a la etiqueta y se crea el alimento. Sin IA paga: con el reconocimiento de texto del propio iPhone.
3. Recetas y comidas guardadas.
4. Copiar una comida o un día anterior.
5. Favoritos y recientes.
6. Agregar varios alimentos desde la búsqueda con su porción por defecto, sin abrir cada uno.
7. Armar un plato con varios alimentos y registrarlo de una vez.
8. Recordar la última porción usada de cada alimento.
9. Sugerir lo que el usuario suele comer a esa hora.
10. Carga rápida de calorías y macros a mano.
11. Dictado por voz en el buscador (el dictado del iPhone).
12. Planificar comidas en días futuros.
13. Compartir recetas y alimentos propios con amigos.

**Dónde se ve** (cambio 9)

- **Inicio:** las calorías y los macros que quedan, grande y claro, con la luna; el progreso al objetivo; el peso con el balance.
- **Comida:** el día con su línea de horas, la semana y el mes.
- **Progreso:**
  - la tendencia del peso y el gasto estimado por el algoritmo;
  - el resumen del último check-in semanal y cómo viene el próximo;
  - las medidas y la grasa corporal.
- **El «+»:** registrar comida, el peso, el agua y las medidas.
- Widgets en la pantalla de bloqueo con calorías y macros.

**Conexión con hábitos y Ascent**

Se mantiene lo ya definido:
- **Hábitos:** las metas de comida son hábitos que se encienden solos («llegar a la meta de proteína», «registrar todas las comidas»).
- **Ascent:**
  - peso único;
  - calorías según el día de entrenamiento;
  - proteína post-entreno.

## Las secciones

Abajo van Inicio, Comida y Progreso, el «+» en el medio, y Sueño, Hábitos y
Perfil (cambio 9, 22/10/2026).

- **Inicio:** bloques que el usuario elige y ordena. Tocar uno lleva a su sección.
  - De fábrica:
    1. calorías y macros: lo que queda, grande y claro;
    2. progreso al objetivo: si va en camino y en qué fecha llegaría;
    3. peso y balance: la tendencia, y lo comido contra lo gastado;
    4. tu día en el cielo: la constelación de hoy en chico, con los hábitos, el sueño y los pasos.
  - Se pueden sumar el sueño de anoche y el agua.
- **Comida:** el registro del día, con un cuadro que se desliza: el día, y deslizando a la izquierda, la semana y el mes (ver «La comida» y [`nutricion.md`](nutricion.md)).
- **Progreso:**
  - el peso y su tendencia, las medidas, el rango de grasa corporal, el gasto estimado, el balance y el progreso al objetivo;
  - la estrategia: el objetivo, las metas de hoy, cómo viene el próximo control y qué día de la semana se hace.

  Ver [`progreso.md`](progreso.md).
- **Sueño:** ver [`sueno.md`](sueno.md).
- **Hábitos:** el cielo de hoy y, arrastrando para abajo, el universo.
- **Ascent:** arriba de Hábitos, deslizando para arriba (cambio 10). Es la sección que solo se usa con Ascent vinculada: ver «Conexión con Ascent» y [`ascent.md`](ascent.md).
- **Perfil:** tus datos, las preferencias, Salud y Ascent, exportar y borrar.
- **El «+»:**
  - agregar comida y registrar el peso, arriba;
  - la carga rápida: calorías y macros, los recientes y las comidas guardadas, que se registran de un toque con deshacer, y el agua;
  - las medidas del cuerpo (cintura, cuello, cadera, brazos, pecho y muslo), con un mini tutorial de cómo medir con cinta. Estiman la grasa corporal con el método de la Marina de EE. UU., como un rango chico («16 a 19 %») y con un aviso claro de que es una estimación y no una medición.
- **Los macros:** el punto de cada uno brilla solo cuando se cumple lo pedido y
  tiembla un poco si se pasa por mucho (un 20 % y al menos 10 g).

## Visual (lo más importante)

- Seis secciones con el «+» en el medio de la barra (cambio 9): Inicio, Comida, Progreso, Sueño, Hábitos y Perfil.
  - Se pasa tocando o deslizando, con la de al lado asomando, como en Ascent.
  - El cielo queda quieto detrás de todas, oscurecido salvo en Hábitos.
- En Hábitos el cielo es continuo: arrastrar hacia abajo mueve la cámara por el espacio hasta tu universo, con la semana, en vez de saltar a otra pantalla.
- Arriba de Hábitos está Ascent: una flecha muy tenue, abajo, sobre el musgo, apunta para arriba, y deslizar para arriba sube la sección siguiendo al dedo. Tiene los colores y la forma de Ascent: es la única parte de Moss que es de las dos apps.
- El final de la entrada tiene un movimiento como si se estuviera yendo muy lejos, muy rápido: una animación de un segundo, tipo «flum». Antes era para moverse entre secciones; con las pestañas quedó solo ahí.
- Cielo nocturno sin contaminación lumínica: muchísimas estrellas y auroras. Desde el 21/10/2026, la vía láctea va mucho más tenue, al 30 %: Moss es más sobrio.
- Las constelaciones son parte del fondo: cuantos más hábitos hechos, más cielo encendido, así cada cielo es distinto.
- Paleta: azul noche profundo, dorado y toques de verde musgo. Distinta de Ascent, que es astronomía y física. La estética de Moss va hacia menos mitología, más cielo nocturno y naturaleza (musgo), y es cálida.
  - El verde vivo es del cielo: la luz del musgo y la aurora. La interfaz usa crema, y un verde salvia apagado solo para los carbohidratos y lo que va bien (cambio 10).
- Musgo y estrellas: el musgo aparece en algunas zonas, las estrellas en otras, y en lugares puntuales los dos juntos.
- Animaciones fluidas en toda la app. A Ascent le quedó lag al cambiar de pantalla en teléfonos peores; acá las animaciones van nativas desde el inicio (Reanimated o Skia).
- Ajuste de calidad gráfica alta / media / baja en Ajustes, con valor por defecto según el teléfono.
- Marcar un hábito tiene que seguir siendo instantáneo: lo espectacular va en el cielo y en las animaciones, no en frenar el toque.

## Contenido

- Frase diaria: estoicos (Marco Aurelio, Séneca, Epicteto), frases modernas cortas y atribuidas, y frases propias. Sin fragmentos de mitos. El lema de la app es "Do so much volume that it will be unreasonable to fail."

## Widgets

- En la pantalla de bloqueo, las calorías y los macros del día (versión 1).
- Si se puede, los hábitos como widgets. Ver [`widgets.md`](widgets.md).

## Entrada a la app (obligatoria, como en Ascent)

Orden exacto:

1. Frase de apertura: "Primero hacemos nuestros hábitos, después nuestros hábitos nos hacen a nosotros." En inglés: "We first make our habits, and then our habits make us." Mostrala atribuida a John Dryden con un "atribuida a" (la atribución es dudosa).
2. Dos diapositivas de tutorial, muy cortas:
   - "Tus hábitos son estrellas": tocá una estrella para encenderla; cada día tiene su propia constelación.
   - "Tu comida, a tu medida": registrás lo que comés y Moss ajusta tus metas cada semana.

   Cada pantalla (la frase y las dos diapositivas) dura 2 a 3 segundos que no se pueden saltear, y todas llevan animación. Lo visual acá es tan importante como en el resto de la app: es lo primero que ve el usuario.
3. Inicio de sesión. Elegí vos los métodos y tené en cuenta lo que exige Apple.
4. Apenas inicia sesión, va directo al cuestionario: edad, sexo, altura, peso, nivel de actividad y objetivo (bajar, mantener o subir), más los permisos de Apple Health. Con eso se calcula la meta inicial de calorías y macros.
5. Al terminar el cuestionario, el usuario usa toda la app.
6. Vincular con Ascent no es parte de la entrada: es opcional y queda disponible después, desde las funciones bloqueadas y desde Ajustes.

La entrada va a la galería privada para aprobarla antes de conectarla con la lógica.

## Social

Es una parte chica de la app.

- Ver el cielo de un amigo: sus constelaciones y su universo.
- Ranking entre amigos por porcentaje de constancia, no por cantidad de hábitos.
- Ver los hábitos de un amigo, solo si él elige mostrarlos.
- Reacciones: mandar un destello cuando un amigo completa el día.

## Conexión con Ascent

Dos apps distintas que funcionan mejor juntas. Ascent es mi otra app (Expo + Supabase, repo github.com/condezuzu/ascent). Tiene registro de días de gimnasio, rangos cósmicos, pesos y marcas por ejercicio (DOTS), sesiones con duración, series y volumen por músculo, volumen total por semana, peso corporal y pasos.

Solo con las dos conectadas:

1. Recuperación: un puntaje diario que cruza el sueño y la comida de Moss con el entrenamiento de Ascent (volumen, días seguidos, duración). En Ascent, antes de entrenar, indica si conviene ir fuerte o suave; en Moss también se ve.
2. Por qué no subís: Ascent ya avisa cuando hay estancamiento en un ejercicio. Conectada, el aviso explica la causa probable con datos de Moss (sueño, proteína, calorías). Por ejemplo: "tus mejores marcas llegan las semanas que dormís 7 h o más y llegás a la proteína".
3. Resumen anual juntos: entrenamientos, marcas, hábitos, sueño y comida del año en uno solo.

Andan solas, pero mejor conectadas:

4. Peso único: pesarse en cualquiera de las dos actualiza las dos (Ascent lo usa para el DOTS, Moss para ajustar las metas de comida).
5. Calorías según el día: los días de entrenamiento en Ascent suben la meta de calorías de Moss, y los días de descanso la bajan lo mismo. El control ya cuenta el entrenamiento de siempre en el gasto, así que no se suma nada: se reparte, y la semana suma lo que da el control.
6. Objetivo compartido: si en Moss el usuario está en volumen o en definición, Ascent ajusta lo que espera de su fuerza.
7. ~~Login y amigos compartidos~~: ya no va (28/10/2026, D29). Moss y Ascent tienen cuentas separadas, cada una con su información, y se vinculan aunque usen correos o Apple ID distintos: vincular conecta dos cuentas para que compartan datos, no las junta. Borrar una borra lo suyo y corta el vínculo; la otra sigue intacta. Cada app funciona perfectamente sola.
8. Proteína post-entreno: según el volumen de la sesión en Ascent (las series y el peso movido), Moss sube la meta de proteína de ese día, hacia el techo útil de 2,2 g por kilo.
9. Gimnasio automático: si el día quedó registrado en Ascent, el hábito de gimnasio se enciende solo en Moss.

Sin vincular:

- En Ascent, las funciones conectadas aparecen bloqueadas dentro de Stats, con un botón para vincular.
- En Moss viven en su propia sección, arriba de Hábitos (cambio 10). Sin vincular, cada función muestra vacío lo que va a mostrar, con «Vincular» arriba; vinculada, muestra lo de hoy. Las dos formas tienen que verse bien. La recuperación también se ve en Sueño.
- Si el usuario no tiene la otra app, el botón lleva a la App Store.
- Vincular también está disponible desde Ajustes en las dos apps.

Resolvé vos cómo se sincronizan técnicamente (mismo Supabase o proyectos separados, y cómo se vinculan las cuentas). Hacé todo lo que puedas solo; si necesitás que yo haga algo (permisos en Supabase, en Apple Developer o lo que sea), avisame qué exactamente y dónde. Incluí en el plan qué cambios hacen falta en el repo de Ascent; esos se hacen después, en una sesión aparte sobre Ascent.

La solución está en [`ascent.md`](ascent.md).

## Técnico

- Solo iPhone. Expo, con build propia (Apple Health no funciona en Expo Go). Ya tengo la cuenta de Apple Developer activa.
- Supabase con cuentas desde el inicio.
- Global desde el inicio y gratis: español neutro e inglés, con todos los textos en un diccionario desde el día uno, y los nombres de los alimentos de cada país.

## Versión 1 (para mandar a revisión)

- **La comida, completa:**
  - la base propia (Uruguay y los 1.000 del mundo), Open Food Facts y USDA;
  - el registro sobre la línea del día;
  - los 13 atajos;
  - las metas con su check-in semanal, con el día que se elige;
  - el peso;
  - Inicio a tu medida, Comida y el «+»;
  - los widgets de la pantalla de bloqueo.
- **Progreso:** el peso y su tendencia, las medidas con la grasa corporal estimada, el gasto, el balance, el progreso al objetivo y la estrategia.
- **Sueño:** la sección entera ([`sueno.md`](sueno.md)).
- **Entrada y cuentas:** la entrada a la app y las cuentas.
- **Hábitos y cielo:**
  - creación y edición de hábitos por día de la semana;
  - el cielo continuo con constelaciones reales;
  - marcar tocando estrellas;
  - los puntos y el cielo que crece con ellos;
  - la animación de día completo;
  - el calendario;
  - estadísticas básicas.
- **Apple Health:**
  - peso y agua;
  - pasos y mindfulness;
  - sueño (la sección de Sueño) y los hábitos de sueño automáticos.
- Logros.
- Frase diaria.
- Ajuste de calidad gráfica.
- Español e inglés.

## Después

- Importar recetas desde un link.
- App para Apple Watch.
- Amigos y todo lo social.
- Conexión con Ascent (todo lo de la sección de arriba).
- Widgets.
- Estimación del sueño sin reloj: investigar cómo lo hace Rise (usa el movimiento y el uso del teléfono, asumiendo que lo tocás justo antes de dormir y apenas despertás) y si se puede hacer en iOS.

## Cómo trabajamos

- Lo visual nuevo lo veo en una galería privada en la web, como la de Ascent, con datos de mentira, que se actualiza en el mismo enlace. Ahí lo reviso y decido.
- Todo lo que puedas hacer vos, hacelo vos; yo autorizo.

## Primera tarea

1. Creá el proyecto Expo de Moss y la estructura base.
2. Guardá en el repo este documento como especificación y un plan por etapas hasta la versión 1.
3. Construí primero el cielo en la galería privada, con datos de mentira: el cielo con vía láctea y auroras, una constelación a medio encender, el toque sobre una estrella y la animación de día completo. Quiero aprobar lo visual antes de que programes la lógica.
4. Respondeme lo de Supabase (mismo proyecto que Ascent o aparte).

Cuando termines, pasame el informe.
