// Lo que Inicio, Progreso y Sueño calculan con lo guardado, con los módulos del dominio, como la
// galería (galeria/src/galeria.js, «la persona»): la tendencia del peso, el progreso al objetivo, el
// balance, el último control y el próximo, las medidas y la grasa, y las noches. Sin datos propios
// (antes del cuestionario o sin pesadas), la persona de ejemplo, con un aviso.

import type { Estado } from '@/almacen/almacen';
import { controlSemanal, estadoDelControl, tendencia, ultimoDiaDeControl, type ComidaDelDia, type Control, type EstadoDelControl, type Peso } from '@/dominio/control';
import { rangoDeGrasa, ultimasMedidas, type Medidas, type RangoDeGrasa } from '@/dominio/cuerpo';
import { diaDeLaSemana, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { edadDe, metaPara, objetivoPermitido, type Macros, type Perfil } from '@/dominio/metas';
import { balance, progresoAlObjetivo, type Balance, type Progreso } from '@/dominio/progreso';
import { comidasParaElControl, vigentes } from '@/dominio/registros';
import { conNochesDeMoss } from '@/dominio/sinReloj';
import { necesidad, type Fuente, type Medida, type Noche, type NochePropia } from '@/dominio/sueno';
import type { LoDeSalud } from '@/salud/convertir';
import { ejemplo } from './ejemplo';

/** Un punto de un gráfico: x de 0 a 1, la pesada del día (si hubo) y la tendencia. */
export type Punto = { x: number; punto: number | null; linea: number | null };

export type Persona = {
  /** Sin datos propios: es la persona de ejemplo. */
  deEjemplo: boolean;
  perfil: Perfil;
  pesos: Peso[];
  tendencia: Map<ClaveDia, number>;
  pesoHoy: number | null;
  cambio7: number | null;
  cambio30: number | null;
  pesoInicial: number | null;
  serie: Punto[];
  serieDesde: ClaveDia;
  serie30: Punto[];
  progreso: Progreso;
  /** El gasto que estima el control, en kcal por día. */
  gasto: number | null;
  balance: Balance;
  /** El último control que midió: cuándo, con qué datos y de qué gasto partió. */
  control: { fecha: ClaveDia; datos: Control['datos']; gastoAntes: number } | null;
  diaDelControl: DiaSemana;
  estadoControl: EstadoDelControl | null;
  medidas: Medidas[];
  ultimasMedidas: ReturnType<typeof ultimasMedidas>;
  grasa: RangoDeGrasa | null;
  /** La meta de comida de hoy (la de ejemplo, si es de ejemplo). */
  meta: Macros | null;
};

const soloMacros = (m: Macros): Macros => ({ kcal: m.kcal, proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas });

function serieDe(t: Map<ClaveDia, number>, pesos: Peso[], hoy: ClaveDia, dias: number): Punto[] {
  const porFecha = new Map(pesos.map((p) => [p.fecha, p.kg]));
  return Array.from({ length: dias }, (_, i) => {
    const f = sumarDias(hoy, i - dias + 1);
    return { x: i / (dias - 1), punto: porFecha.get(f) ?? null, linea: t.get(f) ?? null };
  });
}

/** Lo comido de ejemplo: unos 500 kcal por debajo del gasto, con el ruido de todos los días. */
function comidasDeEjemplo(hoy: ClaveDia): ComidaDelDia[] {
  let s = 11;
  const azar = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const lista: ComidaDelDia[] = [];
  for (let i = 28; i >= 1; i--) {
    if (i === 11 || i === 17) continue;
    const fecha = sumarDias(hoy, -i);
    const finde = diaDeLaSemana(fecha) === 6 || diaDeLaSemana(fecha) === 0;
    lista.push({ fecha, kcal: Math.round(2480 + (finde ? 350 : 0) + (azar() - 0.5) * 420) });
  }
  return lista;
}

export function calcularPersona(e: Pick<Estado, 'hoy' | 'perfil' | 'pesos' | 'metas' | 'registros' | 'medidas'>): Persona {
  const hoy = e.hoy;
  const deEjemplo = !e.perfil || e.pesos.length === 0;
  const ej = deEjemplo ? ejemplo(hoy) : null;
  const perfil = ej ? ej.perfil : e.perfil!;
  const pesos = ej ? ej.pesos : e.pesos;
  const medidas = ej ? ej.medidas : vigentes(e.medidas.values());
  const comidas = ej ? comidasDeEjemplo(hoy) : comidasParaElControl(e.registros.values());
  const t = tendencia(pesos, hoy);
  const pesoHoy = t.get(hoy) ?? null;
  const atras = (dias: number) => {
    const antes = t.get(sumarDias(hoy, -dias));
    return pesoHoy !== null && antes !== undefined ? pesoHoy - antes : null;
  };
  // Se empezó con la primera meta (la entrada), no con la pesada más vieja: Salud trae las de antes de Moss.
  const primero = [...t.keys()][0];
  const empezo = ej ? undefined : e.metas[0]?.desde;
  const pesoInicial = (empezo ? t.get(empezo) : undefined) ?? (primero ? (t.get(primero) ?? null) : null);
  const edad = edadDe(perfil, hoy);
  const c = { edad, sexo: perfil.sexo, pesoKg: pesoHoy ?? pesos[pesos.length - 1]?.kg ?? 70, objetivo: perfil.objetivo, ritmo: perfil.ritmo };

  // El último control: el de ejemplo se hace acá, como en la galería; el de verdad se vuelve a
  // medir con lo que había ese día, para mostrar de dónde salió.
  let control: Persona['control'] = null;
  let gasto: number | null = null;
  let meta: Macros | null = null;
  let ultimaMeta: ClaveDia | null = null;
  const diaDelControl = (perfil.diaDelControl ?? (ej ? diaDeLaSemana(ej.inicio) : e.metas[0] ? diaDeLaSemana(e.metas[0].desde) : diaDeLaSemana(hoy))) as DiaSemana;
  if (ej) {
    const fecha = ultimoDiaDeControl(hoy, diaDelControl);
    const antes = pesos.filter((p) => p.fecha < fecha);
    const hecho = controlSemanal({
      hoy: fecha, pesadas: antes, comidas: comidas.filter((x) => x.fecha < fecha), gastoAnterior: ej.gastoAnterior,
      metasAnteriores: metaPara(ej.gastoAnterior, { ...c, pesoKg: antes[antes.length - 1].kg }, perfil.estilo), perfil: { ...c, pesoKg: antes[antes.length - 1].kg }, estilo: perfil.estilo,
    });
    control = { fecha, datos: hecho.datos, gastoAntes: ej.gastoAnterior };
    gasto = hecho.gasto;
    meta = hecho.metas;
    ultimaMeta = fecha;
  } else if (e.metas.length) {
    const ultima = e.metas[e.metas.length - 1];
    gasto = ultima.gasto;
    meta = soloMacros(ultima);
    ultimaMeta = ultima.desde;
    const anterior = e.metas[e.metas.length - 2];
    if ((ultima.motivo === 'control' || ultima.motivo === 'faltanDatos') && anterior) {
      const antes = pesos.filter((p) => p.fecha < ultima.desde);
      const pesoKg = antes[antes.length - 1]?.kg;
      if (pesoKg !== undefined) {
        const hecho = controlSemanal({
          hoy: ultima.desde, pesadas: antes, comidas: comidas.filter((x) => x.fecha < ultima.desde), gastoAnterior: anterior.gasto,
          metasAnteriores: soloMacros(anterior), perfil: { ...c, pesoKg }, estilo: perfil.estilo,
        });
        control = { fecha: ultima.desde, datos: hecho.datos, gastoAntes: anterior.gasto };
      }
    }
  }
  const ultimas = ultimasMedidas(medidas, hoy);
  return {
    deEjemplo, perfil, pesos, tendencia: t, pesoHoy,
    cambio7: atras(7), cambio30: atras(30), pesoInicial,
    serie: serieDe(t, pesos, hoy, 56), serieDesde: sumarDias(hoy, -55), serie30: serieDe(t, pesos, hoy, 30),
    // Sin déficit, bajar queda en mantener (objetivoPermitido): el progreso es el de mantener.
    progreso: progresoAlObjetivo({ hoy, tendencia: t, pesadas: pesos, objetivo: objetivoPermitido(perfil), ritmo: perfil.ritmo, pesoMeta: perfil.pesoMeta, pesoInicial }),
    gasto,
    balance: gasto !== null ? balance(comidas, gasto, sumarDias(hoy, -1), 7) : { dias: [], promedio: null },
    control,
    diaDelControl,
    estadoControl: ultimaMeta ? estadoDelControl({ hoy, dia: diaDelControl, ultimaMeta, pesadas: pesos, comidas }) : null,
    medidas,
    ultimasMedidas: ultimas,
    grasa: rangoDeGrasa(perfil.sexo, perfil.alturaCm, ultimas),
    meta,
  };
}

export type Sueno = {
  deEjemplo: boolean;
  noches: Noche[];
  soloEnCama: Map<ClaveDia, { minutos: number; fuente: Fuente }>;
  lecturas: { frecuencia: Medida[]; variabilidad: Medida[]; respiracion: Medida[]; reposo: Map<ClaveDia, number> };
  fuentes: Fuente[];
  /** Los minutos de sueño que se necesitan por la edad. */
  necesidad: number;
};

/**
 * Las noches de Salud y, donde Salud no tiene nada, las de Moss sin reloj (estimadas, confirmadas o
 * corregidas a la mañana). Sin ninguna (recién instalada), las de ejemplo: así se ve cómo es la
 * sección, con el aviso de que no son tuyas.
 */
export function suenoDe(hoy: ClaveDia, perfil: Perfil | null, salud: LoDeSalud | null = null, propias: Map<ClaveDia, NochePropia> = new Map()): Sueno {
  const noches = conNochesDeMoss(salud?.noches ?? [], [...propias.values()], (ms) => -new Date(ms).getTimezoneOffset());
  if (noches.length) {
    const lecturas = salud?.lecturas ?? { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() };
    return { deEjemplo: false, noches, soloEnCama: salud?.soloEnCama ?? new Map(), lecturas, fuentes: salud?.fuentes ?? [], necesidad: necesidad(edadDe(perfil ?? ejemplo(hoy).perfil, hoy)) };
  }
  const ej = ejemplo(hoy);
  return {
    deEjemplo: true, noches: ej.noches, soloEnCama: ej.soloEnCama, lecturas: ej.lecturas, fuentes: ej.fuentes,
    necesidad: necesidad(edadDe(perfil ?? ej.perfil, hoy)),
  };
}
