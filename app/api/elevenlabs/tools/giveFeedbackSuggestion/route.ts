import { NextResponse } from 'next/server';
import { giveFeedbackSuggestion } from '@/services/supabaseTools/giveFeedbackSuggestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("\n=== ELEVENLABS WEBHOOK CALL (giveFeedbackSuggestion) ===");
        console.log("Full AI Payload:", body);

        const { propertyAddress, visitDate, feedbackText, buyerName } = body;

        if (!propertyAddress || !visitDate || !feedbackText) {
            return NextResponse.json(
                { error: "Bad Request. Missing required fields: propertyAddress, visitDate, feedbackText." },
                { status: 400 }
            );
        }

        const result = await giveFeedbackSuggestion({
            propertyAddress,
            visitDate,
            feedbackText,
            buyerName
        });

        console.log("Result:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
