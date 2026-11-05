// Cuánto se puede leer del ritmo de Moss con el ruido de verdad del peso. Usa el código de Moss
// transpilado (dominio/), sin cambiarlo. Uso: node simular.js
const { sumarDias, diasEntre, diaDeLaSemana } = require('./dominio/fechas');
const { tendencia } = require('./dominio/control');
const { ritmoSemanal, progresoAlObjetivo, plazoConRitmo, planPorEtapas } = require('./dominio/progreso');

function azar(semilla) { // mulberry32
  let a = semilla >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const normal = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const INICIO = '2026-01-05'; // lunes
const PESO0 = 80, META = 72, PCT = 0.5; // el plan: 0,5 % por semana, unos 0,4 kg
const KG_SEM = (PCT / 100) * PESO0;
const verdad = (t) => PESO0 - (KG_SEM / 7) * t;

// Los modelos de ruido: sd y persistencia (AR(1)) del ruido diario; semana: amplitud del patrón semanal
// (Turicchi 2020: 0,35 % pico a pico); ciclo: +0,45 kg los 5 días de la menstruación (Kanellakis 2023).
const MODELOS = {
  'diario, ruido 0,5 kg independiente': { sd: 0.5, rho: 0, dias: 'todos' },
  'diario, ruido 0,5 kg que dura (rho 0,6)': { sd: 0.5, rho: 0.6, dias: 'todos' },
  'diario, rho 0,6 + semana 0,35 % + ciclo': { sd: 0.5, rho: 0.6, dias: 'todos', semana: 0.0035, ciclo: 0.45 },
  '3 por semana (lu, mi, vi), rho 0,6': { sd: 0.5, rho: 0.6, dias: [1, 3, 5] },
  '1 por semana (lunes), rho 0,6': { sd: 0.5, rho: 0.6, dias: [1] },
};

function serie(m, r, n) {
  const pesadas = [];
  let e = 0;
  const fase = Math.floor(r() * 28);
  for (let t = 0; t <= n; t++) {
    const innov = normal(r) * m.sd * Math.sqrt(1 - m.rho * m.rho);
    e = t === 0 ? normal(r) * m.sd : m.rho * e + innov;
    const fecha = sumarDias(INICIO, t);
    const dia = diaDeLaSemana(fecha);
    let kg = verdad(t) + e;
    // El fin de semana sube y baja de martes a viernes: una onda con el pico el lunes.
    if (m.semana) kg += (m.semana / 2) * PESO0 * Math.cos((2 * Math.PI * ((dia + 6) % 7)) / 7);
    if (m.ciclo && (t + fase) % 28 < 5) kg += m.ciclo;
    const toca = m.dias === 'todos' || m.dias.includes(dia);
    if (toca) pesadas.push({ fecha, kg: Math.round(kg * 10) / 10 });
  }
  return pesadas;
}

// Lo propuesto: la recta por las pesadas de verdad (sin rellenar) de los últimos 28 días, con su error
// corregido por la persistencia del ruido (AR(1) de los residuos).
function rectaConError(pesadas, hoy, ventana = 28) {
  const p = pesadas.filter((x) => x.fecha <= hoy && diasEntre(x.fecha, hoy) < ventana);
  if (p.length < 4) return null;
  const xs = p.map((x) => diasEntre(hoy, x.fecha)), ys = p.map((x) => x.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const b = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx;
  const res = ys.map((y, i) => y - (my + b * (xs[i] - mx)));
  const s2 = res.reduce((s, e) => s + e * e, 0) / (res.length - 2);
  let num = 0, den = 0;
  for (let i = 1; i < res.length; i++) { num += res[i] * res[i - 1]; }
  for (let i = 0; i < res.length; i++) den += res[i] * res[i];
  const r1 = Math.max(0, Math.min(0.9, num / den));
  const se = Math.sqrt(s2 / sxx) * Math.sqrt((1 + r1) / (1 - r1));
  return { kgSem: b * 7, se: se * 7 };
}

const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };
const N = 1500;
for (const [nombre, m] of Object.entries(MODELOS)) {
  console.log(`\n=== ${nombre} ===`);
  for (const dia of [21, 28, 42, 84]) {
    const r = azar(1234 + dia);
    const ritmos = [], estados = {}, como = {}, errFecha = [], cubre = [], anchos = [], clas = {};
    for (let k = 0; k < N; k++) {
      const pesadas = serie(m, r, dia);
      const hoy = sumarDias(INICIO, dia);
      const t = tendencia(pesadas, hoy);
      const ritmo = ritmoSemanal(t, hoy, pesadas);
      if (ritmo === null) { estados.sinRitmo = (estados.sinRitmo || 0) + 1; continue; }
      ritmos.push(ritmo);
      const peso = t.get(hoy);
      const pr = progresoAlObjetivo({ hoy, tendencia: t, pesadas, objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: META, pesoInicial: PESO0 });
      estados[pr.estado] = (estados[pr.estado] || 0) + 1;
      const plazo = plazoConRitmo({ hoy, pesoKg: peso, pesoMeta: META, sexo: 'f', edad: 30, gasto: 2300, entrenaFuerza: true }, PCT);
      const pl = planPorEtapas({ hoy, pesoKg: peso, objetivo: 'bajar', pesoMeta: META, plazo, ritmo });
      como[pl.comoVienes] = (como[pl.comoVienes] || 0) + 1;
      const real = Math.round(((verdad(dia) - META) / KG_SEM) * 7);
      if (pr.fecha) errFecha.push((diasEntre(hoy, pr.fecha) - real) / 7);
      const rc = rectaConError(pesadas, hoy);
      if (rc) {
        const z = 1.2816; // 80 %
        cubre.push(Math.abs(rc.kgSem + KG_SEM) <= z * rc.se ? 1 : 0);
        anchos.push(2 * z * rc.se);
        const lo = -rc.kgSem - z * rc.se, hi = -rc.kgSem + z * rc.se; // avance (positivo es bajar)
        const margen = Math.max(0.25 * KG_SEM, 0.1);
        const c = hi < KG_SEM - margen ? 'atrasado' : lo > KG_SEM + margen ? 'adelantado' : 'alRitmo';
        clas[c] = (clas[c] || 0) + 1;
      }
    }
    const n = ritmos.length;
    const f = (o) => Object.entries(o).map(([k, v]) => `${k} ${(100 * v / N).toFixed(0)}%`).join(', ');
    const sd = Math.sqrt(ritmos.reduce((s, x) => s + (x + KG_SEM) ** 2, 0) / n);
    console.log(`día ${dia}: ritmo medido (verdad −${KG_SEM.toFixed(2)}): media ${(ritmos.reduce((a, b) => a + b, 0) / n).toFixed(3)}, error típico ${sd.toFixed(3)} kg/sem, 5–95 %: ${pct(ritmos, 0.05).toFixed(2)} a ${pct(ritmos, 0.95).toFixed(2)}`);
    console.log(`   progresoAlObjetivo: ${f(estados)}`);
    console.log(`   planPorEtapas (cómo vienes, con el ritmo justo en el plan): ${f(como)}`);
    if (errFecha.length) console.log(`   fecha a tu ritmo menos la real, semanas: 5–95 % ${pct(errFecha, 0.05).toFixed(1)} a ${pct(errFecha, 0.95).toFixed(1)} (mediana ${pct(errFecha, 0.5).toFixed(1)})`);
    if (cubre.length) console.log(`   recta 28 d con error: cubre la verdad el ${(100 * cubre.reduce((a, b) => a + b, 0) / cubre.length).toFixed(0)}% (pedido 80%), ancho mediano ${pct(anchos, 0.5).toFixed(2)} kg/sem; clasifica: ${f(clas)}`);
  }
}
