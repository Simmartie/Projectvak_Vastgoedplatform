'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProperties, Property } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Eye, Users, TrendingUp, MapPin, MessageSquare, Euro, Search, Calendar, Heart, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MakelaarDashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'makelaar') {
      router.push('/')
      return
    }
    const loadProperties = async () => {
      const data = await getProperties()
      setProperties(data)
    }
    loadProperties()
  }, [router])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'te-koop': 'default',
      'onder-bod': 'secondary',
      'verkocht': 'outline',
    }
    return variants[status] || 'default'
  }

  const getPhaseBadge = (phase: string) => {
    const labels: Record<string, string> = {
      'intake': 'Intake',
      'fotografie': 'Fotografie',
      'online': 'Online',
      'bezichtigingen': 'Bezichtigingen',
      'onderhandeling': 'Onderhandeling',
      'afgerond': 'Afgerond',
    }
    return labels[phase] || phase
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.postalCode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || property.type === filterType
    const matchesPhase = filterPhase === 'all' || property.phase === filterPhase

    return matchesSearch && matchesType && matchesPhase
  }).sort((a, b) => {
    const aHas = a.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) ||
                  a.bids?.some(b => b.amount_suggestion || b.status_suggestion || b.comment_suggestion)
    const bHas = b.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) ||
                  b.bids?.some(b2 => b2.amount_suggestion || b2.status_suggestion || b2.comment_suggestion)
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    return 0
  })

  const totalViews = filteredProperties.reduce((sum, p) => sum + p.views, 0)
  const totalInterested = filteredProperties.reduce((sum, p) => sum + p.interested, 0)
  const totalBids = filteredProperties.reduce((sum, p) => sum + p.bids.length, 0)
  const activeProperties = filteredProperties.filter(p => p.status === 'te-koop').length

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-8 pb-48 md:pb-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard Overzicht</h2>
            <p className="text-muted-foreground">
              Beheer alle panden en dossiers
            </p>
          </div>
          {properties.some(p => 
            p.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) || 
            p.bids?.some(b => b.amount_suggestion || b.status_suggestion || b.comment_suggestion)
          ) && (
            <Link href="/makelaar/suggestions">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg">
                <AlertCircle className="h-4 w-4 mr-2" />
                Bekijk alle suggesties
                <span className="ml-2 flex h-2 w-2 rounded-full bg-white animate-pulse" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mobiele versie: 1 overkoepelend vak */}
        <div className="md:hidden mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Actieve Panden</div>
                    <div className="text-lg font-bold">
                      {activeProperties} <span className="text-xs font-normal text-muted-foreground">/{filteredProperties.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Weergaven</div>
                    <div className="text-lg font-bold">{totalViews}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Favorieten</div>
                    <div className="text-lg font-bold">{totalInterested}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Biedingen</div>
                    <div className="text-lg font-bold">{totalBids}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop versie: 4 losse vakken */}
        <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actieve Panden</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProperties}</div>
              <p className="text-xs text-muted-foreground">
                van {filteredProperties.length} totaal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Totaal Weergaven</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">
                online bekeken
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Geïnteresseerden</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInterested}</div>
              <p className="text-xs text-muted-foreground">
                keer als favoriet aangeduid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Biedingen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBids}</div>
              <p className="text-xs text-muted-foreground">
                openstaand
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op adres of locatie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
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

              <div>
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle fases</SelectItem>
                    <SelectItem value="intake">Intake</SelectItem>
                    <SelectItem value="fotografie">Fotografie</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="bezichtigingen">Bezichtigingen</SelectItem>
                    <SelectItem value="onderhandeling">Onderhandeling</SelectItem>
                    <SelectItem value="afgerond">Afgerond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'pand' : 'panden'} gevonden
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger className="text-foreground" value="all">Alle Panden</TabsTrigger>
            <TabsTrigger className="text-foreground" value="te-koop">Te Koop</TabsTrigger>
            <TabsTrigger className="text-foreground" value="onder-bod">Onder Bod</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 flex flex-wrap items-center gap-2">
                            {property.address}
                            {(property.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) ||
                              property.bids?.some(b => b.amount_suggestion || b.status_suggestion || b.comment_suggestion)) && (
                              <Link href={`/makelaar/property/${property.id}#suggesties`}>
                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0 flex items-center shrink-0">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Suggestie beoordelen
                                </Badge>
                              </Link>
                            )}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}, {property.postalCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            €{property.price.toLocaleString('nl-NL')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadge(property.status)}>
                          {property.status.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {getPhaseBadge(property.phase)}
                        </Badge>
                        <Badge variant="secondary">
                          {property.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{property.views} views</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{property.visits.length} bezoeken</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bids.length} biedingen</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>{property.interested} keer favoriet</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/makelaar/property/${property.id}`} className="flex-1">
                          <Button variant="default" className="w-full">
                            Bekijk Details
                          </Button>
                        </Link>
                        <Link href={`/makelaar/property/${property.id}#chat`}>
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProperties.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Geen panden gevonden</h3>
                  <p className="text-muted-foreground">
                    Probeer uw zoekcriteria aan te passen
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="te-koop" className="space-y-4">
            {filteredProperties.filter(p => p.status === 'te-koop').map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 flex flex-wrap items-center gap-2">
                            {property.address}
                            {(property.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) ||
                              property.bids?.some(b => b.amount_suggestion || b.status_suggestion || b.comment_suggestion)) && (
                              <Link href={`/makelaar/property/${property.id}#suggesties`}>
                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0 flex items-center shrink-0">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Suggestie beoordelen
                                </Badge>
                              </Link>
                            )}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.city}, {property.postalCode}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            €{property.price.toLocaleString('nl-NL')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {getPhaseBadge(property.phase)}
                        </Badge>
                        <Badge variant="secondary">
                          {property.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{property.views} views</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{property.visits.length} bezoeken</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bids.length} biedingen</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span>{property.interested} keer favoriet</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/makelaar/property/${property.id}`} className="flex-1">
                          <Button variant="default" className="w-full">
                            Bekijk Details
                          </Button>
                        </Link>
                        <Link href={`/makelaar/property/${property.id}#chat`}>
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProperties.filter(p => p.status === 'te-koop').length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Geen panden te koop gevonden</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="onder-bod" className="space-y-4">
            {filteredProperties.filter(p => p.status === 'onder-bod').length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Geen panden onder bod gevonden</p>
                </CardContent>
              </Card>
            ) : (
              filteredProperties.filter(p => p.status === 'onder-bod').map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={property.images[0] || "/placeholder.svg"}
                          alt={property.address}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-1 flex flex-wrap items-center gap-2">
                              {property.address}
                              {(property.visits?.some(v => v.feedback_suggestion || v.rating_suggestion) ||
                                property.bids?.some(b => b.amount_suggestion || b.status_suggestion || b.comment_suggestion)) && (
                                <Link href={`/makelaar/property/${property.id}#suggesties`}>
                                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-0 flex items-center shrink-0">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Suggestie beoordelen
                                  </Badge>
                                </Link>
                              )}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {property.city}, {property.postalCode}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              €{property.price.toLocaleString('nl-NL')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {getPhaseBadge(property.phase)}
                          </Badge>
                          <Badge variant="secondary">
                            {property.type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>{property.views} views</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{property.visits.length} bezoeken</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span>{property.bids.length} biedingen</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span>{property.interested} keer favoriet</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Link href={`/makelaar/property/${property.id}`} className="flex-1">
                            <Button variant="default" className="w-full">
                              Bekijk Details
                            </Button>
                          </Link>
                          <Link href={`/makelaar/property/${property.id}#chat`}>
                            <Button variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
