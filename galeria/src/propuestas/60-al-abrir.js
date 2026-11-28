// Al abrir Moss (27/11, para aprobar): la entrada de Ascent, en Moss. Allá, una sola vez por apertura, la pantalla
// aparece y sus bloques surgen escalonados, corto y sin rebotes (su globals.css: 0,42 s la pantalla, 0,55 s cada
// bloque desde 9 px abajo, 45 ms entre uno y otro). Acá se prueba sobre el Inicio de verdad, en tres medidas: la de
// Ascent tal cual, la misma con la luna y los macros llenándose mientras tanto, y una más marcada.
// No corre al cambiar de sección ni al volver de una hoja: ahí es donde una app se siente lenta.

const MEDIDAS = {
  ascent: { espera: 120, entre: 45, dura: 550, desde: 9, llena: 0 },
  luna: { espera: 120, entre: 45, dura: 550, desde: 9, llena: 1100 },
  marcada: { espera: 160, entre: 80, dura: 700, desde: 16, llena: 1100 },
};

const CSS = `
.inicio.abre-entra { animation: abre-pantalla 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }
.inicio.abre-entra .in-cab, .inicio.abre-entra .in-bloques > *, .inicio.abre-entra .in-pie {
  animation: abre-surgir var(--abre-dura) cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  animation-delay: calc(var(--abre-espera) + var(--abre-i, 0) * var(--abre-entre));
}
.tel.abre-entra > .pestanas { animation: abre-barra 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) 0.18s backwards; }
@keyframes abre-pantalla { from { opacity: 0; } }
@keyframes abre-surgir { from { opacity: 0; transform: translateY(var(--abre-desde)); } }
@keyframes abre-barra { from { opacity: 0; transform: translateY(10px); } }
@media (prefers-reduced-motion: reduce) {
  .inicio.abre-entra, .inicio.abre-entra .in-cab, .inicio.abre-entra .in-bloques > *, .inicio.abre-entra .in-pie, .tel.abre-entra > .pestanas { animation: none; }
}`;

Galeria.propuesta({
  id: 'alAbrir',
  titulo: 'La animación al abrir Moss',
  texto: 'Al abrir Moss, los bloques de Inicio aparecen de a uno, rápido y sin rebotes, solo una vez. Cada botón la repite en una de tres formas: elegí una.',
  vistas: [['ascent', 'Igual que en Ascent'], ['luna', 'Con la luna y los macros llenándose'], ['marcada', 'Más notoria']],
  principal: 1,
  crear(g) {
    g.estilo('abre-css', CSS);
    const inicio = g.secciones.inicio;
    let fin = 0;
    // Si Inicio se vuelve a pintar a mitad de la entrada (otro idioma, algo anotado), sus bloques nuevos no tienen su
    // turno: la entrada termina ahí, en lugar de que todos arranquen juntos.
    const repintado = new MutationObserver(() => quitar());
    const quitar = () => {
      repintado.disconnect();
      inicio.zona.classList.remove('abre-entra');
      g.tel.classList.remove('abre-entra');
    };
    return {
      abrir(vista) {
        const m = MEDIDAS[vista];
        clearTimeout(fin);
        quitar();
        g.irA(0, true);
        inicio.subir();
        // Se pinta de nuevo: con tiempo, la luna, la cifra y los macros se llenan desde cero mientras los bloques entran.
        if (m.llena) inicio.desdeCero();
        inicio.pintar(m.llena);
        const partes = [inicio.zona.querySelector('.in-cab'), ...inicio.zona.querySelectorAll('.in-bloques > *'), inicio.zona.querySelector('.in-pie')];
        partes.forEach((n, i) => n.style.setProperty('--abre-i', i));
        const estilo = inicio.zona.style;
        estilo.setProperty('--abre-espera', m.espera + 'ms');
        estilo.setProperty('--abre-entre', m.entre + 'ms');
        estilo.setProperty('--abre-dura', m.dura + 'ms');
        estilo.setProperty('--abre-desde', m.desde + 'px');
        // Para que vuelva a correr al tocar otra vez el mismo botón.
        void inicio.zona.offsetWidth;
        inicio.zona.classList.add('abre-entra');
        g.tel.classList.add('abre-entra');
        repintado.observe(inicio.zona.querySelector('.in-bloques'), { childList: true });
        // Al terminar se quita: con la clase puesta, cada vez que Inicio se pinta sus bloques entrarían de nuevo.
        fin = setTimeout(quitar, m.espera + partes.length * m.entre + m.dura + 400);
      },
      cerrar() { clearTimeout(fin); quitar(); },
    };
  },
});
