/*
 * Catálogo estático de AUREXIR (solo front, sin backend).
 * Cada fragancia: línea (para filtros), tono del frasco (paleta de marca),
 * pirámide olfativa y variantes de formato con su precio en USD.
 * `tone`: bronce | cian | titanio | noir  → tinte del líquido en BottleArt.
 */
export const products = [
  {
    id: 'aurexir-original',
    name: 'Aurexir Original',
    line: 'Eau de Parfum',
    tag: 'Insignia',
    tone: 'bronce',
    desc: 'La firma de la casa. Ámbar dorado sobre maderas secas: cálido de cerca, magnético a distancia.',
    notes: {
      salida: 'Bergamota · pimienta rosa',
      corazon: 'Ámbar · geranio',
      fondo: 'Cedro · almizcle',
    },
    variants: [
      { size: '50 ml', price: 68 },
      { size: '100 ml', price: 98 },
    ],
  },
  {
    id: 'noir-onix',
    name: 'Noir Ónix',
    line: 'Parfum',
    tag: 'Best seller',
    tone: 'noir',
    desc: 'Oscuro y pulido como la piedra que lo nombra. Cuero y oud con un fondo de vainilla negra.',
    notes: {
      salida: 'Cardamomo · nuez moscada',
      corazon: 'Cuero · oud',
      fondo: 'Vainilla negra · haba tonka',
    },
    variants: [
      { size: '50 ml', price: 84 },
      { size: '100 ml', price: 122 },
    ],
  },
  {
    id: 'glacier',
    name: 'Glacier',
    line: 'Eau de Parfum',
    tag: 'Nuevo',
    tone: 'cian',
    desc: 'Frío que despierta. Menta helada e incienso sobre un almizcle mineral, limpio y futurista.',
    notes: {
      salida: 'Menta helada · limón',
      corazon: 'Incienso · lavanda',
      fondo: 'Almizcle mineral · ámbar gris',
    },
    variants: [
      { size: '50 ml', price: 72 },
      { size: '100 ml', price: 104 },
    ],
  },
  {
    id: 'aurum-24',
    name: 'Aurum 24',
    line: 'Elixir',
    tag: null,
    tone: 'bronce',
    desc: 'Concentración extrema para la noche. Azafrán y miel fundidos en ámbar líquido.',
    notes: {
      salida: 'Azafrán · naranja sanguina',
      corazon: 'Miel · rosa oscura',
      fondo: 'Ámbar dorado · benjuí',
    },
    variants: [
      { size: '50 ml', price: 96 },
      { size: '100 ml', price: 138 },
    ],
  },
  {
    id: 'titan',
    name: 'Titán',
    line: 'Parfum',
    tag: null,
    tone: 'titanio',
    desc: 'Metálico y sobrio. Vetiver gris con jengibre, para quien no necesita levantar la voz.',
    notes: {
      salida: 'Pomelo · jengibre',
      corazon: 'Vetiver · salvia',
      fondo: 'Cachemira · vetiver ahumado',
    },
    variants: [
      { size: '50 ml', price: 78 },
      { size: '100 ml', price: 112 },
    ],
  },
  {
    id: 'helix',
    name: 'Hélix',
    line: 'Eau de Parfum',
    tag: null,
    tone: 'noir',
    desc: 'Una espiral aromática: lavanda eléctrica y cardamomo que aterrizan en tonka cremosa.',
    notes: {
      salida: 'Cardamomo · petit grain',
      corazon: 'Lavanda · violeta',
      fondo: 'Haba tonka · sándalo',
    },
    variants: [
      { size: '50 ml', price: 70 },
      { size: '100 ml', price: 100 },
    ],
  },
]
