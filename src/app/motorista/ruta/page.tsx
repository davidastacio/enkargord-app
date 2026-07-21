"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Navigation,
  MapPin,
  ChevronRight,
  Phone,
  MessageCircle,
  CheckCircle,
  PhoneOff,
  ArrowDown,
  ArrowUp,
  SkipForward,
  Clock,
  AlertTriangle,
  Play
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, setDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCourierTracking } from '@/hooks/useCourierTracking';
import { type OrderStatus } from '@/data/courier';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';

const STATUS_BADGE: Record<OrderStatus | string, { label: string; color: string; bg: string }> = {
  pending:           { label: 'Pendiente',        color: 'text-slate-700',   bg: 'bg-slate-100' },
  assigned:          { label: 'Asignado',         color: 'text-slate-700',   bg: 'bg-slate-100' },
  picked_up:         { label: 'Recogido',          color: 'text-blue-700',    bg: 'bg-blue-50' },
  in_transit:        { label: 'En ruta',           color: 'text-blue-700',    bg: 'bg-blue-50' },
  next_delivery:     { label: 'Próximo',           color: 'text-violet-700',  bg: 'bg-violet-50' },
  no_answer:         { label: 'No contesta',       color: 'text-red-700',     bg: 'bg-red-50' },
  customer_unreachable: { label: 'No contesta',    color: 'text-red-700',     bg: 'bg-red-50' },
  rescheduled:       { label: 'Reprogramado',      color: 'text-amber-700',   bg: 'bg-amber-50' },
  delivered:         { label: 'Entregado',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed_delivery:   { label: 'Fallido',           color: 'text-red-700',     bg: 'bg-red-50' },
  returned:          { label: 'Devuelto',          color: 'text-orange-700',  bg: 'bg-orange-50' },
  pending_settlement:{ label: 'Pend. liquidación', color: 'text-orange-700',  bg: 'bg-orange-50' },
  settled:           { label: 'Liquidado',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

export default function RutaPage() {
  const router = useRouter();
  const { profile } = useAuth() as any;
  const { trackingStatus, lastLocation } = useCourierTracking();

  const [orders, setOrders] = useState<any[]>([]);
  const [route, setRoute] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Operational dialog triggers
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'delivered' | 'customer_unreachable' | null>(null);
  
  // Custom alerts
  const [toast, setToast] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Delivered inputs
  const [receiverName, setReceiverName] = useState('');
  const [collectedAmount, setCollectedAmount] = useState('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch courier orders and active route
  useEffect(() => {
    if (!profile?.courierId) return;

    // Load active orders assigned to the courier
    const qOrders = query(
      collection(db, 'orders'),
      where('courierId', '==', profile.courierId)
    );

    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list);
    });

    // Load active route
    const qRoute = query(
      collection(db, 'courier_routes'),
      where('courierId', '==', profile.courierId),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribeRoute = onSnapshot(qRoute, async (snapshot) => {
      if (!snapshot.empty) {
        const routeDoc = snapshot.docs[0];
        setRoute({ id: routeDoc.id, ...routeDoc.data() });
      } else {
        // No active route, initialize one automatically if they have assigned orders
        await initializeNewRoute();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeRoute();
    };
  }, [profile]);

  // Helper to initialize a new route in Firestore
  const initializeNewRoute = async () => {
    if (!profile?.courierId || orders.length === 0) return;

    const activeOrders = orders
      .filter(o => ['assigned', 'picked_up', 'in_transit', 'customer_unreachable'].includes(o.status))
      .map(o => o.id);

    if (activeOrders.length === 0) return;

    try {
      const routeId = `RTE-${Date.now()}`;
      const firstOrder = orders.find(o => o.id === activeOrders[0]);
      
      const newRoute = {
        id: routeId,
        courierId: profile.courierId,
        courierUid: profile.uid,
        orderIds: activeOrders,
        currentOrderId: activeOrders[0],
        nextOrderId: activeOrders[1] || null,
        currentProvinceName: firstOrder?.provinceName || '',
        currentMunicipalityName: firstOrder?.municipalityName || '',
        currentSectorName: firstOrder?.sectorName || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'courier_routes', routeId), newRoute);

      // Log event
      await addDoc(collection(db, 'courier_routes', routeId, 'events'), {
        type: 'route_started',
        note: 'Ruta de entregas iniciada automáticamente',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error creating active route:", e);
    }
  };

  // Filter orders related to active route
  const activeRouteOrders: any[] = route
    ? route.orderIds.map((id: string) => orders.find((o: any) => o.id === id)).filter(Boolean)
    : [];

  const currentIdx = route && route.currentOrderId 
    ? route.orderIds.indexOf(route.currentOrderId) 
    : 0;

  const currentOrder = activeRouteOrders.find(o => o.id === route?.currentOrderId) || activeRouteOrders[0];
  const total = activeRouteOrders.length;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder || !actionType || !route) return;

    try {
      const nowStr = new Date().toISOString();
      const expectedAmount = currentOrder.collectionAmount || 0;
      const actual = actionType === 'delivered' ? (parseFloat(collectedAmount) || 0) : 0;

      // Update Order Status in Firestore
      await updateDoc(doc(db, 'orders', currentOrder.id), {
        status: actionType,
        updatedAt: nowStr,
        ...(actionType === 'delivered' ? {
          deliveredAt: nowStr,
          deliveredByUid: profile?.uid,
          collectedAmount: actual,
          receiverName: receiverName || 'Cliente'
        } : {
          lastContactAttemptAt: nowStr
        })
      });

      // Log Order Event
      await addDoc(collection(db, 'orders', currentOrder.id, 'events'), {
        type: `status_updated_to_${actionType}`,
        previousStatus: currentOrder.status,
        newStatus: actionType,
        actorUid: profile?.uid,
        actorRole: 'courier',
        note: actionType === 'delivered'
          ? `Entregado a: ${receiverName || 'Cliente'}. RD$${actual} cobrado.`
          : 'Cliente no contesta',
        createdAt: nowStr
      });

      // Update courier counters if delivered
      if (actionType === 'delivered') {
        const { increment } = require('firebase/firestore');
        await updateDoc(doc(db, 'couriers', profile.courierId), {
          completedOrderCount: increment(1),
          currentOrderCount: increment(-1),
          updatedAt: nowStr
        });
      }

      setShowConfirm(false);
      setReceiverName('');
      setCollectedAmount('');
      triggerToast(actionType === 'delivered' ? `✅ Entrega confirmada` : `📵 Reportado: Cliente no contesta`);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado de la entrega.');
    }
  };

  // Advanced to Next order on route
  const handleAdvanceRoute = async () => {
    if (!route || !currentOrder) return;

    // 1. Check if current order is resolved
    const isResolved = ['delivered', 'no_answer', 'customer_unreachable', 'failed', 'cancelled'].includes(currentOrder.status);
    if (!isResolved) {
      setErrorAlert("Debes completar o reportar el pedido actual antes de continuar.");
      setTimeout(() => setErrorAlert(null), 4000);
      return;
    }

    // Find next unresolved order in route orderIds
    const nextIdx = route.orderIds.indexOf(currentOrder.id) + 1;
    const nextId = route.orderIds[nextIdx] || null;
    const nextOrder = nextId ? orders.find(o => o.id === nextId) : null;

    try {
      const nowStr = new Date().toISOString();
      const payload: Record<string, any> = {
        currentOrderId: nextId,
        nextOrderId: route.orderIds[nextIdx + 1] || null,
        currentProvinceName: nextOrder?.provinceName || '',
        currentMunicipalityName: nextOrder?.municipalityName || '',
        currentSectorName: nextOrder?.sectorName || '',
        updatedAt: nowStr
      };

      if (!nextId) {
        payload.status = 'completed';
        payload.completedAt = nowStr;
      }

      await updateDoc(doc(db, 'courier_routes', route.id), payload);

      // Log Route event
      await addDoc(collection(db, 'courier_routes', route.id, 'events'), {
        type: nextId ? 'route_step_advanced' : 'route_completed',
        note: nextId ? `Avanzó al pedido: ${nextId}` : 'Ruta completada totalmente',
        createdAt: nowStr
      });

      triggerToast(nextId ? "Avanzando al siguiente destino..." : "🎉 ¡Ruta de entregas completada!");
    } catch (e) {
      console.error("Error advancing route step:", e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-10 h-10 border-4 border-[#d3121a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando ruta...</h2>
      </div>
    );
  }

  if (activeRouteOrders.length === 0 || !route || route.status === 'completed' || !currentOrder) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-slate-800">¡Ruta completada!</h2>
        <p className="text-slate-400 mt-2">No tienes entregas activas pendientes de asignación en tu ruta.</p>
        <Link href="/motorista" className="mt-6 inline-block py-3 px-6 bg-[#d3121a] text-white rounded-xl font-bold text-xs">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  const progressPct = total > 0 ? Math.round((currentIdx / total) * 100) : 0;

  return (
    <div className="space-y-5 max-w-md mx-auto pb-10">

      {/* Dynamic Alerts */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-slate-950/95 backdrop-blur text-white px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}

      {errorAlert && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <span>{errorAlert}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Ruta de entregas</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Entrega {currentIdx + 1} de {total} · {total - currentIdx - 1} restantes
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-[#d3121a]">{progressPct}%</div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Progreso</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#d3121a] to-[#ff4757] rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Current Delivery Card */}
      <div className="bg-gradient-to-br from-[#d3121a] to-[#b00f14] rounded-2xl p-5 text-white shadow-lg shadow-red-200 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-200 bg-white/10 px-2.5 py-1 rounded-full">
            📍 Destino actual
          </span>
          <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full font-mono">{currentOrder.tracking || currentOrder.id}</span>
        </div>

        <div>
          <h3 className="text-lg font-black mb-1">{currentOrder.customerName}</h3>
          <div className="flex items-start gap-1.5 opacity-90 text-sm">
            <MapPin size={14} className="text-red-200 flex-shrink-0 mt-0.5" />
            <p className="font-semibold">{currentOrder.formattedAddress || currentOrder.street}</p>
          </div>
          <span className="text-[10px] font-bold text-red-200 block mt-1 uppercase tracking-wider">
            {currentOrder.sectorName}, {currentOrder.municipalityName}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-2xl font-extrabold">RD${(currentOrder.collectionAmount || 0).toLocaleString()}</span>
          <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest">recaudo contra entrega</span>
        </div>

        {/* Quick contact */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href={`tel:${currentOrder.customerPhone}`}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white transition-all border border-white/10"
          >
            <Phone size={14} /> Llamar
          </a>
          <WhatsAppContactButton
            phone={currentOrder.customerPhone}
            orderId={currentOrder.id}
            storeName={currentOrder.storeName || 'Tienda'}
            trackingId={currentOrder.tracking || currentOrder.id}
            templateKey="in_transit"
          />
        </div>
      </div>

      {/* Action Buttons */}
      {!showConfirm ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setActionType('delivered'); setShowConfirm(true); }}
            className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-100 transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle size={18} /> Entregado
          </button>
          <button
            onClick={() => { setActionType('customer_unreachable'); setShowConfirm(true); }}
            className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-[#d3121a] border border-red-200 rounded-2xl font-extrabold text-sm transition-all active:scale-95 cursor-pointer"
          >
            <PhoneOff size={18} /> No contesta
          </button>
        </div>
      ) : (
        <form onSubmit={handleActionSubmit} className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest text-center">
            {actionType === 'delivered' ? '✓ Confirmación de cobro y entrega' : '⚠️ Registrar intento fallido'}
          </h3>

          {actionType === 'delivered' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nombre de quien recibe
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Ej. Hermano, Portero, Vecino..."
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Monto recaudado (RD$)
                </label>
                <input
                  type="number"
                  required
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  placeholder={String(currentOrder.collectionAmount || 0)}
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none font-bold"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-500 text-center">
              ¿Seguro que deseas reportar que el cliente no contesta a las llamadas?
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              className={`py-3 rounded-xl font-extrabold text-xs text-white cursor-pointer ${
                actionType === 'delivered' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {actionType === 'delivered' ? 'Confirmar entrega' : 'Confirmar no respuesta'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="py-3 rounded-xl font-extrabold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* SIGUIENTE Button */}
      <button
        onClick={handleAdvanceRoute}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-2xl font-black text-sm shadow-md shadow-red-100 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
      >
        <SkipForward size={16} />
        Siguiente parada
        <ChevronRight size={16} />
      </button>

      {/* Route List / Order sequence */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E7E7EC]">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Navigation size={14} className="text-[#d3121a]" />
            Lista de paradas asignadas
          </h3>
        </div>
        <div className="divide-y divide-[#E7E7EC]">
          {activeRouteOrders.map((order: any, idx: number) => {
            const badge = STATUS_BADGE[order.status] || { label: order.status, color: 'text-slate-500', bg: 'bg-slate-100' };
            const isActive = order.id === currentOrder.id;
            return (
              <div
                key={order.id}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all ${
                  isActive ? 'bg-[#fee2e2]/30 border-l-4 border-l-[#d3121a]' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                  isActive ? 'bg-[#d3121a] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-700 truncate">{order.customerName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{order.sectorName || order.municipalityName}</div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.color}`}>
                  {badge.label}
                </span>
                <Link
                  href={`/motorista/pedidos/${order.id}`}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Detalle →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
