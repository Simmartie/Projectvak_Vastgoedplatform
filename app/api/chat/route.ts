import { getPropertyById } from '@/lib/properties'

export const maxDuration = 30

function buildPrompt(question: string, property: any, role: string): string {
  const propertySummaryParts: string[] = []

  propertySummaryParts.push(
    `Adres: ${property.address}, ${property.postalCode} ${property.city}.`,
    `Status: ${property.status}`,
    `Type: ${property.type}, vraagprijs: €${property.price.toLocaleString('nl-NL')}.`,
    `Woonoppervlakte: ${property.area}m²${property.plotSize ? `, perceel: ${property.plotSize}m²` : ''}.`,
    `Kamers: ${property.rooms} totaal, ${property.bedrooms} slaapkamers.`,
    `Bouwjaar: ${property.buildYear}, energielabel: ${property.energyLabel}.`,
    `Beschrijving: ${property.description}`
  )

  if (property.features?.length) {
    propertySummaryParts.push(`Belangrijke kenmerken: ${property.features.join(', ')}.`)
  }

  // Allowed specific features for buyer (from advanced features)
  const allowedBuyerFeatures: string[] = []
  if (property.epcScore !== undefined && property.epcScore !== null) allowedBuyerFeatures.push(`EPC score: ${property.epcScore}`)
  if (property.mobiscore !== undefined && property.mobiscore !== null) allowedBuyerFeatures.push(`Mobiscore: ${property.mobiscore}`)

  if (allowedBuyerFeatures.length > 0) {
    propertySummaryParts.push(`Andere kenmerken: ${allowedBuyerFeatures.join('; ')}.`)
  }

  // Agent features (NOT allowed for buyer)
  if (role === 'makelaar') {
    const advancedFeatures: string[] = []
    if (property.kadastraalInkomen !== undefined && property.kadastraalInkomen !== null) advancedFeatures.push(`Kadastraal inkomen (KI): €${property.kadastraalInkomen}`)
    if (property.kadastraleOppervlakte !== undefined && property.kadastraleOppervlakte !== null) advancedFeatures.push(`Kadastrale oppervlakte: ${property.kadastraleOppervlakte}m²`)
    if (property.schatting !== undefined && property.schatting !== null) advancedFeatures.push(`Schatting: €${property.schatting}`)
    if (property.bouwmisdrijf !== undefined && property.bouwmisdrijf !== null) advancedFeatures.push(`Bouwmisdrijf: ${property.bouwmisdrijf}`)
    if (property.pScore !== undefined && property.pScore !== null) advancedFeatures.push(`P-score: ${property.pScore}`)
    if (property.gScore !== undefined && property.gScore !== null) advancedFeatures.push(`G-score: ${property.gScore}`)
    if (property.bodemattest !== undefined && property.bodemattest !== null) advancedFeatures.push(`Bodemattest: ${property.bodemattest}`)
    if (property.elektriciteitskeuring !== undefined && property.elektriciteitskeuring !== null) advancedFeatures.push(`Elektriciteitskeuring: ${property.elektriciteitskeuring}`)
    if (property.conformiteitsattest !== undefined && property.conformiteitsattest !== null) {
      let attestInfo = `Conformiteitsattest: ${property.conformiteitsattest}`
      if (property.conformiteitsattestGeldigheid) attestInfo += ` (geldig tot ${property.conformiteitsattestGeldigheid})`
      advancedFeatures.push(attestInfo)
    }
    if (property.erfdienstbaarheden?.length) advancedFeatures.push(`Erfdienstbaarheden: ${property.erfdienstbaarheden.join(', ')}`)

    advancedFeatures.push(`Fase: ${property.phase}`)
    advancedFeatures.push(`Aantal keer als favoriet aangeduid door gebruikers: ${property.interested}`)
    advancedFeatures.push(`Aantal weergaven: ${property.views}`)
    advancedFeatures.push(`Aantal bezichtigingen: ${property.visits?.length || 0}`)
    advancedFeatures.push(`Aantal biedingen: ${property.bids?.length || 0}`)

    if (advancedFeatures.length > 0) {
      propertySummaryParts.push(`Exclusieve makelaars informatie: ${advancedFeatures.join('; ')}.`)
    }
  }

  // Neighborhood data is no longer mocked; we use Google Search Grounding for this.

  let systemInstruction = ''

  if (role === 'koper') {
    systemInstruction =
      'Je bent een behulpzame Nederlandstalige vastgoedassistent voor een potentiële koper. ' +
      'Je mag ENKEL informatie geven over de volgende specifieke kenmerken: adres, stad, postcode, prijs, type, kamers, slaapkamers, oppervlakte, perceeloppervlakte, bouwjaar, epc score, energielabel, mobiscore, status, beschrijving en kenmerken (features). ' +
      'Voor alle vragen over de buurt (zoals scholen, voetbalclubs, sportfaciliteiten, openbaar vervoer, evenementen, festivals, supermarkten, etc. dichtbij het pand), MOET je altijd je ingebouwde Google Search tool gebruiken om actuele informatie op te zoeken in de buurt van het adres van het pand. Vertrouw niet op verouderde gegevens. ' +
      'Als de gebruiker vraagt naar pand-specifieke informatie die NIET in deze lijst staat (bijvoorbeeld bodemattest, bouwmisdrijf, schatting, attesten, etc.), OF als de informatie ontbreekt in de database/pandgegevens, antwoord dan EXACT en ALLEEN met dit woord: "CONTACT_AGENT" ' +
      'Verzin geen pand-specifieke informatie die niet in de pandgegevens staat. Wees beknopt. ' +
      'BELANGRIJK: "EPC label", "epc", "energieprestatiecertificaat", "energieklasse", "energie label" en "energielabel" is het veld "energielabel" of "epc score".'
  } else {
    // role === 'makelaar'
    systemInstruction =
      'Je bent een Nederlandstalige vastgoedassistent voor de makelaar. ' +
      'Jij hebt volledige toegang tot ALLE pandgegevens (inclusief interne informatie zoals attesten, kadastraal inkomen, biedingen, bezichtigingen, etc.). ' +
      'Je mag alle vragen over het pand beantwoorden met de beschikbare gegevens. ' +
      'Voor alle vragen over de buurt (zoals scholen, voetbalclubs, sportfaciliteiten, festivals, supermarkten etc. dichtbij het pand), MOET je de ingebouwde Google Search tool gebruiken om actuele gegevens rondom het adres op te zoeken. ' +
      'Als de gebruiker vraagt naar informatie die NIET aanwezig is in de verstrekte pandgegevens (oftewel ontbreekt in de database), antwoord dan EXACT met deze zin: "Deze informatie is niet bekend over dit dossier". ' +
      'Geef geen excuus of langdradig antwoord als de informatie ontbreekt, enkel deze exacte zin. ' +
      'Voorbeeld: bij "Wat is het EPC label?" of "Wat is het energielabel?" antwoord je met het label en verzin geen informatie die niet voorkomt in de pandgegevens.'
  }

  const promptText =
    `${systemInstruction}\n\n` +
    `Informatie over het pand:\n` +
    `${propertySummaryParts.join('\n')}\n\n` +
    `Vraag van de gebruiker:\n${question}\n\n` +
    'Beantwoord de vraag in het Nederlands.'

  return promptText
}

export async function POST(req: Request) {
  const { messages, propertyId, role } = await req.json()

  const property = await getPropertyById(propertyId)

  if (!property) {
    return new Response('Property not found', { status: 404 })
  }

  let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (apiKey) apiKey = apiKey.replace(/^["']|["']$/g, '')

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    return new Response(
      'De AI-assistent is momenteel niet beschikbaar omdat de configuratie ontbreekt.',
      { status: 500 }
    )
  }

  const lastMessage = messages[messages.length - 1]
  const userRole = role || 'koper' // default guard
  const promptText = buildPrompt(lastMessage.content, property, userRole)

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: promptText }],
                },
              ],
              tools: [{ googleSearch: {} }]
            }),
          }
        )

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Gemini API error status:', res.status, 'Body:', errorText);
          controller.enqueue(
            encoder.encode(
              `0:${JSON.stringify(
                'De AI-assistent kon je vraag nu niet beantwoorden (API error). Probeer het later opnieuw.'
              )}\n`
            )
          )
          controller.close()
          return
        }

        let json;
        try {
          json = (await res.json()) as any;
          console.log('Gemini API full response:', JSON.stringify(json, null, 2));
        } catch (parseError) {
          console.error('Error parsing Gemini JSON:', parseError);
          controller.enqueue(encoder.encode(`0:${JSON.stringify('Fout bij het verwerken van het AI-antwoord.')}\n`));
          controller.close();
          return;
        }

        const parts = json?.candidates?.[0]?.content?.parts ?? []
        const text = parts.map((p: any) => p.text ?? '').join('').trim()

        if (!text && json?.candidates?.[0]?.finishReason) {
           console.warn('Gemini returned no text. Finish reason:', json.candidates[0].finishReason);
           if (json.candidates[0].finishReason === 'SAFETY') {
             controller.enqueue(encoder.encode(`0:${JSON.stringify('Het antwoord werd geblokkeerd door veiligheidsfilters.')}\n`));
             controller.close();
             return;
           }
        }

        const answer =
          text ||
          'De AI-assistent kon je vraag nu niet beantwoorden (geen tekst ontvangen). Probeer het later opnieuw.'

        controller.enqueue(encoder.encode(`0:${JSON.stringify(answer)}\n`))
        controller.close()
      } catch (error: any) {
        console.error('General Error in chat route:', error)
        controller.enqueue(
          encoder.encode(
            `0:${JSON.stringify(
              `Fout: ${error?.message || 'Onbekende fout in de chat-route.'}`
            )}\n`
          )
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
