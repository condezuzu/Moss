// Manteniendo de verdad (peso quieto): ¿cuántas veces Moss dice «Cambiando»?
const { sumarDias, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia } = require('./dominio/control');
const { progresoAlObjetivo } = require('./dominio/progreso');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const INICIO = '2026-01-05';
for (const [nombre, rho, dias] of [['diario, ruido independiente', 0, 'todos'], ['diario, rho 0,6', 0.6, 'todos'], ['1 por semana, rho 0,6', 0.6, [1]]]) {
  for (const n of [21, 28, 60, 120]) {
    const r = azar(5 + n); let seMueve = 0, total = 0;
    for (let k = 0; k < 1500; k++) {
      const p = []; let e = 0;
      for (let t = 0; t <= n; t++) { e = t === 0 ? normal(r) * 0.5 : rho * e + normal(r) * 0.5 * Math.sqrt(1 - rho * rho); const f = sumarDias(INICIO, t); if (dias === 'todos' || dias.includes(diaDeLaSemana(f))) p.push({ fecha: f, kg: Math.round((70 + e) * 10) / 10 }); }
      const hoy = sumarDias(INICIO, n); const t = tendencia(p, hoy);
      const x = progresoAlObjetivo({ hoy, tendencia: t, pesadas: p, objetivo: 'mantener', ritmo: 'recomendado' });
      if (x.estado === 'faltanDatos') continue; total++; if (x.estado === 'seMueve') seMueve++;
    }
    console.log(`${nombre}, día ${n}: «Cambiando» el ${(100 * seMueve / total).toFixed(0)}% de las veces con el peso quieto`);
  }
}
