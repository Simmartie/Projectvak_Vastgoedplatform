import { NextResponse } from 'next/server';
import { deleteAppointment } from '@/services/supabaseTools/deleteAppointment';

export async function POST(req: Request) {
    try {
        console.log("Ping! Request ontvangen op delete_appointment");

        // ---------------------------------------------------------------------------
        // Step 1: Security check - Verify Authorization Header (x-api-key)
        // ---------------------------------------------------------------------------
        const authHeader = req.headers.get('x-api-key');
        const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

        if (!secret) {
            console.warn('ELEVENLABS_WEBHOOK_SECRET is not set in environment variables');
        }

        if (authHeader !== secret) {
            return NextResponse.json(
                { error: 'Unauthorized. Invalid or missing x-api-key header.' },
                { status: 401 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 2: Extract payload
        // ---------------------------------------------------------------------------
        const body = await req.json();
        console.log("Payload from ElevenLabs (delete_appointment):", body);

        // Required implicitly from ElevenLabs payload
        const { date, start_time, address, participant_name } = body;

        // ---------------------------------------------------------------------------
        // Step 3: Validation
        // ---------------------------------------------------------------------------
        const missingFields = [];
        if (!date) missingFields.push('date');
        if (!start_time) missingFields.push('start_time');
        if (!address) missingFields.push('address');
        if (!participant_name) missingFields.push('participant_name');

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Bad Request. Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 4: Execution
        // Trigger the service mutation in Supabase
        // ---------------------------------------------------------------------------
        const result = await deleteAppointment({
            date,
            start_time,
            address,
            participant_name
        });

        console.log("Result from DB (delete_appointment):", result);

        // ---------------------------------------------------------------------------
        // Step 5: Return result safely
        // ---------------------------------------------------------------------------
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - delete_appointment] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
