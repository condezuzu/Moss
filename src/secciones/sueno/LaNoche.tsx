// La noche, la de la galería (galeria/src/sueno.js: laNoche, laNocheDeMoss, sinNoche e invitacion): en un arco,
// del anochecer a la mañana, con cada etapa en su carril y las horas alrededor; tocar el arco lee esa etapa en
// el centro. Sin etapas, un solo trazo; sin reloj, con los bordes esfumados del ancho de la duda; sin noche,
// punteado. Sin ninguna noche todavía, la invitación: un ejemplo marcado como ejemplo y las dos formas de empezar.

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { actualizarSalud } from '@/almacen';
import { lista, plural, t } from '@/textos';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { margenParaDormirte } from '@/dominio/sinReloj';
import { pareceIncompleta, type Fuente, type Noche, type NochePropia } from '@/dominio/sueno';
import { pedirPermisos } from '@/salud/salud';
import { colores, letras } from '@/tema';
import { pedirMovimiento, permisoDeMovimiento } from '../../../modules/movimiento';
import { Icono } from '../comida/comunes';
import { duracion, numero, useEstado } from '../comida/datos';
import { Aparece, e as tarjeta } from '../tarjetas';
import { ARCO, escalaDelArco, horasDelArco, tramoEn, type Rango } from './arco';
import { CartaDeSueno, ChipDeEjemplo, ConConfianza, Dato, DeOrigen, Nota, reloj, SN, Texto } from './comunes';
import { Arco } from './Dibujos';
import { EditorDeHora, ponerHora } from './Manana';


export function tituloDe(clave: ClaveDia, hoy: ClaveDia) {
  if (clave === hoy) return t('sueno.anoche');
  const dias = lista('fecha.dias');
  const dia = (c: ClaveDia) => dias[new Date(`${c}T12:00:00`).getDay()];
  return t('sueno.nocheDel', { desde: dia(sumarDias(clave, -1)), hasta: dia(clave) });
}

/**
 * El arco con lo de encima: las horas alrededor y, en el medio, cuánto dormiste (o la etapa que se está leyendo).
 * `lista`: las noches que dan la escala. `ancho` es el de adentro de la tarjeta.
 */
export function ArcoDeLaNoche({ n, lista: noches, rango, centro, ancho, animar }: {
  n: Noche | null; lista: readonly (Noche | null)[]; rango?: Rango | null; centro: [string, string?]; ancho: number; animar: boolean;
}) {
  const [leido, setLeido] = useState(-1);
  const s = ancho / ARCO.ancho;
  const escala = n ? escalaDelArco(n, noches, rango) : null;
  const t0 = n && leido >= 0 ? n.tramos[leido] : null;
  const grande = t0 ? (t0.etapa === 'dormido' ? t('sueno.dormido') : t(`sueno.etapas.${t0.etapa}`)) : centro[0];
  const chico = t0 ? `${reloj(t0.desde)} – ${reloj(t0.hasta)} · ${duracion(Math.max(1, Math.round(t0.hasta - t0.desde)))}` : centro[1];
  // Se busca por la hora, no por el trazo: una etapa de cinco minutos es muy chica para acertarle. Tocar lo mismo o afuera vuelve a la noche.
  const tocar = (ev: GestureResponderEvent) => {
    if (!n || !escala) return;
    const i = tramoEn(ev.nativeEvent.locationX / s, ev.nativeEvent.locationY / s, escala, n);
    const nuevo = i === leido ? -1 : i;
    if (nuevo !== leido) Haptics.selectionAsync().catch(() => {});
    setLeido(nuevo);
  };
  return (
    <Pressable
      onPress={n?.conEtapas ? tocar : undefined}
      disabled={!n?.conEtapas}
      style={{ width: ancho, height: ARCO.alto * s, marginTop: 2 }}
      accessibilityRole="image"
      accessibilityLabel={n ? t('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) }) : centro[0]}
    >
      <Arco ancho={ancho} noche={n} escala={escala} rango={rango} leido={leido} animar={animar} />
      {escala && horasDelArco(escala).filter((h) => h.texto).map((h) => (
        <View key={h.a} style={[st.enX, { left: h.x * s, top: h.y * s - 9 }]} pointerEvents="none">
          <Text style={st.hora} maxFontSizeMultiplier={1.2}>{h.texto}</Text>
        </View>
      ))}
      <View style={st.centro} pointerEvents="none">
        <Aparece key={grande + (chico ?? '')} style={st.centroDentro}>
          <Text style={[st.centroGrande, !n && st.centroChico]}>{grande}</Text>
          {chico ? <Text style={st.centroTexto}>{chico}</Text> : null}
        </Aparece>
      </View>
    </Pressable>
  );
}

/** Debajo del arco, a cada lado, a qué hora te dormiste y te despertaste. */
function HorasDelArco({ n }: { n: Noche }) {
  return (
    <View style={st.horas}>
      <View style={st.horaLado}>
        <Icono nombre="moon" tam={17} color="#c6d6fa" />
        <View>
          <Text style={st.horaValor}>{reloj(n.dormirse)}</Text>
          <Text style={st.horaTexto}>{t('sueno.manana.teDormiste')}</Text>
        </View>
      </View>
      <View style={[st.horaLado, st.horaFin]}>
        <View style={st.horaFinTextos}>
          <Text style={st.horaValor}>{reloj(n.despertar)}</Text>
          <Text style={st.horaTexto}>{t('sueno.manana.teDespertaste')}</Text>
        </View>
        <Icono nombre="sunrise" tam={18} color="#f3dfb0" />
      </View>
    </View>
  );
}

const COLOR = { rem: SN.rem, nucleo: SN.nucleo, profundo: SN.profundo } as const;

// ------------------------------------------------------------ la noche
export function LaNoche({ n, hoy, ancho, anteriores, lista: noches, animar }: { n: Noche; hoy: ClaveDia; ancho: number; anteriores: (Noche | null)[]; lista: (Noche | null)[]; animar: boolean }) {
  const partes = (['rem', 'nucleo', 'profundo'] as const).map((x) => [x, n.etapas[x]] as const);
  return (
    <CartaDeSueno tipo="heroe" titulo={tituloDe(n.clave, hoy)} derecha={<ConConfianza nivel={n.confianza.duracion} />}>
      <ArcoDeLaNoche n={n} lista={noches} centro={[duracion(Math.round(n.dormido)), t('sueno.dormido')]} ancho={ancho} animar={animar} />
      <HorasDelArco n={n} />
      {pareceIncompleta(n, anteriores) && <Text style={tarjeta.recuadro}>{t('sueno.incompleta')}</Text>}
      {n.conEtapas && (
        <>
          {/* Las etapas, como estimación: cuánto de cada una, en la barra y con su nombre. */}
          <View style={st.proporcion}>
            {partes.map(([x, min], i) => <View key={x} style={[st.proporcionParte, { flex: Math.max(1, min), backgroundColor: COLOR[x] }, i === 0 && st.izq, i === partes.length - 1 && st.der]} />)}
          </View>
          <View style={st.etapas}>
            {partes.map(([x, min]) => (
              <View key={x} style={st.etapa}>
                <View style={st.etapaNombre}>
                  <View style={[st.etapaPunto, { backgroundColor: COLOR[x] }]} />
                  <Text style={st.etapaTexto}>{t(`sueno.etapas.${x}`)}</Text>
                </View>
                <Text style={st.etapaValor}>{duracion(Math.round(min))}</Text>
                <Text style={st.etapaPorcentaje}>{t('comida.porcentaje', { n: numero(Math.round((min / Math.max(1, n.dormido)) * 100)) })}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <Nota>{n.conEtapas ? t('sueno.etapasEstimadas') : t('sueno.sinEtapas')}</Nota>
      <View style={st.datos}>
        <Dato
          nombre={t('sueno.despierto')}
          antes={<View style={st.claveDespierto} />}
          valor={`${duracion(Math.round(n.despierto))} · ${plural('sueno.despertares', n.despertares, { n: n.despertares })}`}
          nivel={n.confianza.despertares}
        />
        {n.enCama && <Dato nombre={t('sueno.enCama')} valor={`${duracion(n.enCama.minutos)} · ${n.enCama.fuente.nombre}`} nivel={n.confianza.enCama} />}
        {n.siestas > 0 && <Dato nombre={t('sueno.siesta')} valor={duracion(n.siestas)} nivel="alta" />}
      </View>
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ la noche sin reloj
/**
 * Cuánto y cuándo, de dónde sale la hora y, si es estimada, el rango con los bordes esfumados. Con `aparato`, el reloj
 * o el anillo cuya noche todavía no llegó (aparatoQueFalta): lo dice, en vez de cómo se mide sin reloj.
 */
export function LaNocheDeMoss({ n, hoy, propia, ancho, lista: noches, animar, aparato }: {
  n: Noche; hoy: ClaveDia; propia: NochePropia | undefined; ancho: number; lista: (Noche | null)[]; animar: boolean; aparato: Fuente | null;
}) {
  const [editando, setEditando] = useState(false);
  // Cómo se mide: todo el rato que el teléfono estuvo quieto, menos tu margen para dormirte.
  const margen = margenParaDormirte(useEstado().latencia);
  const m = n.moss!;
  const r = m.rango;
  return (
    <CartaDeSueno tipo="heroe" titulo={tituloDe(n.clave, hoy)} derecha={<DeOrigen origen={m.origen} />}>
      <ArcoDeLaNoche n={n} lista={noches} rango={r} centro={[duracion(Math.round(n.dormido)), t('sueno.dormidoAprox')]} ancho={ancho} animar={animar} />
      <HorasDelArco n={n} />
      {aparato && <Text style={tarjeta.recuadro}>{t('sueno.esperaAparato.estimada', { aparato: aparato.nombre })}</Text>}
      {r && <Texto>{`${t('sueno.rango', { a: reloj(r.dormirse[0]), b: reloj(r.dormirse[1]), c: reloj(r.despertar[0]), d: reloj(r.despertar[1]) })} ${t(`sueno.seguridad.${m.confianza}`)}.`}</Texto>}
      {m.origen === 'estimada' && !aparato && <Nota>{t('sueno.estimadaTexto', { margen })}</Nota>}
      {n.despierto > 0 && <Nota>{t('sueno.sinRelojDespierto', { n: Math.round(n.despierto) })}</Nota>}
      {!aparato && <Nota>{t('sueno.sinRelojEtapas')}</Nota>}
      {editando ? (
        <Aparece style={st.editorNoche}>
          <EditorDeHora
            desde={n.dormirse}
            hasta={n.despertar}
            alGuardar={(d, h, cambiadas) => {
              if (cambiadas || m.origen === 'estimada') ponerHora(n.clave, d, h, cambiadas ? 'corregida' : 'confirmada', propia);
              setEditando(false);
            }}
            // A diferencia de «Guardar» sin mover nada, no confirma la estimación: queda todo como estaba.
            alCancelar={() => setEditando(false)}
          />
        </Aparece>
      ) : (
        <Aparece>
          <Pressable onPress={() => setEditando(true)} style={({ pressed }) => [tarjeta.enlace, pressed && st.apretado]} hitSlop={{ top: 8, bottom: 14, left: 10, right: 10 }} accessibilityRole="button">
            <Text style={tarjeta.enlaceTexto}>{t('sueno.cambiarHora')}</Text>
          </Pressable>
        </Aparece>
      )}
    </CartaDeSueno>
  );
}

/** Sin noche. Con `aparato`, el reloj o el anillo cuya noche todavía puede llegar, y el teléfono no alcanzó para estimarla. */
export function SinNoche({ clave, hoy, cama, ancho, aparato }: { clave: ClaveDia; hoy: ClaveDia; cama?: { minutos: number; fuente: Fuente }; ancho: number; aparato: Fuente | null }) {
  return (
    <CartaDeSueno tipo="heroe" titulo={tituloDe(clave, hoy)}>
      <ArcoDeLaNoche n={null} lista={[]} centro={[t('sueno.sinDatos')]} ancho={ancho} animar={false} />
      <Texto>{aparato && !cama ? t('sueno.esperaAparato.sinEstimar', { aparato: aparato.nombre }) : t(cama ? 'sueno.sinRelojTexto' : 'sueno.sinNadaTexto')}</Texto>
      {cama && (
        <View style={st.datos}>
          <Dato nombre={t('sueno.enCama')} valor={`${duracion(cama.minutos)} · ${cama.fuente.nombre}`} nivel="baja" />
        </View>
      )}
      <Nota>{t('sueno.habitosPendientes')}</Nota>
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ sin noches: la invitación
/**
 * Un ejemplo de lo que vas a ver, marcado como ejemplo, y las dos formas de que aparezca: con un reloj o un anillo,
 * conectar Salud; solo con el iPhone, el movimiento del teléfono, y mañana Moss estima la noche y pregunta.
 */
export function Invitacion({ muestra, ancho }: { muestra: (Noche | null)[]; ancho: number }) {
  const reducido = useReducedMotion();
  const ej = [...muestra].reverse().find((x): x is Noche => !!x) ?? null;
  const [conIphone, setConIphone] = useState(false);
  return (
    <CartaDeSueno tipo="heroe" titulo={t('sueno.vacio.arriba')} derecha={<ChipDeEjemplo />}>
      {ej && <ArcoDeLaNoche n={ej} lista={muestra} centro={[duracion(Math.round(ej.dormido)), t('sueno.dormido')]} ancho={ancho} animar={!reducido} />}
      <Text style={st.invitaTitulo}>{t('sueno.vacio.titulo')}</Text>
      <Text style={st.invitaTexto}>{t('sueno.vacio.texto')}</Text>
      <View style={st.caminos}>
        <View style={st.camino}>
          <Icono nombre="applewatch" tam={21} color="#c6d6fa" />
          <Text style={st.caminoTitulo}>{t('sueno.vacio.conReloj.titulo')}</Text>
          <Text style={st.caminoTexto}>{t('sueno.vacio.conReloj.texto')}</Text>
          <Pressable
            onPress={async () => {
              if (await pedirPermisos()) actualizarSalud().catch(() => {});
            }}
            style={({ pressed }) => [st.permitir, pressed && st.permitirApretado]}
            accessibilityRole="button"
          >
            <Text style={st.permitirTexto} numberOfLines={1} adjustsFontSizeToFit>{t('sueno.vacio.conReloj.boton')}</Text>
          </Pressable>
        </View>
        <View style={st.camino}>
          <Icono nombre="iphone" tam={21} color="#c6d6fa" />
          <Text style={st.caminoTitulo}>{t('sueno.vacio.sinReloj.titulo')}</Text>
          <Text style={st.caminoTexto}>{t('sueno.vacio.sinReloj.texto')}</Text>
          {conIphone ? (
            <Aparece style={st.listo}>
              <Icono nombre="checkmark" tam={13} color={SN.verdeClaro} peso="semibold" />
              <Text style={st.listoTexto}>{t('sueno.vacio.sinReloj.listo')}</Text>
            </Aparece>
          ) : (
            <Aparece>
              <Pressable
                onPress={async () => {
                  if (permisoDeMovimiento() === 'sinPreguntar') await pedirMovimiento();
                  setConIphone(true);
                }}
                style={({ pressed }) => [st.otra, pressed && st.otraApretada]}
                accessibilityRole="button"
              >
                <Text style={st.otraTexto} numberOfLines={1} adjustsFontSizeToFit>{t('sueno.vacio.sinReloj.boton')}</Text>
              </Pressable>
            </Aparece>
          )}
        </View>
      </View>
    </CartaDeSueno>
  );
}

/** Sin reloj y sin permiso, una vez: el movimiento del teléfono mejora la estimación. Después, se va. */
export function ElMovimiento() {
  const [permiso, setPermiso] = useState(permisoDeMovimiento);
  if (permiso !== 'sinPreguntar') return null;
  return (
    <Aparece>
      <CartaDeSueno>
        <View style={st.movimiento}>
          <View style={st.movimientoTexto}>
            <Text style={st.movimientoTitulo}>{t('sueno.movimiento.titulo')}</Text>
            <Text style={st.caminoTexto}>{t('sueno.movimiento.texto')}</Text>
          </View>
          <Pressable
            onPress={async () => {
              setPermiso(await pedirMovimiento());
              // Con el movimiento, la noche de anoche se vuelve a estimar.
              actualizarSalud().catch(() => {});
            }}
            style={({ pressed }) => [st.permitir, st.permitirAncho, pressed && st.permitirApretado]}
            hitSlop={4}
            accessibilityRole="button"
          >
            <Text style={st.permitirTexto}>{t('sueno.movimiento.permitir')}</Text>
          </Pressable>
        </View>
      </CartaDeSueno>
    </Aparece>
  );
}

const st = StyleSheet.create({
  enX: { position: 'absolute', width: 0, alignItems: 'center' },
  hora: { width: 24, textAlign: 'center', fontFamily: letras.numero, fontSize: 9.5, lineHeight: 12, color: 'rgba(196, 212, 246, 0.72)', fontVariant: ['tabular-nums'] },
  centro: { position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' },
  centroDentro: { alignItems: 'center', gap: 4 },
  centroGrande: { fontFamily: letras.numero, fontSize: 33, letterSpacing: -0.5, color: colores.cifra, fontVariant: ['tabular-nums'] },
  centroChico: { fontSize: 24, color: 'rgba(239, 230, 207, 0.45)' },
  centroTexto: { fontFamily: letras.texto, fontSize: 13, color: SN.texto, fontVariant: ['tabular-nums'] },
  horas: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  horaLado: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  horaFin: { justifyContent: 'flex-end' },
  horaFinTextos: { alignItems: 'flex-end' },
  horaValor: { fontFamily: letras.numero, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  horaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: SN.tenue },
  proporcion: { flexDirection: 'row', gap: 2, height: 8, marginTop: 12 },
  proporcionParte: { minWidth: 3 },
  izq: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  der: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  etapas: { marginTop: 8, flexDirection: 'row', gap: 8 },
  etapa: { flex: 1, gap: 3, paddingTop: 2 },
  etapaNombre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etapaPunto: { width: 8, height: 8, borderRadius: 4 },
  etapaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: SN.texto },
  etapaValor: { fontFamily: letras.numero, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  etapaPorcentaje: { fontFamily: letras.texto, fontSize: 11, color: SN.tenue },
  datos: { marginTop: 6 },
  claveDespierto: { width: 8, height: 8, marginRight: 6, borderRadius: 4, backgroundColor: SN.despierto },
  editorNoche: { marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderColor: SN.linea },
  apretado: { opacity: 0.6 },
  invitaTitulo: { marginTop: 12, fontFamily: letras.numeroMedio, fontSize: 21, lineHeight: 25, color: colores.pergamino },
  invitaTexto: { marginTop: 2, marginBottom: 6, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: SN.texto },
  caminos: { flexDirection: 'row', gap: 8 },
  camino: { flex: 1, minWidth: 0, gap: 6, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: SN.linea, backgroundColor: 'rgba(150, 178, 240, 0.09)' },
  caminoTitulo: { fontFamily: letras.textoMedio, fontSize: 14, lineHeight: 17, color: colores.pergamino },
  caminoTexto: { flexGrow: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: SN.texto },
  permitir: { minHeight: 38, marginTop: 4, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  permitirAncho: { paddingHorizontal: 16, marginTop: 0 },
  permitirApretado: { backgroundColor: '#d9d0b8' },
  permitirTexto: { fontFamily: letras.textoMedio, fontSize: 13, color: '#0b0f1d' },
  otra: { minHeight: 38, marginTop: 4, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(214, 226, 250, 0.32)' },
  otraApretada: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  otraTexto: { fontFamily: letras.textoMedio, fontSize: 13, color: colores.pergamino },
  listo: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, marginTop: 4 },
  listoTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: SN.verdeClaro },
  movimiento: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  movimientoTexto: { flex: 1, gap: 2 },
  movimientoTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
});
