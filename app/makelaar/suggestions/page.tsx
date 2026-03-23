'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProperties, Property, updateVisit, updateBid } from '@/lib/properties'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Check, X, ArrowLeft, Building2, User, Star, TrendingUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface CombinedSuggestion {
  id: string
  type: 'visit' | 'bid'
  propertyId: string
  propertyAddress: string
  propertyName: string
  buyerName: string
  date: string
  originalData: any
  suggestionData: {
    feedback?: string
    rating?: number
    amount?: number
    status?: string
    comments?: string
  }
}

export default function SuggestionsOverview() {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<CombinedSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const user = getCurrentUser()
    if (!user || user.role !== 'makelaar') {
      router.push('/')
      return
    }

    const properties = await getProperties()
    const allSuggestions: CombinedSuggestion[] = []

    properties.forEach(prop => {
      // Collect visit suggestions
      prop.visits.forEach(visit => {
        if (visit.feedback_suggestion || visit.rating_suggestion) {
          allSuggestions.push({
            id: visit.id,
            type: 'visit',
            propertyId: prop.id,
            propertyAddress: prop.address,
            propertyName: `${prop.address}, ${prop.city}`,
            buyerName: visit.buyerName || 'Onbekende koper',
            date: visit.date || '',
            originalData: visit,
            suggestionData: {
              feedback: visit.feedback_suggestion || undefined,
              rating: visit.rating_suggestion || undefined
            }
          })
        }
      })

      // Collect bid suggestions
      prop.bids.forEach(bid => {
        if (bid.amount_suggestion || bid.status_suggestion || bid.comment_suggestion) {
          allSuggestions.push({
            id: bid.id,
            type: 'bid',
            propertyId: prop.id,
            propertyAddress: prop.address,
            propertyName: `${prop.address}, ${prop.city}`,
            buyerName: bid.buyerName || 'Onbekende koper',
            date: bid.date || '',
            originalData: bid,
            suggestionData: {
              amount: bid.amount_suggestion || undefined,
              status: bid.status_suggestion || undefined,
              comments: bid.comment_suggestion || undefined
            }
          })
        }
      })
    })

    setSuggestions(allSuggestions)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [router])

  const handleAcceptOne = async (sugg: CombinedSuggestion) => {
    try {
      if (sugg.type === 'visit') {
        const updates: any = {
          feedback: sugg.suggestionData.feedback || sugg.originalData.feedback,
          rating: sugg.suggestionData.rating || sugg.originalData.rating,
          feedback_suggestion: null,
          rating_suggestion: null
        }
        await updateVisit(sugg.id, updates)
      } else {
        const updates: any = {
          amount: sugg.suggestionData.amount ?? sugg.originalData.amount,
          status: sugg.suggestionData.status ?? sugg.originalData.status,
          comments: sugg.suggestionData.comments ?? sugg.originalData.comments,
          amount_suggestion: null,
          status_suggestion: null,
          comment_suggestion: null
        }
        await updateBid(sugg.id, updates)
      }
      setSuggestions(prev => prev.filter(s => s.id !== sugg.id))
    } catch (error) {
      console.error("Failed to accept suggestion", error)
    }
  }

  const handleRejectOne = async (sugg: CombinedSuggestion) => {
    try {
      if (sugg.type === 'visit') {
        const updates: any = {
          feedback_suggestion: null,
          rating_suggestion: null
        }
        await updateVisit(sugg.id, updates)
      } else {
        const updates: any = {
          amount_suggestion: null,
          status_suggestion: null,
          comment_suggestion: null
        }
        await updateBid(sugg.id, updates)
      }
      setSuggestions(prev => prev.filter(s => s.id !== sugg.id))
    } catch (error) {
      console.error("Failed to reject suggestion", error)
    }
  }

  const handleAcceptAll = async () => {
    try {
      const promises = suggestions.map(s => {
        if (s.type === 'visit') {
          const updates: any = {
            feedback: s.suggestionData.feedback || s.originalData.feedback,
            rating: s.suggestionData.rating || s.originalData.rating,
            feedback_suggestion: null,
            rating_suggestion: null
          }
          return updateVisit(s.id, updates)
        } else {
          const updates: any = {
            amount: s.suggestionData.amount ?? s.originalData.amount,
            status: s.suggestionData.status ?? s.originalData.status,
            comments: s.suggestionData.comments ?? s.originalData.comments,
            amount_suggestion: null,
            status_suggestion: null,
            comment_suggestion: null
          }
          return updateBid(s.id, updates)
        }
      })
      await Promise.all(promises)
      setSuggestions([])
    } catch (error) {
      console.error("Failed to accept all suggestions", error)
    }
  }

  const handleRejectAll = async () => {
    try {
      const promises = suggestions.map(s => {
        if (s.type === 'visit') {
          const updates: any = {
            feedback_suggestion: null,
            rating_suggestion: null
          }
          return updateVisit(s.id, updates)
        } else {
          const updates: any = {
            amount_suggestion: null,
            status_suggestion: null,
            comment_suggestion: null
          }
          return updateBid(s.id, updates)
        }
      })
      await Promise.all(promises)
      setSuggestions([])
    } catch (error) {
      console.error("Failed to reject all suggestions", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
           <div className="flex items-center justify-center h-64">
             <p className="text-muted-foreground">Laden...</p>
           </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-8 pb-48 md:pb-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
             <Link href="/makelaar">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold font-heading">Alle Suggesties</h1>
          </div>
          
          {suggestions.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleAcceptAll} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-4 w-4 mr-2" />
                Alles Goedkeuren
              </Button>
              <Button onClick={handleRejectAll} variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Alles Afwijzen
              </Button>
            </div>
          )}
        </div>

        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Geen openstaande suggesties</h2>
              <p className="text-muted-foreground">
                Er zijn momenteel geen suggesties van de AI assistent die beoordeeld moeten worden.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/makelaar">Terug naar Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {suggestions.map((sugg) => (
              <Card key={sugg.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900/50 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-white/50 dark:bg-black/20 border-amber-300">
                              {sugg.type === 'visit' ? 'Bezichtiging Feedback' : 'Bieding Update'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {sugg.date ? new Date(sugg.date).toLocaleDateString('nl-NL') : 'Onbekende datum'}
                            </span>
                          </div>
                          <Link href={`/makelaar/property/${sugg.propertyId}`} className="group inline-block">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              {sugg.propertyName}
                            </h3>
                          </Link>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {sugg.buyerName}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/60 dark:bg-black/30 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        {sugg.type === 'visit' && (
                          <div className="space-y-3">
                            {sugg.suggestionData.rating && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Beoordeling:</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-bold">{sugg.suggestionData.rating}/5</span>
                                  <span className="text-xs text-muted-foreground ml-1">(voorheen {sugg.originalData.rating || 'geen'})</span>
                                </div>
                              </div>
                            )}
                            {sugg.suggestionData.feedback && (
                              <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Voorgestelde feedback:
                                </p>
                                <p className="text-sm italic text-amber-900 dark:text-amber-100 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded">
                                  "{sugg.suggestionData.feedback}"
                                </p>
                                {sugg.originalData.feedback && (
                                  <p className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-muted">
                                    Huidige feedback: "{sugg.originalData.feedback}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {sugg.type === 'bid' && (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                              {sugg.suggestionData.amount && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Bieding:</span>
                                  <span className="font-bold text-primary text-lg">
                                    €{sugg.suggestionData.amount.toLocaleString('nl-NL')}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">(voorheen €{sugg.originalData.amount.toLocaleString('nl-NL')})</span>
                                </div>
                              )}
                              {sugg.suggestionData.status && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Status:</span>
                                  <Badge className={
                                    sugg.suggestionData.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100' :
                                    sugg.suggestionData.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100' : ''
                                  }>
                                    {sugg.suggestionData.status === 'accepted' ? 'Geaccepteerd' : 
                                     sugg.suggestionData.status === 'rejected' ? 'Afgewezen' : 'In behandeling'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground ml-1">(voorheen {sugg.originalData.status})</span>
                                </div>
                              )}
                            </div>
                            {sugg.suggestionData.comments && (
                              <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Voorgesteld commentaar:
                                </p>
                                <p className="text-sm italic text-amber-900 dark:text-amber-100 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded">
                                  "{sugg.suggestionData.comments}"
                                </p>
                                {sugg.originalData.comments && (
                                  <p className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-muted">
                                    Huidig commentaar: "{sugg.originalData.comments}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 justify-end md:min-w-[140px]">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none shadow-sm h-11"
                        onClick={() => handleAcceptOne(sugg)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Goedkeuren
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1 md:flex-none shadow-sm h-11 bg-white"
                        onClick={() => handleRejectOne(sugg)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Afwijzen
                      </Button>
                    </div>
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
