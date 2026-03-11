import { createClient } from '@/utils/supabase/client';

export interface Appointment {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  propertyId?: string
  participantIds: string[]
  description?: string
  mock_id?: string
}

const supabase = createClient();

// Keep for type compatibility in other files until they are removed, but they shouldn't be used now.
export const MOCK_APPOINTMENTS: Appointment[] = [];

// Helper to map DB record to app Appointment type
function mapDbAppointment(dbRecord: any): Appointment {
  // DB snake_case to app camelCase
  return {
    id: dbRecord.id,
    title: dbRecord.title,
    date: dbRecord.date,
    startTime: dbRecord.start_time.substring(0, 5), // 'HH:MM:SS' to 'HH:MM'
    endTime: dbRecord.end_time.substring(0, 5), // 'HH:MM:SS' to 'HH:MM'
    propertyId: dbRecord.properties?.id || dbRecord.properties?.mock_id || undefined,
    description: dbRecord.description || undefined,
    mock_id: dbRecord.mock_id || undefined,
    participantIds: dbRecord.appointment_participants?.map((p: any) => p.users?.mock_id).filter(Boolean) || []
  }
}

export async function getAppointmentsForUser(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      properties ( id, mock_id ),
      appointment_participants!inner (
        users!inner ( mock_id )
      )
    `)
    .eq('appointment_participants.users.mock_id', userId);

  if (error) {
    console.error('Error fetching appointments for user:', error);
    return [];
  }

  return (data || []).map(mapDbAppointment);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      properties ( id, mock_id ),
      appointment_participants (
        users ( mock_id )
      )
    `);

  if (error) {
    console.error('Error fetching all appointments:', error);
    return [];
  }

  return (data || []).map(mapDbAppointment);
}

export async function addAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment | null> {
  let propertyUuid: string | null = null;
  if (appointment.propertyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointment.propertyId);
    if (isUuid) {
      propertyUuid = appointment.propertyId;
    } else {
      const { data: propData } = await supabase.from('properties').select('id').eq('mock_id', appointment.propertyId).single();
      if (propData) propertyUuid = propData.id;
    }
  }

  const { data: insertedAppt, error: apptError } = await supabase
    .from('appointments')
    .insert({
      title: appointment.title,
      date: appointment.date,
      start_time: `${appointment.startTime}:00`,
      end_time: `${appointment.endTime}:00`,
      property_id: propertyUuid,
      description: appointment.description || null
    })
    .select()
    .single();

  if (apptError) {
    console.error('Error adding appointment:', apptError);
    return null;
  }

  // Insert participants if any
  if (appointment.participantIds && appointment.participantIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, mock_id')
      .in('mock_id', appointment.participantIds);

    if (usersData && usersData.length > 0) {
      const participantsData = usersData.map(u => ({
        appointment_id: insertedAppt.id,
        user_id: u.id
      }));

      const { error: partError } = await supabase
        .from('appointment_participants')
        .insert(participantsData);

      if (partError) {
        console.error('Error adding appointment participants:', partError);
      }
    }
  }

  // Fetch the full newly created appointment to return
  const { data: fullAppt, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      *,
      properties ( id, mock_id ),
      appointment_participants (
        users ( mock_id )
      )
    `)
    .eq('id', insertedAppt.id)
    .single();

  if (fetchError) {
    console.error('Error fetching created appointment:', fetchError);
    // Fallback: return what we know + what we inserted
    return { ...appointment, id: insertedAppt.id };
  }

  return mapDbAppointment(fullAppt);
}

export async function updateAppointment(updatedAppointment: Appointment): Promise<Appointment | null> {
  let propertyUuid: string | null = null;
  if (updatedAppointment.propertyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedAppointment.propertyId);
    if (isUuid) {
      propertyUuid = updatedAppointment.propertyId;
    } else {
      const { data: propData } = await supabase.from('properties').select('id').eq('mock_id', updatedAppointment.propertyId).single();
      if (propData) propertyUuid = propData.id;
    }
  }

  // Update appointment details
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      title: updatedAppointment.title,
      date: updatedAppointment.date,
      start_time: `${updatedAppointment.startTime}:00`,
      end_time: `${updatedAppointment.endTime}:00`,
      property_id: propertyUuid,
      description: updatedAppointment.description || null
    })
    .eq('id', updatedAppointment.id);

  if (updateError) {
    console.error('Error updating appointment:', updateError);
    return null;
  }

  // For participants, easiest approach is delete all and re-insert
  const { error: deletePartsError } = await supabase
    .from('appointment_participants')
    .delete()
    .eq('appointment_id', updatedAppointment.id);

  if (deletePartsError) {
    console.error('Error deleting old participants:', deletePartsError);
  } else if (updatedAppointment.participantIds && updatedAppointment.participantIds.length > 0) {
    // Re-insert
    const { data: usersData } = await supabase
      .from('users')
      .select('id, mock_id')
      .in('mock_id', updatedAppointment.participantIds);

    if (usersData && usersData.length > 0) {
      const participantsData = usersData.map(u => ({
        appointment_id: updatedAppointment.id,
        user_id: u.id
      }));

      const { error: insertPartsError } = await supabase
        .from('appointment_participants')
        .insert(participantsData);

      if (insertPartsError) {
        console.error('Error re-inserting participants:', insertPartsError);
      }
    }
  }

  // Fetch full updated appointment
  const { data: fullAppt, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      *,
      properties ( id, mock_id ),
      appointment_participants (
        users ( mock_id )
      )
    `)
    .eq('id', updatedAppointment.id)
    .single();

  if (fetchError) {
    console.error('Error fetching updated appointment:', fetchError);
    return updatedAppointment;
  }

  return mapDbAppointment(fullAppt);
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting appointment:', error);
  }
}
