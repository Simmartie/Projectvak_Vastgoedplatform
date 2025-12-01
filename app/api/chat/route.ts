import { getPropertyById } from '@/lib/properties'

export const maxDuration = 30

function generateResponse(question: string, property: any): string {
  const lowerQuestion = question.toLowerCase()
  
  // Grootte vragen
  if (lowerQuestion.includes('groot') || lowerQuestion.includes('oppervlakte') || lowerQuestion.includes('vierkante meter')) {
    if (lowerQuestion.includes('tuin') || lowerQuestion.includes('perceel')) {
      return property.plotSize 
        ? `Het perceel is ${property.plotSize}m² groot.`
        : 'Dit pand heeft geen tuin of perceel.'
    }
    return `De woonoppervlakte is ${property.area}m². ${property.plotSize ? `Het totale perceel is ${property.plotSize}m².` : ''}`
  }
  
  // Prijs vragen
  if (lowerQuestion.includes('prijs') || lowerQuestion.includes('kost') || lowerQuestion.includes('euro')) {
    const bids = property.bids.length
    if (bids > 0) {
      const hoogste = Math.max(...property.bids.map((b: any) => b.amount))
      return `De vraagprijs is €${property.price.toLocaleString('nl-NL')}. Er zijn momenteel ${bids} biedingen, met de hoogste bieding op €${hoogste.toLocaleString('nl-NL')}.`
    }
    return `De vraagprijs is €${property.price.toLocaleString('nl-NL')}.`
  }
  
  // Kamers
  if (lowerQuestion.includes('kamer') || lowerQuestion.includes('slaapkamer')) {
    return `Dit pand heeft ${property.rooms} kamers, waarvan ${property.bedrooms} slaapkamers.`
  }
  
  // Scholen
  if (lowerQuestion.includes('school') || lowerQuestion.includes('onderwijs')) {
    const scholen = property.neighborhood.schools.map((s: any) => 
      `${s.name} (${s.type}) op ${s.distance}m afstand`
    ).join(', ')
    return `In de buurt zijn de volgende scholen: ${scholen}.`
  }
  
  // Transport
  if (lowerQuestion.includes('bus') || lowerQuestion.includes('tram') || lowerQuestion.includes('trein') || lowerQuestion.includes('vervoer') || lowerQuestion.includes('openbaar')) {
    const transport = property.neighborhood.transport.map((t: any) => 
      `${t.type} lijn ${t.line}, halte ${t.stop} op ${t.distance}m`
    ).join(', ')
    return `De dichtstbijzijnde haltes zijn: ${transport}.`
  }
  
  // Bushalte specifiek
  if (lowerQuestion.includes('bushalte') || lowerQuestion.includes('bus halte')) {
    const bus = property.neighborhood.transport.find((t: any) => t.type === 'bus')
    if (bus) {
      return `De dichtstbijzijnde bushalte is ${bus.stop}, op ${bus.distance}m afstand (lijn ${bus.line}).`
    }
    return 'Er is geen bushalte in de directe omgeving.'
  }
  
  // Sport
  if (lowerQuestion.includes('sport') || lowerQuestion.includes('fitness') || lowerQuestion.includes('gym')) {
    const sport = property.neighborhood.sports.map((s: any) => 
      `${s.name} (${s.type}) op ${s.distance}m`
    ).join(', ')
    return `In de buurt zijn de volgende sportfaciliteiten: ${sport}.`
  }
  
  // Evenementen
  if (lowerQuestion.includes('evenement') || lowerQuestion.includes('activiteit') || lowerQuestion.includes('festival')) {
    const events = property.neighborhood.events.map((e: any) => 
      `${e.name} (${e.frequency})`
    ).join(', ')
    return `Jaarlijkse evenementen in de buurt: ${events}.`
  }
  
  // Bouwjaar
  if (lowerQuestion.includes('bouwjaar') || lowerQuestion.includes('oud') || lowerQuestion.includes('gebouwd')) {
    return `Dit pand is gebouwd in ${property.buildYear}.`
  }
  
  // Energie
  if (lowerQuestion.includes('energie') || lowerQuestion.includes('label')) {
    return `Het energielabel van dit pand is ${property.energyLabel}.`
  }
  
  // Status
  if (lowerQuestion.includes('status') || lowerQuestion.includes('fase') || lowerQuestion.includes('verkoop')) {
    return `Het pand bevindt zich in de fase: ${property.status}. Er zijn ${property.visits.length} bezichtigingen geweest en ${property.interested} geïnteresseerden.`
  }
  
  // Interest/bezichtigingen
  if (lowerQuestion.includes('interesse') || lowerQuestion.includes('bezichtig') || lowerQuestion.includes('bezoek')) {
    return `Er zijn ${property.visits.length} bezichtigingen geweest en ${property.interested} mensen hebben interesse getoond. ${property.views} mensen hebben de advertentie bekeken.`
  }
  
  // Biedingen
  if (lowerQuestion.includes('bieding') || lowerQuestion.includes('bod')) {
    if (property.bids.length === 0) {
      return 'Er zijn nog geen biedingen gedaan op dit pand.'
    }
    const hoogste = Math.max(...property.bids.map((b: any) => b.amount))
    return `Er zijn ${property.bids.length} biedingen gedaan. De hoogste bieding is €${hoogste.toLocaleString('nl-NL')}.`
  }
  
  // Kenmerken
  if (lowerQuestion.includes('kenmerk') || lowerQuestion.includes('heeft') || lowerQuestion.includes('voorziening')) {
    return `De belangrijkste kenmerken zijn: ${property.features.join(', ')}.`
  }
  
  // Locatie/adres
  if (lowerQuestion.includes('adres') || lowerQuestion.includes('waar') || lowerQuestion.includes('locatie')) {
    return `Het pand bevindt zich op ${property.address}, ${property.postalCode} ${property.city}.`
  }
  
  // Algemene info
  if (lowerQuestion.includes('vertel') || lowerQuestion.includes('info') || lowerQuestion.includes('beschrijving')) {
    return `${property.description} Het pand heeft ${property.rooms} kamers, ${property.area}m² woonoppervlakte en is gebouwd in ${property.buildYear}.`
  }
  
  // Default response
  return `Ik kan je helpen met vragen over dit pand. Vraag bijvoorbeeld naar de prijs, grootte, kamers, scholen in de buurt, openbaar vervoer, of de status van de verkoop.`
}

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json()

  const property = getPropertyById(propertyId)
  
  if (!property) {
    return new Response('Property not found', { status: 404 })
  }

  const lastMessage = messages[messages.length - 1]
  const response = generateResponse(lastMessage.content, property)
  
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
