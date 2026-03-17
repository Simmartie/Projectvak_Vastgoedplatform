'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property, CITY_COORDINATES } from '@/lib/properties';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Get coordinates for a property using city lookup with small deterministic offset
function getPropertyCoords(property: Property): { lat: number; lng: number } | null {
  const cityKey = property.city.toLowerCase()
  const cityCoords = CITY_COORDINATES[cityKey]
  if (!cityCoords) return null
  
  // Small deterministic offset so multiple properties in same city don't overlap
  // Use a simple hash of the property ID
  const hash = property.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const latOffset = ((hash % 20) - 10) * 0.001  // ±0.01 deg (~1km)
  const lngOffset = (((hash * 7) % 20) - 10) * 0.001
  
  return { lat: cityCoords.lat + latOffset, lng: cityCoords.lng + lngOffset }
}

// Fix for Leaflet default icon issues in React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PropertyMapProps {
  properties: Property[];
  userLocation: { lat: number, lng: number } | null;
  idealLocation?: string;
}

// Component to handle auto-fitting bounds when properties change
function ChangeView({ properties, userLocation }: { properties: Property[], userLocation: { lat: number, lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = properties
      .map(p => getPropertyCoords(p))
      .filter(Boolean) as { lat: number, lng: number }[];

    if (userLocation) {
      validCoords.push(userLocation);
    }

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [properties, userLocation, map]);

  return null;
}

export default function PropertyMap({ properties, userLocation, idealLocation }: PropertyMapProps) {
  // Default to Belgium center if no properties
  const defaultCenter: [number, number] = [50.8503, 4.3517]; 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <div className="relative w-full h-[calc(100vh-300px)] rounded-lg overflow-hidden border">
      <MapContainer 
        center={defaultCenter} 
        zoom={8} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <ChangeView properties={properties} userLocation={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Plot Properties */}
        {properties.map(property => {
          const coords = getPropertyCoords(property);
          if (!coords) return null;

          return (
            <Marker 
              key={property.id} 
              position={[coords.lat, coords.lng]} 
              icon={customIcon}
            >
              <Popup>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <img src={property.images[0] || "/placeholder.svg"} alt={property.address} className="w-full h-24 object-cover rounded-md" />
                  <div>
                    <h3 className="font-bold text-base">€{property.price.toLocaleString('nl-NL')}</h3>
                    <p className="text-sm font-medium">{property.address}</p>
                    <p className="text-xs text-muted-foreground">{property.city}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-muted px-1 py-0.5 rounded">{property.rooms} kamers</span>
                    <span className="bg-muted px-1 py-0.5 rounded">{property.area}m²</span>
                  </div>
                  <Link href={`/koper/property/${property.id}`} className="mt-1">
                    <Button size="sm" className="w-full h-8 text-xs">Details</Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Plot User Location */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userIcon}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold">Uw droomlocatie</p>
                <p className="text-xs text-muted-foreground">Basis voor afstandsberekening</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg" style={{ zIndex: 1000 }}>
        <p className="text-sm font-medium">
          {properties.length} panden weergegeven
        </p>
        {idealLocation && (
          <p className="text-xs text-muted-foreground mt-1">
            Gesorteerd op afstand tot {idealLocation}
          </p>
        )}
      </div>
    </div>
  );
}
