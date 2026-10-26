// El ícono y la marca de la pantalla de inicio de Moss: la luna de la comida (la misma de
// galeria/src/luna.js) y una constelación chica, sobre el cielo de la noche. Se arman con
// `node herramientas/icono.mjs` y quedan en assets/images.
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

function fase(p, r) {
  const rx = Math.abs(Math.cos(Math.PI * p)) * r;
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
}

/** La luna, en (0, 0) con radio 40. */
function luna(id) {
  const d = fase(0.64, 40);
  return `
    <defs>
      <radialGradient id="${id}c" cx="36%" cy="32%" r="76%"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.5" stop-color="#f0e5ca"/><stop offset="0.88" stop-color="#d6c39b"/><stop offset="1" stop-color="#bfa77a"/></radialGradient>
      <radialGradient id="${id}n" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#1d2650"/><stop offset="1" stop-color="#0c1228"/></radialGradient>
      <filter id="${id}h" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
      <filter id="${id}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.7"/></filter>
      <mask id="${id}m" maskUnits="userSpaceOnUse" x="-60" y="-60" width="120" height="120"><path d="${d}" fill="#fff" filter="url(#${id}b)"/></mask>
      <clipPath id="${id}d"><circle r="40"/></clipPath>
    </defs>
    <path d="${d}" fill="#f6e3a6" opacity="0.28" filter="url(#${id}h)" transform="scale(1.06)"/>
    <g clip-path="url(#${id}d)">
      <circle r="40" fill="url(#${id}n)"/>
      <g mask="url(#${id}m)">
        <circle r="40" fill="url(#${id}c)"/>
        <g fill="#a48d62" opacity="0.38" filter="url(#${id}s)"><ellipse cx="-12" cy="-14" rx="11" ry="8.5"/><ellipse cx="5" cy="-10" rx="7" ry="6"/><ellipse cx="13" cy="0" rx="7.5" ry="7"/><ellipse cx="-20" cy="6" rx="7.5" ry="13"/><ellipse cx="-2" cy="15" rx="6.5" ry="4.2"/><ellipse cx="20" cy="14" rx="4.5" ry="3.6"/></g>
        <circle r="40" fill="none" stroke="#8a7348" stroke-opacity="0.4" stroke-width="5" filter="url(#${id}s)"/>
      </g>
    </g>
    <circle r="40" fill="none" stroke="rgba(246,227,166,0.34)" stroke-width="0.7"/>`;
}

/** Una constelación chica, como las del cielo de Hábitos: estrellas doradas unidas por un hilo. */
function constelacion(id, estrellas, ancho) {
  return `
    <defs><filter id="${id}e" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="${ancho * 3.2}"/></filter></defs>
    <polyline points="${estrellas.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="#e8c46a" stroke-opacity="0.6" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"/>
    ${estrellas.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="#f6e3a6" opacity="0.45" filter="url(#${id}e)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fbefc8"/>`).join('')}`;
}

// Estrellas finas de fondo, repartidas sin patrón (secuencias de Weyl), lejos de la luna.
const fondo = [];
for (let i = 1; fondo.length < 22; i++) {
  const x = ((i * 0.6180339) % 1) * 1024;
  const y = ((i * 0.7548776) % 1) * 1024;
  if (Math.hypot(x - 410, y - 610) < 330) continue;
  fondo.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.3 + (i % 4) * 0.45).toFixed(2)}" fill="#efe6cf" opacity="${(0.16 + (i % 5) * 0.06).toFixed(2)}"/>`);
}
const icono = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><radialGradient id="cielo" cx="58%" cy="30%" r="85%"><stop offset="0" stop-color="#18245a"/><stop offset="0.55" stop-color="#0a1130"/><stop offset="1" stop-color="#03050c"/></radialGradient></defs>
  <rect width="1024" height="1024" fill="url(#cielo)"/>
  ${fondo.join('')}
  ${constelacion('i', [[560, 262, 13], [676, 214, 10], [790, 262, 11], [838, 384, 9]], 4)}
  <g transform="translate(410 610) scale(6)">${luna('i')}</g>
</svg>`;
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  ${constelacion('s', [[318, 168, 7.5], [386, 140, 6], [452, 168, 6.5], [480, 240, 5.5]], 2.4)}
  <g transform="translate(246 354) scale(3.5)">${luna('s')}</g>
</svg>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await p.setContent(`<html><body style="margin:0;background:#03050c">${icono}</body></html>`);
await p.waitForTimeout(300);
await p.screenshot({ path: 'assets/images/icon.png', clip: { x: 0, y: 0, width: 1024, height: 1024 } });
await p.setViewportSize({ width: 600, height: 600 });
await p.setContent(`<html><body style="margin:0;background:transparent">${splash}</body></html>`);
await p.waitForTimeout(300);
await p.screenshot({ path: 'assets/images/splash-icon.png', clip: { x: 0, y: 0, width: 600, height: 600 }, omitBackground: true });
await b.close();
writeFileSync('assets/images/icono.svg', icono);
console.log('assets/images/icon.png y splash-icon.png');
