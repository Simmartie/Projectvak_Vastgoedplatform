'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Property, updateProperty } from '@/lib/properties'
import { uploadPropertyImage } from '@/lib/supabase-storage'
import { Trash2, Plus, MoveUp, MoveDown, Sparkles, Loader2, ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { addPriceHistory } from '@/lib/price-histories'

interface EditPropertyModalProps {
    isOpen: boolean
    onClose: () => void
    property: Property
    onSave: (updated: Property) => void
}

function SortInput({ index, total, onChange }: { index: number, total: number, onChange: (newPositionString: string) => void }) {
    const [val, setVal] = useState((index + 1).toString())

    useEffect(() => {
        setVal((index + 1).toString())
    }, [index])

    const submitChange = () => {
        const parsed = parseInt(val);
        if (isNaN(parsed)) {
            setVal((index + 1).toString());
            return;
        }
        
        let clamped = parsed;
        if (clamped < 1) clamped = 1;
        if (clamped > total) clamped = total;

        if (clamped === index + 1) {
            setVal(clamped.toString());
        } else {
            onChange(clamped.toString());
        }
    }

    return (
        <Input 
            type="number" 
            min={1} 
            max={total}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={submitChange}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitChange();
                }
            }}
            className="w-16 h-8 px-1 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Positie (typ een nummer en druk op Enter of klik ernaast)"
        />
    )
}

export function EditPropertyModal({ isOpen, onClose, property, onSave }: EditPropertyModalProps) {
    const [formData, setFormData] = useState<Property>(property)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [expandedImages, setExpandedImages] = useState<string[]>([])
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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

    const handleAdvancedNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }))
    }

    const handleAdvancedSelectChange = (name: keyof Property, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleErfdienstbaarhedenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(e.target.selectedOptions, option => option.value) as any
        setFormData(prev => ({ ...prev, erfdienstbaarheden: options }))
    }

    const handleGenerateDescription = async () => {
        try {
            setIsGenerating(true)

            // Create a copy of the property data but without the images array since base64 data can be huge
            // and cause 413 Payload Too Large or 502 errors when calling the API route.
            const { images, ...propertyDataForAi } = formData;

            const response = await fetch('/api/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property: propertyDataForAi }),
            })

            if (!response.ok) {
                let errorMsg = 'Failed to generate description';
                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMsg = errorData.error;
                } catch {
                    // Ignore JSON parse errors for fallback
                }
                throw new Error(errorMsg)
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                setIsUploading(true)
                const imageUrl = await uploadPropertyImage(file)
                setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }))
            } catch (error) {
                console.error('Error uploading image:', error)
                alert('Er is een fout opgetreden bij het uploaden van de foto.')
            } finally {
                setIsUploading(false)
            }
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

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedImageIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', index.toString())
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverIndex !== index) setDragOverIndex(index)
    }

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (dragOverIndex !== index) setDragOverIndex(index)
    }

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        setDragOverIndex(null)
        
        const draggedIdxStr = e.dataTransfer.getData('text/plain')
        const draggedIdx = draggedIdxStr ? parseInt(draggedIdxStr) : draggedImageIndex
        
        if (draggedIdx === null || isNaN(draggedIdx) || draggedIdx === index) {
            setDraggedImageIndex(null)
            return
        }

        const newImages = [...formData.images]
        const [draggedImage] = newImages.splice(draggedIdx, 1)
        newImages.splice(index, 0, draggedImage)
        
        setFormData({ ...formData, images: newImages })
        setDraggedImageIndex(null)
    }

    const handlePositionChange = (currentIndex: number, newPositionString: string) => {
        const newPosition = parseInt(newPositionString) - 1
        if (isNaN(newPosition) || newPosition < 0 || newPosition >= formData.images.length || newPosition === currentIndex) {
            return
        }

        const newImages = [...formData.images]
        const [movedImage] = newImages.splice(currentIndex, 1)
        newImages.splice(newPosition, 0, movedImage)
        
        setFormData({ ...formData, images: newImages })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const cleanedImages = formData.images.filter(url => url.trim() !== '')
        const finalData = { ...formData, images: cleanedImages }

        // Track price changes
        if (finalData.price !== property.price) {
            finalData.previousPrice = property.price
            try {
                await addPriceHistory(property.id, property.price, finalData.price)
            } catch (err) {
                console.error("Failed to add price history", err)
            }
        }

        try {
            setIsSaving(true)
            await updateProperty(finalData)
            onSave(finalData)
            onClose()
        } catch (error) {
            console.error('Error saving property:', error)
            alert('Er is een fout opgetreden bij het opslaan van het pand.')
        } finally {
            setIsSaving(false)
        }
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddImageClick} disabled={isUploading}>
                                        {isUploading ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploaden...</>
                                        ) : (
                                            <><Plus className="h-4 w-4 mr-1" /> Voeg foto toe</>
                                        )}
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {formData.images.map((imgUrl, index) => (
                                        <div 
                                            key={imgUrl || `img-${index}`} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDragEnter={(e) => handleDragEnter(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={() => {
                                                setDraggedImageIndex(null)
                                                setDragOverIndex(null)
                                            }}
                                            className={`flex flex-col gap-2 bg-muted/50 p-2 rounded-md border transition-all duration-200 cursor-grab active:cursor-grabbing 
                                            ${draggedImageIndex === index ? 'opacity-50 ring-2 ring-primary scale-[0.98]' : ''}
                                            ${dragOverIndex === index && draggedImageIndex !== index ? 'border-primary border-dashed border-2 bg-primary/5' : ''}`}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                                <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex gap-1 shrink-0">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                                                        <MoveUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => moveImage(index, 'down')} disabled={index === formData.images.length - 1}>
                                                        <MoveDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                    <SortInput 
                                                        index={index} 
                                                        total={formData.images.length} 
                                                        onChange={(val) => handlePositionChange(index, val)} 
                                                    />
                                                </div>

                                                <div className="flex-1 w-full relative">
                                                    <Input
                                                        value={imgUrl.startsWith('data:image') ? 'Geüploade afbeelding (Base64)' : imgUrl}
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
                                                        className={`w-12 h-12 rounded object-cover border bg-background cursor-pointer hover:opacity-80 transition-all ${expandedImages.includes(imgUrl) ? 'ring-2 ring-primary' : ''}`}
                                                        onClick={() => setExpandedImages(prev => prev.includes(imgUrl) ? prev.filter(u => u !== imgUrl) : [...prev, imgUrl])}
                                                        title="Klik om te vergroten"
                                                    />
                                                </div>

                                                <Button type="button" variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveImage(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {expandedImages.includes(imgUrl) && (
                                                <div className="w-full mt-2 animate-in slide-in-from-top-2 fade-in duration-200 flex justify-center bg-background border rounded-md p-2">
                                                    <img 
                                                        src={imgUrl} 
                                                        alt={`Large preview ${index}`} 
                                                        className="max-w-full max-h-[300px] object-contain rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {formData.images.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                            Geen foto's toegevoegd.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <hr />

                            {/* Advanced Features Toggle */}
                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    Geavanceerd bewerken (Kadaster, EPC, Attesten)
                                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>

                                {showAdvanced && (
                                    <div className="space-y-6 pt-4 border-t border-dashed animate-in slide-in-from-top-4 fade-in duration-300">

                                        {/* Kadaster & General Info */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Kadaster & Info</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="capakey">Kadastrale sleutel (CaPaKey)</Label>
                                                    <Input id="capakey" name="capakey" value={formData.capakey || ''} onChange={handleTextChange} placeholder="bijv. 12025C0345/00A000" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="kadastraalInkomen">Kadastraal Inkomen (€)</Label>
                                                    <Input id="kadastraalInkomen" name="kadastraalInkomen" type="number" min="0" value={formData.kadastraalInkomen || ''} onChange={handleAdvancedNumberChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="kadastraleOppervlakte">Kadastrale Oppervlakte (m²)</Label>
                                                    <Input id="kadastraleOppervlakte" name="kadastraleOppervlakte" type="number" min="0" value={formData.kadastraleOppervlakte || ''} onChange={handleAdvancedNumberChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="schatting">Schatting (€)</Label>
                                                    <Input id="schatting" name="schatting" type="number" min="0" value={formData.schatting || ''} onChange={handleAdvancedNumberChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="mobiscore">Mobiscore</Label>
                                                    <Input id="mobiscore" name="mobiscore" type="number" step="0.1" min="0" max="10" value={formData.mobiscore || ''} onChange={handleAdvancedNumberChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Bouwmisdrijf / Overtreding</Label>
                                                    <Select value={formData.bouwmisdrijf || 'Onbekend'} onValueChange={(val) => handleAdvancedSelectChange('bouwmisdrijf', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies status" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Ja">Ja</SelectItem>
                                                            <SelectItem value="Nee">Nee</SelectItem>
                                                            <SelectItem value="In regularisatie">In regularisatie</SelectItem>
                                                            <SelectItem value="Onbekend">Onbekend</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-dashed" />

                                        {/* Overstromingskans */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Overstromingskans</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>P-Score (Perceel)</Label>
                                                    <Select value={formData.pScore || ''} onValueChange={(val) => handleAdvancedSelectChange('pScore', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies score (A-D)" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="A">A (Geen overstroming gemodelleerd)</SelectItem>
                                                            <SelectItem value="B">B (Kleine kans onder klimaatverandering)</SelectItem>
                                                            <SelectItem value="C">C (Kleine kans huidig klimaat)</SelectItem>
                                                            <SelectItem value="D">D (Middelgrote kans huidig klimaat)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>G-Score (Gebouw)</Label>
                                                    <Select value={formData.gScore || ''} onValueChange={(val) => handleAdvancedSelectChange('gScore', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies score (A-D)" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="A">A (Geen overstroming gemodelleerd)</SelectItem>
                                                            <SelectItem value="B">B (Kleine kans onder klimaatverandering)</SelectItem>
                                                            <SelectItem value="C">C (Kleine kans huidig klimaat)</SelectItem>
                                                            <SelectItem value="D">D (Middelgrote kans huidig klimaat)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-dashed" />

                                        {/* Certificaten & Attesten */}
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm">Certificaten & Attesten</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Bodemattest Status</Label>
                                                    <Select value={formData.bodemattest || 'Blanco'} onValueChange={(val) => handleAdvancedSelectChange('bodemattest', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies status" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Blanco">Blanco</SelectItem>
                                                            <SelectItem value="Niet blanco / Risico">Niet blanco / Risico</SelectItem>
                                                            <SelectItem value="Vrijstelling">Vrijstelling</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="epcScore">EPC Score (kWh/m²)</Label>
                                                    <Input id="epcScore" name="epcScore" type="number" min="0" value={formData.epcScore || ''} onChange={handleAdvancedNumberChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Elektriciteitskeuring</Label>
                                                    <Select value={formData.elektriciteitskeuring || 'Geen keuring'} onValueChange={(val) => handleAdvancedSelectChange('elektriciteitskeuring', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies status" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Conform">Conform</SelectItem>
                                                            <SelectItem value="Niet conform">Niet conform</SelectItem>
                                                            <SelectItem value="Geen keuring">Geen keuring</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Erfdienstbaarheden</Label>
                                                    <select
                                                        multiple
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={formData.erfdienstbaarheden || []}
                                                        onChange={handleErfdienstbaarhedenChange}
                                                    >
                                                        <option value="Geen">Geen</option>
                                                        <option value="Nutsleidingen">Nutsleidingen</option>
                                                        <option value="Recht van doorgang / uitweg">Recht van doorgang / uitweg</option>
                                                        <option value="Gemene muur">Gemene muur</option>
                                                        <option value="Andere">Andere</option>
                                                    </select>
                                                    <p className="text-[10px] text-muted-foreground">Houd Ctrl (of Cmd) ingedrukt om meerdere te selecteren</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Conformiteitsattest</Label>
                                                    <Select value={formData.conformiteitsattest || 'N.v.t.'} onValueChange={(val) => handleAdvancedSelectChange('conformiteitsattest', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Kies optie" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Ja">Ja</SelectItem>
                                                            <SelectItem value="Nee">Nee</SelectItem>
                                                            <SelectItem value="N.v.t.">N.v.t.</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {formData.conformiteitsattest === 'Ja' && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="conformiteitsattestGeldigheid">Geldig tot</Label>
                                                        <Input id="conformiteitsattestGeldigheid" name="conformiteitsattestGeldigheid" type="date" value={formData.conformiteitsattestGeldigheid || ''} onChange={handleTextChange} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/20 mt-auto">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button type="submit" form="edit-property-form" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opslaan...</> : 'Wijzigingen Opslaan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
