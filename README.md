# Moss

*Mos* es costumbre en latín; *moss* es musgo en inglés, que crece lento pero
siempre. Moss es una app de comida para iPhone, global y gratis:

- Calorías y macros con metas que se ajustan solas cada semana, como
  MacroFactor, sin IA de fotos.
- Registrar en muy pocos toques, con una base que encuentra lo que se come en
  cada país.
- Los hábitos acompañan, en un cielo nocturno:
  - cada hábito es una estrella;
  - los hábitos de cada día forman una constelación real;
  - el cielo se vuelve más rico a medida que juntás luz.

Documentos:

- Qué es y qué tiene que hacer: [spec/especificacion.md](spec/especificacion.md)
- Cómo se llega a la versión 1: [spec/plan.md](spec/plan.md)
- Reglas para trabajar en el repo: [CLAUDE.md](CLAUDE.md)

## Probar

```bash
npm install
npm run galeria && npm run galeria:ver   # la galería en http://localhost:4173
npm run web:exportar && npm run web:ver  # la app (Skia) en la web, en http://localhost:4174
npm test                                 # el dominio, el almacén y la sincronización
npm run supabase:verificar               # el esquema de Supabase y la app sincronizando, en un Postgres local
npm run alimentos && npm run alimentos:verificar   # la base de alimentos (USDA y los genéricos curados)
npm run typecheck
```

La app es solo para iPhone y necesita una build propia (Apple Health no anda en
Expo Go): ver la etapa 1 de [spec/plan.md](spec/plan.md).
