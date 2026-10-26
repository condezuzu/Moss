// La sección de Ascent vinculada, como en la galería (galeria/src/ascent.js): la sesión de hoy en
// Ascent y lo que le suma a la meta de la comida, el gimnasio que se enciende solo, y «Solo con las
// dos»: la recuperación (sus tres partes y cómo se calcula), el rendimiento esperado, los músculos,
// la marca posible, por qué no subes y tu año. Con los colores de Ascent y una línea arriba de cada
// parte en vez de cajas. Las cuentas son caras: se hacen cuando la sección se ve o empieza a subir.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { deAscent, useAscent } from '@/almacen/ascent';
import { DIAS_MINIMOS, MAXIMOS_DE_RECUPERACION, SEMANAS_MINIMAS, type Causa } from '@/dominio/entrenamiento';
import { diaDeLaSemana, type DiaSemana } from '@/dominio/fechas';
import type { GrupoDeAscent } from '@/dominio/musculos';
import type { Motivo } from '@/dominio/rendimiento';
import { lista, t } from '@/textos';
import { letras } from '@/tema';
import { aparatoPrincipal } from '../perfil/Aparatos';
import { conSigno, duracion, fechaDiaMes, hora, metaDelDia, numero, useEstado } from '../comida/datos';
import { Icono } from '../comida/comunes';
import { usePersona, useSueno } from '../ganchos';
import { Aparece } from '../tarjetas';
import { Anillo } from './Anillo';
import { calcularVista, type GrupoDeMusculos, type HoyEnAscent, type VistaDeAscent } from './calculos';
import { C } from './colores';

const TODOS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];

/** «Piernas», «Pecho y hombros» o, sin ejercicios, «Gimnasio». */
function nombreDeSesion(grupos: GrupoDeAscent[]): string {
  const n = grupos.slice(0, 2).map((g) => t(`ascent.hoy.grupos.${g}`));
  if (!n.length) return t('ascent.gimnasio.nombre');
  return n.length === 2 ? t('ascent.hoy.y', { a: n[0], b: n[1].toLowerCase() }) : n[0];
}

export function Vinculada({ preparada }: { preparada: boolean }) {
  const e = useEstado();
  const d = useAscent();
  const sueno = useSueno();
  const persona = usePersona();
  const vista = useMemo(() => (preparada ? calcularVista({ e, d, sueno, persona, metaDe: (dia) => metaDelDia(e, dia) }) : null), [preparada, e, d, sueno, persona]);
  // Que dijo «buen día para intentar marca» queda anotado: después se cuenta si hubo marca.
  const aviso = vista?.marca?.aplica ? vista.marca.ejercicio : null;
  useEffect(() => {
    if (aviso) deAscent().anotarAviso(aviso, e.hoy);
  }, [aviso, e.hoy]);
  if (!vista) return <View style={st.esperando} />;
  return (
    <>
      {vista.hoy && <HoyEnAscentCarta h={vista.hoy} hoy={e.hoy} />}
      <Gimnasio g={vista.gimnasio} />
      <Text style={st.grupo}>{t('ascent.soloConLasDos')}</Text>
      <RecuperacionCarta v={vista} />
      <RendimientoCarta v={vista} />
      <MusculosCarta v={vista} />
      <MarcaCarta v={vista} />
      <PorQueCarta v={vista} />
      <AnioCarta v={vista} />
      <Text style={st.pie}>{t('ascent.desvincular')}</Text>
    </>
  );
}

/** Una parte: una línea de pelo arriba, el título y, a la derecha, lo que la acompaña. */
export function Carta({ titulo, derecha, children, estilo, claro }: { titulo: string; derecha?: ReactNode; children: ReactNode; estilo?: StyleProp<ViewStyle>; claro?: boolean }) {
  return (
    <View style={[st.carta, estilo]}>
      <View style={st.cartaCab}>
        <Text style={[st.cartaTitulo, claro && { color: C.claro }]}>{titulo}</Text>
        {typeof derecha === 'string' ? <Text style={st.derecha}>{derecha}</Text> : derecha}
      </View>
      {children}
    </View>
  );
}

/** «Cómo se calcula», con los colores de Ascent. */
function ComoSeCalcula({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const reducido = useReducedMotion();
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierto ? '90deg' : '0deg', { duration: reducido ? 0 : 220 }) }] }));
  return (
    <>
      <Pressable onPress={() => setAbierto((x) => !x)} style={st.enlace} accessibilityRole="button" accessibilityState={{ expanded: abierto }} hitSlop={8}>
        <Text style={st.enlaceTexto}>{t('progreso.comoSeCalcula')}</Text>
        <Animated.View style={flecha}>
          <Icono nombre="chevron.right" tam={12} color={C.claro} peso="semibold" />
        </Animated.View>
      </Pressable>
      {abierto && <Aparece style={st.explicacion}>{children}</Aparece>}
    </>
  );
}

// ------------------------------------------------------------------ hoy en Ascent
function HoyEnAscentCarta({ h, hoy }: { h: HoyEnAscent; hoy: string }) {
  const s = h.sesionDeAscent;
  const valores = h.semana.map((x) => x.meta.kcal);
  const alto = Math.max(...valores), bajo = Math.min(...valores);
  const n = Math.round(Math.abs(h.tamano - 1) * 100);
  const comparacion = n < 5 ? t('ascent.hoy.comparacion.comoSiempre') : t(`ascent.hoy.comparacion.${h.tamano > 1 ? 'masGrande' : 'masChica'}`, { n });
  const proteina = h.extra > 0 ? t('ascent.hoy.proteina.sube', { p: h.extra, comparacion }) : t(`ascent.hoy.proteina.${h.tamano <= 0.5 ? 'chica' : 'techo'}`);
  const iniciales = lista('fecha.diasCortos');
  return (
    <Carta titulo={t('ascent.hoy.titulo')} derecha={h.hora !== null ? t('ascent.hoy.aLas', { hora: hora(h.hora) }) : undefined} estilo={st.hoy}>
      <Text style={st.hoySesion}>{s.series || s.minutos ? t('ascent.hoy.sesion', { nombre: nombreDeSesion(h.grupos), min: s.minutos, series: s.series }) : t('ascent.hoy.sinDetalle')}</Text>
      <Text style={st.hoyMeta}>{t('ascent.hoy.meta', { kcal: numero(h.meta.kcal), p: numero(h.meta.proteina) })}</Text>
      <View style={st.semana}>
        {h.semana.map((x) => {
          const esHoy = x.fecha === hoy;
          const alto100 = 35 + (65 * (x.meta.kcal - bajo)) / Math.max(1, alto - bajo);
          return (
            <View key={x.fecha} style={st.semanaDia}>
              <Text style={[st.semanaKcal, esHoy && st.semanaHoy]}>{numero(x.meta.kcal)}</Text>
              <View style={st.semanaPista}>
                <View style={[st.semanaBarra, { height: `${alto100}%` }, x.entrena === true && st.barraGimnasio, x.entrena === null && st.barraPrevista]} />
              </View>
              <Text style={[st.semanaLetra, esHoy && st.semanaHoy]}>{iniciales[diaDeLaSemana(x.fecha)].charAt(0)}</Text>
            </View>
          );
        })}
      </View>
      <View style={st.leyenda}>
        {(['gimnasio', 'descanso', 'previsto'] as const).map((k) => (
          <View key={k} style={st.leyendaItem}>
            <View style={[st.leyendaMuestra, k === 'gimnasio' && st.barraGimnasio, k === 'previsto' && st.barraPrevista]} />
            <Text style={st.leyendaTexto}>{t(`ascent.hoy.leyenda.${k}`)}</Text>
          </View>
        ))}
      </View>
      <Text style={st.nota}>{t('ascent.hoy.reparto', { entreno: numero(h.gimnasio), descanso: numero(h.descanso), semana: numero(h.total) })}</Text>
      <Text style={st.nota}>{proteina}</Text>
    </Carta>
  );
}

// ------------------------------------------------------------------ el gimnasio que se enciende solo
function Gimnasio({ g }: { g: VistaDeAscent['gimnasio'] }) {
  const nombre = t('ascent.gimnasio.nombre');
  const sumar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    elAlmacen().crearHabito({ nombre, icono: 'dumbbell', dias: g.dias.length ? g.dias : TODOS, fuente: { tipo: 'ascent' } });
  };
  return (
    <Carta titulo={t('ascent.funciones.gimnasio.titulo')}>
      <Aparece key={g.habito ? 'con' : 'sin'}>
        {g.habito ? (
          <Text style={st.texto}>{t('ascent.gimnasio.listo', { nombre: g.habito.nombre })}</Text>
        ) : (
          <>
            <Text style={st.texto}>{t('ascent.gimnasio.sumar', { nombre })}</Text>
            <Pressable onPress={sumar} style={({ pressed }) => [st.contorno, pressed && st.contornoApretado]} accessibilityRole="button">
              <Text style={st.contornoTexto}>{t('ascent.gimnasio.boton', { nombre })}</Text>
            </Pressable>
          </>
        )}
      </Aparece>
    </Carta>
  );
}

// ------------------------------------------------------------------ recuperación
function RecuperacionCarta({ v }: { v: VistaDeAscent }) {
  const r = v.recuperacion;
  if (!r) {
    return (
      <Carta titulo={t('ascent.recuperacion.titulo')} derecha={t('ascent.recuperacion.hoy')}>
        <Text style={st.texto}>{t('ascent.recuperacion.sinNoche')}</Text>
      </Carta>
    );
  }
  const detalle = {
    sueno: t('ascent.recuperacion.detalle.sueno', { horas: duracion(r.anoche.dormido), calidad: r.calidad ?? '—' }),
    carga: t('ascent.recuperacion.detalle.carga', { n: Math.round(r.carga * 100) }),
    comida: t('ascent.recuperacion.detalle.comida', { p: numero(Math.round(r.proteinaAyer)), meta: numero(r.metaProteina) }),
  };
  return (
    <Carta titulo={t('ascent.recuperacion.titulo')} derecha={t('ascent.recuperacion.hoy')}>
      <View style={st.recFila}>
        <View style={st.anillo}>
          <Anillo valor={r.total} />
          <Text style={st.anilloTexto}>{r.total}</Text>
        </View>
        <Text style={st.conviene}>{t(`ascent.recuperacion.conviene.${r.conviene}`)}</Text>
      </View>
      {(['sueno', 'carga', 'comida'] as const).map((k) => (
        <View key={k} style={st.parte}>
          <View style={st.parteFila}>
            <Text style={st.parteNombre}>{t(`ascent.recuperacion.partes.${k}`)}</Text>
            <View style={st.parteBarra}>
              <View style={[st.parteRelleno, { width: `${(r.partes[k] / MAXIMOS_DE_RECUPERACION[k]) * 100}%` }]} />
            </View>
            <Text style={st.parteValor}>{t('ascent.recuperacion.de', { n: r.partes[k], max: MAXIMOS_DE_RECUPERACION[k] })}</Text>
          </View>
          <Text style={st.parteDetalle}>{detalle[k]}</Text>
        </View>
      ))}
      <ComoSeCalcula>
        <Text style={st.explicacionTexto}>{t('ascent.recuperacion.explicacion')}</Text>
      </ComoSeCalcula>
    </Carta>
  );
}

// ------------------------------------------------------------------ rendimiento esperado
function motivoTexto(m: Motivo, musculo: GrupoDeMusculos): string {
  if (m.que === 'durmioPoco') return t('ascent.rendimiento.motivos.durmioPoco', { horas: duracion(m.minutos) });
  if (m.que === 'musculoCargado') return t('ascent.rendimiento.motivos.musculoCargado', { musculo: t(`ascent.musculos.grupos.${musculo}`) });
  if (m.que === 'sinEntrenarlo') return t('ascent.rendimiento.motivos.sinEntrenarlo', { dias: m.dias });
  return t(`ascent.rendimiento.motivos.${m.que}`);
}

function RendimientoCarta({ v }: { v: VistaDeAscent }) {
  const x = v.rendimiento;
  if (!x) {
    return (
      <Carta titulo={t('ascent.rendimiento.titulo')}>
        <Text style={st.texto}>{t('ascent.rendimiento.sinSesion')}</Text>
      </Carta>
    );
  }
  const sesion = nombreDeSesion(x.grupos);
  const derecha = x.deHoy ? t('ascent.rendimiento.hoy', { sesion }) : t('ascent.rendimiento.previsto', { sesion, dia: lista('fecha.dias')[x.dia] });
  return (
    <Carta titulo={t('ascent.rendimiento.titulo')} derecha={derecha}>
      {([['fuerza', x.r.max, x.r.categoria.max], ['repeticiones', x.r.vol, x.r.categoria.vol]] as const).map(([k, valor, cat]) => (
        <View key={k} style={st.rendFila}>
          <Text style={st.rendNombre}>{t(`ascent.rendimiento.${k}`)}</Text>
          <Text style={[st.rendCategoria, cat === 'mejor' && { color: C.verde }, (cat === 'algoMenos' || cat === 'menos') && { color: C.ambar }]}>{t(`ascent.rendimiento.categorias.${cat}`)}</Text>
          <Text style={st.rendValor}>{`${conSigno(Math.round(valor))} %`}</Text>
        </View>
      ))}
      <View style={st.motivos}>
        {(x.r.motivos.length ? x.r.motivos.slice(0, 3).map((m) => motivoTexto(m, x.musculo)) : [t('ascent.rendimiento.sinMotivos')]).map((texto) => (
          <View key={texto} style={st.item}>
            <View style={st.punto} />
            <Text style={st.itemTexto}>{texto}</Text>
          </View>
        ))}
      </View>
      <Text style={st.nota}>{t('ascent.rendimiento.margen', { n: numero(x.r.sigma, 1) })}</Text>
      {x.anoche && (
        <Text style={st.nota}>{x.anoche.moss ? t('ascent.rendimiento.sinReloj') : t('ascent.rendimiento.conReloj', { aparato: aparatoPrincipal([{ fuente: x.anoche.fuente, noches: 1 }]) })}</Text>
      )}
      <Text style={st.nota}>{t('ascent.rendimiento.seguridad', { nivel: t(`ascent.rendimiento.niveles.${x.seguridad}`), semanas: x.semanas })}</Text>
      <ComoSeCalcula>
        {lista('ascent.rendimiento.como').map((p) => <Text key={p} style={st.explicacionTexto}>{p}</Text>)}
      </ComoSeCalcula>
    </Carta>
  );
}

// ------------------------------------------------------------------ los músculos
function MusculosCarta({ v }: { v: VistaDeAscent }) {
  return (
    <Carta titulo={t('ascent.musculos.titulo')}>
      <Text style={[st.nota, st.musculosAntes]}>{t('ascent.musculos.antes')}</Text>
      <View style={st.musculos}>
        {v.musculos.map((m) => (
          <View key={m.grupo} style={st.musculo}>
            <Text style={st.musculoNombre}>{t(`ascent.musculos.grupos.${m.grupo}`)}</Text>
            <View style={st.musculoDerecha}>
              <Text style={[st.estado, m.estado === 'recuperado' && st.estadoBien, m.estado === 'cargado' && st.estadoCargado]}>{t(`ascent.musculos.estados.${m.estado}`)}</Text>
              {m.listo !== null && <Text style={st.musculoListo}>{t('ascent.musculos.listoEn', { h: m.listo })}</Text>}
            </View>
          </View>
        ))}
      </View>
      <Text style={st.nota}>{t('ascent.musculos.nota')}</Text>
    </Carta>
  );
}

// ------------------------------------------------------------------ la marca posible
function MarcaCarta({ v }: { v: VistaDeAscent }) {
  const m = v.marca;
  if (!m || !m.aplica) {
    return (
      <Carta titulo={t('ascent.marca.titulo')}>
        <Text style={st.texto}>{t('ascent.marca.hoyNo')}</Text>
      </Carta>
    );
  }
  return (
    <Carta titulo={t('ascent.marca.titulo')} claro>
      <Text style={st.marcaTitulo}>{t('ascent.marca.en', { ejercicio: m.ejercicio.toLowerCase() })}</Text>
      <Text style={st.texto}>
        {t('ascent.marca.porque', { horas: m.anoche ? duracion(m.anoche.dormido) : '—', musculos: t(`ascent.musculos.grupos.${m.grupo}`).toLowerCase(), dias: m.dias, g: numero(m.distancia, 1) })}
      </Text>
      <Text style={st.marcaP}>{t('ascent.marca.probabilidad', { p: Math.round(m.probabilidad * 100) })}</Text>
      {m.veces > 0 && <Text style={st.nota}>{t('ascent.marca.aciertos', { veces: m.veces, marcas: m.acerto })}</Text>}
      <Text style={st.nota}>{t('ascent.marca.seguridad', { nivel: t(`ascent.rendimiento.niveles.${m.seguridad}`), marcas: m.marcas, semanas: m.semanas })}</Text>
      <Text style={st.nota}>{t('ascent.marca.nota')}</Text>
    </Carta>
  );
}

// ------------------------------------------------------------------ por qué no subes
function PorQueCarta({ v }: { v: VistaDeAscent }) {
  const p = v.porQue;
  if (!p.estancado) {
    return (
      <Carta titulo={t('ascent.estancamiento.titulo')}>
        <Text style={st.texto}>{t('ascent.estancamiento.sinEstancar')}</Text>
      </Carta>
    );
  }
  const { estancado, r } = p;
  const marca = t('ascent.estancamiento.marca', { kg: numero(estancado.mejor.kilos, 1), reps: estancado.mejor.reps });
  const valor = {
    sueno: (x: number) => duracion(Math.round(x)),
    proteina: (x: number) => t('ascent.estancamiento.gramos', { n: numero(Math.round(x)) }),
    calorias: (x: number) => t('ascent.estancamiento.kcal', { n: conSigno(Math.round(x / 10) * 10) }),
  };
  const campo: Record<Causa, 'sueno' | 'proteina' | 'balance'> = { sueno: 'sueno', proteina: 'proteina', calorias: 'balance' };
  return (
    <Carta titulo={t('ascent.estancamiento.titulo')}>
      <Text style={st.estancEjercicio}>{t('ascent.estancamiento.ejercicio', { ejercicio: estancado.ejercicio, semanas: estancado.semanas, marca })}</Text>
      {r.estado === 'juntando' ? (
        <>
          <Text style={st.frase}>{t('ascent.estancamiento.juntando')}</Text>
          {([['conMarcas', r.conMarcas], ['sinMarcas', r.sinMarcas]] as const).map(([k, n]) => (
            <View key={k} style={st.juntandoFila}>
              <Text style={st.juntandoTexto}>{t(`ascent.estancamiento.${k}`)}</Text>
              <View style={st.cuadros}>
                {Array.from({ length: SEMANAS_MINIMAS }, (_, i) => <View key={i} style={[st.cuadro, i < n && st.cuadroLleno]} />)}
              </View>
            </View>
          ))}
          <Text style={st.nota}>{t('ascent.estancamiento.juntandoDetalle', { min: SEMANAS_MINIMAS, dias: DIAS_MINIMOS, a: r.conMarcas, b: r.sinMarcas })}</Text>
        </>
      ) : (
        <>
          <View style={st.tabla}>
            <View style={st.tablaFila}>
              <Text style={[st.tablaNombre, st.crece]} />
              <Text style={st.tablaCol}>{t('ascent.estancamiento.conMarcas')}</Text>
              <Text style={st.tablaCol}>{t('ascent.estancamiento.ahora', { n: estancado.semanas })}</Text>
            </View>
            {(['sueno', 'proteina', 'calorias'] as const).map((k) => {
              const mayor = r.estado === 'probable' && r.causa === k;
              return (
                <View key={k} style={st.tablaFila}>
                  <View style={[st.crece, st.tablaNombreCaja]}>
                    {mayor && <View style={st.tablaMarca} />}
                    <Text style={[st.tablaNombre, mayor && st.tablaMayor]}>{t(`ascent.estancamiento.filas.${k}`)}</Text>
                  </View>
                  <Text style={[st.tablaValor, mayor && st.tablaMayor]}>{valor[k](r.antes[campo[k]])}</Text>
                  <Text style={[st.tablaValor, mayor && st.tablaMayor]}>{valor[k](r.ahora[campo[k]])}</Text>
                </View>
              );
            })}
          </View>
          {r.estado === 'probable' ? (
            <>
              <Text style={st.causa}>{t('ascent.estancamiento.causa', { causa: t(`ascent.estancamiento.causas.${r.causa}`) })}</Text>
              <Text style={st.frase}>{t(`ascent.estancamiento.frases.${r.causa}`, { horas: duracion(Math.floor(r.antes.sueno / 15) * 15) })}</Text>
              <Text style={st.nota}>{t('ascent.estancamiento.nota')}</Text>
            </>
          ) : (
            <Text style={st.frase}>{t('ascent.estancamiento.sinDiferencia')}</Text>
          )}
        </>
      )}
    </Carta>
  );
}

// ------------------------------------------------------------------ tu año
function AnioCarta({ v }: { v: VistaDeAscent }) {
  const a = v.anio;
  const datos: ['entrenamientos' | 'marcas' | 'habitos' | 'sueno' | 'comida', string][] = [
    ['entrenamientos', numero(a.entrenamientos)],
    ['marcas', numero(a.marcas)],
    ['habitos', numero(a.diasConHabitos)],
    ['sueno', a.sueno === null ? '—' : t('ascent.anio.horas', { h: Math.floor(a.sueno / 60), m: String(Math.round(a.sueno % 60)).padStart(2, '0') })],
    ['comida', numero(a.diasConComida)],
  ];
  return (
    <Carta titulo={t('ascent.anio.titulo')} derecha={t('ascent.anio.cuando')}>
      <View style={st.grilla}>
        {datos.map(([k, valor]) => (
          <View key={k} style={st.dato}>
            <Text style={st.datoValor}>{valor}</Text>
            <Text style={st.datoNombre}>{t(`ascent.anio.datos.${k}`)}</Text>
          </View>
        ))}
      </View>
      <Text style={st.nota}>{t('ascent.anio.desde', { fecha: fechaDiaMes(a.desde) })}</Text>
    </Carta>
  );
}

export const st = StyleSheet.create({
  esperando: { minHeight: 600 },
  grupo: { marginTop: 36, paddingBottom: 12, fontFamily: letras.texto, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: C.sub },
  carta: { paddingTop: 16, paddingBottom: 26, borderTopWidth: 1, borderTopColor: C.lineaFuerte },
  cartaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 24 },
  cartaTitulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 16, color: C.tinta },
  derecha: { flexShrink: 1, fontFamily: letras.texto, fontSize: 11.5, color: C.sub, textAlign: 'right', fontVariant: ['tabular-nums'] },
  texto: { marginTop: 6, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(232, 236, 246, 0.62)' },
  nota: { marginTop: 10, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: C.sub, fontVariant: ['tabular-nums'] },
  pie: { marginTop: 24, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: C.sub, textAlign: 'center' },
  enlace: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 12.5, color: C.claro },
  explicacion: { marginTop: 10, gap: 8 },
  explicacionTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18.5, color: 'rgba(232, 236, 246, 0.6)' },
  // Hoy en Ascent
  hoy: { marginTop: 30, borderTopColor: 'rgba(126, 140, 168, 0.55)' },
  hoySesion: { marginTop: 8, fontFamily: letras.numero, fontSize: 18, lineHeight: 23, color: C.tinta, fontVariant: ['tabular-nums'] },
  hoyMeta: { marginTop: 8, fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: C.claro, fontVariant: ['tabular-nums'] },
  semana: { flexDirection: 'row', gap: 6, height: 104, marginTop: 18 },
  semanaDia: { flex: 1, alignItems: 'center', gap: 6 },
  semanaKcal: { fontFamily: letras.numero, fontSize: 9.5, color: C.sub, fontVariant: ['tabular-nums'] },
  semanaHoy: { color: C.tinta },
  semanaPista: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'flex-end' },
  semanaBarra: { width: '100%', maxWidth: 24, backgroundColor: C.lineaFuerte },
  barraGimnasio: { backgroundColor: C.claro },
  barraPrevista: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: C.apagado },
  semanaLetra: { fontFamily: letras.texto, fontSize: 10, color: C.sub },
  leyenda: { flexDirection: 'row', gap: 16, marginTop: 12 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaMuestra: { width: 8, height: 8, backgroundColor: C.lineaFuerte },
  leyendaTexto: { fontFamily: letras.texto, fontSize: 10.5, color: C.sub },
  // El gimnasio
  contorno: { marginTop: 14, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 236, 246, 0.7)' },
  contornoApretado: { backgroundColor: 'rgba(232, 236, 246, 0.08)' },
  contornoTexto: { fontFamily: letras.textoMedio, fontSize: 14.5, letterSpacing: 0.3, color: C.tinta },
  // Recuperación
  recFila: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  anillo: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  anilloTexto: { fontFamily: letras.numeroLiviano, fontSize: 34, color: C.tinta, fontVariant: ['tabular-nums'] },
  conviene: { flex: 1, fontFamily: letras.textoMedio, fontSize: 17, lineHeight: 21, color: C.tinta },
  parte: { marginTop: 13 },
  parteFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parteNombre: { width: 70, fontFamily: letras.texto, fontSize: 13, color: C.sub },
  parteBarra: { flex: 1, height: 3, overflow: 'hidden', backgroundColor: C.lineaFuerte },
  parteRelleno: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.claro },
  parteValor: { minWidth: 50, textAlign: 'right', fontFamily: letras.numero, fontSize: 12.5, color: C.tinta, fontVariant: ['tabular-nums'] },
  parteDetalle: { marginTop: 5, marginLeft: 82, fontFamily: letras.texto, fontSize: 11.5, color: C.sub, fontVariant: ['tabular-nums'] },
  // Rendimiento
  rendFila: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10 },
  rendNombre: { flex: 1, fontFamily: letras.texto, fontSize: 13, color: C.sub },
  rendCategoria: { fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  rendValor: { minWidth: 44, textAlign: 'right', fontFamily: letras.numero, fontSize: 12.5, color: C.sub, fontVariant: ['tabular-nums'] },
  motivos: { marginTop: 12, gap: 6 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  punto: { width: 4, height: 4, borderRadius: 2, marginTop: 8, marginLeft: 2, backgroundColor: C.claro },
  itemTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(232, 236, 246, 0.72)' },
  // Músculos
  musculosAntes: { marginTop: 4 },
  musculos: { marginTop: 10 },
  musculo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.linea },
  musculoNombre: { fontFamily: letras.texto, fontSize: 14, color: C.tinta },
  musculoDerecha: { alignItems: 'flex-end', gap: 3 },
  estado: { paddingVertical: 5, paddingHorizontal: 8, borderWidth: 1, borderColor: C.lineaFuerte, fontFamily: letras.texto, fontSize: 11, letterSpacing: 0.6, color: C.sub, overflow: 'hidden' },
  estadoBien: { color: C.verde, borderColor: 'rgba(166, 191, 148, 0.4)' },
  estadoCargado: { color: C.ambar, borderColor: 'rgba(240, 196, 138, 0.4)' },
  musculoListo: { fontFamily: letras.texto, fontSize: 11.5, color: C.sub },
  // Marca
  marcaTitulo: { marginTop: 10, fontFamily: letras.texto, fontSize: 19, lineHeight: 24, color: C.tinta },
  marcaP: { marginTop: 10, fontFamily: letras.numero, fontSize: 15, color: C.claro },
  // Por qué no subes
  estancEjercicio: { marginTop: 8, fontFamily: letras.texto, fontSize: 15, lineHeight: 20, color: C.tinta },
  tabla: { marginTop: 16, gap: 11 },
  tablaFila: { flexDirection: 'row', alignItems: 'baseline', gap: 18 },
  crece: { flex: 1 },
  tablaNombreCaja: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tablaMarca: { width: 5, height: 5, backgroundColor: C.claro },
  tablaNombre: { fontFamily: letras.texto, fontSize: 13.5, color: C.sub },
  tablaCol: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: C.sub, textAlign: 'right' },
  tablaValor: { minWidth: 70, textAlign: 'right', fontFamily: letras.numero, fontSize: 13.5, color: 'rgba(232, 236, 246, 0.78)', fontVariant: ['tabular-nums'] },
  tablaMayor: { color: C.tinta },
  causa: { marginTop: 18, fontFamily: letras.textoMedio, fontSize: 15, lineHeight: 20, color: C.tinta },
  frase: { marginTop: 18, fontFamily: letras.texto, fontSize: 15, lineHeight: 21, color: C.claro },
  juntandoFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  juntandoTexto: { fontFamily: letras.texto, fontSize: 13, color: C.sub },
  cuadros: { flexDirection: 'row', gap: 6 },
  cuadro: { width: 12, height: 12, borderWidth: 1, borderColor: C.apagado },
  cuadroLleno: { backgroundColor: C.claro, borderColor: C.claro },
  // Tu año
  grilla: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 18 },
  dato: { width: '33.3%', gap: 5, paddingRight: 8 },
  datoValor: { fontFamily: letras.numeroLiviano, fontSize: 24, color: C.tinta, fontVariant: ['tabular-nums'] },
  datoNombre: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: C.sub },
});
