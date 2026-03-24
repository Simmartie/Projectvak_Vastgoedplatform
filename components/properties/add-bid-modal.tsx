'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bid } from '@/lib/properties-types'
import { createBid, getBuyers } from '@/lib/properties'
import { Loader2 } from 'lucide-react'

interface AddBidModalProps {
    isOpen: boolean
    onClose: () => void
    propertyId: string
    onSave: (newBid: Bid) => void
}

export function AddBidModal({ isOpen, onClose, propertyId, onSave }: AddBidModalProps) {
    const [buyers, setBuyers] = useState<{ id: string, name: string }[]>([])
    const [selectedBuyerId, setSelectedBuyerId] = useState<string>('')
    const [amount, setAmount] = useState<number>(0)
    const [status, setStatus] = useState<string>('pending')
    const [comments, setComments] = useState<string>('')
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
            setAmount(0)
            setStatus('pending')
            setComments('')
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
            const newBid = await createBid(propertyId, selectedBuyerId, {
                amount,
                status: status as any,
                comments
            })
            onSave(newBid)
            onClose()
        } catch (error) {
            console.error('Error creating bid:', error)
            alert('Er is een fout opgetreden bij het toevoegen van het bod.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bod Toevoegen</DialogTitle>
                    <DialogDescription>
                        Voeg handmatig een nieuw bod toe voor dit pand.
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
                        <Label htmlFor="amount">Bedrag (€)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={setStatus}
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
                            rows={4}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Voeg eventuele opmerkingen toe..."
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
