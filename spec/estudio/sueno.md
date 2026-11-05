# El sueño: lo que calcula Moss contra la mejor evidencia

Estudio del 5/11/2026, área **sueño**. Leído en el repo (rama `mejoras-1.1`, solo lectura):
`src/dominio/sueno.ts`, `src/dominio/sinReloj.ts`, `src/salud/convertir.ts`, `src/salud/nocheSinReloj.ts`,
`src/dominio/avisos.ts` (la hora de dormir), `src/recordatorios/programar.ts`, `src/secciones/persona.ts`,
`src/secciones/sueno/Sueno.tsx` (cómo se muestra la deuda), los tests de `sueno.test.ts`, los textos de
`sueno.*` en `src/textos/es.json` y, de `spec/`: `sueno.md`, `aparatos.md`, `evidencia-1.1.md`,
`sueno-sin-esfuerzo.md` y D19, D33 y D42 de `decisiones.md`. Todas las fuentes de abajo las abrí; al final
dice de cada una si leí el texto entero o solo el resumen.

## 1. Resumen

1. **Lo que se sostiene:** las 8 horas de fábrica para adultos y las 7 y media desde los 65 (AASM/SRS
   2015, NSF 2015, y los estudios de sueño extendido: 8,4 h en jóvenes, 7,4 h en mayores); una sola
   fuente por noche; usar sobre todo cuánto y cuándo dormiste, y dejar las etapas fuera de la calidad (la
   NSF 2017 no llegó a consenso sobre las etapas; los relojes subestiman el profundo 25 a 43 min); las
   categorías de la regularidad (30/60/90 min, de Huang 2020); el orden de las marcas por cómo detectan la
   vigilia; aprender lo tuyo con contracción hacia lo general; preguntar a la mañana como un diario.
2. **Cae: lo que necesitas antes de los 18.** Moss es para mayores de 16 y les da 8 h, como a un adulto.
   La AASM (2016) y la NSF (2015) piden **8 a 10 h** para los adolescentes: de fábrica deberían ser 9.
3. **Cae: no se puede elegir la necesidad.** La spec dice «se cambia de 7 a 9», pero la app nunca le pasa
   una elegida a `necesidad()` (`persona.ts:171`, `programar.ts:65`): la edad decide todo.
4. **La deuda, a medias.** Sumar lo que falta se sostiene (Van Dongen 2003: el déficit se acumula casi en
   línea recta y quien lo tiene casi no lo siente), pero tal como está: (a) **una noche sin datos cuenta como
   si hubieras dormido justo lo que necesitas**, así que quien usa menos el reloj tiene menos deuda; (b) el
   número es casi todo la necesidad supuesta: 30 min de diferencia en la necesidad cambian la deuda en
   **3 h 45 min**, y la necesidad varía de una persona a otra con un desvío de unos 40 min (Kitamura 2016:
   7,3 a 9,3 h); (c) lo que sobra no paga hora por hora (Banks 2010, Depner 2019); (d) se muestra al minuto
   («4 h 32 min»): precisión falsa.
5. **Cae: la noche del teléfono cuenta como dormido todo el rato entre dormirte y despertarte.** Eso es el
   período de sueño, no el sueño: en adultos sanos, lo despierto adentro promedia unos 30 a 38 min por
   polisomnografía. Contra una necesidad de 8 h de sueño, la deuda sin reloj sale unas 4 h más baja en dos
   semanas (7,5 noches equivalentes × 30 a 38 min). Lo mismo le falta a la hora de ir a la cama:
   `despertar − necesidad` no deja lugar para lo despierto de la noche.
6. **La calidad es una convención** (copia la estructura del puntaje de Apple: 50/30/20) y está bien
   explicada, pero su continuidad usa umbrales de polisomnografía (NSF 2017) con un reloj que ve la mitad de
   la vigilia y subestima lo despierto 10 a 21 min: da de más. Además, lo que mide el reloj explica solo el
   2,5 a 16 % de cómo sentimos que dormimos (Srivali 2026): hace bien Moss en mostrar las caras aparte.
7. **Sin reloj, la ponderación por 1/duda² es la forma correcta de juntar señales, pero el rango que se
   muestra no sale de ella:** «±20 min» con las dudas que usa Moss (30 a 35 min combinadas) cubre entre el
   43 y el 50 % de las noches. Los errores tienen colas pesadas (Sahha: 13,5 % de las noches con más de 2 h
   de error, cuando una normal con el mismo error mediano daría 0,08 %). El rango tiene que salir de la duda
   combinada (±1,28·σ para el 80 %) y calibrarse con las correcciones.
8. **La regularidad sin reloj, sesgada:** el error de cada noche estimada infla el desvío (alguien con
   ±20 min de verdad aparece con ±36 a 40) y «lo de siempre», que se arma con noches estimadas, vuelve a
   entrar como señal. Con noches estimadas tiene que decir «aprox.» hasta medirlo en la prueba en sombra.
9. **Tres citas mal leídas:** Kitamura 2016 no dice que «una hora de deuda lleva cuatro días» sino que una
   falta de ~1 h **por noche** se recuperó en ~4 noches con 12 h en la cama; Huang 2020 habla del desvío
   de 7 días, no del corrimiento de una noche; y que el SRI predice la mortalidad es de Windred 2024, no de
   Phillips 2017.
10. **Lo que no se dice:** ningún diagnóstico (insomnio, apnea), ningún riesgo de muerte o de enfermedad
    a una persona, ningún porcentaje de precisión propio sin medirlo, y nunca empujar a pasar más tiempo
    en la cama a quien tarda mucho en dormirse (va contra la terapia del insomnio, AASM 2021).

## 2. Tabla de veredictos

| Qué calcula Moss | Dónde (archivo:línea) | Veredicto | La mejor evidencia (autor, año, tipo, n) | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| Lo que necesitas: 8 h de 18 a 64 | `sueno.ts:375-379` | **Se sostiene** | Watson 2015, consenso AASM/SRS (15 expertos, 5.314 artículos): ≥7 h; Hirshkowitz 2015, consenso NSF (18 expertos): 7 a 9 h; Kitamura 2016, laboratorio (n=15): 8,41 h (7,29–9,26); Klerman y Dijk 2008, laboratorio (n=53): 8,9 h en jóvenes | 8 h de fábrica, dicho como «unas 8 h (7 a 9 para tu edad)» | Edad | Sí |
| Desde los 65: 7 h y media | `sueno.ts:378` | **Se sostiene** | Hirshkowitz 2015 (NSF): 7 a 8 h; Klerman y Dijk 2008: 7,4 h (IC 6,6–8,3) en 60 a 76 años | Igual | Edad | Sí |
| De 16 y 17 años: 8 h, como un adulto | `sueno.ts:375-379`; `metas.ts:53` (Moss desde los 16) | **Refutado** | Paruthi 2016, consenso AASM (13 expertos, 864 artículos): 13 a 18 años, 8 a 10 h por 24 h; Hirshkowitz 2015: adolescentes, 8 a 10 | 9 h de fábrica, elegible de 8 a 10 | Edad | Sí |
| Elegir la necesidad de 7 a 9 | `sueno.ts:377`; nunca se llama con `elegida` (`persona.ts:171`, `programar.ts:65`) | **No está hecho** (la spec lo da por hecho) | Watson 2015: «más de 9 h puede ser apropiado para jóvenes, quien se recupera de una deuda o está enfermo»; Kitamura 2016: la necesidad varía de 7,3 a 9,3 h | Dejar elegirla (7 a 9; 8 a 10 antes de los 18) y ofrecer descubrirla (abajo, D4) | Lo que elija la persona | No |
| La deuda: lo que faltó en 14 noches, pesos de 1 a 1/14, lo que sobra resta hasta 2 h, piso 0, desde 5 noches | `sueno.ts:433-455` | **A medias** | Van Dongen 2003, ensayo (n=48): 14 días con 4 o 6 h en la cama dan un déficit acumulativo casi lineal, equivalente a hasta 2 noches sin dormir, sin que la somnolencia percibida lo refleje; Belenky 2003, ensayo (n=66): 3 noches de 8 h no alcanzan; Banks 2010, ensayo (n=159): una noche de 10 h no alcanza; Depner 2019, ensayo (n=36): el fin de semana libre devolvió ~1,1 h de más de 12 perdidas | Normalizar por las noches medidas; mostrar el promedio por noche contra la necesidad y la deuda redondeada a media hora, «aprox.»; no presentarla como una cuenta que se paga durmiendo de más | Sueño de cada noche (de verdad, no el período) y la necesidad | En parte (sin reloj, mide el período) |
| «Una hora de deuda lleva unos cuatro días» (por eso paga un tercio, hasta 30 min) | `avisos.ts:200-213`; `spec/sueno.md` «Las cuentas»; `evidencia-1.1.md` §2 | **Refutado como cita** | Kitamura 2016: la «deuda potencial» media fue 1,04 h **por noche** (lo habitual contra lo óptimo) y se recuperó en ~4 noches **con 12 h en la cama** | El pago por deuda es una convención; citarlo como tal | — | — |
| La calidad: duración 50 (0 a 4 h, lineal hasta la necesidad), horario 30, continuidad 20 | `sueno.ts:482-512` | **Convención** (la estructura es la de Apple) | Apple, guía del Apple Watch: duración 50, constancia de la hora de dormirte 30 (13 noches), interrupciones 20; no hay estudio que valide esos pesos ni los de Oura o Fitbit | Mantenerla, explicada como hoy, y llamarla estimación | Lo de cada noche | Sí |
| La continuidad: lo despierto (todo hasta 20 min, nada desde 60) y los despertares de 5 min o más (todo con 1, nada con 4) | `sueno.ts:502` | **A medias** | Ohayon 2017, consenso NSF (277 estudios): buena calidad ≤20 min despierto y ≤1 despertar >5 min; no buena ≥4 despertares y ≥41 min despierto en adultos; Robbins 2024 (n=29 con Apple Watch): el reloj subestima lo despierto 10 min; Schyvens 2025 (n=20): 21 min y ve el 52 % de la vigilia | Los umbrales son de polisomnografía: sumarle al reloj su subestimación (~15 min) o poner el cero en 41–50 min | Lo despierto y los despertares | Sí, con reloj |
| Las etapas, la latencia, la eficiencia y el corazón no entran en la calidad | `sueno.ts:491` | **Se sostiene** | Ohayon 2017 (NSF): «less or no consensus» sobre la arquitectura; Robbins 2024: profundo −43 min, ligero +45 con Apple Watch; Schyvens 2025: κ de 0,21 a 0,53 en 4 estados | Igual | — | — |
| Las palabras: excelente ≥85, buena ≥70, regular ≥50 | `sueno.ts:510` | **Convención** | Oura: 85/70/60; Apple: 96/81/61/41; Fitbit: 90/80/60 | Igual | — | — |
| La calidad que dijiste (5 caras), aparte | `sueno.ts:31-33`; `spec/sueno.md` 0 | **Se sostiene** | Buysse 1989 (PSQI, n=168): la calidad subjetiva es uno de sus 7 componentes; Buysse 2014: la satisfacción es una dimensión de la salud del sueño; Srivali 2026, revisión sistemática (5 estudios, 2.006 personas): el reloj explica 2,5–16 % de la calidad percibida | Mantenerla aparte, y darle más lugar | La respuesta | Sí |
| La regularidad: desvío de la hora de dormirte y de despertarte en 14 noches (≥8), 30/60/90 min por el peor | `sueno.ts:409-431` | **Se sostiene con reloj; a medias sin reloj** | Huang 2020, cohorte MESA (n=1.992, 111 eventos): desvío de la hora de dormirse >90 min contra ≤30, HR 2,11 (1,13–3,91); Fischer 2021, simulaciones: el desvío necesita más de una semana; el error de una noche estimada (σ≈30–35 min) infla el desvío | Con noches estimadas, restar el ruido de la estimación o decir «aprox.»; no armar «lo de siempre» con noches estimadas que después se usan para medir la regularidad | Hora de dormirte y despertarte | Sí |
| El fin de semana: la mitad del sueño del sábado y el domingo contra lunes a viernes | `sueno.ts:420-429` | **Se sostiene** | Fischer 2021: es el «jet lag social», que mide la variación semanal; Depner 2019: después del fin de semana libre, el fin de la noche biológica (la melatonina) quedó ~1,4 h más tarde el lunes | Igual; sumar cuánto más se duerme (D8) | Horas | Sí |
| El índice de regularidad (SRI): no se calcula | `spec/sueno.md` «Fuera de la v1» | **Decisión** | Windred 2024, cohorte UK Biobank (n=60.977): los 4 quintiles más regulares, 20–48 % menos mortalidad; mejor predictor que la duración; Czeisler 2026 (n=73.794): dos calculadoras comunes dan valores muy distintos y cambian los resultados | Si se calcula: solo con reloj, como tendencia propia, nunca contra la población | Sueño minuto a minuto, con siestas, días seguidos | Casi (faltan los intervalos de las siestas) |
| Poco sueño sostenido: <6 h de promedio con ≥10 de 14 noches → hablarlo con un médico | `sueno.ts:457-467` | **Se sostiene** (convención prudente) | Watson 2015: <7 h de forma regular se asocia con daños, y «quien se preocupe… consulte»; los relojes cuentan de más (+8 a +40 min) | Igual; antes de los 18, <7 h (Paruthi 2016) | Horas medidas | Sí |
| Una noche, una fuente, ordenadas por cómo detectan la vigilia | `sueno.ts:195-209` | **Se sostiene** | Schyvens 2025 (n=62): especificidad Apple 52 %, Fitbit 47–49, WHOOP 40, Withings 31, Garmin 29; Svensson 2024 (n=96, Oura): 73–75 %; Robbins 2024 (pagado por Oura): Oura ≈ Apple; Agostinho 2026, metaanálisis (16 estudios): ninguno es mejor siempre | Igual | Fuente | Sí |
| Qué tan confiable es cada dato: duración y horario «confiable», despertares «aproximado», etapas «estimación» | `sueno.ts:276-284`, `:324-330` | **Se sostiene** | Robbins 2024: sensibilidad 97 %, total +8 min; Schyvens 2025: +19,6 min (límites −38 a +78); Miller 2022 (n=53, Series 6): +39,5 min y 26 % de la vigilia; Apple 2025 (de Apple, 299 noches): especificidad 75 % | Igual, con «+8 a +40 min» en la spec en vez de «+8 a +20» | — | — |
| La noche cortada: menos de la mitad y despertarse 2 h antes → se pregunta | `sueno.ts:514-522` | **Convención útil** | Schyvens 2025: el Apple Watch no registró o registró a medias 15 de 35 noches; Robbins 2024: 6 de 35 sin datos | Igual | — | Sí |
| Lo de la noche: promedio contra la mediana de 28 noches (≥7); «más» o «menos» con 3 lpm, 15 % o 1 rpm | `sueno.ts:526-552` | **Convención** | Miller 2022: la frecuencia del Apple Watch, ICC 0,96 (límites −3,5 a +4,6 lpm); la variabilidad, ICC 0,67 y −9,6 ms | Umbral con la variación propia (p. ej., 2 desvíos absolutos medianos de tus 28 noches); nunca un diagnóstico | Lecturas | Sí |
| Sin reloj: juntar las señales por 1/duda² | `sinReloj.ts:167-172`, `:260-303` | **A medias** | Es el promedio de mínima varianza si las señales no tienen sesgo y sus errores son independientes y normales; Sahha 2026 (empresa, sin revisión de pares, contra relojes; 105.826 noches): error mediano 24 y 19 min, pero 13,5 % de noches con más de 2 h | Mantenerla; sacar de ahí la duda combinada y usarla para el rango | Las dudas | Sí |
| El rango que se muestra: ±20/15 min con «alta», ±35/25 «media», ±60/45 «baja» | `sinReloj.ts:128`, `:384-388` | **Refutado** | Con la duda que usa Moss (35 min ≈ 24/0,674), ±20 cubre el 43 % de las noches; ±35, el 68 % | Rango = ±1,28·σ combinada (80 %), más ancho con los motivos de error grande, y calibrado con tus correcciones | Las dudas y las correcciones | Sí |
| La confianza (0,85 menos los motivos) | `sinReloj.ts:307-351` | **Convención, a calibrar** | Sahha 2026: 26 % de los errores grandes son usar el teléfono de noche, 25 % dejarlo mucho antes, 23 % agarrarlo mucho después: los motivos de Moss apuntan justo ahí | Calibrarla en la prueba en sombra (que «alta» acierte lo que promete) | Noches con reloj y teléfono | En la prueba |
| La noche del teléfono: dormido = de dormirte a despertarte, despierto 0 | `sinReloj.ts:476-500` (`:486`, `:492`) | **Refutado** para la deuda y la hora de dormir | Robbins 2024: lo despierto adentro, 32–38 min por PSG en sanos de 20 a 50; Apple 2025: 31,5 min en las noches con PSG con que diseñó su algoritmo; Boulos 2019, metaanálisis (5.273 personas): +9,7 min por década; Matthews 2018 (n=223): el diario cuenta 20–30 min de más | Sueño ≈ período − 30 min (o lo tuyo, si tuviste noches con reloj), «aprox.» | Edad o noches con reloj | Sí |
| Lo que tardas desde el último uso: 31 min de fábrica (18/31 si fue tarde); 18 al agarrarlo | `sinReloj.ts:88-99` | **Se sostiene como punto de partida** | Sahha 2026 (la única fuente de esos números); no es la latencia clínica: por PSG, 16,9 min en 2.113 adultos (Silva 2007) | Igual; no compararlo con normas clínicas | Las respuestas | Sí |
| Aprender lo tuyo: contracción n·τ²/(n·τ²+σ²), τ=25, σ=35; un «Sí» vale 1/3; vida media 30 noches | `sinReloj.ts:129-143`, `:414-440` | **Se sostiene la forma; las constantes, convención** | Saeb 2017 (n=208): el modelo de cada persona le gana al general, 91,8 contra 87,6 %; con solo la hora del día ya se acierta el 86,9 % | Igual; medir τ y σ en la prueba en sombra | Las respuestas | Sí |
| Preguntar las dos primeras semanas; después, si no está segura; un día por semana sin proponer | `sinReloj.ts:442-457` | **Se sostiene** | Aili 2017 (n=54): el diario es confiable desde 6 noches; Thurman 2018 (n=30): el diario coincide con la actigrafía dentro de ±1 h en el 79 % (dormirse) y el 86 % (despertarse) | Igual | — | Sí |
| La ventana tranquila (5 a 12 h), lo suelto de la madrugada | `sinReloj.ts:77-82` | **Convención** | Reglas de Sahha 2026 | Igual | — | Sí |
| La hora de ir a la cama: despertar − necesidad − min(30, deuda/3), nunca más de 60 min antes de lo de siempre; acostarse = eso − lo que tardas | `avisos.ts:185-237` | **A medias** | Anclar en el despertar: Edinger 2021, guía AASM (control de estímulos: «despertarse a la misma hora cada mañana»); Sletten 2023, consenso NSF; el tope: Lavie 1986 (n=22), «zona prohibida» ~20–22 h, horas antes de dormir | Restar también lo despierto típico de la noche (con reloj, lo tuyo + ~15 min; sin reloj, 30) | Lo despierto, la latencia | Sí |
| Adelantar la cama a quien tarda mucho en dormirse | `avisos.ts:208-213` (no lo distingue) | **Falta un límite** | Edinger 2021 (AASM): la terapia del insomnio limita el tiempo en la cama («ir a la cama solo con sueño») | Con «Tardo en dormirme» ≥45 min, no adelantar y sugerir consultarlo si pasa casi siempre | Lo elegido | Sí |
| El día del sueño cambia a las 18; la noche es del día en que te despiertas | `sueno.ts:104-111` | **Convención** | La de Fitbit | Igual | — | Sí |
| Siestas desde 15 min, para la deuda | `sueno.ts:101`, `:264-270` | **Convención** | Paruthi 2016 cuenta el sueño por 24 h | Igual | — | Sí (con reloj) |
| Un despertar es desde 5 min | `sueno.ts:103` | **Se sostiene** | Ohayon 2017 (NSF) cuenta los despertares de más de 5 min | Igual | — | Sí |
| Dos fuentes son el mismo sueño si se superponen la mitad o los bordes difieren ≤90 min | `sueno.ts:211-221` | **Convención razonable** | Schyvens 2025: límites del total del Apple Watch, unos ±58 min alrededor del sesgo | Igual | — | Sí |

### 2.1 Lo que necesitas dormir

- **Las guías.** La AASM y la SRS (Watson 2015): «Adults should sleep 7 or more hours per night on a
  regular basis», de 18 a 60 años; más de 9 h puede ser apropiado para jóvenes, quien se recupera de una
  deuda o está enfermo. La NSF (Hirshkowitz 2015): 7 a 9 h en adultos jóvenes y adultos, 7 a 8 en mayores,
  8 a 10 en adolescentes. La AASM pediátrica (Paruthi 2016): de 13 a 18 años, 8 a 10 h por 24 h, y dormir
  de menos se asocia con más riesgo de autolesión en adolescentes. Las tres son consensos de expertos con el
  método RAND/UCLA; los dos de la AASM, con plata de la AASM, la SRS y los CDC.
- **¿Se puede estimar la de cada uno?** Solo en laboratorio: con 12 h en la cama 9 noches seguidas, el
  sueño baja hasta una asíntota (Kitamura 2016: 8,41 h en 15 hombres de 20 a 26 años, de 7,29 a 9,26; el
  «± 0,18» del artículo es el error estándar, así que el desvío entre personas sale de unos 0,7 h, cuenta
  mía). Con 16 h de oportunidad, los jóvenes se estabilizan en 8,9 h y los
  mayores en 7,4 h (Klerman y Dijk 2008). Van Dongen 2003 encontró que el rendimiento empeora con todo lo
  despierto más allá de 15,84 h por día, o sea, con menos de unas 8,2 h. En casa no hay un método validado;
  lo más parecido es dormir sin despertador varios días seguidos y descartar los primeros (el rebote): en
  Kitamura, el sueño de más de la primera noche se correlacionó con la deuda (r = 0,77).
- **Antes de los 18:** con Moss desde los 16, las 8 h de fábrica quedan en el borde de abajo de lo
  recomendado. El centro es 9.

### 2.2 La deuda

- **Que se acumule tiene base:** Van Dongen 2003 (14 días con 4, 6 u 8 h en la cama) y Belenky 2003 (7 días
  con 3, 5, 7 o 9 h) muestran un déficit que crece día a día; con 6 h o menos se llega a lo de 2 noches sin
  dormir, y la gente casi no lo nota. Eso último es lo más útil para decir: «puede que no lo notes».
- **Que se pague hora por hora, no:** una noche de hasta 10 h en la cama no alcanzó después de 5 noches de
  4 h (Banks 2010); 3 noches de 8 h no alcanzaron (Belenky 2003); un fin de semana libre devolvió ~1,1 h de
  más de 12 perdidas y no evitó la caída de la sensibilidad a la insulina, de 9 a 27 % (Depner 2019). El
  consenso de la NSF (Sletten 2023) dice que lo regular importa y que recuperar el fin de semana «may be
  beneficial» si en la semana no alcanza. O sea: ayuda algo, no lo compensa.
- **14 noches con pesos que bajan** es razonable (en los ensayos, lo de hace una o dos semanas todavía pesa;
  y para un promedio confiable de sueño medido hacen falta más de 7 noches, Aili 2017), pero los pesos son
  una convención: suman 7,5 «noches equivalentes».
- **Los tres problemas de la cuenta actual:**
  1. *Las noches sin datos* no suman ni restan: es lo mismo que suponer que esa noche dormiste justo tu
     necesidad. Con 1 h de falta cada noche, 14 noches medidas dan 7 h 30 min de deuda y 5 noches (las
     últimas) dan 4 h 17 min. La deuda baja por no usar el reloj.
  2. *La necesidad manda:* la deuda cambia 7,5 veces lo que cambia la necesidad. Con el desvío de la
     necesidad entre personas (~0,7 h), la incertidumbre es de unas ±5 h; el error aleatorio de las noches
     medidas suma ±1 a 1,5 h más (σ de 30 a 40 min por noche × 2,28). Con eso, «4 h 32 min» es precisión falsa.
  3. *Sin reloj*, cada noche cuenta lo despierto como dormido (ver 2.6): unos 30 min por noche, 3 h 45 min
     en la cuenta.
- **Lo más confiable:** `deuda = máx(0, W · Σ wᵢ·fᵢ / Σ wᵢ)`, con las sumas solo sobre las noches medidas,
  `W = 7,5` (la suma de los 14 pesos) y `fᵢ = máx(−120, necesidad − (sueño + siestas))`. Mostrarla
  redondeada a media hora, con «aprox.», junto al promedio por noche («Duermes unas 7 h; necesitas unas
  8»), que es lo que tiene menos error y se entiende mejor.

### 2.3 La calidad

- **Qué hacen los demás:** Apple (la guía del Apple Watch) usa duración 50, constancia de la hora en que te
  dormiste 30 (13 noches) e interrupciones 20; Moss copia eso, y suma la hora de despertarte al horario.
  Oura mezcla el total, la eficiencia, la inquietud, el REM, el profundo, la latencia y la hora, sin
  publicar los pesos. Fitbit compara contra metas por edad y sexo y necesita las etapas. No encontré una
  validación publicada de ninguno de esos puntajes contra un resultado de salud.
- **Contra el PSQI** (Buysse 1989): el PSQI es un cuestionario de un mes, con 7 componentes (la calidad
  subjetiva, la latencia, la duración, la eficiencia, las alteraciones, la medicación y el día siguiente);
  >5 distingue a quien duerme mal con 89,6 % de sensibilidad. La calidad de Moss es de una noche y no tiene
  nada del día siguiente ni de lo subjetivo: no es comparable con el PSQI, y no hay que decirlo.
- **Lo que mide cada cosa:** la latencia es lo que tardas en dormirte; lo despierto después de dormirte
  (WASO) y los despertares de más de 5 min, la continuidad; la eficiencia, el sueño sobre el tiempo en la
  cama. La NSF 2017 les dio umbrales a las cuatro (los de la latencia, en 2.7; los demás, en la tabla) y
  ninguno a las etapas. Moss no tiene la
  latencia ni la eficiencia de verdad: según la spec (`sueno.md`, «Lo que trae Salud»), el reloj no escribe
  «en cama» desde watchOS 11 y solo escribe «despierto» entre dos tramos de sueño. Usa lo que puede.
- **Lo que no cierra:** la continuidad aplica umbrales de polisomnografía a lo que ve el reloj, que encuentra
  la mitad de la vigilia o menos (Schyvens 2025: 52 % el Series 8; Miller 2022: 26 % el Series 6) y
  subestima lo despierto 10 a 21 min. Con 35 min de verdad, el reloj marca unos 15 a 25 y Moss da casi
  todos los puntos.

### 2.4 La regularidad

- **El SRI** (Phillips 2017, 61 universitarios con 30 días de diario) es la probabilidad de estar en el mismo
  estado (dormido o despierto) a la misma hora en dos días seguidos, llevada a −100…100:
  `SRI = −100 + 200/(M·(N−1)) · Σⱼ Σᵢ δ(sᵢ,ⱼ, sᵢ₊₁,ⱼ)`, con M minutos por día y N días (Fischer 2021). Se
  asoció con el promedio de notas (r = 0,37) y con un reloj del cuerpo atrasado. En UK Biobank (Windred
  2024: 60.977 personas de 63 años de promedio, SRI mediano 81, de 73,8 a 86,3) los más regulares tuvieron
  20 a 48 % menos mortalidad, y predijo mejor que la duración; es observacional.
- **Por qué no compararlo con nadie:** dos calculadoras abiertas dan SRI muy distintos con los mismos
  datos y cambian las conclusiones (Czeisler 2026, 73.794 personas); además el SRI cambia con las siestas y
  lo despierto de la noche (Fischer 2021), que cada aparato ve distinto. La spec dice «difieren 18 puntos»:
  ese número no está en el resumen que leí.
- **El desvío estándar,** que usa Moss, es fácil de explicar (« ± 25 min») y las categorías salen de Huang
  2020 (desvío de la hora de dormirse en 7 días de actigrafía: ≤30, 31–60, 61–90, >90 min; solo >90 tuvo
  más riesgo significativo, HR 2,11). Necesita más de una semana (Fischer 2021): el mínimo de 8 noches está
  bien. El consenso de la NSF (Sletten 2023): la constancia de la hora de dormirse y de despertarse importa
  para la salud, la seguridad y el rendimiento.
- **Sin reloj,** dos sesgos opuestos: el error de cada noche suma varianza (desvío observado² ≈ desvío real²
  + error²: con un error de 30 a 35 min, ±20 de verdad se ven como ±36 a 40) y, al revés, «lo de siempre»
  (`habitualDe`, `sinReloj.ts:395-403`) se arma con noches estimadas que ya tiraban hacia lo de siempre. Hasta
  medirlo en la prueba en sombra, con noches estimadas la regularidad tiene que decir «aprox.».

### 2.5 Lo que miden el Apple Watch y los anillos

| | Apple Watch | Oura (Gen3) | Fuente |
|---|---|---|---|
| Encuentra el sueño | 97 % (Series 8) | 94–95 % | Robbins 2024; Svensson 2024 |
| Encuentra la vigilia (especificidad) | 52 % (Series 8, laboratorio con apnea sospechada), 26 % (Series 6); 75 % según Apple | 73–75 % (96 personas, varias noches) | Schyvens 2025; Miller 2022; Apple 2025; Svensson 2024 |
| El total | +8 min en sanos (n.s.); +19,6 (límites −38 a +78) en una clínica; +39,5 con el Series 6 | sin diferencia | Robbins 2024; Schyvens 2025; Miller 2022; Svensson 2024 |
| Lo despierto adentro | −10 a −21 min (error absoluto 26 min) | sin diferencia | Robbins 2024; Schyvens 2025 |
| Etapas (κ de 4) | 0,53–0,60; profundo −25 a −43 min, ligero +45 a +59 | 0,65 | Schyvens 2025; Robbins 2024 |
| Noches perdidas | 15 de 35 y 6 de 35 | 0 de 35 | Schyvens 2025; Robbins 2024 |

Robbins 2024 lo pagó Oura; el informe de Apple es de Apple. El metaanálisis de Agostinho 2026 (16 estudios)
concluye que todos sobrestiman el total y subestiman lo despierto, y que ninguno es mejor siempre. La AASM
(Khosla 2018) dice que estos aparatos «are not substitutes for medical evaluation» y que solo diagnostica lo
validado y aprobado por la FDA. La revisión de la SRS (de Zambotti 2024) señala, además, que fallan fuera del
episodio principal y con algunas pieles y cuerpos.

### 2.6 La noche sin reloj

- **No hay validación contra polisomnografía de ningún método que use solo el teléfono.** La fuente de
  casi todas las constantes es Sahha (2026, empresa que vende eso, sin revisión de pares, contra relojes):
  24,2 y 19,2 min de error mediano, 65,6 % de las noches con los dos bordes dentro de una hora, 13,5 % con
  más de 2 h, y el punto medio de 7 noches con 13 min de error. Saeb 2017 (208 personas, Android): 38 y 36
  min de desviación mediana contra lo que dijo la persona, y con solo la hora del día ya se acertaba casi lo
  mismo (86,9 contra 88,8 %): por eso «lo de siempre» pesa. Lopaczynski 2026 (23 jóvenes con trastorno
  bipolar): menos de 21 min contra actigrafía, pero con los desbloqueos de pantalla, que iOS no le da a una
  app cerrada (`sueno.md`, «Sin reloj»).
- **1/duda²:** es la forma correcta de juntar señales que proponen la misma hora. Lo que falla es lo de
  alrededor: las dudas son supuestas (la de 35 sale de 24 / 0,674, si el error fuera normal), los errores
  tienen colas pesadas (una normal con ese error mediano daría 0,08 % de noches con más de 2 h, y Sahha mide
  13,5 %), y el rango que se ve sale de una tabla (`RANGO`) y no de la duda combinada. Con 35 y 60 (el
  teléfono y lo de siempre), la combinada es 30 min: el rango del 80 % es ±39 min, no ±20.
- **El período no es el sueño:** la noche estimada o confirmada va de dormirte a despertarte, y adentro hay
  rato despierto que el teléfono no ve (Lopaczynski 2026: lo despierto, con 48,8 min de error). Por
  polisomnografía, en sanos de 20 a 50 años: 32 a 38 min (Robbins 2024); 31,5 en las noches con que Apple
  diseñó su algoritmo; sube ~10 min por década (Boulos 2019). Los diarios cuentan de 20 a 30 min de más (Matthews 2018) y la estimación
  de la mañana, 18 (Silva 2007).
- **Confirmar es como un diario:** 79 y 86 % de los bordes dentro de ±1 h contra actigrafía (Thurman 2018).

### 2.7 La latencia

- **Lo normal, por polisomnografía:** 16,9 min en 2.113 adultos de 40 o más (Silva 2007); sube 1,1 min por
  década (Boulos 2019). La NSF 2017: hasta 30 min es buena calidad; de 46 a 60, mala (salvo en mayores); más
  de 60, mala a cualquier edad.
- **Lo que aprende Moss no es eso:** es lo que pasa entre el último uso del teléfono y dormirte (31 min de
  fábrica, de Sahha), con el rato en la cama con el teléfono quieto adentro. Sirve aprenderlo para estimar
  la noche (cada persona tiene su sesgo y es estable), no para decir nada clínico. Con reloj, Moss no tiene
  la latencia: el reloj no escribe «en cama».
- **Cuándo es un problema:** tardar más de 30 a 45 min casi todas las noches, durante semanas y con
  consecuencias de día. Moss no puede medirlo; lo único que sabe es lo que la persona elige en «Tardo en
  dormirme». Diagnosticarlo es de un médico.

### 2.8 La hora de ir a la cama

- **Anclar en el despertar** se sostiene: la terapia recomendada para el insomnio (Edinger 2021, AASM)
  incluye despertarse a la misma hora cada mañana, y el consenso de la NSF (Sletten 2023) pide constancia
  en las dos horas.
- **No adelantar más de 60 min** es razonable: Lavie 1986 describió una «zona prohibida» para dormirse
  (centrada en las 20–22 h en sus sujetos) antes de la puerta del sueño, que es un evento abrupto y estable.
- **Lo que falta:** la necesidad es de sueño, y para dormirla hay que estar en la cama la necesidad más lo
  despierto de la noche más la latencia. Moss resta la latencia (aprendida) pero no lo despierto: con 8 h de
  necesidad y 30 min despierto, la cuenta deja 7 h 30 de sueño. Rise, según la spec, usa un «colchón» de 30 a
  60 min; Moss lo partió y se quedó con la mitad.
- **El pago por deuda** (un tercio, hasta 30 min) es una convención; su cita (Kitamura) está mal leída.
- **Dormir más ayuda también a comer:** en adultos con sobrepeso que dormían menos de 6,5 h, un consejo
  para extender el tiempo en la cama a 8,5 h sumó 1,2 h de sueño y bajó lo que comían en 270 kcal por día
  (Tasali 2022, ensayo, n=80); dormir de menos suma 385 kcal por día (Al Khatib 2017, metaanálisis, 11
  estudios). Moss ya dice algo parecido en Entrenamiento (`entreno.nocheCorta`): el 385 se sostiene; el 200
  de ese texto no lo revisé.

## 3. Cambios propuestos

### Arreglos claros

1. **La deuda, sin premiar las noches que faltan** (`src/dominio/sueno.ts:442-455`). Normalizar por los
   pesos de las noches medidas y devolver también el promedio por noche:

   ```ts
   const peso = (i: number) => 1 - (n - 1 - i) / n;
   const total = noches.reduce((s, _, i) => s + peso(i), 0); // 7,5 con 14
   // por cada noche medida: suma += peso(i) * falta; pesos += peso(i)
   return { minutos: Math.max(0, (suma / pesos) * total), porNoche: suma / pesos, noches: contadas, de: n };
   ```

   Test (`sueno.test.ts`): con 7 h contra 8 todas las noches, 14 medidas y 7 medidas (las impares en null)
   dan los dos 450 min; el test que hay (450 con 14) no cambia.
2. **La noche sin reloj, con lo despierto que no se ve** (`src/dominio/sinReloj.ts:486`). Una constante
   `DESPIERTO_SIN_RELOJ = 30` (Robbins 2024, Apple 2025) que se resta del período para lo que se compara con
   la necesidad (la deuda, el poco sueño, la duración de la calidad); en pantalla, «aprox.». Si la persona
   tuvo noches con reloj, la mediana de su `despierto` más 15 min (lo que el reloj subestima). Test:
   `nocheDeMoss` de 23:00 a 7:00 da `dormido` 450 y `despierto` 30.
3. **El rango sin reloj, del modelo** (`sinReloj.ts:128`, `:384-388`). En `estimarNoche`, la duda combinada de
   cada borde, `σ = (Σ 1/dudaᵢ²)^(−1/2)`, y el rango `x ± 1,28·σ` (80 %), por 1,5 si hay motivos de error grande
   (`dejasteAntes`, `agarrasteTarde`, `usoDeNoche`, `sinVentana`); con un ancla exacta, ±10 min. Guardar σ con
   la noche para calibrar. Test: con solo el teléfono y lo de siempre (35 y 60), el rango al dormirte mide
   al menos ±38 min; con «Me voy a dormir» (20) y lo de siempre, unos ±24.
4. **Lo que necesitas, antes de los 18** (`sueno.ts:375-379`):

   ```ts
   const [min, max, fabrica] = edad < 18 ? [480, 600, 540] : edad >= 65 ? [420, 540, 450] : [420, 540, 480];
   return elegida ? Math.min(max, Math.max(min, elegida)) : fabrica;
   ```

   Tests: `necesidad(16)` = 540; `necesidad(17, 420)` = 480; `necesidad(31)` = 480 y `necesidad(70)` = 450 sin
   cambios. Y, como convención, `POCO_SUENO` (`sueno.ts:462`) en 7 h antes de los 18.
5. **Poder elegir la necesidad,** como dice la spec: guardarla en el perfil y pasarla a `necesidad()` en
   `persona.ts:171` y `:176` (y de ahí a `programar.ts:65`). Test del almacén: con 7 h elegidas, la deuda y
   la hora de dormir usan 420.
6. **La hora de ir a la cama, con lo despierto de la noche** (`src/dominio/avisos.ts:208-213`): un parámetro
   `despierto` (con reloj, la mediana de las últimas 14 noches + 15; sin reloj, `DESPIERTO_SIN_RELOJ`) y
   `hora = despertar − necesidad − despierto − pago`. Test: despertarse a las 7:30 con 8 h y 30 min despierto,
   sin deuda y lo de siempre a las 23:00, da las 23:00. Los tests de `avisos.test.ts:46-68` se corren 30 min
   (el de la línea 46 pasa de 23:30 a 23:00).
7. **La deuda sin precisión falsa** (`src/secciones/sueno/Sueno.tsx:387`): redondeada a media hora, con
   «aprox.» y el promedio por noche al lado, en `es.json` y `en.json`. Una función pura en el dominio
   (`redondearDeuda`) con su test: 272 → 270, 14 → «sin deuda».
8. **Las citas** (sin cambiar números): en `avisos.ts:200-206`, `spec/sueno.md` «Las cuentas» y
   `spec/evidencia-1.1.md` §2, Kitamura dice «una falta de ~1 h por noche se recuperó en ~4 noches con 12 h en
   la cama»; en `sueno.md`, Huang habla del desvío de 7 días (HR 2,11 con >90 min) y la mortalidad del SRI es
   de Windred 2024; en `aparatos.md`, el error del total del Apple Watch es de +8 a +40 min según el modelo.
9. **La regularidad con noches estimadas, «aprox.»** (`sueno.ts:409-431`): si la mitad o más de las noches
   son de Moss, el texto lo dice y no usa «irregular» ni «muy irregular» salvo que pase de 90 min aun
   restando el ruido (`desvío² − media de σᵢ²`). Test: 14 noches a la misma hora con ±35 min alternados de
   ruido no salen «irregular».

### Decisiones del dueño

- **D1. La continuidad de la calidad:** poner el cero de lo despierto en 45 min (la NSF dice que 41 ya no es
  buena calidad) y sumarle al reloj ~15 min, o bajar su peso de 20 a 10. Propongo lo primero.
- **D2. Las noches estimadas sin confirmar en la deuda y el horario:** hoy cuentan si la confianza es media
  o alta. Propongo que cuenten con medio peso hasta tener la prueba en sombra.
- **D3. El SRI:** calcularlo solo con reloj, como tendencia propia («más regular que el mes pasado»), con
  al menos 5 días de pares válidos (Windred 2024), y nunca contra la población. Hace falta guardar los
  intervalos de las siestas.
- **D4. «Descubrir lo que necesitas»:** en vacaciones o días sin despertador, con reloj, descartar las 3
  primeras noches y tomar la mediana de las siguientes (al menos 4) como propuesta, dentro de 7–9 (8–10
  antes de los 18). Tiene base de laboratorio (Kitamura 2016; Klerman y Dijk 2008), no validación en casa.
- **D5. «Tardo en dormirme» largo:** con 45 min o más elegidos, no adelantar la hora de la cama y mostrar
  una línea: «Si casi todas las noches tardas mucho en dormirte y te afecta de día, vale la pena
  consultarlo». Va con la guía de la AASM (Edinger 2021).
- **D6. Hasta 10 h** elegibles también de 18 a 25 años (Watson 2015: más de 9 puede ser apropiado).
- **D7. Lo de la noche** con umbral propio (2 desvíos absolutos medianos de tus 28 noches) en vez de 3 lpm,
  15 % y 1 rpm.
- **D8. Cuánto más duermes el fin de semana** (en horas, no solo la mitad del sueño): un rebote grande dice
  que en la semana no alcanza (Kitamura 2016, r = 0,77). Dicho sin culpa.
- **D9. Lo que sobra:** hoy paga 1 a 1 hasta 2 h. La evidencia no da un número; si se quiere ser fiel a que
  la recuperación es incompleta, 50 %. Es convención en los dos casos.
- **D10. Calibrar en la prueba en sombra** (ya prevista en `sueno.md`): además de lo que ya mide, el ancho
  del rango (que el 80 % caiga adentro), τ y σ de lo tuyo, el ruido que se le suma a la regularidad y lo
  despierto que el teléfono no ve.

## 4. Lo que no se dice (o no se hace)

- **Ningún diagnóstico ni sospecha:** ni insomnio, ni apnea, ni narcolepsia, ni piernas inquietas, ni
  trastornos del ritmo. Nada de «riesgo de apnea» por la respiración, el oxígeno o los ronquidos. La AASM
  (Khosla 2018): estos aparatos no sustituyen una evaluación médica.
- **Ningún riesgo de muerte o de enfermedad para la persona:** lo de Windred 2024 y Huang 2020 son
  asociaciones de población, observacionales. Se puede decir que dormir regular y suficiente es bueno para
  la salud; no «tu riesgo cardiovascular es el doble».
- **Ningún porcentaje de precisión propio** de la noche sin reloj hasta medirlo (ya está en la spec, guía
  1.4.1). Citar los estudios de los relojes sí.
- **Nada sobre las etapas como bueno o malo** («poco profundo»): el reloj se equivoca en 25 a 43 min del
  profundo y la NSF no tiene consenso. Baron 2017 describe pacientes a los que el reloj los convenció de que
  dormían mal, y que no le creían ni a la polisomnografía.
- **No prescribir restricción de sueño** ni ningún tratamiento del insomnio: es con un profesional. Tampoco
  empujar a pasar más tiempo en la cama a quien tarda mucho en dormirse (D5).
- **Ni melatonina, ni pastillas, ni suplementos para dormir.**
- **No presentar la deuda como una cuenta exacta que se paga durmiendo de más** el fin de semana: no se
  recupera hora por hora (Banks 2010, Depner 2019). Lo que ayuda es dormir lo suficiente de forma regular.
- **No comparar el SRI de la persona con UK Biobank,** ni ningún número de Moss con el puntaje de Apple
  (no se puede leer, y se calculan distinto).
- **Sin rojos ni alarmas,** como ya está: el riesgo de obsesionarse con el número es real (Baron 2017).
- **Antes de los 18,** no usar los rangos de adulto.

## 5. Para «En qué se basa Moss»

**Español (neutro):**

> Para el sueño, Moss sigue las recomendaciones de la Academia Estadounidense de Medicina del Sueño y la
> Sleep Research Society (2015), que aconsejan 7 horas o más a los adultos, y las de la National Sleep
> Foundation (2015 y 2017), que dan los rangos para cada edad y qué cuenta como un sueño continuo. Con un
> reloj o un anillo, Moss usa sobre todo cuánto y cuándo dormiste, que es lo que mejor miden: en estudios
> contra polisomnografía detectan más del 90 % del sueño, pero se les escapa buena parte de los ratos
> despierto, y las etapas son bastante menos exactas (Schyvens y otros, 2025). La regularidad de tus
> horarios cuenta porque, en estudios grandes, se asocia con la salud, a veces más que la duración (Windred
> y otros, 2024). La calidad, la deuda y la regularidad son estimaciones para ver tendencias, no
> diagnósticos: la deuda depende sobre todo de cuánto necesitas dormir, que cambia de una persona a otra, y
> sin reloj Moss estima la noche con el teléfono y te pregunta para confirmarla o corregirla.

**English:**

> For sleep, Moss follows the recommendations of the American Academy of Sleep Medicine and the Sleep
> Research Society (2015), which advise adults to sleep 7 hours or more, and those of the National Sleep
> Foundation (2015 and 2017), which set the ranges for each age and what counts as continuous sleep. With a
> watch or a ring, Moss relies mostly on how long and when you slept, which is what these devices measure
> best: in studies against polysomnography they detect more than 90% of sleep but miss much of the time
> spent awake, and sleep stages are much less accurate (Schyvens et al., 2025). The regularity of your
> schedule matters because, in large studies, it is linked to health, sometimes more strongly than
> duration (Windred et al., 2024). Quality, sleep debt and regularity are estimates for seeing trends, not
> diagnoses: debt depends mostly on how much sleep you need, which varies from person to person, and
> without a watch Moss estimates your night from your phone and asks you to confirm or correct it.

## 6. Fuentes

**Consensos y guías**
- Watson NF y otros (AASM/SRS). Recommended amount of sleep for a healthy adult. *Sleep* 2015;38(6):843-844. doi:10.5665/sleep.4716 · https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/ — entero.
- Paruthi S y otros (AASM). Recommended amount of sleep for pediatric populations. *J Clin Sleep Med* 2016;12(6):785-786. doi:10.5664/jcsm.5866 · PMC4877308 — entero.
- Hirshkowitz M y otros (NSF). National Sleep Foundation's sleep time duration recommendations. *Sleep Health* 2015. doi:10.1016/j.sleh.2014.12.010 — solo el resumen.
- Ohayon M y otros (NSF). National Sleep Foundation's sleep quality recommendations: first report. *Sleep Health* 2017;3:6-19. doi:10.1016/j.sleh.2016.11.006 · https://escholarship.org/uc/item/9xc5x5h2 — entero (métodos y resultados).
- Sletten TL y otros (NSF). The importance of sleep regularity: a consensus statement. *Sleep Health* 2023. doi:10.1016/j.sleh.2023.07.016 — solo el resumen.
- Khosla S y otros (AASM). Consumer sleep technology: an AASM position statement. *J Clin Sleep Med* 2018;14(5):877-880. doi:10.5664/jcsm.7128 · PMC5940440 — entero.
- Edinger JD y otros (AASM). Behavioral and psychological treatments for chronic insomnia disorder in adults: clinical practice guideline. *J Clin Sleep Med* 2021. doi:10.5664/jcsm.8986 · PMC7853203 — entero (recomendaciones y definiciones).

**Lo que se necesita y la deuda**
- Kitamura S y otros. Estimating individual optimal sleep duration and potential sleep debt. *Sci Rep* 2016;6:35812. doi:10.1038/srep35812 · PMC5075948 — entero.
- Klerman EB, Dijk DJ. Age-related reduction in the maximal capacity for sleep. *Curr Biol* 2008. doi:10.1016/j.cub.2008.06.047 · PMC2582347 — entero.
- Van Dongen HPA y otros. The cumulative cost of additional wakefulness. *Sleep* 2003;26(2):117. doi:10.1093/sleep/26.2.117 — solo el resumen.
- Belenky G y otros. Patterns of performance degradation and restoration during sleep restriction and subsequent recovery. *J Sleep Res* 2003. doi:10.1046/j.1365-2869.2003.00337.x — solo el resumen.
- Banks S y otros. Neurobehavioral dynamics following chronic sleep restriction: dose-response effects of one night for recovery. *Sleep* 2010;33(8):1013-1026. doi:10.1093/sleep/33.8.1013 · PMC2910531 — solo el resumen.
- Depner CM y otros. Ad libitum weekend recovery sleep fails to prevent metabolic dysregulation. *Curr Biol* 2019. doi:10.1016/j.cub.2019.01.069 · PMC12798825 — entero (resumen y resultados).
- Aili K y otros. Reliability of actigraphy and subjective sleep measurements in adults. *J Clin Sleep Med* 2017. doi:10.5664/jcsm.6384 — solo el resumen.

**La calidad y lo normal**
- Buysse DJ y otros. The Pittsburgh Sleep Quality Index. *Psychiatry Res* 1989. doi:10.1016/0165-1781(89)90047-4 — solo el resumen.
- Buysse DJ. Sleep health: can we define it? Does it matter? *Sleep* 2014. doi:10.5665/sleep.3298 · PMC3902880 — entero (las dimensiones).
- Ohayon MM y otros. Meta-analysis of quantitative sleep parameters from childhood to old age. *Sleep* 2004;27(7):1255. doi:10.1093/sleep/27.7.1255 — solo el resumen.
- Boulos MI y otros. Normal polysomnography parameters in healthy adults: a systematic review and meta-analysis. *Lancet Respir Med* 2019. doi:10.1016/S2213-2600(19)30057-8 — solo el resumen.
- Silva GE y otros. Relationship between reported and measured sleep times: the Sleep Heart Health Study. *J Clin Sleep Med* 2007. PMC2045712 — entero (resumen y resultados).
- Srivali N, Cheungpasitporn W. Concordance of wearable device sleep metrics with patient-reported sleep quality: a systematic review. *Sleep Med* 2026. doi:10.1016/j.sleep.2026.108941 — solo el resumen.
- Baron KG y otros. Orthosomnia: are some patients taking the quantified self too far? *J Clin Sleep Med* 2017;13(2):351-354. doi:10.5664/jcsm.6472 · PMC5263088 — entero.
- Apple. Usar el puntaje de sueño en el Apple Watch (guía del Apple Watch): https://support.apple.com/guide/watch/apded441a669 — entero.
- Oura. Sleep Score: https://support.ouraring.com/hc/en-us/articles/360025445574-Sleep-Score — entero.
- Google/Fitbit. Sleep score: https://support.google.com/fitbit/answer/14236513 — entero.

**La regularidad**
- Phillips AJK y otros. Irregular sleep/wake patterns are associated with poorer academic performance and delayed circadian and sleep/wake timing. *Sci Rep* 2017. doi:10.1038/s41598-017-03171-4 · PMC5468315 — entero (métodos y resultados).
- Windred DP y otros. Sleep regularity is a stronger predictor of mortality risk than sleep duration. *Sleep* 2024;47(1):zsad253. doi:10.1093/sleep/zsad253 · PMC10782501 — entero (resumen, métodos y resultados).
- Huang T, Mariani S, Redline S. Sleep irregularity and risk of cardiovascular events: MESA. *J Am Coll Cardiol* 2020. doi:10.1016/j.jacc.2019.12.054 · PMC7237955 — entero (resumen, métodos y resultados).
- Fischer D, Klerman EB, Phillips AJK. Measuring sleep regularity: theoretical properties and practical usage of existing metrics. *Sleep* 2021;zsab103. doi:10.1093/sleep/zsab103 · PMC8503839 — entero (métodos y resultados).
- Czeisler MÉ y otros. Comparison of Sleep Regularity Index scores calculated by open-source packages (RIRI). *Sleep* 2026. doi:10.1093/sleep/zsaf299 — solo el resumen.

**Los aparatos**
- Schyvens AM y otros. A performance validation of six commercial wrist-worn wearable sleep-tracking devices. *Sleep Adv* 2025. doi:10.1093/sleepadvances/zpaf021 · PMC12038347 — entero. Pagado por la agencia flamenca VLAIO.
- Robbins R y otros. Accuracy of three commercial wearable devices for sleep tracking in healthy adults. *Sensors* 2024;24:6532. doi:10.3390/s24206532 · PMC11511193 — entero. **Pagado por Oura Ring Inc.**
- Miller DJ, Sargent C, Roach GD. A validation of six wearable devices for estimating sleep, heart rate and heart rate variability in healthy adults. *Sensors* 2022;22:6317. doi:10.3390/s22166317 · PMC9412437 — entero (resultados). Pagado por el Australian Institute of Sport.
- Svensson T y otros. Validity and reliability of the Oura Ring Gen3 with OSSA 2.0 compared to multi-night ambulatory polysomnography. *Sleep Med* 2024. doi:10.1016/j.sleep.2024.01.020 — solo el resumen (no vi quién lo pagó).
- Agostinho M y otros. Are wearable sleep-tracking devices reliable alternatives to polysomnography? A systematic review and meta-analysis. *Behav Sleep Med* 2026. doi:10.1080/15402002.2026.2673893 — solo el resumen.
- de Zambotti M y otros. State of the science and recommendations for using wearable technology in sleep and circadian research. *Sleep* 2024;zsad325. doi:10.1093/sleep/zsad325 — solo el resumen.
- Apple. Estimating Sleep Stages from Apple Watch, octubre de 2025: https://www.apple.com/health/pdf/Estimating_Sleep_Stages_from_Apple_Watch_Oct_2025.pdf — entero (resultados). **De Apple.**

**Sin reloj**
- Sahha. Estimating sleep from a smartphone alone: a validation against wearables on 105,826 nights, 2026: https://sahha.ai/research/phone-only-sleep-estimation/ — entero. **De la empresa, sin revisión de pares, contra relojes.**
- Saeb S y otros. Scalable passive sleep monitoring using mobile phones. *J Med Internet Res* 2017. doi:10.2196/jmir.6821 · PMC5413802 — entero (resultados).
- Lopaczynski A y otros. Agreement between smartphone-based mobile sensing and actigraphy sleep metrics in young people with bipolar disorder. medRxiv 2026 (luego en *Psychiatry Res*). doi:10.64898/2026.02.20.26346722 · PMC13004090 — entero (resumen y métodos).
- Thurman SM y otros. Individual differences in compliance and agreement for sleep logs and wrist actigraphy. *PLoS One* 2018;13:e0191883. doi:10.1371/journal.pone.0191883 · PMC5788380 — entero (resultados).
- Matthews KA y otros. Similarities and differences in estimates of sleep duration by polysomnography, actigraphy, diary, and self-reported habitual sleep. *Sleep Health* 2018. doi:10.1016/j.sleh.2017.10.011 · PMC5771411 — solo el resumen.

**La hora de dormir y la comida**
- Lavie P. Ultrashort sleep-waking schedule. III. «Gates» and «forbidden zones» for sleep. *Electroencephalogr Clin Neurophysiol* 1986. doi:10.1016/0013-4694(86)90123-9 — solo el resumen.
- Tasali E y otros. Effect of sleep extension on objectively assessed energy intake among adults with overweight. *JAMA Intern Med* 2022. doi:10.1001/jamainternmed.2021.8098 · PMC8822469 — entero (resultados).
- Al Khatib HK y otros. The effects of partial sleep deprivation on energy balance: a systematic review and meta-analysis. *Eur J Clin Nutr* 2017. doi:10.1038/ejcn.2016.201 — solo el resumen.

**Lo que no verifiqué** (está en la spec y no lo usé como fuente): los «18 puntos» entre calculadoras del
SRI, el «colchón» y las 14 noches de Rise, Massar 2021, Kheirinejad 2023, Gooley 2011, Tversky y Kahneman
1974, y el «200 kcal» del texto de la noche corta.
