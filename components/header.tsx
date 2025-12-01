'use client'

import { Building2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Header() {
  const user = getCurrentUser()
  const router = useRouter()

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

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Vastgoed Platform</h1>
            <p className="text-sm text-muted-foreground">{getRoleLabel()} Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
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
