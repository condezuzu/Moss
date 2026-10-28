// La tienda, para aprobar: el ícono (grande, el archivo de 1024 sin recortar y chico, como en la
// pantalla de inicio del iPhone) y las capturas de la App Store en español e inglés, en su orden.
// Las capturas salen de la app de verdad (herramientas/capturas-tienda.mjs); acá van las vistas
// chicas en JPEG que deja esa herramienta, y TIENDA lo inyecta galeria/construir.mjs.

const SeccionTienda = (() => {
  const CSS = `
.td { display: grid; gap: 26px; }
.td-sub { margin: 0; font: 500 21px/1.15 var(--titulos); color: var(--oro-claro); }
.td-iconos { display: flex; flex-wrap: wrap; gap: 22px; align-items: flex-end; }
.td-figura { margin: 0; display: grid; gap: 8px; justify-items: center; }
.td-figura figcaption { font: 400 11px/1.3 var(--texto); letter-spacing: 0.08em; color: var(--tenue); text-align: center; }
.td-cuadrado { width: 168px; height: 168px; display: block; border: 1px solid var(--linea); }
.td-grande { width: 168px; height: 168px; display: block; border-radius: 22.37%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 230, 207, 0.08); }
.td-inicio {
  width: 236px; padding: 22px 18px 18px; border-radius: 30px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 10px;
  background: radial-gradient(120% 80% at 20% 0%, #2c3f7a 0%, rgba(44, 63, 122, 0) 60%), radial-gradient(90% 70% at 100% 100%, #3b2d5c 0%, rgba(59, 45, 92, 0) 65%), #0d1430;
  border: 1px solid rgba(239, 230, 207, 0.08);
}
.td-app { display: grid; justify-items: center; gap: 5px; }
.td-app i { width: 45px; height: 45px; border-radius: 10.5px; display: block; background: rgba(239, 230, 207, 0.12); }
.td-app img { width: 45px; height: 45px; border-radius: 10.5px; display: block; }
.td-app span { font: 400 10px/1 -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; color: rgba(255, 255, 255, 0.92); }
.td-app.otra span { width: 30px; height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.18); }
.td-fila { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
.td-capturas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px 14px; transition: opacity 0.25s ease; }
.td-capturas.cambiando { opacity: 0; }
.td-captura { margin: 0; display: grid; gap: 7px; }
.td-captura .td-marco { display: block; border-radius: 10px; overflow: hidden; border: 1px solid var(--linea); transition: border-color 0.2s, transform 0.2s; }
.td-captura .td-marco:hover { border-color: rgba(232, 196, 106, 0.5); transform: translateY(-2px); }
.td-captura img { width: 100%; height: auto; display: block; aspect-ratio: 1320 / 2868; }
.td-captura figcaption { font: 400 12.5px/1.35 var(--texto); color: var(--tinta); }
.td-captura figcaption small { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tenue); }
.td-captura.busqueda figcaption small { color: rgba(232, 196, 106, 0.8); }
/* De a tres: las tres primeras, las de la búsqueda, quedan juntas en una fila. */
@media (max-width: 560px) { .td-capturas { grid-template-columns: repeat(2, minmax(0, 1fr)); } .td-iconos { gap: 16px; } }
@media (prefers-reduced-motion: reduce) { .td-capturas, .td-captura .td-marco { transition: none; } }
`;

  const NOMBRES = {
    registrar: 'Registrar la cena', cielo: 'Hábitos: el día completo', sueno: 'Sueño', inicio: 'Inicio', decir: 'Decir lo que comí', progreso: 'Progreso',
  };

  function crear(cont) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const datos = typeof TIENDA !== 'undefined' ? TIENDA : null;
    if (!datos || !datos.capturas.length) {
      cont.innerHTML = '<p class="vacio">Todavía no hay capturas: npm run web:exportar, npm run web:ver y npm run tienda:capturas, y después npm run galeria.</p>';
      return;
    }

    const div = document.createElement('div');
    div.className = 'td';
    const otras = '<div class="td-app otra"><i></i><span></span></div>';
    div.innerHTML = `
      <h3 class="td-sub">El ícono</h3>
      <div class="td-iconos">
        ${datos.icono ? `
        ${datos.iconoRecibido ? `<figure class="td-figura"><img class="td-cuadrado" src="${datos.iconoRecibido}" alt="El ícono que mandaste, tal cual"><figcaption>El que mandaste,<br>tal cual</figcaption></figure>` : ''}
        <figure class="td-figura"><img class="td-cuadrado" src="${datos.icono}" alt="El ícono de Moss, cuadrado"><figcaption>El de la build: assets/images/icon.png,<br>1024 × 1024, sin transparencia</figcaption></figure>
        <figure class="td-figura"><img class="td-grande" src="${datos.icono}" alt="El ícono de Moss, con las esquinas del iPhone"><figcaption>Con las esquinas que le pone iOS</figcaption></figure>
        <figure class="td-figura">
          <div class="td-inicio" aria-label="El ícono de Moss en la pantalla de inicio">
            ${otras}${otras}${otras}${otras}${otras}<div class="td-app"><img src="${datos.icono}" alt=""><span>Moss</span></div>${otras}${otras}
          </div>
          <figcaption>En la pantalla de inicio, a su tamaño</figcaption>
        </figure>` : '<p class="vacio">Falta la vista del ícono.</p>'}
      </div>
      <div class="td-fila">
        <h3 class="td-sub">Las capturas, en su orden</h3>
        <div class="segmento" role="group" aria-label="Idioma de las capturas"><button type="button" data-idioma="es" aria-pressed="true">Español</button><button type="button" data-idioma="en" aria-pressed="false">English</button></div>
      </div>
      <div class="td-capturas"></div>`;
    cont.appendChild(div);

    const grilla = div.querySelector('.td-capturas');
    let idioma = 'es';
    const pintar = () => {
      grilla.innerHTML = datos.capturas.filter((c) => c[idioma]).map((c) => `
        <figure class="td-captura${c.n <= 3 ? ' busqueda' : ''}">
          <div class="td-marco"><img src="${c[idioma]}" alt="${c.texto[idioma]}"></div>
          <figcaption><small>${c.n}${c.n <= 3 ? ' · en la búsqueda' : ''} · ${NOMBRES[c.nombre] || c.nombre}</small>«${c.texto[idioma]}»</figcaption>
        </figure>`).join('');
    };
    pintar();
    const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    div.querySelectorAll('[data-idioma]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.idioma === idioma) return;
      idioma = b.dataset.idioma;
      div.querySelectorAll('[data-idioma]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      // Se va, cambia y vuelve: nada cambia de golpe.
      if (reducido) { pintar(); return; }
      grilla.classList.add('cambiando');
      setTimeout(() => { pintar(); grilla.classList.remove('cambiando'); }, 250);
    }));
  }

  return { crear };
})();
