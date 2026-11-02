// El widget de la comida (spec/widgets.md, D43), como se aprobó en la galería (galeria/src/widgets-nuevos.js):
// la luna, lo que queda y los macros; en el mediano y el grande, las comidas del día. Un toque en una
// comida que falta anota tu comida de siempre sin abrir Moss: queda «Anotado ✓» y otro toque lo deshace.
// Corre en la extensión y vive solo (como Cielo.widget.tsx): todo llega en las props. Lleva una entrada
// por día: un toque se guarda solo en la entrada que se ve, y con una por comida se perdería al cambiar.
// Va con la próxima build: se declara en app.json (herramientas/preparar-proxima-build.mjs).

import {
  AccessoryWidgetBackground, Button, Circle, Ellipse, Gauge, HStack, Image, Link, Mask, Rectangle, Spacer, Text, UnevenRoundedRectangle, VStack, ZStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel, background, blur, buttonStyle, containerBackground, contentTransition, font, foregroundStyle, frame, gaugeStyle, kerning, lineLimit,
  minimumScaleFactor, monospacedDigit, offset, opacity, padding, resizable, shapes, strokeBorder, textCase, widgetURL,
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
  let tx = props.textos || { teQuedan: '', deMas: '', kcal: 'kcal', de: '', anotado: '', sinAnotar: '', miles: '.', macros: { p: '', c: '', g: '' }, cortos: { p: 'P', c: 'C', g: 'G' }, buscar: '', decir: '', codigo: '' };
  let urls = props.urls || { anotar: 'moss://', inicio: 'moss://', comida: 'moss://', anotarComida: 'moss://', buscar: 'moss://', decir: 'moss://', codigo: 'moss://' };
  let meta = props.meta || { kcal: 0, p: 0, c: 0, g: 0 };
  let base = props.comido || { kcal: 0, p: 0, c: 0, g: 0 };
  let comido = { kcal: base.kcal, p: base.p, c: base.c, g: base.g };
  let pendientes = props.pendientes || [];

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
    } else if (c.anotado.kcal > 0) {
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
  let macros = [
    { k: 'p', nombre: tx.macros.p, corto: tx.cortos.p, color: LUZ, come: comido.p, tope: meta.p },
    { k: 'c', nombre: tx.macros.c, corto: tx.cortos.c, color: SALVIA, come: comido.c, tope: meta.c },
    { k: 'g', nombre: tx.macros.g, corto: tx.cortos.g, color: AZUL, come: comido.g, tope: meta.g },
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

  let etiquetaVista = (
    <Text modifiers={[font({ size: 9.5, weight: 'semibold' }), kerning(1.3), textCase('uppercase'), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1), minimumScaleFactor(0.8)]}>{etiqueta}</Text>
  );
  function cifraVista(tamano: number) {
    return (
      <HStack spacing={4} alignment="lastTextBaseline">
        <Text modifiers={[font({ size: tamano, weight: 'light', design: 'rounded' }), monospacedDigit(), foregroundStyle(pasada ? ORO : CIFRA), contentTransition('numericText'), lineLimit(1), minimumScaleFactor(0.7)]}>{cifra}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(TEXTO), opacity(0.6)]}>{tx.kcal}</Text>
      </HStack>
    );
  }

  // ---------------------------------------------------------------- la pantalla bloqueada
  if (familia === 'accessoryInline') {
    return <Text modifiers={[widgetURL(urls.inicio)]}>{cifra + ' ' + tx.kcal + ' · ' + tx.cortos.p + ' ' + falta(macros[0])}</Text>;
  }
  if (familia === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(urls.inicio)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={1}>
          {luna(36)}
          <Text modifiers={[font({ size: 12.5, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{cifra}</Text>
        </VStack>
      </ZStack>
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

  function chip(f: (typeof filas)[number]) {
    let tocada = f.estado === 'tocada';
    let abierta = f.estado === 'siempre' || f.estado === 'vacia';
    let valor = f.estado === 'anotada' ? (
      <Text modifiers={[font({ size: 13, weight: 'medium' }), monospacedDigit(), foregroundStyle(TEXTO), lineLimit(1)]}>{numero(f.kcal)}</Text>
    ) : tocada ? (
      <HStack spacing={2}>
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(LUZ), lineLimit(1), minimumScaleFactor(0.75)]}>{tx.anotado}</Text>
        <Image systemName="checkmark" size={9} color={LUZ} />
      </HStack>
    ) : (
      <Text modifiers={[font({ size: 13, weight: 'medium' }), monospacedDigit(), foregroundStyle(LUZ), lineLimit(1)]}>{f.estado === 'siempre' ? '+' + numero(f.kcal) : '+'}</Text>
    );
    let contenido = (
      <VStack
        alignment="leading"
        spacing={2}
        modifiers={[
          frame({ maxWidth: Infinity, minHeight: 44, alignment: 'leading' }),
          padding({ horizontal: 7 }),
          background(tocada ? '#f6e3a626' : abierta ? '#f6e3a600' : '#efe6cf12', shapes.roundedRectangle({ cornerRadius: 12 })),
          strokeBorder({ content: tocada ? '#f6e3a680' : abierta ? '#f6e3a64d' : '#efe6cf1a', style: { lineWidth: abierta || tocada ? 1 : 0.5 }, shape: 'roundedRectangle', cornerRadius: 12 }),
        ]}>
        <Text modifiers={[font({ size: 10 }), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1), minimumScaleFactor(0.8)]}>{f.c.nombre}</Text>
        {valor}
      </VStack>
    );
    return tocable(f, contenido, 'c' + f.c.tipo);
  }

  function fila(f: (typeof filas)[number]) {
    let tocada = f.estado === 'tocada';
    let contenido = (
      <HStack spacing={7} modifiers={[frame({ maxWidth: Infinity, minHeight: 29, alignment: 'leading' })]}>
        <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), lineLimit(1), frame({ width: 62, alignment: 'leading' })]}>{f.c.nombre}</Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(tocada ? LUZ : TEXTO), opacity(tocada ? 1 : 0.55), lineLimit(1), frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          {tocada ? tx.anotado : f.c.detalle || tx.sinAnotar}
        </Text>
        <Text modifiers={[font({ size: 12.5, weight: 'medium' }), monospacedDigit(), foregroundStyle(f.estado === 'anotada' ? TEXTO : LUZ), lineLimit(1)]}>
          {f.estado === 'vacia' ? '' : (f.estado === 'siempre' ? '+' : '') + numero(f.kcal)}
        </Text>
        <Image
          systemName={tocada ? 'checkmark.circle.fill' : f.estado === 'anotada' ? 'checkmark' : 'plus.circle'}
          size={f.estado === 'anotada' ? 11 : 19}
          color={f.estado === 'anotada' ? TEXTO : LUZ}
          modifiers={[frame({ width: 22, height: 22 }), opacity(f.estado === 'anotada' ? 0.5 : 1)]}
        />
      </HStack>
    );
    return tocable(f, contenido, 'f' + f.c.tipo);
  }

  let fondo = containerBackground(
    { type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );
  // El cielo de verdad, tenue: el mismo del widget del cielo, para que se vean de la misma familia.
  let cielo = sinFondo || !props.fondo ? null : (
    <Image key="cielo" uiImage={props.fondo} modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: familia === 'systemLarge' ? 0 : -98 }), opacity(0.4), frame({ width: 1, height: 1 })]} />
  );

  let contenido: ReactElement;
  if (familia === 'systemLarge') {
    let acciones = [[tx.buscar, urls.buscar, 'magnifyingglass'], [tx.decir, urls.decir, 'mic'], [tx.codigo, urls.codigo, 'barcode.viewfinder']];
    contenido = (
      <VStack key="grande" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={12}>
          {luna(72)}
          <VStack alignment="leading" spacing={3}>
            {etiquetaVista}
            {cifraVista(40)}
            <Text modifiers={[font({ size: 12 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.55), lineLimit(1)]}>{tx.de.replace('{comido}', numero(comido.kcal)).replace('{meta}', numero(meta.kcal))}</Text>
          </VStack>
          <Spacer />
        </HStack>
        <Rectangle modifiers={[frame({ height: 0.5 }), foregroundStyle(TEXTO), opacity(0.12), padding({ vertical: 8 })]} />
        <HStack spacing={11} alignment="top">
          {macros.map((m) => (
            <VStack key={m.k} alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
              <Text modifiers={[font({ size: 9.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1), minimumScaleFactor(0.8)]}>{m.nombre}</Text>
              <Text modifiers={[font({ size: 14, weight: 'medium' }), monospacedDigit(), foregroundStyle(TEXTO), lineLimit(1)]}>{falta(m) + ' g'}</Text>
              {barra(m, 90)}
            </VStack>
          ))}
        </HStack>
        <Rectangle modifiers={[frame({ height: 0.5 }), foregroundStyle(TEXTO), opacity(0.12), padding({ top: 8 })]} />
        <VStack spacing={0}>{filas.map(fila)}</VStack>
        <Spacer />
        <HStack spacing={6}>
          {acciones.map((a) => (
            <Link key={a[2]} destination={a[1]}>
              <HStack spacing={5} modifiers={[frame({ maxWidth: Infinity, minHeight: 32 }), background('#efe6cf14', shapes.capsule())]}>
                <Image systemName={a[2] as 'mic'} size={13} color={TEXTO} />
                <Text modifiers={[font({ size: 12 }), foregroundStyle(TEXTO), lineLimit(1), minimumScaleFactor(0.8)]}>{a[0]}</Text>
              </HStack>
            </Link>
          ))}
        </HStack>
      </VStack>
    );
  } else if (familia === 'systemMedium') {
    contenido = (
      <VStack key="mediano" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={10}>
          {luna(58)}
          <VStack alignment="leading" spacing={2}>
            {etiquetaVista}
            {cifraVista(29)}
          </VStack>
          <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
            {macros.map((m) => (
              <VStack key={m.k} alignment="leading" spacing={2}>
                <HStack spacing={4}>
                  <Text modifiers={[font({ size: 10 }), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1), minimumScaleFactor(0.75)]}>{m.nombre}</Text>
                  <Spacer />
                  <Text modifiers={[font({ size: 11.5, weight: 'medium' }), monospacedDigit(), foregroundStyle(TEXTO), lineLimit(1)]}>{falta(m) + ' g'}</Text>
                </HStack>
                {barra(m, 112)}
              </VStack>
            ))}
          </VStack>
        </HStack>
        <Spacer />
        <HStack spacing={6}>{filas.filter((f) => f.c.tipo !== 'snack').slice(0, 4).map(chip)}</HStack>
      </VStack>
    );
  } else {
    contenido = (
      <VStack key="chico" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={0} alignment="top">
          {luna(40)}
          <Spacer />
          <Image systemName="plus.circle" size={24} color={LUZ} />
        </HStack>
        <Spacer />
        {etiquetaVista}
        {cifraVista(32)}
        <HStack spacing={7} modifiers={[padding({ top: 6 })]}>
          {macros.map((m) => (
            <VStack key={m.k} alignment="leading" spacing={3}>
              <HStack spacing={3}>
                <Text modifiers={[font({ size: 11 }), foregroundStyle(TEXTO), opacity(0.55)]}>{m.corto}</Text>
                <Text modifiers={[font({ size: 11 }), monospacedDigit(), foregroundStyle(TEXTO), lineLimit(1), minimumScaleFactor(0.8)]}>{falta(m)}</Text>
              </HStack>
              {barra(m, 36)}
            </VStack>
          ))}
        </HStack>
      </VStack>
    );
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
  textos: { teQuedan: '', deMas: '', kcal: 'kcal', de: '', anotado: '', sinAnotar: '', miles: '.', macros: { p: '', c: '', g: '' }, cortos: { p: 'P', c: 'C', g: 'G' }, buscar: '', decir: '', codigo: '' },
  urls: { anotar: 'moss://', inicio: 'moss://', comida: 'moss://', anotarComida: 'moss://', buscar: 'moss://', decir: 'moss://', codigo: 'moss://' },
  fondo: '',
};

export default createWidget<PropsHoy>('Hoy', Hoy, INICIAL);
