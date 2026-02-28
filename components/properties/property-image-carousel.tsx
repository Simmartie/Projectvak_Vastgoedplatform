'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PropertyImageCarouselProps {
    images: string[]
    alt: string
    className?: string
}

export function PropertyImageCarousel({ images, alt, className = "" }: PropertyImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!images || images.length === 0) {
        return (
            <div className={`bg-muted flex items-center justify-center ${className}`}>
                <p className="text-muted-foreground">Geen afbeeldingen beschikbaar</p>
            </div>
        )
    }

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            <img
                src={images[currentIndex] || "/placeholder.svg"}
                alt={`${alt} - Foto ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
            />

            {images.length > 1 && (
                <>
                    {/* Navigation Arrows */}
                    <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm shadow-sm"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm shadow-sm"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Counter Badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
