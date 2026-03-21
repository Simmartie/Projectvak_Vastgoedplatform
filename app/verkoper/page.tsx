'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPropertiesBySeller, Property } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Eye, Users, TrendingUp, Euro, Clock, MapPin, CheckCircle2, Calendar, Building2, Heart } from 'lucide-react'
import { PropertyImageCarousel } from '@/components/properties/property-image-carousel'

export default function VerkoperDashboard() {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user || user.role !== 'verkoper') {
      router.push('/')
      return
    }

    const loadProperties = async () => {
      const properties = await getPropertiesBySeller(user.id)
      if (properties.length > 0) {
        setProperty(properties[0])
      }
    }
    loadProperties()
  }, [router])

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Geen pand gevonden</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const getPhaseProgress = () => {
    const phases = ['intake', 'fotografie', 'online', 'bezichtigingen', 'onderhandeling', 'afgerond']
    const currentIndex = phases.indexOf(property.phase)
    return ((currentIndex + 1) / phases.length) * 100
  }

  const getPhaseLabel = (phase: string) => {
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

  const getPhaseDescription = (phase: string) => {
    const descriptions: Record<string, string> = {
      'intake': 'Uw pand wordt beoordeeld en de verkoopstrategie wordt bepaald',
      'fotografie': 'Professionele foto\'s en video\'s worden gemaakt',
      'online': 'Uw pand staat online en is zichtbaar voor potentiële kopers',
      'bezichtigingen': 'Bezichtigingen worden gepland en uitgevoerd',
      'onderhandeling': 'Biedingen worden besproken en onderhandeld',
      'afgerond': 'De verkoop is succesvol afgerond',
    }
    return descriptions[phase] || ''
  }

  const highestBid = property.bids.length > 0
    ? Math.max(...property.bids.map(b => b.amount))
    : 0

  const bidRange = property.bids.length > 0
    ? {
      min: Math.min(...property.bids.map(b => b.amount)),
      max: Math.max(...property.bids.map(b => b.amount)),
    }
    : null

  const visibleVisits = property.visits.filter(v => v.feedback && v.rating)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Mijn Verkoop</h2>
          <p className="text-muted-foreground">
            Volg de status van uw verkoop en beheer afspraken
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-64 h-48 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <PropertyImageCarousel
                      images={property.images}
                      alt={property.address}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{property.address}</h3>
                      <div className="flex items-center text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}, {property.postalCode}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="default">{property.status.replace('-', ' ')}</Badge>
                        <Badge variant="secondary">{property.type}</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Vraagprijs</p>
                      <p className="text-3xl font-bold text-primary">
                        €{property.price.toLocaleString('nl-NL')}
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <div className={`text-muted-foreground leading-relaxed whitespace-pre-line ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                        {property.description}
                      </div>
                      {property.description && property.description.length > 300 && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sm text-primary font-medium hover:underline"
                        >
                          {isDescriptionExpanded ? 'Minder weergeven ↑' : 'Meer weergeven ↓'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verkoopproces</CardTitle>
                <CardDescription>
                  Huidige fase: {getPhaseLabel(property.phase)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getPhaseLabel(property.phase)}</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(getPhaseProgress())}%
                    </span>
                  </div>
                  <Progress value={getPhaseProgress()} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {getPhaseDescription(property.phase)}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg text-center ${['intake', 'fotografie', 'online', 'bezichtigingen', 'onderhandeling', 'afgerond'].indexOf(property.phase) >= 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Intake</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${['fotografie', 'online', 'bezichtigingen', 'onderhandeling', 'afgerond'].indexOf(property.phase) >= 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Fotografie</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${['online', 'bezichtigingen', 'onderhandeling', 'afgerond'].indexOf(property.phase) >= 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Online</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${['bezichtigingen', 'onderhandeling', 'afgerond'].indexOf(property.phase) >= 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Bezichtigingen</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${['onderhandeling', 'afgerond'].indexOf(property.phase) >= 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Onderhandeling</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${property.phase === 'afgerond'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Afgerond</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bezichtigingen</CardTitle>
                <CardDescription>
                  Recent uitgevoerde bezichtigingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visibleVisits.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nog geen bezichtigingen gepland
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">Bezichtiging</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(visit.date).toLocaleDateString('nl-NL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          {visit.rating && (
                            <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                              <span className="text-lg">⭐</span>
                              <span className="font-medium text-primary">{visit.rating}/5</span>
                            </div>
                          )}
                        </div>
                        {visit.feedback && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Feedback:</p>
                            <p className="text-sm text-muted-foreground italic">
                              "{visit.feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {
              property.bids.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Biedingen</CardTitle>
                    <CardDescription>
                      Overzicht van ontvangen biedingen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {property.bids.map((bid) => (
                        <div
                          key={bid.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(bid.date).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                €{bid.amount.toLocaleString('nl-NL')}
                              </p>
                              <Badge variant={
                                bid.status === 'accepted' ? 'default' :
                                  bid.status === 'rejected' ? 'destructive' :
                                    'secondary'
                              }>
                                {bid.status === 'pending' ? 'In behandeling' :
                                  bid.status === 'accepted' ? 'Geaccepteerd' :
                                    'Afgewezen'}
                              </Badge>
                            </div>
                          </div>
                          {bid.comments && (
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                {bid.comments}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Favorieten</CardTitle>
                <CardDescription>
                  Huidige statistieken
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.views}</p>
                      <p className="text-xs text-muted-foreground">Weergaven</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{visibleVisits.length}</p>
                      <p className="text-xs text-muted-foreground">Bezichtigingen</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.interested}</p>
                      <p className="text-xs text-muted-foreground">Keer als favoriet aangeduid</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-background p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.bids.length}</p>
                      <p className="text-xs text-muted-foreground">Biedingen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {bidRange && (
              <Card>
                <CardHeader>
                  <CardTitle>Biedingen Range</CardTitle>
                  <CardDescription>
                    Spreiding van ontvangen biedingen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hoogste bieding</p>
                    <p className="text-2xl font-bold text-foreground">
                      €{bidRange.max.toLocaleString('nl-NL')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Laagste bieding</p>
                    <p className="text-lg font-medium">
                      €{bidRange.min.toLocaleString('nl-NL')}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Verschil met vraagprijs</p>
                    <p className={`text-lg font-medium ${highestBid >= property.price ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                      {highestBid >= property.price ? '+' : ''}
                      €{(highestBid - property.price).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>
                  Neem contact op met uw makelaar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Jan Janssen</p>
                    <p className="text-xs text-muted-foreground">Uw makelaar</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Heeft u vragen over het verkoopproces? Uw makelaar staat voor u klaar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
