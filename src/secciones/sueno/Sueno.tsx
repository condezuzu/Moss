// Sueño, el de la galería (galeria/src/sueno.js; spec/sueno.md): lo que Salud trae de cada noche,
// con las reglas de src/dominio/sueno.ts. Arriba, las dos últimas semanas para elegir una noche;
// después, esa noche (cuánto dormiste, cuándo, las etapas como estimación, lo despierto), la deuda,
// su calidad con de qué sale, el horario y qué tan regular es, lo que mide el reloj de noche y de
// dónde sale cada dato, con la precisión de la noche. Lo que falta va en gris: nunca se inventa.
// Sin reloj, las noches que estima Moss con el teléfono (spec/sueno.md, «Sin reloj»): arriba, la
// pregunta de la hora si no está segura, junto a las caras de la mañana. Hasta tener noches, las de
// ejemplo, con su aviso.

import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { actualizarSalud } from '@/almacen';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  calidadDeNoche, deudaDeSueno, horario as horarioDe, MAXIMOS, MINIMOS, nivelDeLaNoche, pareceIncompleta, pocoSuenoSostenido, ultimasNoches, vitalDeNoche,
  type Confianza, type Fuente, type Noche, type NochePropia, type OrigenDeNoche, type TipoDeVital,
} from '@/dominio/sueno';
import { pedirMovimiento, permisoDeMovimiento } from '../../../modules/movimiento';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { duracion, fechaCorta, fechaDiaMes, horaDelDia, letraDelDia, numero, useEstado } from '../comida/datos';
import { useSueno } from '../ganchos';
import { Hipnograma } from '../graficos/Graficos';
import type { Sueno } from '../persona';
import { Aparece, AvisoDeEjemplo, Cabecera, Carta, Chip, Cifra, ComoSeCalcula, e as tarjeta, Eje, Nota, Parrafo, Recuadro, type TipoDeChip } from '../tarjetas';
import { EditorDeHora, LaManana, ponerHora } from './Manana';

const DIAS = 14;
const AZUL = { claro: '#8fd3e8', medio: '#6f86d6', hondo: '#4b4fa8' };
const TIPO_DE_CONFIANZA: Record<Confianza, TipoDeChip> = { alta: 'bien', media: 'atencion', baja: 'tenue' };

/** Una hora del sueño: los minutos se cuentan desde las 18 del día anterior. */
const reloj = (minutos: number) => horaDelDia(minutos + 18 * 60);
const ConConfianza = ({ nivel }: { nivel: Confianza }) => <Chip texto={t(`sueno.confianza.${nivel}`)} tipo={TIPO_DE_CONFIANZA[nivel]} />;
const TIPO_DE_ORIGEN: Record<OrigenDeNoche, TipoDeChip> = { estimada: 'tenue', confirmada: 'bien', corregida: 'bien', manual: 'bien' };
/** Un degradado de fondo: en la web es CSS, en el teléfono el de React Native 0.88. */
const degradado = (g: string) => (Platform.OS === 'web' ? { backgroundImage: g } : { experimental_backgroundImage: g }) as ViewStyle;

export function PaginaDeSueno({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  const s = useSueno();
  const [clave, setClave] = useState<ClaveDia>(e.hoy);
  const [abierto, setAbierto] = useState<string | null>(null);
  // Las dos semanas antes de una noche: con eso se miden el horario de siempre y lo tuyo.
  const anterioresA = (c: ClaveDia) => ultimasNoches(s.noches, sumarDias(c, -1), DIAS);
  const noche = s.noches.find((n) => n.clave === clave) ?? null;
  const interior = ancho - 40 - 34;
  return (
    <View style={{ width: ancho }}>
      <ScrollView contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }} showsVerticalScrollIndicator={false}>
        <Cabecera fecha={fechaCorta(e.hoy)} titulo={t('sueno.titulo')} />
        {s.deEjemplo && <AvisoDeEjemplo texto={t('sueno.ejemplo')} />}
        <LaManana hoy={e.hoy} noche={s.noches.find((n) => n.clave === e.hoy) ?? null} propia={e.noches.get(e.hoy)} noches={s.noches} ancho={interior} desde={e.metas[0]?.desde ?? null} />
        <Tira s={s} hoy={e.hoy} elegida={clave} alElegir={setClave} />
        {/* Poco sueño por semanas: la sugerencia de un médico, arriba. Una estimación, no un diagnóstico. */}
        {pocoSuenoSostenido(ultimasNoches(s.noches, e.hoy, DIAS)) && (
          <Aparece>
            <Carta titulo={t('sueno.pocoSueno.titulo')}>
              <Parrafo>{t('sueno.pocoSueno.texto')}</Parrafo>
              <Parrafo chico>{t('sueno.pocoSueno.nota')}</Parrafo>
            </Carta>
          </Aparece>
        )}
        {/* Elegir otra noche no cambia todo de golpe: lo de esa noche entra con un fundido. */}
        <Aparece key={clave}>
          {noche?.moss ? (
            <LaNocheDeMoss n={noche} hoy={e.hoy} propia={e.noches.get(noche.clave)} />
          ) : noche ? (
            <LaNoche n={noche} hoy={e.hoy} ancho={interior} anteriores={anterioresA(noche.clave)} />
          ) : (
            <SinNoche clave={clave} hoy={e.hoy} cama={s.soloEnCama.get(clave)} />
          )}
          {noche?.moss && <ElMovimiento />}
          {/* La deuda va segunda: solo necesita cuánto dormiste, así que es lo que más gente tiene bien. */}
          <LaDeuda noches={ultimasNoches(s.noches, clave, DIAS)} necesidad={s.necesidad} />
          {noche && <LaCalidad n={noche} necesidad={s.necesidad} anteriores={anterioresA(noche.clave)} abierto={abierto === 'calidad'} alAbrir={() => setAbierto((a) => (a === 'calidad' ? null : 'calidad'))} />}
          <ElHorario noches={ultimasNoches(s.noches, clave, DIAS)} clave={clave} />
          {noche && !noche.moss && <LoDelReloj n={noche} s={s} anteriores={anterioresA(noche.clave)} />}
        </Aparece>
        <LasFuentes n={noche} s={s} clave={clave} />
        <Text style={st.pie}>{t('sueno.noMedico')}</Text>
      </ScrollView>
    </View>
  );
}

// ------------------------------------------------------------------ las dos semanas, para elegir
function Tira({ s, hoy, elegida, alElegir }: { s: Sueno; hoy: ClaveDia; elegida: ClaveDia; alElegir: (c: ClaveDia) => void }) {
  // Las dos semanas que terminan hoy o, si la noche elegida es más vieja, las de alrededor.
  const fin = elegida > sumarDias(hoy, -DIAS) ? hoy : sumarDias(elegida, 6);
  const noches = ultimasNoches(s.noches, fin, DIAS);
  const maximo = Math.max(s.necesidad + 60, ...noches.flatMap((n) => (n ? [n.dormido + n.siestas] : [])));
  return (
    <View style={st.tira}>
      {noches.map((n, i) => {
        const clave = sumarDias(fin, i - DIAS + 1);
        const cama = !n ? s.soloEnCama.get(clave) : undefined;
        const alto = n ? Math.max(6, (n.dormido / maximo) * 100) : cama ? Math.max(6, (cama.minutos / maximo) * 100) : 100;
        const esta = clave === elegida;
        return (
          <Pressable key={clave} onPress={() => alElegir(clave)} style={[st.noche, esta && st.nocheElegida]} accessibilityRole="button" accessibilityState={{ selected: esta }} accessibilityLabel={t('sueno.elegirNoche', { fecha: fechaDiaMes(clave) })}>
            <View style={st.barra}>
              <View style={[st.barraLlena, { height: `${alto}%` }, !n && (cama ? st.barraCama : st.barraVacia), n && esta && { backgroundColor: AZUL.claro }, n?.moss?.origen === 'estimada' && st.barraEstimada]} />
              <View style={[st.barraMeta, { bottom: `${(s.necesidad / maximo) * 100}%` }]} />
            </View>
            <Text style={[st.nocheLetra, esta && st.nocheTextoElegido]}>{letraDelDia(clave)}</Text>
            <Text style={[st.nocheNumero, esta && st.nocheTextoElegido]}>{Number(clave.slice(8))}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function tituloDe(clave: ClaveDia, hoy: ClaveDia) {
  if (clave === hoy) return t('sueno.anoche');
  const dias = lista('fecha.dias');
  const dia = (c: ClaveDia) => dias[new Date(`${c}T12:00:00`).getDay()];
  return t('sueno.nocheDel', { desde: dia(sumarDias(clave, -1)), hasta: dia(clave) });
}

// ------------------------------------------------------------------ la noche
function LaNoche({ n, hoy, ancho, anteriores }: { n: Noche; hoy: ClaveDia; ancho: number; anteriores: (Noche | null)[] }) {
  const etapas = ['despierto', 'rem', 'nucleo', 'profundo'] as const;
  return (
    <Carta titulo={tituloDe(n.clave, hoy)} derecha={<ConConfianza nivel={n.confianza.duracion} />}>
      <Cifra valor={duracion(n.dormido)} texto={t('sueno.dormido')} />
      <Nota>{t('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })}</Nota>
      {pareceIncompleta(n, anteriores) && <Recuadro>{t('sueno.incompleta')}</Recuadro>}
      <View style={st.hipno}>
        <View style={st.hipnoEtiquetas}>
          {etapas.map((x) => <Text key={x} style={st.hipnoEtiqueta}>{t(`sueno.etapas.${x}`)}</Text>)}
        </View>
        <Hipnograma desde={n.dormirse} hasta={n.despertar} tramos={n.tramos} ancho={ancho - 70} alto={96} guias />
      </View>
      <View style={{ paddingLeft: 70 }}>
        <Eje izquierda={reloj(n.dormirse)} derecha={reloj(n.despertar)} />
      </View>
      <View style={st.etapas}>
        {(['rem', 'nucleo', 'profundo'] as const).map((x) => (
          <View key={x} style={st.etapa}>
            <View style={st.etapaNombre}>
              <View style={[st.etapaPunto, { backgroundColor: x === 'rem' ? AZUL.claro : x === 'nucleo' ? AZUL.medio : AZUL.hondo }]} />
              <Text style={st.etapaTexto}>{t(`sueno.etapas.${x}`)}</Text>
            </View>
            <Text style={st.etapaValor}>{duracion(n.etapas[x])}</Text>
            <Text style={st.etapaPorcentaje}>{`${numero(Math.round((n.etapas[x] / Math.max(1, n.dormido)) * 100))} %`}</Text>
          </View>
        ))}
      </View>
      <Parrafo chico>{n.conEtapas ? t('sueno.etapasEstimadas') : t('sueno.sinEtapas')}</Parrafo>
      <View style={st.datos}>
        <Dato nombre={t('sueno.despierto')} valor={`${duracion(Math.round(n.despierto))} · ${plural('sueno.despertares', n.despertares, { n: n.despertares })}`} nivel={n.confianza.despertares} />
        {n.enCama && <Dato nombre={t('sueno.enCama')} valor={`${duracion(n.enCama.minutos)} · ${n.enCama.fuente.nombre}`} nivel={n.confianza.enCama ?? undefined} />}
        {n.siestas > 0 && <Dato nombre={t('sueno.siesta')} valor={duracion(n.siestas)} nivel="alta" />}
      </View>
    </Carta>
  );
}

// ------------------------------------------------------------------ la noche sin reloj
/**
 * Cuánto y cuándo, de dónde sale la hora (estimada, confirmada, corregida o escrita) y, si es una
 * estimación, el rango: la franja se esfuma en los bordes con el ancho del rango.
 */
function LaNocheDeMoss({ n, hoy, propia }: { n: Noche; hoy: ClaveDia; propia: NochePropia | undefined }) {
  const [editando, setEditando] = useState(false);
  const m = n.moss!;
  const r = m.rango;
  const a = r ? r.dormirse[0] : n.dormirse, b = r ? r.despertar[1] : n.despertar;
  const desde = a - 30, hasta = b + 30;
  const x = r ? ((r.dormirse[1] - r.dormirse[0]) / (b - a)) * 100 : 0, y = r ? 100 - ((r.despertar[1] - r.despertar[0]) / (b - a)) * 100 : 100;
  const franja = r
    ? `linear-gradient(90deg, rgba(111, 134, 214, 0) 0%, rgba(111, 134, 214, 0.85) ${x.toFixed(1)}%, rgba(143, 211, 232, 0.85) ${y.toFixed(1)}%, rgba(143, 211, 232, 0) 100%)`
    : 'linear-gradient(90deg, #6f86d6, #8fd3e8)';
  return (
    <Carta titulo={tituloDe(n.clave, hoy)} derecha={<Chip texto={t(`sueno.origen.${m.origen}`)} tipo={TIPO_DE_ORIGEN[m.origen]} />}>
      <Cifra valor={duracion(n.dormido)} texto={t('sueno.dormido')} />
      <Nota>{t('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })}</Nota>
      <View style={st.franja}>
        <View style={[st.franjaBarra, { left: `${((a - desde) / (hasta - desde)) * 100}%`, width: `${((b - a) / (hasta - desde)) * 100}%` }, degradado(franja)]} />
      </View>
      <Eje izquierda={reloj(desde)} derecha={reloj(hasta)} />
      {r && <Parrafo>{`${t('sueno.rango', { a: reloj(r.dormirse[0]), b: reloj(r.dormirse[1]), c: reloj(r.despertar[0]), d: reloj(r.despertar[1]) })} ${t(`sueno.seguridad.${m.confianza}`)}.`}</Parrafo>}
      {m.origen === 'estimada' && <Parrafo chico>{t('sueno.estimadaTexto')}</Parrafo>}
      <Parrafo chico>{t('sueno.sinRelojEtapas')}</Parrafo>
      {editando ? (
        <Aparece style={st.editorNoche}>
          <EditorDeHora
            desde={n.dormirse}
            hasta={n.despertar}
            alGuardar={(d, h, cambiadas) => {
              if (cambiadas || m.origen === 'estimada') ponerHora(n.clave, d, h, cambiadas ? 'corregida' : 'confirmada', propia);
              setEditando(false);
            }}
          />
        </Aparece>
      ) : (
        <Pressable onPress={() => setEditando(true)} style={tarjeta.enlace} hitSlop={6} accessibilityRole="button">
          <Text style={tarjeta.enlaceTexto}>{t('sueno.cambiarHora')}</Text>
        </Pressable>
      )}
    </Carta>
  );
}

/** Sin reloj y sin permiso, una vez: el movimiento del teléfono mejora la estimación. Después, se va. */
function ElMovimiento() {
  const [permiso, setPermiso] = useState(permisoDeMovimiento);
  if (permiso !== 'sinPreguntar') return null;
  return (
    <Aparece>
      <Carta>
        <View style={st.movimiento}>
          <View style={st.movimientoTexto}>
            <Text style={st.movimientoTitulo}>{t('sueno.movimiento.titulo')}</Text>
            <Parrafo chico>{t('sueno.movimiento.texto')}</Parrafo>
          </View>
          <Pressable
            onPress={async () => {
              setPermiso(await pedirMovimiento());
              // Con el movimiento, la noche de anoche se vuelve a estimar.
              actualizarSalud().catch(() => {});
            }}
            style={({ pressed }) => [st.permitir, pressed && st.permitirApretado]}
            accessibilityRole="button"
          >
            <Text style={st.permitirTexto}>{t('sueno.movimiento.permitir')}</Text>
          </Pressable>
        </View>
      </Carta>
    </Aparece>
  );
}

function Dato({ nombre, valor, nivel }: { nombre: string; valor: string; nivel?: Confianza }) {
  return (
    <View style={st.dato}>
      <Text style={st.datoNombre}>{nombre}</Text>
      <View style={st.datoDerecha}>
        <Text style={st.datoValor}>{valor}</Text>
        {nivel && <ConConfianza nivel={nivel} />}
      </View>
    </View>
  );
}

function SinNoche({ clave, hoy, cama }: { clave: ClaveDia; hoy: ClaveDia; cama?: { minutos: number; fuente: Fuente } }) {
  return (
    <Carta titulo={tituloDe(clave, hoy)}>
      <Text style={st.sinDatos}>{t('sueno.sinDatos')}</Text>
      <Parrafo>{t(cama ? 'sueno.sinRelojTexto' : 'sueno.sinNadaTexto')}</Parrafo>
      {cama && (
        <View style={st.datos}>
          <Dato nombre={t('sueno.enCama')} valor={`${duracion(cama.minutos)} · ${cama.fuente.nombre}`} nivel="baja" />
        </View>
      )}
      <Parrafo chico>{t('sueno.habitosPendientes')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ la calidad
function LaCalidad({ n, necesidad, anteriores, abierto, alAbrir }: { n: Noche; necesidad: number; anteriores: (Noche | null)[]; abierto: boolean; alAbrir: () => void }) {
  const q = calidadDeNoche(n, necesidad, anteriores);
  return (
    <Carta titulo={t('sueno.calidad')}>
      {!q ? (
        <Parrafo>{t(n.moss ? 'sueno.sinCalidadEstimada' : 'sueno.sinCalidad')}</Parrafo>
      ) : (
        <>
          <Cifra valor={String(q.puntos)} texto={t(`sueno.palabras.${q.palabra}`) + (q.parcial ? ` · ${t('sueno.parcial')}` : '')} />
          <View style={st.partes}>
            {(['duracion', 'horario', 'continuidad'] as const).map((parte) => {
              const puntos = q.partes[parte];
              const maximo = MAXIMOS[parte];
              return (
                <View key={parte} style={st.parte}>
                  <View style={st.parteFila}>
                    <Text style={st.parteNombre}>{t(`sueno.partes.${parte}`)}</Text>
                    <Text style={st.partePuntos}>{puntos === null ? (parte === 'continuidad' && n.moss ? t('sueno.sinRelojParte') : t('sueno.todaviaNo')) : `${puntos} / ${maximo}`}</Text>
                  </View>
                  <View style={st.partePista}>{puntos !== null && <View style={[st.parteLlena, { width: `${(puntos / maximo) * 100}%` }]} />}</View>
                </View>
              );
            })}
          </View>
          <ComoSeCalcula abierto={abierto} alTocar={alAbrir}>
            {lista('sueno.comoCalidad').map((p) => <Parrafo key={p}>{p.replace('{necesidad}', duracion(necesidad))}</Parrafo>)}
          </ComoSeCalcula>
        </>
      )}
    </Carta>
  );
}

// ------------------------------------------------------------------ el horario
function ElHorario({ noches, clave }: { noches: (Noche | null)[]; clave: ClaveDia }) {
  const h = horarioDe(noches);
  const medidas = noches.filter((n): n is Noche => n !== null);
  const bien = h && (h.regularidad === 'muyRegular' || h.regularidad === 'regular');
  if (!medidas.length) return null;
  const desde = Math.min(...medidas.map((n) => n.dormirse)) - 30;
  const hasta = Math.max(...medidas.map((n) => n.despertar)) + 30;
  return (
    <Carta titulo={t('sueno.horario')} derecha={h ? <Chip texto={t(`sueno.regularidad.${h.regularidad}`)} tipo={bien ? 'bien' : 'atencion'} /> : undefined}>
      <View style={st.rangos}>
        {noches.map((n, i) => {
          const c = sumarDias(clave, i - DIAS + 1);
          const esta = c === clave;
          return (
            <View key={c} style={st.rango}>
              <Text style={st.rangoLetra}>{letraDelDia(c)}</Text>
              <View style={[st.rangoPista, !n && st.rangoVacio]}>
                {n && (
                  <View
                    style={[
                      st.rangoBarra,
                      { left: `${((n.dormirse - desde) / (hasta - desde)) * 100}%`, width: `${((n.despertar - n.dormirse) / (hasta - desde)) * 100}%` },
                      esta && st.rangoElegido,
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ paddingLeft: 22 }}>
        <Eje izquierda={reloj(desde)} derecha={reloj(hasta)} />
      </View>
      {!h ? (
        <Parrafo>{t('sueno.faltanNoches', { n: medidas.length, minimo: MINIMOS.regularidad })}</Parrafo>
      ) : (
        <>
          <View style={st.datos}>
            <Dato nombre={t('sueno.dormirte')} valor={t('sueno.horaYDesvio', { hora: reloj(h.dormirse), desvio: Math.round(h.desvioDormirse) })} />
            <Dato nombre={t('sueno.despertarte')} valor={t('sueno.horaYDesvio', { hora: reloj(h.despertar), desvio: Math.round(h.desvioDespertar) })} />
            {h.finDeSemana !== null && Math.abs(h.finDeSemana) >= 30 && (
              <Dato nombre={t('sueno.finDeSemana')} valor={t(h.finDeSemana > 0 ? 'sueno.masTarde' : 'sueno.masTemprano', { t: duracion(Math.abs(h.finDeSemana)) })} />
            )}
          </View>
          <Parrafo chico>{t('sueno.regularidadTexto', { n: h.noches })}</Parrafo>
        </>
      )}
    </Carta>
  );
}

// ------------------------------------------------------------------ la deuda
function LaDeuda({ noches, necesidad }: { noches: (Noche | null)[]; necesidad: number }) {
  const d = deudaDeSueno(noches, necesidad);
  const conDeuda = d !== null && d.minutos >= 15;
  return (
    <Carta titulo={t('sueno.deuda')}>
      <Cifra valor={d ? (conDeuda ? duracion(Math.round(d.minutos)) : t('sueno.sinDeuda')) : '—'} texto={conDeuda ? t('sueno.deudaDe', { necesidad: duracion(necesidad) }) : undefined} />
      <Nota>{d ? t('sueno.deudaNoches', { n: d.noches, de: d.de }) : t('sueno.faltanNoches', { n: noches.filter(Boolean).length, minimo: MINIMOS.deuda })}</Nota>
      <Parrafo chico>{t('sueno.deudaTexto')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ lo que mide el reloj de noche
const VITALES: { tipo: TipoDeVital; decimales: number; icono: 'heart' | 'waveform.path.ecg' | 'lungs' }[] = [
  { tipo: 'frecuencia', decimales: 0, icono: 'heart' },
  { tipo: 'variabilidad', decimales: 0, icono: 'waveform.path.ecg' },
  { tipo: 'respiracion', decimales: 1, icono: 'lungs' },
];

function LoDelReloj({ n, s, anteriores }: { n: Noche; s: Sueno; anteriores: (Noche | null)[] }) {
  const reposo = s.lecturas.reposo.get(n.clave);
  return (
    <Carta titulo={t('sueno.vitales')}>
      {VITALES.map(({ tipo, decimales, icono }) => {
        const lecturas = s.lecturas[tipo];
        const previos = anteriores.flatMap((x) => {
          const v = x ? vitalDeNoche(tipo, lecturas, x, []) : null;
          return v ? [v.valor] : [];
        });
        const v = vitalDeNoche(tipo, lecturas, n, previos);
        const comparado = v ? (v.comparado ? t(`sueno.comparado.${v.comparado}`) : t('sueno.aprendiendo')) : t('sueno.pocasLecturas');
        return (
          <View key={tipo} style={st.vital}>
            <View style={st.vitalNombre}>
              <Icono nombre={icono} tam={15} color="rgba(239, 230, 207, 0.5)" />
              <Text style={st.vitalNombreTexto}>{t(`sueno.vital.${tipo}`)}</Text>
            </View>
            <View style={st.vitalDerecha}>
              <Text style={st.vitalValor}>{v ? `${numero(v.valor, decimales)} ${t(`sueno.unidad.${tipo}`)}` : '—'}</Text>
              <Text style={[st.vitalComparado, v?.comparado === 'usual' && { color: colores.salvia }, (v?.comparado === 'mas' || v?.comparado === 'menos') && { color: colores.oroClaro }]}>{comparado}</Text>
            </View>
            {v && tipo === 'variabilidad' ? <Text style={st.vitalLecturas}>{plural('sueno.lecturas', v.lecturas, { n: v.lecturas })}</Text> : null}
          </View>
        );
      })}
      {/* La frecuencia en reposo es del día entero: va aparte y lo dice. */}
      {reposo !== undefined && (
        <View style={st.vital}>
          <View style={st.vitalNombre}>
            <Icono nombre="heart" tam={15} color="rgba(239, 230, 207, 0.5)" />
            <Text style={st.vitalNombreTexto}>{t('sueno.vital.reposo')}</Text>
          </View>
          <View style={st.vitalDerecha}>
            <Text style={st.vitalValor}>{`${reposo} ${t('sueno.unidad.frecuencia')}`}</Text>
            <Text style={st.vitalComparado}>{t('sueno.delDia')}</Text>
          </View>
        </View>
      )}
      <Parrafo chico>{t('sueno.vitalesTexto')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ de dónde sale cada dato
function LasFuentes({ n, s, clave }: { n: Noche | null; s: Sueno; clave: ClaveDia }) {
  const reloj = s.fuentes.find((f) => f.tipo === 'reloj') ?? null;
  const cama = s.soloEnCama.get(clave);
  // La precisión de la noche, de 0 a 5 (spec/aparatos.md): con un reloj y lo de la noche, 4; sin reloj, 1.
  const nivel = nivelDeLaNoche(n, !!n && !n.moss && vitalDeNoche('frecuencia', s.lecturas.frecuencia, n, []) !== null);
  // Sin reloj, la hora sale de Moss o de lo que contestaste; lo demás no lo sabe el teléfono.
  const deMoss = (m: NonNullable<Noche['moss']>): Fuente => ({
    id: 'moss', tipo: 'moss', nombre: t(m.origen === 'estimada' ? 'sueno.porMoss' : m.origen === 'corregida' ? 'sueno.corregidaPorTi' : 'sueno.porTi'),
  });
  const filas: [string, Fuente | null, Confianza | null][] = n?.moss
    ? [
        ['duracion', deMoss(n.moss), n.moss.origen === 'estimada' && n.moss.confianza !== 'alta' ? 'baja' : 'media'],
        ['etapas', null, null], ['despertares', null, null], ['corazon', null, null], ['variabilidad', null, null],
      ]
    : [
        ['duracion', n ? n.fuente : null, n ? n.confianza.duracion : null],
        ['etapas', n && n.conEtapas ? n.fuente : null, n ? n.confianza.etapas : null],
        ['despertares', n ? n.fuente : null, n ? n.confianza.despertares : null],
        ['enCama', n?.enCama ? n.enCama.fuente : (cama?.fuente ?? null), n?.enCama ? n.confianza.enCama : cama ? 'baja' : null],
        ['corazon', reloj, reloj ? 'media' : null],
        ['variabilidad', reloj, reloj ? 'baja' : null],
      ];
  return (
    <Carta titulo={t('sueno.fuentes')}>
      <View style={st.precision}>
        <View style={st.precisionFila}>
          <Text style={st.precisionTitulo}>{t('sueno.precision.titulo')}</Text>
          <View style={st.puntos} accessibilityLabel={`${nivel} / 5`}>
            {[1, 2, 3, 4, 5].map((i) => <View key={i} style={[st.punto, i <= nivel && st.puntoLleno]} />)}
          </View>
        </View>
        <Text style={st.precisionNivel}>{lista('sueno.precision.niveles')[nivel]}</Text>
      </View>
      {filas.map(([que, fuente, nivel]) => (
        <View key={que} style={st.fuenteFila}>
          <Text style={st.fuenteQue}>{t(`sueno.datos.${que as 'duracion'}`)}</Text>
          <View style={st.fuente}>
            <Icono nombre={fuente?.tipo === 'telefono' || fuente?.tipo === 'moss' ? 'iphone' : 'applewatch'} tam={12} color="rgba(239, 230, 207, 0.6)" />
            <Text style={st.fuenteNombre}>{fuente ? fuente.nombre : '—'}</Text>
          </View>
          {nivel ? <ConConfianza nivel={nivel} /> : <View style={{ width: 8 }} />}
        </View>
      ))}
      <Parrafo chico>{t(n?.moss ? 'sueno.fuentesSinReloj' : 'sueno.fuentesTexto')}</Parrafo>
    </Carta>
  );
}

const st = StyleSheet.create({
  tira: { marginTop: 14, flexDirection: 'row', gap: 3, paddingTop: 10, paddingHorizontal: 6, paddingBottom: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(8, 12, 26, 0.6)' },
  noche: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 3, paddingBottom: 4, borderRadius: 9 },
  nocheElegida: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  barra: { width: 9, height: 54, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  barraLlena: { width: '100%', borderRadius: 5, backgroundColor: AZUL.medio },
  barraVacia: { backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  barraEstimada: { opacity: 0.55 },
  franja: { marginTop: 12, marginBottom: 2, height: 22, borderRadius: 11, backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  franjaBarra: { position: 'absolute', top: 3, bottom: 3, borderRadius: 8 },
  editorNoche: { marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  movimiento: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  movimientoTexto: { flex: 1 },
  movimientoTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
  permitir: { minHeight: 38, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  permitirApretado: { backgroundColor: '#d9d0b8' },
  permitirTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: '#0b0f1d' },
  precision: { marginBottom: 4, gap: 6 },
  precisionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  precisionTitulo: { fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  precisionNivel: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.6)' },
  puntos: { flexDirection: 'row', gap: 5 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  puntoLleno: { backgroundColor: AZUL.claro, shadowColor: AZUL.claro, shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
  barraCama: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(239, 230, 207, 0.35)' },
  barraMeta: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.38)' },
  nocheLetra: { fontFamily: letras.textoMedio, fontSize: 9, letterSpacing: 0.4, color: 'rgba(239, 230, 207, 0.5)' },
  nocheNumero: { fontFamily: letras.numeroMedio, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'] },
  nocheTextoElegido: { color: colores.pergamino },
  hipno: { marginTop: 10, flexDirection: 'row', gap: 8 },
  hipnoEtiquetas: { width: 62, height: 96 },
  hipnoEtiqueta: { flex: 1, textAlignVertical: 'center', lineHeight: 24, fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.5)' },
  etapas: { marginTop: 10, flexDirection: 'row', gap: 8 },
  etapa: { flex: 1, gap: 3, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  etapaNombre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etapaPunto: { width: 8, height: 8, borderRadius: 4 },
  etapaTexto: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.6)' },
  etapaValor: { fontFamily: letras.numero, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  etapaPorcentaje: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.45)' },
  datos: { marginTop: 6 },
  dato: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  datoNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  datoDerecha: { alignItems: 'flex-end', gap: 4 },
  datoValor: { fontFamily: letras.numero, fontSize: 14, color: colores.pergamino, textAlign: 'right', fontVariant: ['tabular-nums'] },
  sinDatos: { fontFamily: letras.numero, fontSize: 32, color: 'rgba(239, 230, 207, 0.45)' },
  partes: { marginTop: 8, gap: 10 },
  parte: { gap: 6 },
  parteFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  parteNombre: { fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  partePuntos: { fontFamily: letras.numero, fontSize: 13, color: 'rgba(239, 230, 207, 0.7)', fontVariant: ['tabular-nums'] },
  partePista: { height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  parteLlena: { height: '100%', borderRadius: 4, backgroundColor: AZUL.medio },
  rangos: { marginTop: 8, gap: 4 },
  rango: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangoLetra: { width: 14, fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.45)' },
  rangoPista: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.03)' },
  rangoVacio: { backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  rangoBarra: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4, backgroundColor: 'rgba(111, 134, 214, 0.75)' },
  rangoElegido: { backgroundColor: AZUL.claro, shadowColor: AZUL.claro, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  vital: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 10, rowGap: 3, paddingVertical: 10, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  vitalNombre: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  vitalNombreTexto: { fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  vitalDerecha: { alignItems: 'flex-end', gap: 3 },
  vitalValor: { fontFamily: letras.numero, fontSize: 16, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  vitalComparado: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.5)' },
  vitalLecturas: { width: '100%', fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.4)' },
  fuenteFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  fuenteQue: { flex: 1, fontFamily: letras.texto, fontSize: 13, color: colores.pergamino },
  fuente: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fuenteNombre: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.6)' },
  pie: { marginTop: 18, marginHorizontal: 4, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.42)' },
});
