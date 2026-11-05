// ¿Está calibrada P = 1 − Φ((g − Δ)/σ) de buenDiaParaMarca()? g sale de la mejor serie de las últimas 3 semanas
// contra la marca (la mejor de siempre). Persona simulada: progresa r %/semana, una sesión por semana, ruido sigma.
// Se compara la P del modelo con la frecuencia real de hacer marca ese día (Δ = 0: un día normal).
function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function Phi(z) { const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2); return z >= 0 ? (1 + y) / 2 : (1 - y) / 2; }
function correr({ r, sigma, semanas = 30, reps = 4000 }) {
  const bins = Array.from({ length: 8 }, () => ({ n: 0, p: 0, hits: 0 }));
  let avisos = 0, aciertos = 0, dias = 0, marcas = 0;
  for (let k = 0; k < reps; k++) {
    const ys = [];
    for (let w = 0; w < semanas; w++) {
      const L = 100 * (1 + r / 100 * w);
      const y = L * (1 + sigma / 100 * randn());
      if (w >= 12) {
        const marca = Math.max(...ys);
        const reciente = Math.max(...ys.slice(-3));
        const g = Math.max(0, (marca / reciente - 1) * 100);
        const P = 1 - Phi((g - 0) / sigma);
        const hit = y > marca;
        const b = Math.min(7, Math.floor(P / 0.1));
        bins[b].n++; bins[b].p += P; bins[b].hits += hit;
        dias++; marcas += hit;
        if (P >= 0.35) { avisos++; aciertos += hit; }
      }
      ys.push(y);
    }
  }
  return { bins, avisos: avisos / dias, aciertoSiAvisa: aciertos / avisos, base: marcas / dias };
}
for (const [r, sigma] of [[0.25, 3.3], [0.5, 3.3], [1, 3.3], [0.25, 5]]) {
  const o = correr({ r, sigma });
  console.log(`r=${r} %/sem, sigma=${sigma} %: marca en ${(o.base * 100).toFixed(0)} % de las sesiones; avisa ${(o.avisos * 100).toFixed(0)} % de los días; cuando avisa, marca en ${(o.aciertoSiAvisa * 100).toFixed(0)} %`);
  for (const [i, b] of o.bins.entries()) if (b.n) console.log(`   P del modelo ${i * 10}-${i * 10 + 10} %: media ${(b.p / b.n * 100).toFixed(0)} %, real ${(b.hits / b.n * 100).toFixed(0)} % (n=${b.n})`);
}
