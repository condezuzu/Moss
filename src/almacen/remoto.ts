// Supabase tal como lo usa la sincronización: subir lo pendiente y bajar lo que cambió. Las filas
// llevan los nombres de supabase/moss/0001_esquema.sql. El usuario no viaja: lo pone la base con
// la sesión, y RLS no deja ver ni tocar lo de nadie más.

import type { Periodo } from '@/dominio/constelaciones';
import type { Peso } from '@/dominio/control';
import type { Dia, Marca } from '@/dominio/dias';
import type { Habito } from '@/dominio/habitos';
import type { Logro } from '@/dominio/logros';
import type { MetaGuardada, Perfil } from '@/dominio/metas';
import type { supabase } from '@/lib/supabase';
import type { Remoto } from './sincronizar';

export type Cliente = ReturnType<typeof supabase>;
type Consulta = ReturnType<ReturnType<Cliente['from']>['select']>;

/** Supabase devuelve como mucho mil filas por pedido. */
const PAGINA = 1000;
/** Al bajar se vuelve a mirar un minuto para atrás: una subida que empezó antes de la última bajada puede terminar después. */
const MARGEN_MS = 60_000;
/** La hora de lo que no tiene (lo guardado antes de que existiera): cualquier cambio de verdad le gana. */
const SIN_HORA = new Date(0).toISOString();

/** Supabase devuelve las horas como `2026-10-21T15:00:00.5+00:00`; el teléfono las compara en el formato de JavaScript. */
const hora = (texto: string) => new Date(texto).toISOString();

// Del teléfono a la base, con todas las columnas siempre (un `null` también es un cambio: un hábito que se desarchiva).
const filaDe = {
  habito: (h: Habito) => ({
    id: h.id, nombre: h.nombre, icono: h.icono, dias: h.dias, fuente: h.fuente, orden: h.orden, desde: h.desde, hasta: h.hasta ?? null,
    actualizado: h.actualizado ?? SIN_HORA,
  }),
  periodo: (p: Periodo) => ({ dia: p.dia, desde: p.desde, hasta: p.hasta ?? null, constelacion: p.constelacion, cantidad: p.cantidad }),
  marca: (m: Marca) => ({ habito: m.habito, dia: m.dia, hecho: m.hecho, momento: m.momento, origen: m.origen }),
  dia: (d: Dia) => ({
    clave: d.clave, constelacion: d.constelacion, habitos: d.habitos, hechos: d.hechos, luz: d.luz, completo: d.completo,
    actualizado: d.actualizado ?? SIN_HORA,
  }),
  logro: (l: Logro) => ({ id: l.id, desde: l.desde }),
  perfil: (p: Perfil) => ({
    nacimiento: p.nacimiento, sexo: p.sexo, altura_cm: p.alturaCm, actividad: p.actividad, objetivo: p.objetivo, ritmo: p.ritmo,
    actualizado: p.actualizado,
  }),
  meta: (m: MetaGuardada) => ({
    desde: m.desde, kcal: m.kcal, proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas, gasto: m.gasto, motivo: m.motivo,
    momento: m.momento,
  }),
  peso: (p: Peso) => ({ fecha: p.fecha, kg: p.kg, origen: p.origen, momento: p.momento }),
};

type Filas = { [K in keyof typeof filaDe]: ReturnType<(typeof filaDe)[K]> };
type Recibida<F> = F & { recibido: string };
/** Hasta que se contesta el cuestionario, la fila del perfil tiene solo la semilla. */
type FilaPerfil = Recibida<{ [K in keyof Filas['perfil']]: Filas['perfil'][K] | null }> & { semilla: string | null };

// De la base al teléfono, campo por campo: las filas traen además el usuario y la hora en que llegaron.
const deFila = {
  habito: (f: Filas['habito']): Habito => ({
    id: f.id, nombre: f.nombre, icono: f.icono, dias: f.dias, fuente: f.fuente, orden: f.orden, desde: f.desde,
    ...(f.hasta ? { hasta: f.hasta } : {}), actualizado: hora(f.actualizado),
  }),
  periodo: (f: Filas['periodo']): Periodo => ({ dia: f.dia, constelacion: f.constelacion, cantidad: f.cantidad, desde: f.desde, ...(f.hasta ? { hasta: f.hasta } : {}) }),
  marca: (f: Filas['marca']): Marca => ({ habito: f.habito, dia: f.dia, hecho: f.hecho, momento: hora(f.momento), origen: f.origen }),
  dia: (f: Filas['dia']): Dia => ({
    clave: f.clave, constelacion: f.constelacion, habitos: f.habitos, hechos: f.hechos, luz: f.luz, completo: f.completo, actualizado: hora(f.actualizado),
  }),
  logro: (f: Filas['logro']): Logro => ({ id: f.id, desde: f.desde }),
  perfil: (f: Filas['perfil']): Perfil => ({
    nacimiento: f.nacimiento, sexo: f.sexo, alturaCm: Number(f.altura_cm), actividad: f.actividad, objetivo: f.objetivo, ritmo: f.ritmo,
    actualizado: hora(f.actualizado),
  }),
  meta: (f: Filas['meta']): MetaGuardada => ({
    kcal: f.kcal, proteina: f.proteina, carbohidratos: f.carbohidratos, grasas: f.grasas, desde: f.desde, gasto: f.gasto, motivo: f.motivo,
    momento: hora(f.momento),
  }),
  peso: (f: Filas['peso']): Peso => ({ fecha: f.fecha, kg: Number(f.kg), origen: f.origen, momento: hora(f.momento) }),
};

export function remotoSupabase(cliente: Cliente): Remoto {
  /** Todas las filas, de a páginas y en un orden fijo, para que ninguna se repita ni se saltee. */
  async function todas<F>(tabla: string, orden: string[], filtrar: (q: Consulta) => Consulta = (q) => q): Promise<F[]> {
    const filas: F[] = [];
    for (let desde = 0; ; desde += PAGINA) {
      let q = filtrar(cliente.from(tabla).select('*'));
      for (const columna of orden) q = q.order(columna);
      const { data, error } = await q.range(desde, desde + PAGINA - 1);
      if (error) throw new Error(`${tabla}: ${error.message}`);
      filas.push(...(data as F[]));
      if (data.length < PAGINA) return filas;
    }
  }

  return {
    async subir(c) {
      const pedidos: PromiseLike<{ error: { message: string } | null }>[] = [];
      const poner = (tabla: string, filas: object[], onConflict: string, ignoreDuplicates = false) => {
        if (filas.length) pedidos.push(cliente.from(tabla).upsert(filas, { onConflict, ignoreDuplicates }));
      };
      // La semilla es de la cuenta: la base se queda con la primera que llega, y al bajar llega a todos.
      if (c.semilla) pedidos.push(cliente.rpc('poner_semilla', { valor: c.semilla }));
      if (c.perfil) poner('perfiles', [filaDe.perfil(c.perfil)], 'usuario');
      poner('habitos', c.habitos.map(filaDe.habito), 'usuario,id');
      if (c.periodos) pedidos.push(cliente.rpc('poner_periodos', { lista: c.periodos.map(filaDe.periodo) }));
      poner('marcas', c.marcas.map(filaDe.marca), 'usuario,habito,dia');
      poner('dias', c.dias.map(filaDe.dia), 'usuario,clave');
      // Un logro ya guardado no se toca: vale la fecha del primero que lo subió.
      poner('logros', c.logros.map(filaDe.logro), 'usuario,id', true);
      poner('metas', c.metas.map(filaDe.meta), 'usuario,desde');
      poner('pesos', c.pesos.map(filaDe.peso), 'usuario,fecha');
      const errores = (await Promise.all(pedidos)).flatMap((r) => (r.error ? [r.error.message] : []));
      if (errores.length) throw new Error(errores.join('; '));
    },

    async bajar(desde, marcasDesde) {
      const corte = desde ? new Date(new Date(desde).getTime() - MARGEN_MS).toISOString() : null;
      const nuevas = (q: Consulta) => (corte ? q.gt('recibido', corte) : q);
      const [perfiles, habitos, periodos, marcas, dias, logros, metas, pesos] = await Promise.all([
        todas<FilaPerfil>('perfiles', ['usuario'], nuevas),
        todas<Recibida<Filas['habito']>>('habitos', ['id'], nuevas),
        // Los períodos y los logros son pocos y bajan siempre enteros: a los períodos se los reemplaza, y lo borrado no tiene hora.
        todas<Filas['periodo']>('periodos', ['dia', 'desde']),
        todas<Recibida<Filas['marca']>>('marcas', ['dia', 'habito'], corte ? nuevas : (q) => q.gte('dia', marcasDesde)),
        todas<Recibida<Filas['dia']>>('dias', ['clave'], nuevas),
        todas<Filas['logro']>('logros', ['id']),
        todas<Recibida<Filas['meta']>>('metas', ['desde'], nuevas),
        todas<Recibida<Filas['peso']>>('pesos', ['fecha'], nuevas),
      ]);
      const perfil = perfiles[0];
      const recibidas = [...perfiles, ...habitos, ...marcas, ...dias, ...metas, ...pesos].map((f) => hora(f.recibido));
      const hasta = recibidas.reduce<string | null>((ultima, r) => (!ultima || r > ultima ? r : ultima), desde);
      return {
        hasta,
        datos: {
          perfil: perfil && perfil.nacimiento !== null ? deFila.perfil(perfil as Filas['perfil']) : null,
          semilla: perfil?.semilla ?? null,
          habitos: habitos.map(deFila.habito),
          periodos: periodos.map(deFila.periodo),
          marcas: marcas.map(deFila.marca),
          dias: dias.map(deFila.dia),
          logros: logros.map(deFila.logro),
          metas: metas.map(deFila.meta),
          pesos: pesos.map(deFila.peso),
        },
      };
    },
  };
}
