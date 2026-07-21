"use client";

import { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, ShieldCheck, User, Phone, Package, Navigation, Loader2 } from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';

export default function StoreTracking() {
  const { profile } = useAuth() as any;
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [courierLocation, setCourierLocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch active orders belonging to store
  useEffect(() => {
    if (!profile?.uid) return;
    const storeId = profile.storeId || profile.uid;

    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('status', 'in', ['assigned', 'picked_up', 'in_transit', 'on_route', 'customer_unreachable', 'next_delivery'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list);

      if (list.length > 0 && !selectedOrderId) {
        setSelectedOrderId(list[0].id);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching store active orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, selectedOrderId]);

  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  // 2. Fetch live courier location if courierUid/courierId is present
  useEffect(() => {
    const courierUid = activeOrder?.courierUid || activeOrder?.courierId;
    if (!courierUid) {
      setCourierLocation(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'courier_locations', courierUid), (docSnap) => {
      if (docSnap.exists()) {
        setCourierLocation(docSnap.data());
      } else {
        setCourierLocation(null);
      }
    }, (err) => {
      console.error("Error fetching courier live location:", err);
      setCourierLocation(null);
    });

    return () => unsubscribe();
  }, [activeOrder]);

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#d3121a]" />
        <span className="text-xs font-bold text-slate-400">Cargando mapa de seguimiento en tiempo real...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
        <Navigation size={40} className="text-slate-300 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">No hay envíos activos en ruta</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          El mapa de seguimiento mostrará la ubicación en vivo cuando tu tienda tenga pedidos en estado asignado o en tránsito.
        </p>
      </div>
    );
  }

  // Real Map markers
  const deliveryLat = activeOrder?.latitude || activeOrder?.deliveryLatitude;
  const deliveryLng = activeOrder?.longitude || activeOrder?.deliveryLongitude;
  const hasDeliveryCoords = deliveryLat && deliveryLng;

  const courierLat = courierLocation?.latitude;
  const courierLng = courierLocation?.longitude;
  const hasCourierCoords = courierLat && courierLng;

  const markers: any[] = [];
  if (hasDeliveryCoords) {
    markers.push({
      id: 'dest',
      position: { lat: deliveryLat, lng: deliveryLng },
      title: `Destino: ${activeOrder.customerName || 'Cliente'}`,
    });
  }
  if (hasCourierCoords) {
    markers.push({
      id: 'courier',
      position: { lat: courierLat, lng: courierLng },
      title: `Motorista: ${activeOrder.courierName || 'Repartidor'}`,
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Seguimiento en Tiempo Real</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Monitorea la ubicación real de los motoristas que transportan los envíos de tu tienda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Orders List */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm px-2">Envíos Activos ({orders.length})</h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedOrderId === o.id
                    ? 'border-[#d3121a] bg-[#fee2e2]/20 font-bold'
                    : 'border-[#E7E7EC] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-slate-900 font-extrabold">#{o.tracking || o.id}</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {o.status}
                  </span>
                </div>
                <p className="text-slate-800 font-bold truncate">{o.customerName || 'Cliente'}</p>
                <p className="text-[11px] text-slate-400 truncate">{o.formattedAddress || o.street || 'Sin dirección'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Map and Details Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map View */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm h-[360px] relative">
            {hasCourierCoords || hasDeliveryCoords ? (
              <MapComponent
                activeCouriers={[
                  {
                    name: activeOrder?.courierName || 'Motorista',
                    status: activeOrder?.status || 'on_route',
                    lat: courierLat || deliveryLat,
                    lng: courierLng || deliveryLng,
                    pendingCount: orders.length,
                  }
                ]}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-center p-6 space-y-2">
                <MapPin size={32} className="text-slate-300" />
                <p className="text-xs font-bold text-slate-600">El motorista todavía no está compartiendo ubicación en vivo.</p>
                <p className="text-[11px] text-slate-400">Las coordenadas se actualizarán automáticamente cuando la app del motorista esté activa.</p>
              </div>
            )}
          </div>

          {/* Active Order Card Info */}
          {activeOrder && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4 text-xs font-semibold">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Motorista Asignado</span>
                  <p className="text-slate-900 font-bold text-sm flex items-center gap-2 mt-0.5">
                    <Truck size={16} className="text-[#d3121a]" />
                    {activeOrder.courierName || 'No asignado'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <WhatsAppContactButton
                    orderId={activeOrder.id}
                    phone={activeOrder.customerPhone || ''}
                    storeName={profile?.name || 'Tienda'}
                    tracking={activeOrder.tracking || activeOrder.id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Cliente</span>
                  <span className="text-slate-800 font-bold">{activeOrder.customerName || 'Cliente'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Última Actualización</span>
                  <span className="text-slate-800">
                    {courierLocation?.updatedAt ? new Date(courierLocation.updatedAt).toLocaleTimeString('es-DO') : 'Sin transmisión en vivo'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Zona Actual</span>
                  <span className="text-slate-800">{activeOrder.sectorName || 'Santo Domingo'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
