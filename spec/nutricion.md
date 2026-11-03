# La comida: cómo se hace

Desde el 21/10/2026 la comida es el centro de Moss: trackear macros como
MacroFactor, sin IA de fotos, global desde el inicio y de pago, con 7 días gratis (D40). Los hábitos y el
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
| **Productos y platos** | ~500 productos y comidas comunes de Uruguay, que en la app no se presentan como uruguayos | dentro de la app, en la misma base; Supabase corrige y suma (D11) | español e inglés |
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
- **Comidas uruguayas (~200):** recetas con ingredientes de la lista curada, en gramos y con el rendimiento al cocinar. La base calcula sus valores por 100 g y guarda los ingredientes (tablas `recetas` e `ingredientes`), para mostrar de dónde salen. La primera tanda, de 14, está desde el 22/10/2026 en `alimentos/genericos.txt` (`receta#`), para que la revises. Por ejemplo:
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

### Completa y confiable (22/10/2026, a la noche)

Lo pediste así: un catálogo completo y confiable, con micronutrientes, verificado
con una segunda fuente y con controles automáticos sobre toda la base.

- **Micronutrientes:** la base trae 23, de USDA, por 100 g:
  - vitaminas A (RAE), C, D, E, K, B1, B2, B3, B6, folato (DFE) y B12;
  - calcio, hierro, magnesio, fósforo, potasio, zinc y selenio;
  - grasas trans, monoinsaturadas y poliinsaturadas, colesterol y cafeína.

  Los platos los suman de sus ingredientes, sin las pérdidas de la cocción: en las
  vitaminas es un máximo. La lista, las unidades y las referencias del día están en
  `src/dominio/micronutrientes.ts`. Las referencias son las de las Academias
  Nacionales de Estados Unidos (RDA o AI), por sexo, edad, embarazo y lactancia; de
  la cafeína, un tope de 400 mg (200 en el embarazo y la lactancia). Son una guía:
  Moss no pide llegar a cada una.
- **Verificado:** cada curado se compara con una segunda tabla oficial
  (`spec/fuentes.md`, `npm run alimentos:comparar`, `alimentos/verificacion.txt`).
  - Coincide si nada se aleja más de un 10 %. Si se aleja, se revisa: o la
    diferencia es real (otra variedad, otro corte, más agua) y queda «revisado» con
    el motivo, o el par de USDA estaba mal y se corrige.
  - Un plato está verificado si todos sus ingredientes lo están, y un producto si su
    etiqueta cierra: las kcal con los macros (con 4/4/9 y 7, o con la fibra a 2).
  - La base guarda el día y con qué (`verificado`, `segunda`). La ventana del
    alimento muestra un sello, y al tocar la fuente, «¿De dónde sale esto?».
- **Los controles son tests** (`src/comida/controles.test.ts`), sobre toda la base:
  - nada negativo, los macros no pasan de 100 g ni las kcal de 902;
  - los azúcares y las grasas no pasan de su total, el sodio no pasa el de la sal y
    los micronutrientes no pasan lo posible (el mismo tope que el armado);
  - las kcal cierran con los macros: en cada curado con un margen de 35 % o 40 kcal
    (lo que no cierra tiene su porqué escrito: polioles, fibra, minerales); en lo
    escrito a mano, más ajustado; en USDA sin curar, casi siempre;
  - las porciones, las densidades, la parte que no se come y lo que rinde lo cocido
    son posibles (las papillas rinden hasta 10 veces lo crudo);
  - los platos valen lo que suman sus ingredientes;
  - lo verificado dice el día y con qué.
- **El armado limpia lo que no cierra:** USDA tiene unos pocos valores que
  contradicen a los macros (más azúcares que carbohidratos). No se guardan: es mejor
  no mostrar un dato que mostrarlo mal. En lo escrito a mano, eso es un error.
- **Open Food Facts:** lo escaneado pasa los mismos controles (`src/comida/off.ts`):
  si no cierra, queda sin verificar y se ofrece revisarlo con la etiqueta.
- **La base se mejora sola** (`supabase/moss/0006_alimentos.sql`):
  - lo que se busca y no encuentra nada se anota, con el idioma, la región y el día;
  - cada alimento tiene «Reportar un error»: qué está mal y una nota.

  Las dos cosas van sin el usuario, sin la hora y sin nada del teléfono. Esperan en
  el teléfono (`src/almacen/buzon.ts`) y salen con sesión por dos funciones de Moss;
  nadie las lee desde la app.

## Cómo se miden los alimentos (22/10/2026)

Lo pediste el 22/10/2026. Lo que se guarda es siempre lo que se come, en gramos
(y en ml, los líquidos): todo lo de abajo es cómo se escribe y cómo se calcula.
Las cuentas están en `src/dominio/cantidades.ts`, con sus tests. Nada de esto
suma toques si no se usa.

1. **Crudo y cocido.**
   - Todo lo que se cocina está dos veces, con el estado en el nombre: «Arroz
     blanco, crudo» y «Arroz blanco, cocido»; «Pechuga de pollo, cruda» y
     «Pechuga de pollo, a la plancha».
   - En la ventana del alimento, «Crudo · Cocido» pasa de una versión a la otra
     sin perder los gramos: si pesaste el arroz ya cocido y elegiste el crudo, es
     un toque.
   - Debajo dice cuánto rinde: «100 g crudo dan unos 260 g cocido». Sale de la
     proteína de las dos versiones en USDA, que no se pierde al cocinar (con las
     calorías, una carne grasa parecería no achicarse, porque pierde grasa); sin
     proteína, de las calorías. Lo frito no tiene rinde: el rebozado y el aceite suman.
2. **Parte comestible.**
   - Lo que tiene hueso, cáscara o carozo tiene «Con cáscara» (o «con hueso»,
     «con carozo») al lado de los gramos. Prendido, los gramos son lo que pesó
     entero, y Moss descuenta lo que no se come.
   - El porcentaje sale de USDA (SR28, el «refuse» de cada alimento: la banana
     tiene un 36 % de cáscara y la palta un 26 % de carozo y cáscara). El
     registro guarda lo que pesó entero, para mostrarlo igual al editarlo.
   - Las porciones ya son de lo que se come: «1 banana mediana» son 118 g sin
     cáscara.
3. **Aceite de cocción.**
   - Lo salteado o a la plancha pregunta «¿Llevó aceite?»: No · 1 cdta · 1 cda
     · 2 cdas. Viene con lo que contestaste la última vez para ese alimento; la
     primera vez no viene marcado y cuenta como sin aceite.
   - El aceite va dentro del mismo registro («150 g · con 1 cdta de aceite»):
     se edita o se borra junto con lo que acompaña.
   - Es aceite de girasol, el de cocinar más común: 1 cucharadita son 4,5 g y 1
     cucharada, 13,6 g (USDA).
   - Lo frito no pregunta: los valores de USDA ya cuentan el aceite que absorbe,
     y la ventana lo dice.
4. **Recetas por peso final.**
   - Se cargan los ingredientes y se pesa la olla cocida una vez («Peso final»).
     Cada plato se registra en gramos (`itemDeRecetaEnGramos`).
   - Sin el peso final, la receta se registra por porciones, como hasta ahora.
5. **Porciones reales.**
   - Las frutas y verduras tienen la unidad chica, mediana y grande con sus
     gramos (USDA las trae).
   - Los productos, lo que dice el envase: el paquete, la lata, la rebanada, el
     vaso, la unidad.
6. **Líquidos en ml.**
   - Lo que se toma se escribe en ml y se guarda en gramos con la densidad de
     cada uno: 250 ml de leche entera son 257 g.
   - La densidad sale de lo que pesa una taza en USDA (244 g la de leche, 236,6
     ml): la leche 1,03, los jugos 1,04, el aceite 0,92, la miel 1,42.
7. **Ajuste rápido:** ×½, ×1½ y ×2 al lado de la cantidad. Con una porción
   elegida cambian las veces; con gramos, los gramos.
8. **Métrico o imperial.**
   - De fábrica, el del país del teléfono: Estados Unidos, Liberia y Myanmar,
     imperial; el resto, métrico. Se cambia en Perfil.
   - En imperial se escribe y se ve en onzas y onzas líquidas; se guarda igual
     en gramos y ml.
9. **Pesado o a ojo.**
   - En la ventana, «Pesado · A ojo». De fábrica: lo escrito en gramos es
     pesado, y una porción casera (taza, cucharada, unidad mediana) es a ojo; lo
     que dice un envase (paquete, lata, botella) cuenta como pesado. Se cambia
     con un toque.
   - **En el control semanal** (lo pediste: «proponeme cómo usarlo»):
     - el gasto se mide igual: un error parejo, como calcular siempre un poco
       menos, se compensa solo, porque el control mide lo que pasa con lo que
       anotás;
     - lo que cambia es cuánto se mueve. Con todo a ojo, el gasto se mueve la
       mitad de rápido (un octavo de la diferencia por semana en lugar de un
       cuarto); con la mitad a ojo, tres cuartos de rápido;
     - el resumen del control lo dice: «El 60 % de lo registrado fue a ojo: el
       ajuste va más despacio».

     Está en `src/dominio/control.ts` (`FRENO_POR_LO_ESTIMADO`), con sus tests.

**En la base** (`alimentos/*.txt`), una sexta columna opcional lleva los
detalles, separados con « · »:

| Detalle | Qué es | Ejemplo |
|---|---|---|
| `crudo=` | en lo cocido, el nombre de su versión cruda | `crudo=Arroz blanco, crudo` |
| `desecho` | tiene parte que no se come: el porcentaje de USDA, o uno propio con qué es | `desecho` · `desecho=12 cáscara` |
| `ml` | se toma: se escribe en ml. La densidad sale de la taza de USDA | `ml` · `densidad=1.03` |
| `aceite` | salteado o a la plancha: pregunta por el aceite. `aceite=incluido`, frito | `aceite` |
| `marca=` y `ean=` | un producto: su marca y sus códigos de barras | `marca=Conaprole · ean=…` |
| lo secundario | en lo que no es de USDA: fibra, azúcares, saturadas y sodio por 100 g | `fibra=2.1 · sodio=380` |

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

### Las marcas y las cadenas (2/11/2026)

**Por qué no aparecían.** La base de la build 6 y de la OTA de production es del 23/10: no tiene cadenas y sus 429
productos no incluyen Kellogg's, Nesquik, Pepsi, Lay's ni Tita. Y aun con la base nueva, «mostaza» daba el condimento y
después, por el largo del nombre, una medialuna y un budín antes que las hamburguesas; «kelloggs», «lays» o «mcdonalds»
no encontraban nada, porque el índice parte las palabras en el apóstrofo.

**Qué hay ahora:**

- **Las cadenas** (`alimentos/cadenas.txt`): el menú fijo, sin los especiales del momento, de McDonald's, Burger King,
  Subway, Mostaza, La Pasiva, Starbucks, KFC, Domino's, Grido, Sbarro, Freddo, La Cigale, Cinnabon, Porto Vanila e Il Mondo
  della Pizza, con sus combos. Cada línea dice su fuente; lo que no es un dato oficial lleva «aproximado». Los combos son
  la suma de sus partes. Las que se miraron y no entraron están al final del archivo, con el motivo.
- **Lo del súper** (`alimentos/marcas.txt`): unos 2.110 productos de unas 480 marcas, de la exportación de Open Food
  Facts. Lo arma `node herramientas/marcas.mjs` con lo que baja `node herramientas/bajar-marcas.mjs`; no se edita a mano.
  Entra lo cargado con Uruguay o con un código de GS1 Uruguay (773, aunque Open Food Facts le ponga otro país: suma unos
  100 productos hechos acá, 3/11/2026); de Argentina, las marcas que se venden acá; y de otros países, solo las marcas globales
  que nadie cargó (Kellogg's, por ejemplo), con menos productos y marcadas «aproximado», porque la etiqueta es de allá.
  Se descarta lo que no cierra con 4/4/9, lo cargado por porción en vez de por 100 g, lo escrito en otro idioma y lo que no
  se anota (la yerba, el té). La porción de siempre es la de la etiqueta, sin pasar del envase, y lo mismo con la marca
  antes o después del nombre es un solo producto. Un producto conserva su número al rearmar.

**Cómo busca:** lo genérico primero («leche» es la leche). Si lo escrito nombra la marca (entera, sin signos, o desde la
tercera letra), enseguida van sus productos en el orden de la marca: en una cadena, primero lo principal, después los combos
y al final lo demás; en el súper, lo más escaneado. Con la marca nombrada se muestran hasta 200 resultados, para ver el menú
entero. Cada resultado muestra su marca si el nombre no la dice. La base pesa 11,7 MB (el tope ahora es 14): va entera en
la app y en la próxima actualización por aire.

### El stock de los súper (investigado el 2/11/2026)

Lo pediste: entrar a los sitios de los supermercados y sumar todo su stock. **Sin permiso no se puede:**

| Súper | Catálogo | EAN | Tabla nutricional | Qué dicen |
|---|---|---|---|---|
| Tienda Inglesa | Público, unos 7.800 de comida y bebida | Sí | En texto, por porción | El pie de cada página prohíbe recolectar, reproducir y comercializar su información |
| Disco, Devoto, Géant (GDU) | Público, unos 11.700 en un Disco; dejaron VTEX | Sí | Solo una foto chica | El sitio es para comprar; nada sobre reutilizar |
| Ta-Ta | Público (VTEX), unos 11.250 | Sí | En texto | Prohíbe entrar por otro medio que su interfaz y reproducir sus productos e imágenes |
| El Dorado | Público (VTEX), unos 5.400 | Sí | No | Nada sobre acceso automatizado ni reutilizar |
| Kinko, Macro Mercado, Frigo | Sin tienda en línea | — | — | — |

- **La muestra:** de 30 EAN de las góndolas, 16 están en Open Food Facts y 14 con la tabla completa (bebidas, 0 de 6).
  **El hueco es lo hecho en Uruguay:** de los EAN 773, solo 4 de 16 están completos; de los importados, 10 de 14. Al
  escanear, Moss ya encuentra en vivo los que Open Food Facts tiene; buscando por nombre o sin conexión, no.
- **Ningún registro público trae las tablas:** el decreto 272/018 solo obliga a los octógonos; el 37.455 de Montevideo
  obliga a mostrar el rótulo al vender en línea, pero no da permiso para reutilizarlo; los datos abiertos de la Intendencia
  traen nombre, marca y empresa, sin EAN ni tabla; GS1 Uruguay (el Catálogo Electrónico, Rondanet) es la fuente oficial
  por EAN, pero no es abierta.
- **Lo que se puede sin pedir nada:** completar en Open Food Facts los que tienen la foto de la tabla (la leche descremada
  Conaprole, 7730105001284, y Oreo 354 g, 7622201502966); en `bajar-marcas.mjs` y `marcas.mjs`, aceptar todo EAN 773 (hecho el 3/11/2026) con
  la tabla completa aunque Open Food Facts le ponga otro país (el yogur griego de Conaprole figura como de España); y una
  tanda propia de fotos de unos 200 envasados uruguayos de los más vendidos, empezando por las bebidas, cargados en Open
  Food Facts. Ofrecer mandar a Open Food Facts lo que el escáner de etiqueta lee cuando el código no está (D13) suma un
  toque en ese caso: se discute antes.
- **Lo que hay que pedir** (los mails los mandas tú): a GS1 Uruguay, acceso al Catálogo Electrónico para una app; a El
  Dorado y Ta-Ta, y después a GDU y Tienda Inglesa, permiso para usar su lista de EAN y nombres, con crédito y un enlace
  para comprar. Con una lista autorizada, los que Open Food Facts ya tiene entrarían a la base para buscarlos por nombre:
  unos 2.000 a 3.000 productos más (estimado). Lo uruguayo que falta solo se llena con las fotos propias, D13 o GS1.
- En la investigación se hicieron unas 9 consultas chicas a la API de Ta-Ta antes de leer sus términos: no se repiten.

Fuentes: los términos de [Tienda Inglesa](https://www.tiendainglesa.com.uy/supermercado/landing/bases-y-condiciones/728),
[GDU](https://www.disco.com.uy/terminos-y-condiciones), [Ta-Ta](https://www.tata.com.uy/terminos-y-condiciones/) y [El
Dorado](https://www.eldorado.com.uy/institucional/terminos-y-condiciones); el [decreto
272/018](https://www.impo.com.uy/bases/decretos-reglamento/272-2018); el [decreto 37.455 de la Junta Departamental de
Montevideo](https://montevideo.gub.uy/sites/default/files/biblioteca/decreto37455juntadepartamentaldemontevideo.pdf); el
[registro de alimentos de la Intendencia](https://catalogodatos.gub.uy/dataset/habilitacion-y-registro-de-alimentos); el
[Catálogo Electrónico de GS1 Uruguay](https://gs1uy.org/nuestros-servicios/catalogo-electronico/).

## Registrar: los flujos y sus toques

La gente registra 4 a 6 veces por día: cada toque cuenta. Las reglas:

- **Un solo botón para registrar,** siempre a mano: el «+» del medio de la barra (cambio 9). Abre una hoja con «Agregar comida» (la búsqueda de siempre), el peso, la carga rápida y las medidas. En Comida, la comida que falta tiene su propio «Agregar».
- **La carga rápida del «+»** (2/11/2026, para aprobar; lo pediste así): «Tu cena de siempre» de un toque (la de la hora, con lo que lleva y sus kcal, y deshacer) y el agua; debajo, **lo que sueles comer a esta hora** (lo que más anotaste en esa comida en dos semanas, con la última cantidad) en vez de los recientes, que al almuerzo eran el desayuno; y las comidas guardadas. «Calorías y macros» sale del «+» (nadie lo entendía) y queda en la hoja de registro. **Las «comidas precargadas»** que propusiste («tocas desayuno y se carga el desayuno») ya son esto: tu comida de siempre sale sola de lo que anotas, sin armarla; las que quieras fijar a mano son las comidas guardadas. Por eso no va un tercer concepto.
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
  - «Sumar» lo pone en la comida que se arma, que se ve abajo con su total; la hoja no se cierra y se suman varios seguidos. La bandeja de abajo dice un momento qué se sumó (26/10: un aviso encima tapaba la lista);
  - «Listo» abre la revisión: se cambia una porción, se quita algo o se guarda como comida;
  - «Agregar» registra todo junto. Antes no se registra nada, y si se cierra la hoja, lo juntado queda guardado.
- **Todo se corrige después** tocando el registro en la línea del día, que abre la misma ventana.
- **Las cantidades se escriben como se dicen:** «2 rebanadas», «1½ tazas», «½ unidad», «2 medium» (`src/comida/porciones.ts`).

Toques con Moss abierto, sin contar lo que se escribe. Revisar antes de agregar
suma tres toques a cada registro («sumar», «listo» y «agregar»): lo de siempre
pasó de 2 a 5. Con el «+» en la barra (cambio 9, D17):
- **buscar suma un toque**, porque el «+» abre su hoja y «Agregar comida» la búsqueda: 6 en lugar de 5;
- **lo reciente y las comidas guardadas bajan a 2**: en la hoja del «+» se registran de un toque, en la comida de esa hora, con su última cantidad y con deshacer, sin la revisión;
- **desde Comida**, el «Agregar» de la comida que falta abre la búsqueda: siguen siendo 5.

| Flujo | Toques |
|---|---|
| Lo que sueles comer a esta hora, desde el «+» (2/11) | **2**: el «+» y el alimento (registra directo, con su última cantidad y deshacer). Antes eran los recientes, con los mismos toques |
| Algo de siempre (sugerencia de la hora o favorito) | **6**: el «+», agregar comida, el «+» de la fila, sumar, listo y agregar; **5** desde Comida |
| Buscar y agregar con su porción | **6** y escribir (**5** desde Comida) |
| Buscar y elegir otra cantidad | **7** y escribir: el «+», agregar comida, el «+» de la fila, la porción, sumar, listo y agregar |
| Varios alimentos de una vez | **3 + 2 por alimento** y escribir |
| Armar un plato y guardarlo para la próxima | lo anterior **+ 1** y un nombre |
| Una comida guardada | **2**: el «+» y la guardada (registra directo, con deshacer) |
| Tu comida de siempre (26/10) | **2**: «Agregar» en el hueco de la comida y «Tu desayuno de siempre» (anota directo, con deshacer); **2** también desde el «+» desde el 2/11 (estaba a 3), porque va en la carga rápida. Sale sola: la misma combinación de alimentos en esa comida al menos dos veces en dos semanas (\`deSiempre\`), con las cantidades de la última vez. Si ya se está armando otra cosa, se suma a lo que se arma |
| Copiar una comida de ayer | **2**: «copiar de ayer» en el hueco de la comida (abre la revisión) y agregar |
| Copiar un día entero | **3**: copiar día, elegir el día y confirmar |
| Código de barras ya conocido | **5**: registrar, escáner, sumar, listo y agregar (lee solo, sin disparar) |
| Código nuevo con etiqueta | **8** y el nombre, una sola vez; la próxima son 5 |
| Carga rápida de calorías y macros | **4** y los números desde el 2/11 (sale del «+»): el «+», agregar comida, carga rápida y agregar |
| Decir la comida entera (26/10) | **3** y hablar: el «+», «Decir lo que comí» (abre escuchando) y «Agregar», para cualquier cantidad de alimentos |
| Foto y decir qué es (2/11, para aprobar) | **5** y hablar: el «+», agregar comida, la cámara, disparar y agregar; **4** desde el hueco de la comida. Ver «La foto de la comida» |
| Planificar un día futuro | **1 o 2** para ir al día, y lo mismo que hoy; al llegar el día, **1** para confirmar todo |
| Compartir una receta | **2 o 3**: compartir y elegir a quién |
| Agua | **2**: el «+» y el vaso de 250 ml (o llega sola desde Salud) |
| Peso a mano | **3** y el número: el «+», registrar peso y guardar (o llega solo desde Salud) |
| Medidas del cuerpo | **3** y los números: el «+», medidas y guardar |

- **Lo que se repite en todos los flujos:**
  - la última porción de cada alimento;
  - lo que solés comer a cada hora: por frecuencia y por lo reciente, en la misma franja horaria;
  - copiar.
- **La foto de la comida** es opcional y no se analiza: un toque en la comida ya registrada. Dónde se guarda es D10. Sacarla al anotar y decir qué es, en «La foto de la comida», más abajo.
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

## Decir la comida de una vez (26/10/2026)

Lo pediste el 26/10: decir la comida entera («dos huevos revueltos, una tostada
con manteca y un café con leche») y que Moss tome lo que importa y pregunte solo
lo que no entiende. La investigación (las otras apps, la voz en el iPhone y cómo
entender la frase sin nube) está en [`registrar-rapido.md`](registrar-rapido.md).

- **Dónde:** «Decir lo que comí» arriba de la hoja del «+» (abre escuchando), el
  micrófono del buscador y, si en el buscador se escribe una comida entera,
  «Anotar todo junto».
- **La voz:** el reconocimiento del iPhone, **solo en el teléfono**
  (`expo-speech-recognition` con `requiresOnDeviceRecognition`): gratis, sin
  conexión y sin que el audio salga. Lo que la persona come más ayuda a reconocer
  los nombres (`contextualStrings`). Sin reconocimiento para el idioma, el
  micrófono del teclado hace lo mismo; escribir también.
- **Entender, sin IA y con tests:**
  - `src/comida/frase.ts` parte la frase: saca muletillas y verbos, entiende la
    comida que se nombra («en el almuerzo») y las correcciones («dos, no, tres»),
    completa lo que se calla («y una de jamón y queso», «y 150 de pollo») y corta
    el «con» solo si el nombre entero no está en la base (café con leche es uno).
  - `src/comida/entender.ts` busca cada cosa con el buscador de siempre: gana lo
    que ya se eligió antes para esas palabras, después el nombre exacto y lo que
    ya se comió. La cantidad es la dicha, la última o la porción de siempre (la
    de contar: «2 huevos» son 2 huevos, nunca 2 tazas). Una medida de la casa
    queda como se dijo: «un vaso de leche» es «1 vaso (200 ml)» y «dos
    cucharadas», 2 cucharadas, no gramos (26/10/2026).
- **Las preguntas:** solo si cambian el número (40 kcal, o un 15 % si son al
  menos 15), con la respuesta ya marcada, una por alimento y tres por comida:
  cuál («¿Qué leche?»), crudo o cocido («¿Los 200 g son crudos o cocidos?» o, con
  una medida, «¿Lo mediste crudo o cocido?», si no se dijo cómo) o cuánto (sin cantidad ni una vez anterior). Cada respuesta se
  recuerda: la próxima vez esas palabras no preguntan. «Agregar» nunca espera.
- **Lo que se entiende además:** la corrección después de lo dicho («dos huevos,
  no, tres»), «un huevo y medio», la comida por el verbo («desayuné…») o por el
  momento del día («a la noche…»), y que lo de después de un «y» que sigue al
  «con» es otra cosa («café con leche y medialunas»). Contar va por unidad
  aunque sean muchas («20 uvas», si hay «1 uva»); sin cantidad, la porción de
  siempre, no la de una unidad. Crudo o cocido se recuerda aparte de «cuál»: «un
  plato de arroz» no queda crudo por haber contestado «200 g de arroz».
- **La revisión:** cada cosa con su cantidad, que se cambia con − y +, y una
  cruz para sacarla; lo que no se encontró, con «Buscarlo», que deja lo demás
  esperando en la canasta. Volver a hablar suma («y una banana») sin perder lo
  revisado. «Agregar al almuerzo» anota todo, con deshacer.
- **Toques:** el «+», «Decir lo que comí», hablar y «Agregar»: **3**, para
  cualquier cantidad de alimentos (más uno por pregunta que se quiera cambiar).

## La foto de la comida (2/11/2026)

Lo pediste el 2/11: sacar una foto al anotar y después decir o escribir qué es. Moss
lo calcula con la base. **Para aprobar en la galería** (`galeria/src/fotos.js`, sección
Comida); en la app sigue la foto de hoy (`src/secciones/comida/fotos.ts`).

- **La foto no se analiza.** Una línea fija lo dice en el visor, en «¿Qué es?» y al
  abrirla: «La foto no se analiza: es solo para tu diario.» Los números salen de lo
  que se dice, con `frase.ts` y `entender.ts`: es decir lo que comí, con sus mismas
  preguntas.
- **Dónde:** la cámara de la hoja de registro, al lado del micrófono. Abre un visor
  con «Tus fotos» a mano: el selector del sistema, que no pide permiso y le da a Moss
  solo la que se elige. Al disparar, sube «¿Qué es? Dilo o escríbelo» con la miniatura
  arriba, ya escuchando.
- **Toques:** es un camino más y no le suma un toque a ningún otro.

  | Camino | Toques |
  |---|---|
  | Foto y decir qué es, desde el «+» | **5** y hablar: el «+», agregar comida, la cámara, disparar y agregar |
  | Foto y decir qué es, desde el hueco de la comida | **4** y hablar |
  | Foto de una comida ya anotada | **2**: la cámara de la tarjeta y disparar |
  | Anotar después | **4 o 5**: lo mismo, con «Anotar después» en lugar de agregar. Anotarla más tarde son **3** y hablar: la foto, «Anotar» y agregar |

- **Tu día en fotos:** arriba de la línea del día, una tira con las fotos de ese día.
  Tocar una la abre con lo que se anotó con ella o, si se sacó después de anotar, con
  toda su comida. Sin fotos no ocupa lugar: Comida se ve como hoy. En la tarjeta, una
  miniatura en lugar de la cámara, no los 140 px de foto de hoy.
- **Sin anotar:** «Anotar después», o cerrar sin agregar, deja la foto en el día con
  «Sin anotar» en la tira, sin recordatorios ni culpa. Se anota en la comida y la hora en
  que se sacó. Una foto nunca se pierde sin querer: deshacer lo anotado la devuelve a sin anotar.
- **Borrar:** se borra la foto, nunca lo anotado, con deshacer. El archivo se va al
  vencer el deshacer.
- **Cambia D10 en dos cosas:** además de la cámara, el selector, y más de una foto por
  comida. Lo demás sigue igual: quedan en el teléfono y en su copia de iCloud, no suben
  a la cuenta y se borran con la cuenta. No pide build: el selector y `CameraView` ya
  están. La política de privacidad dice que el selector es para la foto de perfil, y se
  le suma la de la comida.

### Para después: reconocer la foto con IA

**Para suscriptores, cuando haya unos 5 pagando.** No se prende antes, y lo de hoy
sigue gratis y sin IA.

- **Es opcional, foto por foto:** un botón «Reconocer (aproximado)» en «¿Qué es?». Sin
  tocarlo, la foto no sale del teléfono.
- **Siempre «aproximado»:** el modelo dice qué ve y cuánto, como una frase, y esa frase
  pasa por `entender.ts`. Los números siguen saliendo de la base; cada alimento se
  marca «aproximado» (`comida.decir.supuesto`) y se revisa antes de agregar. Lo que no
  se ve (el aceite, la leche del café) se escapa: Cronometer avisa lo mismo.
- **Costo por foto, con precios del 2/11/2026** ([precios](https://platform.claude.com/docs/en/about-claude/pricing),
  [tokens de una imagen](https://platform.claude.com/docs/en/build-with-claude/vision)):

  | Modelo | Precio por millón (entrada / salida) | Por foto | 2 a 4 fotos por día (60 a 120 por mes) | De USD 9,99 por mes | De USD 39,99 por año |
  |---|---|---|---|---|---|
  | **Claude Haiku 5.5, sin razonar (el que recomiendo)** | USD 0,10 / 0,50 | **USD 0,0003** | USD 0,02 a 0,04 por mes | 0,2 a 0,4 % | 0,7 a 1,3 % |
  | Claude Sonnet 5.5, sin razonar (la alternativa) | USD 2 / 10 | **USD 0,006** | USD 0,38 a 0,75 por mes | 4 a 9 % | 13 a 27 % |
  | Claude Opus 5.5, el techo (no se puede dejar de razonar) | USD 4 / 20 | USD 0,023 | USD 1,35 a 2,71 por mes | 16 a 32 % | 48 a 96 % |

  De dónde sale cada número:
  - **La foto:** se achica en el teléfono a 1024×768. Son ⌈1024/28⌉ × ⌈768/28⌉ = **1.036 tokens**
    (la fórmula de Anthropic). Mandarla entera llega al tope de 4.784, y cuesta 2,2 veces
    más con Haiku.
  - **Lo demás, estimado sin medir** (se confirma con `count_tokens`): **600 tokens** de
    instrucciones y formato, y **300** de respuesta (la lista de lo que se ve). «Sin
    razonar» es `thinking: disabled` en Haiku y `between_tools` en Sonnet. En Opus, 500
    más de razonamiento; ese mismo razonamiento en los otros dos daría USD 0,0006 y
    USD 0,011 por foto.
  - **El porcentaje** es sobre lo que queda después del 15 % de Apple (Small Business
    Program): USD 8,49 por mes, o USD 33,99 por año (USD 2,83 por mes). Con el precio de
    antes (USD 4,99 y 29,99), sería 0,4 a 1,8 % con Haiku y 9 a 35 % con Sonnet.
  - **Los 5 suscriptores:** 300 a 600 fotos por mes. Son USD 0,09 a 0,19 con Haiku y
    USD 1,88 a 3,76 con Sonnet, contra USD 14 a 42 por mes después de Apple.
  - **Sin contar:** reintentos ni la función del servidor. El caché no ayuda (dura 5
    minutos y las fotos llegan a horas distintas), y el lote, con su 50 % menos,
    tampoco: la persona está esperando.

  El costo no es lo que frena; con Sonnet en el plan anual ya pesa. Antes de elegir, se
  mide con 50 platos pesados, como las 50 etiquetas: primero Haiku, y Sonnet si Haiku
  no alcanza. La decisión es tuya, con esos números.
- **Dónde iría:** una función propia, `supabase/functions/moss-reconocer-foto`:
  - la clave de la API, como secreto del servidor, nunca en el teléfono;
  - comprueba la sesión y un tope por día (10 fotos, USD 0,09 al mes con Haiku);
  - comprueba la suscripción con la transacción firmada de StoreKit: **hoy vive solo
    en el teléfono**, así que esto es nuevo;
  - la foto pasa y no se guarda: nada en Storage ni en `moss`;
  - si no contesta, sigue «¿Qué es? Dilo o escríbelo», que anda sin conexión.
- **Lo que cambia en la privacidad si se prende**, antes de prenderlo:
  - **Apple (5.1.2(i)):** hay que decir que la foto va a una IA de terceros y [pedir
    permiso explícito](https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing)
    antes. Una hoja la primera vez, con quién la recibe, y se apaga en Perfil.
  - **La política (`docs/`):** hoy dice que Moss «no comparte tus datos con servicios de
    inteligencia artificial». Eso cambia: la foto que elijas reconocer va a Anthropic, que
    [por defecto no entrena con ella](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training)
    y [la borra en 30 días](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data), salvo un acuerdo de retención cero.
  - **La ficha y `app.json`:** las respuestas de privacidad de App Store Connect suman
    fotos, y `spec/revision.md` también. Los textos de permisos dicen «Moss no sube tus
    fotos», así que cambian con una build: tocan la huella nativa.

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
   - **Pisos:** 1.200 kcal para mujeres y 1.500 para hombres (la guía AHA/ACC/TOS 2013; hasta la 1.0, 1.400).
   - **Redondeo:** el gasto y las kcal, a la decena.
   - Es la cuenta de la app hasta programar el cuestionario nuevo (abajo): con el
     ejemplo de los tests (29 años, 172 cm, 74,5 kg, «bastante», mantener) da
     2.770 kcal, con 119 g de proteína, 387 de carbohidratos y 83 de grasas. La
     galería ya usa la cuenta nueva.
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

### El cuestionario nuevo (2/11/2026, para aprobar)

Lo pediste el 2/11/2026: que Progreso muestre un plan («llegar acá en tanto tiempo;
después, esto») que cambie según cómo vienes, y para eso un cuestionario con las
preguntas típicas de MacroFactor. Está en la galería (`galeria/src/entrada.js`,
escenarios `cuestionario` y `entrada`), con las cuentas puras y con tests en
`src/dominio/cuestionario.ts` (más `macrosConProteina` en `metas.ts`). La app sigue
con el de la 1.0 hasta que se apruebe.

**Lo que hacen las otras.** MacroFactor pregunta en unos 47 pasos: Salud, sexo,
nacimiento, altura, peso, historial del peso, grasa (una grilla de 3 × 3 fotos),
sesiones por semana, actividad fuera del ejercicio, experiencia con pesas y con
cardio, objetivo, peso meta y ritmo con su fecha, programa, dieta, piso, reparto de
la semana y proteína en cuatro niveles. Separa la vida diaria del ejercicio, usa la
masa magra si sabe la grasa y trata la recomposición como mantener o ir muy lento.
Carbon pregunta «¿sabes tu grasa?» y, si no, muestra imágenes; RP Diet arma la semana
con la hora de entrenar y las comidas alrededor.

**Las pantallas.** Una pregunta por pantalla y lo que va junto, agrupado; lo que no
aplica se saltea, y la constelación de los pasos cuenta solo lo que aparece (de 8 a
16 pantallas según lo contestado; con Salud, bajando y entrenando, 12).

| Pantalla | Qué pregunta | Cuándo aparece | Para qué |
|---|---|---|---|
| Salud | conectar o «Ahora no» | siempre | trae sexo, edad, altura, peso, pasos y noches |
| Esto dice Salud | los cuatro datos en una tarjeta, para confirmar; cada uno se abre para cambiarlo | con Salud | el gasto en reposo |
| Sexo, edad, altura y peso | de a uno, como antes (sexo, obligatorio; 16 o más) | sin Salud | el gasto en reposo |
| ¿Alguno es tu caso? | embarazo o lactancia, una condición médica, nada | siempre | sin déficit, como antes |
| ¿Sabes tu porcentaje de grasa? | No sé · Lo sé (el número) · Por imagen (nueve figuras dibujadas, cada una un rango) · Con cinta (cintura, cuello y, en mujeres, cadera: la Marina, `Cuerpo.rangoDeGrasa`) | desde los 18 y sin cuidados | Katch-McArdle y la proteína por la masa magra |
| ¿Cuánto te mueves en tu día? | casi todo el día sentado · de pie o caminando parte del día · un trabajo físico; con Salud, los pasos sugieren | siempre | lo que suma la vida diaria |
| ¿Entrenas? | pesas o máquinas (también crossfit) · partidos (fútbol, básquetbol, hockey, vóley, tenis, pádel: intermitentes, nada de «aeróbico») · correr, bici o nadar · choques o combate (rugby, artes marciales, boxeo) · no entreno (o solo camino o hago yoga). Se elige más de uno | siempre | las kcal del entrenamiento y los consejos (salen de los deportes, `tipos`) |
| ¿Cuándo entrenas? | con un deporte, sus días, la hora y cuánto dura; con dos o más, lo de cada uno, y se ve qué días tienen dos sesiones. Con partidos o choques, «¿Juegas partidos o compites?» y qué día (se suma a los días de ese deporte); con combate, «¿Compites por categoría de peso?». Y cuánto tardas en llegar (en casa, menos de 15, de 15 a 30, más de 30 minutos) | si entrena | las kcal de cada día, los consejos y los avisos |
| ¿Qué quieres lograr? | bajar · mantener · subir · ganar músculo y perder grasa | siempre | la meta |
| ¿Hace cuánto entrenas con pesas? | menos de un año · de 1 a 3 · más de 3 | al subir o recomponer, con pesas | el ritmo que se propone |
| ¿A qué peso quieres llegar? | el peso (propone un 5 %; nunca debajo de un IMC de 18,5) y el ritmo: suave, recomendado y rápido, cada uno con su fecha, o «Elegir una fecha» con el ritmo que pide y qué tan exigente es (D35) | al bajar o subir | el plan |
| Cuando llegues, ¿qué sigue? | mantener · ganar músculo · lo decido después, con el plan en una línea: hoy, la meta con su fecha y el final de las semanas en mantenimiento | al bajar o subir | la etapa que sigue en el plan de Progreso (`perfil.despues`, `planPorEtapas`) |
| ¿Cómo quieres comer? | el reparto (con su barra), la proteína en gramos (más baja, recomendada, más alta) y qué comes (de todo, vegetariana, vegana, pescetariana) | siempre | los macros y el plan de comidas |
| ¿Cómo es tu día? | una línea del día: te despiertas, las cuatro comidas (tocar una dice «no suelo»), el entreno con la hora de salir, y te acuestas; el fin de semana, igual o más tarde | siempre; con 3 noches en Salud, el sueño se muestra y no se pregunta | los avisos: qué comer antes de entrenar, contando el viaje, y la hora de dormir |
| Tu punto de partida | la meta, el plan en una línea («Bajar a 71 kg para el 4 de enero; después, mantener») y de dónde sale el gasto (en reposo, la vida diaria y el entrenamiento) | al final | |

**Las cuentas** (`src/dominio/cuestionario.ts`, con sus tests):
- **En reposo:** Mifflin-St Jeor; con la grasa (desde los 18, sin cuidados y dentro
  de lo posible), Katch-McArdle: 370 + 21,6 × la masa magra.
- **La vida diaria, sin el entrenamiento:** sentado 1,35 (el «poco» de siempre), de
  pie 1,5 y un trabajo físico 1,7. Son las categorías del IOM (2005): la vida diaria
  sola llega a 1,39; con un rato de caminar, de 1,4 a 1,59; con un trabajo de
  esfuerzo, de 1,6 a 1,89. Los pasos de Salud sugieren la respuesta (Tudor-Locke y
  Bassett, 2004: menos de 5.000 por día es sedentario; más de 10.000, activo).
- **El entrenamiento, aparte y neto, día por día:** cada día suma lo de sus sesiones,
  (el MET − 1) × los kilos × las horas, y se promedian los siete días (`kcalDelDia`,
  `kcalDelEntreno`): un día con pesas y partido suma los dos, y un deporte de un solo día
  no se reparte en los demás. Los MET, del Compendio de Actividades Físicas (2024): pesas
  o máquinas 5 (de 3,5 a 6, el mismo número de la sesión de Ascent; el crossfit, como un
  circuito vigoroso, llega a 7,5); partidos 7 (fútbol 7, básquetbol 7,5, hockey 7,8, tenis
  6,8, vóley de 4 a 6, sin competir; el pádel no está); correr, bici o nadar 8 (correr de
  7,5 a 9,3, la bici de 6,8 a 8, nadar de 5,8 a 9,8); choques o combate 7,5 (rugby de 6,3
  a 8,3, kickboxing 7,3, la bolsa de boxeo de 5,8 a 10,8, sparring 7,8).
- **Para la base de hoy:** el nivel de actividad de siempre que más se parece
  (`actividadEquivalente`).
- **La recomposición:** en mantenimiento o, con mucha grasa (desde el 25 % en hombres
  y el 32 % en mujeres, «obesidad» para el ACE), bajando al ritmo suave; con la
  proteína más alta (Barakat y otros, 2020).
- **La proteína por nivel**, en g por kilo (la recomendada es la de siempre):

  | | Más baja | Recomendada | Más alta |
  |---|---|---|---|
  | Bajar | 1,6 | 2,0 | 2,2 |
  | Mantener | 1,2 | 1,6 | 2,0 |
  | Subir | 1,4 | 1,8 | 2,2 |
  | Recomponer | 1,8 | 2,0 | 2,2 |

  Con la grasa, va por la masa magra (contra un 15 % de grasa en hombres y un 25 % en
  mujeres, la de la gente de esos estudios): un poco más para alguien muy magro y
  menos con mucha grasa. Siempre entre 1,2 y 2,2 g por kilo (Morton y otros, 2018) y
  nunca más del 40 % de las kcal.
- **La experiencia con pesas:** subiendo, con más de 3 años se propone el ritmo suave
  (el modelo de Aragon: del 1 al 1,5 % del peso por mes el primer año, de 0,5 a 1 %
  hasta los tres y de 0,25 a 0,5 % después; lo de más es grasa).
- **El peso meta:** un 5 % menos o más, de a medio kilo; bajando, nunca debajo de un
  IMC de 18,5 (si ya está ahí, bajar no se elige y se dice por qué); al menos 1 kg de
  camino. Con una fecha, el ritmo que pide; antes de los 18, bajando, nunca más que el
  recomendado. El piso de siempre.
- **El ejemplo de la galería** (29 años, 172 cm, 74,5 kg, sentado, pesas tres veces
  por semana una hora, mantener) da 2.400 kcal: 1.680 en reposo, 590 de la vida
  diaria y 130 de entrenar, con 119 g de proteína, 319 de carbohidratos y 72 de
  grasas. La cuenta de la 1.0 le daba 2.770 («bastante», × 1,65): separar el
  entrenamiento baja la estimación de quien entrena pero trabaja sentado, y el control
  de cada semana corrige lo que falte.

**Los consejos según el deporte** salen de los deportes (`tipos`) y de las sesiones de
cada día, no de un «mixto»: básquetbol con pesas no pide lo mismo que bici con pesas. Qué
cambia en cada uno, en [`entreno.md`](entreno.md), «Según el tipo de deporte». El tipo
reducido (solo pesas es fuerza, solo correr, bici o nadar es resistencia, y lo demás,
mixto: `tipoDeSesion`, `horarioDeLosAvisos`) queda solo para el horario de los avisos
de comer antes y después (`alrededorDelEntreno.ts`), que hoy lleva uno.

**Lo que se decidió en la maqueta:**
- Con un cuidado (embarazo, lactancia o una condición médica, que incluye un trastorno
  de la alimentación) no se pregunta la grasa: las figuras y el porcentaje no le hacen
  bien a quien cuida lo que come, y sin déficit no hace falta tanta precisión. Tampoco
  se ofrece recomponer.
- La grasa nunca se muestra como una medida exacta: lo dicho se toma como una
  estimación, y la figura y la cinta son rangos.
- El entreno va en dos pantallas: los cinco tipos con sus ejemplos no entran junto con
  los días, la hora y el viaje. Con dos deportes o más, cada uno tiene sus días y su hora
  (así aparecen los días con dos sesiones); los partidos y la categoría de peso son una
  línea más en la misma pantalla, y si no entra todo, se desliza.
- La experiencia va antes del peso meta, porque elige el ritmo que se propone.
- Del viaje se guarda el borde de arriba de cada tramo (0, 15, 30 y 45 minutos), así el
  aviso de comer antes de entrenar llega con tiempo, nunca tarde.
- Quedan en Perfil, no en la entrada: las unidades, «El día empieza», «Tardo en
  dormirme», el piso, las metas a mano, el día del control, repartir la semana, el
  tiempo para cocinar, «No como…» y prender los avisos.

**Lo que falta para programarlo en la app:**
1. `src/secciones/entrada/Entrada.tsx`: las pantallas nuevas y `metaDelCuestionario` en
   lugar de `metasIniciales`; las figuras, en Skia o en SVG.
2. Guardarlo y que suba con el perfil: una migración en `supabase/moss/`, con su regla en
   `mezclar.ts`, sus filas en `remoto.ts` y su comprobación en `verificar-supabase.mjs`.
   `moss.perfiles.objetivo` tiene un CHECK (bajar, mantener o subir): la recomposición va
   como `mantener` más una marca `recomponer`. Lo nuevo (cuánto se mueve, los deportes con
   su horario y el viaje, la experiencia, la grasa y cómo se supo, lo que sigue, el nivel
   de proteína, las horas de comer y el sueño), en columnas o en un jsonb. `actividad` se
   sigue llenando con `actividadEquivalente` mientras Perfil edite el nivel de siempre.
3. Separar «avisarme a esa hora» (`ajustes.horario` de `avisos.ts`) de «mis horas de
   comer» (las del cuestionario, que usan lo de comer antes de entrenar, el plan y la
   comida de cada hora): hoy son lo mismo.
4. Perfil › Entrenamiento (`ajustes.entreno`, que hoy queda solo en el teléfono) pasa a
   guardar los deportes (`tipos`), la sesión de cada uno (`sesiones`), el viaje, los
   partidos con su día y la categoría de peso, y lo llena el cuestionario. Los avisos de
   comer antes y después leen las sesiones de cada día (`sesionesDeUnDia`) en lugar del
   horario único.
5. Leer la grasa (y la masa magra) de Salud cambia la privacidad: un permiso más de
   HealthKit, su texto en `app.json` (toca la huella nativa: va con la próxima build), las
   respuestas de privacidad de App Store Connect y `spec/revision.md`.
6. Los consejos según el deporte: [`entreno.md`](entreno.md), «Según el tipo de deporte».

Fuentes: MacroFactor ([las pantallas](https://screensdesign.com/apps/macrofactor-macro-tracker/?vs=171074),
[sus algoritmos](https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/),
[las ecuaciones del gasto en reposo](https://macrofactor.com/best-bmr-equations/),
[los programas](https://help.macrofactorapp.com/en/articles/34-what-are-the-different-program-options-in-coached-mode)
y [la recomposición](https://help.macrofactorapp.com/en/articles/220-how-do-macrofactor-s-algorithms-respond-to-body-recomposition));
[Carbon](https://help.joincarbon.com/en/articles/6040890-how-to-create-your-initial-goal);
[RP Diet](https://docs.rpstrength.com/docs/diet-coach-app/1.22-beta/concepts/schedule/);
el [Compendio de Actividades Físicas (2024)](https://pacompendium.com/); IOM, *Dietary
Reference Intakes for Energy* (2005); [Tudor-Locke y Bassett (2004)](https://pubmed.ncbi.nlm.nih.gov/14715035/);
Morton y otros (2018); Barakat y otros (2020); Helms y otros, *The Muscle and Strength
Pyramid: Nutrition* (el modelo de Aragon).

## La pantalla de comida

Desde el cambio 9 (22/10/2026) está repartida:
- **Inicio:** las calorías que quedan, grande y claro, al lado de la luna, y lo que queda de cada macro. El punto de cada macro brilla al cumplir lo pedido (`estadoDeMacro` en `src/dominio/metas.ts`: el número redondeado llega a la meta) y tiembla un poco si se pasa por mucho (un 20 % y al menos 10 g).
- **Comida:** lo de cada día, cada semana y cada mes.
- **Progreso:** la tendencia del peso, el gasto que estima el algoritmo y el resumen del último control ([`progreso.md`](progreso.md)).
- **El agua** salió de las pantallas: se suma desde el «+» y es un bloque que se puede agregar a Inicio.

**Por día, por semana y por mes, como MacroFactor** (pedido el 21/10/2026).

Lo de MacroFactor, confirmado en su ayuda y en su web:
- El registro tiene arriba la tira de la semana, de lunes a domingo, y cada día se llena contra la meta de calorías ([ayuda](https://help.macrofactorapp.com/en/articles/100-view-past-days-of-eating), [el registro](https://macrofactor.com/timeline-based-food-logger/)).
- Debajo van cuatro barras finas («2984 / 3033»).
- El inicio tiene la nutrición del día, la de la semana (siete días con cuatro barras cada uno) y gráficos de 1 semana a 1 año ([ayuda](https://help.macrofactorapp.com/en/articles/22-get-to-know-your-dashboard), [inicio](https://macrofactor.com/dashboard-customization/)).
- Se puede planificar comida en días futuros, y el algoritmo no la cuenta hasta que el día pasa ([ayuda](https://help.macrofactorapp.com/en/articles/51-log-food-to-future-days)).
- Los colores son solo para los datos, y nunca hay rojo de «te pasaste».

En Moss, la pestaña Comida:
- **Arriba, la tira de la semana:** una luna chica por día, que se llena con lo comido y se toca para ver ese día. Los días que vienen van en blanco y lo planificado, tenue.
- **Un cuadro que se desliza** (lo pediste el 22/10/2026):
  - empieza en el **día**: lo comido contra la meta con una luna chica, y las barras de los macros;
  - deslizando a la izquierda, la **semana**: el promedio por día de los días que ya terminaron, con sus macros, y los siete días con una barra de calorías y una por macro contra la meta;
  - otra vez, el **mes**: el promedio del mes y el calendario con una luna por día.

  Debajo dice dónde estás (Día, Semana, Mes), y también se toca. El alto sigue a lo que se ve. Tocar un día de la semana o del mes vuelve al día, con ese día.
- **Abajo, la línea del día.**

**Cómo se ve:**
- La luna se llena con lo comido. Desde el 22/10/2026 se dibuja píxel a píxel como una esfera:
  - los mares de la cara visible, los cráteres con su borde claro y Tycho con sus rayos;
  - la luz de la Luna de verdad (Lommel-Seeliger): llena se ve pareja y a medias se apaga suave hacia el terminador;
  - la luz cenicienta en lo oscuro.

  Los arcos de los macros se fueron: los macros están al lado.
- Los números y los títulos van en una sans sobria (Outfit), no en la serif del cielo.
- Está en la galería, esperando aprobación: desde el 22/10 repartida entre Inicio, Comida y Progreso.

## El plan de comidas (23/10/2026)

Lo pediste el 22/10, a la noche: Moss arma las comidas del día o de la semana que
llegan a la meta, y se adaptan cuando cambia. Las reglas están en
`src/dominio/plan.ts`; en la app, `src/secciones/comida/Plan.tsx`, y en la
galería, sección 3.

- **Con qué arma:** primero lo que comes seguido (lo mismo, al menos dos veces en
  las últimas cuatro semanas, con la cantidad del medio de cada alimento), después
  lo que marcaste con ♡ y, si falta, 54 comidas tipo de todos los días, de acá y de
  todas partes, para cuatro dietas, con sus alérgenos y su tiempo. Lo que tiene un
  alimento que no está en la base no se propone.
- **Cuánto:** escala cada comida (de la mitad al doble de lo de siempre, de a media
  porción o de a 5 g) para que el día quede a menos de un 5 % de las kcal y con al
  menos el 90 % de la proteína. Cada comida queda entre el 70 % y el 140 % de su
  parte del día (desayuno 20 %, almuerzo 35 %, merienda 15 % y cena 30 %, con
  cuatro comidas): para llegar a la proteína se cambia una comida antes que armar
  un almuerzo doble. Si no se llega, queda lo más cerca posible y lo dice. Los
  carbohidratos y las grasas no se persiguen.
- **Lo que falta:** «Armar el día» arma solo las comidas sin nada anotado ni
  planificado y, hoy, las que no pasaron hace más de una hora, con lo que dejó lo
  ya comido. «Armar la semana» hace lo mismo hasta el domingo, evitando lo de los
  dos días anteriores.
- **Lo armado queda planificado,** también hoy: tenue, con su etiqueta, y el
  control no lo cuenta. Cada comida armada tiene:

  | Acción | Toques | Qué hace |
  |---|---|---|
  | Comí esto | 1 | la anota, con Deshacer (solo hoy o antes) |
  | Otra | 1 | otra opción de esa comida a menos de un 15 % de kcal y proteína |
  | ♡ | 1 | sale más seguido |
  | ✕ | 1 | no vuelve a proponerse (lo anotado no se toca) y se cambia ya por otra, con Deshacer |

- **Tus comidas:** cómo comes (de todo, vegetariana, vegana o pescetariana), lo que
  no comes (los alérgenos que piden las etiquetas), cuántas comidas por día (3, 4 o
  5) y el tiempo para cocinar (15 minutos, 40, o lo que sea). Sin contestar: de
  todo, cuatro comidas y tiempo normal. Va en el perfil y sube a la cuenta.
- **La lista de compras:** lo de las comidas planificadas desde hoy, sumado por
  alimento, para tachar en el súper; lo tachado queda en el teléfono.
- **Cuando la meta cambia** (el control de la semana, la estrategia o las metas a
  mano), lo armado de hoy en adelante se escala a la nueva con las mismas comidas,
  sin tocar lo anotado ni lo planificado a mano.

## Pegar una receta (23/10/2026)

Lo pediste el 22/10: en Guardadas (y dentro de una receta nueva), «Pegar una receta» lee el texto
como venga, en español o en inglés (`src/comida/recetaDeTexto.ts`, con sus tests):
- el título, las viñetas, «Ingredientes:», «Rinde 4 porciones» o «Serves 4», el peso final si lo
  dice, y salta la preparación;
- cada ingrediente con su cantidad: «2 tazas», «400 g», «1 cebolla grande», «una taza y media»,
  «2-3», «1 lata (400 g)»; lo que va «a gusto» queda sin cantidad;
- cada uno se busca en la base (el primero que encuentra) y se pasa a gramos con sus porciones o su
  densidad.

Después se revisa: un toque saca una línea, y lo que no se encontró queda a la vista para
agregarlo a mano. Los ingredientes pasan a la receta, que se guarda como siempre (D15). La taza es
la de cocina (236,6 ml), no la de las etiquetas.

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

## Global, y lo que no le cuesta nada a Moss

Desde D40 (2/11/2026), toda Moss es de pago, con 7 días gratis ([`suscripcion.md`](suscripcion.md)). Lo que sigue se escribió cuando era gratis, y sigue valiendo en lo que importa: nada de esto tiene un costo por usuario, ni se cobra aparte.

- **Español e inglés** desde el día uno, con los nombres regionales de cada país.
- **Unidades:** métricas o imperiales según el teléfono, y se cambian en Perfil. Afecta al peso, la altura, las porciones en onzas y el agua.
- **Sin partes bloqueadas.** Nada de lo que hace Moss tiene un costo por usuario:
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

**Lo que en las otras se paga aparte y en Moss viene con todo:**
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
| **Exportar todo en CSV**, gratis, desde Ajustes: lo comido, el peso y las metas, con las columnas en el idioma de la app. La lógica ya está (`src/dominio/exportar.ts`) | MacroFactor; pago en MyFitnessPal y Yazio | 10 |
| **Registrar por lo que falta**: en la ventana del alimento, «cuánto para 30 g de proteína» (o para las kcal que quedan). La cuenta ya está (`gramosPara`) | MacroFactor | 5, primero en la galería |
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
- **IA de fotos:** decidido desde el principio; lo básico es sin IA. Para suscriptores, más adelante y siempre «aproximado»: ver «La foto de la comida».
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
  Moss pide 16 (desde el 28/10/2026); bajar «rápido» queda para mayores de 18, y los pisos de calorías
  valen siempre.

## Datos (esquema `moss`)

Todo es local primero: el teléfono guarda al instante y Supabase sincroniza,
con las reglas de la etapa 3. `pesos` y `metas` están en
`supabase/moss/0001_esquema.sql`; `registros`, `recetas`, `propios`,
`favoritos` y `agua`, en `0002_comida.sql` (22/10/2026); si fue a ojo y el catálogo, en `0004_medir.sql`. Lo demás llega con su
etapa. Lo que se borra en el teléfono llega a la cuenta como una marca
(`borrado`), y gana si es lo más nuevo: así el borrado también llega a los otros
teléfonos. Un teléfono nuevo baja lo comido de los últimos cuatro meses; lo
anterior queda en la cuenta.

| Tabla | Qué guarda |
|---|---|
| `registros` | lo comido: día local, comida (desayuno, almuerzo…), momento, alimento y de dónde sale (la base, el catálogo, off, propio, receta o carga rápida), la porción elegida y cuántas veces o los gramos, y los valores ya calculados (los cuatro de siempre más fibra, azúcares, saturadas, sodio y alcohol), para que el historial no cambie si cambia la base; si está planificado y si fue a ojo; en la cantidad, los ml, lo que pesó entero y el aceite de cocción. Borrar deja una marca, para que el borrado llegue a los otros teléfonos |
| `propios` | lo creado con la etiqueta o a mano: los valores por 100 g, sus porciones, la marca y el código de barras |
| `recetas` | recetas y comidas guardadas: sus alimentos como en los registros, las porciones que rinde y, en las recetas, lo que pesan terminadas |
| `favoritos` | los alimentos, recetas y comidas marcados; sacar uno es otro cambio |
| `productos_off` | lo escaneado de Open Food Facts, con la fecha (etapa 6) |
| `agua` | cada vaso sumado a mano, con su día (lo de Salud se lee, no se copia) |
| `pesos` | uno por día: fecha, kg y origen (salud, manual o ascent) |
| `metas` | desde cada fecha: kcal, macros, el gasto del que salieron y por qué |
| `catalogo` | correcciones y altas de la base de la app (los productos y los platos), sin sacar una versión: lo lee cualquier usuario con sesión y lo escribe solo Moss (`0004_medir.sql`, D11) |

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
