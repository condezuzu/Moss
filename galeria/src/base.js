// En qué se basa Moss, rehecho para aprobar (26/11/2026). Lo pediste: que se vea profesional; hoy son párrafos
// larguísimos que parecen copiados y pegados. Lo que hacen los que se ven serios (Cochrane, Examine, WHOOP, Apple,
// MacroFactor), acá:
// - la respuesta primero, en dos frases, con la fecha de revisión y cuántas fuentes;
// - capas: la respuesta, cómo se ordena lo que llega (el dibujo de antes, más compacto) y cada área plegada;
// - cada área es la pregunta que te harías, con su respuesta y su sello; al abrirla, cómo lo usa Moss (cada punto con
//   su sello y sus números de fuente), lo que no hace y las fuentes, plegadas y numeradas: quién, el año, el tipo de
//   estudio, cuántas personas y el enlace;
// - la confianza dicha siempre igual, con los cuatro sellos del informe del vínculo con Ascent: sólido, razonable,
//   estimación y decisión de Moss (esta separa lo que decide la app de lo que dice un estudio);
// - cada área con lo que tiene para decir: no todas llevan lo mismo ni el mismo largo.
// El contenido sale de la sección 5 de cada estudio de spec/estudio/, de sus tablas de veredictos y de sus fuentes; el
// de Ascent, de vinculo-ascent.md y de su informe. Ningún número nuevo. En la app iría en src/secciones/perfil/Base.tsx
// con las claves de `perfil.baseInfo` de acá, que se suman a las de src/textos hasta que se apruebe (las de antes,
// `texto` y `fuentes` de cada área, se irían).

const BaseNueva = (() => {
  const SELLOS = ['solido', 'razonable', 'estimacion', 'decision'];
  const TEXTOS_NUEVOS = {
    es: { perfil: { baseInfo: {
      respuesta: 'Moss calcula con fórmulas publicadas y guías de sociedades científicas, y lo corrige con lo que anotas y mide tu reloj. Cada número tiene su margen: aquí está cuánto confiar en cada uno.',
      revisado: 'Revisado el 26 de noviembre de 2026',
      cuantas: '{areas} áreas · {fuentes} fuentes',
      sellosTitulo: 'Cuánto confiar',
      sellos: {
        solido: { nombre: 'Sólido', texto: 'Lo respaldan metaanálisis o guías.' },
        razonable: { nombre: 'Razonable', texto: 'La dirección está probada; el número es aproximado.' },
        estimacion: { nombre: 'Estimación', texto: 'Orientativo, con un error conocido.' },
        decision: { nombre: 'Decisión de Moss', texto: 'Un criterio práctico, sin un estudio detrás.' },
      },
      preguntasTitulo: 'Lo que te puedes preguntar',
      comoUsa: 'Cómo lo usa Moss',
      noHaceArea: 'Lo que no hace',
      citasN: { uno: '1 fuente', otros: '{n} fuentes' },
      areas: {
        metas: {
          pregunta: '¿De dónde sale mi meta de calorías?',
          respuesta: 'De una fórmula para empezar y, después, de tu propio peso: cada semana Moss compara lo que anotas con la tendencia de tu peso y corrige.',
          sello: 'solido',
          puntos: [
            { sello: 'estimacion', texto: 'Para empezar, la fórmula de Mifflin-St Jeor, la que mejor acierta en adultos, más tu día y tu entrenamiento según las Academias Nacionales de EE. UU. Puede errar un 10 % o más.', refs: [1, 2] },
            { sello: 'solido', texto: 'Cada semana, lo que anotas contra la tendencia de tu peso. Medirlo así se comprobó contra el laboratorio; con 3 o 4 semanas de pesadas frecuentes, la cifra se vuelve firme.', refs: [3] },
            { sello: 'solido', texto: 'La proteína, de 1,6 a 2,2 g por kilo si entrenas, y nunca menos de 1,2.', refs: [4] },
          ],
          noHace: [
            'No te da un gasto exacto: siempre «unas», con su margen.',
            'No suma a tu meta las calorías activas del reloj.',
            'Con embarazo, lactancia o una condición médica, no te pone en déficit.',
          ],
          citas: [
            { quien: 'Mifflin y otros', anio: '1990', que: 'La ecuación del gasto en reposo · 498 personas', enlace: 'https://doi.org/10.1093/ajcn/51.2.241' },
            { quien: 'Academias Nacionales de EE. UU.', anio: '2023', que: 'Ingestas de referencia de energía · 8.600 mediciones con agua doblemente marcada', enlace: 'https://doi.org/10.17226/26818' },
            { quien: 'Sanghvi y otros', anio: '2015', que: 'Validación contra el laboratorio · 140 personas durante 2 años', enlace: 'https://doi.org/10.3945/ajcn.115.111070' },
            { quien: 'Morton y otros', anio: '2018', que: 'Metaanálisis · 49 ensayos, 1.863 personas', enlace: 'https://doi.org/10.1136/bjsports-2017-097608' },
          ],
        },
        progreso: {
          pregunta: '¿Por qué mi peso sube y baja, y qué mira Moss?',
          respuesta: 'Tu peso cambia de un día a otro por el agua, lo que comiste el día anterior y, en las mujeres, el ciclo. Moss mira la tendencia de tus pesadas y te da el ritmo con su margen.',
          sello: 'razonable',
          puntos: [
            { sello: 'razonable', texto: 'Tu ritmo, el de las últimas semanas y con un margen: con pocas semanas de datos todavía es incierto.', refs: [1] },
            { sello: 'solido', texto: 'Los ritmos que te propone no pasan del 1 % de tu peso por semana, lo que la investigación usa para bajar grasa cuidando el músculo.', refs: [2] },
            { sello: 'solido', texto: 'Nunca acepta un peso meta con un índice de masa corporal menor de 18,5, el límite de la OMS.', refs: [3] },
            { sello: 'estimacion', texto: 'La grasa con cinta usa la fórmula de la Marina de EE. UU.: puede diferir unos 4 puntos o más de un estudio de laboratorio.', refs: [4] },
            { sello: 'solido', texto: 'Para ver cómo cambia tu cuerpo, tu cintura: la guía NICE recomienda que mida menos de la mitad de tu altura.', refs: [5] },
          ],
          noHace: [
            'No te da una fecha exacta de llegada con menos de 4 a 6 semanas de pesadas.',
            'No presenta la grasa como una medida, ni compara dos estimaciones casi iguales.',
            'Con «sin déficit» (embarazo, lactancia), no baja tus calorías porque sube el peso.',
          ],
          citas: [
            { quien: 'Hall y Chow', anio: '2011', que: 'Modelo del balance de energía, validado con ensayos', enlace: 'https://doi.org/10.3945/ajcn.111.014399' },
            { quien: 'Helms y otros', anio: '2014', que: 'Revisión', enlace: 'https://doi.org/10.1186/1550-2783-11-20' },
            { quien: 'OMS', anio: '', que: 'Los cortes del índice de masa corporal', enlace: 'https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women' },
            { quien: 'Foulis y otros', anio: '2023', que: 'La cinta contra DXA · 1.407 personas', enlace: 'https://doi.org/10.3389/fphys.2023.1183836' },
            { quien: 'NICE', anio: '2025', que: 'Guía NG246', enlace: 'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity' },
          ],
        },
        sueno: {
          pregunta: '¿Cuánto debería dormir, y cuánto confiar en mi reloj?',
          respuesta: 'Moss sigue las guías: 7 horas o más en adultos, con los rangos de cada edad. De tu reloj usa lo que mejor mide: cuánto y cuándo dormiste.',
          sello: 'solido',
          puntos: [
            { sello: 'solido', texto: 'Lo que necesitas: 7 horas o más en adultos, los rangos de cada edad y qué cuenta como un sueño continuo.', refs: [1, 2, 3] },
            { sello: 'solido', texto: 'Con reloj o anillo, sobre todo cuánto y cuándo dormiste: detectan más del 90 % del sueño, pero se les escapa buena parte de los ratos despierto, y las etapas son bastante menos exactas.', refs: [4] },
            { sello: 'razonable', texto: 'La regularidad de tus horarios: en un estudio de 60.977 personas se asoció con la salud, a veces más que la duración.', refs: [5] },
            { sello: 'estimacion', texto: 'La deuda depende sobre todo de cuánto necesitas dormir, que cambia de una persona a otra. Sin reloj, Moss estima la noche con el teléfono y te pregunta para confirmarla.' },
            { sello: 'decision', texto: 'La calidad es una cuenta de Moss para ver tendencias, no una medida.' },
          ],
          noHace: [
            'No diagnostica ni sospecha trastornos del sueño.',
            'No te dice si tus etapas son buenas o malas: el reloj puede errar de 25 a 43 minutos en el sueño profundo.',
            'No trata la deuda como una cuenta exacta que se paga durmiendo de más.',
          ],
          citas: [
            { quien: 'AASM y SRS (Watson y otros)', anio: '2015', que: 'Consenso de 15 expertos sobre 5.314 artículos', enlace: 'https://doi.org/10.5665/sleep.4716' },
            { quien: 'National Sleep Foundation (Hirshkowitz y otros)', anio: '2015', que: 'Consenso de 18 expertos', enlace: 'https://doi.org/10.1016/j.sleh.2014.12.010' },
            { quien: 'National Sleep Foundation (Ohayon y otros)', anio: '2017', que: 'Consenso sobre 277 estudios', enlace: 'https://doi.org/10.1016/j.sleh.2016.11.006' },
            { quien: 'Schyvens y otros', anio: '2025', que: 'Seis relojes contra polisomnografía', enlace: 'https://doi.org/10.1093/sleepadvances/zpaf021' },
            { quien: 'Windred y otros', anio: '2024', que: 'Cohorte del UK Biobank · 60.977 personas, observacional', enlace: 'https://doi.org/10.1093/sleep/zsad253' },
          ],
        },
        momentos: {
          pregunta: '¿Por qué los avisos me dicen a qué hora dejar el café o bajar las luces?',
          respuesta: 'Cada hora sale de revisiones de estudios y consensos de expertos, contada desde tu hora de acostarte y tu entrenamiento. Es una guía aproximada: cada persona responde distinto.',
          sello: 'razonable',
          puntos: [
            { sello: 'razonable', texto: 'El café: cuántas horas antes de acostarte deja de quitarte sueño, según cuánto tomas.', refs: [1] },
            { sello: 'razonable', texto: 'Las luces: bajarlas antes de dormir, como recomienda un consenso de 18 expertos en luz y sueño.', refs: [2] },
            { sello: 'solido', texto: 'Comer antes de entrenar y proteína después: un metaanálisis para la fuerza y la postura del ACSM para la resistencia.', refs: [3, 4] },
          ],
          noHace: [
            'No te da una hora segura para el alcohol.',
            'No es exacto con el café: la cafeína tarda de 3 a 6 horas en bajar a la mitad, y hasta 8 en algunas personas.',
            'No trata el insomnio: si hace meses que duermes mal, lo que más ayuda es la terapia cognitivo-conductual; háblalo con un médico.',
          ],
          citas: [
            { quien: 'Gardiner y otros', anio: '2023', que: 'Metaanálisis · 24 estudios', enlace: 'https://doi.org/10.1016/j.smrv.2023.101764' },
            { quien: 'Brown y otros', anio: '2022', que: 'Consenso de 18 expertos', enlace: 'https://doi.org/10.1371/journal.pbio.3001571' },
            { quien: 'King y otros', anio: '2022', que: 'Metaanálisis · 21 estudios', enlace: 'https://doi.org/10.1007/s40279-022-01716-w' },
            { quien: 'ACSM, AND y Dietitians of Canada (Thomas y otros)', anio: '2016', que: 'Postura conjunta', enlace: 'https://doi.org/10.1016/j.jand.2015.12.006' },
          ],
        },
        ascent: {
          pregunta: '¿Qué tan exacto es lo de mi entrenamiento?',
          respuesta: 'Lo firme es el sueño y lo que se cuenta: tus series y la tendencia de tu fuerza. La fatiga de cada músculo es una estimación que puede errar un día.',
          sello: 'razonable',
          puntos: [
            { sello: 'solido', texto: 'Con 6 horas de sueño o menos, la fuerza máxima casi no cambia y las repeticiones bajan cerca de un 10 %: por eso, después de una noche corta, «sin ir al fallo».', refs: [1] },
            { sello: 'razonable', texto: 'Más series por semana dan más progreso, cada vez menos.', refs: [2] },
            { sello: 'razonable', texto: 'Tu fuerza cambia ~3 % de un día a otro sin motivo, y con años de entrenamiento se sube ~1 % por mes: por eso Moss mira 12 semanas con su margen, no una sesión suelta.', refs: [3, 4] },
            { sello: 'estimacion', texto: 'La fatiga de cada músculo, en días: ningún modelo está validado contra el rendimiento de una persona, y la recuperación varía mucho entre personas.', refs: [5, 6] },
            { sello: 'decision', texto: 'Sin un porcentaje de recuperación: los puntajes de relojes y anillos no están validados, así que ves tus datos.', refs: [7] },
          ],
          noHace: [
            'No te da un porcentaje de recuperación ni la probabilidad de una marca.',
            'No dice que una causa es segura: dice «puede influir».',
          ],
          citas: [
            { quien: 'Craven y otros', anio: '2022', que: 'Metaanálisis · 77 estudios, 959 personas', enlace: 'https://doi.org/10.1007/s40279-022-01706-y' },
            { quien: 'Pelland y otros', anio: '2026', que: 'Metaanálisis · 67 estudios, 2.058 personas', enlace: 'https://doi.org/10.1007/s40279-025-02344-w' },
            { quien: 'Grgic y otros', anio: '2020', que: 'Revisión · 32 estudios, 1.595 personas', enlace: 'https://doi.org/10.1186/s40798-020-00260-z' },
            { quien: 'Latella y otros', anio: '2020', que: '1.897 levantadores en 15 años', enlace: 'https://doi.org/10.1519/jsc.0000000000003657' },
            { quien: 'Hellard y otros', anio: '2006', que: 'El modelo de estado físico y fatiga, en nadadores de élite', enlace: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1974899/' },
            { quien: 'Sayers y Clarkson', anio: '2001', que: 'Quiénes tardan en recuperar la fuerza · 192 personas', enlace: 'https://pubmed.ncbi.nlm.nih.gov/11394240/' },
            { quien: 'Doherty y otros', anio: '2025', que: 'Los puntajes de relojes y anillos, evaluados', enlace: 'https://doi.org/10.1515/teb-2025-0001' },
          ],
        },
        cuidados: {
          pregunta: '¿Qué cambia si marco un cuidado de salud?',
          respuesta: 'Moss ajusta tus metas a las guías de cada condición y deja de proponerte lo que podría no convenirte, como comer menos o subir la proteína. No reemplaza a tu equipo de salud.',
          sello: 'razonable',
          puntos: [
            { sello: 'solido', texto: 'Las referencias: las de las Academias Nacionales de EE. UU. y el IOM para el embarazo y la lactancia, la Asociación Americana de Diabetes y KDIGO para los riñones.', refs: [1, 2, 3, 4] },
            { sello: 'solido', texto: 'Para los cálculos, el colesterol, la sal y el potasio, las guías europeas y las de la OMS.', refs: [5, 6, 7] },
            { sello: 'estimacion', texto: 'Los cambios son generales y aproximados: siempre puedes poner a mano las metas que te dé tu equipo de salud.' },
            { sello: 'decision', texto: 'Lo que marcas se guarda solo en este iPhone.' },
          ],
          noHace: [
            'No da dosis ni promete tratar, controlar o revertir nada.',
            'No pone el nombre de tu cuidado en avisos, widgets ni en la pantalla bloqueada.',
          ],
          citas: [
            { quien: 'Academias Nacionales de EE. UU.', anio: '2023', que: 'Ingestas de referencia de energía · guía', enlace: 'https://doi.org/10.17226/26818' },
            { quien: 'IOM y National Research Council', anio: '2009', que: 'El aumento de peso en el embarazo · guía', enlace: 'https://doi.org/10.17226/12584' },
            { quien: 'Asociación Americana de Diabetes', anio: '2026', que: 'Estándares de atención · guía', enlace: 'https://doi.org/10.2337/dc26-S005' },
            { quien: 'KDIGO', anio: '2024', que: 'La enfermedad renal crónica · guía', enlace: 'https://doi.org/10.1016/j.kint.2023.10.018' },
            { quien: 'Asociación Europea de Urología', anio: '2026', que: 'Los cálculos urinarios · guía', enlace: 'https://uroweb.org/guidelines/urolithiasis/chapter/metabolic-evaluation-and-recurrence-prevention' },
            { quien: 'ESC y EAS (Mach y otros)', anio: '2019', que: 'Los lípidos · guía', enlace: 'https://doi.org/10.1093/eurheartj/ehz455' },
            { quien: 'OMS', anio: '', que: 'Reducir la sal', enlace: 'https://www.who.int/news-room/fact-sheets/detail/sodium-reduction' },
          ],
        },
        fotos: {
          pregunta: '¿Por qué Moss no calcula mi comida con una foto?',
          respuesta: 'Porque una foto no ve cuánto pesa lo que hay en el plato ni lo que no se ve, como el aceite. Por eso eliges el alimento, escaneas el código o la etiqueta, o dices lo que comiste.',
          sello: 'solido',
          puntos: [
            { sello: 'solido', texto: 'En 52 fotos de platos pesados, tres IA de uso general erraron en promedio entre un 36 % y un 64 % de las calorías, y más en los platos grandes.', refs: [1] },
            { sello: 'solido', texto: 'Otra IA, entrenada con unos 5.000 platos, casi triplicó su error cuando también tuvo que adivinar la porción.', refs: [2] },
            { sello: 'razonable', texto: 'Tampoco lo de Moss es exacto: una etiqueta puede alejarse hasta un 20 % de lo real. Ese error baja pesando o eligiendo la porción y, si se repite parecido, el control de cada semana lo compensa con tu peso.', refs: [3, 4] },
          ],
          citas: [
            { quien: 'Fridolfsson y otros', anio: '2025', que: 'Validación · 52 fotos de platos pesados, 3 modelos', enlace: 'https://doi.org/10.1016/j.cdnut.2025.107556' },
            { quien: 'Thames y otros', anio: '2021', que: 'Nutrition5k · unos 5.000 platos pesados', enlace: 'https://arxiv.org/abs/2103.03375' },
            { quien: 'Mercosur (RDC 360)', anio: '2003', que: 'Lo que puede variar una etiqueta: ±20 %', enlace: 'https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2003/rdc0360_23_12_2003.html' },
            { quien: 'Comisión Europea', anio: '', que: 'Las tolerancias del etiquetado · guía', enlace: 'https://food.ec.europa.eu/system/files/2016-10/labelling_nutrition-vitamins_minerals-guidance_tolerances_1212_en.pdf' },
          ],
        },
      },
    } } },
    en: { perfil: { baseInfo: {
      respuesta: 'Moss works from published formulas and the guidelines of scientific societies, and corrects them with what you log and what your watch measures. Every number has its margin: here is how far to trust each one.',
      revisado: 'Reviewed on November 26, 2026',
      cuantas: '{areas} areas · {fuentes} sources',
      sellosTitulo: 'How far to trust it',
      sellos: {
        solido: { nombre: 'Solid', texto: 'Backed by meta-analyses or guidelines.' },
        razonable: { nombre: 'Reasonable', texto: 'The direction is proven; the number is approximate.' },
        estimacion: { nombre: 'Estimate', texto: 'A guide, with a known error.' },
        decision: { nombre: 'Moss’s call', texto: 'A practical rule, with no study behind it.' },
      },
      preguntasTitulo: 'What you might ask',
      comoUsa: 'How Moss uses it',
      noHaceArea: 'What it doesn’t do',
      citasN: { uno: '1 source', otros: '{n} sources' },
      areas: {
        metas: {
          pregunta: 'Where does my calorie goal come from?',
          respuesta: 'From a formula to start with and, after that, from your own weight: every week Moss compares what you log with your weight trend and corrects it.',
          sello: 'solido',
          puntos: [
            { sello: 'estimacion', texto: 'To start, the Mifflin-St Jeor equation, the most accurate one for adults, plus your daily activity and training following the US National Academies. It can be off by 10% or more.', refs: [1, 2] },
            { sello: 'solido', texto: 'Every week, what you log against your weight trend. Measuring it this way has been checked against the lab; after 3 or 4 weeks of frequent weigh-ins, the number becomes solid.', refs: [3] },
            { sello: 'solido', texto: 'Protein, 1.6 to 2.2 g per kg if you train, and never below 1.2.', refs: [4] },
          ],
          noHace: [
            'It doesn’t give you an exact burn: always “about”, with its margin.',
            'It doesn’t add your watch’s active calories to your goal.',
            'If you’re pregnant, breastfeeding or have a medical condition, it won’t put you in a deficit.',
          ],
          citas: [
            { quien: 'Mifflin et al.', anio: '1990', que: 'The resting energy equation · 498 people', enlace: 'https://doi.org/10.1093/ajcn/51.2.241' },
            { quien: 'US National Academies', anio: '2023', que: 'Dietary Reference Intakes for Energy · 8,600 doubly labeled water measurements', enlace: 'https://doi.org/10.17226/26818' },
            { quien: 'Sanghvi et al.', anio: '2015', que: 'Validated against the lab · 140 people over 2 years', enlace: 'https://doi.org/10.3945/ajcn.115.111070' },
            { quien: 'Morton et al.', anio: '2018', que: 'Meta-analysis · 49 trials, 1,863 people', enlace: 'https://doi.org/10.1136/bjsports-2017-097608' },
          ],
        },
        progreso: {
          pregunta: 'Why does my weight go up and down, and what does Moss look at?',
          respuesta: 'Your weight changes from day to day with water, what you ate the day before and, in women, the menstrual cycle. Moss looks at the trend of your weigh-ins and gives you your rate with its margin.',
          sello: 'razonable',
          puntos: [
            { sello: 'razonable', texto: 'Your rate, over the last few weeks and with a margin: with only a few weeks of data it’s still uncertain.', refs: [1] },
            { sello: 'solido', texto: 'The rates it suggests never go above 1% of your weight a week, what research uses to lose fat while protecting muscle.', refs: [2] },
            { sello: 'solido', texto: 'It never accepts a goal weight with a body mass index below 18.5, the WHO threshold.', refs: [3] },
            { sello: 'estimacion', texto: 'Body fat from a tape measure uses the U.S. Navy formula: it can differ by about 4 points or more from a lab scan.', refs: [4] },
            { sello: 'solido', texto: 'To see how your body is changing, your waist: the NICE guideline recommends keeping it under half your height.', refs: [5] },
          ],
          noHace: [
            'It doesn’t give you an exact arrival date with less than 4 to 6 weeks of weigh-ins.',
            'It doesn’t present body fat as a measurement, or compare two nearly equal estimates.',
            'With “no deficit” (pregnancy, breastfeeding), it doesn’t lower your calories because your weight goes up.',
          ],
          citas: [
            { quien: 'Hall and Chow', anio: '2011', que: 'An energy balance model, validated with trials', enlace: 'https://doi.org/10.3945/ajcn.111.014399' },
            { quien: 'Helms et al.', anio: '2014', que: 'Review', enlace: 'https://doi.org/10.1186/1550-2783-11-20' },
            { quien: 'WHO', anio: '', que: 'Body mass index cut-offs', enlace: 'https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women' },
            { quien: 'Foulis et al.', anio: '2023', que: 'Tape measure against DXA · 1,407 people', enlace: 'https://doi.org/10.3389/fphys.2023.1183836' },
            { quien: 'NICE', anio: '2025', que: 'Guideline NG246', enlace: 'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity' },
          ],
        },
        sueno: {
          pregunta: 'How much should I sleep, and how far can I trust my watch?',
          respuesta: 'Moss follows the guidelines: 7 hours or more for adults, with the ranges for each age. From your watch it uses what it measures best: how long and when you slept.',
          sello: 'solido',
          puntos: [
            { sello: 'solido', texto: 'What you need: 7 hours or more for adults, the ranges for each age and what counts as continuous sleep.', refs: [1, 2, 3] },
            { sello: 'solido', texto: 'With a watch or ring, mainly how long and when you slept: they detect over 90% of sleep, but miss a good part of the time awake, and sleep stages are much less accurate.', refs: [4] },
            { sello: 'razonable', texto: 'How regular your schedule is: in a study of 60,977 people it was linked to health, sometimes more than duration.', refs: [5] },
            { sello: 'estimacion', texto: 'Sleep debt depends above all on how much sleep you need, which varies from person to person. Without a watch, Moss estimates the night with your phone and asks you to confirm it.' },
            { sello: 'decision', texto: 'Quality is a Moss score for spotting trends, not a measurement.' },
          ],
          noHace: [
            'It doesn’t diagnose or suspect sleep disorders.',
            'It doesn’t tell you whether your stages are good or bad: watches can be off by 25 to 43 minutes in deep sleep.',
            'It doesn’t treat sleep debt as an exact balance you pay back by oversleeping.',
          ],
          citas: [
            { quien: 'AASM and SRS (Watson et al.)', anio: '2015', que: 'Consensus of 15 experts over 5,314 papers', enlace: 'https://doi.org/10.5665/sleep.4716' },
            { quien: 'National Sleep Foundation (Hirshkowitz et al.)', anio: '2015', que: 'Consensus of 18 experts', enlace: 'https://doi.org/10.1016/j.sleh.2014.12.010' },
            { quien: 'National Sleep Foundation (Ohayon et al.)', anio: '2017', que: 'Consensus over 277 studies', enlace: 'https://doi.org/10.1016/j.sleh.2016.11.006' },
            { quien: 'Schyvens et al.', anio: '2025', que: 'Six watches against polysomnography', enlace: 'https://doi.org/10.1093/sleepadvances/zpaf021' },
            { quien: 'Windred et al.', anio: '2024', que: 'UK Biobank cohort · 60,977 people, observational', enlace: 'https://doi.org/10.1093/sleep/zsad253' },
          ],
        },
        momentos: {
          pregunta: 'Why do the reminders tell me when to stop coffee or dim the lights?',
          respuesta: 'Each time comes from reviews of studies and expert consensus, counted from your bedtime and your workout. It’s an approximate guide: everyone responds differently.',
          sello: 'razonable',
          puntos: [
            { sello: 'razonable', texto: 'Coffee: how many hours before bed it stops costing you sleep, depending on how much you have.', refs: [1] },
            { sello: 'razonable', texto: 'Lights: dim them before bed, as a consensus of 18 light and sleep experts recommends.', refs: [2] },
            { sello: 'solido', texto: 'Eating before training and protein after: a meta-analysis for strength and the ACSM position for endurance.', refs: [3, 4] },
          ],
          noHace: [
            'It doesn’t give you a safe time for alcohol.',
            'It isn’t exact with coffee: caffeine takes 3 to 6 hours to drop by half, and up to 8 for some people.',
            'It doesn’t treat insomnia: if you’ve slept badly for months, cognitive behavioral therapy helps most; talk to a doctor.',
          ],
          citas: [
            { quien: 'Gardiner et al.', anio: '2023', que: 'Meta-analysis · 24 studies', enlace: 'https://doi.org/10.1016/j.smrv.2023.101764' },
            { quien: 'Brown et al.', anio: '2022', que: 'Consensus of 18 experts', enlace: 'https://doi.org/10.1371/journal.pbio.3001571' },
            { quien: 'King et al.', anio: '2022', que: 'Meta-analysis · 21 studies', enlace: 'https://doi.org/10.1007/s40279-022-01716-w' },
            { quien: 'ACSM, AND and Dietitians of Canada (Thomas et al.)', anio: '2016', que: 'Joint position', enlace: 'https://doi.org/10.1016/j.jand.2015.12.006' },
          ],
        },
        ascent: {
          pregunta: 'How accurate is what I see about my training?',
          respuesta: 'The firm part is sleep and what gets counted: your sets and your strength trend. Fatigue for each muscle is an estimate that can be off by a day.',
          sello: 'razonable',
          puntos: [
            { sello: 'solido', texto: 'With 6 hours of sleep or less, maximal strength barely changes and reps drop by about 10%: that’s why, after a short night, “stop short of failure”.', refs: [1] },
            { sello: 'razonable', texto: 'More sets a week bring more progress, a little less each time.', refs: [2] },
            { sello: 'razonable', texto: 'Your strength moves ~3% from day to day for no reason, and with years of training it goes up ~1% a month: that’s why Moss looks at 12 weeks with their margin, not a single session.', refs: [3, 4] },
            { sello: 'estimacion', texto: 'Fatigue for each muscle, in days: no model has been validated against one person’s performance, and recovery varies a lot between people.', refs: [5, 6] },
            { sello: 'decision', texto: 'No recovery percentage: watch and ring scores aren’t validated, so you see your data instead.', refs: [7] },
          ],
          noHace: [
            'It doesn’t give you a recovery percentage or the odds of a personal best.',
            'It doesn’t say a cause is certain: it says “may play a part”.',
          ],
          citas: [
            { quien: 'Craven et al.', anio: '2022', que: 'Meta-analysis · 77 studies, 959 people', enlace: 'https://doi.org/10.1007/s40279-022-01706-y' },
            { quien: 'Pelland et al.', anio: '2026', que: 'Meta-analysis · 67 studies, 2,058 people', enlace: 'https://doi.org/10.1007/s40279-025-02344-w' },
            { quien: 'Grgic et al.', anio: '2020', que: 'Review · 32 studies, 1,595 people', enlace: 'https://doi.org/10.1186/s40798-020-00260-z' },
            { quien: 'Latella et al.', anio: '2020', que: '1,897 lifters over 15 years', enlace: 'https://doi.org/10.1519/jsc.0000000000003657' },
            { quien: 'Hellard et al.', anio: '2006', que: 'The fitness-fatigue model, in elite swimmers', enlace: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1974899/' },
            { quien: 'Sayers and Clarkson', anio: '2001', que: 'Who takes longer to recover strength · 192 people', enlace: 'https://pubmed.ncbi.nlm.nih.gov/11394240/' },
            { quien: 'Doherty et al.', anio: '2025', que: 'Watch and ring scores, evaluated', enlace: 'https://doi.org/10.1515/teb-2025-0001' },
          ],
        },
        cuidados: {
          pregunta: 'What changes if I mark a health condition?',
          respuesta: 'Moss adjusts your goals to the guidelines for each condition and stops suggesting what might not suit you, like eating less or more protein. It doesn’t replace your care team.',
          sello: 'razonable',
          puntos: [
            { sello: 'solido', texto: 'The references: the US National Academies and the IOM for pregnancy and breastfeeding, the American Diabetes Association, and KDIGO for the kidneys.', refs: [1, 2, 3, 4] },
            { sello: 'solido', texto: 'For kidney stones, cholesterol, salt and potassium, the European guidelines and the WHO’s.', refs: [5, 6, 7] },
            { sello: 'estimacion', texto: 'The changes are general and approximate: you can always enter the goals your care team gives you.' },
            { sello: 'decision', texto: 'What you mark is stored only on this iPhone.' },
          ],
          noHace: [
            'It doesn’t give doses or promise to treat, control or reverse anything.',
            'It doesn’t show the name of your condition in reminders, widgets or on the lock screen.',
          ],
          citas: [
            { quien: 'US National Academies', anio: '2023', que: 'Dietary Reference Intakes for Energy · guideline', enlace: 'https://doi.org/10.17226/26818' },
            { quien: 'IOM and National Research Council', anio: '2009', que: 'Weight gain during pregnancy · guideline', enlace: 'https://doi.org/10.17226/12584' },
            { quien: 'American Diabetes Association', anio: '2026', que: 'Standards of Care · guideline', enlace: 'https://doi.org/10.2337/dc26-S005' },
            { quien: 'KDIGO', anio: '2024', que: 'Chronic kidney disease · guideline', enlace: 'https://doi.org/10.1016/j.kint.2023.10.018' },
            { quien: 'European Association of Urology', anio: '2026', que: 'Urinary stones · guideline', enlace: 'https://uroweb.org/guidelines/urolithiasis/chapter/metabolic-evaluation-and-recurrence-prevention' },
            { quien: 'ESC and EAS (Mach et al.)', anio: '2019', que: 'Lipids · guideline', enlace: 'https://doi.org/10.1093/eurheartj/ehz455' },
            { quien: 'WHO', anio: '', que: 'Salt reduction', enlace: 'https://www.who.int/news-room/fact-sheets/detail/sodium-reduction' },
          ],
        },
        fotos: {
          pregunta: 'Why doesn’t Moss work out my food from a photo?',
          respuesta: 'Because a photo can’t see how much the food on the plate weighs, or what’s hidden, like the oil. So you pick the food, scan the barcode or the label, or say what you ate.',
          sello: 'solido',
          puntos: [
            { sello: 'solido', texto: 'In 52 photos of weighed meals, three general-purpose AIs were off by 36% to 64% of the calories on average, and more on large plates.', refs: [1] },
            { sello: 'solido', texto: 'Another AI, trained on about 5,000 meals, nearly tripled its error when it also had to guess the portion.', refs: [2] },
            { sello: 'razonable', texto: 'What Moss does isn’t exact either: a label can be up to 20% off. That error shrinks when you weigh or pick the portion and, if it repeats, the weekly check-in makes up for it with your weight.', refs: [3, 4] },
          ],
          citas: [
            { quien: 'Fridolfsson et al.', anio: '2025', que: 'Validation · 52 photos of weighed meals, 3 models', enlace: 'https://doi.org/10.1016/j.cdnut.2025.107556' },
            { quien: 'Thames et al.', anio: '2021', que: 'Nutrition5k · about 5,000 weighed meals', enlace: 'https://arxiv.org/abs/2103.03375' },
            { quien: 'Mercosur (RDC 360)', anio: '2003', que: 'How far a label can vary: ±20%', enlace: 'https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2003/rdc0360_23_12_2003.html' },
            { quien: 'European Commission', anio: '', que: 'Labelling tolerances · guidance', enlace: 'https://food.ec.europa.eu/system/files/2016-10/labelling_nutrition-vitamins_minerals-guidance_tolerances_1212_en.pdf' },
          ],
        },
      },
    } } },
  };
  const completar = (destino, origen) => Object.entries(origen).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!destino[k] || typeof destino[k] !== 'object') destino[k] = {};
      completar(destino[k], v);
    } else if (destino[k] == null) destino[k] = v;
  });
  if (typeof TEXTOS !== 'undefined' && TEXTOS) ['es', 'en'].forEach((i) => { if (TEXTOS[i]) completar(TEXTOS[i], TEXTOS_NUEVOS[i]); });

  // Los cuatro sellos, con los cuadritos de Perfil: el oro para lo sólido, el azul para lo razonable, el rosa para lo
  // estimado y el gris para lo que decide Moss. Nada de verde.
  const CSS = `
.bn { display: grid; gap: 0; }
.bn-respuesta { margin: 6px 4px 0; font: 400 15.5px/1.44 var(--texto); color: var(--tinta); text-wrap: pretty; }
.bn-revisado { margin: 10px 4px 0; font: 400 12px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); }
.bn-etq { margin: 24px 4px 8px; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(239, 230, 207, 0.55); }
.bn-sello { display: inline-block; padding: 3px 7px 3px; border-radius: 999px; font: 500 10.5px/1.15 var(--texto); letter-spacing: 0.02em; white-space: nowrap; vertical-align: 1px; }
.bn-sello.solido { color: #f2d98e; background: rgba(232, 196, 106, 0.14); }
.bn-sello.razonable { color: #b5ccf8; background: rgba(116, 150, 232, 0.17); }
.bn-sello.estimacion { color: #f3bcae; background: rgba(232, 150, 136, 0.15); }
.bn-sello.decision { color: rgba(239, 230, 207, 0.78); background: rgba(239, 230, 207, 0.08); }
/* Cuánto confiar: los cuatro, en una tabla chica. */
.bn-sellos { margin: 0; padding: 4px 14px; display: grid; border-radius: 14px; border: 1px solid rgba(239, 230, 207, 0.1); background: rgba(8, 12, 26, 0.5); list-style: none; }
.bn-sellos li { display: grid; grid-template-columns: 112px minmax(0, 1fr); align-items: baseline; gap: 10px; padding: 8px 0; font: 400 12.5px/1.35 var(--texto); color: rgba(239, 230, 207, 0.72); }
.bn-sellos li + li { border-top: 1px solid rgba(239, 230, 207, 0.06); }
.bn-sellos .bn-sello { justify-self: start; }
/* Cómo se ordena lo que llega: el dibujo de antes, más bajo, y las reglas en cuatro líneas. */
.bn-flujo { display: grid; grid-template-columns: minmax(0, 1fr) 12px minmax(0, 1fr) 12px minmax(0, 1fr); align-items: start; gap: 3px; padding: 12px 10px 10px; border-radius: 14px 14px 0 0; border: 1px solid rgba(239, 230, 207, 0.1); border-bottom: 0; background: rgba(8, 12, 26, 0.5); }
.bn-flujo-col { display: grid; gap: 4px; align-content: center; }
.bn-flujo-etq { font: 400 9px/1 var(--texto); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(239, 230, 207, 0.5); text-align: center; margin-bottom: 1px; }
.bn-flujo-item { display: block; padding: 5px 4px; border-radius: 8px; border: 1px solid rgba(239, 230, 207, 0.1); background: rgba(239, 230, 207, 0.035); font: 400 10.5px/1.2 var(--texto); color: var(--tinta); text-align: center; }
.bn-flujo-col.moss .bn-flujo-item { border-color: rgba(232, 196, 106, 0.36); background: rgba(232, 196, 106, 0.06); }
.bn-flujo-flecha { align-self: center; display: grid; place-items: center; color: rgba(239, 230, 207, 0.38); }
.bn-flujo-flecha svg { width: 11px; height: 11px; }
.bn-reglas { margin: 0; padding: 4px 14px 6px; display: grid; border-radius: 0 0 14px 14px; border: 1px solid rgba(239, 230, 207, 0.1); border-top: 1px solid rgba(239, 230, 207, 0.06); background: rgba(8, 12, 26, 0.5); list-style: none; }
.bn-reglas li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; padding: 6px 0; font: 400 12.5px/1.38 var(--texto); color: rgba(239, 230, 207, 0.78); }
.bn-reglas li svg { width: 13px; height: 13px; margin-top: 2px; color: rgba(232, 196, 106, 0.7); }
/* Cada área: la pregunta, la respuesta y su sello; al abrirla, cómo lo usa Moss, lo que no hace y las fuentes. */
.bn-areas { display: grid; gap: 8px; }
.bn-area { border-radius: 16px; border: 1px solid rgba(239, 230, 207, 0.1); background: rgba(8, 12, 26, 0.5); transition: border-color 0.3s, background-color 0.3s; }
.bn-area.abierta { border-color: rgba(239, 230, 207, 0.16); background: rgba(10, 15, 32, 0.66); }
.bn-cab { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 16px; column-gap: 12px; padding: 13px 14px 12px; border: 0; background: none; color: var(--tinta); text-align: left; }
.bn-cab:active { opacity: 0.75; }
.bn-pregunta { display: block; font: 500 15px/1.28 var(--texto); color: var(--tinta); text-wrap: pretty; }
.bn-cab-respuesta { display: block; margin-top: 5px; font: 400 13px/1.4 var(--texto); color: rgba(239, 230, 207, 0.68); text-wrap: pretty; }
.bn-cab .bn-sello { margin-top: 9px; }
.bn-cab > svg { width: 16px; height: 16px; margin-top: 1px; color: rgba(239, 230, 207, 0.55); transition: transform 0.3s; }
.bn-area.abierta .bn-cab > svg { transform: rotate(180deg); }
.bn-dentro { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.bn-area.abierta .bn-dentro { grid-template-rows: 1fr; }
.bn-dentro > div { min-height: 0; overflow: hidden; padding: 0 14px; }
.bn-area.abierta .bn-dentro > div { padding-bottom: 6px; }
.bn-sub { margin: 4px 0 6px; padding-top: 12px; border-top: 1px solid rgba(239, 230, 207, 0.07); font: 500 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.5); }
.bn-puntos, .bn-no { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.bn-puntos li { font: 400 13.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.86); text-wrap: pretty; }
.bn-puntos .bn-sello { margin-right: 6px; }
.bn-refs { white-space: nowrap; }
.bn-ref { appearance: none; cursor: pointer; margin: 0 0 0 2px; padding: 0 2px; border: 0; background: none; color: #e8c46a; font: 500 10.5px/1 var(--texto); vertical-align: 4px; }
.bn-no li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; font: 400 13px/1.42 var(--texto); color: rgba(239, 230, 207, 0.74); text-wrap: pretty; }
.bn-no li svg { width: 12px; height: 12px; margin-top: 3px; color: rgba(239, 230, 207, 0.42); }
.bn-fuentes-cab { appearance: none; cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%; margin: 12px 0 0; padding: 12px 0 8px; border: 0; border-top: 1px solid rgba(239, 230, 207, 0.07); background: none; color: rgba(239, 230, 207, 0.62); font: 500 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; text-align: left; }
.bn-fuentes-cab svg { width: 12px; height: 12px; transition: transform 0.3s; }
.bn-fuentes.abiertas .bn-fuentes-cab svg { transform: rotate(90deg); }
.bn-fuentes-dentro { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.32s cubic-bezier(0.2, 0.7, 0.2, 1); }
.bn-fuentes.abiertas .bn-fuentes-dentro { grid-template-rows: 1fr; }
.bn-fuentes-dentro > ol { min-height: 0; overflow: hidden; margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.bn-fuentes.abiertas .bn-fuentes-dentro > ol { padding-bottom: 8px; }
.bn-cita { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 6px; padding: 6px 6px 7px; margin: 0 -6px; border-radius: 10px; transition: background-color 0.6s ease; }
.bn-cita.resaltada { background: rgba(232, 196, 106, 0.1); }
.bn-cita-n { font: 500 11px/1.5 var(--numeros); color: #e8c46a; font-variant-numeric: tabular-nums; }
.bn-cita b { display: block; font: 500 12.5px/1.35 var(--texto); color: var(--tinta); }
.bn-cita span { display: block; margin-top: 2px; font: 400 12px/1.35 var(--texto); color: rgba(239, 230, 207, 0.62); }
.bn-cita a { display: block; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 11.5px/1.35 var(--texto); color: rgba(181, 204, 248, 0.86); text-decoration: none; }
.bn-cita a::after { content: ' ↗'; }
.bn-final { margin: 24px 4px 0; font: 400 12px/1.4 var(--texto); color: rgba(239, 230, 207, 0.45); }
.bn-no.bn-general li { font-size: 13.5px; color: rgba(239, 230, 207, 0.8); }
@media (prefers-reduced-motion: reduce) { .bn-dentro, .bn-fuentes-dentro, .bn-cab > svg, .bn-fuentes-cab svg, .bn-area, .bn-cita { transition: none; } }
`;
  let estilo = null;

  // Lo que queda abierto entre una pintada y otra: el área y sus fuentes.
  const estado = { abierta: null, fuentes: new Set() };
  const AREAS = ['metas', 'progreso', 'sueno', 'momentos', 'ascent', 'cuidados', 'fotos'];

  /** Baja (suave) lo justo para que se vea `n`, moviendo solo lo que tiene scroll: la hoja no se corre. */
  function acercar(n) {
    let p = n.parentElement;
    while (p && !/(auto|scroll)/.test(getComputedStyle(p).overflowY)) p = p.parentElement;
    if (!p) return;
    const a = n.getBoundingClientRect(), b = p.getBoundingClientRect();
    const d = a.bottom > b.bottom - 16 ? Math.min(a.bottom - (b.bottom - 16), a.top - (b.top + 16)) : a.top < b.top + 16 ? a.top - (b.top + 16) : 0;
    if (d) p.scrollTo({ top: p.scrollTop + d, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /** La hoja, en `cuerpo`: con `u` (Util.crear) y si Ascent está prendida. `abierta`: el área que se abre al llegar. */
  function pintar(cuerpo, { u, conAscent, abierta }) {
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.textContent = CSS;
      document.head.appendChild(estilo);
    }
    if (abierta !== undefined) estado.abierta = abierta;
    const { tx, el, boton, icono, plural } = u;
    const b = (k) => tx('perfil.baseInfo.' + k);
    const areas = AREAS.filter((k) => k !== 'ascent' || conAscent);
    const total = areas.reduce((s, k) => s + b(`areas.${k}.citas`).length, 0);
    const sello = (k) => el('span', 'bn-sello ' + k, b(`sellos.${k}.nombre`));
    const c = el('div', 'bn');

    // La respuesta primero, con cuándo se revisó y sobre cuánto.
    c.append(el('p', 'bn-respuesta', b('respuesta')), el('p', 'bn-revisado', `${b('revisado')} · ${tx('perfil.baseInfo.cuantas', { areas: areas.length, fuentes: total })}`));

    // Cómo se ordena lo que llega: el dibujo y las reglas.
    c.appendChild(el('h4', 'bn-etq', b('comoTitulo')));
    const flujo = el('div', 'bn-flujo');
    const columna = (clave, items, clase) => {
      const col = el('div', 'bn-flujo-col' + (clase ? ' ' + clase : ''));
      col.appendChild(el('span', 'bn-flujo-etq', b('columnas.' + clave)));
      items.forEach((t) => col.appendChild(el('b', 'bn-flujo-item', t)));
      return col;
    };
    const flecha = () => { const f = el('i', 'bn-flujo-flecha'); f.innerHTML = icono('adelante'); return f; };
    flujo.append(columna('llega', [...b('llega'), ...(conAscent ? [b('llegaAscent')] : [])]), flecha(), columna('hace', b('hace'), 'moss'), flecha(), columna('ves', b('ves')));
    const reglas = el('ul', 'bn-reglas');
    b('reglas').forEach((t) => { const li = el('li'); li.innerHTML = icono('listo'); li.appendChild(el('span', null, t)); reglas.appendChild(li); });
    c.append(flujo, reglas);

    // Cuánto confiar: los cuatro sellos.
    c.appendChild(el('h4', 'bn-etq', b('sellosTitulo')));
    const leyenda = el('ul', 'bn-sellos');
    SELLOS.forEach((k) => { const li = el('li'); li.append(sello(k), el('span', null, b(`sellos.${k}.texto`))); leyenda.appendChild(li); });
    c.appendChild(leyenda);

    // Cada área, plegada: la pregunta, la respuesta y su sello. Se abren de a una.
    c.appendChild(el('h4', 'bn-etq', b('preguntasTitulo')));
    const lista = el('div', 'bn-areas');
    const abrirArea = (k) => {
      estado.abierta = estado.abierta === k ? null : k;
      lista.querySelectorAll('.bn-area').forEach((x) => {
        const si = x.dataset.area === estado.abierta;
        x.classList.toggle('abierta', si);
        x.querySelector('.bn-cab').setAttribute('aria-expanded', String(si));
        x.querySelector('.bn-dentro').inert = !si;
      });
    };
    areas.forEach((k) => {
      const a = (x) => tx(`perfil.baseInfo.areas.${k}.${x}`);
      const item = el('section', 'bn-area' + (estado.abierta === k ? ' abierta' : ''));
      item.dataset.area = k;
      const cab = boton('bn-cab', '', () => abrirArea(k));
      const textos = el('span');
      textos.append(el('span', 'bn-pregunta', a('pregunta')), el('span', 'bn-cab-respuesta', a('respuesta')), sello(a('sello')));
      cab.appendChild(textos);
      cab.insertAdjacentHTML('beforeend', icono('abajo'));
      cab.setAttribute('aria-expanded', String(estado.abierta === k));
      const dentro = el('div', 'bn-dentro');
      dentro.inert = estado.abierta !== k;
      const caja = el('div');

      // Las fuentes, numeradas y plegadas; tocar un número las abre y lo marca.
      const citas = a('citas');
      const fuentes = el('div', 'bn-fuentes' + (estado.fuentes.has(k) ? ' abiertas' : ''));
      const ol = el('ol');
      citas.forEach((x, i) => {
        const li = el('li', 'bn-cita');
        li.dataset.n = String(i + 1);
        const textoDeCita = el('div');
        textoDeCita.append(el('b', null, x.anio ? `${x.quien} · ${x.anio}` : x.quien), el('span', null, x.que));
        const enlace = el('a', null, x.enlace.replace(/^https?:\/\/(www\.)?/, ''));
        Object.assign(enlace, { href: x.enlace, target: '_blank', rel: 'noopener' });
        textoDeCita.appendChild(enlace);
        li.append(el('span', 'bn-cita-n', String(i + 1)), textoDeCita);
        ol.appendChild(li);
      });
      const fuentesDentro = el('div', 'bn-fuentes-dentro');
      fuentesDentro.appendChild(ol);
      fuentesDentro.inert = !estado.fuentes.has(k);
      const abrirFuentes = (si) => {
        if (si) estado.fuentes.add(k); else estado.fuentes.delete(k);
        fuentes.classList.toggle('abiertas', si);
        fuentesCab.setAttribute('aria-expanded', String(si));
        fuentesDentro.inert = !si;
      };
      const fuentesCab = boton('bn-fuentes-cab', `${icono('adelante')}<span>${plural('perfil.baseInfo.citasN', citas.length)}</span>`, () => abrirFuentes(!estado.fuentes.has(k)));
      fuentesCab.setAttribute('aria-expanded', String(estado.fuentes.has(k)));
      fuentes.append(fuentesCab, fuentesDentro);
      const resaltar = (n) => {
        abrirFuentes(true);
        const li = ol.querySelector(`[data-n="${n}"]`);
        if (!li) return;
        li.classList.add('resaltada');
        setTimeout(() => li.classList.remove('resaltada'), 1400);
        setTimeout(() => acercar(li), 340);
      };

      // Cómo lo usa Moss: cada punto con su sello y sus fuentes.
      caja.appendChild(el('h5', 'bn-sub', b('comoUsa')));
      const puntos = el('ul', 'bn-puntos');
      a('puntos').forEach((p) => {
        const li = el('li');
        li.append(sello(p.sello), document.createTextNode(p.texto));
        if (p.refs && p.refs.length) {
          const refs = el('span', 'bn-refs');
          p.refs.forEach((n) => refs.appendChild(boton('bn-ref', String(n), () => resaltar(n), `${b('fuentes')} ${n}`)));
          li.appendChild(refs);
        }
        puntos.appendChild(li);
      });
      caja.appendChild(puntos);
      // Lo que no hace, solo donde hay algo que decir.
      const no = a('noHace');
      if (Array.isArray(no) && no.length) {
        caja.appendChild(el('h5', 'bn-sub', b('noHaceArea')));
        const ul = el('ul', 'bn-no');
        no.forEach((t) => { const li = el('li'); li.innerHTML = icono('cerrar'); li.appendChild(el('span', null, t)); ul.appendChild(li); });
        caja.appendChild(ul);
      }
      caja.appendChild(fuentes);
      dentro.appendChild(caja);
      item.append(cab, dentro);
      lista.appendChild(item);
    });
    c.appendChild(lista);

    // Lo que Moss no hace, para todo.
    c.appendChild(el('h4', 'bn-etq', b('noHaceTitulo')));
    const no = el('ul', 'bn-no bn-general');
    b('noHace').forEach((t) => { const li = el('li'); li.innerHTML = icono('cerrar'); li.appendChild(el('span', null, t)); no.appendChild(li); });
    no.style.padding = '0 4px';
    c.append(no, el('p', 'bn-final', b('revisado')));
    cuerpo.appendChild(c);
  }

  return { pintar };
})();
