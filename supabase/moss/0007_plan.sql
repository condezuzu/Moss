-- Moss · esquema 7: el plan de comidas (src/dominio/plan.ts). Lo que arma Moss se guarda como lo
-- planificado de siempre, con la clave de la opción de la que sale (para «Otra» y para que no
-- vuelva lo que no te gusta), y cómo comes va en el perfil.
--
-- Se aplica a mano en el SQL Editor, después de 0006_alimentos.sql.

-- La opción de la que sale una comida armada: 'pollo-arroz' (una comida tipo) o 'tuya:base:123+base:45'
-- (lo que comes seguido). Lo anotado o planificado a mano no tiene.
alter table moss.registros add column plan text check (char_length(plan) between 1 and 300);

-- Cómo comes, como lo guarda la app: {"dieta": "todo", "alergias": ["mani"], "comidas": 4,
-- "tiempo": "normal", "noMeGusta": [...], "meGusta": [...]}. Sin contestar, null.
alter table moss.perfiles add column comer jsonb check (comer is null or (jsonb_typeof(comer) = 'object' and pg_column_size(comer) <= 65536));
