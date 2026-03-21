import { createClient } from '@supabase/supabase-js'

// Initialize Supabase fallback (same as getAgenda)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
    try {
        // 1. Extract payload exactly like getAgenda
        const body = await req.json();

        // ElevenLabs could name the parameter 'address' or 'streetName'
        const targetAddress = body.address || body.streetName;

        console.log("\n=== ELEVENLABS WEBHOOK CALL (getDossier) ===")
        console.log("Full AI Payload:", body)
        console.log("Parsed Address:", targetAddress)

        if (!targetAddress) {
            console.log("Error: The AI did not provide an address parameter.")
            return Response.json({
                success: false,
                error: "You must provide an 'address' parameter to search the properties."
            }, { status: 400 });
        }

        // 2. Direct Supabase Query (Robust to 0 results without crashing)
        const { data: properties, error } = await supabase
            .from('properties')
            .select('*')
            .ilike('address', `%${targetAddress}%`)
            .limit(1);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        const foundProperty = properties && properties.length > 0 ? properties[0] : null;

        if (foundProperty) {
            console.log("Property Found:", foundProperty.address)
        } else {
            console.log("Property NOT Found for query:", targetAddress)
        }
        console.log("==================================================\n")

        // 3. Send structured response back to ElevenLabs
        return Response.json({
            success: true,
            property: foundProperty,
            message: foundProperty ? "Dossier found." : "No property found for that address."
        });

    } catch (error: any) {
        console.error("Webhook Internal Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}
