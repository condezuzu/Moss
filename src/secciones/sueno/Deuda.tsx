// La deuda de sueño (spec/sueno.md, «Las cuentas»; rehecha el 17/11/2026), arriba de todo y compacta: el número
// de una («4 h», «6 h 30»; «Sin deuda» en 0) con la palabra al lado en una pastilla y lo que duermes contra lo que
// necesitas, que se cambia ahí mismo. Solo con el teléfono, lo dice en una línea, que lleva a la guía para conectar
// un reloj o un anillo. «Más» despliega lo de cada noche, la última comida de esta noche y cómo se calcula. Con
// pocas noches, cuántas faltan. A qué hora acostarte va debajo, en tu periodo de melatonina (Periodo.tsx).

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { cercaDeLaCama } from '@/dominio/loQueFalta';
import { deudaDeSueno, faltaDeLaNoche, juicioDeLaDeuda, MINIMOS, necesidadesPara, necesidadPropuesta, redondearDeuda, type Noche } from '@/dominio/sueno';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { duracion } from '../comida/datos';
import { Aparatos } from '../perfil/Aparatos';
import { Aparece, ComoSeCalcula, Segmento } from '../tarjetas';
import { CartaDeSueno, ChipDeEjemplo, Crece, diaCorto, letraDe, Nota, Progreso, reloj, SN } from './comunes';

const DIAS = 14;

/** Las horas como se dicen en la tarjeta, cortas: «4 h», «6 h 30»; menos de una hora, «30 min». */
function enHoras(minutos: number): string {
  const total = Math.round(minutos);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return t('fecha.minutos', { m });
  return m ? t('sueno.deuda.horasYMinutos', { h, m: String(m).padStart(2, '0') }) : t('fecha.horas', { h });
}

/** Lo que sumó o pagó cada noche: lo que faltó baja de la línea de lo que necesitas y lo que sobró sube. Pesan más las recientes. */
function Barras({ lista, necesidad, fin, primera, animar }: { lista: (Noche | null)[]; necesidad: number; fin: ClaveDia; primera: ClaveDia | null; animar: boolean }) {
  const [elegida, setElegida] = useState(DIAS - 1);
  const cuenta = (n: Noche | null) => !!n && n.confianza.duracion !== 'baja';
  // Lo que entra en la deuda, con sus topes (faltaDeLaNoche): lo que sobra paga hasta una hora, y la barra se corta ahí.
  const difs = lista.map((n) => (n && cuenta(n) ? -faltaDeLaNoche(n, necesidad) : null));
  const arriba = Math.max(30, ...difs.filter((d): d is number => d != null && d > 0));
  const abajo = Math.max(30, ...difs.filter((d): d is number => d != null && d < 0).map((d) => -d));
  const ALTO = 88;
  const linea = Math.round(ALTO * Math.min(0.72, Math.max(0.22, arriba / (arriba + abajo))));
  const escala = Math.min(linea / arriba, (ALTO - linea) / abajo);
  const textoDe = (n: Noche | null, c: ClaveDia) => {
    const dia = diaCorto(c);
    if (!n) return `${dia} · ${t('sueno.graficos.sinDatos')}`;
    const total = Math.round(n.dormido + n.siestas);
    if (!cuenta(n)) return `${dia} · ${duracion(total)} · ${t('sueno.graficos.noCuenta')}`;
    const d = total - necesidad;
    const cola = Math.abs(d) < 5 ? t('sueno.graficos.justo') : t(d < 0 ? 'sueno.graficos.menos' : 'sueno.graficos.mas', { t: duracion(Math.abs(d)) });
    return `${dia} · ${duracion(total)} · ${cola}`;
  };
  const claveDe = (i: number) => sumarDias(fin, i - DIAS + 1);
  return (
    <View>
      <View style={st.leyenda}>
        <View style={st.leyendaClave}><View style={[st.leyendaMarca, { backgroundColor: SN.azul }]} /><Text style={st.leyendaTexto}>{t('sueno.graficos.deMenos')}</Text></View>
        <View style={st.leyendaClave}><View style={[st.leyendaMarca, { backgroundColor: SN.verde }]} /><Text style={st.leyendaTexto}>{t('sueno.graficos.deMas')}</Text></View>
        <View style={st.leyendaClave}><View style={st.leyendaLinea} /><Text style={st.leyendaTexto}>{t('sueno.graficos.necesitas', { t: duracion(necesidad) })}</Text></View>
      </View>
      <View style={st.dd}>
        <View style={[st.ddMeta, { top: linea }]} pointerEvents="none" />
        {lista.map((n, i) => {
          const c = claveDe(i);
          const d = difs[i];
          // Antes de la primera noche no falta nada: todavía no estabas.
          const antes = d == null && !n && primera !== null && c < primera;
          // Anoche pesa entera y hace dos semanas casi nada (deudaDeSueno): la opacidad lo muestra.
          const opacidad = elegida === i ? 1 : 0.75 + 0.25 * ((i + 1) / DIAS);
          return (
            <Pressable key={c} onPress={() => setElegida(i)} style={st.ddCol} accessibilityRole="button" accessibilityLabel={textoDe(n, c)} accessibilityState={{ selected: elegida === i }}>
              <View style={st.ddZona}>
                {d == null ? (
                  !antes && <View style={[st.ddNada, { top: linea - 3 }]} />
                ) : d > 0 ? (
                  <Crece animar={animar} i={i} desde="abajo" style={[st.ddBarra, st.ddSobra, { bottom: ALTO - linea, height: Math.max(2, d * escala), opacity: opacidad }]} />
                ) : (
                  <Crece animar={animar} i={i} desde="arriba" style={[st.ddBarra, st.ddFalta, { top: linea, height: Math.max(2, -d * escala), opacity: opacidad }]} />
                )}
              </View>
              <Text style={[st.ddLetra, elegida === i && st.ddLetraElegida]} maxFontSizeMultiplier={1.2}>{letraDe(c)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Aparece key={elegida}>
        <Text style={st.lectura}>{textoDe(lista[elegida], claveDe(elegida))}</Text>
      </Aparece>
    </View>
  );
}

/**
 * Esta noche, en «Más»: la última comida grande, 2 h antes de acostarte, o 3 con reflujo (cercaDeLaCama). A qué
 * hora acostarte ya no va acá (17/11/2026): es la tarjeta de tu periodo de melatonina, debajo (Periodo.tsx).
 */
function EstaNoche({ acostarse, reflujo }: { acostarse: number; reflujo: boolean }) {
  return (
    <Aparece demora={100} style={st.esta}>
      <Text style={st.h4}>{t('sueno.estaNoche.titulo')}</Text>
      <View style={st.estaFila}>
        <View style={st.estaIco}><Icono nombre="fork.knife" tam={15} color="#a8c8fa" /></View>
        <View style={st.estaTextos}>
          <Text style={st.estaTitulo}>{t('sueno.estaNoche.comida', { hora: reloj(acostarse - cercaDeLaCama(reflujo)) })}</Text>
          <Text style={st.estaTexto}>{t(reflujo ? 'sueno.estaNoche.comidaReflujo' : 'sueno.estaNoche.comidaTexto')}</Text>
        </View>
      </View>
    </Aparece>
  );
}

/**
 * Lo que necesitas dormir, a la vista y con un toque para cambiarlo: el mismo ajuste de «Necesito dormir» de
 * Perfil › Avisos. Debajo, si tu historial da otra (necesidadPropuesta), Moss la propone en una línea: se usa
 * con un toque o se deja pasar.
 */
function LaNecesidad({ duermes, necesidad, edad, propuesta }: { duermes: number | null; necesidad: number; edad: number | undefined; propuesta: ReturnType<typeof necesidadPropuesta> }) {
  const reducido = useReducedMotion();
  const [abierta, setAbierta] = useState(false);
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '180deg' : '0deg', { duration: reducido ? 0 : 240 }) }] }));
  const necesitas = t('sueno.deuda.necesitas', { necesidad: enHoras(necesidad) });
  return (
    <>
      <View style={st.linea}>
        {duermes !== null && <Text style={st.lineaTexto}>{`${t('sueno.deuda.duermes', { duermes: enHoras(Math.round(duermes / 10) * 10) })} · `}</Text>}
        {edad === undefined ? <Text style={st.lineaTexto}>{necesitas}</Text> : (
          <Pressable onPress={() => setAbierta((a) => !a)} style={({ pressed }) => [st.necesitas, pressed && st.apretado]} hitSlop={10} accessibilityRole="button" accessibilityState={{ expanded: abierta }} accessibilityHint={t('sueno.deuda.cambiar')}>
            <Text style={[st.lineaTexto, st.enlace]}>{necesitas}</Text>
            <Animated.View style={flecha}><Icono nombre="chevron.down" tam={10} peso="semibold" /></Animated.View>
          </Pressable>
        )}
      </View>
      {abierta && edad !== undefined && (
        <Aparece style={st.editor}>
          <Segmento opciones={necesidadesPara(edad).map((m) => [m, enHoras(m)] as const)} elegida={necesidad} alElegir={(m) => elAlmacen().ponerNecesidad(m)} />
          <Text style={st.chica}>{t(edad < 18 ? 'perfil.avisos.necesitoTextoMenor' : 'perfil.avisos.necesitoTexto')}</Text>
        </Aparece>
      )}
      {propuesta !== null && (
        <Aparece style={st.propuesta}>
          <Text style={st.chica}>{t('sueno.deuda.propuesta', { rondan: enHoras(propuesta) })}</Text>
          <Pressable onPress={() => elAlmacen().ponerNecesidad(propuesta)} style={({ pressed }) => pressed && st.apretado} hitSlop={10} accessibilityRole="button">
            <Text style={[st.chica, st.enlace]}>{t('sueno.deuda.usar', { usar: enHoras(propuesta) })}</Text>
          </Pressable>
        </Aparece>
      )}
    </>
  );
}

export function LaDeuda({ noches, hoy, clave, necesidad, edad, conNoches, muestra, acostarse, reflujo, animar }: {
  /** Las noches de verdad (sin las de ejemplo). */
  noches: Noche[];
  hoy: ClaveDia; clave: ClaveDia; necesidad: number;
  /** Para lo que se puede elegir en «Necesitas» y lo que Moss propone; sin cuestionario, no se cambia acá. */
  edad: number | undefined;
  conNoches: boolean;
  /** Sin noches, las de ejemplo de las dos semanas. */
  muestra: (Noche | null)[];
  /** A qué hora acostarte esta noche, la de tu periodo de melatonina (en minutos desde las 18); sin periodo, null. */
  acostarse: number | null;
  /** Con reflujo marcado en Cuidados, la última comida va tres horas antes. */
  reflujo: boolean;
  animar: boolean;
}) {
  const reducido = useReducedMotion();
  const [abierta, setAbierta] = useState(false);
  const [como, setComo] = useState(false);
  const [aparatos, setAparatos] = useState(false);
  const lista = conNoches ? ultimasDe(noches, clave) : muestra;
  const fin = conNoches ? clave : hoy;
  const d = deudaDeSueno(lista, necesidad);
  const seguras = lista.filter((n) => n && n.confianza.duracion !== 'baja').length;
  const hay = lista.filter(Boolean).length;
  // A la media hora: media hora de diferencia en lo que necesitas la cambia en más de 3 horas.
  const redondeada = d ? redondearDeuda(d.minutos) : 0;
  const juicio = d ? juicioDeLaDeuda(d) : null;
  const estaNoche = conNoches && clave === hoy ? acostarse : null;
  // Sin un reloj ni un anillo en las dos semanas, las noches las estimó Moss con el teléfono.
  const conTelefono = conNoches && lista.some((n) => n?.moss) && !lista.some((n) => n && !n.moss && !n.aMano && (n.fuente.tipo === 'reloj' || n.fuente.tipo === 'otra'));
  const propuesta = conNoches && edad !== undefined ? necesidadPropuesta(noches, hoy, edad, necesidad) : null;
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '180deg' : '0deg', { duration: reducido ? 0 : 300 }) }] }));
  const primera = noches.length ? noches.reduce((a, n) => (n.clave < a ? n.clave : a), noches[0].clave) : null;
  return (
    <CartaDeSueno titulo={t('sueno.deuda.titulo')} derecha={conNoches ? undefined : <ChipDeEjemplo />}>
      <View style={!conNoches && st.muestra}>
        {d && juicio ? (
          <View style={st.cifraFila} accessible accessibilityLabel={juicio === 'sinDeuda' ? t('sueno.deuda.juicio.sinDeuda') : `${enHoras(redondeada)}, ${t(`sueno.deuda.juicio.${juicio}`)}`}>
            <Text style={st.cifra}>{juicio === 'sinDeuda' ? t('sueno.deuda.juicio.sinDeuda') : enHoras(redondeada)}</Text>
            {juicio !== 'sinDeuda' && <Text style={[st.pastilla, st[`pastilla_${juicio}`]]}>{t(`sueno.deuda.juicio.${juicio}`)}</Text>}
          </View>
        ) : (
          <>
            {/* Con pocas noches: cuántas faltan, en vez de un número que todavía no se puede saber. */}
            <View style={st.faltanFila}>
              <Text style={st.faltan}>{plural('sueno.vacio.faltan', MINIMOS.deuda - seguras)}</Text>
              <Text style={st.paraSaber}>{t('sueno.vacio.paraSaber')}</Text>
            </View>
            <Progreso hay={conNoches ? seguras : 0} minimo={MINIMOS.deuda} texto={t('sueno.vacio.deuda', { minimo: MINIMOS.deuda }) + (conNoches && hay > seguras ? ` ${t('sueno.pocoSegurasNoCuentan')}` : '')} />
          </>
        )}
        {(d || conNoches) && <LaNecesidad duermes={d ? d.duermes : null} necesidad={necesidad} edad={conNoches ? edad : undefined} propuesta={propuesta} />}
      </View>
      {conTelefono && (
        <Aparece>
          <Pressable onPress={() => setAparatos(true)} style={({ pressed }) => [st.telefono, pressed && st.apretado]} hitSlop={6} accessibilityRole="button">
            <Text style={[st.chica, st.telefonoTexto]}>{t('sueno.deuda.conTelefono')}</Text>
            <Icono nombre="chevron.right" tam={11} peso="semibold" color={SN.tenue} />
          </Pressable>
        </Aparece>
      )}
      <Pressable onPress={() => setAbierta((a) => !a)} style={({ pressed }) => [st.ver, pressed && st.apretado]} hitSlop={8} accessibilityRole="button" accessibilityState={{ expanded: abierta }}>
        <Text style={st.verTexto}>{t(abierta ? 'sueno.deudaVer.menos' : 'sueno.deudaVer.mas')}</Text>
        <Animated.View style={flecha}><Icono nombre="chevron.down" tam={12} peso="semibold" /></Animated.View>
      </Pressable>
      {abierta && (
        <Aparece style={st.mas}>
          <View style={!conNoches && st.muestra}>
            <Barras lista={lista} necesidad={necesidad} fin={fin} primera={conNoches ? primera : null} animar={animar} />
          </View>
          {d && conNoches && (
            <>
              <Nota>{`${t('sueno.deudaNoches', { n: d.noches, de: d.de })}.`}</Nota>
              {estaNoche !== null && <EstaNoche acostarse={estaNoche} reflujo={reflujo} />}
              <ComoSeCalcula abierto={como} alTocar={() => setComo((x) => !x)}>
                <Text style={st.como}>{conTelefono ? `${t('sueno.deudaTexto')} ${t('sueno.deuda.comoConTelefono')}` : t('sueno.deudaTexto')}</Text>
              </ComoSeCalcula>
            </>
          )}
        </Aparece>
      )}
      {/* Perfil › Aparatos, sin salir de Sueño: qué llega de un reloj o un anillo. */}
      {aparatos && <Aparatos alCerrar={() => setAparatos(false)} />}
    </CartaDeSueno>
  );
}

/** Las dos semanas que terminan en `clave`. */
function ultimasDe(noches: Noche[], clave: ClaveDia): (Noche | null)[] {
  const porClave = new Map(noches.map((n) => [n.clave, n]));
  return Array.from({ length: DIAS }, (_, i) => porClave.get(sumarDias(clave, i - DIAS + 1)) ?? null);
}

const st = StyleSheet.create({
  muestra: { opacity: 0.84 },
  cifraFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cifra: { flexShrink: 1, fontFamily: letras.numero, fontSize: 34, letterSpacing: -0.5, color: colores.cifra, fontVariant: ['tabular-nums'] },
  pastilla: { overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontFamily: letras.textoMedio, fontSize: 13, letterSpacing: 0.3 },
  pastilla_baja: { color: '#b9d6fb', backgroundColor: 'rgba(120, 170, 240, 0.16)' },
  pastilla_media: { color: colores.oroClaro, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  pastilla_alta: { color: '#f3bd9d', backgroundColor: 'rgba(239, 176, 140, 0.16)' },
  faltanFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2 },
  faltan: { fontFamily: letras.numero, fontSize: 28, letterSpacing: -0.4, color: colores.cifra },
  paraSaber: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.58)' },
  linea: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 6 },
  lineaTexto: { fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: 'rgba(239, 230, 207, 0.86)', fontVariant: ['tabular-nums'] },
  necesitas: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enlace: { color: colores.oroClaro },
  editor: { gap: 8, marginTop: 8 },
  chica: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: SN.tenue },
  propuesta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, marginTop: 4 },
  telefono: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  telefonoTexto: { flexShrink: 1 },
  ver: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  verTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  apretado: { opacity: 0.6 },
  mas: { gap: 10 },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 12 },
  leyendaClave: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  leyendaMarca: { width: 10, height: 10, borderRadius: 3 },
  leyendaLinea: { width: 14, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.72)' },
  leyendaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: SN.texto },
  dd: { flexDirection: 'row', marginTop: 8 },
  ddMeta: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.62)' },
  ddCol: { flex: 1, alignItems: 'center', gap: 5 },
  ddZona: { width: '100%', height: 88, alignItems: 'center' },
  ddBarra: { position: 'absolute', width: 13 },
  ddSobra: { backgroundColor: SN.verde, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  ddFalta: { backgroundColor: SN.azul, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  ddNada: { position: 'absolute', width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(196, 212, 246, 0.6)' },
  ddLetra: { fontFamily: letras.texto, fontSize: 9.5, color: SN.tenue },
  ddLetraElegida: { color: colores.pergamino },
  lectura: { minHeight: 18, marginTop: 8, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  esta: { gap: 10, marginTop: 4, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(143, 211, 232, 0.14)', backgroundColor: 'rgba(107, 143, 240, 0.08)' },
  h4: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: SN.texto },
  estaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  estaIco: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(143, 211, 232, 0.12)' },
  estaTextos: { flex: 1, gap: 3 },
  estaTitulo: { fontFamily: letras.textoMedio, fontSize: 15, lineHeight: 19, color: colores.pergamino },
  estaTexto: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 19, color: 'rgba(239, 230, 207, 0.78)' },
  como: { fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 20, color: SN.texto },
});
