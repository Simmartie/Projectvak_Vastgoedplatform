/**
 * Seed Supabase with mock data from lib/auth, lib/properties, lib/agenda.
 * Mock data stays in those files - this script only COPIES to Supabase.
 *
 * Run: npm run db:seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { config } from 'dotenv'

config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { MOCK_USERS } from '../lib/auth'
import {
  MOCK_PROPERTIES,
  PROPERTY_COORDINATES,
  CITY_COORDINATES,
} from '../lib/properties'
import { MOCK_APPOINTMENTS } from '../lib/agenda'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing env vars. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Seeding Supabase with mock data...\n')

  // 1. Profiles (users)
  console.log('Inserting profiles...')
  const profileRows = MOCK_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    property_id: u.propertyId ?? null,
  }))
  const { error: errProfiles } = await supabase.from('profiles').upsert(profileRows, {
    onConflict: 'id',
  })
  if (errProfiles) {
    console.error('Profiles error:', errProfiles)
    process.exit(1)
  }
  console.log(`  Inserted ${profileRows.length} profiles.\n`)

  // 2. Properties
  console.log('Inserting properties...')
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  const propertyRows = MOCK_PROPERTIES.map((p) => {
    const coords = PROPERTY_COORDINATES[p.id]
    return {
      id: p.id,
      seller_id: p.sellerId,
      address: p.address,
      city: p.city,
      postal_code: p.postalCode,
      price: p.price,
      previous_price: p.previousPrice ?? null,
      type: p.type,
      rooms: p.rooms,
      bedrooms: p.bedrooms,
      area: p.area,
      plot_size: p.plotSize ?? null,
      build_year: p.buildYear,
      energy_label: p.energyLabel,
      status: p.status,
      description: p.description,
      features: p.features,
      images: p.images,
      views: p.views,
      visits: p.visits,
      bids: p.bids,
      interested: p.interested,
      phase: p.phase,
      neighborhood: p.neighborhood,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }
  })
  const { error: errProps } = await supabase.from('properties').upsert(propertyRows, {
    onConflict: 'id',
  })
  if (errProps) {
    console.error('Properties error:', errProps)
    process.exit(1)
  }
  console.log(`  Inserted ${propertyRows.length} properties.\n`)

  // 3. Appointments (use fixed dates for reproducibility)
  console.log('Inserting appointments...')
  const appointmentRows = MOCK_APPOINTMENTS.map((a, i) => {
    const dates = [today, tomorrow, dayAfter]
    const date = dates[i] ?? today
    return {
      id: a.id,
      title: a.title,
      date,
      start_time: a.startTime,
      end_time: a.endTime,
      property_id: a.propertyId ?? null,
      participant_ids: a.participantIds,
      description: a.description ?? null,
    }
  })
  const { error: errAppts } = await supabase.from('appointments').upsert(appointmentRows, {
    onConflict: 'id',
  })
  if (errAppts) {
    console.error('Appointments error:', errAppts)
    process.exit(1)
  }
  console.log(`  Inserted ${appointmentRows.length} appointments.\n`)

  // 4. City coordinates
  console.log('Inserting city coordinates...')
  const cityRows = Object.entries(CITY_COORDINATES).map(([cityKey, { lat, lng }]) => ({
    city_key: cityKey,
    lat,
    lng,
  }))
  const { error: errCities } = await supabase.from('city_coordinates').upsert(cityRows, {
    onConflict: 'city_key',
  })
  if (errCities) {
    console.error('City coordinates error:', errCities)
    process.exit(1)
  }
  console.log(`  Inserted ${cityRows.length} city coordinates.\n`)

  console.log('Seed completed successfully.')
}

seed()
