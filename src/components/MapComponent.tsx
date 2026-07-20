"use client";

import dynamic from 'next/dynamic';

const MapWrapper = dynamic(
  () => import('./MapWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-slate-100 border border-[#E7E7EC] rounded-xl flex items-center justify-center text-[#64748b] text-sm animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <span>📡 Cargando Mapa Satelital...</span>
          <span className="text-xs text-slate-400">Torre de Control EnkargoRD</span>
        </div>
      </div>
    )
  }
);

interface MapComponentProps {
  activeCouriers: Array<{
    name: string;
    status: string;
    lat: number;
    lng: number;
    pendingCount: number;
  }>;
}

export default function MapComponent({ activeCouriers }: MapComponentProps) {
  return <MapWrapper activeCouriers={activeCouriers} />;
}
