import { describe, expect, it } from '@jest/globals';

import { gramosDeLinea, leerReceta, type LineaDeReceta, type Unidad } from './recetaDeTexto';

type Idioma = 'es' | 'en';
type Esperado = [cantidad: number | null, unidad: Unidad | null, buscado: string, nota: string | null];

/** La única línea que sale de un texto. */
function una(texto: string, idioma: Idioma = 'es'): LineaDeReceta {
  const { lineas } = leerReceta(texto, idioma);
  expect(lineas).toHaveLength(1);
  return lineas[0];
}

/** Lo que importa de una línea, con el texto adelante para saber cuál falló. */
function espera(texto: string, [cantidad, unidad, buscado, nota]: Esperado, idioma: Idioma = 'es') {
  const l = una(texto, idioma);
  expect({ texto, cantidad: l.cantidad, unidad: l.unidad, buscado: l.buscado, nota: l.nota }).toEqual({ texto, cantidad, unidad, buscado, nota });
}

const resumen = (lineas: LineaDeReceta[]) => lineas.map((l) => [l.cantidad, l.unidad, l.buscado, l.nota]);

describe('las cantidades', () => {
  it('lee enteros, decimales con coma o con punto y los miles', () => {
    espera('200 g de arroz', [200, 'g', 'arroz', null]);
    espera('1,5 kg de papas', [1.5, 'kg', 'papa', null]);
    espera('1.5 kg de papas', [1.5, 'kg', 'papa', null]);
    espera('1.000 g de harina', [1000, 'g', 'harina', null]);
  });

  it('lee fracciones: ½, 1½, 1/2 y 1 y ½', () => {
    espera('½ taza de azúcar', [0.5, 'taza', 'azúcar', null]);
    espera('1½ tazas de harina', [1.5, 'taza', 'harina', null]);
    espera('1/2 kg de harina', [0.5, 'kg', 'harina', null]);
    espera('1 y ½ taza de harina', [1.5, 'taza', 'harina', null]);
    espera('1/4 de taza de aceite', [0.25, 'taza', 'aceite', null]);
    espera('½ cebolla', [0.5, null, 'cebolla', null]);
  });

  it('lee los números escritos con palabras', () => {
    espera('Una taza y media de harina 0000', [1.5, 'taza', 'harina 0000', null]);
    espera('Medio kilo de carne picada', [0.5, 'kg', 'carne picada', null]);
    espera('Cuarto kilo de jamón', [0.25, 'kg', 'jamón', null]);
    espera('1 kilo y medio de papas', [1.5, 'kg', 'papa', null]);
    espera('Media docena de huevos', [6, null, 'huevo', null]);
    espera('Un par de tomates', [2, null, 'tomate', null]);
    // «cuarto» es ¼ solo con una unidad: «1 cuarto de pollo» es una presa.
    espera('1 cuarto de pollo', [1, null, 'cuarto de pollo', null]);
  });

  it('de un rango toma el medio', () => {
    espera('2-3 dientes de ajo', [2.5, 'diente', 'ajo', null]);
    espera('2 a 3 tomates', [2.5, null, 'tomate', null]);
    espera('Dos o tres cucharadas de miel', [2.5, 'cucharada', 'miel', null]);
  });

  it('lee la cantidad escrita después del alimento, pero «0000» es parte de la harina', () => {
    espera('Arroz 200 g', [200, 'g', 'arroz', null]);
    espera('Huevos x 2', [2, null, 'huevo', null]);
    espera('Harina: 500 g', [500, 'g', 'harina', null]);
    espera('Huevos: 3', [3, null, 'huevo', null]);
    espera('Harina 0000', [null, null, 'harina 0000', null]);
    espera('Leche 2%', [null, null, 'leche 2%', null]);
  });

  it('sin cantidad queda en null, con «a gusto» o «c/n» en la nota', () => {
    espera('Aceite c/n', [null, null, 'aceite', 'c/n']);
    espera('Pan rallado c/n', [null, null, 'pan rallado', 'c/n']);
    espera('Un poco de aceite', [null, null, 'aceite', 'un poco']);
    espera('Unas hojas de albahaca', [null, 'hoja', 'albahaca', null]);
    espera('Pizca de sal', [1, 'pizca', 'sal', null]);
  });
});

describe('las unidades', () => {
  it('con sus plurales y abreviaturas', () => {
    espera('3 cdas de aceite de oliva', [3, 'cucharada', 'aceite de oliva', null]);
    espera('2 cdas. de azúcar', [2, 'cucharada', 'azúcar', null]);
    espera('1 cdta de sal', [1, 'cucharadita', 'sal', null]);
    espera('2 c/s de azúcar', [2, 'cucharada', 'azúcar', null]);
    espera('100 gr de manteca blanda', [100, 'g', 'manteca', 'blanda']);
    espera('250 cc de leche', [250, 'ml', 'leche', null]);
    espera('1 l de leche', [1, 'l', 'leche', null]);
  });

  it('las que se cuentan', () => {
    espera('2 dientes de ajo', [2, 'diente', 'ajo', null]);
    espera('2 fetas de jamón', [2, 'feta', 'jamón', null]);
    espera('4 rebanadas de pan lactal', [4, 'rebanada', 'pan lactal', null]);
    espera('1 lata de atún', [1, 'lata', 'atún', null]);
    espera('Un chorrito de aceite', [1, 'chorrito', 'aceite', null]);
    espera('Una pizca de nuez moscada', [1, 'pizca', 'nuez moscada', null]);
    espera('Un puñado de nueces', [1, 'puñado', 'nueces', null]);
    espera('1 atado de acelga', [1, 'atado', 'acelga', null]);
    espera('2 ramitas de romero', [2, 'rama', 'romero', null]);
    espera('3 hojas de laurel', [3, 'hoja', 'laurel', null]);
    espera('1 vaso de vino blanco', [1, 'vaso', 'vino blanco', null]);
    espera('1 pocillo de aceite', [1, 'pocillo', 'aceite', null]);
    espera('1 cabeza de ajo', [1, 'cabeza', 'ajo', null]);
    espera('1 cubito de caldo', [1, 'unidad', 'caldo', null]);
  });

  it('el tamaño de un envase o la medida entre paréntesis mandan', () => {
    espera('1 lata (400 g) de tomates triturados', [400, 'g', 'tomate triturado', null]);
    espera('1 lata de 400 g de garbanzos', [400, 'g', 'garbanzo', null]);
    espera('1 paquete de fideos de 500 g', [500, 'g', 'fideo', null]);
    espera('2 latas (400 g c/u) de garbanzos', [800, 'g', 'garbanzo', null]);
    espera('1 sobre de levadura seca (10 g)', [10, 'g', 'levadura seca', null]);
    espera('1 taza (125 g) de harina', [125, 'g', 'harina', null]);
    expect(una('2 cebollas medianas (unos 300 g)')).toMatchObject({ cantidad: 300, unidad: 'g', buscado: 'cebolla', tamano: 'mediano' });
  });
});

describe('lo que se busca y la nota', () => {
  it('cómo se prepara va a la nota, salvo cuando es parte del alimento', () => {
    espera('1 cebolla picada', [1, null, 'cebolla', 'picada']);
    espera('1 zanahoria rallada', [1, null, 'zanahoria', 'rallada']);
    espera('2 tomates pelados y picados', [2, null, 'tomate', 'pelados y picados']);
    espera('3 tazas de agua tibia', [3, 'taza', 'agua', 'tibia']);
    espera('1 cucharadita de canela molida', [1, 'cucharadita', 'canela', 'molida']);
    espera('Queso rallado a gusto', [null, null, 'queso rallado', 'a gusto']);
    espera('500 g de carne molida', [500, 'g', 'carne molida', null]);
    espera('Batido de frutilla', [null, null, 'batido de frutilla', null]);
  });

  it('lo que es para algo, lo opcional y las alternativas', () => {
    espera('Aceite para freír', [null, null, 'aceite', 'para freír']);
    espera('200 ml de nata para montar', [200, 'ml', 'nata', 'para montar']);
    espera('Perejil picado para decorar', [null, null, 'perejil', 'picado para decorar']);
    espera('1 pechuga de pollo (sin piel)', [1, null, 'pechuga de pollo', '(sin piel)']);
    espera('Leche o agua', [null, null, 'leche', 'o agua']);
    espera('Opcional: nueces', [null, null, 'nueces', 'opcional']);
    espera('1 cda colmada de azúcar', [1, 'cucharada', 'azúcar', 'colmada']);
  });

  it('va en singular, para que el buscador encuentre «Tomate» antes que «Tomates secos»', () => {
    const buscado = (texto: string) => una(texto).buscado;
    expect(buscado('2 huevos')).toBe('huevo');
    expect(buscado('3 chiles serranos')).toBe('chile serrano');
    expect(buscado('12 tapas de empanadas')).toBe('tapa de empanada');
    expect(buscado('1 taza de frijoles cocidos')).toBe('frijol cocido');
    expect(buscado('4 limones')).toBe('limón');
    expect(buscado('2 calabacines')).toBe('calabacín');
    // «nuez» ya no es el principio de «nueces»: queda como está.
    expect(buscado('200 g de nueces')).toBe('nueces');
  });

  it('el tamaño elige la porción y no se busca', () => {
    expect(una('1 cebolla grande')).toMatchObject({ cantidad: 1, buscado: 'cebolla', tamano: 'grande' });
    expect(una('3 papas chicas')).toMatchObject({ cantidad: 3, buscado: 'papa', tamano: 'pequeno' });
    expect(una('2 papas medianas, peladas y en cubos')).toMatchObject({ buscado: 'papa', tamano: 'mediano', nota: 'peladas y en cubos' });
    expect(una('200 g de arroz')).not.toHaveProperty('tamano');
  });

  it('con la cuenta en el medio: «Jugo de 1 limón», «Claras de 3 huevos»', () => {
    espera('Jugo de 1 limón', [1, null, 'jugo de limón', null]);
    espera('Ralladura de 1 limón', [1, null, 'ralladura de limón', null]);
    espera('Claras de 3 huevos', [3, null, 'clara de huevo', null]);
  });
});

describe('el Río de la Plata, España y México', () => {
  it('las palabras de cada lugar', () => {
    espera('Tapas de empanadas x 12', [12, null, 'tapa de empanada', null]);
    espera('1 morrón rojo', [1, null, 'morrón rojo', null]);
    espera('2 tomates perita', [2, null, 'tomate perita', null]);
    espera('2 lonchas de jamón serrano', [2, 'rebanada', 'jamón serrano', null]);
    espera('1 cucharada sopera de pimentón', [1, 'cucharada', 'pimentón', null]);
    espera('Un chorro de aceite de oliva virgen extra', [1, 'chorrito', 'aceite de oliva', 'virgen extra']);
    espera('2 jitomates', [2, null, 'jitomate', null]);
    espera('1/2 pieza de cebolla', [0.5, 'unidad', 'cebolla', null]);
    espera('250 g de queso Oaxaca deshebrado', [250, 'g', 'queso oaxaca', 'deshebrado']);
    espera('1 manojo de cilantro', [1, 'atado', 'cilantro', null]);
  });
});

describe('varios ingredientes en una línea', () => {
  it('corta en las comas, pero no en «1,5 kg»', () => {
    expect(resumen(leerReceta('200 g de arroz, 2 huevos, sal', 'es').lineas)).toEqual([[200, 'g', 'arroz', null], [2, null, 'huevo', null], [null, null, 'sal', null]]);
    expect(resumen(leerReceta('1,5 kg de papas; 2 cebollas', 'es').lineas)).toEqual([[1.5, 'kg', 'papa', null], [2, null, 'cebolla', null]]);
  });

  it('corta en «y» cuando hay un alimento de cada lado, y la nota del último vale para todos', () => {
    expect(resumen(leerReceta('Sal y pimienta a gusto', 'es').lineas)).toEqual([[null, null, 'sal', 'a gusto'], [null, null, 'pimienta', 'a gusto']]);
    expect(resumen(leerReceta('Sal, pimienta y orégano a gusto', 'es').lineas)).toEqual([
      [null, null, 'sal', 'a gusto'], [null, null, 'pimienta', 'a gusto'], [null, null, 'orégano', 'a gusto'],
    ]);
    expect(resumen(leerReceta('2 huevos y 1 yema', 'es').lineas)).toEqual([[2, null, 'huevo', null], [1, null, 'yema', null]]);
    expect(resumen(leerReceta('Relleno: jamón y queso', 'es').lineas)).toEqual([[null, null, 'jamón', null], [null, null, 'queso', null]]);
  });

  it('lo que sigue a una coma sin alimento es del anterior', () => {
    espera('1 cebolla, picada', [1, null, 'cebolla', 'picada']);
    espera('Azúcar, 2 cdas', [2, 'cucharada', 'azúcar', null]);
    espera('Manteca derretida, 50 g', [50, 'g', 'manteca', 'derretida']);
    espera('Sal: a gusto', [null, null, 'sal', 'a gusto']);
    expect(una('1 cebolla, picada').texto).toBe('1 cebolla, picada');
  });
});

describe('en inglés', () => {
  it('las medidas de Estados Unidos', () => {
    espera('2 cups all-purpose flour', [2, 'taza', 'all-purpose flour', null], 'en');
    espera('1 tsp salt', [1, 'cucharadita', 'salt', null], 'en');
    espera('1/2 cup milk', [0.5, 'taza', 'milk', null], 'en');
    espera('1 1/2 cups sugar', [1.5, 'taza', 'sugar', null], 'en');
    espera('1-1/2 cups flour', [1.5, 'taza', 'flour', null], 'en');
    espera('2 tbsp olive oil', [2, 'cucharada', 'olive oil', null], 'en');
    espera('1/4 tsp black pepper', [0.25, 'cucharadita', 'black pepper', null], 'en');
    espera('2-3 tablespoons water', [2.5, 'cucharada', 'water', null], 'en');
    espera('1 lb ground beef', [1, 'lb', 'ground beef', null], 'en');
    espera('½ lb bacon', [0.5, 'lb', 'bacon', null], 'en');
    espera('8 oz cream cheese, softened', [8, 'oz', 'cream cheese', 'softened'], 'en');
    espera('1 cup (240 ml) whole milk', [240, 'ml', 'whole milk', null], 'en');
    expect(una('1/3 cup honey', 'en').cantidad).toBeCloseTo(1 / 3, 6);
  });

  it('con mayúscula, «T» es la cucharada; con minúscula, «t» es la cucharadita', () => {
    espera('1 T butter', [1, 'cucharada', 'butter', null], 'en');
    espera('2 t vanilla extract', [2, 'cucharadita', 'vanilla extract', null], 'en');
  });

  it('las cuentas, los tamaños y la unidad después del alimento', () => {
    expect(una('2 large eggs', 'en')).toMatchObject({ cantidad: 2, unidad: null, buscado: 'egg', tamano: 'grande' });
    expect(una('1 medium onion, diced', 'en')).toMatchObject({ cantidad: 1, buscado: 'onion', nota: 'diced', tamano: 'mediano' });
    espera('3 cloves garlic, minced', [3, 'diente', 'garlic', 'minced'], 'en');
    espera('2 garlic cloves, minced', [2, 'diente', 'garlic', 'minced'], 'en');
    espera('4 basil leaves', [4, 'hoja', 'basil', null], 'en');
    espera('Half an onion', [0.5, null, 'onion', null], 'en');
    espera('A dozen eggs', [12, null, 'egg', null], 'en');
    espera('A pinch of salt', [1, 'pizca', 'salt', null], 'en');
    espera('A handful of spinach', [1, 'puñado', 'spinach', null], 'en');
    espera('A few sprigs of thyme', [null, 'rama', 'thyme', null], 'en');
    espera('3 boneless skinless chicken breasts', [3, null, 'chicken breast', 'boneless skinless'], 'en');
    espera('1 heaping tablespoon sugar', [1, 'cucharada', 'sugar', 'heaping'], 'en');
  });

  it('los envases y las notas', () => {
    espera('1 (14.5 oz) can diced tomatoes', [14.5, 'oz', 'tomato', 'diced'], 'en');
    espera('2 (15-ounce) cans black beans, drained and rinsed', [30, 'oz', 'black bean', 'drained and rinsed'], 'en');
    espera('1 package (8 oz) cream cheese', [8, 'oz', 'cream cheese', null], 'en');
    espera('1 stick (1/2 cup) butter, softened', [0.5, 'taza', 'butter', 'softened'], 'en');
    espera('Juice of 1 lemon', [1, null, 'lemon juice', null], 'en');
    espera('1 cup flour, plus more for dusting', [1, 'taza', 'flour', 'plus more for dusting'], 'en');
    espera('Freshly ground black pepper', [null, null, 'black pepper', 'freshly ground'], 'en');
    expect(resumen(leerReceta('Salt and pepper to taste', 'en').lineas)).toEqual([[null, null, 'salt', 'to taste'], [null, null, 'pepper', 'to taste']]);
  });

  it('una receta en inglés se lee como tal aunque la app esté en español', () => {
    expect(leerReceta('2 cups flour\n3 large eggs\n1 tsp salt', 'es').lineas.map((l) => l.buscado)).toEqual(['flour', 'egg', 'salt']);
  });
});

const ARROZ_CON_POLLO = `Arroz con pollo

Una receta de todos los días.

Ingredientes:
• 300 g de arroz
• 4 muslos de pollo
• 1 morrón rojo, en tiras
• 2 dientes de ajo picados
• 1 litro de caldo de verduras
• 1 cdta. de pimentón
• Sal y pimienta a gusto

Rinde 4 porciones

Preparación
1. Dorar el pollo en una olla con un chorrito de aceite.
2. Agregar el ajo, el morrón y el arroz.
3. Cubrir con el caldo y cocinar 20 minutos.

Peso final: 1,8 kg`;

describe('una receta pegada entera', () => {
  it('con título, «Ingredientes:», viñetas, lo que rinde y la preparación', () => {
    const receta = leerReceta(ARROZ_CON_POLLO, 'es');
    expect(receta.lineas.map((l) => [l.texto, l.cantidad, l.unidad, l.buscado, l.nota])).toEqual([
      ['300 g de arroz', 300, 'g', 'arroz', null],
      ['4 muslos de pollo', 4, null, 'muslo de pollo', null],
      ['1 morrón rojo, en tiras', 1, null, 'morrón rojo', 'en tiras'],
      ['2 dientes de ajo picados', 2, 'diente', 'ajo', 'picados'],
      ['1 litro de caldo de verduras', 1, 'l', 'caldo de verdura', null],
      ['1 cdta. de pimentón', 1, 'cucharadita', 'pimentón', null],
      ['Sal', null, null, 'sal', 'a gusto'],
      ['pimienta a gusto', null, null, 'pimienta', 'a gusto'],
    ]);
    // El chorrito de aceite de los pasos no es un ingrediente; el peso final, después de los pasos, sí se lee.
    expect(receta.porciones).toBe(4);
    expect(receta.pesoFinal).toBe(1800);
  });

  it('de España, con las raciones en el título', () => {
    const receta = leerReceta('Gazpacho andaluz (6 raciones)\nIngredientes:\n1 kg de tomates maduros\n1 pimiento verde\n2 dientes de ajo\n50 ml de aceite de oliva virgen extra\n2 cucharadas de vinagre de Jerez\nSal al gusto', 'es');
    expect(receta.porciones).toBe(6);
    expect(resumen(receta.lineas)).toEqual([
      [1, 'kg', 'tomate maduro', null], [1, null, 'pimiento verde', null], [2, 'diente', 'ajo', null],
      [50, 'ml', 'aceite de oliva', 'virgen extra'], [2, 'cucharada', 'vinagre de jerez', null], [null, null, 'sal', 'al gusto'],
    ]);
  });

  it('de México, con «Modo de preparación» y las porciones en la cabecera', () => {
    const receta = leerReceta('SALSA ROJA\nTiempo: 15 min\nIngredientes (para 4 personas):\n- 1/2 kg de jitomate\n- 2 chiles serranos\n- 1/4 de cebolla\nModo de preparación\nLicúa el jitomate con los chiles.', 'es');
    expect(receta.porciones).toBe(4);
    expect(resumen(receta.lineas)).toEqual([[0.5, 'kg', 'jitomate', null], [2, null, 'chile serrano', null], [0.25, null, 'cebolla', null]]);
  });

  it('en inglés, con encabezados de Markdown, «Serves» y «Directions»', () => {
    const receta = leerReceta('# Classic Pancakes\nServes 4\n\n## Ingredients\n* 1 1/2 cups all-purpose flour\n* 3 1/2 tsp baking powder\n* 1 egg\n* 3 tbsp butter, melted\n\n## Directions\n1. In a large bowl, sift together the flour and baking powder.\n2. Make a well in the center.', 'en');
    expect(receta.porciones).toBe(4);
    expect(resumen(receta.lineas)).toEqual([
      [1.5, 'taza', 'all-purpose flour', null], [3.5, 'cucharadita', 'baking powder', null], [1, null, 'egg', null], [3, 'cucharada', 'butter', 'melted'],
    ]);
  });

  it('sin «Ingredientes:», el título seguido de un renglón en blanco no es un ingrediente', () => {
    const receta = leerReceta('Guiso de lentejas\n\n500 g de lentejas\n2 zanahorias\nSal\n\nRinde 6 porciones.', 'es');
    expect(receta.lineas.map((l) => l.buscado)).toEqual(['lenteja', 'zanahoria', 'sal']);
    expect(receta.porciones).toBe(6);
  });

  it('en una sola línea, con oraciones', () => {
    const receta = leerReceta('Ingredientes: 200 g de arroz, 2 huevos, sal. Rinde 2 porciones.', 'es');
    expect(resumen(receta.lineas)).toEqual([[200, 'g', 'arroz', null], [2, null, 'huevo', null], [null, null, 'sal', null]]);
    expect(receta.porciones).toBe(2);
  });

  it('desde el primer paso ya no hay ingredientes, aunque no diga «Preparación»', () => {
    const receta = leerReceta('200 g de harina\n2 huevos\nBatir los huevos con el azúcar hasta que estén espumosos.\nAgregar 100 g de manteca.', 'es');
    expect(receta.lineas.map((l) => l.buscado)).toEqual(['harina', 'huevo']);
  });

  it('los subtítulos no son ingredientes, y las notas se saltean', () => {
    const receta = leerReceta('Para la masa:\n300 g de harina\nPara el relleno\n200 g de jamón\nNota: la manteca tiene que estar fría\nRelleno: 200 g de queso', 'es');
    expect(resumen(receta.lineas)).toEqual([[300, 'g', 'harina', null], [200, 'g', 'jamón', null], [200, 'g', 'queso', null]]);
  });

  it('lo que rinde: las porciones o el peso final, que no son ingredientes', () => {
    const rinde = (texto: string, idioma: Idioma = 'es') => {
      const r = leerReceta(`${texto}\n200 g de harina`, idioma);
      expect(r.lineas).toHaveLength(1);
      return [r.porciones, r.pesoFinal];
    };
    expect(rinde('Rinde 4 porciones')).toEqual([4, null]);
    expect(rinde('Para 4 personas')).toEqual([4, null]);
    expect(rinde('4 porciones')).toEqual([4, null]);
    expect(rinde('Porciones: 6')).toEqual([6, null]);
    expect(rinde('Rinde 12 unidades')).toEqual([12, null]);
    expect(rinde('Peso final 900 g')).toEqual([null, 900]);
    expect(rinde('Pesa 1,2 kg terminado')).toEqual([null, 1200]);
    expect(rinde('Rinde aprox. 1,2 kg')).toEqual([null, 1200]);
    expect(rinde('Para 1 molde de 24 cm')).toEqual([null, null]);
    expect(rinde('Serves 4-6', 'en')).toEqual([5, null]);
    expect(rinde('Makes 6 servings', 'en')).toEqual([6, null]);
    expect(rinde('Makes about 24 cookies', 'en')).toEqual([24, null]);
    expect(rinde('Yield: 1 loaf (12 slices)', 'en')).toEqual([12, null]);
    expect(rinde('Final weight 900 g', 'en')).toEqual([null, 900]);
    expect(rinde('Final weight: 2 lb', 'en')).toEqual([null, 907.2]);
  });

  it('el título con las porciones entre paréntesis no es un ingrediente, y las porciones quedan', () => {
    const receta = leerReceta('Milanesas al horno (4 porciones)\n1 kg de nalga\n3 huevos\n200 g de pan rallado', 'es');
    expect(receta.porciones).toBe(4);
    expect(receta.lineas.map((l) => l.buscado)).toEqual(['nalga', 'huevo', 'pan rallado']);
  });
});

describe('nada se rompe', () => {
  it('con texto vacío, raro o que no es texto', () => {
    const raros: unknown[] = ['', '   ', '\n\n\n', '---', '!!!', '((()))', '(sin cerrar', ')', '½', 'x', 'g', 'de de de', '🍅🍅', ':', '1/0 taza', '9999999999999 kg', 'a'.repeat(5000), null, undefined, 42];
    for (const texto of raros) {
      expect(() => leerReceta(texto as string, 'es')).not.toThrow();
      expect(() => leerReceta(texto as string, 'en')).not.toThrow();
    }
    for (const texto of ['', '   ', '---', '!!!', '((()))', '½', 'x', 'g', 'de de de', '🍅🍅', ':', null, undefined, 42]) {
      expect(leerReceta(texto as string, 'es')).toEqual({ lineas: [], porciones: null, pesoFinal: null });
    }
  });

  it('gramosDeLinea con porciones raras o sin porciones', () => {
    const raro = { porciones: [{ nombre: '', gramos: 10 }, { nombre: '1 taza', gramos: 0 }, { nombre: 'Porción típica', gramos: -3 }], densidad: null };
    expect(gramosDeLinea({ cantidad: 1, unidad: 'taza' }, raro)).toBeNull();
    expect(gramosDeLinea({ cantidad: 2, unidad: 'diente' }, { porciones: [], densidad: null })).toBeNull();
    expect(gramosDeLinea({ cantidad: Number.NaN, unidad: 'g' }, { porciones: [], densidad: null })).toBeNull();
    expect(gramosDeLinea({ cantidad: -1, unidad: 'g' }, { porciones: [], densidad: null })).toBeNull();
  });
});

describe('gramosDeLinea', () => {
  const nada = { porciones: [], densidad: null };
  const harina = { porciones: [{ nombre: '1 taza', gramos: 125 }, { nombre: '1 cucharada', gramos: 8 }], densidad: null };
  const azucar = { porciones: [{ nombre: '1 cucharadita', gramos: 4.2 }, { nombre: '1 cucharada', gramos: 12.5 }], densidad: null };
  const leche = { porciones: [{ nombre: '1 vaso (200 ml)', gramos: 206 }, { nombre: '1 taza (240 ml)', gramos: 248 }], densidad: 1.03 };
  const aceite = { porciones: [{ nombre: '1 cucharada', gramos: 13.6 }, { nombre: '1 cucharadita', gramos: 4.5 }], densidad: 0.92 };
  const huevo = { porciones: [{ nombre: '1 unidad', gramos: 50 }, { nombre: '1 mediano', gramos: 44 }, { nombre: '1 extra grande', gramos: 56 }], densidad: null };
  const egg = { porciones: [{ nombre: '1 large egg', gramos: 50 }, { nombre: '1 medium egg', gramos: 44 }, { nombre: '1 extra large egg', gramos: 56 }], densidad: null };
  const cebolla = { porciones: [{ nombre: '1 mediana', gramos: 110 }, { nombre: '1 pequeña', gramos: 70 }, { nombre: '1 grande', gramos: 150 }, { nombre: '1 taza picada', gramos: 160 }], densidad: null };

  it('lo que pesa va directo, sin mirar el alimento', () => {
    expect(gramosDeLinea({ cantidad: 200, unidad: 'g' }, nada)).toBe(200);
    expect(gramosDeLinea({ cantidad: 1.5, unidad: 'kg' }, nada)).toBe(1500);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'lb' }, nada)).toBe(453.6);
    expect(gramosDeLinea({ cantidad: 8, unidad: 'oz' }, nada)).toBe(226.8);
  });

  it('la taza y las cucharadas, primero por la porción con ese nombre', () => {
    expect(gramosDeLinea({ cantidad: 2, unidad: 'taza' }, harina)).toBe(250);
    expect(gramosDeLinea({ cantidad: 3, unidad: 'cucharada' }, harina)).toBe(24);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'taza' }, leche)).toBe(248);
    expect(gramosDeLinea({ cantidad: 0.5, unidad: 'taza' }, cebolla)).toBe(80);
    // «2 cucharadas picada = 5,3 g»: una cucharada es la mitad.
    expect(gramosDeLinea({ cantidad: 1, unidad: 'cucharada' }, { porciones: [{ nombre: '5 hojas', gramos: 2.5 }, { nombre: '2 cucharadas picada', gramos: 5.3 }], densidad: null })).toBe(2.7);
  });

  it('sin esa porción, por la densidad: 236,6 ml la taza, 14,8 la cucharada y 4,9 la cucharadita', () => {
    expect(gramosDeLinea({ cantidad: 1, unidad: 'taza' }, aceite)).toBe(217.7);
    const soloDensidad = { porciones: [], densidad: 0.92 };
    expect(gramosDeLinea({ cantidad: 1, unidad: 'cucharada' }, soloDensidad)).toBe(13.6);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'cucharadita' }, soloDensidad)).toBe(4.5);
    expect(gramosDeLinea({ cantidad: 2, unidad: 'taza' }, soloDensidad)).toBe(435.3);
  });

  it('los ml, por la densidad; sin ella, por la porción medida en volumen; si no hay ninguna, null', () => {
    expect(gramosDeLinea({ cantidad: 250, unidad: 'ml' }, leche)).toBe(257.5);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'l' }, { porciones: [], densidad: 1 })).toBe(1000);
    expect(gramosDeLinea({ cantidad: 30, unidad: 'ml' }, aceite)).toBe(27.6);
    // El azúcar no tiene densidad ni taza, pero su cucharada dice cuánto pesa un ml: una taza son unos 200 g.
    expect(gramosDeLinea({ cantidad: 1, unidad: 'taza' }, azucar)).toBe(199.8);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'cucharadita' }, harina)).toBe(2.6);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'taza' }, nada)).toBeNull();
    expect(gramosDeLinea({ cantidad: 100, unidad: 'ml' }, { porciones: [{ nombre: '1 unidad', gramos: 50 }], densidad: null })).toBeNull();
  });

  it('lo que se cuenta, por la porción de ese nombre', () => {
    expect(gramosDeLinea({ cantidad: 2, unidad: 'diente' }, { porciones: [{ nombre: '1 diente', gramos: 3 }], densidad: null })).toBe(6);
    expect(gramosDeLinea({ cantidad: 2, unidad: 'feta' }, { porciones: [{ nombre: '1 rebanada', gramos: 28 }], densidad: null })).toBe(56);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'lata' }, { porciones: [{ nombre: '100 g', gramos: 100 }, { nombre: '1 lata', gramos: 165 }], densidad: null })).toBe(165);
    expect(gramosDeLinea({ cantidad: 10, unidad: 'hoja' }, { porciones: [{ nombre: '5 hojas', gramos: 2.5 }], densidad: null })).toBe(5);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'puñado' }, { porciones: [{ nombre: '1 puñado', gramos: 28 }, { nombre: '1 unidad', gramos: 2 }], densidad: null })).toBe(28);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'vaso' }, leche)).toBe(206);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'pizca' }, { porciones: [{ nombre: '1 pizca', gramos: 0.4 }, { nombre: '1 cucharadita', gramos: 6 }], densidad: null })).toBe(0.4);
  });

  it('una cuenta sin unidad usa la unidad del alimento, del tamaño escrito o la de siempre', () => {
    expect(gramosDeLinea({ cantidad: 2, unidad: null }, huevo)).toBe(100);
    expect(gramosDeLinea({ cantidad: 2, unidad: null }, egg)).toBe(100);
    expect(gramosDeLinea({ cantidad: 2, unidad: null, tamano: 'mediano' }, egg)).toBe(88);
    // «Grande» no es «extra grande»: sin una grande, la de siempre.
    expect(gramosDeLinea({ cantidad: 2, unidad: null, tamano: 'grande' }, huevo)).toBe(100);
    expect(gramosDeLinea({ cantidad: 1, unidad: null }, cebolla)).toBe(110);
    expect(gramosDeLinea({ cantidad: 1, unidad: 'unidad', tamano: 'grande' }, cebolla)).toBe(150);
    expect(gramosDeLinea({ cantidad: 20, unidad: null }, { porciones: [{ nombre: '1 taza', gramos: 150 }, { nombre: '10 uvas', gramos: 49 }], densidad: null })).toBe(98);
    expect(gramosDeLinea({ cantidad: 1, unidad: null }, { porciones: [{ nombre: '1 cucharada', gramos: 15 }, { nombre: '1 limón exprimido', gramos: 47 }], densidad: null })).toBe(47);
    expect(gramosDeLinea({ cantidad: 1, unidad: null }, { porciones: [{ nombre: '1 porción', gramos: 110 }], densidad: null })).toBeNull();
  });

  it('sin cantidad, o sin una porción para pasarla, null: la pantalla la pregunta', () => {
    expect(gramosDeLinea({ cantidad: null, unidad: null }, huevo)).toBeNull();
    expect(gramosDeLinea({ cantidad: 1, unidad: 'chorrito' }, aceite)).toBeNull();
    expect(gramosDeLinea({ cantidad: 1, unidad: 'pocillo' }, aceite)).toBeNull();
    expect(gramosDeLinea({ cantidad: 2, unidad: 'diente' }, harina)).toBeNull();
  });

  it('con lo que lee leerReceta', () => {
    const ajo = { porciones: [{ nombre: '1 diente', gramos: 3 }], densidad: null };
    expect(gramosDeLinea(una('2-3 dientes de ajo'), ajo)).toBe(7.5);
    expect(gramosDeLinea(una('1 cebolla grande'), cebolla)).toBe(150);
    expect(gramosDeLinea(una('½ taza de leche'), leche)).toBe(124);
    expect(gramosDeLinea(una('Sal a gusto'), azucar)).toBeNull();
  });
});
