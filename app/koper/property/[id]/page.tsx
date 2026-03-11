'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPropertyById, Property } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, MapPin, Ruler, Calendar, Zap, Home, Heart, MessageSquare, Phone, Mail, ArrowLeft, GraduationCap, Dumbbell, Bus, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { PropertyImageCarousel } from '@/components/properties/property-image-carousel'

export default function KoperPropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'koper') {
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

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted overflow-hidden relative rounded-t-lg">
                  <PropertyImageCarousel
                    images={property.images}
                    alt={property.address}
                    className="w-full h-full"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{property.address}</h1>
                      <div className="flex items-center text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}, {property.postalCode}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">{property.status.replace('-', ' ')}</Badge>
                        <Badge variant="secondary">{property.type}</Badge>
                        <Badge variant="outline">Label {property.energyLabel}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Vraagprijs</p>
                      <p className="text-3xl font-bold text-primary">
                        €{property.price.toLocaleString('nl-NL')}
                      </p>
                    </div>
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
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type woning</p>
                    <p className="font-medium capitalize">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bouwjaar</p>
                    <p className="font-medium">{property.buildYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Woonoppervlakte</p>
                    <p className="font-medium">{property.area}m²</p>
                  </div>
                  {property.plotSize && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Perceeloppervlakte</p>
                      <p className="font-medium">{property.plotSize}m²</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Energielabel</p>
                    <Badge variant="secondary">{property.energyLabel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aantal kamers</p>
                    <p className="font-medium">{property.rooms} kamers</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3">Bijzonderheden</p>
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
                <CardTitle>Omgeving</CardTitle>
                <CardDescription>Wat is er in de buurt?</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="schools" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="schools">Scholen</TabsTrigger>
                    <TabsTrigger value="sports">Sport</TabsTrigger>
                    <TabsTrigger value="transport">OV</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schools" className="space-y-3">
                    {(property.neighborhood?.schools || []).map((school: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-background p-2 rounded-lg">
                            <GraduationCap className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{school.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{school.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{school.distance}m</p>
                          {school.rating && (
                            <p className="text-xs text-muted-foreground">★ {school.rating}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="sports" className="space-y-3">
                    {(property.neighborhood?.sports || []).map((sport: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-background p-2 rounded-lg">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{sport.name}</p>
                            <p className="text-xs text-muted-foreground">{sport.type}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{sport.distance}m</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="transport" className="space-y-3">
                    {(property.neighborhood?.transport || []).map((transport: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-background p-2 rounded-lg">
                            <Bus className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm uppercase">{transport.type} {transport.line}</p>
                            <p className="text-xs text-muted-foreground">{transport.stop}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{transport.distance}m</p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="events" className="space-y-3">
                    {(property.neighborhood?.events || []).map((event: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-background p-2 rounded-lg">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{event.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">{event.frequency}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card id="chat" data-chat-card>
              <CardHeader>
                <CardTitle>Vragen over dit pand?</CardTitle>
                <CardDescription>Stel je vragen direct aan onze AI assistent</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface propertyId={property.id} role="koper" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interesse?</CardTitle>
                <CardDescription>
                  Neem contact op of plan een bezichtiging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" size="lg">
                  <Heart className="h-4 w-4 mr-2" />
                  Opslaan als favoriet
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/agenda?propertyId=${property.id}&title=Bezichtiging pand ${property.address}&sellerId=${property.sellerId}`}>
                    Plan Bezichtiging
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-primary text-card"
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

            <Card>
              <CardHeader>
                <CardTitle>Makelaar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground p-2 rounded-full h-12 w-12 flex items-center justify-center font-bold">
                    JJ
                  </div>
                  <div>
                    <p className="font-medium">Jan Janssen</p>
                    <p className="text-sm text-muted-foreground">Makelaar</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                    <a href="tel:0412345678">
                      <Phone className="h-4 w-4 mr-2" />
                      Bel direct
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                    <a href="mailto:jan@makelaardij.nl">
                      <Mail className="h-4 w-4 mr-2" />
                      Stuur e-mail
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Removed the extra image grid card */}
          </div>
        </div>
      </main>
    </div>
  )
}
