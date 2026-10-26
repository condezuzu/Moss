// El plan de comidas: Moss arma las comidas de un día o de una semana que llegan a la meta, y las
// rehace cuando la meta cambia. Primero lo que la persona come seguido, después lo que marcó que le
// gusta y, si falta, las comidas tipo (PLANTILLAS), siempre dentro de lo que contestó: la dieta,
// las alergias, cuántas comidas hace y cuánto tiempo tiene para cocinar. Lo que no le gusta deja de
// proponerse, pero no se borra. El plan se guarda como registros planificados (registros.ts) y se
// confirma con `confirmar`; «Comí esto» registra una comida sola (itemsDeComida).
// La galería usa este mismo archivo: lo que no es un tipo se importa solo de fechas.ts.

import type { Comida } from './comidas';
import { diasEntre, sumarDias, type ClaveDia } from './fechas';
import type { Macros } from './metas';
import type { Cantidad, Fuente, Item, Registro, Secundarios, Valores } from './registros';

export type Dieta = 'todo' | 'vegetariana' | 'vegana' | 'pescetariana';
export const DIETAS: readonly Dieta[] = ['todo', 'vegetariana', 'vegana', 'pescetariana'];

/** Los alérgenos que piden declarar las etiquetas (los de la FDA y los de la Unión Europea que más se ven). */
export type Alergeno = 'gluten' | 'leche' | 'huevo' | 'mani' | 'frutosSecos' | 'soja' | 'pescado' | 'mariscos' | 'sesamo';
export const ALERGENOS: readonly Alergeno[] = ['gluten', 'leche', 'huevo', 'mani', 'frutosSecos', 'soja', 'pescado', 'mariscos', 'sesamo'];

/** El tiempo para cocinar y lo más que puede llevar una comida: poco, 15 minutos; normal, 40; mucho, lo que sea. */
export type Tiempo = 'poco' | 'normal' | 'mucho';
export const MINUTOS: Record<Tiempo, number> = { poco: 15, normal: 40, mucho: Infinity };

/** Lo del cuestionario. `noMeGusta` y `meGusta` son claves de opciones. */
export type Preferencias = { dieta: Dieta; alergias: Alergeno[]; comidas: 3 | 4 | 5; tiempo: Tiempo; noMeGusta: string[]; meGusta: string[] };

/**
 * Una comida que se puede proponer: una tuya (opcionesTuyas) o una comida tipo (opcionDePlantilla),
 * con sus cantidades de siempre, que el plan escala.
 */
export type Opcion = {
  clave: string;
  /** El de la comida tipo, en el idioma de la app. Lo tuyo no tiene: se nombra por sus alimentos. */
  nombre: string | null;
  comida: Comida;
  items: Item[];
  origen: 'tuya' | 'tipo';
  /** Cuántas veces la comiste en las últimas semanas; una comida tipo, 0. */
  veces: number;
  dietas: Dieta[];
  contiene: Alergeno[];
  /** Lo que lleva prepararla. */
  minutos: number;
};

/** Una comida del plan; `opcion` es la clave de la opción de la que sale. */
export type ComidaPlaneada = { comida: Comida; opcion: string; items: Item[]; valores: Valores };
/** `alcanza`: el día queda a menos de un 5 % de las kcal de la meta y con al menos el 90 % de la proteína. */
export type DiaPlaneado = { dia: ClaveDia; comidas: ComidaPlaneada[]; valores: Valores; alcanza: boolean };

/** Una línea de la lista de compras: `porciones` si todas las veces fue la misma porción, y en cuántas comidas está. */
export type Compra = { clave: string; nombre: string; gramos: number; porciones: { nombre: string; veces: number } | null; comidas: number };

/** Lo que la base del teléfono sabe de un alimento curado, por su nombre en español. */
export type Resolver = (nombre: string) => { fuente: Fuente; ref: string; nombre: string; por100g: Valores; porciones?: { nombre: string; gramos: number }[] } | null;

/**
 * Qué parte de las kcal del día va a cada comida, según cuántas se hacen: el almuerzo y la cena
 * son las grandes; la merienda y el snack, las chicas.
 */
export const REPARTO: Record<3 | 4 | 5, Partial<Record<Comida, number>>> = {
  3: { desayuno: 0.25, almuerzo: 0.4, cena: 0.35 },
  4: { desayuno: 0.2, almuerzo: 0.35, merienda: 0.15, cena: 0.3 },
  5: { desayuno: 0.2, almuerzo: 0.3, merienda: 0.15, cena: 0.25, snack: 0.1 },
};

// El orden del día, como COMIDAS en comidas.ts (que la galería no le pasa a este archivo).
const ORDEN: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];

/** Las comidas del plan: 3 son desayuno, almuerzo y cena; 4 suman la merienda, y 5, el snack. */
export const comidasDelPlan = (n: 3 | 4 | 5): Comida[] => ORDEN.filter((c) => REPARTO[n][c] != null);

// ------------------------------------------------------------ las comidas tipo

/** Una comida tipo: los alimentos por su nombre curado en español (assets/alimentos.db), en gramos. */
export type Plantilla = {
  clave: string;
  nombre: { es: string; en: string };
  comida: Comida;
  items: readonly (readonly [string, number])[];
  dietas: readonly Dieta[];
  contiene: readonly Alergeno[];
  minutos: number;
};

// Quién puede comer cada una: lo vegano, cualquiera; lo que tiene carne, solo quien come de todo.
const VEGANA = DIETAS;
const VEGETARIANA: readonly Dieta[] = ['todo', 'vegetariana', 'pescetariana'];
const CON_PESCADO: readonly Dieta[] = ['todo', 'pescetariana'];
const CON_CARNE: readonly Dieta[] = ['todo'];

/**
 * Para cuando lo tuyo no alcanza: lo de todos los días, de acá y de todas partes, para las cuatro
 * dietas y con opciones rápidas en cada comida. Los gramos caen justo en una porción cuando se
 * puede («2 rebanadas»). Los alérgenos van de más ante la duda: la avena cuenta como gluten.
 */
export const PLANTILLAS: readonly Plantilla[] = [
  // desayunos
  { clave: 'avena-banana', nombre: { es: 'Avena con leche y banana', en: 'Oatmeal with milk and banana' }, comida: 'desayuno',
    items: [['Avena', 40], ['Leche entera', 206], ['Banana', 118]], dietas: VEGETARIANA, contiene: ['gluten', 'leche'], minutos: 10 },
  { clave: 'yogur-granola', nombre: { es: 'Yogur griego con granola y arándanos', en: 'Greek yogurt with granola and blueberries' }, comida: 'desayuno',
    items: [['Yogur griego', 170], ['Granola', 55], ['Arándanos', 74]], dietas: VEGETARIANA, contiene: ['leche', 'gluten', 'frutosSecos'], minutos: 5 },
  { clave: 'huevos-tostadas', nombre: { es: 'Huevos revueltos con tostadas y tomate', en: 'Scrambled eggs on toast with tomato' }, comida: 'desayuno',
    items: [['Huevos revueltos', 122], ['Pan integral', 64], ['Tomate', 123]], dietas: VEGETARIANA, contiene: ['huevo', 'gluten'], minutos: 10 },
  { clave: 'cafe-tostadas', nombre: { es: 'Café con leche y tostadas con queso crema y mermelada', en: 'Coffee with milk and toast with cream cheese and jam' }, comida: 'desayuno',
    items: [['Café con leche', 252], ['Pan tostado', 50], ['Queso crema light', 30], ['Mermelada', 20]], dietas: VEGETARIANA, contiene: ['leche', 'gluten'], minutos: 5 },
  { clave: 'tostadas-aguacate', nombre: { es: 'Tostadas con aguacate y huevo duro', en: 'Avocado toast with a hard-boiled egg' }, comida: 'desayuno',
    items: [['Pan integral', 64], ['Aguacate', 50], ['Huevo duro', 100]], dietas: VEGETARIANA, contiene: ['gluten', 'huevo'], minutos: 10 },
  { clave: 'batido-proteina', nombre: { es: 'Batido de proteína con banana y avena', en: 'Protein shake with banana and oats' }, comida: 'desayuno',
    items: [['Proteína de suero', 30], ['Leche descremada', 206], ['Banana', 118], ['Avena', 40]], dietas: VEGETARIANA, contiene: ['leche', 'gluten'], minutos: 5 },
  { clave: 'avena-soja', nombre: { es: 'Avena con leche de soja, banana y mantequilla de maní', en: 'Oatmeal with soy milk, banana and peanut butter' }, comida: 'desayuno',
    items: [['Avena', 40], ['Leche de soja', 206], ['Banana', 118], ['Mantequilla de maní', 16]], dietas: VEGANA, contiene: ['gluten', 'soja', 'mani'], minutos: 10 },
  { clave: 'tofu-revuelto', nombre: { es: 'Tofu revuelto con espinaca y tostadas', en: 'Tofu scramble with spinach on toast' }, comida: 'desayuno',
    items: [['Tofu firme', 150], ['Espinaca', 30], ['Tomate', 123], ['Pan integral', 64], ['Aceite de oliva', 4.5]], dietas: VEGANA, contiene: ['soja', 'gluten'], minutos: 15 },
  { clave: 'chia-mango', nombre: { es: 'Pudín de chía con leche de almendras y mango', en: 'Chia pudding with almond milk and mango' }, comida: 'desayuno',
    items: [['Chía', 24], ['Leche de almendras', 206], ['Mango', 165], ['Semillas de calabaza', 15]], dietas: VEGANA, contiene: ['frutosSecos'], minutos: 5 },
  { clave: 'omelet-naranja', nombre: { es: 'Omelet de espinaca y tomate, y una naranja', en: 'Spinach and tomato omelet with an orange' }, comida: 'desayuno',
    items: [['Huevo', 100], ['Espinaca', 30], ['Tomate', 123], ['Aceite de oliva', 4.5], ['Naranja', 131]], dietas: VEGETARIANA, contiene: ['huevo'], minutos: 10 },
  // Con mucha proteína: para que un desayuno así tenga otro con que cambiarse.
  { clave: 'yogur-avena-arandanos', nombre: { es: 'Yogur griego con avena y arándanos', en: 'Greek yogurt with oats and blueberries' }, comida: 'desayuno',
    items: [['Yogur griego descremado', 340], ['Avena', 40], ['Arándanos', 74]], dietas: VEGETARIANA, contiene: ['leche', 'gluten'], minutos: 3 },
  { clave: 'claras-pavo-tostada', nombre: { es: 'Revuelto de claras con pavo y tostadas', en: 'Egg white and turkey scramble on toast' }, comida: 'desayuno',
    items: [['Clara de huevo', 132], ['Huevo', 50], ['Pechuga de pavo', 60], ['Pan integral', 64], ['Aceite de oliva', 4.5]], dietas: CON_CARNE, contiene: ['huevo', 'gluten'], minutos: 10 },

  // meriendas
  { clave: 'tostada-queso-dulce', nombre: { es: 'Café con leche y tostada con queso y dulce de membrillo', en: 'Coffee with milk and toast with cheese and quince paste' }, comida: 'merienda',
    items: [['Café con leche', 252], ['Pan tostado', 25], ['Queso fresco', 30], ['Dulce de membrillo', 20]], dietas: VEGETARIANA, contiene: ['leche', 'gluten'], minutos: 5 },
  { clave: 'yogur-manzana', nombre: { es: 'Yogur griego con manzana', en: 'Greek yogurt with an apple' }, comida: 'merienda',
    items: [['Yogur griego descremado', 170], ['Manzana', 182]], dietas: VEGETARIANA, contiene: ['leche'], minutos: 2 },
  { clave: 'batido-banana', nombre: { es: 'Batido de banana con leche y mantequilla de maní', en: 'Banana, milk and peanut butter shake' }, comida: 'merienda',
    items: [['Leche descremada', 206], ['Banana', 118], ['Mantequilla de maní', 16]], dietas: VEGETARIANA, contiene: ['leche', 'mani'], minutos: 5 },
  { clave: 'hummus-zanahoria', nombre: { es: 'Hummus con zanahoria y galletas de arroz', en: 'Hummus with carrot sticks and rice cakes' }, comida: 'merienda',
    items: [['Hummus', 60], ['Zanahoria', 61], ['Galletas de arroz', 18]], dietas: VEGANA, contiene: ['sesamo'], minutos: 5 },
  { clave: 'tostadas-mani', nombre: { es: 'Tostadas con mantequilla de maní y banana', en: 'Toast with peanut butter and banana' }, comida: 'merienda',
    items: [['Pan integral', 64], ['Mantequilla de maní', 16], ['Banana', 118]], dietas: VEGANA, contiene: ['gluten', 'mani'], minutos: 5 },
  { clave: 'sandwich-jamon-queso', nombre: { es: 'Sándwich caliente de jamón y queso', en: 'Toasted ham and cheese sandwich' }, comida: 'merienda',
    items: [['Pan blanco', 50], ['Jamón cocido', 28], ['Queso mozzarella', 21]], dietas: CON_CARNE, contiene: ['gluten', 'leche'], minutos: 5 },
  { clave: 'cottage-arandanos', nombre: { es: 'Queso cottage con arándanos', en: 'Cottage cheese with blueberries' }, comida: 'merienda',
    items: [['Queso cottage', 210], ['Arándanos', 74]], dietas: VEGETARIANA, contiene: ['leche'], minutos: 2 },
  { clave: 'atun-galletas', nombre: { es: 'Atún con tomate y galletas de arroz', en: 'Tuna with tomato and rice cakes' }, comida: 'merienda',
    items: [['Atún en agua', 165], ['Tomate', 61.5], ['Galletas de arroz', 18]], dietas: CON_PESCADO, contiene: ['pescado'], minutos: 5 },
  // snacks
  { clave: 'manzana-almendras', nombre: { es: 'Manzana con almendras', en: 'Apple with almonds' }, comida: 'snack',
    items: [['Manzana', 182], ['Almendras', 14]], dietas: VEGANA, contiene: ['frutosSecos'], minutos: 1 },
  { clave: 'yogur-miel', nombre: { es: 'Yogur griego con miel', en: 'Greek yogurt with honey' }, comida: 'snack',
    items: [['Yogur griego descremado', 170], ['Miel', 7]], dietas: VEGETARIANA, contiene: ['leche'], minutos: 1 },
  { clave: 'banana-mani', nombre: { es: 'Banana con mantequilla de maní', en: 'Banana with peanut butter' }, comida: 'snack',
    items: [['Banana', 118], ['Mantequilla de maní', 16]], dietas: VEGANA, contiene: ['mani'], minutos: 1 },
  { clave: 'huevos-duros', nombre: { es: 'Huevos duros con tomate', en: 'Hard-boiled eggs with tomato' }, comida: 'snack',
    items: [['Huevo duro', 100], ['Tomate', 91]], dietas: VEGETARIANA, contiene: ['huevo'], minutos: 12 },
  { clave: 'queso-galletas', nombre: { es: 'Queso con galletas integrales', en: 'Cheese with whole-wheat crackers' }, comida: 'snack',
    items: [['Queso fresco', 30], ['Galletas integrales', 28]], dietas: VEGETARIANA, contiene: ['leche', 'gluten'], minutos: 2 },
  { clave: 'edamame', nombre: { es: 'Edamame', en: 'Edamame' }, comida: 'snack',
    items: [['Edamame', 160]], dietas: VEGANA, contiene: ['soja'], minutos: 8 },
  { clave: 'naranja-semillas', nombre: { es: 'Naranja con semillas de calabaza', en: 'Orange with pumpkin seeds' }, comida: 'snack',
    items: [['Naranja', 131], ['Semillas de calabaza', 15]], dietas: VEGANA, contiene: [], minutos: 1 },
  { clave: 'pavo-queso', nombre: { es: 'Pavo con queso fresco', en: 'Turkey with fresh cheese' }, comida: 'snack',
    items: [['Pechuga de pavo', 60], ['Queso fresco', 30]], dietas: CON_CARNE, contiene: ['leche'], minutos: 1 },

  // almuerzos
  { clave: 'pollo-arroz', nombre: { es: 'Pollo a la plancha con arroz y ensalada', en: 'Grilled chicken with rice and salad' }, comida: 'almuerzo',
    items: [['Pechuga de pollo a la plancha', 150], ['Arroz blanco cocido', 158], ['Lechuga', 35], ['Tomate', 123], ['Aceite de oliva', 4.5]], dietas: CON_CARNE, contiene: [], minutos: 25 },
  { clave: 'milanesa-pure', nombre: { es: 'Milanesa al horno con puré', en: 'Baked breaded steak with mashed potatoes' }, comida: 'almuerzo',
    items: [['Milanesa de carne al horno', 150], ['Puré de papas', 250]], dietas: CON_CARNE, contiene: ['gluten', 'huevo', 'leche'], minutos: 40 },
  { clave: 'carne-papa', nombre: { es: 'Carne a la plancha con papa al horno y ensalada', en: 'Grilled steak with baked potato and salad' }, comida: 'almuerzo',
    items: [['Lomo', 160], ['Papa al horno', 173], ['Lechuga', 35], ['Tomate', 123], ['Aceite de oliva', 4.5]], dietas: CON_CARNE, contiene: [], minutos: 30 },
  { clave: 'fideos-bolonesa', nombre: { es: 'Fideos con salsa boloñesa', en: 'Pasta with bolognese sauce' }, comida: 'almuerzo',
    items: [['Pasta cocida', 248], ['Salsa boloñesa', 125], ['Queso rallado', 10]], dietas: CON_CARNE, contiene: ['gluten', 'leche'], minutos: 30 },
  { clave: 'guiso-lentejas', nombre: { es: 'Guiso de lentejas', en: 'Lentil stew' }, comida: 'almuerzo',
    items: [['Guiso de lentejas', 350]], dietas: CON_CARNE, contiene: [], minutos: 60 },
  { clave: 'merluza-papas', nombre: { es: 'Merluza con papas y ensalada', en: 'Hake with potatoes and salad' }, comida: 'almuerzo',
    items: [['Merluza', 135], ['Papa hervida', 272], ['Zanahoria', 61], ['Lechuga', 35], ['Aceite de oliva', 4.5]], dietas: CON_PESCADO, contiene: ['pescado'], minutos: 25 },
  { clave: 'salmon-quinoa', nombre: { es: 'Salmón con quinoa y brócoli', en: 'Salmon with quinoa and broccoli' }, comida: 'almuerzo',
    items: [['Salmón', 140], ['Quinoa cocida', 185], ['Brócoli cocido', 156]], dietas: CON_PESCADO, contiene: ['pescado'], minutos: 25 },
  { clave: 'atun-garbanzos', nombre: { es: 'Ensalada de atún y garbanzos', en: 'Tuna and chickpea salad' }, comida: 'almuerzo',
    items: [['Atún en agua', 165], ['Garbanzos en lata', 152], ['Tomate', 123], ['Lechuga', 35], ['Aceite de oliva', 4.5]], dietas: CON_PESCADO, contiene: ['pescado'], minutos: 10 },
  { clave: 'tofu-salteado', nombre: { es: 'Salteado de tofu con verduras y arroz integral', en: 'Tofu and vegetable stir-fry with brown rice' }, comida: 'almuerzo',
    items: [['Tofu firme', 150], ['Verduras mixtas cocidas', 180], ['Arroz integral cocido', 202], ['Salsa de soja', 16], ['Aceite de girasol', 4.5]], dietas: VEGANA, contiene: ['soja', 'gluten'], minutos: 20 },
  { clave: 'bowl-garbanzos', nombre: { es: 'Bowl de garbanzos, quinoa y batata', en: 'Chickpea, quinoa and sweet potato bowl' }, comida: 'almuerzo',
    items: [['Garbanzos', 164], ['Quinoa cocida', 92.5], ['Batata al horno', 150], ['Espinaca', 30], ['Tahini', 15]], dietas: VEGANA, contiene: ['sesamo'], minutos: 35 },
  { clave: 'curry-garbanzos', nombre: { es: 'Curry de garbanzos con arroz', en: 'Chickpea curry with rice' }, comida: 'almuerzo',
    items: [['Garbanzos en lata', 152], ['Tomate triturado', 121], ['Leche de coco para cocinar', 60], ['Espinaca', 30], ['Curry en polvo', 2], ['Arroz blanco cocido', 158]],
    dietas: VEGANA, contiene: [], minutos: 25 },
  { clave: 'tacos-frijoles', nombre: { es: 'Tacos de frijoles negros con aguacate', en: 'Black bean tacos with avocado' }, comida: 'almuerzo',
    items: [['Tortilla de maíz', 84], ['Frijoles negros', 172], ['Aguacate', 50], ['Pico de gallo', 60]], dietas: VEGANA, contiene: [], minutos: 15 },
  { clave: 'fideos-lentejas', nombre: { es: 'Fideos integrales con lentejas y salsa de tomate', en: 'Whole-wheat pasta with lentils and tomato sauce' }, comida: 'almuerzo',
    items: [['Pasta integral cocida', 140], ['Lentejas', 99], ['Salsa de tomate', 125]], dietas: VEGANA, contiene: ['gluten'], minutos: 25 },
  { clave: 'ravioles-tomate', nombre: { es: 'Ravioles de queso con salsa de tomate', en: 'Cheese ravioli with tomato sauce' }, comida: 'almuerzo',
    items: [['Ravioles', 250], ['Salsa de tomate', 125], ['Queso rallado', 10]], dietas: VEGETARIANA, contiene: ['gluten', 'huevo', 'leche'], minutos: 25 },
  { clave: 'pollo-horno', nombre: { es: 'Pollo al horno con papas', en: 'Roast chicken with potatoes' }, comida: 'almuerzo',
    items: [['Pollo asado', 200], ['Papa al horno', 173], ['Lechuga', 35], ['Tomate', 123]], dietas: CON_CARNE, contiene: [], minutos: 60 },
  { clave: 'cerdo-batata', nombre: { es: 'Lomo de cerdo con batata y judías verdes', en: 'Pork tenderloin with sweet potato and green beans' }, comida: 'almuerzo',
    items: [['Lomo de cerdo', 150], ['Batata al horno', 150], ['Judías verdes', 125], ['Aceite de oliva', 4.5]], dietas: CON_CARNE, contiene: [], minutos: 35 },
  { clave: 'empanada-ensalada', nombre: { es: 'Empanada de carne con ensalada', en: 'Beef empanada with salad' }, comida: 'almuerzo',
    items: [['Empanada de carne', 130], ['Lechuga', 35], ['Tomate', 123], ['Aceite de oliva', 4.5]], dietas: CON_CARNE, contiene: ['gluten', 'huevo'], minutos: 45 },
  { clave: 'polenta-tuco', nombre: { es: 'Polenta con tuco', en: 'Polenta with meat sauce' }, comida: 'almuerzo',
    items: [['Polenta con tuco', 460]], dietas: CON_CARNE, contiene: ['leche'], minutos: 30 },

  // cenas
  { clave: 'omelet-ensalada', nombre: { es: 'Omelet de queso con ensalada', en: 'Cheese omelet with salad' }, comida: 'cena',
    items: [['Omelet de queso', 130], ['Pan integral', 32], ['Lechuga', 35], ['Tomate', 123], ['Aceite de oliva', 4.5]], dietas: VEGETARIANA, contiene: ['huevo', 'leche', 'gluten'], minutos: 10 },
  { clave: 'pascualina', nombre: { es: 'Pascualina con ensalada de tomate', en: 'Chard and egg pie with tomato salad' }, comida: 'cena',
    items: [['Pascualina', 200], ['Tomate', 123], ['Aceite de oliva', 4.5]], dietas: VEGETARIANA, contiene: ['gluten', 'huevo', 'leche'], minutos: 60 },
  { clave: 'tortilla-papas', nombre: { es: 'Tortilla de papas con ensalada', en: 'Potato omelet with salad' }, comida: 'cena',
    items: [['Tortilla de papas', 300], ['Lechuga', 35], ['Tomate', 123]], dietas: VEGETARIANA, contiene: ['huevo'], minutos: 40 },
  { clave: 'sopa-pollo', nombre: { es: 'Sopa de pollo con verduras y pan', en: 'Chicken and vegetable soup with bread' }, comida: 'cena',
    items: [['Sopa de pollo con verduras', 300], ['Pan integral', 64]], dietas: CON_CARNE, contiene: ['gluten'], minutos: 30 },
  { clave: 'wrap-pollo', nombre: { es: 'Wrap de pollo con verduras', en: 'Chicken wrap with vegetables' }, comida: 'cena',
    items: [['Tortilla de harina', 71], ['Pechuga de pollo a la plancha', 100], ['Lechuga', 35], ['Tomate', 61.5], ['Queso crema light', 15]], dietas: CON_CARNE, contiene: ['gluten', 'leche'], minutos: 15 },
  { clave: 'hamburguesa-ensalada', nombre: { es: 'Hamburguesa con ensalada', en: 'Burger with salad' }, comida: 'cena',
    items: [['Hamburguesa de carne', 90], ['Pan de hamburguesa', 44], ['Lechuga', 35], ['Tomate', 61.5]], dietas: CON_CARNE, contiene: ['gluten'], minutos: 20 },
  { clave: 'hamburguesa-vegetal', nombre: { es: 'Hamburguesa vegetal con ensalada', en: 'Veggie burger with salad' }, comida: 'cena',
    items: [['Hamburguesa vegetal', 100], ['Pan de hamburguesa', 44], ['Lechuga', 35], ['Tomate', 61.5]], dietas: VEGETARIANA, contiene: ['gluten', 'soja'], minutos: 15 },
  { clave: 'wrap-hummus', nombre: { es: 'Wrap de hummus, garbanzos y verduras', en: 'Hummus, chickpea and vegetable wrap' }, comida: 'cena',
    items: [['Tortilla de harina', 71], ['Hummus', 60], ['Garbanzos en lata', 76], ['Lechuga', 35], ['Tomate', 61.5], ['Zanahoria', 61]], dietas: VEGANA, contiene: ['gluten', 'sesamo'], minutos: 10 },
];

// ------------------------------------------------------------ los valores (como en registros.ts)

const SECUNDARIOS: readonly (keyof Secundarios)[] = ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'];
type Micros = NonNullable<Valores['micros']>;

// Como escalar() de registros.ts, que la galería no le pasa a este archivo.
function escalarValores(v: Valores, factor: number): Valores {
  const r: Valores = { kcal: v.kcal * factor, proteina: v.proteina * factor, carbohidratos: v.carbohidratos * factor, grasas: v.grasas * factor };
  for (const k of SECUNDARIOS) if (v[k] != null) r[k] = v[k]! * factor;
  if (v.micros) {
    const m: Micros = {};
    for (const [k, x] of Object.entries(v.micros) as [keyof Micros, number | undefined][]) if (x != null) m[k] = x * factor;
    r.micros = m;
  }
  return r;
}

// Como sumarValores(): lo que no dice un alimento cuenta como cero, y lo que no dice ninguno no está.
function sumar(lista: Iterable<Valores>): Valores {
  const r: Valores = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  let micros: Micros | null = null;
  for (const v of lista) {
    r.kcal += v.kcal;
    r.proteina += v.proteina;
    r.carbohidratos += v.carbohidratos;
    r.grasas += v.grasas;
    for (const k of SECUNDARIOS) if (v[k] != null) r[k] = (r[k] ?? 0) + v[k]!;
    if (v.micros) {
      if (!micros) micros = {};
      for (const [k, x] of Object.entries(v.micros) as [keyof Micros, number | undefined][]) if (x != null) micros[k] = (micros[k] ?? 0) + x;
    }
  }
  if (micros) r.micros = micros;
  return r;
}

const valoresDe = (items: readonly Item[]) => sumar(items.map((it) => it.valores));
const gramosDe = (c: Cantidad) => (!c ? null : 'gramos' in c ? c.gramos : c.gramosPorcion * c.veces);
const itemDe = (r: Item): Item => ({ fuente: r.fuente, ref: r.ref, nombre: r.nombre, cantidad: r.cantidad, valores: r.valores, ...(r.estimado ? { estimado: true as const } : {}) });

// ------------------------------------------------------------ escalar

/** Cada comida va de la mitad al doble de su cantidad de siempre. */
const MINIMO = 0.5;
const MAXIMO = 2;

/**
 * Y del 70 % al 140 % de su parte del día: para llegar a la proteína se pasan kcal de una comida a
 * otra, pero un almuerzo de 1.700 kcal con un desayuno de 200 no es un plan. Si así no se llega,
 * mejor otra comida (mejorar).
 */
const BANDA_MINIMA = 0.7;
const BANDA_MAXIMA = 1.4;

const MARGEN_DE_KCAL = 0.05;
const PROTEINA_MINIMA = 0.9;
// Lo que se busca de proteína al elegir y al escalar, con margen para los pasos. Buscar el 100 %
// agranda y achica comidas de más; el 95 % deja el día parejo.
const PROTEINA_BUSCADA = 0.95;

const alcanza = (v: Valores, meta: Macros) => Math.abs(v.kcal - meta.kcal) <= MARGEN_DE_KCAL * meta.kcal && v.proteina >= PROTEINA_MINIMA * meta.proteina;

function conFactor(it: Item, cantidad: Exclude<Cantidad, null>, factor: number): Item {
  return { ...it, cantidad: cantidad.aceite ? { ...cantidad, aceite: cantidad.aceite * factor } : cantidad, valores: escalarValores(it.valores, factor) };
}

/**
 * Un alimento por un factor, en lo que se puede servir: de a media porción (al menos media) o de a
 * 5 g (al menos 5). Los valores van por el factor que quedó de verdad, aceite incluido, así dan lo
 * mismo que valoresDeCantidad con la cantidad nueva. La carga rápida no tiene cantidad: no se escala.
 */
function escalarItem(it: Item, factor: number): Item {
  const c = it.cantidad;
  if (!c) return it;
  if ('porcion' in c) {
    if (!(c.veces > 0)) return it;
    const veces = Math.max(0.5, Math.round(c.veces * factor * 2) / 2);
    return veces === c.veces ? it : conFactor(it, { ...c, veces }, veces / c.veces);
  }
  if (!(c.gramos > 0)) return it;
  const gramos = Math.max(5, Math.round((c.gramos * factor) / 5) * 5);
  if (gramos === c.gramos) return it;
  const f = gramos / c.gramos;
  return conFactor(it, { ...c, gramos, ...(c.ml != null ? { ml: Math.round(c.ml * f) } : {}), ...(c.bruto != null ? { bruto: Math.round(c.bruto * f) } : {}) }, f);
}

/** Un paso más (o menos) de un alimento ya escalado, sin salir de la mitad al doble de lo que era. */
function unPaso(base: Item, actual: Item, signo: 1 | -1): Item | null {
  const b = base.cantidad;
  const a = actual.cantidad;
  if (!b || !a) return null;
  const [antes, ahora, paso] = 'porcion' in b ? [b.veces, 'porcion' in a ? a.veces : NaN, 0.5] : [b.gramos, 'gramos' in a ? a.gramos : NaN, 5];
  const nuevo = ahora + signo * paso;
  if (!(antes > 0) || !(nuevo >= Math.max(paso, antes * MINIMO) - 1e-9) || nuevo > antes * MAXIMO + 1e-9) return null;
  return escalarItem(base, nuevo / antes);
}

/** Lo que se escala de una comida y lo que queda fijo (la carga rápida), con su parte del día. */
type Medidas = { kcal: number; proteina: number; fijasKcal: number; fijasProteina: number; parte: number };

function medidas(base: readonly Item[], parte: number): Medidas {
  const m = { kcal: 0, proteina: 0, fijasKcal: 0, fijasProteina: 0, parte };
  for (const it of base) {
    if (it.cantidad) {
      m.kcal += it.valores.kcal;
      m.proteina += it.valores.proteina;
    } else {
      m.fijasKcal += it.valores.kcal;
      m.fijasProteina += it.valores.proteina;
    }
  }
  return m;
}

// Mover kcal de una comida a otra vale la pena si cambia la proteína: al menos 2 g cada 100 kcal.
// Si no, el desayuno se duplica y el almuerzo se achica por un gramo.
const DIFERENCIA_DE_PROTEINA = 0.02;

/**
 * Cuánto escalar cada comida para llegar a las kcal con el reparto del día. Si falta proteína (y
 * `mover`), se pasan kcal de la comida con menos proteína por kcal a la que tiene más, sin cambiar
 * el total, hasta el 95 %.
 */
/** Las kcal entre las que puede quedar cada comida, por su parte del día (la carga rápida, incluida). */
function bandas(partes: readonly number[], kcal: number): [number, number][] {
  const total = partes.reduce((s, x) => s + x, 0) || 1;
  return partes.map((p) => [BANDA_MINIMA * (p / total) * kcal, BANDA_MAXIMA * (p / total) * kcal]);
}

/**
 * Entre qué factores puede ir cada comida: de la mitad al doble de lo de siempre y en su banda. Si
 * lo de siempre es tan chico (o tan grande) que no entra en su banda, queda lo más cerca posible.
 */
function limitesDe(m: readonly Medidas[], kcal: number): [number, number][] {
  const banda = bandas(m.map((x) => x.parte), kcal);
  return m.map((x, i) => {
    if (!(x.kcal > 0)) return [1, 1];
    const desde = Math.max(MINIMO, (banda[i][0] - x.fijasKcal) / x.kcal);
    const hasta = Math.min(MAXIMO, (banda[i][1] - x.fijasKcal) / x.kcal);
    if (desde <= hasta) return [desde, hasta];
    return hasta < MINIMO ? [MINIMO, MINIMO] : [MAXIMO, MAXIMO];
  });
}

/**
 * Cuánto escalar cada comida para llegar a las kcal con el reparto del día. Si falta proteína (y
 * `mover`), se pasan kcal de la comida con menos proteína por kcal a la que tiene más, sin cambiar
 * el total ni salir de las bandas, hasta el 95 %.
 */
function factores(m: readonly Medidas[], meta: Pick<Macros, 'kcal' | 'proteina'>, mover = true): number[] {
  const partes = m.reduce((s, x) => s + x.parte, 0) || 1;
  const limites = limitesDe(m, meta.kcal);
  const entre = (i: number, x: number) => Math.min(limites[i][1], Math.max(limites[i][0], x));
  const f = m.map((x, i) => (x.kcal > 0 ? entre(i, ((x.parte / partes) * meta.kcal - x.fijasKcal) / x.kcal) : 1));
  const total = (de: 'kcal' | 'proteina') => m.reduce((s, x, i) => s + (de === 'kcal' ? x.fijasKcal : x.fijasProteina) + x[de] * f[i], 0);
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    const resto = meta.kcal - total('kcal');
    const libres = m.flatMap((x, i) => (x.kcal > 0 && (resto > 0 ? f[i] < limites[i][1] : f[i] > limites[i][0]) ? [i] : []));
    if (Math.abs(resto) < 0.5 || !libres.length) break;
    const parteLibre = libres.reduce((s, i) => s + m[i].parte, 0);
    for (const i of libres) f[i] = entre(i, f[i] + (resto * (parteLibre > 0 ? m[i].parte / parteLibre : 1 / libres.length)) / m[i].kcal);
  }
  const densidad = m.map((x) => (x.kcal > 0 ? x.proteina / x.kcal : 0));
  for (let vuelta = 0; mover && vuelta < 20; vuelta++) {
    const falta = PROTEINA_BUSCADA * meta.proteina - total('proteina');
    if (falta <= 1e-6) break;
    let sube = -1;
    for (let i = 0; i < m.length; i++) if (m[i].kcal > 0 && f[i] < limites[i][1] - 1e-9 && (sube < 0 || densidad[i] > densidad[sube])) sube = i;
    let baja = -1;
    for (let i = 0; i < m.length; i++) {
      if (sube >= 0 && m[i].kcal > 0 && f[i] > limites[i][0] + 1e-9 && densidad[i] <= densidad[sube] - DIFERENCIA_DE_PROTEINA && (baja < 0 || densidad[i] < densidad[baja])) baja = i;
    }
    if (sube < 0 || baja < 0) break;
    const movidas = Math.min(falta / (densidad[sube] - densidad[baja]), (limites[sube][1] - f[sube]) * m[sube].kcal, (f[baja] - limites[baja][0]) * m[baja].kcal);
    f[sube] += movidas / m[sube].kcal;
    f[baja] -= movidas / m[baja].kcal;
  }
  return f.map((x, i) => (m[i].kcal > 0 ? entre(i, x) : x));
}

// Solo se mueven los alimentos que pesan en su comida: para acercarse a la meta no se agrega aceite.
const PRINCIPAL = 0.15;

/**
 * Lo que dejan los pasos (media porción, 5 g) se corrige de a un paso por vez, en el alimento que
 * más acerca el día a la meta: primero, a menos de un 4 % de las kcal; después, al 90 % de la
 * proteína, y al final, lo más cerca posible de las kcal. Con `partes`, ningún paso deja una comida
 * más lejos de su banda.
 */
function afinar(bases: readonly (readonly Item[])[], items: readonly Item[][], meta: Pick<Macros, 'kcal' | 'proteina'>, partes?: readonly number[]): Item[][] {
  const actuales = items.map((l) => [...l]);
  const banda = partes ? bandas(partes, meta.kcal) : null;
  const deComida = actuales.map((l) => l.reduce((s, it) => s + it.valores.kcal, 0));
  const fuera = (i: number, k: number) => (banda ? Math.max(0, banda[i][0] - k, k - banda[i][1]) : 0);
  const principal = bases.map((l) => {
    const total = l.reduce((s, it) => s + it.valores.kcal, 0);
    return l.map((it) => it.cantidad !== null && it.valores.kcal >= PRINCIPAL * total);
  });
  const error = (kcal: number, proteina: number) => {
    const lejos = meta.kcal > 0 ? Math.abs(kcal - meta.kcal) / meta.kcal : 0;
    const falta = meta.proteina > 0 ? Math.max(0, PROTEINA_MINIMA * meta.proteina - proteina) / meta.proteina : 0;
    return 100 * Math.max(0, lejos - 0.8 * MARGEN_DE_KCAL) + 10 * falta + lejos;
  };
  let { kcal, proteina } = valoresDe(actuales.flat());
  for (let vuelta = 0; vuelta < 60; vuelta++) {
    let mejor: { i: number; j: number; item: Item; kcal: number; proteina: number } | null = null;
    let menor = error(kcal, proteina) - 1e-9;
    for (let i = 0; i < actuales.length; i++) {
      for (let j = 0; j < actuales[i].length; j++) {
        if (!principal[i][j]) continue;
        const it = actuales[i][j];
        for (const signo of [1, -1] as const) {
          const nuevo = unPaso(bases[i][j], it, signo);
          if (!nuevo) continue;
          const enLaComida = deComida[i] - it.valores.kcal + nuevo.valores.kcal;
          if (fuera(i, enLaComida) > fuera(i, deComida[i]) + 1e-9) continue;
          const k = kcal - it.valores.kcal + nuevo.valores.kcal;
          const p = proteina - it.valores.proteina + nuevo.valores.proteina;
          const e = error(k, p);
          if (e < menor) {
            menor = e;
            mejor = { i, j, item: nuevo, kcal: k, proteina: p };
          }
        }
      }
    }
    if (!mejor) break;
    deComida[mejor.i] += mejor.item.valores.kcal - actuales[mejor.i][mejor.j].valores.kcal;
    actuales[mejor.i][mejor.j] = mejor.item;
    kcal = mejor.kcal;
    proteina = mejor.proteina;
  }
  return actuales;
}

type Eleccion = { comida: Comida; opcion: string; base: Item[]; parte: number };

/** Las comidas elegidas, escaladas para el día. */
function armar(elecciones: readonly Eleccion[], meta: Macros): Omit<DiaPlaneado, 'dia'> {
  const f = factores(elecciones.map((e) => medidas(e.base, e.parte)), meta);
  const bases = elecciones.map((e) => e.base);
  const items = afinar(bases, bases.map((l, i) => l.map((it) => escalarItem(it, f[i]))), meta, elecciones.map((e) => e.parte));
  const comidas = elecciones.map((e, i) => ({ comida: e.comida, opcion: e.opcion, items: items[i], valores: valoresDe(items[i]) }));
  const valores = sumar(comidas.map((c) => c.valores));
  return { comidas, valores, alcanza: alcanza(valores, meta) };
}

/** Una comida sola, escalada a unas kcal con los mismos pasos. */
function aKcal(base: Item[], kcal: number): Item[] {
  const f = factores([medidas(base, 1)], { kcal, proteina: 0 });
  return afinar([base], [base.map((it) => escalarItem(it, f[0]))], { kcal, proteina: 0 })[0];
}

// ------------------------------------------------------------ elegir

/** Un azar con semilla (mulberry32): la misma semilla da siempre el mismo plan. */
function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortear<T>(lista: readonly T[], peso: (x: T) => number, al: () => number): T {
  let r = al() * lista.reduce((s, x) => s + peso(x), 0);
  for (const x of lista) if ((r -= peso(x)) < 0) return x;
  return lista[lista.length - 1];
}

const porClave = (a: Opcion, b: Opcion) => (a.clave < b.clave ? -1 : a.clave > b.clave ? 1 : 0);

// Qué puede ir en lugar de cada comida, la misma primero: el almuerzo y la cena se cambian entre sí,
// y la merienda se parece al desayuno y al snack.
const PARECIDAS: Record<Comida, readonly Comida[]> = {
  desayuno: ['desayuno', 'merienda'],
  almuerzo: ['almuerzo', 'cena'],
  merienda: ['merienda', 'desayuno', 'snack'],
  cena: ['cena', 'almuerzo'],
  snack: ['snack', 'merienda'],
};

/**
 * El orden en que se elige para una comida: lo tuyo de esa comida (0), lo que te gusta (1), lo tuyo
 * de una parecida (2), lo que te gusta de una parecida (3) y las comidas tipo (4 y 5). null si no va.
 */
function nivel(op: Opcion, comida: Comida, pref: Preferencias): number | null {
  const lugar = PARECIDAS[comida].indexOf(op.comida);
  if (lugar < 0) return null;
  const desde = op.origen === 'tuya' ? 0 : pref.meGusta.includes(op.clave) ? 1 : 4;
  return lugar === 0 ? desde : desde + (desde === 4 ? 1 : 2);
}

/** Lo tuyo sale más cuanto más lo comés; lo que te gusta, el doble. */
const peso = (op: Opcion, pref: Preferencias) => (op.origen === 'tuya' ? Math.max(1, op.veces) : 1) * (pref.meGusta.includes(op.clave) ? 2 : 1);

/** Cuánto se evita una opción en una comida (lo reciente, lo repetido en la semana): se elige entre las que menos. */
type Penalidad = (op: Opcion, comida: Comida) => number;

function candidatas(comida: Comida, permitidas: readonly Opcion[], pref: Preferencias, usadas: ReadonlySet<string>, penalidad: Penalidad): Opcion[] {
  const posibles = permitidas.filter((op) => !usadas.has(op.clave) && nivel(op, comida, pref) !== null);
  const menor = Math.min(...posibles.map((op) => penalidad(op, comida)));
  return posibles.filter((op) => penalidad(op, comida) === menor);
}

/**
 * Una opción por comida, nivel por nivel: cada comida se queda primero con lo suyo, así el desayuno
 * no se lleva la merienda de siempre. Dentro de un nivel, a la suerte con su peso.
 */
function elegirDelDia(comidas: readonly Comida[], permitidas: readonly Opcion[], pref: Preferencias, al: () => number, penalidad: Penalidad): (Opcion | null)[] {
  const elegidas: (Opcion | null)[] = comidas.map(() => null);
  const usadas = new Set<string>();
  for (let n = 0; n <= 5; n++) {
    comidas.forEach((comida, i) => {
      if (elegidas[i]) return;
      const deEste = candidatas(comida, permitidas, pref, usadas, penalidad).filter((op) => nivel(op, comida, pref) === n);
      if (!deEste.length) return;
      const op = sortear(deEste, (x) => peso(x, pref), al);
      elegidas[i] = op;
      usadas.add(op.clave);
    });
  }
  return elegidas;
}

/**
 * Cuánto le falta al día para la meta con esas opciones bien escaladas, antes de los pasos: 0 si
 * llega a las kcal (con margen para los pasos) y a esa parte de la proteína.
 */
function errorPosible(elegidas: readonly (Opcion | null)[], partes: readonly number[], meta: Macros, mover: boolean, proteinaQueAlcanza: number): number {
  const m = elegidas.flatMap((op, i) => (op ? [medidas(op.items, partes[i])] : []));
  const f = factores(m, meta, mover);
  const kcal = m.reduce((s, x, i) => s + x.fijasKcal + x.kcal * f[i], 0);
  const proteina = m.reduce((s, x, i) => s + x.fijasProteina + x.proteina * f[i], 0);
  return (meta.kcal > 0 ? Math.max(0, Math.abs(kcal - meta.kcal) - 0.02 * meta.kcal) / meta.kcal : 0)
    + (meta.proteina > 0 ? Math.max(0, proteinaQueAlcanza * meta.proteina - proteina) / meta.proteina : 0);
}

type Cambio = { i: number; op: Opcion; error: number };

/**
 * Si con lo elegido no se llega (casi siempre, por la proteína), se cambian comidas. Primero las
 * comidas tipo que no marcaste, mirando el día parejo, sin agrandar ni achicar comidas para la
 * proteína: mejor otra comida que un desayuno doble. Si ni moviendo kcal se llega a lo que pide
 * alcanza(), se cambia lo que más acerca el día a la meta, y lo tuyo y lo que te gusta solo si
 * cambiando lo demás no se mejora nada.
 */
function mejorar(comidas: readonly Comida[], elegidas: readonly (Opcion | null)[], partes: readonly number[], permitidas: readonly Opcion[], pref: Preferencias, penalidad: Penalidad, meta: Macros, al: () => number): (Opcion | null)[] {
  const resultado = [...elegidas];
  const protegida = (op: Opcion) => op.origen === 'tuya' || pref.meGusta.includes(op.clave);
  const parejo = (lista: readonly (Opcion | null)[]) => errorPosible(lista, partes, meta, false, PROTEINA_BUSCADA);
  const moviendo = (lista: readonly (Opcion | null)[]) => errorPosible(lista, partes, meta, true, PROTEINA_MINIMA);
  const cambios = (cuales: (op: Opcion) => boolean, error: typeof parejo): Cambio[] =>
    resultado.flatMap((actual, i) => {
      if (!actual || !cuales(actual)) return [];
      const usadas = new Set(resultado.flatMap((op, j) => (op && j !== i ? [op.clave] : [])));
      return candidatas(comidas[i], permitidas, pref, usadas, penalidad)
        .filter((op) => op.clave !== actual.clave)
        .map((op) => ({ i, op, error: error(resultado.map((x, j) => (j === i ? op : x))) }));
    });
  const menor = (lista: Cambio[]) => lista.reduce<Cambio | null>((m, c) => (!m || c.error < m.error - 1e-9 ? c : m), null);
  for (let vuelta = 0; vuelta < comidas.length; vuelta++) {
    const ahora = parejo(resultado);
    if (ahora <= 0) break;
    const posibles = cambios((op) => !protegida(op), parejo);
    const arreglan = posibles.filter((c) => c.error <= 0);
    // Entre los cambios que alcanzan, a la suerte: si no, siempre ganaría la misma comida.
    const cambio = arreglan.length ? sortear(arreglan, () => 1, al) : menor(posibles);
    if (!cambio || cambio.error >= ahora - 1e-9) break;
    resultado[cambio.i] = cambio.op;
  }
  for (let vuelta = 0; vuelta < comidas.length; vuelta++) {
    const ahora = moviendo(resultado);
    if (ahora <= 0) break;
    const mejora = (lista: Cambio[]) => menor(lista.filter((c) => c.error < ahora - 1e-9));
    const cambio = mejora(cambios((op) => !protegida(op), moviendo)) ?? mejora(cambios(protegida, moviendo));
    if (!cambio) break;
    resultado[cambio.i] = cambio.op;
  }
  return resultado;
}

// Con menos que esto por armar, no se arma nada: ya comiste lo del día.
const MINIMO_PARA_ARMAR = 150;

function planear(
  dia: ClaveDia, metaDelDia: Macros, opciones: readonly Opcion[], pref: Preferencias, al: () => number, penalidad: Penalidad,
  solo?: readonly Comida[], yaComido?: Macros,
): DiaPlaneado {
  const comidas = comidasDelPlan(pref.comidas).filter((c) => !solo || solo.includes(c));
  // Lo que ya se comió sale de la meta: se arma lo que falta con lo que queda.
  const meta: Macros = yaComido
    ? { kcal: Math.max(0, metaDelDia.kcal - yaComido.kcal), proteina: Math.max(0, metaDelDia.proteina - yaComido.proteina), carbohidratos: Math.max(0, metaDelDia.carbohidratos - yaComido.carbohidratos), grasas: Math.max(0, metaDelDia.grasas - yaComido.grasas) }
    : metaDelDia;
  if (!comidas.length || meta.kcal < MINIMO_PARA_ARMAR) return { dia, comidas: [], valores: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 }, alcanza: true };
  const partes = comidas.map((c) => REPARTO[pref.comidas][c] ?? 0);
  const permitidas = opciones.filter((op) => permitida(op, pref)).sort(porClave);
  const elegidas = mejorar(comidas, elegirDelDia(comidas, permitidas, pref, al, penalidad), partes, permitidas, pref, penalidad, meta, al);
  const elecciones = comidas.flatMap((comida, i) => {
    const op = elegidas[i];
    return op ? [{ comida, opcion: op.clave, base: op.items, parte: partes[i] }] : [];
  });
  return { dia, ...armar(elecciones, meta) };
}

// ------------------------------------------------------------ lo que se exporta

/**
 * Si una opción se puede proponer: no está entre lo que no te gusta, es de tu dieta, no tiene lo
 * que te da alergia y se prepara en el tiempo que tenés. Lo tuyo no se filtra por alérgenos: no se
 * pueden saber (opcionesTuyas).
 */
export function permitida(op: Opcion, pref: Preferencias): boolean {
  if (pref.noMeGusta.includes(op.clave) || !op.dietas.includes(pref.dieta)) return false;
  if (op.origen === 'tipo' && op.contiene.some((a) => pref.alergias.includes(a))) return false;
  return op.minutos <= MINUTOS[pref.tiempo];
}

/** Cuántas veces hace falta haber comido algo para que sea tuyo. */
const VECES_TUYAS = 2;

/** De qué alimento es cada cosa: la carga rápida, por su nombre. */
const claveDe = (it: Pick<Item, 'fuente' | 'ref' | 'nombre'>) => (it.fuente === 'rapida' ? `rapida:${it.nombre.trim().toLowerCase()}` : `${it.fuente}:${it.ref ?? ''}`);
const firma = (items: readonly Item[]) => [...new Set(items.map(claveDe))].sort().join('+');
const vecesDe = (c: Cantidad) => (c && 'porcion' in c ? c.veces : 0);

/** Lo mismo anotado dos veces en una comida es un alimento: con la misma porción se suman las veces; si no, los gramos. */
function juntar(a: Item, b: Item): Item {
  const ca = a.cantidad;
  const cb = b.cantidad;
  const valores = sumar([a.valores, b.valores]);
  if (!ca || !cb) return { ...a, cantidad: null, valores };
  const aceite = (ca.aceite ?? 0) + (cb.aceite ?? 0);
  const conAceite = aceite > 0 ? { aceite } : {};
  if ('porcion' in ca && 'porcion' in cb && ca.porcion === cb.porcion && ca.gramosPorcion === cb.gramosPorcion) {
    return { ...a, cantidad: { porcion: ca.porcion, gramosPorcion: ca.gramosPorcion, veces: ca.veces + cb.veces, ...conAceite }, valores };
  }
  return { ...a, cantidad: { gramos: (gramosDe(ca) ?? 0) + (gramosDe(cb) ?? 0), ...conAceite }, valores };
}

function delMedio(lista: readonly number[]): number {
  const o = [...lista].sort((a, b) => a - b);
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

/** La cantidad del medio de un alimento entre las veces que se comió, con los valores de la última. */
function mediana(veces: readonly Item[], ultimo: Item): Item {
  const c = ultimo.cantidad;
  if (!c) return ultimo;
  if ('porcion' in c && veces.every((it) => it.cantidad && 'porcion' in it.cantidad && it.cantidad.porcion === c.porcion && it.cantidad.gramosPorcion === c.gramosPorcion)) {
    return escalarItem(ultimo, delMedio(veces.map((it) => vecesDe(it.cantidad))) / c.veces);
  }
  const gramos = veces.map((it) => gramosDe(it.cantidad) ?? 0);
  const g = gramosDe(c) ?? 0;
  if (!(g > 0) || gramos.some((x) => !(x > 0))) return ultimo;
  const enGramos: Item = 'gramos' in c ? ultimo : { ...ultimo, cantidad: { gramos: g, ...(c.aceite ? { aceite: c.aceite } : {}) } };
  return escalarItem(enGramos, delMedio(gramos) / g);
}

/**
 * Tus comidas de siempre: lo que comiste (sin lo planificado ni lo borrado) en los últimos `dias`,
 * por día y comida. La misma lista de alimentos es la misma opción, en la comida que sea; va en la
 * comida en que más se comió, con la cantidad del medio de cada alimento, y hace falta haberla
 * comido al menos dos veces. Lo tuyo sirve para cualquier dieta: si lo comiste dos veces, es de la
 * tuya (si cambiás de dieta, lo que ya no va se marca «no me gusta»). Los alérgenos no se pueden
 * saber, así que lo tuyo nunca se filtra por ellos; y como ya lo hacés, no tiene minutos.
 */
export function opcionesTuyas(registros: Iterable<Registro>, hoy: ClaveDia, dias = 28): Opcion[] {
  const porMomento = (a: Registro, b: Registro) => (a.momento < b.momento ? -1 : a.momento > b.momento ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const comidas = new Map<string, { comida: Comida; cuando: string; items: Map<string, Item> }>();
  for (const r of [...registros].sort(porMomento)) {
    const hace = diasEntre(r.dia, hoy);
    if (r.borrado || r.planificado || hace < 0 || hace >= dias) continue;
    const k = `${r.dia} ${r.comida}`;
    const c = comidas.get(k) ?? { comida: r.comida, cuando: `${r.dia} ${r.momento}`, items: new Map<string, Item>() };
    const item = itemDe(r);
    const antes = c.items.get(claveDe(item));
    c.items.set(claveDe(item), antes ? juntar(antes, item) : item);
    comidas.set(k, c);
  }
  const grupos = new Map<string, { veces: number; porComida: Map<Comida, number>; cuando: string; ultima: Map<string, Item>; todas: Map<string, Item[]> }>();
  for (const c of comidas.values()) {
    const f = [...c.items.keys()].sort().join('+');
    const g = grupos.get(f) ?? { veces: 0, porComida: new Map<Comida, number>(), cuando: '', ultima: c.items, todas: new Map<string, Item[]>() };
    g.veces += 1;
    g.porComida.set(c.comida, (g.porComida.get(c.comida) ?? 0) + 1);
    if (c.cuando >= g.cuando) {
      g.cuando = c.cuando;
      g.ultima = c.items;
    }
    for (const [k, it] of c.items) g.todas.set(k, [...(g.todas.get(k) ?? []), it]);
    grupos.set(f, g);
  }
  return [...grupos]
    .filter(([, g]) => g.veces >= VECES_TUYAS)
    .sort(([fa, a], [fb, b]) => b.veces - a.veces || (a.cuando < b.cuando ? 1 : a.cuando > b.cuando ? -1 : fa < fb ? -1 : 1))
    .map(([f, g]) => ({
      clave: `tuya:${f}`,
      nombre: null,
      comida: [...g.porComida].sort(([a, x], [b, y]) => y - x || ORDEN.indexOf(a) - ORDEN.indexOf(b))[0][0],
      items: [...g.ultima].map(([k, it]) => mediana(g.todas.get(k) ?? [it], it)),
      origen: 'tuya' as const,
      veces: g.veces,
      dietas: [...DIETAS],
      contiene: [],
      minutos: 0,
    }));
}

// Una porción con nombre se lee mejor que los gramos («2 unidades», no «100 g»): la que da justo una,
// o un número entero (hasta 4) o media de una que empieza con «1 ». Las que son gramos no cuentan.
function porcionDe(porciones: readonly { nombre: string; gramos: number }[], gramos: number): Exclude<Cantidad, null> | null {
  const utiles = porciones.filter((p) => p.gramos > 0 && !/^\d+([.,]\d+)?\s*g$/.test(p.nombre.trim()));
  const veces = (p: { gramos: number }) => gramos / p.gramos;
  const es = (v: number, n: number) => Math.abs(v - n) < 1e-9;
  const p = utiles.find((x) => es(veces(x), 1))
    ?? utiles.find((x) => x.nombre.startsWith('1 ') && veces(x) <= 4 && es(veces(x), Math.round(veces(x))))
    ?? utiles.find((x) => x.nombre.startsWith('1 ') && es(veces(x), 0.5));
  return p ? { porcion: p.nombre, gramosPorcion: p.gramos, veces: Math.round(veces(p) * 2) / 2 } : null;
}

/** Una comida tipo con los alimentos de la base, en el idioma de la app. null si falta alguno. */
export function opcionDePlantilla(p: Plantilla, resolver: Resolver, idioma: 'es' | 'en'): Opcion | null {
  const items: Item[] = [];
  for (const [nombre, gramos] of p.items) {
    const a = resolver(nombre);
    if (!a) return null;
    const cantidad = porcionDe(a.porciones ?? [], gramos) ?? { gramos };
    items.push({ fuente: a.fuente, ref: a.ref, nombre: a.nombre, cantidad, valores: escalarValores(a.por100g, (gramosDe(cantidad) ?? 0) / 100) });
  }
  return { clave: p.clave, nombre: p.nombre[idioma], comida: p.comida, items, origen: 'tipo', veces: 0, dietas: [...p.dietas], contiene: [...p.contiene], minutos: p.minutos };
}

/**
 * Un día: una opción por comida (primero lo tuyo que más comés, después lo que te gusta y al final
 * las comidas tipo; lo de `recientes`, solo si no queda otra), escalada para que el día quede a
 * menos de un 5 % de las kcal y con al menos el 90 % de la proteína. Cada comida va de la mitad al
 * doble de lo de siempre y del 70 % al 140 % de su parte del día: si así no se llega, queda lo más
 * cerca posible y `alcanza` es falso.
 * Con `solo`, arma solo esas comidas (las que faltan del día), con lo que deja `yaComido` de la meta:
 * entonces los valores y `alcanza` son de lo armado contra lo que quedaba.
 */
export function planearDia(o: {
  dia: ClaveDia; meta: Macros; opciones: readonly Opcion[]; pref: Preferencias; semilla: number; recientes?: readonly string[];
  solo?: readonly Comida[]; yaComido?: Macros;
}): DiaPlaneado {
  const recientes = new Set(o.recientes ?? []);
  return planear(o.dia, o.meta, o.opciones, o.pref, azar(o.semilla), (op) => (recientes.has(op.clave) ? 1 : 0), o.solo, o.yaComido);
}

/**
 * Una semana desde `desde`, cada día con su meta. Para variar, el mismo almuerzo o la misma cena
 * van a lo sumo dos veces en la semana y nunca dos días seguidos (si hay con qué).
 */
export function planearSemana(o: { desde: ClaveDia; metaDe: (dia: ClaveDia) => Macros; opciones: readonly Opcion[]; pref: Preferencias; semilla: number }): DiaPlaneado[] {
  const al = azar(o.semilla);
  const grandes = (c: Comida) => c === 'almuerzo' || c === 'cena';
  const veces = new Map<string, number>();
  let ayer = new Set<string>();
  const semana: DiaPlaneado[] = [];
  for (let i = 0; i < 7; i++) {
    const dia = sumarDias(o.desde, i);
    const penalidad: Penalidad = (op, comida) => (!grandes(comida) ? 0 : (veces.get(op.clave) ?? 0) >= 2 ? 2 : ayer.has(op.clave) ? 1 : 0);
    const plan = planear(dia, o.metaDe(dia), o.opciones, o.pref, al, penalidad);
    const deHoy = plan.comidas.filter((c) => grandes(c.comida)).map((c) => c.opcion);
    for (const clave of deHoy) veces.set(clave, (veces.get(clave) ?? 0) + 1);
    ayer = new Set(deHoy);
    semana.push(plan);
  }
  return semana;
}

// Cambiar por otra pide algo parecido: hasta un 15 % de las kcal y de la proteína (o 3 g, en lo que
// casi no tiene: un 15 % de una fruta no deja cambiarla por nada).
const PARECIDO = 0.15;
const PROTEINA_PARECIDA = 3;
const parecida = (a: Valores, b: Valores) =>
  Math.abs(a.kcal - b.kcal) <= PARECIDO * b.kcal && Math.abs(a.proteina - b.proteina) <= Math.max(PARECIDO * b.proteina, PROTEINA_PARECIDA);

/**
 * «Cambiar por otra»: otra opción para esa comida que, escalada, queda a menos de un 15 % de las
 * kcal y de la proteína de la que estaba, y que no está ya en el día. Elige como planearDia. null
 * si no hay ninguna.
 */
export function cambiarPorOtra(dia: DiaPlaneado, comida: Comida, o: { opciones: readonly Opcion[]; pref: Preferencias; meta: Macros; semilla: number }): DiaPlaneado | null {
  const i = dia.comidas.findIndex((c) => c.comida === comida);
  if (i < 0) return null;
  const vieja = dia.comidas[i];
  const enElDia = new Set(dia.comidas.flatMap((c) => [c.opcion, firma(c.items)]));
  const otras = o.opciones
    .filter((op) => permitida(op, o.pref) && nivel(op, comida, o.pref) !== null && !enElDia.has(op.clave) && !enElDia.has(firma(op.items)))
    .sort(porClave)
    .flatMap((op) => {
      const items = aKcal(op.items, vieja.valores.kcal);
      const valores = valoresDe(items);
      return parecida(valores, vieja.valores) ? [{ op, items, valores }] : [];
    });
  if (!otras.length) return null;
  const mejor = Math.min(...otras.map((x) => nivel(x.op, comida, o.pref) ?? 5));
  const nueva = sortear(otras.filter((x) => nivel(x.op, comida, o.pref) === mejor), (x) => peso(x.op, o.pref), azar(o.semilla));
  const comidas = dia.comidas.map((c, j) => (j === i ? { comida, opcion: nueva.op.clave, items: nueva.items, valores: nueva.valores } : c));
  const valores = sumar(comidas.map((c) => c.valores));
  return { dia: dia.dia, comidas, valores, alcanza: alcanza(valores, o.meta) };
}

/**
 * El plan con la meta nueva (después del control de la semana): las mismas comidas, escaladas desde
 * lo que tenían y con el mismo reparto entre ellas.
 */
export function adaptar(plan: readonly DiaPlaneado[], metaDe: (dia: ClaveDia) => Macros): DiaPlaneado[] {
  return plan.map((d) => {
    const total = d.comidas.reduce((s, c) => s + c.valores.kcal, 0);
    const elecciones = d.comidas.map((c) => ({ comida: c.comida, opcion: c.opcion, base: c.items, parte: total > 0 ? c.valores.kcal / total : 1 }));
    return { dia: d.dia, ...armar(elecciones, metaDe(d.dia)) };
  });
}

const paraOrdenar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * La lista de compras: cada alimento una vez, con los gramos sumados (la carga rápida, por su
 * nombre y contada). Una receta va en una línea, como se registra. Por nombre.
 */
export function listaDeCompras(plan: readonly DiaPlaneado[]): Compra[] {
  const lista = new Map<string, Compra>();
  for (const d of plan) {
    for (const c of d.comidas) {
      for (const it of c.items) {
        const clave = claveDe(it);
        const porcion = it.cantidad && 'porcion' in it.cantidad ? { nombre: it.cantidad.porcion, veces: it.cantidad.veces } : null;
        const gramos = gramosDe(it.cantidad) ?? 0;
        const x = lista.get(clave);
        if (!x) {
          lista.set(clave, { clave, nombre: it.nombre, gramos, porciones: porcion, comidas: 1 });
          continue;
        }
        x.gramos += gramos;
        x.porciones = x.porciones && porcion && x.porciones.nombre === porcion.nombre ? { nombre: porcion.nombre, veces: x.porciones.veces + porcion.veces } : null;
        x.comidas += 1;
      }
    }
  }
  return [...lista.values()]
    .map((x) => ({ ...x, gramos: Math.round(x.gramos) }))
    .sort((a, b) => {
      const [na, nb] = [paraOrdenar(a.nombre), paraOrdenar(b.nombre)];
      return na < nb ? -1 : na > nb ? 1 : a.clave < b.clave ? -1 : 1;
    });
}

/**
 * Lo tachado de la lista de compras: cada alimento tachado guarda lo planificado que cubría (los
 * ids de sus registros). Sigue tachado mientras no se planifique más de él: lo de la semana que
 * viene, u otra comida con ese alimento, lo vuelve a la lista.
 */
export type Tachadas = Record<string, string[]>;

/** Lo planificado de hoy en adelante, por alimento de la lista de compras: los ids de sus registros. */
export function planificadoPorCompra(registros: Iterable<Registro>, hoy: ClaveDia): Map<string, string[]> {
  const porClave = new Map<string, string[]>();
  for (const r of registros) {
    if (r.borrado || !r.planificado || r.dia < hoy) continue;
    const clave = claveDe(r);
    porClave.set(clave, [...(porClave.get(clave) ?? []), r.id]);
  }
  return porClave;
}

export function estaTachada(tachadas: Tachadas, clave: string, planificado: ReadonlyMap<string, string[]>): boolean {
  const cubria = tachadas[clave];
  return !!cubria && (planificado.get(clave) ?? []).every((id) => cubria.includes(id));
}

/** Tachar o destachar: lo que ya no está en la lista se olvida. */
export function tachar(tachadas: Tachadas, clave: string, planificado: ReadonlyMap<string, string[]>): Tachadas {
  const quedan = Object.entries(tachadas).filter(([c]) => c !== clave && planificado.has(c));
  if (!estaTachada(tachadas, clave, planificado)) quedan.push([clave, planificado.get(clave) ?? []]);
  return Object.fromEntries(quedan);
}

/** Lo tachado como quedó guardado; lo que no se entiende (como la lista vieja, sin lo que cubría), nada. */
export function tachadasDe(x: unknown): Tachadas {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return {};
  return Object.fromEntries(Object.entries(x).filter((e): e is [string, string[]] => Array.isArray(e[1]) && e[1].every((id) => typeof id === 'string')));
}

/** «Comí esto»: lo de una comida del plan, para registrarlo ya, como se registra cualquier alimento. */
export function itemsDeComida(c: ComidaPlaneada): Item[] {
  return c.items.map(itemDe);
}

// ------------------------------------------------------------ lo que usa la app

/** Hasta contestar «Tus comidas»: de todo, cuatro comidas y tiempo normal. */
export const PREFERENCIAS_DE_FABRICA: Preferencias = { dieta: 'todo', alergias: [], comidas: 4, tiempo: 'normal', noMeGusta: [], meGusta: [] };

// Una lista de claves de opciones, como llega de la cuenta: sin repetir y con un tope.
const clavesDe = (x: unknown) => [...new Set(Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= 300) : [])].slice(0, 500);

/** Las preferencias que llegan de la cuenta: lo que no se entiende queda como de fábrica. Sin nada, null. */
export function preferenciasDe(x: unknown): Preferencias | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const alergias = Array.isArray(o.alergias) ? o.alergias : [];
  return {
    dieta: DIETAS.find((d) => d === o.dieta) ?? PREFERENCIAS_DE_FABRICA.dieta,
    alergias: ALERGENOS.filter((a) => alergias.includes(a)),
    comidas: o.comidas === 3 || o.comidas === 5 ? o.comidas : 4,
    tiempo: o.tiempo === 'poco' || o.tiempo === 'mucho' ? o.tiempo : 'normal',
    noMeGusta: clavesDe(o.noMeGusta),
    meGusta: clavesDe(o.meGusta),
  };
}

const enOrden = (a: Registro, b: Registro) => (a.momento < b.momento ? -1 : a.momento > b.momento ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Lo planificado de una comida, en orden: así lo armado y sus registros van uno a uno. */
function planificadosDe(registros: Iterable<Registro>, dia: ClaveDia): Map<Comida, Registro[]> {
  const porComida = new Map<Comida, Registro[]>();
  for (const r of registros) if (!r.borrado && r.planificado && r.dia === dia) porComida.set(r.comida, [...(porComida.get(r.comida) ?? []), r]);
  for (const lista of porComida.values()) lista.sort(enOrden);
  return porComida;
}

/**
 * Lo planificado de un día como un día del plan, para cambiar una comida o armar la lista de
 * compras. Lo planificado a mano (sin `plan`) va con una clave de su comida.
 */
export function diaPlaneadoDe(registros: Iterable<Registro>, dia: ClaveDia): DiaPlaneado {
  const porComida = planificadosDe(registros, dia);
  const comidas = ORDEN.flatMap((comida) => {
    const lista = porComida.get(comida);
    if (!lista) return [];
    const items = lista.map(itemDe);
    return [{ comida, opcion: lista.find((r) => r.plan)?.plan ?? `planificada:${comida}`, items, valores: valoresDe(items) }];
  });
  return { dia, comidas, valores: sumar(comidas.map((c) => c.valores)), alcanza: true };
}

// Una comida que ya pasó hace más de esto no se arma: hoy ya no se come.
const YA_PASO = 60;

/**
 * Las comidas del plan que faltan en un día: las que no tienen nada, ni anotado ni planificado.
 * Hoy, solo las que no pasaron hace más de una hora (`horaDe` y `ahora`, en minutos del día).
 */
export function queFalta(o: { registros: Iterable<Registro>; dia: ClaveDia; hoy: ClaveDia; ahora: number; pref: Preferencias; horaDe: (c: Comida) => number }): Comida[] {
  if (o.dia < o.hoy) return [];
  const hay = new Set<Comida>();
  for (const r of o.registros) if (!r.borrado && r.dia === o.dia) hay.add(r.comida);
  return comidasDelPlan(o.pref.comidas).filter((c) => !hay.has(c) && (o.dia > o.hoy || o.horaDe(c) + YA_PASO >= o.ahora));
}

/** Lo que el plan evita: las opciones de los días de antes. */
export function recientesDe(registros: Iterable<Registro>, dia: ClaveDia, dias = 2): string[] {
  const desde = sumarDias(dia, -dias);
  const claves = new Set<string>();
  for (const r of registros) if (!r.borrado && r.plan && r.dia >= desde && r.dia < dia) claves.add(r.plan);
  return [...claves];
}

const mismaCantidad = (a: Cantidad, b: Cantidad) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Lo armado de un día con la meta nueva (después del control de la semana): las mismas comidas,
 * escaladas a lo que deja lo demás del día (lo anotado y lo planificado a mano). Devuelve los
 * registros que cambian, con el mismo id y la cantidad y los valores nuevos.
 */
export function adaptarRegistros(registros: Iterable<Registro>, dia: ClaveDia, meta: Macros): Registro[] {
  const lista = [...registros].filter((r) => !r.borrado && r.dia === dia);
  const delPlan = lista.filter((r) => r.planificado && r.plan);
  if (!delPlan.length) return [];
  const fijo = sumar(lista.filter((r) => !(r.planificado && r.plan)).map((r) => r.valores));
  const resto: Macros = {
    kcal: Math.max(0, meta.kcal - fijo.kcal), proteina: Math.max(0, meta.proteina - fijo.proteina),
    carbohidratos: Math.max(0, meta.carbohidratos - fijo.carbohidratos), grasas: Math.max(0, meta.grasas - fijo.grasas),
  };
  const antes = diaPlaneadoDe(delPlan, dia);
  const [despues] = adaptar([antes], () => resto);
  const porComida = planificadosDe(delPlan, dia);
  return antes.comidas.flatMap((c, i) => {
    const regs = porComida.get(c.comida) ?? [];
    return despues.comidas[i].items.flatMap((it, j) => (regs[j] && !mismaCantidad(regs[j].cantidad, it.cantidad) ? [{ ...regs[j], cantidad: it.cantidad, valores: it.valores }] : []));
  });
}
