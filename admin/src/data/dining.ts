export const initialDining = {
  restaurant: {
    name: 'EMBER',
    tagline: 'Modern Hearth & Coastal Alchemy',
    description: 'A contemporary dining sanctuary celebrating local heirloom ingredients, open charcoal hearth embers, and the rich seafood heritage of the Malabar and Coromandel coastlines.',
    chef: 'Chef Abhay Deshmukh & Culinary Collective',
    coverCapacity: 64,
    openingHours: {
      breakfast: '06:30 AM – 10:30 AM',
      lunch: '12:30 PM – 03:30 PM',
      dinner: '07:00 PM – 11:30 PM',
      bar: '05:00 PM – 01:00 AM'
    },
    images: {
      main: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      food: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      cocktail: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
    }
  },
  menuItems: [
    {
      id: 'D01',
      name: 'Mysore Charcoal Smoked Idli',
      category: 'Breakfast',
      description: 'Slow fermented heirloom red rice idlis with smoked ghee tempering and stone-ground coconut shallot chutney.',
      price: 650,
      availability: 'Available',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D02',
      name: 'Coorg Robusta French Toast',
      category: 'Breakfast',
      description: 'Brioche soaked in shade-grown Coorg espresso custard, served with wild Western Ghats mountain honey.',
      price: 850,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D03',
      name: 'Charred Byadgi Chili Prawns',
      category: 'Starters',
      description: 'Tiger prawns blistered over coconut charcoal, tossed in native cold-pressed coconut oil, curry leaves, and Byadgi emulsion.',
      price: 1450,
      availability: 'Available',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D04',
      name: 'Tender Jackfruit Tartare',
      category: 'Starters',
      description: 'Smoked green jackfruit, fermented lime kosambari, crisp amaranth crackers, and toasted black cumin.',
      price: 950,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D05',
      name: 'Kundapura Spiced Sea Bass',
      category: 'Main Course',
      description: 'Pan-seared coastal sea bass wrapped in charred banana leaf with roasted coriander, sour kokum, and neer dosa.',
      price: 2200,
      availability: 'Available',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D06',
      name: 'Hearth-Roasted Wild Mushroom Polenta',
      category: 'Main Course',
      description: 'Slow-cooked sorghum porridge, foraged Kodagu black morels, browned cashew butter, and crisp sage leaves.',
      price: 1750,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D07',
      name: 'Bannur Lamb Shank Pepper Pot',
      category: 'Main Course',
      description: '12-hour braised Bannur heritage lamb in tellicherry black pepper broth, served with flaky malabar parotta.',
      price: 2600,
      availability: 'Low Stock',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D08',
      name: 'Filter Coffee Chocolate Mille-Feuille',
      category: 'Desserts',
      description: 'Caramelized puff pastry, dark chocolate ganache infused with estate chicory coffee, and roasted hazelnut gelato.',
      price: 850,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D09',
      name: 'Jaggery & Cardamom Soufflé',
      category: 'Desserts',
      description: 'Warm organic palm jaggery soufflé served with warm spiced coconut cream anglaise.',
      price: 800,
      availability: 'Available',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D10',
      name: 'Richmond botanical Highball',
      category: 'Beverages',
      description: 'Indian artisanal dry gin, vetiver cordial, clarified cucumber water, and pink peppercorn tonic.',
      price: 1100,
      availability: 'Available',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'D11',
      name: 'Smoked Tamarind Old Fashioned',
      category: 'Beverages',
      description: 'Single malt whisky, charred tamarind jaggery syrup, Angostura bitters, and dried orange wheel.',
      price: 1350,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80'
    }
  ]
};

export const initialTables = [
  { id: 'TBL-01', tableNumber: 'T-01', capacity: 2, section: 'Main Dining', status: 'Available' },
  { id: 'TBL-02', tableNumber: 'T-02', capacity: 2, section: 'Main Dining', status: 'Occupied', currentOrderId: 'ORD-101' },
  { id: 'TBL-03', tableNumber: 'T-03', capacity: 4, section: 'Main Dining', status: 'Available' },
  { id: 'TBL-04', tableNumber: 'T-04', capacity: 4, section: 'Courtyard Terrace', status: 'Reserved', reservedFor: 'Eleanor Vance', reservationTime: '08:00 PM' },
  { id: 'TBL-05', tableNumber: 'T-05', capacity: 6, section: 'Courtyard Terrace', status: 'Available' },
  { id: 'TBL-06', tableNumber: 'T-06', capacity: 2, section: 'Cellar Lounge', status: 'Occupied', currentOrderId: 'ORD-102' },
  { id: 'TBL-07', tableNumber: 'T-07', capacity: 4, section: 'Cellar Lounge', status: 'Available' },
  { id: 'TBL-08', tableNumber: 'T-08', capacity: 8, section: 'Private Pavilion', status: 'Reserved', reservedFor: 'Vikramaditya Singhania', reservationTime: '08:30 PM' },
];

export const initialRestaurantOrders = [
  {
    id: 'ORD-101',
    orderNumber: 'EMB-9021',
    tableNumber: 'T-02',
    guestName: 'Rohit Verma',
    roomNumber: '102',
    items: [
      { menuItemId: 'D03', name: 'Charred Byadgi Chili Prawns', price: 1450, quantity: 2 },
      { menuItemId: 'D10', name: 'Richmond botanical Highball', price: 1100, quantity: 2 },
    ],
    subtotal: 5100,
    taxes: 918,
    total: 6018,
    status: 'Preparing',
    paymentStatus: 'BILLED_TO_ROOM',
    createdAt: '2026-10-19 19:40',
    serverName: 'Aditya Sen',
    specialInstructions: 'Medium spicy prawns, extra lime on the highball.',
  },
  {
    id: 'ORD-102',
    orderNumber: 'EMB-9022',
    tableNumber: 'T-06',
    guestName: 'Priya Nambiar',
    items: [
      { menuItemId: 'D11', name: 'Smoked Tamarind Old Fashioned', price: 1350, quantity: 2 },
      { menuItemId: 'D04', name: 'Tender Jackfruit Tartare', price: 950, quantity: 1 },
    ],
    subtotal: 3650,
    taxes: 657,
    total: 4307,
    status: 'Ready',
    paymentStatus: 'UNPAID',
    createdAt: '2026-10-19 20:05',
    serverName: 'Neha Pillai',
  },
  {
    id: 'ORD-103',
    orderNumber: 'EMB-9019',
    tableNumber: 'T-03',
    guestName: 'David Sterling',
    roomNumber: '301',
    items: [
      { menuItemId: 'D09', name: 'Jaggery & Cardamom Soufflé', price: 800, quantity: 2 },
      { menuItemId: 'D02', name: 'Coorg Robusta French Toast', price: 850, quantity: 1 },
    ],
    subtotal: 2450,
    taxes: 441,
    total: 2891,
    status: 'Completed',
    paymentStatus: 'PAID',
    createdAt: '2026-10-19 17:15',
    serverName: 'Aditya Sen',
  },
];

export const initialRoomServiceOrders = [
  {
    id: 'RS-301',
    orderNumber: 'RS-8801',
    roomNumber: '301',
    guestName: 'Vikramaditya Singhania',
    guestPhone: '+91 98200 44112',
    bookingId: 'NH-1024',
    items: [
      { menuItemId: 'D03', name: 'Charred Byadgi Chili Prawns', price: 1450, quantity: 1 },
      { menuItemId: 'D01', name: 'Mysore Charcoal Smoked Idli', price: 650, quantity: 2 },
      { menuItemId: 'D10', name: 'Richmond botanical Highball', price: 1100, quantity: 1 },
    ],
    subtotal: 3850,
    taxes: 693,
    deliveryCharge: 350,
    total: 4893,
    status: 'Delivered',
    paymentStatus: 'BILLED_TO_ROOM',
    createdAt: '2026-10-19 18:20',
    deliveryTimeEstimated: '18:55',
    assignedStaff: 'Sunil Nair',
    specialInstructions: 'White-glove tray setup on the private terrace table.',
  },
  {
    id: 'RS-302',
    orderNumber: 'RS-8802',
    roomNumber: '501',
    guestName: 'Tara Oberoi',
    guestPhone: '+91 97110 33200',
    bookingId: 'NH-1025',
    items: [
      { menuItemId: 'D09', name: 'Jaggery & Cardamom Soufflé', price: 800, quantity: 2 },
      { menuItemId: 'D11', name: 'Smoked Tamarind Old Fashioned', price: 1350, quantity: 2 },
    ],
    subtotal: 4300,
    taxes: 774,
    deliveryCharge: 350,
    total: 5424,
    status: 'Preparing',
    paymentStatus: 'BILLED_TO_ROOM',
    createdAt: '2026-10-19 20:30',
    deliveryTimeEstimated: '21:05',
    assignedStaff: 'Sunil Nair',
    specialInstructions: 'Rooftop penthouse lounge delivery.',
  },
];

