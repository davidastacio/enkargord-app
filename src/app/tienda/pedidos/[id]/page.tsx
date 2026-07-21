"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  Truck, 
  DollarSign, 
  Clock, 
  Calendar,
  ShieldAlert,
  Loader2,
  Copy,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrderEvent {
  id: string;
  type: string;
  note?: string;
  createdAt: string;
  actorRole?: string;
}

export default function StoreOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth() as any;

  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId || !profile?.uid) return;

    setLoading(true);
    const orderRef = doc(db, 'orders', orderId);

    const unsubscribeOrder = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storeId = profile.storeId || profile.uid;

        // Security check: restrict viewing to owner store or admin
        if (profile.role !== 'Admin' && profile.role !== 'Administrador' && data.storeId !== storeId && data.storeId !== profile.uid) {
          setOrder(null);
        } else {
          setOrder({ id: docSnap.id, ...data });
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading order detail:", err);
      setLoading(false);
    });

    // Subcollection timeline events
    const eventsQuery = query(collection(db, 'orders', orderId, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OrderEvent));
      setEvents(list);
    }, (err) => {
      console.error("Error loading order timeline events:", err);
    });

    return () => {
      unsubscribeOrder();
      unsubscribeEvents();
    };
  }, [orderId, profile]);

  const handleCopyTracking = () => {
    if (!order) return;
    const track = order.tracking || order.trackingId || order.id;
    navigator.clipboard.writeText(track);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#d3121a]" />
        <span className="text-xs font-bold text-slate-400">Cargando información real del pedido...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto mt-8">
        <ShieldAlert size={40} className="text-amber-500 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">Pedido no encontrado o sin acceso</h3>
        <p className="text-xs text-slate-500 font-medium">
          El pedido solicitado no existe o pertenece a otra tienda registrada.
        </p>
        <Link
          href="/tienda/pedidos"
          className="inline-flex items-center gap-2 bg-[#d3121a] text-white text-xs font-extrabold px-5 py-3 rounded-xl hover:bg-[#b00f14] transition-all"
        >
          <ArrowLeft size={16} /> Volver a Mis Pedidos
        </Link>
      </div>
    );
  }

  const trackingCode = order.tracking || order.trackingId || order.id;
  const totalAmount = (order.collectionAmount || 0) + (order.shippingCost || 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/tienda/pedidos" 
            className="p-2.5 bg-white border border-[#E7E7EC] hover:bg-slate-50 rounded-xl text-slate-600 transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-950 font-mono">#{trackingCode}</h2>
              <button 
                onClick={handleCopyTracking}
                className="text-xs text-slate-400 hover:text-[#d3121a] flex items-center gap-1 font-bold"
              >
                {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Registrado el {order.createdAt ? new Date(order.createdAt).toLocaleString('es-DO') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
            order.status === 'in_transit' || order.status === 'on_route' ? 'bg-amber-100 text-amber-700' :
            order.status === 'customer_unreachable' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {order.status === 'delivered' ? 'Entregado' : order.status === 'in_transit' ? 'En Ruta' : order.status === 'customer_unreachable' ? 'No Contesta' : order.status}
          </span>
        </div>
      </div>

      {/* 2-Column Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Address Card */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <User size={18} className="text-[#d3121a]" /> Datos del Destinatario
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Cliente</span>
                <span className="text-slate-900 font-bold block">{order.customerName || 'Cliente'}</span>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono de Contacto</span>
                <a href={`tel:${order.customerPhone}`} className="text-[#d3121a] hover:underline flex items-center gap-1 font-bold">
                  <Phone size={13} /> {order.customerPhone || 'N/A'}
                </a>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección de Entrega</span>
              <p className="bg-slate-50 border border-[#E7E7EC] p-3 rounded-xl font-semibold text-slate-700 leading-relaxed flex items-start gap-2">
                <MapPin size={16} className="text-[#d3121a] flex-shrink-0 mt-0.5" />
                {order.formattedAddress || order.street || 'Sin dirección completa'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-semibold pt-1">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Provincia</span>
                <span className="text-slate-800">{order.provinceName || 'Santo Domingo'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Municipio</span>
                <span className="text-slate-800">{order.municipalityName || 'Distrito Nacional'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Sector</span>
                <span className="text-slate-800">{order.sectorName || 'N/A'}</span>
              </div>
            </div>

            {order.referenceNote && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punto de Referencia</span>
                <p className="text-xs text-slate-600 font-medium italic">{order.referenceNote}</p>
              </div>
            )}
          </section>

          {/* Financials & Package Details */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Package size={18} className="text-[#d3121a]" /> Detalles del Paquete y Pago
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Tipo de Paquete</span>
                <span className="text-slate-900 block font-bold">{order.packageType || 'Paquete'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Cantidad</span>
                <span className="text-slate-900 block font-bold">{order.packageQuantity || 1} un.</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Método de Pago</span>
                <span className="text-slate-900 block font-bold uppercase">{order.paymentMethod || 'Efectivo (COD)'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Motorista Asignado</span>
                <span className="text-slate-900 block font-bold">{order.courierName || 'No asignado'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-[#E7E7EC] rounded-xl p-4 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Monto a Recaudar (COD)</span>
                <span className="text-base font-extrabold text-slate-900">RD${(order.collectionAmount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Costo de Envío</span>
                <span className="text-base font-extrabold text-[#d3121a]">RD${(order.shippingCost || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Monto Total</span>
                <span className="text-base font-extrabold text-emerald-600">RD${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </section>

        </div>

        {/* Right Timeline column */}
        <div className="space-y-6">
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock size={16} className="text-[#d3121a]" /> Historial de Estados
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                No hay historial de eventos aún.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 space-y-4 font-sans text-xs">
                {events.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 bg-[#d3121a] rounded-full border-2 border-white" />
                    <span className="font-bold text-slate-800 block uppercase text-[11px]">{evt.type}</span>
                    {evt.note && <p className="text-slate-500 text-[11px] mt-0.5">{evt.note}</p>}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {evt.createdAt ? new Date(evt.createdAt).toLocaleString('es-DO') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </div>

    </div>
  );
}
