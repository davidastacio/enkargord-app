"use client";

import { useState, useEffect } from 'react';
import { MapPin, Clock, Truck, ShieldCheck, User, AlertCircle, Play, Phone } from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StoreTracking() {
  const { profile } = useAuth() as any;
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [courierInfo, setCourierInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch active orders belonging to store
  useEffect(() => {
    if (!profile?.storeId) return;

    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', profile.storeId),
      where('status', 'in', ['assigned', 'picked_up', 'in_transit', 'customer_unreachable'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list);

      // Pre-select first order if none selected
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

  // Selected Order
  const activeOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  // 2. Fetch Courier document in real-time matching activeOrder courierId
  useEffect(() => {
    if (!activeOrder?.courierId) {
      setCourierInfo(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'couriers', activeOrder.courierId), (docSnap) => {
      if (docSnap.exists()) {
        setCourierInfo(docSnap.data());
      } else {
        setCourierInfo(null);
      }
    }, (error) => {
      console.error("Error listening to courier in store tracking:", error);
    });

    return () => unsubscribe();
  }, [activeOrder]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-10 h-10 border-4 border-[#d3121a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando monitoreo...</h2>
      </div>
    );
  }

  // Check if courier has recent location updates (less than 2 minutes old)
  const isOnline = () => {
    if (!courierInfo?.lastLocation?.updatedAt) return false;
    const diff = Date.now() - new Date(courierInfo.lastLocation.updatedAt).getTime();
    return diff < 120000; // 2 minutes in ms
  };

  const hasLiveTracking = courierInfo?.trackingStatus === 'active' && isOnline();

  // Status mapping
  const statusLabels: Record<string, string> = {
    assigned: 'Repartidor Asignado',
    picked_up: 'Recogido en Tienda',
    in_transit: 'En Tránsito',
    customer_unreachable: 'No contesta'
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-955 tracking-tight">Seguimiento de Entregas en Vivo</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Rastrea las rutas de tus repartidores y monitorea los tiempos de entrega.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Monitorear Pedido:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-[#E7E7EC] rounded-xl bg-white focus:outline-none"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.customerName} ({o.tracking || o.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center shadow-sm">
          <Truck size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No hay entregas activas en curso</p>
          <p className="text-xs text-slate-400 mt-1">
            Los repartidores aparecerán aquí en vivo tan pronto les asignes pedidos en la Torre de Control.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Map column */}
          <div className="lg:col-span-8 bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
                {hasLiveTracking ? '🟢 Transmisión de ubicación en vivo' : '📡 Ubicación fuera de línea'}
              </span>
              {courierInfo?.lastLocation?.updatedAt && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  Act. hace {Math.round((Date.now() - new Date(courierInfo.lastLocation.updatedAt).getTime()) / 60000)} min.
                </span>
              )}
            </div>

            <div className="w-full h-[400px] rounded-xl overflow-hidden relative">
              {hasLiveTracking && courierInfo.lastLocation ? (
                <MapComponent activeCouriers={[
                  {
                    name: courierInfo.fullName || activeOrder.courierName,
                    status: courierInfo.status === 'on_route' ? 'En ruta' : 'Disponible',
                    lat: courierInfo.lastLocation.latitude,
                    lng: courierInfo.lastLocation.longitude,
                    pendingCount: courierInfo.currentOrderCount || 1
                  }
                ]} />
              ) : (
                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center border border-dashed border-slate-200 rounded-xl">
                  <AlertCircle size={32} className="text-slate-300 mb-2 animate-pulse" />
                  <span className="font-bold text-slate-600">Ubicación en vivo no disponible</span>
                  <span className="max-w-xs mt-1 text-[11px]">
                    El repartidor debe iniciar la ruta de entregas desde su teléfono y activar el GPS para transmitir su señal.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Courier details & progression */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Courier Card */}
            {courierInfo ? (
              <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  🛵 Repartidor Asignado
                </h4>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fee2e2] text-[#d3121a] flex items-center justify-center font-bold">
                    {(courierInfo.fullName || 'R').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{courierInfo.fullName}</h5>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {courierInfo.vehicleType} · Placa {courierInfo.vehiclePlate}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Estado del GPS:</span>
                    <span className={`font-bold ${hasLiveTracking ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {hasLiveTracking ? '🟢 En vivo' : '🔴 Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teléfono:</span>
                    <a href={`tel:${courierInfo.phone}`} className="text-slate-900 hover:underline flex items-center gap-1">
                      <Phone size={10} /> {courierInfo.phone}
                    </a>
                  </div>
                  <div className="flex justify-between text-xs font-extrabold text-[#d3121a] pt-1">
                    <span>Estado del pedido:</span>
                    <span>{statusLabels[activeOrder.status] || activeOrder.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 text-center text-slate-400 text-xs">
                Cargando información del repartidor asignado...
              </div>
            )}

            {/* Logistics Timeline */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
              <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                📋 Información Logística
              </h4>

              <div className="text-xs space-y-3 font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Destinatario</span>
                  <span className="text-slate-800">{activeOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Dirección de Entrega</span>
                  <span className="text-slate-800 leading-relaxed block">{activeOrder.formattedAddress || activeOrder.street}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Monto de Recaudo COD</span>
                  <span className="text-sm font-extrabold text-[#d3121a]">RD${(activeOrder.collectionAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
