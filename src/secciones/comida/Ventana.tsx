// La ventana del alimento, la de la galería: sube desde abajo, sobre la lista, con las calorías y
// los macros de lo elegido, cuánto deja para el resto del día, la porción y la cantidad. Y cómo se
// mide (spec/nutricion.md, «Cómo se miden los alimentos»): crudo o cocido sin perder los gramos, con
// cáscara o sin, el aceite de cocción, los ml de lo que se toma, los ajustes ×½ ×1½ ×2, métrico o
// imperial, y si se pesó o fue a ojo. Antes de sumar, si está verificado y de dónde sale, cómo deja
// el día, las vitaminas y los minerales, y «Reportar un error» (AntesDeSumar.tsx). Sirve para sumar,
// para cambiar algo de la comida que se arma y para corregir un registro de la línea del día.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { baseDeAlimentos } from '@/comida/base';
import { rindeAlCocinar, type Detalle } from '@/comida/detalle';
import { cantidadDePorcion, decimal, numeroDePorcion } from '@/comida/porciones';
import {
  ACEITE, AJUSTES, aGramos, ajustar, aMl, aOjoDeFabrica, comestible, gramosDeMl, GRAMOS_POR_ONZA, ML_POR_ONZA_LIQUIDA, pasoDeCantidad, pasoDePorcion, unidadDePeso, unidadDeVolumen, type Sistema,
} from '@/dominio/cantidades';
import type { Macros } from '@/dominio/metas';
import type { ParaQuien } from '@/dominio/micronutrientes';
import { gramosDe, valoresDeCantidad, type Cantidad, type Fuente, type Item, type Valores } from '@/dominio/registros';
import { idioma, lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_HOJA, SALE_HOJA } from '../movimiento';
import { Aparece } from '../tarjetas';
import { ComoDeja, DeDonde, EnlaceReportar, Micronutrientes, Reporte, Sello } from './AntesDeSumar';
import { Boton, Etiqueta, Icono, MACROS, Pastilla, Punto } from './comunes';
import { compartir } from './compartir';
import { gramosDeMacro, numero, opcionesDeIdioma, useNumeros } from './datos';

export type PorcionAbierta = { nombre: string; gramos: number };

/** Lo que la ventana necesita de un alimento, venga de la base, de lo propio o de una receta. */
export type AlimentoAbierto = {
  fuente: Fuente;
  ref: string;
  nombre: string;
  por100g: Valores;
  porciones: PorcionAbierta[];
  /** De dónde salen los valores, en una línea («Genérico · USDA FoodData Central»). */
  origen: string;
};

export type ModoDeVentana = { tipo: 'sumar' } | { tipo: 'canasta'; indice: number } | { tipo: 'registro'; id: string } | { tipo: 'ingrediente' };

type Medicion = { tipo: 'porcion'; indice: number; veces: number } | { tipo: 'peso'; valor: number } | { tipo: 'volumen'; valor: number };

const SECUNDARIOS = [['fibra', 'g'], ['azucares', 'g'], ['saturadas', 'g'], ['sodio', 'mg'], ['alcohol', 'g']] as const;
const ACEITES = [ACEITE.nada, ACEITE.cucharadita, ACEITE.cucharada, ACEITE.dosCucharadas];

/** De dónde salen los valores de un alimento de la base, en una línea. */
export function origenDe(d: Pick<Detalle, 'origen' | 'atribucion'>): string {
  if (d.origen === 'producto') return t(d.atribucion === 'off' ? 'comida.fuente.productoOff' : 'comida.fuente.producto');
  return t(`comida.fuente.${d.origen === 'usda' ? 'usda' : d.origen === 'receta' ? 'receta' : 'propio'}`);
}

/** Lo que cambia entre lo crudo y cada forma cocida: «a la plancha», «al horno»; si no tienen nada en común, el nombre entero. */
function diferencia(nombre: string, otro: string): string {
  let i = 0;
  while (i < nombre.length && i < otro.length && nombre[i].toLowerCase() === otro[i].toLowerCase()) i++;
  const corte = nombre.lastIndexOf(' ', i);
  const resto = corte > 0 ? nombre.slice(corte + 1).replace(/^[,\s]+/, '') : nombre;
  return resto ? resto.charAt(0).toUpperCase() + resto.slice(1) : nombre;
}

/** Un número escrito como se dice: «1,5», «1.5», «1½», «½». */
function leerNumero(texto: string): number | null {
  const FRACCION: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
  const m = texto.trim().match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔⅛])?$/);
  if (!m || (!m[1] && !m[2])) return null;
  const n = (m[1] ? Number(m[1].replace(',', '.')) : 0) + (m[2] ? FRACCION[m[2]] : 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** La medición con la que abre la ventana: la de la cantidad que trae, o la porción de siempre. */
function medicionInicial(c: Cantidad | undefined, porciones: PorcionAbierta[], sistema: Sistema): { medicion: Medicion; porciones: PorcionAbierta[]; conDesecho: boolean } {
  if (c && 'porcion' in c) {
    const i = porciones.findIndex((p) => p.nombre === c.porcion);
    if (i >= 0) return { medicion: { tipo: 'porcion', indice: i, veces: c.veces }, porciones, conDesecho: false };
    return { medicion: { tipo: 'porcion', indice: 0, veces: c.veces }, porciones: [{ nombre: c.porcion, gramos: c.gramosPorcion }, ...porciones], conDesecho: false };
  }
  if (c && c.ml != null) {
    const valor = sistema === 'imperial' ? Math.round((c.ml / ML_POR_ONZA_LIQUIDA) * 10) / 10 : Math.round(c.ml);
    return { medicion: { tipo: 'volumen', valor }, porciones, conDesecho: false };
  }
  if (c) {
    const gramos = c.bruto ?? c.gramos;
    const valor = sistema === 'imperial' ? Math.round((gramos / GRAMOS_POR_ONZA) * 10) / 10 : Math.round(gramos);
    return { medicion: { tipo: 'peso', valor }, porciones, conDesecho: c.bruto != null };
  }
  if (porciones.length) return { medicion: { tipo: 'porcion', indice: 0, veces: 1 }, porciones, conDesecho: false };
  return { medicion: { tipo: 'peso', valor: sistema === 'imperial' ? 3.5 : 100 }, porciones, conDesecho: false };
}

type Props = {
  alimento: AlimentoAbierto;
  inicial: Cantidad | undefined;
  estimadoInicial?: boolean;
  modo: ModoDeVentana;
  sistema: Sistema;
  /** Lo que quedaría en el día con estas kcal; sin meta, null. */
  restante: (kcal: number) => number | null;
  /** El día sin esto y su meta, para «cómo deja el día»; sin meta (o para un ingrediente), null. */
  dia: { antes: Macros; meta: Macros } | null;
  /** Para quién son las referencias de las vitaminas y los minerales. */
  persona: ParaQuien;
  favorito: boolean;
  alFavorito: () => void;
  alListo: (item: Item) => void;
  alQuitar?: () => void;
  alCerrar: () => void;
  abajo: number;
};

export function Ventana(p: Props) {
  const [alimento, setAlimento] = useState(p.alimento);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const inicio = useMemo(() => medicionInicial(p.inicial, p.alimento.porciones, p.sistema), [p.inicial, p.alimento.porciones, p.sistema]);
  const [porciones, setPorciones] = useState(inicio.porciones);
  const [medicion, setMedicion] = useState<Medicion>(inicio.medicion);
  const [conDesecho, setConDesecho] = useState(inicio.conDesecho);
  const [aceite, setAceite] = useState(p.inicial?.aceite ?? 0);
  const [estimado, setEstimado] = useState<boolean | null>(p.estimadoInicial ?? null);
  const [escrito, setEscrito] = useState<string | null>(null);
  const [deDonde, setDeDonde] = useState(false);
  const [reportando, setReportando] = useState(false);
  // Sin los números (Perfil › Los números): las figuras y las barras, sin calorías ni gramos.
  const numeros = useNumeros();
  const modo = p.modo.tipo;

  // Lo de la base trae además cómo se mide: las porciones, crudo o cocido, la cáscara, la densidad y el aceite.
  useEffect(() => {
    if (alimento.fuente !== 'base') return;
    let vigente = true;
    baseDeAlimentos.detalle(Number(alimento.ref), opcionesDeIdioma()).then((d) => {
      if (!vigente || !d) return;
      setDetalle(d);
      // Lo que se suma va con los valores de hoy de la base; lo ya registrado conserva los suyos.
      if (modo !== 'registro') setAlimento((a) => ({ ...a, por100g: d.por100g }));
      setPorciones((antes) => {
        const nuevas = d.porciones.filter((x) => !antes.some((a) => a.nombre === x.nombre && a.gramos === x.gramos));
        return antes.length ? [...antes, ...nuevas] : d.porciones;
      });
    }).catch(() => {});
    return () => {
      vigente = false;
    };
  }, [alimento.fuente, alimento.ref, modo]);

  const densidad = detalle?.densidad ?? null;
  const desecho = detalle?.desecho ?? null;
  const unidadPeso = unidadDePeso(p.sistema);
  const unidadVolumen = unidadDeVolumen(p.sistema);

  const cantidad: Exclude<Cantidad, null> = useMemo(() => {
    const conAceite = aceite > 0 ? { aceite } : {};
    if (medicion.tipo === 'porcion') {
      const porcion = porciones[medicion.indice] ?? porciones[0];
      return { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: medicion.veces, ...conAceite };
    }
    if (medicion.tipo === 'volumen') {
      const ml = aMl(medicion.valor, unidadVolumen);
      return { gramos: Math.round(gramosDeMl(ml, densidad) * 10) / 10, ml: Math.round(ml), ...conAceite };
    }
    const bruto = aGramos(medicion.valor, unidadPeso);
    if (conDesecho && desecho) return { gramos: Math.round(comestible(bruto, desecho.fraccion) * 10) / 10, bruto: Math.round(bruto), ...conAceite };
    return { gramos: Math.round(bruto * 10) / 10, ...conAceite };
  }, [medicion, porciones, aceite, conDesecho, desecho, densidad, unidadPeso, unidadVolumen]);
  const valores = valoresDeCantidad(alimento.por100g, cantidad);
  const aOjo = estimado ?? aOjoDeFabrica(cantidad);
  const restante = p.restante(valores.kcal);

  /** Pasar a la otra versión (crudo o cocido): el peso que se pesó sigue siendo el mismo. */
  const pasarA = (id: number) => {
    baseDeAlimentos.detalle(id, opcionesDeIdioma()).then((d) => {
      if (!d) return;
      Haptics.selectionAsync().catch(() => {});
      const gramos = gramosDe(cantidad) ?? 100;
      setAlimento({ fuente: 'base', ref: String(d.id), nombre: d.nombre, por100g: d.por100g, porciones: d.porciones, origen: origenDe(d) });
      setDetalle(d);
      setPorciones(d.porciones);
      setConDesecho(false);
      // El aceite elegido no sigue en una versión que ya lo trae (o que no lo pregunta).
      if (d.aceite !== 'preguntar') setAceite(0);
      setMedicion({ tipo: 'peso', valor: p.sistema === 'imperial' ? Math.round((gramos / GRAMOS_POR_ONZA) * 10) / 10 : Math.round(gramos) });
    }).catch(() => {});
  };

  const listo = () => {
    const item: Item = { fuente: alimento.fuente, ref: alimento.ref, nombre: alimento.nombre, cantidad, valores, ...(aOjo ? { estimado: true as const } : {}) };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    p.alListo(item);
  };

  const paso = (signo: 1 | -1) => {
    setEscrito(null);
    setMedicion((m) => (m.tipo === 'porcion' ? { ...m, veces: pasoDePorcion(m.veces, signo) } : { ...m, valor: pasoDeCantidad(m.valor, signo, m.tipo, p.sistema) }));
  };
  const multiplicar = (factor: number) => {
    setEscrito(null);
    Haptics.selectionAsync().catch(() => {});
    setMedicion((m) => (m.tipo === 'porcion' ? { ...m, veces: ajustar(m.veces, factor) } : { ...m, valor: Math.round(m.valor * factor * 10) / 10 }));
  };
  const escribir = (texto: string) => {
    setEscrito(texto);
    const n = leerNumero(texto);
    if (n === null) return;
    setMedicion((m) => (m.tipo === 'porcion' ? { ...m, veces: n } : { ...m, valor: n }));
  };

  const valorTexto = medicion.tipo === 'porcion' ? (numeroDePorcion(medicion.veces) ?? decimal(medicion.veces, idioma())) : decimal(medicion.valor, idioma());
  const unidadTexto = medicion.tipo === 'peso' ? unidadPeso : medicion.tipo === 'volumen' ? (unidadVolumen === 'floz' ? 'fl oz' : 'ml') : '';
  const comoGramos = medicion.tipo === 'porcion'
    ? `${cantidadDePorcion(medicion.veces, porciones[medicion.indice]?.nombre ?? '', idioma())} = ${decimal(gramosDe(cantidad) ?? 0, idioma())} g`
    : medicion.tipo === 'volumen' ? `= ${decimal(gramosDe(cantidad) ?? 0, idioma())} g` : '';

  // Crudo o cocido: lo crudo con sus formas cocidas, o lo cocido con su crudo y sus hermanas.
  const versiones = detalle && (detalle.crudo || detalle.cocidos.length)
    ? [
        ...(detalle.crudo ? [{ id: detalle.crudo.id, texto: t('comida.medir.crudo') }] : [{ id: detalle.id, texto: t('comida.medir.crudo') }]),
        ...(detalle.crudo ? [{ id: detalle.id, texto: diferencia(detalle.nombre, detalle.crudo.nombre) }] : []),
        ...detalle.cocidos.map((c) => ({ id: c.id, texto: diferencia(c.nombre, detalle.crudo?.nombre ?? detalle.nombre) })),
      ]
    : [];

  return (
    <Animated.View entering={ENTRA_HOJA} exiting={SALE_HOJA} style={[estilos.ventana, { paddingBottom: p.abajo + 10 }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} automaticallyAdjustKeyboardInsets>
        <View style={estilos.cabeza}>
          <View style={estilos.titulos}>
            <Text style={estilos.nombre}>{alimento.nombre}</Text>
            <Pressable
              onPress={() => setDeDonde(!deDonde)}
              style={estilos.origenFila}
              accessibilityRole="button"
              accessibilityLabel={t('comida.deDonde.titulo')}
              accessibilityState={{ expanded: deDonde }}
            >
              <Text style={estilos.origen}>{[detalle ? origenDe(detalle) : alimento.origen, detalle?.marca].filter(Boolean).join(' · ')}</Text>
              {detalle && <Sello verificado={!!detalle.verificado} />}
            </Pressable>
          </View>
          {(alimento.fuente === 'receta' || alimento.fuente === 'propio') && (
            <Pressable onPress={() => { compartir(alimento.fuente, alimento.ref).catch(() => {}); }} style={estilos.redondo} accessibilityRole="button" accessibilityLabel={t('compartir.boton')}>
              <Icono nombre="square.and.arrow.up" tam={17} color={colores.oroClaro} />
            </Pressable>
          )}
          <Pressable onPress={p.alFavorito} style={estilos.redondo} accessibilityRole="button" accessibilityLabel={t('comida.favorito')} accessibilityState={{ selected: p.favorito }}>
            <Icono nombre={p.favorito ? 'star.fill' : 'star'} tam={19} color={p.favorito ? colores.oro : colores.oroClaro} />
          </Pressable>
          <Pressable onPress={p.alCerrar} style={estilos.redondo} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')}>
            <Icono nombre="xmark" tam={14} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
          </Pressable>
        </View>

        {deDonde && <DeDonde detalle={detalle} origen={alimento.origen} />}

        {/* Lo que más cambia los números va primero: el arroz crudo tiene casi el triple que el cocido. */}
        {versiones.length > 1 && (
          <Aparece>
            <Etiqueta estilo={estilos.etiquetaArriba}>{`${t('comida.medir.crudo')} · ${t('comida.medir.cocido')}`}</Etiqueta>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
              {versiones.map((v) => <Pastilla key={v.id} texto={v.texto} elegida={v.id === Number(alimento.ref)} alTocar={() => v.id !== Number(alimento.ref) && pasarA(v.id)} />)}
            </ScrollView>
            <Rinde detalle={detalle} />
          </Aparece>
        )}

        {numeros && (
          <View style={estilos.cifras}>
            <Text style={estilos.kcal}>
              {numero(Math.round(valores.kcal))}
              <Text style={estilos.kcalUnidad}>{`  ${t('comida.kcal').toUpperCase()}`}</Text>
            </Text>
            <View style={estilos.macros}>
              {MACROS.map((m) => (
                <View key={m} style={estilos.macro}>
                  <Punto macro={m} />
                  <Text style={estilos.macroTexto}>{`${gramosDeMacro(valores[m])} g`}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {numeros && restante !== null && <Text style={estilos.queda}>{t(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) })}</Text>}
        {p.dia && <ComoDeja antes={p.dia.antes} esto={valores} meta={p.dia.meta} numeros={numeros} />}
        {numeros && (
          <Text style={estilos.secundarios}>
            {SECUNDARIOS.filter(([k]) => valores[k] != null && !(k === 'alcohol' && valores[k] === 0))
              .map(([k, unidad]) => `${t(`comida.secundarios.${k}`)} ${numero(valores[k]!, unidad === 'g' && valores[k]! < 10 ? 1 : 0)} ${unidad}`)
              .join('   ')}
          </Text>
        )}
        {numeros && valores.micros && <Micronutrientes micros={valores.micros} persona={p.persona} />}

        <Etiqueta estilo={estilos.etiqueta}>{t('comida.porcion')}</Etiqueta>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila} keyboardShouldPersistTaps="handled">
          {porciones.map((x, i) => (
            <Pastilla
              key={`${x.nombre}-${x.gramos}`}
              texto={x.nombre}
              detalle={`${decimal(x.gramos, idioma())} g`}
              elegida={medicion.tipo === 'porcion' && medicion.indice === i}
              alTocar={() => {
                setEscrito(null);
                setMedicion({ tipo: 'porcion', indice: i, veces: 1 });
              }}
            />
          ))}
          <Pastilla
            texto={p.sistema === 'imperial' ? t('comida.medir.onzas') : t('comida.gramos')}
            detalle={unidadPeso}
            elegida={medicion.tipo === 'peso'}
            alTocar={() => {
              setEscrito(null);
              const g = gramosDe(cantidad) ?? 100;
              setMedicion({ tipo: 'peso', valor: p.sistema === 'imperial' ? Math.round((g / GRAMOS_POR_ONZA) * 10) / 10 : Math.round(g) });
            }}
          />
          {densidad != null && (
            <Pastilla
              texto={p.sistema === 'imperial' ? t('comida.medir.onzasLiquidas') : t('comida.medir.mililitros')}
              detalle={unidadVolumen === 'floz' ? 'fl oz' : 'ml'}
              elegida={medicion.tipo === 'volumen'}
              alTocar={() => {
                setEscrito(null);
                const ml = (gramosDe(cantidad) ?? 100) / densidad;
                setMedicion({ tipo: 'volumen', valor: p.sistema === 'imperial' ? Math.round((ml / ML_POR_ONZA_LIQUIDA) * 10) / 10 : Math.round(ml) });
              }}
            />
          )}
        </ScrollView>

        <Etiqueta estilo={estilos.etiqueta}>{t('comida.cantidad')}</Etiqueta>
        <View style={estilos.cantidad}>
          <View style={estilos.pasos}>
            <Pressable onPress={() => paso(-1)} style={estilos.paso} accessibilityRole="button" accessibilityLabel="−">
              <Icono nombre="minus" tam={16} peso="semibold" />
            </Pressable>
            <TextInput
              value={escrito ?? valorTexto}
              onChangeText={escribir}
              onBlur={() => setEscrito(null)}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={estilos.valor}
              accessibilityLabel={t('comida.medir.escribir')}
            />
            {unidadTexto ? <Text style={estilos.unidad}>{unidadTexto}</Text> : null}
            <Pressable onPress={() => paso(1)} style={estilos.paso} accessibilityRole="button" accessibilityLabel="+">
              <Icono nombre="plus" tam={16} peso="semibold" />
            </Pressable>
          </View>
          <View style={estilos.ajustes}>
            {AJUSTES.map((f) => (
              <Pressable key={f} onPress={() => multiplicar(f)} style={estilos.ajuste} accessibilityRole="button">
                <Text style={estilos.ajusteTexto}>{`×${numeroDePorcion(f)}`}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {comoGramos ? <Text style={estilos.comoGramos}>{comoGramos}</Text> : null}

        {desecho && medicion.tipo === 'peso' && (
          <Aparece style={estilos.filaSimple}>
            <Pastilla texto={t('comida.medir.con', { que: desecho.que })} elegida={conDesecho} alTocar={() => setConDesecho(!conDesecho)} />
            {conDesecho && <Aparece><Text style={estilos.nota}>{t('comida.medir.sinDesecho', { n: decimal(gramosDe(cantidad) ?? 0, idioma()), que: desecho.que })}</Text></Aparece>}
          </Aparece>
        )}

        {detalle?.aceite === 'preguntar' && (
          <>
            <Etiqueta estilo={estilos.etiqueta}>{t('comida.medir.aceite')}</Etiqueta>
            <View style={estilos.fila}>
              {ACEITES.map((g, i) => <Pastilla key={g} texto={lista('comida.medir.aceites')[i]} elegida={Math.abs(aceite - g) < 0.05} alTocar={() => setAceite(g)} />)}
            </View>
          </>
        )}
        {detalle?.aceite === 'incluido' && <Text style={[estilos.nota, estilos.notaSuelta]}>{t('comida.medir.aceiteIncluido')}</Text>}

        <View style={[estilos.fila, estilos.filaPesado]}>
          <Pastilla texto={t('comida.medir.pesado')} elegida={!aOjo} alTocar={() => setEstimado(false)} />
          <Pastilla texto={t('comida.medir.aOjo')} elegida={aOjo} alTocar={() => setEstimado(true)} />
        </View>

        {detalle?.receta && (
          <Text style={[estilos.nota, estilos.notaSuelta]}>
            {`${t('comida.medir.ingredientes', { peso: numero(detalle.receta.pesoFinal) })}: ${detalle.receta.ingredientes.map((i) => `${i.nombre} ${numero(i.gramos)} g`).join(', ')}`}
          </Text>
        )}

        <View style={estilos.pie}>
          <Boton tipo="grande" texto={p.modo.tipo === 'sumar' || p.modo.tipo === 'ingrediente' ? t('comida.sumar') : t('comun.guardar')} alTocar={listo} />
          {p.alQuitar && <Boton tipo="quitar" texto={t('comida.quitar')} alTocar={p.alQuitar} />}
        </View>
        {(alimento.fuente === 'base' || alimento.fuente === 'catalogo' || alimento.fuente === 'off') && <EnlaceReportar alTocar={() => setReportando(true)} />}
      </ScrollView>
      {reportando && (
        <Reporte
          alimento={alimento.fuente === 'off' ? null : Number(alimento.ref)}
          codigo={alimento.fuente === 'off' ? alimento.ref : null}
          nombre={alimento.nombre}
          alCerrar={() => setReportando(false)}
          abajo={p.abajo}
        />
      )}
    </Animated.View>
  );
}

/** Cuánto rinde lo crudo al cocinarlo, para quien pesa antes de cocinar: «100 g crudo dan unos 280 g cocido». */
function Rinde({ detalle }: { detalle: Detalle | null }) {
  const [delCrudo, setDelCrudo] = useState<Detalle['por100g'] | null>(null);
  const crudo = detalle?.crudo;
  useEffect(() => {
    if (!crudo) return;
    let vigente = true;
    baseDeAlimentos.detalle(crudo.id, opcionesDeIdioma()).then((d) => {
      if (vigente && d) setDelCrudo(d.por100g);
    }).catch(() => {});
    return () => {
      vigente = false;
    };
  }, [crudo]);
  const rinde = crudo && delCrudo && detalle ? rindeAlCocinar(delCrudo, detalle.por100g, detalle.aceite) : null;
  if (!rinde) return null;
  return <Text style={[estilos.nota, estilos.notaSuelta]}>{t('comida.medir.rinde', { n: numero(Math.round(rinde * 10) * 10) })}</Text>;
}

const estilos = StyleSheet.create({
  ventana: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%', paddingTop: 16, paddingHorizontal: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: colores.ventana, borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 25, shadowOffset: { width: 0, height: -18 },
  },
  cabeza: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titulos: { flex: 1, minWidth: 0 },
  nombre: { marginTop: 2, fontFamily: letras.numeroMedio, fontSize: 24, lineHeight: 27, color: colores.pergamino },
  origenFila: { marginTop: 5, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  origen: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: 'rgba(239, 230, 207, 0.48)' },
  redondo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  cifras: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  kcal: { fontFamily: letras.numeroLiviano, fontSize: 48, lineHeight: 50, letterSpacing: -1, color: colores.cifra, fontVariant: ['tabular-nums'] },
  kcalUnidad: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2, color: 'rgba(239, 230, 207, 0.6)' },
  macros: { flexDirection: 'row', gap: 12 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  macroTexto: { fontFamily: letras.numeroMedio, fontSize: 13, color: 'rgba(239, 230, 207, 0.82)', fontVariant: ['tabular-nums'] },
  queda: { marginTop: 6, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.78)' },
  secundarios: { marginTop: 8, fontFamily: letras.texto, fontSize: 12, lineHeight: 16, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
  etiqueta: { marginTop: 18, marginBottom: 8 },
  etiquetaArriba: { marginTop: 14, marginBottom: 8 },
  fila: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, paddingRight: 18 },
  filaSimple: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaPesado: { marginTop: 16 },
  cantidad: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  pasos: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  valor: { width: 66, paddingHorizontal: 4, outlineWidth: 0, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  unidad: { marginLeft: -4, marginRight: 4, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.6)' },
  ajustes: { flexDirection: 'row', gap: 6 },
  ajuste: { minWidth: 46, height: 36, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', alignItems: 'center', justifyContent: 'center' },
  ajusteTexto: { fontFamily: letras.texto, fontSize: 15, color: 'rgba(239, 230, 207, 0.8)' },
  comoGramos: { marginTop: 11, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
  nota: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.6)' },
  notaSuelta: { marginTop: 12 },
  pie: { marginTop: 18, gap: 8 },
});
