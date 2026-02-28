'use client'

import { AgendaView } from '@/components/agenda/agenda-view'
import { Header } from '@/components/header'
import { getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AgendaPage() {
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            router.push('/')
        }
    }, [router])

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <AgendaView />
            </main>
        </div>
    )
}
