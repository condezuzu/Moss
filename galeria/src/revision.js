// La revisión de la app de verdad, antes y después de cada arreglo, de a pares. Las fotos salen de
// herramientas/recorrer-pantallas.mjs (en la web, en un iPhone chico y uno grande); acá van las
// vistas chicas en JPEG de capturas/revision/vista, y REVISION lo inyecta galeria/construir.mjs.

const SeccionRevision = (() => {
  const CSS = `
.rv { display: grid; gap: 30px; }
.rv-par { display: grid; gap: 10px; }
.rv-titulo { margin: 0; font: 500 19px/1.2 var(--titulos); color: var(--oro-claro); }
.rv-texto { margin: 0; color: var(--tenue); max-width: 62ch; }
.rv-fotos { display: flex; flex-wrap: wrap; gap: 16px; }
.rv-figura { margin: 0; display: grid; gap: 6px; justify-items: center; }
.rv-figura img { width: 220px; display: block; border-radius: 18px; border: 1px solid var(--linea); }
.rv-figura figcaption { font: 400 11px/1.3 var(--texto); letter-spacing: 0.08em; color: var(--tenue); text-transform: uppercase; }
@media (max-width: 560px) { .rv-figura img { width: calc((100vw - 64px) / 2); } }
`;

  function crear(cont) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const datos = typeof REVISION !== 'undefined' ? REVISION : null;
    if (!datos || !datos.length) {
      cont.innerHTML = '<p class="vacio">Todavía no hay fotos: node herramientas/recorrer-pantallas.mjs capturas/revision/antes (y después), y npm run galeria.</p>';
      return;
    }
    const div = document.createElement('div');
    div.className = 'rv';
    div.innerHTML = datos.map((p) => `
      <div class="rv-par">
        <h3 class="rv-titulo">${p.titulo}</h3>
        <p class="rv-texto">${p.texto}</p>
        <div class="rv-fotos">
          ${p.fotos.map((f) => `<figure class="rv-figura"><img src="${f.src}" alt="${p.titulo}: ${f.rotulo}" loading="lazy"><figcaption>${f.rotulo}</figcaption></figure>`).join('')}
        </div>
      </div>`).join('');
    cont.appendChild(div);
  }

  return { crear };
})();
