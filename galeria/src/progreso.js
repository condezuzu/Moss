// Progreso (spec/progreso.md): el peso con su tendencia, las medidas, el rango de grasa corporal,
// el gasto estimado con el balance, y el progreso al objetivo. Abajo, la estrategia: el objetivo, las
// metas de hoy (con quién las pone, cómo se reparten los macros y repartir la semana, que antes
// estaban en Ajustes), cómo viene el próximo control y qué día de la semana se hace. Las cuentas
// son las de la app: Control, Progreso, Cuerpo y Metas.

const SeccionProgreso = (() => {
  const SEMANA = [1, 2, 3, 4, 5, 6, 0];
  const EXTRAS = [200, 300, 500];

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, conSigno, el, boton, icono } = u;
    const s = { vista: 'principal', abierto: null, quien: 'moss', aMano: { proteina: 160, carbohidratos: 280, grasas: 80 }, reparte: false, altos: [6, 0], extra: 300 };

    const zona = el('section', 'progreso pagina-app');
    zona.innerHTML = '<div class="pg-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.pg-scroll');

    const carta = (clase, titulo, derecha) => {
      const c = el('article', 'pg-carta ' + (clase || ''));
      if (titulo) {
        const cab = el('header', 'pg-carta-cab');
        cab.appendChild(el('span', 'pg-carta-titulo', titulo));
        if (derecha) cab.appendChild(derecha);
        c.appendChild(cab);
      }
      return c;
    };
    // «Cómo se calcula»: un enlace que despliega la explicación debajo.
    const desplegable = (clave, texto) => {
      const p = el('p', 'pg-texto pg-como', texto);
      p.hidden = s.abierto !== clave;
      const b = boton('cm-enlace' + (s.abierto === clave ? ' abierto' : ''), `<span>${tx('progreso.comoSeCalcula')}</span>${icono('adelante')}`, () => {
        s.abierto = s.abierto === clave ? null : clave;
        p.hidden = s.abierto !== clave;
        b.classList.toggle('abierto', s.abierto === clave);
      });
      return [b, p];
    };

    function pintar() {
      const arriba = cont.scrollTop;
      cont.innerHTML = '';
      zona.classList.toggle('en-metas', s.vista === 'metas');
      if (s.vista === 'metas') pintarMetas(); else pintarPrincipal();
      cont.scrollTop = arriba;
    }

    function pintarPrincipal() {
      const d = opciones.persona();
      const hoy = u.partes(Datos.HOY);
      const cab = el('header', 'pg-cab');
      cab.append(el('div', 'pg-fecha', tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) })), el('h2', 'pg-titulo', tx('progreso.titulo')));
      cont.appendChild(cab);
      cont.appendChild(objetivo(d));
      cont.appendChild(peso(d));
      cont.appendChild(medidas(d));
      cont.appendChild(grasa(d));
      cont.appendChild(gasto(d));
      cont.appendChild(el('h3', 'pg-seccion', tx('progreso.estrategia')));
      cont.appendChild(estrategia(d));
      cont.appendChild(control(d));
    }

    // ------------------------------------------------------------ el objetivo
    function objetivo(d) {
      const p = d.progreso;
      const c = carta('pg-objetivo', tx('progreso.objetivo'), el('em', 'in-estado ' + p.estado, tx('progreso.estados.' + p.estado)));
      const metaKg = d.perfil.pesoMeta;
      const titulo = d.perfil.objetivo === 'mantener' ? tx('progreso.mantenerEn', { kg: numero(d.pesoHoy, 1) }) : metaKg ? tx('progreso.objetivoA.' + d.perfil.objetivo, { kg: numero(metaKg, metaKg % 1 ? 1 : 0) }) : tx('progreso.objetivos.' + d.perfil.objetivo);
      c.appendChild(el('div', 'pg-objetivo-titulo', titulo));
      if (p.fecha) {
        const f = el('div', 'pg-cifra');
        f.append(el('b', null, u.fechaCorta(p.fecha)), el('span', null, tx('progreso.llegarias')));
        c.appendChild(f);
      }
      if (p.hecho != null) c.appendChild(caminoDe(d.pesoInicial, p.peso, metaKg, p.hecho));
      c.appendChild(el('p', 'pg-texto', tx('progreso.textos.' + p.estado, {
        ritmo: p.ritmo == null ? '' : conSigno(p.ritmo, 2), plan: conSigno(p.ritmoPlan, 2), faltan: p.faltan == null ? '' : numero(p.faltan, 1),
        semanas: p.fecha ? Math.round(Fechas.diasEntre(Datos.HOY, p.fecha) / 7) : '',
      })));
      return c;
    }

    function caminoDe(desde, ahora, hasta, hecho) {
      const b = el('div', 'in-camino');
      const pista = el('div', 'in-camino-pista');
      const relleno = el('i');
      const marca = el('span', 'in-camino-marca');
      pista.append(relleno, marca);
      const pct = (hecho * 100).toFixed(1) + '%';
      requestAnimationFrame(() => { relleno.style.width = pct; marca.style.left = pct; });
      const etq = el('div', 'in-camino-etq');
      etq.append(el('span', null, tx('progreso.empezaste', { kg: numero(desde, 1) })), el('span', 'ahora', numero(ahora, 1)), el('span', null, tx('progreso.meta', { kg: numero(hasta, hasta % 1 ? 1 : 0) })));
      b.append(pista, etq);
      return b;
    }

    // ------------------------------------------------------------ el peso
    function peso(d) {
      const c = carta('pg-peso', tx('progreso.peso'), boton('cm-anotar', `${icono('mas')}<span>${tx('progreso.registrar')}</span>`, () => opciones.registrarPeso()));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, numero(d.pesoHoy, 1)), el('span', null, ` kg · ${tx('progreso.tendencia')}`));
      c.append(cifra, el('div', 'pg-nota', tx('progreso.cambios', { semana: conSigno(d.cambio7, 1), mes: conSigno(d.cambio30, 1) })));
      c.appendChild(Graficos.linea(d.serie, { ancho: 320, alto: 92, clase: 'pg-grafico', meta: d.perfil.objetivo !== 'mantener' ? d.perfil.pesoMeta : null }));
      const eje = el('div', 'pg-eje');
      eje.append(el('span', null, u.fechaCorta(d.serieDesde)), el('span', null, tx('progreso.hoy')));
      c.appendChild(eje);
      c.appendChild(el('p', 'pg-texto pg-leyenda', tx('progreso.pesoLeyenda')));
      return c;
    }

    // ------------------------------------------------------------ las medidas
    function medidas(d) {
      const c = carta('pg-medidas', tx('progreso.medidas'), boton('cm-anotar', `${icono('cinta')}<span>${tx('progreso.medir')}</span>`, () => opciones.medir()));
      const lista = el('ul', 'pg-lista');
      Cuerpo.SITIOS.forEach((sitio) => {
        const cm = d.ultimasMedidas[sitio];
        if (cm == null) return;
        const li = el('li');
        const cambio = Cuerpo.cambioDe(Datos.MEDIDAS, sitio, Datos.HOY, Fechas.sumarDias(Datos.HOY, -30));
        li.append(el('span', null, tx('cuerpo.sitios.' + sitio)), el('b', null, `${Porciones.decimal(cm, u.idioma())} cm`), el('em', cambio == null ? '' : cambio < 0 ? 'baja' : cambio > 0 ? 'sube' : '', cambio == null ? '' : `${conSigno(cambio, 1)} cm`));
        lista.appendChild(li);
      });
      c.appendChild(lista);
      const ratio = Cuerpo.cinturaAltura(d.ultimasMedidas.cintura, d.perfil.alturaCm);
      if (ratio != null) c.appendChild(el('p', 'pg-texto', tx('progreso.cinturaAltura', { n: numero(ratio, 2) })));
      const ultima = Datos.MEDIDAS[Datos.MEDIDAS.length - 1];
      if (ultima) c.appendChild(el('div', 'pg-nota tenue', tx('progreso.medidasDel', { fecha: u.fechaCorta(ultima.fecha) })));
      return c;
    }

    // ------------------------------------------------------------ la grasa corporal
    function grasa(d) {
      const c = carta('pg-grasa', tx('progreso.grasa'));
      const r = d.grasa;
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, r ? tx('cuerpo.rango', { desde: r.desde, hasta: r.hasta }) : '—'), el('span', null, tx('cuerpo.estimacion')));
      c.append(cifra, el('p', 'pg-aviso', tx('cuerpo.aviso')));
      // Cómo vino cambiando: el rango de cada vez que se midió.
      const historia = el('div', 'pg-historia');
      Datos.MEDIDAS.forEach((m) => {
        const x = Cuerpo.rangoDeGrasa(d.perfil.sexo, d.perfil.alturaCm, Cuerpo.ultimasMedidas(Datos.MEDIDAS, m.fecha));
        if (!x) return;
        const chip = el('span');
        chip.append(el('small', null, u.fechaCorta(m.fecha)), tx('cuerpo.rangoCorto', { desde: x.desde, hasta: x.hasta }));
        historia.appendChild(chip);
      });
      c.appendChild(historia);
      const [enlace, texto] = desplegable('grasa', tx(d.perfil.sexo === 'm' ? 'cuerpo.comoSeEstimaHombre' : 'cuerpo.comoSeEstimaMujer'));
      c.append(enlace, texto);
      return c;
    }

    // ------------------------------------------------------------ el gasto y el balance
    function gasto(d) {
      const c = carta('pg-gasto', tx('progreso.gasto'));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, numero(d.gasto)), el('span', null, ` ${tx('progreso.kcalPorDia')}`));
      c.append(cifra, el('div', 'pg-nota', tx('progreso.controlDel', { fecha: u.fechaLarga(d.control.fecha) })));
      const bal = d.balance;
      const fila = el('div', 'pg-balance');
      const txt = el('div', 'in-dato');
      const cb = el('div', 'in-dato-cifra');
      cb.append(el('b', null, bal.promedio == null ? '—' : conSigno(Math.round(bal.promedio))), el('small', null, ' ' + tx('inicio.kcalPorDia')));
      txt.append(cb, el('span', null, tx('progreso.balanceTexto', { n: bal.dias.length })));
      fila.append(txt, Graficos.balance(bal.dias, d.gasto, { ancho: 160, alto: 52 }));
      c.appendChild(fila);
      const k = d.control.datos;
      c.appendChild(el('p', 'pg-texto', tx('progreso.controlTexto', { gasto: numero(k.gastoMedido ?? d.gasto), antes: numero(Datos.GASTO_ANTERIOR), ahora: numero(d.gasto) })));
      const [enlace, texto] = desplegable('gasto', tx('progreso.comoSeCalculaTexto', { promedio: numero(k.comidaPromedio ?? 0), dias: k.dias ?? 21, cambio: conSigno(k.cambioDeTendencia ?? 0, 1) }));
      c.append(enlace, texto);
      return c;
    }

    // ------------------------------------------------------------ la estrategia
    function estrategia(d) {
      const c = carta('pg-estrategia');
      const lista = el('div', 'pg-filas');
      const fila = (clave, valor, alTocar, abierta) => {
        const f = boton('pg-fila' + (abierta ? ' abierta' : ''), `<span>${tx(clave)}</span><b></b>${icono('adelante')}`, alTocar);
        f.querySelector('b').textContent = valor;
        lista.appendChild(f);
        return f;
      };
      const p = d.perfil;
      const ritmo = p.objetivo === 'mantener' ? '' : ` · ${tx('progreso.ritmos.' + p.ritmo)}`;
      fila('progreso.objetivo', tx('progreso.objetivos.' + p.objetivo) + ritmo, () => { s.abierto = s.abierto === 'objetivo' ? null : 'objetivo'; pintar(); }, s.abierto === 'objetivo');
      if (s.abierto === 'objetivo') lista.appendChild(eleccionObjetivo(p));
      if (p.objetivo !== 'mantener') {
        const metaKg = p.pesoMeta;
        fila('progreso.pesoMeta', metaKg ? `${numero(metaKg, metaKg % 1 ? 1 : 0)} kg` : tx('progreso.sinPesoMeta'), () => { s.abierto = s.abierto === 'pesoMeta' ? null : 'pesoMeta'; pintar(); }, s.abierto === 'pesoMeta');
        if (s.abierto === 'pesoMeta') lista.appendChild(eleccionPesoMeta(p));
      }
      const m = opciones.comida.meta;
      fila('progreso.metasActuales', `${numero(m.kcal)} kcal`, () => { s.vista = 'metas'; pintar(); cont.scrollTop = 0; });
      const macros = el('div', 'aj-macros pg-macros');
      [['p', m.p, 'comida.proteina'], ['c', m.c, 'comida.carbohidratos'], ['g', m.g, 'comida.grasas']].forEach(([clase, g, clave]) => {
        const x = el('span', 'aj-macro aj-macro-' + clase);
        x.append(el('i'), `${numero(g)} g ${tx(clave).toLowerCase()}`);
        macros.appendChild(x);
      });
      lista.appendChild(macros);
      c.appendChild(lista);
      return c;
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

    function eleccionObjetivo(p) {
      const caja = el('div', 'pg-eleccion');
      caja.appendChild(segmento(['bajar', 'mantener', 'subir'].map((o) => [o, tx('progreso.objetivos.' + o)]), p.objetivo, (v) => opciones.ponerEstrategia({ objetivo: v })));
      if (p.objetivo !== 'mantener') {
        caja.appendChild(segmento(['suave', 'recomendado', 'rapido'].map((r) => [r, tx('progreso.ritmos.' + r)]), p.ritmo, (v) => opciones.ponerEstrategia({ ritmo: v })));
        const pct = Metas.RITMOS[p.objetivo][p.ritmo];
        caja.appendChild(el('p', 'aj-nota', tx('progreso.ritmoTexto', { pct: numero(Math.abs(pct), 2), kg: numero(Math.abs(pct / 100 * opciones.persona().pesoHoy), 2) })));
      }
      caja.appendChild(el('p', 'aj-nota', tx('progreso.objetivoNota')));
      return caja;
    }

    function eleccionPesoMeta(p) {
      const caja = el('div', 'pg-eleccion pg-peso-meta');
      const valor = el('b', 'fi-valor', `${numero(p.pesoMeta || 70, 1)} kg`);
      const cambiar = (dx) => opciones.ponerEstrategia({ pesoMeta: Math.round(((p.pesoMeta || 70) + dx) * 2) / 2 });
      const pasos = el('div', 'fi-stepper');
      pasos.append(boton('fi-paso', icono('menos'), () => cambiar(-0.5), '−0,5'), valor, boton('fi-paso', icono('mas'), () => cambiar(0.5), '+0,5'));
      caja.append(pasos, el('p', 'aj-nota', tx('progreso.pesoMetaNota')));
      return caja;
    }

    // ------------------------------------------------------------ el próximo control
    function control(d) {
      const e = d.estadoControl;
      // Mientras quedan días antes del control, todavía puede llegar: está en curso, no le falta nada.
      const quedan = Math.max(0, e.faltan - 1);
      const estado = e.alcanza ? 'alcanza' : e.diasConComida + quedan >= e.minimos.diasConComida ? 'enCurso' : 'faltanDatos';
      const c = carta('pg-control', tx('progreso.proximoControl'), el('em', 'in-estado ' + (estado === 'alcanza' ? 'enCamino' : estado === 'enCurso' ? '' : 'despacio'), tx('progreso.' + estado)));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, Buscar.conMayuscula(u.fechaLarga(e.fecha))), el('span', null, e.faltan === 0 ? tx('progreso.hoy') : e.faltan === 1 ? tx('progreso.manana') : tx('progreso.enDias', { n: e.faltan })));
      c.appendChild(cifra);
      const datos = el('div', 'pg-requisitos');
      const req = (hecho, total, clave) => {
        const x = el('div', 'pg-req' + (hecho >= total ? ' ok' : ''));
        const textos = el('span');
        textos.append(u.plural(clave, hecho), el('small', null, tx('progreso.minimo', { n: total })));
        x.append(el('b', null, String(hecho)), textos);
        datos.appendChild(x);
      };
      req(e.diasConComida, e.minimos.diasConComida, 'progreso.diasConComida');
      req(e.pesadas, e.minimos.pesadas, 'progreso.pesadas');
      c.appendChild(datos);
      c.appendChild(el('p', 'pg-texto', tx(estado === 'alcanza' ? 'progreso.controlListo' : estado === 'enCurso' ? 'progreso.controlEnCurso' : 'progreso.controlFalta', { n: quedan })));
      c.appendChild(el('div', 'aj-etq', tx('progreso.diaDelControl')));
      const dias = el('div', 'aj-dias');
      SEMANA.forEach((dia) => {
        const b = boton('aj-dia', tx('fecha.diasCortos.' + dia).charAt(0), () => opciones.ponerEstrategia({ diaDelControl: dia }), tx('fecha.dias.' + dia));
        b.setAttribute('aria-pressed', String(dia === d.diaDelControl));
        dias.appendChild(b);
      });
      c.appendChild(dias);
      c.appendChild(el('p', 'aj-nota', tx('progreso.diaDelControlNota')));
      return c;
    }

    // ------------------------------------------------------------ las metas (lo que estaba en Ajustes)
    const metaDe = () => (s.quien === 'moss' ? opciones.metaDeMoss() : Metas.metaManual(s.aMano));
    function cambioDeMeta() {
      opciones.ponerMeta(metaDe());
      pintar();
    }

    function pintarMetas() {
      const p = opciones.persona().perfil;
      const cab = el('header', 'aj-cab');
      cab.append(boton('aj-atras', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>', () => { s.vista = 'principal'; pintar(); }), el('h2', null, tx('progreso.metas.titulo')));
      cont.appendChild(cab);
      const cuerpo = el('div', 'aj-cuerpo');
      cont.appendChild(cuerpo);

      const m = metaDe();
      const heroe = el('div', 'aj-heroe');
      heroe.append(el('b', null, numero(m.kcal)), el('span', null, tx('progreso.metas.porDia')));
      const macros = el('div', 'aj-macros');
      [['p', m.proteina, 'comida.proteina'], ['c', m.carbohidratos, 'comida.carbohidratos'], ['g', m.grasas, 'comida.grasas']].forEach(([clase, g, clave]) => {
        const x = el('span', 'aj-macro aj-macro-' + clase);
        x.append(el('i'), `${numero(g)} g ${tx(clave).toLowerCase()}`);
        macros.appendChild(x);
      });
      heroe.appendChild(macros);
      cuerpo.appendChild(heroe);

      cuerpo.appendChild(el('div', 'aj-etq', tx('progreso.metas.quien')));
      cuerpo.appendChild(segmento([['moss', tx('progreso.metas.moss')], ['mano', tx('progreso.metas.aMano')]], s.quien, (v) => { s.quien = v; cambioDeMeta(); }));
      cuerpo.appendChild(el('p', 'aj-nota', tx(s.quien === 'moss' ? 'progreso.metas.mossTexto' : 'progreso.metas.aManoTexto')));

      if (s.quien === 'moss') {
        cuerpo.appendChild(el('div', 'aj-etq', tx('progreso.metas.reparto')));
        const estilos = el('div', 'aj-estilos');
        Metas.ESTILOS.forEach((e) => {
          const [nombre, texto] = tx('progreso.metas.estilos.' + e);
          const b = boton('aj-estilo', '', () => opciones.ponerEstrategia({ estilo: e }));
          b.append(el('b', null, nombre), el('span', null, texto));
          b.setAttribute('aria-pressed', String(e === (p.estilo || 'equilibrada')));
          estilos.appendChild(b);
        });
        cuerpo.appendChild(estilos);
      } else {
        cuerpo.appendChild(el('div', 'aj-etq', tx('progreso.metas.tusMacros')));
        [['proteina', 'comida.proteina'], ['carbohidratos', 'comida.carbohidratos'], ['grasas', 'comida.grasas']].forEach(([clave, texto]) => {
          const f = el('label', 'cr-campo');
          const input = el('input');
          input.type = 'text';
          input.inputMode = 'decimal';
          input.value = s.aMano[clave];
          input.addEventListener('change', () => { s.aMano[clave] = Number(input.value.replace(',', '.')) || 0; cambioDeMeta(); });
          f.append(el('span', null, tx(texto)), input, el('em', null, 'g'));
          cuerpo.appendChild(f);
        });
      }

      // Repartir la semana: el mismo total, más los días elegidos.
      const semana = el('div', 'aj-semana');
      const llave = boton('aj-llave', `<span>${tx('progreso.metas.semana')}</span><i></i>`, () => { s.reparte = !s.reparte; pintar(); });
      llave.setAttribute('aria-pressed', String(s.reparte));
      semana.append(llave, el('p', 'aj-nota', tx('progreso.metas.semanaTexto')));
      if (s.reparte) {
        const dias = el('div', 'aj-dias');
        SEMANA.forEach((d) => {
          const b = boton('aj-dia', tx('fecha.diasCortos.' + d).charAt(0), () => { s.altos = s.altos.includes(d) ? s.altos.filter((x) => x !== d) : [...s.altos, d]; pintar(); });
          b.setAttribute('aria-pressed', String(s.altos.includes(d)));
          dias.appendChild(b);
        });
        semana.appendChild(dias);
        semana.appendChild(segmento(EXTRAS.map((n) => [n, `+${numero(n)}`]), s.extra, (v) => { s.extra = v; pintar(); }));
        const reparto = Metas.repartirSemana(m, s.altos, s.extra, p.sexo);
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

    pintar();

    return {
      zona,
      pintar,
      get vista() { return s.vista; },
      // Para las capturas y los botones de la galería.
      verMetas() { s.vista = 'metas'; pintar(); cont.scrollTop = 0; },
      verPrincipal() { s.vista = 'principal'; pintar(); },
      ponerQuien(q) { s.quien = q; cambioDeMeta(); },
      repartir(si) { s.reparte = si; pintar(); },
      abrir(cual) { s.abierto = cual; pintar(); },
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTo({ top: Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 70), behavior: 'auto' });
      },
      subir() { cont.scrollTo(0, 0); },
    };
  }

  return { crear };
})();
