'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAllProperties, Property, PROPERTY_COORDINATES, CITY_COORDINATES, calculateDistance } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PropertyMap } from '@/components/property-map'
import { MapPin, Search, Navigation, Euro, Ruler, BedDouble } from 'lucide-react'
import Link from 'next/link'

export default function KoperMapView() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [location, setLocation] = useState('')
  const [centerCoords, setCenterCoords] = useState({ lat: 52.3676, lng: 4.9041 }) // Default Amsterdam
  const [sortedProperties, setSortedProperties] = useState<(Property & { distance: number })[]>([])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'koper') {
      router.push('/')
      return
    }
    setProperties(getAllProperties().filter(p => p.status === 'te-koop'))
  }, [router])

  useEffect(() => {
    // Calculate distances and sort
    const propertiesWithDistance = properties
      .map(property => {
        const coords = PROPERTY_COORDINATES[property.id]
        if (!coords) return null
        
        const distance = calculateDistance(
          centerCoords.lat,
          centerCoords.lng,
          coords.lat,
          coords.lng
        )
        
        return { ...property, distance }
      })
      .filter((p): p is Property & { distance: number } => p !== null)
      .sort((a, b) => a.distance - b.distance)
    
    setSortedProperties(propertiesWithDistance)
  }, [properties, centerCoords])

  const handleSearch = () => {
    const searchLower = location.toLowerCase().trim()
    const coords = CITY_COORDINATES[searchLower]
    
    if (coords) {
      setCenterCoords(coords)
    } else {
      // Default to Amsterdam if city not found
      setCenterCoords({ lat: 52.3676, lng: 4.9041 })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Panden bij mij in de buurt</h2>
          <p className="text-muted-foreground">
            Vind panden gesorteerd op afstand tot uw gewenste locatie
          </p>
        </div>

        {/* Search bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Voer uw gewenste locatie in (bijv. Hasselt, Leuven, Amsterdam)..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Zoeken
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[400px,1fr] gap-6">
          {/* Property list sidebar */}
          <div className="space-y-4 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">
                {sortedProperties.length} {sortedProperties.length === 1 ? 'pand' : 'panden'} gevonden
              </p>
              <Badge variant="outline" className="gap-1">
                <Navigation className="h-3 w-3" />
                Gesorteerd op afstand
              </Badge>
            </div>

            {sortedProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{property.address}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {property.distance.toFixed(1)} km
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.city}
                      </div>

                      <p className="text-lg font-bold mb-2">
                        €{property.price.toLocaleString('nl-NL')}
                      </p>

                      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {property.bedrooms}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {property.area}m²
                        </div>
                      </div>

                      <Link href={`/koper/property/${property.id}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          Bekijk Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sortedProperties.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Geen panden beschikbaar in dit gebied
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map view */}
          <Card className="lg:h-[calc(100vh-280px)]">
            <PropertyMap
              properties={sortedProperties}
              centerLat={centerCoords.lat}
              centerLng={centerCoords.lng}
              onPropertyClick={(id) => router.push(`/koper/property/${id}`)}
            />
          </Card>
        </div>
      </main>
    </div>
  )
}
