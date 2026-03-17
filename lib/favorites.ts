import { createClient } from '@/utils/supabase/client'
import { Property, getPropertyById } from './properties'

export interface Favorite {
  user_id: string
  property_id: string
  created_at: string
}

/**
 * Gets the IDs of all properties a user has favorited.
 */
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const supabase = createClient()

  // First get the real UUID for the user just in case mock_id is passed
  let actualUserId = userId
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  
  if (!isUuid) {
    const { data: userData } = await supabase.from('users').select('id').eq('mock_id', userId).single()
    if (userData) {
      actualUserId = userData.id
    } else {
        return []
    }
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('property_id')
    .eq('user_id', actualUserId)

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  return data.map((f: any) => f.property_id)
}

/**
 * Gets all properties a user has favorited (the full Property objects).
 */
export async function getFavoritesForUser(userId: string): Promise<Property[]> {
  const supabase = createClient()
  
  let actualUserId = userId
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  
  if (!isUuid) {
    const { data: userData } = await supabase.from('users').select('id').eq('mock_id', userId).single()
    if (userData) {
      actualUserId = userData.id
    } else {
        return []
    }
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      property_id,
      properties (
        *,
        visits ( *, users:buyer_id ( mock_id, name ) ),
        bids ( *, users:buyer_id ( mock_id, name ) ),
        users:seller_id ( mock_id )
      )
    `)
    .eq('user_id', actualUserId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Error fetching favorite properties:', error)
    return []
  }

  // Use the mapping functions from properties.ts indirectly or re-map. 
  // Since we don't have direct access to mapDatabaseProperty from properties.ts without exporting it,
  // the easiest way is to map the raw fetch results to Property. 
  // We can just rely on the IDs and re-fetch, but that's n+1. 
  // Let's manually reconstruct the objects, or export mapDatabaseProperty from properties.ts.
  const props: Property[] = [];
  
  for (const item of data) {
     if (item.properties) {
         // Getting type consistency is tricky since mapDatabaseProperty isn't exported.
         // We'll use getPropertyById sequentially for simplicity and exact type matching.
         // For a large app this would be optimized, but here we expect < 100 favorites.
         const p = await getPropertyById(item.property_id);
         if (p) props.push(p);
     }
  }

  return props
}

/**
 * Toggles a property favorite on or off for a user.
 * Returns true if the property is now favorited, false otherwise.
 */
export async function toggleFavorite(userId: string, propertyId: string, isFavorited: boolean): Promise<boolean> {
  const supabase = createClient()

  let actualUserId = userId
  let actualPropertyId = propertyId
  
  const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  if (!isUserUuid) {
    const { data: userData } = await supabase.from('users').select('id').eq('mock_id', userId).single()
    if (userData) actualUserId = userData.id
    else return isFavorited
  }

  const isPropUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
  if (!isPropUuid) {
    const { data: propData } = await supabase.from('properties').select('id').eq('mock_id', propertyId).single()
    if (propData) actualPropertyId = propData.id
    else return isFavorited
  }

  if (isFavorited) {
    // Remove favorite
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .match({ user_id: actualUserId, property_id: actualPropertyId })

    if (error) {
       console.error('Error removing favorite:', error)
       return true
    }
    return false
  } else {
    // Add favorite
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: actualUserId, property_id: actualPropertyId })

    if (error && error.code !== '23505') { // Ignore unique violation if already favorited
       console.error('Error adding favorite:', error)
       return false
    }
    return true
  }
}
