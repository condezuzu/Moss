# Decisiones

Primero las que esperan tu respuesta; después las que tomé por mi cuenta para
poder avanzar (cualquiera se puede revertir).

## Pendientes

### D1 · Supabase: un proyecto aparte para Moss (recomendado)

Recomiendo un **proyecto de Supabase propio para Moss**, con todas sus tablas en
un esquema `moss` igual (si algún día conviene juntarlos, ya están separadas).

Por qué:

1. **La v1 no usa nada de Ascent, y Ascent ya está en la tienda.** Con un
   proyecto compartido, cada migración de Moss se pega en la base de producción
   de Ascent: un error ahí rompe la app publicada.
2. **Ascent crea un perfil por cada usuario nuevo** (trigger
   `on_auth_user_created` → `handle_new_user`). En un proyecto compartido, cada
   alta de Moss crearía un perfil de Ascent, y habría que tocar ese trigger en
   producción.
3. **Borrar la cuenta**, que Apple exige, hoy borra `auth.users` y todo lo demás
   en cascada (`eliminar_cuenta()`). Con una cuenta compartida, borrarla desde
   Moss borraría también Ascent.
4. **Mails, plantillas, remitente y límites son por proyecto**: los mails de Moss
   saldrían como Ascent, con el enlace `ascent://confirmar`.
5. **La conexión con Ascent se puede hacer bien sin compartir la base.** Supabase
   ya puede actuar como proveedor OAuth 2.1 / OpenID (beta pública desde el
   26/11/2025), y un proyecto puede sumar proveedores OpenID propios (hasta 3 en
   el plan gratis). "Continuar con Ascent" en Moss lleva a una pantalla de
   permiso en la web de Ascent; Moss recibe la identidad y un token que solo
   puede leer lo que Ascent le deje, por ejemplo los días entrenados.
   - Que un proyecto de Supabase sea el emisor de otro no está documentado:
     antes de prometerlo hay que probarlo (es una tarde, y es para después de
     la v1).
   - Si no anda: Sign in with Apple en las dos apps (Apple le da el mismo
     identificador a todas las apps de un mismo equipo, agrupadas o no) y una
     función chica en Ascent que conteste "¿entrenó tal día?". Ascent hoy solo
     tiene mail y contraseña.
6. **Costo**: el plan gratis admite dos proyectos activos, pero pausa un
   proyecto después de una semana sin uso, así que una app publicada igual
   tiene que ir en Pro. En Pro, cada proyecto chico suma unos 10 dólares por mes.

Lo que se pierde: con el mismo proyecto, el login compartido y el gimnasio
automático salían casi solos. Es la única ventaja fuerte, es para después de la
v1, y el costo del acople se paga desde el primer día.

Qué me haría cambiar de idea: que quieras que toda cuenta de Moss sea también
una cuenta de Ascent, obligatoriamente, o que los amigos de Ascent tengan que
aparecer en Moss desde el primer día.

Para el día de la conexión: en Ascent, el día entrenado es una fila de
`public.logs` con `fecha` y `es_descanso = false` (la fecha la calcula el
servidor en la zona del perfil), y los amigos están en `friendships` con
`son_amigos()`, que respeta `bloqueos`.

### D2 · Entrar sin registrarse, con la cuenta creada igual (recomendado)

Apple (regla 5.1.1(v)) pide que, si la app no tiene funciones importantes que
necesiten una cuenta, se pueda usar sin iniciar sesión. En la v1, Moss todavía no
tiene amigos: la cuenta solo sirve para guardar y sincronizar.

Propuesta: al abrir por primera vez se crea una **cuenta anónima** de Supabase
(hay cuentas desde el inicio, en los datos), y más adelante se ofrece "Guardar
tu cielo" con Apple o con mail, que convierte esa misma cuenta.

Riesgos: en Supabase, vincular una identidad a una cuenta anónima todavía está
en beta; si un anónimo cierra sesión, pierde la cuenta; y conviene limitar las
altas anónimas (Supabase permite 30 por hora por IP de fábrica). Ascent pasó la
revisión con login obligatorio, pero Ascent tiene amigos y ranking desde el
inicio.

### D3 · Qué pasa si dos días tienen la misma cantidad de hábitos

Cada día recibe una constelación distinta del grupo de esa cantidad. Si el grupo
no alcanza, propongo **repetir** la constelación, cada día con su propio
progreso, en vez de inventar figuras o usar una de otra cantidad. Con el
catálogo actual pasa poco: ver [`catalogo.md`](catalogo.md).

### D4 · El lema

"Do so much volume that it will be unreasonable to fail" circula atribuida a
Alex Hormozi. Como frase del día va atribuida; si va a ser el lema de la tienda,
conviene confirmar el origen o escribir uno propio.

### Las de la galería

Tipografías, color de la aurora, dónde va la frase, estilo de las figuras y
orientación: están en la galería, sección "Para decidir".

## Tomadas por mi cuenta

- **Expo SDK 58** (la última, React Native 0.88). Reanimated 4 exige la Nueva
  Arquitectura, que ya viene prendida.
- **`uy.moss.app`**, siguiendo a `uy.ascent.app`; dueño de EAS `condeag`;
  perfiles de EAS con los mismos nombres y la misma lógica que Ascent
  (`environment: preview` en todos, variables en el panel de EAS).
- **Código en español**, como Ascent. **Interfaz en español neutro** (tú, nunca
  vos) e inglés.
- **Local primero**: el teléfono es la fuente inmediata y Supabase guarda y
  sincroniza.
- **Los datos de Salud no salen del teléfono**: a Supabase sube si el hábito se
  cumplió y el número que se muestra, no las muestras de Salud.
- **Un solo juego de shaders** para la galería y la app (`src/cielo/shaders`).
- **Catálogo solo con mito griego**: las 48 constelaciones de Ptolomeo y
  asterismos dentro de ellas que tienen su propio mito.
- **Galería interactiva**, no capturas como la de Ascent: lo que hay que aprobar
  son animaciones y toques.
- **Rama `cimientos`**, que sale de `master` (el commit inicial de la plantilla).
