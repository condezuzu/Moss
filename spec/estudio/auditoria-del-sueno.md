# Auditoría: por qué Moss dice 16 h 30 de deuda y Rise 4 h

17/11/2026 · rama `mejoras-1.1` (43968cb), solo lectura: no se tocó ningún archivo del repo.
Los números salen de las funciones puras del repo, pasadas a JavaScript en esta carpeta
(`pasar.mjs`) y llamadas con datos inventados. Para repetirlo: `node pasar.mjs <repo>` y
después cada script (`simular.mjs`, `extras.mjs`, `demas.mjs`, `irregular.mjs`, `finde.mjs`,
`deuda.mjs`); las salidas quedaron en `salida-*.txt`.

## 0. En corto

1. **La fórmula no es el problema; al revés.** `deudaDeSueno` da 7,5 × lo que falta por noche
   (los 14 pesos suman 7,5). Una regla tipo Rise da 14 ×. Con las mismas noches, Moss diría
   **la mitad** que Rise: las 4 h de Rise serían unas 2 h en Moss («Bien»). Todo lo demás
   (de 2 h a 16 h 30) sale de **cómo se lee cada noche**, o de la necesidad.
2. **Moss le resta 79 minutos fijos a cada noche:** 31 (lo que tardas en dormirte) + 18 (lo
   que tardas en agarrar el teléfono) + 30 (lo despierto adentro). Solas son **9 h 53 de
   deuda** para cualquiera. Rise, con el teléfono solo, cuenta como sueño todo el rato quieto
   (lo dice su ayuda: si te despiertas y no tocas el teléfono, sigue contando sueño).
3. **Con el teléfono quieto 8 h justas, Moss dice «Alta. Unas 10 h».** Para «sin deuda» tiene
   que estar quieto 9 h 19 cada noche. Las 16 h 30 equivalen a 7 h 07 quieto.
4. **Moss casi no ve cuando duermes de más.** Si te levantas más tarde que «lo de siempre», te
   cree como mucho **47 minutos**, te levantes una hora o cuatro más tarde; si te acuestas
   antes, como mucho 22. Lo corto, en cambio, lo cuenta entero. Y «lo de siempre» se arma con
   las noches que estimó Moss. Con un horario que se corre ±1 h de un día a otro, eso resta
   otros 23 min por noche (2 h 30 más de deuda); con ±1 h 30, 39 min (unas 3 h más).
5. **El final de la noche se corta con el primer toque.** Apagar la alarma, o mirar la hora, y
   seguir durmiendo menos de 90 minutos termina la noche ahí: dormir de 00:45 a 8:30 con la
   alarma a las 7:30 da «dormido 5 h 41» y **17 h 23 de deuda**, con confianza alta.
6. **La necesidad no se aprende:** 8 h por la edad, o lo que se elija en Perfil › Avisos.
   Media hora son 3 h 45 de deuda. La de Rise es propia de cada persona.
7. **Cuál de los puntos 4 y 5 es el del dueño no se sabe desde el código**, y se mira en el
   teléfono en dos minutos (sección 8). Los dos explican también el aviso del 16/11: el
   despertar de siempre de Moss queda antes que el real.

De las 16 h 30, suponiendo que Rise usa 8 h de necesidad y cuenta la ventana quieta entera:

| Parte | Por noche | En la deuda de Moss |
|---|---|---|
| Lo que falta de verdad (lo que Rise llama 4 h) | 17 min | 2 h 09 |
| Las tres restas fijas (31 + 18 + 30) | 79 min | 9 h 53 |
| Las noches que Moss lee más cortas que Rise: lo de siempre, que recorta las largas, y el corte de la mañana. O una necesidad menor en Rise | 36 min | unas 4 h 30 |
| Total | 132 min | 16 h 30 |

Si la necesidad de Rise fuera 7 h 30, la tercera fila casi desaparece (6 min).

## 1. Cómo se arma hoy una noche sin reloj

**Cuándo:** al abrir Moss y al volver (`actualizarSalud`, `src/almacen/index.ts:198`) y en la
tarea de fondo si Salud se pudo leer (`src/fondo/tarea.ts:48`). Solo la noche de hoy
(`estimarAnoche`, `src/salud/nocheSinReloj.ts:40`): la que no se estimó ese día no se estima
después. No estima si Salud ya tiene una noche de ese día, de cualquier fuente (línea 45);
con un reloj o un anillo en las últimas dos semanas espera hasta las 14 (46–47); no pisa lo
confirmado o corregido (49).

**Las señales** (`nocheSinReloj.ts:53-62`), todas como «actividad»: estabas despierto.

| Señal | De dónde | Cómo cuenta |
|---|---|---|
| Pasos | Salud, las últimas 30 h, **de todas las fuentes** (`src/salud/leer.ts:80`) | Una muestra de 10 min o menos, entera; más larga, su principio y su final, lo que tardan esos pasos (`actividadDeLosPasos`, `sinReloj.ts:581`) |
| Movimiento del teléfono | `CMMotionActivity` (`modules/movimiento`), desde las 12 de ayer | Caminar, correr, bici o auto con confianza media o alta, todo el rato; un cambio **sin clasificar** (ni quieto ni nada), 5 minutos, con cualquier confianza (`actividadDelMovimiento`, `:566`). El Swift no pasa `unknown` |
| Moss abierta | `anotarUso` (`src/almacen/almacen.ts:1245`), 3 días | De abrir a cerrar. No cuenta si iOS la abrió en segundo plano |
| Atajos y despertador | tabla `anclas`, un mes (`src/salud/anclas.ts`) | El cargador es tocar el teléfono (conectarlo de 19 a 4 puede ser lo último del día); «Me voy a dormir» y el enfoque, ancla de dormir; la alarma parada, el despertador de Moss y «Me desperté», ancla de despertar (`deLasSenales`, `:631`) |
| Tu hora de siempre | La mediana de las noches de las últimas dos semanas, que son **las que estimó Moss**; aparte el fin de semana si hay 3 (`habitualDe`, `:423`) | Propone una hora, con más duda |
| Salud «en cama» | — | **No se usa** para estimar; desde iOS 18 el iPhone ya no lo escribe |

**Los pasos de `estimarNoche`** (`src/dominio/sinReloj.ts:232`):

1. Junta la actividad en bloques (separados por menos de 5 min son uno), entre las 12 de ayer
   y las 14 de hoy.
2. **La ventana tranquila:** el hueco entre dos bloques, de 5 a 12 h, que empieza entre las 18
   y las 4 (`VENTANA`). Un bloque de la madrugada no la corta solo si dura 20 min o menos, tiene
   **90 min de silencio de cada lado** y es posterior a tu hora de siempre menos 15 (sin
   historia, las 0:30): `suelto`, línea 217. Entre dos ventanas posibles, la que más se
   encima con lo de siempre, más 120 puntos por empezar o terminar con una señal.
3. **Sin ventana:** de la última actividad antes de las 2 a **la primera después de las 4**,
   si entre las dos hay de 3 a 12 h; confianza 0,40 como mucho (líneas 261-269).
4. **Cuándo te dormiste** (`desde()`, `:276`): la última actividad + lo que tardas (31 min de
   fábrica, `LATENCIA`; 18/31 de eso si dejaste el teléfono después de tu hora; lo aprendido o
   lo elegido en «Tardo en dormirme»), con duda 35; y tu hora de siempre, si es posterior, con
   duda 60 (80 con menos de 5 noches). Promedio pesado por 1/duda²: **75 % el teléfono y 25 %
   lo de siempre**. Con el cargador, duda 28; con «Me voy a dormir», 20. Si dejaste el
   teléfono antes de tu hora, la duda del teléfono crece un minuto por minuto. Con 3 respuestas
   o más, baja un 20 %. Límite duro: nunca antes de la última actividad + 5 min.
5. **Cuándo te despertaste** (`:306-320`): la primera actividad − 18 min (`AL_DESPERTAR`;
   desconectar el cargador, hasta 10), con duda 30; y tu hora de siempre, si es anterior, con
   duda 60: **80 % y 20 %**. Si agarraste el teléfono más de 30 min después de lo de siempre,
   la duda crece medio minuto por minuto y lo de siempre pesa más. Un ancla (alarma,
   despertador, «Me desperté») manda sola, salvo que después haya 90 min de silencio. Límite
   duro: nunca después de la primera actividad. Con menos de 2 h de noche, no hay estimación.
6. **La confianza** (`:323-366`): 0,85; −0,15 con menos de 5 noches de historia; −0,2 sin
   pasos ni movimiento; hasta −0,3 si dejaste el teléfono antes; hasta −0,3 si lo agarraste
   tarde; −0,08 por cada uso de noche (hasta 3); −0,1 si la noche dura 2 h más o menos que
   siempre; +0,1 con ancla al despertar; +0,05 con 3 respuestas. Alta desde 0,75, media desde
   0,5.
7. **Lo dormido** (`nocheDeMoss`, `:506`): de dormirte a despertarte **menos 30 min**
   (`DESPIERTO_SIN_RELOJ`, `sueno.ts:409`; con noches de un aparato, su mediana + 15). Se resta
   también de lo que confirmaste, corregiste o escribiste. Una estimada de confianza baja no
   cuenta para la deuda ni el horario; **confirmada, cuenta siempre** (línea 521).
8. **Lo que se aprende** (`aprenderPersonal`, `:442`): de cada «Sí» o corrección, lo que
   tardas en dormirte y en agarrar el teléfono, con contracción hacia 31 y 18. Un «Sí» enseña
   lo que Moss ya suponía, pero **cuenta como respuesta**: con tres, Moss se fía más del
   teléfono (82 % y 86 %) y sube la confianza.

Con todo de fábrica: **dormido = ventana tranquila − 79 min**.

## 2. Dónde subestima: los casos, con números

Todos duermen de verdad de 00:45 a 8:30 (7 h 45 de noche), salvo donde dice. Son 28 noches
iguales; la deuda es la de las últimas 14, con 8 h de necesidad. Las letras son las de los
scripts.

| Caso | Moss: de – a | «Dormido» | Contra 7 h 45 | Confianza | Deuda |
|---|---|---|---|---|---|
| (a) Lo deja 00:30, lo agarra 8:30 | 01:01 – 08:12 | 6 h 41 | −64 min | alta | **9 h 53** · «Alta» |
| (b) Igual, y mira la hora a las 5:10 | 01:01 – 08:12 | 6 h 41 | −64 | alta (0,77) | 9 h 53: el toque queda como interrupción y no cambia nada |
| (c) Lo usa en la cama hasta 00:43, y iOS lo ve | 01:14 – 08:12 | 6 h 28 | −77 | alta | **11 h 30** |
| (m) Lo usa en la cama, pero iOS lo da quieto: lo último son los pasos, 00:05 | 00:36 – 08:12 | 7 h 06 | −39 | alta | 6 h 45 · «Algo alta» |
| (d1) Apaga la alarma 7:30 y duerme hasta 8:30, sin Atajo | 01:01 – **07:12** | 5 h 41 | −124 | alta | **17 h 23** |
| (d2) Igual, con el despertador de Moss o el Atajo | 01:01 – 07:30 | 5 h 59 | −106 | alta (0,95) | 15 h 08 |
| (d3) Pospone 7:30, 7:39, 7:48 y se levanta 8:00 | 01:01 – 07:12 | 5 h 41 | −94 (de 7 h 15) | alta | 17 h 23 |
| (e) Cargando en otro cuarto: lo deja 23:15, lo agarra 9:00 | 23:46 – 08:42 | 8 h 26 | **+41** | alta | 0 · «Muy bien» |
| (f) Como (a), y lo mira a las 7:20 | 01:01 – 07:02 | 5 h 31 | −134 | alta | **18 h 38** |
| (l) Baño 6:50 con el teléfono, y lo mira 7:40 | 01:01 – 06:32 | 5 h 01 | −164 | alta | 22 h 23 |
| (q) Un movimiento «sin clasificar» 6:55 y otro 7:35 | 01:01 – 06:37 | 5 h 06 | −159 | alta | 21 h 45 |
| (h) Dos toques temprano, 1:40 y 2:30 | **03:02** – 08:12 | 4 h 40 | −185 | alta | 25 h 00 |
| (g) Dos toques, 3:00 y 3:50 | 01:01 – 08:12 | 6 h 41 | −64 | **baja** (sin ventana) | No cuenta: «Faltan 5 noches». Con «Sí», 9 h 53 |
| (j) 25 min de teléfono a las 4:00 | 01:01 – **03:42** | 2 h 11 | −334 | baja | No cuenta. Con «Sí» cada mañana, 43 h 38 |
| (k) Dos toques, 4:10 y 5:00 | 01:01 – 03:52 | 2 h 21 | −324 | baja | No cuenta. Con «Sí», 42 h 23 |
| (n) Sin permiso de Movimiento: pasos hasta 23:40, abre Moss 8:35 | 00:11 – 08:17 | 7 h 36 | −9 | alta | 3 h 00 · «Bien» |
| (o) Otra fuente escribe pasos por hora (de 2 a 3 y de 5 a 6) | 01:01 – 04:42 | 3 h 11 | −274 | baja | No cuenta |
| (p) Una app escribe los pasos del día en una sola muestra | **01:31** – 08:12 | 6 h 11 | −94 | alta | 13 h 38 |
| (i) El teléfono «se mueve» cada 70 min | sin estimación | — | — | — | Sin noches |

**Las noches más largas que lo de siempre** (`demas.mjs`; lo de siempre, 01:01–07:12):

| Lo agarra más tarde | Moss le cree | | Lo deja antes | Moss le cree |
|---|---|---|---|---|
| +30 min | 24 min | | −30 min | 18 min |
| +1 h | 38 min | | −1 h | 22 min |
| +1 h 30 | 45 min | | −1 h 30 | 21 min |
| +2 h | 47 min | | −2 h | 19 min |
| +3 h | 44 min | | −3 h | 15 min |
| +4 h | 40 min | | | |

Salen con confianza alta o media: cuentan. Al revés no pasa: acostarse más tarde o levantarse
antes se cuenta entero, porque Moss nunca te da dormido con el teléfono en uso.

**Con un horario irregular** (`irregular.mjs`: el teléfono quieto 8 h en promedio, cada borde
corrido ± d de una noche a otra, cinco series de 120 noches):

| ± de cada borde | Dormido, sin lo de siempre | Dormido, Moss | Deuda media |
|---|---|---|---|
| 0 | 6 h 41 | 6 h 41 | 9 h 53 |
| 20 min | 6 h 41 | 6 h 39 | 10 h 01 |
| 40 min | 6 h 41 | 6 h 32 | 10 h 56 |
| 60 min | 6 h 41 | 6 h 18 | **12 h 20** |
| 90 min | 6 h 32 | 5 h 53 | **13 h 57** |

**Entre semana 00:45–7:30 y el fin de semana 01:45–10:00** (`finde.mjs`): el primer fin de
semana Moss da el despertar a las 8:18 y a las 7:58 (unas dos horas antes); el segundo, 7:58 y
8:59; el tercero, 9:07 y 9:20; recién el cuarto, 9:36. Deuda: 14 h 01, creyendo 6 h 08 por
noche; la noche real promedio es de 7 h 11.

Lo que se ve:

- **El sesgo de base es de una hora** (a): 34 min en los bordes y 30 adentro. Solo sobreestima
  quien deja el teléfono lejos (e) o no dio el permiso de Movimiento (n).
- **El final de la noche** (d1, d3, f, l, q): un toque a menos de 90 min de levantarse termina
  la noche, y sale con **confianza alta**: cuenta, y pasadas las dos primeras semanas ni se
  pregunta. «Lo de siempre» se arma con esas mismas horas y las confirma.
- **Dos toques a menos de 90 min entre sí** rompen la regla de lo suelto: al principio corren
  el dormirse dos horas (h); en el medio dejan la noche sin ventana (g, j, k), y ahí el
  despertar es **la primera actividad después de las 4**, aunque el teléfono quede quieto
  cuatro horas más. Esas salen con confianza baja y no cuentan, salvo con un «Sí».
- **Con «Sí» todas las mañanas** nada mejora: Moss no aprende nada nuevo y sube la confianza.

Cuánto tiene que estar quieto el teléfono (noches iguales, sin toques):

| Quieto | Dormido según Moss | Deuda |
|---|---|---|
| 7 h | 5 h 41 | 17 h 23 · «Alta» |
| 7 h 30 | 6 h 11 | 13 h 38 · «Alta» |
| 8 h | 6 h 41 | 9 h 53 · «Alta» |
| 8 h 30 | 7 h 11 | 6 h 08 · «Algo alta» |
| 9 h | 7 h 41 | 2 h 23 · «Bien» |
| 9 h 30 | 8 h 11 | 0 · «Muy bien» |

## 3. La fórmula de la deuda

`deudaDeSueno` (`src/dominio/sueno.ts:502`): por cada noche que cuenta, `necesidad − (dormido +
siestas)`, con piso de −120 (lo que sobra paga hasta 2 h); pesos de 1 (anoche) a 1/14; el
promedio con pesos de las noches que cuentan, por 7,5; piso 0; hacen falta 5 noches. La
palabra (`juicioDeLaDeuda`, `:537`) sale de lo que falta por noche: menos de 30 min, «Bien»;
de 30 a 60, «Algo alta»; 60 o más, «Alta».

«Tipo Rise» acá es: anoche 15 %, las otras 13 el 85 %, llevado a 14 noches (14 noches iguales
con 1 h de falta dan 14 h). Rise dice que es un total de 14 noches y que no publica la fórmula:
la escala es un supuesto.

| Duerme cada noche | Moss | Tipo Rise |
|---|---|---|
| 7 h 45 | 1 h 53 · «Bien» | 3 h 30 |
| 7 h 30 | 3 h 45 · «Algo alta» | 7 h |
| 7 h | **7 h 30 · «Alta»** | 14 h |
| 6 h 30 | **11 h 15 · «Alta»** | 21 h |
| 6 h | **15 h · «Alta»** | 28 h |
| 5 h 48 | 16 h 30 · «Alta» | 30 h 48 |

- **Una noche mal leída** suma su error por su peso. Duerme 7 h y una noche se lee de 3 h: si
  es anoche, de 7 h 30 a **11 h 30** (+4 h); hace una semana, 9 h 30 (+2 h); hace 13 noches,
  7 h 47. Baja unos 17 min por día. En tipo Rise, anoche pesa el doble: +8 h 24.
- **Con pocas noches pesa más:** si solo cuentan las últimas 5, anoche mal leída suma 7 h (de
  7 h 30 a 14 h 30).
- **Las que faltan y las de confianza baja** salen de la cuenta y el promedio se reparte entre
  las demás: con 14, con 7 o con 5 noches iguales da lo mismo (9 h 53 en el caso a). Con 4, no
  hay deuda. En las barras se leen «sin datos: no suma ni resta» y «poco segura: no cuenta».
- **Pero no salen al azar:** las largas son las que más bajan de confianza (agarraste tarde,
  distinta de lo de siempre). Entre semana 5 h 41 y fin de semana 8 h: con todas, 11 h 25; si
  las del fin de semana quedan con confianza baja, **17 h 23**.
- **La necesidad:** con las mismas noches (6 h 41), 7 h 30 dan 6 h 08; 8 h, 9 h 53; 8 h 30,
  13 h 38. Cada media hora, 3 h 45.

**Qué parte de las 16 h 30 es la fórmula:** ninguna. Con las noches como las lee Rise, la
fórmula de Moss daría unas 2 h. Con las noches como las lee Moss, una regla tipo Rise daría
30 h 48. El resto está repartido en la tabla del principio.

## 4. La necesidad

- `necesidad(edad, elegida)` (`sueno.ts:388`): 8 h de 18 a 64 años, 7 h 30 desde los 65, 9 h
  antes de los 18. Se elige en Perfil › Avisos › «Necesito dormir», de 7 a 9 h de a media hora
  (`necesidadesPara`; `Perfil.tsx:920-927`; `ponerNecesidad`; queda en el teléfono).
- **No aprende nada del historial.** Lo único que Moss aprende del sueño es lo que tardas en
  dormirte y en agarrar el teléfono, tu hora de siempre y, con un aparato, lo despierto.
  «Descubrir lo que necesitas» está propuesto (D4 de `spec/estudio/sueno.md`, y en
  `spec/lo-que-te-toca.md`), sin código.
- La tarjeta de la deuda no deja cambiarla: solo dice «Necesitas 8 h» en la leyenda de las
  barras, al desplegar.

## 5. Lo que muestra la pantalla y de qué clave sale

**La tarjeta** (`src/secciones/sueno/Deuda.tsx`, `LaDeuda`), de arriba abajo:

| Lo que se lee | Clave | Texto de hoy |
|---|---|---|
| Título | `sueno.deuda` | Deuda de sueño |
| La palabra | `sueno.juicio.titulo.muyBien` / `.bien` / `.algoAlta` / `.alta` | Muy bien / Bien / Algo alta / Alta |
| Debajo | `sueno.juicio.texto.muyBien` | Sin deuda: duermes lo que necesitas. |
| | `sueno.juicio.texto.bien` | Unas {t}: está en un rango normal. |
| | `sueno.juicio.texto.algoAlta` | Unas {t}: te falta un poco de sueño cada noche. |
| | `sueno.juicio.texto.alta` | Unas {t}: hace días que duermes bastante menos de lo que necesitas, y puede que no lo notes. |
| El medidor | `sueno.graficos.sinFaltar`, `sueno.graficos.medidorFin.uno` / `.otros` | sin deuda · una noche ({t}) / {n} noches ({t}) |
| La línea | `sueno.estaNoche.linea` | Esta noche, a la cama a las {hora}. |
| El botón | `sueno.deudaVer.mas` / `.menos` | Más / Menos |
| Con pocas noches | `sueno.vacio.faltan.uno` / `.otros`, `sueno.vacio.paraSaber`, `sueno.vacio.deuda`, `sueno.pocoSegurasNoCuentan` | Falta(n) {n} noche(s) · para saber tu deuda · Con {minimo} noches de las últimas 14, Moss calcula cuánto sueño te falta. · Las noches poco seguras no cuentan. |

Al desplegar:

| Lo que se lee | Clave | Texto de hoy |
|---|---|---|
| La leyenda | `sueno.graficos.deMenos`, `.deMas`, `.necesitas` | De menos · De más · Necesitas {t} |
| Cada barra | `sueno.graficos.menos`, `.mas`, `.justo`, `.sinDatos`, `.noCuenta` | {t} menos · {t} más · justo lo que necesitas · sin datos: no suma ni resta · poco segura: no cuenta |
| Las notas | `sueno.graficos.alDia`, `sueno.deudaNoches`, `sueno.deudaPorNoche` | Vienes durmiendo lo que necesitas. · Con {n} de las últimas {de} noches · Duermes unas {duermes} por noche; necesitas unas {necesidad}. |
| Esta noche | `sueno.estaNoche.titulo`, `.cama`, `.camaTexto` | Esta noche · A la cama a las {hora} · Para despertarte a las {despertar} habiendo dormido unas {horas}. |
| | `sueno.estaNoche.pago`, `.tope` | Son unos {min} min más de lo que necesitas, para ir bajando la deuda: se baja de a poco, no de una vez. · Moss la adelanta como mucho una hora de lo de siempre: el cuerpo no se duerme mucho antes de su hora. |
| | `sueno.estaNoche.comida`, `.comidaTexto` | Última comida grande, antes de las {hora} · Dos horas antes de acostarte; después, algo ligero. |
| Cómo se calcula | `sueno.deudaTexto` | Lo que te faltó para lo que necesitas cada noche de las últimas dos semanas, pesando más las más recientes, menos lo que dormiste de más (hasta 2 horas por noche). Las siestas cuentan. Se calcula con las noches que tienen datos: las que faltan no la bajan. Es aproximada: depende sobre todo de cuánto necesitas dormir. |

En `es.json` y sin uso en la app: `sueno.sinDeuda`, `sueno.deudaDe`, `sueno.deudaAprox`,
`sueno.faltanNoches` y `sueno.estaNoche.comidaReflujo` (esta, solo en la galería).

**«Esta noche»** sale de `estaNoche` (`Deuda.tsx:109`) → `horasDeSueno` y `horaDeDormir`
(`src/dominio/avisos.ts:275` y `:261`): el despertar de siempre de mañana − necesidad − 30 min
despierto − un tercio de la deuda (hasta 30), nunca más de una hora antes de la hora de siempre
de dormirte; a la cama, eso menos lo que tardas. En el caso (a) da «a la cama a las 23:30» a
alguien que se acuesta a las 00:30.

**La noche de Moss** (`LaNoche.tsx`, `LaNocheDeMoss`): `sueno.dormidoAprox` (dormido, aprox.),
`sueno.rango`, `sueno.seguridad.alta` / `.media` / `.baja` (Bastante segura / Más o menos segura
/ Poco segura), `sueno.origen.*`, `sueno.estimadaTexto`, `sueno.sinRelojDespierto`,
`sueno.sinRelojEtapas`, `sueno.cambiarHora`.

**La pregunta de la mañana** (`Manana.tsx`): `sueno.manana.hora` (¿Dormiste de {desde} a
{hasta}?), `.horaNota` (Lo estimó el teléfono. {seguridad}.), `.si`, `.otraHora`,
`.horaDormirse`, `.horaDormirseNota`, `.sinProponer`, `.sinProponerDormirse`, `.teDormiste`,
`.teDespertaste`, `.guardar`, y «Cómo llegó Moss a esta hora», `sueno.manana.porque.*`.

**La deuda en otros lados:** `inicio.energia.detalle.sueno` (Anoche dormiste {dormido}. Deuda de
sueño: {deuda}.), `inicio.energia.juicioDeuda.*` (sin deuda / baja / algo alta / alta),
`inicio.energia.como.sueno.deuda` (Con deuda), `inicio.energia.razon.sueno.*`,
`inicio.energia.consejo.dormir` y `.dormirDeuda`, `ascent.rendimiento.motivos.deuda` y
`ascent.diagnostico.consejos.deuda` («…recuperar una hora lleva unos cuatro días»: la cita que
`spec/estudio/sueno.md` dio por mal leída sigue en el texto).

**Los avisos de la noche y de la deuda:**

| Aviso | Clave | Texto de hoy |
|---|---|---|
| Dormir (rota) | `recordatorios.dormirTextos.enUnRato` | Ve preparándote: a la cama en {tiempo}. |
| | `.estaNoche` | Esta noche, a la cama a las {hora}. |
| | `.luces` | Baja las luces: a la cama en {tiempo}. |
| | `.paraDespertar` | Para despertarte a las {despertar}, a la cama a las {hora}. |
| | `.enTiempo` | En {tiempo} te toca acostarte. |
| | `.pantallas` | Ve dejando el teléfono: a las {hora}, a la cama. |
| | `.aLaHora` | A las {hora} te toca ir a la cama. |
| | `.duermes` | A la cama a las {hora} y duermes {horas}. |
| | `.bajaElRitmo` | Empieza a bajar el ritmo: a las {hora}, a la cama. |
| | `.deuda` | Para bajar tu deuda de sueño: a la cama a las {hora} y te despiertas a las {despertar}. |
| | `recordatorios.dormirEn.15` / `.30` / `.45` / `.60` | 15 minutos / media hora / 45 minutos / una hora |
| El botón y su respuesta | `recordatorios.meVoyADormir`, `recordatorios.buenasNoches` | Me voy a dormir · Buenas noches. Moss anotó la hora. |
| Melatonina | `recordatorios.despertar.melatonina.titulo` / `.texto` | Tu ventana de melatonina · Más o menos ahora empieza a subir tu melatonina: a las {cama}, a la cama. |
| Revoluciones | `recordatorios.despertar.revoluciones.titulo` / `.texto` | Baja las revoluciones · Algo tranquilo y sin pantallas brillantes: a las {cama}, a la cama. |
| Luces | `recordatorios.conviene.luces.titulo` / `.texto` | Baja las luces · Luz tenue y cálida: a las {cama}, a la cama. |
| Descarga | `recordatorios.despertar.descarga.titulo` / `.texto` | Anota lo pendiente · Cinco minutos con lo de mañana en un papel: suele ayudar a dormirse antes. |
| Gafas | `recordatorios.despertar.gafas.titulo` / `.texto` | Las gafas para la luz azul · Si las usas, buen momento: a las {cama}, a la cama. |
| La deuda, al despertar | `recordatorios.despertar.deuda.bajo` / `.subio` / `.igual` / `.es` / `.cero` / `.sin` | Tu deuda de sueño bajó a {deuda}. / …subió a {deuda}. / …sigue en {deuda}. / …es de {deuda}. / …bajó a cero. / No tienes deuda de sueño. |

En Perfil › Avisos: `perfil.avisos.dormir` y `.dormirTexto` / `.dormirSinDatos`, `.tardo`,
`.tardoAprendido`, `.tardoTexto`, `.necesito`, `.necesitoEdad`, `.necesitoTexto` /
`.necesitoTextoMenor`, `.deuda` / `.deudaTexto`, `.melatonina` / `.melatoninaTexto`,
`.revoluciones` / `.revolucionesTexto`, `.luces` / `.lucesTexto`, `.descarga` / `.descargaTexto`,
`.gafas` / `.gafasTexto`, `.tuDia` / `.tuDiaTexto`, `.mas` / `.masTexto`. En los widgets:
`widgets.aDormir`, `widgets.paraDespertar`, `widgets.yaEsHora`, `widgets.anoche`.

**Voseo y rioplatense en `es.json`** (3.235 textos; `rioplatense.mjs`): **no hay voseo**, ni en
los verbos ni en los imperativos. Palabras regionales:

| Clave | Texto | Qué |
|---|---|---|
| `comida.escaner.soloIphone` | Leer la etiqueta **anda** en el iPhone. Puedes **cargar** los valores a mano. | «andar» por funcionar y «cargar» por ingresar: rioplatense |
| `perfil.informacionAscent` | …esto **anda** solo: | ídem |
| `ascent.mejorConectadas` | **Andan** solas, mejor conectadas | ídem |
| `comida.escaner.aMano`, `comida.cargaRapida`, `mas.cargaRapida`, `comida.receta.texto` | **Cargar** a mano · **Carga** rápida · **Carga** los ingredientes… | «cargar» datos |
| `inicio.energia.detalle.hoyTemprano` | Hoy **recién** empieza… | «recién» con verbo |
| `sueno.estimadaTexto` | …lo que tardas en **agarrarlo** | de América; neutro, «tomarlo» |
| `perfil.avisos.masTexto`, `perfil.aparatos.noLlego.pasos` (1 y 4), `perfil.aparatos.directo.soloSalud`, `entreno.porQue.volver`, `entreno.perfil.textoConAvisos` | **prende** los que te sirvan · **prende** la conexión… · deja **prendido** Sueño | «prender» por activar: de América |
| `sueno.estaNoche.pago`, `progreso.controlTexto` | …se baja **de a poco**, no de una vez | rioplatense; neutro, «poco a poco» |
| `sueno.graficos.alDia`, `progreso.plan.comoVienes.*`, `progreso.plan.ajusta` | **Vienes durmiendo**… · cómo **vienes** | «venir» + gerundio, rioplatense |
| `sueno.afinar.cargador.avisoTexto`, `entrada.cuestionario.comer.proteinaCuando.baja`, `perfil.cerrarIgual` | …Moss estima **igual** · **Igual** alcanza… · Cerrar **igual** | «igual» por de todos modos |
| `comida.decir.tamanos.chico`, `ascent.foco.comer.snack`, `entreno.ayunasLarga` | **Chico** · Algo **chico** antes de entrenar | de América; neutro, «pequeño» |
| `comida.tePasarias`, `comida.deMasKcal`, `inicio.deMas` | …kcal **arriba de** la meta | neutro, «por encima de» |
| `mas.mantenerParaQuitar`, `habitos.mantener` | Mantén **apretado**… | de América; neutro, «presionado» |
| `habitos.sugeridos.avisos` | Lo cambias o lo **sacas** en el hábito. | «sacar» por quitar |
| `entrada.intro.base.busca`, `.filas[0]` | palta · Palta o aguacate | a propósito: muestra los nombres regionales |
| `entrada.cuestionario.entreno.tipos.equipo[1]` | …básquetbol, hockey, **vóley**… | rioplatense; neutro, «voleibol» |

«Pesada» (cada vez que te pesas, 30 textos) y «balanza» son de América, no solo de acá: quedan
a criterio.

## 6. Con un reloj o un anillo

- **Qué usa** (`armarNoches`, `sueno.ts:240`; `leerSalud`, `src/salud/leer.ts`): las muestras de
  sueño de Salud (dormido, núcleo, profundo, REM, despierto, en cama) de las últimas cuatro
  semanas. De ahí: cuánto dormiste, cuándo, lo despierto adentro y los despertares de 5 min o
  más, las etapas (se muestran; no entran en la calidad), las siestas (cuentan en la deuda) y
  el tiempo en cama si alguien lo escribió. De la noche, de las últimas tres semanas: la
  frecuencia cardíaca, la variabilidad SDNN y la respiración mientras dormías, y la frecuencia
  en reposo del día.
- **Cómo elige** (`prioridad`, `:207`; `NIVEL_DE_LA_MARCA`, `:197`): una fuente por noche. La
  elegida en Perfil › Aparatos; si no, por marca: Apple Watch 91, Oura 90, Google o Fitbit 80,
  WHOOP 70, Polar 60, Garmin y Withings 50, los demás aparatos y anillos 40, las apps del
  teléfono 30, lo anotado a mano 20; tener etapas desempata. Dos fuentes son el mismo sueño si
  se enciman la mitad o sus bordes difieren 90 min o menos. La marca se reconoce por el nombre
  o el identificador de la app que escribe (`marcaDe`, `:185`; Da Rings entra como «anillo»).
- **La confianza** (`confianzaDe`, `:282`): duración «alta» desde nivel 60, «media» de 40 a 59,
  «baja» debajo. Solo lo que no es «baja» cuenta en la deuda, el horario y la calidad.
- **Moss entra al final** (`conNochesDeMoss`, `sinReloj.ts:545`): solo donde Salud no tiene
  nada, salvo que lo de Salud esté anotado a mano y la de Moss esté confirmada.
- **Dos cosas que no cierran:**
  - Una **app del teléfono** que escriba sueño en Salud (nivel 30) queda con confianza baja:
    **no cuenta en la deuda y además impide que Moss estime esa noche**
    (`nocheSinReloj.ts:45`). Conviene mirar si Rise tiene permiso de escribir Sueño en Salud.
  - Un anillo sin validar (nivel 40, «media») le gana a la estimación de Moss y cuenta entero,
    lea lo que lea.
- **El cartel de hoy:** `sueno.fuentesSinReloj` («Con un reloj o un anillo, Moss mide en vez de
  estimar. Qué llega de cada uno está en Perfil › Aparatos.»), al pie de «De dónde sale cada
  dato»; `sueno.sinRelojEtapas`; `sueno.vacio.vitalesSinReloj`; `inicio.todo.faltaItems.reloj`;
  `perfil.aparatos.arriba` y `perfil.aparatos.marcas.iphone.texto`; `ascent.rendimiento.sinReloj`.
  La precisión, `sueno.precision.niveles`: sin reloj es 1 de 5, «Estimada con el teléfono».
  «Afinar» se muestra solo sin noches de aparato en dos semanas (`Sueno.tsx:263`).

## 7. Arreglos, del que más cambia el número al que menos

Sin implementar. Entre paréntesis, cuánto mueve las 16 h 30. Todo es JavaScript (sale por OTA)
salvo donde dice build. El orden del 2 y el 3 depende de cuál sea el caso del dueño.

1. **Las tres restas fijas** (hasta −9 h 53, seguro).
   - `DESPIERTO_SIN_RELOJ = 30` (`src/dominio/sueno.ts:409`; se aplica en `nocheDeMoss`,
     `sinReloj.ts:517`). Sin reloj no se mide: es una constante que le suma 3 h 45 a todos, y
     también a la hora que la persona escribió. Rise no la resta. No restarla en las noches
     del teléfono, o al menos no en las confirmadas. Es la única que cambia las 14 noches en
     el acto.
   - `LATENCIA = 31` (`sinReloj.ts:95`; `desde()`, `:276`). Es lo de Sahha para la última
     actividad de cualquier tipo. Cuando lo último fue **mover el teléfono**, falta menos para
     dormirse que cuando fueron los pasos hasta la cama: que dependa del tipo del último
     bloque, que ya se sabe (`tipos`). De 31 a 15, −2 h.
   - `AL_DESPERTAR = 18` (`:90`; `primera`, `:313`). Lo mismo a la mañana. De 18 a 5, −1 h 38.
2. **El final de la noche** (`ventanas` y `suelto`, `sinReloj.ts:212-226`; `alDespertar`,
   `:306`) (de −5 a −12 h si es el caso: d1, f, l, q). Que un toque corto seguido de media
   hora quieta no termine la noche: el despertar es la primera actividad **que sigue**. Lo
   mismo con la alarma parada: si después el teléfono queda quieto, no es el despertar, o se
   pregunta.
3. **Lo de siempre recorta las noches largas** (`desde()`, `:285-288`; `deMas` y
   `paraDespertar`, `:312-317`; `CRECE`, `:114`; `habitualDe`, `:423`) (−2 h 30 a −3 h con un
   horario irregular, seguro en alguna medida). Con el teléfono quieto hasta el final, que lo de siempre no adelante
   el despertar más que un tope chico, y que la duda no crezca sin límite: hoy dormir tres
   horas más suma menos que dormir dos. Y que lo de siempre no se arme solo con lo estimado.
4. **Rehacer las noches guardadas** (`estimarAnoche`, `src/salud/nocheSinReloj.ts`; `noches`
   del almacén). Las horas de cada noche quedan guardadas: sin esto, cualquier arreglo tarda
   dos semanas en verse. Las estimadas, y las confirmadas sin cambiar, tienen guardada la
   ventana (`hora.estimada.quieto`) y se pueden recalcular. El corte de la mañana, solo en las
   últimas 7 noches: es lo que iOS guarda del movimiento.
5. **La necesidad a la vista** (`Deuda.tsx`; `necesidad`, `sueno.ts:388`) (3 h 45 cada media
   hora). Decir junto a la deuda contra cuánto se compara, con un toque para cambiarla, y
   proponer una a partir del historial (D4 de `spec/estudio/sueno.md`).
6. **Sin ventana** (`estimarNoche`, `sinReloj.ts:261-269`). Toma la primera actividad después
   de las 4 como despertar. Tendría que tomar el final del último rato quieto largo, y no
   proponer una noche de 2 h 41 con cuatro horas quietas después. Hoy solo cuenta con un
   «Sí»: una sola confirmada suma 4 o 5 h.
7. **El «Sí» de un toque** (`Manana.tsx:186`; `nocheDeMoss`, `sinReloj.ts:521`;
   `aprenderPersonal`, `:467`). Con confianza baja, que no haya «Sí»: que abra las dos horas.
   Y que un «Sí» no cuente como respuesta para fiarse más (`noches`, `conRespuestas`,
   `p += 0,05`): no trae información nueva.
8. **Dos toques al principio de la noche** (`ventanas`, `:212`; el caso h, 25 h). Lo suelto
   exige 90 min de silencio de cada lado: dos toques seguidos corren el dormirse. Permitir
   varias interrupciones cortas seguidas.
9. **Los pasos de otras fuentes** (`leerSalud`, `src/salud/leer.ts:80`; `pasosDe`,
   `convertir.ts:87`). Se leen todas las muestras de pasos, sin mirar quién las escribió. Un
   anillo o una app que escriba pasos por hora o por día deja «actividad» en plena noche
   (casos o y p). Quedarse con las del iPhone (`productType`). Para el dueño depende de si Da
   Rings escribe pasos en Salud.
10. **El movimiento sin clasificar** (`actividadDelMovimiento`, `sinReloj.ts:566`;
    `MovimientoModule.swift:44`). Cualquier cambio que no sea «quieto» son 5 min de actividad,
    con cualquier confianza, y el Swift no pasa `unknown` (lo que iOS da al reiniciarse o
    cuando no sabe). Pasarlo es build; ignorar los aislados de confianza baja, OTA. Hay que
    mirar una noche de verdad antes de decidir.
11. **Las noches largas fuera de la cuenta** (`deudaDeSueno`, `sueno.ts:511`; la confianza,
    `sinReloj.ts:333-351`). Las de confianza baja no cuentan, y son sobre todo las largas. Que
    cuenten con medio peso (D2 del estudio), o que no bajen de confianza por durar más.
12. **Las apps del teléfono en Salud** (`nocheSinReloj.ts:45`; `confianzaDe`, `sueno.ts:282`).
    Que una noche de confianza baja de Salud no impida la estimación de Moss.
13. **La palabra y el número** (`juicioDeLaDeuda`, `sueno.ts:537`; `Deuda.tsx:173-175`). Con
    noches del teléfono, cada borde tiene ±40 min: decir un rango, y «Alta» solo si lo es
    también con el margen a favor. «Hace días que duermes bastante menos…» afirma lo que es
    una estimación.
14. **La alarma como despertar del día** (`despertarDelDia`, `sigueElDespertar.ts:199`). Parar
    la alarma o abrir Moss y seguir durmiendo arranca los avisos de la mañana. Va con el 2.
15. **Las siestas** no se estiman sin reloj (`nocheDeMoss`, `siestas: 0`): quien duerme siesta
    tiene deuda de más. Poder anotarla.
16. **Ver por qué** (`PorQueLaHora.tsx`; `useComoLlego`, `nocheSinReloj.ts:32`). Las señales de
    cada noche solo se ven en la pregunta de esa mañana y no se guardan. Guardarlas con la
    noche y mostrarlas en cada una: sin eso no se sabe cuál de estos casos es el de cada
    persona.

Sin tocar código, hoy: en Perfil › Avisos, «Tardo en dormirme» en 5 o 10 min achica la primera
resta de las noches que vienen, y «Necesito dormir» en 7 h 30 baja la deuda 3 h 45 en el acto.

## 8. Lo que no se pudo saber desde el código

No hay datos del dueño en el repo. Para saber cuál es su caso:

1. **Tres o cuatro noches, Moss contra Rise:** la hora de dormirse y la de despertarse. Si
   Moss da el despertar una hora antes, es el corte de la mañana (arreglo 2) o lo de siempre
   (arreglo 3: pasa las mañanas que se levanta tarde); si las dos horas coinciden a media
   hora, son las restas (arreglo 1).
2. **La necesidad que usa Rise** (en su perfil). Si no es 8 h, parte de la diferencia es eso.
3. **En cada noche de Moss:** si dice «Estimada» o «Confirmada», y en «De dónde sale cada
   dato», si la duración es «Estimada por Moss» o lleva el nombre del anillo.
4. **Salud › Pasos › Fuentes de datos:** si Da Rings u otra app escribe pasos, y cómo son las
   muestras de la madrugada.
5. **Salud › Sueño › Fuentes de datos:** si Rise o el anillo escriben sueño.
6. **Perfil › Avisos › «Tardo en dormirme»:** qué número aprendió Moss.

Supuestos de este informe: que Rise suma sobre 14 noches (lo dice, sin publicar la fórmula) y
que, con el teléfono solo, cuenta como sueño el rato quieto (lo dice su ayuda; hay una copia en
`crudo/ayuda.txt`, que bajó otro análisis en esta misma carpeta). Las dudas y la confianza de
`sinReloj.ts` son, según la propia spec, propuestas sin calibrar contra un reloj.
