// Una pesada rara (+1,5 kg: con ropa, de noche, después de una comida salada): ¿cuánto mueve la tendencia y el control?
const { sumarDias, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia, controlSemanal } = require('./dominio/control');
const { ritmoSemanal } = require('./dominio/progreso');
const INICIO = '2026-01-05';
const kg = (t) => 85 - (0.5 / 7) * t;
function caso(dias, n, raro) {
  const p = [];
  for (let t = 0; t <= n; t++) { const f = sumarDias(INICIO, t); if (dias === 'todos' || dias.includes(diaDeLaSemana(f))) p.push({ fecha: f, kg: kg(t) + (t === raro ? 1.5 : 0) }); }
  const hoy = sumarDias(INICIO, n);
  const t = tendencia(p, hoy);
  const comidas = Array.from({ length: n }, (_, i) => ({ fecha: sumarDias(INICIO, i), kcal: 2000 }));
  const c = controlSemanal({ hoy, pesadas: p, comidas, gastoAnterior: 2550, metasAnteriores: { kcal: 2000, proteina: 150, carbohidratos: 200, grasas: 60 }, perfil: { edad: 30, sexo: 'm', pesoKg: 85, objetivo: 'bajar', ritmo: 'recomendado' } });
  return { exceso: t.get(hoy) - (kg(n) + 0.5 / 7 * 9), ritmo: ritmoSemanal(t, hoy, p), gasto: c.datos.gastoMedido };
}
for (const [nombre, dias] of [['todos los días', 'todos'], ['solo los lunes', [1]]]) {
  const n = 63; // lunes
  const base = caso(dias, n, -1);
  for (const raro of [56, 62, 63]) {
    const x = caso(dias, n, raro);
    console.log(`${nombre}: pesada rara el día ${raro} (hoy ${n}) → ritmo ${x.ritmo.toFixed(3)} (sin la rara ${base.ritmo.toFixed(3)}), gasto medido ${x.gasto} (sin la rara ${base.gasto})`);
  }
}
