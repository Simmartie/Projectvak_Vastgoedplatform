import { createClient } from '@supabase/supabase-js';

export interface ModifyAppointmentParams {
    original_date: string;
    original_address: string;
    participant_name: string;
    new_date: string;
    new_start_time: string;
    new_end_time: string;
}

export interface ModifyAppointmentResponse {
    status: 'success' | 'error';
    message: string;
    data?: any;
}

export async function modifyAppointment(params: ModifyAppointmentParams): Promise<ModifyAppointmentResponse> {
    console.log(`[modifyAppointment] Processing modification for property: ${params.original_address}, user: ${params.participant_name}, date: ${params.original_date}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[modifyAppointment] Missing Supabase environment variables');
            return {
                status: 'error',
                message: 'Internal configuration error.'
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Search Property
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .select('id, address')
            .ilike('address', `%${params.original_address}%`)
            .limit(1)
            .single();

        if (propertyError || !propertyData) {
            console.error('[modifyAppointment] Property search error or not found:', propertyError);
            return {
                status: 'error',
                message: `Could not find property matching address: ${params.original_address}`
            };
        }

        const propertyId = propertyData.id;

        // 2. Search User (Participant)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .ilike('name', `%${params.participant_name}%`)
            .limit(1)
            .single();

        if (userError || !userData) {
            console.error('[modifyAppointment] User search error or not found:', userError);
            return {
                status: 'error',
                message: `Could not find user matching name: ${params.participant_name}`
            };
        }

        const userId = userData.id;

        // 3. Search Original Appointment (CRITICAL STEP)
        // First, get all appointments for this property on the original date
        const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('id')
            .eq('property_id', propertyId)
            .eq('date', params.original_date);

        if (appointmentsError || !appointmentsData || appointmentsData.length === 0) {
            console.error('[modifyAppointment] No appointments found for property and date:', appointmentsError);
            return {
                status: 'error',
                message: `Could not find any appointments for this property on ${params.original_date}.`
            };
        }

        const appointmentIds = appointmentsData.map(a => a.id);

        // Verify which of these appointments is linked to this specific user
        const { data: participantData, error: participantError } = await supabase
            .from('appointment_participants')
            .select('appointment_id')
            .in('appointment_id', appointmentIds)
            .eq('user_id', userId);

        if (participantError || !participantData || participantData.length === 0) {
            console.error('[modifyAppointment] No matching appointment for this user:', participantError);
            return {
                status: 'error',
                message: `We found visits on ${params.original_date}, but none are linked to user ${params.participant_name}.`
            };
        }

        if (participantData.length > 1) {
            console.error('[modifyAppointment] Multiple appointments found for the user on the given date');
            return {
                status: 'error',
                message: `Multiple appointments found for ${params.participant_name} on ${params.original_date}. Cannot safely isolate a single appointment to modify.`
            };
        }

        const exactAppointmentId = participantData[0].appointment_id;

        // 4. Update Data
        const { data: updateData, error: updateError } = await supabase
            .from('appointments')
            .update({
                date: params.new_date,
                start_time: params.new_start_time,
                end_time: params.new_end_time
            })
            .eq('id', exactAppointmentId)
            .select('id, date, start_time, end_time')
            .single();

        if (updateError || !updateData) {
            console.error('[modifyAppointment] Update appointment error:', updateError);
            return {
                status: 'error',
                message: 'Failed to update the appointment details.'
            };
        }

        return {
            status: 'success',
            message: `Successfully modified the appointment to ${params.new_date} from ${params.new_start_time} to ${params.new_end_time}.`,
            data: {
                appointment_id: exactAppointmentId,
                updated_date: updateData.date,
                updated_start_time: updateData.start_time,
                updated_end_time: updateData.end_time
            }
        };

    } catch (err: any) {
        console.error('[modifyAppointment] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while processing the appointment modification.'
        };
    }
}
