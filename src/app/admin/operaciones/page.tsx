"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Settings,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Save,
  Package2,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import {
  DEFAULT_PRICING,
  type PricingSettings,
  type SettlementBeneficiary,
  type ZoneSurcharge,
} from '@/data/courier';
import {
  getOperationSettings,
  saveOperationSettings,
} from '@/lib/supabase/operations';
import { updateCurrentUserProfile } from '@/lib/supabase/profiles';
import { useAuth } from '@/hooks/useAuth';
import LogoutButton from '@/components/auth/LogoutButton';

const PACKAGING_LABELS: Record<string, string> = {
  sobre:               'Sobre',
  bolsa_seguridad:     'Bolsa de seguridad',
  caja_pequena:        'Caja pequeña',
  caja_mediana:        'Caja mediana',
  caja_grande:         'Caja grande',
  proteccion_adicional:'Protección adicional',
  personalizado:       'Empaque personalizado',
};

export default function OperacionesPage() {
  const { user, profile, refreshProfile } = useAuth() as any;
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Admin personal profile state
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);

  const [newBeneficiary, setNewBeneficiary] = useState<Partial<SettlementBeneficiary>>({
    name: '', calculationType: 'fixed', fixedAmount: 50, percentage: 0, active: true,
  });

  useEffect(() => {
    if (profile) {
      setAdminName(profile.name && profile.name !== 'Usuario EnkargoRD' ? profile.name : '');
      setAdminPhone(profile.phone || '');
      setAdminEmail(profile.email || user?.email || '');
    }
  }, [profile, user]);

  useEffect(() => {
    async function loadPricingFromSupabase() {
      try {
        const savedPricing = await getOperationSettings<PricingSettings>();
        if (savedPricing) setPricing(savedPricing);
      } catch (err) {
        console.error("Error loading pricing settings from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadPricingFromSupabase();
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      triggerToast('⚠️ El nombre del administrador es obligatorio.');
      return;
    }
    setSavingAdminProfile(true);
    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('UNAUTHENTICATED');
      await updateCurrentUserProfile(token, {
        name: adminName.trim(),
        phone: adminPhone.trim(),
        email: adminEmail.trim(),
        role: 'Admin',
      });
      await refreshProfile();
      triggerToast('👤 Perfil de administrador actualizado correctamente.');
    } catch (err) {
      console.error('Error updating admin profile:', err);
      triggerToast('❌ Error al actualizar el perfil de administrador.');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const withDate = { ...pricing, lastUpdated: new Date().toISOString() };
    try {
      await saveOperationSettings(withDate as unknown as Record<string, unknown>);
      setPricing(withDate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      triggerToast('⚙️ Configuración guardada correctamente en Supabase.');
    } catch (err) {
      console.error("Error saving pricing to Firestore:", err);
      triggerToast('❌ Error al guardar en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBeneficiary = () => {
    if (!newBeneficiary.name) return;
    const item: SettlementBeneficiary = {
      id: `ben_${Date.now()}`,
      name: newBeneficiary.name,
      calculationType: newBeneficiary.calculationType || 'fixed',
      fixedAmount: Number(newBeneficiary.fixedAmount) || 0,
      percentage: Number(newBeneficiary.percentage) || 0,
      active: true,
    };
    const updated = { ...pricing, beneficiaries: [...(pricing.beneficiaries || []), item] };
    setPricing(updated);
    setNewBeneficiary({ name: '', calculationType: 'fixed', fixedAmount: 50, percentage: 0, active: true });
    triggerToast(`Beneficiario "${item.name}" agregado.`);
  };

  const handleRemoveBeneficiary = (id: string) => {
    const updated = {
      ...pricing,
      beneficiaries: (pricing.beneficiaries || []).filter((b) => b.id !== id),
    };
    setPricing(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 size={24} className="animate-spin text-[#d3121a]" />
          Cargando configuración de operaciones...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#E7E7EC] flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div>
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative h-12 w-[220px]">
              <Image src="/logo-horizontal.png" alt="EnkargoRD" fill className="object-contain object-center" priority />
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Package2 size={18} /> Dashboard Admin
            </Link>
            <Link href="/admin/usuarios" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Users size={18} /> Usuarios Registrados
            </Link>
            <Link href="/admin/operaciones" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-[#d3121a]/5 text-[#d3121a]">
              <Settings size={18} /> Configuración Tarifas
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-[#E7E7EC]">
          <LogoutButton className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all">
            Salir de Admin
          </LogoutButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow pl-[280px] min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings size={20} className="text-[#d3121a]" /> Configuración de Tarifas y Operación
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Ajusta costos de envío, empaques y comisiones directamente en Supabase.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-[#d3121a] hover:bg-[#b00f14] text-white shadow-red-100'
            }`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
        </header>

        <div className="p-8 space-y-8 max-w-5xl">
          {/* Section 0: Perfil del Administrador */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <User size={18} className="text-[#d3121a]" /> Perfil del Administrador
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Actualiza tu nombre de usuario, correo y teléfono de contacto en la plataforma
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Ej. Administrador EnkargoRD"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@enkargord.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Teléfono (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="809-123-4567"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAdminProfile}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingAdminProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {savingAdminProfile ? 'Guardando...' : 'Guardar Perfil Admin'}
                </button>
              </div>
            </form>
          </section>

          {/* Section 1: Precios Base de Envíos */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <DollarSign size={18} className="text-[#d3121a]" /> Precios Base de Envío
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Tarifas por defecto aplicadas en la creación de pedidos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Tarifa Envío Estándar / Regular (RD$)
                </label>
                <input
                  type="number"
                  value={pricing.baseShippingCost}
                  onChange={(e) => setPricing({ ...pricing, baseShippingCost: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block flex items-center justify-between">
                  <span>Tarifa Envío Express (RD$)</span>
                  <span className="text-[9px] bg-red-100 text-[#d3121a] font-extrabold px-2 py-0.5 rounded-md">NUEVO</span>
                </label>
                <input
                  type="number"
                  value={pricing.expressShippingCost ?? 450}
                  onChange={(e) => setPricing({ ...pricing, expressShippingCost: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
                  placeholder="Ej. 450"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Tarifas de Empaque */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Package2 size={18} className="text-[#d3121a]" /> Precios de Empaque Adicional (Fulfillment)
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Define el costo adicional cobrado según el empaque seleccionado
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(pricing.fulfillmentCosts || {}).map(([key, value]) => (
                <div key={key} className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    {PACKAGING_LABELS[key] || key}
                  </span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">RD$</span>
                    <input
                      type="number"
                      value={Number(value)}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          fulfillmentCosts: { ...pricing.fulfillmentCosts, [key]: Number(e.target.value) },
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 bg-white border border-[#E7E7EC] rounded-lg text-xs font-bold focus:outline-none focus:border-[#d3121a]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Beneficiarios y Reparto de Comisiones */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users size={18} className="text-[#d3121a]" /> Beneficiarios de Liquidación (Reglas de Comisión)
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Distribución del costo de envío entre participantes del sistema
              </p>
            </div>

            <div className="space-y-3">
              {(pricing.beneficiaries || []).map((ben: SettlementBeneficiary) => (
                <div key={ben.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold flex items-center justify-center text-xs">
                      {ben.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{ben.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ben.calculationType === 'fixed'
                          ? `Fijo: RD$${ben.fixedAmount}`
                          : `Porcentaje: ${ben.percentage}%`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBeneficiary(ben.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Beneficiary */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Nombre del beneficiario..."
                value={newBeneficiary.name}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                className="flex-1 min-w-[200px] bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#d3121a]"
              />
              <select
                value={newBeneficiary.calculationType}
                onChange={(e) => setNewBeneficiary({ ...newBeneficiary, calculationType: e.target.value as any })}
                className="bg-slate-50 border border-[#E7E7EC] rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="fixed">Monto Fijo (RD$)</option>
                <option value="percentage_of_shipping">Porcentaje del envío (%)</option>
              </select>
              {newBeneficiary.calculationType === 'fixed' ? (
                <input
                  type="number"
                  placeholder="Monto RD$"
                  value={newBeneficiary.fixedAmount}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, fixedAmount: Number(e.target.value) })}
                  className="w-28 bg-slate-50 border border-[#E7E7EC] rounded-xl px-3 py-2 text-xs font-semibold"
                />
              ) : (
                <input
                  type="number"
                  placeholder="Porcentaje %"
                  value={newBeneficiary.percentage}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, percentage: Number(e.target.value) })}
                  className="w-28 bg-slate-50 border border-[#E7E7EC] rounded-xl px-3 py-2 text-xs font-semibold"
                />
              )}
              <button
                onClick={handleAddBeneficiary}
                className="bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
          </section>

          {/* Save Footer */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 font-extrabold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#d3121a] hover:bg-[#b00f14] text-white shadow-red-100'
              }`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saving ? 'Guardando...' : saved ? '¡Configuración guardada!' : 'Guardar Todos los Cambios'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
