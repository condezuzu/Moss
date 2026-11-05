// Sin ruido: ¿el relleno con la última pesada achata el ritmo cuando uno se pesa poco?
const { sumarDias, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia, cambioPorDia, controlSemanal } = require('./dominio/control');
const { ritmoSemanal } = require('./dominio/progreso');
const INICIO = '2026-01-05'; // lunes
const KG_SEM = 0.5;
function pesadas(dias, n) { const p = []; for (let t = 0; t <= n; t++) { const f = sumarDias(INICIO, t); if (dias === 'todos' || dias.includes(diaDeLaSemana(f))) p.push({ fecha: f, kg: Math.round((85 - (KG_SEM / 7) * t) * 100) / 100 }); } return p; }
for (const [nombre, dias] of [['todos los días', 'todos'], ['lu, mi y vi', [1, 3, 5]], ['solo los lunes', [1]]]) {
  for (const hoyN of [27, 28, 62, 63]) { // 27 y 62 son domingos; 28 y 63, lunes
    const hoy = sumarDias(INICIO, hoyN);
    const p = pesadas(dias, hoyN).filter((x) => x.fecha <= hoy);
    const t = tendencia(p, hoy);
    const r = ritmoSemanal(t, hoy, p);
    // El control del lunes mira hasta el domingo: la pesada de ese lunes no entra.
    const comidas = Array.from({ length: hoyN }, (_, i) => ({ fecha: sumarDias(INICIO, i), kcal: 2000 }));
    const c = controlSemanal({ hoy, pesadas: p, comidas, gastoAnterior: 2550, metasAnteriores: { kcal: 2000, proteina: 150, carbohidratos: 200, grasas: 60 }, perfil: { edad: 30, sexo: 'm', pesoKg: 85, objetivo: 'bajar', ritmo: 'recomendado' } });
    const dia = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sa'][diaDeLaSemana(hoy)];
    console.log(`${nombre}, hoy ${dia} (día ${hoyN}): ritmo de Progreso ${r === null ? '—' : r.toFixed(3)} kg/sem (verdad −${KG_SEM}); control: gasto medido ${c.datos.gastoMedido} (verdad 2550), motivo ${c.motivo}`);
  }
}
