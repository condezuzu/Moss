// La luna de la comida: la parte iluminada es lo que llevás del día. Desde el 27/10, en los colores
// de Moss: luz de luna cálida (pergamino que va a dorado), los mares suaves con algunos cráteres, la
// sombra del borde, un resplandor que crece con la fase como el de las estrellas, y el disco oscuro
// con su borde, que siempre muestra la meta. Pasada la meta, el borde y el resplandor se doran.
// La app dibuja lo mismo con Skia (src/secciones/comida/LunaSkia.tsx).

const Luna = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  let lunas = 0;

  // La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de entrada.js.
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }
  const salida = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

  /**
   * Una luna de `tam` píxeles de CSS (el disco ocupa el 80 %; el resplandor sale del cuadro).
   * `ir(fraccion)` lleva la fase a lo comido sobre la meta: 0 es nueva y 1, llena; más de 1, pasada.
   */
  function crear({ tam, clase }) {
    const id = `luna${++lunas}`;
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '-50 -50 100 100');
    svg.setAttribute('class', 'luna ' + (clase || ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = tam + 'px';
    svg.style.height = tam + 'px';
    svg.innerHTML = `
      <defs>
        <radialGradient id="${id}-cara" cx="36%" cy="32%" r="76%">
          <stop offset="0" stop-color="#fffaf0"/><stop offset="0.5" stop-color="#f0e5ca"/><stop offset="0.88" stop-color="#d6c39b"/><stop offset="1" stop-color="#bfa77a"/>
        </radialGradient>
        <radialGradient id="${id}-noche" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#1b2342"/><stop offset="1" stop-color="#0b1022"/></radialGradient>
        <filter id="${id}-resplandor" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
        <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>
        <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="7"/>
          <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 1 -0.4"/>
          <feComposite in2="SourceAlpha" operator="in"/>
        </filter>
        <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-60" y="-60" width="120" height="120"><path class="luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
        <clipPath id="${id}-disco"><circle r="40"/></clipPath>
      </defs>
      <path class="luna-resplandor" filter="url(#${id}-resplandor)" transform="scale(1.06)"/>
      <g clip-path="url(#${id}-disco)">
        <circle r="40" fill="url(#${id}-noche)"/>
        <g mask="url(#${id}-luz)">
          <circle r="40" fill="url(#${id}-cara)"/>
          <g class="luna-mares" filter="url(#${id}-suave)">
            <ellipse cx="-12" cy="-14" rx="11" ry="8.5"/><ellipse cx="5" cy="-10" rx="7" ry="6"/><ellipse cx="13" cy="0" rx="7.5" ry="7"/>
            <ellipse cx="-20" cy="6" rx="7.5" ry="13"/><ellipse cx="-2" cy="15" rx="6.5" ry="4.2"/><ellipse cx="20" cy="14" rx="4.5" ry="3.6"/>
          </g>
          <g class="luna-crateres"><circle cx="-6" cy="27" r="2.4"/><circle cx="10" cy="23" r="1.5"/><circle cx="24" cy="-2" r="1.3"/><circle cx="-26" cy="-6" r="1.2"/></g>
          <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.16"/>
          <circle r="40" class="luna-limbo" filter="url(#${id}-suave)"/>
        </g>
      </g>
      <circle r="40" class="luna-contorno"/>`;
    const faseEl = svg.querySelector('.luna-fase');
    const resplandor = svg.querySelector('.luna-resplandor');
    let ahora = 0;
    let cuadro = 0;
    const dibujar = (v) => {
      const p = Math.min(1, Math.max(0, v));
      const d = fase(0.04 + 0.96 * p, 40);
      faseEl.setAttribute('d', d);
      resplandor.setAttribute('d', d);
      // El resplandor crece con la fase; pasada la meta, se dora.
      resplandor.style.opacity = String(v > 1 ? 0.36 : 0.07 + 0.2 * p);
      svg.classList.toggle('pasada', v > 1.0001);
    };

    return {
      el: svg,
      get fraccion() { return ahora; },
      // De lo que muestra ahora a `hasta`, en `ms`.
      ir(hasta, ms) {
        cancelAnimationFrame(cuadro);
        const desde = ahora;
        if (!ms || Math.abs(hasta - desde) < 1e-4) { ahora = hasta; dibujar(hasta); return; }
        const t0 = performance.now();
        const paso = (t) => {
          const k = salida((t - t0) / ms);
          ahora = desde + (hasta - desde) * k;
          dibujar(ahora);
          if (k < 1) cuadro = requestAnimationFrame(paso);
        };
        cuadro = requestAnimationFrame(paso);
      },
    };
  }

  return { crear };
})();
