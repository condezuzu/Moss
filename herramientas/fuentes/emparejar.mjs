// Busca, para cada alimento curado, el mismo alimento en las segundas fuentes (spec/fuentes.md).
// Todo se compara en inglés: la descripción de USDA y el nombre en inglés del curado contra el
// nombre en inglés de Ciqual, el de CoFID y el de TACO pasado al inglés palabra por palabra.
// - Cada palabra pesa según lo rara que es (IDF): «beef» dice menos que «brisket».
// - Lo que más cambia los valores tiene que coincidir: crudo o cocido (y cómo), y la forma (jugo,
//   seco, en lata, en polvo, harina, aceite…). Lo que no coincide resta.
// - La palabra principal del curado (la primera de USDA, o su nombre en inglés) tiene que estar.
// Es una propuesta: herramientas/fuentes/pares.txt corrige lo que esto empareja mal.

export const sinTildes = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Frases que valen como una sola marca, antes de partir en palabras. Del inglés de las tres
// fuentes y del portugués de TACO.
const FRASES = [
  [/\b(meat only|without skin|skinless|skin not eaten|skin removed|no skin|sem pele)\b/g, ' sinpiel '],
  [/\b(meat and skin|with skin|skin eaten|skin on|flesh and skin|com pele|com casca|pulp and peel|unpeeled)\b/g, ' conpiel '],
  [/\b(without peel|peeled|flesh only|flesh without skin|pulp without peel|sem casca)\b/g, ' sincascara '],
  [/\b(separable lean only|lean only eaten|lean only|sem gordura|lean)\b/g, ' magro '],
  [/\b(separable lean and fat|lean and fat eaten|lean and fat|com gordura|with fat)\b/g, ' congrasa '],
  [/\b(without salt|no added salt|no salt added|no salt|unsalted|sem sal)\b/g, ' sinsal '],
  [/\b(with salt|salted|com sal|salgado|salgada)\b/g, ' consal '],
  [/\b(with sugar|sweetened|com acucar|com açúcar)\b/g, ' conazucar '],
  [/\b(without sugar|unsweetened|no sugar added|sugar free|sugar-free|sem acucar|sem açúcar|diet|dietetico|dietético)\b/g, ' sinazucar '],
  [/\b(boiled\/cooked in water|cooked in water|cozido|cozida|cozidos|cozidas)\b/g, ' hervido '],
  [/\b(roasted\/baked|rôti\/cuit au four|assado|assada|assados|assadas)\b/g, ' asado '],
  [/\b(grilled\/pan-fried|grelhado|grelhada|grelhados)\b/g, ' grillado '],
  [/\b(em calda|in syrup|heavy syrup|light syrup)\b/g, ' enlata almibar '],
  [/\b(em conserva|enlatado|enlatada|canned|tinned|in brine)\b/g, ' enlata '],
  [/\b(sweet potato|batata doce|batata, doce)\b/g, ' batatadulce '],
  [/\b(ground beef|minced beef|beef mince|minced steak|carne moida|moido|moída|moído)\b/g, ' molida beef '],
  [/\b(dulce de leche|doce de leite)\b/g, ' dulcedeleche '],
  [/\b(chick peas?|chickpeas?|garbanzo beans?|garbanzos?|grao de bico|grão-de-bico)\b/g, ' chickpea '],
  [/\b(green beans?|string beans?|snap beans?|french beans?|vagem)\b/g, ' greenbean '],
  [/\b(green peas?|garden peas?|ervilhas?)\b/g, ' pea '],
  [/\b(spring onions?|green onions?|scallions?|cebolinha)\b/g, ' scallion '],
  [/\b(bell peppers?|sweet peppers?|peppers, sweet|pimentao|pimentão)\b/g, ' bellpepper '],
  [/\b(hot peppers?|chil(i|li|e) peppers?|peppers, hot)\b/g, ' chilipepper '],
  [/\b(corn on the cob|sweet ?corn|corn, sweet|milho verde|milho, verde)\b/g, ' sweetcorn '],
  [/\b(brown rice|arroz integral|arroz, integral)\b/g, ' rice brown '],
  [/\b(whole ?wheat|wholemeal|whole-grain|whole grain|wholegrain)\b/g, ' integral '],
  [/\b(heart of palm|hearts of palm|palmito)\b/g, ' palmheart '],
  [/\b(passion ?fruit|passion-fruit|maracuja|maracujá)\b/g, ' passionfruit '],
  [/\b(brazil ?nuts?|castanha-do-brasil|castanha do para|castanha do pará)\b/g, ' brazilnut '],
  [/\b(cashew ?nuts?|cashews?|castanha-de-caju)\b/g, ' cashew '],
  [/\b(peanut butter|pasta de amendoim)\b/g, ' peanutbutter '],
  [/\b(ice cream|ice-cream|sorvete)\b/g, ' icecream '],
  [/\b(cream cheese|requeijao|requeijão)\b/g, ' creamcheese '],
  [/\b(cottage cheese)\b/g, ' cottagecheese '],
  [/\b(soy ?sauce|soya sauce|shoyu)\b/g, ' soysauce '],
  [/\b(soy ?milk|soya milk|soya drink|soy drink|soja, extrato soluvel|soja, extrato solúvel)\b/g, ' soymilk '],
  [/\b(coconut milk|leite de coco|leite, de coco)\b/g, ' coconutmilk '],
  [/\b(coconut water|agua de coco|água de coco|coco, agua de|coco, água de)\b/g, ' coconutwater '],
  [/\b(condensed milk|leite condensado|leite, condensado)\b/g, ' condensedmilk '],
  [/\b(skim(med)? milk|fat-free milk|nonfat milk|leite, de vaca, desnatado)\b/g, ' milk skim '],
  [/\b(egg whites?|clara)\b/g, ' eggwhite '],
  [/\b(egg yolks?|gema)\b/g, ' eggyolk '],
  [/\b(french fries|french fried|chips, fried|batata, inglesa, frita)\b/g, ' frenchfries '],
  [/\b(potato chips|potato crisps|crisps|batata, frita, tipo chips)\b/g, ' potatochips '],
  [/\b(olive oil|azeite, de oliva|azeite de oliva)\b/g, ' oliveoil '],
  [/\b(tomato paste|tomato puree|tomato purée|tomate, extrato|tomate, pure|tomate, purê)\b/g, ' tomatopaste '],
  [/\b(tomato sauce|tomate, molho)\b/g, ' tomatosauce '],
  [/\b(hot dogs?|frankfurters?|wieners?)\b/g, ' frankfurter '],
  [/\b(dark chocolate|semisweet chocolate|plain chocolate|chocolate, meio amargo)\b/g, ' darkchocolate '],
  [/\b(milk chocolate|chocolate, ao leite)\b/g, ' milkchocolate '],
  [/\b(brown sugar|acucar mascavo|açúcar, mascavo)\b/g, ' brownsugar '],
  [/\b(corn ?starch|corn flour \(starch\)|maize starch|milho, amido|amido de milho)\b/g, ' cornstarch '],
  [/\b(corn ?meal|maize meal|milho, fuba|milho, fubá|fuba|fubá)\b/g, ' cornmeal '],
  [/\b(pessego|pêssego)\b/g, ' peach '],
  // Se aplican al texto ya sin tildes, y los espacios valen también con coma («doce, de leite»).
].map(([re, por]) => [new RegExp(sinTildes(re.source).replace(/ /g, '[ ,]+'), re.flags), por]);

// Portugués de TACO al inglés. Lo que no está queda como está (feijoada, acarajé, pequi).
const PORTUGUES = {
  abacate: 'avocado', abacaxi: 'pineapple', abadejo: 'pollock', abelha: 'honey', abobrinha: 'zucchini', abobora: 'pumpkin',
  acelga: 'chard', achocolatado: 'chocolate drink', acem: 'chuck beef', agriao: 'watercress', aguardente: 'spirit', aipim: 'cassava',
  aipo: 'celery', alcatra: 'sirloin', alface: 'lettuce', alfavaca: 'basil', alho: 'garlic', 'alho-poro': 'leek', almeirao: 'chicory',
  almondegas: 'meatball', amarela: 'yellow', amarelo: 'yellow', ameixa: 'plum', amendoim: 'peanut', americana: 'iceberg', amido: 'starch',
  amendoa: 'almond', apresuntado: 'ham', arroz: 'rice', asa: 'wing', atum: 'tuna', aveia: 'oat', azeite: 'oil', azeitona: 'olive',
  acafrao: 'turmeric', acai: 'acai', acucar: 'sugar', bacalhau: 'cod', banana: 'banana', barra: 'bar', batata: 'potato', baia: 'navel',
  bebida: 'drink', berinjela: 'eggplant', beterraba: 'beet', bife: 'steak', biscoito: 'biscuit', bisteca: 'chop', bolo: 'cake',
  bovina: 'beef', bovino: 'beef', branca: 'white', branco: 'white', broto: 'sprout', brocolis: 'broccoli', bucho: 'tripe', cabra: 'goat',
  cacau: 'cocoa', cafe: 'coffee', caju: 'cashew apple', calda: 'syrup', caldo: 'broth', camarao: 'shrimp', cana: 'sugarcane',
  canjica: 'hominy', canola: 'canola', caqui: 'persimmon', carambola: 'carambola', caranguejo: 'crab', carne: 'meat', cara: 'yam',
  casca: 'peel', castanha: 'nut', cebola: 'onion', cenoura: 'carrot', centeio: 'rye', cereais: 'cereal', cereal: 'cereal', cerveja: 'beer',
  cevada: 'barley', cha: 'tea', chuchu: 'chayote', cocada: 'coconut candy', coco: 'coconut', codorna: 'quail', coentro: 'coriander',
  concentrado: 'concentrate', congelada: 'frozen', congelado: 'frozen', 'contra-file': 'striploin', coracao: 'heart', costela: 'rib',
  couve: 'kale', 'couve-flor': 'cauliflower', coxa: 'drumstick', coxinha: 'coxinha', creme: 'cream', cremoso: 'creamy', cristal: 'granulated',
  croquete: 'croquette', cru: 'raw', crua: 'raw', cruas: 'raw', crus: 'raw', cupim: 'hump', cuscuz: 'couscous', desidratadas: 'dried',
  desidratado: 'dried', desnatado: 'skim', doce: 'sweet', drenada: 'drained', drenado: 'drained', empada: 'pie', enriquecida: 'enriched',
  ervilha: 'pea', espinafre: 'spinach', estrogonofe: 'stroganoff', extrato: 'extract', farinha: 'flour', fermentado: 'fermented',
  fermento: 'yeast', figo: 'fig', file: 'fillet', flanco: 'flank', flocos: 'flakes', folha: 'leaf', folhas: 'leaf', forma: 'loaf',
  frango: 'chicken', fresca: 'fresh', fresco: 'fresh', frescal: 'fresh', frita: 'fried', fritas: 'fried', frito: 'fried', 'fruta-pao': 'breadfruit',
  figado: 'liver', galinha: 'chicken', gelatina: 'gelatin', geleia: 'jelly', gergelim: 'sesame', girassol: 'sunflower', glicose: 'glucose',
  goiaba: 'guava', gordura: 'fat', grande: 'large', graviola: 'soursop', grao: 'grain', guarana: 'guarana', hamburguer: 'burger',
  iogurte: 'yogurt', inhame: 'taro', integral: 'integral', inteira: 'whole', inteiro: 'whole', jaca: 'jackfruit', kiwi: 'kiwi',
  lagarto: 'eye round', laranja: 'orange', lasanha: 'lasagna', legumes: 'vegetables', leite: 'milk', lentilha: 'lentil', levedura: 'yeast',
  limao: 'lemon', linguica: 'sausage', linhaca: 'flaxseed', lombo: 'loin', lingua: 'tongue', macarrao: 'pasta', maionese: 'mayonnaise',
  mamao: 'papaya', mandioca: 'cassava', manga: 'mango', manjericao: 'basil', manteiga: 'butter', margarina: 'margarine',
  marmelada: 'quince paste', mascavo: 'brown', massa: 'dough', mate: 'mate', mel: 'honey', melado: 'molasses', melancia: 'watermelon',
  melao: 'melon', merluza: 'hake', mexerica: 'tangerine', milanesa: 'breaded', milho: 'corn', mingau: 'porridge', mistura: 'mix',
  molho: 'sauce', morango: 'strawberry', mortadela: 'mortadella', mostarda: 'mustard', mozarela: 'mozzarella', musculo: 'shank',
  nabo: 'turnip', natural: 'plain', noz: 'walnut', nespera: 'loquat', oleo: 'oil', oliva: 'olive', omelete: 'omelet', orelha: 'ear',
  ovo: 'egg', ovos: 'egg', paleta: 'shoulder', pao: 'bread', parmesao: 'parmesan', pastel: 'pastel', pasteurizado: 'processed',
  patinho: 'round', peito: 'breast', pepino: 'cucumber', pernil: 'leg', peru: 'turkey', pescada: 'whiting', pescadinha: 'whiting',
  picanha: 'picanha', pinhao: 'pine nut', pipoca: 'popcorn', polenta: 'polenta', polpa: 'pulp', polvilho: 'tapioca starch', porco: 'pork',
  presunto: 'ham', preta: 'black', preto: 'black', pudim: 'pudding', pure: 'puree', po: 'powder', queijo: 'cheese', quiabo: 'okra',
  quibe: 'kibbeh', rabanete: 'radish', recheado: 'filled', refinado: 'refined', refogada: 'sauteed', refogado: 'sauteed',
  refrigerante: 'soda', repolho: 'cabbage', ricota: 'ricotta', roma: 'pomegranate', rosca: 'breadcrumbs', roxa: 'red', roxo: 'red',
  rucula: 'arugula', sal: 'salt', salada: 'salad', salame: 'salami', salmao: 'salmon', salsa: 'parsley', sardinha: 'sardine', seca: 'dried',
  seco: 'dried', semente: 'seed', sobrecoxa: 'thigh', soja: 'soy', suco: 'juice', tamarindo: 'tamarind', tangerina: 'tangerine',
  tapioca: 'tapioca', tofu: 'tofu', tomate: 'tomato', torrada: 'toast', torrado: 'roasted', toucinho: 'bacon', tremoco: 'lupin',
  trigo: 'wheat', uva: 'grape', vaca: 'cow', verde: 'green', vermelha: 'red', vermelho: 'red', agua: 'water', lima: 'lime', fuji: 'fuji',
  bolinho: 'fritter', infusao: 'infusion', pilsen: 'lager', isotonica: 'sports', tonica: 'tonic',
  cola: 'cola', capuccino: 'cappuccino', chocolate: 'chocolate', chantilly: 'whipped cream', gelado: 'frozen',
  mocoto: 'calf foot', salpicao: 'chicken salad', tabule: 'tabbouleh', yakisoba: 'yakisoba', nhoque: 'gnocchi', pamonha: 'pamonha',
  mingnon: 'tenderloin', maminha: 'tri tip', fraldinha: 'flank', capa: 'cap', charque: 'jerky', costelinha: 'rib',
  lambari: 'lambari', sardinhas: 'sardine', peixe: 'fish', manjuba: 'anchovy', camaroes: 'shrimp', tucunare: 'peacock bass',
  pintado: 'catfish', corvina: 'croaker', dourada: 'dorado', cacao: 'dogfish', ervas: 'herbs', erva: 'herb', 'erva-doce': 'fennel',
  serralha: 'sowthistle', taioba: 'taioba', jilo: 'jilo', maxixe: 'gherkin', catalonha: 'chicory', caruru: 'amaranth leaves',
  baroa: 'arracacha', inglesa: 'english', sovado: 'sweet', frances: 'french', gluten: 'gluten',
  maisena: 'cornstarch', wafer: 'wafer', cracker: 'cracker', cream: 'cream', morangos: 'strawberry', vitamina: 'smoothie',
  infantil: 'infant', matinal: 'breakfast', lacteo: 'milk', lactea: 'milk', soluvel: 'soluble', fluido: 'liquid',
  quindim: 'quindim', rapadura: 'panela', mole: 'soft', sobremesa: 'dessert', sorvete: 'icecream', tempero: 'seasoning', grosso: 'coarse',
  biologico: 'baker', quimico: 'baking powder', torradas: 'toast', pasta: 'paste', cascao: 'peel', bombom: 'bonbon',
};

// Inglés de todas partes al mismo inglés (el británico y el de Ciqual al de USDA).
const SINONIMOS = {
  aubergine: 'eggplant', courgette: 'zucchini', prawn: 'shrimp', prawns: 'shrimp', beetroot: 'beet', maize: 'corn', rocket: 'arugula',
  cilantro: 'coriander', yoghurt: 'yogurt', yogourt: 'yogurt', rapeseed: 'canola', groundnut: 'peanut', groundnuts: 'peanut',
  cookie: 'biscuit', cookies: 'biscuit', minced: 'molida', mince: 'molida', ground: 'molida', swede: 'rutabaga', porridge: 'oatmeal',
  mangetout: 'snowpea', tunny: 'tuna', haddock: 'haddock', mandarin: 'tangerine', clementine: 'clementine', satsuma: 'tangerine',
  grapefruits: 'grapefruit', pomelo: 'grapefruit', manioc: 'cassava', yuca: 'cassava', mutton: 'lamb', hogget: 'lamb', veal: 'veal',
  liquorice: 'licorice', candy: 'sweets', sweets: 'sweets', confectionery: 'sweets', rashers: 'bacon', rasher: 'bacon', gammon: 'ham',
  crisp: 'potatochips', jam: 'jam', jelly: 'jelly', marmalade: 'jam', flan: 'custard', custard: 'custard', mozarella: 'mozzarella',
  emmental: 'swiss', emmenthal: 'swiss', gruyere: 'swiss', camembert: 'brie', tagliatelle: 'pasta', spaghetti: 'pasta', macaroni: 'pasta',
  noodles: 'noodle', penne: 'pasta', fusilli: 'pasta', vermicelli: 'pasta', lasagne: 'lasagna', semolina: 'semolina', bulgar: 'bulgur',
  bourghol: 'bulgur', aniseed: 'anise', wholemeal: 'integral', wholewheat: 'integral', fatty: 'fat', skinned: 'sinpiel', sultanas: 'raisin',
  sultana: 'raisin', raisins: 'raisin', prunes: 'prune', prune: 'prune', kiwifruit: 'kiwi', litchi: 'lychee', litchis: 'lychee',
  lychees: 'lychee', groundcherry: 'goldenberry', physalis: 'goldenberry', pawpaw: 'papaya', papayas: 'papaya', mangos: 'mango',
  mangoes: 'mango', guavas: 'guava', persimmons: 'persimmon', kaki: 'persimmon', sharon: 'persimmon', quinces: 'quince', loquats: 'loquat',
  tangerines: 'tangerine', nectarines: 'nectarine', apricots: 'apricot', cherries: 'cherry', plums: 'plum', pears: 'pear', apples: 'apple',
  bananas: 'banana', oranges: 'orange', lemons: 'lemon', limes: 'lime', grapes: 'grape', strawberries: 'strawberry', raspberries: 'raspberry',
  blueberries: 'blueberry', blackberries: 'blackberry', cranberries: 'cranberry', melons: 'melon', avocados: 'avocado', tomatoes: 'tomato',
  potatoes: 'potato', onions: 'onion', carrots: 'carrot', beans: 'bean', lentils: 'lentil', peas: 'pea', nuts: 'nut', seeds: 'seed',
  almonds: 'almond', walnuts: 'walnut', hazelnuts: 'hazelnut', pistachios: 'pistachio', pecans: 'pecan', olives: 'olive', mushrooms: 'mushroom',
  cucumbers: 'cucumber', peppers: 'pepper', eggs: 'egg', sausages: 'sausage', burgers: 'burger', hamburger: 'burger', beefburger: 'burger',
  beefburgers: 'burger', patty: 'burger', patties: 'burger', fillets: 'fillet', steaks: 'steak', chops: 'chop', ribs: 'rib', wings: 'wing',
  legs: 'leg', thighs: 'thigh', drumsticks: 'drumstick', breasts: 'breast', livers: 'liver', kidneys: 'kidney', hearts: 'heart',
  sprouts: 'sprout', leaves: 'leaf', flakes: 'flakes', oats: 'oat', oatmeal: 'oatmeal', grits: 'grits', crackers: 'cracker',
  biscuits: 'biscuit', cakes: 'cake', pies: 'pie', tarts: 'tart', pancakes: 'pancake', crepes: 'crepe', crêpes: 'crepe', crepe: 'crepe',
  waffles: 'waffle', muffins: 'muffin', doughnuts: 'doughnut', donut: 'doughnut', donuts: 'doughnut', croissants: 'croissant',
  dumplings: 'dumpling', meatballs: 'meatball', fishcakes: 'fishcake', fingers: 'finger', nuggets: 'nugget', chips: 'chips',
  smoked: 'ahumado', unsmoked: 'sinahumar', whiting: 'whiting', hake: 'hake', pollack: 'pollock', saithe: 'pollock', coley: 'pollock',
  pilchard: 'sardine', pilchards: 'sardine', sardines: 'sardine', anchovies: 'anchovy', mussels: 'mussel', clams: 'clam', oysters: 'oyster',
  scallops: 'scallop', squid: 'squid', calamari: 'squid', octopus: 'octopus', shrimps: 'shrimp', crayfish: 'crayfish', crabs: 'crab',
  lobsters: 'lobster', trout: 'trout', salmon: 'salmon', cod: 'cod', tilapia: 'tilapia', mackerel: 'mackerel', herring: 'herring',
  catfish: 'catfish', swordfish: 'swordfish', plaice: 'flounder', sole: 'sole', halibut: 'halibut', flounder: 'flounder',
  courgettes: 'zucchini', aubergines: 'eggplant', parsnips: 'parsnip', turnips: 'turnip', radishes: 'radish', leeks: 'leek',
  shallots: 'shallot', chives: 'chive', herbs: 'herbs', spices: 'spice', brinjal: 'eggplant', okra: 'okra', gumbo: 'okra', ladies: 'okra',
  sweetcorn: 'sweetcorn', squashes: 'squash', pumpkins: 'pumpkin', marrow: 'squash', gherkins: 'pickle', gherkin: 'pickle',
  pickled: 'pickle', soya: 'soy', soybean: 'soy', soybeans: 'soy', soyabean: 'soy', tofu: 'tofu', quorn: 'quorn', tempeh: 'tempeh',
  semi: 'semi', skimmed: 'skim', nonfat: 'skim', unenriched: 'sinenriquecer', fortified: 'enriched', enriched: 'enriched',
  rotisserie: 'asado', barbecued: 'grillado', bbq: 'grillado', chargrilled: 'grillado', griddled: 'grillado', broiled: 'grillado',
  grilled: 'grillado', roast: 'asado', roasted: 'asado', baked: 'asado', microwaved: 'hervido', steamed: 'hervido', poached: 'hervido',
  boiled: 'hervido', simmered: 'hervido', stewed: 'guisado', braised: 'guisado', casseroled: 'guisado', stew: 'guisado',
  fried: 'frito', 'deep-fried': 'frito', 'pan-fried': 'frito', 'stir-fried': 'salteado', sauteed: 'salteado', sautéed: 'salteado',
  toasted: 'tostado', raw: 'crudo', uncooked: 'crudo', unprepared: 'crudo', unheated: 'crudo', cooked: 'cocido', dried: 'deshidratado',
  dehydrated: 'deshidratado', sundried: 'deshidratado', 'sun-dried': 'deshidratado', frozen: 'congelado', juice: 'jugo', juices: 'jugo',
  nectar: 'nectar', powder: 'polvo', powdered: 'polvo', flour: 'harina', oil: 'aceite', oils: 'aceite', sauce: 'salsa', sauces: 'salsa',
  soup: 'sopa', soups: 'sopa', syrup: 'almibar', canned: 'enlata', tinned: 'enlata', concentrate: 'concentrado', concentrated: 'concentrado',
  sweet: 'sweet', drained: 'escurrido',
};

// Lo que no dice qué alimento es.
const VACIAS = new Set(('a an and or of in on the with without to from as for by no not nfs ns type made includes including include all average year ' +
  'round commercial commercially prepared ready eat unspecified other than added any kind style recipe home homemade typical value usda ' +
  'composite trimmed retail cuts grade grades choice select prime separable boneless bone purchased weighed weight food foods products ' +
  'product variety varieties various mixed assorted brands brand generic standard regular plain portion only pack packed solids liquids ' +
  'liquid form average contents ns_ fl oz g kg ml mg 1 2 3 4 5 6 7 8 9 10 0 de da do das dos e em com ao a à no na tipo para').split(' '));

/** Las palabras de un texto en inglés (o el portugués ya pasado), sin tildes y en singular. */
function partir(texto) {
  let t = ` ${sinTildes(texto).replace(/[()]/g, ' ')} `;
  for (const [re, por] of FRASES) t = t.replace(re, por);
  return t.split(/[^a-z0-9%-]+/).filter(Boolean).map((p) => p.replace(/^-+|-+$/g, '')).filter(Boolean);
}

const singular = (p) => (p.length > 4 && p.endsWith('ies') ? `${p.slice(0, -3)}y`
  : p.length > 4 && /(ches|shes|xes|sses|oes)$/.test(p) ? p.slice(0, -2)
    : p.length > 3 && p.endsWith('s') && !/(ss|us|is)$/.test(p) ? p.slice(0, -1) : p);

/** Las palabras de un texto en inglés, normalizadas. */
export function palabrasEn(texto) {
  const salida = [];
  for (const p of partir(texto)) {
    if (VACIAS.has(p)) continue;
    const s = SINONIMOS[p] ?? SINONIMOS[singular(p)] ?? singular(p);
    for (const x of s.split(' ')) if (x && !VACIAS.has(x)) salida.push(x);
  }
  return salida;
}


/** Las palabras de un texto en portugués (TACO), pasadas al inglés y normalizadas. */
export function palabrasPt(texto) {
  const salida = [];
  for (const p of partir(texto)) {
    if (VACIAS.has(p)) continue;
    const ingles = PORTUGUES[p] ?? PORTUGUES[p.replace(/s$/, '')] ?? p;
    for (const x of ingles.split(' ')) {
      const s = SINONIMOS[x] ?? SINONIMOS[singular(x)] ?? singular(x);
      for (const y of s.split(' ')) if (y && !VACIAS.has(y)) salida.push(y);
    }
  }
  return salida;
}

// Cómo está: crudo, o cocido y cómo. «cocido» sin más va con cualquier cocción.
const ESTADOS = new Set(['crudo', 'cocido', 'hervido', 'guisado', 'asado', 'grillado', 'frito', 'salteado', 'tostado']);
const CALOR_HUMEDO = new Set(['hervido', 'guisado']);
const CALOR_SECO = new Set(['asado', 'grillado', 'tostado']);
// La forma: lo que cambia los valores aunque el alimento sea el mismo.
const FORMAS = new Set(['jugo', 'nectar', 'deshidratado', 'enlata', 'almibar', 'polvo', 'harina', 'aceite', 'salsa', 'sopa', 'concentrado', 'congelado', 'ahumado']);
// Las marcas que no son el alimento: no pueden ser su palabra principal.
export const MARCAS = new Set([...ESTADOS, ...FORMAS, 'magro', 'congrasa', 'sinpiel', 'conpiel', 'sincascara', 'sinsal', 'consal', 'conazucar', 'sinazucar', 'escurrido']);

const estadoDe = (palabras) => palabras.filter((p) => ESTADOS.has(p));
const formaDe = (palabras) => new Set(palabras.filter((p) => FORMAS.has(p)));

/** Cuánto se parecen dos estados (1 igual, menos si no). */
function parecidoDeEstado(a, b) {
  const crudoA = a.includes('crudo');
  const crudoB = b.includes('crudo');
  const cocidoA = a.some((e) => e !== 'crudo');
  const cocidoB = b.some((e) => e !== 'crudo');
  if (!a.length || !b.length) return a.length || b.length ? 0.85 : 1;
  if ((crudoA && !cocidoA && cocidoB && !crudoB) || (crudoB && !cocidoB && cocidoA && !crudoA)) return 0.3;
  const especificosA = a.filter((e) => e !== 'crudo' && e !== 'cocido');
  const especificosB = b.filter((e) => e !== 'crudo' && e !== 'cocido');
  if (!especificosA.length || !especificosB.length) return 0.95;
  if (especificosA.some((e) => especificosB.includes(e))) return 1;
  const grupo = (e) => (CALOR_HUMEDO.has(e) ? 'humedo' : CALOR_SECO.has(e) ? 'seco' : e);
  if (especificosA.some((e) => especificosB.some((f) => grupo(e) === grupo(f)))) return 0.9;
  const frito = (l) => l.some((e) => e === 'frito' || e === 'salteado');
  return frito(especificosA) !== frito(especificosB) ? 0.6 : 0.8;
}

/** Cuánto se parecen dos formas: cada forma de más o de menos resta (lo congelado, poco). */
function parecidoDeForma(a, b) {
  let factor = 1;
  for (const f of new Set([...a, ...b])) {
    if (a.has(f) === b.has(f)) continue;
    factor *= f === 'congelado' || f === 'ahumado' ? 0.85 : f === 'almibar' && (a.has('enlata') && b.has('enlata')) ? 0.7 : 0.45;
  }
  return factor;
}

// Los tipos de alimento, para no comparar un queso con una bebida. null es «cualquiera».
const TIPOS_DE_CATEGORIA = {
  frutas: ['fruta'], verduras: ['verdura'], tuberculos: ['verdura'], legumbres: ['legumbre', 'verdura'], 'frutos-secos': ['nuez'],
  cereales: ['cereal', 'dulce'], panes: ['cereal', 'dulce'], pastas: ['cereal', 'plato'], carnes: ['carne'], aves: ['carne'],
  pescados: ['pescado'], huevos: ['huevo'], lacteos: ['lacteo'], quesos: ['lacteo'], grasas: ['grasa'], dulces: ['dulce', 'lacteo', 'cereal'],
  bebidas: ['bebida', 'lacteo'], alcohol: ['alcohol'], salsas: ['salsa', 'grasa'], especias: ['salsa'], snacks: ['snack', 'cereal', 'dulce', 'nuez'],
};
/** Los tipos de un curado, por su categoría. */
export const tiposDeCategoria = (categoria) => TIPOS_DE_CATEGORIA[categoria] ?? null;

const TIPOS_TACO = {
  'Cereais e derivados': ['cereal', 'dulce'], 'Verduras, hortaliças e derivados': ['verdura'], 'Frutas e derivados': ['fruta', 'bebida'],
  'Gorduras e óleos': ['grasa'], 'Pescados e frutos do mar': ['pescado'], 'Carnes e derivados': ['carne', 'plato'],
  'Leite e derivados': ['lacteo', 'bebida', 'dulce'], 'Bebidas (alcoólicas e não alcoólicas)': ['bebida', 'alcohol'], 'Ovos e derivados': ['huevo', 'plato'],
  'Produtos açucarados': ['dulce'], 'Leguminosas e derivados': ['legumbre', 'nuez', 'dulce'], 'Nozes e sementes': ['nuez'],
};
const TIPOS_CIQUAL = {
  '01': ['plato'], '0201': ['verdura'], '0202': ['verdura'], '0203': ['legumbre'], '0204': ['fruta'], '0205': ['nuez'], '03': ['cereal'],
  '0303': ['snack', 'cereal'], '04': ['carne'], '0404': ['carne', 'plato'], '0405': ['pescado'], '0406': ['pescado'], '0407': ['pescado'],
  '0408': ['pescado'], '0409': ['pescado', 'plato'], '0410': ['huevo'], '0411': ['plato'], '05': ['lacteo'], '0502': ['lacteo', 'dulce'],
  '0601': ['bebida'], '0602': ['bebida'], '0603': ['alcohol'], '07': ['dulce'], '0705': ['dulce', 'cereal'], '0707': ['dulce', 'cereal'],
  '0708': ['dulce', 'cereal', 'snack'], '08': ['dulce'], '09': ['grasa'], '10': ['salsa'], '1007': ['verdura'],
};
const TIPOS_COFID = {
  A: ['cereal', 'dulce', 'plato'], B: ['lacteo', 'dulce', 'bebida', 'grasa'], C: ['huevo', 'plato'], D: ['verdura', 'legumbre', 'plato'],
  F: ['fruta', 'bebida'], G: ['nuez'], H: ['salsa'], J: ['pescado', 'plato'], M: ['carne', 'plato'], O: ['grasa'], P: ['bebida'],
  S: ['dulce', 'snack'], W: ['salsa', 'plato'],
};
/** Los tipos de un alimento de una segunda fuente, por su grupo. */
export function tiposDeFuente(a) {
  if (a.fuente === 'taco') return TIPOS_TACO[a.grupo] ?? null;
  if (a.fuente === 'ciqual') return TIPOS_CIQUAL[a.subgrupo] ?? TIPOS_CIQUAL[String(a.subgrupo).slice(0, 2)] ?? null;
  return TIPOS_COFID[String(a.grupo)[0]] ?? null;
}
const compatibles = (a, b) => !a || !b || a.includes('plato') || b.includes('plato') || a.some((t) => b.includes(t));

/**
 * El índice de las segundas fuentes. `candidatos` son los alimentos de los lectores de
 * herramientas/fuentes, cada uno con `palabras` (en inglés) y `tipos`. Devuelve una función que,
 * para un curado, da los mejores de cada fuente con su puntaje.
 */
export function indice(candidatos) {
  const df = new Map();
  for (const c of candidatos) for (const p of new Set(c.palabras)) df.set(p, (df.get(p) ?? 0) + 1);
  const n = candidatos.length;
  const peso = (p) => Math.log(1 + n / (df.get(p) ?? 0.5));
  for (const c of candidatos) {
    c.conjunto = new Set(c.palabras);
    c.norma = Math.sqrt([...c.conjunto].reduce((s, p) => s + peso(p) ** 2, 0));
    c.estado = estadoDe(c.palabras);
    c.forma = formaDe(c.palabras);
  }
  const porPalabra = new Map();
  for (const c of candidatos) for (const p of c.conjunto) (porPalabra.get(p) ?? porPalabra.set(p, []).get(p)).push(c);

  /**
   * Los `cuantos` mejores de cada fuente para un curado: `palabras` es un Map de palabra → cuánto
   * vale en la consulta (1 las de su nombre en inglés, menos las de la descripción de USDA),
   * `nucleo` las palabras de las que tiene que estar alguna y `tipos` los de su categoría.
   */
  return function buscar({ palabras, nucleo, tipos }, cuantos = 3) {
    const vector = new Map([...palabras].filter(([p]) => df.has(p)).map(([p, factor]) => [p, peso(p) * factor]));
    const norma = Math.sqrt([...vector.values()].reduce((s, v) => s + v ** 2, 0)) || 1;
    const todas = [...palabras.keys()];
    const estado = estadoDe(todas);
    const forma = formaDe(todas);
    const vistos = new Set();
    for (const p of vector.keys()) for (const c of porPalabra.get(p) ?? []) vistos.add(c);
    const puntajes = [];
    for (const c of vistos) {
      let comun = 0;
      for (const p of c.conjunto) if (vector.has(p)) comun += vector.get(p) * peso(p);
      let puntaje = comun / (norma * c.norma);
      if (nucleo.length && !nucleo.some((p) => c.conjunto.has(p))) puntaje *= 0.35;
      if (!compatibles(tipos, c.tipos)) puntaje *= 0.5;
      puntaje *= parecidoDeEstado(estado, c.estado) * parecidoDeForma(forma, c.forma);
      puntajes.push({ c, puntaje });
    }
    puntajes.sort((a, b) => b.puntaje - a.puntaje || a.c.fuente.localeCompare(b.c.fuente) || a.c.codigo.localeCompare(b.c.codigo, 'en', { numeric: true }));
    const porFuente = new Map();
    for (const x of puntajes) {
      const lista = porFuente.get(x.c.fuente) ?? porFuente.set(x.c.fuente, []).get(x.c.fuente);
      if (lista.length < cuantos) lista.push(x);
    }
    return porFuente;
  };
}
