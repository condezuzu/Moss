# moss-borrar-cuenta

«Borrar la cuenta» de Perfil: borra la cuenta de Moss. Si usa Sign in with Apple,
la app pide confirmar con Apple y manda el código nuevo. Con ese código, la
función revoca la autorización con la API REST de Apple antes de borrar, como
pide la App Store (5.1.1(v), [`spec/revision.md`](../../../spec/revision.md)). Si
Apple falla, no se borra nada.

La cuenta de Moss y la de Ascent son dos cuentas (D29, [`spec/ascent.md`](../../../spec/ascent.md),
«Dos cuentas»), aunque a veces sean el mismo usuario de Auth: si alguien entra a
Moss con un Apple ID cuyo correo es el de su cuenta de Ascent, Supabase une Apple
a ese usuario. Por eso, después de Apple:

1. `moss.borrar_cuenta(cuenta)` ([`0008_vinculo.sql`](../../moss/0008_vinculo.sql),
   solo con la clave de servicio) borra todo lo de Moss de esa cuenta y sus
   vínculos del lado de Moss.
2. **Solo de Moss** (todas sus identidades son de Apple): borra el usuario de
   Auth.
3. **También es la cuenta de Ascent** (tiene otra identidad, el correo): no borra
   el usuario. Le quita la identidad de Apple con la sesión de quien llama (lo
   mismo que `auth.unlinkIdentity()`; Auth no tiene un pedido de administración
   para esto), y la cuenta de Ascent queda intacta. Necesita *Allow manual
   linking* en Authentication › Sign In / Providers; sin eso responde
   `configuracion`, con lo de Moss ya borrado, y volver a intentarlo después de
   activarlo termina.

La decisión sale de las identidades que devuelve Auth: la función no usa paquetes
ni lee ni escribe `public`. Sin la función desplegada, la app no borra la cuenta
(no hay otro camino que revoque Apple y deje intacta la de Ascent).

## 1. La clave de Apple (una vez)

En [Apple Developer](https://developer.apple.com/account/resources), equipo
`XF9N8X9KJG`:

1. Identifiers › `uy.moss.app`: que tenga **Sign in with Apple** marcado, como
   App ID principal. La primera `eas build` ya lo deja así.
2. Keys › **+** › un nombre (por ejemplo «Moss Sign in with Apple») › marcar
   **Sign in with Apple** › **Configure** › Primary App ID `uy.moss.app` › Save ›
   Continue › confirmar.
3. **Download**: baja `AuthKey_XXXXXXXXXX.p8`. Apple no la deja bajar otra vez.
   Guardala en el gestor de contraseñas, nunca en el repo (`*.p8` ya está en
   `.gitignore`).
4. El **Key ID** son los 10 caracteres debajo del nombre de la clave, los mismos
   del nombre del archivo.

## 2. Los secretos

En PowerShell, en la carpeta donde está la `.p8` (la clave va en una línea, sin
las de `BEGIN` y `END`; la función acepta también la `.p8` entera):

```powershell
npx supabase login
$clave = (Get-Content .\AuthKey_XXXXXXXXXX.p8 | Where-Object { $_ -notmatch '-----' }) -join ''
npx supabase secrets set APPLE_TEAM_ID=XF9N8X9KJG APPLE_KEY_ID=XXXXXXXXXX APPLE_CLIENT_ID=uy.moss.app "APPLE_PRIVATE_KEY=$clave" --project-ref okeanaihymbvbdmrdqph
```

`APPLE_CLIENT_ID` es optativo: sin él usa `uy.moss.app`. También se pueden
cargar en el panel, en Edge Functions › Secrets. `SUPABASE_URL` y las claves de
Supabase las pone la plataforma sola. La función usa la secreta nueva
(`SUPABASE_SECRET_KEYS`) y, si no está, la `service_role`.

## 3. Desplegar

Desde la raíz del repo:

```powershell
npx supabase functions deploy moss-borrar-cuenta --project-ref okeanaihymbvbdmrdqph --no-verify-jwt
```

- `--no-verify-jwt`: la función le pregunta a Auth por la sesión de quien llama
  (lo mismo que `auth.getUser`), así que no depende del control de la
  plataforma. Según la guía de las claves nuevas de Supabase, ese control solo
  entiende las claves viejas, y la guía pide apagarlo cuando la función
  autoriza por su cuenta.
- Sin Docker, el CLI arma la función en el servidor; si igual pide Docker,
  sumar `--use-api`.
- Cambiar un secreto no pide volver a desplegar.

## 4. Probarla

**Que está y que la clave de Apple sirve, sin borrar nada.** Con una cuenta de
prueba de correo y la clave publicable de Moss:

```powershell
$base = 'https://okeanaihymbvbdmrdqph.supabase.co'
$sesion = Invoke-RestMethod -Method Post -Uri "$base/auth/v1/token?grant_type=password" -Headers @{ apikey = '<clave publicable>' } -ContentType 'application/json' -Body (@{ email = '<correo de prueba>'; password = '<contraseña>' } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/functions/v1/moss-borrar-cuenta" -Headers @{ Authorization = "Bearer $($sesion.access_token)" } -ContentType 'application/json' -Body '{"codigoDeApple":"prueba"}' -SkipHttpErrorCheck
```

Debería responder `error: apple` y `apple: invalid_grant`: Apple aceptó la clave
y rechazó el código de mentira, así que la cuenta sigue ahí. Con
`invalid_client`, no coinciden la clave, el Key ID, el equipo o el Client ID.
Con `clave`, la `.p8` no se pudo leer. Con `sin_sesion`, la sesión venció o la
clave secreta de Supabase no sirve (el log dice qué respondió Auth).

**En el iPhone, de punta a punta:**

- Solo de Moss: entrar con un Apple ID cuyo correo no tenga cuenta de Ascent (u
  ocultándolo), Perfil › Borrar la cuenta. Aparece la hoja de Apple y, después
  de Face ID, vuelve la entrada. Moss ya no está en la lista de apps que usan
  Iniciar sesión con Apple (Ajustes › tu nombre) y el usuario no está en
  Authentication › Users.
- La misma cuenta que Ascent: con una cuenta de prueba de Ascent, entrar a Moss
  con un Apple ID con ese mismo correo (Authentication › Users muestra un solo
  usuario con las dos identidades), vincular y borrar la cuenta en Moss. El
  usuario sigue, con la identidad `email` sola; Ascent entra igual, con todo lo
  suyo, y ya no ve el vínculo; en `moss` no queda nada de ese usuario.
- En Edge Functions › moss-borrar-cuenta › Logs solo aparecen pasos, estados y
  códigos de error, nunca tokens.

## Qué responde

| Estado | Cuerpo | Qué pasó |
|---|---|---|
| 200 | `{"ok":true}` | Borrada con el usuario de Auth (o ya no existía) |
| 200 | `{"ok":true,"queda":true}` | Borrado lo de Moss y quitado Apple; el usuario sigue porque también es la cuenta de Ascent |
| 400 | `{"error":"pedido"}` | El cuerpo no es `{ codigoDeApple }` |
| 401 | `{"error":"sin_sesion"}` | Sin sesión, o vencida |
| 405 | `{"error":"metodo"}` | No es POST |
| 500 | `{"error":"configuracion"}` | Faltan secretos, o falta *Allow manual linking* para quitar Apple (lo de Moss ya se borró) |
| 500 | `{"error":"borrar"}` | No se borró lo de Moss (y entonces nada más), o Auth no borró el usuario |
| 500 | `{"error":"separar"}` | Lo de Moss se borró, pero Auth no quitó Apple: volver a intentarlo |
| 500 | `{"error":"interno"}` | Otro error |
| 502 | `{"error":"auth"}` | Auth no respondió |
| 502 | `{"error":"apple","apple":"…"}` | Apple no canjeó o no revocó, y no se borró nada. `invalid_grant`: el código venció (dura cinco minutos) o ya se usó |

Nunca responde 404: para la app, 404 quiere decir que la función no está
desplegada, y entonces no borra nada.

## Después

- **Si Ascent suma Sign in with Apple**, «solo tiene Apple» deja de querer decir
  «es solo de Moss»: Apple le da el mismo identificador a una persona en todas
  las apps del equipo, así que el mismo Apple ID caería en el mismo usuario de
  Auth para las dos, y esta función lo borraría con lo de Ascent. Antes de ese
  cambio hay que decidir otra señal (ver `spec/ascent.md`, «Dos cuentas»).
- Revocar con `client_id` `uy.moss.app` corta solo la autorización de Moss.
