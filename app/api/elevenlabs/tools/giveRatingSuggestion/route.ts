import { NextResponse } from 'next/server';
import { giveRatingSuggestion } from '@/services/supabaseTools/giveRatingSuggestion';

export async function POST(req: Request) {
    try {
        console.log("Ping! Request received at giveRatingSuggestion");

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
        console.log("Payload from ElevenLabs (giveRatingSuggestion):", body);

        const { propertyAddress, visitDate, ratingValue, buyerName } = body;

        // Validation: Verify the 3 required fields
        // ratingValue can be 0, so we check if it's strictly undefined or null
        if (!propertyAddress || !visitDate || ratingValue === undefined || ratingValue === null) {
            return NextResponse.json(
                { error: 'Bad Request. Missing propertyAddress, visitDate, or ratingValue in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 3: Execution
        // ---------------------------------------------------------------------------
        const result = await giveRatingSuggestion({
            propertyAddress,
            visitDate,
            ratingValue,
            buyerName
        });

        console.log("Result from DB (giveRatingSuggestion):", result);

        // ---------------------------------------------------------------------------
        // Step 4: Return result
        // ---------------------------------------------------------------------------
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - giveRatingSuggestion] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
