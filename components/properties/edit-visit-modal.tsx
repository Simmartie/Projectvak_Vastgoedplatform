'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Visit } from '@/lib/properties-types'
import { updateVisit } from '@/lib/properties'
import { Loader2, Star } from 'lucide-react'

interface EditVisitModalProps {
    isOpen: boolean
    onClose: () => void
    visit: Visit
    onSave: (updated: Visit) => void
}

export function EditVisitModal({ isOpen, onClose, visit, onSave }: EditVisitModalProps) {
    const [formData, setFormData] = useState<Visit>(visit)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Format date for datetime-local input
            const date = new Date(visit.date)
            const formattedDate = date.toISOString().slice(0, 16)
            setFormData({ ...visit, date: formattedDate })
        }
    }, [isOpen, visit])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleRatingChange = (value: string) => {
        setFormData(prev => ({ ...prev, rating: Number(value) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSaving(true)
            await updateVisit(visit.id, {
                date: new Date(formData.date).toISOString(),
                feedback: formData.feedback,
                rating: formData.rating
            })
            onSave({
                ...formData,
                date: new Date(formData.date).toISOString()
            })
            onClose()
        } catch (error) {
            console.error('Error saving visit:', error)
            alert('Er is een fout opgetreden bij het opslaan van de bezichtiging.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bezichtiging Bewerken</DialogTitle>
                    <DialogDescription>
                        Pas de details van de bezichtiging van {visit.buyerName} aan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Datum & Tijd</Label>
                        <Input
                            id="date"
                            name="date"
                            type="datetime-local"
                            value={formData.date}
                            onChange={handleTextChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rating">Beoordeling (1-5)</Label>
                        <Select
                            value={formData.rating?.toString() || ""}
                            onValueChange={handleRatingChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kies score" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        <div className="flex items-center gap-2">
                                            {num} {num === 1 ? 'Ster' : 'Sterren'}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                            id="feedback"
                            name="feedback"
                            rows={4}
                            value={formData.feedback || ''}
                            onChange={handleTextChange}
                            placeholder="Voeg feedback van de bezoeker toe..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opslaan...</>
                            ) : (
                                'Opslaan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
