import { NextResponse } from 'next/server';
import { giveAmountSuggestion } from '@/services/supabaseTools/giveAmountSuggestion';

export async function POST(req: Request) {
    try {
        console.log("Ping! Request ontvangen op giveAmountSuggestion");

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
        console.log("Payload from ElevenLabs (giveAmountSuggestion):", body);

        // Required explicitly from ElevenLabs payload
        const { propertyAddress, suggestedAmount, buyerName } = body;

        // ---------------------------------------------------------------------------
        // Step 3: Validation
        // Explicitly check suggestedAmount for undefined or null (since 0 is valid)
        // ---------------------------------------------------------------------------
        if (!propertyAddress || !buyerName || suggestedAmount === undefined || suggestedAmount === null) {
            return NextResponse.json(
                { error: 'Bad Request. Missing propertyAddress, suggestedAmount, or buyerName in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 4: Execution
        // Trigger the service mutation in Supabase
        // ---------------------------------------------------------------------------
        const result = await giveAmountSuggestion({
            propertyAddress,
            suggestedAmount: Number(suggestedAmount),
            buyerName
        });

        console.log("Result from DB (giveAmountSuggestion):", result);

        // ---------------------------------------------------------------------------
        // Step 5: Return result safely
        // ---------------------------------------------------------------------------
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - giveAmountSuggestion] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
