// La entrada a la app, la de la galería (galeria/src/entrada.js): la frase de apertura, dos
// diapositivas, tus datos (qué se guarda y el consentimiento para los datos de salud), la cuenta y
// el cuestionario que arma la meta inicial de comida, con lo que cuida: mayores de 18 y sin déficit
// en el embarazo, la lactancia o con una condición médica. Cada pantalla tiene
// su lugar en el cielo: la cámara sube a medida que se avanza. La frase y las diapositivas no se
// saltean: el botón se llena en 2,5 s. Al final la cámara baja hasta hoy, se guardan las respuestas
// (el perfil, el peso de hoy y la meta) y aparece Inicio.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { buscarConstelacion } from '@/datos/catalogo';
import { CM_POR_PULGADA, KG_POR_LIBRA } from '@/dominio/cantidades';
import { edadDe, MAYORIA_DE_EDAD, metasIniciales, RANGOS_DEL_CUESTIONARIO, RITMOS, type Actividad, type Objetivo, type Ritmo, type Sexo } from '@/dominio/metas';
import { urlDe } from '@/lib/sitio';
import { haySupabase } from '@/lib/supabase';
import { datosDelCuestionario, haySalud, pedirPermisos } from '@/salud/salud';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { COLOR_DE_MACRO, Icono, MACROS } from '../comida/comunes';
import { numero, sistemaDe, useEstado } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { MiniCielo } from '../graficos/Graficos';
import { crearCuenta, entrarConApple, entrarConCorreo, hayApple, olvideLaClave, type ErrorDeCuenta, type Resultado } from './cuenta';
import { Anillos } from './Lienzos';
import { Boton, Chispas, Circulo, Deslizador, Opcion } from './piezas';

type Paso = 'frase' | 'habitos' | 'comida' | 'datos' | 'cuenta' | 'salud' | 'edad' | 'sexo' | 'altura' | 'peso' | 'actividad' | 'cuidado' | 'objetivo' | 'resultado';

/** Cada pantalla y dónde queda la cámara: sube a medida que se avanza, como en la galería. */
const PASOS: readonly { id: Paso; camara: number }[] = [
  { id: 'frase', camara: 0 },
  { id: 'habitos', camara: 0.42 },
  { id: 'comida', camara: 0.8 },
  { id: 'datos', camara: 0.98 },
  { id: 'cuenta', camara: 1.08 },
  { id: 'salud', camara: 1.16 },
  { id: 'edad', camara: 1.19 },
  { id: 'sexo', camara: 1.22 },
  { id: 'altura', camara: 1.25 },
  { id: 'peso', camara: 1.28 },
  { id: 'actividad', camara: 1.31 },
  { id: 'cuidado', camara: 1.325 },
  { id: 'objetivo', camara: 1.34 },
  { id: 'resultado', camara: 1.37 },
];
const CUESTIONARIO: readonly Paso[] = ['salud', 'edad', 'sexo', 'altura', 'peso', 'actividad', 'cuidado', 'objetivo'];

/** Embarazo o lactancia, una condición médica o nada: de eso solo se guarda si va sin déficit. */
type Caso = 'nada' | 'embarazo' | 'condicion';
type Respuestas = { edad: number; sexo: Sexo | null; alturaCm: number; pesoKg: number; actividad: Actividad; objetivo: Objetivo; ritmo: Ritmo; caso: Caso };
const DE_FABRICA: Respuestas = { edad: 29, sexo: null, alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', caso: 'nada' };
type DeSalud = ReadonlySet<'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>;
/** Lo que deja cada pantalla arriba, debajo del borde del teléfono. */
const ARRIBA = 28;

type Retomar = { i: number; r: Respuestas; deSalud: DeSalud };

function avanceInicial(): Retomar {
  const e = elAlmacen().estado();
  const a = e.avanceDeEntrada as { i?: unknown; r?: Partial<Respuestas>; deSalud?: unknown } | null;
  if (a && typeof a.i === 'number' && a.i >= 0 && a.i < PASOS.length && a.r) {
    return { i: a.i, r: { ...DE_FABRICA, ...a.r }, deSalud: new Set(Array.isArray(a.deSalud) ? a.deSalud : []) as DeSalud };
  }
  const p = e.perfil;
  const peso = e.pesos[e.pesos.length - 1]?.kg;
  const r: Respuestas = p
    ? { ...DE_FABRICA, edad: edadDe(p, e.hoy), sexo: p.sexo, alturaCm: p.alturaCm, actividad: p.actividad, objetivo: p.objetivo, ritmo: p.ritmo, caso: p.sinDeficit ? 'condicion' : 'nada', ...(peso ? { pesoKg: peso } : {}) }
    : DE_FABRICA;
  return { i: 0, r, deSalud: new Set() };
}

export function Entrada({ camara, alTerminar }: { camara: SharedValue<number>; alTerminar?: () => void }) {
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  // Se retoma donde quedó; si la cuenta ya tenía un perfil, sus respuestas vienen llenas.
  const [inicio] = useState(() => avanceInicial());
  const [i, setI] = useState(inicio.i);
  const [r, setR] = useState<Respuestas>(inicio.r);
  const [deSalud, setDeSalud] = useState<DeSalud>(inicio.deSalud);
  const [saliendo, setSaliendo] = useState(false);
  const paso = PASOS[i];

  useEffect(() => {
    if (!saliendo) elAlmacen().ponerAvanceDeEntrada({ i, r, deSalud: [...deSalud] });
  }, [i, r, deSalud, saliendo]);

  useEffect(() => {
    camara.set(paso.camara);
  }, [camara, paso.camara]);

  const siguiente = () => setI((x) => Math.min(PASOS.length - 1, x + 1));
  const poner = <K extends keyof Respuestas>(clave: K, valor: Respuestas[K]) => {
    setR((antes) => ({ ...antes, [clave]: valor }));
    // Lo que se cambia a mano ya no es de Salud.
    setDeSalud((antes) => {
      if (!antes.has(clave as never)) return antes;
      const nuevo = new Set(antes);
      nuevo.delete(clave as never);
      return nuevo;
    });
  };

  // El final: la cámara baja hasta hoy, la entrada se apaga y se guarda todo; con el perfil
  // guardado, Secciones deja la entrada y aparece Inicio.
  const terminar = () => {
    if (saliendo || !r.sexo) return;
    setSaliendo(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    camara.set(0);
    const sexo = r.sexo;
    const { caso, ...respuestas } = r;
    setTimeout(() => {
      elAlmacen().responderCuestionario({ ...respuestas, sexo, sinDeficit: caso !== 'nada' }, deSalud.has('pesoKg') ? 'salud' : 'manual');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alTerminar?.();
    }, reducido ? 200 : 1100);
  };

  const estiloSalida = useAnimatedStyle(() => ({
    opacity: withTiming(saliendo ? 0 : 1, { duration: 700 }),
    transform: [{ scale: withTiming(saliendo ? 1.06 : 1, { duration: 900 }) }],
  }));

  const enCuestionario = CUESTIONARIO.indexOf(paso.id);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estiloSalida]} pointerEvents={saliendo ? 'none' : 'box-none'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View key={paso.id} entering={FadeInDown.delay(i === 0 ? 120 : 280).duration(620)} exiting={FadeOut.duration(320)} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[s.pantalla, { paddingTop: insets.top + ARRIBA, paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {enCuestionario >= 0 && <Avance n={enCuestionario + 1} total={CUESTIONARIO.length} />}
            {paso.id === 'frase' && <Frase alSeguir={siguiente} reducido={reducido} />}
            {paso.id === 'habitos' && <Diapositiva titulo={t('entrada.habitosTitulo')} texto={t('entrada.habitosTexto')} alSeguir={siguiente} reducido={reducido}><Casiopea reducido={reducido} /></Diapositiva>}
            {paso.id === 'comida' && <Diapositiva titulo={t('entrada.comidaTitulo')} texto={t('entrada.comidaTexto')} alSeguir={siguiente} reducido={reducido}><LunaQueSeLlena reducido={reducido} /></Diapositiva>}
            {paso.id === 'datos' && <TusDatos alSeguir={siguiente} />}
            {paso.id === 'cuenta' && <Cuenta alEntrar={siguiente} />}
            {paso.id === 'salud' && (
              <Salud
                alSeguir={siguiente}
                alLeer={(d) => {
                  setR((antes) => ({ ...antes, ...d }));
                  setDeSalud(new Set(Object.keys(d) as ('edad' | 'sexo' | 'alturaCm' | 'pesoKg')[]));
                }}
              />
            )}
            {paso.id === 'edad' && (deSalud.has('edad') && r.edad < MAYORIA_DE_EDAD ? <Menor /> : (
              <Numero titulo={t('entrada.cuestionario.edadTitulo')} valor={Math.max(r.edad, RANGOS_DEL_CUESTIONARIO.edad[0])} min={RANGOS_DEL_CUESTIONARIO.edad[0]} max={RANGOS_DEL_CUESTIONARIO.edad[1]} paso={1} decimales={0} unidad={t('entrada.cuestionario.anos')} deSalud={deSalud.has('edad')} alCambiar={(v) => poner('edad', v)} alSeguir={() => { poner('edad', Math.max(r.edad, RANGOS_DEL_CUESTIONARIO.edad[0])); siguiente(); }} />
            ))}
            {paso.id === 'sexo' && <ElSexo sexo={r.sexo} deSalud={deSalud.has('sexo')} alElegir={(v) => poner('sexo', v)} alSeguir={siguiente} />}
            {paso.id === 'altura' && <Altura cm={r.alturaCm} deSalud={deSalud.has('alturaCm')} alCambiar={(v) => poner('alturaCm', v)} alSeguir={siguiente} />}
            {paso.id === 'peso' && <Peso kg={r.pesoKg} deSalud={deSalud.has('pesoKg')} alCambiar={(v) => poner('pesoKg', v)} alSeguir={siguiente} />}
            {paso.id === 'actividad' && <LaActividad actividad={r.actividad} alElegir={(v) => poner('actividad', v)} alSeguir={siguiente} />}
            {paso.id === 'cuidado' && <Cuidado sexo={r.sexo} caso={r.caso} alElegir={(v) => poner('caso', v)} alSeguir={siguiente} />}
            {paso.id === 'objetivo' && (
              <ElObjetivo
                objetivo={r.caso !== 'nada' && r.objetivo === 'bajar' ? 'mantener' : r.objetivo}
                ritmo={r.ritmo}
                sinDeficit={r.caso !== 'nada'}
                alObjetivo={(v) => poner('objetivo', v)}
                alRitmo={(v) => poner('ritmo', v)}
                alSeguir={() => {
                  if (r.caso !== 'nada' && r.objetivo === 'bajar') poner('objetivo', 'mantener');
                  siguiente();
                }}
              />
            )}
            {paso.id === 'resultado' && <ElResultado r={r} alEmpezar={terminar} reducido={reducido} />}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// Como en la galería, la frase, las diapositivas, la cuenta y el resultado van centrados; el cuestionario, a la izquierda.
const Titulo = ({ children, centrado }: { children: ReactNode; centrado?: boolean }) => <Text style={[s.titulo, centrado && s.centrado]} accessibilityRole="header">{children}</Text>;
const Texto = ({ children, centrado }: { children: ReactNode; centrado?: boolean }) => <Text style={[s.texto, centrado && s.centrado]}>{children}</Text>;
const Pie = ({ children }: { children: ReactNode }) => <View style={s.pie}>{children}</View>;
const Espacio = () => <View style={{ flex: 1, minHeight: 24 }} />;

/** La barra del cuestionario: cuánto falta. */
function Avance({ n, total }: { n: number; total: number }) {
  const lleno = useSharedValue((n - 1) / total);
  useEffect(() => {
    lleno.set(withTiming(n / total, { duration: 700 }));
  }, [lleno, n, total]);
  const estilo = useAnimatedStyle(() => ({ width: `${lleno.get() * 100}%` }));
  return (
    <View>
      <View style={s.avance}>
        <Animated.View style={[s.avanceLleno, estilo]} />
      </View>
      <Text style={s.paso}>{t('entrada.cuestionario.paso', { n, total })}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ la frase y las diapositivas
function Frase({ alSeguir, reducido }: { alSeguir: () => void; reducido: boolean }) {
  const palabras = t('entrada.frase').split(' ');
  const { height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <>
      {/* Como en la galería: la frase empieza cerca de la mitad del cielo. */}
      <View style={[s.frase, { marginTop: Math.max(40, alto * 0.45 - insets.top - ARRIBA) }]}>
        <View style={s.fraseTexto} accessible accessibilityLabel={t('entrada.frase')}>
          {palabras.map((p, k) => (
            <Animated.Text key={k} entering={reducido ? undefined : FadeIn.delay(350 + k * 75).duration(900)} style={s.palabra}>{p}</Animated.Text>
          ))}
        </View>
        <Animated.Text entering={reducido ? undefined : FadeIn.delay(1700).duration(1000)} style={s.autor}>{t('entrada.fraseAutor')}</Animated.Text>
      </View>
      <Espacio />
      <Circulo alTocar={alSeguir} reducido={reducido} />
    </>
  );
}

function Diapositiva({ titulo, texto, alSeguir, reducido, children }: { titulo: string; texto: string; alSeguir: () => void; reducido: boolean; children: ReactNode }) {
  return (
    <>
      <Titulo centrado>{titulo}</Titulo>
      <Texto centrado>{texto}</Texto>
      <View style={s.escenario}>{children}</View>
      <Circulo alTocar={alSeguir} reducido={reducido} />
    </>
  );
}

/** Casiopea, que se enciende sola, estrella por estrella. */
function Casiopea({ reducido }: { reducido: boolean }) {
  const { width } = useWindowDimensions();
  const constelacion = buscarConstelacion('cassiopeia');
  const total = constelacion.estrellas.length;
  const [encendidas, setEncendidas] = useState(reducido ? total : 0);
  useEffect(() => {
    if (reducido) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      setEncendidas(n);
      Haptics.selectionAsync().catch(() => {});
      if (n >= total) clearInterval(id);
    }, 420);
    return () => clearInterval(id);
  }, [reducido, total]);
  return <MiniCielo constelacion={constelacion} encendidas={constelacion.estrellas.map((_, k) => k < encendidas)} ancho={width - 52} alto={230} sinFondo />;
}

/** La luna de la comida: se llena con lo que comes, con un anillo por macro. */
function LunaQueSeLlena({ reducido }: { reducido: boolean }) {
  const [llena, setLlena] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLlena(true), 250);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={s.lunaGrande}>
      <Luna tam={118} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : 2000} />
      <Anillos tam={230} ms={reducido ? 0 : 2000} />
      <Chispas tam={230} reducido={reducido} />
    </View>
  );
}

// ------------------------------------------------------------------ la cuenta
function Cuenta({ alEntrar }: { alEntrar: () => void }) {
  const [apple, setApple] = useState(false);
  const [formulario, setFormulario] = useState(false);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<ErrorDeCuenta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => {
    hayApple().then(setApple).catch(() => {});
  }, []);
  const probar = async (accion: () => Promise<Resultado>, avisoSiSale?: string) => {
    setOcupado(true);
    setError(null);
    setAviso(null);
    const resultado = await accion();
    setOcupado(false);
    if (resultado.ok && avisoSiSale) setAviso(avisoSiSale);
    else if (resultado.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alEntrar();
    } else setError(resultado.error);
  };
  const sinCuenta = !haySupabase();
  return (
    <View style={s.cuenta}>
      <View style={s.marca} accessible accessibilityRole="header" accessibilityLabel="Moss">
        {'Moss'.split('').map((letra, k) => (
          <Animated.Text key={k} entering={FadeInDown.delay(150 + k * 120).duration(1100)} style={s.marcaLetra}>{letra}</Animated.Text>
        ))}
      </View>
      <Animated.Text entering={FadeIn.delay(800).duration(1000)} style={s.lema}>{t('entrada.cuenta.lema')}</Animated.Text>
      <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={s.botones}>
        {apple && !sinCuenta ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={25}
            style={s.apple}
            onPress={() => !ocupado && probar(entrarConApple)}
          />
        ) : (
          <Boton tipo="apple" texto={t('entrada.cuenta.apple')} alTocar={() => probar(entrarConApple)} desactivado={ocupado} icono={<Icono nombre="applelogo" tam={17} color="#000" />} />
        )}
        {!formulario ? (
          <Boton tipo="secundario" texto={t('entrada.cuenta.correo')} alTocar={() => setFormulario(true)} desactivado={ocupado} />
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={s.formulario}>
            <TextInput
              value={correo}
              onChangeText={setCorreo}
              placeholder={t('entrada.cuenta.correoCampo')}
              placeholderTextColor="rgba(239, 230, 207, 0.4)"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={s.campo}
            />
            <TextInput
              value={clave}
              onChangeText={setClave}
              placeholder={t('entrada.cuenta.claveCampo')}
              placeholderTextColor="rgba(239, 230, 207, 0.4)"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              style={s.campo}
            />
            <Boton texto={t('entrada.cuenta.entrar')} alTocar={() => probar(() => entrarConCorreo(correo, clave))} desactivado={ocupado} />
            <Boton tipo="secundario" texto={t('entrada.cuenta.crear')} alTocar={() => probar(() => crearCuenta(correo, clave))} desactivado={ocupado} />
            <Pressable onPress={() => probar(() => olvideLaClave(correo), t('entrada.cuenta.enviado'))} accessibilityRole="button" hitSlop={8}>
              <Text style={[s.chico, s.enlace]}>{t('entrada.cuenta.olvide')}</Text>
            </Pressable>
          </Animated.View>
        )}
        {error && <Text style={s.error} accessibilityLiveRegion="polite">{t(`entrada.cuenta.errores.${error}`)}</Text>}
        {aviso && <Text style={s.aviso} accessibilityLiveRegion="polite">{aviso}</Text>}
      </Animated.View>
      <Text style={[s.chico, s.legal]}>{t('entrada.cuenta.legal')}</Text>
      {sinCuenta && <Text style={[s.chico, s.legal]}>{t('entrada.cuenta.sinCuenta')}</Text>}
    </View>
  );
}

// ------------------------------------------------------------------ tus datos
/**
 * Antes de la cuenta: qué se guarda y dónde, y el consentimiento para los datos de salud (Ley 18.331
 * y la guía 5.1.1 de Apple). Mandar lo que no se encuentra es opcional y empieza apagado.
 */
function TusDatos({ alSeguir }: { alSeguir: () => void }) {
  const [mandar, setMandar] = useState(false);
  return (
    <>
      <Titulo>{t('entrada.datos.titulo')}</Titulo>
      <View style={s.datos}>
        {lista('entrada.datos.lineas').map((linea, k) => (
          <Animated.View key={linea} entering={FadeInDown.delay(150 + k * 120).duration(600)} style={s.datoFila}>
            <View style={s.datoPunto} />
            <Text style={s.datoTexto}>{linea}</Text>
          </Animated.View>
        ))}
      </View>
      <Texto>{t('entrada.datos.salud')}</Texto>
      <Pressable onPress={() => Linking.openURL(urlDe('privacidad')).catch(() => {})} accessibilityRole="link" hitSlop={8}>
        <Text style={[s.chico, s.enlace, s.izquierda]}>{t('entrada.datos.politica')}</Text>
      </Pressable>
      <View style={s.llave}>
        <View style={{ flex: 1 }}>
          <Text style={s.llaveTitulo}>{t('entrada.datos.busquedas')}</Text>
          <Text style={s.llaveTexto}>{t('entrada.datos.busquedasTexto')}</Text>
        </View>
        <Switch value={mandar} onValueChange={setMandar} trackColor={{ true: colores.salvia, false: 'rgba(239, 230, 207, 0.14)' }} accessibilityLabel={t('entrada.datos.busquedas')} />
      </View>
      <Espacio />
      <Pie>
        <Boton
          texto={t('entrada.datos.acepto')}
          alTocar={() => {
            elAlmacen().ponerMandarBusquedas(mandar);
            alSeguir();
          }}
        />
      </Pie>
    </>
  );
}

/** Menos de 18, según Salud: Moss no sigue (lo pediste el 22/10/2026). */
function Menor() {
  return (
    <View style={s.menor}>
      <Titulo centrado>{t('entrada.menor.titulo')}</Titulo>
      <Texto centrado>{t('entrada.menor.texto')}</Texto>
    </View>
  );
}

/** Embarazo o lactancia (solo se pregunta a las mujeres), una condición médica o nada. */
function Cuidado({ sexo, caso, alElegir, alSeguir }: { sexo: Sexo | null; caso: Caso; alElegir: (c: Caso) => void; alSeguir: () => void }) {
  const casos: { caso: Caso; titulo: string; detalle?: string }[] = [
    ...(sexo === 'f' ? [{ caso: 'embarazo' as const, titulo: t('entrada.cuidado.embarazo') }] : []),
    { caso: 'condicion', titulo: t('entrada.cuidado.condicion'), detalle: t('entrada.cuidado.condicionTexto') },
    { caso: 'nada', titulo: t('entrada.cuidado.nada') },
  ];
  return (
    <>
      <Titulo>{t('entrada.cuidado.titulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {casos.map((c) => <Opcion key={c.caso} titulo={c.titulo} detalle={c.detalle} elegida={c.caso === caso} alTocar={() => alElegir(c.caso)} />)}
      </View>
      {caso !== 'nada' && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          <Texto>{t('entrada.cuidado.aviso')}</Texto>
        </Animated.View>
      )}
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

// ------------------------------------------------------------------ el cuestionario
const ICONOS_DE_SALUD = ['figure.walk', 'moon.zzz', 'brain.head.profile', 'drop', 'scalemass'] as const;

function Salud({ alSeguir, alLeer }: { alSeguir: () => void; alLeer: (d: Partial<Pick<Respuestas, 'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>>) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const hay = haySalud();
  const conectar = async () => {
    setOcupado(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (await pedirPermisos()) {
      alLeer(await datosDelCuestionario());
      actualizarSalud().catch(() => {});
    }
    setOcupado(false);
    alSeguir();
  };
  return (
    <>
      <Titulo>{t('entrada.cuestionario.saludTitulo')}</Titulo>
      <Texto>{t('entrada.cuestionario.saludTexto')}</Texto>
      <View style={s.iconosDeSalud}>
        {ICONOS_DE_SALUD.map((nombre, k) => (
          <Animated.View key={nombre} entering={FadeIn.delay(200 + k * 160).duration(600)} style={s.iconoDeSalud}>
            <Icono nombre={nombre} tam={19} color="rgba(239, 230, 207, 0.55)" />
          </Animated.View>
        ))}
      </View>
      <Espacio />
      <Pie>
        {hay && <Boton texto={t('entrada.cuestionario.conectar')} alTocar={conectar} desactivado={ocupado} />}
        <Boton tipo={hay ? 'secundario' : 'principal'} texto={hay ? t('entrada.cuestionario.ahoraNo') : t('entrada.seguir')} alTocar={alSeguir} desactivado={ocupado} />
      </Pie>
    </>
  );
}

const ChipDeSalud = () => <Text style={s.deSalud}>{t('entrada.cuestionario.deSalud')}</Text>;

type PropsDeNumero = {
  titulo: string; texto?: string; valor: number; min: number; max: number; paso: number; decimales: number; unidad: string; deSalud: boolean;
  alCambiar: (v: number) => void; alSeguir: () => void; mostrar?: (v: number) => string;
};

/** Las preguntas de un número: el número grande, el deslizador y un paso fino a cada lado. */
function Numero({ titulo, texto, valor, min, max, paso, decimales, unidad, deSalud, alCambiar, alSeguir, mostrar }: PropsDeNumero) {
  const fino = (signo: 1 | -1) => alCambiar(Math.min(max, Math.max(min, Math.round((valor + signo * paso) * 100) / 100)));
  return (
    <>
      <Titulo>{titulo}</Titulo>
      {texto ? <Texto>{texto}</Texto> : null}
      <View style={s.numero}>
        <Pressable onPress={() => fino(-1)} style={s.fino} accessibilityRole="button" accessibilityLabel={`− ${numero(paso, decimales)}`} hitSlop={6}>
          <Icono nombre="minus" tam={16} peso="semibold" />
        </Pressable>
        <View style={s.numeroCentro}>
          <Text style={s.numeroValor}>{mostrar ? mostrar(valor) : numero(valor, decimales)}</Text>
          {!mostrar && <Text style={s.numeroUnidad}>{unidad}</Text>}
        </View>
        <Pressable onPress={() => fino(1)} style={s.fino} accessibilityRole="button" accessibilityLabel={`+ ${numero(paso, decimales)}`} hitSlop={6}>
          <Icono nombre="plus" tam={16} peso="semibold" />
        </Pressable>
      </View>
      {deSalud && <View style={s.chipFila}><ChipDeSalud /></View>}
      <Deslizador valor={valor} min={min} max={max} paso={paso} alCambiar={alCambiar} etiqueta={titulo} />
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

function Altura({ cm, deSalud, alCambiar, alSeguir }: { cm: number; deSalud: boolean; alCambiar: (cm: number) => void; alSeguir: () => void }) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  if (!imperial) {
    return <Numero titulo={t('entrada.cuestionario.alturaTitulo')} valor={cm} min={RANGOS_DEL_CUESTIONARIO.alturaCm[0]} max={RANGOS_DEL_CUESTIONARIO.alturaCm[1]} paso={1} decimales={0} unidad="cm" deSalud={deSalud} alCambiar={alCambiar} alSeguir={alSeguir} />;
  }
  // En pulgadas, y se muestra en pies y pulgadas: 5′ 9″.
  const pulgadas = Math.round(cm / CM_POR_PULGADA);
  return (
    <Numero
      titulo={t('entrada.cuestionario.alturaTitulo')}
      valor={pulgadas}
      min={Math.ceil(RANGOS_DEL_CUESTIONARIO.alturaCm[0] / CM_POR_PULGADA)}
      max={Math.floor(RANGOS_DEL_CUESTIONARIO.alturaCm[1] / CM_POR_PULGADA)}
      paso={1}
      decimales={0}
      unidad="in"
      deSalud={deSalud}
      alCambiar={(p) => alCambiar(Math.round(p * CM_POR_PULGADA))}
      alSeguir={alSeguir}
      mostrar={(p) => `${Math.floor(p / 12)}′ ${p % 12}″`}
    />
  );
}

function Peso({ kg, deSalud, alCambiar, alSeguir }: { kg: number; deSalud: boolean; alCambiar: (kg: number) => void; alSeguir: () => void }) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  const comun = { titulo: t('entrada.cuestionario.pesoTitulo'), texto: t('entrada.cuestionario.pesoTexto'), deSalud, alSeguir, decimales: 1 };
  if (!imperial) return <Numero {...comun} valor={kg} min={RANGOS_DEL_CUESTIONARIO.pesoKg[0]} max={RANGOS_DEL_CUESTIONARIO.pesoKg[1]} paso={0.1} unidad="kg" alCambiar={(v) => alCambiar(Math.round(v * 10) / 10)} />;
  return <Numero {...comun} valor={Math.round((kg / KG_POR_LIBRA) * 10) / 10} min={Math.ceil(RANGOS_DEL_CUESTIONARIO.pesoKg[0] / KG_POR_LIBRA)} max={Math.floor(RANGOS_DEL_CUESTIONARIO.pesoKg[1] / KG_POR_LIBRA)} paso={0.2} unidad="lb" alCambiar={(lb) => alCambiar(Math.round(lb * KG_POR_LIBRA * 10) / 10)} />;
}

function ElSexo({ sexo, deSalud, alElegir, alSeguir }: { sexo: Sexo | null; deSalud: boolean; alElegir: (s: Sexo) => void; alSeguir: () => void }) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.sexoTitulo')}</Titulo>
      <Texto>{t('entrada.cuestionario.sexoTexto')}</Texto>
      <View style={[s.opciones, s.dos]} accessibilityRole="radiogroup">
        <Opcion titulo={t('entrada.cuestionario.femenino')} elegida={sexo === 'f'} alTocar={() => alElegir('f')} centrada />
        <Opcion titulo={t('entrada.cuestionario.masculino')} elegida={sexo === 'm'} alTocar={() => alElegir('m')} centrada />
      </View>
      {deSalud && <View style={[s.chipFila, { justifyContent: 'flex-start' }]}><ChipDeSalud /></View>}
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} desactivado={!sexo} />
      </Pie>
    </>
  );
}

const ACTIVIDADES: readonly Actividad[] = ['poco', 'algo', 'activo', 'muy'];

function LaActividad({ actividad, alElegir, alSeguir }: { actividad: Actividad; alElegir: (a: Actividad) => void; alSeguir: () => void }) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.actividadTitulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {ACTIVIDADES.map((a) => {
          const [titulo, detalle] = lista(`entrada.cuestionario.actividad.${a}`);
          return <Opcion key={a} titulo={titulo} detalle={detalle} elegida={a === actividad} alTocar={() => alElegir(a)} />;
        })}
      </View>
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

function ElObjetivo({ objetivo, ritmo, sinDeficit, alObjetivo, alRitmo, alSeguir }: {
  objetivo: Objetivo; ritmo: Ritmo; sinDeficit: boolean; alObjetivo: (o: Objetivo) => void; alRitmo: (r: Ritmo) => void; alSeguir: () => void;
}) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.objetivoTitulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {/* Sin déficit, bajar de peso no se elige acá: se dice por qué, corto. */}
        {(['bajar', 'mantener', 'subir'] as const).map((o) => (
          <Opcion
            key={o}
            titulo={t(`entrada.cuestionario.${o}`)}
            detalle={o === 'bajar' && sinDeficit ? t('entrada.cuidado.bajarNo') : undefined}
            desactivada={o === 'bajar' && sinDeficit}
            elegida={o === objetivo}
            alTocar={() => alObjetivo(o)}
          />
        ))}
      </View>
      {objetivo !== 'mantener' && (
        <Animated.View entering={FadeIn.duration(300)} style={s.ritmo}>
          <Text style={s.paso}>{t('entrada.cuestionario.ritmo')}</Text>
          <View style={[s.opciones, s.tres]} accessibilityRole="radiogroup">
            {(['suave', 'recomendado', 'rapido'] as const).map((x) => <Opcion key={x} titulo={t(`entrada.cuestionario.${x}`)} elegida={x === ritmo} alTocar={() => alRitmo(x)} centrada />)}
          </View>
          <Text style={s.chico}>{t('entrada.cuestionario.ritmoTexto', { pct: numero(Math.abs(RITMOS[objetivo][ritmo]), 2) })}</Text>
        </Animated.View>
      )}
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

// ------------------------------------------------------------------ el resultado
function ElResultado({ r, alEmpezar, reducido }: { r: Respuestas; alEmpezar: () => void; reducido: boolean }) {
  const { gasto, metas } = metasIniciales({ ...r, sexo: r.sexo ?? 'm' });
  const kcal = [metas.proteina * 4, metas.carbohidratos * 4, metas.grasas * 9];
  const total = kcal.reduce((a, b) => a + b, 0) || 1;
  const [llena, setLlena] = useState(false);
  const [cuenta, setCuenta] = useState(reducido ? metas.kcal : 0);
  useEffect(() => {
    const id = setTimeout(() => setLlena(true), 200);
    if (reducido) return () => clearTimeout(id);
    // La cifra cuenta hasta la meta.
    const t0 = Date.now() + 200;
    const reloj = setInterval(() => {
      const u = Math.min(1, Math.max(0, (Date.now() - t0) / 1400));
      setCuenta(Math.round(metas.kcal * (1 - Math.pow(1 - u, 3))));
      if (u >= 1) clearInterval(reloj);
    }, 32);
    return () => {
      clearTimeout(id);
      clearInterval(reloj);
    };
  }, [metas.kcal, reducido]);
  return (
    <>
      <Titulo centrado>{t('entrada.cuestionario.resultadoTitulo')}</Titulo>
      <View style={[s.lunaGrande, s.lunaResultado]}>
        <Luna tam={100} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : 1600} />
        <Anillos tam={196} reparto={[kcal[0] / total, kcal[1] / total, kcal[2] / total]} ms={reducido ? 0 : 1600} demora={200} />
      </View>
      <View style={s.kcal}>
        <Text style={s.kcalNumero}>{numero(cuenta)}</Text>
        <Text style={s.kcalTexto}>{t('entrada.cuestionario.kcal')}</Text>
      </View>
      <View style={s.macros}>
        {MACROS.map((m) => (
          <View key={m} style={s.macro}>
            <View style={[s.macroPunto, { backgroundColor: COLOR_DE_MACRO[m] }]} />
            <Text style={s.macroNombre}>{t(`entrada.cuestionario.${m}`)}</Text>
            <Text style={s.macroGramos}>{`${numero(metas[m])} g`}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.chico, { textAlign: 'center' }]}>{t('entrada.cuestionario.gasto', { n: numero(gasto) })}</Text>
      <Texto centrado>{t('entrada.cuestionario.resultadoTexto')}</Texto>
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.cuestionario.empezar')} alTocar={alEmpezar} />
      </Pie>
    </>
  );
}

const SOMBRA = { textShadowColor: 'rgba(3, 5, 12, 0.95)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } };

const s = StyleSheet.create({
  pantalla: { flexGrow: 1, paddingHorizontal: 26 },
  titulo: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, lineHeight: 35, color: colores.pergamino, ...SOMBRA },
  texto: { marginTop: 12, maxWidth: 320, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 22, color: 'rgba(239, 230, 207, 0.78)', ...SOMBRA },
  chico: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)', textAlign: 'center' },
  legal: { marginTop: 6, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.4)' },
  enlace: { textDecorationLine: 'underline' },
  izquierda: { textAlign: 'left' },
  datos: { marginTop: 16, gap: 10, maxWidth: 340 },
  datoFila: { flexDirection: 'row', gap: 11 },
  datoPunto: { width: 5, height: 5, marginTop: 9, borderRadius: 3, backgroundColor: colores.oro },
  datoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 22, color: 'rgba(239, 230, 207, 0.86)', ...SOMBRA },
  llave: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.55)',
  },
  llaveTitulo: { fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: colores.pergamino },
  llaveTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)' },
  menor: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pie: { gap: 10, width: '100%', maxWidth: 340, alignSelf: 'center', paddingTop: 18 },
  avance: { height: 2, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  avanceLleno: { height: '100%', backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  paso: { marginTop: 16, marginBottom: 10, fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  centrado: { textAlign: 'center', alignSelf: 'center' },
  frase: { alignSelf: 'center', alignItems: 'center' },
  fraseTexto: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 7, maxWidth: 230 },
  palabra: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 29, lineHeight: 36, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.35)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  autor: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: 'rgba(185, 227, 107, 0.75)' },
  escenario: { flex: 1, minHeight: 250, alignItems: 'center', justifyContent: 'center' },
  lunaGrande: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  lunaResultado: { width: 196, height: 196, alignSelf: 'center', marginTop: 14 },
  cuenta: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  marca: { flexDirection: 'row' },
  marcaLetra: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 66, lineHeight: 72, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.45)', textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } },
  lema: { marginTop: 8, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: 'rgba(239, 230, 207, 0.72)' },
  botones: { width: '100%', maxWidth: 330, marginTop: 40, gap: 10 },
  apple: { width: '100%', height: 50 },
  formulario: { gap: 10 },
  campo: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(6, 10, 22, 0.6)', fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  error: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: '#f0a58a', textAlign: 'center' },
  aviso: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: colores.salvia, textAlign: 'center' },
  iconosDeSalud: { marginTop: 38, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  iconoDeSalud: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.25)', alignItems: 'center', justifyContent: 'center' },
  numero: { marginTop: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  numeroCentro: { flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 170, justifyContent: 'center' },
  numeroValor: { fontFamily: letras.numeroLiviano, fontSize: 68, lineHeight: 74, letterSpacing: -1.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
  numeroUnidad: { fontFamily: letras.texto, fontSize: 16, color: 'rgba(239, 230, 207, 0.6)' },
  fino: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  chipFila: { marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  deSalud: { overflow: 'hidden', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.4)', fontFamily: letras.texto, fontSize: 11, color: colores.salvia },
  opciones: { marginTop: 22, gap: 10 },
  dos: { flexDirection: 'row' },
  tres: { marginTop: 0, flexDirection: 'row', gap: 6 },
  ritmo: { marginTop: 20 },
  kcal: { marginTop: 2, alignItems: 'center' },
  kcalNumero: { fontFamily: letras.numeroLiviano, fontSize: 44, lineHeight: 48, letterSpacing: -0.8, color: colores.cifra, fontVariant: ['tabular-nums'], ...SOMBRA },
  kcalTexto: { fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 1.9, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  macros: { marginTop: 22, alignSelf: 'center', width: '100%', maxWidth: 300, gap: 8 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroPunto: { width: 8, height: 8, borderRadius: 4 },
  macroNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.8)' },
  macroGramos: { fontFamily: letras.numero, fontSize: 14, color: colores.pergamino, fontVariant: ['tabular-nums'] },
});
