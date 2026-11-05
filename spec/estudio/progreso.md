# El peso, el cuerpo y el plan hacia el objetivo: qué dice la evidencia

Estudio del 5/11/2026 para «En qué se basa Moss». Área: la tendencia del peso, pesarse, los ritmos y la meta
con plazo, el plan por etapas, la grasa con cinta, el piso del peso meta, la cintura y cómo mostrar el
progreso con su incertidumbre.

**Lo que se leyó de Moss** (rama `mejoras-1.1`, commit `134c873`; los archivos del dominio citados no tenían
cambios sin guardar ese día): `src/dominio/progreso.ts`, `cuerpo.ts`, `control.ts` (la parte del peso),
`metas.ts` (ritmos, pisos, IMC), `cuestionario.ts` (peso meta, grasa, masa magra), `conAscent.ts` (el peso de
Ascent), `src/salud/convertir.ts` y `leer.ts` (el peso de Salud), `src/almacen/almacen.ts` (cómo entra),
`src/secciones/persona.ts`, `galeria/src/progreso.js`, los textos de `src/textos/es.json` y, en `spec/`,
`progreso.md`, `evidencia-1.1.md`, `decisiones.md` (D18, D34, D35 y «La seguridad») y `nutricion.md` («Las
metas» y «El cuestionario nuevo»). **`estadisticas.ts` no tiene nada del peso:** es «Tu mes» de Hábitos.
`es.json` se estaba editando ese día, así que sus textos se citan por clave y no por línea.

**Cómo se probó, además de leer.** El código de Moss se pasó tal cual a JavaScript (en
`spec/estudio/sim/dominio/`, sin tocar el repo) y se corrió contra pesos simulados con el ruido que describe la
literatura: un desvío diario de 0,5 kg (lo que usan Hall y Chow 2011; Kutáč 2015 midió 0,4–0,6 kg en
ayunas), sin persistencia o con una persistencia de unos días (ρ = 0,6, por el agua del ciclo, de la sal y del
glucógeno), el patrón semanal de 0,35 % (Turicchi 2020) y +0,45 kg en los días de la menstruación (Kanellakis
2023). No hay un estudio que mida esa persistencia: se muestran los dos extremos. Los guiones están en
`spec/estudio/sim/`
(`simular.js`, `semanal.js`, `potencia.js`, `potencia8.js`, `mantener.js`, `relleno.js`, `atipico.js`,
`embarazo.js`, `cambio7.js`, `mantenerPropuesta.js`); los números del anexo salen de ahí. Las fuentes leídas
quedaron en `spec/estudio/fuentes/`.

---

## 1. Resumen

1. **Se sostiene:** mirar la tendencia y no el número del día; la media exponencial con α = 0,1 para la línea
   (es una convención, de *The Hacker's Diet*, pero un suavizado exponencial estuvo entre los mejores para
   completar datos de balanzas: Turicchi 2020); bajar de 0,25 a 1 % del peso por semana y subir de 0,25 a
   0,5 %; el tope de 1 kg por semana y de 1.000 kcal de déficit; pasar directo a mantenimiento, sin «reverse
   diet»; el IMC 18,5 como piso duro; la cintura sobre la altura con los cortes de NICE.
2. **Cae el ritmo sin margen.** Con el ruido real del peso, el ritmo de 3 a 4 semanas tiene un error típico
   de 0,11 a 0,24 kg por semana, del tamaño del plan mismo (0,4). Con alguien que va **exactamente** al ritmo
   del plan y un ruido que dura unos días, Moss le dice «Al ritmo» solo el 31–39 % de las veces a las 3–4
   semanas (el 60–64 % si el ruido de cada día fuera independiente, lo más favorable), y la «fecha a tu ritmo»
   erra de −7 a +31 semanas en 9 de cada 10 casos. Manteniendo con el peso quieto, dice «Cambiando» el 46–54 %
   de las veces (el 20 % con ruido independiente). El ritmo, los estados y la fecha tienen que salir de un
   ritmo **con su rango**, y Moss no debería opinar hasta que el rango alcance (de 4 a 6 semanas).
3. **Tres sesgos con arreglo claro en la tendencia:** el relleno de los días posteriores a la última pesada
   achata el ritmo de quien se pesa poco (pesándose los lunes: −21 % en el ritmo y −125 kcal en el gasto
   medido); con pesadas espaciadas, una sola pesada rara de +1,5 kg baja el gasto medido 371 kcal; y la
   tendencia atrasa 9 días, así que «te faltan» y la fecha salen 1,3 a 2 semanas tarde.
4. **El peso de Salud es el último del día,** y la regla de Moss (D34) es el de la mañana: quien se pesa a la
   mañana y a la noche puede quedar con el de la noche.
5. **La grasa con cinta: el rango chico es precisión falsa.** Contra DXA, la fórmula de la Marina tuvo un
   error estándar de 3,4 (hombres) y 4,1 puntos (mujeres) con un sesgo de −6 puntos en 1.407 reclutas
   (Foulis 2023), y un error cuadrático de 5,9 y 4,4 puntos en 1.904 soldados (Taylor 2024). Tampoco siguió el
   cambio: en 8 semanas, DXA vio −4 puntos en las mujeres y la cinta, 0. El rango de 2 a 4 puntos (D18) solo
   refleja cuánto se corre la cinta, y aun eso está subestimado. Va ±4 puntos, y la cintura en centímetros
   como la señal del cambio.
6. **«Sin déficit» no protege en el embarazo.** Con el peso subiendo lo que recomienda el IOM (0,42 kg por
   semana), el control de cada semana lee esa ganancia como un exceso y baja la meta de 2.200 a 1.740 kcal en
   16 semanas. Es lo más urgente de esta área.
7. **El IMC 18,5 es el borde, no una meta:** la mortalidad es 13 % más alta entre 18,5 y 20 que entre 20 y 25
   (Global BMI Mortality Collaboration 2016, 3,9 millones de personas sanas que no fuman), y desde los 65 años
   sube por debajo de 23 (Winter 2014). Proponer nunca debajo de 20, y decidir un piso más alto para mayores.
8. **El plan por etapas:** los hitos cada 4 semanas y las 2 semanas de mantenimiento son convenciones
   razonables. Las pausas de dieta (MATADOR, ICECAP, el metaanálisis de Poon 2025) no empeoran la pérdida de
   grasa y dan menos hambre y algo menos de caída del gasto en reposo: se pueden ofrecer, a cambio de tardar
   más. El «reverse diet» no tiene evidencia a favor (un ensayo de 2025 no le encontró ventaja).
9. **La velocidad:** en metaanálisis de personas con obesidad, bajar lento no conservó más masa magra
   (Ashtary-Larky 2020) y bajar rápido no hizo recuperar más (Purcell 2014); en atletas, 0,7 % por semana
   conservó más masa magra que ~1 % (Garthe 2011). La escala viable/exigente sirve para gente delgada o
   entrenada; con obesidad podría permitir más.
10. **Falta calcular:** el ritmo y la fecha con su rango; el nivel de hoy sin atraso; las pesadas raras; el
    agua del glucógeno al empezar y al pasar a mantenimiento; el ciclo menstrual; y el gasto al llegar (unas
    22 a 24 kcal menos por día por cada kilo bajado: Hall y Chow 2011, Hall 2011) para el piso y el
    mantenimiento.

---

## 2. Tabla de veredictos

Las filas se citan después como T1, T2… «Simulación» es la del anexo, con el código de Moss.

| # | Qué calcula Moss | Dónde | Veredicto | La mejor evidencia (autor, año, tipo, n) | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|---|
| T1 | La tendencia: media móvil exponencial con α = 0,1 sobre el peso de cada día | `control.ts:15-16, 53-61` | **Es una convención** (razonable) | Walker, *The Hacker's Diet* (origen de la constante 0,9, parecida a una media de 20 días; no es un estudio). Turicchi 2020, *JMIR*, validación con balanzas, n = 50: Kalman y la media exponencial, los mejores (error 0,62–0,64 %) | Mantenerla para la línea del gráfico; para los números (ritmo, nivel, fecha), la recta por promedios semanales (T4) | Pesadas con fecha | Sí |
| T2 | Los días sin pesada: en línea recta entre pesadas y, **después de la última, la última** | `control.ts:34-50` (l. 47) | **Refutado** (la segunda parte) | Simulación sin ruido, −0,5 kg/sem exactos, pesándose solo los lunes: el ritmo del domingo da −0,395 (−21 %) y el control del lunes mide 2.425 kcal en vez de 2.550 (a las 9 semanas, −0,455 y 2.498) | Cortar la serie en la última pesada; el ritmo y el control miden hasta ahí | Fechas | Sí |
| T3 | Una pesada rara pesa según cuántas haya alrededor | `control.ts:38-61` | **Refutado** con pesadas espaciadas | Simulación: +1,5 kg un lunes, pesándose solo los lunes → gasto medido 2.127 contra 2.498 (−371 kcal) y ritmo −0,32 contra −0,50; pesándose a diario, −30 a −57 kcal | Una pesada que se aparta más de max(1,5 kg, 2 %) de lo esperado (≈ 3 desvíos de 0,5 kg) entra con un cuarto de su diferencia hasta que la siguiente la confirme | Pesadas | Sí |
| T4 | El ritmo: lo que se movió en 21 días (14 como mínimo), sin margen; recta de mínimos cuadrados sobre días rellenados las primeras 6 semanas, diferencia de la tendencia después | `progreso.ts:9-11, 26-35`; `control.ts:63-82` | **Refutado** (la forma); la ventana, a medias | Hall y Chow 2011, *AJCN*, modelo validado con ensayos en sala: con pesadas diarias hacen falta más de 28 días para un IC 95 % del cambio de ingesta menor a 300 kcal/día. Ruido diario: Kutáč 2015 (n = 86, en ayunas, 0,4–0,6 kg), Cheuvront 2004 (n = 65, primera mañana, 0,51 kg, CV 0,66 %). Simulación: error típico del ritmo de Moss 0,11–0,24 kg/sem a las 3–4 semanas, 0,05–0,11 desde las 6 | Recta por los **promedios de cada semana** (últimas 6, mínimo 3), con su rango al 80 % (t de Student, desvío mínimo 0,2 kg): cubrió la verdad el 79–85 % de las veces a las 4–6 semanas; ±0,23 kg/sem a las 4 semanas y ±0,11 a las 6 pesándose a diario (±0,35 y ±0,17 una vez por semana) | Pesadas | Sí |
| T5 | Los estados: en camino (≥ mitad del plan), despacio, quieto (< 50 g/sem), al revés; manteniendo, estable (< 150 g/sem) | `progreso.ts:14-18, 73-76, 90-96` | **Refutado** (umbrales sin margen) | Simulación, peso quieto y ruido que dura: «Cambiando» el 46–48 % a las 3–4 semanas y el 11–12 % a las 9–17; pesándose una vez por semana, 51–54 % y 22–26 % | Con el rango: «cambiando» solo si todo el rango queda fuera de ±0,15 kg/sem; si el rango es más ancho que el plan, «todavía no se sabe» | Ritmo con rango | No (hay que calcularlo) |
| T6 | «Cómo vienes»: al ritmo a ±25 % del plan (o ±100 g) | `progreso.ts:290-292, 342-348` | **Refutado** | Simulación con el ritmo de verdad igual al plan y ruido que dura: «al ritmo» 31–39 % a las 3–4 semanas y 61–72 % a las 6–12 (con ruido independiente, 60–64 % y 93–94 %). Con la regla del rango: 96–100 % a las 6–8 semanas; a cambio, avisa más tarde que se va a la mitad (a las 8 semanas lo dice el 68 % pesándose a diario, contra el 84 % de hoy) | «Adelantado» o «más lento» solo si todo el rango queda fuera del margen. El control ajusta las calorías igual: el estado es solo un mensaje, y uno falso preocupa sin motivo | Ritmo con rango | No |
| T7 | La fecha: lo que falta dividido por el ritmo medido, un día exacto; sin fecha más allá de 2 años | `progreso.ts:19-20, 90-92, 343` | **Refutado** (la precisión); el horizonte es una convención | Simulación: a las 3–4 semanas, la fecha a tu ritmo erra de −7 a +31 semanas (90 %); a las 6, de −3 a +13; a las 12, de −2 a +8. Van der Bles 2020, *PNAS*, 5 experimentos, n = 5.780: dar la incertidumbre en números casi no baja la confianza (la verbal, algo más) | Un rango de fechas (o un mes): hoy + faltan ÷ (avance ± medio rango); sin fecha si el borde de abajo del avance es ≤ 0,05 kg/sem; la fecha del plan queda como ancla | Ritmo con rango, nivel sin atraso | No |
| T8 | «Te faltan», «llegaste» (a 0,5 kg) y la fecha usan el nivel de la tendencia, que atrasa | `progreso.ts:12-13, 68, 80-87` | **A medias** | La media exponencial atrasa (1 − α)/α = 9 días: a 0,4 kg/sem son 0,5 kg. Simulación: la fecha sale 1,3 a 2,1 semanas tarde (mediana) | Nivel de hoy = tendencia + pendiente diaria × 9, o el valor de la recta de T4 en el día de hoy | Pesadas | Sí |
| T9 | El cambio en 7 y en 30 días (de la tendencia) | `persona.ts:86-89, 136`; `Progreso.tsx` (`progreso.cambios`) | **A medias** | Simulación con el peso quieto: el de 7 días se mueve ±0,20–0,31 kg (90 %) solo por ruido; el de 30, ±0,26–0,47 | Mostrar el de 4 semanas con «aprox.»; el de 7 días, sin colores ni conclusiones | Pesadas | Sí |
| T10 | El peso de Salud: **el último** de cada día del calendario | `salud/convertir.ts:59-69`; `salud/leer.ts:115`; `almacen.ts:838-847` | **Refutado** (contradice D34) | D34 y `evidencia-1.1.md` §4: a la mañana, en ayunas. Cheuvront 2004: el de la primera mañana varía menos del 1 %; Orsama 2014 (n = 80) usó el de al despertar, antes del desayuno | El primero de cada día de Moss (después de la hora de corte); si llega uno más temprano, reemplaza al guardado | La hora de cada muestra (Salud la da) | Sí |
| T11 | El peso de Ascent, sin hora, llena los días sin peso de Moss | `conAscent.ts:216-228` | **A medias** | Un peso tomado a otra hora o vestido es un error sistemático (T3) | Usarlo con la mitad del peso en la tendencia, o solo si cae dentro de ±1,5 kg de lo esperado | La hora | No (Ascent no la guarda) |
| T12 | Pesarse: el aviso al rato de despertarse y antes del desayuno (D34); el control pide 1 pesada por semana | `avisos.ts:397-406`; `control.ts:22-24` | La hora, **se sostiene** (convención con base fisiológica); 1 por semana, **a medias** | Cheuvront 2004; Kutáč 2015; Hall y Chow 2011 (diario, más de 28 días). Simulación: con 1 por semana el rango del ritmo es ~50 % más ancho y una pesada rara mueve el gasto 371 kcal | Recomendar pesarse a diario o casi; con menos de 3 pesadas en la semana, que el control mueva la meta a medio paso | Cuántas pesadas hubo | Sí |
| T13 | Pesarse a diario ayuda y no hace daño en general; matiz en jóvenes y mujeres | `evidencia-1.1.md` §4 | **Se sostiene** en adultos que quieren bajar; **a medias** en mujeres jóvenes y menores | Steinberg 2013, ECA, n = 91, 6 meses: −6,55 % contra −0,35 %. Steinberg 2015, n = 47: diario contra casi diario, 6,1 kg más. Madigan 2015, metaanálisis de ECA: pesarse solo, sin efecto (−0,5 kg); dentro de un programa, −1,7 kg; diario y semanal, sin diferencia. Wing 2006, ECA, n = 314: menos recuperación en el mantenimiento. Zheng 2015 (17 estudios) y Benn 2016 (metaanálisis, 29 pruebas): sin daño psicológico en promedio. Pacanowski 2015 (revisión, 20 estudios): peor en mujeres y jóvenes | Diario como opción para adultos que bajan; un modo semanal, sin el número de cada día, para quien marcó un cuidado, menores de 18 o quien lo prefiera | El cuidado, la edad | Sí |
| T14 | Los ritmos: bajar 0,25 / 0,5 / 0,75 % del peso por semana; subir 0,1 / 0,25 / 0,4 % | `metas.ts:65-69` | **Se sostiene** | Helms 2014 (revisión, *JISSN*): 0,5–1 % para cuidar el músculo. Garthe 2011 (ECA, n = 24 atletas): con 0,7 % la masa magra subió 2,1 %; con ~1 % (se pidió 1,4), no cambió. Murphy y Koehler 2022 (metaanálisis): con más de ~500 kcal/día de déficit no se gana masa magra entrenando. Iraki 2019 (revisión): subir 0,25–0,5 %. Helms 2023 (ECA, n = 17): un 15 % de superávit suma más grasa que un 5 %, sin más músculo | Lo que hay | — | Sí |
| T15 | Qué tan exigente: bajando, viable ≤ 0,5 %, exigente ≤ 1 %, muy agresivo > 1 %, > 1 kg/sem o > 1.000 kcal/día; subiendo, 0,25 y 0,5 % | `progreso.ts:150-170` | **Se sostiene** con gente delgada o entrenada; **a medias** con obesidad | Ashtary-Larky 2020 (metaanálisis, 7 estudios, n ≈ 361, con sobrepeso u obesidad): la masa magra no difirió entre lento y rápido (lento: 1 kg más de grasa perdida y mejor gasto en reposo). Purcell 2014 (ECA, n = 200): rápido o lento, se recuperó lo mismo (~71 %). Nackers 2010 (n = 262): bajar rápido el primer mes se asoció a más pérdida a 18 meses, sin más recuperación. Weinsier 1995: los cálculos biliares suben con más de 1,5 kg/sem. Johansson 2014 (n = 6.640): dieta de 500 kcal, 3,4 veces más cálculos. MacroFactor (industria): 0,25–1 %, hasta 1 kg | Con IMC ≥ 30, viable hasta 0,75 % (o 1 %) sin pasar de 1 kg/sem (decisión) | IMC | Sí |
| T16 | 7.700 kcal por kilo para pasar el ritmo a calorías | `metas.ts:71, 139-142`; `progreso.ts:161-162` | **A medias** (sirve para empezar) | Hall 2008 (modelo): la regla vale con más de 30 kg de grasa y sobreestima el déficit necesario en gente más delgada. Hall 2011 (*Lancet*, modelo validado): el peso responde con vidas medias de ~1 año; la regla estática sobreestima la pérdida a largo plazo | Como el control mide el gasto cada semana, alcanza con «unas X kcal»; para planes largos, proyectar el gasto al llegar (T17) | Peso, grasa | Sí |
| T17 | El piso de kcal en el plazo, con el gasto de hoy | `progreso.ts:229-237`; `metas.ts:77-78` | **A medias** | Hall y Chow 2011: el gasto baja ~22 kcal/día por kilo (ε); Hall 2011: ~100 kJ (24 kcal) por día por kilo | Revisar el piso también con el gasto al llegar ≈ gasto − 22 × kilos que faltan | Gasto, kilos que faltan | Sí |
| T18 | Avisos del plazo: sin fuerza, bajando «una parte es músculo; entrenando fuerza tres veces por semana, casi nada»; subiendo, «dos tercios es grasa»; antes de los 18, mejor viable | `progreso.ts:238-239`; `es.json` › `progreso.plazo.avisos` | **A medias** (bajar); **se sostiene** (subir, derivado) | Sardeli 2018 (metaanálisis, 6 ECA, **mayores con obesidad**): la fuerza evitó el 93,5 % de la pérdida de masa magra. Forbes, con la constante de Hall y Chow 2011 (C = 10,4 kg): la parte magra de un cambio es 10,4 ÷ (10,4 + kg de grasa); con 20 kg de grasa, un tercio (dos tercios, grasa). El resumen de Bouchard 1990 no da la composición: no sirve de fuente para el «dos tercios» | Bajando: «mucho menos» en lugar de «casi nada» | Si entrena fuerza, la grasa | En parte |
| T19 | El plan por etapas: un hito cada 4 semanas (3 como mucho), 2 semanas de mantenimiento al llegar, lo que sigue | `progreso.ts:264-350` | **Es una convención** | Byrne 2018 (MATADOR, ECA, n = 51): en los bloques de 2 semanas en balance el peso no se movió (0,0 ± 0,3 kg). Kreitzman 1992 y Fernández-Elías 2015: el glucógeno vuelve con unos 3 a 4 g de agua por gramo | Avisar que al pasar a mantenimiento el peso sube un poco (agua) y no es grasa; no decir «al revés» esas 2 semanas; hitos redondeados a 0,5 kg | Fecha de llegada | Sí |
| T20 | Pausas de mantenimiento en planes de más de 16 semanas: pendiente, hoy no se parte | `spec/progreso.md` («Pendiente de decidir») | **Es una convención** con evidencia neutra a favorable | Byrne 2018 (MATADOR, hombres con obesidad, 2 semanas sí y 2 no): más pérdida de grasa (12,3 contra 8,0 kg) y menos adaptación, en 30 semanas en vez de 16. Peos 2021 (ICECAP, ECA, n = 61 entrenados): igual grasa y masa magra, menos hambre. Poon 2025 (metaanálisis, 12 ECA, n = 881): igual composición, menos caída del gasto en reposo | Ofrecerlo como opción («con pausas»), no de fábrica: cuesta semanas | Duración del plan | Sí |
| T21 | Al terminar: directo a mantenimiento (sin «reverse diet») | `progreso.ts:319-326` | **Se sostiene** | Rodriguez Da Silva y otros 2025 (ECA preliminar, resumen de congreso del *JISSN*, n = 49 entrenados): subir las calorías de a poco no recuperó menos que volver directo al mantenimiento estimado | Lo que hay | — | Sí |
| T22 | La grasa: método de la Marina (Hodgdon y Beckett 1984), en cm, con Siri | `cuerpo.ts:21-35` | **A medias** | Foulis 2023 (*Front Physiol*, 481 mujeres y 926 hombres, DXA): sesgo −6,0 puntos, error estándar 4,1 y 3,4. Taylor 2024 (*Obes Sci Pract*, 1.904 soldados, DXA): error cuadrático 4,4 (mujeres) y 5,9 (hombres), sesgo −1,7 y −4,8; una fórmula de una sola medida (abdomen y peso) erró 4,1 y 3,4. Woolcott 2018 (RFM, NHANES, DXA, validación n = 3.456): R² 0,69–0,75, dispersión 4,2–4,9 puntos. Cuenta propia: la forma en cm de Moss y la de Defensa en pulgadas difieren ≤ 0,3 puntos en el rango común (hasta 1,3 en los extremos) | Usarla como estimación de ±4 puntos o más; cruzarla con la RFM para detectar una medida mal tomada | Cintura, cuello, cadera, altura | Sí |
| T23 | El rango de la grasa: el error de la cinta (1 cm en cintura y cadera, 0,5 en el cuello) en cuadratura, mínimo ±1, +1 en las puntas: de 2 a 4 puntos | `cuerpo.ts:37-72` | **Refutado** | El error del método es de 3,4 a 5,9 puntos (T22). Barrios 2016 (n = 41): el cuello medido por uno mismo sale ~2 cm más grande que el del técnico (−1,6 puntos en el hombre de ejemplo) y la cintura en casa difiere ~2,4 cm de la del laboratorio | La estimación con ±4 puntos («unos 18 %, entre 14 y 22»); el error de la cinta, solo para decir si un cambio es real | Lo mismo | Sí |
| T24 | «Puede errar 3 a 4 puntos. Sirve para ver cómo cambia» | `es.json` › `progreso.grasaInvita.confianza` (y `cuerpo.aviso`) | El error, **a medias**; el cambio, **refutado en mujeres** | Foulis 2023: en 8 semanas, DXA −4,0 puntos en mujeres y la cinta 0,0; en hombres, −3,3 contra −2,2. En hombres, el cambio de la cintura siguió bien el de DXA | «Puede errar unos 4 puntos o más. Para ver cómo cambia tu cuerpo, mira tu cintura» | — | — |
| T25 | La masa magra = peso × (1 − grasa), para Katch-McArdle (y ahora para la disponibilidad de energía, `energia.ts`, nuevo) | `cuestionario.ts:47-50, 187-190` | **A medias** | Con ±4,5 puntos (80 %) en 80 kg, la masa magra erra ±3,6 kg y Katch-McArdle ±78 kcal (cuenta propia) | Usarla solo si la grasa vino de un método mejor que la cinta o la figura; si no, Mifflin-St Jeor | Cómo se supo la grasa | Sí (`como`) |
| T26 | La grasa «dicha» de una balanza de bioimpedancia | `cuestionario.ts:16-21`; `es.json` › `entrada.cuestionario.grasa.dichaTexto` | **Se sostiene** tratarla como estimación | Siedler 2023 (n = 73, 15 aparatos, contra un modelo de 4 compartimentos): error constante de −3,5 a +11,7 puntos, error estándar 3,1–7,5; para el cambio, 1,7–2,6. Frija-Masson 2021 (n ≈ 150, 3 balanzas): el peso sí (≤ 0,3 kg), la grasa no (−2,2 a −4,4 kg). NICE 1.9.9: no usar bioimpedancia en lugar del IMC | El mismo cuidado que con la cinta; para el cambio, solo de la misma balanza y a la misma hora | De dónde salió | Sí (`como`) |
| T27 | El piso del peso meta: IMC 18,5 | `metas.ts:74-75, 127-128`; `cuestionario.ts:296-306` | Piso duro, **se sostiene**; como meta posible, **a medias** | OMS (NLiS): debajo de 18,5 es bajo peso, un corte razonable a falta de más estudios. Global BMI Mortality Collaboration 2016 (*Lancet*, 239 estudios, 3,95 millones sin tabaco ni enfermedad): HR 1,13 entre 18,5 y 20 contra 20–25; el mínimo de mortalidad, en 22, 23 y 24 según la edad. Winter 2014 (metaanálisis, 32 estudios, n = 197.940, de 65 o más): +12 % entre 21 y 21,9 y +19 % entre 20 y 20,9 contra 23–23,9. NICE 1.9.13 | Piso duro 18,5; nunca proponer menos de 20; desde los 65, piso 23 (decisión); antes de los 18, el IMC por edad (NICE 1.10.7) | Edad, altura | Sí |
| T28 | El peso meta que se propone: 5 % menos o más | `cuestionario.ts:308-313` | **Se sostiene** para bajar con exceso de peso; convención para el resto | Magkos 2016 (ECA, obesidad): con ~5 % ya mejora la sensibilidad a la insulina en hígado, músculo y grasa | Lo que hay | — | Sí |
| T29 | La cintura sobre la altura: menos de 0,5; de 0,5 a 0,59; desde 0,6 (NICE NG246) | `cuerpo.ts:74-80`; `es.json` › `progreso.cinturaAltura` | **Se sostiene** | NICE NG246 (2025, revisada en 2026), 1.9.5, 1.9.8, 1.9.14 y 1.9.15: para IMC menor de 35, los dos sexos, todas las etnias y con mucho músculo. Ashwell 2012 (metaanálisis, 31 estudios, más de 300.000): mejor que la cintura y que el IMC. Rubino 2025 (Comisión de *Lancet*): el IMC solo no alcanza; confirmar con la cintura o la cintura sobre la altura | Mostrarla con IMC menor de 35; medir siempre en el mismo lugar. NICE mide a mitad entre la costilla y el hueso de la cadera. Ross 2020: el sitio casi no cambia el riesgo; en hombres los sitios dan casi lo mismo y en mujeres difieren ~2 cm (la parte más angosta, que usa la Marina, da por definición algo menos que el punto medio) | Cintura, altura, IMC | Sí |
| T30 | «Sin déficit» (embarazo, lactancia o una condición): bajar pasa a mantener, **pero el control sigue ajustando por el peso** | `metas.ts:13-17, 122-125, 169-174`; `control.ts:129-162` | **Refutado** (el control con el peso que sube) | IOM 2009 (informe, tabla S-1): en el embarazo se suben 11,5–16 kg con IMC normal (0,42 kg/sem en el 2.º y 3.er trimestre) y 5–9 kg con obesidad. Bodnar 2010 (n = 5.550 con obesidad): bajar de peso en el embarazo se asoció con más bebés pequeños y partos prematuros. Simulación: la meta baja de 2.200 a 1.740 kcal en 16 semanas | Con «sin déficit», el control nunca baja la meta porque sube el peso, y Progreso no dice «Cambiando: el control ajusta» | `sinDeficit` | Sí |
| T31 | El balance: lo comido menos el gasto; los días sin registro no cuentan | `progreso.ts:100-115` | **Se sostiene** | Es lógica; no hay evidencia en contra | Lo que hay | — | Sí |
| T32 | Medidas de fechas distintas en una sola estimación | `cuerpo.ts:82-95` | **A medias** | Foulis 2023: en 8 semanas el cuello de los hombres bajó ~0,5 cm (≈ 0,4 puntos) | Avisar si las medidas de la fórmula se tomaron con más de 60 días de diferencia | Las fechas | Sí |
| T33 | `estadisticas.ts`, pedido como «la parte del peso» | `estadisticas.ts:1-44` | No aplica | Es «Tu mes» de Hábitos; no calcula nada del peso | — | — | — |

---

## 3. Cambios propuestos

### 3.1 Arreglos claros

Cada uno con su test en el dominio, que es puro: se puede probar con series fijas o con ruido de semilla fija
(como en `sim/`).

**A1. El peso de Salud, el primero del día** (T10).
- `src/salud/convertir.ts:59-69`: una `primeraPorDia` para los pesos, con el día de Moss (`diaLogico` y la hora
  de corte, D32); la frecuencia en reposo sigue con la última. En `almacen.ts:841`, uno de Salud más temprano
  que el guardado de Salud lo reemplaza (hoy nunca reemplaza).
- Test: dos muestras del mismo día, 7:05 con 70,0 y 22:30 con 71,2 → 70,0; una a las 2:00 queda en el día
  anterior; si se guardó el de las 22:30 y después llega el de las 7:05, queda el de las 7:05.

**A2. No inventar días después de la última pesada** (T2).
- `control.ts:47` (`… : a.kg`): la serie termina en la última pesada. `cambioPorDia(desde, hasta)` mide hasta
  `min(hasta, última pesada)` y divide por esos días; `ritmoSemanal` y `controlSemanal`, igual. Para el «hoy»
  que se muestra, el nivel se extrapola con la pendiente (A5), no se copia.
- Test: pesadas solo los lunes con −0,5 kg/sem exactos → `ritmoSemanal` del domingo −0,50 ± 0,01 (hoy
  −0,395) y `controlSemanal` del lunes 2.550 ± 15 kcal (hoy 2.425).

**A3. Las pesadas raras** (T3, T11).
- En `control.ts`, antes de rellenar: si una pesada se aparta del nivel esperado ese día (A5, con las
  anteriores) en más de max(1,5 kg; 2 % del peso), se usa `esperado + 0,25 × (kg − esperado)` hasta que la
  siguiente la confirme (apartada para el mismo lado en más de la mitad del umbral: entonces las dos cuentan
  enteras). El umbral es ~3 veces el desvío diario de 0,5 kg (Hall y Chow 2011; Kutáč 2015). Los pesos de
  Ascent sin hora, con la misma regla y la mitad del peso (decisión D9).
- Test: pesándose los lunes, una pesada de +1,5 kg mueve el gasto medido menos de 100 kcal (hoy 371);
  pesándose a diario, la tendencia queda igual que hoy (± 0,02 kg); un salto real de +2 kg confirmado dos
  veces entra entero.

**A4. El ritmo con su rango, y los estados con el rango** (T4 a T7). La cuenta es del dominio y va con
tests; cómo se muestra se aprueba en la galería (D1).
- `progreso.ts`, nueva:
  ```ts
  /** El ritmo de las últimas semanas con su rango al 80 %: la recta por el promedio de las pesadas de cada semana. */
  export function ritmoConRango(pesadas: Pesada[], hoy: ClaveDia, semanas = 6):
    { kgPorSemana: number; desde: number; hasta: number; nivelHoy: number; semanas: number } | null
  ```
  Bloques de 7 días que terminan hoy; el promedio de las pesadas **reales** de cada bloque (sin rellenar); con
  menos de 3 bloques, `null`. Recta de mínimos cuadrados `y = a + b·x` (x, el centro de cada bloque en días);
  `s = max(0,2; √(Σe² / (n − 2)))`; `medio = t₈₀(n − 2) × s / √Σ(x − x̄)² × 7`, con
  `t₈₀ = {1: 3,078; 2: 1,886; 3: 1,638; 4: 1,533; 5: 1,476; 6: 1,440}`; `nivelHoy = ȳ + b·(hoy − x̄)`.
- Los estados, con el avance hacia la meta y su rango `[lo, hi]` (positivo es ir hacia la meta) y el plan `p`:
  - si `medio > max(0,25; p)` → `todaviaNo` (nuevo: «todavía no se sabe»);
  - `progresoAlObjetivo`: `alReves` si `hi < 0`; «sin cambio claro» (hoy `quieto`) si el rango incluye el 0;
    `despacio` si `hi < p/2`; si no, `enCamino`. Manteniendo: `seMueve` solo si `lo > 0,15` o `hi < −0,15`.
  - `planPorEtapas`: con `m = max(0,25·p; 0,1)`, `adelantado` si `lo > p + m`, `atrasado` si `hi < p − m`,
    `alReves` si `hi < 0`; si no, `alRitmo`.
- Tests (con ruido de semilla fija, persistencia 0,6 y el ciclo): con el ritmo de verdad igual al plan,
  `alRitmo` en ≥ 90 % de 2.000 series a las 6 semanas (dio 96–99 %); con el peso quieto, `seMueve` ≤ 10 %
  (dio 0–4 %; hoy, 46–54 %); con el doble del plan, `adelantado` ≥ 80 % (dio 81–100 %); el rango cubre la
  verdad entre el 75 y el 90 % (dio 79–85 % a las 4–6 semanas); una recta exacta da el ritmo exacto y
  `nivelHoy` a ±0,05 kg.
- Lo que se pierde: con el ritmo de verdad en la mitad del plan, a las 8 semanas avisa el 68 % de las veces
  (hoy, el 84 %). Con un rango al 70 % avisa antes y se equivoca algo más: es un número para elegir.

**A5. El nivel de hoy sin atraso** (T8). `faltan`, `llegaste` y la fecha usan `nivelHoy` de A4 (o, mientras
no haya 3 semanas, `tendencia + pendiente diaria × (1 − α)/α`, es decir × 9). Test: con −0,4 kg/sem exactos,
`faltan` a ±0,05 kg de la verdad (hoy, +0,5) y la fecha a ±3 días (hoy, 9 días tarde).

**A6. La fecha como rango** (T7). `Progreso.fechas = { temprana, tardia } | null`: hoy + faltan ÷ (hi) y hoy +
faltan ÷ (lo); sin fecha si `lo ≤ 0,05`; más allá de 2 años, sin fecha (como hoy). Test: con 4 kg que faltan
y un avance entre 0,3 y 0,5 kg/sem → de 8 a 13⅓ semanas.

**A7. «Sin déficit» no baja calorías porque sube el peso** (T30). En `controlSemanal`, con
`perfil.sinDeficit`: `gasto = max(gasto, gastoAnterior)` (puede subir la meta, nunca bajarla por el peso). En
Progreso, con `sinDeficit`, ni el plan ni «el control ajusta tus calorías para mantenerlo». Test: la serie de
`sim/embarazo.js` (2.200 kcal por día, +0,42 kg/sem) deja la meta en 2.200 a las 16 semanas (hoy, 1.740).

**A8. El piso con el gasto al llegar** (T17). En `armarPlazo` (`progreso.ts:229-237`), bajando: además del
piso de hoy, `gastoAlLlegar = gasto − 22 × faltan`; si `gastoAlLlegar − kcal < piso`, un aviso nuevo
(`pisoAlFinal`: «Cerca del final comerías menos de {piso} kcal; Moss no baja de ahí y el último tramo va más
lento»). Test: 60 kg, gasto 1.700, meta 52, 0,75 % → hoy no avisa (1.205 kcal) y avisa `pisoAlFinal`
(1.524 − 495 = 1.029).

**A9. La cintura sobre la altura, con IMC menor de 35** (T29). `claseDeCintura(ratio, imc)`: `'sana'` (< 0,5),
`'aumentada'` (0,5–0,59), `'alta'` (≥ 0,6), o `null` con IMC ≥ 35 (NICE 1.9.14). Test con los bordes 0,4999,
0,5, 0,5999, 0,6 e IMC 34,9 y 35.

**A10. Detalles.** Los hitos, redondeados a 0,5 kg (`progreso.ts:336`; hoy a 0,1: precisión falsa).
`rangoDeGrasa` devuelve `fechasDistintas` si las medidas de la fórmula tienen más de 60 días de diferencia
(`cuerpo.ts:82-95`). Tests de cada uno.

**A11. Los textos** (en `es.json`, con su par en `en.json`):
- `progreso.textos.faltanDatos`: «Con dos semanas de pesadas, Moss empieza a ver hacia dónde vas; con cuatro a
  seis, a qué ritmo.» / «After two weeks of weigh-ins, Moss starts to see which way you're heading; after four
  to six, how fast.» (y lo mismo en `progreso.plan.comoVienes.faltanDatos` y en `inicio.primerDia.caminoTexto`, que dicen que
  con dos semanas Moss «mide tu ritmo de verdad»).
- `progreso.grasaInvita.confianza`: «Es una estimación con la cinta (la fórmula de la Marina de EE. UU.): puede
  errar unos 4 puntos o más. Para ver cómo cambia tu cuerpo, mira tu cintura.» / «It's a tape-measure estimate
  (the U.S. Navy formula): it can be off by about 4 points or more. To see how your body is changing, watch
  your waist.»
- `cuerpo.aviso`: «… un estudio de laboratorio (DEXA) podría dar unos 4 puntos más o menos, a veces más. En
  pocas semanas la cinta puede no notar un cambio de grasa, sobre todo en mujeres: tu cintura lo muestra
  mejor. …»
- `progreso.plazo.avisos.sinFuerzaBajar`: «… entrenando fuerza tres veces por semana, mucho menos.» / «…
  training strength three times a week, much less.»
- `progreso.plan.despues.bajar`: «Después, {n} semanas en mantenimiento: comes lo que gastas. Es normal que el
  peso suba un poco esos días: es agua, no grasa.» / «Then {n} weeks at maintenance: you eat what you burn.
  It's normal for your weight to go up a little those days: it's water, not fat.»
- La tendencia «así el agua y la sal no la mueven» (`inicio.todo.comoEstima.peso.texto`): «así el agua no la mueve tanto». La sal
  tiene evidencia mixta: en sala metabólica, 550 mEq por día no subieron el agua total ni el peso (Heer 2000).

### 3.2 Decisiones del dueño

- **D1. Cómo se ve el ritmo con rango** (galería): «−0,4 kg por semana (entre −0,3 y −0,5)», la fecha como
  «entre el 20 de diciembre y el 25 de enero» o «en enero», y «todavía no se sabe» las primeras semanas. Y el
  nivel de confianza (80 % propuesto).
- **D2. El rango de la grasa (D18).** La evidencia pide ±4 puntos (un rango de ~8, o «unos 18 %, ±4»), no
  2 a 4. Además: cruzar con la RFM (Woolcott 2018) y pedir medir de nuevo si difieren más de 6 puntos; o
  cambiar a una fórmula de una sola medida (la RFM: cintura y altura, sin el cuello, que es lo que peor se
  mide uno solo). La RFM y la Marina difieren en la gente de ejemplo: 22,1 contra 16,4 % en el hombre y 30,2
  contra 26,9 % en la mujer.
- **D3. La cintura como la señal del cambio** en Progreso, arriba de la grasa: «tu cintura bajó 3 cm en un
  mes». La cintura sigue a la grasa del abdomen (Ross 2020) y, en hombres, al cambio de grasa por DXA (Foulis
  2023).
- **D4. El piso del peso meta:** no proponer menos de IMC 20; desde los 65, piso 23 (Winter 2014; NICE
  1.9.13); de 16 a 17, IMC por edad (NICE 1.10.7) o directamente sin la opción de bajar más allá de lo viable.
- **D5. Los ritmos con obesidad:** con IMC ≥ 30, viable hasta 0,75 % o 1 % sin pasar de 1 kg/sem (Purcell
  2014; Nackers 2010; Ashtary-Larky 2020; la guía AHA/ACC/TOS 2013, con déficits de 500 a 750 kcal).
- **D6. Las pausas de mantenimiento** para planes de más de 16 semanas: como opción, no de fábrica.
- **D7. Cuántas pesadas:** pesarse a diario de fábrica para adultos que bajan; un modo semanal, sin el número
  de cada día ni el aviso diario, para quien marcó un cuidado (que incluye un trastorno de la alimentación),
  menores de 18 o quien lo pida (Pacanowski 2015; Neumark-Sztainer 2009; Golden 2016). Y el control, a medio
  paso con menos de 3 pesadas en la semana (es del área del control).
- **D8. El ciclo menstrual:** leerlo de Salud (un permiso más de HealthKit: toca la huella nativa, va en la
  próxima build y en las respuestas de privacidad) o una llave en Perfil. Con eso, no decir «más lento» ni
  «adelantado» en esos días y una nota («es normal pesar medio kilo más en estos días»: Kanellakis 2023).
- **D9. El peso de Ascent sin hora:** con la mitad del peso en la tendencia, o solo si cae cerca de lo
  esperado.
- **D10. Los planes largos** (más de 26 semanas o más del 15 % del peso): sugerir una primera etapa del 10 % y
  avisar que cerca de los 6 meses la pérdida suele frenarse (Franz 2007; la guía AHA/ACC/TOS 2013).
- **D11. La versión completa de A4:** un filtro de Kalman de tendencia lineal (nivel, pendiente y su
  incertidumbre en una sola cuenta, con pesadas a cualquier ritmo). Da lo mismo en la práctica y cuesta más.
- **D12. El agua del glucógeno al empezar:** no decir «adelantado» en las primeras 2 semanas de una dieta;
  una nota: «la primera semana se baja más rápido: parte es agua».

---

## 4. Lo que no se dice (o no se hace)

- **Una fecha de llegada con día exacto** con menos de 4 a 6 semanas de pesadas, ni la fecha como promesa.
- **«Adelantado», «más lento», «cambiando» o «sin cambios»** mientras el rango no lo permita, ni en las 2
  primeras semanas de una dieta ni en las 2 de mantenimiento (agua del glucógeno).
- **La grasa como «medida»**, con decimales o con un rango de 3 puntos; comparar dos estimaciones que difieren
  en menos de ~3 a 4 puntos; prometerle a una mujer que la cinta «ve» su cambio en pocas semanas.
- **Un peso meta con IMC menor de 20** como sugerencia (y nunca aceptar menos de 18,5); proponer bajar a quien
  ya está cerca de ese borde.
- **Bajar las calorías porque sube el peso** con «sin déficit» (embarazo, lactancia): es lo contrario de lo que
  se busca.
- **Empujar a pesarse a diario** a quien marcó un cuidado o a menores de 18; usar rojos o culpa con el peso (ya
  no se hace: que siga así).
- **«Metabolismo dañado», «modo ahorro», «reverse diet»:** no hay evidencia que los respalde.
- **Que entrenar fuerza evita «casi toda» la pérdida de músculo**, como si valiera para cualquiera: el 93,5 %
  es de mayores con obesidad.
- **Usar la bioimpedancia de una balanza** como si midiera la grasa, o en lugar del IMC (NICE 1.9.9).
- **El 7.700 como exacto:** siempre «unas X kcal».
- **Atribuirle a la sal** cada subida del día: el agua del glucógeno, el ciclo y el patrón del fin de semana
  pesan más y están mejor medidos.

---

## 5. Para «En qué se basa Moss»

Este párrafo da por hechos A4 (el ritmo con margen) y D2 (la grasa con ±4). Si no se adoptan, hay que sacar
«con un margen…» y «unos 4 puntos o más».

**Español (neutro, tú):**

> Tu peso sube y baja de un día a otro por el agua, lo que comiste el día anterior y, en las mujeres, el ciclo menstrual, así que Moss
> no se fija en el número de un día: sigue la tendencia de tus pesadas y calcula tu ritmo de las últimas
> semanas con un margen, porque con pocas semanas de datos todavía es incierto (Hall y Chow, 2011). Los ritmos
> que te propone no pasan del 1 % de tu peso por semana, lo que la investigación usa para bajar grasa cuidando
> el músculo (Helms y otros, 2014), y nunca acepta un peso meta por debajo de un índice de masa corporal de
> 18,5, el límite de la OMS. La grasa corporal con cinta usa la fórmula de la Marina de EE. UU.: es
> una estimación que puede diferir unos 4 puntos o más de un estudio de laboratorio (Foulis y otros, 2023), así
> que tómala como orientación. Para ver cómo cambia tu cuerpo, mira tu cintura: la guía NICE (2025) recomienda
> que mida menos de la mitad de tu altura.

**English:**

> Your weight goes up and down from day to day with water, what you ate the day before and, in women, the menstrual cycle, so Moss
> doesn't go by a single day's number: it follows the trend of your weigh-ins and calculates your rate over the
> last few weeks with a margin, because with only a few weeks of data it is still uncertain (Hall and Chow,
> 2011). The rates it suggests never go above 1% of your body weight per week, the range research uses to
> lose fat while protecting muscle (Helms et al., 2014), and it never accepts a goal weight below a body mass
> index of 18.5, the WHO threshold. Body fat from a tape measure uses the U.S. Navy formula: it is an estimate that can
> differ by about 4 points or more from a lab scan (Foulis et al., 2023), so take it as a guide. To see how
> your body is changing, watch your waist: the NICE guideline (2025) recommends keeping it under half your
> height.

---

## 6. Fuentes

«Entero» es el texto completo; «partes», las secciones pertinentes del texto completo; «resumen», solo el
resumen. Las de la industria lo dicen.

**El peso de cada día y la tendencia**
- Hall KD, Chow CC. Estimating changes in free-living energy intake and its confidence interval. *Am J Clin
  Nutr* 2011;94:66-74. doi:10.3945/ajcn.111.014399 — partes (PMC3127505).
- Kutáč P. Inter-daily variability in body composition among young men. *J Physiol Anthropol* 2015;34:32.
  doi:10.1186/s40101-015-0070-6 — partes (resultados; PMC4580369).
- Cheuvront SN, Carter R, Montain SJ, Sawka MN. Daily body mass variability and stability in active men
  undergoing exercise-heat stress. *Int J Sport Nutr Exerc Metab* 2004;14:532-540. doi:10.1123/ijsnem.14.5.532
  — resumen.
- Turicchi J y otros. Weekly, seasonal and holiday body weight fluctuation patterns among individuals engaged
  in a European multi-centre behavioural weight loss maintenance intervention. *PLoS One* 2020;15:e0232152.
  doi:10.1371/journal.pone.0232152 — resumen.
- Turicchi J y otros. Data imputation and body weight variability calculation using linear and nonlinear
  methods in data collected from digital smart scales. *JMIR mHealth uHealth* 2020;8:e17977.
  doi:10.2196/17977 — partes (PMC7519428).
- Orsama AL y otros. Weight rhythms: weight increases during weekends and decreases during weekdays. *Obes
  Facts* 2014;7:36-47 — partes (https://pmc.ncbi.nlm.nih.gov/articles/PMC5644907).
- Kanellakis S y otros. Changes in body weight and body composition during the menstrual cycle. *Am J Hum Biol*
  2023;35:e23951. doi:10.1002/ajhb.23951 — resumen.
- Koşar ŞN y otros. Whole and segmental body composition changes during mid-follicular and mid-luteal phases of
  the menstrual cycle in recreationally active young women. *Ann Hum Biol* 2022;49:124-132.
  doi:10.1080/03014460.2022.2088857 — resumen.
- White CP, Hitchcock CL, Vigna YM, Prior JC. Fluid retention over the menstrual cycle: 1-year data from the
  prospective ovulation cohort. *Obstet Gynecol Int* 2011:138451. doi:10.1155/2011/138451 — partes (PMC3154522).
- Kreitzman SN, Coxon AY, Szaz KF. Glycogen storage: illusions of easy weight loss, excessive weight regain,
  and distortions in estimates of body composition. *Am J Clin Nutr* 1992;56(1 Supl):292S-293S.
  doi:10.1093/ajcn/56.1.292s — resumen.
- Fernández-Elías VE y otros. Relationship between muscle water and glycogen recovery after prolonged exercise
  in the heat in humans. *Eur J Appl Physiol* 2015;115:1919-1926. doi:10.1007/s00421-015-3175-z — resumen.
- Heer M y otros. High dietary sodium chloride consumption may not induce body fluid retention in humans. *Am J
  Physiol Renal Physiol* 2000;278:F585-F595. doi:10.1152/ajprenal.2000.278.4.F585 — resumen.
- Walker J. *The Hacker's Diet*, «Signal and noise». https://www.fourmilab.ch/hackdiet/e4/signalnoise.html — la
  página (es el origen del método, no un estudio).
- Van der Bles AM y otros. The effects of communicating uncertainty on public trust in facts and numbers. *PNAS*
  2020;117:7672-7683. doi:10.1073/pnas.1913678117 — resumen.

**Pesarse**
- Steinberg DM y otros. The efficacy of a daily self-weighing weight loss intervention using smart scales and
  e-mail. *Obesity* 2013;21:1789-1797. doi:10.1002/oby.20396 — resumen.
- Steinberg DM, Bennett GG, Askew S, Tate DF. Weighing every day matters. *J Acad Nutr Diet* 2015;115:511-518.
  doi:10.1016/j.jand.2014.12.011 — resumen.
- Madigan CD y otros. Is self-weighing an effective tool for weight loss: a systematic literature review and
  meta-analysis. *Int J Behav Nutr Phys Act* 2015;12:104. doi:10.1186/s12966-015-0267-4 — resumen.
- Zheng Y y otros. Self-weighing in weight management: a systematic literature review. *Obesity*
  2015;23:256-265. doi:10.1002/oby.20946 — resumen.
- VanWormer JJ y otros. The impact of regular self-weighing on weight management: a systematic literature
  review. *Int J Behav Nutr Phys Act* 2008;5:54. doi:10.1186/1479-5868-5-54 — resumen.
- Wing RR y otros. A self-regulation program for maintenance of weight loss. *N Engl J Med* 2006;355:1563-1571.
  doi:10.1056/NEJMoa061883 — resumen.
- Benn Y y otros. What is the psychological impact of self-weighing? A meta-analysis. *Health Psychol Rev*
  2016;10:187-203. doi:10.1080/17437199.2016.1138871 — resumen.
- Shieh C y otros. Self-weighing in weight management interventions: a systematic review of literature. *Obes
  Res Clin Pract* 2016;10:493-519. doi:10.1016/j.orcp.2016.01.004 — resumen.
- Pacanowski CR, Linde JA, Neumark-Sztainer D. Self-weighing: helpful or harmful for psychological well-being?
  A review of the literature. *Curr Obes Rep* 2015;4:65-72. doi:10.1007/s13679-015-0142-2 — resumen
  (PMC4729441).
- Neumark-Sztainer D. Preventing obesity and eating disorders in adolescents: what can health care providers do?
  *J Adolesc Health* 2009;44:206-213. doi:10.1016/j.jadohealth.2008.11.005 — resumen.
- Golden NH y otros (AAP). Preventing obesity and eating disorders in adolescents. *Pediatrics*
  2016;138:e20161649. doi:10.1542/peds.2016-1649 — resumen.

**Los ritmos, la meta con plazo y la energía**
- Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation:
  nutrition and supplementation. *J Int Soc Sports Nutr* 2014;11:20. doi:10.1186/1550-2783-11-20 — resumen.
- Garthe I y otros. Effect of two different weight-loss rates on body composition and strength and
  power-related performance in elite athletes. *Int J Sport Nutr Exerc Metab* 2011;21:97-104.
  doi:10.1123/ijsnem.21.2.97 — resumen.
- Murphy C, Koehler K. Energy deficiency impairs resistance training gains in lean mass but not strength: a
  meta-analysis and meta-regression. *Scand J Med Sci Sports* 2022;32:125-137. doi:10.1111/sms.14075 — resumen.
- Ashtary-Larky D y otros. Effects of gradual weight loss v. rapid weight loss on body composition and RMR: a
  systematic review and meta-analysis. *Br J Nutr* 2020;124:1121-1132. doi:10.1017/S000711452000224X — partes.
- Purcell K y otros. The effect of rate of weight loss on long-term weight management: a randomised controlled
  trial. *Lancet Diabetes Endocrinol* 2014;2:954-962. doi:10.1016/S2213-8587(14)70200-1 — resumen.
- Nackers LM, Ross KM, Perri MG. The association between rate of initial weight loss and long-term success in
  obesity treatment. *Int J Behav Med* 2010;17:161-167. doi:10.1007/s12529-010-9092-y — resumen.
- Iraki J y otros. Nutrition recommendations for bodybuilders in the off-season: a narrative review. *Sports*
  2019;7:154. doi:10.3390/sports7070154 — resumen.
- Helms ER y otros. Effect of small and large energy surpluses on strength, muscle, and skinfold thickness in
  resistance-trained individuals. *Sports Med Open* 2023;9:102. doi:10.1186/s40798-023-00651-y — resumen.
- Weinsier RL, Wilson LJ, Lee J. Medically safe rate of weight loss for the treatment of obesity: a guideline
  based on risk of gallstone formation. *Am J Med* 1995;98:115-117. doi:10.1016/S0002-9343(99)80394-5 — resumen.
- Johansson K y otros. Risk of symptomatic gallstones and cholecystectomy after a very-low-calorie diet or
  low-calorie diet in a commercial weight loss program. *Int J Obes* 2014;38:279-284. doi:10.1038/ijo.2013.83 —
  resumen.
- Jensen MD y otros. 2013 AHA/ACC/TOS guideline for the management of overweight and obesity in adults.
  *Circulation* 2014;129(25 Supl 2):S102-S138. doi:10.1161/01.cir.0000437739.71477.ee — partes (las
  afirmaciones de evidencia; manuscrito en PMC5819889).
- Franz MJ y otros. Weight-loss outcomes: a systematic review and meta-analysis of weight-loss clinical trials
  with a minimum 1-year follow-up. *J Am Diet Assoc* 2007;107:1755-1767. doi:10.1016/j.jada.2007.07.017 —
  resumen.
- Magkos F y otros. Effects of moderate and subsequent progressive weight loss on metabolic function and adipose
  tissue biology in humans with obesity. *Cell Metab* 2016;23:591-601. doi:10.1016/j.cmet.2016.02.005 — resumen.
- Sardeli AV y otros. Resistance training prevents muscle loss induced by caloric restriction in obese elderly
  individuals: a systematic review and meta-analysis. *Nutrients* 2018;10:423. doi:10.3390/nu10040423 — resumen.
- Bouchard C y otros. The response to long-term overfeeding in identical twins. *N Engl J Med*
  1990;322:1477-1482. doi:10.1056/NEJM199005243222101 — resumen.
- Hall KD. Body fat and fat-free mass inter-relationships: Forbes's theory revisited. *Br J Nutr*
  2007;97:1059-1063. doi:10.1017/S0007114507691946 — resumen.
- Hall KD. What is the required energy deficit per unit weight loss? *Int J Obes* 2008;32:573-576.
  doi:10.1038/sj.ijo.0803720 — resumen.
- Hall KD y otros. Quantification of the effect of energy imbalance on bodyweight. *Lancet* 2011;378:826-837.
  doi:10.1016/S0140-6736(11)60812-X — partes (PMC3880593).
- MacroFactor. Cutting calculator. https://macrofactor.com/cutting-calculator/ — la página (industria: vende la
  app que Moss toma de modelo).

**El plan por etapas**
- Byrne NM y otros. Intermittent energy restriction improves weight loss efficiency in obese men: the MATADOR
  study. *Int J Obes* 2018;42:129-138. doi:10.1038/ijo.2017.206 — resumen.
- Peos JJ y otros. Continuous versus intermittent dieting for fat loss and fat-free mass retention in
  resistance-trained adults: the ICECAP trial. *Med Sci Sports Exerc* 2021;53:1685-1698.
  doi:10.1249/MSS.0000000000002636 — resumen.
- Poon ET y otros. Effects of intermittent dieting with break periods on body composition and metabolic
  adaptation: a systematic review and meta-analysis. *Nutr Rev* 2025;83:59-71. doi:10.1093/nutrit/nuad168 —
  resumen.
- Rodriguez Da Silva V, Muniz M, Shelton G, Arevalo D, Trexler ET y otros. The effects of reverse dieting on
  mitigating weight regain after a caloric deficit: a preliminary analysis. *J Int Soc Sports Nutr* 2025;22(Supl
  2):2550185. doi:10.1080/15502783.2025.2550185 — resumen (de congreso).

**La grasa, la cintura y el IMC**
- Foulis SA y otros. Body composition changes during 8 weeks of military training are not accurately captured by
  circumference-based assessments. *Front Physiol* 2023;14:1183836. doi:10.3389/fphys.2023.1183836 — entero.
- Taylor KM y otros. Development and cross-validation of a circumference-based predictive equation to estimate
  body fat in an active population. *Obes Sci Pract* 2024;10:e747. doi:10.1002/osp4.747 — partes (PMC11026907).
- Woolcott OO, Bergman RN. Relative fat mass (RFM) as a new estimator of whole-body fat percentage. *Sci Rep*
  2018;8:10980. doi:10.1038/s41598-018-29362-1 — partes (PMC6054651).
- Siedler MR y otros. Assessing the reliability and cross-sectional and longitudinal validity of fifteen
  bioelectrical impedance analysis devices. *Br J Nutr* 2023;130:827-840. doi:10.1017/S0007114522003749 —
  resumen.
- Frija-Masson J y otros. Accuracy of smart scales on weight and body composition: observational study. *JMIR
  mHealth uHealth* 2021;9:e22487. doi:10.2196/22487 — resumen.
- Barrios P, Martin-Biggers J, Quick V, Byrd-Bredbenner C. Reliability and criterion validity of self-measured
  waist, hip, and neck circumferences. *BMC Med Res Methodol* 2016;16:49. doi:10.1186/s12874-016-0150-2 —
  partes (PMC4855335).
- Carranza Leon BG, Jensen MD, Hartman JJ, Jensen TB. Self-measured vs professionally measured waist
  circumference. *Ann Fam Med* 2016;14:262-266. doi:10.1370/afm.1896 — partes.
- NICE. Overweight and obesity management (NG246), 2025, revisada el 8/1/2026: el capítulo «Identifying and
  assessing overweight, obesity and central adiposity» y «Update information».
  https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity
  — entero (esos capítulos).
- Ross R y otros. Waist circumference as a vital sign in clinical practice: a Consensus Statement from the IAS
  and ICCR Working Group on Visceral Obesity. *Nat Rev Endocrinol* 2020;16:177-189.
  doi:10.1038/s41574-019-0310-7 — partes (PMC7027970).
- Ashwell M, Gunn P, Gibson S. Waist-to-height ratio is a better screening tool than waist circumference and
  BMI for adult cardiometabolic risk factors. *Obes Rev* 2012;13:275-286. doi:10.1111/j.1467-789X.2011.00952.x
  — resumen.
- Rubino F y otros. Definition and diagnostic criteria of clinical obesity. *Lancet Diabetes Endocrinol*
  2025;13:221-262. doi:10.1016/S2213-8587(24)00316-4 — partes (PMC11870235).
- Global BMI Mortality Collaboration. Body-mass index and all-cause mortality: individual-participant-data
  meta-analysis of 239 prospective studies in four continents. *Lancet* 2016;388:776-786.
  doi:10.1016/S0140-6736(16)30175-1 — partes (PMC4995441).
- Winter JE y otros. BMI and all-cause mortality in older adults: a meta-analysis. *Am J Clin Nutr*
  2014;99:875-890. doi:10.3945/ajcn.113.068122 — resumen.
- OMS. Nutrition Landscape Information System: malnutrition in women (los cortes del IMC).
  https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women — la página.

**El embarazo**
- Institute of Medicine y National Research Council. *Weight Gain During Pregnancy: Reexamining the
  Guidelines*. 2009. doi:10.17226/12584 — partes (el resumen del informe y su tabla S-1).
- Bodnar LM, Siega-Riz AM y otros. Severe obesity, gestational weight gain, and adverse birth outcomes. *Am J
  Clin Nutr* 2010;91:1642-1648. doi:10.3945/ajcn.2009.29008 — partes.

**Citadas por Moss que no se pudieron verificar:** Hodgdon y Beckett 1984 (los informes de la Marina, en DTIC,
estaban en mantenimiento): sus errores estándar (3,5 y 3,6) y la dirección de sus errores (sobreestima a los
magros, subestima a los de más grasa) se tomaron de cómo los describe Foulis 2023 (citando a Hodgdon y Friedl
1999: error estándar de 3 a 4 puntos, repetible dentro de 1 punto con personal entrenado).

---

## Anexo: las simulaciones

Persona de 80 kg que baja 0,4 kg por semana (0,5 %), meta 72 kg; 1.500 a 2.000 series por caso. «Ruido que
dura» es ρ = 0,6 con 0,5 kg de desvío; «+ semana + ciclo» suma el patrón semanal (0,35 %) y +0,45 kg cinco
días cada 28.

| Caso | Semana | Error típico del ritmo de Moss (kg/sem) | «Al ritmo» con el ritmo justo en el plan | Fecha a tu ritmo menos la real (semanas, 5–95 %) |
|---|---|---|---|---|
| Diario, ruido independiente | 3 | 0,11 | 64 % | −4,7 a +16,7 |
| Diario, ruido independiente | 6 | 0,06 | 94 % | −1,1 a +7,0 |
| Diario, ruido que dura | 3 | 0,20 | 39 % | −7,1 a +30,7 |
| Diario, ruido que dura | 6 | 0,09 | 72 % | −2,9 a +13,1 |
| Diario, ruido que dura | 12 | 0,09 | 71 % | −1,7 a +7,7 |
| Diario, + semana + ciclo | 4 | 0,22 | 35 % | −7,1 a +37,4 |
| 3 por semana, ruido que dura | 4 | 0,21 | 35 % | −7,0 a +39,3 |
| 1 por semana, ruido que dura | 4 | 0,24 | 31 % | −7,6 a +37,6 |
| 1 por semana, ruido que dura | 12 | 0,11 | 61 % | −2,1 a +10,9 |

La recta por promedios semanales con rango al 80 % (A4): cubrió la verdad el 85 % (4 semanas) y el 81 % (6)
con ruido que dura, semana y ciclo; el medio ancho fue ±0,23 y ±0,11 kg/sem pesándose a diario, y ±0,35 y
±0,17 una vez por semana. Con el ritmo justo en el plan dijo «al ritmo» el 92–99 % de las veces a las 4–6
semanas. Pesándose a diario, con el ritmo de verdad en la mitad del plan avisó «más lento» el 40 % a las 6
semanas y el 68 % a las 8 (Moss hoy, 84 %); con el doble, «adelantado» el 97–100 % (Moss hoy, 100 %). Una vez
por semana: 25 y 43 % con la mitad, 81 y 98 % con el doble.

Manteniendo con el peso quieto, Moss dijo «Cambiando» el 20 % (ruido independiente) y el 46–48 % (ruido que
dura) a las 3–4 semanas; el 11–12 % a las 9–17 semanas; una vez por semana, el 51–54 % y el 22–26 %. Con la
regla propuesta, el 0–4 % (y «todavía no se sabe» el 14 % a las 4 semanas pesándose a diario, el 48 % una vez
por semana); con una deriva real de +0,3 kg por semana, avisó el 64 % a las 6 semanas pesándose a diario.
