# Cuándo dejar y cuándo empezar cada cosa: los horarios de los avisos

Área: **el mejor momento para dejar o para empezar cada cosa** (lo que dicen los avisos de «Lo que conviene
hacer», el de la hora de dormir y los horarios de fábrica). Pedido del dueño del 5/11/2026: «los avisos que hay
están bien, pero […] Rise Sleep lo hace muy bien: buscá científicamente en qué momento es el mejor para evitar
hacer algo o cuándo deberías empezar a hacer algo».

Leí de Moss: `src/dominio/loQueConviene.ts`, `avisos.ts`, `alrededorDelEntreno.ts`, `recordatorios.ts`,
`loQueFalta.ts`, `segunElDeporte.ts`, `src/secciones/comida/entreno.ts`, los textos de `src/textos/es.json`, y
`spec/avisos.md`, `spec/entreno.md`, `spec/sueno.md` y `spec/evidencia-1.1.md`. Las líneas son las del commit
`134c873` (`src/dominio/` no tenía cambios sin guardar); los textos se citan por su clave, porque `es.json` está
cambiando mientras tanto. Las etiquetas de fuerza son las
de `spec/entreno.md`: **fuerte** (posturas y metaanálisis que coinciden), **moderada**, **débil**, **derivado**
(un número de Moss sacado de la evidencia) y **convención** (no hay evidencia ni a favor ni en contra).

---

## 1. Resumen

1. **Lo que mejor se sostiene** es la idea de casi todos los avisos: dejar la cafeína horas antes de la cama
   (fuerte), no terminar lo intenso pegado a la cama (moderada), no hacer una comida grande en las 2 a 3 h
   antes de acostarse (para el reflujo; para el sueño, débil), comer y tomar proteína alrededor del
   entrenamiento (ACSM 2016) y la luz baja de noche (consenso de expertos). Lo que falla son algunos números y
   desde dónde se cuentan.
2. **El corte del café está corrido.** Moss corta 8 h antes de *dormirse* para cualquier toma de hasta 200 mg,
   y 12 h si pasa. El metaanálisis que cita (Gardiner 2023, 24 estudios) da 8,8 h antes de *acostarse* para un
   café de 107 mg y 13,2 h para 217,5 mg; el ensayo de 2025 del mismo grupo, nada de 400 mg en las 12 h
   previas. Lo más confiable: contar desde la hora de ir a la cama, unas **9 h para un café** y escalar con la
   dosis hasta 13 h.
3. **Una contradicción interna:** «Si vas muy bajo en algo» puede mandar a la noche «Te faltan 700 kcal: un
   plato de pasta…» una hora y cuarto antes de la cama, el mismo día en que «Última comida grande» dijo
   «Después, algo ligero». A menos de 3 h de la cama, solo algo liviano (ACG 2022; Kinsey y Ormsbee 2015).
4. **El ejercicio:** 2 h antes de la cama es el borde permisivo. En el laboratorio, lo intenso que termina 2 a 4 h
   antes no cambia el sueño (Frimpong 2021); en 4 millones de noches reales, cuanto más tarde y más intenso,
   peor, y desde 4 h antes no se ve nada (Leota 2025, que recomienda 4 h, aunque Moss lo cita para 2). Mantener
   2 h como límite y decir «mejor 4 h» en el porqué.
5. **Las luces:** el consenso (Brown 2022) pide luz muy baja **desde al menos 3 h antes** de la cama; Moss avisa
   a la hora y media, como Rise. Es una decisión: 3 h es la evidencia; 90 minutos, lo práctico.
6. **El hueco más grande es el alcohol.** No hay aviso ni línea. La dosis está clara (desde unos 0,35 a 0,5 g/kg,
   dos o tres tragos, se atrasa y se acorta el REM; Gardiner 2025, 27 estudios), pero **no hay una hora segura**:
   0,55 g/kg seis horas antes de acostarse, con el alcohol en cero al dormir, igual cortó la segunda mitad de la
   noche (Landolt 1996). No conviene un aviso con hora; sí una línea en Sueño a la mañana siguiente, sin culpa.
7. **Valen la pena, opcionales:** la luz de la mañana (consenso y cohortes grandes), la ducha o el baño tibio 1 a
   2 h antes de la cama (metaanálisis de estudios chicos) y empujar un despertar parecido todos los días (la
   regularidad predice la mortalidad mejor que la duración; Windred 2024, consenso NSF 2023).
8. **Cuántos avisos por día es una convención.** Un aviso multiplica por 3,5 abrir la app en la hora siguiente
   (Bell 2023), pero el efecto puede gastarse (Klasnja 2019) y más avisos se asocian a más malestar (Pielot
   2014); agruparlos en 3 momentos mejoró el ánimo (Fitz 2019). Con todo prendido, Moss llega a 8 por día más 2
   de «muy bajo». Propuesta: el de la proteína de después solo cuando hace falta apurarse, y medir cuáles se
   ignoran.
9. **La higiene del sueño sola no trata el insomnio** (AASM 2021, recomendación en contra como única terapia):
   ningún aviso debe prometerlo.
10. **Rise, como referencia** (no como evidencia): café 10 h antes de su «ventana de melatonina» (en otra página,
    12 h), alcohol 3 a 4 h, comida 2 a 3 h, luces 90 minutos, rutina 1 a 2 h, ducha 90 minutos, siesta de 10 a 20
    o de 40 a 90 minutos. Es más estricto que Moss con el café y más laxo de lo que muestra la evidencia con el
    alcohol.

---

## 2. Tabla de veredictos

| Qué calcula Moss | Dónde | Veredicto | La mejor evidencia | Lo más confiable | El dato que necesita | ¿Moss lo tiene? |
|---|---|---|---|---|---|---|
| Corte de la cafeína: 8 h antes de **dormirte** hasta 200 mg (o sin saber), 12 h si pasa | `alrededorDelEntreno.ts:98-101`, `:176-180`; `loQueConviene.ts:214-235` | **A medias**: la idea sí; el número y el punto de partida, no | Gardiner 2023, metaanálisis, 24 estudios (total de sueño: k = 37, n = 340); Gardiner 2025, ensayo cruzado doble ciego, n = 23; Drake 2013, ensayo | Desde la hora de **acostarse**; ≈ 9 h para un café (≈ 100 mg), subiendo con la dosis hasta 13 h (≈ 220 mg o más); con ≤ 50 mg (un té), sin corte | La cafeína de cada toma y la hora de ir a la cama | Sí: la base trae la cafeína; `horasDeSueno` da `acostarse` |
| El aviso del último café, media hora antes del corte | `loQueConviene.ts:63-64`, `:227-233` | **Convención** | — | — | — | — |
| Café antes de entrenar: una hora antes de empezar, si cae antes del corte; nunca una dosis | `loQueConviene.ts:60-62`, `:216-226` | **Se sostiene** | Guest 2021, postura de la ISSN: 3 a 6 mg/kg; 60 minutos antes es lo más usado y depende de la forma | 60 minutos (café o cápsula); no dar dosis | La hora de la sesión | Sí |
| Última comida grande: 3 h antes de la cama; el aviso 45 minutos antes de ese límite o 15 antes de la cena | `loQueConviene.ts:65-69`, `:237-246` | **Se sostiene** para el reflujo; **débil** para el sueño | Katz 2022, guía del ACG: evitar comidas 2 a 3 h antes de acostarse (condicional, evidencia baja); Fujiwara 2005, casos y controles (147 + 294): cenar a menos de 3 h, OR 7,45 de reflujo contra 4 h o más; Gu 2020, ensayo cruzado, n = 20: cenar 1 h antes no cambió la arquitectura del sueño | 2 a 3 h antes de la cama; después, algo liviano | La hora de ir a la cama y la de la cena | Sí |
| «Muy bajo en algo» a la noche: calorías con ideas de hasta 1,2 veces lo que falta (pasta, 450 kcal), hasta media hora antes de la cama | `loQueFalta.ts:93-98`, `:115-123`, `:154`, `:219-229` | **Refutado en su forma** | ACG 2022; Kinsey y Ormsbee 2015, revisión: lo chico (≈ 150 kcal) de noche no perjudica; lo grande y mixto sí se asocia a problemas | A menos de 3 h de la cama, una sola idea liviana (≤ 250 kcal, derivado) o nada | La hora de ir a la cama | Sí (`acostarse` ya llega) |
| Lo fuerte, que termine 2 h antes de la cama; «mejor suave» si no quedan 30 minutos | `loQueConviene.ts:70-74`, `:248-259` | **A medias**: la idea sí; 2 h es el borde permisivo, y la cita de Leota no dice 2 h | Frimpong 2021, metaanálisis, 15 estudios, n = 194; Stutz 2019, metaanálisis, 23 estudios; Leota 2025, cohorte, 14.689 personas, 4,08 millones de noches | Límite de 2 h para lo intenso (lo que muestran los ensayos), ideal 4 h (lo que muestran las noches reales); lo suave, sin límite | Cuán intensa es la sesión | No: solo el tipo (fuerza, resistencia, mixta) |
| Bajar las luces 90 minutos antes de la cama | `loQueConviene.ts:75-76`, `:261` | **A medias**: la idea sí; el consenso dice 3 h, y Gooley no da 90 minutos | Brown 2022, consenso de 18 expertos; Gooley 2011, n = 116; Phillips 2019, n = 55 | ≤ 10 lux melanópicos desde ≥ 3 h antes de la cama; el dormitorio, ≤ 1 lux | La hora de ir a la cama | Sí |
| Aviso de la hora de ir a la cama: 30 minutos antes (15, 30, 45 o 60) | `avisos.ts:185`, `:357-365` | **Convención** | No hay estudios del aviso; Rise, 30 a 60 minutos y rutina de 1 a 2 h | 30 a 60 minutos | — | — |
| Los textos de la hora de dormir (dejar el teléfono, bajar las luces, bajar el ritmo) | `avisos.ts:148`, `:157-162`; `es.json`, `recordatorios.dormirTextos` | **Se sostiene**, con dos detalles: «Deberías…» y «Baja las luces» repetido las noches del aviso de las luces | Bourke 2026, metaanálisis intrapersona, 25 estudios, 4.562 jóvenes; Chang 2015, ensayo cruzado | — | — | — |
| La hora de ir a la cama sale del despertar de mañana (la alarma o lo de siempre de ese día) | `avisos.ts:208-237` | **Se sostiene** la cuenta; la constancia del despertar no se empuja | Sletten 2023, consenso de la NSF; Windred 2024, cohorte, 60.977 | Un despertar parecido todos los días | El despertar de cada día | Sí |
| Comer antes de entrenar: la comida de 1 a 4 h antes de **salir**; si no hay, algo liviano 75 minutos antes de salir; el aviso, media hora antes | `loQueConviene.ts:54-59`, `:154-189` | **Se sostiene**, con un detalle: el tope de 4 h cuenta desde que sales y no desde que empiezas | Thomas 2016, postura de ACSM, AND y DC: 1 a 4 g/kg de carbohidratos 1 a 4 h antes de lo que dura más de 60 minutos | 1 a 4 h antes de **empezar**; cuanto más cerca, menos grasa y fibra | La sesión, el viaje y las comidas | Sí |
| Proteína después: en la comida que sigue (hasta 4 h) o, si hace mucho que no comes, en la primera hora | `loQueConviene.ts:83-88`, `:191-211`; `alrededorDelEntreno.ts:84-90` | **Se sostiene** la regla; el aviso sobra cuando no hay que apurarse | Schoenfeld 2013, metaanálisis (hipertrofia: 23 estudios, 525 personas); Kerksick 2017, postura de la ISSN; Thomas 2016 | 0,3 g/kg en la comida siguiente; apurarse solo en ayunas o con un hueco largo | La hora de la comida de antes | Sí |
| Proteína antes de dormir, si faltan 25 g (una línea, no un aviso) | `alrededorDelEntreno.ts:210-217` | **Se sostiene** como forma de completar el día | Reis 2021, revisión sistemática, 9 estudios; Kerksick 2017 | 20 a 40 g, unos 30 minutos antes de dormir | Lo que falta del día | Sí |
| Máximo 6 por día (2 a 8), 20 minutos entre dos, hasta 45 de espera; lo de «muy bajo» aparte (hasta 2) | `avisos.ts:168-172`; `loQueFalta.ts:1-9` | **Convención** | Bell 2023, ensayo microaleatorizado, n = 350; Bidargaddi 2018, ídem, n = 1.255; Klasnja 2019, ídem, n = 44; Fitz 2019, ensayo, n = 237; Pielot 2014, n = 15 | Pocos, con un motivo, y medir cuáles se ignoran | Si se abre o se descarta cada aviso | No |
| Avisos de fábrica de los primeros hábitos: leer 45 minutos antes de dormir, escribir 30, meditar 15 después de despertarte, agua a las 16, pasos a las 18, entrenar a las 17:30 | `avisos.ts:622-634` | **Convención**; escribir puede apoyarse en evidencia | Scullin 2018, ensayo con polisomnografía, n = 57 | Escribir lo pendiente de mañana, 5 minutos, al acostarse | — | Sí |
| «Haz una siesta corta temprano» (después de un partido de noche) | `es.json`, `sueno.deporte.partidoDeNoche`; `segunElDeporte.ts:51-52` | **Se sostiene** (débil en la hora) | Brooks y Lack 2006, ensayo, n = 24; Yang 2024, metaanálisis de 44 cohortes; Mograss 2022, n = 62 | Unos 10 a 20 minutos, a 7 h o más de la noche | — | — |
| Nada sobre alcohol y sueño (solo el de después de jugar, con 1 g/kg) | `segunElDeporte.ts:48-50` | **Falta** | Gardiner 2025, metaanálisis, 27 estudios; Landolt 1996, n = 10; Ebrahim 2013, revisión; Pietilä 2018, n = 4.098 | El efecto según la dosis, sin hora segura | El alcohol anotado, con su hora, y el peso | Sí |
| Nada sobre la luz de la mañana | — | **Falta** | Brown 2022; Burns 2021, cohorte, unas 400.000 personas; Figueiro 2017, n = 109; Khalsa 2003, n = 21 | Luz de día temprano | La hora de despertarte | Sí |
| Nada sobre el baño o la ducha | — | **Falta** (opcional) | Haghayegh 2019, metaanálisis, 17 estudios (13 en el análisis) | 40 a 42,5 °C, unos 10 minutos, 1 a 2 h antes de la cama | La hora de ir a la cama | Sí |
| El agua solo a la tarde, nunca de noche | `loQueFalta.ts:84-87`, `:201-206` | **Se sostiene** | Consenso de la ICS sobre la nocturia (2019): «los cambios de hábitos pueden servir», sin horario | No empujar líquido de noche; nada más | — | — |
| Ninguna «mejor hora para entrenar» | — | **Se sostiene** | Bruggisser 2023, metaanálisis, 26 estudios (7 en el análisis) | La hora que puedas sostener | — | — |

---

## 3. La tabla de horarios

Las horas del ejemplo son para alguien que se acuesta a las 23:00 y se despierta a las 7:30.

| Qué | Cuándo, según la evidencia | Lo que hace Moss hoy | Lo que debería decir el aviso (una línea en tú) | Qué tan fuerte |
|---|---|---|---|---|
| **La cafeína, el último café** | Un café (≈ 107 mg): al menos 8,8 h antes de **acostarte**; un preentreno o un café grande (≈ 217 mg): 13,2 h; un té (≈ 47 mg): sin corte (Gardiner 2023). 400 mg: nada en las 12 h previas; 100 mg, sin efecto medible ni 4 h antes en hombres que toman café moderado (Gardiner 2025). 400 mg 0, 3 o 6 h antes: ≈ 1,2 h menos de sueño en los tres casos (Drake 2013) | 8 h antes de **dormirte** si la toma es de hasta 200 mg o no se sabe; 12 h si pasa. Avisa media hora antes del corte | «Último café · Hasta las 14:00. Después, descafeinado o té.» | **Fuerte** que quita sueño y que depende de la dosis y la hora; **moderada** para el número exacto |
| **La cafeína, antes de entrenar** | 3 a 6 mg/kg; lo más usado, 60 minutos antes; con chicle, menos (Guest 2021) | Una hora antes de empezar (con el viaje, al salir), solo si cae antes del corte; nunca una dosis | «Café antes de entrenar · Si tomas, a las 15:00, una hora antes de empezar.» Si cae después del corte: «Hoy entrenas tarde: mejor sin café.» | **Fuerte** que rinde; la hora, **moderada** |
| **El alcohol** | Ninguna hora es segura. Desde ≈ 0,35 g/kg se atrasa el REM y desde ≈ 0,5 g/kg se acorta (dos o tres tragos); casi todos los estudios dieron el alcohol en las 3 h antes de la cama, así que la hora no se pudo medir (Gardiner 2025). 0,55 g/kg seis horas antes, con el alcohol en cero al acostarse: menos sueño, menos REM y el doble de vigilia en la segunda mitad (Landolt 1996). A cualquier dosis, la primera mitad más consolidada y la segunda más cortada (Ebrahim 2013) | Nada, salvo después de jugar (1 g/kg en 12 h, para la recuperación) | Sin aviso. En Sueño, la mañana siguiente: «Anoche hubo alcohol: suele hacer más liviana la segunda mitad de la noche.» | **Fuerte** para el efecto según la dosis; **no hay evidencia** de un horario |
| **La última comida grande** | Evitar comidas en las 2 a 3 h antes de acostarte (ACG 2022, condicional, evidencia baja); cenar a menos de 3 h, OR 7,45 de reflujo contra 4 h o más (Fujiwara 2005). Cenar 1 h antes no cambió el sueño medido con polisomnografía en 20 jóvenes sanos, pero subió la glucosa de la noche (Gu 2020). Lo chico (≈ 150 kcal) no perjudica (Kinsey y Ormsbee 2015) | 3 h antes de la cama; avisa 45 minutos antes del límite o 15 antes de tu cena | «Última comida grande · Cena antes de las 20:00: a las 23:00, a la cama. Después, si tienes hambre, algo liviano.» | **Moderada** para el reflujo; **débil** para el sueño |
| **Comer de noche para llegar a la meta** | Lo mismo que arriba: a menos de 3 h de la cama, solo algo chico | Hasta media hora antes de la cama puede proponer 450 kcal de pasta | «Te faltan 600 kcal: fruta con yogur te acerca.» (a menos de 3 h de la cama, una idea liviana) | **Moderada** (la misma de arriba) |
| **El líquido antes de dormir** | No hay un horario con evidencia: el consenso de la nocturia dice que los cambios de hábitos «pueden servir» (ICS 2019) | No hay aviso de agua de noche: el de «muy bajo» en agua es a la tarde | Ninguno | **Convención** |
| **El ejercicio intenso** | Lo intenso que termina 2 a 4 h antes de la cama no cambia el sueño en el laboratorio; entre media hora y 4 h, un 2,34 % menos de REM (Frimpong 2021). Lo vigoroso en la hora antes de la cama, quizá peor (Stutz 2019). En noches reales: cuanto más tarde y más intenso, peor; terminando 2 h antes de tu hora de dormirte, lo máximo contra lo liviano te duerme 36 minutos más tarde y 22 minutos menos; desde 4 h antes, nada (Leota 2025). Lo liviano 2 h antes: 4 minutos más tarde | Lo fuerte, que termine 2 h antes de la cama; si no quedan 30 minutos, «mejor suave». Avisa media hora antes de salir | «Termina lo intenso antes de las 21:00 · Más tarde, que sea suave: te acuestas a las 23:00.» (y en el porqué: «si puedes, 4 h antes»). | **Moderada** |
| **La luz de la noche** | ≤ 10 lux melanópicos desde **al menos 3 h** antes de la cama, con poca luz azul; el dormitorio, ≤ 1 lux (Brown 2022). La luz de una habitación en las 8 h antes de dormir atrasó la melatonina en el 99 % y la acortó unos 90 minutos (Gooley 2011). La mitad de la melatonina se suprime con ≈ 25 lux, y la sensibilidad cambia unas 58 veces de una persona a otra (Phillips 2019) | 90 minutos antes de la cama, «Luz tenue y cálida» | «Baja las luces · Desde ahora, luz baja y cálida: a las 23:00, a la cama.» | **Moderada** (consenso sobre estudios de laboratorio) |
| **La luz de la mañana** | De día, ≥ 250 lux melanópicos, mejor de luz natural (Brown 2022). Cada hora más al aire libre se asocia a despertarse más fácil (OR 1,46 a 1,49), menos insomnio (OR 0,94 a 0,97) y un reloj más temprano (Burns 2021, observacional). Más luz a la mañana, dormirse antes (Figueiro 2017). La luz después del mínimo de temperatura adelanta el reloj (Khalsa 2003). Nadie midió «cuántos minutos después de despertarte» | Nada | «Luz de día · Un rato afuera esta mañana te ayuda a tener sueño a tu hora.» | **Moderada** que ayuda; la hora y los minutos, **convención** |
| **Las pantallas** | Leer en una tableta antes de dormir: dormirse más tarde, menos melatonina, el reloj más tarde y menos alerta a la mañana (Chang 2015). Los días con más pantalla te duermes más tarde (r = 0,079), y la pantalla después de acostarte es la que más baja la calidad (Bourke 2026, en jóvenes) | En el aviso de la cama: «Ve dejando el teléfono» | «Ve dejando el teléfono: a las 23:00, a la cama.» | **Débil a moderada** |
| **La siesta** | Después de dormir poco, 10 minutos a las 15:00 fue lo que más ayudó; 30 minutos dieron inercia al despertar (Brooks y Lack 2006). Las siestas de 30 minutos o más se asocian a más mortalidad y más enfermedad cardiovascular; las más cortas, no (Yang 2024, 44 cohortes, con confusión posible). La siesta a menos de 7 h de la noche se asocia a dormir peor (Mograss 2022) | Solo en la línea del partido de noche: «haz una siesta corta temprano» | «Si duermes siesta, que sea corta, unos 20 minutos, y antes de las 16:00.» | **Moderada** para la duración; **débil** para la hora |
| **El baño o la ducha tibia** | 40 a 42,5 °C, unos 10 minutos, 1 a 2 h antes de la cama: dormirse antes y mejor calidad (Haghayegh 2019) | Nada | «Ducha tibia · Buen momento: en hora y media, a la cama.» | **Moderada** (estudios chicos) |
| **La rutina y el aviso de la hora de ir a la cama** | No hay estudios de cuánto antes avisar. Escribir 5 minutos lo pendiente de mañana, al acostarse, te duerme antes que escribir lo hecho (Scullin 2018). La higiene del sueño sola no trata el insomnio (Edinger 2021, AASM) | El aviso, 30 minutos antes (15 a 60); leer, 45; escribir, 30 | «A la cama a las 23:00 · Empieza a bajar el ritmo.» Para escribir: «Anota lo pendiente de mañana: te ayuda a dormirte.» | **Convención** (la hora del aviso); **moderada** (la lista de pendientes) |
| **El despertar constante** | La regularidad importa para la salud y el rendimiento; recuperar el fin de semana puede ayudar si en la semana dormiste poco (Sletten 2023, consenso). Los cuatro quintiles más regulares, 20 a 48 % menos mortalidad que el más irregular (Windred 2024) | La hora de la cama sale del despertar de cada día, así que sigue lo que corres el fin de semana; no hay nada que lo empuje | En Sueño, si el fin de semana te despiertas más de una hora más tarde: «El fin de semana te despiertas 1 h 40 min más tarde: acercarlo ayuda a tu reloj.» | **Moderada a fuerte** (observacional grande y consenso); el «más de una hora», **convención** |
| **La comida antes de entrenar** | 1 a 4 g/kg de carbohidratos 1 a 4 h antes de lo que dura más de 60 minutos; cuanto más cerca, menos (Thomas 2016) | La comida de 1 a 4 h antes de salir; si no hay, algo liviano 75 minutos antes de salir. Avisa media hora antes de esa comida | «Come antes de entrenar · Almuerzo a las 13:00: carbohidratos, algo de proteína y poca grasa.» | **Fuerte** en resistencia de más de una hora; **moderada** en fuerza |
| **La proteína después** | El momento deja de importar al ajustar por la proteína del día (Schoenfeld 2013); 0,3 g/kg después de las sesiones importantes y cada 3 a 5 h (Thomas 2016); de 0 a 2 h después la síntesis sube mucho, y cuánto hace falta depende de la comida de antes (Kerksick 2017) | Avisa al terminar, en la comida que sigue (hasta 4 h) o antes de 1 a 2 h | Solo si hace falta apurarse: «Proteína después de entrenar · Hace horas que no comes: unos 30 g antes de las 9:00.» | **Fuerte** para el total del día; **débil** para la hora |
| **La proteína antes de dormir** | 20 a 40 g de caseína unos 30 minutos antes de dormir suben la síntesis de la noche; a largo plazo, beneficio en hombres jóvenes que entrenan, con grupos que comían distinta proteína (Reis 2021; Kerksick 2017) | Una línea en Comida si faltan 25 g; a la noche, «muy bajo en proteína» | «Te faltan 30 g de proteína: un yogur o leche antes de dormir también cuentan.» | **Moderada** (como forma de completar el día) |
| **La hora del día para entrenar** | Poca evidencia a favor o en contra de una hora; rinde más entrenar a la hora en que después compites (Bruggisser 2023) | No recomienda una hora; el hábito de entrenar llega con aviso a las 17:30 | Ninguno | **Moderada** (que no importa mucho) |
| **Cuántos avisos por día** | Un aviso multiplica por 3,5 abrir la app en la hora siguiente y no se gastó en 30 días (Bell 2023); +3,9 % de uso en 24 h, más a mediodía el fin de semana (Bidargaddi 2018); con hasta 5 por día, el efecto bajó en 6 semanas (Klasnja 2019); más avisos, más malestar (Pielot 2014); agrupados 3 veces por día, más atención, mejor ánimo y menos estrés que como siempre (Fitz 2019). Nadie dio un número | 6 de fábrica (2 a 8), 20 minutos entre dos; «muy bajo» aparte, hasta 2 | — | **Convención** |

---

## 4. Qué hace Rise (referencia del producto, no evidencia)

Leí cuatro páginas de Rise (al final, en «Fuentes»); su centro de ayuda dio 403.

| | Rise | Moss hoy |
|---|---|---|
| Café | Por defecto, 10 h antes de su «ventana de melatonina» (la hora ideal de ir a la cama que calcula), ajustable; en otra página, 12 h | 8 h antes de dormirte (12 h con tomas de más de 200 mg) |
| Alcohol | Cortar 3 a 4 h antes de la cama, hasta dos tragos | Nada |
| Comida | Terminar la cena 2 a 3 h antes; si es más cerca, menos de 600 kcal | 3 h antes |
| Ejercicio intenso | No en la hora antes de la cama | Que termine 2 h antes |
| Luces | Bajarlas 90 minutos antes | 90 minutos antes |
| Rutina | 1 a 2 h antes (en otra página, 30 a 60 minutos) | Aviso de la cama 30 minutos antes; luces a los 90 |
| Luz de la mañana | «Lo antes que puedas» | Nada |
| Siesta | De 10 a 20 minutos o de 40 a 90, en el bajón de la tarde | Nada (solo la línea del partido) |
| Ducha | Unos 90 minutos antes | Nada |
| Sus avisos | Chequeo del sueño 90 minutos después de despertarte, «última llamada» unas horas antes de la cama, la ventana de melatonina, la rutina | Ver arriba |

- **La «ventana de melatonina»** es un cálculo de Rise (sueño de las noches anteriores y la luz inferida), no
  una medida: Moss no debería presentarla como si lo fuera.
- **Sus números no siempre coinciden entre páginas** (café 9, 10 o 12 h; rutina 30 a 60 minutos o 1 a 2 h).

---

## 5. Cambios propuestos

### Arreglos claros

1. **El corte del café cuenta desde la hora de ir a la cama, no desde la de dormirte.**
   - Gardiner 2023 y 2025 cuentan desde la hora de acostarse; Moss usa `dormir`, que es más tarde (lo que
     tardas en dormirte), así que corta 15 a 30 minutos tarde.
   - `loQueConviene.ts:215`: `corteDeCafeina(cama, …)` en lugar de `dormir`. En `alrededorDelEntreno.ts:177-179`
     la línea de la comida usa `c.dormir`: sumar `acostarse` a `Contexto` (ya sale de `horasDeSueno` en
     `secciones/comida/entreno.ts:43-44`) y usarlo ahí.
   - El texto «faltan {horas} para dormir» pasa a contar hasta la cama («faltan 8 h para ir a la cama»).
   - Test: con la cama a las 23:00 y 20 minutos para dormirte, el corte no se corre 20 minutos.
2. **El corte del café crece con la dosis, como en el modelo de Gardiner 2023.** El «hasta 200 mg, 8 h» no sale
   de ninguna fuente: el modelo da 8,8 h para 107 mg y 13,2 h para 217,5 mg, y 200 mg caen cerca de 12,5 h.
   - `alrededorDelEntreno.ts:98-101`, la forma propuesta (derivado de los dos puntos publicados):
     ```ts
     /** Horas antes de acostarse (Gardiner 2023: 8,8 h con 107 mg, 13,2 h con 217,5 mg; un té, sin corte). */
     export function horasDeCorte(mg: number | null): number | null {
       if (mg === null) return 9;               // sin saber, como un café
       if (mg <= 50) return null;              // un té o una cola: sin corte
       return Math.min(13.2, Math.max(8.8, 8.8 + ((mg - 107) * (13.2 - 8.8)) / (217.5 - 107)));
     }
     /** Al cuarto de hora de antes: mejor un poco antes que un poco después. */
     export const corteDeCafeina = (cama: number, mg: number | null) => {
       const h = horasDeCorte(mg);
       return h === null ? null : Math.floor((cama - h * 60) / 15) * 15;
     };
     ```
   - Con `null` no hay aviso del último café (solo el de antes de entrenar, si corresponde).
   - Tests (`alrededorDelEntreno.test.ts`), con la cama a las 23:00: sin dato, 14:00; 107 mg, 14:00 (8,8 h son
     14:12); 150 mg, 12:15; 220 mg y 400 mg, 9:45 (el tope); 47 mg, sin corte.
   - Cambia «tu día» de `loQueConviene.test.ts:54` y `:72`: el café de las 15:00 para la sesión de las 16:00 ya
     no entra; queda «Último café · Hasta las 14:00. Antes de entrenar a las 16:00, mejor sin café.» a las 13:30.
   - Lo que todavía es una decisión: el número base (abajo, D1).
3. **A la noche, «muy bajo en calorías» no propone una comida grande.**
   - `loQueFalta.ts:152-174` (`ideasPara`): si el aviso cae a menos de 3 h de `acostarse`, solo ideas de hasta
     250 kcal (derivado de «algo liviano»: Kinsey y Ormsbee hablan de unas 150 kcal) y una sola idea; si no
     alcanza, dice «te acerca». Con `acostarse` nulo, a menos de 3 h de la medianoche (la cama que hoy supone
     `loQueFalta.ts:222`: las 23:30 más media hora).
   - La constante, en un lugar que no cree una dependencia circular (`loQueFalta.ts` no importa
     `loQueConviene.ts`): `CERCA_DE_LA_CAMA = 180`, y `ULTIMA_COMIDA` la usa.
   - Test (`loQueFalta.test.ts`, el caso de `:98-105`, cena anotada 21:10, cama 23:30, faltan 700 kcal): las
     ideas no incluyen `pasta` ni `arrozConHuevo`, hay una sola y `alcanza` es `false`.
   - La proteína de noche no cambia: 20 a 40 g antes de dormir no perjudican (Reis 2021, Kerksick 2017), aunque
     conviene que las ideas de noche empiecen por los lácteos.
4. **El texto del aviso de dormir sin «Deberías».** `recordatorios.dormirTextos.enUnRato` en `es.json`, «Deberías
   irte a dormir en {tiempo}.», va
   contra el tono de `spec/entreno.md` 5.8 («sin "debes"») y además repite a `enTiempo`. Propuesta: «Queda
   {tiempo} para ir a la cama.» (y su par en `en.json`). Test en los textos: ninguno de
   `recordatorios.dormirTextos` dice «Deberías», «debes» ni «tienes que».
5. **Las noches del aviso de las luces, el de dormir no dice «Baja las luces».** Hoy puede sonar «Baja las
   luces» a las 21:30 y «Baja las luces: a la cama en media hora» a las 22:30. `textoDeDormir` (`avisos.ts:157`)
   recibe si `luces` está prendido y salta `'luces'`. Test: con `ajustes.luces.encendido`, nueve noches seguidas
   sin el texto `'luces'`. (Está en «Para decidir» de `spec/avisos.md:397`; una cosa por aviso lo resuelve.)
6. **La comida de antes de entrenar, hasta 4 h antes de empezar.** `loQueConviene.ts:156` cuenta el tope de 4 h
   desde la salida: con una hora de viaje acepta una comida 5 h antes de empezar, fuera de lo de ACSM (1 a 4 h
   antes del ejercicio). Propuesta: `salida - hora[c] >= 60 && s.inicio - hora[c] <= 240`. Test: viaje de 60
   minutos, sesión a las 16:00, almuerzo a las 11:30: no es la previa, y el aviso pasa a «Algo liviano a las
   13:45».
7. **Las citas de los comentarios, como dicen las fuentes.**
   - `loQueConviene.ts:70`: «2 h antes de la cama (Leota 2025, con Frimpong 2021)». Leota recomienda 4 h o más;
     los 2 h salen de Frimpong 2021 (2 a 4 h antes no altera el sueño) y Stutz 2019 (la hora antes, quizá sí).
   - `loQueConviene.ts:75`: «como Rise; Gooley 2011». Gooley mide 8 h de luz antes de dormir y encuentra la
     melatonina 90 minutos más corta: no da 90 minutos como horario. El consenso (Brown 2022) dice 3 h.
   - `alrededorDelEntreno.ts:98`: «8 hasta 200 mg, 12 con más (Gardiner 2023 y 2025)»: ninguno dice eso (ver 2).
   - Lo mismo en `spec/avisos.md:176-181`, `:235-239` y `:243-246`.

### Decisiones del dueño

- **D1. El número base del café** (Pendiente 4 de `spec/entreno.md`): 9 h (el metaanálisis, 8,8 h, redondeado;
  recomendado), 8 h (lo de hoy), o 6 h (el ensayo de 2025, solo para 100 mg y en hombres jóvenes que toman café
  moderado). El corte del metaanálisis es donde la pérdida de sueño deja de ser estadísticamente detectable, no
  donde desaparece: con sus parámetros, 107 mg a 8,8 h todavía predicen unos 12 minutos menos (derivado del
  modelo, no significativo). Además, la vida media típica es de 3 a 6 h y puede llegar a 8 h en adultos sanos
  (Gardiner 2023). Opción: «Me afecta el café:
  poco, normal, mucho» en Perfil, que corra el corte 2 h para cada lado (como el ajuste de Rise).
- **D2. Las luces: 90 minutos (Rise, lo de hoy) o 3 h (Brown 2022).** A las 3 h el aviso cae en la cena y, en
  verano, con luz de día afuera; a los 90 minutos llega tarde para la melatonina, que empieza a subir antes. Con
  cualquiera de los dos, el porqué dice «cuanto antes, mejor». A los 90 minutos, la mayor parte de la noche ya
  pasó con la luz de una habitación, que es la que atrasó la melatonina en Gooley 2011 y la que la suprime a la
  mitad con unos 25 lux en Phillips 2019.
- **D3. El ejercicio: 2 h de límite con «mejor 4 h» en el porqué (recomendado), o 4 h.** Con 4 h, el aviso
  sonaría casi siempre a quien entrena después del trabajo, y lo liviano tarde no molesta: pasaría a decir menos
  «suave» de lo que hace falta.
- **D4. La última comida para quien cena tarde.** En Uruguay y Argentina, cenar a las 22 y acostarse a las 0:30
  es común; con 3 h, el aviso pide cenar a las 21:30. Opciones: 3 h (lo de hoy), 2 h (el borde de la guía), o 3 h
  sin pedir cenar más de una hora antes que lo de siempre (como `ADELANTO_MAXIMO` del sueño).
- **D5. La proteína de después, solo cuando hay que apurarse** (en ayunas, o más de 4 h desde la comida de
  antes; `pronto` en `loQueConviene.ts:196`). Si la comida que sigue cae sola en su hora, ya avisa el horario de
  comidas y la línea de Comida. Un aviso menos por día de entreno, sin perder nada que la evidencia sostenga.
- **D6. El máximo de fábrica.** 6 (lo de hoy) o 4 (lo de antes de 26/10), y si Moss cuenta los avisos que se
  descartan para proponer apagar el que casi nunca se abre («Este aviso casi nunca lo abres: ¿lo apagamos?»).
  Saber si se descartó pide una categoría con acción de descarte en iOS; hay que confirmar que `expo-notifications`
  la expone.
- **D7. Los nuevos** (sección 6): cuáles entran y si van como avisos de «Lo que conviene» o como hábitos de los
  primeros.

---

## 6. Los avisos nuevos que valdría la pena sumar

Todos apagados de fábrica, como lo demás.

1. **La luz de la mañana** (moderada). Como hábito de los primeros con aviso a los 30 minutos de despertarte
   (`avisoDeFabrica`, `{ tipo: 'despertar', despues: 30 }`), o como un interruptor más de «Lo que conviene».
   - Por qué: consenso (Brown 2022), cohorte de unas 400.000 personas (Burns 2021), oficinistas medidos con
     sensores (Figueiro 2017) y el mecanismo (Khalsa 2003).
   - No dice minutos ni lux: nadie midió cuánto rato hace falta, y no hay cómo medir los lux en el teléfono.
   - Texto: «Luz de día · Un rato afuera esta mañana te ayuda a tener sueño a tu hora.»
2. **La ducha o el baño tibio** (moderada). Hábito de los primeros con aviso 90 minutos antes de la cama
   (`{ tipo: 'dormir', antes: 90 }`; el editor hoy ofrece 15, 30 y 60 antes de dormir: habría que sumar «hora y
   media»).
   - Por qué: Haghayegh 2019.
   - Texto: «Ducha tibia · Buen momento: en hora y media, a la cama.»
3. **La noche con alcohol** (fuerte el efecto; no es un aviso). Una línea en Sueño a la mañana siguiente, si lo
   anotado con alcohol desde las 18 de ayer llega a 0,5 g/kg (≈ dos o tres tragos; Gardiner 2025).
   - No es un aviso porque no hay hora segura que proponer y porque un aviso por lo que se tomó culpa.
   - Texto: «Anoche hubo alcohol: suele hacer más liviana la segunda mitad de la noche.»
   - En el porqué: «No hay una hora segura: en un estudio, una dosis moderada seis horas antes de acostarse igual
     cortó la segunda mitad de la noche.»
   - Los datos ya están: el alcohol de cada alimento y su hora (los usa la regla 5 de `segunElDeporte.ts`).
4. **El despertar parecido todos los días** (moderada a fuerte). Una línea en Sueño una vez por semana, si el fin
   de semana te despiertas más de una hora más tarde que entre semana (`sueno.ts` ya compara el punto medio del
   sueño del fin de semana con el de lunes a viernes; para esto haría falta el despertar).
   - Por qué: Sletten 2023 y Windred 2024. Sin culpa, y diciendo que recuperar sueño el fin de semana puede
     servir si en la semana dormiste poco (lo dice el consenso).
5. **Escribir lo pendiente** (moderada). No es nuevo: el hábito «escribir» de los primeros, con su aviso 30
   minutos antes de dormir, puede proponer «Anota lo pendiente de mañana» en vez de un diario (Scullin 2018).
6. **Para más adelante: la siesta.** Cuando Moss lea las siestas del reloj (`spec/aparatos.md`: el Apple Watch
   las escribe desde watchOS 11), una línea en Sueño si fue larga (más de 30 minutos) o tarde (a menos de 7 h de
   la cama). Hoy Moss no estima siestas sin reloj (`spec/sueno.md`), así que no hay de qué hablar.

Lo que **no** vale un aviso: el agua de noche (sin evidencia de horario), la hora del día para entrenar (no hay
una mejor), las pantallas aparte (ya está en el texto de la cama) y el café de quien no toma.

---

## 7. Lo que no se dice (ni se hace)

- **Una hora segura para el alcohol**, ni «una copa ayuda a dormir»: a dosis bajas ya baja el REM, y para
  dormirte antes hace falta una dosis alta (Gardiner 2025).
- **La «ventana anabólica» de 30 minutos**, ni urgencia después de entrenar si comiste hace poco (Schoenfeld
  2013).
- **«La mejor hora para entrenar es…»** (Bruggisser 2023).
- **Dosis de cafeína**, ni proponer café a quien no lo toma, ni «tómate un café para compensar lo que dormiste».
- **Que estos consejos curan el insomnio** (Edinger 2021). Si alguien duerme mal hace meses, lo que se dice es
  la terapia cognitivo-conductual y un médico.
- **Nada de culpa:** «deberías», «no debes», «te pasaste»; ni un aviso por lo que tomaste o comiste tarde.
- **Comidas grandes cerca de la cama** (lo que hoy puede pasar con «muy bajo en calorías»), ni agua de noche.
- **La «ventana de melatonina» como si fuera medida**: es un cálculo de Rise.
- **Productos** (anteojos para la luz azul, lámparas, suplementos de melatonina).
- **Precisión falsa:** el corte del café es aproximado y cambia de persona a persona (la vida media típica es de
  3 a 6 h y puede llegar a 8 h en adultos sanos, según Gardiner 2023); el porqué lo dice.
- **Que comer tarde engorda**: Gu 2020 muestra más glucosa de noche en un día, no un cambio de peso.

---

## 8. Para «En qué se basa Moss»

**Español (neutro):**

> Los avisos que te dicen cuándo dejar el café, cuándo hacer la última comida grande, hasta qué hora entrenar
> fuerte y cuándo bajar las luces salen de revisiones de estudios y de consensos de expertos. El corte del café
> sigue el metaanálisis de Gardiner y su equipo (2023), que calculó cuántas horas antes de acostarte la cafeína
> deja de quitarte sueño según la cantidad; las luces, el consenso de 18 expertos en luz y sueño de Brown y otros
> (2022); y la comida alrededor del entrenamiento, la postura del American College of Sports Medicine (2016). Moss
> cuenta cada hora desde tu hora de ir a la cama y desde tu entrenamiento, así que es una guía aproximada: cada
> persona responde distinto, sobre todo a la cafeína y al alcohol. Son consejos para personas sanas; si hace
> meses que duermes mal, lo que más ayuda es la terapia cognitivo-conductual para el insomnio, y conviene que lo
> hables con un médico.

**English:**

> The notifications that tell you when to stop caffeine, when to have your last big meal, how late to train hard
> and when to dim the lights come from reviews of studies and expert consensus. The caffeine cutoff follows the
> meta-analysis by Gardiner and colleagues (2023), which estimated how many hours before bed caffeine stops
> costing you sleep depending on the dose; the lighting advice follows a consensus of 18 light and sleep experts
> led by Brown (2022); and eating around training follows the American College of Sports Medicine position
> (2016). Moss counts each time back from your bedtime and your training, so treat it as an approximate guide:
> people respond differently, especially to caffeine and alcohol. This is advice for healthy people; if you have
> slept badly for months, what helps most is cognitive behavioral therapy for insomnia, and it is worth talking
> to a doctor.

---

## 9. Fuentes

PubMed y PMC respondieron con una pantalla de verificación: los resúmenes los leí en Europe PMC (su API) y los
textos completos, en Europe PMC, en el servicio OAI de PMC o en el PDF de la revista o del repositorio. «Entero»
es que leí el texto completo (o las partes de métodos, resultados y discusión); «en parte», solo algunas
secciones; «solo el resumen», el resumen.

**La cafeína**

- Gardiner C, Weakley J, Burke LM, et al. 2023. The effect of caffeine on subsequent sleep: A systematic review
  and meta-analysis. *Sleep Med Rev* 69:101764. https://doi.org/10.1016/j.smrv.2023.101764 · **entero** (PDF de
  Leeds Beckett). Sin conflictos de interés declarados.
- Gardiner CL, Weakley J, Burke LM, et al. 2025. Dose and timing effects of caffeine on subsequent sleep: a
  randomized clinical crossover trial. *Sleep* 48(4):zsae230. https://doi.org/10.1093/sleep/zsae230 · **casi
  entero** (Europe PMC, PMC11985402; no llegué a la financiación).
- Drake C, Roehrs T, Shambroom J, Roth T. 2013. Caffeine effects on sleep taken 0, 3, or 6 hours before going to
  bed. *J Clin Sleep Med* 9(11):1195-1200. https://doi.org/10.5664/jcsm.3170 · **solo el resumen** (y lo que dice
  de él Gardiner 2023).
- Guest NS, VanDusseldorp TA, Nelson MT, et al. 2021. International society of sports nutrition position stand:
  caffeine and exercise performance. *J Int Soc Sports Nutr* 18:1. https://doi.org/10.1186/s12970-020-00383-4 ·
  **en parte** (los puntos de la postura y la farmacocinética; Europe PMC, PMC7777221).

**El alcohol**

- Gardiner C, Weakley J, Burke LM, et al. 2025. The effect of alcohol on subsequent sleep in healthy adults: A
  systematic review and meta-analysis. *Sleep Med Rev* 80:102030. https://doi.org/10.1016/j.smrv.2024.102030 ·
  **entero** (PDF de Monash). 21 de 27 estudios con riesgo de sesgo. Sin conflictos de interés declarados.
- Landolt HP, Roth C, Dijk DJ, Borbély AA. 1996. Late-afternoon ethanol intake affects nocturnal sleep and the
  sleep EEG in middle-aged men. *J Clin Psychopharmacol* 16(6):428-436.
  https://doi.org/10.1097/00004714-199612000-00004 · **solo el resumen**.
- Ebrahim IO, Shapiro CM, Williams AJ, Fenwick PB. 2013. Alcohol and sleep I: effects on normal sleep. *Alcohol
  Clin Exp Res* 37(4):539-549. https://doi.org/10.1111/acer.12006 · **solo el resumen**.
- Pietilä J, Helander E, Korhonen I, et al. 2018. Acute effect of alcohol intake on cardiovascular autonomic
  regulation during the first hours of sleep in a large real-world sample of Finnish employees. *JMIR Ment Health*
  5(1):e23. https://doi.org/10.2196/mental.9519 · **solo el resumen**. Dos autores, de Firstbeat (la empresa del
  índice de recuperación que se usa).

**La comida y el líquido antes de dormir**

- Katz PO, Dunbar KB, Schnoll-Sussman FH, et al. 2022. ACG Clinical Guideline for the Diagnosis and Management of
  Gastroesophageal Reflux Disease. *Am J Gastroenterol* 117(1):27-56. https://doi.org/10.14309/ajg.0000000000001538
  · **en parte** (las recomendaciones de hábitos; PMC8754510 por OAI).
- Fujiwara Y, Machida A, Watanabe Y, et al. 2005. Association between dinner-to-bed time and gastro-esophageal
  reflux disease. *Am J Gastroenterol* 100(12):2633-2636. https://doi.org/10.1111/j.1572-0241.2005.00354.x · **solo
  el resumen**.
- Gu C, et al. 2020. Metabolic effects of late dinner in healthy volunteers: a randomized crossover clinical
  trial. *J Clin Endocrinol Metab*. https://doi.org/10.1210/clinem/dgaa354 · **solo el resumen**.
- Kinsey AW, Ormsbee MJ. 2015. The health impact of nighttime eating: old and new perspectives. *Nutrients*
  7(4):2648-2662. https://doi.org/10.3390/nu7042648 · **solo el resumen**.
- Saidi O, Rochette E, Dambel L, St-Onge MP, Duché P. 2024. Chrono-nutrition and sleep: lessons from the temporal
  feature of eating patterns in human studies. A systematic scoping review. *Sleep Med Rev* 76:101953.
  https://doi.org/10.1016/j.smrv.2024.101953 · **solo el resumen**.
- International Continence Society. 2019. ICS consensus on the diagnosis and treatment of nocturia. *Neurourol
  Urodyn* 38(2):478-498. https://doi.org/10.1002/nau.23939 · **solo el resumen**.

**El ejercicio a la noche y la hora de entrenar**

- Stutz J, Eiholzer R, Spengler CM. 2019. Effects of evening exercise on sleep in healthy participants: a
  systematic review and meta-analysis. *Sports Med* 49(2):269-287. https://doi.org/10.1007/s40279-018-1015-0 ·
  **solo el resumen**.
- Frimpong E, Mograss M, Zvionow T, Dang-Vu TT. 2021. The effects of evening high-intensity exercise on sleep in
  healthy adults: a systematic review and meta-analysis. *Sleep Med Rev* 60:101535.
  https://doi.org/10.1016/j.smrv.2021.101535 · **solo el resumen**.
- Leota J, Presby DM, Le F, et al. 2025. Dose-response relationship between evening exercise and sleep. *Nat
  Commun* 16. https://doi.org/10.1038/s41467-025-58271-x · **casi entero** (Europe PMC, PMC12000559). Dos autores,
  pagados por WHOOP, que no tuvo otro papel; el estudio es observacional.
- Bruggisser F, Knaier R, Roth R, et al. 2023. Best time of day for strength and endurance training to improve
  health and performance? A systematic review with meta-analysis. *Sports Med Open* 9:34.
  https://doi.org/10.1186/s40798-023-00577-5 · **solo el resumen**.

**La luz y las pantallas**

- Brown TM, Brainard GC, Cajochen C, et al. 2022. Recommendations for daytime, evening, and nighttime indoor light
  exposure to best support physiology, sleep, and wakefulness in healthy adults. *PLoS Biol* 20(3):e3001571.
  https://doi.org/10.1371/journal.pbio.3001571 · **en parte** (las recomendaciones, el método y los límites;
  PMC8929548).
- Gooley JJ, Chamberlain K, Smith KA, et al. 2011. Exposure to room light before bedtime suppresses melatonin
  onset and shortens melatonin duration in humans. *J Clin Endocrinol Metab* 96(3):E463-E472.
  https://doi.org/10.1210/jc.2010-2098 · **solo el resumen**.
- Phillips AJK, et al. 2019. High sensitivity and interindividual variability in the response of the human
  circadian system to evening light. *Proc Natl Acad Sci USA*. https://doi.org/10.1073/pnas.1901824116 · **solo el
  resumen**.
- Chang AM, Aeschbach D, Duffy JF, Czeisler CA. 2015. Evening use of light-emitting eReaders negatively affects
  sleep, circadian timing, and next-morning alertness. *Proc Natl Acad Sci USA* 112(4):1232-1237.
  https://doi.org/10.1073/pnas.1418490112 · **solo el resumen** (sin los números: no pude abrir el texto).
- Bourke M, Maddren CI, Sippel F, Thomas G. 2026. Within-person association between daily screen use and sleep in
  youth: a systematic review and meta-analysis. *JAMA Pediatr* 180(5):500-509.
  https://doi.org/10.1001/jamapediatrics.2025.6490 · **solo el resumen**.
- Burns AC, et al. 2021. Time spent in outdoor light is associated with mood, sleep, and circadian rhythm-related
  outcomes: a cross-sectional and longitudinal study in over 400,000 UK Biobank participants. *J Affect Disord*
  295:347-352. https://doi.org/10.1016/j.jad.2021.08.056 · **solo el resumen**.
- Figueiro MG, et al. 2017. The impact of daytime light exposures on sleep and mood in office workers. *Sleep
  Health*. https://doi.org/10.1016/j.sleh.2017.03.005 · **solo el resumen**.
- Khalsa SBS, et al. 2003. A phase response curve to single bright light pulses in human subjects. *J Physiol*.
  https://doi.org/10.1113/jphysiol.2003.040477 · **solo el resumen**.
- He X, et al. 2025. The association of screen time and the risk of sleep outcomes: a systematic review and
  meta-analysis. *Front Psychiatry*. https://doi.org/10.3389/fpsyt.2025.1640263 · **en parte**. No la uso: mide
  el tiempo total de pantalla, no el de antes de dormir, y su certeza es muy baja a moderada.

**La siesta y el baño**

- Brooks A, Lack L. 2006. A brief afternoon nap following nocturnal sleep restriction: which nap duration is most
  recuperative? *Sleep* 29(6):831-840. https://doi.org/10.1093/sleep/29.6.831 · **solo el resumen**.
- Dutheil F, et al. 2021. Effects of a short daytime nap on the cognitive performance: a systematic review and
  meta-analysis. *Int J Environ Res Public Health* 18(19):10212. https://doi.org/10.3390/ijerph181910212 · **solo
  el resumen**.
- Yang YB, et al. 2024. To nap or not? Evidence from a meta-analysis of cohort studies of habitual daytime napping
  and health outcomes. *Sleep Med Rev* 78:101989. https://doi.org/10.1016/j.smrv.2024.101989 · **solo el
  resumen**.
- Mograss M, Abi-Jaoude J, Frimpong E, et al. 2022. The effects of napping on night-time sleep in healthy young
  adults. *J Sleep Res* 31(5):e13578. https://doi.org/10.1111/jsr.13578 · **solo el resumen**.
- Souabni M, Hammouda O, Romdhani M, et al. 2021. Benefits of daytime napping opportunity on physical and
  cognitive performances in physically active participants: a systematic review. *Sports Med* 51(10):2115-2146.
  https://doi.org/10.1007/s40279-021-01482-1 · **solo el resumen**.
- Du P, Li J, Hua Z, et al. 2026. Multiple health outcomes of daytime napping: a comprehensive umbrella review.
  *Public Health Rev*. https://doi.org/10.3389/phrs.2026.1609013 · **en parte**. Calidad baja o críticamente baja
  en 14 de 16 metaanálisis.
- Haghayegh S, Khoshnevis S, Smolensky MH, Diller KR, Castriotta RJ. 2019. Before-bedtime passive body heating by
  warm shower or bath to improve sleep: a systematic review and meta-analysis. *Sleep Med Rev* 46:124-135.
  https://doi.org/10.1016/j.smrv.2019.04.008 · **solo el resumen**.

**La rutina, la regularidad y la higiene del sueño**

- Sletten TL, Weaver MD, Foster RG, et al. 2023. The importance of sleep regularity: a consensus statement of the
  National Sleep Foundation sleep timing and variability panel. *Sleep Health* 9(6):801-820.
  https://doi.org/10.1016/j.sleh.2023.07.016 · **solo el resumen**.
- Windred DP, Burns AC, Lane JM, et al. 2024. Sleep regularity is a stronger predictor of mortality risk than
  sleep duration: a prospective cohort study. *Sleep* 47(1):zsad253. https://doi.org/10.1093/sleep/zsad253 ·
  **solo el resumen**.
- Irish LA, Kline CE, Gunn HE, Buysse DJ, Hall MH. 2015. The role of sleep hygiene in promoting public health: a
  review of empirical evidence. *Sleep Med Rev* 22:23-36. https://doi.org/10.1016/j.smrv.2014.10.001 · **solo el
  resumen**.
- Edinger JD, et al. 2021. Behavioral and psychological treatments for chronic insomnia disorder in adults: an
  American Academy of Sleep Medicine clinical practice guideline. *J Clin Sleep Med* 17(2):255-262.
  https://doi.org/10.5664/jcsm.8986 · **solo el resumen**.
- Scullin MK, Krueger ML, Ballard HK, Pruett N, Bliwise DL. 2018. The effects of bedtime writing on difficulty
  falling asleep: a polysomnographic study comparing to-do lists and completed activity lists. *J Exp Psychol Gen*.
  https://doi.org/10.1037/xge0000374 · **solo el resumen**.

**Comer alrededor del entrenamiento**

- Thomas DT, Erdman KA, Burke LM. 2016. Position of the Academy of Nutrition and Dietetics, Dietitians of Canada,
  and the American College of Sports Medicine: Nutrition and Athletic Performance. *J Acad Nutr Diet*
  116(3):501-528. https://doi.org/10.1016/j.jand.2015.12.006 · **en parte** (las tablas y los pasajes de antes,
  después y el agua; PDF de Dietitians of Canada).
- Kerksick CM, Arent S, Schoenfeld BJ, et al. 2017. International society of sports nutrition position stand:
  nutrient timing. *J Int Soc Sports Nutr* 14:33. https://doi.org/10.1186/s12970-017-0189-4 · **solo el resumen**.
- Schoenfeld BJ, Aragon AA, Krieger JW. 2013. The effect of protein timing on muscle strength and hypertrophy: a
  meta-analysis. *J Int Soc Sports Nutr* 10:53. https://doi.org/10.1186/1550-2783-10-53 · **solo el resumen**.
- Reis CEG, Loureiro LMR, Roschel H, da Costa THM. 2021. Effects of pre-sleep protein consumption on muscle-related
  outcomes: a systematic review. *J Sci Med Sport* 24(2):177-182. https://doi.org/10.1016/j.jsams.2020.07.016 ·
  **solo el resumen**.

**Cuántos avisos**

- Bell L, Garnett C, Bao Y, et al. 2023. How notifications affect engagement with a behavior change app: results
  from a micro-randomized trial. *JMIR Mhealth Uhealth* 11:e38342. https://doi.org/10.2196/38342 · **solo el
  resumen**.
- Bidargaddi N, Almirall D, Murphy S, et al. 2018. To prompt or not to prompt? A microrandomized trial of
  time-varying push notifications to increase proximal engagement with a mobile health app. *JMIR Mhealth Uhealth*
  6(11):e10123. https://doi.org/10.2196/10123 · **solo el resumen**.
- Klasnja P, Smith S, Seewald NJ, et al. 2019. Efficacy of contextually tailored suggestions for physical activity:
  a micro-randomized optimization trial of HeartSteps. *Ann Behav Med*. https://doi.org/10.1093/abm/kay067 · **solo
  el resumen**.
- Pielot M, Church K, de Oliveira R. 2014. An in-situ study of mobile phone notifications. *MobileHCI*.
  https://doi.org/10.1145/2628363.2628364 · **en parte** (el resumen y los resultados; copia de los autores).
- Fitz N, Kushlev K, Jagannathan R, et al. 2019. Batching smartphone notifications can improve well-being. *Comput
  Human Behav* 101:84-94. https://doi.org/10.1016/j.chb.2019.07.016 · **solo el resumen**.

**Rise (producto, no evidencia)** · **enteras**

- https://www.risescience.com/blog/wind-down-time
- https://www.risescience.com/blog/bedtime-routine
- https://www.risescience.com/improve-sleep-hygiene
- https://www.risescience.com/blog/when-should-you-stop-drinking-coffee

**Lo que no pude leer o no verifiqué**

- El centro de ayuda de Rise (403): su «ventana de melatonina» la describo por su blog.
- Las cifras de Chang 2015 (la latencia y el atraso del reloj): solo vi el resumen.
- El texto completo de Haghayegh 2019 (no está abierto): no tengo cuántos minutos se acorta la latencia.
- Lavie 1986 y Kitamura 2016, que usa `horaDeDormir`: son del área del sueño y no los abrí.
- El efecto exacto de los parámetros de Gardiner 2023 al corte (los «12 minutos») es una cuenta mía con los
  coeficientes publicados, sin la matriz de covarianza: es aproximada.
