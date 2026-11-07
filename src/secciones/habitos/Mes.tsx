// «Tu mes», en Hábitos (spec/plan.md, etapa 10: el calendario y las estadísticas): el mes en mini
// cielos, cada día con su constelación y lo que se encendió, y abajo los días completos y con luz,
// la luz juntada y cuánto se cumplió cada hábito los últimos 30 días. Sin rachas.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, LayoutAnimationConfig, useReducedMotion } from 'react-native-reanimated';

import { buscarConstelacion, type Constelacion } from '@/datos/catalogo';
import { cumplimiento, diasDelMes, resumenDelMes } from '@/dominio/estadisticas';
import { diaDeLaSemana, type ClaveDia } from '@/dominio/fechas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { numero, useEstado } from '../comida/datos';
import { MesDeCielos, type CeldaDelMes } from '../graficos/Graficos';
import { HojaModal } from '../HojaModal';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { ACOMODA, Aparece, EtiquetaDeGrupo, SEMANA } from '../tarjetas';

const constelacionDe = (id: string | null): Constelacion | null => {
  if (!id) return null;
  try {
    return buscarConstelacion(id);
  } catch {
    return null;
  }
};

/** Los números de los días van en celdas fijas: con el texto grande, crecen poco. */
const LETRA_DE_CELDA = 1.2;

export function Mes({ alCerrar }: { alCerrar: () => void }) {
  const e = useEstado();
  const { width } = useWindowDimensions();
  const reducido = useReducedMotion();
  const [hoyAnio, hoyMes] = [Number(e.hoy.slice(0, 4)), Number(e.hoy.slice(5, 7)) - 1];
  const [visto, setVisto] = useState({ anio: hoyAnio, mes: hoyMes });
  // Hacia dónde se fue: el mes que llega entra de ese lado.
  const [hacia, setHacia] = useState<1 | -1>(1);
  const esteMes = visto.anio === hoyAnio && visto.mes === hoyMes;
  const mover = (d: 1 | -1) => {
    setHacia(d);
    setVisto(({ anio, mes }) => {
      const m = mes + d;
      return { anio: anio + Math.floor(m / 12), mes: ((m % 12) + 12) % 12 };
    });
  };

  const ancho = width - 40;
  const lado = ancho / 7;
  const alto = lado * 1.08;
  const claves = diasDelMes(visto.anio, visto.mes);
  // De lunes a domingo: los huecos antes del primero.
  const hueco = (diaDeLaSemana(claves[0]) + 6) % 7;
  const filas = Math.ceil((hueco + claves.length) / 7);
  const celdas = useMemo(
    () =>
      claves.map((clave, i): CeldaDelMes & { clave: ClaveDia } => {
        const lugar = hueco + i;
        const d = clave <= e.hoy ? e.dias.get(clave) : undefined;
        return {
          clave, x: (lugar % 7) * lado, y: Math.floor(lugar / 7) * alto, ancho: lado, alto,
          constelacion: d ? constelacionDe(d.constelacion) : null,
          encendidas: d ? d.habitos.map((h) => d.hechos.includes(h)) : [],
          completo: !!d?.completo,
        };
      }),
    [claves, hueco, lado, alto, e.dias, e.hoy],
  );
  const resumen = resumenDelMes(e.dias, visto.anio, visto.mes, e.hoy);
  const vigentes = e.habitos.filter((h) => !h.hasta || h.hasta >= e.hoy).sort((a, b) => a.orden - b.orden);

  const titulo = `${lista('fecha.meses')[visto.mes]} ${visto.anio}`;
  const clave = `${visto.anio}-${visto.mes}`;
  // Cambiar de mes no es de golpe: el que llega entra del lado de la flecha y el que se va se funde;
  // con Reducir movimiento, los dos se funden.
  const entra = reducido ? ENTRA_FUNDIDO : (hacia > 0 ? FadeInRight : FadeInLeft).duration(260);
  return (
    <HojaModal
      abierta
      titulo={t('habitos.mes.titulo')}
      alCerrar={alCerrar}
    >
      {/* Al abrir, el mes llega con la hoja: lo que entra al cambiar de mes no se mueve esa primera vez. */}
      <LayoutAnimationConfig skipEntering>
      <View style={st.navegar}>
        <Pressable onPress={() => mover(-1)} style={({ pressed }) => [st.flecha, pressed && st.apretado]} accessibilityRole="button" accessibilityLabel={t('habitos.mes.anterior')} hitSlop={8}>
          <Icono nombre="chevron.left" tam={15} color={colores.pergamino} />
        </Pressable>
        <Animated.Text key={clave} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={st.mes} accessibilityRole="header">
          {titulo.charAt(0).toUpperCase() + titulo.slice(1)}
        </Animated.Text>
        <Pressable
          onPress={() => !esteMes && mover(1)}
          disabled={esteMes}
          style={({ pressed }) => [st.flecha, esteMes && { opacity: 0.3 }, pressed && st.apretado]}
          accessibilityRole="button"
          accessibilityLabel={t('habitos.mes.siguiente')}
          accessibilityState={{ disabled: esteMes }}
          hitSlop={8}
        >
          <Icono nombre="chevron.right" tam={15} color={colores.pergamino} />
        </Pressable>
      </View>
      <View style={st.semana}>
        {SEMANA.map((d) => <Text key={d} style={[st.letra, { width: lado }]} maxFontSizeMultiplier={LETRA_DE_CELDA}>{lista('fecha.diasCortos')[d].charAt(0)}</Text>)}
      </View>
      {/* Un mes de 5 filas y uno de 6: la grilla se acomoda, y lo de abajo con ella. */}
      <Animated.View layout={ACOMODA} style={{ width: ancho, height: filas * alto }}>
        <Animated.View key={clave} entering={entra} exiting={SALE_FUNDIDO} style={StyleSheet.absoluteFill}>
          <MesDeCielos celdas={celdas} ancho={ancho} alto={filas * alto} />
          {celdas.map((c) => (
            <Text
              key={c.clave}
              style={[st.numero, { left: c.x + 4, top: c.y + 3 }, c.clave === e.hoy && st.numeroHoy, c.clave > e.hoy && st.numeroFuturo]}
              maxFontSizeMultiplier={LETRA_DE_CELDA}
              accessibilityLabel={c.completo ? t('habitos.mes.diaCompleto', { n: Number(c.clave.slice(8)) }) : undefined}
            >
              {Number(c.clave.slice(8))}
            </Text>
          ))}
        </Animated.View>
      </Animated.View>
      <Animated.View layout={ACOMODA}>
        {resumen.conHabitos === 0 && (
          <Aparece>
            <Text style={st.vacio}>{t('habitos.mes.sinDatos')}</Text>
          </Aparece>
        )}

        <View style={st.cifras}>
          <Cifra valor={resumen.completos} texto={t('habitos.mes.completos')} />
          <Cifra valor={resumen.conLuz} texto={t('habitos.mes.conLuz')} />
          <Cifra valor={resumen.luz} texto={t('habitos.mes.luz')} />
        </View>

        {vigentes.length > 0 && (
          <>
            <EtiquetaDeGrupo>{t('habitos.mes.porHabito')}</EtiquetaDeGrupo>
            {vigentes.map((h) => {
              const c = cumplimiento(h.id, e.dias, e.hoy, 30);
              const k = c.total ? c.hechos / c.total : 0;
              return (
                <View key={h.id} style={st.habito}>
                  <View style={st.habitoFila}>
                    <Icono nombre={h.icono as 'star'} tam={14} color="rgba(239, 230, 207, 0.6)" />
                    <Text style={st.habitoNombre} numberOfLines={1}>{h.nombre}</Text>
                    <Text style={st.habitoCuenta}>{t('habitos.mes.deVeces', { hechos: numero(c.hechos), total: numero(c.total) })}</Text>
                  </View>
                  <View style={st.pista}>
                    <View style={[st.pistaLlena, { width: `${k * 100}%` }]} />
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Animated.View>
      </LayoutAnimationConfig>
    </HojaModal>
  );
}

const Cifra = ({ valor, texto }: { valor: number; texto: string }) => (
  <View style={st.cifra}>
    <Text style={st.cifraValor}>{numero(valor)}</Text>
    <Text style={st.cifraTexto}>{texto}</Text>
  </View>
);

const st = StyleSheet.create({
  navegar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  apretado: { opacity: 0.55 },
  mes: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  semana: { flexDirection: 'row', marginBottom: 4 },
  letra: { textAlign: 'center', fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 1, color: 'rgba(239, 230, 207, 0.45)' },
  numero: { position: 'absolute', fontFamily: letras.numero, fontSize: 10, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  numeroHoy: { color: colores.oroClaro },
  numeroFuturo: { color: 'rgba(239, 230, 207, 0.22)' },
  vacio: { marginTop: 8, textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.5)' },
  cifras: { marginTop: 16, flexDirection: 'row', gap: 8 },
  cifra: { flex: 1, gap: 4, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  cifraValor: { fontFamily: letras.numero, fontSize: 24, color: colores.cifra, fontVariant: ['tabular-nums'] },
  cifraTexto: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: 'rgba(239, 230, 207, 0.55)' },
  habito: { gap: 6, paddingVertical: 8 },
  habitoFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  habitoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  habitoCuenta: { fontFamily: letras.numero, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'] },
  pista: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  pistaLlena: { height: '100%', borderRadius: 2, backgroundColor: colores.oro },
});
