import { NextResponse } from 'next/server';
import { giveAmountSuggestion } from '@/services/supabaseTools/giveAmountSuggestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("\n=== ELEVENLABS WEBHOOK CALL (giveAmountSuggestion) ===");
        console.log("Full AI Payload:", body);

        const { propertyAddress, suggestedAmount, buyerName } = body;

        if (!propertyAddress || suggestedAmount === undefined || suggestedAmount === null || !buyerName) {
            return NextResponse.json(
                { error: "Bad Request. Missing required fields: propertyAddress, suggestedAmount, buyerName." },
                { status: 400 }
            );
        }

        const result = await giveAmountSuggestion({
            propertyAddress,
            suggestedAmount,
            buyerName
        });

        console.log("Result:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
