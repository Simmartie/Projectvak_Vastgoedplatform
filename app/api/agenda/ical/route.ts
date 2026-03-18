import { createClient } from '@/utils/supabase/server'
import { Appointment } from '@/lib/agenda'

// Create a simple map function since the one in lib/agenda is not exported in a way we can use without client components
function mapDbAppointment(dbRecord: any): Appointment {
    return {
        id: dbRecord.id,
        title: dbRecord.title,
        date: dbRecord.date,
        startTime: dbRecord.start_time.substring(0, 5),
        endTime: dbRecord.end_time.substring(0, 5),
        propertyId: dbRecord.properties?.id || dbRecord.properties?.mock_id || undefined,
        description: dbRecord.description || undefined,
        mock_id: dbRecord.mock_id || undefined,
        participantIds: dbRecord.appointment_participants?.map((p: any) => p.users?.mock_id).filter(Boolean) || []
    }
}

// Function to format date and time to iCal format (YYYYMMDDTHHMMSSZ)
function formatICalDate(dateStr: string, timeStr: string): string {
    // We assume the stored date and time are in Europe/Brussels or local time
    // Google Calendar needs a valid DTSTART. The easiest is adding the Z or defining TZID.
    // Converting local to UTC string for simplicity:
    const dt = new Date(`${dateStr}T${timeStr}:00+01:00`)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return new Response('Missing userId', { status: 400 })
    }

    const supabase = await createClient()

    // First get appointment IDs for the user
    const { data: participantData, error: partError } = await supabase
        .from('appointment_participants')
        .select(`
      appointment_id,
      users!inner (mock_id)
    `)
        .eq('users.mock_id', userId)

    if (partError) {
        return new Response('Error fetching participants', { status: 500 })
    }

    const appointmentIds = participantData?.map(p => p.appointment_id) || []

    let dbAppointments: any[] = []

    if (appointmentIds.length > 0) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        *,
        properties ( id, mock_id, address ),
        appointment_participants (
          users ( mock_id )
        )
      `)
            .in('id', appointmentIds)

        if (error) {
            return new Response('Error fetching appointments', { status: 500 })
        }
        dbAppointments = data || []
    }

    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Real Estate App//NL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Mijn Afspraken',
        'X-WR-TIMEZONE:Europe/Brussels',
    ]

    for (const dbApp of dbAppointments) {
        const app = mapDbAppointment(dbApp)

        // Construct address if available
        const location = dbApp.properties?.address ? `LOCATION:${dbApp.properties.address.replace(/,/g, '\\,')}` : ''
        const description = app.description ? `DESCRIPTION:${app.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}` : ''

        icalContent.push(
            'BEGIN:VEVENT',
            `UID:${app.id}@realestateapp.be`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${formatICalDate(app.date, app.startTime)}`,
            `DTEND:${formatICalDate(app.date, app.endTime)}`,
            `SUMMARY:${app.title}`,
            location,
            description,
            'END:VEVENT'
        )
    }

    icalContent.push('END:VCALENDAR')
    const icsStr = icalContent.filter(Boolean).join('\r\n')

    return new Response(icsStr, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="agenda.ics"'
        }
    })
}
