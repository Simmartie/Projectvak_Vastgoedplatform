'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Property, updatePropertyInDb } from '@/lib/properties'
import { Trash2, Plus, MoveUp, MoveDown, Sparkles, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface EditPropertyModalProps {
    isOpen: boolean
    onClose: () => void
    property: Property
    onSave: (updated: Property) => void
}

export function EditPropertyModal({ isOpen, onClose, property, onSave }: EditPropertyModalProps) {
    const [formData, setFormData] = useState<Property>(property)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setFormData(property)
        }
    }, [isOpen, property])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        // Parse numbers when dealing with numerical fields
        if (['price', 'rooms', 'bedrooms', 'area', 'plotSize', 'buildYear'].includes(name)) {
            setFormData(prev => ({ ...prev, [name]: Math.max(0, value === '' ? 0 : Number(value)) }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleGenerateDescription = async () => {
        try {
            setIsGenerating(true)
            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property: formData }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate description')
            }

            const data = await response.json()
            if (data.text) {
                setFormData(prev => ({ ...prev, description: data.text }))
            }
        } catch (error) {
            console.error('Error generating description:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    // Image Array Operations
    const handleImageChange = (index: number, value: string) => {
        const newImages = [...formData.images]
        newImages[index] = value
        setFormData({ ...formData, images: newImages })
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                setFormData(prev => ({ ...prev, images: [...prev.images, base64String] }))
            }
            reader.readAsDataURL(file)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleAddImageClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemoveImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index)
        setFormData({ ...formData, images: newImages })
    }

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === formData.images.length - 1) return

        const newImages = [...formData.images]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
            ;[newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
        setFormData({ ...formData, images: newImages })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanedImages = formData.images.filter(url => url.trim() !== '')
        const finalData = { ...formData, images: cleanedImages }

        // Track price changes
        if (finalData.price !== property.price) {
            finalData.previousPrice = property.price
        }

        await updatePropertyInDb(finalData)
        onSave(finalData)
        onClose()
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Bewerk Pand: {property.address}</DialogTitle>
                    <DialogDescription>
                        Pas de kenmerken, beschrijving en foto's van dit pand aan.
                    </DialogDescription>
                </DialogHeader>

                <form id="edit-property-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* Standard Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adres</Label>
                                    <Input id="address" name="address" value={formData.address} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Prijs (€)</Label>
                                    <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Stad</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">Postcode</Label>
                                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleTextChange} required />
                                </div>
                            </div>

                            <hr />

                            {/* Dropdowns */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type Pand</Label>
                                    <Select value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="huis">Huis</SelectItem>
                                            <SelectItem value="appartement">Appartement</SelectItem>
                                            <SelectItem value="villa">Villa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="te-koop">Te Koop</SelectItem>
                                            <SelectItem value="onder-bod">Onder Bod</SelectItem>
                                            <SelectItem value="verkocht">Verkocht</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fase in verkoopproces</Label>
                                    <Select value={formData.phase} onValueChange={(val) => handleSelectChange('phase', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies fase" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="intake">Intake</SelectItem>
                                            <SelectItem value="fotografie">Fotografie</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="bezichtigingen">Bezichtigingen</SelectItem>
                                            <SelectItem value="onderhandeling">Onderhandeling</SelectItem>
                                            <SelectItem value="afgerond">Afgerond</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Energielabel</Label>
                                    <Select value={formData.energyLabel} onValueChange={(val) => handleSelectChange('energyLabel', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies label" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(lbl => (
                                                <SelectItem key={lbl} value={lbl}>{lbl}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <hr />

                            {/* Numbers */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rooms">Aantal Kamers</Label>
                                    <Input id="rooms" name="rooms" type="number" value={formData.rooms} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Slaapkamers</Label>
                                    <Input id="bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="buildYear">Bouwjaar</Label>
                                    <Input id="buildYear" name="buildYear" type="number" value={formData.buildYear} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Woonoppervlak (m²)</Label>
                                    <Input id="area" name="area" type="number" value={formData.area} onChange={handleTextChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plotSize">Perceel (m²)</Label>
                                    <Input id="plotSize" name="plotSize" type="number" value={formData.plotSize || ''} onChange={handleTextChange} />
                                </div>
                            </div>

                            <hr />

                            <div className="space-y-2 relative group flex flex-col">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description">Beschrijving</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateDescription}
                                        disabled={isGenerating}
                                        className="h-8 flex items-center gap-1.5 transition-opacity duration-200"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                        )}
                                        {isGenerating ? 'Genereren...' : 'Genereer beschrijving'}
                                    </Button>
                                </div>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={10}
                                    value={formData.description}
                                    onChange={handleTextChange}
                                    className="resize-none"
                                    required
                                />
                            </div>

                            <hr />

                            {/* Image Management */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Foto's</Label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddImageClick}>
                                        <Plus className="h-4 w-4 mr-1" /> Voeg foto toe
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {formData.images.map((imgUrl, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-muted/50 p-2 rounded-md border">
                                            <div className="flex gap-1 shrink-0">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                                                    <MoveUp className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveImage(index, 'down')} disabled={index === formData.images.length - 1}>
                                                    <MoveDown className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex-1 w-full relative">
                                                <Input
                                                    value={imgUrl.startsWith('data:image') ? 'Geüploade afbeelding (Lokaal bestand)' : imgUrl}
                                                    onChange={(e) => {
                                                        if (!imgUrl.startsWith('data:image')) {
                                                            handleImageChange(index, e.target.value)
                                                        }
                                                    }}
                                                    readOnly={imgUrl.startsWith('data:image')}
                                                    placeholder="Afbeelding URL of upload een bestand"
                                                    className={`w-full ${imgUrl.startsWith('data:image') ? 'bg-muted text-muted-foreground' : ''}`}
                                                />
                                            </div>

                                            <div className="shrink-0">
                                                <img
                                                    src={imgUrl || '/placeholder.svg'}
                                                    alt={`Preview ${index}`}
                                                    className="w-12 h-12 rounded object-cover border bg-background"
                                                />
                                            </div>

                                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveImage(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {formData.images.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                            Geen foto's toegevoegd.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/20 mt-auto">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button type="submit" form="edit-property-form">
                            Wijzigingen Opslaan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
