# Comer antes y después de entrenar: evidencia y reglas para Moss

Lo pediste el 26/10/2026: que Moss sugiera qué comer antes y después de
entrenar, y cuándo, según lo que se come y cómo se durmió, sin avisos ni
insistencia: adentro de la próxima comida. Las fuentes están al final,
numeradas [n], con autores, año, revista y enlace.

## Lo que hay en la v1

- **La regla:** `src/dominio/alrededorDelEntreno.ts`, con los tres días de
  ejemplo de 5.7 como tests: A1 a A7, B1 a B4, C1 y E1. Lo de la noche corta
  (C2) no va.
- **Cuándo entrenás:** a mano, en Perfil › Entrenamiento (qué días, a qué hora,
  cuánto dura y de qué tipo); queda en el teléfono. Los entrenamientos de Salud
  y la sesión de Ascent, después: leer los de Salud obliga a volver a pedir el
  permiso (leer un tipo no pedido cierra la app), y sin reloj casi no hay.
- **Dónde se ve:** una línea debajo del nombre de la comida que toca, en Comida
  (aunque todavía no sea su hora) y en la hoja de registro con esa comida
  elegida. Nunca un aviso. Tocarla dice por qué, con las fuentes, y ahí se
  apaga; vuelve en Perfil › Entrenamiento. Con «sin déficit» no aparece ni la
  fila de Perfil.
- **Lo que falta decidir** está en «7. Pendiente».

## Resumen

1. **Lo que más pesa es el total del día:** la proteína (1,6 g/kg; hasta 2,2) y,
   en quien hace mucha resistencia, los carbohidratos. El momento importa poco,
   salvo en tres casos: sesiones largas, entrenar después de muchas horas sin
   comer y dos sesiones en menos de 8 horas [3][4][5][7][10].
2. **Antes:** una comida 2 a 4 h antes; algo liviano 1 a 2 h antes; solo
   carbohidratos fáciles 30 a 60 min antes. Cuanto más cerca, menos grasa, fibra
   y volumen [3][22][23][24].
3. **Después:** 0,3 g/kg de proteína (20 a 40 g; 0,4 g/kg desde los 65) en la
   comida siguiente. Solo hay que apurarse si la comida anterior al
   entrenamiento quedó a más de 3 a 4 h, o si se entrenó en ayunas
   [1][3][4][12].
4. **Los carbohidratos después** solo importan si hay otra sesión exigente
   dentro de las 8 h [3][4][14].
5. **El sueño:** dormir poco hace comer 200 a 385 kcal más por día y baja el
   rendimiento, pero nadie probó que comer distinto lo compense. Lo útil es la
   hora de corte de la cafeína y, en días de entrenamiento, completar la
   proteína antes de dormir si falta [28][29][32][33][36][39].
6. **En déficit,** la proteína de Moss ya está bien (2,0 g/kg); lo que cambia es
   dónde van los carbohidratos: primero, alrededor de las sesiones largas
   [3][48][49].
7. **Con «sin déficit»** (embarazo, lactancia o una condición médica, sin saber
   cuál), la función no aparece [31][53][54].

## Las etiquetas

| Etiqueta | Qué quiere decir |
|---|---|
| **Fuerte** | Posturas oficiales y metaanálisis que coinciden |
| **Moderada** | Metaanálisis con mucha heterogeneidad, o pocos ensayos que coinciden |
| **Débil** | Ensayos chicos o agudos (síntesis de proteína en unas horas), sin resultado a largo plazo |
| **Derivado** | Un umbral o una cuenta de Moss: sale de la evidencia, pero nadie lo midió así |

g/kg es por kilo de peso corporal, no de masa magra, salvo que diga otra cosa.

---

## 1. Antes de entrenar

### 1.1 Cuánto antes: comida, algo liviano o un snack

| Cuánto antes | Qué | De dónde sale |
|---|---|---|
| 2 a 4 h | Una comida normal, con carbohidratos y proteína | ACSM: 1 a 4 g/kg de carbohidratos, 1 a 4 h antes de sesiones de más de 60 min [3]. El AIS pone la comida 3 a 4 h antes [25] |
| 1 a 2 h | Algo más chico, con poca grasa y poca fibra | ACSM: antes de entrenar, comida baja en grasa y en fibra y con proteína baja a moderada, porque vacía antes el estómago y da menos molestias [3]. El AIS pone algo liviano 1 a 2 h antes [25] |
| 30 a 60 min | Solo carbohidratos fáciles: fruta, pan, jugo | Los carbohidratos en la hora previa pueden bajar la glucosa en algunas personas, pero casi todos los estudios muestran el rendimiento igual o mejor: evitarlos no tiene fundamento [23]. En un estudio, 30 min antes rindió más que 120 min antes [22] |
| Menos de 30 min | Nada sólido | Derivado |

- Dentro de las 4 h previas, la hora exacta casi no cambia cómo se usa la
  energía; pesa más haber comido o no, salvo que la diferencia de horario sea de
  90 min o más [22].
- **Moderada:** son guías de consenso para deportistas. No hay ensayos que
  comparen horarios en la gente común.

### 1.2 Cuánto: carbohidratos y proteína según el tiempo

**Carbohidratos**

- **Resistencia (correr, bici, nadar) de más de 60 min:** 1 a 4 g/kg, 1 a 4 h
  antes; cuanto más cerca, menos [3]. ACSM las pone como metas para competencias
  o sesiones clave [3]. **Fuerte** para más de 60 min; en sesiones más cortas,
  comer antes no mejora el rendimiento [21][22].
- **Fuerza:**
  - En sesiones de más de 45 min, los carbohidratos antes o durante suben el
    volumen (DE 1,02); en las más cortas, 0,23, no significativo; después de 8 h
    o más sin comer, 0,39. Son 21 estudios y 226 personas; la dosis no cambió el
    efecto [18]. **Moderada.**
  - Comiendo normal y con hasta 10 series por músculo, no hay beneficio; aparece
    sobre todo contra grupos en ayunas y con más de 10 series por músculo [19].
    **Moderada.**
  - Sin el desayuno de 1,5 g/kg de carbohidratos, 2 h antes: 58 repeticiones de
    sentadilla en vez de 68, y 38 de press de banca en vez de 40 (16 hombres
    entrenados) [20]. **Débil.**
  - En la fuerza máxima (1 a 3 repeticiones), los carbohidratos no cuentan
    [18][19].

**Proteína**

- 0,3 g/kg después de las sesiones importantes y cada 3 a 5 h [3]; 0,25 a 0,40
  g/kg, o 20 a 40 g, por toma, cada 3 a 4 h [1][2].
- Antes y después de la fuerza: 0,4 a 0,5 g/kg de masa magra en cada una (unos
  28 a 35 g con 70 kg de masa magra) [4]; lo mismo para culturistas [48].
- Que la proteína justo antes sume algo por sí sola está poco estudiado [1].
  **Moderada** como parte de la comida previa: no hace falta un batido.

### 1.3 Qué evitar cerca

- **Grasa, fibra y mucha proteína:** vacían el estómago más lento y se asocian a
  más molestias; también lo que tiene solo fructosa y, en algunos, la leche
  [3][24].
- **El volumen:** cuanto más cerca, más chico. ACSM escala la cantidad con las
  horas de anticipación [3], y el AIS deja para la última hora solo lo que se
  digiere rápido [25].
- **Lo demás** (antiinflamatorios, tomar lo que nunca se probó) no es comida;
  Moss no lo dice [24].
- Las guías de molestias se basan en poca investigación; vale lo que cada uno ya
  probó [3][24]. **Moderada.**

### 1.4 Fuerza contra resistencia y sesiones largas

| Sesión | Antes | Durante |
|---|---|---|
| Fuerza de hasta 45 min o hasta 10 series por músculo | Lo de siempre [19] | Nada |
| Fuerza de más de 45 min o 10 series o más por músculo | Carbohidratos en la comida previa: ≈ 1 g/kg (derivado; [20] usó 1,5) [18] | Nada |
| Resistencia de menos de 60 min | Lo de siempre; en ayunas también rinde [21][22] | Nada hasta 45 min; un poco, o solo enjuagarse la boca, de 45 a 75 min [3] |
| Resistencia de 60 a 90 min | ≈ 1 g/kg o más, 1 a 4 h antes [3] | 30 a 60 g por hora pasada la hora [1][3] |
| Resistencia de más de 90 min | Hasta 1 g/kg por hora de anticipación, de 1 a 4 g/kg [3] | 30 a 60 g por hora hasta 2,5 h; hasta 90 g por hora si pasa de 2,5 a 3 h [3] |

Carbohidratos del día según la carga, de ACSM [3]: liviana, 3 a 5 g/kg; una hora
por día, 5 a 7; de 1 a 3 h por día, 6 a 10; más de 4 a 5 h por día, 8 a 12. En
quien hace mucha resistencia, la meta de Moss puede quedar abajo (ver
«Pendiente»).

### 1.5 Entrenar en ayunas a la mañana

- **Está bien:** resistencia de menos de 60 min (comer antes mejora lo largo, no
  lo corto: 46 estudios [21]; [22]), fuerza corta y fuerza máxima [18][19].
  Mucha gente entrena en ayunas para no tener molestias [22].
- **Algo chico antes ayuda:** resistencia de 60 min o más [3][21]; fuerza de más
  de 45 min o con mucho volumen (después de 8 h sin comer, DE 0,39 [18]; [20]).
- **Después:** si la comida anterior quedó a más de 3 a 4 h, al menos 25 g de
  proteína apenas se pueda [4].
- **Para bajar grasa no suma:** cardio en ayunas o comiendo, la misma pérdida de
  grasa (20 mujeres, 4 semanas, en déficit) [26]. Moss no lo propone nunca.

---

## 2. Después de entrenar

### 2.1 Cuánta proteína por comida

- 0,3 g/kg después de las sesiones y cada 3 a 5 h: 15 a 25 g para la mayoría.
  En 2016, más de 40 g todavía no había mostrado más síntesis, y ACSM lo dejaba
  para los más grandes o para quien baja de peso [3]; después, [9] y [13]
  mostraron que sí suma. **Fuerte.**
- 20 a 40 g (0,25 a 0,40 g/kg), con 700 a 3000 mg de leucina, cada 3 a 4 h
  [1][2]. **Fuerte.**
- **La edad:** la síntesis llega a su techo con 0,24 g/kg en jóvenes y con 0,40
  g/kg en mayores [12]. **Moderada.**
- **Después de todo el cuerpo:** 40 g dieron más síntesis que 20 g (≈ 20 %)
  [13]; 100 g contra 25 g dieron una respuesta más grande y más larga (más de
  12 h): no hay un techo por comida [9]. **Débil** (agudo), pero quiere decir
  que Moss no debe advertir sobre «demasiada proteína en una comida».

### 2.2 Cuánto importa el momento

- **La ventana es ancha.** En 23 estudios (525 personas), el efecto del momento
  desaparece al ajustar por la proteína total, que es la que más predice [5].
  **Fuerte.**
- 25 g antes o después, 10 semanas, 21 hombres entrenados: lo mismo; el margen
  puede ser de varias horas según cuándo fue la comida previa [6].
- Metaanálisis de 2025 (5 estudios): el momento no cambia la masa magra (DE
  −0,08); en prensa de piernas, antes rindió algo más que después (0,70, p =
  0,048), en pecho no [10].
- La ISSN dice que la proteína desde el final hasta 2 h después estimula mucho
  la síntesis [1], y que el efecto del ejercicio dura al menos 24 h [2]. ACSM
  2016 todavía se inclinaba por la proteína inmediata [3]; los metaanálisis no
  lo sostienen [5][10].

### 2.3 La comida previa cambia la posterior

- El tamaño y la hora de la comida previa cambian cuánto importa la proteína de
  después [1][2]; con 1,6 g/kg por día o más, el momento pesa todavía menos [2].
- **La regla práctica:** la comida de antes y la de después, a no más de 3 a 4 h
  una de otra; 5 a 6 h si la de antes fue una comida grande y mixta. Con una
  buena comida previa, apurarse después sobra; con más de 3 a 4 h sin comer, al
  menos 25 g apenas se pueda [4]. **Moderada.**

### 2.4 Carbohidratos después

- **Solo apuran con menos de 8 h entre dos sesiones** que vacían el glucógeno:
  1 a 1,2 g/kg por hora las primeras 4 h [3][4]; con menos de 4 h, 1,2 g/kg por
  hora, o 0,8 g/kg por hora más 0,2 a 0,4 g/kg por hora de proteína [1].
  **Fuerte.**
- **Si no, alcanza con el total del día** [3][4]. Sumar 50 g de carbohidratos a
  25 g de proteína no sumó síntesis [14]. En fuerza, reponer importó sobre todo
  con dos sesiones por día [19].

### 2.5 La proteína del día y el reparto

- **El total:** 1,62 g/kg por día es el punto de quiebre (IC 95 %: 1,03 a 2,20),
  en 49 ensayos y 1863 personas [7]. ACSM: 1,2 a 2,0 [3]; ISSN: 1,4 a 2,0 [2];
  con fuerza y antes de los 65, el efecto aparece con 1,6 o más [17].
  **Fuerte.**
- **El reparto:** 0,4 g/kg en al menos 4 comidas para llegar a 1,6, y hasta 0,55
  g/kg para 2,2 [8]. 20 g cada 3 h dieron más síntesis en 12 h que 8 tomas de 10
  g o 2 de 40 [11]. Pero que el reparto cambie el músculo a largo plazo no está
  probado: lo que pesa es el total [15][16]. **Débil** para el reparto.
- **Moss ya tiene:** 1,6 g/kg para mantener, 1,8 para subir y 2,0 para bajar,
  con un techo del 40 % de las calorías (`src/dominio/metas.ts`), y, con Ascent,
  la proteína post-entreno hasta 2,2 g/kg (D24, `src/dominio/entrenamiento.ts`).
  Esta función no cambia metas: reparte lo que ya está.

---

## 3. El sueño

### 3.1 Hambre y hormonas

- **Dormir poco hace comer más:** +385 kcal por día (IC 252 a 517; 11 estudios,
  172 personas), sin cambiar el gasto, con más grasa y menos proteína [32]; +204
  kcal por día (IC 112 a 295) [33]; +253 kcal por día y más hambre (+13,4 mm de
  100) en 41 ensayos [57]. Dormir 1,2 h más bajó 270 kcal por día en adultos con
  sobrepeso [35]. **Fuerte.**
- **Las hormonas son lo flojo:** la grelina sube poco (DE 0,14) [34] y no hay
  evidencia firme de cambios en leptina o grelina [57]. **Débil.** Moss habla
  del hambre, nunca de hormonas.

### 3.2 Rendimiento

- −7,6 % de rendimiento (IC −11,9 a −3,1), con mucha heterogeneidad. Pesa sin
  dormir y al despertarse antes de lo de siempre, no al acostarse tarde; pesa
  más de tarde; −0,4 % por hora despierto [36]. **Moderada.** Ya está en
  `spec/rendimiento.md`.

### 3.3 Síntesis de proteína

- Una noche sin dormir: −18 % de síntesis, cortisol +21 %, testosterona −24 %
  [37]. Cinco noches de 4 h: síntesis más baja (1,24 contra 1,53 % por día); con
  ejercicio intenso se mantuvo (1,61) [38]. **Débil** (estudios chicos).
- **Nadie probó que comer más proteína lo compense:** no se sugiere.

### 3.4 Cafeína

- **Para rendir:** 3 a 6 mg/kg unos 60 min antes; quizá alcance con 2 mg/kg;
  con 9 mg/kg los efectos adversos son frecuentes. La vida media es de 4 a 6 h,
  hay variación genética en cómo afecta el sueño, y puede ayudar después de
  dormir poco [27]. **Fuerte.**
- **El tope seguro:** hasta 200 mg de una vez y 400 mg por día en adultos sanos;
  200 mg por día en el embarazo y la lactancia; unos 100 mg ya pueden afectar el
  sueño de algunas personas cerca de la hora de dormir [31]. 3 a 6 mg/kg son 210
  a 420 mg para 70 kg: más que los 200 mg de una vez.
- **El sueño:**
  - Metaanálisis: −45 min de sueño, −7 % de eficiencia, +9 min para dormirse y
    +12 min despierto. Para no perder sueño, un café (107 mg) al menos 8,8 h
    antes de acostarse, y un preentreno (217,5 mg) 13,2 h antes [28].
    **Fuerte.**
  - Ensayo de 2025 (23 hombres que toman cafeína de forma moderada): 100 mg no
    cambiaron el sueño ni 4 h antes; 400 mg retrasaron el dormirse hasta 12 h
    antes y lo fragmentaron hasta 8 h antes; la gente solo lo notó a las 4 h
    [29]. **Moderada.**
  - 400 mg 6 h antes de acostarse todavía lo empeoraron [30].
- **Moss no sugiere dosis ni tomar cafeína.** Solo la hora de corte, y solo a
  quien ya la anota (la base trae la cafeína de cada alimento).

### 3.5 Antes de dormir

- **Proteína:**
  - 30 a 40 g de caseína antes de dormir suben la síntesis de la noche [1][2].
  - 40 g, 30 min antes de dormir, después de entrenar de noche: mejor balance de
    proteína (61 contra −11 µmol/kg) y +22 % de síntesis, en el límite (p =
    0,05) (16 hombres) [39].
  - 27,5 g cada noche por 12 semanas: más fuerza (+164 contra +130 kg) y más
    músculo (+8,4 contra +4,8 cm²) (44 hombres), pero sin igualar la proteína
    del día [40][41].
  - Igualando el total (1,8 g/kg), 35 g de día o de noche dieron lo mismo (13
    hombres) [42].
  - No empeora el sueño [41]. Una revisión ve un beneficio posible en jóvenes,
    con cautela porque los grupos comían distinta proteína [43].
  - **Para Moss:** una forma cómoda de completar la proteína del día cuando
    falta, no algo especial de la hora. **Moderada.**
- **Carbohidratos para dormir mejor:** cambian las etapas del sueño de manera
  inconsistente [44]. Las comidas «para dormir» (cereza ácida, kiwi, cena de
  alto índice glucémico) siguen en estudio [45]. Se dejan afuera.
- **Entrenar de noche** no empeora el sueño, salvo quizá lo intenso que termina
  a menos de 1 h de acostarse [46]. No es una regla de comida.

### 3.6 Qué entra y qué no

| Tema | En Moss | Por qué |
|---|---|---|
| Hora de corte de la cafeína | Sí: solo a quien la anota y entrena tarde | [28][29][30] |
| Proteína antes de dormir si falta | Sí, los días de entrenamiento | [1][2][39]–[43] |
| Más hambre después de una noche corta | Opcional, apagado de fábrica (ver «Pendiente») | Fuerte para la ingesta [32][33][57]; el texto es derivado |
| Más proteína o carbohidratos por haber dormido poco | No | No está probado [37][38] |
| Dosis de cafeína para rendir | No | Es un fármaco, con contraindicaciones, y la dosis pasa el tope de 200 mg [27][31] |
| Comidas u hormonas «para dormir» | No | Débil o inconsistente [34][44][45] |

---

## 4. En déficit

- **Proteína:** 1,6 a 2,4 g/kg al bajar de peso [49]; 2,0 o más, repartida [3];
  2,3 a 3,1 g/kg en entrenados con fuerza [2] (de masa magra, en culturistas
  [48]). Una meta-regresión de 2025 (29 estudios) ve más masa magra conservada
  cuanta más proteína, más claro por kilo de masa magra, en gente más magra, en
  hombres y en más de 4 semanas; los autores la llaman exploratoria [50]. Moss
  usa 2,0 g/kg al bajar: entra en todos los rangos.
- **Carbohidratos alrededor del entrenamiento:** el momento de los carbohidratos
  se puede mover para tenerlos en una sesión puntual; si no, alcanza con el
  total [3]. Comer carbohidratos antes gasta menos glucógeno, pero el total del
  día pesa más que dónde van [48]. Con un presupuesto chico, entonces, van
  primero a la comida previa y a la posterior de las sesiones largas
  (**derivado** sobre [3][48]).
- **El tamaño del déficit:** con déficit, la masa magra se gana menos (DE −0,57)
  y la fuerza casi igual (−0,31, no significativo); unas 500 kcal por día ya
  impiden ganar masa magra [51]. Bajar 0,5 a 1 % por semana [48]; Moss ya tiene
  el tope en 0,75 %.
- **El sueño en déficit:** con 5,5 h de cama en vez de 8,5 h se perdió un 55 %
  menos de grasa (0,6 contra 1,4 kg) y un 60 % más de masa magra (2,4 contra
  1,5 kg), con más hambre [47]. Es lo más fuerte que une sueño y déficit, pero
  va al control semanal o a Progreso, no a una comida.
- **Ayunas:** no suma pérdida de grasa [26]. Nunca se sugiere entrenar en
  ayunas «para quemar».
- **Energía muy baja:** la baja disponibilidad de energía daña la salud y el
  rendimiento, y los carbohidratos bajos tienen un papel cada vez mayor (REDs)
  [52].

---

## 5. Las reglas para programar

Un módulo puro nuevo en `src/dominio/` (por ejemplo `alrededorDelEntreno.ts`),
con tests, sin nada del teléfono; si la galería lo usa, va en `DEL_DOMINIO` de
`construir.mjs`. Los textos, en `es.json` y `en.json`.

### 5.1 Lo que entra y lo que sale

```ts
type Sesion = {
  inicio: number;              // minutos desde la medianoche
  minutos: number;             // de Salud, la que pusiste o la mediana de las tuyas
  tipo: 'fuerza' | 'resistencia' | 'mixta' | 'suave';
  seriesPorMusculo?: number;   // solo con Ascent
  prevista: boolean;           // todavía no pasó
  fuente: 'salud' | 'manual' | 'ascent';
};

type Contexto = {
  ahora: number;
  sesiones: Sesion[];
  horaDeComida: Record<Exclude<Comida, 'snack'>, number>; // la tuya o HORA_TIPICA
  anotado: Partial<Record<Comida, { hora: number; proteina: number; kcal: number }>>;
  meta: Macros;                // la del día, ya con «Calorías según el día» y D24
  comido: Macros;
  comidasHabituales: 3 | 4;    // las que solés anotar
  pesoKg: number | null;
  edad: number;
  despertar: number | null;    // medianas de las últimas 14 noches
  dormir: number | null;
  dormidoAnoche: number | null; // minutos
  bajando: boolean;
  sinDeficit: boolean;
  ocultarNumeros: boolean;
  cafeinaPorToma: number | null; // mg, si anotó cafeína 3 o más de los últimos 14 días
};

type Linea = {
  comida: Comida;
  clase: 'previa' | 'previaLiviana' | 'snackPrevio' | 'ayunasLarga' | 'despues'
       | 'despuesPronto' | 'reponer' | 'antesDeDormir' | 'nocheCorta';
  proteina?: number;           // g, de a 5
  carbohidratos?: number;      // g, de a 5
  durantePorHora?: [number, number];
  cafeinaHasta?: number;       // minutos
  fuentes: number[];           // las de este informe
};
```

### 5.2 Las constantes

```ts
const COMIDA_PREVIA = [120, 240];      // min antes [3][25]
const PREVIA_LIVIANA = [60, 120];      // [3][25]
const SNACK_PREVIO = [30, 60];         // [22][23]
const HUECO_LARGO = 240;               // min sin comer antes de entrenar [4]
const POSTERIOR_HASTA = 240;           // la primera comida en las 4 h siguientes es la posterior (derivado de [1][4])
const ENTRE_PREVIA_Y_POSTERIOR = 240;  // 360 si la previa fue grande [4]
const PREVIA_GRANDE = { proteina: 30, kcal: 600 }; // derivado
const DOBLE_SESION = 480;              // < 8 h entre sesiones exigentes [3][4]
const PROTEINA_POR_KG = 0.3;           // 0.4 desde los 65 [3][12]
const PROTEINA_REGLA = [20, 40];       // g [1][2][3]
const PROTEINA_SIN_PESO = { normal: 25, despues: 30, mayor: 35 }; // derivado de [1][2][4][12]
const PROTEINA_TRAS_AYUNO = 25;        // mínimo [4]
const SNACK_CARBOHIDRATOS = 30;        // 20–40; con peso, 0.5 g/kg (derivado)
const LIVIANA_MAX = { grasa: 15, fibra: 8 };  // g por comida (derivado de [3][24])
const SNACK_MAX = { grasa: 5, fibra: 3 };     // derivado
const DURANTE = [30, 60];              // g por hora desde los 60 min [1][3]
const CORTE_CAFEINA = { hasta200: 8 * 60, masDe200: 12 * 60 }; // derivado de [28][29][30]
const NOCHE_CORTA = 6 * 60;            // derivado; el mismo umbral que rendimiento.md
const FALTA_PARA_DORMIR = 25;          // g de proteína que faltan (derivado)
```

### 5.3 Qué sesión cuenta

- **El tipo, desde Salud** (`HKWorkoutActivityType`):
  - fuerza: `traditionalStrengthTraining`, `functionalStrengthTraining`;
  - resistencia: `running`, `cycling`, `swimming`, `rowing`, `elliptical`,
    `stairClimbing`, `hiking`, `crossCountrySkiing`, `paddleSports`, y
    `walking` de 90 min o más;
  - mixta: `highIntensityIntervalTraining`, `mixedCardio`, `crossTraining` y los
    deportes de equipo o de raqueta;
  - suave (no genera nada): `yoga`, `pilates`, `flexibility`, `mindAndBody`,
    `cooldown`, `taiChi`, `walking` de menos de 90 min, y cualquier sesión de
    menos de 20 min (derivado).
- **Larga** [3][18][19][21][22]:

  ```ts
  const larga = (s: Sesion) =>
    s.tipo === 'fuerza' ? s.minutos > 45 || (s.seriesPorMusculo ?? 0) >= 10
    : s.tipo === 'resistencia' || s.tipo === 'mixta' ? s.minutos >= 60
    : false;
  const muyLarga = (s: Sesion) => (s.tipo === 'resistencia' || s.tipo === 'mixta') && s.minutos >= 90;
  ```

- **Cuándo se sabe:**
  - **A mano:** la hora y el tipo que pusiste para ese día de la semana (gana a
    todo).
  - **Ascent** (después de la v1): la sesión del día.
  - **La de siempre, con Salud:** el mismo día de la semana en 3 de las últimas
    4 semanas, empezando a ± 60 min de la mediana; esa hora, esa duración y el
    tipo más común (derivado, como `frecuenciaPorDia`).
  - **Ya hecha:** el entrenamiento que Salud anotó; solo sirve para lo de
    después.
  - Si una prevista no empezó 60 min después de su hora, sus líneas se van.

### 5.4 Cuál comida es la previa y cuál la posterior

- **Las horas:** la mediana de la primera vez que anotaste cada comida en los
  últimos 14 días (con 4 días o más); si no, `HORA_TIPICA` (8:00, 13:00, 17:30 y
  21:00).
- **La previa:** la comida con Δ = T − hora más chico entre 30 min y 4 h. Con Δ
  de 2 a 4 h es `previa`; de 1 a 2 h, `previaLiviana`; de 30 a 60 min,
  `snackPrevio`.
- **Sin comida en las 4 h previas** (hueco largo): si la sesión es larga, la
  línea `snackPrevio` va en la próxima comida que se ve antes de T (la merienda o
  el snack vacíos también sirven). Si ya anotaste un snack en esas 4 h, ese es
  lo de antes: no hay línea.
- **A la mañana en ayunas:** T antes de despertar + 2 h y nada anotado desde que
  te despertaste: si es larga, `ayunasLarga` en el desayuno, hasta T; si es
  corta, nada antes [21][19].
- **La posterior:** la primera comida principal con hora entre fin − 15 min y
  fin + 4 h.
- **Antes de dormir:** la cena, o el snack de la noche si la cena ya está
  anotada. Del snack cuenta la última vez que se anotó: el de la mañana no es el
  de la noche. La línea va en un snack vacío aunque haya uno anotado más
  temprano.

### 5.5 Las reglas

**Proteína de una comida** (todas las reglas la usan):

```ts
function proteinaDeComida(c: Contexto, momento: 'normal' | 'liviana' | 'despues' | 'ayunas'): number {
  const mayor = c.edad >= 65;
  const regla = c.pesoKg !== null
    ? clamp(c.pesoKg * (mayor ? 0.4 : 0.3), 20, 40)
    : mayor ? 35 : momento === 'normal' || momento === 'liviana' ? 25 : 30;
  // Cerca de entrenar, solo la regla: la proteína alta en la previa liviana va contra [3].
  const parte = momento === 'liviana' ? 0 : c.meta.proteina / c.comidasHabituales;
  const minimo = momento === 'ayunas' ? 25 : 0; // [4]
  const queda = Math.max(0, c.meta.proteina - c.comido.proteina);
  return aCinco(Math.min(queda, Math.max(regla, parte, minimo)));
}
```

**Carbohidratos de la previa** (solo con peso y sesión larga; si no, sin número):

```ts
function carbohidratosPrevios(c: Contexto, s: Sesion, minutosAntes: number): number | null {
  if (c.pesoKg === null || !larga(s)) return null;
  const gPorKg = muyLarga(s) ? clamp(minutosAntes / 60, 1, 4) : 1; // [3]; fuerza larga, derivado de [18][20]
  const queda = Math.max(0, c.meta.carbohidratos - c.comido.carbohidratos);
  return aCinco(Math.min(gPorKg * c.pesoKg, 0.5 * queda)); // la mitad queda para después (derivado)
}
```

**Nada pasa de lo que queda de la meta del día:** si queda menos, se sugiere lo
que queda.

| ID | Si… | Entonces, en esa comida | Números | Fuentes | Evidencia |
|---|---|---|---|---|---|
| A1 | Hay comida 2 a 4 h antes | `previa`: carbohidratos y algo de proteína; las sugerencias con carbohidratos suben | P = `proteinaDeComida('normal')`; C = `carbohidratosPrevios` | [1][3][4][18][20] | Fuerte en resistencia de más de 60 min; moderada en fuerza |
| A2 | La comida cae 1 a 2 h antes | `previaLiviana`: lo mismo, más liviano; suben las de poca grasa y fibra | P = `proteinaDeComida('liviana')`; grasa ≤ 15 g y fibra ≤ 8 g por comida | [3][24][25] | Moderada (umbrales derivados) |
| A3 | La comida cae 30 a 60 min antes, o hay hueco largo y la sesión es larga | `snackPrevio`: solo carbohidratos fáciles | 30 g (con peso, 0,5 g/kg, de 20 a 40); grasa ≤ 5 g, fibra ≤ 3 g | [18][22][23] | Moderada (cantidad derivada) |
| A4 | Sesión a la mañana, sin comer desde que te despertaste, larga | `ayunasLarga` en el desayuno, antes de T | Como A3 | [18][20][21] | Moderada |
| A5 | Lo mismo, pero corta | Nada antes | — | [19][21][22] | Moderada |
| A6 | Resistencia o mixta de 90 min o más, prevista | Se agrega a la línea previa: lo de durante | 30 a 60 g por hora | [1][3] | Fuerte |
| A7 | `cafeinaPorToma` y T − 60 min cae después del corte | Se agrega a la línea previa: la hora límite | Corte = dormir − 8 h (≤ 200 mg) o − 12 h (> 200 mg) | [28][29][30][31] | Fuerte que afecta; el corte es derivado |
| B1 | Hay comida posterior (hasta 4 h después del final) | `despues`: proteína; suben las sugerencias con proteína | P = `proteinaDeComida('despues')` | [1][2][3][12][13] | Fuerte |
| B2 | Entre la previa y la posterior hay más de 4 h (6 si la previa fue grande), o se entrenó en ayunas | `despuesPronto` en la posterior: algo con proteína apenas se pueda | P = `proteinaDeComida('ayunas')`, al menos 25 g | [4] | Moderada |
| B3 | La próxima sesión larga empieza menos de 8 h después del final | `reponer` en la posterior y en la siguiente: carbohidratos y proteína | C ≈ 1 g/kg en cada una (de 1 a 1,2 g/kg por hora en 4 h; el reparto es derivado) | [1][3][4] | Fuerte |
| B4 | Ninguna de las anteriores | Sin carbohidratos especiales después | — | [3][4][14] | Fuerte |
| C1 | Día con sesión, comida de la noche, faltan 25 g o más de proteína | `antesDeDormir` | Lo que falta, de 30 a 40 g | [1][2][39][40][41][42][43] | Moderada |
| C2 | Anoche menos de 6 h y bajando (opcional, apagado) | `nocheCorta` en la primera comida, sin números | — | [32][33][35][57] | Fuerte la ingesta; el texto es derivado |
| C3 | Cualquier noche corta | No cambia metas, no suma proteína ni carbohidratos | — | [37][38] | — |
| D1 | Bajando y sesión larga | Los carbohidratos de la previa y la posterior salen primero del presupuesto del día | El tope del 50 % de `carbohidratosPrevios` | [3][48] | Derivado sobre una guía |
| D2 | Bajando | La meta de proteína sigue en 2,0 g/kg; cada comida sugiere al menos 0,3 g/kg o su parte | — | [2][3][49][50] | Fuerte |
| D3 | Bajando | Nunca «entrena en ayunas para quemar» | — | [21][26] | Fuerte |
| E1 | `sinDeficit` | Nada de esto aparece (ni D24, ver 5.9) | — | [31][53][54] | — |
| E2 | `ocultarNumeros` | Los mismos textos, sin gramos | — | [55] | — |
| E3 | Siempre | Nada de compensar, quemar ni ganarse la comida | — | [52][55] | — |

**Prioridad** si dos líneas caen en la misma comida: reponer, después pronto,
después, previa, previa liviana, snack previo, ayunas, antes de dormir y noche
corta. Como mucho una línea por comida y tres por día.

### 5.6 Sin peso

Moss pide el peso en la entrada (Mifflin-St Jeor); esto cubre las metas a mano
o el peso que falta.

| Qué | Con peso | Sin peso |
|---|---|---|
| Proteína de una comida | 0,3 g/kg (0,4 desde los 65), de 20 a 40 g, o la parte de la meta si es más | 25 g; 30 g después de entrenar o en ayunas; 35 g desde los 65; o la parte de la meta si es más |
| Carbohidratos de la previa, sesión larga | ≈ 1 g/kg; con resistencia de 90 min o más, 1 g/kg por hora de anticipación (1 a 4) | Sin número: «más carbohidratos que en tus otras comidas» |
| Snack previo | 0,5 g/kg, de 20 a 40 g | 30 g |
| Durante, 90 min o más | 30 a 60 g por hora | 30 a 60 g por hora |
| Reponer | ≈ 1 g/kg | Sin número |
| Antes de dormir | Lo que falta, de 30 a 40 g | 30 g |

### 5.7 Tres días de ejemplo (para los tests)

**1. Fuerza a la tarde, bajando.** 70 kg, 30 años; meta 140 g de proteína y 180
g de carbohidratos; fuerza de 60 min a las 19:00 (3 de los últimos 4 martes);
merienda 17:30, cena 21:30; se duerme a las 23:45; anota café (95 mg).
- Merienda (Δ = 1 h 30): `previaLiviana`. P = 0,3 × 70 = 21 → 20 g. C = 1 g/kg
  = 70 g, con tope en la mitad de lo que queda (120 g) → 60 g. Corte de café:
  23:45 − 8 h = 15:45, y 19:00 − 60 min = 18:00 cae después → se agrega.
  - «Entrenas a las 19:00: mejor algo liviano, con poca grasa y poca fibra.
    Unos 60 g de carbohidratos y 20 g de proteína. Si tomas café antes, que sea
    antes de las 15:45.»
- Cena (fin 20:00, cena a 1 h 30; previa y cena a 4 h): `despues`. P = máx(20,
  140 / 4 = 35) → 35 g. «Después de entrenar: unos 35 g de proteína en esta
  comida.»
- Si después de la cena faltan 30 g: «Te faltan 30 g de proteína: un yogur o
  leche antes de dormir también cuentan.» Dice lo que falta de verdad, de a 5 y
  hacia abajo: con 27 g, «25 g»; con 70, «70 g» (lo de 30 a 40 g es el porqué).

**2. Correr en ayunas.** Sin peso cargado; meta de 100 g de proteína en 4
comidas (la parte es 25 g); 75 min a las 7:00; se despierta 6:30; desayuno
9:00.
- Antes de las 7:00, en el desayuno, `ayunasLarga`: «Si entrenas más de una
  hora en ayunas, algo chico antes puede ayudarte: una fruta o pan, unos 30 g de
  carbohidratos.»
- Desde las 8:15, `despuesPronto` (ayunas): P = máx(30 sin peso, 25 de la
  parte, 25 de mínimo) = 30 g. «Después de entrenar sin haber comido: unos 30 g
  de proteína apenas puedas.»

**3. Dos sesiones.** 70 kg; bici de 2 h a las 7:00 y fútbol de 90 min a las
15:00 (6 h entre las dos): `reponer` en el desayuno y en el almuerzo, ≈ 70 g de
carbohidratos (1 g/kg) en cada uno, más la proteína de B1.

### 5.8 Cómo se ve, sin molestar

- **Una línea debajo del nombre de la comida,** en Comida y en la hoja de
  registro cuando esa comida está elegida. Nunca un aviso del teléfono, nunca en
  otra pantalla. Los avisos de hábitos atados a «entrenamiento»
  (`src/dominio/avisos.ts`) son otra cosa: los elige cada uno.
- **Solo los días con sesión** (hecha o prevista). Las de antes se ven hasta T;
  las de después, desde el final hasta que se anota esa comida o pasan 4 h. Al
  anotar la comida, la línea se va con una animación (y respeta Reducir
  movimiento).
- **Las sugerencias de esa comida se reordenan** («lo que solés comer a esta
  hora»): en la previa suben las que tienen carbohidratos y poca grasa y fibra;
  en la posterior, las que tienen proteína. No suma ningún toque al registro.
- **Tocar la línea abre «Por qué»,** con la fuente y la frase de 5.9; ahí se
  apaga («No mostrar más», que vuelve desde Perfil).
- **El tono:** sin signos de exclamación, sin «debes», sin «ventana anabólica».
  La hora a mano, si se suma, va en Perfil, fuera del registro.
- **Los textos** (tú, español neutro; faltan los de `en.json`):
  - `previa`: «Entrenas a las {hora}: esta comida es tu previa. Unos {c} g de
    carbohidratos y {p} g de proteína.» Sin números: «… Que tenga carbohidratos
    y algo de proteína.»
  - `previaLiviana`: «Entrenas a las {hora}: mejor algo liviano, con poca grasa
    y poca fibra.» (más los números)
  - `snackPrevio`: «Si comes algo antes de entrenar: una fruta, pan o jugo, unos
    {c} g de carbohidratos.»
  - `ayunasLarga`: «Si entrenas más de una hora en ayunas, algo chico antes
    puede ayudarte: una fruta o pan, unos {c} g de carbohidratos.»
  - durante: «Si pasa de 90 minutos, lleva {a} a {b} g de carbohidratos por
    hora.»
  - cafeína: «Si tomas café antes, que sea antes de las {hora}.»
  - `despues`: «Después de entrenar: unos {p} g de proteína en esta comida.»
  - `despuesPronto`: «Después de entrenar sin haber comido: unos {p} g de
    proteína apenas puedas.»
  - `reponer`: «Vuelves a entrenar a las {hora}: suma carbohidratos ahora y
    antes de la sesión.»
  - `antesDeDormir`: «Te faltan {p} g de proteína: un yogur o leche antes de
    dormir también cuentan.»
  - `nocheCorta`: «Dormiste {h}: es normal tener más hambre hoy.»

### 5.9 Seguridad

- **«Sin déficit» apaga la función.** Moss guarda solo ese booleano, no el
  motivo (embarazo, lactancia, diabetes, enfermedad renal o trastorno de la
  conducta alimentaria), así que tiene que servir para todos:
  - **Riñón:** KDIGO sugiere 0,8 g/kg por día en la enfermedad renal crónica G3
    a G5, y no pasar de 1,3 g/kg por día si hay riesgo de que avance [53]. Subir
    la proteína iría en contra.
  - **Diabetes:** con insulina o secretagogos (sulfonilureas), el ejercicio puede
    bajar la glucosa, y eso se ajusta con el equipo de salud [54]. Moss nunca
    habla de glucosa, insulina ni hipoglucemia, y nunca dice «en ayunas está
    bien» a quien puede tenerla.
  - **Embarazo y lactancia:** tope de cafeína de 200 mg por día [31].
- **Hallazgo para D24:** la proteína post-entreno con Ascent sube la meta hacia
  2,2 g/kg. Con «sin déficit» también debería apagarse. La meta base de
  mantener (1,6 g/kg) ya pasa de 1,3 g/kg (ver «Pendiente»).
- **Trastornos de la conducta alimentaria:** de las personas con un TCA que
  usaban un contador de calorías, el 73 % sintió que contribuía [55]. Por eso:
  nada de «ganarte», «quemar» o «compensar»; nunca sugerir saltear una comida ni
  entrenar en ayunas para bajar; nunca calorías gastadas; Ocultar los números se
  respeta siempre. Comer poco con mucho entrenamiento daña [52].
- **Edad:** Moss es para mayores de 18; no hay reglas para menores.
- **No es consejo médico.** En «Por qué»: «Es una guía general para personas
  sanas. No es un consejo médico.»

### 5.10 Lo que se deja afuera

- La «ventana anabólica» de 30 min [5][6][10].
- Proporciones fijas de carbohidratos y proteína (3:1, 4:1): solo sirven para
  reponer rápido cuando faltan carbohidratos [1].
- Índice glucémico antes de entrenar: sin beneficio general [3].
- El agua antes (5 a 10 ml/kg, 2 a 4 h antes [3]): Moss anota lo que tomás, no
  si estás hidratado (como en `rendimiento.md`).
- Suplementos, preentrenos y dosis de cafeína [27][31].
- Comidas «para dormir» y más proteína por dormir mal [37][38][44][45].

---

## 6. Lo que no pude verificar

- **AIS** [25]: la hoja (comida 3 a 4 h antes, algo liviano 1 a 2 h, en la
  última hora solo lo de digestión rápida) la vi solo en resultados de búsqueda:
  la copia dio 503 y el sitio oficial ya no la tiene.
- **KDIGO 2024** [53]: los números (0,8 y 1,3 g/kg) salen del resumen de NephJC,
  no del texto de la guía.
- **Colberg 2016, ADA** [54]: solo los datos de la cita; lo de la insulina y los
  secretagogos sale de una revisión secundaria. El texto completo dio 403.
- **EFSA 2015** [31]: por el resumen de EUFIC; la página de EFSA dio 403.
- **Snijders 2015** [40]: no pude ver si el grupo con proteína comió más
  proteína en total (se cita 1,9 contra 1,3 g/kg); la revisión de 2019 dice que
  no se separó del total [41].
- **Morton 2018** [7]: tiene una corrección de 2020 que no revisé.
- **Kerksick 2017** [1] escribe «1–4 g/kg/day» para lo de antes de entrenar;
  parece un error: uso la versión de ACSM (1 a 4 g/kg, 1 a 4 h antes) [3].
- **Un metaanálisis de 2025** en *Obesities* (6 ensayos, sin cambios en grelina
  ni leptina) apareció en la búsqueda, pero no lo pude abrir; no está citado.
- **Casi todo lo leí del resumen,** no de las tablas: King 2022, Craven 2022,
  Casuso 2025, Gardiner 2023 y 2025, entre otros. ACSM 2016 sí, entero.
- **Los «derivado»** (grasa ≤ 15 g y fibra ≤ 8 g, snack de 30 g, 3 de 4
  semanas, el tope del 50 %, el corte de 8 y 12 h, la noche corta de 6 h, la
  previa grande de 30 g y 600 kcal) no salen de ningún estudio.
- **No encontré posturas nuevas de la ISSN** (2023 a 2026) sobre el momento de
  la comida o la proteína. Lo nuevo: Trommelen 2023, Layman 2024, Casuso y
  Goossens 2025, Refalo 2025 y Gardiner 2025.
- **Casi todo es en hombres jóvenes** (por ejemplo [20][29][39][40]); no hay
  reglas por sexo.

## 7. Pendiente

1. **Con «sin déficit»,** ¿la función se apaga del todo (lo propuesto) o se
   puede prender a mano?
2. **D24 y la meta base de proteína con «sin déficit»:** ¿se apaga D24? ¿Y la
   meta de 1,6 g/kg, que pasa el tope de KDIGO para la enfermedad renal?
3. **La línea de la noche corta (C2):** ¿va, apagada de fábrica, o no va?
4. **El corte de la cafeína:** 8 h para dosis de hasta 200 mg (conservador, del
   metaanálisis) o 6 h para hasta 100 mg (del ensayo de 2025).
5. **La hora a mano:** ¿en Perfil, por día de la semana? No toca el registro.
6. **Mucha resistencia:** la meta de carbohidratos de Moss puede quedar debajo
   de lo de ACSM (5 a 10 g/kg por día). ¿Se dice algo, y dónde?
7. **La sesión prevista:** 3 de 4 semanas (lo propuesto) o 2 de 4.
8. **El nombre del módulo y el escenario de la galería** (¿dentro de `comida` o
   uno nuevo, `entreno`?).

---

## Fuentes

1. Kerksick CM, Arent S, Schoenfeld BJ, et al. 2017. International society of sports nutrition position stand: nutrient timing. *J Int Soc Sports Nutr* 14:33. https://doi.org/10.1186/s12970-017-0189-4
2. Jäger R, Kerksick CM, Campbell BI, et al. 2017. International Society of Sports Nutrition Position Stand: protein and exercise. *J Int Soc Sports Nutr* 14:20. https://doi.org/10.1186/s12970-017-0177-8
3. Thomas DT, Erdman KA, Burke LM. 2016. Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance. *J Acad Nutr Diet* 116(3):501–528 (también *Med Sci Sports Exerc* 48(3):543–568). https://doi.org/10.1016/j.jand.2015.12.006 · texto completo: https://www.dietitians.ca/DietitiansOfCanada/media/Documents/Resources/noap-position-paper.pdf
4. Aragon AA, Schoenfeld BJ. 2013. Nutrient timing revisited: is there a post-exercise anabolic window? *J Int Soc Sports Nutr* 10:5. https://doi.org/10.1186/1550-2783-10-5
5. Schoenfeld BJ, Aragon AA, Krieger JW. 2013. The effect of protein timing on muscle strength and hypertrophy: a meta-analysis. *J Int Soc Sports Nutr* 10:53. https://doi.org/10.1186/1550-2783-10-53
6. Schoenfeld BJ, Aragon A, Wilborn C, Urbina SL, Hayward SE, Krieger J. 2017. Pre- versus post-exercise protein intake has similar effects on muscular adaptations. *PeerJ* 5:e2825. https://doi.org/10.7717/peerj.2825
7. Morton RW, Murphy KT, McKellar SR, et al. 2018. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med* 52(6):376–384. https://doi.org/10.1136/bjsports-2017-097608
8. Schoenfeld BJ, Aragon AA. 2018. How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution. *J Int Soc Sports Nutr* 15:10. https://doi.org/10.1186/s12970-018-0215-1
9. Trommelen J, van Lieshout GAA, Nyakayiru J, et al. 2023. The anabolic response to protein ingestion during recovery from exercise has no upper limit in magnitude and duration in vivo in humans. *Cell Rep Med* 4(12):101324. https://doi.org/10.1016/j.xcrm.2023.101324
10. Casuso RA, Goossens L. 2025. Does Protein Ingestion Timing Affect Exercise-Induced Adaptations? A Systematic Review with Meta-Analysis. *Nutrients* 17(13):2070. https://doi.org/10.3390/nu17132070
11. Areta JL, Burke LM, Ross ML, et al. 2013. Timing and distribution of protein ingestion during prolonged recovery from resistance exercise alters myofibrillar protein synthesis. *J Physiol* 591(9):2319–2331. https://doi.org/10.1113/jphysiol.2012.244897
12. Moore DR, Churchward-Venne TA, Witard O, et al. 2015. Protein ingestion to stimulate myofibrillar protein synthesis requires greater relative protein intakes in healthy older versus younger men. *J Gerontol A Biol Sci Med Sci* 70(1):57–62. https://doi.org/10.1093/gerona/glu103
13. Macnaughton LS, Wardle SL, Witard OC, et al. 2016. The response of muscle protein synthesis following whole-body resistance exercise is greater following 40 g than 20 g of ingested whey protein. *Physiol Rep* 4(15):e12893. https://doi.org/10.14814/phy2.12893
14. Staples AW, Burd NA, West DW, et al. 2011. Carbohydrate does not augment exercise-induced protein accretion versus protein alone. *Med Sci Sports Exerc* 43(7):1154–1161. https://doi.org/10.1249/MSS.0b013e31820751cb
15. Hudson JL, Bergia RE 3rd, Campbell WW. 2020. Protein Distribution and Muscle-Related Outcomes: Does the Evidence Support the Concept? *Nutrients* 12(5):1441. https://doi.org/10.3390/nu12051441
16. Layman DK. 2024. Impacts of protein quantity and distribution on body composition. *Front Nutr* 11:1388986. https://doi.org/10.3389/fnut.2024.1388986
17. Nunes EA, Colenso-Semple L, McKellar SR, et al. 2022. Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults. *J Cachexia Sarcopenia Muscle* 13(2):795–810. https://doi.org/10.1002/jcsm.12922
18. King A, Helms E, Zinn C, Jukic I. 2022. The Ergogenic Effects of Acute Carbohydrate Feeding on Resistance Exercise Performance: A Systematic Review and Meta-analysis. *Sports Med* 52(11):2691–2712. https://doi.org/10.1007/s40279-022-01716-w
19. Henselmans M, Bjørnsen T, Hedderman R, Vårvik FT. 2022. The Effect of Carbohydrate Intake on Strength and Resistance Training Performance: A Systematic Review. *Nutrients* 14(4):856. https://doi.org/10.3390/nu14040856
20. Naharudin MN, Yusof A, Shaw H, Stockton M, Clayton DJ, James LJ. 2019. Breakfast Omission Reduces Subsequent Resistance Exercise Performance. *J Strength Cond Res* 33(7):1766–1772. https://doi.org/10.1519/JSC.0000000000003054
21. Aird TP, Davies RW, Carson BP. 2018. Effects of fasted vs fed-state exercise on performance and post-exercise metabolism: A systematic review and meta-analysis. *Scand J Med Sci Sports* 28(5):1476–1493. https://doi.org/10.1111/sms.13054
22. Rothschild JA, Kilding AE, Plews DJ. 2020. What Should I Eat before Exercise? Pre-Exercise Nutrition and the Response to Endurance Exercise: Current Prospective and Future Directions. *Nutrients* 12(11):3473. https://doi.org/10.3390/nu12113473
23. Jeukendrup AE, Killer SC. 2010. The myths surrounding pre-exercise carbohydrate feeding. *Ann Nutr Metab* 57(Suppl 2):18–25. https://doi.org/10.1159/000322698
24. de Oliveira EP, Burini RC, Jeukendrup A. 2014. Gastrointestinal complaints during exercise: prevalence, etiology, and nutritional recommendations. *Sports Med* 44(Suppl 1):S79–S85. https://doi.org/10.1007/s40279-014-0153-2
25. Australian Institute of Sport. Eating Before Exercise (hoja informativa; copia de terceros, no verificada). https://memberdesq.sportstg.com/assets/console/customitem/attachments/Eating%20Before%20Exercise%20-%20AIS%20Fact%20Sheet.pdf
26. Schoenfeld BJ, Aragon AA, Wilborn CD, Krieger JW, Sonmez GT. 2014. Body composition changes associated with fasted versus non-fasted aerobic exercise. *J Int Soc Sports Nutr* 11:54. https://doi.org/10.1186/s12970-014-0054-7
27. Guest NS, VanDusseldorp TA, Nelson MT, et al. 2021. International society of sports nutrition position stand: caffeine and exercise performance. *J Int Soc Sports Nutr* 18:1. https://doi.org/10.1186/s12970-020-00383-4
28. Gardiner C, Weakley J, Burke LM, et al. 2023. The effect of caffeine on subsequent sleep: A systematic review and meta-analysis. *Sleep Med Rev* 69:101764. https://doi.org/10.1016/j.smrv.2023.101764
29. Gardiner CL, Weakley J, Burke LM, et al. 2025. Dose and timing effects of caffeine on subsequent sleep: a randomized clinical crossover trial. *Sleep* 48(4):zsae230. https://doi.org/10.1093/sleep/zsae230
30. Drake C, Roehrs T, Shambroom J, Roth T. 2013. Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed. *J Clin Sleep Med* 9(11):1195–1200. https://doi.org/10.5664/jcsm.3170
31. EFSA Panel on Dietetic Products, Nutrition and Allergies. 2015. Scientific Opinion on the safety of caffeine. *EFSA J* 13(5):4102. https://doi.org/10.2903/j.efsa.2015.4102 · resumen leído: https://eufic.org/en/whats-in-food/article/efsa-opinion-on-the-safety-of-caffeine
32. Al Khatib HK, Harding SV, Darzi J, Pot GK. 2017. The effects of partial sleep deprivation on energy balance: a systematic review and meta-analysis. *Eur J Clin Nutr* 71(5):614–624. https://doi.org/10.1038/ejcn.2016.201
33. Fenton S, Burrows TL, Skinner JA, Duncan MJ. 2021. The influence of sleep health on dietary intake: a systematic review and meta-analysis of intervention studies. *J Hum Nutr Diet* 34(2):273–285. https://doi.org/10.1111/jhn.12813
34. Lin J, Jiang Y, Wang G, et al. 2020. Associations of short sleep duration with appetite-regulating hormones and adipokines: A systematic review and meta-analysis. *Obes Rev* 21(11):e13051. https://doi.org/10.1111/obr.13051
35. Tasali E, Wroblewski K, Kahn E, Kilkus J, Schoeller DA. 2022. Effect of Sleep Extension on Objectively Assessed Energy Intake Among Adults With Overweight in Real-life Settings: A Randomized Clinical Trial. *JAMA Intern Med* 182(4):365–374. https://doi.org/10.1001/jamainternmed.2021.8098
36. Craven J, McCartney D, Desbrow B, et al. 2022. Effects of Acute Sleep Loss on Physical Performance: A Systematic and Meta-Analytical Review. *Sports Med* 52(11):2669–2690. https://doi.org/10.1007/s40279-022-01706-y
37. Lamon S, Morabito A, Arentson-Lantz E, et al. 2021. The effect of acute sleep deprivation on skeletal muscle protein synthesis and the hormonal environment. *Physiol Rep* 9(1):e14660. https://doi.org/10.14814/phy2.14660
38. Saner NJ, Lee MJ, Pitchford NW, et al. 2020. The effect of sleep restriction, with or without high-intensity interval exercise, on myofibrillar protein synthesis in healthy young men. *J Physiol* 598(8):1523–1536. https://doi.org/10.1113/JP278828
39. Res PT, Groen B, Pennings B, et al. 2012. Protein ingestion before sleep improves postexercise overnight recovery. *Med Sci Sports Exerc* 44(8):1560–1569. https://doi.org/10.1249/MSS.0b013e31824cc363
40. Snijders T, Res PT, Smeets JS, et al. 2015. Protein Ingestion before Sleep Increases Muscle Mass and Strength Gains during Prolonged Resistance-Type Exercise Training in Healthy Young Men. *J Nutr* 145(6):1178–1184. https://doi.org/10.3945/jn.114.208371
41. Snijders T, Trommelen J, Kouw IWK, et al. 2019. The Impact of Pre-sleep Protein Ingestion on the Skeletal Muscle Adaptive Response to Exercise in Humans: An Update. *Front Nutr* 6:17. https://doi.org/10.3389/fnut.2019.00017
42. Joy JM, Vogel RM, Shane Broughton K, et al. 2018. Daytime and nighttime casein supplements similarly increase muscle size and strength in response to resistance training earlier in the day: a preliminary investigation. *J Int Soc Sports Nutr* 15:24. https://doi.org/10.1186/s12970-018-0228-9
43. Reis CEG, Loureiro LMR, Roschel H, da Costa THM. 2021. Effects of pre-sleep protein consumption on muscle-related outcomes — A systematic review. *J Sci Med Sport* 24(2):177–182. https://doi.org/10.1016/j.jsams.2020.07.016
44. Vlahoyiannis A, Giannaki CD, Sakkas GK, Aphamis G, Andreou E. 2021. A Systematic Review, Meta-Analysis and Meta-Regression on the Effects of Carbohydrates on Sleep. *Nutrients* 13(4):1283. https://doi.org/10.3390/nu13041283
45. Doherty R, Madigan S, Warrington G, Ellis J. 2019. Sleep and Nutrition Interactions: Implications for Athletes. *Nutrients* 11(4):822. https://doi.org/10.3390/nu11040822
46. Stutz J, Eiholzer R, Spengler CM. 2019. Effects of Evening Exercise on Sleep in Healthy Participants: A Systematic Review and Meta-Analysis. *Sports Med* 49(2):269–287. https://doi.org/10.1007/s40279-018-1015-0
47. Nedeltcheva AV, Kilkus JM, Imperial J, Schoeller DA, Penev PD. 2010. Insufficient sleep undermines dietary efforts to reduce adiposity. *Ann Intern Med* 153(7):435–441. https://doi.org/10.7326/0003-4819-153-7-201010050-00006
48. Helms ER, Aragon AA, Fitschen PJ. 2014. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. *J Int Soc Sports Nutr* 11:20. https://doi.org/10.1186/1550-2783-11-20
49. Hector AJ, Phillips SM. 2018. Protein Recommendations for Weight Loss in Elite Athletes: A Focus on Body Composition and Performance. *Int J Sport Nutr Exerc Metab* 28(2):170–177. https://doi.org/10.1123/ijsnem.2017-0273
50. Refalo MC, Trexler ET, Helms ER. 2025. Effect of Dietary Protein on Fat-Free Mass in Energy Restricted, Resistance-Trained Individuals: An Updated Systematic Review with Meta-Regression. *Strength Cond J*. https://doi.org/10.1519/SSC.0000000000000888
51. Murphy C, Koehler K. 2022. Energy deficiency impairs resistance training gains in lean mass but not strength: A meta-analysis and meta-regression. *Scand J Med Sci Sports* 32(1):125–137. https://doi.org/10.1111/sms.14075
52. Mountjoy M, Ackerman KE, Bailey DM, et al. 2023. 2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs). *Br J Sports Med* 57(17):1073–1097. https://doi.org/10.1136/bjsports-2023-106994
53. Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. 2024. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. *Kidney Int* 105(4S):S117–S314. https://doi.org/10.1016/j.kint.2023.10.018 · resumen leído: https://www.nephjc.com/news/kdigo-ckd-part2
54. Colberg SR, Sigal RJ, Yardley JE, et al. 2016. Physical Activity/Exercise and Diabetes: A Position Statement of the American Diabetes Association. *Diabetes Care* 39(11):2065–2079. https://doi.org/10.2337/dc16-1728
55. Levinson CA, Fewell L, Brosof LC. 2017. My Fitness Pal calorie tracker usage in the eating disorders. *Eat Behav* 27:14–16. https://doi.org/10.1016/j.eatbeh.2017.08.003
56. Dhillon J, Craig BA, Leidy HJ, et al. 2016. The Effects of Increased Protein Intake on Fullness: A Meta-Analysis and Its Limitations. *J Acad Nutr Diet* 116(6):968–983. https://doi.org/10.1016/j.jand.2016.01.003 (si C2 sumara «con proteína», esta es la base, indirecta: no se probó tras dormir poco)
57. Zhu B, Shi C, Park CG, Zhao X, Reutrakul S. 2019. Effects of sleep restriction on metabolism-related parameters in healthy adults: A comprehensive review and meta-analysis of randomized controlled trials. *Sleep Med Rev* 45:18–30. https://doi.org/10.1016/j.smrv.2019.02.002
