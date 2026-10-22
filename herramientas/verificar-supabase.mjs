// Prueba las migraciones de Moss (supabase/moss/*.sql) en un Postgres local, sin tocar Supabase:
// PGlite es Postgres de verdad compilado a WebAssembly. Se arma lo mínimo de Supabase que usan
// (los roles, auth.users y auth.uid()) y se comprueba:
// - que solo tocan el esquema `moss` (el resto del proyecto es de Ascent);
// - que cada usuario ve y toca solo lo suyo (RLS), y que anon no ve nada;
// - que en un conflicto gana el cambio más nuevo y que la hora de llegada la pone la base;
// - que la semilla es la primera que llega, que los períodos se reemplazan enteros y que
//   «borrar mis datos» no toca a nadie más;
// - que lo comido (0002_comida.sql) sigue las mismas reglas, y que un borrado llega como una marca;
// - que las medidas del cuerpo y la estrategia del perfil (0003_progreso.sql) también;
// - que borrar la cuenta borra todo en cascada;
// - y la app de verdad (src/almacen) sincronizando varios teléfonos contra esta base, uno de
//   ellos con el repositorio SQLite del iPhone.
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
const sinComentarios = (sql) => sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\$\$[\s\S]*?\$\$/g, (cuerpo) => cuerpo.replace(/'[^']*'/g, "''"));
for (const archivo of migraciones) {
  const sql = sinComentarios(readFileSync(join(carpeta, archivo), 'utf8'));
  const ajenos = [...sql.matchAll(/\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b/gi)]
    .map((m) => `${m[1]}.${m[2]}`)
    // new, old y excluded son la fila que llega, la que estaba y la propuesta en un upsert.
    .filter((nombre) => !/^moss\./i.test(nombre) && !/^auth\.(users|uid)$/i.test(nombre) && !/^(new|old|excluded)\./i.test(nombre) && !/^\d/.test(nombre));
  comprobar(!ajenos.length, `${archivo}: solo nombra objetos de moss (y auth.users, auth.uid)${ajenos.length ? ': ' + [...new Set(ajenos)].join(', ') : ''}`);
  comprobar(!/\bschema\s+public\b|\bpublic\./i.test(sql), `${archivo}: no toca public`);
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

// ------------------------------------------------------------ 5. Semilla, períodos y borrar
const semilla = async (usuario, valor) => (await como(usuario, 'select moss.poner_semilla($1) as s', [valor])).rows[0].s;
comprobar((await semilla(B, 'primera')) === 'primera', 'la primera semilla queda');
comprobar((await semilla(B, 'segunda')) === 'primera', 'la segunda no la pisa: se devuelve la de la cuenta');
await como(B, `insert into moss.perfiles (nacimiento, sexo, altura_cm, actividad, objetivo, ritmo, actualizado) values (1990, 'm', 178, 'algo', 'mantener', 'recomendado', '2026-10-01T10:00:00Z')
  on conflict (usuario) do update set nacimiento = excluded.nacimiento, sexo = excluded.sexo, altura_cm = excluded.altura_cm, actividad = excluded.actividad,
  objetivo = excluded.objetivo, ritmo = excluded.ritmo, actualizado = excluded.actualizado`);
const perfilDeB = (await como(B, 'select nacimiento, semilla from moss.perfiles')).rows[0];
comprobar(perfilDeB.nacimiento === 1990 && perfilDeB.semilla === 'primera', 'el perfil llega después de la semilla, aunque se haya contestado antes, y la conserva');

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
await como(B, 'select moss.borrar_mis_datos()');
comprobar((await como(B, 'select * from moss.medidas')).rows.length === 0 && (await como(A, 'select * from moss.medidas')).rows.length === 1, '«borrar mis datos» también borra las medidas, y solo las propias');
comprobar(await falla('anon', 'select moss.borrar_mis_datos()'), 'sin sesión no se puede borrar nada');

// ------------------------------------------------------------ 6. Borrar la cuenta
await db.exec(`delete from auth.users where id = '${A}'`);
const quedan = (await db.query(`select (select count(*) from moss.habitos) + (select count(*) from moss.marcas) + (select count(*) from moss.dias)
  + (select count(*) from moss.periodos) + (select count(*) from moss.metas) + (select count(*) from moss.pesos)
  + (select count(*) from moss.registros) + (select count(*) from moss.recetas) + (select count(*) from moss.propios)
  + (select count(*) from moss.favoritos) + (select count(*) from moss.agua) + (select count(*) from moss.medidas) as n`)).rows[0].n;
comprobar(Number(quedan) === 0, 'borrar la cuenta borra todo en cascada');

// ------------------------------------------------------------ 7. La app contra esta base
// El código de la app es TypeScript con `@/` e imports sin extensión: Node lo corre si se le dice
// dónde está cada archivo. expo-sqlite es del teléfono: acá va sobre el SQLite de Node.
registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (especificador === 'expo-sqlite') especificador = pathToFileURL(join(raiz, 'herramientas/expo-sqlite-node.mjs')).href;
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
    rpc(funcion, argumentos) {
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
const [cena] = a.almacen.registrar([banana, itemRapido('Alfajor', { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 })], { comida: 'cena' });
a.almacen.sumarAgua();
a.almacen.guardarReceta({ tipo: 'comida', nombre: 'Merienda', items: [banana], porciones: 1, pesoFinal: null });
a.almacen.ponerFavorito('base', '1105314', true);
a.almacen.copiar({ dia: hoyA, comida: 'cena' }, { dia: '2026-10-21' });
await a.sinc.vuelta();
await b.sinc.vuelta();
const comidaDeB = b.almacen.estado();
comprobar(
  delDia(comidaDeB.registros.values(), hoyA).map((r) => r.nombre).join() === 'Banana,Alfajor'
    && comidaDeB.registros.get(cena.id)?.valores.fibra === 3.07
    && delDia(comidaDeB.registros.values(), '2026-10-21').every((r) => r.planificado) && delDia(comidaDeB.registros.values(), '2026-10-21').length === 2
    && aguaDelDia(comidaDeB.agua.values(), hoyA) === 250 && [...comidaDeB.recetas.values()][0]?.items[0]?.nombre === 'Banana'
    && [...comidaDeB.favoritos.values()][0]?.favorito === true && !(await pendiente(b)),
  'app: lo comido, el agua, las comidas guardadas y los favoritos llegan al otro teléfono, con lo planificado',
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
a.almacen.ponerEstrategia({ pesoMeta: 71, diaDelControl: 4, estilo: 'bajaEnCarbohidratos' });
await a.sinc.vuelta();
await b.sinc.vuelta();
const medidasDeB = b.almacen.estado().medidas.get(hoyA);
comprobar(
  medidasDeB?.cintura === 85.5 && medidasDeB?.cuello === 38 && medidasDeB?.brazo === undefined
    && b.almacen.estado().perfil?.pesoMeta === 71 && b.almacen.estado().perfil?.diaDelControl === 4
    && b.almacen.estado().metas.some((m) => m.motivo === 'objetivo') && !(await pendiente(b)),
  'app: las medidas (sin lo imposible), el peso meta, el día del control y las metas del reparto nuevo llegan al otro teléfono',
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
  ${['perfiles', 'habitos', 'marcas', 'dias', 'metas', 'pesos', 'registros', 'recetas', 'propios', 'favoritos', 'agua', 'medidas'].map((t) => `update moss.${t} set recibido = now() - interval '1 hour';`).join(' ')}
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
    && !vacia.registros.length && !vacia.agua.length && !vacia.recetas.length && !vacia.favoritos.length && !vacia.medidas.length
    && !nueva.habitos.length && nueva.marcas.length === 1 && nueva.dias.length === 1 && hechosDeHoy(a) === 'meditar,agua' && hechosDeHoy(b) === 'meditar,agua',
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

const intruso = crearSincronizador({ almacen: a.almacen, remoto: remotoSupabase(clienteDe(B)), usuario: B });
const sincronizo = await intruso.vuelta();
comprobar(!sincronizo && intruso.deOtraCuenta() && (await db.query(`select count(*) as n from moss.habitos where usuario = '${B}'`)).rows[0].n === 0, 'app: los datos de un teléfono nunca se mezclan con otra cuenta');

await db.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron.` : '\nTodo bien.');
process.exit(fallas ? 1 : 0);
