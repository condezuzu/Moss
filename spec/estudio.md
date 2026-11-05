# El estudio de la evidencia (5/11/2026)

Lo pediste así: «quiero que sea lo más confiable posible, así que hacé un estudio de qué tenemos que calcular
y cómo, para darle el resultado más confiable al usuario. Quiero que saques de los estudios científicos más
confiables que hay y refutes todo lo que hacemos. Es más, quisiera que en Perfil, abajo de todo, aparezca en
qué nos basamos para crear esta app y cómo ordenamos toda la información para que la app realmente funcione».
Y, sobre los avisos: «buscá científicamente en qué momento es el mejor para evitar hacer algo o cuándo
deberías empezar a hacer algo» (como Rise). Y, sobre la IA de fotos: «poner por qué la IA no es confiable para
medir la comida que comes con solo una foto, con estudios que lo respalden».

**Cómo se hizo** ([`estudio/COMUN.md`](estudio/COMUN.md)): un agente por área leyó la spec y el código, anotó
cada cálculo y constante, buscó lo más fuerte que hay (revisiones sistemáticas, metaanálisis, consensos y
estudios de validación), partió de que lo de Moss estaba mal hasta que la evidencia mostrara lo contrario, y
dio un veredicto por cada cosa: **se sostiene**, **a medias**, **refutado** o **es una convención**. Cada
fuente con su DOI o su URL y si se leyó entera o solo el resumen; nada citado de memoria.

**En Perfil** (para aprobar en la galería): abajo de todo, «En qué se basa Moss», con el dibujo de cómo se
ordena lo que llega (lo que anotas, Salud y Ascent → Moss → lo que ves), sus reglas, un párrafo por área (la
sección 5 de cada estudio) con sus fuentes y lo que Moss no hace.

| Área | El estudio | Lo que se sostiene | Lo que cae |
|---|---|---|---|
| Metas, gasto y macros | [`estudio/metas.md`](estudio/metas.md) | Arrancar con una fórmula (Mifflin-St Jeor) y medir el gasto cada semana sin «compensar» (Sanghvi 2015); los ritmos; la proteína de 1,2 a 2,2 g/kg (Morton 2018); los estilos como preferencia (ninguno baja más con las mismas calorías: DIETFITS); NASEM desde los 19 | El control repite la última pesada hasta ayer (con una por semana, mide un 23 % menos del ritmo); mide con pocos datos y corrige siempre un 25 %; la «equilibrada» con mucho peso (47 % de grasas, o 0 g de carbohidratos); «sentado» 1,35 queda corto (1,45); el tope de 1 kg por semana no está en la meta; el control vuelve a la meta de fábrica y pierde lo elegido; de 16 a 18, valores de adulto; la fibra (al menos 25 g); el agua; el hierro contra la RDA y no el EAR |
| Peso, cuerpo y plan | [`estudio/progreso.md`](estudio/progreso.md) | La tendencia y no el número del día (media exponencial, α 0,1); los ritmos (bajar 0,25 a 1 % por semana, subir 0,25 a 0,5 %); el tope de 1 kg y 1.000 kcal; mantenimiento directo, sin «reverse diet»; el IMC 18,5 como piso duro; la cintura sobre la altura | «Al ritmo» sin margen (acierta un tercio de las veces): el ritmo con su rango y la fecha como rango; el relleno después de la última pesada; una pesada rara mueve el gasto; la tendencia atrasa 9 días; de Salud se guarda el último peso del día y no el de la mañana; la grasa con cinta erra ±4 puntos (Foulis 2023); con «sin déficit» y embarazo, el control baja la meta |
| Sueño | [`estudio/sueno.md`](estudio/sueno.md) | Las 8 h de fábrica (7 y media desde los 65); una fuente por noche; dejar las etapas fuera de la calidad; las categorías de regularidad; aprender lo de cada uno | Antes de los 18, 9 h; no se podía elegir la necesidad; la deuda premia las noches sin datos y se muestra con precisión falsa; la noche sin reloj cuenta como sueño lo despierto que el teléfono no ve; el rango sin reloj es demasiado angosto; la regularidad con noches estimadas |
| El mejor momento de cada cosa | [`estudio/momentos.md`](estudio/momentos.md) | Casi todos los avisos: el café, lo intenso lejos de la cama, la última comida grande (sobre todo por el reflujo), la comida alrededor del entreno, la luz baja de noche | El corte del café (desde la cama y según la dosis: 8,8 h para un café, 13,2 para 220 mg); «muy bajo en calorías» proponía comidas grandes cerca de la cama; el alcohol no tenía nada; cuántos avisos por día no tiene evidencia (es una convención) |
| Ascent | [`estudio/ascent.md`](estudio/ascent.md) | Lo más sólido es el sueño corto (con 6 h o menos, −2,85 % de fuerza y −9,85 % de repeticiones: Craven 2022) y «sin ir al fallo» después; la fatiga por músculo como idea | «Estás 87 % recuperado» (ningún puntaje compuesto está validado; la suma compensa); la probabilidad de marca; «estancado» con 3 semanas (63 % de falsos); la fatiga en horas y % |
| Cuidados | [`estudio/cuidados.md`](estudio/cuidados.md) | No preguntar la grasa con cuidados; nunca hablar de glucosa ni de insulina; la etiqueta de privacidad de hoy | Guardar solo «sin déficit» aplica la misma regla a casos opuestos (embarazo, riñón, agua); el ejemplo «Diabetes»; las referencias del embarazo y la lactancia no se usaban |
| La IA de fotos | [`estudio/fotos.md`](estudio/fotos.md) | «Una foto sola no alcanza para medir lo que comes»: reconoce qué hay, no cuánto ni lo que no se ve (36 a 64 % de error en calorías, Fridolfsson 2025) | — |

## Lo que se programó

- **Ya en la galería** (para aprobar): tu energía del día en Inicio (`energia.ts`: la comida, el sueño y, con
  Ascent, los músculos; `spec/entreno.md` 5.13), «En qué se basa Moss», la pantalla de pago sin nombrar la IA,
  el cuestionario con cuándo conviene cada reparto y cada proteína, Cuidados (`cuidados.ts`), Ascent sin
  porcentaje (con los ejercicios de Ascent), la deuda en una palabra con «esta noche», «Necesito dormir» y el
  ritmo con su margen en Progreso.
- **Arreglos claros, hechos el 5/11, cada uno con su test**: los del sueño y los avisos (16, entre ellos la
  deuda sin premiar las noches que faltan, lo despierto sin reloj y el café desde la hora de la cama), los de
  Ascent (el 1RM, la comida sin anotar, la fatiga, lo de `calculos.ts` y las citas), los de Cuidados, los de
  las metas (A1 a A12, salvo el texto «podría faltarte» de A11) y los del peso (A1 a A11). Lo que cambia en la
  app hoy: el control con las pesadas de verdad, los topes del déficit y de las grasas, el peso de Salud de la
  mañana, el estado con margen («Todavía no se sabe»), las referencias de 16 a 18 años, el hierro contra el
  EAR, el sueño (la deuda a la media hora y «aprox.», lo despierto sin reloj, la necesidad que elijas) y la
  última comida a 2 h de la cama (3 con reflujo).

## Lo que decidís vos

Cada estudio separa los arreglos claros de las decisiones (con lo que recomienda):

- **Avisos** ([`momentos.md`](estudio/momentos.md), §5): D1 el corte base del café (9 h recomendado), D2 las
  luces a los 90 minutos o a las 3 h, D3 el ejercicio a 2 h con «mejor 4», ~~D4 la última comida para quien cena
  tarde~~ (5/11: 2 h antes de la cama para todos y 3 con reflujo, como pediste), D5 la proteína de después solo si hay que apurarse, D6 el máximo de avisos por día, D7 los avisos
  nuevos (la luz de la mañana, la ducha tibia, la línea del alcohol en Sueño).
- **Sueño** ([`sueno.md`](estudio/sueno.md), §3): D1 a D10 (la continuidad de la calidad, las noches estimadas
  sin confirmar, el SRI, «Descubrir lo que necesitas», «Tardo en dormirme» largo, hasta 10 h de 18 a 25 años, lo
  de la noche con umbral propio, el fin de semana, lo que sobra, calibrar en la prueba en sombra).
- **Ascent** ([`ascent.md`](estudio/ascent.md), §3.3): sacar el porcentaje, «¿Cómo te sientes para entrenar?»,
  el rendimiento esperado como una línea, las marcas sin probabilidad, el estancamiento por tendencia, la
  fatiga en palabras, los datos nuevos de Ascent, la proteína extra del día de entreno, 2 o 4 h antes de dormir.
- **Peso y plan** ([`progreso.md`](estudio/progreso.md), §3.2): D1 a D12 (el ritmo con rango, ±4 de la grasa y
  la RFM, la cintura como señal, el piso de IMC 20, los ritmos con obesidad, las pausas, cuántas pesadas, el
  ciclo menstrual, el peso de Ascent, los planes largos, Kalman, el agua del glucógeno).
- **Cuidados** ([`cuidados.md`](estudio/cuidados.md)): D1 a D15 (guardar cuál solo en el teléfono, la lista, el
  embarazo, la lactancia, la diabetes, el riñón, los cálculos, un trastorno alimentario, el GLP-1, «Otra», Salud,
  los consejos nuevos, la clasificación por edad y exportar).
- **La IA de fotos** ([`fotos.md`](estudio/fotos.md), §3): si algún día se prende «Reconocer», que diga solo qué
  ve; el margen de las etiquetas en «Cómo lo estima»; preguntar el aderezo de las ensaladas.
- **Metas** ([`metas.md`](estudio/metas.md), §3.2): las 16 decisiones (entre ellas, el control con un ajuste
  según la calidad de los datos y su rango, el factor de «sentado», el piso de kcal, la fibra y el agua).

Las simulaciones de Ascent están en [`estudio/calc/`](estudio/calc/), las cuentas de las metas en
[`estudio/calc-metas/`](estudio/calc-metas/) y las del peso en [`estudio/sim/`](estudio/sim/) (corren el código
de Moss pasado a JavaScript con `sim/transpilar.js`). Son ilustraciones con supuestos explícitos, no evidencia.
