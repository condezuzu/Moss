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

## Lo grande (6/11/2026)

Hecho, con tipos, lint, los tests (1403) y la app en la web (el cielo en baja, las hojas, las barras, deslizar):

1. **El cielo en baja, a media resolución:** el relleno del cielo va en una capa del mismo lienzo que se dibuja a la
   mitad y Skia agranda con un filtro lineal (`agrandar.ts`; `escalaCielo` en `mundo.ts`: 1 en alta y media, 0,5 en
   baja). Las luces se siguen sumando encima como antes (con un lienzo aparte se pintaban encima y salían más
   naranjas). Medido con CanvasKit: el cielo tarda la cuarta parte; la imagen difiere 0,35/255 de media. En la web,
   React Native Skia no trae ese filtro y se arma con CanvasKit. Media sigue en 1 (sin probar 0,75 en un teléfono).
   **Decidís vos** algo más fuerte: en baja, congelar la aurora y el titilar en la textura del fondo.
2. **Las vecinas se arman después del viaje** (`Secciones.tsx`, `vecinasDe` a los 380 ms): el destino ya está; las
   vecinas nuevas, al terminar.
3. **Con una hoja abierta, lo de atrás ya no recorta con esquinas:** las dibuja un marco del color del fondo que no
   recorta, y queda un recorte recto (barato) para que no asomen las secciones de al lado al achicarse.
4. **Alto y ancho, en parte:** las barras de los macros (`Relleno`) y el `Camino` se mueven con `translateX`; la hoja
   del «+» cerrada ya no sigue al teclado ni se vuelve a dibujar con cada teclado.
5. **La cifra que cuenta**, en 10 pasos en vez de unos 30.
6. **Las lunas de Comida** se rehacen solo si cambia lo que muestran, y la persona y el sueño se calculan una vez
   para todos (`ganchos.ts`).
7. **Los gestos del cielo** avisan una vez por cuadro (`modify(fn, false)`), y el lazo se despierta al empezar a
   arrastrar.
9. **El cielo se frena debajo de una hoja abierta** (la del «+» y la de registro: `tapado`) y vuelve al cerrarla; esos
   cuadros no cuentan para medir la calidad.
10. **La calidad automática se guarda**, atada al modelo del iPhone y por 30 días; si se mide con la que elegiste en
    Perfil, no baja la automática.

Lo que falta:

- **El espacio del teclado** en la hoja de registro y en la ventana sigue animando el alto: hay que probarlo con un
  teclado de verdad.
- **La cifra que cuenta**, sin animar en la sección que no se ve (hace falta que `Secciones` les diga cuál se ve).
- **La canasta en un almacén propio** (`almacen.ts`, `HojaRegistro.tsx` y sus tests): hoy cada cosa que se suma
  redibuja todo lo que usa el estado.
8. **El musgo se redibuja entero en cada cuadro**, con sus bordes desenfocados: hornear cada loma en una textura.
11. **La textura del fondo se rehace en cada arranque**, con el shader más caro: guardarla en disco.
12. **El cuadro de Comida** sigue recortando con esquinas y su alto sigue animado: sin eso, la semana y el mes asoman
    al deslizar por fuera de lo redondeado (y el alto empuja lo de abajo).
- Un escalón «mínima», con lo de 8.

En un iPhone viejo con la build `telefono` (no la `dev`): el cielo en baja (que llene la pantalla; los rayos de las
estrellas más brillantes pueden titilar un poco al arrastrar), las hojas al abrir, cerrar y arrastrar (las esquinas
de atrás), deslizar entre secciones y el «+» con el teclado en el peso.

## Lo que ya está bien (no tocar)

El cielo se frena detrás de las secciones, en el fondo y con Reducir movimiento, y la cámara queda quieta al
llegar; sin dedo va a 30 cuadros; las luces reusan sus objetos y solo tocan lo que cambió; las líneas se rehacen
solo cuando cambian; el fondo va horneado en una textura; los shaders se compilan una vez; las actualizaciones
síncronas de Reanimated están prendidas; solo se arman la sección de ahora y sus vecinas; la búsqueda es
asíncrona y corta; el React Compiler está prendido; no hay `console.log` en los caminos calientes.
