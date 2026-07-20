"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Truck,
  Package2,
  Users,
  Settings,
  LogOut,
  Shield,
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  PhoneOff,
  Phone,
  MessageCircle,
  MapPin,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  DEFAULT_ORDERS,
  type CourierOrder,
  type OrderStatus,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_TEMPLATES,
} from '@/data/courier';

export default function MisEntregasPage() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [routeActive, setRouteActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_courier_orders');
    setOrders(stored ? JSON.parse(stored) : DEFAULT_ORDERS);
  }, []);

  const saveOrders = (updated: CourierOrder[]) => {
    setOrders(updated);
    localStorage.setItem('enkargord_courier_orders', JSON.stringify(updated));
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // In "Modo Repartidor", admin can see all active orders across all couriers
  const routeOrders = orders
    .filter((o) => !['delivered', 'settled', 'returned', 'failed_delivery'].includes(o.status))
    .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99));

  const current = routeOrders[currentIdx];
  const total = routeOrders.length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const totalCollected = orders.filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + (o.amountCollected ?? 0), 0);

  const handleMark = (status: 'delivered' | 'no_answer') => {
    if (!current) return;
    const updated = orders.map((o) =>
      o.id === current.id
        ? {
            ...o,
            status: status as OrderStatus,
            ...(status === 'delivered'
              ? { deliveredAt: new Date().toISOString(), amountCollected: o.financials.orderCollectionAmount }
              : {}),
          }
        : o
    );
    saveOrders(updated);
    if (currentIdx >= routeOrders.length - 1) setCurrentIdx(0);
    triggerToast(status === 'delivered'
      ? `✅ ${current.customer.name} — entregado`
      : `📵 ${current.customer.name} — no contesta`
    );
  };

  const STATUS_LABEL: Record<OrderStatus, string> = {
    assigned: 'Asignado', picked_up: 'Recogido', on_route: 'En ruta',
    next_delivery: 'Próximo', no_answer: 'No contesta', rescheduled: 'Reprogramado',
    delivered: 'Entregado', failed_delivery: 'Fallido', returned: 'Devuelto',
    pending_settlement: 'Pend. liquidación', settled: 'Liquidado',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#E7E7EC] flex flex-col fixed top-0 bottom-0 left-0 z-40">
        <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
          <div className="relative w-[200px] h-16">
            <Image src="/logo.png" alt="EnkargoRD" fill className="object-contain object-center" priority />
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {[
            { href: '/admin',             icon: Package2, label: 'Dashboard Admin' },
            { href: '/admin/mensajeros',  icon: Users,    label: 'Mensajeros' },
            { href: '/admin/operaciones', icon: Settings, label: 'Configuración' },
            { href: '/admin/mis-entregas',icon: Truck,    label: 'Modo Repartidor' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E7E7EC] space-y-2">
          <div className="flex items-center gap-2 bg-[#fee2e2] border border-red-200 rounded-xl px-3 py-2">
            <Shield size={13} className="text-[#d3121a] flex-shrink-0" />
            <span className="text-[10px] font-bold text-[#d3121a]">Modo Repartidor Activo</span>
          </div>
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="pl-[260px] min-h-screen flex flex-col">
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Shield size={18} className="text-[#d3121a]" />
              Modo Repartidor
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Administrador operando como motorista · Acceso a todos los pedidos activos
            </p>
          </div>
          <button
            onClick={() => setRouteActive(!routeActive)}
            className={`flex items-center gap-2 font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all ${
              routeActive
                ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'
                : 'bg-[#d3121a] text-white shadow-red-100 hover:bg-[#b00f14]'
            }`}
          >
            {routeActive ? <><Pause size={15} />Pausar ruta</> : <><Play size={15} />Iniciar ruta</>}
          </button>
        </header>

        <div className="p-8 space-y-6 max-w-4xl">

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 font-medium">
              En Modo Repartidor, el administrador puede operar como motorista: marcar entregas, registrar cobros, contactar clientes y avanzar en la ruta. Toda la lógica operativa es compartida con el panel del motorista.
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total activos',   value: routeOrders.length,    color: 'text-slate-800' },
              { label: 'Entregados hoy',  value: delivered,             color: 'text-emerald-700' },
              { label: 'Recaudado',       value: `RD$${totalCollected.toLocaleString()}`, color: 'text-[#d3121a]' },
              { label: 'No contactados',  value: orders.filter((o) => o.status === 'no_answer').length, color: 'text-red-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
                <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Current order */}
          {current ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-[#d3121a] to-[#b00f14] rounded-2xl p-6 text-white shadow-lg shadow-red-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-200">
                    Pedido actual ({currentIdx + 1}/{total})
                  </span>
                  <span className="text-xs font-extrabold bg-white/20 px-3 py-1 rounded-full">{current.trackingId}</span>
                </div>
                <h2 className="text-xl font-extrabold">{current.customer.name}</h2>
                <div className="flex items-start gap-2 mt-2 mb-3">
                  <MapPin size={14} className="text-red-200 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-100">{current.deliveryAddress.fullAddress}</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-red-200">Tienda:</span>
                  <span className="text-sm font-bold">{current.storeName}</span>
                  <span className="ml-auto text-xl font-extrabold">
                    RD${current.financials.orderCollectionAmount.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${current.customer.phone}`}
                    className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white"
                  >
                    <Phone size={15} /> Llamar
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      current.customer.phone,
                      DEFAULT_WHATSAPP_TEMPLATES[0].template,
                      { motorista: 'Administrador', tienda: current.storeName, tracking: current.trackingId }
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMark('delivered')}
                  className="flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-100 transition-all"
                >
                  <CheckCircle size={18} /> Entregado
                </button>
                <button
                  onClick={() => handleMark('no_answer')}
                  className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-extrabold text-sm"
                >
                  <PhoneOff size={18} /> No contesta
                </button>
              </div>

              {/* SIGUIENTE */}
              <button
                onClick={() => setCurrentIdx((i) => Math.min(i + 1, total - 1))}
                disabled={currentIdx >= total - 1}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-2xl font-extrabold text-base shadow-md shadow-red-100 transition-all"
              >
                <SkipForward size={20} />
                SIGUIENTE
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center shadow-sm">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-extrabold text-slate-800">¡Todo procesado!</h3>
              <p className="text-slate-400 mt-2">No hay pedidos activos pendientes en este momento.</p>
            </div>
          )}

          {/* All active orders table */}
          {routeOrders.length > 0 && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#E7E7EC]">
                <h3 className="font-extrabold text-slate-800 text-sm">Todos los pedidos activos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Tracking</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Motorista</th>
                      <th className="py-3 px-4">Dirección</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E7EC]">
                    {routeOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className={`transition-colors cursor-pointer ${idx === currentIdx ? 'bg-[#fee2e2]/30' : 'hover:bg-slate-50'}`}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        <td className="py-3 px-4 font-extrabold text-[#d3121a]">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{order.trackingId}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{order.customer.name}</td>
                        <td className="py-3 px-4 text-slate-500">{order.courierName}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{order.deliveryAddress.fullAddress}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                            order.status === 'no_answer' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-[10px] font-bold text-[#d3121a] hover:underline">
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
