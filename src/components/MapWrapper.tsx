"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker path assets issues by using a pure HTML/Emoji DivIcon
const createCourierIcon = (courierName: string) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-white border-2 border-[#d3121a] rounded-full flex items-center justify-center shadow-lg transform -translate-y-1 transition-all duration-300">
          <span style="font-size: 16px;">🛵</span>
        </div>
        <div class="absolute top-4 bg-[#1e293b] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap transform translate-y-3">
          ${courierName}
        </div>
      </div>
    `,
    className: 'custom-leaflet-courier-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -15]
  });
};

interface MapWrapperProps {
  activeCouriers: Array<{
    name: string;
    status: string;
    lat: number;
    lng: number;
    pendingCount: number;
  }>;
}

// Controller component to re-center or pan map when coords change
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center);
  }, [center, map]);
  return null;
}

export default function MapWrapper({ activeCouriers }: MapWrapperProps) {
  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const centerCoords: [number, number] = [18.4861, -69.9312]; // Santo Domingo

  const streetUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#E7E7EC]">
      {/* View Toggle Panel */}
      <div className="absolute top-3 right-3 z-[1000] flex bg-white rounded-lg p-1 shadow-md border border-[#E7E7EC]">
        <button
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
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url={activeLayer === 'streets' ? streetUrl : satelliteUrl}
          attribution={
            activeLayer === 'streets'
              ? '&copy; OpenStreetMap contributors'
              : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
          }
        />

        {activeCouriers.map((courier, index) => (
          <Marker
            key={`${courier.name}-${index}`}
            position={[courier.lat, courier.lng]}
            icon={createCourierIcon(courier.name)}
          >
            <Popup>
              <div className="p-1 min-w-[160px] text-slate-800 font-sans">
                <div className="font-bold text-sm text-[#d3121a] mb-1 flex items-center gap-1">
                  🛵 {courier.name}
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <div>
                    <strong>Conexión:</strong>{' '}
                    <span className="text-emerald-600 font-semibold">{courier.status}</span>
                  </div>
                  <div>
                    <strong>Zona Actual:</strong> Santo Domingo
                  </div>
                  <div>
                    <strong>Paquetes en Ruta:</strong>{' '}
                    <span className="font-semibold text-slate-700">{courier.pendingCount}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 mt-2">
                    📍 GPS: {courier.lat.toFixed(5)}, {courier.lng.toFixed(5)}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController center={centerCoords} />
      </MapContainer>
    </div>
  );
}
