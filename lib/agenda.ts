export interface Appointment {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  propertyId?: string
  participantIds: string[]
  description?: string
}

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    title: 'Bezichtiging Kerkstraat 123',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    propertyId: 'prop-1',
    participantIds: ['1', '3'], // Makelaar & Koper
    description: 'Eerste bezichtiging met potentiële kopers.',
  },
  {
    id: 'appt-2',
    title: 'Fotografie Herengracht 456',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '13:00',
    endTime: '14:30',
    propertyId: 'prop-2',
    participantIds: ['1', '2'], // Makelaar & Verkoper
    description: 'Professionele fotografie voor woningpresentatie.',
  },
  {
    id: 'appt-3',
    title: 'Overdracht Beethovenstraat',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    startTime: '15:00',
    endTime: '16:00',
    propertyId: 'prop-3',
    participantIds: ['1', '2', '3'], // Makelaar, Koper, Verkoper
    description: 'Sleuteloverdracht bij de notaris.',
  }
]

// Re-export Supabase data functions (app uses these - all async now)
export {
  fetchAppointmentsForUser as getAppointmentsForUser,
  fetchAllAppointments as getAllAppointments,
  addAppointmentInDb as addAppointment,
  updateAppointmentInDb as updateAppointment,
  deleteAppointmentInDb as deleteAppointment,
} from '@/lib/data'
