'use client'

import { Building2, LogOut, Calendar, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, logout } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export function Header() {
  const user = getCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'makelaar':
        return 'Makelaar'
      case 'verkoper':
        return 'Verkoper'
      case 'koper':
        return 'Koper'
      default:
        return ''
    }
  }

  const dashboardUrl = user?.role ? `/${user.role}` : '/'

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={dashboardUrl} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Vastgoed Platform</h1>
            <p className="text-sm text-muted-foreground">{getRoleLabel()} Dashboard</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {pathname === '/agenda' ? (
            <Link href={dashboardUrl}>
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug naar Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda
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
  )
}
