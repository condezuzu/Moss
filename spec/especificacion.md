# Moss — especificación de producto

Documento del producto escrito el 21/10/2026, con los cambios que se sumaron ese
mismo día ya puestos en cada sección (la lista está abajo). Es la fuente de
verdad: lo que está acá ya está decidido. Las decisiones que se tomen después van
en [`decisiones.md`](decisiones.md) y el orden de trabajo en [`plan.md`](plan.md).
Los detalles técnicos están en [`nutricion.md`](nutricion.md),
[`ascent.md`](ascent.md) y [`widgets.md`](widgets.md).

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

---

Vamos a crear Moss, una app de hábitos para iPhone, desde cero. Es mi segunda app: la primera es Ascent (app de racha de gimnasio, Expo + Supabase, repo github.com/condezuzu/ascent, ya publicada en la App Store). El objetivo es mandar la versión 1 a revisión de Apple lo antes posible, pero lo visual es el producto: tiene que verse espectacular, muy por encima de una app de hábitos normal.

## Concepto

Moss convierte los hábitos en un cielo nocturno. Cada hábito es una estrella; los hábitos de cada día forman una constelación real. Moss tiene dos partes principales con el mismo peso: los hábitos y la comida. El nombre viene de "mos" (costumbre en latín) y "moss" (musgo en inglés, que crece lento pero siempre).

Competencia directa que ya existe: Sideria y Stellar Habits (hábitos como estrellas). Moss se diferencia por:

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

- El progreso pasa a ser el cielo mismo: a medida que se acumulan puntos, el cielo del usuario se vuelve más rico. Aparecen más estrellas, la vía láctea se hace más intensa, las auroras crecen y el musgo se expande. El progreso se ve, no se lee.
- Las constelaciones siguen existiendo como parte visual del cielo (una por día de la semana, con su forma real), pero su nombre aparece chico y discreto, no como protagonista.
- Nada de capítulos, historias ni el dios o héroe que aparece al completar.
- Las 7 constelaciones juntas forman el universo del usuario.
- Los logros se mantienen, pero sin narración mitológica (por ejemplo, 30 noches completas, o volver después de una semana sin actividad). Propuesta de nombres en [`decisiones.md`](decisiones.md), D6.
- La progresión es lenta y premia a quien sostiene durante más tiempo.

## Registro

- Marcar a mano: tocando la estrella directo en el cielo (no hay lista), con vibración y destello. Se puede deshacer.
- Automático desde Apple Health: pasos, agua, mindfulness y cualquier dato de Salud que el usuario elija como hábito.
- Sueño desde Apple Health: duración, etapas (REM, núcleo, profundo), despierto y en cama, y una calidad de sueño calculada a partir de eso. Hábitos de sueño que se cumplen solos: "dormir X horas" y "acostarse antes de X hora".
- Calendario donde cada día es un mini cielo; el mes se lee de un vistazo.
- La zona horaria es la del teléfono (si viajás, el día corta en tu hora local).

## Nutrición

Moss pasa a tener dos partes principales con el mismo peso: los hábitos y la comida. El modelo para la comida es MacroFactor, sin IA.

1. Cuestionario al descargarla: edad, sexo, altura, peso, nivel de actividad y objetivo (bajar, mantener o subir). Con eso se estima el gasto con una fórmula estándar y se calcula la meta inicial de calorías y macros.
2. Metas automáticas: un check-in semanal recalcula el gasto real con la comida registrada y la tendencia del peso, y ajusta las metas de calorías y macros. El ajuste es igual haya cumplido o no el usuario (encaja con Moss: nada se pierde).
3. Peso diario: desde Apple Health, desde Ascent o cargado a mano en Moss. Se usa la tendencia, no el número de un solo día.
4. Qué se registra: calorías, proteína, carbohidratos y grasas.
5. Registrar una comida:
   - Foto opcional, solo como recuerdo visual de la comida (no se analiza con IA).
   - Qué es: buscador sobre la base de datos con sugerencias mientras se escribe, tolerante a errores de tipeo y con lo más usado primero.
   - Cuánto: gramos o porciones ("1 pechuga", "1 taza"). Moss calcula los valores a partir de los datos por 100 g.
6. Registro rápido: escáner de código de barras, historial y frecuentes, copiar una comida o un día anterior, recetas y comidas propias, y carga manual de calorías y macros.
7. Bases de datos: Open Food Facts para productos envasados y USDA FoodData Central para alimentos genéricos (pollo, arroz, banana). La recomendación y los nombres en español están en [`nutricion.md`](nutricion.md).
8. Conexión con hábitos: metas como "llegar a la meta de proteína" o "registrar todas las comidas" son hábitos que se encienden solos en el cielo.
9. Conexión con Ascent: el peso corporal de Ascent alimenta el algoritmo, y los días de gimnasio en Ascent pueden subir la meta de calorías de ese día.
10. Lugar en la app: una zona propia del cielo, dedicada a la comida, con el mismo nivel visual que el resto.

## Visual (lo más importante)

- Un solo cielo continuo: deslizar mueve la cámara por el espacio en vez de saltar entre pantallas. Zonas del cielo: hoy, constelaciones, comida, calendario, estadísticas, amigos y ajustes.
- Moverse entre secciones (por ejemplo, de inicio al menú o a ajustes) tiene un movimiento como si se estuviera yendo muy lejos, muy rápido: una animación de un segundo, tipo «flum».
- Cielo exagerado, como el que se ve sin contaminación lumínica: muchísimas estrellas, vía láctea y auroras.
- Las constelaciones son parte del fondo: cuantos más hábitos hechos, más cielo encendido, así cada cielo es distinto.
- Paleta: azul noche profundo, dorado y toques de verde musgo. Distinta de Ascent, que es astronomía y física. La estética de Moss va hacia menos mitología, más cielo nocturno y naturaleza (musgo), y es cálida.
- Musgo y estrellas: el musgo aparece en algunas zonas, las estrellas en otras, y en lugares puntuales los dos juntos.
- Animaciones fluidas en toda la app. A Ascent le quedó lag al cambiar de pantalla en teléfonos peores; acá las animaciones van nativas desde el inicio (Reanimated o Skia).
- Ajuste de calidad gráfica alta / media / baja en Ajustes, con valor por defecto según el teléfono.
- Marcar un hábito tiene que seguir siendo instantáneo: lo espectacular va en el cielo y en las animaciones, no en frenar el toque.

## Contenido

- Frase diaria: estoicos (Marco Aurelio, Séneca, Epicteto), frases modernas cortas y atribuidas, y frases propias. Sin fragmentos de mitos. El lema de la app es "Do so much volume that it will be unreasonable to fail."

## Widgets

Si se puede, poner los hábitos como widgets. Ver [`widgets.md`](widgets.md).

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
5. Calorías según el día: los días de entrenamiento en Ascent suben la meta de calorías de Moss, y los días de descanso la bajan.
6. Objetivo compartido: si en Moss el usuario está en volumen o en definición, Ascent ajusta lo que espera de su fuerza.
7. Login y amigos compartidos: una sola cuenta y una sola lista de amigos para las dos apps.
8. Proteína post-entreno: según el volumen de la sesión en Ascent, Moss sube la meta de proteína de ese día.
9. Gimnasio automático: si el día quedó registrado en Ascent, el hábito de gimnasio se enciende solo en Moss.

Sin vincular:

- No hay una ventana aparte. Las funciones conectadas aparecen bloqueadas dentro de Stats en Ascent y dentro de la sección equivalente de Moss, con un botón para vincular. Si el usuario no tiene la otra app, el botón lleva a la App Store.
- Vincular también está disponible desde Ajustes en las dos apps.

Resolvé vos cómo se sincronizan técnicamente (mismo Supabase o proyectos separados, y cómo se vinculan las cuentas). Hacé todo lo que puedas solo; si necesitás que yo haga algo (permisos en Supabase, en Apple Developer o lo que sea), avisame qué exactamente y dónde. Incluí en el plan qué cambios hacen falta en el repo de Ascent; esos se hacen después, en una sesión aparte sobre Ascent.

La solución está en [`ascent.md`](ascent.md).

## Técnico

- Solo iPhone. Expo, con build propia (Apple Health no funciona en Expo Go). Ya tengo la cuenta de Apple Developer activa.
- Supabase con cuentas desde el inicio.
- Español neutro e inglés, con todos los textos en un diccionario desde el día uno.

## Versión 1 (para mandar a revisión)

- Entrada a la app, cuentas, creación y edición de hábitos por día de la semana, cielo continuo con constelaciones reales, marcar tocando estrellas, puntos y el cielo que crece con ellos, animación de día completo, calendario, estadísticas básicas.
- Comida: la entrada (que es obligatoria) ya calcula las metas, así que la comida entra en la v1. Qué partes de la comida entran: D7 en [`decisiones.md`](decisiones.md).
- Apple Health: pasos, agua, mindfulness, sueño (duración y etapas) y hábitos de sueño automáticos.
- Logros.
- Frase diaria.
- Ajuste de calidad gráfica.
- Español e inglés.

## Después

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
