// La luna de la comida: la parte iluminada es lo que llevás del día. Es la luna de antes (la
// prefirió el usuario a la de píxeles): la cara con su degradé, los mares difuminados, el grano y la
// sombra con el borde suave.

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
   * Una luna de `tam` píxeles de CSS (el disco ocupa el 80 %; el resto es el halo). `ir(fraccion)`
   * lleva la fase a lo comido sobre la meta: 0 es nueva y 1, llena.
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
        <radialGradient id="${id}-cara" cx="40%" cy="36%" r="72%">
          <stop offset="0" stop-color="#f7f3e8"/><stop offset="0.6" stop-color="#e4ddcc"/><stop offset="1" stop-color="#b9b09b"/>
        </radialGradient>
        <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="4"/>
          <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 1.5 -0.72"/>
          <feComposite in2="SourceAlpha" operator="in"/>
        </filter>
        <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>
        <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
        <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><path class="luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
        <clipPath id="${id}-disco"><circle r="40"/></clipPath>
      </defs>
      <circle r="46" class="luna-halo"/>
      <g clip-path="url(#${id}-disco)">
        <circle r="40" class="luna-noche"/>
        <g mask="url(#${id}-luz)">
          <circle r="40" fill="url(#${id}-cara)"/>
          <g class="luna-mares" filter="url(#${id}-suave)">
            <ellipse cx="-13" cy="-15" rx="11" ry="8.5"/><ellipse cx="5" cy="-11" rx="7" ry="6"/><ellipse cx="13" cy="-1" rx="8" ry="7"/>
            <ellipse cx="-21" cy="5" rx="8" ry="15"/><ellipse cx="-3" cy="14" rx="7" ry="4.5"/><ellipse cx="22" cy="-14" rx="4" ry="3.2"/>
            <ellipse cx="19" cy="13" rx="5" ry="4"/>
          </g>
          <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.55"/>
          <circle cx="-7" cy="27" r="1.5" class="luna-crater"/><circle cx="9" cy="22" r="1" class="luna-crater"/>
        </g>
      </g>
      <circle r="40" class="luna-contorno"/>`;
    const faseEl = svg.querySelector('.luna-fase');
    let ahora = 0;
    let cuadro = 0;
    const dibujar = (v) => faseEl.setAttribute('d', fase(0.04 + 0.96 * Math.min(1, Math.max(0, v)), 40));

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
