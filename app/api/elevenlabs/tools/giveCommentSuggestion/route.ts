import { NextResponse } from 'next/server';
import { giveCommentSuggestion } from '@/services/supabaseTools/giveCommentSuggestion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("\n=== ELEVENLABS WEBHOOK CALL (giveCommentSuggestion) ===");
        console.log("Full AI Payload:", body);

        const { propertyAddress, buyerName, suggestedComment } = body;

        if (!propertyAddress || !buyerName || !suggestedComment) {
            return NextResponse.json(
                { error: "Bad Request. Missing required fields: propertyAddress, buyerName, suggestedComment." },
                { status: 400 }
            );
        }

        const result = await giveCommentSuggestion({
            propertyAddress,
            buyerName,
            suggestedComment
        });

        console.log("Result:", result);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
