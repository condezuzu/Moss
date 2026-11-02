// El widget de la noche (spec/widgets.md, D43). A la mañana, «Anoche» con las dos horas y «Sí» (iOS 17 o
// más; con el teléfono bloqueado, el toque pide Face ID); a la tardecita, «A dormir» con la hora. Como el
// del cielo, corre en la extensión y vive solo: todo llega en las props.
// El rectangular de la pantalla bloqueada sale por OTA: iOS lo dibuja monocromo, así que va con los
// estilos del sistema y sin colores propios. El redondo y el chico de la pantalla de inicio necesitan
// declararse en app.json (próxima build).

import { AccessoryWidgetBackground, Button, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  buttonBorderShape, buttonStyle, containerBackground, controlSize, font, foregroundStyle, frame, kerning, lineLimit, minimumScaleFactor, monospacedDigit, opacity, offset, resizable, textCase, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PropsNoche } from './tipos';

const Noche = (props: PropsNoche, entorno: WidgetEnvironment) => {
  'widget';
  let secundario = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  let lista = !!props.hecha || props.confirmada > 0;
  // Sin datos todavía (antes de abrir Moss por primera vez), solo el nombre.
  let titulo = props.titulo || 'Moss';
  let familia = entorno.widgetFamily;
  let boton = props.pregunta && !lista && familia !== 'accessoryInline';
  let url = props.url || 'moss://';
  let si = (
    <Button
      target={'si|' + props.clave}
      label={props.si}
      onPress={() => ({ confirmada: Date.now() })}
      modifiers={[buttonStyle('bordered'), buttonBorderShape('capsule'), controlSize('small')]}
    />
  );

  if (familia === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(url)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={1}>
          <Image systemName={props.aDormir ? 'bed.double.fill' : 'moon.stars.fill'} size={15} />
          <Text modifiers={[font({ size: 12.5, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{props.cifra || '—'}</Text>
        </VStack>
      </ZStack>
    );
  }

  // En la pantalla de inicio, sobre el cielo de verdad, tenue: el mismo fondo que el widget del cielo.
  if (familia === 'systemSmall') {
    let TEXTO = '#efe6cf';
    let LUZ = '#f6e3a6';
    let conFondo = !/accent|vibrant/i.test(String(entorno.widgetRenderingMode)) && (entorno as { showsContainerBackground?: boolean }).showsContainerBackground !== false && !entorno.isLuminanceReduced && !!props.fondo;
    return (
      <ZStack modifiers={[
        frame({ maxWidth: Infinity, maxHeight: Infinity }),
        containerBackground({ type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } }, 'widget'),
        widgetURL(url),
      ]}>
        {conFondo ? <Image key="cielo" uiImage={props.fondo} modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: -98 }), opacity(0.45), frame({ width: 1, height: 1 })]} /> : null}
        <VStack key="noche" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
          <HStack spacing={4}>
            <Text modifiers={[font({ size: 9.5, weight: 'semibold' }), kerning(1.4), textCase('uppercase'), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1)]}>{titulo}</Text>
            <Spacer />
            <Image systemName={props.aDormir ? 'bed.double' : 'moon.stars'} size={13} color={TEXTO} modifiers={[opacity(0.6)]} />
          </HStack>
          <Text modifiers={[font({ size: 33, weight: 'light', design: 'rounded' }), monospacedDigit(), foregroundStyle('#fbf2d9'), lineLimit(1), minimumScaleFactor(0.7), frame({ maxWidth: Infinity, minHeight: 44, alignment: 'leading' })]}>{props.cifra || '—'}</Text>
          <Text modifiers={[font({ size: 12 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.62), lineLimit(1), minimumScaleFactor(0.8)]}>{props.aDormir ? props.falta : props.horas}</Text>
          <Spacer />
          {boton ? (
            <Button
              target={'si|' + props.clave}
              onPress={() => ({ confirmada: Date.now() })}
              modifiers={[buttonStyle('plain')]}>
              <Text modifiers={[font({ size: 12.5, weight: 'medium' }), foregroundStyle(LUZ), lineLimit(1), frame({ maxWidth: Infinity, minHeight: 32 })]}>{props.siLargo || props.si}</Text>
            </Button>
          ) : (
            <Text modifiers={[font({ size: 11.5 }), foregroundStyle(TEXTO), opacity(0.62), lineLimit(2), minimumScaleFactor(0.85)]}>{lista ? props.notaConfirmada : props.aDormir ? props.nota : ''}</Text>
          )}
        </VStack>
      </ZStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground('clear', 'widget'), widgetURL(url)]}>
      <HStack spacing={4}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), secundario, lineLimit(1)]}>{titulo}</Text>
        {lista ? <Image systemName="checkmark" size={10} modifiers={[secundario]} /> : null}
      </HStack>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{props.horas || '—'}</Text>
        <Spacer />
        {boton ? si : null}
      </HStack>
      <Text modifiers={[font({ size: 12 }), secundario, lineLimit(1), minimumScaleFactor(0.85)]}>{lista ? props.notaConfirmada : props.nota}</Text>
    </VStack>
  );
};

const INICIAL: PropsNoche = {
  clave: '', titulo: '', horas: '', nota: '', notaConfirmada: '', si: '', pregunta: false, dormirse: 0, despertar: 0, confirmada: 0, hecha: false, url: 'moss://',
  aDormir: false, cifra: '', falta: '', siLargo: '', fondo: '',
};

export default createWidget<PropsNoche>('Noche', Noche, INICIAL);
