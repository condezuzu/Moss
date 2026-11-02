// El widget del cielo (spec/widgets.md, D43), como se aprobó en la galería (galeria/src/widgets-nuevos.js):
// la figura sobre el cielo de verdad, que se une a medida que se enciende; día completo, aurora y oro,
// sin texto. Corre en la extensión de widgets, no en la app: la función con 'widget' se pasa a texto al
// armar y vive sola, sin nada de afuera (ni constantes de este archivo, ni hooks, ni el almacén). Por eso
// todo va en las props, ya traducido, y la figura se dibuja con formas de SwiftUI; el fondo es una imagen
// que la app deja en el App Group (fondos.ts). Los «hecho» corren en la extensión (iOS 17 o más): lo que
// devuelven queda en la entrada de hoy y la app lo aplica al abrirse.
// Chico y mediano salen por OTA; el grande y el redondo necesitan declararse en app.json (próxima build).

import { AccessoryWidgetBackground, Button, Circle, HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  accessibilityLabel, accessibilityValue, buttonStyle, containerBackground, contentTransition, font, foregroundStyle, frame,
  lineLimit, monospacedDigit, offset, opacity, resizable, rotationEffect, shadow, widgetURL,
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
  let NUCLEO = '#fffaf0';
  let familia = entorno.widgetFamily;
  let mediano = familia === 'systemMedium';
  let grande = familia === 'systemLarge';
  let redondo = familia === 'accessoryCircular';
  // Tintado, transparente, en la pantalla bloqueada o en StandBy, iOS saca el fondo: la imagen también se va.
  let sinFondo = /accent|vibrant/i.test(String(entorno.widgetRenderingMode))
    || (entorno as { showsContainerBackground?: boolean }).showsContainerBackground === false || !!entorno.isLuminanceReduced;
  let pendientes = props.pendientes || [];
  let textos = props.textos || { cuenta: '', solos: '', sinHabitos: '', hecho: '', sinHacer: '' };

  // Lo que dice la app, con lo tocado en el widget encima: de cada hábito gana el último toque.
  let habitos: (HabitoDelWidget & { indice: number; base: boolean })[] = [];
  let hechos = 0;
  let lista = props.habitos || [];
  for (let i = 0; i < lista.length; i++) {
    let hecho = !!lista[i].hecho;
    for (let k = 0; k < pendientes.length; k++) {
      if (pendientes[k].id === lista[i].id) hecho = !!pendientes[k].hecho;
    }
    if (hecho) hechos++;
    habitos.push({ id: lista[i].id, nombre: lista[i].nombre, aMano: !!lista[i].aMano, hecho: hecho, indice: i, base: !!lista[i].hecho });
  }
  let completo = habitos.length > 0 && hechos === habitos.length;
  let cuenta = textos.cuenta.replace('{n}', String(hechos)).replace('{total}', String(habitos.length));

  // La figura en una caja de ancho × alto, sin deformarla (las estrellas vienen en una caja de 1,7 × 1):
  // las líneas son rectángulos finos girados, las estrellas apagadas, círculos, y las encendidas, un
  // círculo con rayos y brillo. Una línea entre dos encendidas ya se ve: la constelación se va uniendo.
  function figura(ancho: number, alto: number, k: number, margen: number) {
    let estrellas = props.estrellas || [];
    let lineas = props.lineas || [];
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let e = 0; e < estrellas.length; e++) {
      let x = estrellas[e][0] * 1.7;
      let y = estrellas[e][1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    let escala = Math.min((ancho - 2 * margen) / Math.max(x1 - x0, 0.001), (alto - 2 * margen) / Math.max(y1 - y0, 0.001));
    let pos: number[][] = [];
    for (let e = 0; e < estrellas.length; e++) {
      pos.push([ancho / 2 + (estrellas[e][0] * 1.7 - (x0 + x1) / 2) * escala, alto / 2 + (estrellas[e][1] - (y0 + y1) / 2) * escala]);
    }
    let hijos: ReactElement[] = [];
    for (let l = 0; l < lineas.length; l++) {
      let a = pos[lineas[l][0]];
      let b = pos[lineas[l][1]];
      if (!a || !b) continue;
      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      let largo = Math.sqrt(dx * dx + dy * dy);
      let unida = !!(habitos[lineas[l][0]] && habitos[lineas[l][0]].hecho && habitos[lineas[l][1]] && habitos[lineas[l][1]].hecho);
      hijos.push(
        <Rectangle
          key={'l' + l}
          modifiers={[
            frame({ width: largo, height: completo ? 1.1 : unida ? 1 : 0.8 }),
            foregroundStyle(completo ? ORO : unida ? LUZ : TEXTO),
            opacity(completo ? 0.9 : unida ? 0.75 : 0.26),
            rotationEffect((Math.atan2(dy, dx) * 180) / Math.PI),
            offset({ x: (a[0] + b[0]) / 2 - largo / 2, y: (a[1] + b[1]) / 2 - 0.5 }),
          ]}
        />,
      );
    }
    for (let s = 0; s < pos.length; s++) {
      let prendida = !!(habitos[s] && habitos[s].hecho);
      let brillo = estrellas[s][2] || 0;
      let radio = (1.25 + 0.95 * brillo) * k * (prendida ? 1 : 0.6);
      if (prendida) {
        let rayo = (5 + 4.5 * brillo) * k;
        hijos.push(
          <Image
            key={'r' + s}
            systemName="sparkle"
            size={rayo * 2}
            color={completo ? ORO : LUZ}
            modifiers={[frame({ width: rayo * 2, height: rayo * 2 }), shadow({ radius: 4, color: completo ? ORO : LUZ }), offset({ x: pos[s][0] - rayo, y: pos[s][1] - rayo })]}
          />,
        );
      }
      hijos.push(
        <Circle
          key={'e' + s}
          modifiers={[
            frame({ width: radio * 2, height: radio * 2 }),
            foregroundStyle(prendida ? NUCLEO : TEXTO),
            opacity(prendida ? 1 : 0.45),
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

  let fondo = containerBackground(
    { type: 'linearGradient', colors: ['#0d1a38', '#070d1f', '#03050c'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } },
    'widget',
  );
  let url = props.url || 'moss://';

  // En la pantalla bloqueada: la figura chica y cuántos van, de un solo color.
  if (redondo) {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget'), widgetURL(url)]}>
        <AccessoryWidgetBackground />
        <VStack spacing={0}>
          {figura(46, 34, 0.62, 3)}
          <Text modifiers={[font({ size: 11.5, weight: 'semibold' }), monospacedDigit(), lineLimit(1)]}>{hechos + '/' + habitos.length}</Text>
        </VStack>
      </ZStack>
    );
  }

  // El cielo de verdad, a los bordes del widget: la imagen es más grande que el lugar del contenido, y
  // el último frame hace que mida 1 × 1, así no empuja nada. Con el chico y el mediano se ve lo de abajo.
  let abajo = grande ? 177 : 79;
  let cielo = sinFondo || !(completo ? props.fondoAurora : props.fondoNoche) ? null : (
    <Image
      key="cielo"
      uiImage={completo ? props.fondoAurora : props.fondoNoche}
      modifiers={[resizable(), frame({ width: 338, height: 354 }), offset({ y: grande ? 0 : -98 }), frame({ width: 1, height: 1 })]}
    />
  );
  // Un velo abajo, para que el texto se lea sobre la aurora.
  let velo = cielo ? (
    <Rectangle
      key="velo"
      modifiers={[
        foregroundStyle({ type: 'linearGradient', colors: ['#03050c00', '#03050c99'], startPoint: { x: 0.5, y: 0 }, endPoint: { x: 0.5, y: 1 } }),
        frame({ width: 338, height: 74 }),
        offset({ y: abajo - 37 }),
        frame({ width: 1, height: 1 }),
      ]}
    />
  ) : null;

  let pie = habitos.length ? (
    <HStack spacing={6} alignment="lastTextBaseline">
      <Text modifiers={[font({ size: 14, weight: 'medium' }), monospacedDigit(), foregroundStyle(completo ? ORO : TEXTO), contentTransition('numericText'), lineLimit(1)]}>
        {cuenta}
      </Text>
      <Spacer />
      <Text modifiers={[font({ size: 10.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{props.nombre || ' '}</Text>
    </HStack>
  ) : (
    <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(2)]}>{textos.sinHabitos}</Text>
  );

  // Un «hecho»: el destino lleva el día; si la línea cambió entre que se dibujó y el toque, no cae en otro día.
  function boton(h: HabitoDelWidget) {
    return (
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
          <Image systemName={h.hecho ? 'circle.fill' : 'circle'} size={14} color={h.hecho ? (completo ? ORO : LUZ) : TEXTO} modifiers={[opacity(h.hecho ? 1 : 0.55)]} />
          <Text modifiers={[font({ size: 13.5 }), foregroundStyle(TEXTO), opacity(h.hecho ? 1 : 0.82), lineLimit(1)]}>{h.nombre}</Text>
        </HStack>
      </Button>
    );
  }

  let contenido: ReactElement;
  if (grande) {
    // Todos los hábitos, de a dos por fila. Los que se encienden solos no llevan botón.
    let filas: ReactElement[] = [];
    let hasta = Math.min(habitos.length, 8);
    for (let f = 0; f < hasta; f += 2) {
      let celdas: ReactElement[] = [];
      for (let c = f; c < Math.min(f + 2, hasta); c++) {
        let h = habitos[c];
        celdas.push(h.aMano ? boton(h) : (
          <HStack key={'s' + h.id} spacing={9} modifiers={[frame({ maxWidth: Infinity, minHeight: 30, alignment: 'leading' })]}>
            <Image systemName={h.hecho ? 'circle.fill' : 'circle'} size={14} color={h.hecho ? (completo ? ORO : LUZ) : TEXTO} modifiers={[opacity(h.hecho ? 0.8 : 0.4)]} />
            <Text modifiers={[font({ size: 13 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(1)]}>{h.nombre}</Text>
          </HStack>
        ));
      }
      if (celdas.length < 2) celdas.push(<Spacer key={'v' + f} />);
      filas.push(<HStack key={'f' + f} spacing={10}>{celdas}</HStack>);
    }
    contenido = (
      <VStack key="grande" alignment="leading" spacing={4} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={0}>
          <Spacer />
          {figura(296, 176, 1.3, 12)}
          <Spacer />
        </HStack>
        {pie}
        <Rectangle modifiers={[frame({ height: 0.5 }), foregroundStyle(TEXTO), opacity(0.16)]} />
        <VStack spacing={habitos.length > 6 ? 0 : 2}>{filas}</VStack>
      </VStack>
    );
  } else if (mediano) {
    // Hasta cuatro «hecho», de los que se marcan a mano. Lo que falta va primero, según lo que dijo la
    // app y no lo tocado: lo recién tocado queda en su lugar, para poder deshacerlo.
    let aMano: (typeof habitos)[number][] = [];
    for (let j = 0; j < habitos.length; j++) if (habitos[j].aMano && !habitos[j].base) aMano.push(habitos[j]);
    for (let j = 0; j < habitos.length; j++) if (habitos[j].aMano && habitos[j].base) aMano.push(habitos[j]);
    let botones: ReactElement[] = [];
    for (let j = 0; j < aMano.length && j < 4; j++) botones.push(boton(aMano[j]));
    contenido = (
      <HStack key="mediano" spacing={12} alignment="center" modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <VStack alignment="leading" spacing={0} modifiers={[frame({ width: 150, alignment: 'leading' })]}>
          {figura(150, 98, 1, 8)}
          <Spacer />
          {pie}
        </VStack>
        <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          {botones.length ? botones : <Text modifiers={[font({ size: 12.5 }), foregroundStyle(TEXTO), opacity(0.6), lineLimit(2)]}>{habitos.length ? textos.solos : ''}</Text>}
        </VStack>
      </HStack>
    );
  } else {
    contenido = (
      <VStack key="chico" alignment="leading" spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' })]}>
        <HStack spacing={0}>
          <Spacer />
          {figura(118, 92, 1, 8)}
          <Spacer />
        </HStack>
        <Spacer />
        {pie}
      </VStack>
    );
  }

  return (
    <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), fondo, widgetURL(url)]}>
      {cielo}
      {velo}
      {contenido}
    </ZStack>
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
  fondoNoche: '',
  fondoAurora: '',
};

export default createWidget<PropsCielo>('Cielo', Cielo, INICIAL);
