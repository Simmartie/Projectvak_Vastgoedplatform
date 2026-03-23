import { createClient } from '@supabase/supabase-js';

export interface GiveStatusSuggestionParams {
    propertyAddress: string;
    buyerName: string;
    suggestedStatus: string;
}

export interface GiveStatusSuggestionResponse {
    status: 'success' | 'error';
    message: string;
    action?: 'update';
    data?: any;
}

export async function giveStatusSuggestion(params: GiveStatusSuggestionParams): Promise<GiveStatusSuggestionResponse> {
    console.log(`[giveStatusSuggestion] Processing for property: ${params.propertyAddress}, buyer: ${params.buyerName}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[giveStatusSuggestion] Missing Supabase environment variables');
            return {
                status: 'error',
                message: 'Internal configuration error.'
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Search Property
        const { data: propertyData, error: propertyError } = await supabase
            .from('properties')
            .select('id, address')
            .ilike('address', `%${params.propertyAddress}%`)
            .limit(1)
            .single();

        if (propertyError || !propertyData) {
            console.error('[giveStatusSuggestion] Property search error or not found:', propertyError);
            return {
                status: 'error',
                message: `Could not find property matching address: ${params.propertyAddress}`
            };
        }

        const propertyId = propertyData.id;

        // 2. Search Buyer
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .ilike('name', `%${params.buyerName}%`)
            .limit(1)
            .single();

        if (userError || !userData) {
            console.error('[giveStatusSuggestion] User search error or not found:', userError);
            return {
                status: 'error',
                message: `Could not find buyer matching name: ${params.buyerName}`
            };
        }

        const userId = userData.id;

        // 3. Check for Existing Record in bids table
        const { data: existingBid, error: existingBidError } = await supabase
            .from('bids')
            .select('id')
            .eq('property_id', propertyId)
            .eq('buyer_id', userId)
            .maybeSingle();

        if (existingBidError) {
            console.error('[giveStatusSuggestion] Error checking existing bid:', existingBidError);
            return {
                status: 'error',
                message: 'Error checking for existing bid.'
            };
        }

        // 4. Mutation Logic (STRICTLY UPDATE ONLY)
        if (existingBid) {
            // Update existing bid
            // STRICT RULE: Update ONLY status_suggestion
            const { data: updateData, error: updateError } = await supabase
                .from('bids')
                .update({ status_suggestion: params.suggestedStatus })
                .eq('id', existingBid.id)
                .select()
                .single();

            if (updateError || !updateData) {
                console.error('[giveStatusSuggestion] Update error:', updateError);
                return {
                    status: 'error',
                    message: 'Failed to update existing bid status suggestion.'
                };
            }

            return {
                status: 'success',
                message: 'Successfully updated existing bid status suggestion.',
                action: 'update',
                data: updateData
            };
        } else {
            // No existing row found. STRICT NO INSERT RULE.
            return {
                status: 'error',
                message: 'No existing bid found for this buyer and property. Status cannot be updated.'
            };
        }

    } catch (err: any) {
        console.error('[giveStatusSuggestion] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while processing the status suggestion.'
        };
    }
}
