"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pure HTML custom red location marker icon for Leaflet
const redLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 bg-red-100 border-2 border-[#d3121a] rounded-full flex items-center justify-center shadow-lg animate-bounce">
        <span style="font-size: 14px;">📍</span>
      </div>
      <div class="absolute w-2 h-2 bg-[#d3121a] rounded-full opacity-60 top-8"></div>
    </div>
  `,
  className: 'custom-leaflet-delivery-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

interface DeliveryLocationMapWrapperProps {
  latitude: number;
  longitude: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

// Subcomponent to center the map when coords change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function DeliveryLocationMapWrapper({
  latitude,
  longitude,
  onMarkerDragEnd
}: DeliveryLocationMapWrapperProps) {
  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const markerRef = useRef<any>(null);

  const centerCoords: [number, number] = useMemo(() => [latitude, longitude], [latitude, longitude]);

  const streetUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onMarkerDragEnd(latLng.lat, latLng.lng);
        }
      },
    }),
    [onMarkerDragEnd]
  );

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#E7E7EC]">
      
      {/* Map layer switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex bg-white rounded-lg p-1 shadow-md border border-[#E7E7EC]">
        <button
          type="button"
          onClick={() => setActiveLayer('streets')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLayer === 'streets'
              ? 'bg-[#d3121a] text-white'
              : 'text-[#64748b] hover:bg-slate-100'
          }`}
        >
          Vista Calles
        </button>
        <button
          type="button"
          onClick={() => setActiveLayer('satellite')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLayer === 'satellite'
              ? 'bg-[#d3121a] text-white'
              : 'text-[#64748b] hover:bg-slate-100'
          }`}
        >
          Vista Satelital
        </button>
      </div>

      <MapContainer
        center={centerCoords}
        zoom={15}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        zoomControl={true}
      >
        <TileLayer
          url={activeLayer === 'streets' ? streetUrl : satelliteUrl}
          attribution={
            activeLayer === 'streets'
              ? '&copy; OpenStreetMap contributors'
              : 'Tiles &copy; Esri'
          }
        />

        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={centerCoords}
          icon={redLocationIcon}
          ref={markerRef}
        />

        <ChangeView center={centerCoords} />
      </MapContainer>
    </div>
  );
}
