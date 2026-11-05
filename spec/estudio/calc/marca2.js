// La alternativa: el nivel de hoy sale de la tendencia de las últimas 8 sesiones (regresión en log), no de la mejor
// serie; P = 1 − Φ((ln marca − ln nivel) / √(σ² + SE²)). Misma persona simulada que marca.js.
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function Phi(z) { const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2); return z >= 0 ? (1 + y) / 2 : (1 - y) / 2; }
function correr({ r, sigma, semanas = 30, reps = 4000, k = 8 }) {
  const bins = Array.from({ length: 10 }, () => ({ n: 0, p: 0, hits: 0 }));
  let brier = 0, n = 0;
  for (let it = 0; it < reps; it++) {
    const ys = [];
    for (let w = 0; w < semanas; w++) {
      const y = 100 * (1 + r / 100 * w) * (1 + sigma / 100 * randn());
      if (w >= 12) {
        const marca = Math.max(...ys);
        const ult = ys.slice(-k).map((v, i) => ({ t: w - k + i, y: Math.log(v) }));
        const mt = ult.reduce((s, p) => s + p.t, 0) / k, my = ult.reduce((s, p) => s + p.y, 0) / k;
        let sxx = 0, sxy = 0; for (const p of ult) { sxx += (p.t - mt) ** 2; sxy += (p.t - mt) * (p.y - my); }
        const b = sxy / sxx; let sse = 0; for (const p of ult) sse += (p.y - my - b * (p.t - mt)) ** 2;
        const s2 = sse / (k - 2);
        const nivel = my + b * (w - mt);
        const se2 = s2 * (1 / k + (w - mt) ** 2 / sxx);
        // σ: el de los estudios (se podría usar el propio, s2); acá el de los estudios, en log.
        const sd = Math.sqrt((sigma / 100) ** 2 + se2);
        const P = 1 - Phi((Math.log(marca) - nivel) / sd);
        const hit = y > marca ? 1 : 0;
        const bi = Math.min(9, Math.floor(P / 0.1));
        bins[bi].n++; bins[bi].p += P; bins[bi].hits += hit; brier += (P - hit) ** 2; n++;
      }
      ys.push(y);
    }
  }
  return { bins, brier: brier / n };
}
for (const [r, sigma] of [[0.25, 3.3], [0.5, 3.3], [1, 3.3]]) {
  const o = correr({ r, sigma });
  console.log(`r=${r}, sigma=${sigma}: Brier ${o.brier.toFixed(3)}`);
  for (const [i, b] of o.bins.entries()) if (b.n > 200) console.log(`   P ${i * 10}-${i * 10 + 10} %: media ${(b.p / b.n * 100).toFixed(0)} %, real ${(b.hits / b.n * 100).toFixed(0)} % (n=${b.n})`);
}
