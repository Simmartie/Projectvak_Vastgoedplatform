import { createClient } from '@supabase/supabase-js';

export interface GiveAmountSuggestionParams {
    propertyAddress: string;
    suggestedAmount: number;
    buyerName: string;
}

export interface GiveAmountSuggestionResponse {
    status: 'success' | 'error';
    message: string;
    action?: 'update' | 'insert';
    data?: any;
}

export async function giveAmountSuggestion(params: GiveAmountSuggestionParams): Promise<GiveAmountSuggestionResponse> {
    console.log(`[giveAmountSuggestion] Processing for property: ${params.propertyAddress}, buyer: ${params.buyerName}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[giveAmountSuggestion] Missing Supabase environment variables');
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
            console.error('[giveAmountSuggestion] Property search error or not found:', propertyError);
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
            console.error('[giveAmountSuggestion] User search error or not found:', userError);
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
            console.error('[giveAmountSuggestion] Error checking existing bid:', existingBidError);
            return {
                status: 'error',
                message: 'Error checking for existing bid.'
            };
        }

        // 4. Mutation Logic (Update or Insert)
        if (existingBid) {
            // Update existing bid
            // STRICT RULE: Update ONLY amount_suggestion
            const { data: updateData, error: updateError } = await supabase
                .from('bids')
                .update({ amount_suggestion: params.suggestedAmount })
                .eq('id', existingBid.id)
                .select()
                .single();

            if (updateError || !updateData) {
                console.error('[giveAmountSuggestion] Update error:', updateError);
                return {
                    status: 'error',
                    message: 'Failed to update existing bid suggestion.'
                };
            }

            return {
                status: 'success',
                message: 'Successfully updated existing bid suggestion.',
                action: 'update',
                data: updateData
            };
        } else {
            // Insert new bid
            // STRICT RULE: Insert ONLY property_id, buyer_id, and amount_suggestion (actual amount remains empty/null)
            const { data: insertData, error: insertError } = await supabase
                .from('bids')
                .insert({
                    property_id: propertyId,
                    buyer_id: userId,
                    amount_suggestion: params.suggestedAmount
                })
                .select()
                .single();

            if (insertError || !insertData) {
                console.error('[giveAmountSuggestion] Insert error:', insertError);
                return {
                    status: 'error',
                    message: 'Failed to insert new bid suggestion.'
                };
            }

            return {
                status: 'success',
                message: 'Successfully inserted new bid suggestion.',
                action: 'insert',
                data: insertData
            };
        }

    } catch (err: any) {
        console.error('[giveAmountSuggestion] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while processing the bid suggestion.'
        };
    }
}
