// El widget de la comida (spec/widgets.md, D43). En la pantalla de inicio, como se aprobó el 25/11/2026
// (galeria/src/widgets-mejores.js): lo que queda en grande, la luna chica y los tres macros en barras finas;
// en el mediano, las comidas al lado; en el grande, además, los últimos siete días contra la meta. Un toque en
// una comida que falta anota tu comida de siempre sin abrir Moss: queda «Anotado ✓» y otro toque lo deshace.
// Corre en la extensión y vive solo (como Cielo.widget.tsx): todo llega en las props. Lleva una entrada
// por día: un toque se guarda solo en la entrada que se ve, y con una por comida se perdería al cambiar.

import {
  AccessoryWidgetBackground, Button, Chart, Circle, Ellipse, Gauge, HStack, Image, Link, Mask, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel, background, blur, buttonStyle, containerBackground, contentTransition, font, foregroundStyle, frame, gaugeStyle, kerning, lineLimit,
  minimumScaleFactor, monospacedDigit, offset, opacity, padding, resizable, shapes, strokeBorder, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { ComidaDeHoy, PropsHoy, ToqueDeComida } from './tipos';

const Hoy = (props: PropsHoy, entorno: WidgetEnvironment) => {
  'widget';
  let TEXTO = '#efe6cf';
  let CIFRA = '#fbf2d9';
  let LUZ = '#f6e3a6';
  let ORO = '#e8c46a';
  let SALVIA = '#a6bf94';
  let AZUL = '#a9c4f5';
  let familia = entorno.widgetFamily;
  let acento = /accent/i.test(String(entorno.widgetRenderingMode));
  let vibrante = /vibrant/i.test(String(entorno.widgetRenderingMode));
  let sinFondo = acento || vibrante || (entorno as { showsContainerBackground?: boolean }).showsContainerBackground === false || !!entorno.isLuminanceReduced;
  let tx = props.textos || { teQuedan: '', deMas: '', kcal: 'kcal', quedan: '', sobra: '', anotado: '', miles: '.', cortos: { p: 'P', c: 'C', g: 'G' }, semana: '', meta: '' };
  let urls = props.urls || { anotar: 'moss://', inicio: 'moss://', comida: 'moss://', anotarComida: 'moss://' };
  let meta = props.meta || { kcal: 0, p: 0, c: 0, g: 0 };
  let base = props.comido || { kcal: 0, p: 0, c: 0, g: 0 };
  let comido = { kcal: base.kcal, p: base.p, c: base.c, g: base.g };
  let pendientes = props.pendientes || [];
  // Con los números ocultos (Perfil): la luna, las barras y las comidas, sin kcal ni gramos.
  let numeros = props.numeros !== false;

  function numero(n: number) {
    return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, tx.miles);
  }

  // Lo que dice la app, con lo tocado en el widget encima. El estado de cada comida:
  // anotada (en Moss), tocada («Anotado ✓», se deshace con otro toque), siempre (+633) o vacia (+).
  let filas: { c: ComidaDeHoy; estado: 'anotada' | 'tocada' | 'siempre' | 'vacia'; kcal: number }[] = [];
  let lista = props.comidas || [];
  for (let i = 0; i < lista.length; i++) {
    let c = lista[i];
    let toque: ToqueDeComida | null = null;
    for (let k = 0; k < pendientes.length; k++) if (pendientes[k].comida === c.tipo) toque = pendientes[k];
    if (c.deshacer) {
      if (toque && !toque.hecho) {
        comido.kcal -= c.anotado.kcal;
        comido.p -= c.anotado.p;
        comido.c -= c.anotado.c;
        comido.g -= c.anotado.g;
        filas.push({ c: c, estado: 'siempre', kcal: c.siempre.kcal || c.anotado.kcal });
      } else filas.push({ c: c, estado: 'tocada', kcal: c.anotado.kcal });
    } else if (c.anotada) {
      filas.push({ c: c, estado: 'anotada', kcal: c.anotado.kcal });
    } else if (c.siempre.kcal > 0) {
      if (toque && toque.hecho) {
        comido.kcal += c.siempre.kcal;
        comido.p += c.siempre.p;
        comido.c += c.siempre.c;
        comido.g += c.siempre.g;
        filas.push({ c: c, estado: 'tocada', kcal: c.siempre.kcal });
      } else filas.push({ c: c, estado: 'siempre', kcal: c.siempre.kcal });
    } else filas.push({ c: c, estado: 'vacia', kcal: 0 });
  }

  let queda = meta.kcal - comido.kcal;
  let pasada = queda < 0;
  let fraccion = meta.kcal > 0 ? comido.kcal / meta.kcal : 0;
  let etiqueta = pasada ? tx.deMas : tx.teQuedan;
  let cifra = numero(queda);
  // Donde no va la etiqueta («Arriba de la meta»), pasada la meta lleva el «+», como los macros.
  let conSigno = (pasada ? '+' : '') + cifra;
  let macros = [
    { k: 'p', corto: tx.cortos.p, color: LUZ, come: comido.p, tope: meta.p },
    { k: 'c', corto: tx.cortos.c, color: SALVIA, come: comido.c, tope: meta.c },
    { k: 'g', corto: tx.cortos.g, color: AZUL, come: comido.g, tope: meta.g },
  ];
  function falta(m: (typeof macros)[number]) {
    let f = m.tope - m.come;
    return (f < 0 ? '+' : '') + numero(f);
  }

  // Una barra finita: el fondo tenue y lo comido encima, de su color; pasada la meta, en oro.
  function barra(m: (typeof macros)[number], ancho: number) {
    let f = m.tope > 0 ? Math.min(1, Math.max(0, m.come / m.tope)) : 0;
    return (
      <ZStack alignment="leading" modifiers={[frame({ width: ancho, height: 3 })]}>
        <Rectangle modifiers={[foregroundStyle(TEXTO), opacity(0.14), frame({ width: ancho, height: 3 })]} />
        <Rectangle modifiers={[foregroundStyle(acento || vibrante ? TEXTO : m.come > m.tope ? ORO : m.color), frame({ width: Math.max(0.5, ancho * f), height: 3 })]} />
      </ZStack>
    );
  }

  // La luna: un disco oscuro, y lo iluminado es medio disco más o menos una elipse. Los mares van con
  // blur, adentro de la máscara. En tintado, un anillo: la elipse oscura no se puede dibujar de un color.
  function luna(d: number) {
    if (acento) {
      return <Gauge value={Math.min(1, Math.max(0, fraccion))} modifiers={[gaugeStyle('circularCapacity'), frame({ width: d, height: d })]} />;
    }
    let p = 0.04 + 0.96 * Math.min(1, Math.max(0, fraccion));
    let r = d / 2;
    let ancho = Math.abs(Math.cos(Math.PI * p)) * d;
    let creciente = p < 0.5;
    let noche = vibrante ? '#000000' : { type: 'radialGradient' as const, colors: ['#1b2342', '#0b1022'], center: { x: 0.4, y: 0.38 }, startRadius: 0, endRadius: d * 0.72 };
    let cara = vibrante ? '#ffffff' : { type: 'radialGradient' as const, colors: ['#fffaf0', '#f0e5ca', '#d6c39b', '#bfa77a'], center: { x: 0.36, y: 0.32 }, startRadius: 0, endRadius: d * 0.76 };
    let mares: ReactElement[] = [];
    if (!vibrante) {
      let lugares = [[-0.3, -0.35, 0.28, 0.21], [0.12, -0.25, 0.18, 0.15], [0.32, 0, 0.19, 0.17], [-0.5, 0.15, 0.19, 0.32], [-0.05, 0.38, 0.16, 0.11], [0.5, 0.35, 0.11, 0.09]];
      for (let m = 0; m < lugares.length; m++) {
        let l = lugares[m];
        mares.push(<Ellipse key={'m' + m} modifiers={[foregroundStyle('#a48d62'), opacity(0.42), frame({ width: l[2] * d, height: l[3] * d }), blur(d * 0.025), offset({ x: l[0] * r, y: l[1] * r })]} />);
      }
    }
    return (
      <ZStack modifiers={[frame({ width: d, height: d })]}>
        <Circle key="noche" modifiers={[foregroundStyle(noche), opacity(vibrante ? 0.35 : 1), frame({ width: d, height: d })]} />
        <Mask key="luz">
          <ZStack modifiers={[frame({ width: d, height: d })]}>
            <Circle modifiers={[foregroundStyle(cara), frame({ width: d, height: d })]} />
            {mares}
          </ZStack>
          <Mask.Content>
            <ZStack modifiers={[frame({ width: d, height: d })]}>
              <UnevenRoundedRectangle key="medio" topTrailingRadius={r} bottomTrailingRadius={r} modifiers={[frame({ width: r, height: d }), offset({ x: r / 2 })]} />
              {creciente ? null : <Ellipse key="mas" modifiers={[frame({ width: ancho, height: d })]} />}
            </ZStack>
          </Mask.Content>
        </Mask>
        {creciente ? <Ellipse key="menos" modifiers={[foregroundStyle(vibrante ? '#000000' : '#10162e'), frame({ width: ancho, height: d })]} /> : null}
        <Circle key="borde" modifiers={[strokeBorder({ content: pasada ? ORO : LUZ, style: { lineWidth: pasada ? 1 : 0.6 } }), opacity(pasada ? 0.7 : 0.25), frame({ width: d, height: d })]} />
      </ZStack>
    );
  }

  // ---------------------------------------------------------------- la pantalla bloqueada
  if (familia === 'accessoryInline') {
    return <Text modifiers={[widgetURL(urls.inicio)]}>{numeros ? conSigno + ' ' + tx.kcal + ' · ' + tx.cortos.p + ' ' + falta(macros[0]) : ''}</Text>;
  }
  if (familia === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(urls.inicio)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={1}>
          {luna(36)}
          {numeros ? <Text modifiers={[font({ size: 12.5, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{conSigno}</Text> : null}
        </VStack>
      </ZStack>
    );
  }
  if (familia === 'accessoryRectangular' && !numeros) {
    return (
      <VStack alignment="leading" modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground('clear', 'widget'), widgetURL(urls.inicio)]}>
        {luna(36)}
      </VStack>
    );
  }
  if (familia === 'accessoryRectangular') {
    let secundario = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
    return (
      <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground('clear', 'widget'), widgetURL(urls.inicio)]}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), secundario, lineLimit(1)]}>{etiqueta}</Text>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{cifra + ' ' + tx.kcal}</Text>
        <Text modifiers={[font({ size: 12 }), secundario, monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8)]}>{macros.map((m) => m.corto + ' ' + falta(m)).join(' · ')}</Text>
      </VStack>
    );
  }

  // ---------------------------------------------------------------- las comidas
  function alTocar(tipo: ComidaDeHoy['tipo'], ahora: boolean) {
    return () => {
      let nuevos: ToqueDeComida[] = [];
      for (let p = 0; p < pendientes.length; p++) if (pendientes[p].comida !== tipo) nuevos.push(pendientes[p]);
      nuevos.push({ comida: tipo, hecho: !ahora, en: Date.now() });
      return { pendientes: nuevos };
    };
  }
  let dondeSinAnotar = (tipo: string) => urls.anotarComida.replace('{comida}', tipo);

  // Lo que hace el toque: lo de siempre y lo tocado se anotan y se deshacen ahí; lo demás abre Moss.
  function tocable(f: (typeof filas)[number], contenido: ReactElement, clave: string) {
    if (f.estado === 'siempre' || f.estado === 'tocada') {
      return (
        <Button
          key={clave}
          target={'comida|' + props.dia + '|' + f.c.tipo}
          onPress={alTocar(f.c.tipo, f.estado === 'tocada')}
          modifiers={[buttonStyle('plain'), accessibilityLabel(f.c.nombre)]}>
          {contenido}
        </Button>
      );
    }
    return <Link key={clave} destination={f.estado === 'anotada' ? urls.comida : dondeSinAnotar(f.c.tipo)}>{contenido}</Link>;
  }

  // Una comida: el nombre y, a la derecha, lo anotado quieto, «+633» de un toque, «+» para elegir o «Anotado ✓».
  function comida(f: (typeof filas)[number]) {
    let anotada = f.estado === 'anotada';
    let tocada = f.estado === 'tocada';
    let pastilla = [padding({ horizontal: 9 }), frame({ minWidth: 24, minHeight: 24 })];
    let valor = anotada ? (
      numeros ? (
        <Text modifiers={[font({ size: 12.5 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{numero(f.kcal)}</Text>
      ) : (
        <Image systemName="checkmark" size={10} color={TEXTO} modifiers={[opacity(0.5)]} />
      )
    ) : tocada ? (
      <HStack spacing={3} modifiers={[...pastilla, background('#f6e3a626', shapes.capsule()), strokeBorder({ content: '#f6e3a680', style: { lineWidth: 1 }, shape: 'capsule' })]}>
        <Text modifiers={[font({ size: 12.5, weight: 'medium' }), foregroundStyle(LUZ), lineLimit(1), minimumScaleFactor(0.75)]}>{tx.anotado}</Text>
        <Image systemName="checkmark" size={9} color={LUZ} />
      </HStack>
    ) : f.estado === 'siempre' && numeros ? (
      <Text modifiers={[font({ size: 12.5, weight: 'medium' }), monospacedDigit(), foregroundStyle(LUZ), lineLimit(1), ...pastilla, strokeBorder({ content: '#f6e3a673', style: { lineWidth: 1 }, shape: 'capsule' })]}>{'+' + numero(f.kcal)}</Text>
    ) : (
      <Image systemName="plus" size={11} color={LUZ} modifiers={[frame({ width: 24, height: 24 }), strokeBorder({ content: f.estado === 'siempre' ? '#f6e3a673' : '#f6e3a64d', style: { lineWidth: 1 }, shape: 'circle' })]} />
    );
    let contenido = (
      <HStack spacing={8} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), opacity(anotada ? 0.6 : 1), lineLimit(1), minimumScaleFactor(0.85)]}>{f.c.nombre}</Text>
        <Spacer />
        {valor}
      </HStack>
    );
    return tocable(f, contenido, 'c' + f.c.tipo);
  }

  // ---------------------------------------------------------------- la pantalla de inicio
  // Lo de la izquierda, igual en los tres tamaños: la luna chica, la cifra, «te quedan» y las tres barras.
  function izquierda() {
    return (
      <VStack key="izquierda" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        {luna(34)}
        <Spacer />
        {numeros ? (
          <Text modifiers={[font({ size: 42, weight: 'light', design: 'rounded' }), monospacedDigit(), kerning(-1), foregroundStyle(pasada ? ORO : CIFRA), contentTransition('numericText'), lineLimit(1), minimumScaleFactor(0.6)]}>{cifra}</Text>
        ) : null}
        {numeros ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1), minimumScaleFactor(0.8), padding({ top: 4 })]}>{pasada ? tx.sobra : tx.quedan}</Text>
        ) : null}
        <HStack spacing={8} modifiers={[padding({ top: 12 })]}>
          {macros.map((m) => (
            <VStack key={m.k} alignment="leading" spacing={4}>
              <Text modifiers={[font({ size: 9, weight: 'medium' }), kerning(0.4), foregroundStyle(TEXTO), opacity(0.6)]}>{m.corto}</Text>
              {barra(m, 33)}
            </VStack>
          ))}
        </HStack>
      </VStack>
    );
  }

  // Lo de arriba del mediano y del grande: lo mismo a la izquierda y tus comidas a la derecha, sin el snack.
  function conComidas() {
    return (
      <HStack key="arriba" spacing={14} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <ZStack modifiers={[frame({ width: 116 })]}>{izquierda()}</ZStack>
        <Rectangle modifiers={[foregroundStyle(TEXTO), opacity(0.12), frame({ width: 0.5 })]} />
        <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>{filas.filter((f) => f.c.tipo !== 'snack').slice(0, 4).map(comida)}</VStack>
      </HStack>
    );
  }

  // Tus últimos siete días, con hoy a la derecha: lo comido contra la meta (la línea punteada); lo que la pasa, en oro.
  function semana() {
    let dias = (props.semana || []).slice(-6).concat([comido.kcal]);
    let letras = props.letras || [];
    let alto = Math.max(meta.kcal, ...dias);
    let datos: { x: string; y: number; color: string }[] = [];
    for (let i = 0; i < dias.length; i++) {
      let hoy = i === dias.length - 1;
      let x = String(i);
      let kcal = Math.max(0, dias[i]);
      let debajo = meta.kcal > 0 ? Math.min(kcal, meta.kcal) : kcal;
      // Un día sin nada, una marca chiquita para que se vea que está.
      if (!kcal) datos.push({ x: x, y: alto * 0.02, color: '#efe6cf1f' });
      else datos.push({ x: x, y: debajo, color: hoy ? LUZ : '#efe6cf33' });
      if (kcal > debajo) datos.push({ x: x, y: kcal - debajo, color: ORO });
    }
    return (
      <VStack key="semana" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), padding({ top: 12 })]}>
        <HStack spacing={8}>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(TEXTO), lineLimit(1)]}>{tx.semana}</Text>
          <Spacer />
          {numeros && meta.kcal > 0 ? <Text modifiers={[font({ size: 11 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{tx.meta.replace('{n}', numero(meta.kcal))}</Text> : null}
        </HStack>
        <Chart
          type="bar"
          data={datos}
          showGrid={false}
          animate={false}
          barStyle={{ width: 12, cornerRadius: 3 }}
          referenceLines={meta.kcal > 0 ? [{ x: 'meta', y: meta.kcal, color: '#efe6cf4d' }] : []}
          ruleStyle={{ lineWidth: 1, dashArray: [3, 3] }}
          modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), padding({ top: 12 })]}
        />
        <HStack spacing={0} modifiers={[padding({ top: 6 })]}>
          {letras.slice(-7).map((l, i) => (
            <Text key={'l' + i} modifiers={[font({ size: 10, weight: 'medium' }), foregroundStyle(i === 6 ? LUZ : TEXTO), opacity(i === 6 ? 1 : 0.6), frame({ maxWidth: Infinity, alignment: 'center' })]}>{l}</Text>
          ))}
        </HStack>
      </VStack>
    );
  }

  let fondo = containerBackground(
    { type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );
  // El cielo de verdad, muy tenue: el mismo del widget del cielo, para que se vean de la misma familia.
  let cielo = sinFondo || !props.fondo ? null : (
    <Image key="cielo" uiImage={props.fondo} modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: familia === 'systemLarge' ? 0 : -98 }), opacity(0.14), frame({ width: 1, height: 1 })]} />
  );

  let contenido: ReactElement;
  if (familia === 'systemLarge') {
    contenido = (
      <VStack key="grande" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <ZStack modifiers={[frame({ height: 126 })]}>{conComidas()}</ZStack>
        <Rectangle modifiers={[foregroundStyle(TEXTO), opacity(0.12), frame({ height: 0.5 }), padding({ top: 14 })]} />
        {semana()}
      </VStack>
    );
  } else if (familia === 'systemMedium') {
    contenido = conComidas();
  } else {
    contenido = izquierda();
  }

  return (
    <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), fondo, widgetURL(familia === 'systemSmall' ? urls.anotar : urls.inicio)]}>
      {cielo}
      {contenido}
    </ZStack>
  );
};

const INICIAL: PropsHoy = {
  dia: '',
  meta: { kcal: 0, p: 0, c: 0, g: 0 },
  comido: { kcal: 0, p: 0, c: 0, g: 0 },
  comidas: [],
  pendientes: [],
  semana: [],
  letras: [],
  numeros: true,
  textos: { teQuedan: '', deMas: '', kcal: 'kcal', quedan: '', sobra: '', anotado: '', miles: '.', cortos: { p: 'P', c: 'C', g: 'G' }, semana: '', meta: '' },
  urls: { anotar: 'moss://', inicio: 'moss://', comida: 'moss://', anotarComida: 'moss://' },
  fondo: '',
};

export default createWidget<PropsHoy>('Hoy', Hoy, INICIAL);
