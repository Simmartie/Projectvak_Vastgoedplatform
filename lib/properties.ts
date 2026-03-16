import { createClient } from '@/utils/supabase/client'
import { NeighborhoodInfo, School, SportsClub, Transport, Event, Visit, Bid } from './properties-types'

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
  // Additional Real Estate Features
  capakey?: string
  kadastraalInkomen?: number
  kadastraleOppervlakte?: number
  schatting?: number
  bouwmisdrijf?: 'Ja' | 'Nee' | 'In regularisatie' | 'Onbekend'
  pScore?: 'A' | 'B' | 'C' | 'D'
  gScore?: 'A' | 'B' | 'C' | 'D'
  bodemattest?: 'Blanco' | 'Niet blanco / Risico' | 'Vrijstelling'
  epcScore?: number
  elektriciteitskeuring?: 'Conform' | 'Niet conform' | 'Geen keuring'
  conformiteitsattest?: 'Ja' | 'Nee' | 'N.v.t.'
  conformiteitsattestGeldigheid?: string
  erfdienstbaarheden?: ('Geen' | 'Nutsleidingen' | 'Recht van doorgang / uitweg' | 'Gemene muur' | 'Andere')[]
  mobiscore?: number
}

// Maps database snake_case to our frontend camelCase
function mapDatabaseProperty(row: any): Property {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    price: row.price,
    previousPrice: row.previous_price,
    type: row.type,
    rooms: row.rooms,
    bedrooms: row.bedrooms,
    area: row.area,
    plotSize: row.plot_size,
    buildYear: row.build_year,
    energyLabel: row.energy_label,
    status: row.status,
    description: row.description,
    features: row.features || [],
    images: row.images || [],
    sellerId: row.users?.mock_id || row.seller_id,
    views: row.views || 0,
    visits: [], // these need to be fetched separately if needed in full depth
    bids: [],   // these need to be fetched separately
    interested: row.interested || 0,
    phase: row.phase,
    neighborhood: row.neighborhood || { schools: [], sports: [], transport: [], events: [] },
    capakey: row.capakey,
    kadastraalInkomen: row.kadastraal_inkomen,
    kadastraleOppervlakte: row.kadastrale_oppervlakte,
    schatting: row.schatting,
    bouwmisdrijf: row.bouwmisdrijf,
    pScore: row.p_score,
    gScore: row.g_score,
    bodemattest: row.bodemattest,
    epcScore: row.epc_score,
    elektriciteitskeuring: row.elektriciteitskeuring,
    conformiteitsattest: row.conformiteitsattest,
    conformiteitsattestGeldigheid: row.conformiteitsattest_geldigheid,
    erfdienstbaarheden: row.erfdienstbaarheden || [],
    mobiscore: row.mobiscore
  }
}

function mapDatabaseVisit(row: any): Visit {
  return {
    id: row.id,
    date: row.date || row.created_at,
    buyerId: row.users?.mock_id || row.buyer_id,
    buyerName: row.users?.name || 'Onbekende koper',
    feedback: row.feedback,
    rating: row.rating,
    feedback_suggestion: row.feedback_suggestion,
    rating_suggestion: row.rating_suggestion
  }
}

function mapDatabaseBid(row: any): Bid {
  return {
    id: row.id,
    amount: row.amount,
    buyerId: row.users?.mock_id || row.buyer_id,
    buyerName: row.users?.name || 'Onbekende koper',
    date: row.created_at || row.date,
    status: row.status,
    comments: row.comments,
    amount_suggestion: row.amount_suggestion,
    status_suggestion: row.status_suggestion,
    comment_suggestion: row.comment_suggestion
  }
}

export const getProperties = async (): Promise<Property[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      visits ( *, users:buyer_id ( mock_id, name ) ),
      bids ( *, users:buyer_id ( mock_id, name ) ),
      users:seller_id ( mock_id )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return data.map((row: any) => {
    const mapped = mapDatabaseProperty(row)
    mapped.visits = (row.visits || []).map(mapDatabaseVisit)
    mapped.bids = (row.bids || []).map(mapDatabaseBid)
    return mapped
  })
}

export const getPropertyById = async (id: string): Promise<Property | undefined> => {
  if (!id || id === 'null' || id === 'undefined') {
    return undefined
  }

  const supabase = createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  const { data: propData, error } = await supabase
    .from('properties')
    .select(`
      *,
      visits ( *, users:buyer_id ( mock_id, name ) ),
      bids ( *, users:buyer_id ( mock_id, name ) ),
      users:seller_id ( mock_id )
    `)
    .or(isUuid ? `id.eq.${id},mock_id.eq.${id}` : `mock_id.eq.${id}`)
    .single()

  if (error || !propData) {
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error fetching property by ID:', error)
    }
    return undefined
  }

  const mappedProp = mapDatabaseProperty(propData)

  // Attach bids and visits
  mappedProp.visits = (propData.visits || []).map(mapDatabaseVisit)
  mappedProp.bids = (propData.bids || []).map(mapDatabaseBid)

  return mappedProp
}

export const getPropertiesBySeller = async (sellerId: string): Promise<Property[]> => {
  const supabase = createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerId)

  let actualSellerId = sellerId

  if (!isUuid) {
    const { data: userData } = await supabase.from('users').select('id').eq('mock_id', sellerId).single()
    if (userData) {
      actualSellerId = userData.id
    } else {
      return []
    }
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      visits ( *, users:buyer_id ( mock_id, name ) ),
      bids ( *, users:buyer_id ( mock_id, name ) ),
      users:seller_id ( mock_id )
    `)
    .eq('seller_id', actualSellerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties by seller:', error)
    return []
  }

  return data.map((row: any) => {
    const mapped = mapDatabaseProperty(row)
    mapped.visits = (row.visits || []).map(mapDatabaseVisit)
    mapped.bids = (row.bids || []).map(mapDatabaseBid)
    return mapped
  })
}

export async function updateProperty(updatedProperty: Partial<Property> & { id: string }): Promise<void> {
  const supabase = createClient()

  const updateData: any = {}
  if (updatedProperty.address !== undefined) updateData.address = updatedProperty.address
  if (updatedProperty.city !== undefined) updateData.city = updatedProperty.city
  if (updatedProperty.postalCode !== undefined) updateData.postal_code = updatedProperty.postalCode
  if (updatedProperty.price !== undefined) updateData.price = updatedProperty.price
  if (updatedProperty.previousPrice !== undefined) updateData.previous_price = updatedProperty.previousPrice
  if (updatedProperty.type !== undefined) updateData.type = updatedProperty.type
  if (updatedProperty.rooms !== undefined) updateData.rooms = updatedProperty.rooms
  if (updatedProperty.bedrooms !== undefined) updateData.bedrooms = updatedProperty.bedrooms
  if (updatedProperty.area !== undefined) updateData.area = updatedProperty.area
  if (updatedProperty.plotSize !== undefined) updateData.plot_size = updatedProperty.plotSize
  if (updatedProperty.buildYear !== undefined) updateData.build_year = updatedProperty.buildYear
  if (updatedProperty.energyLabel !== undefined) updateData.energy_label = updatedProperty.energyLabel
  if (updatedProperty.status !== undefined) updateData.status = updatedProperty.status
  if (updatedProperty.description !== undefined) updateData.description = updatedProperty.description
  if (updatedProperty.features !== undefined) updateData.features = updatedProperty.features
  if (updatedProperty.images !== undefined) updateData.images = updatedProperty.images
  if (updatedProperty.views !== undefined) updateData.views = updatedProperty.views
  if (updatedProperty.interested !== undefined) updateData.interested = updatedProperty.interested
  if (updatedProperty.phase !== undefined) updateData.phase = updatedProperty.phase
  if (updatedProperty.neighborhood !== undefined) updateData.neighborhood = updatedProperty.neighborhood
  if (updatedProperty.capakey !== undefined) updateData.capakey = updatedProperty.capakey
  if (updatedProperty.kadastraalInkomen !== undefined) updateData.kadastraal_inkomen = updatedProperty.kadastraalInkomen
  if (updatedProperty.kadastraleOppervlakte !== undefined) updateData.kadastrale_oppervlakte = updatedProperty.kadastraleOppervlakte
  if (updatedProperty.schatting !== undefined) updateData.schatting = updatedProperty.schatting
  if (updatedProperty.bouwmisdrijf !== undefined) updateData.bouwmisdrijf = updatedProperty.bouwmisdrijf
  if (updatedProperty.pScore !== undefined) updateData.p_score = updatedProperty.pScore
  if (updatedProperty.gScore !== undefined) updateData.g_score = updatedProperty.gScore
  if (updatedProperty.bodemattest !== undefined) updateData.bodemattest = updatedProperty.bodemattest
  if (updatedProperty.epcScore !== undefined) updateData.epc_score = updatedProperty.epcScore
  if (updatedProperty.elektriciteitskeuring !== undefined) updateData.elektriciteitskeuring = updatedProperty.elektriciteitskeuring
  if (updatedProperty.conformiteitsattest !== undefined) updateData.conformiteitsattest = updatedProperty.conformiteitsattest
  if (updatedProperty.conformiteitsattestGeldigheid !== undefined) updateData.conformiteitsattest_geldigheid = updatedProperty.conformiteitsattestGeldigheid
  if (updatedProperty.erfdienstbaarheden !== undefined) updateData.erfdienstbaarheden = updatedProperty.erfdienstbaarheden
  if (updatedProperty.mobiscore !== undefined) updateData.mobiscore = updatedProperty.mobiscore

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedProperty.id)
  let query = supabase.from('properties').update(updateData)

  const { error } = await (isUuid
    ? query.eq('id', updatedProperty.id)
    : query.eq('mock_id', updatedProperty.id))

  if (error) {
    console.error('Error updating property:', error)
    throw new Error(error.message)
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
  'prop-11': { lat: 50.8244, lng: 4.3642 }, // Brussel
  'prop-12': { lat: 51.0538, lng: 3.7223 }, // Gent
  'prop-13': { lat: 51.2065, lng: 3.2244 }, // Brugge
  'prop-14': { lat: 52.0913, lng: 5.1209 }, // Utrecht
  'prop-15': { lat: 51.9069, lng: 4.4754 }, // Rotterdam
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
