// Réplica de macrosConProteina (metas.ts:156-167, equilibrada) para casos de mucho peso.
const aDiez = (n) => Math.round(n / 10) * 10;
function equilibrada(kcal, pesoKg, protG) {
  const proteina = Math.round(Math.min(protG, (kcal * 0.4) / 4));
  const grasas = Math.round(Math.max(pesoKg * 0.6, (kcal * 0.27) / 9));
  const carbohidratos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));
  return { kcal, proteina, grasas, carbohidratos, pctP: Math.round(proteina * 400 / kcal), pctG: Math.round(grasas * 900 / kcal), pctC: Math.round(carbohidratos * 400 / kcal) };
}
const mifflin = (p, h, a, s) => 10 * p + 6.25 * h - 5 * a + (s === 'f' ? -161 : 5);
// Mujer, 45 años, 165 cm, 140 kg, "poco" (1,35), bajar rápido (0,75 %/sem).
const g = mifflin(140, 165, 45, 'f') * 1.35;
const ajuste = -(0.0075 * 140 * 7700) / 7;
const kcal = Math.max(1200, aDiez(g + ajuste));
console.log('gasto', g.toFixed(0), 'ajuste', ajuste.toFixed(0), 'kcal', kcal);
console.log('hoy:', equilibrada(kcal, 140, 2.0 * 140));
const kcal1000 = Math.max(1200, aDiez(g - 1000));
console.log('con tope de 1.000 kcal:', equilibrada(kcal1000, 140, 2.0 * 140));
const ref = 30 * 1.65 ** 2;
console.log('peso de IMC 30:', ref.toFixed(1));
const conRef = (k) => { const p = Math.round(Math.min(2.0 * ref, k * 0.4 / 4)); const gr = Math.round(Math.min(k * 0.35 / 9, Math.max(ref * 0.6, k * 0.27 / 9))); return { kcal: k, proteina: p, grasas: gr, carbohidratos: Math.round((k - p * 4 - gr * 9) / 4), pctG: Math.round(gr * 900 / k) }; };
console.log('con tope y peso de referencia:', conRef(kcal1000));
// El caso del test (160 kg, 1.400 kcal).
console.log('test 160 kg 1400 kcal:', equilibrada(1400, 160, 2.0 * 160));
