// La persona de mentira de la galería: quiere bajar a 71 kg y empezó el lunes 31 de agosto. Acá
// están lo que la app guardaría (su perfil, sus pesadas, sus medidas y lo que Salud trae de sus
// noches); lo que se calcula con eso (la tendencia, el control, el progreso, la grasa y el sueño)
// lo calculan los módulos de la app (Control, Progreso, Cuerpo y Sueno) en cada sección.

const Datos = (() => {
  const HOY = '2026-10-21';
  // Las 21:47 del miércoles, como el resto de la galería.
  const AHORA_MIN = 21 * 60 + 47;
  const INICIO = '2026-08-31';
  const PERFIL = {
    sexo: 'm', nacimiento: 1995, alturaCm: 178, actividad: 'activo', objetivo: 'bajar', ritmo: 'recomendado',
    estilo: 'equilibrada', pesoMeta: 71, nombre: 'Agustín',
  };
  // El gasto del control anterior (el del lunes 12), del que parte el del lunes 19.
  const GASTO_ANTERIOR = 3000;

  // Un azar que sale igual cada vez.
  const azar = (semilla) => { let s = semilla; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  // Siete semanas bajando unos 380 g por semana, con el ruido de todos los días (agua, sal, el
  // fin de semana). Casi nunca se pesa los domingos, y hoy todavía no se pesó.
  const PESADAS = (() => {
    const r = azar(5);
    const lista = [];
    const dias = Fechas.diasEntre(INICIO, HOY);
    for (let d = 0; d < dias; d++) {
      const fecha = Fechas.sumarDias(INICIO, d);
      const dia = Fechas.diaDeLaSemana(fecha);
      const salta = (dia === 0 && r() < 0.8) || r() < 0.1;
      const kg = 77.3 - 0.055 * d + (r() - 0.5) * 0.7 + (dia === 1 ? 0.3 : 0);
      if (!salta) lista.push({ fecha, kg: Math.round(kg * 10) / 10, origen: 'salud', momento: fecha + 'T07:20:00.000Z' });
    }
    return lista;
  })();

  // Tres veces con la cinta, cada tres semanas. La cadera, el brazo, el pecho y el muslo no entran
  // en la cuenta de un hombre, pero se siguen igual.
  const MEDIDAS = [
    { fecha: '2026-08-31', cintura: 88.5, cuello: 38.5, cadera: 99, brazo: 34, pecho: 103, muslo: 58.5 },
    { fecha: '2026-09-21', cintura: 87, cuello: 38.5, cadera: 98, brazo: 33.5, pecho: 101.5, muslo: 58 },
    { fecha: '2026-10-12', cintura: 85.5, cuello: 38, cadera: 97, brazo: 33.5, pecho: 100.5, muslo: 57.5 },
  ].map((m) => Object.assign({ actualizado: m.fecha + 'T08:00:00.000Z' }, m));

  // ------------------------------------------------------------ las noches, como las trae Salud
  // Cuatro semanas del reloj, con sus etapas en ciclos de hora y media (más profundo al principio,
  // más REM al final) y despertares cortos, y el «en cama» del iPhone todas las noches. Para ver
  // cómo se muestra lo que falta: el sábado 10 no hay nada, el sábado 17 el reloj se quedó sin
  // batería (solo está el iPhone) y el domingo 4 se cortó a las 2:30. El domingo 18 hay una siesta.
  const ZONA = -180;
  const FUENTES = [
    { id: 'reloj', nombre: 'Apple Watch', tipo: 'reloj' },
    { id: 'iphone', nombre: 'iPhone', tipo: 'telefono' },
  ];
  const SIN_NADA = '2026-10-10';
  const SIN_RELOJ = '2026-10-17';
  const CORTADA = '2026-10-04';
  // Un instante a una hora local (en minutos desde las 18 del día anterior a la clave).
  const instante = (clave, minuto) => Date.parse(clave + 'T00:00:00.000Z') - 6 * 3600e3 - ZONA * 60e3 + minuto * 60e3;
  const { MUESTRAS, LECTURAS } = (() => {
    const r = azar(31);
    const muestras = [];
    const lecturas = { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() };
    for (let i = 27; i >= 0; i--) {
      const clave = Fechas.sumarDias(HOY, -i);
      const dia = Fechas.diaDeLaSemana(clave);
      const finde = dia === 6 || dia === 0;
      // Anoche, a la hora de la galería: de 23:41 a 7:13.
      const anoche = i === 0;
      const dormirse = anoche ? 341 : 330 + (finde ? 70 : 0) + Math.round((r() - 0.5) * 40);
      const despertar = anoche ? 793 : 785 + (finde ? 85 : 0) + Math.round((r() - 0.5) * 30);
      lecturas.reposo.set(clave, Math.round(55 + (r() - 0.5) * 4));
      if (clave === SIN_NADA) continue;
      muestras.push({ etapa: 'enCama', desde: instante(clave, dormirse - 12 - Math.round(r() * 15)), hasta: instante(clave, despertar + 6 + Math.round(r() * 10)), fuente: 'iphone', zona: ZONA });
      if (clave === SIN_RELOJ) continue;
      const fin = clave === CORTADA ? 510 : despertar;
      // Los ciclos: núcleo, profundo (cada vez menos), núcleo y REM (cada vez más), con algún despertar.
      let t = dormirse;
      let ciclo = 0;
      const despertares = anoche ? [178, 395] : [Math.round(150 + r() * 120), Math.round(320 + r() * 120)].slice(0, 1 + Math.floor(r() * 2));
      const poner = (etapa, minutos) => {
        const hasta = Math.min(fin, t + minutos);
        if (hasta > t) muestras.push({ etapa, desde: instante(clave, t), hasta: instante(clave, hasta), fuente: 'reloj', zona: ZONA });
        t = hasta;
      };
      while (t < fin) {
        const profundo = Math.max(4, 38 - ciclo * 11 + Math.round((r() - 0.5) * 10));
        const rem = Math.min(48, 12 + ciclo * 9 + Math.round((r() - 0.5) * 8));
        poner('nucleo', 24 + Math.round(r() * 12));
        poner('profundo', profundo);
        poner('nucleo', 16 + Math.round(r() * 10));
        if (despertares.length && t - dormirse >= despertares[0]) { despertares.shift(); poner('despierto', anoche ? 9 : 2 + Math.round(r() * 10)); }
        poner('rem', rem);
        ciclo++;
      }
      // Lo que el reloj mide mientras dormís: el pulso seguido, la variabilidad pocas veces y la respiración.
      for (let m = dormirse + 5; m < fin; m += 7) lecturas.frecuencia.push({ en: instante(clave, m), valor: Math.round(51 + Math.sin(m / 40) * 2 + (r() - 0.5) * 3 + (anoche ? 1.5 : 0)) });
      for (let m = dormirse + 40; m < fin; m += 95 + Math.round(r() * 40)) lecturas.variabilidad.push({ en: instante(clave, m), valor: Math.round(47 + (r() - 0.5) * 16 - (anoche ? 4 : 0)) });
      for (let m = dormirse + 20; m < fin; m += 30) lecturas.respiracion.push({ en: instante(clave, m), valor: Math.round((14.2 + (r() - 0.5) * 1.2) * 10) / 10 });
    }
    // La siesta del domingo 18.
    muestras.push({ etapa: 'nucleo', desde: instante('2026-10-18', 21 * 60 + 20), hasta: instante('2026-10-18', 21 * 60 + 55), fuente: 'reloj', zona: ZONA });
    return { MUESTRAS: muestras, LECTURAS: lecturas };
  })();
  const NOCHES = Sueno.armarNoches(MUESTRAS, FUENTES);
  const SOLO_EN_CAMA = Sueno.soloEnCama(MUESTRAS, FUENTES, NOCHES);

  return {
    HOY, AHORA_MIN, INICIO, PERFIL, GASTO_ANTERIOR, PESADAS, MEDIDAS, azar,
    FUENTES, MUESTRAS, LECTURAS, NOCHES, SOLO_EN_CAMA, NOCHE_SIN_RELOJ: SIN_RELOJ, NOCHE_SIN_NADA: SIN_NADA, NOCHE_CORTADA: CORTADA,
  };
})();
