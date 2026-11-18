# Lo visual por OTA a la build 6 (16/11/2026): dónde quedó

Pediste que lo aprobado en la galería llegue ya, por aire, a la build 6 (tu amigo la usa para probar), sin
esperar la 1.1. Se trabaja en la rama `visual-ota`, que sale de `ota-build6` (la huella de la build 6,
fc0d415b): nada de paquetes, `package.json`, `app.json` ni `.gitignore`. Antes de cada OTA,
`node herramientas/verificar-huella.mjs` tiene que dar fc0d415b. La OTA va directo a `production` (lo pediste:
solo la usa tu amigo). La suscripción está prendida en EAS, pero en la build 6 no hay módulo `Compras`, así que
no aparece la pantalla de pago (`hayCompras()` en `src/lib/premium.ts`).

## Tanda 1 (terminada y publicada el 16/11)

Hecha y probada en la web (1496 tests, tipos, lint, Supabase, export y la huella fc0d415b). Quedó afuera: el ritmo o la fecha elegidos en Progreso no se guardan (pide una columna en `moss.perfiles`), «Cuando llegues» no se lee, la línea de Sueño según el deporte y los consejos del deporte salvo pesas y correr (piden el tipo de deporte del cuestionario nuevo), el reflujo en «Esta noche» (pide Cuidados) y la aurora de Sueño se desliza con la página.

Lo que sigue es cómo se pausó:

Cuatro agentes, uno por sección, con estas reglas: la galería es el diseño aprobado, la lógica de `src/dominio/`,
los textos en es y en con `textos.cjs` (el que mezcla sin pisar), nada de golpe, nada de Ascent, números ocultos,
probar en la web con su propio puerto, y typecheck, lint y jest antes de terminar. Se pararon a medio hacer: lo
que hay en este commit **no está probado** (ni tipos ni tests). Hay que retomar cada sección desde lo que dejó.

- **Inicio** (`src/secciones/inicio/`, `src/secciones/kcal/`): «Para hoy» abajo, el control debajo de la luna
  desde dos días antes, la luna con relieve (`galeria/src/luna.js`), el primer día sin datos, tocar la luna →
  «Todo lo de hoy» con los cinco estilos de las calorías (`galeria/src/kcal.js`) y el botón de tu energía arriba
  a la derecha con su globo y «Más en Sueño». Empezados: `inicio/paraHoy.ts`, `inicio/energia.ts`, `kcal/`.
- **Progreso** (`src/secciones/progreso/`, `src/secciones/graficos/`): el control en una línea, el plan por
  etapas con «Cambiar el plan», la grasa en el medio, «Más datos», el ritmo y la fecha con su margen y
  «Todavía no se sabe», el plazo (D35) y los gráficos de D39. Empezados: `progreso/Plan.tsx`,
  `progreso/unidades.ts` y los gráficos.
- **Sueño** (`src/secciones/sueno/`): las auroras, el arco de la noche, la calidad en anillo, el horario y los
  vitales; la deuda arriba en una palabra con «Esta noche» y «Más»; tu energía debajo de la noche, según la hora.
  Empezados: `sueno/LaNoche.tsx`, `Dibujos*.tsx`, `arco.ts`, `Energia.tsx`, `energia.ts`, `comunes.tsx`.
- **El «+»** (`src/secciones/HojaMas.tsx`): tu comida de siempre de esta hora en un toque y lo que sueles comer
  a esa hora. Empezado: `HojaMas.tsx`, `src/dominio/registros.ts` (con su test), el almacén y `persona.ts`.

Después: probar todo en la web contra la galería, `npm test`, typecheck, lint, export, la huella, la OTA a
`production`, y juntar `visual-ota` con `mejoras-1.1` (para que la 1.1 también lo tenga).

## Tanda 2 (publicada el 16/11, salvo los avisos)

En la app: el cuestionario nuevo con Cuidados y «Tus respuestas» (lo nuevo se guarda en el teléfono: ajustes `respuestas` y `cuidados`), Perfil (la tarjeta, Aparatos con «Conectar directo», Cuidados, «En qué se basa Moss») y la foto de la comida. Los avisos que siguen tu despertar: la regla está (`sigueElDespertar.ts`, 18 tests) y la propuesta en la galería (escenario `dia`), pero la app no le pasa el despertar real: se conecta en `src/recordatorios/programar.ts` cuando lo apruebes, con D8 a D10 de `spec/estudio/momentos.md`. Afuera: la pantalla de pago, Polar («Pronto»: no hay conexión detrás), la última foto del carrete en «Tus fotos» (pide `expo-media-library`) y los pasos de Salud para cuánto te mueves.

Lo que se planeó:

Primero, **el día que sigue tu despertar** (spec/avisos.md: lo pediste el 16/11, después de que «pesarte» sonara antes de que te despertaras). Después:

El cuestionario nuevo y «Tus respuestas», Cuidados (D44), Perfil (la tarjeta, los créditos, las hojas y «En qué
se basa Moss»), la foto de la comida, los consejos según el deporte y los avisos al estilo RISE. Afuera: Ascent
(apagada), la pantalla de pago y los widgets nuevos (piden la build 1.1).

## Tanda 3 (17/11, a la noche): todo lo que faltaba y no pide build

Lo pediste porque en tu iPhone la app se veía «vieja» y «toda oscura» frente a la galería, y después: «todo,
absolutamente todo lo que falta, meterlo en la app ahora». Publicada por aire a las dos builds (`visual-ota` 3fe40d4,
huella fc0d415b; `mejoras-1.1` bc263a3, huella 13eb29e0) y la galería 51.

**Por qué se veía vieja:** expo-updates baja la actualización al abrir y la muestra recién en el próximo arranque
desde cero, y iOS deja a Moss abierta de fondo durante días. Ahora `src/lib/actualizaciones.ts` la busca al abrir y
al volver (cada 10 minutos como mucho) y la aplica al ir al fondo, si no hay una hoja abierta, o enseguida si Moss
recién abrió. Sin probar en un iPhone.

**Entró:**
- Tu energía: el botón dice solo el título («Energía suficiente», sin «Por la comida»); el globo tiene Sueño (Bien,
  Regular o Mal) y Comida (hoy y estos días juntos); «Más en Sueño» baja a la tarjeta, que lo explica todo.
- Sueño: la deuda primero y la mañana debajo; la deuda noche por noche en «Más» (`nochesDeLaDeuda`); la aurora fija
  detrás de la tira; la línea del deporte (el partido de noche, dormir más).
- Ascent «Pronto» con la bandera apagada: Progreso (arriba a la derecha, con su globo) y Perfil › Conexiones.
- Progreso: el ritmo o la fecha se guardan en el teléfono (ajuste `plazo`) y mueven la meta; «Cuando llegues» se lee;
  los decimales fijos de la galería.
- Perfil: Entrenamiento según el deporte (deportes, partido, carrera, viaje, categoría de peso), el país de los
  alimentos, la línea de datos de otra cuenta, las noches de Aparatos; `canOpenURL` solo donde la build declara el
  esquema. El cuestionario sugiere «¿Cuánto te mueves?» con los pasos de Salud.
- Avisos y Cuidados: lo que apaga Cuidados se aplica a «Para hoy», lo que falta, la línea del entreno y el agua; los
  avisos de comer con las sesiones de cada día; «Mañana juegas» y la carrera con sus interruptores; el despertador en
  el widget de la noche.
- Inicio, el «+», Comida y Hábitos igualados a la galería (alturas, lunas, puntos de los macros, degradados, la
  píldora Día · Semana · Mes, «Tu universo»); todas las hojas con el fondo de la galería y el título centrado.

**Afuera:**
- Pide build: pesarse antes y después (un peso por día), más carga con poco sueño (la carga de Salud), el widget
  del agua sin meta, y lo de spec/detalles.md y el inventario (teclado, acciones rápidas, más Salud, carrete, Siri).
- Pide decisión — separar «avisarme a esa hora» de «mis horas de comer»: (1) ¿la hora del cuestionario va antes que
  la mediana de lo anotado, y el horario de avisos deja de contar? (spec/entreno.md 5.11 dice lo contrario); (2) ¿el
  aviso suena a «mi hora de comer» o conserva su hora propia?; (3) «No suelo» una comida, ¿sale del horario?; (4) quien
  no contestó el cuestionario nuevo, ¿sigue con su horario de avisos?; (5) ¿se cambian en «Tus respuestas» o en una
  pantalla nueva?
- Sin revisar contra la galería: la entrada, el cuestionario, Cuidados, «En qué se basa Moss», la guía y Editar perfil.
- Sin hacer (solo JS, para otra tanda): la lista completa de frases del día, el flum de la entrada y lo de fluidez.
