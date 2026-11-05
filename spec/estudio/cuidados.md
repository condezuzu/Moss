# Cuidados de salud: qué marcar y cómo cambia la dieta

Área: los cuidados de salud (hoy, «¿Alguno es tu caso?» y «sin déficit»). Pedido del dueño (5/11/2026):
«si tienes algún problema lo marcas y, dependiendo de lo que tengas, se edita tu dieta».

**Cómo lo hice.** Leí el código y la spec de Moss (abajo, «Qué hace Moss hoy», con archivo y línea) y,
para cada condición, la guía más fuerte que pude abrir. Los PDF (FDA, KDIGO, MDCG) los leí sacándoles el
texto; de las páginas de PMC busqué en el texto completo las recomendaciones (en «Fuentes» dice «partes»).
Lo que no pude abrir está en «Lo que no pude leer» y no se usa como fuente. Nada del repo se tocó.

---

## 1. Resumen

1. **«Sin déficit» sin el motivo no alcanza para cuidar bien.** Un solo sí/no (embarazo, lactancia o «una
   condición») obliga a la misma regla para casos que piden lo contrario: en el embarazo hay que **aumentar**
   de peso (IOM 2009), en la diabetes tipo 2 conviene **bajar** un 5 a 7 % (ADA 2026, grado A), y en la
   enfermedad renal la proteína tiene que **bajar** a 0,8 g/kg (KDIGO 2024). Hoy Moss no puede hacer ninguna
   de las tres cosas.
2. **Tres errores concretos de hoy, con el sí/no:**
   - **El embarazo:** el control de cada semana sigue corriendo y lee el aumento de peso del embarazo como
     comer de más. Va bajando la meta hasta que el peso deja de subir, que es lo contrario del IOM 2009 (de
     11,5 a 16 kg con un IMC normal).
   - **El riñón:** la proteína queda en la de mantener, 1,6 g/kg. Pasa el tope de KDIGO 2024 (no más de
     1,3) y duplica su recomendación (0,8). La spec ya lo había marcado como pendiente.
   - **El agua:** Moss sigue pidiendo 2 L con «sin déficit». A quien tenga el líquido limitado por su equipo
     no le conviene, y con cálculos en los riñones es poco: la guía europea pide de 2,5 a 3 L.
3. **El ejemplo de la pregunta está mal.** «Diabetes, problemas de riñón o un trastorno de la alimentación»
   pone la diabetes como motivo para no bajar de peso. La ADA 2026 recomienda bajar al menos un 5 a 7 % con
   sobrepeso (3.3 y 5.12, grado A). Es un arreglo de texto que puede ir por OTA.
4. **Las referencias de micronutrientes del embarazo y la lactancia ya están programadas y nunca se usan:**
   `micronutrientes.ts` tiene hierro 27 mg, folato 600 µg y cafeína hasta 200 mg, pero la app arma la persona
   sin la etapa (`HojaRegistro.tsx:238`). Una embarazada ve las de cualquier mujer.
5. **La propuesta: 13 condiciones y «Otra», en 5 grupos.** Embarazo y lactancia; prediabetes o diabetes
   tipo 2 y diabetes tipo 1; presión alta y colesterol o triglicéridos altos; enfermedad renal crónica y
   cálculos; reflujo, celiaquía y gota; antecedentes de un trastorno de la conducta alimentaria (TCA) y
   medicamento para bajar de peso (GLP-1). Cada una cambia la meta y los avisos según su guía, en
   `src/dominio/cuidados.ts`, y si hay varias gana la regla más cuidadosa. Quedan afuera, con su porqué:
   hipotiroidismo, SOP, colon irritable, lactosa, anemia, osteoporosis, cirugía bariátrica y alergias.
6. **El principio que mantiene a Moss como app de bienestar:** con un cuidado, Moss vuelve a las
   recomendaciones para toda la población (OMS, Academias Nacionales, ADA, KDIGO) y **apaga lo que va más
   allá** (el déficit, la proteína alta, keto, los avisos de comer más o de tomar más agua). Nunca da dosis ni
   dietas terapéuticas, y nunca promete tratar nada. La FDA (2026) pone como ejemplo de bienestar justo esto:
   contar calorías y comer sano «puede ayudar a vivir bien con» la presión alta y la diabetes tipo 2. En
   Europa no hay ese margen: lo que decide es cómo se dice, y por eso se cuidan las palabras.
7. **La privacidad: lo que se marca, solo en el iPhone.** No sube a la cuenta ni llega a Ascent, y queda
   fuera de la copia de iCloud (ya lo está la base local). A la cuenta va solo lo que se deriva: el
   `sin_deficit` de hoy y una bandera neutra de «control en pausa». Para Apple, lo que no sale del teléfono
   no se «recopila», así que la etiqueta no cambia. Si subiera, el embarazo sería *Sensitive Info*. Al
   marcar se pide un consentimiento explícito (RGPD art. 9; Ley 18.331 art. 18).
8. **Lo que hacen las otras apps:** ninguna de las cinco cambia las metas por una condición médica.
   Cronometer cambia los micronutrientes con el embarazo y la lactancia. MyFitnessPal y Lose It! dicen que
   pongas a mano las calorías que te dé tu médico. MacroFactor y Noom avisan que no son para tratar nada.
   Moss estaría adelante, y también más expuesta: por eso importan el lenguaje y los límites.
9. **Cinco arreglos claros sirven ya, con el sí/no de hoy:**
   - el texto del ejemplo;
   - sin keto con «sin déficit»;
   - que el control nunca baje la meta con «sin déficit»;
   - no pedir agua con «sin déficit»;
   - la frase de `decisiones.md` que dice que no es un dato de salud.

   Hay un sexto error que necesita saber la condición: el aviso de la «última comida» se apaga con «sin
   déficit», y es justo lo que pide la guía del reflujo. Lo demás es una decisión del dueño (sección 10).

---

## 2. Qué hace Moss hoy

| Qué | Dónde | Cómo |
|---|---|---|
| La pregunta | `src/secciones/entrada/Entrada.tsx:721-745`; `src/textos/es.json:349-357` (`entrada.cuidado`); galería `galeria/src/entrada.js:1386-1400` | «¿Alguno es tu caso?»: «Embarazo o lactancia» (solo con sexo «f»), «Una condición médica que cuida lo que como» con el ejemplo «Diabetes, problemas de riñón o un trastorno de la alimentación, por ejemplo.», «Nada de esto». Aviso: «Moss no te propondrá comer menos de lo que gastas…» |
| Lo que se guarda | `Entrada.tsx:243` (`sinDeficit: caso !== 'nada'`); `Entrada.tsx:135` (al volver, `caso: p.sinDeficit ? 'condicion' : 'nada'`); `src/dominio/metas.ts:13-17` | Un booleano. El motivo se pierde. |
| Lo que sube | `src/almacen/remoto.ts:56,134`; `supabase/moss/0006_alimentos.sql:14` | `moss.perfiles.sin_deficit`, declarado como *Health* (`spec/revision.md:136`) |
| Perfil › Cuidados | `src/secciones/perfil/Perfil.tsx:103-109`; galería `perfil.js:912-914` | Tocar cambia el sí/no sin preguntar; con «sin déficit» se esconde Entrenamiento (`Perfil.tsx:105`) |
| Bajar → mantener | `metas.ts:122-125` (`objetivoPermitido`); `cuestionario.ts:221-223` (`objetivoUsado`); `Progreso.tsx:266-273` | Con «sin déficit» no se baja ni se recompone; «subir» sí |
| El control de cada semana | `src/dominio/control.ts:129-162` (el gasto medido, línea 152); `src/almacen/almacen.ts:495-512` | Corre igual con «sin déficit»: gasto = lo comido − cambio de la tendencia × 7.700 / días; meta = `metaPara` en mantener |
| La proteína | `metas.ts:79-80` (bajar 2,0, mantener 1,6, subir 1,8); `cuestionario.ts:262-269` (niveles 1,2 a 2,2) | Con «sin déficit», la de mantener: 1,6 g/kg (1,2 a 2,0 según el nivel) |
| El piso | `metas.ts:77-78` | 1.200 kcal mujeres, 1.500 hombres |
| Los estilos | `metas.ts:25-26,86-91,164` | Keto (30 g de carbohidratos) disponible con cualquier cuidado |
| La grasa corporal | `cuestionario.ts:36-45`; `spec/nutricion.md:751-754` | No se pregunta con cuidados ni antes de los 18; sin recomposición |
| Micronutrientes por etapa | `src/dominio/micronutrientes.ts:45-99` | Embarazo y lactancia con sus referencias (DRI) y cafeína hasta 200 mg; **no se usan**: `HojaRegistro.tsx:238` y `segunElDeporte.ts:313` arman la persona sin `etapa` |
| Lo que falta | `src/dominio/loQueFalta.ts:178` | Con «sin déficit», nunca |
| Para hoy | `src/dominio/paraHoy.ts:86,107` | Con «sin déficit», solo anotar y el agua |
| El agua | `loQueFalta.ts:81`; `paraHoy.ts:65-67,107`; `src/widgets/index.ts:32` | 2.000 ml para todos; se pide igual con «sin déficit» |
| Lo que conviene | `src/dominio/loQueConviene.ts:66,171,191,217,237,264` | Con «sin déficit» se apagan antes y después de entrenar, el café antes de entrenar, la última comida (3 h antes de la cama) y el partido y la carrera |
| Entrenar | `alrededorDelEntreno.ts:227-239`; `diagnostico.ts:112`; `segunElDeporte.ts:163-164,347,358` | Con «sin déficit», nada de lo que es de comer |
| Las alergias del plan | `src/dominio/plan.ts:19-21,101` | 9 alérgenos; la avena cuenta como gluten |
| La spec | `spec/decisiones.md:721-725`; `spec/entreno.md:616-636,940-943`; `spec/nutricion.md:681,751-754`; `spec/revision.md:136,150,553,766,942` | «Sin déficit, sin guardar el porqué… no es un dato de salud que haya que cuidar»; en entreno.md, pendiente: «la meta de 1,6 g/kg pasa el tope de KDIGO» |
| El sitio | `docs/privacidad/index.html:47`; `docs/terminos/index.html:42` | «Moss solo guarda que tus metas van sin déficit, no el motivo» |

La base de alimentos (`assets/alimentos.db`, 14.939 alimentos, leída sin cambiarla) tiene:

| Nutriente | Alimentos con el dato |
|---|---|
| Sodio | 97 % |
| Grasas saturadas | 95 % |
| Fibra | 93 % |
| Azúcares totales (no los añadidos) | 83 % |
| Potasio | 79 % |
| Fósforo | 78 % |
| Colesterol | 78 % |
| Alcohol | 69 % |
| Cafeína | 67 % |
| Grasas trans | **24 %** |

**No tiene** gluten, lactosa, purinas, oxalato, FODMAP, yodo, colina, omega-3 por separado ni azúcares
añadidos. Sí tiene por nombre:

- queso fresco, salame, jamón crudo, paté, salmón y arenque ahumados, brotes;
- pez espada, deslactosados y «sin gluten/sin TACC».

---

## 3. Tabla de veredictos

| Qué calcula o afirma Moss | Dónde | Veredicto | La mejor evidencia | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| Un solo sí/no para todos los cuidados | `metas.ts:13-17`; `decisiones.md:721-725` | **A medias** | Cada guía pide otra cosa: aumentar (IOM 2009 [6]), bajar 5–7 % (ADA 2026, A [1][2]), proteína 0,8 (KDIGO 2024, 2C [4]) | Guardar cuál, solo en el teléfono | La condición | No |
| Con «sin déficit», bajar → mantener, para todos | `metas.ts:122-125`; `cuestionario.ts:221-223` | **A medias** | Bien en el embarazo [6], el TCA [30-32] y el riñón sin equipo [4]. Refutado con DM2 o prediabetes [1][2][3], dislipemia (5–10 %) [17], reflujo (fuerte, moderada) [21] y gota [20] | El déficit según la condición (sección 6) | La condición | No |
| El ejemplo «Diabetes…» en la pregunta | `es.json:353` | **Refutado** para DM2 | ADA 2026: 3.3 (A), 5.12 (A), 8.8a (A: 500–750 kcal/d) [1][2][3] | Sacar «Diabetes» del ejemplo | — | Sí (texto) |
| Proteína con «sin déficit»: 1,6 g/kg | `metas.ts:80`; `cuestionario.ts:262-267` | **Refutado** para riñón y cálculos | KDIGO 2024 Rec. 3.3.1.1 (0,8; 2C), PP 3.3.1.1 (>1,3 no) [4]; EAU 2026: proteína animal 0,8–1,0 [19] | 0,8 con ERC; ≤1,0 con cálculos; ≤1,2 sin saber cuál | La condición | No |
| El control de cada semana en el embarazo | `control.ts:150-158`; `almacen.ts:495-512` | **Refutado** | IOM 2009: 11,5–16 kg con IMC normal; 0,42 kg/sem en el 2.º y 3.er trimestre [6]. NASEM 2023: el tejido nuevo tiene su costo aparte [5] | En pausa; meta = gasto previo + Δ de NASEM; la banda del IOM | Semana (o fecha probable de parto) y peso de antes | No |
| Referencias del embarazo y la lactancia | `micronutrientes.ts:77-86`; sin uso en `HojaRegistro.tsx:238`, `segunElDeporte.ts:313` | **Bien escritas, sin uso** | DRI (no las revisé una por una); el hierro de 27 mg está en el rango de ODS [25] | Pasar `etapa` desde Cuidados | Embarazo o lactancia | No |
| Cafeína hasta 200 mg en la lactancia | `micronutrientes.ts:84-86` | **Convención** (prudente) | CDC: unos 300 mg/d [12]; IOM 1991: 1–2 tazas [7] | 200 (como hoy) o 300 (CDC) | — | Sí |
| Lactancia: nunca déficit | `metas.ts:122-125` | **A medias** | IOM 1991: 0,5–1 kg/mes; hasta 2 kg/mes; ≥1.800 kcal; <1.500 nunca [7]. Lovelady 2000, ECA n=40: ~0,5 kg/sem desde la semana 4, sin efecto en el bebé [8] | Sin déficit las primeras 4–6 semanas; después, suave, con piso 1.800 | Fecha del parto | No |
| Energía de la lactancia | no existe | **Falta** | NASEM 2023: +404 kcal (0–6 meses), +381 (7–12) [5]; CDC: +330–400 [12] | +400 / +380 al arrancar; después mide el control | Fecha del parto | No |
| Agua: 2 L, pedida igual con «sin déficit» | `loQueFalta.ts:81,204`; `paraHoy.ts:107`; `widgets/index.ts:32` | **A medias** | EAU 2026: 2,5–3 L con cálculos (fuerte) [19]. Con riñón o «otra», el líquido lo decide el equipo (convención) | Cálculos: 2,5–3 L. Riñón u otra: no pedir | La condición | No |
| La «última comida» se apaga con «sin déficit» | `loQueConviene.ts:66,237` | **Refutado** para reflujo | ACG 2022: no comer 2–3 h antes de acostarse (condicional, baja) [21] | Prender con reflujo; apagar con TCA | La condición | No |
| Keto con cualquier cuidado | `metas.ts:90-91,164` | **Refutado** | ADA 2026: muy bajo en carbohidratos no se recomienda en embarazo, lactancia, enfermedad renal ni con TCA; evitar con iSGLT2 (5.26) [1] | Sin keto con esos y con DM1, DM2 con insulina y «otra» | La condición | No |
| Piso 1.200/1.500 | `metas.ts:77-78` | **A medias** en lactancia y GLP-1 | IOM 1991: ≥1.800 kcal con déficit [7]. GLP-1: riesgo de micronutrientes con menos de 1.200 (mujeres) o 1.800 (hombres) [29] | Lactancia: 1.800; GLP-1: decisión | La condición | No |
| Sin grasa corporal con cuidados | `cuestionario.ts:36-45` | **Se sostiene** (convención prudente) | En el embarazo la fórmula no sirve (`progreso.md:148`); el rastreo se asocia a los TCA [30][31][32] | Igual | — | Sí |
| Todo lo de entrenar se apaga con «sin déficit» | `alrededorDelEntreno.ts:227-239`; `diagnostico.ts:112`; `segunElDeporte.ts:163-164` | **A medias** | Con DM1, lo de comer al entrenar va con el plan de insulina (ADA 5.27, 5.28) [1]. Con presión, colesterol, gota, reflujo, celiaquía o DM2, nada lo contraindica | Apagar solo con embarazo, lactancia, DM1, riñón, TCA y «otra» | La condición | No |
| «Lo que falta» se apaga con «sin déficit» | `loQueFalta.ts:178`; `paraHoy.ts:86` | **A medias** | Bien con riñón y TCA [4][30]. Con GLP-1, la proteína es una prioridad [29] | Según la condición | La condición | No |
| «No es un dato de salud que haya que cuidar» | `decisiones.md:722-723` | **Refutado** | RGPD, considerando 35: todo dato que revele el estado de salud [39]. Apple *Health* incluye «any other user provided health or medical data» [37] | Es un dato de salud; ya se declara así (`revision.md:136`) | — | Sí |
| «Sensitive Info incluye el embarazo: por eso solo "sin déficit"» | `revision.md:150` | **Se sostiene** | Apple: «pregnancy or childbirth information» es *Sensitive Info*; lo procesado solo en el teléfono no se recopila [37] | La condición, solo en el teléfono: la etiqueta no cambia | — | — |
| «Moss nunca habla de glucosa, insulina ni hipoglucemia» | `entreno.md:624-627` | **Se sostiene** | FDA 2026: lo que da dosis de medicamentos no es bienestar [33]. MDCG: calcular la insulina es un dispositivo médico [35] | Igual; solo la línea «habla con tu equipo» | — | Sí |
| La avena cuenta como gluten | `plan.ts:101` | **Se sostiene** (celiaquía) | ACG 2013: sin gluten de por vida (fuerte, alta); la avena pura, con cautela (fuerte, moderada) [22] | Igual | — | Sí |
| Embarazo y lactancia solo con sexo «f» | `Entrada.tsx:725` | **Convención** | — | Igual | — | Sí |
| Clasificación: *Medical or Treatment Information*: None | `revision.md:942` | **Se sostiene hoy**; con Cuidados, *Infrequent* | El cuestionario de Apple (`revision.md:921-959`) | Cambiar la respuesta; la clasificación sigue en 16+ | — | — |

---

## 4. Qué condiciones marcar

**El criterio para entrar a la lista:**

- que sea frecuente;
- que una guía fuerte cambie algo que Moss calcula o dice;
- que Moss tenga el dato para hacerlo;
- o que, sin marcarla, Moss haga algo que no conviene.

### Las que entran: 13 y «Otra»

| Grupo | Condición (clave) | Por qué entra |
|---|---|---|
| Embarazo y lactancia (solo «f») | Embarazo (`embarazo`) | Hoy el control va en contra del aumento esperado; cambian la energía, los micronutrientes, el alcohol, la cafeína y el pescado [5][6][9][10][11] |
| | Lactancia (`lactancia`) | Más energía; se puede bajar despacio después del primer mes; el piso es más alto [5][7][8][12] |
| Azúcar en sangre | Prediabetes o diabetes tipo 2 (`diabetes2`) | Bajar ayuda (A); hoy «sin déficit» lo impide [1][2][3] |
| | Diabetes tipo 1 (`diabetes1`) | Sin keto; nada de comer alrededor del entreno sin su equipo; nunca insulina [1] |
| Corazón | Presión alta (`presion`) | Sodio y potasio, que la base tiene (97 y 79 %) [14][15][16] |
| | Colesterol o triglicéridos altos (`colesterol`) | Saturadas, colesterol y fibra, que la base tiene [17] |
| Riñones | Enfermedad renal crónica (`renal`) | La proteína de Moss la daña; sodio; no pedir agua [4] |
| | Cálculos en los riñones (`calculos`) | Agua de 2,5 a 3 L, sal y proteína [19] |
| Digestión y articulaciones | Reflujo (`reflujo`) | La «última comida» ya existe y hoy se apaga [21] |
| | Celiaquía (`celiaquia`) | La exclusión del gluten ya existe en el plan [22] |
| | Gota (`gota`) | Alcohol y bebidas azucaradas, que la base tiene [20] |
| Lo que pide más cuidado | Antecedentes de un TCA (`tca`) | El conteo puede hacer daño: hay que apagar mucho [30][31][32] |
| | Medicamento para bajar de peso, GLP-1 o tirzepatida (`glp1`) | La proteína, las comidas chicas, los micronutrientes y el piso [3][29] |
| | Otra condición o prefiero no decir (`otra`) | Lo de hoy, más seguro |

### Las que quedan afuera, y adónde van

| Condición | Por qué no | Adónde va |
|---|---|---|
| Hipotiroidismo | No hay una meta distinta que una guía pida: el control de cada semana mide el gasto real. Lo que importa, la hora del remedio, es médico (convención: no busqué guía) | Nada; una línea en «En qué se basa Moss» |
| SOP | La guía internacional 2023: «no hay evidencia» de que una composición de dieta sea mejor que otra (3.3.1, ⊕◯◯◯). Sirve cualquier patrón sano. Pide atención a los TCA sin importar el peso y al estigma [28] | Listarla haría creer que hay una dieta especial |
| Colon irritable | La dieta baja en FODMAP es «una prueba limitada» (ACG 2021) [23]. La base no tiene FODMAP ni la fibra soluble | «Otra», si la persona quiere |
| Intolerancia a la lactosa | La mayoría no necesita dejar los lácteos, y dejarlos baja el calcio y la vitamina D (NIH 2010) [24] | «No como…»: «sin lactosa», que prefiere los deslactosados (la base los tiene); no la alergia a la leche |
| Anemia por falta de hierro | El tratamiento lo indica el médico. La comida ayuda: el hierro hemo y la vitamina C con el de las plantas (ODS) [25] | Una función aparte: «Lo que quiero mirar: hierro» |
| Osteoporosis | Calcio de 1.000 a 1.200 mg y vitamina D (BHOF 2022) [26]: Moss ya usa el calcio por edad. Bajando de peso con pesas se pierde menos hueso y músculo (Villareal 2017, ECA n=160) [27] | «Lo que quiero mirar: calcio y vitamina D» y el ritmo suave |
| Cirugía bariátrica | La dieta va por etapas con el equipo, con controles de micronutrientes de por vida (ADA 2026, 8.25) [3]. Moss no tiene esos protocolos | «Otra» y las metas a mano de su equipo |
| Alergias | Ya están en «No como…» (9 alérgenos, `plan.ts:19-21`) | Un enlace desde Cuidados |
| Edad mayor | Sale de la edad: Moss ya cambia micronutrientes por tramo (`micronutrientes.ts:52-75`) | Nada |
| Insuficiencia cardíaca, cirrosis, cáncer y otras | Las pautas son del equipo | «Otra» |

---

## 5. Cada condición: qué cambia

Para todas:

- **Línea de Moss:** cada condición tiene una, corta, en la ficha de Cuidados y en «Cómo se calcula» (Apple
  1.4.1 pide decir el método y recordar al médico [36]).
- **Notificaciones:** nunca nombran la condición.
- **Profesional:** «sugerido» (Moss lo dice) o «necesario» (Moss lo dice y no calcula sola lo que es del
  equipo).

### 5.1 Embarazo

**Lo que se pregunta:**

- la fecha probable de parto (o la semana);
- el peso de antes del embarazo («no sé» = el de hoy en el primer trimestre);
- si son mellizos.

Antes de los 18 años, Moss no calcula y usa las metas a mano. Es una convención: NASEM tiene ecuaciones
para adolescentes, pero no las leí.

**La meta:**

- **Déficit:** no. En Progreso, en lugar del peso meta y del plan, «Tu embarazo»: la semana y la banda del
  IOM 2009 según el IMC de antes, sin alarmas [6].

  | IMC de antes | Total | Por semana en el 2.º y 3.er trimestre |
  |---|---|---|
  | <18,5 | 12,5 a 18 kg | 0,44 a 0,58 kg |
  | 18,5 a 24,9 | 11,5 a 16 kg | 0,35 a 0,50 kg |
  | 25 a 29,9 | 7 a 11,5 kg | 0,23 a 0,33 kg |
  | ≥30 | 5 a 9 kg | 0,17 a 0,27 kg |

  En el primer trimestre, de 0,5 a 2 kg. Con mellizos, rangos provisorios: 17 a 25, 14 a 23 y 11 a 19 kg [6].
- **Kcal:** en el primer trimestre no cambian: NASEM 2023 no suma nada, porque el aumento de esas semanas es
  menor [5]. En el 2.º y 3.º,
  Δ = TEE del embarazo − TEE sin embarazo + el depósito [5]:
  - TEE del embarazo: edad, altura, **peso de hoy**, semana y actividad. Tiene un término de 9,16 kcal
    por semana de gestación.
  - TEE sin embarazo: edad, altura, **peso de antes** y actividad.
  - El depósito, según el IMC de antes: +300, +200, +150 o −50.
  - Ejemplo: 30 años, 165 cm, de 65 a 68 kg, semana 20, actividad «algo» (poco activa), IMC 23,9: **+410
    kcal**. Con «poco» (inactiva), +260.
  - El Δ se suma al último gasto que midió Moss, o al del cuestionario. Se muestra «aproximado» y de a 10.
- **Control de cada semana:** en pausa. El aumento del embarazo no es grasa a 7.700 kcal/kg. Con el
  control, la meta bajaría hasta que el peso no suba.
- **Proteína:** la de mantener, sin «más alta» (convención). **Estilos:** sin keto [1]. **Fibra:** igual.

**Micronutrientes:** con `etapa: 'embarazo'` ya salen hierro 27 mg, folato 600 µg, cafeína hasta 200 mg y
los demás de `micronutrientes.ts`. No hay en la base: yodo, colina y DHA. El folato nunca se da por
«cubierto»: la USPSTF recomienda además un suplemento de ácido fólico de 0,4 a 0,8 mg (A) [13]. Como Moss
no nombra suplementos, la línea dice «tu equipo te dirá qué vitaminas tomar».

**Alimentos a marcar:**

| Qué | Por qué | ¿La base lo tiene? |
|---|---|---|
| Alcohol | «There is no known safe amount» (CDC) [10] | Sí, el 69 % |
| Cafeína | El tope de 200 mg | Sí |
| Listeria | Queso fresco sin calentar; quesos de leche cruda; fiambres, embutidos y salchichas sin calentar; paté; pescado ahumado refrigerado; brotes crudos [11] | Por nombre, en los curados: queso fresco, salame, jamón crudo, paté, salmón y arenque ahumados, brotes. Va una lista curada en `alimentos/genericos.txt`, no por categoría |
| Mercurio alto | Caballa gigante (*king mackerel*), marlín, reloj anaranjado, tiburón, pez espada, blanquillo del Golfo de México y atún patudo [9] | Solo el pez espada. **No** marcar la caballa común |
| Pescado bajo en mercurio | De 8 a 12 onzas por semana (unos 225 a 340 g), 2 o 3 porciones [9] | Puede ser un hábito sugerido |

**Avisos:**

- Se apagan, como hoy: lo de entrenar, «lo que falta», la noche corta y «pesarse» de fábrica.
- Siguen: anotar y el agua.
- Sin alarmas por el peso.

**Línea:**

- ES: «Durante el embarazo, Moss no te propone bajar de peso, suma lo que piden el segundo y el tercer
  trimestre y pausa el control de cada semana. Tu equipo de salud sigue tu peso contigo.»
- EN: «During pregnancy, Moss won't suggest losing weight, adds what the second and third trimesters need and
  pauses the weekly check-in. Your healthcare team follows your weight with you.»

**Profesional:** necesario (el control prenatal). La información educativa para embarazadas está entre lo
que la FDA decide no exigir aunque fuera un dispositivo (*enforcement discretion*) [34].

**Al llegar la fecha:** a las dos semanas de la fecha probable, Moss pregunta «¿Ya nació?» y pasa a
lactancia o a nada.

### 5.2 Lactancia

**Lo que se pregunta:** la fecha del parto y si es solo pecho.

**La meta:**

- **Kcal:** al arrancar, gasto +400 (de 0 a 6 meses) o +380 (de 7 a 12). Son las 404 y 381 de NASEM, que
  ya descuentan una baja de 0,64 kg/mes [5]; la CDC dice de 330 a 400 [12]. Con pecho y fórmula, la mitad
  (convención). Después mide el control de cada semana, que ve el gasto real, con la leche incluida.
- **Déficit:** no en las primeras 4 a 6 semanas. El IOM no recomienda hacer dieta en las primeras 2 o 3 [7]
  y el ensayo de Lovelady empezó en la semana 4 [8]. Después, decisión del dueño: ritmo suave o
  recomendado, **piso de 1.800 kcal** (nunca menos de 1.500) [7], hasta unos 0,5 kg/sem [8] y no más de
  2 kg/mes [7].
- **Proteína:** la de mantener. **Estilos:** sin keto [1].

**Micronutrientes:** `etapa: 'lactancia'` (ya en Moss). La cafeína, 200 (Moss) o unos 300 (CDC) [12]:
decisión. Yodo, 290 µg [12]: la base no lo tiene. Con dieta vegana, la vitamina B12 [12]: Moss tiene la
dieta y la B12, y dice «habla con tu equipo sobre la vitamina B12».

**Alimentos a marcar:**

- el alcohol: el IOM dice no más de 0,5 g por kilo y por día [7];
- el pescado con mercurio, como en el embarazo [9][12].

**Avisos:** como hoy en las primeras semanas; después del primer mes, vuelven los de comida (decisión).

**Línea:**

- ES: «Mientras amamantas, Moss suma unas 400 kcal por día. Si quieres bajar de peso, desde el segundo
  mes y despacio.»
- EN: «While you breastfeed, Moss adds about 400 kcal a day. If you want to lose weight, start after the
  first month and go slowly.»

**Profesional:** sugerido.

### 5.3 Prediabetes o diabetes tipo 2

**Lo que se pregunta:** «¿Usas insulina u otro remedio que puede bajarte mucho el azúcar?» (sí / no / no sé).

**La meta:**

- **Déficit:** sí. Bajar al menos un 5 a 7 % con un plan reducido en calorías y 150 minutos de actividad
  (3.3, A) [2]; 5.12 (A) [1]; un déficit de 500 a 750 kcal/d (8.8a, A) [3]. Con insulina o sulfonilureas,
  la línea y un ritmo hasta el recomendado (decisión).
- **Patrón:** no hay un reparto ideal [1]. Para prevenir: mediterráneo o bajo en carbohidratos (3.4, B) [2].
- **Keto:** solo sin insulina (decisión). La ADA pide supervisión médica para lo muy bajo en
  carbohidratos y evitarlo con iSGLT2 [1].
- **Fibra:** al menos 14 g cada 1.000 kcal (5.24, B) [1]; Moss ya la usa como meta suave.
- **Sodio:** menos de 2.300 mg/d (5.20, B) [1].
- **Saturadas:** limitarlas (5.31, B) [1].
- **Alcohol:** sin pasar los límites; quien no toma, que no empiece (5.18, B) [1].

**Micronutrientes:** nada especial. La ADA no recomienda suplementos para el azúcar (5.16, C) [1].

**Alimentos a marcar:** las bebidas azucaradas (5.25) [1]. La base tiene azúcares totales (83 %) y la
categoría «bebidas», pero no los azúcares añadidos.

**Avisos:** todos, como sin cuidados, con el sodio a la vista.

**Línea:**

- ES: «Comer variado y, si lo necesitas, bajar un poco de peso puede ayudar a vivir bien con la diabetes
  tipo 2. Si usas insulina u otro remedio para el azúcar, habla con tu equipo antes de comer menos.»
- EN: «Eating a varied diet and, if you need to, losing a little weight may help you live well with type 2
  diabetes. If you take insulin or another glucose-lowering medicine, talk to your healthcare team before
  eating less.»

**Profesional:** sugerido (un nutricionista, 5.10, A) [1]; necesario con insulina. Ayudar a quien tiene
prediabetes a comer mejor está entre lo que la FDA decide no exigir (*enforcement discretion*) [34].

### 5.4 Diabetes tipo 1

**La meta:**

- **Déficit:** suave como mucho (decisión). Moss nunca calcula insulina ni la relación con los
  carbohidratos [33][35].
- **Carbohidratos:** a la vista en cada comida, como ya están. La ADA pide educar sobre los carbohidratos
  según el plan de insulina (5.27, A) y, con dosis fijas, comer carbohidratos parejos (5.28, B) [1]. Moss
  muestra «tu comida de siempre» con sus carbohidratos, sin hablar de dosis.
- **Keto:** no (5.26 y el riesgo de cetoacidosis) [1].

**Alcohol:** la ADA advierte la hipoglucemia tardía (5.19) [1]. Moss no habla de glucosa: la línea lo deja
al equipo.

**Avisos:** se apagan lo de comer antes y después de entrenar, y «en ayunas» (convención: va con el plan de
insulina).

**Línea:**

- ES: «Moss te muestra los carbohidratos de cada comida, pero no calcula insulina ni te dice qué comer para
  entrenar: eso lo acuerdas con tu equipo.»
- EN: «Moss shows you the carbs in each meal, but it doesn't calculate insulin or tell you what to eat
  around exercise: that's for you and your healthcare team.»

**Profesional:** necesario.

### 5.5 Presión alta

**La meta:**

- **Déficit:** sí. La guía AHA/ACC 2025 pide un peso cercano al normal, según el comentario de los
  editores de *Hypertension* [16].
- **Sodio:** menos de 2.000 mg/d (OMS) [14]. Los resúmenes de la guía 2025 dicen «idealmente <1.500»;
  no pude leer la guía.
- **Potasio:** al menos 3.510 mg/d (OMS) [15], salvo con enfermedad renal: la guía 2025 no recomienda la
  sal con potasio con enfermedad renal [16].
- **Alcohol:** reducirlo o dejarlo [16].
- **Patrón:** el de la AHA 2021 (verduras, integrales, aceites líquidos, poca sal) [18].

**Alimentos a marcar:** el sodio (la base lo tiene en el 97 %), el potasio (79 %) y el alcohol.

**Avisos:** todos. Nuevo, a decidir: «Para hoy: hoy vas con mucha sal», sin alarma.

**Línea:**

- ES: «Con la presión alta, Moss te muestra la sal y el potasio de lo que comes. Comer con poca sal y, si
  lo necesitas, bajar de peso puede ayudar a vivir bien con la presión alta.»
- EN: «With high blood pressure, Moss shows you the salt and potassium in what you eat. Eating less salt
  and, if you need to, losing weight may help you live well with high blood pressure.»

**Profesional:** sugerido. Es el ejemplo de bienestar de la FDA [33].

### 5.6 Colesterol o triglicéridos altos

**La meta:**

- **Déficit:** sí. Bajar del 5 al 10 % del peso, con 300 a 500 kcal/d de déficit (ESC/EAS 2019) [17].
- **Saturadas:** menos del 10 % de las kcal y **menos del 7 % con colesterol alto** [17]. La base las tiene
  en el 95 %.
- **Trans:** evitarlas [17]. La base solo las tiene en el 24 %: no se muestran como meta.
- **Colesterol de la dieta:** menos de 300 mg/d [17]. La base lo tiene en el 78 %.
- **Fibra:** de 25 a 40 g/d, de 7 a 13 g soluble [17]. La base no separa la soluble.
- **Azúcares añadidos:** menos del 10 % [17]. La base no los separa.
- **Alcohol:** hasta 10 g/d si los triglicéridos están normales [17]. Moss no sabe cuál es el caso: muestra
  el alcohol.

**Avisos:** todos. Nuevo, a decidir: «muchas grasas saturadas hoy».

**Línea:**

- ES: «Moss te muestra las grasas saturadas y la fibra de lo que comes. Si tu médico te pidió otras metas,
  puedes ponerlas a mano.»
- EN: «Moss shows you the saturated fat and fiber in what you eat. If your doctor gave you other targets,
  you can enter them yourself.»

**Profesional:** sugerido.

### 5.7 Enfermedad renal crónica

**Lo que se pregunta:** «¿Haces diálisis?» Si es sí, Moss no calcula y usa las metas a mano del equipo
(convención: la guía de la diálisis, KDOQI 2020, no la pude leer).

**La meta:**

- **Déficit:** no, de fábrica: «bajar, con tu equipo». KDIGO dice que el médico debería considerar animar
  a bajar con obesidad (PP 3.2.2.4) y que adapte la dieta un nutricionista renal (PP 3.3.2) [4].
- **Proteína: 0,8 g/kg/d** (Rec. 3.3.1.1, 2C), igual que lo recomendado para la población general, y
  nunca más de 1,3 (PP 3.3.1.1) [4]. La ADA tampoco pide menos de 0,8 [1]. Sin niveles: la tabla de
  `PROTEINA_POR_NIVEL` no se ofrece.
- **Sodio:** menos de 2 g/d (Rec. 3.3.2.1, 2C) [4].
- **Potasio y fósforo:** sin meta, porque es individual (PP 3.11.5) [4]. Nunca sugerir sal con potasio [16].
- **Agua:** no pedirla (convención).
- **Patrón:** más vegetales y menos ultraprocesados (PP 3.3.1) [4].
- **Keto:** no [1].

**Alimentos a marcar:** la proteína y el sodio (la base los tiene). El potasio y el fósforo se ven, sin
meta. Los aditivos de fosfato, no (la base no los tiene).

**Avisos:** se apagan «lo que falta» de proteína, «poca proteína» y «te falta proteína», la proteína después
de entrenar (D24) y el agua.

**Línea:**

- ES: «Con enfermedad renal, Moss no te sube la proteína: queda en 0,8 g por kilo, como recomienda KDIGO.
  Te muestra la sal, y no te pide comer menos ni tomar más agua. Lo demás lo decide tu equipo.»
- EN: «With kidney disease, Moss doesn't push protein up: it stays at 0.8 g per kilo, as KDIGO recommends.
  It shows you the salt, and it won't ask you to eat less or drink more water. Your healthcare team decides
  the rest.»

**Profesional:** necesario.

### 5.8 Cálculos en los riñones

**La meta, según la guía europea de urología (EAU 2026, tabla 4.5) [19]:**

- **Agua:** de 2,5 a 3 L por día, sobre todo agua, para orinar de 2 a 2,5 L. La recomendación de pasar de
  2,5 L de orina es fuerte.
- **Sal:** de 4 a 5 g por día, unos 1.600 a 2.000 mg de sodio.
- **Calcio:** normal, de 1.000 a 1.200 mg. No bajarlo.
- **Proteína animal:** de 0,8 a 1,0 g/kg/d. Como la base no separa la animal de la vegetal, Moss pone la
  **proteína total en 1,0 g/kg como mucho** (decisión).
- **Vegetales y fibra:** abundantes.
- **Oxalato:** limitar lo muy rico; la base no lo tiene.
- **IMC normal:** déficit sí.

**Avisos:** el del agua prendido, con la meta de 2,5 a 3 L. Los de proteína, apagados.

**Línea:**

- ES: «Con cálculos en los riñones, lo que más se recomienda es tomar agua: Moss te pone una meta de 2,5 a
  3 litros por día y te muestra la sal.»
- EN: «With kidney stones, drinking water is the top recommendation: Moss sets a goal of 2.5 to 3 liters a
  day and shows you the salt.»

**Profesional:** sugerido.

### 5.9 Reflujo

**La meta, según la ACG 2022 [21]:**

- **Déficit:** sí. Bajar de peso con sobrepeso (fuerte, evidencia moderada).
- **La última comida, de 2 a 3 h antes de acostarse** (condicional, baja). `ULTIMA_COMIDA = 180` ya existe:
  con reflujo va prendido de fábrica y no lo apaga «sin déficit».
- **Los alimentos gatillo:** son de cada uno (condicional, baja). Moss no marca nada.
- **Levantar la cabecera** para lo nocturno (condicional, baja): una línea en la ficha.

**Línea:**

- ES: «Con reflujo, Moss te recuerda terminar de comer unas 3 horas antes de acostarte.»
- EN: «With reflux, Moss reminds you to finish eating about 3 hours before bed.»

**Profesional:** sugerido.

### 5.10 Celiaquía

**Lo que pide la ACG 2013 [22]:**

- sin gluten de por vida (fuerte, alta);
- la avena pura, con cautela (fuerte, moderada);
- un nutricionista (fuerte, moderada);
- revisar el hierro, el ácido fólico, la vitamina D y la B12 (condicional, baja);
- «sin gluten» es menos de 20 ppm (Codex).

**Lo que hace Moss:**

- Marca «gluten» en «No como…». El plan ya lo excluye y la avena ya cuenta como gluten (`plan.ts:101`), y
  «lo que falta» ya respeta las alergias.
- Muestra el hierro, el folato, la vitamina D y la B12.
- La base no sabe si un alimento tiene gluten: no puede marcar lo que se busca, solo reconocer «sin gluten»
  o «sin TACC» en el nombre.
- Déficit: sí.

**Línea:**

- ES: «Con celiaquía, tu plan y las ideas de Moss van sin trigo, cebada, centeno ni avena. Moss no puede
  saber si un producto tiene gluten: fíjate en el sello sin TACC.»
- EN: «With celiac disease, your plan and Moss's ideas skip wheat, barley, rye and oats. Moss can't tell
  whether a product has gluten: check for a certified gluten-free label.»

**Profesional:** necesario (un nutricionista).

### 5.11 Gota

**Lo que pide el ACR 2020 [20]:**

- limitar el alcohol (condicional, baja);
- limitar las purinas (condicional, baja);
- limitar el jarabe de maíz alto en fructosa (condicional, muy baja);
- bajar de peso con sobrepeso (condicional, muy baja);
- no suplementar vitamina C (condicional, baja).

Más de 1 o 2 tragos en 24 h se asociaron a un 40 % más de ataques (caso-cruzado). La guía pide no culpar a
la persona por lo que come [20].

**Lo que hace Moss:**

- muestra el alcohol (la base lo tiene) y las bebidas azucaradas (azúcares y la categoría «bebidas»);
- las purinas no están en la base: no se marcan;
- déficit: sí.

**Línea:**

- ES: «Con gota, Moss te muestra el alcohol y las bebidas azucaradas de lo que anotas.»
- EN: «With gout, Moss shows you the alcohol and sugary drinks in what you log.»

**Profesional:** sugerido. El tratamiento para bajar el ácido úrico es del médico.

### 5.12 Antecedentes de un trastorno de la conducta alimentaria

**La evidencia:**

- De 105 personas con un TCA, el 73 % de las que usaban MyFitnessPal sintió que contribuía [30].
- En 493 estudiantes, quienes contaban calorías tenían más preocupación por la comida y más restricción [31].
- Una revisión de 38 estudios encuentra la asociación, sin poder decir qué causa qué [32].
- La ADA pide evitar lo muy bajo en carbohidratos y derivar al especialista [1]; la guía del SOP, considerar
  un TCA sin importar el peso [28]; la de los GLP-1, rastrearlo [29].

**Lo que hace Moss:**

- Sin déficit.
- El control nunca baja la meta.
- Ofrece ocultar los números (de fábrica, decisión).
- Sin «pasado» (la barra que tiembla, `metas.ts:104-110`).
- Sin «lo que falta».
- Sin pesarse de fábrica.
- Sin grasa corporal ni recomposición (ya), sin keto, sin la «última comida» (es una restricción).
- Sin peso meta (decisión).

**Línea:**

- ES: «Moss no te propone comer menos, puede ocultar los números y no te avisa si comes de más o de menos.
  Si estás en tratamiento, usa Moss solo si tu equipo está de acuerdo.»
- EN: «Moss won't suggest eating less, can hide the numbers and won't nudge you about eating more or less.
  If you're in treatment, use Moss only if your team agrees.»

**Lo que nunca:** presentarse como ayuda para un TCA. Para la UE, el software para aliviar un TCA es un
dispositivo médico [35]; para la FDA, «tratar un trastorno de la alimentación» no es bienestar [33].

**Profesional:** necesario.

### 5.13 Medicamento para bajar de peso (GLP-1 o tirzepatida)

**Lo que dice la guía conjunta de 2025 [29]:**

- **Proteína:** se propusieron de 1,2 a 1,6 g/kg/d durante la baja. Con obesidad, «el peso real puede
  sobreestimar mucho» lo necesario. La alternativa: de 80 a 120 g/d.
- **Kcal:** la baja grande de lo que se come puede dejar cortos los micronutrientes, «especialmente» con
  menos de 1.200 kcal en mujeres y 1.800 en hombres. El piso de los hombres es una decisión.
- **Las comidas:** chicas y seguidas, con menos grasa al principio, buenos líquidos y fibra de los alimentos.
  La ADA dice lo mismo [3].
- **Micronutrientes a mirar:** hierro, calcio, magnesio, zinc y las vitaminas A, D, E, K, B1, B12 y C. La
  base los tiene en el 65 a 79 %.
- **Las pesas:** con Ascent, se pueden recordar.

**Avisos:** «lo que falta» de proteína y de calorías, prendidos (con el piso).

**Línea:**

- ES: «Con tu medicamento, Moss cuida que llegues a la proteína y te sugiere comidas chicas; tu equipo de
  salud sigue tu tratamiento.»
- EN: «With your medication, Moss helps you reach your protein and suggests smaller meals; your healthcare
  team follows your treatment.»

**Profesional:** necesario (quien lo receta). La guía la pagaron los NIH, y varios autores declaran vínculos
con Novo Nordisk y Eli Lilly [29].

### 5.14 Otra condición o prefiero no decir

Lo de hoy, más seguro: sin déficit, sin keto, proteína de 1,2 g/kg como mucho (debajo del 1,3 de KDIGO, por
si fuera el riñón), sin pedir agua, sin lo de entrenar y con el control que nunca baja la meta.

**Línea:**

- ES: «Moss no te propone comer menos de lo que gastas ni te pide más proteína o agua. Si tu equipo de
  salud te da metas, puedes ponerlas a mano.»
- EN: «Moss won't suggest eating less than you burn or push more protein or water. If your healthcare team
  gives you targets, you can enter them yourself.»

**Profesional:** necesario.

---

## 6. La lista propuesta para marcar, lista para programarla

### 6.1 La meta de cada una

«Igual» es lo de siempre de Moss. La proteína va en g por kilo; el sodio, en mg por día.

| Clave | Grupo | Pregunta extra | Déficit (tope del ritmo) | Kcal | Control | Proteína | Sin estilo | Grasas | Fibra | Sodio | Potasio | Agua | Alcohol y cafeína |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `embarazo` | Embarazo y lactancia (f) | Fecha probable; peso de antes; mellizos | no | +Δ NASEM (0 en el 1.er trimestre) | pausa | mantener, sin «alta» | keto | igual | igual | — | — | igual | alcohol 0; cafeína ≤200 |
| `lactancia` | Embarazo y lactancia (f) | Fecha del parto; ¿solo pecho? | no hasta la semana 4–6; después suave o recomendado; piso 1.800 | +400 (0–6 m) / +380 (7–12 m) | normal | mantener | keto | igual | igual | — | — | igual | alcohol ≤0,5 g/kg; cafeína ≤200 o 300 |
| `diabetes2` | Azúcar | ¿Insulina o un remedio que baja mucho el azúcar? | sí; con insulina, hasta recomendado | igual | normal | igual | keto, con insulina | saturadas a la vista | ≥14/1.000 kcal (ya) | <2.300 | igual | igual | a la vista |
| `diabetes1` | Azúcar | — | suave | igual | normal | igual | keto | igual | igual | — | — | igual | a la vista |
| `presion` | Corazón | — | sí | igual | normal | igual | — | igual | igual | <2.000 | ≥3.510 (sin `renal`) | igual | a la vista |
| `colesterol` | Corazón | — | sí | igual | normal | igual | — | saturadas <7 %; colesterol <300 mg | 25–40 g | — | — | igual | a la vista |
| `renal` | Riñones | ¿Diálisis? (sí: metas a mano) | no | igual | normal | **0,8 fija** (≤1,3) | keto | igual | igual | <2.000 | sin meta | **no pedir** | — |
| `calculos` | Riñones | — | sí | igual | normal | ≤1,0 | — | igual | igual | <2.000 | — | **2.500–3.000** | — |
| `reflujo` | Digestión y articulaciones | — | sí | igual | normal | igual | — | igual | igual | — | — | igual | — |
| `celiaquia` | Digestión y articulaciones | — | sí | igual | normal | igual | — | igual | igual | — | — | igual | — |
| `gota` | Digestión y articulaciones | — | sí | igual | normal | igual | — | igual | igual | — | — | igual | alcohol y bebidas azucaradas a la vista |
| `tca` | Más cuidado | — | no | igual | nunca baja | mantener | keto | igual | igual | — | — | igual | — |
| `glp1` | Más cuidado | — | sí (el plan); piso de los hombres: 1.800 (decisión) | igual | normal | ≥1,2 (o 80–120 g) | — | igual | igual | — | — | igual | — |
| `otra` | Más cuidado | — | no | igual | nunca baja | ≤1,2 | keto | igual | igual | — | — | no pedir | — |

### 6.2 Lo demás de cada una

| Clave | Micronutrientes a mirar | Alimentos a marcar (¿la base?) | Se apaga | Se prende | Profesional |
|---|---|---|---|---|---|
| `embarazo` | `etapa: 'embarazo'` (hierro, folato…); cafeína | Alcohol (sí); Listeria, por lista curada (parcial); mercurio (solo el pez espada) | entreno, falta, nocheCorta, pesarse de fábrica, pasado | la banda del IOM en Progreso | necesario |
| `lactancia` | `etapa: 'lactancia'`; B12 si es vegana | Alcohol (sí); mercurio (parcial) | lo mismo, las primeras semanas | — | sugerido |
| `diabetes2` | — | Bebidas azucaradas (azúcares totales; los añadidos no) | — | sodio a la vista | sugerido; necesario con insulina |
| `diabetes1` | — | Carbohidratos por comida (sí) | antesDeEntrenar, despuesDeEntrenar, ayunasLarga | — | necesario |
| `presion` | potasio | Sodio (97 %), potasio (79 %), alcohol (69 %) | — | Para hoy: mucha sal (decisión) | sugerido |
| `colesterol` | — | Saturadas (95 %), colesterol (78 %); trans (24 %: no) | — | Para hoy: muchas saturadas (decisión) | sugerido |
| `renal` | — (fósforo y potasio, sin meta) | Proteína, sodio (sí) | falta de proteína, pocaProteina, faltaProteina, despuesDeEntrenar (D24), agua | — | necesario |
| `calculos` | calcio | Sodio, calcio, proteína (sí); oxalato (no) | avisos de proteína | agua con la meta alta | sugerido |
| `reflujo` | — | — | — | ultimaComida, de fábrica | sugerido |
| `celiaquia` | hierro, folato, vitamina D, B12 | «gluten» en «No como…» (plan, sí); en lo que se busca (no) | — | — | necesario |
| `gota` | — | Alcohol, bebidas azucaradas (sí); purinas (no) | — | — | sugerido |
| `tca` | — | ninguno | falta, pasado, pesarse, ultimaComida, peso meta (decisión) | números ocultos, de fábrica | necesario |
| `glp1` | hierro, calcio, magnesio, zinc, A, D, E, K, B1, B12, C | — | — | falta de proteína y de calorías | necesario |
| `otra` | — | — | entreno, falta, agua, nocheCorta | — | necesario |

### 6.3 El código (propuesta)

Todo en `src/dominio/cuidados.ts`, puro y con su test. Se suma a `DEL_DOMINIO` en `galeria/construir.mjs`:
la galería primero.

```ts
export type Cuidado =
  | 'embarazo' | 'lactancia' | 'diabetes2' | 'diabetes1' | 'presion' | 'colesterol'
  | 'renal' | 'calculos' | 'reflujo' | 'celiaquia' | 'gota' | 'tca' | 'glp1' | 'otra';

export type DatosDelCuidado = {
  embarazo?: { fechaProbable: ClaveDia; pesoAntes: number | null; mellizos: boolean };
  lactancia?: { parto: ClaveDia; soloPecho: boolean };
  diabetes2?: { bajaElAzucar: boolean | null }; // insulina o sulfonilureas; null: no sé
  renal?: { dialisis: boolean };
};

export type Reglas = {
  ritmoMaximo: 'ninguno' | Ritmo | 'cualquiera'; // 'ninguno' = sin déficit
  deficitDesde: ClaveDia | null;                 // lactancia
  piso: number | null;                           // reemplaza a PISOS si es más alto
  extraKcal: number;                             // embarazo (NASEM) o lactancia
  control: 'normal' | 'nuncaBaja' | 'pausa';
  proteinaPorKg: { min?: number; max?: number; fija?: number };
  estilosSin: Estilo[];
  sodioMax: number | null; potasioMeta: number | 'sinMeta' | null;
  saturadasMax: number | null; colesterolMax: number | null; fibra: [number, number] | null;
  agua: number | 'noPedir' | null; cafeinaTope: number | null; alcohol: 'nada' | 'aLaVista' | null;
  etapa: Etapa | null; mirar: Micro[]; marcar: Marca[];
  apagar: Aviso[]; prender: Aviso[]; numerosOcultos: boolean; manuales: boolean; // diálisis o embarazo antes de los 18
};

export function reglasDe(c: ReadonlySet<Cuidado>, d: DatosDelCuidado, p: Persona, hoy: ClaveDia): Reglas;
export function extraDelEmbarazo(p: Persona & { pesoAntes: number; semana: number }): number; // NASEM 2023
export function rangoDelEmbarazo(imcAntes: number, semana: number, mellizos: boolean): [number, number] | null; // IOM 2009
```

**Cuando hay varias, gana la regla más cuidadosa:**

| Qué | Cómo se combina |
|---|---|
| El ritmo | El menor (`ninguno` < suave < recomendado < cualquiera) |
| El piso, el extra y la cafeína | El piso más alto, el extra mayor y la cafeína más baja |
| El control | `pausa` > `nuncaBaja` > `normal` |
| La proteína | El `max` más bajo gana al `min` más alto (`renal` 0,8 le gana al 1,2 de `glp1`) |
| Los estilos | Se suman los que no van |
| El sodio | El más bajo |
| El potasio | `sinMeta` (riñón) le gana a la meta (presión) |
| El agua | `noPedir` le gana a la meta alta (riñón con cálculos: la decide el equipo) |
| Los avisos | Se apagan todos los de la lista. «Se prende» no prende nada que otra condición apaga: `tca` con `reflujo` = sin «última comida» |

**Dónde se usa:**

| Archivo | Cambio |
|---|---|
| `metaPara` (`metas.ts:169-174`) y `metaDelCuestionario` (`cuestionario.ts:347-365`) | Reciben `reglas` en lugar de `sinDeficit` |
| `control.ts` | `pausa` = no corre; `nuncaBaja` = `kcal ≥ metasAnteriores.kcal` |
| `HojaRegistro.tsx:238` y `segunElDeporte.ts:313` | Pasan `etapa` |
| `loQueFalta.ts`, `paraHoy.ts`, `loQueConviene.ts`, `alrededorDelEntreno.ts`, `segunElDeporte.ts` y `diagnostico.ts` | Miran `reglas.apagar` y `reglas.prender` |
| El agua de `loQueFalta.ts:81`, `paraHoy.ts` y `widgets/index.ts:32` | Usa `reglas.agua` |

**Las cuentas:**

- `extraDelEmbarazo`: semana <13 → 0. Si no, TEE del embarazo (peso de hoy, semana) + el depósito (IMC de
  antes: 300 / 200 / 150 / −50) − TEE sin embarazo (peso de antes), redondeado de a 10.
  - **Las ecuaciones de NASEM 2023 (tabla 5-5) [5]:**

    | Actividad | Embarazo (2.º y 3.er trimestre) | Sin embarazo (mujeres de 19 años o más) |
    |---|---|---|
    | Inactiva | 1.131,20 − 2,04·edad + 0,34·altura + 12,15·peso + 9,16·semana | 584,90 − 7,01·edad + 5,72·altura + 11,71·peso |
    | Poco activa | 693,35 − 2,04·edad + 5,73·altura + 10,20·peso + 9,16·semana | 575,77 − 7,01·edad + 6,60·altura + 12,14·peso |
    | Activa | −223,84 − 2,04·edad + 13,23·altura + 8,15·peso + 9,16·semana | 710,25 − 7,01·edad + 6,54·altura + 12,34·peso |
    | Muy activa | −779,72 − 2,04·edad + 18,45·altura + 8,73·peso + 9,16·semana | 511,83 − 7,01·edad + 9,07·altura + 12,56·peso |

  - **Los niveles de Moss:** «poco», «algo», «activo» y «muy» → inactiva, poco activa, activa y muy
    activa (convención: no leí los bordes de las categorías de NASEM).
- `rangoDelEmbarazo`, con el IMC de antes, devuelve los kilos de aumento sobre el peso de antes (Progreso
  los suma al peso de antes para dibujar la banda):
  - mínimo = 0,5 + max(0, semana − 13) × el ritmo bajo;
  - máximo = 2 + max(0, semana − 13) × el ritmo alto;
  - desde la semana 40, los totales del IOM;
  - con mellizos, solo el total provisorio al término, porque el resumen del IOM no da un ritmo por semana
    para mellizos. Antes del término, `null`, y no se dibuja la banda.

**El guardado:**

- una tabla local `cuidados` (un bloque nuevo en `migrar()`, `src/almacen/sqlite.ts`);
- **sin** fila en `remoto.ts`, regla en `mezclar.ts` ni comprobación en `verificar-supabase.mjs`, porque no
  sincroniza;
- a la cuenta va solo lo que se deriva: `sin_deficit` (ya existe) y, para el embarazo, una bandera neutra
  `control_en_pausa` (migración nueva), así otro iPhone no corre el control. La alternativa sin migración es
  guardar la meta del embarazo como `motivo: 'manual'`, que ya hace que el control no la cambie.

### 6.4 Los tests

| # | Qué prueba | Qué espera |
|---|---|---|
| 1 | `reglasDe(new Set(), …)` | Igual a hoy: `metaPara` con las reglas vacías da lo mismo que sin ellas, para toda la tabla de `metas.test.ts` |
| 2 | Embarazo, semana 10 | `extraKcal` 0 |
| 3 | Embarazo, semana 20 (30 años, 165 cm, 65 → 68 kg, «algo») | 410; con «poco», 260 |
| 4 | Embarazo | `control: 'pausa'`; `ritmoMaximo: 'ninguno'`; sin keto; cafeína 200; `etapa: 'embarazo'` |
| 5 | `rangoDelEmbarazo(22, 40, false)` | [11,5, 16] |
| 6 | `rangoDelEmbarazo(22, 12, false)` | [0,5, 2] |
| 7 | `rangoDelEmbarazo(31, 40, false)` | [5, 9] |
| 8 | Con `controlSemanal` en pausa | Ninguna `MetaGuardada` con `motivo: 'control'` mientras dura el embarazo |
| 9 | Lactancia, parto hace 2 semanas | Sin déficit |
| 10 | Lactancia, parto hace 8 semanas | Ritmo hasta lo decidido; ninguna meta debajo de 1.800 |
| 11 | Lactancia | `extraKcal` 400 hasta los 6 meses y 380 hasta los 12 |
| 12 | `renal` | La proteína = round(0,8 × peso) para cualquier objetivo, estilo y nivel; nunca > 1,3 × peso con cualquier combinación |
| 13 | `renal` | `loQueFaltaHoy` sin `'proteina'`; `paraHoy` sin `pocaProteina` ni `faltaProteina`; sin agua |
| 14 | `renal` + `glp1` | Proteína 0,8 |
| 15 | `renal` + `calculos` | Agua `noPedir` |
| 16 | `calculos` | Agua 2.500 (o 3.000); proteína ≤ 1,0 × peso |
| 17 | `diabetes2` | `objetivoPermitido('bajar')` = `'bajar'` |
| 18 | `diabetes2` con `bajaElAzucar` | Ritmo hasta recomendado; sin keto |
| 19 | `reflujo` | `loQueConviene` devuelve `ultimaComida` aunque haya otra condición sin déficit (salvo `tca`) |
| 20 | `tca` | Sin déficit; `control: 'nuncaBaja'` (con el peso subiendo, la meta no baja); `numerosOcultos`; apaga `falta`, `pasado`, `pesarse` y `ultimaComida` |
| 21 | `otra` | Proteína ≤ 1,2 × peso; sin keto; sin agua |
| 22 | La privacidad | Las filas del perfil en `remoto.ts` no tienen ninguna clave ni valor de `Cuidado`. Las notificaciones de `avisos.ts` no contienen el nombre de ninguna condición |
| 23 | La galería | El escenario `cuidados`: la pregunta, la lista agrupada, cada ficha, el embarazo con su banda, dos combinaciones y en inglés |

---

## 7. Lo que una app puede hacer sola y lo que no

**Estados Unidos (FDA, *General Wellness*, enero de 2026, leída entera) [33]:**

- **Qué es bienestar:** lo que promueve un estado general de salud (incluido «ayudar a bajar de peso»), y lo
  que relaciona un estilo de vida sano con **«may help to reduce the risk of»** o **«may help living well
  with»** una enfermedad crónica, cuando eso está aceptado (sus ejemplos: corazón, presión alta, diabetes
  tipo 2).
- **El ejemplo es Moss:** *Software Product Y* cuenta calorías y ayuda a llevar un plan sano, lo que «puede
  ayudar a vivir bien» con la presión alta y la diabetes tipo 2.
- **Qué no es bienestar:**
  - prometer tratar o diagnosticar la obesidad;
  - prometer tratar un trastorno de la alimentación;
  - cualquier salida usada para decidir un tratamiento, por ejemplo la dosis de un medicamento;
  - alertas que pidan una acción clínica.
- **La derivación al profesional** está permitida si no nombra una enfermedad ni dice «anormal».
- **Lo que la FDA decide no exigir aunque fuera un dispositivo** (*enforcement discretion*, 2022) [34]:
  - ayudar a quien tiene prediabetes a comer mejor;
  - información educativa y recordatorios para embarazadas;
  - recomendaciones de prevención según la edad, el sexo y los hábitos, de autoridades establecidas.

**Unión Europea (MDR, regla 11; MDCG 2019-11 rev. 1, junio de 2025) [35]:**

- Las apps de bienestar o fitness no son *software* médico.
- Sí lo es el que tiene una finalidad médica: prevenir, tratar o aliviar una enfermedad. Los ejemplos de
  la guía: software para aliviar un trastorno de la alimentación; calcular la dosis de insulina.
- Por la regla 11, el que da información para decidir algo diagnóstico o terapéutico es al menos clase IIa.
- **No hay un equivalente del «may help living well with» de la FDA:** decide la finalidad declarada y cómo
  se presenta. Por eso, cada cambio de la sección 6 se presenta como lo que recomiendan las guías para
  todos, o como un límite de seguridad (apagar el déficit, la proteína alta o el pedido de agua). Nunca como
  un tratamiento, y siempre con «puedes poner las metas de tu equipo».
- **Riesgo que queda:** un evaluador podría leer «condición → otra meta» como información terapéutica. Lo
  bajan cuatro cosas:
  - la persona puede cambiar todo a mano;
  - Moss no pregunta estadios ni valores de laboratorio;
  - la ficha de la App Store no promociona Cuidados («para diabéticos» no);
  - la nota de revisión dice la finalidad de bienestar.

**Apple [36]:**

- **1.4.1:** las apps médicas se revisan con más rigor; hay que mostrar los datos y el método de lo que se
  afirma, y recordar consultar a un médico antes de decidir. → «Cómo se calcula» en cada ficha, con la
  guía, y la línea del equipo.
- **5.1.1:** consentimiento y datos mínimos. → Se guarda solo la condición y lo justo: la fecha probable,
  el peso de antes, la diálisis sí/no.
- **5.1.3(ii):** «may not store personal health information in iCloud». → La base local ya está fuera de la
  copia (`modules/respaldo`). Nada en el llavero de iCloud ni en `NSUbiquitousKeyValueStore`.
- **La clasificación por edad:** con Cuidados, *Medical or Treatment Information* pasa de «None» a
  «Infrequent». Sigue en 16+ por el mínimo de edad (`revision.md:954-959`).

**La línea, en una tabla:**

| Moss puede | Moss no |
|---|---|
| Usar las referencias de la población y de cada etapa (DRI, OMS) | Dosis de insulina o de medicamentos, ni la relación insulina-carbohidratos |
| Apagar lo que puede hacer daño (déficit, proteína alta, keto, pedir agua, ayuno) | Dietas terapéuticas: muy baja en proteína (KDIGO: «under close supervision»), baja en FODMAP, restringir potasio, fósforo o líquidos |
| Mostrar los nutrientes con la referencia y su fuente | Diagnosticar, decir «anormal», usar valores de laboratorio o hablar de riesgo de enfermedad |
| Recordar hábitos con respaldo (la última comida, el agua con cálculos) | Prometer tratar, controlar o mejorar una enfermedad |
| Derivar al equipo y aceptar sus metas a mano | Ofrecerse como ayuda para un TCA |
| Marcar alimentos que la guía nombra (alcohol, Listeria, mercurio) | Asegurar que algo no tiene gluten |

---

## 8. La privacidad

**Hoy:** sube `sin_deficit` (`remoto.ts:56`). Está declarado como *Health* (`revision.md:136`), y la
política dice que no se guarda el motivo (`docs/privacidad/index.html:47`).

**Por qué hay que cuidarlo:** una condición es un dato de salud:

- «personal data related to the physical or mental health» (RGPD, art. 4.15);
- lo prohíbe salvo un consentimiento explícito (art. 9.1 y 9.2.a);
- el considerando 35 incluye todo lo que revele el estado de salud [39];
- en Uruguay, «informaciones referentes a la salud» son datos sensibles, que piden el «consentimiento
  expreso y escrito» (Ley 18.331, arts. 4.E y 18) [40].

Por la misma razón, el `sin_deficit` de hoy ya es un dato de salud: lo de `decisiones.md:722-723` hay que
corregirlo.

**La propuesta:**

| Qué | Cómo |
|---|---|
| Dónde | Lo marcado (y la fecha probable, el peso de antes, la diálisis) queda **solo en el iPhone**: SQLite local, fuera de la copia de iCloud (ya), cifrado con la protección de datos de iOS (ya, `revision.md:64`) |
| Qué sube | Solo lo que se deriva y no nombra nada: `sin_deficit` (ya) y `control_en_pausa`. Las metas suben como siempre, sin un «motivo» que diga embarazo (`MetaGuardada.motivo` sigue con los de hoy). Ascent no recibe nada nuevo |
| El consentimiento | Al marcar, una línea y un botón: «Se guarda solo en este iPhone. No sube a tu cuenta ni lo ve nadie, tampoco Ascent.» → «Guardar en este iPhone». Eso es un consentimiento explícito, y el «Acepto y sigo» de la entrada ya cubre los datos de salud |
| Borrar | «Quitar» borra la fila; al borrar la cuenta se borra la base local |
| Otro iPhone | Pregunta de nuevo; `sin_deficit` o `control_en_pausa` le avisan que en otro teléfono hay cuidados |
| Lo que se ve | Nunca el nombre de la condición en notificaciones, widgets ni la pantalla bloqueada. El aviso del reflujo dice «Última comida · Hasta las 21:00», no «reflujo» |
| Exportar | Incluirlos en el CSV si la persona lo pide (decisión) |

**La etiqueta de la App Store:** no cambia. Apple dice que lo procesado solo en el teléfono no se
«recopila» y no se declara [37]. Si algún día subiera: el embarazo sería *Sensitive Info* («pregnancy or
childbirth information») y lo demás, *Health*. Lo que se deriva y sube (las metas) ya se declara como
*Health*, y Apple pide considerar eso aparte [37].

**Hay que actualizar:**

- `docs/privacidad/index.html:47` y `docs/en/privacy/` («Lo que marcas en Cuidados se queda en tu iPhone…»);
- `docs/terminos/index.html:42`;
- las notas de revisión (`revision.md:766`).

**Leer Salud (opcional, decisión):** Salud tiene `HKCategoryTypeIdentifier.pregnancy` y `.lactation` (iOS
14.3+) [38]. Moss podría proponer marcar el embarazo si la persona lo registró ahí, con un permiso de
lectura más y sin marcar nada sola.

---

## 9. Cómo lo hacen las otras apps

| App | Lo que encontré |
|---|---|
| **MacroFactor** | Ninguna función por condición. Su aviso de salud (1/12/2025): si estás embarazada, amamantando, tomas medicación o tienes una condición, consulta a un profesional; no está pensada para diagnosticar ni tratar. Solo mayores de 18 [41] |
| **Cronometer** | Al marcar embarazo o lactancia en el perfil, cambian las metas de nutrientes por defecto. No encontré funciones por enfermedad [42] |
| **MyFitnessPal** | Para el embarazo no da recomendación: que el médico te dé las calorías y las cambies a mano. Para la diabetes, metas propias; la glucosa de Dexcom, solo en Android [43] |
| **Lose It!** | No tiene nada para el embarazo ni la lactancia: se suben las calorías a mano o se anota «Breastfeeding» como ejercicio (4/8/2026). Tiene funciones para GLP-1 [44] |
| **Noom** | Sus términos (9/12/2025): «Noom is not for everyone», no reemplaza un tratamiento, puede sacarte del servicio para que tu condición la maneje un profesional, y sus coaches no aconsejan sobre tratamientos. Solo mayores de 18. No encontré una página oficial sobre el embarazo ni los TCA [45] |

---

## 10. Cambios propuestos

### Arreglos claros (con el sí/no de hoy, chicos, pueden ir por OTA)

| # | Qué | Dónde | El cambio | El test |
|---|---|---|---|---|
| A1 | El ejemplo de la pregunta | `src/textos/es.json` y `en.json`, `entrada.cuidado.condicionTexto` | «Problemas de riñón o un trastorno de la alimentación, por ejemplo.» (sin «Diabetes») | El typecheck de las claves; la captura `entrada` de la galería |
| A2 | Sin keto con «sin déficit» [1] | `metas.ts:156-167` (`macrosConProteina`) o donde se elige el estilo | Si `sinDeficit` y el estilo es `keto`, se usa `equilibrada`. Perfil no ofrece keto | `metaPara(…, { sinDeficit: true }, 'keto').carbohidratos > 30` |
| A3 | El control nunca baja la meta con «sin déficit» | `control.ts:155-158` | Si `perfil.sinDeficit`, `kcal = max(kcal, metasAnteriores.kcal)`. Cubre el embarazo y el TCA hasta que se guarde el motivo | Con pesadas que suben 0,06 kg/d y la comida pareja, `metas.kcal >= metasAnteriores.kcal` |
| A4 | No pedir agua con «sin déficit» | `paraHoy.ts:107`, `loQueFalta.ts:204` | `&& !e.sinDeficit` | `paraHoy({ sinDeficit: true, agua: { ml: 200, meta: 2000 }, ahora: 18 * 60 })` sin `agua`; lo mismo en `loQueFaltaHoy` |
| A5 | Corregir la spec | `spec/decisiones.md:722-723` | «Es un dato de salud (lo declaramos como *Health*); se guarda lo mínimo» | — |

La «última comida» con reflujo (`loQueConviene.ts:237`) no entra acá: con el sí/no no se sabe si es
reflujo, así que el arreglo llega con Cuidados (D1 y D2; el test 19 de 6.4).

### Decisiones del dueño

| # | Qué decidir | Lo que recomiendo |
|---|---|---|
| D1 | Guardar cuál, solo en el teléfono | **Sí**: secciones 6 y 8; la galería primero |
| D2 | La lista: 13 y «Otra», en 5 grupos | Como en la sección 4 |
| D3 | El embarazo | Control en pausa con `control_en_pausa` (o la meta como `manual`); el Δ de NASEM; la banda del IOM; antes de los 18, metas a mano |
| D4 | La lactancia | Déficit desde la semana 6 (o la 4), suave; piso 1.800; +400 / +380; mixta, la mitad; cafeína 200 (prudente) o 300 (CDC) |
| D5 | DM2 con insulina o sulfonilureas | Ritmo hasta recomendado y la línea; «no sé» como «sí» |
| D6 | DM1 | Ritmo suave como mucho |
| D7 | El riñón | Sin déficit de fábrica; 0,8 fija; con diálisis, metas a mano |
| D8 | Los cálculos | Proteína ≤1,0; agua 2,5 L de fábrica (hasta 3) |
| D9 | El TCA | Números ocultos de fábrica; sin peso meta; sin pesarse; una línea con la sugerencia de ayuda profesional, sin números de teléfono por país |
| D10 | El GLP-1 | Proteína: 1,2 g/kg sobre el peso real con un IMC < 30; con obesidad, el mínimo entre eso y 120 g. Piso de 1.800 en los hombres |
| D11 | «Otra» | Proteína ≤1,2, sin agua, sin keto. Hoy, con el sí/no, está pendiente en `entreno.md:942-943`: recomiendo aplicar ya el ≤1,2 a «sin déficit» |
| D12 | Leer embarazo y lactancia de Salud | Más adelante |
| D13 | Los consejos nuevos de «Para hoy» (mucha sal, muchas saturadas) | Sí, sin alarmas, con los números ocultos respetados |
| D14 | La clasificación por edad | *Medical or Treatment Information* → «Infrequent» al publicar Cuidados |
| D15 | Exportar los cuidados en el CSV | Sí, con una línea que avise |

---

## 11. Lo que no se dice (o no se hace)

- **Nunca una dosis:** de insulina, de remedios ni de suplementos (ni ácido fólico, ni hierro, ni B12: «tu
  equipo te dirá») [33][35].
- **Nunca «tratar», «controlar», «mejorar» o «revertir»** una enfermedad, ni «dieta para…». Se dice «puede
  ayudar a vivir bien con…» (la FDA) o «lo que recomiendan para todos».
- **Nunca un diagnóstico ni una alarma:** ni «tienes anemia», ni «tu presión», ni «aumentaste demasiado».
  La banda del embarazo se muestra sin juicios.
- **Nunca deducir una condición** de los datos (el peso, Salud, lo que se come) sin que la persona la marque.
- **Nunca una dieta terapéutica:** muy baja en proteína, baja en FODMAP, restringir potasio, fósforo o
  líquidos. Eso es del equipo [4][23].
- **Nunca asegurar** que un alimento no tiene gluten, ni que una comida es «segura» en el embarazo: Moss
  marca lo que reconoce.
- **Nunca el nombre de la condición** en notificaciones, widgets, la pantalla bloqueada, la cuenta ni Ascent.
- **Nunca culpar:** ni «comiste mal» con la gota ni con la diabetes; la guía de la gota lo pide [20].
- **Nunca ofrecerse para un TCA**, ni proponer bajar de peso a quien lo marcó.
- **Nunca seguir con el control** como si el aumento del embarazo fuera grasa.
- **Nunca prometer precisión:** el extra del embarazo y de la lactancia es «aproximado».

---

## 12. Para «En qué se basa Moss»

**Español:**
Si marcas un cuidado de salud, Moss ajusta tus metas a las guías para toda la población y deja de
proponerte lo que podría no convenirte, como comer menos o subir la proteína. Para el embarazo y la
lactancia usa las referencias de las Academias Nacionales de Estados Unidos (2023) y los rangos de aumento
de peso del IOM (2009); para la diabetes, las de la Asociación Americana de Diabetes (2026); y para los
riñones, las de KDIGO (2024). Son cambios generales y aproximados: no reemplazan lo que te indique tu equipo
de salud, y siempre puedes poner a mano las metas que te den. Lo que marcas se guarda solo en este iPhone.

**English:**
If you mark a health condition, Moss adjusts your targets to guidelines for the general population and stops
suggesting things that may not suit you, like eating less or pushing protein up. For pregnancy and
breastfeeding it uses the US National Academies' references (2023) and the IOM's weight-gain ranges (2009);
for diabetes, the American Diabetes Association's (2026); and for kidneys, KDIGO's (2024). These changes are
general and approximate: they don't replace what your healthcare team tells you, and you can always enter
the targets they give you. What you mark is stored only on this iPhone.

---

## 13. Lo que no pude leer

| Fuente | Qué pasó | Qué usé en su lugar |
|---|---|---|
| La guía AHA/ACC 2025 de la presión | Cloudflare | El comentario de los editores de *Hypertension* [16] y la OMS [14][15]. El «<1.500 mg ideal» queda sin confirmar |
| KDOQI 2020, la nutrición en la ERC | Cloudflare; no está en PMC | Por eso no hay números para la diálisis: metas a mano |
| AUA 2014/2019, los cálculos | Pide entrar con una cuenta | EAU 2026 [19] |
| La guía de celiaquía de la ACG 2023 | No la encontré abierta | La de 2013 [22] |
| ACOG (402) y EFSA en Wiley (Cloudflare): el agua (2010), la cafeína (2015) y la energía (2013, salvo el resumen) | Bloqueadas | Los 200 mg de cafeína en el embarazo siguen como estaban en `spec/entreno.md` [31 de esa spec], de EFSA 2015 leída en EUFIC. No subí la meta de agua del embarazo ni de la lactancia por no tener la fuente |
| La guía ASMBS 2019 de la cirugía bariátrica | No está en PMC y no la busqué en otro lado | Sin números: la cirugía va a «Otra» |
| Las guías de insuficiencia cardíaca | El texto se cortó antes de la sección del líquido | Por eso «no pedir agua» con riñón u «otra» es una convención prudente, no una cifra |
| MacroFactor y Noom | Sin página oficial sobre el embarazo o los TCA | Lo que dicen sus avisos y sus términos |

---

## 14. Fuentes

Clínicas:

1. American Diabetes Association. 5. Facilitating Positive Health Behaviors and Well-being… Standards of Care in Diabetes—2026. *Diabetes Care* 2026;49(Suppl 1):S89–S131. https://doi.org/10.2337/dc26-S005 (PMC12690188). **Partes** del texto completo: recomendaciones 5.10–5.33 y el texto sobre lo muy bajo en carbohidratos, la proteína en la ERC, el alcohol y los suplementos.
2. American Diabetes Association. 3. Prevention or Delay of Diabetes… —2026. *Diabetes Care* 2026;49(Suppl 1). https://doi.org/10.2337/dc26-S003 (PMC12690170). **Partes**: 3.3, 3.4 y el texto del DPP.
3. American Diabetes Association. 8. Obesity and Weight Management… —2026. *Diabetes Care* 2026;49(Suppl 1). https://doi.org/10.2337/dc26-S008 (PMC12690172). **Partes**: 8.8a, la tabla de fármacos (GI, hipoglucemia con sulfonilureas o insulina) y 8.25.
4. KDIGO CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD. *Kidney Int* 2024;105(4S):S117–S314. https://doi.org/10.1016/j.kint.2023.10.018 (PDF de kdigo.org). **Partes**: las recomendaciones del capítulo 3 (3.2.2, 3.3, 3.11.5) y el fundamento de 3.3.1.
5. National Academies of Sciences, Engineering, and Medicine. *Dietary Reference Intakes for Energy*. 2023. https://doi.org/10.17226/26818. **Partes**: capítulo 5 (tablas 5-5, 5-13 y 5-14 y su texto).
6. Institute of Medicine y National Research Council. *Weight Gain During Pregnancy: Reexamining the Guidelines*. 2009. https://doi.org/10.17226/12584. **El resumen** (capítulo «Summary»).
7. Institute of Medicine. *Nutrition During Lactation*. 1991. https://doi.org/10.17226/1577. **El resumen** (capítulo 1).
8. Lovelady CA, Garner KE, Moreno KL, Williams JP. The effect of weight loss in overweight, lactating women on the growth of their infants. *N Engl J Med* 2000;342(7):449–453. https://doi.org/10.1056/NEJM200002173420701. ECA, n=40. **Solo el resumen**.
9. FDA y EPA. Advice about Eating Fish (revisada en octubre de 2021). https://www.fda.gov/food/consumers/advice-about-eating-fish. **La página**.
10. CDC. About Alcohol Use During Pregnancy (14/8/2026). https://www.cdc.gov/alcohol-pregnancy/about/index.html. **La página**.
11. CDC. Preventing *Listeria* Infection (31/1/2025). https://www.cdc.gov/listeria/prevention/index.html. **La página**.
12. CDC. Maternal Diet and Breastfeeding (25/8/2026). https://www.cdc.gov/breastfeeding-special-circumstances/hcp/diet-micronutrients/maternal-diet.html. **La página**.
13. USPSTF. Folic Acid for the Prevention of Neural Tube Defects (1/8/2023). https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/folic-acid-for-the-prevention-of-neural-tube-defects-preventive-medication. **La página**.
14. OMS. Sodium reduction, nota descriptiva (11/5/2026). https://www.who.int/news-room/fact-sheets/detail/sodium-reduction. **La página**.
15. OMS, eLENA. Increasing potassium intake to reduce blood pressure… https://www.who.int/tools/elena/interventions/potassium-cvd-adults. **La página**.
16. Harrison DG, Touyz RM. The Hypertension Editors' View of the 2025 Guideline… *Hypertension* 2025. https://doi.org/10.1161/HYPERTENSIONAHA.125.25467 (PMC12717638). **Partes**. Es un comentario: la guía (Jones DW y otros, https://doi.org/10.1161/CIR.0000000000001356) no la pude abrir.
17. Mach F y otros. 2019 ESC/EAS Guidelines for the management of dyslipidaemias. *Eur Heart J* 2020;41:111–188. https://doi.org/10.1093/eurheartj/ehz455. **Partes**: sección 7.
18. Lichtenstein AH y otros. 2021 Dietary Guidance to Improve Cardiovascular Health (AHA). *Circulation* 2021;144:e472–e487. https://doi.org/10.1161/CIR.0000000000001031. **Solo el resumen**.
19. European Association of Urology. EAU Guidelines on Urolithiasis, edición 2026: Metabolic evaluation and recurrence prevention. https://uroweb.org/guidelines/urolithiasis/chapter/metabolic-evaluation-and-recurrence-prevention. **La página**: tabla 4.5 y 4.2.4.
20. FitzGerald JD y otros. 2020 American College of Rheumatology Guideline for the Management of Gout. *Arthritis Care Res* 2020;72:744–760. https://doi.org/10.1002/acr.24180 (PMC10563586). **Partes**: tabla 7 y su texto.
21. Katz PO y otros. ACG Clinical Guideline for the Diagnosis and Management of GERD. *Am J Gastroenterol* 2022;117:27–56. https://doi.org/10.14309/ajg.0000000000001538 (PMC8754510). **Partes**: las recomendaciones y la tabla 3.
22. Rubio-Tapia A y otros. ACG clinical guidelines: diagnosis and management of celiac disease. *Am J Gastroenterol* 2013;108:656–676. https://doi.org/10.1038/ajg.2013.79 (PMC3706994). **Partes**: las recomendaciones de manejo.
23. Lacy BE y otros. ACG Clinical Guideline: Management of IBS. *Am J Gastroenterol* 2021;116:17–44. https://doi.org/10.14309/ajg.0000000000001036. **Solo el resumen**.
24. Suchy FJ y otros. NIH Consensus Development Conference Statement: Lactose Intolerance and Health. *NIH Consens State Sci Statements* 2010;27(2):1–27. PMID 20186234. **Solo el resumen**.
25. NIH Office of Dietary Supplements. Iron — Health Professional Fact Sheet (4/9/2025). https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/. **Partes**.
26. LeBoff MS y otros. The clinician's guide to prevention and treatment of osteoporosis (BHOF). *Osteoporos Int* 2022;33:2049–2102. https://doi.org/10.1007/s00198-021-05900-y (PMC9546973). **Partes**.
27. Villareal DT y otros. Aerobic or Resistance Exercise, or Both, in Dieting Obese Older Adults. *N Engl J Med* 2017;376:1943–1955. https://doi.org/10.1056/NEJMoa1616338. ECA, n=160. **Solo el resumen**.
28. Teede HJ y otros. Recommendations From the 2023 International Evidence-based Guideline for… PCOS. *J Clin Endocrinol Metab* 2023;108:2447–2469. https://doi.org/10.1210/clinem/dgad463 (PMC10505534). **Partes**: 2.4–2.5 y 3.1–3.4.
29. Mozaffarian D y otros. Nutritional priorities to support GLP-1 therapy for obesity: a joint Advisory (ACLM, ASN, OMA, TOS). *Obesity* 2025;33(8):1475–1503. https://doi.org/10.1002/oby.24336 (PMC12304835; también en *Am J Clin Nutr* 2025;122:344–367). **Partes**. Financiada por los NIH; varios autores con vínculos con Novo Nordisk, Eli Lilly y otras.
30. Levinson CA, Fewell L, Brosof LC. My Fitness Pal calorie tracker usage in the eating disorders. *Eat Behav* 2017;27:14–16. https://doi.org/10.1016/j.eatbeh.2017.08.003. n=105. **Solo el resumen**.
31. Simpson CC, Mazzeo SE. Calorie counting and fitness tracking technology: Associations with eating disorder symptomatology. *Eat Behav* 2017;26:89–92. https://doi.org/10.1016/j.eatbeh.2017.02.002. n=493. **Solo el resumen**.
32. Anderberg I, Kemps E, Prichard I. The link between the use of diet and fitness monitoring apps, body image and disordered eating symptomology: A systematic review. *Body Image* 2025;52:101836. https://doi.org/10.1016/j.bodyim.2024.101836. RS, 38 estudios. **Solo el resumen**.

La regulación y la privacidad:

33. FDA. General Wellness: Policy for Low Risk Devices (6/1/2026). https://www.fda.gov/media/90652/download. **Entero**.
34. FDA. Examples of Software Functions for Which the FDA Will Exercise Enforcement Discretion (29/9/2022). https://www.fda.gov/medical-devices/device-software-functions-including-mobile-medical-applications/examples-software-functions-which-fda-will-exercise-enforcement-discretion. **Partes**.
35. MDCG 2019-11 rev. 1. Guidance on Qualification and Classification of Software in Regulation (EU) 2017/745 – MDR and 2017/746 – IVDR (junio de 2025). https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf. **Partes**: la definición, 3.1, 3.2 y 4.2.1 (la regla 11).
36. Apple. App Review Guidelines. https://developer.apple.com/app-store/review/guidelines/. **Partes**: 1.4.1, 5.1.1 y 5.1.3.
37. Apple. App Privacy Details on the App Store. https://developer.apple.com/app-store/app-privacy-details/. **Partes**: «collect», *Health*, *Sensitive Info*, lo que se deriva y lo optativo.
38. Apple. HKCategoryTypeIdentifier.pregnancy y .lactation. https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/pregnancy y https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/lactation. **Las páginas**.
39. Reglamento (UE) 2016/679 (RGPD). https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679. **Partes**: art. 4.15, art. 9, art. 25 y el considerando 35.
40. Ley 18.331 de Protección de Datos Personales (Uruguay). https://www.impo.com.uy/bases/leyes/18331-2008. **Partes**: arts. 4.E, 18 y 19.

Las otras apps:

41. MacroFactor. Health Disclaimer y Terms (1/12/2025). https://macrofactor.com/health-disclaimer/ y https://macrofactor.com/terms/. **Las páginas**.
42. Cronometer. Targets + Profile. https://support.cronometer.com/hc/en-us/articles/31308427612180. **La página**.
43. MyFitnessPal Help. «If I am pregnant, how do I adjust my goals?» y «How do I adjust my goals for my nutritional or health needs (e.g., diabetes)». https://support.myfitnesspal.com/hc/en-us/articles/360032272052 y https://support.myfitnesspal.com/hc/en-us/articles/360032271812. **Las páginas**.
44. Lose It! Support. Pregnancy & Breastfeeding (4/8/2026). https://loseit.zendesk.com/hc/en-us/articles/51042842024852-Pregnancy-Breastfeeding. **La página**.
45. Noom. Terms and Conditions of Use (9/12/2025). https://www.noom.com/terms-and-conditions-of-use/. **La página**.
