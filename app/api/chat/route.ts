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
    advancedFeatures.push(`Aantal geïnteresseerden: ${property.interested}`)
    advancedFeatures.push(`Aantal weergaven: ${property.views}`)
    advancedFeatures.push(`Aantal bezichtigingen: ${property.visits?.length || 0}`)
    advancedFeatures.push(`Aantal biedingen: ${property.bids?.length || 0}`)

    if (advancedFeatures.length > 0) {
      propertySummaryParts.push(`Exclusieve makelaars informatie: ${advancedFeatures.join('; ')}.`)
    }
  }

  if (property.neighborhood?.schools?.length) {
    const scholen = property.neighborhood.schools
      .map((s: any) => `${s.name} (${s.type}) op ${s.distance}m`)
      .join('; ')
    propertySummaryParts.push(`Scholen in de buurt: ${scholen}.`)
  }

  if (property.neighborhood?.transport?.length) {
    const transport = property.neighborhood.transport
      .map((t: any) => `${t.type} lijn ${t.line}, halte ${t.stop} op ${t.distance}m`)
      .join('; ')
    propertySummaryParts.push(`Openbaar vervoer: ${transport}.`)
  }

  if (property.neighborhood?.sports?.length) {
    const sports = property.neighborhood.sports
      .map((s: any) => `${s.name} (${s.type}) op ${s.distance}m`)
      .join('; ')
    propertySummaryParts.push(`Sportfaciliteiten: ${sports}.`)
  }

  if (property.neighborhood?.events?.length) {
    const events = property.neighborhood.events
      .map((e: any) => `${e.name} (${e.frequency})`)
      .join('; ')
    propertySummaryParts.push(`Evenementen in de buurt: ${events}.`)
  }

  let systemInstruction = ''

  if (role === 'koper') {
    systemInstruction =
      'Je bent een behulpzame Nederlandstalige vastgoedassistent voor een potentiële koper. ' +
      'Je mag ENKEL informatie geven over de volgende specifieke kenmerken: adres, stad, postcode, buurt (zoals scholen, sportfaciliteiten, openbaar vervoer, evenementen), prijs, type, kamers, slaapkamers, oppervlakte, perceeloppervlakte, bouwjaar, epc score, energielabel, mobiscore, status, beschrijving en kenmerken (features). ' +
      'Als de gebruiker vraagt naar informatie die NIET in deze lijst staat (bijvoorbeeld bodemattest, bouwmisdrijf, schatting, attesten, etc.), OF als de informatie ontbreekt in de database/pandgegevens, antwoord dan EXACT en ALLEEN met dit woord: "CONTACT_AGENT" ' +
      'Verzin geen informatie die niet in de pandgegevens staat. Wees beknopt. ' +
      'BELANGRIJK: "EPC label", "epc", "energieprestatiecertificaat", "energieklasse", "energie label" en "energielabel" is het veld "energielabel" of "epc score".'
  } else {
    // role === 'makelaar'
    systemInstruction =
      'Je bent een Nederlandstalige vastgoedassistent voor de makelaar. ' +
      'Jij hebt volledige toegang tot ALLE pandgegevens (inclusief interne informatie zoals attesten, kadastraal inkomen, biedingen, bezichtigingen, etc.). ' +
      'Je mag alle vragen over het pand beantwoorden met de beschikbare gegevens. ' +
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
            }),
          }
        )

        if (!res.ok) {
          console.error('Gemini API error status:', res.status)
          controller.enqueue(
            encoder.encode(
              `0:${JSON.stringify(
                'De AI-assistent kon je vraag nu niet beantwoorden. Probeer het later opnieuw.'
              )}\n`
            )
          )
          controller.close()
          return
        }

        const json = (await res.json()) as any
        const parts = json?.candidates?.[0]?.content?.parts ?? []
        const text = parts.map((p: any) => p.text ?? '').join('').trim()

        const answer =
          text ||
          'De AI-assistent kon je vraag nu niet beantwoorden. Probeer het later opnieuw.'

        controller.enqueue(encoder.encode(`0:${JSON.stringify(answer)}\n`))
        controller.close()
      } catch (error) {
        console.error('Error calling Gemini API:', error)
        controller.enqueue(
          encoder.encode(
            `0:${JSON.stringify(
              'Er is een fout opgetreden bij het verbinden met de AI-assistent. Probeer het later opnieuw.'
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
