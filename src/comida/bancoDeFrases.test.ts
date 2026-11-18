/**
 * El banco de frases de «Decir lo que comí» (lo pediste el 18/11/2026): frases como las dice la gente,
 * contra la base de verdad (assets/alimentos.db), con lo esperado de cada una: qué alimentos, cuánto se
 * dijo y en qué comida. Las que todavía fallan van con `falla` y su porqué (corren como `it.failing`:
 * si un día pasan, el test avisa para sacarles la marca). Con PUNTAJE=1 imprime el puntaje por idioma
 * y por tipo de frase.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import type { Comida } from '../dominio/comidas';
import { buscarAlimentos } from './buscar';
import { detalleDeAlimento } from './detalle';
import { entender } from './entender';
import { conCon, leerFrase, mismoNombre } from './frase';
import type { Unidad } from './recetaDeTexto';

const db = new DatabaseSync(join(__dirname, '../../assets/alimentos.db'), { readOnly: true });
const base = { getAllAsync: async <T,>(sql: string, ...parametros: (string | number)[]) => db.prepare(sql).all(...parametros) as T[] };

type Tipo = 'varias' | 'repetida' | 'sinComida' | 'ayer' | 'cantidad' | 'compuesto' | 'lista' | 'correccion' | 'marca' | 'plato' | 'dictado';
type Region = 'UY' | 'AR' | 'MX' | 'ES' | 'US';
/** La comida y, si es del día anterior, « ayer»: «cena ayer». */
type EnComida = Comida | `${Comida} ayer`;
/** En qué comida, qué alimento (el nombre de la base), cuánto se dijo (null: no se dijo) y en qué medida. */
type Esperado = [EnComida, RegExp, number | null, Unidad?];
type Caso = { f: string; region: Region; tipos: Tipo[]; items: Esperado[]; hora?: Comida; falla?: string; tanda?: 2 };

const BANCO: Caso[] = [
  // ------------------------------------------------------------ Uruguay
  {
    f: 'en el desayuno comí dos huevos revueltos una tostada y un café con leche en el almuerzo una milanesa con puré y de merienda un mate con dos bizcochos',
    region: 'UY', tipos: ['varias', 'dictado'],
    items: [['desayuno', /huevo/i, 2], ['desayuno', /tostad|pan/i, 1], ['desayuno', /caf[eé] con leche/i, 1], ['almuerzo', /milanesa con pur[eé]/i, 1], ['merienda', /mate/i, 1], ['merienda', /bizcocho/i, 2]],
  },
  {
    f: 'En el desayuno un café con leche y dos tostadas con manteca, y en el almuerzo arroz con pollo.',
    region: 'UY', tipos: ['varias', 'compuesto'],
    items: [['desayuno', /caf[eé] con leche/i, 1], ['desayuno', /tostad|pan/i, 2], ['desayuno', /manteca/i, null], ['almuerzo', /arroz con pollo/i, null]],
  },
  {
    f: 'de desayuno yogur con granola de almuerzo una ensalada y de snack una manzana',
    region: 'UY', tipos: ['varias', 'dictado'],
    items: [['desayuno', /yog/i, null], ['desayuno', /granola/i, null], ['almuerzo', /ensalada/i, 1], ['snack', /manzana/i, 1]],
  },
  {
    f: 'desayuné café con leche y una medialuna, almorcé una milanesa al pan y a la merienda un alfajor',
    region: 'UY', tipos: ['varias'],
    items: [['desayuno', /caf[eé] con leche/i, null], ['desayuno', /medialuna|croissant/i, 1], ['almuerzo', /milanesa/i, 1], ['merienda', /alfajor/i, 1]],
  },
  {
    f: 'en el desayuno comí dos huevos y una tostada. y también en el desayuno un café',
    region: 'UY', tipos: ['repetida'],
    items: [['desayuno', /huevo/i, 2], ['desayuno', /tostad|pan/i, 1], ['desayuno', /caf[eé]/i, 1]],
  },
  {
    f: 'en el almuerzo fideos con salsa, en la cena una pizza y también en el almuerzo un vaso de coca',
    region: 'UY', tipos: ['repetida', 'varias'],
    items: [['almuerzo', /fideo/i, null], ['almuerzo', /salsa/i, null], ['cena', /pizza/i, 1], ['almuerzo', /coca|cola/i, 1, 'vaso']],
  },
  { f: 'dos huevos y un café', region: 'UY', tipos: ['sinComida'], hora: 'desayuno', items: [['desayuno', /huevo/i, 2], ['desayuno', /caf[eé]/i, 1]] },
  {
    f: 'anoche cené dos porciones de pizza y una cerveza',
    region: 'UY', tipos: ['ayer', 'plato'],
    items: [['cena ayer', /pizza/i, 2], ['cena ayer', /cerveza/i, 1]],
  },
  {
    f: 'ayer a la noche comí un chivito con papas fritas',
    region: 'UY', tipos: ['ayer'],
    items: [['cena ayer', /chivito/i, 1], ['cena ayer', /papa/i, null]],
  },
  { f: 'ayer en el almuerzo comí ravioles', region: 'UY', tipos: ['ayer'], items: [['almuerzo ayer', /ravioli|raviol/i, null]] },
  { f: 'un par de empanadas de carne', region: 'UY', tipos: ['cantidad', 'sinComida'], hora: 'cena', items: [['cena', /empanada/i, 2]] },
  { f: 'un poco de arroz con un bife', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /arroz/i, null], ['almuerzo', /bife|carne/i, 1]] },
  {
    f: 'pan con manteca y dulce de leche',
    region: 'UY', tipos: ['compuesto'], hora: 'merienda',
    items: [['merienda', /pan con manteca/i, null], ['merienda', /dulce de leche/i, null]],
  },
  { f: 'un café con leche con dos medialunas', region: 'UY', tipos: ['compuesto'], hora: 'desayuno', items: [['desayuno', /caf[eé] con leche/i, 1], ['desayuno', /medialuna|croissant/i, 2]] },
  {
    f: 'eh bueno comí este un plato de ñoquis con tuco',
    region: 'UY', tipos: ['dictado', 'plato'],
    items: [['almuerzo', /[ñn]oquis con tuco/i, 1]],
  },
  { f: 'tres galletitas de agua con queso', region: 'UY', tipos: ['compuesto', 'cantidad'], hora: 'merienda', items: [['merienda', /galle/i, 3], ['merienda', /queso/i, null]] },
  { f: 'una banana después un yogur', region: 'UY', tipos: ['lista'], hora: 'merienda', items: [['merienda', /banana/i, 1], ['merienda', /yog/i, 1]] },
  { f: 'comí dos huevos no tres huevos', region: 'UY', tipos: ['correccion', 'dictado'], hora: 'desayuno', items: [['desayuno', /huevo/i, 3]] },
  { f: 'una milanesa napolitana con ensalada mixta', region: 'UY', tipos: ['compuesto'], items: [['almuerzo', /milanesa/i, 1], ['almuerzo', /ensalada/i, null]] },
  { f: '200 gramos de pollo a la plancha y 150 de arroz', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /pollo/i, 200, 'g'], ['almuerzo', /arroz/i, 150, 'g']] },
  { f: 'doscientos gramos de pollo', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /pollo/i, 200, 'g']] },
  { f: 'un vaso de jugo de naranja', region: 'UY', tipos: ['cantidad', 'compuesto'], hora: 'desayuno', items: [['desayuno', /jugo de naranja/i, 1, 'vaso']] },
  {
    f: 'dos rebanadas de pan integral con queso crema',
    region: 'UY', tipos: ['cantidad', 'compuesto'], hora: 'desayuno',
    items: [['desayuno', /pan integral/i, 2, 'rebanada'], ['desayuno', /queso (?:crema|untable)/i, null]],
  },
  { f: 'media pizza', region: 'UY', tipos: ['cantidad'], hora: 'cena', items: [['cena', /pizza/i, 0.5]] },
  { f: 'una porción de torta de chocolate', region: 'UY', tipos: ['plato'], hora: 'merienda', items: [['merienda', /torta|pastel/i, 1]] },
  { f: 'a la noche cené milanesa con puré', region: 'UY', tipos: ['sinComida'], hora: 'almuerzo', items: [['cena', /milanesa con pur[eé]/i, null]] },
  {
    f: 'de merienda un licuado de banana y dos tostadas con mermelada',
    region: 'UY', tipos: ['compuesto'],
    items: [['merienda', /licuado|batido/i, 1], ['merienda', /tostad|pan/i, 2], ['merienda', /mermelada/i, null]],
  },
  {
    f: 'en la cena una sopa de verduras y un pedazo de pan',
    region: 'UY', tipos: ['lista'],
    items: [['cena', /sopa/i, 1], ['cena', /pan/i, 1, 'trozo']],
  },
  {
    f: 'una empanada de jamón y queso y dos de carne',
    region: 'UY', tipos: ['compuesto', 'cantidad'], hora: 'cena',
    items: [['cena', /empanada/i, 1], ['cena', /empanada/i, 2]],
  },
  { f: 'un sándwich de jamón y queso', region: 'UY', tipos: ['compuesto'], items: [['almuerzo', /s[aá]ndwich/i, 1]] },
  { f: 'dos huevos fritos con panceta', region: 'UY', tipos: ['compuesto'], hora: 'desayuno', items: [['desayuno', /huevo/i, 2], ['desayuno', /panceta|tocino|bacon/i, null]] },
  { f: 'un puñado de almendras', region: 'UY', tipos: ['cantidad'], hora: 'snack', items: [['snack', /almendra/i, 1, 'puñado']] },
  { f: 'una cucharada de dulce de leche', region: 'UY', tipos: ['cantidad', 'compuesto'], hora: 'merienda', items: [['merienda', /dulce de leche/i, 1, 'cucharada']] },
  { f: 'un yogur con cereales y una banana', region: 'UY', tipos: ['compuesto', 'lista'], hora: 'desayuno', items: [['desayuno', /yog/i, 1], ['desayuno', /cereal|copos/i, null], ['desayuno', /banana/i, 1]] },
  { f: 'al mediodía un guiso de lentejas', region: 'UY', tipos: ['sinComida'], hora: 'cena', items: [['almuerzo', /guiso|lenteja/i, 1]] },
  { f: 'esta mañana tomé un café con dos medialunas', region: 'UY', tipos: ['sinComida', 'compuesto'], hora: 'almuerzo', items: [['desayuno', /caf[eé]/i, 1], ['desayuno', /medialuna|croissant/i, 2]] },
  { f: 'comí 3 empanadas', region: 'UY', tipos: ['cantidad'], hora: 'cena', items: [['cena', /empanada/i, 3]] },
  {
    f: 'Desayuno: avena con leche y una banana. Almuerzo: pollo con arroz. Cena: una tarta de verduras.',
    region: 'UY', tipos: ['varias'],
    items: [['desayuno', /avena con leche/i, null], ['desayuno', /banana/i, 1], ['almuerzo', /pollo/i, null], ['almuerzo', /arroz/i, null], ['cena', /tarta/i, 1]],
  },
  {
    f: 'en el desayuno dos tostadas con palta en el almuerzo una hamburguesa con papas fritas y en la cena sushi',
    region: 'UY', tipos: ['varias', 'dictado'],
    items: [['desayuno', /tostada con palta/i, 2], ['almuerzo', /hamburguesa/i, 1], ['almuerzo', /papa/i, null], ['cena', /sushi/i, null]],
  },
  {
    f: 'en el almuerzo comí pollo con arroz y de postre un flan',
    region: 'UY', tipos: ['lista'],
    items: [['almuerzo', /pollo/i, null], ['almuerzo', /arroz/i, null], ['almuerzo', /flan/i, 1]],
  },
  {
    f: 'desayuno café con leche, almuerzo milanesa con ensalada, merienda mate, cena pizza',
    region: 'UY', tipos: ['varias'],
    items: [['desayuno', /caf[eé] con leche/i, null], ['almuerzo', /milanesa con ensalada/i, null], ['merienda', /mate/i, null], ['cena', /pizza/i, null]],
  },
  {
    f: 'para el desayuno avena, para el almuerzo lentejas y para la cena pescado',
    region: 'UY', tipos: ['varias'],
    items: [['desayuno', /avena/i, null], ['almuerzo', /lenteja/i, null], ['cena', /pescado|merluza/i, null]],
  },
  {
    f: 'en el snack una barrita de cereal y en la merienda un yogur',
    region: 'UY', tipos: ['varias'],
    items: [['snack', /barr/i, 1], ['merienda', /yog/i, 1]],
  },
  {
    f: 'en el desayuno dos huevos, en el almuerzo una milanesa y en el desayuno también un café',
    region: 'UY', tipos: ['repetida', 'varias'],
    items: [['desayuno', /huevo/i, 2], ['almuerzo', /milanesa/i, 1], ['desayuno', /caf[eé]/i, 1]],
  },
  {
    f: 'bueno a ver en el desayuno comí eh dos huevos y un café y en el almuerzo una ensalada nomás',
    region: 'UY', tipos: ['dictado', 'varias'],
    items: [['desayuno', /huevo/i, 2], ['desayuno', /caf[eé]/i, 1], ['almuerzo', /ensalada/i, 1]],
  },
  { f: 'o sea comí una manzana y una pera', region: 'UY', tipos: ['dictado', 'sinComida'], hora: 'snack', items: [['snack', /manzana/i, 1], ['snack', /pera/i, 1]] },
  { f: 'tomé dos vasos de agua', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /agua/i, 2, 'vaso']] },
  { f: 'un cafe con leche y dos medialunas', region: 'UY', tipos: ['compuesto', 'dictado'], hora: 'desayuno', items: [['desayuno', /caf[eé] con leche/i, 1], ['desayuno', /medialuna|croissant/i, 2]] },
  { f: 'Dos huevos. Una tostada. Café.', region: 'UY', tipos: ['lista'], hora: 'desayuno', items: [['desayuno', /huevo/i, 2], ['desayuno', /tostad|pan/i, 1], ['desayuno', /caf[eé]/i, null]] },
  { f: '2 huevos 1 tostada 1 cafe', region: 'UY', tipos: ['lista', 'dictado'], hora: 'desayuno', items: [['desayuno', /huevo/i, 2], ['desayuno', /tostad|pan/i, 1], ['desayuno', /caf[eé]/i, 1]] },
  { f: 'un café, no, mejor un té', region: 'UY', tipos: ['correccion'], hora: 'merienda', items: [['merienda', /^t[eé]/i, 1]] },
  { f: 'dos medialunas, perdón, tres', region: 'UY', tipos: ['correccion'], hora: 'desayuno', items: [['desayuno', /medialuna|croissant/i, 3]] },
  { f: 'comí tres no dos empanadas', region: 'UY', tipos: ['correccion', 'dictado'], hora: 'cena', items: [['cena', /empanada/i, 2]] },
  { f: 'media docena de galletitas', region: 'UY', tipos: ['cantidad'], hora: 'merienda', items: [['merienda', /galle/i, 6]] },
  { f: 'un huevo y medio', region: 'UY', tipos: ['cantidad'], hora: 'desayuno', items: [['desayuno', /huevo/i, 1.5]] },
  { f: 'medio sándwich de milanesa', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /s[aá]ndwich|milanesa/i, 0.5]] },
  { f: 'cien gramos de queso', region: 'UY', tipos: ['cantidad'], hora: 'merienda', items: [['merienda', /queso/i, 100, 'g']] },
  { f: 'trescientos gramos de carne picada', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /carne/i, 300, 'g']] },
  { f: 'una lata de atún con mayonesa', region: 'UY', tipos: ['cantidad', 'compuesto'], items: [['almuerzo', /at[uú]n/i, 1, 'lata']] },
  { f: 'ayer comí una pizza', region: 'UY', tipos: ['ayer', 'sinComida'], hora: 'cena', items: [['cena ayer', /pizza/i, 1]] },
  { f: 'anoche una hamburguesa', region: 'UY', tipos: ['ayer'], hora: 'desayuno', items: [['cena ayer', /hamburguesa/i, 1]] },
  {
    f: 'ayer en el desayuno dos huevos y hoy en el almuerzo una milanesa',
    region: 'UY', tipos: ['ayer', 'varias'],
    items: [['desayuno ayer', /huevo/i, 2], ['almuerzo', /milanesa/i, 1]],
  },
  { f: 'un yogur conaprole de frutilla', region: 'UY', tipos: ['marca'], hora: 'merienda', items: [['merienda', /yog/i, 1]] },
  { f: 'un big mac y unas papas medianas', region: 'UY', tipos: ['marca'], items: [['almuerzo', /big mac/i, 1], ['almuerzo', /papa/i, null]] },
  { f: 'una coca cola zero', region: 'UY', tipos: ['marca'], items: [['almuerzo', /coca|cola/i, 1]] },
  { f: 'un plato de fideos con manteca y queso rallado', region: 'UY', tipos: ['plato', 'compuesto'], hora: 'cena', items: [['cena', /fideos con manteca/i, 1], ['cena', /queso/i, null]] },
  { f: 'dos tazas y media de arroz', region: 'UY', tipos: ['cantidad'], items: [['almuerzo', /arroz/i, 2.5, 'taza']] },

  // ------------------------------------------------------------ Argentina
  { f: 'a la mañana me tomé unos mates con tres facturas', region: 'AR', tipos: ['sinComida', 'compuesto'], hora: 'merienda', items: [['desayuno', /mate/i, null], ['desayuno', /factura|medialuna|croissant/i, 3]] },
  {
    f: 'almorcé un bife de chorizo con ensalada y a la tarde un café cortado',
    region: 'AR', tipos: ['varias'],
    items: [['almuerzo', /bife|carne/i, 1], ['almuerzo', /ensalada/i, null], ['merienda', /cortado|caf[eé]/i, 1]],
  },
  { f: 'de cena unas milanesas con puré', region: 'AR', tipos: ['compuesto'], items: [['cena', /milanesa con pur[eé]/i, null]] },
  { f: 'en el almuerzo comí una porción de tarta de jamón y queso', region: 'AR', tipos: ['plato'], items: [['almuerzo', /tarta/i, 1]] },
  { f: 'un choripán y una coca', region: 'AR', tipos: ['lista'], items: [['almuerzo', /chorip[aá]n/i, 1], ['almuerzo', /coca|cola/i, 1]] },
  { f: 'me comí una docena de empanadas', region: 'AR', tipos: ['cantidad'], hora: 'cena', items: [['cena', /empanada/i, 12]] },
  { f: 'dos porciones de fainá', region: 'AR', tipos: ['plato'], hora: 'cena', items: [['cena', /fain[aá]/i, 2]] },
  { f: 'un tostado de jamón y queso y un exprimido de naranja', region: 'AR', tipos: ['compuesto'], hora: 'merienda', items: [['merienda', /tostado|s[aá]ndwich/i, 1], ['merienda', /naranja/i, 1]] },
  {
    f: 'en el desayuno tomé un café con leche con tostadas y en la cena comí ñoquis',
    region: 'AR', tipos: ['varias'],
    items: [['desayuno', /caf[eé] con leche/i, 1], ['desayuno', /tostad|pan/i, null], ['cena', /[ñn]oqui/i, null]],
  },
  { f: 'che anoche me clavé tres porciones de pizza', region: 'AR', tipos: ['ayer', 'dictado'], hora: 'desayuno', items: [['cena ayer', /pizza/i, 3]] },

  // ------------------------------------------------------------ México
  {
    f: 'en el desayuno me comí unos chilaquiles con huevo y un café de olla',
    region: 'MX', tipos: ['compuesto'],
    items: [['desayuno', /chilaquil/i, null], ['desayuno', /huevo/i, null], ['desayuno', /caf[eé] de olla/i, 1]],
  },
  {
    f: 'en la comida tres tacos de pastor y un agua de horchata',
    region: 'MX', tipos: ['varias'], hora: 'cena',
    items: [['almuerzo', /taco/i, 3], ['almuerzo', /horchata/i, 1]],
  },
  { f: 'de cenar dos quesadillas', region: 'MX', tipos: ['varias'], hora: 'almuerzo', items: [['cena', /quesadilla/i, 2]] },
  { f: 'almorcé dos tacos de bistec y una coca', region: 'MX', tipos: ['lista'], items: [['almuerzo', /taco/i, 2], ['almuerzo', /coca|cola/i, 1]] },
  { f: 'un plátano y un vaso de leche', region: 'MX', tipos: ['lista'], hora: 'desayuno', items: [['desayuno', /pl[aá]tano|banana/i, 1], ['desayuno', /leche/i, 1, 'vaso']] },
  {
    f: 'en el desayuno un licuado de plátano con avena y en la cena unos frijoles con arroz',
    region: 'MX', tipos: ['varias', 'compuesto'],
    items: [['desayuno', /licuado|batido/i, 1], ['desayuno', /avena/i, null], ['cena', /frijol/i, null], ['cena', /arroz/i, null]],
  },
  { f: 'de botana unas papitas', region: 'MX', tipos: ['varias'], hora: 'almuerzo', items: [['snack', /papa|papit/i, null]] },
  { f: 'cuatro tortillas de maíz con frijoles', region: 'MX', tipos: ['compuesto', 'cantidad'], items: [['almuerzo', /tortilla/i, 4], ['almuerzo', /frijol/i, null]] },
  { f: 'pues me comí dos conchas y un café con leche', region: 'MX', tipos: ['dictado'], hora: 'merienda', items: [['merienda', /concha|pan dulce/i, 2], ['merienda', /caf[eé] con leche/i, 1]] },

  // ------------------------------------------------------------ España
  {
    f: 'en el desayuno un café con leche y una tostada con tomate y aceite',
    region: 'ES', tipos: ['compuesto'],
    items: [['desayuno', /caf[eé] con leche/i, 1], ['desayuno', /pan con tomate/i, 1], ['desayuno', /aceite/i, null]],
  },
  {
    f: 'para comer he comido un plato de lentejas y de segundo un filete de pollo',
    region: 'ES', tipos: ['varias', 'plato'], hora: 'cena',
    items: [['almuerzo', /lenteja/i, 1], ['almuerzo', /pollo/i, 1]],
  },
  { f: 'de cena una tortilla de patatas y una caña', region: 'ES', tipos: ['compuesto'], items: [['cena', /tortilla/i, 1], ['cena', /^ca[ñn]a$/i, 1]] },
  { f: 'a media mañana un plátano', region: 'ES', tipos: ['varias'], hora: 'almuerzo', items: [['snack', /pl[aá]tano|banana/i, 1]] },
  { f: 'he desayunado un zumo de naranja y dos magdalenas', region: 'ES', tipos: ['lista'], hora: 'almuerzo', items: [['desayuno', /zumo|jugo/i, 1], ['desayuno', /magdalena|muffin|bizcocho/i, 2]] },
  { f: 'de merienda un bocadillo de jamón', region: 'ES', tipos: ['compuesto'], items: [['merienda', /bocadillo|s[aá]ndwich/i, 1]], falla: 'la base no tiene el bocadillo de España: «bocadillo» es el dulce de guayaba' },
  { f: 'anoche cené una ensalada y un yogur', region: 'ES', tipos: ['ayer'], hora: 'desayuno', items: [['cena ayer', /ensalada/i, 1], ['cena ayer', /yog/i, 1]] },
  {
    f: 'en el desayuno un café y dos tostadas en la comida macarrones con tomate y en la cena una sopa',
    region: 'ES', tipos: ['varias', 'dictado'],
    items: [['desayuno', /caf[eé]/i, 1], ['desayuno', /tostad|pan/i, 2], ['almuerzo', /macarr|pasta/i, null], ['almuerzo', /tomate/i, null], ['cena', /sopa/i, 1]],
  },

  // ------------------------------------------------------------ inglés
  {
    f: 'for breakfast I had two eggs and toast, for lunch a chicken salad and for dinner pasta',
    region: 'US', tipos: ['varias'],
    items: [['desayuno', /egg/i, 2], ['desayuno', /toast|bread/i, null], ['almuerzo', /chicken salad|salad/i, 1], ['cena', /pasta|spaghetti|macaroni/i, null]],
  },
  {
    f: 'breakfast was oatmeal with a banana, lunch was a turkey sandwich',
    region: 'US', tipos: ['varias'],
    items: [['desayuno', /oat/i, null], ['desayuno', /banana/i, 1], ['almuerzo', /sandwich|turkey/i, 1]],
  },
  { f: 'I had a coffee and a muffin', region: 'US', tipos: ['sinComida'], hora: 'desayuno', items: [['desayuno', /coffee/i, 1], ['desayuno', /muffin/i, 1]] },
  { f: 'last night I had two slices of pizza and a beer', region: 'US', tipos: ['ayer'], hora: 'almuerzo', items: [['cena ayer', /pizza/i, 2, 'rebanada'], ['cena ayer', /beer/i, 1]] },
  { f: 'yesterday for lunch I ate a burger and fries', region: 'US', tipos: ['ayer'], items: [['almuerzo ayer', /burger|hamburger/i, 1], ['almuerzo ayer', /fries|potato/i, null]] },
  {
    f: 'two scrambled eggs, a toast with butter and a coffee with milk',
    region: 'US', tipos: ['compuesto'], hora: 'desayuno',
    items: [['desayuno', /egg/i, 2], ['desayuno', /toast|bread/i, 1], ['desayuno', /butter/i, null], ['desayuno', /coffee/i, 1]],
  },
  { f: 'um so I ate like three cookies', region: 'US', tipos: ['dictado'], hora: 'snack', items: [['snack', /cookie/i, 3]] },
  { f: 'a bowl of cereal with milk', region: 'US', tipos: ['plato', 'compuesto'], hora: 'desayuno', items: [['desayuno', /cereal/i, 1], ['desayuno', /milk/i, null]] },
  { f: '200 grams of chicken breast and a cup of rice', region: 'US', tipos: ['cantidad'], items: [['almuerzo', /chicken/i, 200, 'g'], ['almuerzo', /rice/i, 1, 'taza']] },
  { f: 'an apple and a handful of almonds as a snack', region: 'US', tipos: ['cantidad'], hora: 'almuerzo', items: [['snack', /apple/i, 1], ['snack', /almond/i, 1, 'puñado']] },
  { f: 'a glass of orange juice', region: 'US', tipos: ['compuesto'], hora: 'desayuno', items: [['desayuno', /orange juice/i, 1, 'vaso']] },
  { f: 'for breakfast two eggs, no, three eggs', region: 'US', tipos: ['correccion'], items: [['desayuno', /egg/i, 3]] },
  { f: 'a peanut butter sandwich', region: 'US', tipos: ['compuesto'], items: [['almuerzo', /peanut butter/i, 1]] },
  {
    f: 'for dinner I had salmon with rice and also for breakfast a yogurt',
    region: 'US', tipos: ['repetida', 'varias'],
    items: [['cena', /salmon/i, null], ['cena', /rice/i, null], ['desayuno', /yogurt/i, 1]],
  },
  { f: 'a slice of cheese pizza', region: 'US', tipos: ['compuesto'], hora: 'cena', items: [['cena', /pizza/i, 1, 'rebanada']] },
  { f: 'a big mac and medium fries', region: 'US', tipos: ['marca'], items: [['almuerzo', /big mac/i, 1], ['almuerzo', /fries|potato/i, null]] },
  { f: 'a couple of tacos', region: 'US', tipos: ['cantidad'], items: [['almuerzo', /taco/i, 2]] },
  {
    f: 'for breakfast eggs and bacon, for lunch a burrito, then for dinner steak with potatoes',
    region: 'US', tipos: ['varias', 'compuesto'],
    items: [['desayuno', /egg/i, null], ['desayuno', /bacon/i, null], ['almuerzo', /burrito/i, 1], ['cena', /steak|beef/i, null], ['cena', /potato/i, null]],
  },
  { f: 'this morning I had a latte', region: 'US', tipos: ['sinComida'], hora: 'almuerzo', items: [['desayuno', /latte|coffee/i, 1]] },
  { f: 'a can of coke', region: 'US', tipos: ['cantidad', 'marca'], items: [['almuerzo', /coke|cola/i, 1, 'lata']] },
  { f: 'one and a half cups of oatmeal', region: 'US', tipos: ['cantidad'], hora: 'desayuno', items: [['desayuno', /oat/i, 1.5, 'taza']] },
  {
    f: 'for lunch a turkey sandwich and an apple and for lunch also a diet coke',
    region: 'US', tipos: ['repetida'],
    items: [['almuerzo', /sandwich|turkey/i, 1], ['almuerzo', /apple/i, 1], ['almuerzo', /coke|cola/i, 1]],
  },
  // ------------------------------------------------------------ tanda 2: escritas después de arreglar la primera, para ver si generaliza
  {
    f: 'hoy en el desayuno tomé un té con dos galletitas en el almuerzo comí lentejas y en la cena dos porciones de pascualina',
    region: 'UY', tipos: ['varias', 'dictado'], tanda: 2,
    items: [['desayuno', /^t[eé]/i, 1], ['desayuno', /galle/i, 2], ['almuerzo', /lenteja/i, null], ['cena', /pascualina|tarta/i, 2]],
  },
  {
    f: 'de desayuno café con leche, de almuerzo un chivito y de merienda dos bizcochos. Ah, y también en el almuerzo una coca',
    region: 'UY', tipos: ['varias', 'repetida'], tanda: 2,
    items: [['desayuno', /caf[eé] con leche/i, null], ['almuerzo', /chivito/i, 1], ['merienda', /bizcocho/i, 2], ['almuerzo', /coca|cola/i, 1]],
  },
  {
    f: 'almorcé tallarines con tuco y de postre una banana, y a la noche cené dos empanadas de carne',
    region: 'UY', tipos: ['varias', 'compuesto'], tanda: 2,
    items: [['almuerzo', /tallar|fideo/i, null], ['almuerzo', /tuco|salsa/i, null], ['almuerzo', /banana/i, 1], ['cena', /empanada/i, 2]],
  },
  { f: 'en la merienda un mate cocido con tres tostadas', region: 'UY', tipos: ['compuesto'], tanda: 2, items: [['merienda', /mate/i, 1], ['merienda', /tostad|pan/i, 3]] },
  {
    f: 'ayer en la cena comí un plato de ravioles y un vaso de vino',
    region: 'UY', tipos: ['ayer', 'plato'], tanda: 2,
    items: [['cena ayer', /ravio/i, 1], ['cena ayer', /vino/i, 1, 'vaso']],
  },
  { f: 'una manzana y un puñado de nueces', region: 'UY', tipos: ['sinComida', 'cantidad'], hora: 'snack', tanda: 2, items: [['snack', /manzana/i, 1], ['snack', /nuez|nueces/i, 1, 'puñado']] },
  {
    f: 'en el desayuno dos tostadas con queso y un jugo de naranja en el almuerzo un bife con ensalada y en el desayuno también una banana',
    region: 'UY', tipos: ['varias', 'repetida', 'dictado'], tanda: 2,
    items: [['desayuno', /tostad|pan/i, 2], ['desayuno', /queso/i, null], ['desayuno', /jugo de naranja/i, 1], ['almuerzo', /bife con ensalada/i, 1], ['desayuno', /banana/i, 1]],
  },
  { f: 'comí ciento cincuenta gramos de pechuga de pollo', region: 'UY', tipos: ['cantidad'], tanda: 2, items: [['almuerzo', /pollo|pechuga/i, 150, 'g']] },
  { f: 'una medialuna, no, mejor dos', region: 'UY', tipos: ['correccion'], hora: 'desayuno', tanda: 2, items: [['desayuno', /medialuna|croissant/i, 2]] },
  {
    f: 'para la merienda un yogur con granola y para la cena una tortilla de papas',
    region: 'AR', tipos: ['varias', 'compuesto'], tanda: 2,
    items: [['merienda', /yog/i, 1], ['merienda', /granola/i, null], ['cena', /tortilla/i, 1]],
  },
  {
    f: 'a la mañana dos medialunas con un café con leche y al mediodía una ensalada césar',
    region: 'AR', tipos: ['varias', 'compuesto'], tanda: 2,
    items: [['desayuno', /medialuna|croissant/i, 2], ['desayuno', /caf[eé] con leche/i, 1], ['almuerzo', /ensalada/i, 1]],
  },
  { f: 'anoche comí sushi, como doce piezas', region: 'AR', tipos: ['ayer', 'cantidad'], hora: 'almuerzo', tanda: 2, items: [['cena ayer', /sushi/i, 12]] },
  {
    f: 'en el desayuno unos huevos rancheros en la comida una sopa de fideo y en la cena tres tacos',
    region: 'MX', tipos: ['varias'], tanda: 2,
    items: [['desayuno', /huevo/i, null], ['almuerzo', /sopa/i, 1], ['cena', /taco/i, 3]],
  },
  { f: 'me tomé un vaso de agua de jamaica y dos tamales', region: 'MX', tipos: ['lista'], hora: 'desayuno', tanda: 2, items: [['desayuno', /jamaica/i, 1, 'vaso'], ['desayuno', /tamal/i, 2]] },
  {
    f: 'en el desayuno un café solo y una tostada con mantequilla, y para comer un plato de arroz con pollo',
    region: 'ES', tipos: ['varias', 'compuesto'], tanda: 2,
    items: [['desayuno', /caf[eé]/i, 1], ['desayuno', /tostad|pan/i, 1], ['desayuno', /mantequilla|manteca/i, null], ['almuerzo', /arroz con pollo/i, 1]],
  },
  { f: 'he cenado una pizza y dos cervezas', region: 'ES', tipos: ['lista'], hora: 'almuerzo', tanda: 2, items: [['cena', /pizza/i, 1], ['cena', /cerveza/i, 2]] },
  {
    f: 'desayuno: yogur y fruta; comida: lentejas; cena: pescado con verduras',
    region: 'ES', tipos: ['varias'], tanda: 2,
    items: [['desayuno', /yogur natural/i, null], ['desayuno', /fruta|macedonia/i, null], ['almuerzo', /lenteja/i, null], ['cena', /pescado|merluza/i, null], ['cena', /verdura/i, null]],
  },
  {
    f: 'for breakfast a bagel with cream cheese and a coffee, for lunch a salad and then for dinner two slices of pizza',
    region: 'US', tipos: ['varias', 'compuesto'], tanda: 2,
    items: [['desayuno', /bagel/i, 1], ['desayuno', /cream cheese/i, null], ['desayuno', /coffee/i, 1], ['almuerzo', /salad/i, 1], ['cena', /pizza/i, 2, 'rebanada']],
  },
  { f: 'last night for dinner I had chicken and rice', region: 'US', tipos: ['ayer'], hora: 'almuerzo', tanda: 2, items: [['cena ayer', /chicken/i, null], ['cena ayer', /rice/i, null]] },
  { f: 'I just had a banana and a protein shake', region: 'US', tipos: ['sinComida', 'dictado'], hora: 'snack', tanda: 2, items: [['snack', /banana/i, 1], ['snack', /protein|shake/i, 1]] },
  {
    f: 'lunch was a burrito bowl, and for breakfast I also had oatmeal',
    region: 'US', tipos: ['varias', 'repetida'], tanda: 2,
    items: [['almuerzo', /burrito/i, 1], ['desayuno', /oat/i, null]],
  },
  { f: 'two cups of coffee and three eggs, no, two eggs', region: 'US', tipos: ['correccion'], hora: 'desayuno', tanda: 2, items: [['desayuno', /coffee/i, 2, 'taza'], ['desayuno', /egg/i, 2]] },
];

type Real = { comida: EnComida; nombre: string | null; cantidad: number | null; unidad: Unidad | null };

/** La frase, leída y entendida como en la pantalla: cada grupo con su comida (o la de la hora) y su día. */
async function leerYEntender(caso: Caso): Promise<Real[]> {
  const idioma = caso.region === 'US' ? 'en' as const : 'es' as const;
  const op = { idioma, region: caso.region === 'US' ? 'UY' : caso.region };
  const buscar = (texto: string) => buscarAlimentos(base, texto, { ...op, limite: 8 });
  const nombres = new Set<string>();
  for (const b of conCon(caso.f, idioma)) {
    const [r] = await buscar(b);
    if (r && mismoNombre(r.coincide, b)) nombres.add(b);
  }
  const leida = leerFrase(caso.f, idioma, (b) => nombres.has(b));
  const reales: Real[] = [];
  for (const g of leida.grupos) {
    const lista = await entender(g.dichos, {
      buscar,
      detalle: (id) => detalleDeAlimento(base, id, op),
      ultimaCantidad: () => undefined,
      alias: () => undefined,
      conocido: () => false,
    });
    const comida = g.comida ?? caso.hora ?? 'almuerzo';
    for (const e of lista) {
      reales.push({ comida: g.ayer ? `${comida} ayer` : comida, nombre: e.opciones[e.elegida]?.alimento.nombre ?? null, cantidad: e.dicho.cantidad, unidad: e.dicho.unidad });
    }
  }
  return reales;
}

const coincide = ([comida, nombre, cantidad, unidad]: Esperado, r: Real) =>
  r.comida === comida && !!r.nombre && nombre.test(r.nombre) && r.cantidad === cantidad && (unidad === undefined || r.unidad === unidad);

/** Cuántos de lo esperado salieron (cada uno con uno distinto de lo real), y si sobró algo. */
function comparar(esperados: Esperado[], reales: Real[]): { bien: number; sobran: Real[]; faltan: Esperado[] } {
  const libres = [...reales];
  const faltan: Esperado[] = [];
  for (const x of esperados) {
    const k = libres.findIndex((r) => coincide(x, r));
    if (k >= 0) libres.splice(k, 1);
    else faltan.push(x);
  }
  return { bien: esperados.length - faltan.length, sobran: libres, faltan };
}

const texto = (r: Real) => `${r.comida}: ${r.nombre ?? '(no encontrado)'} ×${r.cantidad ?? '–'}${r.unidad ? ` ${r.unidad}` : ''}`;
const textoEsperado = ([c, n, q, u]: Esperado) => `${c}: ${n.source} ×${q ?? '–'}${u ? ` ${u}` : ''}`;

const resultados: { caso: Caso; bien: number; total: number; ok: boolean }[] = [];

describe('el banco de frases de «Decir lo que comí»', () => {
  it('tiene al menos 80 frases en español y 20 en inglés', () => {
    expect(BANCO.filter((c) => c.region !== 'US').length).toBeGreaterThanOrEqual(80);
    expect(BANCO.filter((c) => c.region === 'US').length).toBeGreaterThanOrEqual(20);
  });

  for (const caso of BANCO) {
    (caso.falla ? it.failing : it)(`${caso.region} · ${caso.f}`, async () => {
      const reales = await leerYEntender(caso);
      const { bien, sobran, faltan } = comparar(caso.items, reales);
      const ok = faltan.length === 0 && sobran.length === 0;
      resultados.push({ caso, bien, total: caso.items.length + sobran.length, ok });
      if (!ok) {
        throw new Error(`faltan: ${faltan.map(textoEsperado).join(' | ') || '—'}\nsobran: ${sobran.map(texto).join(' | ') || '—'}\nsalió: ${reales.map(texto).join(' | ')}`);
      }
    });
  }

  it('el puntaje', () => {
    if (!process.env.PUNTAJE) return;
    const linea = (nombre: string, lista: typeof resultados) => {
      const frases = lista.filter((r) => r.ok).length;
      const bien = lista.reduce((s, r) => s + r.bien, 0);
      const total = lista.reduce((s, r) => s + r.total, 0);
      return `${nombre.padEnd(12)} frases ${String(frases).padStart(3)}/${String(lista.length).padEnd(3)} (${Math.round((100 * frases) / Math.max(1, lista.length))} %) · alimentos ${bien}/${total} (${Math.round((100 * bien) / Math.max(1, total))} %)`;
    };
    const lineas = [linea('todo', resultados), linea('tanda 1', resultados.filter((x) => !x.caso.tanda)), linea('tanda 2', resultados.filter((x) => x.caso.tanda === 2))];
    for (const r of ['UY', 'AR', 'MX', 'ES', 'US'] as const) lineas.push(linea(r, resultados.filter((x) => x.caso.region === r)));
    lineas.push(linea('español', resultados.filter((x) => x.caso.region !== 'US')));
    const tipos: Tipo[] = ['varias', 'repetida', 'sinComida', 'ayer', 'cantidad', 'compuesto', 'lista', 'correccion', 'marca', 'plato', 'dictado'];
    for (const t of tipos) lineas.push(linea(t, resultados.filter((x) => x.caso.tipos.includes(t))));
    console.log(lineas.join('\n'));
  });
});
