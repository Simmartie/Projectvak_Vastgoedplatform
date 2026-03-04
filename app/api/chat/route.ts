import { getPropertyById } from '@/lib/properties'

export const maxDuration = 30

function buildPrompt(question: string, property: any): string {
  const propertySummaryParts: string[] = []

  propertySummaryParts.push(
    `Adres: ${property.address}, ${property.postalCode} ${property.city}.`,
    `Type: ${property.type}, vraagprijs: €${property.price.toLocaleString('nl-NL')}.`,
    `Woonoppervlakte: ${property.area}m²${property.plotSize ? `, perceel: ${property.plotSize}m²` : ''}.`,
    `Kamers: ${property.rooms} totaal, ${property.bedrooms} slaapkamers.`,
    `Bouwjaar: ${property.buildYear}, energielabel: ${property.energyLabel}.`
  )

  if (property.features?.length) {
    propertySummaryParts.push(`Belangrijke kenmerken: ${property.features.join(', ')}.`)
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

  const systemInstruction =
    'Je bent een Nederlandstalige vastgoedassistent. ' +
    'Beantwoord ALLEEN de specifieke vraag van de gebruiker. Geef geen extra informatie tenzij de gebruiker daar expliciet naar vraagt. ' +
    'BELANGRIJK: "EPC label", "epc", "energieprestatiecertificaat", "energieklasse", "energie label" en "energielabel" betekenen allemaal hetzelfde: het veld "energielabel" in de pandgegevens. ' +
    'Gebruik altijd de pandgegevens om de vraag te beantwoorden. ' +
    'Voorbeeld: bij "Wat is het EPC label?", "Welk epc label heeft dit pand?" of "Wat is het energielabel?" antwoord je ALLEEN met het label (bijv. "Het energielabel is C."). ' +
    'Je verzint geen informatie die niet in de pandgegevens staat. Antwoorden zijn kort: één zin of een korte opsomming als de vraag om meerdere dingen vraagt.'

  const promptText =
    `${systemInstruction}\n\n` +
    `Informatie over het pand:\n` +
    `${propertySummaryParts.join('\n')}\n\n` +
    `Vraag van de gebruiker:\n${question}\n\n` +
    'Beantwoord de vraag in het Nederlands.'

  return promptText
}

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json()

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
  const promptText = buildPrompt(lastMessage.content, property)

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
