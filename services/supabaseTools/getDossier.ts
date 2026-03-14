import { createClient } from '@supabase/supabase-js';

export interface GetDossierParams {
    streetName: string;
}

export interface GetDossierResponse {
    status: 'success' | 'error';
    message: string;
    data?: any;
}

export async function getDossier(params: GetDossierParams): Promise<GetDossierResponse> {
    console.log(`[getDossier] Fetching dossier for street: ${params.streetName}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[getDossier] Missing Supabase environment variables');
            return {
                status: 'error',
                message: 'Internal configuration error.'
            };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // STRICTLY READ-ONLY: Only querying the properties table
        const { data, error } = await supabase
            .from('properties')
            .select(`
                id,
                address,
                city,
                postal_code,
                price,
                previous_price,
                type,
                rooms,
                bedrooms,
                area,
                build_year,
                energy_label,
                status,
                description,
                phase,
                kadastraal_inkomen,
                kadastrale_oppervlakte,
                schatting,
                bouwmisdrijf,
                p_score,
                g_score,
                bodemattest,
                epc_score,
                elektriciteitskeuring,
                conformiteitsattest
            `)
            .ilike('address', `%${params.streetName}%`)
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return {
                    status: 'error',
                    message: `Property not found for address/street: ${params.streetName}`
                };
            }
            console.error('[getDossier] Supabase query error:', error);
            return {
                status: 'error',
                message: 'Failed to access property database.'
            };
        }

        if (!data) {
            return {
                status: 'error',
                message: `Property not found for address/street: ${params.streetName}`
            };
        }

        return {
            status: 'success',
            message: `Successfully retrieved property dossier for ${data.address}`,
            data: {
                id: data.id,
                address: data.address,
                city: data.city,
                postalCode: data.postal_code,
                price: data.price,
                type: data.type,
                rooms: data.rooms,
                bedrooms: data.bedrooms,
                area: data.area,
                buildYear: data.build_year,
                energyLabel: data.energy_label,
                status: data.status,
                description: data.description,
                phase: data.phase,
                kadastraalInkomen: data.kadastraal_inkomen,
                kadastraleOppervlakte: data.kadastrale_oppervlakte,
                schatting: data.schatting,
                bouwmisdrijf: data.bouwmisdrijf,
                pScore: data.p_score,
                gScore: data.g_score,
                bodemattest: data.bodemattest,
                epcScore: data.epc_score,
                elektriciteitskeuring: data.elektriciteitskeuring,
                conformiteitsattest: data.conformiteitsattest
            }
        };

    } catch (err: any) {
        console.error('[getDossier] Unexpected error:', err);
        return {
            status: 'error',
            message: 'An unexpected error occurred while fetching the property dossier.'
        };
    }
}
