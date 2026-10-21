# Moss

*Mos* es costumbre en latín; *moss* es musgo en inglés, que crece lento pero
siempre. Moss convierte los hábitos en un cielo nocturno:

- Cada hábito es una estrella.
- Los hábitos de cada día forman una constelación real.
- El cielo se vuelve más rico a medida que juntás luz.
- La comida tiene el mismo peso que los hábitos: metas que se ajustan solas cada
  semana, como MacroFactor.

Documentos:

- Qué es y qué tiene que hacer: [spec/especificacion.md](spec/especificacion.md)
- Cómo se llega a la versión 1: [spec/plan.md](spec/plan.md)
- Reglas para trabajar en el repo: [CLAUDE.md](CLAUDE.md)

## Probar

```bash
npm install
npm run galeria && npm run galeria:ver   # la galería en http://localhost:4173
npm run web:exportar && npm run web:ver  # la app (Skia) en la web, en http://localhost:4174
npm run typecheck
```

La app es solo para iPhone y necesita una build propia (Apple Health no anda en
Expo Go): ver la etapa 1 de [spec/plan.md](spec/plan.md).
