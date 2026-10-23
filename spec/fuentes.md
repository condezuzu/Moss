# Fuentes: la segunda tabla de los curados

Lo pediste el 22/10/2026: cada alimento curado se compara con una segunda tabla
oficial (USDA es la primera), y si algo se aleja más de un 10 %, se revisa. Cada
curado guarda con qué tabla se verificó y el día, y la app muestra si está
verificado.

- `npm run alimentos:comparar` (`herramientas/comparar-fuentes.mjs`) escribe
  `alimentos/verificacion.txt`.
- Los lectores de cada tabla están en `herramientas/fuentes/`, y lo que se decide a
  mano, en `herramientas/fuentes/pares.txt`.
- `npm run alimentos` lee `verificacion.txt`: cuenta como verificado lo que dice
  «ok» o «revisado», con su tabla y su día.

## Las tablas que se miraron (23/10/2026)

| Tabla | Quién y edición | Formato | Licencia | ¿Se usa? |
|---|---|---|---|---|
| Uruguay | «Tabla de composición de alimentos de Uruguay», MTSS-INDA, Facultad de Química (UdelaR), LATINFOODS y FAO, 2002 | PDF (lo lista FAO INFOODS) | no dice | No: solo PDF, sin licencia escrita |
| Argentina | ARGENFOODS, Universidad Nacional de Luján, actualizada el 12/9/2024 | páginas web por grupo, sin descarga | no dice | No: sin descarga ni licencia |
| Brasil | **TACO**, NEPA-UNICAMP, 4.ª edición revisada y ampliada, 2011: 597 alimentos analizados en Brasil | planilla oficial (xlsx) y PDF | se puede reproducir citando la fuente | **Sí**: la regional |
| Brasil | TBCA, USP, FoRC y Brasilfoods | consulta web, sin descarga completa | CC BY-NC-ND 4.0 | No: prohíbe obras derivadas y el uso comercial |
| Chile | «Tabla de composición química de alimentos chilenos», Universidad de Chile, 8.ª edición, 1990 | PDF escaneado | no dice | No: no se lee como datos |
| México | «Tabla de composición de alimentos extendida», INCMNSZ, 2019 (3.928 alimentos; la distribuye CONABIO) | web; la descarga se mudó | no se encontró | No: sin términos de uso |
| Canadá | CNF, Health Canada, 2015 (y la nueva de 2026) | CSV y Excel | Open Government Licence – Canada | No: muchos de sus valores son de USDA, así que no la verifica |
| Reino Unido | **CoFID**, Public Health England, «McCance and Widdowson's The Composition of Foods Integrated Dataset», 2021 | xlsx | Open Government Licence v3.0 | **Sí** |
| Francia | **Ciqual**, Anses, 2025 (19/11/2025, doi:10.57745/RDMHWY) | XML y xlsx | Licence Ouverte / Etalab 2.0 | **Sí** |
| Australia | AFCD, FSANZ, Release 3, diciembre de 2025 (1.588 alimentos) | xlsx | CC BY 4.0 | Todavía no: se puede usar, y es la cuarta si hace falta |

Cumplen tres cosas: tienen descarga, se leen como datos y tienen una licencia
que deja usarlas así. Las dos que también cumplen no se usan:
- CNF copia a USDA;
- AFCD queda para después, porque con tres alcanza.

TACO es la de la región. Ciqual y CoFID no dependen de USDA, salvo lo que se
marca abajo.

## Lo que la app tiene que mostrar

En Perfil, «Créditos» (`perfil.fuentes`), una línea por tabla. Hoy está TACO;
faltan Ciqual y CoFID:

| Tabla | Español | Inglés |
|---|---|---|
| TACO | Verificación: TACO, Tabela Brasileira de Composição de Alimentos, 4.ª ed. (NEPA-UNICAMP, 2011) | Verification: TACO, Tabela Brasileira de Composição de Alimentos, 4th ed. (NEPA-UNICAMP, 2011) |
| Ciqual | Verificación: Anses, Table de composition nutritionnelle des aliments Ciqual 2025 (19/11/2025), Licence Ouverte 2.0 | Verification: Anses, Ciqual food composition table 2025 (19/11/2025), Licence Ouverte 2.0 |
| CoFID | Verificación: McCance and Widdowson's The Composition of Foods Integrated Dataset 2021, Public Health England. Contains public sector information licensed under the Open Government Licence v3.0 | Verification: McCance and Widdowson's The Composition of Foods Integrated Dataset 2021, Public Health England. Contains public sector information licensed under the Open Government Licence v3.0 |

- **La frase de CoFID va en inglés también en español:** es la que pide la
  licencia, con un enlace a ella si se puede.
- **Ciqual** pide la fuente y la fecha de la versión.
- **TACO** pide citar la fuente.
- Ninguna se presenta como si avalara a Moss: la licencia de CoFID lo prohíbe.

## Cómo se compara

- **Lo que se compara:** por 100 g, las kcal, la proteína, los carbohidratos
  totales y las grasas.
- **Los carbohidratos se llevan a como los da USDA:** por diferencia, con la
  fibra.
  - TACO ya los da así.
  - Ciqual da los disponibles. El total sale como en USDA: 100 − agua − proteína −
    grasas − cenizas − alcohol. Si falta alguno, son los disponibles más la fibra
    y los ácidos orgánicos.
  - CoFID da los disponibles en equivalentes de monosacáridos. Se pasan a su peso
    (almidón ÷ 1,10; sacarosa y lactosa ÷ 1,05) y se les suma la fibra AOAC (o la
    NSP).
  - Sin la fibra, el total no se sabe, salvo que haya menos de 1 g.
- **Las kcal son las de cada tabla, y no se cuentan igual:**
  - USDA y TACO, con factores de Atwater;
  - Ciqual, con los de la Unión Europea (la fibra a 2 kcal/g);
  - CoFID no le da energía a la fibra.

  En lo que tiene mucha fibra (alcaucil, hinojo), parte de la diferencia es de
  método.
- **La diferencia:** |la de ellos − la nuestra| ÷ la nuestra, con un piso de 100
  kcal o 20 g. Así, 2 g en algo que tiene 5 g no es un 40 %. Se escribe la más
  grande de las cuatro, por ejemplo «23 % C».
- **El estado:**
  - **«ok»:** la diferencia es de 10 % o menos.
  - **«revisado: motivo (N % X)»:** se aleja, pero la diferencia es real: otra
    variedad o especie, otro corte, otra cocción, más agua, otra receta, otra
    marca u otro método. Si después la diferencia cambia, vuelve a «revisar».
  - **«revisar»:** falta revisarlo, o el par de USDA está mal.
  - **«sin par»:** ninguna tabla tiene ese alimento.
- **La fecha** es el día en que apareció ese resultado, y no cambia mientras el
  resultado sea el mismo.

## Lo que copia a USDA no cuenta

- **Ciqual** dice de dónde sale cada valor. Un alimento queda afuera si su agua,
  su proteína, sus grasas y sus carbohidratos salen solo de USDA o de cuentas de
  Ciqual. Eso incluye las citas que juntan «Calculs Ciqual» con USDA. Quedan
  afuera 429 de 3.484.
- **Las copias a medias de Ciqual se revisaron a mano.** Ciqual saca la proteína
  casi siempre con una cuenta, así que un alimento con solo las grasas de USDA no
  queda marcado. Los piñones y el pargo van con CoFID.
- **CoFID:** quedan afuera los que tienen a USDA como única referencia principal
  (46 de 2.855, sobre todo especias). La alfalfa de CoFID tiene los mismos valores
  que USDA: queda sin par.
- **También quedan afuera:**
  - la comida de bebé de Ciqual, que Moss no registra;
  - las bebidas alcohólicas de CoFID, que van por 100 ml.
- **Lo que sale de estas tablas:** un curado cuyos valores vienen de una de ellas
  (algunos «propios» los toman de TACO) queda sin par. Compararlo sería
  compararlo consigo mismo.

## Cómo se elige el par

1. El mismo alimento, en el mismo estado y con el mismo corte. Si no hay, sirve
   otra cocción.
2. Un genérico de USDA va con un genérico («sin especificar», «aliment moyen»).
3. Entre tablas: primero TACO, después Ciqual y después CoFID.
4. Nunca se elige el que da más parecido.
5. Los platos (recetas y los de FNDDS) van con el plato más parecido. Un plato
   con guarnición («milanesa con papas») queda sin par.
6. Si lo único que hay está en otro estado (crudo y cocido, seco y fresco), queda
   sin par.

La búsqueda automática (`herramientas/fuentes/emparejar.mjs`) propone y
`pares.txt` decide. Con `--candidatos archivo.txt`, `comparar-fuentes.mjs`
lista los tres mejores de cada tabla para cada curado.

## `herramientas/fuentes/pares.txt`

Una línea por curado: `nombre | fuente:código | nota`.

```
Cerveza artesanal | ciqual:5002 | revisado: otra cerveza, con más azúcar sin fermentar (21 % C)
Cerveza | taco:474
Carne seca | sin par | ninguna tabla tiene beef jerky (el charque de TACO es otra cosa)
```

- El código es el de la tabla: `taco:N`, `ciqual:N` o `cofid:NN-NNN`.
- La nota de un par revisado termina con la diferencia exacta, como la escribe
  `verificacion.txt`.
- La nota de «sin par» dice por qué.
- Un nombre que ya no está (un curado que se renombró) solo avisa.

## Cómo se corre

- **`npm run alimentos:comparar`:** lee `assets/alimentos.db` (sin tocarla) y las
  tres tablas, y escribe `alimentos/verificacion.txt`. Después, `npm run
  alimentos` arma la base con lo verificado.
- **Las tablas se bajan solas** la primera vez, de su sitio oficial, a
  `.cache/fuentes/<tabla>/`, que no va al repo:
  - TACO:
    `https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/Taco-4a-Edicao.xlsx`;
  - CoFID:
    `https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx`;
  - Ciqual: los XML `alim`, `compo`, `sources` y `alim_grp` de
    doi:10.57745/RDMHWY, en recherche.data.gouv.fr (archivos 666252, 666249,
    666248 y 666250).
- **Para una versión nueva:**
  - se cambia la dirección en su lector;
  - se borra su carpeta, o se pasa el archivo con `--taco`, `--cofid` o
    `--ciqual`.
- **Cada lector se corre solo:** por ejemplo, `node herramientas/fuentes/taco.mjs
  <xlsx>` lista sus alimentos por 100 g.

## Cómo quedó (23/10/2026)

Son 1.643 curados:
- 400 ok;
- 792 revisados;
- 19 para revisar;
- 432 sin par.

Se compararon 589 con Ciqual, 296 con TACO y 326 con CoFID.

## PENDIENTE: los 19 para revisar

Son pares de USDA mal elegidos o dudosos. Se corrigen en `alimentos/*.txt`. Si
se decide que el valor está bien, se escribe el motivo en `pares.txt`.

| Curado | Hoy | Propuesta |
|---|---|---|
| Hígado de pollo | fndds:Liver, chicken (enharinado y con sal) | sr:Chicken, liver, all classes, cooked, pan-fried |
| Milanesa de pollo | fndds:Chicken fillet, breaded (un formado: 14,6 g de proteína) | fndds:Chicken breast, fried, coated, prepared skinless, coating eaten, from raw |
| Asado de tira | sr:Beef, rib, shortribs, choice, braised (471 kcal) | un corte de costilla a la parrilla, o calcularlo del crudo |
| Ñoquis | fndds:Gnocchi, potato (con manteca o salsa: 17 g de carbohidratos) | una receta: papa, harina y huevo, hervidos (TACO da 36,8 g) |
| Corvina | fndds:Fish, croaker (empanada y frita) | la receta de «Corvina a la plancha», o calcularla de sr:Fish, croaker, Atlantic, raw |
| Papas fritas | fndds:Potato, french fries, NFS (23 g de carbohidratos) | fndds:Potato, french fries, restaurant (las tres tablas dan 34 a 36 g) |
| Papas fritas a la provenzal | una receta con esas mismas papas | rehacerla con las de arriba |
| Queso parmesano | fndds:Cheese, Parmesan, hard (los valores del rallado seco) | sr:Cheese, parmesan, hard |
| Chucrut | fndds:Sauerkraut (con grasa agregada) | sr:Sauerkraut, canned, solids and liquids |
| Batata al horno | fndds:Sweet potato, baked, NS as to fat (con grasa) | sr:Sweet potato, cooked, baked in skin, flesh, without salt |
| Vinagreta | fndds:Italian dressing, made with vinegar and oil (industrial, con agua y azúcar) | sr:Salad dressing, home recipe, vinegar and oil |
| Yuca cocida | fndds:Cassava, cooked (191 kcal, con grasa) | calcularla de sr:Cassava, raw, hervida: las tres tablas dan de 125 a 135 kcal |
| Puerro | sr:Leeks, raw (61 kcal, y hervido 31) | dudoso en USDA: TACO, Ciqual y CoFID dan de 23 a 32 kcal |
| Sushi, Sushi de salmón y Nigiri de salmón | FNDDS (de 94 a 107 kcal: el arroz calculado con mucha agua) | dudoso: CoFID y Ciqual, analizados, dan de 150 a 170 kcal |
| Queso crema y Queso crema light | los de Estados Unidos (33 % y 23 % de grasa) | depende del país: los europeos tienen de 20 a 24 % y de 7 a 11 %; falta decidir cuál es el de Moss |
| Salsa tártara | fndds:Tartar sauce (211 kcal: una tártara liviana) | dudoso: Ciqual da 500 kcal y CoFID 299, a base de mayonesa |

Hay más para mirar, aunque no están en «revisar»:
- **Carne seca:** va con fndds:Beef jerky, el snack de Estados Unidos, con azúcar
  (11 g de carbohidratos). La carne seca de la región (charqui, machaca) es
  salada y no está en USDA.
- **Stevia:** va con 0 kcal y 100 g de carbohidratos, que son el relleno de
  dextrosa o eritritol. Ciqual da lo mismo, pero suma 1 g de carbohidratos por
  sobre.
- **Pimiento rojo salteado:** usa sr «sauteed», con 12,8 g de grasa. Los demás
  salteados usan FNDDS «fat added», con unos 3 g.
