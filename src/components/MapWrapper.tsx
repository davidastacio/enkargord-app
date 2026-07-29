"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
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
  customerStops: Array<{
    id: string;
    name: string;
    tracking: string;
    storeName: string;
    address: string;
    lat: number;
    lng: number;
    distanceKm?: number;
    recommended?: boolean;
  }>;
  onSelectStop?: (id: string) => void;
}

const createCustomerIcon = (recommended = false) =>
  L.divIcon({
    html: `<div style="width:34px;height:34px;border-radius:12px;background:${recommended ? '#d3121a' : '#0f766e'};border:3px solid white;box-shadow:0 4px 12px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;font-size:16px">📦</div>`,
    className: 'custom-leaflet-customer-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

// Controller component to re-center or pan map when coords change
function MapController({
  couriers,
  stops,
}: {
  couriers: MapWrapperProps['activeCouriers'];
  stops: MapWrapperProps['customerStops'];
}) {
  const map = useMap();
  useEffect(() => {
    const points = [
      ...couriers.map((courier) => [courier.lat, courier.lng] as [number, number]),
      ...stops.map((stop) => [stop.lat, stop.lng] as [number, number]),
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }
    map.fitBounds(
      points,
      { padding: [45, 45], maxZoom: 16 },
    );
  }, [couriers, map, stops]);
  return null;
}

export default function MapWrapper({
  activeCouriers,
  customerStops,
  onSelectStop,
}: MapWrapperProps) {
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

        {customerStops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createCustomerIcon(stop.recommended)}
          >
            <Tooltip permanent direction="top" offset={[0, -16]} opacity={0.95}>
              <span className="text-[10px] font-bold">
                {stop.recommended ? '⭐ ' : ''}{stop.name}
              </span>
            </Tooltip>
            <Popup>
              <div className="min-w-[190px] space-y-2 p-1 font-sans text-slate-800">
                <div>
                  <div className="text-sm font-extrabold">{stop.name}</div>
                  <div className="text-[10px] font-bold text-[#d3121a]">{stop.tracking}</div>
                </div>
                <div className="text-xs text-slate-600">
                  <div><strong>Tienda:</strong> {stop.storeName}</div>
                  <div className="mt-1"><strong>Dirección:</strong> {stop.address}</div>
                  {typeof stop.distanceKm === 'number' && (
                    <div className="mt-1 font-extrabold text-emerald-700">
                      A {stop.distanceKm < 1
                        ? `${Math.round(stop.distanceKm * 1000)} m`
                        : `${stop.distanceKm.toFixed(1)} km`}
                    </div>
                  )}
                </div>
                {onSelectStop && (
                  <button
                    type="button"
                    onClick={() => onSelectStop(stop.id)}
                    className="w-full rounded-lg bg-[#d3121a] px-3 py-2 text-xs font-extrabold text-white"
                  >
                    Trabajar este pedido
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController couriers={activeCouriers} stops={customerStops} />
      </MapContainer>
    </div>
  );
}
