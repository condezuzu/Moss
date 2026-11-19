// La sección de Ascent vinculada, la misma que tiene Ascent de Moss (spec/musculos-compartido.md): la misma información,
// el mismo orden y lo mismo al tocar; cambia solo la cara. Se llega por abajo, a tus músculos (el cuerpo con el color
// de la semana, la barra de cada uno y, al tocar uno, sus partes, tus ejercicios y cuándo subir el peso, y la nota de
// tu rutina); subiendo, los fatigados, tu año, los estancados y por qué puedes estar estancado. Debajo de cada bloque,
// «En qué se basa», solo lo suyo. Las cuentas están en vista.ts y en puntajeMuscular.ts.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAscent } from '@/almacen/ascent';
import { POCAS_PESADAS, PROTEINA_POR_KG, type Razon } from '@/dominio/progresoCompartido';
import { diaDeLaSemana, diasEntre, type ClaveDia } from '@/dominio/fechas';
import type { Musculo } from '@/dominio/musculos';
import { FRANJA, PUNTAJE_TOPE, type EstadoDelPuntaje } from '@/dominio/puntajeMuscular';
import { NOCHE_CORTA } from '@/dominio/rendimiento';
import { lista, plural, t, type ClaveDeLista } from '@/textos';
import { letras } from '@/tema';
import { duracion, numero, useEstado } from '../comida/datos';
import { usePersona, useSueno } from '../ganchos';
import { C, GRUPOS_DEL_ANIO, useAcento } from './colores';
import { Cuerpo, type EstadoDibujado } from './Dibujos';
import { conMayuscula, cuandoDe, enFrase, nombreDelEjercicio, nombreDelMusculo, tx } from './palabras';
import { Cambia, Desplegable, Etiqueta, Flecha, Fundido, Nota, Parte, Una, Escala, Enlace } from './piezas';
import { calcularTodo, calcularTusMusculos, type EjercicioDeLaSemana, type Estancado, type Hoy, type MusculoDeLaSemana, type Todo, type TusMusculos as DeTusMusculos } from './vista';

/** La barra del sueño va de 0 a 10 horas; la de la proteína, hasta 2,6 g por kilo. */
const SUENO_TOPE = 10 * 60;
const PROTEINA_TOPE = 2.6;
const LLEGA = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Las cuentas de tus músculos, una vez para los dos lugares que las usan (abajo, tus músculos; arriba, los fatigados). */
export function useTusMusculos(h: Hoy | null): DeTusMusculos | null {
  return useMemo(() => (h ? calcularTusMusculos(h) : null), [h]);
}

/** Lo de arriba de tus músculos, de lo menos a lo más importante (se llega por abajo). */
export function RestoVinculada({ h, tm, preparada }: { h: Hoy; tm: DeTusMusculos; preparada: boolean }) {
  const e = useEstado();
  const d = useAscent();
  const persona = usePersona();
  const sueno = useSueno();
  const todo = useMemo(
    () => (preparada ? calcularTodo(h, { e, d, sueno, persona, ahora: new Date(h.ahora) }) : null),
    [preparada, h, e, d, sueno, persona],
  );
  if (!todo) return <View style={st.esperando} />;
  return (
    <>
      <PorQue todo={todo} />
      <Estancados todo={todo} />
      <TuAnio h={h} todo={todo} />
      <Fatigados tm={tm} />
    </>
  );
}

// ------------------------------------------------------------ en qué se basa, debajo de cada bloque
function EnQueSeBasa({ de }: { de: 'musculos' | 'fatigados' | 'estancados' | 'porQue' }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={st.base}>
      <Pressable onPress={() => setAbierto((x) => !x)} style={({ pressed }) => [st.baseCab, pressed && st.apretado]} hitSlop={6} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Text style={st.baseTitulo}>{t('ascent.enQueSeBasa')}</Text>
        <Flecha abierta={abierto} />
      </Pressable>
      <Desplegable abierto={abierto} style={st.baseCuerpo}>
        {lista(`ascent.baseDe.${de}` as ClaveDeLista).map((p) => {
          const i = p.indexOf(':');
          return (
            <Text key={p} style={st.baseParrafo}>
              {i > 0 && i < 40 ? <><Text style={st.baseNegrita}>{p.slice(0, i + 1)}</Text>{p.slice(i + 1)}</> : p}
            </Text>
          );
        })}
      </Desplegable>
    </View>
  );
}

// ------------------------------------------------------------ tus músculos (lo principal, donde se llega)
const ESTADOS: readonly EstadoDelPuntaje[] = ['sinEntrenar', 'poco', 'enSuPunto', 'mucho'];

export function TusMusculos({ tm }: { tm: DeTusMusculos }) {
  const { width } = useWindowDimensions();
  const [elegido, setElegido] = useState<Musculo | null>(null);
  const elegir = (m: Musculo) => {
    Haptics.selectionAsync().catch(() => {});
    setElegido((x) => (x === m ? null : m));
  };
  const clases = Object.fromEntries(tm.musculos.filter((m) => m.estado !== 'sinEntrenar').map((m) => [m.musculo, m.estado as EstadoDibujado]));
  const fatigados = tm.fatigados.map((m) => m.musculo);
  // De los que más necesitan a los que menos: los entrenados en la semana, del puntaje más bajo al más alto.
  const entrenados = tm.musculos.filter((m) => m.series > 0).sort((a, b) => a.puntaje - b.puntaje);
  const del = elegido ? tm.musculos.find((m) => m.musculo === elegido) ?? null : null;
  const etiqueta = entrenados.map((m) => `${nombreDelMusculo(m.musculo)}: ${tx(`ascent.tus.estados.${m.estado}`).toLowerCase()}`).join(', ');
  return (
    <View style={st.tus}>
      <Text style={st.tusEtq}>{t('ascent.tus.titulo')}</Text>
      {!tm.conDatos ? (
        <Text style={st.vacio}>{t('ascent.tus.sinDatos')}</Text>
      ) : (
        <>
          <View style={st.cuerpo}>
            <Cuerpo ancho={Math.min(width - 44, 360)} clases={clases} fatigados={fatigados} elegido={elegido} rotulos alTocar={elegir} etiqueta={etiqueta || t('ascent.tus.titulo')} />
          </View>
          <Leyenda />
          <Fundido clave={elegido ?? 'lista'} style={st.debajo}>
            {del ? (
              <DetalleDelMusculo m={del} tm={tm} alVolver={() => setElegido(null)} />
            ) : (
              <>
                <View style={st.barras}>
                  {entrenados.map((m) => <FilaDelMusculo key={m.musculo} m={m} alTocar={() => elegir(m.musculo)} />)}
                </View>
                <Text style={st.franja}>{t('ascent.tus.franja')}</Text>
                <Text style={st.toca}>{t('ascent.tus.toca')}</Text>
              </>
            )}
          </Fundido>
          <Rutina nota={tm.nota} />
          <Nota style={st.anotas}>{t('ascent.tus.anotas')}</Nota>
        </>
      )}
      <EnQueSeBasa de="musculos" />
    </View>
  );
}

/** Los colores del cuerpo, con «fatigado» aparte: un borde punteado. */
function Leyenda() {
  const a = useAcento();
  const relleno: Record<EstadoDelPuntaje, object> = {
    sinEntrenar: { backgroundColor: 'rgba(170, 178, 196, 0.2)' },
    poco: { backgroundColor: a.claro, opacity: 0.45 },
    enSuPunto: { backgroundColor: a.claro },
    mucho: { backgroundColor: C.ambar, opacity: 0.85 },
  };
  return (
    <View style={st.leyenda}>
      {ESTADOS.map((x) => (
        <View key={x} style={st.leyendaItem}>
          <View style={[st.leyendaCuadro, relleno[x]]} />
          <Text style={st.leyendaTexto}>{tx(`ascent.tus.estados.${x}`)}</Text>
        </View>
      ))}
      <View style={st.leyendaItem}>
        <View style={[st.leyendaCuadro, st.leyendaFatigado]} />
        <Text style={st.leyendaTexto}>{t('ascent.tus.estados.fatigado')}</Text>
      </View>
    </View>
  );
}

const enLaBarra = (p: number) => (Math.min(PUNTAJE_TOPE, Math.max(0, p)) / PUNTAJE_TOPE) * 100;

/** El puntaje de 0 a 200, con la franja «en su punto» (70 a 130) marcada; lo lleno crece al aparecer. */
function BarraDePuntaje({ p, estado, alta = 8 }: { p: number; estado: EstadoDelPuntaje; alta?: number }) {
  const a = useAcento();
  const reducido = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(enLaBarra(p), { duration: reducido ? 0 : 700, easing: LLEGA }));
  }, [p, reducido, v]);
  const lleno = useAnimatedStyle(() => ({ width: `${v.get()}%` }));
  const color = estado === 'mucho' ? C.ambar : a.claro;
  return (
    <View style={[st.pista, { height: alta, borderRadius: alta / 2 }]}>
      <View style={[st.zona, { left: `${enLaBarra(FRANJA.desde)}%`, width: `${enLaBarra(FRANJA.hasta) - enLaBarra(FRANJA.desde)}%` }]} />
      <Animated.View style={[st.lleno, { backgroundColor: color, borderRadius: alta / 2, opacity: estado === 'poco' ? 0.6 : 1 }, lleno]} />
      <View style={[st.bordes, { left: `${enLaBarra(FRANJA.desde)}%`, width: `${enLaBarra(FRANJA.hasta) - enLaBarra(FRANJA.desde)}%` }]} />
    </View>
  );
}

const series = (n: number) => numero(n, n % 1 ? 1 : 0);

function FilaDelMusculo({ m, alTocar }: { m: MusculoDeLaSemana; alTocar: () => void }) {
  const estado = tx(`ascent.tus.estados.${m.estado}`);
  return (
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [st.fila, pressed && st.apretado]}
      accessibilityRole="button"
      accessibilityLabel={t('ascent.tus.barra', { musculo: nombreDelMusculo(m.musculo), puntaje: m.puntaje, estado: estado.toLowerCase(), series: series(m.series) })}
    >
      <Text style={st.filaNombre} numberOfLines={1}>{nombreDelMusculo(m.musculo)}</Text>
      <View style={st.crece}><BarraDePuntaje p={m.puntaje} estado={m.estado} /></View>
      <Text style={[st.filaNumero, m.estado === 'mucho' && { color: C.ambar }]}>{m.puntaje}</Text>
    </Pressable>
  );
}

/** Lo de un músculo: su barra, cómo está, sus partes y sus ejercicios de la semana con la próxima sesión. */
function DetalleDelMusculo({ m, tm, alVolver }: { m: MusculoDeLaSemana; tm: DeTusMusculos; alVolver: () => void }) {
  const fuerte = (x: EjercicioDeLaSemana) => x.principal.includes(m.musculo);
  const ejercicios = tm.ejercicios.filter((x) => fuerte(x) || x.ayudan.includes(m.musculo)).sort((x, y) => Number(fuerte(y)) - Number(fuerte(x)));
  const fatiga = m.listo ? { fatiga: m.fatiga, dias: m.dias, listo: m.listo } : null;
  const parte = m.musculo === 'pecho' ? 'pechoAlto' : m.musculo === 'triceps' ? 'tricepsLarga' : null;
  const enParte = parte ? (m.partes[parte] ?? 0) : 0;
  return (
    <View>
      <View style={st.detCab}>
        <Text style={st.detNombre}>{nombreDelMusculo(m.musculo)}</Text>
        <Text style={[st.detNumero, m.estado === 'mucho' && { color: C.ambar }]}>{m.puntaje}</Text>
      </View>
      <BarraDePuntaje p={m.puntaje} estado={m.estado} alta={10} />
      <Text style={st.detLinea}>{`${tx(`ascent.tus.estados.${m.estado}`)} · ${t('ascent.tus.series', { n: series(m.series) })}`}</Text>
      {fatiga && (
        <Text style={[st.detLinea, { color: C.lejos }]}>
          {`${tx(`ascent.cuerpo.estados.${fatiga.fatiga}`)} · ${cuandoVuelve(fatiga)}`}
        </Text>
      )}
      {parte && (
        <View style={st.partes}>
          <Etiqueta>{t('ascent.tus.partes.titulo')}</Etiqueta>
          {([[parte, enParte], [`${m.musculo}Resto`, Math.max(0, m.series - enParte)]] as const).map(([k, n]) => (
            <View key={k} style={st.parte}>
              <Text style={st.parteNombre}>{tx(`ascent.tus.partes.${k}`)}</Text>
              <Text style={st.parteValor}>{series(n)}</Text>
            </View>
          ))}
        </View>
      )}
      <Etiqueta style={st.ejsEtq}>{t('ascent.tus.ejercicios')}</Etiqueta>
      {!ejercicios.length ? (
        <Text style={st.detLinea}>{t('ascent.tus.sinEjercicios')}</Text>
      ) : (
        ejercicios.map((x) => <FilaDelEjercicio key={nombreDelEjercicio(x.e)} x={x} ayuda={!fuerte(x)} />)
      )}
      <Enlace texto={t('ascent.tus.lista')} alTocar={alVolver} />
    </View>
  );
}

function FilaDelEjercicio({ x, ayuda }: { x: EjercicioDeLaSemana; ayuda: boolean }) {
  const a = useAcento();
  const datos = [t('ascent.tus.duras', { n: x.duras })];
  if (x.alFallo) datos.push(t('ascent.tus.alFallo', { n: x.alFallo }));
  if (x.rir.length) {
    const de = Math.min(...x.rir), hasta = Math.max(...x.rir);
    datos.push(de === hasta ? t('ascent.tus.rirUno', { n: de }) : t('ascent.tus.rir', { de, a: hasta }));
  }
  if (ayuda) datos.push(t('ascent.tus.ayuda'));
  const p = x.proxima;
  const proxima = p.decision === 'subir' ? t('ascent.tus.proxima.subir') : p.decision === 'noSeSabe' ? t('ascent.tus.proxima.pocasSesiones') : tx(`ascent.tus.proxima.${p.razon}`, { tope: x.tope ?? '' });
  return (
    <View style={st.ej}>
      <Text style={st.ejNombre}>{nombreDelEjercicio(x.e)}</Text>
      <Text style={st.ejDatos}>{datos.join(' · ')}</Text>
      {!ayuda && (
        <View style={st.ejProxima}>
          <View style={[st.ejPunto, { backgroundColor: p.decision === 'subir' ? a.claro : 'transparent', borderColor: p.decision === 'subir' ? a.claro : C.apagado }]} />
          <Text style={st.ejProximaTexto}>{proxima}</Text>
        </View>
      )}
    </View>
  );
}

/** La nota de tu rutina de Ascent y lo que la mejoraría. */
function Rutina({ nota }: { nota: DeTusMusculos['nota'] }) {
  const a = useAcento();
  return (
    <View style={st.rutina}>
      <View style={st.rutinaCab}>
        <Etiqueta>{t('ascent.tus.rutina.titulo')}</Etiqueta>
        {nota && <Text style={[st.rutinaNota, { color: nota.nota === 'mejorable' ? C.lejos : a.claro }]}>{tx(`ascent.tus.rutina.nota.${nota.nota}`)}</Text>}
      </View>
      {!nota ? (
        <Text style={st.detLinea}>{t('ascent.tus.rutina.sinRutina')}</Text>
      ) : (
        nota.mejoras.map((x) => (
          <Text key={x.musculo} style={st.mejora}>
            {conMayuscula(tx(`ascent.tus.rutina.${x.que}`, { musculo: nombreDelMusculo(x.musculo as Musculo).toLowerCase(), n: series(x.series) }))}
          </Text>
        ))
      )}
    </View>
  );
}

// ------------------------------------------------------------ músculos fatigados
/** «vuelve mañana», «vuelve pasado mañana» o «vuelve el sábado». */
function cuandoVuelve(f: { dias: number; listo: ClaveDia }): string {
  if (f.dias <= 2) return t('ascent.fatigados.vuelve', { cuando: cuandoDe(f.dias === 1 ? 'manana' : 'pasadoManana') });
  return t('ascent.fatigados.vuelveEl', { dia: lista('fecha.dias')[diaDeLaSemana(f.listo)] });
}

function Fatigados({ tm }: { tm: DeTusMusculos }) {
  return (
    <Parte titulo={t('ascent.fatigados.titulo')}>
      <Una>{t('ascent.fatigados.texto')}</Una>
      {!tm.fatigados.length ? (
        <Text style={st.ninguno}>{t('ascent.fatigados.ninguno')}</Text>
      ) : (
        <View style={st.fatigados}>
          {tm.fatigados.map((m, i) => (
            <View key={m.musculo} style={[st.fatigado, i === 0 && st.sinBorde]}>
              <View style={[st.fatigadoMarca, m.fatiga === 'cargado' && { backgroundColor: 'rgba(203, 133, 105, 0.25)' }]} />
              <Text style={st.fatigadoNombre}>{nombreDelMusculo(m.musculo)}</Text>
              <Text style={st.fatigadoEstado}>{tx(`ascent.cuerpo.estados.${m.fatiga}`)}</Text>
              <Text style={st.fatigadoCuando}>{cuandoVuelve(m)}</Text>
            </View>
          ))}
        </View>
      )}
      <EnQueSeBasa de="fatigados" />
    </Parte>
  );
}

// ------------------------------------------------------------ los estancados y por qué
const v1 = (n: number) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
const horasDe = (min: number) => duracion(Math.round(min / 5) * 5);

function Estancados({ todo }: { todo: Todo }) {
  const est = todo.estancados;
  return (
    <Parte titulo={t('ascent.estancados.lista')}>
      <Una>{t('ascent.estancados.texto', { n: todo.umbral })}</Una>
      {!est.length ? (
        <Text style={st.ninguno}>{t('ascent.estancados.ninguno')}</Text>
      ) : (
        est.map((e, i) => {
          const marca = t('ascent.estancamiento.marca', { kg: numero(e.ultima.kilos, e.ultima.kilos % 1 ? 1 : 0), reps: e.ultima.reps });
          return (
            <View key={nombreDelEjercicio(e.e)} style={[st.estancEj, i === 0 && st.sinBorde]}>
              <Text style={st.estancNombre}>{nombreDelEjercicio(e.e)}</Text>
              <Text style={st.estancDato}>{t('ascent.estancados.dato', { n: e.sinMarca, marca })}</Text>
            </View>
          );
        })
      )}
      <EnQueSeBasa de="estancados" />
    </Parte>
  );
}

/** Las series duras de cada semana: las de cuando subía, llenas; las de ahora, huecas. */
function Barras({ est }: { est: Estancado }) {
  const a = useAcento();
  const tope = Math.max(1, ...est.antes.map((s) => s.series), ...est.ahora.map((s) => s.series));
  const barra = (n: number, ahora: boolean, k: string) => <View key={k} style={[st.barra, ahora ? [st.barraAhora, { borderColor: a.principal }] : [st.barraAntes, { backgroundColor: a.claro }], { height: `${Math.max(4, (n / tope) * 100)}%` }]} />;
  return (
    <View style={st.semanas}>
      {est.antes.map((s) => barra(s.series, false, `a${s.lunes}`))}
      <View style={st.semanasDivisor} />
      {est.ahora.map((s) => barra(s.series, true, `h${s.lunes}`))}
    </View>
  );
}

function RazonVista({ x, est }: { x: Razon; est: Estancado }) {
  const a = useAcento();
  const cab = (titulo: string, valor?: string) => (
    <View style={st.razonCab}>
      <Text style={st.razonTitulo}>{titulo}</Text>
      {!!valor && <Text style={st.razonValor}>{valor}</Text>}
    </View>
  );
  const p = (texto: string) => <Text style={st.razonTexto}>{texto}</Text>;
  if (x.que === 'series') {
    const texto = t('ascent.estancados.series.texto', { antes: v1(x.antes), ahora: v1(x.ahora) });
    return (
      <View style={st.razon}>
        {cab(t('ascent.estancados.series.titulo', { musculo: nombreDelMusculo(est.musculo).toLowerCase() }), `${v1(x.antes)} → ${v1(x.ahora)}`)}
        <View accessible accessibilityRole="image" accessibilityLabel={texto}><Barras est={est} /></View>
        <View style={st.leyendaRazon}>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAntes, { backgroundColor: a.claro }]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.antes')}</Text></View>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAhora, { borderColor: a.principal }]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.ahora')}</Text></View>
        </View>
        {p(texto)}
      </View>
    );
  }
  if (x.que === 'frecuencia') return <View style={st.razon}>{cab(t('ascent.estancados.frecuencia.titulo'), `${v1(x.antes)} → ${v1(x.ahora)}`)}{p(t('ascent.estancados.frecuencia.texto', { antes: v1(x.antes), ahora: v1(x.ahora) }))}</View>;
  if (x.que === 'pesadas') {
    const texto = t('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de });
    return <View style={st.razon}>{cab(t('ascent.estancados.pesadas.titulo'), `${x.pesadas} / ${x.de}`)}<Escala valor={x.pesadas / x.de} tope={1} rayas={[[POCAS_PESADAS, t('ascent.estancados.pesadas.raya')]]} etiqueta={texto} />{p(texto)}</View>;
  }
  if (x.que === 'bajando') return <View style={st.razon}>{cab(t('ascent.estancados.bajando.titulo'), t('ascent.estancados.bajando.valor', { n: numero(x.porSemana, 1) }))}{p(t('ascent.estancados.bajando.texto'))}</View>;
  if (x.que === 'definicion') return <View style={st.razon}>{cab(t('ascent.estancados.definicion.titulo'))}{p(t('ascent.estancados.definicion.texto'))}</View>;
  if (x.que === 'proteina') {
    const texto = t('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) });
    return <View style={st.razon}>{cab(t('ascent.estancados.proteina.titulo'), t('ascent.filas.comida.valor', { g: numero(x.gPorKg, 1) }))}<Escala valor={x.gPorKg} tope={PROTEINA_TOPE} rayas={[[PROTEINA_POR_KG, t('ascent.filas.comida.raya')]]} limita etiqueta={texto} />{p(texto)}</View>;
  }
  return (
    <View style={st.razon}>
      {cab(t('ascent.estancados.sueno.titulo'), horasDe(x.ahora))}
      <Escala valor={x.ahora} tope={SUENO_TOPE} rayas={[[NOCHE_CORTA, t('ascent.filas.sueno.seis')]]} zona={NOCHE_CORTA} etiqueta={horasDe(x.ahora)} />
      {p(x.antes !== null ? t('ascent.estancados.sueno.texto', { ahora: horasDe(x.ahora), antes: horasDe(x.antes) }) : t('ascent.estancados.sueno.sinAntes', { ahora: horasDe(x.ahora) }))}
    </View>
  );
}

/** Lo que es de la persona y no del ejercicio: si les toca a todos, va una vez, arriba. */
const DE_LA_PERSONA: readonly Razon['que'][] = ['bajando', 'definicion', 'proteina', 'sueno'];

function PorQue({ todo }: { todo: Todo }) {
  const est = todo.estancados;
  const comunes = est.length > 1 ? DE_LA_PERSONA.filter((q) => est.every((e) => e.r.razones.some((x) => x.que === q))) : [];
  return (
    <Parte titulo={t('ascent.porQue.titulo')}>
      {!est.length ? (
        <Text style={st.ninguno}>{t('ascent.porQue.ninguno')}</Text>
      ) : (
        <>
          {comunes.length > 0 && (
            <View style={[st.estancEj, st.sinBorde]}>
              <Text style={st.estancNombre}>{t('ascent.estancados.comunes')}</Text>
              <View style={st.razones}>{est[0].r.razones.filter((x) => comunes.includes(x.que)).map((x) => <RazonVista key={x.que} x={x} est={est[0]} />)}</View>
            </View>
          )}
          {est.map((e, i) => {
            const propias = e.r.razones.filter((x) => !comunes.includes(x.que));
            return (
              <View key={nombreDelEjercicio(e.e)} style={[st.estancEj, i === 0 && !comunes.length && st.sinBorde]}>
                <Text style={st.estancNombre}>{nombreDelEjercicio(e.e)}</Text>
                {propias.length ? (
                  <View style={st.razones}>{propias.map((x) => <RazonVista key={x.que} x={x} est={e} />)}</View>
                ) : (
                  <Text style={st.ninguno}>{t(comunes.length ? 'ascent.estancados.soloComunes' : 'ascent.estancados.sinCausa')}</Text>
                )}
                {(e.r.faltan.includes('comida') || e.r.faltan.includes('sueno')) && <Nota>{t('ascent.estancados.faltan')}</Nota>}
              </View>
            );
          })}
          {est.some((e) => e.r.anios !== null) && <Text style={st.contexto}>{t('ascent.estancados.anios')}</Text>}
        </>
      )}
      <EnQueSeBasa de="porQue" />
    </Parte>
  );
}

// ------------------------------------------------------------ tu año
type CeldaDelAnio = { fecha: ClaveDia; clase: 'nada' | 'futuro' | 'hoy' | 'descanso' | keyof typeof GRUPOS_DEL_ANIO; marca: boolean };

/** Un día por cuadro, los meses en filas, con el color de lo que entrenaste y un punto en cada marca. */
export function MapaDelAnio({ hoy, dias, elegido, alElegir, vacio }: { hoy: ClaveDia; dias: Todo['anio']['dias']; elegido?: ClaveDia | null; alElegir?: (f: ClaveDia) => void; vacio?: boolean }) {
  const [ancho, setAncho] = useState(0);
  const anio = Number(hoy.slice(0, 4));
  const porFecha = useMemo(() => new Map(dias.map((x) => [x.fecha, x])), [dias]);
  const filas = useMemo(() => Array.from({ length: 12 }, (_, mes) => {
    const enElMes = new Date(anio, mes + 1, 0).getDate();
    return Array.from({ length: 31 }, (_, i): CeldaDelAnio => {
      const n = i + 1;
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const x = porFecha.get(fecha);
      const clase = n > enElMes ? 'nada' : fecha > hoy ? 'futuro' : fecha === hoy ? 'hoy' : x?.grupo ?? 'descanso';
      return { fecha, clase, marca: !!x?.marca && clase !== 'nada' };
    });
  }), [anio, hoy, porFecha]);
  const MES = 24;
  const lado = ancho ? (ancho - MES - 30 * 1.5) / 31 : 0;
  const tocar = (x: number, y: number) => {
    if (!alElegir || !lado) return;
    const col = Math.floor((x - MES) / (lado + 1.5));
    const fila = Math.floor(y / (lado + 2));
    const c = filas[fila]?.[col];
    if (c && c.clase !== 'nada' && c.clase !== 'futuro') alElegir(c.fecha);
  };
  const meses = lista('fecha.mesesCortos');
  const total = dias.filter((x) => x.grupo).length;
  const marcas = dias.filter((x) => x.marca).length;
  return (
    <Pressable
      onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)}
      onPress={(ev) => tocar(ev.nativeEvent.locationX, ev.nativeEvent.locationY)}
      disabled={!alElegir}
      style={st.mapa}
      accessibilityRole="image"
      accessibilityLabel={t('ascent.anio.mapa', { n: total, m: marcas })}
    >
      {lado > 0 && filas.map((fila, mes) => (
        <View key={mes} style={[st.mapaFila, { height: lado }]}>
          <Text style={[st.mapaMes, { width: MES }]}>{meses[mes]}</Text>
          {fila.map((c) => (
            <View
              key={c.fecha}
              style={[
                st.mapaDia, { width: lado, height: lado },
                vacio ? st.mapaVacio : c.clase === 'nada' ? st.mapaNada : c.clase === 'futuro' ? st.mapaFuturo : c.clase in GRUPOS_DEL_ANIO ? { backgroundColor: GRUPOS_DEL_ANIO[c.clase as keyof typeof GRUPOS_DEL_ANIO] } : null,
                !vacio && (c.clase === 'hoy' || c.fecha === elegido) && st.mapaHoy,
              ]}
            >
              {!vacio && c.marca && <View style={st.mapaMarca} />}
            </View>
          ))}
        </View>
      ))}
    </Pressable>
  );
}

function TuAnio({ h, todo }: { h: Hoy; todo: Todo }) {
  const [elegido, setElegido] = useState<ClaveDia | null>(null);
  const a = todo.anio;
  const detalle = (fecha: ClaveDia) => {
    const x = a.dias.find((y) => y.fecha === fecha);
    const [, m, dd] = fecha.split('-').map(Number);
    const cuando = t('fecha.corta', { num: dd, mes: lista('fecha.mesesCortos')[m - 1] });
    if (fecha === h.hoy) return t('ascent.anio.detalle.hoy', { cuando });
    if (!x?.grupo) return t('ascent.anio.detalle.descanso', { cuando });
    return t(x.marca ? 'ascent.anio.detalle.marca' : 'ascent.anio.detalle.entreno', { cuando, grupo: enFrase(tx(`ascent.hoy.grupos.${x.grupo}`)) });
  };
  const datos: [string, string][] = [
    ['entrenamientos', numero(a.datos.entrenamientos)],
    ['marcas', numero(a.datos.marcas)],
    ['habitos', numero(a.datos.diasConHabitos)],
    ['sueno', a.datos.sueno === null ? '—' : t('ascent.anio.horas', { h: Math.floor(a.datos.sueno / 60), m: String(Math.round(a.datos.sueno % 60)).padStart(2, '0') })],
    ['comida', numero(a.datos.diasConComida)],
  ];
  return (
    <Parte titulo={t('ascent.anio.titulo')} derecha={t('ascent.anio.hastaHoy', { anio: h.hoy.slice(0, 4) })}>
      <Una>{t('ascent.anio.texto2')}</Una>
      <MapaDelAnio hoy={h.hoy} dias={a.dias} elegido={elegido} alElegir={(f) => { Haptics.selectionAsync().catch(() => {}); setElegido(f); }} />
      <LeyendaDelAnio />
      <View style={st.anioDetalle} accessibilityLiveRegion="polite">{elegido && <Cambia texto={detalle(elegido)} style={st.anioDetalleTexto} />}</View>
      {a.ultimas.length > 0 && (
        <>
          <Etiqueta style={st.anioUltimasEtq}>{t('ascent.anio.ultimas')}</Etiqueta>
          <View style={st.anioUltimas}>
            {a.ultimas.map((m) => {
              const semanas = Math.floor(diasEntre(m.fecha, h.hoy) / 7);
              return (
                <View key={m.grupo} style={st.anioUltima}>
                  <View style={[st.leyendaCuadro, { backgroundColor: GRUPOS_DEL_ANIO[m.grupo] }]} />
                  <Text style={st.anioUltimaTexto}>{`${tx(`ascent.hoy.grupos.${m.grupo}`)}: ${enFrase(nombreDelEjercicio({ id: m.id, ejercicio: m.ejercicio }))} ${t('ascent.estancamiento.marca', { kg: numero(m.kilos, m.kilos % 1 ? 1 : 0), reps: m.reps })}`}</Text>
                  <Text style={st.anioUltimaCuando}>{semanas ? plural('ascent.anio.hace', semanas) : t('ascent.anio.estaSemana')}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      <View style={st.grilla}>
        {datos.map(([k, v]) => (
          <View key={k} style={st.dato}>
            <Text style={st.datoValor}>{v}</Text>
            <Text style={st.datoNombre}>{tx(`ascent.anio.datos.${k}`)}</Text>
          </View>
        ))}
      </View>
    </Parte>
  );
}

function LeyendaDelAnio() {
  const items: [string, string, object][] = [
    ...(['pecho', 'espalda', 'piernas', 'brazos'] as const).map((g): [string, string, object] => [g, tx(`ascent.hoy.grupos.${g}`), { backgroundColor: GRUPOS_DEL_ANIO[g] }]),
    ['descanso', t('ascent.anio.descanso'), { backgroundColor: 'rgba(170, 178, 196, 0.1)' }],
    ['marca', t('ascent.anio.marca'), { backgroundColor: 'rgba(170, 178, 196, 0.25)' }],
  ];
  return (
    <View style={st.anioLeyenda}>
      {items.map(([k, texto, color]) => (
        <View key={k} style={st.leyendaItem}>
          <View style={[st.leyendaCuadro, color]}>{k === 'marca' && <View style={st.mapaMarca} />}</View>
          <Text style={st.leyendaTexto}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  esperando: { minHeight: 600 },
  crece: { flex: 1, minWidth: 0 },
  sinBorde: { borderTopWidth: 0 },
  apretado: { opacity: 0.6 },
  vacio: { marginTop: 18, fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: C.sub },
  ninguno: { marginTop: 10, fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: C.sub },
  // En qué se basa
  base: { marginTop: 16 },
  baseCab: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  baseTitulo: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  baseCuerpo: { paddingTop: 8 },
  baseParrafo: { marginBottom: 10, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: C.sub },
  baseNegrita: { fontFamily: letras.textoMedio, color: C.tinta },
  // Tus músculos
  tus: { marginTop: 2 },
  tusEtq: { fontFamily: letras.textoMedio, fontSize: 10.5, lineHeight: 13, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  cuerpo: { alignItems: 'center', marginTop: 16 },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6, marginTop: 6 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaCuadro: { width: 9, height: 9, borderRadius: 1.5, alignItems: 'center', justifyContent: 'center' },
  leyendaFatigado: { borderWidth: 1.2, borderStyle: 'dashed', borderColor: C.lejos },
  leyendaTexto: { fontFamily: letras.texto, fontSize: 11, color: C.sub },
  debajo: { marginTop: 20 },
  barras: { gap: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  filaNombre: { width: 92, fontFamily: letras.texto, fontSize: 13.5, color: C.tinta },
  filaNumero: { width: 30, textAlign: 'right', fontFamily: letras.numero, fontSize: 12.5, color: C.sub, fontVariant: ['tabular-nums'] },
  pista: { backgroundColor: 'rgba(170, 178, 196, 0.1)', overflow: 'hidden' },
  zona: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(170, 178, 196, 0.14)' },
  // Los bordes de la franja van encima de lo lleno: se ven siempre.
  bordes: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(232, 236, 246, 0.55)' },
  lleno: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  franja: { marginTop: 12, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: C.apagado },
  toca: { marginTop: 4, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: C.apagado },
  detCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  detNombre: { fontFamily: letras.texto, fontSize: 20, lineHeight: 24, color: C.tinta },
  detNumero: { fontFamily: letras.numeroLiviano, fontSize: 22, color: C.tinta, fontVariant: ['tabular-nums'] },
  detLinea: { marginTop: 8, fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: C.sub },
  partes: { marginTop: 18, gap: 8 },
  parte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  parteNombre: { fontFamily: letras.texto, fontSize: 14, color: C.tinta },
  parteValor: { fontFamily: letras.numero, fontSize: 13, color: C.sub, fontVariant: ['tabular-nums'] },
  ejsEtq: { marginTop: 20 },
  ej: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.lineaSuave },
  ejNombre: { fontFamily: letras.texto, fontSize: 15, lineHeight: 19, color: C.tinta },
  ejDatos: { marginTop: 3, fontFamily: letras.texto, fontSize: 12, lineHeight: 16, color: C.sub, fontVariant: ['tabular-nums'] },
  ejProxima: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 7 },
  ejPunto: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.3, marginTop: 5 },
  ejProximaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18.5, color: C.tinta },
  rutina: { marginTop: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  rutinaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rutinaNota: { fontFamily: letras.texto, fontSize: 16 },
  mejora: { marginTop: 8, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18.5, color: C.tinta },
  anotas: { marginTop: 18 },
  // Fatigados
  fatigados: { marginTop: 10 },
  fatigado: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  fatigadoMarca: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.2, borderStyle: 'dashed', borderColor: C.lejos },
  fatigadoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  fatigadoEstado: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  fatigadoCuando: { minWidth: 104, textAlign: 'right', fontFamily: letras.texto, fontSize: 12.5, color: C.tinta },
  // Estancados y por qué
  estancEj: { paddingTop: 14, paddingBottom: 8, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  estancNombre: { fontFamily: letras.texto, fontSize: 15.5, lineHeight: 19, color: C.tinta },
  estancDato: { marginTop: 4, fontFamily: letras.texto, fontSize: 12.5, color: C.sub, fontVariant: ['tabular-nums'] },
  razones: { marginTop: 12, gap: 14 },
  razon: { gap: 6 },
  razonCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  razonTitulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  razonValor: { fontFamily: letras.numero, fontSize: 12, color: C.sub, fontVariant: ['tabular-nums'] },
  razonTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.sub },
  semanas: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 38 },
  barra: { flex: 1, minWidth: 3 },
  barraAntes: { backgroundColor: C.claro, opacity: 0.7 },
  barraAhora: { borderWidth: 1.2, borderColor: C.principal },
  semanasDivisor: { width: 1, alignSelf: 'stretch', marginHorizontal: 4, backgroundColor: C.lineaFuerte },
  leyendaRazon: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 4 },
  contexto: { marginTop: 12, marginBottom: 2, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: C.apagado },
  // Tu año
  mapa: { marginTop: 14, gap: 2 },
  mapaFila: { flexDirection: 'row', alignItems: 'center', gap: 1.5 },
  mapaMes: { fontFamily: letras.texto, fontSize: 9.5, color: C.apagado, textTransform: 'capitalize' },
  mapaDia: { borderRadius: 1.5, backgroundColor: 'rgba(170, 178, 196, 0.1)', alignItems: 'center', justifyContent: 'center' },
  mapaVacio: { backgroundColor: 'rgba(170, 178, 196, 0.07)' },
  mapaNada: { opacity: 0 },
  mapaFuturo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(170, 178, 196, 0.08)' },
  mapaHoy: { borderWidth: 1.5, borderColor: C.tinta },
  mapaMarca: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbf8ef' },
  anioLeyenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 12 },
  anioDetalle: { minHeight: 17, marginTop: 10 },
  anioDetalleTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.tinta },
  anioUltimasEtq: { marginTop: 18 },
  anioUltimas: { marginTop: 14, gap: 9 },
  anioUltima: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  anioUltimaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  anioUltimaCuando: { fontFamily: letras.texto, fontSize: 12, color: C.sub },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 18 },
  dato: { width: '33.3%', gap: 4, paddingRight: 10 },
  datoValor: { fontFamily: letras.numeroLiviano, fontSize: 21, letterSpacing: -0.2, color: C.tinta, fontVariant: ['tabular-nums'] },
  datoNombre: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: C.sub },
});
