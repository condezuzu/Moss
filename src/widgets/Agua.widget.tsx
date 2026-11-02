// El widget del agua (spec/widgets.md, D43): un vaso más de un toque, sin abrir Moss, y «−» por si te
// equivocaste. Lo tocado queda en su entrada, una por día, y la app lo aplica al abrirse.
// Corre en la extensión y vive solo. Va con la próxima build: se declara en app.json.

import { Button, HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel, background, buttonStyle, containerBackground, contentTransition, font, foregroundStyle, frame, kerning, lineLimit, monospacedDigit, offset, opacity, resizable, shapes, strokeBorder, textCase, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PropsAgua } from './tipos';

const Agua = (props: PropsAgua, entorno: WidgetEnvironment) => {
  'widget';
  let TEXTO = '#efe6cf';
  let CIFRA = '#fbf2d9';
  let LUZ = '#f6e3a6';
  let AZUL = '#a9c4f5';
  let VASO = 250;
  let mono = /accent|vibrant/i.test(String(entorno.widgetRenderingMode));
  let sinFondo = mono || (entorno as { showsContainerBackground?: boolean }).showsContainerBackground === false || !!entorno.isLuminanceReduced;
  let tx = props.textos || { titulo: '', vasos: '', sumar: '', quitar: '', decimal: ',' };
  let ml = (props.ml || 0) + (props.vasos || 0) * VASO;
  if (ml < 0) ml = 0;
  let meta = props.meta || 2000;
  let vasos = Math.round(ml / VASO);
  let total = Math.round(meta / VASO);
  let litros = String(Math.round((ml / 1000) * 100) / 100).replace('.', tx.decimal) + ' L';
  let ancho = 126;
  let f = Math.min(1, ml / meta);

  function tocar(cuanto: number) {
    return () => ({ vasos: (props.vasos || 0) + cuanto, en: Date.now() });
  }

  return (
    <ZStack modifiers={[
      frame({ maxWidth: Infinity, maxHeight: Infinity }),
      containerBackground({ type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } }, 'widget'),
      widgetURL(props.url || 'moss://'),
    ]}>
      {sinFondo || !props.fondo ? null : <Image key="cielo" uiImage={props.fondo} modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: -98 }), opacity(0.4), frame({ width: 1, height: 1 })]} />}
      <VStack key="agua" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={5}>
          <Image systemName="drop" size={12} color={mono ? TEXTO : AZUL} />
          <Text modifiers={[font({ size: 9.5, weight: 'semibold' }), kerning(1.3), textCase('uppercase'), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1)]}>{tx.titulo}</Text>
        </HStack>
        <Text modifiers={[font({ size: 32, weight: 'light', design: 'rounded' }), monospacedDigit(), foregroundStyle(CIFRA), contentTransition('numericText'), lineLimit(1), frame({ minHeight: 42 })]}>{litros}</Text>
        <Text modifiers={[font({ size: 11.5 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{tx.vasos.replace('{n}', String(vasos)).replace('{total}', String(total))}</Text>
        <ZStack alignment="leading" modifiers={[frame({ width: ancho, height: 3 }), offset({ y: 5 })]}>
          <Rectangle modifiers={[foregroundStyle(TEXTO), opacity(0.14), frame({ width: ancho, height: 3 })]} />
          <Rectangle modifiers={[foregroundStyle(mono ? TEXTO : AZUL), frame({ width: Math.max(0.5, ancho * f), height: 3 })]} />
        </ZStack>
        <Spacer />
        <HStack spacing={8}>
          <Spacer />
          {vasos > 0 ? (
            <Button key="menos" target={'agua|' + props.dia + '|menos'} onPress={tocar(-1)} modifiers={[buttonStyle('plain'), accessibilityLabel(tx.quitar)]}>
              <ZStack modifiers={[frame({ width: 34, height: 34 }), background('#efe6cf14', shapes.circle())]}>
                <Image systemName="minus" size={14} color={TEXTO} />
              </ZStack>
            </Button>
          ) : null}
          <Button key="mas" target={'agua|' + props.dia + '|mas'} onPress={tocar(1)} modifiers={[buttonStyle('plain'), accessibilityLabel(tx.sumar)]}>
            <ZStack modifiers={[frame({ width: 40, height: 40 }), background('#f6e3a624', shapes.circle()), strokeBorder({ content: '#f6e3a673', style: { lineWidth: 1 }, shape: 'circle' })]}>
              <Image systemName="plus" size={17} color={LUZ} />
            </ZStack>
          </Button>
        </HStack>
      </VStack>
    </ZStack>
  );
};

const INICIAL: PropsAgua = { dia: '', ml: 0, meta: 2000, vasos: 0, en: 0, textos: { titulo: '', vasos: '', sumar: '', quitar: '', decimal: ',' }, url: 'moss://', fondo: '' };

export default createWidget<PropsAgua>('Agua', Agua, INICIAL);
