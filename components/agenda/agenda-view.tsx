'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, isSameWeek, getISOWeek } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Appointment, getAppointmentsForUser, deleteAppointment } from '@/lib/agenda'
import { fetchPropertyById, type Property } from '@/lib/properties'
import { AppointmentModal } from './appointment-modal'
import { getCurrentUser } from '@/lib/auth'

interface AgendaViewProps {
    userId?: string
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 to 21:00
const HOUR_HEIGHT = 64 // 64px = h-16

export function AgendaView({ userId: propUserId }: AgendaViewProps) {
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>()
    const [selectedDateForNew, setSelectedDateForNew] = useState<Date>(new Date())
    const [prefilledData, setPrefilledData] = useState<Partial<Appointment> | undefined>()
    const [daysToShow, setDaysToShow] = useState<number>(7)
    const [propertyCache, setPropertyCache] = useState<Record<string, Property | null>>({})
    const searchParams = useSearchParams()

    const user = getCurrentUser()
    const activeUserId = propUserId || user?.id || '1'
    const isMakelaar = user?.role === 'makelaar'

    useEffect(() => {
        loadAppointments()
    }, [activeUserId])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setDaysToShow(2) // 2 days on mobile
            } else {
                setDaysToShow(7) // 7 days on desktop
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const loadAppointments = async () => {
        const apps = await getAppointmentsForUser(activeUserId)
        setAppointments(apps)
        // Pre-fetch properties for appointments
        const ids = [...new Set(apps.map(a => a.propertyId).filter(Boolean))] as string[]
        const cache: Record<string, Property | null> = {}
        await Promise.all(ids.map(async id => {
            const p = await fetchPropertyById(id)
            cache[id] = p ?? null
        }))
        setPropertyCache(prev => ({ ...prev, ...cache }))
    }

    useEffect(() => {
        // Handle pre-filled appointments from URL
        const propertyId = searchParams?.get('propertyId')
        const title = searchParams?.get('title')
        const sellerId = searchParams?.get('sellerId')

        if (propertyId && isMakelaar) {
            setPrefilledData({
                propertyId,
                title: title || '',
                participantIds: sellerId ? [activeUserId, sellerId] : [activeUserId]
            })
            setIsModalOpen(true)
        }
    }, [searchParams, isMakelaar, activeUserId])

    const handleEdit = (appointment: Appointment, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedAppointment(appointment)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Weet u zeker dat u deze afspraak wilt verwijderen?')) {
            await deleteAppointment(id)
            loadAppointments()
        }
    }

    const handleAddNew = (date: Date = new Date()) => {
        if (!isMakelaar) return
        setSelectedAppointment(undefined)
        setPrefilledData(undefined)
        setSelectedDateForNew(date)
        setIsModalOpen(true)
    }

    const nextPeriod = () => setCurrentDate(addWeeks(currentDate, daysToShow === 7 ? 1 : 0))
    const prevPeriod = () => setCurrentDate(subWeeks(currentDate, daysToShow === 7 ? 1 : 0))
    const nextDays = () => setCurrentDate(new Date(currentDate.getTime() + daysToShow * 24 * 60 * 60 * 1000))
    const prevDays = () => setCurrentDate(new Date(currentDate.getTime() - daysToShow * 24 * 60 * 60 * 1000))
    const goToToday = () => setCurrentDate(new Date())

    const handleNext = () => daysToShow === 7 ? nextPeriod() : nextDays()
    const handlePrev = () => daysToShow === 7 ? prevPeriod() : prevDays()

    let startDate = currentDate
    if (daysToShow === 7) {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    }

    const endDate = new Date(startDate.getTime() + (daysToShow - 1) * 24 * 60 * 60 * 1000)
    const visibleDays = eachDayOfInterval({ start: startDate, end: endDate })

    const isCurrentWeek = isSameWeek(currentDate, new Date(), { weekStartsOn: 1 })
    const isTodayVisible = visibleDays.some(day => isToday(day))

    return (
        <Card className="flex flex-col rounded-none sm:rounded-xl border-x-0 border-t-0 sm:border border-muted/50 bg-card/50 backdrop-blur-sm shadow-none sm:shadow-sm w-full">
            <CardHeader className="border-b pb-4 px-4 sm:px-6 pt-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-xl sm:text-2xl font-bold">
                            {format(startDate, 'MMMM yyyy', { locale: nl }).replace(/^\w/, c => c.toUpperCase())}
                        </CardTitle>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                                <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-2 sm:px-3 text-sm font-medium">
                                    {daysToShow === 7
                                        ? (isCurrentWeek ? 'Vandaag' : `Week ${getISOWeek(currentDate)}`)
                                        : (isTodayVisible ? 'Vandaag' : 'Terug')
                                    }
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {isMakelaar && (
                                <Button onClick={() => handleAddNew(new Date())} className="h-10 whitespace-nowrap flex-1 sm:flex-none">
                                    <Plus className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden xs:inline sm:inline">Nieuwe</span> Afspraak
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="flex flex-col w-full">
                    {/* Days Header */}
                    <div className="flex border-b bg-muted/20 min-w-[300px]">
                        <div className="w-12 sm:w-16 shrink-0 border-r" /> {/* Time column spacer */}
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
                            {visibleDays.map((day, i) => {
                                const isCurrentDay = isToday(day)
                                return (
                                    <div key={i} className={`text-center py-2 sm:py-3 border-r last:border-r-0 ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                                        <div className={`text-xs sm:text-sm font-medium ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {format(day, 'EEEE', { locale: nl }).substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className={`text-xl sm:text-2xl mt-0.5 sm:mt-1 ${isCurrentDay ? 'text-primary font-bold' : ''}`}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Time Grid */}
                    <ScrollArea className="min-w-[300px]">
                        <div className="flex relative">
                            {/* Time Labels */}
                            <div className="w-12 sm:w-16 shrink-0 border-r bg-background z-10">
                                {HOURS.map(hour => (
                                    <div key={hour} className="h-16 text-[10px] sm:text-xs text-muted-foreground text-center pt-2 border-b border-transparent">
                                        {`${hour.toString().padStart(2, '0')}:00`}
                                    </div>
                                ))}
                            </div>

                            {/* Grid Cells */}
                            <div className="flex-1 grid relative bg-background" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(0, 1fr))` }}>
                                {/* Horizontal Lines */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {HOURS.map(hour => (
                                        <div key={hour} className="h-16 border-b border-muted/30 w-full" />
                                    ))}
                                </div>

                                {/* Day Columns & Appointments */}
                                {visibleDays.map((day, dayIndex) => {
                                    const dateStr = format(day, 'yyyy-MM-dd')
                                    const dayAppointments = appointments.filter(a => a.date === dateStr)

                                    return (
                                        <div
                                            key={dayIndex}
                                            className="border-r last:border-r-0 border-muted/30 relative"
                                            style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}
                                            onClick={() => handleAddNew(day)}
                                        >
                                            {dayAppointments.map(appointment => {
                                                const property = appointment.propertyId ? (propertyCache[appointment.propertyId] ?? null) : null

                                                const [startH, startM] = appointment.startTime.split(':').map(Number)
                                                const [endH, endM] = appointment.endTime.split(':').map(Number)

                                                const top = ((startH - HOURS[0]) * HOUR_HEIGHT) + (startM / 60 * HOUR_HEIGHT)
                                                const height = ((endH - startH) * HOUR_HEIGHT) + ((endM - startM) / 60 * HOUR_HEIGHT)

                                                return (
                                                    <div
                                                        key={appointment.id}
                                                        onClick={(e) => handleEdit(appointment, e)}
                                                        className={`absolute left-0.5 right-0.5 sm:left-1 sm:right-1 rounded-md p-1 sm:p-1.5 shadow-sm border overflow-hidden cursor-pointer transition-colors group ${property
                                                            ? 'bg-blue-100 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:hover:bg-blue-800/50'
                                                            : 'bg-emerald-100 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:hover:bg-emerald-800/50'
                                                            }`}
                                                        style={{ top: `${top}px`, height: `${height}px`, zIndex: 20 }}
                                                    >
                                                        <div className="flex justify-between items-start h-full">
                                                            <div className="flex flex-col min-w-0 h-full w-full">
                                                                <div className={`font-semibold text-[10px] sm:text-xs truncate ${property ? 'text-blue-900 dark:text-blue-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                                                                    {appointment.title}
                                                                </div>
                                                                <div className={`text-[9px] sm:text-[10px] opacity-80 mt-0.5 truncate ${property ? 'text-blue-800 dark:text-blue-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                                                                    {appointment.startTime} - {appointment.endTime}
                                                                </div>
                                                                {property && height > 40 && daysToShow === 7 && (
                                                                    <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] font-medium text-blue-800 dark:text-blue-200 bg-blue-200/50 dark:bg-blue-800/50 rounded px-1 py-0.5 w-fit">
                                                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                                                                        <span className="truncate hidden sm:inline">{property.address}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isMakelaar && height > 30 && daysToShow === 7 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(e) => handleDelete(appointment.id, e)}
                                                                    className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 ${property ? 'hover:bg-blue-200 text-blue-900 dark:hover:bg-blue-800 dark:text-blue-100' : 'hover:bg-emerald-200 text-emerald-900 dark:hover:bg-emerald-800 dark:text-emerald-100'
                                                                        }`}
                                                                >
                                                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setPrefilledData(undefined)
                }}
                selectedDate={selectedDateForNew}
                appointment={selectedAppointment}
                currentUser={user}
                onSave={() => {
                    setIsModalOpen(false)
                    setPrefilledData(undefined)
                    loadAppointments()
                }}
                prefilledData={prefilledData}
            />
        </Card>
    )
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}
