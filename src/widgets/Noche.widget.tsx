// El widget de la noche, en la pantalla bloqueada (accessoryRectangular): «Anoche» con las dos horas y
// «Sí» (iOS 17 o más; con el teléfono bloqueado, el toque pide Face ID). Como el del cielo, corre en
// la extensión y vive solo: todo llega en las props. iOS lo dibuja monocromo, así que va con los
// estilos del sistema (primario y secundario) y sin colores propios.

import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonBorderShape, buttonStyle, containerBackground, controlSize, font, foregroundStyle, lineLimit, minimumScaleFactor, monospacedDigit, widgetURL, frame,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PropsNoche } from './tipos';

const Noche = (props: PropsNoche, entorno: WidgetEnvironment) => {
  'widget';
  let secundario = foregroundStyle({ type: 'hierarchical', style: 'secondary' });
  let lista = !!props.hecha || props.confirmada > 0;
  // Sin datos todavía (antes de abrir Moss por primera vez), solo el nombre.
  let titulo = props.titulo || 'Moss';
  let boton = props.pregunta && !lista && entorno.widgetFamily !== 'accessoryInline';
  return (
    <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground('clear', 'widget'), widgetURL(props.url || 'moss://')]}>
      <HStack spacing={4}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), secundario, lineLimit(1)]}>{titulo}</Text>
        {lista ? <Image systemName="checkmark" size={10} modifiers={[secundario]} /> : null}
      </HStack>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{props.horas || '—'}</Text>
        <Spacer />
        {boton ? (
          <Button
            target={'si|' + props.clave}
            label={props.si}
            onPress={() => ({ confirmada: Date.now() })}
            modifiers={[buttonStyle('bordered'), buttonBorderShape('capsule'), controlSize('small')]}
          />
        ) : null}
      </HStack>
      <Text modifiers={[font({ size: 12 }), secundario, lineLimit(1)]}>{lista ? props.notaConfirmada : props.nota}</Text>
    </VStack>
  );
};

const INICIAL: PropsNoche = {
  clave: '', titulo: '', horas: '', nota: '', notaConfirmada: '', si: '', pregunta: false, dormirse: 0, despertar: 0, confirmada: 0, hecha: false, url: 'moss://',
};

export default createWidget<PropsNoche>('Noche', Noche, INICIAL);
