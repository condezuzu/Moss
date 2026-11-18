// Tu plan, arriba de Progreso (spec/progreso.md, «Más simple, con el plan arriba»; galeria/src/progreso.js):
// a dónde llegar y cuándo, la línea con los hitos y el mantenimiento, cómo vienes con el ritmo y su
// margen, y «Cambiar el plan», que despliega ahí mismo el objetivo, el peso meta, el ritmo y el plazo
// (D35) y las metas de hoy. Las cuentas son las del dominio: planPorEtapas, ritmoConRango y el plazo.

import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type AccessibilityActionEvent, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { KG_POR_LIBRA } from '@/dominio/cantidades';
import type { Despues } from '@/dominio/cuestionario';
import { diasEntre, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { edadDe, objetivoPermitido, pesoMinimoSano, pisoDe, RITMOS, type Macros, type Objetivo, type Ritmo } from '@/dominio/metas';
import {
  bordeDe, direccionDe, nivelDeHoy, planPorEtapas, plazoConFecha, plazoConRitmo, ritmoConRango, SEMANAS_DE_MANTENIMIENTO,
  type ComoVienes, type Direccion, type EntradaDelPlazo, type Fechas, type PlanPorEtapas, type Plazo, type TipoDeEtapa,
} from '@/dominio/progreso';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { Icono, MACROS, Punto } from '../comida/comunes';
import { fechaDiaMes, fechaLarga, numero } from '../comida/datos';
import { LoQueSigue, type LoQueSigueDibujado } from '../graficos/Graficos';
import { BotonDePaso } from '../paso';
import type { Persona } from '../persona';
import { Aparece, Carta, Chip, Cifra, ComoSeCalcula, Parrafo, Segmento, type TipoDeChip } from '../tarjetas';
import { Regla } from './Regla';
import { conSignoFijo, fijo, type U } from './unidades';

/** El ritmo o la fecha que se eligen en «Ritmo y plazo» (quedan guardados en el teléfono); sin tocar, el ritmo del perfil. */
export type EleccionDelPlazo = { pct: number | null; porFecha: boolean; fecha: ClaveDia | null };
export const SIN_ELEGIR: EleccionDelPlazo = { pct: null, porFecha: false, fecha: null };

export type Calculo = { plan: PlanPorEtapas; plazo: Plazo | null; entrada: EntradaDelPlazo | null; objetivo: Objetivo };

/** Hasta dónde llega la regla del ritmo, en % del peso por semana: más allá de lo muy agresivo. */
const TOPE: Record<Direccion, number> = { bajar: 1.15, subir: 0.7 };

function plazoDe(e: EntradaDelPlazo, objetivo: Direccion, ritmo: Ritmo, x: EleccionDelPlazo): Plazo | null {
  // Una fecha guardada que ya quedó a menos de una semana no da plazo: vale su ritmo.
  const conFecha = x.porFecha && x.fecha ? plazoConFecha(e, x.fecha) : null;
  return conFecha ?? plazoConRitmo(e, x.pct ?? Math.abs(RITMOS[objetivo][ritmo]));
}

/**
 * El plan de hoy: desde el peso de hoy sin el atraso de la tendencia (spec/estudio/progreso.md, A5),
 * con el ritmo medido y su margen. `despues`: lo que dijo en el cuestionario que sigue al llegar. Sin un peso, ninguno.
 */
export function calcularPlan(p: Persona, hoy: ClaveDia, eleccion: EleccionDelPlazo, entrenaFuerza: boolean | null, despues: Despues | null = null): Calculo | null {
  const rango = ritmoConRango(p.pesos, hoy);
  const nivel = nivelDeHoy(p.tendencia, hoy, p.pesos, rango) ?? p.pesoHoy;
  if (nivel === null) return null;
  // Sin déficit, bajar queda en mantener (objetivoPermitido): el plan es el de lo que se usa.
  const objetivo = objetivoPermitido(p.perfil);
  const meta = p.perfil.pesoMeta;
  const entrada: EntradaDelPlazo | null = objetivo !== 'mantener' && meta && p.gasto !== null && direccionDe(nivel, meta) === objetivo
    ? { hoy, pesoKg: nivel, pesoMeta: meta, sexo: p.perfil.sexo, edad: edadDe(p.perfil, hoy), gasto: p.gasto, entrenaFuerza }
    : null;
  const plazo = entrada && objetivo !== 'mantener' ? plazoDe(entrada, objetivo, p.perfil.ritmo, eleccion) : null;
  const plan = planPorEtapas({ hoy, pesoKg: nivel, objetivo, pesoMeta: meta, plazo, ritmo: rango?.kgPorSemana ?? null, rango, despues, pesoInicial: p.pesoInicial });
  return { plan, plazo, entrada, objetivo };
}

const TIPO_DEL_PLAN: Record<ComoVienes, TipoDeChip | undefined> = {
  alRitmo: 'bien', adelantado: 'bien', llegaste: 'bien', estable: 'bien', atrasado: 'atencion', alReves: 'atencion', seMueve: undefined, todaviaNo: undefined, faltanDatos: undefined,
};

/** La flecha de un enlace que despliega: gira al abrir y al cerrar. */
function Flecha({ abierta, grados = 90, tam = 13, color = colores.oroClaro }: { abierta: boolean; grados?: number; tam?: number; color?: string }) {
  const estilo = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? `${grados}deg` : '0deg', { duration: 250 }) }] }), [abierta, grados]);
  return (
    <Animated.View style={estilo}>
      <Icono nombre={grados === 180 ? 'chevron.down' : 'chevron.right'} tam={tam} color={color} peso="semibold" />
    </Animated.View>
  );
}

/** Un enlace en oro que despliega lo de abajo: «Cambiar el plan», «Elegir la fecha». */
export function Enlace({ texto, abierto, alTocar }: { texto: string; abierto?: boolean; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [s.enlace, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={abierto === undefined ? undefined : { expanded: abierto }} hitSlop={8}>
      <Text style={s.enlaceTexto}>{texto}</Text>
      <Flecha abierta={!!abierto} tam={12} />
    </Pressable>
  );
}

export { Flecha };

// ------------------------------------------------------------------ el plan
type PropsDelPlan = {
  p: Persona; calculo: Calculo; hoy: ClaveDia; desde: ClaveDia; u: U;
  abierto: string | null; alternar: (cual: string) => void;
  cambiarPlan: boolean; alCambiarPlan: () => void; children: ReactNode;
};

export function ElPlan({ p, calculo, hoy, desde, u, abierto, alternar, cambiarPlan, alCambiarPlan, children }: PropsDelPlan) {
  const pl = calculo.plan;
  const sinDeficit = !!p.perfil.sinDeficit;
  const primera = pl.etapas[0];
  // El margen del ritmo, del que menos cambia al que más: «entre −0,32 y −0,46».
  const margen = pl.rango
    ? (() => {
      const [a, b] = Math.abs(pl.rango.desde) <= Math.abs(pl.rango.hasta) ? [pl.rango.desde, pl.rango.hasta] : [pl.rango.hasta, pl.rango.desde];
      return { desde: conSignoFijo(u.enUnidad(a), 2), hasta: conSignoFijo(u.enUnidad(b), 2) };
    })()
    : {};
  const clave = pl.comoVienes === 'atrasado' && !pl.fechasATuRitmo ? 'atrasadoSinFecha' : pl.comoVienes === 'seMueve' && sinDeficit ? 'seMueveSinAjustar' : pl.comoVienes;
  const como = t(`progreso.plan.comoVienes.${clave}`, {
    ritmo: pl.ritmo === null ? '' : conSignoFijo(u.enUnidad(pl.ritmo), 2), plan: conSignoFijo(u.enUnidad(pl.ritmoPlan), 2), cuando: pl.fechasATuRitmo ? cuandoDe(pl.fechasATuRitmo) : '', ...margen,
  });
  // Al llegar, el mantenimiento; y lo que sigue, si lo dijo en el cuestionario (sin decirlo, lo elige al llegar).
  const siguiente = loQueSigueDe(pl);
  const luego = siguiente === 'despues' ? 'eliges' : siguiente;
  return (
    <Carta titulo={t('progreso.plan.titulo')} derecha={<Chip texto={t(`progreso.plan.estados.${pl.comoVienes}`)} tipo={TIPO_DEL_PLAN[pl.comoVienes]} />}>
      <Text style={s.titulo}>{u.texto(t(`progreso.plan.etapas.${primera.tipo as Objetivo}`, { kg: u.corto(primera.pesoHasta) }))}</Text>
      {primera.hasta && <Text style={s.para}>{t('progreso.plan.para', { fecha: fechaLarga(primera.hasta) })}</Text>}
      {pl.hitos.length > 0 && <Pista desde={desde} hoy={hoy} pesoInicial={p.pesoInicial ?? p.pesoHoy ?? primera.pesoDesde} pesoHoy={p.pesoHoy ?? primera.pesoDesde} plan={pl} u={u} />}
      <Aparece key={clave} style={s.como}>
        <Parrafo>{u.texto(como)}</Parrafo>
      </Aparece>
      {pl.rango && (
        <ComoSeCalcula abierto={abierto === 'ritmo'} alTocar={() => alternar('ritmo')}>
          <Parrafo>{t('progreso.plan.comoSeCalcula')}</Parrafo>
        </ComoSeCalcula>
      )}
      {pl.etapas[1] && (
        <Text style={s.despues}>
          {`${t(`progreso.plan.despues.${primera.tipo as Direccion}`, { n: SEMANAS_DE_MANTENIMIENTO })} ${u.texto(t(`progreso.plan.luego.${luego}`, { kg: u.corto(primera.pesoHasta) }))}`}
        </Text>
      )}
      {!sinDeficit && <Text style={s.ajusta}>{t('progreso.plan.ajusta')}</Text>}
      <View style={s.cambiar}>
        <Pressable onPress={alCambiarPlan} style={({ pressed }) => [s.enlace, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={{ expanded: cambiarPlan }} hitSlop={8}>
          <Text style={s.enlaceTexto}>{t('progreso.plan.cambiar')}</Text>
          <Flecha abierta={cambiarPlan} tam={12} />
        </Pressable>
      </View>
      {cambiarPlan && <Aparece style={s.estrategia}>{children}</Aparece>}
    </Carta>
  );
}

/** Cuándo llegarías a tu ritmo: «en enero» si las dos puntas caen en el mismo mes; si no, «entre el 20 dic y el 25 ene». */
function cuandoDe(f: Fechas): string {
  if (f.temprana.slice(0, 7) === f.tardia.slice(0, 7)) return t('progreso.plan.cuando.mes', { mes: lista('fecha.meses')[Number(f.temprana.slice(5, 7)) - 1] });
  return t('progreso.plan.cuando.rango', { desde: fechaDiaMes(f.temprana), hasta: fechaDiaMes(f.tardia) });
}

// ------------------------------------------------------------------ la línea del plan
const DE_LA_ETAPA: Record<TipoDeEtapa, LoQueSigueDibujado> = { mantener: 'mantener', bajar: 'grasa', recomponer: 'recomponer', subir: 'musculo' };
/** Lo que sigue después del mantenimiento, por la etapa del plan; sin etapa, lo elige al llegar. */
const loQueSigueDe = (pl: PlanPorEtapas): LoQueSigueDibujado => (pl.etapas[2] ? DE_LA_ETAPA[pl.etapas[2].tipo] : 'despues');
/** Hasta dónde llega la línea, en %: lo último es para lo que sigue (como en la galería). */
const ANCHO_DE_LA_LINEA = 70;
const LLENA = Easing.bezier(0.2, 0.7, 0.2, 1);
/** Los trazos del mantenimiento: sobran, el tramo los recorta. */
const TRAZOS = Array.from({ length: 40 }, (_, i) => i);

/**
 * Desde que empezaste (lo hecho, en oro) hasta hoy, los hitos y la meta, y el mantenimiento después,
 * más tenue. Cada punto con su fecha y su peso; los que no entran sin pisarse, sin etiqueta. Al final, lo
 * que sigue: su dibujo y su nombre, sin fecha.
 */
function Pista({ desde, hoy, pesoInicial, pesoHoy, plan, u }: { desde: ClaveDia; hoy: ClaveDia; pesoInicial: number; pesoHoy: number; plan: PlanPorEtapas; u: U }) {
  const reducido = useReducedMotion();
  const meta = plan.hitos[plan.hitos.length - 1];
  const fin = plan.etapas[1]?.hasta ?? meta.fecha;
  const total = Math.max(1, diasEntre(desde, fin));
  const ancho = ANCHO_DE_LA_LINEA;
  const pos = (f: ClaveDia) => Math.min(ancho, Math.max(0, (diasEntre(desde, f) / total) * ancho));
  const puntos: { f: ClaveDia; kg: number; clase: 'inicio' | 'hoy' | 'hito' | 'meta'; etq: string }[] = [
    { f: desde, kg: pesoInicial, clase: 'inicio', etq: fechaDiaMes(desde) },
    { f: hoy, kg: pesoHoy, clase: 'hoy', etq: t('progreso.hoy') },
    ...plan.hitos.map((h) => ({ f: h.fecha, kg: h.kg, clase: h.meta ? ('meta' as const) : ('hito' as const), etq: fechaDiaMes(h.fecha) })),
  ];
  let ultima = -100;
  const conEtiqueta = puntos.map((x) => {
    const left = pos(x.f);
    // Hoy y la meta siempre llevan su etiqueta; los demás, si no pisan la anterior, la de hoy ni la de la meta.
    const si = x.clase === 'hoy' || x.clase === 'meta' || (left - ultima >= 17 && pos(meta.fecha) - left >= 17 && Math.abs(pos(hoy) - left) >= 14);
    if (si) ultima = left;
    return si;
  });
  const hasta = pos(hoy) / ancho;
  const hecho = useSharedValue(reducido ? hasta : 0);
  useEffect(() => {
    hecho.set(reducido ? hasta : withTiming(hasta, { duration: 1200, easing: LLENA, reduceMotion: ReduceMotion.Never }));
  }, [hasta, reducido, hecho]);
  const lleno = useAnimatedStyle(() => ({ width: `${hecho.get() * 100}%` }));
  const mant = pos(meta.fecha);
  // El mantenimiento, en la línea (que termina donde empieza lo que sigue).
  const mantEnLinea = (mant / ancho) * 100;
  return (
    <View style={s.pista} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[s.linea, { right: `${100 - ancho}%` }]}>
        <Animated.View style={[s.hecho, DEGRADE_DEL_HECHO, lleno]} />
        <View style={[s.mant, { left: `${mantEnLinea}%`, width: `${100 - mantEnLinea}%` }]}>
          {TRAZOS.map((i) => <View key={i} style={s.trazo} />)}
        </View>
      </View>
      {puntos.map((x, i) => (
        <Animated.View key={`${x.clase}-${x.f}`} entering={FadeIn.duration(400).delay(80 * i).reduceMotion(ReduceMotion.Never)} style={[s.punto, { left: `${pos(x.f)}%` }]}>
          <View style={[s.puntoDentro, x.clase === 'inicio' && s.puntoInicio]}>
            <View style={[s.bolita, x.clase === 'inicio' && s.bolitaInicio, x.clase === 'hoy' && s.bolitaHoy, x.clase === 'meta' && s.bolitaMeta]} />
            {conEtiqueta[i] && (
              <>
                <Text style={[s.puntoFecha, x.clase === 'hoy' && s.puntoHoy]} maxFontSizeMultiplier={1.2}>{x.etq}</Text>
                <Text style={[s.puntoKg, x.clase === 'hoy' && s.puntoHoy, x.clase === 'meta' && s.puntoMeta]} maxFontSizeMultiplier={1.2}>{u.peso(x.kg, 1)}</Text>
              </>
            )}
          </View>
        </Animated.View>
      ))}
      <View style={[s.mantEtq, { left: `${(mant + ancho) / 2}%` }]}>
        <Text style={s.mantTexto} maxFontSizeMultiplier={1.2}>{t('progreso.plan.mantener')}</Text>
      </View>
      <Siguiente key={loQueSigueDe(plan)} que={loQueSigueDe(plan)} desde={ancho} />
    </View>
  );
}

/** El dibujo va en una caja de 90 × 24 y se traza después de la línea; su nombre aparece al final. */
const CAJA_DE_LO_QUE_SIGUE = { ancho: 90, alto: 24 };
const SE_TRAZA = Easing.bezier(0.4, 0, 0.2, 1);

function Siguiente({ que, desde }: { que: LoQueSigueDibujado; desde: number }) {
  const reducido = useReducedMotion();
  const [lugar, setLugar] = useState(0);
  const escala = Math.min(1, lugar / CAJA_DE_LO_QUE_SIGUE.ancho);
  const ancho = CAJA_DE_LO_QUE_SIGUE.ancho * escala;
  const trazo = useSharedValue(reducido ? 1 : 0);
  useEffect(() => {
    if (lugar) trazo.set(reducido ? 1 : withDelay(1000, withTiming(1, { duration: 900, easing: SE_TRAZA, reduceMotion: ReduceMotion.Never })));
  }, [lugar, reducido, trazo]);
  const recorte = useAnimatedStyle(() => ({ width: trazo.get() * ancho }));
  return (
    <View style={[s.luego, { left: `${desde}%` }]} onLayout={(e) => setLugar(e.nativeEvent.layout.width)}>
      {lugar > 0 && (
        <>
          <Animated.View style={[s.luegoRecorte, recorte]}>
            <View style={{ width: ancho, height: CAJA_DE_LO_QUE_SIGUE.alto }}>
              <LoQueSigue que={que} ancho={ancho} alto={CAJA_DE_LO_QUE_SIGUE.alto} />
              {que === 'despues' && <Text style={[s.luegoSigno, { left: 69.5 * escala - 6 }]} maxFontSizeMultiplier={1.2}>?</Text>}
            </View>
          </Animated.View>
          <Animated.View entering={reducido ? undefined : FadeIn.delay(1400).duration(400)} style={s.luegoNombre}>
            <Text style={s.luegoTexto} maxFontSizeMultiplier={1.2}>{t(`progreso.plan.siguiente.${que}`)}</Text>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ la estrategia, dentro del plan
function Fila({ titulo, valor, abierta, alTocar }: { titulo: string; valor: string; abierta?: boolean; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [s.fila, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={abierta === undefined ? undefined : { expanded: abierta }}>
      <Text style={s.filaTitulo}>{titulo}</Text>
      <Text style={s.filaValor} numberOfLines={1}>{valor}</Text>
      <Flecha abierta={!!abierta} color="rgba(239, 230, 207, 0.4)" />
    </Pressable>
  );
}

const Eleccion = ({ children }: { children: ReactNode }) => <Aparece style={s.eleccion}>{children}</Aparece>;

type PropsDeLaEstrategia = {
  p: Persona; calculo: Calculo; hoy: ClaveDia; u: U; numeros: boolean;
  abierto: string | null; alternar: (cual: string) => void;
  eleccion: EleccionDelPlazo; alElegir: (x: EleccionDelPlazo) => void; alVerMetas: () => void;
};

export function LaEstrategia({ p, calculo, hoy, u, numeros, abierto, alternar, eleccion, alElegir, alVerMetas }: PropsDeLaEstrategia) {
  const perfil = p.perfil;
  const ponerEstrategia = elAlmacen().ponerEstrategia;
  const [enElMinimo, setEnElMinimo] = useState(false);
  // Mientras se arrastra la regla, el ritmo nuevo cambia solo esto; al soltar, todo el plan.
  const [vivo, setVivo] = useState<Plazo | null>(null);
  const minimo = pesoMinimoSano(perfil.alturaCm);
  const { objetivo, entrada } = calculo;
  const plazo = vivo ?? calculo.plazo;
  const metaKg = perfil.pesoMeta;
  const m = p.meta;
  return (
    <View>
      <Fila titulo={t('progreso.objetivo')} valor={t(`progreso.objetivos.${objetivo}`)} abierta={abierto === 'objetivo'} alTocar={() => alternar('objetivo')} />
      {abierto === 'objetivo' && (
        <Eleccion>
          <Segmento<Objetivo>
            opciones={(['bajar', 'mantener', 'subir'] as const).map((o) => [o, t(`progreso.objetivos.${o}`)] as const)}
            elegida={objetivo}
            alElegir={(o) => {
              // Sin déficit, bajar de peso no se elige acá (src/dominio/metas.ts, objetivoPermitido).
              if (o === 'bajar' && perfil.sinDeficit) return;
              ponerEstrategia({ objetivo: o });
              alElegir(SIN_ELEGIR);
            }}
          />
          {perfil.sinDeficit && <Parrafo chico>{t('entrada.cuidado.bajarNo')}</Parrafo>}
          <Parrafo chico>{t('progreso.objetivoNota')}</Parrafo>
        </Eleccion>
      )}
      {objetivo !== 'mantener' && (
        <Aparece>
          <Fila titulo={t('progreso.pesoMeta')} valor={metaKg ? `${u.meta(metaKg)} ${u.unidad}` : t('progreso.sinPesoMeta')} abierta={abierto === 'pesoMeta'} alTocar={() => alternar('pesoMeta')} />
          {abierto === 'pesoMeta' && (
            <Eleccion>
              <PasosDelPesoMeta
                // Sin meta, desde el peso de hoy; con bajo peso, desde el primero que se puede.
                kg={metaKg ?? Math.max(Math.round(p.pesoHoy ?? 70), primeroPermitido(minimo, u.unidad === 'lb'))}
                u={u}
                minimo={minimo}
                alCambiar={(pesoMeta) => {
                  setEnElMinimo(false);
                  ponerEstrategia({ pesoMeta });
                }}
                alMinimo={() => {
                  setEnElMinimo(true);
                  anunciar(t('progreso.limites.imc', { n: u.peso(minimo, 1), unidad: u.unidad }));
                }}
              />
              <Parrafo chico>{t('progreso.pesoMetaNota')}</Parrafo>
              {enElMinimo && (
                <Aparece>
                  <Text style={s.limite}>{t('progreso.limites.imc', { n: u.peso(minimo, 1), unidad: u.unidad })}</Text>
                </Aparece>
              )}
            </Eleccion>
          )}
          <Fila titulo={t('progreso.plazo.fila')} valor={plazo ? `${fijo(plazo.pct, 2)} % · ${fechaDiaMes(plazo.fecha)}` : '—'} abierta={abierto === 'plazo'} alTocar={() => alternar('plazo')} />
          {abierto === 'plazo' && (
            <Eleccion>
              {entrada && plazo ? (
                <ElPlazo
                  entrada={entrada} plazo={plazo} hoy={hoy} ritmo={perfil.ritmo} sexo={perfil.sexo} u={u} numeros={numeros} eleccion={eleccion}
                  alMover={(pct) => setVivo(pct === null ? null : plazoConRitmo(entrada, pct))}
                  alElegir={(x) => {
                    setVivo(null);
                    alElegir(x);
                  }}
                />
              ) : (
                <Parrafo chico>{t('progreso.plazo.sinCamino')}</Parrafo>
              )}
            </Eleccion>
          )}
        </Aparece>
      )}
      {m && (
        <>
          <Fila titulo={t('progreso.metasActuales')} valor={numeros ? `${numero(m.kcal)} kcal` : ''} alTocar={alVerMetas} />
          {numeros && <MacrosEnLinea meta={m} />}
        </>
      )}
    </View>
  );
}

export const MacrosEnLinea = ({ meta }: { meta: Macros }) => (
  <View style={s.macros}>
    {MACROS.map((m) => (
      <View key={m} style={s.macro}>
        <Punto macro={m} tam={7} />
        <Text style={s.macroTexto}>{`${numero(meta[m])} g ${t(`comida.${m}`).toLowerCase()}`}</Text>
      </View>
    ))}
  </View>
);

// ------------------------------------------------------------------ el ritmo y el plazo (D35)
const COLOR_DE_VIABILIDAD = {
  viable: { color: colores.salvia, backgroundColor: 'rgba(166, 191, 148, 0.12)' },
  exigente: { color: colores.oroClaro, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  muyAgresivo: { color: '#eaa196', backgroundColor: 'rgba(231, 140, 128, 0.13)' },
} as const;

type PropsDelPlazo = {
  entrada: EntradaDelPlazo; plazo: Plazo; hoy: ClaveDia; ritmo: Ritmo; sexo: Persona['perfil']['sexo']; u: U; numeros: boolean;
  eleccion: EleccionDelPlazo; alMover: (pct: number | null) => void; alElegir: (x: EleccionDelPlazo) => void;
};

/**
 * Como en MacroFactor: el ritmo da la fecha, o la fecha da el ritmo (plazoConRitmo y plazoConFecha),
 * con qué tan exigente es, lo que pide por día y lo que conviene saber.
 */
function ElPlazo({ entrada, plazo, hoy, ritmo, sexo, u, numeros, eleccion, alMover, alElegir }: PropsDelPlazo) {
  const ponerEstrategia = elAlmacen().ponerEstrategia;
  const dir = plazo.direccion;
  const tope = TOPE[dir];
  const pos = (pct: number) => Math.min(100, (pct / tope) * 100);
  const mover = (dias: number) => {
    const fecha = sumarDias(eleccion.fecha ?? plazo.fecha, dias);
    // A menos de una semana no hay plazo (plazoConFecha).
    if (diasEntre(hoy, fecha) >= 7) alElegir({ ...eleccion, porFecha: true, fecha });
    return diasEntre(hoy, fecha) >= 7;
  };
  return (
    <View style={s.plazo}>
      <View style={s.plazoRes}>
        <View style={s.plazoCifra}>
          <Cifra valor={fechaDiaMes(plazo.fecha)} texto={t('progreso.plazo.enSemanas', { n: Math.round(plazo.semanas) })} />
        </View>
        <Text style={[s.viab, COLOR_DE_VIABILIDAD[plazo.viabilidad]]}>{t(`progreso.plazo.viabilidad.${plazo.viabilidad}`)}</Text>
      </View>
      <Regla
        valor={Math.min(tope, plazo.pct)}
        min={0.05}
        max={tope}
        viable={pos(bordeDe(dir, 'viable', entrada.pesoKg))}
        exigente={pos(bordeDe(dir, 'exigente', entrada.pesoKg))}
        etiqueta={t('progreso.plazo.ritmo')}
        textoDe={(pct) => `${fijo(pct, 2)} %`}
        alMover={(pct) => alMover(pct)}
        alSoltar={(pct) => {
          alMover(null);
          alElegir({ pct, porFecha: false, fecha: null });
        }}
        marcas={(['suave', 'recomendado', 'rapido'] as const).map((r) => {
          const pct = Math.abs(RITMOS[dir][r]);
          return {
            clave: r, texto: t(`progreso.ritmos.${r}`), pos: pos(pct), elegida: Math.abs(pct - plazo.pct) < 0.005,
            // Uno de los tres es el ritmo del perfil: lo elegido a mano (un ritmo o una fecha) se suelta.
            alTocar: () => {
              ponerEstrategia({ ritmo: r });
              alElegir(SIN_ELEGIR);
            },
          };
        })}
      />
      <Text style={s.nota}>{u.texto(t('progreso.plazo.porSemana', { pct: fijo(plazo.pct, 2), kg: fijo(u.enUnidad(plazo.kgPorSemana), 2) }))}</Text>
      <Parrafo>{t(`progreso.plazo.textos.${plazo.viabilidad}`, { exigente: fechaDiaMes(plazo.fechaExigente), viable: fechaDiaMes(plazo.fechaViable) })}</Parrafo>
      {numeros && <Text style={s.notaChica}>{t(dir === 'bajar' ? 'progreso.plazo.kcalMenos' : 'progreso.plazo.kcalMas', { n: numero(Math.round(plazo.kcal / 10) * 10) })}</Text>}
      <Enlace
        texto={t(eleccion.porFecha ? 'progreso.plazo.elegirRitmo' : 'progreso.plazo.elegirFecha')}
        alTocar={() => alElegir(eleccion.porFecha ? { pct: plazo.pct, porFecha: false, fecha: null } : { pct: eleccion.pct, porFecha: true, fecha: plazo.fecha })}
      />
      {eleccion.porFecha && (
        <Aparece>
          <View style={s.pasos}>
            <BotonDePaso alPaso={() => mover(-7)} etiqueta={t('progreso.plazo.antes')} style={s.paso}>
              <Icono nombre="minus" tam={16} peso="semibold" />
            </BotonDePaso>
            <Text style={[s.pasoValor, s.pasoFecha]} maxFontSizeMultiplier={1.4}>{fechaDiaMes(plazo.fecha)}</Text>
            <BotonDePaso alPaso={() => mover(7)} etiqueta={t('progreso.plazo.despues')} style={s.paso}>
              <Icono nombre="plus" tam={16} peso="semibold" />
            </BotonDePaso>
          </View>
        </Aparece>
      )}
      {plazo.avisos.map((a) => (
        // El del piso sin fecha y el del piso al final se ven como el del piso.
        <Aparece key={a}>
          <Text style={[s.aviso, a !== 'sinFuerzaBajar' && a !== 'sinFuerzaSubir' && s.avisoOro]}>
            {t(`progreso.plazo.avisos.${a}`, { piso: numero(pisoDe(sexo)), fecha: plazo.fechaConPiso ? fechaDiaMes(plazo.fechaConPiso) : '' })}
          </Text>
        </Aparece>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ el peso meta
/** Una libra en kg, redondeado a 0,1 kg: lo que guarda la cuenta. */
const deLibras = (lb: number) => Math.round(lb * KG_POR_LIBRA * 10) / 10;

/** El peso meta más bajo que se puede elegir con los pasos: el medio kilo, o la libra, de arriba del mínimo. */
function primeroPermitido(minimo: number, enLibras: boolean): number {
  if (!enLibras) return Math.ceil(minimo * 2) / 2;
  const libras = Math.ceil(minimo / KG_POR_LIBRA);
  // Redondeada a 0,1 kg, esa libra puede quedar apenas por debajo: entonces, la que sigue.
  return deLibras(libras) >= minimo ? deLibras(libras) : deLibras(libras + 1);
}

/**
 * El peso meta de a medio kilo, o de a una libra, no por debajo de `minimo` (un IMC de 18,5). Solo se
 * frena al bajar: con bajo peso, subir desde abajo del mínimo salta al primero que se puede.
 */
function PasosDelPesoMeta({ kg, u, minimo, alCambiar, alMinimo }: { kg: number; u: U; minimo: number; alCambiar: (kg: number) => void; alMinimo: () => void }) {
  const enLibras = u.unidad === 'lb';
  const cambiar = (signo: 1 | -1): boolean => {
    // En libras, desde la libra que se ve: redondeado a 0,1 kg (lo que guarda la cuenta), vuelve a esa libra.
    let nuevo = enLibras ? deLibras(Math.round(u.enUnidad(kg)) + signo) : Math.round((kg + 0.5 * signo) * 2) / 2;
    if (nuevo < minimo) {
      if (signo < 0) {
        alMinimo();
        return false;
      }
      nuevo = primeroPermitido(minimo, enLibras);
    }
    if (nuevo > 400) return false;
    alCambiar(nuevo);
    anunciar(`${u.meta(nuevo)} ${u.unidad}`);
    return true;
  };
  const paso = enLibras ? '1 lb' : `${numero(0.5, 1)} kg`;
  const menos = t('comun.menos', { que: paso });
  const mas = t('comun.mas', { que: paso });
  const valor = `${u.meta(kg)} ${u.unidad}`;
  return (
    // Para VoiceOver, el valor con sus dos botones es uno solo, que se ajusta deslizando para arriba o para abajo.
    <View
      style={s.pasos}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('progreso.pesoMeta')}
      accessibilityValue={{ text: valor }}
      accessibilityActions={[{ name: 'increment', label: mas }, { name: 'decrement', label: menos }]}
      onAccessibilityAction={(ev: AccessibilityActionEvent) => {
        if (ev.nativeEvent.actionName === 'increment') cambiar(1);
        else if (ev.nativeEvent.actionName === 'decrement') cambiar(-1);
      }}
    >
      <BotonDePaso alPaso={() => cambiar(-1)} etiqueta={menos} style={s.paso}>
        <Icono nombre="minus" tam={16} peso="semibold" />
      </BotonDePaso>
      <Text style={s.pasoValor} maxFontSizeMultiplier={1.4}>{valor}</Text>
      <BotonDePaso alPaso={() => cambiar(1)} etiqueta={mas} style={s.paso}>
        <Icono nombre="plus" tam={16} peso="semibold" />
      </BotonDePaso>
    </View>
  );
}

const DEGRADE = 'linear-gradient(90deg, rgba(232, 196, 106, 0.2), #f6e3a6)';
// En la web, backgroundImage; en el teléfono, el de React Native (como la franja bajo la hora).
const DEGRADE_DEL_HECHO = (Platform.OS === 'web' ? { backgroundImage: DEGRADE } : { experimental_backgroundImage: DEGRADE }) as ViewStyle;

const s = StyleSheet.create({
  titulo: { fontFamily: letras.numeroMedio, fontSize: 21, lineHeight: 24, color: colores.pergamino },
  para: { marginTop: -2, fontFamily: letras.texto, fontSize: 13, lineHeight: 16, color: 'rgba(239, 230, 207, 0.6)' },
  como: { marginTop: 4 },
  despues: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 19, color: 'rgba(239, 230, 207, 0.66)' },
  ajusta: { fontFamily: letras.texto, fontSize: 12, lineHeight: 16, color: 'rgba(239, 230, 207, 0.45)' },
  cambiar: { flexDirection: 'row', marginTop: 2 },
  enlace: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6 },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  estrategia: { marginTop: 8, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  pista: { height: 64, marginTop: 14, marginHorizontal: 8 },
  linea: { position: 'absolute', left: 0, right: 0, top: 19, height: 3, borderRadius: 3, backgroundColor: 'rgba(239, 230, 207, 0.1)' },
  hecho: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
  mant: { position: 'absolute', top: 0, bottom: 0, flexDirection: 'row', gap: 3, overflow: 'hidden', borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  trazo: { width: 4, height: 3, backgroundColor: 'rgba(166, 191, 148, 0.55)' },
  // Un ancho fijo, centrado en su día: cerca del borde, la etiqueta no se parte en dos renglones.
  punto: { position: 'absolute', top: 0, width: 80, marginLeft: -40 },
  puntoDentro: { alignItems: 'center', gap: 3 },
  puntoInicio: { alignItems: 'flex-start', marginLeft: 40 },
  bolita: { width: 9, height: 9, marginTop: 16, borderRadius: 4.5, backgroundColor: '#0b1122', borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.45)' },
  bolitaInicio: { width: 7, height: 7, marginTop: 17, borderRadius: 3.5, backgroundColor: colores.oroClaro, borderColor: colores.oroClaro },
  bolitaHoy: {
    width: 12, height: 12, marginTop: 14.5, borderRadius: 6, backgroundColor: colores.cifra, borderColor: colores.cifra,
    shadowColor: colores.cifra, shadowOpacity: 0.6, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
  },
  bolitaMeta: { width: 13, height: 13, marginTop: 14, borderRadius: 6.5, borderWidth: 2, borderColor: colores.oroClaro },
  puntoFecha: { marginTop: 4, fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.48)' },
  puntoKg: { fontFamily: letras.numero, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.85)', fontVariant: ['tabular-nums'] },
  puntoHoy: { color: colores.pergamino },
  puntoMeta: { color: colores.oroClaro },
  mantEtq: { position: 'absolute', top: 2, width: 80, marginLeft: -40, alignItems: 'center' },
  mantTexto: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 0.4, color: colores.salvia },
  luego: { position: 'absolute', right: 0, top: 8.5, alignItems: 'flex-end' },
  luegoRecorte: { height: 24, overflow: 'hidden', alignSelf: 'flex-start' },
  luegoSigno: { position: 'absolute', top: 3, width: 12, textAlign: 'center', fontFamily: letras.texto, fontSize: 14, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)' },
  luegoNombre: { marginTop: 3.5 },
  luegoTexto: { fontFamily: letras.texto, fontSize: 10.5, lineHeight: 12, color: colores.pergamino, opacity: 0.85 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  filaTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  filaValor: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)', textAlign: 'right', fontVariant: ['tabular-nums'] },
  eleccion: { gap: 10, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  limite: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: colores.oroClaro },
  macros: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, paddingTop: 12 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.8)', fontVariant: ['tabular-nums'] },
  plazo: { gap: 8 },
  plazoRes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  plazoCifra: { flexShrink: 1 },
  viab: { overflow: 'hidden', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  nota: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.72)', fontVariant: ['tabular-nums'] },
  notaChica: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  aviso: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)',
    fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.66)', overflow: 'hidden',
  },
  avisoOro: { borderColor: 'rgba(232, 196, 106, 0.22)', color: 'rgba(246, 227, 166, 0.85)' },
  pasos: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 84, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 18, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  pasoFecha: { minWidth: 92 },
});
