"use client";

import { useState } from 'react';
import {
  PhoneOff,
  Phone,
  MessageCircle,
  RotateCcw,
  Calendar,
  Home,
  MapPin,
  Clock,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { type CourierOrder, type NoAnswerAttempt, buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATES } from '@/data/courier';
import { useCourierOrders } from '@/hooks/useCourierOrders';
import { addSupabaseOrderEvent, updateSupabaseOrder } from '@/lib/supabase/orders';

export default function NoContactadosPage() {
  const { orders, setOrders, courierId, profile } = useCourierOrders();
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [notes, setNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'list' | 'detail'>('list');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const noAnswerOrders = orders.filter(
    (o) => o.courierId === courierId && (o.status === 'no_answer' || o.status === 'rescheduled')
  );

  const addAttempt = async (orderId: string, channel: 'call' | 'whatsapp' | 'both') => {
    const target = orders.find((order) => order.id === orderId);
    if (!target) return;
    const prevAttempts = target.noAnswerRecord?.attempts ?? [];
    const newAttempt: NoAnswerAttempt = {
      attemptNumber: prevAttempts.length + 1,
      timestamp: new Date().toISOString(),
      channel,
      notes: notes || '',
    };
    const noAnswerRecord = { orderId, attempts: [...prevAttempts, newAttempt] };
    const updated = orders.map((o) => {
      if (o.id !== orderId) return o;
      return { ...o, noAnswerRecord };
    });
    setOrders(updated);
    await updateSupabaseOrder(orderId, { noAnswerRecord });
    await addSupabaseOrderEvent(orderId, {
      type: 'contact_attempt',
      actorUid: profile?.uid || '',
      actorRole: 'courier',
      courierId,
      note: notes || `Intento por ${channel}`,
      createdAt: newAttempt.timestamp,
    });
    setNotes('');
    triggerToast('Intento registrado correctamente.');
  };

  const reschedule = async (orderId: string) => {
    if (!rescheduleDate) return;
    const updated = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'rescheduled' as const, scheduledAt: new Date(rescheduleDate).toISOString() }
        : o
    );
    setOrders(updated);
    await updateSupabaseOrder(orderId, {
      status: 'rescheduled',
      scheduledAt: new Date(rescheduleDate).toISOString(),
    });
    setRescheduleDate('');
    setSelectedOrder(null);
    setActivePanel('list');
    triggerToast('Pedido reprogramado correctamente.');
  };

  const returnToStore = async (orderId: string) => {
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'returned' as const,
            noAnswerRecord: {
              ...o.noAnswerRecord!,
              returnedToStore: true,
            },
          }
        : o
    );
    setOrders(updated);
    await updateSupabaseOrder(orderId, {
      status: 'returned',
      noAnswerRecord: updated.find((order) => order.id === orderId)?.noAnswerRecord || null,
    });
    setSelectedOrder(null);
    setActivePanel('list');
    triggerToast('Pedido marcado como devuelto a tienda.');
  };

  const markIncorrectAddress = async (orderId: string) => {
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'failed_delivery' as const,
            noAnswerRecord: {
              ...o.noAnswerRecord!,
              incorrectAddress: true,
            },
          }
        : o
    );
    setOrders(updated);
    await updateSupabaseOrder(orderId, {
      status: 'failed_delivery',
      noAnswerRecord: updated.find((order) => order.id === orderId)?.noAnswerRecord || null,
    });
    triggerToast('Dirección marcada como incorrecta.');
  };

  const openDetail = (order: CourierOrder) => {
    setSelectedOrder(order);
    setActivePanel('detail');
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Cliente no contesta</h2>
          <p className="text-sm text-slate-400 mt-0.5">{noAnswerOrders.length} casos registrados</p>
        </div>
        {activePanel === 'detail' && (
          <button
            onClick={() => { setSelectedOrder(null); setActivePanel('list'); }}
            className="text-sm font-bold text-[#d3121a] hover:underline"
          >
            ← Volver
          </button>
        )}
      </div>

      {/* ── LIST VIEW ───────────────────────────── */}
      {activePanel === 'list' && (
        <div className="space-y-3">
          {noAnswerOrders.length === 0 && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-10 text-center">
              <PhoneOff size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No hay casos de no-contacto</p>
            </div>
          )}
          {noAnswerOrders.map((order) => {
            const attemptCount = order.noAnswerRecord?.attempts?.length ?? 0;
            const isRescheduled = order.status === 'rescheduled';
            return (
              <div
                key={order.id}
                className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                onClick={() => openDetail(order)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">{order.customer.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{order.trackingId}</div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full flex-shrink-0 ${
                    isRescheduled ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {isRescheduled ? 'Reprogramado' : 'No contesta'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin size={12} />
                  <span className="truncate">{order.deliveryAddress.fullAddress}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Phone size={9} /> {attemptCount} intento{attemptCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] font-bold bg-[#fee2e2] text-[#d3121a] px-2 py-0.5 rounded-full">
                    RD${order.financials.orderCollectionAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL VIEW ─────────────────────────── */}
      {activePanel === 'detail' && selectedOrder && (() => {
        const attempts = selectedOrder.noAnswerRecord?.attempts ?? [];
        const waUrl = buildWhatsAppUrl(
          selectedOrder.customer.phone,
          DEFAULT_WHATSAPP_TEMPLATES[3].template, // "No logro comunicarme"
          { motorista: 'Carlos Martínez', tienda: selectedOrder.storeName, tracking: selectedOrder.trackingId }
        );

        return (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
              <div className="font-extrabold text-slate-800 mb-1">{selectedOrder.customer.name}</div>
              <div className="text-xs text-slate-400 font-mono mb-3">{selectedOrder.trackingId}</div>
              <div className="flex items-start gap-2 text-xs text-slate-600 mb-4">
                <MapPin size={13} className="flex-shrink-0 text-slate-400 mt-0.5" />
                {selectedOrder.deliveryAddress.fullAddress}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedOrder.customer.phone}`}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-sm font-bold text-slate-700"
                >
                  <Phone size={15} /> Llamar
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Attempt History */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Clock size={14} className="text-[#d3121a]" />
                  Historial de intentos ({attempts.length})
                </h4>
              </div>
              {attempts.length === 0 ? (
                <div className="p-4 text-xs text-slate-400 text-center">Sin intentos registrados</div>
              ) : (
                <div className="divide-y divide-[#E7E7EC]">
                  {attempts.map((a) => (
                    <div key={a.attemptNumber} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-extrabold text-red-600 flex-shrink-0">
                        {a.attemptNumber}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-700">
                          {a.channel === 'call' ? '📞 Llamada' : a.channel === 'whatsapp' ? '💬 WhatsApp' : '📞💬 Ambos'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.timestamp).toLocaleString('es-DO')}
                        </div>
                        {a.notes && <div className="text-xs text-slate-500 mt-1 italic">"{a.notes}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Register new attempt */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Plus size={14} className="text-[#d3121a]" />
                Registrar nuevo intento
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observación (opcional)..."
                rows={2}
                className="w-full text-sm border border-[#E7E7EC] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
              />
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addAttempt(selectedOrder.id, 'call')} className="py-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-slate-700">
                  📞 Llamada
                </button>
                <button onClick={() => addAttempt(selectedOrder.id, 'whatsapp')} className="py-2.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700">
                  💬 WhatsApp
                </button>
                <button onClick={() => addAttempt(selectedOrder.id, 'both')} className="py-2.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700">
                  Ambos
                </button>
              </div>
            </div>

            {/* Reschedule */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Calendar size={14} className="text-[#d3121a]" />
                Reprogramar entrega
              </h4>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full text-sm border border-[#E7E7EC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
              />
              <button
                onClick={() => reschedule(selectedOrder.id)}
                disabled={!rescheduleDate}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm transition-all"
              >
                <Calendar size={15} className="inline mr-2" />
                Reprogramar
              </button>
            </div>

            {/* Other Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => markIncorrectAddress(selectedOrder.id)}
                className="py-3 flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-sm font-bold text-orange-700 transition-all"
              >
                <AlertTriangle size={15} /> Dirección incorrecta
              </button>
              <button
                onClick={() => returnToStore(selectedOrder.id)}
                className="py-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-bold text-red-700 transition-all"
              >
                <Home size={15} /> Devolver a tienda
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
