"use client";

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { DEFAULT_ORDERS, type CourierOrder, type OrderStatus, buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATES } from '@/data/courier';

const STATUS_BADGE: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  assigned:          { label: 'Asignado',         color: 'text-slate-700',   bg: 'bg-slate-100' },
  picked_up:         { label: 'Recogido',          color: 'text-blue-700',    bg: 'bg-blue-50' },
  on_route:          { label: 'En ruta',           color: 'text-blue-700',    bg: 'bg-blue-50' },
  next_delivery:     { label: 'Próximo',           color: 'text-violet-700',  bg: 'bg-violet-50' },
  no_answer:         { label: 'No contesta',       color: 'text-red-700',     bg: 'bg-red-50' },
  rescheduled:       { label: 'Reprogramado',      color: 'text-amber-700',   bg: 'bg-amber-50' },
  delivered:         { label: 'Entregado',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed_delivery:   { label: 'Fallido',           color: 'text-red-700',     bg: 'bg-red-50' },
  returned:          { label: 'Devuelto',          color: 'text-orange-700',  bg: 'bg-orange-50' },
  pending_settlement:{ label: 'Pend. liquidación', color: 'text-orange-700',  bg: 'bg-orange-50' },
  settled:           { label: 'Liquidado',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

export default function RutaPage() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'delivered' | 'no_answer' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_courier_orders');
    const loaded = stored ? JSON.parse(stored) : DEFAULT_ORDERS;
    setOrders(loaded);
  }, []);

  const saveOrders = (updated: CourierOrder[]) => {
    setOrders(updated);
    localStorage.setItem('enkargord_courier_orders', JSON.stringify(updated));
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const routeOrders = orders
    .filter((o) => o.courierId === 'COU-001' && !['delivered', 'settled', 'returned'].includes(o.status))
    .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99));

  const current = routeOrders[currentIdx];
  const total = routeOrders.length;

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...routeOrders];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    const updatedRoute = updated.map((o, i) => ({ ...o, routeOrder: i + 1 }));
    const final = orders.map((o) => {
      const found = updatedRoute.find((r) => r.id === o.id);
      return found ?? o;
    });
    saveOrders(final);
  };

  const moveDown = (idx: number) => {
    if (idx >= routeOrders.length - 1) return;
    const updated = [...routeOrders];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    const updatedRoute = updated.map((o, i) => ({ ...o, routeOrder: i + 1 }));
    const final = orders.map((o) => {
      const found = updatedRoute.find((r) => r.id === o.id);
      return found ?? o;
    });
    saveOrders(final);
  };

  const handleNext = (newStatus: 'delivered' | 'no_answer') => {
    if (!current) return;
    const updated = orders.map((o) =>
      o.id === current.id
        ? { ...o, status: newStatus as OrderStatus, ...(newStatus === 'delivered' ? { deliveredAt: new Date().toISOString(), amountCollected: o.financials.orderCollectionAmount } : {}) }
        : o
    );
    saveOrders(updated);
    setShowConfirm(false);
    setActionType(null);
    if (currentIdx >= routeOrders.length - 1) {
      setCurrentIdx(0);
    }
    triggerToast(newStatus === 'delivered' ? `✅ ${current.customer.name} — entrega confirmada` : `📵 ${current.customer.name} — registrado como no contesta`);
  };

  if (!current) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-extrabold text-slate-800">¡Ruta completada!</h2>
        <p className="text-slate-400 mt-2">Todos los pedidos han sido procesados.</p>
      </div>
    );
  }

  const st = STATUS_BADGE[current.status];
  const waUrl = buildWhatsAppUrl(
    current.customer.phone,
    DEFAULT_WHATSAPP_TEMPLATES[0].template,
    { motorista: 'Carlos Martínez', tienda: current.storeName, tracking: current.trackingId }
  );

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
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
          <div className="text-2xl font-extrabold text-[#d3121a]">{Math.round(((currentIdx) / total) * 100)}%</div>
          <div className="text-[10px] text-slate-400 font-semibold">completado</div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#d3121a] to-[#ff4757] rounded-full transition-all duration-700"
          style={{ width: `${(currentIdx / total) * 100}%` }}
        />
      </div>

      {/* Current Delivery Card */}
      <div className="bg-gradient-to-br from-[#d3121a] to-[#b00f14] rounded-2xl p-5 text-white shadow-lg shadow-red-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-red-200">Entrega actual</span>
          <span className="text-xs font-extrabold bg-white/20 px-2.5 py-1 rounded-full">{current.trackingId}</span>
        </div>

        <h3 className="text-lg font-extrabold mb-1">{current.customer.name}</h3>
        <div className="flex items-start gap-2 mb-3">
          <MapPin size={14} className="text-red-200 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-100">{current.deliveryAddress.fullAddress}</p>
        </div>
        {current.deliveryAddress.reference && (
          <p className="text-xs text-red-200 mb-3">📍 {current.deliveryAddress.reference}</p>
        )}

        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold">RD${current.financials.orderCollectionAmount.toLocaleString()}</div>
          <div className="text-xs text-red-200">a recaudar</div>
        </div>

        {/* Quick contact */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <a
            href={`tel:${current.customer.phone}`}
            className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white transition-all"
          >
            <Phone size={15} /> Llamar
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white transition-all"
          >
            <MessageCircle size={15} /> WhatsApp
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      {!showConfirm ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setActionType('delivered'); setShowConfirm(true); }}
            className="flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-100 transition-all active:scale-95"
          >
            <CheckCircle size={18} /> Entregado
          </button>
          <button
            onClick={() => { setActionType('no_answer'); setShowConfirm(true); }}
            className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-extrabold text-sm transition-all active:scale-95"
          >
            <PhoneOff size={18} /> No contesta
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-700 text-center">
            {actionType === 'delivered'
              ? '¿Confirmar entrega exitosa?'
              : '¿Confirmar que el cliente no contestó?'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleNext(actionType!)}
              className={`py-3 rounded-xl font-extrabold text-sm ${
                actionType === 'delivered'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {actionType === 'delivered' ? '✅ Confirmar' : '📵 Confirmar'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="py-3 rounded-xl font-extrabold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* NEXT button */}
      <button
        onClick={() => setCurrentIdx((i) => Math.min(i + 1, total - 1))}
        disabled={currentIdx >= total - 1}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-2xl font-extrabold text-base shadow-md shadow-red-100 transition-all active:scale-95"
      >
        <SkipForward size={20} />
        SIGUIENTE
        <ChevronRight size={20} />
      </button>

      {/* Route List */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E7E7EC]">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Navigation size={15} className="text-[#d3121a]" />
            Orden de ruta
          </h3>
        </div>
        <div className="divide-y divide-[#E7E7EC]">
          {routeOrders.map((order, idx) => {
            const badge = STATUS_BADGE[order.status];
            const isActive = idx === currentIdx;
            return (
              <div
                key={order.id}
                className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${
                  isActive ? 'bg-[#fee2e2]/30' : 'hover:bg-slate-50'
                }`}
                onClick={() => setCurrentIdx(idx)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                  isActive ? 'bg-[#d3121a] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-700 truncate">{order.customer.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{order.deliveryAddress.sectorName ?? order.deliveryAddress.municipalityName}</div>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.color}`}>
                  {badge.label}
                </span>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveUp(idx); }} className="p-0.5 text-slate-300 hover:text-slate-600 transition-colors">
                    <ArrowUp size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveDown(idx); }} className="p-0.5 text-slate-300 hover:text-slate-600 transition-colors">
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
