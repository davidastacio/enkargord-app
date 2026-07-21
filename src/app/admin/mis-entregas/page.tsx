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
  MapPin,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';
import AuthenticatedUserMenu from '@/components/auth/AuthenticatedUserMenu';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  picked_up: 'Recogido',
  in_transit: 'En ruta',
  next_delivery: 'Próximo',
  no_answer: 'No contesta',
  customer_unreachable: 'No contesta',
  rescheduled: 'Reprogramado',
  delivered: 'Entregado',
  failed_delivery: 'Fallido',
  returned: 'Devuelto',
  pending_settlement: 'Pend. liquidación',
  settled: 'Liquidado',
};

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'in_transit', 'customer_unreachable', 'next_delivery'];

export default function MisEntregasPage() {
  const { user: authUser, profile } = useAuth() as any;

  // Real Firestore data
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile status state
  const [hasOperativeProfile, setHasOperativeProfile] = useState<boolean | null>(null);
  const [activatingProfile, setActivatingProfile] = useState(false);

  // UI state
  const [routeActive, setRouteActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Unified Identifier matching actual user/courier profile
  const adminUid = authUser?.uid;
  const adminCourierId = profile?.courierId || adminUid;

  // 1. Verify if courier profile document exists in `/couriers/{adminCourierId}`
  useEffect(() => {
    if (!adminCourierId) return;

    async function checkCourierProfile() {
      try {
        console.log(`[Repartidor Debug] Verificando perfil para UID: ${adminUid}, courierId: ${adminCourierId}`);
        const snap = await getDoc(doc(db, 'couriers', adminCourierId));
        if (snap.exists()) {
          console.log(`[Repartidor Debug] Perfil encontrado para ${adminCourierId}`);
          setHasOperativeProfile(true);
        } else {
          console.log(`[Repartidor Debug] Perfil NO encontrado para ${adminCourierId}`);
          setHasOperativeProfile(false);
        }
      } catch (err) {
        console.error("[Repartidor Debug] Error verificando perfil de mensajero:", err);
        setHasOperativeProfile(false);
      }
    }

    checkCourierProfile();
  }, [adminCourierId, adminUid]);

  // 2. Firestore real-time listener with clean error/finally separation
  useEffect(() => {
    if (!adminCourierId || hasOperativeProfile !== true) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`[Repartidor Debug] Conectando listener real-time a orders con courierId: ${adminCourierId}`);

    const q = query(
      collection(db, 'orders'),
      where('courierId', '==', adminCourierId),
      where('status', 'in', ACTIVE_STATUSES)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          console.log(`[Repartidor Debug] Consulta exitosa. Pedidos encontrados: ${list.length}`);
          
          list.sort((a: any, b: any) => {
            if (a.routeOrder !== undefined && b.routeOrder !== undefined) return a.routeOrder - b.routeOrder;
            return 0;
          });
          
          setOrders(list);
          setError(null);
        } catch (innerErr: any) {
          console.error('[Repartidor Debug] Error procesando documentos de consulta:', innerErr);
          setError('Error procesando datos de pedidos.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('[Repartidor Debug] Error real en onSnapshot. Código:', err.code, err.message);
        setError(`No se pudieron cargar los pedidos. (Error: ${err.code || 'Desconocido'})`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [adminCourierId, hasOperativeProfile]);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Activate Operative Profile ──────────────────────────────────────────────
  const handleActivateProfile = async () => {
    if (!adminCourierId || !authUser) return;
    setActivatingProfile(true);
    try {
      console.log(`[Repartidor Debug] Creando perfil operativo couriers/${adminCourierId}`);
      await setDoc(doc(db, 'couriers', adminCourierId), {
        id: adminCourierId,
        userUid: adminUid,
        fullName: profile?.name || authUser.displayName || 'Administrador',
        phone: profile?.phone || '—',
        email: authUser.email || '',
        vehicleType: 'motocicleta',
        vehiclePlate: 'ADMIN-1',
        status: 'available',
        currentOrderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setHasOperativeProfile(true);
      triggerToast("✅ Perfil de repartidor activado correctamente.");
    } catch (err: any) {
      console.error("[Repartidor Debug] Error creando perfil de mensajero:", err);
      alert(`No se pudo activar el perfil operativo: ${err.message || err}`);
    } finally {
      setActivatingProfile(false);
    }
  };

  // ── Mark delivery action (same logic as motorista panel) ────────────────────
  const handleMark = async (status: 'delivered' | 'customer_unreachable') => {
    const current = routeOrders[currentIdx];
    if (!current || actionLoading) return;

    setActionLoading(true);
    try {
      const nowStr = new Date().toISOString();
      const orderRef = doc(db, 'orders', current.id);

      const updatePayload: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'delivered') {
        updatePayload.deliveredAt = nowStr;
        updatePayload.amountCollected = current.collectionAmount || current.financials?.orderCollectionAmount || 0;
      }

      await updateDoc(orderRef, updatePayload);

      // Log event
      await addDoc(collection(db, 'orders', current.id, 'events'), {
        type: status === 'delivered' ? 'delivered' : 'customer_unreachable',
        performedBy: adminCourierId,
        performedByRole: 'admin',
        createdAt: serverTimestamp(),
        notes: status === 'delivered' ? 'Entregado en modo repartidor (admin)' : 'No contesta — modo repartidor (admin)',
      });

      // Advance to next if not last
      if (currentIdx >= routeOrders.length - 1) {
        setCurrentIdx(0);
      }

      triggerToast(
        status === 'delivered'
          ? `✅ ${current.customerName || current.customer?.name} — entregado`
          : `📵 ${current.customerName || current.customer?.name} — no contesta`
      );
    } catch (err) {
      console.error('Error updating order:', err);
      triggerToast('Error al actualizar el pedido. Intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const routeOrders = orders;
  const current = routeOrders[currentIdx];
  const total = routeOrders.length;

  const deliveredToday = orders.filter((o) => o.status === 'delivered').length;
  const totalCollected = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s: number, o: any) => s + (o.amountCollected || 0), 0);
  const noAnswerCount = orders.filter((o) => o.status === 'customer_unreachable').length;

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
            { href: '/admin', icon: Package2, label: 'Dashboard Admin' },
            { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
            { href: '/admin/operaciones', icon: Settings, label: 'Configuración' },
            { href: '/admin/mis-entregas', icon: Truck, label: 'Modo Repartidor' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                href === '/admin/mis-entregas'
                  ? 'bg-[#d3121a]/5 text-[#d3121a]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={17} /> {label}
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
              <Shield size={18} className="text-[#d3121a]" /> Modo Repartidor
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Administrador operando como motorista · UID: {adminCourierId?.slice(0, 12)}…
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AuthenticatedUserMenu />
            <button
              onClick={() => setRouteActive(!routeActive)}
              disabled={hasOperativeProfile !== true}
              className={`flex items-center gap-2 font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all disabled:opacity-55 ${
                routeActive
                  ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'
                  : 'bg-[#d3121a] text-white shadow-red-100 hover:bg-[#b00f14]'
              }`}
            >
              {routeActive ? <><Pause size={15} /> Pausar ruta</> : <><Play size={15} /> Iniciar ruta</>}
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-4xl">

          {/* 1. Loading State */}
          {loading && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center shadow-sm">
              <Loader2 size={32} className="text-[#d3121a] animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">Cargando pedidos asignados desde Firebase…</p>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="bg-white border border-red-200 rounded-2xl p-12 text-center shadow-sm space-y-4">
              <AlertTriangle size={32} className="text-amber-400 mx-auto" />
              <p className="font-bold text-slate-700">{error}</p>
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-xs font-bold text-[#d3121a] hover:underline mx-auto">
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          )}

          {/* 3. Operative Profile Not Created State */}
          {!loading && !error && hasOperativeProfile === false && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center shadow-sm space-y-5">
              <AlertTriangle size={48} className="text-amber-500 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-700">Debes activar tu perfil operativo antes de recibir pedidos.</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Para poder recibir asignaciones en el modo repartidor, se requiere crear tu registro correspondiente de mensajero.
                </p>
              </div>
              <button
                onClick={handleActivateProfile}
                disabled={activatingProfile}
                className="inline-flex items-center gap-2 bg-[#d3121a] hover:bg-[#b00f14] text-white text-xs font-extrabold px-6 py-3.5 rounded-xl shadow-md shadow-red-100 transition-all disabled:opacity-50"
              >
                {activatingProfile ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
                Activar perfil de repartidor
              </button>
            </div>
          )}

          {/* 4. No Orders State */}
          {!loading && !error && hasOperativeProfile === true && total === 0 && (
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center shadow-sm space-y-4">
              <CheckCircle size={48} className="text-slate-300 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-700 font-bold">No tienes pedidos asignados en modo repartidor.</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Cuando se te asigne un pedido aparecerá aquí. (UID repartidor: {adminCourierId?.slice(0, 12)}…)
              </p>
            </div>
          )}

          {/* 5. Orders Available / Active Content */}
          {!loading && !error && hasOperativeProfile === true && total > 0 && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total activos', value: total, color: 'text-slate-800' },
                  { label: 'Entregados', value: deliveredToday, color: 'text-emerald-700' },
                  { label: 'Recaudado', value: `RD$${totalCollected.toLocaleString()}`, color: 'text-[#d3121a]' },
                  { label: 'No contactados', value: noAnswerCount, color: 'text-red-600' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
                    <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Current order card */}
              {current && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#d3121a] to-[#b00f14] rounded-2xl p-6 text-white shadow-lg shadow-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-red-200">
                        Pedido actual ({currentIdx + 1}/{total})
                      </span>
                      <span className="text-xs font-extrabold bg-white/20 px-3 py-1 rounded-full">
                        {current.tracking || current.trackingId || current.id}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold">
                      {current.customerName || current.customer?.name || '—'}
                    </h2>
                    <div className="flex items-start gap-2 mt-2 mb-3">
                      <MapPin size={14} className="text-red-200 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-100">
                        {current.formattedAddress || current.street || current.deliveryAddress?.fullAddress || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs text-red-200">Tienda:</span>
                      <span className="text-sm font-bold">{current.storeName || '—'}</span>
                      <span className="ml-auto text-xl font-extrabold">
                        RD${(current.collectionAmount || current.financials?.orderCollectionAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${current.customerPhone || current.customer?.phone || ''}`}
                        className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white"
                      >
                        <Phone size={15} /> Llamar
                      </a>
                      <WhatsAppContactButton
                        orderId={current.id}
                        phone={current.customerPhone || current.customer?.phone || ''}
                        customerName={current.customerName || current.customer?.name || ''}
                        storeName={current.storeName || ''}
                        tracking={current.tracking || current.trackingId || current.id}
                        courierId={adminCourierId || ''}
                        className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white w-full"
                        label="WhatsApp"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMark('delivered')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-100 transition-all disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={18} />}
                      Entregado
                    </button>
                    <button
                      onClick={() => handleMark('customer_unreachable')}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-extrabold text-sm disabled:opacity-50"
                    >
                      <PhoneOff size={18} /> No contesta
                    </button>
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentIdx((i) => Math.min(i + 1, total - 1))}
                    disabled={currentIdx >= total - 1}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-2xl font-extrabold text-base shadow-md shadow-red-100 transition-all"
                  >
                    <SkipForward size={20} /> SIGUIENTE <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {/* Orders table */}
              <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#E7E7EC]">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Pedidos asignados en curso ({total})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Tracking</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Tienda</th>
                        <th className="py-3 px-4">Dirección</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E7EC]">
                      {routeOrders.map((order: any, idx: number) => (
                        <tr
                          key={order.id}
                          className={`transition-colors cursor-pointer ${idx === currentIdx ? 'bg-[#fee2e2]/30' : 'hover:bg-slate-50'}`}
                          onClick={() => setCurrentIdx(idx)}
                        >
                          <td className="py-3 px-4 font-extrabold text-[#d3121a]">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">
                            {order.tracking || order.trackingId || order.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700">
                            {order.customerName || order.customer?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{order.storeName || '—'}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {order.formattedAddress || order.street || order.deliveryAddress?.fullAddress || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                              order.status === 'customer_unreachable' ? 'bg-red-50 text-red-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {STATUS_LABEL[order.status] || order.status}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
