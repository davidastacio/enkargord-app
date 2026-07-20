"use client";

import dynamic from 'next/dynamic';

const MapWrapper = dynamic(
  () => import('./DeliveryLocationMapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-slate-100 border border-[#E7E7EC] rounded-xl flex items-center justify-center text-[#64748b] text-sm animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <span>📡 Cargando visor de localización...</span>
        </div>
      </div>
    )
  }
);

interface DeliveryLocationMapProps {
  latitude: number;
  longitude: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function DeliveryLocationMap({
  latitude,
  longitude,
  onMarkerDragEnd
}: DeliveryLocationMapProps) {
  return (
    <MapWrapper 
      latitude={latitude} 
      longitude={longitude} 
      onMarkerDragEnd={onMarkerDragEnd} 
    />
  );
}
