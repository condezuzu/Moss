// Simulación: ¿cuántas veces la regla de Ascent («la mejor marca tiene N semanas o más y hubo otra sesión después»)
// dice «estancado» cuando la persona sí progresa, y cuántas veces lo dice bien cuando no progresa?
// Ruido de cada sesión: sigma en % (3,3 = CV del 1RM en entrenados, Grgic 2020; con e1RM de series submáximas, más).
// Una sesión por semana con ese ejercicio. Historia de 20 semanas.
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function simular({ r, sigma, semanas = 20, N, porSemana = 1, reps = 20000 }) {
  let marcaQuieta = 0;
  let pendienteNoSube = 0, pendienteSube = 0;
  for (let k = 0; k < reps; k++) {
    const pts = [];
    for (let w = 0; w < semanas; w++) for (let j = 0; j < porSemana; j++) {
      const t = w + j / porSemana;
      pts.push({ t, y: 100 * (1 + r / 100 * t) * (1 + sigma / 100 * randn()) });
    }
    // Regla de Ascent: la mejor está a N semanas o más del final y hubo otra después.
    let mejor = pts[0];
    for (const p of pts) if (p.y > mejor.y) mejor = p;
    const fin = pts[pts.length - 1].t;
    if (fin - mejor.t >= N) marcaQuieta++;
    // Alternativa: pendiente de las últimas 12 semanas (log), con IC 80 %.
    const ult = pts.filter((p) => p.t > fin - 12);
    const n = ult.length, mt = ult.reduce((s, p) => s + p.t, 0) / n, my = ult.reduce((s, p) => s + Math.log(p.y), 0) / n;
    let sxx = 0, sxy = 0; for (const p of ult) { sxx += (p.t - mt) ** 2; sxy += (p.t - mt) * (Math.log(p.y) - my); }
    const b = sxy / sxx; let sse = 0; for (const p of ult) sse += (Math.log(p.y) - my - b * (p.t - mt)) ** 2;
    const se = Math.sqrt(sse / (n - 2) / sxx);
    const z = 1.2816; // IC 80 %
    if (100 * (b + z * se) < 0.1) pendienteNoSube++; // «estable»: ni el borde de arriba llega a +0,1 %/semana
    if (100 * (b - z * se) > 0) pendienteSube++; // «sube»: el borde de abajo pasa el 0
  }
  return { marcaQuieta: marcaQuieta / reps, estable: pendienteNoSube / reps, sube: pendienteSube / reps };
}
const casos = [];
for (const sigma of [3.3, 5]) for (const r of [0, 0.25, 0.5, 1]) for (const N of [3, 6]) casos.push({ sigma, r, N, ...simular({ r, sigma, N }) });
console.log('sigma %  r %/sem  N sem  | regla de Ascent dice estancado | pendiente 12 sem: estable / sube (IC 80 %)');
for (const c of casos) console.log(`${c.sigma.toFixed(1)}  ${c.r.toFixed(2)}  ${c.N}  | ${(c.marcaQuieta * 100).toFixed(0)} % | ${(c.estable * 100).toFixed(0)} % / ${(c.sube * 100).toFixed(0)} %`);
// La SE de la pendiente con una sesión por semana: cuántas semanas hacen falta para ver 0,25 %/semana.
for (const T of [4, 6, 8, 12, 16]) { const sxx = T * (T * T - 1) / 12; console.log(`T=${T} semanas: SE pendiente = ${(3.3 / Math.sqrt(sxx)).toFixed(2)} %/sem (sigma 3,3), ${(5 / Math.sqrt(sxx)).toFixed(2)} (sigma 5)`); }
