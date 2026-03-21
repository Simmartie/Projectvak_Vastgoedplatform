import { NextResponse } from 'next/server';

export async function GET() {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_9501kkpnxn7sefq9w11v25w80xty';
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        console.error("Missing ELEVENLABS_API_KEY environment variable");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
            method: 'GET',
            headers: {
                'xi-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API rejected the request: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json({ signedUrl: data.signed_url });
    } catch (error: any) {
        console.error("Failed to generate ElevenLabs token:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
