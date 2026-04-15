import { NextResponse } from 'next/server';
import { modifyAppointment } from '@/services/supabaseTools/modifyAppointment';

export async function POST(req: Request) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get('x-api-key');
        if (authHeader !== process.env.ELEVENLABS_WEBHOOK_SECRET) {
            console.error('[modify_appointment] Unauthorized access attempt: Invalid or missing API key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Payload Extraction
        const body = await req.json();
        const {
            original_date,
            original_address,
            participant_name,
            new_date,
            new_start_time,
            new_end_time
        } = body;

        // 3. Validation
        const missingFields = [];
        if (!original_date) missingFields.push('original_date');
        if (!original_address) missingFields.push('original_address');
        if (!participant_name) missingFields.push('participant_name');
        if (!new_date) missingFields.push('new_date');
        if (!new_start_time) missingFields.push('new_start_time');
        if (!new_end_time) missingFields.push('new_end_time');

        if (missingFields.length > 0) {
            console.error(`[modify_appointment] Bad Request: Missing required fields: ${missingFields.join(', ')}`);
            return NextResponse.json(
                {
                    status: 'error',
                    message: `Bad Request: Missing required fields: ${missingFields.join(', ')}`
                },
                { status: 400 }
            );
        }

        // 4. Execution
        const result = await modifyAppointment({
            original_date,
            original_address,
            participant_name,
            new_date,
            new_start_time,
            new_end_time
        });

        // 5. Response
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[modify_appointment] Unexpected server error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
