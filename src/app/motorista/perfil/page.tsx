"use client";

import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  Shield,
  Edit3,
  Save,
  X,
  Bike,
  Car,
  Calendar,
  Star,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { type Courier, type VehicleInfo } from '@/data/courier';
import { useAuth } from '@/hooks/useAuth';
import { useCourierOrders } from '@/hooks/useCourierOrders';

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  motocicleta: Bike,
  automovil:   Car,
  bicicleta:   Bike,
  pie:         User,
  default:     Truck,
};

export default function PerfilPage() {
  const { user } = useAuth();
  const { orders } = useCourierOrders();
  const [courier, setCourier] = useState<Courier | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{
    name: string; cedula: string; phone: string; email: string;
    address: string; licenseNumber: string;
    vehicleType: string; vehiclePlate: string; vehicleModel: string; vehicleColor: string;
  }>({
    name: '', cedula: '', phone: '', email: '', address: '',
    licenseNumber: '', vehicleType: '', vehiclePlate: '', vehicleModel: '', vehicleColor: '',
  });
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void user.getIdToken().then(async (token) => {
      const response = await fetch('/api/courier/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('COURIER_PROFILE_READ_FAILED');
      const { courier: row } = await response.json();
      const metadata = row.metadata ?? {};
      const me: Courier = {
        id: row.id,
        name: row.full_name,
        phone: row.phone || '',
        email: row.email || '',
        cedula: metadata.identificationNumber || '',
        address: metadata.address || '',
        licenseNumber: metadata.licenseNumber || '',
        vehicle: {
          type: row.vehicle_type || 'motocicleta',
          plate: row.vehicle_plate || '',
          model: row.vehicle_model || '',
          color: row.vehicle_color || '',
        },
        status: row.status === 'suspended' ? 'offline' : row.status,
        commissionType: row.commission_type || 'fixed',
        commissionValue: Number(row.commission_value || 0),
        active: Boolean(row.active),
        suspended: row.status === 'suspended',
        createdAt: row.created_at,
        cashInStreet: Number(metadata.cashInStreet || 0),
      };
      setCourier(me);
      setForm({
        name: me.name,
        phone: me.phone,
        email: me.email ?? '',
        address: me.address ?? '',
        cedula: me.cedula ?? '',
        licenseNumber: me.licenseNumber ?? '',
        vehicleType: me.vehicle.type,
        vehiclePlate: me.vehicle.plate,
        vehicleModel: me.vehicle.model ?? '',
        vehicleColor: me.vehicle.color ?? '',
      });
    }).catch((error) => console.error('Error loading courier profile:', error));
  }, [user]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!courier) return;
    setSaving(true);
    const updated: Courier = {
      ...courier,
      name: form.name ?? courier.name,
      phone: form.phone ?? courier.phone,
      email: form.email,
      address: form.address,
      cedula: form.cedula,
      licenseNumber: form.licenseNumber,
      vehicle: {
        type: form.vehicleType ?? courier.vehicle.type,
        plate: form.vehiclePlate ?? courier.vehicle.plate,
        model: form.vehicleModel,
        color: form.vehicleColor,
      } as VehicleInfo,
    };

    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('UNAUTHENTICATED');
      const response = await fetch('/api/courier/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('COURIER_PROFILE_UPDATE_FAILED');
      setCourier(updated);
      setEditing(false);
      triggerToast('Perfil actualizado correctamente.');
    } catch (error) {
      console.error(error);
      triggerToast('No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!courier) return null;

  const VehicleIcon = VEHICLE_ICONS[courier.vehicle.type] ?? VEHICLE_ICONS.default;

  const myOrders = orders.filter((o) => o.courierId === courier.id);
  const delivered = myOrders.filter((o: { status: string }) => o.status === 'delivered').length;
  const totalCommission = myOrders
    .filter((o: { status: string }) => o.status === 'delivered')
    .reduce((s: number, o: { financials: { courierCommission: number } }) => s + o.financials.courierCommission, 0);

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Perfil y vehículo</h2>
          <p className="text-sm text-slate-400 mt-0.5">Tus datos como motorista</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm font-bold text-[#d3121a] border border-[#d3121a]/20 bg-[#fee2e2]/30 hover:bg-[#fee2e2] px-4 py-2 rounded-xl transition-all"
          >
            <Edit3 size={14} /> Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 text-sm font-bold text-white bg-[#d3121a] hover:bg-[#b00f14] px-4 py-2 rounded-xl transition-all"
            >
              <Save size={14} /> Guardar
            </button>
          </div>
        )}
      </div>

      {/* Avatar + Stats */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#fee2e2] border-2 border-[#d3121a]/20 flex items-center justify-center font-extrabold text-[#d3121a] text-xl">
            {courier.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{courier.name}</h3>
            <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
              <Shield size={11} className="text-emerald-500" />
              ID: {courier.id}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {courier.active && !courier.suspended ? (
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  ✓ Activo
                </span>
              ) : (
                <span className="text-[10px] font-extrabold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                  Suspendido
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-slate-800">{delivered}</div>
            <div className="text-[10px] text-slate-400 font-semibold">Entregados</div>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-violet-700">RD${totalCommission.toLocaleString()}</div>
            <div className="text-[10px] text-violet-400 font-semibold">Comisión</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-amber-700">
              RD${(courier.commissionValue ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-400 font-semibold">Por entrega</div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <User size={14} className="text-[#d3121a]" />
          Información personal
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nombre completo', field: 'name',          icon: User,     type: 'text' },
            { label: 'Cédula',          field: 'cedula',        icon: Shield,   type: 'text' },
            { label: 'Teléfono',        field: 'phone',         icon: Phone,    type: 'tel' },
            { label: 'Correo',          field: 'email',         icon: Mail,     type: 'email' },
            { label: 'Dirección',       field: 'address',       icon: MapPin,   type: 'text' },
            { label: 'No. Licencia',    field: 'licenseNumber', icon: Shield,   type: 'text' },
          ].map(({ label, field, icon: Icon, type }) => (
            <div key={field}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {label}
              </label>
              {editing ? (
                <div className="relative">
                  <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={type}
                    value={(form as unknown as Record<string, string | undefined>)[field] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                  <Icon size={13} className="text-slate-400 flex-shrink-0" />
                  {(courier as unknown as Record<string, string | undefined>)[field] ?? (field === 'vehicle' ? '' : 'Sin registrar')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <VehicleIcon size={14} className="text-[#d3121a]" />
          Datos del vehículo
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {editing ? (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de vehículo</label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a] bg-white"
                >
                  {['motocicleta', 'automovil', 'bicicleta', 'patineta', 'pie'].map((v) => (
                    <option key={v} value={v} className="capitalize">{v}</option>
                  ))}
                </select>
              </div>
              {[
                { label: 'Placa',  field: 'vehiclePlate' },
                { label: 'Modelo', field: 'vehicleModel' },
                { label: 'Color',  field: 'vehicleColor' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={(form as unknown as Record<string, string | undefined>)[field] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-[#E7E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: 'Tipo',   value: courier.vehicle.type },
                { label: 'Placa',  value: courier.vehicle.plate },
                { label: 'Modelo', value: courier.vehicle.model ?? '-' },
                { label: 'Color',  value: courier.vehicle.color ?? '-' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                  <div className="font-bold text-sm text-slate-800 capitalize">{value}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Calendar size={13} className="text-slate-400" />
          Miembro desde: {new Date(courier.createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
