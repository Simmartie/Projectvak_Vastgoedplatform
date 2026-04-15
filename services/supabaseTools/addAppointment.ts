import { createClient } from '@supabase/supabase-js';

export interface AddAppointmentParams {
    date: string;
    start_time: string;
    end_time: string;
    address: string;
    participant_name: string;
}

export interface AddAppointmentResponse {
    status: 'success' | 'error';
    message: string;
    data?: any;
}

export async function addAppointment(params: AddAppointmentParams): Promise<AddAppointmentResponse> {
    console.log(`[addAppointment] Processing for property: ${params.address}, participant: ${params.participant_name}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[addAppointment] Missing Supabase environment variables');
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
            .ilike('address', `%${params.address}%`)
            .limit(1)
            .single();

        if (propertyError || !propertyData) {
            console.error('[addAppointment] Property search error or not found:', propertyError);
            return {
                status: 'error',
                message: `Could not find property matching address: ${params.address}`
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
            console.error('[addAppointment] User search error or not found:', userError);
            return {
                status: 'error',
                message: `Could not find user matching name: ${params.participant_name}`
            };
        }

        const userId = userData.id;

        // 3. Insert Appointment
        const title = `Bezichtiging ${propertyData.address} ${userData.name}`;
        const { data: appointmentData, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
                property_id: propertyId,
                date: params.date,
                start_time: params.start_time,
                end_time: params.end_time,
                title: title
            })
            .select('id')
            .single();

        if (appointmentError || !appointmentData) {
            console.error('[addAppointment] Insert appointment error:', appointmentError);
            return {
                status: 'error',
                message: 'Failed to create new appointment.'
            };
        }

        const appointmentId = appointmentData.id;

        // 4. Insert Relational Record (Junction Table)
        const { error: participationError } = await supabase
            .from('appointment_participants')
            .insert({
                appointment_id: appointmentId,
                user_id: userId
            });

        if (participationError) {
            console.error('[addAppointment] Insert participation error:', participationError);
            // We successfully created the appointment, but failed to link the participant.
            // Depending on strictness, we might still want to fail or just report it.
            return {
                status: 'error',
                message: 'Appointment created, but failed to link participant.'
            };
        }

        return {
            status: 'success',
            message: 'Successfully added new appointment and linked participant.',
            data: {
                appointment_id: appointmentId,
                property_id: propertyId,
                user_id: userId
            }
        };

    } catch (err: any) {
        console.error('[addAppointment] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while adding the appointment.'
        };
    }
}
