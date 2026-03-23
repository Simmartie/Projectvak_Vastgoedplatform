import { createClient } from '@supabase/supabase-js';

export interface GiveFeedbackSuggestionParams {
    propertyAddress: string;
    visitDate: string; // usually YYYY-MM-DD or ISO string
    feedbackText: string;
    buyerName?: string;
}

export interface GiveFeedbackSuggestionResponse {
    status: 'success' | 'error' | 'clarification_needed';
    message: string;
    data?: any;
}

export async function giveFeedbackSuggestion(params: GiveFeedbackSuggestionParams): Promise<GiveFeedbackSuggestionResponse> {
    console.log(`[giveFeedbackSuggestion] Processing for property: ${params.propertyAddress}, date: ${params.visitDate}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[giveFeedbackSuggestion] Missing Supabase environment variables');
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
            console.error('[giveFeedbackSuggestion] Property search error or not found:', propertyError);
            return {
                status: 'error',
                message: `Could not find property matching address: ${params.propertyAddress}`
            };
        }

        const propertyId = propertyData.id;

        // 2. Search Buyer (Optional)
        let userId: string | null = null;
        if (params.buyerName) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name')
                .ilike('name', `%${params.buyerName}%`)
                .limit(1)
                .single();

            if (userError || !userData) {
                console.error('[giveFeedbackSuggestion] User search error or not found:', userError);
                return {
                    status: 'error',
                    message: `Could not find buyer matching name: ${params.buyerName}`
                };
            }
            userId = userData.id;
        }

        // 3. Find Exact Visit
        let visitsQuery = supabase
            .from('visits')
            .select('id, date, property_id, buyer_id')
            .eq('property_id', propertyId);

        if (userId) {
            visitsQuery = visitsQuery.eq('buyer_id', userId);
        }

        const { data: visitsData, error: visitsError } = await visitsQuery;

        if (visitsError || !visitsData || visitsData.length === 0) {
            console.error('[giveFeedbackSuggestion] Visits query error or none found:', visitsError);
            return {
                status: 'error',
                message: 'Could not find any visits matching the provided property and buyer.'
            };
        }

        // Filter by date (handling both YYYY-MM-DD and exact ISO strings)
        // visit.date in DB is e.g. "2024-01-15T00:00:00+00:00"
        const visitDatePrefix = params.visitDate.split('T')[0]; // gracefully handle if time is provided
        const exactVisits = visitsData.filter((v: any) => v.date.startsWith(visitDatePrefix));

        if (exactVisits.length === 0) {
            return {
                status: 'error',
                message: `Could not find a visit on date: ${params.visitDate} for this property.`
            };
        }

        if (exactVisits.length > 1 && !params.buyerName) {
            const buyerIds = exactVisits.map((v: any) => v.buyer_id).filter(Boolean);
            let namesList: string[] = [];

            if (buyerIds.length > 0) {
                const { data: buyersData } = await supabase
                    .from('users')
                    .select('name')
                    .in('id', buyerIds);

                if (buyersData) {
                    namesList = buyersData.map((b: any) => b.name).filter(Boolean);
                }
            }

            let formattedNames = 'Unknown Buyers';
            if (namesList.length > 0) {
                if (namesList.length === 1) {
                    formattedNames = namesList[0];
                } else if (namesList.length === 2) {
                    formattedNames = `${namesList[0]} and ${namesList[1]}`;
                } else {
                    const last = namesList.pop();
                    formattedNames = `${namesList.join(', ')}, and ${last}`;
                }
            }

            return {
                status: 'clarification_needed',
                message: `Multiple visits were found for this property on this date. Please ask the real estate agent to clarify which appointment this is about. The appointments found are with the following buyers: ${formattedNames}.`
            };
        }

        const exactVisit = exactVisits[0];

        // 4. CRITICAL MUTATION RULE: Update ONLY feedback_suggestion
        const { data: updateData, error: updateError } = await supabase
            .from('visits')
            .update({ feedback_suggestion: params.feedbackText })
            .eq('id', exactVisit.id)
            .select()
            .single();

        if (updateError || !updateData) {
            console.error('[giveFeedbackSuggestion] Update error:', updateError);
            return {
                status: 'error',
                message: 'Failed to update feedback suggestion in the database.'
            };
        }

        return {
            status: 'success',
            message: 'Feedback suggestion successfully saved.',
            data: updateData
        };

    } catch (err: any) {
        console.error('[giveFeedbackSuggestion] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while saving the feedback suggestion.'
        };
    }
}
