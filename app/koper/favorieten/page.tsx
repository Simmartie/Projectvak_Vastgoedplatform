'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Property } from '@/lib/properties'
import { getFavoritesForUser, toggleFavorite } from '@/lib/favorites'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Heart, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function KoperFavorieten() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'koper') {
      router.push('/')
      return
    }
    const loadProperties = async () => {
      const data = await getFavoritesForUser(user.id)
      setProperties(data)
      setLoading(false)
    }
    loadProperties()
  }, [router])

  const handleToggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user || isTogglingFavorite[propertyId]) return

    // Optimistic removal
    setIsTogglingFavorite(prev => ({ ...prev, [propertyId]: true }))
    setProperties(prev => prev.filter(p => p.id !== propertyId))

    const newFavStatus = await toggleFavorite(user.id, propertyId, true)
    
    if (newFavStatus === true) {
      // Revert if API call failed (re-fetch needed realistically, but we try to keep it simple)
      const data = await getFavoritesForUser(user.id)
      setProperties(data)
    }
    setIsTogglingFavorite(prev => ({ ...prev, [propertyId]: false }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/koper">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold">Mijn Favorieten</h2>
          </div>
          <p className="text-muted-foreground">
            Een overzicht van alle panden die u heeft bewaard.
          </p>
        </div>

        {loading ? (
          <div>Laden...</div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Geen favorieten gevonden</h3>
              <p className="text-muted-foreground">
                Sla panden op als favoriet om ze hier te bekijken
              </p>
              <Button asChild className="mt-4">
                 <Link href="/koper">Ontdek panden</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer" onClick={() => router.push(`/koper/property/${property.id}`)}>
                <div className="relative aspect-video bg-muted overflow-hidden">
                  <img
                    src={property.images[0] || "/placeholder.svg"}
                    alt={property.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full backdrop-blur-sm transition-colors bg-red-50 hover:bg-red-100 text-red-500"
                      onClick={(e) => handleToggleFavorite(property.id, e)}
                      disabled={isTogglingFavorite[property.id]}
                    >
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="default" className="bg-background/90 backdrop-blur-sm text-foreground font-bold">
                      {property.type}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div>
                    <p className="text-2xl font-bold mb-1 text-foreground">
                      €{property.price.toLocaleString('nl-NL')}
                    </p>
                    <h3 className="font-semibold text-lg mb-1">{property.address}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.city}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y text-center">
                    <div>
                      <p className="text-lg font-semibold">{property.rooms}</p>
                      <p className="text-xs text-muted-foreground">Kamers</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{property.bedrooms}</p>
                      <p className="text-xs text-muted-foreground">Slaapk.</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{property.area}m²</p>
                      <p className="text-xs text-muted-foreground">Oppervlak</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/koper/property/${property.id}`} className="flex-1">
                      <Button variant="default" className="w-full">
                        Bekijk Details
                      </Button>
                    </Link>
                    <Link href={`/koper/property/${property.id}#chat`}>
                      <Button variant="outline" size="icon">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
