// La pestaña Comida, como en la galería (galeria/src/comida.js): arriba la tira de la semana, con
// una luna chica por día que se toca para verlo; un cuadro que se desliza del día a la semana y al
// mes, como MacroFactor; y abajo, la línea del día con sus comidas a la hora en que se comieron.
// Lo que queda, con la luna grande, está en Inicio; el peso y el gasto, en Progreso.

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { conMayuscula } from '@/comida/buscar';
import { comidaDeLaHora, type Comida } from '@/dominio/comidas';
import { diasEntre, lunesDe, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { estadoDeMacro, type Macros } from '@/dominio/metas';
import { delDia, type Registro, type Valores } from '@/dominio/registros';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { HojaModal } from '../HojaModal';
import { entre, viaje } from '../movimiento';
import { AvisoAbajo, Boton, COLOR_DE_MACRO, Etiqueta, Icono, MACROS, Punto, type Aviso, type Macro } from './comunes';
import { borrarFoto, fotoDe, hayFotos, sacarFoto } from './fotos';
import {
  cantidadDeTexto, comidasDelDia, fechaCorta, gramosDeMacro, hora, HORA_TIPICA, letraDelDia, metaDelDia, minutosDe, numero, sistemaDe, tituloDelDia, totalDe,
  useEstado, type ComidaDelDia,
} from './datos';
import { Luna, Lunitas, type Lunita } from './Luna';
import { abrirRegistro } from './registro';

const VISTAS = ['dia', 'semana', 'mes'] as const;
type Vista = (typeof VISTAS)[number];

/** El día de un instante de la meta y lo comido, para la luna: llena es la meta. */
function lunitaDe(e: Estado, dia: ClaveDia): Lunita {
  const registros = delDia(e.registros.values(), dia);
  const plan = registros.some((r) => r.planificado);
  const estado = dia > e.hoy && !plan ? 'futuro' : registros.length ? (plan ? 'plan' : 'comido') : 'vacio';
  const meta = metaDelDia(e, dia) ?? metaDelDia(e, e.hoy);
  const kcal = totalDe(e.registros, dia, e.hoy).kcal;
  return { estado, fraccion: meta ? kcal / meta.kcal : registros.length ? 1 : 0 };
}

export function PaginaDeComida({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  const [elegido, setElegido] = useState<ClaveDia | null>(null);
  const [vista, setVista] = useState<Vista>('dia');
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // Sin elegir, hoy: así, al cambiar el día a la medianoche, la pestaña sigue en hoy.
  const dia = elegido ?? e.hoy;
  const anchoCuadro = ancho - 40;

  const verDia = (d: ClaveDia) => {
    Haptics.selectionAsync().catch(() => {});
    setElegido(d === e.hoy ? null : d);
    setVista('dia');
  };
  const avisar = (texto: string, deshacer?: () => void) => setAviso((antes) => ({ texto, deshacer, vez: (antes?.vez ?? 0) + 1 }));

  return (
    <View style={{ width: ancho }}>
      <ScrollView
        style={estilos.lleno}
        contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.fecha}>{fechaCorta(dia)}</Text>
        <Text style={estilos.titulo}>{tituloDelDia(dia, e.hoy)}</Text>
        <TiraDeLaSemana e={e} dia={dia} alElegir={verDia} />
        <Cuadro ancho={anchoCuadro} vista={vista} alCambiar={setVista}>
          <PaginaDelDia e={e} dia={dia} />
          <PaginaDeLaSemana e={e} dia={dia} alElegir={verDia} />
          <PaginaDelMes e={e} dia={dia} ancho={anchoCuadro} alElegir={verDia} />
        </Cuadro>
        <View style={estilos.puntos}>
          {VISTAS.map((v) => (
            <Pressable key={v} onPress={() => setVista(v)} style={estilos.punto} accessibilityRole="button" accessibilityState={{ selected: v === vista }}>
              <View style={[estilos.puntoMarca, v === vista && estilos.puntoMarcaElegido]} />
              <Text style={[estilos.puntoTexto, v === vista && estilos.puntoTextoElegido]}>{t(`comida.vistas.${v}`)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={estilos.seccion}>{t('comida.tuDia')}</Text>
        {dia > e.hoy && <Text style={estilos.nota}>{t('comida.planificadoTexto')}</Text>}
        {!metaDelDia(e, dia) && <Text style={estilos.nota}>{t('comida.sinMeta')}</Text>}
        <LineaDelDia e={e} dia={dia} />
        <AccionesDelDia e={e} dia={dia} avisar={avisar} />
      </ScrollView>
      <AvisoAbajo aviso={aviso} alIrse={() => setAviso(null)} abajo={abajo + 16} />
    </View>
  );
}

// ------------------------------------------------------------------ la tira de la semana
function TiraDeLaSemana({ e, dia, alElegir }: { e: Estado; dia: ClaveDia; alElegir: (d: ClaveDia) => void }) {
  const [ancho, setAncho] = useState(0);
  const lunes = lunesDe(dia);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  return (
    <View style={estilos.tira} onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)}>
      {dias.map((d) => (
        <Pressable
          key={d}
          onPress={() => alElegir(d)}
          style={[estilos.tiraDia, d === dia && estilos.tiraDiaElegido]}
          accessibilityRole="button"
          accessibilityLabel={fechaCorta(d)}
          accessibilityState={{ selected: d === dia }}
        >
          <Text style={estilos.tiraLetra}>{letraDelDia(d)}</Text>
          <View style={estilos.tiraLugar} />
          <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]}>{partesDe(d).dia}</Text>
        </Pressable>
      ))}
      <View style={estilos.tiraLunas} pointerEvents="none">
        <Lunitas lunas={dias.map((d) => lunitaDe(e, d))} ancho={ancho} tam={24} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ el cuadro que se desliza
/**
 * Con el dedo de costado se pasa del día a la semana y al mes; en los bordes cede un cuarto, como
 * las pestañas. El alto sigue a la página que se ve. El gesto que empieza en el cuadro es del cuadro.
 */
function Cuadro({ ancho, vista, alCambiar, children }: { ancho: number; vista: Vista; alCambiar: (v: Vista) => void; children: React.ReactNode[] }) {
  const pos = useSharedValue(VISTAS.indexOf(vista));
  const desde = useSharedValue(0);
  const altos = useSharedValue<number[]>([0, 0, 0]);
  // La vista cambia también desde los puntos de abajo o al tocar un día: el cuadro va solo.
  useEffect(() => {
    pos.set(viaje(VISTAS.indexOf(vista)));
  }, [pos, vista]);
  const cambiar = (i: number) => alCambiar(VISTAS[i]);
  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      desde.set(Math.round(pos.get()));
    },
    onUpdate: (ev) => {
      'worklet';
      let p = desde.get() - ev.translationX / ancho;
      if (p < 0) p *= 0.25;
      if (p > 2) p = 2 + (p - 2) * 0.25;
      pos.set(p);
    },
    onDeactivate: (ev) => {
      'worklet';
      const i = desde.get();
      const pasa = Math.abs(ev.translationX) > ancho * 0.2 || Math.abs(ev.velocityX) > 350;
      const destino = entre(pasa ? i + (ev.translationX < 0 ? 1 : -1) : i, 0, 2);
      pos.set(viaje(destino));
      scheduleOnRN(cambiar, destino);
    },
  });
  const estiloTira = useAnimatedStyle(() => ({ transform: [{ translateX: -pos.get() * ancho }] }));
  const estiloAlto = useAnimatedStyle(() => {
    const a = altos.get();
    const p = entre(pos.get(), 0, 2);
    const i = Math.floor(p);
    const f = p - i;
    const alto = a[i] * (1 - f) + a[Math.min(2, i + 1)] * f;
    return alto ? { height: alto } : {};
  });
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[estilos.cuadro, estiloAlto]}>
        <Animated.View style={[estilos.cuadroTira, { width: ancho * 3 }, estiloTira]}>
          {children.map((pagina, i) => (
            <View
              key={i}
              style={[estilos.pagina, { width: ancho }]}
              onLayout={(ev) => {
                const alto = ev.nativeEvent.layout.height;
                const a = [...altos.get()];
                a[i] = alto;
                altos.set(a);
              }}
            >
              {pagina}
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/** Las barras de proteína, carbohidratos y grasas contra su meta. En un día, cada punto brilla al cumplir y tiembla si se pasa por mucho. */
export function BarrasDeMacros({ comido, meta, conEstado }: { comido: Pick<Valores, Macro>; meta: Macros | null; conEstado: boolean }) {
  return (
    <View style={estilos.macros}>
      {MACROS.map((m) => {
        const objetivo = meta?.[m] ?? 0;
        const estado = conEstado && meta ? estadoDeMacro(comido[m], objetivo) : 'falta';
        const lleno = objetivo ? Math.min(1, comido[m] / objetivo) : 0;
        return (
          <View key={m} style={estilos.macro}>
            <View style={estilos.macroNombre}>
              <View style={{ opacity: estado === 'falta' ? 0.55 : 1 }}>
                <Punto macro={m} />
              </View>
              <Text style={estilos.macroNombreTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t(`comida.${m}`)}</Text>
            </View>
            <Text style={estilos.macroCifra}>{meta ? t('comida.gramosDe', { n: numero(Math.round(comido[m])), meta: numero(meta[m]) }) : `${numero(Math.round(comido[m]))} g`}</Text>
            <View style={estilos.barra}>
              <View style={[estilos.barraLlena, { width: `${lleno * 100}%`, backgroundColor: COLOR_DE_MACRO[m], opacity: estado === 'falta' ? 0.75 : 1 }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PaginaDelDia({ e, dia }: { e: Estado; dia: ClaveDia }) {
  const meta = metaDelDia(e, dia);
  const comido = totalDe(e.registros, dia, e.hoy);
  const queda = meta ? meta.kcal - comido.kcal : 0;
  let linea = '';
  if (dia === e.hoy && meta) linea = t(queda >= 0 ? 'comida.quedanKcal' : 'comida.deMasKcal', { n: numero(Math.abs(Math.round(queda))) });
  else if (dia > e.hoy) linea = t('comida.planificado');
  return (
    <View>
      <View style={estilos.resumen}>
        <View style={estilos.resumenLuna}>
          <Luna tam={64} fraccion={meta ? comido.kcal / meta.kcal : 0} />
        </View>
        <View style={estilos.resumenTextos}>
          <Text style={estilos.resumenCifra}>
            {numero(Math.round(comido.kcal))}
            {meta && <Text style={estilos.resumenDe}>{`  ${t('comida.deMetaCorto', { meta: numero(meta.kcal) })}`}</Text>}
          </Text>
          {linea ? <Text style={[estilos.resumenLinea, dia === e.hoy && queda < 0 && estilos.deMas]}>{linea}</Text> : null}
        </View>
      </View>
      <BarrasDeMacros comido={comido} meta={meta} conEstado={dia <= e.hoy} />
    </View>
  );
}

type Promedio = { n: number } & Pick<Valores, 'kcal' | Macro>;
/** El promedio de los días que ya terminaron y tienen algo registrado. */
function promedioDe(e: Estado, dias: ClaveDia[]): Promedio {
  const validos = dias.filter((d) => d < e.hoy && delDia(e.registros.values(), d).some((r) => !r.planificado));
  const p: Promedio = { n: validos.length, kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  for (const d of validos) {
    const t2 = totalDe(e.registros, d, e.hoy);
    p.kcal += t2.kcal / validos.length;
    for (const m of MACROS) p[m] += t2[m] / validos.length;
  }
  return p;
}

function CabezaDePromedio({ titulo, fechas, promedio, dias, meta }: { titulo: string; fechas: string; promedio: Promedio; dias: number; meta: Macros | null }) {
  return (
    <View>
      <View style={estilos.paginaCabeza}>
        <Text style={estilos.paginaTitulo}>{titulo}</Text>
        <Text style={estilos.paginaFechas}>{fechas}</Text>
      </View>
      <Etiqueta>{t('comida.promedio')}</Etiqueta>
      {promedio.n ? (
        <>
          <Text style={estilos.promedioCifra}>
            {numero(Math.round(promedio.kcal))}
            <Text style={estilos.promedioUnidad}>{` ${t('comida.kcal')}`}</Text>
          </Text>
          <Text style={estilos.promedioNota}>{[meta ? t('comida.metaDe', { n: numero(meta.kcal) }) : null, t('comida.diasRegistrados', { n: promedio.n, total: dias })].filter(Boolean).join(' · ')}</Text>
          <BarrasDeMacros comido={promedio} meta={meta} conEstado={false} />
        </>
      ) : (
        <Text style={estilos.promedioNota}>{t('comida.sinRegistros')}</Text>
      )}
    </View>
  );
}

function PaginaDeLaSemana({ e, dia, alElegir }: { e: Estado; dia: ClaveDia; alElegir: (d: ClaveDia) => void }) {
  const lunes = lunesDe(dia);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const desde = partesDe(lunes);
  const hasta = partesDe(dias[6]);
  const meta = metaDelDia(e, dias[6] < e.hoy ? dias[6] : e.hoy);
  const titulo = lunes === lunesDe(e.hoy) ? t('comida.estaSemana') : t('comida.semanaDel', { num: desde.dia, mes: lista('fecha.mesesCortos')[desde.mes] });
  return (
    <View>
      <CabezaDePromedio
        titulo={titulo}
        fechas={t('comida.rangoSemana', { desde: desde.dia, hasta: hasta.dia, mes: lista('fecha.mesesCortos')[hasta.mes] })}
        promedio={promedioDe(e, dias)}
        dias={dias.filter((d) => d < e.hoy).length}
        meta={meta}
      />
      <View style={estilos.grafica}>
        {/* La meta va a 100 de los 120 que mide cada barra: lo que pasa de ahí no cambia la lectura. */}
        <View style={estilos.graficaMeta} pointerEvents="none" />
        {dias.map((d) => {
          const total = totalDe(e.registros, d, e.hoy);
          const m = metaDelDia(e, d) ?? meta;
          const plan = delDia(e.registros.values(), d).some((r) => r.planificado);
          const alto = (v: number, objetivo: number | undefined) => `${(Math.min(1.2, objetivo ? v / objetivo : 0) / 1.2) * 100}%` as const;
          return (
            <Pressable key={d} onPress={() => alElegir(d)} style={estilos.graficaDia} accessibilityRole="button" accessibilityLabel={fechaCorta(d)}>
              <View style={[estilos.graficaBarras, plan && estilos.tenue]}>
                <View style={[estilos.graficaBarra, { height: alto(total.kcal, m?.kcal), backgroundColor: '#e6dfcc' }]} />
                {MACROS.map((x) => <View key={x} style={[estilos.graficaBarra, { height: alto(total[x], m?.[x]), backgroundColor: COLOR_DE_MACRO[x] }]} />)}
              </View>
              <Text style={estilos.tiraLetra}>{letraDelDia(d)}</Text>
              <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]}>{partesDe(d).dia}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PaginaDelMes({ e, dia, ancho, alElegir }: { e: Estado; dia: ClaveDia; ancho: number; alElegir: (d: ClaveDia) => void }) {
  const p = partesDe(dia);
  const primero = sumarDias(dia, -(p.dia - 1));
  const ultimo = sumarDias(primero, new Date(p.anio, p.mes + 1, 0).getDate() - 1);
  const dias = Array.from({ length: diasEntre(primero, ultimo) + 1 }, (_, i) => sumarDias(primero, i));
  const semanas = useMemo(() => {
    const filas: ClaveDia[][] = [];
    for (let lunes = lunesDe(primero); lunes <= ultimo; lunes = sumarDias(lunes, 7)) filas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)));
    return filas;
  }, [primero, ultimo]);
  const anchoGrilla = ancho - 32;
  return (
    <View>
      <CabezaDePromedio titulo={conMayuscula(lista('fecha.meses')[p.mes])} fechas={String(p.anio)} promedio={promedioDe(e, dias)} dias={dias.filter((d) => d < e.hoy).length} meta={metaDelDia(e, e.hoy)} />
      <View style={estilos.calendario}>
        <View style={estilos.calendarioFila}>
          {semanas[0].map((d) => <Text key={d} style={[estilos.calendarioLetra]}>{letraDelDia(d)}</Text>)}
        </View>
        {semanas.map((semana) => (
          <View key={semana[0]} style={estilos.calendarioSemana}>
            <View style={estilos.calendarioFila}>
              {semana.map((d) => {
                const fuera = d < primero || d > ultimo;
                return (
                  <Pressable key={d} disabled={fuera} onPress={() => alElegir(d)} style={[estilos.calendarioDia, d === e.hoy && estilos.calendarioHoy]} accessibilityRole="button" accessibilityLabel={fechaCorta(d)}>
                    <View style={estilos.calendarioLugar} />
                    {!fuera && <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]}>{partesDe(d).dia}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={estilos.calendarioLunas} pointerEvents="none">
              <Lunitas lunas={semana.map((d) => (d < primero || d > ultimo ? { estado: 'fuera', fraccion: 0 } : lunitaDe(e, d)))} ancho={anchoGrilla} tam={26} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ la línea del día
type Entrada = { minutos: number } & ({ tipo: 'comida'; comida: ComidaDelDia } | { tipo: 'vacia'; comida: Comida; ahora: boolean } | { tipo: 'ahora' });

/**
 * Las comidas sobre una línea de horas, con el espacio entre una y otra según el tiempo que pasó.
 * Hoy, la comida que falta espera en «ahora»; otro día, las que faltan se pueden agregar.
 */
function LineaDelDia({ e, dia }: { e: Estado; dia: ClaveDia }) {
  const sistema = sistemaDe(e);
  const comidas = comidasDelDia(e.registros, dia);
  const entradas: Entrada[] = comidas.map((c) => ({ tipo: 'comida', comida: c, minutos: c.minutos }));
  const ahora = minutosDe(new Date());
  for (const [tipo, minutos] of Object.entries(HORA_TIPICA) as [Comida, number][]) {
    if (comidas.some((c) => c.comida === tipo)) continue;
    if (dia !== e.hoy) entradas.push({ tipo: 'vacia', comida: tipo, ahora: false, minutos });
    else {
      const actual = comidaDeLaHora(ahora) === tipo;
      if (minutos <= ahora || actual) entradas.push({ tipo: 'vacia', comida: tipo, ahora: actual, minutos: actual ? ahora : minutos });
    }
  }
  // Una comida registrada ahora ya marca la hora: «ahora» va solo si no la hay.
  if (dia === e.hoy && !comidas.some((c) => Math.abs(c.minutos - ahora) < 1)) entradas.push({ tipo: 'ahora', minutos: ahora - 0.5 });
  entradas.sort((a, b) => a.minutos - b.minutos);
  return (
    <View style={estilos.linea}>
      <View style={estilos.lineaRaya} pointerEvents="none" />
      {entradas.map((x, i) => {
        const separacion = i === 0 ? 0 : 10 + Math.min(34, (x.minutos - entradas[i - 1].minutos) * 0.12);
        if (x.tipo === 'ahora') {
          return (
            <View key="ahora" style={[estilos.entradaAhora, { marginTop: separacion }]}>
              <Text style={[estilos.hora, estilos.horaAhora]}>{hora(Math.round(x.minutos))}</Text>
              <View style={[estilos.nodo, estilos.nodoAhora]} />
              <Text style={estilos.ahoraTexto}>{t('comida.ahora')}</Text>
            </View>
          );
        }
        const clave = x.tipo === 'comida' ? `c-${x.comida.comida}` : `v-${x.comida}`;
        const planificada = x.tipo === 'comida' && x.comida.planificada;
        return (
          <View key={clave} style={{ marginTop: separacion }}>
            <Text style={estilos.hora}>{x.tipo === 'vacia' && x.ahora ? '' : hora(Math.round(x.minutos))}</Text>
            <View style={[estilos.nodo, x.tipo === 'vacia' && estilos.nodoVacio, planificada && estilos.nodoPlan]} />
            {x.tipo === 'comida' ? <Tarjeta key={`${dia}-${x.comida.comida}`} c={x.comida} dia={dia} sistema={sistema} /> : <TarjetaVacia comida={x.comida} dia={dia} hoy={e.hoy} e={e} />}
          </View>
        );
      })}
    </View>
  );
}

function Tarjeta({ c, dia, sistema }: { c: ComidaDelDia; dia: ClaveDia; sistema: ReturnType<typeof sistemaDe> }) {
  // La foto, opcional y solo en el teléfono (D10): un toque en la comida ya registrada.
  const [foto, setFoto] = useState(() => fotoDe(dia, c.comida));
  const [viendo, setViendo] = useState(false);
  const sacar = () => {
    sacarFoto(dia, c.comida).then((uri) => uri && setFoto(uri)).catch(() => {});
  };
  return (
    <View style={[estilos.tarjeta, c.planificada && estilos.tarjetaPlan]}>
      <View style={estilos.tarjetaCabeza}>
        <Text style={estilos.tarjetaTitulo}>{t(`comida.comidas.${c.comida}`)}</Text>
        {c.planificada && <Text style={estilos.etiquetaPlan}>{t('comida.planificado')}</Text>}
        <Text style={estilos.tarjetaKcal}>
          {numero(Math.round(c.total.kcal))}
          <Text style={estilos.tarjetaKcalUnidad}> kcal</Text>
        </Text>
      </View>
      {c.registros.map((r) => <FilaDeRegistro key={r.id} r={r} sistema={sistema} />)}
      {foto && (
        <Pressable onPress={() => setViendo(true)} accessibilityRole="imagebutton" accessibilityLabel={t('comida.fotos.ver')}>
          <Image source={{ uri: foto }} style={estilos.foto} contentFit="cover" />
        </Pressable>
      )}
      <View style={estilos.tarjetaPie}>
        {MACROS.map((m) => (
          <View key={m} style={estilos.mini}>
            <Punto macro={m} tam={5} />
            <Text style={estilos.miniTexto}>{`${gramosDeMacro(c.total[m])} g`}</Text>
          </View>
        ))}
        {hayFotos && !c.planificada && !foto && (
          <Pressable onPress={sacar} style={estilos.botonFoto} accessibilityRole="button" accessibilityLabel={t('comida.foto')} hitSlop={8}>
            <Icono nombre="camera" tam={14} color="rgba(239, 230, 207, 0.6)" />
          </Pressable>
        )}
      </View>
      {viendo && foto && (
        <HojaModal
          abierta
          titulo={t('comida.fotos.ver')}
          alCerrar={() => setViendo(false)}
          pie={(
            <>
              <Boton tipo="contorno" texto={t('comida.fotos.cambiar')} alTocar={() => { setViendo(false); sacar(); }} />
              <Boton tipo="quitar" texto={t('comida.fotos.borrar')} alTocar={() => { borrarFoto(dia, c.comida); setFoto(null); setViendo(false); }} />
            </>
          )}
        >
          <Image source={{ uri: foto }} style={estilos.fotoGrande} contentFit="cover" />
          <Text style={estilos.fotoNota}>{t('comida.fotos.nota')}</Text>
        </HojaModal>
      )}
    </View>
  );
}

function FilaDeRegistro({ r, sistema }: { r: Registro; sistema: ReturnType<typeof sistemaDe> }) {
  const cantidad = cantidadDeTexto(r.cantidad, sistema);
  return (
    <Pressable
      onPress={() => abrirRegistro({ editar: r.id, comida: r.comida, dia: r.dia })}
      style={({ pressed }) => [estilos.item, pressed && estilos.itemApretado]}
      accessibilityRole="button"
    >
      <Text style={estilos.itemTexto} numberOfLines={1}>
        {r.nombre}
        {cantidad ? <Text style={estilos.itemCantidad}>{` · ${cantidad}`}</Text> : null}
      </Text>
      <Text style={estilos.itemKcal}>{numero(Math.round(r.valores.kcal))}</Text>
    </Pressable>
  );
}

function TarjetaVacia({ comida, dia, hoy, e }: { comida: Comida; dia: ClaveDia; hoy: ClaveDia; e: Estado }) {
  const ayer = sumarDias(hoy, -1);
  const deAyer = dia === hoy ? delDia(e.registros.values(), ayer).filter((r) => r.comida === comida) : [];
  return (
    <View style={[estilos.tarjeta, estilos.tarjetaVacia]}>
      <Text style={estilos.tarjetaTitulo}>{t(`comida.comidas.${comida}`)}</Text>
      <View style={estilos.acciones}>
        <Boton texto={t('comida.agregar')} icono="plus" tipo="principal" alTocar={() => abrirRegistro({ comida, dia })} />
        {deAyer.length > 0 && (
          <Boton
            texto={t('comida.copiarDeAyer')}
            icono="doc.on.doc"
            tipo="secundario"
            alTocar={() => abrirRegistro({ comida, dia, panel: 'revision', items: deAyer.map(({ fuente, ref, nombre, cantidad, valores, estimado }) => ({ fuente, ref, nombre, cantidad, valores, ...(estimado ? { estimado } : {}) })) })}
          />
        )}
      </View>
    </View>
  );
}

/** Debajo de la línea: confirmar lo planificado cuando llega el día, y copiar el día a hoy o a mañana. */
function AccionesDelDia({ e, dia, avisar }: { e: Estado; dia: ClaveDia; avisar: (texto: string, deshacer?: () => void) => void }) {
  const [copiando, setCopiando] = useState(false);
  const registros = delDia(e.registros.values(), dia);
  const planificados = dia === e.hoy ? registros.filter((r) => r.planificado).length : 0;
  const destinos = [e.hoy, sumarDias(e.hoy, 1)].filter((d) => d !== dia);
  if (!registros.length) return null;
  const copiar = (hacia: ClaveDia) => {
    const copia = elAlmacen().copiar({ dia }, { dia: hacia });
    setCopiando(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    avisar(plural('comida.copiado', copia.length, { dia: tituloDelDia(hacia, e.hoy).toLowerCase() }), () => copia.forEach((r) => elAlmacen().borrarRegistro(r.id)));
  };
  return (
    <View style={estilos.accionesDelDia}>
      {planificados > 0 && (
        <Boton
          texto={t('comida.confirmar')}
          icono="checkmark"
          tipo="principal"
          alTocar={() => {
            const n = elAlmacen().confirmarPlanificados(dia);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            avisar(plural('comida.confirmados', n));
          }}
        />
      )}
      {copiando ? (
        <View style={estilos.acciones}>
          <Text style={estilos.copiarA}>{t('comida.copiarA')}</Text>
          {destinos.map((d) => <Boton key={d} texto={tituloDelDia(d, e.hoy)} tipo="secundario" alTocar={() => copiar(d)} />)}
          <Boton texto={t('comun.cancelar')} tipo="contorno" alTocar={() => setCopiando(false)} />
        </View>
      ) : (
        <Boton texto={t('comida.copiarDia')} icono="doc.on.doc" tipo="contorno" alTocar={() => setCopiando(true)} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  lleno: { flex: 1 },
  fecha: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.58)' },
  titulo: { marginTop: 6, fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  hoy: { color: colores.oroClaro },
  tira: { marginTop: 16, flexDirection: 'row', gap: 4 },
  tiraDia: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 9, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' },
  tiraDiaElegido: { backgroundColor: 'rgba(239, 230, 207, 0.07)', borderColor: 'rgba(239, 230, 207, 0.16)' },
  tiraLetra: { fontFamily: letras.textoMedio, fontSize: 10, lineHeight: 12, letterSpacing: 1.2, color: 'rgba(239, 230, 207, 0.5)' },
  tiraLugar: { height: 24, marginVertical: 6 },
  tiraNumero: { fontFamily: letras.numeroMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.78)', fontVariant: ['tabular-nums'] },
  tiraLunas: { position: 'absolute', left: 0, right: 0, top: 8 + 12 + 6 },
  cuadro: { marginTop: 14, overflow: 'hidden', borderRadius: 20, backgroundColor: 'rgba(8, 12, 26, 0.66)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)' },
  cuadroTira: { flexDirection: 'row', alignItems: 'flex-start' },
  pagina: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16 },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 },
  punto: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 9 },
  puntoMarca: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(239, 230, 207, 0.42)' },
  puntoMarcaElegido: { backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro, shadowOpacity: 0.7, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
  puntoTexto: { fontFamily: letras.texto, fontSize: 11.5, letterSpacing: 0.4, color: 'rgba(239, 230, 207, 0.42)' },
  puntoTextoElegido: { color: colores.pergamino },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: -8 },
  resumenLuna: { margin: -4 },
  resumenTextos: { gap: 6, flexShrink: 1 },
  resumenCifra: { fontFamily: letras.numero, fontSize: 30, letterSpacing: -0.4, color: colores.cifra, fontVariant: ['tabular-nums'] },
  resumenDe: { fontFamily: letras.texto, fontSize: 13, letterSpacing: 0, color: 'rgba(239, 230, 207, 0.55)' },
  resumenLinea: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.78)', fontVariant: ['tabular-nums'] },
  deMas: { color: colores.oroClaro },
  macros: { marginTop: 16, flexDirection: 'row', gap: 14 },
  macro: { flex: 1, gap: 7, minWidth: 0 },
  macroNombre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroNombreTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)' },
  macroCifra: { fontFamily: letras.numeroMedio, fontSize: 14, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  barra: { height: 4, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.08)', overflow: 'hidden' },
  barraLlena: { height: '100%', borderRadius: 4 },
  paginaCabeza: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  paginaTitulo: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  paginaFechas: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
  promedioCifra: { marginTop: 6, fontFamily: letras.numero, fontSize: 32, letterSpacing: -0.3, color: colores.cifra, fontVariant: ['tabular-nums'] },
  promedioUnidad: { fontFamily: letras.texto, fontSize: 13, letterSpacing: 0, color: 'rgba(239, 230, 207, 0.58)' },
  promedioNota: { marginTop: 6, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.72)' },
  grafica: { marginTop: 14, paddingTop: 14, flexDirection: 'row', gap: 4, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  graficaMeta: { position: 'absolute', left: 0, right: 0, top: 14 + 20, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(239, 230, 207, 0.32)' },
  graficaDia: { flex: 1, alignItems: 'center', gap: 6 },
  graficaBarras: { height: 120, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  graficaBarra: { width: 5, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 },
  tenue: { opacity: 0.35 },
  calendario: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  calendarioFila: { flexDirection: 'row' },
  calendarioLetra: { flex: 1, textAlign: 'center', paddingBottom: 8, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 1.2, color: 'rgba(239, 230, 207, 0.45)' },
  calendarioSemana: { marginBottom: 2 },
  calendarioDia: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 12 },
  calendarioHoy: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  calendarioLugar: { height: 26 },
  calendarioLunas: { position: 'absolute', left: 0, right: 0, top: 6 },
  seccion: { marginTop: 32, marginBottom: 14, fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino },
  nota: { marginTop: -6, marginBottom: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  linea: { paddingLeft: 60 },
  lineaRaya: { position: 'absolute', left: 48, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(232, 196, 106, 0.42)' },
  hora: { position: 'absolute', left: -60, width: 40, top: 9, textAlign: 'right', fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  horaAhora: { top: 0, color: colores.oroClaro },
  nodo: { position: 'absolute', left: -16.5, top: 10.5, width: 9, height: 9, borderRadius: 4.5, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.85, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  nodoVacio: { backgroundColor: '#070b18', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.7)', shadowOpacity: 0 },
  nodoPlan: { backgroundColor: 'rgba(232, 196, 106, 0.35)', shadowOpacity: 0 },
  nodoAhora: { top: 1.5, backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro },
  entradaAhora: { height: 12 },
  ahoraTexto: { position: 'absolute', left: 2, top: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: colores.oroClaro },
  tarjeta: { borderRadius: 16, paddingTop: 11, paddingHorizontal: 14, paddingBottom: 10, backgroundColor: 'rgba(6, 10, 22, 0.66)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)' },
  tarjetaPlan: { opacity: 0.6, borderStyle: 'dashed' },
  tarjetaVacia: { gap: 11, paddingBottom: 13, backgroundColor: 'rgba(6, 10, 22, 0.35)', borderStyle: 'dashed', borderColor: 'rgba(232, 196, 106, 0.38)' },
  tarjetaCabeza: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 7 },
  tarjetaTitulo: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  etiquetaPlan: { alignSelf: 'center', fontFamily: letras.texto, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: colores.oro, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.4)', borderRadius: 999, overflow: 'hidden' },
  tarjetaKcal: { marginLeft: 'auto', fontFamily: letras.numeroMedio, fontSize: 16, color: colores.oroClaro, fontVariant: ['tabular-nums'] },
  tarjetaKcalUnidad: { fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.5)', letterSpacing: 0.6 },
  item: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 4, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: 8 },
  itemApretado: { backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  itemTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.9)' },
  itemCantidad: { color: 'rgba(239, 230, 207, 0.5)' },
  itemKcal: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.58)', fontVariant: ['tabular-nums'] },
  tarjetaPie: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 7, paddingTop: 8, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  botonFoto: { marginLeft: 'auto', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  foto: { marginTop: 8, height: 140, borderRadius: 12, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  fotoGrande: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  fotoNota: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)' },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniTexto: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  accionesDelDia: { marginTop: 22, marginLeft: 60, gap: 10, alignItems: 'flex-start' },
  copiarA: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.7)' },
});
