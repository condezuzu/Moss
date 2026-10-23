# moss-borrar-cuenta

«Borrar la cuenta» de Perfil. Borra el usuario de Auth (y con él, en cascada, todo
lo de `moss`). Si la cuenta usa Sign in with Apple, la app pide confirmar con
Apple y manda el código nuevo. Con ese código, la función revoca la autorización
con la API REST de Apple antes de borrar, como pide la App Store (5.1.1(v),
[`spec/revision.md`](../../../spec/revision.md)). Si Apple falla, no se borra
nada.

No usa paquetes ni toca `public`. Mientras no esté desplegada, la app borra con
`moss.borrar_cuenta()`, sin revocar Apple (`src/secciones/perfil/cuentaApple.ts`).

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

- Con correo: entrar con una cuenta de prueba, Perfil › Borrar la cuenta. Vuelve
  la entrada y el usuario ya no está en Authentication › Users.
- Con Apple: entrar con Apple, Perfil › Borrar la cuenta. Aparece la hoja de
  Apple y, después de Face ID, vuelve la entrada. Moss ya no está en la lista de
  apps que usan Iniciar sesión con Apple (Ajustes › tu nombre) y el usuario no
  está en Authentication › Users.
- En Edge Functions › moss-borrar-cuenta › Logs solo aparecen pasos, estados y
  códigos de error, nunca tokens.

## Qué responde

| Estado | Cuerpo | Qué pasó |
|---|---|---|
| 200 | `{"ok":true}` | Borrada (o ya no existía) |
| 400 | `{"error":"pedido"}` | El cuerpo no es `{ codigoDeApple }` |
| 401 | `{"error":"sin_sesion"}` | Sin sesión, o vencida |
| 405 | `{"error":"metodo"}` | No es POST |
| 500 | `{"error":"configuracion"}` | Faltan secretos |
| 500 | `{"error":"borrar"}` | Auth no borró el usuario |
| 500 | `{"error":"interno"}` | Otro error |
| 502 | `{"error":"auth"}` | Auth no respondió |
| 502 | `{"error":"apple","apple":"…"}` | Apple no canjeó o no revocó, y no se borró nada. `invalid_grant`: el código venció (dura cinco minutos) o ya se usó |

Nunca responde 404: para la app, 404 quiere decir que la función no está
desplegada.

## Después

- Con la función desplegada y probada, sacar el respaldo de
  `moss.borrar_cuenta()` (`sinRevocar` en `src/secciones/perfil/cuenta.ts` y en
  `cuentaApple.ts`) y, en una migración, quitarle el `grant` a `authenticated`.
- Cuando Ascent sume Sign in with Apple, conviene agruparla con `uy.moss.app`
  como App ID principal. Si no, esta función revoca solo la autorización de Moss.
