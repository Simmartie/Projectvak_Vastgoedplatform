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
  {
    id: '2',
    name: 'Maria Peters',
    email: 'maria@email.nl',
    role: 'verkoper',
    propertyId: 'prop-1',
  },
  {
    id: '3',
    name: 'Pieter de Vries',
    email: 'pieter@email.nl',
    role: 'koper',
  },
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
