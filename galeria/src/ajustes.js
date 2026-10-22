// Ajustes en la galería: la lista y, adentro, las metas (etapa 7): quién las pone, cómo se reparten
// los macros y repartir la semana. Las cuentas son las de la app (Metas, src/dominio/metas.ts, lo
// arma construir.mjs). Lo demás de la lista es una maqueta.

const Ajustes = (() => {
  // La persona de mentira de la comida: 74,3 kg, mantener, y la meta del último control.
  const PERFIL = { pesoKg: 74.3, objetivo: 'mantener', sexo: 'm' };
  const KCAL = 2740;
  // De lunes a domingo, como la semana de la comida.
  const SEMANA = [1, 2, 3, 4, 5, 6, 0];
  const EXTRAS = [200, 300, 500];

  function crear(seccion, opciones) {
    const s = {
      vista: 'lista', quien: 'moss', estilo: 'equilibrada',
      aMano: { proteina: 150, carbohidratos: 300, grasas: 80 },
      reparte: false, altos: [6, 0], extra: 300,
    };
    const idioma = () => opciones.idioma();
    const tx = (clave, vars) => {
      let t = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma()]);
      if (t == null) return clave;
      if (typeof t === 'string' && vars) t = t.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return t;
    };
    const numero = (n) => Math.round(n).toLocaleString(idioma() === 'es' ? 'es-UY' : 'en-US');
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };
    const boton = (clase, contenido, alTocar) => {
      const b = el('button', clase);
      b.type = 'button';
      b.innerHTML = contenido;
      b.addEventListener('click', alTocar);
      return b;
    };

    const meta = () => (s.quien === 'moss' ? Metas.macrosPara(KCAL, PERFIL.pesoKg, PERFIL.objetivo, s.estilo) : Metas.metaManual(s.aMano));
    function cambio() {
      opciones.alCambiarMeta(meta());
      pintar();
    }

    function pintarLista() {
      seccion.appendChild(el('h2', null, tx('ajustes.titulo')));
      const lista = el('ul');
      const fila = (clave, valor, alTocar) => {
        const li = el('li', alTocar ? 'aj-tocable' : null);
        li.append(el('span', null, tx(clave)), el('b', null, valor));
        if (alTocar) {
          li.addEventListener('click', alTocar);
          li.setAttribute('role', 'button');
        }
        lista.appendChild(li);
      };
      fila('ajustes.metas.titulo', tx('ajustes.metas.fila', { kcal: numero(meta().kcal) }), () => { s.vista = 'metas'; pintar(); });
      fila('ajustes.calidad', 'Alta');
      fila('ajustes.idioma', idioma() === 'es' ? 'Español' : 'English');
      fila('ajustes.salud', '✓');
      fila('ajustes.ascent', '');
      fila('ajustes.cuenta', '');
      seccion.appendChild(lista);
    }

    function segmento(opcionesDe, elegida, alElegir) {
      const cont = el('div', 'aj-segmento');
      opcionesDe.forEach(([valor, texto]) => {
        const b = boton('aj-seg', texto, () => alElegir(valor));
        b.setAttribute('aria-pressed', String(valor === elegida));
        cont.appendChild(b);
      });
      return cont;
    }

    function pintarMetas() {
      const cab = el('header', 'aj-cab');
      cab.append(boton('aj-atras', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>', () => { s.vista = 'lista'; pintar(); }), el('h2', null, tx('ajustes.metas.titulo')));
      seccion.appendChild(cab);
      const cuerpo = el('div', 'aj-cuerpo');
      seccion.appendChild(cuerpo);

      const m = meta();
      const heroe = el('div', 'aj-heroe');
      heroe.append(el('b', null, numero(m.kcal)), el('span', null, tx('ajustes.metas.porDia')));
      const macros = el('div', 'aj-macros');
      [['p', m.proteina, 'comida.proteina'], ['c', m.carbohidratos, 'comida.carbohidratos'], ['g', m.grasas, 'comida.grasas']].forEach(([clase, g, clave]) => {
        const x = el('span', 'aj-macro aj-macro-' + clase);
        x.append(el('i'), `${numero(g)} g ${tx(clave).toLowerCase()}`);
        macros.appendChild(x);
      });
      heroe.appendChild(macros);
      cuerpo.appendChild(heroe);

      cuerpo.appendChild(el('div', 'aj-etq', tx('ajustes.metas.quien')));
      cuerpo.appendChild(segmento([['moss', tx('ajustes.metas.moss')], ['mano', tx('ajustes.metas.aMano')]], s.quien, (v) => { s.quien = v; cambio(); }));
      cuerpo.appendChild(el('p', 'aj-nota', tx(s.quien === 'moss' ? 'ajustes.metas.mossTexto' : 'ajustes.metas.aManoTexto')));

      if (s.quien === 'moss') {
        cuerpo.appendChild(el('div', 'aj-etq', tx('ajustes.metas.reparto')));
        const estilos = el('div', 'aj-estilos');
        Metas.ESTILOS.forEach((e) => {
          const [nombre, texto] = tx('ajustes.metas.estilos.' + e);
          const b = boton('aj-estilo', '', () => { s.estilo = e; cambio(); });
          b.append(el('b', null, nombre), el('span', null, texto));
          b.setAttribute('aria-pressed', String(e === s.estilo));
          estilos.appendChild(b);
        });
        cuerpo.appendChild(estilos);
      } else {
        cuerpo.appendChild(el('div', 'aj-etq', tx('ajustes.metas.tusMacros')));
        [['proteina', 'comida.proteina'], ['carbohidratos', 'comida.carbohidratos'], ['grasas', 'comida.grasas']].forEach(([clave, texto]) => {
          const fila = el('label', 'cr-campo');
          const input = el('input');
          input.type = 'text';
          input.inputMode = 'decimal';
          input.value = s.aMano[clave];
          input.addEventListener('change', () => { s.aMano[clave] = Number(input.value.replace(',', '.')) || 0; cambio(); });
          fila.append(el('span', null, tx(texto)), input, el('em', null, 'g'));
          cuerpo.appendChild(fila);
        });
      }

      // Repartir la semana: el mismo total, más los días elegidos.
      const semana = el('div', 'aj-semana');
      const llave = boton('aj-llave', `<span>${tx('ajustes.metas.semana')}</span><i></i>`, () => { s.reparte = !s.reparte; pintar(); });
      llave.setAttribute('aria-pressed', String(s.reparte));
      semana.appendChild(llave);
      semana.appendChild(el('p', 'aj-nota', tx('ajustes.metas.semanaTexto')));
      if (s.reparte) {
        const dias = el('div', 'aj-dias');
        SEMANA.forEach((d) => {
          const b = boton('aj-dia', tx('fecha.diasCortos.' + d).charAt(0), () => {
            s.altos = s.altos.includes(d) ? s.altos.filter((x) => x !== d) : [...s.altos, d];
            pintar();
          });
          b.setAttribute('aria-pressed', String(s.altos.includes(d)));
          dias.appendChild(b);
        });
        semana.appendChild(dias);
        semana.appendChild(segmento(EXTRAS.map((n) => [n, `+${numero(n)}`]), s.extra, (v) => { s.extra = v; pintar(); }));
        const reparto = Metas.repartirSemana(m, s.altos, s.extra, PERFIL.sexo);
        const maximo = Math.max(...SEMANA.map((d) => reparto[d].kcal));
        const grafico = el('div', 'aj-barras');
        SEMANA.forEach((d) => {
          const col = el('div', 'aj-barra' + (s.altos.includes(d) ? ' alto' : ''));
          const barra = el('i');
          barra.style.height = `${((reparto[d].kcal / maximo) * 100).toFixed(1)}%`;
          col.append(el('b', null, numero(reparto[d].kcal)), barra, el('span', null, tx('fecha.diasCortos.' + d).charAt(0)));
          grafico.appendChild(col);
        });
        semana.appendChild(grafico);
      }
      cuerpo.appendChild(semana);
    }

    function pintar() {
      seccion.innerHTML = '';
      seccion.classList.toggle('en-metas', s.vista === 'metas');
      if (s.vista === 'metas') pintarMetas();
      else pintarLista();
    }
    pintar();

    return {
      pintar,
      get vista() { return s.vista; },
      // Para las capturas y los botones de la galería.
      verMetas() { s.vista = 'metas'; pintar(); },
      verLista() { s.vista = 'lista'; pintar(); },
      ponerEstilo(e) { s.quien = 'moss'; s.estilo = e; cambio(); },
      ponerQuien(q) { s.quien = q; cambio(); },
      repartir(si) { s.reparte = si; pintar(); },
    };
  }

  return { crear };
})();
