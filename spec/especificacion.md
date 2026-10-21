# Moss — especificación de producto

Documento original del producto, tal como se escribió el 21/10/2026. Es la
fuente de verdad: lo que está acá ya está decidido. Las decisiones que se tomen
después van en [`decisiones.md`](decisiones.md) y el orden de trabajo en
[`plan.md`](plan.md).

---

Vamos a crear Moss, una app de hábitos para iPhone, desde cero. Es mi segunda app: la primera es Ascent (app de racha de gimnasio, Expo + Supabase, repo github.com/condezuzu/ascent, ya publicada en la App Store). El objetivo es mandar la versión 1 a revisión de Apple lo antes posible, pero lo visual es el producto: tiene que verse espectacular, muy por encima de una app de hábitos normal.

## Concepto

Moss convierte los hábitos en un cielo nocturno. Cada hábito es una estrella; los hábitos de cada día forman una constelación real con su mito griego real. El nombre viene de "mos" (costumbre en latín) y "moss" (musgo en inglés, que crece lento pero siempre).

Competencia directa que ya existe: Sideria y Stellar Habits (hábitos como estrellas). Moss se diferencia por: la mitología como progresión, un puntaje que premia el esfuerzo sostenido y nunca castiga, el registro automático (Apple Health, sueño, Ascent), el cielo continuo como interfaz y lo exagerado de lo visual.

## Mecánica

1. Hábitos: los crea el usuario y son totalmente personalizables (nombre, ícono, qué días de la semana tocan, y si se cumplen a mano o solos desde Apple Health con una meta, por ejemplo 8.000 pasos).
2. Una constelación por día de la semana: cada día tiene sus propios hábitos, y la cantidad de hábitos de ese día define qué constelación real le toca (si el lunes tiene 5 hábitos, el lunes es una constelación de 5 estrellas principales). Armá el catálogo de constelaciones reales agrupadas por cantidad de estrellas principales, cubriendo de 1 a 15 o más.
3. Cambiar hábitos: si se agrega o saca un hábito de un día, ese día pasa a otra constelación con la nueva cantidad. La anterior queda guardada en el cielo del usuario con todo su progreso.
4. Cada noche: los hábitos hechos se encienden como estrellas. Si se completan todos los del día, las líneas se conectan, aparece la figura del mito y hay una animación grande (las auroras se intensifican).
5. Puntos por día con rendimientos decrecientes: el primer hábito del día vale 3 puntos y cada hábito extra vale 1. Ejemplo: una semana de 6,4,3,7,5,4,6 hábitos suma 49; una de 10,2,2,2,2,2,2 suma 36. Gana la constancia, no los picos.
6. Nada se pierde: no hay rachas, ni vidas, ni multiplicadores que se reseteen. El progreso solo sube, más rápido o más lento. Faltar un día solo frena.

## Progresión

- Cada una de las 7 constelaciones del usuario (una por día de la semana) tiene su mito griego real dividido en capítulos. La luz que se junta en los días que le corresponden desbloquea capítulos de ese mito. Al completar el mito aparece su dios o héroe.
- Las 7 constelaciones juntas forman el universo del usuario.
- Logros con nombres de dioses (por ejemplo, 30 noches completas, o volver después de una semana sin actividad).
- La progresión es lenta y premia a quien sostiene durante más tiempo.

## Registro

- Marcar a mano: tocando la estrella directo en el cielo (no hay lista), con vibración y destello. Se puede deshacer.
- Automático desde Apple Health: pasos, agua, mindfulness y cualquier dato de Salud que el usuario elija como hábito.
- Sueño desde Apple Health: duración, etapas (REM, núcleo, profundo), despierto y en cama, y una calidad de sueño calculada a partir de eso. Hábitos de sueño que se cumplen solos: "dormir X horas" y "acostarse antes de X hora".
- Calendario donde cada día es un mini cielo; el mes se lee de un vistazo.
- La zona horaria es la del teléfono (si viajás, el día corta en tu hora local).

## Visual (lo más importante)

- Un solo cielo continuo: deslizar mueve la cámara por el espacio en vez de saltar entre pantallas. Zonas del cielo: hoy, constelaciones y mitos, calendario, estadísticas, amigos y ajustes.
- Cielo exagerado, como el que se ve sin contaminación lumínica: muchísimas estrellas, vía láctea y auroras.
- Las constelaciones son parte del fondo: cuantos más hábitos hechos, más cielo encendido, así cada cielo es distinto.
- Paleta: azul noche profundo, dorado y toques de verde musgo. Distinta de Ascent, que es astronomía y física; Moss es mitología, cálida.
- Musgo y estrellas: el musgo aparece en algunas zonas, las estrellas en otras, y en lugares puntuales los dos juntos.
- Animaciones fluidas en toda la app. A Ascent le quedó lag al cambiar de pantalla en teléfonos peores; acá las animaciones van nativas desde el inicio (Reanimated o Skia).
- Ajuste de calidad gráfica alta / media / baja en Ajustes, con valor por defecto según el teléfono.
- Marcar un hábito tiene que seguir siendo instantáneo: lo espectacular va en el cielo y en las animaciones, no en frenar el toque.

## Contenido

- Frase diaria: mezcla de estoicos (Marco Aurelio, Séneca, Epicteto), fragmentos de mitos, frases modernas cortas y atribuidas, y frases propias. El lema de la app es "Do so much volume that it will be unreasonable to fail."
- Mitos: el mito real de cada constelación, escrito por capítulos.

## Social

Es una parte chica de la app.

- Ver el cielo de un amigo: sus constelaciones y su universo.
- Ranking entre amigos por porcentaje de constancia, no por cantidad de hábitos.
- Ver los hábitos de un amigo, solo si él elige mostrarlos.
- Reacciones: mandar un destello cuando un amigo completa el día.

## Conexión con Ascent

Dos apps distintas, con algo de sinergia:

- Iniciar sesión en Moss con la cuenta de Ascent.
- El hábito de gimnasio de Moss se cumple solo si ese día quedó registrado en Ascent.
- Cosas que se desbloquean solo si el usuario tiene las dos apps conectadas.
- En Ascent, un aviso sobre Moss en Ajustes o en Stats: visible pero sin molestar.

Investigá si conviene que Moss use el mismo proyecto de Supabase que Ascent o uno aparte, y recomendame con el porqué antes de decidir.

## Técnico

- Solo iPhone. Expo, con build propia (Apple Health no funciona en Expo Go). Ya tengo la cuenta de Apple Developer activa.
- Supabase con cuentas desde el inicio.
- Español neutro e inglés, con todos los textos en un diccionario desde el día uno.

## Versión 1 (para mandar a revisión)

- Cuentas, creación y edición de hábitos por día de la semana, cielo continuo con constelaciones reales, marcar tocando estrellas, puntos, animación de día completo, calendario, estadísticas básicas.
- Apple Health: pasos, agua, mindfulness, sueño (duración y etapas) y hábitos de sueño automáticos.
- Mitos por capítulos y logros.
- Frase diaria.
- Ajuste de calidad gráfica.
- Español e inglés.

## Después

- Amigos y todo lo social.
- Conexión con Ascent (login compartido, gimnasio automático, desbloqueos y aviso en Ascent).
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
