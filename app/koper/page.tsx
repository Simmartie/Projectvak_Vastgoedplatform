'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { fetchProperties, Property } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, MapPin, Ruler, Euro, Search, MessageSquare, Heart, Map, List } from 'lucide-react'
import Link from 'next/link'
import { PROPERTY_COORDINATES } from '@/lib/properties'


export default function KoperDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPrice, setFilterPrice] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [idealLocation, setIdealLocation] = useState('')
  const [sortedByDistance, setSortedByDistance] = useState<Property[]>([])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'koper') {
      router.push('/')
      return
    }
    fetchProperties().then(setProperties).catch(() => setProperties([]))
  }, [router])

  const calculateDistance = (city1: string, city2: string): number => {
    // Mock distance calculation - in production this would use real geocoding
    const cityDistances: Record<string, Record<string, number>> = {
      'amsterdam': { 'amsterdam': 0, 'utrecht': 35, 'rotterdam': 60, 'den haag': 50 },
      'utrecht': { 'amsterdam': 35, 'utrecht': 0, 'rotterdam': 45, 'den haag': 55 },
      'rotterdam': { 'amsterdam': 60, 'utrecht': 45, 'rotterdam': 0, 'den haag': 20 },
      'den haag': { 'amsterdam': 50, 'utrecht': 55, 'rotterdam': 20, 'den haag': 0 }
    }
    const c1 = city1.toLowerCase()
    const c2 = city2.toLowerCase()
    return cityDistances[c1]?.[c2] ?? 100
  }

  useEffect(() => {
    if (idealLocation) {
      const sorted = [...filteredProperties].sort((a, b) => {
        const distA = calculateDistance(idealLocation, a.city)
        const distB = calculateDistance(idealLocation, b.city)
        return distA - distB
      })
      setSortedByDistance(sorted)
    } else {
      setSortedByDistance(filteredProperties)
    }
  }, [idealLocation, filterType, filterPrice, searchTerm, properties])

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || property.type === filterType

    let matchesPrice = true
    if (filterPrice === 'under-500k') {
      matchesPrice = property.price < 500000
    } else if (filterPrice === '500k-750k') {
      matchesPrice = property.price >= 500000 && property.price < 750000
    } else if (filterPrice === '750k-1m') {
      matchesPrice = property.price >= 750000 && property.price < 1000000
    } else if (filterPrice === 'over-1m') {
      matchesPrice = property.price >= 1000000
    }

    return matchesSearch && matchesType && matchesPrice && property.status === 'te-koop'
  })

  const displayProperties = idealLocation ? sortedByDistance : filteredProperties

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold">Beschikbare Panden</h2>
          </div>
          <p className="text-muted-foreground">
            Ontdek uw droomhuis en beheer uw afspraken
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op locatie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="mt-4">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle types</SelectItem>
                      <SelectItem value="huis">Huis</SelectItem>
                      <SelectItem value="appartement">Appartement</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4">
                  <Select value={filterPrice} onValueChange={setFilterPrice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prijsrange" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prijzen</SelectItem>
                      <SelectItem value="under-500k">Tot €500.000</SelectItem>
                      <SelectItem value="500k-750k">€500.000 - €750.000</SelectItem>
                      <SelectItem value="750k-1m">€750.000 - €1.000.000</SelectItem>
                      <SelectItem value="over-1m">Boven €1.000.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4">
                  <Input
                    placeholder="Ideale locatie (bijv. Amsterdam)"
                    value={idealLocation}
                    onChange={(e) => setIdealLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {displayProperties.length} {displayProperties.length === 1 ? 'pand' : 'panden'} gevonden
            {idealLocation && ` - gesorteerd op afstand tot ${idealLocation}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <List className="h-4 w-4 mr-2" />
              Lijst
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4 mr-2" />
              Kaart
            </Button>
          </div>
        </div>

        {
          viewMode === 'map' ? (
            <div className="grid md:grid-cols-[350px_1fr] gap-4">
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {displayProperties.map((property) => {
                  const distance = idealLocation ? calculateDistance(idealLocation, property.city) : null
                  return (
                    <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <img
                            src={property.images[0] || "/placeholder.svg"}
                            alt={property.address}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg">€{property.price.toLocaleString('nl-NL')}</p>
                            <p className="font-semibold truncate">{property.address}</p>
                            <p className="text-sm text-muted-foreground">{property.city}</p>
                            {distance !== null && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span className="text-sm font-medium text-primary">{distance} km</span>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded">{property.rooms} kamers</span>
                              <span className="text-xs bg-muted px-2 py-1 rounded">{property.area}m²</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/koper/property/${property.id}`}>
                          <Button size="sm" className="w-full mt-3">
                            Bekijk Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Card className="overflow-hidden">
                <div className="relative h-[calc(100vh-300px)] bg-muted">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 800 600"
                    style={{ background: '#f0f0f0' }}
                  >
                    {/* Background map outline of Belgium/Netherlands */}
                    <rect x="0" y="0" width="800" height="600" fill="#e8f4f8" />
                    <text x="400" y="30" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#333">
                      Kaartweergave
                    </text>

                    {/* Map all properties as markers */}
                    {displayProperties.map((property) => {
                      const coords = PROPERTY_COORDINATES[property.id]
                      if (!coords) return null

                      // Simple projection: scale lat/lng to SVG coordinates
                      // Belgium/Netherlands rough bounds: lat 50-53, lng 3-7
                      const x = ((coords.lng - 3) / (7 - 3)) * 700 + 50
                      const y = 550 - ((coords.lat - 50) / (53 - 50)) * 500

                      return (
                        <g key={property.id}>
                          {/* Marker pin */}
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill="#2563eb"
                            stroke="white"
                            strokeWidth="2"
                            style={{ cursor: 'pointer' }}
                          />
                          {/* City label */}
                          <text
                            x={x}
                            y={y + 20}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#333"
                            fontWeight="500"
                          >
                            {property.city}
                          </text>
                          {/* Price label */}
                          <text
                            x={x}
                            y={y + 33}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#666"
                          >
                            €{(property.price / 1000).toFixed(0)}k
                          </text>
                        </g>
                      )
                    })}

                    {/* Legend */}
                    <g transform="translate(20, 550)">
                      <rect x="0" y="0" width="200" height="40" fill="white" opacity="0.9" rx="5" />
                      <circle cx="15" cy="20" r="6" fill="#2563eb" stroke="white" strokeWidth="2" />
                      <text x="30" y="25" fontSize="12" fill="#333">
                        {displayProperties.length} panden
                      </text>
                    </g>
                  </svg>

                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">
                      {displayProperties.length} panden weergegeven
                    </p>
                    {idealLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Gesorteerd op afstand tot {idealLocation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayProperties.map((property) => {
                const distance = idealLocation ? calculateDistance(idealLocation, property.city) : null
                return (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
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
                          className="h-8 w-8 rounded-full backdrop-blur-sm hover:bg-background bg-primary"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="default" className="bg-background/90 backdrop-blur-sm text-foreground font-bold">
                          {property.type}
                        </Badge>
                      </div>
                      {distance !== null && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-primary text-primary-foreground font-bold">
                            {distance} km
                          </Badge>
                        </div>
                      )}
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

                      <div className="flex flex-wrap gap-1">
                        {property.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {property.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.features.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
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
                )
              })}
            </div>
          )
        }

        {
          displayProperties.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Geen panden gevonden</h3>
                <p className="text-muted-foreground">
                  Probeer uw zoekcriteria aan te passen
                </p>
              </CardContent>
            </Card>
          )
        }
      </main >
    </div >
  )
}
