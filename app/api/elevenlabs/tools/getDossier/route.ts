import { NextResponse } from 'next/server';
import { getDossier } from '@/services/supabaseTools/getDossier';

// Extract the webhook secret securely from environment variables
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        // ---------------------------------------------------------------------------
        // Step 2: Security check - Verify Authorization Header
        // ---------------------------------------------------------------------------
        const authHeader = req.headers.get('x-api-key'); // AANGEPAST: Dit moet x-api-key zijn!
        const secret = process.env.ELEVENLABS_WEBHOOK_SECRET; // AANGEPAST: process.env toegevoegd! 

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
        console.log("Pakketje van ElevenLabs:", body);

        // ElevenLabs stuurt de data direct, dus we pakken het adres er direct uit!
        const hetAdres = body.address;

        if (!hetAdres) {
            return NextResponse.json(
                { error: 'Bad Request. Missing address in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 3: Haal de data op uit Supabase
        // ---------------------------------------------------------------------------
        // We sturen het adres naar jouw getDossier functie
        const result = await getDossier({ streetName: hetAdres });

        console.log("Resultaat uit database:", result);

        // Stuur de data terug naar ElevenLabs
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
