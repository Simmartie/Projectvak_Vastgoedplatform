import { NextResponse } from 'next/server';
import { giveRatingSuggestion } from '@/services/supabaseTools/giveRatingSuggestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("\n=== ELEVENLABS WEBHOOK CALL (giveRatingSuggestion) ===");
        console.log("Full AI Payload:", body);

        const { propertyAddress, visitDate, ratingValue, buyerName } = body;

        if (!propertyAddress || !visitDate || ratingValue === undefined || ratingValue === null) {
            return NextResponse.json(
                { error: "Bad Request. Missing required fields: propertyAddress, visitDate, ratingValue." },
                { status: 400 }
            );
        }

        const result = await giveRatingSuggestion({
            propertyAddress,
            visitDate,
            ratingValue,
            buyerName
        });

        console.log("Result:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
