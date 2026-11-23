# Qué priorizar cada noche: la evidencia

Informe del 23/11/2026. Área: **la lista «Qué priorizar cada noche»**, abajo de todo en Sueño. Lo pediste así:
una lista (temperatura, comida, ropa, hora…) y, al tocar cada punto, su explicación («la mejor temperatura
para dormir es tal, porque…») y en qué se basa.

Leí antes `spec/estudio.md`, `spec/estudio/momentos.md` (entero, con la sección 10),
`spec/estudio/deuda-y-melatonina.md` y, del código, `src/dominio/loQueConviene.ts`, `melatonina.ts`,
`alrededorDelEntreno.ts` (el corte del café), `loQueFalta.ts` (la última comida), `sigueElDespertar.ts` (bajar
el ritmo, las gafas, anotar) y los textos de Sueño y de los avisos en `src/textos/es.json`. Las líneas son las
del commit `f1b1f7a` (`src/dominio/` sin cambios sin guardar); los textos se citan por su clave, porque `es.json`
está cambiando mientras tanto. Lo que esos informes ya verificaron (la cafeína, el alcohol, la cena, el
ejercicio tarde, la siesta, la luz y la ducha) lo cito como **«ya en la spec»** y no lo vuelvo a desarrollar:
acá sumo solo lo nuevo.

**Cómo verifiqué.** Los resúmenes, en Europe PMC (su API, leídos textuales). Los textos completos de acceso
abierto, bajados de Europe PMC y buscados por mí. Algunos que solo están en PMC o en la página de una sociedad,
con la herramienta de lectura, que resume la página: esos números me llegaron por ella. En «Fuentes»: **[T]**
leí el texto completo o las partes citadas, **[T·h]** lo mismo pero por la herramienta de lectura, **[R]** solo el
resumen. Lo que no pude confirmar está marcado **«no confirmado»** y juntado al final. Las cuentas mías dicen
«cuenta mía»; lo que no sale de ningún estudio, «convención». Las etiquetas de fuerza son las de `momentos.md`:
**fuerte** (guías, consensos o metaanálisis que coinciden), **moderada**, **débil** y **convención**.

---

## 0. Resumen

1. **Quedan 17 puntos** (sección 2), ordenados por cuánto cambian una noche común y qué tan firme es lo que los
   sostiene. Arriba de todo, lo que tiene guías o metaanálisis y efectos grandes: **darte tiempo para dormir**
   (7 a 9 h; AASM y SRS 2015, NSF 2015), **el último café** (−45 min de sueño en promedio; Gardiner 2023),
   **el alcohol** (quita REM desde unos dos tragos; Gardiner 2025) y **despertarte a la misma hora** (consenso
   de la NSF 2023; cohorte de 60.977 personas).
2. **La temperatura no tiene un número con estudios detrás.** La National Sleep Foundation dice de 15,6 a 19,4 °C
   (60 a 67 °F) sin citar un estudio. Lo medido: con ropa de cama, de 13 a 23 °C no cambia el sueño; **lo que
   lo empeora es el calor** (en mayores, de 30 °C contra 27 °C, 26 minutos menos de sueño; en casa, lo mejor
   entre 20 y 25 °C y un 5 a 10 % menos de eficiencia de 25 a 30 °C). En jóvenes, 17 °C mejor que 22 °C (un
   ensayo de 17 personas, pagado en parte por la industria de la lana). Propuesta: «fresca, de unos 16 a 20 °C
   con tu ropa de cama; lo que más quita sueño es el calor».
3. **Las pantallas: la luz azul sola no está probada en adultos.** El consenso de la NSF (2024, 16 expertos) no
   llegó a acuerdo en que la luz de las pantallas dañe el sueño de nadie, ni en que las pantallas dañen el de los
   adultos; sí en niños y adolescentes, y sobre todo por el contenido. El modo nocturno del iPhone no cambió el
   sueño en un ensayo de 167 personas (Duraccio 2021). Lo que sí está: la luz de la casa en las horas antes
   de dormir atrasa la melatonina (Brown 2022, Gooley 2011) y una pantalla muy brillante alarga un poco lo que
   tardas en dormirte (Schöllhorn 2023). El punto queda como «lo que te acelera», no como «la luz azul».
4. **«Si no te duermes, levántate» es control de estímulos, una parte de la terapia cognitivo-conductual para
   el insomnio** (TCC-I). La TCC-I es lo primero para el insomnio crónico (AASM 2021, fuerte; guía europea 2023,
   grado A); el control de estímulos solo, condicional y con evidencia baja. Para alguien sin insomnio es una
   extrapolación razonable, y así se dice. La regla de los «unos 20 minutos» es de la guía de la AASM de 2008, y
   dice que se estiman sin mirar el reloj (mirarlo alarga la latencia: Tang 2007).
5. **El ruido: tapones sí, ruido blanco no.** El tránsito de noche despierta (OR 1,35 por cada 10 dB más, con
   evidencia moderada; revisión para la OMS 2018). En un ensayo de 2026 con polisomnografía, los tapones
   frenaron casi todo el efecto del ruido y el ruido rosa **quitó sueño REM** (Basner 2026). La revisión de
   2021 del ruido blanco: calidad «muy baja».
6. **La ropa y los calcetines: evidencia débil.** Calentar la piel ayuda a dormirse en el laboratorio (Raymann
   2007 y 2008), y unos calcetines acortaron 7,5 minutos lo que se tardó en dormirse en 6 hombres (Ko y Lee 2018).
   Queda abajo de la lista.
7. **La nicotina entra** (no estaba en Moss): los fumadores tardan 5,4 minutos más en dormirse y duermen 14
   menos, medido con polisomnografía en 6.400 personas (Zhang 2006), y la nicotina en las 4 h antes de acostarse
   se asoció esa misma noche a un sueño más cortado (Spadola 2019, 785 personas). Observacional.
8. **Salen de la lista**: los alimentos «para dormir» (kiwi, cerezas, leche: estudios chicos, uno sin grupo de
   control), las gafas y los filtros de luz azul, el ruido blanco, las mantas con peso, la melatonina y los
   suplementos, y el líquido de noche (sin evidencia de horario; queda como línea opcional). Sección 4.
9. **Lo que choca con lo que Moss ya hace** (sección 5): las luces a los 90 minutos contra las 3 h del consenso
   (ya era D2), el aviso de las gafas que promete más de lo que hay, «pantallas brillantes» en el aviso de bajar
   el ritmo, dos largos de siesta distintos (20 y 30 minutos) y un comentario de `loQueConviene.ts` que dice
   3 h para la última comida cuando la constante es 2.
10. **Nada de esto trata el insomnio crónico ni la apnea.** Si alguien duerme mal casi todas las noches desde hace
    meses, lo que ayuda es la TCC-I; si ronca fuerte o lo ven dejar de respirar, un médico. La lista lo dice
    una vez, sin diagnosticar.

---

## 1. Lo que Moss ya dice (para no contradecirlo)

| Tema | Lo que hace Moss | Dónde | De dónde sale |
|---|---|---|---|
| La hora de acostarte | El comienzo de tu periodo de melatonina menos tu margen; la deuda no la adelanta | `melatonina.ts:26-31`, `:67-81`; «Esta noche» en Sueño (`sueno.estaNoche.cama`) | `deuda-y-melatonina.md` §3 |
| Cuánto necesitas | 8 h de fábrica (7 h 30 desde los 65; 9 antes de los 18), que se elige de 7 a 9 h (de 8 a 10 antes de los 18) | `sueno.ts:402-411`; Perfil › Necesito dormir | `estudio/sueno.md` |
| El café | Corte desde la hora de **acostarte**, según los mg de una toma: 8,8 h con 107 mg, 13,2 h con 217,5 mg, 9 h sin dato, sin corte con 50 mg o menos | `alrededorDelEntreno.ts:131-145` | Gardiner 2023 (`momentos.md`) |
| La última comida grande | 2 h antes de acostarte, 3 con reflujo; después, algo ligero | `loQueFalta.ts:116-118`; `loQueConviene.ts:83`; `sueno.estaNoche.comida` | ACG 2022, Fujiwara 2005 |
| Lo fuerte | Que termine 2 h antes de la cama | `loQueConviene.ts:92` | Frimpong 2021, Stutz 2019, Leota 2025 |
| Las luces | Aviso 90 minutos antes de la cama | `loQueConviene.ts:101` | Rise; D2 abierta (Brown 2022 dice 3 h) |
| Bajar el ritmo | Aviso 1 h antes: «algo tranquilo y lejos de las pantallas brillantes» | `sigueElDespertar.ts:67`; `recordatorios.despertar.revoluciones.texto` | Convención |
| Las gafas | Aviso 2 h antes, apagado de fábrica | `sigueElDespertar.ts:69`; `recordatorios.despertar.gafas.texto` | Shechter 2018; Cochrane 2023 (débil) |
| Anotar lo pendiente | Aviso al acostarte, apagado de fábrica | `sigueElDespertar.ts:71`; `recordatorios.despertar.descarga.texto` | Scullin 2018 |
| La siesta | «20 minutos» en el diagnóstico de Ascent; «30 minutos antes de las 16» en las sugerencias de hoy; «corta y temprano» después de un partido | `ascent.diagnostico.consejos.siesta`; `ascent.sugerencias.sueno.dormistePocoSinHora`; `sueno.deporte.partidoDeNoche` | `sugerencias-de-hoy.md` §5.2 |
| El alcohol, la luz de la mañana, la ducha, el despertar parecido | Propuestos y sin programar (D7 de `momentos.md`) | — | `momentos.md` §6 |
| La temperatura, el ruido, la oscuridad, la nicotina, la ropa, levantarse si no te duermes | Nada | — | — |

«Esta noche», en Sueño, ya muestra la hora de acostarte y la de la última comida. La lista nueva va abajo de
todo y explica **el porqué**; donde Moss tiene la hora de hoy (el café, la comida, lo fuerte, las luces, la
ducha), la puede poner en el punto (sección 7).

---

## 2. Punto por punto

En el orden de la tabla de la sección 3.

### 2.1 Darte tiempo para dormir

- **Recomendación:** acostarte con tiempo para dormir lo que necesitas: de 7 a 9 h la mayoría de los adultos
  (de 7 a 8 desde los 65 y de 8 a 10 en adolescentes, según la NSF), más lo que tardas en dormirte.
- **Por qué:** el sueño corto sostenido se acumula: en el laboratorio, 4 o 6 h en la cama durante dos semanas
  dejaron la atención como hasta dos noches sin dormir, y la gente casi no lo notaba (Van Dongen 2003, ya en la
  spec).
  Las guías piden 7 h o más de forma regular para la salud; más de 9 puede ser normal en jóvenes o al recuperar
  sueño, y la necesidad varía entre personas.
- **Fuerza:** **fuerte** (dos consensos formales, AASM y SRS con el método RAND, NSF con 18 expertos, sobre
  revisiones de la evidencia; casi todo observacional en lo de la salud, experimental en lo del rendimiento).
- **Fuentes:** Watson 2015 (AASM y SRS) [T·h] https://doi.org/10.5664/jcsm.4758 · Hirshkowitz 2015 (NSF) [R]
  https://doi.org/10.1016/j.sleh.2014.12.010 · Van Dongen 2003, ya en la spec.
- **Con Moss:** es la hora de «Esta noche». La necesidad es la de Perfil; el punto no la repite con otro número.

### 2.2 El último café

- **Recomendación:** un café, al menos unas 9 h antes de acostarte; uno grande o un preentreno, hasta 13 h; un
  té, sin problema.
- **Por qué:** la cafeína tarda horas en irse (vida media típica de 3 a 6 h). En 24 estudios quitó en promedio
  45 minutos de sueño, sumó 9 minutos para dormirse, 12 despierto en la noche y 11 menos de sueño profundo.
  Aunque te duermas igual, la noche es más corta y más liviana.
- **Fuerza:** **fuerte** (metaanálisis; el número exacto de horas, moderada: es donde la pérdida deja de ser
  estadísticamente detectable).
- **Fuentes:** Gardiner 2023 [R aquí; T en `momentos.md`] https://doi.org/10.1016/j.smrv.2023.101764 · Gardiner
  2025 (ensayo) y Drake 2013, ya en la spec.
- **Con Moss:** el corte de hoy ya lo calcula `corteDeCafeina`.

### 2.3 El alcohol

- **Recomendación:** no usar el alcohol para dormir; si tomas, cuanto menos y más temprano, mejor. **No hay una
  hora segura.**
- **Por qué:** desde dosis bajas (0,5 g/kg o menos, unos dos tragos estándar) atrasa y acorta el sueño REM, y
  empeora con la dosis; solo con dosis altas (0,85 g/kg, unos cinco tragos) uno se duerme antes, y eso agrava lo
  del REM. Una dosis moderada seis horas antes de acostarse, con el alcohol ya en cero, igual cortó la segunda mitad
  de la noche (Landolt 1996).
- **Fuerza:** **fuerte** para el efecto según la dosis (27 estudios); **sin evidencia** de un horario (casi todos
  dieron el alcohol en las 3 h antes de la cama).
- **Fuentes:** Gardiner 2025 [R aquí; T en `momentos.md`] https://doi.org/10.1016/j.smrv.2024.102030 · Landolt
  1996, ya en la spec.
- **Con Moss:** la línea de la mañana siguiente de D7 (`momentos.md` §6.3) es el complemento.

### 2.4 Despertarte a la misma hora

- **Recomendación:** levantarte a una hora parecida todos los días, también el fin de semana. Si en la semana
  dormiste poco, recuperar 1 a 2 h los días libres puede ayudar.
- **Por qué:** el reloj del cuerpo sigue sobre todo a la hora de despertarte (Burgess y Eastman 2005, ya en la
  spec); un fin de semana con todo 2 a 3 h más tarde atrasa la melatonina 30 a 45 minutos (Yang 2001; Crowley y
  Carskadon 2010, ya en la spec), y el domingo cuesta dormirse. Un panel de la NSF concluyó que la regularidad
  importa para la salud, la seguridad y el rendimiento, y que dormir más los días libres puede servir cuando en
  la semana no alcanza. En 60.977 personas medidas con acelerómetro, los cuatro quintiles más regulares tuvieron
  de 20 a 48 % menos mortalidad que el más irregular, y la regularidad predijo mejor que la duración.
- **Fuerza:** **moderada a fuerte** (consenso formal y una cohorte grande con medición objetiva; pocos ensayos
  que cambien el horario y midan salud). El «parecida» no tiene número: «una hora» es **convención**.
- **Fuentes:** Sletten 2023 (NSF) [R] https://doi.org/10.1016/j.sleh.2023.07.016 y su página en la NSF [T·h]
  https://www.thensf.org/sleep-schedules-sleep-timing-guideline/ · Windred 2024 [R]
  https://doi.org/10.1093/sleep/zsad253.

### 2.5 Luz baja de noche

- **Recomendación:** en las horas antes de acostarte, luz baja y cálida (lámparas bajas en vez de la luz del
  techo); según el consenso, **desde al menos 3 h antes**. Cuanto antes, mejor.
- **Por qué:** la luz común de una casa en las horas antes de dormir atrasó el inicio de la melatonina en el 99 %
  de las personas y la acortó unos 90 minutos (Gooley 2011); con unos 25 lux ya se suprime la mitad, y la
  sensibilidad cambia muchísimo de una persona a otra (Phillips 2019). El consenso de 18 expertos pide como
  máximo 10 lux melanópicos «desde al menos 3 horas antes de acostarse», con luz pobre en azules.
- **Fuerza:** **moderada** (consenso sobre estudios de laboratorio, que coinciden; el efecto en la latencia de
  personas sanas en casa, poco medido).
- **Fuentes:** Brown 2022 [T, las recomendaciones] https://doi.org/10.1371/journal.pbio.3001571 · Gooley 2011 y
  Phillips 2019, ya en la spec.
- **Choca** con el aviso de las luces a los 90 minutos (sección 5).

### 2.6 Si no te duermes, levántate

- **Recomendación:** si sientes que llevas un rato largo sin dormirte (unos 20 minutos, **estimados, sin mirar
  el reloj**), levántate, haz algo tranquilo con poca luz y vuelve a la cama cuando tengas sueño. Acostarte solo
  con sueño; la cama, para dormir (y el sexo).
- **Por qué:** es el control de estímulos: busca que la cama vuelva a asociarse con dormirse y no con dar
  vueltas, junto con un despertar fijo y sin siestas. Mirar el reloj aumenta la preocupación y alarga lo que se
  tarda en dormirse, en buenos y en malos dormidores (Tang 2007, dos experimentos).
- **Fuerza:** para el **insomnio crónico**, **fuerte** como parte de la TCC-I (AASM 2021, recomendación fuerte;
  guía europea 2023, grado A). Solo, **condicional y con evidencia baja**: en la revisión de la AASM, 10 minutos
  menos para dormirse y 19 menos despierto en la noche, sin significación (8 ensayos en total, de 3 a 4 por
  medida; números por la herramienta de lectura). **Para quien duerme bien, es una extrapolación**: no encontré
  ensayos en esa gente. Los «20 minutos» salen de la guía de la AASM de 2008, sin estudio propio: **convención clínica**.
- **Fuentes:** Schutte-Rodin 2008 (AASM) [T·h, la tabla de tratamientos] https://doi.org/10.5664/jcsm.27286 ·
  Edinger 2021, guía [R] https://doi.org/10.5664/jcsm.8986 y revisión [T·h, en parte]
  https://doi.org/10.5664/jcsm.8988 · Riemann 2023 (guía europea) [R] https://doi.org/10.1111/jsr.14035 · Tang
  2007 [R] https://doi.org/10.1016/j.jbtep.2005.07.004.
- **Lo que no se dice:** la restricción del sueño (la otra parte fuerte de la TCC-I) no va en una lista para
  todos: se hace con un profesional. Si te pasa casi todas las noches desde hace meses, se nombra la TCC-I y un
  médico.

### 2.7 Moverte de día (y lo intenso, no pegado a la cama)

- **Recomendación:** moverte casi todos los días; lo intenso, que termine al menos 2 h antes de acostarte (mejor
  4); caminar o estirar, a cualquier hora.
- **Por qué:** una revisión de revisiones hecha para las guías de actividad física de EE. UU. encontró evidencia
  fuerte de que tanto una sesión como la actividad regular mejoran el sueño, también en mayores y con síntomas
  de insomnio. El tamaño es chico a moderado: la actividad regular, efectos chicos en el tiempo dormido y la
  eficiencia, chicos a medianos en lo que se tarda en dormirse y moderados en la calidad (66 estudios). Lo
  intenso pegado a la cama es lo único que puede molestar (ya en la spec).
- **Fuerza:** **fuerte** que ayuda; **moderada** para la hora.
- **Fuentes:** Kline 2021 [R] https://doi.org/10.1016/j.smrv.2021.101489 · Kredlow 2015 [R]
  https://doi.org/10.1007/s10865-015-9617-6 · Frimpong 2021, Stutz 2019 y Leota 2025, ya en la spec.
- **Con Moss:** el límite de hoy ya lo calcula `FIN_DE_LO_FUERTE`.

### 2.8 Una habitación fresca

- **Recomendación:** fresca y sin calor: **unos 16 a 20 °C con tu ropa de cama de siempre**; lo que más importa
  es no pasar de 25 °C, y menos con humedad. En personas mayores, algo más templada (20 a 25 °C) parece mejor.
- **Por qué:** para dormirse, el cuerpo baja su temperatura central soltando calor por la piel. Con ropa de cama,
  el calor es lo que despierta y quita sueño profundo y REM; el frío, con abrigo suficiente, no cambió las etapas
  entre 13 y 23 °C ni entre 3 y 17 °C (revisión de Okamoto-Mizuno, aunque el frío sí cambió la regulación
  autonómica del corazón).
  En 16 mayores con polisomnografía, 30 °C contra 27 °C: 26 minutos menos de sueño, 5,5 % menos de eficiencia y
  27 minutos más despierto (Yan 2022). En mayores en su casa, lo mejor fue entre 20 y 25 °C, con un 5 a 10 %
  menos de eficiencia de 25 a 30 °C y mucha diferencia entre personas (Baniassadi 2023). En 17 jóvenes, se
  durmió mejor a 17 °C que a 22 °C (Shin 2016).
- **Fuerza:** **moderada** que el calor empeora el sueño (laboratorio y cohortes que coinciden); **convención**
  el número ideal. La NSF dice «entre 60 y 67 °F» (15,6 a 19,4 °C; cuenta mía) en su página de consejos, sin
  citar un estudio. El rango de 16 a 20 °C es esa cifra redondeada y el 17 °C de Shin; el tope de 25 °C sale de
  Baniassadi y Yan.
- **Ojo con las fuentes:** el «60 a 67 °F» que repite medio internet viene de sleepfoundation.org, que según su
  propia página **no es la National Sleep Foundation** (se separó en 2019 y es de una empresa). La NSF de verdad
  (thensf.org) dice lo mismo, también sin estudio. Shin 2016 tiene dos autores de Australian Wool Innovation, y la
  revisión de Troynikov 2018, fondos de la industria del algodón.
- **Fuentes:** Okamoto-Mizuno 2012 [T, en parte] https://doi.org/10.1186/1880-6805-31-14 · Yan 2022 [R]
  https://doi.org/10.1111/ina.13159 · Baniassadi 2023 [R] https://doi.org/10.1016/j.scitotenv.2023.165623 ·
  Shin 2016 [T, métodos y autores; resultados del resumen] https://doi.org/10.2147/NSS.S100271 · NSF, consejos
  de sueño [T·h] https://www.thensf.org/sleep-tips/.

### 2.9 Oscura y en silencio

- **Recomendación:** la habitación, **lo más oscura posible** (cortinas que tapen, o un antifaz) y en silencio;
  si te levantas de noche, luz tenue. Si entra ruido de afuera, **tapones**, mejor que ruido blanco.
- **Por qué:** el consenso pide como máximo 1 lux melanópico en el lugar donde se duerme. Una noche con luz de
  habitación (100 lux) contra < 3 lux subió el pulso de la noche y la resistencia a la insulina de la mañana
  siguiente (Mason 2022, 20 adultos sanos); en 863 mayores, dormir con 5 lux o más se asoció a casi el doble de
  depresión en dos años (Obayashi 2018, observacional). El ruido del tránsito despierta: por cada 10 dB más
  en el pico de cada ruido dentro de la habitación, la probabilidad de despertarse sube (OR 1,35, en los datos
  juntados de varios estudios con polisomnografía), y la OMS pide no pasar de 40 a 45 dB de noche afuera. En 25
  adultos con polisomnografía, los tapones frenaron casi todo el efecto del ruido (fallaban recién con 65 dB); el ruido rosa, en cambio, **quitó sueño REM** y, sumado al ruido, empeoró la
  noche (Basner 2026).
- **Fuerza:** **moderada** (el ruido: evidencia moderada según GRADE para los despertares; la oscuridad:
  consenso y estudios chicos o de observación). El ruido blanco como ayuda: **muy baja** (Riedy 2021).
- **Fuentes:** Brown 2022 [T] · Mason 2022 [T, métodos y resultados] https://doi.org/10.1073/pnas.2113290119 ·
  Obayashi 2018 [R] https://doi.org/10.1093/aje/kwx290 · Basner y McGuire 2018 (para la OMS) [R y T en parte]
  https://doi.org/10.3390/ijerph15030519 · Basner 2026 [T, en parte] https://doi.org/10.1093/sleep/zsag001 ·
  Riedy 2021 [R] https://doi.org/10.1016/j.smrv.2020.101385.
- **Ojo:** la página de la NSF todavía sugiere ruido blanco «de un ventilador o una máquina»; los dos trabajos
  más nuevos no lo sostienen. El 40 a 45 dB de la OMS lo leí en Basner 2026; el documento de la OMS dio 403
  (**no confirmado** en la fuente).

### 2.10 Luz de día temprano

- **Recomendación:** salir un rato a la luz de día por la mañana (o trabajar cerca de una ventana). Nadie midió
  cuántos minutos: sin número.
- **Por qué:** la luz de la mañana adelanta el reloj y la de la noche lo atrasa (Khalsa 2003, ya en la spec);
  adentro suele haber al menos diez veces menos luz que afuera (Brown 2022), que pide de día al menos 250 lux
  melanópicos, mejor de luz natural. En unas 400.000 personas, cada hora más afuera de día se asoció a
  despertarse más fácil (OR 1,46 a 1,49), menos cansancio y menos insomnio (OR 0,94 a 0,97). La luz como
  tratamiento mejora los problemas de sueño con un efecto chico a mediano (g = 0,39; 53 estudios).
- **Fuerza:** **moderada** (consenso, una cohorte enorme pero observacional, y un metaanálisis de luz brillante
  sobre todo en gente con problemas de sueño). La hora y los minutos: **convención**.
- **Fuentes:** Brown 2022 [T] · Burns 2021 [R] https://doi.org/10.1016/j.jad.2021.08.056 · van Maanen 2016 [R]
  https://doi.org/10.1016/j.smrv.2015.08.009 · Khalsa 2003, ya en la spec.

### 2.11 Nada de nicotina tarde

- **Recomendación:** si fumas o vapeas, no hacerlo en las **4 h antes de acostarte**.
- **Por qué:** la nicotina es un estimulante: en una revisión de 52 estudios, fumar se asoció a tardar más en
  dormirse, una noche más cortada, menos sueño profundo y menos REM. Con polisomnografía, en 6.400 personas, los
  fumadores tardaron 5,4 minutos más en dormirse y durmieron 14 menos que quienes nunca fumaron; los exfumadores,
  igual que quienes nunca fumaron. En 785 personas seguidas noche por noche, la nicotina en las 4 h antes de
  acostarse se asoció esa noche a 1,7 % menos de eficiencia y 6 minutos más despierto. Al dejarla, la
  abstinencia también empeora el sueño por un tiempo (Jaehne 2009).
- **Fuerza:** **moderada** (observacional y consistente, con un mecanismo claro; no hay ensayos que corran la
  hora). Las 4 h son la ventana que usó Spadola, no un umbral probado: **derivado**.
- **Fuentes:** Zhang 2006 [R] https://doi.org/10.1093/aje/kwj231 · Spadola 2019 [R]
  https://doi.org/10.1093/sleep/zsz136 · Jaehne 2009 [R] https://doi.org/10.1016/j.smrv.2008.12.003 · Amiri 2020
  (metaanálisis de cohortes: RR 1,47 de problemas de sueño) [R] https://doi.org/10.17269/s41997-020-00308-3.
- **Lo que no se dice:** nada de «deja de fumar» como consejo médico; Moss no sabe si fumas, así que el punto
  empieza con «si fumas o vapeas».

### 2.12 La cena, con tiempo

- **Recomendación:** la última comida grande, al menos **2 h antes de acostarte** (3 con reflujo); después, si
  tienes hambre, algo ligero. Ningún alimento demostró de verdad que ayude a dormir.
- **Por qué:** comer grande cerca de la cama se asocia sobre todo a reflujo (cenar a menos de 3 h, OR 7,45 contra
  4 h o más), y la guía del reflujo pide 2 a 3 h (ya en la spec). Para el sueño en sí la evidencia es débil: cenar
  1 h antes no cambió el sueño medido en 20 jóvenes (Gu 2020, ya en la spec); en la encuesta de uso del tiempo de
  EE. UU., comer o beber en la hora antes de acostarse se asoció a más despertares de noche (OR 2,03 en mujeres y
  2,64 en hombres), aunque también a dormir más (Iao 2022, observacional). Lo que sí se repite: más fibra y menos grasa saturada y azúcar, sueño más profundo y menos
  despertares (St-Onge 2016, 26 adultos); dietas con fibra, frutas y verduras se asocian a mejor sueño (Wilson
  2022, 20 estudios con sueño medido).
- **Los alimentos «para dormir»:** el kiwi, 2 por noche durante 4 semanas, en 24 personas **sin grupo de
  control** (Lin 2011); las cerezas ácidas, 7 ensayos chicos, 3 con mejoras, con dosis y personas muy distintas
  (Barforoush 2025); la revisión narrativa de Binks 2020 los ve «prometedores» con pocos estudios. No alcanza para
  recomendar uno.
- **Fuerza:** **moderada** para el reflujo; **débil** para el sueño; **débil** para alimentos puntuales.
- **Fuentes:** Katz 2022 (ACG), Fujiwara 2005, Gu 2020 y Kinsey y Ormsbee 2015, ya en la spec · Iao 2022 [R]
  https://doi.org/10.1017/S0007114521003597 · St-Onge 2016 [R] https://doi.org/10.5664/jcsm.5384 · Wilson 2022 [R]
  https://doi.org/10.1016/j.jand.2022.01.007 · Binks 2020 [T, en parte] https://doi.org/10.3390/nu12040936 · Lin
  2011 [R] PMID 21669584 · Barforoush 2025 [R] https://doi.org/10.1002/fsn3.70923.
- **Con Moss:** coincide con `CERCA_DE_LA_CAMA`; la hora de hoy ya está en «Esta noche».

### 2.13 Una ducha o un baño tibio

- **Recomendación:** agua **bien tibia, de 40 a 42,5 °C**, al menos 10 minutos, **1 a 2 h antes de acostarte**.
  (Es más caliente que «tibia» en el habla común: se siente caliente y agradable.)
- **Por qué:** al salir, la sangre va a las manos y los pies, el cuerpo suelta calor y su temperatura central
  baja más rápido, que es lo que acompaña al sueño. En 13 estudios con datos comparables, mejoró la calidad y la
  eficiencia del sueño y, a 1 a 2 h de la cama, acortó lo que se tarda en dormirse; según la universidad de los
  autores, unos 10 minutos en promedio (**no confirmado** en el artículo). En mayores, un baño de pies a 40 °C de
  hasta 20 minutos, 1 h antes, mejoró la calidad percibida (11 estudios).
- **Fuerza:** **moderada** (metaanálisis de estudios chicos y escasos; los mismos autores piden más).
- **Fuentes:** Haghayegh 2019 [R] https://doi.org/10.1016/j.smrv.2019.04.008 y el comunicado de la Universidad
  de Texas [T·h] https://cockrell.utexas.edu/?p=23504 · Jiang 2024 [R] https://doi.org/10.1089/jicm.2023.0193.
- **Con Moss:** es la propuesta de D7 («Ducha tibia», 90 minutos antes de la cama).

### 2.14 Pantallas: lo que te acelera, no la luz azul

- **Recomendación:** antes de acostarte, que lo de la pantalla sea tranquilo (nada de redes, juegos, series que
  enganchan o trabajo), con el brillo bajo, y el teléfono **fuera de la cama**. El modo nocturno y los filtros, por
  sí solos, no hacen falta.
- **Lo que está probado:** que la luz de la casa en las horas antes de dormir atrasa la melatonina (2.5); que
  leer 4 h en una tableta brillante, cinco noches, atrasó la melatonina y el sueño (Chang 2015, ya en la spec); y
  que en jóvenes los días con más pantalla se duermen más tarde, y la pantalla ya acostado es la que más baja la
  calidad (Bourke 2026, ya en la spec). Con pantallas iguales a la vista, la de menos luz melanópica hizo
  dormirse antes y subir la melatonina a tiempo, pero solo se notó en la latencia con la más brillante, la de
  una computadora (Schöllhorn 2023, 72 hombres).
- **Lo que no está probado:** que la luz de las pantallas, sola, dañe el sueño: el consenso de la NSF (2024, 16
  expertos, método Delphi) **no llegó a acuerdo** en eso para ninguna edad, ni en que las pantallas dañen el
  sueño de los adultos; sí en niños y adolescentes, y por el contenido. El mismo panel vio que reducir lo
  interactivo (juegos, redes) era lo que mejor funcionaba y que filtrar la luz azul mejoraba poco. El modo
  nocturno del iPhone, una hora antes de dormir durante una semana, no cambió el sueño contra usarlo sin el
  modo ni contra no usar el teléfono (Duraccio 2021, 167 personas de 18 a 24 años). Las gafas ámbar: resultados
  mezclados en 12 estudios, mejor en gente con insomnio u otros trastornos (Shechter 2020), y certeza muy baja en
  Cochrane (ya en la spec).
- **Fuerza:** **débil a moderada** en adultos (lo del contenido y la cama); la luz azul de las pantallas sola,
  **no probada**.
- **Fuentes:** Hartstein 2024 (NSF) [T·h, casi entero] https://doi.org/10.1016/j.sleh.2024.05.001 · Duraccio 2021
  [R] https://doi.org/10.1016/j.sleh.2021.03.005 · Schöllhorn 2023 [T, en parte]
  https://doi.org/10.1038/s42003-023-04598-4 · Shechter 2020 [R] https://doi.org/10.1093/sleepadvances/zpaa002 ·
  Chang 2015, Bourke 2026 y Singh 2023 (Cochrane), ya en la spec.

### 2.15 La cabeza tranquila

- **Recomendación:** si algo te da vueltas, escribe 5 minutos lo pendiente de mañana, bien concreto. En la última
  hora, algo tranquilo: leer, respirar despacio, una relajación o una meditación.
- **Por qué:** en 57 jóvenes con polisomnografía, quienes escribieron su lista de pendientes se durmieron antes
  que quienes escribieron lo que ya habían hecho, y más rápido cuanto más concreta era la lista (Scullin 2018;
  la comparación es entre dos escrituras, no contra no escribir). La meditación de atención plena mejoró la
  calidad del sueño contra controles no específicos (ES 0,33; 18 ensayos, 1.654 personas), pero no contra
  tratamientos del sueño de verdad. Para el insomnio crónico, la relajación tiene recomendación condicional de la
  AASM.
- **Fuerza:** **moderada a débil** (un ensayo chico; un metaanálisis con evidencia moderada contra controles
  inespecíficos). Cuánto antes empezar a bajar el ritmo: **convención** (la hora de `REVOLUCIONES`).
- **Fuentes:** Scullin 2018 [R] https://doi.org/10.1037/xge0000374 · Rusch 2019 [R]
  https://doi.org/10.1111/nyas.13996 · Edinger 2021 [R].
- **Con Moss:** coincide con los avisos de anotar y de bajar el ritmo.

### 2.16 La siesta, corta y temprano

- **Recomendación:** si duermes siesta, de **10 a 20 minutos** y al menos **7 h antes de acostarte** (para
  quien se acuesta a las 23, antes de las 16). Con insomnio, mejor sin siesta.
- **Por qué:** después de dormir poco, 10 minutos fue lo que más despertó; 30 minutos dejaron aturdimiento al
  despertar (Brooks y Lack 2006). La siesta a menos de 7 h de la noche se asocia a dormir peor esa noche (Mograss
  2022), y las siestas habituales de 30 minutos o más, a más mortalidad en cohortes, con confusión posible (Yang
  2024). El control de estímulos pide no dormir siesta (2.6).
- **Fuerza:** **moderada** para el largo; **débil** para la hora.
- **Fuentes:** Brooks y Lack 2006, Mograss 2022 y Yang 2024, ya en la spec · Schutte-Rodin 2008 [T·h].
- **Choca** un poco con el «30 minutos» de las sugerencias de hoy (sección 5).

### 2.17 Ropa que no dé calor, y calcetines si tienes frío

- **Recomendación:** pijama y ropa de cama que no te hagan sudar; si tienes los pies fríos, calcetines.
- **Por qué:** calentar la piel de los pies, sin cambiar la temperatura central, ayuda a dormirse: unos
  calcetines después de apagar la luz aceleraron el dormirse en adultos, y la mejora fue según cuánto subió la
  temperatura del pie (en mayores con insomnio, nada sirvió; Raymann 2007). Con un traje que subió 0,4 °C la piel,
  menos despertares y sueño más profundo, sobre todo en mayores (Raymann 2008). En 6 hombres a 23 °C, con
  calcetines, 7,5 minutos menos para dormirse, 32 más de sueño y 7,6 % más de eficiencia (Ko y Lee 2018,
  actigrafía). Sudar y los cambios bruscos de temperatura bajan la calidad, pero lo investigado de telas y ropa
  de cama es escaso (Troynikov 2018). La lana contra el algodón: a 17 °C, la lana durmió antes (Shin 2016, con
  autores de la industria de la lana).
- **Fuerza:** **débil** (laboratorio, muestras de 6 a 24 personas, parte con la industria).
- **Fuentes:** Raymann 2007 [R] https://doi.org/10.1016/j.physbeh.2006.09.008 · Raymann 2008 [R]
  https://doi.org/10.1093/brain/awm315 · Ko y Lee 2018 [R] https://doi.org/10.1186/s40101-018-0172-z ·
  Troynikov 2018 [R] https://doi.org/10.1016/j.jtherbio.2018.09.012 · Shin 2016 [T, en parte].

---

## 3. Tabla: de más a menos importante

El orden junta dos cosas: cuánto cambia una noche común (el tamaño del efecto, en lo medido) y qué tan firme es
lo que lo sostiene. Lo que vale solo para algunos (quien fuma, quien duerme siesta) baja, aunque su efecto sea
real.

| # | Punto | Lo que cambia (lo medido) | Fuerza | Para quién |
|---|---|---|---|---|
| 1 | Darte tiempo para dormir (7 a 9 h) | Dormir menos se acumula y no se nota (Van Dongen 2003) | **Fuerte** (AASM y SRS, NSF) | Todos |
| 2 | El último café (9 h antes; 13 con una dosis grande) | −45 min de sueño, +9 min para dormirse (24 estudios) | **Fuerte** | Quien toma cafeína |
| 3 | El alcohol (sin hora segura) | Menos REM desde unos dos tragos, según la dosis (27 estudios) | **Fuerte** (efecto); horario sin evidencia | Quien toma |
| 4 | Despertarte a la misma hora | 20 a 48 % menos mortalidad en los más regulares (observacional); fin de semana tarde, melatonina 30 a 45 min más tarde | **Moderada a fuerte** (consenso NSF y cohorte) | Todos |
| 5 | Luz baja de noche (desde 3 h antes) | Luz de casa: melatonina más tarde en el 99 % y 90 min más corta | **Moderada** (consenso sobre laboratorio) | Todos |
| 6 | Si no te duermes, levántate | TCC-I: tratamiento de primera línea del insomnio; el control de estímulos solo, efecto no significativo | **Fuerte** en insomnio crónico; extrapolación en el resto | Sobre todo quien tarda en dormirse |
| 7 | Moverte de día; lo intenso, 2 h antes (mejor 4) | Efectos chicos a moderados en el sueño (66 estudios) | **Fuerte** (que ayuda); moderada (la hora) | Todos |
| 8 | Habitación fresca (16 a 20 °C, no más de 25) | 30 °C contra 27: −26 min de sueño (mayores); 25→30 °C: −5 a 10 % de eficiencia | **Moderada** (el calor); el número, convención | Todos, más en verano |
| 9 | Oscura y en silencio (tapones, no ruido blanco) | Despertarse, OR 1,35 por cada 10 dB; los tapones frenan casi todo | **Moderada** | Sobre todo con luz o ruido de afuera |
| 10 | Luz de día temprano | Por hora afuera, OR 1,46 de despertarse fácil (observacional); luz brillante, g = 0,39 | **Moderada** | Todos |
| 11 | Sin nicotina en las 4 h antes | Fumadores: +5,4 min para dormirse, −14 min de sueño | **Moderada** (observacional) | Quien fuma o vapea |
| 12 | La cena, 2 h antes (3 con reflujo) | Reflujo: OR 7,45 cenando a menos de 3 h; el sueño, poco | **Moderada** (reflujo); **débil** (sueño) | Todos; más con reflujo |
| 13 | Ducha o baño tibio, 1 a 2 h antes | Unos 10 min menos para dormirse (comunicado, no confirmado) | **Moderada** (estudios chicos) | Todos |
| 14 | Pantallas: lo que te acelera, fuera de la cama | En adultos, sin consenso; el modo nocturno no cambió nada | **Débil a moderada**; la luz azul sola, no probada | Todos |
| 15 | La cabeza tranquila (anotar, relajarse) | Lista de pendientes: se durmieron antes (n = 57); atención plena, ES 0,33 | **Moderada a débil** | Quien se acuesta pensando |
| 16 | Siesta de 10 a 20 min, 7 h antes de la cama | Siesta tarde, peor esa noche (asociación) | **Moderada** (largo); **débil** (hora) | Quien duerme siesta |
| 17 | Ropa sin calor; calcetines si hay frío | Calcetines: −7,5 min para dormirse (n = 6) | **Débil** | Quien tiene frío o suda |

**Para la app:** con 17 puntos, conviene mostrar los primeros 8 a 10 y el resto al tocar «Ver todo», o
esconder los que no aplican (el café a quien no anota cafeína, el alcohol a quien no lo anota; la nicotina y la
siesta no se pueden saber, así que van con «si fumas» y «si duermes siesta»). Es una decisión de diseño, para la
galería.

---

## 4. Lo que sale de la lista (y por qué)

| Qué | Por qué sale | Fuentes |
|---|---|---|
| Alimentos «para dormir» (kiwi, cerezas ácidas, leche tibia, triptófano) | Estudios chicos y distintos entre sí; el del kiwi, sin grupo de control (24 personas); cerezas, 3 de 7 ensayos con mejoras. Queda una línea dentro de la cena: «ningún alimento ha demostrado de verdad que ayude a dormir» | Lin 2011 [R]; Barforoush 2025 [R]; Binks 2020 [T, en parte] |
| Gafas y filtros de luz azul, el modo nocturno | Gafas: certeza muy baja (Cochrane) y resultados mezclados; modo nocturno: sin cambios; el consenso de la NSF: filtrar mejora poco. El aviso de las gafas sigue apagado de fábrica (D10), fuera de la lista | Singh 2023, ya en la spec; Shechter 2020 [R]; Duraccio 2021 [R]; Hartstein 2024 [T·h] |
| Ruido blanco o rosa | Calidad de la evidencia muy baja; en el ensayo más nuevo, el ruido rosa quitó REM y empeoró la noche con ruido | Riedy 2021 [R]; Basner 2026 [T] |
| Mantas con peso | «No hay suficiente evidencia de que ayuden con el insomnio» (8 estudios) | Eron 2020 [R] https://doi.org/10.5014/ajot.2020.037358 |
| Melatonina y otros suplementos | Moss no nombra productos ni suplementos (`momentos.md` §7); además, la guía europea no recomienda la melatonina de liberación rápida para el insomnio (grado A) | Riemann 2023 [R] |
| El líquido de noche | Sin evidencia de horario ni de beneficio en gente sana; el consenso de la nocturia dice solo que los cambios de hábitos «pueden servir». Si se quiere, va como línea opcional para quien se levanta al baño (sección 6) | ICS 2019 (Everaert) [R] https://doi.org/10.1002/nau.23939 |
| Una rutina fija para acostarse | No encontré estudios de una rutina como tal en adultos; lo que tiene evidencia (anotar, relajarse, luz baja, levantarse si no te duermes) ya está en otros puntos | — |
| El colchón y la almohada | No es de cada noche; no lo investigué | — |

---

## 5. Lo que choca con lo que Moss ya hace

1. **Las luces: 90 minutos contra 3 h.** El aviso de las luces suena 90 minutos antes de la cama (`LUCES = 90`,
   `loQueConviene.ts:101`); el consenso pide luz baja desde al menos 3 h antes (Brown 2022, ahora leído en el
   texto). Es la D2 de `momentos.md`, todavía abierta. Si la lista dice «desde 3 h antes» y el aviso suena a la
   hora y media, Moss se contradice. Opciones: (a) la lista dice «cuanto antes, mejor; los expertos dicen desde
   3 horas antes» y el aviso queda en 90 minutos como lo práctico (recomendado: la lista explica, el aviso
   recuerda); (b) el aviso pasa a 3 h; (c) la lista dice 90 minutos (no: no es lo que dice la evidencia).
2. **El aviso de las gafas promete más de lo que hay.** `recordatorios.despertar.gafas.texto` dice «pueden ayudar
   a que tu melatonina suba a tiempo». Perfil sí aclara «la evidencia todavía es poca» (`perfil.avisos.gafasTexto`),
   pero el aviso no. Con Cochrane (certeza muy baja), Shechter 2020 (mezclado) y el consenso de la NSF (filtrar
   mejora poco), el aviso debería sumar «la evidencia es poca» o decir «a algunas personas les ayuda».
3. **«Pantallas brillantes».** El aviso de bajar el ritmo (`recordatorios.despertar.revoluciones.texto`, «algo
   tranquilo y lejos de las pantallas brillantes») y Perfil (`perfil.avisos.revolucionesTexto`) ponen el peso en
   el brillo. En adultos, lo que más sostiene la evidencia es el contenido y la pantalla en la cama; el brillo
   importa poco salvo en pantallas muy brillantes (Schöllhorn 2023). No es un error, pero la lista diría otra
   cosa. Propuesta: «algo tranquilo y lejos de lo que te acelera (redes, juegos, trabajo)».
4. **Dos largos de siesta.** `ascent.diagnostico.consejos.siesta` dice 20 minutos y
   `ascent.sugerencias.sueno.dormistePocoSinHora`, 30 minutos antes de las 16 (elegido en
   `sugerencias-de-hoy.md` §5.2 pensando en el rendimiento físico, donde 30 a 60 minutos rindieron más). Para el
   sueño de la noche y para no despertarse aturdido, 10 a 20 minutos (Brooks y Lack 2006). No es grave (30 es el
   borde), pero tres textos con tres cosas distintas confunden. Propuesta: que las sugerencias digan «una siesta
   corta, de hasta 20 minutos» salvo el día de entrenar, o dejarlo y que la lista diga «de 10 a 20 minutos;
   antes de entrenar, hasta 30».
5. **«Ayuda a dormirte antes».** `recordatorios.despertar.descarga.texto` lo afirma; Scullin 2018 comparó la
   lista de pendientes con escribir lo hecho, no con no escribir nada. Más exacto: «Anotar tus pendientes antes de
   acostarte te ayuda a soltar la cabeza; en un estudio, quienes lo hicieron se durmieron antes». Matiz menor.
6. **La proteína antes de dormir.** Moss sugiere 20 a 40 g unos 30 minutos antes de dormir si falta proteína
   (`alrededorDelEntreno.ts`, `FALTA_PARA_DORMIR`), y la lista dice «después de la última comida grande, algo
   ligero». No choca si es chico (las ideas de noche ya están topeadas en 250 kcal, `loQueFalta.ts:120`); comer en
   la hora antes de acostarse se asoció a más despertares en una encuesta (Iao 2022), así que conviene que la
   idea de noche siga siendo un lácteo chico.
7. **Un comentario viejo.** La cabecera de `loQueConviene.ts:16` dice «la última comida grande (3 h antes)»; la
   constante es `ULTIMA_COMIDA = CERCA_DE_LA_CAMA` = 2 h (3 con reflujo) desde el 5/11. Solo el comentario.

Lo demás coincide: el corte del café desde la hora de acostarte y según la dosis, lo fuerte 2 h antes, la
última comida 2 h antes (3 con reflujo), no adelantar la cama con deuda (es lo que pide el control de estímulos:
acostarse con sueño), la propuesta de la ducha a los 90 minutos y la del alcohol sin hora.

---

## 6. Propuesta de textos para la app

Español neutro, con tú. Título de 2 a 4 palabras, explicación de 2 a 3 frases y «En qué se basa» en corto. Donde
dice `{…}`, Moss pone el dato de hoy si lo tiene (sección 7); sin dato, va la frase sin la parte entre corchetes.

**Encabezado de la lista:** «Qué priorizar cada noche». **Pie:** «Son consejos para personas sanas. Si duermes
mal casi todas las noches desde hace meses, lo que más ayuda es la terapia cognitivo-conductual para el insomnio:
háblalo con un médico. Si roncas fuerte o alguien te ha visto dejar de respirar dormido, también.»

1. **Tiempo para dormir**
   Acuéstate con tiempo para dormir lo que necesitas: la mayoría de los adultos necesita de 7 a 9 horas. Dormir
   menos varias noches seguidas se acumula, aunque no lo notes. [Esta noche, a la cama a las {hora}.]
   *En qué se basa:* AASM y Sleep Research Society, 2015 · National Sleep Foundation, 2015.

2. **El último café**
   La cafeína dura horas en el cuerpo: un café, hasta unas 9 horas antes de acostarte; uno grande o un
   preentreno, hasta 13. Más tarde, aunque te duermas, duermes menos y más liviano. [Hoy, hasta las {hora}.]
   *En qué se basa:* Gardiner y otros, 2023 (metaanálisis de 24 estudios).

3. **Alcohol, no para dormir**
   El alcohol puede ayudarte a dormirte, pero hace más liviana la segunda mitad de la noche y te quita sueño
   REM, ya desde unas dos copas. No hay una hora segura: cuanto menos, mejor.
   *En qué se basa:* Gardiner y otros, 2025 (27 estudios) · Landolt y otros, 1996.

4. **Levántate a la misma hora**
   Despertarte a una hora parecida todos los días, también el fin de semana, ordena tu reloj y hace más fácil
   dormirte de noche. Si en la semana dormiste poco, recuperar una o dos horas los días libres puede ayudar.
   *En qué se basa:* National Sleep Foundation, 2023 (consenso) · Windred y otros, 2024 (60.977 personas).

5. **Luz baja de noche**
   En las horas antes de acostarte, luz baja y cálida: lámparas en vez de la luz del techo. La luz de una casa
   iluminada atrasa tu melatonina y la hora en que te da sueño; los expertos aconsejan bajarla desde 3 horas
   antes, y cuanto antes, mejor.
   *En qué se basa:* Brown y otros, 2022 (consenso de 18 expertos) · Gooley y otros, 2011.

6. **Si no te duermes, levántate**
   Si sientes que llevas un buen rato sin dormirte (unos 20 minutos, sin mirar el reloj), levántate, haz algo
   tranquilo con poca luz y vuelve cuando tengas sueño. Así la cama sigue siendo el lugar donde te duermes, no
   donde das vueltas.
   *En qué se basa:* American Academy of Sleep Medicine, 2008 y 2021 (control de estímulos, de la terapia para
   el insomnio) · Tang y otros, 2007.

7. **Muévete de día**
   Moverte casi todos los días te ayuda a dormirte antes y a dormir mejor. Lo intenso, que termine al menos 2
   horas antes de acostarte (mejor 4); caminar o estirar, a cualquier hora. [Hoy, lo fuerte hasta las {hora}.]
   *En qué se basa:* Kline y otros, 2021 (revisión para las guías de actividad física de EE. UU.) · Frimpong y
   otros, 2021.

8. **Una habitación fresca**
   Duerme en una habitación fresca, de unos 16 a 20 °C con tu ropa de cama de siempre. Lo que más quita sueño es
   el calor: por encima de 25 °C, y más con humedad, te despiertas más y duermes menos.
   *En qué se basa:* National Sleep Foundation · Okamoto-Mizuno y Mizuno, 2012 · Baniassadi y otros, 2023.

9. **Oscura y en silencio**
   Que tu habitación esté lo más oscura posible, con cortinas que tapen o un antifaz, y en silencio. Si entra
   ruido de afuera, los tapones funcionan mejor que el ruido blanco o rosa, que en un estudio quitó sueño REM.
   *En qué se basa:* Brown y otros, 2022 · revisión para la OMS, 2018 · Basner y otros, 2026.

10. **Luz de día temprano**
    Sal un rato a la luz de día por la mañana: afuera hay mucha más luz que adentro, y eso ayuda a que te dé
    sueño a tu hora. Quienes pasan más tiempo afuera de día se despiertan con más facilidad y tienen menos
    insomnio.
    *En qué se basa:* Brown y otros, 2022 · Burns y otros, 2021 (unas 400.000 personas).

11. **Sin nicotina tarde**
    Si fumas o vapeas, evita hacerlo en las 4 horas antes de acostarte. La nicotina es un estimulante: se asocia
    a tardar más en dormirte y a una noche más cortada.
    *En qué se basa:* Zhang y otros, 2006 (6.400 personas) · Spadola y otros, 2019.

12. **La cena, con tiempo**
    Haz tu última comida grande al menos 2 horas antes de acostarte, o 3 si tienes reflujo; después, si tienes
    hambre, algo ligero. Ningún alimento ha demostrado de verdad que ayude a dormir. [Hoy, antes de las {hora}.]
    *En qué se basa:* guía del American College of Gastroenterology, 2022 · Wilson, St-Onge y Tasali, 2022.

13. **Ducha tibia antes**
    Una ducha o un baño con el agua bien tibia (40 a 42 °C), de al menos 10 minutos, 1 a 2 horas antes de
    acostarte, te ayuda a dormirte antes. Al salir, el cuerpo suelta calor y su temperatura baja, como le pasa al
    empezar a dormir. [Buen momento: a las {hora}.]
    *En qué se basa:* Haghayegh y otros, 2019 (metaanálisis).

14. **Pantallas tranquilas**
    De las pantallas, lo que más parece pesar no es la luz azul sino lo que te mantiene despierto: redes, juegos,
    series que enganchan o trabajo. Antes de dormir, algo tranquilo, con el brillo bajo y fuera de la cama; el modo
    nocturno, por sí solo, no cambió el sueño en un estudio.
    *En qué se basa:* National Sleep Foundation, 2024 (consenso) · Duraccio y otros, 2021.

15. **La cabeza tranquila**
    Si algo te da vueltas, escribe cinco minutos lo que tienes pendiente para mañana, bien concreto: en un
    estudio, quienes lo hicieron se durmieron antes. En la última hora, algo que te calme: leer, respirar
    despacio o una relajación.
    *En qué se basa:* Scullin y otros, 2018 · Rusch y otros, 2019 (metaanálisis de 18 ensayos).

16. **Siesta corta y temprano**
    Si duermes siesta, que sea de 10 a 20 minutos y al menos 7 horas antes de acostarte. Más larga o más tarde,
    te puede costar dormirte de noche y despertarte aturdido.
    *En qué se basa:* Brooks y Lack, 2006 · Mograss y otros, 2022.

17. **Sin calor en la cama**
    Usa pijama y ropa de cama que no te hagan sudar. Si tienes los pies fríos, unos calcetines pueden ayudarte a
    dormirte antes: calentar la piel de los pies facilita el sueño.
    *En qué se basa:* Raymann y otros, 2007 · Ko y Lee, 2018 (estudios pequeños).

**Opcional (fuera de la lista, sección 4):** **Menos líquido tarde** — «Si te despiertas para ir al baño, toma
menos en las horas antes de acostarte, sin quitarle agua a tu día.» *En qué se basa:* consenso de la
International Continence Society, 2019 (sin un horario probado).

---

## 7. Lo que Moss puede poner con tus datos

| Punto | El dato de hoy | De dónde |
|---|---|---|
| Tiempo para dormir | La hora de acostarte | `horasDeSueno` / el periodo (`melatonina.ts`) |
| El último café | El corte de hoy, según la toma | `corteDeCafeina` (`alrededorDelEntreno.ts:142`) |
| Alcohol | Si anoche hubo (la línea de D7) | Lo anotado con alcohol |
| Muévete de día | Lo fuerte, hasta qué hora (si hay sesión hoy) | `FIN_DE_LO_FUERTE` |
| La cena | La hora de la última comida grande | `cercaDeLaCama` (`loQueFalta.ts:118`) |
| Ducha tibia | La cama menos 90 minutos (convención dentro de 1 a 2 h) | La hora de acostarte |
| Luz baja | La cama menos 3 h (o 90 minutos, según D2) | La hora de acostarte |

El resto no tiene número propio: va igual para todos.

---

## 8. Lo que no se dice (ni se hace)

- Que la lista **trata el insomnio**: la higiene del sueño sola no lo trata (AASM 2021, recomendación en contra
  como única terapia). El control de estímulos se presenta como lo que es, una parte de la TCC-I.
- **La restricción del sueño** ni dormir menos para «cansarse»: se hace con un profesional.
- Nada para **la apnea**: si alguien ronca fuerte o lo ven dejar de respirar, un médico. Tampoco «dormir de
  costado» ni nada parecido: no lo investigué.
- Una **temperatura exacta** como si fuera medida («la mejor temperatura es 18,3 °C»): es un rango y una
  convención.
- **Productos**: gafas, lámparas, máquinas de ruido, colchones, mantas con peso, melatonina, magnesio.
- **«La luz azul del teléfono te quita el sueño»** como algo probado en adultos.
- **«Una copa ayuda a dormir»** ni una hora segura para el alcohol.
- **Culpa**: «deberías», «no debes». Cada punto dice qué ayuda y por qué.
- **A quien trabaja de noche**, la luz de la mañana y el despertar fijo no le sirven así: si Moss sabe que tiene
  turnos, esos dos puntos no van (convención; no lo investigué).

---

## 9. Fuentes

**[T]** leí el texto completo o las partes citadas · **[T·h]** lo mismo, por la herramienta de lectura · **[R]**
solo el resumen (Europe PMC). «Ya en la spec»: verificada en `momentos.md` o `deuda-y-melatonina.md`, con lo que
allí dice.

**Duración y regularidad**

- Watson NF, Badr MS, Belenky G, et al. 2015. Recommended amount of sleep for a healthy adult: a joint consensus
  statement of the American Academy of Sleep Medicine and Sleep Research Society. *J Clin Sleep Med*
  11(6):591-592. https://doi.org/10.5664/jcsm.4758 · [T·h] (PMC4442216).
- Hirshkowitz M, Whiton K, Albert SM, et al. 2015. National Sleep Foundation's sleep time duration
  recommendations: methodology and results summary. *Sleep Health* 1(1):40-43.
  https://doi.org/10.1016/j.sleh.2014.12.010 · [R]
- Sletten TL, Weaver MD, Foster RG, et al. 2023. The importance of sleep regularity: a consensus statement of the
  National Sleep Foundation sleep timing and variability panel. *Sleep Health* 9(6):801-820.
  https://doi.org/10.1016/j.sleh.2023.07.016 · [R]; y la página de la NSF (6/9/2023)
  https://www.thensf.org/sleep-schedules-sleep-timing-guideline/ · [T·h]
- Windred DP, Burns AC, Lane JM, et al. 2024. Sleep regularity is a stronger predictor of mortality risk than
  sleep duration: a prospective cohort study. *Sleep* 47(1):zsad253. https://doi.org/10.1093/sleep/zsad253 · [R]
- Van Dongen 2003, Burgess y Eastman 2005, Yang 2001, Crowley y Carskadon 2010: ya en la spec.

**Cafeína, alcohol y nicotina**

- Gardiner C, Weakley J, Burke LM, et al. 2023. The effect of caffeine on subsequent sleep: a systematic review and
  meta-analysis. *Sleep Med Rev* 69:101764. https://doi.org/10.1016/j.smrv.2023.101764 · [R] aquí; [T] en la spec.
- Gardiner C, Weakley J, Burke LM, et al. 2025. The effect of alcohol on subsequent sleep in healthy adults: a
  systematic review and meta-analysis. *Sleep Med Rev* 80:102030. https://doi.org/10.1016/j.smrv.2024.102030 ·
  [R] aquí; [T] en la spec.
- Landolt 1996, Drake 2013, Gardiner 2025 (ensayo de la cafeína): ya en la spec.
- Zhang L, Samet J, Caffo B, Punjabi NM. 2006. Cigarette smoking and nocturnal sleep architecture. *Am J
  Epidemiol* 164(6):529-537. https://doi.org/10.1093/aje/kwj231 · [R]
- Spadola CE, Guo N, Johnson DA, et al. 2019. Evening intake of alcohol, caffeine, and nicotine: night-to-night
  associations with sleep duration and continuity among African Americans in the Jackson Heart Sleep Study.
  *Sleep* 42(11):zsz136. https://doi.org/10.1093/sleep/zsz136 · [R]
- Jaehne A, Loessl B, Bárkai Z, Riemann D, Hornyak M. 2009. Effects of nicotine on sleep during consumption,
  withdrawal and replacement therapy. *Sleep Med Rev* 13(5):363-377. https://doi.org/10.1016/j.smrv.2008.12.003 ·
  [R]
- Amiri S, Behnezhad S. 2020. Smoking and risk of sleep-related issues: a systematic review and meta-analysis of
  prospective studies. *Can J Public Health* 111(5):775-786. https://doi.org/10.17269/s41997-020-00308-3 · [R]

**Luz, pantallas y oscuridad**

- Brown TM, Brainard GC, Cajochen C, et al. 2022. Recommendations for daytime, evening, and nighttime indoor light
  exposure to best support physiology, sleep, and wakefulness in healthy adults. *PLoS Biol* 20(3):e3001571.
  https://doi.org/10.1371/journal.pbio.3001571 · [T] (las tres recomendaciones y la comparación con la luz de
  afuera; PMC8929548)
- Hartstein LE, Mathew GM, Reichenberger DA, et al. 2024. The impact of screen use on sleep health across the
  lifespan: a National Sleep Foundation consensus statement. *Sleep Health* 10(4):373-384.
  https://doi.org/10.1016/j.sleh.2024.05.001 · [T·h] (casi entero; quedaron sin leer las últimas 8.000 letras)
- Duraccio KM, Zaugg KK, Blackburn RC, Jensen CD. 2021. Does iPhone night shift mitigate negative effects of
  smartphone use on sleep outcomes in emerging adults? *Sleep Health* 7(4):478-484.
  https://doi.org/10.1016/j.sleh.2021.03.005 · [R]
- Schöllhorn I, Stefani O, Lucas RJ, et al. 2023. Melanopic irradiance defines the impact of evening display light
  on sleep latency, melatonin and alertness. *Commun Biol* 6:228. https://doi.org/10.1038/s42003-023-04598-4 ·
  [T] (métodos y resultados de la latencia)
- Shechter A, Quispe KA, Mizhquiri Barbecho JS, et al. 2020. Interventions to reduce short-wavelength ("blue")
  light exposure at night and their effects on sleep: a systematic review and meta-analysis. *Sleep Adv*
  1(1):zpaa002. https://doi.org/10.1093/sleepadvances/zpaa002 · [R]
- Mason IC, Grimaldi D, Reid KJ, et al. 2022. Light exposure during sleep impairs cardiometabolic function. *Proc
  Natl Acad Sci USA* 119(12):e2113290119. https://doi.org/10.1073/pnas.2113290119 · [T] (métodos y resultados)
- Obayashi K, Saeki K, Kurumatani N. 2018. Bedroom light exposure at night and the incidence of depressive
  symptoms: a longitudinal study of the HEIJO-KYO cohort. *Am J Epidemiol* 187(3):427-434.
  https://doi.org/10.1093/aje/kwx290 · [R]
- Burns AC, Saxena R, Vetter C, et al. 2021. Time spent in outdoor light is associated with mood, sleep, and
  circadian rhythm-related outcomes: a cross-sectional and longitudinal study in over 400,000 UK Biobank
  participants. *J Affect Disord* 295:347-352. https://doi.org/10.1016/j.jad.2021.08.056 · [R]
- van Maanen A, Meijer AM, van der Heijden KB, Oort FJ. 2016. The effects of light therapy on sleep problems: a
  systematic review and meta-analysis. *Sleep Med Rev* 29:52-62. https://doi.org/10.1016/j.smrv.2015.08.009 · [R]
- Gooley 2011, Phillips 2019, Chang 2015, Bourke 2026, Khalsa 2003, Singh 2023 (Cochrane), Shechter 2018: ya en
  la spec.

**Temperatura, ducha y ropa**

- Okamoto-Mizuno K, Mizuno K. 2012. Effects of thermal environment on sleep and circadian rhythm. *J Physiol
  Anthropol* 31:14. https://doi.org/10.1186/1880-6805-31-14 · [T] (las partes del calor, el frío y la ropa de cama;
  PMC3427038)
- Yan Y, Zhang H, Kang M, et al. 2022. Experimental study of the negative effects of raised bedroom temperature and
  reduced ventilation on the sleep quality of elderly subjects. *Indoor Air* 32(11):e13159.
  https://doi.org/10.1111/ina.13159 · [R]
- Baniassadi A, Manor B, Yu W, Travison T, Lipsitz L. 2023. Nighttime ambient temperature and sleep in
  community-dwelling older adults. *Sci Total Environ* 899:165623. https://doi.org/10.1016/j.scitotenv.2023.165623 ·
  [R]
- Shin M, Halaki M, Swan P, Ireland AH, Chow CM. 2016. The effects of fabric for sleepwear and bedding on sleep at
  ambient temperatures of 17 °C and 22 °C. *Nat Sci Sleep* 8:121-131. https://doi.org/10.2147/NSS.S100271 · [T]
  (autores, introducción y métodos; los resultados, del resumen). Dos autores de Australian Wool Innovation.
- Troynikov O, Watson CG, Nawaz N. 2018. Sleep environments and sleep physiology: a review. *J Therm Biol*
  78:192-203. https://doi.org/10.1016/j.jtherbio.2018.09.012 · [R]. Fondos de Cotton Research and Development
  Corporation y Cotton Incorporated.
- National Sleep Foundation. Sleep tips. https://www.thensf.org/sleep-tips/ · [T·h]
- Haghayegh S, Khoshnevis S, Smolensky MH, Diller KR, Castriotta RJ. 2019. Before-bedtime passive body heating by
  warm shower or bath to improve sleep: a systematic review and meta-analysis. *Sleep Med Rev* 46:124-135.
  https://doi.org/10.1016/j.smrv.2019.04.008 · [R]; y el comunicado de la Cockrell School (UT Austin)
  https://cockrell.utexas.edu/?p=23504 · [T·h]
- Jiang CS, Chen KM, Belcastro F. 2024. Effects of temperature, duration, and heating height of foot thermal
  therapy on sleep quality of older adults: a systematic review and meta-analysis. *J Integr Complement Med*
  30(3):250-260. https://doi.org/10.1089/jicm.2023.0193 · [R]
- Raymann RJ, Swaab DF, Van Someren EJ. 2007. Skin temperature and sleep-onset latency: changes with age and
  insomnia. *Physiol Behav* 90(2-3):257-266. https://doi.org/10.1016/j.physbeh.2006.09.008 · [R]
- Raymann RJ, Swaab DF, Van Someren EJ. 2008. Skin deep: enhanced sleep depth by cutaneous temperature
  manipulation. *Brain* 131(2):500-513. https://doi.org/10.1093/brain/awm315 · [R]
- Ko Y, Lee JY. 2018. Effects of feet warming using bed socks on sleep quality and thermoregulatory responses in a
  cool environment. *J Physiol Anthropol* 37:13. https://doi.org/10.1186/s40101-018-0172-z · [R]

**Ruido**

- Basner M, McGuire S. 2018. WHO Environmental Noise Guidelines for the European Region: a systematic review on
  environmental noise and effects on sleep. *Int J Environ Res Public Health* 15(3):519.
  https://doi.org/10.3390/ijerph15030519 · [R] y [T] en parte (PMC5877064)
- Basner M, Smith MG, Cordoza M, et al. 2026. Efficacy of pink noise and earplugs for mitigating the effects of
  intermittent environmental noise exposure on sleep. *Sleep* 49(5):zsag001. https://doi.org/10.1093/sleep/zsag001
  · [T] (resumen, introducción y resultados de fragmentación; PMC13163165). Pagado por la FAA.
- Basner M, Smith MG, Cordoza M, et al. 2026. The efficacy of pink noise and earplugs for mitigating sleep
  disruption induced by different environmental noise sources. *Sleep Health* 12(4):702-706.
  https://doi.org/10.1016/j.sleh.2026.03.009 · [R]
- Riedy SM, Smith MG, Rocha S, Basner M. 2021. Noise as a sleep aid: a systematic review. *Sleep Med Rev*
  55:101385. https://doi.org/10.1016/j.smrv.2020.101385 · [R]
- Jarosińska D, Héroux MÈ, Wilkhu P, et al. 2018. Development of the WHO Environmental Noise Guidelines for the
  European Region: an introduction. *Int J Environ Res Public Health* 15(4):813.
  https://doi.org/10.3390/ijerph15040813 · [T] en parte (no trae los valores de la noche).

**Insomnio, cama y cabeza**

- Schutte-Rodin S, Broch L, Buysse D, Dorsey C, Sateia M. 2008. Clinical guideline for the evaluation and
  management of chronic insomnia in adults. *J Clin Sleep Med* 4(5):487-504. https://doi.org/10.5664/jcsm.27286 ·
  [T·h] (la tabla de tratamientos; PMC2576317)
- Edinger JD, Arnedt JT, Bertisch SM, et al. 2021. Behavioral and psychological treatments for chronic insomnia
  disorder in adults: an American Academy of Sleep Medicine clinical practice guideline. *J Clin Sleep Med*
  17(2):255-262. https://doi.org/10.5664/jcsm.8986 · [R]
- Edinger JD, Arnedt JT, Bertisch SM, et al. 2021. Behavioral and psychological treatments for chronic insomnia
  disorder in adults: an American Academy of Sleep Medicine systematic review, meta-analysis, and GRADE
  assessment. *J Clin Sleep Med* 17(2):263-298. https://doi.org/10.5664/jcsm.8988 · [T·h] en parte (las
  definiciones y los resultados del control de estímulos y de la higiene del sueño; PMC7853211)
- Riemann D, Espie CA, Altena E, et al. 2023. The European Insomnia Guideline: an update on the diagnosis and
  treatment of insomnia 2023. *J Sleep Res* 32(6):e14035. https://doi.org/10.1111/jsr.14035 · [R]
- Tang NK, Schmidt DA, Harvey AG. 2007. Sleeping with the enemy: clock monitoring in the maintenance of insomnia.
  *J Behav Ther Exp Psychiatry* 38(1):40-55. https://doi.org/10.1016/j.jbtep.2005.07.004 · [R]
- Scullin MK, Krueger ML, Ballard HK, Pruett N, Bliwise DL. 2018. The effects of bedtime writing on difficulty
  falling asleep: a polysomnographic study comparing to-do lists and completed activity lists. *J Exp Psychol Gen*
  147(1):139-146. https://doi.org/10.1037/xge0000374 · [R]
- Rusch HL, Rosario M, Levison LM, et al. 2019. The effect of mindfulness meditation on sleep quality: a systematic
  review and meta-analysis of randomized controlled trials. *Ann N Y Acad Sci* 1445(1):5-16.
  https://doi.org/10.1111/nyas.13996 · [R]
- Eron K, Kohnert L, Watters A, et al. 2020. Weighted blanket use: a systematic review. *Am J Occup Ther*
  74(2):7402205010. https://doi.org/10.5014/ajot.2020.037358 · [R]

**Ejercicio y siesta**

- Kline CE, Hillman CH, Bloodgood Sheppard B, et al. 2021. Physical activity and sleep: an updated umbrella review
  of the 2018 Physical Activity Guidelines Advisory Committee report. *Sleep Med Rev* 58:101489.
  https://doi.org/10.1016/j.smrv.2021.101489 · [R]
- Kredlow MA, Capozzoli MC, Hearon BA, Calkins AW, Otto MW. 2015. The effects of physical activity on sleep: a
  meta-analytic review. *J Behav Med* 38(3):427-449. https://doi.org/10.1007/s10865-015-9617-6 · [R]
- Frimpong 2021, Stutz 2019, Leota 2025, Brooks y Lack 2006, Mograss 2022, Yang 2024: ya en la spec.

**Comida y líquido**

- Iao SI, Jansen E, Shedden K, et al. 2022. Associations between bedtime eating or drinking, sleep duration and
  wake after sleep onset: findings from the American time use survey. *Br J Nutr* 127(12):1888-1897.
  https://doi.org/10.1017/S0007114521003597 · [R]
- St-Onge MP, Roberts A, Shechter A, Choudhury AR. 2016. Fiber and saturated fat are associated with sleep
  arousals and slow wave sleep. *J Clin Sleep Med* 12(1):19-24. https://doi.org/10.5664/jcsm.5384 · [R]
- Wilson K, St-Onge MP, Tasali E. 2022. Diet composition and objectively assessed sleep quality: a narrative
  review. *J Acad Nutr Diet* 122(6):1182-1195. https://doi.org/10.1016/j.jand.2022.01.007 · [R]
- Binks H, Vincent GE, Gupta C, Irwin C, Khalesi S. 2020. Effects of diet on sleep: a narrative review. *Nutrients*
  12(4):936. https://doi.org/10.3390/nu12040936 · [T] en parte (lo de las cerezas, la discusión y las
  limitaciones; PMC7230229)
- Lin HH, Tsai PS, Fang SC, Liu JF. 2011. Effect of kiwifruit consumption on sleep quality in adults with sleep
  problems. *Asia Pac J Clin Nutr* 20(2):169-174. PMID 21669584 · [R]
- Barforoush F, Ebrahimi S, Abdar MK, Khademi S, Morshedzadeh N. 2025. The effect of tart cherry on sleep quality
  and sleep disorders: a systematic review. *Food Sci Nutr* 13(9):e70923. https://doi.org/10.1002/fsn3.70923 ·
  [R]
- Everaert K, Hervé F, Bosch R, et al. 2019. International Continence Society consensus on the diagnosis and
  treatment of nocturia. *Neurourol Urodyn* 38(2):478-498. https://doi.org/10.1002/nau.23939 · [R]
- Katz 2022 (ACG), Fujiwara 2005, Gu 2020, Kinsey y Ormsbee 2015: ya en la spec.

---

## 10. Lo que no pude confirmar

- **Cuántos minutos acorta la ducha tibia** (Haghayegh 2019): el artículo no está abierto; los «unos 10
  minutos» son del comunicado de la universidad de los autores.
- **Los valores de la OMS para la noche** (45 dB el tránsito, 44 el tren, 40 los aviones): el documento dio 403;
  leí «40 a 45 dB» en el texto de Basner 2026 y los números por tipo, solo en resultados del buscador.
- **De dónde sale el «60 a 67 °F» de la NSF**: su página no cita un estudio, y no encontré el origen.
- **El texto completo de Sletten 2023** (el consenso de la regularidad): solo el resumen y la página de la NSF; no
  sé si da un margen en minutos para «la misma hora» (la página no lo da).
- **Los números del control de estímulos** de la revisión de la AASM: me llegaron por la herramienta de lectura,
  no del PDF.
- **Kräuchi 1999** («Warm feet promote the rapid onset of sleep», *Nature*): sin resumen en Europe PMC; no lo uso.
- **La revisión de Lan 2017** sobre la temperatura y el sueño (*Energy and Buildings*): no la pude abrir; no la uso.
- **Si los puntos sirven igual a quien trabaja de noche** o a mayores de 75: casi todos los estudios son de
  adultos con horario de día.
