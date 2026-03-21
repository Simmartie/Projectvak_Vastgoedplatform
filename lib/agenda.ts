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

export async function processPastAppointments() {
  // If running in the browser (client-side), delay execution by 2 seconds.
  // This prevents an SSR-Hydration race condition where the Server and Client
  // simultaneously run this logic and both insert duplicate visits because
  // the server's DB transaction hasn't become visible to the client yet.
  if (typeof window !== 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  try {
    const { MOCK_USERS } = await import('@/lib/auth');
  
    // Get all appointments
    const { data: appointmentsData, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        end_time,
        property_id,
        appointment_participants (
          users ( id, mock_id )
        )
      `);

    if (apptError || !appointmentsData) {
      console.error("APP_PROCESS: Failed to fetch appointments", apptError);
      return;
    }

    // Use Europe/Brussels timezone to format the current time as a local ISO string for comparison
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const nowStr = formatter.format(new Date()).replace(' ', 'T');

    for (const appt of appointmentsData) {
      if (!appt.property_id || !appt.date || !appt.end_time) continue;

      const endDateTimeLiteral = `${appt.date}T${appt.end_time}`;
      
      // Check if the appointment is in the past using timezone-agnostic string comparison
      if (endDateTimeLiteral < nowStr) {
        // Find buyer among participants
        let buyerId = null;
        if (appt.appointment_participants) {
          for (const p of appt.appointment_participants) {
            const mockId = (p as any).users?.mock_id;
            const userDbId = (p as any).users?.id;
            if (mockId) {
              const user = MOCK_USERS.find((u: any) => u.id === mockId);
              if (user && user.role === 'koper') {
                buyerId = userDbId;
                break;
              }
            }
          }
        }

        // Check if visit already exists for this appointment
        let query = supabase
          .from('visits')
          .select('id')
          .eq('property_id', appt.property_id)
          .eq('date', endDateTimeLiteral);

        if (buyerId) {
          query = query.eq('buyer_id', buyerId);
        } else {
          query = query.is('buyer_id', null);
        }

        const { data: existingVisits, error: visitCheckError } = await query.limit(1);

        if (!visitCheckError && (!existingVisits || existingVisits.length === 0)) {
          // Create visit
          const { error: visitError } = await supabase
            .from('visits')
            .insert({
              property_id: appt.property_id,
              buyer_id: buyerId || null,
              date: endDateTimeLiteral
            });

          if (visitError) {
             console.error('APP_PROCESS: Error creating visit:', visitError);
          }
        }
      }
    }
  } catch (err) {
    console.error("APP_PROCESS: Exception:", err);
  }
}

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
  // Execute in background without blocking the UI fetch, as appointments are no longer completely deleted
  processPastAppointments().catch(console.error);

  // First get appointment IDs for the user
  const { data: participantData, error: partError } = await supabase
    .from('appointment_participants')
    .select(`
      appointment_id,
      users!inner (mock_id)
    `)
    .eq('users.mock_id', userId);

  if (partError) {
    console.error('Error fetching appointment IDs for user:', partError);
    return [];
  }

  const appointmentIds = participantData?.map(p => p.appointment_id) || [];

  if (appointmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      properties ( id, mock_id ),
      appointment_participants (
        users ( mock_id )
      )
    `)
    .in('id', appointmentIds);

  if (error) {
    console.error('Error fetching appointments for user:', error);
    return [];
  }

  return (data || []).map(mapDbAppointment);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  // Execute in background
  processPastAppointments().catch(console.error);

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
