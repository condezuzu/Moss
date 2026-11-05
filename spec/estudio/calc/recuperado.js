// La cuenta de recuperado.ts, copiada tal cual, sobre días posibles: ¿qué franja da después de una noche corta?
const sentidaSobre100 = (c) => (Math.min(5, Math.max(1, Math.round(c))) - 1) * 25;
function calidadParaRecuperar(reloj, sentida) { const t = sentida === null ? null : sentidaSobre100(sentida); if (reloj === null) return t; return t === null ? reloj : (reloj + t) / 2; }
function recuperado(d) {
  const cal = calidadParaRecuperar(d.calidad, d.sentida);
  const sueno = Math.round(20 * Math.min(1, d.dormido / d.necesidad) + 20 * (cal ?? 50) / 100);
  const musculos = Math.round(40 * (1 - Math.min(100, Math.max(0, d.fatiga)) / 100));
  const comida = Math.round(10 * Math.min(1, d.p / d.mp) + 10 * Math.min(1, d.k / (0.8 * d.mk)));
  const total = sueno + musculos + comida;
  const banda = total >= 85 ? 'muyBien' : total >= 70 ? 'bien' : total >= 50 ? 'aceptable' : 'atencion';
  return { total, banda, sueno, musculos, comida };
}
const ej = (o) => recuperado({ necesidad: 480, sentida: null, mp: 150, mk: 2300, ...o });
console.log('5 h 50, calidad 46, fatiga 2 %, comida 18 de 20 (el día de ejemplo):', ej({ dormido: 350, calidad: 46, fatiga: 2, p: 140, k: 2100 }));
console.log('5 h, sin calidad, músculos frescos, comida en la meta:', ej({ dormido: 300, calidad: null, fatiga: 0, p: 150, k: 2300 }));
console.log('4 h 30, calidad 30, músculos frescos, comida en la meta:', ej({ dormido: 270, calidad: 30, fatiga: 0, p: 150, k: 2300 }));
console.log('8 h, calidad 85, músculos frescos, ayer sin anotar nada:', ej({ dormido: 480, calidad: 85, fatiga: 0, p: 0, k: 0 }));
console.log('8 h, calidad 85, piernas cargadas (fatiga 40 %), comida en la meta:', ej({ dormido: 480, calidad: 85, fatiga: 40, p: 150, k: 2300 }));
// Todas las combinaciones con una noche de 6 h o menos (el umbral de Craven 2022), con calidad de 20 a 80 o sin ella,
// fatiga de 0 a 20 % (un día con sesión, de una rutina dividida) y la comida entre el 80 y el 110 % de la meta.
let n = 0; const cuenta = { muyBien: 0, bien: 0, aceptable: 0, atencion: 0 };
for (let h = 270; h <= 360; h += 10) for (const c of [null, 20, 35, 50, 65, 80]) for (let f = 0; f <= 20; f += 2) for (const x of [0.8, 0.9, 1, 1.1]) {
  const r = ej({ dormido: h, calidad: c, fatiga: f, p: 150 * x, k: 2300 * x }); cuenta[r.banda]++; n++;
}
console.log('Noches de 4 h 30 a 6 h, fatiga de 0 a 20 %, comida del 80 al 110 %:', Object.fromEntries(Object.entries(cuenta).map(([k, v]) => [k, (100 * v / n).toFixed(0) + ' %'])));
