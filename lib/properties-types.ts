export interface School {
    name: string
    type: 'basisonderwijs' | 'middelbaar' | 'mbo' | 'hbo'
    distance: number
    rating?: number
}

export interface SportsClub {
    name: string
    type: string
    distance: number
}

export interface Transport {
    type: 'bus' | 'tram' | 'trein' | 'metro'
    line: string
    stop: string
    distance: number
}

export interface Event {
    name: string
    frequency: string
    description: string
}

export interface NeighborhoodInfo {
    schools: School[]
    sports: SportsClub[]
    transport: Transport[]
    events: Event[]
}

export interface Visit {
    id: string
    date: string
    buyerId: string
    buyerName: string
    feedback?: string
    rating?: number
}

export interface Bid {
    id: string
    amount: number
    buyerId: string
    buyerName: string
    date: string
    status: 'pending' | 'accepted' | 'rejected'
    comments?: string
}
