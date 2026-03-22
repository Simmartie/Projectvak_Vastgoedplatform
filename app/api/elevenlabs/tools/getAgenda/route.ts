import { createClient } from '@supabase/supabase-js'

// Initialize Supabase. Ensure SUPABASE_SERVICE_KEY is set in your .env.local
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
    try {
        // 1. Get the parameters ElevenLabs sent (e.g., a specific date)
        const body = await req.json();
        // ElevenLabs could send `date` or `startDate`.
        const targetDate = body.date || body.startDate;

        console.log("\n=== ELEVENLABS WEBHOOK CALL ===")
        console.log("Full AI Payload:", body)
        console.log("Parsed Target Date:", targetDate)

        if (!targetDate) {
            console.log("Error: The AI did not provide a date parameter.")
            return Response.json({
                success: false,
                error: "You must supply a 'date' parameter to search the agenda."
            }, { status: 400 });
        }

        // 2. Query your Supabase database for the agenda
        const { data: agendaItems, error } = await supabase
            .from('appointments') // Matching actual schema
            .select('*')
            .eq('date', targetDate);

        if (error) {
            console.error("Supabase Error:", error)
            throw error;
        }

        console.log("Data found:", agendaItems?.length, "items")
        console.log("===============================\n")

        // 3. Send the agenda back to ElevenLabs
        // The AI will read this JSON and read the agenda out loud to the user
        return Response.json({
            success: true,
            agenda: agendaItems
        });

    } catch (error: any) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
