'use client'

import { AgendaView } from '@/components/agenda/agenda-view'
import { Header } from '@/components/header'
import { getCurrentUser } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

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
                <Suspense fallback={<div className="flex h-full items-center justify-center p-8">Loading kalender...</div>}>
                    <AgendaView />
                </Suspense>
            </main>
        </div>
    )
}
