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
  CheckCircle,
  XCircle,
  PauseCircle,
  Wifi,
  WifiOff,
  X,
  Save,
  DollarSign,
  Package,
  LogOut,
  Package2,
  Settings,
} from 'lucide-react';
import { DEFAULT_COURIERS, type Courier, type CourierStatus } from '@/data/courier';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

const STATUS_CONFIG: Record<CourierStatus, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: 'Disponible',        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  on_route:  { label: 'En ruta',           color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500 animate-pulse' },
  paused:    { label: 'Pausado',           color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' },
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
  const { profile } = useAuth();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Courier | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [toast, setToast] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CourierStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // States for showing temporary credentials
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsData, setCredsData] = useState<{ email: string; pass: string } | null>(null);

  // Load from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'couriers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreCouriers = snapshot.docs.map((docSnap) => {
        const o = docSnap.data();
        return {
          id: o.id || docSnap.id,
          name: o.fullName || 'Motorista',
          cedula: o.identificationNumber || '',
          phone: o.phone || '',
          email: o.email || '',
          address: o.address || '',
          licenseNumber: o.licenseNumber || '',
          vehicle: {
            type: o.vehicleType || 'motocicleta',
            plate: o.vehiclePlate || 'N/A'
          },
          assignedZone: o.assignedZone || '',
          status: o.status || 'available',
          active: o.active !== undefined ? o.active : true,
          suspended: o.status === 'suspended',
          createdAt: o.createdAt || new Date().toISOString(),
          cashInStreet: o.cashInStreet || 0,
          commissionType: o.commissionType || 'fixed',
          commissionValue: o.commissionValue || 100
        };
      });
      setCouriers(firestoreCouriers as Courier[]);
    }, (error) => {
      console.error("Error listening to couriers in admin panel:", error);
      // Fallback
      const stored = localStorage.getItem('enkargord_couriers');
      setCouriers(stored ? JSON.parse(stored) : DEFAULT_COURIERS);
    });

    return () => unsubscribe();
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

  const openEdit = (courier: Courier) => {
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
      commissionType: courier.commissionType,
      commissionValue: courier.commissionValue,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.vehiclePlate || !form.email) {
      triggerToast('Nombre, teléfono, placa y correo electrónico son requeridos.');
      return;
    }

    setIsLoading(true);

    try {
      if (editing) {
        // Update existing courier in Firestore
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

        // Also update users/{uid} corresponding info if it exists
        if (editing.id) {
          const qUser = doc(db, 'users', editing.id);
          try {
            await updateDoc(qUser, {
              fullName: form.name,
              phone: form.phone,
              email: form.email,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.log("No users doc found with ID matching courier id: ", editing.id);
          }
        }

        triggerToast(`Motorista "${form.name}" actualizado.`);
        setShowModal(false);
      } else {
        // Create new courier via secure backend API endpoint (Firebase Admin)
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
          // Open credentials modal
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
      setIsLoading(false);
    }
  };

  const toggleActive = async (id: string) => {
    const courier = couriers.find(c => c.id === id);
    if (!courier) return;

    try {
      const nextActive = !courier.active;
      await updateDoc(doc(db, 'couriers', id), {
        active: nextActive,
        status: nextActive ? 'available' : 'offline',
        updatedAt: new Date().toISOString()
      });
      triggerToast(`Motorista ${courier.name} está ahora ${nextActive ? 'Activo' : 'Inactivo'}.`);
    } catch (error) {
      console.error("Error toggling active status in Firestore:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Dar de baja a ${name}?`)) return;

    try {
      await deleteDoc(doc(db, 'couriers', id));
      
      // Try to delete corresponding users doc too
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        // document might not exist
      }

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
        updatedAt: new Date().toISOString()
      });
      triggerToast(`Estado cambiado a ${status}.`);
    } catch (error) {
      console.error("Error updating courier status in Firestore:", error);
    }
  };

  const filtered = couriers.filter((c) => filterStatus === 'all' || c.status === filterStatus);

  const setF = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* ── Sidebar ───────────────────────────── */}
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
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900 aria-[current=page]:bg-[#d3121a] aria-[current=page]:text-white"
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

      {/* ── Main ──────────────────────────────── */}
      <main className="pl-[260px] min-h-screen flex flex-col">
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Gestión de Mensajeros</h1>
            <p className="text-xs text-slate-400 mt-0.5">Administra la flota de motoristas de EnkargoRD</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md shadow-red-100 transition-all"
          >
            <Plus size={16} /> Registrar motorista
          </button>
        </header>

        <div className="p-8 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {(['all', 'available', 'on_route', 'offline'] as const).map((key) => {
              const count = key === 'all' ? couriers.length : couriers.filter((c) => c.status === key).length;
              const cfg = key === 'all' ? null : STATUS_CONFIG[key as CourierStatus];
              return (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all hover:shadow-md ${
                    filterStatus === key ? 'border-[#d3121a] ring-2 ring-[#d3121a]/10' : 'border-[#E7E7EC]'
                  }`}
                >
                  <div className={`text-2xl font-extrabold ${cfg ? cfg.color : 'text-slate-900'}`}>{count}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {key === 'all' ? 'Total' : cfg?.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">
                    <th className="py-4 px-6">Motorista</th>
                    <th className="py-4 px-6">Teléfono</th>
                    <th className="py-4 px-6">Vehículo · Placa</th>
                    <th className="py-4 px-6">Zona asignada</th>
                    <th className="py-4 px-6">Comisión</th>
                    <th className="py-4 px-6">Efectivo en calle</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E7EC] text-xs">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">No hay motoristas que mostrar.</td>
                    </tr>
                  )}
                  {filtered.map((courier) => {
                    const cfg = STATUS_CONFIG[courier.status] || STATUS_CONFIG.offline;
                    const safeStatus = courier.status in STATUS_CONFIG ? courier.status : 'offline';
                    return (
                      <tr key={courier.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#fee2e2] flex items-center justify-center font-extrabold text-[#d3121a] text-xs flex-shrink-0">
                              {courier.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{courier.name}</div>
                              <div className="text-[10px] text-slate-400">{courier.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <a href={`tel:${courier.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-[#d3121a] transition-colors">
                            <Phone size={12} /> {courier.phone}
                          </a>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-600 capitalize">
                            <Truck size={12} className="text-slate-400" />
                            {courier.vehicle.type} · {courier.vehicle.plate}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin size={12} className="text-slate-400" />
                            {courier.assignedZone ?? '—'}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">
                          {courier.commissionType === 'fixed'
                            ? `RD$${(courier.commissionValue ?? 0).toLocaleString()}`
                            : `${courier.commissionValue ?? 0}%`}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#d3121a]">
                          RD${(courier.cashInStreet ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={safeStatus}
                            onChange={(e) => changeStatus(courier.id, e.target.value as CourierStatus)}
                            className={`text-[10px] font-extrabold px-2 py-1.5 rounded-lg border cursor-pointer ${cfg.bg} ${cfg.color} focus:outline-none`}
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                              <option key={key} value={key}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(courier)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => toggleActive(courier.id)}
                              className={`p-1.5 rounded-lg transition-all ${courier.active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                              title={courier.active ? 'Suspender' : 'Activar'}
                            >
                              {courier.active ? <PauseCircle size={14} /> : <CheckCircle size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(courier.id, courier.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Dar de baja"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#E7E7EC] flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">{editing ? 'Editar motorista' : 'Registrar motorista'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Nombre completo *', field: 'name',          placeholder: 'Carlos Martínez' },
                  { label: 'Cédula',            field: 'cedula',        placeholder: '001-0000001-1' },
                  { label: 'Teléfono *',        field: 'phone',         placeholder: '809-555-1234' },
                  { label: 'Correo electrónico',field: 'email',         placeholder: 'carlos@email.com' },
                  { label: 'Dirección',         field: 'address',       placeholder: 'Calle X, Ciudad' },
                  { label: 'No. Licencia',      field: 'licenseNumber', placeholder: 'L-123456' },
                  { label: 'Placa vehículo *',  field: 'vehiclePlate',  placeholder: 'K-123456' },
                  { label: 'Zona asignada',     field: 'assignedZone',  placeholder: 'Santo Domingo Este' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[field as keyof FormState] as string ?? ''}
                      onChange={(e) => setF(field, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de vehículo</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setF('vehicleType', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a] bg-white"
                  >
                    {['motocicleta', 'automovil', 'bicicleta', 'patineta', 'pie'].map((v) => (
                      <option key={v} value={v} className="capitalize">{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de comisión</label>
                  <select
                    value={form.commissionType}
                    onChange={(e) => setF('commissionType', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a] bg-white"
                  >
                    <option value="fixed">Fija (RD$)</option>
                    <option value="percentage">Porcentaje (%)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Valor de comisión ({form.commissionType === 'fixed' ? 'RD$' : '%'}) por entrega
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.commissionValue ?? 100}
                    onChange={(e) => setF('commissionValue', parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
                  />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#E7E7EC] flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-sm font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-3 bg-[#d3121a] hover:bg-[#b00f14] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-red-100 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : (
                  <>
                    <Save size={15} />
                    {editing ? 'Guardar cambios' : 'Registrar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Credenciales Temporales ──────────────── */}
      {showCredsModal && credsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">🔑 Credenciales del Motorista</h3>
            <p className="text-xs text-slate-500">
              Copia estas credenciales temporales. Por seguridad, no volverán a mostrarse en pantalla.
            </p>
            <div className="bg-slate-50 border border-[#E7E7EC] rounded-xl p-4 space-y-2 text-xs font-mono">
              <div><span className="font-bold text-slate-400">Usuario / Correo:</span> {credsData.email}</div>
              <div><span className="font-bold text-slate-400">Contraseña temporal:</span> {credsData.pass}</div>
            </div>
            <button
              onClick={() => {
                setShowCredsModal(false);
                setCredsData(null);
              }}
              className="w-full py-3 bg-[#d3121a] hover:bg-[#b00f14] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              Entendido, credenciales copiadas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
