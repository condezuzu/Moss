# moss-vincular

Vincula una cuenta de Moss con una de Ascent, sea la misma o no («Vincular en
menos de 10 segundos», D27, en [`spec/ascent.md`](../../../spec/ascent.md)). La
llama la app desde la que se vincula, con su sesión, y manda la sesión de la otra
app, que leyó del llavero compartido del equipo. La función revisa las dos
sesiones con Supabase y guarda el vínculo con `moss.vincular_cuentas`
([`0008_vinculo.sql`](../../moss/0008_vinculo.sql)), que solo puede llamar la
clave de servicio. Sin las dos sesiones vivas no se vincula: así nadie vincula
algo ajeno.

No usa paquetes ni toca `public`: el perfil de Ascent lo lee la función de la
base. No necesita secretos propios: `SUPABASE_URL` y las claves las pone la
plataforma. Usa la secreta nueva (`SUPABASE_SECRET_KEYS`) y, si no está, la
`service_role`.

## El contrato

Lo usan las dos apps (Moss en `src/lib/ascentRemoto.ts`; Ascent, desde su lado):

```
POST /functions/v1/moss-vincular
Authorization: Bearer <access token de la app que llama>
{ "otra": "<access token de la cuenta de la otra app>", "desde": "moss" | "ascent" }
```

Con `"desde": "moss"`, la cuenta de Moss es la de `Authorization` y la de Ascent,
la de `otra`; con `"ascent"`, al revés. Vincular de nuevo borra los vínculos
anteriores de las dos cuentas.

| Estado | Cuerpo | Qué pasó |
|---|---|---|
| 200 | `{"ok":true,"nombre":"…"}` | Vinculadas; `nombre` es el usuario de Ascent |
| 400 | `{"error":"pedido"}` | El cuerpo no es `{ otra, desde }` |
| 401 | `{"error":"sin_sesion"}` | Sin sesión propia, o vencida |
| 401 | `{"error":"vencida"}` | La sesión de la otra app venció o no es una sesión: hay que abrirla y volver |
| 405 | `{"error":"metodo"}` | No es POST |
| 409 | `{"error":"sin_ascent"}` | La cuenta de Ascent no tiene nombre de usuario: nunca usó Ascent |
| 500 | `{"error":"configuracion"}` | Faltan `SUPABASE_URL` o las claves |
| 500 | `{"error":"interno"}` | La base no guardó (el log dice el código) u otro error |
| 502 | `{"error":"interno"}` | Auth o la base no respondieron |

Nunca responde 404: para la app, 404 quiere decir que la función no está
desplegada. En los logs solo van pasos, estados y códigos, nunca tokens.

## Antes

En el SQL Editor, las migraciones de Moss hasta
[`0008_vinculo.sql`](../../moss/0008_vinculo.sql), y `moss` en Settings › Data
API › *Exposed schemas* (ver «Lo que tenés que hacer vos» en
[`spec/ascent.md`](../../../spec/ascent.md)). Sin la 0008, la función responde
`interno` y el log dice `vincular_cuentas respondió 404 PGRST202`; sin exponer
`moss`, `406 PGRST106`.

## Desplegar

Desde la raíz del repo, después de `npx supabase login`:

```powershell
npx supabase functions deploy moss-vincular --project-ref okeanaihymbvbdmrdqph --no-verify-jwt
```

- `--no-verify-jwt`: la función le pregunta a Auth por las dos sesiones (lo
  mismo que `auth.getUser`), así que no depende del control de la plataforma,
  que solo entiende las claves viejas. Es lo mismo que en `moss-borrar-cuenta`.
- Sin Docker, el CLI arma la función en el servidor; si igual pide Docker,
  sumar `--use-api`.

## Probarla

**Sin Supabase:** `node herramientas/probar-vincular.mjs` la corre contra Auth y
PostgREST de mentira, y `npm run supabase:verificar`, contra las migraciones de
verdad en un Postgres local, con la app (`src/lib/ascentRemoto.ts`) llamándola.

**Desplegada**, con dos cuentas de prueba de correo (la de Ascent con nombre de
usuario) y la clave publicable:

```powershell
$base = 'https://okeanaihymbvbdmrdqph.supabase.co'
$clave = '<clave publicable>'
function Sesion($correo, $contrasena) { (Invoke-RestMethod -Method Post -Uri "$base/auth/v1/token?grant_type=password" -Headers @{ apikey = $clave } -ContentType 'application/json' -Body (@{ email = $correo; password = $contrasena } | ConvertTo-Json)).access_token }
$moss = Sesion '<correo de la cuenta de Moss>' '<contraseña>'
$ascent = Sesion '<correo de la cuenta de Ascent>' '<contraseña>'
Invoke-RestMethod -Method Post -Uri "$base/functions/v1/moss-vincular" -Headers @{ apikey = $clave; Authorization = "Bearer $moss" } -ContentType 'application/json' -Body (@{ otra = $ascent; desde = 'moss' } | ConvertTo-Json) -SkipHttpErrorCheck
```

Debería responder `ok: true` con el usuario de Ascent. Para ver el vínculo:

```powershell
Invoke-RestMethod -Method Post -Uri "$base/rest/v1/rpc/estado_del_vinculo" -Headers @{ apikey = $clave; Authorization = "Bearer $moss"; 'Content-Profile' = 'moss' } -ContentType 'application/json' -Body '{}'
```

Y para deshacerlo, lo mismo con `desvincular`. Con `vencida`, la sesión de la
otra cuenta ya pasó su hora: pedir otra.
