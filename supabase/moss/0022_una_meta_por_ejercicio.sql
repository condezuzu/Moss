-- Moss · esquema 22: una meta de fuerza por ejercicio (27/11/2026: se veían dos «Press militar con mancuernas»). Las
-- dos apps crean una meta sin id; desde acá, si el ejercicio ya tiene una, se cambia esa en vez de crear otra. Las
-- repetidas que ya hay quedan en una: la última que se cambió (y, si empatan, la última creada). Cambiar una meta a un
-- ejercicio que ya tiene otra no se puede (ninguna de las dos apps lo hace): lo frena el índice.

delete from moss.metas_de_fuerza meta
 where exists (select 1 from moss.metas_de_fuerza otra
                where otra.usuario = meta.usuario and otra.ejercicio = meta.ejercicio
                  and (otra.actualizada, otra.creada, otra.id) > (meta.actualizada, meta.creada, meta.id));

create unique index metas_de_fuerza_un_ejercicio on moss.metas_de_fuerza (usuario, ejercicio);

-- La de 0016, igual, salvo que sin id cambia la del ejercicio si ya hay una (y entonces no cuenta para el tope de 20).
create or replace function moss.guardar_meta_de_fuerza(p_id uuid, p_ejercicio text, p_kilos numeric, p_reps int) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := moss.cuenta_del_vinculo();
  guardada uuid;
begin
  if cuenta is null then
    return null;
  end if;
  if p_ejercicio is null or length(p_ejercicio) not between 1 and 100 or p_kilos is null or p_kilos not between 1 and 1000
     or p_reps is null or p_reps not between 1 and 30 then
    raise exception 'meta' using errcode = '22023';
  end if;
  if p_id is null then
    if not exists (select 1 from moss.metas_de_fuerza meta where meta.usuario = cuenta and meta.ejercicio = p_ejercicio)
       and (select count(*) from moss.metas_de_fuerza meta where meta.usuario = cuenta) >= 20 then
      raise exception 'demasiadas' using errcode = '22023';
    end if;
    insert into moss.metas_de_fuerza as meta (usuario, ejercicio, kilos, reps) values (cuenta, p_ejercicio, p_kilos, p_reps)
      on conflict (usuario, ejercicio) do update set kilos = excluded.kilos, reps = excluded.reps, actualizada = now()
      returning meta.id into guardada;
  else
    update moss.metas_de_fuerza meta set ejercicio = p_ejercicio, kilos = p_kilos, reps = p_reps, actualizada = now()
     where meta.id = p_id and meta.usuario = cuenta returning meta.id into guardada;
  end if;
  return guardada;
end;
$$;
