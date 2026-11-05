// Cuentas de apoyo para el estudio (no toca el repo).
const mifflin = (p, h, a, s) => 10 * p + 6.25 * h - 5 * a + (s === 'f' ? -161 : 5);
const nasem = {
  m: { inactivo: [753.07, 6.50, 14.10], bajo: [581.47, 8.30, 14.94], activo: [1004.82, 6.52, 15.91], muy: [-517.88, 15.61, 19.11], edad: 10.83 },
  f: { inactivo: [584.90, 5.72, 11.71], bajo: [575.77, 6.60, 12.14], activo: [710.25, 6.54, 12.34], muy: [511.83, 9.07, 12.56], edad: 7.01 },
};
const tee = (s, cat, a, h, p) => { const [b, ch, cp] = nasem[s][cat]; return b - nasem[s].edad * a + ch * h + cp * p; };
console.log('== Ejemplo de la galería: 29 a, 172 cm, 74,5 kg, hombre');
const r = mifflin(74.5, 172, 29, 'm');
console.log('Mifflin', r.toFixed(0), ' x1,35', (r * 1.35).toFixed(0), ' x1,4', (r * 1.4).toFixed(0), ' x1,65', (r * 1.65).toFixed(0));
for (const c of ['inactivo', 'bajo', 'activo', 'muy']) console.log('NASEM 2023', c, tee('m', c, 29, 172, 74.5).toFixed(0));
console.log('== Mujer 45 a, 160 cm, 70 kg');
const rf = mifflin(70, 160, 45, 'f');
console.log('Mifflin', rf.toFixed(0), ' x1,35', (rf * 1.35).toFixed(0), ' x1,4', (rf * 1.4).toFixed(0));
for (const c of ['inactivo', 'bajo']) console.log('NASEM 2023', c, tee('f', c, 45, 160, 70).toFixed(0));
console.log('== Mujer 30 a, 165 cm, 95 kg');
const rg = mifflin(95, 165, 30, 'f');
console.log('Mifflin', rg.toFixed(0), ' x1,35', (rg * 1.35).toFixed(0), ' x1,4', (rg * 1.4).toFixed(0));
for (const c of ['inactivo', 'bajo']) console.log('NASEM 2023', c, tee('f', c, 30, 165, 95).toFixed(0));

console.log('\n== Error del gasto medido por la pendiente (MCO con pesadas diarias), 7700 kcal/kg');
for (const sigma of [0.4, 0.6]) {
  for (const n of [7, 14, 21, 28]) {
    const sxx = n * (n * n - 1) / 12;
    const se = sigma / Math.sqrt(sxx) * 7700;
    console.log(`ruido ${sigma} kg, ${n} días: EE ${se.toFixed(0)} kcal/día`);
  }
}
// Con una pesada cada 7 días (interpolando): pendiente de dos o tres puntos.
for (const sigma of [0.4, 0.6]) {
  for (const [puntos, dias] of [[2, 7], [3, 14], [4, 21]]) {
    const xs = Array.from({ length: puntos }, (_, i) => i * 7);
    const mx = xs.reduce((a, b) => a + b, 0) / puntos;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    console.log(`ruido ${sigma} kg, una pesada por semana (${puntos} pesadas en ${dias} días): EE ${(sigma / Math.sqrt(sxx) * 7700).toFixed(0)} kcal/día`);
  }
}

console.log('\n== El relleno plano después de la última pesada (como pesosDiarios)');
// Baja de verdad 0,5 kg por semana; se pesa los días 0, 7 y 14; el control mira hasta el día 20.
const real = -0.5 / 7;
function pendienteRellena(pesadasEn, fin) {
  const ys = []; const xs = [];
  for (let d = 0; d <= fin; d++) {
    const antes = pesadasEn.filter((p) => p <= d).pop();
    const despues = pesadasEn.find((p) => p > d);
    const y = despues !== undefined ? real * antes + (real * despues - real * antes) * (d - antes) / (despues - antes) : real * antes;
    xs.push(d); ys.push(y);
  }
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  return xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
}
for (const [pesadas, fin] of [[[0, 7, 14], 20], [[0, 7, 14, 20], 20], [[0, 3, 7, 10, 14, 17], 20], [[0, 14], 20], [[0], 6], [[0, 6], 6]]) {
  const b = pendienteRellena(pesadas, fin);
  const sesgo = (b - real) * 7700;
  console.log(`pesadas ${JSON.stringify(pesadas)} hasta el día ${fin}: pendiente ${(b * 7).toFixed(3)} kg/sem (real -0,5): el gasto medido queda ${sesgo.toFixed(0)} kcal/día`);
}

console.log('\n== La primera semana de un déficit: el glucógeno y el agua');
// 1,5 kg de agua y glucógeno en la primera semana, además de lo real (0,5 kg por semana).
const pendienteSemana = -(1.5 + 0.5) / 7;
const comida = 1900, antes = 2400;
const medido = comida - pendienteSemana * 7700;
console.log(`medido ${medido.toFixed(0)} kcal (real 2400); con el 25 %: ${(antes + 0.25 * (medido - antes)).toFixed(0)}`);

console.log('\n== Las grasas mínimas (0,6 g/kg) en gente pesada');
for (const [kg, kcal] of [[70, 1800], [100, 1800], [120, 2000], [150, 2000], [150, 2400]]) {
  const g = Math.max(0.6 * kg, 0.27 * kcal / 9);
  console.log(`${kg} kg, ${kcal} kcal: grasas ${g.toFixed(0)} g = ${(g * 9 / kcal * 100).toFixed(0)} % de las kcal`);
}
console.log('\n== El ritmo rápido (0,75 %/sem) en kcal por día');
for (const kg of [60, 80, 100, 120, 133, 150]) console.log(`${kg} kg: ${(0.0075 * kg * 7700 / 7).toFixed(0)} kcal/día, ${(0.0075 * kg).toFixed(2)} kg/sem`);
console.log('\n== Fibra: 14 g cada 1.000 kcal contra 25 g');
for (const kcal of [1200, 1500, 1800, 2000, 2500]) console.log(`${kcal} kcal: ${Math.round(14 * kcal / 1000)} g`);
console.log('\n== Proteína sin la grasa: por el peso de hoy y por el de un IMC de 30 (Weijs 2024)');
for (const [kg, cm] of [[110, 160], [130, 170], [90, 175]]) {
  const imc30 = 30 * (cm / 100) ** 2;
  const ref = Math.min(kg, imc30);
  console.log(`${kg} kg, ${cm} cm (IMC ${(kg / (cm / 100) ** 2).toFixed(1)}): 2,0 g/kg = ${(2 * kg).toFixed(0)} g; con el peso de IMC 30 (${imc30.toFixed(1)} kg) = ${(2 * ref).toFixed(0)} g`);
}
