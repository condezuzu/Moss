// La entrada a la app, la de la galería (galeria/src/entrada.js): la frase de apertura, dos
// diapositivas, tus datos (qué guarda Moss y el consentimiento para los datos de salud), la cuenta
// (solo con Apple) y el cuestionario que arma la meta inicial de comida, con lo que cuida: mayores de
// 18 y sin déficit en el embarazo, la lactancia o con una condición médica. La recorre una estrella
// guía (Guia.tsx, con el guion de guion.ts): en la frase y las diapositivas espera abajo y tocarla es
// seguir, así que no se saltean. Cada pantalla tiene su lugar en el cielo: la cámara sube a medida
// que se avanza. Al final la estrella se va, la cámara baja hasta hoy, se guardan las respuestas (el
// perfil, el peso de hoy y la meta) y aparece Inicio.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
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
import { entrarConApple, hayApple, type ErrorDeCuenta } from './cuenta';
import { Guia } from './Guia';
import {
  anclas as medirAnclas, barraEn, esDiapositiva, estado, guionDe, guionDeSalida, LUNA, PALABRAS, reposo,
  type Anclas, type EscenaDeLuna, type Evento, type Guion, type Lugar, type Paso, type Recorrido,
} from './guion';
import { Anillos, Casiopea } from './Lienzos';
import { Boton, Deslizador, Opcion } from './piezas';

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

/** Una build sin Supabase no tiene cuenta: esa pantalla no se muestra, y Moss guarda todo en el teléfono. */
const pasosDeEstaVersion = () => (haySupabase() ? PASOS : PASOS.filter((p) => p.id !== 'cuenta'));

/** Embarazo o lactancia, una condición médica o nada: de eso solo se guarda si va sin déficit. */
type Caso = 'nada' | 'embarazo' | 'condicion';
type Respuestas = { edad: number; sexo: Sexo | null; alturaCm: number; pesoKg: number; actividad: Actividad; objetivo: Objetivo; ritmo: Ritmo; caso: Caso };
const DE_FABRICA: Respuestas = { edad: 29, sexo: null, alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', caso: 'nada' };
type DeSalud = ReadonlySet<'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>;
/** Lo que deja cada pantalla arriba, debajo del borde del teléfono. */
const ARRIBA = 28;
/** Lo que deja cada pantalla a los costados. */
const LADOS = 26;
const CASIOPEA = buscarConstelacion('cassiopeia');

function vibrar(e: Evento) {
  if (e === 'completo') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (e === 'toque') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
}

type Retomar = { i: number; r: Respuestas; deSalud: DeSalud };

function avanceInicial(total: number): Retomar {
  const e = elAlmacen().estado();
  const a = e.avanceDeEntrada as { i?: unknown; r?: Partial<Respuestas>; deSalud?: unknown } | null;
  if (a && typeof a.i === 'number' && a.i >= 0 && a.i < total && a.r) {
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
  const { width: W, height: H } = useWindowDimensions();
  const reducido = useReducedMotion();
  const [pasos] = useState(pasosDeEstaVersion);
  // Se retoma donde quedó; si la cuenta ya tenía un perfil, sus respuestas vienen llenas.
  const [inicio] = useState(() => avanceInicial(pasos.length));
  const [i, setI] = useState(inicio.i);
  const [r, setR] = useState<Respuestas>(inicio.r);
  const [deSalud, setDeSalud] = useState<DeSalud>(inicio.deSalud);
  const [terminando, setTerminando] = useState(false);
  const paso = pasos[i];

  // La estrella guía: el guion de la pantalla de ahora y el reloj que lo recorre (ms desde que empezó).
  const a = useMemo(() => medirAnclas(W, H, insets.top, insets.bottom, ARRIBA, LADOS), [W, H, insets.top, insets.bottom]);
  const recorrido = useSharedValue<Recorrido | null>(null);
  const reloj = useSharedValue(0);
  const kDe = (j: number) => {
    const c = CUESTIONARIO.indexOf(pasos[j]?.id);
    return c >= 0 ? (c + 1) / CUESTIONARIO.length : 0;
  };
  const guionPara = (j: number, desde: Lugar) => guionDe(pasos[j].id, a, desde, kDe(j), CASIOPEA);
  // Al abrir (o retomar), sale de donde habría quedado la pantalla anterior.
  const [guion, setGuion] = useState<Guion>(() => guionPara(inicio.i, reposo(pasos[inicio.i - 1]?.id, a, kDe(inicio.i - 1))));
  // En la frase y las diapositivas: ya terminó su parte y espera que la toquen.
  const [espera, setEspera] = useState(false);
  /** Dónde está la estrella ahora mismo: de ahí sale la pantalla siguiente. */
  const lugarDeAhora = (): Lugar => {
    const g = recorrido.get();
    if (!g) return reposo(pasos[i - 1]?.id, a, kDe(i - 1));
    const e = estado(g, reloj.get(), false);
    const b = barraEn(g, reloj.get());
    return { pos: [e.x, e.y], escala: e.escala, brillo: e.base, enBarra: b.visible > 0.5 ? b.k : null };
  };
  useEffect(() => {
    recorrido.set(guion.recorrido);
    const dura = guion.fin + 600;
    reloj.set(0);
    reloj.set(withTiming(dura, { duration: dura, easing: Easing.linear }));
    const esperas = guion.eventos.map(([ms, e]) => setTimeout(() => vibrar(e), ms));
    if (esDiapositiva(paso.id) && !terminando) esperas.push(setTimeout(() => setEspera(true), guion.fin));
    return () => esperas.forEach(clearTimeout);
    // El guion cambia junto con la pantalla: alcanza con él.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guion, recorrido, reloj]);
  // Después de Salud, si la cuenta trajo su perfil (otro teléfono, reinstalar o volver a entrar),
  // el cuestionario no se pregunta otra vez: se sale como al terminar y quedan sus metas y sus hábitos.
  const conPerfil = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().perfil !== null);
  const conLaCuenta = conPerfil && i > pasos.findIndex((p) => p.id === 'salud');
  const saliendo = terminando || conLaCuenta;

  useEffect(() => {
    if (!saliendo) elAlmacen().ponerAvanceDeEntrada({ i, r, deSalud: [...deSalud] });
  }, [i, r, deSalud, saliendo]);

  useEffect(() => {
    camara.set(paso.camara);
  }, [camara, paso.camara]);

  const siguiente = () => {
    if (i >= pasos.length - 1) return;
    setEspera(false);
    setGuion(guionPara(i + 1, lugarDeAhora()));
    setI(i + 1);
  };
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
  const salir = (guardar: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    camara.set(0);
    return setTimeout(() => {
      guardar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, reducido ? 200 : 1100);
  };
  const terminar = () => {
    if (saliendo || !r.sexo) return;
    setTerminando(true);
    // La estrella sube y se va, como en la galería antes del flum.
    setGuion(guionDeSalida(lugarDeAhora()));
    const sexo = r.sexo;
    const { caso, ...respuestas } = r;
    salir(() => {
      elAlmacen().responderCuestionario({ ...respuestas, sexo, sinDeficit: caso !== 'nada' }, deSalud.has('pesoKg') ? 'salud' : 'manual');
      alTerminar?.();
    });
  };
  useEffect(() => {
    if (!conLaCuenta || terminando) return;
    const espera = salir(() => elAlmacen().terminarEntrada());
    return () => clearTimeout(espera);
    // Solo importa cuándo llega el perfil: salir es otra función en cada dibujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conLaCuenta]);

  const estiloSalida = useAnimatedStyle(() => ({
    opacity: withTiming(saliendo ? 0 : 1, { duration: 700 }),
    transform: [{ scale: withTiming(saliendo ? 1.06 : 1, { duration: 900 }) }],
  }));

  const enCuestionario = CUESTIONARIO.indexOf(paso.id);
  const relleno = { paddingTop: insets.top + ARRIBA, paddingBottom: insets.bottom + 24 };
  // La frase, las diapositivas y la cuenta tienen lo suyo en un lugar fijo, el que recorre la estrella: no corren.
  const fija = esDiapositiva(paso.id) || paso.id === 'cuenta';
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estiloSalida]} pointerEvents={saliendo ? 'none' : 'box-none'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View key={paso.id} entering={FadeInDown.delay(i === 0 ? 120 : 280).duration(620)} exiting={FadeOut.duration(320)} style={{ flex: 1 }}>
          {fija ? (
            <>
              {paso.id === 'frase' && <Frase a={a} reducido={reducido} />}
              {paso.id === 'habitos' && guion.casiopea && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Casiopea escena={guion.casiopea} reloj={reloj} reducido={reducido} ancho={a.W} alto={a.H} />
                </View>
              )}
              {paso.id === 'comida' && guion.luna && <LunaQueSeLlena luna={guion.luna} reloj={reloj} reducido={reducido} />}
              {paso.id === 'cuenta' && <Marca a={a} letras={guion.letras} reducido={reducido} />}
              <View style={[s.pantalla, s.fija, relleno]} pointerEvents="box-none">
                {paso.id === 'habitos' && <Encabezado titulo={t('entrada.habitosTitulo')} texto={t('entrada.habitosTexto')} />}
                {paso.id === 'comida' && <Encabezado titulo={t('entrada.comidaTitulo')} texto={t('entrada.comidaTexto')} />}
                {paso.id === 'cuenta' && <Cuenta alEntrar={siguiente} />}
              </View>
            </>
          ) : (
          <ScrollView
            contentContainerStyle={[s.pantalla, relleno]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {enCuestionario >= 0 && <Avance n={enCuestionario + 1} total={CUESTIONARIO.length} />}
            {paso.id === 'datos' && <TusDatos alSeguir={siguiente} />}
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
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      <Guia recorrido={recorrido} reloj={reloj} anclas={a} reducido={reducido} tocable={esDiapositiva(paso.id) && !saliendo} lista={espera} alTocar={siguiente} />
    </Animated.View>
  );
}

// Como en la galería, la frase, las diapositivas, la cuenta y el resultado van centrados; el cuestionario, a la izquierda.
const Titulo = ({ children, centrado }: { children: ReactNode; centrado?: boolean }) => <Text style={[s.titulo, centrado && s.centrado]} accessibilityRole="header">{children}</Text>;
const Texto = ({ children, centrado }: { children: ReactNode; centrado?: boolean }) => <Text style={[s.texto, centrado && s.centrado]}>{children}</Text>;
const Pie = ({ children }: { children: ReactNode }) => <View style={s.pie}>{children}</View>;
const Espacio = () => <View style={{ flex: 1, minHeight: 24 }} />;

/** Cuánto falta del cuestionario. La barra es de la estrella (Guia.tsx), que va en su punta: acá queda su lugar. */
function Avance({ n, total }: { n: number; total: number }) {
  return (
    <View>
      <View style={s.avance} />
      <Text style={s.paso}>{t('entrada.cuestionario.paso', { n, total })}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ la frase y las diapositivas
/** La frase, centrada en el 44 % del alto: las palabras aparecen mientras la estrella la presenta desde arriba. */
function Frase({ a, reducido }: { a: Anclas; reducido: boolean }) {
  const palabras = t('entrada.frase').split(' ');
  return (
    <View style={[s.frase, { height: a.H * 0.88 }]} pointerEvents="none">
      <View style={s.fraseTexto} accessible accessibilityLabel={t('entrada.frase')}>
        {palabras.map((p, k) => (
          <Animated.Text key={k} entering={reducido ? undefined : FadeIn.delay(PALABRAS.desde + k * PALABRAS.cada).duration(900)} style={s.palabra}>{p}</Animated.Text>
        ))}
      </View>
      <Animated.Text entering={reducido ? undefined : FadeIn.delay(PALABRAS.autor).duration(1000)} style={s.autor}>{t('entrada.fraseAutor')}</Animated.Text>
    </View>
  );
}

function Encabezado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <Titulo centrado>{titulo}</Titulo>
      <Texto centrado>{texto}</Texto>
    </>
  );
}

/** La luna de la comida, en el centro: se llena mientras la estrella le da tres vueltas, y cada vuelta deja el anillo de un macro. */
function LunaQueSeLlena({ luna, reloj, reducido }: { luna: EscenaDeLuna; reloj: SharedValue<number>; reducido: boolean }) {
  const [llena, setLlena] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLlena(true), luna.llena[0]);
    return () => clearTimeout(id);
  }, [luna]);
  return (
    <View style={[s.lunaGrande, s.lunaFija, { left: luna.centro[0] - LUNA.caja / 2, top: luna.centro[1] - LUNA.caja / 2 }]} pointerEvents="none">
      <Luna tam={118} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : luna.llena[1] - luna.llena[0]} />
      <Anillos tam={LUNA.caja} ms={0} vueltas={luna.vueltas} reloj={reloj} />
    </View>
  );
}

/** La marca de la cuenta, en el 36 % del alto: cada letra aparece cuando la estrella pasa por encima. */
function Marca({ a, letras: cuando, reducido }: { a: Anclas; letras?: number[]; reducido: boolean }) {
  return (
    <View style={[s.marcaCaja, { top: a.marca[1] - 36 }]} pointerEvents="none">
      <View style={s.marca} accessible accessibilityRole="header" accessibilityLabel="Moss">
        {'Moss'.split('').map((letra, k) => (
          <Animated.Text key={k} entering={reducido ? undefined : FadeInDown.delay(cuando?.[k] ?? 150 + k * 120).duration(1100)} style={s.marcaLetra}>{letra}</Animated.Text>
        ))}
      </View>
      <Animated.Text entering={reducido ? undefined : FadeIn.delay(1900).duration(1000)} style={s.lema}>{t('entrada.cuenta.lema')}</Animated.Text>
    </View>
  );
}

// ------------------------------------------------------------------ la cuenta
/** Solo con Apple (la v1 no ofrece correo: la lógica sigue en cuenta.ts, sin usar). */
function Cuenta({ alEntrar }: { alEntrar: () => void }) {
  const [apple, setApple] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<ErrorDeCuenta | null>(null);
  useEffect(() => {
    hayApple().then(setApple).catch(() => {});
  }, []);
  const entrar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    const resultado = await entrarConApple();
    setOcupado(false);
    if (resultado.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alEntrar();
    } else setError(resultado.error);
  };
  // La marca va arriba (Marca); abajo, Apple y lo que se acepta.
  return (
    <>
      <Espacio />
      <Animated.View entering={FadeInDown.delay(2100).duration(800)} style={s.botones}>
        {apple ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={25}
            style={s.apple}
            onPress={entrar}
          />
        ) : (
          <Boton tipo="apple" texto={t('entrada.cuenta.apple')} alTocar={entrar} desactivado={ocupado} icono={<Icono nombre="applelogo" tam={17} color="#000" />} />
        )}
        {error && (
          <Animated.Text entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={s.error} accessibilityLiveRegion="polite">
            {t(`entrada.cuenta.errores.${error}`)}
          </Animated.Text>
        )}
        <Legal />
      </Animated.View>
    </>
  );
}

/** Lo que se acepta al continuar, con los Términos y la Política de privacidad para abrirlos. */
function Legal() {
  const enlaces = { terminos: urlDe('terminos'), privacidad: urlDe('privacidad') } as const;
  return (
    <Text style={[s.chico, s.legal]}>
      {t('entrada.cuenta.legalConEnlaces').split(/(\{\w+\})/).map((parte, k) => {
        const clave = parte.slice(1, -1);
        if (clave !== 'terminos' && clave !== 'privacidad') return parte;
        return (
          <Text key={k} style={s.enlace} onPress={() => Linking.openURL(enlaces[clave]).catch(() => {})} accessibilityRole="link" suppressHighlighting>
            {t(`entrada.cuenta.${clave}`)}
          </Text>
        );
      })}
    </Text>
  );
}

// ------------------------------------------------------------------ tus datos
/**
 * Antes de la cuenta, una idea y una acción: qué guarda Moss y para qué, y el consentimiento para los
 * datos de salud (Ley 18.331 y la guía 5.1.1 de Apple). Mandar lo que no se encuentra ya no se pregunta
 * acá: empieza apagado y se prende en Perfil.
 */
function TusDatos({ alSeguir }: { alSeguir: () => void }) {
  return (
    <>
      <Titulo>{t('entrada.datos.titulo')}</Titulo>
      <Texto>{t('entrada.datos.texto')}</Texto>
      <View style={s.datos}>
        {lista('entrada.datos.lineas').map((linea, k) => (
          <Animated.View key={linea} entering={FadeInDown.delay(500 + k * 140).duration(600)} style={s.datoFila}>
            <View style={s.datoPunto} />
            <Text style={s.datoTexto}>{linea}</Text>
          </Animated.View>
        ))}
      </View>
      <Pressable onPress={() => Linking.openURL(urlDe('privacidad')).catch(() => {})} accessibilityRole="link" hitSlop={8}>
        <Text style={[s.chico, s.enlace, s.izquierda]}>{t('entrada.datos.politica')}</Text>
      </Pressable>
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.datos.acepto')} alTocar={alSeguir} />
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
      <Text style={s.chico}>{t('entrada.cuestionario.profesional')}</Text>
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
  datos: { marginTop: 18, gap: 9, maxWidth: 340 },
  datoFila: { flexDirection: 'row', gap: 12 },
  // Un rombo chico, como una estrella lejana.
  datoPunto: { width: 5, height: 5, marginTop: 8.5, marginLeft: 2, backgroundColor: colores.oroClaro, transform: [{ rotate: '45deg' }], shadowColor: colores.oroClaro, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  datoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 21, color: 'rgba(239, 230, 207, 0.86)', ...SOMBRA },
  menor: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pie: { gap: 10, width: '100%', maxWidth: 340, alignSelf: 'center', paddingTop: 18 },
  avance: { height: 2 },
  paso: { marginTop: 16, marginBottom: 10, fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  centrado: { textAlign: 'center', alignSelf: 'center' },
  fija: { flex: 1 },
  frase: { position: 'absolute', left: 28, right: 28, top: 0, alignItems: 'center', justifyContent: 'center' },
  fraseTexto: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 7, maxWidth: 230 },
  palabra: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 29, lineHeight: 36, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.35)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  autor: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: 'rgba(185, 227, 107, 0.75)' },
  lunaGrande: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  lunaFija: { position: 'absolute' },
  lunaResultado: { width: 196, height: 196, alignSelf: 'center', marginTop: 14 },
  marcaCaja: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  marca: { flexDirection: 'row' },
  marcaLetra: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 66, lineHeight: 72, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.45)', textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } },
  lema: { marginTop: 8, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: 'rgba(239, 230, 207, 0.72)' },
  botones: { width: '100%', maxWidth: 330, alignSelf: 'center', gap: 10 },
  apple: { width: '100%', height: 50 },
  error: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: '#f0a58a', textAlign: 'center' },
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
