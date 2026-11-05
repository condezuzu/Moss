// Los cuidados de salud (lo pediste el 5/11/2026: «si tienes algún problema lo marcas y, dependiendo de lo
// que tengas, se edita tu dieta»), para aprobar en la galería: la app sigue con el sí/no de «sin déficit».
// Cada condición cambia la meta y lo que Moss dice según su guía, y con varias gana la regla más cuidadosa.
// La línea que no se cruza: Moss vuelve a lo que las guías recomiendan para toda la población y apaga lo que
// va más allá (el déficit, la proteína alta, keto, los avisos de comer más o de tomar más agua); nunca da
// dosis, dietas terapéuticas ni promesas de tratar algo, y nunca deduce una condición que no se marcó. Las
// guías de cada una, las que quedan afuera y lo que falta decidir, en spec/nutricion.md («Cuidados de
// salud»). Lo marcado queda solo en el teléfono: a la cuenta va lo que se deriva (loQueSube).

import type { Clase } from './alrededorDelEntreno';
import { controlSemanal, type Control, type EntradaDelControl } from './control';
import { actividadEquivalente, ajusteDeRecomposicion, gastoEstimado, objetivoGuardado, pctDelPlan, proteinaDelNivel, type MetaDelCuestionario, type ObjetivoDicho, type Respuestas } from './cuestionario';
import { diasEntre, sumarDias, type ClaveDia } from './fechas';
import type { QueConviene } from './loQueConviene';
import type { QueFalta } from './loQueFalta';
import { ajusteDiario, KCAL_POR_KG, macrosConProteina, MAYORIA_DE_EDAD, pisoDe, PROTEINA_POR_KG, RITMOS, ritmoPermitido, type Actividad, type Cuestionario, type EstadoDeMacro, type Estilo, type Macros, type Objetivo, type Ritmo, type Sexo } from './metas';
import { referenciaDe, TOPE_DE_CAFEINA_EN_ETAPA, type Etapa, type Micro, type ParaQuien, type Referencia } from './micronutrientes';
import type { ConsejoDeHoy } from './paraHoy';
import type { Dieta } from './plan';

// ------------------------------------------------------------ lo que se marca
export type Cuidado =
  | 'embarazo' | 'lactancia' | 'diabetes2' | 'diabetes1' | 'presion' | 'colesterol'
  | 'renal' | 'calculos' | 'reflujo' | 'celiaquia' | 'gota' | 'tca' | 'glp1' | 'otra';

/**
 * Cómo se muestran, agrupados. Entran las frecuentes cuya guía cambia algo que Moss calcula o dice (o que,
 * sin marcarlas, Moss haría algo que no conviene). Quedan afuera el hipotiroidismo, el SOP, el colon
 * irritable, la lactosa, la anemia, la osteoporosis, la cirugía bariátrica y las alergias (estas, en «Lo que
 * no comes»): cada una con su porqué en la spec.
 */
export type Grupo = 'etapa' | 'azucar' | 'corazon' | 'rinones' | 'digestion' | 'masCuidado';
export const GRUPOS: readonly { grupo: Grupo; cuidados: readonly Cuidado[] }[] = [
  { grupo: 'etapa', cuidados: ['embarazo', 'lactancia'] },
  { grupo: 'azucar', cuidados: ['diabetes2', 'diabetes1'] },
  { grupo: 'corazon', cuidados: ['presion', 'colesterol'] },
  { grupo: 'rinones', cuidados: ['renal', 'calculos'] },
  { grupo: 'digestion', cuidados: ['reflujo', 'celiaquia', 'gota'] },
  { grupo: 'masCuidado', cuidados: ['tca', 'glp1', 'otra'] },
];
export const CUIDADOS: readonly Cuidado[] = GRUPOS.flatMap((g) => g.cuidados);
/** El embarazo y la lactancia se preguntan solo a las mujeres, como hasta ahora. */
const SOLO_MUJERES: readonly Cuidado[] = ['embarazo', 'lactancia'];

/** Los grupos que se le muestran a cada sexo. */
export const gruposPara = (sexo: Sexo) =>
  GRUPOS.map((g) => ({ grupo: g.grupo, cuidados: g.cuidados.filter((c) => sexo === 'f' || !SOLO_MUJERES.includes(c)) })).filter((g) => g.cuidados.length > 0);

/** Lo que se pregunta además al marcar una, y lo único que se guarda de ella. */
export const PREGUNTA: Partial<Record<Cuidado, 'semana' | 'parto' | 'insulina' | 'dialisis'>> = { embarazo: 'semana', lactancia: 'parto', diabetes2: 'insulina', renal: 'dialisis' };

export type DatosDelCuidado = {
  /** La fecha probable de parto, el peso de antes del embarazo (null: no lo sabe) y si son gemelos o mellizos. */
  embarazo?: { fechaProbable: ClaveDia; pesoAntes: number | null; mellizos: boolean };
  /** Cuándo nació y si es solo pecho (con pecho y fórmula, la mitad del extra). */
  lactancia?: { parto: ClaveDia; soloPecho: boolean };
  /** Si usa insulina u otro remedio que puede bajarle mucho el azúcar (las sulfonilureas); null: no sabe, y va como sí. */
  diabetes2?: { bajaElAzucar: boolean | null };
  renal?: { dialisis: boolean };
};

export type PersonaDelCuidado = { sexo: Sexo; edad: number; alturaCm: number; pesoKg: number; actividad: Actividad; dieta?: Dieta };

// ------------------------------------------------------------ lo que cambia
/**
 * Lo que Moss dice y un cuidado puede apagar o prender. En la app: lo de comer antes y después de entrenar
 * (loQueConviene y las líneas de alrededorDelEntreno), entrenar en ayunas, lo de comer según el deporte
 * (segunElDeporte y el diagnóstico de Ascent), la noche corta, el reparto de «Para hoy», lo que falta de
 * proteína o de calorías, el agua, la barra que tiembla al pasarse, pesarse, la última comida y, nuevos y a
 * decidir (D13), la sal y las saturadas de «Para hoy».
 */
export const LO_QUE_DICE = ['antesDeEntrenar', 'despuesDeEntrenar', 'ayunasLarga', 'deporte', 'nocheCorta', 'reparto', 'faltaProteina', 'faltaCalorias', 'agua', 'pasado', 'pesarse', 'ultimaComida', 'sal', 'saturadas'] as const;
export type LoQueDice = (typeof LO_QUE_DICE)[number];

/** Lo que Moss pone a la vista en lo que se anota y se busca. La listeria y el mercurio van por una lista curada de alimentos (la base no los tiene). */
export type Marca = 'alcohol' | 'cafeina' | 'listeria' | 'mercurio' | 'azucaradas' | 'sodio' | 'potasio' | 'saturadas' | 'colesterol' | 'fibra' | 'carbohidratos' | 'proteina' | 'gluten';

/** Lo más rápido que se puede bajar: 'ninguno' es sin déficit, y 'rapido', sin tope. */
export type RitmoMaximo = 'ninguno' | Ritmo;
const ORDEN_DEL_RITMO: readonly RitmoMaximo[] = ['ninguno', 'suave', 'recomendado', 'rapido'];
/** El control de cada semana: como siempre, sin bajar nunca la meta, o en pausa (no corre). */
export type ControlDelCuidado = 'normal' | 'nuncaBaja' | 'pausa';
const ORDEN_DEL_CONTROL: readonly ControlDelCuidado[] = ['normal', 'nuncaBaja', 'pausa'];
/** Sugerido: Moss lo dice. Necesario: lo dice y no calcula sola lo que es del equipo. */
export type Profesional = 'sugerido' | 'necesario';

export type Reglas = {
  /** Los que cuentan, en el orden de la lista: sin el embarazo ni la lactancia si el sexo no es «f». */
  cuidados: Cuidado[];
  ritmoMaximo: RitmoMaximo;
  /** Desde cuándo vale ese ritmo (la lactancia, desde la sexta semana); antes, sin déficit. */
  deficitDesde: ClaveDia | null;
  /** Si se puede proponer comer de más: en el embarazo, lo que hace falta ya lo suma el extra. */
  subir: boolean;
  /** Las kcal mínimas, si son más que el piso de siempre. */
  piso: number | null;
  /** Lo que se suma al gasto: el embarazo (NASEM 2023) o la lactancia. */
  extraKcal: number;
  control: ControlDelCuidado;
  /**
   * La proteína en g por kilo: fija (el riñón) o entre un mínimo y un máximo, y el máximo le gana al mínimo.
   * `minimoHasta`: con obesidad, el mínimo no pasa de esos gramos (el peso real lo sobreestima).
   */
  proteina: { fija: number | null; min: number | null; max: number | null; minimoHasta: number | null };
  estilosSin: Estilo[];
  /** El sodio, en mg por día como mucho. */
  sodioMax: number | null;
  /** El potasio, en mg por día como meta, o sin meta (con el riñón es de cada uno). */
  potasio: number | 'sinMeta' | null;
  /** Las grasas saturadas como parte de las kcal (0,07 es el 7 %). */
  saturadasMax: number | null;
  colesterolMax: number | null;
  /** La fibra en g por día, si no es la de siempre (14 g cada 1.000 kcal). */
  fibra: readonly [number, number] | null;
  /** El agua en ml por día; 'noPedir': Moss no la pide (la decide el equipo); null: la de siempre. */
  agua: number | 'noPedir' | null;
  cafeinaTope: number | null;
  /** El alcohol en g por día como mucho (0 es nada); null: sin tope propio. */
  alcoholTope: number | null;
  etapa: Etapa | null;
  /** Los micronutrientes que van primero, y los que se muestran sin referencia. */
  mirar: Micro[];
  sinReferencia: Micro[];
  marcar: Marca[];
  apagar: LoQueDice[];
  /** Lo que se prende de fábrica; nunca algo que otra condición apaga. */
  prender: LoQueDice[];
  /** De fábrica sin calorías ni gramos (con un trastorno de la alimentación). */
  numerosOcultos: boolean;
  /** Si hay peso meta y plan: con un trastorno de la alimentación no, y en el embarazo va «Tu embarazo». */
  pesoMeta: boolean;
  /** Moss no calcula y las metas van a mano, las del equipo: con diálisis o embarazada antes de los 18. */
  manuales: boolean;
  /** La grasa corporal se pregunta solo sin cuidados (las figuras no le hacen bien a quien cuida lo que come). */
  grasa: boolean;
  profesional: Profesional | null;
};

type Parte = Partial<Omit<Reglas, 'cuidados' | 'proteina' | 'grasa'>> & { proteina?: Partial<Reglas['proteina']>; profesional: Profesional };

const LO_DE_ENTRENAR: readonly LoQueDice[] = ['antesDeEntrenar', 'despuesDeEntrenar', 'ayunasLarga', 'deporte'];
const LO_QUE_FALTA: readonly LoQueDice[] = ['reparto', 'faltaProteina', 'faltaCalorias'];
/** Lo que hoy apaga «sin déficit». */
const COMO_HOY: readonly LoQueDice[] = [...LO_DE_ENTRENAR, 'nocheCorta', ...LO_QUE_FALTA, 'ultimaComida'];
/** El embarazo y las primeras semanas de la lactancia: lo de hoy, más el «pasado» y pesarse; la última comida queda libre. */
const DE_LA_ETAPA: readonly LoQueDice[] = [...LO_DE_ENTRENAR, 'nocheCorta', ...LO_QUE_FALTA, 'pasado', 'pesarse'];

/** La proteína de mantener, sin la «más alta»: la del embarazo, la lactancia y un trastorno de la alimentación. */
const PROTEINA_DE_MANTENER = 1.6;

const aDiez = (n: number) => Math.round(n / 10) * 10;

// ------------------------------------------------------------ el embarazo
const DIAS_DE_EMBARAZO = 280;
/** Desde la semana 14, el segundo trimestre: antes, NASEM no suma nada. */
const SEGUNDO_TRIMESTRE = 14;
const PRIMER_TRIMESTRE: readonly [number, number] = [0.5, 2];
const TERMINO = 40;
const TERMINO_CON_MELLIZOS = 37;

/** Las semanas cumplidas a hoy, con la fecha probable de parto. */
export const semanaDeEmbarazo = (fechaProbable: ClaveDia, hoy: ClaveDia) => Math.max(0, Math.floor((DIAS_DE_EMBARAZO - diasEntre(hoy, fechaProbable)) / 7));
/** La fecha probable para alguien que dice de cuántas semanas está. */
export const fechaProbableDe = (semana: number, hoy: ClaveDia) => sumarDias(hoy, DIAS_DE_EMBARAZO - semana * 7);
/** A las dos semanas de la fecha probable, Moss pregunta si ya nació (para pasar a la lactancia o a nada). */
export const preguntarSiNacio = (fechaProbable: ClaveDia, hoy: ClaveDia) => diasEntre(fechaProbable, hoy) >= 14;

export const imcDe = (pesoKg: number, alturaCm: number) => pesoKg / (alturaCm / 100) ** 2;

/**
 * NASEM 2023 (tabla 5-5), el gasto de una mujer adulta: [la constante, por cm, por kg] de cada nivel; la edad
 * resta 2,04 por año en el embarazo y 7,01 sin él, y el embarazo suma 9,16 por semana. Los niveles de Moss
 * van a sus categorías de actividad, de menos a más.
 */
const NASEM_EMBARAZO: Record<Actividad, readonly [number, number, number]> = { poco: [1131.2, 0.34, 12.15], algo: [693.35, 5.73, 10.2], activo: [-223.84, 13.23, 8.15], muy: [-779.72, 18.45, 8.73] };
const NASEM_SIN_EMBARAZO: Record<Actividad, readonly [number, number, number]> = { poco: [584.9, 5.72, 11.71], algo: [575.77, 6.6, 12.14], activo: [710.25, 6.54, 12.34], muy: [511.83, 9.07, 12.56] };
/** Lo que se deposita en el tejido nuevo, según el IMC de antes. */
const depositoDelEmbarazo = (imcAntes: number) => (imcAntes < 18.5 ? 300 : imcAntes < 25 ? 200 : imcAntes < 30 ? 150 : -50);

/**
 * Lo que suma el embarazo a lo que se gasta, en kcal por día (NASEM 2023): en el primer trimestre, nada; desde
 * el segundo, el gasto del embarazo (con el peso de hoy y la semana) más el depósito, menos el de antes (con
 * el peso de antes). De a 10 y nunca menos de cero: con obesidad el depósito resta, pero Moss no propone bajar.
 */
export function extraDelEmbarazo(p: { edad: number; alturaCm: number; pesoKg: number; pesoAntes: number; semana: number; actividad: Actividad }): number {
  if (p.semana < SEGUNDO_TRIMESTRE) return 0;
  const [a, porCm, porKg] = NASEM_EMBARAZO[p.actividad];
  const embarazada = a - 2.04 * p.edad + porCm * p.alturaCm + porKg * p.pesoKg + 9.16 * p.semana;
  const [a0, porCm0, porKg0] = NASEM_SIN_EMBARAZO[p.actividad];
  const antes = a0 - 7.01 * p.edad + porCm0 * p.alturaCm + porKg0 * p.pesoAntes;
  return Math.max(0, aDiez(embarazada + depositoDelEmbarazo(imcDe(p.pesoAntes, p.alturaCm)) - antes));
}

/** IOM 2009: el aumento total según el IMC de antes y, con gemelos o mellizos, el provisorio (sin uno para bajo peso). */
const AUMENTO: readonly { hasta: number; total: readonly [number, number]; mellizos: readonly [number, number] | null }[] = [
  { hasta: 18.5, total: [12.5, 18], mellizos: null },
  { hasta: 25, total: [11.5, 16], mellizos: [17, 25] },
  { hasta: 30, total: [7, 11.5], mellizos: [14, 23] },
  { hasta: Infinity, total: [5, 9], mellizos: [11, 19] },
];

/**
 * Entre cuántos kilos de aumento sobre el peso de antes, para dibujar la banda sin juicios (IOM 2009): en el
 * primer trimestre, de 0,5 a 2; después, en línea recta hasta el total de la semana 40, que queda hasta el
 * parto. Los ritmos por semana del IOM (de 0,35 a 0,50 kg con un IMC normal) no suman sus propios totales:
 * así la banda no salta al llegar a término. Con gemelos o mellizos solo hay un total provisorio al término:
 * antes, null, y no se dibuja.
 */
export function rangoDelEmbarazo(imcAntes: number, semana: number, mellizos: boolean): [number, number] | null {
  const fila = AUMENTO.find((f) => imcAntes < f.hasta)!;
  if (mellizos) return fila.mellizos && semana >= TERMINO_CON_MELLIZOS ? [fila.mellizos[0], fila.mellizos[1]] : null;
  if (semana <= SEGUNDO_TRIMESTRE - 1) return [PRIMER_TRIMESTRE[0], PRIMER_TRIMESTRE[1]];
  const k = Math.min(1, (semana - (SEGUNDO_TRIMESTRE - 1)) / (TERMINO - (SEGUNDO_TRIMESTRE - 1)));
  const entre = (i: 0 | 1) => Math.round((PRIMER_TRIMESTRE[i] + k * (fila.total[i] - PRIMER_TRIMESTRE[i])) * 10) / 10;
  return [entre(0), entre(1)];
}

// ------------------------------------------------------------ la lactancia
/** Sin déficit las primeras seis semanas (el IOM no recomienda hacer dieta las primeras 2 o 3; Lovelady empezó en la 4). */
const SIN_DEFICIT_TRAS_EL_PARTO = 42;
const DIAS_POR_MES = 30.44;
/** Piso de 1.800 kcal bajando (IOM 1991: nunca menos de 1.500). */
const PISO_DE_LA_LACTANCIA = 1800;
/** NASEM 2023: unas 400 kcal de 0 a 6 meses y 380 de 7 a 12, que ya descuentan lo que se baja solo. */
export function extraDeLaLactancia(parto: ClaveDia, hoy: ClaveDia, soloPecho: boolean): number {
  const extra = diasEntre(parto, hoy) / DIAS_POR_MES < 6 ? 400 : 380;
  return soloPecho ? extra : extra / 2;
}
export const semanasDesdeElParto = (parto: ClaveDia, hoy: ClaveDia) => Math.max(0, Math.floor(diasEntre(parto, hoy) / 7));
/** El IOM (1991): no más de 0,5 g de alcohol por kilo y por día. */
const ALCOHOL_EN_LA_LACTANCIA = 0.5;

// ------------------------------------------------------------ cada una
function parteDe(c: Cuidado, d: DatosDelCuidado, p: PersonaDelCuidado, hoy: ClaveDia): Parte {
  switch (c) {
    case 'embarazo': {
      // IOM 2009, NASEM 2023; el alcohol, ninguno (CDC); la cafeína, 200 mg; listeria (CDC) y mercurio (FDA y EPA).
      const e = d.embarazo;
      const menor = p.edad < MAYORIA_DE_EDAD;
      const extraKcal = e && !menor ? extraDelEmbarazo({ ...p, pesoAntes: e.pesoAntes ?? p.pesoKg, semana: semanaDeEmbarazo(e.fechaProbable, hoy) }) : 0;
      return {
        ritmoMaximo: 'ninguno', subir: false, extraKcal, control: 'pausa', proteina: { max: PROTEINA_DE_MANTENER }, estilosSin: ['keto'],
        cafeinaTope: TOPE_DE_CAFEINA_EN_ETAPA, alcoholTope: 0, etapa: 'embarazo', mirar: ['folato', 'hierro', 'cafeina'],
        marcar: ['alcohol', 'cafeina', 'listeria', 'mercurio'], apagar: [...DE_LA_ETAPA], pesoMeta: false, manuales: menor, profesional: 'necesario',
      };
    }
    case 'lactancia': {
      // NASEM 2023, IOM 1991, Lovelady 2000 (ECA, n = 40), CDC.
      const l = d.lactancia;
      const todavia = !l || diasEntre(l.parto, hoy) < SIN_DEFICIT_TRAS_EL_PARTO;
      return {
        ritmoMaximo: todavia ? 'ninguno' : 'suave', ...(l ? { deficitDesde: sumarDias(l.parto, SIN_DEFICIT_TRAS_EL_PARTO) } : {}), piso: PISO_DE_LA_LACTANCIA,
        extraKcal: l ? extraDeLaLactancia(l.parto, hoy, l.soloPecho) : 400, proteina: { max: PROTEINA_DE_MANTENER }, estilosSin: ['keto'],
        cafeinaTope: TOPE_DE_CAFEINA_EN_ETAPA, alcoholTope: Math.round(ALCOHOL_EN_LA_LACTANCIA * p.pesoKg), etapa: 'lactancia',
        mirar: p.dieta === 'vegana' ? ['vitaminaB12'] : [], marcar: ['alcohol', 'cafeina', 'mercurio'], apagar: todavia ? [...DE_LA_ETAPA] : [], profesional: 'sugerido',
      };
    }
    case 'diabetes2': {
      // ADA 2026: bajar al menos un 5 a 7 % (3.3 y 5.12, A); sodio < 2.300 (5.20); con insulina o sulfonilureas,
      // más despacio y sin keto (D5: «no sé» va como «sí»).
      const baja = d.diabetes2?.bajaElAzucar !== false;
      return {
        ritmoMaximo: baja ? 'recomendado' : 'rapido', estilosSin: baja ? ['keto'] : [], sodioMax: 2300,
        marcar: ['azucaradas', 'sodio', 'saturadas', 'alcohol'], profesional: baja ? 'necesario' : 'sugerido',
      };
    }
    case 'diabetes1':
      // ADA 2026 (5.26 a 5.28): sin keto; lo de comer al entrenar va con el plan de insulina. Moss nunca calcula insulina.
      return { ritmoMaximo: 'suave', estilosSin: ['keto'], marcar: ['carbohidratos', 'alcohol'], apagar: [...LO_DE_ENTRENAR], profesional: 'necesario' };
    case 'presion':
      // OMS: sodio < 2.000 mg y potasio ≥ 3.510 mg (salvo con el riñón); AHA/ACC 2025, según los editores de Hypertension.
      return { sodioMax: 2000, potasio: 3510, mirar: ['potasio'], marcar: ['sodio', 'potasio', 'alcohol'], prender: ['sal'], profesional: 'sugerido' };
    case 'colesterol':
      // ESC/EAS 2019: saturadas < 7 % con colesterol alto, colesterol < 300 mg y de 25 a 40 g de fibra. Las trans
      // no van como meta: la base las tiene en el 24 %.
      return { saturadasMax: 0.07, colesterolMax: 300, fibra: [25, 40], marcar: ['saturadas', 'colesterol', 'fibra', 'alcohol'], prender: ['saturadas'], profesional: 'sugerido' };
    case 'renal':
      // KDIGO 2024: 0,8 g/kg (3.3.1.1, 2C), nunca más de 1,3; sodio < 2 g (3.3.2.1); el potasio y el fósforo, sin
      // meta (3.11.5). Bajar, con su equipo. Con diálisis (KDOQI 2020, que no se pudo leer), metas a mano.
      return {
        ritmoMaximo: 'ninguno', proteina: { fija: 0.8, max: 1.3 }, estilosSin: ['keto'], sodioMax: 2000, potasio: 'sinMeta', agua: 'noPedir',
        sinReferencia: ['potasio', 'fosforo'], marcar: ['proteina', 'sodio'], apagar: [...LO_DE_ENTRENAR, ...LO_QUE_FALTA, 'agua'],
        manuales: !!d.renal?.dialisis, profesional: 'necesario',
      };
    case 'calculos':
      // EAU 2026 (tabla 4.5): de 2,5 a 3 L de agua, sal de 4 a 5 g, calcio normal y proteína animal de 0,8 a 1;
      // la base no separa la animal: la total, 1 g/kg como mucho (D8).
      return {
        proteina: { max: 1 }, sodioMax: 2000, agua: 2500, mirar: ['calcio'], marcar: ['sodio', 'proteina'],
        apagar: ['faltaProteina'], prender: ['agua'], profesional: 'sugerido',
      };
    case 'reflujo':
      // ACG 2022: terminar de comer 2 a 3 h antes de acostarse (condicional, baja); bajar de peso con sobrepeso.
      return { prender: ['ultimaComida'], profesional: 'sugerido' };
    case 'celiaquia':
      // ACG 2013: sin gluten de por vida y la avena con cautela (el plan ya cuenta la avena como gluten).
      return { mirar: ['hierro', 'folato', 'vitaminaD', 'vitaminaB12'], marcar: ['gluten'], profesional: 'necesario' };
    case 'gota':
      // ACR 2020: limitar el alcohol y el jarabe de maíz; las purinas no están en la base.
      return { marcar: ['alcohol', 'azucaradas'], profesional: 'sugerido' };
    case 'tca':
      // Levinson 2017, Simpson 2017, Anderberg 2025: contar puede hacer daño. Sin déficit, el control que no baja,
      // los números ocultos, sin «pasado», sin pesarse y sin peso meta (D9).
      return {
        ritmoMaximo: 'ninguno', control: 'nuncaBaja', proteina: { max: PROTEINA_DE_MANTENER }, estilosSin: ['keto'],
        apagar: [...COMO_HOY, 'pasado', 'pesarse'], numerosOcultos: true, pesoMeta: false, profesional: 'necesario',
      };
    case 'glp1': {
      // La guía conjunta de 2025 (ACLM, ASN, OMA y TOS): proteína de 1,2 g/kg sobre el peso real y, con obesidad,
      // hasta 120 g (D10); los micronutrientes que quedan cortos comiendo poco, y un piso de 1.800 en hombres.
      const conObesidad = imcDe(p.pesoKg, p.alturaCm) >= 30;
      return {
        ...(p.sexo === 'm' ? { piso: 1800 } : {}), proteina: { min: 1.2, ...(conObesidad ? { minimoHasta: 120 } : {}) },
        mirar: ['hierro', 'calcio', 'magnesio', 'zinc', 'vitaminaA', 'vitaminaD', 'vitaminaE', 'vitaminaK', 'tiamina', 'vitaminaB12', 'vitaminaC'],
        prender: ['faltaProteina', 'faltaCalorias'], profesional: 'necesario',
      };
    }
    case 'otra':
      // Lo de hoy, más seguro: la proteína debajo del 1,3 de KDIGO (por si fuera el riñón) y sin pedir agua (D11).
      return {
        ritmoMaximo: 'ninguno', control: 'nuncaBaja', proteina: { max: 1.2 }, estilosSin: ['keto'], agua: 'noPedir',
        apagar: [...COMO_HOY, 'agua'], profesional: 'necesario',
      };
  }
}

// ------------------------------------------------------------ varias a la vez: la más cuidadosa
const sinCuidados = (): Reglas => ({
  cuidados: [], ritmoMaximo: 'rapido', deficitDesde: null, subir: true, piso: null, extraKcal: 0, control: 'normal',
  proteina: { fija: null, min: null, max: null, minimoHasta: null }, estilosSin: [], sodioMax: null, potasio: null, saturadasMax: null,
  colesterolMax: null, fibra: null, agua: null, cafeinaTope: null, alcoholTope: null, etapa: null, mirar: [], sinReferencia: [], marcar: [],
  apagar: [], prender: [], numerosOcultos: false, pesoMeta: true, manuales: false, grasa: true, profesional: null,
});

const menor = (a: number | null, b: number | null | undefined) => (b == null ? a : a == null ? b : Math.min(a, b));
const mayor = (a: number | null, b: number | null | undefined) => (b == null ? a : a == null ? b : Math.max(a, b));
const sumarSinRepetir = <T>(a: T[], b: readonly T[] | undefined) => { for (const x of b ?? []) if (!a.includes(x)) a.push(x); };

function sumar(r: Reglas, x: Parte): void {
  if (x.ritmoMaximo && ORDEN_DEL_RITMO.indexOf(x.ritmoMaximo) < ORDEN_DEL_RITMO.indexOf(r.ritmoMaximo)) r.ritmoMaximo = x.ritmoMaximo;
  if (x.deficitDesde && (!r.deficitDesde || x.deficitDesde > r.deficitDesde)) r.deficitDesde = x.deficitDesde;
  if (x.subir === false) r.subir = false;
  r.piso = mayor(r.piso, x.piso);
  r.extraKcal = Math.max(r.extraKcal, x.extraKcal ?? 0);
  if (x.control && ORDEN_DEL_CONTROL.indexOf(x.control) > ORDEN_DEL_CONTROL.indexOf(r.control)) r.control = x.control;
  r.proteina = {
    fija: menor(r.proteina.fija, x.proteina?.fija),
    min: mayor(r.proteina.min, x.proteina?.min),
    max: menor(r.proteina.max, x.proteina?.max),
    minimoHasta: menor(r.proteina.minimoHasta, x.proteina?.minimoHasta),
  };
  sumarSinRepetir(r.estilosSin, x.estilosSin);
  r.sodioMax = menor(r.sodioMax, x.sodioMax);
  // Sin meta (el riñón) le gana a una meta (la presión): la sal con potasio no se sugiere con enfermedad renal.
  if (x.potasio !== undefined) r.potasio = x.potasio === 'sinMeta' || r.potasio === 'sinMeta' ? 'sinMeta' : mayor(r.potasio, x.potasio);
  r.saturadasMax = menor(r.saturadasMax, x.saturadasMax);
  r.colesterolMax = menor(r.colesterolMax, x.colesterolMax);
  if (x.fibra) r.fibra = r.fibra ? [Math.max(r.fibra[0], x.fibra[0]), Math.max(r.fibra[1], x.fibra[1])] : x.fibra;
  // No pedirla (la decide el equipo) le gana a una meta alta: con riñón y cálculos, el agua es del equipo.
  if (x.agua !== undefined) r.agua = x.agua === 'noPedir' || r.agua === 'noPedir' ? 'noPedir' : mayor(r.agua, x.agua);
  r.cafeinaTope = menor(r.cafeinaTope, x.cafeinaTope);
  r.alcoholTope = menor(r.alcoholTope, x.alcoholTope);
  // Embarazada y amamantando a la vez, van las referencias del embarazo (el folato y el hierro).
  if (x.etapa && r.etapa !== 'embarazo') r.etapa = x.etapa;
  sumarSinRepetir(r.mirar, x.mirar);
  sumarSinRepetir(r.sinReferencia, x.sinReferencia);
  sumarSinRepetir(r.marcar, x.marcar);
  sumarSinRepetir(r.apagar, x.apagar);
  sumarSinRepetir(r.prender, x.prender);
  if (x.numerosOcultos) r.numerosOcultos = true;
  if (x.pesoMeta === false) r.pesoMeta = false;
  if (x.manuales) r.manuales = true;
  if (x.profesional === 'necesario' || !r.profesional) r.profesional = x.profesional;
}

/** Las reglas de lo marcado, para una persona y un día. Sin nada marcado, las de siempre. */
export function reglasDe(marcados: Iterable<Cuidado>, datos: DatosDelCuidado, p: PersonaDelCuidado, hoy: ClaveDia): Reglas {
  const elegidos = new Set(marcados);
  const r = sinCuidados();
  r.cuidados = CUIDADOS.filter((c) => elegidos.has(c) && (p.sexo === 'f' || !SOLO_MUJERES.includes(c)));
  for (const c of r.cuidados) sumar(r, parteDe(c, datos, p, hoy));
  r.prender = r.prender.filter((x) => !r.apagar.includes(x));
  r.grasa = r.cuidados.length === 0;
  return r;
}

/** Sin déficit: lo que hoy guarda la cuenta (`sin_deficit`). */
export const sinDeficitDe = (r: Pick<Reglas, 'ritmoMaximo'>) => r.ritmoMaximo === 'ninguno';

/**
 * Lo único que sube a la cuenta: lo que se deriva, sin nombrar la condición. `sin_deficit` ya existe; el
 * control en pausa (para que otro teléfono no corra el control del embarazo) pide una migración (D44).
 */
export const loQueSube = (r: Reglas) => ({ sinDeficit: sinDeficitDe(r), controlEnPausa: r.control === 'pausa' });

// ------------------------------------------------------------ la meta
/** Bajar sin déficit queda en mantener; subir, en el embarazo, también (el extra ya suma lo que hace falta). */
export function objetivoConCuidados<T extends ObjetivoDicho>(objetivo: T, r: Pick<Reglas, 'ritmoMaximo' | 'subir'>): T | 'mantener' {
  if ((objetivo === 'bajar' || objetivo === 'recomponer') && sinDeficitDe(r)) return 'mantener';
  return objetivo === 'subir' && !r.subir ? 'mantener' : objetivo;
}

/** El ritmo para bajar, hasta el que permite lo marcado. */
export function ritmoConCuidados(ritmo: Ritmo, objetivo: Objetivo, r: Pick<Reglas, 'ritmoMaximo'>): Ritmo {
  if (objetivo !== 'bajar' || r.ritmoMaximo === 'ninguno') return ritmo;
  return ORDEN_DEL_RITMO.indexOf(ritmo) > ORDEN_DEL_RITMO.indexOf(r.ritmoMaximo) ? r.ritmoMaximo : ritmo;
}

export const pisoConCuidados = (sexo: Sexo, r: Pick<Reglas, 'piso'>) => Math.max(pisoDe(sexo), r.piso ?? 0);
export const estiloConCuidados = (estilo: Estilo, r: Pick<Reglas, 'estilosSin'>): Estilo => (r.estilosSin.includes(estilo) ? 'equilibrada' : estilo);

/** Los gramos de proteína con lo marcado: la fija, o entre el mínimo y el máximo, y el máximo gana (el riñón le gana al GLP-1). */
export function proteinaConCuidados(gramos: number, pesoKg: number, r: Pick<Reglas, 'proteina'>): number {
  const { fija, min, max, minimoHasta } = r.proteina;
  const tope = max === null ? Infinity : max * pesoKg;
  if (fija !== null) return Math.min(fija * pesoKg, tope);
  const piso = min === null ? 0 : Math.min(min * pesoKg, minimoHasta ?? Infinity);
  return Math.min(tope, Math.max(piso, gramos));
}

/**
 * La meta para un gasto con lo marcado, como metaPara (metas.ts): sin cuidados da lo mismo. Con diálisis o
 * embarazada antes de los 18, null: las metas van a mano.
 */
export function metaConCuidados(gasto: number, c: Pick<Cuestionario, 'edad' | 'sexo' | 'pesoKg' | 'objetivo' | 'ritmo'>, estilo: Estilo, r: Reglas): Macros | null {
  if (r.manuales) return null;
  const objetivo = objetivoConCuidados(c.objetivo, r);
  const ritmo = ritmoConCuidados(ritmoPermitido({ ...c, objetivo }), objetivo, r);
  const kcal = Math.max(pisoConCuidados(c.sexo, r), aDiez(gasto + r.extraKcal + ajusteDiario(objetivo, ritmo, c.pesoKg)));
  return macrosConProteina(kcal, c.pesoKg, proteinaConCuidados(c.pesoKg * PROTEINA_POR_KG[objetivo], c.pesoKg, r), estiloConCuidados(estilo, r));
}

/** La meta del cuestionario nuevo con lo marcado, como metaDelCuestionario (cuestionario.ts): sin cuidados da lo mismo. */
export function metaDelCuestionarioConCuidados(resp: Respuestas, r: Reglas): MetaDelCuestionario | null {
  if (r.manuales) return null;
  const persona = { ...resp, sinDeficit: false, grasa: r.grasa ? resp.grasa : null };
  const gasto = gastoEstimado(persona);
  const usado = objetivoConCuidados(resp.objetivo, r);
  const objetivo = objetivoGuardado(usado);
  const ritmo = ritmoConCuidados(ritmoPermitido({ edad: resp.edad, objetivo, ritmo: resp.ritmo }), objetivo, r);
  let pct = pctDelPlan({ ...persona, objetivo: usado });
  // Una fecha tampoco pide más que el ritmo que permite lo marcado.
  if (pct !== null && objetivo === 'bajar' && (r.ritmoMaximo === 'suave' || r.ritmoMaximo === 'recomendado')) pct = Math.min(pct, Math.abs(RITMOS.bajar[r.ritmoMaximo]));
  let ajuste = 0;
  if (usado === 'recomponer') ajuste = ajusteDeRecomposicion(persona);
  else if (pct !== null) ajuste = ((objetivo === 'bajar' ? -1 : 1) * (pct / 100) * resp.pesoKg * KCAL_POR_KG) / 7;
  else ajuste = ajusteDiario(objetivo, ritmo, resp.pesoKg);
  const kcal = Math.max(pisoConCuidados(resp.sexo, r), aDiez(gasto.total + r.extraKcal + ajuste));
  const proteina = proteinaConCuidados(proteinaDelNivel({ ...persona, objetivo: usado }), resp.pesoKg, r);
  return {
    gasto,
    metas: macrosConProteina(kcal, resp.pesoKg, proteina, estiloConCuidados(resp.estilo ?? 'equilibrada', r)),
    objetivo,
    recomponer: usado === 'recomponer',
    actividad: actividadEquivalente(gasto),
  };
}

/**
 * El control de cada semana con lo marcado: en pausa no corre (null: ninguna meta nueva), y si no baja,
 * la meta nunca baja. Mide igual que siempre (control.ts) y arma la meta con lo marcado.
 */
export function controlConCuidados(e: EntradaDelControl, r: Reglas): Control | null {
  if (!r.cuidados.length) return controlSemanal(e);
  if (r.control === 'pausa' || r.manuales) return null;
  const c = controlSemanal({ ...e, perfil: { ...e.perfil, sinDeficit: false } });
  if (c.motivo !== 'control' || c.datos.pesoDeTendencia === null) return c;
  const estilo = e.estilo ?? 'equilibrada';
  const persona = { ...e.perfil, pesoKg: c.datos.pesoDeTendencia };
  let metas = metaConCuidados(c.gasto, persona, estilo, r)!;
  if (r.control === 'nuncaBaja' && metas.kcal < e.metasAnteriores.kcal) {
    const objetivo = objetivoConCuidados(persona.objetivo, r);
    metas = macrosConProteina(e.metasAnteriores.kcal, persona.pesoKg, proteinaConCuidados(persona.pesoKg * PROTEINA_POR_KG[objetivo], persona.pesoKg, r), estiloConCuidados(estilo, r));
  }
  return { ...c, metas };
}

/** El agua por día: la de lo marcado, la de siempre o, si Moss no la pide, null. */
export const metaDeAgua = (r: Pick<Reglas, 'agua'>, deSiempre: number): number | null => (r.agua === 'noPedir' ? null : r.agua ?? deSiempre);

/** La referencia de un micronutriente con lo marcado: la etapa, el potasio de la presión, sin referencia con el riñón, el tope del colesterol y de la cafeína. */
export function referenciaConCuidados(micro: Micro, p: ParaQuien, r: Reglas): Referencia | null {
  if (r.sinReferencia.includes(micro)) return null;
  if (micro === 'potasio' && typeof r.potasio === 'number') return { meta: r.potasio };
  if (micro === 'colesterol' && r.colesterolMax !== null) return { tope: r.colesterolMax };
  const base = referenciaDe(micro, { ...p, etapa: r.etapa ?? p.etapa ?? null });
  if (micro === 'cafeina' && base && 'tope' in base && r.cafeinaTope !== null) return { tope: Math.min(base.tope, r.cafeinaTope) };
  return base;
}

// ------------------------------------------------------------ lo que Moss deja de decir (o empieza)
/** Los consejos del deporte que son de comer: los mismos que segunElDeporte.ts saca con «sin déficit». */
const DEL_DEPORTE_DE_COMER: ReadonlySet<string> = new Set(['partido', 'carrera', 'carbohidratos', 'alcohol', 'minerales']);

/** Si lo marcado apaga un comentario de «Para hoy». */
export function apagaConsejo(c: ConsejoDeHoy, r: Pick<Reglas, 'apagar'>): boolean {
  const no = (x: LoQueDice) => r.apagar.includes(x);
  switch (c.tipo) {
    case 'deporte': return no('deporte') && DEL_DEPORTE_DE_COMER.has(c.consejo.que);
    case 'pocosCarbohidratos': case 'muchaGrasa': return no('reparto');
    case 'pocaProteina': return no('reparto') || no('faltaProteina');
    case 'faltaProteina': return no('faltaProteina');
    case 'agua': return no('agua');
    default: return false;
  }
}

/** Si lo marcado apaga un aviso de lo que falta (loQueFalta.ts). */
export function apagaLoQueFalta(que: QueFalta, r: Pick<Reglas, 'apagar'>): boolean {
  return r.apagar.includes(que === 'proteina' ? 'faltaProteina' : que === 'calorias' ? 'faltaCalorias' : 'agua');
}

/** Si lo marcado apaga uno de lo que conviene hacer (loQueConviene.ts). El café antes de entrenar va con lo de antes. */
export function apagaLoQueConviene(que: QueConviene, r: Pick<Reglas, 'apagar'>): boolean {
  const no = (x: LoQueDice) => r.apagar.includes(x);
  if (que === 'antesDeEntrenar') return no('antesDeEntrenar');
  if (que === 'despuesDeEntrenar') return no('despuesDeEntrenar');
  if (que === 'partido' || que === 'carrera') return no('deporte');
  if (que === 'ultimaComida') return no('ultimaComida');
  return false;
}

/** Si lo marcado apaga una línea de qué comer alrededor del entreno (alrededorDelEntreno.ts). */
export function apagaLinea(clase: Clase, r: Pick<Reglas, 'apagar'>): boolean {
  const no = (x: LoQueDice) => r.apagar.includes(x);
  if (clase === 'previa' || clase === 'previaLiviana' || clase === 'snackPrevio') return no('antesDeEntrenar');
  if (clase === 'despues' || clase === 'despuesPronto' || clase === 'reponer' || clase === 'antesDeDormir') return no('despuesDeEntrenar');
  return no(clase);
}

/** La barra que tiembla al pasarse (estadoDeMacro): con un trastorno de la alimentación, pasarse se ve como cumplido. */
export const estadoConCuidados = (e: EstadoDeMacro, r: Pick<Reglas, 'apagar'>): EstadoDeMacro => (e === 'pasado' && r.apagar.includes('pasado') ? 'cumplido' : e);
