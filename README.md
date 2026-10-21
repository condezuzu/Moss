# Moss

*Mos* es costumbre en latín; *moss* es musgo en inglés, que crece lento pero
siempre. Moss convierte los hábitos en un cielo nocturno: cada hábito es una
estrella y los hábitos de cada día forman una constelación real con su mito
griego.

- Qué es y qué tiene que hacer: [spec/especificacion.md](spec/especificacion.md)
- Cómo se llega a la versión 1: [spec/plan.md](spec/plan.md)
- Reglas para trabajar en el repo: [CLAUDE.md](CLAUDE.md)

## Probar

```bash
npm install
npm run galeria && npm run galeria:ver   # la galería en http://localhost:4173
npm run typecheck
```

La app es solo para iPhone y necesita una build propia (Apple Health no anda en
Expo Go): ver la etapa 1 de [spec/plan.md](spec/plan.md).
