// Perfil, la última sección (antes Ajustes), la de la galería (galeria/src/perfil.js): tus datos
// (con «sin déficit»), las preferencias (con ocultar los números), Salud, los aparatos y Ascent, y
// tus datos para llevar o borrar, con la política de privacidad, los términos, el contacto y los
// créditos de lo que usa Moss. Las metas están en Progreso, con la estrategia.

import Constants from 'expo-constants';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { CONEXION_CON_ASCENT } from '@/lib/ascent';
import { urlDe } from '@/lib/sitio';
import type { Calidad } from '@/cielo/mundo';
import { CM_POR_PULGADA } from '@/dominio/cantidades';
import type { Comida } from '@/dominio/comidas';
import { edadDe, RANGOS_DEL_CUESTIONARIO, type Actividad, type Perfil as DatosDelPerfil, type Sexo } from '@/dominio/metas';
import { pedirPermisoDeAvisos } from '@/recordatorios/programar';
import { haySalud, pedirPermisos, saludPedida } from '@/salud/salud';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Boton, Icono, Pastilla } from '../comida/comunes';
import { numero, sistemaDe, useEstado } from '../comida/datos';
import { avisar } from '../comida/registro';
import { Opcion } from '../entrada/piezas';
import { HojaModal } from '../HojaModal';
import { aparatoPrincipal, Aparatos } from './Aparatos';
import { Aparece, EtiquetaDeGrupo, Parrafo, Segmento } from '../tarjetas';
import { borrarLaCuenta, borrarMisDatos, cerrarSesion, correoDeLaCuenta, exportarTodo } from './cuenta';

/** Una fila; `detalle` dice debajo, chico, qué hace. */
type Fila = { clave: string; titulo: string; valor?: string; detalle?: string; alTocar?: () => void; tipo?: 'ok' | 'peligro' | 'accion' };

/** Lo que anda solo con las dos apps vinculadas (antes en la sección de Ascent). */
const FUNCIONES_CON_ASCENT: { clave: 'peso' | 'calorias' | 'objetivo' | 'cuenta' | 'proteina' | 'gimnasio'; icono: SFSymbol }[] = [
  { clave: 'peso', icono: 'scalemass' },
  { clave: 'calorias', icono: 'bolt' },
  { clave: 'objetivo', icono: 'target' },
  { clave: 'cuenta', icono: 'person.2' },
  { clave: 'proteina', icono: 'dumbbell' },
  { clave: 'gimnasio', icono: 'star' },
];

export function PaginaDePerfil({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  const sistema = sistemaDe(e);
  const [correo, setCorreo] = useState<string | null>(null);
  const [salud, setSalud] = useState(false);
  const [hoja, setHoja] = useState<'datos' | 'privacidad' | 'recordatorios' | 'calidad' | 'aparatos' | null>(null);
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
      // Sin déficit: embarazo, lactancia o una condición médica (no se guarda cuál). Cambia la meta desde hoy.
      {
        clave: 'cuidado', titulo: t('perfil.cuidado'), valor: t(p.sinDeficit ? 'perfil.sinDeficit' : 'perfil.ninguno'), tipo: p.sinDeficit ? 'ok' as const : undefined,
        detalle: p.sinDeficit ? t('perfil.sinDeficitTexto') : undefined, alTocar: () => elAlmacen().ponerEstrategia({ sinDeficit: !p.sinDeficit }),
      },
    ] : []],
    ['perfil.preferencias', [
      { clave: 'unidades', titulo: t('perfil.unidades'), valor: t(sistema === 'imperial' ? 'perfil.imperial' : 'perfil.metrico'), alTocar: () => elAlmacen().ponerSistema(sistema === 'imperial' ? 'metrico' : 'imperial') },
      // El idioma es el del teléfono: iOS deja elegir otro solo para Moss, en sus Ajustes.
      { clave: 'idioma', titulo: t('perfil.idioma'), valor: t('perfil.idiomaDelTelefono'), alTocar: () => { Linking.openSettings().catch(() => {}); } },
      { clave: 'calidad', titulo: t('perfil.calidad'), valor: t(`perfil.calidades.${e.calidad ?? 'automatica'}`), alTocar: () => setHoja('calidad') },
      { clave: 'recordatorios', titulo: t('perfil.recordatorios'), valor: e.recordatorios?.length ? t('perfil.encendidos') : t('perfil.apagados'), alTocar: () => setHoja('recordatorios') },
      { clave: 'numeros', titulo: t('perfil.numeros'), valor: t(e.numeros ? 'perfil.visibles' : 'perfil.ocultos'), detalle: t('perfil.numerosTexto'), alTocar: () => elAlmacen().ponerNumeros(!e.numeros) },
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
      { clave: 'aparatos', titulo: t('perfil.aparatos.titulo'), valor: aparatoPrincipal(e.salud?.aparatos ?? []), alTocar: () => setHoja('aparatos') },
      // Ascent no se nombra hasta que la conexión funcione (src/lib/ascent.ts).
      ...(CONEXION_CON_ASCENT ? [{ clave: 'ascent', titulo: t('perfil.ascent'), valor: t('perfil.pronto') }] : []),
    ]],
    ['perfil.tusDatosParaLlevar', [
      { clave: 'exportar', titulo: t('perfil.exportar'), valor: 'CSV', alTocar: () => { exportarTodo(e.hoy).catch(() => avisar(t('perfil.errorBorrar'))); } },
      { clave: 'privacidad', titulo: t('perfil.privacidad'), alTocar: () => setHoja('privacidad') },
      // Sin la cuenta, y solo si se elige (guía 5.1.1 de Apple): src/almacen/buzon.ts.
      {
        clave: 'mejorarBase', titulo: t('perfil.mejorarBase'), valor: t(e.mandarBusquedas ? 'perfil.si' : 'perfil.no'), detalle: t('perfil.mejorarBaseTexto'),
        alTocar: () => elAlmacen().ponerMandarBusquedas(!e.mandarBusquedas),
      },
      { clave: 'politica', titulo: t('perfil.politica'), alTocar: () => { Linking.openURL(urlDe('privacidad')).catch(() => {}); } },
      { clave: 'terminos', titulo: t('perfil.terminos'), alTocar: () => { Linking.openURL(urlDe('terminos')).catch(() => {}); } },
      { clave: 'contacto', titulo: t('perfil.contacto'), alTocar: () => { Linking.openURL(urlDe('contacto')).catch(() => {}); } },
      { clave: 'borrarDatos', titulo: t('perfil.borrarDatos'), tipo: 'peligro', alTocar: () => confirmar(t('perfil.borrarDatosTitulo'), t('perfil.borrarDatosTexto'), borrarMisDatos) },
      ...(correo !== null ? [{ clave: 'borrarCuenta', titulo: t('perfil.borrarCuenta'), tipo: 'peligro' as const, alTocar: () => confirmar(t('perfil.borrarCuentaTitulo'), t('perfil.borrarCuentaTexto'), borrarLaCuenta) }] : []),
    ]],
  ];
  const version = `${Constants.expoConfig?.version ?? '1.0.0'} (${Constants.expoConfig?.ios?.buildNumber ?? '1'})`;

  return (
    <View style={{ width: ancho }}>
      <ScrollView contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }} showsVerticalScrollIndicator={false}>
        {/* Como en la galería: la inicial en oro y la cuenta. */}
        <View style={st.cuenta} accessibilityRole="header">
          <View style={st.inicial}>
            <Text style={st.inicialTexto}>{(correo || 'M').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={st.correo} numberOfLines={1} ellipsizeMode="middle">{correo || t('perfil.sinCuenta')}</Text>
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
                  <View style={st.filaTextos}>
                    <Text style={[st.filaTitulo, f.tipo === 'peligro' && st.peligro]}>{f.titulo}</Text>
                    {f.detalle ? <Aparece><Text style={st.filaDetalle}>{f.detalle}</Text></Aparece> : null}
                  </View>
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
        {/* Al final, lo que anda solo si vinculas Ascent: información, no una función de Perfil. */}
        {CONEXION_CON_ASCENT && <>
        <Text style={st.grupo}>{t('perfil.informacion')}</Text>
        <Text style={st.informacion}>{t('perfil.informacionAscent')}</Text>
        <View style={st.lista}>
          {FUNCIONES_CON_ASCENT.map((f, i) => (
            <View key={f.clave} style={[st.funcion, i > 0 && st.filaSeparada]}>
              <Icono nombre={f.icono} tam={18} color="rgba(239, 230, 207, 0.6)" peso="light" />
              <View style={{ flex: 1 }}>
                <Text style={st.funcionTitulo}>{t(`ascent.funciones.${f.clave}.titulo`)}</Text>
                <Text style={st.funcionTexto}>{t(`ascent.funciones.${f.clave}.texto`)}</Text>
              </View>
            </View>
          ))}
        </View>
        </>}
        {correo !== null && (
          <Aparece>
          <Boton
            tipo="contorno"
            texto={t('perfil.cerrarSesion')}
            alTocar={() => Alert.alert(t('perfil.cerrarSesionTitulo'), t('perfil.cerrarSesionTexto'), [
              { text: t('comun.cancelar'), style: 'cancel' },
              { text: t('perfil.cerrarSesion'), style: 'destructive', onPress: () => { cerrarSesion().catch(() => {}); } },
            ])}
            estilo={st.salir}
          />
          </Aparece>
        )}
        <Text style={st.version}>{t('perfil.version', { v: version })}</Text>
      </ScrollView>
      {hoja === 'datos' && p && <TusDatos perfil={p} hoy={e.hoy} imperial={sistema === 'imperial'} alCerrar={() => setHoja(null)} />}
      {hoja === 'recordatorios' && <Recordatorios comidas={e.recordatorios} alCerrar={() => setHoja(null)} />}
      {hoja === 'calidad' && <CalidadDelCielo elegida={e.calidad} alCerrar={() => setHoja(null)} />}
      {hoja === 'aparatos' && <Aparatos alCerrar={() => setHoja(null)} />}
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
      <Pasos valor={t('perfil.anios', { n: edad })} alBajar={() => setEdad((x) => Math.max(RANGOS_DEL_CUESTIONARIO.edad[0], x - 1))} alSubir={() => setEdad((x) => Math.min(RANGOS_DEL_CUESTIONARIO.edad[1], x + 1))} />
      <EtiquetaDeGrupo>{t('perfil.altura')}</EtiquetaDeGrupo>
      <Pasos valor={altura} alBajar={() => setAlturaCm((x) => Math.max(RANGOS_DEL_CUESTIONARIO.alturaCm[0], Math.round((x - paso) * 10) / 10))} alSubir={() => setAlturaCm((x) => Math.min(RANGOS_DEL_CUESTIONARIO.alturaCm[1], Math.round((x + paso) * 10) / 10))} />
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

/** La calidad de las animaciones: la automática (según el iPhone, y baja sola si hace falta) o una fija. */
function CalidadDelCielo({ elegida, alCerrar }: { elegida: Calidad | null; alCerrar: () => void }) {
  return (
    <HojaModal abierta titulo={t('perfil.calidad')} alCerrar={alCerrar}>
      <View style={{ gap: 8 }}>
        {([null, 'alta', 'media', 'baja'] as const).map((c) => (
          <Opcion key={c ?? 'automatica'} titulo={t(`perfil.calidades.${c ?? 'automatica'}`)} elegida={c === elegida} alTocar={() => elAlmacen().ponerCalidad(c)} />
        ))}
      </View>
      <Parrafo chico>{t('perfil.calidadTexto')}</Parrafo>
    </HojaModal>
  );
}

const COMIDAS_QUE_AVISAN: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

/** Los recordatorios para anotar: encendidos o no, y de qué comidas. */
function Recordatorios({ comidas, alCerrar }: { comidas: Comida[] | null; alCerrar: () => void }) {
  const [sinPermiso, setSinPermiso] = useState(false);
  const encender = (si: boolean) => {
    if (!si) {
      elAlmacen().ponerRecordatorios(null);
      return;
    }
    pedirPermisoDeAvisos().then((ok) => {
      setSinPermiso(!ok);
      if (ok) elAlmacen().ponerRecordatorios(['desayuno', 'almuerzo', 'cena']);
    }).catch(() => setSinPermiso(true));
  };
  const alternar = (c: Comida) => {
    const lista = comidas ?? [];
    const nueva = lista.includes(c) ? lista.filter((x) => x !== c) : COMIDAS_QUE_AVISAN.filter((x) => x === c || lista.includes(x));
    elAlmacen().ponerRecordatorios(nueva.length ? nueva : null);
  };
  return (
    <HojaModal abierta titulo={t('perfil.recordatorios')} alCerrar={alCerrar}>
      <View style={st.llave}>
        <Text style={st.llaveTexto}>{t('perfil.recordatoriosLlave')}</Text>
        <Switch
          value={!!comidas?.length}
          onValueChange={encender}
          trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }}
          thumbColor={colores.pergamino}
          accessibilityLabel={t('perfil.recordatoriosLlave')}
        />
      </View>
      <Parrafo chico>{t('perfil.recordatoriosTexto')}</Parrafo>
      {sinPermiso && (
        <Aparece>
          <Pressable onPress={() => { Linking.openSettings().catch(() => {}); }} accessibilityRole="button">
            <Parrafo>{t('perfil.recordatoriosSinPermiso')}</Parrafo>
          </Pressable>
        </Aparece>
      )}
      {!!comidas?.length && (
        <Aparece>
          <EtiquetaDeGrupo>{t('perfil.recordatoriosComidas')}</EtiquetaDeGrupo>
          <View style={st.comidas}>
            {COMIDAS_QUE_AVISAN.map((c) => <Pastilla key={c} texto={t(`comida.comidas.${c}`)} elegida={comidas.includes(c)} alTocar={() => alternar(c)} />)}
          </View>
        </Aparece>
      )}
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

const ORO_DE_LA_INICIAL = 'linear-gradient(160deg, #fdeebf 0%, #e8c46a 72%)';

const st = StyleSheet.create({
  cuenta: { marginTop: 10, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 14 },
  inicial: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.oro,
    ...((Platform.OS === 'web' ? { backgroundImage: ORO_DE_LA_INICIAL } : { experimental_backgroundImage: ORO_DE_LA_INICIAL }) as ViewStyle),
  },
  inicialTexto: { fontFamily: letras.numero, fontSize: 24, color: '#1a1406' },
  correo: { flex: 1, fontFamily: letras.numeroMedio, fontSize: 20, color: colores.pergamino },
  grupo: { marginTop: 26, marginBottom: 8, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  lista: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.72)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 16 },
  filaSeparada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  filaTextos: { flex: 1, paddingVertical: 12 },
  filaTitulo: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  filaDetalle: { marginTop: 4, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.5)' },
  filaValor: { fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)' },
  peligro: { color: '#f0a58a' },
  informacion: { marginBottom: 10, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  funcion: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16 },
  funcionTitulo: { fontFamily: letras.texto, fontSize: 14.5, color: colores.pergamino },
  funcionTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  credito: { paddingVertical: 12, paddingHorizontal: 16, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.65)' },
  salir: { marginTop: 26 },
  version: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.4)' },
  llave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  llaveTexto: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  comidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pasos: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 96, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
});
