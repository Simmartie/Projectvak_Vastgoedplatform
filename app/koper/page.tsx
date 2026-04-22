'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProperties, Property } from '@/lib/properties'
import { getUserFavoriteIds, toggleFavorite } from '@/lib/favorites'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, MapPin, Ruler, Euro, Search, MessageSquare, Heart, Map, List, Navigation } from 'lucide-react'
import Link from 'next/link'
import { CITY_COORDINATES } from '@/lib/properties'
import dynamic from 'next/dynamic'

// Dynamically import map to avoid SSR issues with Leaflet
const PropertyMap = dynamic(() => import('@/components/map/property-map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[calc(100vh-300px)] bg-muted animate-pulse rounded-lg flex items-center justify-center"><p className="text-muted-foreground">Kaart laden...</p></div>
})

export default function KoperDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPrice, setFilterPrice] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [idealLocation, setIdealLocation] = useState('')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [sortedByDistance, setSortedByDistance] = useState<Property[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'koper') {
      router.push('/')
      return
    }
    const loadData = async () => {
      const data = await getProperties()
      setProperties(data)
      const favs = await getUserFavoriteIds(user.id)
      setFavoriteIds(new Set(favs))
    }
    loadData()
  }, [router])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance in kilometers
    const R = 6371 
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  // Get haversine distance between reference location and a property city
  const getDistanceToProperty = (property: Property): number | null => {
    const propertyCoords = CITY_COORDINATES[property.city.toLowerCase()]
    if (!propertyCoords) return null

    // Priority 1: Use GPS location
    if (userLocation) {
      return calculateDistance(userLocation.lat, userLocation.lng, propertyCoords.lat, propertyCoords.lng)
    }

    // Priority 2: Use typed ideal location city name
    if (idealLocation && idealLocation !== 'Huidige locatie') {
      const referenceCoords = CITY_COORDINATES[idealLocation.toLowerCase()]
      if (referenceCoords) {
        return calculateDistance(referenceCoords.lat, referenceCoords.lng, propertyCoords.lat, propertyCoords.lng)
      }
    }

    return null
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund door uw browser')
      return
    }
    
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setIdealLocation('Huidige locatie')
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Kan uw locatie niet ophalen. Controleer of u toestemming heeft gegeven.')
        setIsLocating(false)
      }
    )
  }

  useEffect(() => {
    if (userLocation || idealLocation) {
      const sorted = [...filteredProperties].sort((a, b) => {
        let distA = Infinity
        let distB = Infinity
        
        const coordsA = CITY_COORDINATES[a.city.toLowerCase()]
        const coordsB = CITY_COORDINATES[b.city.toLowerCase()]

        // Priority 1: GPS location
        if (userLocation) {
          if (coordsA) distA = calculateDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng)
          if (coordsB) distB = calculateDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng)
        // Priority 2: typed city name
        } else if (idealLocation && idealLocation !== 'Huidige locatie') {
          const refCoords = CITY_COORDINATES[idealLocation.toLowerCase()]
          if (refCoords) {
            if (coordsA) distA = calculateDistance(refCoords.lat, refCoords.lng, coordsA.lat, coordsA.lng)
            if (coordsB) distB = calculateDistance(refCoords.lat, refCoords.lng, coordsB.lat, coordsB.lng)
          }
        }
        return distA - distB
      })
      setSortedByDistance(sorted)
    } else {
      setSortedByDistance(filteredProperties)
    }
  }, [userLocation, idealLocation, filterType, filterPrice, searchTerm, properties])

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

  const displayPropertiesBase = idealLocation ? sortedByDistance : filteredProperties
  
  const displayProperties = [...displayPropertiesBase].sort((a, b) => {
    const isFavA = favoriteIds.has(a.id)
    const isFavB = favoriteIds.has(b.id)

    // When a location is set, sort by distance first
    if (userLocation || idealLocation) {
      const distA = getDistanceToProperty(a) ?? Infinity
      const distB = getDistanceToProperty(b) ?? Infinity
      if (distA !== distB) return distA - distB
      // Favorites as tiebreaker
      if (isFavA && !isFavB) return -1
      if (!isFavA && isFavB) return 1
      return 0
    }

    // Without location, favorites come first
    if (isFavA && !isFavB) return -1
    if (!isFavA && isFavB) return 1
    return 0
  })

  const handleToggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const user = getCurrentUser()
    if (!user || isTogglingFavorite[propertyId]) return

    const isCurrentlyFavorited = favoriteIds.has(propertyId)
    
    // Optimistic update
    setIsTogglingFavorite(prev => ({ ...prev, [propertyId]: true }))
    setFavoriteIds(prev => {
      const newFavs = new Set(prev)
      if (isCurrentlyFavorited) newFavs.delete(propertyId)
      else newFavs.add(propertyId)
      return newFavs
    })

    const newFavStatus = await toggleFavorite(user.id, propertyId, isCurrentlyFavorited)
    
    // Revert if API call failed
    if (newFavStatus === isCurrentlyFavorited) {
      setFavoriteIds(prev => {
        const newFavs = new Set(prev)
        if (isCurrentlyFavorited) newFavs.add(propertyId)
        else newFavs.delete(propertyId)
        return newFavs
      })
    }
    setIsTogglingFavorite(prev => ({ ...prev, [propertyId]: false }))
  }

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

                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Ideale locatie (bijv. Amsterdam)"
                    value={idealLocation}
                    onChange={(e) => {
                      setIdealLocation(e.target.value)
                      if (e.target.value === '') setUserLocation(null) // Reset on clear
                    }}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    title="Gebruik mijn huidige locatie"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                  >
                    <Navigation className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
                  </Button>
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
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-2">
                {displayProperties.map((property) => {
                  const distance = getDistanceToProperty(property)
                  
                  return (
                    <Card key={property.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/koper/property/${property.id}`)}>
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
                        <div onClick={(e) => e.stopPropagation()}>
                          <Link href={`/koper/property/${property.id}`}>
                            <Button size="sm" className="w-full mt-3">
                              Bekijk Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="relative">
                <PropertyMap 
                  properties={displayProperties} 
                  userLocation={userLocation}
                  idealLocation={idealLocation}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayProperties.map((property) => {
                const distance = getDistanceToProperty(property)
                
                return (
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
                          className={`h-8 w-8 rounded-full backdrop-blur-sm transition-colors ${favoriteIds.has(property.id) ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'hover:bg-background bg-primary text-white'}`}
                          onClick={(e) => handleToggleFavorite(property.id, e)}
                          disabled={isTogglingFavorite[property.id]}
                        >
                          <Heart className="h-4 w-4" fill={favoriteIds.has(property.id) ? "currentColor" : "none"} />
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
