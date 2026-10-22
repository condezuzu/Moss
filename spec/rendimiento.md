# Rendimiento, marcas y músculos (con Ascent)

Lo pediste el 22/10/2026, solo con las dos apps vinculadas:
1. el rendimiento esperado de hoy, junto a la recuperación;
2. los días para intentar una marca, aprendiendo de las tuyas;
3. qué músculos están descansados y cuáles no.

Las reglas que pusiste:
- es una predicción, nunca una garantía;
- empieza con reglas generales de los estudios y se vuelve personal;
- muestra cuánta historia tiene y qué tan segura es.

Revisé unas 85 fuentes: el resumen y, cuando estaba, el texto completo. Lo
marcado **«derivado»** es una cuenta mía a partir de los datos citados, no un
valor publicado. Lo marcado **«sin confirmar»** no tiene respaldo verificado. Las
fuentes están al final, con su número entre corchetes.

## Tres hechos que ordenan todo

1. **El ruido de cada día es del tamaño de los efectos.**
   - Si se repite una prueba de 1RM, varía un 4,2 % (mediana del CV): 3,3 % en
     entrenados y 5,5 % en no entrenados [72].
   - Una noche de 6 horas o menos baja la fuerza un 2,85 % en promedio [1].
   - Por eso se dice «más o menos probable», nunca «hoy levantas X kg».
2. **El efecto depende de la tarea.**
   - Dormir poco toca poco la fuerza máxima (−2,85 %) y mucho más las
     repeticiones (−9,85 %) [1].
   - Los carbohidratos mejoran el volumen, no el 1RM [16][17].
   - Por eso hay **dos números**: la fuerza máxima y las repeticiones.
3. **Ningún estudio predice el día de una marca personal** a partir del sueño,
   la comida y la carga. Tampoco hay puntajes de «disposición» validados para
   la fuerza: se revisaron 14 de 10 marcas y ninguno publica su fórmula [66].
   - Lo de acá es una suma a la vista de efectos medidos por separado, que se
     calibra con los datos de cada persona.

## Qué guarda Ascent hoy

Lo leí en su repo sin tocar nada:
- **Sesiones:** inicio, fin y series.
- **Las series:** el peso. Las repeticiones son opcionales desde la migración 94
  (21/10/2026).
- **Marcas:** la tabla `prs`, con el ejercicio, el peso, las repeticiones, si es
  real o estimada (Epley) y la fecha.
- **Los ejercicios:** un solo grupo cada uno (pecho, espalda, hombros, brazos,
  piernas, core o cardio).
- **No hay** esfuerzo percibido (RPE) ni repeticiones en reserva (RIR): qué tan
  cerca del fallo se entrenó no se mide y hay que suponerlo.

## 1. El rendimiento esperado de hoy

### Separado de la recuperación, debajo de ella

Usa los mismos datos, pero da otra cosa:
- **Otra unidad.** La recuperación es un índice de 0 a 100, y sus cortes (70 y
  45) no tienen respaldo en lo que revisé. El rendimiento es un porcentaje
  respecto de lo tuyo, que es lo que miden los estudios.
- **Es por ejercicio y por músculo;** la recuperación es una sola. Mezclarlos
  haría que la recuperación cambie según qué entrenás.
- **Algunas partes de la recuperación no tienen efecto demostrado en el
  rendimiento del día:** la proteína de ayer y la calidad que sentiste. Se
  quedan en la recuperación.
- **Se ve de dónde sale.** Se critica a los puntajes opacos [66]; este muestra
  sus 2 o 3 motivos.

### La salida

Dos números para el ejercicio o el grupo de hoy, con su margen (±σ):
- **Δmáx:** la fuerza máxima, en % respecto de lo tuyo.
- **Δvol:** las repeticiones y el volumen.

**σ de partida:** 3,3 % en entrenados y 5,5 % con menos de 6 meses de
entrenamiento [72]. Se personaliza (ver abajo).

**La fórmula:** Δ = S + D + Q + C + M + T, entre −15 % y +4 %.

| Δ | Se dice |
|---|---|
| +1,5 o más | mejor que lo de siempre |
| entre −1,5 y +1,5 | normal (la mayoría de los días, y es lo honesto) |
| entre −5 y −1,5 | algo por debajo |
| −5 o menos | por debajo |

### S · El sueño de anoche

h son las horas dormidas y N lo que necesitás (8 de fábrica, como en
[`sueno.md`](sueno.md)). Los atletas de élite dicen necesitar 8,3 ± 0,9 horas,
duermen 6,7 ± 0,8 y el 71 % duerme una hora o más por debajo [14]: por eso el
déficit leve pesa poco.

| Sueño | Δmáx / Δvol | De dónde sale |
|---|---|---|
| h ≥ N − 1 | 0 / 0 | — |
| 6 < h < N − 1 | −1 / −2 | derivado: no hay estudios en ese rango |
| 4,5 < h ≤ 6 | −3 / −6 | Craven 2022, 6 h o menos: fuerza −2,85 % (IC95 −4,47 a −1,23; 66 resultados), repeticiones −9,85 % [1]. Kong 2025: fuerza −0,24 DE, potencia −0,46, esfuerzo percibido +0,51 [2] |
| h ≤ 4,5, o sin dormir | −4 / −8 | sin dormir: fuerza −3,00 % (−4,52 a −1,48) [1] |

Límites de [1]: el 89 % eran hombres, no separó por entrenamiento y dejó afuera
las noches seguidas. El autor de [2] trabaja para una empresa de colchones.

**Lo que multiplica S** (todo junto, hasta ×1,6, el tamaño de los subgrupos más
grandes):
- **Despertarte una hora o más antes de lo de siempre:** ×1,5. Acostarte tarde y
  despertarte a la hora de siempre: ×0,5.
  - Fuerza −4,45 % despertando temprano y −1,16 % acostándose tarde (los dos
    intervalos cruzan el cero); potencia −7,47 y −0,50 [1].
  - Despertar temprano: fuerza −0,57 DE y potencia −1,04 [2].
- **Piernas o multiarticulares:** ×1,2. **Tren superior:** ×0,6.
  - Tren inferior −3,42 % (−5,54 a −1,31) y superior −1,63 % (−3,30 a 0,04) [1].
- **La hora de siempre para entrenar** (de las sesiones de Ascent): ×1,6 después
  de las 15 y ×0,6 antes de las 11.
  - Fuerza de tarde −4,58 % y de mañana −1,78 % [1].
- **Una siesta de 20 minutos o más después de una noche corta:** ×0,5
  (derivado).
  - Dos noches de 3 horas bajaron la potencia media en press de banca de 423 a
    376 W; una hora de siesta devolvió la mayor parte [6].
  - Después de dormir poco, 20 minutos de siesta rindieron como 90 [11].
- **Sueño estimado por el teléfono**, sin reloj: σ ×1,25 (derivado).

**Un ejemplo:**
- Datos: dormiste 5 h 50, te despertaste 1 h 20 antes, sentadilla a las 19, y el
  cuádriceps con r = 4 %.
- S = −3 × 1,6 = −4,8 en fuerza máxima y −9,6 en volumen; M = −2 y −4.
- Δmáx −6,8 % y Δvol −13,6 %: «por debajo».

### D · Las noches seguidas y la deuda

Para la última noche se toma el peor de S y D, sin sumarlos.

- **2 de las últimas 3 noches de 6 horas o menos:** −2 / −3 en
  multiarticulares; 0 / −2 en monoarticulares.
  - Tres noches de 3 horas bajan el máximo en press de banca, prensa y peso
    muerto, pero no en curl; lo submáximo cae desde la segunda noche [4].
  - Las noches seguidas bajan la fuerza multiarticular y no la monoarticular (17
    estudios) [3].
  - 9 noches de 5 horas en la cama, en 10 mujeres entrenadas [5]:
    - el volumen cayó menos del 1 %;
    - la velocidad del tren inferior, hasta un 15 %;
    - el esfuerzo percibido de la sesión subió un 11 %.
- **La deuda de 14 noches,** contra 7 horas o más: −1 / −1 (sin confirmar). No
  hay datos de fuerza. En lo mental, 14 días a 6 horas equivalen a hasta dos
  noches sin dormir, y la persona no lo nota [13].
- **El texto:** «Las series pueden sentirse más pesadas» [2][5].

### Q · Cómo dijiste que dormiste (las cinco caras)

- **1 o 2 caras:** −1 / −1, sin evidencia directa. **De 3 a 5:** 0.
- La calidad del sueño frente al rendimiento está poco estudiada [9]. Lo que uno
  siente sí sigue a la carga mejor que los marcadores objetivos (56 estudios)
  [65].
- El modelo personal decide si aporta.

### C · La comida

**Llegar con 8 horas o más sin comer a la hora de entrenar.** Solo cuenta si
solés anotar esa comida: que no haya registro no quiere decir que no comiste.
- 0 / −5 si la sesión típica dura más de 45 minutos o tiene 10 series o más por
  músculo; 0 / −2 si es corta.
- Los carbohidratos antes de entrenar suben el volumen 0,61 DE (21 estudios)
  [17]:
  - 1,02 en sesiones de más de 45 minutos y 0,23 (no significativo) en las más
    cortas;
  - 0,39 después de 8 horas o más sin comer.
- Sin el desayuno de 1,5 g/kg de carbohidratos: 58 y no 68 repeticiones de
  sentadilla (≈ −15 %), y 38 y no 40 de press de banca (≈ −5 %) [18].
- Con una comida antes, no hay efecto en sesiones de hasta 10 series por músculo
  [16].

**Los carbohidratos de ayer, menos de 3 g/kg, si ayer entrenaste los mismos
músculos con 10 series o más:** 0 / −3 (sin confirmar). El beneficio apareció
sobre todo con dos sesiones por día, y ninguno de 7 estudios de 2 a 7 días
encontró efecto [16]. La guía de 3 a 7 g/kg/día viene de la resistencia
aeróbica [19].

**En la fuerza máxima (1 a 3 repeticiones), los carbohidratos nunca cuentan**
[16][17].

**Bajar más de un 1 % por semana durante 2 semanas o más:** −1 / −2.
- Bajar 0,7 % por semana en vez de ~1,0 %: masa magra +2,1 % contra −0,2 %, y
  fuerza del tren superior +12 % contra +6 % [21].
- En déficits de 3 semanas o más, lo que se gana de fuerza no cae de forma
  significativa (−0,31), pero sí lo que se gana de masa magra (−0,57) [20].

**Lo demás:**
- Ayer, menos del 80 % de las calorías (un solo día): 0 / −1, sin evidencia
  directa.
- La proteína de ayer: 0 (ver «Lo que no se dice»).
- El agua: no se usa. Moss anota lo que tomás, no si estás hidratado.

### M · La fatiga del músculo

Con r, lo que todavía falta recuperar de los músculos principales (ver «Por
músculo»): **Δmáx −0,5·r y Δvol −1,0·r** (derivado). Después de sentadilla 5×5
más una serie al fallo, el salto seguía un 10 % abajo a las 24 horas, pero la
fuerza isométrica ya no [38].

### T · La descarga

**Si los músculos principales llevan de 2 a 7 días sin series duras, con las
series de la semana entre un 30 y un 60 % por debajo del promedio de 4 semanas y
la carga máxima mantenida (85 % del e1RM o más): +2 / 0.**
- Un taper de 1 o 2 semanas: volumen −30 a −70 % (mejor −30 a −50 %), intensidad
  de 85 % o más y de 2 a 7 días de descanso al final. Con la intensidad
  mantenida, el rendimiento sube de +1 a +6 %: sentadilla de +1,7 a +4,9 % y
  press de banca de +1,4 a +4,9 % [61].
- Con 2 a 4 días sin entrenar, las mejoras son chicas y pasan rápido [62][63].

**Más de 7 a 14 días sin ese ejercicio:** −1 / −2. Con más de 7 días sin
entrenar, la fuerza máxima baja de 1 a 4 % [61].

### Cómo se vuelve personal

- **Tu σ:** el desvío del e1RM de la serie más pesada de cada sesión contra su
  tendencia.
  - Epley solo con 10 repeticiones o menos: el 5RM predice el 1RM mejor que el
    10RM [84].
  - Se acerca a 3,3 % con el peso de 10 sesiones (derivado) [81].
- **Tu sensibilidad a cada cosa:** una regresión bayesiana sobre lo que se
  desvía tu e1RM, con el efecto de los estudios como punto de partida [73][74].
  - Lo tuyo pesa w = n / (n + 20) (derivado).
  - Una cosa se aprende solo con 5 sesiones o más de cada lado, por ejemplo 5
    después de dormir 6 horas o menos y 5 después de dormir 7 o más.

### Cómo se ve

- «Rendimiento esperado · normal»
- «Fuerza máxima: como siempre (−1 %) · Repeticiones: algo menos (−4 %)»
- Dos o tres motivos: «Dormiste 5 h 50», «Piernas recuperándose».
- «Seguridad baja · 3 semanas de datos»
- Debajo, de dónde sale el sueño: «con lo que midió tu Apple Watch» o «con lo que
  estimó el teléfono» (ver [`aparatos.md`](aparatos.md)).

## 2. Por músculo

### Lo publicado

| Estudio | Qué hicieron | Qué pasó |
|---|---|---|
| [33] | Sesión pesada de 90 min (sentadillas y extensión) | Extensión −12 a −14 %; volvió a la base a las 33 h (después de una sesión moderada, a las 3 h) |
| [35] | 8×10RM de curl predicador o de remo | Flexores del codo −26,8 % y −15,1 %. A las 24 h: −8,4 % y ya recuperado. El dolor siguió hasta 72 h después del curl |
| [36] | Press de banca, 6 series al 75 %, entrenados | Velocidad a los 4 min: al fallo −25 %, a una repetición del fallo −13 %, a tres −8 %. A las 24 h: −3, −3 y +2 %. A las 48 h, sin diferencias |
| [38] | Sentadilla 5×5 más una serie al fallo, al 80 % | Salto en hombres −14, −10, −6 y −3 % a las 4, 24, 48 y 72 h. En mujeres −22, −20, −25 y −13 % (11 hombres y 8 mujeres) |
| [29] | 4 series al fallo al 80 %, muy entrenados | Sentadilla: velocidad −8,61 % hasta 72 h. Press de banca: −26,69 % solo justo después. Peso muerto: sin caída |
| [32] | 10×5 de sentadilla al 80 % | Fatiga resuelta a las 72 h, y periférica: la activación voluntaria cae solo 48 h |
| [30] | 8×10 contra 8×3 | La fuerza isométrica sigue baja a las 72 h solo después de 8×10 |
| [28] | 3×10 al fallo contra 6×5 sin fallo (mismo volumen) | Al fallo, la recuperación entre las 24 y las 48 h es más lenta |
| [34] | A las 24 h | Multiarticulares −1,7 repeticiones, monoarticulares −0,5. A las 48 h, el 80 % estaba a una repetición o menos de lo suyo. Sugieren 72 h para multiarticulares con barra |
| [37] | Al fallo contra sin fallo | Fatiga mecánica −0,96 DE |
| [40] | Excéntricos máximos | Entrenados, recuperados al tercer día; no entrenados, todavía −40 % |
| [41] | La sesión repetida | La protección dura 6 meses o más y se pierde entre los 9 y los 12 |

### El modelo (las constantes son derivadas, para calibrar)

1. **La dosis de cada sesión, por músculo:** D = Σ series × rol × esfuerzo.
   - Rol: 1 si el músculo es el principal y 0,5 si ayuda [43].
   - Esfuerzo:
     - 1 si no hay repeticiones anotadas: se supone que las series de trabajo
       fueron cerca del fallo;
     - si hay repeticiones y e1RM, se estima cuántas quedaban en reserva: 0 o 1
       cuenta 1,0; 2 o 3 cuenta 0,6; 4 o más cuenta 0,3 (derivado de [36][28]).
   - No cuentan las series de entrada en calor, por debajo del 50 % del e1RM.
2. **Lo que cae al principio:** R0 = 30 % × (1 − e^(−D/8)).
   - 6 series dan 15,8 %, 8 series 19 % y 15 series 25,4 %, coherente con
     [33][35][36][38].
3. **Lo que falta recuperar:** r(t) = Σ R0 · e^(−t/τ), sumando las sesiones
   recientes.
4. **τ por grupo:**
   - **Pecho, espalda alta, hombros, bíceps y tríceps:** 18 horas (de 12 a 24).
     Pantorrillas, abdomen y antebrazos, igual, por falta de datos. En [35], el
     curl pasa de −26,8 a −8,4 % en 24 horas: τ ≈ 21.
   - **Cuádriceps, glúteos, isquios, espalda baja y aductores:** 36 horas (de 24
     a 48). En [38], el salto da τ ≈ 35 a 47, coherente con las 72 horas de
     [29][30][32][34].
5. **Lo que alarga τ:**
   - una serie al fallo, o 10 series duras o más en el músculo: ×1,5
     [28][30][37];
   - menos de 6 meses entrenando, o un ejercicio nuevo con mucha excéntrica:
     ×1,5 en τ y en R0 (el tamaño, sin confirmar) [39][40][41];
   - el sexo no cambia nada: un estudio chico sugiere que las mujeres recuperan
     más lento, y no alcanza para una regla [38].
6. **Los estados:**
   - **recuperado:** r menor que 3 %, debajo del ruido de cada día [72];
   - **recuperándose:** de 3 a 10 %;
   - **cargado:** más de 10 %;
   - **listo en:** t = τ · ln(r / 3).
7. **Contra los estudios:**
   - 6 series de sentadilla: 8,1 % a las 24 horas, 4,2 % a las 48 y 2,1 % a las
     72. Recuperado a las 72, como en [32][34][38].
   - Lo mismo con una serie al fallo (τ = 54): 4,2 % a las 72 horas, todavía
     recuperándose, como en [28].
   - 6 series de press de banca: 4,2 % a las 24 horas y 1,1 % a las 48, como en
     [36].
8. **Lo personal:** cada grupo tiene su multiplicador de τ, que arranca en 1 y
   se ajusta cuando el mismo ejercicio se repite en menos de 96 horas con las
   repeticiones anotadas.

### Ejercicio y músculos

Ascent le da un solo grupo a cada ejercicio, y el modelo necesita el principal y
los que ayudan. Va una tabla en el dominio de Moss (`src/dominio/musculos.ts`)
con los ejercicios comunes:
- por nombre, en español y en inglés;
- con el grupo de Ascent como respaldo, para los que no estén.

Una marca opcional de «serie al fallo» en Ascent mejoraría la dosis [28][37].

### Cómo se ve

- En palabras, no solo con color:
  - «Piernas · recuperándose · listas en ~20 h»;
  - «Espalda baja · cargada (12 series el martes, una al fallo)».
- Siempre con «según lo que anotaste en Ascent».
- El dolor no cuenta:
  - después del remo, la fuerza volvió a las 24 horas y el dolor siguió hasta
    las 72 [35];
  - en halterófilos, el rendimiento volvió a las 24 horas y el dolor siguió 72
    [46].

## 3. «Buen día para intentar marca»

### Lo que dicen los estudios

**No hay estudios que predigan días de marca.** Lo más cercano:
- la descarga sube el rendimiento de 1 a 6 % [61][62][63];
- la fatiga dura de 24 a 72 horas;
- dormir poco baja la fuerza un 2,85 % [1];
- no comer y las sesiones largas tocan el volumen, no el 1RM [16][17].

**Los mejores indicadores del momento no los tiene ninguna app:**
- la velocidad o el esfuerzo con una carga fija de entrada en calor: entre
  esfuerzo y velocidad, r de −0,79 a −0,87 en powerlifters [58];
- la gente cree que le quedan menos repeticiones de las que le quedan, por 0,95
  [60];
- regular la carga por esfuerzo o por velocidad da mejoras del 1RM parecidas a
  los porcentajes fijos [57].

**El progreso se frena con el nivel:** en 1.897 powerlifters, ~0,15 kg por día
de total, y el cuartil más fuerte avanza la mitad [83].

### La regla general, desde el primer día

Se muestra solo si se cumplen las cinco:
1. **Cerca de la marca:** el mejor e1RM de las últimas 3 semanas está a 4 % o
   menos de tu marca (derivado de [72]). Sin repeticiones para calcularlo, una
   marca en las últimas 8 semanas.
2. **Los músculos principales, recuperados** (ver «Por músculo»).
3. **El sueño:**
   - anoche, más de 6 horas;
   - sin despertarte una hora o más antes de lo de siempre;
   - y no 2 de las últimas 3 noches de 6 horas o menos [1][2][3][4].
4. **Sin pico de carga:** las series de la semana, como mucho el promedio de 4
   semanas. Lo ideal, de 2 a 7 días de descarga con la intensidad mantenida
   [61].
5. **La comida:**
   - no llegar con 8 horas o más sin comer si la marca va después de una sesión
     larga [17];
   - no estar bajando más de un 1 % por semana [21].

**La probabilidad** (una propuesta, sin validar): P = 1 − Φ((g − Δmáx) / σ), con
g la distancia a la marca en % y σ = 3,3 %.
- Con g = 2 % y un día normal (Δ = 0): 27 %.
- Después de dormir 6 horas o menos (Δ = −3): 6 %.
- Después de una descarga (Δ = +2): 50 %.

Se avisa solo con P de 35 % o más, y en 1 o 2 ejercicios por día como mucho.

### La versión tuya

**Cada sesión con ese ejercicio es una oportunidad.** Las variables:
- el sueño contra tu promedio, el despertar temprano y la peor de las últimas 3
  noches;
- las horas sin comer, los carbohidratos y las calorías de ayer;
- lo que falta recuperar de los músculos principales y los días desde su última
  sesión dura;
- las series de 7 días contra las de 28, la tendencia del peso y la distancia a
  la marca.

**Dos capas:**
1. **Continua (si hay repeticiones):** tu σ y tus sensibilidades dentro de la
   fórmula de P. Usa todas las sesiones, no solo las marcas, y por eso tiene
   mucho más dato. Los modelos de sí o no necesitan muchos eventos: con menos de
   10 por variable, se equivocan [76][77][78].
2. **Días parecidos (para explicar y para comprobar):**
   - se buscan los 8 días más parecidos con ese ejercicio;
   - se parte de la P general, que pesa como 6 días: p = (6 · P + marcas en esos
     8) / (6 + 8), con un intervalo del 80 %;
   - es contracción empírico-bayesiana: con 45 turnos, bajó el error del
     promedio de bateo a menos de la mitad [75].

**Cuánta seguridad** (los números exactos, sin confirmar):

| Seguridad | Desde |
|---|---|
| Aprendiendo | menos de 3 marcas en el ejercicio, 10 sesiones o 4 semanas: solo la regla general, y lo dice |
| Baja | de 3 a 7 marcas |
| Media | de 8 a 14 marcas y 8 semanas o más |
| Alta | 15 marcas o más, 12 semanas o más, y que lo tuyo le gane a la regla general dejando cada marca afuera (Brier) [79] |

**Para no ver patrones donde no hay:**
- 5 variables como mucho;
- los signos los fijan los estudios: más sueño o menos fatiga nunca bajan P;
- todo se acerca a la regla general;
- lo viejo pesa menos (vida media de ~12 semanas, sin confirmar);
- P queda entre 10 y 70 % mientras la seguridad no sea alta, y sin decimales.

**Las marcas que no salieron.** Una marca se intenta en los días buenos, y los
intentos fallidos no se anotan: el modelo aprende la probabilidad de marca
cuando entrenaste ese ejercicio, no cuando lo intentaste. El arreglo barato es un
botón «Lo intenté y no salió» en Ascent, junto a «¿Lo guardo como marca?».

**La confianza a la vista:**
- palabras y cuentas: «Seguridad baja · 4 marcas en 7 semanas»;
- los aciertos: «Te lo marqué 6 veces; hiciste marca en 3» [79].

Mostrar la incertidumbre no baja necesariamente la confianza, pero depende de
cómo se muestra [80].

### Los textos (en tú)

- «Buen día para intentar marca en sentadilla»
- «Dormiste 7 h 40 y las piernas llevan 3 días de descanso. Tu mejor serie
  reciente está a 2 % de tu marca.»
- «Hoy se parece a los días de tus últimas marcas en press de banca.»
- «Es una estimación, no una promesa. Si la entrada en calor se siente pesada,
  guárdala para otro día.»
- «Seguridad baja: todavía tengo 3 marcas tuyas en este ejercicio.»
- «Te lo marqué 6 veces; hiciste marca en 3.»
- Cuando no da, solo describe: «Dormiste 5 h 10 y la espalda baja sigue
  cargada.»
- Nunca: «seguro», «garantizado», «hoy rompes tu marca», «vas a levantar 142,5
  kg».

## 4. Lo que no se dice

La evidencia no respalda esto:
1. **Kilos o porcentajes exactos para hoy:** el ruido de cada día (3,3 a 5,5 %)
   es mayor que casi todos los efectos [72].
2. **Que una mala noche arruine la fuerza máxima:** −2,85 % en promedio; 24 horas
   sin dormir no cambiaron el arranque, el envión ni la sentadilla frontal [1][6][7].
3. **Que la calidad que sentiste prediga la fuerza:** no se estudió directamente
   [9].
4. **Que dormir más o una siesta suban la fuerza:** la siesta después de una
   noche normal no fue significativa [10]; dormir más mejoró sobre todo el sprint
   [11].
5. **Que los carbohidratos importen para pocas series pesadas o para el 1RM**, o
   que haya un umbral de g/kg [16][17][19].
6. **Que la proteína de ayer cambie la fuerza de hoy:** los estudios son de
   suplementos después de ejercicio que daña, y solo 5 de 27 usaron fuerza
   [25][26].
7. **Que un déficit moderado frene la fuerza:** −0,31, no significativo [20].
8. **Que la relación entre la carga de la semana y la del mes tenga una «zona
   segura»:** discrimina 0,574, casi como la carga de la semana sola (0,544) y
   apenas mejor que el azar [47][48][49].
9. **El modelo de estado y fatiga (Banister) con constantes generales:** se
   ajusta persona por persona y la parte de fatiga no mejora la predicción
   [51][52][53][54].
10. **Que un puntaje compuesto esté «validado»** [66].
11. **Que entrenar según la variabilidad sea mejor para la fuerza:** +46,8 %
    contra +47,4 % [55][56].
12. **Que el dolor quiera decir «no recuperado»,** que la fatiga del sistema
    nervioso dure días o que el peso muerto canse más que la sentadilla
    [29][32][35][46].
13. **Una regla fija de 48 horas:** la posición del ACSM de 2026 pide cada grupo 2
    veces por semana o más y no menciona un descanso fijo [45]; con el volumen
    igual, la frecuencia no tiene efecto propio [44].
14. **Diferencias por sexo como regla** [38].
15. **Que el alcohol de ayer baje la fuerza de hoy:** solo hay un efecto claro
    después de ejercicio excéntrico que daña [27].
16. **Que dormir mal «haga perder músculo» hoy:** una noche sin dormir bajó la
    síntesis de proteína un 18 %, pero eso es adaptación, no el rendimiento del
    día [15].
17. **Patrones tuyos con 2 o 3 marcas** [76][77][78].

## 5. La recuperación queda como está

La recuperación de [`ascent.md`](ascent.md) no cambia: es un número que
comparten las dos apps. Lo que se podría ajustar más adelante, con datos reales:
- **El sueño:** el efecto medible empieza en 6 horas o menos [1]. Hoy, con 8 de
  necesidad, 7 horas ya dan 17,5 de 20, así que está bien. Lo que falta es restar
  si te despertaste una hora o más antes de lo de siempre [1][2].
- **La carga:** comparar 3 días contra 4 semanas sirve para ver picos, pero no
  tiene respaldo como causa [47][48][49]. La fatiga por músculo va al lado, no
  adentro.
- **Los cortes (70 y 45):** recalibrarlos con lo que pase de verdad [79].

El ayuno y los carbohidratos no entran: van al rendimiento, que es donde tienen
efecto.

## 6. Dónde se ve

- **En Ascent, antes de entrenar,** junto a la recuperación: el rendimiento
  esperado, el estado de los músculos de lo que vas a entrenar y, si da, «Buen
  día para intentar marca».
- **En Moss:**
  - en la sección de Ascent: la recuperación y, debajo, el rendimiento, los
    músculos y la marca posible;
  - en Sueño, arriba, la recuperación con una línea del rendimiento.
- **Sin vincular:** las mismas tarjetas, vacías, con un candado chico y el botón
  para vincular.
- **Las cuentas** van en `src/dominio/rendimiento.ts` y `src/dominio/musculos.ts`,
  puras y con tests, y la galería las usa tal cual. Los datos llegan con la
  conexión con Ascent (`moss.ascent_dia()` y las funciones nuevas de abajo).

## 7. Lo que necesita de Ascent

Para la sesión aparte sobre Ascent (se suma a «Cambios en el repo de Ascent» de
[`ascent.md`](ascent.md)):
- **Leer las series y las marcas desde Moss,** con funciones propias del esquema
  `moss` que revisan el vínculo: las sesiones de las últimas 8 semanas con sus
  series (ejercicio, peso y repeticiones), y las marcas.
- **La tarjeta antes de entrenar,** junto a la recuperación.
- **«Lo intenté y no salió»** junto a «¿Lo guardo como marca?».
- **Una marca de «serie al fallo»,** opcional.

## Fuentes

1. Craven 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC9584849/
2. Kong 2025: https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1544286/full
3. Knowles 2018: https://pubmed.ncbi.nlm.nih.gov/29422383/
4. Reilly y Piercy 1994: https://pubmed.ncbi.nlm.nih.gov/8112265/
5. Knowles 2022: https://pubmed.ncbi.nlm.nih.gov/36136596/
6. Easow 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC12263768/
7. Fullagar 2015: https://pubmed.ncbi.nlm.nih.gov/25315456/
8. Vitale 2019: https://pubmed.ncbi.nlm.nih.gov/31288293/
9. Kirschen 2020: https://pubmed.ncbi.nlm.nih.gov/29944513/
10. Boukhris 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC10933197/
11. Cunha 2023: https://pmc.ncbi.nlm.nih.gov/articles/PMC10354314/
12. Cook 2012: https://pubmed.ncbi.nlm.nih.gov/22349085/
13. Van Dongen 2003: https://pubmed.ncbi.nlm.nih.gov/12683469/
14. Sargent 2021: https://pubmed.ncbi.nlm.nih.gov/34021090/
15. Lamon 2021: https://pubmed.ncbi.nlm.nih.gov/33400856/
16. Henselmans 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC8878406/
17. King 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC9584980/
18. Naharudin 2019: https://pubmed.ncbi.nlm.nih.gov/30707135/
19. Escobar 2016: https://pubmed.ncbi.nlm.nih.gov/27993175/
20. Murphy y Koehler 2022: https://pubmed.ncbi.nlm.nih.gov/34623696/
21. Garthe 2011: https://pubmed.ncbi.nlm.nih.gov/21558571/
22. Savoie 2015: https://pubmed.ncbi.nlm.nih.gov/26178327/
23. Grgic 2018, cafeína: https://pmc.ncbi.nlm.nih.gov/articles/PMC5839013/
24. Guest 2021: https://pubmed.ncbi.nlm.nih.gov/33388079/
25. Davies 2018, proteína: https://pmc.ncbi.nlm.nih.gov/articles/PMC5852797/
26. Pearson 2023: https://pmc.ncbi.nlm.nih.gov/articles/PMC10393778/
27. Barnes 2010: https://pubmed.ncbi.nlm.nih.gov/19230764/
28. Morán-Navarro 2017: https://pubmed.ncbi.nlm.nih.gov/28965198/
29. Belcher 2019: https://pubmed.ncbi.nlm.nih.gov/30779596/
30. Bartolomei 2017: https://pubmed.ncbi.nlm.nih.gov/28447186/
31. Pareja-Blanco 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6473797/
32. Thomas 2018: https://pubmed.ncbi.nlm.nih.gov/30067591/
33. Raastad y Hallén 2000: https://pubmed.ncbi.nlm.nih.gov/10929214/
34. Korak 2015: https://digitalcommons.wku.edu/ijes/vol8/iss1/10
35. Soares 2015: https://pubmed.ncbi.nlm.nih.gov/25807025/
36. Refalo 2023: https://pmc.ncbi.nlm.nih.gov/articles/PMC9908800/
37. Vieira 2022: https://pubmed.ncbi.nlm.nih.gov/34881412/
38. Davies 2018, por sexo: https://pmc.ncbi.nlm.nih.gov/articles/PMC6206044/
39. Chen TC 2011: https://pubmed.ncbi.nlm.nih.gov/20852880/
40. Newton 2008: https://pubmed.ncbi.nlm.nih.gov/18550979/
41. Nosaka 2001: https://pubmed.ncbi.nlm.nih.gov/11528337/
42. Paulsen 2012: https://pubmed.ncbi.nlm.nih.gov/22876722/
43. Pelland 2026: https://pubmed.ncbi.nlm.nih.gov/41343037/
44. Grgic 2018, frecuencia: https://pubmed.ncbi.nlm.nih.gov/29470825/
45. ACSM 2026: https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years
46. Chen JL 2011: https://pubmed.ncbi.nlm.nih.gov/21273908/
47. Impellizzeri 2020: https://pubmed.ncbi.nlm.nih.gov/32502973/
48. Impellizzeri 2021: https://pubmed.ncbi.nlm.nih.gov/33332011/
49. Lolli 2019: https://pubmed.ncbi.nlm.nih.gov/29101104/
50. Scott 2016: https://pubmed.ncbi.nlm.nih.gov/26780346/
51. Busso 1990: https://link.springer.com/article/10.1007/BF00636228
52. Marchal 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC11779798/
53. Vermeire 2022: https://pubmed.ncbi.nlm.nih.gov/35320776/
54. Stephens Hemingway 2020: https://rgu-repository.worktribe.com/OutputFile/691845
55. Bittencourt 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11685108/
56. Addleman 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/
57. Hickmott 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC8762534/
58. Helms 2017: https://pubmed.ncbi.nlm.nih.gov/27243918/
59. Zourdos 2016: https://pubmed.ncbi.nlm.nih.gov/26049792/
60. Halperin 2022: https://pubmed.ncbi.nlm.nih.gov/34542869/
61. Travis 2020: https://pmc.ncbi.nlm.nih.gov/articles/PMC7552788/
62. Pritchard 2018: https://pubmed.ncbi.nlm.nih.gov/29369954/
63. Weiss 2004: https://pubmed.ncbi.nlm.nih.gov/15574080/
64. Laurent 2011: https://pubmed.ncbi.nlm.nih.gov/20581704/
65. Saw 2016: https://pubmed.ncbi.nlm.nih.gov/26423706/
66. Doherty 2025: https://doi.org/10.1515/teb-2025-0001
72. Grgic 2020: https://pmc.ncbi.nlm.nih.gov/articles/PMC7367986/
73. Hecksteden 2017: https://pubmed.ncbi.nlm.nih.gov/27967274/
74. Hecksteden 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC8970347/
75. Efron y Morris 1975: https://www.medicine.mcgill.ca/epidemiology/hanley/bios602/MultilevelData/EfronMorrisJASA1975.pdf
76. Peduzzi 1996: https://pubmed.ncbi.nlm.nih.gov/8970487/
77. van Smeden 2019: https://pubmed.ncbi.nlm.nih.gov/29966490/
78. Riley 2020: https://www.bmj.com/content/368/bmj.m441
79. Van Calster 2019: https://pubmed.ncbi.nlm.nih.gov/31842878/
80. van der Bles 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6549952/
81. Hopkins 2000: https://statistics.sportsci.org/resource/stats/Hopkins_SportsMed_rely_00.pdf
83. Latella 2020: https://pmc.ncbi.nlm.nih.gov/articles/PMC7448836/
84. Reynolds 2006: https://pubmed.ncbi.nlm.nih.gov/16937972/
