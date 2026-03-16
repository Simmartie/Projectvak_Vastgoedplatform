import { NextResponse } from 'next/server';
import { getAgenda } from '@/services/supabaseTools/getAgenda';

// Extract the webhook secret securely from environment variables
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        // ---------------------------------------------------------------------------
        // Step 1: Security check - Verify Authorization Header (x-api-key) test
        // ---------------------------------------------------------------------------
        const authHeader = req.headers.get('x-api-key');
        const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

        if (!secret) {
            console.warn('ELEVENLABS_WEBHOOK_SECRET is not set in environment variables');
        }

        if (authHeader !== ELEVENLABS_WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized. Invalid or missing Authorization header.' },
                { status: 401 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 2: Extract payload safely
        // ---------------------------------------------------------------------------
        const body = await req.json();
        console.log("Payload from ElevenLabs (getAgenda):", body);

        // Required parameters
        const { startDate, endDate } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Bad Request. Missing startDate or endDate in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 3: Fetch the data from Supabase
        // ---------------------------------------------------------------------------
        const result = await getAgenda({ startDate, endDate });

        console.log("Result from DB (getAgenda):", result);

        // Send the data back to ElevenLabs
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - getAgenda] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
