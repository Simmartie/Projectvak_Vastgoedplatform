'use client'

import React, { useState, useEffect } from 'react'
import { LogOut, Calendar, ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, logout } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { OptimmoLogo } from '@/components/optimmo-logo'

export function Header() {
  const user = getCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (user?.role === 'makelaar') {
      const script = document.createElement('script')
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed"
      script.async = true
      document.body.appendChild(script)

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script)
        }
      }
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const dashboardUrl = isMounted && user?.role ? `/${user.role}` : '/'

  return (
    <>
      <header className="border-b bg-card relative z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={dashboardUrl} className="flex items-center hover:opacity-80 transition-opacity">
            <OptimmoLogo width={120} />
          </Link>

          <div className="flex items-center gap-4">
            {user?.role === 'koper' && pathname !== '/koper/favorieten' && (
              <Link href="/koper/favorieten">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Heart className="h-4 w-4 mr-2" fill="currentColor" />
                  Favorieten
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Heart className="h-4 w-4" fill="currentColor" />
                </Button>
              </Link>
            )}

            {pathname === '/agenda' ? (
              <Link href={dashboardUrl}>
                <Button variant="ghost" size="sm" className="flex">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Terug naar Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link href="/agenda">
                <Button variant="ghost" size="sm" className="flex">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agenda</span>
                </Button>
              </Link>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Raw ElevenLabs Widget Component */}
      {isMounted && user?.role === 'makelaar' && (
        React.createElement('elevenlabs-convai', { 'agent-id': 'agent_2801kjykbap2e8pr6s76tpcw9pms' })
      )}
    </>
  )
}
