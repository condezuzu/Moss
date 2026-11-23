# La búsqueda de bugs (23/11/2026)

Lo pediste el 23/11: una búsqueda de bugs, que casi no habíamos hecho. Cinco revisores leyeron el código por áreas
(comida y metas; almacén y sincronización; sueño, avisos y widgets; suscripción, entrada y Perfil; las pantallas) y
corrieron código para confirmar lo que podían, sin tocar el repo. Salieron 44 hallazgos; los que se repetían entre
revisores van una vez.

**Cómo leerlo.** «Confirmado» es que se reprodujo corriendo el código; «verificado» es que lo revisé yo además del
revisor; «leído» es que sale de leer el código y nada lo maneja. Antes de arreglar cada uno se escribe su test, que
tiene que fallar primero.

Dos que ya estaban arreglados ese día, antes de la búsqueda: la hora de acostarse de «Sugerencias para hoy» salía
corrida 18 horas (04:25 en vez de 22:25: el periodo de melatonina cuenta desde las 18), y en inglés decía «Sets of 8 a
12 reps» (el dominio devolvía el texto en español). Salieron por aire el 23/11.

## Tanda A: lo que más se nota (arreglada el 23/11, con tu sí, y por aire)

**Estado:** los 15 arreglados, cada uno con su test que fallaba antes (2003 tests en total). Lo que quedó:
- **El aviso «Elige tu plan» (3)** sigue llevando a Perfil: para mostrar los planes a quien todavía tiene el regalo hace
  falta algo visual (un «Ahora no» en la pantalla de pago, o «Elegir un plan» en Tu suscripción). Va primero a la galería.
- **Cuando Moss se entera tarde del despertar (9)**, más de 2 h después, la deuda y pesarse ya no desaparecen: guardan su
  lugar sin sonar. Por eso «¿Desayunas hoy?» sale 20 minutos más tarde que antes en ese caso. Para que salga enseguida
  hay que guardar el despertar que se conocía al saberlo (almacén y programar), para otra tanda.
- **Una siesta de un día sin noche en Salud (6)** ya no es la noche, pero esa siesta todavía no suma a la deuda.
- **La medida sin número (12)**: «filete de merluza» ahora se lee como 1 filete de merluza, igual que «un filete de
  merluza».
- **Con la suscripción vigente y el regalo (3)**, el acceso es el de la suscripción: no ve la bienvenida de los 3 meses.
- Nuevo, que ya pasaba: un hábito marcado antes de su hora deja de atrasar a los demás, pero cuando pasa su hora vuelve
  a atrasarlos, y un aviso puede sonar dos veces (leer a las 13:30, marcado a las 13:00: el almuerzo a las 13:45 y otra
  vez a las 13:50). Se arregla con la hora en que se marcó, que programar ya tiene. Va a la tanda B.
- Nuevo, menor: `faltaParaEstimar` (progreso.ts) no mira si el control alcanza, igual que Inicio antes.

1. **En iOS, los avisos de hoy desaparecen de la pantalla bloqueada** (verificado). Al reprogramar (al abrir Moss o
   en la tarea de fondo), `sacarLosQueYaNoDicenNada` (`src/recordatorios/programar.ts:281`) toma la fecha del aviso en
   milisegundos, pero iOS la da en segundos (`NotificationRecords.swift:445` de expo-notifications): cae en 1970, es
   «de otro día» y se borra. Solo se salvan los de comida, que llevan su día. Arreglo: que todos lleven `dia` en
   `data`, y leer la fecha en segundos si es chica.
2. **«Tus respuestas» pierde la grasa y cambia la meta sola** (verificado y confirmado). Si la grasa salió de la
   figura o de la cinta, al guardar cualquier cosa (por ejemplo, la hora de despertarte desde Avisos) queda en «no sé»
   y la meta se rehace sin ella: 2440 → 2690 kcal en el caso probado (`src/secciones/entrada/respuestas.ts:313`).
   Arreglo: guardar el porcentaje como «dicho».
3. **El regalo tapa una suscripción vigente** (confirmado). `acceso()` (`src/dominio/premium.ts:33`) devuelve
   «regalo» antes de mirar la suscripción: igual suena «Tu regalo termina», los avisos se cortan al vencer el regalo y
   Tu suscripción esconde el plan y «Administrar». Y el aviso «Elige tu plan» lleva a Perfil, donde no hay ningún plan.
   Arreglo: la suscripción vigente primero; la hoja del regalo con «Elegir un plan».
4. **Sin conexión, quien renovó queda afuera al volver a la app** (leído). La espera a los precios para decidir «sin
   conexión» solo se hace al arrancar (`src/lib/premium.ts:163-180`); al volver de fondo, con la mensual renovada y en
   un avión, sale la pantalla de pago. Arreglo: la misma espera al volver.
5. **El corte del regalo se compara en UTC** (confirmado). Una cuenta creada en Uruguay el 13/11 a las 21:30 ya es
   del 14/11 en UTC y queda sin regalo (`premium.ts:66`). Arreglo: comparar a la hora de Uruguay. (El corte en el
   14/11 lo decidiste el 22/11: quien se anotó entre el 14 y el 22/11 con la 1.0 ve la pantalla de pago.)
6. **Una siesta en Salud se vuelve «la noche»** (confirmado). Con el anillo cargando de noche y una siesta de 40 min,
   la noche del día es la siesta: le gana a la de Moss aunque la hayas confirmado, el periodo se corre a la 01:07 y la
   deuda suma el tope (`src/dominio/sueno.ts:270`, `sinReloj.ts:506`, `src/salud/nocheSinReloj.ts:83`). Arreglo: lo
   de Salud que no es una noche (despertar pasado el mediodía o menos de 3 h) no le gana a la de Moss.
7. **Noche partida en el reloj más otra fuente continua: gana la peor** (confirmado). Apple Watch en dos tramos y
   Sleep Cycle de corrido: queda Sleep Cycle aunque elegiste el reloj (`sueno.ts:271`). Arreglo: sumar lo de cada
   fuente antes de comparar, y respetar la elegida.
8. **Un aviso adelantado vuelve a sonar** (confirmado). Si un aviso se corrió «un rato antes» por otro y ese otro se
   marca, al reprogramar vuelve a su hora y suena dos veces (`src/dominio/avisos.ts:366` y `:539`).
9. **«¿Desayunas hoy?» a cualquier hora, y la madrugada como despertar** (confirmado). Si Moss se entera del
   despertar a las 16, el desayuno suena a las 16:02; sin hora de siempre, abrir Moss a las 00:30 cuenta como
   despertarse; y si el despertar de Salud llega tarde, se pierde el desayuno y se liberan lugares del máximo
   (`src/dominio/sigueElDespertar.ts:124-148` y `:229`).
10. **La hora de acostarse del widget, Energía y la línea de entrenar no es la del aviso** sin periodo (confirmado):
    22:45 contra 23:45 despertando a las 9 (`src/widgets/index.ts:232`, `src/secciones/sueno/datosDeEnergia.ts:110`,
    `src/secciones/comida/entreno.ts:54`). Arreglo: `suenoDelDia` en los tres.
11. **Las porciones con fracción se multiplican mal** (verificado y confirmado). «1/2 litro» por dos dice «2 1/2
    litros», y «2/3 cup» igual: 12 porciones en español y 67 en inglés, más lo que llega de etiquetas de EE. UU. y
    Open Food Facts (`src/comida/porciones.ts:202`).
12. **Decir lo que comí junta dos alimentos con «y media»** (confirmado). «Dos huevos y media palta» queda como
    «huevo palta» × 2,5; «kilo y medio de asado», sin cantidad (`src/comida/frase.ts:124`, `:149`;
    `recetaDeTexto.ts:279`). No cambia nada de cómo se ve: solo cómo se entiende.
13. **Inicio y Todo lo de hoy ignoran el ritmo elegido en Progreso** (confirmado, lo encontraron dos revisores). Con
    un plazo elegido, Inicio dice «En camino» y Progreso «Más lento»; Todo lo de hoy muestra el ritmo del cuestionario
    (`src/secciones/persona.ts:139`, `TodoLoDeHoy.tsx:75`).
14. **Inicio dice que el control está listo cuando no** (confirmado): con dos pesadas a menos de seis días, el control
    no puede ajustar y Inicio dice «Ya tiene lo que necesita» (`src/secciones/inicio/Control.tsx:24`).
15. **Una meta de 0 g en un macro** (confirmado, dos revisores): las barras y los anillos dan NaN o se llenan mal
    (`Inicio.tsx:314`, `:348`, `Comida.tsx:413`).

## Tanda B: la sincronización (arreglada el 23/11, con tu sí)

**Estado:** del 16 al 24 arreglados, cada uno con su test que fallaba antes (2027 tests en total), y también el aviso
doble que encontró la tanda A (un hábito marcado antes de su hora): en una simulación de 20.000 días al azar, de 1.256
con algún aviso doble a ninguno. La migración `0018_borrados.sql` (la marca de «Borrar mis datos») está probada en la
base local y **aplicada en la real el 23/11, con tu sí** (comprobado solo leyendo: la tabla con RLS, que la app la
lee y no la escribe, y que «Borrar mis datos» deja la marca y «Borrar la cuenta» la quita). Cómo quedó:
- **16:** con sesión, la entrada espera hasta 8 s a que baje lo de la cuenta; si llega su perfil, quedan el suyo, sus
  metas y sus hábitos. Si no llega, el perfil del cuestionario se guarda con la hora más vieja: cuando llegue el de la
  cuenta, gana ese. Esos segundos no muestran nada nuevo.
- **17:** cada teléfono lee la marca antes de subir nada; si es posterior a la que había cuando conoció la cuenta,
  olvida lo suyo y vuelve a bajar de cero. El que borró no olvida dos veces. Las fotos de las comidas de ese teléfono no
  se borran.
- **18:** el peso de Salud lleva la hora en que te pesaste, y la noche estimada no pisa la cara ni lo confirmado.
- **19:** al cambiar algo, su hora es la de ahora o la anterior más un milisegundo, la mayor.
- **20, 21, 24a:** salir o borrar reintenta si falla la base; una vuelta colgada no sube después de salir; lo bajado se
  da por bajado solo si se guardó.
- **22:** los nombres se recortan a lo que acepta la base (200 y 120 letras) y la noche se edita hasta 18 h.
- **23:** solo «Cerrar sesión» y «Borrar la cuenta» son salir; una sesión que se corta sola no borra nada, y cerrar
  sesión con cambios sin subir avisa. Queda sin resolver cómo volver a entrar desde Perfil en ese caso (es visual: va a
  la galería).
- **24b:** con la misma hora gana lo que baja, como en el servidor.
- **24c:** con dos lecturas de la cuenta a la vez, el regalo ya está al terminar la primera.
- Nuevo, para la tanda C: las comidas tienen el mismo aviso doble que los hábitos. Una cena anotada antes de su aviso
  «sin anotar» vuelve a atrasar a otros cuando llega su hora (287 de 20.000 días con hábitos de después de cenar). Se
  arregla igual, con la hora en que se anotó.

16. **Si la primera bajada se atrasa, el cuestionario pisa el perfil y la meta de la cuenta** (confirmado). Teléfono
    nuevo, la red tarda, contestas el cuestionario y después llega la cuenta: el perfil nuevo gana por más nuevo y
    sube sin estilo, peso meta ni día del control; el gasto medido se pierde y los hábitos de ejemplo se suman
    (`src/secciones/entrada/Entrada.tsx:235`, `src/almacen/almacen.ts:665`). Arreglo: con sesión, esperar la primera
    bajada antes de guardar el cuestionario.
17. **«Borrar mis datos» no llega a los otros teléfonos** (leído). El otro teléfono no se entera y, con el próximo
    cambio, vuelve a subir lo borrado. Arreglo: una marca de «borrado» en la cuenta que cada teléfono lee al bajar.
    **Lleva una migración: se aplica con tu sí.**
18. **Lo automático le gana a lo que hiciste a mano en el otro teléfono** (confirmado): el peso de Salud se estampa
    con la hora de ahora y le gana al que anotaste a mano; la noche re-estimada pierde la cara que diste
    (`almacen.ts:1250`, `nocheSinReloj.ts:93`). Arreglo: la hora de la muestra de Salud.
19. **Con un reloj adelantado, borrar no le gana a la versión de ese teléfono** (confirmado). Arreglo: al cambiar
    algo, su hora es la de ahora o la anterior más un milisegundo, la mayor.
20. **Si falla la base al salir o borrar, Moss queda sin datos hasta cerrarla** (confirmado; una línea en
    `almacen.ts:1064`).
21. **Una vuelta colgada sube después de salir** (confirmado): puede caerle a la cuenta que entra después, o después
    de «Borrar mis datos» (`src/almacen/sincronizar.ts:66`, `:107`).
22. **Lo que la base rechaza se da por subido** (leído): nombres de Open Food Facts de más de 200 letras, o una noche
    editada a más de 18 h, quedan solo en ese teléfono (`src/almacen/remoto.ts:35`).
23. **Una sesión que se corta sola se toma como «Cerrar sesión»** (leído): sale la pantalla de pago y, si después
    tocas «Cerrar sesión», se borra lo que no se subió (`src/almacen/index.ts:138`, `cuenta.ts:272`).
24. Menores: si falla guardar lo bajado, no se vuelve a bajar (`almacen.ts:484`); los empates de hora se resuelven
    distinto en el servidor y en el teléfono (`0001_esquema.sql:23`, `mezclar.ts:29`); dos lecturas a la vez de la
    cuenta pueden mostrar un instante la pantalla de pago (`premium.ts:149`).

## Tanda C: chicos

25. Con el sistema imperial: la tarjeta «Esto dice Salud» del cuestionario y la altura de Todo lo de hoy en cm y kg
    (`Preguntas.tsx:339`, `TodoLoDeHoy.tsx:66`); los pesos de Ascent siempre en kg (`Vinculada.tsx`, varias líneas;
    puede ser decisión tuya).
26. Una semana entre dos meses dice «26 – 1 nov» (`Comida.tsx:509`).
27. Cambiar los gramos de la porción de un alimento tuyo sin nombre deja «30 g = 40 g» (`hoja.ts:131`).
28. Cerrar Todo lo de hoy encoge la hoja de golpe (`TodoLoDeHoy.tsx:34`).
29. Volver a tocar el mismo objetivo en el cuestionario borra el ritmo elegido (`respuestas.ts:187`).
30. Los CSV exportados quedan en el teléfono al borrar la cuenta (`cuenta.ts:55`).
31. «Cuatro empanadas, dos de carne y dos de jamón» anota 8 (`frase.ts:480`).
32. Una etiqueta con porción de 0 g da infinito (no llega a guardarse; `etiqueta.ts:178`).
33. El widget Anotar alinea las medias horas en UTC (en Nepal, 15 min tarde; `src/widgets/anotar.ts:37`).
34. `alAbrir` de Ascent queda viejo: vibra de más al tocar la entrada (`Secciones.tsx:230`).

## Para decidir (no son bugs)

- **La siesta:** «Sugerencias para hoy» dice «una siesta de 30 minutos»; el estudio de la noche
  (`spec/estudio/priorizar-cada-noche.md`) y otro texto de Moss dicen de 10 a 20. Propuesta: 20 en todos lados (es
  compartido con Ascent).
- **Las luces:** el aviso suena 90 minutos antes de acostarte y el consenso de Brown 2022 dice 3 h (D2, abierta).
- **El aviso de las gafas** dice que «pueden ayudar» sin decir que la evidencia es poca, y el de bajar el ritmo
  habla de «pantallas brillantes» cuando lo que pesa es lo que te acelera.

## Lo que se revisó y está bien

Las cuentas de las metas, el control semanal, el ritmo y el plan por etapas; el plan de comidas; la grasa con cinta;
el corte de las 4 y el cambio de hora; el lector de etiquetas (Mercosur, EE. UU. y la UE, con kJ, sal y dos columnas);
los números con coma; las migraciones de SQLite y las piezas de cada tabla que sincroniza; el margen de 60 s y la
paginación; la conversión desde las 18 en todo Sueño, Inicio, Perfil, el widget y los avisos; el último día del
regalo y su aviso; el reembolso y la compra pendiente; las claves de las listas; y que no quede texto en español
armado en el código fuera de `src/textos`.
