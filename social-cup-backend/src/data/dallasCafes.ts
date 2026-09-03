export interface CafeData {
  id: string;
  name: string;
  neighborhood: string;
  distance: string;
  address: string;
  hours: string;
  open: boolean;
  rating: number;
  price: string;
  payoutRate: number;
  pinCode: string;
  isFeatured: boolean;
  image?: string;
  gallery?: string[];
  tags: string[];
  drinks: {
    id: string;
    name: string;
    desc: string;
    credits: number;
    retail: number;
    rating: number;
    signature: boolean;
    type: string;
    image?: string;
  }[];
}

export const DALLAS_CAFES: CafeData[] = [
  {
    id: 'roastery-coffee-house',
    name: 'Roastery Coffee House',
    neighborhood: 'Bishop Arts',
    distance: '0.4 mi',
    address: '408 N Bishop Ave, Dallas, TX 75208',
    hours: '8am–10pm daily',
    open: true,
    rating: 4.9,
    price: '$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Garden patio', 'Third wave', 'Specialty brew'],
    drinks: [
      { id: 'cascara-brew', name: 'Cascara Brew', desc: 'Sun-dried coffee cherry infusion with sparkling citrus notes', credits: 6, retail: 6.50, rating: 4.9, signature: true, type: 'Signature brew', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80' },
      { id: 'monsoon-malabar', name: 'Monsoon Malabar Pour Over', desc: 'Slow hand-poured single origin with low acidity', credits: 5, retail: 5.50, rating: 4.8, signature: false, type: 'Filter coffee', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' },
      { id: 'cranberry-iced', name: 'Cranberry Iced Coffee', desc: 'Double espresso over chilled spiced cranberry reduction', credits: 6, retail: 6.25, rating: 4.9, signature: true, type: 'Cold brew', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'cafe-niloufer',
    name: 'Café Niloufer',
    neighborhood: 'Deep Ellum',
    distance: '1.1 mi',
    address: '2639 Main St, Dallas, TX 75226',
    hours: '6:30am–11pm daily',
    open: true,
    rating: 4.8,
    price: '$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Heritage', 'Iconic', 'Maska Bun'],
    drinks: [
      { id: 'niloufer-chai', name: 'Niloufer Special Irani Chai', desc: 'Slow-dum brewed rich spiced black tea with reduced creamy milk', credits: 3, retail: 3.50, rating: 4.9, signature: true, type: 'Chai & Tea', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80' },
      { id: 'niloufer-filter', name: 'Niloufer Decoction Filter Coffee', desc: 'Traditional freshly brewed chicory decoction with frothy milk', credits: 4, retail: 4.00, rating: 4.7, signature: false, type: 'Filter coffee', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'concu',
    name: 'Conçu',
    neighborhood: 'Uptown',
    distance: '1.6 mi',
    address: '2800 Routh St, Dallas, TX 75201',
    hours: '9am–10:30pm daily',
    open: true,
    rating: 4.9,
    price: '$$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['French patisserie', 'Chic', 'Dessert bar'],
    drinks: [
      { id: 'valrhona-chocolate', name: 'Valrhona Hot Chocolate', desc: 'Single-origin dark French Valrhona chocolate with steamed cream', credits: 6, retail: 6.75, rating: 5.0, signature: true, type: 'Specialty chocolate', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80' },
      { id: 'vanilla-latte', name: 'Madagascar Vanilla Bean Latte', desc: 'Double espresso and Madagascar vanilla bean caviar', credits: 5, retail: 5.75, rating: 4.8, signature: false, type: 'Espresso drink', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'true-black',
    name: 'True Black Specialty Coffee',
    neighborhood: 'Knox-Henderson',
    distance: '2.1 mi',
    address: '3102 Knox St, Dallas, TX 75205',
    hours: '7:30am–9pm daily',
    open: true,
    rating: 4.9,
    price: '$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Minimalist', 'Third wave', 'Study spot'],
    drinks: [
      { id: 'sea-salt-coldbrew', name: 'Sea Salt Caramel Cold Brew', desc: '20-hour steep cold brew with sea salt caramel foam', credits: 6, retail: 6.50, rating: 5.0, signature: true, type: 'Cold brew', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
      { id: 'true-cortado', name: 'True Cortado', desc: 'Dense ristretto shots and micro-foamed milk', credits: 4, retail: 4.75, rating: 4.8, signature: false, type: 'Espresso drink', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'subko-coffee',
    name: 'Subko Coffee',
    neighborhood: 'Lower Greenville',
    distance: '2.5 mi',
    address: '2008 Greenville Ave, Dallas, TX 75206',
    hours: '7:30am–10pm daily',
    open: true,
    rating: 4.8,
    price: '$$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Craft roastery', 'Artisanal', 'Bakehouse'],
    drinks: [
      { id: 'cacao-coldbrew', name: 'Subko Cacao Cold Brew', desc: 'Direct trade origin beans steeped with organic cacao husks', credits: 6, retail: 6.50, rating: 4.9, signature: true, type: 'Cold brew', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80' },
      { id: 'bloom-flat-white', name: 'Bloom Flat White', desc: 'Specialty medium roast with silky textured oat milk', credits: 5, retail: 5.25, rating: 4.7, signature: false, type: 'Espresso drink', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'blue-tokai',
    name: 'Blue Tokai Coffee Roasters',
    neighborhood: 'Design District',
    distance: '2.7 mi',
    address: '1405 Dragon St, Dallas, TX 75207',
    hours: '7am–9pm daily',
    open: true,
    rating: 4.7,
    price: '$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Work cafe', 'Roastery', 'Single estate'],
    drinks: [
      { id: 'sea-salt-mocha', name: 'Sea Salt Mocha', desc: 'Estate espresso, artisanal ganache, flaked sea salt', credits: 5, retail: 5.50, rating: 4.8, signature: true, type: 'Espresso drink', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80' },
      { id: 'nitro-draft', name: 'Nitrogen Draft Cold Brew', desc: 'Draft cold brew with cascading micro-bubbles', credits: 5, retail: 5.00, rating: 4.7, signature: false, type: 'Cold brew', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'autumn-leaf',
    name: 'Autumn Leaf Café',
    neighborhood: 'Lakewood',
    distance: '3.2 mi',
    address: '6333 E Mockingbird Ln, Dallas, TX 75214',
    hours: '8:30am–10pm daily',
    open: true,
    rating: 4.7,
    price: '$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Shaded courtyard', 'Pet friendly', 'Cozy'],
    drinks: [
      { id: 'hazelnut-macchiato', name: 'Hazelnut Cortado Macchiato', desc: 'Double shot over house hazelnut praline', credits: 5, retail: 5.25, rating: 4.7, signature: true, type: 'Espresso drink', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80' },
      { id: 'gelato-affogato', name: 'Artisan Gelato Affogato', desc: 'Vanilla bean gelato drowned in fresh hot espresso', credits: 6, retail: 6.00, rating: 4.8, signature: false, type: 'Dessert coffee', image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
    ],
  },
  {
    id: 'roast-ccx',
    name: 'Roast CCX',
    neighborhood: 'Downtown Dallas',
    distance: '1.5 mi',
    address: '1401 Elm St, Dallas, TX 75202',
    hours: '7am–10pm daily',
    open: true,
    rating: 4.6,
    price: '$$',
    payoutRate: 3.50,
    pinCode: '4821',
    isFeatured: false,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    ],
    tags: ['Modern roastery', 'Corporate hub', 'Late night'],
    drinks: [
      { id: 'ccx-tonic', name: 'CCX Espresso Tonic', desc: 'Double espresso over craft tonic and fresh rosemary', credits: 5, retail: 5.50, rating: 4.8, signature: true, type: 'Specialty coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80' },
    ],
  },
];
