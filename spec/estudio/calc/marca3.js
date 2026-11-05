// Brier de tres maneras de dar «la probabilidad de marca hoy», en la persona simulada (ruido normal, progreso
// constante, una sesión por semana): la fórmula de Moss (mejor serie de 3 semanas), la frecuencia de siempre
// (cuántas sesiones fueron marca hasta ahora) y un oráculo que conoce el nivel verdadero (el techo posible).
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function Phi(z) { const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2); return z >= 0 ? (1 + y) / 2 : (1 - y) / 2; }
function correr({ r, sigma, semanas = 30, reps = 4000 }) {
  let bMoss = 0, bBase = 0, bOraculo = 0, n = 0, hits = 0;
  for (let it = 0; it < reps; it++) {
    const ys = []; let marcasPrevias = 0;
    for (let w = 0; w < semanas; w++) {
      const L = 100 * (1 + r / 100 * w);
      const y = L * (1 + sigma / 100 * randn());
      if (w >= 12) {
        const marca = Math.max(...ys);
        const reciente = Math.max(...ys.slice(-3));
        const g = Math.max(0, (marca / reciente - 1) * 100);
        const pMoss = 1 - Phi(g / sigma);
        const pBase = (marcasPrevias + 1) / (w + 2);
        const pOr = 1 - Phi((marca / L - 1) * 100 / sigma);
        const hit = y > marca ? 1 : 0;
        bMoss += (pMoss - hit) ** 2; bBase += (pBase - hit) ** 2; bOraculo += (pOr - hit) ** 2; n++; hits += hit;
      }
      if (w > 0 && y > Math.max(...ys)) marcasPrevias++;
      ys.push(y);
    }
  }
  return { moss: bMoss / n, base: bBase / n, oraculo: bOraculo / n, tasa: hits / n };
}
for (const [r, sigma] of [[0.25, 3.3], [0.5, 3.3], [1, 3.3], [0.25, 5]]) {
  const o = correr({ r, sigma });
  console.log(`r=${r} %/sem, sigma=${sigma} %: marca en ${(o.tasa * 100).toFixed(0)} % · Brier Moss ${o.moss.toFixed(3)} · frecuencia de siempre ${o.base.toFixed(3)} · oráculo ${o.oraculo.toFixed(3)}`);
}
