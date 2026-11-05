# Las metas de comida y el gasto: qué hace Moss, qué dice la evidencia y qué cambiar

Estudio del 5/11/2026. Área: el gasto (en reposo, la vida diaria y el entrenamiento), el control de cada
semana, el tamaño del déficit y del superávit, el piso de calorías, los macros (proteína, grasas,
carbohidratos y estilos), la fibra, el agua, las referencias de micronutrientes y los umbrales de «muy bajo».

**Lo que leí de Moss:** `src/dominio/metas.ts`, `cuestionario.ts`, `control.ts`, `micronutrientes.ts`,
`loQueFalta.ts`, `paraHoy.ts`, `dejaElDia.ts`; además `progreso.ts` (D35), `entrenamiento.ts` (los MET y la
proteína después de entrenar), `registros.ts:176-186` (lo que entra al control), `segunElDeporte.ts:305-322`
(el hierro y el calcio), `src/almacen/almacen.ts:495-512` (cómo corre el control), `metas.test.ts`, la
galería (`entrada.js:543-566, 2058-2063`, `galeria.js:330-345`) y los textos de `es.json`. En `spec/`:
`nutricion.md` («Las metas» y «El cuestionario nuevo»), `decisiones.md` (D21, D35 y «La seguridad»),
`evidencia-1.1.md` (5) y `entreno.md` (2.5, 4, 5.12 y 7).

**Convenciones:** «derivado» es una cuenta mía con las fuentes, no un resultado publicado. Las cuentas se
pueden repetir con `node` en `scratchpad/calc/cuentas.mjs` y `scratchpad/calc/macros.mjs` (no tocan el
repo). «MA» es metaanálisis, «RS» revisión sistemática, «ECA» ensayo controlado aleatorizado.

---

## 1. Resumen

1. **La arquitectura se sostiene.** Arrancar con una fórmula y medir el gasto cada semana con lo anotado y
   la tendencia del peso, sin «compensar», es lo correcto: con pesadas repetidas, los cambios de lo que se
   come se estimaron con un sesgo de menos de 40 kcal/día contra agua doblemente marcada y DXA, en 140
   personas durante dos años (Sanghvi y otros, 2015). Los ritmos (bajar 0,25–0,75 % del peso por semana; subir 0,1–0,4 %), la
   proteína (1,2–2,2 g/kg; 2,0 al bajar), los estilos como preferencia y las referencias NASEM desde los 19
   años coinciden con la mejor evidencia.
2. **El control tiene un error que sesga** (`control.ts:47`): después de la última pesada, el peso se repite
   plano hasta ayer. Con una pesada por semana, el ritmo medido sale un 23 % más lento que el real (125
   kcal/día de error con −0,5 kg/sem); con una sola pesada en el tramo, toma lo comido como gasto (550
   kcal/día). En el lazo cerrado, quien se pesa una vez por semana baja (o sube) ~30 % más rápido de lo que
   eligió (derivado). Arreglo: la pendiente con las pesadas reales, sin inventar puntos.
3. **El control mide con muy pocos datos y con una ganancia fija.** Pide 1 pesada y 7 días, y toma siempre
   el 25 % de la diferencia. Con 7 días de pesadas diarias, el gasto medido tiene un error de ±580 a 870
   kcal/día; con 21 días, ±110 a 170 (derivado). Hall y Chow (2011) piden más de 28 días de pesadas diarias
   para un intervalo del 95 % de ±300 kcal/día. Lo confiable es que lo que se mueve dependa de la
   incertidumbre (un filtro de Kalman) y mostrar el gasto con su rango.
4. **La «equilibrada» deja de serlo con mucho peso** (`metas.ts:157-161`). La grasa mínima (0,6 g/kg) y la
   proteína (2,0 g/kg) van por el peso de hoy: una mujer de 45 años, 165 cm y 140 kg, sentada y bajando
   rápido, queda en 1.610 kcal con 47 % de grasas y 13 % de carbohidratos; con 160 kg y 1.400 kcal, 0 g de
   carbohidratos, 62 % de grasas y macros que suman 1.424 kcal (el test de `metas.test.ts:81` pasa igual).
   Con el tope de déficit de D35, el techo del 35 % de las grasas (el rango aceptable del IOM) y el peso de
   un IMC de 30 como referencia (Weijs, 2024), la misma mujer queda en 1.760 kcal con 27 % de grasas y 36 %
   de carbohidratos.
5. **El gasto de arranque está corrido hacia abajo.** «Sentado» es 1,35 × Mifflin, pero la ecuación de las
   Academias Nacionales (NASEM 2023, 8.600 mediciones con agua doblemente marcada) para «inactivo» da
   1,46–1,55 × Mifflin en tres personas de ejemplo, y la FAO/OMS/UNU (2004) pone la vida sedentaria en
   1,40–1,69 (el oficinista, 1,53). Para el ejemplo de la galería: Moss 2.400 kcal, NASEM inactivo 2.607.
   Propuesta: 1,45, y mostrar «unas 2.560 kcal (±10 %)».
6. **Moss se salta su propio límite.** Bajar «rápido» (0,75 %) pasa de 1.000 kcal de déficit por día desde
   los 122 kg y de 1 kg por semana desde los 134, y la fecha elegida (D35) puede pedir cualquier ritmo, hasta
   el piso. D35
   llama a eso «muy agresivo», pero el tope está solo en el aviso (`progreso.ts:156-157`), no en la meta.
7. **El piso de 1.200/1.500 kcal es una convención.** La guía AHA/ACC/TOS 2013 da 1.200–1.500 (mujeres) y
   1.500–1.800 (hombres) como la meta habitual de una dieta para bajar, «ajustada al peso»; lo que pide
   supervisión médica es menos de 800 kcal. Puede quedarse, pero no se presenta como «lo que el cuerpo
   necesita».
8. **7.700 kcal por kilo** vale para quien tiene más de 30 kg de grasa y exagera en los más magros (Hall,
   2008), pero en el control se cancela: mide y receta con el mismo número, así que cambia el gasto que se
   muestra, no el ritmo que se logra. Lo que sí desarma el control al empezar es el agua del glucógeno (3 a 4
   g por gramo, Kreitzman 1992): la primera semana de un déficit puede subir la meta 300 a 400 kcal
   (derivado).
9. **Micronutrientes, fibra y agua.** Los valores NASEM están bien desde los 19, pero de 16 a 18 Moss usa los
   de adultos (calcio 1.000 en vez de 1.300; fósforo 700 en vez de 1.250; cafeína 400 mg en vez de 3 mg/kg).
   La fibra a 14 g cada 1.000 kcal da 17 g con 1.200 kcal; la OMS (2023) y la EFSA piden al menos 25 g. Dos
   litros de agua sola no son una necesidad (EFSA: 2,0 L en mujeres y 2,5 L en hombres, contando todas las
   bebidas y la comida), y «Vas bajo de agua hoy» no mide la hidratación. «Tu hierro viene bajo» con la RDA
   (18 mg) salta en casi todas las mujeres: según el IOM (2000), debajo del EAR (8,1 mg) «muy
   probablemente» falta, y entre el EAR y la RDA solo «probablemente».
10. **Falta lo que la evidencia pide:** preguntar por los días anotados a medias (MacroFactor lo hace), que
    el control use la proteína, la fecha y la recomposición del cuestionario nuevo (hoy vuelve a las de
    fábrica), recomposición solo con pesas, nada de keto con «sin déficit» (ADA 2019), el peso meta mínimo
    para mayores de 65 (IMC 23; Winter 2014) y una referencia de sodio y de grasas saturadas.

---

## 2. Tabla de veredictos

| Qué calcula Moss | Dónde | Veredicto | La mejor evidencia | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| Gasto en reposo: Mifflin-St Jeor, 10·kg + 6,25·cm − 5·edad + 5 (h) o − 161 (m) | `metas.ts:113-115` | **Se sostiene** en adultos; **a medias** en atletas y mayores | Mifflin 1990 (n=498, 19–78 años, 234 con obesidad). Frankenfield 2005 (RS de 4 ecuaciones: la más confiable). Frankenfield 2013 (n=337: 82 % dentro de ±10 %; 87 % sin obesidad y 75 % con obesidad; sin sesgo). Cioffi 2021 (RS en mayores, 14 estudios: sesgo −0,3 %, 61 % dentro de ±10 %). O'Neill 2023 (MA en atletas, 29 estudios, n=1.430: 52 % dentro de ±10 %, entre las que peor andan) | Mifflin por defecto; decir que en mayores y atletas el margen es mayor; mostrar un rango | sexo, edad, altura, peso | Sí |
| Gasto en reposo con la grasa: «Katch-McArdle», 370 + 21,6 × masa magra | `cuestionario.ts:49-50, 188-190` | **A medias**: la ecuación es la de Cunningham (1991); con la grasa de una figura suma error | Cunningham 1991 (síntesis: la masa magra explica 65–90 % del gasto en reposo). O'Neill 2023: Cunningham 1991 no difiere de lo medido en atletas; Cunningham 1980, 54 % dentro de ±10 % | Cunningham con la grasa medida (balanza, estudio) o la cinta; con la figura, el promedio con Mifflin (decisión) | % de grasa y cómo se supo | Sí (`GrasaDicha.como`) |
| La vida diaria: sentado 1,35, de pie 1,5, físico 1,7 (y en la 1.0, `NIVELES` 1,35/1,5/1,65/1,85) | `cuestionario.ts:57-62`; `metas.ts:63` | **A medias**: separar la vida diaria está bien; «sentado» queda bajo | NASEM 2023 (8.600 mediciones con agua doblemente marcada; inactivo: PAL 1,00–1,53; error de 246 kcal en mujeres y 339 en hombres; inactivo ≈ 1,46–1,55 × Mifflin, derivado). FAO/OMS/UNU 2004 (sedentario 1,40–1,69; oficinista 1,53). La cita de Moss (IOM 2005) está reemplazada | sentado 1,45; de pie 1,6; físico 1,75 (o NASEM 2023 por categoría); rango ±10 % | cuánto se mueve | Sí |
| El entrenamiento aparte y neto: (MET − 1) × kg × horas, día por día y promediado | `cuestionario.ts:155, 171-179`; `entrenamiento.ts:46-48` | **Se sostiene** la idea (evita el doble conteo); el número erra mucho | Pontzer 2016 (n=332, agua doblemente marcada: el gasto total sube con la actividad y se aplana en los más activos). El Compendio (METs corregidos): el MET estándar erra más en mayores, con sobrepeso y en mujeres | igual, dentro del rango; con mucho entrenamiento (más de ~7 h/sem), un descuento (decisión) | deportes, días, minutos | Sí |
| Los pasos de Salud sugieren el movimiento: <5.000 sentado, >10.000 físico | `cuestionario.ts:64-73` | **A medias**: las categorías sí; quien corre o juega suma sus pasos del entrenamiento dos veces | Tudor-Locke y Bassett 2004 (revisión: <5.000 sedentario; 5.000–7.499, la vida diaria sin deporte; ≥10.000 activo) | sugerir con los días sin sesión, o no sugerir «físico» por pasos con correr o partidos | pasos por día, días de sesión | Sí |
| Las kcal activas del reloj | no se usan | **Se sostiene** no usarlas | Choe y Kang 2025 (MA, 56 estudios: el gasto erra más del 10 % en todos los subgrupos; ~28 % de error medio según el comunicado de la universidad) | no sumarlas a la meta | — | — |
| Gasto medido = comida promedio − cambio de la tendencia × 7.700 ÷ días | `control.ts:149-152` | **Se sostiene** el principio | Sanghvi 2015 (validación en CALERIE, n=140, 2 años: sesgo <40 kcal/día, error individual 215). Hall y Chow 2011 (modelo y simulaciones). Burrows 2019 (RS, 59 estudios, n=6.298: lo anotado subestima; con apps, 5 a 37 %) | igual, rotulado «según lo que anotas» | lo anotado, las pesadas | Sí |
| El peso de cada día: interpola entre pesadas y repite la última hasta ayer | `control.ts:38-50` (47) y `69-82` | **Refutado** (sesga) | Derivado: pesadas los días 0, 7 y 14 y fin el 20 → −0,39 kg/sem en vez de −0,50 (125 kcal/día); una pesada → 0 (550 kcal/día). Con las pesadas reales, 0 | pendiente por mínimos cuadrados sobre las pesadas reales, sin puntos inventados | fecha y kilos de cada pesada | Sí |
| Lo mínimo: 4 días con comida y 1 pesada en la última semana; tramo ≥7 días | `control.ts:20-24, 140-144` | **Refutado** como suficiente para medir | Hall y Chow 2011: más de 28 días de pesadas diarias para un IC 95 % <300 kcal/día. Derivado (ruido de 0,4–0,6 kg): 7 días → ±580–870; 21 días → ±110–170; una pesada por semana en 21 días → ±200–300 | ≥3 pesadas que cubran ≥10 días del tramo y la última a ≤3 días de ayer, o la ganancia según la incertidumbre (fila siguiente) | pesadas con fecha | Sí |
| El suavizado: el 25 % de la diferencia por semana; la mitad con todo a ojo | `control.ts:26, 32, 155` | **Es una convención** (la dirección es razonable) | MacroFactor: la estimación se mueve desde la primera semana y se aquieta entre los 14 y 30 días. Hall y Chow 2011 | ganancia de Kalman: K = P/(P+R), con P₀ = (0,12 × gasto)² y R del error de la pendiente y de lo comido | los residuos de las pesadas | Sí |
| Un día anotado a medias cuenta como un día entero | `registros.ts:176-186`; `control.ts:134, 148-149` | **Refutado** (sesga hacia abajo) | MacroFactor (ayuda 29 y módulo de registro parcial: los días en blanco se saltan; los días a medias arruinan la estimación unas tres semanas; se pregunta por los que quedan muy por debajo de lo habitual) | en el control, preguntar por los días con menos del 50 % de la mediana de 21 días; los marcados no cuentan | kcal por día | Sí |
| 7.700 kcal por kilo | `metas.ts:71`; `control.ts:152`; `progreso.ts:162` | **A medias**: exagera en los magros, pero el lazo lo cancela | Hall 2008 (modelo: 3.500 kcal/lb vale con más de 30 kg de grasa; con menos, sobra). Thomas 2013 (la regla estática sobrestima lo que se baja: Moss no la usa para predecir, re-mide cada semana) | dejarlo; rotular el gasto como aproximado; opcional, la densidad según la composición | grasa | Parcial |
| La primera semana de un déficit (el agua del glucógeno) | no se trata | **Refutado** (falta) | Kreitzman 1992 (el glucógeno lleva 3–4 g de agua por gramo). MacroFactor (la meta se corre y vuelve en una o dos semanas). Derivado: con 1,5 kg de agua en la semana 1, el gasto medido da 4.100 en vez de 2.400 y la meta sube 425 kcal | no contar los primeros 7 días de cambio de peso después de pasar a bajar o a keto/baja en carbohidratos | la fecha del cambio | Sí (`MetaGuardada.desde`, `motivo`) |
| Bajar: 0,25 / 0,5 / 0,75 % del peso por semana | `metas.ts:65-69` | **Se sostiene** | Helms 2014 (revisión: 0,5–1 %/sem). Garthe 2011 (ECA, n=24 atletas: con 0,7 % la masa magra subió 2,1 %; el rápido logró 1,0 % y no cambió). Ashtary-Larky 2020 (MA, 7 ensayos, n=361 con sobrepeso: igual peso perdido, 1 kg más de grasa con lo gradual, sin diferencia en masa magra). Purcell 2014 (ECA, n=200: lo recuperado a las 144 semanas fue igual) | igual | peso | Sí |
| El tope de 1 kg/sem y 1.000 kcal/día | solo en el aviso: `progreso.ts:154-170` | **Refutado** en la meta | D35 y Helms 2014. Derivado: el 0,75 % pasa las 1.000 kcal/día desde 122 kg y el kilo por semana desde 134 (150 kg → 1.238 kcal y 1,13 kg/sem); la fecha (`entrada.js:2060-2063`, desde una semana) puede pedir hasta el piso | déficit = min(ritmo, 1 kg/sem, 1.000 kcal/día) en `metaPara` y `metaDelCuestionario` | peso | Sí |
| Subir: 0,1 / 0,25 / 0,4 %; el suave con más de 3 años de pesas | `metas.ts:66-69`; `cuestionario.ts:241-248` | **Se sostiene** | Iraki 2019 (revisión: 0,25–0,5 %/sem en principiantes e intermedios, superávit de 10–20 %). Helms 2023 (ECA, n=17 entrenados, 8 semanas: +15 % sumó grasa, no músculo, contra +5 %) | igual | años con pesas | Sí |
| El músculo por mes según la experiencia (el modelo de Aragon) | `cuestionario.ts:241-245` | **Es una convención** (un modelo de libro) | Benito 2020 (MA, 111 estudios, n=1.927: +1,5 kg de masa muscular con los programas de pesas, sin moderadores claros) | usarlo solo para elegir el ritmo, sin prometer kilos | — | — |
| El piso: 1.200 kcal (m) y 1.500 (h); las metas a mano debajo no se guardan | `metas.ts:77-78, 134-136, 172` | **Es una convención** | Jensen 2014 (guía AHA/ACC/TOS 2013): 1.200–1.500 y 1.500–1.800 son la meta «habitual» para bajar, «ajustada al peso y la actividad», o un déficit de 500–750 kcal; menos de 800 kcal, con supervisión médica | mantenerlo; en quien entrena mucho y sabe su masa magra, además 30 kcal por kilo de masa magra después del entrenamiento (ACSM 2016) | masa magra, entrenamiento | Parcial |
| El peso meta mínimo: IMC 18,5 | `metas.ts:74-75, 128`; `cuestionario.ts:300-306` | **Se sostiene** en adultos; **a medias** desde los 65 | Winter 2014 (MA, 32 estudios, n=197.940 mayores de 65: más mortalidad con IMC por debajo de 23; observacional) | IMC 23 desde los 65 (decisión) | edad | Sí |
| El peso meta que se propone: ±5 % | `cuestionario.ts:308-313` | **Se sostiene** | Jensen 2014: con 5 % menos, la presión baja ~3/2 mmHg; con 5–10 %, la HbA1c baja 0,6–1,0 | igual | — | Sí |
| Proteína: 2,0 (bajar) / 1,6 (mantener) / 1,8 (subir), entre 1,2 y 2,2 g/kg; por nivel; por masa magra con la grasa | `metas.ts:79-80`; `cuestionario.ts:257-280` | **Se sostiene** | Morton 2018 (MA, 49 ECA, n=1.863: más allá de 1,62 g/kg no sumó masa magra). Nunes 2022 (MA, 74 ECA: efecto con ≥1,6 g/kg antes de los 65 y con 1,2–1,59 después). Helms 2014 (2,3–3,1 g/kg de masa magra en déficit). Wycherley 2012 (MA, 24 ensayos, n=1.063: +0,43 kg de masa magra con más proteína en déficit). Longland 2016 (ECA, n=40: 2,4 contra 1,2 g/kg con 40 % de déficit: +1,2 contra +0,1 kg de masa magra). Devries 2018 (MA, 28 estudios, n=1.358: sin daño renal en personas sanas) | igual | peso, grasa | Sí |
| Proteína por el peso de hoy, sin la grasa, con obesidad | `metas.ts:149`; `cuestionario.ts:278` | **A medias** | Weijs 2024 (revisión: no hay ensayos; propone ≥1,2 g/kg con el peso topeado en un IMC de 30). Derivado: 110 kg y 160 cm → 220 g; con el peso de IMC 30, 154 g | con IMC >30, por el peso de un IMC de 30 (decisión) | altura | Sí |
| Proteína con «sin déficit» | no cambia | **A medias** (es el pendiente 2 de `entreno.md`) | KDIGO 2024 (por el resumen de NephJC: 0,8 g/kg en enfermedad renal G3–G5; no pasar de 1,3 con riesgo de progresión). PROT-AGE 2013: 1,2–1,5 con enfermedad en mayores | decisión del dueño | la condición (no se guarda) | No |
| Proteína hasta el 40 % de las kcal | `metas.ts:81-82, 157` | **Es una convención** (fuera del rango del IOM, 10–35 %) | NASEM 2024 (carta sobre los rangos del IOM 2005: proteína 10–35 %, grasas 20–35 %, carbohidratos 45–65 %) | igual (en déficit, 35 % se queda corto) | — | Sí |
| Grasas: al menos 27 % y 0,6 g/kg; la baja en grasas, 20 % | `metas.ts:83-87, 160` | **A medias** | NASEM 2024: 20–35 %. ACSM 2016: no bajar de 20 % de forma crónica. Iraki 2019: 0,5–1,5 g/kg en culturistas. OMS 2023: grasas totales ≤30 %, saturadas ≤10 %, trans ≤1 % | el 0,6 g/kg con el peso de referencia y nunca más del 35 % en la equilibrada | altura | Sí |
| Carbohidratos: lo que queda | `metas.ts:161` | **Se sostiene** en general; **a medias** en resistencia | ACSM 2016 (posición: 3–5 g/kg liviano; 5–7 con ~1 h/día; 6–10 con 1–3 h; 8–12 con 4–5 h) | avisar si quien corre, pedalea o nada ≥1 h/día queda debajo de 5 g/kg (pendiente 6 de `entreno.md`) | sesiones del día | Sí |
| Estilos: equilibrada, baja en grasas (20 %), baja en carbohidratos (25 %), keto (30 g) | `metas.ts:21-26, 86-91, 156-167` | **Se sostiene** como preferencia; **a medias** el keto y el nombre de «baja» | DIETFITS (Gardner 2018, ECA, n=609: −5,3 contra −6,0 kg al año, sin diferencia). Ge 2020 (MA en red, 121 ECA, n=21.942: iguales a los 6 meses; se borran a los 12). Hall y Guo 2017 (MA de 32 estudios de alimentación controlada: con menos grasa, +26 kcal/día de gasto y +16 g/día de grasa perdida). ADA 2019 (baja: 26–45 %; muy baja: <26 % o 20–50 g sin la fibra; cautela con embarazo, enfermedad renal y trastornos de la alimentación) | presentarlos como gusto; keto en carbohidratos sin la fibra; nada de keto con «sin déficit» | fibra | Sí |
| Fibra: 14 g cada 1.000 kcal, meta suave | `metas.ts:97-98` | **A medias** | OMS 2023 (≥25 g/día de fibra natural en adultos). EFSA 2017 (ingesta adecuada: 25 g). Reynolds 2019 (185 cohortes y 58 ensayos: el mayor beneficio con 25–29 g) | máx(25, 14 × kcal ÷ 1.000) desde los 18 | edad, kcal | Sí |
| Agua: 2.000 ml; «muy bajo» con menos del 40 % a la tarde o del 50 % desde las 15 | `loQueFalta.ts:81-83, 186-204`; `paraHoy.ts:66-68, 107`; `widgets/index.ts:32` | **A medias**: una convención dicha como necesidad | EFSA 2017 (agua total, de todas las bebidas y de la comida: 2,0 L mujeres, 2,5 L hombres; +0,3 L en el embarazo, +0,7 en la lactancia; con clima y actividad moderados). Yamada 2022 (n=5.604, 23 países: el recambio varía con el tamaño, la actividad y el clima) | una meta propia, sin «te faltan»; contar todas las bebidas | lo que se bebe | Parcial (solo los vasos) |
| Referencias de micronutrientes (NASEM) por sexo y edad | `micronutrientes.ts:51-99` | **Se sostiene** desde los 19; **refutado** de 16 a 18 | NASEM 2019, apéndice J (14–18: calcio 1.300; fósforo 1.250; hierro 11 h / 15 m; magnesio 410/360; potasio 3.000/2.300; zinc m 9; vitamina C 75/65; vitamina K 75; tiamina y riboflavina m 1,0; B6 m 1,2). EFSA 2017 da otras cifras (hierro 16 en mujeres, vitamina C 110/95, folato 330, B12 4): son elecciones distintas | agregar el tramo de 14 a 18 | edad | Sí |
| Embarazo y lactancia | `micronutrientes.ts:77-82, 92-96` | **Se sostiene** (coincide con NASEM), pero nunca se usa | La app no guarda la etapa: `HojaRegistro.tsx:258` pasa solo sexo y edad | dejarlo como está | etapa | No |
| Cafeína: tope de 400 mg (200 en embarazo y lactancia) | `micronutrientes.ts:84-86, 93` | **A medias**: falta de 16 a 17 | EFSA 2015 (por EUFIC): 400 mg/día en adultos, 200 por toma, 3 mg/kg en adolescentes | 3 mg/kg antes de los 18 | peso | Sí |
| Lo que se destaca: al menos el 10 % de la referencia | `micronutrientes.ts:108-121` | **Se sostiene** | FDA 21 CFR 101.54: «buena fuente» 10–19 %; «alto» desde 20 % | igual | — | Sí |
| «Tu hierro (o calcio) viene bajo»: promedio de 14 días debajo de la RDA | `segunElDeporte.ts:305-322` (320-321) | **A medias**: debajo de la RDA es «probablemente», no «falta»; y salta en casi todas las mujeres | IOM 2000 (para una persona: debajo del EAR, «muy probablemente» hay que mejorar; entre el EAR y la RDA, «probablemente»; lo de pocos días no es la ingesta habitual). NASEM 2019: EAR del hierro 8,1 mg (mujeres 19–50), 6 (hombres). IOM 2001: la dieta vegetariana absorbe un 10 % del hierro contra 18 % | «bajo» debajo del EAR; entre EAR y RDA, «podría faltarte» | días bien anotados | Sí |
| «Muy bajo»: proteína si faltan 25 g; kcal si faltan 400 y el 20 % | `loQueFalta.ts:74-80, 138-149` | **Es una convención** razonable | ACSM 2016 (0,25–0,3 g/kg o 15–25 g por comida). Schoenfeld y Aragon 2018 (0,4 g/kg en 4 comidas) | igual (25 g es una comida) | — | Sí |
| «Para hoy»: el reparto, las grasas de más, la proteína desde las 16 | `paraHoy.ts:48-67` | **Es una convención** | — | igual | — | Sí |
| Recomposición: mantener o −0,25 %/sem con grasa ≥25 % (h) o ≥32 % (m); proteína 1,8–2,2 | `cuestionario.ts:217-236, 266` | **A medias**: el umbral es una convención (ACE); falta pedir pesas | Barakat 2020 (revisión narrativa: también ocurre en entrenados, con pesas progresivas y buena nutrición). Longland 2016 (en déficit, con pesas y 2,4 g/kg). Murphy y Koehler 2022 (MA: el déficit frena la masa magra, ES −0,57; unas 500 kcal/día ya la impiden; la fuerza no) | ofrecerla con pesas (o avisar); seguirla con cinta y fuerza, no con la balanza | entrena fuerza | Sí |
| «Sin déficit»: bajar queda en mantener; no se pregunta la grasa | `metas.ts:122-125`; `cuestionario.ts:221-223`; `loQueFalta.ts:178` | **Se sostiene** | Levinson 2017 (encuesta, n=105 con trastorno de la alimentación: el 73 % de quienes usaban MyFitnessPal sintió que lo empeoraba). ADA 2019 (la muy baja en carbohidratos, sin recomendarla en embarazo, enfermedad renal o trastornos de la alimentación) | además, sin keto | — | Sí |
| Menores de 18: bajar «rápido» no está | `metas.ts:117-120`; `cuestionario.ts:341-345` | **A medias** | Mifflin 1990 (19–78 años: no incluye adolescentes); NASEM 2023 tiene ecuaciones de 14 a 18. Golden 2016 (AAP: el foco en los hábitos, no en el peso) | de 16 a 17, NASEM 2023 y sin déficit salvo decisión | edad | Sí |
| El control usa la meta de fábrica, no la del cuestionario nuevo | `control.ts:158` → `metas.ts:148-174`; `galeria.js:336-345` | **Refutado** (integración) | — (es lógica): `metaPara` usa `RITMOS` y `PROTEINA_POR_KG`; pierde la proteína del nivel o por masa magra, el ritmo de la fecha y la recomposición | `metaPara` con los gramos de proteína, el % del plan y la recomposición | lo del cuestionario | Sí (en la galería) |
| Repartir la semana; brilla y tiembla; cómo deja el día | `metas.ts:105-110, 192-212`; `dejaElDia.ts:13-19` | **Es una convención** (inofensiva); `dejaElDia` es aritmética | — | igual | — | Sí |

---

## 3. Cambios propuestos

### 3.1 Arreglos claros

**A1. El control mide la pendiente con las pesadas reales.** `control.ts:38-82` y `:150-152`.
`cambioPorDia` hoy hace mínimos cuadrados sobre todos los días del tramo, inventados por interpolación y,
después de la última pesada, repetidos (`:47`). Cambio: mínimos cuadrados sobre las pesadas que caen en
`[inicio, fin]`, sin puntos inventados; si hay menos de 2, o la primera y la última están a menos de 7 días,
`faltanDatos`. La tendencia (`tendencia`, α = 0,1) sigue para mostrar, pero el control no la usa: en estado
estable da lo mismo y, cuando el ritmo cambia, se atrasa unos 9 días.
- Test: «con una pesada por semana, el ritmo medido es el real»: pesadas los lunes con −0,5 kg/sem en línea
  recta, control un lunes → `cambioDeTendencia / dias × 7` entre −0,52 y −0,48 (hoy da −0,39).
- Test: «una sola pesada en el tramo no mide» → `motivo: 'faltanDatos'` (hoy toma lo comido como gasto).

**A2. El tope de D35 va en la meta.** `metas.ts:139-142` (`ajusteDiario`) y `cuestionario.ts:341-357`
(`pctDelPlan`, `metaDelCuestionario`). Bajando, el ajuste es `−min(pct/100 × kg × 7700/7, 7700/7, 1000)`
(1 kg/sem son 1.100 kcal/día, así que el borde efectivo es 1.000). Con fecha, el `pct` para la meta no pasa
del borde de «exigente» (`bordeDe('bajar', 'exigente', kg)`); el plan muestra cuándo se llegaría así. El
borde exacto (0,75 % como dice «La seguridad», o 1 % como el de D35) es decisión del dueño.
- Test: «bajar rápido con 150 kg: el déficit no pasa de 1.000 kcal ni de 1 kg por semana».
- Test: «una fecha que pide 2 %/sem: la meta usa el borde y el plan dice la fecha nueva».

**A3. La equilibrada nunca pasa del 35 % de grasas y los macros suman las kcal.** `metas.ts:156-167`. En
`equilibrada` y `bajaEnGrasas`, `grasas = min(kcal × 0,35/9, max(0,6 × pesoRef, kcal × mínimas/9))` y, si la
proteína más las grasas no dejan lugar, baja primero el mínimo por kilo. `pesoRef` es el peso de hoy hasta
que se decida D6.
- Test: «una mujer de 140 kg y 165 cm a 1.760 kcal: grasas ≤35 %».
- Test: «160 kg a 1.400 kcal: proteína × 4 + carbohidratos × 4 + grasas × 9 ≤ 1.400 + 10» (hoy suma 1.424).

**A4. El control usa lo que eligió el cuestionario nuevo.** `control.ts:118-128, 158` y `metas.ts:170-174`.
`EntradaDelControl` suma los gramos de proteína (`proteinaDelNivel`, con la masa magra si la hay), el `pct`
del plan y la recomposición; `metaPara` los usa en lugar de `RITMOS` y `PROTEINA_POR_KG`. Sin esto, el primer
control devuelve la meta a la de fábrica.
- Test: «con recomposición y proteína alta, después del control siguen −0,25 %/sem y 2,2 g/kg».
- Test: «con la fecha que pide 0,62 %/sem, el control mantiene 0,62».

**A5. Las referencias de 14 a 18 años.** `micronutrientes.ts:51-88`: un tramo más (`edad <= 18`) con NASEM
2019, apéndice J: calcio 1.300; fósforo 1.250; hierro h 11 / m 15; magnesio 410/360; potasio 3.000/2.300;
zinc 11/9; selenio 55; vitamina A 900/700; vitamina C 75/65; D 15; E 15; K 75/75; tiamina 1,2/1,0;
riboflavina 1,3/1,0; niacina 16/14; B6 1,3/1,2; folato 400; B12 2,4.
- Test: `referenciaDe('calcio', { sexo: 'f', edad: 17 })` → `{ meta: 1300 }`; a los 19, 1.000.

**A6. La cafeína antes de los 18.** `micronutrientes.ts:84-93`: con `edad < 18`, `{ tope: 3 × pesoKg }`
(EFSA 2015). `ParaQuien` suma `pesoKg?`; sin peso, el tope de 400 sigue solo desde los 18.
- Test: 17 años y 60 kg → `{ tope: 180 }`.

**A7. La fibra, al menos 25 g en adultos.** `metas.ts:98`:
`metaDeFibra = (kcal, edad) => edad >= 18 ? Math.max(25, Math.round(14 * kcal / 1000)) : Math.round(14 * kcal / 1000)`
(OMS 2023, EFSA 2017; sigue siendo suave, sin rojo).
- Test: 1.200 kcal a los 30 → 25; 2.500 → 35.

**A8. Sin keto con «sin déficit».** `metas.ts:148-174` y la pantalla del reparto: con `sinDeficit`, `keto`
no se ofrece y, si estaba guardado, se usa `equilibrada` (ADA 2019).
- Test: «con sin déficit, `metaPara(..., 'keto')` da lo mismo que la equilibrada».

**A9. La recomposición pide pesas.** `cuestionario.ts:217-236` y `progreso.ts:181-185`: sin
`entrenaFuerza`, la recomposición no se ofrece o lleva el aviso `sinFuerza` (el músculo no crece sin
estímulo; Barakat 2020, Murphy y Koehler 2022).
- Test: «recomponer sin pesas trae el aviso».

**A10. Los pasos no cuentan dos veces el entrenamiento.** `cuestionario.ts:70-73`: con `resistencia` o
`equipo` entre los deportes, la sugerencia por pasos no pasa de `dePie` (o usa los días sin sesión).
- Test: «14.000 pasos por día y correr 4 veces → sugiere de pie, no físico».

**A11. «Viene bajo» con el EAR.** `micronutrientes.ts` suma el EAR del hierro (NASEM 2019: 8,1 mg en mujeres
de 19 a 50, 6 en hombres; el del calcio está en la misma tabla, no lo verifiqué) y `segunElDeporte.ts:320-321`
compara con el EAR; entre el EAR y la RDA el texto dice «podría faltarte» (IOM 2000). Va con el área del
deporte.
- Test: «una mujer de 30 con 12 mg de hierro por día no recibe "viene bajo"; con 7 mg, sí».

**A12. Nombres y citas.** `cuestionario.ts:49` y `nutricion.md:695-696`: «Katch-McArdle» es la ecuación de
Cunningham (1991). `cuestionario.ts:58-61` y `nutricion.md:698-701` citan IOM 2005: la vigente es NASEM 2023
(otras categorías: inactivo 1,00–1,53). `metas.test.ts:53` dice «161 kcal» y comprueba 166.

### 3.2 Decisiones del dueño

**D1. El gasto de arranque, centrado.** `cuestionario.ts:62`: sentado 1,45, de pie 1,6, físico 1,75 (o
calcular la vida diaria con NASEM 2023 por categoría). Y mostrarlo con su rango: «unas 2.560 kcal (2.300 a
2.820)», ±10 % (el error de NASEM 2023, 246–339 kcal).
- Test: el ejemplo de la galería (29 años, 172 cm, 74,5 kg, sentado, pesas 3 h/sem) da 2.560 (hoy 2.400).

**D2. El control con una ganancia que depende de los datos (Kalman).** `control.ts:129-162`:

```
Medida:   M = kcal promedio de los días completos − 7700 × b       (b: pendiente de A1, kg/día)
Su error: R = 7700² × σ² / Σ(t − t̄)²  +  s² / n                   (σ: desvío de los residuos, nunca menos de 0,3 kg;
                                                                    s: desvío de las kcal diarias; n: días con comida)
          R = R × 3 × (1 + fraccionEstimada)                       (los tramos de 21 días se pisan 2/3; lo «a ojo» pesa menos)
Previa:   P₀ = (0,12 × gasto inicial)²;  cada semana P = P + 50²   (el error de la ecuación; el gasto real también cambia)
Paso:     K = P / (P + R);  gasto = gasto + K × (M − gasto);  P = (1 − K) × P
Se ve:    gasto ± √P, de a 50 kcal
```

Los 0,3 kg salen del vaivén semanal medido (0,35 %, ~0,3 kg; Turicchi 2020); los 50 kcal y el ×3 son
derivados. Reemplaza `SUAVIZADO` y `FRENO_POR_LO_ESTIMADO`.
- Test: «con dos pesadas en 7 días, K < 0,15»; «con 21 días de pesadas diarias sin ruido, K > 0,6»; «el
  rango se achica control a control».

**D3. Si no se hace D2, mínimos más altos.** `control.ts:20-24`: al menos 3 pesadas en el tramo, la primera y
la última a 10 días o más, y la última a 3 días o menos de ayer; si no, `faltanDatos`.

**D4. La primera semana de un déficit.** `control.ts:89-98`: si la meta vigente empezó a bajar (o pasó a keto
o baja en carbohidratos) hace menos de 14 días, el tramo arranca 7 días después de ese cambio (el agua del
glucógeno; Kreitzman 1992).
- Test: «con 1,5 kg de agua en la primera semana, el gasto no sube más de 100 kcal».

**D5. Los días a medias.** Como el módulo de MacroFactor: en el control, si un día tiene menos del 50 % de la
mediana de los últimos 21 días, se pregunta «¿Anotaste todo ese día?»; los que se marcan no cuentan
(`ComidaDelDia.incompleto`).
- Test: «un día marcado como incompleto no entra en `comidaPromedio`».

**D6. Proteína y grasa mínima con el peso de un IMC de 30.** `metas.ts:148-161` y `cuestionario.ts:276-280`:
sin la grasa, `pesoRef = min(kg, 30 × (cm/100)²)` (Weijs 2024). Derivado: la mujer de 140 kg, a 1.760 kcal
(con A2), queda en 163 g de proteína, 53 g de grasas (27 %) y 158 g de carbohidratos (36 %), en vez de 176 g,
84 g (43 %) y 75 g.

**D7. La proteína con «sin déficit».** ¿Un tope de 1,3 g/kg (KDIGO, para quien tiene riesgo renal) con
«Si un profesional te indicó otra cantidad, cámbiala en Perfil»? El embarazo pide más que la RDA general, así
que una cifra única no sirve para todos los casos de «sin déficit».

**D8. El peso meta mínimo desde los 65:** IMC 23 en vez de 18,5 (Winter 2014; es observacional).

**D9. De 16 a 17 años:** el gasto con las ecuaciones de NASEM 2023 para 14–18 y, para bajar, solo el ritmo
suave o directamente mantener con hábitos (Golden 2016).

**D10. El agua como hábito propio.** Contar también las otras bebidas (café, té, leche, jugo) y, de fábrica,
la meta de EFSA por sexo; los textos «Te faltan {vasos} vasos de agua» y «Vas bajo de agua hoy» pasan a
«Llevas {n} de tus {total} vasos». Es lo que `entreno.md` ya llama mito («metas fijas de agua»).

**D11. Un piso por la energía disponible.** Con la masa magra conocida y 5 h o más de entrenamiento por
semana: meta − kcal del entrenamiento ≥ 30 × masa magra (ACSM 2016: por debajo de 30 kcal/kg de masa magra se
alteran varias funciones). El consenso del COI de 2023 diagnostica con su herramienta, no con un número.

**D12. Sodio y grasas saturadas.** Una referencia en la ventana del alimento y el día: sodio ≤2.300 mg
(NASEM 2019) y saturadas <10 % de las kcal (OMS 2023), sin rojo.

**D13. El keto, con los carbohidratos sin la fibra.** Hoy son 30 g totales (la base trae los carbohidratos por
diferencia, con la fibra: `fuentes.md:59`), así no entra la fibra. La ADA cuenta 20–50 g sin la fibra. Y la
«baja en carbohidratos» del 25 % es «muy baja» para la ADA (<26 %).

**D14. Un descuento del entrenamiento muy alto.** Por encima de ~7 h/sem, contar una parte (Pontzer 2016: el
gasto total se aplana). El número es una convención.

**D15. NASEM o EFSA.** Seguir con NASEM (la de USDA, la de la base) y decirlo en «En qué se basa».

**D16. La densidad de energía según la composición** (Hall 2008), con la grasa conocida: baja prioridad,
porque el lazo del control la cancela; hay que leer antes las constantes en el texto completo.

---

## 4. Lo que no se dice (o no se hace)

- **Un gasto exacto.** Nada de «Tu gasto es 2.437 kcal»: «unas 2.450 kcal», con el rango, y el medido es
  «según lo que anotas» (lo anotado subestima 5–37 % con apps; Burrows 2019).
- **Sumar a la meta las kcal activas del reloj** (Choe y Kang 2025) ni el entrenamiento que el control ya
  mide.
- **«Metabolismo dañado», «modo ahorro», «no comas menos que tu basal».** El piso es una convención: las
  dietas clínicas habituales bajan del gasto en reposo (Jensen 2014).
- **Que un estilo «quema más grasa»** con las mismas calorías (Hall y Guo 2017; DIETFITS 2018; Ge 2020).
- **Prometer kilos de músculo por mes** (Aragon es un modelo) ni «ganar músculo» sin pesas.
- **«Te falta hierro» o «calcio» como diagnóstico**, ni «falta» solo por estar debajo de la RDA (IOM 2000:
  ahí es «probablemente»; lo firme es debajo del EAR y con muchos días); ni suplementos.
- **Metas fijas de agua dichas como necesidad** ni «con sed ya es tarde» (EFSA 2017; `entreno.md`).
- **Con «sin déficit»:** déficit, keto, la grasa corporal ni la recomposición (ADA 2019; Levinson 2017).
- **De 16 a 17 años:** el peso como meta, ni el ritmo rápido (Golden 2016).
- **Un porcentaje de precisión que no se midió** (guía 1.4.1 de Apple; «La seguridad»).
- **Usar los azúcares totales de la base como si fueran agregados:** los topes de azúcares hablan de los
  agregados, que la base no trae.
- **«Compensar»** lo comido de más o de menos (ya está bien).

---

## 5. Para «En qué se basa Moss»

**Español (neutro, tú):**

> Para empezar, Moss estima lo que gastas con la fórmula de Mifflin-St Jeor (1990), la que mejor acierta en
> adultos, y le suma tu día y tu entrenamiento según las Academias Nacionales de Estados Unidos (2023): es un
> punto de partida que puede errar un 10 % o más, no tu número exacto. Después, cada semana, compara lo que
> anotas con la tendencia de tu peso y corrige la estimación; medir el balance de energía con pesadas
> repetidas se comprobó contra mediciones de laboratorio (Sanghvi, Hall y otros, 2015), y con tres o cuatro
> semanas de pesadas frecuentes la cifra se vuelve firme. La proteína sigue el metaanálisis de Morton y otros
> (2018), de 1,6 a 2,2 g por kilo si entrenas y nunca menos de 1,2, y las grasas, la fibra y las vitaminas
> siguen las referencias de las Academias Nacionales. Son guías para adultos sanos, no un diagnóstico: con
> embarazo, lactancia o una condición médica, Moss no te pone en déficit y te sugiere hablar con un
> profesional.

**English:**

> To start, Moss estimates how much energy you use with the Mifflin-St Jeor equation (1990), the most accurate
> one for adults, and adds your daily activity and training following the US National Academies (2023): it is
> a starting point that can be off by 10% or more, not your exact number. Then, every week, it compares what
> you log with your weight trend and corrects the estimate; measuring energy balance from repeated weigh-ins
> has been checked against laboratory methods (Sanghvi, Hall and colleagues, 2015), and after three or four
> weeks of frequent weigh-ins the number becomes solid. Protein follows the meta-analysis by Morton and
> colleagues (2018), 1.6 to 2.2 g per kg if you train and never below 1.2, while fats, fiber and vitamins
> follow the National Academies' references. These are guidelines for healthy adults, not a diagnosis: if you
> are pregnant, breastfeeding or have a medical condition, Moss won't put you in a deficit and suggests talking
> to a professional.

---

## 6. Fuentes

Todas abiertas y leídas en esta sesión. «Resumen» es solo el resumen (casi siempre por la API de Europe PMC);
«entero» es el texto completo o la parte citada de él.

**Gasto en reposo y total**
- Mifflin MD, St Jeor ST y otros. 1990. A new predictive equation for resting energy expenditure in healthy individuals. *Am J Clin Nutr* 51:241. https://doi.org/10.1093/ajcn/51.2.241 — resumen.
- Frankenfield D, Roth-Yousey L, Compher C. 2005. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *J Am Diet Assoc* 105:775. https://doi.org/10.1016/j.jada.2005.02.005 — resumen (sin los porcentajes del texto).
- Frankenfield DC. 2013. Bias and accuracy of resting metabolic rate equations in non-obese and obese adults. *Clin Nutr* 32:976. https://doi.org/10.1016/j.clnu.2013.03.022 — resumen.
- Cioffi I, Marra M, Pasanisi F, Scalfi L. 2021. Prediction of resting energy expenditure in healthy older adults: a systematic review. *Clin Nutr* 40:3094. https://doi.org/10.1016/j.clnu.2020.11.027 — resumen.
- O'Neill JER, Corish CA, Horner K. 2023. Accuracy of resting metabolic rate prediction equations in athletes: a systematic review with meta-analysis. *Sports Med* 53:2373. https://doi.org/10.1007/s40279-023-01896-z — entero (resultados de precisión y discusión).
- Cunningham JJ. 1991. Body composition as a determinant of energy expenditure: a synthetic review and a proposed general prediction equation. *Am J Clin Nutr* 54:963. https://doi.org/10.1093/ajcn/54.6.963 — resumen.
- National Academies of Sciences, Engineering, and Medicine. 2023. *Dietary Reference Intakes for Energy*. https://doi.org/10.17226/26818 — entero el capítulo de las ecuaciones (https://www.nationalacademies.org/read/26818/chapter/7).
- FAO/WHO/UNU. 2004. *Human energy requirements* (Food and Nutrition Technical Report Series 1), capítulo de adultos. http://www.fao.org/4/Y5686E/y5686e07.htm — entero.
- Pontzer H y otros. 2016. Constrained total energy expenditure and metabolic adaptation to physical activity in adult humans. *Curr Biol* 26:410. https://doi.org/10.1016/j.cub.2015.12.046 — resumen.
- Adult Compendium of Physical Activities, «Corrected METs». https://pacompendium.com/corrected-mets/ — entero (la página; no leí el artículo del Compendio 2024 ni verifiqué cada MET de Moss).
- Tudor-Locke C, Bassett DR. 2004. How many steps/day are enough? *Sports Med* 34:1. https://doi.org/10.2165/00007256-200434010-00001 — resumen.
- Choe JP, Kang M. 2025. Apple watch accuracy in monitoring health metrics: a systematic review and meta-analysis. *Physiol Meas* 46. https://doi.org/10.1088/1361-6579/adca82 — resumen; el 27,96 % sale del comunicado: https://www.eurekalert.org/news-releases/1086185 — entero.

**El gasto que se ajusta**
- MacroFactor. *MacroFactor's algorithms and core philosophy*. https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/ — entero.
- MacroFactor, ayuda 29 (días a medias) y 248 (módulo de registro parcial). https://help.macrofactorapp.com/en/articles/29-how-do-macrofactors-coaching-algorithms-deal-with-partially-logged-days · https://help.macrofactorapp.com/en/articles/248-coaching-module-partial-logging — enteros.
- Hall KD, Chow CC. 2011. Estimating changes in free-living energy intake and its confidence interval. *Am J Clin Nutr* 94:66. https://doi.org/10.3945/ajcn.111.014399 — resumen.
- Sanghvi A, Redman LM, Martin CK, Ravussin E, Hall KD. 2015. Validation of an inexpensive and accurate mathematical method to measure long-term changes in free-living energy intake. *Am J Clin Nutr* 102:353. https://doi.org/10.3945/ajcn.115.111070 — resumen.
- Hall KD. 2008. What is the required energy deficit per unit weight loss? *Int J Obes* 32:573. https://doi.org/10.1038/sj.ijo.0803720 — resumen (no pude abrir el texto con las constantes).
- Hall KD y otros. 2011. Quantification of the effect of energy imbalance on bodyweight. *Lancet* 378:826. https://doi.org/10.1016/S0140-6736(11)60812-X — resumen.
- Thomas DM y otros. 2013. Can a weight loss of one pound a week be achieved with a 3500-kcal deficit? *Int J Obes* 37:1611. https://doi.org/10.1038/ijo.2013.51 — resumen.
- Burrows TL, Ho YY, Rollo ME, Collins CE. 2019. Validity of dietary assessment methods when compared to the method of doubly labeled water: a systematic review in adults. *Front Endocrinol* 10:850. https://doi.org/10.3389/fendo.2019.00850 — entero (tablas por método).
- Turicchi J y otros. 2020. Weekly, seasonal and holiday body weight fluctuation patterns among individuals engaged in a European multi-centre behavioural weight loss maintenance intervention. *PLoS One* 15:e0232152. https://doi.org/10.1371/journal.pone.0232152 — entero (resultados).
- Kreitzman SN, Coxon AY, Szaz KF. 1992. Glycogen storage: illusions of easy weight loss, excessive weight regain, and distortions in estimates of body composition. *Am J Clin Nutr* 56:292S. https://doi.org/10.1093/ajcn/56.1.292S — resumen.

**El déficit, el superávit y el piso**
- Helms ER, Aragon AA, Fitschen PJ. 2014. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. *J Int Soc Sports Nutr* 11:20. https://doi.org/10.1186/1550-2783-11-20 — resumen.
- Garthe I y otros. 2011. Effect of two different weight-loss rates on body composition and strength and power-related performance in elite athletes. *Int J Sport Nutr Exerc Metab* 21:97. https://doi.org/10.1123/ijsnem.21.2.97 — resumen.
- Murphy C, Koehler K. 2022. Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. *Scand J Med Sci Sports* 32:125. https://doi.org/10.1111/sms.14075 — resumen.
- Ashtary-Larky D y otros. 2020. Effects of gradual weight loss v. rapid weight loss on body composition and RMR: a systematic review and meta-analysis. *Br J Nutr* 124:1121. https://doi.org/10.1017/S000711452000224X — entero (resumen, métodos y estudios; el intervalo de la tasa metabólica publicado tiene una errata).
- Purcell K y otros. 2014. The effect of rate of weight loss on long-term weight management: a randomised controlled trial. *Lancet Diabetes Endocrinol* 2:954. https://doi.org/10.1016/S2213-8587(14)70200-1 — resumen (financiación: NHMRC de Australia).
- Helms ER y otros. 2023. Effect of small and large energy surpluses on strength, muscle, and skinfold thickness in resistance-trained individuals. *Sports Med Open* 9:102. https://doi.org/10.1186/s40798-023-00651-y — resumen.
- Iraki J, Fitschen P, Espinar S, Helms E. 2019. Nutrition recommendations for bodybuilders in the off-season: a narrative review. *Sports* 7:154. https://doi.org/10.3390/sports7070154 — resumen.
- Benito PJ y otros. 2020. A systematic review with meta-analysis of the effect of resistance training on whole-body muscle growth in healthy adult males. *Int J Environ Res Public Health* 17:1285. https://doi.org/10.3390/ijerph17041285 — resumen y parte del texto.
- Jensen MD y otros. 2014. 2013 AHA/ACC/TOS guideline for the management of overweight and obesity in adults. *Circulation* 129(25 Suppl 2):S102. https://doi.org/10.1161/01.cir.0000437739.71477.ee — entero (las preguntas 1, 3 y 4).
- Winter JE y otros. 2014. BMI and all-cause mortality in older adults: a meta-analysis. *Am J Clin Nutr* 99:875. https://doi.org/10.3945/ajcn.113.068122 — resumen.
- Golden NH y otros (AAP). 2016. Preventing obesity and eating disorders in adolescents. *Pediatrics* 138:e20161649. https://doi.org/10.1542/peds.2016-1649 — resumen.
- Mountjoy M y otros. 2023. 2023 International Olympic Committee's consensus statement on Relative Energy Deficiency in Sport (REDs). *Br J Sports Med* 57:1073. https://doi.org/10.1136/bjsports-2023-106994 — resumen.

**Proteína, grasas, carbohidratos y estilos**
- Morton RW y otros. 2018. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med* 52:376. https://doi.org/10.1136/bjsports-2017-097608 — resumen.
- Nunes EA y otros. 2022. Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults. *J Cachexia Sarcopenia Muscle* 13:795. https://doi.org/10.1002/jcsm.12922 — resumen.
- Bauer J y otros (PROT-AGE). 2013. Evidence-based recommendations for optimal dietary protein intake in older people. *J Am Med Dir Assoc* 14:542. https://doi.org/10.1016/j.jamda.2013.05.021 — resumen (el registro lista apoyo de Shire, Novartis, Pfizer y la EUGMS, además del NIA).
- Wycherley TP y otros. 2012. Effects of energy-restricted high-protein, low-fat compared with standard-protein, low-fat diets: a meta-analysis of randomized controlled trials. *Am J Clin Nutr* 96:1281. https://doi.org/10.3945/ajcn.112.044321 — resumen.
- Weijs PJM. 2024. Protein requirement in obesity. *Curr Opin Clin Nutr Metab Care*. https://doi.org/10.1097/MCO.0000000000001087 — entero.
- Longland TM y otros. 2016. Higher compared with lower dietary protein during an energy deficit combined with intense exercise promotes greater lean mass gain and fat mass loss. *Am J Clin Nutr* 103:738. https://doi.org/10.3945/ajcn.115.119339 — resumen (financiación: NSERC).
- Schoenfeld BJ, Aragon AA. 2018. How much protein can the body use in a single meal for muscle-building? *J Int Soc Sports Nutr* 15:10. https://doi.org/10.1186/s12970-018-0215-1 — resumen.
- Devries MC y otros. 2018. Changes in kidney function do not differ between healthy adults consuming higher- compared with lower- or normal-protein diets. *J Nutr* 148:1760. https://doi.org/10.1093/jn/nxy197 — resumen.
- KDIGO 2024, por el resumen de NephJC. https://www.nephjc.com/news/kdigo-ckd-part2 — entero (es secundario; la guía es https://doi.org/10.1016/j.kint.2023.10.018, no la leí).
- Thomas DT, Erdman KA, Burke LM. 2016. Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and athletic performance. *J Acad Nutr Diet* 116:501. https://doi.org/10.1016/j.jand.2015.12.006 — entero (https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf).
- National Academies. 2024. *Rethinking the Acceptable Macronutrient Distribution Range for the 21st Century: A Letter Report*. https://www.nationalacademies.org/read/27957/chapter/5 — entero (el capítulo de la tabla 3-1).
- Evert AB y otros (ADA). 2019. Nutrition therapy for adults with diabetes or prediabetes: a consensus report. *Diabetes Care* 42:731. https://doi.org/10.2337/dci19-0014 — entero (las definiciones y las cautelas).
- Gardner CD y otros. 2018. Effect of low-fat vs low-carbohydrate diet on 12-month weight loss in overweight adults (DIETFITS). *JAMA* 319:667. https://doi.org/10.1001/jama.2018.0245 — resumen (financiación: NIH).
- Ge L y otros. 2020. Comparison of dietary macronutrient patterns of 14 popular named dietary programmes for weight and cardiovascular risk factor reduction in adults. *BMJ* 369:m696. https://doi.org/10.1136/bmj.m696 — resumen.
- Hall KD, Guo J. 2017. Obesity energetics: body weight regulation and the effects of diet composition. *Gastroenterology* 152:1718. https://doi.org/10.1053/j.gastro.2017.01.052 — resumen.
- Barakat C y otros. 2020. Body recomposition: can trained individuals build muscle and lose fat at the same time? *Strength Cond J* 42(5):7. https://doi.org/10.1519/SSC.0000000000000584 — resumen (por https://lida.sport-iat.de/ta/Record/4066252).
- Levinson CA, Fewell L, Brosof LC. 2017. My Fitness Pal calorie tracker usage in the eating disorders. *Eat Behav* 27:14. https://doi.org/10.1016/j.eatbeh.2017.08.003 — resumen.

**Fibra, agua y micronutrientes**
- Reynolds A y otros. 2019. Carbohydrate quality and human health: a series of systematic reviews and meta-analyses. *Lancet* 393:434. https://doi.org/10.1016/S0140-6736(18)31809-9 — resumen (financiación: OMS, entre otros).
- OMS. 2023. *WHO updates guidelines on fats and carbohydrates* (comunicado). https://www.who.int/news/item/17-07-2023-who-updates-guidelines-on-fats-and-carbohydrates — entero (no pude abrir la guía).
- EFSA. 2017. *Dietary Reference Values for nutrients. Summary report*. https://www.efsa.europa.eu/sites/default/files/2017_09_DRVs_summary_report.pdf — entero.
- Yamada Y y otros. 2022. Variation in human water turnover associated with environmental and lifestyle factors. *Science* 378:909. https://doi.org/10.1126/science.abm8668 — resumen.
- National Academies. 2019. *Dietary Reference Intakes for Sodium and Potassium*, apéndice J (tablas resumen de las DRI). https://doi.org/10.17226/25353 · https://www.nationalacademies.org/read/25353/chapter/28 — entero.
- Institute of Medicine. 2000. *Dietary Reference Intakes: Applications in Dietary Assessment*, resumen del libro. https://doi.org/10.17226/9956 · https://www.nationalacademies.org/read/9956/chapter/3 — entero (el capítulo de resumen).
- Institute of Medicine. 2001. *Dietary Reference Intakes for Vitamin A, Vitamin K, … Iron …*, capítulo 9 (hierro). https://doi.org/10.17226/10026 · https://www.nationalacademies.org/read/10026/chapter/11 — parte del capítulo.
- FDA. 21 CFR 101.54 (nutrient content claims for «good source» and «high»). https://www.law.cornell.edu/cfr/text/21/101.54 — entero.
- EFSA. 2015. Scientific opinion on the safety of caffeine, por el resumen de EUFIC. https://eufic.org/en/whats-in-food/article/efsa-opinion-on-the-safety-of-caffeine — entero (es secundario; la opinión es https://doi.org/10.2903/j.efsa.2015.4102, no la leí).

**Lo que no pude leer** (y por eso no va como fuente de un número): el texto completo de Hall 2008 y de Hall y
Chow 2011 (las constantes de la densidad de energía y el ruido del peso que usaron), los porcentajes de
Frankenfield 2005, la guía de la OMS 2023 entera, la opinión de EFSA sobre el agua (2010), las páginas de la
Oficina de Suplementos Dietéticos del NIH y cómo MacroFactor pasa kilos a kcal (no lo publica).
