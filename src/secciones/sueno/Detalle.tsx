// Lo de cada noche debajo de la noche, lo de la galería (galeria/src/sueno.js): la calidad en un anillo partido en
// lo que suma cada parte, el horario con cada noche de cuándo a cuándo y la banda de lo de siempre, lo que mide el
// reloj con su línea de las dos semanas, y de dónde sale cada dato. Sin noches, el ejemplo marcado como ejemplo
// y cuánto falta para cada cosa. Lo que falta se muestra como falta: nunca se inventa.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  calidadDeNoche, horario as horarioDe, MAXIMOS, MINIMOS, nivelDeLaNoche, vitalDeNoche,
  type Cara, type Confianza, type Fuente, type Noche, type TipoDeVital,
} from '@/dominio/sueno';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Relleno } from '../animados';
import { Icono } from '../comida/comunes';
import { duracion, numero } from '../comida/datos';
import type { Sueno } from '../persona';
import { Aparece, ComoSeCalcula } from '../tarjetas';
import { CartaDeSueno, degradado, ChipDeEjemplo, ChipDeSueno, ConConfianza, Crece, Dato, diaCorto, letraDe, Nota, Progreso, Puntos, reloj, SN, Texto } from './comunes';
import { Anillo, Chispas, type ParteDelAnillo } from './Dibujos';

const DIAS = 14;
/** Cada noche, de la noche a la mañana; la elegida, más clara. */
const DE_LA_NOCHE = degradado('linear-gradient(90deg, #5a5fd0, #6b8ff0 45%, #a8e2f0)');
const DE_LA_ELEGIDA = degradado('linear-gradient(90deg, #7a80ee, #8fb0ff 45%, #c6f0f8)');
const COLOR_DE_PARTE = { duracion: '#b3d0fb', horario: '#7fa6f6', continuidad: '#5b7fe6' } as const;

// ------------------------------------------------------------ la calidad
/**
 * El anillo: una vuelta partida en lo que puede sumar cada parte, cada una llena hasta lo que sumó. Sin una parte,
 * las otras ocupan toda la vuelta: el mismo cálculo que el puntaje parcial.
 */
function partesDelAnillo(partes: Record<keyof typeof MAXIMOS, number | null>): ParteDelAnillo[] {
  const presentes = (['duracion', 'horario', 'continuidad'] as const).filter((p) => partes[p] != null);
  const total = presentes.reduce((s, p) => s + MAXIMOS[p], 0);
  const separa = 3.4 / (2 * Math.PI * 44);
  let va = 0;
  return presentes.map((p) => {
    const largo = MAXIMOS[p] / total;
    const x = { color: COLOR_DE_PARTE[p], desde: va, largo: largo - separa, lleno: (partes[p] as number) / MAXIMOS[p] };
    va += largo;
    return x;
  });
}

export function LaCalidad({ n, necesidad, anteriores, conNoches, cara, animar }: {
  n: Noche; necesidad: number; anteriores: (Noche | null)[]; conNoches: boolean; cara: Cara | null; animar: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const q = calidadDeNoche(n, necesidad, anteriores);
  const derecha = !conNoches ? <ChipDeEjemplo />
    : q ? <ChipDeSueno texto={t(`sueno.palabras.${q.palabra}`) + (q.parcial ? ` · ${t('sueno.parcial')}` : '')} tipo={q.puntos >= 70 ? 'buena' : 'floja'} /> : undefined;
  if (!q) {
    return (
      <CartaDeSueno titulo={t('sueno.calidad')} derecha={derecha}>
        <View style={st.calidadFila}>
          <Anillo tam={108} partes={null} animar={false} />
          <View style={st.calidadLado}><Texto>{t(n.moss ? 'sueno.sinCalidadEstimada' : 'sueno.sinCalidad')}</Texto></View>
        </View>
      </CartaDeSueno>
    );
  }
  // Lo que todavía no entra dice cuánto falta, con sus puntos.
  const previas = conNoches ? anteriores.filter((x) => x && x.confianza.horario !== 'baja').length : 0;
  return (
    <CartaDeSueno titulo={t('sueno.calidad')} derecha={derecha}>
      <View style={[st.calidadFila, !conNoches && st.muestra]}>
        <View>
          <Anillo tam={108} partes={partesDelAnillo(q.partes)} animar={animar} />
          <View style={st.anilloCentro} pointerEvents="none"><Text style={st.anilloNumero}>{q.puntos}</Text></View>
        </View>
        <View style={st.calidadLado}>
          {(['duracion', 'horario', 'continuidad'] as const).map((parte) => {
            const puntos = q.partes[parte];
            const max = MAXIMOS[parte];
            const faltaHorario = parte === 'horario' && puntos === null;
            const falta = parte === 'continuidad' && n.moss ? t('sueno.sinRelojParte')
              : faltaHorario ? plural('sueno.vacio.progreso', MINIMOS.horarioDeLaCalidad, { a: previas }) : t('sueno.todaviaNo');
            return (
              <View key={parte} style={st.parte}>
                <View style={st.parteFila}>
                  <Text style={st.parteNombre}>{t(`sueno.partes.${parte}`)}</Text>
                  <Text style={st.partePuntos}>{puntos === null ? falta : `${puntos} / ${max}`}</Text>
                </View>
                {faltaHorario ? <Puntos hay={previas} minimo={MINIMOS.horarioDeLaCalidad} /> : (
                  <View style={st.partePista}>{puntos !== null && <Relleno fraccion={puntos / max} style={[st.parteLlena, { backgroundColor: COLOR_DE_PARTE[parte] }]} />}</View>
                )}
              </View>
            );
          })}
        </View>
      </View>
      {!conNoches ? <Progreso hay={0} minimo={1} texto={t('sueno.vacio.calidad')} /> : (
        <>
          {/* Lo que dijiste a la mañana va aparte: no cambia el puntaje de la noche. */}
          {cara && <View style={st.datos}><Dato nombre={t('sueno.manana.tuRespuesta')} valor={lista('sueno.manana.caras')[cara - 1]} /></View>}
          <ComoSeCalcula abierto={abierto} alTocar={() => setAbierto((a) => !a)}>
            {lista('sueno.comoCalidad').map((p) => <Texto key={p}>{p.replace('{necesidad}', duracion(necesidad))}</Texto>)}
            <Texto>{t('sueno.manana.nota')}</Texto>
          </ComoSeCalcula>
        </>
      )}
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ el horario
export function ElHorario({ noches, fin, elegida, conNoches, primera, animar }: {
  /** Las dos semanas que terminan en `fin`. */
  noches: (Noche | null)[]; fin: ClaveDia; elegida: ClaveDia; conNoches: boolean; primera: ClaveDia | null; animar: boolean;
}) {
  const [tocada, setTocada] = useState<ClaveDia | null>(null);
  const [abierto, setAbierto] = useState(false);
  const h = horarioDe(noches);
  const medidas = noches.filter((n): n is Noche => n !== null);
  const seguras = medidas.filter((n) => n.confianza.horario !== 'baja').length;
  // De hora en punto a hora en punto; sin ninguna noche, de 22 a 8.
  const desde = medidas.length ? Math.floor((Math.min(...medidas.map((n) => n.dormirse)) - 15) / 60) * 60 : 4 * 60;
  const hasta = medidas.length ? Math.ceil((Math.max(...medidas.map((n) => n.despertar)) + 15) / 60) * 60 : 14 * 60;
  const X = (m: number) => ((m - desde) / (hasta - desde)) * 100;
  const guias: number[] = [];
  for (let m = Math.ceil(desde / 120) * 120; m <= hasta; m += 120) guias.push(m);
  const claveDe = (i: number) => sumarDias(fin, i - DIAS + 1);
  const textoDe = (n: Noche | null, c: ClaveDia) => (n ? `${diaCorto(c)} · ${reloj(n.dormirse)} → ${reloj(n.despertar)} · ${duracion(Math.round(n.dormido))}` : `${diaCorto(c)} · ${t('sueno.graficos.sinDatos')}`);
  const leida = tocada && noches[DIAS - 1 - Math.round((Date.parse(fin) - Date.parse(tocada)) / 864e5)] !== undefined ? tocada : fin;
  const bien = h && (h.regularidad === 'muyRegular' || h.regularidad === 'regular');
  return (
    <CartaDeSueno tipo="abierta" titulo={t('sueno.horario')} derecha={!conNoches ? <ChipDeEjemplo /> : h ? <ChipDeSueno texto={t(`sueno.regularidad.${h.regularidad}`)} tipo={bien ? 'enCamino' : 'despacio'} /> : undefined}>
      <View style={[st.rangos, !conNoches && st.muestra]}>
        <View style={st.guias} pointerEvents="none">
          {/* Lo de siempre: la banda de tu hora ± cuánto se corre. Más angosta, más regular. */}
          {h && ([[h.dormirse, h.desvioDormirse], [h.despertar, h.desvioDespertar]] as const).map(([hora, desvio]) => (
            <View key={hora} style={[st.banda, { left: `${X(hora - desvio)}%`, width: `${X(hora + desvio) - X(hora - desvio)}%` }]} />
          ))}
          {guias.map((m) => <View key={m} style={[st.guia, { left: `${X(m)}%` }]} />)}
        </View>
        {noches.map((n, i) => {
          const c = claveDe(i);
          const antes = !n && conNoches && (primera === null || c < primera);
          const esta = c === elegida && conNoches;
          const mirada = c === tocada;
          return (
            <Pressable key={c} onPress={() => setTocada(c)} style={st.rango} accessibilityRole="button" accessibilityLabel={textoDe(n, c)}>
              <Text style={[st.rangoLetra, (esta || mirada) && st.rangoLetraElegida]} maxFontSizeMultiplier={1.2}>{letraDe(c)}</Text>
              <View style={[st.rangoPista, !n && !antes && st.rangoVacio]}>
                {n && (
                  <Crece animar={animar} i={i} desde="izquierda" style={[st.rangoBarra, { left: `${X(n.dormirse)}%`, width: `${X(n.despertar) - X(n.dormirse)}%` }, esta || mirada ? DE_LA_ELEGIDA : DE_LA_NOCHE, esta && st.rangoElegido, mirada && st.rangoMirado]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={st.ejeHoras}>
        {guias.map((m) => (
          <View key={m} style={[st.enX, { left: `${X(m)}%` }]}>
            <Text style={[st.ejeHora, X(m) < 4 && st.pegadaIzq, X(m) > 96 && st.pegadaDer]}>{reloj(m)}</Text>
          </View>
        ))}
      </View>
      {h && (
        <View style={st.leyenda}>
          <View style={st.leyendaBanda} />
          <Text style={st.leyendaTexto}>{t('sueno.graficos.deSiempre')}</Text>
        </View>
      )}
      {medidas.length > 0 && (
        <Aparece key={leida}>
          <Text style={st.lectura}>{textoDe(noches[DIAS - 1 - Math.round((Date.parse(fin) - Date.parse(leida)) / 864e5)] ?? null, leida)}</Text>
        </Aparece>
      )}
      {!conNoches ? (
        <Progreso hay={0} minimo={MINIMOS.regularidad} texto={t('sueno.vacio.horario', { minimo: MINIMOS.regularidad })} />
      ) : !h ? (
        <Progreso hay={seguras} minimo={MINIMOS.regularidad} texto={t('sueno.vacio.horario', { minimo: MINIMOS.regularidad }) + (medidas.length > seguras ? ` ${t('sueno.pocoSegurasNoCuentan')}` : '')} />
      ) : (
        <>
          <View style={st.dos}>
            {([['sueno.dormirte', h.dormirse, h.desvioDormirse], ['sueno.despertarte', h.despertar, h.desvioDespertar]] as const).map(([clave, hora, desvio]) => (
              <View key={clave} style={st.dosCaja}>
                <Text style={st.dosNombre}>{t(clave)}</Text>
                <Text style={st.dosHora}>{reloj(hora)}</Text>
                <Text style={st.dosDesvio}>{t('sueno.graficos.desvio', { n: Math.round(desvio) })}</Text>
              </View>
            ))}
          </View>
          {h.finDeSemana !== null && Math.abs(h.finDeSemana) >= 30 && (
            <View style={st.datos}>
              <Dato nombre={t('sueno.finDeSemana')} valor={t(h.finDeSemana > 0 ? 'sueno.masTarde' : 'sueno.masTemprano', { t: duracion(Math.abs(Math.round(h.finDeSemana))) })} />
            </View>
          )}
          <ComoSeCalcula abierto={abierto} alTocar={() => setAbierto((a) => !a)}>
            <Texto>{t('sueno.regularidadTexto', { n: h.noches })}</Texto>
            {h.aprox && <Texto>{t('sueno.regularidadAprox')}</Texto>}
          </ComoSeCalcula>
        </>
      )}
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ lo que mide el reloj de noche
const VITALES: { tipo: TipoDeVital; decimales: number; icono: 'heart' | 'waveform.path.ecg' | 'lungs'; rangoMinimo: number }[] = [
  { tipo: 'frecuencia', decimales: 0, icono: 'heart', rangoMinimo: 12 },
  { tipo: 'variabilidad', decimales: 0, icono: 'waveform.path.ecg', rangoMinimo: 30 },
  { tipo: 'respiracion', decimales: 1, icono: 'lungs', rangoMinimo: 3 },
];
const ALTO_DE_FILA = 50;
const ANCHO_DE_CHISPA = 62;

export function LoDelReloj({ n, s, conNoches }: { n: Noche; s: Sueno; conNoches: boolean }) {
  const noches = s.noches;
  const ultimas = (hasta: ClaveDia) => {
    const porClave = new Map(noches.map((x) => [x.clave, x]));
    return Array.from({ length: DIAS }, (_, i) => porClave.get(sumarDias(hasta, i - DIAS + 1)) ?? null);
  };
  const antes = ultimas(sumarDias(n.clave, -1));
  const dos = ultimas(n.clave);
  const filas = VITALES.map(({ tipo, decimales, icono, rangoMinimo }) => {
    const lecturas = s.lecturas[tipo];
    const previos = antes.flatMap((x) => {
      const v = x ? vitalDeNoche(tipo, lecturas, x, []) : null;
      return v ? [v.valor] : [];
    });
    const v = vitalDeNoche(tipo, lecturas, n, previos);
    const serie = dos.map((x) => (x ? vitalDeNoche(tipo, lecturas, x, [])?.valor ?? null : null));
    return {
      previos: previos.length, clave: tipo, icono, nombre: t(`sueno.vital.${tipo}`),
      comparado: v ? (v.comparado ? t(`sueno.comparado.${v.comparado}`) : t('sueno.aprendiendo')) : t('sueno.pocasLecturas'),
      usual: v?.comparado === 'usual',
      valor: v ? `${numero(v.valor, decimales)} ${t(`sueno.unidad.${tipo}`)}` : '—',
      chispa: { valores: serie, usual: v?.usual ?? null, rangoMinimo },
    };
  });
  // La frecuencia en reposo es del día entero: va aparte y lo dice.
  const reposo = s.lecturas.reposo.get(n.clave);
  if (reposo !== undefined) {
    filas.push({
      previos: 0, clave: 'reposo' as TipoDeVital, icono: 'heart', nombre: t('sueno.vital.reposo'), comparado: t('sueno.delDia'), usual: false,
      valor: `${reposo} ${t('sueno.unidad.frecuencia')}`,
      chispa: { valores: dos.map((x, i) => (x ? s.lecturas.reposo.get(sumarDias(n.clave, i - DIAS + 1)) ?? null : null)), usual: null, rangoMinimo: 12 },
    });
  }
  const tuyas = Math.max(0, ...filas.map((f) => f.previos));
  return (
    <CartaDeSueno tipo="abierta" titulo={t('sueno.vitales')} derecha={conNoches ? undefined : <ChipDeEjemplo />}>
      <View style={!conNoches && st.muestra}>
        {filas.map((f) => (
          <View key={f.clave} style={st.vital}>
            <View style={st.vitalIcono}><Icono nombre={f.icono} tam={16} color="#bcd2fa" /></View>
            <View style={st.vitalTextos}>
              <Text style={st.vitalNombre} numberOfLines={1}>{f.nombre}</Text>
              <Text style={[st.vitalComparado, f.usual && st.vitalUsual]} numberOfLines={1}>{f.comparado}</Text>
            </View>
            <View style={{ width: ANCHO_DE_CHISPA }} />
            <Text style={st.vitalValor} numberOfLines={1}>{f.valor}</Text>
          </View>
        ))}
        {/* Las líneas de todas las filas en un solo lienzo, en su columna. */}
        <View style={st.chispas} pointerEvents="none">
          <Chispas ancho={ANCHO_DE_CHISPA} altoDeFila={ALTO_DE_FILA} filas={filas.map((f) => f.chispa)} />
        </View>
      </View>
      {!conNoches ? <Progreso hay={0} minimo={MINIMOS.loTuyo} texto={t('sueno.vacio.vitales', { minimo: MINIMOS.loTuyo })} /> : (
        <>
          {/* Hasta tener lo tuyo, cuántas noches faltan para comparar. */}
          {tuyas < MINIMOS.loTuyo && <Progreso hay={tuyas} minimo={MINIMOS.loTuyo} texto={t('sueno.vacio.loTuyo', { minimo: MINIMOS.loTuyo })} />}
          <Nota>{t('sueno.vitalesTexto')}</Nota>
        </>
      )}
    </CartaDeSueno>
  );
}

/** Sin reloj: lo que aparecería acá con uno, sin insistir. */
export function VitalesSinReloj() {
  return (
    <CartaDeSueno tipo="abierta" titulo={t('sueno.vitales')}>
      <Texto>{t('sueno.vacio.vitalesSinReloj')}</Texto>
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ de dónde sale cada dato
const PuntosDeCinco = ({ nivel }: { nivel: number }) => (
  <View style={st.cinco}>{[1, 2, 3, 4, 5].map((i) => <View key={i} style={[st.cincoPunto, i <= nivel && st.cincoLleno]} />)}</View>
);

export function LasFuentes({ n, s, clave, conNoches }: { n: Noche | null; s: Sueno; clave: ClaveDia; conNoches: boolean }) {
  if (!conNoches) {
    return (
      <CartaDeSueno tipo="abierta" titulo={t('sueno.fuentes')}>
        <Texto>{t('sueno.vacio.precision')}</Texto>
        {([[1, 'iphone'], [3, 'applewatch'], [4, 'applewatch']] as const).map(([nivel, icono]) => (
          <View key={nivel} style={st.fuenteFila}>
            <View style={st.fuente}>
              <Icono nombre={icono} tam={12} color={SN.texto} />
              <Text style={[st.fuenteNombre, { flex: 1 }]}>{lista('sueno.precision.niveles')[nivel]}</Text>
            </View>
            <PuntosDeCinco nivel={nivel} />
          </View>
        ))}
        <Nota>{t('sueno.vacio.fuentes')}</Nota>
      </CartaDeSueno>
    );
  }
  const relojDeSalud = s.fuentes.find((f) => f.tipo === 'reloj') ?? null;
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
        ['corazon', relojDeSalud, relojDeSalud ? 'media' : null],
        ['variabilidad', relojDeSalud, relojDeSalud ? 'baja' : null],
      ];
  return (
    <CartaDeSueno tipo="abierta" titulo={t('sueno.fuentes')}>
      {/* Los cinco puntos no se leen: VoiceOver dice el título con cuántos están llenos. */}
      <View style={st.precision} accessible accessibilityLabel={t('sueno.precision.titulo')} accessibilityValue={{ text: t('sueno.precision.deCinco', { n: nivel }) }}>
        <Text style={st.precisionTitulo}>{t('sueno.precision.titulo')}</Text>
        <PuntosDeCinco nivel={nivel} />
        <Text style={st.precisionNivel}>{lista('sueno.precision.niveles')[nivel]}</Text>
      </View>
      {filas.map(([que, fuente, nivelDe]) => (
        <View key={que} style={st.fuenteFila}>
          <Text style={st.fuenteQue}>{t(`sueno.datos.${que as 'duracion'}`)}</Text>
          <View style={st.fuente}>
            {fuente && <Icono nombre={fuente.tipo === 'telefono' || fuente.tipo === 'moss' ? 'iphone' : 'applewatch'} tam={12} color={SN.texto} />}
            <Text style={st.fuenteNombre}>{fuente ? fuente.nombre : '—'}</Text>
          </View>
          {nivelDe ? <ConConfianza nivel={nivelDe} /> : <View style={{ width: 8 }} />}
        </View>
      ))}
      <Nota>{t(n?.moss ? 'sueno.fuentesSinReloj' : 'sueno.fuentesTexto')}</Nota>
    </CartaDeSueno>
  );
}

const st = StyleSheet.create({
  muestra: { opacity: 0.84 },
  datos: { marginTop: 6 },
  calidadFila: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  calidadLado: { flex: 1, minWidth: 0, gap: 7 },
  anilloCentro: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  anilloNumero: { fontFamily: letras.numero, fontSize: 31, color: colores.cifra, fontVariant: ['tabular-nums'] },
  parte: { gap: 4 },
  parteFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 },
  parteNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12.5, color: colores.pergamino },
  partePuntos: { fontFamily: letras.numero, fontSize: 12, color: SN.texto, fontVariant: ['tabular-nums'] },
  partePista: { height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(150, 178, 240, 0.16)' },
  parteLlena: { height: 3, borderRadius: 2 },
  rangos: { marginTop: 8, gap: 3 },
  guias: { position: 'absolute', left: 22, right: 0, top: 0, bottom: 0 },
  guia: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(150, 178, 240, 0.13)' },
  banda: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, backgroundColor: 'rgba(168, 200, 250, 0.13)' },
  rango: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangoLetra: { width: 14, fontFamily: letras.texto, fontSize: 10, color: SN.tenue },
  rangoLetraElegida: { color: colores.pergamino },
  rangoPista: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(150, 178, 240, 0.05)' },
  rangoVacio: { borderWidth: 1, borderStyle: 'dotted', borderColor: 'rgba(196, 212, 246, 0.3)', backgroundColor: 'transparent' },
  rangoBarra: { position: 'absolute', top: 0, bottom: 0, borderRadius: 5, backgroundColor: '#6b8ff0', opacity: 0.86 },
  rangoElegido: { opacity: 1 },
  rangoMirado: { opacity: 1 },
  ejeHoras: { height: 13, marginTop: 5, marginLeft: 22 },
  enX: { position: 'absolute', top: 0, width: 0, alignItems: 'center' },
  ejeHora: { width: 40, textAlign: 'center', fontFamily: letras.numero, fontSize: 10, lineHeight: 13, color: SN.tenue, fontVariant: ['tabular-nums'] },
  pegadaIzq: { transform: [{ translateX: 20 }] },
  pegadaDer: { transform: [{ translateX: -20 }] },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  leyendaBanda: { width: 10, height: 10, borderRadius: 3, backgroundColor: 'rgba(168, 200, 250, 0.3)' },
  leyendaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: SN.texto },
  lectura: { minHeight: 18, marginTop: 8, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  dos: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dosCaja: { flex: 1, gap: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(150, 178, 240, 0.09)' },
  dosNombre: { fontFamily: letras.texto, fontSize: 11.5, color: SN.texto },
  dosHora: { fontFamily: letras.numero, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  dosDesvio: { fontFamily: letras.numero, fontSize: 11.5, color: SN.tenue, fontVariant: ['tabular-nums'] },
  vital: { height: ALTO_DE_FILA, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: SN.linea },
  vitalIcono: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(120, 160, 240, 0.18)' },
  vitalTextos: { flex: 1, minWidth: 0, gap: 3 },
  vitalNombre: { fontFamily: letras.texto, fontSize: 13, color: colores.pergamino },
  vitalComparado: { fontFamily: letras.texto, fontSize: 11.5, color: SN.tenue },
  vitalUsual: { color: '#b9d6fb' },
  vitalValor: { width: 78, textAlign: 'right', fontFamily: letras.numero, fontSize: 14.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  chispas: { position: 'absolute', top: 0, right: 78 + 8 },
  cinco: { flexDirection: 'row', gap: 5 },
  cincoPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(150, 178, 240, 0.2)' },
  cincoLleno: { backgroundColor: '#a8c8fa' },
  precision: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6, marginBottom: 4 },
  precisionTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  precisionNivel: { width: '100%', fontFamily: letras.texto, fontSize: 12.5, color: SN.texto },
  fuenteFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderTopWidth: 1, borderColor: SN.linea },
  fuenteQue: { flex: 1, fontFamily: letras.texto, fontSize: 13, color: colores.pergamino },
  fuente: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  fuenteNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12, color: SN.texto },
});
