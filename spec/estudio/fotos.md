# Por qué una foto sola no alcanza para medir lo que comes

Área: **fotos**. Estudio del 5/11/2026, sobre el árbol de trabajo de `mejoras-1.1` de ese día (con cambios sin
commit en `src/textos/`: las líneas de `es.json` que cito son las de ese momento).

Lo que se evalúa es la afirmación de Moss, **«una foto sola no alcanza para medir lo que comes»**, y todo lo que Moss
dice, hace o planea con fotos. Se intentó refutarla con lo más fuerte que hay a favor de las fotos: las revisiones que
dicen que la IA ya iguala a las personas, los modelos de 2026, las apps comerciales y los métodos con fotos que
analizan dietistas.

## 1. Resumen

1. **La afirmación se sostiene, con una precisión: una foto reconoce bien *qué* hay, pero no *cuánto*, ni lo que no
   se ve.** Contra comida pesada, tres IA de uso general erraron en promedio de 35,8 a 64,2 % de las calorías de cada
   foto (Fridolfsson 2025, 52 fotos), y cuatro apps comerciales, de 252 a 345 kcal por comida, un tercio menos
   (Charles y Hengist 2026, NIH, 102 comidas; resumen de congreso). Reconocer, en cambio, lo hacen bien: 93 % de
   precisión (O'Hara 2025) y 97 % de los componentes en la mejor app (Li 2024).
2. **La porción es el problema central.** Un modelo entrenado con miles de platos pesados erra 9,5 % en las calorías
   por gramo y 26,1 % cuando también tiene que adivinar cuánto hay (Thames 2021, Nutrition5k). Con el peso real, el
   error de los modelos en fotos de teléfono baja de unos 42 % a 17–25 % (Mu 2025). La cantidad es justo lo que Moss
   le pide a la persona.
3. **El error tiene dirección: va hacia la porción «típica» y deja afuera la grasa.** ChatGPT-4 pesó bien las porciones
   pequeñas, pero se quedó 27 % y 34 % corto en las medianas y las grandes (O'Hara 2025); en los tres modelos, el error
   crece con la porción (Fridolfsson 2025). Las apps subestimaron la grasa en 30 g por comida (NIH 2026); aceites,
   salsas y endulzantes tuvieron más de 50 % de error (Zuppinger 2022).
4. **Lo que más se acerca a refutarla no la refuta.** Las revisiones dicen que la IA ya iguala a las personas
   (Shonkoff 2023, 52 estudios) y se correlaciona bien con los métodos de siempre (Cofre 2025), y el promedio de muchas
   fotos puede salir casi exacto (O'Hara: 0,1 %). Pero igualar a una persona que estima desde una foto es igualar un
   error de 41 a 53 % (Thames 2021), y el promedio de muchos platos no es tu plato. En 2026, diez modelos, entre ellos
   los más nuevos (Gemini 3.0 Flash, GPT-5 Mini, Claude Haiku 4.5), todavía erran de 39,8 a 120,4 % según el modelo
   (Sterling 2026, 3.229 fotos, preprint).
5. **Donde anda bien:** un alimento solo, conocido y en porción pequeña o estándar; reconocer; ordenar comidas de más a
   menos; y, con evaluadores entrenados y fotos de antes y después, comidas en un laboratorio o una cafetería
   (Höchsmann 2026: equivalentes dentro de ±10 % en dos de tres pruebas). Nada de eso es «una foto sola».
6. **Cuánto importa:** el error de *una* comida (150 a 350 kcal) es del tamaño del déficit de todo el día (300 a 500
   kcal). El control semanal de Moss compensa un error que se repite parecido (`src/dominio/control.ts:27-31`), pero el
   de la foto cambia con el plato (de −55 % a +270 % en platos mixtos; Li 2024), con el tamaño y con la grasa: ese no se
   compensa solo.
7. **Lo de Moss también tiene error: más chico con la etiqueta o pesando; a ojo, puede ser parecido.** Una etiqueta
   puede alejarse hasta un 20 % de lo real (Mercosur, Unión Europea y, para las calorías, la FDA); medidas, las de los
   snacks dan +4,3 % (Jumpertz 2013). De los 1.211 curados de Moss comparados con otra tabla oficial, 400 quedan a 10 %
   o menos. Y lo que una persona estima a ojo también se queda corto (Block 2013: −175 kcal por comida, más en las
   grandes). No hay un estudio que compare de frente «elegir de una base» con «la foto» contra comida pesada. La
   diferencia es que el error de Moss se ve, se puede reducir (pesar, elegir la porción, sumar el aceite) y no cambia
   sin aviso.
8. **Lo que más importa cambiar:** la pantalla nueva con el párrafo de la sección 5; si algún día se prende
   «Reconocer (aproximado)» (`spec/nutricion.md:537`), que el modelo diga solo *qué* ve y la cantidad la confirme la
   persona, con una prueba de 50 platos pesados que mida el error *por tamaño* y con aceite escondido; decir el margen
   de las etiquetas en «Cómo lo estima»; y un test que impida nombrar otras apps en los textos.
9. **Ya hecho, sin commit:** «Sin IA de fotos» salió de la entrada (`es.json:365`, sin la clave `sinIA`) y de la
   pantalla de pago (`es.json:3311`). Está bien así: no hace falta decir lo que Moss no tiene; el porqué va en Perfil.

## 2. Tabla de veredictos

### 2.1 Lo que Moss dice y hace hoy con fotos

- `src/textos/es.json:657` (`comida.fotoDiario.noSeAnaliza`): «La foto no se analiza: es solo para tu diario.» La usa
  la propuesta de la galería en el visor, en «¿Qué es?» y al abrir una foto (`galeria/src/fotos.js:342`, `:380`,
  `:421`).
- `src/textos/es.json:990` (`inicio.todo.pie`): «Ningún número sale de una IA: son fórmulas publicadas y tus propios
  datos.»
- `src/textos/es.json:987` (`inicio.todo.comoEstima.alimentos.texto`): «Tablas oficiales: USDA y, en los más comunes,
  una segunda tabla para verificar [...] Lo marcado «aproximado» es una estimación, y se puede corregir.» No dice el
  margen de las etiquetas.
- `src/textos/es.json:1966` (`perfil.privacidadTexto[2]`): las fotos de la comida quedan en el teléfono.
  `docs/privacidad/index.html:142`: Moss «no comparte tus datos con servicios de inteligencia artificial».
- `src/textos/es.json:365` y `:3311`: en el árbol de trabajo ya no dicen «Sin IA de fotos»; en el último commit
  (`134c873`) estaba en `entrada.intro.base.texto`, `entrada.intro.base.sinIA` y `suscripcion.pago.todo[0]`. Quedan
  menciones internas, que no se leen en la app: `CLAUDE.md:3`, `README.md:7`, `spec/*.md` y la nota de la galería
  (`galeria/src/pagina.html:2017`).
- `spec/nutricion.md:499-535`: la foto de la comida, para aprobar. No se analiza; los números salen de lo que se dice
  (`src/comida/frase.ts`, `src/comida/entender.ts`).
- `spec/nutricion.md:537-597`: «Para después: reconocer la foto con IA», para suscriptores. En `:544`, «el modelo dice
  qué ve y cuánto, como una frase», que pasa por `entender.ts`; los números salen de la base, cada alimento queda
  «aproximado» y se revisa. En `:547`: «Lo que no se ve (el aceite, la leche del café) se escapa». En `:576`: antes de
  elegir el modelo, «se mide con 50 platos pesados».
- `spec/nutricion.md:998`: «IA de fotos: [...] lo básico es sin IA».
- `src/dominio/cantidades.ts:16-26`: el aceite de cocinar (cucharadita 4,5 g, cucharada 13,6 g, dos cucharadas 27,2 g;
  girasol, 884 kcal por 100 g) se pregunta en lo salteado y a la plancha; en lo frito, la base ya lo cuenta.
- `src/dominio/cantidades.ts:77-85`: lo escrito en gramos y lo de un envase cuenta como pesado; una porción casera
  («1 taza», «1 unidad mediana»), como «a ojo».
- `src/dominio/control.ts:26-31` y `:152-155`: el gasto medido es la comida promedio menos el cambio de la tendencia ×
  7.700 kcal/kg (`src/dominio/metas.ts:71`) ÷ los días; se toma un cuarto de la diferencia (`SUAVIZADO = 0.25`) y,
  con todo a ojo, la mitad de eso (`FRENO_POR_LO_ESTIMADO = 0.5`). El comentario dice: «un error parejo [...] se
  compensa solo».
- `src/comida/platos.ts:1-15` y `:50`: un plato dicho sin cantidad va con la porción mediana (chico ≈ 0,65 y grande ≈
  1,5 de un plato), marcado «aproximado» y con una pregunta.
- `spec/fuentes.md:163-167`: 1.643 curados: 400 a 10 % o menos de otra tabla oficial, 792 que se alejan por una
  razón real (otra variedad, cocción o receta), 19 por revisar y 432 sin par.

### 2.2 La tabla

| Qué calcula o dice Moss | Dónde | Veredicto | La mejor evidencia (autor, año, tipo, n) | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| «Una foto sola no alcanza para medir lo que comes» (la afirmación de la pantalla nueva) | Pantalla nueva; hoy, `es.json:657` y `:990` | **Se sostiene** | Fridolfsson 2025, validación, 52 fotos pesadas, 3 modelos: MAPE de energía 35,8–64,2 %. Thames 2021, Nutrition5k, ~5.000 platos pesados: 9,5 % → 26,1 % al sumar la porción. O'Hara 2025, 114 fotos: −27 % y −34 % del peso en porciones medianas y grandes. Charles y Hengist 2026 (NIH), 102 comidas, 4 apps: −252 a −345 kcal por comida (sin revisión por pares). Shonkoff 2023, revisión sistemática, 52 estudios: no están listas para usarse solas | Decir «no alcanza para *medir*», no «no sirve»: reconoce bien qué es, no cuánto ni lo escondido | La cantidad (gramos o tamaño) y lo agregado (aceite) | Sí: la base, la porción elegida, el aceite y el control semanal |
| «Sin IA de fotos» como argumento de venta | Último commit: `entrada.intro.base.texto`, `entrada.intro.base.sinIA`, `suscripcion.pago.todo[0]`; ya sacado en `es.json:365` y `:3311` | **A medias**: el fondo se sostiene; decirlo como un «sin» no explica el porqué y se lee como contra otros | La misma de arriba | Decir lo que Moss sí hace (tú eliges, ves de dónde sale cada número) y dejar el porqué en Perfil | — | Sí, en el árbol de trabajo |
| «Ningún número sale de una IA» | `es.json:990` | **Se sostiene** hoy: `frase.ts`, `recetaDeTexto.ts` y `entender.ts` son reglas; la voz y el lector de etiquetas del iPhone transcriben, no estiman, y la persona revisa | El código | Mantenerlo; cambiarlo el día que se prenda «Reconocer» | — | Sí |
| «La foto no se analiza: es solo para tu diario» | `es.json:657`; `galeria/src/fotos.js:342`, `:380`, `:421` | **Se sostiene** | Dunn 2019, ensayo aleatorizado piloto, n = 41, 6 meses: con una app de fotos se bajó lo mismo que contando calorías (−2,5 contra −2,4 kg): la foto sirve para darse cuenta, no para medir | Mantener la foto como recuerdo | — | Sí |
| «Reconocer (aproximado)», para después: «el modelo dice qué ve y cuánto» | `spec/nutricion.md:537-597`, en especial `:544` y `:576` | **A medias**: el *qué*, sí; el *cuánto* del modelo es justo la parte que falla | Thames 2021; Mu 2025 (con el peso real, 42 → 17 % en fotos de teléfono); O'Hara 2025; Fridolfsson 2025 (pendientes de −0,23 a −0,50); Liao y Li 2026 | El modelo solo nombra; la cantidad la confirma la persona; la prueba de 50 platos con 3 tamaños, aceite escondido y platos de la región, comparada con «Decir lo que comí» solo | Platos pesados propios | No: falta la prueba |
| Preguntar el aceite en lo salteado y a la plancha | `src/dominio/cantidades.ts:16-26` | **Se sostiene** | Charles y Hengist 2026: la grasa, −30 g por comida, peor en las cetogénicas. Zuppinger 2022, 189 registros: aceites, salsas y endulzantes, error > 50 %. Cinar 2026, piloto: con la grasa escondida, hasta 76,5 % | Mantener; mirar también los aderezos de las ensaladas | Cuánto aceite o aderezo | Aceite, sí; aderezos, no se pregunta |
| La etiqueta (escáner y foto de la etiqueta) | `comida.etiquetaRevision.leida`, `src/comida/etiqueta.ts` | **Se sostiene**, con margen: es lo mejor para un envasado, no es exacta | 21 CFR 101.9(g)(5): las calorías pueden llegar a 120 % de lo declarado. Guía de la Comisión Europea 2012: ±20 % (10 a 40 g por 100 g). Mercosur (RDC 360/2003, 3.5.1): ±20 %. Jumpertz 2013, 24 snacks: +4,3 %. Urban 2011, 269 platos de restaurante: 19 % con 100 kcal o más que lo dicho | Decir «hasta un 20 %» en «Cómo lo estima» | — | Sí (la etiqueta); el margen no se dice |
| «Una base revisada» | `es.json:365`, `:987`; `spec/fuentes.md:163-167` | **Se sostiene** como lo mejor disponible, no como exacta | Zhang 2021, metaanálisis, 11 estudios: las apps de registro dan −202 kcal/día contra los métodos de siempre, y −57 kcal/día (sin diferencia, I² 0 %) cuando usan la misma tabla: la tabla explica buena parte | Mantener «aproximado» y «verificado» | — | Sí |
| Lo anotado a ojo frena el control | `src/dominio/control.ts:26-31`, `:155`; `cantidades.ts:81-85` | **La idea se sostiene; el 0,5 es una convención** | Nelson 1994, 51 personas, 7.284 estimaciones: con una sola foto de referencia, lo grande −13 a −37 %. Block 2013, 1.877 adultos: −175 kcal por comida, más en las grandes. Thames 2021: personas estimando desde una foto, 41 a 53 % de error en el peso | — | — | Sí |
| La porción supuesta cuando no se dice | `src/comida/platos.ts:1-15`, `:50`; `comida.decir.supuesto` | **A medias**: tiene el mismo riesgo que una foto (ir a lo «típico»), compensado porque pregunta y lo marca | Sunto 2026, FoodLog Athl, 36 personas, 10 días: con porciones predefinidas, +154 kcal/día. Sterling 2026: los modelos «se pegan» a la porción típica. Nelson 1994: con 8 fotos de referencia, de −4 a +5 % | Mantener la pregunta con la respuesta marcada | — | Sí |

### 2.3 La evidencia, en detalle

**Las revisiones sistemáticas**

- **Ho 2020** (metaanálisis, 13 estudios, 606 personas; casi todos con fotos que analizan personas): los métodos con
  imágenes subregistran −179 kcal/día (IC 95 % −270 a −89; I² 89 %); contra agua doblemente marcada, −448 kcal/día
  (−756 a −141; I² 95 %). Proteína, grasa y carbohidratos, sin diferencia significativa.
- **Höchsmann y Martin 2020** (revisión): en cafeterías, la fotografía digital es exacta; con el teléfono, en la vida
  real, «puede» serlo, pero no está garantizado; lo automático estaba en sus comienzos; lo que cuesta menos esfuerzo es
  menos exacto, y ningún método sirve para todo.
- **Shonkoff 2023** (revisión sistemática, 52 estudios de IA de 2010 a 2023; NIH): error relativo promedio contra la
  verdad de 0,10 a 38,3 % en calorías, y hasta 79,6 % en una estimación; la «verdad» era casi siempre una cuenta con
  tablas (51 %) o comida pesada (27 %), y ninguno usó agua doblemente marcada. No hubo metaanálisis: cada estudio usó
  otra base y otra medida. Solo uno comparó directo con personas. Sus autores: les falta desarrollo antes de usarse
  solas. Nombra como límites la luz, la calidad de la imagen, lo superpuesto y los platos mixtos como los curris.
- **Cofre 2025** (revisión sistemática, 13 estudios; British Journal of Nutrition): correlaciones mayores a 0,7 con los
  métodos de siempre en 6 estudios de energía; 61,5 % con riesgo de sesgo moderado y 61,5 % preclínicos. Los llama
  «prometedores». Una correlación alta dice que ordena bien, no que el número de un plato esté cerca.
- No encontré una revisión sistemática de 2025 o 2026 solo de modelos de lenguaje con visión.

**Los modelos de lenguaje con visión (2023 a 2026)**

- **Fridolfsson 2025** (Current Developments in Nutrition; Gotemburgo; sin financiación): 52 fotos de comida pesada
  (iPhone 13, 42°, plato de 24,3 cm y cubiertos de referencia), con ChatGPT-4o, Claude 3.5 Sonnet y Gemini 1.5 Pro
  (septiembre de 2024). MAPE de energía: 35,8 %, 35,8 % y 64,2 %; peso: 36,3 %, 37,3 % y 65,0 %; proteína: 60,7 %,
  61,7 % y 109,9 %; grasa: 51,8 %, 41,7 % y 89,6 %; carbohidratos: 47,9 %, 72,8 % y 66,1 %. El sesgo medio de energía
  es casi cero (−10, −19 y +65 kcal) porque lo grande y lo pequeño se compensan, pero las pendientes son negativas
  (−0,23 a −0,50): cuanto más grande el plato, más se queda corto. Errores de reconocer: falafel por albóndigas (+360 %
  de proteína), huevos revueltos por pasta (+1788 % de carbohidratos), un curry de lentejas de 480 g visto como 255 g.
  Sus autores: comparables al autorregistro de siempre, «todavía no aptos para una evaluación precisa» en clínica o en
  deportistas.
- **O'Hara 2025** (Nutrients; Dublín; sin financiación): 114 fotos (38 comidas en 3 porciones), ChatGPT-4. Reconocer:
  precisión 93,0 %, sensibilidad 84,6 %. Peso: porción pequeña, 408 → 431 g (sin diferencia); mediana, 581 → 426 g
  (−27 %); grande, 798 → 530 g (−34 %); se quedó corto en el 76,3 % de las fotos. En el conjunto, la mediana de energía
  quedó a 0,1 %, pero 13 de 16 nutrientes pasaron de ±10 % y la concordancia fue mala en 10. Ordena bien (rs de 0,29 a
  0,83). Se le escapa lo de adentro de sopas, sándwiches y ensaladas.
- **Mu 2025** (ACM-BCB; NIH): sin el peso, MAPE de calorías de 34,6 a 46,7 % en Nutrition5k y de 40,6 a 42,3 % en 78
  fotos de teléfono con comida pesada (Gemini 2.5 Flash, GPT-4.1, Llama 4 Maverick); con el peso real, de 17,3 a
  25,5 % en esas fotos. Ojo: el texto del artículo dice que el peso cambió poco las calorías, aunque su tabla 1 muestra
  esa baja; cito la tabla. Un modelo con cámara de profundidad entrenado en Nutrition5k pasó de 16,8 % ahí a 52,6 % en
  las fotos de teléfono: otra luz, otro ángulo, otro sensor.
- **Sterling 2026** (bioRxiv, preprint sin revisión; NYU): 3.229 fotos de Nutrition5k con 10 enfoques (Gemini 2.0, 2.5
  y 3.0 Flash, 3.1 Flash Lite, GPT-4o, GPT-4o-mini, GPT-5 Mini, Claude Haiku 4.5, Qwen2-VL y la API de FatSecret).
  MAPE de calorías de 39,8 a 120,4 %; el mejor, Gemini 3.0 Flash, con un error medio de 80,7 kcal (el modelo de
  Nutrition5k de 2021 daba 70,6). Con el mejor prompt, solo 42 % de las fotos quedó a menos de 25 % (Gemini 2.0 Flash).
  Sus autores: los modelos «se pegan a porciones típicas», los aceites y aderezos no se ven y GPT-5 Mini no devolvió
  una respuesta usable en 6,6 % de las fotos.
- **Cinar 2026** (Journal of Food Composition and Analysis; piloto, 9 comidas): ChatGPT-4o erró hasta 54,4 % en
  energía y 76,5 % en grasa, peor en lo complejo y con la grasa escondida; con más información del plato, el R² de la
  energía subió de 0,591 a 0,941.
- **Coburn 2025** (arXiv, 8 modelos): sumar a la foto el lugar, la hora y los alimentos baja el error. **Liao y Li 2026**
  (arXiv): los modelos reconocen comidas de todo tipo, pero «son débiles para estimar la porción»; un método con
  geometría baja ese error 33 a 41 %. **Lo 2023** (arXiv, GPT-4V): reconoce hasta 87,5 %, pero sin decirle de qué
  cocina es, lleva los platos regionales a arroz y pan.
- **No usado:** un póster sin revisión (Puell 2026, Cureus) con GPT-5.2, Gemini 3 Flash y Claude Sonnet 4.6 en 20
  comidas pesadas: la página devolvió 403. Según el buscador, el promedio no difiere y cada comida sí, con límites de
  concordancia amplios. Como no lo leí, no va como fuente.

**Las apps comerciales**

- **Charles y Hengist 2026** (NIDDK, NIH; NUTRITION 2026, 25/7/2026; resumen de congreso, sin revisión por pares):
  102 comidas de una cocina metabólica, con cada ingrediente pesado a 0,1 g y fotos estandarizadas. Por comida:
  Appediet −252 kcal (IC 95 % 210 a 295), MyFitnessPal −327 (269 a 385), Lose It! −333 (282 a 383) y Cal AI −345 (296
  a 392): un tercio. La grasa, −30 g por comida; los carbohidratos, mejor. MyFitnessPal y Lose It! acertaron más en las
  comidas de más calorías. En más de 200 comidas más, las cetogénicas fueron las peores. Hengist: «estas apps tienden a
  subestimar las calorías, sobre todo las de la grasa».
- **Li 2024** (Nutrients; Universidad de Sídney; sin financiación): 7 apps, 22 fotos (39 componentes, 7 platos mixtos,
  occidentales y asiáticos), con luz y fondo controlados. Reconocer: MyFitnessPal 97 %, Fastic 92 %, HealthifyMe 90 %,
  Foodvisor 87 %, HitMeal 62 %, Lose It! 46 % y FatSecret 46 %. Solo cuatro calculaban la energía solas. Alimentos de un
  componente: MyFitnessPal −3 %, HealthifyMe +8 %, Foodvisor −47 % y Fastic +44 %. Platos mixtos: de −55 % (té con
  perlas) a +270 % (bibimbap), los dos en MyFitnessPal; la hamburguesa, de −45 % a +1 %, y un salteado de carne, de
  −47 % a +66 %, según la app. Sus autores: reconocen bien, pero la energía de los platos mixtos y de otras cocinas «fue mala».
- **Zuppinger 2022** (MyFoodRepo, Suiza; los creadores de la app no firman): 189 registros contra comida pesada, con IA
  y una persona que pidió aclaraciones en el 43 %. Encontró el 98 % de los componentes; la porción, con un error medio
  de 9,2 % ± 48,1 (de −88,5 % a +242,5 %); sobrestima lo poco y subestima lo mucho; la proteína, siempre de más (las
  carnes); aceites y grasas, endulzantes, salsas y condimentos, error medio mayor a 50 %; las bebidas compuestas, bien
  clasificadas solo el 41,9 %.
- **Sunto 2026** (FoodLog Athl, Universidad de Tokio; dos de sus creadores firman): 36 estudiantes de nutrición (35
  mujeres), 10 días, contra comida pesada: +154 kcal/día (1.856 contra 1.702) y +10,4 g/día de grasa. Los autores lo
  atribuyen a porciones predefinidas más grandes que las que comían.
- **SnapCalorie y Foodvisor:** no encontré una validación independiente de SnapCalorie; Foodvisor solo aparece en Li
  2024. Las cifras de sitios de «comparación» (por ejemplo, ±1,2 % de una app) y dos «metaanálisis de 2026» con errores
  de 1 a 2 % publicados en sitios que no son revistas indexadas no se pudieron verificar: no van.

**Por qué falla**

- **La porción en una imagen plana:** Thames 2021 (9,5 % → 26,1 %), Mu 2025 (con el peso, 42 → 17 %), Liao y Li 2026.
- **Lo que no se ve:** Charles y Hengist 2026 (la grasa, −30 g por comida), Zuppinger 2022 (aceites, salsas y
  endulzantes, más de 50 %), Cinar 2026 (grasa escondida, 76,5 %), Sterling 2026 (aceites y aderezos), O'Hara 2025 (lo
  de adentro de sopas, sándwiches y ensaladas). Y lo que no se fotografía: en Boushey 2017, la gente se salteaba la foto
  cuando estaba apurada, en público o picando algo.
- **Los platos mixtos:** Li 2024 (de −55 % a +270 %), Shonkoff 2023 (curris y comidas superpuestas, más errores al
  separar), Zuppinger 2022 (bebidas compuestas, 41,9 %).
- **Las comidas de cada país:** Li 2024 (los asiáticos, peor), Lo 2023 (los platos africanos, a arroz y pan) y Sterling
  2026 (Nutrition5k es una cafetería de EE. UU.). Ningún estudio probó comida de Uruguay o Argentina (milanesa, guiso,
  tarta, asado): **no hay datos**.
- **La luz y el ángulo:** Shonkoff 2023 (calidad, luz, oclusión, casi sin marcador de escala), Fridolfsson 2025 (un
  solo ángulo, como límite), Mu 2025 (16,8 → 52,6 % al pasar a fotos de teléfono).
- **El modelo cambia:** las respuestas tienen azar y los modelos se actualizan (Fridolfsson 2025, O'Hara 2025): la misma
  foto no da siempre lo mismo, y un error que cambia no lo compensa el control.

**La dirección del error.** El patrón más repetido es ir hacia la porción típica: sobrestimar lo poco y subestimar lo
mucho (O'Hara 2025, Fridolfsson 2025, Zuppinger 2022; Sunto 2026 lo muestra al revés, en gente que comía poco), y
quedarse corto en la grasa (Charles y Hengist 2026). Las personas hacen lo mismo: con una sola foto de referencia,
subestiman lo grande de 13 a 37 % (Nelson 1994), y en comida rápida, −175 kcal por comida, más cuanto más grande (Block
2013). Hay una excepción honesta: en el estudio de los NIH, dos apps acertaron *más* en las comidas de más calorías. Lo
que no cambia es que, en promedio, todas se quedaron cortas.

**Dónde anda bien.** Reconocer (93 % en O'Hara 2025; 97 % en la mejor app de Li 2024); un alimento solo y conocido
(MyFitnessPal −3 % y HealthifyMe +8 % en Li 2024, aunque Foodvisor −47 % y Fastic +44 % en lo mismo); las porciones
pequeñas (O'Hara 2025); ordenar comidas de más a menos (rs 0,29 a 0,83); el promedio de muchos platos de muchas
personas, para investigar poblaciones. Y, con evaluadores entrenados y fotos de antes y después (el RFPM), una comida
en el laboratorio o la cafetería: equivalente dentro de ±10 % en dos de tres pruebas (Höchsmann 2026). En la vida real,
el mismo método da −152 ± 694 kcal/día en adultos (Martin 2012; el promedio no difiere, cada persona sí) y −783 a −888
kcal/día en adolescentes (Höchsmann 2026). El RFPM y el mFR son de los mismos grupos que los evalúan.

**Cuánto importa, contra un déficit de 300 a 500 kcal (cuentas mías, con los números de cada estudio):**

| Fuente | Error por comida | En un día de 3 comidas con foto | Contra el déficit |
|---|---|---|---|
| Charles y Hengist 2026, 4 apps | −252 a −345 kcal | −756 a −1.035 kcal, si van todas para abajo (en promedio fueron así) | De 1,5 a 3,5 veces el déficit |
| Fridolfsson 2025, los dos mejores modelos | 36 % en promedio: unas 215 kcal en un plato de 600 | Unas 370 kcal si los errores fueran al azar (215 × √3); hasta 645 si van para el mismo lado, como en los platos grandes | Del tamaño del déficit |
| O'Hara 2025, porción mediana | −27 % | Unas −160 kcal en un almuerzo de 600 kcal, en una sola comida | Un tercio a la mitad del déficit |

Lo que el control de Moss hace con eso: lo que es azar se promedia en la semana (215 × √21 ÷ 7 ≈ 140 kcal/día), y lo
que se repite igual se compensa solo (`control.ts:27-31`; es aritmética del balance, no un estudio). Lo que daña es el
error que cambia: los platos más grandes del fin de semana, más grasa, un plato nuevo, una versión nueva del modelo. Y en
el día, el «te quedan» erra lo de una comida: 150 a 350 kcal. Para subir de peso pasa lo mismo al revés: si la foto
cuenta un tercio menos, el superávit buscado de 300 kcal termina siendo mucho más grande.

**La comparación con lo que hace Moss**

- **Elegir de una base y decir la cantidad:** es separar el *qué* (la base, que da las calorías por gramo) del *cuánto*
  (la persona). Las tablas tienen su propio margen: de los curados comparados con otra tabla oficial, 400 de 1.211
  quedan a 10 % o menos y 792 se alejan por una razón real (`spec/fuentes.md:163-167`). Zhang 2021: con la misma tabla
  que la referencia, las apps de registro quedan a −57 kcal/día (sin diferencia) en lugar de −202.
- **El código de barras y la etiqueta:** la norma deja ±20 % (Mercosur, RDC 360/2003, 3.5.1; Unión Europea, guía de
  2012, entre 10 y 40 g por 100 g, y ±2 g o ±1,5 g de grasa por debajo de 10 g), y en EE. UU. las calorías pueden llegar
  a 120 % de lo declarado, y la proteína y los carbohidratos bajar a 80 % (21 CFR 101.9(g)). Medido: +4,3 % en snacks
  (Jumpertz 2013); en restaurantes, bien en promedio, pero 19 % de los platos con 100 kcal o más que lo dicho (Urban
  2011), y +18 % en platos «livianos» de restaurante (Urban 2010).
- **Lo que estima una persona a ojo:** con una serie de 8 fotos de referencia, de −4 a +5 %; con una sola, de −23 a +9 %
  (Nelson 1994). Desde una foto, 41 % de error en el peso los nutricionistas y 53 % los demás (Thames 2021). Contra agua
  doblemente marcada, casi todos los métodos de autorregistro se quedan cortos (Burrows 2019, 59 estudios, 6.298
  adultos), también con fotos analizadas por personas (Boushey 2017: 81 % del gasto, −579 kcal/día).
- **El ensayo que importa para el peso:** en el único ensayo aleatorizado que encontré, una app de fotos y una de
  calorías dieron lo mismo a los 6 meses (Dunn 2019, n = 41: −2,5 y −2,4 kg), con poco registro en las dos. Anotar
  seguido importa tanto como anotar bien; por eso la foto del diario tiene sentido en Moss, como recuerdo.

**Lo más confiable, en orden:** pesar y usar una base revisada (la referencia de los estudios: Nutrition5k pesó a ±1 g
con USDA); después, el envase o la etiqueta (±20 %); después, una medida casera elegida entre varias (taza, unidad,
chico, mediano o grande); después, una porción supuesta; y por último, la foto con IA (de 36 a 64 % por plato). En
todos, preguntar lo que no se ve (el aceite, el aderezo, la bebida). La incertidumbre se muestra como Moss ya lo hace: «aproximado»
y «a ojo», números redondos y el control que se mueve más despacio con lo estimado.

## 3. Cambios propuestos

### Arreglos claros

1. **Los textos de la pantalla nueva** (sección 5), en `src/textos/es.json` y `en.json`, con las mismas claves (por
   ejemplo `perfil.enQueSeBasa.fotos.titulo` y `.texto`; el nombre lo decide quien arme la pantalla). Antes, a la
   galería, como pide `CLAUDE.md`. Prueba: `npm run typecheck` (las claves del inglés) y `src/textos/tuteo.test.ts` (el
   párrafo dice «mantequilla», no «manteca», que el test prohíbe).
2. **Un test que impida nombrar otras apps** en los textos de la app, como el de
   `src/dominio/segunElDeporte.test.ts:376`: por ejemplo `src/textos/sinOtrasApps.test.ts`, que recorra es.json y en.json
   (con la función `textos()` de `tuteo.test.ts`) y falle con
   `/(?<!\p{L})(MyFitnessPal|Cal AI|Lose It!?|Foodvisor|SnapCalorie|Yazio|FatSecret|Cronometer|MacroFactor|Fitia|ChatGPT)(?!\p{L})/u`,
   sin la `i`, para que «lose it» en una frase en inglés no cuente. Sin «Gemini», que también es una constelación, ni
   «Claude». Hoy da 0 en los dos idiomas (lo comprobé con esa expresión), así que pasa desde el primer día.
3. **En `spec/nutricion.md:585`** («Lo que cambia en la privacidad si se prende»): sumar que, si se prende
   «Reconocer», cambian también `inicio.todo.pie` («Ningún número sale de una IA») y el párrafo de Perfil.

### Decisiones del dueño

4. **El margen de las etiquetas en «Cómo lo estima»** (`inicio.todo.comoEstima.alimentos.texto`, `es.json:987`).
   Propuesta: «Tablas oficiales: USDA y, en los más comunes, una segunda tabla para verificar; las cadenas, con la suya.
   Una etiqueta puede alejarse hasta un 20 % de lo real, y lo marcado «aproximado» es una estimación que se puede
   corregir.» En inglés: «Official tables: USDA and, for the most common foods, a second table to verify; chains, with
   their own. A label can be up to 20% off, and anything marked “approximate” is an estimate you can fix.» Prueba:
   typecheck y tuteo.
5. **«Reconocer (aproximado)», si se prende algún día** (`spec/nutricion.md:537-597`):
   - en `:544`, «el modelo dice qué ve», sin «y cuánto»: la cantidad sale de la persona, con la pregunta de siempre
     (chico, mediano o grande, o los gramos), como en «Decir lo que comí». Si el modelo propone un tamaño, va marcado
     «aproximado» y no reemplaza la respuesta;
   - si ve algo salteado, a la plancha o una ensalada, que pregunte el aceite como hoy (`cantidades.ts:16-26`);
   - la prueba de `:576`, con 50 platos pesados: cada uno en tres porciones (pequeña, mediana y grande, como O'Hara
     2025), con platos de la región (milanesa, guiso, tarta, ñoquis, ensalada con aderezo) y con aceite o salsa
     escondidos, y cada foto tres veces (el modelo tiene azar). Se mide, por modelo, el MAPE de las kcal, el sesgo y la
     pendiente del error contra el tamaño, y se compara con «Decir lo que comí» solo en los mismos platos. Se prende
     solo si «foto + decir» no empeora a «decir» en ninguna de las tres porciones. No suma toques: las preguntas ya
     existen.
6. **El aderezo de las ensaladas:** preguntar el aceite también ahí (hoy solo en lo salteado y a la plancha). La
   evidencia lo apoya (Zuppinger 2022, Sterling 2026), pero suma un toque en esas comidas: se discute antes, como pide
   `CLAUDE.md`.
7. **El título:** «Por qué no calculamos tu comida con una foto» (recomendado) o «Por qué tú dices cuánto comiste».

## 4. Lo que no se dice (ni se hace)

- **No nombrar otras apps ni modelos** en la app (ni Cal AI, ni MyFitnessPal, ni ChatGPT): se cita a los autores de
  cada estudio. Es lo que pidió el dueño: honesto y sin atacar a nadie.
- **No decir que la IA «no sirve» o «se equivoca siempre»:** reconoce bien los alimentos, y en el promedio de muchos
  platos puede quedar cerca. Lo que no hace es medir *tu* plato.
- **No decir que Moss «mide» exacto ni «sin error»:** calcula con tablas y con lo que dices; las tablas difieren entre sí
  y una etiqueta puede alejarse un 20 %.
- **No usar en la app el estudio de los NIH de 2026** mientras sea un resumen de congreso sin revisión por pares, ni
  cifras de sitios de «comparación» o de «metaanálisis» que no están en revistas indexadas.
- **No dar un número de error como universal** («la IA erra un 36 %»): es el de un estudio, con esos platos y esos
  modelos; se dice de qué estudio sale.
- **No prometer que nunca va a alcanzar:** los modelos mejoran. La pantalla se revisa una vez por año, o cuando se
  publique el estudio de los NIH.
- **No decir que Moss «no usa IA»:** la voz y el lector de etiquetas son reconocimiento del iPhone. Lo cierto es lo que
  ya dice: ningún número sale de una IA.
- **No hacer:** llenar gramos con lo que estima un modelo sin que la persona lo confirme; mandar la foto del diario a
  ningún lado sin el permiso y los cambios de `spec/nutricion.md:585-597`.

## 5. Para «En qué se basa Moss»

**Español**

> **Por qué no calculamos tu comida con una foto**
>
> Una foto muestra qué hay en el plato, pero no cuánto pesa ni lo que no se ve, como el aceite, la mantequilla o el
> relleno. En 52 fotos de platos pesados, tres IA de uso general erraron en promedio entre un 36 % y un 64 % de las
> calorías, y más en los platos grandes (Fridolfsson y colegas, 2025); otra IA, entrenada con miles de platos, casi
> triplicó su error cuando también tuvo que adivinar la porción (Thames y colegas, 2021). Por eso en Moss eliges el
> alimento de una base revisada, escaneas el código o la etiqueta, o dices lo que comiste, y Moss te pregunta lo que la
> foto no ve, como el aceite. Tampoco es exacto: una etiqueta puede alejarse hasta un 20 % de lo real (lo permiten las
> normas del Mercosur y de la Unión Europea), y lo calculado a ojo tiene su margen. Pero ese error lo puedes reducir
> pesando o eligiendo la porción y, si se repite parecido, el control de cada semana lo compensa con tu peso.

**English**

> **Why we don't calculate your food from a photo**
>
> A photo shows what's on the plate, but not how much it weighs or what you can't see, like oil, butter or a filling.
> In 52 photos of weighed meals, three general-purpose AIs missed the calories by 36% to 64% on average, and by more on
> larger plates (Fridolfsson and colleagues, 2025); another AI, trained on thousands of meals, nearly tripled its error
> when it also had to guess the portion (Thames and colleagues, 2021). That's why in Moss you pick the food from a
> reviewed database, scan the barcode or the label, or say what you ate, and Moss asks about what a photo can't see,
> like the oil. It isn't exact either: a label can be up to 20% off (Mercosur and EU rules allow it), and anything
> estimated by eye has its margin. But you can narrow that error by weighing or choosing the portion, and if it repeats
> in a similar way, the weekly check-in makes up for it with your weight.

Cada número sale de una fuente leída: 36 % y 64 % son el MAPE de energía de Fridolfsson 2025 (35,8 % y 64,2 %); «casi
triplicó» es 9,5 % → 26,1 % (Thames 2021, tabla 3); el 20 % es la RDC 360/2003 (3.5.1) y la guía europea de 2012. Pasa
las reglas de `src/textos/tuteo.test.ts` (lo comprobé con sus expresiones).

## 6. Fuentes

Revisiones sistemáticas y metaanálisis:

1. Ho DKN, Tseng SH, Wu MC, et al. Validity of image-based dietary assessment methods: a systematic review and
   meta-analysis. *Clin Nutr.* 2020;39(10):2945-2959. doi:10.1016/j.clnu.2020.08.002 — **solo el resumen**.
2. Höchsmann C, Martin CK. Review of the validity and feasibility of image-assisted methods for dietary assessment.
   *Int J Obes.* 2020;44(12):2358-2371. doi:10.1038/s41366-020-00693-2 — **solo el resumen**.
3. Shonkoff E, Cara KC, Pei X, et al. AI-based digital image dietary assessment methods compared to humans and ground
   truth: a systematic review. *Ann Med.* 2023;55(2):2273497. doi:10.1080/07853890.2023.2273497 — **entero**.
4. Cofre S, Sanchez C, Quezada-Figueroa G, López-Cortés XA. Validity and accuracy of artificial intelligence-based
   dietary intake assessment methods: a systematic review. *Br J Nutr.* 2025;133(9):1241-1253.
   doi:10.1017/S0007114525000522 — **solo el resumen**.
5. Zhang L, Misir A, Boshuizen H, Ocké M. A systematic review and meta-analysis of validation studies performed on
   dietary record apps. *Adv Nutr.* 2021;12(6):2321-2332. doi:10.1093/advances/nmab058 — **solo el resumen**.
6. Burrows TL, Ho YY, Rollo ME, Collins CE. Validity of dietary assessment methods when compared to the method of doubly
   labeled water: a systematic review in adults. *Front Endocrinol.* 2019;10:850. doi:10.3389/fendo.2019.00850 —
   **solo el resumen**.

Modelos e IA con fotos:

7. Fridolfsson J, Sjöberg E, Thiwång M, Pettersson S. Performance evaluation of 3 large language models for nutritional
   content estimation from food images. *Curr Dev Nutr.* 2025;9(10):107556. doi:10.1016/j.cdnut.2025.107556 —
   **entero**.
8. O'Hara C, Kent G, Flynn AC, Gibney ER, Timon CM. An evaluation of ChatGPT for nutrient content estimation from meal
   photographs. *Nutrients.* 2025;17(4):607. doi:10.3390/nu17040607 — **entero**.
9. Thames Q, Karpur A, Norris W, et al. Nutrition5k: towards automatic nutritional understanding of generic food. CVPR
   2021. https://arxiv.org/abs/2103.03375 — **entero** (el texto del PDF, con partes ilegibles; las tablas y la sección
   4.6, leídas).
10. Mu Y, Sun J, He J. Benchmarking and improving foundation model dietary estimates from meal images. ACM-BCB 2025.
    doi:10.1145/3765612.3767255 (PMC13401436) — **entero**.
11. Sterling S, Berube LT, Glenn AJ, et al. Vision-language models for image-based dietary assessment: a benchmark of
    accuracy, cost, and prompt strategies across ten models. bioRxiv, 29/7/2026 (preprint sin revisión).
    https://www.biorxiv.org/content/10.64898/2026.07.26.740845v1.full — **entero** (la tabla 2 no salió en el texto).
12. Cinar EN, Ozler E, Arslan S, Yilmaz S. Image-based nutritional assessment: evaluating the performance of ChatGPT-4o
    on simple and complex meals. *J Food Compos Anal.* 2026;150. doi:10.1016/j.jfca.2025.108843 — **solo el resumen**.
13. Coburn B, He J, Rollo ME, et al. Comprehensive evaluation of large multimodal models for nutrition analysis: a new
    benchmark enriched with contextual metadata. arXiv:2507.07048 (2025) — **solo el resumen**.
14. Liao L, Li P. Geometry-enhanced portion estimation for multimodal LLMs. arXiv:2607.16514 (2026) — **solo el
    resumen**.
15. Lo FPW, Qiu J, Wang Z, et al. Dietary assessment with multimodal ChatGPT: a systematic analysis. arXiv:2312.08592
    (2023) — **solo el resumen**.

Apps comerciales:

16. Charles O, Hengist A, et al. Photograph-based AI features in calorie-tracking apps underestimate energy content of
    meals. NUTRITION 2026, 25/7/2026 (resumen de congreso, sin revisión por pares). Comunicado de la American Society for
    Nutrition: https://www.eurekalert.org/news-releases/1136415 — **entero**; los números por app, de Healio:
    https://www.healio.com/news/primary-care/20260804/ai-photobased-calorietracking-tools-underestimate-them-by-33 —
    **entero** (es una nota de prensa; el resumen del congreso no lo abrí).
17. Li X, Yin A, Choi HY, Chan V, Allman-Farinelli M, Chen J. Evaluating the quality and comparative validity of manual
    food logging and artificial intelligence-enabled food image recognition in apps for nutrition care. *Nutrients.*
    2024;16(15):2573. doi:10.3390/nu16152573 — **entero** (el cuerpo; las tablas, en parte).
18. Zuppinger C, Taffé P, Burger G, et al. Performance of the digital dietary assessment tool MyFoodRepo. *Nutrients.*
    2022;14(3):635. doi:10.3390/nu14030635 — **casi entero** (los primeros 100.000 de 132.000 caracteres).
19. Sunto A, Aizawa K, Yamakata Y, Iida A, Suzuki S. Agreement between an artificial intelligence-based meal image
    recognition system and the weighed dietary record for estimating energy and nutrient intakes. *Nutrients.*
    2026;18(6):980. doi:10.3390/nu18060980 — **entero salvo la primera página** (el resumen no salió del PDF).

Fotos analizadas por personas y lo que estima una persona:

20. Martin CK, Correa JB, Han H, et al. Validity of the Remote Food Photography Method (RFPM) for estimating energy and
    nutrient intake in near real-time. *Obesity.* 2012;20(4):891-899. doi:10.1038/oby.2011.344 — **solo el resumen**.
21. Höchsmann C, Diktas HE, Myers CA, et al. The validity of measuring energy and nutrient intake with the Remote Food
    Photography Method (RFPM) in adolescents. *Am J Clin Nutr.* 2026;124(3):101452. doi:10.1016/j.ajcnut.2026.101452 —
    **solo el resumen**.
22. Boushey CJ, Spoden M, Delp EJ, et al. Reported energy intake accuracy compared to doubly labeled water and usability
    of the mobile food record among community dwelling adults. *Nutrients.* 2017;9(3):312. doi:10.3390/nu9030312 —
    **casi entero** (los primeros 100.000 de 152.000 caracteres).
23. Williamson DA, Allen HR, Martin PD, et al. Comparison of digital photography to weighed and visual estimation of
    portion sizes. *J Am Diet Assoc.* 2003;103(9):1139-1145. doi:10.1016/s0002-8223(03)00974-x — **solo el resumen**.
24. Nelson M, Atkinson M, Darbyshire S. Food photography I: the perception of food portion size from photographs.
    *Br J Nutr.* 1994;72(5):649-663. doi:10.1079/bjn19940069 — **solo el resumen**.
25. Block JP, Condon SK, Kleinman K, et al. Consumers' estimation of calorie content at fast food restaurants: cross
    sectional observational study. *BMJ.* 2013;346:f2907. doi:10.1136/bmj.f2907 — **solo el resumen**.
26. Dunn CG, Turner-McGrievy GM, Wilcox S, Hutto B. Dietary self-monitoring through calorie tracking but not through a
    digital photography app is associated with significant weight loss: the 2SMART pilot study. *J Acad Nutr Diet.*
    2019;119(9):1525-1532. doi:10.1016/j.jand.2019.03.013 — **solo el resumen** (no dice si la app de fotos calculaba
    calorías).

Etiquetas:

27. 21 CFR 101.9 (FDA, EE. UU.), párrafos (c)(1) y (g)(3) a (g)(5). https://www.law.cornell.edu/cfr/text/21/101.9 —
    **esos párrafos**.
28. Comisión Europea, DG SANCO. Guidance document for competent authorities for the control of compliance with EU
    legislation [...] with regard to the setting of tolerances for nutrient values declared on a label, diciembre de 2012.
    https://food.ec.europa.eu/system/files/2016-10/labelling_nutrition-vitamins_minerals-guidance_tolerances_1212_en.pdf
    — **entero**.
29. ANVISA, RDC n.º 360, 23/12/2003 (Brasil incorpora las GMC 44/03 y 46/03 del Mercosur), punto 3.5.1.
    https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2003/rdc0360_23_12_2003.html — **la sección 3.5 y el preámbulo**.
    Uruguay aprueba la misma GMC 46/03 por el Decreto 117/006: https://www.impo.com.uy/bases/decretos/117-2006 — **la
    página del decreto** (el anexo con el texto de la resolución no lo abrí).
30. Jumpertz R, Venti CA, Le DS, et al. Food label accuracy of common snack foods. *Obesity.* 2013;21(1):164-169.
    doi:10.1002/oby.20185 — **solo el resumen**.
31. Urban LE, McCrory MA, Dallal GE, et al. Accuracy of stated energy contents of restaurant foods. *JAMA.*
    2011;306(3):287-293. doi:10.1001/jama.2011.993 — **solo el resumen**.
32. Urban LE, Dallal GE, Robinson LM, et al. The accuracy of stated energy contents of reduced-energy, commercially
    prepared foods. *J Am Diet Assoc.* 2010;110(1):116-123. doi:10.1016/j.jada.2009.10.003 — **solo el resumen**.

Del repo de Moss (leídos enteros en lo citado): `src/textos/es.json`, `src/textos/en.json`, `src/textos/tuteo.test.ts`,
`src/dominio/control.ts`, `src/dominio/cantidades.ts`, `src/comida/platos.ts`, `spec/nutricion.md` (499-597 y 990-1000),
`spec/fuentes.md`, `spec/registrar-rapido.md` (1.2), `galeria/src/fotos.js` y `docs/privacidad/index.html`.

Quién lo pagó, cuando la industria o los autores del método están en el medio: Sunto 2026 lo firman dos creadores de
FoodLog Athl; el RFPM (Martin 2012, Höchsmann 2026) y el mFR (Boushey 2017) los evalúan los grupos que los crearon;
Nutrition5k (Thames 2021) es de Google. Sterling 2026: una autora declara apoyo del Almond Board of California y de la
American Heart Association, sin relación con el tema. Los demás, sin financiación o con fondos públicos (NIH, JSPS,
cantón de Vaud).
