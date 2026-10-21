#!/usr/bin/env node
// Validador del catálogo de constelaciones de Moss (sin dependencias).
// Uso: npm run catalogo:verificar   (o node herramientas/verificar-catalogo.mjs [ruta/a/constelaciones.json])
// Sale con código 1 si cualquier comprobación falla.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ruta = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'datos', 'constelaciones.json');
const errores = [];
const avisos = [];
const fallo = (m) => errores.push(m);

let data;
try { data = JSON.parse(readFileSync(ruta, 'utf8')); }
catch (e) { console.error(`No se pudo leer/parsear ${ruta}: ${e.message}`); process.exit(1); }

// ── utilidades
const RAD = Math.PI / 180;
function separacion(a, b) { // grados, fórmula de Vincenty (estable para cualquier ángulo)
  const d1 = a.dec * RAD, d2 = b.dec * RAD, dra = (b.ra - a.ra) * RAD;
  const num = Math.hypot(Math.cos(d2) * Math.sin(dra), Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(dra));
  const den = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dra);
  return Math.atan2(num, den) / RAD;
}
const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const decimales = (x) => { const s = String(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIPOS = new Set(['constelacion', 'asterismo', 'estrella']);
const IAU88 = new Set(('And Ant Aps Aqr Aql Ara Ari Aur Boo Cae Cam Cnc CVn CMa CMi Cap Car Cas Cen Cep Cet Cha Cir Col Com CrA CrB Crv Crt Cru ' +
  'Cyg Del Dor Dra Equ Eri For Gem Gru Her Hor Hya Hyi Ind Lac Leo LMi Lep Lib Lup Lyn Lyr Men Mic Mon Mus Nor Oct Oph Ori Pav Peg Per Phe Pic ' +
  'Psc PsA Pup Pyx Ret Sge Sgr Sco Scl Sct Ser Sex Tau Tel Tri TrA Tuc UMa UMi Vel Vir Vol Vul').split(' '));

// ── bloque fuente
const F = data.fuente;
if (!F || typeof F !== 'object') fallo('falta el bloque "fuente"');
else for (const k of ['posiciones', 'licencia', 'figuras', 'generado']) if (!texto(F[k])) fallo(`fuente.${k} vacío o ausente`);
if (F && texto(F.generado) && !/^\d{4}-\d{2}-\d{2}$/.test(F.generado)) fallo('fuente.generado debe ser AAAA-MM-DD');
if (!Array.isArray(data.constelaciones) || data.constelaciones.length === 0) { fallo('"constelaciones" debe ser un array no vacío'); }

const lista = Array.isArray(data.constelaciones) ? data.constelaciones : [];
const idsEntrada = new Set();
const porHR = new Map(); // coherencia de una misma estrella entre entradas
let aristaMax = { sep: 0, donde: '' };

lista.forEach((e, n) => {
  const ctx = `[${n}] ${e?.id ?? '¿sin id?'}`;
  // campos de la entrada
  if (!texto(e.id) || !SLUG.test(e.id)) fallo(`${ctx}: id ausente o no es un slug ascii en minúsculas`);
  else if (idsEntrada.has(e.id)) fallo(`${ctx}: id de entrada duplicado`);
  else idsEntrada.add(e.id);
  if (!texto(e.iau) || !IAU88.has(e.iau)) fallo(`${ctx}: código IAU inválido (${e.iau})`);
  if (!TIPOS.has(e.tipo)) fallo(`${ctx}: tipo inválido (${e.tipo})`);
  for (const k of ['la', 'es', 'en', 'grc']) if (!texto(e.nombres?.[k])) fallo(`${ctx}: nombres.${k} vacío o ausente`);
  const m = e.mito;
  if (!m || typeof m !== 'object') fallo(`${ctx}: falta "mito"`);
  else {
    for (const k of ['figura', 'heroe', 'resumen']) for (const l of ['es', 'en']) if (!texto(m[k]?.[l])) fallo(`${ctx}: mito.${k}.${l} vacío o ausente`);
    if (!Array.isArray(m.fuentes) || m.fuentes.length === 0 || !m.fuentes.every(texto)) fallo(`${ctx}: mito.fuentes debe ser una lista no vacía de textos`);
  }
  if ('nota' in e && !texto(e.nota)) fallo(`${ctx}: "nota" presente pero vacía`);

  // estrellas
  const est = Array.isArray(e.estrellas) ? e.estrellas : [];
  if (est.length < 1) fallo(`${ctx}: debe tener al menos 1 estrella`);
  if (e.tipo === 'estrella' && est.length !== 1) fallo(`${ctx}: tipo "estrella" con ${est.length} estrellas`);
  const ids = new Set(), hrs = new Set();
  est.forEach((s, i) => {
    const sc = `${ctx} estrella ${i} (${s?.nombre ?? '?'})`;
    if (!texto(s.id) || !SLUG.test(s.id)) fallo(`${sc}: id no es un slug ascii en minúsculas`);
    else if (ids.has(s.id)) fallo(`${sc}: id de estrella duplicado en la entrada`);
    ids.add(s.id);
    if (!texto(s.nombre)) fallo(`${sc}: nombre vacío`);
    if (!texto(s.bayer)) fallo(`${sc}: bayer vacío`);
    if (!Number.isInteger(s.hr) || s.hr < 1 || s.hr > 9110) fallo(`${sc}: hr inválido (${s.hr})`);
    else if (hrs.has(s.hr)) fallo(`${sc}: HR ${s.hr} repetido en la entrada`);
    hrs.add(s.hr);
    if (typeof s.ra !== 'number' || !Number.isFinite(s.ra) || s.ra < 0 || s.ra >= 360) fallo(`${sc}: RA fuera de [0,360) (${s.ra})`);
    if (typeof s.dec !== 'number' || !Number.isFinite(s.dec) || s.dec < -90 || s.dec > 90) fallo(`${sc}: Dec fuera de [-90,90] (${s.dec})`);
    if (typeof s.mag !== 'number' || !Number.isFinite(s.mag) || s.mag < -2 || s.mag > 7) fallo(`${sc}: magnitud inválida (${s.mag})`);
    if (decimales(s.ra) > 4 || decimales(s.dec) > 4) fallo(`${sc}: RA/Dec con más de 4 decimales`);
    if (decimales(s.mag) > 2) fallo(`${sc}: magnitud con más de 2 decimales`);
    if (i > 0 && typeof s.mag === 'number' && s.mag < est[i - 1].mag) fallo(`${sc}: estrellas no ordenadas por brillo (${est[i - 1].mag} antes de ${s.mag})`);
    if (Number.isInteger(s.hr)) {
      const prev = porHR.get(s.hr);
      if (prev && (prev.ra !== s.ra || prev.dec !== s.dec || prev.mag !== s.mag)) fallo(`${sc}: HR ${s.hr} con datos distintos que en ${prev.ctx}`);
      if (!prev) porHR.set(s.hr, { ra: s.ra, dec: s.dec, mag: s.mag, ctx });
    }
  });

  // líneas: índices, lazos, duplicados, distancia, conexión
  const lin = Array.isArray(e.lineas) ? e.lineas : null;
  if (!lin) { fallo(`${ctx}: "lineas" debe ser un array`); return; }
  if (est.length === 1 && lin.length > 0) fallo(`${ctx}: una entrada de una sola estrella no debe tener líneas`);
  const vistas = new Set();
  const adj = est.map(() => []);
  lin.forEach((ar, k) => {
    const lc = `${ctx} línea ${k} ${JSON.stringify(ar)}`;
    if (!Array.isArray(ar) || ar.length !== 2 || !ar.every((x) => Number.isInteger(x))) { fallo(`${lc}: debe ser un par de enteros`); return; }
    const [a, b] = ar;
    if (a < 0 || b < 0 || a >= est.length || b >= est.length) { fallo(`${lc}: índice fuera de rango (0..${est.length - 1})`); return; }
    if (a === b) { fallo(`${lc}: lazo (arista de una estrella consigo misma)`); return; }
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (vistas.has(key)) { fallo(`${lc}: arista duplicada`); return; }
    vistas.add(key);
    adj[a].push(b); adj[b].push(a);
    const sep = separacion(est[a], est[b]);
    if (!(sep < 35)) fallo(`${lc}: separación ${sep.toFixed(2)}° ≥ 35°`);
    if (sep > aristaMax.sep) aristaMax = { sep, donde: `${e.id}: ${est[a].nombre}–${est[b].nombre}` };
  });
  if (est.length > 1) {
    const visto = new Set([0]); const cola = [0];
    while (cola.length) { const u = cola.pop(); for (const v of adj[u]) if (!visto.has(v)) { visto.add(v); cola.push(v); } }
    if (visto.size !== est.length) {
      const sueltas = est.filter((_, i) => !visto.has(i)).map((s) => s.nombre);
      fallo(`${ctx}: grafo no conexo; sin unir: ${sueltas.join(', ')}`);
    }
  }
});

// ── cobertura por número de estrellas principales
const porCuenta = new Map();
for (const e of lista) {
  const n = Array.isArray(e.estrellas) ? e.estrellas.length : 0;
  const k = n >= 16 ? 16 : n;
  if (!porCuenta.has(k)) porCuenta.set(k, []);
  porCuenta.get(k).push(e);
}
for (let k = 1; k <= 15; k++) {
  const c = porCuenta.get(k)?.length ?? 0;
  if (c === 0) fallo(`cobertura: no hay ninguna entrada con ${k} estrellas`);
  else if (k >= 3 && k <= 10 && c < 3) avisos.push(`cobertura: solo ${c} entrada(s) con ${k} estrellas (ideal ≥ 3)`);
  else if (k >= 11 && c < 2) avisos.push(`cobertura: solo ${c} entrada(s) con ${k} estrellas (ideal ≥ 2)`);
}
if (!porCuenta.has(16)) fallo('cobertura: no hay entradas de 16 o más estrellas');

// ── comprobación de posiciones contra valores de referencia
const estrella = (nombre) => { for (const e of lista) for (const s of e.estrellas ?? []) if (s.nombre === nombre) return s; return null; };
// Separaciones angulares conocidas (grados):
//   aprox = valor redondeado habitual en la literatura de divulgación (tolerancia ±0,1°)
//   ref   = calculado con las posiciones J2000 de SIMBAD/Hipparcos, independientes del BSC (tolerancia ±0,01°)
const SEPARACIONES = [
  ['Dubhe', 'Merak', 5.4, 5.3740, 'los «punteros» del Carro'],
  ['Betelgeuse', 'Rigel', 18.6, 18.6060, 'hombro y pie de Orión'],
  ['Castor', 'Pollux', 4.5, 4.5056, 'los Gemelos'],
  ['Sirius', 'Procyon', 25.7, 25.7014, 'los dos Perros'],
  ['Vega', 'Deneb', 23.8, 23.8473, 'Triángulo de verano'],
  ['Vega', 'Altair', 34.2, 34.1952, 'Triángulo de verano'],
  ['Arcturus', 'Spica', 32.8, 32.7929, 'Arturo y Espiga'],
  ['Rigil Kentaurus', 'Hadar', 4.4, 4.4119, 'los Punteros del sur'],
];
// Posiciones J2000 de referencia (SIMBAD / Hipparcos), en grados.
const POSICIONES = [
  ['Vega', 279.234735, 38.783689], ['Sirius', 101.287155, -16.716116], ['Betelgeuse', 88.792939, 7.407064],
  ['Rigel', 78.634467, -8.201638], ['Polaris', 37.954561, 89.264109], ['Capella', 79.172328, 45.997991],
];
const filasRef = [];
for (const [a, b, aprox, ref, desc] of SEPARACIONES) {
  const A = estrella(a), B = estrella(b);
  if (!A || !B) { fallo(`referencia: no se encuentra ${!A ? a : b} en el catálogo`); continue; }
  const s = separacion(A, B);
  const ok = Math.abs(s - aprox) <= 0.1 && Math.abs(s - ref) <= 0.01;
  if (!ok) fallo(`referencia: ${a}–${b} = ${s.toFixed(4)}° (≈${aprox}°; Hipparcos ${ref}°)`);
  filasRef.push(`  ${ok ? 'OK ' : 'MAL'} ${(a + '–' + b).padEnd(22)} ${s.toFixed(4).padStart(8)}°  ≈${String(aprox).padEnd(4)} · Hipparcos ${ref.toFixed(4)}° (Δ ${((s - ref) * 3600).toFixed(1)}")  ${desc}`);
}
for (const [n, ra, dec] of POSICIONES) {
  const s = estrella(n);
  if (!s) { fallo(`referencia: no se encuentra ${n}`); continue; }
  const d = separacion(s, { ra, dec }) * 3600;
  const ok = d <= 5;
  if (!ok) fallo(`referencia: ${n} a ${d.toFixed(1)}" de su posición J2000 de referencia`);
  filasRef.push(`  ${ok ? 'OK ' : 'MAL'} posición de ${n.padEnd(16)} a ${d.toFixed(1).padStart(4)}" de SIMBAD/Hipparcos J2000`);
}

// ── informe
console.log(`Catálogo: ${ruta}`);
console.log(`Entradas: ${lista.length} · estrellas distintas: ${porHR.size} · arista más larga: ${aristaMax.sep.toFixed(2)}° (${aristaMax.donde})\n`);
console.log('Estrellas principales → entradas');
for (const k of [...porCuenta.keys()].sort((a, b) => a - b)) {
  const nombres = porCuenta.get(k).map((e) => (k === 16 ? `${e.nombres?.es} (${e.estrellas.length})` : e.nombres?.es)).join(' · ');
  console.log(`  ${(k === 16 ? '16+' : String(k)).padStart(3)} (${porCuenta.get(k).length}): ${nombres}`);
}
console.log('\nComprobación de posiciones contra valores de referencia');
console.log(filasRef.join('\n'));
if (avisos.length) console.log('\nAvisos (no bloquean):\n  ' + avisos.join('\n  '));
if (errores.length) {
  console.error(`\nFALLÓ: ${errores.length} error(es)\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log('\nOK: todas las comprobaciones pasaron.');
