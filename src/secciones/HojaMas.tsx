// La hoja del «+» (cambio 9 de la especificación), la de la galería (galeria/src/mas.js): arriba, lo
// principal (agregar comida, que abre la hoja de registro, y registrar el peso); abajo, la carga
// rápida (calorías y macros, el agua, y los recientes y las comidas guardadas, que un toque registra
// en la comida de esta hora con deshacer); al final, las medidas del cuerpo con la cinta, que
// estiman la grasa corporal como un rango chico (src/dominio/cuerpo.ts). Se cierra tocando afuera o
// bajándola con el dedo desde arriba.

import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { decimal } from '@/comida/porciones';
import { aCm, aKg, largoEn, pesoCorporalEn } from '@/dominio/cantidades';
import { tendencia } from '@/dominio/control';
import { medidaValida, rangoDeGrasa, SITIOS, ultimasMedidas, type Centimetros, type Sitio } from '@/dominio/cuerpo';
import { claveDeAlimento, itemsParaRegistrar, recientes, sumarValores, vigentes, type Item } from '@/dominio/registros';
import { idioma, lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from './comida/comunes';
import { cantidadDeTexto, comidaDeAhora, fechaCorta, numero, sistemaDe, useEstado } from './comida/datos';
import { abrirRegistro } from './comida/registro';
import { Figura } from './Figura';
import { entre, subirOBajar } from './movimiento';

export type VistaDelMas = 'menu' | 'peso' | 'medidas';
type Vista = VistaDelMas;
/** La vista la lleva quien abre la hoja: Progreso la abre directo en el peso o en las medidas. */
type Props = { hoja: SharedValue<number>; abierta: boolean; alCerrar: () => void; vista: Vista; alCambiarVista: (v: Vista) => void };

export function HojaMas({ hoja, abierta, alCerrar, vista, alCambiarVista }: Props) {
  const insets = useSafeAreaInsets();
  const { height: alto } = useWindowDimensions();
  const altoHoja = useSharedValue(520);
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: () => void; clave: number } | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(null), aviso.deshacer ? 4200 : 2600);
    return () => clearTimeout(espera);
  }, [aviso]);
  const avisar = (texto: string, deshacer?: () => void) => setAviso((antes) => ({ texto, deshacer, clave: (antes?.clave ?? 0) + 1 }));

  // Al cerrarla vuelve al menú, después de bajar: así no salta mientras se va.
  const cerrar = () => {
    alCerrar();
    setTimeout(() => alCambiarVista('menu'), 420);
  };

  const estiloFondo = useAnimatedStyle(() => ({ opacity: hoja.get() }));
  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - hoja.get()) * (altoHoja.get() + 40) }] }));
  // Bajarla con el dedo desde arriba: sigue al dedo y, al soltar, se cierra o vuelve.
  const arrastre = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: (ev) => {
      'worklet';
      hoja.set(entre(1 - Math.max(0, ev.translationY) / (altoHoja.get() + 40), 0, 1));
    },
    onDeactivate: (ev) => {
      'worklet';
      if (ev.translationY > 90 || ev.velocityY > 600) scheduleOnRN(cerrar);
      else hoja.set(subirOBajar(hoja.get(), 1));
    },
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={abierta ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, estilos.fondo, estiloFondo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityRole="button" accessibilityLabel={t('comun.cancelar')} />
      </Animated.View>
      <Animated.View
        style={[estilos.hoja, { paddingBottom: insets.bottom + 18, maxHeight: alto - insets.top - 24 }, estiloHoja]}
        onLayout={(ev) => altoHoja.set(ev.nativeEvent.layout.height)}
        accessibilityViewIsModal
      >
        <GestureDetector gesture={arrastre}>
          <View style={estilos.arriba}>
            <View style={estilos.asa} />
          </View>
        </GestureDetector>
        {/* Cambiar de vista nunca es de golpe: el peso y las medidas entran de costado; el menú, con un fundido. */}
        {vista === 'menu' && (
          <Animated.View key="menu" entering={FadeIn.duration(260)}>
            <Menu alCerrar={cerrar} alIr={alCambiarVista} avisar={avisar} />
          </Animated.View>
        )}
        {vista === 'peso' && (
          <Animated.View key="peso" entering={SlideInRight.duration(320)}>
            <VistaDePeso alVolver={() => alCambiarVista('menu')} avisar={avisar} />
          </Animated.View>
        )}
        {vista === 'medidas' && (
          <Animated.View key="medidas" entering={SlideInRight.duration(320)}>
            <VistaDeMedidas alVolver={() => alCambiarVista('menu')} avisar={avisar} />
          </Animated.View>
        )}
        {aviso && (
          <Animated.View key={aviso.clave} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(180)} style={[estilos.aviso, { bottom: insets.bottom + 14 }]}>
            <Text style={estilos.avisoTexto} numberOfLines={1}>{aviso.texto}</Text>
            {aviso.deshacer && (
              <Pressable
                onPress={() => {
                  const deshacer = aviso.deshacer;
                  setAviso(null);
                  deshacer?.();
                }}
                style={estilos.avisoBoton}
                accessibilityRole="button"
              >
                <Text style={estilos.avisoBotonTexto}>{t('comun.deshacer')}</Text>
              </Pressable>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

// ------------------------------------------------------------------ el menú
function Menu({ alCerrar, alIr, avisar }: { alCerrar: () => void; alIr: (v: Vista) => void; avisar: (texto: string, deshacer?: () => void) => void }) {
  const e = useEstado();
  const a = elAlmacen();
  const sistema = sistemaDe(e);
  const comida = comidaDeAhora();
  const [hechos, setHechos] = useState<Set<string>>(() => new Set());
  const agua = useMemo(() => vigentes(e.agua.values()).filter((x) => x.dia === e.hoy).reduce((s, x) => s + x.ml, 0), [e.agua, e.hoy]);
  const ultimo = e.pesos[e.pesos.length - 1];
  const detallePeso = ultimo
    ? t('mas.ultimoPeso', { cuando: ultimo.fecha === e.hoy ? t('mas.hoy') : fechaCorta(ultimo.fecha), peso: textoDePeso(ultimo.kg, sistema) })
    : t('mas.hoy');
  const listaDeRecientes = useMemo(() => recientes(e.registros.values(), 8), [e.registros]);
  const guardadas = useMemo(() => vigentes(e.recetas.values()).filter((r) => r.tipo === 'comida'), [e.recetas]);
  const grasa = useMemo(() => {
    if (!e.perfil) return null;
    return rangoDeGrasa(e.perfil.sexo, e.perfil.alturaCm, ultimasMedidas(e.medidas.values(), e.hoy));
  }, [e.perfil, e.medidas, e.hoy]);

  // Un toque y queda registrado en la comida de esta hora, con su última cantidad.
  const registrar = (clave: string, nombre: string, items: Item[]) => {
    const nuevos = a.registrar(items, { comida });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setHechos((h) => new Set(h).add(clave));
    avisar(t('mas.registrado', { que: nombre, donde: t(`comida.aLa.${comida}`) }), () => {
      nuevos.forEach((r) => a.borrarRegistro(r.id));
      setHechos((h) => {
        const otro = new Set(h);
        otro.delete(clave);
        return otro;
      });
    });
  };
  const sumarAgua = () => {
    const toma = a.sumarAgua(250);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    avisar(t('mas.vasoSumado'), () => a.quitarAgua(toma.id));
  };

  return (
    <ScrollView style={estilos.cuerpo} contentContainerStyle={estilos.cuerpoAdentro} showsVerticalScrollIndicator={false}>
      <View style={estilos.fila}>
        <Principal
          icono="fork.knife"
          titulo={t('mas.agregarComida')}
          detalle={t(`comida.comidas.${comida}`)}
          alTocar={() => {
            alCerrar();
            abrirRegistro({ comida });
          }}
        />
        <Principal icono="scalemass" titulo={t('mas.registrarPeso')} detalle={detallePeso} alTocar={() => alIr('peso')} />
      </View>
      <Text style={estilos.grupo}>{t('mas.cargaRapida')}</Text>
      <View style={estilos.fila}>
        <Pressable
          onPress={() => {
            alCerrar();
            abrirRegistro({ comida, panel: 'rapida', directo: true });
          }}
          style={({ pressed }) => [estilos.rapido, estilos.mitad, pressed && estilos.apretado]}
          accessibilityRole="button"
        >
          <Icono nombre="bolt" tam={17} peso="light" />
          <Text style={estilos.rapidoTitulo}>{t('mas.caloriasYMacros')}</Text>
        </Pressable>
        <View style={[estilos.rapido, estilos.mitad]}>
          <Icono nombre="drop" tam={17} peso="light" color="#bcd8f2" />
          <View style={estilos.crece}>
            <Text style={estilos.rapidoTitulo}>{t('mas.agua')}</Text>
            <Text style={estilos.detalleNumero}>{`${decimal(agua / 1000, idioma())} L`}</Text>
          </View>
          <Pressable onPress={sumarAgua} style={estilos.aguaMas} accessibilityRole="button" accessibilityLabel={t('mas.sumarVaso')} hitSlop={6}>
            <Icono nombre="plus" tam={14} peso="semibold" color="#d6e7f7" />
          </Pressable>
        </View>
      </View>
      {listaDeRecientes.length > 0 && (
        <>
          <Text style={estilos.grupo}>{t('mas.recientes')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
            {listaDeRecientes.map((item) => {
              const clave = `r-${claveDeAlimento(item.fuente, item.ref)}`;
              return (
                <Chip
                  key={clave}
                  hecho={hechos.has(clave)}
                  titulo={item.nombre}
                  detalle={[cantidadDeTexto(item.cantidad, sistema), `${numero(Math.round(item.valores.kcal))} kcal`].filter(Boolean).join(' · ')}
                  alTocar={() => registrar(clave, item.nombre, [item])}
                />
              );
            })}
          </ScrollView>
        </>
      )}
      {guardadas.length > 0 && (
        <>
          <Text style={estilos.grupo}>{t('mas.guardadas')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
            {guardadas.map((r) => {
              const clave = `g-${r.id}`;
              const items = itemsParaRegistrar(r, t('comida.receta.plato'));
              return (
                <Chip
                  key={clave}
                  hecho={hechos.has(clave)}
                  titulo={r.nombre}
                  detalle={`${numero(Math.round(sumarValores(items.map((i) => i.valores)).kcal))} kcal`}
                  alTocar={() => registrar(clave, r.nombre, items)}
                />
              );
            })}
          </ScrollView>
        </>
      )}
      <Pressable onPress={() => alIr('medidas')} style={({ pressed }) => [estilos.medidas, pressed && estilos.apretado]} accessibilityRole="button">
        <Icono nombre="ruler" tam={20} peso="light" />
        <View style={estilos.crece}>
          <Text style={estilos.medidasTitulo}>{t('mas.medidas')}</Text>
          <Text style={estilos.detalle}>{t('mas.medidasTexto')}</Text>
        </View>
        {grasa && <Text style={estilos.medidasRango}>{t('cuerpo.rango', { desde: grasa.desde, hasta: grasa.hasta })}</Text>}
        <Icono nombre="chevron.right" tam={13} color={colores.pergaminoApagado} />
      </Pressable>
    </ScrollView>
  );
}

const textoDePeso = (kg: number, sistema: ReturnType<typeof sistemaDe>) => {
  const p = pesoCorporalEn(kg, sistema);
  return `${numero(p.valor, 1)} ${p.unidad}`;
};

function Principal({ icono, titulo, detalle, alTocar }: { icono: SFSymbol; titulo: string; detalle: string; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [estilos.principal, pressed && estilos.apretado]} accessibilityRole="button">
      <Icono nombre={icono} tam={22} peso="light" />
      <Text style={estilos.principalTitulo}>{titulo}</Text>
      <Text style={estilos.detalle} numberOfLines={1}>{detalle}</Text>
    </Pressable>
  );
}

function Chip({ titulo, detalle, hecho, alTocar }: { titulo: string; detalle: string; hecho: boolean; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [estilos.chip, hecho && estilos.chipHecho, pressed && estilos.apretado]} accessibilityRole="button" accessibilityState={{ checked: hecho }}>
      <Text style={estilos.chipTitulo} numberOfLines={1}>{`${hecho ? '✓ ' : ''}${titulo}`}</Text>
      <Text style={estilos.chipDetalle} numberOfLines={1}>{detalle}</Text>
    </Pressable>
  );
}

function Cabeza({ titulo, alVolver }: { titulo: string; alVolver: () => void }) {
  return (
    <View style={estilos.cabeza}>
      <Pressable onPress={alVolver} style={estilos.atras} accessibilityRole="button" accessibilityLabel={t('comun.atras')}>
        <SymbolView name="chevron.left" size={18} weight="medium" tintColor={colores.oroClaro} fallback={<Text style={estilos.atrasTexto}>‹</Text>} />
      </Pressable>
      <Text style={estilos.cabezaTitulo}>{titulo}</Text>
      <View style={estilos.atrasLugar} />
    </View>
  );
}

function Guardar({ alTocar, desactivado }: { alTocar: () => void; desactivado?: boolean }) {
  return (
    <Pressable onPress={alTocar} disabled={desactivado} style={({ pressed }) => [estilos.guardar, desactivado && estilos.desactivado, pressed && estilos.apretado]} accessibilityRole="button">
      <Text style={estilos.guardarTexto}>{t('comun.guardar')}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ el peso
function VistaDePeso({ alVolver, avisar }: { alVolver: () => void; avisar: (texto: string) => void }) {
  const e = useEstado();
  const sistema = sistemaDe(e);
  const ultimo = e.pesos[e.pesos.length - 1];
  const [valor, setValor] = useState(() => pesoCorporalEn(ultimo?.kg ?? 75, sistema).valor);
  const [escrito, setEscrito] = useState<string | null>(null);
  const unidad = pesoCorporalEn(1, sistema).unidad;
  const deTendencia = ultimo ? tendencia(e.pesos, e.hoy).get(e.hoy) : undefined;
  const kg = aKg(valor, sistema);
  const valido = kg >= 20 && kg <= 400;
  const paso = (signo: 1 | -1) => {
    setEscrito(null);
    setValor((v) => Math.round((v + 0.1 * signo) * 10) / 10);
  };
  return (
    <>
      <Cabeza titulo={t('mas.registrarPeso')} alVolver={alVolver} />
      <View style={estilos.peso}>
        <View style={estilos.pesoCifra}>
          <Pressable onPress={() => paso(-1)} style={estilos.paso} accessibilityRole="button" accessibilityLabel="−0,1">
            <SymbolView name="minus" size={16} weight="semibold" tintColor={colores.oroClaro} fallback={<Text style={estilos.atrasTexto}>−</Text>} />
          </Pressable>
          <TextInput
            value={escrito ?? decimal(valor, idioma())}
            onChangeText={(x) => {
              setEscrito(x);
              const n = Number(x.replace(',', '.'));
              if (n > 0) setValor(n);
            }}
            onBlur={() => setEscrito(null)}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={estilos.pesoEntrada}
            accessibilityLabel={t('mas.registrarPeso')}
          />
          <Text style={estilos.pesoUnidad}>{unidad}</Text>
          <Pressable onPress={() => paso(1)} style={estilos.paso} accessibilityRole="button" accessibilityLabel="+0,1">
            <SymbolView name="plus" size={16} weight="semibold" tintColor={colores.oroClaro} fallback={<Text style={estilos.atrasTexto}>+</Text>} />
          </Pressable>
        </View>
        <Text style={estilos.pesoDia}>{t('mas.pesoHoy')}</Text>
        <View style={estilos.pesoDatos}>
          {ultimo && <Text style={estilos.detalleNumero}>{t('mas.ultimoPeso', { cuando: fechaCorta(ultimo.fecha), peso: textoDePeso(ultimo.kg, sistema) })}</Text>}
          {deTendencia !== undefined && <Text style={estilos.detalleNumero}>{t('mas.tendencia', { peso: textoDePeso(deTendencia, sistema) })}</Text>}
        </View>
        <Text style={estilos.nota}>{t('mas.pesoNota')}</Text>
      </View>
      <View style={estilos.pie}>
        <Guardar
          desactivado={!valido}
          alTocar={() => {
            elAlmacen().anotarPeso(Math.round(kg * 10) / 10, 'manual');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            avisar(t('mas.pesoGuardado', { peso: textoDePeso(kg, sistema) }));
            alVolver();
          }}
        />
      </View>
    </>
  );
}

// ------------------------------------------------------------------ las medidas del cuerpo
/**
 * La figura marca dónde va la cinta en la medida que se escribe, con cómo tomarla; los consejos de
 * siempre van plegados. Lo que se estima sale de las medidas que hay: las de hoy y, si falta alguna,
 * la última.
 */
function VistaDeMedidas({ alVolver, avisar }: { alVolver: () => void; avisar: (texto: string) => void }) {
  const e = useEstado();
  const sistema = sistemaDe(e);
  const sexo = e.perfil?.sexo ?? 'm';
  const ultimas = useMemo(() => ultimasMedidas(e.medidas.values(), e.hoy), [e.medidas, e.hoy]);
  const [sitio, setSitio] = useState<Sitio>('cintura');
  const [escritas, setEscritas] = useState<Partial<Record<Sitio, string>>>({});
  const [consejos, setConsejos] = useState(false);
  const usadas: Sitio[] = sexo === 'm' ? ['cintura', 'cuello'] : ['cintura', 'cuello', 'cadera'];
  const nuevas: Centimetros = {};
  const malas = new Set<Sitio>();
  for (const s of SITIOS) {
    const texto = escritas[s]?.trim();
    if (!texto) continue;
    const cm = aCm(Number(texto.replace(',', '.')), sistema);
    if (medidaValida(s, cm)) nuevas[s] = Math.round(cm * 10) / 10;
    else malas.add(s);
  }
  const rango = e.perfil ? rangoDeGrasa(e.perfil.sexo, e.perfil.alturaCm, { ...ultimas, ...nuevas }) : null;
  const unidad = largoEn(1, sistema).unidad;
  const como = t(`cuerpo.como.${sitio === 'cintura' ? (sexo === 'm' ? 'cinturaHombre' : 'cinturaMujer') : sitio}`);
  return (
    <>
      <Cabeza titulo={t('mas.medidas')} alVolver={alVolver} />
      <ScrollView style={estilos.cuerpo} contentContainerStyle={estilos.cuerpoMedidas} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={estilos.tutorial}>
          <Figura activa={sitio} ancho={96} />
          <View style={estilos.crece}>
            <Text style={estilos.comoTitulo}>{t(`cuerpo.sitios.${sitio}`)}</Text>
            <Text style={estilos.comoTexto}>{como}</Text>
          </View>
        </View>
        <Pressable onPress={() => setConsejos(!consejos)} style={estilos.consejos} accessibilityRole="button" accessibilityState={{ expanded: consejos }}>
          <Text style={estilos.consejosTitulo}>{`${t('cuerpo.comoMedir')} ${consejos ? '‹' : '›'}`}</Text>
          {consejos && lista('cuerpo.consejos').map((c) => <Text key={c} style={estilos.consejo}>{`•  ${c}`}</Text>)}
        </Pressable>
        {SITIOS.map((s) => (
          <Pressable key={s} onPress={() => setSitio(s)} style={estilos.campo}>
            <View style={estilos.crece}>
              <Text style={[estilos.campoNombre, usadas.includes(s) && estilos.campoUsado]}>{t(`cuerpo.sitios.${s}`)}</Text>
              {ultimas.fechas[s] && <Text style={estilos.campoUltima}>{t('cuerpo.ultima', { fecha: fechaCorta(ultimas.fechas[s]!) })}</Text>}
            </View>
            <TextInput
              value={escritas[s] ?? ''}
              onChangeText={(x) => setEscritas((antes) => ({ ...antes, [s]: x }))}
              onFocus={() => setSitio(s)}
              placeholder={ultimas[s] !== undefined ? decimal(largoEn(ultimas[s]!, sistema).valor, idioma()) : '—'}
              placeholderTextColor="rgba(239, 230, 207, 0.35)"
              keyboardType="decimal-pad"
              style={[estilos.campoEntrada, sitio === s && estilos.campoElegido, malas.has(s) && estilos.campoMal]}
              accessibilityLabel={t(`cuerpo.sitios.${s}`)}
            />
            <Text style={estilos.campoUnidad}>{unidad}</Text>
          </Pressable>
        ))}
        {e.perfil && <Text style={estilos.notaIzquierda}>{t(sexo === 'm' ? 'cuerpo.usaHombre' : 'cuerpo.usaMujer')}</Text>}
        <View style={estilos.grasa}>
          <Text style={estilos.grasaEtiqueta}>{t('cuerpo.grasaEstimada')}</Text>
          <Text style={estilos.grasaRango}>{rango ? t('cuerpo.rango', { desde: rango.desde, hasta: rango.hasta }) : '—'}</Text>
          <Text style={estilos.grasaAviso}>{t('cuerpo.aviso')}</Text>
        </View>
      </ScrollView>
      <View style={estilos.pie}>
        <Guardar
          desactivado={!Object.keys(nuevas).length}
          alTocar={() => {
            if (!elAlmacen().guardarMedidas(nuevas)) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            avisar(t('mas.medidasGuardadas'));
            alVolver();
          }}
        />
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  hoja: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 4, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#0f1631',
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(232, 196, 106, 0.3)',
  },
  arriba: { height: 26, alignItems: 'center', justifyContent: 'center' },
  asa: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cuerpo: { flexGrow: 0 },
  cuerpoAdentro: { paddingHorizontal: 16, paddingTop: 6 },
  cuerpoMedidas: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  fila: { flexDirection: 'row', gap: 10 },
  principal: { flex: 1, gap: 4, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.07)' },
  apretado: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  principalTitulo: { marginTop: 6, fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  grupo: { marginTop: 18, marginBottom: 8, marginLeft: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  rapido: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingLeft: 13, paddingRight: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  mitad: { flex: 1 },
  crece: { flex: 1, gap: 3, minWidth: 0 },
  rapidoTitulo: { fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  detalle: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
  detalleNumero: { fontFamily: letras.numeroMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  aguaMas: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(188, 216, 242, 0.4)', backgroundColor: 'rgba(188, 216, 242, 0.08)', alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingBottom: 2 },
  chip: { maxWidth: 190, gap: 3, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  chipHecho: { borderColor: 'rgba(239, 230, 207, 0.42)', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  chipTitulo: { fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  chipDetalle: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
  medidas: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 4, paddingVertical: 13, paddingLeft: 14, paddingRight: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  medidasTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
  medidasRango: { fontFamily: letras.numeroMedio, fontSize: 13, color: colores.oroClaro },
  cabeza: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6 },
  atras: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  atrasTexto: { fontSize: 20, color: colores.oroClaro },
  atrasLugar: { width: 38 },
  cabezaTitulo: { flex: 1, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 16, color: colores.pergamino },
  peso: { alignItems: 'center', paddingTop: 18, paddingHorizontal: 20 },
  pesoCifra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pesoEntrada: { width: 140, borderBottomWidth: 1, borderColor: 'rgba(232, 196, 106, 0.4)', textAlign: 'center', fontFamily: letras.numeroLiviano, fontSize: 50, letterSpacing: -1, color: colores.cifra, outlineWidth: 0 },
  pesoUnidad: { marginLeft: -4, fontFamily: letras.texto, fontSize: 15, color: 'rgba(239, 230, 207, 0.6)' },
  pesoDia: { marginTop: 14, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.72)' },
  pesoDatos: { marginTop: 18, flexDirection: 'row', gap: 14 },
  nota: { marginTop: 18, maxWidth: 300, textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.48)' },
  notaIzquierda: { marginTop: 12, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  pie: { marginTop: 10, paddingTop: 10, paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  guardar: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.oro },
  guardarTexto: { fontFamily: letras.textoMedio, fontSize: 16, color: colores.tinta },
  desactivado: { opacity: 0.4 },
  tutorial: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 6, paddingBottom: 4 },
  comoTitulo: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.oroClaro },
  comoTexto: { marginTop: 7, fontFamily: letras.texto, fontSize: 13, lineHeight: 18.5, color: 'rgba(239, 230, 207, 0.78)' },
  consejos: { marginTop: 10, marginBottom: 4, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)', gap: 5 },
  consejosTitulo: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  consejo: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.7)' },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  campoNombre: { fontFamily: letras.texto, fontSize: 14.5, color: 'rgba(239, 230, 207, 0.8)' },
  campoUsado: { color: colores.pergamino },
  campoUltima: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.42)' },
  campoEntrada: { width: 104, height: 40, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(239, 230, 207, 0.06)', paddingHorizontal: 12, textAlign: 'right', fontFamily: letras.texto, fontSize: 16, color: colores.pergamino, outlineWidth: 0 },
  campoElegido: { borderColor: 'rgba(232, 196, 106, 0.6)' },
  campoMal: { borderColor: 'rgba(231, 140, 110, 0.8)', color: '#f0b39c' },
  campoUnidad: { width: 24, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
  grasa: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.22)', backgroundColor: 'rgba(232, 196, 106, 0.06)', gap: 6 },
  grasaEtiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  grasaRango: { fontFamily: letras.numeroLiviano, fontSize: 34, color: colores.cifra, fontVariant: ['tabular-nums'] },
  grasaAviso: { marginTop: 4, fontFamily: letras.texto, fontSize: 12, lineHeight: 17.4, color: 'rgba(239, 230, 207, 0.62)' },
  aviso: {
    position: 'absolute', alignSelf: 'center', maxWidth: '92%', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 7, paddingVertical: 6, minHeight: 42,
    borderRadius: 999, backgroundColor: 'rgba(15, 22, 46, 0.97)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)',
  },
  avisoTexto: { flexShrink: 1, paddingRight: 9, fontFamily: letras.texto, fontSize: 13, color: colores.pergamino },
  avisoBoton: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  avisoBotonTexto: { fontFamily: letras.textoMedio, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: colores.oro },
});
