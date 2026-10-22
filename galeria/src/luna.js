// La luna de la comida, dibujada píxel a píxel como una esfera: la parte iluminada es lo que llevás
// del día. La superficie (los mares de la cara visible, los cráteres con su borde claro, Tycho con
// sus rayos y el grano) se calcula una sola vez; en cada cuadro solo cambia la luz. La luz sigue la
// ley de Lommel-Seeliger, la de la Luna de verdad: llena se ve pareja, sin oscurecerse en el borde,
// y a medias se apaga suave hacia el terminador. Lo oscuro tiene la luz cenicienta, apenas azul.

const Luna = (() => {
  // Un ruido de valor suave y repetible: sale igual en cada armado.
  function ruido(semilla) {
    const hash = (x, y) => {
      let h = (x * 374761393 + y * 668265263 + semilla * 982451653) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const suave = (t) => t * t * (3 - 2 * t);
    const valor = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const fx = suave(x - xi), fy = suave(y - yi);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    return (x, y, octavas) => {
      let s = 0, amp = 0.5, f = 1, norma = 0;
      for (let i = 0; i < octavas; i++) { s += amp * valor(x * f, y * f); norma += amp; amp *= 0.5; f *= 2.03; }
      return s / norma;
    };
  }

  // Los mares de la cara visible, en el disco de radio 1 (x a la derecha, y hacia abajo), más o
  // menos donde están: Imbrio, la Serenidad, la Tranquilidad, las Crisis, el océano de las
  // Tormentas, las Nubes y la Fecundidad.
  const MARES = [
    [-0.33, -0.36, 0.3, 0.22], [0.14, -0.3, 0.17, 0.15], [0.3, -0.04, 0.2, 0.17], [0.6, -0.3, 0.1, 0.09],
    [-0.55, 0.06, 0.2, 0.4], [-0.1, 0.34, 0.16, 0.12], [0.46, 0.26, 0.12, 0.13], [-0.24, 0.02, 0.12, 0.1],
  ];

  // La superficie para un lienzo de `px` píxeles de lado: el albedo de cada píxel del disco y su
  // normal (la x y la z de la esfera; la y no cambia con la luz, que viene de costado).
  function superficie(px, radio) {
    const n = ruido(7), grano = ruido(23);
    const albedo = new Float32Array(px * px);
    const nx = new Float32Array(px * px);
    const nz = new Float32Array(px * px);
    const borde = new Float32Array(px * px);
    const centro = px / 2;
    // Los cráteres: posición en el disco, radio, y un rayo cada tanto (Tycho, abajo, es el que más).
    const crateres = [];
    let s = 91;
    const azar = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 46; i++) {
      const r = Math.sqrt(azar()) * 0.93, a = azar() * Math.PI * 2;
      crateres.push([r * Math.cos(a), r * Math.sin(a), 0.012 + Math.pow(azar(), 2.4) * 0.06]);
    }
    const tycho = [-0.12, 0.66, 0.035];
    for (let j = 0; j < px; j++) {
      for (let i = 0; i < px; i++) {
        const x = (i + 0.5 - centro) / radio, y = (j + 0.5 - centro) / radio;
        const d2 = x * x + y * y;
        const k = j * px + i;
        // El borde con medio píxel de suavizado.
        const dist = Math.sqrt(d2) * radio;
        borde[k] = Math.max(0, Math.min(1, radio - dist + 0.5));
        if (borde[k] <= 0) continue;
        const z = Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
        nx[k] = x;
        nz[k] = z;
        // Las coordenadas sobre la esfera: así el dibujo se comprime hacia el borde, como en una esfera.
        const lon = Math.asin(Math.max(-1, Math.min(1, x / Math.max(1e-4, Math.sqrt(1 - y * y))))), lat = Math.asin(Math.max(-1, Math.min(1, y)));
        const u = lon * 1.4, v = lat * 1.4;
        // Las tierras altas: claras, con un grano grande.
        let a = 0.8 + (n(u * 2.2 + 3, v * 2.2 + 1, 4) - 0.5) * 0.16;
        // Los mares: manchas oscuras de borde irregular (el ruido corre la distancia al centro).
        let mar = 0;
        const torcido = (n(u * 3.1 + 11, v * 3.1 + 5, 3) - 0.5) * 0.55;
        for (const [mx, my, rx, ry] of MARES) {
          const e = Math.sqrt(((x - mx) / rx) ** 2 + ((y - my) / ry) ** 2) + torcido;
          mar = Math.max(mar, 1 - Math.min(1, Math.max(0, (e - 0.55) / 0.5)));
        }
        a -= mar * (0.3 + (n(u * 6 + 2, v * 6 + 8, 3) - 0.5) * 0.12);
        // Los cráteres: el piso un poco más oscuro y el borde más claro.
        for (const [cx, cy, cr] of crateres) {
          const dc = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / cr;
          if (dc > 1.4) continue;
          a += dc < 0.85 ? -0.05 * (1 - dc / 0.85) : 0.07 * Math.max(0, 1 - Math.abs(dc - 1) / 0.35);
        }
        // Tycho: claro, con rayos que se abren hacia arriba.
        const tx = x - tycho[0], ty = y - tycho[1];
        const dt = Math.sqrt(tx * tx + ty * ty);
        if (dt < tycho[2]) a += 0.14;
        const rayos = Math.pow(Math.max(0, Math.cos(Math.atan2(ty, tx) * 7 + 0.6)), 18) * Math.max(0, 1 - dt / 0.85);
        a += rayos * 0.08 * (1 - mar * 0.5);
        // El grano fino de la superficie.
        a += (grano(x * 70, y * 70, 2) - 0.5) * 0.07;
        albedo[k] = Math.max(0.18, Math.min(1, a));
      }
    }
    return { albedo, nx, nz, borde };
  }

  const salida = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
  const suave = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

  /**
   * Una luna de `tam` píxeles de CSS (el disco ocupa el 80 %; el resto es el halo). `ir(fraccion)`
   * lleva la fase a lo comido sobre la meta: 0 es nueva y 1, llena.
   */
  function crear({ tam, clase }) {
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const px = Math.round(tam * dpr);
    const radio = px * 0.4;
    const lienzo = document.createElement('canvas');
    lienzo.width = px;
    lienzo.height = px;
    lienzo.className = clase || '';
    lienzo.style.width = tam + 'px';
    lienzo.style.height = tam + 'px';
    lienzo.setAttribute('aria-hidden', 'true');
    const ctx = lienzo.getContext('2d');
    const disco = document.createElement('canvas');
    disco.width = px;
    disco.height = px;
    const dctx = disco.getContext('2d');
    const imagen = dctx.createImageData(px, px);
    let sup = null;
    let ahora = 0;
    let cuadro = 0;

    function dibujar(fraccion) {
      if (!sup) sup = superficie(px, radio);
      // De nueva (la luz de atrás) a llena (la luz de frente), siempre desde la derecha.
      const p = 0.03 + 0.97 * Math.min(1, Math.max(0, fraccion));
      const th = Math.PI * (1 - p);
      const lx = Math.sin(th), lz = Math.cos(th);
      const datos = imagen.data;
      const { albedo, nx, nz, borde } = sup;
      for (let k = 0; k < albedo.length; k++) {
        const b = borde[k];
        const o = k * 4;
        if (b <= 0) { datos[o + 3] = 0; continue; }
        const mu0 = nx[k] * lx + nz[k] * lz;
        const mu = nz[k];
        // Lommel-Seeliger, normalizada para que la llena dé 1.
        const ls = mu0 > 0 ? (2 * mu0) / (mu0 + mu + 1e-4) : 0;
        const luz = Math.min(1.08, ls) * suave(-0.015, 0.07, mu0);
        const a = albedo[k];
        // La luz cenicienta del lado oscuro: muy tenue y fría.
        const ceniza = 0.05 * (1 - suave(-0.05, 0.05, mu0));
        datos[o] = Math.min(255, (a * luz * 246 + a * ceniza * 150) | 0);
        datos[o + 1] = Math.min(255, (a * luz * 239 + a * ceniza * 160) | 0);
        datos[o + 2] = Math.min(255, (a * luz * 222 + a * ceniza * 196) | 0);
        datos[o + 3] = Math.round(255 * b);
      }
      dctx.putImageData(imagen, 0, 0);
      ctx.clearRect(0, 0, px, px);
      // El halo: crece con la parte iluminada, siempre apenas.
      const halo = ctx.createRadialGradient(px / 2, px / 2, radio * 0.92, px / 2, px / 2, px * 0.5);
      halo.addColorStop(0, `rgba(240, 233, 214, ${(0.16 * p * p).toFixed(3)})`);
      halo.addColorStop(1, 'rgba(240, 233, 214, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, px, px);
      // El disco de noche debajo, para que la luna nueva igual se vea.
      ctx.fillStyle = '#10152a';
      ctx.beginPath();
      ctx.arc(px / 2, px / 2, radio - 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(disco, 0, 0);
      // El contorno, apenas: el borde de la parte oscura.
      ctx.strokeStyle = 'rgba(236, 230, 214, 0.14)';
      ctx.lineWidth = Math.max(1, dpr * 0.6);
      ctx.beginPath();
      ctx.arc(px / 2, px / 2, radio, 0, Math.PI * 2);
      ctx.stroke();
    }

    return {
      el: lienzo,
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
