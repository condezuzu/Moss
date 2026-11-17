# La deuda de sueño, la necesidad, la ventana para dormirse y el sueño con el teléfono: la evidencia

Informe del 17/11/2026. Área: **rehacer la deuda de sueño y sumar el «periodo de melatonina»**.

Leí antes `spec/sueno.md`, `spec/estudio/sueno.md` y `spec/estudio/momentos.md` (entero, con la sección 10) para
no repetir. Lo que esos documentos ya verificaron lo cito como «ya en la spec» y no lo vuelvo a desarrollar.

**Cómo verifiqué.** Los resúmenes, en Europe PMC (su API, leídos textuales). Los textos completos de acceso
abierto, bajados de Europe PMC y buscados por mí en el archivo. Los que solo están en PMC, con la herramienta
de lectura (que resume la página: los números de esas fuentes me llegaron por ella, y los crucé con el resumen
cuando se podía). SAFTE, Abdullah 2014 y Toss 'N' Turn, del PDF. En «Fuentes» dice de cada una qué leí:
**[T]** texto completo o las partes citadas, **[R]** solo el resumen. Lo que no pude confirmar está marcado
**«no confirmado»** en el lugar y juntado al final. Las cuentas mías dicen «cuenta mía» o «derivado»; lo que
no sale de ningún estudio dice «convención».

---

## 0. Resumen

1. **La forma de la cuenta de hoy no es el problema.** Catorce noches con más peso a lo reciente es lo que
   hace el único modelo validado que publica su constante: el Unified Model of Performance del ejército de
   EE. UU. (la base de 2B-Alert) usa una constante de **7,0 ± 1,7 días** para que la deuda suba y baje
   (Ramakrishnan 2016). Un núcleo exponencial con τ = 7 noches suma 6,5 «noches equivalentes» en 14 noches; la
   rampa lineal de Moss suma 7,5. Es casi lo mismo.
2. **El problema es lo que se multiplica por ese 6,5–7,5:** (necesidad − sueño) de cada noche. Media hora de
   error sistemático por noche son 3 h 15 a 3 h 45 de deuda. Para que dos apps den 16 h 30 y 4 h basta que
   difieran **1 h 40 por noche** en esa resta: se llega con 30–45 minutos de necesidad y una hora de cómo se
   mide el sueño.
3. **8 h contra sueño medido le da deuda a casi todo el mundo.** Las guías (7 a 9 h) salen de sueño
   *declarado*, que es una hora más que el medido (422 contra 363 min por polisomnografía en 2.113 adultos,
   Silva 2007; 6,8 contra 6,0 h por actigrafía, Lauderdale 2008). En los ensayos y en los modelos del
   ejército, las «8 h» de referencia son **8 h en la cama**, que son unas 7 h 25 a 7 h 30 dormido (Kitamura
   2016; Banks 2010). La necesidad varía entre personas con un desvío de 40 a 50 minutos (Kitamura 2016;
   Ursin 2005).
4. **La deuda no es una suma lineal que se paga hora por hora.** En 14 días crece casi en línea recta si no
   hay ninguna noche de recuperación (Van Dongen 2003), pero con faltas moderadas se estabiliza (Belenky 2003;
   McCauley 2009), una noche larga no alcanza (Banks 2010) y varias tampoco del todo (Belenky 2003; Pejovic
   2013; Yamazaki 2021; Ochab 2021). A la vez, no hay que devolver todas las horas: una falta crónica de
   ~1 h por noche se recuperó en ~4 noches largas (Kitamura 2016).
5. **Fórmula propuesta:** el promedio pesado por e^(−i/7) de lo que faltó cada noche, con lo que sobra
   contando hasta 1 h y lo que falta hasta 3 h (2 h si la noche es estimada con el teléfono y sin confirmar),
   por 6,5, entre 0 y «15 h o más». Con ella, dormir justo lo necesario baja la deuda a la mitad en ~4
   noches y a cero en 14 (el modelo predice 14 noches de 8 h), y cuatro noches con una hora de más borran
   una falta de 1 h por noche (lo que vio Kitamura).
6. **La necesidad: preguntar y estimar, las dos.** No hay método validado en casa. Lo defendible: preguntarla
   al entrar («¿cuántas horas necesitas para sentirte descansado?»), proponer un ajuste con el historial
   (las noches libres desde la segunda seguida, o el percentil 75 de todas) dentro del rango de la edad, y
   que la persona lo confirme. De fábrica, 8 h *en la cama* (7 h 30 dormido) es más defendible que 8 h
   dormido.
7. **La ventana para dormirse:** el inicio de la melatonina (DLMO) cae en promedio **2 a 3 h antes de
   dormirse** y unas 13,5 a 14 h después de despertarse (Burgess y Eastman 2005, n = 120; Burgess 2003;
   Sletten 2010). Estimación: **DLMO ≈ punto medio del sueño de las últimas 7 noches − 6 h 30**; la ventana,
   de DLMO + 2 h a DLMO + 3 h. El margen honesto es de **±1 h** (un desvío): acierta dentro de una hora en
   el 74 a 92 % de jóvenes sanos con horario libre, y bastante menos con horarios impuestos o turnos.
8. **No hay evidencia de que la «ventana» dure una hora ni de que se cierre.** Lo que hay es una zona de
   2 a 3 h *antes* del DLMO en la que cuesta dormirse (Lavie 1986; Strogatz 1987; Shekleton 2013) y una
   «puerta» que se abre de golpe y queda abierta. Acostarse antes de la ventana es lo que da problema;
   acostarse después solo acorta la noche (y, con luz, corre el reloj).
9. **El despertar tarde sí corre el reloj, y ahora hay número:** dormir 2 h más tarde viernes y sábado lo
   atrasó 32 min (Yang 2001); despertarse 3 h más tarde el fin de semana, 45 min (Crowley y Carskadon 2010);
   3 h más tarde durante dos semanas, 2,4 h (Burgess y Eastman 2006). O sea, una cuarta parte en un fin de
   semana y casi todo si se sostiene. El promedio de 7 noches reproduce eso solo. (`momentos.md` §10 decía
   que no había estudio; de una sola mañana sigue sin haber.)
10. **Solo con el teléfono:** ningún método está validado contra polisomnografía. Contra relojes, el error
    típico de una noche es de ~40 min en la duración y el del promedio de dos semanas, de ~24 min (Sahha
    2026, de la empresa); por 6,5 son ~2 h 30 de deuda, más la duda de la necesidad: **±4 h**. Alcanza para
    decir «al día / algo / bastante», no para distinguir 4 h de 7 h. El sesgo no tiene una sola dirección:
    depende de la persona y es estable en cada una (Massar 2021), así que se puede aprender.

---

## 1. La deuda de sueño

### 1.1 Lo que muestran los experimentos

| Estudio | Qué hicieron | Qué pasó | Qué dice sobre la cuenta |
|---|---|---|---|
| Van Dongen 2003 (n = 48) | 14 días con 4, 6 u 8 h en la cama; aparte, 3 noches sin dormir | Con 4 y 6 h, déficit acumulativo según la dosis, equivalente a «hasta 2 noches» sin dormir; la somnolencia percibida casi no lo acompañó. Los lapsos crecieron casi en línea recta con las horas despierto por encima de 15,84 h por día (e.e. 0,73 h) | Sin noches de recuperación en el medio, **acumula casi lineal durante 14 días**. La persona no lo nota |
| Belenky 2003 (n = 66) | 7 días con 3, 5, 7 o 9 h en la cama; después, 3 noches de 8 h | Con 3 h empeoró día a día. Con 5 y 7 h cayó y **se estabilizó** en un nivel más bajo. Tres noches de 8 h no devolvieron a ninguno de los tres grupos restringidos al punto de partida | Con faltas moderadas **satura**; recuperar lleva más de 3 noches normales |
| Dinges 1997 (n = 16) | 7 noches de 4,98 h (33 % menos que lo habitual) | Efectos acumulativos, sin llegar a un estado estable; en un subgrupo, recuperar pareció pedir dos noches completas | Acumula en una semana |
| Banks 2010 (n = 159) | 5 noches de 4 h en la cama y **una** noche de 0 a 10 h | Mejora con la dosis, pero con 10 h en la cama (8,96 h dormido) quedaron déficits en atención, somnolencia y fatiga. Extrapolando, los autores estiman ~10,7 h en la cama para los lapsos y ~15 h para la latencia (intervalos muy anchos) | **Una noche larga no alcanza**; la recuperación crece con las horas |
| Pejovic 2013 (n = 30) | 6 noches de 6 h; 3 noches de 10 h | La somnolencia y la IL-6 volvieron; el rendimiento en atención, no | Un fin de semana largo recupera lo que se siente, no todo lo que se mide |
| Yamazaki 2021 (n = 83) | 5 noches de 4 h o 36 h sin dormir; 4 noches de 12 h en la cama | Casi todo se recuperó en la primera noche; los lapsos y la velocidad en atención, no del todo ni con cuatro | Lo último en volver es la atención sostenida |
| Ochab 2021 | 10 días con 30 % menos de sueño, en casa; 7 días de recuperación | A los 7 días solo un indicador había vuelto | Una semana puede no alcanzar |
| Lamond 2007 (n = 30) | 1 o 2 noches sin dormir; 5 noches de 9 h o de 6 h | Tras una noche, una de 9 h alcanzó; con 6 h no se recuperó nunca; tras dos noches, ni con cinco de 9 h | Para recuperar hay que dormir **al menos** la necesidad |
| Kitamura 2016 (n = 15 hombres, 20–26) | 9 noches con 12 h en la cama | La primera durmieron 10,59 h (3,2 h más que en casa); bajó hasta una asíntota de 8,41 h (7,29–9,26) hacia la cuarta noche. Deuda «potencial»: 1,04 h por noche (−0,58 a 2,73). El rebote de la primera noche se correlacionó con esa deuda (r = 0,77) | Una falta crónica de ~1 h por noche **se paga en ~4 noches** con mucho menos que todas las horas perdidas |
| Klerman y Dijk 2005 (n = 17) | 16 h de oportunidad por día, 3 días | El primer día durmieron 4,9 h más que su tiempo habitual en la cama; el exceso bajó en los tres días, y los que dormían menos en casa seguían durmiendo más | Quien duerme poco lleva más deuda; el rebote la delata |
| Rupp 2009 (n = 24); Arnal 2015 (n = 14) | Una semana con 10 h en la cama antes de restringir o privar | Menos caída después y recuperación más rápida | Lo que sobra **sirve algo** («banco»); los autores hablan de mecanismos de «días a semanas» |
| Harrison y Horne 1996 (n = 10) | 14 noches con hasta 10 h en la cama | Durmieron ~1 h más, con peor latencia y más despertares; casi ningún beneficio | En quien duerme 7,5 h, **dormir de más rinde poco**: lo que sobra tiene techo |
| Depner 2019 (n = 36), ya en la spec | Semana corta, fin de semana libre, otra semana corta | El fin de semana devolvió ~1,1 h de más de 12 perdidas y no evitó el daño metabólico | No se paga hora por hora |

La revisión más reciente (Guzzetti y Banks 2023) lo resume igual: la recuperación depende de si la pérdida fue
aguda o crónica, cada medida vuelve a su ritmo, e importa tanto el largo de cada noche como cuántas noches hay.

**Cuánto «cuesta» recuperar (cuenta mía, con los números de arriba).** En Kitamura, el exceso sobre el óptimo
fue de ~2,2 h la primera noche (10,59 − 8,41) y llegó a cero hacia la cuarta: en total, del orden de
**4 a 7 h de sueño extra** para una falta de ~1 h por noche sostenida por semanas (el artículo no da el total;
el rango sale de suponer una caída exponencial con constante de 1,5 a 2,5 noches). O sea: la deuda «pagable»
es de unas 4 a 7 veces la falta diaria, no la falta por todas las noches vividas.

### 1.2 Los modelos publicados que pesan por recencia

| Modelo | Cómo lleva la deuda | Constantes publicadas | Fuente |
|---|---|---|---|
| **SAFTE** (ejército y fuerza aérea de EE. UU.) | Un depósito de 2.880 unidades. Despierto se gastan 0,5 por minuto (se vacía en 4 días sin dormir). Dormido se repone a una intensidad que **crece con la deuda**: SI = circadiano + f·(capacidad − nivel) | f = 0,0026564 por minuto (constante de ~375 min de sueño); intensidad máxima 4,4 unidades/min (permite equilibrio con solo 3 h por día). Para la restricción crónica: la capacidad se reduce despacio y se repone más despacio todavía (k1 = 0,22; k2 = 0,5; k3 = 0,0015), f pasa a 0,00312 y el máximo a 3,4 | Hursh 2004 [T] |
| **SPM** de Walter Reed | Recarga exponencial durante el sueño | Tras el estudio de Belenky, la constante de recuperación pasó de ~375 a **~1.300 min de sueño** (unas 2,7 noches de 8 h) | Hursh 2004 [T] |
| **UMP / 2B-Alert** | El modelo de dos procesos con una asíntota inferior que sube y baja con la deuda; lo reciente pesa más | **τ_LA = 7,00 días (e.e. 1,67)** para la subida y la bajada de la deuda; la deuda va de 1 (sin dormir nada) a un mínimo de −0,11, que corresponde a 8,9 h por día, así que el cero cae en 8 h por día (cuenta mía: 1 − 3 × 8,9/24 = −0,11); el modelo se alimenta con el horario de cama de cada estudio. Simulación: tras 7 noches de 3 h, recuperación completa con **5 noches de 10 h** en la cama o **14 noches de 8 h**; tras 64 h sin dormir, 3 de 10 h o 10 de 8 h | Rajdev 2013 [R]; Ramakrishnan 2016 [T]; Reifman 2016 [R] |
| **McCauley** (Universidad Estatal de Washington) | Dos ecuaciones acopladas: el estado y un proceso lento que corre el equilibrio | Bifurcación en **20,2 h despierto por día** (menos de 3,8 h de sueño): por debajo, el déficit converge a un equilibrio; por encima, se dispara. Las constantes para volver al equilibrio son «del orden de semanas» | McCauley 2009 [T]; McCauley 2013 [R] |

Lo que tienen en común, y que sirve para una app:

- **Ninguno suma horas en línea recta sin olvido.** Todos son sistemas de primer orden: la deuda sube hacia un
  equilibrio y, si se duerme lo necesario, baja sola. Eso es un promedio con pesos exponenciales.
- **La escala es de una semana** (UMP: 7 ± 1,7 días; SPM: ~3 noches para el proceso rápido; McCauley y Rupp:
  días a semanas).
- **Lo que sobra tiene techo**: en UMP la deuda no baja de lo que corresponde a 8,9 h por día, la capacidad
  máxima de sueño de los jóvenes (Klerman y Dijk 2008: 8,9 h de 18 a 32 años; 7,4 h de 60 a 76).
- **Las «8 h» de referencia son un horario de 8 h en la cama** (la condición de control de Van Dongen 2003 y
  la recuperación de Belenky 2003; lo que se le carga a UMP), no 8 h dormido: con 8 h en la cama se duermen
  unas 7 h 25 (7,39 h en la noche de base de Kitamura 2016; 7,51 h en Banks 2010, después de restringir).
- La ecuación exacta de la deuda de UMP está en una tabla que la página muestra como imagen: la forma
  («subida y bajada exponencial» con τ_LA) la leí en el texto; los coeficientes, **no confirmados**.

### 1.3 Respuestas cortas

- **¿La deuda es la suma lineal de lo que faltó?** Solo durante una restricción continua de hasta dos semanas
  y medida en rendimiento (Van Dongen 2003). Con faltas moderadas satura (Belenky 2003; McCauley 2009), y en
  cuanto hay noches normales empieza a bajar. Además, una noche sin dormir pesa mucho más que las mismas
  horas repartidas (Van Dongen 2003): «horas perdidas» no es una moneda única.
- **¿Cuánto se recupera con noches largas?** Bastante la primera noche (lo que se siente vuelve casi todo:
  Yamazaki 2021; Pejovic 2013) y lento después (la atención sostenida tarda días: Belenky 2003; Banks 2010).
  No hace falta devolver todas las horas (Kitamura 2016), y dormir más de una hora por encima de la necesidad
  casi no se logra ni rinde (Harrison y Horne 1996; Klerman y Dijk 2008).
- **¿7 o 14 días?** Catorce, con pesos que caen con τ ≈ 7 noches. Con ese τ, las últimas 7 noches llevan el
  73 % del peso y las 14, el 100 % de lo que se cuenta (el 86 % del núcleo infinito; cuenta mía). Una ventana
  de 7 noches sin pesos se olvida demasiado de golpe y es más ruidosa (para un promedio estable de sueño
  medido hacen falta más de 7 noches: Aili 2017, ya en la spec).
- **¿Rise?** No pude abrir su centro de ayuda (403). Del extracto del buscador: ventana móvil de 14 noches, lo
  reciente pesa más, las siestas cuentan y la necesidad sale de hasta un año de uso del teléfono con un modelo
  propio. La fórmula y los pesos: **no confirmados**. Si es así, su núcleo se parece al de Moss y la
  diferencia de 16 h 30 a 4 h viene de la necesidad (aprendida de la persona) y de cómo mide cada noche.

### 1.4 Por qué da 16 h 30: la sensibilidad

Deuda ≈ (noches equivalentes) × (necesidad − sueño medio pesado). Con 7,5 noches (hoy) o 6,5 (propuesta):

| Falta por noche | Deuda hoy (×7,5) | Deuda propuesta (×6,5) |
|---|---|---|
| 15 min | 1 h 50 | 1 h 40 |
| 30 min | 3 h 45 | 3 h 15 |
| 37 min | 4 h 40 | 4 h |
| 1 h | 7 h 30 | 6 h 30 |
| 1 h 30 | 11 h 15 | 9 h 45 |
| 2 h 12 | 16 h 30 | 14 h 20 |

- 16 h 30 son **2 h 12 por noche** contra 8 h: un sueño medio de 5 h 48. Las 4 h de Rise serían 32 a 37 min
  por noche.
- De dónde puede salir 1 h 40 de diferencia por noche, con fuentes:
  - **La necesidad**: 8 h fija contra una aprendida. El desvío entre personas es de ~0,7 h (Kitamura 2016:
    e.e. 0,18 h con n = 15; cuenta mía) y la necesidad declarada a los 40–45 años es de 7 h 16 (hombres) y
    7 h 45 (mujeres), ± 52 min (Ursin 2005, n = 8.860).
  - **La moneda**: 8 h es tiempo en la cama o sueño declarado; el medido es 45 a 60 min menos (Silva 2007;
    Lauderdale 2008). La media medida por actigrafía en 669 adultos de la cohorte CARDIA fue de 6,0 h
    (Lauderdale 2008): con 8 h de necesidad, **el adulto medio de esa cohorte tendría 2 h por noche de
    «deuda»**, unas 13 a 15 h.
  - **La medición sin reloj**: Moss resta 31 + 18 + 30 = 79 min a la ventana quieta. Sahha mide que la
    ventana sola exagera el sueño en 89 min *en promedio*, pero con un error de una noche de ±2 h 20 (límites
    del 95 %) y un sesgo por persona que no se promedia (sección 4).
  - **Las noches sin datos**: hoy se supone que fueron como las medidas. Si las medidas son las peores
    (entre semana), la cuenta exagera.

### 1.5 La fórmula propuesta

```
N    = necesidad de la persona, en minutos de SUEÑO (sección 2)
s_i  = sueño de la noche i más las siestas (i = 0 es anoche; hasta i = 13)
f_i  = lo que faltó: N − s_i, acotado a [−60, +180]
        (+120 si la noche es estimada con el teléfono y no está confirmada)
c_i  = cuánto cuenta la noche: 1 con reloj o anillo, o confirmada por la persona;
        0,5 estimada con confianza media o alta; 0 sin datos o con confianza baja
w_i  = e^(−i/7)

porNoche = Σ c_i·w_i·f_i / Σ c_i·w_i          (con 5 noches o más que cuenten)
deuda    = 6,5 · porNoche, entre 0 y 15 h («15 h o más»)        6,5 = Σ e^(−i/7), i = 0…13
```

De dónde sale cada número:

| Pieza | Valor | Fundamento | Fuerza |
|---|---|---|---|
| Pesos e^(−i/7) | τ = 7 noches | τ_LA = 7,00 ± 1,67 d (Ramakrishnan 2016); «días a semanas» (Rupp 2009; McCauley 2009) | **Derivado** de un modelo validado en laboratorio |
| 14 noches | 86 % del núcleo | Con τ = 7 (cuenta mía); más de 7 noches para un promedio estable (Aili 2017) | Derivado |
| Lo que sobra, hasta 60 min | −60 | El piso de la deuda en UMP es lo de 8,9 h/día; capacidad máxima 8,9 h en jóvenes y 7,4 h en mayores (Klerman y Dijk 2008); con 10 h en la cama solo se duerme ~1 h más (Harrison y Horne 1996) | Derivado. Hoy son 120 |
| Lo que falta, hasta 180 min | +180 | Los ensayos de restricción crónica van de 3 a 6 h en la cama; una noche medida de menos de ~5 h es tanto una noche corta como una medición cortada (el Apple Watch perdió o cortó 15 de 35 noches en Schyvens 2025, ya en la spec) | **Convención** |
| Sin reloj y sin confirmar, hasta 120 min y con medio peso | +120; c = 0,5 | El 13,5 % de las noches estimadas con el teléfono tiene un borde errado en más de 2 h (Sahha 2026) | Convención |
| Tope de 15 h | «15 h o más» | El peor protocolo crónico equivale a «hasta 2 noches» sin dormir (Van Dongen 2003), unas 16 h de sueño; por encima no hay referencia en gente sana que hace su vida | Convención |
| Piso 0 | — | El «banco» existe pero es chico (Rupp 2009; UMP: −0,11 contra 1) | Derivado |

Comprobaciones (cuentas mías, para los tests):

- **Falta constante**: 1 h cada noche da 6 h 30.
- **Recuperación sin dormir de más**: partiendo de 6 h 30 y con noches justas (f = 0), la deuda va
  6,5 → 5,5 → 4,6 → 3,9 → 3,2 → 2,7 h … y llega a cero a las 14 noches: a la mitad en ~4 noches. UMP predice
  14 noches de 8 h para la recuperación completa; Belenky vio que 3 no alcanzan (acá, a las 3 queda el 60 %).
- **Recuperación durmiendo 1 h de más**: partiendo de 6 h 30, va 6,5 → 4,5 → 2,8 → 1,3 → 0: **cuatro noches**
  (las cuatro nuevas pesan 3,27 y las diez viejas que quedan en la ventana, 3,23). Es lo que vio Kitamura:
  una falta de ~1 h por noche, recuperada hacia la cuarta noche larga.
- **Una sola noche mala**: 4 h menos anoche (acotado a 3) suma 3 h; a la semana pesa 1 h 06.
- **Sensibilidad**: media hora de necesidad son 3 h 15 (hoy, 3 h 45).

Qué cambia respecto de hoy: los pesos (6,5 en vez de 7,5: −13 %), el techo de lo que sobra (60 en vez de 120),
los topes por noche, el medio peso de las noches estimadas y el tope final. Y, sobre todo, **N** (sección 2).

### 1.6 Cuánta duda tiene el número (cuenta mía, orden de magnitud)

| De dónde | Por noche | En la deuda (×6,5) |
|---|---|---|
| La necesidad, elegida o aprendida | ±30 min | ±3 h 15 |
| La necesidad, de fábrica | ±45 min (Kitamura 2016; Ursin 2005) | ±4 h 50 |
| El sesgo del reloj, según el modelo | +8 a +40 min (ya en la spec) | hasta 4 h de menos de deuda |
| El promedio de dos semanas con el teléfono | ±24 min de error mediano (Sahha 2026) | ±2 h 35 |
| El ruido de cada noche con el teléfono, ya promediado | ±40 min / √11 | ±1 h 20 |

Juntando (raíz de la suma de cuadrados): **±3 h 30 con reloj y necesidad elegida; ±4 h a ±4 h 30 con el
teléfono; ±5 h 30 con la necesidad de fábrica**. Ni con reloj se conoce la deuda a menos de ±3 h: por eso
conviene decirla en palabras y en tramos (sección 5), y dejar el número a la hora, nunca al minuto.

---

## 2. La necesidad de sueño de cada persona

### 2.1 Lo que se sabe

- **Las guías** (ya en la spec): AASM y SRS, 7 h o más de 18 a 60 años (Watson 2015); NSF, 7 a 9 h en adultos,
  7 a 8 desde los 65, 8 a 10 en adolescentes, y lejos de eso «puede ser apropiado» pero es raro (Hirshkowitz
  2015); AASM pediátrica, 8 a 10 h de 13 a 18 (Paruthi 2016). Salen sobre todo de sueño declarado.
- **En el laboratorio, con cama de sobra**: 8,41 h (7,29–9,26) en 15 hombres de 20 a 26 años (Kitamura 2016);
  8,9 ± 0,4 h en 35 jóvenes y 7,4 ± 0,4 h en 18 mayores (Klerman y Dijk 2008). Para no acumular déficit de
  atención, estar despierto no más de 15,84 h por día (Van Dongen 2003).
- **La contra**: catorce noches con hasta 10 h en la cama sumaron ~1 h de sueño y casi ningún beneficio; los
  autores concluyen que quien duerme 7,5 h no está crónicamente privado (Harrison y Horne 1996). Parte de lo
  que se duerme con cama de sobra es opcional.
- **Lo que la gente dice necesitar**: 7 h 16 ± 52 min (hombres) y 7 h 45 ± 52 min (mujeres) a los 40–45 años;
  lo que dicen dormir entre semana, 6 h 52 y 7 h 11 (Ursin 2005, n = 8.860).
- **Declarado contra medido**: el sueño habitual declarado supera en 61 min al de la polisomnografía, y el
  estimado a la mañana siguiente, en 18 (Silva 2007, n = 2.113); contra actigrafía, 6,8 h declaradas y 6,0 h
  medidas, y quien mide 5 h declara 1,2 h de más (Lauderdale 2008, n = 669).
- **La misma deuda no afecta igual a todos**: la vulnerabilidad a la falta de sueño es un rasgo estable de
  cada persona (Van Dongen 2004, n = 21).
- **No hay método validado en casa** (Kitamura 2016 lo dice; Chaput 2018: no hay «número mágico», y la guía
  práctica es despertarse descansado y rendir bien de día).

### 2.2 Las pistas que da el historial

- **El rebote de los días libres** delata la deuda: se correlaciona con ella (r = 0,77) y los dos
  participantes sin rebote no tenían deuda (Kitamura 2016); quien duerme menos en casa extiende más
  (Klerman y Dijk 2005). Pero la primera noche libre **exagera** la necesidad: en Kitamura, 2,2 h por encima
  del óptimo, y recién hacia la cuarta se estabiliza.
- **El promedio de la semana** la **subestima** si hay deuda: 13 de 15 dormían en casa menos que su óptimo
  (Kitamura 2016), y solo el 18 % de quienes tienen deuda severa la compensa el fin de semana (Léger 2020,
  n = 12.367). El cuestionario de cronotipo de Múnich usa justamente el promedio semanal (SD_week) para
  corregir el sueño de más de los días libres (Roenneberg 2019).
- **Umbrales publicados**: deuda = sueño ideal declarado − sueño de entre semana mayor de 60 min (severa, más
  de 90); «restricción» = dormir 1 a 2 h más el fin de semana (severa, más de 2 h). En Francia, 27,7 % con
  deuda y 18,8 % severa; se duerme 6 h 42 entre semana y 7 h 26 el fin de semana (Léger 2020). Son
  definiciones de una encuesta, no umbrales clínicos.
- La diferencia entre noches libres y de trabajo tiene una ventaja: **el sesgo de medir se cancela**, porque
  las dos se miden igual. Es la señal más confiable para quien no tiene reloj.

### 2.3 Lo que haría una app prudente: las dos cosas

1. **Preguntar al entrar** (como Ursin 2005 y Léger 2020): «¿Cuántas horas necesitas dormir para sentirte
   descansado?», de media hora en media hora dentro del rango de la edad, con lo de fábrica marcado.
2. **De fábrica**, decidir la moneda (decisión del dueño):
   - **A (recomendada):** de 18 a 64 años, 8 h *en la cama*, que son **7 h 30 de sueño** contra lo que mide
     un reloj (8 h en la cama dieron 7,39 h dormido en la noche de base de Kitamura 2016 y 7,51 h en Banks
     2010, después de restringir) y contra la noche sin reloj ya descontado lo despierto. Es la referencia
     de los ensayos y lo que las guías recogen de lo que la gente declara. Lo que no pude confirmar: si las
     «8,16 h» de Van Dongen 2003 son de sueño o en la cama (sección 8).
   - **B (lo de hoy):** 8 h de sueño. Se sostiene con el laboratorio en jóvenes (8,4 a 8,9 h), pero deja con
     deuda al adulto medio medido.
   - En las dos: 7 h 30 − 30 min desde los 65 y +1 h antes de los 18, como ya está.
3. **Estimar con el historial y proponer, nunca cambiar sola** (convención; sin validación en casa):
   - **Preferido:** la mediana del sueño de las **noches libres desde la segunda seguida** (sin alarma, fin
     de semana o vacaciones), con 6 o más en las últimas 8 semanas. Descarta el rebote de la primera.
   - **Si no hay:** el **percentil 75** de todas las noches (21 o más). Razón: queda entre el promedio (que
     subestima) y las noches libres (que exageran); con 2 noches libres de cada 7, la mediana de las libres
     cae cerca del percentil 85 (cuenta mía).
   - Acotado al rango de la edad (7 a 9; 8 a 10 antes de los 18), en pasos de 15 minutos, como mucho una vez
     por mes y solo si difiere 30 minutos o más de la elegida: «Cuando puedes dormir sin despertador, duermes
     unas 8 h 15 min. ¿Subimos tu necesidad?».
   - **Sin reloj**, solo con la mitad o más de las noches confirmadas: si no, el sesgo de la estimación se
     mete en la necesidad.
4. **La comprobación cruzada** (derivado de Kitamura 2016 y Klerman y Dijk 2005): si la deuda da «alta» pero
   las noches libres no son más largas que las de trabajo (menos de 30 min), lo más probable es que la
   necesidad esté alta o la medición sesgada. Ahí Moss baja la confianza y pregunta, en vez de insistir.
5. **Qué error tiene suponer 8 h:** ±40 a 50 min entre personas (±4 h 30 a 5 h 30 de deuda), más 45 a 60 min
   de moneda si se compara contra sueño medido (5 a 6 h 30 de deuda de más).

---

## 3. La ventana para dormirse (el «periodo de melatonina»)

### 3.1 Dónde cae el inicio de la melatonina respecto del sueño

| Estudio | Quiénes | DLMO respecto del sueño | Qué predice mejor |
|---|---|---|---|
| Burgess y Eastman 2005 | 120 jóvenes sanos, 6 días en casa (60 con horario fijo, 60 libre) | 2,5 h (DE 1,1) y 2,3 h (DE 1,2) antes de acostarse; 2,8 y 2,7 h (DE 1,0 y 1,1) antes de dormirse; 13,7 y 13,3 h (DE 1,1) después de despertarse | Con horario libre: el despertar (r = 0,70) y el punto medio (0,69); con horario fijo, 0,44 y 0,47. **DLMO = 0,80 × hora de despertarse − 8,83** (horas decimales, horario libre): en otra muestra de 23, dentro de 1 h en el 74 % y de 1,5 h en el 96 % |
| Burgess 2003 | 16 jóvenes, una semana a su horario | Unas 2 h antes de acostarse y 14 h después de despertarse | Despertar (r = 0,77), punto medio (0,68); la hora de acostarse, no (0,36) |
| Martin y Eastman 2002 | 26 jóvenes, horario libre, 14 días | DLMO 22:48 ± 1:30; se dormían 01:44 ± 1:41 (2 h 56 después) | **El punto medio de los últimos 5 días** (r = 0,89): dentro de 1 h en el 92 %, ninguno a más de 1,5 h |
| Sletten 2010 | 28 jóvenes, 3 semanas con horario fijo temprano o tarde | 1,85 ± 0,50 h y 1,98 ± 1,25 h antes de dormirse (de −0,13 a 4,14 h en el grupo tarde) | Correr 2 h el horario corrió el DLMO 1,75 h: la distancia se mantuvo |
| Flynn-Evans 2017 | 21 controles (34 años) y 79 con insomnio | Controles: se acuestan 3 h 10 (± 1 h 08) después del DLMO. Con insomnio: 2 h 13 (± 1 h 43); el 22 % intenta dormirse antes de una hora después del DLMO (6 % de los controles) y el 10 %, antes del DLMO (ningún control) | — |
| Wright 2013 | 8 adultos | Con luz eléctrica, ~2 h antes de dormirse; tras una semana de campamento, cerca de la puesta del sol (~2 h más temprano) | — |
| Burgess y Fogg 2008 | 170 adultos de 18 a 45 | DLMO de 18:13 a 0:26 | Cada hora más temprano de despertar, 0,77 h más temprano el DLMO |
| Crowley 2006 | 208 mediciones, 9 a 17 años | — | Regresiones con el horario: dentro de ±1 h en ~80 % |
| Kantermann 2015 | 60 adultos (24 con fase retrasada) | — | Punto medio corregido de los días libres, r = 0,68; con el mismo valor, el DLMO varía unas 4 h |
| Reiter 2020 | 72 adultos jóvenes | — | Lo mejor, la regresión con el punto medio de 7 días: límites de acuerdo de ±1,8 h (diario) y ±1,9 h (actigrafía). «Ninguno da estimaciones precisas» |
| Huang 2021; Woelders 2017; Cheng 2021 | Modelos del reloj con actividad o luz de la muñeca | — | Dentro de ~1 h en gente con vida normal (Huang); DE 1,1 h con 9 días de luz y actividad (Woelders); en turnos de noche, 2,88 h de error medio (Cheng) |

En limpio: en promedio el DLMO cae **2 a 3 h antes de dormirse** (2,5 h es el centro), unas **13,5 a 14 h
después de despertarse** y unas **6 h 30 antes del punto medio del sueño** (cuenta mía con las medias
publicadas, del momento de dormirse al de despertarse: 6 h 33 y 6 h 42 en Burgess y Eastman 2005, y 6 h 26
en Martin y Eastman 2002; con el punto medio del tiempo en la cama, 6 h 25 y 6 h 30). De una persona a otra, esa
distancia varía con un desvío de **1 a 1,2 h** y un rango de hasta 5 h (Sletten 2010). Depende del período
propio del reloj y de la luz (Wright 2005; Lazar 2013).

### 3.2 Cuándo es fácil dormirse y cuánto dura

- **Antes del DLMO hay una zona en la que cuesta dormirse.** La «zona prohibida» de Lavie cae hacia las
  20–22 h (Lavie 1986, 22 sujetos en tres experimentos); la zona de mantenimiento de la vigilia son las
  **~3 h anteriores al DLMO** (Shekleton 2013, n = 31; de Zeeuw 2018, n = 12, que la define así), y, según
  la cuenta de Strogatz, en gente con horario normal eso cae **1 a 3 h antes de la hora habitual de
  acostarse** (Strogatz 1987, n = 15 en aislamiento).
- **La puerta se abre de golpe**, «todo o nada», y su hora es estable en la misma persona durante dos semanas
  (Lavie 1986). Está enganchada al inicio de la melatonina (Shochat 1997, n = 6; Tzischinsky 1993, n = 29);
  el desfase exacto entre los dos, **no confirmado** (los resúmenes no lo dan). La somnolencia sube más rápido
  justo después del DLMO (de Zeeuw 2018).
- **No encontré evidencia de que la ventana dure una hora ni de que se cierre.** Después de abrirse, el
  reloj sostiene el sueño durante toda la noche habitual (Dijk y Czeisler 1994, que lo muestra separando el
  reloj del horario en 8 hombres). Lo que la gente
  sana hace es dormirse entre 2 y 3 h después del DLMO; ese es el «centro», no un intervalo fisiológico. La
  hora de ancho es una convención (la de Rise).
- **Acostarse demasiado temprano para el reloj es lo que se asocia con tardar**: con el DLMO más tarde
  respecto de la hora de acostarse, más latencia medida (r = 0,48, Lazar 2013, n = 34), y es el patrón de una
  parte de los insomnes (Flynn-Evans 2017).

### 3.3 Cuánto la corren la luz, el despertar tarde y el fin de semana

| Qué | Cuánto | Fuente |
|---|---|---|
| Luz de habitación (menos de 200 lux) las 8 h antes de acostarse, contra luz tenue | Inicio más tarde en el 99 %; ~90 min menos de duración de la melatonina | Gooley 2011 (n = 116) |
| 10, 30 y 50 lux a la noche | Inicio aparente 22, 77 y 109 min más tarde; la sensibilidad cambia más de diez veces entre personas (de 6 a 350 lux para suprimir la mitad) | Phillips 2019 (n = 55) |
| Leer 4 h en una tableta, 5 noches | DLMO 1,5 h más tarde (22:31 contra 21:01); 10 min más para dormirse | Chang 2015 (n = 12) |
| La luz de las casas | Casi la mitad alcanza para suprimir la mitad de la melatonina; de 0 a 87 % según la persona | Cain 2020 |
| Una semana solo con luz natural | Todo ~2 h más temprano; un fin de semana logra el 69 % | Wright 2013; Stothard 2017 |
| Acostarse a la 1:00 en vez de a las 22:00 por 1 a 3 semanas, con el mismo despertar | DLMO 0,6 h más tarde | Burgess y Eastman 2004 (n = 10) |
| Despertarse 3 h más tarde por 2 semanas, con la misma hora de acostarse | DLMO 2,4 h más tarde | Burgess y Eastman 2006 (n = 14) |
| Viernes y sábado, todo 2 h más tarde | DLMO 31,6 min más tarde el lunes | Yang 2001 (n = 10) |
| Fin de semana: acostarse 1,5 h y despertarse 3 h más tarde | DLMO 45 ± 31 min más tarde; despertarse antes o luz azul al despertar no lo evitaron | Crowley y Carskadon 2010 (15 a 17 años) |
| Días libres contra días de trabajo | DLMO y sueño más tarde los días libres, más en los vespertinos; los minutos, **no confirmados** | Zerbini 2021 (n = 33) |

Lo que sale de ahí:

- **Sostenido**, el reloj sigue al despertar casi uno a uno (0,8 h por hora: la pendiente de Burgess y
  Eastman 2005, las 0,77 de Burgess y Fogg 2008 y las 2,4 de 3 del experimento de 2006) y poco a la hora de
  acostarse (0,2 h por hora, del de 2004).
- **De un fin de semana**, se corre alrededor de una cuarta parte de lo que se corrió el despertar (cuenta
  mía: 32 min de 2 h en Yang 2001; 45 min de 3 h en Crowley y Carskadon 2010). **De una sola mañana**, no hay
  estudio; si fuera proporcional, un 10 a 15 %.
- El promedio del punto medio de 7 noches hace eso solo: dos noches corridas 2 h lo mueven 34 min
  (2 × 2 h / 7), contra los 32 de Yang 2001; con el fin de semana de Crowley (punto medio 2 h 15 más tarde),
  39 min contra 45.
- Esto responde a D8 de `momentos.md` («no encontré cuánto corre el reloj una sola mañana tarde»): la parte
  del reloj es chica. Correr «la mitad» la hora de dormirse esa noche suma además que hay menos horas
  despierto encima, y eso sigue siendo **convención** (no encontré un estudio de la latencia después de una
  mañana tarde).

### 3.4 La estimación propuesta

```
M        = media (circular) del punto medio del sueño —entre dormirte y despertarte— de las
           últimas 7 noches válidas (5 como mínimo; sin siestas, sin noches con cambio de huso)
DLMO     ≈ M − 6 h 30
ventana  = de DLMO + 2 h a DLMO + 3 h   =   de M − 4 h 30 a M − 3 h 30
```

- **Ejemplo**: quien duerme de 23:30 a 7:30 tiene M = 3:30, DLMO ≈ 21:00 y ventana de 23:00 a 0:00. Con la
  fórmula del despertar (0,80 × 7,5 − 8,83) da 21:10: coinciden. Con las medias de Burgess y Eastman 2005 la
  propuesta da 20:50 (medido, 20:46) con horario fijo y 22:53 (medido, 22:41) con horario libre (cuentas
  mías).
- **Por qué el punto medio**: es el mejor predictor en Martin y Eastman 2002 y en Reiter 2020, y empata con
  el despertar en Burgess y Eastman 2005; no depende de saber cuándo se acostó la persona, que Moss no sabe;
  y aguanta que el sueño venga recortado de un lado. Siete noches: lo que usan Reiter 2020 y Martin y
  Eastman 2002 (5 a 7).
- **Qué es y qué no**: para alguien regular, la ventana queda centrada en su hora habitual de dormirse, por
  construcción. No descubre nada nuevo: sirve para (a) mostrar cómo se corre después de días tarde o
  temprano, (b) anclar lo de la noche (las luces, las revoluciones) y (c) avisar cuando alguien se acuesta
  bastante antes de lo que su reloj acompaña.
- **El margen honesto**: **±1 h** como desvío. En jóvenes sanos con horario libre, dentro de ±1 h en el 74 a
  92 % y de ±1,5 h en el 96 a 100 % (Burgess y Eastman 2005; Martin y Eastman 2002); en adolescentes, ~80 %
  (Crowley 2006); con horario fijo la relación es bastante más floja (r de 0,44 a 0,49); límites de acuerdo
  de ±1,8 a 1,9 h en Reiter 2020. Con turnos de noche no sirve (2,9 h de error ni con modelos, Cheng 2021).
  En mayores de 60 años, casi sin datos (las muestras llegan a 45 o a 62).
- **Cuándo no mostrarla o mostrarla más ancha** (convención): menos de 5 noches, desvío del punto medio mayor
  de 90 min, viaje con cambio de huso en la semana, o la mitad de las noches estimadas sin confirmar (el
  error del punto medio sin reloj es de ~13 a 15 min con una semana, Sahha 2026: chico al lado de ±1 h, así
  que sin reloj la ventana se sostiene mejor que la deuda).
- **La luz no se puede medir con el teléfono.** Lo que se puede decir: con luz fuerte o pantallas hasta
  tarde, la ventana real puede venir una hora o más después de la estimada (Chang 2015; Phillips 2019).
- **El aviso de «la ventana de melatonina»** que ya existe (2 h antes de dormirte, `MELATONINA`): el centro
  de la evidencia es 2,5 h antes de dormirse (2 a 3 h), así que 2 h está dentro; llamarlo «empieza a subir
  tu melatonina, más o menos» sigue bien.

### 3.5 Qué decirle a quien se acuesta fuera de la ventana

- **Bastante antes (más de una hora):** «Para tu reloj todavía es temprano: puede que tardes en dormirte.
  Si no tienes sueño, espera un rato con luz baja.» Fundamento: la zona de vigilia de 1 a 3 h antes de la
  hora habitual (Strogatz 1987; Shekleton 2013); intentar dormir antes de una hora después del DLMO es
  típico de una parte de los insomnes (Flynn-Evans 2017); y la guía del insomnio pide ir a la cama solo con
  sueño (Edinger 2021, ya en la spec). Coincide con el tope de no adelantar la cama más de una hora.
- **Después:** «Ya pasó tu hora habitual: dormirte no te va a costar, pero la noche queda más corta.» Y, si
  es costumbre: acostarse tarde con luz corre el reloj (0,6 h con 3 h más tarde, Burgess y Eastman 2004).
- **Lo que no se dice:** «perdiste la ventana» o «ya no vas a poder dormirte hasta la próxima»: no hay
  evidencia de que se cierre. Tampoco una hora exacta («tu melatonina empieza a las 21:14»), ni melatonina en
  pastillas, ni nada de esto a quien trabaja de noche.

---

## 4. Detectar el sueño solo con el teléfono

### 4.1 Los estudios

| Estudio | Quiénes | Señal | Contra qué | Error |
|---|---|---|---|---|
| Chen 2013 (citado por Min 2014 y Abdullah 2014) | 8 personas, 1 semana | Uso, acelerómetro, sonido, luz | Diario | Duración ±42 min |
| Min 2014, «Toss 'N' Turn» | 27 personas, 1 mes, 795 diarios | Sonido, luz, movimiento, pantalla, batería | Diario | Acostarse ±35 min, despertarse ±31, duración ±49; dormido o despierto cada 10 min, 93 % |
| Abdullah 2014 | 9 estudiantes, 97 días | Solo pantalla encendida y apagada (el hueco más largo que empieza entre las 22 y las 7) | Diario | Duración media por persona a menos de 45 min; punto medio a 23,8 min (IC ±11). **Suma un término corrector por persona**, aprendido en las dos primeras semanas |
| Cuttone 2017, «SensibleSleep» | 126 usuarios con pulsera Sony y 324 estudiantes | Solo pantalla, modelo bayesiano | Pulsera de movimiento | Exactitud 0,89 por intervalo, F1 0,83; no da minutos |
| Saeb 2017 (ya en la spec) | 208 adultos de 18 a 66, 6 semanas | Ubicación, movimiento, luz, sonido, uso | Lo que dijo la persona | Desviación mediana de 38 min al dormirse y 36 al despertarse; con solo la hora del día, 86,9 % contra 88,8 % |
| Lin 2019 | 61 adultos, 14 días | Uso del teléfono | Sin validación contra otro método en el resumen | — |
| Borger 2019, «tappigraphy» | 79 jóvenes, ~1.400 noches | Cada toque en la pantalla | Actigrafía de muñeca | R² = 0,9 para dormirse y despertarse; duración 8,1 h contra 8,5 h de la actigrafía (error mediano −2,8 %; absoluto 7,2 %). Sobrestima en quien usa poco el teléfono y subestima en quien lo usa mucho. Había toques hasta ~2 h después del «inicio del sueño» de la actigrafía |
| Ciman y Wac 2019 | 14 personas, hasta 6 meses | Pantalla | Reloj Basis | Duración: 24 min de error medio (7 %; DE 17 min) |
| Massar 2021 | 198 adultos, 8 semanas | Toques, anillo Oura y diario en el teléfono | Entre sí | En promedio coinciden (acostarse 01:23 por toques, 01:40 por Oura; despertarse 09:06 y 09:22; tiempo en cama 7 h 43 los dos; ρ de 0,81 a 0,92). Pero **el 23 % de las noches difiere más de una hora**, en tres patrones, y cada persona repite el suyo |
| Druijff-van de Woestijne 2021 | 51 estudiantes, 1 semana | Teclado | Diario | r de 0,74 a 0,80; R² de 0,60 a 0,66 |
| Lopaczynski 2026 (ya en la spec) | Jóvenes de 14 a 25 con trastorno bipolar | Pantalla y sensores | Actigrafía | Error cuadrático menor de 21 min en inicio, fin, punto medio y total; sobrestima un poco la duración, da horas más tempranas y ve menos de lo despierto |
| Sahha 2026 (de la empresa, sin revisión de pares) | 3.868 personas, 105.826 noches | Pasos (lo que más aporta), bloqueo de pantalla y eventos de apps | Relojes, anillos y una banda | Abajo |

Lo de Sahha, que es lo más parecido a lo que puede hacer Moss en iOS (pasos y movimiento, sin pantalla):

- Error mediano absoluto: 24,2 min al dormirse, 19,2 al despertarse, 19,1 en el punto medio y **39 min en la
  duración**; sesgo medio de −7, +6 y **+4 min**; límites del 95 % de una noche en la duración, de −139 a
  +148 min.
- Los dos bordes dentro de 30 min en el 39 % de las noches; dentro de 60, en el 65,6 %; algún borde a más de
  2 h, en el 13,5 %.
- **La ventana quieta sola exagera el sueño en 89 min**; el modelo de duración lo corrige, pero «tira hacia
  lo típico»: sobrestima las noches cortas y subestima las largas.
- Con promedios: la duración pasa de 40 min de error (una noche) a 27 (una semana) y **24 (dos semanas)**; el
  punto medio, a ~13–15 min con una semana.
- Qué señal ayuda: solo pasos, 46,4 % dentro de 60 min (con 86,5 % de cobertura); solo bloqueo de pantalla,
  35,2 % (14,1 % de cobertura); todo junto, 53,3 %. **El cargador no está entre sus señales.**
- De dónde salen los errores de más de 2 h: usar el teléfono de noche y que parezca un despertar (26 %),
  dejarlo mucho antes de dormirse (25 %), agarrarlo mucho después de despertarse (23 %), ventana equivocada
  (12 %).

### 4.2 Qué señales ayudan y los sesgos

- **Lo que más ayuda** donde se midió: la pantalla (cuando la app puede verla: Abdullah, Cuttone, Borger),
  los pasos (Sahha) y, por encima de todo, **la hora habitual de la persona** (Saeb 2017: con la hora sola ya
  se acierta casi lo mismo) y un modelo propio de cada una (91,8 contra 87,6 %, Saeb 2017, ya en la spec).
  Del cargador solo no hay validación (lo usa Toss 'N' Turn dentro del conjunto).
- **¿Subestima o sobrestima la duración?** Depende de la persona, y eso es lo importante:
  - **Sobrestima** (el hueco es más largo que el sueño) en quien deja el teléfono antes de dormirse o no lo
    agarra al despertar: es lo que dice Abdullah 2014, el patrón 2 de Massar 2021 (gente que usa menos el
    teléfono y no duerme con él cerca) y los 89 min de la ventana cruda de Sahha.
  - **Subestima** en quien mira el teléfono de madrugada o a la mañana y sigue durmiendo: el patrón 3 de
    Massar 2021 (un toque para apagar la alarma o mirar mensajes y otra vez a dormir), los usuarios intensos
    de Borger 2019 y el 26 % de los errores grandes de Sahha.
  - **El reloj también se equivoca al revés**: quien usa el teléfono acostado y quieto figura dormido para la
    actigrafía y para el anillo (Borger 2019; el patrón 1 de Massar 2021).
- **El sesgo de cada persona es estable**: la mediana de noches discrepantes del mismo patrón por persona fue
  del 84 % (Massar 2021). No se promedia solo en dos semanas (por eso el promedio de 14 noches todavía erra
  24 min), pero **se puede aprender** con unas pocas confirmaciones.
- **Lo despierto de la noche no se ve** (Lopaczynski 2026; Sahha 2026): hay que descontarlo aparte (los 30
  minutos que ya tiene Moss).

### 4.3 El «colchón» entre dejar el teléfono y dormirse

| Qué | Cuánto | Fuente |
|---|---|---|
| De lo último que hizo el teléfono a dormirse, a la hora de siempre | **31 min** (mediana) | Sahha 2026 |
| Si lo dejó más tarde que siempre | 15 a 22 min | Sahha 2026 |
| Si lo dejó antes | ~50 min más por cada hora de antes (76 min con 1 a 1,5 h; 153 con 2 a 3 h) | Sahha 2026 |
| Según la hora | 56 min antes de las 21:00; 20 min después de la medianoche | Sahha 2026 |
| De despertarse a agarrar el teléfono | **18 min** (mediana; sin distribución) | Sahha 2026 |
| De acostarse a intentar dormir | 39 min de media en 338 jóvenes de 18 a 25; en 584 adultos, uno de cada cinco intenta dormir enseguida y el 16 % tarda más de 30 min | Exelmans 2017 y 2018 |
| De intentar dormir a dormirse, por polisomnografía | 16,9 min en 2.113 adultos de 40 o más | Silva 2007 |
| Corrección por persona | Un término aprendido en dos semanas contra el diario | Abdullah 2014 |

- Los 31 y 18 de fábrica de Moss son los de Sahha y son coherentes con lo demás: unos 17 minutos de latencia
  más un rato quieto en la cama. Con señales de pasos (iOS), el rato con el teléfono en la mano y acostado
  **no se ve**: en quien usa mucho el teléfono en la cama, el colchón real es más largo (hasta la hora de
  Exelmans más la latencia).
- **Cómo personalizarlo** (lo que ya hace Moss, con respaldo):
  - partir de 31 y 18 y moverse con las confirmaciones y con las noches con reloj, encogido hacia lo general
    (Abdullah 2014; Saeb 2017);
  - que el colchón dependa de si lo dejó antes o después de su hora (Sahha 2026) y, si alcanzan los datos,
    aparte entre semana y fin de semana;
  - reconocer el patrón de la persona (Massar 2021): «no duerme con el teléfono cerca» (ventana larga:
    colchones más grandes y más duda) y «lo mira al despertar y sigue durmiendo» (no cortar la noche en un
    uso corto de la mañana si después hay silencio);
  - preguntar más al principio y cuando la noche se sale de lo de siempre.

---

## 5. Qué tan confiable es la deuda con solo el teléfono, y cómo decirlo

### 5.1 Qué tan confiable

- **Una noche**: en seis de cada diez noches algún borde queda a más de 30 min, y en una de cada siete, a
  más de 2 h (Sahha 2026). Una noche sola no sirve para la deuda; por eso el medio peso y el tope de 2 h.
- **Dos semanas**: ~24 min de error mediano en el sueño medio (Sahha 2026), o sea unas **2 h 30 de deuda** en
  la persona típica y bastante más en una parte de la gente (los errores tienen colas pesadas). Sumando la
  necesidad: **±4 h a ±4 h 30**.
- **Sin validación contra polisomnografía** de ningún método con teléfono, y lo de Sahha es de una empresa y
  contra relojes, que a su vez cuentan de más.
- **Lo que sí distingue**: «al día» (menos de ~2 h), «algo» y «bastante» (más de ~7 h), y **los cambios de la
  misma persona** de una semana a otra, porque su sesgo es estable. No distingue 4 h de 7 h.
- **Confirmada a la mañana**, la noche vale como un diario (79 y 86 % de los bordes dentro de una hora,
  Thurman 2018, ya en la spec): con la mitad de las noches confirmadas, la deuda sin reloj se acerca a la de
  un reloj.
- **Lo más firme que tiene quien no usa reloj**: la diferencia entre sus noches libres y las de trabajo, y la
  tendencia. Las dos cancelan el sesgo.

### 5.2 Cómo decirlo (propuesta; va primero a la galería)

1. **La palabra primero, por lo que falta por noche**, que es lo que menos error tiene. Con el núcleo de 6,5
   y los umbrales de Léger 2020 (más de 60 y más de 90 min por noche):

   | Falta por noche | Deuda | Palabra |
   |---|---|---|
   | menos de 15 min | menos de 1 h 40 | Al día |
   | 15 a 30 min | 1 h 40 a 3 h 15 | Baja |
   | 30 a 60 min | 3 h 15 a 6 h 30 | Moderada |
   | 60 a 90 min | 6 h 30 a 9 h 45 | Alta |
   | 90 min o más | 9 h 45 o más | Muy alta |

   Los cortes son convención (los dos de arriba, de una encuesta). Sin rojos.
2. **El número, a la hora y con «unas»**: «Unas 5 h». Sin reloj, mejor el tramo: «Entre 3 y 7 h». Nunca
   minutos. Arriba de 15: «15 h o más».
3. **De qué sale, en una línea**: «Estas dos semanas dormiste unas 6 h 50 min por noche; necesitas unas
   7 h 30 min.» Es lo que se entiende y lo que la persona puede discutir (y corregir tocando la necesidad).
4. **Con el teléfono, decirlo sin drama**: «Estimada con tu teléfono: es una guía. Confirma tus noches y se
   afina.» Y contar cuántas noches entraron y cuántas están confirmadas.
5. **Cómo se baja, sin promesa de pago**: «No hace falta devolver hora por hora. Con varias noches seguidas
   durmiendo lo que necesitas, baja a la mitad en unos cuatro días.» (El núcleo; Kitamura 2016; UMP.)
6. **Lo único de «salud» que se sostiene decir**: «Puede que no lo notes: uno se acostumbra a dormir poco,
   pero la atención baja igual.» (Van Dongen 2003.) Nada de riesgos de enfermedad ni de «equivale a tantas
   noches sin dormir» aplicado a la persona.
7. **Cuando los datos no cierran, preguntar en vez de afirmar** (sección 2.3, punto 4): «Los días libres
   duermes casi lo mismo que entre semana. Quizá necesites menos de 8 h: ¿lo revisamos?».
8. **La ventana**: «Tu ventana para dormirte: de 23:00 a 0:00, aprox.» Y en «Cómo se calcula»: «Sale de tus
   horarios de la última semana, no de una medición. Puede venir una hora antes o después, y más tarde si a
   la noche hay luz fuerte o pantallas.»
9. **Lo que no cambia** (ya en la spec): sin diagnósticos, sin porcentajes de precisión propios, sin empujar
   a pasar más tiempo en la cama a quien tarda mucho en dormirse.

---

## 6. Lo que conviene corregir en la spec (citas, sin tocar números)

- `spec/estudio/momentos.md` §10 y D8: «no encontré cuánto corre el reloj una sola mañana tarde». Hay tres
  estudios de despertar tarde (Yang 2001; Crowley y Carskadon 2010; Burgess y Eastman 2006) y uno de
  acostarse tarde (Burgess y Eastman 2004). De una sola mañana, sigue sin haber.
- `momentos.md` §10, «la melatonina empieza unas 2 h antes de dormirse»: es el borde de abajo. En la muestra
  más grande son 2,7 a 2,8 h antes de dormirse y 2,3 a 2,5 h antes de acostarse (Burgess y Eastman 2005);
  «2 a 3 h» es lo exacto.
- `spec/sueno.md`, «Las cuentas»: la deuda «llevada a 14 noches (×7,5)» es una convención cercana a un
  modelo publicado (τ = 7 días, Ramakrishnan 2016); se puede citar así.
- `spec/sueno.md`, «8 horas, las mismas de la recuperación de Ascent»: aclarar si son de sueño o en la cama
  (sección 2.3).

---

## 7. Fuentes

**[T]** leí el texto completo o las partes citadas · **[R]** solo el resumen (Europe PMC).

**La deuda: experimentos**

- Van Dongen HPA, Maislin G, Mullington JM, Dinges DF. 2003. The cumulative cost of additional wakefulness:
  dose-response effects on neurobehavioral functions and sleep physiology from chronic sleep restriction and
  total sleep deprivation. *Sleep* 26(2):117-126. https://doi.org/10.1093/sleep/26.2.117 · [R]
- Belenky G, Wesensten NJ, Thorne DR, et al. 2003. Patterns of performance degradation and restoration during
  sleep restriction and subsequent recovery: a sleep dose-response study. *J Sleep Res* 12(1):1-12.
  https://doi.org/10.1046/j.1365-2869.2003.00337.x · [R]
- Dinges DF, Pack F, Williams K, et al. 1997. Cumulative sleepiness, mood disturbance, and psychomotor
  vigilance performance decrements during a week of sleep restricted to 4-5 hours per night. *Sleep*
  20(4):267-277. https://doi.org/10.1093/sleep/20.4.267 · [R]
- Banks S, Van Dongen HPA, Maislin G, Dinges DF. 2010. Neurobehavioral dynamics following chronic sleep
  restriction: dose-response effects of one night for recovery. *Sleep* 33(8):1013-1026.
  https://doi.org/10.1093/sleep/33.8.1013 · PMC2910531 · [T] (por la herramienta de lectura)
- Kitamura S, Katayose Y, Nakazaki K, et al. 2016. Estimating individual optimal sleep duration and potential
  sleep debt. *Sci Rep* 6:35812. https://doi.org/10.1038/srep35812 · PMC5075948 · [T]
- Klerman EB, Dijk DJ. 2005. Interindividual variation in sleep duration and its association with sleep debt
  in young adults. *Sleep* 28(10):1253-1259. https://doi.org/10.1093/sleep/28.10.1253 · [R]
- Klerman EB, Dijk DJ. 2008. Age-related reduction in the maximal capacity for sleep: implications for
  insomnia. *Curr Biol* 18(15):1118-1123. https://doi.org/10.1016/j.cub.2008.06.047 · [R]
- Rupp TL, Wesensten NJ, Bliese PD, Balkin TJ. 2009. Banking sleep: realization of benefits during subsequent
  sleep restriction and recovery. *Sleep* 32(3):311-321. https://doi.org/10.1093/sleep/32.3.311 · [R]
- Arnal PJ, Sauvet F, Leger D, et al. 2015. Benefits of sleep extension on sustained attention and sleep
  pressure before and during total sleep deprivation and recovery. *Sleep* 38(12):1935-1943.
  https://doi.org/10.5665/sleep.5244 · [R]
- Harrison Y, Horne JA. 1996. Long-term extension to sleep: are we really chronically sleep deprived?
  *Psychophysiology* 33(1):22-30. https://doi.org/10.1111/j.1469-8986.1996.tb02105.x · [R]
- Lamond N, Jay SM, Dorrian J, et al. 2007. The dynamics of neurobehavioural recovery following sleep loss.
  *J Sleep Res* 16(1):33-41. https://doi.org/10.1111/j.1365-2869.2007.00574.x · [R]
- Pejovic S, Basta M, Vgontzas AN, et al. 2013. Effects of recovery sleep after one work week of mild sleep
  restriction on interleukin-6 and cortisol secretion and daytime sleepiness and performance. *Am J Physiol
  Endocrinol Metab* 305(7):E890-E896. https://doi.org/10.1152/ajpendo.00301.2013 · [R]
- Yamazaki EM, Antler CA, Lasek CR, Goel N. 2021. Residual, differential neurobehavioral deficits linger after
  multiple recovery nights following chronic sleep restriction or acute total sleep deprivation. *Sleep*
  44(4):zsaa224. https://doi.org/10.1093/sleep/zsaa224 · [R]
- Ochab JK, Szwed J, Oleś K, et al. 2021. Observing changes in human functioning during induced sleep
  deficiency and recovery periods. *PLoS One* 16(9):e0255771. https://doi.org/10.1371/journal.pone.0255771 · [R]
- Guzzetti JR, Banks S. 2023. Dynamics of recovery sleep from chronic sleep restriction. *Sleep Adv*
  4(1):zpac044. https://doi.org/10.1093/sleepadvances/zpac044 · PMC10108639 · [T]
- Van Dongen HPA, Baynard MD, Maislin G, Dinges DF. 2004. Systematic interindividual differences in
  neurobehavioral impairment from sleep loss: evidence of trait-like differential vulnerability. *Sleep*
  27(3):423-433. https://doi.org/10.1093/sleep/27.3.423 · [R]
- Depner 2019 y Aili 2017: en `spec/estudio/sueno.md`.

**La deuda: modelos**

- Hursh SR, Redmond DP, Johnson ML, et al. 2004. Fatigue models for applied research in warfighting. *Aviat
  Space Environ Med* 75(3 Suppl):A44-A53. PMID 15018265. PDF:
  https://www.saftefast.com/_files/ugd/c8faa9_f15f93c5a92b4038af0a047e0d9098df.pdf · [T]
- Rajdev P, Thorsley D, Rajaraman S, et al. 2013. A unified mathematical model to quantify performance
  impairment for both chronic sleep restriction and total sleep deprivation. *J Theor Biol* 331:66-77.
  https://doi.org/10.1016/j.jtbi.2013.04.013 · [R]
- Ramakrishnan S, Wesensten NJ, Balkin TJ, Reifman J. 2016. A unified model of performance: validation of its
  predictions across different sleep/wake schedules. *Sleep* 39(1):249-262.
  https://doi.org/10.5665/sleep.5358 · PMC4678351 · [T] (por la herramienta de lectura, dos veces; las
  ecuaciones están en una tabla que no pude leer)
- Reifman J, Kumar K, Wesensten NJ, et al. 2016. 2B-Alert Web: an open-access tool for predicting the effects
  of sleep/wake schedules and caffeine consumption on neurobehavioral performance. *Sleep* 39(12):2157-2159.
  https://doi.org/10.5665/sleep.6318 · [R]
- Reifman J, Ramakrishnan S, Liu J, et al. 2019. 2B-Alert App: a mobile application for real-time
  individualized prediction of alertness. *J Sleep Res* 28(2):e12725. https://doi.org/10.1111/jsr.12725 · [R]
- McCauley P, Kalachev LV, Smith AD, et al. 2009. A new mathematical model for the homeostatic effects of
  sleep loss on neurobehavioral performance. *J Theor Biol* 256(2):227-239.
  https://doi.org/10.1016/j.jtbi.2008.09.012 · PMC2657297 · [T] (por la herramienta de lectura)
- McCauley P, Kalachev LV, Mollicone DJ, et al. 2013. Dynamic circadian modulation in a biomathematical model
  for the effects of sleep and sleep loss on waking neurobehavioral performance. *Sleep* 36(12):1987-1997.
  https://doi.org/10.5665/sleep.3246 · [R]

**La necesidad**

- Ursin R, Bjorvatn B, Holsten F. 2005. Sleep duration, subjective sleep need, and sleep habits of 40- to
  45-year-olds in the Hordaland Health Study. *Sleep* 28(10):1260-1269.
  https://doi.org/10.1093/sleep/28.10.1260 · [R]
- Léger D, Richard JB, Collin O, Sauvet F, Faraut B. 2020. Napping and weekend catchup sleep do not fully
  compensate for high rates of sleep debt and short sleep at a population level. *Sleep Med* 74:278-288.
  https://doi.org/10.1016/j.sleep.2020.05.030 · [R]
- Lauderdale DS, Knutson KL, Yan LL, Liu K, Rathouz PJ. 2008. Self-reported and measured sleep duration: how
  similar are they? *Epidemiology* 19(6):838-845. https://doi.org/10.1097/EDE.0b013e318187a7b0 · [R]
- Silva GE, Goodwin JL, Sherrill DL, et al. 2007. Relationship between reported and measured sleep times: the
  Sleep Heart Health Study. *J Clin Sleep Med* 3(6):622-630. PMC2045712 · [R]
- Hirshkowitz M, Whiton K, Albert SM, et al. 2015. National Sleep Foundation's sleep time duration
  recommendations: methodology and results summary. *Sleep Health* 1(1):40-43.
  https://doi.org/10.1016/j.sleh.2014.12.010 · [R]
- Roenneberg T, Pilz LK, Zerbini G, Winnebeck EC. 2019. Chronotype and social jetlag: a (self-) critical
  review. *Biology (Basel)* 8(3):54. https://doi.org/10.3390/biology8030054 · PMC6784249 · [T]
- Chaput JP, Dutil C, Sampasa-Kanyinga H. 2018. Sleeping hours: what is the ideal number and how does age
  impact this? *Nat Sci Sleep* 10. https://doi.org/10.2147/NSS.S163071 · PMC6267703 · [T] (el resumen y la
  conclusión)
- Watson 2015 y Paruthi 2016: en `spec/estudio/sueno.md`.

**La melatonina y la ventana**

- Burgess HJ, Eastman CI. 2005. The dim light melatonin onset following fixed and free sleep schedules. *J
  Sleep Res* 14(3):229-237. https://doi.org/10.1111/j.1365-2869.2005.00470.x · PMC3841975 · [T] (por la
  herramienta de lectura; el resumen, textual)
- Burgess HJ, Savic N, Sletten T, et al. 2003. The relationship between the dim light melatonin onset and
  sleep on a regular schedule in young healthy adults. *Behav Sleep Med* 1(2):102-114.
  https://doi.org/10.1207/S15402010BSM0102_3 · [R]
- Martin SK, Eastman CI. 2002. Sleep logs of young adults with self-selected sleep times predict the dim light
  melatonin onset. *Chronobiol Int* 19(4):695-707. https://doi.org/10.1081/CBI-120006080 · [R]
- Sletten TL, Vincenzi S, Redman JR, Lockley SW, Rajaratnam SMW. 2010. Timing of sleep and its relationship
  with the endogenous melatonin rhythm. *Front Neurol* 1:137. https://doi.org/10.3389/fneur.2010.00137 ·
  PMC3008942 · [T]
- Burgess HJ, Fogg LF. 2008. Individual differences in the amount and timing of salivary melatonin secretion.
  *PLoS One* 3(8):e3055. https://doi.org/10.1371/journal.pone.0003055 · [T] (por la herramienta de lectura)
- Kantermann T, Sung H, Burgess HJ. 2015. Comparing the Morningness-Eveningness Questionnaire and Munich
  ChronoType Questionnaire to the dim light melatonin onset. *J Biol Rhythms* 30(5):449-453.
  https://doi.org/10.1177/0748730415597520 · [R]
- Reiter AM, Sargent C, Roach GD. 2020. Finding DLMO: estimating dim light melatonin onset from sleep markers
  derived from questionnaires, diaries and actigraphy. *Chronobiol Int* 37(9-10):1412-1424.
  https://doi.org/10.1080/07420528.2020.1809443 · [R]
- Crowley SJ, Acebo C, Fallone G, Carskadon MA. 2006. Estimating dim light melatonin onset (DLMO) phase in
  adolescents using summer or school-year sleep/wake schedules. *Sleep* 29(12):1632-1641.
  https://doi.org/10.1093/sleep/29.12.1632 · [R]
- Flynn-Evans EE, Shekleton JA, Miller B, et al. 2017. Circadian phase and phase angle disorders in primary
  insomnia. *Sleep* 40(12):zsx163. https://doi.org/10.1093/sleep/zsx163 · [R]
- Lazar AS, Santhi N, Hasan S, et al. 2013. Circadian period and the timing of melatonin onset in men and
  women: predictors of sleep during the weekend and in the laboratory. *J Sleep Res* 22(2):155-159.
  https://doi.org/10.1111/jsr.12001 · [R]
- Wright KP Jr, Gronfier C, Duffy JF, Czeisler CA. 2005. Intrinsic period and light intensity determine the
  phase relationship between melatonin and sleep in humans. *J Biol Rhythms* 20(2):168-177.
  https://doi.org/10.1177/0748730404274265 · [R]
- Lavie P. 1986. Ultrashort sleep-waking schedule. III. 'Gates' and 'forbidden zones' for sleep.
  *Electroencephalogr Clin Neurophysiol* 63(5):414-425. https://doi.org/10.1016/0013-4694(86)90123-9 · [R]
- Strogatz SH, Kronauer RE, Czeisler CA. 1987. Circadian pacemaker interferes with sleep onset at specific
  times each day: role in insomnia. *Am J Physiol* 253(1 Pt 2):R172-R178.
  https://doi.org/10.1152/ajpregu.1987.253.1.R172 · [R]
- Shekleton JA, Rajaratnam SMW, Gooley JJ, et al. 2013. Improved neurobehavioral performance during the wake
  maintenance zone. *J Clin Sleep Med* 9(4):353-362. https://doi.org/10.5664/jcsm.2588 · [R]
- de Zeeuw J, Wisniewski S, Papakonstantinou A, et al. 2018. The alerting effect of the wake maintenance zone
  during 40 hours of sleep deprivation. *Sci Rep* 8:11012. https://doi.org/10.1038/s41598-018-29380-z ·
  PMC6054682 · [T]
- Shochat T, Luboshitzky R, Lavie P. 1997. Nocturnal melatonin onset is phase locked to the primary sleep
  gate. *Am J Physiol* 273(1 Pt 2):R364-R370. https://doi.org/10.1152/ajpregu.1997.273.1.R364 · [R]
- Tzischinsky O, Shlitner A, Lavie P. 1993. The association between the nocturnal sleep gate and nocturnal
  onset of urinary 6-sulfatoxymelatonin. *J Biol Rhythms* 8(3):199-209.
  https://doi.org/10.1177/074873049300800303 · [R]
- Dijk DJ, Czeisler CA. 1994. Paradoxical timing of the circadian rhythm of sleep propensity serves to
  consolidate sleep and wakefulness in humans. *Neurosci Lett* 166(1):63-68.
  https://doi.org/10.1016/0304-3940(94)90841-9 · [R]
- Burgess HJ, Eastman CI. 2004. Early versus late bedtimes phase shift the human dim light melatonin rhythm
  despite a fixed morning lights on time. *Neurosci Lett* 356(2):115-118.
  https://doi.org/10.1016/j.neulet.2003.11.032 · [R]
- Burgess HJ, Eastman CI. 2006. A late wake time phase delays the human dim light melatonin rhythm. *Neurosci
  Lett* 395(3):191-195. https://doi.org/10.1016/j.neulet.2005.10.082 · [R]
- Yang CM, Spielman AJ, D'Ambrosio P, et al. 2001. A single dose of melatonin prevents the phase delay
  associated with a delayed weekend sleep pattern. *Sleep* 24(3):272-281.
  https://doi.org/10.1093/sleep/24.3.272 · [R]
- Crowley SJ, Carskadon MA. 2010. Modifications to weekend recovery sleep delay circadian phase in older
  adolescents. *Chronobiol Int* 27(7):1469-1492. https://doi.org/10.3109/07420528.2010.503293 · [R]
- Zerbini G, Winnebeck EC, Merrow M. 2021. Weekly, seasonal, and chronotype-dependent variation of dim-light
  melatonin onset. *J Pineal Res* 70(3):e12723. https://doi.org/10.1111/jpi.12723 · [R]
- Gooley JJ, Chamberlain K, Smith KA, et al. 2011. Exposure to room light before bedtime suppresses melatonin
  onset and shortens melatonin duration in humans. *J Clin Endocrinol Metab* 96(3):E463-E472.
  https://doi.org/10.1210/jc.2010-2098 · [R]
- Phillips AJK, Vidafar P, Burns AC, et al. 2019. High sensitivity and interindividual variability in the
  response of the human circadian system to evening light. *Proc Natl Acad Sci USA* 116(24):12019-12024.
  https://doi.org/10.1073/pnas.1901824116 · [R]
- Chang AM, Aeschbach D, Duffy JF, Czeisler CA. 2015. Evening use of light-emitting eReaders negatively
  affects sleep, circadian timing, and next-morning alertness. *Proc Natl Acad Sci USA* 112(4):1232-1237.
  https://doi.org/10.1073/pnas.1418490112 · PMC4313820 · [T] (por la herramienta de lectura)
- Cain SW, McGlashan EM, Vidafar P, et al. 2020. Evening home lighting adversely impacts the circadian system
  and sleep. *Sci Rep* 10:19110. https://doi.org/10.1038/s41598-020-75622-4 · [R]
- Wright KP Jr, McHill AW, Birks BR, et al. 2013. Entrainment of the human circadian clock to the natural
  light-dark cycle. *Curr Biol* 23(16):1554-1558. https://doi.org/10.1016/j.cub.2013.06.039 · PMC4020279 ·
  [T] (por la herramienta de lectura)
- Stothard ER, McHill AW, Depner CM, et al. 2017. Circadian entrainment to the natural light-dark cycle across
  seasons and the weekend. *Curr Biol* 27(4):508-513. https://doi.org/10.1016/j.cub.2016.12.041 · [R]
- Huang Y, Mayer C, Cheng P, et al. 2021. Predicting circadian phase across populations: a comparison of
  mathematical models and wearable devices. *Sleep* 44(10):zsab126. https://doi.org/10.1093/sleep/zsab126 · [R]
- Woelders T, Beersma DGM, Gordijn MCM, Hut RA, Wams EJ. 2017. Daily light exposure patterns reveal phase and
  period of the human circadian clock. *J Biol Rhythms* 32(3):274-286.
  https://doi.org/10.1177/0748730417696787 · [R]
- Cheng P, Walch O, Huang Y, et al. 2021. Predicting circadian misalignment with wearable technology:
  validation of wrist-worn actigraphy and photometry in night shift workers. *Sleep* 44(2):zsaa180.
  https://doi.org/10.1093/sleep/zsaa180 · [R]
- Edinger 2021: en `spec/estudio/sueno.md`.

**El sueño con el teléfono**

- Abdullah S, Matthews M, Murnane EL, Gay G, Choudhury T. 2014. Towards circadian computing: «early to bed
  and early to rise» makes some of us unhealthy and sleep deprived. *UbiComp '14*.
  https://doi.org/10.1145/2632048.2632100 · PDF:
  https://saeedabdullah.com/files/pubs/circadian-computing-ubicomp-2014.pdf · [T]
- Min JK, Doryab A, Wiese J, Amini S, Zimmerman J, Hong JI. 2014. Toss 'n' turn: smartphone as sleep and
  sleep quality detector. *CHI '14*. https://doi.org/10.1145/2556288.2557220 · PDF:
  https://users.cs.utah.edu/~wiese/publications/tossnturn.pdf · [T]
- Chen Z y otros. 2013. Unobtrusive sleep monitoring using smartphones. *PervasiveHealth '13*, 145-152.
  **No lo abrí**: lo cito por lo que dicen de él Min 2014, Abdullah 2014 y Cuttone 2017 (±42 min, 8 personas,
  una semana).
- Cuttone A, Bækgaard P, Sekara V, et al. 2017. SensibleSleep: a Bayesian model for learning sleep patterns
  from smartphone events. *PLoS One* 12(1):e0169901. https://doi.org/10.1371/journal.pone.0169901 ·
  PMC5226832 · [T]
- Borger JN, Huber R, Ghosh A. 2019. Capturing sleep-wake cycles by using day-to-day smartphone touchscreen
  interactions. *NPJ Digit Med* 2:73. https://doi.org/10.1038/s41746-019-0147-4 · PMC6662846 · [T]
- Ciman M, Wac K. 2019. Smartphones as sleep duration sensors: validation of the iSenseSleep algorithm. *JMIR
  Mhealth Uhealth* 7(5):e11930. https://doi.org/10.2196/11930 · PMC6547769 · [T]
- Massar SAA, Chua XY, Soon CS, et al. 2021. Trait-like nocturnal sleep behavior identified by combining
  wearable, phone-use, and self-report data. *NPJ Digit Med* 4:90.
  https://doi.org/10.1038/s41746-021-00466-9 · PMC8172635 · [T]
- Lin YH, Wong BY, Lin SH, et al. 2019. Development of a mobile application (App) to delineate «digital
  chronotype» and the effects of delayed chronotype by bedtime smartphone use. *J Psychiatr Res* 110:9-15.
  https://doi.org/10.1016/j.jpsychires.2018.12.012 · [R]
- Druijff-van de Woestijne GB, McConchie H, de Kort YAW, et al. 2021. Behavioural biometrics: using smartphone
  keyboard activity as a proxy for rest-activity patterns. *J Sleep Res* 30(5):e13285.
  https://doi.org/10.1111/jsr.13285 · [R]
- Saeb S, Cybulski TR, Schueller SM, Kording KP, Mohr DC. 2017. Scalable passive sleep monitoring using mobile
  phones: opportunities and obstacles. *J Med Internet Res* 19(4):e118. https://doi.org/10.2196/jmir.6821 · [R]
- Lopaczynski A, Merranko J, Mak J, et al. 2026. Agreement between smartphone-based mobile sensing and
  actigraphy sleep metrics in young people with bipolar disorder. *Psychiatry Res* 366:117434.
  https://doi.org/10.1016/j.psychres.2026.117434 · [R]
- Sahha. 2026. Estimating sleep from a smartphone alone: a validation against wearables on 105,826 nights.
  https://sahha.ai/research/phone-only-sleep-estimation/ · [T] (por la herramienta de lectura). **De la
  empresa, sin revisión de pares, contra relojes.**
- Exelmans L, Van den Bulck J. 2017. Bedtime, shuteye time and electronic media: sleep displacement is a
  two-step process. *J Sleep Res* 26(3):364-370. https://doi.org/10.1111/jsr.12510 · [R]
- Exelmans L, Gradisar M, Van den Bulck J. 2018. Sleep latency versus shuteye latency: prevalence, predictors
  and relation to insomnia symptoms in a representative sample of adults. *J Sleep Res* 27(6):e12737.
  https://doi.org/10.1111/jsr.12737 · [R]
- Thurman 2018, Schyvens 2025: en `spec/estudio/sueno.md`.

---

## 8. Lo que no pude confirmar

- **La fórmula de Rise** (pesos, necesidad, topes): su centro de ayuda da 403. Solo tengo el extracto del
  buscador (14 noches, lo reciente pesa más, la necesidad sale del uso del teléfono).
- **La ecuación de la deuda de UMP** y sus coeficientes: está en una tabla en imagen. La constante de 7 días,
  el piso de −0,11 y las noches de recuperación, sí.
- **El sueño medio por condición en Van Dongen 2003** y que «8,16 h» sea de sueño o en la cama: solo leí el
  resumen (da 15,84 h despierto).
- **Las constantes del proceso lento de McCauley 2009 en días**: el texto dice «del orden de semanas»; los
  coeficientes están, pero convertirlos fue una cuenta de la herramienta de lectura y no la uso.
- **El desfase exacto entre el inicio de la melatonina y la puerta del sueño** (Shochat 1997; Tzischinsky
  1993): los resúmenes dicen que están enganchados, sin minutos.
- **Los minutos de Zerbini 2021** (DLMO en días libres contra días de trabajo): el texto dio 403.
- **Taylor, Wright y Lack 2008** («Sleeping-in on the weekend delays circadian phase…»): no lo encontré en
  Europe PMC; no lo uso.
- **Las ecuaciones de Martin y Eastman 2002 y de Reiter 2020**: no están en el resumen; por eso propongo la
  distancia fija al punto medio, sacada de las medias publicadas (Reiter advierte que una distancia fija tiene
  sesgo proporcional: sobra en los muy tempranos o muy tardíos).
- **Cuánto corre el reloj una sola mañana tarde**: no hay estudio; hay de dos días y de dos semanas.
- **Una validación de cualquier método de teléfono contra polisomnografía**: no existe, que yo haya
  encontrado.
- **Un método validado para estimar la necesidad en casa** (percentil, noches libres): no existe; lo propuesto
  es una convención razonada.
