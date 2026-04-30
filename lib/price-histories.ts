import { createClient } from '@/utils/supabase/client'

export interface PriceHistory {
  id: string
  property_id: string
  old_price: number
  new_price: number
  changed_at: string
}

export async function getPriceHistories(propertyId: string): Promise<PriceHistory[]> {
  if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
    return []
  }

  const supabase = createClient()
  
  // Resolve mock_id to real UUID if necessary
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
  let actualPropertyId = propertyId

  if (!isUuid) {
    const { data: propData } = await supabase
      .from('properties')
      .select('id')
      .eq('mock_id', propertyId)
      .single()
    if (propData) {
      actualPropertyId = propData.id
    } else {
      return []
    }
  }

  const { data, error } = await supabase
    .from('price_histories')
    .select('*')
    .eq('property_id', actualPropertyId)
    .order('changed_at', { ascending: false })

  if (error) {
    console.error('Error fetching price histories:', error)
    return []
  }

  return data as PriceHistory[]
}

export async function addPriceHistory(propertyId: string, oldPrice: number, newPrice: number): Promise<PriceHistory | null> {
  if (!propertyId || propertyId === 'null' || propertyId === 'undefined') {
    return null
  }

  const supabase = createClient()

  // Resolve mock_id to real UUID if necessary
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
  let actualPropertyId = propertyId

  if (!isUuid) {
    const { data: propData } = await supabase
      .from('properties')
      .select('id')
      .eq('mock_id', propertyId)
      .single()
    if (propData) {
      actualPropertyId = propData.id
    } else {
      return null
    }
  }

  const { data, error } = await supabase
    .from('price_histories')
    .insert({
      property_id: actualPropertyId,
      old_price: oldPrice,
      new_price: newPrice
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding price history:', error)
    throw new Error(error.message)
  }

  return data as PriceHistory
}
