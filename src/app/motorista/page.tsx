"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  PhoneOff,
  DollarSign,
  TrendingUp,
  AlertCircle,
  MapPin,
  Navigation,
  Play,
  ChevronRight,
  Phone,
  MessageCircle,
  BarChart2,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_ORDERS,
  DEFAULT_PRICING,
  type CourierOrder,
  type OrderStatus,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_TEMPLATES,
} from '@/data/courier';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCourierTracking } from '@/hooks/useCourierTracking';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';

const STATUS_LABEL: Record<OrderStatus, string> = {
  assigned:          'Asignado',
  picked_up:         'Recogido',
  on_route:          'En ruta',
  next_delivery:     'Próximo',
  no_answer:         'No contesta',
  rescheduled:       'Reprogramado',
  delivered:         'Entregado',
  failed_delivery:   'Fallido',
  returned:          'Devuelto',
  pending_settlement:'Pend. liquidación',
  settled:           'Liquidado',
};

export default function MotoristaHome() {
  const { profile } = useAuth() as any;
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [routeActive, setRouteActive] = useState(false);

  // Load from Firestore in real-time matching courierId
  useEffect(() => {
    if (profile?.courierId) {
      const q = query(collection(db, 'orders'), where('courierId', '==', profile.courierId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreOrders = snapshot.docs.map((docSnap) => {
          const o = docSnap.data();
          const mappedStatus = o.status === 'customer_unreachable' ? 'no_answer' : o.status;
          return {
            id: o.id || docSnap.id,
            trackingId: o.tracking || docSnap.id,
            status: mappedStatus as OrderStatus,
            storeId: o.storeId || 'STORE_01',
            storeName: o.storeName || 'Tienda Enkargo',
            courierId: o.courierId || '',
            courierName: o.courierName || '',
            createdAt: o.createdAt || new Date().toISOString(),
            customer: {
              name: o.customerName || 'Cliente',
              phone: o.customerPhone || '',
              email: o.customerEmail || ''
            },
            deliveryAddress: {
              addressLine: o.formattedAddress || o.street || '',
              provinceId: o.provinceId || '',
              provinceName: o.provinceName || '',
              municipalityId: o.municipalityId || '',
              municipalityName: o.municipalityName || '',
              sectorName: o.sectorName || '',
              city: o.municipalityName ? `${o.sectorName} (${o.municipalityName})` : '',
              fullAddress: o.formattedAddress || o.street || '',
              coordinates: {
                lat: o.latitude || 18.4795,
                lng: o.longitude || -69.9326
              }
            },
            amountCollected: o.collectionAmount || 0,
            fulfillment: {
              required: o.requiresFulfillment || false
            },
            financials: {
              orderCollectionAmount: o.collectionAmount || 0,
              courierCommission: 100, // Comisión simulada
              storeProductAmount: o.collectionAmount || 0,
            }
          };
        });
        setOrders(firestoreOrders as any);
      }, (error) => {
        console.error("Error loading courier orders from Firestore:", error);
      });

      const routeState = localStorage.getItem('enkargord_route_active');
      if (routeState === 'true') setRouteActive(true);

      return () => unsubscribe();
    } else {
      // Fallback local storage
      const stored = localStorage.getItem('enkargord_courier_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      }
      const routeState = localStorage.getItem('enkargord_route_active');
      if (routeState === 'true') setRouteActive(true);
    }
  }, [profile]);

  const {
    trackingStatus,
    lastLocation,
    errorMsg,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking
  } = useCourierTracking();

  const toggleRoute = async () => {
    const next = !routeActive;
    setRouteActive(next);
    localStorage.setItem('enkargord_route_active', String(next));

    if (next) {
      await startTracking();
    } else {
      await stopTracking();
    }
  };

  // KPI calculations
  const myOrders = orders; // Ya vienen filtrados desde la base de datos para este courier
  const assigned       = myOrders.filter((o) => o.status === 'assigned').length;
  const onRoute        = myOrders.filter((o) => o.status === 'on_route' || o.status === 'picked_up').length;
  const delivered      = myOrders.filter((o) => o.status === 'delivered').length;
  const noAnswer       = myOrders.filter((o) => o.status === 'no_answer').length;
  const pending        = myOrders.filter((o) => ['assigned', 'picked_up', 'on_route', 'next_delivery'].includes(o.status)).length;
  const totalCollected = myOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.amountCollected ?? 0), 0);
  const totalCommission = myOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.financials.courierCommission, 0);
  const pendingSettle  = myOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.financials.storeProductAmount, 0);

  // Next delivery
  const nextOrder = myOrders
    .filter((o) => ['assigned', 'on_route', 'picked_up'].includes(o.status))
    .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99))[0];

  const kpis = [
    { label: 'Asignados',    value: assigned,  icon: Package,     color: 'text-slate-700',   bg: 'bg-slate-100' },
    { label: 'Pendientes',   value: pending,   icon: Clock,       color: 'text-amber-700',   bg: 'bg-amber-50' },
    { label: 'En ruta',      value: onRoute,   icon: Truck,       color: 'text-blue-700',    bg: 'bg-blue-50' },
    { label: 'Entregados',   value: delivered, icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'No contesta',  value: noAnswer,  icon: PhoneOff,    color: 'text-red-700',     bg: 'bg-red-50' },
    {
      label: 'Recaudado',
      value: `RD$${totalCollected.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Mi comisión',
      value: `RD$${totalCommission.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      label: 'Por liquidar',
      value: `RD$${pendingSettle.toLocaleString()}`,
      icon: AlertCircle,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
    },
  ];

  const progress = myOrders.length > 0 ? Math.round((delivered / myOrders.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-full">

      {/* ── Greeting ─────────────────────────── */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">¡Buenos días, {profile?.fullName?.split(' ')[0] || 'Motorista'}! 👋</h2>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Start Route Banner ───────────────── */}
      <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 transition-all ${
        routeActive
          ? 'bg-gradient-to-r from-[#d3121a] to-[#b00f14] text-white shadow-lg shadow-red-200'
          : 'bg-white border border-[#E7E7EC] shadow-sm'
      }`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${routeActive ? 'text-red-100' : 'text-slate-400'}`}>
            {routeActive ? '🟢 Ruta activa' : 'Estado de ruta'}
          </p>
          <h3 className={`text-lg font-extrabold ${routeActive ? 'text-white' : 'text-slate-800'}`}>
            {routeActive ? 'Ruta en progreso' : 'Ruta no iniciada'}
          </h3>
          <p className={`text-sm mt-0.5 ${routeActive ? 'text-red-100' : 'text-slate-400'}`}>
            {routeActive
              ? `${pending} entrega${pending !== 1 ? 's' : ''} pendiente${pending !== 1 ? 's' : ''} · ${progress}% completado`
              : 'Presiona el botón para comenzar tu jornada'}
          </p>
        </div>
        <button
          onClick={toggleRoute}
          className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm transition-all ${
            routeActive
              ? 'bg-white text-[#d3121a] hover:bg-red-50'
              : 'bg-[#d3121a] text-white hover:bg-[#b00f14] shadow-md shadow-red-100'
          }`}
        >
          {routeActive ? (
            <>Pausar</>
          ) : (
            <><Play size={16} />Iniciar ruta</>
          )}
        </button>
      </div>

      {/* ── Tracking Controls ─────────────────── */}
      {routeActive && (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              trackingStatus === 'active' ? 'bg-emerald-500 animate-pulse' :
              trackingStatus === 'paused' ? 'bg-amber-500' : 'bg-slate-400'
            }`} />
            <div>
              <span className="font-bold text-slate-800">
                {trackingStatus === 'active' ? 'Ubicación en vivo transmitiendo' :
                 trackingStatus === 'paused' ? 'Seguimiento pausado' : 'Seguimiento inactivo'}
              </span>
              {lastLocation && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Precisión: {Math.round(lastLocation.accuracy)}m · Act. {new Date(lastLocation.updatedAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {trackingStatus === 'active' ? (
              <button
                onClick={pauseTracking}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold"
              >
                Pausar GPS
              </button>
            ) : trackingStatus === 'paused' ? (
              <button
                onClick={resumeTracking}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold"
              >
                Reanudar GPS
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* GPS Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Progress Bar ────────────────────── */}
      {routeActive && (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-700">Progreso del recorrido</span>
            <span className="text-sm font-extrabold text-[#d3121a]">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d3121a] to-[#ff4757] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-2">
            <span>{delivered} entregados</span>
            <span>{pending} pendientes</span>
          </div>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
                <Icon size={17} className={kpi.color} />
              </div>
              <div className="text-xl font-extrabold text-slate-900">{kpi.value}</div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Next Delivery Card ───────────────── */}
      {nextOrder ? (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Zap size={16} className="text-[#d3121a]" />
              Próxima entrega
            </h3>
            <Link href={`/motorista/pedidos/${nextOrder.id}`} className="text-xs font-bold text-[#d3121a] flex items-center gap-1 hover:gap-2 transition-all">
              Ver pedido <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#fee2e2] rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-[#d3121a]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800">{nextOrder.customer.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{nextOrder.deliveryAddress.fullAddress}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {nextOrder.trackingId}
                </span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  RD${nextOrder.financials.orderCollectionAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${nextOrder.customer.phone}`}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-sm font-bold text-slate-700 transition-all"
            >
              <Phone size={15} />
              Llamar
            </a>
            <WhatsAppContactButton
              phone={nextOrder.customer.phone}
              orderId={nextOrder.id}
              storeName={nextOrder.storeName || 'Tienda'}
              trackingId={nextOrder.trackingId || nextOrder.id}
              templateKey="in_transit"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700">¡No hay entregas pendientes!</p>
          <p className="text-sm text-slate-400 mt-1">Todas las entregas han sido procesadas.</p>
        </div>
      )}

      {/* ── Quick Links ──────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/motorista/pedidos',        icon: Package,    label: 'Ver pedidos',      sub: `${assigned + pending} asignados`,  color: 'text-slate-600',   bg: 'bg-slate-50' },
          { href: '/motorista/no-contactados', icon: PhoneOff,   label: 'No contactados',   sub: `${noAnswer} sin respuesta`,       color: 'text-red-600',     bg: 'bg-red-50' },
          { href: '/motorista/entregados',     icon: CheckCircle,label: 'Entregados',       sub: `${delivered} hoy`,                color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { href: '/motorista/liquidacion',    icon: BarChart2,  label: 'Liquidación',      sub: 'Solicitar cierre',                color: 'text-violet-600',  bg: 'bg-violet-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-[#E7E7EC] rounded-2xl p-4 hover:shadow-md transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${item.bg}`}>
                <Icon size={17} className={item.color} />
              </div>
              <div className="font-bold text-sm text-slate-800 group-hover:text-[#d3121a] transition-colors">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.sub}</div>
            </Link>
          );
        })}
      </div>

      {/* ── Recent Activity ─────────────────── */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm">Actividad reciente</h3>
          <Link href="/motorista/pedidos" className="text-[11px] font-bold text-[#d3121a] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-[#E7E7EC]">
          {myOrders.slice(0, 4).map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                order.status === 'delivered' ? 'bg-emerald-500' :
                order.status === 'no_answer' ? 'bg-red-500' :
                order.status === 'on_route'  ? 'bg-blue-500' :
                'bg-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 truncate">{order.customer.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{order.trackingId}</div>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                order.status === 'no_answer' ? 'bg-red-50 text-red-700' :
                order.status === 'on_route'  ? 'bg-blue-50 text-blue-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {STATUS_LABEL[order.status]}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
