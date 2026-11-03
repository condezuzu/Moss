import { describe, expect, it } from '@jest/globals';

import { comoEntrenar, diagnostico, estadoDelSueno, focoDeHoy, MAXIMO_DEL_FOCO, ordenarMarcas, queFalla, TERMINAR_ANTES_DE_DORMIR, type EntradasDelDiagnostico, type EntradasDelFoco, type Foco, type SesionDeHoy } from './diagnostico';
import { rendimientoEsperado, type CondicionesDeMarca, type EntradasDelRendimiento } from './rendimiento';

// Fuerza de 58 minutos a las 18:40; 75 kg; meta de 160 g de proteína. Son las 15:30.
const PIERNAS: SesionDeHoy = { inicio: 18 * 60 + 40, minutos: 58, tipo: 'fuerza', hecha: false };
const ANOTADO = { desayuno: { hora: 8 * 60 + 10, proteina: 28, kcal: 480 }, almuerzo: { hora: 13 * 60, proteina: 33, kcal: 700 } };

const rendimiento = (dormido: number | null, cambios: Partial<EntradasDelRendimiento> = {}) => rendimientoEsperado({
  sueno: dormido === null ? null : { dormido, necesidad: 480, despertoAntes: false, seAcostoTarde: false, siesta: false, sinReloj: false },
  ultimas3: [], deuda: null, cara: null, multiarticular: true, tren: 'inferior', horaHabitual: 18 * 60,
  comida: { ayuno8h: false, sesionLarga: true, carbosAyerPorKilo: null, mismosMusculosAyer: false, bajaSemanal: null, semanasBajando: 0, kcalAyer: null },
  residual: 0, descarga: { diasSinSeriesDuras: 2, seriesSemanaSobreMes: 1, intensidadMantenida: true, diasSinElEjercicio: 7 }, entrenado: true,
  ...cambios,
});

const entradas = (cambios: Partial<EntradasDelDiagnostico> = {}, contexto: Partial<EntradasDelDiagnostico['contexto']> = {}): EntradasDelDiagnostico => ({
  contexto: {
    ahora: 15 * 60 + 30, horaDeComida: { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 }, anotado: ANOTADO,
    meta: { kcal: 2740, proteina: 160, carbohidratos: 350, grasas: 78 }, comido: { kcal: 1180, proteina: 61, carbohidratos: 140, grasas: 40 },
    comidasHabituales: 4, pesoKg: 75, edad: 31, despertar: 7 * 60 + 30, dormir: 23 * 60 + 30, cafeinaPorToma: null, sinDeficit: false,
    ...contexto,
  },
  sesion: PIERNAS, sabeCuandoEntrena: true, noche: { dormido: 472, necesidad: 480, siesta: false }, ultimas3: [472, 470, 455], deuda: null, rendimiento: rendimiento(472), marca: null,
  ...cambios,
});
const de = (e: EntradasDelDiagnostico) => {
  const d = diagnostico(e);
  if (!d) throw new Error('sin diagnóstico');
  return d;
};

describe('los cortes del sueño, los del rendimiento', () => {
  const noche = (dormido: number) => ({ dormido, necesidad: 480, siesta: false });
  it('desde una hora menos de lo que necesitas no cuenta; de ahí a 6 h, algo corta; 6 h o menos, corta; 4 h 30 o menos, muy corta', () => {
    expect(estadoDelSueno(noche(420))).toBe('bien');
    expect(estadoDelSueno(noche(419))).toBe('algoCorta');
    expect(estadoDelSueno(noche(361))).toBe('algoCorta');
    expect(estadoDelSueno(noche(360))).toBe('corta');
    expect(estadoDelSueno(noche(271))).toBe('corta');
    expect(estadoDelSueno(noche(270))).toBe('muyCorta');
    expect(estadoDelSueno(null)).toBe('sinDatos');
  });
});

describe('con «sin déficit», nada', () => {
  it('no hay diagnóstico, esté como esté todo lo demás', () => {
    expect(diagnostico(entradas({}, { sinDeficit: true }))).toBeNull();
    expect(diagnostico(entradas({ sesion: null }, { sinDeficit: true }))).toBeNull();
    expect(diagnostico(entradas({ noche: null }, { sinDeficit: true }))).toBeNull();
  });
});

describe('durmió poco y entrena hoy', () => {
  const d = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: false }, ultimas3: [350, 450, 460], rendimiento: rendimiento(350) }));

  it('lo que pesa son las repeticiones: dormir poco toca poco la fuerza máxima', () => {
    expect(rendimiento(350, { multiarticular: false, tren: 'superior', horaHabitual: 10 * 60 }).categoria.max).toBe('normal');
    const r = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: false }, rendimiento: rendimiento(350, { multiarticular: false, tren: 'superior', horaHabitual: 10 * 60 }) }));
    expect(r.titular).toEqual({ que: 'repeticiones' });
  });

  it('con piernas de tarde, también la fuerza: el mismo sueño pesa más', () => {
    expect(d.titular).toEqual({ que: 'cuesta' });
    expect(d.sueno).toBe('corta');
  });

  it('propone la siesta, solo si hay tiempo antes de entrenar y no durmió una ya', () => {
    expect(d.consejos).toContainEqual({ que: 'siesta' });
    const tarde = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: false }, rendimiento: rendimiento(350) }, { ahora: 18 * 60 }));
    expect(tarde.consejos).not.toContainEqual({ que: 'siesta' });
    const conSiesta = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: true }, rendimiento: rendimiento(350) }));
    expect(conSiesta.consejos).not.toContainEqual({ que: 'siesta' });
  });

  it('dice que no hace falta comer distinto: dormir poco no cambia lo que se sugiere', () => {
    expect(d.consejos).toContainEqual({ que: 'noCompensar' });
    const bien = de(entradas());
    expect(d.pasos).toEqual(bien.pasos);
  });

  it('nunca habla del hambre de la noche corta: es lo pendiente de spec/entreno.md (C2)', () => {
    expect(d.pasos.map((p) => p.linea.clase)).not.toContain('nocheCorta');
  });

  it('con dos noches cortas de tres, las series pueden sentirse más pesadas', () => {
    expect(d.consejos).not.toContainEqual({ que: 'seriesPesadas' });
    const dos = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: false }, ultimas3: [350, 340, 460], rendimiento: rendimiento(350) }));
    expect(dos.consejos).toContainEqual({ que: 'seriesPesadas' });
  });

  it('con deuda, cuánto lleva recuperarla; como mucho tres consejos', () => {
    const conDeuda = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: false }, ultimas3: [350, 340, 460], deuda: 8 * 60, rendimiento: rendimiento(350), marca: 'Sentadilla' }));
    expect(conDeuda.consejos).toHaveLength(3);
    const soloDeuda = de(entradas({ noche: { dormido: 350, necesidad: 480, siesta: true }, deuda: 8 * 60, rendimiento: rendimiento(350) }));
    expect(soloDeuda.consejos).toContainEqual({ que: 'deuda' });
  });
});

describe('durmió bien y entrena', () => {
  const d = de(entradas());

  it('viene como siempre, y no se inventa consejos de sueño', () => {
    expect(d.titular).toEqual({ que: 'comoSiempre' });
    expect(d.sueno).toBe('bien');
    expect(d.consejos).toEqual([]);
  });

  it('dice qué comer antes y adelanta lo de después, con las líneas de la comida', () => {
    expect(d.pasos.map((p) => [p.cuando, p.linea.comida, p.linea.clase])).toEqual([['antes', 'merienda', 'previaLiviana'], ['despues', 'cena', 'despues']]);
    const [previa, despues] = d.pasos;
    expect(previa.linea).toMatchObject({ proteina: 25, carbohidratos: 75 });
    expect(despues.linea.proteina).toBe(40);
  });

  it('con una descarga detrás puede rendir mejor; si hoy da para marca, lo dice', () => {
    const r = rendimiento(472, { descarga: { diasSinSeriesDuras: 3, seriesSemanaSobreMes: 0.5, intensidadMantenida: true, diasSinElEjercicio: 7 } });
    const mejor = de(entradas({ rendimiento: r, marca: 'Sentadilla' }));
    expect(mejor.titular).toEqual({ que: 'mejor' });
    expect(mejor.consejos).toEqual([{ que: 'marca', ejercicio: 'Sentadilla' }]);
  });
});

describe('ya entrenó', () => {
  const hecha: SesionDeHoy = { ...PIERNAS, hecha: true };

  it('le falta proteína: lo dice de a 5, sin pasarse, y qué comer en la cena', () => {
    const d = de(entradas({ sesion: hecha }, { ahora: 20 * 60 + 10, comido: { kcal: 1700, proteina: 88, carbohidratos: 240, grasas: 50 } }));
    expect(d.momento).toBe('despues');
    expect(d.titular).toEqual({ que: 'faltaProteina', gramos: 70 });
    expect(d.pasos.map((p) => [p.cuando, p.linea.comida, p.linea.proteina])).toEqual([['despues', 'cena', 40]]);
    expect(d.proteina).toEqual({ comido: 88, meta: 160, falta: 72 });
  });

  it('con la comida de antes cerca, sin apuro; sin comer desde hace rato, apenas pueda', () => {
    const cerca = de(entradas({ sesion: hecha }, { ahora: 20 * 60, anotado: { ...ANOTADO, merienda: { hora: 17 * 60 + 30, proteina: 25, kcal: 400 } } }));
    expect(cerca.pasos[0].linea.clase).toBe('despues');
    expect(cerca.consejos).toContainEqual({ que: 'sinApuro' });
    const lejos = de(entradas({ sesion: { ...hecha, inicio: 16 * 60 + 30 } }, { ahora: 18 * 60, horaDeComida: { desayuno: 8 * 60, almuerzo: 12 * 60, merienda: 19 * 60, cena: 21 * 60 }, anotado: { desayuno: ANOTADO.desayuno, almuerzo: { hora: 12 * 60, proteina: 33, kcal: 700 } } }));
    expect(lejos.pasos[0].linea.clase).toBe('despuesPronto');
    expect(lejos.consejos).not.toContainEqual({ que: 'sinApuro' });
  });

  it('con la cena anotada y 25 g o más por llegar, antes de dormir también cuenta', () => {
    const d = de(entradas({ sesion: hecha }, { ahora: 21 * 60 + 40, anotado: { ...ANOTADO, cena: { hora: 21 * 60, proteina: 40, kcal: 800 } }, comido: { kcal: 2300, proteina: 128, carbohidratos: 300, grasas: 60 } }));
    expect(d.pasos).toEqual([expect.objectContaining({ cuando: 'dormir', linea: expect.objectContaining({ clase: 'antesDeDormir', proteina: 30 }) })]);
  });

  it('llegó a la proteína: no pide nada', () => {
    const d = de(entradas({ sesion: hecha }, { ahora: 22 * 60, anotado: { ...ANOTADO, cena: { hora: 21 * 60, proteina: 60, kcal: 800 } }, comido: { kcal: 2700, proteina: 158, carbohidratos: 340, grasas: 70 } }));
    expect(d.titular).toEqual({ que: 'proteinaLista' });
    expect(d.pasos).toEqual([]);
  });

  it('sin nada anotado no dice cuánto falta: que no haya registro no quiere decir que no comió', () => {
    const d = de(entradas({ sesion: hecha }, { ahora: 20 * 60, anotado: {}, comido: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 } }));
    expect(d.titular).toEqual({ que: 'entrenoHecho' });
    expect(d.proteina).toBeNull();
    expect(d.faltan).toContain('comida');
  });
});

describe('descanso', () => {
  it('sin líneas de comida; si falta proteína, lo que más pesa es el total del día', () => {
    const d = de(entradas({ sesion: null, rendimiento: null }));
    expect(d.momento).toBe('descanso');
    expect(d.titular).toEqual({ que: 'descanso' });
    expect(d.pasos).toEqual([]);
    expect(d.consejos).toContainEqual({ que: 'totalDelDia', gramos: 95 });
  });

  it('si ya casi llegó, no lo menciona; y una noche corta no cambia lo que se come', () => {
    const casi = de(entradas({ sesion: null, rendimiento: null }, { comido: { kcal: 2200, proteina: 140, carbohidratos: 280, grasas: 60 } }));
    expect(casi.consejos).toEqual([]);
    const corta = de(entradas({ sesion: null, rendimiento: null, noche: { dormido: 350, necesidad: 480, siesta: false } }));
    expect(corta.consejos).toContainEqual({ que: 'noCompensar' });
    expect(corta.consejos).not.toContainEqual({ que: 'siesta' });
  });

  it('sin sesiones ni horario no dice que descansa: dice qué falta', () => {
    const d = de(entradas({ sesion: null, rendimiento: null, sabeCuandoEntrena: false }));
    expect(d.titular).toEqual({ que: 'sinHorario' });
    expect(d.faltan).toContain('sesion');
  });
});

describe('sin datos de sueño', () => {
  const d = de(entradas({ noche: null, ultimas3: [], rendimiento: rendimiento(null) }));

  it('no dice cómo puede rendir: dice qué falta', () => {
    expect(d.titular).toEqual({ que: 'faltaNoche' });
    expect(d.sueno).toBe('sinDatos');
    expect(d.faltan).toEqual(['sueno']);
  });

  it('lo de la comida no depende del sueño: sigue', () => {
    expect(d.pasos.map((p) => p.cuando)).toEqual(['antes', 'despues']);
    expect(d.consejos).toEqual([]);
  });

  it('un buen día para marca no se dice sin saber cómo durmió', () => {
    const conMarca = de(entradas({ noche: null, ultimas3: [], rendimiento: rendimiento(null), marca: 'Sentadilla' }));
    expect(conMarca.consejos).toEqual([]);
  });

  it('después de entrenar, la proteína se dice igual y avisa que falta la noche', () => {
    const despues = de(entradas({ noche: null, ultimas3: [], rendimiento: null, sesion: { ...PIERNAS, hecha: true } }, { ahora: 20 * 60 }));
    expect(despues.titular).toEqual({ que: 'faltaProteina', gramos: 95 });
    expect(despues.faltan).toEqual(['sueno']);
  });
});

// ------------------------------------------------------------ hoy, concéntrate en

type Recuperado = EntradasDelFoco['recuperado'];
const BIEN: Recuperado = { banda: 'bien', bandas: { sueno: 'bien', fatiga: 'muyBien', comida: 'muyBien' }, loQueMasFalta: 'sueno' };
const foco = (cambios: Partial<EntradasDelFoco> = {}, contexto: Partial<EntradasDelDiagnostico['contexto']> = {}) =>
  focoDeHoy({ ...entradas(cambios, contexto), recuperado: BIEN, ...cambios });
const que = (f: Foco[]) => f.map((x) => (x.que === 'entrenar' ? `entrenar:${x.como}` : x.que === 'comer' ? `comer:${x.cuando}` : x.que));

describe('hoy, concéntrate en', () => {
  it('durmió poco: lo de antes, sin ir al fallo y a la cama temprano, en el orden del día', () => {
    const f = foco({
      noche: { dormido: 350, necesidad: 480, siesta: false }, rendimiento: rendimiento(350),
      recuperado: { banda: 'bien', bandas: { sueno: 'aceptable', fatiga: 'muyBien', comida: 'muyBien' }, loQueMasFalta: 'sueno' },
    });
    expect(que(f)).toEqual(['comer:antes', 'entrenar:sinFallo', 'dormir']);
    expect(f.map((x) => x.hora)).toEqual([17 * 60 + 30, 18 * 60 + 40, 23 * 60 + 30]);
    expect(f[1]).toMatchObject({ porque: 'sueno' });
  });

  it('muy recuperado y cerca de una marca: buen día para intentarla, con lo de antes y lo de después', () => {
    const f = foco({ marca: 'sentadilla', recuperado: { banda: 'muyBien', bandas: { sueno: 'muyBien', fatiga: 'bien', comida: 'muyBien' }, loQueMasFalta: 'comida' } });
    expect(que(f)).toEqual(['comer:antes', 'entrenar:marca', 'comer:despues']);
    expect(f[1]).toMatchObject({ ejercicio: 'sentadilla', hora: 18 * 60 + 40 });
  });

  it('muy recuperado sin marca cerca: un poco más fuerte; con los músculos cargados, más suave', () => {
    const muyBien: Recuperado = { banda: 'muyBien', bandas: { sueno: 'muyBien', fatiga: 'bien', comida: 'muyBien' }, loQueMasFalta: 'comida' };
    expect(que(foco({ recuperado: muyBien }))).toContain('entrenar:masFuerte');
    const cargado = foco({ recuperado: { banda: 'aceptable', bandas: { sueno: 'muyBien', fatiga: 'atencion', comida: 'muyBien' }, loQueMasFalta: 'musculos' } });
    expect(cargado.find((x) => x.que === 'entrenar')).toMatchObject({ como: 'suave', porque: 'fatiga' });
  });

  it('«como siempre» solo si sobra lugar', () => {
    const f = foco();
    expect(que(f)).toEqual(['comer:antes', 'entrenar:comoSiempre', 'comer:despues']);
  });

  it('lo fuerte que termina a menos de 2 horas de dormir: terminar antes, con la hora', () => {
    const f = foco({ sesion: { inicio: 22 * 60, minutos: 60, tipo: 'fuerza', hecha: false } }, { ahora: 12 * 60 });
    expect(f.find((x) => x.que === 'terminar')).toEqual({ que: 'terminar', antesDe: 21 * 60 + 30, dormir: 23 * 60 + 30, hora: 22 * 60 });
    expect(TERMINAR_ANTES_DE_DORMIR).toBe(120);
    expect(foco().some((x) => x.que === 'terminar')).toBe(false);
  });

  it('sin la noche: primero, anotarla; y no dice cómo ir en el gimnasio', () => {
    const f = foco({ noche: null, ultimas3: [], rendimiento: null, recuperado: null });
    expect(que(f)[0]).toBe('faltaNoche');
    expect(que(f)).not.toContain('entrenar:comoSiempre');
  });

  it('descanso: lo dice, y si falta proteína, lo que más pesa es el total del día', () => {
    expect(foco({ sesion: null })).toEqual([{ que: 'descanso', hora: null }, { que: 'proteina', gramos: 95, hora: null }]);
  });

  it('con «sin déficit», nada', () => {
    expect(foco({}, { sinDeficit: true })).toEqual([]);
  });

  it('como mucho tres', () => {
    const f = foco({
      noche: { dormido: 350, necesidad: 480, siesta: false }, rendimiento: rendimiento(350), sesion: { inicio: 22 * 60, minutos: 60, tipo: 'fuerza', hecha: false },
      recuperado: { banda: 'aceptable', bandas: { sueno: 'atencion', fatiga: 'muyBien', comida: 'muyBien' }, loQueMasFalta: 'sueno' },
    }, { ahora: 12 * 60 });
    expect(f.length).toBe(MAXIMO_DEL_FOCO);
  });
});

describe('cómo ir en el gimnasio', () => {
  const r = (banda: 'atencion' | 'aceptable' | 'bien' | 'muyBien', sueno: 'atencion' | 'aceptable' | 'bien' | 'muyBien', fatiga: 'atencion' | 'aceptable' | 'bien' | 'muyBien') => ({ banda, bandas: { sueno, fatiga, comida: 'muyBien' as const }, loQueMasFalta: 'sueno' as const });
  it('marca, más fuerte, sin fallo, suave o como siempre, según la recuperación y la noche', () => {
    expect(comoEntrenar({ recuperado: r('muyBien', 'muyBien', 'bien'), sueno: 'bien', marca: 'sentadilla' })).toEqual({ como: 'marca', porque: null });
    expect(comoEntrenar({ recuperado: r('muyBien', 'muyBien', 'bien'), sueno: 'bien', marca: null })).toEqual({ como: 'masFuerte', porque: null });
    expect(comoEntrenar({ recuperado: r('bien', 'aceptable', 'muyBien'), sueno: 'corta', marca: null })).toEqual({ como: 'sinFallo', porque: 'sueno' });
    expect(comoEntrenar({ recuperado: r('aceptable', 'bien', 'atencion'), sueno: 'bien', marca: null })).toEqual({ como: 'suave', porque: 'fatiga' });
    expect(comoEntrenar({ recuperado: r('atencion', 'aceptable', 'aceptable'), sueno: 'algoCorta', marca: null })).toEqual({ como: 'suave', porque: 'total' });
    expect(comoEntrenar({ recuperado: r('bien', 'bien', 'bien'), sueno: 'bien', marca: null })).toEqual({ como: 'comoSiempre', porque: null });
  });
  it('con una marca cerca pero sin estar muy recuperado, no la propone', () => {
    expect(comoEntrenar({ recuperado: r('bien', 'bien', 'bien'), sueno: 'bien', marca: 'sentadilla' }).como).toBe('comoSiempre');
  });
});

describe('marcas', () => {
  const dia = (aplica: boolean, probabilidad: number, condiciones: Partial<CondicionesDeMarca> = {}) => ({
    aplica, probabilidad, distancia: 2, condiciones: { cerca: true, recuperado: true, sueno: true, sinPico: true, comida: true, ...condiciones },
  });
  it('las de buen día primero, y después de la más probable a la menos', () => {
    const lista = [{ ejercicio: 'prensa', dia: dia(false, 0.5) }, { ejercicio: 'sentadilla', dia: dia(true, 0.4) }, { ejercicio: 'curl', dia: dia(false, 0.1) }];
    expect(ordenarMarcas(lista).map((x) => x.ejercicio)).toEqual(['sentadilla', 'prensa', 'curl']);
  });
  it('el porqué de un «hoy no»: las condiciones que fallan, en su orden', () => {
    expect(queFalla(dia(false, 0.2, { sueno: false, cerca: false }).condiciones)).toEqual(['cerca', 'sueno']);
    expect(queFalla(dia(true, 0.4).condiciones)).toEqual([]);
  });
});
