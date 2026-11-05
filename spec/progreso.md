# Progreso y el cuerpo

Lo que muestra la sección Progreso (cambio 9 de la
[especificación](especificacion.md), 22/10/2026) y cómo se calcula. Las cuentas
están en `src/dominio/progreso.ts`, `src/dominio/cuerpo.ts` y
`src/dominio/control.ts`, con sus tests. La galería las usa tal cual.

## Más simple, con el plan arriba (2/11/2026, para aprobar en la galería)

Lo pediste: «hay mucho gráfico, mucho visual, muchas palabras; una persona normal no
quiere ver todo esto», con el plan al principio, el control más arriba y más chico, y la
grasa corporal en el medio invitando a medirla. La app sigue como abajo hasta que lo
apruebes. De arriba abajo:

1. **Arriba a la derecha, Ascent:** la sección queda arriba de Progreso y se sube como a
   tu universo ([`ascent.md`](ascent.md), «Ascent arriba de Progreso»).
2. **El próximo control, en una línea:** «Control el lunes · en 5 días», lo que tiene
   («2 de 4 días con comida · pesada ✓») y su estado. Tocándolo se abre qué pasa ese día y
   el día de la semana. **En Inicio**, debajo de la luna, desde dos días antes.
3. **Tu plan** (`planPorEtapas`, con tests): «Bajar a 71 kg para el lunes 4 de enero» y
   una línea de puntos: desde que empezaste (lo hecho, en oro), hoy, un hito cada cuatro
   semanas (o tres repartidos si es más largo), la meta y, después, el mantenimiento.
   - **Cómo vienes:** el ritmo medido, con su margen, contra el del plan: al ritmo (a un
     cuarto del plan, o a 100 g por semana con un plan lento), más rápido, más lento o al
     revés, con la fecha a la que llegarías a tu ritmo. El control de cada semana ajusta
     las calorías para seguir el plan: la fecha del plan queda y lo que se mueve es a
     dónde llegarías.
   - **Para aprobar (5/11/2026, D1 del [estudio](estudio/progreso.md)):** «Vas al ritmo del
     plan: −0,41 kg por semana, entre −0,33 y −0,48 (el plan, −0,37)»; más rápido o más
     lento solo si todo el margen queda afuera del plan con su cuarto, y la fecha a tu
     ritmo como un rango («entre el 10 dic y el 2 ene») o un mes («en enero») si las dos
     puntas caen en el mismo. Las primeras semanas, «Todavía no se sabe» (con lo que hay,
     el margen); con menos de tres semanas con pesadas, «Faltan datos». «Cómo se calcula»
     dice de dónde sale y que el margen es el de un 80 %. El plan sale del peso de hoy sin
     el atraso de la tendencia (unos 0,5 kg menos que ella para la persona de ejemplo), así
     que su fecha queda una semana antes. Escenarios `progreso` y `plazo`.
   - **Al llegar:** dos semanas en mantenimiento, comiendo lo que se gasta, para que el
     peso se asiente. Después, lo que dijiste en el cuestionario («Cuando llegues, ¿qué
     sigue?»): quedarte ahí o ganar músculo (subir despacio); sin decidirlo, lo eliges al
     llegar.
   - **«Cambiar el plan»** despliega ahí mismo el objetivo, el peso meta, el ritmo y el
     plazo (D35) y las metas de hoy.
4. **El peso**, como abajo.
5. **La grasa corporal**, en el medio. Sin medidas, una invitación: «Mide tu grasa
   corporal · Con una cinta, en dos minutos: la cintura y el cuello (y la cadera). Con una
   vez alcanza; si quieres, cada mes», con «Medir» y que es una estimación que puede errar
   unos 4 puntos o más, y que para ver cómo cambia el cuerpo, mejor la cintura.
6. **«Más datos»**, plegado: semana a semana (con nombres más claros: «Cuánto cambió tu
   peso» y «Cuánto comiste»), las medidas y el gasto con el balance.

Pendiente de decidir: si un plan de más de 16 semanas se parte con pausas de
mantenimiento (MATADOR, 2018); hoy no se parte.

## Qué tiene

De arriba abajo:

1. **El objetivo:**
   - «Bajar a 71 kg», si vas en camino y en qué fecha llegarías;
   - el camino desde el peso con que empezaste hasta la meta;
   - el ritmo medido contra el del plan.
2. **El peso:**
   - la tendencia de hoy, con el cambio en 7 y en 30 días;
   - las últimas 8 semanas: las pesadas (puntos), la tendencia (la línea) y la meta (punteada).

   «Registrar» abre el peso del «+».
3. **Las medidas:** la última de cada sitio, con su cambio contra un mes antes,
   y la cintura sobre la altura. «Medir» abre las medidas del «+».
4. **La grasa corporal:** el rango, el aviso, el rango de cada vez que se midió y
   cómo se estima.
5. **El gasto estimado y el balance:**
   - el gasto del último control;
   - lo comido contra el gasto en los últimos 7 días;
   - cómo se calcula el control.
6. **La estrategia:**
   - el objetivo con su ritmo y el peso meta;
   - las metas de hoy: quién las pone, cómo se reparten los macros y repartir la semana (lo que estaba en Ajustes);
   - el próximo control: cuándo es y si la semana ya tiene lo que necesita;
   - el día de la semana del control, que se elige.

## El progreso al objetivo (`progresoAlObjetivo`)

Desde el 5/11/2026, con los arreglos del [estudio](estudio/progreso.md) (A1 a A6): con el
ruido de verdad del peso, el ritmo de tres semanas sin margen decía «al ritmo» a quien iba
justo al ritmo del plan solo un tercio de las veces, y «cambiando» a la mitad de quienes
mantenían.

- **El ritmo, con su margen** (`ritmoConRango`): de cada bloque de siete días que termina
  hoy, el promedio de sus pesadas, en el día promedio de ellas; la recta por esos
  promedios (las últimas seis semanas) da los kilos por semana, y su margen es el de un
  80 % con la t de Student (con un desvío de al menos 0,2 kg). Con menos de tres semanas
  con pesadas, no hay ritmo. Con el ruido simulado, el margen cubrió el ritmo de verdad
  unas 80 veces de cada 100, y mide ±0,11 kg por semana a las seis semanas pesándose a
  diario (±0,17 una vez por semana).
- **El peso de hoy, sin el atraso** (`nivelDeHoy`): la tendencia atrasa nueve días (medio
  kilo con 0,4 kg por semana). Lo que falta, si llegaste y la fecha salen del peso de la
  recta en el día de hoy; con menos de tres semanas, de la tendencia más lo que atrasa con
  la pendiente de las pesadas. El peso que se muestra sigue siendo el de la tendencia.
- **Los estados:** con el avance hacia la meta y su margen, y el plan `p`:

  | Estado | Cuándo |
  |---|---|
  | Llegaste | a medio kilo de la meta o pasándola |
  | Todavía no se sabe | el medio margen pasa de 0,25 kg por semana o del plan |
  | Al revés | todo el margen va para el otro lado |
  | Sin cambio claro | el margen incluye el cero |
  | Más despacio | todo el margen, debajo de la mitad del plan |
  | En camino | lo demás |
  | Estable o cambiando | manteniendo: cambiando solo si todo el margen queda afuera de ±150 g por semana |
  | Sin peso meta / faltan datos | sin meta elegida, o sin tres semanas con pesadas |

- **La fecha, como un rango** (`fechasDeLlegada`): lo que falta con el avance más rápido
  del margen y con el más lento; sin fecha si el lento no pasa de 50 g por semana o si
  pasa de dos años. La app muestra todavía una sola fecha, la del medio, y solo cuando hay
  rango; cómo se muestra el rango se aprueba en la galería.
- **Cuánto del camino:** desde la tendencia cuando se fijó el objetivo.

## La tendencia y las pesadas (`control.ts`)

- **No inventa días:** entre dos pesadas, en línea recta; después de la última no se copia,
  sigue con su pendiente hasta una semana. Pesándose solo los lunes, copiar la última hasta
  el domingo achataba el ritmo un 21 % y el gasto medido, 125 kcal.
- **Las pesadas raras** (`pesadasQueCuentan`): la que se aparta de la recta de las seis
  semanas anteriores más de 1,5 kg o del 2 % del peso (unas tres veces lo que varía de un
  día a otro) entra con un cuarto de su diferencia, hasta que la siguiente la confirme
  (apartada para el mismo lado en más de la mitad): entonces las dos cuentan enteras. Con
  menos de tres pesadas a una semana, no se revisa.
- **El peso de Salud es el primero del día de Moss** (D34: por la mañana, en ayunas; lo de
  antes de la hora de corte es del día anterior). Si ya se guardó uno de Salud y Salud
  trae otro más temprano, lo reemplaza; uno a mano o de Ascent, no.

## El balance (`balance`)

Lo comido cada día menos el gasto estimado del último control. Los días sin
registrar no cuentan: no son ceros.

## Las medidas del cuerpo

- **Los sitios:** cintura, cuello, cadera, brazo, pecho y muslo, en centímetros.
  - Las tres primeras entran en la estimación.
  - Las otras sirven para seguir el progreso: la grasa estimada no ve el músculo que se gana.
- **Se guardan por día** (`Medidas`). Si se mide dos veces el mismo día, queda la
  última. No hace falta medir todo junto: cada sitio usa su última medida
  (`ultimasMedidas`).
- **Rangos posibles** (`medidaValida`), para no guardar un error de tipeo.
- **El mini tutorial:** la figura marca dónde va la cinta en la medida que se
  escribe, con cómo tomarla, y «Cómo medir» despliega los consejos de siempre.
  Salen de la guía de la Marina (Navy Guide 4) y de Barrios y otros (2016):
  - una cinta que no se estira, sobre la piel;
  - de pie, con los pies juntos y los brazos al costado;
  - la cinta paralela al piso, firme sin hundir la piel;
  - al final de una exhalación normal, sin meter la panza;
  - a la misma hora, antes de comer;
  - dos veces; si difieren más de 1 cm, una tercera.

  Dónde va cada una:
  - **Cintura:** los hombres, a la altura del ombligo; las mujeres, en la parte más angosta.
  - **Cuello:** debajo de la nuez.
  - **Cadera:** lo más ancho de la cola, de costado.
  - **Brazo:** a mitad entre el hombro y el codo.
  - **Pecho:** a mitad del esternón.
  - **Muslo:** a mitad entre la ingle y la rodilla.

## La grasa corporal: un rango chico (`rangoDeGrasa`)

- **La estimación** es la del método de la Marina de EE. UU. (Hodgdon y Beckett,
  1984), en centímetros, con la fórmula de Siri:
  - hombres: 495 / (1,0324 − 0,19077 · log₁₀(cintura − cuello) + 0,15456 · log₁₀(altura)) − 450;
  - mujeres: 495 / (1,29579 − 0,35004 · log₁₀(cintura + cadera − cuello) + 0,22100 · log₁₀(altura)) − 450.

  Da lo mismo, con 0,3 puntos de diferencia, que la forma en pulgadas del
  Departamento de Defensa.
- **El rango.** Lo pediste chico, como «16 a 19 %». Es la estimación más y menos
  lo que cambia si la cinta se corre:
  - 1 cm en la cintura y en la cadera;
  - medio centímetro en el cuello.

  Se suman en cuadratura, con un mínimo de un punto para cada lado, y se
  redondea hacia afuera a puntos enteros. Queda de 2 a 4 puntos.
- **En las puntas se abre.** Con menos de 10 % o más de 30 % en hombres (18 y 40
  en mujeres) el método erra más: un punto más para cada lado.
- **Lo imposible no se muestra.** Fuera de 2 a 60 % (8 a 65 en mujeres), alguna
  medida está mal tomada.
- **El aviso dice lo que el rango no:**
  - contra un estudio de laboratorio (DEXA), el método erra unos 4 puntos o más. En
    el estudio original el error estándar fue de 3,5 en hombres y 3,6 en mujeres;
    contra DEXA, en reclutas del ejército, 3,4 y 4,1 (Foulis y otros, 2023), y en
    soldados, un error cuadrático de 5,9 y 4,4 (Taylor y otros, 2024);
  - en pocas semanas la cinta puede no notar un cambio de grasa, sobre todo en
    mujeres (Foulis, 2023: DXA vio −4 puntos y la cinta, 0): la cintura lo muestra
    mejor;
  - es menos preciso con muy poca grasa, mucho músculo o mucha grasa;
  - no sirve en el embarazo ni antes de los 18.
- **Medidas de fechas muy distintas:** con más de 60 días entre las medidas de la
  fórmula, `rangoDeGrasa` lo dice (`fechasDistintas`); todavía no se muestra.
- **Qué no se dice nunca:** «preciso», «mide», «como un DEXA», cambios de menos de
  3 puntos, ni ningún diagnóstico. Apple (guía 1.4.1) pide explicar el método:
  está en «Cómo se calcula».
- **Lo que sugiere la investigación y no hice** (D18):
  - un mínimo de ±2 puntos (4 de ancho);
  - cruzar con la Masa Grasa Relativa (RFM, Woolcott y Bergman, 2018: 64 − 20 ·
    altura / cintura, más 12 en mujeres).

  Con la persona de la galería, la Marina da 16,8 % y la RFM 22,4 %: cruzarlas
  abriría el rango a 7 puntos.
- **La cintura sobre la altura** (`cinturaAltura`, `claseDeCintura`). La guía NICE
  (NG246) pide menos de 0,5; de 0,5 a 0,59 el riesgo sube y desde 0,6 es alto. Se
  muestra el número con esa referencia, sin más, y solo con un IMC menor de 35: desde
  ahí NICE no la usa (1.9.14).

## La estrategia y el control

- **Dónde se guarda:** el objetivo, el ritmo, cómo se reparten los macros, el peso
  meta y el día del control van en el perfil (`Perfil`: `estilo`, `pesoMeta`,
  `diaDelControl`) y se sincronizan con él.
- **Cambiar el objetivo, el ritmo o el reparto** fija metas nuevas desde hoy con el
  gasto medido (motivo «objetivo»). Con las metas a mano, quedan las que había
  (`ponerEstrategia` en el almacén).
- **El día del control se elige.** Sin elegir, es el día de la semana de la
  primera meta (`ultimoDiaDeControl`). Si ese día no se abre Moss, corre la
  próxima vez.
- **El próximo control** (`estadoDelControl`):
  - cuándo es: hoy, si toca hoy y todavía no corrió;
  - cuántos días con comida y cuántas pesadas tiene ya la semana que va a mirar (los siete días antes del control), contra lo mínimo (4 y 1);
  - para medir, además, dos pesadas del tramo a una semana o más una de otra: el
    control mide el cambio del peso con la recta por las pesadas de verdad, y con una
    sola tomaría lo comido por el gasto (el [estudio de las metas](estudio/metas.md), A1).

  Se muestra «con datos», «en curso» (todavía puede llegar) o «faltan datos».
- **Bajando, la meta nunca pide más de 1 kg por semana ni 1.000 kcal de déficit por
  día**, tampoco con una fecha: la fecha que pide más que lo exigente se corre a la que
  da ese borde (`pctDelPlan`).
- **Los hitos**, de a medio kilo: más fino sería precisión falsa.
- **El piso al final** (`pisoAlFinal`): bajando, el gasto baja unas 22 kcal por día por
  cada kilo (Hall y Chow, 2011). Si hoy el ritmo entra arriba del piso pero al llegar no,
  se avisa: «Cerca del final comerías menos de 1.200 kcal; Moss no baja de ahí y el
  último tramo va más lento».

## Datos

- **`moss.perfiles`** suma `peso_meta`, `dia_del_control` y `estilo`, en
  `supabase/moss/0003_progreso.sql`.
- **`moss.medidas`:**
  - una fila por día, con cada sitio (o null);
  - `actualizado`, `recibido` y la marca de borrado;
  - gana la más nueva, como lo demás.

  En el teléfono es una colección más del almacén, con su tabla en SQLite (migración 3).
