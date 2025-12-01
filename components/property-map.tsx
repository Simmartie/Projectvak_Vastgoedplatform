'use client'

import { useEffect, useRef, useState } from 'react'
import { Property, PROPERTY_COORDINATES, calculateDistance } from '@/lib/properties'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation } from 'lucide-react'

interface PropertyMapProps {
  properties: Property[]
  centerLat: number
  centerLng: number
  onPropertyClick?: (propertyId: string) => void
}

export function PropertyMap({ properties, centerLat, centerLng, onPropertyClick }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  return (
    <div className="relative w-full h-full bg-muted rounded-lg overflow-hidden">
      {/* Simple map visualization - in production would use Leaflet or Google Maps */}
      <div ref={mapRef} className="w-full h-full relative">
        {/* Map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(0deg, #888 1px, transparent 1px),
                linear-gradient(90deg, #888 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Center marker (user's location) */}
        <div
          className="absolute z-20"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
            <div className="absolute -inset-2 bg-primary/20 rounded-full" />
          </div>
        </div>

        {/* Property markers */}
        {properties.map((property) => {
          const coords = PROPERTY_COORDINATES[property.id]
          if (!coords) return null

          // Calculate relative position from center
          const dx = (coords.lng - centerLng) * 1000
          const dy = (centerLat - coords.lat) * 1000
          
          const distance = calculateDistance(centerLat, centerLng, coords.lat, coords.lng)

          return (
            <div
              key={property.id}
              className="absolute z-10 cursor-pointer"
              style={{
                left: `calc(50% + ${dx}px)`,
                top: `calc(50% + ${dy}px)`,
                transform: 'translate(-50%, -100%)'
              }}
              onClick={() => {
                setSelectedProperty(property)
                onPropertyClick?.(property.id)
              }}
            >
              <div className="relative group">
                <div className="w-8 h-8 bg-accent rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5 text-accent-foreground" />
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <Card className="p-2 shadow-lg">
                    <p className="text-xs font-semibold">{property.address}</p>
                    <p className="text-xs text-muted-foreground">{distance.toFixed(1)} km</p>
                  </Card>
                </div>
              </div>
            </div>
          )
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-30">
          <Card className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span>Uw locatie</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-4 w-4 text-accent-foreground" />
              <span>Beschikbare panden</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
