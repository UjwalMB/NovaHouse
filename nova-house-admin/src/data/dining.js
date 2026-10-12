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
