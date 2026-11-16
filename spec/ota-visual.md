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
