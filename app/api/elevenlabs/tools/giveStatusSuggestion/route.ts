import { NextResponse } from 'next/server';
import { giveStatusSuggestion } from '@/services/supabaseTools/giveStatusSuggestion';

export async function POST(req: Request) {
    try {
        console.log("Ping! Request ontvangen op giveStatusSuggestion");

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
        console.log("Payload from ElevenLabs (giveStatusSuggestion):", body);

        // Required explicitly from ElevenLabs payload
        const { propertyAddress, buyerName, suggestedStatus } = body;

        // ---------------------------------------------------------------------------
        // Step 3: Validation
        // Verify none of these fields are missing or empty strings
        // ---------------------------------------------------------------------------
        if (!propertyAddress || typeof propertyAddress !== 'string' || propertyAddress.trim() === '') {
            return NextResponse.json(
                { error: 'Bad Request. Missing or invalid propertyAddress in request body.' },
                { status: 400 }
            );
        }

        if (!buyerName || typeof buyerName !== 'string' || buyerName.trim() === '') {
            return NextResponse.json(
                { error: 'Bad Request. Missing or invalid buyerName in request body.' },
                { status: 400 }
            );
        }

        if (!suggestedStatus || typeof suggestedStatus !== 'string' || suggestedStatus.trim() === '') {
            return NextResponse.json(
                { error: 'Bad Request. Missing or invalid suggestedStatus in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 4: Execution
        // Trigger the service mutation in Supabase (Strictly updates only)
        // ---------------------------------------------------------------------------
        const result = await giveStatusSuggestion({
            propertyAddress: propertyAddress.trim(),
            buyerName: buyerName.trim(),
            suggestedStatus: suggestedStatus.trim()
        });

        console.log("Result from DB (giveStatusSuggestion):", result);

        // ---------------------------------------------------------------------------
        // Step 5: Return result to ElevenLabs
        // If the service returned the "no existing bid found" error, this is cleanly 
        // passed in the response payload.
        // ---------------------------------------------------------------------------
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - giveStatusSuggestion] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
