'use client'

export type UserRole = 'makelaar' | 'verkoper' | 'koper'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  propertyId?: string // For verkopers, links them to their property
}

// Mock users for demo
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Jan Janssen',
    email: 'jan@makelaardij.nl',
    role: 'makelaar',
  },
  // Verkopers (1 for each property)
  { id: 'v1', name: 'Maria Peters', email: 'maria@email.nl', role: 'verkoper', propertyId: 'prop-1' },
  { id: 'v2', name: 'Klaas Dijkstra', email: 'v2@email.nl', role: 'verkoper', propertyId: 'prop-2' },
  { id: 'v3', name: 'Sanne Visser', email: 'v3@email.nl', role: 'verkoper', propertyId: 'prop-3' },
  { id: 'v4', name: 'Johan de Boer', email: 'v4@email.nl', role: 'verkoper', propertyId: 'prop-4' },
  { id: 'v5', name: 'Emma Bakker', email: 'v5@email.nl', role: 'verkoper', propertyId: 'prop-5' },
  { id: 'v6', name: 'Luuk de Jong', email: 'v6@email.nl', role: 'verkoper', propertyId: 'prop-6' },
  { id: 'v7', name: 'Sophie Mulder', email: 'v7@email.nl', role: 'verkoper', propertyId: 'prop-7' },
  { id: 'v8', name: 'Daan Kerstens', email: 'v8@email.nl', role: 'verkoper', propertyId: 'prop-8' },
  { id: 'v9', name: 'Milou van Dijk', email: 'v9@email.nl', role: 'verkoper', propertyId: 'prop-9' },
  { id: 'v10', name: 'Sem Jansen', email: 'v10@email.nl', role: 'verkoper', propertyId: 'prop-10' },
  { id: 'v11', name: 'Julia de Rijk', email: 'v11@email.nl', role: 'verkoper', propertyId: 'prop-11' },
  { id: 'v12', name: 'Bram Verhoeven', email: 'v12@email.nl', role: 'verkoper', propertyId: 'prop-12' },
  { id: 'v13', name: 'Lisa Brouwer', email: 'v13@email.nl', role: 'verkoper', propertyId: 'prop-13' },
  { id: 'v14', name: 'Tim van der Berg', email: 'v14@email.nl', role: 'verkoper', propertyId: 'prop-14' },
  { id: 'v15', name: 'Eva Koster', email: 'v15@email.nl', role: 'verkoper', propertyId: 'prop-15' },
  // Kopers
  { id: '3', name: 'Pieter de Vries', email: 'pieter@email.nl', role: 'koper' },
  { id: 'k2', name: 'Sarah de Jong', email: 'sarah@email.nl', role: 'koper' },
  { id: 'k3', name: 'Jan Peeters', email: 'jan.peeters@email.nl', role: 'koper' },
  { id: 'k4', name: 'Lotte Meijer', email: 'lotte@email.nl', role: 'koper' },
  { id: 'k5', name: 'Tom Hendriks', email: 'tom@email.nl', role: 'koper' },
  { id: 'k6', name: 'Ruben Vos', email: 'ruben@email.nl', role: 'koper' },
  { id: 'k7', name: 'Noa de Witte', email: 'noa@email.nl', role: 'koper' },
  { id: 'k8', name: 'Lucas van Leeuwen', email: 'lucas@email.nl', role: 'koper' },
  { id: 'k9', name: 'Lina de Ruiter', email: 'lina@email.nl', role: 'koper' },
  { id: 'k10', name: 'Lars Maes', email: 'lars@email.nl', role: 'koper' },
]

// Simple auth context using localStorage
let currentUser: User | null = null

export function login(email: string): User | null {
  const user = MOCK_USERS.find(u => u.email === email)
  if (user) {
    currentUser = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
    return user
  }
  return null
}

export function logout(): void {
  currentUser = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser')
  }
}

export function getCurrentUser(): User | null {
  if (currentUser) return currentUser

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      currentUser = JSON.parse(stored)
      return currentUser
    }
  }

  return null
}
