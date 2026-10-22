// «Tu mes», en Hábitos (spec/plan.md, etapa 10: el calendario y las estadísticas): el mes en mini
// cielos, cada día con su constelación y lo que se encendió, y abajo los días completos y con luz,
// la luz juntada y cuánto se cumplió cada hábito los últimos 30 días. Sin rachas.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { buscarConstelacion, type Constelacion } from '@/datos/catalogo';
import { cumplimiento, diasDelMes, resumenDelMes } from '@/dominio/estadisticas';
import { diaDeLaSemana, type ClaveDia } from '@/dominio/fechas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { numero, useEstado } from '../comida/datos';
import { MesDeCielos, type CeldaDelMes } from '../graficos/Graficos';
import { HojaModal } from '../HojaModal';
import { EtiquetaDeGrupo, SEMANA } from '../tarjetas';

const constelacionDe = (id: string | null): Constelacion | null => {
  if (!id) return null;
  try {
    return buscarConstelacion(id);
  } catch {
    return null;
  }
};

export function Mes({ alCerrar }: { alCerrar: () => void }) {
  const e = useEstado();
  const { width } = useWindowDimensions();
  const [hoyAnio, hoyMes] = [Number(e.hoy.slice(0, 4)), Number(e.hoy.slice(5, 7)) - 1];
  const [visto, setVisto] = useState({ anio: hoyAnio, mes: hoyMes });
  const esteMes = visto.anio === hoyAnio && visto.mes === hoyMes;
  const mover = (d: 1 | -1) => setVisto(({ anio, mes }) => {
    const m = mes + d;
    return { anio: anio + Math.floor(m / 12), mes: ((m % 12) + 12) % 12 };
  });

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
  return (
    <HojaModal
      abierta
      titulo={t('habitos.mes.titulo')}
      alCerrar={alCerrar}
    >
      <View style={st.navegar}>
        <Pressable onPress={() => mover(-1)} style={st.flecha} accessibilityRole="button" accessibilityLabel={t('habitos.mes.anterior')} hitSlop={8}>
          <Icono nombre="chevron.left" tam={15} color={colores.pergamino} />
        </Pressable>
        <Text style={st.mes}>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</Text>
        <Pressable onPress={() => !esteMes && mover(1)} disabled={esteMes} style={[st.flecha, esteMes && { opacity: 0.3 }]} accessibilityRole="button" accessibilityLabel={t('habitos.mes.siguiente')} hitSlop={8}>
          <Icono nombre="chevron.right" tam={15} color={colores.pergamino} />
        </Pressable>
      </View>
      <View style={st.semana}>
        {SEMANA.map((d) => <Text key={d} style={[st.letra, { width: lado }]}>{lista('fecha.diasCortos')[d].charAt(0)}</Text>)}
      </View>
      <View style={{ width: ancho, height: filas * alto }}>
        <MesDeCielos celdas={celdas} ancho={ancho} alto={filas * alto} />
        {celdas.map((c) => (
          <Text
            key={c.clave}
            style={[st.numero, { left: c.x + 4, top: c.y + 3 }, c.clave === e.hoy && st.numeroHoy, c.clave > e.hoy && st.numeroFuturo]}
            accessibilityLabel={c.completo ? `${Number(c.clave.slice(8))} ✓` : undefined}
          >
            {Number(c.clave.slice(8))}
          </Text>
        ))}
      </View>
      {resumen.conHabitos === 0 && <Text style={st.vacio}>{t('habitos.mes.sinDatos')}</Text>}

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
