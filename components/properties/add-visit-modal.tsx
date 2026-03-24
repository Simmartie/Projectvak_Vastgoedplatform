'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Visit } from '@/lib/properties-types'
import { createVisit, getBuyers } from '@/lib/properties'
import { Loader2 } from 'lucide-react'

interface AddVisitModalProps {
    isOpen: boolean
    onClose: () => void
    propertyId: string
    onSave: (newVisit: Visit) => void
}

export function AddVisitModal({ isOpen, onClose, propertyId, onSave }: AddVisitModalProps) {
    const [buyers, setBuyers] = useState<{ id: string, name: string }[]>([])
    const [selectedBuyerId, setSelectedBuyerId] = useState<string>('')
    const [date, setDate] = useState<string>('')
    const [rating, setRating] = useState<number>(0)
    const [feedback, setFeedback] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingBuyers, setIsLoadingBuyers] = useState(false)

    useEffect(() => {
        if (isOpen) {
            const fetchBuyers = async () => {
                setIsLoadingBuyers(true)
                const data = await getBuyers()
                setBuyers(data)
                setIsLoadingBuyers(false)
            }
            fetchBuyers()
            // Reset form
            setSelectedBuyerId('')
            // Set default date to now (formatted for datetime-local)
            const now = new Date()
            const formattedDate = now.toISOString().slice(0, 16)
            setDate(formattedDate)
            setRating(0)
            setFeedback('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBuyerId) {
            alert('Selecteer een koper')
            return
        }
        try {
            setIsSaving(true)
            const newVisit = await createVisit(propertyId, selectedBuyerId, {
                date: new Date(date).toISOString(),
                feedback,
                rating: rating || undefined
            })
            onSave(newVisit)
            onClose()
        } catch (error) {
            console.error('Error creating visit:', error)
            alert('Er is een fout opgetreden bij het toevoegen van de bezichtiging.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bezichtiging Toevoegen</DialogTitle>
                    <DialogDescription>
                        Voeg handmatig een nieuwe bezichtiging toe voor dit pand.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="buyer">Koper</Label>
                        <Select
                            value={selectedBuyerId}
                            onValueChange={setSelectedBuyerId}
                            disabled={isLoadingBuyers}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingBuyers ? "Kopers laden..." : "Selecteer koper"} />
                            </SelectTrigger>
                            <SelectContent>
                                {buyers.map((buyer) => (
                                    <SelectItem key={buyer.id} value={buyer.id}>
                                        {buyer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Datum & Tijd</Label>
                        <Input
                            id="date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rating">Beoordeling (1-5, optioneel)</Label>
                        <Select
                            value={rating?.toString() || ""}
                            onValueChange={(val) => setRating(Number(val))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kies score" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Geen score</SelectItem>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? 'Ster' : 'Sterren'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                            id="feedback"
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Voeg feedback van de bezoeker toe..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button type="submit" disabled={isSaving || !selectedBuyerId}>
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Toevoegen...</>
                            ) : (
                                'Toevoegen'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
