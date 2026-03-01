/**
 * Supabase data layer - works in both client and server.
 * Uses simple createClient for data fetching (anon key).
 */
import { createClient } from '@supabase/supabase-js'
import type { Property, Visit, Bid, NeighborhoodInfo } from './properties'
import type { Appointment } from './agenda'

export type Profile = {
  id: string
  name: string
  email: string
  role: 'makelaar' | 'verkoper' | 'koper'
  propertyId?: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

function dbRowToProperty(row: any): Property {
  return {
    id: row.id,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    price: Number(row.price),
    previousPrice: row.previous_price != null ? Number(row.previous_price) : undefined,
    type: row.type,
    rooms: row.rooms,
    bedrooms: row.bedrooms,
    area: Number(row.area),
    plotSize: row.plot_size != null ? Number(row.plot_size) : undefined,
    buildYear: row.build_year,
    energyLabel: row.energy_label,
    status: row.status,
    description: row.description,
    features: row.features ?? [],
    images: row.images ?? [],
    sellerId: row.seller_id,
    views: row.views ?? 0,
    visits: (row.visits ?? []) as Visit[],
    bids: (row.bids ?? []) as Bid[],
    interested: row.interested ?? 0,
    phase: row.phase,
    neighborhood: (row.neighborhood ?? {}) as NeighborhoodInfo,
    lat: row.lat != null ? Number(row.lat) : undefined,
    lng: row.lng != null ? Number(row.lng) : undefined,
  }
}

function dbRowToUser(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    propertyId: row.property_id ?? undefined,
  }
}

function dbRowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    propertyId: row.property_id ?? undefined,
    participantIds: row.participant_ids ?? [],
    description: row.description ?? undefined,
  }
}

export async function fetchProfiles(): Promise<Profile[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw error
  return (data ?? []).map(dbRowToUser)
}

export async function fetchProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()
  if (error || !data) return null
  return dbRowToUser(data)
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return dbRowToUser(data)
}

export async function fetchProperties(): Promise<Property[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('properties').select('*')
  if (error) throw error
  return (data ?? []).map(dbRowToProperty)
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return dbRowToProperty(data)
}

export async function fetchPropertiesBySeller(sellerId: string): Promise<Property[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('seller_id', sellerId)
  if (error) throw error
  return (data ?? []).map(dbRowToProperty)
}

export async function updatePropertyInDb(property: Property): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('properties')
    .update({
      address: property.address,
      city: property.city,
      postal_code: property.postalCode,
      price: property.price,
      previous_price: property.previousPrice ?? null,
      type: property.type,
      rooms: property.rooms,
      bedrooms: property.bedrooms,
      area: property.area,
      plot_size: property.plotSize ?? null,
      build_year: property.buildYear,
      energy_label: property.energyLabel,
      status: property.status,
      description: property.description,
      features: property.features,
      images: property.images,
      views: property.views,
      visits: property.visits,
      bids: property.bids,
      interested: property.interested,
      phase: property.phase,
      neighborhood: property.neighborhood,
      updated_at: new Date().toISOString(),
    })
    .eq('id', property.id)
  if (error) throw error
}

export async function fetchAppointmentsForUser(userId: string): Promise<Appointment[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .contains('participant_ids', [userId])
  if (error) throw error
  return (data ?? []).map(dbRowToAppointment)
}

export async function fetchAllAppointments(): Promise<Appointment[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('appointments').select('*').order('date')
  if (error) throw error
  return (data ?? []).map(dbRowToAppointment)
}

export async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return null
  return dbRowToAppointment(data)
}

export async function addAppointmentInDb(
  appointment: Omit<Appointment, 'id'>
): Promise<Appointment> {
  const supabase = getSupabase()
  const id = Math.random().toString(36).substr(2, 9)
  const row = {
    id,
    title: appointment.title,
    date: appointment.date,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    property_id: appointment.propertyId ?? null,
    participant_ids: appointment.participantIds,
    description: appointment.description ?? null,
  }
  const { error } = await supabase.from('appointments').insert(row)
  if (error) throw error
  return { ...appointment, id }
}

export async function updateAppointmentInDb(appointment: Appointment): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('appointments')
    .update({
      title: appointment.title,
      date: appointment.date,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      property_id: appointment.propertyId ?? null,
      participant_ids: appointment.participantIds,
      description: appointment.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointment.id)
  if (error) throw error
}

export async function deleteAppointmentInDb(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}
