"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  MapPin,
  Phone,
  MessageCircle,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  User,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCourierTracking } from '@/hooks/useCourierTracking';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATES } from '@/data/courier';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';

type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "customer_unreachable"
  | "delivered"
  | "failed"
  | "cancelled";

interface OrderEvent {
  id: string;
  type: string;
  previousStatus: string;
  newStatus: string;
  actorRole: string;
  note?: string;
  createdAt: string;
}

export default function PedidoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { profile } = useAuth() as any;
  const { sendManualLocation } = useCourierTracking();
  const [sendingLocation, setSendingLocation] = useState(false);

  const handleSendLocation = async () => {
    setSendingLocation(true);
    const res = await sendManualLocation(orderId);
    alert(res.msg);
    setSendingLocation(false);
  };

  const [order, setOrder] = useState<any | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Unreachable modal states
  const [showUnreachableModal, setShowUnreachableModal] = useState(false);
  const [unreachableReason, setUnreachableReason] = useState('no_answer_call');
  const [unreachableNote, setUnreachableNote] = useState('');

  // Delivered modal states
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    if (!orderId || !profile?.courierId) return;

    // 1. Subscribe to order details
    const unsubscribeOrder = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Security check: only allow assigned courier to view this
        if (data.courierId !== profile.courierId) {
          alert('No tienes permisos para ver esta orden.');
          router.push('/motorista/pedidos');
          return;
        }
        setOrder({ id: docSnap.id, ...data });
        setCollectedAmount(String(data.collectionAmount || 0));
      } else {
        alert('El pedido no existe.');
        router.push('/motorista/pedidos');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching order detail:", error);
      setLoading(false);
    });

    // 2. Subscribe to order events subcollection
    const qEvents = query(collection(db, 'orders', orderId, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderEvent));
      setEvents(list);
    }, (error) => {
      console.error("Error fetching order events:", error);
    });

    return () => {
      unsubscribeOrder();
      unsubscribeEvents();
    };
  }, [orderId, profile, router]);

  // Transition handler
  const transitionTo = async (nextStatus: OrderStatus, additionalFields: Record<string, any> = {}, eventNote?: string) => {
    if (!order || updating) return;
    setUpdating(true);

    try {
      const prevStatus = order.status;
      const nowString = new Date().toISOString();

      // 1. Update order document
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        updatedAt: nowString,
        ...additionalFields
      });

      // 2. Log event in orders/{id}/events subcollection
      await addDoc(collection(db, 'orders', order.id, 'events'), {
        type: `status_updated_to_${nextStatus}`,
        previousStatus: prevStatus,
        newStatus: nextStatus,
        actorUid: profile?.uid || 'UNKNOWN',
        actorRole: 'courier',
        courierId: profile?.courierId || '',
        note: eventNote || `Estado cambiado a ${nextStatus}`,
        createdAt: nowString
      });

      // 3. Create global audit log
      const auditId = `AUD-${Date.now()}`;
      await setDoc(doc(db, 'audit_logs', auditId), {
        id: auditId,
        action: `courier_transition_${nextStatus}`,
        actorUid: profile?.uid || 'UNKNOWN',
        actorRole: 'courier',
        targetType: 'order',
        targetId: order.id,
        metadata: {
          previousStatus: prevStatus,
          newStatus: nextStatus,
          ...additionalFields
        },
        createdAt: nowString
      });

      // 4. Update courier stats if delivered
      if (nextStatus === 'delivered' && profile?.courierId) {
        await updateDoc(doc(db, 'couriers', profile.courierId), {
          completedOrderCount: incrementValue(1),
          currentOrderCount: incrementValue(-1),
          updatedAt: nowString
        });
      }

      // 5. Update courier status to available if no other active orders in route
      // (This will be recalculated dynamically by admin, no need to force here)

    } catch (error) {
      console.error("Error updating order state:", error);
      alert("Error al actualizar el estado de la orden.");
    } finally {
      setUpdating(false);
    }
  };

  // Safe helper to increment since server increment is imported differently
  const incrementValue = (val: number) => {
    // In browser client sdk we can import increment from firestore
    const { increment } = require('firebase/firestore');
    return increment(val);
  };

  const handleConfirmRecogida = () => {
    transitionTo('picked_up', {}, 'Paquete recogido en tienda');
  };

  const handleIniciarEntrega = () => {
    transitionTo('in_transit', {}, 'Entrega iniciada camino al cliente');
  };

  const handleReintentarEntrega = () => {
    transitionTo('in_transit', {}, 'Reintento de entrega iniciado');
  };

  const handleUnreachableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reasonLabels: Record<string, string> = {
      no_answer_call: 'No responde llamada',
      no_answer_wa: 'No responde WhatsApp',
      phone_off: 'Teléfono apagado',
      wrong_number: 'Número incorrecto',
      address_not_found: 'Dirección no localizada',
      other: 'Otro'
    };

    const friendlyReason = reasonLabels[unreachableReason] || unreachableReason;
    const note = `Intento de contacto fallido: ${friendlyReason}. ${unreachableNote}`;

    transitionTo('customer_unreachable', {
      unreachableReason,
      unreachableNote,
      lastContactAttemptAt: new Date().toISOString()
    }, note);

    setShowUnreachableModal(false);
    setUnreachableNote('');
  };

  const handleDeliveredSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expected = order.collectionAmount || 0;
    const actual = parseFloat(collectedAmount) || 0;

    if (actual < 0) {
      alert('El monto cobrado no puede ser negativo.');
      return;
    }

    if (order.requiresCashOnDelivery && actual === 0) {
      if (!confirm('Este pedido requiere cobro contra entrega pero has puesto RD$0. ¿Deseas continuar?')) {
        return;
      }
    }

    if (actual !== expected && expected > 0) {
      if (!confirm(`El monto cobrado (RD$${actual}) difiere del monto esperado (RD$${expected}). ¿Confirmas que este es el monto correcto cobrado?`)) {
        return;
      }
    }

    transitionTo('delivered', {
      deliveredAt: new Date().toISOString(),
      deliveredByUid: profile?.uid || 'UNKNOWN',
      collectedAmount: actual,
      collectionPaymentMethod: paymentMethod,
      receiverName: receiverName || 'Cliente',
      deliveryNote: deliveryNote || ''
    }, `Entregado a: ${receiverName || 'Cliente'}. Monto cobrado: RD$${actual}`);

    setShowDeliveredModal(false);
    setReceiverName('');
    setDeliveryNote('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-4 border-[#d3121a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const expectedAmount = order.collectionAmount || 0;
  const statusLabels: Record<OrderStatus | string, string> = {
    pending: 'Pendiente',
    assigned: 'Asignado',
    picked_up: 'Recogido en tienda',
    in_transit: 'En tránsito',
    customer_unreachable: 'No contesta',
    delivered: 'Entregado',
    failed: 'Fallido',
    cancelled: 'Cancelado'
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans pb-10">
      
      {/* ── Header ───────────────────────────── */}
      <header className="bg-white border-b border-[#E7E7EC] sticky top-0 z-30 px-4 py-4 flex items-center justify-between">
        <Link href="/motorista/pedidos" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors font-bold text-xs">
          <ChevronLeft size={16} /> Volver
        </Link>
        <div className="text-center">
          <span className="text-[10px] font-extrabold bg-[#fee2e2] text-[#d3121a] px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
            Guía logística
          </span>
          <h1 className="text-sm font-black text-slate-950 font-mono tracking-wider mt-0.5">{order.tracking || order.id}</h1>
        </div>
        <div className="w-12" /> {/* spacer */}
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">

        {/* Status Alert Banner */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          order.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          order.status === 'customer_unreachable' ? 'bg-red-50 border-red-200 text-red-800' :
          order.status === 'in_transit' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {order.status === 'delivered' ? <CheckCircle2 size={18} className="text-emerald-500" /> :
           order.status === 'customer_unreachable' ? <AlertTriangle size={18} className="text-red-500" /> :
           <Clock size={18} className="text-slate-400 animate-pulse" />}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Estado operativo</div>
            <div className="text-xs font-extrabold">{statusLabels[order.status] || order.status}</div>
          </div>
        </div>

        {/* ── Client Details Card ──────────────── */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-b border-[#E7E7EC] pb-2">
            📍 Datos de Entrega
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cliente</span>
              <span className="font-bold text-slate-800">{order.customerName}</span>
            </div>
            
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Teléfono</span>
              <div className="flex gap-2">
                <a href={`tel:${order.customerPhone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl font-bold text-slate-700 transition-all">
                  <Phone size={13} /> Llamar
                </a>
                <WhatsAppContactButton
                  phone={order.customerPhone}
                  orderId={order.id}
                  storeName={order.storeName || 'Tienda'}
                  trackingId={order.tracking || order.id}
                  templateKey="in_transit"
                />
              </div>
            </div>

            {order.customerAlternatePhone && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Teléfono Alternativo</span>
                <a href={`tel:${order.customerAlternatePhone}`} className="text-slate-600 hover:underline font-bold">
                  {order.customerAlternatePhone}
                </a>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Dirección</span>
              <span className="font-semibold text-slate-700 leading-relaxed block">{order.formattedAddress || order.street}</span>
              <span className="text-[10px] font-bold text-slate-400 block mt-1">
                {order.sectorName}, {order.municipalityName} ({order.provinceName})
              </span>
            </div>

            {order.reference && (
              <div className="bg-slate-50 border border-[#E7E7EC] rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Referencia</span>
                <span className="text-xs text-slate-600 font-medium">{order.reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Package & Payment Details ─────────── */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-b border-[#E7E7EC] pb-2">
            📦 Paquete e Información Financiera
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Empaque</span>
              <span className="font-bold text-slate-800 capitalize">{order.packageType}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cantidad</span>
              <span className="font-bold text-slate-800">{order.packageQuantity} ud.</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cobro contra entrega</span>
              <span className={`font-bold ${order.requiresCashOnDelivery ? 'text-[#d3121a]' : 'text-slate-500'}`}>
                {order.requiresCashOnDelivery ? 'SÍ (Cobro obligatorio)' : 'NO (Prepagado)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Monto esperado</span>
              <span className="font-extrabold text-slate-950 text-sm">RD${expectedAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Actions Panel ────────────────────── */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest mb-1">
              🚀 Acciones de ruta
            </h3>

            {order.status === 'assigned' && (
              <button
                onClick={handleConfirmRecogida}
                disabled={updating}
                className="w-full py-3.5 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-red-100"
              >
                <Check size={16} /> Confirmar recogida en tienda
              </button>
            )}

            {order.status === 'picked_up' && (
              <button
                onClick={handleIniciarEntrega}
                disabled={updating}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-100"
              >
                <Play size={15} /> Iniciar entrega / En ruta
              </button>
            )}

            {(order.status === 'in_transit' || order.status === 'customer_unreachable') && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowDeliveredModal(true)}
                  disabled={updating}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                >
                  <CheckCircle2 size={15} /> Marcar como entregado
                </button>
                
                {order.status === 'in_transit' ? (
                  <button
                    onClick={() => setShowUnreachableModal(true)}
                    disabled={updating}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-[#d3121a] border border-red-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={15} /> Cliente no contesta
                  </button>
                ) : (
                  <button
                    onClick={handleReintentarEntrega}
                    disabled={updating}
                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
                  >
                    <Play size={15} /> Reintentar entrega
                  </button>
                )}
              </div>
            )}
            
            {/* Location manual send button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSendLocation}
                disabled={sendingLocation}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#E7E7EC] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                📍 Enviar ubicación actual
              </button>
            </div>
          </div>
        )}

        {/* ── Event History ─────────────────────── */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-slate-900 font-extrabold text-xs uppercase tracking-widest border-b border-[#E7E7EC] pb-2">
            🕒 Historial de la guía
          </h3>

          <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-4 text-xs">
            {events.length === 0 && (
              <p className="text-slate-400 font-medium">No se han registrado eventos para esta guía.</p>
            )}
            {events.map((ev) => (
              <div key={ev.id} className="relative">
                {/* timeline dot */}
                <span className="absolute -left-[21px] top-0.5 w-2 h-2 rounded-full bg-slate-300" />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                  <span>{ev.actorRole.toUpperCase()}</span>
                  <span>{new Date(ev.createdAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-bold text-slate-700">{ev.note || ev.type}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{new Date(ev.createdAt).toLocaleDateString('es-DO')}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Unreachable Modal ─────────────────── */}
      {showUnreachableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleUnreachableSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-sm">⚠️ Registro de Intento Fallido</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Motivo de contacto fallido
                </label>
                <select
                  value={unreachableReason}
                  onChange={(e) => setUnreachableReason(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl bg-white focus:outline-none"
                >
                  <option value="no_answer_call">No responde llamada</option>
                  <option value="no_answer_wa">No responde WhatsApp</option>
                  <option value="phone_off">Teléfono apagado</option>
                  <option value="wrong_number">Número incorrecto</option>
                  <option value="address_not_found">Dirección no localizada</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nota u observación
                </label>
                <textarea
                  value={unreachableNote}
                  onChange={(e) => setUnreachableNote(e.target.value)}
                  placeholder="Detalla qué ocurrió (ej: llamé 3 veces a las 2:00pm)..."
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowUnreachableModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#d3121a] hover:bg-[#b00f14] text-white rounded-xl text-xs font-bold"
              >
                Registrar intento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delivered Modal ───────────────────── */}
      {showDeliveredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleDeliveredSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-sm">✅ Confirmar Entrega</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Monto cobrado (RD$)
                </label>
                <input
                  type="number"
                  min={0}
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  disabled={!order.requiresCashOnDelivery}
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none font-bold"
                />
                {!order.requiresCashOnDelivery && (
                  <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                    Este pedido fue pagado previamente. No requiere cobro.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Método de pago cobrado
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl bg-white focus:outline-none"
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta / Enlace</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Nombre de quien recibe
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Ej. Juan Perez (Hermano)"
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Observación de entrega
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Detalle adicional sobre la entrega (ej: se dejó en recepción)..."
                  className="w-full px-3 py-2.5 text-xs border border-[#E7E7EC] rounded-xl focus:outline-none h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeliveredModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmar entrega
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
