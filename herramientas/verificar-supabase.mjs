// Prueba las migraciones de Moss (supabase/moss/*.sql) en un Postgres local, sin tocar Supabase:
// PGlite es Postgres de verdad compilado a WebAssembly. Se arma lo mínimo de Supabase que usan
// (los roles, auth.users y auth.uid()) y se comprueba:
// - que solo tocan el esquema `moss` (el resto del proyecto es de Ascent): de `public` solo leen,
//   adentro de funciones security definer, sin escribir ni llamar funciones de Ascent;
// - que cada usuario ve y toca solo lo suyo (RLS), y que anon no ve nada;
// - que en un conflicto gana el cambio más nuevo y que la hora de llegada la pone la base;
// - que la semilla es la primera que llega, que los períodos se reemplazan enteros y que
//   «borrar mis datos» no toca a nadie más;
// - que lo comido (0002_comida.sql) sigue las mismas reglas, y que un borrado llega como una marca;
// - que las medidas del cuerpo y la estrategia del perfil (0003_progreso.sql) también;
// - que lo comido guarda si fue a ojo y que el catálogo lo lee cualquier usuario y no lo escribe
//   nadie desde la app (0004_medir.sql);
// - que las noches propias (la cara de la mañana y la hora sin reloj) siguen las mismas reglas
//   (0005_noches.sql);
// - que lo comido y el catálogo guardan los micronutrientes, y que las búsquedas sin resultado y
//   los reportes de errores se anotan sin usuario y no se leen desde la app (0006_alimentos.sql);
// - que lo armado por el plan guarda su opción y cómo comes va en el perfil (0007_plan.sql);
// - que tu nombre va en la fila del perfil con su propia hora: llega antes que el perfil sin
//   trabarlo, gana el más nuevo y «borrar mis datos» lo borra (0009_perfil.sql);
// - que borrar la cuenta borra todo en cascada;
// - que el teléfono baja el catálogo del servidor;
// - y la app de verdad (src/almacen) sincronizando varios teléfonos contra esta base, uno de
//   ellos con el repositorio SQLite del iPhone;
// - el vínculo con Ascent (0008_vinculo.sql), contra tablas de Ascent de mentira con las columnas
//   que lee: quién lo ve y quién lo escribe, vincular y volver a vincular, desvincular, que lo de
//   Ascent llega como lo cuenta Ascent y nunca lo de un tercero, el peso de las dos apps, y la app
//   (src/lib/ascentRemoto.ts) vinculando por la función moss-vincular de verdad.
// Uso: npm run supabase:verificar   → sale con código 1 si algo falla.

import { readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpeta = join(raiz, 'supabase/moss');
const migraciones = readdirSync(carpeta).filter((a) => a.endsWith('.sql')).sort();

let fallas = 0;
const bien = (texto) => console.log(`✓ ${texto}`);
const mal = (texto) => { fallas++; console.log(`✗ ${texto}`); };
const comprobar = (condicion, texto) => (condicion ? bien(texto) : mal(texto));

// ------------------------------------------------------------ 1. Solo el esquema moss
// Las migraciones crean y tocan solo cosas de `moss`. De Ascent (`public`) solo se lee, y solo adentro
// de una función security definer de Moss que revisa el vínculo (0008_vinculo.sql): nunca se escribe
// ni se llama una función de Ascent (spec/ascent.md, «Lo que hay que cuidar»).
const sinComentarios = (sql) => sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\$\$[\s\S]*?\$\$/g, (cuerpo) => cuerpo.replace(/'[^']*'/g, "''"));
const OTROS_ESQUEMAS = ['public', 'auth', 'storage', 'extensions', 'graphql', 'graphql_public', 'realtime', 'vault', 'net', 'cron', 'pgsodium', 'supabase_functions', 'supabase_migrations', 'pg_catalog', 'information_schema'];
/** Los cuerpos de las funciones security definer, con dónde empiezan y terminan en el texto. */
function cuerposDefiner(sql) {
  return [...sql.matchAll(/\bcreate\s+(?:or\s+replace\s+)?function\s+([\w.]+)([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3([^;]*)/gi)]
    .filter((m) => /\bsecurity\s+definer\b/i.test(m[2] + m[5]))
    .map((m) => {
      const desde = m.index + m[0].indexOf(m[3]) + m[3].length;
      return { nombre: m[1], cabeza: m[2] + m[5], cuerpo: m[4], desde, hasta: desde + m[4].length };
    });
}
/** Lo que un `x.y` puede tener adelante sin ser un esquema: alias de tablas y consultas, y la función que nombra sus parámetros. */
function nombresLocales(sql) {
  const nombres = new Set();
  const sumar = (patron) => { for (const m of sql.matchAll(patron)) nombres.add(m[1].toLowerCase()); };
  sumar(/\b(?:from|join)\s+(?:only\s+)?[a-z_][\w.]*\s+(?:as\s+)?([a-z_]\w*)/gi);
  sumar(/\b([a-z_]\w*)\s+as\s+(?:not\s+)?(?:materialized\s+)?\(/gi);
  sumar(/\)\s+(?:with\s+ordinality\s+)?(?:as\s+)?([a-z_]\w*)/gi);
  sumar(/\bfunction\s+[a-z_]\w*\.([a-z_]\w*)\s*\(/gi);
  return nombres;
}
for (const archivo of migraciones) {
  const sql = sinComentarios(readFileSync(join(carpeta, archivo), 'utf8'));
  const definer = cuerposDefiner(sql);
  const locales = nombresLocales(sql);
  const ajenos = [];
  const publicAfuera = [];
  for (const m of sql.matchAll(/\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi)) {
    const [esquema, nombre] = [m[1].toLowerCase(), m[2].toLowerCase()];
    // new, old y excluded son la fila que llega, la que estaba y la propuesta en un upsert.
    if (esquema === 'moss' || ['new', 'old', 'excluded'].includes(esquema) || (esquema === 'auth' && ['users', 'uid'].includes(nombre))) continue;
    if (esquema === 'public') {
      if (!definer.some((f) => m.index >= f.desde && m.index < f.hasta)) publicAfuera.push(m[0]);
      continue;
    }
    if (OTROS_ESQUEMAS.includes(esquema) || !locales.has(esquema)) ajenos.push(m[0]);
  }
  comprobar(!ajenos.length, `${archivo}: solo nombra objetos de moss (y auth.users, auth.uid)${ajenos.length ? ': ' + [...new Set(ajenos)].join(', ') : ''}`);
  const escriben = definer.filter((f) => /\bpublic\./i.test(f.cuerpo)
    && (/\b(?:insert\s+into|update|delete\s+from|truncate(?:\s+table)?|merge\s+into|alter\s+\w+|drop\s+\w+|create\s+(?:or\s+replace\s+)?\w+|lock(?:\s+table)?)\s+(?:only\s+)?public\./i.test(f.cuerpo)
      || /\bpublic\.\w+\s*\(/i.test(f.cuerpo) || /\bfor\s+(?:no\s+key\s+)?(?:update|share)\b/i.test(f.cuerpo)));
  comprobar(!/\bschema\s+public\b/i.test(sql) && !publicAfuera.length && !escriben.length,
    `${archivo}: de public solo lee, adentro de funciones security definer, sin escribir ni llamar funciones de Ascent${publicAfuera.length ? `: afuera, ${[...new Set(publicAfuera)].join(', ')}` : ''}${escriben.length ? `: ${escriben.map((f) => f.nombre).join(', ')}` : ''}`);
  const sinRuta = definer.filter((f) => !/\bset\s+search_path\s*=\s*''/i.test(f.cabeza));
  comprobar(!sinRuta.length, `${archivo}: cada función security definer fija search_path = ''${sinRuta.length ? `: ${sinRuta.map((f) => f.nombre).join(', ')}` : ''}`);
}

// ------------------------------------------------------------ 2. Lo mínimo de Supabase
const db = new PGlite();
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`);
// Lo de Ascent que lee 0008_vinculo.sql, solo con las columnas que lee, como en su schema.sql (versión
// 96): cada alta crea un perfil sin nombre de usuario (on_auth_user_created), y desde Moss no se lee
// nada directo, sin las funciones del vínculo.
await db.exec(`
  create table public.profiles (id uuid primary key references auth.users (id) on delete cascade, username text);
  create table public.logs (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles (id) on delete cascade,
    fecha date not null, es_descanso boolean not null default false, unique (user_id, fecha));
  create table public.sesiones (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles (id) on delete cascade,
    log_id uuid not null references public.logs (id) on delete cascade, inicio timestamptz not null default now(), fin timestamptz,
    estado text not null default 'corriendo', series int not null default 0, bloques jsonb not null default '[]');
  create table public.ejercicios (id text primary key, nombre text not null, grupo text not null);
  create table public.prs (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles (id) on delete cascade,
    ejercicio text not null references public.ejercicios (id), peso numeric(6, 2) not null, reps int not null,
    es_real boolean not null default false, fecha date not null, creado timestamptz not null default now());
  create table public.weights (
    id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles (id) on delete cascade,
    fecha date not null, valor numeric(5, 2) not null, unique (user_id, fecha));
  create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id) values (new.id);
    return new;
  end;
  $$;
  create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
  alter table public.profiles enable row level security;
  alter table public.logs enable row level security;
  alter table public.sesiones enable row level security;
  alter table public.ejercicios enable row level security;
  alter table public.prs enable row level security;
  alter table public.weights enable row level security;
  grant usage on schema public to anon, authenticated, service_role;
`);
for (const archivo of migraciones) {
  try {
    await db.exec(readFileSync(join(carpeta, archivo), 'utf8'));
    bien(`${archivo}: corre en Postgres ${(await db.query('show server_version')).rows[0].server_version}`);
  } catch (error) {
    mal(`${archivo}: no corre: ${error.message}`);
    process.exit(1);
  }
}

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';
await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}')`);

// Una consulta con la sesión de alguien, como la haría la app con su token: cada una en su
// transacción, como en PostgREST (y así now() es la hora de ese pedido).
function como(usuario, sql, parametros = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${usuario === 'anon' ? 'anon' : 'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [usuario === 'anon' ? '' : usuario]);
    return tx.query(sql, parametros);
  });
}
async function falla(usuario, sql, parametros) {
  try {
    await como(usuario, sql, parametros);
    return false;
  } catch {
    return true;
  }
}

// ------------------------------------------------------------ 3. Cada uno ve lo suyo
await como(A, `insert into moss.habitos (id, nombre, icono, dias, fuente, orden, desde) values ('meditar', 'Meditar', 'figure.mind.and.body', '{0,1,2,3,4,5,6}', '{"tipo":"manual"}', 0, '2026-10-19')`);
await como(A, `insert into moss.marcas (habito, dia, hecho, momento, origen) values ('meditar', '2026-10-21', true, '2026-10-21T10:00:00Z', 'toque')`);
await como(A, `insert into moss.dias (clave, constelacion, habitos, hechos, luz, completo) values ('2026-10-21', 'lyra', '{meditar}', '{meditar}', 3, true)`);
await como(B, `insert into moss.habitos (id, nombre, icono, dias, fuente, orden, desde) values ('leer', 'Leer', 'book', '{1,2,3,4,5}', '{"tipo":"manual"}', 0, '2026-10-19')`);

comprobar((await como(A, 'select id from moss.habitos')).rows.map((f) => f.id).join() === 'meditar', 'cada usuario ve solo sus hábitos');
comprobar((await como(B, 'select * from moss.marcas')).rows.length === 0, 'nadie ve las marcas de otro');
comprobar((await como(B, `update moss.habitos set nombre = 'x' where id = 'meditar'`)).affectedRows === 0, 'nadie cambia los hábitos de otro');
comprobar(await falla(B, `insert into moss.habitos (usuario, id, nombre, icono, dias, fuente, orden, desde) values ('${A}', 'intruso', 'x', 'x', '{1}', '{}', 0, '2026-10-19')`), 'nadie escribe a nombre de otro');
comprobar(await falla('anon', 'select * from moss.habitos'), 'sin sesión no se ve nada');
comprobar((await como(A, 'select usuario from moss.marcas')).rows[0]?.usuario === A, 'el usuario lo pone la base, no la app');

await como(A, `insert into moss.registros (id, dia, comida, momento, fuente, ref, nombre, cantidad, kcal, proteina, carbohidratos, grasas, fibra, actualizado)
  values ('r1', '2026-10-21', 'cena', '2026-10-21T22:00:00Z', 'base', '1105314', 'Banana', '{"porcion":"1 mediana","gramosPorcion":118,"veces":1}', 105, 1.3, 27, 0.4, 3.1, '2026-10-21T22:00:00Z')`);
await como(B, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas) values ('r1', '2026-10-21', 'snack', '2026-10-21T10:00:00Z', 'rapida', 'Alfajor', 250, 3, 35, 11)`);
comprobar((await como(B, 'select nombre from moss.registros')).rows.map((f) => f.nombre).join() === 'Alfajor', 'lo comido: cada uno ve solo lo suyo, aunque los ids coincidan');
comprobar(await falla(A, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas) values ('r2', '2026-10-21', 'cena', now(), 'rapida', 'x', -5, 0, 0, 0)`), 'lo comido no acepta valores negativos');
comprobar(await falla(A, `insert into moss.propios (id, nombre, codigo, por_100g) values ('p1', 'Galletas', 'abc', '{}')`), 'un código de barras son solo dígitos');
comprobar(await falla('anon', 'select * from moss.registros'), 'sin sesión no se ve nada de lo comido');

// ------------------------------------------------------------ 4. Gana el cambio más nuevo
const subirMarca = (hecho, momento, recibido = null) => como(A, `
  insert into moss.marcas (habito, dia, hecho, momento, origen, recibido) values ('meditar', '2026-10-21', $1, $2, 'toque', coalesce($3, now()))
  on conflict (usuario, habito, dia) do update set hecho = excluded.hecho, momento = excluded.momento, origen = excluded.origen, recibido = excluded.recibido`, [hecho, momento, recibido]);
const marcaDeA = async () => (await como(A, 'select hecho, recibido from moss.marcas')).rows[0];
const antes = await marcaDeA();
await subirMarca(false, '2026-10-21T09:00:00Z');
comprobar((await marcaDeA()).hecho === true, 'una marca más vieja no pisa a una más nueva');
comprobar((await marcaDeA()).recibido.getTime() === antes.recibido.getTime(), 'y tampoco cambia la hora en que llegó');
await subirMarca(false, '2026-10-21T11:00:00Z', '2000-01-01T00:00:00Z');
const despues = await marcaDeA();
comprobar(despues.hecho === false, 'una marca más nueva sí');
comprobar(despues.recibido > antes.recibido, 'la hora de llegada la pone la base, aunque la app mande otra');

const subirMeta = (kcal, momento) => como(A, `
  insert into moss.metas (desde, kcal, proteina, carbohidratos, grasas, gasto, motivo, momento) values ('2026-10-21', $1, 119, 387, 83, 2770, 'manual', $2)
  on conflict (usuario, desde) do update set kcal = excluded.kcal, momento = excluded.momento`, [kcal, momento]);
await subirMeta(2770, '2026-10-21T10:00:00Z');
await subirMeta(2500, '2026-10-21T09:00:00Z');
comprobar((await como(A, 'select kcal from moss.metas')).rows[0].kcal === 2770, 'con las metas, igual: gana la más nueva');

const subirRegistro = (kcal, borrado, actualizado) => como(A, `
  insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas, borrado, actualizado)
  values ('r1', '2026-10-21', 'cena', '2026-10-21T22:00:00Z', 'base', 'Banana', $1, 1, 27, 0.4, $2, $3)
  on conflict (usuario, id) do update set kcal = excluded.kcal, borrado = excluded.borrado, actualizado = excluded.actualizado`, [kcal, borrado, actualizado]);
await subirRegistro(210, false, '2026-10-21T21:00:00Z');
comprobar((await como(A, `select kcal from moss.registros where id = 'r1'`)).rows[0].kcal === 105, 'con lo comido, una corrección más vieja no pisa');
await subirRegistro(105, true, '2026-10-21T23:00:00Z');
comprobar((await como(A, `select borrado from moss.registros where id = 'r1'`)).rows[0].borrado === true, 'y un borrado más nuevo gana: queda la marca, la fila no se va');

// Las medidas del cuerpo y la estrategia (0003_progreso.sql): lo mismo que lo demás.
await como(A, `insert into moss.medidas (fecha, cintura, cuello, actualizado) values ('2026-10-21', 85.5, 38, '2026-10-21T08:00:00Z')`);
comprobar((await como(B, 'select * from moss.medidas')).rows.length === 0, 'las medidas: nadie ve las de otro');
comprobar(await falla(A, `insert into moss.medidas (fecha, cintura) values ('2026-10-20', 8.5)`), 'las medidas: fuera de lo posible no entran');
const subirMedidas = (cintura, borrado, actualizado) => como(A, `
  insert into moss.medidas (fecha, cintura, borrado, actualizado) values ('2026-10-21', $1, $2, $3)
  on conflict (usuario, fecha) do update set cintura = excluded.cintura, borrado = excluded.borrado, actualizado = excluded.actualizado`, [cintura, borrado, actualizado]);
await subirMedidas(90, false, '2026-10-21T07:00:00Z');
comprobar(Number((await como(A, `select cintura from moss.medidas`)).rows[0].cintura) === 85.5, 'las medidas: una más vieja no pisa');
await subirMedidas(85.5, true, '2026-10-21T09:00:00Z');
comprobar((await como(A, `select borrado from moss.medidas`)).rows[0].borrado === true, 'las medidas: un borrado más nuevo gana y queda la marca');
comprobar(
  await falla(A, `insert into moss.perfiles (nacimiento, sexo, altura_cm, actividad, objetivo, ritmo, dia_del_control) values (1990, 'm', 178, 'algo', 'bajar', 'suave', 7)`)
    && await falla(A, `insert into moss.perfiles (nacimiento, sexo, altura_cm, actividad, objetivo, ritmo, estilo) values (1990, 'm', 178, 'algo', 'bajar', 'suave', 'paleo')`),
  'la estrategia: el día del control va de 0 a 6 y el reparto es uno de los cuatro',
);
comprobar(!(await falla(A, `insert into moss.metas (desde, kcal, proteina, carbohidratos, grasas, gasto, motivo, momento) values ('2026-10-22', 2600, 150, 320, 78, 3000, 'objetivo', now())`)),
  'las metas aceptan el motivo «objetivo» (un cambio de la estrategia)');

// Las noches propias (0005_noches.sql): la cara de la mañana y la hora del sueño sin reloj.
await como(A, `insert into moss.noches (fecha, cara, actualizado) values ('2026-10-21', 4, '2026-10-21T08:00:00Z')`);
comprobar((await como(B, 'select * from moss.noches')).rows.length === 0, 'las noches: nadie ve las de otro');
comprobar(
  await falla(A, `insert into moss.noches (fecha, cara) values ('2026-10-20', 6)`)
    && await falla(A, `insert into moss.noches (fecha, dormirse) values ('2026-10-19', '2026-10-19T03:00:00Z')`)
    && await falla(A, `insert into moss.noches (fecha, dormirse, despertar, origen, confianza) values ('2026-10-18', '2026-10-18T03:00:00Z', '2026-10-18T03:20:00Z', 'confirmada', 'media')`)
    && await falla(A, `insert into moss.noches (fecha, dormirse, despertar, origen, confianza) values ('2026-10-17', '2026-10-17T03:00:00Z', '2026-10-17T11:00:00Z', 'adivinada', 'media')`)
    && await falla(A, `insert into moss.noches (fecha, dormirse, despertar, origen, confianza, estimada_dormirse) values ('2026-10-16', '2026-10-16T03:00:00Z', '2026-10-16T11:00:00Z', 'estimada', 'media', '2026-10-16T03:00:00Z')`)
    && await falla(A, `insert into moss.noches (fecha, cara, estimada_dormirse, estimada_despertar) values ('2026-10-15', 3, '2026-10-15T03:00:00Z', '2026-10-15T11:00:00Z')`),
  'las noches: la cara va de 1 a 5, las dos horas van juntas con su origen, una noche dura de 1 a 18 horas, y lo estimado va con sus dos horas y con la hora de la noche',
);
const subirNoche = (cara, dormirse, despertar, origen, actualizado) => como(A, `
  insert into moss.noches (fecha, cara, dormirse, despertar, origen, confianza, actualizado) values ('2026-10-21', $1, $2, $3, $4, case when $4::text is null then null else 'media' end, $5)
  on conflict (usuario, fecha) do update set cara = excluded.cara, dormirse = excluded.dormirse, despertar = excluded.despertar,
    origen = excluded.origen, confianza = excluded.confianza, actualizado = excluded.actualizado`, [cara, dormirse, despertar, origen, actualizado]);
await subirNoche(2, null, null, null, '2026-10-21T07:00:00Z');
comprobar(Number((await como(A, 'select cara from moss.noches')).rows[0].cara) === 4, 'las noches: una más vieja no pisa');
await subirNoche(4, '2026-10-21T03:30:00Z', '2026-10-21T11:10:00Z', 'confirmada', '2026-10-21T09:00:00Z');
comprobar((await como(A, 'select origen from moss.noches')).rows[0].origen === 'confirmada', 'las noches: la hora confirmada, más nueva, gana');

// Pesado o a ojo, y el catálogo del servidor (0004_medir.sql).
await como(A, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas, estimado) values ('r3', '2026-10-22', 'almuerzo', now(), 'base', 'Arroz', 260, 5, 57, 0.6, true)`);
comprobar(
  (await como(A, `select estimado from moss.registros where id = 'r3'`)).rows[0].estimado === true
    && (await como(A, `select estimado from moss.registros where id = 'r1'`)).rows[0].estimado === false,
  'lo comido guarda si fue a ojo, y de fábrica es pesado',
);
comprobar(
  !(await falla(A, `insert into moss.propios (id, nombre, por_100g, origen) values ('p-off', 'Leche', '{"kcal":61}', 'off')`))
    && await falla(A, `insert into moss.propios (id, nombre, por_100g, origen) values ('p-x', 'Leche', '{"kcal":61}', 'internet')`),
  'lo propio dice de dónde salen sus valores: Open Food Facts, la etiqueta o a mano',
);
await como(A, `delete from moss.propios where id = 'p-off'`);
await como(A, `delete from moss.registros where id = 'r3'`);
/** Lo que hace Moss con la clave de servicio, que no pasa por RLS. */
const comoServicio = (sql) => db.transaction(async (tx) => {
  await tx.exec('set local role service_role');
  return tx.query(sql);
});
await comoServicio(`insert into moss.catalogo (id, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas, codigos, porciones, densidad, actualizado)
  values (-200001, 'Leche entera', 'Whole milk', 61, 3.1, 4.8, 3.2, '{7730000000001}', '[{"es":"1 vaso","en":"1 glass","gramos":206}]', 1.03, '2000-01-01')`);
comprobar(
  (await como(A, 'select nombre_es from moss.catalogo')).rows.length === 1 && (await como(B, 'select nombre_es from moss.catalogo')).rows.length === 1
    && await falla('anon', 'select * from moss.catalogo'),
  'el catálogo lo lee cualquier usuario con sesión; sin sesión, nada',
);
comprobar(
  await falla(A, `insert into moss.catalogo (id, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas) values (-200002, 'x', 'x', 1, 0, 0, 0)`)
    && await falla(A, 'update moss.catalogo set kcal = 0') && await falla('anon', 'delete from moss.catalogo'),
  'el catálogo no lo escribe nadie desde la app',
);
comprobar((await como(A, 'select actualizado from moss.catalogo')).rows[0].actualizado.getFullYear() > 2000, 'la hora del cambio del catálogo la pone la base, para bajar lo nuevo');
let codigoMalo = false;
try { await comoServicio(`insert into moss.catalogo (id, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas, codigos) values (-200003, 'x', 'x', 1, 0, 0, 0, '{77a3}')`); } catch { codigoMalo = true; }
comprobar(codigoMalo, 'los códigos del catálogo son solo dígitos');

// Los micronutrientes, las búsquedas sin resultado y los reportes (0006_alimentos.sql).
await como(A, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas, micros) values ('r4', '2026-10-22', 'desayuno', now(), 'base', 'Leche', 122, 6.4, 9.6, 6.6, '{"calcio": 246}')`);
comprobar((await como(A, `select micros from moss.registros where id = 'r4'`)).rows[0].micros.calcio === 246, 'lo comido guarda sus micronutrientes');
comprobar(
  await falla(A, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas, micros) values ('r5', '2026-10-22', 'cena', now(), 'base', 'x', 1, 0, 0, 0, '[1, 2]')`),
  'los micronutrientes de lo comido son un objeto',
);
await como(A, `delete from moss.registros where id = 'r4'`);
await comoServicio(`update moss.catalogo set micros = '{"calcio": 123}', verificado = '2026-10-22', segunda = 'cnf:61' where id = -200001`);
const leche = (await como(B, 'select micros, verificado, segunda from moss.catalogo')).rows[0];
comprobar(leche.micros.calcio === 123 && leche.segunda === 'cnf:61' && leche.verificado !== null, 'el catálogo trae los micronutrientes y si está verificado');
let verificadoSolo = false;
try { await comoServicio(`update moss.catalogo set segunda = null where id = -200001`); } catch { verificadoSolo = true; }
comprobar(verificadoSolo, 'lo verificado del catálogo dice siempre con qué');
await como(A, `select moss.anotar_busqueda_vacia('  Chivito AL pan ', 'es', 'uy')`);
await como(B, `select moss.anotar_busqueda_vacia('chivito al pan', 'es', 'UY')`);
const vacias = (await comoServicio('select * from moss.busquedas_vacias')).rows;
comprobar(
  vacias.length === 1 && vacias[0].veces === 2 && vacias[0].texto === 'chivito al pan' && vacias[0].region === 'UY' && !('usuario' in vacias[0]),
  'las búsquedas sin resultado: en minúsculas, sin usuario, y la misma del mismo día suma una vez',
);
comprobar(
  await falla(A, `select moss.anotar_busqueda_vacia('x', 'es')`) && await falla(A, `select moss.anotar_busqueda_vacia('pan', 'fr')`),
  'una búsqueda sin resultado tiene al menos dos letras y el idioma de la app',
);
comprobar(
  await falla('anon', `select moss.anotar_busqueda_vacia('pan', 'es')`) && await falla(A, 'select * from moss.busquedas_vacias')
    && await falla(A, `insert into moss.busquedas_vacias (texto, idioma) values ('pan', 'es')`),
  'sin sesión no se anota ninguna búsqueda, y desde la app no se leen ni se escriben directo',
);
await como(A, `select moss.reportar_alimento(-5001, null, 'Arroz con leche', 'valores', '  Tiene más azúcar  ', 'abc123')`);
const reportes = (await comoServicio('select * from moss.reportes')).rows;
comprobar(
  reportes.length === 1 && reportes[0].nota === 'Tiene más azúcar' && String(reportes[0].alimento) === '-5001' && reportes[0].motivo === 'valores' && !('usuario' in reportes[0]),
  'un reporte guarda qué alimento, qué está mal y la nota, sin usuario',
);
comprobar(
  await falla(A, `select moss.reportar_alimento(null, null, 'x', 'valores')`) && await falla(A, `select moss.reportar_alimento(1, null, 'x', 'me cae mal')`)
    && await falla(A, `select moss.reportar_alimento(null, '12ab', 'x', 'otro')`),
  'un reporte dice de qué alimento es (su número o su código) y qué está mal, con un motivo conocido',
);
comprobar(
  await falla('anon', `select moss.reportar_alimento(1, null, 'x', 'otro')`) && await falla(A, 'select * from moss.reportes'),
  'sin sesión no se reporta, y nadie lee los reportes desde la app',
);

// ------------------------------------------------------------ 5. Semilla, períodos y borrar
const semilla = async (usuario, valor) => (await como(usuario, 'select moss.poner_semilla($1) as s', [valor])).rows[0].s;
comprobar((await semilla(B, 'primera')) === 'primera', 'la primera semilla queda');
comprobar((await semilla(B, 'segunda')) === 'primera', 'la segunda no la pisa: se devuelve la de la cuenta');
await como(B, `insert into moss.perfiles (nacimiento, sexo, altura_cm, actividad, objetivo, ritmo, actualizado) values (1990, 'm', 178, 'algo', 'mantener', 'recomendado', '2026-10-01T10:00:00Z')
  on conflict (usuario) do update set nacimiento = excluded.nacimiento, sexo = excluded.sexo, altura_cm = excluded.altura_cm, actividad = excluded.actividad,
  objetivo = excluded.objetivo, ritmo = excluded.ritmo, actualizado = excluded.actualizado`);
const perfilDeB = (await como(B, 'select nacimiento, semilla from moss.perfiles')).rows[0];
comprobar(perfilDeB.nacimiento === 1990 && perfilDeB.semilla === 'primera', 'el perfil llega después de la semilla, aunque se haya contestado antes, y la conserva');
const semana = (altos, extra) => falla(B, `update moss.perfiles set semana_altos = ${altos}, semana_extra = ${extra}, actualizado = now()`);
comprobar(
  await semana(`'{6,0}'`, 'null') && await semana(`'{7}'`, 300) && await semana(`'{6}'`, 250) && await semana(`'{0,1,2,3,4,5,6}'`, 200)
    && !(await semana(`'{6,0}'`, 300)) && !(await semana('null', 'null')),
  'repartir la semana: los días van de 0 a 6 (no todos), el extra es 200, 300 o 500, y van los dos o ninguno',
);

// El plan de comidas (0007_plan.sql): lo armado guarda su opción, y cómo comes va en el perfil.
await como(B, `update moss.perfiles set comer = '{"dieta": "vegana", "comidas": 3}', actualizado = now()`);
comprobar((await como(B, 'select comer from moss.perfiles')).rows[0].comer.dieta === 'vegana', 'cómo comes queda en el perfil');
comprobar(await falla(B, `update moss.perfiles set comer = '["vegana"]', actualizado = now()`), 'cómo comes es un objeto');
await como(B, `insert into moss.registros (id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas, planificado, plan) values ('p1', '2026-10-23', 'cena', now(), 'base', 'Pollo', 300, 40, 0, 12, true, 'pollo-arroz')`);
comprobar((await como(B, `select plan from moss.registros where id = 'p1'`)).rows[0].plan === 'pollo-arroz', 'lo armado guarda la opción de la que sale');
comprobar(await falla(B, `update moss.registros set plan = '', actualizado = now() where id = 'p1'`), 'la opción de lo armado no va vacía');
await como(B, `delete from moss.registros where id = 'p1'`);

const periodos = (lista) => como(A, 'select moss.poner_periodos($1::jsonb)', [JSON.stringify(lista)]);
await como(B, `select moss.poner_periodos('[{"dia":1,"desde":"2026-10-19","constelacion":"sagitta","cantidad":4}]'::jsonb)`);
await periodos([{ dia: 3, desde: '2026-10-19', hasta: '2026-10-21', constelacion: 'lyra', cantidad: 6 }, { dia: 3, desde: '2026-10-22', constelacion: 'crater', cantidad: 6 }]);
await periodos([{ dia: 3, desde: '2026-10-19', constelacion: 'lyra', cantidad: 6 }]);
comprobar((await como(A, 'select * from moss.periodos')).rows.length === 1, 'los períodos se reemplazan enteros');
comprobar((await como(B, 'select * from moss.periodos')).rows.length === 1, 'reemplazar los propios no toca los de otro');

await como(A, `insert into moss.pesos (fecha, kg, origen, momento) values ('2026-10-21', 74.5, 'manual', now())`);
await como(B, 'select moss.borrar_mis_datos()');
comprobar((await como(A, 'select * from moss.habitos')).rows.length === 1, '«borrar mis datos» no toca a nadie más');
comprobar((await como(B, 'select * from moss.habitos')).rows.length === 0, '«borrar mis datos» borra lo propio');
comprobar((await como(B, 'select * from moss.registros')).rows.length === 0 && (await como(A, 'select * from moss.registros')).rows.length === 1, '«borrar mis datos» también borra lo comido, y solo lo propio');
await como(B, `insert into moss.medidas (fecha, cuello) values ('2026-10-21', 34)`);
await como(B, `insert into moss.noches (fecha, cara) values ('2026-10-21', 3)`);
await como(B, 'select moss.borrar_mis_datos()');
comprobar((await como(B, 'select * from moss.medidas')).rows.length === 0 && (await como(A, 'select * from moss.medidas')).rows.length === 1, '«borrar mis datos» también borra las medidas, y solo las propias');
comprobar((await como(B, 'select * from moss.noches')).rows.length === 0 && (await como(A, 'select * from moss.noches')).rows.length === 1, '«borrar mis datos» también borra las noches, y solo las propias');
comprobar(await falla('anon', 'select moss.borrar_mis_datos()'), 'sin sesión no se puede borrar nada');

// Tu nombre (0009_perfil.sql): en la fila del perfil, con su propia hora. Una cuenta solo para esto.
const E = '00000000-0000-4000-8000-00000000000e';
await db.exec(`insert into auth.users (id) values ('${E}')`);
const ponerNombre = (usuario, valor, cuando) => como(usuario, 'select moss.poner_nombre($1, $2)', [valor, cuando]);
const filaDeE = async () => (await como(E, 'select nombre, nombre_actualizado, actualizado, nacimiento, recibido from moss.perfiles')).rows[0];
await ponerNombre(E, 'Agustín Conde', new Date(0).toISOString());
const conApple = await filaDeE();
await como(E, `insert into moss.perfiles (nacimiento, sexo, altura_cm, actividad, objetivo, ritmo, actualizado) values (1990, 'm', 178, 'algo', 'mantener', 'recomendado', '2026-10-01T10:00:00Z')
  on conflict (usuario) do update set nacimiento = excluded.nacimiento, sexo = excluded.sexo, altura_cm = excluded.altura_cm, actividad = excluded.actividad,
  objetivo = excluded.objetivo, ritmo = excluded.ritmo, actualizado = excluded.actualizado`);
const conPerfil = await filaDeE();
comprobar(
  conApple.nombre === 'Agustín Conde' && conApple.actualizado.getTime() === 0 && conPerfil.nacimiento === 1990 && conPerfil.nombre === 'Agustín Conde',
  'tu nombre llega antes que el perfil sin trabarlo, y el perfil no lo borra',
);
await ponerNombre(E, 'Agus', '2026-10-02T10:00:00Z');
const masNuevo = await filaDeE();
await ponerNombre(E, 'Viejo', '2026-10-01T10:00:00Z');
comprobar(
  masNuevo.nombre === 'Agus' && masNuevo.recibido > conPerfil.recibido && (await filaDeE()).nombre === 'Agus'
    && masNuevo.actualizado.getTime() === conPerfil.actualizado.getTime(),
  'tu nombre: gana el más nuevo y avisa que cambió (recibido), sin mover la hora del perfil',
);
await ponerNombre(E, '   ', '2026-10-03T10:00:00Z');
const sinNombre = await filaDeE();
await ponerNombre(E, 'x'.repeat(70), '2026-10-04T10:00:00Z');
comprobar(
  sinNombre.nombre === null && sinNombre.nombre_actualizado.toISOString() === '2026-10-03T10:00:00.000Z' && (await filaDeE()).nombre.length === 60,
  'tu nombre: vacío lo borra con su hora (así llega a los otros teléfonos), y no pasa de 60 letras',
);
comprobar(
  (await como(A, `select * from moss.perfiles where nombre = '${'x'.repeat(60)}'`)).rows.length === 0 && await falla('anon', `select moss.poner_nombre('x', now())`)
    && await falla(E, `update moss.perfiles set nombre = '', nombre_actualizado = now()`),
  'tu nombre: nadie más lo ve, sin sesión no se pone y nunca queda vacío (sin nombre, null)',
);
await como(E, 'select moss.borrar_mis_datos()');
comprobar((await como(E, 'select * from moss.perfiles')).rows.length === 0, '«borrar mis datos» también borra tu nombre');

// ------------------------------------------------------------ 6. Borrar la cuenta
comprobar(await falla('anon', 'select moss.borrar_cuenta()'), 'sin sesión no se puede borrar ninguna cuenta');
// Una cuenta solo para esto: las otras siguen en uso más abajo.
const D = '00000000-0000-4000-8000-00000000000d';
await db.exec(`insert into auth.users (id) values ('${D}')`);
await como(D, 'select moss.borrar_cuenta()');
const cuentas = (await db.query('select id from auth.users order by id')).rows.map((f) => f.id);
comprobar(!cuentas.includes(D) && [A, B, C].every((x) => cuentas.includes(x)), 'borrar la cuenta borra solo la de quien la llama');
await db.exec(`delete from auth.users where id = '${A}'`);
const quedan = (await db.query(`select (select count(*) from moss.habitos) + (select count(*) from moss.marcas) + (select count(*) from moss.dias)
  + (select count(*) from moss.periodos) + (select count(*) from moss.metas) + (select count(*) from moss.pesos)
  + (select count(*) from moss.registros) + (select count(*) from moss.recetas) + (select count(*) from moss.propios)
  + (select count(*) from moss.favoritos) + (select count(*) from moss.agua) + (select count(*) from moss.medidas) + (select count(*) from moss.noches) as n`)).rows[0].n;
comprobar(Number(quedan) === 0, 'borrar la cuenta borra todo en cascada');

// ------------------------------------------------------------ 7. La app contra esta base
// El código de la app es TypeScript con `@/` e imports sin extensión: Node lo corre si se le dice
// dónde está cada archivo. expo-sqlite es del teléfono: acá va sobre el SQLite de Node.
registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (especificador === 'expo-sqlite') especificador = pathToFileURL(join(raiz, 'herramientas/expo-sqlite-node.mjs')).href;
    if (especificador === '@react-native-async-storage/async-storage') especificador = pathToFileURL(join(raiz, 'herramientas/async-storage-node.mjs')).href;
    // src/lib/supabase.ts, que usa src/lib/ascentRemoto.ts: el cliente no se crea (va uno de mentira), pero se importa.
    if (especificador === 'react-native') return { url: 'data:text/javascript,export const AppState = { addEventListener() {} };', shortCircuit: true };
    if (especificador === 'react-native-url-polyfill/auto') return { url: 'data:text/javascript,', shortCircuit: true };
    if (especificador.startsWith('@/')) especificador = pathToFileURL(join(raiz, 'src', especificador.slice(2))).href;
    if (/^(\.|file:)/.test(especificador) && !/\.[a-z]+$/i.test(especificador)) {
      for (const final of ['.ts', '/index.ts']) {
        try {
          return siguiente(especificador + final, contexto);
        } catch {
          // Probar con el siguiente.
        }
      }
    }
    return siguiente(especificador, contexto);
  },
});
const { crearAlmacen } = await import('../src/almacen/almacen.ts');
const { repositorioEnMemoria, sinCambios } = await import('../src/almacen/repositorio.ts');
const { repositorioSQLite } = await import('../src/almacen/sqlite.ts');
const { crearSincronizador } = await import('../src/almacen/sincronizar.ts');
const { remotoSupabase } = await import('../src/almacen/remoto.ts');
const { mismosPeriodos } = await import('../src/dominio/constelaciones.ts');
const { aguaDelDia, delDia, itemRapido } = await import('../src/dominio/registros.ts');
const catalogo = JSON.parse(readFileSync(join(raiz, 'src/datos/constelaciones.json'), 'utf8')).constelaciones;

// Un Supabase de mentira sobre esta base: lo justo de supabase-js que usa src/almacen/remoto.ts,
// traducido a SQL como lo hace PostgREST, con la sesión del usuario.
function clienteDe(usuario) {
  const respuesta = (promesa) => promesa.then((data) => ({ data, error: null }), (error) => ({ data: null, error: { message: error.message } }));
  return {
    from(tabla) {
      return {
        select() {
          const donde = [];
          const valores = [];
          const orden = [];
          let pagina = '';
          const consulta = {
            gt: (columna, valor) => (valores.push(valor), donde.push(`${columna} > $${valores.length}`), consulta),
            gte: (columna, valor) => (valores.push(valor), donde.push(`${columna} >= $${valores.length}`), consulta),
            order: (columna) => (orden.push(columna), consulta),
            range: (desde, hasta) => ((pagina = ` limit ${hasta - desde + 1} offset ${desde}`), consulta),
            then: (bien, mal) => respuesta(como(usuario,
              `select to_jsonb(t) as fila from moss.${tabla} t${donde.length ? ` where ${donde.join(' and ')}` : ''}${orden.length ? ` order by ${orden.join(', ')}` : ''}${pagina}`,
              valores).then((r) => r.rows.map((f) => f.fila))).then(bien, mal),
          };
          return consulta;
        },
        upsert(filas, { onConflict, ignoreDuplicates = false }) {
          const lista = Array.isArray(filas) ? filas : [filas];
          const columnas = [...new Set(lista.flatMap((f) => Object.keys(f)))];
          const alChocar = ignoreDuplicates ? 'do nothing' : `do update set ${columnas.map((c) => `${c} = excluded.${c}`).join(', ')}`;
          return respuesta(como(usuario, `insert into moss.${tabla} (${columnas}) select ${columnas} from jsonb_populate_recordset(null::moss.${tabla}, $1::jsonb) on conflict (${onConflict}) ${alChocar}`, [JSON.stringify(lista)]));
        },
      };
    },
    rpc(funcion, argumentos = {}) {
      const nombres = Object.keys(argumentos);
      const valores = nombres.map((n) => (typeof argumentos[n] === 'string' ? argumentos[n] : JSON.stringify(argumentos[n])));
      return respuesta(como(usuario, `select moss.${funcion}(${nombres.map((n, i) => `${n} => $${i + 1}`).join(', ')}) as r`, valores).then((r) => r.rows[0].r));
    },
  };
}

// Empieza ayer a la tarde en Montevideo.
let reloj = Date.parse('2026-10-20T19:00:00Z');
const pasa = (minutos = 1) => { reloj += minutos * 60_000; };
const todosLosDias = [0, 1, 2, 3, 4, 5, 6];
const habito = (id, orden) => ({ id, nombre: id, icono: 'star', dias: todosLosDias, fuente: { tipo: 'manual' }, orden, desde: '2026-10-19' });

/**
 * Un teléfono de un usuario: su almacén (en SQLite, como en el iPhone, o en memoria), el reloj de
 * todos y su sincronización, con un espía en el medio.
 */
async function telefono(usuario, semillaPropia, conSQLite = false) {
  const almacen = crearAlmacen({
    abrir: conSQLite ? () => repositorioSQLite() : async () => repositorioEnMemoria(), catalogo, ahora: () => new Date(reloj), zona: () => 'America/Montevideo',
    sembrar: () => [habito('meditar', 0), habito('leer', 1), habito('agua', 2)], nuevaSemilla: () => semillaPropia,
  });
  await almacen.iniciar();
  const remoto = remotoSupabase(clienteDe(usuario));
  const espia = {
    subidas: [], bajada: null, fallar: false, durante: null,
    async subir(cambios) {
      if (espia.fallar) {
        espia.fallar = false;
        throw new Error('sin conexión');
      }
      espia.subidas.push(cambios);
      espia.durante?.();
      espia.durante = null;
      await remoto.subir(cambios);
    },
    async bajar(...argumentos) {
      espia.bajada = await remoto.bajar(...argumentos);
      return espia.bajada;
    },
  };
  return { almacen, espia, sinc: crearSincronizador({ almacen, remoto: espia, usuario }) };
}
const hechosDeHoy = (t) => t.almacen.estado().dias.get(t.almacen.estado().hoy).hechos.join();
const pendiente = async (t) => !sinCambios(await t.almacen.enCola((r) => r.pendientes()));
const enLaCuenta = async (sql) => Number((await db.query(sql.replaceAll('$U', `'${C}'`))).rows[0].n);

// El teléfono A guarda en SQLite, con el repositorio del iPhone; los otros, en memoria.
const a = await telefono(C, 'semilla-a', true);
a.almacen.marcar('meditar', true, 'toque');
a.almacen.responderCuestionario({ edad: 36, sexo: 'm', alturaCm: 178, pesoKg: 80, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado' });
await a.sinc.vuelta();
comprobar(
  (await enLaCuenta('select count(*) as n from moss.habitos where usuario = $U')) === 3
    && (await enLaCuenta('select count(*) as n from moss.marcas where usuario = $U')) === 1
    && (await enLaCuenta('select count(*) as n from moss.dias where usuario = $U')) === 1
    && (await enLaCuenta('select count(*) as n from moss.periodos where usuario = $U')) === 7
    && (await enLaCuenta('select count(*) as n from moss.logros where usuario = $U')) >= 1
    && (await enLaCuenta(`select count(*) as n from moss.perfiles where usuario = $U and semilla = 'semilla-a' and nacimiento = 1990`)) === 1
    && (await enLaCuenta('select count(*) as n from moss.metas where usuario = $U')) === 1
    && (await enLaCuenta('select count(*) as n from moss.pesos where usuario = $U')) === 1
    && !(await pendiente(a)),
  'app: un teléfono sube hábitos, constelaciones, marcas, días, logros, semilla, perfil, meta y peso, y no le queda nada pendiente',
);

const b = await telefono(C, 'semilla-b');
await b.sinc.vuelta();
const deB = b.almacen.estado();
comprobar(
  deB.semilla === 'semilla-a' && mismosPeriodos(deB.periodos, a.almacen.estado().periodos) && hechosDeHoy(b) === 'meditar'
    && deB.logros.some((l) => l.id === 'primeraLuz') && deB.perfil?.nacimiento === 1990 && deB.metas[0]?.kcal === a.almacen.estado().metas[0].kcal
    && deB.pesos[0]?.kg === 80 && (await enLaCuenta(`select count(*) as n from moss.perfiles where usuario = $U and semilla = 'semilla-a'`)) === 1,
  'app: un teléfono nuevo baja todo antes de subir: semilla, constelaciones, lo hecho hoy, logros, perfil, meta y peso',
);
comprobar(b.espia.subidas.every((c) => !c.marcas.length && !c.periodos && !c.semilla && !c.perfil && !c.metas.length), 'app: lo que bajó no vuelve a subir');

// Lo que se come, entre los dos teléfonos: lo comido, el agua, una comida guardada, un favorito y
// la cena copiada a mañana, que queda planificada.
pasa();
const hoyA = a.almacen.estado().hoy;
const banana = { fuente: 'base', ref: '1105314', nombre: 'Banana', cantidad: { porcion: '1 mediana', gramosPorcion: 118, veces: 1 }, valores: { kcal: 105.02, proteina: 1.29, carbohidratos: 26.95, grasas: 0.39, fibra: 3.07 } };
const [cena] = a.almacen.registrar([{ ...banana, estimado: true }, itemRapido('Alfajor', { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 })], { comida: 'cena' });
a.almacen.sumarAgua();
a.almacen.guardarReceta({ tipo: 'comida', nombre: 'Merienda', items: [banana], porciones: 1, pesoFinal: null });
a.almacen.ponerFavorito('base', '1105314', true);
a.almacen.copiar({ dia: hoyA, comida: 'cena' }, { dia: '2026-10-21' });
await a.sinc.vuelta();
await b.sinc.vuelta();
const comidaDeB = b.almacen.estado();
comprobar(
  delDia(comidaDeB.registros.values(), hoyA).map((r) => r.nombre).join() === 'Banana,Alfajor'
    && comidaDeB.registros.get(cena.id)?.valores.fibra === 3.07 && comidaDeB.registros.get(cena.id)?.estimado === true
    && delDia(comidaDeB.registros.values(), '2026-10-21').every((r) => r.planificado) && delDia(comidaDeB.registros.values(), '2026-10-21').length === 2
    && aguaDelDia(comidaDeB.agua.values(), hoyA) === 250 && [...comidaDeB.recetas.values()][0]?.items[0]?.nombre === 'Banana'
    && [...comidaDeB.favoritos.values()][0]?.favorito === true && !(await pendiente(b)),
  'app: lo comido, el agua, las comidas guardadas y los favoritos llegan al otro teléfono, con lo planificado y lo que fue a ojo',
);
pasa();
b.almacen.borrarRegistro(cena.id);
await b.sinc.vuelta();
await a.sinc.vuelta();
comprobar(
  delDia(a.almacen.estado().registros.values(), hoyA).map((r) => r.nombre).join() === 'Alfajor'
    && (await enLaCuenta(`select count(*) as n from moss.registros where usuario = $U and id = '${cena.id}' and borrado`)) === 1,
  'app: lo que se borra en un teléfono se borra en el otro, y en la cuenta queda la marca',
);

// Progreso: las medidas y la estrategia (el peso meta y el día del control) llegan al otro teléfono.
pasa();
a.almacen.guardarMedidas({ cintura: 85.5, cuello: 38, brazo: 999 });
a.almacen.ponerEstrategia({ pesoMeta: 71, diaDelControl: 4, estilo: 'bajaEnCarbohidratos', semana: { altos: [6, 0], extra: 300 } });
await a.sinc.vuelta();
await b.sinc.vuelta();
const medidasDeB = b.almacen.estado().medidas.get(hoyA);
comprobar(
  medidasDeB?.cintura === 85.5 && medidasDeB?.cuello === 38 && medidasDeB?.brazo === undefined
    && b.almacen.estado().perfil?.pesoMeta === 71 && b.almacen.estado().perfil?.diaDelControl === 4
    && b.almacen.estado().perfil?.semana?.altos.join() === '6,0' && b.almacen.estado().perfil?.semana?.extra === 300
    && b.almacen.estado().metas.some((m) => m.motivo === 'objetivo') && !(await pendiente(b)),
  'app: las medidas (sin lo imposible), el peso meta, el día del control, la semana repartida y las metas del reparto nuevo llegan al otro teléfono',
);

// El plan de comidas: cómo comes y lo armado (con su opción) llegan al otro teléfono; «Comí esto» también.
pasa();
a.almacen.ponerComer({ dieta: 'vegetariana', alergias: ['mani'], comidas: 3, tiempo: 'poco', noMeGusta: ['pollo-arroz'], meGusta: [] });
const armada = { comida: 'almuerzo', opcion: 'lentejas', items: [banana], valores: banana.valores };
const [delAlmuerzo] = a.almacen.planificar(hoyA, [armada], () => 13 * 60);
await a.sinc.vuelta();
await b.sinc.vuelta();
const planDeB = b.almacen.estado();
comprobar(
  planDeB.perfil?.comer?.dieta === 'vegetariana' && planDeB.perfil?.comer?.noMeGusta.join() === 'pollo-arroz'
    && planDeB.registros.get(delAlmuerzo.id)?.plan === 'lentejas' && planDeB.registros.get(delAlmuerzo.id)?.planificado === true && !(await pendiente(b)),
  'app: cómo comes y lo que armó el plan (planificado aunque sea hoy, con su opción) llegan al otro teléfono',
);
pasa();
b.almacen.confirmarComida(hoyA, 'almuerzo');
await b.sinc.vuelta();
await a.sinc.vuelta();
comprobar(a.almacen.estado().registros.get(delAlmuerzo.id)?.planificado === false, 'app: «Comí esto» en un teléfono queda anotado en el otro');

// Sueño: la cara de la mañana y la hora confirmada de una noche sin reloj llegan al otro teléfono.
pasa();
a.almacen.ponerCara(hoyA, 4);
a.almacen.ponerHoraDeLaNoche(hoyA, {
  dormirse: new Date(Date.parse(`${hoyA}T03:30:00Z`)).toISOString(), despertar: new Date(Date.parse(`${hoyA}T11:10:00Z`)).toISOString(), origen: 'corregida', confianza: 'media',
  estimada: { dormirse: new Date(Date.parse(`${hoyA}T03:00:00Z`)).toISOString(), despertar: new Date(Date.parse(`${hoyA}T11:10:00Z`)).toISOString() },
});
await a.sinc.vuelta();
await b.sinc.vuelta();
const nocheDeB = b.almacen.estado().noches.get(hoyA);
comprobar(
  nocheDeB?.cara === 4 && nocheDeB?.hora?.origen === 'corregida' && nocheDeB?.hora?.confianza === 'media'
    && nocheDeB?.hora?.estimada && Date.parse(nocheDeB.hora.estimada.dormirse) === Date.parse(`${hoyA}T03:00:00Z`) && !(await pendiente(b)),
  'app: la cara de la mañana y la hora corregida de la noche (con lo que había estimado el teléfono) llegan al otro teléfono, sin volver a subir',
);

// Tu nombre (0009_perfil.sql): el que trajo Apple llega al otro teléfono, y el que escribes le gana, sin tocar el perfil.
pasa();
a.almacen.ponerNombre('Agustín Conde', true);
await a.sinc.vuelta();
await b.sinc.vuelta();
const nombreDeApple = b.almacen.estado().nombre?.valor;
pasa();
b.almacen.ponerNombre('Agus');
await b.sinc.vuelta();
await a.sinc.vuelta();
comprobar(
  nombreDeApple === 'Agustín Conde' && a.almacen.estado().nombre?.valor === 'Agus' && a.almacen.estado().perfil?.nacimiento === 1990
    && (await enLaCuenta(`select count(*) as n from moss.perfiles where usuario = $U and nombre = 'Agus' and nacimiento = 1990`)) === 1
    && !(await pendiente(a)) && !(await pendiente(b)),
  'app: tu nombre llega al otro teléfono, el que escribes le gana al que trajo Apple y el perfil queda',
);

// Los dos sin conexión el resto del día, cada uno marca algo distinto; se sincronizan al otro día.
pasa();
a.almacen.marcar('agua', true, 'toque');
pasa();
b.almacen.marcar('leer', true, 'toque');
const ayer = a.almacen.estado().hoy;
reloj = Date.parse('2026-10-21T15:00:00Z');
a.almacen.revisarDia();
b.almacen.revisarDia();
await a.sinc.vuelta();
await b.sinc.vuelta();
await a.sinc.vuelta();
comprobar(
  [a, b].every((t) => t.almacen.estado().dias.get(ayer)?.hechos.join() === 'meditar,leer,agua')
    && (await enLaCuenta(`select count(*) as n from moss.dias where usuario = $U and clave = '${ayer}' and hechos = '{meditar,leer,agua}' and completo`)) === 1,
  'app: si dos teléfonos marcaron cosas distintas el mismo día sin conexión, ese día junta lo de los dos',
);

pasa();
b.almacen.marcar('leer', true, 'toque');
await b.sinc.vuelta();
await a.sinc.vuelta();
comprobar(hechosDeHoy(a) === 'leer', 'app: lo que se marca en un teléfono llega al otro');

pasa();
a.almacen.marcar('agua', true, 'toque');
pasa();
b.almacen.marcar('agua', false, 'deshacer');
await b.sinc.vuelta();
await a.sinc.vuelta();
await b.sinc.vuelta();
comprobar(
  hechosDeHoy(a) === 'leer' && hechosDeHoy(b) === 'leer'
    && (await enLaCuenta(`select count(*) as n from moss.marcas where usuario = $U and dia = '2026-10-21' and habito = 'agua' and not hecho`)) === 1
    && (await enLaCuenta(`select count(*) as n from moss.dias where usuario = $U and clave = '2026-10-21' and hechos = '{leer}'`)) === 1,
  'app: entre dos cambios del mismo hábito gana el más nuevo, aunque el viejo suba último',
);

pasa();
a.espia.fallar = true;
a.almacen.marcar('agua', true, 'toque');
const fallo = await a.sinc.vuelta().then(() => false, () => true);
comprobar(fallo && (await pendiente(a)), 'app: si la subida falla, lo hecho queda pendiente');
a.espia.durante = () => a.almacen.marcar('leer', false, 'deshacer');
await a.sinc.vuelta(false);
comprobar(await pendiente(a), 'app: lo que se marca mientras sube queda pendiente para la próxima');
await a.sinc.vuelta(false);
comprobar(
  !(await pendiente(a)) && (await enLaCuenta(`select count(*) as n from moss.marcas where usuario = $U and dia = '2026-10-21' and hecho`)) === 1
    && (await enLaCuenta(`select count(*) as n from moss.marcas where usuario = $U and dia = '2026-10-21' and habito = 'agua' and hecho`)) === 1,
  'app: y en la próxima sube todo',
);

// Lo ya bajado no vuelve a bajar: con los dos teléfonos al día, se hace viejo todo lo de la cuenta y se pide lo nuevo.
await b.sinc.vuelta();
await db.exec(`set session_replication_role = replica;
  ${['perfiles', 'habitos', 'marcas', 'dias', 'metas', 'pesos', 'registros', 'recetas', 'propios', 'favoritos', 'agua', 'medidas', 'noches'].map((t) => `update moss.${t} set recibido = now() - interval '1 hour';`).join(' ')}
  set session_replication_role = origin;`);
await a.sinc.vuelta();
const vacia = a.espia.bajada.datos;
pasa();
b.almacen.marcar('meditar', true, 'toque');
await b.sinc.vuelta();
await a.sinc.vuelta();
const nueva = a.espia.bajada.datos;
comprobar(
  !vacia.habitos.length && !vacia.marcas.length && !vacia.dias.length && !vacia.perfil && !vacia.semilla && !vacia.metas.length && !vacia.pesos.length
    && !vacia.registros.length && !vacia.agua.length && !vacia.recetas.length && !vacia.favoritos.length && !vacia.medidas.length && !vacia.noches.length
    && !vacia.nombre && !nueva.habitos.length && nueva.marcas.length === 1 && nueva.dias.length === 1 && hechosDeHoy(a) === 'meditar,agua' && hechosDeHoy(b) === 'meditar,agua',
  'app: al volver, baja solo lo que cambió desde la última vez',
);

// Un teléfono nuevo con años de historia: Supabase devuelve de a mil filas.
await db.query(`insert into moss.dias (usuario, clave, constelacion, habitos, hechos, luz, completo)
  select $1, d::date, null, '{meditar}', '{meditar}', 3, true from generate_series('2022-01-01'::date, '2026-01-31'::date, interval '1 day') as d`, [C]);
await db.query(`insert into moss.registros (usuario, id, dia, comida, momento, fuente, nombre, kcal, proteina, carbohidratos, grasas)
  select $1, 'viejo-' || d::date, d::date, 'cena', d, 'rapida', 'Pizza', 800, 30, 90, 35 from generate_series('2025-01-01'::date, '2025-12-31'::date, interval '1 day') as d`, [C]);
const historia = await enLaCuenta('select count(*) as n from moss.dias where usuario = $U');
const c = await telefono(C, 'semilla-c');
await c.sinc.vuelta();
comprobar(historia > 1000 && c.almacen.estado().dias.size === historia, `app: un teléfono nuevo baja todos los días aunque sean miles (${historia})`);
comprobar(
  c.almacen.estado().registros.has(cena.id) && ![...c.almacen.estado().registros.keys()].some((id) => id.startsWith('viejo-')),
  'app: de lo comido, un teléfono nuevo baja solo los últimos cuatro meses; lo viejo queda en la cuenta',
);
comprobar(c.almacen.estado().nombre?.valor === 'Agus' && !(await c.almacen.enCola((r) => r.pendientes())).nombre, 'app: un teléfono nuevo baja tu nombre, sin volver a subirlo');

const intruso = crearSincronizador({ almacen: a.almacen, remoto: remotoSupabase(clienteDe(B)), usuario: B });
const sincronizo = await intruso.vuelta();
comprobar(!sincronizo && intruso.deOtraCuenta() && (await db.query(`select count(*) as n from moss.habitos where usuario = '${B}'`)).rows[0].n === 0, 'app: los datos de un teléfono nunca se mezclan con otra cuenta');

// El catálogo del servidor (0004_medir.sql), como lo baja el teléfono: con su porción y su densidad.
const { actualizarCatalogo, filasDelCatalogo } = await import('../src/comida/catalogoLocal.ts');
await actualizarCatalogo(clienteDe(B));
const delCatalogo = (await filasDelCatalogo()).find((f) => f.id === -200001);
comprobar(delCatalogo?.nombre_es === 'Leche entera' && delCatalogo.densidad === 1.03 && delCatalogo.porciones[0]?.gramos === 206 && delCatalogo.codigos[0] === '7730000000001',
  'app: el teléfono baja el catálogo del servidor, con sus porciones, su densidad y sus códigos');

// ------------------------------------------------------------ 8. El vínculo con Ascent (0008_vinculo.sql)
// Cuentas nuevas, cada una con su perfil de Ascent sin nombre (lo crea el disparador, como en Ascent):
// MOSS es la de Moss (con Apple), ASCENT la de Ascent (con el correo), OTRA otra cuenta de Moss que
// nunca usó Ascent, SOLA una que usa las dos apps con la misma cuenta y TERCERO, alguien más.
const [MOSS, ASCENT, OTRA, SOLA, TERCERO] = ['e1', 'e2', 'e3', 'e4', 'e5'].map((x) => `00000000-0000-4000-8000-0000000000${x}`);
await db.exec(`insert into auth.users (id) values ('${MOSS}'), ('${ASCENT}'), ('${OTRA}'), ('${SOLA}'), ('${TERCERO}');
  update public.profiles set username = 'agus' where id = '${ASCENT}';
  update public.profiles set username = 'sola' where id = '${SOLA}';
  update public.profiles set username = 'tercero' where id = '${TERCERO}';
  insert into public.ejercicios (id, nombre, grupo) values ('sentadilla', 'Sentadilla', 'piernas'), ('press_mancuernas', 'Press con mancuernas', 'pecho'),
    ('dominadas', 'Dominadas', 'espalda'), ('flexiones', 'Flexiones', 'pecho'), ('cinta', 'Cinta', 'cardio'), ('propio_abc', 'Mi máquina', 'espalda');`);
const diaDeAscent = async (usuario, fecha, descanso = false) => (await db.query('insert into public.logs (user_id, fecha, es_descanso) values ($1, $2, $3) returning id', [usuario, fecha, descanso])).rows[0].id;
const sesionDeAscent = (usuario, log, { inicio, minutos = null, estado = 'terminada', series, bloques }) => db.query(
  'insert into public.sesiones (user_id, log_id, inicio, fin, estado, series, bloques) values ($1, $2, $3, $4, $5, $6, $7)',
  [usuario, log, inicio, minutos === null ? null : new Date(Date.parse(inicio) + minutos * 60_000).toISOString(), estado, series, JSON.stringify(bloques)]);
// ASCENT: el 20 una sesión abandonada (con bloques rotos, que se ignoran) y una de 55 minutos con barra,
// mancuernas y lastre; el 21 una de 3 minutos (no cuenta como duración) con el peso del cuerpo y otra
// con un ejercicio propio de un lado por vez; el 22 descanso; el 23 anotado sin cronómetro; el 24 un
// descanso con una sesión que todavía corre; y uno viejo, de septiembre.
const veinte = await diaDeAscent(ASCENT, '2026-10-20');
await sesionDeAscent(ASCENT, veinte, { inicio: '2026-10-20T20:30:00Z', estado: 'abandonada', series: 1,
  bloques: [5, { ejercicio: 3, series: 2 }, { ejercicio: 'sentadilla', series: 'abc' }, { ejercicio: 'sentadilla', series: -1, pesos: [10] }] });
await sesionDeAscent(ASCENT, veinte, { inicio: '2026-10-20T21:00:00Z', minutos: 55, series: 7, bloques: [
  { ejercicio: 'sentadilla', series: 3, pesos: [100, 100, 105], reps: [5, 5, 3], carga: 'total' },
  { ejercicio: 'press_mancuernas', series: 2, pesos: [30, null], carga: 'par' },
  { ejercicio: 'dominadas', series: 2, pesos: [10], reps: [8, 'x'], carga: 'lastre' }] });
const veintiuno = await diaDeAscent(ASCENT, '2026-10-21');
await sesionDeAscent(ASCENT, veintiuno, { inicio: '2026-10-21T11:00:00Z', minutos: 3, series: 2, bloques: [{ ejercicio: 'flexiones', series: 2, pesos: [20, 20], carga: 'corporal' }] });
await sesionDeAscent(ASCENT, veintiuno, { inicio: '2026-10-21T22:00:00Z', minutos: 40, series: 4,
  bloques: [{ ejercicio: 'propio_abc', series: 4, pesos: [50, 50, '55', true], reps: [10, 10, 8.5, 1000], carga: 'una' }] });
await diaDeAscent(ASCENT, '2026-10-22', true);
await diaDeAscent(ASCENT, '2026-10-23');
await sesionDeAscent(ASCENT, await diaDeAscent(ASCENT, '2026-10-24', true), { inicio: '2026-10-24T12:00:00Z', estado: 'corriendo', series: 3, bloques: [{ ejercicio: 'cinta', series: 1, minutos: 30 }] });
await sesionDeAscent(ASCENT, await diaDeAscent(ASCENT, '2026-09-01'), { inicio: '2026-09-01T21:00:00Z', minutos: 60, series: 5, bloques: [{ ejercicio: 'sentadilla', series: 5, pesos: [90, 90, 90, 90, 90] }] });
await db.exec(`insert into public.prs (user_id, ejercicio, peso, reps, es_real, fecha) values
    ('${ASCENT}', 'sentadilla', 140, 1, true, '2026-06-01'), ('${ASCENT}', 'sentadilla', 115, 5, false, '2026-10-15'),
    ('${ASCENT}', 'press_mancuernas', 32, 8, false, '2026-10-18'), ('${ASCENT}', 'dominadas', 20, 3, false, '2026-05-01'), ('${ASCENT}', 'dominadas', 10, 5, false, '2026-10-19');
  insert into public.weights (user_id, fecha, valor) values ('${ASCENT}', '2026-10-20', 80), ('${ASCENT}', '2026-10-21', 79.8), ('${ASCENT}', '2026-10-23', 79.5), ('${ASCENT}', '2026-09-10', 82);
  insert into moss.pesos (usuario, fecha, kg, origen, momento) values ('${MOSS}', '2026-10-21', 79.6, 'salud', now()), ('${MOSS}', '2026-10-22', 79.7, 'manual', now()), ('${MOSS}', '2026-09-15', 81, 'manual', now());
  insert into public.prs (user_id, ejercicio, peso, reps, es_real, fecha) values ('${TERCERO}', 'sentadilla', 250, 1, true, '2026-10-25');
  insert into public.weights (user_id, fecha, valor) values ('${TERCERO}', '2026-10-25', 95), ('${SOLA}', '2026-10-22', 60);
  insert into moss.pesos (usuario, fecha, kg, origen, momento) values ('${TERCERO}', '2026-10-25', 94, 'manual', now()), ('${SOLA}', '2026-10-23', 59.5, 'manual', now());`);
await sesionDeAscent(TERCERO, await diaDeAscent(TERCERO, '2026-10-25'), { inicio: '2026-10-25T21:00:00Z', minutos: 70, series: 4, bloques: [{ ejercicio: 'sentadilla', series: 4, pesos: [200, 200, 200, 200] }] });
await sesionDeAscent(SOLA, await diaDeAscent(SOLA, '2026-10-22'), { inicio: '2026-10-22T09:00:00Z', minutos: 30, series: 2, bloques: [{ ejercicio: 'press_mancuernas', series: 2, pesos: [10, 10], carga: 'par' }] });

const vinculos = async () => (await db.query('select moss, ascent, origen from moss.vinculo order by desde, moss')).rows.map((v) => `${v.moss.slice(-2)}-${v.ascent.slice(-2)}-${v.origen}`).join();
const vincularConLaClave = (cuentaMoss, cuentaAscent, origen) => db.transaction(async (tx) => {
  await tx.exec('set local role service_role');
  return (await tx.query('select moss.vincular_cuentas(cuenta_moss => $1, cuenta_ascent => $2, origen => $3) as r', [cuentaMoss, cuentaAscent, origen])).rows[0].r;
});
const errorAlVincular = (...argumentos) => vincularConLaClave(...argumentos).then(() => null, (e) => e.message);
const estadoDe = async (u) => (await como(u, 'select moss.estado_del_vinculo() as r')).rows[0].r;
const sesionesDe = async (u, desde = '2026-10-01') => (await como(u, 'select moss.ascent_sesiones($1) as r', [desde])).rows[0].r;
const marcasDe = async (u, desde = '2026-09-01') => (await como(u, 'select moss.ascent_marcas($1) as r', [desde])).rows[0].r;
const pesosDe = async (u, app = 'moss', desde = '2026-10-01') => (await como(u, 'select moss.pesos_compartidos($1, $2) as r', [desde, app])).rows[0].r;
const pesosEnTexto = (lista) => lista.map((p) => `${p.fecha} ${Number(p.kg)} ${p.de}`).join(', ');

comprobar(
  JSON.stringify(await estadoDe(MOSS)) === JSON.stringify({ desde: null, nombre: null, vinculada: false })
    && !(await sesionesDe(MOSS)).length && !(await marcasDe(MOSS, '2000-01-01')).length && !(await pesosDe(MOSS)).length,
  'vínculo: sin vincular, no está vinculada y las lecturas cruzadas no devuelven nada',
);
comprobar(
  await falla(MOSS, `insert into moss.vinculo (moss, ascent, origen) values ('${MOSS}', '${ASCENT}', 'moss')`)
    && await falla(MOSS, `select moss.vincular_cuentas('${MOSS}', '${ASCENT}', 'moss')`) && await falla('anon', `select moss.vincular_cuentas('${MOSS}', '${ASCENT}', 'moss')`)
    && await falla('anon', 'select moss.estado_del_vinculo()') && await falla('anon', `select moss.ascent_sesiones('2026-10-01')`) && !(await vinculos()),
  'vínculo: nadie lo escribe desde la app, ni en la tabla ni con moss.vincular_cuentas (solo la clave de servicio); sin sesión no se pregunta nada',
);
comprobar(
  (await errorAlVincular(MOSS, OTRA, 'moss')) === 'sin_ascent' && (await errorAlVincular(MOSS, ASCENT, 'web')) === 'pedido' && (await errorAlVincular(MOSS, null, 'moss')) === 'pedido' && !(await vinculos()),
  'vínculo: la cuenta de Ascent tiene que tener nombre de usuario (si no, sin_ascent), y sin las dos cuentas o desde otra app no se vincula',
);
const vinculoNuevo = await vincularConLaClave(MOSS, ASCENT, 'moss');
const estadoDeMoss = await estadoDe(MOSS);
comprobar(
  vinculoNuevo?.nombre === 'agus' && (await vinculos()) === 'e1-e2-moss' && estadoDeMoss.vinculada === true && estadoDeMoss.nombre === 'agus' && !Number.isNaN(Date.parse(estadoDeMoss.desde))
    && JSON.stringify(await estadoDe(ASCENT)) === JSON.stringify(estadoDeMoss) && (await estadoDe(TERCERO)).vinculada === false,
  'vínculo: se vincula una cuenta de Moss con una de Ascent, y las dos ven el mismo estado (con el usuario de Ascent); un tercero no',
);
comprobar(
  (await como(MOSS, 'select * from moss.vinculo')).rows.length === 1 && (await como(ASCENT, 'select * from moss.vinculo')).rows.length === 1
    && !(await como(TERCERO, 'select * from moss.vinculo')).rows.length && await falla('anon', 'select * from moss.vinculo')
    && await falla(MOSS, `update moss.vinculo set origen = 'ascent'`) && await falla(ASCENT, 'delete from moss.vinculo') && (await vinculos()) === 'e1-e2-moss',
  'vínculo: cada cuenta ve solo su vínculo (de los dos lados) y nadie lo cambia ni lo borra directo',
);

const sesiones = await sesionesDe(MOSS);
const resumen = (lista) => lista.map((d) => `${d.fecha} ${d.series} ${Number(d.kilos)} ${Number(d.minutos)} ${d.inicio ? new Date(d.inicio).toISOString().slice(11, 16) : '-'}`).join(', ');
const ejerciciosDel = (fecha) => sesiones.find((d) => d.fecha === fecha)?.ejercicios.map((e) => `${e.id}:${e.nombre}:${e.musculos.join('/')}:${e.series.map((x) => `${x.kilos ?? '-'}x${x.reps ?? '-'}`).join(' ')}`).join(', ');
comprobar(
  resumen(sesiones) === '2026-10-20 8 375 55 20:30, 2026-10-21 6 200 40 11:00, 2026-10-23 0 0 0 -, 2026-10-24 3 0 0 12:00',
  `vínculo: los días de gimnasio de Ascent, juntando las sesiones de cada día, con el peso movido como lo cuenta Ascent (${resumen(sesiones)})`,
);
comprobar(
  ejerciciosDel('2026-10-20') === 'sentadilla:Sentadilla:piernas:100x5 100x5 105x3, press_mancuernas:Press con mancuernas:pecho:60x- -x-, dominadas:Dominadas:espalda:10x8 -x-'
    && ejerciciosDel('2026-10-21') === 'flexiones:Flexiones:pecho:-x- -x-, propio_abc:Mi máquina:espalda:100x10 100x10 -x- -x-'
    && ejerciciosDel('2026-10-23') === '' && ejerciciosDel('2026-10-24') === 'cinta:Cinta:cardio:-x-',
  'vínculo: cada ejercicio con su nombre, su grupo y sus series (×2 con mancuernas o un lado por vez, el lastre solo, el peso del cuerpo sin número, lo roto afuera)',
);
const marcas = (lista) => lista.map((m) => `${m.fecha} ${m.ejercicio} ${Number(m.kilos)}x${m.reps}`).join(', ');
comprobar(
  marcas(await marcasDe(MOSS)) === '2026-05-01 Dominadas 20x3, 2026-06-01 Sentadilla 140x1, 2026-10-15 Sentadilla 115x5, 2026-10-18 Press con mancuernas 32x8, 2026-10-19 Dominadas 10x5'
    && marcas(await marcasDe(MOSS, '2026-10-16')) === '2026-05-01 Dominadas 20x3, 2026-06-01 Sentadilla 140x1, 2026-10-18 Press con mancuernas 32x8, 2026-10-19 Dominadas 10x5',
  'vínculo: las marcas desde una fecha y, de cada ejercicio, la mejor de siempre aunque sea de antes',
);
comprobar(
  pesosEnTexto(await pesosDe(MOSS)) === '2026-10-20 80 ascent, 2026-10-21 79.6 moss, 2026-10-22 79.7 moss, 2026-10-23 79.5 ascent'
    && pesosEnTexto(await pesosDe(ASCENT, 'ascent')) === '2026-10-20 80 ascent, 2026-10-21 79.8 ascent, 2026-10-22 79.7 moss, 2026-10-23 79.5 ascent'
    && pesosEnTexto(await pesosDe(MOSS, 'moss', '2026-09-01')).startsWith('2026-09-10 82 ascent, 2026-09-15 81 moss'),
  'vínculo: el peso de las dos apps junto, uno por día, desde las dos; el día que hay de las dos gana el de la app que pregunta',
);
const deMoss = JSON.stringify([await sesionesDe(MOSS, '2000-01-01'), await marcasDe(MOSS, '2000-01-01'), await pesosDe(MOSS, 'moss', '2000-01-01')]);
comprobar(
  !deMoss.includes('2026-10-25') && !deMoss.includes('250') && !/\b9[45]\b/.test(deMoss) && !(await sesionesDe(ASCENT)).length && !(await marcasDe(ASCENT)).length
    && !(await sesionesDe(TERCERO)).length && !(await marcasDe(TERCERO)).length && !(await pesosDe(TERCERO)).length,
  'vínculo: nunca llega nada de un tercero, y lo de Ascent lo lee solo la cuenta de Moss del vínculo',
);

await vincularConLaClave(OTRA, ASCENT, 'ascent');
comprobar(
  (await vinculos()) === 'e3-e2-ascent' && !(await estadoDe(MOSS)).vinculada && !(await sesionesDe(MOSS)).length && (await sesionesDe(OTRA)).length === 4,
  'vínculo: vincular otra vez borra el vínculo anterior de esa cuenta de Ascent, y la de Moss de antes deja de leerla',
);
await vincularConLaClave(SOLA, SOLA, 'moss');
comprobar(
  (await estadoDe(SOLA)).nombre === 'sola' && resumen(await sesionesDe(SOLA)) === '2026-10-22 2 40 30 09:00' && pesosEnTexto(await pesosDe(SOLA)) === '2026-10-22 60 ascent, 2026-10-23 59.5 moss'
    && (await vinculos()) === 'e3-e2-ascent,e4-e4-moss',
  'vínculo: la misma cuenta en las dos apps se vincula consigo misma y lee lo suyo de Ascent',
);
await vincularConLaClave(SOLA, ASCENT, 'moss');
comprobar((await vinculos()) === 'e4-e2-moss', 'vínculo: vincular borra los vínculos anteriores de las dos cuentas, de cualquier lado');
await como(ASCENT, 'select moss.desvincular()');
await como(ASCENT, 'select moss.desvincular()');
comprobar(!(await vinculos()) && !(await estadoDe(SOLA)).vinculada && await falla('anon', 'select moss.desvincular()'), 'vínculo: se desvincula desde cualquiera de los dos lados, y otra vez no pasa nada');

await vincularConLaClave(MOSS, ASCENT, 'moss');
await como(MOSS, 'select moss.borrar_mis_datos()');
comprobar(
  (await vinculos()) === 'e1-e2-moss' && pesosEnTexto(await pesosDe(MOSS)) === '2026-10-20 80 ascent, 2026-10-21 79.8 ascent, 2026-10-23 79.5 ascent' && (await sesionesDe(MOSS)).length === 4,
  'vínculo: «borrar mis datos de Moss» borra lo de Moss y no toca Ascent ni el vínculo (se quita desde Perfil)',
);

// La app (src/lib/ascentRemoto.ts) y la función moss-vincular, contra esta base: Auth de mentira (cada
// token es de una cuenta) y PostgREST como lo llama la función, con la clave de servicio.
const SECRETA = 'sb_secret_de_prueba';
globalThis.Deno = { env: { get: (k) => ({ SUPABASE_URL: 'https://proyecto.supabase.co', SUPABASE_SECRET_KEYS: JSON.stringify({ default: SECRETA }) })[k] } };
const { default: funcionVincular } = await import('../supabase/functions/moss-vincular/index.ts');
const ascentRemoto = await import('../src/lib/ascentRemoto.ts');
const tokenDe = (cuenta) => `token-${cuenta}`;
const deJson = (estado, cuerpo) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
const fetchDeVerdad = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const headers = new Headers(init.headers);
  if (String(url) === 'https://proyecto.supabase.co/auth/v1/user') {
    const cuenta = /^Bearer token-(.+)$/.exec(headers.get('authorization') ?? '')?.[1];
    if (!cuenta) return deJson(401, { code: 'bad_jwt' });
    const existe = (await db.query('select 1 from auth.users where id::text = $1', [cuenta])).rows.length;
    return existe ? deJson(200, { id: cuenta }) : deJson(403, { code: 'user_not_found' });
  }
  if (String(url) === 'https://proyecto.supabase.co/rest/v1/rpc/vincular_cuentas') {
    if (headers.get('apikey') !== SECRETA) return deJson(401, { code: 'PGRST301', message: 'sin la clave' });
    if (headers.get('content-profile') !== 'moss') return deJson(404, { code: 'PGRST202', message: 'no está en public' });
    const { cuenta_moss, cuenta_ascent, origen } = JSON.parse(init.body);
    try {
      return deJson(200, await vincularConLaClave(cuenta_moss, cuenta_ascent, origen));
    } catch (e) {
      return deJson(e.code === '23505' ? 409 : /^(P0001|22)/.test(e.code ?? '') ? 400 : 500, { code: e.code, message: e.message });
    }
  }
  throw new Error(`pedido inesperado a ${url}`);
};
/** El cliente de la app, con la sesión de una cuenta (o sin sesión) y las funciones del servidor. */
const conSesion = (cuenta) => ({
  ...clienteDe(cuenta),
  auth: { getSession: async () => ({ data: { session: cuenta ? { access_token: tokenDe(cuenta) } : null }, error: null }) },
  functions: {
    async invoke(funcion, { body, headers }) {
      const r = await funcionVincular.fetch(new Request(`https://proyecto.supabase.co/functions/v1/${funcion}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      return r.ok ? { data: await r.json(), error: null, response: r } : { data: null, error: new Error('FunctionsHttpError'), response: r };
    },
  },
});
await como(MOSS, 'select moss.desvincular()');
ascentRemoto.probarCon(() => conSesion(MOSS));
const errores = [await ascentRemoto.vincular(''), await ascentRemoto.vincular(tokenDe('00000000-0000-4000-8000-0000000000ff')), await ascentRemoto.vincular(tokenDe(OTRA))].map((r) => r.ok || r.error).join();
ascentRemoto.probarCon(() => conSesion(null));
const sinSesion = await ascentRemoto.vincular(tokenDe(ASCENT));
ascentRemoto.probarCon(() => conSesion(MOSS));
const vinculada = await ascentRemoto.vincular(tokenDe(ASCENT));
comprobar(
  errores === 'vencida,vencida,sin_ascent' && !sinSesion.ok && sinSesion.error === 'sin_sesion' && vinculada.ok && vinculada.nombre === 'agus' && (await vinculos()) === 'e1-e2-moss',
  'app: vincular pasa por moss-vincular con las dos sesiones: una sesión de Ascent vencida, una cuenta que nunca usó Ascent o sin sesión en Moss no vinculan',
);
const estadoEnLaApp = await ascentRemoto.estadoDelVinculo();
const enLaApp = await ascentRemoto.sesionesDeAscent('2026-10-01');
const primera = enLaApp[0]?.ejercicios[0];
comprobar(
  estadoEnLaApp.vinculada && estadoEnLaApp.nombre === 'agus' && typeof estadoEnLaApp.desde === 'string'
    && enLaApp.map((d) => `${d.fecha} ${d.series} ${d.kilos} ${d.minutos} ${'inicio' in d}`).join() === '2026-10-20 8 375 55 true,2026-10-21 6 200 40 true,2026-10-23 0 0 0 false,2026-10-24 3 0 0 true'
    && primera?.id === 'sentadilla' && primera.nombre === 'Sentadilla' && primera.musculos.join() === 'piernas' && primera.series[2].kilos === 105 && primera.series[2].reps === 3
    && enLaApp[0].ejercicios[1].series[1].kilos === null,
  'app: el estado del vínculo y los días de gimnasio de Ascent llegan con la forma de src/lib/ascentRemoto.ts',
);
const marcasEnLaApp = await ascentRemoto.marcasDeAscent('2026-10-16');
const pesosEnLaApp = await ascentRemoto.pesosCompartidos('2026-10-01');
comprobar(
  marcasEnLaApp.map((m) => `${m.id} ${m.ejercicio} ${m.fecha} ${m.kilos} ${m.reps}`).join() === 'dominadas Dominadas 2026-05-01 20 3,sentadilla Sentadilla 2026-06-01 140 1,press_mancuernas Press con mancuernas 2026-10-18 32 8,dominadas Dominadas 2026-10-19 10 5'
    && pesosEnLaApp.map((p) => `${p.fecha} ${p.kg} ${p.de}`).join() === '2026-10-20 80 ascent,2026-10-21 79.8 ascent,2026-10-23 79.5 ascent',
  'app: las marcas y el peso compartido llegan con la forma de src/lib/ascentRemoto.ts',
);
const desdeAscent = await funcionVincular.fetch(new Request('https://proyecto.supabase.co/functions/v1/moss-vincular', {
  method: 'POST', headers: { Authorization: `Bearer ${tokenDe(ASCENT)}` }, body: JSON.stringify({ otra: tokenDe(MOSS), desde: 'ascent' }),
}));
comprobar(desdeAscent.status === 200 && (await desdeAscent.json()).nombre === 'agus' && (await vinculos()) === 'e1-e2-ascent', 'app: desde Ascent se vincula igual, con las cuentas al revés');
await ascentRemoto.desvincular();
comprobar(!(await ascentRemoto.estadoDelVinculo()).vinculada && !(await ascentRemoto.sesionesDeAscent('2026-10-01')).length && !(await vinculos()), 'app: desvincular desde Moss');
ascentRemoto.probarCon(() => null);
const sinSupabase = [await ascentRemoto.estadoDelVinculo(), await ascentRemoto.sesionesDeAscent('2026-10-01'), await ascentRemoto.marcasDeAscent('2026-10-01'),
  await ascentRemoto.pesosCompartidos('2026-10-01'), await ascentRemoto.vincular(tokenDe(ASCENT)), await ascentRemoto.desvincular()];
ascentRemoto.probarCon(() => ({ ...conSesion(MOSS), rpc: async () => ({ data: null, error: { message: 'Failed to fetch' } }), functions: { invoke: async () => ({ data: null, error: new Error('FunctionsFetchError') }) } }));
const sinConexion = [await ascentRemoto.sesionesDeAscent('2026-10-01').then(() => 'resolvió', () => 'rechazó'), await ascentRemoto.estadoDelVinculo().then(() => 'resolvió', () => 'rechazó'), (await ascentRemoto.vincular(tokenDe(ASCENT))).error];
comprobar(
  JSON.stringify(sinSupabase) === JSON.stringify([{ vinculada: false, nombre: null, desde: null }, [], [], [], { ok: false, error: 'sin_sesion' }, null]) && sinConexion.join() === 'rechazó,rechazó,red',
  'app: sin Supabase no hay vínculo ni nada que leer; sin conexión las lecturas se rechazan (queda lo que había) y vincular dice «red»',
);
globalThis.fetch = fetchDeVerdad;

// Borrar la cuenta, de cualquiera de los dos lados, borra el vínculo.
await vincularConLaClave(MOSS, ASCENT, 'moss');
await vincularConLaClave(SOLA, SOLA, 'moss');
await db.exec(`delete from auth.users where id = '${ASCENT}'`);
const sinAscent = await vinculos();
await como(SOLA, 'select moss.borrar_cuenta()');
comprobar(sinAscent === 'e4-e4-moss' && !(await vinculos()), 'vínculo: borrar la cuenta (la de Ascent, la de Moss o la misma de las dos) borra el vínculo');

await db.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron.` : '\nTodo bien.');
process.exit(fallas ? 1 : 0);
