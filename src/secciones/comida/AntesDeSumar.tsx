// Lo que la ventana del alimento muestra antes de sumar (lo pediste el 22/10/2026, como en la
// galería): si está verificado y de dónde sale, cómo deja el día, las vitaminas y los minerales, y
// «Reportar un error». Lo que se abre crece y lo que se va se desvanece: nada aparece de golpe.

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { buzon } from '@/almacen/buzonDeMoss';
import { MOTIVOS, type Motivo } from '@/almacen/buzon';
import type { Detalle } from '@/comida/detalle';
import { VERSION_DE_LA_BASE } from '@/comida/version-de-la-base';
import { comoDejaElDia, MACROS as MACROS_DEL_DIA, type Frase } from '@/dominio/dejaElDia';
import type { Macros } from '@/dominio/metas';
import { destacados, GRUPOS, referenciaDe, UNIDAD, type Micro, type Micros, type ParaQuien } from '@/dominio/micronutrientes';
import { idioma, t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_HOJA, ENTRA_VELO, SALE_HOJA, SALE_VELO } from '../movimiento';
import { ACOMODA, Aparece } from '../tarjetas';
import { Boton, COLOR_DE_MACRO, Etiqueta, Icono, Pastilla } from './comunes';
import { numero } from './datos';

// ------------------------------------------------------------ verificado y de dónde sale
const TABLAS = ['cnf', 'taco', 'tbca', 'ciqual', 'cofid', 'afcd', 'argenfoods', 'uruguay'] as const;
const nombreDeTabla = (con: string) => {
  const prefijo = con.split(':')[0];
  return (TABLAS as readonly string[]).includes(prefijo) ? t(`comida.tablas.${prefijo as (typeof TABLAS)[number]}`) : t('comida.tablas.otra');
};
const fechaLarga = (clave: string) => new Date(`${clave}T12:00:00`).toLocaleDateString(idioma() === 'es' ? 'es-UY' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

/** El sello junto a la fuente: verificado, o apagado si todavía no. */
export function Sello({ verificado }: { verificado: boolean }) {
  return (
    <View style={[estilos.sello, verificado && estilos.selloSi]}>
      {verificado && <Icono nombre="checkmark" tam={9} color={colores.salvia} peso="bold" />}
      <Text style={[estilos.selloTexto, verificado && { color: colores.salvia }]}>{t(verificado ? 'comida.verificado' : 'comida.sinVerificar')}</Text>
    </View>
  );
}

/** «¿De dónde sale esto?»: la base, la receta o la etiqueta, y con qué se comparó y cuándo. */
export function DeDonde({ detalle, origen }: { detalle: Detalle | null; origen: string }) {
  const lineas: string[] = [];
  if (!detalle) lineas.push(origen);
  else {
    const d = detalle;
    lineas.push(d.origen === 'receta' && d.receta ? t('comida.deDonde.receta', { n: d.receta.ingredientes.length, g: numero(d.receta.pesoFinal) })
      : d.origen === 'producto' ? t(d.atribucion === 'off' ? 'comida.deDonde.off' : 'comida.deDonde.producto')
        : d.origen === 'propio' ? t('comida.deDonde.propio') : t('comida.deDonde.usda'));
    const v = d.verificado;
    lineas.push(!v ? t('comida.deDonde.sin') : v.con === 'ingredientes' ? t('comida.deDonde.ingredientes') : v.con === 'etiqueta' ? t('comida.deDonde.etiqueta')
      : t('comida.deDonde.con', { tabla: nombreDeTabla(v.con), fecha: fechaLarga(v.fecha) }));
  }
  return (
    <Aparece style={estilos.deDonde}>
      <Text style={estilos.deDondeTitulo}>{t('comida.deDonde.titulo')}</Text>
      {lineas.map((l) => <Text key={l} style={estilos.deDondeTexto}>{l}</Text>)}
    </Aparece>
  );
}

// ------------------------------------------------------------ cómo deja el día
function textoDeFrase(f: Frase): string {
  if (f.tipo === 'llegas') return t(`comida.deja.llegas.${f.macro}`, { n: f.porcentaje });
  if (f.tipo === 'completas') return t(`comida.deja.completas.${f.macro}`);
  return t(`comida.deja.pasas.${f.macro}`, { n: numero(f.gramos) });
}

/**
 * Cada macro con lo que ya había (apagado) y lo que suma esto (con su color), y una frase. Sin los
 * números, quedan las barras y solo la frase que no tiene cifras («completas tu proteína»).
 */
export function ComoDeja({ antes, esto, meta, numeros = true }: { antes: Macros; esto: Macros; meta: Macros; numeros?: boolean }) {
  const { barras, frase } = comoDejaElDia(antes, esto, meta);
  const texto = frase && (numeros || frase.tipo === 'completas') ? textoDeFrase(frase) : null;
  return (
    <View style={estilos.deja}>
      {MACROS_DEL_DIA.map((m) => {
        const desde = Math.min(1, barras[m].antes);
        const hasta = Math.min(1, barras[m].despues);
        const porcentaje = t('comida.porcentaje', { n: numero(Math.round(barras[m].despues * 100)) });
        return (
          <View key={m} style={estilos.barra} accessible accessibilityLabel={`${t(`comida.${m}`)}: ${porcentaje}`}>
            <Text style={estilos.barraNombre}>{t(`comida.${m}`)}</Text>
            <View style={estilos.pista}>
              <Animated.View layout={ACOMODA} style={[estilos.tramo, { width: `${desde * 100}%`, backgroundColor: COLOR_DE_MACRO[m], opacity: 0.34 }]} />
              <Animated.View layout={ACOMODA} style={[estilos.tramo, { left: `${desde * 100}%`, width: `${(hasta - desde) * 100}%`, backgroundColor: COLOR_DE_MACRO[m] }]} />
            </View>
            {numeros && <Text style={[estilos.barraPorcentaje, barras[m].despues >= 1 && { color: COLOR_DE_MACRO[m] }]}>{porcentaje}</Text>}
          </View>
        );
      })}
      {texto && (
        <Animated.Text key={texto} entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={estilos.frase}>
          {texto}
        </Animated.Text>
      )}
    </View>
  );
}

// ------------------------------------------------------------ vitaminas y minerales
const cifra = (n: number) => (n === 0 ? '0' : numero(n, n < 1 ? 2 : n < 10 ? 1 : 0));
function parteDelDiaTexto(micro: Micro, cantidad: number, persona: ParaQuien): string {
  const r = referenciaDe(micro, persona);
  if (!r) return '';
  const n = numero(Math.round((cantidad / ('meta' in r ? r.meta : r.tope)) * 100));
  return t('meta' in r ? 'comida.micros.delDia' : 'comida.micros.delMaximo', { n });
}

/** Lo que más aporta, para la edad y el sexo de la persona, y todo al tocar «Ver todo». */
export function Micronutrientes({ micros, persona }: { micros: Micros; persona: ParaQuien }) {
  const [todo, setTodo] = useState(false);
  const lo = destacados(micros, persona).slice(0, 4);
  return (
    <>
      <Etiqueta estilo={estilos.etiqueta}>{t('comida.micros.titulo')}</Etiqueta>
      <View style={estilos.chips}>
        {lo.map((d) => (
          <View key={d.micro} style={estilos.chip}>
            <Text style={estilos.chipNombre}>{t(`comida.micros.nombres.${d.micro}`)}</Text>
            <Text style={estilos.chipParte}>{`${numero(Math.round(d.parte * 100))} %`}</Text>
          </View>
        ))}
        {!lo.length && <Text style={estilos.poco}>{t('comida.micros.poco')}</Text>}
        <Pressable onPress={() => setTodo(!todo)} accessibilityRole="button" accessibilityState={{ expanded: todo }} hitSlop={8}>
          <Text style={estilos.ver}>{t(todo ? 'comida.micros.verMenos' : 'comida.micros.verTodo')}</Text>
        </Pressable>
      </View>
      {todo && (
        <Aparece>
          {Object.entries(GRUPOS).map(([grupo, claves]) => {
            const filas = (claves as readonly Micro[]).filter((k) => micros[k] != null);
            if (!filas.length) return null;
            return (
              <View key={grupo}>
                <Text style={estilos.grupo}>{t(`comida.micros.grupos.${grupo as keyof typeof GRUPOS}`)}</Text>
                {filas.map((k) => (
                  <View key={k} style={estilos.microFila}>
                    <Text style={estilos.microNombre}>{t(`comida.micros.nombres.${k}`)}</Text>
                    <Text style={estilos.microCantidad}>{`${cifra(micros[k]!)} ${UNIDAD[k]}`}</Text>
                    <Text style={estilos.microParte}>{parteDelDiaTexto(k, micros[k]!, persona)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
          <Text style={estilos.nota}>{t('comida.micros.referencia')}</Text>
        </Aparece>
      )}
    </>
  );
}

// ------------------------------------------------------------ reportar un error
/** Sobre la ventana: qué está mal y una nota si quiere. Sale sin la cuenta (src/almacen/buzon.ts). */
export function Reporte({ alimento, codigo, nombre, alCerrar, abajo }: { alimento: number | null; codigo: string | null; nombre: string; alCerrar: () => void; abajo: number }) {
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [nota, setNota] = useState('');
  const [enviado, setEnviado] = useState(false);
  useEffect(() => {
    if (!enviado) return;
    const espera = setTimeout(alCerrar, 1700);
    return () => clearTimeout(espera);
  }, [enviado, alCerrar]);
  const enviar = () => {
    if (!motivo) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    buzon().echar({ tipo: 'reporte', alimento, codigo, nombre, motivo, nota: nota.trim().slice(0, 500) || null, version: VERSION_DE_LA_BASE }).catch(() => {});
    setEnviado(true);
  };
  return (
    <Animated.View entering={ENTRA_VELO} exiting={SALE_VELO} style={estilos.velo}>
      <Pressable style={StyleSheet.absoluteFill} onPress={alCerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
      <Animated.View entering={ENTRA_HOJA} exiting={SALE_HOJA} style={[estilos.reporte, { paddingBottom: abajo + 10 }]}>
        {enviado ? (
          <Aparece style={estilos.gracias}>
            <Text style={estilos.graciasTexto}>{t('comida.reportar.gracias')}</Text>
          </Aparece>
        ) : (
          <>
            <View style={estilos.reporteCabeza}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.reporteTitulo}>{t('comida.reportar.titulo')}</Text>
                <Text style={estilos.reporteNombre}>{nombre}</Text>
              </View>
              <Pressable onPress={alCerrar} style={estilos.redondo} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')}>
                <Icono nombre="xmark" tam={14} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
              </Pressable>
            </View>
            <View style={estilos.motivos}>
              {MOTIVOS.map((m) => <Pastilla key={m} texto={t(`comida.reportar.motivos.${m}`)} elegida={motivo === m} alTocar={() => setMotivo(m)} />)}
            </View>
            <TextInput
              value={nota}
              onChangeText={setNota}
              placeholder={t('comida.reportar.nota')}
              placeholderTextColor="rgba(239, 230, 207, 0.4)"
              multiline
              maxLength={500}
              style={estilos.notaCampo}
            />
            <Boton tipo="grande" texto={t('comida.reportar.enviar')} alTocar={enviar} desactivado={!motivo} />
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

/** El enlace al pie de la ventana. */
export function EnlaceReportar({ alTocar }: { alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} accessibilityRole="button" style={estilos.enlace} hitSlop={6}>
      <Text style={estilos.enlaceTexto}>{t('comida.reportar.boton')}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  sello: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingLeft: 6, paddingRight: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  selloSi: { borderColor: 'rgba(166, 191, 148, 0.45)' },
  selloTexto: { fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.5)' },
  deDonde: { marginTop: 10 },
  deDondeTitulo: { marginBottom: 4, fontFamily: letras.textoMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.85)' },
  deDondeTexto: { marginBottom: 3, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.62)' },
  deja: { marginTop: 12, gap: 7 },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barraNombre: { width: 92, fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.6)' },
  pista: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(239, 230, 207, 0.07)', overflow: 'hidden' },
  tramo: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  barraPorcentaje: { width: 40, textAlign: 'right', fontFamily: letras.numeroMedio, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.78)', fontVariant: ['tabular-nums'] },
  frase: { marginTop: 3, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.85)' },
  etiqueta: { marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(239, 230, 207, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  chipNombre: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.78)' },
  chipParte: { fontFamily: letras.numeroMedio, fontSize: 12, color: colores.oroClaro, fontVariant: ['tabular-nums'] },
  poco: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.5)' },
  ver: { paddingVertical: 6, paddingHorizontal: 4, fontFamily: letras.texto, fontSize: 12, color: colores.oroClaro },
  grupo: { marginTop: 12, marginBottom: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.45)' },
  microFila: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(239, 230, 207, 0.08)' },
  microNombre: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.75)' },
  microCantidad: { fontFamily: letras.numeroMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.85)', fontVariant: ['tabular-nums'] },
  microParte: { width: 92, textAlign: 'right', fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.5)' },
  nota: { marginTop: 10, fontFamily: letras.texto, fontSize: 11, lineHeight: 15, color: 'rgba(239, 230, 207, 0.45)' },
  enlace: { alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 10 },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.45)' },
  velo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end', backgroundColor: 'rgba(5, 8, 18, 0.55)' },
  reporte: {
    gap: 14, paddingTop: 16, paddingHorizontal: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colores.ventana,
    borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)',
  },
  reporteCabeza: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reporteTitulo: { fontFamily: letras.numeroMedio, fontSize: 22, color: colores.pergamino },
  reporteNombre: { marginTop: 4, fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
  redondo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notaCampo: {
    minHeight: 72, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.55)',
    color: colores.pergamino, fontFamily: letras.texto, fontSize: 14, textAlignVertical: 'top', outlineWidth: 0,
  },
  gracias: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  graciasTexto: { fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
});
