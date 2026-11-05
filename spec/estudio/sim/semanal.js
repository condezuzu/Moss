// La recta por los promedios de cada semana (con t de Student): ¿cubre lo que dice?
const { sumarDias, diasEntre, diaDeLaSemana } = require('./dominio/fechas');
function azar(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const INICIO = '2026-01-05', PESO0 = 80, KG_SEM = 0.4;
const T80 = { 1: 3.078, 2: 1.886, 3: 1.638, 4: 1.533, 5: 1.476, 6: 1.440, 7: 1.415 };
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
function porSemanas(p, hoy, semanas) {
  const puntos = [];
  for (let s = 0; s < semanas; s++) {
    const fin = sumarDias(hoy, -7 * s), ini = sumarDias(fin, -6);
    const en = p.filter((x) => x.fecha >= ini && x.fecha <= fin);
    if (!en.length) continue;
    puntos.push([-7 * s - 3, en.reduce((a, x) => a + x.kg, 0) / en.length]);
  }
  if (puntos.length < 3) return null;
  const mx = puntos.reduce((a, [x]) => a + x, 0) / puntos.length, my = puntos.reduce((a, [, y]) => a + y, 0) / puntos.length;
  const sxx = puntos.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  const b = puntos.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / sxx;
  const sse = puntos.reduce((s, [x, y]) => s + (y - (my + b * (x - mx))) ** 2, 0);
  const df = puntos.length - 2;
  const s = Math.max(Math.sqrt(sse / df), 0.2); // un piso: con pocas semanas, el ruido medido puede salir casi cero
  return { b: b * 7, se: (s / Math.sqrt(sxx)) * 7, df };
}
for (const [nombre, rho, dias, ciclo] of [['diario rho 0,6 + semana + ciclo', 0.6, 'todos', true], ['3/sem rho 0,6', 0.6, [1, 3, 5], false], ['1/sem rho 0,6', 0.6, [1], false], ['diario independiente', 0, 'todos', false]]) {
  for (const semanas of [3, 4, 6, 8]) {
    const r = azar(7); let cubre = 0, n = 0; const anchos = []; let alRitmo = 0, despacioDistinto = 0;
    for (let k = 0; k < 2000; k++) {
      const p = serie(rho, dias, r, 90, ciclo); const x = porSemanas(p, sumarDias(INICIO, 90), semanas); if (!x) continue; n++;
      const h = T80[x.df] * x.se; anchos.push(h);
      if (Math.abs(x.b + KG_SEM) <= h) cubre++;
      const lo = -x.b - h, hi = -x.b + h;
      if (!(hi < KG_SEM - 0.1) && !(lo > KG_SEM + 0.1)) alRitmo++;
      if (hi < KG_SEM && lo > KG_SEM / 2 || lo > KG_SEM / 2) despacioDistinto++; // se descarta «menos de la mitad del plan»
    }
    anchos.sort((a, b) => a - b);
    console.log(`${nombre}, ${semanas} semanas: cubre ${(100 * cubre / n).toFixed(0)}% (80 pedido), ±${anchos[Math.floor(n / 2)].toFixed(2)} kg/sem (mediana), «al ritmo» ${(100 * alRitmo / n).toFixed(0)}%, descarta «despacio» ${(100 * despacioDistinto / n).toFixed(0)}%`);
  }
}
