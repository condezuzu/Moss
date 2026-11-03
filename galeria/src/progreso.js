// Progreso (spec/progreso.md), más simple desde el 2/11/2026: arriba el próximo control en una línea
// y el plan por etapas (a dónde llegar y cuándo, los hitos, lo que viene al llegar y cómo vienes),
// con la estrategia adentro (el objetivo, el peso meta con su ritmo y su plazo, D35, y las metas de
// hoy, con quién las pone, cómo se reparten los macros y repartir la semana); después el peso con su
// tendencia y la grasa corporal (o la invitación a medirla). Semana a semana, las medidas y el gasto
// con el balance quedan plegados en «Más datos». Las cuentas son las de la app: Control, Progreso,
// Cuerpo y Metas.

const SeccionProgreso = (() => {
  const SEMANA = [1, 2, 3, 4, 5, 6, 0];
  const EXTRAS = [200, 300, 500];
  // Hasta dónde llega la regla del ritmo, en % del peso por semana: más allá de lo muy agresivo.
  const TOPE = { bajar: 1.15, subir: 0.7 };
  const RANGOS = [['mes', 30], ['tresMeses', 90], ['todo', 0]];

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, conSigno, el, boton, icono } = u;
    const s = {
      vista: 'principal', abierto: null, quien: 'moss', aMano: { proteina: 160, carbohidratos: 280, grasas: 80 }, reparte: false, altos: [6, 0], extra: 300,
      // El ritmo y el plazo: el ritmo en % del peso por semana (sin tocar, el del perfil) o la fecha elegida.
      pct: null, porFecha: false, fecha: null, fuerza: null, rango: 'tresMeses',
      // Plegados de fábrica: cambiar el plan y lo que se mira de vez en cuando. Sin medidas, para las capturas.
      cambiarPlan: false, masDatos: false, sinMedidas: false,
    };

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
      if (opciones.alPintar) opciones.alPintar();
    }

    function pintarPrincipal() {
      const d = opciones.persona();
      const hoy = u.partes(Datos.HOY);
      const cab = el('header', 'pg-cab');
      cab.append(el('div', 'pg-fecha', tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) })), el('h2', 'pg-titulo', tx('progreso.titulo')));
      // Arriba a la derecha, la marca de Ascent, que está arriba de Progreso (ascent.js).
      const marca = opciones.marcaDeAscent && opciones.marcaDeAscent();
      if (marca) cab.appendChild(marca);
      cont.appendChild(cab);
      // De arriba abajo, lo que se mira primero (lo pediste el 2/11/2026): el control en una línea, el
      // plan, el peso y la grasa; lo demás, plegado en «Más datos».
      cont.appendChild(controlCorto(d));
      cont.appendChild(plan(d));
      cont.appendChild(peso(d));
      cont.appendChild(grasa(d));
      cont.appendChild(masDatos(d));
      // Lo de Ascent, si ascent.js pone algo al final (ahora va arriba, en la marca).
      const asomo = opciones.asomoDeAscent && opciones.asomoDeAscent();
      if (asomo) cont.appendChild(asomo);
    }

    // ------------------------------------------------------------ el plan
    // A dónde llegar y cuándo, los hitos en una línea con lo que viene al llegar, cómo vienes y, ahí
    // mismo, cambiarlo (el objetivo, el peso meta, el ritmo y el plazo, y las metas de hoy).
    const ESTADO_DEL_PLAN = { alRitmo: 'enCamino', adelantado: 'enCamino', atrasado: 'despacio', alReves: 'despacio', llegaste: 'enCamino', estable: 'enCamino', seMueve: '', faltanDatos: '' };
    const kgCorto = (kg) => numero(kg, kg % 1 ? 1 : 0);
    function planDe(d) {
      const p = d.perfil;
      return Progreso.planPorEtapas({ hoy: Datos.HOY, pesoKg: d.pesoHoy, objetivo: p.objetivo, pesoMeta: p.pesoMeta, plazo: plazoActual(d), ritmo: d.progreso.ritmo, despues: p.despues, pesoInicial: d.pesoInicial });
    }
    function plan(d) {
      const pl = planDe(d);
      const c = carta('pg-plan', tx('progreso.plan.titulo'), el('em', 'in-estado ' + ESTADO_DEL_PLAN[pl.comoVienes], tx('progreso.plan.estados.' + pl.comoVienes)));
      const primera = pl.etapas[0];
      c.appendChild(el('div', 'pg-plan-titulo', tx('progreso.plan.etapas.' + primera.tipo, { kg: kgCorto(primera.pesoHasta) })));
      if (primera.hasta) c.appendChild(el('div', 'pg-plan-para', tx('progreso.plan.para', { fecha: u.fechaLarga(primera.hasta) })));
      if (pl.hitos.length) c.appendChild(pista(d, pl));
      const clave = pl.comoVienes === 'atrasado' && !pl.fechaATuRitmo ? 'atrasadoSinFecha' : pl.comoVienes;
      c.appendChild(el('p', 'pg-texto pg-plan-como', tx('progreso.plan.comoVienes.' + clave, {
        ritmo: pl.ritmo == null ? '' : conSigno(pl.ritmo, 2), plan: conSigno(pl.ritmoPlan, 2), fecha: pl.fechaATuRitmo ? u.fechaCorta(pl.fechaATuRitmo) : '',
      })));
      // Al llegar, el mantenimiento; y lo que sigue, si lo dijo en el cuestionario (perfil.despues).
      if (pl.etapas[1]) {
        const luego = pl.etapas[2] ? (pl.etapas[2].tipo === 'subir' ? 'musculo' : 'mantener') : 'eliges';
        c.appendChild(el('p', 'pg-texto pg-plan-despues', `${tx('progreso.plan.despues.' + primera.tipo, { n: Progreso.SEMANAS_DE_MANTENIMIENTO })} ${tx('progreso.plan.luego.' + luego, { kg: kgCorto(primera.pesoHasta) })}`));
      }
      c.appendChild(el('p', 'pg-nota pg-plan-ajusta', tx('progreso.plan.ajusta')));
      const cambiar = boton('cm-enlace pg-plan-cambiar' + (s.cambiarPlan ? ' abierto' : ''), `<span>${tx('progreso.plan.cambiar')}</span>${icono('adelante')}`, () => { s.cambiarPlan = !s.cambiarPlan; pintar(); });
      cambiar.setAttribute('aria-expanded', String(s.cambiarPlan));
      c.appendChild(cambiar);
      if (s.cambiarPlan) c.appendChild(estrategia(d, true));
      return c;
    }

    // La línea del plan: desde que empezaste (lo hecho, en oro) hasta hoy, los hitos y la meta, y el
    // mantenimiento después, más tenue. Cada punto con su fecha y su peso; los que no entran sin
    // pisarse, sin etiqueta.
    function pista(d, pl) {
      const desde = [...d.tendencia.keys()][0];
      const meta = pl.hitos[pl.hitos.length - 1];
      const fin = (pl.etapas[1] && pl.etapas[1].hasta) || meta.fecha;
      const total = Math.max(1, Fechas.diasEntre(desde, fin));
      const pos = (f) => Math.min(100, Math.max(0, (Fechas.diasEntre(desde, f) / total) * 100));
      const caja = el('div', 'pg-pista');
      const linea = el('div', 'pg-pista-linea');
      const hecho = el('i', 'pg-pista-hecho');
      const mant = el('i', 'pg-pista-mant');
      mant.style.left = pos(meta.fecha).toFixed(1) + '%';
      mant.style.width = (100 - pos(meta.fecha)).toFixed(1) + '%';
      linea.append(hecho, mant);
      caja.appendChild(linea);
      const puntos = [
        { f: desde, kg: d.pesoInicial, clase: 'inicio', etq: u.fechaCorta(desde) },
        { f: Datos.HOY, kg: d.pesoHoy, clase: 'hoy', etq: tx('progreso.hoy') },
        ...pl.hitos.map((h) => ({ f: h.fecha, kg: h.kg, clase: h.meta ? 'meta' : 'hito', etq: u.fechaCorta(h.fecha) })),
      ];
      let ultima = -100;
      puntos.forEach((x, i) => {
        const left = pos(x.f);
        const pt = el('div', 'pg-pista-punto ' + x.clase);
        pt.style.left = left.toFixed(1) + '%';
        pt.appendChild(el('i'));
        // Hoy y la meta siempre llevan su etiqueta; los demás, si no pisan la anterior.
        const siempre = x.clase === 'hoy' || x.clase === 'meta';
        if (siempre || left - ultima >= 17) {
          pt.append(el('small', null, x.etq), el('b', null, numero(x.kg, 1)));
          ultima = left;
        }
        pt.style.animationDelay = `${0.08 * i}s`;
        caja.appendChild(pt);
      });
      const m = el('div', 'pg-pista-mant-etq', tx('progreso.plan.mantener'));
      m.style.left = ((pos(meta.fecha) + 100) / 2).toFixed(1) + '%';
      caja.appendChild(m);
      requestAnimationFrame(() => { hecho.style.width = pos(Datos.HOY).toFixed(1) + '%'; });
      return caja;
    }

    // ------------------------------------------------------------ el próximo control, en una línea
    // Arriba de todo (lo pediste el 2/11/2026): cuándo, cómo viene y lo que le falta, en corto.
    // Tocándolo se abre lo demás: qué pasa ese día y qué día de la semana se hace.
    function estadoDelControl(e) {
      // Mientras quedan días antes del control, todavía puede llegar: está en curso, no le falta nada.
      const quedan = Math.max(0, e.faltan - 1);
      return e.alcanza ? 'alcanza' : e.diasConComida + quedan >= e.minimos.diasConComida ? 'enCurso' : 'faltanDatos';
    }
    function controlCorto(d) {
      const e = d.estadoControl;
      const estado = estadoDelControl(e);
      const abierto = s.abierto === 'control';
      const c = el('article', 'pg-carta pg-control' + (abierto ? ' abierto' : ''));
      const fila = boton('pg-cc-fila', '', () => { s.abierto = abierto ? null : 'control'; pintar(); });
      fila.setAttribute('aria-expanded', String(abierto));
      const textos = el('div', 'pg-cc-textos');
      const cuando = e.faltan === 0 ? tx('progreso.hoy') : e.faltan === 1 ? tx('progreso.manana') : tx('progreso.enDias', { n: e.faltan });
      textos.append(el('b', null, tx('progreso.control.titulo', { dia: tx('fecha.dias.' + Fechas.diaDeLaSemana(e.fecha)), cuando })), el('span', null, requisitos(e)));
      fila.innerHTML = icono('reloj');
      fila.append(textos, el('em', 'in-estado ' + (estado === 'alcanza' ? 'enCamino' : estado === 'enCurso' ? '' : 'despacio'), tx('progreso.' + estado)));
      fila.insertAdjacentHTML('beforeend', icono('abajo'));
      c.appendChild(fila);
      if (abierto) {
        const dentro = el('div', 'pg-cc-dentro');
        dentro.appendChild(el('p', 'pg-texto', tx('progreso.control.textos.' + estado)));
        dentro.appendChild(el('div', 'aj-etq', tx('progreso.diaDelControl')));
        const dias = el('div', 'aj-dias');
        SEMANA.forEach((dia) => {
          const b = boton('aj-dia', tx('fecha.diasCortos.' + dia).charAt(0), () => opciones.ponerEstrategia({ diaDelControl: dia }), tx('fecha.dias.' + dia));
          b.setAttribute('aria-pressed', String(dia === d.diaDelControl));
          dias.appendChild(b);
        });
        dentro.append(dias, el('p', 'aj-nota', tx('progreso.diaDelControlNota')));
        c.appendChild(dentro);
      }
      return c;
    }
    // «2 de 4 días con comida · pesada ✓»: lo que tiene, en corto, y lo cumplido con su marca.
    function requisitos(e) {
      const comida = e.diasConComida >= e.minimos.diasConComida ? tx('progreso.control.comidaLista') : tx('progreso.control.comida', { n: e.diasConComida, min: e.minimos.diasConComida });
      const pesadas = e.pesadas >= e.minimos.pesadas ? tx('progreso.control.pesadaLista') : tx('progreso.control.pesada');
      return `${comida} · ${pesadas}`;
    }

    // ------------------------------------------------------------ más datos
    // Lo que se mira de vez en cuando (lo pediste el 2/11/2026: que esté, sin llenar la pantalla):
    // semana a semana, las medidas y el gasto, plegados en una fila.
    function masDatos(d) {
      const caja = el('section', 'pg-mas' + (s.masDatos ? ' abierto' : ''));
      const fila = boton('pg-mas-fila', '', () => { s.masDatos = !s.masDatos; pintar(); });
      fila.setAttribute('aria-expanded', String(s.masDatos));
      const t = el('div');
      t.append(el('b', null, tx('progreso.masDatos.titulo')), el('span', null, tx('progreso.masDatos.sub')));
      fila.appendChild(t);
      fila.insertAdjacentHTML('beforeend', icono('abajo'));
      caja.appendChild(fila);
      if (s.masDatos) {
        const dentro = el('div', 'pg-mas-dentro');
        dentro.append(semanas(d), medidas(d), gasto(d));
        caja.appendChild(dentro);
      }
      return caja;
    }

    // ------------------------------------------------------------ el peso
    function peso(d) {
      const c = carta('pg-peso', tx('progreso.peso'), boton('cm-anotar', `${icono('mas')}<span>${tx('progreso.registrar')}</span>`, () => opciones.registrarPeso()));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, numero(d.pesoHoy, 1)), el('span', null, ` kg · ${tx('progreso.tendencia')}`));
      c.append(cifra, el('div', 'pg-nota', tx('progreso.cambios', { semana: conSigno(d.cambio7, 1), mes: conSigno(d.cambio30, 1) })));
      // Cuánto se mira para atrás: un mes, tres o todo (con lo que haya).
      const rangos = segmento(RANGOS.map(([k]) => [k, tx('progreso.graficos.rangos.' + k)]), s.rango, (v) => { s.rango = v; pintar(); });
      rangos.classList.add('pg-rangos');
      c.appendChild(rangos);
      const desde = [...d.tendencia.keys()][0];
      const hay = Fechas.diasEntre(desde, Datos.HOY) + 1;
      const pedido = RANGOS.find(([k]) => k === s.rango)[1];
      const dias = pedido ? Math.min(pedido, hay) : hay;
      c.appendChild(Graficos.linea(serieDe(d, dias), { ancho: 320, alto: 92, clase: 'pg-grafico', meta: d.perfil.objetivo !== 'mantener' ? d.perfil.pesoMeta : null }));
      const eje = el('div', 'pg-eje');
      eje.append(el('span', null, u.fechaCorta(Fechas.sumarDias(Datos.HOY, -(dias - 1)))), el('span', null, tx('progreso.hoy')));
      c.appendChild(eje);
      c.appendChild(el('p', 'pg-texto pg-leyenda', tx('progreso.pesoLeyenda')));
      return c;
    }

    // Los últimos `dias`, con la pesada de cada día y la tendencia (como serieDe en galeria.js).
    function serieDe(d, dias) {
      const porFecha = new Map(d.pesadas.map((x) => [x.fecha, x.kg]));
      return Array.from({ length: dias }, (_, i) => {
        const f = Fechas.sumarDias(Datos.HOY, i - dias + 1);
        return { x: i / Math.max(1, dias - 1), punto: porFecha.has(f) ? porFecha.get(f) : null, linea: d.tendencia.has(f) ? d.tendencia.get(f) : null };
      });
    }

    // ------------------------------------------------------------ semana a semana
    // Las últimas seis semanas: cuánto cambió la tendencia y lo que comió en promedio, contra la meta.
    function semanas(d) {
      const c = carta('pg-semanas', tx('progreso.graficos.semanas'));
      const N = 6;
      const ayer = Fechas.sumarDias(Datos.HOY, -1);
      const comidas = opciones.comida.kcalPorDia();
      const lista = Array.from({ length: N }, (_, i) => {
        const fin = Fechas.sumarDias(ayer, -7 * (N - 1 - i));
        const inicio = Fechas.sumarDias(fin, -6);
        const antes = d.tendencia.get(Fechas.sumarDias(inicio, -1));
        const despues = d.tendencia.get(fin);
        const conComida = comidas.filter((x) => x.fecha >= inicio && x.fecha <= fin);
        return {
          inicio,
          cambio: antes != null && despues != null ? despues - antes : null,
          kcal: conComida.length >= 3 ? conComida.reduce((t, x) => t + x.kcal, 0) / conComida.length : null,
        };
      });
      const valores = (f) => {
        const fila = el('div', 'pg-valores');
        lista.forEach((x) => { const v = f(x); fila.appendChild(el('span', v == null ? 'tenue' : '', v == null ? '—' : v)); });
        return fila;
      };
      c.appendChild(el('div', 'pg-etq-graf', tx('progreso.graficos.semanasCambio')));
      c.appendChild(Graficos.barras(lista.map((x) => x.cambio), { ancho: 320, alto: 54, clase: 'pg-grafico' }));
      c.appendChild(valores((x) => (x.cambio == null ? null : conSigno(x.cambio, 1))));
      c.appendChild(el('div', 'pg-etq-graf', tx('progreso.graficos.semanasComida')));
      c.appendChild(Graficos.columnas(lista.map((x) => x.kcal), opciones.comida.meta.kcal, { ancho: 320, alto: 54, clase: 'pg-grafico' }));
      c.appendChild(valores((x) => (x.kcal == null ? null : numero(Math.round(x.kcal / 10) * 10))));
      const eje = valores((x) => u.fechaCorta(x.inicio));
      eje.classList.add('pg-valores-eje');
      c.appendChild(eje);
      c.appendChild(el('p', 'pg-texto pg-leyenda', tx('progreso.graficos.semanasTexto')));
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
        const historia = Datos.MEDIDAS.map((m) => m[sitio]).filter((v) => v != null);
        li.append(el('span', null, tx('cuerpo.sitios.' + sitio)), Graficos.chispa(historia, { clase: 'pg-chispa' }), el('b', null, `${Porciones.decimal(cm, u.idioma())} cm`),
          el('em', cambio == null ? '' : cambio < 0 ? 'baja' : cambio > 0 ? 'sube' : '', cambio == null ? '' : `${conSigno(cambio, 1)} cm`));
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
    // En el medio de Progreso. Sin medidas, invita a medirla una vez, con lo que hace falta y que es una
    // estimación (lo pediste el 2/11/2026: casi nadie se mide seguido, y que no genere desconfianza).
    function grasa(d) {
      const r = s.sinMedidas ? null : d.grasa;
      if (!r) {
        const c = carta('pg-grasa pg-grasa-invita', tx('progreso.grasa'));
        c.append(
          el('b', 'pg-invita-titulo', tx('progreso.grasaInvita.titulo')),
          el('p', 'pg-texto', tx(d.perfil.sexo === 'm' ? 'progreso.grasaInvita.textoHombre' : 'progreso.grasaInvita.textoMujer')),
          boton('pg-invita-boton', `${icono('cinta')}<span>${tx('progreso.grasaInvita.boton')}</span>`, () => opciones.medir()),
          el('p', 'pg-nota', tx('progreso.grasaInvita.confianza')),
        );
        return c;
      }
      const c = carta('pg-grasa', tx('progreso.grasa'), boton('cm-anotar', `${icono('cinta')}<span>${tx('progreso.medir')}</span>`, () => opciones.medir()));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, tx('cuerpo.rango', { desde: r.desde, hasta: r.hasta })), el('span', null, tx('cuerpo.estimacion')));
      c.append(cifra, el('p', 'pg-aviso', tx('progreso.grasaInvita.confianza')));
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
    // Dentro del plan, sin carta propia.
    function estrategia(d, dentro) {
      const c = dentro ? el('div', 'pg-plan-estrategia') : carta('pg-estrategia');
      const lista = el('div', 'pg-filas');
      const fila = (clave, valor, alTocar, abierta) => {
        const f = boton('pg-fila' + (abierta ? ' abierta' : ''), `<span>${tx(clave)}</span><b></b>${icono('adelante')}`, alTocar);
        f.querySelector('b').textContent = valor;
        lista.appendChild(f);
        return f;
      };
      const p = d.perfil;
      const alternar = (cual) => () => { s.abierto = s.abierto === cual ? null : cual; pintar(); };
      fila('progreso.objetivo', tx('progreso.objetivos.' + p.objetivo), alternar('objetivo'), s.abierto === 'objetivo');
      if (s.abierto === 'objetivo') lista.appendChild(eleccionObjetivo(p));
      if (p.objetivo !== 'mantener') {
        const metaKg = p.pesoMeta;
        fila('progreso.pesoMeta', metaKg ? `${numero(metaKg, metaKg % 1 ? 1 : 0)} kg` : tx('progreso.sinPesoMeta'), alternar('pesoMeta'), s.abierto === 'pesoMeta');
        if (s.abierto === 'pesoMeta') lista.appendChild(eleccionPesoMeta(p));
        const plazo = plazoActual(d);
        const filaPlazo = fila('progreso.plazo.fila', plazo ? valorDelPlazo(plazo) : '—', alternar('plazo'), s.abierto === 'plazo');
        if (s.abierto === 'plazo') lista.appendChild(eleccionPlazo(d, plazo, filaPlazo));
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
      caja.appendChild(segmento(['bajar', 'mantener', 'subir'].map((o) => [o, tx('progreso.objetivos.' + o)]), p.objetivo, (v) => { s.pct = null; s.porFecha = false; opciones.ponerEstrategia({ objetivo: v }); }));
      caja.appendChild(el('p', 'aj-nota', tx('progreso.objetivoNota')));
      return caja;
    }

    // ------------------------------------------------------------ el ritmo y el plazo (D35)
    // Como en MacroFactor: el ritmo da la fecha, o la fecha da el ritmo (Progreso.plazoConRitmo y
    // plazoConFecha, las cuentas de la app), con qué tan exigente es y lo que conviene saber.
    function plazoActual(d) {
      const p = d.perfil;
      if (p.objetivo === 'mantener' || !p.pesoMeta) return null;
      const e = { hoy: Datos.HOY, pesoKg: d.pesoHoy, pesoMeta: p.pesoMeta, sexo: p.sexo, edad: Number(Datos.HOY.slice(0, 4)) - p.nacimiento, gasto: d.gasto, entrenaFuerza: s.fuerza };
      if (Progreso.direccionDe(e.pesoKg, e.pesoMeta) !== p.objetivo) return null;
      if (s.porFecha && s.fecha) return Progreso.plazoConFecha(e, s.fecha);
      return Progreso.plazoConRitmo(e, s.pct ?? Math.abs(Metas.RITMOS[p.objetivo][p.ritmo]));
    }
    const valorDelPlazo = (plazo) => `${numero(plazo.pct, 2)} % · ${u.fechaCorta(plazo.fecha)}`;

    function eleccionPlazo(d, plazo, filaPlazo) {
      const p = d.perfil;
      const caja = el('div', 'pg-eleccion pg-plazo');
      if (!plazo) {
        caja.appendChild(el('p', 'aj-nota', tx('progreso.plazo.sinCamino')));
        return caja;
      }
      const dir = plazo.direccion;
      const tope = TOPE[dir];
      // Arriba, la fecha, en cuántas semanas y qué tan exigente es.
      const res = el('div', 'pg-plazo-res');
      const cifra = el('div', 'pg-cifra');
      const fecha = el('b');
      const enSemanas = el('span');
      cifra.append(fecha, enSemanas);
      const chip = el('em', 'pg-viab');
      res.append(cifra, chip);
      // La regla: el ritmo, con las zonas de color y los tres de siempre debajo.
      const regla = el('div', 'pg-regla');
      const pos = (pct) => Math.min(100, (pct / tope) * 100);
      regla.style.setProperty('--viable', pos(Progreso.bordeDe(dir, 'viable', d.pesoHoy)).toFixed(1) + '%');
      regla.style.setProperty('--exigente', pos(Progreso.bordeDe(dir, 'exigente', d.pesoHoy)).toFixed(1) + '%');
      const input = el('input');
      input.type = 'range';
      input.min = '0.05';
      input.max = String(tope);
      input.step = '0.01';
      input.value = String(Math.min(tope, plazo.pct));
      input.setAttribute('aria-label', tx('progreso.plazo.ritmo'));
      const marcas = el('div', 'pg-marcas');
      ['suave', 'recomendado', 'rapido'].forEach((r) => {
        const pct = Math.abs(Metas.RITMOS[dir][r]);
        const b = boton('pg-marca', tx('progreso.ritmos.' + r), () => { s.pct = pct; s.porFecha = false; opciones.ponerEstrategia({ ritmo: r }); });
        b.style.left = pos(pct).toFixed(1) + '%';
        b.dataset.pct = String(pct);
        marcas.appendChild(b);
      });
      regla.append(input, marcas);
      const porSemana = el('div', 'pg-nota');
      const texto = el('p', 'pg-texto');
      const kcal = el('p', 'aj-nota');
      // O la fecha: una semana antes o después, y el ritmo sale solo.
      const cambiarModo = boton('cm-enlace pg-modo', '', () => {
        s.porFecha = !s.porFecha;
        s.fecha = s.porFecha ? plazoActual(d)?.fecha ?? plazo.fecha : null;
        if (!s.porFecha) s.pct = Number(input.value);
        pintar();
      });
      cambiarModo.innerHTML = `<span>${tx(s.porFecha ? 'progreso.plazo.elegirRitmo' : 'progreso.plazo.elegirFecha')}</span>${icono('adelante')}`;
      const fechas = el('div', 'fi-stepper pg-fechas');
      const fechaElegida = el('b', 'fi-valor');
      const mover = (dias) => { s.fecha = Fechas.sumarDias(s.fecha, dias); pintar(); };
      fechas.append(boton('fi-paso', icono('menos'), () => mover(-7), tx('progreso.plazo.antes')), fechaElegida, boton('fi-paso', icono('mas'), () => mover(7), tx('progreso.plazo.despues')));
      fechas.hidden = !s.porFecha;
      const avisos = el('div', 'pg-avisos');

      function refrescar(x) {
        fecha.textContent = u.fechaCorta(x.fecha);
        enSemanas.textContent = tx('progreso.plazo.enSemanas', { n: Math.round(x.semanas) });
        chip.className = 'pg-viab ' + x.viabilidad;
        chip.textContent = tx('progreso.plazo.viabilidad.' + x.viabilidad);
        porSemana.textContent = tx('progreso.plazo.porSemana', { pct: numero(x.pct, 2), kg: numero(x.kgPorSemana, 2) });
        texto.textContent = tx('progreso.plazo.textos.' + x.viabilidad, { exigente: u.fechaCorta(x.fechaExigente), viable: u.fechaCorta(x.fechaViable) });
        kcal.textContent = tx(dir === 'bajar' ? 'progreso.plazo.kcalMenos' : 'progreso.plazo.kcalMas', { n: numero(Math.round(x.kcal / 10) * 10) });
        fechaElegida.textContent = u.fechaCorta(x.fecha);
        marcas.querySelectorAll('.pg-marca').forEach((b) => b.setAttribute('aria-pressed', String(Math.abs(Number(b.dataset.pct) - x.pct) < 0.005)));
        avisos.innerHTML = '';
        // El del piso sin fecha se ve como el del piso.
        x.avisos.forEach((a) => avisos.appendChild(el('p', 'pg-aviso pg-aviso-' + (a === 'pisoNoLlega' ? 'piso' : a), tx('progreso.plazo.avisos.' + a, {
          piso: numero(Metas.pisoDe(p.sexo)), fecha: x.fechaConPiso ? u.fechaCorta(x.fechaConPiso) : '',
        }))));
        if (filaPlazo) filaPlazo.querySelector('b').textContent = valorDelPlazo(x);
      }
      // Mientras se arrastra, cambia solo el panel; al soltar, se pinta todo (el camino de arriba).
      input.addEventListener('input', () => {
        s.pct = Number(input.value);
        s.porFecha = false;
        fechas.hidden = true;
        const x = plazoActual(d);
        if (x) refrescar(x);
      });
      input.addEventListener('change', () => pintar());
      refrescar(plazo);
      caja.append(res, regla, porSemana, texto, kcal, cambiarModo, fechas, avisos);
      return caja;
    }

    // El peso meta no baja de un IMC de 18,5 (Metas.pesoMinimoSano): al llegar, se dice por qué.
    function eleccionPesoMeta(p) {
      const caja = el('div', 'pg-eleccion pg-peso-meta');
      const minimo = Metas.pesoMinimoSano(p.alturaCm);
      const valor = el('b', 'fi-valor', `${numero(p.pesoMeta || 70, 1)} kg`);
      const cambiar = (dx) => {
        const kg = Math.round(((p.pesoMeta || 70) + dx) * 2) / 2;
        if (kg < minimo) { s.enElMinimo = true; pintar(); return; }
        s.enElMinimo = false;
        opciones.ponerEstrategia({ pesoMeta: kg });
      };
      const pasos = el('div', 'fi-stepper');
      pasos.append(boton('fi-paso', icono('menos'), () => cambiar(-0.5), '−0,5'), valor, boton('fi-paso', icono('mas'), () => cambiar(0.5), '+0,5'));
      caja.append(pasos, el('p', 'aj-nota', tx('progreso.pesoMetaNota')));
      if (s.enElMinimo) caja.appendChild(el('p', 'aj-nota pg-limite', tx('progreso.limites.imc', { n: numero(minimo, 1), unidad: 'kg' })));
      return caja;
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
      // A mano, por debajo del piso no se guarda (Metas.motivoParaNo): se dice por qué.
      const motivo = s.quien === 'mano' ? Metas.motivoParaNo(m, p.sexo) : null;
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
        if (motivo) cuerpo.appendChild(el('p', 'aj-nota pg-limite', tx('progreso.limites.piso', { n: numero(Metas.pisoDe(p.sexo)) })));
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
      // Lo de la estrategia vive dentro del plan: abrirlo abre «Cambiar el plan».
      abrir(cual) { s.abierto = cual; if (['objetivo', 'pesoMeta', 'plazo'].includes(cual)) s.cambiarPlan = true; pintar(); },
      // El ritmo y el plazo: { pct } o { semanas } (la fecha desde hoy), y si entrena fuerza.
      plazo(o = {}) {
        const { semanas, fuerza } = o;
        s.abierto = 'plazo';
        s.cambiarPlan = true;
        if ('pct' in o) { s.pct = o.pct; s.porFecha = false; }
        if (semanas != null) { s.porFecha = true; s.fecha = Fechas.sumarDias(Datos.HOY, semanas * 7); }
        if (fuerza !== undefined) s.fuerza = fuerza;
        pintar();
      },
      rango(r) { s.rango = r; pintar(); },
      masDatos(si) { s.masDatos = si; pintar(); },
      cambiarPlan(si) { s.cambiarPlan = si; pintar(); },
      sinMedidas(si) { s.sinMedidas = si; pintar(); },
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTo({ top: Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 70), behavior: 'auto' });
      },
      subir() { cont.scrollTo(0, 0); },
    };
  }

  return { crear };
})();
