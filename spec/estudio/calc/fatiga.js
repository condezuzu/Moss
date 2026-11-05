// El modelo de musculos.ts (caidaInicial y residual, copiados) contra lo medido en los estudios, en el músculo principal.
// Como en la app: sin la marca de «al fallo» (Ascent no la manda), τ crece solo con 10 series o más.
const caida = (D) => 30 * (1 - Math.exp(-D / 8));
const resid = ({ D, tau, series, fallo = false }, h) => caida(D) * Math.exp(-h / (tau * ((fallo || series >= 10) ? 1.5 : 1)));
// El esfuerzo de una serie con repeticiones y el 1RM estimado (Epley): reserva 0-1 → 1; 2-3 → 0,6; 4+ → 0,3.
const esfuerzo = (pct, reps) => { const posibles = 30 * (1 / pct - 1); const r = posibles - reps; return r <= 1 ? 1 : r <= 3 ? 0.6 : 0.3; };
const casos = [
  { cita: 'Belcher 2019: sentadilla 4 × al fallo al 80 %', D: 4 * 1, tau: 36, series: 4, medido: { 24: 'vel. baja', 72: '−8,6 % (vel.)' } },
  { cita: 'Belcher 2019: press banca 4 × al fallo al 80 %', D: 4, tau: 18, series: 4, medido: { 24: 'sin caída', 72: 'sin caída' } },
  { cita: 'Refalo 2023: press banca 6 × al fallo al 75 %', D: 6, tau: 18, series: 6, medido: { 24: '−3 % (vel.)', 48: 'sin diferencias' } },
  { cita: 'Refalo 2023: press banca 6 × a 3 de reserva', D: 6 * esfuerzo(0.75, 10 - 3), tau: 18, series: 6, medido: { 24: '+2 % (vel.)' } },
  { cita: 'Thomas 2018: sentadilla 10 × 5 al 80 %', D: 10 * esfuerzo(0.8, 5), tau: 36, series: 10, medido: { 72: 'resuelto' } },
  { cita: 'Davies 2018 (hombres): sentadilla 5 × 5 al 80 % + 1 al fallo', D: 5 * esfuerzo(0.8, 5) + 1, tau: 36, series: 6, medido: { 24: '−10 % (salto)', 72: '−3 % (salto)' } },
  { cita: 'Soares 2015: curl 8 × 10RM', D: 8, tau: 18, series: 8, medido: { 24: '−8,4 % (fuerza)' } },
  { cita: 'Soares 2015: remo 8 × 10RM', D: 8, tau: 18, series: 8, medido: { 24: 'recuperado' } },
  { cita: 'Bartolomei 2017: 8 × 10 (piernas)', D: 8, tau: 36, series: 8, medido: { 72: 'todavía baja (isométrica)' } },
];
for (const c of casos) {
  const v = [24, 48, 72].map((h) => `${h} h: ${resid(c, h).toFixed(1)} %`).join(' · ');
  console.log(`${c.cita}\n   modelo: caída ${caida(c.D).toFixed(1)} % · ${v}\n   medido: ${Object.entries(c.medido).map(([h, x]) => `${h} h ${x}`).join(' · ')}`);
}
// Listo en (baja del 3 %), para piernas con 6, 10 y 15 series duras sin repeticiones anotadas (esfuerzo 1).
for (const s of [6, 10, 15]) { const c = { D: s, tau: 36, series: s }; let h = 0; while (resid(c, h) >= 3 && h < 400) h++; console.log(`Piernas, ${s} series sin reps: listo en ${h} h (~${(h / 24).toFixed(1)} días)`); }
