# La sección de Ascent: recuperación, fatiga, fuerza y estancamiento

*Estudio de la evidencia del 5/11/2026. Es la propuesta para aprobar de la galería (sección 7, «Ascent en
Progreso»); la app todavía usa `recuperacion()` de `entrenamiento.ts`, detrás de `CON_ASCENT` apagada.*

*Lo que leí de Moss (rama `mejoras-1.1`, commit `134c873`; `src/dominio/` no tiene cambios sin guardar):
`recuperado.ts`, `fatiga.ts`, `musculos.ts`, `rendimiento.ts`, `estancados.ts`, `entrenamiento.ts`,
`diagnostico.ts`, `alrededorDelEntreno.ts`, `conAscent.ts`, `src/secciones/ascent/calculos.ts`,
`galeria/src/ascent.js`, `galeria/src/datos.js` (los días de ejemplo) y los textos `ascent.*` de
`src/textos/es.json`; `spec/rendimiento.md`, `spec/ascent.md` («Qué lee cada app de la otra», «Cada función
conectada», «Ascent en Progreso») y `spec/entreno.md`; de Ascent, `nucleo/estancamiento.ts`. Las fuentes son
72, todas abiertas y leídas (12 con el texto entero o en buena parte; las demás, el resumen). Las cuentas
propias están en el Anexo y en `scratchpad/estudio/calc/` (Node, sin dependencias): son ilustraciones con
supuestos explícitos, no evidencia.*

---

## 1. Resumen

1. **El «Estás 87 % recuperado» no se sostiene.** Ningún puntaje compuesto de «recuperación» está validado
   contra el rendimiento (Doherty 2025, sobre los de relojes y anillos: su validez, su transparencia y su
   relevancia fisiológica «no están claras»). Los pesos 40/40/20 son una convención y las franjas 85/70/50 son
   las de Oura, que las usa con la variabilidad, el pulso y la temperatura contra la línea de base de cada uno.
   Además la suma compensa: con la cuenta de `recuperado.ts`, el **97 %** de las combinaciones con noches de
   4 h 30 a 6 h dan «Bien» o «Muy bien» (ninguna da «Atención»), y quien durmió 8 h pero no anotó la comida de
   ayer baja a 77.
2. **Lo mejor estudiado es el sueño corto, y el número lo diluye.** Con 6 h o menos, la fuerza baja un 2,85 % y
   las repeticiones un 9,85 % (Craven 2022, 77 estudios); despertarse antes pesa más que acostarse tarde (Kong
   2025: −0,57 DE en la fuerza máxima). Se sostienen los dos números, fuerza y repeticiones, y el «sin ir al
   fallo» después de una noche corta. No se sostienen la calidad de la noche como la mitad del sueño (el 98 % de
   los estudios midió solo la cantidad) ni los multiplicadores del rendimiento esperado.
3. **La fatiga por músculo: la idea sí, el número no.** Que la fatiga crece con las series y con el fallo, y que
   la sentadilla pesada tarda más que la banca, lo muestran ensayos chicos. Pero el modelo erra hasta 7 puntos
   contra esos mismos estudios, «listo en ~10 h» y «fatiga 2 %» son precisión falsa, y la cuenta salta de 69 a
   107 h al pasar de 9 a 10 series. En la app, ni el fallo ni el novato llegan nunca a la cuenta.
4. **La probabilidad de marca está refutada.** Ningún estudio predice días de marca. La cuenta sale de la mejor
   serie de 3 semanas, que es alta por azar: en una simulación con el ruido de los estudios, cuando dice 49 %, la
   marca sale el 15 % de las veces, y acierta menos que decir «haces marca en 1 de cada 7 sesiones» (Brier 0,183
   contra 0,135).
5. **«Estancado» con 3 semanas es casi todo ruido.** La fuerza varía un 3,3 % de un día a otro (Grgic 2020) y
   un levantador intermedio sube del orden de 1 % por mes (Latella 2020). Con la regla de Moss (`conAscent.ts`:
   3 semanas sin superar la mejor marca), a quien sube un 1 % por mes le dice «estancado» el 63 % de las veces
   (el 38 % con las 6 semanas de Ascent). La tendencia de 12 semanas con su rango baja eso al 15 % y, cuando no
   alcanza, dice «todavía no se sabe».
6. **Las razones de estancamiento están ordenadas al revés.** Lo más sólido es la dosis: las series duras por
   semana y, para la fuerza, la frecuencia y la carga pesada (Pelland 2026; Lopez 2021; ACSM 2026). Moss tiene
   esos datos y no los calcula. El déficit casi no frena la fuerza (Murphy y Koehler 2022), el fallo no hace
   falta (Grgic 2022) y la proteína se compara con ~1,6 g/kg/día (Morton 2018), no con la de otra semana.
7. **La comida.** La de ayer no tiene efecto demostrado en la fuerza de hoy: sale de cualquier puntaje. Antes de
   sesiones de más de 45 min o después de 8 h sin comer, los carbohidratos sí suben el volumen (King 2022), y en
   la proteína lo que pesa es el total del día (Schoenfeld 2013). El corte del café es corto (Gardiner 2023: 8,8 h
   para un café y 13,2 para un preentreno), y para «terminar 2 h antes de dormir» las fuentes se contradicen.
8. **Qué mostrar:** datos con su rango y la palabra justa (las horas dormidas, el músculo en palabras y en días,
   las series de la semana, la tendencia de cada ejercicio con su rango, cada cuánto haces marca) y «todavía no
   se puede saber» cuando faltan datos. Lo que más mejoraría todo cuesta un toque: «¿Cómo te sientes para
   entrenar?» (Laurent 2011; Tolusso 2022: r de 0,80 a 0,84 con la velocidad y el salto). En Ascent, sumaría la
   reserva opcional de la serie más pesada y «Lo intenté y no salió».
9. **Hay arreglos claros, se decida lo que se decida:** la comida sin anotar no puede valer 0, el salto en 10
   series, `entrenado: true` y `ayuno8h: false` fijos, el 1RM de una repetición (Moss le suma un 3,3 % y Ascent
   no), las 3 semanas, el corte del café y tres textos que citan mal sus fuentes.

---

## 2. Tabla de veredictos

MA es metaanálisis; RS, revisión sistemática; MR, meta-regresión; ECA, ensayo aleatorizado; n, personas; DE,
desviación estándar; n.s., no significativo. «Cuenta propia» remite al Anexo.

| Qué calcula Moss | Dónde (archivo:línea) | Veredicto | La mejor evidencia (autor, año, tipo, n) | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| «Estás X % recuperado»: sueño 40 + músculos 40 + comida 20 | `src/dominio/recuperado.ts:11, 96-123`; galería `cabezaRecuperado()` | **Refutado** | Doherty 2025 (evaluación de los puntajes compuestos de los relojes; solo el resumen): validez, transparencia y relevancia fisiológica «no claras». Saw 2016 (RS, 56 estudios): lo que la persona siente responde a la carga mejor que las medidas objetivas. No encontré ningún puntaje validado contra el rendimiento. Cuenta propia (A2): con noches de 4 h 30 a 6 h, el 97 % de las combinaciones da «Bien» o «Muy bien» | Sin porcentaje: un titular que sale del factor más flojo (no de una suma) y tres filas con sus datos (3.1 A) | La noche, los músculos de hoy y, si se agrega, cómo te sientes | Sí, salvo cómo te sientes |
| Los pesos 40/40/20 | `recuperado.ts:11` | **Convención** | Ninguna fuente da pesos. Oura no publica los suyos (su página) y Doherty 2025 señala la falta de transparencia de estos puntajes | No sumar cosas con unidades distintas | — | — |
| Las franjas: 85, 70 y 50 en el total; 34/26/18 de 40 en el sueño; 17/13/9 de 20 en la comida | `recuperado.ts:27-32` | **Convención (prestada)** | Son las de Oura (85-100 «óptimo», 70-84 «bien», 60-69 «regular»; su página), que salen del pulso, la variabilidad y la temperatura contra la línea de base de cada uno. Las de las partes ni son proporcionales a las del total (18/26/34 contra 20/28/34) | Palabras con reglas a la vista, sin cortes de un puntaje | — | — |
| Sueño: 20 × lo dormido sobre lo que necesitas | `recuperado.ts:62-66` | **A medias** | Craven 2022 (MA, 77 estudios, 959 personas, 89 % hombres; define la pérdida como ≤ 6 h): fuerza −2,85 % (IC −4,47 a −1,23), repeticiones −9,85 % (−19,6 a −0,13); despertarse antes −7,39 %, acostarse tarde −5,85 % (n.s.); ~−0,4 % por hora despierto. Kong 2025 (MA, 45 estudios, 670): fuerza máxima −0,24 DE; despertándose antes, −0,57 DE | El umbral de los estudios y no una recta: normal hasta 1 h por debajo de lo que necesitas; corta con 6 h o menos o despertándote 1 h o más antes de lo de siempre; muy corta con 4 h 30 o menos | Duración y hora de despertar | Sí |
| La calidad de la noche como la mitad del sueño; sin calidad, 50 | `recuperado.ts:15, 65`; `entrenamiento.ts:170-174` | **Refutado** (como peso) | Craven 2022: el 98 % de los resultados midió solo la cantidad, así que la calidad no se pudo analizar. «Registra cómo dormiste: así puede llegar a 40» (`es.json:2771`) premia anotar, no dormir | La calidad como dato, fuera de cualquier puntaje | — | — |
| Comida de ayer, 20: 10 por la proteína contra la meta y 10 por haber comido el 80 % de las calorías | `recuperado.ts:73-77` | **Refutado** para el rendimiento de hoy; **a medias** para recuperar la fuerza después de una sesión que daña | Pearson 2023 (MA, 29 estudios de suplementos alrededor de ejercicio que daña): la fuerza se recupera algo mejor (g de 0,45 a 0,64 entre las 24 y las 96 h). Davies 2018 (MA, 13 ECA, suero de leche): efecto chico a medio, y beneficio en solo la mitad de los estudios. Schoenfeld 2013 (MA): ajustando por el total del día, el momento no importa. Sobre el 80 % de las calorías de un día, no hay nada | La proteína como promedio diario en g/kg, para progresar y no para hoy; y lo de comer antes de entrenar | Lo anotado | Sí |
| Sin comida anotada ayer, la parte vale 0 | `recuperado.ts:73-77` (no mira si hubo registro) | **Error** | La propia spec: «que no haya registro no quiere decir que no comiste» (`spec/rendimiento.md`, C) | Sin registro, «sin dato» | — | — |
| Qué conviene: con «muy bien», «puedes ir fuerte»; con «atención», «suave» | `recuperado.ts:120`; `diagnostico.ts:196-204`; `es.json:2696, 2736, 2798` | **A medias** | «Sin ir al fallo» después de una noche corta se sostiene: Knowles 2022 (ECA cruzado, 10 mujeres entrenadas, 9 noches de 5 h en la cama): −15 % de velocidad en piernas y +11 % de esfuerzo percibido; Kong 2025: esfuerzo percibido +0,51 DE; Grgic 2022 (MA, 15 estudios): para la fuerza no hace falta ir al fallo. «Puedes ir un poco más fuerte» sale de un puntaje no validado: no hay evidencia | Reglas por factor: con la noche corta, sin fallo; con el músculo cargado, más liviano u otra cosa; con todo bien, como siempre | — | — |
| τ por músculo: 18 h en el tren superior y 36 h en las piernas y la espalda baja | `musculos.ts:22-25` | **A medias** | Belcher 2019 (12 hombres muy entrenados, 4 series al fallo al 80 %): la sentadilla siguió más lenta hasta las 72 h (−8,6 %), la banca solo cayó justo después y el peso muerto, nada. Korak 2015 (10): a las 24 h, −1,7 repeticiones en los multiarticulares y −0,5 en los monoarticulares; a las 48 h, el 80 % estaba a una repetición o menos de lo suyo. Chen 2011 (17 sedentarios, excéntricos máximos): los brazos se dañan más que las piernas. Lo lento es el multiarticular pesado de piernas, no el tamaño del músculo | Mantener las dos constantes como punto de partida, pero hablar en días y no en horas | — | — |
| τ × 1,5 con una serie al fallo o con 10 series duras o más | `musculos.ts:156` | **A medias, y con un error** | Morán-Navarro 2017 (10 entrenados): sin llegar al fallo, la recuperación es más rápida entre las 24 y las 48 h. Vieira 2022 (MA, 12 estudios): al fallo, más fatiga aguda (DE −0,96). Bartolomei 2017 (12): con 8 × 10, la fuerza isométrica seguía baja a las 72 h; con 8 × 3, no. Pero el salto es de golpe (con 9 series de piernas, listo en 69 h; con 10, en 107 h) y `alFallo` nunca llega de Ascent (`conAscent.ts:56-62`) | Que τ crezca de a poco con las series, por ejemplo de ×1 con 6 a ×1,5 con 12 | La marca de «al fallo» en Ascent | No |
| Novato: τ y caída × 1,5 | `musculos.ts:156-157`; nunca se pasa (`calculos.ts:164`) | **Se sostiene la idea, pero no se aplica** | Newton 2008 (15 entrenados y 15 no entrenados): los entrenados recuperan la fuerza en 3 días y los otros siguen ~40 % abajo. Nosaka 2001 (35): la protección dura 6 meses o más y se pierde entre los 9 y los 12 | Calcularlo con la historia de Ascent (primera sesión hace menos de 6 meses) o preguntarlo | Cuánto hace que entrenas | Casi: la fecha de la primera sesión |
| La caída inicial, 30 % × (1 − e^(−D/8)); recuperado por debajo del 3 %, cargado por encima del 10 % | `musculos.ts:141, 164` | **A medias** | Contra los estudios, el modelo erra hasta 7 puntos a las 24-72 h, para los dos lados (A1). El 3 % se sostiene como «por debajo del ruido» (Grgic 2020: CV del 1RM de 3,3 % en entrenados); el 10 % es convención | Usarlo por dentro, para elegir la palabra y el día | Series, repeticiones, kilos y hora | Sí |
| «Listo en ~10 h», «fatiga 2 %» y las barras de 0 a 15 % | `musculos.ts:167-171`; `fatiga.ts:20-24`; galería `filaFatiga()` y `filaDeMusculo()` | **Refutado** (como precisión) | Los mismos estudios: la recuperación varía mucho entre personas (Davies 2018, 19 entrenados: a las 24 h el salto cayó −20 % en las mujeres y −10 % en los hombres) y según lo que se mida (velocidad, salto o fuerza) | «Hoy», «mañana», «pasado mañana» o «en unos días», con «probablemente» | — | — |
| El esfuerzo de cada serie, con las repeticiones en reserva estimadas con Epley: 1, 0,6 o 0,3 | `musculos.ts:96-102` | **Convención, con un error grande** | Nuzzo 2024 (MR, 269 estudios, 7289 personas): al 80 % del 1RM salen ~9 repeticiones en banca y ~13 en prensa, con una DE entre personas de 2,5: el error tiene el tamaño de los cortes. Halperin 2022 (MA, 12 estudios, 414): la gente cree que le quedan ~1 repetición menos de las que le quedan | Contar como dura toda serie de trabajo (60 % del e1RM o más) y usar la reserva solo si Ascent la anota | La reserva (RIR) o el esfuerzo (RPE) | No |
| El 1RM estimado con Epley, hasta 10 repeticiones | `musculos.ts:89`; `conAscent.ts:155` | **Se sostiene para la tendencia propia; a medias como 1RM** | Reynolds 2006 (70 personas): el 5RM predice el 1RM mejor que el 10RM y el 20RM, y no hay que pasar de 10 repeticiones. Cuenta propia (A5): entre 3 y 5 repeticiones, Epley y Brzycki difieren hasta un 4 %, más que el ruido de cada día. **Error:** con una repetición, `musculos.ts` da el peso × 1,033 y Ascent da el peso | La tendencia del e1RM dentro del mismo rango de repeticiones; el número, redondeado y «aprox.» | Las repeticiones de cada serie | Sí (opcionales en Ascent) |
| El rendimiento esperado, Δ = S + D + Q + C + M + T, en dos números con ± σ | `rendimiento.ts:80-169`; `es.json:2804` | **A medias** | S y D: la dirección y el tamaño salen de Craven 2022, Kong 2025, Knowles 2018 (RS, 17 estudios: varias noches cortas bajan los multiarticulares y no los monoarticulares) y Reilly y Piercy 1994 (8 hombres, 3 noches de 3 h). Los multiplicadores (×1,5, ×1,2 y ×1,6) salen de subgrupos con intervalos que cruzan el cero; Q, M y casi todo C son derivados o no tienen evidencia, y se suman como si fueran independientes. El «± 3,3 %» es el ruido del 1RM, no el error del modelo | Una sola línea, solo con la noche corta: «la fuerza máxima casi no cambia; las repeticiones pueden costar más» | La noche | Sí |
| C: llegar con 8 h sin comer, menos de 3 g/kg de carbohidratos ayer, bajar más de un 1 % por semana y menos del 80 % de las calorías ayer | `rendimiento.ts:116-123`; `calculos.ts:216` | El ayuno **se sostiene**, pero nunca se calcula (`ayuno8h` es siempre `false`); los carbohidratos de ayer, **refutado**; bajar rápido, **refutado** para el día; el 80 % de un día, **sin evidencia** | King 2022 (MA, 21 estudios, 226): después de 8 h o más sin comer, volumen +0,39 DE. Henselmans 2022 (RS, 49 estudios): ninguno de los 7 de 2 a 7 días encontró efecto. Murphy y Koehler 2022: el déficit no frena la fuerza (ES −0,31, p = 0,28); Garthe 2011 es sobre la masa magra a lo largo de semanas, no sobre el día | Dejar solo el ayuno, y solo si esa comida se suele anotar | La hora de la última comida | A veces |
| T, la descarga: +2 % | `rendimiento.ts:132-137` | **A medias** | Travis 2020 (revisión, estudios chicos): una puesta a punto de 1 a 2 semanas, con el volumen 30-50 % abajo, la intensidad en el 85 % o más y 2 a 7 días sin entrenar al final, sube la sentadilla de +1,7 a +9,5 % y la banca de +1,4 a +6,4 %. Coleman 2024 (ECA, 39 entrenados): una semana sin entrenar en la mitad de un programa de 9 dejó menos fuerza ganada en las piernas. Una semana floja por un viaje no es una puesta a punto | No sumar nada; si la persona marca una puesta a punto en Ascent, decirlo | Saber que fue a propósito | No |
| σ de 3,3 % entrenado y 5,5 % novato; tu σ, con el peso de 10 sesiones | `rendimiento.ts:13, 252-257`; `calculos.ts:230` | **Se sostiene, con un error** | Grgic 2020 (RS, 32 estudios, 1595 personas): CV mediano del 1RM de 4,2 %; 3,3 % en entrenados y 5,5 % en no entrenados. **Error:** `entrenado: true` está fijo | Tu σ con los residuos de tu tendencia (el error típico de Hopkins 2000), acercado al de los estudios | El e1RM de cada sesión | Sí |
| «Buen día para intentar marca»: P = 1 − Φ((g − Δmáx)/σ), avisa desde el 35 % | `rendimiento.ts:179-218`; `diagnostico.ts:268-270`; galería `parteMarcas()` | **Refutado** (como probabilidad) | Ningún estudio predice días de marca (lo dice `spec/rendimiento.md` y no encontré ninguno). Van Calster 2019: una probabilidad mal calibrada engaña. Cuenta propia (A4): como g sale de la mejor serie de 3 semanas, P queda alta por azar; con un progreso de 1 % por mes, el 49 % que da cuando estás «en tu marca» se cumple el 15 % de las veces, y su Brier (0,183) es peor que decir la frecuencia de siempre (0,135) | Sin %: «Estás cerca de tu marca» (el nivel de tu tendencia a menos de tu ruido de la marca), las condiciones y «haces marca en 1 de cada N sesiones» | Los intentos que no salieron | No |
| «Seguridad» y «probabilidad tuya» (los 8 días más parecidos, Efron y Morris) | `rendimiento.ts:227-246` | **Convención** (no se puede validar con estos datos) | Las marcas que no salen no se anotan: aprende de los días que entrenaste, no de los que intentaste (lo dice la spec). Con marcas en el 10 a 20 % de las sesiones, 8 días parecidos traen 1 o 2 | No mostrarla hasta tener intentos fallidos y 15 marcas o más | «Lo intenté y no salió» | No |
| Estancado: la mejor marca tiene 3 semanas o más y después hubo otra | `conAscent.ts:151, 167-181` (Ascent, `nucleo/estancamiento.ts`: umbral de 2, 3, 6 u 8 semanas; 6 de fábrica) | **Refutado con 3 semanas; a medias con 6** | Grgic 2020 (el ruido de 3,3 %). Latella 2020 (1897 powerlifters): el total sube ~0,15 kg por día en los hombres (≈ 0,9 % por mes con el total medio, cuenta propia), y los más fuertes, la mitad que los más débiles. Cuenta propia (A3): si de verdad subes un 1 % por mes, con 3 semanas dice «estancado» el 63 % de las veces; con 6, el 38 % | La tendencia de 8 a 12 semanas con su rango: «sube», «sin subida clara» o «todavía no se sabe» (3.1 C) | El e1RM de cada sesión | Sí |
| Razones: el sueño, la proteína y el balance de las semanas en que subía contra las de ahora (escalas de 45 min, 15 g y 250 kcal) | `entrenamiento.ts:229-276`; `estancados.ts:57-70` | **A medias / convención** | Proteína: Morton 2018 (MA, 49 ECA, 1863): la ganancia se aplana en 1,62 g/kg/día (IC 1,03 a 2,20; el corte no fue significativo, p = 0,079): importa estar por debajo, no la diferencia entre semanas. Balance: Murphy y Koehler 2022 (el déficit frena la masa magra, ES −0,57, pero no la fuerza, −0,31 n.s.), y además sale de lo anotado menos un gasto estimado, con mucho error. Sueño: no hay ensayos de meses de sueño corto y fuerza (Knowles 2018). Las escalas y los mínimos (3 semanas de cada lado) son convención | La proteína contra ~1,6 g/kg/día; el ritmo de bajada por el peso (más de 0,7 a 1 % por semana: Garthe 2011, 24 deportistas); el sueño, como «puede influir» | Peso, lo anotado y las noches | Sí |
| Razón «poco descanso entre sesiones»: cargado en la mitad o más de 3 sesiones o más | `estancados.ts:72-75` | **Convención** | Sale del modelo derivado. Grgic 2018 (MA, 22 estudios): con el volumen igualado, la frecuencia no cambia la fuerza; ACSM 2026: 2 sesiones por semana o más | Una pista de confianza baja, o sacarla | — | — |
| Razón «lo entrenas menos seguido»: dos tercios o menos | `estancados.ts:77-79` | **Se sostiene la idea** | Pelland 2026 (MA, 67 estudios, 2058): la fuerza sube con el volumen y, en la fuerza, también con la frecuencia, cada vez menos | Medirlo en series duras por semana del músculo, no en veces | Series | Sí |
| Razón «tus sesiones se achicaron»: un 25 % menos | `estancados.ts:80-82` | **A medias** | Es un reflejo del volumen; el descanso entre series importa poco: Grgic 2018 (RS, 23 estudios, 491): más de 2 min en entrenados; Singer 2024 (MA, 9 estudios, hipertrofia): un beneficio chico al pasar de 60 s y ninguna diferencia más allá de 90 s; ACSM 2026: el descanso no cambió la fuerza | Las series por semana, no los minutos | Series | Sí |
| Razón «estás en definición» | `estancados.ts:55` | **Se sostiene** | Murphy y Koehler 2022 | Igual, con el ritmo de bajada | Peso | Sí |
| Lo que no calcula: las series duras por semana y las series pesadas | — | **Falta** | Pelland 2026 (contar la mitad las series que ayudan fue lo que mejor ajustó, como hace Moss); Lopez 2021 (MA en red, 28 estudios, 747: para la fuerza, la carga alta le gana a la baja, DE 0,60 a 0,63); ACSM 2026 (137 revisiones, más de 30.000 personas: la fuerza sube más con el 80 % del 1RM o más, 2 a 3 series y 2 veces por semana o más) | Las series duras por músculo y por semana, y cuántas son pesadas (80 % del e1RM o más, o 6 repeticiones o menos) | Series, kilos y repeticiones | Sí |
| Carbohidratos antes, ≈ 1 g/kg, en la fuerza de más de 45 min o con 10 series por músculo | `alrededorDelEntreno.ts:115-116, 138-143` | **Se sostiene** (a medias en quien ya comió) | King 2022: volumen +0,61 DE; +1,02 en sesiones de más de 45 min; +0,39 después de 8 h o más sin comer. Henselmans 2022: comiendo normal y con hasta 10 series por músculo, «improbable» | Igual | El horario y lo anotado | Sí |
| Proteína por comida, 0,3 g/kg (20 a 40 g), y el total del día | `alrededorDelEntreno.ts:124-131` | **Se sostiene** | Schoenfeld 2013 (MA: 20 estudios de fuerza y 23 de hipertrofia): ajustando por el total, el momento no importa. Macnaughton 2016 (30 entrenados; lo pagó GSK): 40 g dan más síntesis que 20 después de entrenar todo el cuerpo. Trommelen 2023: no hay un techo por comida | Igual | — | Sí |
| Proteína extra el día de entrenamiento, hasta 2,2 g/kg | `entrenamiento.ts:124-148` | **Convención** (inofensiva) | Morton 2018: 2,2 es el borde de arriba del intervalo, que los autores proponen «por prudencia»; el corte no fue significativo; uno de ellos recibió fondos del National Dairy Council de EE. UU., que pagó ensayos incluidos | Una meta fija de 1,6 a 2,2 g/kg/día alcanza | — | — |
| Café: hasta 8 h antes de dormir con 200 mg o menos, y 12 h con más | `alrededorDelEntreno.ts:99-101`; `es.json:2901` | **A medias** (queda corto) | Gardiner 2023 (MA, 24 estudios): la cafeína quitó 45 min de sueño en promedio; un café (107 mg), por lo menos 8,8 h antes de acostarse; un preentreno (217,5 mg), 13,2 h | 9 h hasta unos 110 mg y 13 h con más | La cafeína anotada | Sí |
| Terminar lo fuerte 2 h antes de dormir | `diagnostico.ts:160`; `es.json:2901` | **A medias** (las fuentes se contradicen) | Frimpong 2021 (MA de experimentos, 15 estudios, 194): lo intenso entre 2 y 4 h antes de acostarse no cambia el sueño. Leota 2025 (observacional, 14.689 usuarios de WHOOP; dos autores cobran de WHOOP): lo más intenso que termina 2 h antes se asocia a dormirse 36 min más tarde; desde 4 h antes, nada | «Mejor 4 h antes; si no se puede, por lo menos 2», citando a los dos | Hora de dormir y de la sesión | Sí |
| La recuperación que usa la app hoy: la carga de 3 días contra la de 4 semanas | `entrenamiento.ts:196-210`; `conAscent.ts:136-146` | **Refutado** | Es una razón aguda:crónica. Impellizzeri 2020 (análisis conceptual) e Impellizzeri 2021 (reanálisis): solo reescala la carga aguda, discrimina 0,574 contra 0,544 de la carga sola y piden dejarla | Reemplazarla (la propuesta ya lo hace) | — | — |

---

## 3. Cambios propuestos

### 3.1 Qué calcular y cómo (la propuesta entera, para decidir)

Todo lo nuevo va primero a la galería, con los días de ejemplo, y con la regla pura en `src/dominio/` (en
`DEL_DOMINIO` de `galeria/construir.mjs`) y los textos en `es.json` y `en.json`.

**A. El titular del día, sin porcentaje** (reemplaza a `recuperado()`; en `recuperado.ts` o en un `preparado.ts`
nuevo). Sigue la regla del eslabón más débil: el primer caso que se cumple manda, y nada lo compensa.

```ts
titularDeHoy({ noche, ultimas3, despertoAntes, musculoDeHoy, sesion, comoTeSientes }):
  la sesión de hoy ya está anotada        → 'hecha'       «Ya entrenaste piernas: probablemente listas pasado mañana»
  sin sesión hoy                          → 'descanso'    «Hoy descansas · Piernas: listas mañana»
  sin noche (ni de Salud ni dicha)        → 'faltaNoche'  «Anota cómo dormiste»
  musculoDeHoy.estado === 'cargado'       → 'cargado'     «Lo que entrenas hoy todavía está cansado: más liviano u otra cosa»
  noche ≤ 6 h, o te despertaste ≥ 1 h antes,
    o 2 de las últimas 3 noches ≤ 6 h     → 'suenoCorto'  «Puedes entrenar. Dormiste poco: sin ir al fallo; las repeticiones pueden costar más»
  comoTeSientes ≤ 4 (de 0 a 10)           → 'teSientes'   «Dijiste que no te sientes recuperado: escúchalo»
  musculoDeHoy.estado === 'recuperandose' → 'casi'        «Entrena como siempre · Piernas todavía se recuperan»
  si no                                   → 'listo'       «Listo para tu sesión de piernas»
```

- **Por qué esos cortes:** 6 h es la definición de pérdida de sueño de Craven 2022; despertarse antes es lo que
  más pesa (Craven 2022; Kong 2025); dos de tres noches cortas, por Knowles 2018 y Reilly y Piercy 1994. El 4 de
  10 es convención (la mitad baja de la escala de Laurent 2011). El orden pone primero lo que hoy cambia la
  sesión.
- **Debajo, tres filas con datos y sin puntos:** «Sueño: 5 h 50 de las ~8 h que necesitas · te despertaste 1 h
  20 antes» (la calidad, si la hay, como dato); «Músculos de hoy: piernas descansadas · última vez el martes, 12
  series»; «Comida: ayer, 140 de 150 g de proteína», y la línea de antes de entrenar de `alrededorDelEntreno.ts`.
- **El error esperado:** cada corte tiene detrás un efecto promedio medido; el conjunto no está validado y la
  respuesta de cada persona varía. Por eso se presenta como orientativo, y la pregunta de cómo te sientes deja
  que la persona corrija.
- **Ascent:** `moss.recuperacion(fecha)`, que todavía no está escrita, devuelve `{ titular, filas }` en lugar de
  un número, y Ascent muestra lo mismo. La órbita de la entrada de Progreso («82 % recuperado») pasa a mostrar el
  titular.

**B. Los músculos.** `residual()` queda por dentro, con tres arreglos (3.2), y lo que se muestra es:
- el estado en palabras: descansado (menos del 3 %), recuperándose (de 3 a 10 %) o cargado (más del 10 %);
- cuándo, en días: `Math.ceil(listoEn / 24)` se dice «hoy», «mañana», «pasado mañana» o «en unos días», con
  «probablemente»;
- lo que hiciste: «12 series el martes» (las del músculo como principal);
- siempre «según tus series en Ascent; el dolor no cuenta» (Soares 2015: después del remo, la fuerza volvió a las
  24 h y el dolor tardó hasta 72 h en irse). El error esperado es de más o menos un día (A1).

**C. La fuerza: la tendencia de cada ejercicio con su rango** (`src/dominio/fuerza.ts`, nuevo):

```ts
// Para cada ejercicio con 6 sesiones o más en las últimas 12 semanas (y por lo menos 6 semanas de historia):
y_i = ln(e1RM de la mejor serie de 1 a 10 repeticiones de la sesión i)   // Epley; con 1 repetición, el peso
y = a + b·t   (mínimos cuadrados; t en semanas)                         // o Theil-Sen, más robusto
σ_tuyo = DE de los residuos, acercada a 3,3 % (5,5 % con < 6 meses) con el peso de 10 sesiones   // sigmaTuyo()
IC80(b) = b ± 1,2816 · EE(b)
por mes = (e^(4,35·b) − 1) · 100
'sube'           si el borde de abajo > 0
'sinSubidaClara' si el borde de arriba < +0,3 % por semana
'noSeSabe'       si no
```

- **Cómo se dice:** «Sentadilla: sube, ~+1 % por mes (entre +0,2 y +1,8) · 9 sesiones en 12 semanas»; «Press
  banca: sin subida clara en 12 semanas»; «Peso muerto: todavía no se sabe (5 sesiones)».
- **El error esperado:** con una sesión por semana, 12 semanas y un ruido de 3,3 %, si subes un 1 % por mes
  dice «sin subida clara» el 15 % de las veces (la regla de 3 semanas, el 63 %); si no subes, dice «sube» el
  12 % (A3). Con dos sesiones por semana, mejora mucho. Con el ruido de un e1RM de series submáximas (~5 %),
  dice «todavía no se sabe» más seguido, que es lo honesto.

**D. La marca, sin probabilidad:**
- el nivel de hoy sale de la tendencia de C (a + b·t de hoy), no de la mejor serie de 3 semanas;
- «Cerca de tu marca» si ln(marca) − nivel ≤ σ_tuyo (3 a 4 %), con las condiciones en una lista: dormiste más
  de 6 h y no te despertaste antes, los músculos del ejercicio descansados y una semana sin más series que de
  costumbre;
- la frecuencia de siempre, que es lo que más acierta (A4): «En sentadilla hiciste marca en 3 de tus últimas 20
  sesiones»;
- la regla de la entrada en calor: «Si tu serie de aproximación de siempre se siente más pesada, déjalo para
  otro día». El esfuerzo que se siente acompaña a la velocidad de la barra (Helms 2017: r de −0,79 a −0,87 en
  15 powerlifters); usarlo con la serie de aproximación es derivado;
- nada de «27 %» ni de la línea del 35 %. Si algún día vuelve una probabilidad, primero se calibra con los
  intentos que no salieron (Van Calster 2019).

**E. El estancamiento y sus razones** (reemplaza a `estancamiento()`, a `porQueNoSube()` y a
`razonesDeEstancamiento()`):
- **Cuándo:** cuando C dice «sin subida clara» con 8 semanas o más, y nunca antes del umbral de Ascent (6 de
  fábrica).
- **Las razones, de la más a la menos sólida.** Cada una entra solo con datos suficientes y si la diferencia
  pasa dos errores estándar de la variación entre semanas de la propia persona:
  1. menos series duras por semana del músculo que en las semanas en que subía (Pelland 2026; Ralston 2017);
  2. menos veces por semana con ese ejercicio o ese músculo (Pelland 2026, en la fuerza);
  3. pocas series pesadas, si buscas fuerza: menos de un tercio con el 80 % del e1RM o más (Lopez 2021; ACSM
     2026). El tercio es convención;
  4. bajando más de un 1 % por semana según la tendencia del peso, o en definición: «que la fuerza se mantenga
     ya es un buen resultado» (Garthe 2011; Murphy y Koehler 2022). Reemplaza al balance de calorías;
  5. la proteína promedio por debajo de 1,6 g/kg/día en esas semanas, con 4 días anotados por semana o más
     (Morton 2018);
  6. el sueño promedio por debajo de 6 h, o 45 min menos que cuando subía: «puede influir; lo que se sabe es de
     días, no de meses» (Knowles 2018);
  7. de contexto y no como causa: «con años de entrenamiento se sube más lento» (Latella 2020).
- **Se sacan:** «comiste más por debajo» (lo reemplaza la 4), «poco descanso entre sesiones» (sale de un modelo
  derivado) y «tus sesiones se achicaron» (la 1 es la dosis de verdad; queda la señal propia de Ascent).
- Siempre «causa probable, no segura», dos o tres como mucho y con los números a la vista.

**F. La comida alrededor del entreno.** Quedan las reglas de `alrededorDelEntreno.ts`, con el corte del café
corregido (3.2) y el «mejor 4 h antes de dormir». La proteína se mira como total del día; la de ayer no va a
ningún titular.

**G. Cómo mostrar la incertidumbre** (vale para todos los textos de la sección):
1. Nada de porcentajes de recuperación, de fatiga ni de probabilidad.
2. Los ritmos, con su rango y con cuántos datos: «~+1 % por mes (entre +0,2 y +1,8) · 9 sesiones».
3. Los tiempos, en días.
4. El e1RM, redondeado a 2,5 kg y con «aprox.».
5. «Todavía no se puede saber» es una respuesta válida, y en los intermedios es la más frecuente (A3).
6. El ruido, a la vista: «Lo normal de un día a otro es ±3 % (el tuyo, ±4 %)».
7. «Según lo que anotaste en Ascent» en cada parte. Mostrar la incertidumbre no tiene por qué bajar la confianza,
   aunque depende de cómo se muestra (van der Bles 2019).

**H. Lo que haría falta de Ascent** (en su repo):
- la reserva opcional (RIR) de la serie más pesada, o una marca de «al fallo»: mejora el e1RM, la dosis y la
  regla de C;
- «Lo intenté y no salió», junto a «¿Lo guardo como marca?»;
- «¿Cómo te sientes para entrenar?», de 0 a 10, al abrir la sesión;
- poder marcar una semana como puesta a punto.

### 3.2 Arreglos claros (no dependen de lo que se decida)

1. **El 1RM de una repetición.** En `musculos.ts:89`, `e1rm(peso, 1)` tiene que dar el peso, como Ascent
   (`nucleo/estancamiento.ts`, `unRm()`) y `conAscent.ts:155`: hoy le suma un 3,3 %, el ruido entero de un día.
   *Test:* `expect(e1rm(100, 1)).toBe(100)`, y `distanciaALaMarca(100, e1rm(97.5, 1))` ≈ 2,56.
2. **La comida sin anotar no vale 0.** En `recuperado.ts:73-77` (si el número queda), sin nada anotado ayer, la
   parte es `null` y no cuenta. *Test:* un día de 8 h con calidad 85, músculos descansados y sin comida anotada
   no da menos de 85.
3. **τ crece de a poco.** En `musculos.ts:156`, en vez de `(d.alFallo || d.series >= 10 ? 1.5 : 1)`, usar
   `Math.max(d.alFallo ? 1.5 : 1, 1 + 0.5 * Math.min(1, Math.max(0, (d.series - 6) / 6)))`. *Test:* con 6 a 14
   series, `listoEn` crece y no salta más de 12 h entre una serie y la siguiente.
4. **Lo que está fijo en la app.** En `calculos.ts:230`, `entrenado: true` sale de la historia de Ascent (la
   primera sesión hace 26 semanas o más), y lo mismo pasa a `novato` en `residual()` (`calculos.ts:164`). En
   `calculos.ts:216`, `ayuno8h: false` se calcula con la última comida anotada cuando esa comida se suele anotar
   (`comidasHabituales()`), o se saca el motivo. *Test (conAscent.test.ts):* con sesiones solo en las últimas 8
   semanas, σ = 5,5.
5. **Las 3 semanas.** `SEMANAS_SIN_SUBIR` (`conAscent.ts:151`) pasa a ser el umbral de Ascent (6 de fábrica).
   *Test:* la mejor marca de hace 4 semanas, con otra después, no da estancado con 6 y sí con 3.
6. **El corte del café.** En `alrededorDelEntreno.ts:99`, 9 h hasta ~110 mg y 13 h con más (Gardiner 2023).
   *Test:* `corteDeCafeina(23 * 60, 95) === 14 * 60` y `corteDeCafeina(23 * 60, 150) === 10 * 60`.
7. **Los textos que citan mal** (`es.json:2901` y su par en inglés). El gramo por kilo antes de la fuerza sale
   de King 2022, no de ACSM 2016, que habla de resistencia de más de 60 min; el café, «unas 9 h antes con un
   café y 13 con un preentreno»; y lo fuerte, «mejor 4 h antes de dormir y por lo menos 2 (Frimpong 2021; Leota
   2025)». *Test:* `npm run typecheck` (las mismas claves).
8. **Lo que premia anotar** (`es.json:2771`): «Registra cómo dormiste: así puede llegar a 40» sube el número sin
   que cambie la recuperación. Se saca, o queda «Si quieres, anota cómo dormiste».
9. **«Puedes ir más fuerte»** (`es.json:2696, 2736, 2798` y `diagnostico.ts:202`): no hay evidencia de que un
   puntaje alto prediga un día mejor. Pasa a «Hoy puedes entrenar como siempre». *Test (diagnostico.test.ts):*
   `comoEntrenar()` ya no devuelve `masFuerte`.

### 3.3 Decisiones del dueño

1. **Sacar el porcentaje** («Estás X % recuperado» y «Llegaste X %») y poner el titular y las tres filas de A.
   - Alternativa, peor: un número que no compense (el mínimo de las partes), con el nombre «orientativo». Sigue
     sin estar validado.
   - *Tests:* los seis días de ejemplo de `galeria/src/datos.js` dan `suenoCorto` (la noche corta), `listo`
     (durmió bien), `hecha` (ya entrenó), `descanso`, `faltaNoche` y `listo` (sin la calidad del sueño); y un test que recorre
     `ascent.*` en `es.json` y `en.json` y falla si algún texto dice «% recuperad» o «% recovered», como el de
     `segunElDeporte.ts` con los suplementos.
2. **«¿Cómo te sientes para entrenar?»,** de 0 a 10. Suma un toque: en Ascent, al abrir la sesión, o en Moss, a
   la mañana, junto a las cinco caras. Es lo mejor validado que hay para la fuerza: Tolusso 2022 (11 entrenados,
   después de 8 × 10 de sentadilla) encontró r = 0,84 con el salto y 0,80 con la velocidad dentro de cada
   persona, pero el mismo número no significa lo mismo en dos personas. Con 20 sesiones o más, Moss puede ver si
   a ti te predice (la correlación con tus residuos de C).
3. **El rendimiento esperado** pasa a ser una línea, solo con la noche corta: «la fuerza máxima casi no cambia;
   las repeticiones pueden costar más (en estudios, ~3 % y ~10 %)». Sin Δ, sin «± 3,3 %» y sin categorías.
   *Test:* devuelve `null` con 7 h y `suenoCorto` con 5 h 50.
4. **Las marcas, sin probabilidad,** como en D. Se dejan sin mostrar «Seguridad» y la probabilidad tuya hasta
   tener «Lo intenté y no salió» y 15 marcas. *Test (si alguna vez vuelve una P):* calibración con datos
   simulados y semilla fija; en cada décimo, la P media a 5 puntos o menos de lo observado.
5. **El estancamiento por tendencia,** como en C y E. *Tests (fuerza.test.ts, con semilla):* con +0,5 % por
   semana, ruido de 3,3 % y una sesión por semana durante 12 semanas, «sin subida clara» en menos del 5 % de 2000
   series simuladas (da 3 %); con 0, «sube» en el
   12 % o menos; con menos de 6 sesiones, «todavía no se sabe». *Tests (estancados.test.ts):* la proteína solo
   aparece por debajo de 1,6 g/kg/día; la razón de las series, solo si bajaron más de dos errores estándar.
6. **La fatiga en palabras y días,** como en B: sin «2 %» en «Fatiga muscular» y sin barras con escala, o con
   barras sin números.
7. **Los datos nuevos de Ascent** (H): la reserva, «al fallo», los intentos y la puesta a punto. Es su repo y su
   sesión.
8. **La proteína extra el día de entrenamiento:** queda (es inofensiva) o pasa a una meta fija de 1,6 a 2,2
   g/kg/día. Es convención en los dos casos.
9. **2 o 4 horas antes de dormir:** la recomendación es «mejor 4, por lo menos 2», porque las dos fuentes se
   contradicen.

---

## 4. Lo que no se dice (o no se hace)

1. Ningún porcentaje de recuperación («87 % recuperado», «recuperado al 100 %»), ni un puntaje que se llame
   «validado» o «científico».
2. Ninguna probabilidad de marca en %, ni «hoy rompes tu marca», «seguro» o «vas a levantar 142,5 kg».
3. Ni horas exactas para estar listo ni porcentajes de fatiga.
4. «Hoy puedes ir más fuerte» por un número.
5. Causas seguras de un estancamiento («no subes porque dormiste menos»): solo «puede influir», con los datos a
   la vista y nunca antes de las semanas mínimas.
6. Que la comida de ayer cambie la fuerza de hoy, o que un día de pocas calorías «te baje» el rendimiento.
7. Que comer más o distinto compense haber dormido poco (`spec/entreno.md`, 3.6).
8. Premiar el registro como si fuera recuperación («registra para llegar a 40»).
9. Tratar un dato que falta como si fuera malo: la comida sin anotar no es 0 y la noche sin calidad no es
   «regular».
10. Que el dolor diga si un músculo está recuperado (Soares 2015).
11. La razón aguda:crónica, las «zonas seguras» o un modelo de estado y fatiga (Banister) con constantes
    generales: la razón agrega ruido (Impellizzeri 2020 y 2021), el modelo sobreajusta y su parte de fatiga no
    mejora la predicción (Marchal 2025), y las constantes generales no sirven para cada persona (Vermeire 2022).
12. Sumar la variabilidad cardíaca a un puntaje o guiar el entrenamiento por ella: no rindió más que un plan
    fijo en resistencia (Düking 2021) ni en la fuerza de mujeres mayores (Bittencourt 2024). Moss la lee para Sueño
    (`src/salud/leer.ts:97`) y ahí queda.
13. Diferencias por sexo como regla: hay un solo estudio de 19 personas (Davies 2018).
14. Que dormir mal «haga perder músculo» hoy: una noche sin dormir bajó la síntesis de proteína un 18 % (Lamon
    2021), pero eso es adaptación, no el rendimiento del día.
15. Dosis de cafeína para rendir: los 3 a 6 mg/kg de la ISSN (Guest 2021) pasan el tope de 200 mg de una vez
    (`spec/entreno.md`, 3.4).
16. «Según los estudios» delante de algo derivado: lo derivado se dice como tal, o no se dice.

---

## 5. Para «En qué se basa Moss»

**Español (neutro):**

> La parte de Ascent cruza tus series de Ascent con tu sueño y tu comida, y usa lo que muestran los estudios
> más sólidos. Dormir 6 horas o menos baja poco la fuerza máxima y bastante más las repeticiones (Craven y
> otros, 2022, que reunieron 77 estudios); tu fuerza cambia de un día a otro alrededor de un 3 a 5 % sin ningún
> motivo (Grgic y otros, 2020), y hacer más series por semana trae más progreso, aunque cada vez menos (Pelland
> y otros, 2026). Como la validez de los puntajes de «recuperación» de relojes y anillos no está demostrada
> (Doherty y otros, 2025), Moss no te da un porcentaje: te muestra tus datos, te avisa cuando algo sale de lo
> común y te dice cuándo todavía no hay datos suficientes para saberlo. Es orientativo, no un diagnóstico.

**English:**

> The Ascent section combines your sets from Ascent with your sleep and food, and relies on the strongest
> research available. Sleeping 6 hours or less lowers maximal strength only a little but reduces repetitions
> much more (Craven et al., 2022, pooling 77 studies); your strength also varies by about 3–5% from one day to
> the next for no particular reason (Grgic et al., 2020), and doing more sets per week brings more progress,
> though with diminishing returns (Pelland et al., 2026). Because the validity of wearable “recovery” scores
> hasn't been shown (Doherty et al., 2025), Moss doesn't give you a percentage: it shows your data, tells you
> when something is out of the ordinary, and says when there isn't enough data yet to know. It's guidance, not
> a diagnosis.

---

## 6. Fuentes

Leídas el 5/11/2026. «Solo el resumen» quiere decir que leí el resumen y los datos del registro (casi siempre en
Europe PMC, https://europepmc.org); «entero» quiere decir que leí el texto completo o, cuando lo digo, las partes
que se nombran.

**Recuperación, puntajes y lo que uno siente**
1. Doherty C, Baldwin M, Lambe R, Burke D, Altini M. 2025. *Readiness, recovery, and strain: an evaluation of
   composite health scores in consumer wearables.* Transl Exerc Biomed 2(2):128-144.
   https://doi.org/10.1515/teb-2025-0001 — solo el resumen (DOAJ; la editorial no dejó abrir el texto).
2. Saw AE, Main LC, Gastin PB. 2016. *Monitoring the athlete training response: subjective self-reported measures
   trump commonly used objective measures.* Br J Sports Med 50(5):281-291. https://doi.org/10.1136/bjsports-2015-094758
   — entero (PMC4789708; la primera mitad: métodos, resultados y conclusiones).
3. Laurent CM y otros. 2011. *A practical approach to monitoring recovery: development of a perceived recovery
   status scale.* J Strength Cond Res 25(3):620-628. https://doi.org/10.1519/JSC.0b013e3181c69ec6 — solo el resumen.
4. Tolusso DV y otros. 2022. *The Validity of Perceived Recovery Status as a Marker of Daily Recovery Following a
   High-Volume Back-Squat Protocol.* Int J Sports Physiol Perform 17(6):886-892. https://doi.org/10.1123/ijspp.2021-0360
   — solo el resumen.
5. Düking P y otros. 2021. *Monitoring and adapting endurance training on the basis of heart rate variability
   monitored by wearable technologies: a systematic review with meta-analysis.* J Sci Med Sport 24(11):1180-1192.
   https://doi.org/10.1016/j.jsams.2021.04.012 — solo el resumen.
6. Bittencourt D y otros. 2024. *Effects of individualized resistance training prescription with heart rate
   variability on muscle strength, muscle size and functional performance in older women.* Front Physiol
   15:1472702. https://doi.org/10.3389/fphys.2024.1472702 — solo el resumen.
7. Oura. *Readiness Score* (ayuda de la empresa). https://support.ouraring.com/hc/en-us/articles/360025589793-Readiness-Score
   — entero.
8. Apple. *App Review Guidelines*, 1.4.1. https://developer.apple.com/app-store/review/guidelines/ — entero (esa
   sección).

**Sueño y rendimiento**
9. Craven J y otros. 2022. *Effects of Acute Sleep Loss on Physical Performance: A Systematic and Meta-Analytical
   Review.* Sports Med 52(11):2669-2690. https://doi.org/10.1007/s40279-022-01706-y — entero (PMC9584849:
   métodos, resultados, limitaciones y financiación).
10. Kong Y y otros. 2025. *Effects of sleep deprivation on sports performance and perceived exertion in athletes
    and non-athletes: a systematic review and meta-analysis.* Front Physiol 16. https://doi.org/10.3389/fphys.2025.1544286
    — entero (resultados y conflictos de interés: un autor trabaja en DeRucci, una empresa de colchones).
11. Knowles OE y otros. 2018. *Inadequate sleep and muscle strength: implications for resistance training.* J Sci
    Med Sport 21(9):959-968. https://doi.org/10.1016/j.jsams.2018.01.012 — solo el resumen.
12. Knowles OE y otros. 2022. *Sustained Sleep Restriction Reduces Resistance Exercise Quality and Quantity in
    Females.* Med Sci Sports Exerc 54(12):2167-2177. https://doi.org/10.1249/mss.0000000000003000 — solo el resumen.
13. Reilly T, Piercy M. 1994. *The effect of partial sleep deprivation on weight-lifting performance.* Ergonomics
    37(1):107-115. https://doi.org/10.1080/00140139408963628 — solo el resumen.
14. Sargent C y otros. 2021. *How Much Sleep Does an Elite Athlete Need?* Int J Sports Physiol Perform
    16(12):1746-1757. https://doi.org/10.1123/ijspp.2020-0896 — solo el resumen.
15. Lamon S y otros. 2021. *The effect of acute sleep deprivation on skeletal muscle protein synthesis and the
    hormonal environment.* Physiol Rep 9(1):e14660. https://doi.org/10.14814/phy2.14660 — solo el resumen.
16. Cunha LA y otros. 2023. *The Impact of Sleep Interventions on Athletic Performance: A Systematic Review.*
    Sports Med Open 9:58. https://doi.org/10.1186/s40798-023-00599-z — solo el resumen.
17. Leota J y otros. 2025. *Dose-response relationship between evening exercise and sleep.* Nat Commun 16:3297.
    https://doi.org/10.1038/s41467-025-58271-x — entero (PMC12000559: resultados, discusión y conflictos).
18. Frimpong E y otros. 2021. *The effects of evening high-intensity exercise on sleep in healthy adults: a
    systematic review and meta-analysis.* Sleep Med Rev 60:101535. https://doi.org/10.1016/j.smrv.2021.101535 — solo
    el resumen.

**La fatiga y la recuperación de cada músculo**
19. Belcher DJ y otros. 2019. *Time course of recovery is similar for the back squat, bench press, and deadlift in
    well-trained males.* Appl Physiol Nutr Metab 44(10):1033-1042. https://doi.org/10.1139/apnm-2019-0004 — solo el
    resumen.
20. Thomas K y otros. 2018. *Neuromuscular Fatigue and Recovery after Heavy Resistance, Jump, and Sprint
    Training.* Med Sci Sports Exerc 50(12):2526-2535. https://doi.org/10.1249/MSS.0000000000001733 — solo el resumen.
21. Morán-Navarro R y otros. 2017. *Time course of recovery following resistance training leading or not to
    failure.* Eur J Appl Physiol 117(12):2387-2399. https://doi.org/10.1007/s00421-017-3725-7 — solo el resumen.
22. Raastad T, Hallén J. 2000. *Recovery of skeletal muscle contractility after high- and moderate-intensity
    strength exercise.* Eur J Appl Physiol 82(3):206-214. https://doi.org/10.1007/s004210050673 — solo el resumen.
23. Refalo MC y otros. 2023. *Influence of Resistance Training Proximity-to-Failure, Determined by
    Repetitions-in-Reserve, on Neuromuscular Fatigue in Resistance-Trained Males and Females.* Sports Med Open 9:10.
    https://doi.org/10.1186/s40798-023-00554-y — solo el resumen.
24. Pareja-Blanco F y otros. 2019. *Time Course of Recovery Following Resistance Exercise with Different Loading
    Magnitudes and Velocity Loss in the Set.* Sports (Basel) 7(3):59. https://doi.org/10.3390/sports7030059 — solo el
    resumen.
25. Davies RW, Carson BP, Jakeman PM. 2018. *Sex Differences in the Temporal Recovery of Neuromuscular Function
    Following Resistance Training in Resistance Trained Men and Women 18 to 35 Years.* Front Physiol 9:1480.
    https://doi.org/10.3389/fphys.2018.01480 — solo el resumen.
26. Korak JA, Green JM, O'Neal EK. 2015. *Resistance Training Recovery: Considerations for Single vs. Multi-joint
    Movements and Upper vs. Lower Body Muscles.* Int J Exerc Sci 8(1):85-96. https://digitalcommons.wku.edu/ijes/vol8/iss1/10
    — solo el resumen.
27. Soares S y otros. 2015. *Dissociated Time Course of Muscle Damage Recovery Between Single- and Multi-Joint
    Exercises in Highly Resistance-Trained Men.* J Strength Cond Res 29(9):2594-2599. https://doi.org/10.1519/jsc.0000000000000899
    — solo el resumen.
28. Bartolomei S y otros. 2017. *Comparison of the recovery response from high-intensity and high-volume
    resistance exercise in trained men.* Eur J Appl Physiol 117(7):1287-1298. https://doi.org/10.1007/s00421-017-3598-9
    — solo el resumen.
29. Vieira JG y otros. 2022. *Effects of Resistance Training to Muscle Failure on Acute Fatigue: A Systematic
    Review and Meta-Analysis.* Sports Med 52(5):1103-1125. https://doi.org/10.1007/s40279-021-01602-x — solo el resumen.
30. Chen TC y otros. 2011. *Comparison in eccentric exercise-induced muscle damage among four limb muscles.* Eur J
    Appl Physiol 111(2):211-223. https://doi.org/10.1007/s00421-010-1648-7 — solo el resumen.
31. Newton MJ y otros. 2008. *Comparison of responses to strenuous eccentric exercise of the elbow flexors between
    resistance-trained and untrained men.* J Strength Cond Res 22(2):597-607. https://doi.org/10.1519/jsc.0b013e3181660003
    — solo el resumen.
32. Nosaka K y otros. 2001. *How long does the protective effect on eccentric exercise-induced muscle damage
    last?* Med Sci Sports Exerc 33(9):1490-1495. https://doi.org/10.1097/00005768-200109000-00011 — solo el resumen.

**Los modelos de carga**
33. Impellizzeri FM y otros. 2020. *Acute:Chronic Workload Ratio: Conceptual Issues and Fundamental Pitfalls.* Int
    J Sports Physiol Perform 15(6):907-913. https://doi.org/10.1123/ijspp.2019-0864 — solo el resumen.
34. Impellizzeri FM y otros. 2021. *What Role Do Chronic Workloads Play in the Acute to Chronic Workload Ratio?
    Time to Dismiss ACWR and Its Underlying Theory.* Sports Med 51(3):581-592. https://doi.org/10.1007/s40279-020-01378-6
    — solo el resumen.
35. Marchal A y otros. 2025. *Statistical flaws of the fitness-fatigue sports performance prediction model.* Sci
    Rep 15:3706. https://doi.org/10.1038/s41598-025-88153-7 — solo el resumen.
36. Vermeire K y otros. 2022. *The Fitness-Fatigue Model: What's in the Numbers?* Int J Sports Physiol Perform
    17(5):810-813. https://doi.org/10.1123/ijspp.2021-0494 — solo el resumen.

**El progreso, la dosis y el estancamiento**
37. Pelland JC y otros. 2026. *The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of
    Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains.* Sports Med 56(2):481-505.
    https://doi.org/10.1007/s40279-025-02344-w — solo el resumen.
38. Grgic J y otros. 2018. *Effect of Resistance Training Frequency on Gains in Muscular Strength: A Systematic
    Review and Meta-Analysis.* Sports Med 48(5):1207-1220. https://doi.org/10.1007/s40279-018-0872-x — solo el resumen.
39. Ralston GW y otros. 2017. *The Effect of Weekly Set Volume on Strength Gain: A Meta-Analysis.* Sports Med
    47(12):2585-2601. https://doi.org/10.1007/s40279-017-0762-7 — solo el resumen.
40. Robinson ZP y otros. 2024. *Exploring the Dose-Response Relationship Between Estimated Resistance Training
    Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions.* Sports Med
    54(9):2209-2231. https://doi.org/10.1007/s40279-024-02069-2 — solo el resumen.
41. Grgic J y otros. 2022. *Effects of resistance training performed to repetition failure or non-failure on
    muscular strength and hypertrophy: A systematic review and meta-analysis.* J Sport Health Sci 11(2):202-211.
    https://doi.org/10.1016/j.jshs.2021.01.007 — solo el resumen.
42. Grgic J y otros. 2018. *Effects of Rest Interval Duration in Resistance Training on Measures of Muscular
    Strength: A Systematic Review.* Sports Med 48(1):137-151. https://doi.org/10.1007/s40279-017-0788-x — solo el resumen.
43. Singer A y otros. 2024. *Give it a rest: a systematic review with Bayesian meta-analysis on the effect of
    inter-set rest interval duration on muscle hypertrophy.* Front Sports Act Living 6:1429789.
    https://doi.org/10.3389/fspor.2024.1429789 — solo el resumen.
44. Lopez P y otros. 2021. *Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic
    Review and Network Meta-analysis.* Med Sci Sports Exerc 53(6):1206-1216. https://doi.org/10.1249/MSS.0000000000002585
    — solo el resumen.
45. Currier BS y otros (ACSM). 2026. *American College of Sports Medicine Position Stand. Resistance Training
    Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of
    Reviews.* Med Sci Sports Exerc 58(4):851-872. https://doi.org/10.1249/mss.0000000000003897 — entero (PMC12965823:
    el resumen, los resultados y las recomendaciones, ~60 % del texto).
46. Coleman M y otros. 2024. *Gaining more from doing less? The effects of a one-week deload period during
    supervised resistance training on muscular adaptations.* PeerJ 12:e16777. https://doi.org/10.7717/peerj.16777 —
    solo el resumen.
47. Bell L y otros. 2023. *Integrating Deloading into Strength and Physique Sports Training Programmes: An
    International Delphi Consensus Approach.* Sports Med Open 9:87. https://doi.org/10.1186/s40798-023-00633-0 — solo
    el resumen.
48. Travis SK y otros. 2020. *Tapering and Peaking Maximal Strength for Powerlifting Performance: A Review.* Sports
    (Basel) 8(9):125. https://doi.org/10.3390/sports8090125 — entero (PMC7552788; la primera mitad y las
    conclusiones).
49. Murphy C, Koehler K. 2022. *Energy deficiency impairs resistance training gains in lean mass but not strength:
    A meta-analysis and meta-regression.* Scand J Med Sci Sports 32(1):125-137. https://doi.org/10.1111/sms.14075 — solo
    el resumen.
50. Garthe I y otros. 2011. *Effect of two different weight-loss rates on body composition and strength and
    power-related performance in elite athletes.* Int J Sport Nutr Exerc Metab 21(2):97-104.
    https://doi.org/10.1123/ijsnem.21.2.97 — solo el resumen.
51. Morton RW y otros. 2018. *A systematic review, meta-analysis and meta-regression of the effect of protein
    supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.* Br J
    Sports Med 52(6):376-384. https://doi.org/10.1136/bjsports-2017-097608 — entero (PMC5867436: resultados,
    discusión y conflictos de interés).
52. Latella C y otros. 2020. *Long-Term Strength Adaptation: A 15-Year Analysis of Powerlifting Athletes.* J
    Strength Cond Res 34(9):2412-2418. https://doi.org/10.1519/jsc.0000000000003657 — solo el resumen.

**El 1RM estimado y el esfuerzo**
53. Grgic J y otros. 2020. *Test-Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a
    Systematic Review.* Sports Med Open 6:31. https://doi.org/10.1186/s40798-020-00260-z — entero (PMC7367986).
54. Reynolds JM, Gordon TJ, Robergs RA. 2006. *Prediction of one repetition maximum strength from multiple
    repetition maximum testing and anthropometry.* J Strength Cond Res 20(3):584-592. https://doi.org/10.1519/r-15304.1
    — solo el resumen.
55. Nuzzo JL y otros. 2024. *Maximal Number of Repetitions at Percentages of the One Repetition Maximum: A
    Meta-Regression and Moderator Analysis of Sex, Age, Training Status, and Exercise.* Sports Med 54(2):303-321.
    https://doi.org/10.1007/s40279-023-01937-7 — entero (PMC10933212; ~40 %: métodos, resultados principales y
    conflictos: dos autores trabajaron en una empresa de equipos de entrenamiento).
56. Helms ER y otros. 2017. *RPE and Velocity Relationships for the Back Squat, Bench Press, and Deadlift in
    Powerlifters.* J Strength Cond Res 31(2):292-297. https://doi.org/10.1519/jsc.0000000000001517 — solo el resumen.
57. Halperin I y otros. 2022. *Accuracy in Predicting Repetitions to Task Failure in Resistance Exercise: A Scoping
    Review and Exploratory Meta-analysis.* Sports Med 52(2):377-390. https://doi.org/10.1007/s40279-021-01559-x — solo el
    resumen.
58. Hickmott LM y otros. 2022. *The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy:
    A Systematic Review and Meta-Analysis.* Sports Med Open 8:9. https://doi.org/10.1186/s40798-021-00404-9 — solo el
    resumen.

**Cómo medir el cambio y decir la incertidumbre**
59. Hopkins WG. 2000. *Measures of reliability in sports medicine and science.* Sports Med 30(1):1-15.
    https://doi.org/10.2165/00007256-200030010-00001 — solo el resumen.
60. Hopkins WG. *Precision of measurement* (A New View of Statistics). https://www.sportsci.org/resource/stats/precision.html
    — entero.
61. Van Calster B y otros. 2019. *Calibration: the Achilles heel of predictive analytics.* BMC Med 17:230.
    https://doi.org/10.1186/s12916-019-1466-7 — solo el resumen.
62. van der Bles AM y otros. 2019. *Communicating uncertainty about facts, numbers and science.* R Soc Open Sci
    6(5):181870. https://doi.org/10.1098/rsos.181870 — solo el resumen.

**Comer alrededor del entreno**
63. King A y otros. 2022. *The Ergogenic Effects of Acute Carbohydrate Feeding on Resistance Exercise Performance:
    A Systematic Review and Meta-analysis.* Sports Med 52(11):2691-2712. https://doi.org/10.1007/s40279-022-01716-w —
    solo el resumen.
64. Henselmans M y otros. 2022. *The Effect of Carbohydrate Intake on Strength and Resistance Training Performance:
    A Systematic Review.* Nutrients 14(4):856. https://doi.org/10.3390/nu14040856 — solo el resumen.
65. Schoenfeld BJ, Aragon AA, Krieger JW. 2013. *The effect of protein timing on muscle strength and hypertrophy:
    a meta-analysis.* J Int Soc Sports Nutr 10:53. https://doi.org/10.1186/1550-2783-10-53 — solo el resumen.
66. Macnaughton LS y otros. 2016. *The response of muscle protein synthesis following whole-body resistance
    exercise is greater following 40 g than 20 g of ingested whey protein.* Physiol Rep 4(15):e12893.
    https://doi.org/10.14814/phy2.12893 — solo el resumen (lo financió GlaxoSmithKline).
67. Trommelen J y otros. 2023. *The anabolic response to protein ingestion during recovery from exercise has no
    upper limit in magnitude and duration in vivo in humans.* Cell Rep Med 4(12):101324.
    https://doi.org/10.1016/j.xcrm.2023.101324 — solo el resumen.
68. Pearson AG, Hind K, Macnaughton LS. 2023. *The impact of dietary protein supplementation on recovery from
    resistance exercise-induced muscle damage: A systematic review with meta-analysis.* Eur J Clin Nutr
    77(8):767-783. https://doi.org/10.1038/s41430-022-01250-y — solo el resumen.
69. Davies RW, Carson BP, Jakeman PM. 2018. *The Effect of Whey Protein Supplementation on the Temporal Recovery of
    Muscle Function Following Resistance Training: A Systematic Review and Meta-Analysis.* Nutrients 10(2):221.
    https://doi.org/10.3390/nu10020221 — solo el resumen (con fondos de Food Health Ireland).
70. Grgic J y otros. 2018. *Effects of caffeine intake on muscle strength and power: a systematic review and
    meta-analysis.* J Int Soc Sports Nutr 15:11. https://doi.org/10.1186/s12970-018-0216-0 — solo el resumen.
71. Guest NS y otros (ISSN). 2021. *International society of sports nutrition position stand: caffeine and
    exercise performance.* J Int Soc Sports Nutr 18:1. https://doi.org/10.1186/s12970-020-00383-4 — solo el resumen.
72. Gardiner C y otros. 2023. *The effect of caffeine on subsequent sleep: A systematic review and meta-analysis.*
    Sleep Med Rev 69:101764. https://doi.org/10.1016/j.smrv.2023.101764 — solo el resumen.

**Lo que no pude leer y por eso no va como fuente:** el texto completo de Doherty 2025 (la editorial devolvió
405; «14 puntajes de 10 marcas» sale de la spec y de reseñas, no de lo que leí), el de Pelland 2026 (de pago), la
página de WHOOP sobre su recuperación (403) y los PDF de Hopkins 2000 y de la guía de indicadores compuestos del
JRC (no se pudieron convertir a texto). Tampoco encontré, buscándolos, un metaanálisis que dé el % de fuerza que
se gana por mes según la experiencia, ni un estudio que valide un puntaje de recuperación contra el rendimiento
del día.

---

## Anexo: las cuentas propias (derivadas)

Los supuestos de las simulaciones: un ruido normal e independiente entre sesiones, un progreso constante, una
sesión por semana con el ejercicio, y como marca, la mejor sesión. El ruido es de 3,3 % (el CV del 1RM en
entrenados, Grgic 2020) y, para ver qué cambia, de 5 % (el e1RM de una serie submáxima tiene más ruido que un
1RM). Sirven para ver el orden de magnitud, no como evidencia. Los scripts están en
`spec/estudio/calc/`:
`fatiga.js`, `recuperado.js`, `estancado.js`, `tendencia.js`, `marca.js`, `marca2.js` y `marca3.js`.

**A1. El modelo de `musculos.ts` contra los estudios** (como en la app: sin la marca de «al fallo», que Ascent no
manda). Los estudios miden cosas distintas (velocidad, salto o fuerza) y el modelo da un solo número.

| Protocolo (estudio) | El modelo, a las 24 / 48 / 72 h | Lo medido |
|---|---|---|
| Sentadilla, 4 series al fallo al 80 % (Belcher 2019) | 6,1 / 3,1 / 1,6 % | más lenta hasta las 72 h (−8,6 % de velocidad) |
| Press banca, 4 series al fallo al 80 % (Belcher 2019) | 3,1 / 0,8 / 0,2 % | solo cayó justo después |
| Press banca, 6 series al fallo al 75 % (Refalo 2023) | 4,2 / 1,1 / 0,3 % | −3 % a las 24 h; a las 48, las diferencias entre protocolos se achican |
| Press banca, 6 series a 3 de reserva (Refalo 2023) | 2,9 / 0,8 / 0,2 % | +2 % a las 24 h |
| Sentadilla 10 × 5 al 80 % (Thomas 2018) | 10,1 / 6,5 / 4,2 % | resuelto a las 72 h |
| Sentadilla 5 × 5 al 80 % y una al fallo (Davies 2018, hombres) | 6,1 / 3,1 / 1,6 % | salto −10 % a las 24 h y −3 % a las 72 |
| Curl, 8 × 10RM (Soares 2015) | 5,0 / 1,3 / 0,3 % | fuerza −8,4 % a las 24 h |
| Remo, 8 × 10RM (Soares 2015) | 5,0 / 1,3 / 0,3 % | recuperado a las 24 h |
| Piernas, 8 × 10 (Bartolomei 2017) | 9,7 / 5,0 / 2,6 % | la isométrica, todavía baja a las 72 h |

Listo en (por debajo del 3 %), con series de piernas sin repeticiones anotadas: 6 series, 60 h; 8, 67 h; 9, 69 h;
**10, 107 h**; 12, 111 h. El salto entre 9 y 10 sale del «× 1,5 con 10 series o más».

**A2. La suma de `recuperado.ts` en días posibles** (necesidad de 8 h, meta de 150 g de proteína y 2300 kcal):

| Día | Sueño + músculos + comida | Franja |
|---|---|---|
| 5 h 50, calidad 46, fatiga 2 %, comida casi en la meta (el día de ejemplo) | 24 + 39 + 19 = 82 | Bien |
| 5 h, sin calidad, músculos descansados, comida en la meta | 23 + 40 + 20 = 83 | Bien |
| 4 h 30, calidad 30, músculos descansados, comida en la meta | 17 + 40 + 20 = 77 | Bien |
| 8 h, calidad 85, músculos descansados, ayer sin anotar nada | 37 + 40 + 0 = 77 | Bien |
| 8 h, calidad 85, piernas cargadas (fatiga 40 %), comida en la meta | 37 + 24 + 20 = 81 | Bien |

Con todas las combinaciones de noches de 4 h 30 a 6 h, calidad de 20 a 80 o sin ella, fatiga de 0 a 20 % y
comida del 80 al 110 % de la meta: **«Muy bien» el 11 %, «Bien» el 86 %, «Aceptable» el 3 % y «Atención»
nunca.**

**A3. ¿Estancado? La regla de Moss y de Ascent contra la tendencia** (ruido de 3,3 %, una sesión por semana):

| Lo que sube de verdad | Regla de 3 semanas: «estancado» | Regla de 6 semanas | Tendencia de 12 semanas: sube / sin subida clara / todavía no se sabe |
|---|---|---|---|
| Nada | 85 % | 70 % | 12 / 44 / 44 % |
| 0,25 % por semana (~1 % por mes) | 63 % | 38 % | 36 / 15 / 48 % |
| 0,5 % por semana (~2 % por mes) | 46 % | 18 % | 69 / 3 / 28 % |
| 1 % por semana (~4 % por mes) | 26 % | 5 % | 98 / 0 / 2 % |

Con dos sesiones por semana y 12 semanas, la tendencia da 11/61/29 % sin progreso, 50/17/33 % con 0,25 % por
semana y 89/1/10 % con 0,5 %. Con ruido de 5 %, todo se corre hacia «todavía no se sabe». La pendiente necesita
semanas: con una sesión por semana, su error estándar es de 0,79 % por semana con 6 semanas, 0,51 con 8, 0,28 con
12 y 0,18 con 16.

**A4. La probabilidad de marca** (ruido de 3,3 %, progreso de 0,25 % por semana): lo que dice la fórmula y lo que
pasa.

| La P de `buenDiaParaMarca()` | Media | Marca de verdad |
|---|---|---|
| 0 a 10 % | 5 % | 8 % |
| 10 a 20 % | 15 % | 13 % |
| 20 a 30 % | 25 % | 16 % |
| 30 a 40 % | 35 % | 18 % |
| 40 a 50 % (casi siempre g = 0: la mejor serie reciente es la marca) | 49 % | 15 % |

Pasa el 35 % en el 54 % de las sesiones y, cuando lo pasa, la marca sale el 15 % de las veces. El Brier (menos es
mejor) es de 0,183 con la fórmula, 0,135 diciendo la frecuencia de siempre y 0,109 con un oráculo que conoce el
nivel verdadero; con un progreso de 1 % por semana, 0,249, 0,235 y 0,184. Ni el oráculo acierta mucho más: lo que
decide es el ruido del día, que nada de lo que Moss tiene puede ver. Una tendencia de 8 sesiones en vez de la
mejor serie tampoco queda calibrada (`marca2.js`).

**A5. Epley contra Brzycki** (el factor por el que se multiplica el peso): con 1 repetición, 1,033 contra 1,000
(3,3 %); con 3, 1,100 contra 1,059 (3,9 %); con 5, 1,167 contra 1,125 (3,7 %); con 8, 1,267 contra 1,241 (2,0 %);
con 10, iguales; con 12, 1,400 contra 1,440 (−2,8 %). Elegir una fórmula u otra mueve el e1RM más que el ruido de
un día. Por eso sirve para la tendencia de una persona en su rango de repeticiones de siempre, y no como su 1RM.
