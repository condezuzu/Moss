// Progreso, el de la galería (galeria/src/progreso.js; spec/progreso.md, «Más simple, con el plan
// arriba»): arriba el próximo control en una línea y tu plan por etapas, con la estrategia adentro
// («Cambiar el plan»: el objetivo, el peso meta, el ritmo y el plazo, y las metas de hoy); después el
// peso con su tendencia y la grasa corporal (o la invitación a medirla). Semana a semana, las medidas
// y el gasto con el balance quedan plegados en «Más datos». «Metas de hoy» abre las metas: quién las
// pone, cómo se reparten los macros y repartir la semana. Sin datos propios, la persona de ejemplo.

import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, LayoutAnimationConfig, ReduceMotion, useAnimatedRef, useAnimatedStyle, useReducedMotion, useScrollOffset, useSharedValue, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { rangoDeGrasa, ultimasMedidas } from '@/dominio/cuerpo';
import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { ESTILOS, EXTRAS, pisoDe, repartirSemana, type Macros } from '@/dominio/metas';
import { comidasParaElControl } from '@/dominio/registros';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { alTocarDeNuevo, useEsLaActual } from '../arriba';
import { PESTANAS } from '../Barra';
import { COLOR_DE_MACRO, Icono, MACROS, type Macro } from '../comida/comunes';
import { conSigno, fechaCorta, fechaDiaMes, numero, sistemaDe, useEstado, useNumeros } from '../comida/datos';
import { FranjaBajoLaHora } from '../franja';
import { usePersona } from '../ganchos';
import { Linea } from '../graficos/Graficos';
import type { VistaDelMas } from '../HojaMas';
import { ENTRA_FUNDIDO, ENTRA_PANEL, SALE_FUNDIDO, SALE_PANEL } from '../movimiento';
import { comidasDeEjemplo, type Persona } from '../persona';
import {
  Aparece, AvisoDeEjemplo, BotonChico, Cabecera, Carta, Chip, Cifra, ComoSeCalcula, Dias, Eje, EtiquetaDeGrupo, Nota, Parrafo, SEMANA, Segmento,
} from '../tarjetas';
import { tecladoDeNumeros } from '../teclado';
import { ElGasto, LasMedidas, MasDatos, Semanas } from './MasDatos';
import { calcularPlan, ElPlan, Flecha, LaEstrategia, MacrosEnLinea, SIN_ELEGIR, type EleccionDelPlazo } from './Plan';
import { unidades, type U } from './unidades';

type Props = { ancho: number; arriba: number; abajo: number; alAbrirMas: (vista: VistaDelMas) => void };

const PROGRESO = PESTANAS.indexOf('progreso');

export function PaginaDeProgreso({ ancho, arriba, abajo, alAbrirMas }: Props) {
  const [vista, setVista] = useState<'principal' | 'metas'>('principal');
  const reducido = useReducedMotion();
  const esLaActual = useEsLaActual(PROGRESO);
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  // Tocar otra vez la pestaña: desde las metas vuelve a Progreso; en Progreso, sube arriba de todo.
  useEffect(() => alTocarDeNuevo(PROGRESO, () => {
    if (vista === 'metas') setVista('principal');
    else scroll.current?.scrollTo({ y: 0, animated: !reducido });
  }), [vista, reducido, scroll]);
  // Progreso queda armado debajo de las metas, donde estaba y con lo que tenía abierto: se funde
  // mientras las metas entran de costado, y vuelve igual.
  const enMetas = useSharedValue(0);
  useEffect(() => {
    enMetas.set(withTiming(vista === 'metas' ? 1 : 0, { duration: vista === 'metas' ? 240 : 220, reduceMotion: ReduceMotion.Never }));
  }, [vista, enMetas]);
  const estiloPrincipal = useAnimatedStyle(() => ({ opacity: 1 - enMetas.get() }));
  const conMetas = vista === 'metas';
  const relleno = { paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 };
  return (
    <View style={{ width: ancho }}>
      <Animated.View
        style={[s.vista, estiloPrincipal]}
        pointerEvents={conMetas ? 'none' : 'auto'}
        accessibilityElementsHidden={conMetas}
        importantForAccessibility={conMetas ? 'no-hide-descendants' : 'auto'}
      >
        <ScrollView ref={scroll} contentContainerStyle={relleno} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets scrollsToTop={esLaActual && !conMetas} scrollEventThrottle={16}>
          <Principal ancho={ancho} alAbrirMas={alAbrirMas} alVerMetas={() => setVista('metas')} />
        </ScrollView>
        {/* Cada scroll con su franja: esta se funde con Progreso y la de las metas entra con su panel. */}
        <FranjaBajoLaHora scrollY={scrollY} arriba={arriba} />
      </Animated.View>
      {conMetas && (
        <Animated.View entering={reducido ? ENTRA_FUNDIDO : ENTRA_PANEL} exiting={reducido ? SALE_FUNDIDO : SALE_PANEL} style={StyleSheet.absoluteFill}>
          <ScrollDeMetas relleno={relleno} arriba={arriba} esLaActual={esLaActual} alVolver={() => setVista('principal')} />
        </Animated.View>
      )}
    </View>
  );
}

/** Las metas tienen su propio scroll (Progreso queda armado debajo, donde estaba), con su franja bajo la hora. */
function ScrollDeMetas({ relleno, arriba, esLaActual, alVolver }: { relleno: ViewStyle; arriba: number; esLaActual: boolean; alVolver: () => void }) {
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  return (
    <>
      <ScrollView ref={scroll} contentContainerStyle={relleno} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets scrollsToTop={esLaActual} scrollEventThrottle={16}>
        {/* Las metas entran enteras con su panel: lo de adentro no se funde además. */}
        <LayoutAnimationConfig skipEntering>
          <Metas alVolver={alVolver} />
        </LayoutAnimationConfig>
      </ScrollView>
      <FranjaBajoLaHora scrollY={scrollY} arriba={arriba} />
    </>
  );
}

function Principal({ ancho, alAbrirMas, alVerMetas }: { ancho: number; alAbrirMas: Props['alAbrirMas']; alVerMetas: () => void }) {
  const e = useEstado();
  const p = usePersona();
  const numeros = useNumeros();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cambiarPlan, setCambiarPlan] = useState(false);
  const [masDatos, setMasDatos] = useState(false);
  const [eleccion, setEleccion] = useState<EleccionDelPlazo>(SIN_ELEGIR);
  const alternar = (cual: string) => setAbierto((antes) => (antes === cual ? null : cual));
  const sistema = sistemaDe(e);
  const u = useMemo(() => unidades(sistema), [sistema]);
  const interior = ancho - 40 - 34;
  // Si entrena fuerza, de Perfil › Entrenamiento; sin decirlo, no se sabe y el plazo lo avisa.
  const fuerza = e.entreno ? e.entreno.tipo !== 'resistencia' : null;
  const calculo = useMemo(() => calcularPlan(p, e.hoy, eleccion, fuerza), [p, e.hoy, eleccion, fuerza]);
  // Desde cuándo va la línea del plan: la primera meta (la entrada) si hay tendencia ese día; si no, la primera pesada.
  const primera = [...p.tendencia.keys()][0] ?? e.hoy;
  const empezo = !p.deEjemplo ? e.metas[0]?.desde : undefined;
  const desde = empezo && p.tendencia.has(empezo) ? empezo : primera;
  const comidas = useMemo(() => (p.deEjemplo ? comidasDeEjemplo(e.hoy) : comidasParaElControl(e.registros.values())), [p.deEjemplo, e.hoy, e.registros]);
  return (
    <>
      <Cabecera fecha={fechaCorta(e.hoy)} titulo={t('progreso.titulo')} />
      {p.deEjemplo && <AvisoDeEjemplo texto={t('progreso.ejemplo')} />}
      <ControlCorto p={p} abierto={abierto === 'control'} alTocar={() => alternar('control')} />
      {calculo && (
        <ElPlan p={p} calculo={calculo} hoy={e.hoy} desde={desde} u={u} abierto={abierto} alternar={alternar} cambiarPlan={cambiarPlan} alCambiarPlan={() => setCambiarPlan((x) => !x)}>
          <LaEstrategia p={p} calculo={calculo} hoy={e.hoy} u={u} numeros={numeros} abierto={abierto} alternar={alternar} eleccion={eleccion} alElegir={setEleccion} alVerMetas={alVerMetas} />
        </ElPlan>
      )}
      <ElPeso p={p} hoy={e.hoy} u={u} ancho={interior} alRegistrar={() => alAbrirMas('peso')} />
      <LaGrasa p={p} abierto={abierto === 'grasa'} alAbrir={() => alternar('grasa')} alMedir={() => alAbrirMas('medidas')} />
      <MasDatos abierto={masDatos} alTocar={() => setMasDatos((x) => !x)}>
        <Semanas p={p} hoy={e.hoy} comidas={comidas} ancho={interior} u={u} numeros={numeros} />
        <LasMedidas p={p} hoy={e.hoy} sistema={sistema} alMedir={() => alAbrirMas('medidas')} />
        {numeros && <ElGasto p={p} u={u} abierto={abierto === 'gasto'} alAbrir={() => alternar('gasto')} />}
      </MasDatos>
    </>
  );
}

// ------------------------------------------------------------------ el próximo control, en una línea
// Arriba de todo (lo pediste el 2/11/2026): cuándo, cómo viene y lo que le falta, en corto. Tocándolo
// se abre lo demás: qué pasa ese día y qué día de la semana se hace.
function ControlCorto({ p, abierto, alTocar }: { p: Persona; abierto: boolean; alTocar: () => void }) {
  const ec = p.estadoControl;
  if (!ec) return null;
  // Mientras quedan días antes del control, todavía puede llegar: está en curso, no le falta nada.
  const quedan = Math.max(0, ec.faltan - 1);
  // Con el tramo corto (la primera semana), ese control no mide aunque lleguen los datos.
  const estado = ec.alcanza ? 'alcanza' : !ec.tramoCorto && ec.diasConComida + quedan >= ec.minimos.diasConComida ? 'enCurso' : 'faltanDatos';
  const cuando = ec.faltan === 0 ? t('progreso.hoy') : ec.faltan === 1 ? t('progreso.manana') : t('progreso.enDias', { n: ec.faltan });
  // «2 de 4 días con comida · pesada ✓»: lo que tiene, en corto, y lo cumplido con su marca.
  const comida = ec.diasConComida >= ec.minimos.diasConComida ? t('progreso.control.comidaLista') : t('progreso.control.comida', { n: ec.diasConComida, min: ec.minimos.diasConComida });
  const pesadas = ec.pesadas >= ec.minimos.pesadas ? t('progreso.control.pesadaLista') : t('progreso.control.pesada');
  return (
    <Carta estilo={s.control}>
      <Pressable onPress={alTocar} style={({ pressed }) => [s.controlFila, pressed && { opacity: 0.75 }]} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Icono nombre="clock" tam={18} />
        <View style={s.controlTextos}>
          <Text style={s.controlTitulo}>{t('progreso.control.titulo', { dia: lista('fecha.dias')[diaDeLaSemana(ec.fecha)], cuando })}</Text>
          <Text style={s.controlRequisitos}>{`${comida} · ${pesadas}`}</Text>
        </View>
        <Chip texto={t(`progreso.${estado}`)} tipo={estado === 'alcanza' ? 'bien' : estado === 'faltanDatos' ? 'atencion' : undefined} />
        <Flecha abierta={abierto} grados={180} tam={13} color="rgba(239, 230, 207, 0.4)" />
      </Pressable>
      {abierto && (
        <Aparece style={s.controlDentro}>
          <Parrafo>{estado === 'faltanDatos' && ec.tramoCorto ? t('progreso.controlPrimero') : t(`progreso.control.textos.${estado}`)}</Parrafo>
          <EtiquetaDeGrupo>{t('progreso.diaDelControl')}</EtiquetaDeGrupo>
          <Dias elegidos={[p.diaDelControl]} uno alTocar={(d) => elAlmacen().ponerEstrategia({ diaDelControl: d })} />
          <Parrafo chico>{t('progreso.diaDelControlNota')}</Parrafo>
        </Aparece>
      )}
    </Carta>
  );
}

// ------------------------------------------------------------------ el peso
type Rango = 'mes' | 'tresMeses' | 'todo';
const DIAS_DEL_RANGO: Record<Rango, number> = { mes: 30, tresMeses: 90, todo: 0 };

/** Cuánto se mira para atrás: un segmento chico, del ancho de lo que dice. */
function Rangos({ elegido, alElegir }: { elegido: Rango; alElegir: (r: Rango) => void }) {
  return (
    <View style={s.rangos} accessibilityRole="radiogroup">
      {(['mes', 'tresMeses', 'todo'] as const).map((r) => (
        <Pressable
          key={r}
          onPress={() => {
            if (r !== elegido) Haptics.selectionAsync().catch(() => {});
            alElegir(r);
          }}
          style={({ pressed }) => [s.rango, r === elegido && s.rangoElegido, pressed && r !== elegido && { opacity: 0.6 }]}
          hitSlop={{ top: 6, bottom: 6 }}
          accessibilityRole="radio"
          accessibilityState={{ selected: r === elegido }}
        >
          <Text style={[s.rangoTexto, r === elegido && s.rangoTextoElegido]} numberOfLines={1}>{t(`progreso.graficos.rangos.${r}`)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ElPeso({ p, hoy, u, ancho, alRegistrar }: { p: Persona; hoy: ClaveDia; u: U; ancho: number; alRegistrar: () => void }) {
  const [rango, setRango] = useState<Rango>('tresMeses');
  // Los últimos días del rango (con lo que haya), con la pesada de cada día y la tendencia.
  const { serie, dias } = useMemo(() => {
    const primero = [...p.tendencia.keys()][0] ?? hoy;
    const hay = diasEntre(primero, hoy) + 1;
    const pedido = DIAS_DEL_RANGO[rango];
    const n = Math.max(2, pedido ? Math.min(pedido, hay) : hay);
    const porFecha = new Map(p.pesos.map((x) => [x.fecha, x.kg]));
    return {
      dias: n,
      serie: Array.from({ length: n }, (_, i) => {
        const f = sumarDias(hoy, i - n + 1);
        return { x: i / (n - 1), punto: porFecha.get(f) ?? null, linea: p.tendencia.get(f) ?? null };
      }),
    };
  }, [p.tendencia, p.pesos, hoy, rango]);
  // Con una sola pesada no hay línea: era un punto suelto en un gráfico vacío.
  const conLinea = p.pesos.length >= 2;
  return (
    <Carta titulo={t('progreso.peso')} derecha={<BotonChico texto={t('progreso.registrar')} icono="plus" alTocar={alRegistrar} />}>
      <Cifra valor={p.pesoHoy === null ? '—' : u.peso(p.pesoHoy)} texto={`${u.unidad} · ${t('progreso.tendencia')}`} />
      {p.cambio7 !== null && (
        <Nota>{t('progreso.cambios', { semana: conSigno(u.enUnidad(p.cambio7), 1), mes: p.cambio30 === null ? '—' : conSigno(u.enUnidad(p.cambio30), 1), unidad: u.unidad })}</Nota>
      )}
      {conLinea ? (
        <Aparece>
          <Rangos elegido={rango} alElegir={setRango} />
          {/* Otro rango es otro gráfico: entra con un fundido. */}
          <Animated.View key={rango} entering={FadeIn.duration(260).reduceMotion(ReduceMotion.Never)} style={s.grafico}>
            <Linea serie={serie} ancho={ancho} alto={92} meta={calculoDeMeta(p)} />
            <Eje izquierda={fechaDiaMes(sumarDias(hoy, -(dias - 1)))} derecha={t('progreso.hoy')} />
          </Animated.View>
          <Parrafo chico>{t('progreso.pesoLeyenda')}</Parrafo>
        </Aparece>
      ) : (
        <Aparece>
          <Parrafo chico>{t('progreso.unaPesada')}</Parrafo>
        </Aparece>
      )}
    </Carta>
  );
}

/** La meta punteada del gráfico: solo si se va a algún lado. */
const calculoDeMeta = (p: Persona) => (p.perfil.objetivo !== 'mantener' && !(p.perfil.objetivo === 'bajar' && p.perfil.sinDeficit) ? (p.perfil.pesoMeta ?? null) : null);

// ------------------------------------------------------------------ la grasa corporal
// En el medio de Progreso. Sin medidas, invita a medirla una vez, con lo que hace falta y que es una
// estimación (lo pediste el 2/11/2026: casi nadie se mide seguido, y que no genere desconfianza).
function LaGrasa({ p, abierto, alAbrir, alMedir }: { p: Persona; abierto: boolean; alAbrir: () => void; alMedir: () => void }) {
  const r = p.grasa;
  if (!r) {
    return (
      <Carta titulo={t('progreso.grasa')}>
        <Text style={s.invitaTitulo}>{t('progreso.grasaInvita.titulo')}</Text>
        <Parrafo>{t(p.perfil.sexo === 'm' ? 'progreso.grasaInvita.textoHombre' : 'progreso.grasaInvita.textoMujer')}</Parrafo>
        <Pressable onPress={alMedir} style={({ pressed }) => [s.invitaBoton, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <Icono nombre="ruler" tam={16} />
          <Text style={s.invitaBotonTexto}>{t('progreso.grasaInvita.boton')}</Text>
        </Pressable>
        <Text style={s.invitaNota}>{t('progreso.grasaInvita.confianza')}</Text>
      </Carta>
    );
  }
  // Cómo vino cambiando: el rango de cada vez que se midió.
  const historia = [...p.medidas]
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    .flatMap((m) => {
      const x = rangoDeGrasa(p.perfil.sexo, p.perfil.alturaCm, ultimasMedidas(p.medidas, m.fecha));
      return x ? [{ fecha: m.fecha, ...x }] : [];
    });
  return (
    <Carta titulo={t('progreso.grasa')} derecha={<BotonChico texto={t('progreso.medir')} icono="ruler" alTocar={alMedir} />}>
      <Cifra valor={t('cuerpo.rango', { desde: r.desde, hasta: r.hasta })} texto={t('cuerpo.estimacion')} />
      <Text style={s.aviso}>{t('progreso.grasaInvita.confianza')}</Text>
      {historia.length > 0 && (
        <View style={s.historia}>
          {historia.map((h) => (
            <View key={h.fecha} style={s.historiaChip}>
              <Text style={s.historiaFecha}>{fechaDiaMes(h.fecha)}</Text>
              <Text style={s.historiaRango}>{t('cuerpo.rangoCorto', { desde: h.desde, hasta: h.hasta })}</Text>
            </View>
          ))}
        </View>
      )}
      <ComoSeCalcula abierto={abierto} alTocar={alAbrir}>
        <Parrafo>{t(p.perfil.sexo === 'm' ? 'cuerpo.comoSeEstimaHombre' : 'cuerpo.comoSeEstimaMujer')}</Parrafo>
      </ComoSeCalcula>
    </Carta>
  );
}

// ------------------------------------------------------------------ las metas
function Metas({ alVolver }: { alVolver: () => void }) {
  const e = useEstado();
  const p = usePersona();
  const almacen = elAlmacen();
  const ultima = e.metas[e.metas.length - 1];
  const quien = ultima?.motivo === 'manual' ? 'mano' : 'moss';
  const m = p.meta ?? { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  const semana = p.perfil.semana;
  const estilo = p.perfil.estilo ?? 'equilibrada';
  // A mano, por debajo del piso no se guarda (motivoParaNo): se dice por qué, al terminar de escribir.
  // Mientras se escribe pasa por números que no van («1» camino a «150»): esos no lo dicen.
  const [bajoElPiso, setBajoElPiso] = useState(false);
  const aMano = (macros: Omit<Macros, 'kcal'>, alTerminar: boolean) => {
    const guardada = almacen.ponerMetasAMano(macros) !== null;
    if (guardada || alTerminar) setBajoElPiso(!guardada);
    if (!guardada && alTerminar) anunciar(t('progreso.limites.piso', { n: numero(pisoDe(p.perfil.sexo)) }));
    return guardada;
  };
  const cambiarAltos = (d: DiaSemana) => {
    if (!semana) return;
    const altos = semana.altos.includes(d) ? semana.altos.filter((x) => x !== d) : [...semana.altos, d];
    // Un día alto al menos, y no todos: si no, no hay nada que repartir.
    if (altos.length >= 1 && altos.length <= 6) almacen.ponerEstrategia({ semana: { ...semana, altos } });
  };
  return (
    <>
      <View style={s.metasCab}>
        <Pressable onPress={alVolver} style={({ pressed }) => [s.atras, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={t('comun.atras')} hitSlop={6}>
          <Icono nombre="chevron.left" tam={20} color={colores.pergamino} />
        </Pressable>
        <Text style={s.metasTitulo}>{t('progreso.metas.titulo')}</Text>
      </View>
      {p.deEjemplo && <AvisoDeEjemplo texto={t('progreso.ejemplo')} />}
      <View style={s.heroe}>
        <Text style={s.heroeNumero}>{numero(m.kcal)}</Text>
        <Text style={s.heroeTexto}>{t('progreso.metas.porDia')}</Text>
        <MacrosEnLinea meta={m} />
      </View>

      <EtiquetaDeGrupo>{t('progreso.metas.quien')}</EtiquetaDeGrupo>
      <Segmento<'moss' | 'mano'>
        opciones={[['moss', t('progreso.metas.moss')], ['mano', t('progreso.metas.aMano')]]}
        elegida={quien}
        alElegir={(q) => {
          if (q === quien) return;
          if (q === 'moss') almacen.metasDeMoss();
          // Con las kcal de Moss: los gramos redondeados pueden sumar 1 o 2 kcal menos y quedar bajo el piso.
          else almacen.ponerMetasAMano({ proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas, kcal: m.kcal });
        }}
      />
      <Parrafo chico>{t(quien === 'moss' ? 'progreso.metas.mossTexto' : 'progreso.metas.aManoTexto')}</Parrafo>

      {quien === 'moss' ? (
        <Aparece key="moss">
          <EtiquetaDeGrupo>{t('progreso.metas.reparto')}</EtiquetaDeGrupo>
          <View style={s.estilos}>
            {ESTILOS.map((x, i) => {
              const [nombre, texto] = lista(`progreso.metas.estilos.${x}`);
              const elegido = x === estilo;
              return (
                <Pressable
                  key={x}
                  onPress={() => {
                    if (!elegido) Haptics.selectionAsync().catch(() => {});
                    almacen.ponerEstrategia({ estilo: x });
                  }}
                  style={({ pressed }) => [s.estilo, i > 0 && s.estiloSeparado, pressed && !elegido && { opacity: 0.7 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: elegido }}
                >
                  <View style={[s.radio, elegido && s.radioElegido]}>{elegido && <View style={s.radioPunto} />}</View>
                  <View style={s.estiloTextos}>
                    <Text style={s.estiloNombre}>{nombre}</Text>
                    <Text style={s.estiloTexto}>{texto}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Aparece>
      ) : (
        <Aparece key="aMano">
          <EtiquetaDeGrupo>{t('progreso.metas.tusMacros')}</EtiquetaDeGrupo>
          {MACROS.map((macro) => (
            <CampoDeMacro key={macro} macro={macro} gramos={m[macro]} alCambiar={(g, alTerminar) => aMano({ proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas, [macro]: g }, alTerminar)} />
          ))}
          {bajoElPiso && (
            <Aparece>
              <Parrafo chico>{t('progreso.limites.piso', { n: numero(pisoDe(p.perfil.sexo)) })}</Parrafo>
            </Aparece>
          )}
        </Aparece>
      )}

      <View style={s.semana}>
        <View style={s.llave}>
          <Text style={s.llaveTexto}>{t('progreso.metas.semana')}</Text>
          <Switch
            value={!!semana}
            onValueChange={(si) => almacen.ponerEstrategia({ semana: si ? { altos: [6, 0], extra: 300 } : undefined })}
            trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }}
            thumbColor={colores.pergamino}
            accessibilityLabel={t('progreso.metas.semana')}
          />
        </View>
        <Parrafo chico>{t('progreso.metas.semanaTexto')}</Parrafo>
        {semana && (
          <Aparece>
            <Dias elegidos={semana.altos} alTocar={cambiarAltos} />
            <Segmento<number> opciones={EXTRAS.map((n) => [n, `+${numero(n)}`] as const)} elegida={semana.extra} alElegir={(extra) => almacen.ponerEstrategia({ semana: { ...semana, extra } })} />
            <Barras reparto={repartirSemana(m, semana.altos, semana.extra, p.perfil.sexo)} altos={semana.altos} />
          </Aparece>
        )}
      </View>
    </>
  );
}

/** Lo que espera lo escrito en un macro antes de guardarse. */
const ESPERA_AL_ESCRIBIR = 600;

/**
 * Un macro a mano: se guarda mientras se escribe, después de una espera corta, y al salir del campo.
 * Así lo escrito no se pierde si la pantalla se va antes (con «Atrás» y el teclado arriba).
 */
function CampoDeMacro({ macro, gramos, alCambiar }: { macro: Macro; gramos: number; alCambiar: (g: number, alTerminar: boolean) => boolean }) {
  const [texto, setTexto] = useState(String(gramos));
  // Lo último que se guardó desde acá: si llega otro valor (las metas de Moss, otro teléfono), el campo lo muestra.
  const [propio, setPropio] = useState(gramos);
  const [antes, setAntes] = useState(gramos);
  if (gramos !== antes) {
    setAntes(gramos);
    if (gramos !== propio) setTexto(String(gramos));
  }
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Lo escrito que todavía espera, y lo de este render para guardarlo cuando llegue la hora.
  const pendiente = useRef<string | null>(null);
  const actual = useRef({ gramos, alCambiar });
  useEffect(() => {
    actual.current = { gramos, alCambiar };
  });
  const guardar = useCallback((escrito: string, alTerminar: boolean): boolean => {
    clearTimeout(espera.current);
    pendiente.current = null;
    // Vacío no es cero.
    const g = escrito.trim() ? Math.round(Number(escrito.replace(',', '.'))) : Number.NaN;
    if (!(Number.isFinite(g) && g >= 0 && g <= 1000)) return false;
    if (g === actual.current.gramos) return true;
    if (!actual.current.alCambiar(g, alTerminar)) return false;
    setPropio(g);
    return true;
  }, []);
  const guardarLoPendiente = useCallback(() => {
    if (pendiente.current !== null) guardar(pendiente.current, true);
  }, [guardar]);
  useEffect(() => guardarLoPendiente, [guardarLoPendiente]);
  return (
    <View style={s.campo}>
      <View style={[s.campoPunto, { backgroundColor: COLOR_DE_MACRO[macro] }]} />
      <Text style={s.campoNombre}>{t(`comida.${macro}`)}</Text>
      <TextInput
        value={texto}
        onChangeText={(x) => {
          setTexto(x);
          pendiente.current = x;
          clearTimeout(espera.current);
          espera.current = setTimeout(() => guardar(x, false), ESPERA_AL_ESCRIBIR);
        }}
        // Lo que no se pudo guardar (bajo el piso, o sin número) no queda escrito: vuelve a lo que había.
        onEndEditing={() => {
          if (!guardar(texto, true)) setTexto(String(gramos));
        }}
        keyboardType="number-pad"
        {...tecladoDeNumeros()}
        selectTextOnFocus
        maxLength={4}
        selectionColor={colores.oro}
        style={s.campoValor}
        accessibilityLabel={t(`comida.${macro}`)}
      />
      <Text style={s.campoUnidad}>g</Text>
    </View>
  );
}

/** La semana repartida: cada día con sus kcal; los altos, en oro. */
function Barras({ reparto, altos }: { reparto: Record<DiaSemana, Macros>; altos: readonly DiaSemana[] }) {
  const maximo = Math.max(...SEMANA.map((d) => reparto[d].kcal));
  return (
    <View style={s.barras}>
      {SEMANA.map((d) => (
        <View key={d} style={s.barra}>
          {/* Siete columnas en el ancho de la pantalla: con el texto grande, las kcal crecen poco. */}
          <Text style={s.barraKcal} maxFontSizeMultiplier={1.2}>{numero(reparto[d].kcal)}</Text>
          <View style={s.barraPista}>
            <View style={[s.barraLlena, { height: `${(reparto[d].kcal / maximo) * 100}%` }, altos.includes(d) && s.barraAlta]} />
          </View>
          <Text style={s.barraDia} maxFontSizeMultiplier={1.2}>{lista('fecha.diasCortos')[d].charAt(0)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  vista: { flex: 1 },
  control: { paddingTop: 2, paddingBottom: 2, paddingHorizontal: 14, gap: 0 },
  controlFila: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  controlTextos: { flex: 1, gap: 3, minWidth: 0 },
  controlTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, lineHeight: 18, color: colores.pergamino },
  controlRequisitos: { fontFamily: letras.texto, fontSize: 12, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  controlDentro: { paddingBottom: 12 },
  rangos: { alignSelf: 'flex-start', flexDirection: 'row', gap: 4, padding: 4, marginTop: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  rango: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999 },
  rangoElegido: { backgroundColor: 'rgba(239, 230, 207, 0.1)' },
  rangoTexto: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.6)' },
  rangoTextoElegido: { color: colores.pergamino },
  grafico: { marginTop: 8, gap: 4 },
  invitaTitulo: { fontFamily: letras.numeroMedio, fontSize: 18, lineHeight: 22, color: colores.pergamino },
  invitaBoton: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.45)', backgroundColor: 'rgba(232, 196, 106, 0.1)',
  },
  invitaBotonTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: colores.oroClaro },
  invitaNota: { fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
  aviso: {
    marginTop: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)',
    fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.66)', overflow: 'hidden',
  },
  historia: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  historiaChip: { gap: 3, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  historiaFecha: { fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.48)' },
  historiaRango: { fontFamily: letras.numeroMedio, fontSize: 13, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  metasCab: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -12, marginTop: -6 },
  atras: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  metasTitulo: { fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  heroe: { marginTop: 18, gap: 6 },
  heroeNumero: { fontFamily: letras.numeroLiviano, fontSize: 52, lineHeight: 54, letterSpacing: -1, color: colores.cifra, fontVariant: ['tabular-nums'] },
  heroeTexto: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  estilos: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  estilo: { flexDirection: 'row', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
  estiloSeparado: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  radio: { marginTop: 3, width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.35)', alignItems: 'center', justifyContent: 'center' },
  radioElegido: { borderColor: colores.oro },
  radioPunto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.oro },
  estiloTextos: { flex: 1, gap: 3 },
  estiloNombre: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  estiloTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.6)' },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  campoPunto: { width: 7, height: 7, borderRadius: 3.5 },
  campoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  campoValor: { minWidth: 70, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(239, 230, 207, 0.06)', textAlign: 'right', fontFamily: letras.numero, fontSize: 17, color: colores.cifra },
  campoUnidad: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.55)' },
  semana: { marginTop: 26, gap: 6, paddingBottom: 8 },
  llave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  llaveTexto: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  barras: { marginTop: 14, height: 128, flexDirection: 'row', gap: 8 },
  barra: { flex: 1, alignItems: 'center', gap: 6 },
  barraKcal: { fontFamily: letras.numero, fontSize: 10, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'] },
  barraPista: { flex: 1, width: '100%', maxWidth: 22, justifyContent: 'flex-end' },
  barraLlena: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: 'rgba(239, 230, 207, 0.18)' },
  barraAlta: { backgroundColor: colores.oro },
  barraDia: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.55)' },
});
