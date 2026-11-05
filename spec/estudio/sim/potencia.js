// La regla propuesta (recta por promedios semanales, 80 %): con el ritmo de verdad en la mitad del plan o en el doble,
// ¿cuántas veces lo dice? Y la regla de hoy de Moss (planPorEtapas), para comparar.
const { sumarDias, diasEntre, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia } = require('./dominio/control');
const { ritmoSemanal, plazoConRitmo, planPorEtapas } = require('./dominio/progreso');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const T80 = { 1: 3.078, 2: 1.886, 3: 1.638, 4: 1.533 };
const INICIO = '2026-01-05', PLAN = 0.4;
function serie(kgSem, rho, dias, r, n) {
  const p = []; let e = 0; const fase = Math.floor(r() * 28);
  for (let t = 0; t <= n; t++) {
    e = t === 0 ? normal(r) * 0.5 : rho * e + normal(r) * 0.5 * Math.sqrt(1 - rho * rho);
    const f = sumarDias(INICIO, t), d = diaDeLaSemana(f);
    let kg = 80 - (kgSem / 7) * t + e + 0.0035 / 2 * 80 * Math.cos(2 * Math.PI * ((d + 6) % 7) / 7) + ((t + fase) % 28 < 5 ? 0.45 : 0);
    if (dias === 'todos' || dias.includes(d)) p.push({ fecha: f, kg: Math.round(kg * 10) / 10 });
  }
  return p;
}
function propuesta(p, hoy) {
  const pts = [];
  for (let s = 0; s < 6; s++) { const fin = sumarDias(hoy, -7 * s), ini = sumarDias(fin, -6); const en = p.filter((x) => x.fecha >= ini && x.fecha <= fin); if (en.length) pts.push([-7 * s - 3, en.reduce((a, x) => a + x.kg, 0) / en.length]); }
  if (pts.length < 3) return 'todaviaNo';
  const mx = pts.reduce((a, [x]) => a + x, 0) / pts.length, my = pts.reduce((a, [, y]) => a + y, 0) / pts.length;
  const sxx = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0), b = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / sxx;
  const df = pts.length - 2, s = Math.max(0.2, Math.sqrt(pts.reduce((t, [x, y]) => t + (y - (my + b * (x - mx))) ** 2, 0) / df));
  const h = T80[df] * (s / Math.sqrt(sxx)) * 7, av = -b * 7, margen = Math.max(0.25 * PLAN, 0.1);
  if (h > Math.max(0.25, PLAN)) return 'todaviaNo';
  if (av + h < PLAN - margen) return 'atrasado';
  if (av - h > PLAN + margen) return 'adelantado';
  return 'alRitmo';
}
for (const [nombre, dias] of [['diario', 'todos'], ['1 por semana', [1]]]) {
  for (const verdad of [0.2, 0.4, 0.8]) {
    const r = azar(11); const hoyN = 42; const prop = {}, hoyMoss = {};
    for (let k = 0; k < 2000; k++) {
      const p = serie(verdad, 0.6, dias, r, hoyN); const hoy = sumarDias(INICIO, hoyN);
      const c = propuesta(p, hoy); prop[c] = (prop[c] || 0) + 1;
      const t = tendencia(p, hoy); const ritmo = ritmoSemanal(t, hoy, p); const peso = t.get(hoy);
      const plazo = plazoConRitmo({ hoy, pesoKg: peso, pesoMeta: 70, sexo: 'f', edad: 30, gasto: 2300, entrenaFuerza: true }, (PLAN / peso) * 100);
      const m = planPorEtapas({ hoy, pesoKg: peso, objetivo: 'bajar', pesoMeta: 70, plazo, ritmo }).comoVienes; hoyMoss[m] = (hoyMoss[m] || 0) + 1;
    }
    const f = (o) => Object.entries(o).sort().map(([k, v]) => `${k} ${(v / 20).toFixed(0)}%`).join(', ');
    console.log(`${nombre}, 6 semanas, ritmo de verdad ${verdad} (plan ${PLAN}): propuesta → ${f(prop)} | Moss hoy → ${f(hoyMoss)}`);
  }
}
