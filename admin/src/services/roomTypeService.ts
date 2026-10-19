export interface RoomTypeConfig {
  id: string;
  name: string;
  category: 'Rooms' | 'Suites';
  basePrice: number;
  weekendPrice: number;
  capacity: number;
  bedType: string;
  size: string;
  description: string;
  amenities: string[];
}

const STORAGE_KEY = 'nova_admin_room_types';

export const initialRoomTypes: RoomTypeConfig[] = [
  {
    id: 'rt_deluxe',
    name: 'Deluxe Room',
    category: 'Rooms',
    basePrice: 18500,
    weekendPrice: 21500,
    capacity: 2,
    bedType: 'King Bed / Twin Beds',
    size: '42 m²',
    description: 'Serene courtyard and garden sanctuaries with bespoke teak millwork and rain showers.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Breakfast'],
  },
  {
    id: 'rt_premier',
    name: 'Premier Room',
    category: 'Rooms',
    basePrice: 24000,
    weekendPrice: 28000,
    capacity: 2,
    bedType: 'King Bed',
    size: '48 m²',
    description: 'Elevated second-floor rooms with verdant garden or balcony vistas and soaking tub.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Garden View'],
  },
  {
    id: 'rt_junior_suite',
    name: 'Junior Suite',
    category: 'Suites',
    basePrice: 38000,
    weekendPrice: 44000,
    capacity: 3,
    bedType: 'King Bed + Daybed',
    size: '64 m²',
    description: 'Distinct living lounge partitioned by Japanese timber lattices with turntable audio.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Lounge'],
  },
  {
    id: 'rt_executive_suite',
    name: 'Executive Suite',
    category: 'Suites',
    basePrice: 45000,
    weekendPrice: 52000,
    capacity: 3,
    bedType: 'Super King Bed',
    size: '76 m²',
    description: 'Corner suite with dual-aspect skyline glass, dining salon, and walk-in dressing wardrobe.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Dining Table'],
  },
  {
    id: 'rt_terrace_suite',
    name: 'Terrace Suite',
    category: 'Suites',
    basePrice: 54000,
    weekendPrice: 62000,
    capacity: 3,
    bedType: 'Super King Bed',
    size: '88 m²',
    description: 'Includes a private 24m² landscaped terrace with outdoor daybed and teak dining table.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Private Terrace'],
  },
  {
    id: 'rt_penthouse',
    name: 'Penthouse',
    category: 'Suites',
    basePrice: 85000,
    weekendPrice: 98000,
    capacity: 4,
    bedType: 'Master Suite + Guest Room',
    size: '135 m²',
    description: 'The architectural apex of NOVA HOUSE with private butler service, wine cellar, and plunge spa.',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Butler Service', 'Airport Chauffeur'],
  },
  {
    id: 'rt_studio',
    name: 'Studio',
    category: 'Rooms',
    basePrice: 16500,
    weekendPrice: 19000,
    capacity: 2,
    bedType: 'Queen Bed',
    size: '38 m²',
    description: 'Compact executive studio engineered for uninterrupted creative or remote productivity.',
    amenities: ['Queen Bed', 'Wi-Fi', 'Air Conditioning', 'TV', 'Work Desk', 'Breakfast'],
  },
];

export function getRoomTypes(): RoomTypeConfig[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRoomTypes));
  return [...initialRoomTypes];
}

export function saveRoomTypes(types: RoomTypeConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

export function saveRoomType(typeConfig: RoomTypeConfig): RoomTypeConfig[] {
  const current = getRoomTypes();
  const index = current.findIndex((t) => t.id === typeConfig.id);
  let updated: RoomTypeConfig[];
  if (index >= 0) {
    updated = current.map((t) => (t.id === typeConfig.id ? typeConfig : t));
  } else {
    updated = [typeConfig, ...current];
  }
  saveRoomTypes(updated);
  return updated;
}
