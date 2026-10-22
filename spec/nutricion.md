# La comida: cómo se hace

Desde el 21/10/2026 la comida es el centro de Moss: trackear macros como
MacroFactor, sin IA de fotos, global desde el inicio y gratis. Los hábitos y el
cielo siguen, pero acompañan.

Lo que tiene que hacer está en [`especificacion.md`](especificacion.md), «La
comida». Acá está cómo:
- la base de datos y los nombres;
- la búsqueda;
- cada flujo de registro con sus toques;
- los escáneres;
- las metas, la pantalla de comida, Salud;
- lo que mira Apple y los riesgos.

Este documento reemplaza al anterior sobre nutrición.

## La base de datos

### La combinación: USDA y Open Food Facts, más una base propia

Tu combinación es la correcta, con una capa propia arriba que es la que hace que
la gente encuentre lo que come:

| Capa | Qué tiene | Dónde vive | Idiomas |
|---|---|---|---|
| **Genéricos curados** | ~1.000 alimentos comunes del mundo, cada uno con nombre neutro, nombres de cada región y su porción típica | dentro de la app (`assets/alimentos.db`) | español e inglés |
| **USDA FoodData Central** | FNDDS (5.280 alimentos tal como se comen) y SR Legacy (6.270 ingredientes), con valores y porciones | dentro de la app, en la misma base | inglés |
| **Uruguay** | ~500 productos y comidas uruguayas comunes | en Supabase; el teléfono lo baja y lo guarda | español e inglés |
| **Open Food Facts** | envasados, por código de barras | se consulta al escanear y queda guardado en el teléfono | el del producto |
| **Propios** | lo creado con el escáner de etiqueta o a mano, las recetas y las comidas guardadas | del usuario, sincronizado | el del usuario |

**Por qué esta combinación:**
- **USDA:**
  - es de dominio público;
  - trae los valores por 100 g y las porciones caseras;
  - va entera dentro de la app.
- **Open Food Facts:**
  - es la única base abierta de códigos de barras con cobertura mundial (licencia ODbL);
  - en Uruguay tiene unos 2.000 productos, que es poco;
  - el escáner de etiquetas y la capa uruguaya cubren lo que falta.
- **Lo que descarté:**
  - **FatSecret, Nutritionix y Edamam:** son pagas o no dejan guardar los datos, y exigen un servidor.
  - **Las tablas nacionales:** no tienen licencia clara.
  - **Copiar de los supermercados:** lo prohíben sus términos.
- **Gratis de verdad:** casi todo corre en el teléfono. Solo salen a internet la consulta a Open Food Facts y la descarga del catálogo uruguayo. Cada usuario nuevo no cuesta nada.

### Lo que ya está (21/10/2026)

- **`npm run alimentos`** arma `assets/alimentos.db` con el SQLite de Node, que es la misma versión que trae `expo-sqlite` (3.53, con FTS5):
  - baja USDA la primera vez;
  - deja afuera la comida de bebé, las fórmulas, las cadenas de comida rápida y los productos de marca;
  - suma los genéricos curados.

  Resultado: 11.551 alimentos y 5,9 MB.
- **`alimentos/genericos.txt`** tiene 557 genéricos curados:
  - en 23 categorías;
  - con 878 nombres regionales en 20 países y 1.314 alias en total;
  - con porciones en español.

  Es una línea por alimento, legible y revisable:

  ```
  Aguacate | Avocado | sr:Avocados, raw, all commercial varieties | ½ unidad / ½ avocado=100 · 1 unidad / 1 avocado=201 | palta* (AR UY CL PE BO PY)
  ```

- **`npm run alimentos:verificar`** revisa:
  - que los valores sean posibles;
  - las porciones en español;
  - que ningún nombre principal sea ambiguo en su región;
  - los índices y el tamaño.

  También avisa de lo que no cierra con 4/4/9.
- **El buscador** (`src/comida/buscar.ts`) tiene 12 tests contra la base de verdad.

### Los nombres en español y en inglés

- **Los curados:**
  - Tienen nombre neutro en español y nombre en inglés.
  - Sus nombres regionales llevan el país. El marcado con asterisco es el que se muestra ahí: «palta» en Uruguay, «aguacate» en México.
  - Así se resuelven los falsos amigos:
    - **plátano:** es la banana en España y en México, y el de cocinar en Colombia;
    - **manteca:** es la mantequilla en el Río de la Plata y la de cerdo en España;
    - **panqueque:** es el crepe en Uruguay;
    - **pan dulce:** es el panettone en Uruguay;
    - **torta:** es un sándwich en México;
    - **nuez:** es la pecana en México;
    - **limón:** es la lima en México.
- **USDA sin curar:**
  - Está solo en inglés.
  - En español se encuentra igual, pero sale después de todo lo que coincide en español.
  - Cuanto más crece la lista curada, menos se llega a esto.
- **Open Food Facts:** el nombre en el idioma de la app (`product_name_es`, `product_name_en`) y, si no está, el que tenga.
- **Uruguay y propios:** en español, y las comidas también en inglés.
- **Wikidata:** la idea era sembrar los alias desde ahí, pero sus alias no dicen de qué país son y traen ruido. Los nombres regionales se escribieron a mano, con su país. Wikidata sirve para revisarlos.

### Cómo se llega a 1.000 más 500 antes de lanzar

- **Genéricos, de 557 a ~1.000:**
  - las formas del mismo alimento: crudo, cocido, frito;
  - platos del mundo que todavía faltan: India, Asia, Medio Oriente;
  - lo que la gente busca y no encuentra: se anota sin datos personales.

  Cada línea la revisan el armado (que la descripción de USDA exista) y el verificador.
- **Comidas uruguayas (~200):** recetas con ingredientes de la lista curada, en gramos y con el rendimiento al cocinar. La base calcula sus valores por 100 g. Por ejemplo:
  - milanesa a la napolitana, chivito al plato, pascualina y fainá;
  - torta frita, capeletis a la caruso, buseca y ensalada rusa;
  - postre chajá y Martín Fierro.
- **Productos uruguayos (~300):**
  - Los que están en Open Food Facts se toman de ahí, con su atribución.
  - El resto se carga fotografiando etiquetas en un supermercado con el escáner de etiquetas de Moss. Así, la carga sirve además como prueba del escáner.
- **El catálogo uruguayo** va en una tabla de Supabase (`moss.catalogo`):
  - el usuario la lee y no la puede tocar;
  - el teléfono la guarda;
  - se actualiza sin sacar una versión nueva de la app.

  La decisión está en `decisiones.md`, D11.

## La búsqueda (hecha)

- **Dos índices FTS5 en el teléfono:**
  - **palabras:** con prefijos de 2 y 3 letras, para lo que se está escribiendo («pech» → pechuga);
  - **trigramas:** para los errores de tipeo («frutila» → frutillas, «polo frito» → pollo frito). Solo entran si lo que empieza igual es poco, y solo en el idioma de la app.
- **El orden:**
  1. el idioma de la app;
  2. qué tan parecido es a lo escrito: igual, la palabra entera, el principio, o con errores. Con errores, lo que se parece al principio del nombre va antes que una palabra del medio («frutila» encuentra antes «Frutillas» que «yogurt de frutilla»);
  3. lo curado;
  4. el nombre de la región;
  5. bm25.
- **Lo más usado primero:** quien llama pasa un premio por alimento, que sale del historial. Va con el logaritmo de las veces y lo reciente (`premios` en `src/dominio/registros.ts`).
- **Lo propio arriba:** lo creado desde la etiqueta o a mano sube con un premio propio: si lo buscás, es porque lo cargaste. En la galería, desde el 22/10/2026.
- **Medido en la base de verdad:** de 1 a 17 ms por búsqueda en una PC; en el teléfono hay que medirlo.

## Registrar: los flujos y sus toques

La gente registra 4 a 6 veces por día: cada toque cuenta. Las reglas:

- **Un solo botón para registrar**, siempre a mano: el «+» de Inicio, abajo a la derecha, donde Moss abre (D14).
- **La hoja de registro abre lista para escribir:**
  - con el teclado arriba;
  - con la comida elegida por la hora, que se cambia con un toque (`src/dominio/comidas.ts`):
    - de 4 a 10:30, desayuno;
    - de 12 a 15:30, almuerzo;
    - de 15:30 a 19:30, merienda;
    - de 19:30 a medianoche, cena;
    - entre medio y de madrugada, snack;
  - debajo, lo que solés comer a esa hora, tus recientes y tus favoritos.
- **Registrar es armar la comida y revisarla antes de agregarla** (lo pediste el 21/10/2026):
  - el «+» de cada fila abre la ventana del alimento: sus porciones, la cantidad en medios o los gramos, y cuánto queda en el día; viene con la última porción que usaste o, la primera vez, con la típica;
  - «Sumar» lo pone en la comida que se arma, que se ve abajo con su total; la hoja no se cierra y se suman varios seguidos, con un aviso para deshacer;
  - «Listo» abre la revisión: se cambia una porción, se quita algo o se guarda como comida;
  - «Agregar» registra todo junto. Antes no se registra nada, y si se cierra la hoja, lo juntado queda guardado.
- **Todo se corrige después** tocando el registro en la línea del día, que abre la misma ventana.
- **Las cantidades se escriben como se dicen:** «2 rebanadas», «1½ tazas», «½ unidad», «2 medium» (`src/comida/porciones.ts`).

Toques desde Inicio con Moss abierto, sin contar lo que se escribe. Revisar
antes de agregar suma tres toques a cada registro («sumar», «listo» y
«agregar»): lo de siempre pasó de 2 a 5. Con las pestañas (D14), Moss abre en
Inicio y los toques no cambian.

| Flujo | Toques |
|---|---|
| Algo de siempre (sugerencia de la hora, reciente o favorito) | **5**: registrar, «+», sumar, listo y agregar |
| Buscar y agregar con su porción | **5** y escribir |
| Buscar y elegir otra cantidad | **6** y escribir: registrar, «+», la porción, sumar, listo y agregar |
| Varios alimentos de una vez | **3 + 2 por alimento** y escribir |
| Armar un plato y guardarlo para la próxima | lo anterior **+ 1** y un nombre |
| Una comida guardada o una receta | **5**: registrar, guardadas, «+», listo y agregar |
| Copiar una comida de ayer | **2**: «copiar de ayer» en el hueco de la comida (abre la revisión) y agregar |
| Copiar un día entero | **3**: copiar día, elegir el día y confirmar |
| Código de barras ya conocido | **5**: registrar, escáner, sumar, listo y agregar (lee solo, sin disparar) |
| Código nuevo con etiqueta | **8** y el nombre, una sola vez; la próxima son 5 |
| Carga rápida de calorías y macros | **5** y los números |
| Dictado | **6**: registrar, el micrófono del teclado, «+», sumar, listo y agregar |
| Planificar un día futuro | **1 o 2** para ir al día, y lo mismo que hoy; al llegar el día, **1** para confirmar todo |
| Compartir una receta | **2 o 3**: compartir y elegir a quién |
| Agua | **1**: el vaso suma 250 ml (o llega sola desde Salud) |
| Peso a mano | **2** y el número (o llega solo desde Salud) |

- **Lo que se repite en todos los flujos:**
  - la última porción de cada alimento;
  - lo que solés comer a cada hora: por frecuencia y por lo reciente, en la misma franja horaria;
  - copiar.
- **La foto de la comida** es opcional y no se analiza: un toque en la comida ya registrada. Dónde se guarda es D10.
- **El día:** las comidas con nombre van sobre una línea de horas, cada una con lo que tiene y sus totales. Lo planificado se ve atenuado hasta confirmarlo.
- **Lo visual va primero a la galería.** Desde el 21/10/2026 están la línea del día, la hoja de registro, la ventana del alimento y la revisión, con la base y el buscador de verdad y los toques contados; falta aprobarlas. La revisión de la etiqueta llega con la etapa 6.

## Código de barras (atajo 1)

- **`expo-camera`** (`CameraView`) lee `ean13`, `ean8`, `upc_a` y `upc_e`, en el teléfono y gratis. Lee solo, sin disparar.
- **El dato sale primero de lo guardado** (lo ya escaneado y los propios). Si no está, se consulta Open Food Facts:
  - con la versión de la API fija y un `User-Agent` `Moss/versión (correo)`;
  - validando kcal contra 4/4/9 y por porción contra por 100 g.
- **iOS entrega el UPC-A como EAN-13** con un 0 adelante; se normaliza.
- **Si no está en ningún lado**, se ofrece el escáner de etiqueta. El producto nuevo queda guardado con su código: la próxima vez se encuentra solo.
- **Ya está el cliente** (`src/comida/off.ts`, 22/10/2026), con tests sin red. El correo del `User-Agent` falta decidirlo.
- **Aportar a Open Food Facts** lo que se crea es D13.

## Escáner de etiqueta (atajo 2): ¿alcanza el iPhone? Sí

**Lo que encontré:**

- **iOS 26 lee tablas.** [`RecognizeDocumentsRequest`](https://developer.apple.com/documentation/vision/recognize-tables-within-a-document), del framework Vision, se presentó en la [WWDC25](https://developer.apple.com/videos/play/wwdc2025/272/):
  - devuelve el documento con sus tablas, y cada tabla con sus filas y celdas ya agrupadas (`document.tables`, `table.rows`, `cell.content.text.transcript`);
  - una tabla nutricional es exactamente eso;
  - corre en el teléfono, sin costo y sin conexión.
- **Antes de iOS 26**, `VNRecognizeTextRequest` lee líneas de texto en español, inglés y portugués, y las filas se arman por altura. Moss va desde iOS 16.4, que es lo mínimo de los módulos de Expo 58.
- **No hay mediciones públicas** de Vision sobre etiquetas nutricionales:
  - Lo más cercano es un [estudio de 2025 sobre envases](https://arxiv.org/html/2510.03570v1). No probó Vision, y señala como lo difícil el brillo, las superficies curvas, las letras densas y los idiomas mezclados.
  - Otro [trabajo de 2022](https://www.scitepress.org/Papers/2022/108276/108276.pdf) señala que el OCR suele estar entrenado con texto corrido, no con tablas llenas de números.
  - Hay que medirlo con etiquetas uruguayas de verdad.
- **Los módulos que ya existen no alcanzan:**
  - [`expo-text-extractor`](https://cdn.jsdelivr.net/npm/@zhanziyang/expo-text-extractor@1.0.2/README.md) usa Vision en iOS, pero devuelve líneas sueltas, no tablas.
  - Los de ML Kit de Google suman megas y no leen mejor en iPhone.

**Lo que recomiendo:**

1. **Un módulo propio de Expo, en Swift**, de unas 150 líneas. `leerEtiqueta(foto)` devuelve las filas:
   - en iOS 26, con `RecognizeDocumentsRequest`;
   - antes, con las líneas de `VNRecognizeTextRequest` agrupadas por altura.

   Va en la build propia, que ya hace falta por Salud.
2. **Un lector de la tabla en TypeScript**, puro y con tests:
   - **Reconoce las palabras** de las etiquetas en español, inglés y portugués:
     - valor energético o calorías (en kcal, no kJ);
     - carbohidratos o hidratos;
     - proteínas;
     - grasas totales o lípidos;
     - porción.
   - **Detecta la columna:** si es por porción (el formato Mercosur de Uruguay, con %VD) o por 100 g, y lo pasa a 100 g con el peso de la porción.
   - **Ignora los octógonos** del frente.

   Hecho el 22/10/2026 en `src/comida/etiqueta.ts`, con tests: lee las etiquetas del Mercosur (por porción, con %VD), de Estados Unidos y europeas (por 100 g, con la sal), en español, inglés y portugués; lee las dos columnas en cualquier orden, pasa la sal a sodio y los kJ a kcal, corrige la «O» por cero y avisa si algo no cierra.
3. **Controles:**
   - 4/4/9 marca el número que probablemente se leyó mal (un 8 que fue 3);
   - la porción tiene que estar en g o ml.
4. **Siempre una pantalla de revisión** con todo completo: se confirma con un toque o se corrige. El nombre lo trae Open Food Facts si el código se conocía; si no, se escribe.
5. **Medirlo antes de dar el escáner por bueno:**
   - con 50 etiquetas uruguayas fotografiadas como las saca la gente: con brillo, curvas y de costado;
   - contando aciertos por campo (porción, kcal y cada macro), no por letra.

   Son las mismas fotos de la carga del catálogo uruguayo.

## Dictado por voz (atajo 11)

- **El dictado del teclado del iPhone** funciona en el buscador sin programar nada: es el micrófono del teclado.
- **Después se puede:**
  - sumar un botón propio con `SFSpeechRecognizer`;
  - entender cantidades dictadas («dos huevos y una banana»).

## Las metas

Es el método de MacroFactor, con fórmulas públicas. El detalle exacto de
MacroFactor no está publicado. Está programado en `src/dominio/metas.ts` y
`src/dominio/control.ts`, con sus tests.

1. **Meta inicial**
   - **Gasto:** Mifflin-St Jeor por el nivel de actividad. Una revisión la
     encontró dentro del ±10 % de lo medido la mayoría de las veces.
   - **Niveles:** poco 1,35, algo 1,5, bastante 1,65 y mucho 1,85.
   - **Ritmo:** bajar es 0,25, 0,5 o 0,75 % del peso por semana; subir es 0,1,
     0,25 o 0,4 %; se pasa a kcal con 7.700 kcal por kilo.
   - **Menores de 18:** bajar «rápido» no está; se usa el recomendado.
   - **Pisos:** 1.200 kcal para mujeres y 1.400 para hombres.
   - **Redondeo:** el gasto y las kcal, a la decena.
   - Es la cuenta de la galería (`galeria/src/entrada.js`, `metas`). El ejemplo
     de la galería da 2.770 kcal, con 119 g de proteína, 387 de carbohidratos y
     83 de grasas.
2. **Macros**
   - **Proteína primero, por kilo:** 2,0 g al bajar, 1,6 al mantener y 1,8 al
     subir, siempre dentro de 1,2–2,2. Nunca pasa del 40 % de las kcal: con
     mucho peso y pocas calorías se comería el resto.
   - **Grasas:** al menos el 27 % de las kcal y nunca menos de 0,6 g por kilo
     (el rango recomendado es 20–35 %).
   - **Carbohidratos:** el resto.
3. **Tendencia del peso:** media móvil exponencial (α = 0,1, unas tres semanas).
   Los días sin peso se rellenan en línea recta entre los vecinos.
4. **Control semanal**
   - **Automático:** corre solo en el teléfono el día de la semana del control;
     no hay que tocar nada. Ese día es el de la semana en que se fijó la primera
     meta, como en MacroFactor; si ese día no se abre Moss, corre la próxima vez.
     Corre en el almacén desde el 22/10/2026 (`revisarControl`).
   - **Con las metas a mano:** mide el gasto igual, pero deja los macros.
   - **Qué mira:** días enteros, hasta ayer. Las últimas 3 semanas, o desde la
     primera pesada si hay menos; con menos de 7 días no mide.
   - **Gasto real:** comida promedio − (cambio de la tendencia × 7.700 kcal/kg)
     ÷ días.
   - **Suaviza:** toma un cuarto de la diferencia entre el gasto medido y el
     anterior cada semana. Una caída de 500 kcal se nota de a poco, en unas tres
     o cuatro semanas.
   - **Meta nueva:** gasto ± el ritmo, con el peso de la tendencia.
   - **Neutral al cumplimiento:** nunca «compensa» lo que comiste de más o de
     menos.
   - **Pide datos mínimos:** al menos 4 días con comida registrada y un peso en
     la última semana. Si no los hay, la meta queda como estaba y la app dice
     por qué (`faltanDatos`).
   - **Lo que usó** (días con comida, pesadas, promedio, cambio de la
     tendencia, gasto medido) queda a mano para mostrar «cómo se calcula».
5. **Peso:** uno por día, desde Salud, desde Ascent (con el vínculo) o a mano.
   Siempre se usa la tendencia, nunca el número de un día.
6. **Ascent** (ver [`ascent.md`](ascent.md)):
   - El peso de Ascent entra en la tendencia.
   - Los días de entrenamiento redistribuyen la meta de la semana sin cambiar el
     total.
   - La proteína sube después de una sesión grande.

## La pantalla de comida

Es la pestaña Inicio (D14): Moss abre acá, con el cielo quieto y oscurecido atrás.

**Qué tiene:**
- las calorías que quedan del día, grande y claro;
- las barras de proteína, carbohidratos y grasas contra la meta;
- la tendencia del peso, suavizada;
- el gasto que estima el algoritmo;
- el agua;
- el resumen del último control semanal.

**Por día, por semana y por mes, como MacroFactor** (pedido el 21/10/2026).

Lo de MacroFactor, confirmado en su ayuda y en su web:
- El registro tiene arriba la tira de la semana, de lunes a domingo, y cada día se llena contra la meta de calorías ([ayuda](https://help.macrofactorapp.com/en/articles/100-view-past-days-of-eating), [el registro](https://macrofactor.com/timeline-based-food-logger/)).
- Debajo van cuatro barras finas («2984 / 3033»).
- El inicio tiene la nutrición del día, la de la semana (siete días con cuatro barras cada uno) y gráficos de 1 semana a 1 año ([ayuda](https://help.macrofactorapp.com/en/articles/22-get-to-know-your-dashboard), [inicio](https://macrofactor.com/dashboard-customization/)).
- Se puede planificar comida en días futuros, y el algoritmo no la cuenta hasta que el día pasa ([ayuda](https://help.macrofactorapp.com/en/articles/51-log-food-to-future-days)).
- Los colores son solo para los datos, y nunca hay rojo de «te pasaste».

En Moss:
- **Día:**
  - arriba, la tira de la semana con una luna chica por día, que se llena con lo comido y se toca para ver ese día; los días que vienen van en blanco y lo planificado, tenue;
  - después, lo que queda grande, las barras de los macros, el agua y la línea del día.
- **Semana:**
  - el promedio por día de los días que ya terminaron, con sus macros;
  - los siete días, con una barra de calorías y una por macro contra la meta;
  - la tendencia del peso, el gasto estimado y el último control.
- **Mes:** el calendario con una luna por día y el promedio del mes.

**Cómo se ve:**
- La luna se llena con lo comido. Es una luna de verdad, con sus mares, grano y la sombra con el borde suave.
- Los tres arcos de los macros (proteína en dorado, carbohidratos en verde y grasas en azul estrella) quedan como opción: la propuesta es la luna sola, porque los macros ya están en las barras.
- Los números y los títulos van en una sans sobria (Outfit), no en la serif del cielo.
- Está en la galería desde el 21/10/2026, esperando aprobación, y desde el 22/10 es la pestaña Inicio.

**Widgets en la pantalla de bloqueo** con calorías y macros:
- van con `expo-widgets`, en los tamaños de la pantalla de bloqueo (circular y rectangular);
- antes hay que probarlos en una build `dev` ([`widgets.md`](widgets.md)).

## Hábitos de comida

Son hábitos automáticos, como los de Salud, que se encienden solos en el cielo:

- «Llegar a la meta de proteína».
- «Registrar todas las comidas»: se cumple con desayuno, almuerzo y cena, o con
  las comidas que elija el usuario.
- «Quedar dentro de la meta de calorías ± 10 %».

Ya andan en el almacén (22/10/2026, `cumpleLaComida` en `src/dominio/registros.ts`):
- se miran cada vez que cambia lo registrado o la meta, sin contar lo
  planificado;
- la estrella se enciende al cumplirse y se apaga si se deja de cumplir (por
  ejemplo, al pasarse de calorías);
- la marca queda con el origen «comida», como las de Salud.

## Salud

- **Peso:** `HKQuantityTypeIdentifierBodyMass`, con
  `@kingstinct/react-native-healthkit`, la misma que usa Ascent.
  - Leer un tipo que no se pidió hace que la app se cierre, así que se piden
    todos juntos en la entrada.
  - La app no puede distinguir «no diste permiso» de «no hay datos».
- **Agua:** `HKQuantityTypeIdentifierDietaryWater`: se lee de Salud y se suma a
  mano en Moss.
- **Escribir la comida en Salud** (`Food` con kcal y macros): después de la v1.
  Pide un permiso más, puede duplicar lo de otras apps y obliga a reflejar los
  borrados.

## Global y gratis

- **Español e inglés** desde el día uno, con los nombres regionales de cada país.
- **Unidades:** métricas o imperiales según el teléfono, y se cambian en Ajustes. Afecta al peso, la altura, las porciones en onzas y el agua.
- **Sin muro de pago.** Nada de lo que hace Moss tiene un costo por usuario:
  - la base va dentro de la app;
  - el reconocimiento de texto es el del iPhone;
  - Open Food Facts es gratis.

  Lo único que crece con los usuarios es Supabase.

## Lo que tienen las otras apps (22/10/2026)

Lo pediste el 21/10: «pensá en todo lo que tiene una app de registro de macros y
añadilo si creés que valga la pena». Se miraron MacroFactor, MyFitnessPal,
Cronometer, Lose It!, Carbon, Yazio, FatSecret y MyNetDiary, más Fitia (la que
más se usa en Latinoamérica), en sus páginas de ayuda, sus precios y sus fichas
de la tienda.

**Lo que ya es de todas y Moss ya tiene en el plan:**
- buscador, código de barras, carga rápida, favoritos, recientes, comidas
  guardadas, recetas, copiar comidas y días;
- porciones caseras, agua, peso con Salud, widgets.

**Lo que en las otras se paga y en Moss es gratis:**
- el código de barras (pago en MyFitnessPal y en Lose It!);
- la línea del día con la hora de cada comida (paga en MyFitnessPal y Cronometer);
- metas distintas por día de la semana (pagas en casi todas);
- el gasto que se ajusta solo (solo en las pagas: MacroFactor y Carbon);
- exportar los datos (pago en MyFitnessPal y Yazio).

**Lo que casi nadie tiene y Moss sí:**
- **Deshacer:** solo Carbon recupera lo borrado.
- **Andar sin conexión:** ninguna. MacroFactor muestra lo guardado, pero no
  registra ([ayuda](https://help.macrofactorapp.com/en/articles/28-does-macrofactor-have-an-offline-mode)).
- **Español con metas que se ajustan:** MacroFactor está en inglés y japonés, y
  Carbon y Cronometer solo en inglés.

**Lo que se suma a Moss:**

| Qué | Quién lo tiene | Etapa |
|---|---|---|
| **Fibra, azúcares, grasas saturadas y sodio** (y el alcohol, si lo tiene): en la ventana del alimento y en el detalle del día. La fibra tiene meta suave (14 g cada 1.000 kcal), sin rojo. USDA, Open Food Facts y las etiquetas uruguayas ya los traen | todas; MacroFactor y Cronometer, completos | 4 (la base) y 7 (la pantalla) |
| **Cómo se reparten los macros**, con la proteína siempre por kilo: equilibrada (la de ahora), baja en grasas, baja en carbohidratos y keto | MacroFactor ([ayuda](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode)), Carbon, Cronometer | 7 |
| **Metas a mano**: las kcal y los macros los pone el usuario. El control semanal sigue midiendo el gasto, pero no toca la meta | MacroFactor, todas | 7 |
| **Repartir la semana**: días más altos (el fin de semana, o los de entrenamiento con Ascent) y el resto más bajos, con el mismo total. La proteína no cambia; se mueven los carbohidratos | MacroFactor ([ayuda](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode)), Carbon; pago en las demás | 7 |
| **Exportar todo en CSV**, gratis, desde Ajustes | MacroFactor; pago en MyFitnessPal y Yazio | 10 |
| **Registrar por lo que falta**: en la ventana del alimento, «cuánto para 30 g de proteína» (o para las kcal que quedan) | MacroFactor | 5, primero en la galería |
| **El país de los alimentos aparte del idioma**: una uruguaya que usa Moss en inglés sigue viendo «palta» y los productos de acá | Fitia | 10 (Ajustes) |
| **Recordatorios suaves y opcionales**: si a tu hora de siempre no registraste, un aviso. Nunca de racha | MyFitnessPal, Yazio, MyNetDiary | 12 |

**Para después de la v1:**
- una Live Activity para registrar desde la isla (solo la tiene Yazio);
- Atajos y Siri: «registrá un vaso de agua», «anotá mi peso»;
- Apple Watch;
- importar una receta desde un enlace;
- escribir la comida en Salud;
- todos los micronutrientes (vitaminas y minerales) y qué alimento aporta cada uno;
- fotos de progreso y medidas del cuerpo;
- usar los pasos de Salud para que el gasto se ajuste antes (MacroFactor lo hace).

**Lo que no:**
- **IA de fotos:** decidido desde el principio.
- **Ayuno intermitente, planes de comida y lista del súper:** son otra app.
- **Coach de IA, comunidad y desafíos:** no son la idea de Moss.
- **Rachas:** Moss no tiene rachas; cuenta días acumulados.

## Lo que mira Apple

- **1.4.1:** cualquier número de salud tiene que mostrar de dónde sale. Va un
  «cómo se calcula» en la meta y en el control semanal, y un «consultá con un
  profesional».
- **5.1.2(vi) y 5.1.3:** nada de publicidad con datos de Salud, ni datos de Salud
  en iCloud.
- **2.5.1:** nombrar Salud en la descripción de la tienda.
- **5.1.1(v):** borrar la cuenta desde la app (ya está en el plan).
- **Edad:** contar calorías clasifica la app como 9+. No hay una regla de Apple
  sobre menores en apps de dieta, pero MacroFactor pide 18+ en sus términos.
  Por eso, bajar «rápido» queda para mayores de edad, y los pisos de calorías
  valen siempre.

## Datos (esquema `moss`)

Todo es local primero: el teléfono guarda al instante y Supabase sincroniza,
con las reglas de la etapa 3. `pesos` y `metas` están en
`supabase/moss/0001_esquema.sql`; `registros`, `recetas`, `propios`,
`favoritos` y `agua`, en `0002_comida.sql` (22/10/2026). Lo demás llega con su
etapa. Lo que se borra en el teléfono llega a la cuenta como una marca
(`borrado`), y gana si es lo más nuevo: así el borrado también llega a los otros
teléfonos. Un teléfono nuevo baja lo comido de los últimos cuatro meses; lo
anterior queda en la cuenta.

| Tabla | Qué guarda |
|---|---|
| `registros` | lo comido: día local, comida (desayuno, almuerzo…), momento, alimento y de dónde sale (la base, el catálogo, off, propio, receta o carga rápida), la porción elegida y cuántas veces o los gramos, y los valores ya calculados (los cuatro de siempre más fibra, azúcares, saturadas, sodio y alcohol), para que el historial no cambie si cambia la base; si está planificado. Borrar deja una marca, para que el borrado llegue a los otros teléfonos |
| `propios` | lo creado con la etiqueta o a mano: los valores por 100 g, sus porciones, la marca y el código de barras |
| `recetas` | recetas y comidas guardadas: sus alimentos como en los registros, las porciones que rinde y, en las recetas, lo que pesan terminadas |
| `favoritos` | los alimentos, recetas y comidas marcados; sacar uno es otro cambio |
| `productos_off` | lo escaneado de Open Food Facts, con la fecha (etapa 6) |
| `agua` | cada vaso sumado a mano, con su día (lo de Salud se lee, no se copia) |
| `pesos` | uno por día: fecha, kg y origen (salud, manual o ascent) |
| `metas` | desde cada fecha: kcal, macros, el gasto del que salieron y por qué |
| `catalogo` | el catálogo uruguayo, que solo se lee |

**Lo que no se guarda en Supabase:**
- **La última porción de cada alimento, lo que comés a cada hora, los recientes y el premio del buscador** se calculan con los registros (`src/dominio/registros.ts`).
- **La comida que se arma en la hoja** (la canasta) queda en el teléfono hasta agregarla.
- **Las fotos de la comida** quedan en el teléfono (D10).

## Riesgos

- **Open Food Facts:**
  - **Se cae seguido:** en la investigación devolvió 503 y páginas antibots. Todo anda sin conexión, salvo el escaneo de un código nuevo.
  - **El formato de nutrientes de su API 3.5** no está bien documentado.
- **El escáner de etiquetas** no tiene mediciones públicas: hay que medirlo con las 50 etiquetas antes de darlo por bueno.
- **Las etiquetas uruguayas suelen dar los valores por porción:** si la porción no se lee bien, todo el resto sale mal. La revisión la muestra primero y grande.
- **El catálogo uruguayo es trabajo de carga:** las 500 entradas son días de trabajo. Las comidas como recetas se pueden adelantar ya; los productos piden ir al supermercado.
