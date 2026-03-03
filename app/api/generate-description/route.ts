export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { property } = body

        if (!property) {
            return new Response('Missing property data', { status: 400 })
        }

        let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
        if (apiKey) apiKey = apiKey.replace(/^["']|["']$/g, '')

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not configured')
            return new Response('AI service not configured', { status: 500 })
        }

        const prompt =
            'Schrijf een professionele vastgoedbeschrijving in de stijl van een Belgische makelaar. ' +
            'Gebruik vloeiende, wervende alinea\'s, geen opsommingen of bulletpoints. ' +
            'De tekst is opgebouwd uit 3 à 4 alinea\'s, gescheiden door een witregel. ' +
            'Begin met een openingszin die de locatie en het type woning evoceert. ' +
            'Elke alinea belicht een ander aspect: de leefruimte en sfeer, de slaapkamers en comfort, en eventuele bijzondere troeven of praktische meerwaarden. ' +
            'Sluit af met één korte, krachtige zin die de uniciteit van het pand samenvat. ' +
            'Geen markdown, geen titels, geen inleiding zoals "Hier is de beschrijving". Begin direct met de advertentietekst.\n\n' +
            'Hier zijn de gegevens van het pand:\n' +
            `- Adres: ${property.address || 'Onbekend'}, ${property.city || ''}\n` +
            `- Type: ${property.type || 'Onbekend'}\n` +
            `- Vraagprijs: €${property.price ? Number(property.price).toLocaleString('nl-BE') : 'Onbekend'}\n` +
            `- Woonoppervlakte: ${property.area ? property.area + ' m²' : 'Onbekend'}\n` +
            `- Perceeloppervlakte: ${property.plotSize ? property.plotSize + ' m²' : 'N.v.t.'}\n` +
            `- Kamers: ${property.rooms || 'Onbekend'} (waarvan ${property.bedrooms || 'Onbekend'} slaapkamers)\n` +
            `- Bouwjaar: ${property.buildYear || 'Onbekend'}\n` +
            `- Energielabel: ${property.energyLabel || 'Onbekend'}\n`

        const res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        )

        if (!res.ok) {
            const errorBody = await res.text()
            console.error('Gemini API error status:', res.status, 'body:', errorBody)
            return new Response(JSON.stringify({ error: `Gemini API error: ${res.status}`, details: errorBody }), { status: 502, headers: { 'Content-Type': 'application/json' } })
        }

        const json = await res.json() as any
        const parts = json?.candidates?.[0]?.content?.parts ?? []
        const text = parts.map((p: any) => p.text ?? '').join('').trim()

        if (!text) {
            return new Response('No description generated', { status: 500 })
        }

        return Response.json({ text })
    } catch (error) {
        console.error('Error in generate-description route:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}
