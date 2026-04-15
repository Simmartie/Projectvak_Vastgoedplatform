import { createClient } from '@supabase/supabase-js';

export interface DeleteAppointmentParams {
    date: string;
    start_time: string;
    address: string;
    participant_name: string;
}

export interface DeleteAppointmentResponse {
    status: 'success' | 'error';
    message: string;
}

export async function deleteAppointment(params: DeleteAppointmentParams): Promise<DeleteAppointmentResponse> {
    console.log(`[deleteAppointment] Processing for property: ${params.address}, participant: ${params.participant_name}, date: ${params.date}, time: ${params.start_time}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[deleteAppointment] Missing Supabase environment variables');
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
            console.error('[deleteAppointment] Property search error or not found:', propertyError);
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
            console.error('[deleteAppointment] User search error or not found:', userError);
            return {
                status: 'error',
                message: `Could not find user matching name: ${params.participant_name}`
            };
        }

        const userId = userData.id;

        // 3. Delete Appointment safely using RPC
        const { error: rpcError } = await supabase.rpc('delete_appointment_safe', {
            p_property_id: propertyId,
            p_user_id: userId,
            p_date: params.date,
            p_start_time: params.start_time
        });

        if (rpcError) {
            console.error('[deleteAppointment] RPC error:', rpcError);
            return {
                status: 'error',
                message: 'There was a technical error during the deletion process. As a failsafe measure, the database has been restored to its original state and nothing has been deleted.'
            };
        }

        return {
            status: 'success',
            message: 'The appointment has been successfully and securely deleted.'
        };

    } catch (err: any) {
        console.error('[deleteAppointment] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while processing the request.'
        };
    }
}
