// El widget de anotar (spec/widgets.md, D43): cada botón abre Moss justo ahí. El mediano tiene los cuatro;
// el chico y el redondo de la pantalla bloqueada, una sola acción, la que se elige al editar el widget.
// Sin botones que guarden nada: su título puede cambiar con la hora («Anotar la cena»).
// Corre en la extensión y vive solo. Va con la próxima build: se declara en app.json.

import { AccessoryWidgetBackground, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background, containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, multilineTextAlignment, offset, opacity, resizable, shapes, strokeBorder, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { PropsAnotar } from './tipos';

type Configuracion = { accion?: string };

const Anotar = (props: PropsAnotar, entorno: WidgetEnvironment<Configuracion>) => {
  'widget';
  let TEXTO = '#efe6cf';
  let LUZ = '#f6e3a6';
  let familia = entorno.widgetFamily;
  let sinFondo = /accent|vibrant/i.test(String(entorno.widgetRenderingMode)) || (entorno as { showsContainerBackground?: boolean }).showsContainerBackground === false || !!entorno.isLuminanceReduced;
  let acciones = props.acciones || [];
  let elegida = entorno.configuration && entorno.configuration.accion ? entorno.configuration.accion : 'decir';
  let accion = acciones[0];
  for (let i = 0; i < acciones.length; i++) if (acciones[i].id === elegida) accion = acciones[i];
  let urlDeLaAccion = accion ? accion.url : props.url || 'moss://';

  if (familia === 'accessoryCircular') {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(urlDeLaAccion)]}>
        <AccessoryWidgetBackground />
        <Image systemName={accion ? (accion.icono as 'mic') : 'plus'} size={26} />
      </ZStack>
    );
  }

  let fondo = containerBackground(
    { type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );
  let cielo = sinFondo || !props.fondo ? null : (
    <Image key="cielo" uiImage={props.fondo} modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: -98 }), opacity(0.4), frame({ width: 1, height: 1 })]} />
  );

  if (familia === 'systemMedium') {
    return (
      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), fondo, widgetURL(props.url || 'moss://')]}>
        {cielo}
        <VStack key="mediano" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
          <HStack spacing={8} alignment="firstTextBaseline">
            <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(TEXTO), lineLimit(1), minimumScaleFactor(0.8)]}>{props.titulo}</Text>
            <Spacer />
            <Text modifiers={[font({ size: 11.5 }), monospacedDigit(), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{props.queda}</Text>
          </HStack>
          <Spacer />
          <HStack spacing={8}>
            {acciones.slice(0, 4).map((a) => (
              <Link key={a.id} destination={a.url}>
                <VStack spacing={6} modifiers={[frame({ maxWidth: Infinity })]}>
                  <ZStack modifiers={[frame({ width: 50, height: 50 }), background('#efe6cf14', shapes.circle())]}>
                    <Image systemName={a.icono as 'mic'} size={21} color={TEXTO} />
                  </ZStack>
                  <Text modifiers={[font({ size: 11.5 }), foregroundStyle(TEXTO), lineLimit(1), minimumScaleFactor(0.8)]}>{a.nombre}</Text>
                </VStack>
              </Link>
            ))}
          </HStack>
        </VStack>
      </ZStack>
    );
  }

  return (
    <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), fondo, widgetURL(urlDeLaAccion)]}>
      {cielo}
      <VStack key="chico" spacing={10}>
        <ZStack modifiers={[frame({ width: 62, height: 62 }), strokeBorder({ content: '#f6e3a673', style: { lineWidth: 1 }, shape: 'circle' })]}>
          <Image systemName={accion ? (accion.icono as 'mic') : 'plus'} size={26} color={LUZ} />
        </ZStack>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(TEXTO), lineLimit(2), minimumScaleFactor(0.85), multilineTextAlignment('center')]}>{elegida === 'decir' ? props.decirTitulo : accion ? accion.nombre : ''}</Text>
      </VStack>
    </ZStack>
  );
};

const INICIAL: PropsAnotar = { titulo: '', queda: '', acciones: [], url: 'moss://', decirTitulo: '', fondo: '' };

export default createWidget<PropsAnotar, Configuracion>('Anotar', Anotar, INICIAL);
