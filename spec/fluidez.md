# Fluidez en un iPhone viejo

Lo pediste el 5/11/2026: «chequeá que esté todo optimizado, que no vaya lagueado, sobre todo para gente con
teléfono viejo; capaz que está algo mal renderizado y hace que vaya muy lagueado, aunque esté en bajo». Se leyó
todo el dibujo de la app (el cielo en `src/cielo/` y las secciones en `src/secciones/`) pensando en un A12 o A13
(XR, XS, 11, SE de 2020), y se midió la galería con el procesador frenado. Lo de la app se leyó, no se midió en
un teléfono: cuando haya build `telefono`, comparar ahí (en la `dev` están el diagnóstico y React en modo
desarrollo, que la hacen más lenta).

## Hecho

- **La galería** (versión 45): todo lo que se mueve sin parar va en su capa y solo cambia `transform` u
  `opacity`, así no se repinta nada en cada cuadro: el polvo de Ascent (el giro y el latido, que con `rotate` y
  `scale` sueltos no siempre iban por la placa de video) y el pulso de «ahora» en Comida (animaba una sombra).
  El scroll de Ascent ya no lleva máscara. Medida con el procesador cuatro veces más lento y sin placa de video:
  en reposo, casi nada de trabajo; el scroll de Ascent, unos 30 cuadros por segundo, sin trabas largas.
- **La app, lo seguro** (no cambia nada a la vista):
  - La hoja de registro, lo más usado, ya no recorta: con dos esquinas redondeadas y dos no, el recorte obligaba
    a iOS a dibujarla aparte en cada cambio (al escribir, con el cursor que titila). Su sombra no se veía y se
    sacó. Los paneles y el velo de la ventana llevan las mismas esquinas (`HojaRegistro.tsx`, `Paneles.tsx`,
    `Ventana.tsx`).
  - El aviso de «Deshacer», con fondo opaco: con alfa, iOS calcula su sombra píxel por píxel (`comunes.tsx`).
  - La luz de la pestaña elegida se dibuja una vez y se guarda (`shouldRasterizeIOS` en `Barra.tsx`).
  - Los chips ya no recortan: el fondo redondeado no lo necesita (`Inicio.tsx`, `tarjetas.tsx`, `Comida.tsx`).

## Lo que falta, del más al menos importante

1. **El cielo de cada cuadro se dibuja a la resolución de la pantalla en todas las calidades**
   (`Cielo.tsx`, el relleno con el shader; `mundo.ts` no tiene resolución para eso). En un XS son unos 3
   millones de píxeles por cuadro, con la aurora, el titilar y el musgo encima. En baja (y quizá en media),
   dibujarlo en un lienzo aparte a la mitad y agrandarlo; las líneas, las estrellas y el musgo, a resolución
   completa. **Decidís vos** una más fuerte: en baja, congelar la aurora y el titilar en la textura del fondo.
2. **Al deslizar entre secciones, la vecina nueva se arma en medio del viaje** (`Secciones.tsx`, `armada`): da
   un tirón al final del gesto. Armar al instante solo el destino, y las vecinas unos 380 ms después.
3. **Con una hoja abierta, todo lo de atrás se recorta con esquinas** (`Secciones.tsx`): iOS compone la pantalla
   entera aparte en cada cuadro mientras anotas. Dejar solo la escala, o dibujar las esquinas con un marco negro
   encima, que no recorta.
4. **Animaciones de alto y ancho**, que pasan por React en cada cuadro: el alto máximo de la hoja del «+» sigue al
   teclado aunque esté cerrada, el espacio del teclado en la hoja de registro y en la ventana, las barras de los
   macros (`Relleno`, `width`), el `Camino` (`width` y `left`) y el alto del cuadro de Comida. Con `scaleX` y
   `translate`; el teclado, con `translateY`; la hoja del «+» cerrada, sin seguirlo.
5. **La cifra que cuenta** hace unos 30 renders, en Inicio y en Comida a la vez (`animados.tsx`): solo en la
   sección que se ve y con menos pasos.
6. **Cada cambio del almacén redibuja Comida entera** y sus lunas (`useEstado` devuelve todo el estado): memorizar
   las lunas, guardar el último `calcularPersona` y llevar la canasta a un almacén propio.
7. **Los gestos del cielo avisan en cada toque** (`escena.modify` sin `false`, `Cielo.tsx`): con el dedo, 120
   veces por segundo. El lazo del cielo ya lo propaga una vez por cuadro.
8. **El musgo se redibuja entero en cada cuadro**, con sus bordes desenfocados: hornear cada loma en una textura,
   como el fondo.
9. **El cielo sigue vivo debajo de una hoja abierta desde Hábitos** (el freno solo mira la tira y Ascent): frenarlo
   también con las hojas.
10. **La calidad automática** no se guarda (cada arranque vuelve a la de fábrica), solo mide en Hábitos con el dedo
    y no tiene nada debajo de baja: guardar el escalón medido y sumar uno «mínima» con lo de 1 y 8.
11. **La textura del fondo se rehace en cada arranque**, con el shader más caro: guardarla en disco por tamaño,
    calidad y riqueza.
12. **El cuadro de Comida** recorta con esquinas: recortar con una vista interior sin radio.

## Lo que ya está bien (no tocar)

El cielo se frena detrás de las secciones, en el fondo y con Reducir movimiento, y la cámara queda quieta al
llegar; sin dedo va a 30 cuadros; las luces reusan sus objetos y solo tocan lo que cambió; las líneas se rehacen
solo cuando cambian; el fondo va horneado en una textura; los shaders se compilan una vez; las actualizaciones
síncronas de Reanimated están prendidas; solo se arman la sección de ahora y sus vecinas; la búsqueda es
asíncrona y corta; el React Compiler está prendido; no hay `console.log` en los caminos calientes.
