// La propuesta: la pendiente del e1RM (en log) de las últimas T semanas, con su IC del 80 %, en tres respuestas:
// «sube» (el borde de abajo pasa 0), «sin subida clara» (el borde de arriba no llega a +0,3 %/semana) o
// «todavía no se sabe». ¿Cuántas veces dice cada una según cuánto progresa de verdad la persona?
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function clasificar(pts) {
  const n = pts.length, mt = pts.reduce((s, p) => s + p.t, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0; for (const p of pts) { sxx += (p.t - mt) ** 2; sxy += (p.t - mt) * (p.y - my); }
  const b = sxy / sxx; let sse = 0; for (const p of pts) sse += (p.y - my - b * (p.t - mt)) ** 2;
  const se = Math.sqrt(sse / (n - 2) / sxx), z = 1.2816;
  if (100 * (b - z * se) > 0) return 'sube';
  if (100 * (b + z * se) < 0.3) return 'sinSubida';
  return 'noSeSabe';
}
function correr({ r, sigma, T, porSemana, reps = 20000 }) {
  const c = { sube: 0, sinSubida: 0, noSeSabe: 0 };
  for (let k = 0; k < reps; k++) {
    const pts = [];
    for (let w = 0; w < T; w++) for (let j = 0; j < porSemana; j++) { const t = w + j / porSemana; pts.push({ t, y: Math.log(100 * (1 + r / 100 * t) * (1 + sigma / 100 * randn())) }); }
    c[clasificar(pts)]++;
  }
  return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(100 * v / reps)]));
}
console.log('sigma  sesiones/sem  T sem  r %/sem -> sube / sin subida clara / todavía no se sabe (%)');
for (const sigma of [3.3, 5]) for (const porSemana of [1, 2]) for (const T of [8, 12, 16]) for (const r of [0, 0.25, 0.5, 1]) {
  const o = correr({ r, sigma, T, porSemana });
  console.log(`${sigma}  ${porSemana}  ${T}  ${r} -> ${o.sube} / ${o.sinSubida} / ${o.noSeSabe}`);
}
