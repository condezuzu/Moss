# El vínculo con Ascent: qué funciona y qué no (26/11/2026)

Lo pediste el 26/11: un informe de por qué funciona y por qué no lo que hacemos, sobre todo el vínculo con Ascent («la
fatiga no siento que sea tan exacta»), para vos y para explicárselo a la gente; un lugar que explique por qué bajaste o
no subes en un ejercicio y qué cambiar; y alguna forma de calificar el entrenamiento, por ejemplo si te sobrefatigaste.

**El informe para leer y compartir:** https://claude.ai/artifact/ACnkHK4EjUC5PqkTarHE1N (privado hasta que lo
compartas). Este archivo es la versión del repo: lo que se encontró, lo que se arregló y lo que queda.

Cómo se hizo: un agente leyó el código y la spec de todo lo que Moss hace con Ascent (con archivo y línea, y contra
`estudio/ascent.md` y `estudio/musculos-recuperacion.md`); otro buscó la evidencia nueva (unas 100 fuentes, abiertas en
PubMed, PMC y las páginas de las apps, sin citar de memoria).

## La respuesta corta

1. **Lo sólido es el sueño:** con 6 h o menos, la fuerza máxima casi no cambia y las repeticiones bajan un 9,85 %
   (Craven 2022, 77 estudios). «Sin ir al fallo» después de una noche corta se sostiene.
2. **También lo que se cuenta:** las series por músculo y por semana (Pelland 2026) y la tendencia de 12 semanas con su
   margen (Grgic 2020: el 1RM varía un 3,3 % por día; Latella 2020: se sube ~1 % por mes).
3. **La fatiga por músculo es una estimación gruesa, y nadie la mide exacta.** No hay ningún modelo validado contra el
   rendimiento de una persona: el de estado físico y fatiga (Banister) cambia sus constantes hasta un 42 % entre
   remuestreos (Hellard 2006) y no predice mejor con la parte de fatiga (Marchal 2025); la recuperación varía muchísimo
   entre personas (Sayers 2001: el 21 % de 192 tardó mucho más; Hubal 2005: de 0 a +250 % de fuerza ganada); lo que
   queda de fatiga a las 48 h (0 a 3 %, Refalo 2023) es menos que el ruido de un día. En grupo se sabe la dirección;
   en una persona, ±1 día como mínimo.
4. **Calificar una sesión con un puntaje no tiene respaldo en ninguna app** (WHOOP, Garmin, RP, Juggernaut, Fitbod:
   ninguna con validación publicada; Fitbod pone 100 % a los 7 días por cómo funciona su cuenta). Sí se puede comparar
   la sesión con tu tendencia y decir lo que se sale de lo normal.

## Lo que se encontró en la app (y se arregló el 26/11)

- **Dos cuentas de fatiga que se contradecían.** El titular de hoy («Lo que entrenas hoy sigue cansado», «Entrena como
  siempre»), la energía y la tarjeta de Sueño usaban `residual()` (`musculos.ts`: caída del 30 %, τ de 18 y 36 h, ×1,5
  al novato, sin el RIR), refutada en `musculos-recuperacion.md` 2.3-2.4. Tus músculos usaba la de días
  (`puntajeMuscular.ts`, la de Ascent). Con 8 series de sentadilla a 2 de la reserva ayer, el titular decía «sigue
  cansado» y la sección, listo. **Arreglado:** el titular usa la cuenta en días (`fatigaEnDias` en
  `src/secciones/ascent/vista.ts`), con su test (`vista.test.ts`). `residual()` queda solo en la galería vieja.
- **Con Ascent, la energía creía que entrenabas todos los días** (`entrenaHoy: !!ascent`): «todo a favor para entrenar»
  también el día de descanso o después de entrenar. **Arreglado** en `src/secciones/sueno/datosDeEnergia.ts`.
- **«Una serie menos» con un solo día de fatiga,** mientras el titular decía «como siempre». **Arreglado:** las
  sugerencias piden más liviano solo con el músculo cargado (2 días o más), como decía `sugerencias-de-hoy.md` E6. En
  Ascent, `sugerenciasDeHoy.ts` es el mismo; si Ascent arma la lista de fatigados como antes Moss, conviene el mismo
  cambio allá.

## Lo que sigue débil (no se tocó)

- **Sin «Registrar RIR» en Ascent, la fatiga es una constante:** todo músculo entrenado queda 2 días. Con el RIR, la
  cuenta sigue lo que hiciste. Es lo que más mejora la fatiga sin código nuevo: **prenderlo en Ascent**.
- La franja de 10 a 20 series y la nota de la rutina: convención. Sin RIR, toda serie de trabajo cuenta como dura.
- «Próxima vez» nunca dice «baja». Las metas de fuerza proyectan con 3 sesiones. Las calorías según el día no las revisó
  ningún estudio; la proteína extra hasta 2,2 g/kg es inofensiva (Morton 2018).
- «¿Cómo te sientes para entrenar?»: el campo existe (`siente`) pero ninguna pantalla lo escribe (D2 del 5/11, abierta).
  Con un toque, sigue a cada persona bastante bien (Tolusso 2022: r 0,80-0,84), aunque puede ir distinto de la fuerza
  (Flatt 2019).
- Código muerto del modelo viejo: `recuperado()`, `rendimientoEsperado`, la probabilidad de marca, `diagnostico.ts` y el
  aviso «Recuperación: {pct} %» (`loQueConviene.ts`, nunca suena). Y textos refutados sin usar en `es.json`
  (`ascent.recuperacion.*`, `ascent.rendimiento.*`, `ascent.marca.probabilidad`).

## Lo nuevo, para aprobar en la galería

La cuenta está en `src/dominio/tuSesion.ts`, con sus tests; la galería la usa tal cual.

**Por qué bajaste y qué cambiar** (`bajadaDeFuerza`):
- «Bajó» si el promedio de las últimas 4 sesiones de un ejercicio queda más de un 4 % por debajo del de las 8 de antes
  (con 3,3 % de ruido por sesión, unas dos veces el error de la diferencia). Sin 12 sesiones, no se dice nada.
- Aparte: si la mejor serie cambió de rango de repeticiones (3 o más; el 1RM estimado se mueve aunque la fuerza no:
  Reynolds 2006) y si hubo una pausa de 14 días o más (Bosquet 2013; la fuerza se mantiene unas 4 semanas, Mujika 2001).
- Las razones, con `razonesDeEstancamiento` (la misma de Ascent) sobre las semanas de antes y las de ahora
  (`semanasDeLaBajada`): series, frecuencia, pesadas, bajar rápido, proteína y sueño, como «puede influir».
- Qué cambiar, con lo que respaldan las guías (ACSM 2026; Pelland 2026; Lopez 2021): más series si son pocas, más
  frecuencia y carga pesada para la fuerza; el fallo no hace falta (Grgic 2022). La descarga tiene evidencia débil
  (Coleman 2024: una semana sin entrenar dejó menos fuerza) y el sobreentrenamiento es raro y no se diagnostica con una
  app (Meeusen 2013).

**Cómo fue tu sesión** (`comoFueLaSesion`), en una palabra y sin puntaje:
- **Floja:** la mitad o más de los ejercicios comparables, más de un 6 % por debajo de la mediana de tus últimas 6
  sesiones (3 como mínimo). Con la noche corta, se dice que es esperable.
- **Dura:** un músculo con más de 10 series en el día (Remmert 2025, preprint: pasadas ~11, cada serie suma poco), o un
  ejercicio en que las repeticiones cayeron un 45 % o más con el mismo peso en 3 series o más, o con 2 series a 0 de
  reserva (Refalo 2023: al fallo caen 51-59 %; a 1 de reserva, 37-43 %). Eso pide uno o dos días más (Morán-Navarro
  2017).
- **Buena:** algún ejercicio más de un 6 % arriba y ninguno abajo. **Como siempre:** lo demás.
- No dice «te sobrefatigaste»: no hay un umbral validado. Lo dice como «probablemente».

## Para decidir

1. Prender «Registrar RIR» en Ascent de fábrica (o pedirlo al vincular).
2. «¿Cómo te sientes para entrenar?», de 1 a 10, antes de entrenar (un toque; D2 del 5/11).
3. Un 1 a 10 de cuánto costó la sesión, después de entrenar (sRPE: Foster 2001; Haddad 2017). Sumaría lo que hoy falta
   sin el RIR, pero no dice si estás recuperado.
4. Borrar el código y los textos del modelo viejo.

## Fuentes

Las del informe (25, con enlace) y las del agente de evidencia (99, en el chat del 26/11). Las principales: Craven 2022,
Kong 2025, Grgic 2020 y 2022, Latella 2020, Pelland 2026, Schoenfeld 2017, ACSM 2026 (Currier), Morton 2018, Murphy y
Koehler 2022, Garthe 2011, Hellard 2006, Marchal 2025, Sayers y Clarkson 2001, Hubal 2005, Refalo 2023, Morán-Navarro
2017, Tolusso 2022, Flatt 2019, Doherty 2025, Remmert 2025 (preprint), Bosquet 2013, Mujika 2001, Meeusen 2013, Coleman
2024, Foster 2001, Reynolds 2006. Las de la «U invertida» de volumen (Barbalho 2019 y 2020) están retractadas: no
sirven para sostener un techo.
