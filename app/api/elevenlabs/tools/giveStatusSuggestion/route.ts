import { NextResponse } from 'next/server';
import { giveStatusSuggestion } from '@/services/supabaseTools/giveStatusSuggestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("\n=== ELEVENLABS WEBHOOK CALL (giveStatusSuggestion) ===");
        console.log("Full AI Payload:", body);

        const { propertyAddress, buyerName, suggestedStatus } = body;

        if (!propertyAddress || !buyerName || !suggestedStatus) {
            return NextResponse.json(
                { error: "Bad Request. Missing required fields: propertyAddress, buyerName, suggestedStatus." },
                { status: 400 }
            );
        }

        const result = await giveStatusSuggestion({
            propertyAddress,
            buyerName,
            suggestedStatus
        });

        console.log("Result:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
