import { getPropertyById } from '@/lib/properties'

export const maxDuration = 30

async function generateResponse(question: string, property: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    return 'De AI-assistent is momenteel niet beschikbaar omdat de configuratie ontbreekt.'
  }

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
    'Je bent een behulpzame Nederlandstalige vastgoedassistent. ' +
    'Je geeft duidelijke, feitelijke antwoorden op basis van de informatie over het pand hieronder. ' +
    'Je verzint geen informatie die niet in de pandgegevens staat. ' +
    'Antwoorden zijn kort en concreet (1 tot 3 alinea\'s).'

  const promptText =
    `${systemInstruction}\n\n` +
    `Informatie over het pand:\n` +
    `${propertySummaryParts.join('\n')}\n\n` +
    `Vraag van de gebruiker:\n${question}\n\n` +
    'Beantwoord de vraag in het Nederlands. Verwijs waar relevant naar prijs, grootte, kamers, buurt en bereikbaarheid.'

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY ?? '',
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
      return 'De AI-assistent kon je vraag nu niet beantwoorden. Probeer het later opnieuw.'
    }

    const data: any = await res.json()

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text ?? '')
        .join('')
        .trim() ?? ''

    if (!text) {
      return 'De AI-assistent kon geen zinvol antwoord genereren op basis van de beschikbare gegevens.'
    }

    return text
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return 'Er is een fout opgetreden bij het verbinden met de AI-assistent. Probeer het later opnieuw.'
  }
}

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json()

  const property = getPropertyById(propertyId)
  
  if (!property) {
    return new Response('Property not found', { status: 404 })
  }

  const lastMessage = messages[messages.length - 1]
  const response = await generateResponse(lastMessage.content, property)
  
  // Create a streaming response similar to AI SDK format
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send the response in chunks to simulate streaming
      const chunks = response.split(' ')
      let index = 0
      
      const interval = setInterval(() => {
        if (index < chunks.length) {
          const text = (index === 0 ? '' : ' ') + chunks[index]
          controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
          index++
        } else {
          clearInterval(interval)
          controller.close()
        }
      }, 30)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
