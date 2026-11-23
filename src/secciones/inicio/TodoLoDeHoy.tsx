// Todo lo de hoy (lo pediste el 30/10/2026; galeria/src/inicio.js): al tocar la luna, una hoja con cómo ver las
// calorías, lo de hoy con lo que falta, lo que Moss sabe de ti y de dónde, lo que le falta y, abajo de todo, cómo
// lo estima. Saberlo da seguridad. Con los números ocultos, sin calorías ni gramos.

import * as Haptics from 'expo-haptics';
import { Fragment, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { elAlmacen } from '@/almacen';
import { ESTILOS_DE_KCAL } from '@/almacen/almacen';
import { edadDe, estadoDeMacro, objetivoPermitido } from '@/dominio/metas';
import { faltaParaEstimar } from '@/dominio/progreso';
import { idioma, lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono, MACROS } from '../comida/comunes';
import { cifraDePeso, duracion, fechaDiaMes, metaDelDia, numero, sistemaDe, textoDePeso, totalDe, useEstado } from '../comida/datos';
import { usePersona, useSueno } from '../ganchos';
import { HojaModal } from '../HojaModal';
import { Muestra } from '../kcal/Kcal';
import { ritmoDelPlan } from '../persona';
import { justo } from './comunes';
import { entradaDeParaHoy } from './consejos';

const COMO = ['calorias', 'macros', 'peso', 'grasa', 'sueno', 'alimentos'] as const;

/** «a, b y c»; en inglés, con «and». */
const enLista = (cosas: readonly string[]) => {
  const y = idioma() === 'es' ? ' y ' : ' and ';
  return cosas.length < 2 ? cosas.join('') : `${cosas.slice(0, -1).join(', ')}${y}${cosas[cosas.length - 1]}`;
};

export function TodoLoDeHoy({ abierta, alCerrar, alVerComida }: { abierta: boolean; alCerrar: () => void; alVerComida: () => void }) {
  return (
    <HojaModal abierta={abierta} titulo={t('inicio.todo.titulo')} alCerrar={alCerrar}>
      {abierta && <Contenido alVerComida={alVerComida} />}
    </HojaModal>
  );
}

function Contenido({ alVerComida }: { alVerComida: () => void }) {
  const e = useEstado();
  const p = usePersona();
  const s = useSueno();
  const numeros = e.numeros;
  const meta = metaDelDia(e, e.hoy);
  const comido = totalDe(e.registros, e.hoy, e.hoy);
  const sistema = sistemaDe(e);
  const sinAnotar = useMemo(() => entradaDeParaHoy(e, new Date())?.sinAnotar ?? [], [e]);

  // Hoy: lo que falta o se pasó de cada macro, y lo que falta anotar.
  const frases: string[] = [];
  if (meta && numeros) {
    const deMacro = (m: (typeof MACROS)[number], n: number) => t('inicio.todo.deMacro', { n: numero(Math.round(n)), macro: t(`comida.${m}`).toLowerCase() });
    const faltan = MACROS.filter((m) => estadoDeMacro(comido[m], meta[m]) === 'falta').map((m) => deMacro(m, meta[m] - comido[m]));
    const pasados = MACROS.filter((m) => estadoDeMacro(comido[m], meta[m]) === 'pasado').map((m) => deMacro(m, comido[m] - meta[m]));
    if (faltan.length) frases.push(t('inicio.todo.teFaltan', { lista: enLista(faltan) }));
    if (pasados.length) frases.push(t('inicio.todo.tePasaste', { lista: enLista(pasados) }));
    if (!faltan.length && !pasados.length) frases.push(t('inicio.todo.llegaste'));
  }
  if (sinAnotar.length) frases.push(t('inicio.todo.sinAnotar', { lista: enLista(sinAnotar.map((c) => t(`comida.comidas.${c}`).toLowerCase())) }));

  // Lo que Moss sabe de ti, y de dónde lo sacó. De la persona de ejemplo, solo lo que dijiste.
  const perfil = e.perfil;
  const sabe: [string, string, string][] = [];
  if (perfil) {
    if (!p.deEjemplo && p.pesoHoy !== null) sabe.push([t('inicio.todo.peso'), textoDePeso(p.pesoHoy, sistema), t('inicio.todo.origen.pesadas')]);
    sabe.push([t('perfil.altura'), `${numero(perfil.alturaCm)} cm`, t('inicio.todo.origen.dijiste')]);
    sabe.push([t('perfil.edad'), numero(edadDe(perfil, e.hoy)), t('inicio.todo.origen.dijiste')]);
    sabe.push([t('perfil.sexo'), t(perfil.sexo === 'f' ? 'entrada.cuestionario.femenino' : 'entrada.cuestionario.masculino'), t('inicio.todo.origen.dijiste')]);
    sabe.push([t('perfil.actividad'), lista(`entrada.cuestionario.actividad.${perfil.actividad}`)[0], t('inicio.todo.origen.dijiste')]);
    // Sin déficit, bajar queda en mantener; el ritmo, el de Progreso (lo elegido en Ritmo y plazo).
    const objetivo = objetivoPermitido(perfil);
    const pct = ritmoDelPlan(e);
    if (objetivo === 'mantener' || !perfil.pesoMeta || pct === null) {
      sabe.push([t('progreso.objetivo'), t(`progreso.objetivos.${objetivo}`), t('inicio.todo.origen.elegiste')]);
    } else {
      const m = cifraDePeso(perfil.pesoMeta, sistema);
      sabe.push([
        t('progreso.objetivo'), t(`progreso.objetivoA.${objetivo}`, { kg: m.cifra, unidad: m.unidad }),
        t('inicio.todo.origen.ritmo', { pct: numero(pct, 2) }),
      ]);
    }
    if (!p.deEjemplo && numeros && p.gasto !== null && p.control) sabe.push([t('progreso.gasto'), `${numero(p.gasto)} ${t('inicio.kcalPorDia')}`, t('inicio.todo.origen.control', { fecha: fechaDiaMes(p.control.fecha) })]);
    if (!p.deEjemplo && p.grasa) sabe.push([t('progreso.grasa'), t('cuerpo.rango', { desde: numero(p.grasa.desde), hasta: numero(p.grasa.hasta) }), t('inicio.todo.origen.medidas')]);
    const noche = s.deEjemplo ? null : s.noches.find((n) => n.clave === e.hoy);
    if (noche) sabe.push([t('inicio.bloques.sueno'), duracion(noche.dormido), noche.fuente.tipo !== 'moss' ? t('inicio.todo.origen.aparato', { aparato: noche.fuente.nombre }) : t('inicio.todo.origen.estimado')]);
  }

  // Lo que le falta a Moss para estimar mejor (faltaParaEstimar, la regla de Progreso).
  const sinReloj = s.deEjemplo || s.noches.every((n) => n.fuente.tipo === 'moss');
  const falta = perfil && !p.deEjemplo
    ? faltaParaEstimar({ control: p.estadoControl, objetivo: perfil.objetivo, pesoMeta: perfil.pesoMeta, conMedidas: !!p.grasa, sinReloj })
    : [];

  return (
    <>
      <Text style={st.grupo}>{t('inicio.todo.estilo.titulo')}</Text>
      <View style={st.estilos}>
        {ESTILOS_DE_KCAL.map((k) => {
          const elegido = e.kcal === k;
          return (
            <Pressable
              key={k}
              onPress={() => {
                if (elegido) return;
                Haptics.selectionAsync().catch(() => {});
                elAlmacen().ponerKcal(k);
              }}
              style={({ pressed }) => [st.estilo, elegido && st.estiloElegido, pressed && st.apretado]}
              accessibilityRole="button"
              accessibilityState={{ selected: elegido }}
            >
              <View style={st.muestra}><Muestra estilo={k} /></View>
              <Text style={[st.estiloNombre, elegido && st.estiloNombreElegido]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{t(`inicio.todo.estilo.${k}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={st.grupo}>{t('inicio.todo.hoy')}</Text>
      {meta && numeros && (
        <View style={st.tabla}>
          <View style={[st.fila, st.cabeza]}>
            <Text style={[st.celdaNombre, st.cabezaTexto]} />
            {(['comiste', 'meta', 'queda'] as const).map((k) => <Text key={k} style={[st.celda, st.cabezaTexto]}>{t(`inicio.todo.${k}`)}</Text>)}
          </View>
          {(['kcal', ...MACROS] as const).map((m) => {
            const unidad = m === 'kcal' ? '' : ' g';
            const cuanto = (n: number) => `${numero(Math.round(n))}${unidad}`;
            const estado = estadoDeMacro(comido[m], meta[m]);
            const resto = meta[m] - comido[m];
            return (
              <View key={m} style={[st.fila, st.filaConBorde]}>
                <Text style={[st.celdaNombre, m === 'kcal' && st.nombreKcal]} numberOfLines={1}>{m === 'kcal' ? t('inicio.todo.calorias') : t(`comida.${m}`)}</Text>
                <Text style={[st.celda, st.celdaFuerte]}>{cuanto(comido[m])}</Text>
                <Text style={st.celda}>{cuanto(meta[m])}</Text>
                <Text style={[st.celda, st.celdaFuerte, estado === 'cumplido' && st.cumplido, estado === 'pasado' && st.pasado]}>
                  {estado === 'falta' ? cuanto(resto) : estado === 'pasado' ? `+${cuanto(-resto)}` : '✓'}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      {frases.length > 0 && <Text style={st.frase}>{frases.join(' ')}</Text>}
      <Pressable onPress={alVerComida} style={({ pressed }) => [st.enlace, pressed && st.apretado]} accessibilityRole="link" hitSlop={8}>
        <Text style={st.enlaceTexto}>{t('inicio.todo.verComida')}</Text>
        <Icono nombre="chevron.right" tam={12} peso="semibold" />
      </Pressable>

      {sabe.length > 0 && (
        <>
          <Text style={st.grupo}>{t('inicio.todo.sabe')}</Text>
          <View style={st.lista}>
            {sabe.map(([nombre, valor, origen], i) => (
              <View key={nombre} style={[st.dato, i > 0 && st.datoConBorde]}>
                <View style={st.datoTextos}>
                  <Text style={st.datoNombre}>{nombre}</Text>
                  <Text style={st.datoOrigen}>{origen}</Text>
                </View>
                <Text style={st.datoValor}>{valor}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={st.grupo}>{t('inicio.todo.falta')}</Text>
      {falta.length ? (
        <View style={st.faltas}>
          {falta.map((x) => (
            <View key={x.que} style={st.falta}>
              <View style={st.rombo} />
              <Text style={st.faltaTexto}>
                {'fecha' in x && x.fecha ? plural(`inicio.todo.faltaItems.${x.que as 'pesadas' | 'comida'}`, x.n, { fecha: fechaDiaMes(x.fecha) }) : t(`inicio.todo.faltaItems.${x.que as 'pesoMeta' | 'medidas' | 'reloj'}`)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={st.frase}>{t('inicio.todo.faltaNada')}</Text>
      )}

      <Text style={st.grupo}>{t('inicio.todo.como')}</Text>
      {COMO.map((k) => (
        <Fragment key={k}>
          <View style={st.como}>
            <Text style={st.comoTitulo}>{t(`inicio.todo.comoEstima.${k}.titulo`)}</Text>
            <Text style={st.comoTexto}>{t(`inicio.todo.comoEstima.${k}.texto`)}</Text>
          </View>
        </Fragment>
      ))}
      <Text style={st.pie}>{t('inicio.todo.pie')}</Text>
    </>
  );
}

const tenue = 'rgba(239, 230, 207, 0.6)';
const st = StyleSheet.create({
  apretado: { opacity: 0.7 },
  // El título de cada grupo (.pf-grupo): 20 arriba y 8 abajo de un renglón de 9,5 (los márgenes le sacan lo que sobra de la letra).
  grupo: { marginTop: 17.9, marginBottom: 5.9, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  estilos: { flexDirection: 'row', gap: 6 },
  estilo: { flex: 1, alignItems: 'center', gap: 7, paddingTop: 10, paddingBottom: 9, paddingHorizontal: 2, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(239, 230, 207, 0.03)' },
  estiloElegido: { borderColor: 'rgba(232, 196, 106, 0.6)', backgroundColor: 'rgba(232, 196, 106, 0.08)' },
  muestra: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  estiloNombre: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.62)', ...justo('texto', 11.5) },
  estiloNombreElegido: { color: colores.oroClaro },
  tabla: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)', paddingVertical: 4, paddingHorizontal: 12 },
  fila: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingVertical: 9 },
  filaConBorde: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  cabeza: { paddingTop: 7, paddingBottom: 5 },
  cabezaTexto: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.45)', ...justo('texto', 9.5) },
  celdaNombre: { flex: 1, minWidth: 0, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 16.2, color: colores.pergamino },
  nombreKcal: { fontFamily: letras.textoMedio },
  celda: { width: 62, textAlign: 'right', fontFamily: letras.numero, fontSize: 13, color: tenue, fontVariant: ['tabular-nums'] },
  celdaFuerte: { fontFamily: letras.numeroMedio, color: colores.pergamino },
  cumplido: { color: colores.salvia },
  pasado: { color: colores.oroClaro },
  frase: { marginTop: 10, marginHorizontal: 4, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 20, color: 'rgba(239, 230, 207, 0.82)' },
  enlace: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', marginTop: 12, marginHorizontal: 4 },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro, ...justo('texto', 13, 15) },
  // Como las listas de Perfil (.pf-lista), que es como se ve en la galería.
  lista: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.72)' },
  dato: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, paddingLeft: 16, paddingRight: 14 },
  datoConBorde: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  datoTextos: { flex: 1, gap: 3, minWidth: 0 },
  datoNombre: { fontFamily: letras.texto, fontSize: 14, lineHeight: 16.8, color: colores.pergamino },
  datoOrigen: { fontFamily: letras.texto, fontSize: 11, lineHeight: 13.75, color: 'rgba(239, 230, 207, 0.48)' },
  datoValor: { flexShrink: 0, maxWidth: '55%', textAlign: 'right', fontFamily: letras.texto, fontSize: 14, lineHeight: 16.8, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  faltas: { gap: 8 },
  falta: { flexDirection: 'row', gap: 10, paddingHorizontal: 4 },
  rombo: { width: 5, height: 5, marginTop: 8, marginLeft: 3, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro, boxShadow: '0 0 6px rgba(246, 227, 166, 0.6)' },
  faltaTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.82)' },
  como: { marginHorizontal: 4, marginBottom: 12, gap: 3 },
  comoTitulo: { fontFamily: letras.textoMedio, fontSize: 13.5, color: colores.pergamino },
  comoTexto: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.68)' },
  pie: { marginTop: 6, marginHorizontal: 4, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.55)' },
});
