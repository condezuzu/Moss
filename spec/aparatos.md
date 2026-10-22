# Relojes y anillos

Lo pediste el 22/10/2026: que Moss ande bien solo con el iPhone y mejor con un
reloj o un anillo, con Salud primero, una sola fuente por noche y la precisión a
la vista. Lo investigué marca por marca. Todo se verificó el 22/10/2026 y las
fuentes están al final. Lo marcado «sin confirmar» no lo pude ver en una fuente
primaria.

## En corto

- **En la v1, todo llega desde Salud.** Con una sola integración, en el
  teléfono, sin servidor ni aprobaciones, entran:
  - el Apple Watch, Oura, Garmin y Fitbit (este, desde agosto de 2026);
  - WHOOP y Polar, sin etapas;
  - Withings, RingConn, Ultrahuman, COROS, Amazfit y Xiaomi.

  Samsung y el Pixel Watch no funcionan con iPhone.
- **Ninguna conexión directa en la v1.** Todas piden lo mismo:
  - un servidor con webhooks;
  - guardar tokens y borrar a pedido;
  - aprobaciones con cupos.

  Lo que se pierde no toca la calidad de la v1, que no usa etapas ni
  variabilidad. Son las etapas y la variabilidad de WHOOP, y la variabilidad de
  Oura y de Garmin.
- **Una noche, una fuente:** la más precisa según el orden de abajo, o la que
  elijas. Nunca se suman dos.
- **Se ve en tres lugares:**
  - en Sueño, de dónde sale cada noche y qué tan precisa es;
  - en Perfil, «Aparatos», qué llega de cada uno y qué falta;
  - en la recuperación, el rendimiento y las marcas, que dicen cuándo usan lo
    medido por un aparato.

## Los niveles de precisión

| Nivel | Qué hay | Qué permite |
|---|---|---|
| 0 | Nada | La noche queda en gris |
| 1 | Solo el iPhone | La estimación de Moss (ver «Sin reloj» en [`sueno.md`](sueno.md)): duración y horario aproximados, con su confianza y la pregunta de la mañana |
| 2 | Dormido, sin etapas (WHOOP, Polar, COROS, apps del teléfono) | La duración y el horario. Lo despierto es aproximado: los aparatos encuentran más del 89 % del sueño, pero solo del 18 al 79 % de la vigilia [V1][V4] |
| 3 | Dormido, con etapas (Apple Watch, Oura, Google, Garmin, RingConn) | Además, el hipnograma, como estimación |
| 4 | Además, lo de la noche | Varía por marca (ver abajo) |
| 5 (después de la v1) | Conexión directa | La variabilidad RMSSD, el desvío de la temperatura, el hipnograma de 5 minutos (Oura, Polar) y los eventos de cama (Withings) |

Lo de la noche (nivel 4), por marca:
- **Apple Watch:** la frecuencia, la variabilidad SDNN, la respiración, la
  temperatura y el oxígeno.
- **Oura:** la frecuencia y la respiración.
- **Google:** la frecuencia, la frecuencia en reposo, la respiración y el
  oxígeno.
- **WHOOP:** la frecuencia en reposo, la respiración y el oxígeno.

## Qué escribe cada marca en Salud

| Marca | Sueño | De la noche | No llega | Mañas |
|---|---|---|---|---|
| **Apple Watch** | Etapas y despierto. Siestas desde watchOS 11: de 1 a 3 h, solo dormido o despierto [A1][A3] | Frecuencia (cada ~5 min, quieto), en reposo, variabilidad SDNN (cada ~4 h), respiración. Temperatura de la muñeca (Series 8 o posterior y Ultra) y oxígeno [A2][A4][A13][A19] | El puntaje de sueño y Readiness: no se pueden leer [A18][A16] | Puede escribir la misma noche dos veces, superpuesta [A11]. «Despierto» aparece solo entre dos tramos de sueño [A3] |
| **Oura** | Etapas, inicio y fin [O1] | Frecuencia cada minuto y respiración promedio [O1] | Variabilidad, temperatura, oxígeno y frecuencia en reposo | Pide membresía (Gen3 y Ring 4). Solo pasa los datos si se abre la app de Oura, y nada con el modo de bajo consumo o sin la actualización en segundo plano [O1] |
| **WHOOP** | En cama y dormido, sin etapas [W2][W3] | En reposo, oxígeno y respiración: promedios de la noche, al despertar [W1][W3] | Etapas y variabilidad. WHOOP: «Salud usa SDNN y WHOOP RMSSD» [W1] | A veces llega un día tarde [W12] |
| **Garmin** | Con etapas desde Garmin Connect 4.71 (sin confirmar en 2026) [G2] | Frecuencia y pasos [G3] | Variabilidad y Body Battery [G4] | Solo manda con Garmin Connect abierto [G5] |
| **Fitbit / Google** | Con etapas desde Google Health 5.05, agosto de 2026 [F1][F2] | Frecuencia, en reposo, oxígeno, respiración y temperatura corporal [F1] | Variabilidad y temperatura de la piel: Google solo las lee [F1] | Pide la app Google Health y una cuenta de Google. Antes no escribía nada |
| **Polar** | Solo la duración [P1] | Nada: la frecuencia es solo de los entrenamientos | Etapas, variabilidad, en reposo y oxígeno | «Sincronizar ahora» reenvía dos semanas [P1] |
| **Withings** | Sueño; las etapas, sin confirmar [Wi1] | En reposo, temperatura y oxígeno [Wi1] | La frecuencia del Sleep Analyzer [Wi2] | Las cuentas creadas desde el 12/10/2026 necesitan Withings+ (unos US$10 por mes) [Wi3][Wi7] |
| **RingConn** | Etapas, en cama y despierto [R1] | Frecuencia, en reposo y oxígeno [R1] | La variabilidad: las fuentes se contradicen [R2][R5] | — |
| **Ultrahuman** | Sin confirmar [U5] | Variabilidad (sin decir el método) y temperatura [U1] | — | Su variabilidad no se compara con la del Apple Watch |
| **Amazfit, Xiaomi, Huawei, COROS** | Sueño; el detalle depende del modelo (sin confirmar) [Z1][X1][H1][C1] | Frecuencia | Variabilidad (COROS) | Xiaomi pide apagar el bajo consumo [X1] |
| **Suunto** | No manda sueño (sin confirmar) [Su2] | Frecuencia | Sueño y variabilidad | — |
| **Eight Sleep** | El sueño de la funda [E1] | Sin confirmar [E2] | — | — |
| **Samsung y Pixel Watch** | No funcionan con iPhone [S1][S2][F8] | — | — | — |

## Las conexiones directas, después de la v1

| Marca | Qué agrega a Salud | Lo que pide | Para Moss |
|---|---|---|---|
| **WHOOP** (API v2) [W9][W11] | Etapas (los totales, sin hipnograma), variabilidad RMSSD, recuperación y temperatura de la piel [W7][W8] | Un servidor con webhooks. Cupos con revisión manual: 10, 100, 1.000 y 5.000 usuarios [W4]. 100 pedidos por minuto [W5] | **La primera:** es lo que más falta en Salud |
| **Garmin** (Connect Developer) [G6][G9] | Variabilidad, estrés, respiración y oxígeno [G10], sin depender de que Garmin Connect esté abierto | Startup gratis hasta 1.000 usuarios, con web y política de privacidad. Después, Enterprise: US$1.000 y un cargo por usuario desde el 01/04/2027 [G6]. Un servidor para recibir los datos | **La segunda** |
| **Oura** (API v2) [O3] | Hipnograma cada 5 min, variabilidad RMSSD, temperatura, oxígeno y puntajes [O9][O10] | Hasta 10 usuarios hasta que Oura aprueba, sin plazo [O3][O7]. El acuerdo prohíbe productos que «compitan con o repliquen» los de Oura (4(a)(ix)) y guardar más de lo necesario (3(m)) [O5]. El usuario necesita membresía [O2] | **Solo con un sí por escrito de Oura** sobre esas dos cláusulas |
| **Polar** (AccessLink v3 y v4) [P2][P3] | Hipnograma, Nightly Recharge, variabilidad y temperatura de la piel | Registro sin aprobación [P4]. La licencia no deja competir con Polar (según un extracto de terceros) [P5][P8] | Fácil, pero de prioridad baja |
| **Withings** (Public API) [Wi4] | Los eventos «se acostó», «se durmió», «se despertó» y «se levantó», y la variabilidad [Wi5] | Withings+ para las cuentas nuevas en el plan gratis [Wi3] | Solo si se quiere el «en cama» real del colchón |
| **Fitbit / Google** | Nada que Salud no traiga ya | La Fitbit Web API se apaga el 30/10/2026 [F3]. La Google Health API pide una evaluación de seguridad anual (CASA, US$500 a 4.500) [F7] | **No** |
| **Ultrahuman, Eight Sleep, Suunto, COROS** | — | Solo para socios, o sin API pública [U2][E4][Su1][C2] | No |

Los agregadores (Terra, Junction, Open Wearables) cuestan de US$300 a 499 por
mes, o hay que alojarlos [Ag1][Ag2][Ag3]. Para Oura, el acuerdo exige que Oura
apruebe a cada cliente del agregador [O5]. Quedan para después.

## Una noche, una fuente

### El orden

La calidad de Moss sale de la duración, el horario y la continuidad, no de las
etapas. Por eso el orden va por cómo distingue cada aparato el sueño de la
vigilia: la especificidad contra polisomnografía y cuánto se equivoca en el
total. Las etapas solo desempatan. Cambia la regla anterior, que ponía cualquier
aparato con etapas antes que uno sin etapas: con este orden, WHOOP gana a Garmin.

1. **La que elijas** en Perfil › Aparatos.
2. **Apple Watch u Oura, empatados** [A1][V1][V2][V5][V6][V11]:

   | | Apple Watch | Oura |
   |---|---|---|
   | Especificidad | 52–79 % | 41–75 % |
   | κ en cuatro etapas | 0,53–0,68 | 0,43–0,65 |
   | Error en el total | +8 a +20 min | −9 a +1,5 min (−75 en mayores) |

   De fábrica gana el Apple Watch: escribe al despertar sin abrir ninguna app, y
   lo de la noche sale de la misma fuente.
3. **Google o Fitbit:** especificidad del 45 al 54 %, κ de 0,41 a 0,55, y de +3
   a +11 minutos en el total [V1][V4][V5].
4. **WHOOP**, sin etapas en Salud: especificidad del 40 al 56 %, de −12 a +24,5
   minutos [V1][V2][V13].
5. **Polar**, sin etapas: especificidad del 35 al 51 %, −1 minuto [V2][V15].
6. **Garmin y Withings:** especificidad del 18 al 37 %. Cuentan de más, de 38 a
   48 minutos [V1][V2][V4][V17].
7. **Con etapas, pero sin validar:** RingConn, Ultrahuman, Amazfit, Huawei,
   Eight Sleep y COROS. También Xiaomi, que tiene una validación, pero mala (κ
   0,22) [V18].
8. **Las apps del iPhone** que escriben en Salud [V3].
9. **Lo anotado a mano:** en Salud (`HKMetadataKeyWasUserEntered`) o la hora que
   confirmaste o corregiste en Moss a la mañana. Si están las dos, gana la de
   Moss.
10. **La estimación de Moss sin confirmar.**
11. **El «en cama» del iPhone** (hasta iOS 17): nunca cuenta como sueño.

Los desempates, en este orden:
- con etapas antes que sin etapas;
- la que cubre más de la noche;
- el dato original antes que una copia;
- la revisión más nueva.

El orden es por noche, no por persona: la noche que no usaste el reloj, cuenta
la fuente que sigue.

### El mismo sueño desde dos fuentes

1. **La fuente** es la app (`bundleIdentifier`) más el aparato (`productType`).
   Así se separa el reloj del iPhone dentro de Apple.
2. **Los episodios** de cada fuente se arman con la regla de siempre: huecos de
   menos de una hora.
3. **Son el mismo sueño** si se superponen al menos en el 50 % del más corto, o
   si el inicio y el fin difieren 90 minutos o menos. Es razonable: contra la
   polisomnografía, los aparatos se equivocan en ±80 a 130 minutos del total
   [V1].
4. **Ecos:** los mismos bordes (±1 minuto) desde otra fuente son una copia. Oura
   importa sueño de Salud, y Google Health lo lee y lo escribe [O1][F1]. Queda la
   del aparato que midió.
5. **Dentro de una fuente,** lo superpuesto se resuelve como Salud [A11]:
   - la revisión más nueva gana;
   - una etapa gana a «dormido sin etapa»;
   - lo que pierde se recorta, no se descarta.
6. **Nunca se suman minutos de dos fuentes.** Una siesta de otra fuente cuenta
   solo si no se superpone con la noche elegida.
7. **Lo de la noche** (la frecuencia, la variabilidad y la respiración) sale de
   la misma fuente.
   - Si esa fuente no escribe variabilidad (Oura, WHOOP, Garmin, Google y
     Polar), se usa la del Apple Watch, rotulada, solo si el reloj registró ese
     mismo sueño.
   - Si no, dice «sin variabilidad».
8. **La variabilidad del Apple Watch** se mide cada ~4 horas [A2]. Casi nunca
   llega a las dos lecturas por noche que pedía [`sueno.md`](sueno.md), así que
   alcanza con una, rotulada «una lectura».
   - Con los avisos de ritmo irregular, mide cada 2 horas.
   - El Series 12, hasta cada 5 minutos [A14].
9. **Varios aparatos escriben tarde:**
   - Oura y Garmin, cuando se abre su app;
   - WHOOP, a veces al otro día [O1][G5][W12].

   Por eso se siguen releyendo las últimas 14 noches.

### La variabilidad

- **Solo el Apple Watch** escribe la variabilidad con un método conocido: SDNN
  sobre lecturas de ~1 minuto [A2][A5]. Ultrahuman escribe una sin decir el
  método [U1].
- **iOS 27 suma `heartRateVariabilityRMSSD`** [A6].
  - Se pide y se guarda aparte. Nunca se mezcla con SDNN.
  - Ningún fabricante anunció que lo vaya a escribir.
  - La librería de Salud del repo (@kingstinct/react-native-healthkit 16.2.0) ya
    tiene ese tipo y las series latido a latido.

## Lo que se muestra

- **En Sueño, «De dónde sale»:**
  - el aparato de la noche y su nivel, en palabras: «Apple Watch · mide las
    etapas»;
  - si es la estimación de Moss, su confianza y el rango;
  - si llegó otra fuente que no se usó: «También llegó de Oura; se usa el Apple
    Watch»;
  - lo que falta, si se sabe: «Abre Garmin Connect para que lleguen los datos».
- **En Perfil › Aparatos:**
  - las fuentes que escribieron sueño en Salud en los últimos 30 días, con lo
    que llega de cada una (los textos de abajo);
  - la fuente de la noche, si hay más de una: «Automática» de fábrica, que sigue
    el orden de arriba;
  - lo que falta y cómo arreglarlo;
  - sin ninguna, el texto del iPhone solo.
- **La recuperación, el rendimiento y las marcas** dicen de dónde sale el sueño:
  - «Con lo que midió tu Apple Watch»;
  - «Con lo que estimó el teléfono; con un reloj sería más preciso». Con la
    estimación, el margen del rendimiento crece (ver
    [`rendimiento.md`](rendimiento.md)).

## Los textos de Perfil › Aparatos (en tú)

- **Arriba:** «Moss funciona solo con el iPhone y mejora con un reloj o un
  anillo. Todo llega desde Salud.»
- **El iPhone solo:** «Con el iPhone solo, Moss estima cuándo dormiste con tus
  pasos, el movimiento y cuándo usas la app, y te pregunta a la mañana para
  confirmarlo. Con un reloj o un anillo, se mide.»
- **Apple Watch:** «Con un Apple Watch: cuánto y cuándo dormiste, con etapas y
  siestas; de noche, la frecuencia cardíaca, la variabilidad y la respiración; la
  temperatura de la muñeca desde el Series 8 y el oxígeno en los modelos que lo
  miden.»
- **Oura:** «Con un Oura: cuánto y cuándo dormiste, con etapas, y la frecuencia y
  la respiración de la noche. La variabilidad y la temperatura se quedan en la app
  de Oura. Ábrela cada día para que lleguen los datos.»
- **WHOOP:** «Con un WHOOP: cuánto y cuándo dormiste, sin etapas, y la frecuencia
  en reposo, la respiración y el oxígeno de la noche. Las etapas y la variabilidad
  se quedan en la app de WHOOP.»
- **Garmin:** «Con un Garmin: cuánto y cuándo dormiste, con etapas, la frecuencia
  y los pasos. Abre Garmin Connect para que mande los datos. La variabilidad y la
  Body Battery se quedan en Garmin.»
- **Fitbit:** «Con un Fitbit o un Fitbit Air: cuánto y cuándo dormiste, con
  etapas, la frecuencia, la frecuencia en reposo, la respiración y el oxígeno.
  Conecta la app Google Health con Salud. La variabilidad no llega.»
- **Polar:** «Con un Polar: cuánto dormiste, sin etapas, los pasos y los
  entrenamientos.»
- **Withings:** «Con Withings: el peso y la composición corporal; con el Sleep
  Analyzer o un ScanWatch, también el sueño. Si creaste tu cuenta después del 12
  de octubre de 2026, necesitas Withings+ para mandar datos a Salud.»
- **RingConn:** «Con un RingConn: cuánto y cuándo dormiste, con etapas, la
  frecuencia y el oxígeno de la noche.»
- **Ultrahuman:** «Con un Ultrahuman: la variabilidad y la temperatura que su app
  mande a Salud.»
- **Amazfit, Xiaomi o Huawei:** «Los pasos, la frecuencia y el sueño; el detalle
  depende del modelo.»
- **COROS:** «La frecuencia, el sueño y los pasos.»
- **Suunto:** «Los entrenamientos, los pasos y la frecuencia; el sueño no llega a
  Salud.»
- **Eight Sleep:** «El sueño que mide la funda.»
- **Samsung y Pixel:** «El Pixel Watch, el Galaxy Watch y el Galaxy Ring no
  funcionan con iPhone.»
- **Varios aparatos:** «Si usas más de uno, Moss toma uno por noche, el que
  elijas, y nunca los suma.»

Los de Ultrahuman, Amazfit, Xiaomi, Huawei, COROS, Suunto y Eight Sleep salen
de fuentes sin confirmar: hay que revisarlos con un aparato antes de lanzar.

## Fuentes (todas consultadas el 22/10/2026)

**Apple**
- [A1] Estimating Sleep Stages from Apple Watch, oct-2025: https://www.apple.com/health/pdf/Estimating_Sleep_Stages_from_Apple_Watch_Oct_2025.pdf
- [A2] Heart Rate, Calorimetry and Activity on Apple Watch, nov-2024: https://www.apple.com/health/pdf/Heart_Rate_Calorimetry_Activity_on_Apple_Watch_November_2024.pdf
- [A3] https://developer.apple.com/documentation/healthkit/hkcategoryvaluesleepanalysis
- [A4] https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/applesleepingwristtemperature
- [A5] https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartratevariabilitysdnn
- [A6] https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartratevariabilityrmssd
- [A11] Foro de desarrolladores, respuesta de Apple, ago-2026: https://developer.apple.com/forums/thread/842919
- [A13] https://www.apple.com/newsroom/2025/08/an-update-on-blood-oxygen-for-apple-watch-in-the-us/
- [A14] https://www.apple.com/newsroom/2026/09/introducing-apple-watch-series-12-with-the-all-new-health-sensing-system/
- [A16] https://blakecrosley.com/blog/five-second-heart-rate-healthkit
- [A18] https://developer.apple.com/forums/tags/health-and-fitness?page=3
- [A19] https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/respiratoryrate

**Oura**
- [O1] https://support.ouraring.com/hc/en-us/articles/360025438734-Apple-Health-Integration
- [O2] https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API
- [O3] https://cloud.ouraring.com/docs/
- [O5] Acuerdo de la API, desde el 08/06/2026: https://cloud.ouraring.com/legal/api-agreement
- [O7] https://www.aifitnessapi.com/integrate/oura-api
- [O9] https://pypi.org/project/oura-ring/
- [O10] https://forum.intervals.icu/t/oura-sync-imports-sleep-score-readiness-but-never-hrv-or-resting-hr-likely-the-end-date-exclusive-quirk-on-ouras-detailed-sleep-endpoint/130825

**WHOOP**
- [W1] https://support.whoop.com/s/article/Apple-Health-Integration
- [W2] https://www.community.whoop.com/t/apple-health-missing-sleep-stage-data-from-whoop/8192
- [W3] https://dcrainmaker.com/2022/04/exporting-health-actually.html
- [W4] https://developer.whoop.com/docs/developing/app-approval
- [W5] https://developer.whoop.com/docs/developing/rate-limiting
- [W7] https://developer.whoop.com/docs/developing/user-data/recovery
- [W8] https://developer.whoop.com/docs/developing/user-data/sleep
- [W9] https://tryterra.co/blog/whoop-api-data-access-permissions-limitations-2026
- [W11] https://developer.whoop.com/docs/introduction
- [W12] https://www.community.whoop.com/t/new-whoop-5-0-app-not-connecting-with-apple-health/7699

**Garmin**
- [G2] https://www.notebookcheck.net/Garmin-Connect-begins-sharing-more-sleep-data-with-Apple-Health-after-new-iOS-app-update.753484.0.html
- [G3] https://www.sonarhealth.co/blog/sync-garmin-with-apple-health/
- [G4] https://trainconstant.com/blog/garmin-apple-health
- [G5] https://docs.sahha.ai/docs/products/integrations/garmin
- [G6] https://www.dcrainmaker.com/2026/10/garmin-connect-api-revamps-connect-developer.html
- [G9] https://developerportal.garmin.com/developer-programs/connect-developer-api
- [G10] https://openwearables.io/docs/providers/garmin-api-integration

**Google / Fitbit**
- [F1] https://support.google.com/googlehealth/answer/17037331?hl=en
- [F2] https://www.idropnews.com/news/fitbit-sync-apple-health-google-health/266943/
- [F3] https://developers.google.com/health/newsletters
- [F7] https://developers.google.com/health/app-verification
- [F8] https://support.google.com/googlepixelwatch/answer/12652073

**Samsung**
- [S1] https://www.samsung.com/us/support/answer/ANS10004668/
- [S2] https://www.samsung.com/uk/rings/galaxy-ring/galaxy-ring-titanium-black-size-10-sm-q500nzkaeub/

**Polar**
- [P1] https://support.polar.com/en/support/connecting_polar_flow_with_apple_health
- [P2] https://www.polar.com/accesslink-api/
- [P3] https://www.polar.com/polar-api-v4/
- [P4] https://www.polar.com/blog/introducing-polar-open-accesslink-api/
- [P5] https://www.polar.com/en/legal/polar-api-agreement
- [P8] https://lawinsider.com/contracts/8ClYmYHuNpX

**Withings**
- [Wi1] https://support.withings.com/hc/en-us/articles/203934573-Partner-Apps-Frequently-asked-questions-about-Apple-Health
- [Wi2] https://support.withings.com/hc/en-us/articles/360000158447-Sleep-Analyzer-EU-ROW-Monitoring-my-sleep-heart-rate
- [Wi3] https://developer.withings.com/developer-guide/v3/withings-solutions/withings-api-plans/
- [Wi4] https://developer.withings.com/llms.md
- [Wi5] https://developer.withings.com/openapi.yaml
- [Wi7] https://idevice.com/new-withings-accounts-now-need-withings-to-sync-with-apple-health

**Las demás marcas**
- [U1] https://www.ultrahuman.com/blog/how-to-access-your-hrv-data-on-apple-health/
- [U2] https://openwearables.io/docs/providers/ultrahuman-api-integration
- [U5] https://sahha.ai/integrations/ultrahuman/
- [R1] https://ringconn.com/blogs/guides/how-sync-health-and-sleep-tracker-data
- [R2] https://ringconn.com/blogs/guides/health-connect-sync
- [R5] https://de.ringconn.com/en/blogs/guides/smart-ring-kompatibilitaet-apple-health-samsung-health
- [Z1] https://haid.app/en/integrations/amazfit
- [C1] https://support.coros.com/hc/en-us/articles/360041549551-Connecting-Apple-Health-with-COROS-App
- [C2] https://docs.tryterra.co/faq/help-topics/data-api-sdk/provider-coverage-and-per-provider-data-availability/coros-sleep-stages-not-exposed
- [Su1] https://apizone.suunto.com/faq
- [Su2] https://askvora.com/blog/does-suunto-sync-with-apple-health
- [E1] https://help.eightsleep.com/en_us/does-the-eight-sleep-app-sync-up-with-other-tracking-devices-rk25tVytP
- [E2] https://lifestack.ai/blog/apps-to-use-with-eightsleep
- [E4] https://tryterra.co/blog/eight-sleep-integration-terra-api
- [X1] https://www.mi.com/global/support/faq/details/KA-230360/
- [H1] https://sahha.ai/integrations/huawei-health/

**Agregadores**
- [Ag1] https://tryterra.co/community/pricing
- [Ag2] https://www.junction.com/pricing
- [Ag3] https://railway.com/deploy/open-wearables-health-api

**Estudios de validación**
- [V1] Schyvens 2025, Sleep Advances: https://pmc.ncbi.nlm.nih.gov/articles/PMC12038347/
- [V2] Miller 2022, Sensors: https://pmc.ncbi.nlm.nih.gov/articles/PMC9412437/
- [V3] Lee 2023, JMIR: https://pmc.ncbi.nlm.nih.gov/articles/PMC10654909/
- [V4] Chinoy 2021, Sleep: https://pmc.ncbi.nlm.nih.gov/articles/PMC8120339/
- [V5] Robbins 2024, Sensors: https://pmc.ncbi.nlm.nih.gov/articles/PMC11511193/
- [V6] Svensson 2024, Sleep Medicine: https://doi.org/10.1016/j.sleep.2024.01.020
- [V11] Searles 2026: https://pmc.ncbi.nlm.nih.gov/articles/PMC12936866/
- [V13] Miller 2020: https://doi.org/10.1080/02640414.2020.1797448
- [V15] Chinoy 2022: https://pmc.ncbi.nlm.nih.gov/articles/PMC8957400/
- [V17] Manners 2025: https://pmc.ncbi.nlm.nih.gov/articles/PMC12592840/
- [V18] Concheiro-Moscoso 2023: https://pmc.ncbi.nlm.nih.gov/articles/PMC10238963/
- [V19] Dial 2025, la variabilidad contra el electrocardiograma: https://pmc.ncbi.nlm.nih.gov/articles/PMC12367097/
- Agostinho 2026, una revisión («ningún aparato es superior de forma constante»): https://doi.org/10.1080/15402002.2026.2673893
