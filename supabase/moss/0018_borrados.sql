-- Moss · esquema 18: «Borrar mis datos» llega a los otros teléfonos (spec/bugs.md, 17). La base borraba las filas sin
-- dejar marca, y otro teléfono de la misma cuenta no se enteraba: con su próximo cambio volvía a subir lo borrado.
-- Ahora queda la hora del último borrado de cada cuenta. Cada teléfono la lee al sincronizar y, si es posterior a la que
-- había cuando conoció la cuenta, olvida lo suyo antes de subir nada y vuelve a bajar de cero (src/almacen/sincronizar.ts).
-- La marca no sincroniza: la escribe solo borrar_mis_datos() y las apps la leen. Se aplica con `npm run migraciones -- --aplicar`.

create table moss.borrados (
  usuario uuid primary key references auth.users (id) on delete cascade,
  en timestamptz not null
);

alter table moss.borrados enable row level security;
create policy propia on moss.borrados for select to authenticated using (usuario = (select auth.uid()));
revoke all on moss.borrados from anon, authenticated;
grant select on moss.borrados to authenticated;
grant all on moss.borrados to service_role;

-- La de 0016, igual, y al final la marca con la hora del borrado.
create or replace function moss.borrar_mis_datos() returns void
language sql
security definer
set search_path = ''
as $$
  delete from moss.metas_de_fuerza where usuario = (select auth.uid());
  delete from moss.resumenes_para_ascent where usuario = (select auth.uid());
  delete from moss.propuestas where usuario = (select auth.uid());
  delete from moss.reportes_comunidad where usuario = (select auth.uid());
  delete from moss.noches where usuario = (select auth.uid());
  delete from moss.medidas where usuario = (select auth.uid());
  delete from moss.registros where usuario = (select auth.uid());
  delete from moss.recetas where usuario = (select auth.uid());
  delete from moss.propios where usuario = (select auth.uid());
  delete from moss.favoritos where usuario = (select auth.uid());
  delete from moss.agua where usuario = (select auth.uid());
  delete from moss.marcas where usuario = (select auth.uid());
  delete from moss.dias where usuario = (select auth.uid());
  delete from moss.periodos where usuario = (select auth.uid());
  delete from moss.habitos where usuario = (select auth.uid());
  delete from moss.logros where usuario = (select auth.uid());
  delete from moss.pesos where usuario = (select auth.uid());
  delete from moss.metas where usuario = (select auth.uid());
  delete from moss.perfiles where usuario = (select auth.uid());
  insert into moss.borrados (usuario, en) values ((select auth.uid()), now())
    on conflict (usuario) do update set en = excluded.en;
$$;

-- La de 0016, igual, y también la marca: sin la cuenta de Moss, ya no hace falta.
create or replace function moss.borrar_cuenta(cuenta uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if cuenta is null then
    raise exception 'pedido' using errcode = '22023';
  end if;
  delete from moss.vinculo vinculo where vinculo.moss = cuenta;
  delete from moss.metas_de_fuerza where usuario = cuenta;
  delete from moss.resumenes_para_ascent where usuario = cuenta;
  delete from moss.propuestas where usuario = cuenta;
  delete from moss.reportes_comunidad where usuario = cuenta;
  delete from moss.noches where usuario = cuenta;
  delete from moss.medidas where usuario = cuenta;
  delete from moss.registros where usuario = cuenta;
  delete from moss.recetas where usuario = cuenta;
  delete from moss.propios where usuario = cuenta;
  delete from moss.favoritos where usuario = cuenta;
  delete from moss.agua where usuario = cuenta;
  delete from moss.marcas where usuario = cuenta;
  delete from moss.dias where usuario = cuenta;
  delete from moss.periodos where usuario = cuenta;
  delete from moss.habitos where usuario = cuenta;
  delete from moss.logros where usuario = cuenta;
  delete from moss.pesos where usuario = cuenta;
  delete from moss.metas where usuario = cuenta;
  delete from moss.perfiles where usuario = cuenta;
  delete from moss.borrados where usuario = cuenta;
end;
$$;

revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
revoke execute on function moss.borrar_cuenta(uuid) from public, anon, authenticated;
grant execute on function moss.borrar_cuenta(uuid) to service_role;
