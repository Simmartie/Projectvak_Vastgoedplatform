import { createClient } from '@supabase/supabase-js';

export interface GetAgendaParams {
    startDate: string; // Format: YYYY-MM-DD
    endDate: string;   // Format: YYYY-MM-DD
}

export interface GetAgendaResponse {
    status: 'success' | 'error';
    message: string;
    data?: any[];
}

export async function getAgenda(params: GetAgendaParams): Promise<GetAgendaResponse> {
    console.log(`[getAgenda] Fetching agenda from ${params.startDate} to ${params.endDate}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[getAgenda] Missing Supabase environment variables');
            return {
                status: 'error',
                message: 'Internal configuration error.'
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // MOCK: Hardcoded makelaar_id since the webhook won't provide it yet.
        // We will replace this with the real authenticated user_id later.
        const mockMakelaarId = '5decc31f-59c3-45da-b165-c77ba0ae6c38'; // Dit is de UUID van de makelaar Jan Janssen.

        // Fetch appointments that fall within or overlap the startDate and endDate
        // Joined with appointment_participants to filter by the makelaar's user_id
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                title,
                date,
                start_time,
                end_time,
                description,
                property_id,
                appointment_participants!inner (
                    user_id
                )
            `)
            .gte('date', params.startDate)
            .lte('date', params.endDate)
            // The query below filters by the mock makelaar_id.
            // Be mindful that since this is a mock UUID, it will return 0 results unless seeded in DB.
            // You can temporarily comment the line below out if you just want to test fetching all appointments.
            .eq('appointment_participants.user_id', mockMakelaarId)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('[getAgenda] Supabase query error:', error);
            return {
                status: 'error',
                message: 'Failed to access agenda database.'
            };
        }

        // Clean up the JSON output to make it flat and easy for ElevenLabs to read
        const cleanData = data?.map((appt: any) => ({
            id: appt.id,
            title: appt.title,
            date: appt.date,
            startTime: appt.start_time,
            endTime: appt.end_time,
            description: appt.description,
            propertyId: appt.property_id
        })) || [];

        return {
            status: 'success',
            message: `Successfully retrieved ${cleanData.length} appointment(s).`,
            data: cleanData
        };

    } catch (err: any) {
        console.error('[getAgenda] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while fetching the agenda.'
        };
    }
}
