"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Phone,
  Truck,
  X,
  Save,
  LogOut,
  Package2,
  Settings,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Calendar,
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedUserMenu from '@/components/auth/AuthenticatedUserMenu';

export type CourierStatus = 'available' | 'on_route' | 'paused' | 'offline' | 'suspended';

export interface CourierItem {
  id: string;
  userUid?: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  vehicle: {
    type: string;
    plate: string;
  };
  assignedZone?: string;
  status: CourierStatus;
  active: boolean;
  createdAt?: string;
  lastActiveAt?: string;
  cashInStreet?: number;
  activeOrderCount?: number;
  completedOrderCount?: number;
  commissionType?: string;
  commissionValue?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: 'Disponible',        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  on_route:  { label: 'En ruta',           color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500 animate-pulse' },
  paused:    { label: 'Pausado',           color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' },
  suspended: { label: 'Suspendido',        color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         dot: 'bg-red-500' },
  offline:   { label: 'Fuera de servicio', color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',     dot: 'bg-slate-400' },
};

interface FormState {
  name: string;
  cedula: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  assignedZone: string;
  commissionType: string;
  commissionValue: number;
}

const EMPTY_FORM: FormState = {
  name: '', cedula: '', phone: '', email: '', address: '',
  licenseNumber: '', vehicleType: 'motocicleta', vehiclePlate: '',
  assignedZone: '', commissionType: 'fixed', commissionValue: 100,
};

export default function MensajerosPage() {
  const { profile } = useAuth() as any;

  // Real Firestore States
  const [couriers, setCouriers] = useState<CourierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CourierItem | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [toast, setToast] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Temporary Creds Modal
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsData, setCredsData] = useState<{ email: string; pass: string } | null>(null);

  // Firestore real-time listener without fallback to mock
  const fetchCouriers = () => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'couriers'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CourierItem[] = snapshot.docs.map((docSnap) => {
          const o = docSnap.data();
          return {
            id: docSnap.id,
            userUid: o.userUid || docSnap.id,
            name: o.fullName || o.name || 'Motorista',
            cedula: o.identificationNumber || o.cedula || '',
            phone: o.phone || '',
            email: o.email || '',
            address: o.address || '',
            licenseNumber: o.licenseNumber || '',
            vehicle: {
              type: o.vehicleType || o.vehicle?.type || 'motocicleta',
              plate: o.vehiclePlate || o.vehicle?.plate || '—',
            },
            assignedZone: o.assignedZone || '—',
            status: (o.status || (o.active === false ? 'suspended' : 'available')) as CourierStatus,
            active: o.active !== undefined ? o.active : true,
            createdAt: o.createdAt || '',
            lastActiveAt: o.updatedAt || o.lastActiveAt || '',
            cashInStreet: o.cashInStreet || 0,
            activeOrderCount: o.currentOrderCount || o.activeOrderCount || 0,
            completedOrderCount: o.completedOrderCount || 0,
            commissionType: o.commissionType || 'fixed',
            commissionValue: o.commissionValue || 100,
          };
        });
        setCouriers(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to couriers in Firestore:", err);
        setError("No pudimos cargar los mensajeros.");
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    const unsub = fetchCouriers();
    return () => unsub();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (courier: CourierItem) => {
    setEditing(courier);
    setForm({
      name: courier.name,
      cedula: courier.cedula ?? '',
      phone: courier.phone,
      email: courier.email ?? '',
      address: courier.address ?? '',
      licenseNumber: courier.licenseNumber ?? '',
      vehicleType: courier.vehicle.type,
      vehiclePlate: courier.vehicle.plate,
      assignedZone: courier.assignedZone ?? '',
      commissionType: courier.commissionType ?? 'fixed',
      commissionValue: courier.commissionValue ?? 100,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.vehiclePlate || !form.email) {
      triggerToast('Nombre, teléfono, placa y correo electrónico son requeridos.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editing) {
        const courierRef = doc(db, 'couriers', editing.id);
        await updateDoc(courierRef, {
          fullName: form.name,
          identificationNumber: form.cedula,
          phone: form.phone,
          email: form.email,
          address: form.address,
          licenseNumber: form.licenseNumber,
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate,
          assignedZone: form.assignedZone,
          commissionType: form.commissionType,
          commissionValue: Number(form.commissionValue),
          updatedAt: new Date().toISOString()
        });

        triggerToast(`Motorista "${form.name}" actualizado.`);
        setShowModal(false);
      } else {
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const response = await fetch('/api/admin/couriers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: form.name,
            email: form.email,
            phone: form.phone,
            identificationNumber: form.cedula,
            password: tempPassword,
            vehicleType: form.vehicleType,
            vehiclePlate: form.vehiclePlate,
            assignedZone: form.assignedZone,
            createdByUid: profile?.uid || 'ADMIN',
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setCredsData({
            email: form.email,
            pass: tempPassword,
          });
          setShowCredsModal(true);
          triggerToast(`Motorista "${form.name}" registrado.`);
          setShowModal(false);
        } else {
          alert(`Error al registrar motorista: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error("Error submitting courier form:", error);
      alert(`Ocurrió un error inesperado: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Dar de baja a ${name}?`)) return;

    try {
      await deleteDoc(doc(db, 'couriers', id));
      triggerToast(`Motorista "${name}" dado de baja.`);
    } catch (error) {
      console.error("Error deleting courier in Firestore:", error);
      alert("Error al dar de baja al motorista.");
    }
  };

  const changeStatus = async (id: string, status: CourierStatus) => {
    try {
      await updateDoc(doc(db, 'couriers', id), {
        status,
        active: status !== 'suspended' && status !== 'offline',
        updatedAt: new Date().toISOString()
      });
      triggerToast(`Estado cambiado a ${STATUS_CONFIG[status]?.label || status}.`);
    } catch (error) {
      console.error("Error updating courier status in Firestore:", error);
    }
  };

  const filtered = couriers.filter((c) => filterStatus === 'all' || c.status === filterStatus);

  // Status Counts
  const countAll = couriers.length;
  const countAvailable = couriers.filter(c => c.status === 'available').length;
  const countOnRoute = couriers.filter(c => c.status === 'on_route').length;
  const countPaused = couriers.filter(c => c.status === 'paused').length;
  const countSuspended = couriers.filter(c => c.status === 'suspended').length;
  const countOffline = couriers.filter(c => c.status === 'offline').length;

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
            { href: '/admin',            icon: Package2, label: 'Dashboard Admin' },
            { href: '/admin/mensajeros', icon: Users,    label: 'Mensajeros' },
            { href: '/admin/operaciones',icon: Settings, label: 'Configuración' },
            { href: '/admin/mis-entregas',icon: Truck,   label: 'Modo Repartidor' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                href === '/admin/mensajeros'
                  ? 'bg-[#d3121a] text-white shadow-md shadow-red-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E7E7EC]">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={16} /> Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <main className="pl-[260px] min-h-screen flex flex-col">
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Gestión de Mensajeros</h1>
            <p className="text-xs text-slate-400 mt-0.5">Administra la flota de motoristas reales de EnkargoRD</p>
          </div>
          <div className="flex items-center gap-4">
            <AuthenticatedUserMenu />
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md shadow-red-100 transition-all"
            >
              <Plus size={16} /> Registrar motorista
            </button>
          </div>
        </header>

        <div className="p-8 space-y-6">

          {/* Real Counter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { id: 'all', label: 'Total', count: countAll, color: 'text-slate-900' },
              { id: 'available', label: 'Disponibles', count: countAvailable, color: 'text-emerald-700' },
              { id: 'on_route', label: 'En ruta', count: countOnRoute, color: 'text-blue-700' },
              { id: 'paused', label: 'Pausados', count: countPaused, color: 'text-amber-700' },
              { id: 'suspended', label: 'Suspendidos', count: countSuspended, color: 'text-red-700' },
              { id: 'offline', label: 'Fuera de servicio', count: countOffline, color: 'text-slate-500' },
            ].map((kpi) => (
              <button
                key={kpi.id}
                onClick={() => setFilterStatus(kpi.id)}
                className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all hover:shadow-md ${
                  filterStatus === kpi.id ? 'border-[#d3121a] ring-2 ring-[#d3121a]/10' : 'border-[#E7E7EC]'
                }`}
              >
                <div className={`text-2xl font-extrabold ${kpi.color}`}>
                  {loading ? <Loader2 size={16} className="animate-spin text-slate-300" /> : kpi.count}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {kpi.label}
                </div>
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
            
            {/* 1. Loading State */}
            {loading && (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-[#d3121a]" />
                <span className="text-xs font-bold text-slate-400">Cargando motoristas desde Firestore…</span>
              </div>
            )}

            {/* 2. Error State */}
            {!loading && error && (
              <div className="py-16 text-center space-y-4 px-6">
                <AlertTriangle size={36} className="text-amber-500 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">{error}</h3>
                <button
                  onClick={() => fetchCouriers()}
                  className="inline-flex items-center gap-2 bg-[#d3121a] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#b00f14] transition-all"
                >
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            )}

            {/* 3. Empty State */}
            {!loading && !error && couriers.length === 0 && (
              <div className="py-20 text-center space-y-4 px-6">
                <Truck size={40} className="text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">No hay mensajeros registrados.</h3>
                  <p className="text-xs text-slate-400 mt-1">Registra al primer repartidor para gestionar la flota de entregas.</p>
                </div>
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 bg-[#d3121a] text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-[#b00f14] shadow-md shadow-red-100 transition-all"
                >
                  <Plus size={16} /> Crear primer mensajero
                </button>
              </div>
            )}

            {/* 4. Real Table */}
            {!loading && !error && couriers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                      <th className="py-4 px-6">Motorista</th>
                      <th className="py-4 px-6">Teléfono · Correo</th>
                      <th className="py-4 px-6">Vehículo · Placa</th>
                      <th className="py-4 px-6">Zona</th>
                      <th className="py-4 px-6">Pedidos</th>
                      <th className="py-4 px-6">Efectivo Calle</th>
                      <th className="py-4 px-6">Estado</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E7EC]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold">
                          Sin motoristas para el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((courier) => {
                        const cfg = STATUS_CONFIG[courier.status] || STATUS_CONFIG.offline;
                        return (
                          <tr key={courier.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#fee2e2] flex items-center justify-center font-extrabold text-[#d3121a] text-xs flex-shrink-0">
                                  {courier.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800">{courier.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{courier.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 space-y-0.5">
                              <a href={`tel:${courier.phone}`} className="flex items-center gap-1.5 text-slate-700 hover:text-[#d3121a] font-semibold">
                                <Phone size={12} /> {courier.phone}
                              </a>
                              {courier.email && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[160px]">
                                  <Mail size={11} /> {courier.email}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 text-slate-700 font-bold capitalize">
                                <Truck size={13} className="text-slate-400" />
                                {courier.vehicle.type} · {courier.vehicle.plate}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-600 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-400" />
                                {courier.assignedZone || '—'}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              <span className="text-blue-700 font-bold">{courier.activeOrderCount || 0} activos</span>
                              <span className="text-slate-400 block text-[10px]">{courier.completedOrderCount || 0} entregados</span>
                            </td>
                            <td className="py-4 px-6 font-bold text-[#d3121a]">
                              RD${(courier.cashInStreet ?? 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <select
                                value={courier.status}
                                onChange={(e) => changeStatus(courier.id, e.target.value as CourierStatus)}
                                className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border cursor-pointer ${cfg.bg} ${cfg.color} focus:outline-none`}
                              >
                                {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                                  <option key={key} value={key}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEdit(courier)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar motorista"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(courier.id, courier.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Dar de baja"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E7EC] pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editing ? '📝 Editar Motorista Real' : '🆕 Registrar Nuevo Motorista Real'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo (Login)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="motorista@enkargord.com"
                    className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+18095550000"
                    className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo Vehículo</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                  >
                    <option value="motocicleta">Motocicleta</option>
                    <option value="automovil">Automóvil</option>
                    <option value="bicicleta">Bicicleta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Placa / Ficha</label>
                  <input
                    type="text"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                    placeholder="K-000000"
                    className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Zona Asignada</label>
                <input
                  type="text"
                  value={form.assignedZone}
                  onChange={(e) => setForm({ ...form, assignedZone: e.target.value })}
                  placeholder="Ej. Distrito Nacional"
                  className="w-full mt-1 p-2.5 border border-[#E7E7EC] rounded-xl font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-[#E7E7EC] py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#d3121a] hover:bg-[#b00f14] text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-red-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSubmitting ? 'Guardando…' : 'Guardar Motorista'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creds Modal */}
      {showCredsModal && credsData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E7EC] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">🔑 Credenciales Creadas</h3>
            <p className="text-xs text-slate-500 font-medium">Proporciona estos datos al motorista para iniciar sesión:</p>

            <div className="bg-slate-50 border border-[#E7E7EC] rounded-xl p-4 text-xs font-mono text-left space-y-2">
              <div><span className="text-slate-400">Correo:</span> <strong className="text-slate-800">{credsData.email}</strong></div>
              <div><span className="text-slate-400">Contraseña:</span> <strong className="text-[#d3121a]">{credsData.pass}</strong></div>
            </div>

            <button
              onClick={() => setShowCredsModal(false)}
              className="w-full bg-[#d3121a] text-white font-bold text-xs py-3 rounded-xl"
            >
              Entendido y Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
