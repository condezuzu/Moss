# El estudio de la evidencia de Moss: lo común a todas las áreas

Repo (solo lectura para vos): `C:/Users/agusc/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/72da519d-471d-42a1-aeb2-6c67de217f9c/f9bedcb3-8ceb-4006-8d30-0989e937913e/scratch-2026-10-21-9f7792`
(Windows, Git Bash). Moss es una app de comida para iPhone (calorías y macros como MacroFactor, con
sueño, hábitos y la conexión con Ascent, una app de gimnasio). `CLAUDE.md` en la raíz explica todo; las
reglas están en `src/dominio/` (puras, con tests) y la investigación que ya se hizo, en `spec/`.

## Lo que pidió el dueño (5/11/2026)

> «Quiero que sea lo más confiable posible, así que hacé un estudio de qué tenemos que calcular y cómo
> para darle el resultado más confiable al usuario. Quiero que saques de los estudios científicos más
> confiables que hay y refutes todo lo que hacemos. Es más, quisiera que en Perfil, abajo de todo,
> aparezca en qué nos basamos para crear esta app y cómo ordenamos toda la información para que la app
> realmente funcione.»

Cada área la estudia un agente distinto. Vos tenés una (abajo, en tu pedido).

## Cómo

1. **Qué hace Moss hoy.** Leé la spec y el código de tu área y anotá cada cálculo, umbral, constante y
   afirmación: el archivo y la línea, la fórmula y el número. No supongas: si algo no está, decilo.
2. **La mejor evidencia.** Para cada cosa, buscá lo más fuerte que haya: revisiones sistemáticas y
   metaanálisis, consensos y posturas de sociedades (ACSM, ISSN, AND, IOC, AASM, SRS, NSF, EFSA, NASEM/IOM,
   OMS, ADA, AHA, KDIGO, ACOG…), estudios de validación grandes; ensayos antes que observacionales; lo
   reciente antes que lo viejo, salvo que lo viejo siga siendo la referencia. Anotá quién lo pagó si la
   industria está en el medio.
3. **Refutalo.** Partí de que lo que hace Moss está mal hasta que la evidencia muestre lo contrario. Para
   cada cosa, un veredicto: **se sostiene**, **a medias** (la idea sí, el número o la forma no),
   **refutado**, o **es una convención** (no hay evidencia ni a favor ni en contra: se elige).
4. **Lo más confiable.** Con los datos que Moss tiene o podría tener (lo anotado, Salud de Apple, Ascent,
   lo del cuestionario), cuál es la forma más confiable de calcularlo: la fórmula exacta, las constantes,
   el error esperado y cómo mostrar la incertidumbre (un rango, «aproximado», nada de precisión falsa).
5. **Lo que falta.** Lo que Moss debería calcular o decir y no hace, y lo que nunca debería decir ni hacer.

## Las fuentes

- Citá solo lo que abriste y leíste. Cada fuente con su DOI o su URL, y si leíste el texto entero o solo
  el resumen. Nada inventado ni «de memoria»: si no pudiste leerlo, no va como fuente.
- PubMed, PMC, la revista, la sociedad. Wikipedia y los blogs sirven para encontrar la fuente, no como
  fuente.
- Si dos fuentes buenas se contradicen, decilo y elegí con razones.

## Lo que entregás

Un archivo en Markdown, en español, en `spec/estudio/<tu área>.md`, con:

1. **Resumen**: de 5 a 10 puntos (lo que se sostiene, lo que cae y los cambios que más importan).
2. **Tabla de veredictos**: Qué calcula Moss | Dónde (archivo:línea) | Veredicto | La mejor evidencia
   (autor, año, tipo, n) | Lo más confiable | El dato que necesita | ¿Moss lo tiene?
3. **Cambios propuestos**, concretos: el archivo, la constante o la fórmula nueva y cómo probarla (el test).
   Separá lo que es un arreglo claro de lo que es una decisión del dueño.
4. **Lo que no se dice** (o no se hace).
5. **Para «En qué se basa Moss»** (la pantalla nueva de Perfil): un párrafo de 3 a 5 oraciones en español
   neutro (tú; nada de voseo ni palabras rioplatenses) y el mismo en inglés, para una persona común, que
   nombre las 2 a 4 fuentes clave (autor o sociedad y año) y diga cómo Moss lo usa y cuánto se puede
   confiar.
6. **Fuentes**: la lista, con DOI o URL y «entero» o «solo el resumen».

Y tu respuesta final (lo que devolvés): un resumen corto, de no más de 25 líneas, con la ruta del archivo.

## Lo prohibido

- Cambiar el repo: es de solo lectura para vos (nada de Edit/Write ahí, ni git que cambie algo). Tu
  carpeta es `spec/estudio/`.
- Instalar paquetes, prender servidores, abrir `.env*`, claves o el `.p8`, tocar la base real de
  Supabase, mandar datos a cualquier lado que no sea una búsqueda o la lectura de una página. El correo del
  dueño no va en ningún lado.
