-- Moss · esquema 17: lo que falta para que «Por qué puedes estar estancado» dé igual en Moss y en Ascent
-- (spec/musculos-compartido.md, «Diferencia conocida»): cuánto bajas por semana, de la tendencia de tu peso que calcula
-- Moss en el teléfono, y tu experiencia del cuestionario. Moss los sube con el resumen de hoy (0015) y moss_objetivo()
-- los devuelve, del último día que los tenga. Lo de 0015 sigue igual: solo con el vínculo, y al desvincular se borra.
-- Se aplica con `npm run migraciones -- --aplicar`.

alter table moss.resumenes_para_ascent
  -- El % de tu peso que bajas por semana (positivo es bajar), de la tendencia de 7 días.
  add column baja_semanal numeric(5, 2) check (baja_semanal between -10 and 10),
  add column experiencia text check (experiencia in ('principiante', 'intermedio', 'avanzado'));

-- La de 0015, igual, con `baja_semanal` y `experiencia`: como la deuda y la energía, lo que no viene queda como estaba.
create or replace function moss.guardar_resumenes(p_dias jsonb) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := (select auth.uid());
  d jsonb;
begin
  if cuenta is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if not exists (select 1 from moss.vinculo vinculo where vinculo.moss = cuenta) then
    return false;
  end if;
  if jsonb_typeof(p_dias) <> 'array' or jsonb_array_length(p_dias) > 31 then
    raise exception 'pedido' using errcode = '22023';
  end if;
  for d in select x from jsonb_array_elements(p_dias) as x loop
    if jsonb_typeof(d) <> 'object' or coalesce(d ->> 'fecha', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'pedido' using errcode = '22023';
    end if;
    insert into moss.resumenes_para_ascent as r
      (usuario, fecha, dormido, necesidad, deuda, deuda_palabra, energia, meta_kcal, meta_proteina, meta_carbohidratos, meta_grasas,
       baja_semanal, experiencia, actualizado)
    values (
      cuenta, (d ->> 'fecha')::date,
      round((d ->> 'dormido')::numeric), round((d ->> 'necesidad')::numeric), round((d ->> 'deuda')::numeric), d ->> 'deuda_palabra', d ->> 'energia',
      round((d -> 'meta' ->> 'kcal')::numeric), round((d -> 'meta' ->> 'proteina')::numeric),
      round((d -> 'meta' ->> 'carbohidratos')::numeric), round((d -> 'meta' ->> 'grasas')::numeric),
      round((d ->> 'baja_semanal')::numeric, 2), d ->> 'experiencia', now()
    )
    on conflict (usuario, fecha) do update set
      dormido = excluded.dormido, necesidad = excluded.necesidad,
      deuda = coalesce(excluded.deuda, r.deuda), deuda_palabra = coalesce(excluded.deuda_palabra, r.deuda_palabra),
      energia = coalesce(excluded.energia, r.energia),
      meta_kcal = excluded.meta_kcal, meta_proteina = excluded.meta_proteina,
      meta_carbohidratos = excluded.meta_carbohidratos, meta_grasas = excluded.meta_grasas,
      baja_semanal = coalesce(excluded.baja_semanal, r.baja_semanal), experiencia = coalesce(excluded.experiencia, r.experiencia),
      actualizado = now();
  end loop;
  return true;
end;
$$;

-- La de 0015, igual, con `baja_semanal` y `experiencia` del último día que los tenga (sin ninguno, null).
create or replace function moss.moss_objetivo() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object(
      'objetivo', perfil.objetivo, 'ritmo', perfil.ritmo, 'peso_meta', perfil.peso_meta,
      'peso', (select peso.kg from moss.pesos peso where peso.usuario = vinculo.moss order by peso.fecha desc limit 1),
      'desde', (select min(meta.desde) from moss.metas meta where meta.usuario = vinculo.moss),
      'sin_deficit', coalesce(perfil.sin_deficit, false),
      'baja_semanal', (select resumen.baja_semanal from moss.resumenes_para_ascent resumen
                        where resumen.usuario = vinculo.moss and resumen.baja_semanal is not null order by resumen.fecha desc limit 1),
      'experiencia', (select resumen.experiencia from moss.resumenes_para_ascent resumen
                       where resumen.usuario = vinculo.moss and resumen.experiencia is not null order by resumen.fecha desc limit 1)
    )
    from moss.vinculo vinculo
    join moss.perfiles perfil on perfil.usuario = vinculo.moss
    where vinculo.ascent = (select auth.uid())
  );
$$;

revoke execute on function moss.guardar_resumenes(jsonb), moss.moss_objetivo() from public, anon;
grant execute on function moss.guardar_resumenes(jsonb), moss.moss_objetivo() to authenticated;
