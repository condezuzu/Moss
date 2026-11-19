# Los músculos: la recuperación, el sueño y la comida contra el rendimiento

*Estudio del 19/11/2026 para la sección de músculos que van a compartir Moss y Ascent. La investigación se
repartió: la sesión de Ascent estudia el volumen, la intensidad, la reserva (RIR), la franja del puntaje y variar
los ejercicios; este documento estudia la recuperación de cada músculo y el sueño y la comida contra el
rendimiento. Parte de `spec/rendimiento.md` («2. Por músculo» y las partes S, D, Q y C de la sección 1) y de
`spec/estudio/ascent.md` (5/11/2026), y no repite lo que ya está ahí.*

*Código leído (rama `mejoras-1.1`, commit `cc5f6cd`): `src/dominio/musculos.ts`, `src/dominio/fatiga.ts` y
`porLaComida()` y `porElMusculo()` de `src/dominio/rendimiento.ts`. No se tocó nada.*

*Cómo leer las cifras. Cada número lleva su fuente entre corchetes; las fuentes están al final, con su DOI y con
lo que se leyó: «resumen» (casi siempre en Europe PMC) o «texto» (las partes que se nombran). Las que ya revisó
el estudio del 5/11 y no se volvieron a abrir dicen «(revisada el 5/11)». Lo marcado **derivado** es una cuenta
propia o una elección hecha a partir de los datos citados, no un valor publicado; lo marcado **convención** no
tiene evidencia a favor ni en contra. Las cuentas propias están en el Anexo, con los datos para rehacerlas; los
scripts quedaron fuera del repo, porque el pedido era escribir solo este archivo.*

---

## 1. Resumen

1. **Lo que más alarga la recuperación de un músculo es acercarse al fallo con muchas repeticiones por serie, no
   el número de series ni qué músculo es.** Lejos del fallo, se vuelve a lo propio en horas o al día siguiente
   [2][6][7][8][11]; al fallo, entre 48 y 72 h, y en la sentadilla pesada o en la banca con muchas series hasta
   el fallo, a veces más de 72 h [1][3][13][14]. No hay un metaanálisis del curso en el tiempo (se buscó): son
   ensayos de 6 a 42 personas, casi todos hombres jóvenes, que miden cosas distintas (velocidad, salto, fuerza
   isométrica).
2. **El modelo actual no ordena los estudios mejor que una constante.** Contra 16 mediciones de 7 ensayos
   (cuenta propia, Anexo A1), `residual()` erra 4,8 puntos (raíz del error cuadrático medio), ve en promedio 2,4
   puntos más de fatiga que la medida, acierta a ±3 puntos solo 6 de 16 veces y su orden no se parece al medido
   (Spearman −0,11). Decir siempre «2,5 %» erraría 3,6. Ajustada a esos mismos datos, la misma forma no baja de
   ~4 puntos con un estudio afuera. Además ordena al revés el ensayo más claro: le da más fatiga a 6 × 5 lejos del
   fallo que a 3 × 10 al fallo, y el estudio midió lo contrario [1].
3. **De 2023 a 2026 hay datos en contra de las dos constantes.** Banca hasta el fallo: el 1RM estimado seguía
   abajo a las 48 y a las 72 h en 42 entrenados (Nuckols 2026 [13]), y el modelo da el pecho «descansado» a las
   48 h. 5 × 10RM de sentadilla o de prensa: todo en su lugar a las 24 h (Kotikangas 2025 [12]), y el modelo da
   7 % a las 24 h (13 % con el ×1,5 del novato). Lejos del fallo, al día siguiente se rinde igual o mejor (Refalo
   2023 [6]; Mangine 2022 [7]; Cowley 2025 [8]; Páez-Maldonado 2026 [11]).
4. **Ni el sexo ni la edad justifican una regla, y lo que más varía es la persona.** Sexo: diferencias de
   menores a nulas en 34 estudios con entrenados (Amdi 2025 [20]), y la misma recuperación aunque las mujeres
   hicieron casi el doble de repeticiones [13]. Edad: 4 de 11 estudios ven peor recuperación en mayores, 2 mejor y
   6 igual [24]. Con el mismo ejercicio excéntrico, 286 hombres cayeron al 82, al 61 o al 42 % de su fuerza
   (Damas 2016 [29]), y cada uno repite su respuesta un año después (Chen 2006 [28]).
5. **La franja de 90 a 110 no se sostiene del lado de la fatiga.** Si el borde de 110 es el primer cansancio que
   se puede notar (~3 % de la fuerza, el ruido de un día a otro [30]), la franja es más angosta que el error del
   modelo (~5 puntos) y que el ruido de cada día: lo verdadero caería adentro unas 4 de cada 10 veces (derivado,
   Anexo A2). Lo que se defiende son tres estados con palabra, color y día («probablemente listo mañana»), y
   mostrar la carga de la semana aparte, no mezclada en un número.
6. **Sueño.** Una noche de 6 h o menos baja poco la fuerza máxima (−2,85 %) y más las repeticiones (−9,85 %), y
   sube el esfuerzo percibido; despertarse antes pesa más que acostarse tarde [37][38][39]. Varias noches cortas
   pesan en los multiarticulares [41][42]. Para lo que se gana en semanas no hay ensayos en entrenados: 5 noches
   de 4 h bajan un 19 % la síntesis de proteína del músculo [47], pero dormir 1 a 2 h menos de forma habitual no
   frenó las ganancias en un estudio chico [46]. Donde más se ve es con déficit: con 5,5 h en vez de 8,5, un 60 %
   más de pérdida de masa magra [49].
7. **Comida.** Lo de antes de entrenar pesa menos de lo que se creía en quien come normal: 1,2 g/kg de
   carbohidratos después de más de 10 h de ayuno no cambiaron las repeticiones de una sesión de 90 min (King
   2025 [52]), ni el desayuno las de la tarde (Stratton 2024 [53], 39 entrenados), ni +485 kcal por día lo ganado
   en 8 semanas (Henselmans 2026 [55]). Lo que sí pesa: el déficit frena la masa magra y no la fuerza [59]; la
   baja disponibilidad de energía baja la síntesis de proteína y la masa magra en 10 días [61]; y la proteína del
   día, desde ~1,6 g/kg, suma poco pero suma [63][64].
8. **La regla «comiste bien y dormiste bien: sube el peso; comiste mal: mantenlo» no tiene estudios que la
   prueben, y la parte de la comida está refutada para la fuerza** (el déficit no frena la fuerza ganada [59] y la
   comida de un día no cambia la sesión siguiente [52][53][54]). La del sueño tiene algo (las repeticiones cuestan
   más tras una noche corta), pero eso ya lo muestran las series. Lo que decide subir es lo que pasó en las series:
   la doble progresión es una convención (ACSM 2009: +2 a 10 % al hacer 1 o 2 repeticiones de más [67]);
   progresar por reserva rinde como los porcentajes [71][72], subir repeticiones como subir kilos [69], y el ACSM
   2026 dice que no hay datos para fijar la reserva exacta [68].
9. **Cómo se siente uno** sigue a la carga mejor que los marcadores [79] y acompaña al rendimiento dentro de cada
   persona (r de 0,80 a 0,84 [81]), pero no sirve para comparar personas [81], puede ir atrasado (después de 5
   días de sobrecarga, la sensación volvió a los 14 días y el 1RM ya estaba +4,8 % a los 7 [83]), «qué tan listo
   te sientes» no predijo la velocidad de la barra y las ganas sí, poco [84], y regular el volumen por cómo se
   sentía no dio más fuerza ni más músculo [74]. La mejor guía para la próxima sesión es la primera serie de
   trabajo con un peso conocido.
10. **Lo que cambia:** la fatiga se dice en días con una regla por casos (2.4), la reserva entra en la dosis si
    Ascent la manda, el ×1,5 del novato sale de la caída inicial, el primer contacto con un ejercicio suma un
    día, no se arma un puntaje de 0 a 200 con la fatiga adentro, el ayuno de 8 h deja de restar en
    `porLaComida()`, el sueño y la comida no deciden subir el peso, y lo único que puede bajar el error es
    calibrar con los datos de cada persona (sección 8).

---

## 2. La recuperación de cada músculo (pregunta 1)

### 2.1 El curso en el tiempo: lo nuevo desde el 5/11

La tabla de [`rendimiento.md`](../rendimiento.md) («Lo publicado») ya tiene Raastad 2000, Soares 2015, Refalo 2023,
Davies 2018, Belcher 2019, Thomas 2018, Bartolomei 2017, Morán-Navarro 2017, Korak 2015, Vieira 2022, Newton 2008
y Nosaka 2001. Esto es lo que se suma:

| Estudio | Quiénes | Qué hicieron | Qué pasó | Qué le dice al modelo |
|---|---|---|---|---|
| Nuckols 2026 [13] | 21 hombres y 21 mujeres, 1 año o más de banca | Banca al 75 %, series de 5 con 90 s, hasta no completar 5 (~30 repeticiones ellos, ~58 ellas); 1RM estimado por velocidad durante 72 h | Más bajo a los 10 min, a las 24 h (el punto más bajo), 48 h y 72 h (p < 0,001). Sin diferencia entre sexos. Un fabricante de programas (Renaissance Periodization) pagó el aparato de medición | En contra de τ = 18 h en el pecho: el modelo da 1,1 % a las 48 h y 0,3 % a las 72. En contra de la dosis por series: con el doble de series, el modelo les da más fatiga a ellas; no la hubo |
| Kotikangas 2025 [12] | 12 hombres activos, sin plan de fuerza | 5 × 10RM de sentadilla en Smith o de prensa horizontal | Todo de vuelta a la base a las 24 h (fuerza isométrica y salto). Límites: orden no aleatorio, sin control de sueño ni dieta | En contra de τ = 36 h (7,2 % a las 24 h) y del ×1,5 del novato (13,4 %) |
| Páez-Maldonado 2026 [11] | 14 hombres con experiencia moderada | Banca con 3, 15 o 24 repeticiones, con pausas entre repeticiones para no acumular fatiga | Las mismas respuestas; la velocidad al 60 % subió a las 24 y 48 h en los tres | El volumen solo no deja fatiga: la deja acercarse al fallo |
| Mangine 2022 [7] | 14 hombres entrenados | Banca al 80 %: 4 series a 3 de reserva y una al fallo, contra 5 al fallo | Sin diferencias en la barra ni en la CK de 24 a 72 h | En contra de un efecto grande del fallo en el tren superior |
| Cowley 2025 [8] | 15 personas | Sentadilla y banca, 5 series al 70 %, por porcentaje, RPE, reserva o velocidad | Por porcentaje, muchas series terminaron al fallo; a las 24 h, sin diferencias de fatiga ni de dolor entre métodos | Igual que el anterior |
| Vieira 2026 [10] | 6 hombres entrenados | Cuerpo entero, 6 ejercicios: al fallo con el 10RM contra 10 repeticiones con el 85 % | Al fallo, la recuperación fue más lenta; n de 6 | A favor de que el fallo alarga |
| Varela-Olalla 2025 [9] | Revisión sistemática, 51 artículos | Protocolos de fuerza comparados por la fatiga aguda | Lo que más fatiga: la duración de la serie, la cercanía al fallo y el volumen total; más con cargas livianas llevadas al fallo | A favor de pesar el esfuerzo de cada serie |
| Pareja-Blanco 2019 [4] | 17 hombres | Sentadilla al 60 o al 80 %, cortando la serie al perder 20 o 40 % de velocidad | Más fatiga y recuperación más lenta con 40 % de pérdida y con el 60 % (más repeticiones por serie) | Igual |
| Pareja-Blanco 2020 [3] | 10 hombres | 10 protocolos de banca y sentadilla, de 2 a 12 repeticiones, al fallo o a la mitad | Al fallo, sobre todo con muchas repeticiones por serie, el salto y la velocidad siguieron bajos hasta 48 h | Igual |
| González-Badillo 2016 [2] | 9 hombres | Banca y sentadilla al 80 %: 3 × 4 de 8 posibles contra 3 × 8 de 8 | El salto volvió a las 6 h con 3 × 4 de 8 y seguía bajo a las 48 h con 3 × 8 de 8 | El modelo da 7,9 % a las 6 h al primero |
| Morán-Navarro 2017 [1] | 10 hombres entrenados | 3 × 5 de 10, 6 × 5 de 10 y 3 × 10 de 10 | Al fallo, más lento entre las 24 y las 48 h, aun contra el mismo volumen (6 × 5) | El modelo los ordena al revés (Anexo A1) |
| Pareja-Blanco 2019 [5] | 10 hombres sin experiencia | Lo mismo antes y después de 10 semanas de entrenamiento | Antes de entrenar, más fatiga y más larga con el mismo estímulo relativo | A favor de que el novato tarda más |

### 2.2 Qué la alarga y qué la acorta

| Factor | A favor de que cambie la recuperación | En contra | Veredicto |
|---|---|---|---|
| Cercanía al fallo | [1][2][3][4][9][10]; Vieira 2022 (revisada el 5/11): más fatiga mecánica al fallo | [7][8]: en la banca, sin diferencias de 24 a 72 h | **Se sostiene**: es lo que más pesa, sobre todo con muchas repeticiones por serie y en las piernas |
| Volumen (series) | Bartolomei 2017 (revisada el 5/11): 8 × 10 deja la fuerza baja a las 72 h y 8 × 3 no | [11]: sin fatiga acumulada, 24 repeticiones no dejan más que 3; [1]: 6 × 5 lejos del fallo, más rápido que 3 × 10 al fallo | **A medias**: importa junto con el esfuerzo, no solo |
| Excéntrica o ejercicio nuevo | Newton 2008 y Nosaka 2001 (revisadas el 5/11); [29]: con excéntricos máximos sin costumbre, caídas del 18 al 58 % | Casi todo es con excéntricos máximos de brazos, no con series comunes | **Se sostiene la dirección**; el tamaño, sin dato para series comunes |
| Años entrenando | [5]: los mismos hombres, antes y después de 10 semanas; Newton 2008 | [12]: sin plan de fuerza y todo en su lugar a las 24 h tras 5 × 10RM | **A medias**: la dirección sí; el ×1,5 en la caída y en τ, no |
| Edad | [25] (narrativa, mecanismos): el músculo viejo se recupera más lento | [24]: de 11 estudios, 4 peor, 2 mejor y 6 igual (así suma su resumen); [23]: 27 estudios, «inconsistentes», faltan mujeres | **Sin regla** |
| Sexo | Davies 2018 (revisada el 5/11, 19 personas): salto más lento en mujeres; [22]: los hombres, más fatigados con el mismo volumen relativo (no al fallo) | [20]: 34 estudios, de menores a nulas; [21]: sin diferencias en recuperación; [13]: igual recuperación con el doble de trabajo | **Sin regla** (confirma `rendimiento.md`) |
| Qué músculo | Belcher 2019 (revisada el 5/11): la sentadilla más lenta que la banca; Korak 2015: los multiarticulares más lentos | [13]: la banca al fallo, más de 72 h; Soares 2015: el curl más lento que el remo | **A medias**: lo lento es el multiarticular pesado de piernas y el fallo, no el tamaño del músculo |

### 2.3 El modelo contra los estudios (cuenta propia, derivada)

El modelo de hoy (`musculos.ts`), como corre en la app: sin la reserva (Ascent no la manda, así que cada serie de
trabajo vale 1), sin «al fallo» y sin el ×1,5 del novato salvo donde se dice. Los detalles y los datos, en el
Anexo A1.

| Medición | Lo medido | El modelo | Error |
|---|---|---|---|
| Curl 8 × 10RM, bíceps, 24 h (Soares 2015) | 8,4 % | 6,0 | −2,4 |
| Remo 8 × 10RM, bíceps (ayuda), 24 h (Soares 2015) | 0 | 3,1 | +3,1 |
| Banca 6 series al 75 %, al fallo, 24 h [6] | 3 | 4,2 | +1,2 |
| Lo mismo a 1 de reserva [6] | 3 | 4,2 | +1,2 |
| Lo mismo a 3 de reserva [6] | −2 | 4,2 | +6,2 |
| Sentadilla 4 al fallo al 80 %, 72 h (Belcher 2019) | 8,6 | 1,6 | −7,0 |
| Banca 4 al fallo al 80 %, 24 h (Belcher 2019) | 0 | 3,1 | +3,1 |
| Peso muerto 4 al fallo al 80 %, 24 h (Belcher 2019) | 0 | 6,1 | +6,1 |
| Sentadilla 5 × 5 y una al fallo, hombres, 24 / 48 / 72 h (Davies 2018) | 10 / 6 / 3 | 8,1 / 4,2 / 2,1 | −1,9 / −1,8 / −0,9 |
| Sentadilla 10 × 5 al 80 %, 72 h (Thomas 2018) | 0 | 4,8 | +4,8 |
| Sentadilla Smith 5 × 10RM, 24 h [12] | 0 | 7,2 | +7,2 |
| Prensa 5 × 10RM, 24 h [12] | 0 | 7,2 | +7,2 |
| Sentadilla 3 × 4 de 8, 6 h y 24 h [2] | 0 y 0 | 7,9 y 4,8 | +7,9 y +4,8 |

- **Resumen:** 16 mediciones, error típico (RMSE) de 4,8 puntos, sesgo de +2,4, el peor de 7,9; a ±3 puntos, 6 de
  16. Con el ×1,5 del novato en Kotikangas, el error sube a 6,3 y el peor a 13,4. Con las mujeres de Davies 2018
  (20, 25 y 13 % a las 24, 48 y 72 h), el error sube a 7,5 y el peor a 20,8.
- **El orden:** la correlación de rangos entre lo que dice el modelo y lo medido es −0,11. Una constante (2,5 %,
  el promedio medido) erra 3,6; 3,9 dejando un punto afuera.
- **El mejor ajuste posible de la misma forma** (τ arriba y abajo, la caída, la escala de la dosis y el efecto del
  fallo, buscados para esos 16 puntos): 3,6 de error, 4,2 dejando un punto afuera. No hay una forma de elegir las
  constantes que vea algo que una constante no ve.
- **Lo que el modelo ordena al revés:**
  - Morán-Navarro 2017 [1]: el modelo da 8,1 % a las 24 h a 6 × 5 de 10 y 4,8 % a 3 × 10 de 10; el más lento
    fue 3 × 10 de 10. Con la reserva en la dosis (2.4 B) se ordenan bien (6 × 5 de 10, listo en ~10 h; 3 × 10
    de 10, en ~52 h).
  - Nuckols 2026 [13]: el modelo da al pecho 1,1 % a las 48 h (descansado); el estudio, abajo hasta las 72 h.
  - Kotikangas 2025 [12]: el modelo da 7,2 % (13,4 con el novato) a las 24 h; el estudio, nada.
- **Límites de la cuenta:** cada estudio mide otra cosa (velocidad, salto, fuerza isométrica o repeticiones), son
  ensayos chicos, y «0» quiere decir «sin diferencia significativa», no exactamente cero. Sirve para ver el orden
  de magnitud del error, no como evidencia.

### 2.4 Veredicto y la regla que se propone

**Veredicto:**
- La idea (más cerca del fallo y más repeticiones por serie, más fatiga y más larga; el multiarticular pesado de
  piernas, lo más lento) **se sostiene**.
- τ de 18 h y de 36 h: **a medias**. Están en el rango de los estudios, pero erran un día para los dos lados, y el
  tren superior al fallo puede tardar tres.
- La dosis contada en series: **a medias**. Sin la cercanía al fallo ordena mal.
- El ×1,5 del novato en la caída y en τ: **refutado en el tamaño** para series comunes [12]; la dirección se
  sostiene [5].
- Sin regla por sexo ni por edad: **se sostiene**.
- El porcentaje de fatiga como medida: **refutado**. Con estos datos no ordena mejor que una constante; sirve
  por dentro para elegir la palabra y el día, nunca para mostrarse.

**A. Lo que se muestra: en días, con una regla por casos (la propuesta principal).** Para cada músculo, con la
última sesión en que fue principal; las series de trabajo son las del 60 % del 1RM estimado o más, como hoy.

| Lo que hiciste con ese músculo | Probablemente listo | De dónde sale |
|---|---|---|
| Todas las series a 2 de reserva o más, hasta 9 series | al día siguiente | Evidencia: [2][6][7][8][11]. El corte de 9 series es derivado |
| 2 de reserva o más, con 10 series o más | en 2 días | Derivado (Thomas 2018: 10 × 5 resuelto a las 72 h, sin dato a las 48) |
| A 1 de reserva, o sin la reserva anotada | en 2 días | Evidencia: [1][6]; Soares 2015 (−8,4 % a las 24 h). Sin el dato se supone cerca del fallo, como hoy (convención prudente) |
| Al fallo, tren superior o monoarticulares | en 2 días (con muchas series, puede ser 3) | Evidencia: [3][6]; Soares 2015. Los 3 días, [13] |
| Al fallo, multiarticular de piernas o espalda baja (sentadilla, peso muerto, prensa, zancadas, hip thrust) | en 3 días | Evidencia: [1][2]; Belcher 2019, Davies 2018 y Korak 2015 |
| La primera vez con ese ejercicio en 26 semanas | un día más | Dirección: [28][29]; Nosaka 2001. El día es derivado |
| Lo volviste a entrenar antes de estar listo | se cuenta desde la última y un día más | Convención |

- **El error esperado:** ±1 día, a veces 2. Llega antes de lo que dice en [12] y en el peso muerto de Belcher 2019,
  y después en [13] y en Bartolomei 2017.
- **Los estados:** «cargado» si falta 2 días o más, «recuperándose» si falta 1, «descansado» si ya está. Es el
  mismo corte que hoy dan el 3 y el 10 % (Anexo A3), dicho en días.
- **Cómo se dice (en tú):** «Piernas: probablemente listas pasado mañana · 6 series el martes, la última al
  fallo». Siempre «según tus series en Ascent; puede variar un día» y, como hoy, «el dolor no cuenta».

**B. Si se quiere seguir con `residual()` por dentro** (para sumar sesiones seguidas o para el cuerpo dibujado),
estas constantes reproducen la tabla A (Anexo A3); ninguna es un valor publicado:

```
residual(m, t) = Σ sesiones  R0 · e^(−Δt/τ)
R0 = 30 % · (1 − e^(−D/8))                                  // como hoy (derivado)
D  = Σ series de trabajo · rol · e                           // rol: 1 principal, 0,5 si ayuda (Pelland 2026)
e  = 1 con 0 o 1 de reserva, o sin el dato; 0,4 con 2 o 3; 0,2 con 4 o más   // derivado de [1][2][6]
τ  = τm · s · f · n
τm = 30 h cuádriceps, glúteos, isquios, aductores y espalda baja con un multiarticular en la sesión;
     18 h el resto (y esos mismos, si solo hubo monoarticulares)               // derivado de [1][12], Korak 2015
s  = 1 + 0,5 · min(1, max(0, (series − 6) / 6))              // como hoy
f  = 1,5 si alguna serie fue al fallo (0 de reserva)         // [1][2][3]
n  = 1,25 con menos de 26 semanas en Ascent; 1,5 la primera vez con ese ejercicio en 26 semanas
     (solo en τ: la caída no se multiplica)                    // derivado de [5][12][28]
estado: menos de 3 % descansado; de 3 a 10 recuperándose; más de 10 cargado
listo: la primera hora con menos de 3 %, dicha en días
```

Con estas constantes el error contra los estudios no baja (4,9 de RMSE y 0,05 de correlación de rangos): lo que
cambia es que el orden por esfuerzo queda bien y que la regla coincide con la tabla A. Por eso se recomienda A: es
igual de precisa, se puede explicar en una línea y se prueba con casos.

**C. Lo único que puede bajar el error: lo de cada persona.** La respuesta de cada uno se repite (Chen 2006 [28])
y varía mucho entre personas [29]. Cuando el mismo ejercicio se repite dentro de las 96 h con el peso y las
repeticiones anotados, se compara el 1RM estimado de la mejor serie con la tendencia de esa persona (la de
`tendenciaDeFuerza()`): si sale más bajo que su ruido (σ tuyo) más de una vez, ese grupo suma medio día; si sale
igual o mejor, resta medio día. Pesa w = n / (n + 10), con n esas repeticiones del mismo ejercicio (derivado,
como la contracción de `rendimiento.md`). Sin 5 de esas parejas, la regla general.

---

## 3. ¿Un número o una franja para la fatiga? (pregunta 2)

Pedido del dueño: un puntaje por músculo de 0 a 200, con 100 como ideal y una franja de 90 a 110 («entrenado lo
suficiente para crecer y no tan fatigado que no rinda en la próxima»). Aquí, solo la mitad de la fatiga; la del
estímulo la estudia la sesión de Ascent.

### 3.1 A favor de un número

- Las palabras de probabilidad se entienden distinto: con «muy probable» y sin números al lado, la gente coincidía
  con el significado buscado el 32 % de las veces; con el número entre paréntesis, el 66 % (Wintle 2019 [34],
  924 personas).
- Los semáforos que usan los equipos funcionan, pero cada uno los arma distinto y piden reglas a la vista
  (Robertson 2017 [33]).

### 3.2 En contra de una franja angosta

- **El ruido de un día a otro.** El 1RM varía un 3,3 % en entrenados y un 5,5 % en no entrenados (Grgic 2020 [30],
  32 estudios); la fuerza isométrica de piernas, ~5 % entre dos días a la misma hora, y casi el triple a lo largo
  del día (Knaier 2019 [31], 19 entrenados; cuenta propia: 0,30 sobre 5,85 N/kg).
- **El error del modelo:** ~5 puntos contra los estudios y una correlación de rangos de cerca de 0 (2.3).
- **Lo que varía la persona:** con el mismo ejercicio, caídas del 18 al 58 % [29]; y el mismo puntaje de cómo se
  siente no quiere decir lo mismo en dos personas [81].
- **Los puntajes compuestos:** ninguno está validado contra el rendimiento y mezclar partes esconde cuál falla
  (Doherty 2025 [32], revisada el 5/11).

### 3.3 La cuenta (derivada, Anexo A2)

Suposición: 100 es «sin fatiga de más para la próxima sesión» y 110 es el primer cansancio que se podría notar, el
ruido de un día (~3 % de la fuerza). Cualquier borde más bajo que el ruido no se puede ver ni en la barra; uno más
alto ya deja pasar un rendimiento peor que lo normal.

| Lo que se suma | Error típico | Veces que lo verdadero cae entre 90 y 110 | Medio ancho para acertar el 80 % |
|---|---|---|---|
| Solo el ruido del día | 3,3 % | 64 % | ±4,2 % (±14 puntos) |
| Solo el modelo | 4,8 % | 47 % | ±6,2 % (±21 puntos) |
| Los dos | 5,8 % | 39 % | ±7,5 % (±25 puntos) |

Con esa escala (3 % = 10 puntos), una franja honesta del lado de la fatiga iría de 100 a ~125, y aun así con un
modelo que no ordena mejor que una constante. Con otra escala cambian los puntos, pero no la conclusión: el borde
de la franja tiene que estar más lejos que el error del modelo sumado al ruido.

### 3.4 Veredicto y la regla que se propone

- **La franja de 90 a 110 para la fatiga: refutada.** Es más angosta que lo que se puede medir.
- **Un número de 0 a 200: no conviene.** Da una precisión que no hay, y si mezcla el estímulo con la fatiga no se
  sabe qué mitad lo movió. Los números chicos sí sirven cuando son datos (series, días), no puntajes.
- **Lo que se propone:** dos señales separadas, que ya existen en la sección de Ascent en Progreso:
  1. **La carga de la semana:** las series duras contra la zona de 10 a 20 (la define la sesión de Ascent).
  2. **Listo para la próxima:** tres estados con palabra, color y día, de la tabla 2.4 A: «descansado», «se
     recupera · probablemente listo mañana» y «cargado · probablemente listo el jueves». El color acompaña, nunca
     va solo, y la frase dice de dónde sale («6 series el martes, la última al fallo»).
- Si el dueño quiere igual un número, que sea por dentro, en tramos de 25 o más y sin decimales, y que la pantalla
  muestre la palabra.

---

## 4. El sueño contra el rendimiento y contra lo que se gana (pregunta 3)

### 4.1 La sesión del día después

**A favor de que el sueño pesa:**
- Craven 2022 [37] (77 estudios, revisada el 5/11): con 6 h o menos, fuerza −2,85 % (−4,47 a −1,23) y
  repeticiones −9,85 % (−19,6 a −0,13); despertarse antes pesa más que acostarse tarde.
- Kong 2025 [38] (45 estudios, solo ensayos): fuerza máxima −0,57 DE cuando se corta el final de la noche
  (despertarse antes, como lo leyó en el texto el estudio del 5/11) y −0,30 DE si la prueba es a la tarde; en
  atletas, esfuerzo percibido +0,39 DE. Un autor trabaja para una empresa de colchones (revisada el 5/11).
- Gong 2024 [39] (27 estudios, 75 indicadores): en atletas, −0,56 DE en el rendimiento total, más cortando el
  final de la noche y más a la tarde. No separa la fuerza máxima en el resumen.
- Varias noches: Knowles 2018 [41] (17 estudios: bajan los multiarticulares y no los monoarticulares), Reilly y
  Piercy 1994 [44] (3 noches de 3 h) y Knowles 2022 [42] (10 mujeres entrenadas, 9 noches de 5 h en la cama: el
  volumen casi igual, la velocidad de piernas hasta −15 %, el esfuerzo de la sesión +11 %).

**En contra o con límites:**
- Easow 2025 [40] (revisión sistemática, 13 estudios): resultados mezclados; algunos sin diferencias después de
  una noche sin dormir.
- Haischer 2021 [45] (68 entrenados, 15 mujeres): los cuestionarios de sueño casi no predijeron el 1RM de
  sentadilla, y más horas de sueño se asociaron con una barra *más lenta*: lo observacional de un día es ruidoso.
- Craven 2022: el 89 % eran hombres, no separó por nivel y dejó afuera las noches seguidas.

### 4.2 Lo que se gana en semanas

**A favor:**
- Saner 2020 [47] (24 hombres; 5 noches de 4 h en la cama): síntesis de proteína miofibrilar 1,24 contra 1,53 % por
  día (−19 %); con ejercicio intenso en esos días se mantuvo.
- Lamon 2021 (revisada el 5/11): una noche sin dormir, −18 % de síntesis.
- Knowles 2024 [43] (10 mujeres entrenadas): sueño corto y fuerza interactúan en ~3.000 genes del músculo
  (mecanismo, no rendimiento).
- Con déficit: Nedeltcheva 2010 [49] (10 personas, 14 días, 5,5 contra 8,5 h de oportunidad de sueño): de la masa
  magra se perdió 2,4 kg contra 1,5 (+60 %) y de la grasa, 0,6 contra 1,4; Wang 2018 [50] (36 personas, 8
  semanas, ~1 h menos 5 noches por semana): mismo peso perdido, pero menos de él fue grasa.

**En contra:**
- Borba 2024 [46] (12 que duermen ~5 h 47 por noche contra 12 que duermen ~7 h 16, 16 sesiones): las repeticiones
  y el área del brazo subieron igual. Grupos no aleatorios, de ~40 años.
- No hay un ensayo de semanas de sueño corto contra hipertrofia o fuerza en gente entrenada (se buscó; el estudio
  del 5/11 llegó a lo mismo con Knowles 2018).

### 4.3 Veredicto y la regla que se propone

- **Una noche corta:** **se sostiene** que cuestan más las repeticiones y que se siente más pesado; la fuerza
  máxima casi no cambia. Despertarse antes, más.
- **Varias noches:** **se sostiene** para los multiarticulares y el esfuerzo percibido.
- **Lo que se gana en semanas:** **sin evidencia directa**; el mecanismo apunta en contra del sueño corto y un
  estudio chico no lo vio. Con déficit, **a medias**: dos ensayos chicos muestran más pérdida de masa magra.
- **La regla:**
  - Noche de 6 h o menos, o despertarte 1 h o más antes de lo de siempre: «Puedes entrenar. Dormiste poco: las
    repeticiones pueden costar más. Sin ir al fallo, y si la primera serie se siente más pesada, quédate con el
    peso de la última vez». Es lo que ya hace `titularDeHoy()`; la parte del peso es nueva (convención prudente).
  - 2 de las últimas 3 noches de 6 h o menos: lo mismo, más «se nota más en los ejercicios grandes de piernas»
    [41][42].
  - Promedio de 7 noches por debajo de 6 h **y** bajando de peso: una nota en el progreso, no en el día: «Dormir
    poco mientras bajas de peso puede hacer que pierdas más músculo» [49][50]. El corte de 6 h es convención.
  - Nunca: «perdiste X % de lo ganado», ni un número de sueño dentro de la fatiga del músculo.

---

## 5. La comida contra el rendimiento y contra lo que se gana (pregunta 4)

### 5.1 Antes de entrenar y los días anteriores

**A favor de que pese:**
- King 2022 [51] (21 estudios, revisada el 5/11): los carbohidratos antes suben el volumen +0,61 DE; +1,02 en
  sesiones de más de 45 min y +0,39 después de 8 h o más sin comer.
- Hamidvand 2025 [56] (20 estudios): una sesión baja el glucógeno del cuádriceps, más con más series y sesiones
  más largas.

**En contra (lo nuevo pesa):**
- King 2025 [52] (16 entrenados, cruzado): después de más de 10 h de ayuno, 1,2 g/kg, 0,3 g/kg o un placebo 2 h
  antes de ~90 min de sentadilla, banca, remo y press hasta el fallo: las mismas repeticiones (p = 0,318). Es
  justo el caso del subgrupo de King 2022 (8 h o más, más de 45 min) y no se repitió. Límites: 3 series por
  ejercicio, sobre todo tren superior, y 9 de 16 adivinaron el placebo.
- Stratton 2024 [53] (39 entrenados, 19 mujeres): desayunar o no, con el mismo total a la hora de entrenar a la
  tarde, no cambió las repeticiones ni la velocidad en sentadilla, banca y peso muerto al 80 %.
- Henselmans 2022 [54] (revisada el 5/11): ninguno de 7 estudios de 2 a 7 días con más o menos carbohidratos
  cambió la fuerza.
- Vieira 2025 [57] (4 estudios, 3 con riesgo alto de sesgo): entrenar en ayunas o comido, la misma fuerza a lo
  largo de semanas. Vargas-Molina 2024 [58]: la dieta cetogénica no bajó el 1RM en entrenados.
- Ormsbee 2022 [65] (18 entrenados): 40 g de caseína antes de dormir no cambiaron el 1RM de la mañana siguiente.

### 5.2 Lo que se gana en semanas

**A favor de que pese:**
- Murphy y Koehler 2022 [59] (metaanálisis de ensayos de 3 semanas o más): en déficit, la masa magra crece menos
  (−0,57, p = 0,02); con más de ~500 kcal por día de déficit, no crece.
- Oxfeldt 2023 [61] (30 mujeres entrenadas, 10 días, 25 contra 50 kcal por kg de masa magra, con 2,2 g/kg de
  proteína): baja disponibilidad de energía, menos síntesis de proteína y menos masa magra.
- Nunes 2022 [64] (74 ensayos): más proteína, algo más de masa magra con entrenamiento (+0,22 DE, evidencia
  moderada), desde 1,6 g/kg en menores de 65; algo más de fuerza de piernas (evidencia baja). Tres autores
  declararon honorarios o fondos de los consejos de la carne y de los lácteos de EE. UU. o de empresas de
  nutrición, lo pagó el International Life Science Institute (Europa) y el grupo de expertos tuvo miembros de la
  industria. Morton 2018 [63]: la ganancia se aplana en ~1,6 g/kg.

**En contra:**
- Murphy y Koehler 2022 [59]: la fuerza ganada **no** cayó en déficit (−0,31, p = 0,28).
- Roth 2023 [60] (38 entrenados, 6 semanas a 30 kcal/kg y 2,8 g/kg de proteína por kg de masa magra): la masa magra
  bajó poco (−0,5 y −0,9 kg), la contractilidad se mantuvo y el volumen siguió subiendo, con 3 o 5 series.
- Henselmans 2026 [55] (20 entrenados, cruzado de 2 × 8 semanas): +485 kcal y +33 g de carbohidratos por día no
  cambiaron la masa magra, el grosor, el 1RM ni la resistencia.
- Klemp 2025 [66] (30 mayores): 40 g de proteína después de entrenar o antes de dormir no sumaron nada con 1 g/kg
  o más de base.

### 5.3 Veredicto y la regla que se propone

- **Comer antes de entrenar:** **a medias**. En quien ya comió en el día, casi no cambia la sesión; después de
  un ayuno largo y en sesiones largas, la evidencia se contradice (King 2022 contra King 2025).
- **Los carbohidratos o las calorías de ayer:** **refutado** para la sesión de hoy.
- **El déficit:** **se sostiene** que frena la masa magra; **refutado** que frene la fuerza ganada.
- **La proteína del día:** **se sostiene** para lo que se gana en semanas (como promedio, no por día); no cambia la
  sesión siguiente.
- **La regla:**
  - Nada de lo que se comió cambia la fatiga ni el «listo» de un músculo.
  - `porLaComida()` (`rendimiento.ts:287-294`): el ayuno de 8 h deja de restar (hoy −5 en volumen en una sesión
    larga, línea 290). Queda, si se quiere, como sugerencia antes de una sesión de 10 series o más por músculo, y
    solo si esa comida se suele anotar: «Si vas a entrenar mucho rato, comer algo antes puede ayudarte a sostener
    las repeticiones». Los carbohidratos de ayer y el 80 % de las calorías de ayer salen: no hay evidencia.
  - Para lo de semanas, en el estancamiento y en el progreso (lo que ya proponía el estudio del 5/11): bajar más
    de ~1 % por semana o un déficit de más de ~500 kcal por día, «la fuerza suele mantenerse, el músculo crece
    menos» [59]; la proteína promedio de la semana contra ~1,6 g/kg [63][64].

---

## 6. La regla del dueño: subir el peso según el sueño y la comida (pregunta 5)

Lo pedido: «si comiste bien y dormiste bien, la próxima puedes subir el peso; si comiste mal, mantén el peso»,
cruzado con la reserva (RIR) de cada serie.

### 6.1 Qué la sostiene

- **El sueño:** tras una noche corta cuestan más las repeticiones y se siente más pesado [37][38]: intentar subir
  justo ese día tiene más chances de salir mal.
- **La comida, a largo plazo:** el déficit grande y la baja disponibilidad de energía frenan la masa magra
  [59][61].
- **Subir según lo que pasó en las series funciona:** progresar por reserva o RPE da la misma fuerza que los
  porcentajes, o algo más (Hickmott 2022 [72]: +2,07 kg, IC −0,32 a 4,46, 15 estudios; Helms 2018 [71]: 21
  entrenados, una ventaja chica para el RPE); Graham y Cleather 2021 [70] (31 entrenados, 12 semanas): +11,7 % de
  sentadilla frontal con la reserva contra +8,3 % con porcentajes fijos; en un metaanálisis en red, la
  progresión autorregulada por repeticiones (APRE) salió primera (Huang 2025 [73], 19 ensayos, 438 personas;
  es un orden de probabilidades con ensayos chicos, y en sentadilla ninguna diferencia fue moderada o grande).

### 6.2 Qué la refuta

- **La comida de un día no cambia la sesión siguiente** [52][53][54], y **el déficit no frena la fuerza ganada**
  [59]: «comiste mal, mantén el peso» frena sin motivo.
- **No hay un solo estudio** que haya probado subir o mantener según el sueño o la comida (se buscó). Regular el
  volumen por cómo se sentía la persona no dio más fuerza ni más músculo (Bartolomei 2024 [74], 24 entrenados,
  10 semanas), y dejar elegir la sesión del día rindió igual que el plan fijo (Colquhoun 2017 [75], 25
  entrenados).
- **El efecto del sueño ya está en la barra:** si dormiste mal y no llegas a las repeticiones, la regla por
  repeticiones no sube; si llegas igual, estás más fuerte. Sumar el sueño como compuerta aparte agrega «no» sin
  dato nuevo.
- **La autorregulación no es mejor que progresar bien:** en Graham y Cleather [70], los porcentajes fijos salían
  del 1RM del principio y no subían en 12 semanas, así que la ventaja puede ser de progresar y no de la reserva
  (lectura propia). El ACSM 2026 [68] dice que no hay datos suficientes sobre la autorregulación dentro de la
  sesión, que no hay evidencia para fijar la reserva exacta, que propone 2 o 3 de reserva y que progresar no hace
  falta para mejorar, sí para seguir mejorando a largo plazo.
- **La reserva que dice la persona tiene error:** ±0,65 repeticiones en banca a 1 y 3 de reserva en entrenados
  (Refalo 2024 [76]), pero 2 a 5 repeticiones en sentadilla al 70 % con series largas (Zourdos 2021 [77]); en
  promedio, la gente cree que le queda una menos de las que le quedan (Halperin 2022 [78], revisada el 5/11).
- **Subir el peso o las repeticiones da casi lo mismo:** 43 entrenados, 8 semanas: +2,0 kg de 1RM a favor de subir
  el peso (IC −2,4 a 7,8) y algo más de músculo subiendo repeticiones (Plotkin 2022 [69]; un autor asesora a un
  fabricante de máquinas).

### 6.3 Qué es convención y qué es evidencia

| Parte | Qué es |
|---|---|
| Hace falta aumentar el estímulo para seguir progresando | Evidencia (consenso del ACSM 2026 [68]) |
| Subir el peso o las repeticiones | Evidencia: dan casi lo mismo [69] |
| Decidir por la reserva o el RPE en vez de porcentajes | Evidencia: igual o algo mejor [70][71][72][73] |
| Subir cuando se hacen 1 o 2 repeticiones de más, de 2 a 10 % | Convención del ACSM 2009 [67] (no es un ensayo) |
| El rango de repeticiones (la doble progresión) y el tamaño del salto | Convención |
| La reserva objetivo de 2 o 3 | Consenso sin un número probado [68] |
| Frenar por el sueño de anoche | Sin estudios; tiene una base indirecta [37][38] |
| Frenar por la comida de ayer o de los días siguientes | Refutado para la fuerza [52][53][54][59] |

### 6.4 Veredicto y la regla que se propone

**Veredicto:** la parte de la comida, **refutada**; la del sueño, **a medias** (tiene sentido no intentar subir
el día de una noche corta, no frenar la progresión). Lo que decide es lo que hizo la persona en las series.

**La regla (doble progresión con la reserva; convención con apoyo [67][68][69][72]):**
1. Cada ejercicio tiene un rango de repeticiones (por ejemplo, de 6 a 10) y una reserva objetivo de 1 a 3.
2. **Sube** la próxima vez cuando en la última sesión todas las series de trabajo llegaron al tope del rango con la
   reserva objetivo o más. Cuánto: el salto más chico que tenga la barra o la máquina, entre un 2 y un 5 %
   (dentro del 2 a 10 % del ACSM 2009; el 2 a 5 % es convención).
3. **Mantén** si no llegaste al tope en todas: la meta es sumar repeticiones con el mismo peso.
4. **Baja de 5 a 10 %** si dos sesiones seguidas no llegaste al piso del rango o llegaste al fallo antes de lo
   previsto (convención).
5. **El día de una noche corta** (6 h o menos, o despertarte 1 h o más antes): no se sugiere subir ese día; «prueba
   con el peso de la última vez; si las series salen con la reserva de siempre, sube la próxima». No cambia la
   cuenta de la regla.
6. **La comida no frena.** En déficit, se dice que la meta es mantener la fuerza y que subir menos seguido es
   normal [59]; no se bloquea el aumento.
7. **Sin la reserva anotada:** la misma regla solo con las repeticiones.

*Tests propuestos:* con todas las series en el tope a 2 de reserva, sube; con una por debajo, mantiene; con una
noche de 5 h 30 y todo en el tope, sube igual la próxima y ese día dice «prueba con el peso de la última vez»;
con la comida de ayer en el 60 % de la meta, el resultado no cambia.

---

## 7. Cómo se siente uno contra los marcadores (pregunta 6)

### 7.1 A favor de preguntarlo

- Saw 2016 [79] (56 estudios): lo que la persona dice responde a la carga mejor y con más constancia que los
  marcadores objetivos (sangre, pulso), y casi no se correlaciona con ellos.
- Tolusso 2022 [81] (11 entrenados, 8 × 10 de sentadilla): la escala de recuperación percibida siguió al salto
  (r = 0,84) y a la velocidad de la barra (r = 0,80) dentro de cada persona durante 72 h.
- Sikorski 2013 [82] (35 entrenados): la recuperación percibida bajó de 8,6 a 4,2 de 10 a las 48 h de una sesión de
  mucho volumen, en sentido contrario a la CK.
- El esfuerzo de la serie acompaña a la velocidad de la barra (r de −0,79 a −0,87 en powerlifters: Helms 2017 [85],
  revisada el 5/11).

### 7.2 En contra

- Duignan 2020 [80] (21 estudios): las preguntas de una sola línea (dolor, fatiga, sueño, ánimo) tienen
  relaciones de triviales a moderadas con la carga en los estudios más grandes.
- Tolusso 2022 [81]: el mismo número no quiere decir la misma recuperación en dos personas.
- Bell 2025 [83] (8 entrenados, 5 días de sentadilla con sobrecarga y 14 de descarga): la recuperación percibida
  cayó un 41,5 % al tercer día y volvió recién a los 14 días; el 1RM ya estaba +4,8 % a los 7. La sensación fue
  atrasada.
- Munteanu 2026 [84] (28 mujeres entrenadas, dos mesociclos con cada serie medida): «qué tan lista te sientes» no
  se asoció con la velocidad de la barra; las ganas de entrenar sí, pero poco (unos 0,02 m/s entre la mitad y el
  tope de la escala, cuenta propia con su β).
- Bartolomei 2024 [74]: ajustar el volumen por la recuperación percibida no dio más fuerza ni más músculo.
- Haischer 2021 [45]: los cuestionarios de estrés y de sueño casi no predijeron el 1RM.
- Los puntajes de relojes y anillos no están validados [32], y guiar la fuerza por la variabilidad del pulso no
  rindió más (Bittencourt 2024, revisada el 5/11).

### 7.3 Veredicto y la regla que se propone

- **Preguntar cómo se siente uno:** **a medias**. Sirve como tendencia propia y para detectar una semana pesada;
  no para decidir el peso solo, ni para comparar con otros.
- **La mejor guía para la próxima sesión:** la primera serie de trabajo con un peso conocido: cuántas repeticiones
  salen y con qué reserva. Es el dato que integra el sueño, la comida y la fatiga del día [76][85].
- **La regla:**
  - «¿Cómo te sientes para entrenar?» de 0 a 10, opcional y de un toque, al abrir la sesión (lo que ya proponía
    el estudio del 5/11).
  - Se compara solo con la mediana propia de las últimas 4 semanas, con 8 respuestas o más. Si está 3 puntos o
    más por debajo: «Hoy dices sentirte peor que de costumbre: empieza con el peso de la última vez y decide con la
    primera serie». El 3 es convención.
  - Si la primera serie de trabajo sale con 2 repeticiones de reserva menos que la última vez con el mismo peso:
    «Hoy cuesta más: mantén el peso y no vayas al fallo» (convención; el error de la reserva dicha es de ~1
    repetición en entrenados [76]).
  - Lo que dice la persona nunca cambia por sí solo el «listo» del músculo ni la regla de subir.

---

## 8. Lo que el modelo actual tiene que cambiar

Separado en arreglos claros y decisiones del dueño. Todo lo nuevo va primero a la galería, con la regla pura en
`src/dominio/` y sus tests.

**Arreglos claros (no dependen de lo que se decida):**
1. **El ×1,5 del novato sale de la caída inicial** (`musculos.ts:290`, `caidaInicial(d.dosis) * (opciones.novato ?
   1.5 : 1)`): lo contradice [12]. Queda, si se quiere, ×1,25 solo en τ. *Test:* novato, 5 series de sentadilla a
   2 de reserva, no da «cargado» a las 24 h.
2. **La primera vez con un ejercicio en 26 semanas suma un día** (o τ × 1,5 en esa sesión), por el efecto de la
   sesión repetida [28][29]; Nosaka 2001. *Test:* el mismo bloque, con y sin una sesión de ese ejercicio en las 26
   semanas anteriores, difiere en un día de `cuandoListo()`.
3. **El esfuerzo de cada serie entra en la dosis cuando Ascent mande la reserva** (`esfuerzoDeSerie()`,
   `musculos.ts:215-218`, hoy 1 o 0): 1 con 0 o 1 de reserva, 0,4 con 2 o 3, 0,2 con 4 o más; sin el dato, 1.
   *Test:* 3 × 10 de 10 al fallo queda listo después que 6 × 5 de 10 (Morán-Navarro 2017 [1]).
4. **El índice de 0 a 100 de `fatiga.ts`** (`indiceDeFatiga()`, líneas 20-24, y `FATIGA_TOPE`) y **`porElMusculo()`**
   (`rendimiento.ts:297`: −0,5 y −1 por punto de fatiga) salen: el porcentaje no ordena mejor que una constante
   (2.3). *Test:* ningún texto de `ascent.*` muestra un % de fatiga.
5. **`porLaComida()`** (`rendimiento.ts:287-294`): sacar el −5/−2 del ayuno de 8 h, el −3 de los carbohidratos de
   ayer y el −1 del 80 % de las calorías de ayer [52][53][54]; queda, si se quiere, el −1/−2 de bajar más de 1 %
   por semana como explicación del estancamiento, no del día.

**Decisiones del dueño:**
1. **Cómo se calcula «listo»:** la regla por casos de 2.4 A (recomendada) o `residual()` con las constantes de
   2.4 B. Las dos tienen el mismo error (±1 día); la A se explica sola. *Tests (A en días desde la sesión; B en
   horas):* 6 series de sentadilla a 2 de reserva, al día siguiente (B: 36 h o menos); 4 al fallo, en 3 días (B:
   de 48 a 84 h); 6 de banca a 3 de reserva, al día siguiente (B: 24 h o menos); 6 de banca al fallo, en 2 días
   (B: de 36 a 60 h).
2. **La franja de 90 a 110 y el puntaje de 0 a 200:** se recomienda no hacerlos del lado de la fatiga y mostrar
   las dos señales separadas (3.4). Si va el número, por dentro y en tramos de 25 o más.
3. **La regla de subir el peso:** la doble progresión con la reserva de 6.4, sin la comida como compuerta y con
   el sueño solo como aviso del día. La implementación es de Ascent.
4. **«¿Cómo te sientes para entrenar?»:** como tendencia propia (7.3). Suma un toque.
5. **Lo personal (2.4 C):** calibrar cada grupo con las repeticiones del mismo ejercicio dentro de las 96 h. Es lo
   único que puede bajar el error de un día.
6. **Lo que no cambia:** sin regla por sexo ni por edad; el dolor no cuenta; la fatiga se dice en días y con
   «probablemente».

**Lo que no se dice:**
- «Estás al 87 %», «fatiga 2 %», «listo en 14 h» o «90 de 110».
- Que una mala noche o una mala comida «te hicieron perder» lo ganado.
- Que comer antes de entrenar te va a dar más repeticiones (con la evidencia de hoy, es «puede ayudar» y solo en
  sesiones largas).
- Que las mujeres o los mayores se recuperan distinto.
- Que lo que sientes vale más que lo que hiciste en la serie.

---

## 9. Fuentes

Leídas el 19/11/2026, salvo las marcadas «(revisada el 5/11)», que vienen del estudio de esa fecha
([`ascent.md`](ascent.md) o [`../rendimiento.md`](../rendimiento.md)) y no se volvieron a abrir.

**El curso en el tiempo y lo que lo cambia**
1. Morán-Navarro R y otros. 2017. *Time course of recovery following resistance training leading or not to
   failure.* Eur J Appl Physiol 117(12):2387-2399. https://doi.org/10.1007/s00421-017-3725-7 — resumen.
2. González-Badillo JJ y otros. 2016. *Short-term Recovery Following Resistance Exercise Leading or not to
   Failure.* Int J Sports Med 37(4):295-304. https://doi.org/10.1055/s-0035-1564254 — resumen.
3. Pareja-Blanco F y otros. 2020. *Time Course of Recovery From Resistance Exercise With Different Set
   Configurations.* J Strength Cond Res 34(10):2867-2876. https://doi.org/10.1519/jsc.0000000000002756 — resumen.
4. Pareja-Blanco F y otros. 2019. *Time Course of Recovery Following Resistance Exercise with Different Loading
   Magnitudes and Velocity Loss in the Set.* Sports 7(3):59. https://doi.org/10.3390/sports7030059 — resumen.
5. Pareja-Blanco F, Rodríguez-Rosell D, González-Badillo JJ. 2019. *Time course of recovery from resistance
   exercise before and after a training program.* J Sports Med Phys Fitness 59(9):1458-1465.
   https://doi.org/10.23736/s0022-4707.19.09334-4 — resumen.
6. Refalo MC y otros. 2023. *Influence of Resistance Training Proximity-to-Failure, Determined by
   Repetitions-in-Reserve, on Neuromuscular Fatigue in Resistance-Trained Males and Females.* Sports Med Open 9:10.
   https://doi.org/10.1186/s40798-023-00554-y — resumen (las cifras a las 24 h, revisadas el 5/11).
7. Mangine GT y otros. 2022. *Effect of the Repetitions-In-Reserve Resistance Training Strategy on Bench Press
   Performance, Perceived Effort, and Recovery in Trained Men.* J Strength Cond Res 36(1):1-9.
   https://doi.org/10.1519/jsc.0000000000004158 — resumen.
8. Cowley N y otros. 2025. *The Effects of Percentage-Based, Rating of Perceived Exertion, Repetitions in Reserve,
   and Velocity-Based Training on Performance and Fatigue Responses.* J Strength Cond Res 39(4):e516-e529.
   https://doi.org/10.1519/jsc.0000000000005026 — resumen.
9. Varela-Olalla D, Del Campo-Vecino J, Balsalobre-Fernández C. 2025. *Influence of Proximity to Failure, Relative
   Intensity, and Volume on Voluntary Performance and Fatigue Symptoms After Resistance Training: A Systematic
   Review.* J Strength Cond Res 39(9):e1129-e1168. https://doi.org/10.1519/jsc.0000000000005194 — resumen.
10. Vieira JG y otros. 2026. *Acute fatigue and recovery responses to resistance training performed to momentary
    muscular failure: an exploratory multimodal physiological study.* Sci Rep.
    https://doi.org/10.1038/s41598-026-59113-6 — resumen.
11. Páez-Maldonado JA y otros. 2026. *Effects of Bench Press Volume on Performance, Recovery, and Physiological
    Response.* Sports 14(2):76. https://doi.org/10.3390/sports14020076 — resumen.
12. Kotikangas J y otros. 2025. *Acute neuromuscular fatigue, hormonal responses, and recovery in males during
    high-volume resistance exercises: Smith machine back squat vs horizontal leg press.* Eur J Appl Physiol
    125(10):2921-2938. https://doi.org/10.1007/s00421-025-05793-3 — resumen y texto (PMC12479625: participantes,
    resultados escritos y límites; las cifras por hora están solo en una figura).
13. Nuckols GL y otros. 2026. *The effects of biological sex on fatigue during and recovery from resistance
    exercise.* PeerJ 14:e20542. https://doi.org/10.7717/peerj.20542 — texto (PMC12790778: resultados, financiación
    y límites; el tamaño de la caída por hora está solo en una figura).
14. Belcher DJ y otros. 2019. *Time course of recovery is similar for the back squat, bench press, and deadlift in
    well-trained males.* Appl Physiol Nutr Metab 44(10):1033-1042. https://doi.org/10.1139/apnm-2019-0004 —
    (revisada el 5/11).
15. Soares S y otros. 2015. *Dissociated Time Course of Muscle Damage Recovery Between Single- and Multi-Joint
    Exercises in Highly Resistance-Trained Men.* J Strength Cond Res 29(9):2594-2599.
    https://doi.org/10.1519/jsc.0000000000000899 — (revisada el 5/11).
16. Davies RW, Carson BP, Jakeman PM. 2018. *Sex Differences in the Temporal Recovery of Neuromuscular Function
    Following Resistance Training in Resistance Trained Men and Women 18 to 35 Years.* Front Physiol 9:1480.
    https://doi.org/10.3389/fphys.2018.01480 — (revisada el 5/11).
17. Thomas K y otros. 2018. *Neuromuscular Fatigue and Recovery after Heavy Resistance, Jump, and Sprint
    Training.* Med Sci Sports Exerc 50(12):2526-2535. https://doi.org/10.1249/MSS.0000000000001733 — (revisada el
    5/11).
18. Bartolomei S y otros. 2017. *Comparison of the recovery response from high-intensity and high-volume
    resistance exercise in trained men.* Eur J Appl Physiol 117(7):1287-1298.
    https://doi.org/10.1007/s00421-017-3598-9 — (revisada el 5/11).
19. Korak JA, Green JM, O'Neal EK. 2015. *Resistance Training Recovery: Considerations for Single vs. Multi-joint
    Movements and Upper vs. Lower Body Muscles.* Int J Exerc Sci 8(1):85-96.
    https://digitalcommons.wku.edu/ijes/vol8/iss1/10 — (revisada el 5/11).
20. Amdi CH, Fyfe J, Yoon S, Nuckols G, Refalo M. 2025. *Biological sex differences in fatigue in
    resistance-trained individuals: A scoping review.* Int J Sports Med 46(11):809-816.
    https://doi.org/10.1055/a-2563-9449 — resumen.
21. Lewis MH y otros. 2022. *Sex Differences May Exist for Performance Fatigue but Not Recovery After Single-Joint
    Upper-Body and Lower-Body Resistance Exercise.* J Strength Cond Res 36(6):1498-1505.
    https://doi.org/10.1519/jsc.0000000000004239 — resumen.
22. Amdi CH, Cleather DJ, Tallent J. 2021. *Impact of Training Protocols on Lifting Velocity Recovery in Resistance
    Trained Males and Females.* Sports 9(11):157. https://doi.org/10.3390/sports9110157 — resumen y resultados
    escritos (PMC8618037).
23. Hayes EJ y otros. 2023. *Recovery from Resistance Exercise in Older Adults: A Systematic Scoping Review.*
    Sports Med Open 9:51. https://doi.org/10.1186/s40798-023-00597-1 — resumen.
24. Fernandes JFT y otros. 2021. *Aging and Recovery After Resistance-Exercise-Induced Muscle Damage: Current
    Evidence and Implications for Future Research.* J Aging Phys Act 29(3):544-551.
    https://doi.org/10.1123/japa.2020-0201 — resumen.
25. Li DCW y otros. 2024. *Age-Associated Differences in Recovery from Exercise-Induced Muscle Damage.* Cells
    13(3):255. https://doi.org/10.3390/cells13030255 — resumen.
26. Newton MJ y otros. 2008. *Comparison of responses to strenuous eccentric exercise of the elbow flexors between
    resistance-trained and untrained men.* J Strength Cond Res 22(2):597-607.
    https://doi.org/10.1519/jsc.0b013e3181660003 — (revisada el 5/11).
27. Nosaka K y otros. 2001. *How long does the protective effect on eccentric exercise-induced muscle damage
    last?* Med Sci Sports Exerc 33(9):1490-1495. https://doi.org/10.1097/00005768-200109000-00011 — (revisada el
    5/11).
28. Chen TC. 2006. *Variability in muscle damage after eccentric exercise and the repeated bout effect.* Res Q Exerc
    Sport 77(3):362-371. https://doi.org/10.1080/02701367.2006.10599370 — resumen.
29. Damas F, Nosaka K, Libardi CA, Chen TC, Ugrinowitsch C. 2016. *Susceptibility to Exercise-Induced Muscle
    Damage: a Cluster Analysis with a Large Sample.* Int J Sports Med 37(8):633-640.
    https://doi.org/10.1055/s-0042-100281 — resumen.

**El ruido, los puntajes y cómo decir la incertidumbre**
30. Grgic J y otros. 2020. *Test-Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a
    Systematic Review.* Sports Med Open 6:31. https://doi.org/10.1186/s40798-020-00260-z — (revisada el 5/11).
31. Knaier R y otros. 2019. *Diurnal and day-to-day variations in isometric and isokinetic strength.* Chronobiol
    Int 36(11):1537-1549. https://doi.org/10.1080/07420528.2019.1658596 — resumen.
32. Doherty C y otros. 2025. *Readiness, recovery, and strain: an evaluation of composite health scores in consumer
    wearables.* Transl Exerc Biomed 2(2):128-144. https://doi.org/10.1515/teb-2025-0001 — (revisada el 5/11).
33. Robertson S, Bartlett JD, Gastin PB. 2017. *Red, Amber, or Green? Athlete Monitoring in Team Sport: The Need for
    Decision-Support Systems.* Int J Sports Physiol Perform 12(Suppl 2):S273-S279.
    https://doi.org/10.1123/ijspp.2016-0541 — resumen.
34. Wintle BC y otros. 2019. *Verbal probabilities: Very likely to be somewhat more confusing than numbers.* PLoS
    One 14(4):e0213522. https://doi.org/10.1371/journal.pone.0213522 — resumen.
35. van der Bles AM y otros. 2019. *Communicating uncertainty about facts, numbers and science.* R Soc Open Sci
    6(5):181870. https://doi.org/10.1098/rsos.181870 — (revisada el 5/11).
36. Pelland JC y otros. 2026. *The Resistance Training Dose Response.* Sports Med 56(2):481-505.
    https://doi.org/10.1007/s40279-025-02344-w — (revisada el 5/11; el rol de 0,5 para los músculos que ayudan).

**El sueño**
37. Craven J y otros. 2022. *Effects of Acute Sleep Loss on Physical Performance: A Systematic and
    Meta-Analytical Review.* Sports Med 52(11):2669-2690. https://doi.org/10.1007/s40279-022-01706-y — (revisada
    el 5/11).
38. Kong Y y otros. 2025. *Effects of sleep deprivation on sports performance and perceived exertion in athletes
    and non-athletes: a systematic review and meta-analysis.* Front Physiol 16:1544286.
    https://doi.org/10.3389/fphys.2025.1544286 — resumen (el texto, revisado el 5/11).
39. Gong M y otros. 2024. *Effects of Acute Sleep Deprivation on Sporting Performance in Athletes: A Comprehensive
    Systematic Review and Meta-Analysis.* Nat Sci Sleep 16:935-948. https://doi.org/10.2147/nss.s467531 — resumen.
40. Easow J y otros. 2025. *Implications of sleep loss or sleep deprivation on muscle strength: a systematic
    review.* Sleep Breath 29(4):242. https://doi.org/10.1007/s11325-025-03413-0 — resumen.
41. Knowles OE y otros. 2018. *Inadequate sleep and muscle strength: implications for resistance training.* J Sci
    Med Sport 21(9):959-968. https://doi.org/10.1016/j.jsams.2018.01.012 — (revisada el 5/11).
42. Knowles OE y otros. 2022. *Sustained Sleep Restriction Reduces Resistance Exercise Quality and Quantity in
    Females.* Med Sci Sports Exerc 54(12):2167-2177. https://doi.org/10.1249/mss.0000000000003000 — (revisada el
    5/11).
43. Knowles OE y otros. 2024. *The interactive effect of sustained sleep restriction and resistance exercise on
    skeletal muscle transcriptomics in young females.* Physiol Genomics 56(7):506-518.
    https://doi.org/10.1152/physiolgenomics.00010.2024 — resumen.
44. Reilly T, Piercy M. 1994. *The effect of partial sleep deprivation on weight-lifting performance.* Ergonomics
    37(1):107-115. https://doi.org/10.1080/00140139408963628 — (revisada el 5/11).
45. Haischer MH y otros. 2021. *Impact of Cognitive Measures and Sleep on Acute Squat Strength Performance and
    Perceptual Responses Among Well-Trained Men and Women.* J Strength Cond Res 35(Suppl 1):S16-S22.
    https://doi.org/10.1519/jsc.0000000000003202 — resumen.
46. Borba DA y otros. 2024. *Could a Habitual Sleep Restriction of One-two Hours Be Detrimental to the Benefits of
    Resistance Training?* Sleep Sci 17(3):e244-e254. https://doi.org/10.1055/s-0044-1787297 — resumen.
47. Saner NJ y otros. 2020. *The effect of sleep restriction, with or without high-intensity interval exercise, on
    myofibrillar protein synthesis in healthy young men.* J Physiol 598(8):1523-1536.
    https://doi.org/10.1113/jp278828 — resumen.
48. Lamon S y otros. 2021. *The effect of acute sleep deprivation on skeletal muscle protein synthesis and the
    hormonal environment.* Physiol Rep 9(1):e14660. https://doi.org/10.14814/phy2.14660 — (revisada el 5/11).
49. Nedeltcheva AV y otros. 2010. *Insufficient sleep undermines dietary efforts to reduce adiposity.* Ann Intern
    Med 153(7):435-441. https://doi.org/10.7326/0003-4819-153-7-201010050-00006 — resumen.
50. Wang X y otros. 2018. *Influence of sleep restriction on weight loss outcomes associated with caloric
    restriction.* Sleep 41(5). https://doi.org/10.1093/sleep/zsy027 — resumen.

**La comida**
51. King A y otros. 2022. *The Ergogenic Effects of Acute Carbohydrate Feeding on Resistance Exercise Performance:
    A Systematic Review and Meta-analysis.* Sports Med 52(11):2691-2712. https://doi.org/10.1007/s40279-022-01716-w
    — (revisada el 5/11).
52. King A, Jukic I, Sousa CA, Zinn C, Helms ER. 2025. *Isoenergetic Pre-Exercise Meals Varying in Carbohydrate
    Similarly Affect Resistance Training Volume Performance Compared to Placebo: A Crossover Trial.* Eur J Sport
    Sci 25(3):e12274. https://doi.org/10.1002/ejsc.12274 — resumen y métodos (PMC11874534).
53. Stratton MT y otros. 2024. *No Effect of Breakfast Consumption Observed for Afternoon Resistance Training
    Performance in Habitual Breakfast Consumers and Nonconsumers: A Randomized Crossover Trial.* J Acad Nutr Diet
    124(8):995-1013. https://doi.org/10.1016/j.jand.2023.09.008 — resumen.
54. Henselmans M y otros. 2022. *The Effect of Carbohydrate Intake on Strength and Resistance Training
    Performance: A Systematic Review.* Nutrients 14(4):856. https://doi.org/10.3390/nu14040856 — (revisada el
    5/11).
55. Henselmans M y otros. 2026. *Effects of Modest Carbohydrate-Energy Supplementation on Resistance Training
    Adaptations in Trained Men: A Crossover Trial.* Nutrients 18(12):1961. https://doi.org/10.3390/nu18121961 —
    resumen y declaraciones (sin financiación externa ni conflictos).
56. Hamidvand A y otros. 2025. *Acute effects of resistance exercise on skeletal muscle glycogen depletion: A
    systematic review and meta-analysis.* Physiol Rep 13(24):e70683. https://doi.org/10.14814/phy2.70683 — resumen.
57. Vieira AF y otros. 2025. *Resistance training performed in the fasted state compared to the fed state on body
    composition and strength in adults: A systematic review with meta-analysis.* J Bodyw Mov Ther 45:99-109.
    https://doi.org/10.1016/j.jbmt.2025.08.003 — resumen.
58. Vargas-Molina S y otros. 2024. *Effects of the Ketogenic Diet on Strength Performance in Trained Men and Women:
    A Systematic Review and Meta-Analysis.* Nutrients 16(14):2200. https://doi.org/10.3390/nu16142200 — resumen.
59. Murphy C, Koehler K. 2022. *Energy deficiency impairs resistance training gains in lean mass but not strength:
    A meta-analysis and meta-regression.* Scand J Med Sci Sports 32(1):125-137. https://doi.org/10.1111/sms.14075 —
    resumen.
60. Roth C y otros. 2023. *Resistance training volume does not influence lean mass preservation during energy
    restriction in trained males.* Scand J Med Sci Sports 33(1):20-35. https://doi.org/10.1111/sms.14237 — resumen.
61. Oxfeldt M y otros. 2023. *Low energy availability reduces myofibrillar and sarcoplasmic muscle protein
    synthesis in trained females.* J Physiol 601(16):3481-3497. https://doi.org/10.1113/jp284967 — resumen.
62. Garthe I y otros. 2011. *Effect of two different weight-loss rates on body composition and strength and
    power-related performance in elite athletes.* Int J Sport Nutr Exerc Metab 21(2):97-104.
    https://doi.org/10.1123/ijsnem.21.2.97 — (revisada el 5/11).
63. Morton RW y otros. 2018. *A systematic review, meta-analysis and meta-regression of the effect of protein
    supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.* Br J
    Sports Med 52(6):376-384. https://doi.org/10.1136/bjsports-2017-097608 — (revisada el 5/11).
64. Nunes EA y otros. 2022. *Systematic review and meta-analysis of protein intake to support muscle mass and
    function in healthy adults.* J Cachexia Sarcopenia Muscle 13(2):795-810. https://doi.org/10.1002/jcsm.12922 —
    resumen y declaraciones (PMC8978023).
65. Ormsbee MJ y otros. 2022. *Pre-sleep protein supplementation after an acute bout of evening resistance
    exercise does not improve next day performance or recovery in resistance trained men.* J Int Soc Sports Nutr
    19(1):164-178. https://doi.org/10.1080/15502783.2022.2036451 — resumen.
66. Klemp AO y otros. 2025. *Neither pre-sleep nor post-exercise protein consumption influences resistance
    exercise training adaptations in older adults.* J Int Soc Sports Nutr 22(1):2519511.
    https://doi.org/10.1080/15502783.2025.2519511 — resumen.

**Subir la carga**
67. American College of Sports Medicine. 2009. *Progression models in resistance training for healthy adults.* Med
    Sci Sports Exerc 41(3):687-708. https://doi.org/10.1249/mss.0b013e3181915670 — resumen.
68. Currier BS y otros (ACSM). 2026. *Resistance Training Prescription for Muscle Function, Hypertrophy, and
    Physical Performance in Healthy Adults: An Overview of Reviews.* Med Sci Sports Exerc 58(4):851-872.
    https://doi.org/10.1249/mss.0000000000003897 — texto (Europe PMC, PMC12965823: lo de progresión, fallo,
    reserva y autorregulación).
69. Plotkin D y otros. 2022. *Progressive overload without progressing load? The effects of load or repetition
    progression on muscular adaptations.* PeerJ 10:e14142. https://doi.org/10.7717/peerj.14142 — resumen y
    declaraciones (un autor asesora a Tonal, fabricante de máquinas).
70. Graham T, Cleather DJ. 2021. *Autoregulation by "Repetitions in Reserve" Leads to Greater Improvements in
    Strength Over a 12-Week Training Program Than Fixed Loading.* J Strength Cond Res 35(9):2451-2456.
    https://doi.org/10.1519/JSC.0000000000003164 — resumen (del repositorio de St Mary's University:
    https://research.stmarys.ac.uk/id/eprint/3067; PubMed no lo trae).
71. Helms ER y otros. 2018. *RPE vs. Percentage 1RM Loading in Periodized Programs Matched for Sets and
    Repetitions.* Front Physiol 9:247. https://doi.org/10.3389/fphys.2018.00247 — resumen.
72. Hickmott LM y otros. 2022. *The Effect of Load and Volume Autoregulation on Muscular Strength and Hypertrophy: A
    Systematic Review and Meta-Analysis.* Sports Med Open 8:9. https://doi.org/10.1186/s40798-021-00404-9 — resumen.
73. Huang Z y otros. 2025. *Autoregulated resistance training for maximal strength enhancement: A systematic review
    and network meta-analysis.* J Exerc Sci Fit 23(4):360-369. https://doi.org/10.1016/j.jesf.2025.07.006 — resumen
    y métodos (PMC12336695).
74. Bartolomei S y otros. 2024. *Autoregulation Does Not Provide Additional Benefits to a Mixed Session Periodized
    Resistance Training Program in Trained Men.* J Strength Cond Res 38(9):1535-1542.
    https://doi.org/10.1519/jsc.0000000000004836 — resumen.
75. Colquhoun RJ y otros. 2017. *Comparison of Powerlifting Performance in Trained Men Using Traditional and
    Flexible Daily Undulating Periodization.* J Strength Cond Res 31(2):283-291.
    https://doi.org/10.1519/jsc.0000000000001500 — resumen.
76. Refalo MC y otros. 2024. *Accuracy of Intraset Repetitions-in-Reserve Predictions During the Bench Press
    Exercise in Resistance-Trained Male and Female Subjects.* J Strength Cond Res 38(3):e78-e85.
    https://doi.org/10.1519/jsc.0000000000004653 — resumen.
77. Zourdos MC y otros. 2021. *Proximity to Failure and Total Repetitions Performed in a Set Influences Accuracy of
    Intraset Repetitions in Reserve-Based Rating of Perceived Exertion.* J Strength Cond Res 35(Suppl 1):S158-S165.
    https://doi.org/10.1519/jsc.0000000000002995 — resumen.
78. Halperin I y otros. 2022. *Accuracy in Predicting Repetitions to Task Failure in Resistance Exercise: A Scoping
    Review and Exploratory Meta-analysis.* Sports Med 52(2):377-390. https://doi.org/10.1007/s40279-021-01559-x —
    (revisada el 5/11).

**Lo que se siente**
79. Saw AE, Main LC, Gastin PB. 2016. *Monitoring the athlete training response: subjective self-reported measures
    trump commonly used objective measures: a systematic review.* Br J Sports Med 50(5):281-291.
    https://doi.org/10.1136/bjsports-2015-094758 — resumen (el texto, revisado el 5/11).
80. Duignan C y otros. 2020. *Single-Item Self-Report Measures of Team-Sport Athlete Wellbeing and Their
    Relationship With Training Load: A Systematic Review.* J Athl Train 55(9):944-953.
    https://doi.org/10.4085/1062-6050-0528.19 — resumen.
81. Tolusso DV y otros. 2022. *The Validity of Perceived Recovery Status as a Marker of Daily Recovery Following a
    High-Volume Back-Squat Protocol.* Int J Sports Physiol Perform 17(6):886-892.
    https://doi.org/10.1123/ijspp.2021-0360 — resumen.
82. Sikorski EM y otros. 2013. *Changes in perceived recovery status scale following high-volume muscle damaging
    resistance exercise.* J Strength Cond Res 27(8):2079-2085. https://doi.org/10.1519/jsc.0b013e31827e8e78 —
    resumen.
83. Bell L y otros. 2025. *Effects of a 5-Day Back Squat Overreaching Protocol on Strength Performance, Perceived
    Recovery and Wellness Responses: A Pilot Trial.* J Funct Morphol Kinesiol 10(2):227.
    https://doi.org/10.3390/jfmk10020227 — resumen.
84. Munteanu G y otros. 2026. *The Effect of Menstrual Cycle Phase, Symptoms, Motivation, and Readiness to Perform
    on Resistance Training Performance.* Sports Med 56(9):2325-2339. https://doi.org/10.1007/s40279-026-02459-8 —
    resumen y partes del texto (PMC13499881: métodos de las escalas, resultados y declaraciones).
85. Helms ER y otros. 2017. *RPE and Velocity Relationships for the Back Squat, Bench Press, and Deadlift in
    Powerlifters.* J Strength Cond Res 31(2):292-297. https://doi.org/10.1519/jsc.0000000000001517 — (revisada el
    5/11).

**Lo que se buscó y no se encontró:** un metaanálisis del curso en el tiempo de la recuperación después de una
sesión de fuerza (las revisiones de 2024 a 2026 son de intervenciones como el frío o la compresión); un ensayo de
semanas de sueño corto contra hipertrofia o fuerza en gente entrenada; un estudio que pruebe subir o mantener la
carga según el sueño o la comida; y la confiabilidad de las repeticiones hasta el fallo de un día a otro. El
tamaño de la caída por hora de Nuckols 2026 y de Kotikangas 2025 está solo en figuras que no se pudieron leer.

---

## Anexo: las cuentas propias (derivadas)

Son ilustraciones con supuestos a la vista, no evidencia. Se hicieron en Node, sin dependencias.

**A1. El modelo contra los estudios.** El modelo es el de `musculos.ts` (`caidaInicial()`, `porLasSeries()` y
`residual()`), con esfuerzo 1 en cada serie de trabajo y sin «al fallo», como corre en la app. Cada medición es la
caída del estudio en %, positiva si todavía está por debajo de lo suyo; «recuperado» o «sin caída» cuentan como 0.
Los datos:

| Protocolo | Músculo (τ) | Series y reserva supuesta | Horas: medido |
|---|---|---|---|
| Curl 8 × 10RM (Soares 2015) | bíceps, principal (18 h) | 8 al fallo | 24: 8,4 |
| Remo 8 × 10RM (Soares 2015) | bíceps, ayuda (18 h) | 8 al fallo, rol 0,5 | 24: 0 |
| Banca 6 al 75 % [6] | pecho (18 h) | 6 a 0, a 1 y a 3 de reserva | 24: 3, 3 y −2 |
| Sentadilla 4 al 80 % (Belcher 2019) | piernas (36 h) | 4 al fallo | 72: 8,6 |
| Banca 4 al 80 % (Belcher 2019) | pecho (18 h) | 4 al fallo | 24: 0 |
| Peso muerto 4 al 80 % (Belcher 2019) | piernas (36 h) | 4 al fallo | 24: 0 |
| Sentadilla 5 × 5 al 80 % y una al fallo (Davies 2018) | piernas (36 h) | 5 a 4 de reserva y 1 al fallo | hombres 24/48/72: 10/6/3; mujeres 20/25/13 (aparte) |
| Sentadilla 10 × 5 al 80 % (Thomas 2018) | piernas (36 h) | 10 a 4 de reserva | 72: 0 |
| Sentadilla Smith y prensa 5 × 10RM [12] | piernas (36 h), sin plan de fuerza | 5 al fallo | 24: 0 y 0 |
| Sentadilla 3 × 4 de 8 [2] | piernas (36 h) | 3 a 4 de reserva | 6: 0; 24: 0 |

Resultados: la tabla de 2.3. La correlación de rangos es la de Spearman entre las 16 predicciones y las 16
mediciones. «Una constante» es el promedio de las 16 mediciones (2,5 %), y «dejando uno afuera» es su error
prediciendo cada punto con el promedio de los otros 15. «El mejor ajuste» buscó en una grilla τ arriba de 6 a 48 h,
τ abajo de 12 a 72 h, la caída máxima de 10 a 40 %, la escala de la dosis de 2 a 12 y el efecto del fallo de 1 a 2,
con y sin la reserva; el mejor da 3,6 y, rehecho 16 veces dejando un punto afuera, 4,2.

**A2. La franja.** Si el modelo erra con un desvío σ (normal, sin sesgo), la chance de que lo verdadero caiga a
±3 % de lo que dice es 2Φ(3/σ) − 1, y el medio ancho para acertar el 80 % es 1,2816 σ. Con σ = 3,3 (el ruido de un
día [30]), 4,8 (el modelo, A1) y √(4,8² + 3,3²) = 5,8 (los dos) salen 64, 47 y 39 %, y ±4,2, ±6,2 y ±7,5 %. A 10
puntos por cada 3 %, ±14, ±21 y ±25 puntos.

**A3. Las constantes de 2.4 B contra la tabla de 2.4 A.** Con τ de 30 h en las piernas con un multiarticular y 18
en el resto, el esfuerzo en 1, 0,4 y 0,2, el fallo ×1,5 y el umbral de 3 %: sentadilla 6 series a 2 de reserva,
listo en 29 h; 5 a 1 de reserva, 47 h; 4 al fallo, 62 h; 10 a 2 de reserva, 55 h; 3 × 10 de 10, 52 h; 6 × 5 de 10,
10 h; banca 6 a 3 de reserva, 18 h; 6 al fallo, 45 h; curl 8 al fallo, 59 h. Contra los 16 puntos de A1: 4,9 de
error, sesgo +1,9, 6 de 16 a ±3 puntos y 0,05 de correlación de rangos. Con los cortes de hoy (3 y 10 %), 10 % a
esas constantes cae entre 1 y 2 días antes de estar listo, por eso «cargado» es «faltan 2 días o más».
