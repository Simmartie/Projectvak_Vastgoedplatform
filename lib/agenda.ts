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

// Generate an ID for new appointments
const generateId = () => Math.random().toString(36).substr(2, 9)

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

export function getAppointmentsForUser(userId: string): Appointment[] {
  if (typeof window === 'undefined') {
    return MOCK_APPOINTMENTS.filter(a => Array.isArray(a.participantIds) ? a.participantIds.includes(userId) : (a as any).userId === userId)
  }

  const stored = localStorage.getItem('appointments')
  if (stored) {
    const allAppointments: Appointment[] = JSON.parse(stored)
    return allAppointments.filter(a => Array.isArray(a.participantIds) ? a.participantIds.includes(userId) : (a as any).userId === userId)
  }

  // Initialize if empty
  localStorage.setItem('appointments', JSON.stringify(MOCK_APPOINTMENTS))
  return MOCK_APPOINTMENTS.filter(a => Array.isArray(a.participantIds) ? a.participantIds.includes(userId) : (a as any).userId === userId)
}

export function getAllAppointments(): Appointment[] {
  if (typeof window === 'undefined') return MOCK_APPOINTMENTS

  const stored = localStorage.getItem('appointments')
  if (stored) {
    return JSON.parse(stored)
  }

  localStorage.setItem('appointments', JSON.stringify(MOCK_APPOINTMENTS))
  return MOCK_APPOINTMENTS
}

export function addAppointment(appointment: Omit<Appointment, 'id'>): Appointment {
  const newAppointment = { ...appointment, id: generateId() }
  const allAppointments = getAllAppointments()
  allAppointments.push(newAppointment)

  if (typeof window !== 'undefined') {
    localStorage.setItem('appointments', JSON.stringify(allAppointments))
  }
  return newAppointment
}

export function updateAppointment(updatedAppointment: Appointment): Appointment {
  const allAppointments = getAllAppointments()
  const index = allAppointments.findIndex(a => a.id === updatedAppointment.id)

  if (index !== -1) {
    allAppointments[index] = updatedAppointment
    if (typeof window !== 'undefined') {
      localStorage.setItem('appointments', JSON.stringify(allAppointments))
    }
  }
  return updatedAppointment
}

export function deleteAppointment(id: string): void {
  const allAppointments = getAllAppointments()
  const filtered = allAppointments.filter(a => a.id !== id)

  if (typeof window !== 'undefined') {
    localStorage.setItem('appointments', JSON.stringify(filtered))
  }
}
