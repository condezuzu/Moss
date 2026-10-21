# Nutrición: cómo se hace

Lo que tiene que hacer está en [`especificacion.md`](especificacion.md), «Nutrición».
Acá está cómo: las bases de datos, los nombres en español, la búsqueda, el
algoritmo de las metas, Salud y lo que mira Apple. Investigado el 21/10/2026.

## Las bases de datos

Tu idea es la correcta, con un ajuste en cómo se usa cada una:

- **Genéricos (pollo, arroz, banana): USDA FoodData Central**
  - Es de dominio público (CC0); se pide citarla.
  - **Va adentro de la app**, procesada una vez y guardada como una tabla SQLite.
    No se llama a la API de USDA desde el teléfono: su clave tiene que quedar
    privada.
  - **Qué se toma:**
    - **FNDDS 2021–2023:** 5.432 alimentos tal como se comen, con 22.046 pesos
      de porciones caseras («1 taza», «1 pechuga»), y kcal en todos.
    - **SR Legacy:** 7.793 ingredientes crudos con buenas medidas caseras (por
      ejemplo, una banana mediana son 118 g). Está congelada desde 2018.
    - **Foundation:** solo para actualizar valores. Tiene pocas porciones, las
      kcal vienen en otros campos y hay carbohidratos «por diferencia» que dan
      negativos (hay que recortarlos a cero).
- **Envasados: Open Food Facts, solo por código de barras**
  - Se consulta desde el teléfono al escanear y se guarda en el teléfono.
  - **Nunca se usa para sugerencias mientras se escribe.** Sus reglas lo prohíben
    y los límites son bajos: 15 lecturas por minuto y 10 búsquedas por minuto,
    por IP.
  - Cada pedido lleva un `User-Agent` con el formato `Moss/versión (correo)`.
  - **La versión de la API va fija**: la 3.5 cambió la forma de los nutrientes y
    la 3.6 cambió los campos de etiquetas.
  - Se validan los datos (kcal contra 4/4/9 por gramo, por porción contra por
    100 g), porque OFF no garantiza nada.
- **Licencia de OFF (ODbL):**
  - Mostrar lo consultado está permitido con un crédito visible y un enlace a
    Open Food Facts.
  - Si algún día Moss comparte correcciones entre usuarios o publica una copia
    limpia de sus datos, eso pasa a ser una base derivada y tiene que ser ODbL
    también. Antes de hacerlo, conviene confirmarlo con reuse@openfoodfacts.org.
  - Las filas de OFF van en su propia tabla, separadas de las nuestras.
- **Cobertura de OFF hoy:**

  | País | Productos |
  |---|---|
  | Uruguay | unos 2.000 |
  | Argentina | unos 16.500 |
  | México | unos 18.000 |
  | España | unos 360.000 |

  En Uruguay va a fallar seguido, así que hace falta **crear el producto desde la
  etiqueta** en pocos toques: nombre, porción y los cuatro números. Queda en «Mis
  comidas».

## Los nombres en español

USDA está solo en inglés, y las tablas nacionales no sirven como base:

- **BEDCA (España)** pide autorización expresa para reusar los datos.
- **ARGENFOODS** no dice su licencia.
- **La tabla de Uruguay** es un PDF de 2002, y hay una nueva en preparación.
- **La de México (2019)** tampoco declara licencia.

Se usan solo como referencia. La propuesta:

1. **Curar a mano entre 500 y 1.000 alimentos genéricos**, cada uno con un
   nombre neutro y la porción más común. Un estudio de frecuencia de consumo en
   Brasil llegó al 90 % de lo que se come con unos 60 ítems; con las variantes
   (crudo, cocido, en trozos) da ese orden.
2. **Una tabla de alias** (`alias_de_alimento`: alimento, alias, región).
   - Se siembra desde Wikidata, que es CC0 y ya tiene variantes regionales
     (plátano / banana / banano / guineo / cambur; palta / aguacate; maíz /
     choclo / elote; fresa / frutilla; guisante / arveja / chícharo).
   - Se revisa a mano: Wikidata trae ruido, como nombres científicos y un texto
     en húngaro entre los alias en español.
3. **Cuidado con los falsos amigos**:
   - *plátano* es banana o banana de cocinar según el país.
   - *manteca* es mantequilla en el Río de la Plata y grasa de cerdo en España.
     Esto no está verificado: el sitio de la RAE bloqueó la consulta.
4. **Los platos locales** (milanesa, fainá, chivito) se arman como recetas con
   ingredientes de USDA.
5. **Las búsquedas que no encuentran nada se anotan** (sin datos personales) y
   de ahí sale qué sumar.

## La búsqueda

- **Motor:** SQLite en el teléfono con FTS5. Viene prendido en `expo-sqlite`
  (versión 58, SQLite 3.53).
  - Una tabla con el tokenizador `unicode61` (sin tildes, con prefijos de 2 y 3
    letras) para lo que se está escribiendo.
  - Otra con `trigram` para los errores de tipeo. Trigram no encuentra nada con
    menos de 3 letras: para eso está la primera.
- **Orden:** `bm25` (menor es mejor) menos un premio por uso. El premio sale del
  logaritmo de cuántas veces lo usaste y de qué tan reciente fue. Lo más usado
  sube primero.
- **Si hace falta:** reordenar los 50 primeros por distancia de edición en JS.
- **Historial, frecuentes y recetas**, que son cientos, pueden ir en memoria con
  MiniSearch (6 KB).
- Fuse.js no sirve con miles de alimentos: recorre todos.
- No hay mediciones en React Native: se mide en el teléfono.

## Cuánto: gramos y porciones

- Todo se guarda por 100 g, y la porción es un peso: «1 pechuga» son 145 g.
- El valor registrado es valor por 100 g × gramos / 100.
- Las porciones salen de FNDDS y SR Legacy. Las nuestras se suman en la curación.

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
5. **Ascent** (ver [`ascent.md`](ascent.md)):
   - El peso de Ascent entra en la tendencia.
   - Los días de entrenamiento redistribuyen la meta de la semana sin cambiar el
     total.
   - La proteína sube después de una sesión grande.

## Hábitos de comida

Son hábitos automáticos, como los de Salud, con su fuente:

- «Llegar a la meta de proteína».
- «Registrar todas las comidas»: se cumple con desayuno, almuerzo y cena, o con
  las comidas que elija el usuario.
- «Quedar dentro de la meta de calorías ± 10 %».

Se encienden solos en el cielo.

## La zona de la comida

Es una luna. Se llena con lo que comés en el día, la meta es la luna llena, y
alrededor hay tres arcos: proteína (dorado), carbohidratos (verde) y grasas
(azul estrella).

La propuesta está en la galería, en la entrada: la diapositiva de la comida y el
resultado del cuestionario. Se aprueba ahí antes de armar la zona completa.

## Salud y código de barras

- **Leer peso de Salud:** `HKQuantityTypeIdentifierBodyMass`, con
  `@kingstinct/react-native-healthkit`, la misma que usa Ascent.
  - Leer un tipo que no se pidió hace que la app se cierre, así que se piden
    todos juntos.
  - La app no puede distinguir «no diste permiso» de «no hay datos».
- **Escribir en Salud** (la comida como `Food` con kcal y macros): después.
  - Pide un permiso más.
  - Puede duplicar lo de otras apps.
  - Obliga a reflejar los borrados.
  - Agregarlo después necesita una build nueva, porque el texto del permiso es
    nativo.
- **Código de barras:**
  - `expo-camera` (`CameraView`) con `ean13`, `ean8`, `upc_a` y `upc_e`.
  - Hay un escáner del sistema con VisionKit (`launchScanner`) para iOS 16 o
    más.
  - iOS entrega el UPC-A como EAN-13 con un 0 adelante, y OFF lo normaliza.

## Lo que mira Apple

- **1.4.1:** cualquier número de salud tiene que mostrar de dónde sale. Va un
  «cómo se calcula» en la meta y en el control semanal, y un «consultá con un
  profesional».
- **5.1.2(vi) y 5.1.3:** nada de publicidad con datos de Salud, ni datos de Salud
  en iCloud.
- **2.5.1:** nombrar Salud en la descripción de la tienda.
- **5.1.1(v):** borrar la cuenta desde la app (ya está en el plan).
- **Edad:** el contar calorías clasifica la app como 9+. No hay una regla de Apple
  sobre menores en apps de dieta, pero MacroFactor pide 18+ en sus términos.
  - **Propuesta:** el objetivo «bajar» con ritmo «rápido» queda para mayores de
    edad (sale de la edad del cuestionario).
  - **Los pisos de calorías** valen siempre.

## Datos (esquema `moss`)

Todo es local primero: el teléfono guarda al instante y Supabase sincroniza.
`pesos` y `metas` ya están en `supabase/moss/0001_esquema.sql`; el resto llega
con la etapa 6.

| Tabla | Qué guarda |
|---|---|
| `comidas` | día local, momento, alimento, origen (usda, off, propio, receta), gramos y los cuatro valores ya calculados |
| `alimentos_propios` | lo creado desde la etiqueta, con los cuatro valores por 100 g y la porción |
| `recetas` | ingredientes en gramos y porciones que rinde |
| `productos_off` | caché de lo escaneado, con su fecha |
| `pesos` | uno por día: fecha, kg y origen (salud, manual o ascent) |
| `metas` | desde cada fecha: kcal, proteína, carbohidratos, grasas, el gasto del que salieron y por qué (inicial, control, faltan datos o a mano). Cada control semanal deja una fila: no hace falta otra tabla de controles. El reparto por día llega con Ascent. |

## Riesgos

- **OFF se cae seguido.** Durante la investigación devolvió 503 y páginas
  antibots. Todo funciona sin conexión salvo el escaneo nuevo.
- **El sitio de FDC** no respondió desde acá (la API sí): antes de procesar hay
  que confirmar tamaños y fechas de las descargas.
- **El formato de nutrientes de OFF 3.5** no está bien documentado.
