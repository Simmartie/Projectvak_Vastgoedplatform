'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Appointment, addAppointment, updateAppointment } from '@/lib/agenda'
import { fetchProperties } from '@/lib/properties'
import { fetchProfiles } from '@/lib/data'
import type { User } from '@/lib/auth'

interface AppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date
    appointment?: Appointment
    currentUser: User | null
    onSave: () => void
    prefilledData?: Partial<Appointment>
}

export function AppointmentModal({
    isOpen,
    onClose,
    selectedDate,
    appointment,
    currentUser,
    onSave,
    prefilledData
}: AppointmentModalProps) {
    const router = useRouter()
    const isEditing = !!appointment
    const isMakelaar = currentUser?.role === 'makelaar'

    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [propertyId, setPropertyId] = useState<string>('none')
    const [participantIds, setParticipantIds] = useState<string[]>([])
    const [description, setDescription] = useState('')
    const [properties, setProperties] = useState<{ id: string; address: string; city: string; sellerId: string }[]>([])
    const [profiles, setProfiles] = useState<{ id: string; name: string; role: string }[]>([])

    useEffect(() => {
        if (isOpen) {
            fetchProperties().then(setProperties).catch(() => [])
            fetchProfiles().then(ps => setProfiles(ps)).catch(() => [])
        }
    }, [isOpen])

    // Reset form when modal opens or appointment changes
    useEffect(() => {
        if (isOpen) {
            if (appointment) {
                setTitle(appointment.title)
                setDate(appointment.date)
                setStartTime(appointment.startTime)
                setEndTime(appointment.endTime)
                setPropertyId(appointment.propertyId || 'none')
                setParticipantIds(appointment.participantIds || [])
                setDescription(appointment.description || '')
            } else {
                setTitle(prefilledData?.title || '')
                setDate(format(selectedDate, 'yyyy-MM-dd'))
                setStartTime('09:00')
                setEndTime('10:00')
                setPropertyId(prefilledData?.propertyId || 'none')
                setParticipantIds(prefilledData?.participantIds || (currentUser ? [currentUser.id] : []))
                setDescription('')
            }
        }
    }, [isOpen, appointment, selectedDate, currentUser, prefilledData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let finalParticipantIds = [...participantIds];

        // Auto-link seller if a property is selected
        if (propertyId !== 'none') {
            const selectedProperty = properties.find((p) => p.id === propertyId);
            if (selectedProperty?.sellerId && !finalParticipantIds.includes(selectedProperty.sellerId)) {
                finalParticipantIds.push(selectedProperty.sellerId);
            }
        }

        const appointmentData = {
            title,
            date,
            startTime,
            endTime,
            propertyId: propertyId === 'none' ? undefined : propertyId,
            participantIds: finalParticipantIds,
            description,
        }

        if (isEditing && appointment) {
            await updateAppointment({ ...appointmentData, id: appointment.id })
        } else {
            await addAppointment(appointmentData)
        }

        onSave()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</DialogTitle>
                        <DialogDescription>
                            Vul de details in voor deze afspraak in uw agenda.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Titel</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Bv. Bezichtiging Kerkstraat"
                                required
                                disabled={!isMakelaar}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Datum</Label>
                                <div className="relative">
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        disabled={!isMakelaar}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Starttijd</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                    disabled={!isMakelaar}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">Eindtijd</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                    disabled={!isMakelaar}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="property">Gekoppeld Pand (Optioneel)</Label>
                            <div className="flex gap-2 items-center">
                                <Select value={propertyId} onValueChange={setPropertyId} disabled={!isMakelaar}>
                                    <SelectTrigger id="property" className="flex-1">
                                        <SelectValue placeholder="Selecteer een pand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Geen pand gekoppeld</SelectItem>
                                        {properties.map((prop) => (
                                            <SelectItem key={prop.id} value={prop.id}>
                                                {prop.address}, {prop.city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isMakelaar && propertyId !== 'none' && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => router.push(`/makelaar/property/${propertyId}`)}
                                        className="shrink-0"
                                    >
                                        Naar Dossier
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Participants Selection (Makelaar only) */}
                        {isMakelaar && (
                            <div className="grid gap-2">
                                <Label>Selecteer Kopers (Verkoper wordt automatisch gekoppeld)</Label>
                                <div className="border rounded-md p-3 max-h-[120px] overflow-y-auto space-y-2">
                                    {profiles.filter(u => u.role === 'koper' || u.role === 'makelaar').map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`participant-${user.id}`}
                                                checked={participantIds.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setParticipantIds([...participantIds, user.id])
                                                    } else {
                                                        setParticipantIds(participantIds.filter(id => id !== user.id))
                                                    }
                                                }}
                                                className="rounded border-gray-300"
                                                disabled={user.role === 'makelaar'} // Keep makelaar always checked
                                            />
                                            <Label htmlFor={`participant-${user.id}`} className="font-normal cursor-pointer">
                                                {user.name} ({user.role})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isMakelaar && participantIds.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Deelnemers</Label>
                                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    {profiles.filter(u => participantIds.includes(u.id)).map(u => u.name).join(', ')}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="description">Beschrijving (Optioneel)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Notities of details voor deze afspraak"
                                className="resize-none"
                                rows={3}
                                disabled={!isMakelaar}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {isMakelaar ? 'Annuleren' : 'Sluiten'}
                        </Button>
                        {isMakelaar && <Button type="submit">Opslaan</Button>}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
