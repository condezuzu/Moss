// El widget del cielo, chico y mediano (spec/widgets.md), como se aprobó en la galería
// (galeria/src/widgets.js). Corre en la extensión de widgets, no en la app: la función con
// 'widget' se pasa a texto al armar y vive sola, sin nada de afuera (ni constantes de este archivo,
// ni hooks, ni el almacén). Por eso todo va en las props, ya traducido, y la figura se dibuja con
// círculos y líneas de SwiftUI, sin imágenes. Los «hecho» del mediano corren en la extensión
// (iOS 17 o más): lo que devuelven queda en la entrada de hoy y la app lo aplica al abrirse.

import { Button, Circle, HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel, accessibilityValue, buttonStyle, containerBackground, contentTransition, font, foregroundStyle, frame,
  lineLimit, monospacedDigit, offset, opacity, rotationEffect, shadow, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { ReactElement } from 'react';

import type { HabitoDelWidget, PropsCielo, ToqueDelWidget } from './tipos';

const Cielo = (props: PropsCielo, entorno: WidgetEnvironment) => {
  'widget';
  // Los colores de Moss: la luz de una estrella encendida, el pergamino y el oro del día completo.
  let LUZ = '#f6e3a6';
  let TEXTO = '#efe6cf';
  let ORO = '#e8c46a';
  let mediano = entorno.widgetFamily === 'systemMedium';
  let pendientes = props.pendientes || [];
  let textos = props.textos || { cuenta: '', solos: '', sinHabitos: '', hecho: '', sinHacer: '' };

  // Lo que dice la app, con lo tocado en el widget encima: de cada hábito gana el último toque.
  let habitos: HabitoDelWidget[] = [];
  let hechos = 0;
  let lista = props.habitos || [];
  for (let i = 0; i < lista.length; i++) {
    let hecho = !!lista[i].hecho;
    for (let k = 0; k < pendientes.length; k++) {
      if (pendientes[k].id === lista[i].id) hecho = !!pendientes[k].hecho;
    }
    if (hecho) hechos++;
    habitos.push({ id: lista[i].id, nombre: lista[i].nombre, aMano: !!lista[i].aMano, hecho: hecho });
  }
  let completo = habitos.length > 0 && hechos === habitos.length;
  let cuenta = textos.cuenta.replace('{n}', String(hechos)).replace('{total}', String(habitos.length));

  // La figura en una caja de ancho × alto, con un margen para el brillo: las líneas son rectángulos
  // finos girados y las estrellas, círculos; las encendidas, más grandes y con brillo.
  function figura(ancho: number, alto: number) {
    let margen = 7;
    let estrellas = props.estrellas || [];
    let lineas = props.lineas || [];
    let pos: number[][] = [];
    for (let e = 0; e < estrellas.length; e++) {
      pos.push([margen + estrellas[e][0] * (ancho - 2 * margen), margen + estrellas[e][1] * (alto - 2 * margen)]);
    }
    let hijos: ReactElement[] = [];
    for (let l = 0; l < lineas.length; l++) {
      let a = pos[lineas[l][0]];
      let b = pos[lineas[l][1]];
      if (!a || !b) continue;
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      let largo = Math.sqrt(dx * dx + dy * dy);
      hijos.push(
        <Rectangle
          key={'l' + l}
          modifiers={[
            frame({ width: largo, height: 0.8 }),
            foregroundStyle(completo ? ORO : TEXTO),
            opacity(completo ? 0.75 : 0.24),
            rotationEffect((Math.atan2(dy, dx) * 180) / Math.PI),
            offset({ x: (a[0] + b[0]) / 2 - largo / 2, y: (a[1] + b[1]) / 2 - 0.4 }),
          ]}
        />,
      );
    }
    for (let s = 0; s < pos.length; s++) {
      let prendida = !!(habitos[s] && habitos[s].hecho);
      let radio = 1.2 + 1.1 * (estrellas[s][2] || 0) + (prendida ? 0.6 : 0);
      hijos.push(
        <Circle
          key={'e' + s}
          modifiers={[
            frame({ width: radio * 2, height: radio * 2 }),
            foregroundStyle(prendida ? (completo ? ORO : LUZ) : TEXTO),
            opacity(prendida ? 1 : 0.42),
            shadow({ radius: prendida ? 3 : 0, color: completo ? ORO : LUZ }),
            offset({ x: pos[s][0] - radio, y: pos[s][1] - radio }),
          ]}
        />,
      );
    }
    return (
      <ZStack alignment="topLeading" modifiers={[frame({ width: ancho, height: alto, alignment: 'topLeading' })]}>
        {hijos}
      </ZStack>
    );
  }

  let pie = habitos.length ? (
    <VStack alignment="leading" spacing={1}>
      <Text modifiers={[font({ size: 15, weight: 'medium' }), monospacedDigit(), foregroundStyle(completo ? ORO : TEXTO), contentTransition('numericText'), lineLimit(1)]}>
        {cuenta}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(TEXTO), opacity(0.55), lineLimit(1)]}>{props.nombre || ' '}</Text>
    </VStack>
  ) : (
    <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(2)]}>{textos.sinHabitos}</Text>
  );

  let fondo = containerBackground(
    { type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );

  if (!mediano) {
    return (
      <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }), fondo, widgetURL(props.url || 'moss://')]}>
        <HStack spacing={0}>
          <Spacer />
          {figura(112, 76)}
          <Spacer />
        </HStack>
        <Spacer />
        {pie}
      </VStack>
    );
  }

  // Los «hecho»: hasta cuatro de los que se marcan a mano, en el orden de sus estrellas. El destino
  // lleva el día: si la línea cambió entre que se dibujó y el toque, el toque no cae en otro día.
  let botones: ReactElement[] = [];
  for (let j = 0; j < habitos.length && botones.length < 4; j++) {
    if (!habitos[j].aMano) continue;
    let h = habitos[j];
    botones.push(
      <Button
        key={'b' + h.id}
        target={'hecho|' + props.dia + '|' + h.id}
        onPress={((id: string, ahora: boolean) => () => {
          let nuevos: ToqueDelWidget[] = [];
          for (let p = 0; p < pendientes.length; p++) if (pendientes[p].id !== id) nuevos.push(pendientes[p]);
          nuevos.push({ id: id, hecho: !ahora, en: Date.now() });
          return { pendientes: nuevos };
        })(h.id, h.hecho)}
        modifiers={[buttonStyle('plain'), accessibilityLabel(h.nombre), accessibilityValue(h.hecho ? textos.hecho : textos.sinHacer)]}>
        <HStack spacing={9} modifiers={[frame({ maxWidth: Infinity, minHeight: 30, alignment: 'leading' })]}>
          <Image systemName={h.hecho ? 'circle.fill' : 'circle'} size={14} color={h.hecho ? LUZ : TEXTO} modifiers={[opacity(h.hecho ? 1 : 0.5)]} />
          <Text modifiers={[font({ size: 13.5 }), foregroundStyle(TEXTO), opacity(h.hecho ? 1 : 0.8), lineLimit(1)]}>{h.nombre}</Text>
        </HStack>
      </Button>,
    );
  }

  return (
    <HStack spacing={14} alignment="center" modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), fondo, widgetURL(props.url || 'moss://')]}>
      <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 126, alignment: 'leading' })]}>
        {figura(126, 80)}
        <Spacer />
        {pie}
      </VStack>
      <VStack alignment="leading" spacing={2} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
        {botones.length ? botones : <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(2)]}>{habitos.length ? textos.solos : ''}</Text>}
      </VStack>
    </HStack>
  );
};

// Lo que se ve antes de que Moss escriba la línea (la galería de widgets, la primera vez): la Lira, sin
// texto, así no depende del idioma.
const INICIAL: PropsCielo = {
  dia: '',
  nombre: '',
  estrellas: [[0.688, 0.123, 0.874], [0.312, 1, 0.232], [0.47, 0.907, 0.19], [0.396, 0.397, 0.02], [0.56, 0.297, 0.008], [0.566, 0, 0]],
  lineas: [[0, 4], [0, 5], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]],
  habitos: [],
  pendientes: [],
  atrasados: [],
  textos: { cuenta: '', solos: '', sinHabitos: '', hecho: '', sinHacer: '' },
  url: 'moss://',
};

export default createWidget<PropsCielo>('Cielo', Cielo, INICIAL);
