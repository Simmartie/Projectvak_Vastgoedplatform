'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bid } from '@/lib/properties-types'
import { updateBid } from '@/lib/properties'
import { Loader2 } from 'lucide-react'

interface EditBidModalProps {
    isOpen: boolean
    onClose: () => void
    bid: Bid
    onSave: (updated: Bid) => void
}

export function EditBidModal({ isOpen, onClose, bid, onSave }: EditBidModalProps) {
    const [formData, setFormData] = useState<Bid>(bid)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setFormData(bid)
        }
    }, [isOpen, bid])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'amount') {
            setFormData(prev => ({ ...prev, [name]: Math.max(0, value === '' ? 0 : Number(value)) }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value as any }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSaving(true)
            await updateBid(bid.id, {
                amount: formData.amount,
                status: formData.status,
                comments: formData.comments
            })
            onSave(formData)
            onClose()
        } catch (error) {
            console.error('Error saving bid:', error)
            alert('Er is een fout opgetreden bij het opslaan van het bod.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bod Bewerken</DialogTitle>
                    <DialogDescription>
                        Pas de details van het bod van {bid.buyerName} aan.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Bedrag (€)</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0"
                            value={formData.amount}
                            onChange={handleTextChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => handleSelectChange('status', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Kies status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">In behandeling</SelectItem>
                                <SelectItem value="accepted">Geaccepteerd</SelectItem>
                                <SelectItem value="rejected">Afgewezen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comments">Opmerkingen</Label>
                        <Textarea
                            id="comments"
                            name="comments"
                            rows={4}
                            value={formData.comments || ''}
                            onChange={handleTextChange}
                            placeholder="Voeg eventuele opmerkingen toe..."
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
