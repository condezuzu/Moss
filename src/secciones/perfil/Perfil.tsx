// Perfil, la última sección (antes Ajustes), la de la galería (galeria/src/perfil.js): tus datos,
// las preferencias, Salud y Ascent, y tus datos para llevar o borrar, con los créditos de lo que usa
// Moss. Las metas están en Progreso, con la estrategia.

import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { CM_POR_PULGADA } from '@/dominio/cantidades';
import { edadDe, type Actividad, type Perfil as DatosDelPerfil, type Sexo } from '@/dominio/metas';
import { haySalud, pedirPermisos, saludPedida } from '@/salud/salud';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Boton, Icono } from '../comida/comunes';
import { numero, sistemaDe, useEstado } from '../comida/datos';
import { avisar } from '../comida/registro';
import { Opcion } from '../entrada/piezas';
import { HojaModal } from '../HojaModal';
import { Cabecera, EtiquetaDeGrupo, Parrafo, Segmento } from '../tarjetas';
import { borrarLaCuenta, borrarMisDatos, cerrarSesion, correoDeLaCuenta, exportarTodo } from './cuenta';

type Fila = { clave: string; titulo: string; valor?: string; alTocar?: () => void; tipo?: 'ok' | 'peligro' | 'accion' };

export function PaginaDePerfil({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  const sistema = sistemaDe(e);
  const [correo, setCorreo] = useState<string | null>(null);
  const [salud, setSalud] = useState(false);
  const [hoja, setHoja] = useState<'datos' | 'privacidad' | null>(null);
  useEffect(() => {
    correoDeLaCuenta().then(setCorreo).catch(() => {});
    saludPedida().then(setSalud).catch(() => {});
  }, []);

  const p = e.perfil;
  const altura = (cm: number) => (sistema === 'imperial' ? `${Math.floor(cm / CM_POR_PULGADA / 12)}′ ${Math.round(cm / CM_POR_PULGADA) % 12}″` : `${numero(cm)} cm`);
  const confirmar = (titulo: string, texto: string, accion: () => Promise<boolean | void>) =>
    Alert.alert(titulo, texto, [
      { text: t('comun.cancelar'), style: 'cancel' },
      { text: t('perfil.borrar'), style: 'destructive', onPress: () => { accion().then((ok) => ok === false && avisar(t('perfil.errorBorrar'))).catch(() => avisar(t('perfil.errorBorrar'))); } },
    ]);

  const grupos: [string, Fila[]][] = [
    ['perfil.tusDatos', p ? [
      { clave: 'sexo', titulo: t('perfil.sexo'), valor: t(`perfil.sexos.${p.sexo}`), alTocar: () => setHoja('datos') },
      { clave: 'edad', titulo: t('perfil.edad'), valor: t('perfil.anios', { n: edadDe(p, e.hoy) }), alTocar: () => setHoja('datos') },
      { clave: 'altura', titulo: t('perfil.altura'), valor: altura(p.alturaCm), alTocar: () => setHoja('datos') },
      { clave: 'actividad', titulo: t('perfil.actividad'), valor: t(`perfil.actividades.${p.actividad}`), alTocar: () => setHoja('datos') },
    ] : []],
    ['perfil.preferencias', [
      { clave: 'unidades', titulo: t('perfil.unidades'), valor: t(sistema === 'imperial' ? 'perfil.imperial' : 'perfil.metrico'), alTocar: () => elAlmacen().ponerSistema(sistema === 'imperial' ? 'metrico' : 'imperial') },
      // El idioma es el del teléfono: iOS deja elegir otro solo para Moss, en sus Ajustes.
      { clave: 'idioma', titulo: t('perfil.idioma'), valor: t('perfil.idiomaDelTelefono'), alTocar: () => { Linking.openSettings().catch(() => {}); } },
    ]],
    ['perfil.conexiones', [
      ...(haySalud() ? [{
        clave: 'salud', titulo: t('perfil.salud'), valor: salud ? t('perfil.conectada') : t('perfil.conectar'), tipo: salud ? 'ok' as const : 'accion' as const,
        alTocar: () => {
          pedirPermisos().then((si) => {
            setSalud(si);
            if (si) actualizarSalud().catch(() => {});
          }).catch(() => {});
        },
      }] : []),
      { clave: 'ascent', titulo: t('perfil.ascent'), valor: t('perfil.pronto') },
    ]],
    ['perfil.tusDatosParaLlevar', [
      { clave: 'exportar', titulo: t('perfil.exportar'), valor: 'CSV', alTocar: () => { exportarTodo(e.hoy).catch(() => avisar(t('perfil.errorBorrar'))); } },
      { clave: 'privacidad', titulo: t('perfil.privacidad'), alTocar: () => setHoja('privacidad') },
      { clave: 'borrarDatos', titulo: t('perfil.borrarDatos'), tipo: 'peligro', alTocar: () => confirmar(t('perfil.borrarDatosTitulo'), t('perfil.borrarDatosTexto'), borrarMisDatos) },
      ...(correo !== null ? [{ clave: 'borrarCuenta', titulo: t('perfil.borrarCuenta'), tipo: 'peligro' as const, alTocar: () => confirmar(t('perfil.borrarCuentaTitulo'), t('perfil.borrarCuentaTexto'), borrarLaCuenta) }] : []),
    ]],
  ];
  const version = `${Constants.expoConfig?.version ?? '1.0.0'} (${Constants.expoConfig?.ios?.buildNumber ?? '1'})`;

  return (
    <View style={{ width: ancho }}>
      <ScrollView contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }} showsVerticalScrollIndicator={false}>
        <Cabecera fecha={t('perfil.cuentaTexto')} titulo={t('perfil.titulo')} />
        <View style={st.cuenta}>
          <View style={st.inicial}>
            <Text style={st.inicialTexto}>{(correo || 'M').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={st.correo} numberOfLines={1}>{correo || t('perfil.sinCuenta')}</Text>
        </View>
        {grupos.filter(([, filas]) => filas.length).map(([titulo, filas]) => (
          <View key={titulo}>
            <Text style={st.grupo}>{t(titulo as 'perfil.tusDatos')}</Text>
            <View style={st.lista}>
              {filas.map((f, i) => (
                <Pressable
                  key={f.clave}
                  onPress={f.alTocar}
                  disabled={!f.alTocar}
                  style={({ pressed }) => [st.fila, i > 0 && st.filaSeparada, pressed && { opacity: 0.7 }]}
                  accessibilityRole={f.alTocar ? 'button' : 'text'}
                >
                  <Text style={[st.filaTitulo, f.tipo === 'peligro' && st.peligro]}>{f.titulo}</Text>
                  {f.valor ? <Text style={[st.filaValor, f.tipo === 'ok' && { color: colores.salvia }, f.tipo === 'accion' && { color: colores.oroClaro }]}>{f.valor}</Text> : null}
                  {f.alTocar && f.tipo !== 'peligro' ? <Icono nombre="chevron.right" tam={12} color="rgba(239, 230, 207, 0.4)" peso="semibold" /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text style={st.grupo}>{t('perfil.creditos')}</Text>
        <View style={st.lista}>
          {(['usda', 'off', 'taco', 'estrellas'] as const).map((f, i) => (
            <Text key={f} style={[st.credito, i > 0 && st.filaSeparada]}>{t(`perfil.fuentes.${f}`)}</Text>
          ))}
        </View>
        {correo !== null && (
          <Boton
            tipo="contorno"
            texto={t('perfil.cerrarSesion')}
            alTocar={() => Alert.alert(t('perfil.cerrarSesionTitulo'), t('perfil.cerrarSesionTexto'), [
              { text: t('comun.cancelar'), style: 'cancel' },
              { text: t('perfil.cerrarSesion'), style: 'destructive', onPress: () => { cerrarSesion().catch(() => {}); } },
            ])}
            estilo={st.salir}
          />
        )}
        <Text style={st.version}>{t('perfil.version', { v: version })}</Text>
      </ScrollView>
      {hoja === 'datos' && p && <TusDatos perfil={p} hoy={e.hoy} imperial={sistema === 'imperial'} alCerrar={() => setHoja(null)} />}
      {hoja === 'privacidad' && (
        <HojaModal abierta titulo={t('perfil.privacidad')} alCerrar={() => setHoja(null)}>
          {lista('perfil.privacidadTexto').map((parrafo) => <Parrafo key={parrafo}>{parrafo}</Parrafo>)}
        </HojaModal>
      )}
    </View>
  );
}

/** Tus datos: el sexo, la edad, la altura y la actividad. Las metas no cambian por esto. */
function TusDatos({ perfil, hoy, imperial, alCerrar }: { perfil: DatosDelPerfil; hoy: string; imperial: boolean; alCerrar: () => void }) {
  const [sexo, setSexo] = useState<Sexo>(perfil.sexo);
  const [edad, setEdad] = useState(edadDe(perfil, hoy));
  const [alturaCm, setAlturaCm] = useState(perfil.alturaCm);
  const [actividad, setActividad] = useState<Actividad>(perfil.actividad);
  const guardar = () => {
    elAlmacen().ponerDatos({ sexo, nacimiento: Number(hoy.slice(0, 4)) - edad, alturaCm, actividad });
    alCerrar();
  };
  const paso = imperial ? CM_POR_PULGADA : 1;
  const altura = imperial ? `${Math.floor(alturaCm / CM_POR_PULGADA / 12)}′ ${Math.round(alturaCm / CM_POR_PULGADA) % 12}″` : `${numero(alturaCm)} cm`;
  return (
    <HojaModal abierta titulo={t('perfil.tusDatos')} alCerrar={alCerrar} pie={<Boton tipo="principal" texto={t('comun.guardar')} alTocar={guardar} />}>
      <EtiquetaDeGrupo>{t('perfil.sexo')}</EtiquetaDeGrupo>
      <Segmento<Sexo> opciones={[['f', t('perfil.sexos.f')], ['m', t('perfil.sexos.m')]]} elegida={sexo} alElegir={setSexo} />
      <EtiquetaDeGrupo>{t('perfil.edad')}</EtiquetaDeGrupo>
      <Pasos valor={t('perfil.anios', { n: edad })} alBajar={() => setEdad((x) => Math.max(14, x - 1))} alSubir={() => setEdad((x) => Math.min(100, x + 1))} />
      <EtiquetaDeGrupo>{t('perfil.altura')}</EtiquetaDeGrupo>
      <Pasos valor={altura} alBajar={() => setAlturaCm((x) => Math.max(100, Math.round((x - paso) * 10) / 10))} alSubir={() => setAlturaCm((x) => Math.min(250, Math.round((x + paso) * 10) / 10))} />
      <EtiquetaDeGrupo>{t('perfil.actividad')}</EtiquetaDeGrupo>
      <View style={{ gap: 8 }}>
        {(['poco', 'algo', 'activo', 'muy'] as const).map((a) => {
          const [titulo, detalle] = lista(`entrada.cuestionario.actividad.${a}`);
          return <Opcion key={a} titulo={titulo} detalle={detalle} elegida={a === actividad} alTocar={() => setActividad(a)} />;
        })}
      </View>
      <Parrafo chico>{t('perfil.tusDatosNota')}</Parrafo>
    </HojaModal>
  );
}

function Pasos({ valor, alBajar, alSubir }: { valor: string; alBajar: () => void; alSubir: () => void }) {
  return (
    <View style={st.pasos}>
      <Pressable onPress={alBajar} style={st.paso} accessibilityRole="button" accessibilityLabel="−" hitSlop={6}>
        <Icono nombre="minus" tam={16} peso="semibold" />
      </Pressable>
      <Text style={st.pasoValor}>{valor}</Text>
      <Pressable onPress={alSubir} style={st.paso} accessibilityRole="button" accessibilityLabel="+" hitSlop={6}>
        <Icono nombre="plus" tam={16} peso="semibold" />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  cuenta: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inicial: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.45)', backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  inicialTexto: { fontFamily: letras.numeroMedio, fontSize: 20, color: colores.oroClaro },
  correo: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  grupo: { marginTop: 26, marginBottom: 8, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  lista: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.72)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 16 },
  filaSeparada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  filaTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  filaValor: { fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)' },
  peligro: { color: '#f0a58a' },
  credito: { paddingVertical: 12, paddingHorizontal: 16, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.65)' },
  salir: { marginTop: 26 },
  version: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.4)' },
  pasos: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 96, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
});
