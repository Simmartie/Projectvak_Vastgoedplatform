export interface Property {
  id: string
  address: string
  city: string
  postalCode: string
  price: number
  previousPrice?: number
  type: 'huis' | 'appartement' | 'villa'
  rooms: number
  bedrooms: number
  area: number
  plotSize?: number
  buildYear: number
  energyLabel: string
  status: 'te-koop' | 'onder-bod' | 'verkocht'
  description: string
  features: string[]
  images: string[]
  sellerId: string
  // Status tracking
  views: number
  visits: Visit[]
  bids: Bid[]
  interested: number
  phase: 'intake' | 'fotografie' | 'online' | 'bezichtigingen' | 'onderhandeling' | 'afgerond'
  // Neighborhood info
  neighborhood: NeighborhoodInfo
}

export interface Visit {
  id: string
  date: string
  buyerId: string
  buyerName: string
  feedback?: string
  rating?: number
}

export interface Bid {
  id: string
  amount: number
  buyerId: string
  buyerName: string
  date: string
  status: 'pending' | 'accepted' | 'rejected'
  comments?: string
}

export interface NeighborhoodInfo {
  schools: School[]
  sports: SportsClub[]
  transport: Transport[]
  events: Event[]
}

export interface School {
  name: string
  type: 'basisonderwijs' | 'middelbaar' | 'mbo' | 'hbo'
  distance: number
  rating?: number
}

export interface SportsClub {
  name: string
  type: string
  distance: number
}

export interface Transport {
  type: 'bus' | 'tram' | 'trein' | 'metro'
  line: string
  stop: string
  distance: number
}

export interface Event {
  name: string
  frequency: string
  description: string
}

// Mock data
export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    address: 'Kerkstraat 123',
    city: 'Amsterdam',
    postalCode: '1017 GC',
    price: 495000,
    type: 'huis',
    rooms: 5,
    bedrooms: 3,
    area: 120,
    plotSize: 150,
    buildYear: 1920,
    energyLabel: 'C',
    status: 'te-koop',
    description: 'Charmante eengezinswoning in het hart van Amsterdam. Volledig gerenoveerd met behoud van authentieke details. Rustige straat, nabij alle voorzieningen.',
    features: [
      'Eigen parkeerplaats',
      'Tuin op het zuiden',
      'Monumentaal pand',
      'Energiezuinig',
      'Dubbele beglazing',
    ],
    images: [
      '/modern-dutch-house-exterior.jpg',
      '/modern-living-room.png',
      '/modern-kitchen.png',
      '/modern-home-office.png',
      '/luxury-apartment-interior.png',
    ],
    sellerId: 'v1',
    views: 342,
    visits: [
      {
        id: 'v1',
        date: '2024-01-15',
        buyerId: '3',
        buyerName: 'Pieter de Vries',
        feedback: 'Prachtige woning, zeer geïnteresseerd!',
        rating: 5,
      },
      {
        id: 'v2',
        date: '2024-01-18',
        buyerId: '4',
        buyerName: 'Sarah de Jong',
        feedback: 'Mooie locatie maar iets te klein voor ons gezin',
        rating: 3,
      },
    ],
    bids: [
      {
        id: 'b1',
        amount: 485000,
        buyerId: '3',
        buyerName: 'Pieter de Vries',
        date: '2024-01-20',
        status: 'pending',
        comments: 'Eerste bod, graag binnen 48 uur reactie',
      },
    ],
    interested: 12,
    phase: 'onderhandeling',
    neighborhood: {
      schools: [
        {
          name: 'De Regenboog Basisschool',
          type: 'basisonderwijs',
          distance: 400,
          rating: 4.5,
        },
        {
          name: 'Vossius Gymnasium',
          type: 'middelbaar',
          distance: 1200,
          rating: 4.8,
        },
      ],
      sports: [
        {
          name: 'AFC Amsterdam Voetbalvereniging',
          type: 'Voetbal',
          distance: 800,
        },
        {
          name: 'Sportcentrum Ookmeer',
          type: 'Fitness & Zwemmen',
          distance: 1500,
        },
      ],
      transport: [
        {
          type: 'tram',
          line: '1',
          stop: 'Leidseplein',
          distance: 300,
        },
        {
          type: 'bus',
          line: '21',
          stop: 'Kerkstraat',
          distance: 150,
        },
        {
          type: 'metro',
          line: '52',
          stop: 'Vijzelgracht',
          distance: 600,
        },
      ],
      events: [
        {
          name: 'Grachtenfestival',
          frequency: 'Jaarlijks in augustus',
          description: 'Klassieke muziek langs de grachten',
        },
        {
          name: 'Koningsdag',
          frequency: 'Jaarlijks 27 april',
          description: 'Groot straatfeest door heel Amsterdam',
        },
      ],
    },
  },
  {
    id: 'prop-2',
    address: 'Herengracht 456',
    city: 'Amsterdam',
    postalCode: '1017 BV',
    price: 875000,
    type: 'appartement',
    rooms: 4,
    bedrooms: 2,
    area: 95,
    buildYear: 1880,
    energyLabel: 'B',
    status: 'te-koop',
    description: 'Luxe bovenwoning aan de gracht met schitterend uitzicht. Volledig gemoderniseerd met hoogwaardige afwerking.',
    features: [
      'Grachtuitzicht',
      'Lift aanwezig',
      'Balkon',
      'Moderne keuken',
      'Monumentaal pand',
    ],
    images: [
      '/canal-house-amsterdam.jpg',
      '/luxury-apartment-interior.png',
      '/canal-view-balcony.jpg',
      '/modern-kitchen.png',
      '/modern-living-room.png',
    ],
    sellerId: 'v2',
    views: 567,
    visits: [],
    bids: [],
    interested: 23,
    phase: 'bezichtigingen',
    neighborhood: {
      schools: [
        {
          name: 'Montessori Basisschool',
          type: 'basisonderwijs',
          distance: 600,
          rating: 4.6,
        },
      ],
      sports: [
        {
          name: 'Vondelgym',
          type: 'Fitness',
          distance: 900,
        },
      ],
      transport: [
        {
          type: 'tram',
          line: '2',
          stop: 'Koningsplein',
          distance: 200,
        },
      ],
      events: [
        {
          name: 'Amsterdam Light Festival',
          frequency: 'Jaarlijks december-januari',
          description: 'Lichtkunstwerken langs de grachten',
        },
      ],
    },
  },
  {
    id: 'prop-3',
    address: 'Beethovenstraat 789',
    city: 'Amsterdam',
    postalCode: '1077 HV',
    price: 1250000,
    type: 'villa',
    rooms: 7,
    bedrooms: 4,
    area: 220,
    plotSize: 400,
    buildYear: 1935,
    energyLabel: 'A',
    status: 'te-koop',
    description: 'Statige vrijstaande villa met ruime tuin in Amsterdam Zuid. Volledig duurzaam gerenoveerd met zonnepanelen en warmtepomp.',
    features: [
      'Zonnepanelen',
      'Warmtepomp',
      'Eigen oprit',
      'Grote tuin',
      'Thuiskantoor',
      'Garage',
    ],
    images: [
      '/luxury-villa-amsterdam.jpg',
      '/spacious-garden.jpg',
      '/modern-home-office.png',
      '/modern-living-room.png',
      '/modern-kitchen.png',
    ],
    sellerId: 'v3',
    views: 189,
    visits: [],
    bids: [],
    interested: 8,
    phase: 'online',
    neighborhood: {
      schools: [
        {
          name: 'International School',
          type: 'basisonderwijs',
          distance: 500,
          rating: 4.9,
        },
        {
          name: 'Barlaeus Gymnasium',
          type: 'middelbaar',
          distance: 800,
          rating: 4.7,
        },
      ],
      sports: [
        {
          name: 'Tennispark Oud-Zuid',
          type: 'Tennis',
          distance: 600,
        },
        {
          name: 'Hockey Club Amsterdam',
          type: 'Hockey',
          distance: 1000,
        },
      ],
      transport: [
        {
          type: 'metro',
          line: '52',
          stop: 'Station Zuid',
          distance: 800,
        },
        {
          type: 'tram',
          line: '5',
          stop: 'Beethovenstraat',
          distance: 100,
        },
      ],
      events: [
        {
          name: 'Museumplein Evenementen',
          frequency: 'Meerdere per jaar',
          description: 'Concerten en festivals op het Museumplein',
        },
      ],
    },
  },
  {
    id: 'prop-4',
    address: 'Bondgenotenlaan 64',
    city: 'Leuven',
    postalCode: '3000',
    price: 385000,
    type: 'huis',
    rooms: 4,
    bedrooms: 3,
    area: 145,
    plotSize: 200,
    buildYear: 2005,
    energyLabel: 'B',
    status: 'te-koop',
    description: 'Moderne gezinswoning in rustige woonwijk van Leuven. Nabij scholen en winkels.',
    features: [
      'Recente bouw',
      'Tuin',
      'Garage',
      'Zonnepanelen',
      'Open keuken',
    ],
    images: [
      '/modern-dutch-house-exterior.jpg',
      '/modern-living-room.png',
      '/modern-kitchen.png',
      '/spacious-garden.jpg',
    ],
    sellerId: 'v4',
    views: 156,
    visits: [],
    bids: [],
    interested: 7,
    phase: 'online',
    neighborhood: {
      schools: [
        {
          name: 'Basisschool De Klimop',
          type: 'basisonderwijs',
          distance: 500,
          rating: 4.3,
        },
      ],
      sports: [
        {
          name: 'Sportoase Philipssite',
          type: 'Fitness & Zwemmen',
          distance: 1200,
        },
      ],
      transport: [
        {
          type: 'bus',
          line: '2',
          stop: 'Bondgenotenlaan',
          distance: 200,
        },
      ],
      events: [
        {
          name: 'Marktrock',
          frequency: 'Jaarlijks in augustus',
          description: 'Gratis muziekfestival in het centrum',
        },
      ],
    },
  },
  {
    id: 'prop-5',
    address: 'Hoogstraat 179',
    city: 'Hasselt',
    postalCode: '3500',
    price: 425000,
    type: 'appartement',
    rooms: 3,
    bedrooms: 2,
    area: 110,
    buildYear: 2018,
    energyLabel: 'A',
    status: 'te-koop',
    description: 'Modern penthouse appartement met dakterras in het centrum van Hasselt.',
    features: [
      'Dakterras',
      'Lift',
      'Parkeerplaats',
      'Energiezuinig',
      'Centrum locatie',
    ],
    images: [
      '/luxury-apartment-interior.png',
      '/canal-view-balcony.jpg',
      '/modern-kitchen.png',
      '/modern-living-room.png',
    ],
    sellerId: 'v5',
    views: 289,
    visits: [
      {
        id: 'v3',
        date: '2024-01-22',
        buyerId: '3',
        buyerName: 'Jan Peeters',
        feedback: 'Prachtig uitzicht!',
        rating: 5,
      },
    ],
    bids: [],
    interested: 15,
    phase: 'bezichtigingen',
    neighborhood: {
      schools: [
        {
          name: 'Virga Jesse College',
          type: 'middelbaar',
          distance: 800,
          rating: 4.5,
        },
      ],
      sports: [
        {
          name: 'Sportoase Hasselt',
          type: 'Fitness',
          distance: 600,
        },
      ],
      transport: [
        {
          type: 'bus',
          line: '1',
          stop: 'Centrum',
          distance: 100,
        },
        {
          type: 'trein',
          line: 'IC',
          stop: 'Hasselt Station',
          distance: 1200,
        },
      ],
      events: [
        {
          name: 'Pukkelpop',
          frequency: 'Jaarlijks in augustus',
          description: 'Internationaal muziekfestival',
        },
      ],
    },
  },
  {
    id: 'prop-6',
    address: 'Grote Markt 45',
    city: 'Mechelen',
    postalCode: '2800',
    price: 550000,
    type: 'huis',
    rooms: 5,
    bedrooms: 3,
    area: 165,
    buildYear: 1890,
    energyLabel: 'D',
    status: 'te-koop',
    description: 'Authentiek herenhuis aan de Grote Markt van Mechelen. Te renoveren.',
    features: [
      'Monumentaal',
      'Centrum',
      'Hoge plafonds',
      'Originele details',
      'Renovatiepotentieel',
    ],
    images: [
      '/canal-house-amsterdam.jpg',
      '/modern-living-room.png',
      '/modern-kitchen.png',
      '/modern-home-office.png',
      '/spacious-garden.jpg',
    ],
    sellerId: 'v6',
    views: 234,
    visits: [],
    bids: [],
    interested: 9,
    phase: 'online',
    neighborhood: {
      schools: [
        {
          name: 'Koninklijk Atheneum',
          type: 'middelbaar',
          distance: 400,
          rating: 4.6,
        },
      ],
      sports: [
        {
          name: 'Mechelse Tennisclub',
          type: 'Tennis',
          distance: 900,
        },
      ],
      transport: [
        {
          type: 'trein',
          line: 'IC',
          stop: 'Mechelen Centraal',
          distance: 500,
        },
        {
          type: 'bus',
          line: '3',
          stop: 'Grote Markt',
          distance: 50,
        },
      ],
      events: [
        {
          name: 'Maanrock',
          frequency: 'Jaarlijks in augustus',
          description: 'Gratis muziekfestival',
        },
      ],
    },
  },
  {
    id: 'prop-7',
    address: 'Turnhoutsebaan 234',
    city: 'Antwerpen',
    postalCode: '2140',
    price: 675000,
    type: 'villa',
    rooms: 6,
    bedrooms: 4,
    area: 240,
    plotSize: 500,
    buildYear: 1995,
    energyLabel: 'C',
    status: 'te-koop',
    description: 'Ruime villa met zwembad in groene woonwijk van Antwerpen.',
    features: [
      'Zwembad',
      'Grote tuin',
      'Garage voor 2 wagens',
      'Sauna',
      'Thuiskantoor',
    ],
    images: [
      '/luxury-villa-amsterdam.jpg',
      '/spacious-garden.jpg',
      '/modern-home-office.png',
      '/modern-living-room.png',
      '/modern-kitchen.png',
    ],
    sellerId: 'v7',
    views: 412,
    visits: [],
    bids: [],
    interested: 18,
    phase: 'bezichtigingen',
    neighborhood: {
      schools: [
        {
          name: 'International School Antwerp',
          type: 'basisonderwijs',
          distance: 1500,
          rating: 4.8,
        },
      ],
      sports: [
        {
          name: 'Royal Antwerp Golf Club',
          type: 'Golf',
          distance: 2000,
        },
      ],
      transport: [
        {
          type: 'tram',
          line: '7',
          stop: 'Borgerhout',
          distance: 600,
        },
      ],
      events: [
        {
          name: 'Tomorrowland',
          frequency: 'Jaarlijks in juli',
          description: 'Wereldberoemd dancefestival (nabij Boom)',
        },
      ],
    },
  },
  {
    id: 'prop-8',
    address: 'Koningin Astridlaan 88',
    city: 'Genk',
    postalCode: '3600',
    price: 295000,
    type: 'huis',
    rooms: 4,
    bedrooms: 3,
    area: 125,
    plotSize: 180,
    buildYear: 1985,
    energyLabel: 'D',
    status: 'te-koop',
    description: 'Betaalbare gezinswoning met tuin in Genk. Ideaal voor starters.',
    features: [
      'Betaalbaar',
      'Tuin',
      'Garage',
      'Rustige buurt',
      'Nabij scholen',
    ],
    images: [
      '/modern-dutch-house-exterior.jpg',
      '/modern-living-room.png',
      '/spacious-garden.jpg',
      '/modern-kitchen.png',
    ],
    sellerId: 'v8',
    views: 178,
    visits: [],
    bids: [],
    interested: 11,
    phase: 'online',
    neighborhood: {
      schools: [
        {
          name: 'Basisschool De Triangel',
          type: 'basisonderwijs',
          distance: 300,
          rating: 4.2,
        },
      ],
      sports: [
        {
          name: 'Sport Genk',
          type: 'Voetbal',
          distance: 800,
        },
      ],
      transport: [
        {
          type: 'bus',
          line: '15',
          stop: 'Astridlaan',
          distance: 150,
        },
      ],
      events: [
        {
          name: 'Genk on Stage',
          frequency: 'Jaarlijks in zomer',
          description: 'Muziek en cultuur festival',
        },
      ],
    },
  },
  {
    id: 'prop-9',
    address: 'Diestsesteenweg 456',
    city: 'Leuven',
    postalCode: '3010',
    price: 720000,
    type: 'villa',
    rooms: 7,
    bedrooms: 5,
    area: 285,
    plotSize: 600,
    buildYear: 2010,
    energyLabel: 'A',
    status: 'te-koop',
    description: 'Luxe moderne villa met alle comfort. Volledig instapklaar.',
    features: [
      'Zonnepanelen',
      'Warmtepomp',
      'Home cinema',
      'Fitnessruimte',
      'Dubbele garage',
    ],
    images: [
      '/luxury-villa-amsterdam.jpg',
      '/modern-home-office.png',
      '/spacious-garden.jpg',
      '/modern-living-room.png',
      '/modern-kitchen.png',
      '/luxury-apartment-interior.png',
    ],
    sellerId: 'v9',
    views: 267,
    visits: [],
    bids: [],
    interested: 13,
    phase: 'bezichtigingen',
    neighborhood: {
      schools: [
        {
          name: 'Heilig Hart College',
          type: 'middelbaar',
          distance: 1000,
          rating: 4.7,
        },
      ],
      sports: [
        {
          name: 'Tennisclub Heverlee',
          type: 'Tennis',
          distance: 700,
        },
      ],
      transport: [
        {
          type: 'bus',
          line: '4',
          stop: 'Diestsesteenweg',
          distance: 200,
        },
      ],
      events: [
        {
          name: 'Marktrock',
          frequency: 'Jaarlijks',
          description: 'Muziekfestival in centrum Leuven',
        },
      ],
    },
  },
  {
    id: 'prop-10',
    address: 'Vennestraat 12',
    city: 'Tongeren',
    postalCode: '3700',
    price: 340000,
    type: 'huis',
    rooms: 4,
    bedrooms: 3,
    area: 135,
    plotSize: 220,
    buildYear: 2000,
    energyLabel: 'C',
    status: 'te-koop',
    description: 'Gezellige woning in de oudste stad van België. Dicht bij centrum.',
    features: [
      'Centrum nabij',
      'Tuin',
      'Parkeerplaats',
      'Gezellig',
      'Rustige straat',
    ],
    images: [
      '/modern-dutch-house-exterior.jpg',
      '/modern-living-room.png',
      '/modern-kitchen.png',
      '/spacious-garden.jpg',
      '/modern-home-office.png',
    ],
    sellerId: 'v10',
    views: 145,
    visits: [],
    bids: [],
    interested: 6,
    phase: 'online',
    neighborhood: {
      schools: [
        {
          name: 'Vrije Basisschool',
          type: 'basisonderwijs',
          distance: 400,
          rating: 4.4,
        },
      ],
      sports: [
        {
          name: 'Sportoase Tongeren',
          type: 'Fitness',
          distance: 1100,
        },
      ],
      transport: [
        {
          type: 'bus',
          line: '45',
          stop: 'Vennestraat',
          distance: 100,
        },
        {
          type: 'trein',
          line: 'L',
          stop: 'Tongeren Station',
          distance: 800,
        },
      ],
      events: [
        {
          name: 'Antiekmarkt',
          frequency: 'Elke zondag',
          description: 'Bekende antiek en brocante markt',
        },
      ],
    },
  },
]

export function getProperties(): Property[] {
  // Force turbopack recompile
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('vastgoed_properties_v2')
    if (stored) {
      return JSON.parse(stored)
    }
    localStorage.setItem('vastgoed_properties_v2', JSON.stringify(MOCK_PROPERTIES))
  }
  return MOCK_PROPERTIES
}

export function getPropertyById(id: string): Property | undefined {
  return getProperties().find(p => p.id === id)
}

export function getPropertiesBySeller(sellerId: string): Property[] {
  return getProperties().filter(p => p.sellerId === sellerId)
}

export function getAllProperties(): Property[] {
  return getProperties()
}

export function updateProperty(updatedProperty: Property): void {
  const properties = getProperties()
  const index = properties.findIndex(p => p.id === updatedProperty.id)

  if (index !== -1) {
    properties[index] = updatedProperty

    // Also mutate the in-memory array so server-components/initial renders 
    // inside the same JS context continue to see the updated value
    MOCK_PROPERTIES[index] = updatedProperty

    if (typeof window !== 'undefined') {
      localStorage.setItem('vastgoed_properties_v2', JSON.stringify(properties))
    }
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula to calculate distance in kilometers
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Mock coordinates for properties (in real app, would come from geocoding API)
export const PROPERTY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'prop-1': { lat: 52.3667, lng: 4.8945 }, // Amsterdam Centrum
  'prop-2': { lat: 52.3676, lng: 4.8831 }, // Herengracht
  'prop-3': { lat: 52.3547, lng: 4.8824 }, // Amsterdam Zuid
  'prop-4': { lat: 50.8798, lng: 4.7005 }, // Leuven
  'prop-5': { lat: 50.9307, lng: 5.3378 }, // Hasselt
  'prop-6': { lat: 51.0259, lng: 4.4777 }, // Mechelen
  'prop-7': { lat: 51.2194, lng: 4.4025 }, // Antwerpen
  'prop-8': { lat: 50.9658, lng: 5.5009 }, // Genk
  'prop-9': { lat: 50.8798, lng: 4.7005 }, // Leuven
  'prop-10': { lat: 50.7803, lng: 5.4644 }, // Tongeren
}

// Mock coordinates for Belgian cities
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'hasselt': { lat: 50.9307, lng: 5.3378 },
  'leuven': { lat: 50.8798, lng: 4.7005 },
  'antwerpen': { lat: 51.2194, lng: 4.4025 },
  'gent': { lat: 51.0543, lng: 3.7174 },
  'brussel': { lat: 50.8503, lng: 4.3517 },
  'brugge': { lat: 51.2093, lng: 3.2247 },
  'mechelen': { lat: 51.0259, lng: 4.4777 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'rotterdam': { lat: 51.9225, lng: 4.47917 },
  'utrecht': { lat: 52.0907, lng: 5.1214 },
  'genk': { lat: 50.9658, lng: 5.5009 },
  'tongeren': { lat: 50.7803, lng: 5.4644 },
}
