// La recta con su error, con un piso para la persistencia del ruido: ¿cubre lo que dice cubrir?
const { sumarDias, diasEntre, diaDeLaSemana } = require('./dominio/fechas');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const INICIO = '2026-01-05', PESO0 = 80, KG_SEM = 0.4;
function serie(rho, dias, r, n, ciclo) {
  const p = []; let e = 0; const fase = Math.floor(r() * 28);
  for (let t = 0; t <= n; t++) {
    e = t === 0 ? normal(r) * 0.5 : rho * e + normal(r) * 0.5 * Math.sqrt(1 - rho * rho);
    const f = sumarDias(INICIO, t), d = diaDeLaSemana(f);
    let kg = PESO0 - (KG_SEM / 7) * t + e + 0.0035 / 2 * PESO0 * Math.cos(2 * Math.PI * ((d + 6) % 7) / 7);
    if (ciclo && (t + fase) % 28 < 5) kg += 0.45;
    if (dias === 'todos' || dias.includes(d)) p.push({ fecha: f, kg: Math.round(kg * 10) / 10 });
  }
  return p;
}
function recta(p, hoy, ventana, piso) {
  p = p.filter((x) => diasEntre(x.fecha, hoy) < ventana && x.fecha <= hoy);
  if (p.length < 4) return null;
  const xs = p.map((x) => diasEntre(hoy, x.fecha)), ys = p.map((x) => x.kg);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx;
  const res = ys.map((y, i) => y - (my + b * (xs[i] - mx)));
  const s = Math.max(0.35, Math.sqrt(res.reduce((t, e) => t + e * e, 0) / (res.length - 2)));
  let num = 0, den = 0; for (let i = 1; i < res.length; i++) num += res[i] * res[i - 1]; for (const e of res) den += e * e;
  const r1 = Math.min(0.9, Math.max(piso, num / den));
  return { b: b * 7, se: (s / Math.sqrt(sxx)) * Math.sqrt((1 + r1) / (1 - r1)) * 7 };
}
const z = 1.2816;
for (const [nombre, rho, dias, ciclo] of [['diario rho 0,6 + semana + ciclo', 0.6, 'todos', true], ['3/sem rho 0,6', 0.6, [1, 3, 5], false], ['1/sem rho 0,6', 0.6, [1], false], ['diario independiente', 0, 'todos', false]]) {
  for (const ventana of [28, 42]) {
    for (const piso of [0, 0.5]) {
      const r = azar(99); let cubre = 0, n = 0, anchos = [], alRitmo = 0;
      for (let k = 0; k < 1500; k++) {
        const p = serie(rho, dias, r, 90, ciclo); const x = recta(p, sumarDias(INICIO, 90), ventana, piso); if (!x) continue; n++;
        if (Math.abs(x.b + KG_SEM) <= z * x.se) cubre++;
        anchos.push(2 * z * x.se);
        const lo = -x.b - z * x.se, hi = -x.b + z * x.se, m = 0.1;
        if (!(hi < KG_SEM - m) && !(lo > KG_SEM + m)) alRitmo++;
      }
      anchos.sort((a, b) => a - b);
      console.log(`${nombre}, ventana ${ventana} d, piso de persistencia ${piso}: cubre ${(100 * cubre / n).toFixed(0)}% (80 pedido), ancho mediano ±${(anchos[Math.floor(n / 2)] / 2).toFixed(2)} kg/sem, «al ritmo» ${(100 * alRitmo / n).toFixed(0)}%`);
    }
  }
}
