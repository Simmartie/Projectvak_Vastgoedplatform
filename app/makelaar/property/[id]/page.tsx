'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser, MOCK_USERS } from '@/lib/auth'
import { getPropertyById, Property } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, MapPin, Ruler, Calendar, Zap, TrendingUp, Eye, Users, Star, MessageSquare, Euro, Home, GraduationCap, Dumbbell, Bus, CalendarDays, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { EditPropertyModal } from '@/components/properties/edit-property-modal'
import { PropertyImageCarousel } from '@/components/properties/property-image-carousel'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'makelaar') {
      router.push('/')
      return
    }

    const loadProperty = async () => {
      const prop = await getPropertyById(params.id as string)
      if (prop) {
        setProperty(prop)
      }
    }
    loadProperty()
  }, [router, params.id])

  if (!property) {
    return <div>Loading...</div>
  }

  const avgBidAmount = property.bids.length > 0
    ? property.bids.reduce((sum, bid) => sum + bid.amount, 0) / property.bids.length
    : 0

  const seller = MOCK_USERS.find(u => u.id === property.sellerId)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/makelaar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar overzicht
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <PropertyImageCarousel
                    images={property.images}
                    alt={property.address}
                    className="w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{property.address}</h1>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}, {property.postalCode}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-3xl font-bold text-primary">
                        €{property.price.toLocaleString('nl-NL')}
                      </p>
                      {property.previousPrice && property.previousPrice !== property.price && (
                        <p className={`text-sm mt-1 font-medium ${property.price > property.previousPrice ? 'text-destructive' : 'text-green-600'}`}>
                          {property.price > property.previousPrice ? '+' : ''}€{(property.price - property.previousPrice).toLocaleString('nl-NL')} tov vorige prijs
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="default">{property.status.replace('-', ' ')}</Badge>
                    <Badge variant="outline">{property.phase}</Badge>
                    <Badge variant="secondary">{property.type}</Badge>
                  </div>

                  <div className="mb-6">
                    <div className={`text-muted-foreground leading-relaxed whitespace-pre-line ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                      {property.description}
                    </div>
                    {property.description.length > 300 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-2 text-sm text-primary font-medium hover:underline"
                      >
                        {isDescriptionExpanded ? 'Minder weergeven ↑' : 'Meer weergeven ↓'}
                      </button>
                    )}
                  </div>


                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <Home className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{property.rooms}</p>
                      <p className="text-xs text-muted-foreground">Kamers</p>
                    </div>
                    <div className="text-center">
                      <Building2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{property.bedrooms}</p>
                      <p className="text-xs text-muted-foreground">Slaapkamers</p>
                    </div>
                    <div className="text-center">
                      <Ruler className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{property.area}m²</p>
                      <p className="text-xs text-muted-foreground">Woonoppervlak</p>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{property.buildYear}</p>
                      <p className="text-xs text-muted-foreground">Bouwjaar</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kenmerken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Energielabel</p>
                    <p className="font-medium">{property.energyLabel}</p>
                  </div>
                  {property.plotSize && (
                    <div>
                      <p className="text-sm text-muted-foreground">Perceel</p>
                      <p className="font-medium">{property.plotSize}m²</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{property.status}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">Eigenschappen</p>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, index) => (
                      <Badge key={index} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bezichtigingen ({property.visits.length})</CardTitle>
                <CardDescription>
                  Overzicht van alle bezichtigingen met feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.visits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nog geen bezichtigingen gepland
                  </p>
                ) : (
                  property.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{visit.buyerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {visit.date ? new Date(visit.date).toLocaleDateString('nl-NL') : 'Onbekende datum'}
                          </p>
                        </div>
                        {visit.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{visit.rating}/5</span>
                          </div>
                        )}
                      </div>
                      {visit.feedback && (
                        <p className="text-sm text-muted-foreground">
                          "{visit.feedback}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biedingen ({property.bids.length})</CardTitle>
                <CardDescription>
                  Alle ontvangen biedingen voor dit pand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.bids.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nog geen biedingen ontvangen
                  </p>
                ) : (
                  property.bids.map((bid) => (
                    <div
                      key={bid.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{bid.buyerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {bid.date ? new Date(bid.date).toLocaleDateString('nl-NL') : ((bid as any).created_at ? new Date((bid as any).created_at).toLocaleDateString('nl-NL') : 'Onbekende datum')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            €{bid.amount.toLocaleString('nl-NL')}
                          </p>
                          <Badge variant={
                            bid.status === 'accepted' ? 'default' :
                              bid.status === 'rejected' ? 'destructive' :
                                'secondary'
                          }>
                            {bid.status}
                          </Badge>
                        </div>
                      </div>
                      {bid.comments && (
                        <p className="text-sm text-muted-foreground">
                          {bid.comments}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Omgeving</CardTitle>
                <CardDescription>Informatie over de buurt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">Scholen</h4>
                  </div>
                  <div className="space-y-2">
                    {(property.neighborhood?.schools || []).map((school: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{school.name}</p>
                          <p className="text-xs text-muted-foreground">{school.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{school.distance}m</p>
                          {school.rating && (
                            <p className="text-xs text-card-foreground">★ {school.rating}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">Sportclubs</h4>
                  </div>
                  <div className="space-y-2">
                    {(property.neighborhood?.sports || []).map((sport: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{sport.name}</p>
                          <p className="text-xs text-muted-foreground">{sport.type}</p>
                        </div>
                        <p className="text-sm font-medium">{sport.distance}m</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Bus className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">Openbaar Vervoer</h4>
                  </div>
                  <div className="space-y-2">
                    {(property.neighborhood?.transport || []).map((transport: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{transport.type.toUpperCase()} {transport.line}</p>
                          <p className="text-xs text-muted-foreground">{transport.stop}</p>
                        </div>
                        <p className="text-sm font-medium">{transport.distance}m</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">Evenementen</h4>
                  </div>
                  <div className="space-y-2">
                    {(property.neighborhood?.events || []).map((event: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.frequency}</p>
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="chat" data-chat-card>
              <CardHeader>
                <CardTitle>Vragen over dit dossier?</CardTitle>
                <CardDescription>Stel je vragen direct aan onze AI assistent</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface propertyId={property.id} role="makelaar" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistieken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Weergaven</span>
                  </div>
                  <span className="font-bold">{property.views}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Bezichtigingen</span>
                  </div>
                  <span className="font-bold">{property.visits.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Geïnteresseerd</span>
                  </div>
                  <span className="font-bold">{property.interested}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Biedingen</span>
                  </div>
                  <span className="font-bold">{property.bids.length}</span>
                </div>

                {avgBidAmount > 0 && (
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Gemiddeld bod</p>
                    <p className="text-xl font-bold text-foreground">
                      €{avgBidAmount.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verkoper (Eigenaar)</CardTitle>
                <CardDescription>Contactgegevens van de eigenaar</CardDescription>
              </CardHeader>
              <CardContent>
                {seller ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="bg-primary text-primary-foreground p-2 rounded-full h-12 w-12 flex items-center justify-center font-bold uppercase">
                      {seller.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen verkoper gekoppeld</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  Bewerk Pand
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/agenda?propertyId=${property.id}&title=Bezichtiging pand ${property.address}&sellerId=${property.sellerId}`}>
                    Plan Bezichtiging
                  </Link>
                </Button>
                <Button
                  className="w-full bg-primary text-card"
                  variant="outline"
                  onClick={() => {
                    const chatCard = document.querySelector('[data-chat-card]') as HTMLElement;
                    if (chatCard) {
                      chatCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open AI Chatbot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <EditPropertyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          property={property}
          onSave={setProperty}
        />
      </main>
    </div>
  )
}
