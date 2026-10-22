# Progreso y el cuerpo

Lo que muestra la sección Progreso (cambio 9 de la
[especificación](especificacion.md), 22/10/2026) y cómo se calcula. Las cuentas
están en `src/dominio/progreso.ts`, `src/dominio/cuerpo.ts` y
`src/dominio/control.ts`, con sus tests. La galería las usa tal cual.

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

- **El ritmo** es lo que se movió la tendencia en las últimas tres semanas, en
  kilos por semana. Con menos de dos semanas de tendencia no se mide.
- **Los estados:**

  | Estado | Cuándo |
  |---|---|
  | Llegaste | a medio kilo de la meta o pasándola |
  | En camino | al menos la mitad del ritmo del plan, para el lado de la meta |
  | Más despacio | para el lado de la meta, pero menos de la mitad del plan |
  | Sin cambios | menos de 50 g por semana |
  | Al revés | para el otro lado |
  | Estable o cambiando | manteniendo: menos de 150 g por semana, o más |
  | Sin peso meta / faltan datos | sin meta elegida, o sin dos semanas de tendencia |

- **La fecha:** lo que falta dividido por el ritmo medido, desde hoy. Más allá de
  dos años no se da: a ese ritmo no es una fecha.
- **Cuánto del camino:** desde la tendencia cuando se fijó el objetivo.

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
  - contra un estudio de laboratorio (DEXA), el método erra 3 o 4 puntos. En el
    estudio original el error estándar fue de 3,5 en hombres y 3,6 en mujeres;
    contra DEXA, en reclutas del ejército, 3,4 y 4,1 (Foulis y otros, 2023);
  - es menos preciso con muy poca grasa, mucho músculo o mucha grasa;
  - no sirve en el embarazo ni antes de los 18.
- **Qué no se dice nunca:** «preciso», «mide», «como un DEXA», cambios de menos de
  3 puntos, ni ningún diagnóstico. Apple (guía 1.4.1) pide explicar el método:
  está en «Cómo se calcula».
- **Lo que sugiere la investigación y no hice** (D18):
  - un mínimo de ±2 puntos (4 de ancho);
  - cruzar con la Masa Grasa Relativa (RFM, Woolcott y Bergman, 2018: 64 − 20 ·
    altura / cintura, más 12 en mujeres).

  Con la persona de la galería, la Marina da 16,8 % y la RFM 22,4 %: cruzarlas
  abriría el rango a 7 puntos.
- **La cintura sobre la altura** (`cinturaAltura`). La guía NICE (NG246) pide
  menos de 0,5; de 0,5 a 0,59 el riesgo sube y desde 0,6 es alto. Se muestra el
  número con esa referencia, sin más.

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
  - cuántos días con comida y cuántas pesadas tiene ya la semana que va a mirar (los siete días antes del control), contra lo mínimo (4 y 1).

  Se muestra «con datos», «en curso» (todavía puede llegar) o «faltan datos».

## Datos

- **`moss.perfiles`** suma `peso_meta`, `dia_del_control` y `estilo`, en
  `supabase/moss/0003_progreso.sql`.
- **`moss.medidas`:**
  - una fila por día, con cada sitio (o null);
  - `actualizado`, `recibido` y la marca de borrado;
  - gana la más nueva, como lo demás.

  En el teléfono es una colección más del almacén, con su tabla en SQLite (migración 3).
