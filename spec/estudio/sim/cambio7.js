// El «cambio en 7 días» y «en 30 días» de Progreso (diferencias de la tendencia) con el peso quieto: ¿cuánto se mueve por ruido?
const { sumarDias, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia } = require('./dominio/control');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const INICIO = '2026-01-05', n = 90;
for (const [nombre, rho] of [['ruido independiente', 0], ['rho 0,6', 0.6]]) {
  const r = azar(3); const c7 = [], c30 = [];
  for (let k = 0; k < 2000; k++) {
    const p = []; let e = 0;
    for (let t = 0; t <= n; t++) { e = t === 0 ? normal(r) * 0.5 : rho * e + normal(r) * 0.5 * Math.sqrt(1 - rho * rho); p.push({ fecha: sumarDias(INICIO, t), kg: Math.round((70 + e) * 10) / 10 }); }
    const hoy = sumarDias(INICIO, n); const tt = tendencia(p, hoy);
    c7.push(tt.get(hoy) - tt.get(sumarDias(hoy, -7))); c30.push(tt.get(hoy) - tt.get(sumarDias(hoy, -30)));
  }
  const sd = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
  const p90 = (a) => { const s = a.map(Math.abs).sort((x, y) => x - y); return s[Math.floor(0.9 * s.length)]; };
  console.log(`${nombre}: cambio en 7 días con el peso quieto: desvío ${sd(c7).toFixed(2)} kg (90 % dentro de ±${p90(c7).toFixed(2)}); en 30 días: ${sd(c30).toFixed(2)} (±${p90(c30).toFixed(2)})`);
}
