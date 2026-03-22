import { NextResponse } from 'next/server';
import { giveFeedbackSuggestion } from '@/services/supabaseTools/giveFeedbackSuggestion';

// Extract the webhook secret securely from environment variables
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        console.log("Ping! Request ontvangen op giveFeedbackSuggestion");
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
                { error: 'Unauthorized. Invalid or missing Authorization header.' },
                { status: 401 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 2: Extract payload safely
        // ---------------------------------------------------------------------------
        const body = await req.json();
        console.log("Payload from ElevenLabs (giveFeedbackSuggestion):", body);

        // Required explicitly from ElevenLabs payload
        const { propertyAddress, visitDate, feedbackText, buyerName } = body;

        // Validation: Ensure all three required parameters are present
        if (!propertyAddress || !visitDate || !feedbackText) {
            return NextResponse.json(
                { error: 'Bad Request. Missing propertyAddress, visitDate, or feedbackText in request body.' },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------------------------
        // Step 3: Trigger the service mutation in Supabase
        // ---------------------------------------------------------------------------
        const result = await giveFeedbackSuggestion({
            propertyAddress,
            visitDate,
            feedbackText,
            buyerName
        });

        console.log("Result from DB (giveFeedbackSuggestion):", result);

        // ---------------------------------------------------------------------------
        // Step 4: Return result safely
        // ---------------------------------------------------------------------------
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[ElevenLabs Tools Endpoint - giveFeedbackSuggestion] Error handling request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
