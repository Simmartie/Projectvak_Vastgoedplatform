'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OptimmoLogo } from '@/components/optimmo-logo'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const user = login(email)

    if (user) {
      switch (user.role) {
        case 'makelaar':
          router.push('/makelaar')
          break
        case 'verkoper':
          router.push('/verkoper')
          break
        case 'koper':
          router.push('/koper')
          break
      }
    } else {
      setError('Ongeldig e-mailadres. Gebruik een van de demo accounts.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <OptimmoLogo width={280} />
          </div>
          <CardDescription>
            Log in om uw dossiers te bekijken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="uw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Inloggen
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Demo accounts:
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-md bg-secondary">
                <p className="font-medium">Makelaar</p>
                <p className="text-muted-foreground">jan@makelaardij.nl</p>
              </div>
              <div className="p-3 rounded-md bg-secondary">
                <p className="font-medium">Verkoper</p>
                <p className="text-muted-foreground">daan@email.nl</p>
              </div>
              <div className="p-3 rounded-md bg-secondary">
                <p className="font-medium">Koper</p>
                <p className="text-muted-foreground">pieter@email.nl</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
