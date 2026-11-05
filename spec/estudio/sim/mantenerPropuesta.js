// La regla propuesta manteniendo (peso quieto): «cambiando» solo si todo el rango queda fuera de ±0,15 kg/sem.
const { sumarDias, diaDeLaSemana } = require('./dominio/fechas');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const T80 = { 1: 3.078, 2: 1.886, 3: 1.638, 4: 1.533 };
const INICIO = '2026-01-05';
for (const [nombre, dias, verdad] of [['diario, quieto', 'todos', 0], ['1 por semana, quieto', [1], 0], ['diario, sube 0,3 kg/sem', 'todos', 0.3], ['1 por semana, sube 0,3 kg/sem', [1], 0.3]]) {
  for (const n of [28, 42]) {
    const r = azar(21 + n); const c = {};
    for (let k = 0; k < 2000; k++) {
      const p = []; let e = 0; const fase = Math.floor(r() * 28);
      for (let t = 0; t <= n; t++) {
        e = t === 0 ? normal(r) * 0.5 : 0.6 * e + normal(r) * 0.5 * Math.sqrt(1 - 0.36);
        const f = sumarDias(INICIO, t), d = diaDeLaSemana(f);
        const kg = 70 + (verdad / 7) * t + e + 0.0035 / 2 * 70 * Math.cos(2 * Math.PI * ((d + 6) % 7) / 7) + ((t + fase) % 28 < 5 ? 0.45 : 0);
        if (dias === 'todos' || dias.includes(d)) p.push({ fecha: f, kg: Math.round(kg * 10) / 10 });
      }
      const hoy = sumarDias(INICIO, n); const pts = [];
      for (let s = 0; s < 6; s++) { const fin = sumarDias(hoy, -7 * s), ini = sumarDias(fin, -6); const en = p.filter((x) => x.fecha >= ini && x.fecha <= fin); if (en.length) pts.push([-7 * s - 3, en.reduce((a, x) => a + x.kg, 0) / en.length]); }
      let est = 'todaviaNo';
      if (pts.length >= 3) {
        const mx = pts.reduce((a, [x]) => a + x, 0) / pts.length, my = pts.reduce((a, [, y]) => a + y, 0) / pts.length;
        const sxx = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0), b = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / sxx;
        const df = pts.length - 2, s = Math.max(0.2, Math.sqrt(pts.reduce((t, [x, y]) => t + (y - (my + b * (x - mx))) ** 2, 0) / df));
        const h = T80[df] * (s / Math.sqrt(sxx)) * 7, kgSem = b * 7;
        est = h > 0.25 ? 'todaviaNo' : (kgSem - h > 0.15 || kgSem + h < -0.15) ? 'seMueve' : 'estable';
      }
      c[est] = (c[est] || 0) + 1;
    }
    console.log(`${nombre}, día ${n}: ${Object.entries(c).sort().map(([k, v]) => `${k} ${(v / 20).toFixed(0)}%`).join(', ')}`);
  }
}
